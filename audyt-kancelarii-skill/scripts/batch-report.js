#!/usr/bin/env node
/**
 * batch-report.js — zbiera wyniki audytów wsadowych do jednego CSV gotowego do trackera.
 * Użycie: node batch-report.js <lista.csv>     (ten sam CSV co `scrape.js --batch`)
 *
 * Dla każdej kancelarii z CSV czyta output/<domena>/:
 *   - audyt-dane.json   → score + priorytet główny + ocenaLeada (werdykt)
 *   - mail-fragment.txt → gotowy fragment do maila (gdy werdykt pisz/pisz-inaczej)
 *   - lead-skip.txt     → (gdy werdykt odpusc) powód odpuszczenia
 *   - scrape-error.txt  → (gdy strona zawiodła) powód
 *
 * Wynik: output/batch-fragments.csv
 *   kolumny: nazwa,url,werdykt,pyt1_rozdzwiek,powod,fragment_do_maila,score,priorytet_glowny
 * z BOM UTF-8 i CRLF — Excel otworzy polskie znaki poprawnie. Sortuj po `werdykt`
 * (1-PISZ → 2-PISZ-INACZEJ → 3-ODPUSC), w drugiej kolejności po `pyt1_rozdzwiek` — to ustawia
 * kolejność pracy: najpierw leady z rozdźwiękiem (1-tak > 2-za-malo-danych > 3-nie). Leady odpuszczone mają pusty `fragment_do_maila`
 * i powód w `powod`.
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

// Werdykt oceny leada → etykieta z prefiksem 1/2/3, by sort w Excelu = kolejność pracy.
const WERDYKT_LABEL = { 'pisz': '1-PISZ', 'pisz-inaczej': '2-PISZ-INACZEJ', 'odpusc': '3-ODPUSC' };
function werdyktLabel(oc) {
  if (!oc || !oc.werdykt) return '';
  return WERDYKT_LABEL[oc.werdykt] || oc.werdykt;
}
// Prefiks 1/2/3 przed wartością pyt1_rozdzwiek → Excel sort = kolejność pracy (tak → za-malo-danych → nie).
function sortPrefixPyt1(s) {
  if (!s) return '';
  if (/^tak\b/i.test(s)) return '1-' + s;
  if (/^za-malo-danych\b/i.test(s)) return '2-' + s;
  if (/^nie\b/i.test(s)) return '3-' + s;
  return s;
}
// Krótki powód do CSV — rekomendacja, a w razie braku skrót z odpowiedzi na pytania.
function powodWerdyktu(oc) {
  if (!oc) return '';
  if (oc.rekomendacja) return oc.rekomendacja;
  return [oc.pyt1_rozdzwiek, oc.pyt3_budzet, oc.kontakt].filter(Boolean).join(' · ');
}

// ── zbieranie ───────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = ['nazwa', 'url', 'werdykt', 'pyt1_rozdzwiek', 'powod', 'fragment_do_maila', 'score', 'priorytet_glowny'];
const lines = [header.map(csvEscape).join(',')];

let ok = 0, odpuszczone = 0, bledy = 0;
for (const row of rows) {
  const dir = path.join(__dirname, '..', 'output', domainOf(row.url));
  const danePath = path.join(dir, 'audyt-dane.json');
  const fragPath = path.join(dir, 'mail-fragment.txt');
  const skipPath = path.join(dir, 'lead-skip.txt');
  const errPath = path.join(dir, 'scrape-error.txt');

  let fragment = '', score = '', priorytet = '', werdykt = '', pyt1 = '', powod = '';

  if (fs.existsSync(danePath)) {
    try {
      const dane = JSON.parse(fs.readFileSync(danePath, 'utf8'));
      score = dane.scoreOgolny != null ? dane.scoreOgolny : '';
      priorytet = priorytetGlowny(dane);
      const oc = dane.ocenaLeada;
      werdykt = werdyktLabel(oc);
      pyt1 = oc && oc.pyt1_rozdzwiek ? sortPrefixPyt1(oc.pyt1_rozdzwiek) : '';
      powod = powodWerdyktu(oc);

      if (oc && oc.werdykt === 'odpusc') {
        // 🔴 — fragmentu celowo nie ma; powód z lead-skip.txt (gdy brak rekomendacji).
        fragment = '';
        if (!powod && fs.existsSync(skipPath)) powod = fs.readFileSync(skipPath, 'utf8').trim();
        odpuszczone++;
      } else {
        fragment = fs.existsSync(fragPath)
          ? fs.readFileSync(fragPath, 'utf8').trim()
          : 'BŁĄD: brak mail-fragment.txt (audyt niedokończony)';
        if (!fragment.startsWith('BŁĄD')) ok++; else bledy++;
      }
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

  lines.push([row.nazwa, row.url, werdykt, pyt1, powod, fragment, score, priorytet].map(csvEscape).join(','));
}

const outPath = path.join(__dirname, '..', 'output', 'batch-fragments.csv');
// BOM + CRLF → Excel czyta UTF-8 (polskie znaki) i wiersze poprawnie.
fs.writeFileSync(outPath, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');

console.log(`Zapisano ${rows.length} wierszy (${ok} do pisania, ${odpuszczone} odpuszczonych, ${bledy} z błędem) → output/batch-fragments.csv`);
