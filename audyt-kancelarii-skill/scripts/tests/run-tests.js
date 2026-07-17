#!/usr/bin/env node
/**
 * run-tests.js — testy regresyjne dla csv-utils.js, validate-lead.js, batch-report.js.
 *
 * Użycie: node tests/run-tests.js
 * Bez zależności zewnętrznych (assert/strict + child_process, oba wbudowane w Node).
 *
 * Fixtures żyją w tymczasowych katalogach (fs.mkdtempSync) — batch-report.js jest wołany jako
 * osobny proces z AUDYT_OUTPUT_DIR wskazującym na fixture (nie rusza repo output/).
 * validate-lead.js jest wołany bezpośrednio (validateDir() przyjmuje ścieżkę, nie zależy od env).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');

const SCRIPTS_DIR = path.join(__dirname, '..');
const { validateDir } = require('../validate-lead.js');
const csvUtils = require('../csv-utils.js');

let passed = 0;
let failed = 0;
const failures = [];
const tmpDirs = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  ✗ ${name}`);
    console.log(`      ${e.message}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

function mkFixtureDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'audyt-test-'));
  tmpDirs.push(d);
  return d;
}

// ── fixtures: audyt-dane.json ────────────────────────────────────────────
function wymiar(punkty, uzasadnienie) {
  return { punkty, uzasadnienie };
}

function basePISAC(overrides = {}) {
  const dane = {
    nazwa: 'Kancelaria Testowa',
    priorytet_wizualny: 'wysoki',
    score_audytu_0_100: 40,
    tier_audytu: 'niski',
    kwalifikacja_leada: {
      decyzja: 'PISAĆ',
      scoring_0_8: {
        potrzeba_przebudowy: wymiar(2, 'Google Sites, brak mobile'),
        potencjal_finansowy: wymiar(2, '4 prawników, obsługa firm'),
        skala_poprawy: wymiar(2, 'zespół i oferta niewidoczne'),
        naturalny_powod_kontaktu: wymiar(1, 'ostatni wpis 2019 — prawdziwy, przeciętny'),
        razem: 7,
      },
      glowny_problem: 'Brak specjalizacji w hero',
      powod_biznesowy: 'Rozbudowana kancelaria ze słabą stroną',
      mocne_przeslanki: [
        'Google Sites zamiast realnej strony',
        'zespół 4 prawników niewidoczny na stronie',
      ],
      co_jest_kosmetyka: ['stary favicon'],
      sprawdzone_podstrony: [],
      pewnosc_oceny: 'pelna',
    },
    przekazanie: {
      do_importu: true,
      obserwacja_do_maila: 'Trafiłem na stronę Pana kancelarii — zbudowana jest na Google Sites. Czy to tymczasowe rozwiązanie?',
    },
    status_sugerowany: 'DO_IMPORTU',
  };
  return Object.assign(dane, overrides);
}

function baseODPUSC(overrides = {}) {
  const dane = {
    nazwa: 'Kancelaria Solidna',
    priorytet_wizualny: 'niski',
    score_audytu_0_100: 75,
    tier_audytu: 'sredni',
    kwalifikacja_leada: {
      decyzja: 'ODPUŚCIĆ',
      scoring_0_8: {
        potrzeba_przebudowy: wymiar(0, 'strona nowoczesna'),
        potencjal_finansowy: wymiar(1, 'mała kancelaria solo'),
        skala_poprawy: wymiar(0, 'niewielka'),
        naturalny_powod_kontaktu: wymiar(0, 'brak'),
        razem: 1,
      },
      glowny_problem: 'brak wyraźnego problemu',
      powod_biznesowy: 'Strona jest w porządku, brak uzasadnienia dla nowej',
      mocne_przeslanki: [],
      co_jest_kosmetyka: [],
      sprawdzone_podstrony: [],
      pewnosc_oceny: 'pelna',
    },
    przekazanie: { do_importu: false, obserwacja_do_maila: null },
    status_sugerowany: 'ODPUŚCIĆ',
  };
  return Object.assign(dane, overrides);
}

function writeAudytDane(dir, dane) {
  fs.writeFileSync(path.join(dir, 'audyt-dane.json'), JSON.stringify(dane, null, 2));
}
function writeLeadInfo(dir, info) {
  fs.writeFileSync(path.join(dir, 'lead-info.json'), JSON.stringify(info, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════
section('validate-lead.js');
// ═══════════════════════════════════════════════════════════════════════

test('PISAĆ poprawny → 0 błędów', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, basePISAC());
  const { errors } = validateDir(dir);
  assert.deepEqual(errors, []);
});

test('ODPUŚCIĆ poprawny → 0 błędów', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, baseODPUSC());
  const { errors } = validateDir(dir);
  assert.deepEqual(errors, []);
});

test('ODPUŚCIĆ z obserwacją → błąd', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, baseODPUSC({ przekazanie: { do_importu: false, obserwacja_do_maila: 'coś' } }));
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /obserwacja_do_maila musi być null/.test(e)));
});

test('PISAĆ bez obserwacji → błąd', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, basePISAC({ przekazanie: { do_importu: true, obserwacja_do_maila: null } }));
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /obserwacja_do_maila wymagana/.test(e)));
});

test('punkty poza zakresem 0–2 → błąd', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.scoring_0_8.potrzeba_przebudowy.punkty = 3;
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /musi być liczbą całkowitą 0–2/.test(e)));
});

test('razem ≠ suma A+B+C+D → błąd', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.scoring_0_8.razem = 8; // realna suma to 7
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /≠ suma A\+B\+C\+D/.test(e)));
});

test('decyzja PISAĆ niezgodna z progiem dla 6/8 → błąd', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.scoring_0_8.naturalny_powod_kontaktu = wymiar(0, 'brak');
  dane.kwalifikacja_leada.scoring_0_8.razem = 6;
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /niezgodna z progami dla 6\/8/.test(e)));
});

test('ocena wstępna z niepustą decyzją → błąd', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.pewnosc_oceny = 'wstepna';
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /decyzja musi być null/.test(e)));
});

test('blokada kontaktu z przekazanie.do_importu=true → błąd', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, basePISAC());
  writeLeadInfo(dir, { mail_zablokowany: true, powod_blokady: 'status: M1_WYSŁANY' });
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /przekazanie\.do_importu musi być false/.test(e)));
});

test('PISAĆ oparte wyłącznie na słabych przesłankach → błąd (reguła 9)', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.mocne_przeslanki = [
    'stary copyright z 2015 roku',
    'drobna typografia, trochę kosmetyki',
  ];
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /oparte wyłącznie na słabych przesłankach/.test(e)));
});

test('PISAĆ z ≥1 mocną, niesłabą przesłanką → reguła 9 nie odrzuca', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.mocne_przeslanki = [
    'stary copyright z 2015 roku',
    'zespół 4 prawników niewidoczny na stronie',
  ];
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(!errors.some(e => /oparte wyłącznie na słabych przesłankach/.test(e)));
});

test('mocna przesłanka duplikuje co_jest_kosmetyka → błąd (reguła 10)', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  dane.kwalifikacja_leada.co_jest_kosmetyka = ['Google Sites zamiast realnej strony'];
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /figuruje jednocześnie w mocne_przeslanki i co_jest_kosmetyka/.test(e)));
});

test('obserwacja z żargonem technicznym → błąd', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC({
    przekazanie: { do_importu: true, obserwacja_do_maila: 'Strona ma słaby LCP i brak SSL, co widać w narzędziu.' },
  });
  writeAudytDane(dir, dane);
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /żargon techniczny/.test(e)));
});

test('email spoza źródeł → błąd (wygląda na zgadnięty)', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC({ email: 'zgadniety@example.com' });
  writeAudytDane(dir, dane);
  writeLeadInfo(dir, { mail_zablokowany: false, powod_blokady: null, email: 'prawdziwy@kancelaria.pl' });
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /wygląda na zgadnięty/.test(e)));
});

test('email obecny w lead-info.json → brak błędu', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC({ email: 'prawdziwy@kancelaria.pl' });
  writeAudytDane(dir, dane);
  writeLeadInfo(dir, { mail_zablokowany: false, powod_blokady: null, email: 'prawdziwy@kancelaria.pl' });
  const { errors } = validateDir(dir);
  assert.ok(!errors.some(e => /wygląda na zgadnięty/.test(e)));
});

test('stary schemat (brak kwalifikacja_leada) → warning, nie error', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, { scoreOgolny: 55, priorytet: 'sredni' });
  const { schemat, errors, warnings } = validateDir(dir);
  assert.equal(schemat, 'stary');
  assert.deepEqual(errors, []);
  assert.ok(warnings.length > 0);
});

test('mail-observation.txt zgodny z przekazanie.obserwacja_do_maila → brak ostrzeżenia', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  writeAudytDane(dir, dane);
  fs.writeFileSync(path.join(dir, 'mail-observation.txt'), dane.przekazanie.obserwacja_do_maila);
  const { warnings } = validateDir(dir);
  assert.ok(!warnings.some(w => /różni się od przekazanie.obserwacja_do_maila/.test(w)));
});

test('mail-fragment.txt (legacy) różny od przekazanie.obserwacja_do_maila → ostrzeżenie', () => {
  const dir = mkFixtureDir();
  const dane = basePISAC();
  writeAudytDane(dir, dane);
  fs.writeFileSync(path.join(dir, 'mail-fragment.txt'), 'zupełnie inny tekst');
  const { warnings } = validateDir(dir);
  assert.ok(warnings.some(w => /różni się od przekazanie.obserwacja_do_maila/.test(w)));
});

test('mail-observation.txt istnieje mimo ODPUŚCIĆ → błąd', () => {
  const dir = mkFixtureDir();
  writeAudytDane(dir, baseODPUSC());
  fs.writeFileSync(path.join(dir, 'mail-observation.txt'), 'nie powinno tu być');
  const { errors } = validateDir(dir);
  assert.ok(errors.some(e => /nie pozwala na obserwację/.test(e)));
});

// ═══════════════════════════════════════════════════════════════════════
section('csv-utils.js — parser i normalizacja');
// ═══════════════════════════════════════════════════════════════════════

test('legacy CSV z przecinkiem w nazwie (fallback split na ostatnim polu)', () => {
  const csv = 'nazwa,url\nKancelaria Kowalski, Nowak i Wspólnicy,https://przyklad.pl\n';
  const { format, leads } = csvUtils.parseLeadsCsv(csv);
  assert.equal(format, 'legacy');
  assert.equal(leads.length, 1);
  assert.equal(leads[0].nazwa, 'Kancelaria Kowalski, Nowak i Wspólnicy');
  assert.equal(leads[0].url, 'https://przyklad.pl');
});

test('rozszerzony CSV: cudzysłowy, BOM, puste pola, wieloliniowa notatka, średniki', () => {
  const header = ['lead_id', 'nazwa', 'miasto', 'url', 'telefon', 'email', 'imie_kontaktowe',
    'status', 'do_not_contact', 'notatki', 'data_M1', 'gmail_thread_id', 'totalScore',
    'reviewsCount', 'imagesCount', 'categories', 'placeId', 'permanentlyClosed'].join(';');
  const cols = [
    'FW-0001', '"Kancelaria ""Test"" sp. z o.o."', 'Warszawa', 'kancelaria-test.pl',
    '', '', '', '', 'false', '"Notatka\nw dwóch liniach"', '', '', '4.8', '12', '',
    '"prawnik,radca prawny"', '', 'false',
  ];
  const csv = '﻿' + header + '\r\n' + cols.join(';') + '\r\n';
  const { format, leads } = csvUtils.parseLeadsCsv(csv);
  assert.equal(format, 'extended');
  assert.equal(leads.length, 1);
  const L = leads[0];
  assert.equal(L.nazwa, 'Kancelaria "Test" sp. z o.o.');
  assert.equal(L.miasto, 'Warszawa');
  assert.equal(L.url, 'https://kancelaria-test.pl');
  assert.equal(L.telefon, null);
  assert.equal(L.do_not_contact, false);
  assert.ok(L.notatki.includes('\n'), 'notatka powinna zachować wewnętrzny newline');
  assert.equal(L.totalScore, 4.8);
  assert.deepEqual(L.categories, ['prawnik', 'radca prawny']);
  assert.equal(L.placeId, null);
  assert.equal(L.permanentlyClosed, false);
});

test('separator wykrywany ze średnika, gdy nagłówek ma więcej średników niż przecinków', () => {
  assert.equal(csvUtils.detectDelim('nazwa;url\nKancelaria Nowak;https://nowak.pl\n'), ';');
  assert.equal(csvUtils.detectDelim('nazwa,url\nKancelaria Nowak,https://nowak.pl\n'), ',');
});

test('polskie znaki zachowane w nazwie', () => {
  const { leads } = csvUtils.parseLeadsCsv('nazwa,url\nKancelaria Żółć Ćma,https://zolc.pl\n');
  assert.equal(leads[0].nazwa, 'Kancelaria Żółć Ćma');
});

test('isContactBlocked — do_not_contact', () => {
  assert.deepEqual(csvUtils.isContactBlocked({ do_not_contact: true }), { blocked: true, reason: 'do_not_contact' });
});

test('isContactBlocked — notatka NIE KONTAKTOWAĆ (bez diakrytyków)', () => {
  const r = csvUtils.isContactBlocked({ notatki: 'proszę nie kontaktować, sprawa zamknięta' });
  assert.equal(r.blocked, true);
});

test('isContactBlocked — status blokujący M1_WYSŁANY', () => {
  assert.equal(csvUtils.isContactBlocked({ status: 'M1_WYSŁANY' }).blocked, true);
});

test('isContactBlocked — status nieblokujący', () => {
  assert.equal(csvUtils.isContactBlocked({ status: 'NOWY' }).blocked, false);
});

test('normalizeDomain usuwa www, ścieżkę i query string', () => {
  assert.equal(csvUtils.normalizeDomain('https://www.Kancelaria.pl/kontakt?x=1'), 'kancelaria.pl');
});

test('normalizePhone odcina prefiks 48 i formatowanie', () => {
  assert.equal(csvUtils.normalizePhone('+48 512 407 191'), '512407191');
});

test('domainOf usuwa query string i końcowy ukośnik z nazwy folderu', () => {
  assert.equal(csvUtils.domainOf('https://kancelaria.pl/?utm_source=x'), 'kancelaria.pl');
});

test('buildCsv dodaje BOM i CRLF', () => {
  const out = csvUtils.buildCsv(['a', 'b'], [['1', '2']], ';');
  assert.ok(out.startsWith('﻿'));
  assert.ok(out.includes('\r\n'));
});

test('csvEscape cudzysłowuje tylko pola z separatorem/cudzysłowem/newline', () => {
  assert.equal(csvUtils.csvEscape('a;b', ';'), '"a;b"');
  assert.equal(csvUtils.csvEscape('proste', ';'), 'proste');
});

// ═══════════════════════════════════════════════════════════════════════
section('batch-report.js (proces potomny, fixture output/)');
// ═══════════════════════════════════════════════════════════════════════

function writeQualifiedFixture(baseDir, domain, { decyzja, razem, A = 2, B = 2, C = 2, D, scoreAudytu = 40, nazwa }) {
  const dir = path.join(baseDir, domain);
  fs.mkdirSync(dir, { recursive: true });
  const dEff = D != null ? D : Math.max(0, razem - A - B - C);
  const dane = {
    nazwa,
    priorytet_wizualny: 'wysoki',
    score_audytu_0_100: scoreAudytu,
    tier_audytu: 'niski',
    kwalifikacja_leada: {
      decyzja,
      scoring_0_8: {
        potrzeba_przebudowy: wymiar(A, 'x'),
        potencjal_finansowy: wymiar(B, 'x'),
        skala_poprawy: wymiar(C, 'x'),
        naturalny_powod_kontaktu: wymiar(dEff, 'x'),
        razem,
      },
      glowny_problem: 'problem',
      powod_biznesowy: 'powod',
      mocne_przeslanki: decyzja === 'PISAĆ' ? ['przesłanka mocna jeden', 'przesłanka mocna dwa'] : [],
      co_jest_kosmetyka: [],
      sprawdzone_podstrony: [],
      pewnosc_oceny: 'pelna',
    },
    przekazanie: decyzja === 'PISAĆ'
      ? { do_importu: true, obserwacja_do_maila: `Obserwacja dla ${nazwa}.` }
      : { do_importu: false, obserwacja_do_maila: null },
    status_sugerowany: decyzja === 'PISAĆ' ? 'DO_IMPORTU' : 'ODPUŚCIĆ',
  };
  fs.writeFileSync(path.join(dir, 'audyt-dane.json'), JSON.stringify(dane, null, 2));
}

test('batch-leady.csv: PISAĆ > ODPUŚCIĆ > stare/wstępne, scoring malejąco, score_audytu bez wpływu', () => {
  const base = mkFixtureDir();
  writeQualifiedFixture(base, 'domainb.pl', { decyzja: 'PISAĆ', razem: 8, A: 2, B: 2, C: 2, D: 2, scoreAudytu: 40, nazwa: 'Kancelaria B' });
  writeQualifiedFixture(base, 'domaina.pl', { decyzja: 'PISAĆ', razem: 7, A: 2, B: 2, C: 2, D: 1, scoreAudytu: 40, nazwa: 'Kancelaria A pierwsza' });
  writeQualifiedFixture(base, 'domainz.pl', { decyzja: 'PISAĆ', razem: 7, A: 2, B: 2, C: 2, D: 1, scoreAudytu: 95, nazwa: 'Kancelaria Z druga' });
  writeQualifiedFixture(base, 'domainc.pl', { decyzja: 'ODPUŚCIĆ', razem: 2, A: 0, B: 1, C: 1, D: 0, scoreAudytu: 90, nazwa: 'Kancelaria C' });

  const oldDir = path.join(base, 'domaind.pl');
  fs.mkdirSync(oldDir, { recursive: true });
  fs.writeFileSync(path.join(oldDir, 'audyt-dane.json'), JSON.stringify({ nazwa: 'Kancelaria D stara', scoreOgolny: 55 }, null, 2));

  const csvPath = path.join(base, 'lista.csv');
  fs.writeFileSync(csvPath,
    'nazwa,url\n'
    + 'Kancelaria B,https://domainb.pl\n'
    + 'Kancelaria A pierwsza,https://domaina.pl\n'
    + 'Kancelaria Z druga,https://domainz.pl\n'
    + 'Kancelaria C,https://domainc.pl\n'
    + 'Kancelaria D stara,https://domaind.pl\n');

  execFileSync(process.execPath, ['batch-report.js', csvPath], {
    cwd: SCRIPTS_DIR,
    env: Object.assign({}, process.env, { AUDYT_OUTPUT_DIR: base }),
  });

  const out = fs.readFileSync(path.join(base, 'batch-leady.csv'), 'utf8');
  assert.ok(out.startsWith('﻿'), 'brak BOM');
  assert.ok(out.includes('\r\n'), 'brak CRLF');
  assert.ok(!/temat_M1|tresc_M1/.test(out), 'nagłówek nie powinien mieć temat_M1/tresc_M1');

  const lines = out.replace(/^﻿/, '').split('\r\n').filter(Boolean);
  const header = lines[0].split(';');
  const nazwaIdx = header.indexOf('nazwa');
  const kolejnosc = lines.slice(1).map(l => l.split(';')[nazwaIdx]);
  assert.deepEqual(kolejnosc, [
    'Kancelaria B',
    'Kancelaria A pierwsza',
    'Kancelaria Z druga',
    'Kancelaria C',
    'Kancelaria D stara',
  ]);
});

test('batch-pominiete.csv: duplikaty domeny i firmy zamknięte', () => {
  const base = mkFixtureDir();
  writeQualifiedFixture(base, 'domaine.pl', { decyzja: 'PISAĆ', razem: 7, A: 2, B: 2, C: 2, D: 1, nazwa: 'Kancelaria E' });

  const header = 'lead_id,nazwa,miasto,url,telefon,email,imie_kontaktowe,status,do_not_contact,notatki,data_M1,gmail_thread_id,totalScore,reviewsCount,imagesCount,categories,placeId,permanentlyClosed';
  const rows = [
    ['1', 'Kancelaria E', '', 'https://domaine.pl', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2', 'Kancelaria E duplikat', '', 'https://domaine.pl', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['3', 'Kancelaria Zamknieta', '', 'https://zamknieta.pl', '', '', '', '', '', '', '', '', '', '', '', '', '', 'true'],
  ].map(r => r.join(','));
  const csvPath = path.join(base, 'lista.csv');
  fs.writeFileSync(csvPath, header + '\n' + rows.join('\n') + '\n');

  execFileSync(process.execPath, ['batch-report.js', csvPath], {
    cwd: SCRIPTS_DIR,
    env: Object.assign({}, process.env, { AUDYT_OUTPUT_DIR: base }),
  });

  const pom = fs.readFileSync(path.join(base, 'batch-pominiete.csv'), 'utf8');
  assert.ok(pom.includes('duplikat (domena)'), 'brak wpisu o duplikacie domeny');
  assert.ok(pom.includes('firma zamkni'), 'brak wpisu o firmie zamkniętej');
});

// ═══════════════════════════════════════════════════════════════════════
section('node --check — składnia skryptów');
// ═══════════════════════════════════════════════════════════════════════

['scrape.js', 'csv-utils.js', 'batch-report.js', 'validate-lead.js', 'push-import.js', 'log-odrzucone.js']
  .forEach(f => {
    test(`node --check ${f}`, () => {
      execFileSync(process.execPath, ['--check', f], { cwd: SCRIPTS_DIR });
    });
  });

// ── sprzątanie + podsumowanie ────────────────────────────────────────────
for (const d of tmpDirs) {
  try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* best effort */ }
}

console.log(`\n${passed} OK, ${failed} błędów (razem ${passed + failed})`);
if (failed) {
  console.log('\nNieudane:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error.message}`));
  process.exit(1);
}
