#!/usr/bin/env node
/**
 * validate-lead.js — walidacja audyt-dane.json (nowy schemat z kwalifikacją leada A/B/C/D).
 *
 * Użycie:
 *   node validate-lead.js <domena> [<domena2> ...]   — sprawdź wskazane katalogi output/<domena>/
 *   node validate-lead.js --all                      — sprawdź wszystkie katalogi w output/
 *
 * Kody wyjścia: 0 = wszystko OK (błędów brak), 1 = są błędy.
 * Pliki w STARYM schemacie (scoreOgolny, brak kwalifikacja_leada) są raportowane jako
 * „stary schemat — do ponownego audytu" (ostrzeżenie, nie błąd) — batch-report.js kieruje
 * je do sekcji „do ponownego audytu".
 *
 * PODZIAŁ ODPOWIEDZIALNOŚCI (patrz też kryteria-audytu.md → „Ocena leada"):
 * Claude robi WYŁĄCZNIE prospecting + kwalifikację (A/B/C/D, decyzja, `obserwacja_do_maila`
 * jako krótki fakt). Nie pisze tematu ani treści maila M1/FU1/FU2, nie tworzy szkicu Gmail,
 * nie wysyła i nie aktualizuje statusów operacyjnych w Trackerze — to robi druga automatyzacja
 * (ChatGPT) po przejęciu rekordu z zakładki „Claude_import" (`status_importu`: NOWY → PRZEJĘTY).
 * Dlatego ten walidator NIE sprawdza treści maila (nie istnieje w tym schemacie) — tylko
 * kompletność i spójność audytu/kwalifikacji.
 *
 * Reguły (kryteria-audytu.md → „Ocena leada" + polityka: import TYLKO dla 7–8/8):
 *   1.  punkty A/B/C/D — liczby całkowite 0–2
 *   2.  razem = A+B+C+D
 *   3.  decyzja zgodna z progami: 7–8 → PISAĆ; 0–6 → ODPUŚCIĆ (5–6 loguj przez log-odrzucone.js)
 *   4.  PISAĆ wymaga ≥2 mocnych przesłanek
 *   5.  ODPUŚCIĆ → przekazanie.do_importu=false, obserwacja_do_maila=null, status ODPUŚCIĆ
 *   6.  PISAĆ bez blokady → przekazanie.do_importu=true, obserwacja_do_maila obecna,
 *       status DO_IMPORTU
 *   7.  blokada kontaktu (lead-info.json: mail_zablokowany) → przekazanie.do_importu=false,
 *       status_sugerowany ≠ DO_IMPORTU (zachowujemy istniejący status operacyjny)
 *   8.  pewnosc_oceny wstepna/niewystarczajace_dane → decyzja=null, bez przekazania, status DO_AUDYTU
 *   9.  PISAĆ nie może opierać się wyłącznie na słabych przesłankach: sam wiek strony,
 *       kosmetyka, albo niepotwierdzony błąd narzędzia (TLS/502) bez korelacji z oceną wizualną —
 *       potrzeba ≥1 mocnej przesłanki widocznej dla realnego odwiedzającego (nie tylko dla skryptu)
 *   10. mocna przesłanka nie może jednocześnie figurować w co_jest_kosmetyka (sprzeczność)
 *   11. obserwacja_do_maila bez żargonu technicznego (LCP/H1/CTA/SSL/…)
 *   12. email/imie_kontaktowe tylko z jawnych źródeł (lead-info.json lub content.json) — nie zgadane
 *   13. spójność plików mail-observation.txt/mail-fragment.txt (legacy) z decyzją
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT_BASE = process.env.AUDYT_OUTPUT_DIR || path.join(__dirname, '..', 'output');

// ── Żargon w obserwacji do maila (SKILL.md → Krok 5: zero terminów technicznych) ──────
const ZARGON = /\b(LCP|H1|JSON-?LD|CTA|viewport|SSL|HTTPS|cache|meta description|benchmark|schema\.org)\b/i;

const DECYZJE = ['PISAĆ', 'ODPUŚCIĆ'];
const PEWNOSC = ['pelna', 'wstepna', 'niewystarczajace_dane'];
const STATUSY = ['DO_AUDYTU', 'ODPUŚCIĆ', 'DO_IMPORTU'];

// ── Reguła 9: przesłanki, które SAME W SOBIE nie uzasadniają PISAĆ ─────────────────────
// Wiek strony / kosmetyka: dopasowane wprost do kryteria-audytu.md → „Słabe sygnały".
const TYLKO_WIEK = /copyright|©|\bwiek strony\b|nieaktualizowan|dawno nie\s*(zmienian|aktualizowan)|szablon sprzed|generator:|dawny rok|stary rok w stopce/i;
const TYLKO_KOSMETYKA = /\bkosmetyk|estetyk|kolorystyk|drobna typografia|przeciętne ikony|zdjęcie stockowe|dużo pustego miejsca|jeden kolor\b/i;
// Błąd widoczny wyłącznie w narzędziu (Lighthouse/Playwright/vitals), nie na ekranie klienta —
// jeśli byłby realnie widoczny, zwykle korelowałby z priorytet_wizualny = wysoki (Krok 0).
const TYLKO_BLAD_NARZEDZIA = /\b502\b|bad gateway|błąd (lighthouse|narzędzia|pomiaru)|timeout narzędzia|certyfikat.*(wygas|błąd)|ssl error|błąd ssl/i;

function jestSlaba(tekst, priorytetWizualny) {
  const t = String(tekst || '');
  if (TYLKO_WIEK.test(t) || TYLKO_KOSMETYKA.test(t)) return true;
  if (TYLKO_BLAD_NARZEDZIA.test(t) && priorytetWizualny !== 'wysoki') return true;
  return false;
}

/**
 * Waliduje jeden katalog audytu. Zwraca { schemat: 'nowy'|'stary'|'brak', errors: [], warnings: [] }.
 */
function validateDir(dir) {
  const errors = [];
  const warnings = [];
  const danePath = path.join(dir, 'audyt-dane.json');
  if (!fs.existsSync(danePath)) return { schemat: 'brak', errors, warnings };

  let d;
  try {
    d = JSON.parse(fs.readFileSync(danePath, 'utf8'));
  } catch (e) {
    return { schemat: 'nowy', errors: ['audyt-dane.json nie parsuje się: ' + e.message], warnings };
  }

  // Stary schemat: brak kwalifikacja_leada → tylko ostrzeżenie (do ponownego audytu).
  if (!d.kwalifikacja_leada) {
    warnings.push('stary schemat (brak kwalifikacja_leada) — do ponownego audytu');
    return { schemat: 'stary', errors, warnings };
  }

  const k = d.kwalifikacja_leada;
  const s = k.scoring_0_8 || {};
  const czesci = ['potrzeba_przebudowy', 'potencjal_finansowy', 'skala_poprawy', 'naturalny_powod_kontaktu'];
  const priorytetWiz = d.priorytet_wizualny || (d.ocenaWizualna && d.ocenaWizualna.priorytet) || null;

  // lead-info.json (opcjonalny — tryb pojedynczy go nie tworzy)
  let leadInfo = null;
  const liPath = path.join(dir, 'lead-info.json');
  if (fs.existsSync(liPath)) {
    try { leadInfo = JSON.parse(fs.readFileSync(liPath, 'utf8')); }
    catch (e) { errors.push('lead-info.json nie parsuje się: ' + e.message); }
  }
  const zablokowany = !!(leadInfo && leadInfo.mail_zablokowany);

  // 1. punkty 0–2, całkowite
  let suma = 0;
  for (const c of czesci) {
    const p = s[c] ? s[c].punkty : undefined;
    if (!Number.isInteger(p) || p < 0 || p > 2) {
      errors.push(`scoring_0_8.${c}.punkty musi być liczbą całkowitą 0–2 (jest: ${JSON.stringify(p)})`);
    } else {
      suma += p;
    }
    if (s[c] && !String(s[c].uzasadnienie || '').trim()) {
      warnings.push(`scoring_0_8.${c} bez uzasadnienia — punkt bez podstawy nie obroni się przy weryfikacji`);
    }
  }

  // 2. razem = suma
  if (s.razem !== suma) {
    errors.push(`scoring_0_8.razem (${s.razem}) ≠ suma A+B+C+D (${suma})`);
  }

  // pewnosc_oceny
  if (!PEWNOSC.includes(k.pewnosc_oceny)) {
    errors.push(`pewnosc_oceny musi być jednym z: ${PEWNOSC.join(' | ')} (jest: ${JSON.stringify(k.pewnosc_oceny)})`);
  }
  const wstepna = k.pewnosc_oceny !== 'pelna';

  // 8. ocena wstępna nie udaje finalnej
  if (wstepna) {
    if (k.decyzja != null) errors.push(`pewnosc_oceny=${k.pewnosc_oceny} → decyzja musi być null (jest: ${k.decyzja})`);
    if (d.status_sugerowany !== 'DO_AUDYTU') errors.push(`pewnosc_oceny=${k.pewnosc_oceny} → status_sugerowany musi być DO_AUDYTU`);
    if (d.przekazanie && (d.przekazanie.do_importu || d.przekazanie.obserwacja_do_maila)) {
      errors.push('ocena wstępna nie może mieć przekazania do importu ani obserwacji');
    }
  } else {
    // 3. decyzja zgodna z progami (polityka: PISAĆ tylko 7–8; 0–6 → ODPUŚCIĆ)
    if (!DECYZJE.includes(k.decyzja)) {
      errors.push(`decyzja musi być PISAĆ albo ODPUŚCIĆ (jest: ${JSON.stringify(k.decyzja)})`);
    } else {
      const oczekiwana = suma >= 7 ? 'PISAĆ' : 'ODPUŚCIĆ';
      if (k.decyzja !== oczekiwana) {
        errors.push(`decyzja ${k.decyzja} niezgodna z progami dla ${suma}/8 (oczekiwana: ${oczekiwana})`);
      }
    }

    const mocne = Array.isArray(k.mocne_przeslanki) ? k.mocne_przeslanki.map(x => String(x).trim()).filter(Boolean) : [];
    const kosmetyka = Array.isArray(k.co_jest_kosmetyka) ? k.co_jest_kosmetyka.map(x => String(x).trim().toLowerCase()) : [];

    // 4. PISAĆ wymaga ≥2 mocnych przesłanek
    if (k.decyzja === 'PISAĆ') {
      if (mocne.length < 2) errors.push(`PISAĆ wymaga ≥2 mocnych przesłanek (jest: ${mocne.length})`);
      if (s.potrzeba_przebudowy && s.potrzeba_przebudowy.punkty === 1) {
        warnings.push('PISAĆ przy potrzebie przebudowy = 1 — dopuszczalne tylko przy bardzo mocnych pozostałych przesłankach, zweryfikuj');
      }

      // 9. nie tylko wiek/kosmetyka/błąd-narzędzia
      if (mocne.length && mocne.every(m => jestSlaba(m, priorytetWiz))) {
        errors.push('PISAĆ oparte wyłącznie na słabych przesłankach (wiek strony / kosmetyka / błąd widoczny tylko w narzędziu) — potrzebna ≥1 przesłanka widoczna dla realnego odwiedzającego (patrz kryteria-audytu.md → „Słabe sygnały")');
      }

      // 10. sprzeczność: to samo w mocne_przeslanki i co_jest_kosmetyka
      for (const m of mocne) {
        if (kosmetyka.includes(m.toLowerCase())) {
          errors.push(`„${m}" figuruje jednocześnie w mocne_przeslanki i co_jest_kosmetyka — sprzeczność`);
        }
      }
    }

    const p = d.przekazanie || {};

    // 7. blokada kontaktu nadpisuje wszystko poza samym audytem
    if (zablokowany) {
      if (p.do_importu) errors.push(`blokada kontaktu (${leadInfo.powod_blokady}) → przekazanie.do_importu musi być false`);
      if (d.status_sugerowany === 'DO_IMPORTU') errors.push('blokada kontaktu → status_sugerowany nie może być DO_IMPORTU (zachowaj istniejący status operacyjny)');
    } else if (k.decyzja === 'ODPUŚCIĆ') {
      // 5. ODPUŚCIĆ bez przekazania
      if (p.do_importu) errors.push('ODPUŚCIĆ → przekazanie.do_importu musi być false');
      if (p.obserwacja_do_maila != null) errors.push('ODPUŚCIĆ → obserwacja_do_maila musi być null');
      if (d.status_sugerowany !== 'ODPUŚCIĆ') errors.push(`ODPUŚCIĆ → status_sugerowany musi być ODPUŚCIĆ (jest: ${d.status_sugerowany})`);
    } else if (k.decyzja === 'PISAĆ') {
      // 6. PISAĆ → przekazanie do importu, TYLKO obserwacja (bez tematu/treści maila)
      if (!p.do_importu) errors.push('PISAĆ bez blokady → przekazanie.do_importu musi być true');
      if (!String(p.obserwacja_do_maila || '').trim()) errors.push('PISAĆ → obserwacja_do_maila wymagana');
      if (d.status_sugerowany !== 'DO_IMPORTU') errors.push(`PISAĆ → status_sugerowany musi być DO_IMPORTU (jest: ${d.status_sugerowany})`);

      // 11. obserwacja bez żargonu
      if (p.obserwacja_do_maila && ZARGON.test(p.obserwacja_do_maila)) {
        errors.push('obserwacja_do_maila zawiera żargon techniczny');
      }
    }
  }

  // status_sugerowany — dozwolone wartości (null dopuszczalny tylko przy blokadzie)
  if (d.status_sugerowany != null && !STATUSY.includes(d.status_sugerowany)) {
    errors.push(`status_sugerowany spoza listy ${STATUSY.join(' | ')}: ${JSON.stringify(d.status_sugerowany)}`);
  }
  if (d.status_sugerowany == null && !zablokowany) {
    errors.push('status_sugerowany=null dozwolony tylko przy blokadzie kontaktu');
  }

  // score_audytu_0_100 + tier — warstwa niezależna od kwalifikacji (obie muszą istnieć osobno)
  if (!Number.isFinite(d.score_audytu_0_100) || d.score_audytu_0_100 < 0 || d.score_audytu_0_100 > 100) {
    errors.push(`score_audytu_0_100 musi być liczbą 0–100 (jest: ${JSON.stringify(d.score_audytu_0_100)})`);
  }
  if (!String(d.tier_audytu || '').trim()) warnings.push('brak tier_audytu');

  // 12. email / imię kontaktowe — tylko z jawnych źródeł
  if (d.email || d.imie_kontaktowe) {
    const zrodla = [];
    if (leadInfo) zrodla.push(JSON.stringify(leadInfo));
    const contentPath = path.join(dir, 'content.json');
    if (fs.existsSync(contentPath)) {
      try { zrodla.push(fs.readFileSync(contentPath, 'utf8')); } catch (_) { /* brak nie blokuje */ }
    }
    const wZrodlach = (val) => zrodla.some(z => z.toLowerCase().includes(String(val).toLowerCase()));
    if (d.email && zrodla.length && !wZrodlach(d.email)) {
      errors.push(`email „${d.email}" nie występuje w lead-info.json ani content.json — wygląda na zgadnięty`);
    }
    if (d.imie_kontaktowe && zrodla.length && !wZrodlach(d.imie_kontaktowe)) {
      errors.push(`imie_kontaktowe „${d.imie_kontaktowe}" nie występuje w źródłach — wygląda na zgadnięte`);
    }
  }

  // 13. spójność plików na dysku z decyzją — mail-observation.txt (kanoniczny) lub
  // mail-fragment.txt (legacy alias, zgodność wsteczna ze starszymi audytami).
  const obsPath = path.join(dir, 'mail-observation.txt');
  const fragPath = path.join(dir, 'mail-fragment.txt');
  const decyzja = wstepna ? null : k.decyzja;
  const obserwacjaOczekiwana = decyzja === 'PISAĆ' && !zablokowany && d.przekazanie && d.przekazanie.obserwacja_do_maila;
  if (obserwacjaOczekiwana) {
    const naDysku = fs.existsSync(obsPath) ? fs.readFileSync(obsPath, 'utf8').trim()
      : (fs.existsSync(fragPath) ? fs.readFileSync(fragPath, 'utf8').trim() : null);
    if (naDysku != null && naDysku !== String(d.przekazanie.obserwacja_do_maila).trim()) {
      warnings.push('mail-observation.txt/mail-fragment.txt różni się od przekazanie.obserwacja_do_maila — mają być identyczne');
    }
  } else if (fs.existsSync(obsPath) || fs.existsSync(fragPath)) {
    errors.push('mail-observation.txt/mail-fragment.txt istnieje, choć decyzja/blokada nie pozwala na obserwację');
  }

  return { schemat: 'nowy', errors, warnings };
}

// ── CLI ─────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Użycie: node validate-lead.js <domena> [...] | --all');
    process.exit(1);
  }

  let dirs;
  if (args.includes('--all')) {
    dirs = fs.readdirSync(OUT_BASE)
      .map(d => path.join(OUT_BASE, d))
      .filter(p => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'audyt-dane.json')));
  } else {
    dirs = args.map(a => (fs.existsSync(a) ? a : path.join(OUT_BASE, a)));
  }

  let totalErrors = 0;
  for (const dir of dirs) {
    const nazwa = path.basename(dir);
    const { schemat, errors, warnings } = validateDir(dir);
    if (schemat === 'brak') { console.log(`⊘ ${nazwa}: brak audyt-dane.json`); continue; }
    if (errors.length === 0 && warnings.length === 0) { console.log(`✓ ${nazwa}`); continue; }
    console.log(`${errors.length ? '✗' : '⚠'} ${nazwa}${schemat === 'stary' ? ' (stary schemat)' : ''}`);
    errors.forEach(e => console.log(`    BŁĄD: ${e}`));
    warnings.forEach(w => console.log(`    uwaga: ${w}`));
    totalErrors += errors.length;
  }

  if (totalErrors) {
    console.log(`\n✗ Łącznie błędów: ${totalErrors}`);
    process.exit(1);
  }
  console.log('\n✓ Walidacja przeszła (błędów: 0)');
}

if (require.main === module) main();

module.exports = { validateDir, jestSlaba };
