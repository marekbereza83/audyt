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

### Krok 1 — Pobierz stronę

Uruchom `scripts/scrape.js <url>`. Zwraca on do `output/<domena>/`:
- `content.json` — markdown, nagłówki (H1/H2/H3), meta title/description, linki, formularze, dane kontaktowe wykryte w treści.
- `vitals.json` — Core Web Vitals z Playwright/Lighthouse: LCP, CLS, TBT, performance score, mobile-friendly, HTTPS.
- `screenshot-desktop.png` i `screenshot-mobile.png` — pełne zrzuty (1920 i 375 px).

Jeśli `scrape.js` zawiedzie na Lighthouse (brak Chrome), kontynuuj z samym Firecrawl i odnotuj w raporcie „pomiar szybkości niedostępny".

**Opcjonalnie — porównanie z konkretnym konkurentem.** Jeśli użytkownik poda drugą kancelarię (z tego samego miasta/regionu), uruchom `scripts/scrape.js <url> <url-konkurenta>`. Powstanie dodatkowo `competitor.json` = `{ url, content, vitals }` konkurenta. Wykorzystasz go w Kroku 3 (sekcja „Co robi konkurencja"). Bez drugiego argumentu pomijasz to porównanie.

### Krok 2 — Oceń wizualnie, potem zmierz według systemu FORMA

**Najpierw ocena wizualna — to podstawa całego audytu.** Otwórz `screenshot-desktop.png` i `screenshot-mobile.png` i przejdź przez „Krok 0 — Ocena wizualna" z `reference/kryteria-audytu.md`. Wynik: `priorytet_wizualny` (wysoki/średni/niski/do sprawdzenia) + 2–3 zdania uzasadnienia z konkretami ze screenshota. Kancelaria decyduje się na nową stronę, bo obecna *wygląda* staro — nie przez parametry; werdykt wizualny otworzy raport i da obserwację do maila.

Potem przejdź przez **8 wymiarów oceny** z tego samego pliku. Dla każdego wymiaru przypisz status (✅ dobrze / ⚠️ do poprawy / ❌ brak) na podstawie danych z Kroku 1. Nie oceniaj z pamięci — opieraj każdą ocenę na konkretnym polu z `content.json` lub `vitals.json`, albo na tym co widać na screenshocie. Wymiary nie zastępują oceny wizualnej — dostarczają mierzalnego uzasadnienia i materiału na rozmowę po odpowiedzi na maila.

### Krok 3 — Porównaj z benchmarkiem

Otwórz `reference/benchmark-pl-law.json`. Zestaw audytowaną stronę z agregatami 21 polskich kancelarii. To zamienia opinię w fakt rynkowy:
- „CTA philosophy: none — jak u 13 z 21 kancelarii. Najlepsze (Q78+) mają jawną ścieżkę do kontaktu."
- „Brak oferty konsultacji — ma ją tylko 2 z 21, więc to realny wyróżnik do zdobycia."

Używaj tych liczb w raporcie — są Twoją przewagą nad każdym ogólnym audytem.

**Jeśli istnieje `competitor.json`** — dodatkowo zestaw audytowaną stronę z konkretnym konkurentem. Wybierz 2–3 rzeczy, które konkurent **ma**, a audytowana strona **nie** (na podstawie `competitor.json.content`/`vitals` vs `content.json`/`vitals.json`): np. HTTPS, CTA w hero, mobile, opinie z nazwiskiem, szybsze ładowanie. To zasili sekcję „Co robi konkurencja" w raporcie. Ton: „konkurent ma X, czego tu brakuje" — nigdy „konkurent jest lepszy". Anonimizuj nazwę konkurenta, jeśli audyt publiczny.

### Krok 4 — Wygeneruj raport

Użyj szablonu z `reference/szablon-raportu.md`. Wypełnij sekcje: nagłówek, ocena ogólna (score 0–100 wyliczony jak w kryteriach), Mówiąc wprost, Co działa, Co poprawić (priorytetyzowane), Jak bym to rozwiązał, Porównanie z rynkiem, (opcjonalnie) Co robi konkurencja, i szacowany wpływ na konwersję. Zapisz jako `output/<domena>/audyt.md`.

Sekcja **„Mówiąc wprost"** (zaraz po ocenie ogólnej) **zaczyna się od werdyktu wizualnego** — jak strona wygląda oczami klienta trafiającego na nią pierwszy raz (z Kroku 2, z konkretami ze screenshota). Dopiero potem 2–3 najważniejsze problemy przetłumaczone na język konsekwencji dla właściciela. **Zero terminów technicznych** — żadnego HTTPS, LCP, viewport, H1, JSON-LD, schema, CTA. Zamiast przyczyny podaj, co realnie traci kancelaria (np. nie „brak HTTPS", tylko „przeglądarka straszy klienta ostrzeżeniem, część osób zamyka kartę"). To z tej sekcji wyciągasz zdania do cold maila.

W sekcji **„Jak bym to rozwiązał"** każda rekomendacja musi mieć parę **wysiłek + efekt** z „Mapy wysiłek/efekt" w `kryteria-audytu.md` (np. „HTTPS → 1 wieczór, efekt natychmiastowy"). **Listuj najpierw poprawki tanie o wysokim efekcie**, na końcu kosztowne przebudowy — to zamienia audyt z „masz problemy" w „masz tanie do naprawienia problemy o wysokim zwrocie". Sekcję **„Co robi konkurencja"** dołącz tylko, gdy istnieje `competitor.json`; w przeciwnym razie pomiń ją w całości.

Na końcu zapisz też `output/<domena>/audyt-dane.json` — strukturalne dane (8 wymiarów + statusy + score **+ pole `ocenaWizualna`**: `{ "priorytet": "wysoki|sredni|niski|do sprawdzenia", "uzasadnienie": "2–3 zdania z konkretami ze screenshota", "zaniedbanieTechniczne": "opcjonalna osobna notatka" }`), żeby dało się je użyć w cold mailu, zestawieniu i kolumnie `priorytet_wizualny` trackera.

### Krok 5 — Fragment do maila

Zapisz `output/<domena>/mail-fragment.txt` — **zawsze, dla każdej zaudytowanej strony**.

**To pole zasila WYŁĄCZNIE otwarcie maila 1.** Fakty techniczne z audytu (LCP, HTTPS, JSON-LD, benchmark, score) zostają w `audyt.md` do użytku wewnętrznego FORMA i **nie trafiają do dalszej korespondencji** — ani do tego pliku, ani do maili 2–5 generowanych później przez skill `cold-email`.

Format: **jedna konkretna, możliwa do zweryfikowania obserwacja wynikająca z audytu + jedno pytanie otwarte.** Nie sama miękka opinia — obserwacja musi nazywać coś, co odbiorca może sam sprawdzić na własnej stronie (np. dosłowny cytat nagłówka, konkretny element, który tam jest albo którego tam nie ma). **Test przed zapisaniem: czy to zdanie dałoby się wysłać do dowolnej innej kancelarii bez zmian i wciąż brzmiałoby prawdziwie?** Jeśli tak — obserwacja jest za ogólna, wróć do audytu i weź coś bardziej charakterystycznego dla tej konkretnej strony.

Język: taki, jakim mogłaby to napisać osoba patrząca na stronę oczami klienta — nie audytor. Zero terminów technicznych (LCP, HTTPS, SSL, cache, JSON-LD, schema, meta description, benchmark, mediana, %, sekundy ładowania, viewport, H1) — nawet przetłumaczonych na „skutek dla klienta". Pytanie ma zapraszać do odpowiedzi, nie ujawniać diagnozy.

**Wybór obserwacji — wizualna ma pierwszeństwo.** Najpierw sięgnij po uzasadnienie z oceny wizualnej (Krok 2 / `ocenaWizualna`): jawna stara data w stopce, layout z widocznie innej epoki, darmowa platforma, wyłącznie stockowe grafiki — to sygnały, które właściciel sam *zobaczy* po otwarciu własnej strony, więc najmocniej otwierają rozmowę o nowej stronie. Dopiero gdy strona wygląda współcześnie (`priorytet_wizualny` = niski), weź najmocniejszy sygnał z sekcji „Co można poprawić" o **układzie informacji** (specjalizacja schowana na podstronie, brak elementu kontaktowego). Zawsze przełóż na konkretny, nazwany element strony — nie na ogólnikowe pytanie o wrażenie.

**Nie kwestionuj świadomej decyzji marketingowej, jeśli nie ma oczywistego uzasadnienia, że to błąd.** Wybierz fakty o **układzie informacji, treści i komunikacji** — nie oceny strategii właściciela. Przykład rozróżnienia:
- ✅ Fakt (bezpiecznie): brak specjalizacji na pierwszym ekranie, łacińska sentencja przed ofertą, strona na Google Sites, komunikat „przerwa techniczna", brak wyraźnego elementu kontaktowego — to stany, których nikt świadomie by nie wybrał jako strategię.
- ⚠️ Możliwa świadoma decyzja (unikaj kwestionowania bez uzasadnienia): fraza SEO w nagłówku (może to przemyślane pozycjonowanie), brak nazwisk przy opiniach (może to ochrona danych klientów kancelarii), forma kontaktu ograniczona do formularza (może to celowe filtrowanie zapytań). Jeśli sygnał z audytu jest tego typu — poszukaj innego, bardziej jednoznacznego faktu zamiast go użyć.

Przykłady tłumaczenia:
- „strona ładuje się 5,8 s" → obserwacja o czymś widocznym, nie o samej szybkości: np. brak elementu, na który klient czeka, zanim strona się doładuje.
- „H1 = tylko imię i nazwisko, specjalizacja dopiero na podstronie" → „Na stronie głównej jest Pani imię i nazwisko, ale nie ma tam informacji, jakimi sprawami się Pani zajmuje — trzeba kliknąć w osobną zakładkę, żeby to znaleźć."
- „H1 = angielski slogan bez konkretu" → zacytuj dosłownie ten nagłówek: „Nagłówek na stronie głównej brzmi »Leading Law Firm in Poland« — nie mówi wprost, jakimi sprawami zajmuje się kancelaria."
- „stary szablon, copyright 2017" → „Stopka strony pokazuje `© 2017` — od tamtej pory strona wygląda na nieodświeżaną."

Wzór (długość dowolna, byle jedna obserwacja + jedno pytanie):
> Sprawdziłem stronę kancelarii. [Konkretna, cytowalna/weryfikowalna obserwacja o tej stronie]. [Jedno pytanie otwarte].

`mail-fragment.txt` to jedyny touchpoint audytu w cold mailu — nie gotowy mail i nie brief techniczny na całą sekwencję. Finalną treść maila 1 oraz całą sekwencję follow-upów (bez odwołań do audytu od maila 2) pisze skill `cold-email` z oficjalnego repo marketingskills (`.agents/skills/cold-email`), zgodnie z zasadami w `.agents/product-marketing.md` → „Co sprzedaje FORMA".

## Wyjście

Po zakończeniu pokaż użytkownikowi: ścieżkę do `audyt.md`, score ogólny, 3 najważniejsze rzeczy do poprawy i zapytaj do czego audyt jest potrzebny (cold mail / blog / wiedza) — to zmienia finalne sformułowanie (publiczny = anonimizuj nazwę kancelarii).

## Tryb wsadowy (batch)

Gdy trzeba zaudytować całą listę kancelarii naraz (np. z trackera), zamiast jednej po drugiej:

1. **Wejście** — CSV z kolumnami `nazwa,url` (eksport z trackera — patrz `README.md`).
2. **Scrape wszystkich** — `node scripts/scrape.js --batch lista.csv`. Iteruje po liście, **max 3 strony równolegle**, loguje postęp `[i/total] Audytuję ...`. Dla każdej zapisuje `output/<domena>/` jak w trybie pojedynczym. Błąd jednej strony (nie istnieje, timeout) **nie przerywa** reszty — zapisuje `scrape-error.txt` i leci dalej.
3. **Audyty per kancelaria** — przejdź po kolei przez katalogi `output/<domena>/` i dla każdej wykonaj Kroki 2–5 (ocena → `audyt.md` + `audyt-dane.json` + `mail-fragment.txt`). To krok Claude, nie skryptu — `scrape.js` zbiera tylko dane.
4. **Zbiorczy raport** — `node scripts/batch-report.js lista.csv`. Zbiera dane do dwóch plików:
   - `output/batch-fragments.csv` — udane audyty (kolumny: `nazwa,url,score,priorytet_glowny,fragment_do_maila`), posortowane po score rosnąco (najniższy score = największa luka = na górze).
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
