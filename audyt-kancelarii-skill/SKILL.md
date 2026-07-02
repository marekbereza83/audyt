---
name: audyt-kancelarii
description: >
  Audyt strony internetowej kancelarii prawnej pod kątem konwersji klientów. Pobiera stronę
  (Firecrawl + Playwright), mierzy ją według systemu FORMA i porównuje z benchmarkiem 21 polskich
  kancelarii, a następnie generuje raport po polsku w formacie "Co działa / Co poprawić / Jak bym
  to rozwiązał" wraz z szacowanym wpływem na konwersję. Używaj gdy użytkownik chce zaudytować
  stronę kancelarii (własną, konkurencji lub potencjalnego klienta do cold maila), przygotować
  materiał na bloga/LinkedIn o stronach prawniczych, albo policzyć sygnały konwersji witryny.
  Wyjście: raport markdown + dane JSON + screenshot.
---

# Audyt strony kancelarii prawnej

## Czym jest ten skill

Narzędzie do audytu stron kancelarii prawnych pod kątem **konwersji** — czyli tego, czy strona zamienia odwiedzającego w zapytanie. Nie jest to audyt „czy ładnie wygląda", lecz „czy klient kancelarii zrozumie ofertę, zaufa i zadzwoni".

Każdy audyt pracuje w czterech zastosowaniach: materiał do **cold maila** (obserwacja konkretnej strony), **wpis na bloga/LinkedIn** (anonimizowany), **nauka** (wzorce co działa), i **wewnętrzny benchmark** dla projektów FORMA.

## Zasady tonu — krytyczne

Audyt jest **merytoryczny, nigdy obraźliwy**. Skupiamy się na faktach i usprawnieniach, nie na ocenie kompetencji właściciela.

- ❌ NIGDY: „beznadziejna strona", „nie znają się", „najgorsza jaką widziałem", przypisywanie motywów.
- ✅ ZAWSZE: „brak wyraźnego CTA w hero", „kontakt wymaga 3 kliknięć", „specjalizacja nie jest widoczna powyżej zgięcia".

Każdy problem musi mieć: (1) fakt — co konkretnie, (2) konsekwencję — dlaczego to kosztuje klientów, (3) rozwiązanie — co zrobić. Bez tej trójki nie umieszczaj punktu w raporcie.

Jeśli audyt ma być publiczny (blog/LinkedIn), **anonimizuj** — „kancelaria z Mazowsza", nie nazwa. Nazwę zostaw tylko w audytach prywatnych (cold mail do tej kancelarii) lub za zgodą.

## Workflow

### Krok 0 — Etap 0: kwalifikacja wizualna (20–30 s, przed pełnym audytem)

Zanim uruchomisz pełny scrape (Firecrawl + Lighthouse), zrób szybki podgląd i odsiej oczywiste „nie". Cel: nie palić czasu ani limitu Firecrawl na leady, których i tak nie warto ruszać.

1. Zrób sam screenshot strony głównej: `node scripts/scrape.js --peek <url>` → `output/<domena>/screenshot-peek.png` (tylko Playwright, **zero Firecrawl**, ~5–10 s). Albo obejrzyj żywą stronę główną.
2. Na podstawie screenshota / strony głównej odpowiedz **zgrubnie** na 5 pytań (te same co w Kroku 5, tu tylko „z oka"):
   - **P1 ⭐ (×2)** — kancelaria wygląda na zamożniejszą niż jej strona?
   - **P2** — strona sprawia wrażenie starszej niż 6–7 lat?
   - **P3** — właściciel ma prawdopodobnie budżet na inwestycję?
   - **P4** — nowa strona wyraźnie poprawiłaby pierwsze wrażenie?
   - **P5** — widać brak inwestycji w ostatnich latach?
3. **Jeśli wynik od razu wskazuje 🔴 ODPUŚĆ** (np. brak jakiegokolwiek kontaktu, strona świeża i bardzo dobra = nie ma o czym pisać, albo ewidentnie brak budżetu): **zatrzymaj się tutaj.** Zapisz `output/<domena>/lead-skip.txt` z powodem i **nie uruchamiaj pełnego scrape** — oszczędza czas i limit Firecrawl.
4. W przeciwnym razie (🟢/🟡 albo niejednoznaczne) → przejdź do Kroku 1. Etap 0 to zgrubny filtr; ostateczny werdykt pada w Kroku 5 na pełnych danych.

### Krok 1 — Pobierz stronę

Uruchom `scripts/scrape.js <url>`. Zwraca on do `output/<domena>/`:
- `content.json` — markdown, nagłówki (H1/H2/H3), meta title/description, linki, formularze, dane kontaktowe wykryte w treści.
- `vitals.json` — Core Web Vitals z Playwright/Lighthouse: LCP, CLS, TBT, performance score, mobile-friendly, HTTPS.
- `screenshot-desktop.png` i `screenshot-mobile.png` — pełne zrzuty (1920 i 375 px).

Jeśli `scrape.js` zawiedzie na Lighthouse (brak Chrome), kontynuuj z samym Firecrawl i odnotuj w raporcie „pomiar szybkości niedostępny".

**Opcjonalnie — porównanie z konkretnym konkurentem.** Jeśli użytkownik poda drugą kancelarię (z tego samego miasta/regionu), uruchom `scripts/scrape.js <url> <url-konkurenta>`. Powstanie dodatkowo `competitor.json` = `{ url, content, vitals }` konkurenta. Wykorzystasz go w Kroku 3 (sekcja „Co robi konkurencja"). Bez drugiego argumentu pomijasz to porównanie.

### Krok 2 — Zmierz według systemu FORMA

Otwórz `reference/kryteria-audytu.md` i przejdź przez **8 wymiarów oceny**. Dla każdego wymiaru przypisz status (✅ dobrze / ⚠️ do poprawy / ❌ brak) na podstawie danych z Kroku 1. Nie oceniaj z pamięci — opieraj każdą ocenę na konkretnym polu z `content.json` lub `vitals.json`, albo na tym co widać na screenshocie.

### Krok 3 — Porównaj z benchmarkiem

Otwórz `reference/benchmark-pl-law.json`. Zestaw audytowaną stronę z agregatami 21 polskich kancelarii. To zamienia opinię w fakt rynkowy:
- „CTA philosophy: none — jak u 13 z 21 kancelarii. Najlepsze (Q78+) mają jawną ścieżkę do kontaktu."
- „Brak oferty konsultacji — ma ją tylko 2 z 21, więc to realny wyróżnik do zdobycia."

Używaj tych liczb w raporcie — są Twoją przewagą nad każdym ogólnym audytem.

**Jeśli istnieje `competitor.json`** — dodatkowo zestaw audytowaną stronę z konkretnym konkurentem. Wybierz 2–3 rzeczy, które konkurent **ma**, a audytowana strona **nie** (na podstawie `competitor.json.content`/`vitals` vs `content.json`/`vitals.json`): np. HTTPS, CTA w hero, mobile, opinie z nazwiskiem, szybsze ładowanie. To zasili sekcję „Co robi konkurencja" w raporcie. Ton: „konkurent ma X, czego tu brakuje" — nigdy „konkurent jest lepszy". Anonimizuj nazwę konkurenta, jeśli audyt publiczny.

### Krok 4 — Wygeneruj raport

Użyj szablonu z `reference/szablon-raportu.md`. Wypełnij sekcje: nagłówek, ocena ogólna (score 0–100 wyliczony jak w kryteriach), Mówiąc wprost, Co działa, Co poprawić (priorytetyzowane), Jak bym to rozwiązał, Porównanie z rynkiem, (opcjonalnie) Co robi konkurencja, i szacowany wpływ na konwersję. Zapisz jako `output/<domena>/audyt.md`.

Sekcja **„Mówiąc wprost"** (zaraz po ocenie ogólnej) tłumaczy **2–3 najważniejsze** problemy na język konsekwencji dla właściciela kancelarii. **Zero terminów technicznych** — żadnego HTTPS, LCP, viewport, H1, JSON-LD, schema, CTA. Zamiast przyczyny podaj, co realnie traci kancelaria (np. nie „brak HTTPS", tylko „przeglądarka straszy klienta ostrzeżeniem, część osób zamyka kartę"). To z tej sekcji wyciągasz zdania do cold maila.

W sekcji **„Jak bym to rozwiązał"** każda rekomendacja musi mieć parę **wysiłek + efekt** z „Mapy wysiłek/efekt" w `kryteria-audytu.md` (np. „HTTPS → 1 wieczór, efekt natychmiastowy"). **Listuj najpierw poprawki tanie o wysokim efekcie**, na końcu kosztowne przebudowy — to zamienia audyt z „masz problemy" w „masz tanie do naprawienia problemy o wysokim zwrocie". Sekcję **„Co robi konkurencja"** dołącz tylko, gdy istnieje `competitor.json`; w przeciwnym razie pomiń ją w całości.

Na końcu zapisz też `output/<domena>/audyt-dane.json` — strukturalne dane (8 wymiarów + statusy + score), żeby dało się je użyć w cold mailu lub zestawieniu.

### Krok 5 — Ocena leada (warstwa biznesowa)

Po wygenerowaniu audytu odpowiedz na jedno pytanie z `reference/kryteria-audytu.md` → „Ocena leada":

> **Czy właściciel tej kancelarii ma motywację, budżet i uzasadnienie biznesowe, aby zainwestować w nową stronę?**

Werdykt to **wyłącznie `pisz` albo `odpusc`** — żadnego pośredniego. Przyznaj 🟢 **PISZ** gdy większość sygnałów wskazuje na realną szansę sprzedaży: wysoki potencjał biznesowy kancelarii + wyraźny rozdźwięk (kancelaria lepsza niż strona) + sygnały inwestowania w marketing + dostępny kontakt. Przyznaj 🔴 **ODPUŚĆ** gdy szansa jest niska lub brak kontaktu (brak kontaktu = ODPUŚĆ zawsze).

Wylicz też **ranking gwiazdkowy** (1–5⭐) i **kategorię potencjału** (A/B/C) wg sekcji „Ranking gwiazdkowy" i „Kategoria potencjału" w kryteriach. Wypisz `sygnalyKupna` — tylko sygnały **potwierdzone danymi** z listy „Sygnały kupna" (puste = brak).

Zapisz wynik w **dwóch** miejscach:
- `audyt-dane.json` → obiekt `ocenaLeada`: `{ werdykt, gwiazdki, potencjal, sygnalyKupna, kontakt, rekomendacja }` (`gwiazdki` = liczba 1–5; `potencjal` = „A"/„B"/„C"; `sygnalyKupna` = tablica; `rekomendacja` = 1–2 zdania uzasadnienia, dla ODPUŚĆ = powód, dla PISZ = co konkretnie widać).
- `audyt.md` → sekcja `## Ocena leada` (z szablonu) — **wewnętrzna, nigdy nie idzie do kancelarii**.

### Krok 6 — Fragment do cold maila (zależny od werdyktu)

**Jeśli werdykt = `odpusc` (🔴):** NIE generuj maila. Zapisz `output/<domena>/lead-skip.txt` z jednym zdaniem: powód odpuszczenia (np. „Brak kontaktu — nie ma do kogo pisać" albo „Strona świeża, score 84 — nie ma czego oferować"). Pomiń resztę tego kroku.

**Jeśli werdykt = `pisz` (🟢):** wygeneruj **dwa pliki**:

1. `output/<domena>/mail-fragment.txt` — **2–4 zdania** (maks. ~400 znaków), czysty tekst do wklejenia w tracker. Format: jedna obserwacja (najważniejszy problem) → konsekwencja w języku klienta → jedno zdanie, że to szybka poprawka lub realny zysk. Bez nagłówków i markdownu.

2. `output/<domena>/mail.txt` — pełny pierwszy mail, format:
   ```
   Temat: [temat maila — konkretny, nie generyczny]

   [Treść maila zgodna ze stylem FORMA: personalizacja (imię/nazwisko adwokata), jedna konkretna obserwacja ze strony, wyjaśnienie skutku dla klientów kancelarii, propozycja wartości (nowa strona = więcej kontaktów), CTA do rozmowy. Ton: merytoryczny, partnerski — nie handlowy. Długość: 5–8 zdań.]
   ```

**Wybór problemu:** jeśli kilka ma priorytet 🔴 wysoki, wybierz ten o największym wpływie na **pierwsze wrażenie klienta**. HTTPS i mobile mają pierwszeństwo przed tym, czego klient nie widzi (np. brak JSON-LD).

Wzór długości i tonu (~250 znaków, 3 zdania):
> Sprawdziłem stronę Kancelarii. Przeglądarka pokazuje klientowi ostrzeżenie o niezabezpieczonej stronie — przy sprawach karnych to moment, w którym wiele osób zamyka kartę. To prosta poprawka, nie przebudowa.

Ton jak w całym audycie: merytoryczny, nie krytykujący. Z tej sekcji bierzesz materiał do maila 1.

## Wyjście

Po zakończeniu pokaż użytkownikowi: ścieżkę do `audyt.md`, score ogólny, **werdykt oceny leada** (🟢/🟡/🔴 + jedno zdanie czemu), 3 najważniejsze rzeczy do poprawy, i zapytaj do czego audyt jest potrzebny (cold mail / blog / wiedza), bo to zmienia jak sformułować finalny tekst.

## Tryb wsadowy (batch)

Gdy trzeba zaudytować całą listę kancelarii naraz (np. z trackera), zamiast jednej po drugiej:

1. **Wejście** — CSV z kolumnami `nazwa,url` (eksport z trackera — patrz `README.md`).
2. **Scrape wszystkich** — `node scripts/scrape.js --batch lista.csv`. Iteruje po liście, **max 3 strony równolegle**, loguje postęp `[i/total] Audytuję ...`. Dla każdej zapisuje `output/<domena>/` jak w trybie pojedynczym. Błąd jednej strony (nie istnieje, timeout) **nie przerywa** reszty — zapisuje `scrape-error.txt` i leci dalej.
3. **Audyty per kancelaria** — przejdź po kolei przez katalogi `output/<domena>/` i dla każdej wykonaj Kroki 2–6 (ocena → `audyt.md` + `audyt-dane.json` + ocena leada + `mail-fragment.txt` **lub** `lead-skip.txt` gdy werdykt 🔴). To krok Claude, nie skryptu — `scrape.js` zbiera tylko dane.
4. **Zbiorczy raport** — `node scripts/batch-report.js lista.csv`. Zbiera dane do dwóch plików:
   - `output/batch-fragments.csv` — tylko udane audyty (kolumny: `gwiazdki,nazwa,werdykt,potencjal_ABC,url,sygnaly_kupna,dlaczego_pisac,fragment_do_maila,score,priorytet_glowny`). Plik jest **wstępnie posortowany**: gwiazdki ↓, potencjał A→C — pierwszy wiersz to najlepszy lead na dziś.
   - `output/batch-nieudane.csv` — strony, których nie udało się pobrać (`nazwa,url,powod_bledu,data_proby`). Do ręcznej weryfikacji. Batch **nie ponawia** nieudanych automatycznie.

**Warunek wstępny:** batch na **prawdziwych** kancelariach z trackera dopiero po przejściu kalibracji na stronie testowej (`zla-strona-testowa-spec.md`). Jeśli kalibracja nie przeszła — zatrzymaj się i o tym przypomnij.

**Limit równoległości (max 3)** — nie przeciążaj Firecrawl/Playwright ani nie wypal darmowego limitu (~500 stron/mies) w jeden dzień.

## Pliki pomocnicze

- `reference/kryteria-audytu.md` — 8 wymiarów oceny + jak punktować (system FORMA) + mapa wysiłek/efekt
- `reference/benchmark-pl-law.json` — agregaty z 21 polskich kancelarii
- `reference/szablon-raportu.md` — format raportu po polsku
- `scripts/scrape.js` — Firecrawl + Playwright + Lighthouse (tryb pojedynczy i `--batch`)
- `scripts/batch-report.js` — zbiera wyniki batcha do `output/batch-fragments.csv`
- `scripts/package.json` — zależności

## Setup (jednorazowo)

```bash
cd scripts && npm install
export FIRECRAWL_API_KEY=fc-...      # darmowy tier ~500 stron/mies
npx playwright install chromium
```
