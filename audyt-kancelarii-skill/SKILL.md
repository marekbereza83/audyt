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

**Najpierw ocena wizualna — to podstawa całego audytu.** Otwórz `screenshot-desktop.png` i `screenshot-mobile.png` i przejdź przez „Krok 0 — Ocena wizualna" z `reference/kryteria-audytu.md`: 5 wymiarów (aktualność designu, pierwsze wrażenie, spójność marki, wiarygodność, świeżość treści), każdy ✅/🟡/🔴. Wynik: `priorytet_wizualny` (wysoki/średni/niski/do sprawdzenia) wyliczony z reguły w kryteriach **+ lista markerów, które o nim zadecydowały**. Pytanie przewodnie: czy właściciel, patrząc na własną stronę, może poczuć, że przestała reprezentować jego kancelarię? Werdykt wizualny otworzy raport i da obserwację do maila.

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

Na końcu zapisz też `output/<domena>/audyt-dane.json` — strukturalne dane (8 wymiarów + statusy + score **+ pole `ocenaWizualna`**):

```json
"ocenaWizualna": {
  "priorytet": "wysoki|sredni|niski|do sprawdzenia",
  "wymiary": {
    "aktualnoscDesignu": "ok|do sprawdzenia|problem",
    "pierwszeWrazenie": "ok|do sprawdzenia|problem",
    "spojnoscMarki": "ok|do sprawdzenia|problem",
    "wiarygodnosc": "ok|do sprawdzenia|problem",
    "swiezoscTresci": "ok|do sprawdzenia|problem"
  },
  "markery": ["©2017 w stopce", "teksturowane tło", "wąska ramka"]
}
```

— żeby dało się je użyć w cold mailu, zestawieniu i kolumnie `priorytet_wizualny` trackera.

### Krok 5 — Ocena leada (kwalifikacja pod kątem sprzedaży)

Osobno od score konwersji: czy **ta konkretna** kancelaria to szansa sprzedaży nowej strony za
~4 500–6 500 zł? Przejdź przez 4 wymiary A/B/C/D z `reference/kryteria-audytu.md` → „Ocena leada"
(źródła: `priorytet_wizualny` + `ageSignals` dla A, `teamPage` dla B, różnica A↔B dla C,
`newsPage`/konkretny błąd dla D). Zapisz rozbicie punktacji jak w formacie z kryteriów, do
`audyt-dane.json` → `kwalifikacja_leada`.

**Ta ocena nigdy nie trafia do obserwacji ani do maila** — to wewnętrzna kwalifikacja, odbiorca nie ma wiedzieć, że go punktujemy.

Werdykt:

| Suma | `decyzja` | Co dalej |
|---|---|---|
| **7–8** | `PISAĆ` | przejdź do Kroku 6 — zapisz obserwację i przekaż do `Claude_import` |
| 5–6 | `ODPUŚCIĆ` (rozróżnienie od 0–4 widać po `scoring_0_8`) | **nie zapisuj do arkusza, nie pisz obserwacji.** Zaloguj lokalnie: `node scripts/log-odrzucone.js <domena> <scoring_0_8> "<powod>"` |
| 0–4 | `ODPUŚCIĆ` | to samo, `log-odrzucone.js` |
| brak danych / strona niedostępna | `null` (`pewnosc_oceny` ≠ `pelna`) | nie oceniaj — oznacz `OCENA WSTĘPNA — ZA MAŁO DANYCH`, nie zapisuj nigdzie |

**`PISAĆ` nie może opierać się wyłącznie na wieku strony, kosmetyce albo błędzie widocznym tylko w narzędziu** (np. TLS/502 z Lighthouse, którego nie widać na zrzucie) — potrzeba ≥1 mocnej przesłanki, którą zauważyłby realny odwiedzający. `node scripts/validate-lead.js <domena>` odrzuci taką kwalifikację.

Przy audycie wsadowym rób to po Kroku 4 dla każdej kancelarii z listy.

### Krok 6 — Obserwacja do maila i przekazanie do `Claude_import` (tylko dla `PISAĆ`)

**Ten krok dotyczy wyłącznie leadów z Kroku 5 = `PISAĆ` bez blokady kontaktu.** Dla `ODPUŚCIĆ`, oceny wstępnej i leadów zablokowanych (`lead-info.json` → `mail_zablokowany`) pomiń go całkowicie — bez obserwacji, bez pliku, bez przekazania.

**Claude na tym etapie kończy pracę.** Nie pisz tematu ani treści maila (M1, FU1, FU2), nie twórz szkicu Gmail, nie wysyłaj niczego i nie zmieniaj statusu operacyjnego w Trackerze — to robi druga automatyzacja (ChatGPT) po przejęciu rekordu z zakładki `Claude_import`:

`Apify → Claude (audyt + kwalifikacja) → Claude_import (status_importu: NOWY) → ChatGPT (weryfikacja, treść M1, szkic Gmail, aktualizacja Trackera) → człowiek (przegląd i ręczna wysyłka)`

Zapisz `output/<domena>/mail-observation.txt` (nazwa kanoniczna — `mail-fragment.txt` jest legacy aliasem ze starszych audytów, `batch-report.js` czyta oba).

**To pole jest materiałem wejściowym dla ChatGPT, nie gotowym mailem.** Fakty techniczne z audytu (LCP, HTTPS, JSON-LD, benchmark, score) zostają w `audyt.md` do użytku wewnętrznego FORMA i **nie trafiają do dalszej korespondencji** — ani do tego pliku, ani do maila M1/follow-upów, które pisze później ChatGPT.

Format: **jedna konkretna, możliwa do zweryfikowania obserwacja wynikająca z audytu + jedno pytanie otwarte.** Nie sama miękka opinia — obserwacja musi nazywać coś, co odbiorca może sam sprawdzić na własnej stronie (np. dosłowny cytat nagłówka, konkretny element, który tam jest albo którego tam nie ma). **Test przed zapisaniem: czy to zdanie dałoby się wysłać do dowolnej innej kancelarii bez zmian i wciąż brzmiałoby prawdziwie?** Jeśli tak — obserwacja jest za ogólna, wróć do audytu i weź coś bardziej charakterystycznego dla tej konkretnej strony.

Język: taki, jakim mogłaby to napisać osoba patrząca na stronę oczami klienta — nie audytor. Zero terminów technicznych (LCP, HTTPS, SSL, cache, JSON-LD, schema, meta description, benchmark, mediana, %, sekundy ładowania, viewport, H1) — nawet przetłumaczonych na „skutek dla klienta". Pytanie ma zapraszać do odpowiedzi, nie ujawniać diagnozy.

**Rola: uważny rozmówca, nie copywriter i nie audytor.** Piszesz jako właściciel małej pracowni projektowej, który naprawdę wszedł na tę stronę i coś mu się rzuciło w oczy. Nie prowadzisz kampanii — piszesz jedną normalną wiadomość. Odbiorca po przeczytaniu ma pomyśleć „ktoś naprawdę wszedł na moją stronę", a nie „dostałem kolejny szablon".

**Obserwacja kończy się na obserwacji.** Zasada `fakt → konsekwencja → rozwiązanie` obowiązuje w raporcie `audyt.md` — **nie w mailu**. W mailu każdy takt po samym fakcie jest już sprzedażą, dlatego oba są zakazane:
- ❌ **Zdanie konsekwencji** — „przez co klient wraca do wyników", „to kosztuje kancelarię kontakty", „klient zamknie kartę, zanim…", „Google pokaże stronę niżej". To argumentowanie, dlaczego obserwacja jest ważna. Człowiek, który coś zauważył, nie argumentuje — mówi, co zauważył, i pyta. Argumentuje handlowiec.
- ❌ **Zdanie rozwiązania** — „to drobna poprawka, nie przebudowa", „wyniki widać szybko", „to najbardziej opłacalna zmiana". To już oferta. Domyka perswazję w pierwszej wiadomości, która miała tylko otworzyć rozmowę.

**Czego jeszcze nie robić** (wzorce wyłapane na realnych mailach — każdy z nich brzmi jak agencja):
- ❌ **Kanapka komplementowa** — „Jest dobrze zbudowana: ma X i Y. Jest jednak jeden problem…". Rozpoznawalna technika copywriterska, a „jeden problem" to wprost ocenianie strony.
- ❌ **Ocenianie i krytyka** — „to jest źle", „to należy poprawić", „brakuje", „strona wygląda słabo", „zauważyłem błędy". Zamiast tego: „Zwróciłem uwagę na…", „Zastanawiam się…", „Mam wrażenie…".
- ❌ **Marketingowe przymiotniki** — profesjonalny, nowoczesny, skuteczny, wyjątkowy, premium, innowacyjny, kompleksowy, najwyższa jakość, wyróżniający. Jeśli można usunąć przymiotnik i zdanie nadal działa — usuń go.
- ❌ **Mail o mnie** — „projektuję…", „tworzę…", „specjalizuję się…", „oferuję…". Fragment ma być o kancelarii, nie o FORMA.
- ❌ **Więcej niż jedna obserwacja.** Jedna. Nie pięć, nie audyt.

**Otwarcie: różnicuj.** Nie zaczynaj każdego fragmentu tym samym zdaniem — przy wysyłce do kilkudziesięciu kancelarii identyczny otwieracz („Sprawdziłem stronę kancelarii.") sam w sobie zdradza szablon, a „sprawdziłem" to czasownik audytora („przeprowadziłem kontrolę"), nie kogoś, kto po prostu wszedł i zobaczył. Wejdź od razu w to, co widać, albo od naturalnego wejścia na stronę — np. „Trafiłem na stronę Pana kancelarii i…", „Otworzyłem stronę kancelarii — pierwsze, co widać, to…", „Zajrzałem na stronę kancelarii; zwróciłem uwagę na…". W obrębie jednego batcha pilnuj, żeby otwarcia się nie powtarzały dosłownie.

**Pytanie musi być naprawdę otwarte** — nie może zawierać werdyktu.
- ❌ Pytanie z ukrytą diagnozą (retoryczne): „Czy specjalizacja nie powinna rzucać się w oczy od razu?", „Czy warto by pokazać to już na pierwszym ekranie?" — odpowiedź jest w pytaniu, więc to zakamuflowana rekomendacja.
- ✅ Pytanie zostawiające właścicielowi wyjście z twarzą: „Czy to celowy wybór, czy strona po prostu tak została od początku?", „Czy to zamierzony efekt?", „Czy strona była odświeżana od tamtego czasu?"

**Hierarchia hooków — wybieraj z najwyższej kategorii, w której coś się znajdzie.** Nie wszystkie sygnały „widoczne na screenshocie" są sobie równe: jedne dominują pierwsze wrażenie, inne trzeba zauważyć i zinterpretować. Cztery kategorie, malejąca siła:

1. ⭐⭐⭐⭐⭐ **Pierwsze wrażenie (pierwsze 2–3 sekundy).** To, co nowy klient widzi natychmiast, zanim zacznie cokolwiek czytać. Przykłady: hero wygląda na projekt sprzed kilkunastu lat, kolaż kilku niepowiązanych zdjęć, drewniane tło/tekstura marmuru (skeuomorfizm), łacińska sentencja zamiast informacji o ofercie, Google Sites, komunikat „Przerwa techniczna", slider z pięciu zdjęć, stockowe zdjęcie młotka. Test: właściciel patrzy na własną stronę i myśli „Rzeczywiście… tak to wygląda." **Wybieraj zawsze, jeśli coś z tej kategorii istnieje** — nic niżej jej nie przebija.
2. ⭐⭐⭐⭐ **Układ informacji.** Np. na stronie głównej nie widać, czym zajmuje się kancelaria — trzeba wejść w „Zakres usług"; pierwszy ekran pokazuje nazwisko, ale nie specjalizację. Nadal bardzo dobry hook — użyj, gdy kategoria 1 jest pusta (typowo `priorytet_wizualny` = niski, strona wygląda współcześnie).
3. ⭐⭐⭐ **Widoczne błędy.** Czerwone komunikaty PHP/serwera, puste sekcje, tekst wychodzący poza ekran, niedziałające elementy, brakujące zdjęcia. Konkretne i weryfikowalne, ale zwykle dotyczą jednego elementu, nie całego wrażenia — użyj, gdy 1–2 są puste.
4. ⭐⭐ **Detale potwierdzające.** `© 2017`, `Copyright 2015`, favicon, stare ikony social media, stary rok w stopce. Prawdziwe i „widoczne", ale nikt ich nie zauważa, dopóki nie zacznie szukać — same w sobie nie budzą wrażenia „ta strona wygląda staro". **Nigdy jako główny hook maila 1, jeśli istnieje coś z kategorii 1–3.** Miejsce na nie: mail 2+ jako potwierdzenie/dodatek do mocniejszego hooka, nie jako samodzielne otwarcie.

Zawsze przełóż wybraną obserwację na konkretny, nazwany element strony — nie na ogólnikowe pytanie o wrażenie.

**Nie kwestionuj świadomej decyzji marketingowej, jeśli nie ma oczywistego uzasadnienia, że to błąd.** Wybierz fakty o **układzie informacji, treści i komunikacji** — nie oceny strategii właściciela. Przykład rozróżnienia:
- ✅ Fakt (bezpiecznie): brak specjalizacji na pierwszym ekranie, łacińska sentencja przed ofertą, strona na Google Sites, komunikat „przerwa techniczna", brak wyraźnego elementu kontaktowego — to stany, których nikt świadomie by nie wybrał jako strategię.
- ⚠️ Możliwa świadoma decyzja (unikaj kwestionowania bez uzasadnienia): fraza SEO w nagłówku (może to przemyślane pozycjonowanie), brak nazwisk przy opiniach (może to ochrona danych klientów kancelarii), forma kontaktu ograniczona do formularza (może to celowe filtrowanie zapytań). Jeśli sygnał z audytu jest tego typu — poszukaj innego, bardziej jednoznacznego faktu zamiast go użyć.

Przykłady tłumaczenia:
- „strona ładuje się 5,8 s" → obserwacja o czymś widocznym, nie o samej szybkości: np. brak elementu, na który klient czeka, zanim strona się doładuje.
- „H1 = tylko imię i nazwisko, specjalizacja dopiero na podstronie" → „Na stronie głównej jest Pani imię i nazwisko, ale nie ma tam informacji, jakimi sprawami się Pani zajmuje — trzeba kliknąć w osobną zakładkę, żeby to znaleźć."
- „H1 = angielski slogan bez konkretu" → zacytuj dosłownie ten nagłówek: „Nagłówek na stronie głównej brzmi »Leading Law Firm in Poland« — nie mówi wprost, jakimi sprawami zajmuje się kancelaria."
- „stary szablon, copyright 2017" → „Stopka strony pokazuje `© 2017` — od tamtej pory strona wygląda na nieodświeżaną." (kategoria 4 — użyj tylko, gdy nic z kategorii 1–3 nie występuje na tej stronie)

Wzór (długość dowolna, byle jedna obserwacja + jedno pytanie — i **nic poza tym**):
> [Naturalne wejście, za każdym razem inne]. [Konkretna, cytowalna/weryfikowalna obserwacja o tej stronie]. [Jedno pytanie otwarte].

**Test jakości — zadaj sobie te trzy pytania przed zapisaniem pliku. Jedno „nie" = napisz od nowa:**
1. Czy ten fragment mógłby wysłać dowolny software house? Jeśli TAK — od nowa.
2. Czy odbiorca uwierzy, że naprawdę obejrzałem jego stronę? Jeśli NIE — od nowa.
3. Czy brzmi jak wiadomość od konkretnego człowieka, a nie z kampanii? Jeśli NIE — od nowa.

`mail-observation.txt` to jedyny touchpoint audytu w cold mailu — nie gotowy mail i nie brief techniczny na całą sekwencję. Finalną treść maila M1 oraz follow-upy pisze ChatGPT po przejęciu rekordu z `Claude_import` — poza tym repo i poza tym skillem.

Po zapisaniu obserwacji: zbierz dane w formacie kolumn `Claude_import` (patrz `sheets/README.md`) i wyślij: `node scripts/push-import.js <leady.json>`. Webhook sam odrzuci duplikaty względem „Tracker" i „Claude_import" oraz zapisze `status_importu: NOWY` — nie zapisuj nic w arkuszu ręcznie i nie ustawiaj `PRZEJĘTY` (to robi ChatGPT po przejęciu rekordu).

Przy audycie wsadowym: po przejściu Kroków 5–6 dla każdej kancelarii z listy podaj podsumowanie paczki (sprawdzone / odrzucone / duplikaty / 5–6 niezapisane / nowe rodzynki 7–8/8 wysłane do importu / strony niesprawdzone) — format z `reference/kryteria-audytu.md` → „Ocena leada".

## Wyjście

Po zakończeniu pokaż użytkownikowi: ścieżkę do `audyt.md`, score ogólny, 3 najważniejsze rzeczy do poprawy, wynik oceny leada (Krok 5) i — jeśli `PISAĆ` — potwierdzenie przekazania do `Claude_import` (Krok 6). Zapytaj do czego audyt jest potrzebny (cold mail / blog / wiedza) — to zmienia tylko anonimizację (publiczny = anonimizuj nazwę kancelarii); Claude nie pisze ani nie wysyła maila w żadnym z tych przypadków.

## Tryb wsadowy (batch)

Gdy trzeba zaudytować całą listę kancelarii naraz (np. świeży dataset Apify albo eksport z trackera), zamiast jednej po drugiej. **W tym trybie Claude jest wyłącznie prospectingiem i kwalifikacją** — patrz podział odpowiedzialności w Kroku 6.

1. **Wejście** — CSV: format legacy `nazwa,url` albo rozszerzony (`lead_id,nazwa,miasto,url,telefon,email,imie_kontaktowe,status,do_not_contact,notatki,data_M1,gmail_thread_id,totalScore,reviewsCount,imagesCount,categories,placeId,permanentlyClosed` — kolejność kolumn dowolna, rozpoznawane po nagłówku, parser: `scripts/csv-utils.js`).
2. **Scrape wszystkich** — `node scripts/scrape.js --batch lista.csv`. Filtruje najpierw firmy zamknięte (`permanentlyClosed`), duplikaty (domena/telefon/placeId) i rekordy bez poprawnego URL, potem iteruje **max 3 strony równolegle**, loguje postęp `[i/total] Audytuję ...`. Dla każdej zapisuje `output/<domena>/` jak w trybie pojedynczym + `lead-info.json` (identyfikacja, status operacyjny, kontekst Google Maps, blokada kontaktu). Błąd jednej strony (nie istnieje, timeout) **nie przerywa** reszty — zapisuje `scrape-error.txt` i leci dalej.
3. **Audyty per kancelaria** — przejdź po kolei przez katalogi `output/<domena>/` i dla każdej wykonaj Kroki 2–6 (ocena → `audyt.md` + `audyt-dane.json`, dla `PISAĆ` dodatkowo `mail-observation.txt`). To krok Claude, nie skryptu — `scrape.js` zbiera tylko dane. Po każdej kancelarii: `node scripts/validate-lead.js <domena>`.
4. **Zbiorczy raport** — `node scripts/batch-report.js lista.csv`. Zbiera dane do:
   - `output/batch-leady.csv` — **GŁÓWNY raport** (sortowanie: `PISAĆ` → `ODPUŚCIĆ` → wstępne/do ponownego audytu; w ramach decyzji scoring malejąco).
   - `output/batch-pominiete.csv` — wykluczone: blokada kontaktu, firmy zamknięte, duplikaty, zły URL.
   - `output/batch-nieudane.csv` — strony, których nie udało się pobrać. Do ręcznej weryfikacji, batch **nie ponawia** automatycznie.
5. **Przekazanie rodzynków** — zbierz leady `PISAĆ` (7–8/8) w formacie kolumn `Claude_import` i wyślij: `node scripts/push-import.js <leady.json>` (patrz Krok 6).

**Warunek wstępny:** batch na **prawdziwych** kancelariach dopiero po przejściu kalibracji na stronie testowej (`zla-strona-testowa-spec.md`). Jeśli kalibracja nie przeszła — zatrzymaj się i o tym przypomnij.

**Limit równoległości (max 3)** — nie przeciążaj Firecrawl/Playwright ani nie wypal darmowego limitu (~500 stron/mies) w jeden dzień.

## Pliki pomocnicze

- `reference/kryteria-audytu.md` — 8 wymiarów oceny + jak punktować (system FORMA) + mapa wysiłek/efekt + „Ocena leada"
- `reference/benchmark-pl-law.json` — agregaty z 21 polskich kancelarii
- `reference/szablon-raportu.md` — format raportu po polsku
- `reference/schemat-audyt-dane.json` — kanoniczny szablon `audyt-dane.json` (kopiuj i wypełniaj)
- `scripts/scrape.js` — Firecrawl + Playwright + Lighthouse (tryb pojedynczy, `--peek`, `--peek-batch`, `--batch`)
- `scripts/csv-utils.js` — wspólny parser CSV (legacy/rozszerzony) + normalizacja/dedup dla `scrape.js` i `batch-report.js`
- `scripts/batch-report.js` — zbiera wyniki batcha do `output/batch-leady.csv`
- `scripts/validate-lead.js` — waliduje `audyt-dane.json` przed przekazaniem dalej (`node validate-lead.js <domena>|--all`)
- `scripts/push-import.js` — wysyła rodzynki 7–8/8 do zakładki „Claude_import" arkusza (dedup po stronie arkusza)
- `scripts/log-odrzucone.js` — loguje lokalnie leady 5–6/8 do `output/odrzucone.csv`, żeby nie audytować drugi raz
- `sheets/Code.gs` + `sheets/README.md` — webhook Apps Script obsługujący zapis i dedup w arkuszu (wdrożenie jednorazowe)
- `scripts/package.json` — zależności

## Setup (jednorazowo)

```bash
cd scripts && npm install
export FIRECRAWL_API_KEY=fc-...      # darmowy tier ~500 stron/mies
npx playwright install chromium
```
