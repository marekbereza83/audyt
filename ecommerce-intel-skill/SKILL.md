---
name: ecommerce-store-intelligence
description: >
  Analiza dziesiątek realnych sklepów ecommerce pod kątem tego, jak sprzedają: anatomia PDP,
  ścieżka do zakupu, mechanika personalizacji, budowanie zaufania, oferta i mobile UX. Skanuje
  sklepy (Playwright + darmowe endpointy Shopify, bez kosztu API), liczy powtarzalne wzorce między
  sklepami, wykrywa anomalie i whitespace, a na końcu produkuje Ecommerce Intelligence Report i
  brief UX/CRO gotowy do zbudowania własnego motywu Shopify. Używaj, gdy trzeba ustalić, jak
  powinien wyglądać sklep dla konkretnego produktu, zanim zacznie się go budować.
---

# Ecommerce Store Intelligence

## Czym to jest

Narzędzie do odpowiedzi na jedno pytanie: **jak powinien wyglądać nasz sklep dla konkretnego produktu, żeby miał szansę sprzedawać.**

Nie kopiujemy jednej strony. Skanujemy kilkadziesiąt realnych sklepów, liczymy, co się powtarza u tych, którzy realnie wydają na reklamy, i szukamy miejsc, których nikt nie zajął.

Zbudowane na tym samym silniku co `audyt-kancelarii-skill` (wspólny `core/`), ale z odwróconym celem: tamto ocenia JEDNĄ stronę pod kątem sprzedaży usługi, to porównuje WIELE sklepów pod kątem zbudowania własnego.

## Zasada nadrzędna — rozdział obserwacji od interpretacji

Trzy warstwy, nigdy ich nie mieszaj:

| Warstwa | Kto produkuje | Plik | Charakter |
|---|---|---|---|
| Fakty ze sklepu | `scan-store.js` | `store-data.json` | OBSERVED — wyłącznie to, co jest w DOM/JSON |
| Częstotliwości między sklepami | `patterns.js` | `_patterns.json` | OBSERVED — liczone kodem, deterministycznie |
| Wnioski, wzorce, whitespace | Claude | `store-analysis.json`, raport, brief | INFERENCE — zawsze z odwołaniem do pola/zrzutu |

**Częstotliwości liczy kod, nie model.** Zdanie „31 z 40 sklepów pokazuje cenę nad zgięciem" jest fundamentem raportu — gdyby liczył je model czytający 40 plików, byłyby to liczby zmyślone z dużą pewnością siebie. Claude dostaje gotowe liczby i je interpretuje.

**Każdy wniosek musi wskazywać podstawę**: pole w `store-data.json` albo konkretny zrzut. Bez tego nie wchodzi do raportu.

## Workflow

### Krok 1 — Zbuduj listę sklepów

CSV z kolumną `url` (reszta kolumn opcjonalna, wchodzi do `kontekstRynkowy` i służy do segmentacji):

```
nazwa,url,rynek,rola,cena_obs,waluta,aktywne_reklamy_strona,start_reklam,angle,zrodlo,uwagi
```

Najlepsze źródło listy to wcześniejszy research reklamowy (WinningHunter → deep validation), bo daje od razu `aktywne_reklamy_strona` — a to pozwala odróżnić „wszyscy tak robią" od „robią tak ci, którzy realnie płacą za ruch". Przykład: `input/pet-necklace-eu.csv`.

Dobieraj do listy trzy grupy, nie jedną:
1. **Konkurenci bezpośredni** — ten sam produkt.
2. **Konkurenci sąsiedni** — ten sam problem/klient, inny format produktu (np. bransoletka zamiast naszyjnika).
3. **Wzorce z zewnątrz** — sklepy z innych kategorii, które rozwiązały ten sam problem UX lepiej (np. dowolna marka z mocnym konfiguratorem, jeśli badamy personalizację).

Nie ograniczaj się mechanicznie do jednej kategorii — wartościowy wzorzec bywa poza nią.

### Krok 2 — Skanuj

```bash
node scripts/scan-store.js --batch input/<lista>.csv --concurrency 4
```

Koszt: zero (Playwright + darmowe endpointy Shopify). Na sklep: dwa przebiegi (desktop 1920×1080 i mobile 375×812), po cztery zrzuty (`*-fold.png` = bez scrolla, `*-full.png` = cała strona) i `store-data.json`.

Osobny przebieg mobilny jest konieczny, nie kosmetyczny: motywy renderują inny DOM pod inny viewport (sticky ATC, zwinięte akordeony, inna kolejność sekcji).

### Krok 3 — Policz wzorce

```bash
node scripts/patterns.js                      # wszystkie zeskanowane
node scripts/patterns.js --prog-reklam 50     # próg „silnego sygnału paid"
```

Daje `output/_patterns.json`: częstotliwość każdej cechy, rozbicie na sklepy z budżetem reklamowym i bez, kandydatów na whitespace, rozkład aplikacji, średnią pozycję typów sekcji i rozkład cen.

**Zwróć uwagę na `skanyPodejrzane`** — sklepy z <3 sekcjami albo krótsze niż 1,5 ekranu prawdopodobnie się nie wczytały (blokada bota, martwy sklep). Są wyłączone z mianownika, żeby nie zafałszować każdej częstotliwości. Zweryfikuj je na zrzucie, zanim uznasz wynik za pełny.

### Krok 4 — Analiza per sklep (Claude)

Dla każdego sklepu przeczytaj `store-data.json` **i obejrzyj cztery zrzuty**, potem zapisz analizę wg `reference/schemat-store-analysis.json`.

W praktyce (przebieg 2026-08-20) sprawdziła się **jedna zbiorcza `01-analizy-sklepow.md` z sekcją na sklep** zamiast 15 osobnych plików JSON: głównym konsumentem tej warstwy jest raport i brief, a forma zbiorcza pozwala czytać w poprzek sklepów. Schemat JSON zostaje jako wzorzec pól, gdy analiza ma być czytana maszynowo.

**Zrzut ma pierwszeństwo nad licznikiem.** Sonda DOM jest precyzyjna w tym, co mierzy, ale ślepa na to, jak coś wygląda: `liczbaSekcji: 9` nie mówi, czy strona jest czytelna, a `uploadNaPdp: false` może oznaczać upload za kliknięciem, którego sonda nie rozwinęła. Jeśli zrzut przeczy danym — opisz rozbieżność, nie wybieraj po cichu jednej wersji.

Oceniaj wg `reference/kryteria-ecommerce.md` (9 obszarów). Dla każdego: co robi ten sklep, na jakiej podstawie to wiesz, i czy to rozwiązanie jest lepsze czy gorsze od mediany z `_patterns.json`.

### Gdzie lądują wyniki — ważne

**Raporty i briefy nie zostają w tym repo.** Trafiają do katalogu projektu produktowego, np.:

```
dev/shopify/neckle/
├── intelligence/   01-analizy-sklepow.md, 02-intelligence-report.md, 03-brief-sklep.md
└── dane/           _patterns.json, lista-sklepow.csv
```

Podział: **audyt = narzędzie wielokrotnego użytku, projekt produktowy = wiedza o rynku i decyzje.** W repo audytu zostają tylko listy wejściowe (`input/`), bo definiują, co skanowaliśmy. Skany i zrzuty są odtwarzalne jednym poleceniem i darmowe, więc nie są wersjonowane nigdzie.

### Krok 5 — Ecommerce Intelligence Report

Jeden raport dla całej listy → `<projekt>/intelligence/02-intelligence-report.md`. Struktura:

1. **Co się powtarza u wszystkich** — standard kategorii. To rzeczy, których brak będzie odbierany jako brak, nie jako wyróżnik. Każda pozycja z liczbą z `_patterns.json`.
2. **Co robią sklepy z budżetem, a czego nie robią pozostałe** — z `najwiekszeRoznicePaid`. Najcenniejsza sekcja: to są rzeczy, za które ktoś realnie zapłacił, żeby sprawdzić, czy działają.
3. **Trzy–pięć najlepszych rozwiązań, jakie widzieliśmy** — konkretny sklep, konkretny mechanizm, dlaczego jest lepszy od reszty.
4. **Słabości powtarzające się u konkurencji** — miejsca, gdzie wszyscy robią to samo źle.
5. **Whitespace** — z `kandydaciNaWhitespace`, ale **przefiltrowany osądem**. Rzadkość cechy ma dwa możliwe wyjaśnienia i musisz wskazać, które wybierasz i dlaczego:
   - nikt tego nie robi, bo nie wpadł → okazja,
   - nikt tego nie robi, bo próbowano i nie działa / jest kosztowne / łamie prawo → pułapka.
   Nie podawaj listy rzadkich cech jako listy okazji.
6. **Czego ten research NIE rozstrzyga** — obowiązkowa sekcja. Skan pokazuje, co sklepy robią, nigdy czy im to sprzedaje. Brak danych o konwersji, koszyku, zwrotach.

### Krok 6 — Brief UX/CRO/design

`output/_brief-sklep.md` — dokument wejściowy do budowy motywu Shopify. Ma być na tyle konkretny, żeby dało się z niego budować, i na tyle uzasadniony, żeby dało się każdą decyzję cofnąć do dowodu.

Struktura pod Shopify (to nie jest przypadek — mapuje się 1:1 na sekcje motywu):

```
1. Kolejność sekcji PDP        → lista sekcji motywu, w kolejności, z uzasadnieniem każdej
2. Zawartość zgięcia           → co MUSI być widoczne bez scrolla, desktop i mobile osobno
3. Mechanika personalizacji    → gdzie upload, ile pól, czy podgląd, co po zakupie
4. Ścieżka do zakupu           → gdzie ATC, czy sticky, co się dzieje po dodaniu
5. Dowody i zaufanie           → jakie, w której sekcji, w jakiej formie
6. Obsługa obiekcji            → lista obiekcji + gdzie każda jest zbijana
7. Oferta                      → cena, warianty, bundle, wysyłka
8. Mobile                      → co inaczej niż desktop
9. Czego świadomie NIE robimy  → i dlaczego (to chroni przed dopisywaniem funkcji później)
```

Każdy punkt: **decyzja + podstawa** (`_patterns.json` albo konkretny sklep) + **czy to standard, czy próba wyróżnienia się**.

Brief kończy pracę tego skilla. **Nie buduj tu Shopify** — budowa jest osobnym etapem, w osobnym repo, z tym briefem jako wejściem.

## Uniwersalność — jak użyć do innego produktu

System nie zna żadnej branży. Zmiana produktu to:
1. Nowa lista w `input/<produkt>.csv`.
2. Ewentualne dopisanie fraz do `scripts/extractors/slowniki.js` (frazy są wielojęzyczne: EN/DE/FR/PL/NL/ES/IT — dopisz swoje, jeśli produkt ma własny słownik obiekcji).
3. Ewentualne dopisanie cech do tabeli `CECHY` w `patterns.js`.

Kod sondy (`dom-probe.js`) nie wymaga zmian — całą wiedzę o tym, czego szukać, dostaje ze słowników.

## Pliki

- `scripts/scan-store.js` — skaner (pojedynczy + `--batch`)
- `scripts/extractors/dom-probe.js` — sonda wykonywana w przeglądarce; zwraca fakty, nie oceny
- `scripts/extractors/slowniki.js` — sygnatury aplikacji, frazy wielojęzyczne, selektory, typy sekcji
- `scripts/patterns.js` — częstotliwości między sklepami + whitespace + segmentacja po sygnale paid
- `reference/kryteria-ecommerce.md` — 9 obszarów oceny (warstwa interpretacji)
- `reference/schemat-store-analysis.json` — kanoniczny szablon analizy per sklep
- `input/` — listy sklepów
- `output/<domena>/` — dane i zrzuty; `output/_patterns.json`, `_intelligence-report.md`, `_brief-sklep.md`
- `../core/` — wspólny silnik (przeglądarka, pula workerów, CSV)

## Setup

```bash
cd C:\dev\audyt && npm install       # playwright w korzeniu repo — core/ musi go widzieć
npx playwright install chromium      # jeśli jeszcze nie ma
```

## Ograniczenia — mów o nich wprost w raporcie

1. **Skan pokazuje, co sklep robi, nigdy czy mu to sprzedaje.** Zero danych o konwersji, AOV, zwrotach. Liczba aktywnych reklam to sygnał, że ktoś płaci — nie dowód, że zarabia.
2. **Małe n.** Przy 12–15 sklepach jedna pozycja to ~8 punktów procentowych. Różnice poniżej ~20 pp są szumem. Pisz „6 z 12", nie „50%" jako fakt precyzyjny.
3. **Sonda widzi stan po załadowaniu.** Treść za kliknięciem (akordeon, zakładka, modal konfiguratora) może zostać niezauważona — dlatego zrzut ma pierwszeństwo.
4. **Klasyfikacja typu sekcji (`typGuess`) jest heurystyką po słowach kluczowych.** Weryfikuj na zrzucie, zanim zbudujesz na niej wniosek.
5. **Sklepy blokujące boty** dadzą pusty skan — trafiają do `skanyPodejrzane`, nie do statystyk.
