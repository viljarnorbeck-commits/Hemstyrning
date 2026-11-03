# Automatiskt 3D-utbyte

## Godkänd provisorisk visning från 3 november

Den tidigare Daniels-referensen föreställer en annan fastighet i Varberg. Den kan
inte användas som fysisk registreringsreferens för gården i Kyrkås. Efter uttryckligt
användargodkännande sparas därför en separat visningspolicy i den befintliga
`scene.modelExchange.displayPlacement`, via `/workspace-api/model-exchange/display-placement`.
Den anger `kind:user-approved-provisional`, producentens fasta `sourceFrameId`,
godkännandetid och visningstransform. Den frysta ramen och originalfilerna ändras inte.

Samma importör kontrollerar fortfarande hash, GLB, texturer, utsträckning och att
källramen matchar det lokala godkännandet. Den använder visningstransformen i stället
för att påstå fysisk passning mellan två olika gårdar. Importhistorik och kvitto
anger `placementKind:user-approved-provisional` och `physicalAlignmentVerified:false`.
Producentens `alignmentVerified:false` förblir oförändrad. Saknas lokal policy gäller
alltjämt kraven på verifierad fysisk kalibrering nedan.

Användaren bad också att rensa gamla 3D-placeringar. De 55 enhetsdefinitionernas
positioner/rotationer/punkter nollställdes och `placementConfirmed=false` sparades;
renderaren visar dem då inte. Namn, HA-kopplingar, lampinställningar, robotfunktioner
och hemskärmskonfiguration bevarades. Ingen ny lampplacering görs automatiskt.
Varbergsmodellen finns kvar som oförändrat historiskt underlag, men används inte
i några aktiva modellplatser eller som synlig reserv för den första gårdsimporten.
En äldre klient får inte återställa gamla placeringar över detta godkännande.

Utbyte: `C:\Hemstyrning-3D-utbyte`. Ingen fil i RealityScan-/Blender-projektet ändras.

`npm run models:sync` behandlar nya leveranser en gång. `npm run dev:model-exchange`
bevakar var 15:e sekund och ingår i `npm run dev`. Importarbetet körs i en separat
Node-process, utan Home Assistant-kommandon. Befintliga servrar behöver inte startas
om för att mottagaren ska kunna köras separat.

Valfria miljövariabler: `HEM_MODEL_EXCHANGE_DIR` och `HEM_MODEL_EXCHANGE_API`
(endast en loopback-adress, standard `http://127.0.0.1:5173`).

## Permanent referens

Vid första körningen fryses den nuvarande lokala scenen som ett namngivet
koordinatsystem. Den aktuella modellens faktiska GLB, nodtransformer och normaliserade
accessorer avkodas för att välja tre icke-kollinjära referenspunkter.

Följande exporteras till `consumer/`:

- `coordinate-system.json`: fryst ID, enheter, referensmodellens SHA256,
  grundtransform, gränser samt ankarnas `baselineSource` och `world`.
- `yard-reference.glb`: oförändrad kopia av Hemstyrnings befintliga visningsmodell.
- `current-placements.json`: redan befintliga enheters positioner och placeringarnas
  bekräftelsestatus, så arbetet kan fortsätta med ofullständig geometri.
- `status.json`: vald modellversion och referens.

Enheterna är **befintliga lokala gårdsenheter**, inte verifierade uppmätta meter.
Nuvarande GPS-position och skala saknar inmätta kontrollpunkter. De används därför
inte som automatisk georeferering. Den frysta ramen flyttas inte när ny geometri
kommer. Alla nya modeller ska passas in i den, inte tvärtom.

## Publicera en leverans

Publicera i `versions/<unik-version>/`. Äldre producentformat under `releases/`
stöds också. Arbeta i en stagingkatalog och skriv `manifest.json` **sist**, genom
atomiskt namnbyte. Publicerade filer är oföränderliga.

```json
{
  "schemaVersion": 1,
  "version": "v000002",
  "status": "published",
  "publishedAt": "2026-11-02T22:00:00Z",
  "complete": false,
  "model": "model.glb",
  "calibration": "calibration.json",
  "targetSeasons": ["summer", "autumn", "firstSnow", "winter"],
  "textures": [],
  "files": [
    {"path": "model.glb", "sha256": "64 hextecken"},
    {"path": "calibration.json", "sha256": "64 hextecken"},
    {"path": "VERSION.txt", "sha256": "64 hextecken"},
    {"path": "validation.json", "sha256": "64 hextecken"}
  ]
}
```

`ready=true,status=complete` accepteras som äldre publiceringsmarkör. Detta är
leveransens färdigstatus; `complete=false` betyder ofullständig geometri och är
tillåtet. `VERSION.txt`, när den ingår, ska innehålla samma version. `files` får
även vara ett objekt med relativa filnamn som nycklar och SHA256-metadata som värden.
Texturer får vara inbäddade; externa lokala resurser måste stå i fillistan och bäddas
in i en **ny lokal kopia** vid import. Originalleveransen skrivs aldrig om.

Kalibreringen innehåller `schemaVersion:1`, `coordinateSystemId`,
`referenceModelSha256`, `alignmentVerified:true`, `sourceToYard` och `anchorMatches`.
`sourceToYard` har `position:[x,y,z]`, `rotation:[x,y,z]`, `scale`,
`rotationOrder:"YXZ"`, `rotationUnit:"degrees"`.
`anchorMatches` är en array av `{ "id":"reference-a", "source":[x,y,z] }`
för samtliga frysta ankare. `source` avser GLB-scenens koordinater efter dess interna
nodtransformer men före `sourceToYard`. Residualen får vara högst 0,05 gårdsenheter.
Ankare kan ligga utanför en beskuren delmodell. Inpassningen måste ändå verifieras
av producenten mot referensen; en uppskattad GPS-skala räcker inte.

## Skydd och återkörning

Importören kontrollerar SHA256 för alla filer, GLB-struktur, buffertar, geometri,
UV, bildavkodning, stödda tillägg, koordinatram, ankare och rimlig utsträckning.
Absoluta sökvägar, katalogflykt och externa URL-resurser avvisas. Bildformat är
PNG/JPEG/WebP; okända obligatoriska GLB-tillägg avvisas. Gränser: GLB 256 MB,
leverans 512 MB, 20 miljoner positioner och 150 megapixlar per textur.

Aktivering sker via en separat administrativ workspace-API-operation. Den läser
den senaste scenen inuti samma skrivkö som vanliga sparningar och ändrar bara
modellplatserna samt importmetadata. Objekt, HA-bindningar, ljus, kameravy och
geografi är kvar. En modellrevision stoppar samtidiga modelländringar. Vanliga
sparningar från en gammal klient får inte skriva över en ny import eller ta bort
den frysta referensen.

Versionshistorik, SHA256 och tidigare modeller finns i scenens `modelExchange`.
Samma version aktiveras bara en gång; ändrad kontrollsumma för en importerad
version avvisas. Äldre publiceringar ersätter inte nyare. Befintlig modell visas
under laddning och ligger kvar vid laddfel; vid kallstart finns föregående modell
som reserv. En modell med osäker kalibrering aktiveras aldrig.

Frågor och fel skrivs som idempotenta JSON-begäranden i `requests/`. Faktisk läsning
kvitteras med SHA256 och probe-nonce i `access-checks/`, separat från
`validationPassed` och `activated`. Ett läskvitto är inte ett kalibreringsgodkännande.

Mottagaren lämnas igång även när ingen färdig modell finns. Ingen testsvit startas
av importen. `npm run test:model-exchange` kör dess isolerade filvalideringsprov
när användaren åter tillåter tester.
