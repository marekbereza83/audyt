# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Repo zawiera **dwa niezależne narzędzia na wspólnym silniku `core/`**:

| Katalog | Do czego | Status |
|---|---|---|
| `audyt-kancelarii-skill/` | Audyt JEDNEJ strony kancelarii pod kątem sprzedaży usługi (Firecrawl + Lighthouse + kwalifikacja leada) | **produkcja** — nie psuć |
| `ecommerce-intel-skill/` | Porównanie WIELU sklepów ecommerce pod kątem zbudowania własnego (Playwright + darmowe endpointy Shopify) | w budowie |
| `core/` | Wspólne: przeglądarka + scroll + zrzuty, pula workerów, parser CSV | — |

Dwa cele są odwrotne: audyt kancelarii **ocenia** jedną stronę, intel ecommerce **porównuje** dziesiątki, żeby wyprowadzić wzorzec. Dlatego intel nie ma scoringu 0–100 — patrz `ecommerce-intel-skill/reference/kryteria-ecommerce.md`.

**Uwaga o zależnościach:** `playwright` jest w `package.json` w korzeniu repo, bo `core/browser.js` musi go rozwiązywać dla każdego skilla. Przypięty do `1.61.1` — tej samej wersji, którą ma `audyt-kancelarii-skill/scripts/node_modules`, żeby reużyć pobrane binarki i utrzymać porównywalność zrzutów. `audyt-kancelarii-skill/scripts` zachowuje własne `node_modules` (firecrawl + lighthouse) i działa niezależnie.

**Migracja skilla prawnego na `core/` jeszcze się nie odbyła** — ma własną kopię `scrollThroughPage()` i logiki batcha w `scrape.js`. To świadoma tymczasowa duplikacja: narzędzie jest w produkcji i nie było powodu ruszać go w trakcie budowy drugiego. Przy poprawce w którejkolwiek z tych funkcji pamiętaj o obu miejscach.

Poniżej skrót operacyjny **audytu kancelarii**. Dla ecommerce: `ecommerce-intel-skill/SKILL.md`.

---

## Setup

```bash
npm install                     # playwright w korzeniu — core/ musi go widzieć
npx playwright install chromium # raz, jeśli brak binarki

cd audyt-kancelarii-skill/scripts && npm install   # osobno: firecrawl + lighthouse
```

Node ≥18 (skrypty używają globalnego `fetch`). Brak lintera i brak build-stepu — to czyste skrypty CommonJS uruchamiane przez `node`.

## Testy

Jedyny zestaw testów w repo (regresja kwalifikacji leada, bez zależności zewnętrznych):

```bash
cd audyt-kancelarii-skill/scripts && node tests/run-tests.js
```

Pokrywa `csv-utils.js`, `validate-lead.js`, `batch-report.js`. Fixtures w `fs.mkdtempSync`, `batch-report.js` wołany jako osobny proces z `AUDYT_OUTPUT_DIR` na fixture — testy nigdy nie ruszają repo `output/`. Pojedynczy przypadek: brak runnera z filtrowaniem — zakomentuj resztę `test(...)` albo dopisz filtr, testy to płaska lista wywołań `test(nazwa, fn)`.

Uruchamiaj po każdej zmianie w `validate-lead.js` lub w progach kwalifikacji — te testy kodyfikują reguły (m.in. regułę 9 „PISAĆ nie może stać na samych słabych przesłankach", regułę 10 i zakaz żargonu w obserwacji), więc czerwony test zwykle znaczy „zmieniłeś regułę biznesową", nie „zepsułeś kod".

## Wspólny silnik `core/`

Trzy moduły CommonJS, bez stanu, bez wiedzy o branży — celowo:

| Moduł | Eksport | Uwagi |
|---|---|---|
| `core/browser.js` | `PROFILES`, `launchBrowser`, `withPage`, `scrollThroughPage`, `captureScreenshots` | dwa profile: desktop 1920×1080, mobile 375×812 (iPhone UA, DPR 2) |
| `core/batch.js` | `runPool(items, worker, {concurrency, onStart, onOk, onError})` | błąd jednej pozycji **nigdy** nie przerywa paczki — ląduje w `failed` |
| `core/csv.js` | `parseCsv(tekst)` → `{naglowki, wiersze}`, `domenaZ(url)` | parser bez schematu (odróżnij od `audyt-kancelarii-skill/scripts/csv-utils.js`, który zna schemat leada) |

**Dwie rzeczy w `core/browser.js`, których nie ruszaj** (obie okupione debugowaniem na realnych stronach, powody w komentarzach przy funkcjach):
1. `scrollThroughPage()` musi zostać — `fullPage: true` w Playwright tylko rozciąga viewport, nigdy nie scrolluje, więc treść za reveal-on-scroll (AOS, WOW.js, Cherry Framework, lazy-load motywów Shopify) wychodzi na zrzucie jako puste miejsce.
2. Nie dodawaj neutralizacji `position: fixed/sticky` przed zrzutem — złamało `kancelaria-liszka.pl`, gdzie fixed hero jest częścią zamierzonego layoutu. Jeśli fixed element zniekształci zrzut, napraw punktowo dla tej strony.

## Zasada wspólna dla obu narzędzi: OBSERVED ≠ INFERENCE

Skrypty produkują wyłącznie fakty i liczby; interpretację robi Claude, zawsze z odwołaniem do konkretnego pola lub zrzutu.

| Warstwa | Kto produkuje | Audyt kancelarii | Intel ecommerce |
|---|---|---|---|
| Fakty ze strony | skrypt | `content.json`, `vitals.json` | `store-data.json` |
| Statystyki między obiektami | skrypt | `benchmark-pl-law.json` | `_patterns.json` (`patterns.js`) |
| Ocena / wnioski | Claude | `audyt.md`, `audyt-dane.json` | analiza per sklep, raport, brief |

**Częstotliwości liczy kod, nie model.** Gdyby model liczył „31 z 40 sklepów pokazuje cenę nad zgięciem", czytając 40 plików, byłyby to liczby zmyślone z dużą pewnością siebie.

W obu narzędziach obowiązuje ta sama reguła pierwszeństwa: **zrzut wygrywa z licznikiem** (`ctaCount=0` przy widocznym przycisku, `uploadNaPdp:false` przy uploadzie za kliknięciem). Gdy dane przeczą zrzutowi — opisz rozbieżność, nie wybieraj po cichu jednej wersji.

## Zmienne środowiskowe

| Zmienna | Gdzie | Do czego |
|---|---|---|
| `FIRECRAWL_API_KEY` | `audyt-kancelarii-skill/scripts/.env` | scrape (gitignorowane, ładowane z `override: true`) |
| `FIRECRAWL_ROWNOLEGLE` | scrape `--batch` | domyślnie 2 (limit współbieżności darmowego planu) |
| `FIRECRAWL_PODSTRONY` | scrape | domyślnie `services,team,news,contact` — **nie tnij „na oszczędność"**, bez `services` i `news` siadają wymiary „skala poprawy" i „powód do kontaktu" |
| `FIRECRAWL_LIMIT_AUDYTOW` | `budzet.js` | domyślnie 160 (~20% zapasu pod 200/mies.); licznik lokalny per komputer |
| `AUDYT_OUTPUT_DIR` | scrape, batch-report, testy | podmiana katalogu wyjściowego audytu |
| `ECOM_OUTPUT_DIR` | `scan-store.js`, `patterns.js` | podmiana katalogu wyjściowego skanów |
| `APIFY_TOKEN`, `APIFY_AKTOR` | `apify-search.js` | prospecting (płatne — wymaga jawnego `--tak`) |
| `SHEETS_URL`, `SHEETS_SECRET` | `push-import.js` | webhook Apps Script → zakładka `Claude_import` |

---

## Audyt kancelarii — co robi to narzędzie

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
- `output/<domena>/mail-observation.txt` — **tylko gdy kwalifikacja da `PISAĆ` (5–6/6) bez blokady kontaktu** — krótki fakt + jedno pytanie otwarte, ≤400 znaków. Nie temat, nie treść maila (patrz „Podział pracy" wyżej).
- screenshoty desktop i mobile

Po audycie zapytaj do czego jest potrzebny (cold mail / blog / wiedza) — to zmienia tylko anonimizację (publiczny = anonimizuj nazwę kancelarii); Claude nie pisze ani nie wysyła maila w żadnym z tych przypadków.

Opcjonalnie z konkurentem: `node scrape.js https://kancelaria.pl https://konkurent.pl` → tworzy też `competitor.json` i sekcję „Co robi konkurencja" w raporcie.

---

## Podział pracy: Claude kwalifikuje, ChatGPT pisze i wysyła maila

**Claude (to repo) robi wyłącznie prospecting i kwalifikację leada — nigdy nie pisze ani nie wysyła cold maila.** Pipeline:

`Apify/prospecting → Claude (scrape + audyt + kwalifikacja 0–6) → Claude_import (status_importu: NOWY) → ChatGPT (weryfikacja, treść maila M1, szkic Gmail, aktualizacja Trackera) → człowiek (przegląd i ręczna wysyłka)`

1. Uruchom audyt: `audyt-kancelarii-skill/scripts/scrape.js <url>` → `audyt.md` + `audyt-dane.json`.
2. Zakwalifikuj leada (`kryteria-audytu.md` → „Ocena leada", `SKILL.md` → Krok 5). Tylko dla `PISAĆ` (5–6/6) bez blokady kontaktu: zapisz `mail-observation.txt` — krótki, faktograficzny hak (fakt + jedno pytanie otwarte), **nie temat i nie treść maila** (SKILL.md → Krok 6).
3. Wyślij do arkusza: `node audyt-kancelarii-skill/scripts/push-import.js <leady.json>` → zakładka `Claude_import`, `status_importu: NOWY`.
4. Stąd dalej pracuje ChatGPT (poza tym repo): ponownie weryfikuje 5–6/6, sprawdza duplikaty w całym Trackerze i historii Gmaila, pisze temat i treść M1, tworzy **wyłącznie szkic** Gmail, zapisuje `SZKIC_GMAIL` w Trackerze. Po przejęciu rekordu zmienia `status_importu` z `NOWY` na `PRZEJĘTY`.
5. Człowiek sprawdza szkic i wysyła ręcznie. **Żaden proces nie wysyła cold maila automatycznie.**

**Ważne — audyt daje jedną obserwację, nie brief techniczny na całą sekwencję.** FORMA sprzedaje nową stronę/wizerunek, nie audyt SEO/wydajności. `obserwacja_do_maila` (i cała dalsza korespondencja, którą pisze już ChatGPT) ma być wolna od żargonu technicznego (LCP, cache, SSL, JSON-LD, benchmark, „score") — te wchodzą dopiero do rozmowy po odpowiedzi odbiorcy. Pełne zasady i przykład w `.agents/product-marketing.md` → „Co sprzedaje FORMA" (kontekst produktowy dla drugiej automatyzacji, nie do wykonania przez Claude w tym repo).

Do budowania listy kancelarii do zaudytowania (upstream, przed powyższym workflow) dostępny jest też skill `prospecting` (ten sam repo `coreyhaines31/marketingskills`) — nie pokrywa się z `audyt-kancelarii`: `prospecting` szuka i wstępnie kwalifikuje firmy, `audyt-kancelarii` audytuje i ocenia jedną konkretną stronę. Skill `cold-email` (tamże) nie jest już częścią tego pipeline'u — pisanie maila przejęła druga automatyzacja (ChatGPT) na etapie po `Claude_import`.

---

## Tryb wsadowy (batch)

Bramki idą **od najtańszej do najdroższej** — pełny audyt (Firecrawl, liczony w budżecie) jest ostatni, nigdy pierwszy:

```bash
cd audyt-kancelarii-skill/scripts
node apify-search.js --query "kancelaria adwokacka" --gdzie "Katowice" --max 100   # kosztorys, nic nie płaci
node apify-search.js --query "..." --gdzie "..." --max 100 --tak                   # PŁATNE
node apify-search.js --dataset <id>       # gotowy dataset z konta, bez kosztu
node dedup-gate.js output/apify/<plik>.json     # DARMOWE — odsiew wzgl. Trackera → output/do-peek.csv
node scrape.js --peek-batch output/do-peek.csv  # DARMOWE — triage wizualny (sam Playwright)
```

Właściwa oszczędność to darmowa bramka peek przed audytem, **nie uboższy audyt** (patrz `FIRECRAWL_PODSTRONY` wyżej).

```bash
# 1. Pobierz dane dla wszystkich (2 równolegle — FIRECRAWL_ROWNOLEGLE, ~60–90 s/firma)
node scrape.js --batch lista.csv

# 2. Wygeneruj audyty per kancelaria (Kroki 2–6 z SKILL.md) dla każdego output/<domena>/
#    — mail-observation.txt tylko dla PISAĆ. Po każdej: node validate-lead.js <domena>

# 3. Zbiorczy CSV lokalnie (BOM UTF-8, gotowy do Excela)
node batch-report.js lista.csv   # → output/batch-leady.csv (główny raport)

# 4. Rodzynki 5–6/6 (PISAĆ) do arkusza — status_importu: NOWY, dalej pracuje ChatGPT
node push-import.js leady.json
```

`lista.csv` format: legacy `nazwa,url` (ostatni przecinek = separator; nazwy mogą zawierać przecinki) albo rozszerzony (`lead_id,nazwa,miasto,url,telefon,email,...` — patrz `audyt-kancelarii-skill/scripts/csv-utils.js`).

---

## Intel ecommerce — komendy

Pełny workflow: `ecommerce-intel-skill/SKILL.md`. Koszt: **zero** (Playwright + darmowe endpointy Shopify `/products/<handle>.json`) — nie zjada limitu Firecrawl, którego potrzebuje produkcyjny audyt kancelarii.

```bash
cd ecommerce-intel-skill
node scripts/scan-store.js https://sklep.com/products/x     # jeden sklep
node scripts/scan-store.js --batch input/<lista>.csv --concurrency 4
node scripts/patterns.js                                    # → output/_patterns.json
node scripts/patterns.js --prog-reklam 50                   # próg „silnego sygnału paid"
```

`scan-store.js` daje per sklep `store-data.json` + 4 zrzuty (`{desktop,mobile}-{fold,full}.png`). Osobny przebieg mobilny jest konieczny, nie kosmetyczny — motywy renderują inny DOM pod inny viewport.

`patterns.js` wypisuje `skanyPodejrzane` (sklepy z <3 sekcjami albo krótsze niż 1,5 ekranu — prawdopodobnie blokada bota lub martwy sklep). Są **wyłączone z mianownika** każdej częstotliwości; zweryfikuj je na zrzucie, zanim uznasz wynik za pełny.

Zmiana produktu nie wymaga zmian w `dom-probe.js` — sonda dostaje całą wiedzę ze `scripts/extractors/slowniki.js` (frazy EN/DE/FR/PL/NL/ES/IT) i tabeli `CECHY` w `patterns.js`.

**Gdzie lądują wyniki:** skany i zrzuty są gitignorowane (odtwarzalne jednym poleceniem, darmowe). **Raporty i briefy nie zostają w tym repo** — trafiają do katalogu projektu produktowego (`dev/shopify/neckle/intelligence/`). W repo zostaje tylko `input/` — definiuje, co skanowaliśmy. Skill kończy się na briefie; **budowa motywu Shopify to osobny etap w osobnym repo.**

Małe n: przy 12–15 sklepach jedna pozycja to ~8 pp. Pisz „6 z 12", nie „50%" jako fakt precyzyjny.


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

---

## Gdzie szukać szczegółów

| Plik | Co zawiera |
|---|---|
| `audyt-kancelarii-skill/CLAUDE.md` | **model danych audytu** — mapowanie pól `content.json`/`vitals.json` na 8 wymiarów z progami, trzy niezależne warstwy ocen, znane quirki `scrape.js` (firecrawl@1.x `.default`, lighthouse@12 ESM, `chrome.kill()` na Windows) |
| `audyt-kancelarii-skill/SKILL.md` | workflow Kroki 0–6 |
| `audyt-kancelarii-skill/reference/kryteria-audytu.md` | progi wymiarów + „Ocena leada" (3 wymiary, 0–6) |
| `audyt-kancelarii-skill/sheets/README.md` | webhook Apps Script i zakładka `Claude_import` |
| `ecommerce-intel-skill/SKILL.md` | workflow intelu + struktura raportu i briefu |
| `ecommerce-intel-skill/reference/kryteria-ecommerce.md` | 9 obszarów oceny (warstwa interpretacji) |
| `.agents/product-marketing.md` | „Co sprzedaje FORMA" — kontekst produktowy dla drugiej automatyzacji (ChatGPT), nie do wykonania w tym repo |
| `WDROZENIE-KWALIFIKACJA-STAN.md` | plik przejściowy stanu wdrożenia kwalifikacji; **spisany pod skalę 0–8, nieaktualny od 2026-08-30** — do usunięcia po dokończeniu |

**Trzy niezależne skale, nigdy nie pisz gołego „score":** `priorytet_wizualny` (jak wygląda, Krok 0) ≠ `score_audytu_0_100` (jakość strony, 8 wymiarów) ≠ `kwalifikacja_leada.scoring_0_6` (szansa sprzedaży, 3 wymiary: potrzeba przebudowy / skala poprawy / naturalny powód kontaktu). Niski `score_audytu_0_100` **nie** oznacza dobrego leada.
