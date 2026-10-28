# Användning och arkitektur

För fullständig funktion-/begränsningslista och modellanalys, se [FEATURE_STATUS.md](FEATURE_STATUS.md).

## Starta lokalt

```bash
npm install
npm run dev
```

- Hemkontroll: <http://localhost:5173/>
- Utvecklingssimulator: <http://localhost:5173/dev/simulator>
- Redigerare: <http://localhost:5173/editor>
- Backendhälsa: <http://localhost:8123/health>

## Vanligt användarläge

Första sidan är en helskärmsvy av gården. Klicka på markörerna för lampor, bilar,
solpaneler, energi och robotar. **Lista** visar samma konfigurerade enheter. Inspektörer
visar bara mottagna mätvärden; saknade fält markeras och äldre data vid avbrott skiljs
från aktuell anslutning. Lampor och övriga kommandon väntar på statebekräftelse.

Dra för rotation, högerdra/två fingrar för panorering och scrolla/nyp för zoom.
Markörnamn visas vid hover/fokus eller val och närliggande markörer separeras för
att gå att klicka på. På mobil öppnas inspektören ovanpå världen och stängs med ×.

Inställningslänken öppnar separat redigeringsläge. Användarläget har ingen källväljare
eller reglage för simulering. Serverns centrala HA-anslutning gäller hela appen.

## Utvecklingssimulator

Välj ett av fjorton scenarier, justera datum (ISO UTC), tidsfaktor, väder, moln,
regn/snö 0–1, vind/byar, sikt, snötäcke och årstidsmodell. Välj luxläge och uppdaterings-
intervall för att testa mätningar, brus/fel, uteblivna rapporter och outliers.

Välj valfri entitet för state och attribut i JSON och skicka en extern ändring.
Överstyrningen består tills **Återgå till modell** används. Detta tillåter avsiktliga
felvärden. Lampor/grupper kan även tändas/släckas med tjänsteknapparna. Individuella
bilinställningar och antal bilar ändras i bilarnas JSON. Styrrobotar från Hemkontroll
eller ändra deras state/attribut i utvecklingssidan. GPS-intervall, variation och
hopp/fördröjning/bortfall ställs i miljöformuläret.

**Bryt WebSocket-anslutningar** testar återanslutning. Historik och prognoser kan
hämtas med motsvarande knappar. Utvecklingssidan använder en fast anslutning till
simulatorn; den kan aldrig följa serverns live-brygga till verkliga enheter.

## Modell- och objektredigering

1. Öppna `/editor`, välj årstidsplats och importera en GLB med inbäddade resurser.
2. Kalibrera modellposition, skala och axlar/nord. Världen använder Y upp, nord −Z,
   öst +X. Rotation är Euler YXZ: X = −90° korrigerar Z-upp innan Y vrider nord.
3. Använd gemensamma referenspunkter och ett känt avstånd. Markera årstiden som
   verifierad först när rätt skanning faktiskt har importerats och kalibrerats.
4. Välj objekttyp och klicka på modellens yta. En lampa får 2,5 modellenheters
   starthöjd över träffytan. Flytta/rotera/skala med gizmo eller fält; `G` flyttar,
   `R` roterar. På mobil döljs panelen under placeringen; Visa verktyg öppnar den igen.
5. Lampans ljus pekar lokalt längs −Y. Justera rotation, lumen, spridning och räckvidd.
6. Markera minst tre hörn i kantordning för en plan tak-/materialyta och Slutför yta.
   Dela tak med olika lutningar i separata ytor. Färg, råhet och metallisk andel sparas.

Objektens världspositioner ligger under en separat scenrot och ändras inte av modell-
kalibrering eller modellbyte. Startplaceringarna är inte inmätta positioner.

I objektets avancerade JSON-kopplingar kan mätvärdesfält anges som `entity_id` eller
`entity_id@attribut`. För bilar anger `climate` och `charging` explicit entitet för
kommandon, exempelvis en `climate.*` respektive `switch.*`. `position` kan ange en
separat positionsentitet för klipparen. Lokala x/z eller lat/lon relativt scenens
geografiska origo/nord kan användas; en verklig integration måste verifieras innan
fält och precision betraktas som säkra.

## Beständig lagring

Ändringar autosparas efter en sekund; Spara är också tillgängligt. Servern schema-
validerar och skriver atomiskt till `data/scene.json`. GLB-importer lagras under hash
i `data/models/`. Dessa filer överlever server-/datoromstart och är gitignorerade.
Säkerhetskopiera hela data/; JSON-export innehåller bara modellreferenser, inte filer.
Simulatortillstånd och den begränsade historikbufferten är däremot minnesbaserade.

## Anslutning och miljö

Det befintliga simulatorlagret (StateStore, tjänster och events) återanvänds.
`/connection-api` och `/connection-ws` är appens gemensamma gränssnitt. Bryggan använder
simulatorn som standard. För riktig HA anges båda `HA_REAL_URL` och `HA_REAL_TOKEN`
i ignorerad `.env`, varefter `npm run dev` startas om. Verifiera först entiteter och
kommandokopplingar. Inga token går till webbläsaren. Ingen riktig HA har aktiverats
i denna implementation.

Solposition beräknas från UTC/plats; molnighet och begränsad luxkorrigering påverkar
ljuset. SMHI läses via valbar HA-väderentitet. Lux kompletterar ljusmodellen och har
inställbar sensorförstärkning/vikt och uppskattat avdrag för gårdsbelysning. Felaktig,
gammal och saknad sensorinformation får inte behandlas som säker mätning.

Automatisk snömodell kräver en färsk verifierad lokal snösensor. SMHI-prognos ersätter
inte observerat snötäcke. I simulatorn väljs årstidsmodell manuellt utan att objekt
flyttas. Fyra separata årstidsskanningar och originalets externa textur saknas ännu.

Klipparens rendering filtrerar hopp/äldre rapporter, behåller tre minuters historik
och extrapolerar högst sex sekunder/tre meter. Uppskattat, senast känt, mätålder och
GPS-fel visas. Vid stale/offline eller paused/docked sker ingen fortsatt extrapolering.

## Kvalitet och verifiering

`node scripts/audit-model.mjs` analyserar originalet. `npm run prepare:model` bevarar
vertexfärger/UV och skapar två detaljnivåer utan att hitta på detaljer eller skala ned
bilder. Använd automatisk kvalitet eller explicit låg/hög i redigeraren. Hög kvalitet
aktiverar dyrare skuggkartor. Prestanda på verklig mobil och högkvalitetsläge på dator
behöver också verifieras på målmaskinvara.

```bash
npm test
npm run typecheck
npm run build --workspace @hemkontroll/dashboard
npx playwright install chromium  # första gången
npm run test:e2e                 # körande npm run dev krävs
```
