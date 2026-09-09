# Kryteria oceny sklepu ecommerce — 9 obszarów

Warstwa INTERPRETACJI. Fakty daje `store-data.json`, częstotliwości `_patterns.json` — tutaj jest to, co z nimi zrobić.

**Zasada wspólna z audytem kancelarii: każda ocena z danych.** Wskaż pole albo zrzut. Bez podstawy nie zapisuj oceny.

**Nie ma tu scoringu 0–100.** W audycie kancelarii score miał sens, bo porównywaliśmy jedną stronę do benchmarku jakości. Tutaj celem nie jest ocenić konkurenta, tylko **zrozumieć jego decyzję projektową** i ustalić, czy chcemy ją powtórzyć. „Sklep X ma 62/100" nie pomaga zbudować własnego PDP.

Zamiast oceny — dla każdego obszaru odpowiedz na trzy pytania:
1. **Co ten sklep robi?** (fakt + podstawa)
2. **Czy to standard kategorii, czy odchylenie?** (porównaj z `_patterns.json`)
3. **Czy chcemy to powtórzyć?** (i dlaczego — z uzasadnieniem, nie z gustu)

---

## 1. Zgięcie — co widać bez scrolla

Źródła: `zgiecie.*`, `cenaNadZgieciem`, `atcNadZgieciem`, zrzuty `*-fold.png` (desktop i mobile osobno).

Pytania: Czy klient w pierwszej sekundzie wie, co to za produkt, ile kosztuje i jak go kupić? Co zajmuje najwięcej miejsca nad zgięciem — zdjęcie, nagłówek, czy element bez funkcji sprzedażowej? Czy na mobile zgięcie wygląda tak samo sensownie jak na desktopie?

Uwaga: zgięcie na mobile to inne pytanie niż na desktopie i praktycznie zawsze jest ciaśniejsze. Sprawdź `roznicaDesktopMobile`.

## 2. Kolejność sekcji

Źródła: `kolejnoscSekcji`, `sekcje[]` (z `y`, `wysokoscPx`, `ekranow`), `_patterns.json → sekcje`.

Pytania: W jakiej kolejności sklep prowadzi klienta? Której sekcji dał najwięcej miejsca (`ekranow`) — i czy to zgadza się z tym, co deklaruje jako najważniejsze? Gdzie leżą opinie względem ceny? Czy strona jest długa (mediana kategorii z `_patterns.json`) czy krótka i dlaczego?

Wysokość sekcji jest tu ważniejsza niż jej obecność — to, czemu autor poświęcił trzy ekrany, jest jego realnym argumentem sprzedażowym.

## 3. Personalizacja — mechanika, nie deklaracja

Źródła: `personalizacja.*`, `aplikacje.personalizacja`, `shopify.opcje`, zrzuty.

Pytania: Gdzie klient wgrywa zdjęcie — na PDP przed zakupem, czy dopiero po (mailem/linkiem)? Ile pól musi wypełnić przed dodaniem do koszyka? Czy widzi podgląd (`maCanvas`, aplikacja) czy kupuje w ciemno? Czy obiecuje się akceptację projektu przed produkcją (`obiecujePodgladDoAkceptacji`)? Jaka aplikacja to obsługuje?

To jest obszar o najwyższej wartości informacyjnej dla produktu personalizowanego — tu leży największa różnica między sklepem, który konwertuje, a takim, który zbiera porzucone koszyki. Zwróć uwagę na `shopify.opcje` i nazwy `properties[...]` — zdradzają dokładną mechanikę.

Rozróżnij trzy modele: **upload przed zakupem** (najwyższe tarcie, najniższy support), **upload po zakupie** (niższe tarcie, ryzyko niedostarczonych zdjęć), **bez zdjęcia** (grawer tekstowy — to inny produkt, nie porównuj wprost).

## 4. Ścieżka do zakupu

Źródła: `przyciskiAkcji[]` (tekst, `y`, `sticky`, wymiary), `atcSticky`, `warianty.*`.

Pytania: Ile jest przycisków ATC i gdzie? Czy pasek jest sticky na mobile (`_patterns.json` mówi, jak rzadko)? Jak nazwany jest przycisk — neutralnie („Dodaj do koszyka") czy z obietnicą? Ile decyzji klient musi podjąć przed kliknięciem (warianty + pola personalizacji)?

## 5. Zaufanie i social proof

Źródła: `zaufanie.*`, `aplikacje.opinie`, `produktLd.ocena`, zrzuty sekcji opinii.

Pytania: Czym dowodzą — liczbą opinii, oceną, zdjęciami klientów (`maZdjeciaWOpiniach`), badge'ami? Czy opinie są przy produkcie, czy dopiero na dole? Czy pokazują zdjęcia realnych realizacji (przy personalizacji to jest dowód jakości wykonania, nie tylko społeczny)? Jaka aplikacja i czy to widget zewnętrzny, czy własna sekcja?

Przy produkcie personalizowanym UGC pełni podwójną rolę: dowód społeczny **i** próbka jakości. Sprawdź, czy sklep to wykorzystuje.

## 6. Obsługa obiekcji

Źródła: `dostawa.*`, `zaufanie.gwarancja`, sekcje `faq`/`gwarancja`/`jak-to-dziala`, zrzuty.

Standardowe obiekcje przy personalizowanym prezencie — sprawdź, które sklep zbija i gdzie:
- „A jeśli wyjdzie źle / nie będzie podobne?" → podgląd, proof, gwarancja, zdjęcia realizacji
- „Zdąży na termin?" → `maKonkretnaDate`, czas produkcji + czas dostawy rozdzielone
- „Czy mogę zwrócić rzecz z moim zdjęciem?" → `fazyZwroty` (uwaga: personalizowane bywa wyłączone ze zwrotu — sprawdź, czy komunikują to uczciwie)
- „Jak dobre będzie zdjęcie / co jeśli mam słabe?" → wymagania dot. zdjęcia, pomoc przy wyborze
- „Czy to trwałe?" → materiał, gwarancja

Obiekcja niezbita nigdzie na stronie to konkretna luka — zanotuj ją jako taką.

## 7. Oferta

Źródła: `oferta.*`, `shopify.cenaMin/cenaMax/liczbaWariantow`, `cenaPorownawcza`, `aplikacje.upsell`.

Pytania: Jak zbudowana jest cena (kotwica, przekreślenie, próg ilościowy)? Czy jest bundle i czy ma sens produktowy, czy jest doklejony? Czym uzasadniają wyższą cenę, jeśli są drożsi od mediany? Czy pilność jest prawdziwa (stan magazynu) czy dekoracyjna (licznik resetujący się co wejście)?

Porównaj `shopify.cenaMin` z ceną obserwowaną w reklamie (`kontekstRynkowy.cena_obs`) — rozbieżność zdradza strategię promocyjną albo to, że reklama pokazuje inny wariant.

## 8. Mobile

Źródła: `mobile.*` (osobny przebieg), `roznicaDesktopMobile`, zrzuty `mobile-*.png`.

Pytania: Czy kolejność sekcji jest ta sama (`kolejnoscSekcjiIdentyczna`)? Czy ATC jest osiągalny (`atcNadZgieciem` mobile vs desktop, `atcSticky`)? Ile celów dotykowych poniżej 44 px? Czy strona przewija się poziomo (`przewijaPoziomo` — to zawsze błąd)? Ile popupów?

Mobile to nie jest „ten sam sklep, węższy". Jeśli sklep ma tam inną kolejność sekcji, to jest świadoma decyzja — opisz ją.

## 9. Anomalie i whitespace

Źródła: `_patterns.json → kandydaciNaWhitespace`, `najwiekszeRoznicePaid`, plus własna obserwacja ze zrzutów.

**Najważniejszy obszar i jednocześnie najłatwiejszy do zepsucia.**

Rzadkość cechy NIE równa się okazji. Dla każdego kandydata rozstrzygnij, które wyjaśnienie wybierasz:
- **okazja** — nikt tego nie robi, bo nie wpadł albo bo wymaga pracy, której nikt nie chciał wykonać;
- **pułapka** — nikt tego nie robi, bo próbowano i nie działa, jest drogie operacyjnie, albo łamie prawo/politykę reklamową.

Sygnał rozstrzygający, jeśli jest dostępny: czy cecha występuje częściej u sklepów z budżetem reklamowym (`najwiekszeRoznicePaid`). Jeśli tak — bliżej okazji. Jeśli występuje wyłącznie u sklepów bez reklam — ostrożnie, może być śladem po czymś, co nie wypaliło.

Szukaj też anomalii poza tabelą cech: sklep, który robi coś zupełnie inaczej niż wszyscy i **jednocześnie ma silny sygnał paid**, jest ciekawszy niż dziesięć sklepów robiących to samo.

---

## Czego NIE robić

1. **Nie oceniaj estetyki jako celu.** „Ładna strona" nie jest wnioskiem. Wniosek to „zdjęcie produktu zajmuje 2 ekrany przed pierwszym argumentem sprzedażowym".
2. **Nie zakładaj, że częste = skuteczne.** Częste może znaczyć „ten sam motyw Shopify" albo „wszyscy kopiują lidera".
3. **Nie traktuj liczby aktywnych reklam jako dowodu zysku.** To dowód wydatku.
4. **Nie mieszaj produktów.** Grawer tekstowy, portret ze zdjęcia i symbol łapy to trzy różne produkty z trzema różnymi ścieżkami zakupu — porównywanie ich wprost zafałszuje wnioski.
5. **Nie buduj wniosku na `typGuess`** bez sprawdzenia na zrzucie. To heurystyka słownikowa.
6. **Nie zaokrąglaj małego n do procentów.** Przy 12 sklepach pisz „6 z 12".
