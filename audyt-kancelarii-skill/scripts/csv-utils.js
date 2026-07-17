/**
 * csv-utils.js — wspólny parser CSV + normalizacja leadów dla scrape.js i batch-report.js.
 *
 * Obsługiwane formaty wejściowe:
 *   1. Legacy:      nazwa,url                (nazwa może zawierać nieotoczone cudzysłowem przecinki —
 *                                             wtedy fallback: split na OSTATNIM separatorze, jak dotąd)
 *   2. Rozszerzony: lead_id,nazwa,miasto,url,telefon,email,imie_kontaktowe,status,do_not_contact,
 *                   notatki,data_M1,gmail_thread_id,totalScore,reviewsCount,imagesCount,categories,
 *                   placeId,permanentlyClosed
 *                   (kolumny rozpoznawane po nazwie w nagłówku — kolejność dowolna, brakujące = puste)
 *
 * Parser jest maszyną stanów znak-po-znaku: poprawnie obsługuje cudzysłowy (""), przecinki i średniki
 * w polach, BOM, CRLF, nowe linie WEWNĄTRZ pól w cudzysłowie, polskie znaki i puste wartości.
 * Separator wykrywany z nagłówka (średnik, jeśli w nagłówku jest go więcej niż przecinków).
 */

'use strict';

// Domena → nazwa katalogu w output/ (jedna definicja dla scrape.js i batch-report.js).
// Usuwa query string/fragment PRZED sanityzacją — Windows nie pozwala na ?/& w nazwach
// folderów, a linki z Google Business Profile często mają doklejone ?utm_source=... itd.
function domainOf(u) {
  return String(u || '')
    .replace(/^https?:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/[\/:]/g, '_')
    .replace(/_+$/, '');
}

// Znormalizowana domena do deduplikacji: bez schematu, www., ścieżki, małe litery.
function normalizeDomain(u) {
  return String(u || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[\/?#].*$/, '')
    .trim();
}

// Znormalizowany telefon do deduplikacji: same cyfry, bez prefiksu 48.
function normalizePhone(p) {
  const digits = String(p || '').replace(/\D/g, '');
  return digits.replace(/^48(?=\d{9}$)/, '');
}

// Usuwa polskie diakrytyki — do porównań statusów/notatek niezależnie od pisowni.
function stripDiacritics(s) {
  return String(s || '')
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ż/g, 'z').replace(/ź/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L')
    .replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ż/g, 'Z').replace(/Ź/g, 'Z');
}

// ── Parser niskopoziomowy ───────────────────────────────────────────────
// Zwraca tablicę wierszy (każdy = tablica pól) — bez interpretacji nagłówka.
function parseCsvRaw(text, delim) {
  const src = String(text || '').replace(/^﻿/, ''); // BOM
  const rows = [];
  let row = [], field = '', inQ = false, i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inQ) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === delim) { row.push(field); field = ''; i++; continue; }
    if (c === '\r' && src[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 2; continue; }
    if (c === '\n' || c === '\r') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  row.push(field);
  rows.push(row);
  // odfiltruj wiersze całkiem puste (np. końcowy newline)
  return rows.filter(r => r.some(f => String(f).trim().length > 0));
}

function detectDelim(text) {
  const firstLine = String(text || '').replace(/^﻿/, '').split(/\r?\n/, 1)[0] || '';
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semis > commas ? ';' : ',';
}

// ── Normalizacja rekordu leada ─────────────────────────────────────────
const EXTENDED_COLUMNS = [
  'lead_id', 'nazwa', 'miasto', 'url', 'telefon', 'email', 'imie_kontaktowe',
  'status', 'do_not_contact', 'notatki', 'data_m1', 'gmail_thread_id',
  'totalscore', 'reviewscount', 'imagescount', 'categories', 'placeid', 'permanentlyclosed',
];

function truthyFlag(v) {
  return /^(true|tak|yes|1|x)$/i.test(String(v == null ? '' : v).trim());
}

function toNumberOrNull(v) {
  const s = String(v == null ? '' : v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function ensureScheme(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : 'https://' + u;
}

function emptyLead() {
  return {
    lead_id: null, nazwa: '', miasto: null, url: '', telefon: null, email: null,
    imie_kontaktowe: null, status: null, do_not_contact: false, notatki: null,
    data_M1: null, gmail_thread_id: null,
    totalScore: null, reviewsCount: null, imagesCount: null, categories: [],
    placeId: null, permanentlyClosed: false,
  };
}

/**
 * parseLeadsCsv(text) → { format: 'legacy'|'extended', leads: [...] }
 * Każdy lead ma pełny zestaw pól (brakujące = null/''/false), url z dopisanym https://.
 */
function parseLeadsCsv(text) {
  const delim = detectDelim(text);
  const rows = parseCsvRaw(text, delim);
  if (!rows.length) return { format: 'legacy', leads: [] };

  const headerNorm = rows[0].map(h => stripDiacritics(String(h).trim().toLowerCase()));
  const isExtended = headerNorm.includes('url') &&
    headerNorm.some(h => EXTENDED_COLUMNS.includes(h) && h !== 'url' && h !== 'nazwa');

  if (isExtended) {
    const idx = {};
    headerNorm.forEach((h, i) => { if (!(h in idx)) idx[h] = i; });
    const get = (r, col) => {
      const i = idx[col];
      const v = i == null ? '' : String(r[i] == null ? '' : r[i]).trim();
      return v === '' ? null : v;
    };
    const leads = rows.slice(1).map(r => {
      const L = emptyLead();
      L.lead_id = get(r, 'lead_id');
      L.nazwa = get(r, 'nazwa') || '';
      L.miasto = get(r, 'miasto');
      L.url = ensureScheme(get(r, 'url') || '');
      L.telefon = get(r, 'telefon');
      L.email = get(r, 'email');
      L.imie_kontaktowe = get(r, 'imie_kontaktowe');
      L.status = get(r, 'status');
      L.do_not_contact = truthyFlag(get(r, 'do_not_contact'));
      L.notatki = get(r, 'notatki');
      L.data_M1 = get(r, 'data_m1');
      L.gmail_thread_id = get(r, 'gmail_thread_id');
      L.totalScore = toNumberOrNull(get(r, 'totalscore'));
      L.reviewsCount = toNumberOrNull(get(r, 'reviewscount'));
      L.imagesCount = toNumberOrNull(get(r, 'imagescount'));
      const cats = get(r, 'categories');
      L.categories = cats ? cats.split(/[|,]/).map(s => s.trim()).filter(Boolean) : [];
      L.placeId = get(r, 'placeid');
      L.permanentlyClosed = truthyFlag(get(r, 'permanentlyclosed'));
      return L;
    });
    return { format: 'extended', leads };
  }

  // Legacy: nazwa,url — nagłówek opcjonalny. Wiersz z >2 polami = nieotoczone
  // przecinki w nazwie → fallback: wszystko przed OSTATNIM polem to nazwa.
  const dataRows = (headerNorm[0] === 'nazwa' && headerNorm[1] === 'url') ? rows.slice(1) : rows;
  const leads = dataRows
    .map(r => {
      let nazwa, url;
      if (r.length >= 2) {
        url = String(r[r.length - 1] || '').trim();
        nazwa = r.slice(0, -1).join(delim).trim();
      } else {
        return null;
      }
      if (!url || url.toLowerCase() === 'url') return null;
      const L = emptyLead();
      L.nazwa = nazwa;
      L.url = ensureScheme(url);
      return L;
    })
    .filter(Boolean);
  return { format: 'legacy', leads };
}

// ── Blokada ponownego kontaktu ─────────────────────────────────────────
// Statusy operacyjne, przy których NIE wolno wygenerować nowego maila M1.
const BLOCKED_STATUSES = [
  'ZAMKNIETY', 'ODPOWIEDZIAL', 'ROZMOWA', 'KLIENT',
  'M1_WYSLANY', 'FU1_WYSLANY', 'FU2_WYSLANY',
];

/**
 * isContactBlocked(lead) → { blocked, reason } — czy wolno wygenerować mail M1.
 * Audyt można zaktualizować mimo blokady; blokada dotyczy wyłącznie maila.
 */
function isContactBlocked(lead) {
  if (!lead) return { blocked: false, reason: null };
  if (lead.do_not_contact) return { blocked: true, reason: 'do_not_contact' };
  const notatki = stripDiacritics(String(lead.notatki || '')).toUpperCase();
  if (notatki.includes('NIE KONTAKTOWAC')) return { blocked: true, reason: 'notatka: NIE KONTAKTOWAĆ' };
  const status = stripDiacritics(String(lead.status || '')).toUpperCase().trim().replace(/\s+/g, '_');
  if (status && BLOCKED_STATUSES.includes(status)) return { blocked: true, reason: 'status: ' + (lead.status || '').trim() };
  return { blocked: false, reason: null };
}

// ── Zapis CSV ──────────────────────────────────────────────────────────
// Escapowanie pola: cudzysłów gdy pole zawiera separator, cudzysłów lub nową linię.
function csvEscape(v, sep) {
  const s = String(v == null ? '' : v);
  const needsQuote = s.includes(sep) || /["\n\r]/.test(s);
  return needsQuote ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Buduje treść pliku CSV: BOM UTF-8 + CRLF (polski Excel).
function buildCsv(headerCols, rows, sep) {
  const lines = [headerCols.map(c => csvEscape(c, sep)).join(sep)];
  for (const r of rows) lines.push(r.map(c => csvEscape(c, sep)).join(sep));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

module.exports = {
  domainOf, normalizeDomain, normalizePhone, stripDiacritics,
  parseCsvRaw, detectDelim, parseLeadsCsv,
  isContactBlocked, BLOCKED_STATUSES,
  csvEscape, buildCsv, truthyFlag, ensureScheme,
};
