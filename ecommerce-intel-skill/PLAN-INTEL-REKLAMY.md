# Plan: warstwa reklamowa intelu ecommerce

Stan na 2026-09-09. Plik roboczy — do usunięcia po zestawieniu z Hunterem i ocenie.

Cel: dołożyć do intelu (który dziś patrzy wyłącznie na **sklep**) warstwę **reklamy**,
i sprawdzić, czy dane z WinningHuntera zgadzają się z tym, co widać w Meta Ad Library.

---

## Zasada, która obowiązuje w tej warstwie

Ta sama co w reszcie repo: **skrypt/obserwacja produkuje fakty, Claude interpretuje.**
Do tego jedna dodatkowa, specyficzna dla reklam:

> **Skuteczności reklamy nie zna nikt poza reklamodawcą.**
> Meta nie udostępnia wydatku, CTR, konwersji ani ROAS-u dla reklam komercyjnych —
> kwoty i zasięgi są tylko przy reklamach politycznych i społecznych. Każde narzędzie
> podające „ROAS konkurenta" szacuje. W tym repo nie zapisujemy szacunków jako faktów.

Dopuszczalne przybliżenia skuteczności, w kolejności siły:

| Sygnał | Skąd | Dlaczego działa |
|---|---|---|
| długość życia kreacji | Ad Library, data startu | nikt nie płaci 22 mies. za kreację, która nie zarabia |
| liczba duplikatów jednej kreacji | Ad Library, „Liczba reklam wykorzystujących ten materiał" | duplikacja na wiele zestawów = skalowanie |
| zasięg w UE + targetowanie | panel „Transparentność w UE" (DSA) | jedyne prawdziwe liczby zasięgu; **jeszcze nieodczytane** |
| pasmo wyświetleń | etykieta „Niska liczba wyświetleń / <100" | oznacza słabo chodzące reklamy |

---

## Zrobione (2026-09-09)

1. **Sześć nowych marek w `input/pet-necklace-eu.csv`** (15 → 21 pozycji), znalezionych
   przez wyszukiwanie Ad Library **po frazie produktowej**, nie po nazwie marki:
   Paw Lux Gems, Tulas, Morgan & French, The Little Keepsake Company, Callie Grace,
   Say Anything Jewelry. URL-e produktowe wyciągnięte z `/products.json` (Shopify)
   albo z sitemap (Callie, TLKC — nie-Shopify).

2. **`aktywne_reklamy_strona` uzupełnione** z widoku per reklamodawca
   (`view_all_page_id=<page_id>`), `zrodlo: ad-library-strona-2026-09-09`:

   | Marka | Aktywne reklamy | page_id |
   |---|---|---|
   | Tulas | ~1500 | 521419944385343 |
   | Callie Grace | 520 | 1334963433023885 |
   | Paw Lux Gems | 38 | 159865633887869 |
   | The Little Keepsake Company | 36 | 477172055711570 |
   | Say Anything Jewelry | 16 | 194503881561 |
   | Morgan & French | 13 | 238337712930040 |

3. **Zeskanowane i przeliczone.** 22 skany → 15 w statystykach, segmentacja 7 z sygnałem
   paid / 8 bez (było 6/6). Kluczowe różnice po dołożeniu nowych:
   - podgląd na żywo (canvas): **4/7 paid vs 0/8 bez** (+57 pp)
   - pilność / niedobór: 5/7 vs 1/8 (+59 pp)
   - polityka zwrotów wspomniana: 4/7 vs 1/8 (+45 pp)
   - bundle / zestaw: 3/7 vs 7/8 (**−45 pp** — odwrotnie)
   - **obiecuje podgląd/proof przed produkcją: 0/15** — zero przy większym mianowniku

### Uwaga metodologiczna, która kosztowała pomyłkę

Liczenie reklam **po słowie kluczowym** (`q=<marka>`) jest bezwartościowe dla nazw
niedystynktywnych: „Tulas" dało ~2000 trafień, w tym TULA (kosmetyki) i Tulas University.
Jedyny poprawny licznik to widok per strona: `view_all_page_id=<page_id>`.
`page_id` da się wyciągnąć z DOM-u wyników (pary `page_name`/`page_id`);
**ID z linku profilowego reklamodawcy nie działa** — to inny identyfikator.

---

## Do zrobienia

### A. Zweryfikować podejrzane skany (blokuje pełność statystyk)

`patterns.js` wyrzucił 7 z 22 z mianownika. Trzy z nich to nowe marki:
`callie.com` (1 sekcja), `morganandfrench.com` (2 sekcje),
`thelittlekeepsakecompany.com` (1 sekcja).

Morgan & French to realnie bogaty sklep (cała linia Snozza™ + naszyjnik na prochy),
więc 2 sekcje to prawie na pewno blokada bota albo motyw ładujący się poza sondą.
Zgodnie z regułą **zrzut wygrywa z licznikiem** — obejrzeć
`output/<domena>/{desktop,mobile}-full.png` przed uznaniem wyniku za pełny.

### B. Poprawić `rola` i `angle` dla trzech pozycji z pierwotnej listy

Youtua, Febworld i Provcustom mają w CSV `rola: konkurent-bezposredni` i angle
memorial/premium. Ad Library pokazuje, że **żadna z nich nie reklamuje naszyjnika
ze zdjęciem zwierzęcia**:

- Youtua (~250) — bombki choinkowe, breloki dla pielęgniarek i fryzjerek
- Febworld (~460) — wycieraczki, breloki, koszulki 3D, etui, plakaty; reklamy żywe od XI 2022
- Provcustom (~170) — wesela, niemowlaki, dziennik żałoby, kaczka ze zdjęcia; druga marka „Customcraft" na tej samej domenie

To są fabryki print-on-demand z naszyjnikiem jako jednym SKU z setek, nie konkurenci
bezpośredni. Etykieta `angle` opisywała jedną podstronę, nie to, co firma reklamuje.
(Te trzy liczby są keywordowe — przy poprawce wziąć licznik per strona, patrz uwaga wyżej.)

### C. Zestawić z Hunterem i ocenić

To jest właściwy cel. Konektor WinningHunter jest podpięty w sesji, ale wystawia
na razie samo `authenticate` — po zalogowaniu sprawdzić, co realnie daje.

Pytania do zestawienia:

1. **Czy `aktywne_reklamy_strona` z Huntera zgadza się z licznikiem per strona
   z Ad Library?** Pierwotna lista ma dane Huntera z dnia budowania (`winninghunter-deepval`),
   nowa szóstka ma odczyt z 2026-09-09. Rozjazd = albo dryf w czasie, albo Hunter
   liczy coś innego. Trzeba wiedzieć które, zanim te dwa źródła stoją w jednej kolumnie.
2. **Czy Hunter daje szereg czasowy?** To jedyna rzecz, której Ad Library nie ma —
   pokazuje wyłącznie stan na dziś. Trend liczby reklam przez miesiące jest wart
   więcej niż migawka.
3. **Co Hunter podaje jako „skuteczność"** i czy to pomiar, czy szacunek. Jeśli szacunek —
   nie wchodzi do `store-data.json` jako fakt.
4. **Zaangażowanie** (reakcje/komentarze/udostępnienia) — jeśli jest, to najbliższe
   prawdziwemu sygnałowi jakości kreacji, jakie da się kupić.

### D. Otwarte do sprawdzenia

- **Tulas ~1500 aktywnych reklam** — nieproporcjonalnie dużo jak na markę biżuteryjną
  ze 100 produktami. Zweryfikować, czy to nie zaokrąglenie/limit wyświetlania
  albo strona zbiorcza większego podmiotu.
- **Panel „Transparentność w UE"** — widziany przy reklamach Febworldu, Youtui
  i Paw Lux Gems, nieotwarty. Daje zasięg per kraj UE i parametry targetowania.
  Jedyne prawdziwe liczby w całej tej warstwie.
- Czy `analityka` (piksele) ma wejść do agregatów `patterns.js` — dziś zbierana
  per sklep w `desktop.aplikacje.analityka` i **nigdzie nieliczona**.
- Czy `start_reklam` przeliczać na długość kampanii — dziś ciągłość siedzi
  tylko w polu `uwagi` jako tekst.

---

## Materiał obserwacyjny z Ad Library (2026-09-09)

Do wykorzystania przy ocenie — **obserwacja, nie wniosek**.

**Na poziomie produktu nisza jest pusta.** Frazy dokładne: „pet photo necklace" ~40,
„pet memorial necklace" ~9, „paw print necklace" ~10. Razem ~60 aktywnych reklam
na świecie, przy 460 samego Febworldu na generyczne prezenty. Paw Lux Gems jedzie
tę samą kreację od 2024-11-12.

**Cztery różne mechanizmy produktu**, nie jeden:
zdjęcie → portret (Paw Lux Gems, hoohoopet) · odcisk łapy albo **nosa**
(Morgan & French) · imię alfabetem Morse'a (Tulas) · symbol łapy + kamień
urodzeniowy (Callie Grace, Pawsome Couture).

**Cztery rejestry copy:**

- *Paw Lux Gems* — presja rabatowa: „TODAY Only … 50% OFF". Trwa 22 miesiące,
  więc „tylko dziś" jest permanentne.
- *Tulas* — pierwsza osoba, pies z imienia: „This is Ruby — her name, in Morse code,
  so I carry her with me every single day." Nagłówek zbija obiekcję, nie cenę:
  „No fading. No tarnishing."
- *The Little Keepsake Company* — stos dowodu: 15 000 klientów, dwie cytowane recenzje,
  srebro hipoalergiczne, Klarna.
- *Say Anything* — sprzedaje **kategorię pamiątki** (odcisk palca / pismo / stópka / łapa),
  nie produkt dla psa.

**Najmocniejsza luka.** Kelly Images Ph ciągnie na Messengera hakiem „Free mockup preview
before production". A `_patterns.json` mówi: „obiecuje podgląd/proof przed produkcją
**0/15**". Obietnica projektu do akceptacji przed produkcją działa jako hak w reklamie
i nie stoi na PDP ani jednego ze zbadanych sklepów.
