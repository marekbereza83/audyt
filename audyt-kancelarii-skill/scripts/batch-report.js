#!/usr/bin/env node
/**
 * batch-report.js — zbiera wyniki audytów wsadowych do jednego CSV gotowego do trackera.
 * Użycie: node batch-report.js <lista.csv>     (ten sam CSV co `scrape.js --batch`)
 *
 * Dla każdej kancelarii z CSV czyta output/<domena>/:
 *   - audyt-dane.json   → score + priorytet główny
 *   - mail-fragment.txt → gotowy fragment do maila
 *   - scrape-error.txt  → (gdy strona zawiodła) powód
 *
 * Wynik: output/batch-fragments.csv (kolumny: nazwa,url,fragment_do_maila,score,priorytet_glowny)
 * z BOM UTF-8 i CRLF — Excel otworzy polskie znaki poprawnie. Kolumna `fragment_do_maila`
 * jest gotowa do wklejenia do kolumny „Obserwacja" w trackerze.
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) { console.error('Użycie: node batch-report.js <lista.csv>'); process.exit(1); }

// ── helpery (spójne ze scrape.js) ───────────────────────────────────
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

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Główny priorytet = wymiar o statusie 'brak' i najwyższej wadze (najmocniej tnie konwersję).
// Jak nic nie jest 'brak' — najcięższy 'do-poprawy'. Jak strona zdrowa — informacja o tym.
function priorytetGlowny(dane) {
  const dims = Array.isArray(dane.wymiary) ? dane.wymiary : [];
  const byWaga = (a, b) => (b.waga || 0) - (a.waga || 0);
  const brak = dims.filter(d => d.status === 'brak').sort(byWaga);
  if (brak.length) return brak[0].wymiar;
  const slabe = dims.filter(d => d.status === 'do-poprawy').sort(byWaga);
  if (slabe.length) return slabe[0].wymiar;
  return 'brak krytycznych — strona w dobrym stanie';
}

// ── zbieranie ───────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = ['nazwa', 'url', 'fragment_do_maila', 'score', 'priorytet_glowny'];
const lines = [header.map(csvEscape).join(',')];

let ok = 0, bledy = 0;
for (const row of rows) {
  const dir = path.join(__dirname, '..', 'output', domainOf(row.url));
  const danePath = path.join(dir, 'audyt-dane.json');
  const fragPath = path.join(dir, 'mail-fragment.txt');
  const errPath = path.join(dir, 'scrape-error.txt');

  let fragment = '', score = '', priorytet = '';

  if (fs.existsSync(danePath)) {
    try {
      const dane = JSON.parse(fs.readFileSync(danePath, 'utf8'));
      score = dane.scoreOgolny != null ? dane.scoreOgolny : '';
      priorytet = priorytetGlowny(dane);
      fragment = fs.existsSync(fragPath)
        ? fs.readFileSync(fragPath, 'utf8').trim()
        : 'BŁĄD: brak mail-fragment.txt (audyt niedokończony)';
      if (!fragment.startsWith('BŁĄD')) ok++; else bledy++;
    } catch (e) {
      fragment = 'BŁĄD: niepoprawny audyt-dane.json — ' + e.message;
      bledy++;
    }
  } else if (fs.existsSync(errPath)) {
    fragment = 'BŁĄD: ' + fs.readFileSync(errPath, 'utf8').trim();
    bledy++;
  } else {
    fragment = 'BŁĄD: brak danych audytu (scrape nie wykonany dla tej strony?)';
    bledy++;
  }

  lines.push([row.nazwa, row.url, fragment, score, priorytet].map(csvEscape).join(','));
}

const outPath = path.join(__dirname, '..', 'output', 'batch-fragments.csv');
// BOM + CRLF → Excel czyta UTF-8 (polskie znaki) i wiersze poprawnie.
fs.writeFileSync(outPath, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');

console.log(`Zapisano ${rows.length} wierszy (${ok} OK, ${bledy} z błędem) → output/batch-fragments.csv`);
