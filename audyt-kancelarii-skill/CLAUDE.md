# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Co robi to narzędzie

Audyt strony kancelarii prawnej pod kątem konwersji. Pipeline:
1. `scrape.js` pobiera stronę → `content.json` + `vitals.json` + screenshoty
2. Claude ocenia **najpierw wizualnie ze screenshotów** (Krok 0 → `priorytet_wizualny`, poza score), potem 8 wymiarów systemu FORMA wg `reference/kryteria-audytu.md`
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

# Batch (max 3 równolegle, loguje [i/total]) — CSV legacy nazwa,url lub rozszerzony (csv-utils.js)
node scrape.js --batch lista.csv

# Zbiorczy CSV po batch (BOM UTF-8 dla Excela) — batch-leady.csv to GŁÓWNY raport
node batch-report.js lista.csv   # → output/batch-leady.csv (+ batch-pominiete.csv, batch-nieudane.csv)

# Walidacja audytu/kwalifikacji przed przekazaniem dalej
node validate-lead.js <domena>   # albo --all

# Rodzynki 7–8/8 (PISAĆ) do zakładki Claude_import (status_importu: NOWY)
node push-import.js <leady.json>
```

Klucz Firecrawl wczytywany z `scripts/.env` (`override: true` — nadpisuje ewentualną starą wartość z env systemowego). Jeden pełny audyt (strona główna + do 4 podstron: usługi/zespół/aktualności/kontakt) to do ~5 wywołań Firecrawl (+1 `mapUrl` przy fallbacku) i trwa ~60–90 s — przy darmowym limicie ~500 stron/mies daje to ~80–100 pełnych audytów miesięcznie. Wyjście: `output/<domena>/` (gitignorowane).

Lighthouse mierzy z profilu mobilnego pod throttlingiem — LCP na desktopie będzie niższe niż zmierzone.

---

## Trzy niezależne warstwy

`priorytet_wizualny` (jak strona wygląda, Krok 0) ≠ `score_audytu_0_100`/`tier_audytu` (jakość/kompletność strony, 8 wymiarów) ≠ `kwalifikacja_leada.scoring_0_8` (szansa sprzedaży, A/B/C/D). Nigdy nie pisz gołego „score" bez podania skali — niski `score_audytu_0_100` nie oznacza dobrego leada. Pełne wyjaśnienie i kanoniczny szablon pól: `reference/kryteria-audytu.md` → „Ocena leada" i `reference/schemat-audyt-dane.json`.

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
| `ageSignals` (copyrightYear, generator, templateHints) | Ocena leada — A | ślady wieku/zaniedbania: stary copyright, stary szablon (templatemo), CMS w `<meta generator>` |
| `teamPage` (lawyerCount, titles, corporateClients, locationCount) | Ocena leada — B | scraper dociąga podstronę „Zespół"/„O kancelarii"; bez niej wymiar B (potencjał finansowy) nie ma się z czego wziąć poza domysłem |
| `newsPage` (lastPostDate, lataOdWpisu) | Ocena leada — D | scraper dociąga podstronę „Aktualności"/„Blog"; data ostatniego wpisu to najtwardszy dowód „strona stoi" |
| `contactPage` (emails, phones, postalCodes) | dane do trackera, nie do oceny | scraper dociąga podstronę „Kontakt" — email do `Claude_import` często jest TYLKO tam, strona główna pokazuje go rzadziej niż telefon |
| `ageSignals`+`servicesPage`+`teamPage` | Ocena leada — A/C | rozdźwięk status⇄strona — patrz `kryteria-audytu.md` → „Ocena leada" (4 wymiary A/B/C/D) |

W trybie `--batch` scraper zapisuje dodatkowo `output/<domena>/lead-info.json` — identyfikacja leada, status operacyjny, kontekst Google Maps (`totalScore`/`reviewsCount` — sygnał pomocniczy dla wymiaru B, nie dowód budżetu) i blokada kontaktu (`mail_zablokowany`+`powod_blokady`).

Pełne kryteria z progami: `reference/kryteria-audytu.md`. Ocena leada (4 wymiary A–D, suma 0–8, próg zapisu 7–8 = `PISAĆ`) to **wewnętrzna** kwalifikacja — nigdy nie trafia do `mail-observation.txt`. Rodzynki 7–8/8 trafiają do zakładki „Claude_import" arkusza trackera (`status_importu: NOWY`) przez `scripts/push-import.js` (patrz `sheets/README.md`); dalej (weryfikacja, treść maila, szkic Gmail) pracuje druga automatyzacja (ChatGPT), nie Claude.

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

1. **Ocena wizualna ze screenshotów jest pierwsza i nadrzędna** (Krok 0 w `kryteria-audytu.md`, nie wchodzi do score) — otwiera raport, daje `priorytet_wizualny` i obserwację do maila. Dwie osie osobno: wygląd przestarzały ≠ zaniedbanie techniczne.
2. **Ton: merytoryczny, nigdy obraźliwy.** Fakt → konsekwencja → rozwiązanie — **ale tylko w raporcie `audyt.md`**. W `mail-observation.txt` (i całym cold mailu) trójtakt nie obowiązuje: obserwacja kończy się na obserwacji + jedno pytanie otwarte, bez zdania konsekwencji i bez zdania rozwiązania. Szczegóły w `SKILL.md` → Krok 6.
3. **Każda ocena z danych** — status wymiaru musi wynikać z pola w `content.json`/`vitals.json` lub screenshota. Nie oceniaj z pamięci.
4. **Audyt publiczny (blog/LinkedIn) = anonimizuj** nazwę. Nazwa zostaje tylko w cold mailu do tej kancelarii lub za zgodą.
5. **Nie zmieniaj `benchmark-pl-law.json` ręcznie.**
6. **Claude nie pisze ani nie wysyła cold maila.** Kończy na kwalifikacji (Krok 5) i `mail-observation.txt` (Krok 6, tylko dla `PISAĆ`) — temat, treść M1/FU1/FU2, szkic Gmail i wysyłkę robi druga automatyzacja (ChatGPT) po przejęciu rekordu z `Claude_import`.

---

## Znane quirki scrape.js

- `firecrawl@1.x` eksportuje klasę jako `require('firecrawl').default` (nie `FirecrawlApp`, nie `.v1`).
- `lighthouse@12` to ESM — ładuj przez `.default || require('lighthouse')`.
- `chrome.kill()` na Windows (chrome-launcher) bywa void, nie Promise — używaj `try/catch`, nie `.catch()`.
- Firecrawl nie dosięgnie `localhost` — strony testowe muszą być publicznie dostępne.
- Wykrywanie podstrony usług działa dwutorowo: (1) z linków w markdown strony głównej, (2) fallback `app.mapUrl()` gdy menu jest budowane JS-em i Firecrawl widzi go bez `<a href>`. Stare strony kancelarii często wpadają w ten drugi tor.
- **Zrzuty `fullPage: true` mogą ukrywać realną treść.** Playwright przy `fullPage` tylko rozciąga viewport na wysokość strony — nigdy nie scrolluje. Starsze szablony (Cherry Framework, AOS, WOW.js — klasy typu `lazy-load-box trigger`) chowają treść do czasu prawdziwego scrolla i taka treść wychodzi na zrzucie jako puste miejsce, mimo że w DOM jest. Wykryte na `adwokatsoltys.pl` (cztery boksy usług znikały tak). Naprawione: `scrollThroughPage()` w `scrape.js` realnie przewija stronę (krok = wysokość viewportu, 500 ms na krok) przed każdym zrzutem — działa przed zrzutem desktop, mobile i w trybie `--peek`. **Mimo tego fixa: zawsze traktuj puste sekcje na zrzucie jako do zweryfikowania, nie jako pewnik** — część szablonów chowa treść za akordeonem/kliknięciem (nie scrollem), czego to nie naprawia (patrz `laszczkowski.pl`, gdzie puste ramki „Pełna oferta"/„Blog o prawie" są prawdziwe, potwierdzone po fixie).
- **Nie neutralizuj `position: fixed/sticky` przed zrzutem.** Próbowaliśmy tego jako dodatku do `scrollThroughPage()` (przełączenie fixed/sticky na `static`, żeby nie renderowały się źle przy rozciągniętym viewporcie) — złamało to `kancelaria-liszka.pl`: fixed hero jest tam częścią zamierzonego layoutu (inne sekcje mają margines skalibrowany pod jego fixed-pozycjonowanie), a zmiana na `static` podwoiła odstęp i zepchnęła hero w dół strony z dużą pustą luką nad nim. `scrollThroughPage()` sam w sobie wystarcza — zweryfikowane, że nadal poprawnie odsłania boksy na `adwokatsoltys.pl` bez tego dodatku. Jeśli fixed/sticky element kiedyś znów zniekształci zrzut, napraw punktowo dla tej strony, nie globalnie.
