# Hemkontroll – Home Assistant med interaktiv 3D-gård

**Version:** 0.2 – 27 oktober 2026  
**Status:** Projektplan och funktionsprototyp. Ännu ingen anslutning till ett faktiskt Home Assistant-system.  
**Huvudprincip:** Home Assistant är sanningskälla för alla verkliga enheter. 3D-appen visar och styr dem, men tar inte över hemautomationen.

## 1. Målet

En webbaserad och mobilanpassad central kontrollpanel som **startar direkt i 3D-världen i hela webbläsarfönstret**. Den tidigare enhetslistan ska behållas som en utfällbar kontrollista och inte konkurrera med 3D-vyn om skärmytan. Systemet ska kunna:

1. Visa en navigerbar, verklighetsbaserad 3D-modell av gården.
2. Visa **aktuell status** för utomhusbelysning direkt i 3D-världen (lampor och ljusspridning).
3. Växla en lampa genom att klicka på lampan i 3D-modellen; förändringar gjorda i Home Assistant, med en fysisk brytare eller via automation ska också synas i 3D-vyn.
4. Senare visa bilars batterinivå, laddning och fjärrstyrning av kupéklimat.
5. Styra och följa robotdammsugare och robotgräsklippare.
6. Visa fastighetens effekt och energiflöden, solelproduktion, historik och faktiskt elpris.
7. Fungera i första hand lokalt, och visa otillgänglig eller för gammal data på ett tydligt sätt.

**Avgränsning:** Vi börjar med att få **en verklig utomhuslampa** att fungera tvåvägs mellan Home Assistant och en enkel 3D-testmodell. Den interaktiva helskärmsnavigeringen och klickbara objektdialogerna ingår redan i demo- och arkitekturstegen. Fotogrammetrin och övriga system kan byggas därefter utan att göra om grundarkitekturen.

## 2. Föreslagen arkitektur

```text
  Fysiska enheter och molntjänster
  ├── Gårdsbelysning (befintliga reläer / Zigbee / Matter / MQTT / etc.)
  ├── Bilar (tillverkarintegration)
  ├── Robotdammsugare och robotgräsklippare
  ├── Elmätare / HAN/P1 / effektmätare
  ├── Solväxelriktare och ev. batteri
  └── Elpris: Nord Pool eller avtalsspecifik leverantör
                 │
                 ▼
            Home Assistant
         enheter, tillstånd, actions
         logg och energistatistik
                 │
                 │ WebSocket API (ändringar) + actions
                 ▼
      Säker HA-anslutning / adapter
       autentisering, behörighet,
         entity-mappning, återförsök
                 │
                 ▼
         Egen 3D-webbapplikation
        React + TypeScript + Vite
     React Three Fiber / Three.js
                 │
           GLB/GLTF-scenen
       från DJI-bilder + WebODM
          + Blender-justering
```

### Rekommenderad drift

- **Home Assistant OS** på en stabil, alltid påslagen värd (minidator eller VM). Kör installationen och integrationerna först.
- **3D-webbapp** som separat lokal tjänst på samma nät (valfritt Docker och Caddy/Nginx), alternativt inbäddad som Home Assistant-webbpanel.
- **Produktion:** React, TypeScript, Vite, React Three Fiber, drei och Three.js. Blender/export som GLB med komprimerade texturer. En mobil enhet behöver en enklare modell/LOD.
- **Integration:** WebSocket för tillståndsförändringar, API-åtgärder för styrning. Använd gärna Home Assistants klientbibliotek (`home-assistant-js-websocket`) om auth-flödet byggs i klienten på korrekt sätt. För fristående extern app rekommenderas en liten backend/proxy där HA-hemligheter hålls på serversidan, med tydlig inloggning och snäv tillgång till styrbara enheter.
- **Historik/energi:** Använd i första hand Home Assistants Energy Dashboard, recorder och statistikgränssnitt. Undvik att skapa en parallell databas utan konkret behov.

### Viktig skillnad: verklig status vs knapptryckning

```text
Klick på lampa i 3D
    -> begär Home Assistant-action light.turn_on / light.turn_off
    -> visa vänteläge
    -> Home Assistant bekräftar nytt verkligt state
    -> uppdatera lampans ljus i 3D

Fysisk väggbrytare ändrar lampa
    -> Home Assistant får state_changed
    -> 3D-applikationen uppdateras direkt
```

Visa aldrig ett lyckat läge enbart därför att ett kommando skickats. Om lampan är `unknown` eller `unavailable`, gråmarkera och indikera problemet. Krävs en fysisk dimmernivå ska även `brightness`, färg och färgtemperatur kunna läsas och översättas till ljuset i 3D-scenen.

## 3. Skapa en 3D-modell med DJI Mini 5 Pro

### Viktigt att skilja på modelltyper

Fotogrammetri från överlappande bilder ger i första hand en **texturerad 3D-mesh** (byggnader, mark, träd och föremål). Det är rätt grund för en visuellt realistisk 3D-värld. Det är **inte automatiskt en måttsatt CAD-ritning**, och ytor som inte syns i fotona återskapas inte korrekt.

### Fotoplan – första försöket

1. Planera flygning när ljuset är jämnt och skuggorna inte är hårda. Undvik rörliga objekt, stark blåst och stora reflexer.
2. Ta en **lodrät bildserie ovanifrån** i ett ordnat rutnät med omkring **80 % överlapp längs flygriktningen** och **70 % mellan flygstråken**.
3. Ta en andra serie med **snedställd kamera, cirka 40–50° ned från horisontalplanet**, runt husen och över gården för att få fasader, garage, murar och nivåskillnader. Se till att bildserierna överlappar varandra.
4. Ta kompletterande bilder runt hus, carport och träd som skymmer marken. Använd så långt möjligt jämn exponering, låst vitbalans och samma huvudkamera/brännvidd.
5. Arbeta med **originalfotografier**, inte enbart stillbilder extraherade ur video. Spara originalfiler och flyguppgifter.
6. Lägg gärna ut några lätt identifierbara markreferenser och mät ett par faktiska avstånd med måttband/laser – behövs för rimlig skala och lampplacering, inte för survey-/lantmäterinoggrannhet.
7. Kontrollera alltid aktuella flygregler, luftrum och människor på marken innan flygning.

**DJI-funktion:** Mini 5 Pro har stöd för **Waypoint Flight** i DJI Fly. Det är inte samma sak som att DJI Fly automatiskt bygger ett komplett fotogrammetrirutnät. Börja med en manuell, säker capture-plan eller verifiera separat om ett planeringsverktyg verkligen stöder din modell, firmware och fjärrkontroll. Communityprojekt som QGIS/FlyPath existerar, men bör ses som inofficiella och inte som en garanti för säker autopilotimport.

### Modellbearbetning

```text
Fotografier (JPG / metadata)
    -> WebODM / OpenDroneMap
    -> tät punktsvärm + texturerad mesh (typiskt OBJ med texturer)
    -> Blender: rensa flytande geometri, justera skala, lägg origo,
       lagom triangeltal, bevara/optimera texturer
    -> GLB med separat kollisionsmesh vid behov
    -> 3D-appen läser modellen och renderar interaktiv belysning
```

WebODM kan kräva betydande minne och processorkraft för stora bildmängder. Kör modellframställningen på en kraftigare dator vid behov; produktionens 3D-visning ska däremot vara lätt.

**Fotogrammetrins begränsning vid nattläge:** Foton innehåller redan fast ljus och skuggor. För att släcka/tända lampor i 3D-världen korrekt bör grundmodellen fotograferas i dagsljus med relativt jämnt ljus; därefter används programmerade ljuskällor och armaturmaterial i 3D. Riktig global belysning är möjlig men dyr. MVP använder realistisk men förenklad ljusspridning.

## 4. Första tekniska leveransen (MVP)

### Enhet som vi testar först

En utomhuslampa med ett faktiskt `light.*`- eller `switch.*`-entity-id i Home Assistant. Exempel-ID nedan ska **ersättas** med det Home Assistant faktiskt använder.

**Konfigurationsexempel:**

```json
{
  "scene": "/assets/garden-v1.glb",
  "lights": [
    {
      "id": "driveway_a",
      "label": "Infart vänster",
      "entityId": "light.infart_vanster",
      "position": [12.4, 2.8, -7.1],
      "powerW": 8,
      "color": "#ffd5a4",
      "radiusM": 7
    }
  ]
}
```

Modellens position anges i meter relativt en definierad lokal origo. Håll `entityId` skilt från mesh-/objektnamn, så att vi kan byta 3D-modell utan att ändra Home Assistant-konfigurationen.

### Krav för godkänd MVP

- En 3D-testmodell går att rotera, panorera och zooma med mus och pekskärm; tangentbord finns som komplement.
- Klick på en ljusmarkör skickar korrekt `light.turn_on` eller `light.turn_off` (alternativt `switch.*` om enheten är en brytare).
- Ändras lampan i Home Assistant syns den i 3D utan sidomladdning.
- Fysiskt styrd ändring slår igenom när enheten rapporterat det till Home Assistant.
- Inga hårdkodade lösenord/tokens i frontend-repot eller webbläsarbundle.
- Offline/avbrott visas tydligt. UI får inte låtsas att enheten svarat.
- Enhetspositionerna ändras i en konfigurationsfil, inte inbyggt i 3D-geometrin.
- Enkel automatiserad test: både on->off och off->on samt HA-event utan klick.

## 5. Nästa faser och beroenden

| Fas | Mål | Klart när... |
|---|---|---|
| 0 – Inventering | Välj HA-värd och identifiera befintliga lampor | Minst en faktisk styrbar enhet och dess entity-id är verifierade |
| 1 – Koppling | Home Assistant ↔ 3D-testscen | Lampstatus och ändringar fungerar åt båda håll; felstatus fungerar |
| 2 – Gårdsmodell | DJI-bilder -> GLB | Gården går att navigera med acceptabel laddtid och kvalitet |
| 3 – 3D-ljus | Förankra lamppunkter i gårdsmodellen | Rätt ljuspunkter påverkas, dimring motsvarar status |
| 4 – Robotar | Visa och styra gräsklippare/dammsugare | Verklig status och tillåtna start/stopp/dock-kommandon fungerar |
| 5 – Fordon | Batteri, laddning, klimat | Valt bilmärke har verifierade HA-entiteter och kommandon |
| 6 – Energi | Elmätare, solpaneler, elpris | Faktiska effekt- och energisensorer med korrekta enheter och priser |
| 7 – Driftsättning | Backup, auth, mobil, övervakning | Systemet är stabilt, säkert och användbart även när externa moln inte svarar |

### Fordon

Integrationen beror på vilka bilmodeller ni använder. Exempel: **Tesla Fleet** finns i Home Assistant men kräver utvecklarinställningar/nycklar och kan omfattas av API-kostnader. Äldre Model S/X har särskilda begränsningar för sömn och telemetry; förvänta er inte kontinuerlig realtid från alla fordon. Vissa bilar saknar motsvarande API eller kräver tredjepartslösning.

### Robotar

Robotdammsugare använder ofta `vacuum.*`; robotgräsklippare kan exponeras som `lawn_mower.*` genom respektive integration. Börja med de funktioner som den **faktiska modellen** stöder. För gräsklippare: kontrollera om start, paus, hemgång, fel och batteri finns som entiteter; positionsvisning på karta kräver ytterligare stöd.

### El och solpaneler

- **Nu-effekt (kW):** mätning från elmätare/inverter, inte beräknad från dagens kWh.
- **Energi (kWh):** ackumulerad import, export och produktion med korrekta enheter och tillståndsklasser enligt Home Assistant Energy.
- **Spotpris:** Home Assistants Nord Pool-integration eller elleverantörens API. Välj **rätt elområde** utifrån faktisk anläggningsadress och rätt avtalsmodell; anta inte område.
- **Verklig rörlig kostnad:** spotpris är inte totalpris. Lägg till enligt aktuellt avtal påslag, skatter/moms och rörliga nätavgifter; redovisa fasta och effektbaserade avgifter separat.
- **Sol:** läs verklig växelriktare först, komplettera vid behov med `Forecast.Solar` för prognos.

## 6. Föreslagen kodstruktur för Codex

```text
hemkontroll/
  AGENTS.md
  README.md
  apps/
    dashboard/
      src/
        app/                 # routing, layout, inloggning
        scene/               # R3F Canvas, modell, orbit/first-person
        objects/             # lampmarkörer, glow, bilar, robotar
        components/          # paneler, statuskort, energidiagram
        ha/                  # tillståndsmodell, subscriptions, commands
        config/              # mapping mellan entiteter och 3D-objekt
      public/assets/         # optimerad GLB, ej råbilder
  services/
    ha-bridge/               # valbar lokal API-gateway med auth
  models/
    source-notes/            # metadata/instruktioner, inte stora råfoton i Git
  docs/
    ARCHITECTURE.md
    ENTITY_MAPPING.md
    FLIGHT_CAPTURE.md
  tests/
    integration/
```

### Teknikval och kompromisser

- **React Three Fiber:** smidigt när webbgränssnitt och interaktiv scen ska utvecklas ihop; Three.js ger WebGL och GLB-stöd.
- **Egen bridge:** ger bra kontroll över token och tillåtna kommandon för en fristående app, men är en extra tjänst att underhålla. Om appen istället blir en riktig HA-anpassad frontendpanel kan vi utnyttja Home Assistants autentiserade frontendkontext.
- **Modellstorlek:** sikta initialt på en nedbantad modell så att appen fungerar på mobil; behåll full kvalitetsmodell separat. Mät FPS och uppstartstid innan fler effekter byggs.
- **Ingen direkt åtkomst från internet under prototypfasen:** använd LAN och senare VPN/korrekt säker fjärråtkomst om det behövs. Bygg inte öppen gateway till HA.
- **Automationslogik i Home Assistant**, inte utspridd i 3D-koden. Applikationen är en klient.

## 7. Första arbetsuppgiften till Codex

Klistra in följande som den inledande uppgiften i ett nytt repo:

> Bygg ett nytt repository för "Hemkontroll" enligt `PLAN_HOME_ASSISTANT_3D.md`. Börja enbart med fas 1: en Vite + React + TypeScript-app med React Three Fiber, en navigerbar testgård, minst sex konfigurerbara interaktiva lamppunkter och en sidopanel. Allt ska fungera i ett tydligt demomodelläge. Skapa en `HomeAssistantAdapter` med två implementationer: `DemoAdapter` och `LiveAdapter`. Live-läget ska läsa initiala states, prenumerera på HA-stateändringar och anropa actions för lampor. Designa autentiseringen så att inga långlivade HA-token hamnar i klientkod eller Git; fristående live-app ska anropa en lokal backend med behörighetskontroll. Lägg in automatisk reconnect, uppdateringsindikator och korrekt hantering av unknown/unavailable. Låt lampornas positioner och `entityId` finnas i en separat JSON-fil. Konfigurera ESLint, TypeScript-strikt läge och tester för tvåvägssynkronisering. Skriv README med lokala körinstruktioner. Skriv ingen egen komplex backend för sol, bilar eller robotar ännu.

### Testfall för Codex

1. Demo: tänd/släck lampa både via listan och i scenen; UI visar samma tillstånd.
2. Demo: simulera HA-event i adapter utan användarklick; scen uppdateras.
3. Live: HA skickar ny state från fysisk knapp; visningen uppdateras.
4. Live: klick -> vänteläge -> bekräftad status; misslyckat kommando visar fel.
5. Koppla från HA; status markerar frånkopplad och tidigare state behandlas inte som färskt.
6. Byt scen från testvärld till GLB, utan ändringar i HA-integrationen.

## 8. Uppgifter att fastställa under inventeringen

- Var och på vilket sätt körs Home Assistant? Finns Docker/VM/NAS/minidator tillgänglig?
- Vilka lampor är redan smarta och vilket protokoll/relä styr dem?
- Vilka bilmärken/modeller, robotdammsugare och gräsklippare finns?
- Vilken elmätare/HAN-läsare, elhandlare och solväxelriktare finns?
- Ska systemet bara vara lokalt eller även nås säkert från mobil utanför hemmet?
- Ungefärlig tomtstorlek och hur många byggnader ska modelleras?
- Vilken fjärrkontroll och firmware används med DJI Mini 5 Pro?

Dessa frågor hindrar inte att fas 1 börjar med demodata.

## 9. Referenser, kontrollerade i oktober 2026

- [Home Assistant WebSocket API](https://github.com/home-assistant/developers.home-assistant/blob/master/docs/api/websocket.md)
- [Home Assistant Webpage dashboard](https://www.home-assistant.io/dashboards/dashboards/)
- [Home Assistant Energy](https://www.home-assistant.io/docs/energy/)
- [Nord Pool-integration](https://www.home-assistant.io/integrations/nordpool/)
- [Forecast.Solar](https://www.home-assistant.io/integrations/forecast_solar/)
- [Tesla Fleet](https://www.home-assistant.io/integrations/tesla_fleet/)
- [Lawn mower-entity](https://www.home-assistant.io/integrations/lawn_mower/)
- [DJI Mini 5 Pro – Waypoint Flight (DJI)](https://repair.dji.com/help/content?customId=01700007343&documentType=&lang=en&paperDocType=ARTICLE&re=US&spaceId=17)
- [WebODM – råd för fotografering av 3D](https://docs.webodm.org/flying-tips/)
- [QGIS FlyPath – communityverktyg](https://plugins.qgis.org/plugins/FlyPath/)

---

**Medföljande demo:** `hemkontroll_3d_demo.html` är en enda HTML-fil utan externa JavaScript-bibliotek. Den visar en påhittad, interaktiv och roterbar 3D-värld, lampor som kan tändas/släckas i scenen eller i en lista, och simulerad fordons-, robot- och energistatus. Den är en funktionell konceptdemo, **inte** en färdig HA-anslutning och **inte** en modell av den verkliga gården. Produktionsappen ska byggas om enligt tekniska val ovan.


## 10. Förtydligat användargränssnitt – beslutad huvudvy (v0.2)

**Första sidan är alltid en helskärmsvy av hela gården.** Inga permanenta sidokolumner, tabellkort eller stora dashboards ovanpå gården. En smal toppmeny med anslutningsstatus och knappen **Lista** räcker. Listan från version 0.1 behålls som sidopanel, och alla detaljer öppnas i en inspektionspanel ovanpå 3D-vyn; när panelen stängs fortsätter användaren precis där den var.

| Klick i 3D | Visad data | Styrning / navigering |
|---|---|---|
| Solpanelerna på taket | Total effekt kW, energi idag kWh, solöverskott, växelriktarstatus, modullista när sådana sensorer finns | Inspektionspanel, detaljdiagram |
| Bil 1 och bil 2 på uppfarten | Batteri i %, laddning i kW, räckvidd, ström A, spänning V, aktuell klimatiseringsstatus | Starta/stoppa kupéklimat; enbart bekräftad status visas som verklig |
| Gårdens lampor | På/av, effekt, eventuellt ljusstyrka/färgtemperatur | Tänd/släck enskild lampa och se dess ljuskägla samtidigt |
| Mammotion LUBA 3 AWD | Batteri, pågående arbete, klippframsteg, senaste positionsmätning, uppskattning och osäkerhet | Följ klipparen med kameran, pausa/återuppta om kontroll finns |
| Robotdammsugare | Status, batteri, aktuell uppgift | Via enhetslistan tills inomhusmodellen finns |
| Energigenväg/listan | Husets realtidseffekt, solel, inköp/försäljning, elpris | Historik och statistik |

**Inga påhittade mätvärden i produktion.** Prototypen visar påhittade exempelvärden och märks därför genomgående som **DEMO**. Om ett fordon inte kan leverera laddström eller om solväxelriktaren endast rapporterar strängnivå ska den dimensionen visa *saknar data* i stället för ett gissat värde.

### Belysning, tid på dygnet och fototexturer

- Använd samma 3D-koordinatsystem i fotogrammetrimodellen, lampmappningen och objektpositionerna. Lampan som man klickar på ska ha korrekt placering även om modellen byts.
- Home Assistant är sanningskälla för lampornas faktiska tillstånd och ljusstyrka. Den grafiska effekten kan beräknas med dynamiskt emissivmaterial, punktljus, spotlight, mjuka skuggor och markbelysning.
- Fast ljus från fotograferade texturer måste tonas ned eller korrigeras för att lampor verkligen ska kunna *släckas*. Fotografera helst i jämnt dagsljus utan tända utelampor.
- För dygns- och väderanpassning: använd fysisk luxgivare på huset, tidsstämpel, solhöjd, väderdata och säsong som variabler. Översätt först dessa till fysisk ljusnivå, dimnivå och färgtemperatur. Generativ AI för väderutseende kan vara ett separat, förberäknat texturlager men ska inte styra enheter eller förfalska live-status.
- Fotografera en sommarscen och en vinterscen med samma kontrollpunkter. Matcha geometri och koordinatsystem, men räkna med manuella korrigeringar för snö, vegetation och tillfälliga föremål. LOD på mesh/texturer för mobilprestanda.

## 11. Mammotion LUBA 3 AWD – positionshistorik och mjuk livevy

Målet är att rendera en mjukt animerad gräsklippare även när Home Assistant bara får positionsmätningar med några sekunders mellanrum. **Den animerade positionen är uppskattad tills nästa verkliga mätning kommer**. Kartan får aldrig användas för säkerhetskritisk körning eller robotens egen navigation.

### Möjliga datakällor och osäkerheter

1. Undersök HACS-integrationen **Mammotion-HA** (`mikey0000/Mammotion-HA`), inklusive dess `device_tracker` och eventuella rörelsesensorer. LUBA 3 förekommer i rapporter från användare, men firmware, integration och datakvalitet måste verifieras på den faktiska modellen.
2. Mammotion har även en **officiell Open API** från oktober 2026 som åtminstone beskriver enhetsstatus, batteri, nätverk och vissa kommandon. De öppna exemplen garanterar **inte** att tillräckligt frekventa GPS-koordinater ingår. Vid behov: separat bakomliggande adapter för positionstelemetri från en fungerande anslutningsmetod, eventuellt MQTT. Undvik flera parallella klienter som stör enhetens anslutning.
3. Testa med ett verkligt positionsspår: lat/lon eller lokal XY, hastighet/riktning om tillgängliga, mätningens **faktiska tidsstämpel**, precision/RTK-status, uppkopplingsstatus och klipparens rörelsestatus. Mät verkligt uppdateringsintervall, jitter och stiltider före fastställande av prognosparametrar.
4. Gör en **lokal meterbaserad transform** från WGS84 till den fotograferade gårdens XY-plan, med minst två inmätta kalibreringspunkter och rotationsvinkel. Hantera geodetisk kartoffset uttryckligen.

### Rekommenderad algoritm

```text
Vid telemetri från HA:
  validera att timestamp är monoton, koordinat är rimlig och precision acceptabel
  spara position + tid + eventuellt fart/riktning i ringbuffert, max 180 s
  kasta bort omöjliga hopp och anomalier, men spara dem i felsökningsloggen
  uppdatera bekräftad punkt och mjuk korrigering mot denna

Varje animationsruta:
  beräkna viktad rörelsevektor från de sista giltiga punkterna
  använd helst rapporterad heading och hastighet om de är tillförlitliga
  ge kort extrapolation från senaste verkliga positionen (exempel max 6 s/3 m)
  mjuka ut övergången till nya mätningar utan att hitta på långa körsträckor
  sätt extrapolerad status om mätningen inte är färsk
  frys senast säkra position om timeout uppnås eller roboten är pausad/dockad
  visa mätålder, osäkerhet och skillnad mellan uppmätt och uppskattat läge
```

Demoimplementeringen kör mjuk 3D-uppdatering varje bildruta, simulerar telemetri var 4,5:e sekund, sparar högst tre minuters historik, hastighetsbegränsar prognosen och visar både spår och estimat. Det är **inte** en ansluten LUBA 3 och tidsparametrarna är inte kalibrerade mot verklig telemetri.

### Gränssnitt mellan adapter och renderer

```ts
export interface MowerFix {
  sampledAt: string; // ISO 8601, sensorns tid, inte mottagningens tid
  localX: number;     // meter i gårdens koordinatsystem
  localZ: number;
  headingDeg?: number;
  speedMps?: number;
  accuracyM?: number;
  source: 'gps' | 'rtk' | 'cloud' | 'simulated';
}
export interface MowerState {
  available: boolean;
  activity: 'mowing' | 'paused' | 'returning' | 'charging' | 'idle' | 'unknown';
  batteryPercent?: number;
  progressPercent?: number;
  position?: MowerFix;
}
```

Adapter behöver läsas som en fortlöpande ström eller händelser, **inte polling varje animationsruta**. Vid föråldrad, okänd eller otillgänglig signal ska kameraföljning vara möjlig men visa senaste kända plats och osäkerhet, inte "live".

## 12. Mätbar acceptans för nästa Codex-etapp

- Helskärm: `100vw × 100dvh` och laddar direkt i 3D-vy utan att enhetslistan måste stängas.
- Alla knappar i tidigare listan finns kvar, och minst solpaneler, två bilar, sex lampor och LUBA 3 kan aktiveras genom klick på sina 3D-objekt.
- Solpaneler visar total/individuell mätning **endast när datakällan stödjer det**, samt tydlig markering om värdena är simulering.
- Bilar kan styras via bekräftade Home Assistant-kommandon, inte enbart lokalt flip i UI.
- För en lampa: tänd via 3D, släck med fysisk brytare/annan HA-klient; bägge uppdaterar 3D och enhetslistan. Hantera unavailable och timeout.
- LUBA 3: testa mätning var 2–15 sekund och förlorad uppkoppling. Inga överdrivna hopp, inga oändliga prognoser, ingen falsk "LIVE"-etikett.
- Sol/energidata presenterar enheter konsekvent: W/kW som effekt, Wh/kWh som energi, och elpris med rätt komponenter för aktuell timme/kvart.
- Navigering fungerar på mobil (pekgester och paneler), desktop (mus, zoom och WASD) och hög DPI; visa kvalitetsinställning för tunga GLB-modeller.
- Säkert nätverk: hemligheter serversida; servern verifierar varje begärd action mot behörighetslista, loggar status och hindrar godtyckliga HA-anrop.

### Relevanta primärkällor

- Home Assistant WebSocket: https://contributors.home-assistant.io/core/internals/websocket-api/
- Mammotion Developer Open API: https://developer.mammotion.com/docs/get-device-informations
- Mammotion-HA: https://github.com/mikey0000/Mammotion-HA
- GPS/mappning i Mammotion-HA: https://github.com/mikey0000/Mammotion-HA/wiki/maps
