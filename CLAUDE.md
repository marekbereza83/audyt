# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cały kod żyje w `audyt-kancelarii-skill/`. Szczegółowy CLAUDE.md jest tam. Poniżej skrót operacyjny.

---

## Co robi to narzędzie

Audyt strony kancelarii prawnej pod kątem konwersji. Pipeline:
1. `scrape.js` pobiera stronę → `content.json` + `vitals.json` + screenshoty
2. Claude ocenia **najpierw wizualnie ze screenshotów** (Krok 0 w `kryteria-audytu.md` → `priorytet_wizualny`, nie wchodzi do score), potem 8 wymiarów systemu FORMA
3. Claude porównuje z benchmarkiem 21 kancelarii (`reference/benchmark-pl-law.json`)
4. Claude generuje raport wg `reference/szablon-raportu.md` → `output/<domena>/audyt.md` + `audyt-dane.json`

**Ocena wizualna jest podstawą raportu i cold maila** — kancelaria chce nowej strony, bo obecna *wygląda* staro, nie przez parametry. Wymiary techniczne to uzasadnienie i materiał na rozmowę po odpowiedzi.

Workflow krok po kroku: `audyt-kancelarii-skill/SKILL.md`. **Kalibracja zakończona — narzędzie w trybie produkcyjnym.**

---

## Uruchomienie scrapera

```bash
cd audyt-kancelarii-skill/scripts
node scrape.js https://kancelaria.pl
```

Klucz Firecrawl wczytywany z `scripts/.env` (plik gitignorowany). Jeden scrape trwa ~60–90 s.

---

## Produkcja — pojedynczy audyt

Na żądanie „zaudytuj https://..." wykonaj pełny workflow (`SKILL.md`) i zwróć:
- `output/<domena>/audyt.md` — raport po polsku w tonie merytorycznym
- `output/<domena>/audyt-dane.json` — dane strukturalne (8 wymiarów + score)
- `output/<domena>/mail-fragment.txt` — 2–4 zdania gotowe do cold maila (≤400 znaków, zawsze generowane)
- screenshoty desktop i mobile

Po audycie zapytaj do czego jest potrzebny (cold mail / blog / wiedza) — to zmienia finalne sformułowanie (publiczny = anonimizuj nazwę kancelarii).

Opcjonalnie z konkurentem: `node scrape.js https://kancelaria.pl https://konkurent.pl` → tworzy też `competitor.json` i sekcję „Co robi konkurencja" w raporcie.

---

## Pisanie cold maila do kancelarii (po audycie)

1. Uruchom audyt: `audyt-kancelarii-skill/scripts/scrape.js <url>` → `audyt.md` + `mail-fragment.txt`.
2. Użyj `mail-fragment.txt` jako „research signal" (punkt 5 z listy pytań w skillu `cold-email`, sekcja „Before Writing").
3. Uruchom skill `cold-email` (`.agents/skills/cold-email`, z repo `coreyhaines31/marketingskills`) — frameworks, subject-lines, personalization, follow-up-sequences, benchmarks. Skill sam czyta `.agents/product-marketing.md` dla kontekstu FORMA, jeśli plik istnieje.
4. `mail-fragment.txt` to surowy research signal (fakt + pain point), nie gotowy mail — `cold-email` nadaje mu strukturę, temat, i pilnuje zasad anty-szablonowych.

**Ważne — audyt daje jedną obserwację, nie brief techniczny na całą sekwencję.** FORMA sprzedaje nową stronę/wizerunek, nie audyt SEO/wydajności. Cała async sekwencja (mail 1 → follow-upy) ma być wolna od żargonu technicznego (LCP, cache, SSL, JSON-LD, benchmark, „score") — te wchodzą dopiero do rozmowy po odpowiedzi odbiorcy. Pełne zasady i przykład w `.agents/product-marketing.md` → „Co sprzedaje FORMA".

Do budowania listy kancelarii do zaudytowania (upstream, przed powyższym workflow) dostępny jest też skill `prospecting` (ten sam repo) — nie pokrywa się z `audyt-kancelarii`: `prospecting` szuka i kwalifikuje firmy, `audyt-kancelarii` audytuje jedną konkretną stronę.

---

## Tryb wsadowy (batch)

```bash
# 1. Pobierz dane dla wszystkich (max 3 równolegle, ~60–90 s/firma)
node scrape.js --batch lista.csv

# 2. Wygeneruj audyty per kancelaria (Kroki 2–5 z SKILL.md) dla każdego output/<domena>/

# 3. Zbiorczy CSV do trackera (BOM UTF-8, gotowy do Excela)
node batch-report.js lista.csv   # → output/batch-fragments.csv
```

`lista.csv` format: `nazwa,url` (ostatni przecinek = separator; nazwy mogą zawierać przecinki).

---

## Strony testowe (referencja kalibracyjna)

| Wariant | URL | Score |
|---|---|---|
| Zła (8 błędów) | https://zla-kancelaria.pages.dev | ~5/100 |
| Średnia | https://zla-kancelaria.pages.dev/srednia/ | ~61/100 |

---

## Zasady, których nie łam

1. **Ton raportu: fakt → konsekwencja → rozwiązanie.** Nigdy „beznadziejna strona" ani ocena kompetencji.
   - **Ten trójtakt obowiązuje wyłącznie w `audyt.md`. NIE w mailu.** W cold mailu zdanie konsekwencji („przez co klient wraca do wyników") i zdanie rozwiązania („to drobna poprawka, nie przebudowa") to już sprzedaż — mail 1 ma tylko otworzyć rozmowę. W mailu: **obserwacja kończy się na obserwacji + jedno pytanie otwarte.** Pełna lista zakazanych ruchów: `.agents/product-marketing.md` → „Zasada nadrzędna: nie bądź copywriterem, bądź uważnym rozmówcą".
2. **Każda ocena z danych** — z pola w `content.json`/`vitals.json` lub screenshota, nie z pamięci.
   - `content.json` opisuje tylko **stronę główną**. Specjalizacja może być na podstronie usług — scraper dociąga ją automatycznie do `servicesPage`. Nie oceniaj „brak specjalizacji" bez sprawdzenia `servicesPage.practiceAreaCount`.
   - Screenshot ma pierwszeństwo nad surowym licznikiem scrapera: `ctaCount=0` nie oznacza „brak CTA", jeśli na screenshocie widać przycisk.
3. **Audyt publiczny = anonimizuj** nazwę kancelarii.
4. **Nie zmieniaj `benchmark-pl-law.json` ręcznie.**
