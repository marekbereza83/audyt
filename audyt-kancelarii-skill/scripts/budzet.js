/**
 * budzet.js — licznik zużycia Firecrawl, żeby paczka nie przekroczyła darmowego limitu.
 *
 * Firecrawl jest najdroższą bramką pipeline'u i jedyną z twardym sufitem: darmowy plan to
 * 1 000 stron/mies (zweryfikowane w cenniku 2026-07 — wcześniejszy zapis „~500" w CLAUDE.md
 * był zaniżony dwukrotnie), a jeden pełny audyt to do ~5 wywołań (strona główna + do 4
 * podstron, +1 `mapUrl` przy fallbacku). 1000 ÷ 5 ≈ 200; domyślny limit to 160, czyli ~20%
 * zapasu na fallbacki `mapUrl` i ponowne próby po błędach.
 *
 * Stan: output/budzet-firecrawl.json — `{ "2026-07": { audyty: 12 } }`.
 * Licznik jest per miesiąc kalendarzowy i zeruje się sam wraz ze zmianą miesiąca.
 *
 * To licznik lokalny, nie odczyt z API Firecrawl — jeśli audytujesz z dwóch komputerów,
 * każdy liczy swoje (output/ jest gitignorowany). Traktuj go jako hamulec, nie jako
 * źródło prawdy o rachunku.
 */

const fs = require('fs');
const path = require('path');

const OUT_BASE = process.env.AUDYT_OUTPUT_DIR || path.join(__dirname, '..', 'output');
const PLIK = path.join(OUT_BASE, 'budzet-firecrawl.json');

const LIMIT = Number(process.env.FIRECRAWL_LIMIT_AUDYTOW || 160);

function miesiac() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function wczytaj() {
  try {
    return JSON.parse(fs.readFileSync(PLIK, 'utf8'));
  } catch {
    return {};
  }
}

function zapisz(stan) {
  fs.mkdirSync(OUT_BASE, { recursive: true });
  fs.writeFileSync(PLIK, JSON.stringify(stan, null, 1), 'utf8');
}

/** Ile audytów zużyto w bieżącym miesiącu. */
function zuzyte() {
  const stan = wczytaj();
  return (stan[miesiac()] && stan[miesiac()].audyty) || 0;
}

/** Ile audytów zostało do limitu (nigdy poniżej zera). */
function pozostalo() {
  return Math.max(0, LIMIT - zuzyte());
}

/** Dopisuje `n` zużytych audytów. */
function dolicz(n = 1) {
  const stan = wczytaj();
  const m = miesiac();
  if (!stan[m]) stan[m] = { audyty: 0 };
  stan[m].audyty += n;
  zapisz(stan);
  return stan[m].audyty;
}

/**
 * Sprawdza, czy paczka `ile` audytów zmieści się w limicie.
 * Zwraca `{ mozna, pozostalo, limit, zuzyte, przytnij }`, gdzie `przytnij` to liczba
 * audytów, którą realnie da się wykonać (0 = budżet wyczerpany).
 */
function sprawdz(ile) {
  const z = zuzyte();
  const p = Math.max(0, LIMIT - z);
  return { mozna: ile <= p, pozostalo: p, limit: LIMIT, zuzyte: z, przytnij: Math.min(ile, p) };
}

/** Jednolinijkowy opis stanu — do nagłówka batcha. */
function opis() {
  return `Budżet Firecrawl: ${zuzyte()}/${LIMIT} audytów w ${miesiac()} (zostało ${pozostalo()})`;
}

module.exports = { zuzyte, pozostalo, dolicz, sprawdz, opis, LIMIT, PLIK };
