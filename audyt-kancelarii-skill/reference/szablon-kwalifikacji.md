# Szablon kwalifikacji leada

Dokument **wewnętrzny FORMA** — nie część raportu `audyt.md`, nie trafia do klienta ani do
`mail-observation.txt`. Wypełnij po Kroku 5 (`SKILL.md`) dla każdej ocenionej kancelarii i zapisz
jako `output/<domena>/kwalifikacja-leada.md`. Pełne kryteria: `reference/kryteria-audytu.md` →
„Ocena leada"; kanoniczny schemat pól JSON: `reference/schemat-audyt-dane.json` →
`kwalifikacja_leada`.

---

## [nazwa kancelarii] — [url]

**Decyzja:** `PISAĆ` / `ODPUŚCIĆ` / `OCENA WSTĘPNA — ZA MAŁO DANYCH`
**Scoring:** [suma]/8

| Wymiar | Punkty | Uzasadnienie (fakt ze źródła, nie przypuszczenie) |
|---|---|---|
| A — Potrzeba przebudowy | [0–2] | [np. Google Sites, brak mobile — `priorytet_wizualny` + `ageSignals`] |
| B — Potencjał finansowy | [0–2] | [np. 4 prawników, obsługa firm, 2 lokalizacje — `teamPage`] |
| C — Skala możliwej poprawy | [0–2] | [różnica między B a tym, co pokazuje strona] |
| D — Naturalny powód do kontaktu | [0–2] | [np. ostatni wpis 2019 — `newsPage`, konkretny błąd ze zrzutu] |

**Powód biznesowy (1 zdanie):** [dlaczego TA kancelaria konkretnie ma widoczny, uzasadniony powód
zapłacić 4 500–6 500 zł za nową stronę — nie ogólnik typu „strona wygląda staro"]

**Mocne przesłanki (max 3, muszą być widoczne dla realnego odwiedzającego, nie tylko w narzędziu):**
1. [przesłanka]
2. [przesłanka]
3. [przesłanka]

**Co jest kosmetyką (sygnały, które NIE wystarczają same w sobie — `co_jest_kosmetyka`):**
- [np. stary copyright, przeciętne ikony, dużo pustego miejsca]

---

**Test przed zapisem `PISAĆ`:**
- Czy suma ≥7 wynika z ≥1 mocnej przesłanki widocznej dla realnego odwiedzającego, a nie
  wyłącznie z wieku strony / kosmetyki / błędu widocznego tylko w narzędziu (Lighthouse, kod
  źródłowy)? Jeśli nie — `validate-lead.js` to odrzuci (reguła 9).
- Czy żadna z „mocnych przesłanek" nie powtarza się w `co_jest_kosmetyka`? Jeśli tak — sprzeczność
  (reguła 10), popraw przed zapisem.
- Czy po odjęciu kosmetyki coś jeszcze zostaje? Jeśli nie — to nie jest lead, zmień na `ODPUŚCIĆ`.

Dla `5–6` i `0–4`: bez obserwacji, bez zapisu do arkusza — `node scripts/log-odrzucone.js <domena>
<scoring_0_8> "<powod>"`. Ten szablon nadal warto wypełnić lokalnie (dokumentuje decyzję), ale nie
twórz `mail-observation.txt` ani nie wysyłaj przez `push-import.js`.
