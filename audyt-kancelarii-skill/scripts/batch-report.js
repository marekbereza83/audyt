#!/usr/bin/env node
/**
 * batch-report.js — zbiera wyniki audytów wsadowych do lokalnych CSV.
 * Użycie: node batch-report.js <lista.csv>     (ten sam CSV co `scrape.js --batch`;
 *                                               format legacy nazwa,url lub rozszerzony)
 *
 * PODZIAŁ ODPOWIEDZIALNOŚCI: Claude (ten pipeline) robi wyłącznie prospecting + kwalifikację.
 * Żadna kolumna tego raportu nie zawiera tematu ani treści maila — `obserwacja_do_maila` to
 * krótki fakt, materiał wejściowy dla drugiej automatyzacji (ChatGPT), nie gotowy mail.
 *
 * Dla każdej kancelarii z CSV czyta output/<domena>/:
 *   - audyt-dane.json      → kwalifikacja leada (A/B/C/D, decyzja), score audytu, obserwacja
 *   - lead-info.json       → identyfikacja, status operacyjny, blokada kontaktu (tryb batch)
 *   - mail-observation.txt → obserwacja do maila (mail-fragment.txt = legacy alias, fallback)
 *   - scrape-error.txt     → (gdy strona zawiodła) powód — trafia do batch-nieudane.csv
 *
 * Wyniki (wszystkie: separator ';', BOM UTF-8, CRLF — polski Excel):
 *
 *   output/batch-leady.csv      — GŁÓWNY raport. Sortowanie: PISAĆ → ODPUŚCIĆ → wstępne/do
 *     ponownego audytu; w ramach decyzji scoring malejąco, potem potrzeba_przebudowy i
 *     potencjal_finansowy malejąco. NIE sortujemy leadów po score_audytu_0_100 — jakość
 *     strony to nie jest prawdopodobieństwo zakupu.
 *
 *   output/batch-pominiete.csv  — rekordy wykluczone: do_not_contact / status blokujący,
 *     firmy zamknięte, duplikaty (domena/telefon/placeId), brak poprawnego URL.
 *
 *   output/batch-nieudane.csv   — nieudane scrapy (do ręcznej weryfikacji, nie ponawia).
 *
 *   output/batch-fragments.csv  — zgodność wsteczna (nazwa,url,score,priorytet_glowny,
 *     fragment_do_maila) — NIE jest głównym wynikiem.
 *
 * Rodzynki 7–8/8 (PISAĆ) do arkusza `Claude_import` (status_importu: NOWY) wysyła osobno
 * push-import.js — ten skrypt tylko raportuje lokalnie. Po imporcie dalszy ciąg (weryfikacja,
 * treść maila, szkic Gmail, wysyłka) jest poza tym repo.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  domainOf, parseLeadsCsv, isContactBlocked, buildCsv,
  normalizeDomain, normalizePhone,
} = require('./csv-utils');

const OUT_BASE = process.env.AUDYT_OUTPUT_DIR || path.join(__dirname, '..', 'output');
const SEP = ';';

const csvPath = process.argv[2];
if (!csvPath) { console.error('Użycie: node batch-report.js <lista.csv>'); process.exit(1); }

// ── helpery ───────────────────────────────────────────────────────────
function czytajJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// Główny priorytet audytu (zgodność wsteczna dla batch-fragments.csv).
function priorytetGlowny(dane) {
  const dims = Array.isArray(dane.wymiary) ? dane.wymiary : [];
  const byWaga = (a, b) => (b.waga || 0) - (a.waga || 0);
  const brak = dims.filter(d => d.status === 'brak').sort(byWaga);
  if (brak.length) return brak[0].wymiar;
  const slabe = dims.filter(d => d.status === 'do-poprawy').sort(byWaga);
  if (slabe.length) return slabe[0].wymiar;
  return 'brak krytycznych — strona w dobrym stanie';
}

// Skróć komunikat błędu scrape do jednej czytelnej linii.
function skrocBladScrape(tekst) {
  if (!tekst) return 'nieznany błąd';
  if (/408|timeout|timed out/i.test(tekst)) return 'timeout — strona wolna lub ciężka';
  if (/404|not found/i.test(tekst)) return '404 — strona niedostępna';
  if (/403|forbidden/i.test(tekst)) return '403 — dostęp zablokowany';
  if (/ECONNREFUSED|connection refused/i.test(tekst)) return 'brak połączenia z serwerem';
  return tekst.split('\n')[0].replace(/^Failed to scrape URL\.\s*/i, '').slice(0, 120);
}

// Ta sama logika pomijania co w scrape.js (filterLeadsForScrape) — odtwarzana tu,
// żeby batch-pominiete.csv objął też rekordy, których scrape nigdy nie dotknął.
function podzielLeady(leads) {
  const doRaportu = [];
  const pominiete = [];
  const seenDomains = new Set();
  const seenPhones = new Set();
  const seenPlaceIds = new Set();

  for (const lead of leads) {
    const domain = normalizeDomain(lead.url);
    if (!lead.url || !domain || !/\./.test(domain)) { pominiete.push({ lead, powod: 'brak poprawnego URL' }); continue; }
    if (lead.permanentlyClosed) { pominiete.push({ lead, powod: 'firma zamknięta (permanentlyClosed)' }); continue; }
    const phone = normalizePhone(lead.telefon);
    if (seenDomains.has(domain)) { pominiete.push({ lead, powod: 'duplikat (domena)' }); continue; }
    if (lead.placeId && seenPlaceIds.has(lead.placeId)) { pominiete.push({ lead, powod: 'duplikat (placeId)' }); continue; }
    if (phone && seenPhones.has(phone)) { pominiete.push({ lead, powod: 'duplikat (telefon)' }); continue; }
    seenDomains.add(domain);
    if (lead.placeId) seenPlaceIds.add(lead.placeId);
    if (phone) seenPhones.add(phone);

    // Blokada kontaktu: lead audytowalny, ale bez maila — trafia do OBU plików
    // (batch-pominiete.csv z powodem + batch-leady.csv z powod_pominiecia).
    const block = isContactBlocked(lead);
    if (block.blocked) pominiete.push({ lead, powod: 'blokada kontaktu: ' + block.reason });
    doRaportu.push({ lead, blokada: block.blocked ? block.reason : null });
  }
  return { doRaportu, pominiete };
}

// ── zbieranie ────────────────────────────────────────────────────────
const { leads } = parseLeadsCsv(fs.readFileSync(csvPath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const { doRaportu, pominiete } = podzielLeady(leads);

const NAGLOWKI = [
  'lead_id', 'nazwa', 'miasto', 'url', 'telefon', 'email', 'imie_kontaktowe',
  'priorytet_wizualny', 'decyzja', 'scoring_0_8', 'glowny_problem', 'obserwacja_do_maila',
  'powod_biznesowy', 'zrodlo_audytu', 'data_audytu',
  'status_sugerowany', 'score_audytu_0_100', 'tier_audytu', 'pewnosc_oceny',
  'mocne_przeslanki', 'co_jest_kosmetyka', 'powod_pominiecia',
];

const wiersze = [];      // { sortKey: {bucket, razem, A, B}, cols: [...] }
const nieudane = [];
const fragmenty = [];    // zgodność wsteczna

for (const { lead, blokada } of doRaportu) {
  const dir = path.join(OUT_BASE, domainOf(lead.url));
  const dane = czytajJson(path.join(dir, 'audyt-dane.json'));
  const leadInfo = czytajJson(path.join(dir, 'lead-info.json'));
  const errPath = path.join(dir, 'scrape-error.txt');

  // ── błąd scrape / brak danych ────────────────────────────────────
  if (!dane) {
    const powodBledu = fs.existsSync(errPath)
      ? skrocBladScrape(fs.readFileSync(errPath, 'utf8').trim())
      : 'brak danych audytu — scrape nie wykonany lub nieudany';
    nieudane.push([lead.nazwa, lead.url, powodBledu, today]);
    continue;
  }

  // ── warstwy danych: audyt-dane > lead-info > wiersz CSV ─────────
  const k = dane.kwalifikacja_leada || null;
  const s = (k && k.scoring_0_8) || {};
  const staraWersja = !k;

  const razem = Number.isInteger(s.razem) ? s.razem : null;
  const pkt = (nazwa) => (s[nazwa] && Number.isInteger(s[nazwa].punkty) ? s[nazwa].punkty : null);

  const pewnosc = staraWersja ? 'stary schemat — do ponownego audytu' : (k.pewnosc_oceny || '');
  const wstepna = staraWersja || pewnosc !== 'pelna';
  const decyzja = wstepna ? '' : (k.decyzja || '');

  const score = Number.isFinite(dane.score_audytu_0_100) ? dane.score_audytu_0_100
    : (Number.isFinite(dane.scoreOgolny) ? dane.scoreOgolny : '');
  const tier = dane.tier_audytu || dane.tier || '';

  const priorytetWiz = dane.priorytet_wizualny
    || (dane.ocenaWizualna && dane.ocenaWizualna.priorytet) || '';

  const przekazanie = dane.przekazanie || {};
  const obsPath = path.join(dir, 'mail-observation.txt');
  const fragPath = path.join(dir, 'mail-fragment.txt'); // legacy alias, zgodność wsteczna
  const fragment = przekazanie.obserwacja_do_maila
    || (fs.existsSync(obsPath) ? fs.readFileSync(obsPath, 'utf8').trim() : '')
    || (fs.existsSync(fragPath) ? fs.readFileSync(fragPath, 'utf8').trim() : '');

  const status = blokada ? (dane.status_sugerowany || '')
    : (dane.status_sugerowany || (wstepna ? 'DO_AUDYTU' : ''));

  const cols = [
    dane.lead_id ?? leadInfo?.lead_id ?? lead.lead_id ?? '',
    dane.nazwa || lead.nazwa || '',
    dane.miasto ?? leadInfo?.miasto ?? lead.miasto ?? '',
    lead.url,
    dane.telefon ?? leadInfo?.telefon ?? lead.telefon ?? '',
    dane.email ?? leadInfo?.email ?? lead.email ?? '',
    dane.imie_kontaktowe ?? leadInfo?.imie_kontaktowe ?? lead.imie_kontaktowe ?? '',
    priorytetWiz,
    decyzja,
    razem != null ? `${razem}/8` : '',
    (k && k.glowny_problem) || '',
    fragment,
    (k && k.powod_biznesowy) || '',
    dane.zrodlo_audytu || leadInfo?.zrodlo_audytu || '',
    dane.data_audytu || dane.data || '',
    status,
    score,
    tier,
    pewnosc,
    (k && Array.isArray(k.mocne_przeslanki)) ? k.mocne_przeslanki.join(' | ') : '',
    (k && Array.isArray(k.co_jest_kosmetyka)) ? k.co_jest_kosmetyka.join(' | ') : '',
    blokada ? 'blokada kontaktu: ' + blokada : '',
  ];

  // Kolejność biznesowa, nie jakościowa: bucket 0 = PISAĆ, 1 = ODPUŚCIĆ (pełna ocena),
  // 2 = wstępne / stary schemat / do ponownego audytu.
  const bucket = decyzja === 'PISAĆ' ? 0 : decyzja === 'ODPUŚCIĆ' ? 1 : 2;
  wiersze.push({
    sortKey: {
      bucket,
      razem: razem ?? -1,
      A: pkt('potrzeba_przebudowy') ?? -1,
      B: pkt('potencjal_finansowy') ?? -1,
      nazwa: (dane.nazwa || lead.nazwa || '').toLowerCase(),
    },
    cols,
  });

  fragmenty.push({
    scoreNum: Number(score) || 0,
    cols: [lead.nazwa, lead.url, score, priorytetGlowny(dane), fragment || 'BRAK: obserwacja nie wygenerowana'],
  });
}

// ── sortowanie batch-leady ───────────────────────────────────────────
wiersze.sort((a, b) =>
  a.sortKey.bucket - b.sortKey.bucket
  || b.sortKey.razem - a.sortKey.razem
  || b.sortKey.A - a.sortKey.A
  || b.sortKey.B - a.sortKey.B
  || a.sortKey.nazwa.localeCompare(b.sortKey.nazwa, 'pl'));

// ── zapis ────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_BASE, { recursive: true });

const leadyPath = path.join(OUT_BASE, 'batch-leady.csv');
fs.writeFileSync(leadyPath, buildCsv(NAGLOWKI, wiersze.map(w => w.cols), SEP), 'utf8');
console.log(`Zapisano ${wiersze.length} wierszy → output/batch-leady.csv`);

if (pominiete.length) {
  const pomHeader = ['lead_id', 'nazwa', 'miasto', 'url', 'powod_pominiecia', 'data'];
  const pomRows = pominiete.map(p => [
    p.lead.lead_id ?? '', p.lead.nazwa || '', p.lead.miasto ?? '', p.lead.url || '', p.powod, today,
  ]);
  fs.writeFileSync(path.join(OUT_BASE, 'batch-pominiete.csv'), buildCsv(pomHeader, pomRows, SEP), 'utf8');
  console.log(`Pominięte: ${pominiete.length} → output/batch-pominiete.csv`);
}

if (nieudane.length) {
  const failHeader = ['nazwa', 'url', 'powod_bledu', 'data_proby'];
  fs.writeFileSync(path.join(OUT_BASE, 'batch-nieudane.csv'), buildCsv(failHeader, nieudane, SEP), 'utf8');
  console.log(`Nieudane scrapy: ${nieudane.length} → output/batch-nieudane.csv`);
}

// Zgodność wsteczna — batch-fragments.csv (sortowane po score rosnąco, jak dotąd).
fragmenty.sort((a, b) => a.scoreNum - b.scoreNum);
const fragHeader = ['nazwa', 'url', 'score', 'priorytet_glowny', 'fragment_do_maila'];
fs.writeFileSync(path.join(OUT_BASE, 'batch-fragments.csv'),
  buildCsv(fragHeader, fragmenty.map(f => f.cols), SEP), 'utf8');
console.log(`Zgodność wsteczna: ${fragmenty.length} wierszy → output/batch-fragments.csv`);

const pisac = wiersze.filter(w => w.sortKey.bucket === 0).length;
const odpuscic = wiersze.filter(w => w.sortKey.bucket === 1).length;
const wstepne = wiersze.filter(w => w.sortKey.bucket === 2).length;
console.log(`\nPodsumowanie: PISAĆ ${pisac} · ODPUŚCIĆ ${odpuscic} · wstępne/do ponownego audytu ${wstepne} · pominięte ${pominiete.length} · nieudane ${nieudane.length}`);
if (pisac) console.log('Rodzynki 7–8/8 wyślij do arkusza: node push-import.js <leady.json> (patrz sheets/README.md)');
