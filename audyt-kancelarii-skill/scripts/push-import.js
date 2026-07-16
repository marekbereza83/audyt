#!/usr/bin/env node
/**
 * push-import.js — wysyła rodzynki (7–8/8, PISAĆ) do zakładki „Claude_import" w arkuszu.
 *
 * Użycie:
 *   node push-import.js <leady.json>      wyślij
 *   node push-import.js <leady.json> --dry-run   pokaż, co poszłoby, bez zapisu
 *   node push-import.js --ping            sprawdź, czy webhook żyje
 *
 * Wejście: JSON — tablica obiektów o kluczach = nagłówki „Claude_import"
 * (patrz sheets/Code.gs → KOLUMNY). Przykład jednego leada:
 *
 *   [{
 *     "Nazwa kancelarii": "...", "Miasto": "...", "Strona www": "https://...",
 *     "Telefon": "+48 ...", "Email": "...", "priorytet_wizualny": "wysoki",
 *     "decyzja": "PISAĆ", "scoring_0_8": "7/8", "glowny_problem": "...",
 *     "obserwacja_do_maila": "...", "powod_biznesowy": "...",
 *     "zrodlo_audytu": "Claude", "data_audytu": "2026-07-16",
 *     "potrzeba_0_2": 2, "potencjal_0_2": 2, "skala_poprawy_0_2": 2, "powod_kontaktu_0_2": 1,
 *     "mocne_przeslanki": "fakt; fakt; fakt", "co_jest_kosmetyka": "...",
 *     "sprawdzone_podstrony": "https://...; https://...", "data_dodania": "2026-07-16"
 *   }]
 *
 * Dedup i filtr 7–8/8 robi skrypt po stronie arkusza (atomowo, pod blokadą) — tutaj
 * tylko walidujemy kształt, żeby nie wysyłać oczywistych śmieci.
 */

require('dotenv').config({ override: true });
const fs = require('fs');

const URL_WEBHOOKA = process.env.SHEETS_URL;
const SEKRET = process.env.SHEETS_SECRET;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const ping = args.includes('--ping');
const plik = args.find(a => !a.startsWith('--'));

// --ping woła doGet(), które nie sprawdza sekretu (sekret chroni tylko zapis w doPost) —
// więc działa, zanim jeszcze uruchomisz setup() w Apps Script i wkleisz SHEETS_SECRET.
if (!URL_WEBHOOKA) {
  console.error('Brak SHEETS_URL w scripts/.env — patrz sheets/README.md');
  process.exit(1);
}
if (!ping && !SEKRET) {
  console.error('Brak SHEETS_SECRET w scripts/.env (potrzebny do zapisu) — patrz sheets/README.md, krok 3');
  process.exit(1);
}

// ── ping ─────────────────────────────────────────────────────────────
async function doPing() {
  const res = await fetch(URL_WEBHOOKA);
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch {
    console.error('✗ Webhook odpowiedział czymś, co nie jest JSON-em (HTTP ' + res.status + '):');
    console.error(txt.slice(0, 300));
    console.error('\nNajczęstsza przyczyna: wdrożenie nie ma dostępu „Wszyscy" i zwraca stronę logowania.');
    process.exit(1);
  }
  console.log(json.ok && json.import_gotowy
    ? `✓ Webhook żyje, zakładka Claude_import gotowa (${json.kolumny} kolumn)`
    : `⚠ Webhook żyje, ale zakładka Claude_import nie istnieje — uruchom setup() w Apps Script`);
}

// ── walidacja wejścia ────────────────────────────────────────────────
const WYMAGANE = ['Nazwa kancelarii', 'decyzja', 'scoring_0_8'];

function sprawdz(leady) {
  const bledy = [];
  leady.forEach((l, i) => {
    WYMAGANE.forEach(k => {
      if (!String(l[k] || '').trim()) bledy.push(`lead #${i + 1}: brak pola „${k}"`);
    });
    const pkt = parseInt(String(l['scoring_0_8'] || '').match(/\d+/), 10);
    if (!(pkt >= 7 && pkt <= 8)) {
      bledy.push(`lead #${i + 1} (${l['Nazwa kancelarii']}): scoring ${l['scoring_0_8']} — do arkusza idą tylko 7–8/8`);
    }
    const suma = ['potrzeba_0_2', 'potencjal_0_2', 'skala_poprawy_0_2', 'powod_kontaktu_0_2']
      .reduce((s, k) => s + (Number(l[k]) || 0), 0);
    if (pkt >= 7 && suma !== pkt) {
      bledy.push(`lead #${i + 1} (${l['Nazwa kancelarii']}): A+B+C+D = ${suma}, a scoring_0_8 = ${pkt}`);
    }
  });
  return bledy;
}

// ── wysyłka ──────────────────────────────────────────────────────────
async function wyslij(leady) {
  const res = await fetch(URL_WEBHOOKA, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script + JSON = preflight; text/plain go omija
    body: JSON.stringify({ sekret: SEKRET, leady }),
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch {
    console.error('✗ Odpowiedź nie jest JSON-em (HTTP ' + res.status + '):');
    console.error(txt.slice(0, 300));
    process.exit(1);
  }
  if (!json.ok) { console.error('✗ Arkusz odrzucił paczkę: ' + json.blad); process.exit(1); }

  // Podsumowanie w formacie „TRYB PACZKI"
  console.log('');
  console.log(`Sprawdzonych kancelarii:      ${leady.length}`);
  console.log(`Zapisanych rodzynków 7–8/8:   ${json.zapisane}`);
  console.log(`Duplikatów (pominiętych):     ${json.duplikaty}`);
  console.log(`Odrzuconych przez filtr:      ${json.odrzucone}`);
  console.log(`Do ręcznej weryfikacji:       ${json.bez_klucza}`);
  const s = json.szczegoly || {};
  if (s.zapisane?.length)   console.log('\nZapisane:\n  ' + s.zapisane.join('\n  '));
  if (s.duplikaty?.length)  console.log('\nDuplikaty:\n  ' + s.duplikaty.join('\n  '));
  if (s.bez_klucza?.length) console.log('\nDO RĘCZNEJ WERYFIKACJI:\n  ' + s.bez_klucza.join('\n  '));
}

// ── main ─────────────────────────────────────────────────────────────
(async () => {
  if (ping) return doPing();

  if (!plik) {
    console.error('Użycie: node push-import.js <leady.json> [--dry-run] | --ping');
    process.exit(1);
  }

  let leady;
  try {
    leady = JSON.parse(fs.readFileSync(plik, 'utf8'));
  } catch (e) {
    console.error('✗ Nie mogę wczytać ' + plik + ': ' + e.message);
    process.exit(1);
  }
  if (!Array.isArray(leady)) { console.error('✗ Plik musi zawierać tablicę leadów'); process.exit(1); }
  if (!leady.length) { console.log('Pusta lista — nic do wysłania.'); return; }

  const bledy = sprawdz(leady);
  if (bledy.length) {
    console.error('✗ Wejście nie przeszło walidacji:\n  ' + bledy.join('\n  '));
    process.exit(1);
  }

  if (dryRun) {
    console.log(`--dry-run: ${leady.length} leadów przeszło walidację, nic nie wysłano.\n`);
    leady.forEach(l => console.log(`  ${l['scoring_0_8']}  ${l['Nazwa kancelarii']} (${l['Miasto'] || '?'}) — ${l['Strona www'] || 'brak URL'}`));
    console.log('\nDedup sprawdzi arkusz przy realnej wysyłce.');
    return;
  }

  await wyslij(leady);
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
