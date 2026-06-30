# Strona testowa „zła kancelaria" — specyfikacja i klucz odpowiedzi

Cel: strona z **celowo wsadzonymi błędami**, po jednym (lub więcej) na każdy z 8 wymiarów audytu. Służy do kalibracji skilla — jeśli audyt znajdzie wszystkie błędy z tej listy, narzędzie działa. Jeśli przegapi trzy, dopracuj `kryteria-audytu.md` lub `scrape.js`.

**Nazwa robocza:** „Kancelaria Testowa Kowalski" (fikcyjna)
**Hosting:** osobna subdomena albo `zla-kancelaria.pages.dev` — trzymaj na stałe jako test regresyjny.

---

## Klucz odpowiedzi — co audyt MUSI wykryć

Tabela: wymiar → wsadzony błąd → oczekiwany status w audycie → jak narzędzie to łapie.

| # | Wymiar | Wsadzony błąd | Oczekiwany status | Wykrycie |
|---|---|---|---|---|
| 1 | Jasność specjalizacji | H1 = „Profesjonalna obsługa prawna" (zero konkretu) | ❌ 0 | `content.json.h1` nie zawiera nazwy dziedziny prawa |
| 2 | CTA i kontakt | Brak CTA w hero; kontakt tylko w stopce | ❌ 0 | `ctaCount` niski/0, brak `hasForm` |
| 3 | Szybkość | Wielkie nieskompresowane zdjęcie hero (3–5 MB JPG) | ❌ / ⚠️ | `vitals.lcp` > 4s, `performanceScore` < 50 |
| 4 | Mobile | Brak `<meta name="viewport">` | ❌ 0 | `vitals.mobileFriendly` = false |
| 5 | Struktura treści | Jedna ściana tekstu, zero H2/H3 | ❌ 0 | `headingCounts.h2` = 0 |
| 6 | Sygnały zaufania | Zero opinii, zero liczb, zero zespołu | ❌ 0 | brak w `messagingSamples`, brak nazwisk/lat |
| 7 | SEO techniczne | Brak meta description, brak JSON-LD | ⚠️ / ❌ | `metaDescription` null, `hasStructuredData` false |
| 8 | Etyka zawodowa | Tekst „Najlepsza kancelaria w mieście, gwarantujemy wygraną" | ❌ 0 | `ethicsFlags` niepuste |

**Oczekiwany score: < 30/100 (tier krytyczny).** Jeśli skill wystawi więcej — coś nie łapie.

---

## Jak zbudować — sekcja po sekcji

Poniżej gotowy szkielet HTML z wsadzonymi błędami. Wszystkie błędy oznaczone komentarzem `<!-- BŁĄD #N -->`.

### Hero (błędy 1, 2, 3, 4)

```html
<!-- BŁĄD #4: BRAK <meta name="viewport"> w <head> -->
<head>
  <title>Kancelaria Testowa Kowalski</title>
  <!-- BŁĄD #7a: brak <meta name="description"> -->
  <!-- BŁĄD #7b: brak <script type="application/ld+json"> -->
</head>

<section class="hero">
  <!-- BŁĄD #3: ogromne nieskompresowane zdjęcie -->
  <img src="hero-5mb.jpg" alt="">
  <!-- BŁĄD #1: H1 bez konkretnej specjalizacji -->
  <h1>Profesjonalna obsługa prawna</h1>
  <p>Zapraszamy do współpracy.</p>
  <!-- BŁĄD #2: brak jakiegokolwiek CTA w hero -->
</section>
```

### Treść (błędy 5, 8)

```html
<section>
  <!-- BŁĄD #5: ściana tekstu, zero H2/H3 -->
  <p>
    Nasza kancelaria oferuje kompleksową obsługę prawną dla klientów
    indywidualnych i biznesowych w szerokim zakresie spraw [...300 słów
    jednym akapitem bez nagłówków, bez list, bez podziału...].
    <!-- BŁĄD #8: zwroty wartościujące + obietnica wyniku -->
    Jesteśmy najlepszą kancelarią w mieście i gwarantujemy wygraną
    w każdej sprawie.
  </p>
</section>
```

### Stopka (błąd 2, 6)

```html
<footer>
  <!-- BŁĄD #2: kontakt schowany TYLKO tutaj, mały tekst -->
  <p style="font-size:10px">tel. 123456789</p>
  <!-- BŁĄD #6: zero opinii, zero liczb, zero zespołu nigdzie na stronie -->
</footer>
```

---

## Wariant „średni" (opcjonalny, do testu tieru średniego)

Gdy skill ładnie łapie skrajny przypadek, zbuduj drugą wersję z mieszanką ⚠️ — żeby sprawdzić czy rozróżnia „brak" od „słabe":

- Specjalizacja jest, ale w H2 zamiast H1 (oczekiwane: ⚠️ 7)
- CTA jest, ale tekst „Kliknij tutaj" (oczekiwane: ⚠️ 10)
- Szybkość LCP ~3s (oczekiwane: ⚠️ 7)
- Jedna opinia bez nazwiska (oczekiwane: ⚠️ 7)

Oczekiwany score: 55–70 (tier średni). To sprawdza najtrudniejszą rzecz — czy audyt nie wrzuca wszystkiego do „dobrze" albo „źle", tylko trafia w środek.

---

## Procedura kalibracji

1. Zbuduj złą stronę wg szkieletu, wgraj na `pages.dev`.
2. W Claude Code: `Zaudytuj https://zla-kancelaria.pages.dev`
3. Porównaj wynik z kluczem odpowiedzi (tabela wyżej).
4. Dla każdego przegapionego błędu sprawdź: czy `scrape.js` zebrał dane (zajrzyj do `content.json`/`vitals.json`)? Jeśli tak — popraw `kryteria-audytu.md`. Jeśli nie — popraw scraper.
5. Powtórz aż wszystkie 8 błędów wykryte i score < 30.
6. Zbuduj wariant średni, powtórz — sprawdź czy score ląduje w 55–70.

Po przejściu obu — narzędzie jest skalibrowane i gotowe na prawdziwe kancelarie.

---

## Pułapki, na które uważać

- **Lighthouse może nie zmierzyć `pages.dev` od razu** (cold start). Odśwież raz przed audytem.
- **Firecrawl renderuje JS** — jeśli celowo wsadzasz błąd „treść tylko w JS", sprawdź czy scraper ją widzi.
- **Nie testuj na prawdziwej kancelarii „dla pewności"** — do kalibracji służy wyłącznie strona, której błędy znasz. Prawdziwa kancelaria to dopiero krok produkcyjny.
