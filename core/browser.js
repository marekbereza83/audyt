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
    // Paski sticky (ATC na mobile, koszyk, cookie) z założenia POKAZUJĄ SIĘ dopiero
    // w trakcie przewijania i chowają się z powrotem na górze strony. Sonda mierzy
    // po powrocie na `scrollY = 0`, więc widziała je jako nieistniejące — i tak samo
    // liczyła je u wszystkich skanowanych sklepów. Dlatego znaczymy je TU, w trakcie
    // scrolla, a interpretacja zostaje w sondzie danej branży.
    //
    // Zamiast sprawdzać computed style każdego elementu na każdym kroku (drogie na
    // długim PDP), próbkujemy kilka punktów przy krawędziach viewportu — pasek sticky
    // z definicji tam siedzi — i idziemy w górę drzewa po pierwszy element
    // fixed/sticky.
    const oznaczSticky = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const punkty = [
        [W / 2, H - 8], [W / 2, H - 40], [W / 2, H - 90],
        [W / 2, 8], [W / 2, 40],
        [16, H - 24], [W - 16, H - 24],
      ];
      for (const [x, y] of punkty) {
        let el = null;
        try { el = document.elementFromPoint(x, y); } catch { continue; }
        for (let i = 0; i < 8 && el && el !== document.body; i++) {
          const pos = getComputedStyle(el).position;
          if (pos === 'fixed' || pos === 'sticky') {
            el.setAttribute('data-skan-sticky-widziany', '1');
            break;
          }
          el = el.parentElement;
        }
      }
    };

    const krok = step || window.innerHeight;
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += krok) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, pauza));
      oznaczSticky();
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, pauza));
    oznaczSticky();
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
