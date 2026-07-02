#!/usr/bin/env node
/**
 * batch-report.js — zbiera wyniki audytów wsadowych do CSV gotowego do trackera.
 * Użycie: node batch-report.js <lista.csv>     (ten sam CSV co `scrape.js --batch`)
 *
 * Dla każdej kancelarii z CSV czyta output/<domena>/:
 *   - audyt-dane.json   → score + priorytet główny
 *   - mail-fragment.txt → 2–4 zdania do maila
 *   - scrape-error.txt  → (gdy strona zawiodła) powód — trafia do batch-nieudane.csv
 *
 * Wyniki:
 *   output/batch-fragments.csv  — udane audyty
 *     kolumny: nazwa, url, score, priorytet_glowny, fragment_do_maila
 *     posortowane: score rosnąco (najniższy = największa luka = na górze)
 *
 *   output/batch-nieudane.csv   — nieudane scrapy (do ręcznej weryfikacji, nie ponawia)
 *     kolumny: nazwa, url, powod_bledu, data_proby
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) { console.error('Użycie: node batch-report.js <lista.csv>'); process.exit(1); }

// ── helpery ───────────────────────────────────────────────────────────
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

// Główny priorytet = wymiar o statusie 'brak' i najwyższej wadze.
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

// ── zbieranie ────────────────────────────────────────────────────────
const inputRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const mainRows = [];
const failedRows = [];

for (const row of inputRows) {
  const dir = path.join(__dirname, '..', 'output', domainOf(row.url));
  const danePath = path.join(dir, 'audyt-dane.json');
  const fragPath = path.join(dir, 'mail-fragment.txt');
  const errPath  = path.join(dir, 'scrape-error.txt');

  // ── błąd scrape ──────────────────────────────────────────────────
  if (!fs.existsSync(danePath)) {
    const powodBledu = fs.existsSync(errPath)
      ? skrocBladScrape(fs.readFileSync(errPath, 'utf8').trim())
      : 'brak danych audytu — scrape nie wykonany lub nieudany';
    failedRows.push({ nazwa: row.nazwa, url: row.url, powodBledu, dataPróby: today });
    continue;
  }

  // ── udany audyt ──────────────────────────────────────────────────
  let score = '', priorytet = '', fragment = '';

  try {
    const dane = JSON.parse(fs.readFileSync(danePath, 'utf8'));
    score    = dane.scoreOgolny != null ? dane.scoreOgolny : '';
    priorytet = priorytetGlowny(dane);
  } catch (e) {
    priorytet = 'BŁĄD: niepoprawny audyt-dane.json — ' + e.message;
  }

  fragment = fs.existsSync(fragPath)
    ? fs.readFileSync(fragPath, 'utf8').trim()
    : 'BRAK: mail-fragment.txt nie wygenerowany';

  mainRows.push({ scoreNum: Number(score) || 0, cols: [row.nazwa, row.url, score, priorytet, fragment] });
}

// ── sortowanie: score rosnąco (najniższy = największa luka = na górze) ──
mainRows.sort((a, b) => a.scoreNum - b.scoreNum);

// ── zapis batch-fragments.csv ────────────────────────────────────────
const mainHeader = ['nazwa', 'url', 'score', 'priorytet_glowny', 'fragment_do_maila'];
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
  console.log(`Nieudane scrapy: ${failedRows.length} → output/batch-nieudane.csv`);
}

console.log(`Zapisano ${mainRows.length} wierszy → output/batch-fragments.csv`);
