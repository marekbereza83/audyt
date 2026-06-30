# Kryteria audytu — system FORMA

8 wymiarów oceny strony kancelarii pod kątem konwersji. Każdy ma wagę i sposób punktowania. Suma daje score 0–100.

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
