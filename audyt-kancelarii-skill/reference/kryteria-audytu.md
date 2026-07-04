# Kryteria audytu — system FORMA

8 wymiarów oceny strony kancelarii pod kątem konwersji. Każdy ma wagę i sposób punktowania. Suma daje score 0–100.

**Ocena wizualna (sekcja poniżej) jest nadrzędna wobec 8 wymiarów, choć nie wchodzi do score.** Kancelaria decyduje się na nową stronę, bo obecna *wygląda* staro — nie dlatego, że nagłówek jest w złym miejscu. Wizualny werdykt otwiera raport i jest pierwszym źródłem obserwacji do cold maila; 8 wymiarów dostarcza mierzalnego uzasadnienia i materiału na rozmowę po odpowiedzi.

---

## Krok 0 — Ocena wizualna (nie wchodzi do score)

**Pytanie:** Czy strona *wygląda* na aktualną i zadbaną — oczami klienta, w pierwszych sekundach, zanim cokolwiek przeczyta?

Oceniaj **wyłącznie ze screenshotów** (`screenshot-desktop.png` + `screenshot-mobile.png`) — nie z danych scrapera. Otwórz oba zrzuty i przejdź przez checklistę. Wynik zapisz w `audyt-dane.json` jako pole `ocenaWizualna` i w trackerze jako `priorytet_wizualny`.

### Dwie osobne osie — nie mieszaj ich

1. **Wygląd przestarzały** — strona wygląda na starą (to jest główny sygnał zakupowy dla FORMA).
2. **Zaniedbanie techniczne** — strona może wyglądać nowocześnie, ale ma widoczne błędy (np. komunikaty serwera, puste sekcje). To inny argument w rozmowie — odnotuj osobno, nie podnoś nim werdyktu „przestarzała".

### Checklista — wygląd przestarzały

| Sygnał | Na co patrzeć |
|---|---|
| Markery epoki designu | wąski layout w ramce na kafelkowym/teksturowanym tle, twarde cienie, przyciski-zakładki, gradienty 3D → ~2008–2012; pełnoekranowe hero + grid + duża typografia → współczesne |
| Jawne daty | rok copyright w stopce, daty wpisów na blogu, „Designed by …" — cytowalny dowód wieku |
| Platforma | Google Sites / darmowy kreator = brak własnej strony; stary szablon (np. templatemo) |
| Zdjęcia | prawdziwe fotografie prawników/kancelarii = inwestycja; wyłącznie stock/clipart/ikonki = szablon bez personalizacji |
| Przestarzałe praktyki | chmura słów kluczowych SEO, licznik odwiedzin, sentencja łacińska jako jedyny przekaz hero |
| Gęstość i typografia | mikroskopijny tekst, ściana treści bez oddechu, systemowe fonty z epoki |

### Checklista — zaniedbanie techniczne (osobna notatka)

| Sygnał | Przykład |
|---|---|
| Błędy wypisane na stronie | komunikaty PHP/serwera („Disk quota exceeded"), błędy sesji |
| Treści-atrapy | opinie „Jan Kowalski", lorem ipsum, pusta mapa, pusta sekcja |
| Elementy zepsute | baner cookies zasłaniający treść, niedziałający slider, strona w trybie konserwacji |

### Zastrzeżenia (żeby nie oceniać niesprawiedliwie)

- **Screenshot to jedna klatka.** Puste sekcje mogą być artefaktem lazy-loadingu przy zrzucie — jeśli werdykt zależy od „pustej sekcji", sprawdź stronę na żywo zanim to napiszesz w mailu.
- **Sprawdź też mobile.** Stare strony najbardziej rozjeżdżają się na telefonie — desktop potrafi maskować wiek.
- Baner cookies na zrzucie to nie zarzut — każdy go ma.

### Werdykt

| `priorytet_wizualny` | Kryterium | Znaczenie dla outreachu |
|---|---|---|
| `wysoki` | ≥2 sygnały przestarzałości LUB 1 mocny (jawna stara data, layout sprzed ~2012, darmowa platforma) | najlepszy kandydat na cold mail — właściciel sam zobaczy problem |
| `sredni` | pojedyncze słabsze sygnały, strona „poprawna ale bez inwestycji" | pisać, ale hak musi być bardzo konkretny |
| `niski` | strona wygląda współcześnie i zadbanie | odpuścić lub na koniec kolejki — mała szansa, że właściciel poczuje potrzebę zmiany |
| `do sprawdzenia` | screenshot nie pozwala ocenić (przerwa techniczna, błąd zrzutu) | wrócić przed wysyłką |

Do werdyktu dopisz **2–3 zdania uzasadnienia z konkretami ze screenshota** (co dokładnie widać i gdzie) — to z nich powstaje obserwacja do maila 1.

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

Sprawdź: `screenshot-mobile.png` + `vitals.json` → `mobileFriendly`.

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
| 0–29 | Krytyczny | Strona aktywnie traci klientów |

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

