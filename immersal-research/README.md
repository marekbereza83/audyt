# immersal-research

Zrzut dokumentacji dewelopera Immersal (`developers.immersal.com/docs/`) — materiał wejściowy do nowego,
niezależnego projektu wykorzystującego SDK/API Immersal. Tymczasowo w repo `audyt`, docelowo do wydzielenia
do osobnego repozytorium — nie jest częścią ani `audyt-kancelarii-skill/`, ani `ecommerce-intel-skill/`.

## Zawartość

- `crawl.js` — jednorazowy skrypt (fetch + cheerio + turndown), pobiera listę stron z `/docs/sitemap.xml`
  i zapisuje każdą jako Markdown w `output/`, mirroring ścieżki URL.
- `output/` — 57 stron dokumentacji (SDK ogólne, mapowanie/mapping, Unity SDK, platformy XR, REST API, FAQ,
  pricing, licencje). Indeks w `output/_index.json`.

## Kod źródłowy (GitHub, org `immersal`)

`repos/` — shallow clone (`--depth 1`, gitignorowane, do odtworzenia jednym `git clone`) trzech repo z 9
publicznych w organizacji `immersal`, wybranych jako najbardziej istotne do startu:

- `repos/imdk-unity` — **rdzeń SDK** (ten sam pakiet co w tutorialu). Pełne źródła C#: `REST.cs`/`RESTJobsAsync.cs`
  (klient REST API), `ImmersalSession.cs`, `Localizer.cs`, `SceneUpdater.cs`, `XRMap.cs`, `TrackingAnalyzer.cs`
  i cała logika lokalizacji (`XR/Localization/*`, `XR/DataProcessing/*`) — dokładnie te komponenty, które opisuje
  `output/unitysdk/immersalcomponents/`.
- `repos/immersal-sdk-ios-samples` — natywne Swift/ObjC (`PosePluginNativeTester`), poza Unity.
- `repos/vps-for-web` — WebAR/WebXR bez Unity: czysty JS (Three.js/Babylon.js) + Wasm (`PosePlugin.wasm`,
  `TrackerPlugin.wasm`) do lokalizacji w przeglądarce.

Pozostałe repo z organizacji (nie sklonowane, tylko odnotowane) — sklonuj analogicznie jeśli będą potrzebne:
`immersal-sdk-samples` (oficjalne przykłady Unity + MappingApp, 219MB), `immersal-8thwall` (integracja z 8th Wall),
`imdk-ml2` + `immersal-sdk-magicleap2-samples`, `immersal-sdk-hololens2-samples`, `immersal-python-tools-for-customer`.

## Odtworzenie

```bash
npm install
node crawl.js
```

Strona jest server-rendered (Retype), więc zwykły `fetch` + parsowanie HTML wystarcza — nie potrzeba
Playwrighta/przeglądarki.

## Uwaga

Nie używa Firecrawl ani klucza API `audyt-kancelarii-skill` — osobny, darmowy mechanizm (plain HTTP fetch),
żeby nie zjadać budżetu produkcyjnego audytu.
