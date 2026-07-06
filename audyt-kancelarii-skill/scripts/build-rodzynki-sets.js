const fs = require('fs');
const path = require('path');

function domainOf(u) {
  return u.replace(/^https?:\/\//, '').replace(/[?#].*$/, '').replace(/[\/:]/g, '_').replace(/_+$/, '');
}

// re-parse the wysoki CSV we still have (nazwa,miasto,url,telefon,priorytet_wizualny,markery)
function parseCsvLine(line, delim) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === delim) { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

const csvRaw = fs.readFileSync('../output/apify-slaskie-wysoki.csv', 'utf8').replace(/^﻿/, '');
const rawLines = csvRaw.trim().split(/\r?\n/);
const delim = rawLines[0].includes(';') ? ';' : ',';
const lines = rawLines.slice(1); // skip header
const wysoki = lines.filter(l => l.trim()).map(l => {
  const [nazwa, miasto, url, telefon, priorytet, markery] = parseCsvLine(l, delim);
  return { nazwa, miasto, url, telefon, priorytet_wizualny: priorytet, markery, dir: domainOf(url) };
});
console.log('Wczytano z CSV:', wysoki.length);

const apifyData = JSON.parse(fs.readFileSync('../dataset_google-maps-extractor_2026-07-05_13-34-33-605.json', 'utf8'));
const apifyByDomain = {};
apifyData.forEach(d => {
  if (!d.website) return;
  apifyByDomain[domainOf(d.website)] = d;
});

const enriched = wysoki.map(w => {
  const a = apifyByDomain[w.dir] || {};
  return {
    ...w,
    totalScore: a.totalScore ?? null,
    reviewsCount: a.reviewsCount ?? null,
    categories: a.categories || [],
  };
});

const SET_SIZE = 10;
const sets = [];
for (let i = 0; i < enriched.length; i += SET_SIZE) {
  sets.push(enriched.slice(i, i + SET_SIZE));
}
console.log('Liczba setow:', sets.length, '| rozmiary:', sets.map(s => s.length).join(','));

const outDir = '../output/rodzynki';
fs.mkdirSync(outDir, { recursive: true });
sets.forEach((set, i) => {
  const setDir = path.join(outDir, 'set' + (i + 1));
  fs.mkdirSync(setDir, { recursive: true });
  fs.writeFileSync(path.join(setDir, '_dane-wejsciowe.json'), JSON.stringify(set, null, 2));
});
console.log('Zapisano dane wejsciowe do output/rodzynki/setN/_dane-wejsciowe.json');
