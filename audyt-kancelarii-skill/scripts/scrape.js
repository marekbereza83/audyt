#!/usr/bin/env node
/**
 * scrape.js — pobiera stronę kancelarii do audytu i kwalifikacji leada.
 * Użycie:
 *   node scrape.js <url> [<url-konkurenta>]    — pojedyncza strona (+ opcjonalny konkurent)
 *   node scrape.js --peek <url>                — Etap 0: tylko screenshot (bez Firecrawl), ocena wstępna
 *   node scrape.js --peek-batch <lista.csv>    — Etap 0 wsadowo, max 8 równolegle (sam Playwright)
 *   node scrape.js --batch <lista.csv>         — tryb wsadowy (pełny scrape), max 3 równolegle
 * Wymaga: FIRECRAWL_API_KEY w .env lub w env, zainstalowany chromium (npx playwright install chromium)
 *
 * CSV wejściowy (oba tryby wsadowe) — dwa formaty, rozpoznawane po nagłówku (parser: csv-utils.js):
 *   legacy:      nazwa,url
 *   rozszerzony: lead_id,nazwa,miasto,url,telefon,email,imie_kontaktowe,status,do_not_contact,
 *                notatki,data_M1,gmail_thread_id,totalScore,reviewsCount,imagesCount,categories,
 *                placeId,permanentlyClosed
 *
 * Zwraca do output/<domena>/:
 *   content.json          — markdown, nagłówki, meta, CTA, formularze, dane kontaktowe
 *                           + servicesPage: dociągnięta podstrona „Zakres usług" (specjalizacja z treści, nie z hero)
 *                           + teamPage: dociągnięta podstrona „Zespół" (prawnicy, tytuły, obsługa firm, lokalizacje — wymiar B oceny leada)
 *                           + newsPage: dociągnięta podstrona „Aktualności" (data ostatniego wpisu — wymiar D oceny leada)
 *                           + contactPage: dociągnięta podstrona „Kontakt" (email/telefony do trackera — email często jest tylko tam)
 *                           + ageSignals: ślady wieku/zaniedbania (copyright, generator, stary szablon) dla oceny leada
 *   vitals.json           — Core Web Vitals + performance score + https + mobile
 *   screenshot-desktop.png, screenshot-mobile.png
 *   lead-info.json        — (tryb batch) dane wejściowe leada: identyfikacja, status operacyjny,
 *                           kontekst Google Maps, blokada kontaktu (mail_zablokowany + powód)
 *   competitor.json       — (tylko gdy podano url-konkurenta) { url, content, vitals } konkurenta
 *   scrape-error.txt      — (tryb batch, gdy strona zawiedzie) powód błędu
 *
 * Tryb batch: pomija firmy permanentlyClosed, duplikaty (domena/telefon/placeId) i rekordy bez
 * poprawnego URL. Leady z blokadą kontaktu (do_not_contact, status M1_WYSŁANY itd.) są scrapowane
 * normalnie — audyt można zaktualizować — ale w lead-info.json dostają mail_zablokowany: true
 * i dla nich NIE powstaje ani obserwacja_do_maila, ani przekazanie do Claude_import.
 *
 * Tryb batch zbiera tylko dane. Audyt i kwalifikację A/B/C/D (0–8) generuje Claude per strona
 * (SKILL.md) — WYŁĄCZNIE prospecting i kwalifikacja, bez pisania treści maila (temat/treść M1
 * powstają później, po stronie ChatGPT, z zakładki „Claude_import"). Zbiorczy raport:
 * node batch-report.js <lista.csv> → output/batch-leady.csv, a rodzynki 7–8/8 (PISAĆ) idą do
 * arkusza przez push-import.js (status_importu: NOWY).
 */

require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const {
  domainOf, normalizeDomain, normalizePhone, parseLeadsCsv, isContactBlocked,
} = require('./csv-utils');

const arg1 = process.argv[2];
if (!arg1) {
  console.error('Użycie:\n  node scrape.js <url> [<url-konkurenta>]\n  node scrape.js --batch <lista.csv>   (CSV: nazwa,url lub format rozszerzony)');
  process.exit(1);
}

function outDirFor(u) {
  const d = path.join(__dirname, '..', 'output', domainOf(u));
  fs.mkdirSync(d, { recursive: true });
  return d;
}

// Muteks na Lighthouse: używa on globalnych performance.mark, więc dwa równoległe pomiary
// w tym samym procesie (batch, max 3 naraz) kolidują. Serializujemy TYLKO Lighthouse —
// Firecrawl i Playwright dalej idą równolegle (to one dają zysk z batcha).
let lighthouseLock = Promise.resolve();
function withLighthouseLock(fn) {
  const run = lighthouseLock.then(fn, fn);
  lighthouseLock = run.then(() => {}, () => {}); // następny czeka, ale błąd nie blokuje kolejki
  return run;
}

// ── Podstrona „Zakres usług / Oferta" ───────────────────────────────
// Scraper pobiera tylko stronę główną, a specjalizacja kancelarii często siedzi o jeden klik
// dalej. Z linków strony głównej znajdujemy podstronę usług i dociągamy ją, żeby wymiar 1
// (specjalizacja) oceniać z realnej treści oferty, a nie z samego hero.

// Teksty „menu-owe" wskazujące podstronę z zakresem usług, w kolejności preferencji.
const SERVICES_NAV = [
  /zakres\s+usług/i,
  /specjalizacj/i,
  /obszary\s+(praktyk|działania)/i,
  /dziedziny\s+praw/i,
  /^\s*oferta\s*$/i,
  /nasze\s+usługi|^\s*usługi\s*$/i,
  /czym\s+się\s+zajmuj|zakres\s+pomocy|co\s+(robię|robimy)/i,
];

// Slugi w ścieżce URL wskazujące podstronę usług (gdy menu nie jest linkami — fallback mapUrl).
const SERVICES_SLUG = [
  /(zakres|uslug|services)/i,
  /oferta/i,
  /specjaliz/i,
  /(praktyk|dziedzin|obszar)/i,
  /(doradztwo|pomoc-prawna|co-robimy)/i,
];
const ASSET_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?)$/i;

// ── Podstrona „Zespół / O kancelarii" ────────────────────────────────
// Żywi wymiar B oceny leada (potencjał finansowy): ilu prawników, jakie tytuły, czy obsługują
// firmy, ile lokalizacji. Tego nie widać ze strony głównej, a to najsłabiej widoczny wymiar.
const TEAM_NAV = [
  /^\s*zespół\s*$/i,
  /nasz\s+zespół|nasi\s+prawnicy/i,
  /o\s+(nas|mnie|kancelarii)/i,
  /^\s*(adwokaci|radcowie|prawnicy)\s*$/i,
  /^\s*kancelaria\s*$/i,
];
const TEAM_SLUG = [
  /(zespol|zespół|team)/i,
  /o-(nas|mnie|kancelarii)/i,
  /(prawnicy|adwokaci|radcowie)/i,
  /(about|o-kancelarii)/i,
  /^\/kancelaria/i,
];

// ── Podstrona „Aktualności / Blog" ───────────────────────────────────
// Żywi wymiar D (naturalny powód do kontaktu) i wymiar 5 Kroku 0 (świeżość treści):
// data ostatniego wpisu to najtwardszy dowód „strona stoi".
const NEWS_NAV = [
  /aktualnoś/i,
  /^\s*blog\s*$/i,
  /^\s*(nowości|wiadomości)\s*$/i,
  /publikacj|artykuł/i,
  /porady\s+prawne/i,
];
const NEWS_SLUG = [
  /(aktualnosci|aktualności)/i,
  /\/blog/i,
  /(news|nowosci)/i,
  /(publikacj|artykul|porady)/i,
];

// ── Podstrona „Kontakt" ──────────────────────────────────────────────
// Email do trackera (kolumna Email w Claude_import) często jest TYLKO na podstronie kontaktu —
// strona główna pokazuje go rzadziej niż telefon. Dodatkowo drugi telefon/adresy oddziałów.
const CONTACT_NAV = [
  /^\s*kontakt\s*$/i,
  /kontakt/i,
  /dane\s+kontaktowe/i,
  /jak\s+.*(trafić|dojechać)|dojazd/i,
];
const CONTACT_SLUG = [
  /(kontakt|contact)/i,
  /(dojazd|lokalizacja)/i,
];

// (1) Próba z linków strony głównej — działa na nowoczesnych stronach, bez dodatkowego wywołania API.
// `zajete` — URL-e przypisane już innej podstronie (np. „Oferta" nie ma być zarazem „Zespołem").
function findSubpageUrl(homeMd, baseUrl, navPatterns, zajete) {
  let baseHost;
  try { baseHost = new URL(baseUrl).host; } catch { return null; }
  const homeNorm = baseUrl.replace(/\/+$/, '');
  const links = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(homeMd)) !== null) {
    const text = m[1].trim();
    const href = m[2].trim();
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let abs;
    try { abs = new URL(href, baseUrl); } catch { continue; }
    if (abs.host !== baseHost) continue;                       // tylko ta sama domena
    if (abs.href.replace(/\/+$/, '') === homeNorm) continue;   // nie strona główna
    if (ASSET_EXT.test(abs.pathname)) continue;
    if (zajete && zajete.has(abs.href)) continue;
    links.push({ text, url: abs.href });
  }
  // Preferuj wg kolejności wzorców; w obrębie grupy — pierwszy trafiony link.
  for (const pat of navPatterns) {
    const hit = links.find(l => pat.test(l.text));
    if (hit) return hit.url;
  }
  return null;
}

// (2) Fallback: Firecrawl mapUrl — gdy menu jest budowane JS/ramkami i nie ma go w linkach
// (typowe dla starszych stron kancelarii). Dopasowuje po slugu ścieżki, nie po anchor-tekście.
// `cache` — mapa domeny pobierana raz na kancelarię, nie raz na podstronę.
async function findSubpageUrlViaMap(app, baseUrl, slugPatterns, cache, zajete) {
  let baseHost, homeNorm;
  try { baseHost = new URL(baseUrl).host; homeNorm = baseUrl.replace(/\/+$/, ''); } catch { return null; }

  if (!cache.urls) {
    let res;
    try { res = await app.mapUrl(baseUrl); } catch { res = null; }
    const raw = res?.links || res?.urls || (Array.isArray(res) ? res : []);
    cache.urls = raw.map(x => (typeof x === 'string' ? x : x?.url)).filter(Boolean);
  }

  const cands = [];
  for (const u of cache.urls) {
    let abs;
    try { abs = new URL(u); } catch { continue; }
    if (abs.host !== baseHost) continue;
    if (abs.href.replace(/\/+$/, '') === homeNorm) continue;
    if (ASSET_EXT.test(abs.pathname)) continue;
    if (zajete && zajete.has(abs.href)) continue;
    cands.push(abs);
  }
  for (const pat of slugPatterns) {
    const hit = cands.find(a => pat.test(a.pathname));
    if (hit) return hit.href;
  }
  return null;
}

function extractHeadings(md) {
  const h = { h1: [], h2: [], h3: [] };
  md.split('\n').forEach(line => {
    if (/^#\s/.test(line)) h.h1.push(line.replace(/^#\s/, '').trim());
    else if (/^##\s/.test(line)) h.h2.push(line.replace(/^##\s/, '').trim());
    else if (/^###\s/.test(line)) h.h3.push(line.replace(/^###\s/, '').trim());
  });
  return h;
}

// Lista nazwanych dziedzin (kuratorowana — zero szumu). ≥3 trafienia = specjalizacja konkretna.
const PRACTICE_AREAS = [
  'prawo karne', 'prawo karno-skarbowe', 'prawo wykroczeń', 'prawo cywilne', 'prawo spadkowe',
  'prawo rodzinne', 'prawo nieruchomości', 'prawo mieszkaniowe', 'prawo spółdzielcze',
  'prawo budowlane', 'prawo administracyjne', 'prawo pracy', 'prawo ubezpieczeń', 'prawo gospodarcze',
  'prawo handlowe', 'prawo spółek', 'prawo podatkowe', 'prawo medyczne', 'prawo autorskie',
  'prawo własności intelektualnej', 'prawo konsumenckie', 'prawo bankowe', 'prawo upadłościowe',
  'prawo zamówień publicznych', 'prawo transportowe', 'prawo rolne', 'prawo morskie',
  'prawo ochrony środowiska', 'rozwody', 'alimenty', 'spadki', 'zachowek', 'podział majątku',
  'windykacja', 'odszkodowania', 'upadłość', 'restrukturyzacja', 'rejestracja spółek',
  'obsługa firm', 'rodo', 'ochrona danych', 'mediacje',
];
function detectPracticeAreas(md) {
  const found = [];
  for (const f of PRACTICE_AREAS) {
    const rx = new RegExp('\\b' + f.replace(/-/g, '\\-') + '\\b', 'i');
    if (rx.test(md)) found.push(f);
  }
  return found;
}

// ── Sygnały wieku/zaniedbania strony (dla oceny leada P2 i P5) ───────
// Wykrywa ślady starej, dawno nieruszanej strony: rok z copyright, meta generator (CMS),
// tanie/stare szablony (templatemo) i edytory. Surowe fakty — interpretację robi Claude.
function detectAgeSignals(md, html) {
  const text = (md || '') + '\n' + (html || '');
  const signals = [];

  // Najnowszy rok w kontekście copyright = kiedy stronę ostatnio (deklaratywnie) tknięto.
  let copyrightYear = null;
  const yearRe = /(?:©|&copy;|copyright|wszelkie prawa zastrzeżone)[\s\S]{0,40}?((?:19|20)\d{2})(?:\s*[-–—]\s*((?:19|20)\d{2}))?/gi;
  let ym;
  while ((ym = yearRe.exec(text)) !== null) {
    const y = parseInt(ym[2] || ym[1], 10);
    if (y >= 1995 && y <= 2100 && (copyrightYear === null || y > copyrightYear)) copyrightYear = y;
  }
  if (copyrightYear) signals.push('copyright ' + copyrightYear);

  // <meta name="generator"> — oba układy atrybutów.
  const g1 = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
  const g2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i);
  const generator = (g1 && g1[1]) || (g2 && g2[1]) || null;
  if (generator) signals.push('generator: ' + generator);

  // Tanie/stare szablony i edytory — szukaj tylko w atrybutach tagów i komentarzach HTML,
  // nie w treści widocznej (tekst artykułu o Joomli to nie jest dowód szablonu).
  const structuralHtml = [
    ...(html.match(/<!--[\s\S]*?-->/g) || []),
    ...(html.match(/<[^>]+>/g) || []),
  ].join('\n');
  const templateHints = [];
  [/templatemo/i, /dreamweaver/i, /frontpage/i, /\bjoomla\b/i, /\bdrupal\b/i].forEach(rx => {
    const m = structuralHtml.match(rx);
    if (m) templateHints.push(m[0].toLowerCase());
  });
  const uniqHints = [...new Set(templateHints)];
  if (uniqHints.length) signals.push('szablon/silnik: ' + uniqHints.join(', '));

  return { copyrightYear, generator, templateHints: uniqHints, signals, count: signals.length };
}

// ── Ekstraktory treści podstron ──────────────────────────────────────

function extractServices(md) {
  const practiceAreas = detectPracticeAreas(md);
  return { practiceAreas, practiceAreaCount: practiceAreas.length };
}

const IMIE_NAZWISKO = /\b([A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]{2,})\s+([A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]{2,}(?:-[A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]{2,})?)\b/;
const TYTULY = ['adwokat', 'radca prawny', 'aplikant adwokacki', 'aplikant radcowski',
                'notariusz', 'doradca podatkowy', 'rzecznik patentowy', 'mediator'];

/**
 * Zespół — surowe fakty do wymiaru B. Nie interpretuje: liczy nazwiska, zbiera tytuły,
 * sprawdza ślad obsługi firm i liczbę lokalizacji (po odrębnych kodach pocztowych).
 */
function extractTeam(md) {
  // Nazwiska: z nagłówków (typowa karta prawnika) + sąsiedztwo tytułu zawodowego.
  const nazwiska = new Set();
  const H = extractHeadings(md);
  [...H.h2, ...H.h3].forEach(h => {
    const czysty = h.replace(/\|/g, ' ').trim();
    const m = czysty.match(IMIE_NAZWISKO);
    // nagłówek będący *tylko* nazwiskiem (ew. z tytułem) — nie zdanie zawierające nazwisko
    if (m && czysty.length <= 60) nazwiska.add(m[0]);
  });
  const tytulRe = new RegExp('(?:' + TYTULY.join('|') + ')\\s+' + IMIE_NAZWISKO.source, 'gi');
  let t;
  while ((t = tytulRe.exec(md)) !== null) nazwiska.add((t[1] + ' ' + t[2]).trim());

  const titles = TYTULY.filter(x => new RegExp('\\b' + x + '\\b', 'i').test(md));

  // Lokalizacje: odrębne kody pocztowe (00-000). Oddziały bywają jedynym śladem skali.
  const kody = new Set((md.match(/\b\d{2}-\d{3}\b/g) || []));

  return {
    lawyerCount: nazwiska.size,
    lawyers: [...nazwiska].slice(0, 20),
    titles,
    // [a-złśżźćąęóń]* zamiast \w* — \w w JS nie łapie polskich znaków diakrytycznych,
    // a odmiana bywa dowolna: obsługa/obsługę/obsługi, prawna/prawną/prawnej.
    corporateClients: /obsług[a-złśżźćąęóń]*\s+(prawn[a-złśżźćąęóń]*\s+)?(firm|przedsiębiorc|spółek|podmiot|biznes)|dla\s+(firm|przedsiębiorc|biznesu)|klient[a-złśżźćąęóń]*\s+(biznesow|instytucjonaln|korporacyjn)/i.test(md),
    locationCount: kody.size,
    locations: [...kody].slice(0, 5),
  };
}

const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

/** Aktualności — data ostatniego wpisu (wymiar D + świeżość treści z Kroku 0). */
function extractNews(md) {
  const daty = [];
  let m;

  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
  while ((m = iso.exec(md)) !== null) daty.push(`${m[1]}-${m[2]}-${m[3]}`);

  const kropki = /\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/g;
  while ((m = kropki.exec(md)) !== null) {
    daty.push(`${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`);
  }

  const slowne = new RegExp('\\b(\\d{1,2})\\s+(' + MIESIACE.join('|') + ')\\s+(20\\d{2})\\b', 'gi');
  while ((m = slowne.exec(md)) !== null) {
    const mies = MIESIACE.indexOf(m[2].toLowerCase()) + 1;
    daty.push(`${m[3]}-${String(mies).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`);
  }

  // Odsiej daty z przyszłości (numery ustaw, literówki) — nie mogą być datą wpisu.
  const dzis = new Date().toISOString().slice(0, 10);
  const realne = daty.filter(d => d <= dzis).sort();

  const lastPostDate = realne.length ? realne[realne.length - 1] : null;
  const lataOdWpisu = lastPostDate
    ? Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return { lastPostDate, lataOdWpisu, dateCount: new Set(realne).size };
}

/** Kontakt — wszystkie emaile/telefony + kody pocztowe (adresy oddziałów). Do trackera, nie do oceny. */
function extractContact(md) {
  const emails = [...new Set(md.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])]
    // odfiltruj śmieci typu nazwa-pliku@2x.png z markdownu obrazków
    .filter(e => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e))
    .slice(0, 5);
  const phones = [...new Set(md.match(/(\+48[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}|\b\d{3}[\s\-]\d{3}[\s\-]\d{3}\b)/g) || [])].slice(0, 5);
  const postalCodes = [...new Set(md.match(/\b\d{2}-\d{3}\b/g) || [])].slice(0, 5);
  return { emails, phones, postalCodes };
}

const PODSTRONY = {
  services: { nav: SERVICES_NAV, slug: SERVICES_SLUG, extract: extractServices, opis: 'usług' },
  team:     { nav: TEAM_NAV,     slug: TEAM_SLUG,     extract: extractTeam,     opis: 'zespołu' },
  news:     { nav: NEWS_NAV,     slug: NEWS_SLUG,     extract: extractNews,     opis: 'aktualności' },
  contact:  { nav: CONTACT_NAV,  slug: CONTACT_SLUG,  extract: extractContact,  opis: 'kontaktu' },
};

/**
 * Dociąga jedną podstronę wybranego typu i wyciąga z niej fakty.
 * `cache` — współdzielony między typami wynik mapUrl (jedno wywołanie API na kancelarię).
 * `zajete` — URL-e wzięte już przez inny typ, żeby ta sama strona nie trafiła w dwa pola.
 */
async function fetchSubpage(app, homeMd, baseUrl, typ, cache, zajete) {
  const spec = PODSTRONY[typ];
  let url = findSubpageUrl(homeMd, baseUrl, spec.nav, zajete);
  let via = 'link';
  if (!url) { url = await findSubpageUrlViaMap(app, baseUrl, spec.slug, cache, zajete); via = 'map'; }
  if (!url) return { found: false };
  if (zajete) zajete.add(url);

  const res = await app.scrapeUrl(url, { formats: ['markdown'] });
  const md = res.markdown || '';
  const headings = extractHeadings(md);
  return {
    found: true,
    url,
    via,
    wordCount: md.split(/\s+/).filter(Boolean).length,
    headingCounts: { h1: headings.h1.length, h2: headings.h2.length, h3: headings.h3.length },
    headings,
    ...spec.extract(md),
  };
}

// ── Firecrawl: treść + struktura ────────────────────────────────────
async function scrapeContent(targetUrl, { withSubpages = false } = {}) {
  const Firecrawl = require('firecrawl').default;
  const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

  const res = await app.scrapeUrl(targetUrl, {
    formats: ['markdown', 'html'],
  });

  const md = res.markdown || '';
  const html = res.html || '';

  // Wyciągnij nagłówki z markdown
  const headings = { h1: [], h2: [], h3: [] };
  md.split('\n').forEach(line => {
    if (/^#\s/.test(line)) headings.h1.push(line.replace(/^#\s/, '').trim());
    else if (/^##\s/.test(line)) headings.h2.push(line.replace(/^##\s/, '').trim());
    else if (/^###\s/.test(line)) headings.h3.push(line.replace(/^###\s/, '').trim());
  });

  // Meta z odpowiedzi Firecrawl
  const meta = res.metadata || {};

  // Wykryj CTA (proste heurystyki — linki/buttony z typowymi frazami)
  const ctaPatterns = /(kontakt|napisz|zadzwoń|umów|wyceń|zapytaj|porozmawiaj|skontaktuj|bezpłatn|konsultacj|darmow|wyślij|rezerwuj|zamów)/i;
  // Słabe/ogólne CTA — link istnieje, ale tekst nie niesie intencji konwersji.
  // Pozwala odróżnić „brak CTA" (❌) od „CTA jest, ale słabe" (⚠️), np. „Kliknij tutaj".
  const genericCtaPatterns = /^(kliknij(\s+tutaj)?|tutaj|więcej|czytaj\s+więcej|zobacz(\s+więcej|\s+ofertę)?|sprawdź|dowiedz\s+się(\s+więcej)?|przejdź|wejdź|otwórz|link)\s*$/i;
  const ctaTexts = [];
  const genericCtaTexts = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRegex.exec(md)) !== null) {
    const text = m[1].trim();
    if (text.length >= 40) continue;
    if (ctaPatterns.test(text)) ctaTexts.push(text);
    else if (genericCtaPatterns.test(text)) genericCtaTexts.push(text);
  }

  // Wykryj formularz, telefon, email
  const hasForm = /<form|type=["']email["']|type=["']tel["']/i.test(html);
  const phoneMatch = md.match(/(\+48[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}|\d{3}[\s\-]\d{3}[\s\-]\d{3})/);
  const emailMatch = md.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

  // Próbki komunikacji (pierwsze akapity)
  const paragraphs = md.split('\n').filter(l => l.trim().length > 60 && !l.startsWith('#') && !l.startsWith('['));
  const messagingSamples = paragraphs.slice(0, 4).map(p => p.trim().slice(0, 200));

  // Sprawdź zwroty na granicy etyki
  const ethicsFlags = [];
  if (/najlepsz|nr\s?1|numer jeden|gwarantuj.*wygran|100%\s*skuteczn/i.test(md)) {
    ethicsFlags.push('Wykryto zwroty wartościujące/obietnice — sprawdź zgodność z etyką zawodową');
  }

  // Sygnały zaufania (heurystyki nad pełnym markdownem) — opinie, lata doświadczenia, liczby, zespół.
  // count = ile odrębnych typów sygnału; mapuje na wymiar 6: 0 → ❌, 1 → ⚠️, ≥2 → ✅.
  const trustSignals = {
    yearsExperience: /\b(?:od|ponad|blisko)?\s*\d{1,3}\s*lat(?:a)?\b/i.test(md) && /doświadcz|praktyk|na rynku|działa/i.test(md),
    testimonials: /opinie\s+klient|referencj|„[^”]{15,}”|"[^"]{15,}"|»[^«]{15,}«/i.test(md),
    numbers: /\b\d{2,}\s*(spraw|klient|wygran|projekt|postępowa)/i.test(md),
    team: /(zespół|adwokat|radca prawny|aplikant)\b/i.test(md) && /\b[A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]+\s+[A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]+/.test(md),
  };
  trustSignals.count = Object.values(trustSignals).filter(v => v === true).length;

  const content = {
    url: targetUrl,
    metaTitle: meta.title || null,
    metaDescription: meta.description || null,
    h1: headings.h1,
    headings,
    headingCounts: { h1: headings.h1.length, h2: headings.h2.length, h3: headings.h3.length },
    ctaTexts: [...new Set(ctaTexts)],
    ctaCount: new Set(ctaTexts).size,
    genericCtaTexts: [...new Set(genericCtaTexts)],
    genericCtaCount: new Set(genericCtaTexts).size,
    hasForm,
    phone: phoneMatch ? phoneMatch[0] : null,
    email: emailMatch ? emailMatch[0] : null,
    messagingSamples,
    ethicsFlags,
    trustSignals,
    ageSignals: detectAgeSignals(md, html),
    wordCount: md.split(/\s+/).length,
  };

  // Dociągnij podstrony (tylko dla audytowanej strony, nie konkurenta):
  //   servicesPage — bez niej specjalizacja oceniana jest po samym hero, co zaniża wymiar 1
  //   teamPage     — wymiar B oceny leada (ilu prawników, tytuły, obsługa firm, lokalizacje)
  //   newsPage     — wymiar D oceny leada + świeżość treści (data ostatniego wpisu)
  //   contactPage  — email/telefony do trackera (email często jest tylko tam)
  // Kolejność ma znaczenie: `zajete` pilnuje, by ta sama strona nie trafiła w dwa pola.
  // Koszt: do 4 dodatkowych wywołań Firecrawl na kancelarię (+1 mapUrl przy fallbacku) —
  // przy limicie ~500 stron/mies to ~80–100 pełnych audytów miesięcznie.
  if (withSubpages) {
    const cache = {};          // wynik mapUrl — jedno wywołanie API na kancelarię
    const zajete = new Set();
    for (const [typ, pole] of [['services', 'servicesPage'], ['team', 'teamPage'], ['news', 'newsPage'], ['contact', 'contactPage']]) {
      try {
        content[pole] = await fetchSubpage(app, md, targetUrl, typ, cache, zajete);
      } catch (e) {
        content[pole] = { found: false, error: e.message };
      }
    }
  }

  return content;
}

// Wiele starszych szablonów (Cherry Framework, AOS, WOW.js) chowa treść do
// czasu realnego scrolla ("reveal on scroll") — klasy typu "lazy-load-box
// trigger". fullPage:true tylko rozciąga viewport, nigdy nie scrolluje, więc
// taka treść zostaje niewidoczna na zrzucie, mimo że jest w DOM (patrz audyt
// adwokatsoltys.pl — cztery boksy usług znikały właśnie tak). Przewijamy
// realnie całą stronę przed zrzutem, żeby dać tym skryptom szansę odpalić.
// (Uwaga: nie neutralizujemy position:fixed/sticky — próba naprawy sztucznie
// rozciągniętego viewportu w ten sposób złamała layout na kancelaria-liszka.pl,
// gdzie fixed hero jest częścią zamierzonego układu, a inne sekcje mają
// margines/padding skalibrowany właśnie pod jego fixed-pozycjonowanie.)
async function scrollThroughPage(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 500));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  }).catch(() => {});
}

// ── Playwright + Lighthouse: wydajność + screenshoty ────────────────
// outDir — katalog docelowy na screenshoty audytowanej strony.
// withScreenshots: false dla konkurenta (nie potrzebujemy jego zrzutów, a to skraca czas).
async function scrapeVitals(targetUrl, outDir, { withScreenshots = true } = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();

  const vitals = { https: targetUrl.startsWith('https://') };

  // Screenshot desktop (tylko dla audytowanej strony)
  if (withScreenshots) {
    const ctxD = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const pageD = await ctxD.newPage();
    try {
      await pageD.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await scrollThroughPage(pageD);
      await pageD.screenshot({ path: path.join(outDir, 'screenshot-desktop.png'), fullPage: true });
    } catch (e) { vitals.desktopError = e.message; }
    await ctxD.close();
  }

  // Mobile: viewport + dane strukturalne (+ screenshot tylko dla audytowanej strony)
  const ctxM = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const pageM = await ctxM.newPage();
  try {
    await pageM.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    if (withScreenshots) {
      await scrollThroughPage(pageM);
      await pageM.screenshot({ path: path.join(outDir, 'screenshot-mobile.png'), fullPage: true });
    }
    const hasViewport = await pageM.$('meta[name="viewport"]');
    vitals.mobileFriendly = !!hasViewport;
    // Strukturalne dane?
    const ld = await pageM.$$('script[type="application/ld+json"]');
    vitals.hasStructuredData = ld.length > 0;
  } catch (e) { vitals.mobileError = e.message; }
  await ctxM.close();

  await browser.close();

  // Lighthouse (opcjonalny — może nie być dostępny). Serializowany muteksem (patrz withLighthouseLock).
  await withLighthouseLock(async () => {
    try {
      const lighthouse = require('lighthouse').default || require('lighthouse');
      const chromeLauncher = require('chrome-launcher');
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const runnerResult = await lighthouse(targetUrl, {
        port: chrome.port, onlyCategories: ['performance'], formFactor: 'mobile',
      });
      const lhr = runnerResult.lhr;
      vitals.performanceScore = Math.round(lhr.categories.performance.score * 100);
      vitals.lcp = lhr.audits['largest-contentful-paint']?.numericValue / 1000;
      vitals.cls = lhr.audits['cumulative-layout-shift']?.numericValue;
      vitals.tbt = lhr.audits['total-blocking-time']?.numericValue;
      // chrome-launcher na Windows bywa, że nie usunie swojego temp-profilu (EPERM) — sprzątanie
      // nie może zabić pomiaru, bo dane są już zebrane powyżej. kill() bywa void (nie-Promise),
      // więc owijamy w try/catch, nie w .catch().
      try { await chrome.kill(); } catch (_) { /* cleanup temp-profilu — ignorujemy */ }
    } catch (e) {
      vitals.lighthouseAvailable = false;
      vitals.lighthouseError = 'Lighthouse niedostępny — pomiar szybkości pominięty: ' + e.message;
    }
  });

  return vitals;
}

// ── Audyt jednej strony (treść + wydajność + opcjonalny konkurent) ──
async function auditOne(targetUrl, { competitorUrl } = {}) {
  const outDir = outDirFor(targetUrl);

  // Treść (Firecrawl) — gdy zawiedzie, rzucamy dalej (batch zaznaczy błąd, single zakończy).
  // withSubpages: dociąga „Zakres usług" (specjalizacja z treści, nie z hero), „Zespół" i „Aktualności".
  const content = await scrapeContent(targetUrl, { withSubpages: true });
  fs.writeFileSync(path.join(outDir, 'content.json'), JSON.stringify(content, null, 2));

  // Wydajność + screenshoty (Playwright/Lighthouse) — błąd tu nie przekreśla audytu treści.
  let vitals = null;
  try {
    vitals = await scrapeVitals(targetUrl, outDir, { withScreenshots: true });
    fs.writeFileSync(path.join(outDir, 'vitals.json'), JSON.stringify(vitals, null, 2));
  } catch (e) {
    console.error(`    ✗ Playwright błąd (${targetUrl}):`, e.message);
  }

  // Konkurent (opcjonalny) — bez screenshotów; Lighthouse zostaje (porównanie szybkości).
  if (competitorUrl) {
    try {
      const cContent = await scrapeContent(competitorUrl);
      const cVitals = await scrapeVitals(competitorUrl, outDir, { withScreenshots: false });
      fs.writeFileSync(path.join(outDir, 'competitor.json'),
        JSON.stringify({ url: competitorUrl, content: cContent, vitals: cVitals }, null, 2));
    } catch (e) {
      console.error('    ✗ Konkurent — błąd (audyt głównej strony bez zmian):', e.message);
    }
  }

  return { domain: domainOf(targetUrl), content, vitals };
}

// ── Etap 0: podgląd (tylko screenshot, bez Firecrawl ani Lighthouse) ──
// Kwalifikacja wizualna leada ZANIM spalimy limit Firecrawl na pełny audyt. ~5–10 s.
async function peekScreenshot(targetUrl) {
  const outDir = outDirFor(targetUrl);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const shot = path.join(outDir, 'screenshot-peek.png');
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await scrollThroughPage(page);
    await page.screenshot({ path: shot, fullPage: true });
    await ctx.close();
  } finally {
    await browser.close();
  }
  return { outDir, shot };
}

// ── Filtrowanie leadów przed scrape: zamknięte firmy, duplikaty, zły URL ──
// Zwraca { toScrape, skipped } — skipped z powodem (batch-report.js odtwarza tę samą listę
// do output/batch-pominiete.csv). Leady z blokadą kontaktu (do_not_contact / status) NIE są
// tu pomijane — audyt wolno zaktualizować; blokada dotyczy wyłącznie maila i jest zapisywana
// w lead-info.json.
function filterLeadsForScrape(leads) {
  const toScrape = [];
  const skipped = [];
  const seenDomains = new Set();
  const seenPhones = new Set();
  const seenPlaceIds = new Set();

  for (const lead of leads) {
    const domain = normalizeDomain(lead.url);
    if (!lead.url || !domain || !/\./.test(domain)) {
      skipped.push({ lead, powod: 'brak poprawnego URL' });
      continue;
    }
    if (lead.permanentlyClosed) {
      skipped.push({ lead, powod: 'firma zamknięta (permanentlyClosed)' });
      continue;
    }
    const phone = normalizePhone(lead.telefon);
    if (seenDomains.has(domain)) { skipped.push({ lead, powod: 'duplikat (domena)' }); continue; }
    if (lead.placeId && seenPlaceIds.has(lead.placeId)) { skipped.push({ lead, powod: 'duplikat (placeId)' }); continue; }
    if (phone && seenPhones.has(phone)) { skipped.push({ lead, powod: 'duplikat (telefon)' }); continue; }
    seenDomains.add(domain);
    if (lead.placeId) seenPlaceIds.add(lead.placeId);
    if (phone) seenPhones.add(phone);
    toScrape.push(lead);
  }
  return { toScrape, skipped };
}

// lead-info.json — dane wejściowe leada obok danych scrape, żeby Claude (kwalifikacja)
// i batch-report.js miały identyfikację, kontekst Google Maps i blokadę kontaktu w jednym miejscu.
// Dane Google Maps to KONTEKST biznesowy, nie dowód gotowości zakupowej (kryteria-audytu.md → wymiar B).
function writeLeadInfo(lead, zrodloAudytu) {
  const block = isContactBlocked(lead);
  const info = {
    lead_id: lead.lead_id ?? null,
    nazwa: lead.nazwa || '',
    miasto: lead.miasto ?? null,
    url: lead.url,
    telefon: lead.telefon ?? null,
    email: lead.email ?? null,
    imie_kontaktowe: lead.imie_kontaktowe ?? null,
    status: lead.status ?? null,
    do_not_contact: !!lead.do_not_contact,
    notatki: lead.notatki ?? null,
    data_M1: lead.data_M1 ?? null,
    gmail_thread_id: lead.gmail_thread_id ?? null,
    google_maps: {
      totalScore: lead.totalScore ?? null,
      reviewsCount: lead.reviewsCount ?? null,
      imagesCount: lead.imagesCount ?? null,
      categories: lead.categories || [],
      placeId: lead.placeId ?? null,
    },
    mail_zablokowany: block.blocked,
    powod_blokady: block.reason,
    zrodlo_audytu: zrodloAudytu,
  };
  fs.writeFileSync(path.join(outDirFor(lead.url), 'lead-info.json'), JSON.stringify(info, null, 2));
  return info;
}

// ── Tryb wsadowy: max 3 strony równolegle; błąd jednej nie przerywa reszty ──
async function runBatch(csvPath) {
  const { format, leads } = parseLeadsCsv(fs.readFileSync(csvPath, 'utf8'));
  if (leads.length === 0) {
    console.error('CSV pusty lub bez poprawnych wierszy (formaty: nazwa,url lub rozszerzony — patrz nagłówek scrape.js).');
    process.exit(1);
  }
  const { toScrape, skipped } = filterLeadsForScrape(leads);
  for (const s of skipped) {
    console.log(`    ⊘ pomijam: ${s.lead.nazwa || s.lead.url || '(bez nazwy)'} — ${s.powod}`);
  }

  const zrodloAudytu = format === 'extended'
    ? 'scrape_full+screenshots+google_maps'
    : 'scrape_full+screenshots';
  const total = toScrape.length;
  console.log(`Tryb wsadowy (format CSV: ${format}): ${total} kancelarii do scrape (${skipped.length} pominiętych), max 3 równolegle.\n`);

  let started = 0, ok = 0, failed = 0;
  const queue = [...toScrape];
  async function worker() {
    while (queue.length) {
      const lead = queue.shift();
      const n = ++started;
      console.log(`[${n}/${total}] Audytuję ${lead.url} (${lead.nazwa})...`);
      try {
        const info = writeLeadInfo(lead, zrodloAudytu);
        if (info.mail_zablokowany) {
          console.log(`    ⓘ [${n}/${total}] blokada kontaktu (${info.powod_blokady}) — audyt można zaktualizować, przekazanie do Claude_import NIE powstanie`);
        }
        await auditOne(lead.url);
        ok++;
        console.log(`    ✓ [${n}/${total}] ${lead.nazwa}`);
      } catch (e) {
        failed++;
        console.error(`    ✗ [${n}/${total}] ${lead.nazwa} — ${e.message}`);
        try { fs.writeFileSync(path.join(outDirFor(lead.url), 'scrape-error.txt'), e.message); }
        catch (_) { /* niepoprawna domena — pomijamy marker */ }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, total) }, () => worker()));

  console.log(`\nGotowe: ${ok} OK, ${failed} błędów, ${skipped.length} pominiętych (z ${leads.length}).`);
  console.log('Dalej: Claude czyta dane każdej strony i generuje audyt.md + audyt-dane.json + kwalifikacja-leada.md');
  console.log('(tylko obserwacja_do_maila dla 7–8/8 PISAĆ bez blokady kontaktu — bez tematu/treści maila, patrz SKILL.md → Krok 5–6),');
  console.log('a na końcu: node batch-report.js ' + path.basename(csvPath) + '  → output/batch-leady.csv (+ push-import.js dla rodzynków → Claude_import)');
}

// ── Etap 0 wsadowo: tylko screenshoty (bez Firecrawl/Lighthouse) — max 8 równolegle.
//    Wyższa współbieżność niż --batch, bo to sam Playwright: nie ma limitu Firecrawl
//    ani muteksu Lighthouse do respektowania.
async function runPeekBatch(csvPath) {
  const { leads } = parseLeadsCsv(fs.readFileSync(csvPath, 'utf8'));
  if (leads.length === 0) {
    console.error('CSV pusty lub bez poprawnych wierszy (formaty: nazwa,url lub rozszerzony).');
    process.exit(1);
  }
  const { toScrape: rows, skipped } = filterLeadsForScrape(leads);
  for (const s of skipped) {
    console.log(`    ⊘ pomijam: ${s.lead.nazwa || s.lead.url || '(bez nazwy)'} — ${s.powod}`);
  }
  const total = rows.length;
  console.log(`Etap 0 wsadowo: ${total} kancelarii (${skipped.length} pominiętych), max 8 równolegle.\n`);

  let started = 0, ok = 0, failed = 0;
  const queue = [...rows];
  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      const n = ++started;
      try {
        const { shot } = await peekScreenshot(row.url);
        ok++;
        console.log(`[${n}/${total}] ✓ ${row.url} (${row.nazwa}) → ${path.relative(path.join(__dirname, '..'), shot)}`);
      } catch (e) {
        failed++;
        console.error(`[${n}/${total}] ✗ ${row.url} (${row.nazwa}) — ${e.message}`);
        try { fs.writeFileSync(path.join(outDirFor(row.url), 'scrape-error.txt'), e.message); }
        catch (_) { /* niepoprawna domena — pomijamy marker */ }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, total) }, () => worker()));

  console.log(`\nGotowe: ${ok} OK, ${failed} błędów (z ${total}).`);
  console.log('Dalej: Claude ogląda każdy screenshot-peek.png i ocenia priorytet_wizualny (kryteria-audytu.md → Krok 0).');
}

// ── Dispatch ────────────────────────────────────────────────────────
(async () => {
  if (arg1 === '--batch') {
    const csvPath = process.argv[3];
    if (!csvPath) { console.error('Użycie: node scrape.js --batch <lista.csv>'); process.exit(1); }
    await runBatch(csvPath);
    return;
  }

  if (arg1 === '--peek-batch') {
    const csvPath = process.argv[3];
    if (!csvPath) { console.error('Użycie: node scrape.js --peek-batch <lista.csv>'); process.exit(1); }
    await runPeekBatch(csvPath);
    return;
  }

  // Etap 0 — podgląd wizualny bez pełnego audytu (oszczędza limit Firecrawl).
  if (arg1 === '--peek') {
    const raw = process.argv[3];
    if (!raw) { console.error('Użycie: node scrape.js --peek <url>'); process.exit(1); }
    const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
    console.log(`Etap 0 — podgląd (bez Firecrawl): ${url}`);
    try {
      const { shot } = await peekScreenshot(url);
      console.log(`    ✓ screenshot → ${path.relative(path.join(__dirname, '..'), shot)}`);
      console.log('Teraz Claude ogląda screenshot i ocenia priorytet_wizualny (kryteria-audytu.md → Krok 0).');
      console.log('To ocena WSTĘPNA (pewnosc_oceny: "wstepna", status_sugerowany: "DO_AUDYTU") — bez decyzji PISAĆ/ODPUŚCIĆ.');
      console.log('Jeśli wizualnie brak potencjału — zapisz lead-skip.txt i NIE uruchamiaj pełnego scrape.');
    } catch (e) {
      console.error('    ✗ Podgląd nieudany:', e.message);
      process.exit(1);
    }
    return;
  }

  // Tryb pojedynczy
  const targetUrl = arg1;
  const competitorUrl = process.argv[3]; // opcjonalny — porównanie z konkretnym konkurentem
  console.log(`Audyt: ${targetUrl}`);
  console.log('Pobieram treść + wydajność...');
  try {
    const { domain, content, vitals } = await auditOne(targetUrl, { competitorUrl });
    console.log(`    ✓ ${content.headingCounts.h2} sekcji H2, ${content.ctaCount} CTA (mocne) + ${content.genericCtaCount} słabe, formularz: ${content.hasForm}, sygnały zaufania: ${content.trustSignals.count}`);
    if (content.servicesPage?.found) {
      console.log(`    ✓ podstrona usług: ${content.servicesPage.practiceAreaCount} dziedzin (${content.servicesPage.url})`);
    } else {
      console.log(`    ⚠ nie znaleziono podstrony „Zakres usług" — specjalizację oceń z hero strony głównej`);
    }
    if (content.teamPage?.found) {
      const t = content.teamPage;
      console.log(`    ✓ podstrona zespołu: ${t.lawyerCount} prawników, obsługa firm: ${t.corporateClients}, lokalizacji: ${t.locationCount} (${t.url})`);
    } else {
      console.log(`    ⚠ nie znaleziono podstrony „Zespół" — wymiar B (potencjał) oceń ostrożnie, nie zgaduj`);
    }
    if (content.newsPage?.found) {
      const n = content.newsPage;
      console.log(`    ✓ podstrona aktualności: ostatni wpis ${n.lastPostDate || 'brak daty'}${n.lataOdWpisu != null ? ` (${n.lataOdWpisu} lat temu)` : ''} (${n.url})`);
    } else {
      console.log(`    ⚠ nie znaleziono podstrony „Aktualności" — brak danych do wymiaru D`);
    }
    if (content.contactPage?.found) {
      const c = content.contactPage;
      console.log(`    ✓ podstrona kontaktu: ${c.emails.length} email(i), ${c.phones.length} telefon(ów) (${c.url})`);
    } else {
      console.log(`    ⚠ nie znaleziono podstrony „Kontakt" — email do trackera tylko z tego, co na stronie głównej`);
    }
    if (vitals) console.log(`    ✓ performance: ${vitals.performanceScore ?? 'n/d'}, mobile: ${vitals.mobileFriendly}, schema: ${vitals.hasStructuredData}`);
    console.log(`\nGotowe → output/${domain}/`);
    console.log(`Teraz Claude czyta content.json + vitals.json${competitorUrl ? ' + competitor.json' : ''} i generuje audyt wg SKILL.md`);
  } catch (e) {
    console.error('    ✗ Firecrawl błąd:', e.message);
    process.exit(1);
  }
})();
