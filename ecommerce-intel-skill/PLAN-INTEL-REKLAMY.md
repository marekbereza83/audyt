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

## Zrobione (2026-09-10)

### A. Zweryfikowane podejrzane skany — trzy z siedmiu odwrócone

Obejrzane `output/<domena>/desktop-full.png` dla trzech nowych marek, które
`patterns.js` wyrzucił z mianownika:

- **`morganandfrench.com`** (flaga: 2 sekcje) — zrzut pokazuje pełny, bogaty PDP:
  recenzje (5/5, kilka realnych), formularz personalizacji z 9 polami, sekcja
  „Co się dzieje po zamówieniu", produkty powiązane. Fałszywy alarm sondy.
- **`callie.com`** (flaga: 1 sekcja) — zrzut pokazuje kompletną stronę: wybór
  kamienia urodzeniowego, 16 recenzji z weryfikacją zakupu, opis, 20 produktów
  „You might also like". Fałszywy alarm.
- **`thelittlekeepsakecompany.com`** (flaga: 1 sekcja) — zrzut pokazuje pełny PDP:
  opcje grawerunku, cena przekreślona (−25%), opis, 21 recenzji, 4 produkty
  powiązane. Fałszywy alarm.

**Wniosek: to nie jest problem z danymi, to luka w heurystyce liczenia sekcji
w `dom-probe.js`** — prawdopodobnie nie rozpoznaje niestandardowego markupu tych
trzech motywów. Zgodnie z regułą „zrzut wygrywa z licznikiem" te trzy sklepy
są w rzeczywistości pełnoprawnymi skanami, ale **zostają wyłączone z mianownika
`patterns.js`**, bo poprawka heurystyki sekcji to zmiana we wspólnej sondzie
(`extractors/dom-probe.js`), która wpływa na wszystkie 22 skany naraz — osobna
decyzja, nie coś do przemycenia przy okazji. Pozostałe cztery flagi
(`boltiesd.com`, `ipetprints.com`, `joyfora.com`, `lucea.pl`) niesprawdzone —
te są z pierwotnej listy, nie z dzisiejszej poprawki.

### B. Poprawione `rola` i `angle` dla trzech pozycji z pierwotnej listy

Youtua, Febworld i Provcustom miały w CSV `rola: konkurent-bezposredni`. Zmierzone
liczniki **per strona reklamodawcy** (`view_all_page_id`, nie słowo kluczowe —
patrz uwaga wyżej) pokazują, że żadna nie reklamuje naszyjnika ze zdjęciem zwierzęcia:

| Marka | Reklamy (per strona) | Co faktycznie reklamuje |
|---|---|---|
| Febworld | 450 | wycieraczki, breloki, koszulki 3D, etui, plakaty memorial; reklamy żywe od XI 2022 |
| Youtua | 260 | bombki choinkowe, breloki dla pielęgniarek i fryzjerek |
| Provcustom | 81 | wesela, niemowlaki, dziennik żałoby, kaczka ze zdjęcia; druga marka „Customcraft online gifts store" na tej samej domenie |

Zapisane w CSV: `rola → reseller-generyczny` (ten sam label co Thejoydeal),
`angle → prezent-generyczny-pod`, `zrodlo → ad-library-strona-2026-09-10`,
`uwagi` z uzasadnieniem i page_id. Przeskanowane ponownie, żeby `kontekstRynkowy`
w `store-data.json` niósł poprawione dane (sam zapis w CSV nic nie zmienia —
`patterns.js` czyta ze skanu, nie z pliku wejściowego).

Segmentacja paid nie zmieniła się liczebnie (nadal 7/8) — wszystkie trzy liczniki
per-strona (450/260/81) zostają ponad progiem 50, mimo że są niższe od pierwotnych
keywordowych (460/304/123 — patrz uwaga o metodologii wyżej).

**Obserwacja poboczna, niezweryfikowana:** `callie.com`, przy oglądaniu zrzutu
pod A, okazał się szerokim katalogiem biżuterii spersonalizowanej (rodzina,
pary, zwierzęta, imiona) z sekcją „You might also like" pełną niepowiązanych
wzorów — ten sam kształt co Febworld/Youtua/Provcustom, nie wąska marka pod
zwierzęta jak Morgan & French czy Tulas. `rola: konkurent-sasiedni` może być
zbyt hojna etykieta; niesprawdzone do końca, zostawione bez zmian.

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
