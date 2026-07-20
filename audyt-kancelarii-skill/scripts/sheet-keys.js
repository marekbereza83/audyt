/**
 * sheet-keys.js — klucze dedupu z arkusza, pobierane ZANIM audyt spali budżet Firecrawl.
 *
 * Webhook (sheets/Code.gs → doGet ?akcja=klucze) liczy klucze z „Trackera" i „Claude_import".
 * Ten moduł je pobiera i produkuje klucze dla rekordu lokalnego w DOKŁADNIE tym samym formacie
 * (`e:`/`t:`/`d:`), żeby porównanie było 1:1.
 *
 * UWAGA — normalizacja jest celowo skopiowana z Code.gs, a nie wzięta z csv-utils.js.
 * csv-utils ma luźniejsze warianty (`normalizeDomain` nie obcina portu ani nie waliduje,
 * `normalizePhone` nie radzi sobie z prefiksem `0048`) — użycie ich tutaj przepuszczałoby
 * duplikaty. Jeśli zmienisz normalizację w Code.gs, zmień ją też tutaj.
 */

const KLUCZE_TTL_MS = 10 * 60 * 1000; // cache w pamięci procesu — arkusz nie zmienia się w trakcie paczki

// ── Normalizacja (lustro Code.gs) ────────────────────────────────────

/** E-mail → lowercase, tylko jeśli wygląda jak adres. */
function normEmail(v) {
  const s = String(v || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : null;
}

/** Telefon → ostatnie 9 cyfr krajowych (odcina +48, 0048, spacje, myślniki). */
function normTel(v) {
  const cyfry = String(v || '').replace(/\D/g, '');
  if (cyfry.length < 9) return null;
  const last9 = cyfry.slice(-9);
  return /^\d{9}$/.test(last9) ? last9 : null;
}

/** Domena bez schematu, www, ścieżki, query i portu. Zwraca null dla tekstu, który nie jest URL-em. */
function normDomena(v) {
  let s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.split(/[\/?#]/)[0];
  s = s.replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return null; // „Adwokat Ełk" → null
  return s;
}

/**
 * Klucze dedupu jednego rekordu, w formacie zgodnym z arkuszem.
 * Rekord bez ANI JEDNEGO klucza jest nieidentyfikowalny — dzwoniący musi to obsłużyć
 * (webhook zwraca takie jako `bez_klucza` / „DO RĘCZNEJ WERYFIKACJI").
 */
function kluczeRekordu({ www, tel, email }) {
  const k = [];
  const e = normEmail(email); if (e) k.push('e:' + e);
  const t = normTel(tel);     if (t) k.push('t:' + t);
  const d = normDomena(www);  if (d) k.push('d:' + d);
  return k;
}

// ── Pobranie kluczy z arkusza ────────────────────────────────────────

let cache = null; // { czas, klucze:Set }

/**
 * Pobiera zbiór kluczy z arkusza (Tracker + Claude_import).
 * Wymaga SHEETS_URL i SHEETS_SECRET w env (patrz sheets/README.md).
 *
 * @param {boolean} force pomiń cache procesu
 * @returns {Promise<Set<string>>}
 */
async function pobierzKlucze(force = false) {
  if (!force && cache && Date.now() - cache.czas < KLUCZE_TTL_MS) return cache.klucze;

  const url = process.env.SHEETS_URL;
  const sekret = process.env.SHEETS_SECRET;
  if (!url) throw new Error('Brak SHEETS_URL w scripts/.env — patrz sheets/README.md');
  if (!sekret) throw new Error('Brak SHEETS_SECRET w scripts/.env — tryb ?akcja=klucze go wymaga');

  const pelny = `${url}?akcja=klucze&sekret=${encodeURIComponent(sekret)}`;
  const res = await fetch(pelny, { redirect: 'follow' });
  const txt = await res.text();

  let json;
  try {
    json = JSON.parse(txt);
  } catch {
    throw new Error(
      'Webhook nie zwrócił JSON-a. Najczęstsza przyczyna: wdrożenie serwuje starą wersję Code.gs ' +
      '(tryb ?akcja=klucze doszedł później) — Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa.\n' +
      'Odpowiedź: ' + txt.slice(0, 200)
    );
  }
  if (!json.ok) throw new Error('Webhook odmówił: ' + (json.blad || 'nieznany błąd'));
  if (!Array.isArray(json.klucze)) throw new Error('Webhook nie zwrócił pola `klucze` — sprawdź wersję wdrożenia.');

  cache = { czas: Date.now(), klucze: new Set(json.klucze) };
  return cache.klucze;
}

module.exports = { normEmail, normTel, normDomena, kluczeRekordu, pobierzKlucze };
