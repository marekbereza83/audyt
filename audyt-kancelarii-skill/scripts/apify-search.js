#!/usr/bin/env node
/**
 * apify-search.js — wyszukiwanie kancelarii przez Apify (Google Maps Extractor).
 *
 * Etap 1 pipeline'u prospectingu. Kolejne bramki są coraz droższe, więc każda dostaje
 * mniej rekordów niż poprzednia:
 *
 *   1. apify-search.js   (tanie, ~$4/1000 wyników)   → surowe firmy
 *   2. dedup-gate.js     (DARMOWE)                   → odsiew znanych z arkusza
 *   3. scrape.js --peek-batch (DARMOWE, Playwright)  → triage wizualny
 *   4. scrape.js --batch (DROGIE, budżet Firecrawl)  → pełny audyt
 *
 * Strategia: WYCZERPUJEMY MIASTO, nie skimujemy wiele miast.
 * Google Maps sortuje wyniki wg jakości profilu — zadbane kancelarie (opinie, aktualna strona)
 * są na górze, zaniedbane siedzą głębiej. Płytki scrape wielu miast zbiera więc systematycznie
 * najgorszy materiał pod ten produkt: same firmy, które nowej strony nie potrzebują.
 * Dlatego jedno miasto × kilka fraz × wysoki limit, a potem `przeszukane.csv` mówi, czy wrócić.
 *
 * Użycie:
 *   node apify-search.js --miasto "Katowice" --max 200
 *       → sam KOSZTORYS wyczerpania miasta (wszystkie frazy z FRAZY), nic nie płaci
 *
 *   node apify-search.js --miasto "Katowice" --max 200 --tak
 *       → uruchamia aktora (PŁATNE), zapisuje dataset i wpis w przeszukane.csv
 *
 *   node apify-search.js --query "własna fraza" --gdzie "Katowice" --max 100 [--tak]
 *       → pojedyncze zapytanie, gdy chcesz czegoś spoza standardowych fraz
 *
 *   node apify-search.js --dataset <datasetId>
 *       → pobiera GOTOWY dataset z konta, bez ponownego uruchamiania aktora (bez kosztu)
 *
 *   node apify-search.js --runy
 *       → ostatnie uruchomienia na koncie: id datasetu, liczba wyników, realny koszt
 *
 * Flaga `--tak` jest celowa: bez niej skrypt nigdy nie wyda ani centa. Dzięki temu każdy
 * płatny przebieg widać wprost w treści komendy, a nie w domyślnym zachowaniu.
 *
 * Wymaga APIFY_TOKEN w scripts/.env (Apify Console → Settings → API & Integrations).
 */

require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.APIFY_TOKEN;
const AKTOR = process.env.APIFY_AKTOR || 'compass~google-maps-extractor';
const API = 'https://api.apify.com/v2';

// Stawka Google Maps Extractor (pay-per-result). Orientacyjna — realny koszt przebiegu
// czytamy po jego zakończeniu z `usageTotalUsd`, ta liczba służy tylko do kosztorysu z góry.
const USD_ZA_1000 = Number(process.env.APIFY_USD_ZA_1000 || 4);

const OUT_BASE = process.env.AUDYT_OUTPUT_DIR || path.join(__dirname, '..', 'output');
const OUT_APIFY = path.join(OUT_BASE, 'apify');

/**
 * Frazy do wyczerpania miasta. Celowo się zazębiają — Google zwraca dla każdej inny wycinek
 * i dopiero suma daje pokrycie. Poprzedni scrape używał tylko dwóch pierwszych i przez to
 * pomijał kancelarie, które opisują się jako „prawnik" albo „kancelaria prawna".
 */
const FRAZY = [
  'kancelaria adwokacka',
  'kancelaria radcy prawnego',
  'adwokat',
  'radca prawny',
  'kancelaria prawna',
];

// Ślad pokrycia — WERSJONOWANY (nie w output/, bo output/ jest gitignorowany i nie jeździ
// między komputerami). Odpowiada na pytanie „czy to miasto jest już wyczerpane".
const PLIK_PRZESZUKANE = path.join(__dirname, 'przeszukane.csv');

// ── Argumenty ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flaga(nazwa) {
  const i = args.indexOf('--' + nazwa);
  return i >= 0 && i + 1 < args.length && !args[i + 1].startsWith('--') ? args[i + 1] : null;
}
const ma = n => args.includes('--' + n);

const query = flaga('query');
const gdzie = flaga('gdzie');
const miasto = flaga('miasto');
const max = Number(flaga('max') || 100);
const datasetId = flaga('dataset');
const potwierdzone = ma('tak');

/** Zapytania do wysłania: tryb --miasto rozwija wszystkie frazy, tryb --query bierze jedną. */
function zapytania() {
  if (miasto) return FRAZY.map(f => `${f} ${miasto}`);
  return [gdzie ? `${query} ${gdzie}` : query];
}

function wymagajToken() {
  if (!TOKEN) {
    console.error('Brak APIFY_TOKEN w scripts/.env');
    console.error('Apify Console → Settings → API & Integrations → Personal API token');
    process.exit(1);
  }
}

// ── API ──────────────────────────────────────────────────────────────

async function apify(sciezka, opcje = {}) {
  const url = `${API}${sciezka}${sciezka.includes('?') ? '&' : '?'}token=${TOKEN}`;
  const res = await fetch(url, opcje);
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { throw new Error(`Apify zwróciło nie-JSON (${res.status}): ${txt.slice(0, 200)}`); }
  if (!res.ok) throw new Error(`Apify ${res.status}: ${json.error ? json.error.message : txt.slice(0, 200)}`);
  return json.data !== undefined ? json.data : json;
}

const pauza = ms => new Promise(r => setTimeout(r, ms));

// ── Tryby ────────────────────────────────────────────────────────────

/** Ostatnie uruchomienia — żeby nie płacić drugi raz za dane, które już są na koncie. */
async function pokazRuny() {
  const d = await apify('/actor-runs?limit=15&desc=true');
  const runy = d.items || [];
  if (!runy.length) return console.log('Brak uruchomień na koncie.');

  console.log('\nOstatnie uruchomienia:\n');
  for (const r of runy) {
    const koszt = r.usageTotalUsd != null ? `$${Number(r.usageTotalUsd).toFixed(3)}` : '—';
    const data = String(r.startedAt || '').slice(0, 16).replace('T', ' ');
    console.log(`  ${data}  ${String(r.status).padEnd(9)}  koszt ${koszt.padStart(8)}  dataset: ${r.defaultDatasetId || '—'}`);
  }
  console.log('\nPobranie bez ponownego kosztu:  node apify-search.js --dataset <datasetId>\n');
}

/** Pobiera gotowy dataset — nic nie kosztuje, aktor się nie uruchamia. */
async function pobierzDataset(id) {
  console.log(`Pobieram dataset ${id} (bez uruchamiania aktora — bez kosztu)…`);
  const items = await apify(`/datasets/${id}/items?clean=true&format=json&limit=10000`);
  if (!Array.isArray(items)) throw new Error('Dataset nie zwrócił tablicy.');
  return zapisz(items, `dataset-${id}`);
}

function zapisz(items, slug) {
  fs.mkdirSync(OUT_APIFY, { recursive: true });
  const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const plik = path.join(OUT_APIFY, `${stempel}-${slug}.json`);
  fs.writeFileSync(plik, JSON.stringify(items, null, 1), 'utf8');

  const zWww = items.filter(x => x.website).length;
  const zamkniete = items.filter(x => x.permanentlyClosed).length;
  console.log(`\n✓ ${items.length} rekordów → ${path.relative(process.cwd(), plik)}`);
  console.log(`  z adresem www: ${zWww}   zamkniętych: ${zamkniete}`);
  console.log(`\nDalej (darmowe):  node dedup-gate.js "${path.relative(process.cwd(), plik)}"\n`);
  return plik;
}

/** Kosztorys — zawsze pokazywany przed uruchomieniem. */
function kosztorys() {
  const q = zapytania();
  // Limit działa NA ZAPYTANIE, więc sufit kosztu to iloczyn. Realnie wyjdzie mniej:
  // frazy się zazębiają, a Google i tak rzadko oddaje pełne `max` na zapytanie.
  const sufit = q.length * max;
  const usd = (sufit / 1000) * USD_ZA_1000;
  console.log('\n── Kosztorys ─────────────────────────────');
  console.log(`  aktor:     ${AKTOR}`);
  if (miasto) {
    console.log(`  miasto:    ${miasto}  (tryb: wyczerpanie)`);
    console.log(`  frazy:     ${q.length} — ${FRAZY.join(', ')}`);
  } else {
    console.log(`  fraza:     "${q[0]}"`);
  }
  console.log(`  max:       ${max} na zapytanie → sufit ${sufit} wyników`);
  console.log(`  stawka:    $${USD_ZA_1000} / 1000 wyników (orientacyjna)`);
  console.log(`  szacunek:  do ~$${usd.toFixed(2)} (realnie mniej — frazy się zazębiają)`);
  console.log('──────────────────────────────────────────');
  return usd;
}

/** Dopisuje wpis do przeszukane.csv — ślad pokrycia, wersjonowany w repo. */
function zapiszPrzeszukane({ miasto: m, frazy, dataset, wynikow, koszt }) {
  const NAGLOWEK = 'miasto;frazy;data;dataset_id;wynikow;koszt_usd';
  const esc = v => {
    const s = String(v == null ? '' : v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const wiersz = [m, frazy.join(' | '), new Date().toISOString().slice(0, 10), dataset, wynikow, koszt]
    .map(esc).join(';') + '\r\n';

  if (!fs.existsSync(PLIK_PRZESZUKANE)) {
    fs.writeFileSync(PLIK_PRZESZUKANE, '﻿' + NAGLOWEK + '\r\n' + wiersz, 'utf8');
  } else {
    fs.appendFileSync(PLIK_PRZESZUKANE, wiersz, 'utf8');
  }
  console.log(`  ślad pokrycia → scripts/${path.basename(PLIK_PRZESZUKANE)}`);
}

async function uruchom() {
  const q = zapytania();
  const wejscie = {
    searchStringsArray: q,
    maxCrawledPlacesPerSearch: max,
    language: 'pl',
    skipClosedPlaces: true,        // zamknięte i tak odpadają w dedup-gate — nie płaćmy za nie
    scrapePlaceDetailPage: false,  // nie potrzebujemy szczegółów, tylko www/telefon/nazwa
  };
  // W trybie --miasto nazwa miasta siedzi już w każdej frazie; locationQuery tylko przy --gdzie.
  if (!miasto && gdzie) wejscie.locationQuery = gdzie;

  console.log('\nUruchamiam aktora (PŁATNE)…');
  const run = await apify(`/acts/${AKTOR}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wejscie),
  });

  console.log(`  run: ${run.id}   status: ${run.status}`);
  process.stdout.write('  czekam');

  let stan = run;
  const start = Date.now();
  const LIMIT_MS = 20 * 60 * 1000;
  while (['READY', 'RUNNING'].includes(stan.status)) {
    if (Date.now() - start > LIMIT_MS) {
      console.log('\n✗ Przekroczono 20 min. Run leci dalej po stronie Apify — sprawdź:');
      console.log(`  node apify-search.js --runy`);
      process.exit(1);
    }
    await pauza(10000);
    process.stdout.write('.');
    stan = await apify(`/actor-runs/${stan.id}`);
  }
  console.log('');

  if (stan.status !== 'SUCCEEDED') {
    console.error(`✗ Run zakończył się statusem ${stan.status}`);
    if (stan.statusMessage) console.error(`  ${stan.statusMessage}`);
    process.exit(1);
  }

  const koszt = stan.usageTotalUsd != null ? `$${Number(stan.usageTotalUsd).toFixed(3)}` : 'nieznany';
  console.log(`✓ Zakończone. Realny koszt: ${koszt}`);

  const items = await apify(`/datasets/${stan.defaultDatasetId}/items?clean=true&format=json&limit=10000`);
  const slug = (miasto || query || 'szukaj').toLowerCase()
    .replace(/[ąćęłńóśźż]/g, c => 'acelnoszz'['ąćęłńóśźż'.indexOf(c)])
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

  zapiszPrzeszukane({
    miasto: miasto || gdzie || '(bez miasta)',
    frazy: miasto ? FRAZY : [query],
    dataset: stan.defaultDatasetId,
    wynikow: items.length,
    koszt: stan.usageTotalUsd != null ? Number(stan.usageTotalUsd).toFixed(3) : '',
  });

  return zapisz(items, slug);
}

// ── Main ─────────────────────────────────────────────────────────────

(async () => {
  try {
    if (ma('runy')) { wymagajToken(); return await pokazRuny(); }
    if (datasetId)  { wymagajToken(); return void await pobierzDataset(datasetId); }

    if (!query && !miasto) {
      console.error('Użycie:');
      console.error('  node apify-search.js --miasto "Katowice" --max 200            (kosztorys wyczerpania miasta)');
      console.error('  node apify-search.js --miasto "Katowice" --max 200 --tak      (uruchom, PŁATNE)');
      console.error('  node apify-search.js --query "fraza" --gdzie "Miasto" --max 100 [--tak]');
      console.error('  node apify-search.js --dataset <datasetId>                    (pobierz gotowy, za darmo)');
      console.error('  node apify-search.js --runy                                   (ostatnie uruchomienia)');
      process.exit(1);
    }

    wymagajToken();
    kosztorys();

    if (!potwierdzone) {
      console.log('\nTo był tylko kosztorys — nic nie uruchomiono i nic nie zapłacono.');
      console.log('Żeby naprawdę uruchomić, dodaj --tak\n');
      return;
    }
    await uruchom();
  } catch (e) {
    console.error('\n✗ ' + e.message);
    process.exit(1);
  }
})();
