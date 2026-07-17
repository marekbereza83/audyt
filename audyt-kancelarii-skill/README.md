# Skill: audyt-kancelarii

Narzędzie do audytu stron kancelarii prawnych pod kątem konwersji. Dla Claude Code.

## Co robi

Pobiera stronę kancelarii (Firecrawl + Playwright + Lighthouse), ocenia ją według 8 wymiarów systemu FORMA, porównuje z benchmarkiem 21 polskich kancelarii i generuje raport po polsku w formacie „Co działa / Co poprawić / Jak bym to rozwiązał".

## Po co

Jeden audyt pracuje w czterech zastosowaniach:
- **Cold mail** — konkretna obserwacja strony do maila 1 (zamiast ręcznego zdania)
- **Blog / LinkedIn** — anonimizowany audyt jako treść budująca autorytet
- **Nauka** — wzorce co działa, oparte na realnych danych z rynku
- **Wewnętrzny benchmark** — punkt odniesienia dla projektów FORMA

## Instalacja

```bash
# 1. Skopiuj folder do swoich skilli Claude Code
cp -r audyt-kancelarii-skill ~/.claude/skills/audyt-kancelarii

# 2. Zainstaluj zależności
cd ~/.claude/skills/audyt-kancelarii/scripts
npm install
npx playwright install chromium

# 3. Klucz Firecrawl (darmowy tier ~500 stron/mies)
export FIRECRAWL_API_KEY=fc-...
```

## Użycie

W Claude Code wystarczy poprosić:
> Zaudytuj stronę https://kancelaria-przykład.pl

Claude uruchomi `scrape.js`, przeczyta dane, oceni wg kryteriów i wygeneruje `output/<domena>/audyt.md`.

### Składnia scrape.js

```bash
node scrape.js <url>                    # audyt jednej strony
node scrape.js <url> <url-konkurenta>   # audyt + porównanie z konkretnym konkurentem
node scrape.js --peek <url>             # Etap 0: tylko screenshot (bez Firecrawl), ocena wstępna
node scrape.js --peek-batch lista.csv   # Etap 0 wsadowo, max 8 równolegle (sam Playwright)
node scrape.js --batch lista.csv        # tryb wsadowy: cała lista naraz (pełny scrape)
```

`lista.csv` (oba tryby wsadowe) — dwa formaty, rozpoznawane po nagłówku (parser: `scripts/csv-utils.js`): legacy `nazwa,url`, albo rozszerzony `lead_id,nazwa,miasto,url,telefon,email,imie_kontaktowe,status,do_not_contact,notatki,data_M1,gmail_thread_id,totalScore,reviewsCount,imagesCount,categories,placeId,permanentlyClosed` (kolejność kolumn dowolna).

Drugi argument (konkurent) jest opcjonalny. Gdy podany, scraper zapisze dodatkowo `competitor.json` (treść + wydajność konkurenta), a raport zyska sekcję **„Co robi konkurencja"** — 2–3 rzeczy, które konkurent ma, a audytowana strona nie (np. „ma HTTPS i CTA w hero").

Każda rekomendacja w raporcie ma oznaczenie **wysiłek → efekt** (np. „HTTPS → 1 wieczór, efekt natychmiastowy") wg „Mapy wysiłek/efekt" w `reference/kryteria-audytu.md`; tanie poprawki o wysokim efekcie są listowane pierwsze.

**Kwalifikacja leada (Krok 5) i obserwacja do maila.** Osobno od score konwersji Claude ocenia, czy ta konkretna kancelaria to szansa sprzedaży (4 wymiary A/B/C/D, suma 0–8 → `PISAĆ`/`ODPUŚCIĆ`, patrz `reference/kryteria-audytu.md` → „Ocena leada"). **Tylko dla `PISAĆ` (7–8/8) bez blokady kontaktu** audyt zapisuje `mail-observation.txt` — krótki, faktograficzny hak + jedno pytanie otwarte. To materiał wejściowy dla drugiej automatyzacji (ChatGPT), nie gotowy mail: **Claude nie pisze tematu ani treści maila i nie wysyła niczego** (`SKILL.md` → Krok 6).

### Tryb wsadowy (cała lista z trackera)

```bash
# 1. Scrape całej listy (max 3 strony równolegle, błąd jednej nie przerywa reszty)
node scrape.js --batch lista.csv

# 2. (Claude generuje audyt.md + audyt-dane.json dla każdej kancelarii z listy;
#     mail-observation.txt tylko dla PISAĆ. Po każdej: node validate-lead.js <domena>)

# 3. Zbiorczy raport lokalny
node batch-report.js lista.csv          # → output/batch-leady.csv (główny raport)

# 4. Rodzynki 7–8/8 (PISAĆ) do arkusza Claude_import (status_importu: NOWY)
node push-import.js leady.json
```

`batch-leady.csv` (BOM UTF-8 + CRLF, separator `;` — Excel otworzy polskie znaki) ma m.in. kolumny `decyzja`, `scoring_0_8`, `obserwacja_do_maila`, `status_sugerowany`, `score_audytu_0_100`, `tier_audytu`, `pewnosc_oceny`, `mocne_przeslanki`, `co_jest_kosmetyka`. Sortowanie: `PISAĆ` → `ODPUŚCIĆ` → wstępne/do ponownego audytu; w ramach decyzji scoring malejąco. Obok powstają `batch-pominiete.csv` (blokady, duplikaty, firmy zamknięte, zły URL) i `batch-nieudane.csv` (nieudane scrapy — do ręcznej weryfikacji, batch nie ponawia). `batch-fragments.csv` zostaje jako zgodność wsteczna, nie jest już głównym wynikiem.

**Jak wyeksportować `lista.csv` z trackera Excel:**
1. W trackerze zostaw tylko dwie kolumny: **Nazwa** (kol. B) i **Strona www** (kol. D). Najprościej: nowy arkusz z nagłówkiem `nazwa,url` i formułą `=Tracker!B2` / `=Tracker!D2` w dół, potem skopiuj jako wartości.
2. **Plik → Zapisz jako → CSV UTF-8 (rozdzielany przecinkami) (*.csv)**.
3. Wynik to plik `nazwa,url` (jedna kancelaria na wiersz). URL bez schematu (`kancelaria.pl`) jest OK — skrypt dopisze `https://`.

## Struktura

```
audyt-kancelarii/
├── SKILL.md                          ← instrukcja dla Claude (workflow)
├── reference/
│   ├── kryteria-audytu.md            ← 8 wymiarów + punktacja + „Ocena leada"
│   ├── benchmark-pl-law.json         ← agregaty z 21 kancelarii
│   ├── szablon-raportu.md            ← format raportu PL
│   └── schemat-audyt-dane.json       ← kanoniczny szablon audyt-dane.json
├── sheets/
│   ├── Code.gs                       ← webhook Apps Script: zapis + dedup w Claude_import
│   └── README.md                     ← wdrożenie webhooka (jednorazowe)
└── scripts/
    ├── scrape.js                     ← Firecrawl + Playwright + Lighthouse (single, --peek, --peek-batch, --batch)
    ├── csv-utils.js                  ← wspólny parser CSV (legacy/rozszerzony) + normalizacja/dedup
    ├── batch-report.js               ← zbiera wyniki batcha → output/batch-leady.csv
    ├── validate-lead.js              ← waliduje audyt-dane.json przed przekazaniem dalej
    ├── push-import.js                ← wysyła rodzynki 7–8/8 do zakładki Claude_import
    ├── log-odrzucone.js              ← loguje lokalnie leady 5–6/8 (nie audytować drugi raz)
    └── package.json
```

Pipeline odpowiedzialności: `Apify/prospecting → Claude (scrape + audyt + kwalifikacja) → Claude_import (status_importu: NOWY) → ChatGPT (weryfikacja, treść maila, szkic Gmail, aktualizacja Trackera) → człowiek (przegląd i ręczna wysyłka)`. Claude nigdy nie pisze ani nie wysyła treści maila.

## Kalibracja na złej stronie testowej

Zanim puścisz na prawdziwe kancelarie: zbuduj stronę z celowymi błędami (lista w rozmowie z Claude), zapisz „klucz odpowiedzi" i sprawdź czy audyt łapie wszystkie. Trzymaj złą stronę na `pages.dev` jako test regresyjny — po każdej zmianie skilla sprawdzasz czy nadal wykrywa wszystko.

## Rozszerzanie benchmarku

Masz `merge-playbooks.js` i pipeline który wygenerował te 21 kancelarii. Możesz dorzucać kolejne strony do `benchmarks/law/` i regenerować korpus — im więcej, tym mocniejsze porównania.
