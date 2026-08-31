#!/usr/bin/env node
/**
 * log-odrzucone.js — loguje lokalnie leady 3–4/6 (widziane, ale nie zapisane do arkusza),
 * żeby przy kolejnej paczce nie audytować tej samej kancelarii drugi raz.
 *
 * Użycie:
 *   node log-odrzucone.js <domena> <scoring_0_6> [powod]
 *
 * Przykład:
 *   node log-odrzucone.js kancelaria-example.pl 6 "A2 C1 ale B0 D0 — brak zespołu i powodu kontaktu"
 *
 * Zapisuje do output/odrzucone.csv (BOM UTF-8; dopisuje, nie nadpisuje).
 * Nie dotyczy leadów 5–6/6 — te idą przez scripts/push-import.js do arkusza.
 */

const fs = require('fs');
const path = require('path');

const [domena, scoring, powod = ''] = process.argv.slice(2);
if (!domena || !scoring) {
  console.error('Użycie: node log-odrzucone.js <domena> <scoring_0_6> [powod]');
  process.exit(1);
}

const pkt = parseInt(scoring, 10);
if (!(pkt >= 0 && pkt <= 6)) {
  console.error(`✗ scoring_0_6 poza zakresem 0–6: ${scoring}`);
  process.exit(1);
}
if (pkt >= 5) {
  console.error(`✗ ${pkt}/6 to rodzynek — idzie do arkusza przez push-import.js, nie do odrzucone.csv`);
  process.exit(1);
}

const SEP = ';';
function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[";,\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const outPath = path.join(__dirname, '..', 'output', 'odrzucone.csv');
// Kolumna nazywa się po prostu `scoring`, bez skali w nazwie: plik żyje dłużej niż jedna
// wersja kryteriów i ma w sobie wiersze sprzed zmiany 2026-08-30 (skala 0–8) obok nowych
// (0–6). Konsument (dedup-gate.js) dopasowuje po domenie, nie po liczbie.
const HEADER = ['domena', 'scoring', 'powod', 'data'];
const today = new Date().toISOString().slice(0, 10);

const isNew = !fs.existsSync(outPath);
const wiersz = [domena, pkt, powod, today].map(csvEscape).join(SEP) + '\r\n';

if (isNew) {
  fs.writeFileSync(outPath, '﻿' + HEADER.join(SEP) + '\r\n' + wiersz, 'utf8');
} else {
  fs.appendFileSync(outPath, wiersz, 'utf8');
}

console.log(`✓ ${domena} (${pkt}/6) → output/odrzucone.csv`);
