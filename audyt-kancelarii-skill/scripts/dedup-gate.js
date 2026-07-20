#!/usr/bin/env node
/**
 * dedup-gate.js — DARMOWA bramka między Apify a audytem.
 *
 * Odsiewa wszystko, za co nie ma sensu płacić, ZANIM ruszy scrape. Do tej pory sprawdzenie
 * względem Trackera robił dopiero webhook — przy zapisie, czyli po spaleniu ~5 wywołań
 * Firecrawl na kancelarię, która i tak zostałaby odrzucona jako duplikat.
 *
 * Odsiewa:
 *   1. brak / niepoprawny adres www
 *   2. firma trwale zamknięta (permanentlyClosed)
 *   3. duplikat wewnątrz samego wejścia (domena / telefon / placeId)
 *   4. duplikat względem arkusza — „Tracker" + „Claude_import" (klucze z webhooka)
 *   5. kancelaria już zaudytowana lokalnie (istnieje output/<domena>/audyt-dane.json)
 *   6. kancelaria już odrzucona wcześniej (output/odrzucone.csv)
 *
 * Użycie:
 *   node dedup-gate.js <dataset.json|lista.csv> [--out <plik.csv>] [--offline]
 *
 *   --offline  pomija odpytanie arkusza (punkt 4). Do pracy bez sieci — ale wtedy
 *              duplikaty względem Trackera wyjdą dopiero przy zapisie, już po koszcie.
 *
 * Wyjście:
 *   output/do-peek.csv          — rozszerzony CSV gotowy dla `scrape.js --peek-batch`
 *   output/dedup-pominiete.csv  — co odpadło i dlaczego (do wglądu, nie do audytu)
 */

require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');

const { buildCsv, domainOf, ensureScheme, parseLeadsCsv } = require('./csv-utils');
const { kluczeRekordu, pobierzKlucze, normDomena } = require('./sheet-keys');

/**
 * Nazwa katalogu output/ → domena porównywalna z kluczem dedupu.
 *
 * `domainOf()` produkuje NAZWĘ KATALOGU, nie klucz: zostawia `www.` i koduje ścieżkę jako `_`
 * (`http://www.x.pl/kontakt` → `www.x.pl_kontakt`). Porównywanie takich nazw wprost przepuszcza
 * tę samą kancelarię pod innym URL-em, dlatego obie strony sprowadzamy do `normDomena`.
 * Podkreślenie nie występuje w nazwach hostów, więc pierwszy segment przed `_` to zawsze domena.
 */
function domenaZKatalogu(nazwa) {
  return normDomena(String(nazwa || '').split('_')[0]);
}

const OUT_BASE = process.env.AUDYT_OUTPUT_DIR || path.join(__dirname, '..', 'output');
const SEP = ';';

const args = process.argv.slice(2);
const plikWe = args.find(a => !a.startsWith('--'));
const offline = args.includes('--offline');
const outFlag = (() => {
  const i = args.indexOf('--out');
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
})();

if (!plikWe) {
  console.error('Użycie: node dedup-gate.js <dataset.json|lista.csv> [--out <plik.csv>] [--offline]');
  process.exit(1);
}
if (!fs.existsSync(plikWe)) {
  console.error(`Nie ma pliku: ${plikWe}`);
  process.exit(1);
}

// ── Wczytanie wejścia (dataset Apify albo CSV) ───────────────────────

/** Rekord Apify → wspólny kształt leada. */
function zApify(r) {
  return {
    nazwa: r.title || '',
    miasto: r.city || null,
    url: r.website || '',
    telefon: r.phoneUnformatted || r.phone || null,
    email: null,                       // Google Maps nie podaje maila — dociąga go scraper z /kontakt
    placeId: r.placeId || null,
    permanentlyClosed: !!(r.permanentlyClosed || r.temporarilyClosed),
    totalScore: r.totalScore ?? null,
    reviewsCount: r.reviewsCount ?? null,
    categories: Array.isArray(r.categories) ? r.categories : (r.categoryName ? [r.categoryName] : []),
  };
}

function wczytaj(plik) {
  const raw = fs.readFileSync(plik, 'utf8');
  if (plik.toLowerCase().endsWith('.json')) {
    const d = JSON.parse(raw);
    if (!Array.isArray(d)) throw new Error('JSON nie jest tablicą rekordów.');
    return d.map(zApify);
  }
  const { leads } = parseLeadsCsv(raw);
  return leads.map(l => ({ ...l, url: l.url || '' }));
}

// ── Lokalne źródła wiedzy ────────────────────────────────────────────

/** Znormalizowane domeny już zaudytowane — katalog output/<domena>/ z audyt-dane.json. */
function juzZaudytowane() {
  const zbior = new Set();
  if (!fs.existsSync(OUT_BASE)) return zbior;
  for (const wpis of fs.readdirSync(OUT_BASE, { withFileTypes: true })) {
    if (!wpis.isDirectory()) continue;
    if (!fs.existsSync(path.join(OUT_BASE, wpis.name, 'audyt-dane.json'))) continue;
    const d = domenaZKatalogu(wpis.name);
    if (d) zbior.add(d);
  }
  return zbior;
}

/** Znormalizowane domeny z output/odrzucone.csv (log-odrzucone.js) — nie audytujemy drugi raz. */
function juzOdrzucone() {
  const zbior = new Map(); // znormalizowana domena → scoring
  const plik = path.join(OUT_BASE, 'odrzucone.csv');
  if (!fs.existsSync(plik)) return zbior;
  const linie = fs.readFileSync(plik, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  for (const l of linie.slice(1)) {
    const [domena, scoring] = l.split(SEP);
    const d = domenaZKatalogu(domena);
    if (d) zbior.set(d, (scoring || '').trim());
  }
  return zbior;
}

// ── Bramka ───────────────────────────────────────────────────────────

(async () => {
  const leady = wczytaj(plikWe);
  console.log(`\nWejście: ${leady.length} rekordów z ${path.basename(plikWe)}`);

  let kluczeArkusza = new Set();
  if (offline) {
    console.log('⚠ --offline: pomijam sprawdzenie względem arkusza (duplikaty wyjdą dopiero przy zapisie).');
  } else {
    process.stdout.write('Pobieram klucze dedupu z arkusza… ');
    kluczeArkusza = await pobierzKlucze();
    console.log(`${kluczeArkusza.size} kluczy (Tracker + Claude_import)`);
  }

  const zaudytowane = juzZaudytowane();
  const odrzucone = juzOdrzucone();
  if (zaudytowane.size) console.log(`Lokalnie zaudytowanych: ${zaudytowane.size}`);
  if (odrzucone.size) console.log(`Wcześniej odrzuconych:   ${odrzucone.size}`);

  const przeszly = [];
  const pominiete = [];
  const widzianeDomeny = new Set();
  const widzianeTelefony = new Set();
  const widzianePlaceId = new Set();

  for (const lead of leady) {
    const url = ensureScheme(lead.url || '');
    const domena = url ? domainOf(url) : '';
    const odrzuc = powod => pominiete.push({ lead, powod });

    if (!url || !/\./.test(domena)) { odrzuc('brak poprawnego adresu www'); continue; }
    if (lead.permanentlyClosed)     { odrzuc('firma zamknięta'); continue; }

    // 3 — duplikat w obrębie wejścia
    const klucze = kluczeRekordu({ www: url, tel: lead.telefon, email: lead.email });
    const kDomena = klucze.find(k => k.startsWith('d:'));
    const kTel = klucze.find(k => k.startsWith('t:'));

    if (kDomena && widzianeDomeny.has(kDomena)) { odrzuc('duplikat w paczce (domena)'); continue; }
    if (lead.placeId && widzianePlaceId.has(lead.placeId)) { odrzuc('duplikat w paczce (placeId)'); continue; }
    if (kTel && widzianeTelefony.has(kTel)) { odrzuc('duplikat w paczce (telefon)'); continue; }

    // 4 — duplikat względem arkusza
    const kolizja = klucze.find(k => kluczeArkusza.has(k));
    if (kolizja) { odrzuc(`już w arkuszu (${kolizja.slice(0, 2) === 'e:' ? 'email' : kolizja.slice(0, 2) === 't:' ? 'telefon' : 'domena'})`); continue; }

    // 5 / 6 — wiedza lokalna (po znormalizowanej domenie, nie po nazwie katalogu)
    const dNorm = normDomena(url);
    if (dNorm && zaudytowane.has(dNorm)) { odrzuc('już zaudytowana lokalnie'); continue; }
    if (dNorm && odrzucone.has(dNorm)) { odrzuc(`odrzucona wcześniej (${odrzucone.get(dNorm)}/8)`); continue; }

    if (kDomena) widzianeDomeny.add(kDomena);
    if (kTel) widzianeTelefony.add(kTel);
    if (lead.placeId) widzianePlaceId.add(lead.placeId);
    przeszly.push({ ...lead, url });
  }

  // ── Zapis ──────────────────────────────────────────────────────────

  fs.mkdirSync(OUT_BASE, { recursive: true });

  const NAGLOWEK = ['nazwa', 'miasto', 'url', 'telefon', 'email', 'placeId', 'totalScore', 'reviewsCount', 'categories'];
  const wiersze = przeszly.map(l => [
    l.nazwa, l.miasto || '', l.url, l.telefon || '', l.email || '',
    l.placeId || '', l.totalScore ?? '', l.reviewsCount ?? '', (l.categories || []).join('|'),
  ]);
  const outPath = outFlag ? path.resolve(outFlag) : path.join(OUT_BASE, 'do-peek.csv');
  fs.writeFileSync(outPath, buildCsv(NAGLOWEK, wiersze, SEP), 'utf8');

  if (pominiete.length) {
    const rows = pominiete.map(p => [p.lead.nazwa || '', p.lead.url || '', p.lead.miasto || '', p.powod]);
    fs.writeFileSync(
      path.join(OUT_BASE, 'dedup-pominiete.csv'),
      buildCsv(['nazwa', 'url', 'miasto', 'powod'], rows, SEP), 'utf8'
    );
  }

  // ── Podsumowanie ───────────────────────────────────────────────────

  const wgPowodu = {};
  for (const p of pominiete) {
    const grupa = p.powod.replace(/ \(.*\)$/, '').replace(/^odrzucona wcześniej.*/, 'odrzucona wcześniej');
    wgPowodu[grupa] = (wgPowodu[grupa] || 0) + 1;
  }

  console.log('\n── Bramka dedupu ─────────────────────────');
  console.log(`  weszło:      ${leady.length}`);
  console.log(`  odpadło:     ${pominiete.length}`);
  for (const [powod, n] of Object.entries(wgPowodu).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(n).padStart(4)}  ${powod}`);
  }
  console.log(`  przeszło:    ${przeszly.length}`);
  console.log('──────────────────────────────────────────');
  console.log(`\n→ ${path.relative(process.cwd(), outPath)}`);
  if (pominiete.length) console.log(`→ ${path.relative(process.cwd(), path.join(OUT_BASE, 'dedup-pominiete.csv'))}`);

  if (przeszly.length) {
    console.log(`\nDalej (darmowe, sam Playwright):`);
    console.log(`  node scrape.js --peek-batch "${path.relative(process.cwd(), outPath)}"\n`);
  } else {
    console.log('\nNic nie przeszło — nie ma czego audytować.\n');
  }
})().catch(e => {
  console.error('\n✗ ' + e.message);
  process.exit(1);
});
