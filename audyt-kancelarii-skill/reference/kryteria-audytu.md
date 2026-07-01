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

Po ocenie 8 wymiarów odpowiedz na osobne pytanie: **czy w ogóle warto wysłać tej kancelarii cold mail?** Nie każda strona ze słabym score to dobry lead. To **wewnętrzna kwalifikacja** — trafia do `audyt.md` i `audyt-dane.json`, **nigdy do `mail-fragment.txt`**.

Rdzeń to **5 pytań kwalifikujących**. Wszystkie mierzą jedno: **rozdźwięk między statusem kancelarii a jakością/wiekiem strony oraz zaniedbanie**. Ton biznesowy, nie oceniający („mały budżet prawdopodobny", nie „ta kancelaria jest biedna"). Każda odpowiedź z danych; brak danych = `za-malo-danych`, nie zgadywanie — zwłaszcza P1 i P3.

Te 5 pytań pełni **dwie role, ta sama logika w dwóch głębokościach**:
- **Etap 0 (kwalifikacja wizualna)** — zgrubne odpowiedzi z samego screenshota / strony głównej **przed** pełnym audytem (`node scrape.js --peek <url>`). Odsiewa oczywiste 🔴, oszczędza czas i limit Firecrawl. Jeśli od razu 🔴 → zapisz `lead-skip.txt` i nie scrapuj (patrz `SKILL.md` Krok 0).
- **Krok 5 (pełna ocena)** — udokumentowane odpowiedzi po audycie, na danych z `content.json`/`vitals.json`/`servicesPage`/`ageSignals`. To ostateczny werdykt.

### 5 pytań kwalifikujących

Dla każdego: odpowiedź `tak` / `nie` / `za-malo-danych` + jedno zdanie uzasadnienia z danych.

**P1 ⭐ (waga PODWÓJNA — najważniejsze) — Czy kancelaria wygląda na zamożniejszą niż jej strona?**
Rozdźwięk = idealny target: jest budżet i jest wstyd. Sygnały statusu: specjalizacja biznesowa (corporate/M&A/podatki/gospodarcze z `servicesPage.practiceAreas`), „i Wspólnicy"/zespół (`trustSignals.team`), duże miasto (nazwa/tracker), klasa biura na zdjęciach (screenshot), prestiżowi klienci wymienieni w treści. Zestaw to ze score audytu: **wysoki status + score < 60 → `tak`** (mocny sygnał). Jeśli sygnały z danych niejednoznaczne → `za-malo-danych` i ustaw `wymagaOcenyScreenshot: true` („wymaga oka użytkownika na screenshot").

**P2 — Czy strona ma ponad 6–7 lat?**
Ślady wieku łączą `content.json.ageSignals` (`copyrightYear` stary, `generator` np. „Joomla! 1.5", `templateHints` np. „templatemo") + `vitals.json` (`https = false`, `mobileFriendly = false`). Sygnały się sumują — **2+ ślady = prawdopodobnie `tak`**.

**P3 — Czy właściciel prawdopodobnie wyda 5–10 tys. zł bez problemu?**
„Bez problemu" = cena nie jest barierą decyzyjną. Sygnały: specjalizacja o wysokich stawkach (corporate, podatki, M&A, nieruchomości komercyjne), kancelaria wieloosobowa, duże miasto, obsługa klientów biznesowych. Za mało sygnałów → `za-malo-danych`, nie zgaduj.

**P4 — Czy nowa strona realnie poprawi pierwszy kontakt z klientem?**
Wynik audytu konwersji. Problemy pierwszego wrażenia (HTTPS, mobile, szybkość, CTA, jasność specjalizacji) na liście 🔴/🟡 → `tak`, realnie poprawi. Strona już dobra, a problemy kosmetyczne → `nie` (mniejszy sens kontaktu o stronie). Użyj score + listy problemów wysokiego priorytetu.

**P5 — Czy właściciel prawdopodobnie nie inwestował w stronę ostatnio?**
Brak śladów świeżej pracy: brak JSON-LD (`hasStructuredData = false`), brak optymalizacji SEO, stary `ageSignals.copyrightYear`, brak HTTPS. Nikt nie tknął strony od lat = otwarte drzwi. (Pokrywa się z P2, ale z perspektywy świeżości, nie wieku.)

### Dane pomocnicze (kontekst do 5 pytań, nie osobny werdykt)

- **Luka do naprawienia:** score 30–60 = najlepszy target; 80+ = odpuść stronę; < 25 = oznacz do ręcznej decyzji.
- **Dostępność kontaktu:** bezpośredni email osobisty (`imie.nazwisko@`) łatwiejszy niż `kontakt@` / `biuro@` / formularz; brak kontaktu (`phone` + `email` puste, `hasForm = false`) = czerwony flag — nie ma jak/do kogo pisać.

### Werdykt — segmentacja na podstawie 5 pytań

Policz odpowiedzi `tak` (**P1 liczy się PODWÓJNIE**). Przypisz:

- 🟢 **PISZ TERAZ** (`werdykt: "pisz"`) — **P1 = tak ORAZ ≥3 z pozostałych = tak**, jest kontakt. Klasyczny rozdźwięk: zamożna kancelaria, zaniedbana strona, budżet jest. Standardowy cold mail z audytem.
- 🟡 **PISZ INACZEJ** (`werdykt: "pisz-inaczej"`) — sygnały mieszane: P1 tak ale P3 nie (brak budżetu), **albo** strona bardzo dobra (P4 nie — zaproponuj inne podejście niż „masz problemy"), **albo** strona skrajnie zła (zacznij od pytania, nie od listy problemów). Podaj JAKIE podejście.
- 🔴 **ODPUŚĆ** (`werdykt: "odpusc"`) — brak kontaktu, **lub** P3 wyraźnie nie (brak budżetu), **lub** strona świeża i dobra (P2/P5 nie + wysoki score). Podaj powód.

**Reguła rozstrzygająca:** brak kontaktu przebija wszystko → 🔴.
