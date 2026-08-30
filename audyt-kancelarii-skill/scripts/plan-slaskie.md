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
| Sosnowiec | ✅ 2026-08-30 ($0.288, 48 wyników) | 🔄 peek w toku (43 przeszły dedup) | ⬜ | |
| Częstochowa | ✅ 2026-08-30 ($0.000, 52 wyników) | 🔄 peek w toku (40 przeszły dedup) | ⬜ | |
| Zabrze | ✅ 2026-08-30 ($0.252, 42 wyników) | 🔄 peek w toku (32 przeszły dedup) | ⬜ | |
| Dąbrowa Górnicza | ✅ 2026-08-30 ($0.216, 36 wyników) | 🔄 peek w toku (30 przeszły dedup) | ⬜ | **następny krok po peeku: przejrzeć priorytet_wizualny, zbudować listę do pełnego audytu** |
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
