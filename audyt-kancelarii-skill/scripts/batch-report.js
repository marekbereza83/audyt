#!/usr/bin/env node
/**
 * batch-report.js — zbiera wyniki audytów wsadowych do CSV gotowego do trackera.
 * Użycie: node batch-report.js <lista.csv>     (ten sam CSV co `scrape.js --batch`)
 *
 * Dla każdej kancelarii z CSV czyta output/<domena>/:
 *   - audyt-dane.json   → score + priorytet + ocenaLeada (werdykt, gwiazdki, potencjał)
 *   - mail-fragment.txt → 2–4 zdania do trackera (gdy pisz)
 *   - mail.txt          → pełny pierwszy mail z tematem (gdy pisz)
 *   - lead-skip.txt     → powód odpuszczenia (gdy odpusc)
 *   - scrape-error.txt  → (gdy strona zawiodła) powód — trafia do batch-nieudane.csv
 *
 * Wyniki:
 *   output/batch-fragments.csv  — tylko udane audyty
 *     kolumny: gwiazdki,nazwa,werdykt,potencjal_ABC,url,sygnaly_kupna,dlaczego_pisac,
 *              fragment_do_maila,score,priorytet_glowny
 *     posortowane: gwiazdki ↓, potencjal A→C
 *
 *   output/batch-nieudane.csv   — nieudane scrapy (do ręcznej weryfikacji)
 *     kolumny: nazwa,url,powod_bledu,data_proby
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) { console.error('Użycie: node batch-report.js <lista.csv>'); process.exit(1); }

// ── helpery (spójne ze scrape.js) ────────────────────────────────────
function domainOf(u) {
  return u.replace(/^https?:\/\//, '').replace(/[\/:]/g, '_').replace(/_+$/, '');
}

function parseCsv(text) {
  return text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => {
      const i = l.lastIndexOf(',');
      if (i < 0) return null;
      const nazwa = l.slice(0, i).trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      const url = l.slice(i + 1).trim().replace(/^"|"$/g, '');
      return { nazwa, url };
    })
    .filter(r => r && r.url && r.url.toLowerCase() !== 'url')
    .map(r => ({ nazwa: r.nazwa, url: /^https?:\/\//i.test(r.url) ? r.url : 'https://' + r.url }));
}

const SEP = ';'; // średnik — domyślny separator polskiego Excela

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[";,\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Główny priorytet = wymiar o statusie 'brak' i najwyższej wadze (najmocniej tnie konwersję).
function priorytetGlowny(dane) {
  const dims = Array.isArray(dane.wymiary) ? dane.wymiary : [];
  const byWaga = (a, b) => (b.waga || 0) - (a.waga || 0);
  const brak = dims.filter(d => d.status === 'brak').sort(byWaga);
  if (brak.length) return brak[0].wymiar;
  const slabe = dims.filter(d => d.status === 'do-poprawy').sort(byWaga);
  if (slabe.length) return slabe[0].wymiar;
  return 'brak krytycznych — strona w dobrym stanie';
}

// Werdykt → etykieta z prefiksem (sort w Excelu = kolejność pracy).
const WERDYKT_LABEL = { 'pisz': '1-PISZ', 'odpusc': '2-ODPUSC' };
function werdyktLabel(oc) {
  if (!oc || !oc.werdykt) return '';
  return WERDYKT_LABEL[oc.werdykt] || oc.werdykt;
}

// Gwiazdki jako numer (do sortowania) i czytelna etykieta (do CSV).
function gwiazdkiNum(oc) {
  if (!oc || !oc.gwiazdki) return 0;
  return parseInt(oc.gwiazdki, 10) || 0;
}
function gwiazdkiLabel(oc) {
  const n = gwiazdkiNum(oc);
  return n ? String(n) + '⭐' : '';
}

// Potencjał A/B/C.
function potencjalLabel(oc) {
  if (!oc || !oc.potencjal) return '';
  return String(oc.potencjal).toUpperCase();
}

// Sygnały kupna z tablicy → ciąg oddzielony " | ".
function sygnalyKupna(oc) {
  if (!oc || !Array.isArray(oc.sygnalyKupna) || !oc.sygnalyKupna.length) return '';
  return oc.sygnalyKupna.join(' | ');
}

// Dlaczego pisać — rekomendacja lub skrót z pytań.
function dlaczegoPisac(oc) {
  if (!oc) return '';
  if (oc.rekomendacja) return oc.rekomendacja;
  return [oc.pyt1_rozdzwiek, oc.pyt3_budzet, oc.kontakt].filter(Boolean).join(' · ');
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

// ── zbieranie ────────────────────────────────────────────────────────
const inputRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const mainRows = [];   // udane audyty
const failedRows = []; // błędy scrape

let ok = 0, odpuszczone = 0;

for (const row of inputRows) {
  const dir = path.join(__dirname, '..', 'output', domainOf(row.url));
  const danePath = path.join(dir, 'audyt-dane.json');
  const fragPath = path.join(dir, 'mail-fragment.txt');
  const skipPath = path.join(dir, 'lead-skip.txt');
  const errPath  = path.join(dir, 'scrape-error.txt');

  // ── błąd scrape ─────────────────────────────────────────────────
  if (!fs.existsSync(danePath)) {
    const powodBledu = fs.existsSync(errPath)
      ? skrocBladScrape(fs.readFileSync(errPath, 'utf8').trim())
      : 'brak danych audytu — scrape nie wykonany lub nieudany';
    failedRows.push({ nazwa: row.nazwa, url: row.url, powodBledu, dataPróby: today });
    continue;
  }

  // ── udany audyt ──────────────────────────────────────────────────
  let fragment = '', score = '', priorytet = '', werdykt = '';
  let gwiazdki = 0, potencjal = '', sygnaly = '', dlaczego = '';

  try {
    const dane = JSON.parse(fs.readFileSync(danePath, 'utf8'));
    score    = dane.scoreOgolny != null ? dane.scoreOgolny : '';
    priorytet = priorytetGlowny(dane);
    const oc = dane.ocenaLeada || null;

    werdykt  = werdyktLabel(oc);
    gwiazdki = gwiazdkiNum(oc);
    potencjal = potencjalLabel(oc);
    sygnaly  = sygnalyKupna(oc);
    dlaczego = dlaczegoPisac(oc);

    if (oc && oc.werdykt === 'odpusc') {
      fragment = '';
      if (!dlaczego && fs.existsSync(skipPath)) dlaczego = fs.readFileSync(skipPath, 'utf8').trim();
      odpuszczone++;
    } else {
      // pisz — fragment do trackera (mail-fragment.txt); pełny mail w mail.txt
      fragment = fs.existsSync(fragPath)
        ? fs.readFileSync(fragPath, 'utf8').trim()
        : 'BŁĄD: brak mail-fragment.txt (audyt niedokończony)';
      ok++;
    }
  } catch (e) {
    fragment = 'BŁĄD: niepoprawny audyt-dane.json — ' + e.message;
    ok++;
  }

  mainRows.push({
    gwiazdkiNum: gwiazdki,
    potencjalSort: potencjal || 'Z',   // brak potencjału sortuje na końcu
    cols: [gwiazdkiLabel({ gwiazdki }), row.nazwa, werdykt, potencjal, row.url,
           sygnaly, dlaczego, fragment, score, priorytet],
  });
}

// ── sortowanie: gwiazdki ↓, potencjal A→C ───────────────────────────
mainRows.sort((a, b) => {
  if (b.gwiazdkiNum !== a.gwiazdkiNum) return b.gwiazdkiNum - a.gwiazdkiNum;
  return a.potencjalSort.localeCompare(b.potencjalSort);
});

// ── zapis batch-fragments.csv ────────────────────────────────────────
const mainHeader = ['gwiazdki', 'nazwa', 'werdykt', 'potencjal_ABC', 'url',
                    'sygnaly_kupna', 'dlaczego_pisac', 'fragment_do_maila', 'score', 'priorytet_glowny'];
const mainLines = [mainHeader.map(csvEscape).join(SEP),
                   ...mainRows.map(r => r.cols.map(csvEscape).join(SEP))];

const outPath = path.join(__dirname, '..', 'output', 'batch-fragments.csv');
fs.writeFileSync(outPath, '﻿' + mainLines.join('\r\n') + '\r\n', 'utf8');

// ── zapis batch-nieudane.csv ─────────────────────────────────────────
if (failedRows.length) {
  const failHeader = ['nazwa', 'url', 'powod_bledu', 'data_proby'];
  const failLines = [failHeader.map(csvEscape).join(SEP),
                     ...failedRows.map(r => [r.nazwa, r.url, r.powodBledu, r.dataPróby].map(csvEscape).join(SEP))];
  const failPath = path.join(__dirname, '..', 'output', 'batch-nieudane.csv');
  fs.writeFileSync(failPath, '﻿' + failLines.join('\r\n') + '\r\n', 'utf8');
  console.log(`Nieudane scrapy: ${failedRows.length} → output/batch-nieudane.csv (do ręcznej weryfikacji, nie ponawiaj automatycznie)`);
}

console.log(`Zapisano ${mainRows.length} wierszy (${ok} PISZ, ${odpuszczone} ODPUŚĆ) → output/batch-fragments.csv`);
