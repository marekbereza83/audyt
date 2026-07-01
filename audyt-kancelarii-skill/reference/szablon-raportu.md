# Szablon raportu audytu

Wypełnij ten szablon danymi z audytu. Usuń komentarze w nawiasach `[…]`. Zachowaj ton merytoryczny — fakt, konsekwencja, rozwiązanie.

---

# Audyt strony: [nazwa lub „kancelaria z {region}" jeśli publiczny]

**URL:** [url]
**Data:** [data]
**Score ogólny:** [X]/100 — tier [wysoki/średni/niski/krytyczny]
**Względem rynku:** [powyżej / na poziomie / poniżej] mediany 21 polskich kancelarii (60/100)

---

## Mówiąc wprost

[2–4 zdania dla właściciela kancelarii — **ZERO żargonu technicznego** (żadnego HTTPS, LCP, viewport, H1, JSON-LD, schema, CTA, meta). Nazwij 2–3 najważniejsze problemy przez ich **skutek dla klienta**, nie przyczynę techniczną. Ton rozmowy, bezpośredni zwrot („Pana/Pani strona"). Zakończ zdaniem, czy to szybkie poprawki, czy przebudowa. **To z tej sekcji wyciągasz 2–3 zdania do cold maila** — reszta raportu (techniczna) zostaje do rozmowy.]

[Wzór tłumaczenia technika → człowiek:
- brak HTTPS → „przeglądarka straszy klienta ostrzeżeniem o niebezpiecznej stronie — część osób od razu zamyka kartę"
- wolne ładowanie (LCP) → „strona ładuje się na tyle wolno, że klient zdąży się rozmyślić i wrócić do Google"
- brak wersji mobilnej (viewport) → „na telefonie strona wygląda jak pomniejszony wydruk — trudno cokolwiek kliknąć, a większość klientów szuka z telefonu"
- CTA = nawigacja → „nigdzie nie ma jasnego »napisz do mnie« — kto chce się odezwać, musi sam szukać jak"
- brak H1 → „Google nie wie, czym właściwie zajmuje się ta kancelaria, więc trudniej ją znaleźć"]

---

## Co działa

[2–4 punkty. Zacznij od pozytywów — to nie tylko uprzejmość, to wiarygodność. Każdy punkt konkretny.]

- **[Wymiar]** — [co konkretnie jest dobre i dlaczego pomaga klientowi]

---

## Co można poprawić

[Priorytetyzowane: najpierw to, co najmocniej wpływa na konwersję. Każdy punkt: fakt → konsekwencja.]

### 🔴 Priorytet wysoki

- **[Problem — fakt]**
  Konsekwencja: [dlaczego to kosztuje kancelarię klientów]

### 🟡 Priorytet średni

- **[Problem]** — [fakt + konsekwencja w jednym zdaniu]

### 🟢 Drobne

- [Drobne usprawnienia]

---

## Jak bym to rozwiązał

[Dla każdego problemu z sekcji wyżej — konkretne rozwiązanie. To pokazuje ekspertyzę i jest naturalnym mostem do oferty. **Każda rekomendacja MUSI mieć parę wysiłek + efekt** z „Mapy wysiłek/efekt" w `kryteria-audytu.md`. **Listuj najpierw poprawki tanie o wysokim efekcie**, na końcu kosztowne przebudowy.]

1. **[Problem]** → [konkretne rozwiązanie z przykładem] — *[wysiłek] → [efekt]*
   (np. „HTTPS → 1 wieczór, efekt natychmiastowy"; „meta viewport → 1 linijka kodu, efekt natychmiastowy")

---

## Porównanie z rynkiem

[Wstaw 2–3 fakty z benchmarku, które dotyczą tej strony.]

- [np. „CTA w hero ma tylko 6 z 21 kancelarii — dodanie go to przewaga nad 71% rynku."]

---

## Co robi konkurencja

[**Sekcja opcjonalna — tylko gdy istnieje `competitor.json`. Jeśli go nie ma, pomiń całą sekcję (łącznie z nagłówkiem).**]

[2–3 konkretne rzeczy, które konkurent ma, a audytowana strona nie — wyłącznie z danych `competitor.json` (`content` + `vitals`). Ton merytoryczny: **nie** „konkurent jest lepszy", tylko „konkurent ma X, czego tu brakuje, i dlaczego to dla klienta/Google różnica". Anonimizuj nazwę konkurenta, jeśli audyt jest publiczny (np. „inna kancelaria z regionu").]

- **[Co konkurent ma]** — [fakt z danych konkurenta] vs [stan audytowanej strony]. [Dlaczego klient lub Google to nagradza.]
  [np. „Konkurent ma HTTPS i CTA w hero („Umów konsultację") — ta sama grupa klientów trafia najpierw na stronę bez ostrzeżenia przeglądarki i z jasną ścieżką kontaktu."]

---

## Szacowany wpływ na konwersję

[Ostrożny, uczciwy szacunek. Nie obiecuj liczb, których nie da się dowieść.]

Największy potencjał: [1 zdanie — co da największy zwrot]. Pozostałe zmiany [poprawiają / porządkują / wzmacniają] doświadczenie klienta i wiarygodność kancelarii.

---

*Audyt przygotowany przez FORMA — strony internetowe dla kancelarii prawnych. formawizerunku.pl*

---

## Ocena leada

> **Sekcja wewnętrzna (FORMA) — NIGDY nie wysyłaj jej kancelarii.** Kwalifikacja: czy warto pisać cold mail. Ton biznesowy, każda odpowiedź z danych. Progi i logika: `kryteria-audytu.md` → „Ocena leada".

**Werdykt:** [🟢 PISZ TERAZ / 🟡 PISZ INACZEJ / 🔴 ODPUŚĆ] — [liczba „tak", P1 ×2]

[Jeśli P1 = `za-malo-danych` z powodu niejednoznacznych sygnałów statusu — napisz tu wprost: „⚠️ P1 wymaga oceny na screenshocie".]

| # | Pytanie | Odpowiedź | Uzasadnienie (z danych) |
|---|---|---|---|
| **P1 ⭐** | Kancelaria zamożniejsza niż jej strona? (rozdźwięk, waga ×2) | tak / nie / za mało danych | [status vs score — 1 zdanie] |
| P2 | Strona starsza niż 6–7 lat? | tak / nie / za mało danych | [ageSignals + https/mobile] |
| P3 | Budżet 5–10 tys. zł bez problemu? | tak / nie / za mało danych | [specjalizacja/zespół/miasto] |
| P4 | Nowa strona poprawi pierwszy kontakt? | tak / nie | [problemy pierwszego wrażenia z audytu] |
| P5 | Brak świeżych inwestycji w stronę? | tak / nie / za mało danych | [JSON-LD/SEO/copyright/HTTPS] |

**Dostępność kontaktu:** [osobisty email `imie.nazwisko@` / `biuro@` (zginie w sekretariacie) / brak — czerwony flag]

**Rekomendowane podejście:** [dla 🟢: „standardowy cold mail z audytem". Dla 🟡: JAKIE inne podejście (np. „strona dobra — zaproponuj X zamiast listy problemów" lub „bardzo słaba — zacznij pytaniem, nie audytem"). Dla 🔴: powód odpuszczenia.]

---

> **Notatka (nie część raportu):** Fragment do maila generowany jest osobno do `mail-fragment.txt` — bierze najważniejszy problem z sekcji „Mówiąc wprost", skrócony do 2–4 zdań (maks. ~400 znaków, czysty tekst). W trybie wsadowym wszystkie fragmenty trafiają do `output/batch-fragments.csv` (`node batch-report.js <lista.csv>`).
