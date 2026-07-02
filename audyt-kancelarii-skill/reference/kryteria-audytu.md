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

---

## Ocena leada (warstwa biznesowa — dla FORMA, nie dla kancelarii)

Po ocenie 8 wymiarów odpowiedz na jedno pytanie: **czy warto poświęcić czas na przygotowanie spersonalizowanego maila z ofertą nowej strony?** To **wewnętrzna kwalifikacja** — trafia do `audyt.md` i `audyt-dane.json`, **nigdy do `mail-fragment.txt` ani `mail.txt`**.

Pytanie nie brzmi „czy ta strona jest dobra?" — brzmi: **„czy właściciel tej kancelarii ma motywację, budżet i uzasadnienie biznesowe, aby zainwestować w nową stronę?"**

Masz dwie opcje:

### 🟢 PISZ (`werdykt: "pisz"`)

Przyznaj, jeżeli większość poniższych warunków jest spełniona:
- kancelaria ma wysoki potencjał biznesowy (specjalizacja, zespół, miasto, obsługa firm),
- widać wyraźny rozdźwięk między poziomem kancelarii a jakością strony,
- właściciel inwestuje w rozwój kancelarii (SEO, blog, zdjęcia, marketing, aktualności),
- istnieje realna szansa sprzedaży — jest kontakt, jest wstyd, jest budżet,
- przygotowanie spersonalizowanego maila jest warte poświęconego czasu.

Dla werdyktu **PISZ** wygeneruj w Kroku 6: `mail-fragment.txt` (2–4 zdania do trackera) + `mail.txt` (temat + pełny pierwszy mail).

### 🔴 ODPUŚĆ (`werdykt: "odpusc"`)

Przyznaj, jeżeli:
- potencjał sprzedażowy jest niski (solo, małe miasto, brak specjalizacji, brak sygnałów inwestowania),
- właściciel prawdopodobnie nie zainwestuje w nową stronę,
- brak wyraźnego rozdźwięku między poziomem kancelarii a stroną (oboje słabe — spójne),
- brak kontaktu w danych (`phone` + `email` puste, `hasForm = false`) — nie ma do kogo pisać,
- przygotowanie spersonalizowanego maila nie jest warte czasu.

Podaj jedynie `rekomendacja` — 1–2 zdania dlaczego lead odrzucony. Nie generuj maila.

**Reguła rozstrzygająca:** brak kontaktu przebija wszystko → ODPUŚĆ.

### Dane pomocnicze (kontekst, nie osobny werdykt)

- **Luka do naprawienia:** score 30–65 = najlepszy target; 80+ = odpuść stronę; < 20 = oznacz do ręcznej decyzji.
- **Dostępność kontaktu:** bezpośredni email osobisty (`imie.nazwisko@`) łatwiejszy niż `kontakt@` / `biuro@` / formularz.
- **Sygnały inwestowania:** blog, JSON-LD/SEO, formularz, aktualności, zdjęcia profesjonalne, Google Ads — im więcej, tym wyższy priorytet.

---

### Ranking gwiazdkowy (priorytet operacyjny — pole `gwiazdki`, 1–5)

Odpowiada na pytanie **„kiedy pisać"**, niezależnie od score technicznego. Priorytet = „czy właściciel kupi teraz".

| Gwiazdki | Etykieta | Kryteria |
|---|---|---|
| ⭐⭐⭐⭐⭐ | **PISZ DZISIAJ** | P1=tak + jest kontakt + `sygnalyKupna` ma ≥2 potwierdzonych sygnałów (aktywny inwestor: blog/SEO/JSON-LD/Ads) |
| ⭐⭐⭐⭐ | **PISZ** | Rozdźwięk jest, kontakt jest, ale mniej sygnałów potwierdzających gotowość inwestycyjną |
| ⭐⭐⭐ | **JEŚLI MASZ CZAS** | Sygnały mieszane, mniejszy potencjał inwestycyjny lub mało danych o statusie — nic nie wyklucza, ale priorytet niski |
| ⭐⭐ | **TYLKO PO TELEFONIE** | Potencjał niepewny, wymaga ręcznej weryfikacji przed napisaniem (np. brak kontaktu w danych, ale lead wygląda obiecująco) |
| ⭐ | **ODPUŚĆ** | Werdykt 🔴 z mocnym uzasadnieniem: brak budżetu, brak kontaktu bez szans na weryfikację, strona już dobra |

**Ważne:** gwiazdki i werdykt (pisz/pisz-inaczej/odpusc) to dwa ortogonalne wymiary. Kancelaria kategorii C może być ⭐⭐⭐⭐⭐ jeśli jest oczywisty, świeży rozdźwięk i łatwy kontakt. Kancelaria A może być ⭐⭐ jeśli nie ma kontaktu. Nie mieszaj.

---

### Kategoria potencjału (pole `potencjal`, A/B/C)

Odpowiada na pytanie **„ile możesz na tym zarobić"** — niezależnie od gwiazdek.

| Kategoria | Kryteria |
|---|---|
| **A** | Silne sygnały wysokiego potencjału inwestycyjnego: specjalizacja biznesowa/korporacyjna (corporate, M&A, podatki, prawo gospodarcze), kancelaria wieloosobowa (i Wspólnicy, spółka), duże/średnie miasto (≥50 tys.), aktywne inwestowanie w marketing (blog, Ads, JSON-LD, nowoczesna identyfikacja) |
| **B** | Częściowe sygnały: jeden lub dwa z powyższych, reszta niejednoznaczna. Np. duże miasto ale solo, albo wieloosobowa ale małe miasto |
| **C** | Słabe sygnały: solo, małe miasto (<30 tys.), specjalizacja rodzinna/karna bez wyróżników, brak śladów inwestowania. Mniejszy potencjał inwestycyjny — nie wyklucza zakupu, ale obniża oczekiwania |

---

### Sygnały kupna (pole `sygnalyKupna`, tablica — tylko potwierdzone danymi)

Wypisuj **tylko te, które wynikają z danych** (`content.json`, `vitals.json`, screenshot). Nie zgaduj.

```
✓ aktywnie rozwija kancelarię (blog, sekcja aktualności, świeże wpisy)
✓ inwestuje w SEO (JSON-LD, meta description, przemyślana struktura H)
✓ prowadzi blog prawny
✓ kancelaria wieloosobowa / ma zespół (trustSignals.team=true + „i Wspólnicy")
✓ specjalizacja dla firm / klienci biznesowi (corporate, podatki, prawo gospodarcze)
✓ formularz kontaktowy obecny (hasForm=true)
✓ ślady kampanii Google Ads (UTM w linkach, landing page pod frazę)
✓ nowoczesna identyfikacja wizualna (ocena ze screenshota)
✓ opinie z imieniem i nazwiskiem klientów (testimonials=true)
```

Puste `sygnalyKupna` = brak sygnałów gotowości inwestycyjnej → niżej w rankingu, niezależnie od tego jak zła jest strona.
