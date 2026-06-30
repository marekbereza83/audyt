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
node scrape.js --batch lista.csv        # tryb wsadowy: cała lista naraz (CSV: nazwa,url)
```

Drugi argument (konkurent) jest opcjonalny. Gdy podany, scraper zapisze dodatkowo `competitor.json` (treść + wydajność konkurenta), a raport zyska sekcję **„Co robi konkurencja"** — 2–3 rzeczy, które konkurent ma, a audytowana strona nie (np. „ma HTTPS i CTA w hero").

Każda rekomendacja w raporcie ma oznaczenie **wysiłek → efekt** (np. „HTTPS → 1 wieczór, efekt natychmiastowy") wg „Mapy wysiłek/efekt" w `reference/kryteria-audytu.md`; tanie poprawki o wysokim efekcie są listowane pierwsze. Każdy audyt zapisuje też `mail-fragment.txt` — 2–4 zdania gotowe do wklejenia w cold mail.

### Tryb wsadowy (cała lista z trackera)

```bash
# 1. Scrape całej listy (max 3 strony równolegle, błąd jednej nie przerywa reszty)
node scrape.js --batch lista.csv

# 2. (Claude generuje audyt.md + mail-fragment.txt dla każdej kancelarii z listy)

# 3. Zbiorczy plik do trackera
node batch-report.js lista.csv          # → output/batch-fragments.csv
```

`batch-fragments.csv` ma kolumny `nazwa,url,fragment_do_maila,score,priorytet_glowny` (BOM UTF-8 + CRLF — Excel otworzy polskie znaki). Kolumna `fragment_do_maila` jest gotowa do wklejenia do kolumny „Obserwacja" w trackerze; strony, które zawiodły, mają `BŁĄD: <powód>`.

**Jak wyeksportować `lista.csv` z trackera Excel:**
1. W trackerze zostaw tylko dwie kolumny: **Nazwa** (kol. B) i **Strona www** (kol. D). Najprościej: nowy arkusz z nagłówkiem `nazwa,url` i formułą `=Tracker!B2` / `=Tracker!D2` w dół, potem skopiuj jako wartości.
2. **Plik → Zapisz jako → CSV UTF-8 (rozdzielany przecinkami) (*.csv)**.
3. Wynik to plik `nazwa,url` (jedna kancelaria na wiersz). URL bez schematu (`kancelaria.pl`) jest OK — skrypt dopisze `https://`.

## Struktura

```
audyt-kancelarii/
├── SKILL.md                          ← instrukcja dla Claude (workflow)
├── reference/
│   ├── kryteria-audytu.md            ← 8 wymiarów + punktacja
│   ├── benchmark-pl-law.json         ← agregaty z 21 kancelarii
│   └── szablon-raportu.md            ← format raportu PL
└── scripts/
    ├── scrape.js                     ← Firecrawl + Playwright + Lighthouse (single + --batch)
    ├── batch-report.js               ← zbiera wyniki batcha → output/batch-fragments.csv
    └── package.json
```

## Kalibracja na złej stronie testowej

Zanim puścisz na prawdziwe kancelarie: zbuduj stronę z celowymi błędami (lista w rozmowie z Claude), zapisz „klucz odpowiedzi" i sprawdź czy audyt łapie wszystkie. Trzymaj złą stronę na `pages.dev` jako test regresyjny — po każdej zmianie skilla sprawdzasz czy nadal wykrywa wszystko.

## Rozszerzanie benchmarku

Masz `merge-playbooks.js` i pipeline który wygenerował te 21 kancelarii. Możesz dorzucać kolejne strony do `benchmarks/law/` i regenerować korpus — im więcej, tym mocniejsze porównania.
