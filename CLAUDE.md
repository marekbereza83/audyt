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
- `output/<domena>/audyt-dane.json` — dane strukturalne (8 wymiarów + score + kwalifikacja leada)
- `output/<domena>/mail-observation.txt` — **tylko gdy kwalifikacja da `PISAĆ` (7–8/8) bez blokady kontaktu** — krótki fakt + jedno pytanie otwarte, ≤400 znaków. Nie temat, nie treść maila (patrz „Podział pracy" wyżej).
- screenshoty desktop i mobile

Po audycie zapytaj do czego jest potrzebny (cold mail / blog / wiedza) — to zmienia tylko anonimizację (publiczny = anonimizuj nazwę kancelarii); Claude nie pisze ani nie wysyła maila w żadnym z tych przypadków.

Opcjonalnie z konkurentem: `node scrape.js https://kancelaria.pl https://konkurent.pl` → tworzy też `competitor.json` i sekcję „Co robi konkurencja" w raporcie.

---

## Podział pracy: Claude kwalifikuje, ChatGPT pisze i wysyła maila

**Claude (to repo) robi wyłącznie prospecting i kwalifikację leada — nigdy nie pisze ani nie wysyła cold maila.** Pipeline:

`Apify/prospecting → Claude (scrape + audyt + kwalifikacja A/B/C/D) → Claude_import (status_importu: NOWY) → ChatGPT (weryfikacja, treść maila M1, szkic Gmail, aktualizacja Trackera) → człowiek (przegląd i ręczna wysyłka)`

1. Uruchom audyt: `audyt-kancelarii-skill/scripts/scrape.js <url>` → `audyt.md` + `audyt-dane.json`.
2. Zakwalifikuj leada (`kryteria-audytu.md` → „Ocena leada", `SKILL.md` → Krok 5). Tylko dla `PISAĆ` (7–8/8) bez blokady kontaktu: zapisz `mail-observation.txt` — krótki, faktograficzny hak (fakt + jedno pytanie otwarte), **nie temat i nie treść maila** (SKILL.md → Krok 6).
3. Wyślij do arkusza: `node audyt-kancelarii-skill/scripts/push-import.js <leady.json>` → zakładka `Claude_import`, `status_importu: NOWY`.
4. Stąd dalej pracuje ChatGPT (poza tym repo): ponownie weryfikuje 7–8/8, sprawdza duplikaty w całym Trackerze i historii Gmaila, pisze temat i treść M1, tworzy **wyłącznie szkic** Gmail, zapisuje `SZKIC_GMAIL` w Trackerze. Po przejęciu rekordu zmienia `status_importu` z `NOWY` na `PRZEJĘTY`.
5. Człowiek sprawdza szkic i wysyła ręcznie. **Żaden proces nie wysyła cold maila automatycznie.**

**Ważne — audyt daje jedną obserwację, nie brief techniczny na całą sekwencję.** FORMA sprzedaje nową stronę/wizerunek, nie audyt SEO/wydajności. `obserwacja_do_maila` (i cała dalsza korespondencja, którą pisze już ChatGPT) ma być wolna od żargonu technicznego (LCP, cache, SSL, JSON-LD, benchmark, „score") — te wchodzą dopiero do rozmowy po odpowiedzi odbiorcy. Pełne zasady i przykład w `.agents/product-marketing.md` → „Co sprzedaje FORMA" (kontekst produktowy dla drugiej automatyzacji, nie do wykonania przez Claude w tym repo).

Do budowania listy kancelarii do zaudytowania (upstream, przed powyższym workflow) dostępny jest też skill `prospecting` (ten sam repo `coreyhaines31/marketingskills`) — nie pokrywa się z `audyt-kancelarii`: `prospecting` szuka i wstępnie kwalifikuje firmy, `audyt-kancelarii` audytuje i ocenia jedną konkretną stronę. Skill `cold-email` (tamże) nie jest już częścią tego pipeline'u — pisanie maila przejęła druga automatyzacja (ChatGPT) na etapie po `Claude_import`.

---

## Tryb wsadowy (batch)

```bash
# 1. Pobierz dane dla wszystkich (max 3 równolegle, ~60–90 s/firma)
node scrape.js --batch lista.csv

# 2. Wygeneruj audyty per kancelaria (Kroki 2–6 z SKILL.md) dla każdego output/<domena>/
#    — mail-observation.txt tylko dla PISAĆ. Po każdej: node validate-lead.js <domena>

# 3. Zbiorczy CSV lokalnie (BOM UTF-8, gotowy do Excela)
node batch-report.js lista.csv   # → output/batch-leady.csv (główny raport)

# 4. Rodzynki 7–8/8 (PISAĆ) do arkusza — status_importu: NOWY, dalej pracuje ChatGPT
node push-import.js leady.json
```

`lista.csv` format: legacy `nazwa,url` (ostatni przecinek = separator; nazwy mogą zawierać przecinki) albo rozszerzony (`lead_id,nazwa,miasto,url,telefon,email,...` — patrz `audyt-kancelarii-skill/scripts/csv-utils.js`).

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
5. **Claude nigdy nie pisze tematu ani treści maila (M1/FU1/FU2), nie tworzy szkicu Gmail, nie wysyła i nie aktualizuje statusów w Trackerze.** Kończy na kwalifikacji + `mail-observation.txt` (Krok 5–6 w `SKILL.md`); resztę robi ChatGPT po przejęciu rekordu z `Claude_import` — patrz „Podział pracy" wyżej.
