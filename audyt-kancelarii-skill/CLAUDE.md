# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Co robi to narzędzie

Audyt strony kancelarii prawnej pod kątem konwersji. Pipeline:
1. `scrape.js` pobiera stronę → `content.json` + `vitals.json` + screenshoty
2. Claude ocenia 8 wymiarów systemu FORMA wg `reference/kryteria-audytu.md`
3. Claude porównuje z benchmarkiem 21 kancelarii (`reference/benchmark-pl-law.json`)
4. Claude generuje raport wg `reference/szablon-raportu.md` → `output/<domena>/audyt.md` + `audyt-dane.json`

Workflow krok po kroku opisuje `SKILL.md`. **Kalibracja jest zakończona — narzędzie jest w trybie produkcyjnym.**

---

## Komendy

```bash
# Pojedynczy audyt
cd scripts && node scrape.js https://kancelaria.pl

# Pojedynczy z konkurentem (tworzy competitor.json)
node scrape.js https://kancelaria.pl https://konkurent.pl

# Batch (max 3 równolegle, loguje [i/total])
node scrape.js --batch lista.csv

# Zbiorczy CSV po batch (BOM UTF-8 dla Excela)
node batch-report.js lista.csv   # → output/batch-fragments.csv
```

Klucz Firecrawl wczytywany z `scripts/.env` (`override: true` — nadpisuje ewentualną starą wartość z env systemowego). Jeden scrape trwa ~60–90 s. Wyjście: `output/<domena>/` (gitignorowane).

Lighthouse mierzy z profilu mobilnego pod throttlingiem — LCP na desktopie będzie niższe niż zmierzone.

---

## Model danych — co jest w content.json

Kluczowe pola i jak mapują na wymiary audytu:

| Pole | Wymiar (waga) | Logika oceny |
|---|---|---|
| `h1[]`, `headings.h2[]` | 1 — Specjalizacja (15) | h1 z dziedziną prawa → ✅; ogólny/w h2 → ⚠️; brak konkretu → ❌ |
| `servicesPage.practiceAreaCount` | 1 — Specjalizacja (15) | scraper **dociąga podstronę „Zakres usług"**; ≥3 nazwane dziedziny = specjalizacja konkretna (hero ogólny → ⚠️, **nie** ❌). Scope tylko strony głównej zaniża ten wymiar |
| `ctaCount` / `genericCtaCount` | 2 — CTA (20) | mocne CTA → ✅; tylko `genericCtaCount>0` (np. „Kliknij tutaj") → ⚠️; oba 0 → ❌ |
| `hasForm`, `phone`, `email` | 2 — CTA (pomocniczo) | bez CTA w hero kontakt w stopce to wciąż ❌ |
| `trustSignals.count` | 6 — Zaufanie (15) | ≥2 → ✅; 1 (np. anonimowa opinia) → ⚠️; 0 → ❌ |
| `ethicsFlags[]` | 8 — Etyka (5) | niepuste → ❌; puste → ✅ |
| `metaDescription`, `hasStructuredData` | 7 — SEO (10) | brak desc lub JSON-LD → ⚠️; brak obu lub brak H1 → ❌ |
| `ageSignals` (copyrightYear, generator, templateHints) | Ocena leada — P2/P5 | ślady wieku/zaniedbania: stary copyright, stary szablon (templatemo), CMS w `<meta generator>` |
| `ageSignals`+`servicesPage`+`trustSignals.team` | Ocena leada — P1/P3 | rozdźwięk status⇄strona i budżet — patrz `kryteria-audytu.md` → „Ocena leada" (5 pytań) |

Pełne kryteria z progami: `reference/kryteria-audytu.md`. Ocena leada (5 pytań kwalifikujących, P1 ⭐ waga podwójna) to **wewnętrzna** kwalifikacja — nigdy nie trafia do `mail-fragment.txt`.

## Model danych — co jest w vitals.json

| Pole | Wymiar | Logika |
|---|---|---|
| `lcp` (sekundy) | 3 — Szybkość (15) | <2,5 → ✅; 2,5–4 → ⚠️; >4 → ❌ |
| `performanceScore` (0–100) | 3 — Szybkość | >80 → ✅; 50–80 → ⚠️; <50 → ❌ (wystarczy jeden warunek) |
| `mobileFriendly` (bool) | 4 — Mobile (10) | false = brak `meta[name=viewport]` → ❌ |
| `hasStructuredData` (bool) | 7 — SEO (10) | wykrywa `<script type="application/ld+json">` |
| `lighthouseAvailable: false` | 3 | dane perf mogą być zebrane mimo tej flagi — sprawdź czy `lcp` jest w pliku |

---

## Strony testowe (referencja kalibracyjna)

| Wariant | URL | Oczekiwany score |
|---|---|---|
| Zła (8 błędów) | https://zla-kancelaria.pages.dev | ~5/100 (krytyczny) |
| Średnia | https://zla-kancelaria.pages.dev/srednia/ | ~61/100 (średni) |

Cloudflare Pages, projekt `zla-kancelaria`, konto FORMA Wizerunku. Pliki źródłowe: `zla-strona-testowa/`.

---

## Zasady audytu

1. **Ton: merytoryczny, nigdy obraźliwy.** Fakt → konsekwencja → rozwiązanie. Szczegóły w `SKILL.md`.
2. **Każda ocena z danych** — status wymiaru musi wynikać z pola w `content.json`/`vitals.json` lub screenshota. Nie oceniaj z pamięci.
3. **Audyt publiczny (blog/LinkedIn) = anonimizuj** nazwę. Nazwa zostaje tylko w cold mailu do tej kancelarii lub za zgodą.
4. **Nie zmieniaj `benchmark-pl-law.json` ręcznie.**

---

## Znane quirki scrape.js

- `firecrawl@1.x` eksportuje klasę jako `require('firecrawl').default` (nie `FirecrawlApp`, nie `.v1`).
- `lighthouse@12` to ESM — ładuj przez `.default || require('lighthouse')`.
- `chrome.kill()` na Windows (chrome-launcher) bywa void, nie Promise — używaj `try/catch`, nie `.catch()`.
- Firecrawl nie dosięgnie `localhost` — strony testowe muszą być publicznie dostępne.
- Wykrywanie podstrony usług działa dwutorowo: (1) z linków w markdown strony głównej, (2) fallback `app.mapUrl()` gdy menu jest budowane JS-em i Firecrawl widzi go bez `<a href>`. Stare strony kancelarii często wpadają w ten drugi tor.
