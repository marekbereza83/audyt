// Jednorazowy crawler dokumentacji Immersal (developers.immersal.com/docs/).
// Strona jest server-rendered (Retype static site generator) — zwykly fetch + cheerio
// wystarcza, bez Playwrighta. Lista URLi z /docs/sitemap.xml (odfiltrowane strony /tags/).
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const SITEMAP_URL = 'https://developers.immersal.com/docs/sitemap.xml';
const OUT_DIR = path.join(__dirname, 'output');

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return urls.filter((u) => !u.includes('/tags/'));
}

function urlToFilePath(url) {
  const u = new URL(url);
  let p = u.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  if (!p) p = 'index';
  return path.join(OUT_DIR, `${p}.md`);
}

async function scrapePage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (research-bot; immersal-docs-ingest)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const content = $('#retype-content');
  content.find('#retype-nextprev, .retype-edit-link, script, style').remove();

  const markdown = turndown.turndown(content.html() || '');
  return { url, title, markdown };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const urls = await fetchSitemapUrls();
  console.log(`Znaleziono ${urls.length} stron w sitemap.`);

  const index = [];
  let ok = 0, failed = 0;

  for (const url of urls) {
    try {
      const { title, markdown } = await scrapePage(url);
      const filePath = urlToFilePath(url);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const body = `# ${title}\n\nZrodlo: ${url}\n\n---\n\n${markdown}\n`;
      fs.writeFileSync(filePath, body, 'utf8');
      index.push({ url, title, file: path.relative(OUT_DIR, filePath).replace(/\\/g, '/') });
      ok++;
      console.log(`OK  ${url}`);
    } catch (e) {
      failed++;
      console.warn(`FAIL ${url}: ${e.message}`);
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, '_index.json'),
    JSON.stringify({ source: SITEMAP_URL, crawled_at: new Date().toISOString(), pages: index }, null, 2),
  );

  console.log(`\nGotowe: ${ok} stron zapisanych, ${failed} bledow.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
