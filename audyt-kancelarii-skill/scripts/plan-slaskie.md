# Plan wyczerpania woj. śląskiego (metoda 9-fraz, `apify-search.js --miasto`)

Cel: wyczerpać Apify (9 fraz z `FRAZY` w `apify-search.js`) po kolei dla każdego miasta
na prawach powiatu w woj. śląskim, potem dedup-gate (darmowe) → peek-triage (darmowe) →
pełny audyt tylko w ramach budżetu Firecrawl (160/mies.).

Źródło prawdy o tym, co realnie odpalono przez Apify: `scripts/przeszukane.csv` (dataset_id,
koszt, data). Ten plik to tylko checklista zakresu/kolejności — nie duplikuj tam kosztów.

## Miasta (19 na prawach powiatu)

| Miasto | Apify (9 fraz) | Dedup+peek | Pełny audyt | Uwagi |
|---|---|---|---|---|
| Katowice | ✅ 2026-08-04 | częściowo (batch Katowice+Gliwice) | częściowo | starszy przebieg (5 fraz) + dobitka (9 fraz) |
| Gliwice | ✅ 2026-08-04 | ✅ | ✅ | w batchu Katowice+Gliwice |
| Bielsko-Biała | ✅ 2026-08-29 | ✅ | ✅ | 13 firm zaudytowanych 2026-08-30, 3× PISAĆ |
| Sosnowiec | ✅ 2026-08-30 ($0.288, 48 wyników) | ✅ 41 ocenionych (4 wysoki / 8 sredni / 25 niski / 4 do sprawdzenia) | ⬜ | 12 do audytu |
| Częstochowa | ✅ 2026-08-30 ($0.000, 52 wyników) | ✅ 39 ocenionych (5 wysoki / 5 sredni / 29 niski) | ⬜ | 10 do audytu |
| Zabrze | ✅ 2026-08-30 ($0.252, 42 wyników) | ✅ 29 ocenionych (1 wysoki / 4 sredni / 22 niski / 2 do sprawdzenia) | ⬜ | 5 do audytu; w liście był przeciek „Urząd Miejski w Zabrzu" |
| Dąbrowa Górnicza | ✅ 2026-08-30 ($0.216, 36 wyników) | ✅ 24 ocenionych (5 wysoki / 7 sredni / 12 niski) | ⬜ | 12 do audytu; najwyższy odsetek starych stron |
| Bytom | ⬜ | ⬜ | ⬜ | |
| Chorzów | ⬜ | ⬜ | ⬜ | |
| Jastrzębie-Zdrój | ⬜ | ⬜ | ⬜ | |
| Jaworzno | ⬜ | ⬜ | ⬜ | |
| Mysłowice | ⬜ | ⬜ | ⬜ | |
| Piekary Śląskie | ⬜ | ⬜ | ⬜ | |
| Ruda Śląska | ⬜ | ⬜ | ⬜ | |
| Rybnik | ⬜ | ⬜ | ⬜ | stara szeroka lista częściowo zdedupowana (2 firmy sredni przeszły bramkę 2026-08-30) |
| Siemianowice Śląskie | ⬜ | ⬜ | ⬜ | |
| Świętochłowice | ⬜ | ⬜ | ⬜ | |
| Tychy | ⬜ | ⬜ | ⬜ | stara szeroka lista częściowo zdedupowana (3 firmy sredni przeszły bramkę 2026-08-30) |
| Żory | ⬜ | ⬜ | ⬜ | |

## Uwaga o starym datasecie `apify-slaskie-*`

`output/apify-slaskie-wysoki.csv` i `output/apify-slaskie-priorytet-wizualny.csv` (452 rekordy,
run 2026-08-29, jedna płytka fraza na cały region) pochodzą ze STAREGO, nie-wyczerpującego
przebiegu. 2026-08-30: przepuszczone przez `dedup-gate.js` — 45/47 sprawdzonych (Tychy+Rybnik
+ 37 innych miast) to duplikaty względem arkusza (już zaudytowane gdzie indziej, poza tym
repo). Przeszło tylko 5 (3 Tychy + 2 Rybnik, priorytet sredni) — leżą w
`output/do-peek-tychy.csv` i `output/do-peek-rybnik.csv`, gotowe do peek-triage.
**Ten stary dataset NIE jest wiarygodnym źródłem „co jeszcze zostało" dla pozostałych miast**
— stąd plan wyczerpania każdego miasta osobno, 9 frazami, jak Katowice/Gliwice/Bielsko-Biała.

## Koszt na bieżąco

Sumuj z `przeszukane.csv` kolumnę `koszt_usd` dla wierszy z datą ≥ 2026-08-30, żeby widzieć
realny koszt tej rundy niezależnie od budżetu Firecrawl (osobny licznik, `budzet-firecrawl.json`).

## Triage wizualny 2026-08-30 — wynik

145 firm z 4 miast przeszło Krok 0 wyłącznie ze zrzutów `--peek` (koszt Firecrawl: 0).
Wyniki: `output/triage-<miasto>.csv`, zbiorczo `output/triage-slaskie-2026-08-30.csv`,
lista do pełnego audytu `output/triage-slaskie-2026-08-30-wysoki-sredni.csv`.

| | Sosnowiec | Częstochowa | Zabrze | Dąbrowa G. | Razem |
|---|---|---|---|---|---|
| wysoki | 4 | 5 | 1 | 5 | **15** |
| sredni | 8 | 5 | 4 | 7 | **24** |
| niski | 25 | 29 | 22 | 12 | 88 |
| do sprawdzenia | 4 | 0 | 2 | 0 | 6 |
| bez zrzutu | 2 | 1 | 3 | 6 | 12 |

**Do pełnego audytu kwalifikuje się 39 firm (15 wysoki + 24 sredni).** Budżet Firecrawl
przed tą decyzją: 35/160 w 2026-08 — 39 audytów mieści się w limicie (→ 74/160).

Uwagi z przebiegu:
- `lipinska-radca.pl` robi 301 na `lexduo.pl` — ta sama strona pod dwiema domenami,
  werdykt dziedziczony, do audytu iść ma tylko jedna. Warto dodać rozwijanie przekierowań
  do `dedup-gate.js`.
- Na liście Zabrza był „Urząd Miejski w Zabrzu" — Apify wpuszcza podmioty niebędące
  kancelariami; filtr po `categories` wyciąłby to za darmo.
- 6 werdyktów `do sprawdzenia` to głównie artefakty (pusty zrzut, ekran Cloudflare, 404)
  — przed wysyłką wymagają spojrzenia na żywo, nie nadają się na materiał do maila.
