/**
 * dom-probe.js — funkcja wykonywana WEWNĄTRZ przeglądarki (page.evaluate).
 *
 * Dlaczego DOM, a nie markdown z Firecrawl: większość pytań badawczych o PDP dotyczy
 * UKŁADU — co jest nad zgięciem, w jakiej kolejności idą sekcje, gdzie siedzi przycisk
 * kupna, czy pasek ATC jest sticky na mobile. Markdown to wszystko spłaszcza. DOM ma
 * to wprost, a stronę i tak ładujemy pod zrzuty, więc sonda jest praktycznie darmowa.
 *
 * ZASADA: sonda zwraca FAKTY, nie oceny. Jedyne pola z interpretacją mają w nazwie
 * `Guess` i są wyraźnie heurystyczne — Claude może je nadpisać, patrząc na zrzut.
 * Częstotliwości w raporcie zbiorczym liczy patterns.js z tych faktów, nie AI.
 *
 * Funkcja MUSI być samowystarczalna (Playwright serializuje jej źródło) — żadnych
 * odwołań do scope'u Node, cała konfiguracja wchodzi argumentem.
 */

/* eslint-disable no-undef */
function domProbe(cfg) {
  const out = {};
  const H = window.innerHeight;
  const W = window.innerWidth;

  // ── narzędzia pomocnicze ─────────────────────────────────────────────
  const txt = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const widoczny = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
  };
  // Pozycja bezwzględna od góry dokumentu (nie od viewportu) — porównywalna między sekcjami.
  const absY = (el) => {
    const r = el.getBoundingClientRect();
    return Math.round(r.top + window.scrollY);
  };
  const czyStickyLubFixed = (el) => {
    let n = el;
    for (let i = 0; i < 6 && n && n !== document.body; i++) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
      n = n.parentElement;
    }
    return false;
  };
  const bezpieczny = (s, n) => (s || '').slice(0, n || 160);

  const htmlLower = document.documentElement.innerHTML.toLowerCase();
  const tekstStrony = (document.body.innerText || '').replace(/\s+/g, ' ');
  const tekstLower = tekstStrony.toLowerCase();

  // Wzorce przychodzą jako stringi (RegExp nie przechodzi przez granicę page.evaluate).
  // Zwracamy dopasowany fragment, nie samo true — żeby w danych został dowód, co trafiło.
  const dopasujWzorzec = (klucz) => {
    const src = cfg.regexy && cfg.regexy[klucz];
    if (!src) return null;
    try {
      const m = tekstStrony.match(new RegExp(src, 'i'));
      return m ? m[0].slice(0, 80) : null;
    } catch { return null; }
  };
  const wszystkieDopasowania = (klucz, limit) => {
    const src = cfg.regexy && cfg.regexy[klucz];
    if (!src) return [];
    try {
      const m = tekstStrony.match(new RegExp(src, 'gi')) || [];
      return [...new Set(m.map((x) => x.slice(0, 60)))].slice(0, limit || 5);
    } catch { return []; }
  };

  // ── 1. Tożsamość i platforma ─────────────────────────────────────────
  const meta = (nazwa, atrybut) => {
    const el = document.querySelector(`meta[${atrybut || 'property'}="${nazwa}"]`);
    return el ? el.getAttribute('content') : null;
  };

  out.strona = {
    url: location.href,
    tytul: document.title || null,
    ogTitle: meta('og:title'),
    ogType: meta('og:type'),
    ogImage: meta('og:image'),
    metaOpis: meta('description', 'name'),
    lang: document.documentElement.getAttribute('lang') || null,
    viewport: { w: W, h: H },
    wysokoscStrony: Math.round(document.body.scrollHeight),
    // Ile ekranów ma strona — surogat długości PDP. 12+ ekranów to bardzo długa strona.
    ekranow: Math.round((document.body.scrollHeight / H) * 10) / 10,
  };

  out.platforma = {
    shopify: !!(window.Shopify || htmlLower.includes('cdn.shopify.com')),
    motywShopify: window.Shopify && window.Shopify.theme ? {
      nazwa: window.Shopify.theme.name || null,
      id: window.Shopify.theme.id || null,
      rola: window.Shopify.theme.role || null,
    } : null,
    walutaShopify: window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : null,
    krajShopify: window.Shopify ? window.Shopify.country || null : null,
    woocommerce: htmlLower.includes('woocommerce'),
  };

  // ── 2. Wykryte aplikacje (sygnatury) ─────────────────────────────────
  // Odpowiada wprost na „jak konkurent rozwiązał upload / opinie / bundle".
  //
  // PRECYZJA > ZASIĘG. Dopasowujemy do ŹRÓDEŁ ZASOBÓW (src skryptów, href arkuszy)
  // i do klas w DOM — nie do całego HTML. Powód: inline JSON motywu, komentarze
  // i bloki konfiguracyjne wspominają aplikacje, których sklep nie ma zainstalowanych.
  // Przy zliczaniu „ile z 40 sklepów używa X" fałszywe trafienie psuje cały wniosek,
  // więc luźne wzmianki lądują w osobnym polu o niższej pewności.
  const zrodlaZasobow = [
    ...Array.from(document.querySelectorAll('script[src]')).map((s) => s.src),
    ...Array.from(document.querySelectorAll('link[href]')).map((l) => l.href),
    ...Array.from(document.querySelectorAll('iframe[src]')).map((f) => f.src),
  ].join(' ').toLowerCase();

  // Klasy i id w DOM — druga wiarygodna powierzchnia (widgety renderują własne kontenery).
  const klasyDom = Array.from(document.querySelectorAll('[class],[id]'))
    .slice(0, 4000)
    .map((el) => (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) + ' ' + el.id)
    .join(' ')
    .toLowerCase();

  const dopasujAplikacje = (slownik) => {
    const zainstalowane = [];
    const wzmianki = [];
    for (const [nazwa, wzorce] of Object.entries(slownik)) {
      const pewne = wzorce.some((w) => zrodlaZasobow.includes(w) || klasyDom.includes(w));
      if (pewne) zainstalowane.push(nazwa);
      else if (wzorce.some((w) => htmlLower.includes(w))) wzmianki.push(nazwa);
    }
    return { zainstalowane, wzmianki };
  };

  const apkOpinie = dopasujAplikacje(cfg.sygnatury.opinie);
  const apkPers = dopasujAplikacje(cfg.sygnatury.personalizacja);
  const apkUpsell = dopasujAplikacje(cfg.sygnatury.upsell);
  const apkAnalityka = dopasujAplikacje(cfg.sygnatury.analityka);

  out.aplikacje = {
    opinie: apkOpinie.zainstalowane,
    personalizacja: apkPers.zainstalowane,
    upsell: apkUpsell.zainstalowane,
    analityka: apkAnalityka.zainstalowane,
  };
  // Niższa pewność — sama wzmianka w HTML. Do wglądu, NIE do statystyk zbiorczych.
  out.aplikacjeWzmianki = {
    opinie: apkOpinie.wzmianki,
    personalizacja: apkPers.wzmianki,
    upsell: apkUpsell.wzmianki,
    analityka: apkAnalityka.wzmianki,
  };

  // ── 3. Dane produktu ze structured data ──────────────────────────────
  // JSON-LD Product to najpewniejsze źródło ceny/waluty/opinii — zanim zaczniemy
  // zgadywać po selektorach CSS, które są różne w każdym motywie.
  const jsonLd = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { jsonLd.push(JSON.parse(s.textContent)); } catch (_) { /* niepoprawny JSON-LD */ }
  });
  const splaszcz = (x) => (Array.isArray(x) ? x : [x]).flatMap((o) =>
    o && o['@graph'] ? splaszcz(o['@graph']) : [o]
  );
  const wszystkieLd = jsonLd.flatMap(splaszcz).filter(Boolean);
  const produktLd = wszystkieLd.find((o) => {
    const t = o['@type'];
    return t === 'Product' || (Array.isArray(t) && t.includes('Product'));
  }) || null;

  out.produktLd = produktLd ? {
    nazwa: produktLd.name || null,
    marka: typeof produktLd.brand === 'object' ? produktLd.brand.name : produktLd.brand || null,
    cena: produktLd.offers ? (Array.isArray(produktLd.offers)
      ? produktLd.offers[0] && produktLd.offers[0].price
      : produktLd.offers.price) ?? null : null,
    waluta: produktLd.offers ? (Array.isArray(produktLd.offers)
      ? produktLd.offers[0] && produktLd.offers[0].priceCurrency
      : produktLd.offers.priceCurrency) ?? null : null,
    dostepnosc: produktLd.offers ? (Array.isArray(produktLd.offers)
      ? produktLd.offers[0] && produktLd.offers[0].availability
      : produktLd.offers.availability) ?? null : null,
    ocena: produktLd.aggregateRating ? {
      wartosc: produktLd.aggregateRating.ratingValue ?? null,
      liczba: produktLd.aggregateRating.reviewCount ?? produktLd.aggregateRating.ratingCount ?? null,
    } : null,
    liczbaZdjec: Array.isArray(produktLd.image) ? produktLd.image.length : (produktLd.image ? 1 : 0),
  } : null;

  // ── 4. Cena widoczna w DOM ───────────────────────────────────────────
  // Osobno od JSON-LD, bo to cena, którą klient FIZYCZNIE widzi — z pozycją,
  // żeby dało się odpowiedzieć „czy cena jest nad zgięciem".
  const kandydaciCeny = [];
  const reCena = /(?:€|£|\$|zł|PLN|EUR|USD|GBP|CHF|SEK|DKK|NOK)\s?\d[\d\s.,]*|\d[\d\s.,]*\s?(?:€|£|\$|zł|PLN|EUR|USD|GBP|CHF|SEK|DKK|NOK)/i;
  document.querySelectorAll(cfg.selektory.cena).forEach((el) => {
    if (!widoczny(el)) return;
    const t = txt(el);
    if (!t || t.length > 60) return;
    if (!reCena.test(t)) return;
    kandydaciCeny.push({ tekst: bezpieczny(t, 60), y: absY(el), nadZgieciem: absY(el) < H });
  });
  // Deduplikacja po tekście — motywy powtarzają cenę w kilku miejscach (sticky, mobile, desktop).
  const widzianeCeny = new Set();
  out.cenyWidoczne = kandydaciCeny.filter((c) => {
    if (widzianeCeny.has(c.tekst)) return false;
    widzianeCeny.add(c.tekst);
    return true;
  }).sort((a, b) => a.y - b.y).slice(0, 12);

  out.cenaNadZgieciem = out.cenyWidoczne.some((c) => c.nadZgieciem);
  // Cena przekreślona/porównawcza = sygnał komunikowania rabatu.
  out.cenaPorownawcza = !!document.querySelector(cfg.selektory.cenaPrzekreslona);

  // ── 5. Przyciski akcji (ATC / kup teraz) ─────────────────────────────
  const przyciski = [];
  document.querySelectorAll('button, a[href], input[type="submit"], [role="button"]').forEach((el) => {
    if (!widoczny(el)) return;
    const t = txt(el) || el.getAttribute('value') || el.getAttribute('aria-label') || '';
    if (!t || t.length > 60) return;
    const tl = t.toLowerCase();
    const czyAtc = cfg.frazy.atc.some((f) => tl.includes(f));
    const czyKup = cfg.frazy.kupTeraz.some((f) => tl.includes(f));
    if (!czyAtc && !czyKup) return;
    const y = absY(el);
    const r = el.getBoundingClientRect();
    przyciski.push({
      tekst: bezpieczny(t, 60),
      typ: czyKup ? 'kup-teraz' : 'dodaj-do-koszyka',
      y,
      nadZgieciem: y < H,
      sticky: czyStickyLubFixed(el),
      wysokoscPx: Math.round(r.height),
      szerokoscPx: Math.round(r.width),
    });
  });
  out.przyciskiAkcji = przyciski.sort((a, b) => a.y - b.y).slice(0, 10);
  out.atcNadZgieciem = przyciski.some((p) => p.nadZgieciem);

  // Pasek sticky z ATC pojawia się dopiero PO przewinięciu obok formularza i chowa
  // się z powrotem na górze strony — tak działa poprawnie zbudowany pasek, bo na
  // górze przycisk i tak jest widoczny. Pętla wyżej odsiewa niewidoczne elementy
  // (`if (!widoczny(el)) return`) i mierzy po powrocie na `scrollY = 0`, więc taki
  // pasek nie miał szans się załapać.
  //
  // Regresja, którą to wywołało: raport ogłosił „sticky ATC ma 1 z 12 sklepów —
  // najtańsze pole do wyróżnienia", a mierzył w rzeczywistości „ma sticky ATC
  // widoczny już na samej górze strony". To zupełnie inna, dużo rzadsza cecha.
  // Błąd dotyczył wszystkich sklepów jednakowo, więc statystyka wyglądała spójnie.
  //
  // `data-skan-sticky-widziany` znaczy core/browser.js w trakcie scrolla.
  const atcWStickyPoScrollu = Array.from(document.querySelectorAll('[data-skan-sticky-widziany]'))
    .some((kontener) => Array.from(kontener.querySelectorAll('button, a[href], input[type="submit"], [role="button"]'))
      .some((el) => {
        const t = (txt(el) || el.getAttribute('value') || el.getAttribute('aria-label') || '').toLowerCase();
        if (!t || t.length > 60) return false;
        return cfg.frazy.atc.some((f) => t.includes(f)) || cfg.frazy.kupTeraz.some((f) => t.includes(f));
      }));

  out.atcSticky = przyciski.some((p) => p.sticky) || atcWStickyPoScrollu;
  // Rozbicie zostaje w danych, żeby dało się odróżnić pasek widoczny od razu od
  // takiego, który dopiero wyjeżdża — to dwie różne decyzje projektowe.
  out.atcStickyOdRazu = przyciski.some((p) => p.sticky);
  out.atcStickyPoScrollu = atcWStickyPoScrollu;

  // ── 6. Personalizacja — mechanika, nie deklaracja ─────────────────────
  // Kluczowe dla naszego produktu: czy klient wgrywa zdjęcie na PDP, czy dopiero
  // po zakupie mailem; czy widzi podgląd przed zapłatą; ile pól musi wypełnić.
  const uploady = [];
  document.querySelectorAll('input[type="file"]').forEach((el) => {
    const accept = el.getAttribute('accept') || null;
    uploady.push({
      accept,
      // Czy input przyjmuje obrazy — odsiewa uploady niezwiązane z personalizacją
      // (załączniki w formularzu kontaktowym, widgety czatu).
      przyjmujeObrazy: !accept || /image|jpe?g|png|heic|\*/i.test(accept),
      multiple: el.hasAttribute('multiple'),
      wymagany: el.hasAttribute('required'),
      y: absY(el),
      widoczny: widoczny(el),
      nadZgieciem: absY(el) < H,
    });
  });
  // Wiele aplikacji chowa <input type=file> i podstawia własny przycisk — sam licznik
  // ukrytych inputów to za mało, więc szukamy też strefy drop/przycisku po tekście.
  const przyciskiUpload = [];
  document.querySelectorAll('button, label, a, div[class*="upload"], div[class*="dropzone"]').forEach((el) => {
    if (!widoczny(el)) return;
    const t = txt(el);
    if (!t || t.length > 80) return;
    const tl = t.toLowerCase();
    if (cfg.frazy.upload.some((f) => tl.includes(f))) {
      przyciskiUpload.push({ tekst: bezpieczny(t, 80), y: absY(el), nadZgieciem: absY(el) < H });
    }
  });

  // Dedykowany przycisk podglądu personalizacji (np. „PREVIEW YOUR PERSONALIZATION"
  // obok Add to Cart na soulyshine.com). To osobny mechanizm od podglądu na żywo na
  // canvasie i osobny od obietnicy proofu — klient świadomie odpala render przed zakupem.
  // Selektor musi obejmować DIV-y z klasą „btn/button": febworld.com renderuje kontrolkę
  // jako <div class="preview_btn">, nie <button>. Wąski selektor dawał fałszywy negatyw
  // na sklepie z drugim najwyższym budżetem w zestawieniu.
  const przyciskiPodgladu = [];
  document.querySelectorAll('button, a[href], [role="button"], label, [class*="btn" i], [class*="button" i]').forEach((el) => {
    // Kontenery obudowujące łapią tekst dziecka — bierzemy tylko liście i płytkie węzły.
    if (el.children.length > 2) return;
    if (!widoczny(el)) return;
    const t = txt(el);
    if (!t || t.length > 60) return;
    const tl = t.toLowerCase();
    // Szeroko, bo mechanizm nazywa się różnie: „Preview your personalization" (soulyshine),
    // „Review Your Personalization" (febworld), „Check your design". Wąskie `preview`
    // przegapiło febworld — a to jeden z dwóch najwyższych budżetów w zestawieniu.
    if (/preview|review your|check your (design|personaliz)|see your (design|photo)|podgląd|podglad|sprawdź projekt|vorschau|entwurf prüfen|aperçu|vérifier|voorbeeld|vista previa|anteprima/.test(tl)) {
      przyciskiPodgladu.push({ tekst: bezpieczny(t, 60), y: absY(el), nadZgieciem: absY(el) < H });
    }
  });

  // Pola tekstowe personalizacji (imię na grawerze, tekst dedykacji).
  const polaTekstowe = [];
  document.querySelectorAll('input[type="text"], input:not([type]), textarea').forEach((el) => {
    if (!widoczny(el)) return;
    const etykieta = el.getAttribute('placeholder')
      || el.getAttribute('aria-label')
      || el.getAttribute('name')
      || (el.labels && el.labels[0] ? txt(el.labels[0]) : '');
    if (!etykieta) return;
    const el2 = etykieta.toLowerCase();
    // Odsiej wyszukiwarkę i newsletter — to nie personalizacja produktu.
    if (/search|szukaj|recherch|suche|newsletter|e-?mail|coupon|discount|rabat/.test(el2)) return;
    polaTekstowe.push({
      etykieta: bezpieczny(etykieta, 60),
      maxLength: el.getAttribute('maxlength') ? Number(el.getAttribute('maxlength')) : null,
      wymagane: el.hasAttribute('required'),
      y: absY(el),
    });
  });

  // Ukryty <input type=file> sam w sobie NIE jest dowodem, że sklep zbiera zdjęcie na PDP —
  // bywa zostawiony przez widget czatu, formularz kontaktowy albo nieaktywną aplikację.
  // Dlatego twarde `uploadNaPdp` liczymy z elementów, które klient realnie widzi, a ukryte
  // trzymamy osobno jako słabszy sygnał (aplikacja może podstawiać własny przycisk).
  const uploadyWidoczne = uploady.filter((u) => u.widoczny && u.przyjmujeObrazy);
  const uploadyUkryte = uploady.filter((u) => !u.widoczny);

  out.personalizacja = {
    inputyPlikow: uploady,
    liczbaInputowPlikow: uploady.length,
    liczbaInputowWidocznych: uploadyWidoczne.length,
    liczbaInputowUkrytych: uploadyUkryte.length,
    // Twardy sygnał: widoczny input na obrazy ALBO widoczny przycisk uploadu.
    uploadNaPdp: uploadyWidoczne.length > 0 || przyciskiUpload.length > 0,
    // Słabszy: coś do wgrywania jest w DOM, ale niewidoczne — do weryfikacji na zrzucie.
    uploadTylkoWDom: uploadyWidoczne.length === 0 && przyciskiUpload.length === 0 && uploady.length > 0,
    przyciskiUpload: przyciskiUpload.slice(0, 6),
    polaTekstowe: polaTekstowe.slice(0, 10),
    liczbaPolTekstowych: polaTekstowe.length,
    // Podgląd na żywo: canvas (renderowanie po stronie klienta) albo aplikacja personalizacyjna.
    maCanvas: !!document.querySelector('canvas'),
    liczbaCanvas: document.querySelectorAll('canvas').length,
    // Czy w treści obiecują akceptację projektu przed produkcją — częsty sposób
    // zbijania obiekcji „a co jeśli wyjdzie źle".
    obiecujePodgladDoAkceptacji: cfg.frazy.proofPrzedProdukcja.some((f) => tekstLower.includes(f)),
    wzmiankiOPodgladzie: cfg.frazy.proofPrzedProdukcja.filter((f) => tekstLower.includes(f)),
    // Osobny mechanizm: przycisk odpalający render podglądu przed zakupem.
    przyciskiPodgladu: przyciskiPodgladu.slice(0, 4),
    maPrzyciskPodgladu: przyciskiPodgladu.length > 0,
  };

  // ── 7. Warianty ──────────────────────────────────────────────────────
  const selecty = Array.from(document.querySelectorAll('select')).filter(widoczny);
  out.warianty = {
    liczbaSelectow: selecty.length,
    selecty: selecty.slice(0, 6).map((s) => ({
      etykieta: bezpieczny(s.getAttribute('aria-label') || s.getAttribute('name') || '', 40),
      liczbaOpcji: s.options ? s.options.length : 0,
    })),
    // Swatche/pigułki wariantów — typowy wzorzec zamiast <select>.
    swatche: document.querySelectorAll(cfg.selektory.swatch).length,
    radio: document.querySelectorAll('input[type="radio"]').length,
  };

  // ── 8. Zaufanie i social proof ───────────────────────────────────────
  const gwiazdki = document.querySelectorAll(cfg.selektory.gwiazdki).length;
  // Liczba opinii z tekstu („1 234 opinii", "4.9/5") — surowe trafienia, bez interpretacji.
  const trafieniaLiczbaOpinii = [];
  const reOpinie = /(\d[\d\s.,]{0,8})\s*(reviews?|opinii|opinie|avis|bewertungen|recensioni|reseñas|beoordelingen)/gi;
  let m;
  while ((m = reOpinie.exec(tekstStrony)) !== null && trafieniaLiczbaOpinii.length < 6) {
    trafieniaLiczbaOpinii.push(bezpieczny(m[0], 40));
  }
  const reOcena = /([0-5][.,]\d)\s*\/\s*5|\b([0-5][.,]\d)\s*(?:stars?|gwiazd|sterne|étoiles)/gi;
  const trafieniaOcena = [];
  while ((m = reOcena.exec(tekstStrony)) !== null && trafieniaOcena.length < 4) {
    trafieniaOcena.push(bezpieczny(m[0], 20));
  }

  // Gwarancje i zwroty łapiemy wzorcem, nie listą fraz: okresy są liczbowe
  // („2-Year Warranty", „100-Day Returns") i sztywna lista je gubi.
  const okresZwrotu = dopasujWzorzec('okresZwrotu');
  const okresGwarancji = dopasujWzorzec('okresGwarancji');
  const gwarancjaOgolna = dopasujWzorzec('gwarancjaOgolna');

  out.zaufanie = {
    elementyGwiazdek: gwiazdki,
    liczbaOpiniiWTekscie: trafieniaLiczbaOpinii,
    ocenaWTekscie: trafieniaOcena,
    // Zdjęcia klientów w sekcji opinii = UGC, mocniejszy proof niż sam tekst.
    maZdjeciaWOpiniach: !!document.querySelector(cfg.selektory.zdjeciaOpinii),
    badge: cfg.frazy.badge.filter((f) => tekstLower.includes(f)),
    gwarancja: cfg.frazy.gwarancja.filter((f) => tekstLower.includes(f)),
    okresZwrotu,
    okresGwarancji,
    gwarancjaOgolna,
    // Zbiorczy sygnał — dowolna forma obietnicy gwarancji/zwrotu.
    maJakakolwiekGwarancje: !!(okresZwrotu || okresGwarancji || gwarancjaOgolna)
      || cfg.frazy.gwarancja.some((f) => tekstLower.includes(f)),
    // Linki do polityk — obecność i to, czy są dostępne z PDP, czy dopiero ze stopki.
    linkiPolityk: Array.from(document.querySelectorAll('a[href]'))
      .filter((a) => cfg.frazy.polityki.some((f) => (txt(a) + ' ' + a.getAttribute('href')).toLowerCase().includes(f)))
      .slice(0, 10)
      .map((a) => ({ tekst: bezpieczny(txt(a), 40), href: bezpieczny(a.getAttribute('href'), 120), y: absY(a) })),
  };

  // ── 9. Oferta: bundle, upsell, pilność ───────────────────────────────
  out.oferta = {
    frazyBundle: cfg.frazy.bundle.filter((f) => tekstLower.includes(f)),
    frazyPilnosc: cfg.frazy.pilnosc.filter((f) => tekstLower.includes(f)),
    fazyDarmowaWysylka: cfg.frazy.darmowaWysylka.filter((f) => tekstLower.includes(f)),
    // Rabat ilościowy: „2 sztuki = -20%", typowy w personalizowanych prezentach.
    maProgIlosciowy: cfg.frazy.progIlosciowy.some((f) => tekstLower.includes(f)),
    maLicznikCzasu: !!document.querySelector(cfg.selektory.licznik)
      || /\b\d{1,2}:\d{2}:\d{2}\b/.test(tekstStrony),
    maRaty: cfg.frazy.raty.filter((f) => tekstLower.includes(f)),
  };

  // ── 10. Dostawa / czas produkcji ─────────────────────────────────────
  // Przy produkcie personalizowanym czas produkcji to osobna obiekcja niż czas wysyłki.
  out.dostawa = {
    fazyCzasProdukcji: cfg.frazy.czasProdukcji.filter((f) => tekstLower.includes(f)),
    fazyCzasDostawy: cfg.frazy.czasDostawy.filter((f) => tekstLower.includes(f)),
    // Konkretny okres liczbowy („3-5 business days") — mocniejszy sygnał niż sama fraza.
    okresyRealizacji: wszystkieDopasowania('okresRealizacji', 5),
    // Konkretna data dostarczenia („zamów do wtorku, dostawa przed świętami") — mocny CRO.
    maKonkretnaDate: cfg.frazy.konkretnaData.some((f) => tekstLower.includes(f)),
    fazyZwroty: cfg.frazy.zwroty.filter((f) => tekstLower.includes(f)),
  };

  // ── 11. Mapa sekcji (kolejność!) ─────────────────────────────────────
  // Na Shopify motywy owijają każdą sekcję w <div id="shopify-section-...__nazwa">,
  // co daje semantyczne nazwy i kolejność za darmo. Poza Shopify schodzimy do
  // bezpośrednich dzieci kontenera głównego.
  let wezlySekcji = Array.from(document.querySelectorAll('[id^="shopify-section-"]'));
  let zrodloSekcji = 'shopify-section';
  if (wezlySekcji.length < 3) {
    const glowny = document.querySelector('main, #MainContent, [role="main"]') || document.body;
    wezlySekcji = Array.from(glowny.children).filter((el) => el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE');
    zrodloSekcji = 'dzieci-kontenera';
  }

  const sekcje = wezlySekcji
    .filter((el) => widoczny(el))
    .map((el, i) => {
      const id = el.id || '';
      // shopify-section-template--123456__main-product → "main-product"
      const nazwaShopify = id.includes('__') ? id.split('__').pop() : (id.replace(/^shopify-section-/, '') || null);
      const naglowek = el.querySelector('h1, h2, h3');
      const t = txt(el);
      const tl = t.toLowerCase();
      const r = el.getBoundingClientRect();

      // Heurystyczna klasyfikacja typu — jedyne pole interpretacyjne w sondzie.
      // Nazwa z `Guess`, żeby nikt nie pomylił jej z faktem. Claude może nadpisać ze zrzutu.
      let typGuess = null;
      for (const [typ, wzorce] of Object.entries(cfg.typySekcji)) {
        const wNazwie = nazwaShopify && wzorce.some((w) => nazwaShopify.toLowerCase().includes(w));
        const wTekscie = wzorce.some((w) => tl.includes(w));
        if (wNazwie || wTekscie) { typGuess = typ; break; }
      }

      return {
        pozycja: i,
        idShopify: nazwaShopify,
        typGuess,
        naglowek: naglowek ? bezpieczny(txt(naglowek), 90) : null,
        y: absY(el),
        wysokoscPx: Math.round(r.height),
        // Ile ekranów zajmuje ta sekcja — pokazuje, czemu autor dał najwięcej miejsca.
        ekranow: Math.round((r.height / H) * 10) / 10,
        nadZgieciem: absY(el) < H,
        liczbaZdjec: el.querySelectorAll('img').length,
        liczbaWideo: el.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]').length,
        maFormularz: !!el.querySelector('form, input, select, textarea'),
        maAkordeon: !!el.querySelector('details, [class*="accordion"], [class*="collapsib"]'),
        dlugoscTekstu: t.length,
        probkaTekstu: bezpieczny(t, 180),
      };
    })
    .filter((s) => s.wysokoscPx > 40);

  out.sekcje = sekcje;
  out.liczbaSekcji = sekcje.length;
  out.zrodloSekcji = zrodloSekcji;
  out.kolejnoscSekcji = sekcje.map((s) => s.typGuess || s.idShopify || `sekcja-${s.pozycja}`);

  // ── 12. Media ────────────────────────────────────────────────────────
  const obrazy = Array.from(document.querySelectorAll('img')).filter(widoczny);
  out.media = {
    liczbaObrazow: obrazy.length,
    obrazowNadZgieciem: obrazy.filter((el) => absY(el) < H).length,
    liczbaWideo: document.querySelectorAll('video').length,
    liczbaOsadzonychWideo: document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"], iframe[src*="tiktok"]').length,
    // Galeria produktu — ile zdjęć klient może obejrzeć przed zakupem.
    galeriaProduktu: document.querySelectorAll(cfg.selektory.galeria).length,
    brakAlt: obrazy.filter((el) => !el.getAttribute('alt')).length,
  };

  // ── 13. Zawartość zgięcia (co widać bez scrolla) ─────────────────────
  // Odpowiada wprost na „gdzie umieszczają cenę i CTA" — mierzone, nie oceniane ze zrzutu.
  const wZgieciu = [];
  document.querySelectorAll('h1, h2, img, button, a, [class*="price"], input, select').forEach((el) => {
    if (!widoczny(el)) return;
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.top < H) {
      wZgieciu.push({ tag: el.tagName.toLowerCase(), tekst: bezpieczny(txt(el), 60) });
    }
  });
  out.zgiecie = {
    h1: bezpieczny(txt(document.querySelector('h1')), 120),
    liczbaElementow: wZgieciu.length,
    maCene: out.cenaNadZgieciem,
    maAtc: out.atcNadZgieciem,
    maGwiazdki: Array.from(document.querySelectorAll(cfg.selektory.gwiazdki)).some((el) => widoczny(el) && absY(el) < H),
    // Tylko widoczne elementy — ukryty input nie jest tym, co klient widzi nad zgięciem.
    maUpload: out.personalizacja.inputyPlikow.some((u) => u.widoczny && u.przyjmujeObrazy && u.nadZgieciem)
      || out.personalizacja.przyciskiUpload.some((u) => u.nadZgieciem),
  };

  // ── 14. Sygnały mobilne (liczone tylko przy profilu mobile) ──────────
  if (W <= 500) {
    const male = [];
    document.querySelectorAll('button, a[href], input[type="submit"]').forEach((el) => {
      if (!widoczny(el)) return;
      const r = el.getBoundingClientRect();
      // Rekomendacja WCAG/Apple: cel dotykowy ≥44 px. Liczymy naruszenia, nie oceniamy.
      if (r.height > 0 && r.height < 44) male.push(bezpieczny(txt(el), 40));
    });
    out.mobile = {
      celeDotykowePonizej44px: male.length,
      przykladyMalychCeli: male.slice(0, 8),
      maStickyAtc: out.atcSticky,
      maStickyNaglowek: Array.from(document.querySelectorAll('header, nav'))
        .some((el) => widoczny(el) && czyStickyLubFixed(el)),
      // Poziomy scroll to klasyczny błąd mobile — mierzalny jednoznacznie.
      przewijaPoziomo: document.documentElement.scrollWidth > W + 5,
      liczbaPopupow: document.querySelectorAll('[class*="popup"], [class*="modal"], [id*="popup"]').length,
    };
  }

  // ── 15. Formularze i lejek ───────────────────────────────────────────
  out.formularze = Array.from(document.querySelectorAll('form')).filter(widoczny).slice(0, 8).map((f) => ({
    action: bezpieczny(f.getAttribute('action') || '', 100),
    liczbaPol: f.querySelectorAll('input, select, textarea').length,
    liczbaPolWymaganych: f.querySelectorAll('[required]').length,
    y: absY(f),
  }));

  return out;
}

module.exports = { domProbe };
