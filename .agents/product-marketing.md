# Kontekst produktowy — FORMA

> **Status:** scalony z (1) treści żywej strony formawizerunku.pl + eksportu CMS (fakty produktowe, zweryfikowane)
> oraz (2) szkicu wygenerowanego automatycznie przez Claude Code z repo audytu (struktura, uczciwe `[TODO]`).
> Sekcje `[TODO]` to fakty, których nie da się potwierdzić ani ze strony, ani z kodu — uzupełnij przed
> użyciem w produkcyjnym outreachu na dużą skalę. Nic poniżej nie jest zmyślone.

---

## Product Definition

- **One-liner:** FORMA Wizerunku — strony internetowe dla kancelarii prawnych, projektowane pod konwersję w systemie PACTA (formawizerunku.pl).
- **Kategoria / typ:** usługa (projektowanie/przebudowa stron www, jednoosobowa pracownia) + narzędzie audytowe jako lead magnet i research do cold outreachu.
- **Pozycjonowanie (hero strony głównej):** „Klient ocenia kancelarię zanim zadzwoni." Projektuję strony dla kancelarii prawnych, które porządkują ofertę, budują zaufanie i ułatwiają kontakt z klientem. Gotowe w 14 dni. Od 4 500 zł netto.
- **Model biznesowy:** projekt jednorazowy (nie retainer/subskrypcja). Dwa stałe pakiety + wycena indywidualna dla większego zakresu. Płatność po dostarczeniu, bez zaliczki.

## Oferta i cennik (zweryfikowane, ze strony)

**Pakiet Standard — 4 500 zł netto, 14 dni od briefu.**
Do 4 podstron, 1 runda poprawek, CMS do edycji treści, SEO techniczne, wdrożenie + instrukcja obsługi, 15 dni bezpłatnych poprawek technicznych po publikacji.

**Pakiet Rozszerzony — 6 500 zł netto, 21 dni od briefu.**
Wszystko ze Standardu + do 8 podstron, 2 rundy poprawek, blog/aktualności, migracja istniejących treści, 30 dni bezpłatnych poprawek.

**Większy/niestandardowy zakres:** wycena indywidualna.

**Kontakt:** tel. 512 407 191 (odpowiedź w 24h), kontakt@formawizerunku.pl. Każde zapytanie trafia bezpośrednio do właściciela — jednoosobowa działalność, bez pośredników.

## System PACTA (metoda, nie szablon)

Zestaw sprawdzonych zasad projektowania stron dla kancelarii prawnych, oparty na analizie tego, jak klienci wybierają kancelarię. Projekt nie zaczyna się od pustej kartki.

Cztery filary:
- Jasna prezentacja specjalizacji kancelarii
- Struktura prowadząca użytkownika do kontaktu
- Komunikacja dopasowana do usług prawnych (w tym zgodność z etyką zawodową)
- Szybka, responsywna strona gotowa do indeksacji w Google

## Market Understanding

- **Kim są klienci:** polskie kancelarie prawne (adwokackie, radcowskie, corporate/M&A), głównie jedno- i kilkuosobowe. Potwierdzone segmenty ze strony: kancelaria radcy prawnego, kancelaria adwokacka, kancelaria corporate/M&A, kancelaria solo.
- **Decydent:** właściciel/wspólnik kancelarii — zwykle też osoba prowadząca sprawy, bez osobnego działu marketingu.
- **Primary use case / JTBD:** strona ma zamienić odwiedzającego w zapytanie/telefon. Audyt FORMA mierzy, czy obecna strona to robi (8 wymiarów, `reference/kryteria-audytu.md`).

## Stakeholder Breakdown

| Rola | Co ich obchodzi | Wyzwanie |
|---|---|---|
| Właściciel kancelarii | Więcej zapytań od klientów, wiarygodność w oczach klienta | Brak czasu/wiedzy technicznej, strona robiona dawno temu „przy okazji" |
| [TODO] inne role, jeśli występują (wspólnik, office manager) | | |

## Problem, który rozwiązujemy (bóle klienta — wprost ze strony)

Większość osób sprawdza stronę kancelarii przed pierwszym kontaktem. Trzy bóle nazwane wprost na stronie głównej:

1. **Wygląd nieaktualny** ("z 2016 roku") — stara strona sygnalizuje "ta kancelaria nie dba o szczegóły". Klient ocenia zanim zadzwoni.
2. **Nieczytelna na telefonie** — 60% odwiedzających to mobile. Wolna, nieresponsywna strona jest karana przez Google i odpycha klientów.
3. **Brak wyraźnych CTA** — klient przychodzi i wychodzi bez kontaktu. Liczba zapytań nie rośnie.

Techniczne wymiary audytu (`reference/kryteria-audytu.md`, 8 wymiarów + benchmark 21 kancelarii w `reference/benchmark-pl-law.json`): brak HTTPS, brak wersji mobilnej, brak jasnego CTA, brak widocznej specjalizacji, wolne ładowanie, brak sygnałów zaufania.

## Market Dynamics

- **Konkurencja FORMA jako usługodawcy:** [TODO] — inne agencje/freelancerzy robiące strony dla kancelarii; brak ustalonej listy nazw/pozycjonowania w repo. (Audyt umie porównać stronę KLIENTA z konkretnym konkurentem klienta przez `competitor.json` — to inna rzecz niż konkurencja FORMA.)
- **Różnicowanie FORMA:**
  1. Jeden wykonawca, nie agencja — bez handlowców, bez przekazywania między działami.
  2. Jawna cena od razu — konkurenci podają cenę dopiero po rozmowie.
  3. Gwarantowany termin 14 dni (pod warunkiem materiałów do Dnia 8).
  4. Płatność po dostarczeniu, bez zaliczki.
  5. Hosting w zakresie — pomoc w wyborze/konfiguracji lub pełne wdrożenie.
  6. Przebudowa istniejących stron — analiza obecnej strony, zachowanie wartościowych treści.
  7. Oparte na danych — benchmark 21 realnych polskich kancelarii, punktacja 8 wymiarów, każda rekomendacja z parą wysiłek→efekt. Nie generyczny redesign.

## Sales Intelligence

- **Obiekcje + odpowiedzi:** [TODO] — nieudokumentowane realnymi rozmowami. Typowe dla branży prawdopodobnie: „strona wystarczy jaka jest", „nie mam budżetu/czasu", „klienci i tak przychodzą z poleceń" — **nie zakładaj tego w mailu bez potwierdzenia z realnej rozmowy**.
- **Anti-persony (kogo nie warto atakować):** [TODO]
- **Trigger do zmiany:** sygnały z `ageSignals` w `content.json` (stary copyright, stary szablon, generator CMS) wskazują zaniedbaną stronę — naturalny punkt zaczepienia, ale sama obserwacja techniczna nie jest dowodem gotowości zakupowej.

## Proof / realizacje (UWAGA — zasada użycia)

- **Kancelaria Radcy Prawnego Kowalczyk** (solo) — czytelna prezentacja specjalizacji, prosty kontakt. Gotowa w 12 dni. Na żywo: kowalczyk.pages.dev
- **MAZUR LEGAL** (corporate/M&A) — rozbudowana prezentacja usług i zespołu bez utraty przejrzystości. Na żywo: mazur-wspolnicy.pages.dev
- To są **przykładowe realizacje / projekty w systemie PACTA**, tak jak przedstawia je strona — **NIE prawdziwe referencje z cytatami/opiniami klientów**. Strona nie zawiera takich cytatów — nie dopisuj ich.
- Poza tymi dwoma: brak innych potwierdzonych proof pointów, liczby wdrożeń czy testimoniali. Audyt samej strony odbiorcy (konkretna obserwacja) jest obecnie jedynym potwierdzonym proof pointem w mailu.

## Proces (5 kroków, 14 dni)

Brief (dzień 1-2) → Projekt/Design (3-5) → Realizacja/Wdrożenie (5-10) → Treść i zdjęcia (8-12, równolegle) → Testy (12-13) → Publikacja (14).

## Statystyki (insight, nie gotowy pain point)

- 79% klientów kontaktuje więcej niż jedną kancelarię przed decyzją (Martindale-Avvo, *Understanding the Legal Consumer* 2023).
- 60% odwiedzających korzysta z urządzeń mobilnych.
- Benchmark 21 polskich kancelarii: 13/21 bez strategii CTA, 2/21 z ofertą konsultacji, 0/21 z formularzem na stronie głównej, mediana jakości 60/100.

## Communication Assets

- **Język klienta (verbatim):** [TODO] — zbierz realne cytaty z rozmów/opinii kancelarii, jeśli się pojawią.
- **Ton i głos:** merytoryczny, bezpośredni, nigdy protekcjonalny ani sprzedażowo-agresywny. Rozmowa fachowca z fachowcem, nie pitch. Krótkie zdania, liczby i fakty zamiast ogólników ("14 dni", "4 500 zł" — nie "szybko i tanio").
- **Czego unikać:** nigdy "beznadziejna strona", "nie znają się", ocena kompetencji właściciela, przypisywanie motywów. Zawsze fakt → konsekwencja → rozwiązanie. Zero żargonu technicznego wprost do klienta (HTTPS/LCP/viewport/H1/JSON-LD/CTA/meta — tłumacz na skutek, patrz `szablon-raportu.md` sekcja "Mówiąc wprost"). Polskie AI-tells: "mam nadzieję że u Pana wszystko dobrze", "kompleksowe rozwiązanie", "lider w branży", "na rynku od lat".
- **Zasady etyki zawodowej:** bez reklamy porównawczej, bez obietnic konkretnego wyniku/liczby klientów ("nie obiecuj liczb, których nie da się dowieść"). Podwójna ostrożność — to może naruszać zasady etyki zawodowej adwokata/radcy, nie tylko być złym tonem.

## Research signal — kluczowe dla personalizacji

Research signal do **maila 1** = jedna konkretna, możliwa do zweryfikowania obserwacja z audytu tej konkretnej strony + jedno pytanie otwarte (`output/<domena>/mail-fragment.txt`) — nie surowy fakt techniczny i nie ogólnikowa opinia o wrażeniu. **Test:** jeśli dałoby się wysłać to samo zdanie do dowolnej innej kancelarii i wciąż brzmiałoby prawdziwie, jest za ogólne — obserwacja musi nazywać coś konkretnego z tej strony (cytat nagłówka, konkretny obecny/nieobecny element). **Od maila 2 sekwencja nie odwołuje się do audytu w ogóle** — rozmowa dotyczy wizerunku, profesjonalizmu i trendów branżowych (patrz łuk 5 maili niżej).

## Co sprzedaje FORMA (i czego NIE sprzedaje w cold mailu)

**FORMA sprzedaje nową stronę internetową / wizerunek kancelarii — nie audyt techniczny, nie SEO, nie optymalizację szybkości.** Audyt (`audyt-kancelarii`) to wewnętrzne narzędzie do znalezienia **jednej obserwacji** na hook do maila 1. To nie jest produkt, który trzeba opisywać przez całą sekwencję.

Efekt, o który chodzi: żeby właścicielka/właściciel kancelarii **sam pomyślał** „chyba faktycznie czas coś zrobić ze stroną" — nie żeby odbiorca pomyślał „ten facet sprzedaje optymalizację SEO/szybkości".

**Zasady dla całej async sekwencji (mail 1 → follow-upy, przed jakąkolwiek odpowiedzią odbiorcy):**
- **Zakazane słowa/pojęcia w całej sekwencji** (łącznie z mailem 1 — nawet przetłumaczone na „skutek dla klienta" nie wchodzą do treści maila): LCP, HTTPS, SSL, cache, JSON-LD, schema, meta description, benchmark, mediana, %/procent, sekundy ładowania, viewport, H1. Jeśli któreś pojawi się w wygenerowanym mailu — to błąd, przepisz. Te terminy żyją tylko w `audyt.md` (wewnętrzny) i w **rozmowie po odpowiedzi** odbiorcy.
- Mail 1: jedna konkretna, weryfikowalna obserwacja + jedno pytanie otwarte, koniec — nie ogólnikowa opinia o wrażeniu. Obserwacja ma nazywać coś, co odbiorca może sam sprawdzić na własnej stronie (cytat nagłówka, konkretny element), nie parametr wydajności — źródło: `mail-fragment.txt`, który sam już jest w tym nietechnicznym, ale konkretnym języku (patrz `audyt-kancelarii-skill/SKILL.md` → Krok 5). **Nie kwestionuj tam decyzji, która mogła być świadoma** (fraza SEO w nagłówku, brak nazwisk przy opiniach) — wybieraj fakty o układzie informacji, nie oceny strategii właściciela (pełne rozróżnienie w `SKILL.md` → Krok 5).
- Dopiero gdy odbiorca odpowie i wejdzie w rozmowę, można przejść do konkretów (SSL, szybkość, CTA, UX, SEO) — i to w rozmowie, nie w kolejnym mailu z sekwencji.
- Test przed wysyłką: gdyby ktoś przeczytał samą sekwencję (bez wiedzy o audycie), powinien odnieść wrażenie kontaktu od projektanta stron dbającego o wizerunek klienta — nie od firmy SEO/performance.

### Domyślny łuk 5 maili dla FORMA (priorytet nad ogólnym Observation→Problem→Proof→Ask)

Ten łuk zastępuje domyślny framework `cold-email` dla kontekstu FORMA (ogólny framework zostaje dostępny dla innych, niezwiązanych z audytem kontekstów):

1. **Mail 1 (dzień 0) — konkretna obserwacja + pytanie otwarte.** Jedyne miejsce z touchpointem audytu, w wersji nietechnicznej ale weryfikowalnej (treść = `mail-fragment.txt`) — nie ogólnik, tylko coś, co odbiorca może sam sprawdzić na swojej stronie. Kończy się pytaniem, nie ujawnia diagnozy.
2. **Mail 2 (dzień ~3-4) — kontekst branżowy.** Ogólna obserwacja rynkowa (jak zmienia się wybór kancelarii przez klientów), nie dane z audytu tej strony. Bez statystyk z procentami — jakościowo, nie liczbowo.
3. **Mail 3 (dzień ~7-10) — komplement + delikatne wyzwanie.** Docenienie czegoś realnego (doświadczenie, specjalizacja, sposób prowadzenia kancelarii) + sugestia, że można to pokazać jeszcze lepiej. Bez wskazywania konkretnych błędów strony.
4. **Mail 4 (dzień ~14-21) — otwarte drzwi na przyszłość + „dlaczego ja".** Niska presja, długi horyzont („gdyby kiedyś..."), nie „kup teraz". **Tu (albo w mailu 3) dodaj jedno zdanie różnicujące FORMA od agencji** — inaczej odbiorca nie wie, dlaczego odpisać akurat Tobie, a nie agencji. Jedno zdanie, nie lista cech: np. „cały projekt prowadzę osobiście — od pierwszej rozmowy do wdrożenia". Wybierz **jeden** wyróżnik pasujący do kontekstu (solo/bez pośredników, płatność po dostarczeniu, termin 14 dni) — nie wszystkie naraz.
5. **Mail 5 (dzień ~21-28) — zamknięcie.** Breakup, zostaw kontakt, bez nacisku. Format 1-2-3 opcjonalny, jeśli pasuje tonem.

**Anty-powtarzalność dla tego łuku:** mail 1 nadal różni się między kancelariami z natury (obserwacja pochodzi z ich audytu). Maile 2–5 są teraz bardziej ogólne tematycznie — mimo to nie mogą stać się dosłownie identyczne słowo w słowo między kancelariami. Różnicuj przez naturalne wzmianki o specjalizacji/mieście/kontekście tej konkretnej kancelarii tam, gdzie to pasuje, nawet gdy sam fakt audytowy zniknął z treści.

## CTA preferowane (one ask, low friction)

Nie proponuj spotkania/rozmowy 30-min w pierwszym mailu. Preferowane:
- „Czy to temat, o którym warto porozmawiać?"
- „Chętnie prześlę pełną analizę — zainteresowani?"
- Alternatywa: bezpośredni telefon 512 407 191.

## Zasada anty-powtarzalności (temat + zdanie otwierające)

Dotyczy każdego maila i całej skali (wielu kancelarii z trackera naraz):

1. **W obrębie jednej sekwencji** (mail 1 + follow-upy do tej samej kancelarii) — każdy temat i każde zdanie otwierające musi się różnić od poprzednich w tej sekwencji. Rotacja kątów (łuk 5 maili wyżej) to wymusza treściowo — pilnuj dodatkowo, żeby dosłowne sformułowanie się nie powtórzyło.
2. **Mail 1 między kancelariami w tym samym batchu** — nadal źródłem jest konkretny, zmierzony fakt TEJ strony (dokładna liczba lub sygnał, np. „specjalizacja schowana na podstronie", „nagłówek po angielsku bez konkretu", „brak nagłówka H1 i ogólne etykiety oferty" — przetłumaczone na pytanie o wizerunek), nigdy ogólna etykieta. Dwie kancelarie z podobnym problemem i tak dostają różne pytania, bo różnią się szczegółem z własnego audytu.
3. **Maile 2–5 między kancelariami** — są teraz bardziej ogólne tematycznie (łuk wizerunkowy, nie fakty audytowe) — różnicuj przez naturalne wzmianki o specjalizacji/mieście/kontekście tej kancelarii, żeby nie stały się dosłownie identyczne słowo w słowo przy skalowaniu na resztę trackera.
4. **Przed wysyłką batcha** — prowadź krótką listę już użytych tematów/otwarć w danym uruchomieniu i sprawdzaj nowy mail względem niej, zwłaszcza mail 1 dla kancelarii o podobnym profilu audytu.
5. **Sekcja „Ocena leada" w audycie jest wewnętrzna** (i usunięta z aktywnego workflow audytu — patrz commit „Uprość narzędzie") — jeśli mimo to pojawi się w starszym `audyt.md`, żadna fraza stamtąd nie może trafić do treści maila.

## Business Direction

- **Cel podstawowy:** doprowadzić do rozmowy/zlecenia przebudowy strony kancelarii na podstawie konkretnego audytu.
- **Pożądana akcja konwersji:** odpowiedź na cold mail → rozmowa wstępna (nie call sprzedażowy w pierwszym touchpoincie).
- **Aktualne metryki:** [TODO] — reply rate, liczba wysłanych maili, konwersja tracker→klient nieudokumentowane centralnie. Tracker Excel może je zawierać, ale wymaga ręcznego sprawdzenia, nie jest parsowany automatycznie.

---

*Scalono z: treści żywej strony formawizerunku.pl (fakty produktowe), eksportu CMS (cennik/FAQ/kontakt), oraz szkicu wygenerowanego przez Claude Code z repo audytu (struktura + uczciwe luki). Pola `[TODO]` wymagają realnych danych przed produkcyjnym outreachem na dużą skalę — w szczególności obiekcje klientów i konkurencja FORMA jako usługodawcy.*
