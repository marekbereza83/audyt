/**
 * FORMA — webhook zapisu „rodzynków" (7–8/8) do zakładki „Claude_import".
 *
 * Wdrożenie opisuje sheets/README.md. W skrócie:
 *   1. Rozszerzenia → Apps Script w arkuszu FORMA-cold-outreach-tracker
 *   2. wklej ten plik, uruchom setup() raz (tworzy „Claude_import" + sekret)
 *   3. Wdróż → Nowe wdrożenie → Aplikacja internetowa → dostęp „Wszyscy"
 *   4. URL wdrożenia + sekret trafiają do scripts/.env
 *
 * ZASADA NADRZĘDNA: „Tracker" jest tylko do ODCZYTU (kontrola duplikatów).
 * Ten skrypt nigdy do niego nie pisze, nie rusza formuł, formatowania ani statusów.
 */

const ARKUSZ_IMPORT = 'Claude_import';
const ARKUSZ_TRACKER = 'Tracker';

/**
 * Kolumny „Claude_import".
 * Pierwsze 13 to kolumny C..O „Trackera" w dokładnie tej samej kolejności i pod tymi samymi
 * nazwami — dzięki temu zatwierdzony blok wkleja się do Trackera bez mapowania pól.
 * Reszta to ślad audytu (rozbicie punktacji, przesłanki) — zostaje w imporcie, do Trackera nie idzie.
 * `status_importu` (ostatnia) śledzi przejęcie rekordu przez drugą automatyzację (ChatGPT):
 * ten webhook zawsze zapisuje „NOWY" — na „PRZEJĘTY" zmienia go już tamta automatyzacja.
 */
const KOLUMNY = [
  'Nazwa kancelarii', 'Miasto', 'Strona www', 'Telefon', 'Email',
  'priorytet_wizualny', 'decyzja', 'scoring_0_8', 'glowny_problem',
  'obserwacja_do_maila', 'powod_biznesowy', 'zrodlo_audytu', 'data_audytu',
  // ── poniżej: wyłącznie Claude_import, nie ma odpowiednika w Trackerze ──
  'potrzeba_0_2', 'potencjal_0_2', 'skala_poprawy_0_2', 'powod_kontaktu_0_2',
  'mocne_przeslanki', 'co_jest_kosmetyka', 'sprawdzone_podstrony', 'data_dodania',
  'status_importu',
];
const BLOK_TRACKERA = 13; // ile pierwszych kolumn wkleja się 1:1 do Trackera (C..O)
const STATUS_IMPORTU_NOWY = 'NOWY';

// ── Normalizacja kluczy dedupu ───────────────────────────────────────
// Kolejność ważności: email > telefon > domena. Email jest w Trackerze wypełniony wszędzie
// i unikalny; „Strona www" bywa opisem zamiast URL-a (FW-0006 = „Adwokat Ełk"), więc domena
// sama w sobie przepuściłaby taki wiersz jako nowy.

function normEmail(v) {
  const s = String(v || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : null;
}

/** Telefon → 9 cyfr krajowych (odcina +48, spacje, myślniki, nawiasy). */
function normTel(v) {
  const cyfry = String(v || '').replace(/\D/g, '');
  if (cyfry.length < 9) return null;
  const last9 = cyfry.slice(-9);
  return /^\d{9}$/.test(last9) ? last9 : null;
}

/** Domena bez http/https, www i końcowego ukośnika. Zwraca null dla wartości, które nie są URL-em. */
function normDomena(v) {
  let s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.split(/[\/?#]/)[0];                 // ścieżka, query, fragment
  s = s.replace(/:\d+$/, '');               // port
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return null;  // „Adwokat Ełk" → null
  return s;
}

/** Wszystkie klucze dedupu jednego wiersza. */
function kluczeWiersza(nazwa, miasto, www, tel, email) {
  const k = [];
  const e = normEmail(email);      if (e) k.push('e:' + e);
  const t = normTel(tel);          if (t) k.push('t:' + t);
  const d = normDomena(www);       if (d) k.push('d:' + d);
  return k;
}

// ── Odczyt istniejących kluczy ───────────────────────────────────────

/** Mapa nazwa_kolumny → indeks (0-based), po wierszu nagłówka. */
function mapaNaglowkow(wiersz) {
  const m = {};
  wiersz.forEach((h, i) => {
    const nazwa = String(h || '').trim();
    if (nazwa && !(nazwa in m)) m[nazwa] = i;
  });
  return m;
}

/**
 * Znajduje wiersz nagłówka w zakładce (Tracker ma nad tabelą wiersze opisowe).
 * Szuka pierwszego wiersza zawierającego „Email".
 */
function znajdzNaglowek(dane) {
  for (let i = 0; i < Math.min(dane.length, 20); i++) {
    if (dane[i].some(c => String(c || '').trim() === 'Email')) return i;
  }
  return -1;
}

/** Zbiór kluczy dedupu z jednej zakładki. Tylko odczyt. */
function zbierzKlucze(nazwaArkusza) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nazwaArkusza);
  const klucze = new Set();
  if (!sh) return klucze;
  const dane = sh.getDataRange().getValues();
  const iNag = znajdzNaglowek(dane);
  if (iNag < 0) return klucze;
  const H = mapaNaglowkow(dane[iNag]);
  const get = (r, nazwa) => (nazwa in H ? r[H[nazwa]] : '');
  for (let i = iNag + 1; i < dane.length; i++) {
    const r = dane[i];
    if (r.every(c => String(c || '').trim() === '')) continue;
    kluczeWiersza(
      get(r, 'Nazwa kancelarii'), get(r, 'Miasto'),
      get(r, 'Strona www'), get(r, 'Telefon'), get(r, 'Email')
    ).forEach(k => klucze.add(k));
  }
  return klucze;
}

// ── Setup / diagnostyka (uruchamiane ręcznie z edytora) ──────────────

/** Tworzy „Claude_import" z nagłówkami i generuje sekret. Bezpieczne do ponownego uruchomienia. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ARKUSZ_IMPORT);
  if (!sh) {
    sh = ss.insertSheet(ARKUSZ_IMPORT);
    sh.getRange(1, 1, 1, KOLUMNY.length).setValues([KOLUMNY]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // wizualna granica bloku, który wkleja się do Trackera
    sh.getRange(1, BLOK_TRACKERA).setBorder(null, null, null, true, null, null, '#999', SpreadsheetApp.BorderStyle.SOLID_THICK);
    Logger.log('Utworzono zakładkę „%s" (%s kolumn).', ARKUSZ_IMPORT, KOLUMNY.length);
  } else {
    Logger.log('Zakładka „%s" już istnieje — nie ruszam.', ARKUSZ_IMPORT);
  }

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SEKRET')) {
    const sekret = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('SEKRET', sekret);
    Logger.log('SEKRET (skopiuj do scripts/.env jako SHEETS_SECRET): %s', sekret);
  } else {
    Logger.log('SEKRET już ustawiony: %s', props.getProperty('SEKRET'));
  }
}

/** Wypisuje nagłówki obu zakładek i liczbę kluczy dedupu — do sprawdzenia po zmianach w arkuszu. */
function diagnose() {
  [ARKUSZ_TRACKER, ARKUSZ_IMPORT].forEach(n => {
    const sh = SpreadsheetApp.getActive().getSheetByName(n);
    if (!sh) { Logger.log('%s: BRAK ZAKŁADKI', n); return; }
    const dane = sh.getDataRange().getValues();
    const i = znajdzNaglowek(dane);
    Logger.log('%s: nagłówek w wierszu %s → %s', n, i + 1, i < 0 ? '(nie znaleziono)' : dane[i].filter(String).join(' | '));
    Logger.log('%s: %s kluczy dedupu z %s wierszy danych', n, zbierzKlucze(n).size, Math.max(0, dane.length - i - 1));
  });
}

// ── Webhook ──────────────────────────────────────────────────────────

function odpowiedz(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** GET — sprawdzenie, czy wdrożenie żyje. Nie zwraca danych z arkusza. */
function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(ARKUSZ_IMPORT);
  return odpowiedz({ ok: true, import_gotowy: !!sh, kolumny: KOLUMNY.length });
}

/**
 * POST — dopisuje rodzynki do „Claude_import".
 * Body: { "sekret": "...", "leady": [ { "Nazwa kancelarii": "...", ... }, ... ] }
 *
 * Odrzuca wszystko, co nie jest 7–8/8 z decyzją PISAĆ (zasady 5–6 procesu),
 * oraz duplikaty względem „Trackera" i „Claude_import".
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return odpowiedz({ ok: false, blad: 'niepoprawny JSON' });
  }

  const sekret = PropertiesService.getScriptProperties().getProperty('SEKRET');
  if (!sekret || body.sekret !== sekret) {
    return odpowiedz({ ok: false, blad: 'zły sekret' });
  }

  const leady = Array.isArray(body.leady) ? body.leady : [];
  if (!leady.length) return odpowiedz({ ok: false, blad: 'pusta lista leadów' });

  // Blokada: do arkusza pisze też druga automatyzacja — bez tego dedup mógłby przegapić
  // wiersz dopisany między odczytem kluczy a zapisem.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return odpowiedz({ ok: false, blad: 'arkusz zajęty — spróbuj ponownie' });
  }

  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(ARKUSZ_IMPORT);
    if (!sh) return odpowiedz({ ok: false, blad: 'brak zakładki ' + ARKUSZ_IMPORT + ' — uruchom setup()' });

    const znane = zbierzKlucze(ARKUSZ_TRACKER);
    zbierzKlucze(ARKUSZ_IMPORT).forEach(k => znane.add(k));

    const doZapisu = [];
    const raport = { zapisane: [], duplikaty: [], odrzucone: [], bez_klucza: [] };

    for (const lead of leady) {
      const nazwa = lead['Nazwa kancelarii'] || '(bez nazwy)';

      // Zasady 5–6: tylko 7–8/8 i tylko PISAĆ.
      const pkt = parseInt(String(lead['scoring_0_8'] || '').match(/\d+/), 10);
      if (!(pkt >= 7 && pkt <= 8)) {
        raport.odrzucone.push(nazwa + ' — scoring ' + (lead['scoring_0_8'] || '?'));
        continue;
      }
      if (String(lead['decyzja'] || '').trim().toUpperCase() !== 'PISAĆ') {
        raport.odrzucone.push(nazwa + ' — decyzja ' + (lead['decyzja'] || '?'));
        continue;
      }

      const klucze = kluczeWiersza(
        lead['Nazwa kancelarii'], lead['Miasto'],
        lead['Strona www'], lead['Telefon'], lead['Email']
      );

      // Brak jakiegokolwiek klucza = nie da się wiarygodnie sprawdzić duplikatu → nie zapisuj.
      if (!klucze.length) {
        raport.bez_klucza.push(nazwa + ' — DO RĘCZNEJ WERYFIKACJI');
        continue;
      }

      if (klucze.some(k => znane.has(k))) {
        raport.duplikaty.push(nazwa);
        continue;
      }

      klucze.forEach(k => znane.add(k));   // dedup także wewnątrz jednej paczki
      // status_importu zawsze NOWY przy zapisie — cokolwiek przyszło w payloadzie, ignorujemy.
      doZapisu.push(KOLUMNY.map(k => (k === 'status_importu' ? STATUS_IMPORTU_NOWY : (lead[k] != null ? lead[k] : ''))));
      raport.zapisane.push(nazwa);
    }

    if (doZapisu.length) {
      sh.getRange(sh.getLastRow() + 1, 1, doZapisu.length, KOLUMNY.length).setValues(doZapisu);
    }

    return odpowiedz({
      ok: true,
      zapisane: raport.zapisane.length,
      duplikaty: raport.duplikaty.length,
      odrzucone: raport.odrzucone.length,
      bez_klucza: raport.bez_klucza.length,
      szczegoly: raport,
    });
  } finally {
    lock.releaseLock();
  }
}
