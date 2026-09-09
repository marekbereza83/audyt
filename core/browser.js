/**
 * core/browser.js — wspólna warstwa przeglądarki (Playwright).
 *
 * Wydzielone z audyt-kancelarii-skill/scripts/scrape.js, bo to część całkowicie
 * niezależna od branży: uruchomienie przeglądarki, realne przewinięcie strony
 * (odpalenie lazy-load) i zrzuty w dwóch profilach.
 *
 * Uwaga historyczna — NIE usuwaj scrollThroughPage() i NIE dodawaj neutralizacji
 * position:fixed/sticky. Oba zachowania są okupione debugowaniem na realnych
 * stronach; powody w komentarzach przy funkcjach.
 */

const path = require('path');

// Dwa profile widoku. Fold (`viewport`) jest tu ważniejszy niż w audycie kancelarii:
// dla PDP „co widać bez scrolla" to osobne pytanie badawcze, nie detal techniczny.
const PROFILES = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent: null,
  },
  mobile: {
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
};

async function launchBrowser() {
  const { chromium } = require('playwright');
  return chromium.launch();
}

/**
 * Realne przewinięcie całej strony przed zrzutem.
 *
 * `fullPage: true` w Playwright tylko rozciąga viewport na wysokość strony — nigdy
 * nie scrolluje. Szablony z reveal-on-scroll (AOS, WOW.js, Cherry Framework, a w
 * ecommerce praktycznie każdy motyw Shopify z lazy-loadowanymi obrazami produktu)
 * trzymają treść ukrytą do czasu prawdziwego scrolla i na zrzucie wychodzi puste
 * miejsce, mimo że element jest w DOM.
 *
 * W sklepach to jest ostrzejszy problem niż na stronach kancelarii: galerie zdjęć
 * produktu, sekcje opinii i bloki UGC są lazy-loadowane niemal zawsze.
 */
async function scrollThroughPage(page, { step = null, pauza = 400 } = {}) {
  await page.evaluate(async ({ step, pauza }) => {
    const krok = step || window.innerHeight;
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += krok) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, pauza));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, pauza));
  }, { step, pauza }).catch(() => {});
}

/**
 * Otwiera stronę w danym profilu i oddaje ją do `fn`. Zamyka kontekst nawet przy błędzie.
 * `fn(page)` dostaje stronę już wczytaną i przewiniętą (chyba że scroll=false).
 */
async function withPage(browser, profil, targetUrl, fn, { scroll = true, timeout = 45000 } = {}) {
  const cfg = PROFILES[profil];
  if (!cfg) throw new Error(`Nieznany profil: ${profil}`);

  const ctx = await browser.newContext({
    viewport: cfg.viewport,
    ...(cfg.userAgent ? { userAgent: cfg.userAgent } : {}),
    ...(cfg.isMobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: cfg.deviceScaleFactor } : {}),
  });
  const page = await ctx.newPage();
  try {
    // `networkidle` bywa nieosiągalne w sklepach (pixele, czaty, karuzele dociągają w kółko),
    // więc łapiemy timeout i idziemy dalej z tym, co się wczytało — zamiast tracić cały skan.
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout });
    } catch (e) {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout }).catch(() => {});
      await page.waitForTimeout(2500);
    }
    if (scroll) await scrollThroughPage(page);
    return await fn(page);
  } finally {
    await ctx.close().catch(() => {});
  }
}

/**
 * Dwa zrzuty na profil:
 *   <prefix>-fold.png — sam viewport, czyli „co klient widzi bez scrolla"
 *   <prefix>-full.png — cała strona
 *
 * Fold jest osobnym plikiem celowo: pytanie „czy cena i CTA są nad zgięciem" ocenia
 * się na nim jednym rzutem oka, a na zrzucie fullPage długiego PDP jest to nieczytelne.
 */
async function captureScreenshots(page, outDir, prefix) {
  const fold = path.join(outDir, `${prefix}-fold.png`);
  const full = path.join(outDir, `${prefix}-full.png`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: fold, fullPage: false });
  await page.screenshot({ path: full, fullPage: true });
  return { fold, full };
}

module.exports = { PROFILES, launchBrowser, withPage, scrollThroughPage, captureScreenshots };
