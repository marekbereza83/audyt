# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cały kod żyje w `audyt-kancelarii-skill/`. Szczegółowy CLAUDE.md jest tam. Poniżej skrót operacyjny.

---

## Co robi to narzędzie

Audyt strony kancelarii prawnej pod kątem konwersji. Pipeline:
1. `scrape.js` pobiera stronę → `content.json` + `vitals.json` + screenshoty
2. Claude ocenia 8 wymiarów systemu FORMA wg `reference/kryteria-audytu.md`
3. Claude porównuje z benchmarkiem 21 kancelarii (`reference/benchmark-pl-law.json`)
4. Claude generuje raport wg `reference/szablon-raportu.md` → `output/<domena>/audyt.md` + `audyt-dane.json`

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
- `output/<domena>/mail-fragment.txt` — 2–4 zdania gotowe do cold maila (≤400 znaków)
- screenshoty desktop i mobile

Po audycie zapytaj do czego jest potrzebny (cold mail / blog / wiedza) — to zmienia finalne sformułowanie (publiczny = anonimizuj nazwę kancelarii).

Opcjonalnie z konkurentem: `node scrape.js https://kancelaria.pl https://konkurent.pl` → tworzy też `competitor.json` i sekcję „Co robi konkurencja" w raporcie.

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

1. **Ton: fakt → konsekwencja → rozwiązanie.** Nigdy „beznadziejna strona" ani ocena kompetencji.
2. **Każda ocena z danych** — z pola w `content.json`/`vitals.json` lub screenshota, nie z pamięci.
3. **Audyt publiczny = anonimizuj** nazwę kancelarii.
4. **Nie zmieniaj `benchmark-pl-law.json` ręcznie.**
