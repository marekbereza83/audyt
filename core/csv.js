/**
 * core/csv.js — generyczny parser CSV po nagłówku.
 *
 * Odrębny od csv-utils.js w audycie kancelarii: tamten zna schemat leada
 * (do_not_contact, placeId, gmail_thread_id). Ten nie zna żadnego schematu —
 * zwraca wiersze jako obiekty wg nagłówka, więc ta sama funkcja obsłuży listę
 * sklepów, listę produktów i cokolwiek dojdzie później.
 */

function parseCsv(tekst) {
  const linie = tekst.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (linie.length < 2) return { naglowki: [], wiersze: [] };

  const rozbij = (linia) => {
    // Obsługa pól w cudzysłowach (przecinki w treści, np. w nazwie marki).
    const pola = [];
    let biezace = '';
    let wCudzyslowie = false;
    for (let i = 0; i < linia.length; i++) {
      const z = linia[i];
      if (z === '"') {
        if (wCudzyslowie && linia[i + 1] === '"') { biezace += '"'; i++; }
        else wCudzyslowie = !wCudzyslowie;
      } else if (z === ',' && !wCudzyslowie) {
        pola.push(biezace); biezace = '';
      } else {
        biezace += z;
      }
    }
    pola.push(biezace);
    return pola.map((p) => p.trim());
  };

  const naglowki = rozbij(linie[0]);
  const wiersze = linie.slice(1).map((l) => {
    const pola = rozbij(l);
    const obj = {};
    naglowki.forEach((h, i) => { obj[h] = pola[i] !== undefined && pola[i] !== '' ? pola[i] : null; });
    return obj;
  });

  return { naglowki, wiersze };
}

/** Domena bez www — używana jako nazwa katalogu wyjściowego. */
function domenaZ(url) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url).host.replace(/^www\./, '');
  } catch {
    return String(url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

module.exports = { parseCsv, domenaZ };
