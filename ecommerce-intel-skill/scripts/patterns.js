#!/usr/bin/env node
/**
 * patterns.js — agregacja wzorców między sklepami.
 *
 * Użycie:
 *   node patterns.js                       — wszystkie sklepy z output/
 *   node patterns.js --lista <plik.csv>    — tylko sklepy z listy
 *   node patterns.js --prog-reklam 50      — próg „silnego sygnału paid" (domyślnie 50)
 *
 * Wynik: output/_patterns.json + czytelne podsumowanie na konsoli.
 *
 * DLACZEGO TO JEST SKRYPT, A NIE ROBOTA AI:
 * Zdania typu „31 z 40 sklepów pokazuje cenę nad zgięciem" to fundament całego raportu.
 * Gdyby liczył je model czytający 40 plików, byłyby to liczby zmyślone z dużą pewnością
 * siebie. Liczy je kod, deterministycznie, z pól store-data.json. Claude dostaje gotowe
 * częstotliwości i INTERPRETUJE je — nie produkuje.
 *
 * Wzorzec przeniesiony z benchmark-pl-law.json w audycie kancelarii („heroCtaPresent: 6/21"),
 * gdzie sprawdził się jako sposób zamiany opinii w fakt rynkowy.
 *
 * SEGMENTACJA PO SYGNALE PAID:
 * Sama częstotliwość myli — „wszyscy tak robią" może znaczyć „wszyscy kopiują ten sam
 * motyw", nie „to działa". Dlatego każdą cechę liczymy osobno dla sklepów z realnym
 * budżetem reklamowym (dane z WinningHuntera w kolumnie aktywne_reklamy_strona) i dla
 * reszty. Różnica między tymi grupami jest ciekawsza niż sama średnia.
 */

const fs = require('fs');
const path = require('path');
const { parseCsv, domenaZ } = require('../../core/csv');

const OUT_BASE = process.env.ECOM_OUTPUT_DIR || path.join(__dirname, '..', 'output');

const argIdx = (flaga) => process.argv.indexOf(flaga);
const PROG_REKLAM = argIdx('--prog-reklam') > -1
  ? Number(process.argv[argIdx('--prog-reklam') + 1]) || 50
  : 50;

// ── Definicje cech ───────────────────────────────────────────────────
// Każda cecha: nazwa → funkcja(store-data) → true | false | null.
// null = nie da się ustalić (brak danych) i taki sklep wypada z mianownika tej cechy,
// zamiast być liczony jako „nie". To ta sama zasada, co „brak danych ≠ brak zjawiska"
// w MASTER_BRIEF — inaczej zaniżamy wszystkie częstotliwości.
const CECHY = {
  // — Układ i ścieżka zakupu —
  'cena nad zgięciem (desktop)': (d) => d.desktop?.cenaNadZgieciem ?? null,
  'cena nad zgięciem (mobile)': (d) => d.mobile?.cenaNadZgieciem ?? null,
  'ATC nad zgięciem (desktop)': (d) => d.desktop?.atcNadZgieciem ?? null,
  'ATC nad zgięciem (mobile)': (d) => d.mobile?.atcNadZgieciem ?? null,
  'sticky ATC na mobile': (d) => d.mobile?.atcSticky ?? null,
  'gwiazdki/ocena nad zgięciem': (d) => d.desktop?.zgiecie?.maGwiazdki ?? null,
  'cena porównawcza (przekreślona)': (d) => d.desktop?.cenaPorownawcza ?? null,

  // — Personalizacja: sedno naszego produktu —
  'upload zdjęcia na PDP (widoczny)': (d) => d.desktop?.personalizacja?.uploadNaPdp ?? null,
  'upload widoczny nad zgięciem': (d) => d.desktop?.zgiecie?.maUpload ?? null,
  'pole tekstowe personalizacji': (d) => (d.desktop?.personalizacja?.liczbaPolTekstowych ?? null) === null
    ? null : d.desktop.personalizacja.liczbaPolTekstowych > 0,
  'podgląd na żywo (canvas)': (d) => d.desktop?.personalizacja?.maCanvas ?? null,
  'przycisk podglądu personalizacji': (d) => d.desktop?.personalizacja?.maPrzyciskPodgladu ?? null,
  'obiecuje podgląd/proof przed produkcją': (d) => d.desktop?.personalizacja?.obiecujePodgladDoAkceptacji ?? null,
  'dedykowana aplikacja personalizacji': (d) => (d.desktop?.aplikacje?.personalizacja ?? null) === null
    ? null : d.desktop.aplikacje.personalizacja.length > 0,

  // — Zaufanie —
  'aplikacja opinii zainstalowana': (d) => (d.desktop?.aplikacje?.opinie ?? null) === null
    ? null : d.desktop.aplikacje.opinie.length > 0,
  'zdjęcia klientów w opiniach (UGC)': (d) => d.desktop?.zaufanie?.maZdjeciaWOpiniach ?? null,
  'liczba opinii podana w treści': (d) => (d.desktop?.zaufanie?.liczbaOpiniiWTekscie ?? null) === null
    ? null : d.desktop.zaufanie.liczbaOpiniiWTekscie.length > 0,
  'komunikuje gwarancję/zwrot': (d) => d.desktop?.zaufanie?.maJakakolwiekGwarancje ?? null,
  'podaje okres zwrotu (np. 100 dni)': (d) => (d.desktop?.zaufanie ?? null) === null
    ? null : !!d.desktop.zaufanie.okresZwrotu,
  'podaje okres gwarancji (np. 2 lata)': (d) => (d.desktop?.zaufanie ?? null) === null
    ? null : !!d.desktop.zaufanie.okresGwarancji,
  'badge zaufania w treści': (d) => (d.desktop?.zaufanie?.badge ?? null) === null
    ? null : d.desktop.zaufanie.badge.length > 0,

  // — Oferta —
  'bundle / zestaw': (d) => (d.desktop?.oferta?.frazyBundle ?? null) === null
    ? null : d.desktop.oferta.frazyBundle.length > 0,
  'próg ilościowy (kup 2 = taniej)': (d) => d.desktop?.oferta?.maProgIlosciowy ?? null,
  'pilność / niedobór': (d) => (d.desktop?.oferta?.frazyPilnosc ?? null) === null
    ? null : d.desktop.oferta.frazyPilnosc.length > 0,
  'licznik czasu': (d) => d.desktop?.oferta?.maLicznikCzasu ?? null,
  'darmowa dostawa komunikowana': (d) => (d.desktop?.oferta?.fazyDarmowaWysylka ?? null) === null
    ? null : d.desktop.oferta.fazyDarmowaWysylka.length > 0,
  'płatność ratalna / odroczona': (d) => (d.desktop?.oferta?.maRaty ?? null) === null
    ? null : d.desktop.oferta.maRaty.length > 0,
  'aplikacja upsell/bundle': (d) => (d.desktop?.aplikacje?.upsell ?? null) === null
    ? null : d.desktop.aplikacje.upsell.length > 0,

  // — Dostawa i obiekcje —
  'komunikuje czas produkcji': (d) => (d.desktop?.dostawa?.fazyCzasProdukcji ?? null) === null
    ? null : d.desktop.dostawa.fazyCzasProdukcji.length > 0,
  'podaje konkretny okres realizacji (X dni roboczych)': (d) => (d.desktop?.dostawa?.okresyRealizacji ?? null) === null
    ? null : d.desktop.dostawa.okresyRealizacji.length > 0,
  'komunikuje czas dostawy': (d) => (d.desktop?.dostawa?.fazyCzasDostawy ?? null) === null
    ? null : d.desktop.dostawa.fazyCzasDostawy.length > 0,
  'konkretna data dostarczenia': (d) => d.desktop?.dostawa?.maKonkretnaDate ?? null,
  'polityka zwrotów wspomniana': (d) => (d.desktop?.dostawa?.fazyZwroty ?? null) === null
    ? null : d.desktop.dostawa.fazyZwroty.length > 0,

  // — Treść i media —
  'wideo na stronie produktu': (d) => (d.desktop?.media ?? null) === null
    ? null : (d.desktop.media.liczbaWideo + d.desktop.media.liczbaOsadzonychWideo) > 0,
  'sekcja FAQ': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('faq'),
  'sekcja jak-to-działa': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('jak-to-dziala'),
  'sekcja porównania': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('porownanie'),
  'sekcja gwarancji': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('gwarancja'),
  'sekcja UGC/social': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('ugc'),
  'sekcja upsell/powiązane': (d) => (d.desktop?.kolejnoscSekcji ?? null) === null
    ? null : d.desktop.kolejnoscSekcji.includes('upsell'),
};

// ── Wczytanie danych ─────────────────────────────────────────────────
function wczytajSklepy() {
  const idxLista = argIdx('--lista');
  let domeny = null;
  if (idxLista > -1) {
    const { wiersze } = parseCsv(fs.readFileSync(process.argv[idxLista + 1], 'utf8'));
    domeny = new Set(wiersze.filter((w) => w.url).map((w) => domenaZ(w.url)));
  }

  if (!fs.existsSync(OUT_BASE)) return [];
  return fs.readdirSync(OUT_BASE)
    .filter((k) => !k.startsWith('_') && !k.startsWith('.'))
    .filter((k) => !domeny || domeny.has(k))
    .map((k) => path.join(OUT_BASE, k, 'store-data.json'))
    .filter((p) => fs.existsSync(p))
    .map((p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } })
    .filter(Boolean);
}

/**
 * Skan podejrzany = strona prawdopodobnie nie wczytała się poprawnie (blokada bota,
 * przekierowanie, martwy sklep). Wliczanie takiego sklepu do mianownika zafałszowuje
 * KAŻDĄ częstotliwość, więc odkładamy go na bok i raportujemy osobno — zamiast po cichu
 * liczyć „nie ma sekcji FAQ" dla strony, której w ogóle nie zobaczyliśmy.
 */
function czySkanPodejrzany(d) {
  const powody = [];
  const sekcje = d.desktop?.liczbaSekcji ?? 0;
  if (sekcje < 3) powody.push(`tylko ${sekcje} sekcji`);
  if (!d.desktop) powody.push('brak przebiegu desktop');
  if ((d.desktop?.strona?.ekranow ?? 0) < 1.5) powody.push('strona krótsza niż 1,5 ekranu');
  if (d.bledy?.length) powody.push(`błędy skanu: ${d.bledy.map((b) => b.etap).join(',')}`);
  return powody;
}

function policz(sklepy, cecha) {
  let tak = 0; let znane = 0;
  for (const s of sklepy) {
    const v = CECHY[cecha](s);
    if (v === null || v === undefined) continue;
    znane++;
    if (v) tak++;
  }
  return { tak, znane, udzial: znane ? tak / znane : null };
}

// ── Główne ───────────────────────────────────────────────────────────
const wszystkie = wczytajSklepy();
if (!wszystkie.length) {
  console.error(`Brak danych w ${OUT_BASE}. Najpierw: node scan-store.js --batch <lista.csv>`);
  process.exit(1);
}

const podejrzane = [];
const sklepy = [];
for (const s of wszystkie) {
  const powody = czySkanPodejrzany(s);
  if (powody.length) podejrzane.push({ domena: s.domena, powody });
  else sklepy.push(s);
}

// Segmentacja po sile sygnału paid (dane z WinningHuntera w liście wejściowej).
const reklamy = (s) => Number(s.kontekstRynkowy?.aktywne_reklamy_strona ?? NaN);
const zSygnalem = sklepy.filter((s) => reklamy(s) >= PROG_REKLAM);
const bezSygnalu = sklepy.filter((s) => !Number.isNaN(reklamy(s)) && reklamy(s) < PROG_REKLAM);

const wynik = {
  dataAgregacji: new Date().toISOString().slice(0, 10),
  progSygnaluPaid: PROG_REKLAM,
  liczbaSklepow: {
    zeskanowane: wszystkie.length,
    doStatystyk: sklepy.length,
    podejrzane: podejrzane.length,
    zSygnalemPaid: zSygnalem.length,
    bezSygnaluPaid: bezSygnalu.length,
  },
  skanyPodejrzane: podejrzane,
  cechy: {},
  // Cechy rzadkie — kandydaci na whitespace. Interpretacja należy do Claude:
  // rzadkość może znaczyć „nikt tego nie robi, a warto" ALBO „ktoś już próbował i odpadło".
  kandydaciNaWhitespace: [],
  // Cechy, w których sklepy z budżetem różnią się najmocniej od reszty.
  najwiekszeRoznicePaid: [],
};

for (const cecha of Object.keys(CECHY)) {
  const all = policz(sklepy, cecha);
  const paid = policz(zSygnalem, cecha);
  const rest = policz(bezSygnalu, cecha);
  const delta = (paid.udzial !== null && rest.udzial !== null) ? paid.udzial - rest.udzial : null;

  wynik.cechy[cecha] = {
    wszystkie: `${all.tak}/${all.znane}`,
    udzial: all.udzial !== null ? Math.round(all.udzial * 100) : null,
    zSygnalemPaid: `${paid.tak}/${paid.znane}`,
    bezSygnaluPaid: `${rest.tak}/${rest.znane}`,
    roznicaPunktProc: delta !== null ? Math.round(delta * 100) : null,
  };

  if (all.udzial !== null && all.udzial <= 0.25 && all.znane >= 5) {
    wynik.kandydaciNaWhitespace.push({ cecha, udzial: Math.round(all.udzial * 100), stosunek: `${all.tak}/${all.znane}` });
  }
  if (delta !== null && Math.abs(delta) >= 0.3 && paid.znane >= 3 && rest.znane >= 3) {
    wynik.najwiekszeRoznicePaid.push({ cecha, roznicaPunktProc: Math.round(delta * 100), zSygnalem: `${paid.tak}/${paid.znane}`, bez: `${rest.tak}/${rest.znane}` });
  }
}

wynik.kandydaciNaWhitespace.sort((a, b) => a.udzial - b.udzial);
wynik.najwiekszeRoznicePaid.sort((a, b) => Math.abs(b.roznicaPunktProc) - Math.abs(a.roznicaPunktProc));

// ── Rozkłady pomocnicze ──────────────────────────────────────────────
const zlicz = (lista) => lista.reduce((acc, x) => { acc[x] = (acc[x] || 0) + 1; return acc; }, {});
const posortuj = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

wynik.aplikacje = {
  personalizacja: posortuj(zlicz(sklepy.flatMap((s) => s.desktop?.aplikacje?.personalizacja || []))),
  opinie: posortuj(zlicz(sklepy.flatMap((s) => s.desktop?.aplikacje?.opinie || []))),
  upsell: posortuj(zlicz(sklepy.flatMap((s) => s.desktop?.aplikacje?.upsell || []))),
};

// Kolejność sekcji — które typy pojawiają się i na której pozycji średnio.
const pozycjeTypow = {};
for (const s of sklepy) {
  (s.desktop?.sekcje || []).forEach((sek) => {
    const t = sek.typGuess;
    if (!t) return;
    (pozycjeTypow[t] = pozycjeTypow[t] || []).push(sek.pozycja);
  });
}
wynik.sekcje = Object.entries(pozycjeTypow)
  .map(([typ, poz]) => ({
    typ,
    wIluSklepach: new Set(sklepy.filter((s) => (s.desktop?.sekcje || []).some((x) => x.typGuess === typ)).map((s) => s.domena)).size,
    sredniaPozycja: Math.round((poz.reduce((a, b) => a + b, 0) / poz.length) * 10) / 10,
  }))
  .sort((a, b) => a.sredniaPozycja - b.sredniaPozycja);

// Rozkład cen i długości strony — kontekst do pozycjonowania własnej oferty.
const ceny = sklepy.map((s) => s.shopify?.cenaMin).filter((c) => typeof c === 'number');
const ekrany = sklepy.map((s) => s.desktop?.strona?.ekranow).filter((e) => typeof e === 'number');
const mediana = (a) => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
wynik.rozklady = {
  cenaMinShopify: { min: ceny.length ? Math.min(...ceny) : null, mediana: mediana(ceny), max: ceny.length ? Math.max(...ceny) : null, n: ceny.length },
  dlugoscStronyEkrany: { min: ekrany.length ? Math.min(...ekrany) : null, mediana: mediana(ekrany), max: ekrany.length ? Math.max(...ekrany) : null, n: ekrany.length },
  liczbaSekcji: { mediana: mediana(sklepy.map((s) => s.desktop?.liczbaSekcji).filter(Number.isFinite)) },
};

fs.mkdirSync(OUT_BASE, { recursive: true });
fs.writeFileSync(path.join(OUT_BASE, '_patterns.json'), JSON.stringify(wynik, null, 2), 'utf8');

// ── Konsola ──────────────────────────────────────────────────────────
console.log(`\nSklepy: ${wszystkie.length} zeskanowanych → ${sklepy.length} do statystyk (${podejrzane.length} podejrzanych, wyłączonych z mianownika)`);
console.log(`Segmentacja: ${zSygnalem.length} z sygnałem paid (≥${PROG_REKLAM} aktywnych reklam), ${bezSygnalu.length} bez\n`);

if (podejrzane.length) {
  console.log('⚠ Skany podejrzane (do ręcznej weryfikacji na zrzucie, NIE liczone w częstotliwościach):');
  podejrzane.forEach((p) => console.log(`   ${p.domena} — ${p.powody.join('; ')}`));
  console.log('');
}

console.log('CZĘSTOTLIWOŚCI (wszystkie | z sygnałem paid | bez):');
for (const [cecha, v] of Object.entries(wynik.cechy)) {
  const d = v.roznicaPunktProc;
  const znacznik = d !== null && Math.abs(d) >= 30 ? `  ← różnica ${d > 0 ? '+' : ''}${d} pp` : '';
  console.log(`  ${cecha.padEnd(42)} ${String(v.wszystkie).padStart(6)} (${String(v.udzial ?? '-').padStart(3)}%)  paid:${v.zSygnalemPaid.padStart(5)}  bez:${v.bezSygnaluPaid.padStart(5)}${znacznik}`);
}

console.log('\nKANDYDACI NA WHITESPACE (≤25% sklepów, min. 5 z danymi):');
if (!wynik.kandydaciNaWhitespace.length) console.log('  (brak — każda badana cecha występuje u >25% sklepów)');
wynik.kandydaciNaWhitespace.forEach((k) => console.log(`  ${String(k.udzial).padStart(3)}%  ${k.stosunek.padStart(6)}  ${k.cecha}`));

console.log('\nAPLIKACJE — personalizacja:', wynik.aplikacje.personalizacja.map(([n, c]) => `${n} (${c})`).join(', ') || '(brak)');
console.log('APLIKACJE — opinie:', wynik.aplikacje.opinie.map(([n, c]) => `${n} (${c})`).join(', ') || '(brak)');

console.log('\nKOLEJNOŚĆ SEKCJI (średnia pozycja, w ilu sklepach):');
wynik.sekcje.forEach((s) => console.log(`  ${String(s.sredniaPozycja).padStart(5)}  ${String(s.wIluSklepach).padStart(2)} sklepów  ${s.typ}`));

console.log(`\nCENA (Shopify, min wariantu): ${JSON.stringify(wynik.rozklady.cenaMinShopify)}`);
console.log(`DŁUGOŚĆ STRONY (ekrany): ${JSON.stringify(wynik.rozklady.dlugoscStronyEkrany)}`);
console.log(`\n→ output/_patterns.json`);
