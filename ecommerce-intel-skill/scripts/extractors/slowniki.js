/**
 * slowniki.js — konfiguracja sondy DOM: sygnatury aplikacji, frazy i selektory.
 *
 * To jest miejsce, w którym system jest UNIWERSALNY. Sonda (dom-probe.js) nie zna
 * żadnej branży — całą wiedzę o tym, czego szukać, dostaje stąd. Zmiana produktu
 * albo rynku = edycja tego pliku, nie kodu.
 *
 * Frazy są wielojęzyczne (EN/DE/FR/PL/NL/ES/IT), bo badamy rynek europejski i ten
 * sam wzorzec sprzedażowy brzmi inaczej na każdym rynku. Wszystko lowercase —
 * porównanie po stronie sondy też jest lowercase.
 */

// Sygnatury aplikacji — szukane w src skryptów i w całym HTML.
// Wykrycie aplikacji odpowiada na „jak konkurent to zrobił" bez otwierania strony ręcznie.
const sygnatury = {
  opinie: {
    'Judge.me': ['judge.me', 'jdgm'],
    'Loox': ['loox.io', 'looxreviews'],
    'Okendo': ['okendo', 'oke-w'],
    'Yotpo': ['yotpo'],
    'Stamped': ['stamped.io'],
    'Fera': ['fera.ai'],
    'Reviews.io': ['reviews.io'],
    'Trustpilot': ['trustpilot'],
    'Rivyo': ['rivyo'],
    'Ryviu': ['ryviu'],
    'Ali Reviews': ['alireviews'],
    'Vitals': ['vitals.co', 'appsolve'],
    'Junip': ['junip.co'],
    'Opinew': ['opinew'],
    'Trustoo': ['trustoo'],
  },
  // Najważniejsza grupa dla naszego produktu — to one realizują upload zdjęcia i podgląd.
  personalizacja: {
    'Zepto Product Personalizer': ['zepto', 'productpersonalizer'],
    'Inkybay': ['inkybay'],
    'Customily': ['customily'],
    'Teeinblue': ['teeinblue'],
    'Kickflip': ['gokickflip', 'kickflip'],
    'Product Personalizer': ['product-personalizer'],
    'Hulk Product Options': ['hulkapps'],
    'Globo Product Options': ['globo.io', 'globosoftware'],
    'Infinite Options': ['shopapps.io', 'infiniteoptions'],
    'Uploadery': ['uploadery'],
    'Easify Product Options': ['easify'],
    'Variant Option Product Options': ['variantoption'],
    'Bold Product Options': ['boldapps'],
    'Cloudinary': ['cloudinary'],
    'Filestack': ['filestack'],
    'Uploadcare': ['uploadcare'],
  },
  upsell: {
    'ReConvert': ['reconvert'],
    'Zipify OCU': ['zipify'],
    'Rebuy': ['rebuyengine'],
    'PickyStory': ['pickystory'],
    'Frequently Bought Together': ['boughttogether', 'codeblackbelt'],
    'Kaching Bundles': ['kaching'],
    'Pumper Bundles': ['pumper'],
    'Wide Bundles': ['widebundle'],
    'UpCart': ['upcart'],
    'Selleasy': ['selleasy'],
    'Honeycomb': ['honeycomb'],
    'Monk': ['monkcommerce'],
    'Corner': ['corner.co'],
    'Bundler': ['bundler.app'],
    'AfterSell': ['aftersell'],
  },
  analityka: {
    'Meta Pixel': ['connect.facebook.net', 'fbevents'],
    'TikTok Pixel': ['analytics.tiktok.com'],
    'Google Analytics': ['googletagmanager', 'google-analytics'],
    'Klaviyo': ['klaviyo'],
    'Triple Whale': ['triplewhale'],
    'Hotjar': ['hotjar'],
    'Microsoft Clarity': ['clarity.ms'],
    'Pinterest Tag': ['pintrk', 'ct.pinterest'],
    'Snapchat Pixel': ['sc-static.net'],
  },
};

const frazy = {
  atc: [
    'add to cart', 'add to bag', 'add to basket',
    'in den warenkorb', 'in den einkaufswagen', 'zum warenkorb',
    'ajouter au panier', 'au panier',
    'dodaj do koszyka', 'do koszyka',
    'in winkelwagen', 'toevoegen aan winkelwagen',
    'añadir al carrito', 'agregar al carrito',
    'aggiungi al carrello',
    'lägg i varukorg', 'læg i kurv', 'legg i handlekurv',
  ],
  kupTeraz: [
    'buy now', 'buy it now', 'checkout', 'order now', 'shop now', 'get yours', 'claim',
    'jetzt kaufen', 'sofort kaufen', 'jetzt bestellen',
    'acheter', 'commander', 'je commande',
    'kup teraz', 'zamów teraz', 'kupuję',
    'nu kopen', 'bestellen',
    'comprar ahora', 'compra ahora',
    'acquista ora', 'ordina ora',
  ],
  // Upload zdjęcia — sedno naszego produktu.
  upload: [
    'upload', 'choose file', 'choose photo', 'select photo', 'add photo', 'add your photo',
    'drag', 'drop your', 'browse',
    'hochladen', 'foto hochladen', 'datei wählen', 'bild auswählen',
    'télécharger', 'importer', 'choisir une photo', 'ajouter une photo',
    'prześlij', 'wgraj', 'dodaj zdjęcie', 'wybierz plik', 'załaduj',
    'uploaden', 'foto uploaden', 'kies bestand',
    'subir foto', 'cargar imagen',
    'carica foto', 'carica immagine',
  ],
  // Obietnica akceptacji projektu przed produkcją — kluczowe dla zbijania obiekcji
  // „a co jeśli portret wyjdzie źle". Sprawdzamy, ilu konkurentów w ogóle to oferuje.
  proofPrzedProdukcja: [
    'preview before', 'proof before', 'approve before', 'see a preview', 'digital proof',
    'design proof', 'you approve', 'before we print', 'before production', 'mockup',
    'vorschau vor', 'entwurf zur freigabe', 'vor der produktion', 'sie genehmigen',
    'aperçu avant', 'validation avant', 'bon à tirer', 'avant production',
    'podgląd przed', 'projekt do akceptacji', 'akceptacja projektu', 'przed produkcją',
    'voorbeeld voor', 'goedkeuring voor',
    'vista previa antes', 'aprobación antes',
    'anteprima prima', 'approvazione prima',
  ],
  badge: [
    'secure checkout', 'money back', 'satisfaction guarantee', 'as seen', 'trusted by',
    'sicher bezahlen', 'geld zurück', 'zufriedenheitsgarantie',
    'paiement sécurisé', 'satisfait ou remboursé',
    'bezpieczne płatności', 'gwarancja satysfakcji',
    'veilig betalen', 'niet goed geld terug',
  ],
  gwarancja: [
    'money back guarantee', '30-day', '60-day', '90-day', 'lifetime warranty', 'free returns',
    'geld-zurück-garantie', '30 tage', '60 tage', 'kostenlose rücksendung',
    'garantie', 'remboursement', 'retours gratuits',
    'gwarancja zwrotu', '30 dni', '14 dni', 'darmowy zwrot',
    'garantía', 'devolución gratuita',
    'garanzia', 'reso gratuito',
  ],
  polityki: [
    'shipping', 'delivery', 'returns', 'refund', 'privacy', 'terms', 'faq',
    'versand', 'lieferung', 'rückgabe', 'widerruf', 'datenschutz', 'agb',
    'livraison', 'retour', 'remboursement', 'confidentialité', 'cgv',
    'dostawa', 'wysyłka', 'zwrot', 'reklamacj', 'prywatnoś', 'regulamin',
    'verzending', 'retourneren', 'voorwaarden',
    'envío', 'devoluciones', 'privacidad',
    'spedizione', 'resi', 'privacy',
  ],
  bundle: [
    'bundle', 'buy 2', 'buy 3', 'set of', 'combo', 'kit', 'pack of', 'save when you buy',
    'gift set', 'complete set', 'add another', 'second one',
    'set', 'sparset', 'vorteilspack', '2 kaufen', 'im set',
    'lot de', 'pack', 'coffret', 'ensemble',
    'zestaw', 'kup 2', 'komplet', 'pakiet',
    'voordeelset', 'combi',
    'conjunto', 'pack de',
    'confezione', 'set da',
  ],
  progIlosciowy: [
    'buy 2 get', 'buy 3 get', '2 for', '3 for', 'bogo', 'second at', '50% off second',
    'the more you buy', 'quantity discount', 'volume discount',
    '2 für', 'mengenrabatt', 'staffelpreis',
    '2 achetés', '1 offert', 'le 2ème',
    'drugi za', 'kup 2', 'rabat ilościowy',
    '2 halen', '2e artikel',
    '2x1', 'segunda unidad',
    'prendi 2',
  ],
  pilnosc: [
    'only', 'left in stock', 'selling fast', 'almost gone', 'limited', 'today only',
    'ends tonight', 'hurry', 'last chance', 'while supplies last', 'order within',
    'nur noch', 'begrenzt', 'nur heute', 'schnell sein',
    'plus que', 'stock limité', 'dernière chance', "aujourd'hui seulement",
    'tylko', 'ostatnie sztuki', 'kończy się', 'ograniczona',
    'nog maar', 'beperkt', 'laatste kans',
    'solo quedan', 'últimas unidades',
    'solo oggi', 'ultimi pezzi',
  ],
  darmowaWysylka: [
    'free shipping', 'free delivery', 'shipping included',
    'kostenloser versand', 'gratis versand', 'versandkostenfrei',
    'livraison gratuite', 'livraison offerte',
    'darmowa dostawa', 'darmowa wysyłka', 'wysyłka gratis',
    'gratis verzending', 'gratis bezorging',
    'envío gratis', 'envío gratuito',
    'spedizione gratuita',
  ],
  raty: [
    'klarna', 'clearpay', 'afterpay', 'affirm', 'in 3 payments', 'pay later', 'installments',
    'ratenzahlung', 'in raten',
    'en 3 fois', 'paiement en plusieurs fois',
    'raty', 'płatność odroczona', 'blik',
    'in termijnen', 'achteraf betalen',
    'a plazos',
    'a rate',
  ],
  // Czas PRODUKCJI to inna obiekcja niż czas wysyłki — przy personalizacji kluczowa.
  czasProdukcji: [
    'production time', 'processing time', 'handcrafted in', 'made in', 'crafted within',
    'business days to make', 'days to create', 'handmade to order', 'made to order',
    'produktionszeit', 'bearbeitungszeit', 'anfertigung',
    'délai de fabrication', 'fabrication en', 'confection',
    'czas realizacji', 'czas produkcji', 'wykonanie w',
    'productietijd', 'verwerkingstijd',
    'tiempo de producción', 'elaboración',
    'tempo di produzione', 'lavorazione',
  ],
  czasDostawy: [
    'delivery time', 'shipping time', 'arrives in', 'business days', 'working days',
    'lieferzeit', 'versandzeit', 'werktage',
    'délai de livraison', 'jours ouvrés',
    'czas dostawy', 'dni roboczych', 'dostawa w',
    'levertijd', 'werkdagen',
    'tiempo de entrega', 'días hábiles',
    'tempi di consegna', 'giorni lavorativi',
  ],
  // Konkretna data zamiast widełek — mocny wzorzec CRO, szczególnie w prezentach.
  konkretnaData: [
    'order by', 'get it by', 'arrives before', 'delivered by', 'in time for',
    'guaranteed christmas', 'before christmas', 'in time for christmas',
    "mother's day delivery", 'valentine',
    'bestellen sie bis', 'lieferung bis', 'rechtzeitig zu weihnachten',
    'commandez avant', 'livré avant', 'pour noël',
    'zamów do', 'dostawa przed', 'na święta', 'przed świętami',
    'bestel voor', 'voor kerst',
    'pide antes', 'antes de navidad',
    'ordina entro', 'prima di natale',
  ],
  zwroty: [
    'return policy', 'returns accepted', 'no returns', 'non-refundable', 'final sale',
    'personalized items cannot', 'custom items are not',
    'rückgaberecht', 'nicht umtauschbar', 'vom umtausch ausgeschlossen',
    'droit de rétractation', 'non remboursable', 'personnalisé ne peut',
    'prawo zwrotu', 'nie podlega zwrotowi', 'personalizowane nie',
    'retourbeleid', 'niet retourneerbaar',
    'política de devolución', 'no admite devolución',
    'diritto di recesso', 'non rimborsabile',
  ],
};

/**
 * Wzorce regex — jako ŹRÓDŁA (string), bo funkcja sondy jest serializowana do przeglądarki
 * i obiekt RegExp nie przechodzi przez tę granicę. Sonda robi `new RegExp(src, 'i')`.
 *
 * Dlaczego w ogóle regex, skoro reszta to podciągi: okresy gwarancji i zwrotów są
 * LICZBOWE i nieprzewidywalne. Lista sztywnych fraz („30-day", „60-day") przegapiła
 * „2-Year Warranty" i „100-Day Returns" na soulyshine.com i wyprodukowała fałszywy
 * whitespace „nikt nie komunikuje gwarancji: 0/12". Wyłapane dopiero na zrzucie —
 * stąd zasada „zrzut ma pierwszeństwo nad licznikiem" w SKILL.md.
 */
const regexy = {
  // „30-day returns", „100-Day Returns", „14 dni na zwrot", „60 jours"
  okresZwrotu: '\\b\\d{1,3}[\\s-]?(day|days|tage|tagen|jours?|dni|dagen|días|giorni)\\b[^.]{0,25}(return|refund|money|rückgabe|geld|retour|remboursement|zwrot|devoluc|reso)',
  // „2-Year Warranty", „lifetime warranty", „5 lat gwarancji"
  okresGwarancji: '\\b(\\d{1,2}[\\s-]?(year|years|jahr|jahre|ans?|lat|lata|jaar|años|anni)|lifetime|lebenslang|à vie|dożywotni)\\b[^.]{0,25}(warrant|garant|gwaranc)',
  // „money back", „satisfaction guaranteed" — bez okresu
  gwarancjaOgolna: '(money[\\s-]?back|satisfaction guarantee|zufriedenheitsgarantie|satisfait ou rembours|gwarancja satysfakcji|soddisfatti o rimborsati|garantía de satisfacción)',
  // Konkretna liczba opinii: „1,234 reviews", „ponad 500 opinii"
  liczbaOpinii: '\\b\\d[\\d\\s.,]{0,8}\\+?\\s*(reviews?|opinii|opinie|avis|bewertungen|recensioni|reseñas|beoordelingen)\\b',
  // Czas realizacji: „ships in 3-5 business days", „wysyłka w 2 dni robocze"
  okresRealizacji: '\\b\\d{1,2}\\s*[-–—]?\\s*\\d{0,2}\\s*(business days|working days|werktage|jours ouvrés|dni robocz|werkdagen|días hábiles|giorni lavorativi)',
};

// Selektory CSS — celowo szerokie, bo każdy motyw nazywa klasy inaczej.
// Sonda i tak filtruje po widoczności i po treści (regex ceny), więc szum jest tani.
const selektory = {
  cena: '[class*="price" i], [class*="Price"], [data-price], [id*="price" i], .money, ins, .amount',
  cenaPrzekreslona: 'del, s, [class*="compare" i], [class*="was-price" i], [class*="old-price" i], [class*="strike" i]',
  gwiazdki: '[class*="star" i], [class*="rating" i], [class*="jdgm-star"], [class*="loox"], [class*="yotpo-stars"], [class*="oke-star"], [aria-label*="star" i]',
  zdjeciaOpinii: '[class*="review" i] img, [class*="jdgm-rev__pic"], [class*="loox-photo"], [class*="oke-review-image"]',
  swatch: '[class*="swatch" i], [class*="variant-option" i], [class*="color-option" i], [class*="chip" i]',
  galeria: '[class*="gallery" i] img, [class*="product-media" i] img, [class*="thumbnail" i] img, [class*="product__media"] img',
  licznik: '[class*="countdown" i], [class*="timer" i], [data-countdown]',
};

// Typy sekcji — słowa kluczowe dopasowywane do nazwy sekcji Shopify LUB do jej treści.
// Kolejność ma znaczenie: pierwszy trafiony typ wygrywa, więc bardziej specyficzne idą wyżej.
const typySekcji = {
  'produkt-glowny': ['main-product', 'product-form', 'product-info', 'product__info'],
  'opinie': ['review', 'testimonial', 'opinie', 'bewertung', 'avis', 'recension', 'judgeme', 'loox', 'okendo', 'yotpo'],
  'faq': ['faq', 'question', 'frage', 'pytania', 'domande', 'preguntas'],
  'jak-to-dziala': ['how-it-works', 'how it works', 'so-funktioniert', 'jak to działa', 'comment ça marche', 'steps', 'krok'],
  'gwarancja': ['guarantee', 'warranty', 'garantie', 'gwarancja', 'garanzia', 'promise'],
  'porownanie': ['compare', 'comparison', 'vergleich', 'porównanie', 'vs-'],
  'ugc': ['ugc', 'instagram', 'customer-photo', 'gallery-social', 'community'],
  'upsell': ['upsell', 'cross-sell', 'complete-the-look', 'bought-together', 'recommend', 'related'],
  'o-marce': ['about', 'our-story', 'brand', 'über-uns', 'o-nas', 'notre-histoire'],
  'dostawa': ['shipping', 'delivery', 'versand', 'dostawa', 'livraison', 'spedizione'],
  'personalizacja': ['personaliz', 'customiz', 'upload', 'design-your', 'configurator', 'gestalte'],
  'benefity': ['benefit', 'feature', 'why-', 'vorteile', 'dlaczego', 'pourquoi', 'icon-with-text', 'multicolumn'],
  'newsletter': ['newsletter', 'email-signup', 'subscribe'],
  'stopka': ['footer'],
  'naglowek': ['header', 'announcement', 'navigation'],
  'hero': ['hero', 'banner', 'image-banner', 'slideshow'],
  'tekst': ['rich-text', 'text-block', 'image-with-text'],
  'kolekcja': ['collection', 'featured-product', 'product-list'],
};

module.exports = { sygnatury, frazy, regexy, selektory, typySekcji };
