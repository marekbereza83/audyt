# Webhook do arkusza — wdrożenie (raz)

`Code.gs` dopisuje rodzynki (7–8/8, PISAĆ) do zakładki **Claude_import** w arkuszu
`FORMA-cold-outreach-tracker` i sam sprawdza duplikaty względem **Tracker** + **Claude_import**.

Konektor Google Drive w Claude Code potrafi arkusz tylko *czytać* — i to niepełnie (renderuje
go do tekstu i przycina; „Tracker" wraca obcięty). Dlatego zapis **i** dedup idą przez ten skrypt:
sprawdzenie duplikatu dzieje się w chwili zapisu, pod `LockService`, więc równoległy zapis
drugiej automatyzacji nie prześlizgnie się między odczytem a dopisaniem.

**Tracker jest tylko do odczytu.** Skrypt nigdy do niego nie pisze.

## Kroki

1. Otwórz arkusz → **Rozszerzenia → Apps Script**.
2. Wklej zawartość `Code.gs` (zastąp domyślny `myFunction`). Zapisz.
3. Uruchom funkcję **`setup()`**. Zaakceptuj uprawnienia (skrypt jest Twój, ostrzeżenie
   „aplikacja niezweryfikowana" → *Zaawansowane* → *Przejdź do…*).
   W logu (**Ctrl+Enter**) pojawi się `SEKRET` — skopiuj.
4. **Wdróż → Nowe wdrożenie → typ: Aplikacja internetowa**
   - Wykonaj jako: **Ja**
   - Kto ma dostęp: **Wszyscy** ← wymagane, żeby dało się wołać POST-em bez OAuth;
     bez sekretu z kroku 3 skrypt i tak nic nie zapisze.
5. Skopiuj **URL aplikacji internetowej**.
6. Dopisz do `scripts/.env` (plik gitignorowany):

   ```
   SHEETS_URL=https://script.google.com/macros/s/.../exec
   SHEETS_SECRET=<sekret z kroku 3>
   ```

7. Sprawdź: `cd scripts && node push-import.js --ping`

## Po zmianie kodu

Każda edycja `Code.gs` wymaga **Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa**.
Bez tego URL serwuje starą wersję.

## Funkcje do ręcznego uruchomienia

| Funkcja | Do czego |
|---|---|
| `setup()` | tworzy `Claude_import` z nagłówkami, generuje `SEKRET`. Bezpieczna do powtórzenia — istniejącej zakładki nie rusza |
| `diagnose()` | wypisuje nagłówki obu zakładek i liczbę kluczy dedupu. Odpal, jeśli w arkuszu zmieniły się nazwy kolumn |

## Endpointy webhooka

| Wywołanie | Sekret | Do czego |
|---|---|---|
| `GET <URL>` | nie | ping — czy wdrożenie żyje i ile kolumn ma `Claude_import` |
| `GET <URL>?akcja=klucze&sekret=…` | **tak** | klucze dedupu z `Trackera` + `Claude_import` — używa ich `scripts/dedup-gate.js`, żeby odsiać znane kancelarie **zanim** audyt spali budżet Firecrawl |
| `POST <URL>` | **tak** | zapis rodzynków (patrz niżej) |

Tryb `klucze` zwraca zbiorczą listę e-maili/telefonów/domen z arkusza, więc wymaga sekretu.
Ten sam sekret autoryzuje zapis dowolnych wierszy przez POST — czyli uprawnienie ściśle
większe — więc nie poszerza to granicy zaufania.

## Układ kolumn `Claude_import`

Pierwsze **13** kolumn to kolumny **C..O Trackera**, w tej samej kolejności i pod tymi samymi
nazwami (`Nazwa kancelarii` … `data_audytu`) — zatwierdzony blok wkleja się do Trackera bez
mapowania pól. Kolejne 8 (`potrzeba_0_2` … `data_dodania`) to ślad audytu: rozbicie punktacji
A/B/C/D, mocne przesłanki, co jest kosmetyką, odwiedzone podstrony. Do Trackera nie idą.

Ostatnia, **22.** kolumna to `status_importu` — webhook zawsze zapisuje `NOWY`. Druga
automatyzacja (ChatGPT: weryfikacja, treść maila, szkic Gmail, aktualizacja Trackera) po
przejęciu rekordu zmienia go ręcznie/programowo na `PRZEJĘTY`. Ten skrypt nigdy nie ustawia
`PRZEJĘTY` — tylko odczytuje/zapisuje `NOWY` przy imporcie.

Granicę bloku wklejanego do Trackera zaznacza pionowa linia po kolumnie 13.

## Dedup

Klucze, w kolejności ważności: **email → telefon → domena**. Wiersz jest duplikatem, jeśli
trafi *którykolwiek*.

- e-mail: lowercase, musi wyglądać jak adres
- telefon: same cyfry, ostatnie 9 (odcina `+48`, spacje, myślniki)
- domena: bez `http(s)://`, `www.`, ścieżki, portu i końcowego ukośnika

Domena celowo **nie jest** kluczem głównym: w Trackerze `Strona www` bywa opisem, nie adresem
(FW-0006 ma tam „Adwokat Ełk"). Taki wiersz nie wnosi klucza domenowego, ale nadal ma e-mail.

Lead bez **żadnego** klucza nie jest zapisywany — wraca w raporcie jako `bez_klucza`
(„DO RĘCZNEJ WERYFIKACJI"), zgodnie z zasadą procesu.

## Co skrypt odrzuca sam

- `scoring_0_8` spoza 7–8 (parsuje też format tekstowy `„7/8"`, którego używa Tracker)
- `decyzja` inna niż `PISAĆ`
- duplikaty — także w obrębie jednej paczki
