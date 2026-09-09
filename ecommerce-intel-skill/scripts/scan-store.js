#!/usr/bin/env node
/**
 * scan-store.js — skaner sklepu ecommerce (Ecommerce Store Intelligence).
 *
 * Użycie:
 *   node scan-store.js <url>                     — jeden sklep
 *   node scan-store.js --batch <lista.csv>       — cała lista (domyślnie 4 równolegle)
 *   node scan-store.js --batch <lista.csv> --concurrency 2
 *
 * Zwraca do output/<domena>/:
 *   store-data.json          — WSZYSTKIE fakty maszynowe (desktop + mobile + Shopify + kontekst WH)
 *   desktop-fold.png         — co widać bez scrolla na 1920×1080
 *   desktop-full.png         — cała strona, desktop
 *   mobile-fold.png          — co widać bez scrolla na 375×812
 *   mobile-full.png          — cała strona, mobile
 *   scan-error.txt           — (przy błędzie) powód
 *
 * CZEGO TEN SKRYPT NIE ROBI: nie ocenia. Zero interpretacji, zero scoringu.
 * store-data.json to warstwa OBSERVED. Interpretację (store-analysis.json) robi
 * Claude wg SKILL.md, a częstotliwości między sklepami liczy patterns.js.
 * Ten rozdział jest przeniesiony wprost z audytu kancelarii (content.json vs
 * audyt-dane.json) i jest tam sprawdzony — bez niego raport zbiorczy zamienia
 * się w halucynowane statystyki.
 *
 * KOSZT: zero. Cały skan to Playwright + darmowe endpointy Shopify — bez Firecrawl,
 * więc nie zjada limitu, którego potrzebuje produkcyjny audyt kancelarii.
 */

const fs = require('fs');
const path = require('path');
const { launchBrowser, withPage, captureScreenshots } = require('../../core/browser');
const { runPool } = require('../../core/batch');
const { parseCsv, domenaZ } = require('../../core/csv');
const { domProbe } = require('./extractors/dom-probe');
const { sygnatury, frazy, regexy, selektory, typySekcji } = require('./extractors/slowniki');

const OUT_BASE = process.env.ECOM_OUTPUT_DIR || path.join(__dirname, '..', 'output');
const CFG_SONDY = { sygnatury, frazy, regexy, selektory, typySekcji };

function katalogDla(url) {
  const d = path.join(OUT_BASE, domenaZ(url));
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/**
 * Darmowy endpoint Shopify: /products/<handle>.json.
 * Daje cenę, warianty, zdjęcia, opis i datę utworzenia produktu bez scrapowania
 * i bez kosztu. Działa na większości sklepów Shopify, o ile nie wyłączono go świadomie.
 */
async function sondaShopify(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const m = u.pathname.match(/\/products\/([^/?#]+)/);
  if (!m) return { dostepne: false, powod: 'URL nie jest stroną produktu' };

  const handle = m[1];
  const endpoint = `${u.origin}/products/${handle}.json`;
  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StoreIntel/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { dostepne: false, powod: `HTTP ${res.status}` };
    const json = await res.json();
    const p = json.product;
    if (!p) return { dostepne: false, powod: 'brak pola product' };

    const ceny = (p.variants || []).map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
    return {
      dostepne: true,
      handle: p.handle,
      tytul: p.title,
      typ: p.product_type || null,
      dostawca: p.vendor || null,
      tagi: p.tags || [],
      utworzony: p.created_at || null,
      zaktualizowany: p.updated_at || null,
      liczbaWariantow: (p.variants || []).length,
      cenaMin: ceny.length ? Math.min(...ceny) : null,
      cenaMax: ceny.length ? Math.max(...ceny) : null,
      // Nazwy opcji zdradzają mechanikę personalizacji (np. "Zdjęcie", "Imię", "Łańcuszek").
      opcje: (p.options || []).map((o) => ({ nazwa: o.name, liczbaWartosci: (o.values || []).length, wartosci: (o.values || []).slice(0, 12) })),
      liczbaZdjec: (p.images || []).length,
      dlugoscOpisuHtml: (p.body_html || '').length,
    };
  } catch (e) {
    return { dostepne: false, powod: e.message };
  }
}

/** Jeden sklep: dwa profile widoku + sonda Shopify + kontekst z listy wejściowej. */
async function skanujSklep(url, kontekst = {}) {
  const outDir = katalogDla(url);
  const browser = await launchBrowser();

  const dane = {
    url,
    domena: domenaZ(url),
    dataSkanu: new Date().toISOString().slice(0, 10),
    // Kontekst z listy wejściowej — m.in. sygnał reklamowy z WinningHuntera.
    // Trzymamy go w tym samym pliku, żeby patterns.js mógł ciąć wzorce po sile
    // sygnału paid: „co robią sklepy, które realnie wydają" ≠ „co robią wszystkie".
    kontekstRynkowy: kontekst,
    bledy: [],
  };

  try {
    // Desktop — sonda + zrzuty (fold i full osobno).
    try {
      dane.desktop = await withPage(browser, 'desktop', url, async (page) => {
        const probe = await page.evaluate(domProbe, CFG_SONDY);
        await captureScreenshots(page, outDir, 'desktop');
        return probe;
      });
    } catch (e) {
      dane.bledy.push({ etap: 'desktop', blad: e.message });
    }

    // Mobile — osobny przebieg, bo motywy renderują inny DOM pod inny viewport
    // (sticky ATC, zwinięte akordeony, inna kolejność sekcji). Jeden przebieg
    // z przeskalowanym viewportem tego nie odda.
    try {
      dane.mobile = await withPage(browser, 'mobile', url, async (page) => {
        const probe = await page.evaluate(domProbe, CFG_SONDY);
        await captureScreenshots(page, outDir, 'mobile');
        return probe;
      });
    } catch (e) {
      dane.bledy.push({ etap: 'mobile', blad: e.message });
    }
  } finally {
    await browser.close().catch(() => {});
  }

  dane.shopify = await sondaShopify(url);

  // Różnice desktop↔mobile — wyliczone tu, żeby nie liczyć ich w każdej analizie od nowa.
  if (dane.desktop && dane.mobile) {
    dane.roznicaDesktopMobile = {
      kolejnoscSekcjiIdentyczna:
        JSON.stringify(dane.desktop.kolejnoscSekcji) === JSON.stringify(dane.mobile.kolejnoscSekcji),
      sekcjeDesktop: dane.desktop.liczbaSekcji,
      sekcjeMobile: dane.mobile.liczbaSekcji,
      atcNadZgieciemDesktop: dane.desktop.atcNadZgieciem,
      atcNadZgieciemMobile: dane.mobile.atcNadZgieciem,
      cenaNadZgieciemDesktop: dane.desktop.cenaNadZgieciem,
      cenaNadZgieciemMobile: dane.mobile.cenaNadZgieciem,
      ekranowDesktop: dane.desktop.strona.ekranow,
      ekranowMobile: dane.mobile.strona.ekranow,
    };
  }

  fs.writeFileSync(path.join(outDir, 'store-data.json'), JSON.stringify(dane, null, 2), 'utf8');
  return dane;
}

// ── Podsumowanie do konsoli — jednolinijkowy sanity-check po każdym sklepie ──
function podsumuj(d) {
  const D = d.desktop || {};
  const M = d.mobile || {};
  const czesci = [
    `${D.liczbaSekcji ?? '?'} sekcji`,
    `cena nad zgięciem: ${D.cenaNadZgieciem ? 'tak' : 'nie'}`,
    `ATC nad zgięciem: ${D.atcNadZgieciem ? 'tak' : 'nie'}`,
    `sticky ATC mobile: ${M.atcSticky ? 'tak' : 'nie'}`,
    `upload na PDP: ${D.personalizacja?.uploadNaPdp ? 'tak' : 'nie'}`,
    `podgląd do akceptacji: ${D.personalizacja?.obiecujePodgladDoAkceptacji ? 'tak' : 'nie'}`,
  ];
  const apki = [...(D.aplikacje?.opinie || []), ...(D.aplikacje?.personalizacja || [])];
  if (apki.length) czesci.push(`apki: ${apki.join('/')}`);
  return czesci.join(', ');
}

// ── Dispatch ─────────────────────────────────────────────────────────
(async () => {
  const arg1 = process.argv[2];
  if (!arg1) {
    console.error('Użycie:\n  node scan-store.js <url>\n  node scan-store.js --batch <lista.csv> [--concurrency N]');
    process.exit(1);
  }

  if (arg1 === '--batch') {
    const csvPath = process.argv[3];
    if (!csvPath) { console.error('Użycie: node scan-store.js --batch <lista.csv>'); process.exit(1); }
    const idx = process.argv.indexOf('--concurrency');
    const concurrency = idx > -1 ? Number(process.argv[idx + 1]) || 4 : 4;

    const { wiersze } = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const doSkanu = wiersze.filter((w) => w.url);
    if (!doSkanu.length) { console.error('CSV bez kolumny url albo pusty.'); process.exit(1); }

    console.log(`Skanuję ${doSkanu.length} sklepów, ${concurrency} równolegle. Koszt API: 0 (sam Playwright).\n`);

    const { ok, failed } = await runPool(
      doSkanu,
      async (wiersz) => skanujSklep(wiersz.url, wiersz),
      {
        concurrency,
        onStart: (w, n, total) => console.log(`[${n}/${total}] ${w.nazwa || w.url}`),
        onOk: (w, n, total, wynik) => console.log(`    ✓ [${n}/${total}] ${w.nazwa || w.url} — ${podsumuj(wynik)}`),
        onError: (w, n, total, e) => {
          console.error(`    ✗ [${n}/${total}] ${w.nazwa || w.url} — ${e.message}`);
          try { fs.writeFileSync(path.join(katalogDla(w.url), 'scan-error.txt'), e.message); } catch (_) { /* zła domena */ }
        },
      }
    );

    console.log(`\nGotowe: ${ok.length} OK, ${failed.length} błędów.`);
    console.log('Dalej: node patterns.js  → output/_patterns.json (częstotliwości między sklepami)');
    console.log('Potem: Claude czyta store-data.json + zrzuty i pisze store-analysis.json per sklep (SKILL.md).');
    return;
  }

  const url = /^https?:\/\//i.test(arg1) ? arg1 : 'https://' + arg1;
  console.log(`Skanuję: ${url}`);
  try {
    const dane = await skanujSklep(url);
    console.log(`    ✓ ${podsumuj(dane)}`);
    if (dane.bledy.length) dane.bledy.forEach((b) => console.log(`    ⚠ ${b.etap}: ${b.blad}`));
    console.log(`\nGotowe → output/${dane.domena}/`);
  } catch (e) {
    console.error('    ✗ Błąd skanu:', e.message);
    process.exit(1);
  }
})();
