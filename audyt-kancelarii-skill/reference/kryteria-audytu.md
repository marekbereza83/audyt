# Kryteria audytu — system FORMA

8 wymiarów oceny strony kancelarii pod kątem konwersji. Każdy ma wagę i sposób punktowania. Suma daje score 0–100.

**Ocena wizualna (sekcja poniżej) jest nadrzędna wobec 8 wymiarów, choć nie wchodzi do score.** Kancelaria decyduje się na nową stronę, bo obecna *wygląda* staro — nie dlatego, że nagłówek jest w złym miejscu. Wizualny werdykt otwiera raport i jest pierwszym źródłem obserwacji do cold maila; 8 wymiarów dostarcza mierzalnego uzasadnienia i materiału na rozmowę po odpowiedzi.

---

## Krok 0 — Ocena wizualna (nie wchodzi do score)

**Pytanie przewodnie:** Czy właściciel, patrząc na własną stronę, może poczuć, że przestała reprezentować jego kancelarię?

Oceniaj **wyłącznie ze screenshotów** (`screenshot-desktop.png` + `screenshot-mobile.png` — **oraz kafelki `-2`, `-3`, jeśli są w katalogu; otwórz wszystkie**, bo długie strony są cięte i pierwszy plik pokazuje tylko początek) — nie z danych scrapera. Wynik zapisz w `audyt-dane.json` jako pole `ocenaWizualna` i w trackerze jako `priorytet_wizualny`.

**Czego tu NIE oceniasz:** LCP, HTTPS, CTA, SEO, H1, JSON-LD, Core Web Vitals — to już jest w score (8 wymiarów niżej). Ocena wizualna = wyłącznie to, co widać na screenshocie oczami klienta.

### 5 wymiarów wizualnych — każdy: ✅ OK / 🟡 do sprawdzenia / 🔴 problem

| # | Wymiar | Co oceniasz | Przykłady 🔴 |
|---|---|---|---|
| 1 | **Aktualność designu** | Czy strona wygląda współcześnie? | wąska kolumna ~960 px w ramce, teksturowane/kafelkowe tło, **fotorealistyczny skeuomorfizm (drewniane biurko, skóra, papier)**, gradientowe przyciski, bevel/3D, stary slider na całą szerokość, **dekoracyjna kursywa/skrypt na sentencję-motto**, **duotone/kolorowy filtr na hero + filigranowe ornamenty wokół nagłówków**, **„brak systemu designu" — justowany serif + podkreślone niebieskie linki, dokument wklejony w HTML** |
| 2 | **Pierwsze wrażenie** | Co klient widzi w 5 sekund? | łacińska sentencja zamiast oferty, brak specjalizacji w hero, puste/nijakie hero |
| 3 | **Spójność marki** | Czy wszystko wygląda jak jedna marka? | wyłącznie stockowe zdjęcia/clipart, mieszane fonty, przypadkowe kolory |
| 4 | **Wiarygodność** | Czy coś obniża zaufanie? | © z dawnym rokiem, komunikaty błędów serwera, Google Sites/darmowy kreator, „PRZERWA TECHNICZNA", niedziałające elementy, opinie-atrapy („Jan Kowalski") |
| 5 | **Świeżość treści** | Czy widać oznaki życia? | ostatni wpis bloga sprzed lat, nieaktualne informacje, puste sekcje, **data wtopiona w grafikę/skan (np. „…2010 r." na obrazku pisma)** |

**Aktualna treść nie znaczy aktualny design.** Stopka z bieżącym rokiem i świeże wpisy mówią
o wymiarze 5 (Świeżość treści), a nie o wymiarze 1. Strona pilnie aktualizowana, która nadal jest
ścianą tekstu bez zdjęć, siatki i przycisków, ma 🔴 w Aktualności designu — „brak systemu designu"
jest markerem starości nawet bez ani jednej starej daty (przypadek `lukaszmichalik.pl`, 2026-08-30:
stopka do 2025, a strona to bloki tekstu na granatowym tle, bez CTA).

Wymiar 4 potrafi dać 🔴 na stronie, która wygląda nowocześnie (np. błędy serwera na świeżym szablonie) — w mailu opisz wtedy konkretny błąd/zaniedbanie, **nie sugeruj, że strona jest stara**, bo właściciel od razu zobaczy, że to nieprawda.

**Nie myl zaniedbania całej strony z pojedynczym niedokończonym elementem.** Jedna pusta sekcja (akordeon bez rozwiniętej treści, nieużywana zakładka bloga) na stronie, która poza tym ma nowoczesny hero, realne zdjęcia i spójną markę, to **🟡, nie 🔴** — to drobne niedopracowanie wykonawcze, nie sygnał „ta strona przestała reprezentować kancelarię". 🔴 w Wiarygodności/Świeżości treści zarezerwuj dla sygnałów, które dotyczą **całej strony**: błąd wypisany na stronie, martwa platforma, jawnie stara data, albo **kilka** takich drobiazgów naraz (nie jeden).

### Markery epoki (pomocnicze przy wymiarach 1 i 4)

**Stary design:** Google Sites · WordPress z motywem 2012–2016 (np. templatemo) · **widoczny kredyt darmowego/nieprzerobionego szablonu w stopce** (np. „templatemo.com / CC BY 3.0", „Wykonanie: …") · teksturowe tła · **fotorealistyczny skeuomorfizm — drewniane biurko, skóra, papier, młotek/koperta jako grafiki** · gradientowe przyciski · slider na całą szerokość · **duotone/kolorowy filtr na zdjęcie hero** · **filigranowe/ornamentowe dividery wokół nagłówków** · **dekoracyjna kursywa/skrypt na łacińskie sentencje** · chmura tagów · licznik odwiedzin · ikony 3D · układ tabelaryczny · wąska kolumna ~960 px · mikroskopijny tekst bez oddechu · **data wtopiona w grafikę** · **„brak systemu designu" — justowany serif, domyślnie niebieskie podkreślone linki, małe wklejone zdjęcia (strona wygląda jak dokument Word w HTML — sygnał starszy niż zła templatka)**.

**Nowoczesny design:** dużo białej przestrzeni · czytelna typografia · proste hero · wyraźna specjalizacja od wejścia · współczesne, realne zdjęcia · spójna kolorystyka.

### Werdykt (`priorytet_wizualny`) — zawsze z powodami

| Werdykt | Reguła | Znaczenie dla outreachu |
|---|---|---|
| `wysoki` | ≥2 wymiary 🔴, LUB 1 🔴 w Aktualności designu z mocnym markerem (jawna stara data, layout sprzed ~2012, darmowa platforma) | najlepszy kandydat — właściciel sam zobaczy problem |
| `sredni` | 1 wymiar 🔴, LUB ≥3 wymiary 🟡 | pisać, ale hak musi być bardzo konkretny |
| `niski` | brak 🔴, najwyżej 2 🟡 | odpuścić lub koniec kolejki — mała szansa, że właściciel poczuje potrzebę zmiany |
| `do sprawdzenia` | screenshot nie pozwala ocenić (przerwa techniczna, błąd zrzutu) | wrócić przed wysyłką |

**Kontrola zdroworozsądkowa przed zapisaniem werdyktu:** jeśli hero, zdjęcia i spójność marki są ✅, a jedyny problem to pojedynczy drobiazg (pusta sekcja, nieużywany blog) — to `niski`, nawet jeśli formalnie wychodzi 1-2 🟡. Reguła w tabeli to podłoga, nie automat: zapytaj się „czy właściciel, patrząc na TĘ stronę, uzna że wygląda nowocześnie i tylko coś drobnego jest niedopracowane, czy że strona go nie reprezentuje?" — w pierwszym przypadku zawsze `niski`, bez względu na formalne liczenie.

Pod werdyktem **wypisz markery, które o nim zadecydowały** — to z nich powstaje obserwacja do maila 1. Format:

```
Ocena wizualna: 🔴 wysoki priorytet
1. Aktualność designu:  🔴
2. Pierwsze wrażenie:   🟡
3. Spójność marki:      ✅
4. Wiarygodność:        🔴
5. Świeżość treści:     🔴
Markery: ©2017 w stopce · teksturowane tło · wąska ramka · ostatni wpis 2019
```

### Zastrzeżenia (żeby nie oceniać niesprawiedliwie)

- **Screenshot to jedna klatka.** Puste sekcje mogą być artefaktem lazy-loadingu przy zrzucie — jeśli werdykt (zwłaszcza wymiar 5) zależy od „pustej sekcji", sprawdź stronę na żywo, zanim to napiszesz w mailu.
- **Sprawdź też mobile.** Stare strony najbardziej rozjeżdżają się na telefonie — desktop potrafi maskować wiek.
- Baner cookies na zrzucie to nie zarzut — każdy go ma.

---

## Ocena leada — 4 wymiary, 0–8 (kwalifikacja wewnętrzna, poza score)

**To nie jest ocena strony — to ocena szansy sprzedaży.** Zapisywana w trackerze jako
`scoring_0_8` + `decyzja`. **Nigdy nie trafia do `mail-observation.txt` ani do maila** — odbiorca
nie ma wiedzieć, że go punktujemy.

**Trzy niezależne warstwy — nigdy nie myl ich w rozmowie ani w raporcie:**

1. `priorytet_wizualny` (Krok 0) — jak strona **wygląda** oczami klienta. Nie wchodzi do score.
2. `score_audytu_0_100` + `tier_audytu` — jakość/kompletność strony pod kątem konwersji (8 wymiarów niżej). To NIE jest prawdopodobieństwo zakupu — nigdy nie pisz gołego „score" bez podania skali (0–100 vs 0–8), bo to dwie różne liczby.
3. `kwalifikacja_leada.scoring_0_8` (ten rozdział) — szansa sprzedaży (A/B/C/D).

**Niski `score_audytu_0_100` NIE oznacza automatycznie dobrego leada** — strona może być słaba technicznie, a kancelaria mimo to nie mieć budżetu ani powodu do kontaktu (0–4/8). I odwrotnie: solidna strona (score 70+) może mieć jeden bardzo konkretny, świeży powód do kontaktu i wysoki scoring 0–8.

**Podział odpowiedzialności (patrz SKILL.md → Krok 6):** Claude kończy na kwalifikacji i krótkiej, faktograficznej `obserwacja_do_maila` — nie pisze tematu ani treści maila M1/FU1/FU2, nie tworzy szkicu Gmail, nie wysyła i nie aktualizuje Trackera. To robi druga automatyzacja (ChatGPT) po przejęciu rekordu z zakładki `Claude_import`. Kanoniczny szablon pól: `reference/schemat-audyt-dane.json`; walidacja przed przekazaniem dalej: `node scripts/validate-lead.js <domena>`.

**Pytanie przewodnie:** czy właściciel tej kancelarii ma widoczny, biznesowo uzasadniony powód,
żeby zapłacić **4 500–6 500 zł** za nową stronę?

Nie szukamy dowolnych błędów. Strona nie dostaje wysokiej oceny za to, że wygląda staro —
`priorytet_wizualny` z Kroku 0 jest **materiałem** do wymiaru A, a nie samym A.

### Kolejność pracy

Oceniaj z danych scrapera i zrzutów, nie z pamięci — kolejno:
`screenshot-desktop.png` + `screenshot-mobile.png` (+ kafelki `-2`, `-3`) → `content.json` (hero, kontakt, `ageSignals`)
→ `servicesPage` → `teamPage` → `newsPage` → `vitals.json`. Fakty oddzielaj od przypuszczeń:
pole puste w danych to „nie wiem", nie „nie ma".

### Wymiary

| | Wymiar | 0 | 1 | 2 |
|---|---|---|---|---|
| **A** | **Potrzeba przebudowy** | tylko kosmetyka | widoczne niedoskonałości | wyraźna potrzeba nowej strony |
| **B** | **Potencjał finansowy** | brak jakichkolwiek sygnałów, że ktoś tu wydaje pieniądze na obecność | działająca praktyka bez widocznych wydatków na markę | co najmniej jeden konkretny wydatek na obecność: własny lokal, płatna akwizycja, obsługa firm, rekrutacja, płatne narzędzia na stronie, kilka lokalizacji, długi staż |
| **C** | **Skala możliwej poprawy** | niewielka | umiarkowana | duża i łatwa do pokazania |
| **D** | **Naturalny powód do kontaktu** | trzeba go wymyślać | istnieje, ale przeciętny | konkretny, prawdziwy i charakterystyczny |

Skąd brać dane do każdego wymiaru:

| Wymiar | Główne źródło | Uwaga |
|---|---|---|
| A | `priorytet_wizualny` (Krok 0) + `ageSignals` + `vitals.mobileFriendly` | `wysoki` ≈ A2, `sredni` ≈ A1, `niski` ≈ A0. To punkt wyjścia, nie automat |
| B | wydatki widoczne w treści i profilu: własne biuro, staż, płatna akwizycja, rekrutacja, obsługa firm, płatne narzędzia (płatności online, rezerwacja terminu), `teamPage.locationCount` | **`teamPage.lawyerCount` NIE jest tu kryterium — patrz „Wielkość zespołu" niżej.** Poza tym najsłabiej widoczny wymiar — bez `teamPage` częściej będzie 0/1 niż realne 2. `lead-info.json` → `google_maps` (`totalScore`, `reviewsCount`) to sygnał **pomocniczy** — dużo opinii/wysoka ocena mogą wskazywać ugruntowaną kancelarię, ale to KONTEKST biznesowy, nie dowód budżetu; nigdy nie podbijaj B samym Google Maps bez potwierdzenia z `teamPage`/`servicesPage` — **z wyjątkiem klauzuli braku dowodu, patrz niżej** |
| C | różnica między tym, czym kancelaria jest (B), a tym, co pokazuje strona (A) | „łatwa do pokazania" = dasz się to opisać w jednym zdaniu maila |
| D | `newsPage.lastPostDate`, konkretny błąd ze zrzutu, `servicesPage` vs hero | jeśli powód brzmi jak szablon — to jest 0, nie 1 |

**A i C są skorelowane** (duża potrzeba ≈ duża poprawa) — to normalne i zamierzone. Praktyczny
skutek: 7 pkt oznacza w praktyce A2 + C2 + B2 + D≥1, czyli **rozbudowaną kancelarię ze słabą
stroną**. Spodziewaj się kilku procent trafień na paczkę.

**Skala 0–8 nie ma czterech niezależnych wymiarów — ma trzy.** A i C mierzą w praktyce tę samą
obserwację (stan strony wobec stanu kancelarii) i dają razem do 4 z 8 punktów, więc pozorna
granularność skali jest wyższa niż realna. Niezależne osie to: **potrzeba (A+C) · pieniądze (B) ·
hak (D)**. Pamiętaj o tym, czytając sumę — 6/8 zbudowane z A2+C2+B1+D1 to zupełnie inny przypadek
niż 6/8 z A1+C1+B2+D2, mimo identycznej liczby.

---

### Wielkość zespołu nie jest kryterium B

**Decyzja właściciela produktu, 2026-08-30.** Jednoosobowa kancelaria **nie jest gorszym leadem** —
`teamPage.lawyerCount = 1` (albo brak `teamPage`) nie obniża B i nigdy nie jest samodzielnym
uzasadnieniem oceny. Adwokat prowadzący praktykę solo od kilkunastu lat, z własnym biurem i
płatnym pozycjonowaniem, ma budżet na stronę; kancelaria z pięcioma nazwiskami na podstronie
może go nie mieć.

**Powód zmiany:** na paczce 15 stron `priorytet_wizualny: wysoki` (Sosnowiec, Częstochowa, Zabrze,
Dąbrowa Górnicza) średnie B wyniosło 1,07 przy średnim A 1,53. Jedenaście z piętnastu firm dostało
B=0–1, a w uzasadnieniach wracała ta sama formuła: „solo praktyka bez sygnałów skali". Wymiar B
nie mierzył wtedy budżetu — mierzył liczbę prawników, czyli rzecz, która z budżetem nie musi mieć
związku. Siedem firm utknęło przez to na 5–6/8 mimo wyraźnie starej strony.

**Czym B jest zamiast tego:** pytaniem „czy ta kancelaria wydaje pieniądze na swoją obecność?".
Każdy z poniższych to konkretny wydatek i wystarcza na B=2, jeśli jest widoczny w danych:
- własny lokal/biuro (adres inny niż mieszkanie, zdjęcie wnętrza kancelarii)
- płatna akwizycja klientów (Google Ads, pozycjonowanie, płatne wizytówki w katalogach)
- obsługa firm / stała obsługa prawna wymieniona w ofercie
- rekrutacja (nabór aplikanta, ogłoszenie o pracę) — ktoś planuje rosnąć
- płatne narzędzia na stronie (płatności online, system rezerwacji terminu, chat)
- kilka lokalizacji lub kilka wizytówek Google
- długi staż praktyki (≥10 lat) przy utrzymywanej, opłacanej domenie

B=0 zostaw dla sytuacji, w której naprawdę nic nie wskazuje na wydatki: darmowa platforma,
brak własnej domeny, brak jakiegokolwiek śladu płatnej obecności.

**Czego nie wolno napisać w `uzasadnienie` wymiaru B:** „kancelaria jednoosobowa", „solo praktyka",
„brak zespołu", „brak sygnałów skali" — jako powodu obniżenia oceny. Jeśli obniżasz B, napisz,
jakiego **wydatku** zabrakło, nie ilu ludzi.

**Priorytet przy sprzeczności:** najważniejszy sygnał to stan wizualny strony (Krok 0). Jeśli
strona jest wyraźnie słaba wizualnie, a B jest niepewne — dokumentuj niepewność w `uzasadnienie`,
nie karz nią leada.

### Klauzula braku dowodu (B przy nieobecnej lub zepsutej stronie)

**Problem, który ta klauzula naprawia:** B czerpie dowody ze strony internetowej (`teamPage`,
`servicesPage`), czyli z tego samego artefaktu, który oceniamy. Im gorsza strona, tym mniej
dowodów na B — a ponieważ w praktyce **B jest bramką całej kwalifikacji** (bez B2 prawie nic nie
dobija do 7), system systematycznie odrzucał najlepszych kandydatów: firmy, których strona jest
tak słaba, że ukrywa ich realną wielkość. Zweryfikowane empirycznie na paczkach Katowice+Gliwice:
spośród leadów z A2 tylko te, u których dowód na B **przetrwał poza stroną**, dobiły do B2.

**Reguła:** jeśli `priorytet_wizualny` = `wysoki` **z powodu braku strony, jej awarii albo
skrajnego ubóstwa treści** (brak `teamPage` i `servicesPage` nie dlatego, że kancelaria jest mała,
tylko dlatego, że nie ma czego czytać) — oceniaj B **wyłącznie z dowodów pozastronowych**.
Standardowy zakaz „nie podbijaj B samym Google Maps" **nie obowiązuje**, bo nie istnieje
alternatywne źródło, którego miałby wymagać.

Dowody pozastronowe dopuszczalne w tym trybie:
- `google_maps.reviewsCount` + `totalScore` — wysoka liczba opinii przy dobrej ocenie to realny,
  długo budowany strumień klientów
- **płatna akwizycja klientów** (patrz „Mocne sygnały" niżej)
- weryfikacja rejestrowa (GUS, „Sprawdzona Firma" i podobne znaki na portalach)
- staż działalności podany w profilu zewnętrznym
- liczba lokalizacji wynikająca z wizytówek Google, nie ze strony

W `uzasadnienie` wymiaru B **zawsze napisz wprost, że zastosowano klauzulę braku dowodu** i z czego
konkretnie oceniłeś B — żeby przy audycie decyzji było widać, że to nie było podbicie na siłę.

### Werdykt

| Suma | `decyzja` | Co robimy |
|---|---|---|
| **7–8** | `PISAĆ` | rodzynek → zapis do `Claude_import` |
| 5–6 | — | **nie zapisujemy do arkusza**; loguj lokalnie w `output/odrzucone.csv`, żeby nie audytować drugi raz |
| 0–4 | `ODPUŚCIĆ` | tylko log lokalny |

**Próg 7 zostaje twardy — nie ma ścieżki omijającej B.** Rozważana była reguła „6 punktów przy
A2+C2 kwalifikuje mimo B1", ale została odrzucona świadomie: po zastosowaniu klauzuli braku dowodu
B1 oznacza już „sprawdziliśmy wszystkie dostępne źródła i to jest realnie mała kancelaria" — a to
jest dokładnie ten przypadek, który wymiar B ma odsiewać przy produkcie za 4 500–6 500 zł.
Właściwą naprawą zaniżonego B jest klauzula braku dowodu (uzupełnia brakujące dane), nie obniżenie
progu (ignoruje dane prawdziwe). Próg 7–8 jest też zakodowany w `validate-lead.js`,
`push-import.js` i `sheets/Code.gs` — zmiana wymagałaby ręcznego przewdrożenia webhooka Apps
Script.

Format zapisu pod werdyktem — zawsze z rozbiciem, bo z niego widać, czy 7 nie powstało z natęgi:

```
Ocena leada: 7/8 → PISAĆ
A. Potrzeba przebudowy:   2  (Google Sites, brak mobile)
B. Potencjał finansowy:   2  (4 prawników, obsługa firm, 2 lokalizacje)
C. Skala poprawy:         2  (zespół i oferta w ogóle niewidoczne)
D. Powód do kontaktu:     1  (ostatni wpis 2019 — prawdziwy, ale przeciętny)
```

### Mocne sygnały (podbijają B i C)

Rozbudowana kancelaria z bardzo słabą witryną · strona wyraźnie odstaje od poziomu kancelarii ·
istotne usługi trudne do znalezienia · realne błędy techniczne · strona źle działa na telefonie ·
profesjonalne zdjęcia lub identyfikacja zmarnowane przez słaby projekt · nieczytelna prezentacja
zespołu lub specjalizacji · kancelaria obsługuje firmy / ma zespół / kilka lokalizacji, ale strona
tego nie komunikuje.

**Płatna akwizycja klientów — mocny sygnał B.** Obecność w płatnym katalogu/marketplace leadów
(Oferteo, Fixly, płatne wizytówki branżowe), widoczne reklamy Google Ads, opłacone pozycjonowanie.
To **bezpośredni dowód, że kancelaria wydaje pieniądze na pozyskiwanie klientów** — mocniejszy
predyktor budżetu na stronę niż wielkość zespołu, bo dotyczy wprost gotowości do płacenia za
akwizycję, a nie tylko skali działalności. Szczególnie ważne przy klauzuli braku dowodu: firma bez
własnej strony, która płaci za leady w katalogu, ma **potwierdzony budżet marketingowy i brak
produktu, na który mogłaby go kierować**.

### Słabe sygnały — NIE wystarczają (to jest `co_jest_kosmetyka`)

Stary copyright · przeciętne ikony · sam wiek strony · jeden kolor lub zdjęcie stockowe · dużo
pustego miejsca · drobna typografia · brak „nowoczesnego wyglądu" · ciekawy cytat · pojedynczy
kosmetyczny problem.

Te rzeczy **wypisz w polu `co_jest_kosmetyka`** — to lista, której drugi asystent **nie ma prawa**
użyć jako argumentu sprzedażowego. Sam stary copyright nie daje A2. Jeśli po odjęciu kosmetyki
nie zostaje nic — to nie jest lead.

### Brak danych

Strona niedostępna albo widziałeś tylko fragment → **nie oznaczaj jako PISAĆ**. W raporcie:
`OCENA WSTĘPNA — ZA MAŁO DANYCH`. Nie uzupełniaj pól przypuszczeniami i nie wymyślaj danych
kontaktowych — puste pole jest lepsze niż zgadnięte.

**Nie myl „braku danych" z „klauzulą braku dowodu" (wyżej)** — to dwie różne sytuacje:

| | Co się stało | Werdykt |
|---|---|---|
| **Brak danych** | *nie wiemy, co tam jest* — scrape padł, timeout, błąd certyfikatu, zawieszone konto hostingu, widzieliśmy tylko fragment | `OCENA WSTĘPNA — ZA MAŁO DANYCH`, nie oceniaj, nie zapisuj nigdzie |
| **Klauzula braku dowodu** | *wiemy, i to jest właśnie ustalenie* — potwierdziliśmy, że kancelaria nie ma własnej strony (jest tylko profil w katalogu), strona działa, ale jest skrajnie uboga, albo działa z trwale zepsutymi podstronami | normalna kwalifikacja, B z dowodów pozastronowych |

Test rozstrzygający: **czy potrafisz napisać zdanie o tym, co odwiedzający realnie zobaczy?**
Jeśli tak („trafia na profil w Oferteo zamiast na stronę kancelarii") — to ustalenie, oceniaj
normalnie. Jeśli nie („nie wiadomo, czy strona istnieje — hosting zawieszony") — to brak danych.

Przy stanach tymczasowych z natury (zawieszone konto, wygasły certyfikat, awaria serwera) domyślnie
wybieraj **brak danych** i wróć później — mogą zniknąć same.

### Zasada końcowa

**Lepiej nie zapisać średniego leada niż stworzyć sztuczny argument sprzedażowy.**
Do `Claude_import` trafiają wyłącznie wyjątkowo mocne, nowe przypadki.

---

## 1. Jasność specjalizacji (waga 15)

**Pytanie:** Czy klient w ciągu kilkunastu sekund wie, czym zajmuje się kancelaria i czy pasuje do jego sprawy?

| Status | Kryterium |
|---|---|
| ✅ 15 | Specjalizacja konkretna i widoczna w H1/hero strony głównej (np. „prawo rodzinne", nie „usługi prawne") |
| ⚠️ 7 | Specjalizacja jest konkretna, ale schowana o klik dalej (podstrona „Zakres usług"), a hero to ogólnik/sentencja |
| ❌ 0 | Brak konkretu nawet na podstronie usług — „kompleksowa obsługa prawna" bez nazwanych dziedzin |

Sprawdź **dwa** źródła, nie tylko stronę główną:
1. `content.json` → `h1`, pierwsze `headings.h2` — co widać w hero.
2. `content.json` → `servicesPage` — podstronę usług scraper **dociąga automatycznie**:
   - `servicesPage.found = true` i `practiceAreaCount ≥ 3` (np. `["prawo karne","prawo rodzinne","prawo spadkowe"]`) → specjalizacja **JEST** konkretna. Hero ją pokazuje → ✅; tylko podstrona, hero ogólny → **⚠️ 7 (nie ❌)**.
   - `servicesPage.found = false` lub `practiceAreaCount = 0`, a hero ogólny → ❌.

⚠️ **Nigdy nie oceniaj „brak specjalizacji" po samej stronie głównej.** Hero z sentencją łacińską ≠ brak specjalizacji, gdy podstrona wymienia kilkanaście dziedzin. Jeśli `servicesPage.found = false` — zanim wpiszesz ❌, sprawdź podstronę ręcznie (WebFetch).

---

## 2. CTA i ścieżka do kontaktu (waga 20)

**Pytanie:** Czy jest wyraźne, pojedyncze wezwanie do działania i czy kontakt jest łatwy?

| Status | Kryterium |
|---|---|
| ✅ 20 | Wyraźne CTA w hero + kontakt dostępny w ≤1 kliknięcie + jasna ścieżka |
| ⚠️ 10 | CTA istnieje, ale słabe/niejasne, albo kontakt wymaga szukania |
| ❌ 0 | Brak CTA lub kontakt tylko w stopce |

Sprawdź: `content.json` → `ctaCount` (mocne CTA z intencją konwersji), `genericCtaCount` (słabe CTA typu „Kliknij tutaj"), `hasForm`, `phone`, `email`.
- `ctaCount` > 0 → mocne CTA istnieje (kandydat na ✅, jeśli w hero i kontakt łatwy).
- `ctaCount` = 0, ale `genericCtaCount` > 0 → CTA jest, lecz słabe/niejasne → **⚠️ 10** (odróżnia „słabe" od „brak").
- `ctaCount` = 0 i `genericCtaCount` = 0 → brak CTA → **❌ 0** (nawet jeśli `phone`/`email` są w stopce).

Benchmark: tylko 6/21 kancelarii ma CTA w hero — to łatwy wyróżnik.

---

## 3. Szybkość i wydajność (waga 15)

**Pytanie:** Czy strona ładuje się szybko, szczególnie na telefonie?

| Status | Kryterium |
|---|---|
| ✅ 15 | LCP < 2,5s, performance score > 80 |
| ⚠️ 7 | LCP 2,5–4s lub score 50–80 |
| ❌ 0 | LCP > 4s lub score < 50 |

Sprawdź: `vitals.json` → `lcp`, `performanceScore`. Jeśli brak pomiaru — oznacz „niedostępne", nie zgaduj.

---

## 4. Mobile (waga 10)

**Pytanie:** Czy strona działa poprawnie na telefonie? 73% klientów szuka prawnika mobilnie.

| Status | Kryterium |
|---|---|
| ✅ 10 | Responsywna, czytelna, CTA dostępne na mobile |
| ⚠️ 5 | Działa, ale z problemami (drobny tekst, trudny kontakt) |
| ❌ 0 | Nieresponsywna lub poważne błędy układu |

Sprawdź: `screenshot-mobile.png` (+ `screenshot-mobile-2.png`) + `vitals.json` → `mobileFriendly`.

---

## 5. Struktura treści (waga 10)

**Pytanie:** Czy treść jest uporządkowana nagłówkami, czy to ściana tekstu? (Ważne też dla Google Gemini.)

| Status | Kryterium |
|---|---|
| ✅ 10 | Jasna hierarchia H1→H2→H3, krótkie akapity, listy |
| ⚠️ 5 | Częściowa struktura, miejscami długie bloki |
| ❌ 0 | Ściana tekstu bez nagłówków |

Sprawdź: `content.json` → `headings` (liczba i hierarchia).

---

## 6. Sygnały zaufania (waga 15)

**Pytanie:** Czy strona buduje wiarygodność — opinie, doświadczenie, zespół, realizacje?

| Status | Kryterium |
|---|---|
| ✅ 15 | ≥2 sygnały: opinie z nazwiskiem, lata doświadczenia, zespół, konkretne liczby |
| ⚠️ 7 | 1 sygnał lub ogólne deklaracje bez dowodu |
| ❌ 0 | Brak sygnałów zaufania |

Sprawdź: `content.json` → `trustSignals` (`testimonials`, `yearsExperience`, `numbers`, `team`) oraz `trustSignals.count`; dodatkowo `headings` (sekcja „Opinie"/„Zespół") i screenshot.
- `trustSignals.count` ≥ 2 → **✅ 15**
- `trustSignals.count` = 1 (np. jedna opinia bez nazwiska) → **⚠️ 7**
- `trustSignals.count` = 0 → **❌ 0**

Benchmark: trust signals są słabe w całej branży — łatwy zysk.

---

## 7. SEO techniczne (waga 10)

**Pytanie:** Czy strona ma podstawy do indeksacji i prezentacji w Google?

| Status | Kryterium |
|---|---|
| ✅ 10 | Meta title + description, jeden H1, HTTPS, dane strukturalne (JSON-LD) |
| ⚠️ 5 | Część obecna (np. title jest, brak description lub schema) |
| ❌ 0 | Brak meta, brak H1 lub brak HTTPS |

Sprawdź: `content.json` → `metaTitle`, `metaDescription`, `h1`; `vitals.json` → `https`, `hasStructuredData`.

---

## 8. Komunikacja i etyka zawodowa (waga 5)

**Pytanie:** Czy język jest dopasowany do klienta i zgodny z zasadami informowania o zawodzie?

| Status | Kryterium |
|---|---|
| ✅ 5 | Język klarowny, bez żargonu, bez zwrotów wartościujących („najlepszy"), bez obietnic wyniku |
| ⚠️ 2 | Miejscami żargon lub zwroty na granicy etyki |
| ❌ 0 | Żargon prawniczy bez wyjaśnień lub reklama porównawcza/obietnice |

Sprawdź: `content.json` → `messagingSamples`, szukaj „najlepsza", „gwarantujemy wygraną", „nr 1".

---

## Wyliczenie score

Suma punktów z 8 wymiarów = score 0–100.

| Score | Tier | Interpretacja |
|---|---|---|
| 80–100 | Wysoki | Strona konwertuje dobrze, drobne usprawnienia |
| 55–79 | Średni | Solidna baza, kilka realnych luk (większość rynku tu jest — mediana benchmarku to 60) |
| 30–54 | Niski | Poważne braki konwersji, duży potencjał poprawy |
| 0–29 | Krytyczny | Strona ma liczne braki utrudniające kontakt i budowę zaufania |

Przy każdym audycie podaj score i tier, oraz porównanie do mediany benchmarku (60/100).

---

## Mapa wysiłek/efekt

Każda rekomendacja w raporcie („Jak bym to rozwiązał") dostaje oznaczenie **wysiłku** (ile pracy po stronie kancelarii) i **efektu** (jak mocno ruszy konwersję/SEO) wg tej tabeli. Cel: zamienić audyt z „masz problemy" w „masz **tanie** do naprawienia problemy o **wysokim** zwrocie".

| Poprawka | Wymiar | Wysiłek | Efekt |
|---|---|---|---|
| `<meta name="viewport">` (mobile) | 4 | 1 linijka kodu | natychmiastowy, wysoki |
| HTTPS / certyfikat SSL | 7 | 1 wieczór (hosting) | natychmiastowy, wysoki |
| Dodanie / poprawa H1 | 1, 7 | 1 linijka kodu | szybki, średni–wysoki |
| Meta description | 7 | 15 minut | szybki, średni (CTR w Google) |
| Zmiana tekstu CTA (np. „Umów konsultację") | 2 | kilka godzin | szybki, wysoki |
| Kompresja obrazów / WebP + lazy-load | 3 | kilka godzin | szybki, wysoki (LCP) |
| JSON-LD (schema `LegalService`/`Attorney`) | 7 | kilka godzin | średni, długoterminowy (SEO) |
| Podział treści na H2/H3 + krótkie akapity | 5 | 1 dzień | średni |
| Formularz kontaktowy na stronie głównej | 2 | 1 dzień | średni–wysoki |
| Specjalizacja w hero (copy + układ) | 1 | 1 dzień | wysoki |
| Sygnały zaufania (opinie z nazwiskiem, lata, zespół) | 6 | kilka dni (zbiór od klienta) | wysoki, długoterminowy |
| Przebudowa na responsywny szablon | 3, 4, 5 | przebudowa (tygodnie) | wysoki, ale kosztowny |

**Reguła kolejności:** w raporcie listuj najpierw poprawki z górnych wierszy (tanie + wysoki efekt), na końcu kosztowne przebudowy. Jeśli rekomendacja nie pasuje do żadnego wiersza, dobierz najbliższy wysiłek/efekt i oznacz analogicznie — nie zostawiaj rekomendacji bez tej pary.

