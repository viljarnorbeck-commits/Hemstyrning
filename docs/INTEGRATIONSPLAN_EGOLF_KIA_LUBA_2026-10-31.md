# Integrationsplan: e-Golf 2017, Kia EV6 2023 och Mammotion LUBA

**Hemstyrning / Home Assistant — 31 oktober 2026**  
**Status:** Plan och tekniskt beslutsunderlag. Inget har ännu installerats eller ändrats i fordonen/gräsklipparen.

## Slutsats på en sida

Vi vill läsa verkliga fordons- och gräsklippardata i Home Assistant och visa dem i Hemstyrnings app. Allt ska fungera lokalt hemma i möjligaste mån. För LUBA krävs särskilt **verklig och uppdaterad GPS-position** för kartan och 3D-modellen.

| Enhet | Föreslagen lösning | Extra hårdvara | Bedömning |
|---|---|---|---|
| **VW e-Golf 2017** | **OVMS v3** läser CAN via bilens J533-gateway och skickar data över hemmets **2,4 GHz-Wi-Fi till MQTT/Home Assistant**. | Ja, OVMS och anpassat J533-kablage. | Realistisk lösning för mätdata hemma. Klimatstyrning kräver separat utvärdering. |
| **Kia EV6 2023** | Sluta lita på den gamla Tibber-avläsningen. Om data är viktiga: **lokal OVMS/OBD-II-avläsning** via Wi-Fi. | Valfritt; rekommendationen är att avvakta eftersom bilen snart ska ersättas. | Molnintegrationens framtid och villkor är osäkra. |
| **Mammotion LUBA** | Installera **Mammotion-HA via HACS**, verifiera `device_tracker` och positionsuppdateringar under körning. | Normalt inte initialt. ESPHome Bluetooth-proxy kan bli aktuell om den hjälper just modellen. | Status/batteri sannolikt enklare än tillförlitlig GPS; modell och transport behöver testas. |

**Vår prioritering:** 1) LUBA och GPS, 2) e-Golf med OVMS, 3) Kia endast om vi får nytta av den innan Volvo EX60 kommer.

---

# 1. Volkswagen e-Golf 2017

## 1.1 Kan hemmets Wi-Fi ersätta bilens 3G?

**Ja, för en separat eftermonterad avläsningslösning. Nej, normalt inte som en enkel ”3G-omvandlare” till Volkswagens original-Car-Net.**

Originalets mobilmodul är byggd för sin mobilradioteknik och Volkswagens tjänster. En vanlig 4G-router, Wi-Fi-dongel eller mobil hotspot kan inte automatiskt få originalets 2G/3G-modem att prata via Wi-Fi. Bilens infotainment-Wi-Fi är inte heller säkert kopplat till samma telematikmodul. En egen 3G-minibasstation/”femtocell” är inte en rimlig konsumentlösning; den skulle kräva ett fungerande och tillåtet mobilnätssystem.

Volkswagen beskriver att Car-Net/e-Remote påverkas av nedsläckningen av 2G/3G. För **just denna bil** måste VW:s verkstad/VIN-kontroll avgöra om det finns någon godkänd originaluppgradering. Utgå inte från att en generell 4G-retrofit finns.

**Bättre väg:** läs bilens CAN-data med egen elektronik som ansluter direkt till hemmets Wi-Fi.

Källor:
- VW:s dokument om e-Remote och 2G/3G: https://www.volkswagen.se/idhub/content/dam/onehub_master/pc/connectivity-and-mobility-services/car-net/activation/en/2025_e-Remote_Activation_Manual_EN.pdf
- OVMS e-Golf: https://docs.openvehicles.com/en/stable/components/vehicle_vwegolf/docs/index.html

## 1.2 Rekommenderad teknik: OVMS v3

**Open Vehicle Monitoring System (OVMS)** är en liten eftermonterad fordonsdator som läser CAN-bussen och exponerar värden. Det finns dokumenterat fordonsstöd för **VW e-Golf årsmodell 2014–2020**.

Viktigt: den dokumenterade e-Golf-anslutningen går **via J533-gatewayn under instrumentpanelen, ovanför pedalerna**. Vi ska inte köpa en slumpmässig OBD-II-dongel och förutsätta att den ger samma data. OVMS-dokumentationen beskriver ett **pass-through-kablage** som placeras mellan bilens befintliga kontakt och gatewayn. Den nämner VW-kontaktdel **8E0972420** för adapterkonstruktion; kontrollera både hane/hona, pinout och bilens faktiska utförande före köp.

**Vi behöver:**
1. Kompatibel OVMS v3-modul med Wi-Fi.
2. Korrekt J533-pass-through-adapter/kablage för e-Golf 2017.
3. Säker strömförsörjning och montering, helst av någon som kan fordonsel och CAN.
4. Stabilt 2,4 GHz-Wi-Fi där bilen står.
5. MQTT-broker (t.ex. Mosquitto) och MQTT-integration i Home Assistant.
6. OVMS Home Assistant-integration via HACS, eller egna passiva MQTT-sensorer.

**Vi behöver inte:** SIM-kort, fungerande Volkswagen-3G eller uppkoppling när bilen är borta — så länge kravet endast gäller avläsning hemma.

```text
e-Golfens CAN -> J533-adapter -> OVMS v3
                                  |
                                  | Hemmets Wi-Fi, 2,4 GHz
                                  v
                             MQTT-broker
                                  |
                                  v
                             Home Assistant
                                  |
                                  v
                              Hemstyrning
```

Möjliga uppgifter enligt OVMS fordonsstöd: **batteriprocent, räckvidd, laddstatus, temperatur och annan fordonsstatus**. Alla fält måste verifieras på bilen. När bilen sover kan uppdateringar stanna; visa därför **senast uppdaterad**.

Källor:
- e-Golf och installation: https://docs.openvehicles.com/en/stable/components/vehicle_vwegolf/docs/index.html
- OVMS Wi-Fi (2,4 GHz, klientläge): https://docs.openvehicles.com/en/latest/userguide/wifi.html
- OVMS -> Home Assistant/MQTT: https://docs.openvehicles.com/en/latest/userguide/homeassistant.html

## 1.3 Kan vi styra kupévärmen?

**Det är möjligt att det går med ny OVMS-programvara, men det är inte något vi kan lova.**

Den etablerade OVMS-fordonssidan anger fortfarande **”Cabin Pre-heat/cool Control: No”** för e-Golf. En nyare ändringslogg i OVMS-projektet beskriver däremot implementation av **fjärrstart/stopp av förkonditionering via J533/KCAN och BAP**, där bilen använder sin **redan konfigurerade klimattemperatur**. Eftersom den officiella stödsidan och nyare utvecklingskod inte fullt ut överensstämmer ska vi behandla detta som **experimentellt tills rätt firmware, bil och funktion är provade**.

Vi testar **enbart läsning först**. Klimatstyrning blir en separat etapp med manuellt godkännande, kontrollerad miljö och möjlighet att återställa.

Källa: https://github.com/openvehicles/Open-Vehicle-Monitoring-System-3/blob/master/vehicle/OVMS.V3/changes.txt

## 1.4 Genomförande för e-Golf

1. Kontrollera om VW:s egen app fortfarande visar batteri/värme och fråga VW om VIN-specifikt stöd.
2. Verifiera J533-kontakt, OVMS-hårdvaruversion, kabel och ström innan inköp.
3. Montera korrekt kabel och OVMS utan att skada eller förändra originalkablaget.
4. Anslut OVMS som **Wi-Fi-klient** till hemmets 2,4 GHz-nät.
5. Aktivera endast nödvändig MQTT-telemetri till lokal broker med separat användare.
6. Läs data i Home Assistant: batteri, laddstatus, räckvidd, temperatur, tidsstämplar.
7. Kontrollera funktionen när bilen är **avstängd, låst och laddar**; följ samtidigt 12 V-batteriets nivå.
8. Om allt är stabilt: bygg fordonskortet i Hemstyrning.
9. Besluta därefter om vi över huvud taget ska testa fjärrvärme.

**Säkerhet:** Om 12 V-batteriet belastas för mycket, bilen inte kan somna eller felkoder uppstår ska testet avbrytas. CAN är bilens styrnätverk, inte ett riskfritt datagränssnitt.

---

# 2. Kia EV6 2023

## 2.1 Vad händer med Tibber och Kia Connect?

Vi utgår från din faktiska observation: **Tibberkopplingen ger inte längre tillförlitliga EV6-data**. De gamla Kia/Tibber-entiteter som finns i HA-inventeringen får därför **inte visas som aktuella** utan en ny livekontroll.

Det finns en aktiv, inofficiell Home Assistant-integration **Kia Uvo / Hyundai Bluelink**, men den är beroende av Kias inloggnings- och moln-API. Ett större EU-inloggningsproblem rapporterades i augusti 2026 och en korrigering släpptes, men ytterligare inloggningsproblem har fortsatt att rapporteras. Det är därför **inte en garanterad långsiktig lösning**.

Viktigt: Kias villkor för de uppkopplade tjänsterna innehåller begränsningar kring användning av inloggningsuppgifter mot tredjepartstjänster. Vi ska inte rekommendera att kringgå spärrar eller återanvända kontouppgifter utan att kontrollera aktuell rätt att göra det.

Källor:
- Integrationen: https://github.com/Hyundai-Kia-Connect/kia_uvo
- Inloggningsproblem och fix i augusti: https://github.com/Hyundai-Kia-Connect/kia_uvo/issues/1840
- Senare problem: https://github.com/Hyundai-Kia-Connect/kia_uvo/issues/1979
- Kia Connects villkor (exempel, kontrollera aktuell svensk version): https://eu-connect.kia.com/content/dam/kia-uvo/global/assets/legal-docs/Kia%20Connect_Terms%20of%20Use_CC_Europe-English.pdf

## 2.2 Finns ett officiellt API?

**Ja, men det är en affärslösning, inte samma sak som en kostnadsfri privat API-nyckel.** Kia Sverige beskriver ett Vehicle Data API med kundsamtycke och datapaket. Det kräver ett avtal med Kia Connect och enligt den publika informationen finns **integrationskostnad och månadsdebitering**.

För ett privat Hemstyrning-projekt och en bil som snart ska bytas är detta inte kostnadseffektivt.

Källa: https://eu-connect.kia.com/se/business/api/

## 2.3 Går det att få data utan Kias moln?

**Ja: via OBD-II/CAN när bilen är hemma.** Den mest väldokumenterade vägen i vår jämförelse är **OVMS v3**. OVMS har en fordonsmodul för **Hyundai Ioniq 5 / Kia EV6** (HION5) och dokumenterar bland annat **batteriprocent, räckvidd, laddstatus, vissa temperaturer, batterihälsa och BMS-data**.

Till skillnad från e-Golfens J533-lösning anger EV6-modulens dokumentation **OBD-II-kabel till OVMS**. OVMS skickar därefter värden via hemmets Wi-Fi till MQTT och Home Assistant. Det kräver ingen Kia-molninloggning.

Det ger däremot inte automatiskt fjärrklimat, låsning, laddstart eller GPS-spårning när bilen inte är hemma. OVMS anger **”No”** för klimat- och laddstyrning i den dokumenterade EV6-modulen.

Källor:
- OVMS EV6: https://docs.openvehicles.com/en/latest/components/vehicle_hyundai_ioniq5/docs/index.html
- OVMS/Home Assistant: https://docs.openvehicles.com/en/latest/userguide/homeassistant.html

**Viktig begränsning:** En OBD-modul som står inkopplad kan hålla nätverk vakna eller belasta 12 V-batteriet. Vi behöver kontrollera vila, batteriförbrukning och uppdateringsfrekvens. Använd inte okända aktiva CAN-kommandon.

## 2.4 Rekommendation för EV6

Eftersom bilen snart ersätts av en **Volvo EX60**:

1. **Ingen ny Kia-specifik hårdvara just nu.**
2. Behåll EV6 som konfigurerbart fordon i appen, men visa **”Data saknas”** om inga färska värden finns.
3. Bygg ett **generiskt fordonsgränssnitt**: batteri, räckvidd, laddning, temperatur, senast uppdaterad, stödda funktioner.
4. Låt Easee-laddarna ge tillförlitlig **laddarstatus och laddningseffekt oberoende av Kia**.
5. Om Kia-data är viktiga under väntetiden: bedöm lokal OVMS-lösning med samma integrationsprincip som e-Golf.
6. När EX60 levererats: verifiera vilka funktioner Volvos aktuella API och HA-integration **faktiskt stöder för just EX60**, och koppla dem till samma fordonsmodell.

---

# 3. Mammotion LUBA – GPS är huvudkravet

## 3.1 Vad vi vill uppnå

Gräsklipparen ska kunna visa:
- Status: klipper, parkerad, pausar, laddar eller fel.
- Batteriprocent och aktivt klippjobb när integrationen stöder det.
- **Aktuell position** på en karta.
- **Aktuell position i Hemstyrnings 3D-modell**, inklusive knappen *Följ gräsklipparen*.
- Start, pausa och hemkörning **först efter att stödet och säkerheten testats**.

**Modell behöver bekräftas:** LUBA 1/2/3 och firmware kan bete sig olika. En funktion som fungerar för en annan användares LUBA garanterar inte att vår gör det.

## 3.2 Varför är GPS inte självklar?

Mammotion använder GNSS/RTK och ibland andra positioneringstekniker för navigation. **Att klipparen själv vet var den är innebär inte att Home Assistant kan läsa koordinaterna.** Integrationen måste både få och publicera tillförlitliga positionsuppdateringar.

Det finns dokumenterade buggrapporter där `device_tracker` **fastnar på laddstationen trots att klipparen kör**, och för vissa LUBA 3-installationer rapporteras **saknade GPS-/batterientiteter**. Även om andra sensorer fungerar kan just positionen saknas.

Källor:
- GPS fastnar: https://github.com/mikey0000/Mammotion-HA/issues/740
- LUBA 3, GPS saknas: https://github.com/mikey0000/Mammotion-HA/issues/794

## 3.3 Rekommenderad installation

Communityintegrationen **Mammotion-HA** installerar vi via HACS (som finns i den aktuella HA-inventeringen).

1. Se till att klipparen fungerar i **Mammotions officiella app** och att dess position uppdateras när den klipper.
2. Notera **exakt modell**, firmwareversion och hur den ansluter (Wi-Fi, mobilnät, Bluetooth).
3. Följ projektets rekommendation om **separat konto** delat till klipparen om Mammotion-kontodelning stöds; det minskar risken för att integrationen loggar ut den vanliga appen.
4. I Home Assistant: **HACS → menyn → Custom repositories**.
5. Lägg till `https://github.com/mikey0000/Mammotion-HA` med typen **Integration**.
6. Installera en lämplig stabil version. Starta om Home Assistant.
7. Öppna **Inställningar → Enheter och tjänster → Lägg till integration → Mammotion**.
8. Konfigurera med separat konto/valda kommunikationsmöjligheter.
9. Öppna **Utvecklarverktyg → Tillstånd** och sök på `lawn_mower.`, `device_tracker.` och klipparens namn.
10. Leta efter en riktig `device_tracker` med attributen **latitude** och **longitude** samt status och batterisensorer.

```text
LUBA -> Mammotion-HA -> Home Assistant-entiteter
                                  |
                                  v
                             Hemstyrning
                      |                   |
                 Klipparvy           3D-modell
```

Det är inte givet att Wi-Fi-läget är ett rent lokalt API; Mammotion-HA kan använda moln/MQTT och ibland Bluetooth. Första målet är **fungerande och färsk data**, inte att anta att anslutningen är helt offline.

Integration: https://github.com/mikey0000/Mammotion-HA

## 3.4 Så testar vi att GPS verkligen fungerar

Gör testet **när klipparen arbetar**, inte bara när den står i laddstationen.

1. Anteckna aktuell `latitude`, `longitude` och senast uppdaterad-tid i HA.
2. **Stäng Mammotion-appen på mobilen.**
3. Låt klipparen köra mellan flera väl åtskilda punkter.
4. Läs positionen upprepade gånger under några minuter.
5. Kontrollera att koordinaterna **ändras**, att positionerna ligger på tomten och att tidsstämplarna är färska.
6. Jämför med den officiella appens karta och en känd plats (t.ex. laddstationen).
7. Kontrollera att positionen även uppdateras vid övergång mellan olika delar av Wi-Fi-täckningen.
8. Dokumentera faktisk uppdateringsfrekvens, precision och om det blir glapp.

**Godkänt:** minst flera verkliga förflyttningar syns i HA utan att mobilappen behöver vara öppen. Om positionen är låst på laddaren är GPS-kravet **inte uppfyllt**, även om batteriet och klippstatus fungerar.

## 3.5 Om GPS inte uppdateras

Felsök i denna ordning, utan att köpa hårdvara i onödan:

1. Kontrollera versionskompatibilitet, Mammotion-konto/delning, klipparens position i officiella appen, integrationens felloggar och nätverksanslutningen.
2. Kontrollera om `device_tracker` saknas helt eller om den finns men har **gamla koordinater**. Det är två olika fel.
3. Jämför Wi-Fi/moln och Bluetooth-beteende om integrationsversionen stöder det.
4. Om Bluetooth bedöms kunna hjälpa: testa **ESPHome Bluetooth-proxy** inom radioräckvidd. Den är ett *felsökningsexperiment*, ingen garanterad GPS-lösning; BLE kan påverka andra anslutningar.
5. Kontrollera öppna ärenden och korrigeringar i Mammotion-HA. Prova inte okända beta-versioner på driftsatt system utan återställningsplan.
6. Om integrationen fortfarande inte levererar GPS: utred direktgränssnitt via PyMammotion eller annan dokumenterad källa i en separat teknisk prototyp. Först efter att normalt integrationssätt verkligen har misslyckats.

Publicera inte kontotoken, kart-/GPS-historik eller exakt hemposition i offentliga GitHub-ärenden.

## 3.6 GPS till Hemstyrnings 3D-tomt

När vi har fungerande `device_tracker` bygger Codex:

1. Läs **WGS84 latitude/longitude**, tidsstämpel, ev. riktning och kvalitetsindikatorer via befintlig Home Assistant-WebSocket.
2. Omvandla till **lokalt koordinatsystem** (öst/nord i meter) och sedan till 3D-scenens X/Z.
3. **Kalibrera** tomtmodellen med minst två kända punkter för skala/rotation och helst en tredje kontrollpunkt. Använd rätt markhöjd från modellen.
4. Kontrollera om Mammotion-kartan redan använder **kart-offset**. En satellitbild kan ligga förskjuten jämfört med RTK-position. Undvik att lägga till offset två gånger.
5. Uppdatera 3D-modellen endast när ny och rimlig positionsdata kommer; interpolera mjukt **mellan färska punkter**, aldrig genom att hitta på en körväg.
6. Visa tydlig status: **Live / Fördröjd / Senast känd / Position saknas**.
7. Koppla den befintliga knappen **Följ gräsklipparen** till denna verifierade position, utan att skicka styrkommandon.

**Särskilt viktigt:** Behåll möjligheten att visa gräsklipparen i 3D även om GPS tillfälligt försvinner, men märk då positionen som gammal och stoppa kameraföljningen.

Mammotion-HA:s kartguide beskriver bland annat `device_tracker`, GeoJSON och kartoffset:
https://github.com/mikey0000/Mammotion-HA/wiki/maps

---

# 4. Ordning på vårt arbete

| Steg | Åtgärd | Klart när |
|---|---|---|
| **1. LUBA – identifiera** | Kontrollera modell, firmware och att officiella appen visar rörelse. | Vi vet exakt vilken klippare som finns. |
| **2. LUBA – HA** | Installera Mammotion-HA, testa status/batteri/GPS med appen stängd. | Koordinaterna ändras under verklig klippning. |
| **3. LUBA – Hemstyrning** | Kod för koordinatkalibrering, karta, 3D-följning och färskhetsindikator. | Den virtuella klipparen står på rätt plats och följer riktiga rörelser. |
| **4. e-Golf – förarbete** | Kontrollera J533-anslutning och välja OVMS/kabel. | Kompatibilitet bekräftad före köp. |
| **5. e-Golf – HA** | Installera OVMS, Wi-Fi och MQTT, verifiera passiv telemetri. | Batteri/laddning/räckvidd visas, bilen sover och 12 V är stabilt. |
| **6. e-Golf – extra** | Utred experimentell fjärrvärme om behov finns. | Fungerar säkert på just bil/firmware, annars avstå. |
| **7. EV6** | Markera gammal Tibberdata som opålitlig; invänta byte eller välj lokal OBD/OVMS. | Appen visar inte gamla uppgifter som aktuella. |
| **8. EX60** | När bilen finns: verifiera officiella Volvo-funktioner och bind generiska bilfält. | Bytet kräver ny datakoppling, inte ombyggd appdesign. |

## 5. Övergripande krav till kommande Codex-implementation

- Denna text är **plan**, inte en order att ändra Home Assistant eller bilarnas inställningar.
- Utveckla först mot **simulatorn**. Läs verkliga HA-entiteter utan styrkommandon under inventeringen.
- Behåll `HA_ALLOW_CONTROL=false` tills specifika funktioner har verifierats och godkänts.
- Använd **konfigurerbara entitets-ID:n**, aldrig hårdkodade antaganden om Kia, OVMS eller LUBA.
- Dela fordon i generiska fält: `batteryPercent`, `rangeKm`, `charging`, `lastUpdated`, `availability`, `supportedActions`.
- Separera **bilens uppmätta laddstatus** från **Easee-laddarens effekt**: de är olika datakällor.
- Lägg inte in API-nycklar, konton, VIN, exakta koordinater eller rå GPS-historik i GitHub.
- Skilj visuellt mellan **tillgängligt**, **gammal data**, **okänt** och **inte stödd funktion**.
- Vid senare genomförande ska Codex testa, committa och pusha samt ange verkligt nåbara localhost-adresser enligt projektets arbetsregler.

## 6. Saker vi behöver kontrollera när vi tar upp arbetet igen

- **LUBA:** exakt modell (1/2/3 och storlek), firmwareversion, Wi-Fi-täckning över tomten samt om klippare och karta fungerar i Mammotion-appen.
- **e-Golf:** fungerar VW:s egen app idag? Finns önskemål om **bara visning** eller är fjärrstyrd **kupévärme ett krav**?
- **EV6:** fungerar Kias officiella app, och är det värt någon ny investering med tanke på kommande EX60?
- **Hemstyrning:** hur exakt är 3D-modellen georefererad idag, och vilka fasta punkter kan användas för kalibrering?

---

## Källförteckning och osäkerheter

Dokumentationen ovan bygger huvudsakligen på originalprojekten OVMS och Mammotion-HA, Kias publicerade API-villkor samt observerade GitHub-ärenden. Buggrapporter visar **möjliga fel**, inte att de säkert förekommer i vår installation. Funktioner som beskrivs i kod eller ändringsloggar är **inte verifierade på våra fordon**. Pris, lagerstatus, kompatibilitet med specifika firmwareversioner och leveransdatum är inte verifierade här.

- OVMS e-Golf: https://docs.openvehicles.com/en/stable/components/vehicle_vwegolf/docs/index.html
- OVMS e-Golf utvecklingslogg: https://github.com/openvehicles/Open-Vehicle-Monitoring-System-3/blob/master/vehicle/OVMS.V3/changes.txt
- OVMS EV6: https://docs.openvehicles.com/en/latest/components/vehicle_hyundai_ioniq5/docs/index.html
- OVMS Wi-Fi: https://docs.openvehicles.com/en/latest/userguide/wifi.html
- OVMS Home Assistant/MQTT: https://docs.openvehicles.com/en/latest/userguide/homeassistant.html
- VW Car-Net och 2G/3G: https://www.volkswagen.se/idhub/content/dam/onehub_master/pc/connectivity-and-mobility-services/car-net/activation/en/2025_e-Remote_Activation_Manual_EN.pdf
- Kia officiellt API: https://eu-connect.kia.com/se/business/api/
- Kia Uvo: https://github.com/Hyundai-Kia-Connect/kia_uvo
- Kia 2026 felrapport: https://github.com/Hyundai-Kia-Connect/kia_uvo/issues/1979
- Mammotion-HA: https://github.com/mikey0000/Mammotion-HA
- Mammotion kartguide: https://github.com/mikey0000/Mammotion-HA/wiki/maps
- Mammotion GPS felrapport LUBA 1: https://github.com/mikey0000/Mammotion-HA/issues/740
- Mammotion GPS felrapport LUBA 3: https://github.com/mikey0000/Mammotion-HA/issues/794
