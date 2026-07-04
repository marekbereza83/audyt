# Szablon raportu audytu

Wypełnij ten szablon danymi z audytu. Usuń komentarze w nawiasach `[…]`. Zachowaj ton merytoryczny — fakt, konsekwencja, rozwiązanie.

---

# Audyt strony: [nazwa lub „kancelaria z {region}" jeśli publiczny]

**URL:** [url]
**Data:** [data]
**Score ogólny:** [X]/100 — tier [wysoki/średni/niski/krytyczny]
**Ocena wizualna:** [wysoki/średni/niski priorytet — jedno zdanie werdyktu, np. „strona wygląda na projekt sprzed ~10 lat (copyright 2017 w stopce, wąski layout w ramce)"]
**Względem rynku:** [powyżej / na poziomie / poniżej] mediany 21 polskich kancelarii (60/100)

---

## Mówiąc wprost

[**Zacznij od tego, jak strona WYGLĄDA** oczami klienta trafiającego pierwszy raz — z konkretami ze screenshota (ocena wizualna z Kroku 2). To jest główny powód, dla którego kancelaria zdecyduje się na zmianę. Potem 2–4 zdania o najważniejszych problemach przez ich **skutek dla klienta** — **ZERO żargonu technicznego** (żadnego HTTPS, LCP, viewport, H1, JSON-LD, schema, CTA, meta). Ton rozmowy, bezpośredni zwrot („Pana/Pani strona"). Zakończ zdaniem, czy to szybkie poprawki, czy przebudowa. **To z tej sekcji wyciągasz 2–3 zdania do cold maila** — reszta raportu (techniczna) zostaje do rozmowy.]

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

> **Notatka (nie część raportu):** Ta sekcja może zostać technicznie szczegółowa — to dokument wewnętrzny FORMA. **Nie jest już jednak bezpośrednim źródłem `mail-fragment.txt`.** `mail-fragment.txt` to teraz jedno pytanie/miękka obserwacja bez żargonu technicznego (patrz `SKILL.md` → Krok 5) — audyt dostarcza tylko najmocniejszy sygnał do przetłumaczenia, nie gotowe zdanie z tej sekcji. W trybie wsadowym wszystkie fragmenty trafiają do `output/batch-fragments.csv` (`node batch-report.js <lista.csv>`).
