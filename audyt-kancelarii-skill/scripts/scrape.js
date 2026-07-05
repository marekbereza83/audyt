#!/usr/bin/env node
/**
 * scrape.js — pobiera stronę kancelarii do audytu.
 * Użycie:
 *   node scrape.js <url> [<url-konkurenta>]    — pojedyncza strona (+ opcjonalny konkurent)
 *   node scrape.js --peek <url>                — Etap 0: tylko screenshot (bez Firecrawl), kwalifikacja wizualna
 *   node scrape.js --batch <lista.csv>         — tryb wsadowy (CSV: nazwa,url), max 3 równolegle
 * Wymaga: FIRECRAWL_API_KEY w .env lub w env, zainstalowany chromium (npx playwright install chromium)
 *
 * Zwraca do output/<domena>/:
 *   content.json          — markdown, nagłówki, meta, CTA, formularze, dane kontaktowe
 *                           + servicesPage: dociągnięta podstrona „Zakres usług" (specjalizacja z treści, nie z hero)
 *                           + ageSignals: ślady wieku/zaniedbania (copyright, generator, stary szablon) dla oceny leada
 *   vitals.json           — Core Web Vitals + performance score + https + mobile
 *   screenshot-desktop.png, screenshot-mobile.png
 *   competitor.json       — (tylko gdy podano url-konkurenta) { url, content, vitals } konkurenta
 *   scrape-error.txt      — (tryb batch, gdy strona zawiedzie) powód błędu
 *
 * Tryb batch zbiera tylko dane. Audyty (audyt.md + mail-fragment.txt) generuje Claude per strona,
 * a zbiorczy raport: node batch-report.js <lista.csv> → output/batch-fragments.csv
 */

require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');

const arg1 = process.argv[2];
if (!arg1) {
  console.error('Użycie:\n  node scrape.js <url> [<url-konkurenta>]\n  node scrape.js --batch <lista.csv>   (CSV z kolumnami: nazwa,url)');
  process.exit(1);
}

// Domena → nazwa katalogu w output/ (ta sama logika co w batch-report.js)
function domainOf(u) {
  return u.replace(/^https?:\/\//, '').replace(/[\/:]/g, '_').replace(/_+$/, '');
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

// (1) Próba z linków strony głównej — działa na nowoczesnych stronach, bez dodatkowego wywołania API.
function findServicesUrl(homeMd, baseUrl) {
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
    links.push({ text, url: abs.href });
  }
  // Preferuj wg kolejności SERVICES_NAV; w obrębie grupy — pierwszy trafiony link.
  for (const pat of SERVICES_NAV) {
    const hit = links.find(l => pat.test(l.text));
    if (hit) return hit.url;
  }
  return null;
}

// (2) Fallback: Firecrawl mapUrl — gdy menu jest budowane JS/ramkami i nie ma go w linkach
// (typowe dla starszych stron kancelarii). Dopasowuje po slugu ścieżki, nie po anchor-tekście.
async function findServicesUrlViaMap(app, baseUrl) {
  let baseHost, homeNorm;
  try { baseHost = new URL(baseUrl).host; homeNorm = baseUrl.replace(/\/+$/, ''); } catch { return null; }
  let res;
  try { res = await app.mapUrl(baseUrl); } catch { return null; }
  const raw = res?.links || res?.urls || (Array.isArray(res) ? res : []);
  const urls = raw.map(x => (typeof x === 'string' ? x : x?.url)).filter(Boolean);
  const cands = [];
  for (const u of urls) {
    let abs;
    try { abs = new URL(u); } catch { continue; }
    if (abs.host !== baseHost) continue;
    if (abs.href.replace(/\/+$/, '') === homeNorm) continue;
    if (ASSET_EXT.test(abs.pathname)) continue;
    cands.push(abs);
  }
  for (const pat of SERVICES_SLUG) {
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

async function fetchServicesPage(app, homeMd, baseUrl) {
  let url = findServicesUrl(homeMd, baseUrl);
  let via = 'link';
  if (!url) { url = await findServicesUrlViaMap(app, baseUrl); via = 'map'; }
  if (!url) return { found: false };
  const res = await app.scrapeUrl(url, { formats: ['markdown'] });
  const md = res.markdown || '';
  const headings = extractHeadings(md);
  const practiceAreas = detectPracticeAreas(md);
  return {
    found: true,
    url,
    via,
    wordCount: md.split(/\s+/).filter(Boolean).length,
    headingCounts: { h1: headings.h1.length, h2: headings.h2.length, h3: headings.h3.length },
    headings,
    practiceAreas,
    practiceAreaCount: practiceAreas.length,
  };
}

// ── Firecrawl: treść + struktura ────────────────────────────────────
async function scrapeContent(targetUrl, { withServices = false } = {}) {
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

  // Dociągnij podstronę „Zakres usług" (tylko dla audytowanej strony, nie konkurenta) —
  // bez tego specjalizacja oceniana jest po samym hero, co zaniża wymiar 1.
  if (withServices) {
    try {
      content.servicesPage = await fetchServicesPage(app, md, targetUrl);
    } catch (e) {
      content.servicesPage = { found: false, error: e.message };
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
  // withServices: dociąga podstronę „Zakres usług", by specjalizacja była z treści, nie z hero.
  const content = await scrapeContent(targetUrl, { withServices: true });
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

// ── CSV (nazwa,url) — split na OSTATNIM przecinku, bo url nie zawiera przecinka,
//    a nazwa kancelarii może (np. „RS Legal (Radzikowski, Szubielska...)"). ──
function parseCsv(text) {
  return text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => {
      const i = l.lastIndexOf(',');
      if (i < 0) return null;
      const nazwa = l.slice(0, i).trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      const url = l.slice(i + 1).trim().replace(/^"|"$/g, '');
      return { nazwa, url };
    })
    .filter(r => r && r.url && r.url.toLowerCase() !== 'url')          // pomija nagłówek nazwa,url
    .map(r => ({ nazwa: r.nazwa, url: /^https?:\/\//i.test(r.url) ? r.url : 'https://' + r.url }));
}

// ── Tryb wsadowy: max 3 strony równolegle; błąd jednej nie przerywa reszty ──
async function runBatch(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length === 0) {
    console.error('CSV pusty lub bez poprawnych wierszy (oczekiwane kolumny: nazwa,url).');
    process.exit(1);
  }
  const total = rows.length;
  console.log(`Tryb wsadowy: ${total} kancelarii, max 3 równolegle.\n`);

  let started = 0, ok = 0, failed = 0;
  const queue = [...rows];
  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      const n = ++started;
      console.log(`[${n}/${total}] Audytuję ${row.url} (${row.nazwa})...`);
      try {
        await auditOne(row.url);
        ok++;
        console.log(`    ✓ [${n}/${total}] ${row.nazwa}`);
      } catch (e) {
        failed++;
        console.error(`    ✗ [${n}/${total}] ${row.nazwa} — ${e.message}`);
        try { fs.writeFileSync(path.join(outDirFor(row.url), 'scrape-error.txt'), e.message); }
        catch (_) { /* niepoprawna domena — pomijamy marker */ }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, total) }, () => worker()));

  console.log(`\nGotowe: ${ok} OK, ${failed} błędów (z ${total}).`);
  console.log('Dalej: Claude czyta dane każdej strony i generuje audyt.md + audyt-dane.json + mail-fragment.txt (per kancelaria),');
  console.log('a na końcu: node batch-report.js ' + path.basename(csvPath) + '  → output/batch-fragments.csv');
}

// ── Dispatch ────────────────────────────────────────────────────────
(async () => {
  if (arg1 === '--batch') {
    const csvPath = process.argv[3];
    if (!csvPath) { console.error('Użycie: node scrape.js --batch <lista.csv>'); process.exit(1); }
    await runBatch(csvPath);
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
      console.log('Teraz Claude ogląda screenshot i odpowiada na 5 pytań Etapu 0 (kryteria-audytu.md → „Ocena leada").');
      console.log('Jeśli werdykt 🔴 (odpuść) — zapisz lead-skip.txt i NIE uruchamiaj pełnego scrape.');
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
    if (vitals) console.log(`    ✓ performance: ${vitals.performanceScore ?? 'n/d'}, mobile: ${vitals.mobileFriendly}, schema: ${vitals.hasStructuredData}`);
    console.log(`\nGotowe → output/${domain}/`);
    console.log(`Teraz Claude czyta content.json + vitals.json${competitorUrl ? ' + competitor.json' : ''} i generuje audyt wg SKILL.md`);
  } catch (e) {
    console.error('    ✗ Firecrawl błąd:', e.message);
    process.exit(1);
  }
})();
