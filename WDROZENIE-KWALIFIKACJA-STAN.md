# Stan wdrożenia: kwalifikacja leadów 0–8 + nowy pipeline batch

> Plik przejściowy — usunąć po dokończeniu wdrożenia.
> Wznowienie: powiedz Claude „kontynuuj wdrożenie wg WDROZENIE-KWALIFIKACJA-STAN.md".
> Data zapisu: 2026-07-17. Baza: commit `0098338` (kwalifikacja A/B/C/D + webhook Claude_import)
> + rewizja zakresu (patrz „Rewizja 2026-07-17" niżej, ustalona z Markiem po konsultacji z GPT).

---

## REWIZJA 2026-07-17 — Claude robi wyłącznie prospecting i kwalifikację

**Nadrzędna zmiana względem stanu z 2026-07-16 (niżej):** Claude **nie pisze i nie wysyła
cold maila**. Wcześniejszy plan (SKILL.md Krok 6 generujący pełny mail M1 z tematem i treścią
60–100 słów, pliki `mail-M1.txt`/`mail-M1-temat.txt`) jest **porzucony i wdrożony odwrotnie**.

**Docelowy podział odpowiedzialności:**

1. **Claude (to repo)** — prospecting + kwalifikacja: pobiera kancelarie (Apify/prospecting),
   usuwa zamknięte/duplikaty, ocenia wizualnie i przez 8 wymiarów, kwalifikuje A/B/C/D (0–8),
   decyduje `PISAĆ`/`ODPUŚCIĆ`. Dla `PISAĆ` (7–8/8) bez blokady kontaktu pisze WYŁĄCZNIE krótką,
   faktograficzną `obserwacja_do_maila` (fakt + jedno pytanie otwarte) — **nie temat, nie treść
   maila**. Przekazuje rodzynki do zakładki `Claude_import` (`status_importu: NOWY`).
2. **ChatGPT (poza tym repo)** — pobiera nowy rekord z `Claude_import`, ponownie weryfikuje
   ocenę i duplikaty (cały Tracker + historia Gmaila), pisze temat i treść M1, tworzy WYŁĄCZNIE
   szkic Gmail, zapisuje `SZKIC_GMAIL` w Trackerze, po wysłaniu synchronizuje statusy/odpowiedzi.
   Po przejęciu rekordu zmienia `status_importu` z `NOWY` na `PRZEJĘTY`.
3. **Człowiek** — sprawdza szkic i wysyła ręcznie. Żaden proces nie wysyła cold maila automatycznie.

Pipeline: `Apify/prospecting → Claude (audyt + kwalifikacja) → Claude_import (NOWY) → ChatGPT
(weryfikacja, treść M1, szkic Gmail, Tracker) → człowiek (przegląd + ręczna wysyłka)`.

### Co to zmieniło w plikach (wdrożone w tej sesji)

| Plik | Zmiana |
|---|---|
| `reference/schemat-audyt-dane.json` | `mail.{temat_M1,tresc_M1}` usunięte. Obiekt `mail` → `przekazanie: {do_importu, obserwacja_do_maila}`. `status_sugerowany` wartość `MAIL_GOTOWY` → `DO_IMPORTU`. |
| `scripts/validate-lead.js` | Usunięte reguły walidujące treść maila M1 (60–100 słów, zakazane frazy, żargon, cena — bo ten tekst już nie istnieje). Usunięte wymaganie `temat_M1`/`tresc_M1` dla `PISAĆ`. **Nowa reguła 9**: `PISAĆ` nie może opierać się wyłącznie na wieku strony / kosmetyce / błędzie widocznym tylko w narzędziu (heurystyka: `jestSlaba()` + `priorytet_wizualny`). **Nowa reguła 10**: mocna przesłanka nie może jednocześnie być w `co_jest_kosmetyka`. Plik obserwacji: `mail-observation.txt` (kanoniczny) / `mail-fragment.txt` (legacy fallback) zamiast `mail-M1.txt`. |
| `scripts/batch-report.js` | Kolumny `temat_M1`/`tresc_M1` usunięte z `batch-leady.csv`. Czyta `dane.przekazanie` zamiast `dane.mail`; fallback pliku obserwacji: `mail-observation.txt` → `mail-fragment.txt`. |
| `scripts/scrape.js` | Docstring + komunikaty konsoli: usunięte sformułowania sugerujące, że Claude generuje mail M1. |
| `sheets/Code.gs` | Dodana 22. kolumna `status_importu` — webhook zawsze zapisuje `NOWY` (payload ignorowany). **13 pierwszych kolumn (blok wklejany do Trackera) i reszta śladu audytu (`potrzeba_0_2`…`data_dodania`) NIE zmienione** — świadoma decyzja, patrz niżej. |
| `scripts/push-import.js` | Docstring: nie wysyłać `temat_M1`/`tresc_M1`; `status_importu` w payloadzie jest ignorowany (webhook zawsze zapisuje `NOWY`). |
| `SKILL.md` | Kroki zamienione miejscami: **Krok 5 = ocena leada (kwalifikacja)**, **Krok 6 = obserwacja do maila + przekazanie do `Claude_import`, tylko dla `PISAĆ`**. Usunięte odwołania do skilla `cold-email` jako autora maila. „Tryb wsadowy" i „Pliki pomocnicze" zaktualizowane (batch-leady.csv, csv-utils.js, validate-lead.js, schemat-audyt-dane.json). |
| `reference/kryteria-audytu.md` | Dopisany akapit „Trzy niezależne warstwy" + podział odpowiedzialności. Google Maps dopisane jako sygnał pomocniczy (nie dowód budżetu) w źródłach wymiaru B. Tier 0–29: „Strona aktywnie traci klientów" → neutralne sformułowanie. |
| `CLAUDE.md` (root) | Sekcja „Pisanie cold maila" → „Podział pracy: Claude kwalifikuje, ChatGPT pisze i wysyła maila", z diagramem pipeline'u. Batch section: `batch-leady.csv` + `push-import.js` zamiast `batch-fragments.csv`. Nowa zasada 5 (Claude nie pisze/wysyła maila). |
| `audyt-kancelarii-skill/CLAUDE.md` | Komendy zaktualizowane (`batch-leady.csv`, `validate-lead.js`, `push-import.js`), dodana sekcja „Trzy niezależne warstwy", `contactPage`+`lead-info.json` w modelu danych, koszt Firecrawl (~5 wywołań/audyt, ~80–100/mies na darmowym tierze), nowa zasada 6. |
| `README.md` (skilla) | Składnia `scrape.js` (`--peek`/`--peek-batch`/rozszerzony CSV), `batch-leady.csv` jako główny wynik, struktura katalogu z nowymi skryptami + `sheets/`. |

### Świadomie NIE zmienione — kolizja ze schematem GPT

GPT zaproponował inny zestaw kolumn `Claude_import` (snake_case: `nazwa_kancelarii`,
`strona_www`, `naturalny_powod_0_2`, `glowny_widoczny_problem`, dodatkowo `source_id`/`domena`,
bez `decyzja`/`zrodlo_audytu`/`mocne_przeslanki`/`co_jest_kosmetyka`/`sprawdzone_podstrony`/
`data_dodania`). **Odrzucone przez Marka** — obecny (wdrożony) schemat ma 13 pierwszych kolumn
identycznych z kolumnami C–O prawdziwego Trackera (`Nazwa kancelarii` … `data_audytu`), co
pozwala wkleić zatwierdzony wiersz 1:1 bez przemapowania (`sheets/README.md`, potwierdzone
realnym przykładem z produkcyjnego Trackera: FW-0006 = „Adwokat Ełk" w polu „Strona www").
Zmiana nazw/kolejności złamałaby to i wymagała ręcznej migracji istniejących danych. Zamiast
tego: **zachowany schemat 1:1, dołożona tylko `status_importu`** (patrz tabela wyżej).

**Jeśli ChatGPT pisze do Trackera przez własną integrację (API), a nie kopiuj-wklej bloku** —
ograniczenie znika i schemat od GPT można by wdrożyć bez kolizji. Do potwierdzenia z Markiem
przy najbliższej okazji, nie zakładać milcząco.

---

## Stan z 2026-07-16 (PRZED rewizją wyżej — kontekst historyczny)

### Podjęte decyzje (nadal aktualne, nieruszone rewizją)

1. **Polityka progów** — potwierdzone przez Marka:
   - 7–8/8 → `PISAĆ` → przekazanie do `Claude_import` (przez `push-import.js`)
   - 5–6/8 → **bez obserwacji, bez zapisu** → lokalny log `node log-odrzucone.js <domena> <pkt> "<powod>"`
   - 0–4/8 → `ODPUŚCIĆ` → też log lokalny
   - **NIE MA decyzji „WARUNKOWO PISAĆ"** — decyzja przyjmuje tylko `PISAĆ | ODPUŚCIĆ`
     (dla 5–6 formalnie `ODPUŚCIĆ`; rozróżnienie widać po `scoring_0_8`).
2. **Nazewnictwo pól**: wymiary A/B/C/D, `co_jest_kosmetyka`, `scoring_0_8` w formacie „7/8" w
   CSV/arkuszu. W `audyt-dane.json` scoring zagnieżdżony (`reference/schemat-audyt-dane.json`).
3. **Podstrony scrapera**: `servicesPage`/`teamPage`/`newsPage`/`contactPage` przez `PODSTRONY`+
   `fetchSubpage`. NIE wracać do koncepcji `sitePages {home,services,about,contact,news}` z
   wcześniejszej (porzuconej) wersji.
4. Ocena wstępna (`--peek`, niepełne dane): `pewnosc_oceny: "wstepna"`, `decyzja: null`,
   `status_sugerowany: "DO_AUDYTU"`, zero przekazania.
5. Blokada kontaktu (`do_not_contact`, notatka „NIE KONTAKTOWAĆ", statusy ZAMKNIĘTY/ODPOWIEDZIAŁ/
   ROZMOWA/KLIENT/M1_WYSŁANY/FU1_WYSŁANY/FU2_WYSŁANY): audyt WOLNO zaktualizować, obserwacja NIE
   powstaje, nie nadpisywać statusu operacyjnego (`status_sugerowany: null` przy blokadzie).

### Zrobione w tej sesji (2026-07-17) — działa, składnia zweryfikowana `node --check`

`scripts/csv-utils.js`, `scripts/scrape.js`, `scripts/batch-report.js`, `scripts/validate-lead.js`,
`reference/schemat-audyt-dane.json` — dopasowane do rewizji wyżej (tabela w sekcji REWIZJA).
`sheets/Code.gs` + `sheets/README.md`, `scripts/push-import.js`, `SKILL.md`, `CLAUDE.md` (root i
skilla), `README.md` (skilla), `reference/kryteria-audytu.md` — zaktualizowane.

**Nic nie jest zacommitowane** — wszystko w working tree na HEAD=`0098338`.

## Do zrobienia (kolejność)

### 1. Testy regresyjne (task #12)
Katalog `scripts/tests/`: `run-tests.js` + fixtures (sztuczne katalogi output w temp przez
`AUDYT_OUTPUT_DIR`). Zakres:
- walidator: fixture `PISAĆ`-poprawny (7/8, 2 przesłanki, obserwacja bez żargonu) → 0 błędów;
  `ODPUŚCIĆ`-poprawny → 0; `ODPUŚCIĆ`-z-obserwacją → błąd; `PISAĆ`-bez-obserwacji → błąd;
  punkty=3 → błąd; razem≠suma → błąd; decyzja `PISAĆ` przy 6/8 → błąd; wstępna-z-decyzją → błąd;
  blokada (lead-info mail_zablokowany:true) + przekazanie.do_importu:true → błąd;
  `PISAĆ` oparte wyłącznie na wieku/kosmetyce/błędzie-narzędzia → błąd (reguła 9);
  mocna przesłanka też w co_jest_kosmetyka → błąd (reguła 10);
  obserwacja z żargonem (LCP/SSL/…) → błąd; email zgadnięty (brak w źródłach) → błąd.
- parser (`csv-utils.js`): stary CSV z przecinkami w nazwie; rozszerzony z cudzysłowami/BOM/
  pustymi/notatką wieloliniową; średniki; polskie znaki.
- batch-report (na fixture output): kolejność `PISAĆ` przed `ODPUŚCIĆ` przed wstępnymi; w ramach
  decyzji scoring malejąco; `score_audytu_0_100` NIE wpływa na kolejność; BOM+`;`+CRLF; polskie
  znaki czytelne; stary schemat → bucket 3; brak kolumn `temat_M1`/`tresc_M1` w nagłówku.
- `node --check` wszystkich skryptów.
- Regresja stron testowych: NIE zmieniać oczekiwanych score (zła ~5, średnia ~61) — wymiary/score
  nie były ruszane.

### 2. Dokumentacja — resztki poza zakresem rewizji (nie blokują commitu, ale zostały z 2026-07-16)
- **`reference/szablon-raportu.md`**: (a) usunąć/zmiękczyć „dlaczego to kosztuje kancelarię
  klientów" → neutralnie („co to utrudnia klientowi"); (b) dopisać, że w publicznym `audyt.md` nie
  wolno umieszczać przypuszczeń o budżecie; (c) NOWY plik `reference/szablon-kwalifikacji.md`
  (szablon `kwalifikacja-leada.md`: decyzja, powód biznesowy, max 3 mocne przesłanki,
  co_jest_kosmetyka, rozbicie A/B/C/D + razem — plik wewnętrzny FORMA).
- Sprawdzić grep-em, czy nigdzie nie zostały odniesienia do P1–P5 / „5 pytań" (scrape.js --peek
  już poprawione wcześniej).

### 3. Raport końcowy (task #14)
Lista zmienionych plików + opis, finalny schemat, nagłówki `batch-leady.csv`, przykładowy rekord
`PISAĆ` i `ODPUŚCIĆ` (fixture z testów), wyniki testów, ograniczenia (np. walidator nie sprawdza
„prawdziwości" obserwacji — tylko formę; reguła 9 to heurystyka tekstowa, nie dowód; email z
`contactPage` wymaga weryfikacji przy zapisie; schemat `Claude_import` = decyzja świadomie
zachowawcza, patrz sekcja „Świadomie NIE zmienione" wyżej).

### 4. Commit
Po testach + dokumentacji — jeden commit i push. UWAGA: praca idzie z dwóch komputerów — przed
commitem `git fetch` i sprawdzić `origin/main`.

## Kontekst techniczny (żeby nie odkrywać ponownie)

- Tracker: zakładka `Claude_import`, kolumny wg `sheets/Code.gs` → `KOLUMNY` (22, ostatnia
  `status_importu`). Zapis TYLKO przez webhook (`push-import.js`, wymaga SHEETS_URL+SHEETS_SECRET
  w `scripts/.env`). Tracker read-only. Webhook zawsze pisze `status_importu: NOWY`; na
  `PRZEJĘTY` zmienia go ChatGPT po przejęciu rekordu — Code.gs nigdy tego nie robi.
- `log-odrzucone.js` odrzuca scoring ≥7 (te idą do arkusza) — spójne z polityką.
- Stare 21 katalogów `output/` ma stary schemat → `batch-report.js` kieruje je do „do ponownego
  audytu".
- Dataset Apify: `dataset_google-maps-extractor_2026-07-05_13-34-33-605.json` (412 firm, pola
  zgodne z rozszerzonym CSV).
- `push-import.js` waliduje sumę A+B+C+D = scoring — walidator lokalny (`validate-lead.js`) robi
  to samo wcześniej, po stronie Claude.
