#!/usr/bin/env node
/**
 * lighthouse-worker.js — JEDEN pomiar Lighthouse w osobnym procesie.
 *
 * Po co osobny proces: Lighthouse używa globalnych `performance.mark`, więc dwa pomiary
 * w TYM SAMYM procesie kolidują ze sobą. Dotąd rozwiązywał to muteks w scrape.js, który
 * serializował wszystkie pomiary w batchu — i to on, a nie limit Firecrawl, był realnym
 * wąskim gardłem: zmierzone 35,9 s na firmę (5 s start Chrome + 31 s pomiar) × 16 firm
 * = 9,6 min czystej serializacji, czyli mniej więcej cały czas trwania paczki.
 *
 * Kolizja `performance.mark` dotyczy wyłącznie współdzielonego procesu, więc uruchomienie
 * pomiaru w procesie potomnym znosi powód muteksu — bez żadnej zmiany w samym pomiarze.
 *
 * Wynik wraca przez IPC (`process.send`), NIE przez stdout: Lighthouse i chrome-launcher
 * piszą po drodze własne komunikaty, więc stdout nie jest wiarygodnym kanałem na JSON.
 * scrape.js uruchamia ten plik ze `stdio: ['ignore','ignore','ignore','ipc']`.
 *
 * Użycie (normalnie wołane przez scrape.js, nie ręcznie):
 *   node lighthouse-worker.js <url>
 */

const targetUrl = process.argv[2];

function odeslij(wynik) {
  if (process.send) process.send(wynik);
  else console.log(JSON.stringify(wynik)); // uruchomienie ręczne, bez IPC — do debugowania
}

(async () => {
  if (!targetUrl) {
    odeslij({ ok: false, error: 'brak URL w argumencie' });
    process.exit(0);
  }

  let chrome;
  try {
    const lighthouse = require('lighthouse').default || require('lighthouse');
    const chromeLauncher = require('chrome-launcher');

    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const runnerResult = await lighthouse(targetUrl, {
      port: chrome.port,
      onlyCategories: ['performance'],
      formFactor: 'mobile',
      logLevel: 'error',
    });
    const lhr = runnerResult.lhr;

    odeslij({
      ok: true,
      performanceScore: Math.round(lhr.categories.performance.score * 100),
      lcp: lhr.audits['largest-contentful-paint']?.numericValue / 1000,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue,
      tbt: lhr.audits['total-blocking-time']?.numericValue,
    });
  } catch (e) {
    odeslij({ ok: false, error: e.message });
  } finally {
    // chrome-launcher na Windows bywa, że nie usunie swojego temp-profilu (EPERM) —
    // sprzątanie nie może zmienić wyniku, bo dane są już odesłane. kill() bywa void
    // (nie-Promise), więc try/catch, nie .catch().
    try { await chrome?.kill(); } catch (_) { /* temp-profil — ignorujemy */ }
  }

  // Jawne wyjście: Chrome potrafi zostawić uchwyt, który trzymałby proces przy życiu.
  process.exit(0);
})();
