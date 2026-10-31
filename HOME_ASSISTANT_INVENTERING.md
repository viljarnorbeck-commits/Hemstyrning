# Inventering av Home Assistant

## Sammanfattning

Avläst 2026-10-31T09:59:00.423Z (UTC). Installationens version: **2026.9.1**. Detta är en ögonblicksbild, inte ett funktionstest eller ett bevis på fysisk funktion.

| Mått | Antal |
| --- | --- |
| Enheter i enhetsregistret | 133 |
| Entiteter i entitetsregistret | 1950 |
| Entiteter med aktuellt state-objekt | 770 |
| State-entiteter utanför registret | 31 |
| Unika entiteter totalt (union) | 1981 |
| Områden | 26 |
| Konfigurationsposter för integrationer | 57 |
| Unika integrationsdomäner med konfigurationspost | 36 |
| Laddade komponentidentifierare (även plattformar) | 280 |
| Registrerade tjänstebeskrivningar/funktionsingångar | 406 |
| Rapporterar tillstånd | 540 |
| Otillgänglig | 175 |
| Okänd | 55 |
| Avaktiverad | 1211 |
| Saknar tillstånd | 0 |

**Vad räknas som funktion?** De 406 funktionerna är registrerade tjänstebeskrivningar, inte lika många fysiskt verifierade funktioner. Entiteterna är egna informations-/funktionspunkter och får inte adderas till tjänsteantalet. Integrationsposter, laddade komponenter och integrationstyper är olika mått.

## Metod, säkerhet och tolkning

- Anslutningsuppgifter lästes ur lokal `.env` endast till processminnet. Ingen token har exporterats till rapporten.
- Endast HTTP GET användes. WebSocket användes för autentisering och uttryckligen läsande register-, dashboard- och energifrågor. Inga tjänsteanrop, skrivande WebSocket-kommandon, automationer, scener eller skript kördes.
- Område är entitetens eget område, annars enhetens område. Saknat område redovisas uttryckligen. Funktionskategori är en analytisk gruppering utifrån domän, integrationsplattform, enhetsmodell och attribut; den är inte HA:s eget områdesregister.
- Enhetsantal per kategori avser distinkta enhetsregisterposter som har minst en entitet i kategorin. Samma enhet kan förekomma i flera kategorier; summera därför inte kategoriernas enhetsantal. En registerpost är inte nödvändigtvis en fysisk apparat.
- ”Rapporterar tillstånd” betyder state som varken är `unknown` eller `unavailable`; även `off` och `not_home` hör hit. Okänd är en separat grupp. Avaktiverade poster saknar aktuellt state och är inte automatiskt trasiga.
- Funktionsflaggor och lägen är vad integrationen annonserar. Attribut på otillgängliga entiteter kan vara gamla. Inga annonserade styrfunktioner har provats.
- Namn och entity_id behålls för identifiering. Länkar, autentiseringsdata, adresser i fritext, nätverksidentifierare och godtyckliga attributvärden exporteras inte. GPS-koordinater, medieinnehåll, kalenderinnehåll och närvarohistorik publiceras inte. Tabellen listar attributnamn och säker kapabilitetsmetadata.

## API-täckning och begränsningar

| Läsning | Resultat |
| --- | --- |
| `/api/` | 200 |
| `/api/config` | 200 |
| `/api/states` | 200 |
| `/api/services` | 200 |
| `/api/components` | 200 |
| `config/entity_registry/list` | True |
| `config/device_registry/list` | True |
| `config/area_registry/list` | True |
| `config/floor_registry/list` | True |
| `config/label_registry/list` | True |
| `config_entries/get` | True |
| `lovelace/dashboards/list` | True |
| `lovelace/config` | True |
| `energy/get_prefs` | True |
| `lovelace/config` | True |
| `lovelace/config` | False / config_not_found |
| `lovelace/config` | True |
| `lovelace/config` | False / config_not_found |
| `lovelace/config` | True |
| `lovelace/config` | True |

Detaljkonfiguration för **42 automationer och 13 skript** försöktes med GET: **55 svar HTTP 401**. Detta gäller dessa endpoints trots att REST-state och WebSocket-register går att läsa. Ingen ändrad behörighet eller annan autentiseringsväg provades. **5 scener** saknade konfigurations-ID i state och kunde inte detaljläsas på den vägen. Utlösare, villkor, åtgärdssekvenser och scenernas mål är därmed inte verifierade.

Två namngivna dashboardkonfigurationer svarade `config_not_found`; det bevisar inte att vyerna saknas för alla användare. Dashboardinnehåll och tjänstebeskrivningar kan nämna entiteter utan att de är tillgängliga. Ingen historik, fysisk GPS-noggrannhet, långsiktig datakvalitet, loggbok, hemlig integrationskonfiguration eller installerade men oladdade Python-paket har verifierats.

## Integrationer

Alla läsbara integrationsdomäner sammanställs nedan med antal konfigurationsposter och deras status. Enhetsantal omfattar både konfigurationsposternas enhetskopplingar och entitetsregistrets plattformskopplingar. Registerplattformar och laddade komponenter kompletterar YAML- och interna integrationer som inte har egen konfigurationspost. Kontonamn och integrationstitlar som kan innehålla adresser publiceras inte.

| Integration/plattform | Konfigurationsposter | Poststatus | Kopplade enheter | Registerentiteter | Med state |
| --- | --- | --- | --- | --- | --- |
| `analytics` | 1 | loaded: 1 | 0 | 0 | 0 |
| `apple_tv` | 1 | loaded: 1 | 1 | 2 | 2 |
| `automation` | 0 | Ingen egen läst konfigurationspost | 0 | 42 | 42 |
| `backup` | 1 | loaded: 1 | 1 | 5 | 5 |
| `cast` | 1 | loaded: 1 | 25 | 24 | 24 |
| `cloud` | 0 | Ingen egen läst konfigurationspost | 0 | 1 | 1 |
| `daikin_residential` | 1 | not_loaded: 1 | 1 | 15 | 0 |
| `easee` | 1 | loaded: 1 | 2 | 86 | 70 |
| `energy` | 0 | Ingen egen läst konfigurationspost | 0 | 5 | 5 |
| `esphome` | 4 | loaded: 4 | 4 | 31 | 31 |
| `ferroamp` | 1 | loaded: 1 | 6 | 132 | 132 |
| `generic` | 1 | loaded: 1 | 1 | 1 | 1 |
| `generic_thermostat` | 0 | Ingen egen läst konfigurationspost | 0 | 1 | 1 |
| `group` | 2 | loaded: 2 | 0 | 3 | 3 |
| `hacs` | 1 | loaded: 1 | 17 | 34 | 18 |
| `hassio` | 1 | loaded: 1 | 19 | 120 | 16 |
| `homekit` | 4 | loaded: 4 | 4 | 0 | 0 |
| `hue` | 2 | loaded: 1, setup_retry: 1 | 19 | 35 | 22 |
| `influxdb` | 1 | loaded: 1 | 0 | 0 | 0 |
| `input_boolean` | 0 | Ingen egen läst konfigurationspost | 0 | 2 | 2 |
| `input_number` | 0 | Ingen egen läst konfigurationspost | 0 | 2 | 2 |
| `input_select` | 0 | Ingen egen läst konfigurationspost | 0 | 2 | 2 |
| `ipp` | 1 | not_loaded: 1 | 0 | 0 | 0 |
| `knx` | 1 | loaded: 1 | 1 | 94 | 91 |
| `mcp_server` | 1 | loaded: 1 | 0 | 0 | 0 |
| `mobile_app` | 8 | loaded: 8 | 8 | 954 | 40 |
| `mqtt` | 1 | loaded: 1 | 0 | 0 | 0 |
| `nodered` | 1 | loaded: 1 | 2 | 25 | 25 |
| `nordpool` | 1 | loaded: 1 | 1 | 25 | 8 |
| `person` | 0 | Ingen egen läst konfigurationspost | 0 | 2 | 2 |
| `power_saver` | 1 | loaded: 1 | 1 | 10 | 10 |
| `robonect` | 1 | loaded: 1 | 1 | 97 | 35 |
| `schedule` | 0 | Ingen egen läst konfigurationspost | 0 | 1 | 1 |
| `script` | 0 | Ingen egen läst konfigurationspost | 0 | 13 | 13 |
| `shelly` | 2 | loaded: 2 | 2 | 27 | 13 |
| `songpal` | 1 | loaded: 1 | 1 | 1 | 1 |
| `soundtouch` | 2 | not_loaded: 2 | 0 | 0 | 0 |
| `soundtouchplus` | 2 | loaded: 2 | 2 | 2 | 2 |
| `sun` | 1 | loaded: 1 | 1 | 9 | 6 |
| `switch_as_x` | 2 | loaded: 2 | 0 | 2 | 2 |
| `telegram_bot` | 1 | loaded: 1 | 2 | 2 | 2 |
| `template` | 0 | Ingen egen läst konfigurationspost | 0 | 3 | 3 |
| `thread` | 1 | loaded: 1 | 0 | 0 | 0 |
| `tibber` | 1 | loaded: 1 | 5 | 30 | 30 |
| `timer` | 0 | Ingen egen läst konfigurationspost | 0 | 1 | 1 |
| `updater` | 0 | Ingen egen läst konfigurationspost | 0 | 1 | 1 |
| `wled` | 2 | loaded: 1, setup_error: 1 | 2 | 51 | 35 |
| `xiaomi_miio` | 2 | loaded: 2 | 2 | 43 | 25 |
| `yale` | 1 | loaded: 1 | 2 | 14 | 14 |

### Samtliga laddade komponentidentifierare

`ai_task`, `air_quality`, `alarm_control_panel`, `analytics`, `api`, `apple_tv`, `apple_tv.binary_sensor`, `apple_tv.media_player`, `apple_tv.remote`, `application_credentials`, `assist_pipeline`, `assist_satellite`, `auth`, `automation`, `backup`, `backup.event`, `backup.sensor`, `battery`, `binary_sensor`, `blueprint`, `bluetooth`, `bluetooth_adapters`, `brands`, `button`, `camera`, `cast`, `cast.media_player`, `climate`, `cloud`, `cloud.tts`, `command_line`, `command_line.sensor`, `config`, `conversation`, `counter`, `cover`, `date`, `datetime`, `device_automation`, `device_tracker`, `diagnostics`, `door`, `easee`, `easee.binary_sensor`, `easee.button`, `easee.light`, `easee.sensor`, `easee.switch`, `energy`, `energy.sensor`, `esphome`, `esphome.climate`, `esphome.sensor`, `esphome.switch`, `esphome.update`, `event`, `fan`, `ferroamp`, `ferroamp.sensor`, `ffmpeg`, `file_upload`, `frontend`, `garage_door`, `gate`, `generic`, `generic.camera`, `generic_thermostat.climate`, `geo_location`, `group`, `group.light`, `group.sensor`, `group.switch`, `hacs`, `hacs.switch`, `hacs.update`, `hardware`, `hassio`, `hassio.binary_sensor`, `hassio.sensor`, `hassio.switch`, `hassio.update`, `history`, `history_stats.sensor`, `homeassistant`, `homeassistant.scene`, `homekit`, `http`, `hue`, `hue.binary_sensor`, `hue.event`, `hue.light`, `hue.scene`, `hue.sensor`, `hue.switch`, `humidifier`, `humidity`, `illuminance`, `image`, `image_processing`, `image_upload`, `influxdb`, `infrared`, `input_boolean`, `input_button`, `input_datetime`, `input_number`, `input_select`, `input_text`, `intent`, `knx`, `knx.binary_sensor`, `knx.button`, `knx.climate`, `knx.cover`, `knx.date`, `knx.datetime`, `knx.fan`, `knx.light`, `knx.notify`, `knx.number`, `knx.scene`, `knx.select`, `knx.sensor`, `knx.switch`, `knx.text`, `knx.time`, `knx.weather`, `labs`, `lawn_mower`, `light`, `llm`, `lock`, `logbook`, `logger`, `lovelace`, `map_tiles`, `mcp_server`, `media_player`, `media_source`, `mobile_app`, `mobile_app.binary_sensor`, `mobile_app.device_tracker`, `mobile_app.notify`, `mobile_app.sensor`, `modbus`, `modbus.sensor`, `moisture`, `motion`, `mqtt`, `mqtt.sensor`, `network`, `nodered`, `nodered.binary_sensor`, `nodered.button`, `nodered.number`, `nodered.select`, `nodered.sensor`, `nodered.switch`, `nodered.text`, `nodered.time`, `nordpool`, `nordpool.binary_sensor`, `nordpool.sensor`, `notify`, `number`, `occupancy`, `onboarding`, `persistent_notification`, `person`, `power`, `power_saver`, `power_saver.binary_sensor`, `power_saver.sensor`, `power_saver.switch`, `radio_browser`, `radio_frequency`, `recorder`, `remote`, `repairs`, `robonect`, `robonect.binary_sensor`, `robonect.button`, `robonect.device_tracker`, `robonect.lawn_mower`, `robonect.sensor`, `robonect.switch`, `scene`, `schedule`, `script`, `search`, `select`, `sensor`, `shell_command`, `shelly`, `shelly.binary_sensor`, `shelly.button`, `shelly.camera`, `shelly.climate`, `shelly.cover`, `shelly.event`, `shelly.light`, `shelly.media_player`, `shelly.number`, `shelly.select`, `shelly.sensor`, `shelly.switch`, `shelly.text`, `shelly.update`, `shelly.valve`, `siren`, `snmp.switch`, `songpal`, `songpal.media_player`, `soundtouchplus`, `soundtouchplus.media_player`, `stream`, `stt`, `sun`, `sun.binary_sensor`, `sun.sensor`, `switch`, `switch_as_x`, `switch_as_x.light`, `system_health`, `system_log`, `tag`, `telegram_bot`, `telegram_bot.event`, `telegram_bot.notify`, `telnet.switch`, `temperature`, `template`, `template.binary_sensor`, `template.sensor`, `text`, `thread`, `tibber`, `tibber.binary_sensor`, `tibber.notify`, `tibber.sensor`, `time`, `timer`, `trace`, `tts`, `update`, `usb`, `utility_meter`, `utility_meter.sensor`, `vacuum`, `valve`, `vibration`, `wake_word`, `water_heater`, `weather`, `web_rtc`, `webhook`, `websocket_api`, `window`, `wled`, `wled.button`, `wled.light`, `wled.number`, `wled.select`, `wled.sensor`, `wled.switch`, `wled.update`, `xiaomi_miio`, `xiaomi_miio.binary_sensor`, `xiaomi_miio.button`, `xiaomi_miio.sensor`, `xiaomi_miio.vacuum`, `yale`, `yale.binary_sensor`, `yale.button`, `yale.camera`, `yale.event`, `yale.lock`, `yale.sensor`, `zeroconf`, `zone`

## Områden

| Område | Enheter direkt i området | Entiteter efter områdesarv | Rapporterar | Otillgängliga | Okända | Avaktiverade/utan state |
| --- | --- | --- | --- | --- | --- | --- |
| Baren | 1 | 0 | 0 | 0 | 0 | 0 |
| Barnkammare | 1 | 0 | 0 | 0 | 0 | 0 |
| Bilar | 0 | 0 | 0 | 0 | 0 | 0 |
| Biosalongen | 1 | 2 | 2 | 0 | 0 | 0 |
| Elektriskt | 2 | 35 | 18 | 0 | 0 | 17 |
| Entrédörr | 1 | 7 | 6 | 0 | 1 | 0 |
| Festen | 2 | 8 | 1 | 1 | 5 | 1 |
| Garaget | 1 | 48 | 30 | 10 | 1 | 7 |
| Halloween hue | 9 | 21 | 2 | 6 | 4 | 9 |
| Halloween lights outdoor | 0 | 1 | 1 | 0 | 0 | 0 |
| Härbret | 1 | 15 | 0 | 0 | 0 | 15 |
| Hönshus | 0 | 1 | 1 | 0 | 0 | 0 |
| Köket | 0 | 0 | 0 | 0 | 0 | 0 |
| Ladan | 1 | 93 | 86 | 6 | 1 | 0 |
| Lampor | 2 | 3 | 1 | 1 | 0 | 1 |
| Lilla Badrummet | 1 | 1 | 0 | 0 | 1 | 0 |
| Pluggen | 1 | 1 | 1 | 0 | 0 | 0 |
| Skarvkablar | 1 | 13 | 0 | 7 | 0 | 6 |
| Sovrum | 1 | 1 | 0 | 0 | 0 | 1 |
| Stora Badrummet | 1 | 1 | 1 | 0 | 0 | 0 |
| Trädgården | 1 | 97 | 27 | 2 | 6 | 62 |
| Vardagsrum | 2 | 16 | 7 | 0 | 1 | 8 |
| Vardagsrummet | 1 | 0 | 0 | 0 | 0 | 0 |
| Verkstadsentre | 1 | 7 | 6 | 0 | 1 | 0 |
| Viljars Rum | 1 | 26 | 0 | 18 | 0 | 8 |
| trappen | 0 | 0 | 0 | 0 | 0 | 0 |
| Ej områdesplacerad | 100 | 1584 | 350 | 124 | 34 | 1076 |

## Funktionskategorier – antal

| Kategori | Enheter | Entiteter totalt | Med state | Rapporterar | Otillgängliga | Okända | Avaktiverade | Utan state, ej avaktiverade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Belysning och brytare | 48 | 125 | 95 | 73 | 22 | 0 | 30 | 0 |
| Klimat och temperatur | 16 | 73 | 42 | 18 | 16 | 8 | 31 | 0 |
| Energi, elpris och solproduktion | 16 | 236 | 219 | 176 | 35 | 8 | 17 | 0 |
| Bilar och laddare | 3 | 92 | 76 | 57 | 15 | 4 | 16 | 0 |
| Robotgräsklippare och robotdammsugare | 3 | 141 | 61 | 27 | 28 | 6 | 80 | 0 |
| Mediaspelare och ljud | 28 | 29 | 29 | 8 | 20 | 1 | 0 | 0 |
| Automationer, scener och skript | 1 | 60 | 60 | 53 | 2 | 5 | 0 | 0 |
| Närvaro, dörrar och säkerhet | 11 | 34 | 34 | 24 | 1 | 9 | 0 | 0 |
| Övriga givare | 12 | 267 | 28 | 13 | 10 | 5 | 239 | 0 |
| Hjälpare och övriga funktioner | 13 | 38 | 36 | 12 | 15 | 9 | 2 | 0 |
| System, integrationer och diagnostik | 64 | 886 | 90 | 79 | 11 | 0 | 796 | 0 |

## Viktiga verifierade fynd

- **Energi:** Ferroamp exponerar nät-, last-, växelriktar- och soleffekt samt energiräknare och strängdata. Tibber och Nord Pool exponerar prisdata. W/kW är effekt, Wh/kWh energi; reaktiv effekt och skenbar effekt ska inte blandas in i husets aktiva förbrukning. Batterientiteter förekommer men är otillgängliga i ögonblicksbilden.
- **Energiinställningar:** läsningen visar en nätkälla, en solkälla och fyra poster av typen `gas`. Detta verifierar konfigurationens typer, inte att fyra fysiska gasmätare finns. Några källor kan vara hjälplösningar; betydelsen måste granskas före visualisering.
- **Bil:** sex EV6-entiteter via Tibber ger laddnivå, målladdnivå, uppskattad återstående räckvidd, inkoppling, laddning och anslutning. Enhetsmetadata anger `Kia_offline`/`EV6`; detta bevisar inte en separat aktiv Kia-integration eller tillgång till klimat, lås och GPS.
- **Laddare:** Easee exponerar laddstatus, effekt, sessionsenergi och livstidsenergi för höger och vänster laddare. Fyra Easee-registerposter betyder inte automatiskt fyra fysiska laddare.
- **Robotklippare:** `lawn_mower.automower_robonect`, Robonect och modell Husqvarna Automower 340x hittades. Status, batteri och separata GPS-latitud-/longitudsensorer finns. Flaggor 7 annonserar start av klippning, paus och dockning. GPS-sensorers existens verifierar inte färskhet, rörelse eller noggrannhet. Ingen Mammotion/LUBA-integration har identifierats i det lästa underlaget.
- **Dammsugare:** två vacuum-state-entiteter finns, båda otillgängliga. Xiaomi/Roborock-relaterade drift-, städ- och underhållssensorer finns i registret. Tillgänglig fysisk städning eller kartström är inte verifierad.
- **Klimat:** tre climate-state-entiteter finns; två rapporterar tillstånd och en är otillgänglig. Daikin finns också som integrations-/registermetadata; en registerpost utan state är inte en verifierat användbar klimatanläggning.
- **Ljus och ljud:** 24 light-, 87 switch- och 28 media_player-state-entiteter finns. Exakta lägen och funktionsflaggor per entitet redovisas nedan.
- **Säkerhet och övrigt:** Yale/lås, person-/enhetsspårning, kamera, mobilgivare, KNX, ESPHome, Shelly, WLED, HomeKit, Node-RED, MQTT, hjälpare, notifiering och systemdiagnostik förekommer i lästa register/komponenter. Förekomst av en integration innebär inte att alla dess tänkbara funktioner finns.

## Enhetsregister – samtliga enheter

D-numret är rapportens lokala referens, inte ett HA-ID. Alla namn kommer från enhetsregistret; namn saknas där det anges. Status är en sammanställning av enhetens entiteter, eftersom enhetsregistret saknar en generell onlineflagga. Enheter utan entiteter kan inte tillgänglighetsbedömas.

| Ref | Namn | Tillverkare | Modell | Område | Entiteter | Tillgänglighet |
| --- | --- | --- | --- | --- | --- | --- |
| D001 | Advanced SSH & Web Terminal | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D002 | Allente 1 | Unknown manufacturer | Allente 1 | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D003 | Allente 1 | Unknown manufacturer | Allente 1 | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D004 | Automower | Robonect | Husqvarna Automower 340x | Trädgården | 97 | Avaktiverad: 62, Okänd: 6, Otillgänglig: 2, Rapporterar tillstånd: 27 |
| D005 | Backup | Home Assistant | Home Assistant Backup | Ej områdesplacerad | 5 | Rapporterar tillstånd: 5 |
| D006 | Baren | Signify Netherlands B.V. | Room | Baren | 0 | Inga entiteter; okänd tillgänglighet |
| D007 | Barnkammare | Signify Netherlands B.V. | Room | Barnkammare | 0 | Inga entiteter; okänd tillgänglighet |
| D008 | Biljard sovrum | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D009 | BinarySensor | Node-RED |  | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D010 | Busvebacken  | Tibber | Price Sensor | Ej områdesplacerad | 5 | Rapporterar tillstånd: 5 |
| D011 | CLT-L29 | HUAWEI | CLT-L29 | Ej områdesplacerad | 99 | Avaktiverad: 94, Okänd: 2, Rapporterar tillstånd: 3 |
| D012 | Carro Pixel 10 Pro | Google | Pixel 10 Pro | Ej områdesplacerad | 134 | Avaktiverad: 129, Okänd: 2, Rapporterar tillstånd: 3 |
| D013 | Carrocast | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D014 | Charger Card | tmjo | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D015 | Chromecast0004 | Google Inc. | Chromecast HD | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D016 | Chromecast1013 | Google Inc. | Chromecast HD | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D017 | Chromecast3798 | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D018 | Chromecast4360 | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D019 | ChromecastAudio Verkstan | Unknown manufacturer | Chromecast Audio | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D020 | DaikinHärbret | Daikin | BRP069C4x | Härbret | 15 | Avaktiverad: 15 |
| D021 | Dummy | Tibber | Dummy | Ej områdesplacerad | 6 | Okänd: 2, Rapporterar tillstånd: 4 |
| D022 | EASEE Höger | Easee | Easee Home | Garaget | 47 | Avaktiverad: 7, Okänd: 1, Otillgänglig: 10, Rapporterar tillstånd: 29 |
| D023 | EASEE Höger | Easee | Easee Home | Ej områdesplacerad | 6 | Rapporterar tillstånd: 6 |
| D024 | EMHASS | EMHASS Add-on Energy Management for Home Assistant | Home Assistant App | Ej områdesplacerad | 7 | Avaktiverad: 6, Rapporterar tillstånd: 1 |
| D025 | ESPHome Device Builder | ESPHome | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D026 | EV6 | Kia_offline | EV6 | Ej områdesplacerad | 6 | Okänd: 2, Rapporterar tillstånd: 4 |
| D027 | Easee EV Charger | tmjo, olalid, astrandb | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D028 | Easee Vänster | Easee | Easee Home | Ej områdesplacerad | 39 | Avaktiverad: 9, Okänd: 1, Otillgänglig: 5, Rapporterar tillstånd: 24 |
| D029 | Easee Vänster | Easee | Easee Home | Ej områdesplacerad | 6 | Rapporterar tillstånd: 6 |
| D030 | Energy Sankey Card | davet2001 | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D031 | EnergyHub | Ferroamp | — | Ladan | 93 | Okänd: 1, Otillgänglig: 6, Rapporterar tillstånd: 86 |
| D032 | Entrédörr | Yale Home Inc. | IRCN190916 | Entrédörr | 7 | Okänd: 1, Rapporterar tillstånd: 6 |
| D033 | Eskil Nilsson (1256376962) | Telegram | Polling | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D034 | Eskils Pixel 7 Pro | Google | Pixel 7 Pro | Ej områdesplacerad | 114 | Avaktiverad: 109, Okänd: 2, Rapporterar tillstånd: 3 |
| D035 | Familjerum | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D036 | Familjerum | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D037 | Ferroamp Sensors | henricm, argoyle | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D038 | Festen | Signify Netherlands B.V. | Room | Festen | 6 | Okänd: 5, Rapporterar tillstånd: 1 |
| D039 | Generic Camera | Generic | — | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D040 | Generic Camera:21065 | Home Assistant | Camera | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D041 | Glances | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D042 | Google tv Streamer | Google | Google TV Streamer | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D043 | GoogleTV4569 | Google | Google TV Streamer | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D044 | Grafana | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D045 | HA Vibecode Agent | HA Vibecode Agent Repository | Home Assistant App | Ej områdesplacerad | 7 | Avaktiverad: 6, Rapporterar tillstånd: 1 |
| D046 | HACS | hacs.xyz |  | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D047 | HASS Bridge:21064 | Home Assistant | HomeBridge | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D048 | HT-A9 | Sony Corporation | HT-A9 | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D049 | HT-A9 | Sony Corporation | HT-A9 | Biosalongen | 1 | Rapporterar tillstånd: 1 |
| D050 | Halloween  | Signify Netherlands B.V. | Hue Bridge | Halloween hue | 1 | Avaktiverad: 1 |
| D051 | Home Assistant Core | Home Assistant | Home Assistant Core | Ej områdesplacerad | 3 | Avaktiverad: 2, Rapporterar tillstånd: 1 |
| D052 | Home Assistant Host | Home Assistant | Home Assistant Host | Ej områdesplacerad | 5 | Avaktiverad: 5 |
| D053 | Home Assistant Operating System | Home Assistant | Home Assistant Operating System | Ej områdesplacerad | 5 | Avaktiverad: 4, Rapporterar tillstånd: 1 |
| D054 | Home Assistant Supervisor | Home Assistant | Home Assistant Supervisor | Ej områdesplacerad | 3 | Avaktiverad: 2, Rapporterar tillstånd: 1 |
| D055 | Honshuset | Espressif | d1_mini | Ej områdesplacerad | 6 | Otillgänglig: 3, Rapporterar tillstånd: 3 |
| D056 | Hue Smart plug 1 | Signify Netherlands B.V. | Hue Smart plug | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D057 | Hue dimmer switch 1 | Signify Netherlands B.V. | Hue dimmer switch | Halloween hue | 6 | Avaktiverad: 1, Okänd: 4, Rapporterar tillstånd: 1 |
| D058 | InfluxDB | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D059 | KNX Interface | — | — | Ej områdesplacerad | 9 | Avaktiverad: 3, Rapporterar tillstånd: 6 |
| D060 | Lampa 2 Stolpe Väg | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D061 | Lampa 3 | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D062 | Lampa 5 Bron | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D063 | Lampa 6 | Signify Netherlands B.V. | Hue color lamp | Festen | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D064 | Lampa 7 Globen | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D065 | Lampa 8 Stolpe Bron | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D066 | Lampa 9 Härbre | Signify Netherlands B.V. | Hue color lamp | Halloween hue | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D067 | Lampor | Signify Netherlands B.V. | Room | Lampor | 1 | Rapporterar tillstånd: 1 |
| D068 | LillaBadrummet | Bose Corporation | SoundTouch SA-4 | Lilla Badrummet | 1 | Okänd: 1 |
| D069 | Lågpris period lång | Power Saver | Price Optimizer | Elektriskt | 10 | Rapporterar tillstånd: 10 |
| D070 | MariaDB | Official apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D071 | Matsal Shellydimmer2 | Shelly | Shelly Dimmer 2 | Vardagsrum | 14 | Avaktiverad: 8, Okänd: 1, Rapporterar tillstånd: 5 |
| D072 | Mosquitto broker | Official apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D073 | NestMini2849 | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D074 | NestMini8699 | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D075 | NestMini9561 | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D076 | Node-RED | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D077 | Node-RED Companion | zachowj | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D078 | Nord Pool SE2 | — | — | Elektriskt | 25 | Avaktiverad: 17, Rapporterar tillstånd: 8 |
| D079 | Philips hue | Signify Netherlands B.V. | BSB002 | Ej områdesplacerad | 1 | Avaktiverad: 1 |
| D080 | Pixel 10 Pro | Google | Pixel 10 Pro | Ej områdesplacerad | 134 | Avaktiverad: 129, Okänd: 1, Rapporterar tillstånd: 4 |
| D081 | Pixel 10 Pro | Google | Pixel 10 Pro | Ej områdesplacerad | 128 | Avaktiverad: 123, Okänd: 1, Rapporterar tillstånd: 4 |
| D082 | Plex Media Server | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D083 | Pluggen | Signify Netherlands B.V. | Room | Pluggen | 1 | Rapporterar tillstånd: 1 |
| D084 | Power Flow Card Plus | flixlix | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D085 | Power Saver | jyourstone | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D086 | Robonect | geertmeersman | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D087 | SSO 22110358 | Ferroamp | PS00990-A04 | Ej områdesplacerad | 8 | Rapporterar tillstånd: 8 |
| D088 | SSO 23070555 | Ferroamp | PS00990-A04 | Ej områdesplacerad | 8 | Rapporterar tillstånd: 8 |
| D089 | SSO 23070559 | Ferroamp | PS00990-A04 | Ej områdesplacerad | 8 | Rapporterar tillstånd: 8 |
| D090 | SSO 23070568 | Ferroamp | PS00990-A04 | Ej områdesplacerad | 8 | Rapporterar tillstånd: 8 |
| D091 | SSO PS00990-A04-0358 | Ferroamp | — | Ej områdesplacerad | 7 | Otillgänglig: 7 |
| D092 | Samba share | Official apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D093 | Sankey Chart Card | MindFreeze | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D094 | SarimnerBackup | Home Assistant | Home Assistant Mount | Ej områdesplacerad | 1 | Avaktiverad: 1 |
| D095 | SarimnerMedia | Home Assistant | Home Assistant Mount | Ej områdesplacerad | 1 | Avaktiverad: 1 |
| D096 | Sensor | Node-RED | NodeRedFlow | Ej områdesplacerad | 3 | Otillgänglig: 3 |
| D097 | Shelly1PM_Skarvkabel_1 | Shelly | Shelly 1PM | Skarvkablar | 13 | Avaktiverad: 6, Otillgänglig: 7 |
| D098 | Simple Vacuum Card | benct | plugin | Ej områdesplacerad | 2 | Rapporterar tillstånd: 2 |
| D099 | SoundTouchPlus | thlucas | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D100 | Sovrum | Signify Netherlands B.V. | Room | Sovrum | 1 | Avaktiverad: 1 |
| D101 | Sovrum | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D102 | StoraBadrummet2 | Bose Corporation | SoundTouch SA-5 | Stora Badrummet | 1 | Rapporterar tillstånd: 1 |
| D103 | Studio Code Server | Home Assistant Community Apps | Home Assistant App | Ej områdesplacerad | 8 | Avaktiverad: 7, Rapporterar tillstånd: 1 |
| D104 | Sun | — | — | Ej områdesplacerad | 9 | Avaktiverad: 3, Rapporterar tillstånd: 6 |
| D105 | Telenor Mediahubb | Unknown manufacturer | Telenor Mediahubb | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D106 | Test | Google Inc. | Google Cast Group | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D107 | Utelampa vid kulor | Signify Netherlands B.V. | Hue color lamp | Lampor | 2 | Avaktiverad: 1, Otillgänglig: 1 |
| D108 | Vardagsrum | Apple | Apple TV 4K (gen 2) | Vardagsrum | 2 | Rapporterar tillstånd: 2 |
| D109 | Vardagsrum | Google Inc. | Chromecast | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D110 | Vardagsrummet | Signify Netherlands B.V. | Room | Vardagsrummet | 0 | Inga entiteter; okänd tillgänglighet |
| D111 | Verkstadsentre | Yale Home Inc. | IRCN190916 | Verkstadsentre | 7 | Okänd: 1, Rapporterar tillstånd: 6 |
| D112 | Viljars Pixel 10 Pro | Google | Pixel 10 Pro | Ej områdesplacerad | 126 | Avaktiverad: 121, Okänd: 2, Rapporterar tillstånd: 3 |
| D113 | Viljars Pixel 7 Pro | Google | Pixel 7 Pro | Ej områdesplacerad | 126 | Avaktiverad: 121, Okänd: 2, Rapporterar tillstånd: 3 |
| D114 | Viljars Pixel Watch 3 | Google | Pixel Watch 3 | Ej områdesplacerad | 93 | Avaktiverad: 88, Okänd: 2, Rapporterar tillstånd: 3 |
| D115 | Viljars Saker | Google Inc. | Google Cast Group | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D116 | Viljars rum | Google Inc. | Google Nest Mini | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D117 | Viljars❤️ | Google Inc. | Chromecast HD | Ej områdesplacerad | 1 | Otillgänglig: 1 |
| D118 | Viljars❤️❤️ | Google Inc. | Chromecast HD | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D119 | Volkswagen Connect | robinostlund | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D120 | Vvb-Och-Vp-Styrning | Espressif | d1_mini | Ej områdesplacerad | 16 | Otillgänglig: 7, Rapporterar tillstånd: 9 |
| D121 | Vvb-Och-Vp-Styrning | Espressif | d1_mini | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D122 | WLED-Viljar1 | WLED | FOSS | Viljars Rum | 26 | Avaktiverad: 8, Otillgänglig: 18 |
| D123 | WLED-Viljar2 | WLED | FOSS | Ej områdesplacerad | 25 | Avaktiverad: 8, Otillgänglig: 17 |
| D124 | Watchman | dummylabs | integration | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D125 | Xiaomi Vacuum Map Card | PiotrMachowski | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D126 | Xiaomi Vacuum cleaner | Xiaomi | roborock.vacuum.s6 | Ej områdesplacerad | 23 | Avaktiverad: 9, Otillgänglig: 14 |
| D127 | apexcharts-card | RomRider | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D128 | busvebacken | Telegram | Polling | Ej områdesplacerad | 1 | Rapporterar tillstånd: 1 |
| D129 | button-card | custom-cards | plugin | Ej områdesplacerad | 2 | Avaktiverad: 1, Rapporterar tillstånd: 1 |
| D130 | e-golfen Door locked:21066 | Home Assistant | Lock | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D131 | e-golfen Trunk locked:21067 | Home Assistant | Lock | Ej områdesplacerad | 0 | Inga entiteter; okänd tillgänglighet |
| D132 | roborock.vacuum | Xiaomi | roborock.vacuum | Ej områdesplacerad | 20 | Avaktiverad: 9, Otillgänglig: 11 |
| D133 | vardagsrum_temperatur | espressif | PLATFORMIO_D1_MINI | Ej områdesplacerad | 9 | Otillgänglig: 9 |

## Fullständig entitetsförteckning per kategori och område

Samtliga 1981 unika entity_id redovisas exakt en gång. HA:s egna kategorier `config`/`diagnostic` visas separat. Attributnamn anger vilken information som rapporteras; värden kan vara gamla eller okända. Registerposter utan state har ingen verifierad kapabilitetslista.

### Belysning och brytare

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| All Hue Outdoor | `light.all_hue_outdoor` | Ingen enhetsregisterkoppling | `group` | normal | Rapporterar tillstånd | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `effect`, `color_mode`, `brightness`, `color_temp_kelvin`, `hs_color`, `rgb_color`, `xy_color`, `entity_id`, `supported_features` |
| Bänkbelysning Kök | `light.bankbelysning_kok` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | flaggor 0; färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `supported_features` |
| Köksbord | `light.koksbord` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | flaggor 0; färglägen: onoff; fält: `supported_color_modes`, `color_mode`, `supported_features` |
| AktorE1D_Belysning_ute_ledljus | `light.ledljus_honshus` | Ingen enhetsregisterkoppling | `switch_as_x` | normal | Rapporterar tillstånd | flaggor 0; färglägen: onoff; fält: `supported_color_modes`, `color_mode`, `supported_features` |
| Nattlyse Uppe | `light.nattlyse_uppe` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | flaggor 0; färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `supported_features` |
| AktorE1E_Belysning_utanför_hönshus | `light.takljus_utanfor_honshus` | Ingen enhetsregisterkoppling | `switch_as_x` | normal | Rapporterar tillstånd | flaggor 0; färglägen: onoff; fält: `supported_color_modes`, `color_mode`, `supported_features` |
| Trappbelysning | `light.trappbelysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | flaggor 0; färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `supported_features` |
| WLED-Viljar2 | `light.wled_viljar2` | D123 | `wled` | normal | Otillgänglig | flaggor 36 (effektval, övergång); färglägen: rgb; fält: `restored`, `effect_list`, `supported_color_modes`, `supported_features` |
| Namn saknas | `switch.advanced_ssh_web_terminal` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| AktorA1_B1_Port10_Ute_Stolpar_Belysning | `switch.aktora1_b1_port10_ute_stolpar_belysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port11_Hall_Vägg_Entré_Belysning | `switch.aktora1_b1_port11_hall_vagg_entre_belysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port12_TV-Bänk | `switch.aktora1_b1_port12_tv_bank` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port1_Hall_Uttag_Fönster_Trapp | `switch.aktora1_b1_port1_hall_uttag_fonster_trapp` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port2_Taklampa_Trapp-hall | `switch.aktora1_b1_port2_taklampa_trapp_hall` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port3_Taklampa_Entre-hall | `switch.aktora1_b1_port3_taklampa_entre_hall` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port5_Bron_Uttag | `switch.aktora1_b1_port5_bron_uttag` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port6_Ute_Stolpar_Uttag | `switch.aktora1_b1_port6_ute_stolpar_uttag` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port7_Hall_Trapp_Uttag_konst_på | `switch.aktora1_b1_port7_hall_trapp_uttag_konst_pa` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port8_Kök_Uttag_Fönster_NV | `switch.aktora1_b1_port8_kok_uttag_fonster_nv` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B1_Port9_Kök_Fönster_NV | `switch.aktora1_b1_port9_kok_fonster_nv` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port10_Kök_Vattenkokare_Timer | `switch.aktora1_b2_port10_kok_vattenkokare_timer` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port11_Vardagsrum Vä_Gml_Matningen | `switch.aktora1_b2_port11_vardagsrum_va_gml_matningen` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port12_Badrum_Under_Trapp_Tvättho | `switch.aktora1_b2_port12_badrum_under_trapp_tvattho` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port1_Vardagsrum_Öppenspis_belysning | `switch.aktora1_b2_port1_vardagsrum_oppenspis_belysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port2_Kök_Uttag_Microbänk | `switch.aktora1_b2_port2_kok_uttag_microbank` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port3_Vardagsrum_konstant | `switch.aktora1_b2_port3_vardagsrum_konstant` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port4_Kök_köksbord_belysning | `switch.aktora1_b2_port4_kok_koksbord_belysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port5_Kök_uttag_Köksbänk | `switch.aktora1_b2_port5_kok_uttag_koksbank` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port6_Hall_Takspot | `switch.aktora1_b2_port6_hall_takspot` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port7_Vardagsrum_tak_öppenspis | `switch.aktora1_b2_port7_vardagsrum_tak_oppenspis` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port8_Kök_Vinkyl | `switch.aktora1_b2_port8_vardagsrum_fonster_va` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorA1_B2_Port9_Altan_Vägg_Belysning | `switch.aktora1_b2_port9_altan_vagg_belysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port10_LillaBadrummet_Uttag | `switch.aktorb1_b3_port10_lillabadrummet_uttag` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port11_LillaHallen_Lamptuttag | `switch.aktorb1_b3_port11_lillahallen_lamptuttag` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port12_Trappbelysning_Tak | `switch.aktorb1_b3_port12_trappbelysning_tak` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port1_Sov1_uttag | `switch.aktorb1_b3_port1_sov1_uttag` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port2_NIL | `switch.aktorb1_b3_port2_nil` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port3_LillaBadrummet_Spegelbelysning | `switch.aktorb1_b3_port3_lillabadrummet_spegelbelysning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port4_NIL | `switch.aktorb1_b3_port4_nil` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port5_Bastu_Tak | `switch.aktorb1_b3_port5_bastu_tak` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port6_Matning_DALI-don | `switch.aktorb1_b3_port6_nil` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port7_Sovrum2_Fönster | `switch.aktorb1_b3_port7_sovrum2_fonster` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port8_Sovrum1_Fönster | `switch.aktorb1_b3_port8_sovrum1_fonster` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorB1_B3_Port9_Sovrum1_Tak | `switch.aktorb1_b3_port9_sovrum1_tak` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_A_Motorvärmare_1 | `switch.aktord1_a_motorvarmare_1` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_B_Motorvärmare_2 | `switch.aktord1_b_motorvarmare_2` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_C_Motorvärmare_3 | `switch.aktord1_c_motorvarmare_3` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_D_Motorvärmare_4 | `switch.aktord1_d_motorvarmare_4` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_E_Laddning_Bil | `switch.aktord1_e_laddning_bil` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_F_Utebelysning1 | `switch.aktord1_f_utebelysning1` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorD1_G_Utebelysning2 | `switch.aktord1_g_utebelysning2` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1A | `switch.aktore1a` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1B_B | `switch.aktore1b_b` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1C_C | `switch.aktore1c_c` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Ledljus Hönshus | `switch.aktore1d_belysning_ute_ledljus` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1F_F | `switch.aktore1f_f` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1G_G | `switch.aktore1g_g` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| AktorE1H_H | `switch.aktore1h_h` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Pre-release | `switch.apexcharts_card_pre_release` | D127 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.button_card_pre_release` | D129 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.charger_card_pre_release` | D014 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.easee_ev_charger_pre_release` | D027 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.emhass` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.energy_sankey_card_pre_release` | D030 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.esphome_device_builder` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.ferroamp_sensors_pre_release` | D037 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Vvb-Och-Vp-Styrning Frys_Koket_Indikering_on_off | `switch.frys_koket_indikering_on_off` | D120 | `esphome` | normal | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| Vvb-Och-Vp-Styrning Frys_Koket_Kompressor_On_Off | `switch.frys_koket_kompressor_on_off` | D120 | `esphome` | normal | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| Namn saknas | `switch.glances` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.grafana` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.ha_vibecode_agent` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.hacs_pre_release` | D046 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hall Knapp 4 | `switch.hall_knapp_4` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Halloween lights 1 | `switch.halloween_lights_1` | Ingen enhetsregisterkoppling | `group` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `entity_id` |
| hdmi_switch_power | `switch.hdmi_switch_power` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Namn saknas | `switch.influxdb` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.mariadb` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.mosquitto_broker` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.node_red` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.node_red_companion_pre_release` | D077 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.plex_media_server` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.power_flow_card_plus_pre_release` | D084 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.power_saver_pre_release` | D085 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| projector | `switch.projector` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Pre-release | `switch.robonect_pre_release` | D086 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.samba_share` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.sankey_chart_card_pre_release` | D093 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Simple Vacuum Card Pre-release | `switch.simple_vacuum_card_pre_release` | D098 | `hacs` | diagnostic | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Skymning | `switch.skymning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Pre-release | `switch.soundtouchplus_pre_release` | D099 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `switch.studio_code_server` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| TCW181 1 Duk upp | `switch.tcw181_1_duk_upp` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| TCW181 2 Duk ner | `switch.tcw181_2_duk_ner` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| TCW181 3 Duk stop | `switch.tcw181_3_duk_stop` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Pre-release | `switch.volkswagen_connect_pre_release` | D119 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pre-release | `switch.watchman_pre_release` | D124 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WLED-Viljar2 Nightlight | `switch.wled_viljar2_nightlight` | D123 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| WLED-Viljar2 Reverse | `switch.wled_viljar2_reverse` | D123 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| WLED-Viljar2 Sync receive | `switch.wled_viljar2_sync_receive` | D123 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| WLED-Viljar2 Sync send | `switch.wled_viljar2_sync_send` | D123 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad; flaggor 0; fält: `restored`, `supported_features` |
| Pre-release | `switch.xiaomi_vacuum_map_card_pre_release` | D125 | `hacs` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Festen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Festen | `light.festen` | D038 | `hue` | normal | Rapporterar tillstånd | flaggor 40 (blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `supported_color_modes`, `color_mode`, `brightness`, `color_temp_kelvin`, `hs_color`, `rgb_color`, `xy_color`, `is_hue_group`, `hue_scenes`, `hue_type`, `lights`, `entity_id`, `dynamics`, `supported_features` |
| Lampa 6 | `light.hue_color_lamp_2` | D063 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |

#### Garaget

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| AktorD1_H_Belysning_Tak | `switch.aktord1_h_belysning_tak` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |

#### Halloween hue

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Hue Smart plug 1 | `light.hue_smart_plug_1` | D056 | `hue` | normal | Otillgänglig | flaggor 0; färglägen: onoff; fält: `supported_color_modes`, `supported_features` |
| Lampa 2 Stolpe Väg | `light.lampa_2` | D060 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |
| Lampa 3 | `light.lampa_3` | D061 | `hue` | normal | Otillgänglig | flaggor 40 (blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `supported_color_modes`, `supported_features` |
| Lampa 5 Bron | `light.lampa_5` | D062 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |
| Lampa 7 Globen | `light.lampa_7` | D064 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |
| Lampa 8 Stolpe Bron | `light.lampa_8` | D065 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |
| Lampa 9 Härbre | `light.lampa_9` | D066 | `hue` | normal | Rapporterar tillstånd | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `effect`, `color_mode`, `brightness`, `color_temp_kelvin`, `hs_color`, `rgb_color`, `xy_color`, `mode`, `dynamics`, `supported_features` |

#### Halloween lights outdoor

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| AktorA1_B1_Port4_Bron_Belysning | `switch.aktora1_b1_port4_bron_belysning_2` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |

#### Hönshus

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Takljus utanför hönshus | `switch.aktore1e_belysning_utanfor_honshus` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |

#### Lampor

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Utelampa vid kulor | `light.hue_color_lamp_1` | D107 | `hue` | normal | Otillgänglig | flaggor 44 (effektval, blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `effect_list`, `supported_color_modes`, `supported_features` |
| Lampor | `light.lampor` | D067 | `hue` | normal | Rapporterar tillstånd | flaggor 40 (blinkning, övergång); färglägen: color_temp, xy; fält: `min_color_temp_kelvin`, `max_color_temp_kelvin`, `supported_color_modes`, `color_mode`, `brightness`, `color_temp_kelvin`, `hs_color`, `rgb_color`, `xy_color`, `is_hue_group`, `hue_scenes`, `hue_type`, `lights`, `entity_id`, `dynamics`, `supported_features` |

#### Pluggen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Pluggen | `light.pluggen` | D083 | `hue` | normal | Rapporterar tillstånd | flaggor 40 (blinkning, övergång); färglägen: onoff; fält: `supported_color_modes`, `color_mode`, `is_hue_group`, `hue_scenes`, `hue_type`, `lights`, `entity_id`, `dynamics`, `supported_features` |

#### Skarvkablar

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Shelly1PM_Skarvkabel_1 | `switch.shelly1pm_34945475b46d` | D097 | `shelly` | normal | Otillgänglig | på/av rapporteras; styrning ej provad |

#### Sovrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Namn saknas | `light.sovrum` | D100 | `hue` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Matsal Shellydimmer2 | `light.matsal_shellydimmer2` | D071 | `shelly` | normal | Rapporterar tillstånd | flaggor 32 (övergång); färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `supported_features` |

#### Viljars Rum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| WLED-Viljar1 | `light.wled_viljar1` | D122 | `wled` | normal | Otillgänglig | flaggor 36 (effektval, övergång); färglägen: rgb; fält: `effect_list`, `supported_color_modes`, `supported_features` |
| WLED-Viljar1 Freeze | `switch.wled_viljar1_freeze` | D122 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad |
| WLED-Viljar1 Nightlight | `switch.wled_viljar1_nightlight` | D122 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad |
| WLED-Viljar1 Reverse | `switch.wled_viljar1_reverse` | D122 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad |
| WLED-Viljar1 Sync receive | `switch.wled_viljar1_sync_receive` | D122 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad |
| WLED-Viljar1 Sync send | `switch.wled_viljar1_sync_send` | D122 | `wled` | config | Otillgänglig | på/av rapporteras; styrning ej provad |

### Klimat och temperatur

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| BinarySensor PwrsaveVVBThermostatOnOff | `binary_sensor.pwrsavevvbthermostatonoff` | D009 | `nodered` | normal | Otillgänglig | läsa binärt tillstånd; flaggor 0; fält: `restored`, `supported_features` |
| Vvb-Och-Vp-Styrning Frys Köket Termostat BigBang | `climate.frys_koket_termostat_bigbang` | D120 | `esphome` | normal | Otillgänglig | flaggor 2 (temperaturintervall); klimatlägen: off, cool; fält: `restored`, `hvac_modes`, `min_temp`, `max_temp`, `target_temp_step`, `supported_features` |
| Vvb-Och-Vp-Styrning VVB Kallaren Termostat | `climate.vvb_kallaren_termostat` | D120 | `esphome` | normal | Rapporterar tillstånd | flaggor 386 (temperaturintervall, avslag, påslag); klimatlägen: off, heat; fält: `hvac_modes`, `min_temp`, `max_temp`, `target_temp_step`, `current_temperature`, `target_temp_high`, `target_temp_low`, `hvac_action`, `supported_features` |
| VVB lower threshold | `climate.vvb_lower_threshold` | Ingen enhetsregisterkoppling | `generic_thermostat` | normal | Rapporterar tillstånd | flaggor 385 (måltemperatur, avslag, påslag); klimatlägen: heat, off; fält: `hvac_modes`, `min_temp`, `max_temp`, `target_temp_step`, `current_temperature`, `temperature`, `hvac_action`, `supported_features` |
| Hue Färgtemperatur | `input_number.hue_fargtemperatur` | Ingen enhetsregisterkoppling | `input_number` | normal | Rapporterar tillstånd | enhet K; intervall 2000–6500; steg 100; fält: `min`, `max`, `step`, `mode`, `initial`, `editable`, `unit_of_measurement` |
| bastu_fuktighet | `sensor.bastu_fuktighet` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass humidity; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| bastu_temperatur | `sensor.bastu_temperatur` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Basal body temperature | `sensor.carro_pixel_10_pro_basal_body_temperature` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.carro_pixel_10_pro_battery_temperature` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body temperature | `sensor.carro_pixel_10_pro_body_temperature` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.clt_l29_battery_temperature` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.eskils_pixel_7_pro_battery_temperature` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Vvb-Och-Vp-Styrning Frys Köket Temperatur | `sensor.frys_koket_temperatur` | D120 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Vvb-Och-Vp-Styrning Frys Köket Temperatur | `sensor.frys_koket_temperatur_2` | D120 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Honshuset Hönshus Temperatur | `sensor.honshus_temperatur` | D055 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Honshuset Hönshus Temperatur | `sensor.honshus_temperatur_2` | D055 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Honshuset Hönshus Temperatur | `sensor.honshus_temperatur_3` | D055 | `esphome` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Vvb-Och-Vp-Styrning Kyl_Köket:Temperatur | `sensor.kyl_koket_temperatur` | D120 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Vvb-Och-Vp-Styrning Kyl_Köket:Temperatur | `sensor.kyl_koket_temperatur_2` | D120 | `esphome` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Powersave5VVBLowPrice | `sensor.nodered_b38205234570df9a` | D096 | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Basal body temperature | `sensor.pixel_10_pro_basal_body_temperature` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Basal body temperature | `sensor.pixel_10_pro_basal_body_temperature_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.pixel_10_pro_battery_temperature` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.pixel_10_pro_battery_temperature_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body temperature | `sensor.pixel_10_pro_body_temperature` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body temperature | `sensor.pixel_10_pro_body_temperature_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| StoraBadrummet_temperatur | `sensor.storabadrummet_temperatur` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| UteKnx_temperatur | `sensor.uteknx_temperatur` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| UtetempDiff | `sensor.utetempdiff` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| vardagsrum_temperatur Vardagsrummet Fuktighet | `sensor.vardagsrum_temperatur_vardagsrummet_fuktighet` | D133 | `esphome` | normal | Otillgänglig | enhet %; läsa mätvärde; fält: `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet Temperatur | `sensor.vardagsrum_temperatur_vardagsrummet_temperatur` | D133 | `esphome` | normal | Otillgänglig | enhet °C; läsa mätvärde; fält: `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet WiFi Signal Sensor | `sensor.vardagsrum_temperatur_vardagsrummet_wifi_signal_sensor` | D133 | `esphome` | normal | Otillgänglig | enhet dB; läsa mätvärde; fält: `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet Temperatur | `sensor.vardagsrummet_temperatur` | D133 | `esphome` | normal | Otillgänglig | enhet °C; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet Temperatur | `sensor.vardagsrummet_temperatur_2` | D133 | `esphome` | normal | Otillgänglig | enhet °C; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| Vexve1_H1 Outlet Setpoint | `sensor.vexve1_h1_outlet_setpoint` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Vexve H1 Room setpoint | `sensor.vexve_h1_room_setpoint` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Vexve H1 Room temperature | `sensor.vexve_h1_room_temperature` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Sensor Vexve Outdoor Temp | `sensor.vexve_outdoor_temp` | D096 | `nodered` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Vexve Outdoor temperature 24h avg | `sensor.vexve_outdoor_temperature_24h_avg` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| VexveT1 | `sensor.vexvet1` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| VexveT2 | `sensor.vexvet2` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Utetemp | `sensor.vexvet3` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass temperature; enhet °C; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Battery temperature | `sensor.viljars_pixel_10_pro_battery_temperature` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.viljars_pixel_7_pro_battery_temperature` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery temperature | `sensor.viljars_pixel_watch_3_battery_temperature` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VVB Heating Mode | `sensor.vvb_heating_mode` | Ingen enhetsregisterkoppling | `template` | normal | Rapporterar tillstånd | läsa mätvärde |
| Vvb-Och-Vp-Styrning VVB kallaren mittentemperatur 2 | `sensor.vvb_kallaren_mittentemperatur_2` | D120 | `esphome` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Vvb-Och-Vp-Styrning VVB kallaren nedre temperatur 3 | `sensor.vvb_kallaren_nedre_temperatur_3` | D120 | `esphome` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Vvb-Och-Vp-Styrning VVB kallaren ovre temperatur 1 | `sensor.vvb_kallaren_ovre_temperatur_1` | D120 | `esphome` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Sensor VVB Kostnad per timme | `sensor.vvb_kostnad_per_timme` | D096 | `nodered` | normal | Otillgänglig | klass monetary; enhet SEK; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Vvb-Och-Vp-Styrning vvb_och_vp_styrning_wifi_signal | `sensor.vvb_och_vp_styrning_wifi_signal` | D120 | `esphome` | diagnostic | Rapporterar tillstånd | klass signal_strength; enhet dBm; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| VVB on last hour | `sensor.vvb_on_last_hour` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | klass duration; enhet h; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Vvb-Och-Vp-Styrning VVCirk kallaren temp 4 | `sensor.vvcirk_kallaren_temp_4` | D120 | `esphome` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Vvb-Och-Vp-Styrning VVB Kallaren On Off | `switch.vvb_kallaren_on_off` | D120 | `esphome` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Vvb-Och-Vp-Styrning VP Kallaren Till Fran | `switch.vvb_och_vp_styrning_vp_kallaren_till_fran` | D120 | `esphome` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Vvb-Och-Vp-Styrning Firmware | `update.vvb_och_vp_styrning_firmware` | D120 | `esphome` | config | Rapporterar tillstånd | klass firmware; flaggor 1; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `device_class`, `supported_features` |

#### Härbret

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Namn saknas | `climate.daikinharbret` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily Cool Energy Consumption | `sensor.daikinharbret_daily_cool_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily Heat Energy Consumption | `sensor.daikinharbret_daily_heat_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Inside Temperature | `sensor.daikinharbret_inside_temperature` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal SSID | `sensor.daikinharbret_internal_ssid` | D020 | `daikin_residential` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mac Address | `sensor.daikinharbret_mac_address` | D020 | `daikin_residential` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Outside Temperature | `sensor.daikinharbret_outside_temperature` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Serial Number | `sensor.daikinharbret_serial_number` | D020 | `daikin_residential` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weekly Cool Energy Consumption | `sensor.daikinharbret_weekly_cool_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weekly Heat Energy Consumption | `sensor.daikinharbret_weekly_heat_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WiFi SSID | `sensor.daikinharbret_wifi_ssid` | D020 | `daikin_residential` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WiFi Strength | `sensor.daikinharbret_wifi_strength` | D020 | `daikin_residential` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Yearly Cool Energy Consumption | `sensor.daikinharbret_yearly_cool_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Yearly Heat Energy Consumption | `sensor.daikinharbret_yearly_heat_energy_consumption` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Streamer | `switch.daikinharbret_streamer` | D020 | `daikin_residential` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Skarvkablar

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Device temperature | `sensor.shelly1pm_34945475b46d_device_temperature` | D097 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Device temperature | `sensor.shellydimmer2_34945474145a_device_temperature` | D071 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

### Energi, elpris och solproduktion

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Dummy Charging | `binary_sensor.dummy_charging` | D021 | `tibber` | normal | Okänd | klass battery_charging; läsa binärt tillstånd; fält: `device_class` |
| Dummy Connectivity | `binary_sensor.dummy_connectivity` | D021 | `tibber` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| Dummy Plug | `binary_sensor.dummy_plug` | D021 | `tibber` | normal | Okänd | klass plug; läsa binärt tillstånd; fält: `device_class` |
| EASEE Höger Charging | `binary_sensor.easee_hoger_charging` | D023 | `tibber` | normal | Rapporterar tillstånd | klass battery_charging; läsa binärt tillstånd; fält: `device_class` |
| EASEE Höger Connectivity | `binary_sensor.easee_hoger_connectivity` | D023 | `tibber` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| EASEE Höger Plug | `binary_sensor.easee_hoger_plug` | D023 | `tibber` | normal | Rapporterar tillstånd | klass plug; läsa binärt tillstånd; fält: `device_class` |
| Easee Vänster Charging | `binary_sensor.easee_vanster_charging` | D029 | `tibber` | normal | Rapporterar tillstånd | klass battery_charging; läsa binärt tillstånd; fält: `device_class` |
| Easee Vänster Connectivity | `binary_sensor.easee_vanster_connectivity` | D029 | `tibber` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| Easee Vänster Plug | `binary_sensor.easee_vanster_plug` | D029 | `tibber` | normal | Rapporterar tillstånd | klass plug; läsa binärt tillstånd; fält: `device_class` |
| Solar Surplus Available | `binary_sensor.solar_surplus_available` | Ingen enhetsregisterkoppling | `template` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `device_class` |
| StatusFas1 | `binary_sensor.statusfas1` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `source`, `device_class` |
| StatusFas2 | `binary_sensor.statusfas2` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `source`, `device_class` |
| StatusFas3 | `binary_sensor.statusfas3` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `source`, `device_class` |
| tibber | `notify.tibber` | Ingen enhetsregisterkoppling | `tibber` | normal | Okänd | flaggor 1; fält: `supported_features` |
| daily_solar_production | `sensor.daily_solar_production` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `status`, `last_period`, `last_valid_state`, `last_reset`, `next_reset`, `unit_of_measurement`, `device_class` |
| Dummy Estimated remaining driving range | `sensor.dummy_estimated_remaining_driving_range` | D021 | `tibber` | normal | Rapporterar tillstånd | klass distance; enhet m; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Dummy State of charge | `sensor.dummy_state_of_charge` | D021 | `tibber` | normal | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Dummy Target state of charge | `sensor.dummy_target_state_of_charge` | D021 | `tibber` | normal | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EASEE Höger Fallback current if charger goes offline | `sensor.easee_hoger_fallback_current_if_charger_goes_offline` | D023 | `tibber` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EASEE Höger Maximum allowed charge current | `sensor.easee_hoger_maximum_allowed_charge_current` | D023 | `tibber` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EASEE Höger Number of grid phases | `sensor.easee_hoger_number_of_grid_phases` | D023 | `tibber` | diagnostic | Rapporterar tillstånd | mätartyp measurement; läsa mätvärde; fält: `state_class` |
| Easee Vänster Fallback current if charger goes offline | `sensor.easee_vanster_fallback_current_if_charger_goes_offline` | D029 | `tibber` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Easee Vänster Maximum allowed charge current | `sensor.easee_vanster_maximum_allowed_charge_current` | D029 | `tibber` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Easee Vänster Number of grid phases | `sensor.easee_vanster_number_of_grid_phases` | D029 | `tibber` | diagnostic | Rapporterar tillstånd | mätartyp measurement; läsa mätvärde; fält: `state_class` |
| Busvebacken  Electricity price | `sensor.electricity_price_bringasen_380` | D010 | `tibber` | normal | Rapporterar tillstånd | enhet SEK/kWh; mätartyp measurement; läsa mätvärde; fält: `state_class`, `app_nickname`, `grid_company`, `estimated_annual_consumption`, `max_price`, `avg_price`, `min_price`, `off_peak_1`, `peak`, `off_peak_2`, `intraday_price_ranking`, `unit_of_measurement` |
| Elmätare Bostad Effekt Summa | `sensor.elmatare_bostad_effekt_summa` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Bostad Energy | `sensor.elmatare_bostad_energy` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| sensor Cost | `sensor.elmatare_bostad_energy_cost` | Ingen enhetsregisterkoppling | `energy` | normal | Okänd | klass monetary; enhet SEK; mätartyp total; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Elmätare Bostad Spänning | `sensor.elmatare_bostad_spanning` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass voltage; enhet V; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Bostad Ström | `sensor.elmatare_bostad_strom` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Hus2 Effekt Summa | `sensor.elmatare_hus2_effekt_summa` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Hus2 Energy | `sensor.elmatare_hus2_energy` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| sensor Cost | `sensor.elmatare_hus2_energy_cost` | Ingen enhetsregisterkoppling | `energy` | normal | Okänd | klass monetary; enhet SEK; mätartyp total; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Elmätare Värme Effekt | `sensor.elmatare_varme_effekt` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Värme Effekt Summa | `sensor.elmatare_varme_effekt_2` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Värme Energy | `sensor.elmatare_varme_energy` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| sensor Cost | `sensor.elmatare_varme_energy_cost` | Ingen enhetsregisterkoppling | `energy` | normal | Okänd | klass monetary; enhet SEK; mätartyp total; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Elmätare Värme Spänning | `sensor.elmatare_varme_spanning` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass voltage; enhet V; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Värme Ström | `sensor.elmatare_varme_strom` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Verkstad Effekt Summa | `sensor.elmatare_verkstad_effekt_summa` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Verkstad Energy | `sensor.elmatare_verkstad_energy` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| sensor Cost | `sensor.elmatare_verkstad_energy_cost` | Ingen enhetsregisterkoppling | `energy` | normal | Okänd | klass monetary; enhet SEK; mätartyp total; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Elmätare Verkstad Spänning | `sensor.elmatare_verkstad_spanning` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass voltage; enhet V; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Elmätare Verkstad Ström | `sensor.elmatare_verkstad_strom` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| sensor Cost | `sensor.ferroamp_external_energy_consumed_cost` | Ingen enhetsregisterkoppling | `energy` | normal | Rapporterar tillstånd | klass monetary; enhet SEK; mätartyp total; läsa mätvärde; fält: `state_class`, `last_reset`, `unit_of_measurement`, `device_class` |
| SSO 22110358 Fault State | `sensor.ferroamp_sso_22110358_fault_state` | D087 | `ferroamp` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `raw_value`, `value_hex`, `active_messages`, `unknown_bits` |
| SSO 22110358 Faultcode | `sensor.ferroamp_sso_22110358_faultcode` | D087 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `0` |
| SSO 22110358 PCB Temperature | `sensor.ferroamp_sso_22110358_pcb_temperature` | D087 | `ferroamp` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 22110358 PV String Current | `sensor.ferroamp_sso_22110358_pv_string_current` | D087 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 22110358 PV String Power | `sensor.ferroamp_sso_22110358_pv_string_power` | D087 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 22110358 PV String Voltage | `sensor.ferroamp_sso_22110358_pv_string_voltage` | D087 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 22110358 Relay Status | `sensor.ferroamp_sso_22110358_relay_status` | D087 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde |
| SSO 22110358 Total Energy | `sensor.ferroamp_sso_22110358_total_energy` | D087 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070555 Fault State | `sensor.ferroamp_sso_23070555_fault_state` | D088 | `ferroamp` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `raw_value`, `value_hex`, `active_messages`, `unknown_bits` |
| SSO 23070555 Faultcode | `sensor.ferroamp_sso_23070555_faultcode` | D088 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `0` |
| SSO 23070555 PCB Temperature | `sensor.ferroamp_sso_23070555_pcb_temperature` | D088 | `ferroamp` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070555 PV String Current | `sensor.ferroamp_sso_23070555_pv_string_current` | D088 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070555 PV String Power | `sensor.ferroamp_sso_23070555_pv_string_power` | D088 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070555 PV String Voltage | `sensor.ferroamp_sso_23070555_pv_string_voltage` | D088 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070555 Relay Status | `sensor.ferroamp_sso_23070555_relay_status` | D088 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde |
| SSO 23070555 Total Energy | `sensor.ferroamp_sso_23070555_total_energy` | D088 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070559 Fault State | `sensor.ferroamp_sso_23070559_fault_state` | D089 | `ferroamp` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `raw_value`, `value_hex`, `active_messages`, `unknown_bits` |
| SSO 23070559 Faultcode | `sensor.ferroamp_sso_23070559_faultcode` | D089 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `0` |
| SSO 23070559 PCB Temperature | `sensor.ferroamp_sso_23070559_pcb_temperature` | D089 | `ferroamp` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070559 PV String Current | `sensor.ferroamp_sso_23070559_pv_string_current` | D089 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070559 PV String Power | `sensor.ferroamp_sso_23070559_pv_string_power` | D089 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070559 PV String Voltage | `sensor.ferroamp_sso_23070559_pv_string_voltage` | D089 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070559 Relay Status | `sensor.ferroamp_sso_23070559_relay_status` | D089 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde |
| SSO 23070559 Total Energy | `sensor.ferroamp_sso_23070559_total_energy` | D089 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070568 Fault State | `sensor.ferroamp_sso_23070568_fault_state` | D090 | `ferroamp` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `raw_value`, `value_hex`, `active_messages`, `unknown_bits` |
| SSO 23070568 Faultcode | `sensor.ferroamp_sso_23070568_faultcode` | D090 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `0` |
| SSO 23070568 PCB Temperature | `sensor.ferroamp_sso_23070568_pcb_temperature` | D090 | `ferroamp` | normal | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070568 PV String Current | `sensor.ferroamp_sso_23070568_pv_string_current` | D090 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070568 PV String Power | `sensor.ferroamp_sso_23070568_pv_string_power` | D090 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070568 PV String Voltage | `sensor.ferroamp_sso_23070568_pv_string_voltage` | D090 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO 23070568 Relay Status | `sensor.ferroamp_sso_23070568_relay_status` | D090 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde |
| SSO 23070568 Total Energy | `sensor.ferroamp_sso_23070568_total_energy` | D090 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| SSO PS00990-A04-0358 Faultcode | `sensor.ferroamp_sso_ps00990_a04_0358_faultcode` | D091 | `ferroamp` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| SSO PS00990-A04-0358 PCB Temperature | `sensor.ferroamp_sso_ps00990_a04_0358_pcb_temperature` | D091 | `ferroamp` | normal | Otillgänglig | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| SSO PS00990-A04-0358 PV String Current | `sensor.ferroamp_sso_ps00990_a04_0358_pv_string_current` | D091 | `ferroamp` | normal | Otillgänglig | klass current; enhet A; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| SSO PS00990-A04-0358 PV String Power | `sensor.ferroamp_sso_ps00990_a04_0358_pv_string_power` | D091 | `ferroamp` | normal | Otillgänglig | klass power; enhet W; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| SSO PS00990-A04-0358 PV String Voltage | `sensor.ferroamp_sso_ps00990_a04_0358_pv_string_voltage` | D091 | `ferroamp` | normal | Otillgänglig | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| SSO PS00990-A04-0358 Relay Status | `sensor.ferroamp_sso_ps00990_a04_0358_relay_status` | D091 | `ferroamp` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| SSO PS00990-A04-0358 Total Energy | `sensor.ferroamp_sso_ps00990_a04_0358_total_energy` | D091 | `ferroamp` | normal | Otillgänglig | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Garage Total A | `sensor.garage_total_a` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Garage Total kWh | `sensor.garage_total_kwh` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Laddning Bil A | `sensor.laddning_bil_a` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Busvebacken  Monthly peak hour consumption | `sensor.month_peak_hour_consumption_bringasen_380` | D010 | `tibber` | normal | Rapporterar tillstånd | klass energy; enhet kWh; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Busvebacken  Monthly cost | `sensor.monthly_cost_bringasen_380` | D010 | `tibber` | normal | Rapporterar tillstånd | klass monetary; enhet SEK; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Busvebacken  Monthly net consumption | `sensor.monthly_net_consumption_bringasen_380` | D010 | `tibber` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| monthly_solar_production | `sensor.monthly_solar_production` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `status`, `last_period`, `last_valid_state`, `last_reset`, `next_reset`, `unit_of_measurement`, `device_class` |
| Motorvärmare1_kW | `sensor.motorvarmare1_kw` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Motorvärmare2_kW | `sensor.motorvarmare2_kw` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Motorvärmare3_kW | `sensor.motorvarmare3_kw` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Motorvärmare4_kW | `sensor.motorvarmare4_kw` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `source`, `unit_of_measurement`, `device_class` |
| Motorvärmare_effekt | `sensor.motorvarmare_effekt` | Ingen enhetsregisterkoppling | `group` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `entity_id`, `unit_of_measurement`, `device_class` |
| Nord Pool SE2 Prices | `sensor.nord_pool_se2_prices` | Ingen enhetsregisterkoppling | `template` | normal | Rapporterar tillstånd | enhet SEK/kWh; läsa mätvärde; fält: `data`, `unit_of_measurement` |
| Busvebacken  Time of max hour consumption | `sensor.time_of_max_hour_consumption_bringasen_380` | D010 | `tibber` | normal | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| WLED-Viljar2 Estimated current | `sensor.wled_viljar2_estimated_current` | D123 | `wled` | diagnostic | Otillgänglig | klass current; enhet mA; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| WLED-Viljar2 Max current | `sensor.wled_viljar2_max_current` | D123 | `wled` | diagnostic | Otillgänglig | klass current; enhet mA; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| yearly_solar_production | `sensor.yearly_solar_production` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `status`, `last_period`, `last_valid_state`, `last_reset`, `next_reset`, `unit_of_measurement`, `device_class` |

#### Elektriskt

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Nord Pool SE2 Tomorrow price available | `binary_sensor.elektriskt_nord_pool_se2_tomorrow_price_available` | D078 | `nordpool` | diagnostic | Rapporterar tillstånd | läsa binärt tillstånd |
| Lågpris period lång Emergency Mode | `binary_sensor.lagpris_period_lang_emergency_mode` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass problem; läsa binärt tillstånd; fält: `device_class` |
| Lågpris period lång Next Active | `sensor.elektriskt_lagpris_period_lang_next_active` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Lågpris period lång Next Inactive | `sensor.elektriskt_lagpris_period_lang_next_inactive` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Lågpris period lång Active Hours in Period | `sensor.lagpris_period_lang_active_hours_in_period` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass duration; enhet h; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Lågpris period lång Last Active | `sensor.lagpris_period_lang_last_active` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Lågpris period lång Next Change | `sensor.lagpris_period_lang_next_change` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Lågpris period lång Schedule | `sensor.lagpris_period_lang_schedule` | D069 | `power_saver` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `schedule` |
| Lågpris period lång Status | `sensor.lagpris_period_lang_status` | D069 | `power_saver` | normal | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `current_price`, `min_price`, `max_price`, `active_slots`, `strategy`, `device_class` |
| Nord Pool SE2 Currency | `sensor.nord_pool_se2_currency` | D078 | `nordpool` | diagnostic | Rapporterar tillstånd | läsa mätvärde |
| Nord Pool SE2 Current price | `sensor.nord_pool_se2_current_price` | D078 | `nordpool` | normal | Rapporterar tillstånd | enhet SEK/kWh; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement` |
| Daily average | `sensor.nord_pool_se2_daily_average` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Exchange rate | `sensor.nord_pool_se2_exchange_rate` | D078 | `nordpool` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Nord Pool SE2 Highest price | `sensor.nord_pool_se2_highest_price` | D078 | `nordpool` | normal | Rapporterar tillstånd | enhet SEK/kWh; läsa mätvärde; fält: `start`, `end`, `unit_of_measurement` |
| Nord Pool SE2 Last updated | `sensor.nord_pool_se2_last_updated` | D078 | `nordpool` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Nord Pool SE2 Lowest price | `sensor.nord_pool_se2_lowest_price` | D078 | `nordpool` | normal | Rapporterar tillstånd | enhet SEK/kWh; läsa mätvärde; fält: `start`, `end`, `unit_of_measurement` |
| Nord Pool SE2 Next price | `sensor.nord_pool_se2_next_price` | D078 | `nordpool` | normal | Rapporterar tillstånd | enhet SEK/kWh; läsa mätvärde; fält: `unit_of_measurement` |
| Off-peak 1 average | `sensor.nord_pool_se2_off_peak_1_average` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 1 highest price | `sensor.nord_pool_se2_off_peak_1_highest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 1 lowest price | `sensor.nord_pool_se2_off_peak_1_lowest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 1 time from | `sensor.nord_pool_se2_off_peak_1_time_from` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 1 time until | `sensor.nord_pool_se2_off_peak_1_time_until` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 2 average | `sensor.nord_pool_se2_off_peak_2_average` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 2 highest price | `sensor.nord_pool_se2_off_peak_2_highest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 2 lowest price | `sensor.nord_pool_se2_off_peak_2_lowest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 2 time from | `sensor.nord_pool_se2_off_peak_2_time_from` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Off-peak 2 time until | `sensor.nord_pool_se2_off_peak_2_time_until` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Peak average | `sensor.nord_pool_se2_peak_average` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Peak highest price | `sensor.nord_pool_se2_peak_highest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Peak lowest price | `sensor.nord_pool_se2_peak_lowest_price` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Peak time from | `sensor.nord_pool_se2_peak_time_from` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Peak time until | `sensor.nord_pool_se2_peak_time_until` | D078 | `nordpool` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Nord Pool SE2 Previous price | `sensor.nord_pool_se2_previous_price` | D078 | `nordpool` | normal | Rapporterar tillstånd | enhet SEK/kWh; läsa mätvärde; fält: `unit_of_measurement` |
| Lågpris period lång Always off | `switch.lagpris_period_lang_always_off` | D069 | `power_saver` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |
| Lågpris period lång Always on | `switch.lagpris_period_lang_always_on` | D069 | `power_saver` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad |

#### Ladan

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| EnergyHub Adaptive Current Equalization | `sensor.ferroamp_adaptive_current_equalization` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Adaptive Current Equalization L1 | `sensor.ferroamp_adaptive_current_equalization_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Adaptive Current Equalization L2 | `sensor.ferroamp_adaptive_current_equalization_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Adaptive Current Equalization L3 | `sensor.ferroamp_adaptive_current_equalization_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Apparent power | `sensor.ferroamp_apparent_power` | D031 | `ferroamp` | normal | Rapporterar tillstånd | enhet VA; läsa mätvärde; fält: `unit_of_measurement` |
| EnergyHub Available Active Current For Load Balancing | `sensor.ferroamp_available_active_current_for_load_balancing` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Available RMS Current For Load Balancing | `sensor.ferroamp_available_rms_current_for_load_balancing` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Available Three Phase Active Current For Load Balancing | `sensor.ferroamp_available_three_phase_active_current_for_load_balancing` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Battery Energy Consumed | `sensor.ferroamp_battery_energy_consumed` | D031 | `ferroamp` | normal | Otillgänglig | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| EnergyHub Battery Energy Produced | `sensor.ferroamp_battery_energy_produced` | D031 | `ferroamp` | normal | Otillgänglig | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| EnergyHub Battery Power | `sensor.ferroamp_battery_power` | D031 | `ferroamp` | normal | Otillgänglig | klass power; enhet W; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| EnergyHub Consumption Power | `sensor.ferroamp_consumption_power` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power L1 | `sensor.ferroamp_consumption_power_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power L2 | `sensor.ferroamp_consumption_power_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power L3 | `sensor.ferroamp_consumption_power_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power Reactive | `sensor.ferroamp_consumption_power_reactive` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power Reactive L1 | `sensor.ferroamp_consumption_power_reactive_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power Reactive L2 | `sensor.ferroamp_consumption_power_reactive_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Consumption Power Reactive L3 | `sensor.ferroamp_consumption_power_reactive_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Control Status | `sensor.ferroamp_control_status` | D031 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde |
| EnergyHub DC Link Voltage | `sensor.ferroamp_dc_link_voltage` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `neg`, `pos`, `unit_of_measurement`, `device_class` |
| EnergyHub Estimated Grid Frequency | `sensor.ferroamp_estimated_grid_frequency` | D031 | `ferroamp` | normal | Rapporterar tillstånd | enhet Hz; läsa mätvärde; fält: `unit_of_measurement` |
| EnergyHub Extapi Version | `sensor.ferroamp_extapi_version` | D031 | `ferroamp` | normal | Okänd | läsa mätvärde |
| EnergyHub External Active Current | `sensor.ferroamp_external_active_current` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub External Active Current L1 | `sensor.ferroamp_external_active_current_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Active Current L2 | `sensor.ferroamp_external_active_current_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Active Current L3 | `sensor.ferroamp_external_active_current_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Consumed | `sensor.ferroamp_external_energy_consumed` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Consumed L1 | `sensor.ferroamp_external_energy_consumed_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Consumed L2 | `sensor.ferroamp_external_energy_consumed_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Consumed L3 | `sensor.ferroamp_external_energy_consumed_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Produced | `sensor.ferroamp_external_energy_produced` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Produced L1 | `sensor.ferroamp_external_energy_produced_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Produced L2 | `sensor.ferroamp_external_energy_produced_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Energy Produced L3 | `sensor.ferroamp_external_energy_produced_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Voltage | `sensor.ferroamp_external_voltage` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub External Voltage L1 | `sensor.ferroamp_external_voltage_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Voltage L2 | `sensor.ferroamp_external_voltage_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub External Voltage L3 | `sensor.ferroamp_external_voltage_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Current | `sensor.ferroamp_grid_current` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Current L1 | `sensor.ferroamp_grid_current_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Current L2 | `sensor.ferroamp_grid_current_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Current L3 | `sensor.ferroamp_grid_current_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power | `sensor.ferroamp_grid_power` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power L1 | `sensor.ferroamp_grid_power_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power L2 | `sensor.ferroamp_grid_power_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power L3 | `sensor.ferroamp_grid_power_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power Reactive | `sensor.ferroamp_grid_power_reactive` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power Reactive L1 | `sensor.ferroamp_grid_power_reactive_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power Reactive L2 | `sensor.ferroamp_grid_power_reactive_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Power Reactive L3 | `sensor.ferroamp_grid_power_reactive_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Reactive Current | `sensor.ferroamp_grid_reactive_current` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Reactive Current L1 | `sensor.ferroamp_grid_reactive_current_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Reactive Current L2 | `sensor.ferroamp_grid_reactive_current_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Grid Reactive Current L3 | `sensor.ferroamp_grid_reactive_current_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Consumed | `sensor.ferroamp_inverter_energy_consumed` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Consumed L1 | `sensor.ferroamp_inverter_energy_consumed_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Consumed L2 | `sensor.ferroamp_inverter_energy_consumed_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Consumed L3 | `sensor.ferroamp_inverter_energy_consumed_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Produced | `sensor.ferroamp_inverter_energy_produced` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Produced L1 | `sensor.ferroamp_inverter_energy_produced_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Produced L2 | `sensor.ferroamp_inverter_energy_produced_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Energy Produced L3 | `sensor.ferroamp_inverter_energy_produced_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Active | `sensor.ferroamp_inverter_power_active` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Active L1 | `sensor.ferroamp_inverter_power_active_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Active L2 | `sensor.ferroamp_inverter_power_active_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Active L3 | `sensor.ferroamp_inverter_power_active_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Reactive | `sensor.ferroamp_inverter_power_reactive` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Reactive L1 | `sensor.ferroamp_inverter_power_reactive_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Reactive L2 | `sensor.ferroamp_inverter_power_reactive_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Power, Reactive L3 | `sensor.ferroamp_inverter_power_reactive_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Reactive Current | `sensor.ferroamp_inverter_reactive_current` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Reactive Current L1 | `sensor.ferroamp_inverter_reactive_current_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Reactive Current L2 | `sensor.ferroamp_inverter_reactive_current_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter Reactive Current L3 | `sensor.ferroamp_inverter_reactive_current_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter RMS Current | `sensor.ferroamp_inverter_rms_current` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter RMS Current L1 | `sensor.ferroamp_inverter_rms_current_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter RMS Current L2 | `sensor.ferroamp_inverter_rms_current_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Inverter RMS Current L3 | `sensor.ferroamp_inverter_rms_current_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Consumed | `sensor.ferroamp_load_energy_consumed` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Consumed L1 | `sensor.ferroamp_load_energy_consumed_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Consumed L2 | `sensor.ferroamp_load_energy_consumed_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Consumed L3 | `sensor.ferroamp_load_energy_consumed_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Produced | `sensor.ferroamp_load_energy_produced` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `L1`, `L2`, `L3`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Produced L1 | `sensor.ferroamp_load_energy_produced_l1` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Produced L2 | `sensor.ferroamp_load_energy_produced_l2` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Load Energy Produced L3 | `sensor.ferroamp_load_energy_produced_l3` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub Solar Power | `sensor.ferroamp_solar_power` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EnergyHub System State | `sensor.ferroamp_system_state` | D031 | `ferroamp` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `unit_of_measurement` |
| EnergyHub System State of Charge | `sensor.ferroamp_system_state_of_charge` | D031 | `ferroamp` | normal | Otillgänglig | klass battery; enhet %; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| EnergyHub System State of Health | `sensor.ferroamp_system_state_of_health` | D031 | `ferroamp` | normal | Otillgänglig | enhet %; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `supported_features`, `unit_of_measurement` |
| EnergyHub Total rated capacity of all batteries | `sensor.ferroamp_total_rated_capacity_of_all_batteries` | D031 | `ferroamp` | normal | Otillgänglig | enhet Wh; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| EnergyHub Total Solar Energy | `sensor.ferroamp_total_solar_energy` | D031 | `ferroamp` | normal | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |

#### Skarvkablar

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Shelly1PM_Skarvkabel_1 Input | `binary_sensor.shelly1pm_34945475b46d_input` | D097 | `shelly` | normal | Otillgänglig | klass power; läsa binärt tillstånd; fält: `device_class` |
| Shelly1PM_Skarvkabel_1 Energy | `sensor.shelly1pm_34945475b46d_energy` | D097 | `shelly` | normal | Otillgänglig | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Shelly1PM_Skarvkabel_1 Power | `sensor.shelly1pm_34945475b46d_power` | D097 | `shelly` | normal | Otillgänglig | klass power; enhet W; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Matsal Shellydimmer2 Input | `binary_sensor.matsal_shellydimmer2_input` | D071 | `shelly` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `device_class` |
| Matsal Shellydimmer2 Input | `binary_sensor.matsal_shellydimmer2_input_2` | D071 | `shelly` | normal | Rapporterar tillstånd | klass power; läsa binärt tillstånd; fält: `device_class` |

#### Viljars Rum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| WLED-Viljar1 Estimated current | `sensor.wled_viljar1_estimated_current` | D122 | `wled` | diagnostic | Otillgänglig | klass current; enhet mA; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| WLED-Viljar1 Max current | `sensor.wled_viljar1_max_current` | D122 | `wled` | diagnostic | Otillgänglig | klass current; enhet mA; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |

### Bilar och laddare

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Basic schedule | `binary_sensor.easee_vanster_basic_schedule` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Cable lock | `binary_sensor.easee_vanster_cable_locked` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass lock; läsa binärt tillstånd; fält: `name`, `id`, `device_class` |
| Easee Vänster Online | `binary_sensor.easee_vanster_online` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `name`, `id`, `state_signalRConnected`, `state_latestPulse`, `state_wiFiAPEnabled`, `config_wiFiAddress`, `state_wiFiRSSI`, `config_cellAddress`, `state_cellRSSI`, `state_localRSSI`, `device_class` |
| Easee Vänster Update available | `binary_sensor.easee_vanster_update_available` | D028 | `easee` | diagnostic | Rapporterar tillstånd | läsa binärt tillstånd; fält: `name`, `id`, `state_chargerFirmware`, `state_latestFirmware` |
| Weekly schedule | `binary_sensor.easee_vanster_weekly_schedule` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EV6 Charging | `binary_sensor.ev6_charging` | D026 | `tibber` | normal | Okänd | klass battery_charging; läsa binärt tillstånd; fält: `device_class` |
| EV6 Connectivity | `binary_sensor.ev6_connectivity` | D026 | `tibber` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| EV6 Plug | `binary_sensor.ev6_plug` | D026 | `tibber` | normal | Okänd | klass plug; läsa binärt tillstånd; fält: `device_class` |
| Easee Vänster Override schedule | `button.easee_vanster_override_schedule` | D028 | `easee` | normal | Okänd | fält: `name`, `id` |
| Easee Vänster LED strip | `light.easee_vanster_led_strip` | D028 | `easee` | config | Rapporterar tillstånd | flaggor 0; färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `name`, `id`, `supported_features` |
| Easee Vänster Circuit current | `sensor.easee_vanster_circuit_current` | D028 | `easee` | diagnostic | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Easee Vänster Cost day | `sensor.easee_vanster_cost_day` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_day_totalCost`, `cost_day_currencyId`, `cost_day_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| Easee Vänster Cost month | `sensor.easee_vanster_cost_month` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_month_totalCost`, `cost_month_currencyId`, `cost_month_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| Cost per kWh | `sensor.easee_vanster_cost_per_kwh` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Cost year | `sensor.easee_vanster_cost_year` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_year_totalCost`, `cost_year_currencyId`, `cost_year_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| Easee Vänster Current | `sensor.easee_vanster_current` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `state_inCurrentT2`, `state_inCurrentT3`, `state_inCurrentT4`, `state_inCurrentT5`, `unit_of_measurement`, `device_class` |
| Easee Vänster Dynamic charger limit | `sensor.easee_vanster_dynamic_charger_limit` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `state_dynamicChargerCurrent`, `unit_of_measurement`, `device_class` |
| Easee Vänster Dynamic circuit limit | `sensor.easee_vanster_dynamic_circuit_limit` | D028 | `easee` | diagnostic | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Energy last hour | `sensor.easee_vanster_energy_last_hour` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Energy per hour | `sensor.easee_vanster_energy_per_hour` | D028 | `easee` | diagnostic | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Equalizer limit | `sensor.easee_vanster_equalizer_limit` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Internal temperature | `sensor.easee_vanster_internal_temperature` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| Easee Vänster Lifetime energy | `sensor.easee_vanster_lifetime_energy` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| Easee Vänster Max charger limit | `sensor.easee_vanster_max_charger_limit` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `config_maxChargerCurrent`, `unit_of_measurement`, `device_class` |
| Easee Vänster Max circuit limit | `sensor.easee_vanster_max_circuit_limit` | D028 | `easee` | diagnostic | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Easee Vänster Offline circuit limit | `sensor.easee_vanster_offline_circuit_limit` | D028 | `easee` | diagnostic | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Easee Vänster Operator | `sensor.easee_vanster_operator` | D028 | `easee` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `name`, `id`, `state_operatorID` |
| Easee Vänster Output limit | `sensor.easee_vanster_output_limit` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `unit_of_measurement`, `device_class` |
| Phase mode | `sensor.easee_vanster_phase_mode` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pilot Mode | `sensor.easee_vanster_pilot_mode` | D028 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Power | `sensor.easee_vanster_power` | D028 | `easee` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| Easee Vänster Reason for no current | `sensor.easee_vanster_reason_for_no_current` | D028 | `easee` | normal | Rapporterar tillstånd | klass easee__reason_no_current; läsa mätvärde; fält: `name`, `id`, `device_class` |
| Easee Vänster Session Energy | `sensor.easee_vanster_session_energy` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass energy; enhet kWh; läsa mätvärde; fält: `name`, `id`, `unit_of_measurement`, `device_class` |
| Easee Vänster Status | `sensor.easee_vanster_status` | D028 | `easee` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `name`, `id`, `config_phaseMode`, `state_outputPhase`, `state_ledMode`, `state_cableRating`, `config_authorizationRequired`, `config_localNodeType`, `config_localAuthorizationRequired`, `site_id`, `site_name`, `site_siteKey`, `site_ratedCurrent`, `circuit_id`, `circuit_ratedCurrent` |
| Easee Vänster Voltage | `sensor.easee_vanster_voltage` | D028 | `easee` | diagnostic | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `state_inVoltageT1T2`, `state_inVoltageT1T3`, `state_inVoltageT1T4`, `state_inVoltageT1T5`, `state_inVoltageT2T3`, `state_inVoltageT2T4`, `state_inVoltageT2T5`, `state_inVoltageT3T4`, `state_inVoltageT3T5`, `state_inVoltageT4T5`, `unit_of_measurement`, `device_class` |
| EV6 Estimated remaining driving range | `sensor.ev6_estimated_remaining_driving_range` | D026 | `tibber` | normal | Rapporterar tillstånd | klass distance; enhet m; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EV6 State of charge | `sensor.ev6_state_of_charge` | D026 | `tibber` | normal | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| EV6 Target state of charge | `sensor.ev6_target_state_of_charge` | D026 | `tibber` | normal | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Basic schedule | `switch.easee_vanster_basic_schedule` | D028 | `easee` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Easee Vänster Cable locked permanently | `switch.easee_vanster_cable_locked_permanently` | D028 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Easee Vänster Idle current | `switch.easee_vanster_enable_idle_current` | D028 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Easee Vänster Charger enabled | `switch.easee_vanster_is_enabled` | D028 | `easee` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Easee Vänster Smart charging | `switch.easee_vanster_smart_charging` | D028 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Easee Vänster Touch button enabled | `switch.easee_vanster_touch_button_enabled` | D028 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Weekly schedule | `switch.easee_vanster_weekly_schedule` | D028 | `easee` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Garaget

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| EASEE Höger Basic schedule | `binary_sensor.easee_hoger_basic_schedule` | D022 | `easee` | diagnostic | Otillgänglig | läsa binärt tillstånd; flaggor 0; fält: `restored`, `supported_features` |
| EASEE Höger Cable lock | `binary_sensor.easee_hoger_cable_locked` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass lock; läsa binärt tillstånd; fält: `name`, `id`, `device_class` |
| EASEE Höger Cable locked car | `binary_sensor.easee_hoger_cable_locked_car` | D022 | `easee` | normal | Otillgänglig | klass lock; läsa binärt tillstånd; flaggor 0; fält: `restored`, `device_class`, `supported_features` |
| EASEE Höger Online | `binary_sensor.easee_hoger_online` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass connectivity; läsa binärt tillstånd; fält: `name`, `id`, `state_signalRConnected`, `state_latestPulse`, `state_wiFiAPEnabled`, `config_wiFiAddress`, `state_wiFiRSSI`, `config_cellAddress`, `state_cellRSSI`, `state_localRSSI`, `device_class` |
| EASEE Höger Update available | `binary_sensor.easee_hoger_update_available` | D022 | `easee` | diagnostic | Rapporterar tillstånd | läsa binärt tillstånd; fält: `name`, `id`, `state_chargerFirmware`, `state_latestFirmware` |
| Weekly schedule | `binary_sensor.easee_hoger_weekly_schedule` | D022 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EASEE Höger Override schedule | `button.easee_hoger_override_schedule` | D022 | `easee` | normal | Okänd | fält: `name`, `id` |
| EASEE Höger LED strip | `light.easee_hoger_led_strip` | D022 | `easee` | config | Rapporterar tillstånd | flaggor 0; färglägen: brightness; fält: `supported_color_modes`, `color_mode`, `brightness`, `name`, `id`, `supported_features` |
| EASEE Höger Circuit current | `sensor.easee_hoger_circuit_current` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `circuit_id`, `circuit_circuitPanelId`, `circuit_panelName`, `circuit_ratedCurrent`, `state_circuitTotalAllocatedPhaseConductorCurrentL1`, `state_circuitTotalAllocatedPhaseConductorCurrentL2`, `state_circuitTotalAllocatedPhaseConductorCurrentL3`, `state_circuitTotalPhaseConductorCurrentL1`, `state_circuitTotalPhaseConductorCurrentL2`, `state_circuitTotalPhaseConductorCurrentL3`, `unit_of_measurement`, `device_class` |
| EASEE Höger Cost day | `sensor.easee_hoger_cost_day` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_day_totalCost`, `cost_day_currencyId`, `cost_day_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| EASEE Höger Cost month | `sensor.easee_hoger_cost_month` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_month_totalCost`, `cost_month_currencyId`, `cost_month_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| EASEE Höger Cost per kWh | `sensor.easee_hoger_cost_per_kwh` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `site_costPerKWh`, `site_costPerKwhExcludeVat`, `site_vat`, `site_currencyId`, `unit_of_measurement`, `device_class` |
| EASEE Höger Cost year | `sensor.easee_hoger_cost_year` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass monetary; enhet NOK; läsa mätvärde; fält: `name`, `id`, `cost_year_totalCost`, `cost_year_currencyId`, `cost_year_totalEnergyUsage`, `unit_of_measurement`, `device_class` |
| EASEE Höger Current | `sensor.easee_hoger_current` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `state_inCurrentT2`, `state_inCurrentT3`, `state_inCurrentT4`, `state_inCurrentT5`, `unit_of_measurement`, `device_class` |
| EASEE Höger Dynamic charger current | `sensor.easee_hoger_dynamic_charger_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Dynamic charger limit | `sensor.easee_hoger_dynamic_charger_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `state_dynamicChargerCurrent`, `unit_of_measurement`, `device_class` |
| EASEE Höger Dynamic circuit current | `sensor.easee_hoger_dynamic_circuit_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Dynamic circuit limit | `sensor.easee_hoger_dynamic_circuit_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `circuit_id`, `circuit_circuitPanelId`, `circuit_panelName`, `circuit_ratedCurrent`, `state_dynamicCircuitCurrentP1`, `state_dynamicCircuitCurrentP2`, `state_dynamicCircuitCurrentP3`, `unit_of_measurement`, `device_class` |
| Energy last hour | `sensor.easee_hoger_energy_last_hour` | D022 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EASEE Höger Energy per hour | `sensor.easee_hoger_energy_per_hour` | D022 | `easee` | diagnostic | Otillgänglig | klass energy; enhet kWh; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| Equalizer limit | `sensor.easee_hoger_equalizer_limit` | D022 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EASEE Höger In current | `sensor.easee_hoger_in_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Internal temperature | `sensor.easee_hoger_internal_temperature` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| EASEE Höger Lifetime energy | `sensor.easee_hoger_lifetime_energy` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass energy; enhet kWh; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| EASEE Höger Max charger current | `sensor.easee_hoger_max_charger_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Max charger limit | `sensor.easee_hoger_max_charger_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `config_maxChargerCurrent`, `unit_of_measurement`, `device_class` |
| EASEE Höger Max circuit current | `sensor.easee_hoger_max_circuit_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Max circuit limit | `sensor.easee_hoger_max_circuit_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `circuit_id`, `circuit_circuitPanelId`, `circuit_panelName`, `circuit_ratedCurrent`, `config_circuitMaxCurrentP1`, `config_circuitMaxCurrentP2`, `config_circuitMaxCurrentP3`, `unit_of_measurement`, `device_class` |
| EASEE Höger Offline circuit limit | `sensor.easee_hoger_offline_circuit_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `circuit_id`, `circuit_circuitPanelId`, `circuit_panelName`, `circuit_ratedCurrent`, `state_offlineMaxCircuitCurrentP1`, `state_offlineMaxCircuitCurrentP2`, `state_offlineMaxCircuitCurrentP3`, `unit_of_measurement`, `device_class` |
| EASEE Höger Output current | `sensor.easee_hoger_output_current` | D022 | `easee` | normal | Otillgänglig | klass current; enhet A; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Output limit | `sensor.easee_hoger_output_limit` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass current; enhet A; läsa mätvärde; fält: `name`, `id`, `unit_of_measurement`, `device_class` |
| Phase mode | `sensor.easee_hoger_phase_mode` | D022 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EASEE Höger Power | `sensor.easee_hoger_power` | D022 | `easee` | normal | Rapporterar tillstånd | klass power; enhet kW; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `unit_of_measurement`, `device_class` |
| EASEE Höger Reason for no current | `sensor.easee_hoger_reason_for_no_current` | D022 | `easee` | normal | Rapporterar tillstånd | klass easee__reason_no_current; läsa mätvärde; fält: `name`, `id`, `device_class` |
| EASEE Höger Session Energy | `sensor.easee_hoger_session_energy` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass energy; enhet kWh; läsa mätvärde; fält: `name`, `id`, `unit_of_measurement`, `device_class` |
| EASEE Höger Status | `sensor.easee_hoger_status` | D022 | `easee` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `name`, `id`, `config_phaseMode`, `state_outputPhase`, `state_ledMode`, `state_cableRating`, `config_authorizationRequired`, `config_localNodeType`, `config_localAuthorizationRequired`, `site_id`, `site_name`, `site_siteKey`, `site_ratedCurrent`, `circuit_id`, `circuit_ratedCurrent` |
| EASEE Höger Total power | `sensor.easee_hoger_total_power` | D022 | `easee` | normal | Otillgänglig | klass power; enhet kW; läsa mätvärde; flaggor 0; fält: `restored`, `device_class`, `supported_features`, `unit_of_measurement` |
| EASEE Höger Voltage | `sensor.easee_hoger_voltage` | D022 | `easee` | diagnostic | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `name`, `id`, `state_inVoltageT1T2`, `state_inVoltageT1T3`, `state_inVoltageT1T4`, `state_inVoltageT1T5`, `state_inVoltageT2T3`, `state_inVoltageT2T4`, `state_inVoltageT2T5`, `state_inVoltageT3T4`, `state_inVoltageT3T5`, `state_inVoltageT4T5`, `unit_of_measurement`, `device_class` |
| EASEE Höger Operator | `sensor.garaget_easee_hoger_operator` | D022 | `easee` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `name`, `id`, `state_operatorID` |
| Pilot Mode | `sensor.garaget_easee_hoger_pilot_mode` | D022 | `easee` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Basic schedule | `switch.easee_hoger_basic_schedule` | D022 | `easee` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| EASEE Höger Cable locked permanently | `switch.easee_hoger_cable_locked_permanently` | D022 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| EASEE Höger Idle current | `switch.easee_hoger_enable_idle_current` | D022 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| EASEE Höger Charger enabled | `switch.easee_hoger_is_enabled` | D022 | `easee` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| EASEE Höger Smart charging | `switch.easee_hoger_smart_charging` | D022 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| EASEE Höger Touch button enabled | `switch.easee_hoger_touch_button_enabled` | D022 | `easee` | config | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `name`, `id` |
| Weekly schedule | `switch.easee_hoger_weekly_schedule` | D022 | `easee` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

### Robotgräsklippare och robotdammsugare

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Xiaomi Vacuum cleaner Mop attached | `binary_sensor.xiaomi_vacuum_cleaner_mop_attached` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| Xiaomi Vacuum cleaner Mop attached | `binary_sensor.xiaomi_vacuum_cleaner_water_box_attached` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass connectivity; läsa binärt tillstånd; fält: `device_class` |
| roborock.vacuum Reset filter | `button.roborock_vacuum_reset_filter` | D132 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| roborock.vacuum Reset main brush | `button.roborock_vacuum_reset_main_brush` | D132 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| roborock.vacuum Reset sensor dirty | `button.roborock_vacuum_reset_sensor_dirty` | D132 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| roborock.vacuum Reset side brush | `button.roborock_vacuum_reset_side_brush` | D132 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| Xiaomi Vacuum cleaner Reset filter | `button.xiaomi_vacuum_cleaner_reset_filter` | D126 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| Xiaomi Vacuum cleaner Reset main brush | `button.xiaomi_vacuum_cleaner_reset_main_brush` | D126 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| Xiaomi Vacuum cleaner Reset sensor dirty | `button.xiaomi_vacuum_cleaner_reset_sensor_dirty` | D126 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| Xiaomi Vacuum cleaner Reset side brush | `button.xiaomi_vacuum_cleaner_reset_side_brush` | D126 | `xiaomi_miio` | config | Otillgänglig | klass restart; fält: `device_class` |
| roborock.vacuum Battery | `sensor.roborock_vacuum_battery` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| roborock.vacuum Current clean area | `sensor.roborock_vacuum_current_clean_area` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | enhet m²; läsa mätvärde; fält: `unit_of_measurement` |
| roborock.vacuum Current clean duration | `sensor.roborock_vacuum_current_clean_duration` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | klass duration; enhet s; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| DnD end | `sensor.roborock_vacuum_dnd_end` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| DnD start | `sensor.roborock_vacuum_dnd_start` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Filter remaining | `sensor.roborock_vacuum_filter_left` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| roborock.vacuum Last clean area | `sensor.roborock_vacuum_last_clean_area` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | enhet m²; läsa mätvärde; fält: `unit_of_measurement` |
| roborock.vacuum Last clean duration | `sensor.roborock_vacuum_last_clean_duration` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | klass duration; enhet s; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| roborock.vacuum Last clean end | `sensor.roborock_vacuum_last_clean_end` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | klass timestamp; läsa mätvärde; fält: `device_class` |
| roborock.vacuum Last clean start | `sensor.roborock_vacuum_last_clean_start` | D132 | `xiaomi_miio` | diagnostic | Otillgänglig | klass timestamp; läsa mätvärde; fält: `device_class` |
| Main brush remaining | `sensor.roborock_vacuum_main_brush_left` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sensor dirty remaining | `sensor.roborock_vacuum_sensor_dirty_left` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Side brush remaining | `sensor.roborock_vacuum_side_brush_left` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total clean area | `sensor.roborock_vacuum_total_clean_area` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total clean count | `sensor.roborock_vacuum_total_clean_count` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total duration | `sensor.roborock_vacuum_total_duration` | D132 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Xiaomi Vacuum cleaner Battery | `sensor.xiaomi_vacuum_cleaner_battery` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Xiaomi Vacuum cleaner Current clean area | `sensor.xiaomi_vacuum_cleaner_current_clean_area` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | enhet m²; läsa mätvärde; fält: `unit_of_measurement` |
| Xiaomi Vacuum cleaner Current clean duration | `sensor.xiaomi_vacuum_cleaner_current_clean_duration` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass duration; enhet s; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| DnD end | `sensor.xiaomi_vacuum_cleaner_dnd_end` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| DnD start | `sensor.xiaomi_vacuum_cleaner_dnd_start` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Filter remaining | `sensor.xiaomi_vacuum_cleaner_filter_left` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Xiaomi Vacuum cleaner Last clean area | `sensor.xiaomi_vacuum_cleaner_last_clean_area` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | enhet m²; läsa mätvärde; fält: `unit_of_measurement` |
| Xiaomi Vacuum cleaner Last clean duration | `sensor.xiaomi_vacuum_cleaner_last_clean_duration` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass duration; enhet s; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Xiaomi Vacuum cleaner Last clean end | `sensor.xiaomi_vacuum_cleaner_last_clean_end` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass timestamp; läsa mätvärde; fält: `device_class` |
| Xiaomi Vacuum cleaner Last clean start | `sensor.xiaomi_vacuum_cleaner_last_clean_start` | D126 | `xiaomi_miio` | diagnostic | Otillgänglig | klass timestamp; läsa mätvärde; fält: `device_class` |
| Main brush remaining | `sensor.xiaomi_vacuum_cleaner_main_brush_left` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sensor dirty remaining | `sensor.xiaomi_vacuum_cleaner_sensor_dirty_left` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Side brush remaining | `sensor.xiaomi_vacuum_cleaner_side_brush_left` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total clean area | `sensor.xiaomi_vacuum_cleaner_total_clean_area` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total clean count | `sensor.xiaomi_vacuum_cleaner_total_clean_count` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total duration | `sensor.xiaomi_vacuum_cleaner_total_duration` | D126 | `xiaomi_miio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `vacuum.unnamed_device` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Otillgänglig | flaggor 14140 (paus, stopp, återvänd till docka, fläkthastighet, specialkommando, lokalisering, punktstädning, aktivitetstillstånd, start); suglägen: Silent, Standard, Medium, Turbo, Gentle, Auto; fält: `fan_speed_list`, `supported_features` |
| Xiaomi Vacuum cleaner | `vacuum.xiaomi_vacuum_cleaner` | D126 | `xiaomi_miio` | normal | Otillgänglig | flaggor 14140 (paus, stopp, återvänd till docka, fläkthastighet, specialkommando, lokalisering, punktstädning, aktivitetstillstånd, start); suglägen: Silent, Standard, Medium, Turbo, Gentle, Auto; fält: `fan_speed_list`, `supported_features` |

#### Trädgården

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Automower Automatic | `button.automower_auto` | D004 | `robonect` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower End of day | `button.automower_eod` | D004 | `robonect` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower Go back home | `button.automower_home` | D004 | `robonect` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower Manual | `button.automower_man` | D004 | `robonect` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower Start | `button.automower_start` | D004 | `robonect` | normal | Rapporterar tillstånd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower Stop | `button.automower_stop` | D004 | `robonect` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Automower GPS Tracker | `device_tracker.automower_gps` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | fält: `tracking_type`, `in_zones`, `source_type`, `latitude`, `longitude`, `gps_accuracy`, `satellites`, `last_synced`, `battery_level` |
| Automower Robotic Lawn Mower | `lawn_mower.automower_robonect` | D004 | `robonect` | normal | Rapporterar tillstånd | flaggor 7 (starta klippning, paus, dockning); fält: `substatus`, `status_plain`, `status_duration`, `mode`, `distance`, `statistic_hours`, `timer_next_unix`, `blades_quality`, `supported_features`, `status_mode`, `battery` |
| Automower Control | `sensor.automower_control` | D004 | `robonect` | diagnostic | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Automower Name | `sensor.automower_device_name` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Serial number | `sensor.automower_device_serial` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower GPS Latitude | `sensor.automower_gps_latitude` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower GPS Longitude | `sensor.automower_gps_longitude` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Namn saknas | `sensor.automower_gps_satellites` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Automower Internal humidity | `sensor.automower_health_climate_humidity` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass humidity; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Internal mower temperature | `sensor.automower_health_climate_temperature` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass temperature; enhet °C; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Robonect supply voltage | `sensor.automower_health_voltage_batt` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Mower operating voltage | `sensor.automower_health_voltage_ext33` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Robonect operating voltage | `sensor.automower_health_voltage_int33` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass voltage; enhet V; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Battery | `sensor.automower_mower_battery_charge` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Blade age | `sensor.automower_mower_blades_days` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass duration; enhet d; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Blade operating hours | `sensor.automower_mower_blades_hours` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass duration; enhet h; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Blade quality | `sensor.automower_mower_blades_quality` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement` |
| Automower Distance | `sensor.automower_mower_distance` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass distance; enhet m; läsa mätvärde; fält: `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Last error code | `sensor.automower_mower_error_code` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Last error message | `sensor.automower_mower_error_message` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Mode | `sensor.automower_mower_mode` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Operating hours | `sensor.automower_mower_statistic_hours` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass duration; enhet h; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Status | `sensor.automower_mower_status` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Time in current status | `sensor.automower_mower_status_duration` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | klass duration; enhet min; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `last_synced`, `unit_of_measurement`, `device_class` |
| Automower Simple status | `sensor.automower_mower_status_plain` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower | `sensor.automower_mower_stopped` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Substatus | `sensor.automower_mower_substatus` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | läsa mätvärde; fält: `last_synced` |
| Automower Simple substatus | `sensor.automower_mower_substatus_plain` | D004 | `robonect` | diagnostic | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Namn saknas | `sensor.automower_mower_timer_ch0_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch0_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch0_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch0_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch10_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch10_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch10_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch10_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch11_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch11_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch11_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch11_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch12_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch12_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch12_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch12_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch13_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch13_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch13_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch13_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch1_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch1_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch1_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch1_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch2_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch2_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch2_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch2_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch3_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch3_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch3_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch3_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch4_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch4_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch4_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch4_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch5_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch5_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch5_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch5_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch6_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch6_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch6_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch6_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch7_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch7_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch7_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch7_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch8_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch8_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch8_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch8_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch9_enable` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch9_end` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch9_start` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_mower_timer_ch9_weekdays` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next start date | `sensor.automower_mower_timer_next_date` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next start time | `sensor.automower_mower_timer_next_time` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Automower Next start time | `sensor.automower_mower_timer_next_unix` | D004 | `robonect` | diagnostic | Okänd | klass timestamp; läsa mätvärde; fält: `Raw state`, `last_synced`, `device_class` |
| MQTT | `sensor.automower_mqtt` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_weather_data_break` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Namn saknas | `sensor.automower_weather_service` | D004 | `robonect` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Automower Wi-Fi signal strength | `sensor.automower_wlan_rssi` | D004 | `robonect` | diagnostic | Rapporterar tillstånd | enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `Raw state`, `last_synced`, `unit_of_measurement` |

### Mediaspelare och ljud

#### Biosalongen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Sony HT-A9 | `media_player.ht_a9_2` | D049 | `songpal` | normal | Rapporterar tillstånd | klass receiver; flaggor 69004 (volym, ljud av, påslag, avslag, volymsteg, källval, ljudläge); fält: `source_list`, `sound_mode_list`, `device_class`, `supported_features` |

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Allente 1 | `media_player.allente_1` | D002 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Allente 1 | `media_player.allente_1_2` | D003 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Google tv Streamer | `media_player.bion` | D042 | `cast` | normal | Rapporterar tillstånd | flaggor 152449 (paus, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `supported_features` |
| Carrocast | `media_player.carrocast` | D013 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Chromecast0004 | `media_player.chromecast0004` | D015 | `cast` | normal | Otillgänglig | flaggor 131968 (påslag, avslag, spela media, bläddra media); fält: `restored`, `supported_features` |
| Chromecast1013 | `media_player.chromecast1013` | D016 | `cast` | normal | Otillgänglig | flaggor 152461 (paus, volym, ljud av, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `restored`, `supported_features` |
| Chromecast3798 | `media_player.chromecast3798` | D017 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Chromecast4360 | `media_player.chromecast4360` | D018 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Familjerum | `media_player.chromecast6566` | D036 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Vardagsrum | `media_player.chromecast7976` | D109 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Familjerum | `media_player.familjerum` | D035 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| GoogleTV4569 | `media_player.googletv4569` | D043 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| HT-A9 | `media_player.ht_a9` | D048 | `cast` | normal | Rapporterar tillstånd | klass speaker; flaggor 152461 (paus, volym, ljud av, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `device_class`, `supported_features` |
| Viljars❤️ | `media_player.kontor` | D117 | `cast` | normal | Otillgänglig | flaggor 152461 (paus, volym, ljud av, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `restored`, `supported_features` |
| Viljars❤️❤️ | `media_player.kontor_2` | D118 | `cast` | normal | Rapporterar tillstånd | flaggor 152461 (paus, volym, ljud av, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `supported_features` |
| Biljard sovrum | `media_player.nestmini0365` | D008 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |
| NestMini2849 | `media_player.nestmini2849` | D073 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |
| Viljars rum | `media_player.nestmini4041` | D116 | `cast` | normal | Rapporterar tillstånd | klass speaker; flaggor 152461 (paus, volym, ljud av, påslag, avslag, spela media, stopp, uppspelning, bläddra media); fält: `device_class`, `supported_features` |
| NestMini8699 | `media_player.nestmini8699` | D074 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| NestMini9561 | `media_player.nestmini9561` | D075 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |
| Sovrum | `media_player.sovrum` | D101 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |
| Telenor Mediahubb | `media_player.telenor_mediahubb` | D105 | `cast` | normal | Otillgänglig | flaggor 896 (påslag, avslag, spela media); fält: `restored`, `supported_features` |
| Test | `media_player.test` | D106 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |
| Viljars Saker | `media_player.viljars_saker` | D115 | `cast` | normal | Otillgänglig | klass speaker; flaggor 896 (påslag, avslag, spela media); fält: `restored`, `device_class`, `supported_features` |

#### Lilla Badrummet

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| LillaBadrummet | `media_player.lillabadrummet_2` | D068 | `soundtouchplus` | normal | Okänd | klass speaker; flaggor 1040319 (paus, sök i media, volym, ljud av, föregående spår, nästa spår, påslag, avslag, spela media, volymsteg, källval, stopp, uppspelning, blandning, ljudläge, bläddra media, repetition, gruppering); fält: `source_list`, `group_members`, `volume_level`, `is_volume_muted`, `media_duration`, `media_position`, `media_position_updated_at`, `sound_mode`, `stp_device_type`, `soundtouchplus_nowplaying_isadvertisement`, `soundtouchplus_nowplaying_isfavorite`, `soundtouchplus_presets_lastupdated`, `soundtouchplus_recents_lastupdated`, `soundtouchplus_recents_cache_lastupdated`, `soundtouchplus_source`, `soundtouchplus_recents_cache_enabled`, `soundtouchplus_recents_cache_max_items`, `soundtouchplus_websockets_enabled`, `soundtouchplus_polling_enabled`, `soundtouchplus_sound_mode`, `soundtouchplus_tone_bass_level`, `soundtouchplus_tone_treble_level`, `stp_nowselection_id`, `stp_nowselection_source`, `stp_nowselection_dateutc`, `device_class`, `supported_features` |

#### Stora Badrummet

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| StoraBadrummet2 | `media_player.storabadrummet2_2` | D102 | `soundtouchplus` | normal | Rapporterar tillstånd | klass speaker; flaggor 1040319 (paus, sök i media, volym, ljud av, föregående spår, nästa spår, påslag, avslag, spela media, volymsteg, källval, stopp, uppspelning, blandning, ljudläge, bläddra media, repetition, gruppering); fält: `source_list`, `group_members`, `stp_device_type`, `soundtouchplus_nowplaying_isadvertisement`, `soundtouchplus_nowplaying_isfavorite`, `soundtouchplus_presets_lastupdated`, `soundtouchplus_recents_lastupdated`, `soundtouchplus_recents_cache_lastupdated`, `soundtouchplus_source`, `soundtouchplus_recents_cache_enabled`, `soundtouchplus_recents_cache_max_items`, `soundtouchplus_websockets_enabled`, `soundtouchplus_polling_enabled`, `soundtouchplus_sound_mode`, `soundtouchplus_tone_bass_level`, `soundtouchplus_tone_treble_level`, `stp_nowselection_id`, `stp_nowselection_source`, `stp_nowselection_dateutc`, `device_class`, `supported_features` |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| AppleTV Vardagsrum | `media_player.vardagsrum` | D108 | `apple_tv` | normal | Rapporterar tillstånd | flaggor 448439 (paus, sök i media, volym, föregående spår, nästa spår, påslag, avslag, spela media, volymsteg, stopp, uppspelning, blandning, bläddra media, repetition); fält: `supported_features` |
| Vardagsrum | `remote.vardagsrum` | D108 | `apple_tv` | normal | Rapporterar tillstånd | flaggor 0; fält: `supported_features` |

### Automationer, scener och skript

#### Biosalongen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Bio stäng av allt | `script.bio_stang_av_allt` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Säkerställ endast en aktiv switch för duk | `automation.bio_duk_upp_ner_stop` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Blomlampa på | `automation.blomlampa_pa` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Blomlampa slå av | `automation.blomlampa_sla_av` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Bose Off | `automation.bose_off` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Bose OnOff Refresh KNX Device to off | `automation.bose_onoff_refresh_knx_device_to_off` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| Bose OnOff Refresh KNX Device to on | `automation.bose_onoff_refresh_knx_device_to_on` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| Bose Preset1 ny | `automation.bose_preset1_ny` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| BosePreset2 | `automation.bosepreset2` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| BosePreset3 | `automation.bosepreset3` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| BosePreset4 | `automation.bosepreset4` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| BosePreset5 | `automation.bosepreset5` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| BosePreset6 | `automation.bosepreset6` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `hidden` |
| Easee Dynamic Power Management | `automation.easee_effekthantering` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Easee max 16a | `automation.easee_max_16a` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Bose Volym Upp | `automation.hoj_volymen` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Hue - Applicera färg | `automation.hue_applicera_farg` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Hue - Applicera färgtemperatur | `automation.hue_applicera_fargtemperatur` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Hue - Applicera ljusstyrka | `automation.hue_applicera_ljusstyrka` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Hue - Synka lampa när den kommer online | `automation.hue_synka_lampa_nar_den_kommer_online` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current`, `max` |
| Ljud Stora badrummet KNX radio preset | `automation.ljud_stora_badrummet_knx_radio_preset` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Matsal Shelly - KNX Dimning | `automation.matsal_shelly_knx_dimning` | Ingen enhetsregisterkoppling | `automation` | normal | Otillgänglig | namn och status verifierade; innehåll ej åtkomligt; flaggor 0; fält: `restored`, `id`, `supported_features` |
| Matsal Shelly - KNX ON/OFF | `automation.matsal_shelly_knx_on_off` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Matsal Shelly - KNX Start/Stop Dimning | `automation.matsal_shelly_knx_start_stop_dimning` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Matsal Shelly - Status till KNX | `automation.matsal_shelly_status_till_knx` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Media_Send_Title_When_Changed | `automation.media_send_title_when_changed` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Motorvärmare 1 Auto off  | `automation.motorvarmare_1_auto_off` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Motorvärmare 2 auto off | `automation.motorvarmare_2_auto_off` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Motorvärmare Skarvkabel 1 stäng av efter 2h | `automation.motorvarmare_skarvkabel_1_stang_av_efter_2h` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Motorvärmare Skarvkabel 1 Stäng av när urkopplad | `automation.motorvarmare_skarvkabel_1_stang_av_nar_urkopplad` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Notify not updating | `automation.notify_not_updating` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Bose Volym Ner | `automation.sank_volymen` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Sätt Hue vid start Vardagsrum | `automation.satt_hue_vid_start_vardagsrum` | Ingen enhetsregisterkoppling | `automation` | normal | Otillgänglig | namn och status verifierade; innehåll ej åtkomligt; flaggor 0; fält: `restored`, `id`, `supported_features` |
| Bion_uppdatera_HDMI-Ingång_från_GUI_input-select | `automation.set_hdmi_input` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Bion Update HDMI Input Status från switchen | `automation.update_hdmi_input_status` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| VVB Källaren Keep warming | `automation.vvb_kallaren_keep_warming` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| VVB Källaren Powersave | `automation.vvb_kallaren_powersave` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| VVB Prisbaserad Styrning | `automation.vvb_prisbaserad_styrning` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Warning För hög effekt vid huvudsäkring | `automation.warning_for_hog_effekt_vid_huvudsakring` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Warning Låg fasspänning | `automation.warning_lag_fasspanning` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Warning Låg radiatortemperatur | `automation.warning_lag_radiatortemperatur` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Yale Lås Entredörr vid låsning Verkstad | `automation.yale_las_entredorr_vid_lasning_verkstad` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| Yale Lås Verkstadsdörr vid låsning Entre | `automation.yale_lock_other_door` | Ingen enhetsregisterkoppling | `automation` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `id`, `last_triggered`, `mode`, `current` |
| reset_media_control_lights | `script.1569137870936` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| media_preset_button_action | `script.1569138249310` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Vacuum_clean_fireplaces | `script.1581512090567` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Vacuum Move to empty Bin | `script.1581512772477` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Vacuum Clean Köket | `script.1582031157697` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Festlig Jul | `script.hue_scene_christmas_festive` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Varm Jul | `script.hue_scene_christmas_warm` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Mysigt | `script.hue_scene_cozy` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Normal | `script.hue_scene_normal` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Av | `script.hue_scene_off` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Fest | `script.hue_scene_party` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |
| Hue Scen - Arbetsljus | `script.hue_scene_work` | Ingen enhetsregisterkoppling | `script` | normal | Rapporterar tillstånd | namn och status verifierade; innehåll ej åtkomligt; fält: `last_triggered`, `mode`, `current` |

#### Festen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Festen Halloween | `scene.festen_halloween` | D038 | `hue` | normal | Okänd | namn och status verifierade; innehåll ej åtkomligt; fält: `group_name`, `group_type`, `name`, `speed`, `brightness`, `is_dynamic` |
| Festen Kristall | `scene.festen_kristall` | D038 | `hue` | normal | Okänd | namn och status verifierade; innehåll ej åtkomligt; fält: `group_name`, `group_type`, `name`, `speed`, `brightness`, `is_dynamic` |
| Festen Normalt ljus2 | `scene.festen_normalt_ljus2` | D038 | `hue` | normal | Okänd | namn och status verifierade; innehåll ej åtkomligt; fält: `group_name`, `group_type`, `name`, `speed`, `brightness`, `is_dynamic` |
| Festen Nyårsblått | `scene.festen_nyarsblatt` | D038 | `hue` | normal | Okänd | namn och status verifierade; innehåll ej åtkomligt; fält: `group_name`, `group_type`, `name`, `speed`, `brightness`, `is_dynamic` |
| Festen Vitt ljus | `scene.festen_vitt_ljus` | D038 | `hue` | normal | Okänd | namn och status verifierade; innehåll ej åtkomligt; fält: `group_name`, `group_type`, `name`, `speed`, `brightness`, `is_dynamic` |

### Närvaro, dörrar och säkerhet

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Hall Knapp 4 | `binary_sensor.hall_knapp_4` | Ingen enhetsregisterkoppling | `knx` | normal | Otillgänglig | klass tamper; läsa binärt tillstånd; flaggor 0; fält: `restored`, `device_class`, `supported_features` |
| Generic Camera | `camera.generic_camera` | D039 | `generic` | normal | Rapporterar tillstånd | flaggor 2; odelkodade bitar 2; fält: `supported_features` |
| Robert | `device_tracker.automower_g_142301515_162000720` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| KIF | `device_tracker.automower_h_182302167_182033540` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| KBGF | `device_tracker.automower_h_182302205_182032331` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| Robert | `device_tracker.automower_none_142301515_162000720` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| KIF | `device_tracker.automower_none_182302167_182033540` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| KBGF | `device_tracker.automower_none_182302205_182032331` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| Carro Pixel 10 Pro | `device_tracker.carro_pixel_10_pro` | D012 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| CLT-L29 | `device_tracker.clt_l29` | D011 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| E Golf | `device_tracker.e_golf` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| Pixel 10 Pro | `device_tracker.eskil_pixel_10_pro` | D081 | `mobile_app` | diagnostic | Rapporterar tillstånd | fält: `tracking_type`, `in_zones`, `source_type`, `latitude`, `longitude`, `gps_accuracy`, `altitude`, `course`, `speed`, `vertical_accuracy` |
| Eskils Pixel 7 Pro | `device_tracker.eskils_pixel_7_pro` | D034 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| Pixel 10 Pro | `device_tracker.pixel_10_pro` | D080 | `mobile_app` | diagnostic | Rapporterar tillstånd | fält: `tracking_type`, `in_zones`, `source_type`, `latitude`, `longitude`, `gps_accuracy`, `altitude`, `course`, `speed`, `vertical_accuracy` |
| Viljars Pixel 10 Pro | `device_tracker.viljars_pixel_10_pro` | D112 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| Viljars Pixel 7 Pro | `device_tracker.viljars_pixel_7_pro` | D113 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| Viljars Pixel Watch 3 | `device_tracker.viljars_pixel_watch_3` | D114 | `mobile_app` | diagnostic | Okänd | fält: `tracking_type`, `in_zones`, `source_type` |
| wvwzzzauzfw905569 | `device_tracker.wvwzzzauzfw905569` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `source_type` |
| Carro | `person.caroline` | Ingen enhetsregisterkoppling | `person` | normal | Okänd | fält: `editable`, `id`, `device_trackers`, `in_zones`, `user_id` |
| Viljar | `person.viljar` | Ingen enhetsregisterkoppling | `person` | normal | Rapporterar tillstånd | fält: `editable`, `id`, `device_trackers`, `in_zones`, `latitude`, `longitude`, `gps_accuracy`, `source`, `user_id` |

#### Entrédörr

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Entrédörr Door | `binary_sensor.entredorr_door` | D032 | `yale` | normal | Rapporterar tillstånd | klass door; läsa binärt tillstånd; fält: `device_class` |
| Entrédörr Doorbell ding | `binary_sensor.entredorr_doorbell_ding` | D032 | `yale` | normal | Rapporterar tillstånd | klass occupancy; läsa binärt tillstånd; fält: `device_class` |
| Entrédörr Wake | `button.entredorr_wake_2` | D032 | `yale` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Entrédörr Doorbell | `event.entredorr_doorbell_2` | D032 | `yale` | normal | Rapporterar tillstånd | klass doorbell; fält: `event_types`, `event_type`, `device_class` |
| Entrédörr | `lock.entredorr_2` | D032 | `yale` | normal | Rapporterar tillstånd | flaggor 0; fält: `changed_by`, `battery_level`, `supported_features` |
| Entrédörr Battery | `sensor.entredorr_battery_2` | D032 | `yale` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Entrédörr Operator | `sensor.entredorr_operator_2` | D032 | `yale` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `remote`, `keypad`, `manual`, `tag`, `autorelock`, `method` |

#### Verkstadsentre

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Verkstadsentre Door | `binary_sensor.verkstadsentre_door` | D111 | `yale` | normal | Rapporterar tillstånd | klass door; läsa binärt tillstånd; fält: `device_class` |
| Verkstadsentre Doorbell ding | `binary_sensor.verkstadsentre_doorbell_ding` | D111 | `yale` | normal | Rapporterar tillstånd | klass occupancy; läsa binärt tillstånd; fält: `device_class` |
| Verkstadsentre Wake | `button.verkstadsentre_wake_2` | D111 | `yale` | normal | Okänd | Tillstånd finns; inget ytterligare funktionsstöd rapporterat |
| Verkstadsentre Doorbell | `event.verkstadsentre_doorbell_2` | D111 | `yale` | normal | Rapporterar tillstånd | klass doorbell; fält: `event_types`, `event_type`, `device_class` |
| Verkstadsentre | `lock.verkstadsentre_2` | D111 | `yale` | normal | Rapporterar tillstånd | flaggor 0; fält: `changed_by`, `battery_level`, `supported_features` |
| Verkstadsentre Battery | `sensor.verkstadsentre_battery_2` | D111 | `yale` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Verkstadsentre Operator | `sensor.verkstadsentre_operator_2` | D111 | `yale` | normal | Rapporterar tillstånd | läsa mätvärde; fält: `remote`, `keypad`, `manual`, `tag`, `autorelock`, `method` |

### Övriga givare

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Android Auto | `binary_sensor.carro_pixel_10_pro_android_auto` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.carro_pixel_10_pro_headphones` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.carro_pixel_10_pro_mic_muted` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.carro_pixel_10_pro_music_active` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.carro_pixel_10_pro_speakerphone` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.carro_pixel_10_pro_work_profile` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Android Auto | `binary_sensor.clt_l29_android_auto` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.clt_l29_headphones` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.clt_l29_mic_muted` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.clt_l29_music_active` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.clt_l29_speakerphone` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.clt_l29_work_profile` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Android Auto | `binary_sensor.eskils_pixel_7_pro_android_auto` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.eskils_pixel_7_pro_headphones` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.eskils_pixel_7_pro_mic_muted` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.eskils_pixel_7_pro_music_active` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.eskils_pixel_7_pro_speakerphone` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.eskils_pixel_7_pro_work_profile` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| nodered 9cec431ff7d8e688 | `binary_sensor.nodered_9cec431ff7d8e688` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa binärt tillstånd; flaggor 0; fält: `restored`, `supported_features` |
| Android Auto | `binary_sensor.pixel_10_pro_android_auto` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Android Auto | `binary_sensor.pixel_10_pro_android_auto_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.pixel_10_pro_headphones` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.pixel_10_pro_headphones_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.pixel_10_pro_mic_muted` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.pixel_10_pro_mic_muted_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.pixel_10_pro_music_active` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.pixel_10_pro_music_active_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.pixel_10_pro_speakerphone` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.pixel_10_pro_speakerphone_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.pixel_10_pro_work_profile` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.pixel_10_pro_work_profile_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Skymning | `binary_sensor.skymning` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `source` |
| storabadrummet_onoff | `binary_sensor.storabadrummet_onoff` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset1 | `binary_sensor.storabadrummet_preset1` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset2 | `binary_sensor.storabadrummet_preset2` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset3 | `binary_sensor.storabadrummet_preset3` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset4 | `binary_sensor.storabadrummet_preset4` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset5 | `binary_sensor.storabadrummet_preset5` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_preset6 | `binary_sensor.storabadrummet_preset6` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_voldown | `binary_sensor.storabadrummet_voldown` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_volup | `binary_sensor.storabadrummet_volup` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd; fält: `hidden` |
| storabadrummet_volupdown | `binary_sensor.storabadrummet_volupdown` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | läsa binärt tillstånd |
| Android Auto | `binary_sensor.viljars_pixel_10_pro_android_auto` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.viljars_pixel_10_pro_headphones` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.viljars_pixel_10_pro_mic_muted` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.viljars_pixel_10_pro_music_active` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.viljars_pixel_10_pro_speakerphone` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.viljars_pixel_10_pro_work_profile` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Android Auto | `binary_sensor.viljars_pixel_7_pro_android_auto` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.viljars_pixel_7_pro_headphones` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.viljars_pixel_7_pro_mic_muted` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.viljars_pixel_7_pro_music_active` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.viljars_pixel_7_pro_speakerphone` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Work profile | `binary_sensor.viljars_pixel_7_pro_work_profile` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Headphones | `binary_sensor.viljars_pixel_watch_3_headphones` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mic muted | `binary_sensor.viljars_pixel_watch_3_mic_muted` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Music active | `binary_sensor.viljars_pixel_watch_3_music_active` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Speakerphone | `binary_sensor.viljars_pixel_watch_3_speakerphone` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| busvebacken Update event | `event.busvebacken_update_event` | D128 | `telegram_bot` | normal | Rapporterar tillstånd | fält: `event_types`, `event_type`, `chat_id`, `message_id`, `bot` |
| Active notification count | `sensor.carro_pixel_10_pro_active_notification_count` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.carro_pixel_10_pro_audio_mode` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.carro_pixel_10_pro_bluetooth_connection` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.carro_pixel_10_pro_car_charging_status` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.carro_pixel_10_pro_car_fuel` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.carro_pixel_10_pro_car_name` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.carro_pixel_10_pro_car_odometer` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.carro_pixel_10_pro_car_speed` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.carro_pixel_10_pro_detected_activity` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.carro_pixel_10_pro_geocoded_location` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.carro_pixel_10_pro_last_notification` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.carro_pixel_10_pro_last_removed_notification` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.carro_pixel_10_pro_last_used_app` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.carro_pixel_10_pro_light_sensor` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.carro_pixel_10_pro_media_session` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.carro_pixel_10_pro_next_alarm` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.carro_pixel_10_pro_phone_state` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.carro_pixel_10_pro_pressure_sensor` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.carro_pixel_10_pro_ringer_mode` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.carro_pixel_10_pro_screen_brightness` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.carro_pixel_10_pro_screen_off_timeout` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.carro_pixel_10_pro_screen_orientation` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.carro_pixel_10_pro_screen_rotation` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.carro_pixel_10_pro_sleep_confidence` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.carro_pixel_10_pro_sleep_segment` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.carro_pixel_10_pro_steps_sensor` | D012 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active notification count | `sensor.clt_l29_active_notification_count` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.clt_l29_audio_mode` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.clt_l29_bluetooth_connection` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.clt_l29_car_charging_status` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.clt_l29_car_fuel` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.clt_l29_car_name` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.clt_l29_car_odometer` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.clt_l29_car_speed` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.clt_l29_detected_activity` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.clt_l29_geocoded_location` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.clt_l29_last_notification` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.clt_l29_last_removed_notification` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.clt_l29_last_used_app` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.clt_l29_light_sensor` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.clt_l29_media_session` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.clt_l29_next_alarm` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.clt_l29_phone_state` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.clt_l29_ringer_mode` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.clt_l29_screen_brightness` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.clt_l29_screen_off_timeout` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.clt_l29_screen_orientation` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.clt_l29_screen_rotation` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.clt_l29_sleep_confidence` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.clt_l29_sleep_segment` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.clt_l29_steps_sensor` | D011 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active notification count | `sensor.eskils_pixel_7_pro_active_notification_count` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.eskils_pixel_7_pro_audio_mode` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.eskils_pixel_7_pro_bluetooth_connection` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.eskils_pixel_7_pro_car_charging_status` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.eskils_pixel_7_pro_car_fuel` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.eskils_pixel_7_pro_car_name` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.eskils_pixel_7_pro_car_odometer` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.eskils_pixel_7_pro_car_speed` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.eskils_pixel_7_pro_detected_activity` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.eskils_pixel_7_pro_geocoded_location` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.eskils_pixel_7_pro_last_notification` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.eskils_pixel_7_pro_last_removed_notification` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.eskils_pixel_7_pro_last_used_app` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.eskils_pixel_7_pro_light_sensor` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.eskils_pixel_7_pro_media_session` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.eskils_pixel_7_pro_next_alarm` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.eskils_pixel_7_pro_phone_state` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.eskils_pixel_7_pro_pressure_sensor` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.eskils_pixel_7_pro_ringer_mode` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.eskils_pixel_7_pro_screen_brightness` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.eskils_pixel_7_pro_screen_off_timeout` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.eskils_pixel_7_pro_screen_orientation` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.eskils_pixel_7_pro_screen_rotation` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.eskils_pixel_7_pro_sleep_confidence` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.eskils_pixel_7_pro_sleep_segment` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.eskils_pixel_7_pro_steps_sensor` | D034 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Laddning Bil kWh | `sensor.laddning_bil_kwh` | Ingen enhetsregisterkoppling | `knx` | normal | Rapporterar tillstånd | mätartyp measurement; läsa mätvärde; fält: `state_class`, `source` |
| nodered ed3d96c08bd03e24 | `sensor.nodered_ed3d96c08bd03e24` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Active notification count | `sensor.pixel_10_pro_active_notification_count` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.pixel_10_pro_audio_mode` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.pixel_10_pro_audio_mode_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.pixel_10_pro_bluetooth_connection` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.pixel_10_pro_bluetooth_connection_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.pixel_10_pro_car_charging_status` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.pixel_10_pro_car_charging_status_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.pixel_10_pro_car_fuel` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.pixel_10_pro_car_fuel_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.pixel_10_pro_car_name` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.pixel_10_pro_car_name_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.pixel_10_pro_car_odometer` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.pixel_10_pro_car_odometer_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.pixel_10_pro_car_speed` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.pixel_10_pro_car_speed_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.pixel_10_pro_detected_activity` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.pixel_10_pro_detected_activity_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.pixel_10_pro_geocoded_location` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.pixel_10_pro_geocoded_location_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.pixel_10_pro_last_notification` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.pixel_10_pro_last_removed_notification` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.pixel_10_pro_last_used_app` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.pixel_10_pro_last_used_app_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.pixel_10_pro_light_sensor` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.pixel_10_pro_light_sensor_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.pixel_10_pro_media_session` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.pixel_10_pro_media_session_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.pixel_10_pro_next_alarm` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.pixel_10_pro_next_alarm_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.pixel_10_pro_phone_state` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.pixel_10_pro_phone_state_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.pixel_10_pro_pressure_sensor` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.pixel_10_pro_pressure_sensor_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.pixel_10_pro_ringer_mode` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.pixel_10_pro_ringer_mode_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.pixel_10_pro_screen_brightness` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.pixel_10_pro_screen_brightness_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.pixel_10_pro_screen_off_timeout` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.pixel_10_pro_screen_off_timeout_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.pixel_10_pro_screen_orientation` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.pixel_10_pro_screen_orientation_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.pixel_10_pro_screen_rotation` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.pixel_10_pro_screen_rotation_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.pixel_10_pro_sleep_confidence` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.pixel_10_pro_sleep_confidence_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.pixel_10_pro_sleep_segment` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.pixel_10_pro_sleep_segment_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.pixel_10_pro_steps_sensor` | D080 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.pixel_10_pro_steps_sensor_2` | D081 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Powersaver1 | `sensor.powersaver1` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Powersaver1 | `sensor.powersaver1_2` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Powersaver2 | `sensor.powersaver2` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Powersaver3 | `sensor.powersaver3` | Ingen enhetsregisterkoppling | `nodered` | normal | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| vardagsrum_temperatur Vardagsrummet WiFi Signal Sensor | `sensor.test2_wifi_signal_sensor` | D133 | `esphome` | normal | Otillgänglig | enhet dB; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet Fuktighet | `sensor.vardagsrummet_fuktighet` | D133 | `esphome` | normal | Otillgänglig | enhet %; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet Fuktighet | `sensor.vardagsrummet_fuktighet_2` | D133 | `esphome` | normal | Otillgänglig | enhet %; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| vardagsrum_temperatur Vardagsrummet WiFi Signal Sensor | `sensor.vardagsrummet_wifi_signal_sensor` | D133 | `esphome` | normal | Otillgänglig | enhet dB; läsa mätvärde; flaggor 0; fält: `restored`, `supported_features`, `unit_of_measurement` |
| Vexve H1 Valve position | `sensor.vexve_h1_valve_position` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Okänd | klass battery; enhet %; läsa mätvärde; fält: `unit_of_measurement`, `device_class` |
| Active notification count | `sensor.viljars_pixel_10_pro_active_notification_count` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.viljars_pixel_10_pro_audio_mode` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.viljars_pixel_10_pro_bluetooth_connection` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.viljars_pixel_10_pro_car_charging_status` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.viljars_pixel_10_pro_car_fuel` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.viljars_pixel_10_pro_car_name` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.viljars_pixel_10_pro_car_odometer` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.viljars_pixel_10_pro_car_speed` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.viljars_pixel_10_pro_detected_activity` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.viljars_pixel_10_pro_geocoded_location` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.viljars_pixel_10_pro_last_notification` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.viljars_pixel_10_pro_last_removed_notification` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.viljars_pixel_10_pro_last_used_app` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.viljars_pixel_10_pro_light_sensor` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.viljars_pixel_10_pro_media_session` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.viljars_pixel_10_pro_next_alarm` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.viljars_pixel_10_pro_phone_state` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.viljars_pixel_10_pro_pressure_sensor` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.viljars_pixel_10_pro_ringer_mode` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.viljars_pixel_10_pro_screen_brightness` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.viljars_pixel_10_pro_screen_off_timeout` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.viljars_pixel_10_pro_screen_orientation` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.viljars_pixel_10_pro_screen_rotation` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.viljars_pixel_10_pro_sleep_confidence` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.viljars_pixel_10_pro_sleep_segment` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.viljars_pixel_10_pro_steps_sensor` | D112 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active notification count | `sensor.viljars_pixel_7_pro_active_notification_count` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.viljars_pixel_7_pro_audio_mode` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.viljars_pixel_7_pro_bluetooth_connection` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car charging status | `sensor.viljars_pixel_7_pro_car_charging_status` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel | `sensor.viljars_pixel_7_pro_car_fuel` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car name | `sensor.viljars_pixel_7_pro_car_name` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car odometer | `sensor.viljars_pixel_7_pro_car_odometer` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car speed | `sensor.viljars_pixel_7_pro_car_speed` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Detected activity | `sensor.viljars_pixel_7_pro_detected_activity` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Geocoded location | `sensor.viljars_pixel_7_pro_geocoded_location` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last notification | `sensor.viljars_pixel_7_pro_last_notification` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last removed notification | `sensor.viljars_pixel_7_pro_last_removed_notification` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last used app | `sensor.viljars_pixel_7_pro_last_used_app` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.viljars_pixel_7_pro_light_sensor` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Media session | `sensor.viljars_pixel_7_pro_media_session` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.viljars_pixel_7_pro_next_alarm` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.viljars_pixel_7_pro_phone_state` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.viljars_pixel_7_pro_pressure_sensor` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.viljars_pixel_7_pro_ringer_mode` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.viljars_pixel_7_pro_screen_brightness` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.viljars_pixel_7_pro_screen_off_timeout` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.viljars_pixel_7_pro_screen_orientation` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.viljars_pixel_7_pro_screen_rotation` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep confidence | `sensor.viljars_pixel_7_pro_sleep_confidence` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep segment | `sensor.viljars_pixel_7_pro_sleep_segment` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.viljars_pixel_7_pro_steps_sensor` | D113 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Audio mode | `sensor.viljars_pixel_watch_3_audio_mode` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth connection | `sensor.viljars_pixel_watch_3_bluetooth_connection` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.viljars_pixel_watch_3_heart_rate` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Light sensor | `sensor.viljars_pixel_watch_3_light_sensor` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Next alarm | `sensor.viljars_pixel_watch_3_next_alarm` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Phone state | `sensor.viljars_pixel_watch_3_phone_state` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pressure sensor | `sensor.viljars_pixel_watch_3_pressure_sensor` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Ringer mode | `sensor.viljars_pixel_watch_3_ringer_mode` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen brightness | `sensor.viljars_pixel_watch_3_screen_brightness` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen off timeout | `sensor.viljars_pixel_watch_3_screen_off_timeout` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen orientation | `sensor.viljars_pixel_watch_3_screen_orientation` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Screen rotation | `sensor.viljars_pixel_watch_3_screen_rotation` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Steps sensor | `sensor.viljars_pixel_watch_3_steps_sensor` | D114 | `mobile_app` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Halloween hue

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Hue dimmer switch 1 Button 1 | `event.hue_dimmer_switch_1_button_1` | D057 | `hue` | normal | Okänd | klass button; fält: `event_types`, `event_type`, `device_class` |
| Hue dimmer switch 1 Button 2 | `event.hue_dimmer_switch_1_button_2` | D057 | `hue` | normal | Okänd | klass button; fält: `event_types`, `event_type`, `device_class` |
| Hue dimmer switch 1 Button 3 | `event.hue_dimmer_switch_1_button_3` | D057 | `hue` | normal | Okänd | klass button; fält: `event_types`, `event_type`, `device_class` |
| Hue dimmer switch 1 Button 4 | `event.hue_dimmer_switch_1_button_4` | D057 | `hue` | normal | Okänd | klass button; fält: `event_types`, `event_type`, `device_class` |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Energy | `sensor.shellydimmer2_34945474145a_energy` | D071 | `shelly` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power | `sensor.shellydimmer2_34945474145a_power` | D071 | `shelly` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

### Hjälpare och övriga funktioner

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| WLED-Viljar2 Restart | `button.wled_viljar2_restart` | D123 | `wled` | config | Otillgänglig | klass restart; flaggor 0; fält: `restored`, `device_class`, `supported_features` |
| Update | `button.wled_viljar2_update` | D123 | `wled` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Home Assistant | `conversation.home_assistant` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | flaggor 1; fält: `supported_features` |
| Alla Hue Utelampor | `group.all_hue_outdoor` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `entity_id`, `order` |
| Lowest_price_period_long_binary | `input_boolean.lowest_price_period_long_binary` | Ingen enhetsregisterkoppling | `input_boolean` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `editable` |
| PlayOnMirrorInBathroom | `input_boolean.playonmirrorinbathroom` | Ingen enhetsregisterkoppling | `input_boolean` | normal | Rapporterar tillstånd | på/av rapporteras; styrning ej provad; fält: `editable` |
| Hue Ljusstyrka | `input_number.hue_ljusstyrka` | Ingen enhetsregisterkoppling | `input_number` | normal | Rapporterar tillstånd | enhet %; intervall 0–100; steg 5; fält: `min`, `max`, `step`, `mode`, `initial`, `editable`, `unit_of_measurement` |
| Hue Färgval | `input_select.hue_fargval` | Ingen enhetsregisterkoppling | `input_select` | normal | Rapporterar tillstånd | valalternativ Varm Vit, Neutral Vit, Kall Vit, Röd, Grön, Blå, Orange, Lila, Gul, Cyan; fält: `options`, `editable` |
| Rumsstädning | `input_select.rumsstadning` | Ingen enhetsregisterkoppling | `input_select` | normal | Rapporterar tillstånd | valalternativ Välj rum, Köket, Hallen, Kontorsentré, Salongen, Gästrummet, Kontoret, TV-Rummet; fält: `options`, `editable` |
| Carro Pixel 10 Pro | `notify.carro_pixel_10_pro` | D012 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| CLT-L29 | `notify.clt_l29` | D011 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Pixel 10 Pro | `notify.eskil_pixel_10_pro` | D081 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Eskils Pixel 7 Pro | `notify.eskils_pixel_7_pro` | D034 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Pixel 10 Pro | `notify.pixel_10_pro` | D080 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Eskil Nilsson (1256376962) | `notify.telegram_bot_5097730735_1256376962` | D033 | `telegram_bot` | normal | Rapporterar tillstånd | flaggor 1; fält: `supported_features` |
| Viljars Pixel 10 Pro | `notify.viljars_pixel_10_pro` | D112 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Viljars Pixel 7 Pro | `notify.viljars_pixel_7_pro` | D113 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| Viljars Pixel Watch 3 | `notify.viljars_pixel_watch_3` | D114 | `mobile_app` | normal | Okänd | flaggor 1; fält: `supported_features` |
| WLED-Viljar2 Intensity | `number.wled_viljar2_intensity` | D123 | `wled` | config | Otillgänglig | intervall 0–255; steg 1; flaggor 0; fält: `restored`, `min`, `max`, `step`, `mode`, `supported_features` |
| WLED-Viljar2 Speed | `number.wled_viljar2_speed` | D123 | `wled` | config | Otillgänglig | intervall 0–255; steg 1; flaggor 0; fält: `restored`, `min`, `max`, `step`, `mode`, `supported_features` |
| Belysning Hönshus | `schedule.belysning_honshus` | Ingen enhetsregisterkoppling | `schedule` | normal | Rapporterar tillstånd | fält: `editable`, `next_event` |
| WLED-Viljar2 Color palette | `select.wled_viljar2_color_palette` | D123 | `wled` | config | Otillgänglig | valalternativ * Color 1, * Color Gradient, * Colors 1&2, * Colors Only, * Random Cycle, Analogous, April Night, Aqua Flash, Atlantica, Aurora, Aurora 2, Autumn, Beach, Beech, Blink Red, Breeze, C9, C9 2, C9 New, Candy, Candy2, Cloud, Cyane, Default, Departure, Drywet, Fairy Reaf, Fire, Forest, Grintage, Hult, Hult 64, Icefire, Jul, Landscape, Lava, Light Pink, Lite Light, Magenta, Magred, Ocean, Orange & Teal, Orangery, Party, Pastel, Pink Candy, Rainbow, Rainbow Bands, Red & Blue, Red Flash, Red Reaf, Red Shift, Red Tide, Retro Clown, Rewhi, Rivendell, Sakura, Semi Blue, Sherbet, Splash, Sunset, Sunset 2, Temperature, Tertiary, Tiamat, Toxy Reaf, Vintage, Yelblu, Yelblu Hot, Yellowout, Yelmag; flaggor 0; fält: `restored`, `options`, `supported_features` |
| WLED-Viljar2 Live override | `select.wled_viljar2_live_override` | D123 | `wled` | config | Otillgänglig | valalternativ 0, 1, 2; flaggor 0; fält: `restored`, `options`, `supported_features` |
| WLED-Viljar2 Playlist | `select.wled_viljar2_playlist` | D123 | `wled` | normal | Otillgänglig | valalternativ ; flaggor 0; fält: `restored`, `options`, `supported_features` |
| WLED-Viljar2 Preset | `select.wled_viljar2_preset` | D123 | `wled` | normal | Otillgänglig | valalternativ Default; flaggor 0; fält: `restored`, `options`, `supported_features` |
| Sun | `sun.sun` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `next_dawn`, `next_dusk`, `next_midnight`, `next_noon`, `next_rising`, `next_setting`, `elevation`, `azimuth`, `rising` |
| Namn saknas | `timer.reset_easee_limit` | Ingen enhetsregisterkoppling | `timer` | normal | Rapporterar tillstånd | fält: `duration`, `editable`, `last_transition` |
| Home | `zone.home` | Ingen enhetsregisterkoppling | `Ej i entitetsregistret` | normal | Rapporterar tillstånd | fält: `latitude`, `longitude`, `radius`, `passive`, `persons`, `editable` |

#### Skarvkablar

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Shelly1PM_Skarvkabel_1 Restart | `button.shelly1pm_34945475b46d_restart` | D097 | `shelly` | config | Otillgänglig | klass restart; fält: `device_class` |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Matsal Shellydimmer2 Restart | `button.matsal_shellydimmer2_restart` | D071 | `shelly` | config | Okänd | klass restart; fält: `device_class` |

#### Viljars Rum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| WLED-Viljar1 Restart | `button.wled_viljar1_restart` | D122 | `wled` | config | Otillgänglig | klass restart; fält: `device_class` |
| Update | `button.wled_viljar1_update` | D122 | `wled` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WLED-Viljar1 Intensity | `number.wled_viljar1_intensity` | D122 | `wled` | config | Otillgänglig | intervall 0–255; steg 1; fält: `min`, `max`, `step`, `mode` |
| WLED-Viljar1 Speed | `number.wled_viljar1_speed` | D122 | `wled` | config | Otillgänglig | intervall 0–255; steg 1; fält: `min`, `max`, `step`, `mode` |
| WLED-Viljar1 Color palette | `select.wled_viljar1_color_palette` | D122 | `wled` | config | Otillgänglig | valalternativ * Color 1, * Color Gradient, * Colors 1&2, * Colors Only, * Random Cycle, Analogous, April Night, Aqua Flash, Atlantica, Aurora, Aurora 2, Autumn, Beach, Beech, Blink Red, Breeze, C9, C9 2, C9 New, Candy, Candy2, Cloud, Cyane, Default, Departure, Drywet, Fairy Reaf, Fire, Forest, Grintage, Hult, Hult 64, Icefire, Jul, Landscape, Lava, Light Pink, Lite Light, Magenta, Magred, Ocean, Orange & Teal, Orangery, Party, Pastel, Pink Candy, Rainbow, Rainbow Bands, Red & Blue, Red Flash, Red Reaf, Red Shift, Red Tide, Retro Clown, Rewhi, Rivendell, Sakura, Semi Blue, Sherbet, Splash, Sunset, Sunset 2, Temperature, Tertiary, Tiamat, Toxy Reaf, Vintage, Yelblu, Yelblu Hot, Yellowout, Yelmag; fält: `options` |
| WLED-Viljar1 Live override | `select.wled_viljar1_live_override` | D122 | `wled` | config | Otillgänglig | valalternativ 0, 1, 2; fält: `options` |
| WLED-Viljar1 Playlist | `select.wled_viljar1_playlist` | D122 | `wled` | normal | Otillgänglig | valalternativ ; fält: `options` |
| WLED-Viljar1 Preset | `select.wled_viljar1_preset` | D122 | `wled` | normal | Otillgänglig | valalternativ Standard ; fält: `options` |

### System, integrationer och diagnostik

#### Ej områdesplacerad

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| App inactive | `binary_sensor.carro_pixel_10_pro_app_inactive` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.carro_pixel_10_pro_bluetooth_state` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.carro_pixel_10_pro_device_locked` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.carro_pixel_10_pro_device_secure` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.carro_pixel_10_pro_doze_mode` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.carro_pixel_10_pro_high_accuracy_mode` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.carro_pixel_10_pro_hotspot_state` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.carro_pixel_10_pro_interactive` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.carro_pixel_10_pro_is_charging` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.carro_pixel_10_pro_keyguard_locked` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.carro_pixel_10_pro_keyguard_secure` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.carro_pixel_10_pro_mobile_data` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.carro_pixel_10_pro_mobile_data_roaming` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.carro_pixel_10_pro_nfc_state` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.carro_pixel_10_pro_power_save` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.carro_pixel_10_pro_wi_fi_state` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.clt_l29_app_inactive` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.clt_l29_bluetooth_state` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.clt_l29_device_locked` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.clt_l29_device_secure` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.clt_l29_doze_mode` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.clt_l29_high_accuracy_mode` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.clt_l29_hotspot_state` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.clt_l29_interactive` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.clt_l29_is_charging` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.clt_l29_keyguard_locked` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.clt_l29_keyguard_secure` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.clt_l29_mobile_data` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.clt_l29_mobile_data_roaming` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.clt_l29_nfc_state` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.clt_l29_power_save` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.clt_l29_wi_fi_state` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.emhass_running` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.eskils_pixel_7_pro_app_inactive` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.eskils_pixel_7_pro_bluetooth_state` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.eskils_pixel_7_pro_device_locked` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.eskils_pixel_7_pro_device_secure` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.eskils_pixel_7_pro_doze_mode` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.eskils_pixel_7_pro_high_accuracy_mode` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.eskils_pixel_7_pro_hotspot_state` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.eskils_pixel_7_pro_interactive` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.eskils_pixel_7_pro_is_charging` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.eskils_pixel_7_pro_keyguard_locked` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.eskils_pixel_7_pro_keyguard_secure` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.eskils_pixel_7_pro_mobile_data` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.eskils_pixel_7_pro_mobile_data_roaming` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.eskils_pixel_7_pro_nfc_state` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.eskils_pixel_7_pro_power_save` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.eskils_pixel_7_pro_wifi_state` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.esphome_running` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.esphome_update_available` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.glances_running` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.glances_update_available` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.grafana_running` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.grafana_update_available` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.ha_vibecode_agent_running` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.home_assistant_operating_system_running` | D053 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.home_assistant_operating_system_update_available` | D053 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.influxdb_running` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.influxdb_update_available` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.mariadb_running` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.mariadb_update_available` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.mosquitto_broker_running` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.mosquitto_broker_update_available` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.node_red_running` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.node_red_update_available` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.pixel_10_pro_app_inactive` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.pixel_10_pro_app_inactive_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.pixel_10_pro_bluetooth_state` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.pixel_10_pro_bluetooth_state_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.pixel_10_pro_device_locked` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.pixel_10_pro_device_locked_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.pixel_10_pro_device_secure` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.pixel_10_pro_device_secure_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.pixel_10_pro_doze_mode` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.pixel_10_pro_doze_mode_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.pixel_10_pro_high_accuracy_mode` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.pixel_10_pro_hotspot_state` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.pixel_10_pro_hotspot_state_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.pixel_10_pro_interactive` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.pixel_10_pro_interactive_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.pixel_10_pro_is_charging` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.pixel_10_pro_is_charging_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.pixel_10_pro_keyguard_locked` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.pixel_10_pro_keyguard_locked_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.pixel_10_pro_keyguard_secure` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.pixel_10_pro_keyguard_secure_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.pixel_10_pro_mobile_data` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.pixel_10_pro_mobile_data_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.pixel_10_pro_mobile_data_roaming` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.pixel_10_pro_mobile_data_roaming_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.pixel_10_pro_nfc_state` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.pixel_10_pro_nfc_state_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.pixel_10_pro_power_save` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.pixel_10_pro_power_save_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.pixel_10_pro_wi_fi_state` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.pixel_10_pro_wi_fi_state_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.plex_media_server_running` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.plex_media_server_update_available` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remote UI | `binary_sensor.remote_ui` | Ingen enhetsregisterkoppling | `cloud` | diagnostic | Otillgänglig | klass connectivity; läsa binärt tillstånd; flaggor 0; fält: `restored`, `device_class`, `supported_features` |
| Running | `binary_sensor.samba_share_running` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.samba_share_update_available` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Connected | `binary_sensor.sarimnerbackup_connected` | D094 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Connected | `binary_sensor.sarimnermedia_connected` | D095 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.ssh_web_terminal_running` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.ssh_web_terminal_update_available` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Running | `binary_sensor.studio_code_server_running` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Solar rising | `binary_sensor.sun_solar_rising` | D104 | `sun` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Updater | `binary_sensor.updater` | Ingen enhetsregisterkoppling | `updater` | normal | Otillgänglig | klass update; läsa binärt tillstånd; flaggor 0; fält: `restored`, `device_class`, `supported_features` |
| App inactive | `binary_sensor.viljars_pixel_10_pro_app_inactive` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.viljars_pixel_10_pro_bluetooth_state` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.viljars_pixel_10_pro_device_locked` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.viljars_pixel_10_pro_device_secure` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.viljars_pixel_10_pro_doze_mode` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.viljars_pixel_10_pro_high_accuracy_mode` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.viljars_pixel_10_pro_hotspot_state` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.viljars_pixel_10_pro_interactive` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.viljars_pixel_10_pro_is_charging` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.viljars_pixel_10_pro_keyguard_locked` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.viljars_pixel_10_pro_keyguard_secure` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.viljars_pixel_10_pro_mobile_data` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.viljars_pixel_10_pro_mobile_data_roaming` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.viljars_pixel_10_pro_nfc_state` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.viljars_pixel_10_pro_power_save` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.viljars_pixel_10_pro_wi_fi_state` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.viljars_pixel_7_pro_app_inactive` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.viljars_pixel_7_pro_bluetooth_state` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.viljars_pixel_7_pro_device_locked` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.viljars_pixel_7_pro_device_secure` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.viljars_pixel_7_pro_doze_mode` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy mode | `binary_sensor.viljars_pixel_7_pro_high_accuracy_mode` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hotspot state | `binary_sensor.viljars_pixel_7_pro_hotspot_state` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.viljars_pixel_7_pro_interactive` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.viljars_pixel_7_pro_is_charging` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.viljars_pixel_7_pro_keyguard_locked` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.viljars_pixel_7_pro_keyguard_secure` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.viljars_pixel_7_pro_mobile_data` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.viljars_pixel_7_pro_mobile_data_roaming` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.viljars_pixel_7_pro_nfc_state` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.viljars_pixel_7_pro_power_save` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.viljars_pixel_7_pro_wifi_state` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App inactive | `binary_sensor.viljars_pixel_watch_3_app_inactive` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bedtime mode | `binary_sensor.viljars_pixel_watch_3_bedtime_mode` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bluetooth state | `binary_sensor.viljars_pixel_watch_3_bluetooth_state` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device locked | `binary_sensor.viljars_pixel_watch_3_device_locked` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Device secure | `binary_sensor.viljars_pixel_watch_3_device_secure` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Doze mode | `binary_sensor.viljars_pixel_watch_3_doze_mode` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Interactive | `binary_sensor.viljars_pixel_watch_3_interactive` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Is charging | `binary_sensor.viljars_pixel_watch_3_is_charging` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard locked | `binary_sensor.viljars_pixel_watch_3_keyguard_locked` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Keyguard secure | `binary_sensor.viljars_pixel_watch_3_keyguard_secure` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data | `binary_sensor.viljars_pixel_watch_3_mobile_data` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile data roaming | `binary_sensor.viljars_pixel_watch_3_mobile_data_roaming` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| NFC state | `binary_sensor.viljars_pixel_watch_3_nfc_state` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| On body sensor | `binary_sensor.viljars_pixel_watch_3_on_body_sensor` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Power save | `binary_sensor.viljars_pixel_watch_3_power_save` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Theater mode | `binary_sensor.viljars_pixel_watch_3_theater_mode` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wet mode | `binary_sensor.viljars_pixel_watch_3_wet_mode` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi state | `binary_sensor.viljars_pixel_watch_3_wi_fi_state` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Update available | `binary_sensor.visual_studio_code_update_available` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Firmware | `binary_sensor.wled_viljar2_firmware` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Backup Automatic backup | `event.backup_automatic_backup` | D005 | `backup` | normal | Rapporterar tillstånd | fält: `event_types`, `event_type`, `backup_stage`, `failed_reason` |
| Backup Backup Manager state | `sensor.backup_backup_manager_state` | D005 | `backup` | normal | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Backup Last attempted automatic backup | `sensor.backup_last_attempted_automatic_backup` | D005 | `backup` | normal | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Backup Last successful automatic backup | `sensor.backup_last_successful_automatic_backup` | D005 | `backup` | normal | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Backup Next scheduled automatic backup | `sensor.backup_next_scheduled_automatic_backup` | D005 | `backup` | normal | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Accent color | `sensor.carro_pixel_10_pro_accent_color` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.carro_pixel_10_pro_active_calories_burned` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.carro_pixel_10_pro_app_importance` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.carro_pixel_10_pro_app_memory` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.carro_pixel_10_pro_app_rx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.carro_pixel_10_pro_app_standby_bucket` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.carro_pixel_10_pro_app_tx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Basal metabolic rate | `sensor.carro_pixel_10_pro_basal_metabolic_rate` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.carro_pixel_10_pro_battery_cycle_count` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.carro_pixel_10_pro_battery_health` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Carro Pixel 10 Pro Battery level | `sensor.carro_pixel_10_pro_battery_level` | D012 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.carro_pixel_10_pro_battery_power` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Carro Pixel 10 Pro Battery state | `sensor.carro_pixel_10_pro_battery_state` | D012 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.carro_pixel_10_pro_beacon_monitor` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.carro_pixel_10_pro_ble_transmitter` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Blood glucose | `sensor.carro_pixel_10_pro_blood_glucose` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body fat | `sensor.carro_pixel_10_pro_body_fat` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body water mass | `sensor.carro_pixel_10_pro_body_water_mass` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bone mass | `sensor.carro_pixel_10_pro_bone_mass` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.carro_pixel_10_pro_car_battery` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.carro_pixel_10_pro_car_ev_connector_type` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.carro_pixel_10_pro_car_fuel_type` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.carro_pixel_10_pro_car_range_remaining` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Carro Pixel 10 Pro Charger type | `sensor.carro_pixel_10_pro_charger_type` | D012 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.carro_pixel_10_pro_current_time_zone` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.carro_pixel_10_pro_current_version` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.carro_pixel_10_pro_daily_distance` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.carro_pixel_10_pro_daily_elevation_gained` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.carro_pixel_10_pro_daily_floors` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily hydration | `sensor.carro_pixel_10_pro_daily_hydration` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.carro_pixel_10_pro_daily_steps` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.carro_pixel_10_pro_data_network_type_sim_1` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.carro_pixel_10_pro_data_network_type_sim_2` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Diastolic blood pressure | `sensor.carro_pixel_10_pro_diastolic_blood_pressure` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.carro_pixel_10_pro_do_not_disturb_sensor` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.carro_pixel_10_pro_external_storage` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.carro_pixel_10_pro_heart_rate` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate variability | `sensor.carro_pixel_10_pro_heart_rate_variability` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Height | `sensor.carro_pixel_10_pro_height` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.carro_pixel_10_pro_high_accuracy_update_interval` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.carro_pixel_10_pro_internal_storage` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.carro_pixel_10_pro_ipv6_addresses` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.carro_pixel_10_pro_last_reboot` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.carro_pixel_10_pro_last_update_trigger` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Lean body mass | `sensor.carro_pixel_10_pro_lean_body_mass` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.carro_pixel_10_pro_mobile_rx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.carro_pixel_10_pro_mobile_tx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.carro_pixel_10_pro_network_type` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.carro_pixel_10_pro_os_version` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Oxygen saturation | `sensor.carro_pixel_10_pro_oxygen_saturation` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.carro_pixel_10_pro_proximity_sensor` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.carro_pixel_10_pro_public_ip_address` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.carro_pixel_10_pro_remaining_charge_time` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Respiratory rate | `sensor.carro_pixel_10_pro_respiratory_rate` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Resting heart rate | `sensor.carro_pixel_10_pro_resting_heart_rate` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.carro_pixel_10_pro_security_patch` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.carro_pixel_10_pro_signal_strength_sim_1` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.carro_pixel_10_pro_signal_strength_sim_2` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.carro_pixel_10_pro_sim_1` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.carro_pixel_10_pro_sim_2` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep duration | `sensor.carro_pixel_10_pro_sleep_duration` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Systolic blood pressure | `sensor.carro_pixel_10_pro_systolic_blood_pressure` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.carro_pixel_10_pro_total_calories_burned` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.carro_pixel_10_pro_total_rx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.carro_pixel_10_pro_total_tx_gb` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.carro_pixel_10_pro_vo2_max` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.carro_pixel_10_pro_volume_level_accessibility` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.carro_pixel_10_pro_volume_level_alarm` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.carro_pixel_10_pro_volume_level_call` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.carro_pixel_10_pro_volume_level_dtmf` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.carro_pixel_10_pro_volume_level_music` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.carro_pixel_10_pro_volume_level_notification` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.carro_pixel_10_pro_volume_level_ringer` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.carro_pixel_10_pro_volume_level_system` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weight | `sensor.carro_pixel_10_pro_weight` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.carro_pixel_10_pro_wi_fi_bssid` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.carro_pixel_10_pro_wi_fi_connection` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.carro_pixel_10_pro_wi_fi_frequency` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.carro_pixel_10_pro_wi_fi_ip_address` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.carro_pixel_10_pro_wi_fi_link_speed` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.carro_pixel_10_pro_wi_fi_signal_strength` | D012 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.clt_l29_app_importance` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.clt_l29_app_memory` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.clt_l29_app_rx_gb` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.clt_l29_app_standby_bucket` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.clt_l29_app_tx_gb` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.clt_l29_battery_health` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CLT-L29 Battery level | `sensor.clt_l29_battery_level` | D011 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.clt_l29_battery_power` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CLT-L29 Battery state | `sensor.clt_l29_battery_state` | D011 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.clt_l29_beacon_monitor` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.clt_l29_ble_transmitter` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.clt_l29_car_battery` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.clt_l29_car_ev_connector_type` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.clt_l29_car_fuel_type` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.clt_l29_car_range_remaining` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CLT-L29 Charger type | `sensor.clt_l29_charger_type` | D011 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.clt_l29_current_time_zone` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.clt_l29_current_version` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.clt_l29_do_not_disturb_sensor` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.clt_l29_external_storage` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.clt_l29_high_accuracy_update_interval` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.clt_l29_internal_storage` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.clt_l29_ipv6_addresses` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.clt_l29_last_reboot` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.clt_l29_last_update_trigger` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.clt_l29_network_type` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.clt_l29_os_version` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.clt_l29_proximity_sensor` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.clt_l29_public_ip_address` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.clt_l29_remaining_charge_time` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.clt_l29_security_patch` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.clt_l29_sim_1` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.clt_l29_sim_2` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.clt_l29_total_rx_gb` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.clt_l29_total_tx_gb` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.clt_l29_volume_level_accessibility` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.clt_l29_volume_level_alarm` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.clt_l29_volume_level_call` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.clt_l29_volume_level_dtmf` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.clt_l29_volume_level_music` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.clt_l29_volume_level_notification` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.clt_l29_volume_level_ringer` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.clt_l29_volume_level_system` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.clt_l29_wi_fi_bssid` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.clt_l29_wi_fi_connection` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.clt_l29_wi_fi_frequency` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.clt_l29_wi_fi_ip_address` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.clt_l29_wi_fi_link_speed` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.clt_l29_wi_fi_signal_strength` | D011 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.emhass_cpu_percent` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.emhass_memory_percent` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.emhass_newest_version` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.emhass_version` | D024 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Accent color | `sensor.eskils_pixel_7_pro_accent_color` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.eskils_pixel_7_pro_active_calories_burned` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.eskils_pixel_7_pro_app_importance` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.eskils_pixel_7_pro_app_memory` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.eskils_pixel_7_pro_app_rx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.eskils_pixel_7_pro_app_standby_bucket` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.eskils_pixel_7_pro_app_tx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.eskils_pixel_7_pro_battery_health` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Eskils Pixel 7 Pro Battery level | `sensor.eskils_pixel_7_pro_battery_level` | D034 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.eskils_pixel_7_pro_battery_power` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Eskils Pixel 7 Pro Battery state | `sensor.eskils_pixel_7_pro_battery_state` | D034 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.eskils_pixel_7_pro_beacon_monitor` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.eskils_pixel_7_pro_ble_transmitter` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.eskils_pixel_7_pro_car_battery` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.eskils_pixel_7_pro_car_ev_connector_type` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.eskils_pixel_7_pro_car_fuel_type` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.eskils_pixel_7_pro_car_range_remaining` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Eskils Pixel 7 Pro Charger type | `sensor.eskils_pixel_7_pro_charger_type` | D034 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.eskils_pixel_7_pro_current_time_zone` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.eskils_pixel_7_pro_current_version` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.eskils_pixel_7_pro_daily_distance` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.eskils_pixel_7_pro_daily_elevation_gained` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.eskils_pixel_7_pro_daily_floors` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.eskils_pixel_7_pro_daily_steps` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.eskils_pixel_7_pro_data_network_type_sim_1` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.eskils_pixel_7_pro_data_network_type_sim_2` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.eskils_pixel_7_pro_do_not_disturb_sensor` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.eskils_pixel_7_pro_external_storage` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.eskils_pixel_7_pro_high_accuracy_update_interval` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.eskils_pixel_7_pro_internal_storage` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.eskils_pixel_7_pro_ipv6_addresses` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.eskils_pixel_7_pro_last_reboot` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.eskils_pixel_7_pro_last_update_trigger` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.eskils_pixel_7_pro_mobile_rx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.eskils_pixel_7_pro_mobile_tx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.eskils_pixel_7_pro_network_type` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.eskils_pixel_7_pro_os_version` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.eskils_pixel_7_pro_proximity_sensor` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.eskils_pixel_7_pro_public_ip_address` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.eskils_pixel_7_pro_remaining_charge_time` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.eskils_pixel_7_pro_security_patch` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.eskils_pixel_7_pro_signal_strength_sim_1` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.eskils_pixel_7_pro_signal_strength_sim_2` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.eskils_pixel_7_pro_sim_1` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.eskils_pixel_7_pro_sim_2` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.eskils_pixel_7_pro_total_calories_burned` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.eskils_pixel_7_pro_total_rx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.eskils_pixel_7_pro_total_tx_gb` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.eskils_pixel_7_pro_vo2_max` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.eskils_pixel_7_pro_volume_level_accessibility` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.eskils_pixel_7_pro_volume_level_alarm` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.eskils_pixel_7_pro_volume_level_call` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.eskils_pixel_7_pro_volume_level_dtmf` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.eskils_pixel_7_pro_volume_level_music` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.eskils_pixel_7_pro_volume_level_notification` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.eskils_pixel_7_pro_volume_level_ringer` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.eskils_pixel_7_pro_volume_level_system` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.eskils_pixel_7_pro_wifi_bssid` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.eskils_pixel_7_pro_wifi_connection` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.eskils_pixel_7_pro_wifi_frequency` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.eskils_pixel_7_pro_wifi_ip_address` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.eskils_pixel_7_pro_wifi_link_speed` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.eskils_pixel_7_pro_wifi_signal_strength` | D034 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.esphome_cpu_percent` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.esphome_memory_percent` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.esphome_newest_version` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.esphome_version` | D025 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.glances_cpu_percent` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.glances_memory_percent` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.glances_newest_version` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.glances_version` | D041 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.grafana_cpu_percent` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.grafana_memory_percent` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.grafana_newest_version` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.grafana_version` | D044 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.ha_vibecode_agent_cpu_percent` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.ha_vibecode_agent_memory_percent` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.ha_vibecode_agent_newest_version` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.ha_vibecode_agent_version` | D045 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.home_assistant_core_cpu_percent` | D051 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.home_assistant_core_memory_percent` | D051 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| AppArmor version | `sensor.home_assistant_host_apparmor_version` | D052 | `hassio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Disk free | `sensor.home_assistant_host_disk_free` | D052 | `hassio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Disk total | `sensor.home_assistant_host_disk_total` | D052 | `hassio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Disk used | `sensor.home_assistant_host_disk_used` | D052 | `hassio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS Agent version | `sensor.home_assistant_host_os_agent_version` | D052 | `hassio` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.home_assistant_operating_system_newest_version` | D053 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.home_assistant_operating_system_version` | D053 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.home_assistant_supervisor_cpu_percent` | D054 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.home_assistant_supervisor_memory_percent` | D054 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Honshuset Hönshuset WiFi Signal Sensor | `sensor.honshuset_wifi_signal_sensor` | D055 | `esphome` | diagnostic | Rapporterar tillstånd | klass signal_strength; enhet dBm; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| CPU percent | `sensor.influxdb_cpu_percent` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.influxdb_memory_percent` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.influxdb_newest_version` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.influxdb_version` | D058 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| KNX Interface Connection established | `sensor.knx_interface_connection_established` | D059 | `knx` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| KNX Interface Connection type | `sensor.knx_interface_connection_type` | D059 | `knx` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| KNX Interface Incoming telegram errors | `sensor.knx_interface_incoming_telegram_errors` | D059 | `knx` | diagnostic | Rapporterar tillstånd | enhet errors; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement` |
| Incoming telegrams | `sensor.knx_interface_incoming_telegrams` | D059 | `knx` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| KNX Interface Individual address | `sensor.knx_interface_individual_address` | D059 | `knx` | diagnostic | Rapporterar tillstånd | läsa mätvärde |
| KNX Interface Outgoing telegram errors | `sensor.knx_interface_outgoing_telegram_errors` | D059 | `knx` | diagnostic | Rapporterar tillstånd | enhet errors; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement` |
| Outgoing telegrams | `sensor.knx_interface_outgoing_telegrams` | D059 | `knx` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| KNX Interface Telegrams | `sensor.knx_interface_telegrams` | D059 | `knx` | diagnostic | Rapporterar tillstånd | enhet telegrams; mätartyp total_increasing; läsa mätvärde; fält: `state_class`, `unit_of_measurement` |
| Undecodable Data Secure telegrams | `sensor.knx_interface_undecodable_data_secure_telegrams` | D059 | `knx` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.mariadb_cpu_percent` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.mariadb_memory_percent` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.mariadb_newest_version` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.mariadb_version` | D070 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.mosquitto_broker_cpu_percent` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.mosquitto_broker_memory_percent` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.mosquitto_broker_newest_version` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.mosquitto_broker_version` | D072 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.node_red_cpu_percent` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.node_red_memory_percent` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.node_red_newest_version` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.node_red_version` | D076 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee Connectivity | `sensor.philips_hue_zigbee_connectivity` | D079 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Accent color | `sensor.pixel_10_pro_accent_color` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Accent color | `sensor.pixel_10_pro_accent_color_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.pixel_10_pro_active_calories_burned` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.pixel_10_pro_active_calories_burned_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.pixel_10_pro_app_importance` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.pixel_10_pro_app_importance_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.pixel_10_pro_app_memory` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.pixel_10_pro_app_memory_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.pixel_10_pro_app_rx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.pixel_10_pro_app_rx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.pixel_10_pro_app_standby_bucket` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.pixel_10_pro_app_standby_bucket_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.pixel_10_pro_app_tx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.pixel_10_pro_app_tx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Basal metabolic rate | `sensor.pixel_10_pro_basal_metabolic_rate` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Basal metabolic rate | `sensor.pixel_10_pro_basal_metabolic_rate_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.pixel_10_pro_battery_cycle_count` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.pixel_10_pro_battery_cycle_count_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.pixel_10_pro_battery_health` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.pixel_10_pro_battery_health_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pixel 10 Pro Battery level | `sensor.pixel_10_pro_battery_level` | D080 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Pixel 10 Pro Battery level | `sensor.pixel_10_pro_battery_level_2` | D081 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.pixel_10_pro_battery_power` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery power | `sensor.pixel_10_pro_battery_power_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pixel 10 Pro Battery state | `sensor.pixel_10_pro_battery_state` | D080 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Pixel 10 Pro Battery state | `sensor.pixel_10_pro_battery_state_2` | D081 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.pixel_10_pro_beacon_monitor` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Beacon monitor | `sensor.pixel_10_pro_beacon_monitor_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.pixel_10_pro_ble_transmitter` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.pixel_10_pro_ble_transmitter_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Blood glucose | `sensor.pixel_10_pro_blood_glucose` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Blood glucose | `sensor.pixel_10_pro_blood_glucose_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body fat | `sensor.pixel_10_pro_body_fat` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body fat | `sensor.pixel_10_pro_body_fat_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body water mass | `sensor.pixel_10_pro_body_water_mass` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body water mass | `sensor.pixel_10_pro_body_water_mass_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bone mass | `sensor.pixel_10_pro_bone_mass` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Bone mass | `sensor.pixel_10_pro_bone_mass_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.pixel_10_pro_car_battery` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.pixel_10_pro_car_battery_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.pixel_10_pro_car_ev_connector_type` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.pixel_10_pro_car_ev_connector_type_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.pixel_10_pro_car_fuel_type` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.pixel_10_pro_car_fuel_type_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.pixel_10_pro_car_range_remaining` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.pixel_10_pro_car_range_remaining_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Pixel 10 Pro Charger type | `sensor.pixel_10_pro_charger_type` | D080 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Pixel 10 Pro Charger type | `sensor.pixel_10_pro_charger_type_2` | D081 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.pixel_10_pro_current_time_zone` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current time zone | `sensor.pixel_10_pro_current_time_zone_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.pixel_10_pro_current_version` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.pixel_10_pro_current_version_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.pixel_10_pro_daily_distance` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.pixel_10_pro_daily_distance_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.pixel_10_pro_daily_elevation_gained` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.pixel_10_pro_daily_elevation_gained_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.pixel_10_pro_daily_floors` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.pixel_10_pro_daily_floors_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily hydration | `sensor.pixel_10_pro_daily_hydration` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily hydration | `sensor.pixel_10_pro_daily_hydration_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.pixel_10_pro_daily_steps` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.pixel_10_pro_daily_steps_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.pixel_10_pro_data_network_type_sim_1` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.pixel_10_pro_data_network_type_sim_1_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.pixel_10_pro_data_network_type_sim_2` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.pixel_10_pro_data_network_type_sim_2_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Diastolic blood pressure | `sensor.pixel_10_pro_diastolic_blood_pressure` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Diastolic blood pressure | `sensor.pixel_10_pro_diastolic_blood_pressure_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.pixel_10_pro_do_not_disturb_sensor` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.pixel_10_pro_do_not_disturb_sensor_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.pixel_10_pro_external_storage` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.pixel_10_pro_external_storage_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.pixel_10_pro_heart_rate` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.pixel_10_pro_heart_rate_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate variability | `sensor.pixel_10_pro_heart_rate_variability` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate variability | `sensor.pixel_10_pro_heart_rate_variability_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Height | `sensor.pixel_10_pro_height` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Height | `sensor.pixel_10_pro_height_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.pixel_10_pro_high_accuracy_update_interval` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.pixel_10_pro_internal_storage` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.pixel_10_pro_internal_storage_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.pixel_10_pro_ipv6_addresses` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.pixel_10_pro_ipv6_addresses_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.pixel_10_pro_last_reboot` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.pixel_10_pro_last_reboot_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.pixel_10_pro_last_update_trigger` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Lean body mass | `sensor.pixel_10_pro_lean_body_mass` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Lean body mass | `sensor.pixel_10_pro_lean_body_mass_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.pixel_10_pro_mobile_rx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.pixel_10_pro_mobile_rx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.pixel_10_pro_mobile_tx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.pixel_10_pro_mobile_tx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.pixel_10_pro_network_type` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.pixel_10_pro_network_type_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.pixel_10_pro_os_version` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.pixel_10_pro_os_version_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Oxygen saturation | `sensor.pixel_10_pro_oxygen_saturation` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Oxygen saturation | `sensor.pixel_10_pro_oxygen_saturation_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.pixel_10_pro_proximity_sensor` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.pixel_10_pro_proximity_sensor_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.pixel_10_pro_public_ip_address` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.pixel_10_pro_public_ip_address_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.pixel_10_pro_remaining_charge_time` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.pixel_10_pro_remaining_charge_time_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Respiratory rate | `sensor.pixel_10_pro_respiratory_rate` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Respiratory rate | `sensor.pixel_10_pro_respiratory_rate_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Resting heart rate | `sensor.pixel_10_pro_resting_heart_rate` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Resting heart rate | `sensor.pixel_10_pro_resting_heart_rate_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.pixel_10_pro_security_patch` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.pixel_10_pro_security_patch_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.pixel_10_pro_signal_strength_sim_1` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.pixel_10_pro_signal_strength_sim_1_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.pixel_10_pro_signal_strength_sim_2` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.pixel_10_pro_signal_strength_sim_2_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.pixel_10_pro_sim_1` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.pixel_10_pro_sim_1_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.pixel_10_pro_sim_2` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.pixel_10_pro_sim_2_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep duration | `sensor.pixel_10_pro_sleep_duration` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep duration | `sensor.pixel_10_pro_sleep_duration_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Systolic blood pressure | `sensor.pixel_10_pro_systolic_blood_pressure` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Systolic blood pressure | `sensor.pixel_10_pro_systolic_blood_pressure_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.pixel_10_pro_total_calories_burned` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.pixel_10_pro_total_calories_burned_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.pixel_10_pro_total_rx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.pixel_10_pro_total_rx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.pixel_10_pro_total_tx_gb` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.pixel_10_pro_total_tx_gb_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.pixel_10_pro_vo2_max` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.pixel_10_pro_vo2_max_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.pixel_10_pro_volume_level_accessibility` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.pixel_10_pro_volume_level_accessibility_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.pixel_10_pro_volume_level_alarm` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.pixel_10_pro_volume_level_alarm_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.pixel_10_pro_volume_level_call` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.pixel_10_pro_volume_level_call_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.pixel_10_pro_volume_level_dtmf` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.pixel_10_pro_volume_level_dtmf_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.pixel_10_pro_volume_level_music` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.pixel_10_pro_volume_level_music_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.pixel_10_pro_volume_level_notification` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.pixel_10_pro_volume_level_notification_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.pixel_10_pro_volume_level_ringer` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.pixel_10_pro_volume_level_ringer_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.pixel_10_pro_volume_level_system` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.pixel_10_pro_volume_level_system_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weight | `sensor.pixel_10_pro_weight` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weight | `sensor.pixel_10_pro_weight_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.pixel_10_pro_wi_fi_bssid` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.pixel_10_pro_wi_fi_bssid_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.pixel_10_pro_wi_fi_connection` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.pixel_10_pro_wi_fi_connection_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.pixel_10_pro_wi_fi_frequency` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.pixel_10_pro_wi_fi_frequency_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.pixel_10_pro_wi_fi_ip_address` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.pixel_10_pro_wi_fi_ip_address_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.pixel_10_pro_wi_fi_link_speed` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.pixel_10_pro_wi_fi_link_speed_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.pixel_10_pro_wi_fi_signal_strength` | D080 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.pixel_10_pro_wi_fi_signal_strength_2` | D081 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.plex_media_server_cpu_percent` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.plex_media_server_memory_percent` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.plex_media_server_newest_version` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.plex_media_server_version` | D082 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.samba_share_cpu_percent` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.samba_share_memory_percent` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.samba_share_newest_version` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.samba_share_version` | D092 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.ssh_web_terminal_cpu_percent` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.ssh_web_terminal_memory_percent` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.ssh_web_terminal_newest_version` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.ssh_web_terminal_version` | D001 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| CPU percent | `sensor.studio_code_server_cpu_percent` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Memory percent | `sensor.studio_code_server_memory_percent` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sun Next dawn | `sensor.sun_next_dawn` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Sun Next dusk | `sensor.sun_next_dusk` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Sun Next midnight | `sensor.sun_next_midnight` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Sun Next noon | `sensor.sun_next_noon` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Sun Next rising | `sensor.sun_next_rising` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Sun Next setting | `sensor.sun_next_setting` | D104 | `sun` | diagnostic | Rapporterar tillstånd | klass timestamp; läsa mätvärde; fält: `device_class` |
| Solar azimuth | `sensor.sun_solar_azimuth` | D104 | `sun` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Solar elevation | `sensor.sun_solar_elevation` | D104 | `sun` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Honshuset Hönshuset WiFi Signal Sensor | `sensor.test2_wifi_signal_sensor_2` | D055 | `esphome` | diagnostic | Otillgänglig | klass signal_strength; enhet dBm; mätartyp measurement; läsa mätvärde; flaggor 0; fält: `restored`, `state_class`, `device_class`, `supported_features`, `unit_of_measurement` |
| Accent color | `sensor.viljars_pixel_10_pro_accent_color` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.viljars_pixel_10_pro_active_calories_burned` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.viljars_pixel_10_pro_app_importance` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.viljars_pixel_10_pro_app_memory` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.viljars_pixel_10_pro_app_rx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.viljars_pixel_10_pro_app_standby_bucket` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.viljars_pixel_10_pro_app_tx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.viljars_pixel_10_pro_battery_cycle_count` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.viljars_pixel_10_pro_battery_health` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 10 Pro Battery level | `sensor.viljars_pixel_10_pro_battery_level` | D112 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.viljars_pixel_10_pro_battery_power` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 10 Pro Battery state | `sensor.viljars_pixel_10_pro_battery_state` | D112 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.viljars_pixel_10_pro_beacon_monitor` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.viljars_pixel_10_pro_ble_transmitter` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Blood glucose | `sensor.viljars_pixel_10_pro_blood_glucose` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body fat | `sensor.viljars_pixel_10_pro_body_fat` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.viljars_pixel_10_pro_car_battery` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.viljars_pixel_10_pro_car_ev_connector_type` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.viljars_pixel_10_pro_car_fuel_type` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.viljars_pixel_10_pro_car_range_remaining` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 10 Pro Charger type | `sensor.viljars_pixel_10_pro_charger_type` | D112 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.viljars_pixel_10_pro_current_time_zone` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.viljars_pixel_10_pro_current_version` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.viljars_pixel_10_pro_daily_distance` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.viljars_pixel_10_pro_daily_elevation_gained` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.viljars_pixel_10_pro_daily_floors` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.viljars_pixel_10_pro_daily_steps` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.viljars_pixel_10_pro_data_network_type_sim_1` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.viljars_pixel_10_pro_data_network_type_sim_2` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Diastolic blood pressure | `sensor.viljars_pixel_10_pro_diastolic_blood_pressure` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.viljars_pixel_10_pro_do_not_disturb_sensor` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.viljars_pixel_10_pro_external_storage` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.viljars_pixel_10_pro_heart_rate` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate variability | `sensor.viljars_pixel_10_pro_heart_rate_variability` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.viljars_pixel_10_pro_high_accuracy_update_interval` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.viljars_pixel_10_pro_internal_storage` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.viljars_pixel_10_pro_ipv6_addresses` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.viljars_pixel_10_pro_last_reboot` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.viljars_pixel_10_pro_last_update_trigger` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.viljars_pixel_10_pro_mobile_rx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.viljars_pixel_10_pro_mobile_tx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.viljars_pixel_10_pro_network_type` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.viljars_pixel_10_pro_os_version` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Oxygen saturation | `sensor.viljars_pixel_10_pro_oxygen_saturation` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.viljars_pixel_10_pro_proximity_sensor` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.viljars_pixel_10_pro_public_ip_address` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.viljars_pixel_10_pro_remaining_charge_time` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Respiratory rate | `sensor.viljars_pixel_10_pro_respiratory_rate` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Resting heart rate | `sensor.viljars_pixel_10_pro_resting_heart_rate` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.viljars_pixel_10_pro_security_patch` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.viljars_pixel_10_pro_signal_strength_sim_1` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.viljars_pixel_10_pro_signal_strength_sim_2` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.viljars_pixel_10_pro_sim_1` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.viljars_pixel_10_pro_sim_2` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep duration | `sensor.viljars_pixel_10_pro_sleep_duration` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Systolic blood pressure | `sensor.viljars_pixel_10_pro_systolic_blood_pressure` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.viljars_pixel_10_pro_total_calories_burned` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.viljars_pixel_10_pro_total_rx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.viljars_pixel_10_pro_total_tx_gb` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.viljars_pixel_10_pro_vo2_max` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.viljars_pixel_10_pro_volume_level_accessibility` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.viljars_pixel_10_pro_volume_level_alarm` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.viljars_pixel_10_pro_volume_level_call` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.viljars_pixel_10_pro_volume_level_dtmf` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.viljars_pixel_10_pro_volume_level_music` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.viljars_pixel_10_pro_volume_level_notification` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.viljars_pixel_10_pro_volume_level_ringer` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.viljars_pixel_10_pro_volume_level_system` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weight | `sensor.viljars_pixel_10_pro_weight` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.viljars_pixel_10_pro_wi_fi_bssid` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.viljars_pixel_10_pro_wi_fi_connection` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.viljars_pixel_10_pro_wi_fi_frequency` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.viljars_pixel_10_pro_wi_fi_ip_address` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.viljars_pixel_10_pro_wi_fi_link_speed` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.viljars_pixel_10_pro_wi_fi_signal_strength` | D112 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Accent color | `sensor.viljars_pixel_7_pro_accent_color` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Active calories burned | `sensor.viljars_pixel_7_pro_active_calories_burned` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.viljars_pixel_7_pro_app_importance` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.viljars_pixel_7_pro_app_memory` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.viljars_pixel_7_pro_app_rx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.viljars_pixel_7_pro_app_standby_bucket` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.viljars_pixel_7_pro_app_tx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.viljars_pixel_7_pro_battery_cycle_count` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.viljars_pixel_7_pro_battery_health` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 7 Pro Battery level | `sensor.viljars_pixel_7_pro_battery_level` | D113 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.viljars_pixel_7_pro_battery_power` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 7 Pro Battery state | `sensor.viljars_pixel_7_pro_battery_state` | D113 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.viljars_pixel_7_pro_beacon_monitor` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.viljars_pixel_7_pro_ble_transmitter` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Blood glucose | `sensor.viljars_pixel_7_pro_blood_glucose` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Body fat | `sensor.viljars_pixel_7_pro_body_fat` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car battery | `sensor.viljars_pixel_7_pro_car_battery` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car EV connector type | `sensor.viljars_pixel_7_pro_car_ev_connector_type` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car fuel type | `sensor.viljars_pixel_7_pro_car_fuel_type` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Car range remaining | `sensor.viljars_pixel_7_pro_car_range_remaining` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel 7 Pro Charger type | `sensor.viljars_pixel_7_pro_charger_type` | D113 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.viljars_pixel_7_pro_current_time_zone` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.viljars_pixel_7_pro_current_version` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.viljars_pixel_7_pro_daily_distance` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily elevation gained | `sensor.viljars_pixel_7_pro_daily_elevation_gained` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.viljars_pixel_7_pro_daily_floors` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.viljars_pixel_7_pro_daily_steps` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.viljars_pixel_7_pro_data_network_type_sim_1` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.viljars_pixel_7_pro_data_network_type_sim_2` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Diastolic blood pressure | `sensor.viljars_pixel_7_pro_diastolic_blood_pressure` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.viljars_pixel_7_pro_do_not_disturb_sensor` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.viljars_pixel_7_pro_external_storage` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate | `sensor.viljars_pixel_7_pro_heart_rate` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Heart rate variability | `sensor.viljars_pixel_7_pro_heart_rate_variability` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| High accuracy update interval | `sensor.viljars_pixel_7_pro_high_accuracy_update_interval` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.viljars_pixel_7_pro_internal_storage` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.viljars_pixel_7_pro_ipv6_addresses` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.viljars_pixel_7_pro_last_reboot` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.viljars_pixel_7_pro_last_update_trigger` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.viljars_pixel_7_pro_mobile_rx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.viljars_pixel_7_pro_mobile_tx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.viljars_pixel_7_pro_network_type` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.viljars_pixel_7_pro_os_version` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Oxygen saturation | `sensor.viljars_pixel_7_pro_oxygen_saturation` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Proximity sensor | `sensor.viljars_pixel_7_pro_proximity_sensor` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.viljars_pixel_7_pro_public_ip_address` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.viljars_pixel_7_pro_remaining_charge_time` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Respiratory rate | `sensor.viljars_pixel_7_pro_respiratory_rate` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Resting heart rate | `sensor.viljars_pixel_7_pro_resting_heart_rate` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.viljars_pixel_7_pro_security_patch` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.viljars_pixel_7_pro_signal_strength_sim_1` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.viljars_pixel_7_pro_signal_strength_sim_2` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.viljars_pixel_7_pro_sim_1` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.viljars_pixel_7_pro_sim_2` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Sleep duration | `sensor.viljars_pixel_7_pro_sleep_duration` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Systolic blood pressure | `sensor.viljars_pixel_7_pro_systolic_blood_pressure` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total calories burned | `sensor.viljars_pixel_7_pro_total_calories_burned` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.viljars_pixel_7_pro_total_rx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.viljars_pixel_7_pro_total_tx_gb` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| VO2 max | `sensor.viljars_pixel_7_pro_vo2_max` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.viljars_pixel_7_pro_volume_level_accessibility` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.viljars_pixel_7_pro_volume_level_alarm` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.viljars_pixel_7_pro_volume_level_call` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.viljars_pixel_7_pro_volume_level_dtmf` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.viljars_pixel_7_pro_volume_level_music` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.viljars_pixel_7_pro_volume_level_notification` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.viljars_pixel_7_pro_volume_level_ringer` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.viljars_pixel_7_pro_volume_level_system` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Weight | `sensor.viljars_pixel_7_pro_weight` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.viljars_pixel_7_pro_wifi_bssid` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.viljars_pixel_7_pro_wifi_connection` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.viljars_pixel_7_pro_wifi_frequency` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.viljars_pixel_7_pro_wifi_ip_address` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.viljars_pixel_7_pro_wifi_link_speed` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.viljars_pixel_7_pro_wifi_signal_strength` | D113 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Activity state | `sensor.viljars_pixel_watch_3_activity_state` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App importance | `sensor.viljars_pixel_watch_3_app_importance` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App memory | `sensor.viljars_pixel_watch_3_app_memory` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Rx GB | `sensor.viljars_pixel_watch_3_app_rx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App standby bucket | `sensor.viljars_pixel_watch_3_app_standby_bucket` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| App Tx GB | `sensor.viljars_pixel_watch_3_app_tx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery cycle count | `sensor.viljars_pixel_watch_3_battery_cycle_count` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Battery health | `sensor.viljars_pixel_watch_3_battery_health` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel Watch 3 Battery level | `sensor.viljars_pixel_watch_3_battery_level` | D114 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `unit_of_measurement`, `device_class` |
| Battery power | `sensor.viljars_pixel_watch_3_battery_power` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel Watch 3 Battery state | `sensor.viljars_pixel_watch_3_battery_state` | D114 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Beacon monitor | `sensor.viljars_pixel_watch_3_beacon_monitor` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| BLE transmitter | `sensor.viljars_pixel_watch_3_ble_transmitter` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Viljars Pixel Watch 3 Charger type | `sensor.viljars_pixel_watch_3_charger_type` | D114 | `mobile_app` | diagnostic | Rapporterar tillstånd | klass enum; läsa mätvärde; fält: `options`, `device_class` |
| Current time zone | `sensor.viljars_pixel_watch_3_current_time_zone` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Current version | `sensor.viljars_pixel_watch_3_current_version` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily calories | `sensor.viljars_pixel_watch_3_daily_calories` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily distance | `sensor.viljars_pixel_watch_3_daily_distance` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily floors | `sensor.viljars_pixel_watch_3_daily_floors` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Daily steps | `sensor.viljars_pixel_watch_3_daily_steps` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 1) | `sensor.viljars_pixel_watch_3_data_network_type_sim_1` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Data network type (SIM 2) | `sensor.viljars_pixel_watch_3_data_network_type_sim_2` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Do Not Disturb sensor | `sensor.viljars_pixel_watch_3_do_not_disturb_sensor` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| External storage | `sensor.viljars_pixel_watch_3_external_storage` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Internal storage | `sensor.viljars_pixel_watch_3_internal_storage` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| IPv6 addresses | `sensor.viljars_pixel_watch_3_ipv6_addresses` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last reboot | `sensor.viljars_pixel_watch_3_last_reboot` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Last update trigger | `sensor.viljars_pixel_watch_3_last_update_trigger` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Rx GB | `sensor.viljars_pixel_watch_3_mobile_rx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Mobile Tx GB | `sensor.viljars_pixel_watch_3_mobile_tx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Network type | `sensor.viljars_pixel_watch_3_network_type` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| OS version | `sensor.viljars_pixel_watch_3_os_version` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Public IP address | `sensor.viljars_pixel_watch_3_public_ip_address` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Remaining charge time | `sensor.viljars_pixel_watch_3_remaining_charge_time` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Security patch | `sensor.viljars_pixel_watch_3_security_patch` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 1) | `sensor.viljars_pixel_watch_3_signal_strength_sim_1` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength (SIM 2) | `sensor.viljars_pixel_watch_3_signal_strength_sim_2` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 1 | `sensor.viljars_pixel_watch_3_sim_1` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| SIM 2 | `sensor.viljars_pixel_watch_3_sim_2` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Rx GB | `sensor.viljars_pixel_watch_3_total_rx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Total Tx GB | `sensor.viljars_pixel_watch_3_total_tx_gb` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level accessibility | `sensor.viljars_pixel_watch_3_volume_level_accessibility` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level alarm | `sensor.viljars_pixel_watch_3_volume_level_alarm` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level call | `sensor.viljars_pixel_watch_3_volume_level_call` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level DTMF | `sensor.viljars_pixel_watch_3_volume_level_dtmf` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level music | `sensor.viljars_pixel_watch_3_volume_level_music` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level notification | `sensor.viljars_pixel_watch_3_volume_level_notification` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level ringer | `sensor.viljars_pixel_watch_3_volume_level_ringer` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Volume level system | `sensor.viljars_pixel_watch_3_volume_level_system` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.viljars_pixel_watch_3_wi_fi_bssid` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi connection | `sensor.viljars_pixel_watch_3_wi_fi_connection` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi frequency | `sensor.viljars_pixel_watch_3_wi_fi_frequency` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi IP address | `sensor.viljars_pixel_watch_3_wi_fi_ip_address` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi link speed | `sensor.viljars_pixel_watch_3_wi_fi_link_speed` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal strength | `sensor.viljars_pixel_watch_3_wi_fi_signal_strength` | D114 | `mobile_app` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Newest version | `sensor.visual_studio_code_newest_version` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Version | `sensor.visual_studio_code_version` | D103 | `hassio` | normal | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Free memory | `sensor.wled_viljar2_free_memory` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WLED-Viljar2 IP | `sensor.wled_viljar2_ip` | D123 | `wled` | diagnostic | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| WLED-Viljar2 LED count | `sensor.wled_viljar2_led_count` | D123 | `wled` | diagnostic | Otillgänglig | läsa mätvärde; flaggor 0; fält: `restored`, `supported_features` |
| Uptime | `sensor.wled_viljar2_uptime` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.wled_viljar2_wi_fi_bssid` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi channel | `sensor.wled_viljar2_wi_fi_channel` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi RSSI | `sensor.wled_viljar2_wi_fi_rssi` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal | `sensor.wled_viljar2_wi_fi_signal` | D123 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| apexcharts-card Update | `update.apexcharts_card_update` | D127 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| button-card Update | `update.button_card_update` | D129 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Charger Card Update | `update.charger_card_update` | D014 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Easee EV Charger Update | `update.easee_ev_charger_update` | D027 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| EMHASS Update | `update.emhass_update` | D024 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Energy Sankey Card Update | `update.energy_sankey_card_update` | D030 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| ESPHome Device Builder Update | `update.esphome_update` | D025 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Ferroamp Sensors Update | `update.ferroamp_sensors_update` | D037 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Glances Update | `update.glances_update` | D041 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Grafana Update | `update.grafana_update` | D044 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| HA Vibecode Agent Update | `update.ha_vibecode_agent_update` | D045 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| HACS Update | `update.hacs_update` | D046 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Home Assistant Core Update | `update.home_assistant_core_update` | D051 | `hassio` | config | Rapporterar tillstånd | flaggor 15; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Home Assistant Operating System Update | `update.home_assistant_operating_system_update` | D053 | `hassio` | config | Rapporterar tillstånd | flaggor 27; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Home Assistant Supervisor Update | `update.home_assistant_supervisor_update` | D054 | `hassio` | config | Rapporterar tillstånd | flaggor 5; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Honshuset Firmware | `update.honshuset_firmware` | D055 | `esphome` | config | Rapporterar tillstånd | klass firmware; flaggor 1; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `device_class`, `supported_features` |
| InfluxDB Update | `update.influxdb_update` | D058 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| MariaDB Update | `update.mariadb_update` | D070 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Mosquitto broker Update | `update.mosquitto_broker_update` | D072 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Node-RED Companion Update | `update.node_red_companion_update` | D077 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Node-RED Update | `update.node_red_update` | D076 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Plex Media Server Update | `update.plex_media_server_update` | D082 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Power Flow Card Plus Update | `update.power_flow_card_plus_update` | D084 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Power Saver Update | `update.power_saver_update` | D085 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Robonect Update | `update.robonect_update` | D086 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Samba share Update | `update.samba_share_update` | D092 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Sankey Chart Card Update | `update.sankey_chart_card_update` | D093 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Simple Vacuum Card Update | `update.simple_vacuum_card_update` | D098 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| SoundTouchPlus Update | `update.soundtouchplus_update` | D099 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Advanced SSH & Web Terminal Update | `update.ssh_web_terminal_update` | D001 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Studio Code Server Update | `update.studio_code_server_update` | D103 | `hassio` | config | Rapporterar tillstånd | flaggor 29; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Volkswagen Connect Update | `update.volkswagen_connect_update` | D119 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| Watchman Update | `update.watchman_update` | D124 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |
| WLED-Viljar2 Firmware | `update.wled_viljar2_firmware` | D123 | `wled` | config | Otillgänglig | klass firmware; flaggor 3; fält: `restored`, `device_class`, `supported_features` |
| Xiaomi Vacuum Map Card Update | `update.xiaomi_vacuum_map_card_update` | D125 | `hacs` | config | Rapporterar tillstånd | flaggor 23; fält: `auto_update`, `display_precision`, `installed_version`, `in_progress`, `latest_version`, `release_summary`, `skipped_version`, `title`, `update_percentage`, `supported_features` |

#### Festen

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Zigbee connectivity | `sensor.hue_color_lamp_2_zigbee_connectivity` | D063 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Halloween hue

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Zigbee connectivity | `sensor.halloween_zigbee_connectivity` | D050 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Hue dimmer switch 1 Battery | `sensor.hue_dimmer_switch_1_battery` | D057 | `hue` | diagnostic | Rapporterar tillstånd | klass battery; enhet %; mätartyp measurement; läsa mätvärde; fält: `state_class`, `battery_state`, `unit_of_measurement`, `device_class` |
| Zigbee connectivity | `sensor.hue_dimmer_switch_1_zigbee_connectivity` | D057 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.hue_smart_plug_1_zigbee_connectivity` | D056 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_2_zigbee_connectivity` | D060 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_3_zigbee_connectivity` | D061 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_5_zigbee_connectivity` | D062 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_7_zigbee_connectivity` | D064 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_8_zigbee_connectivity` | D065 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Zigbee connectivity | `sensor.lampa_9_zigbee_connectivity` | D066 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Lampor

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Zigbee connectivity | `sensor.hue_color_lamp_1_zigbee_connectivity` | D107 | `hue` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Skarvkablar

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Cloud | `binary_sensor.shelly1pm_34945475b46d_cloud` | D097 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Shelly1PM_Skarvkabel_1 Overheating | `binary_sensor.shelly1pm_34945475b46d_overheating` | D097 | `shelly` | diagnostic | Otillgänglig | klass problem; läsa binärt tillstånd; fält: `device_class` |
| Shelly1PM_Skarvkabel_1 Overpowering | `binary_sensor.shelly1pm_34945475b46d_overpowering` | D097 | `shelly` | diagnostic | Otillgänglig | klass problem; läsa binärt tillstånd; fält: `device_class` |
| Uptime | `sensor.shelly1pm_34945475b46d_last_restart` | D097 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength | `sensor.shelly1pm_34945475b46d_signal_strength` | D097 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Beta firmware | `update.shelly1pm_34945475b46d_beta_firmware` | D097 | `shelly` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Firmware | `update.shelly1pm_34945475b46d_firmware` | D097 | `shelly` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Vardagsrum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Matsal Shellydimmer2 Overheating | `binary_sensor.matsal_shellydimmer2_overheating` | D071 | `shelly` | diagnostic | Rapporterar tillstånd | klass problem; läsa binärt tillstånd; fält: `device_class` |
| Matsal Shellydimmer2 Overpowering | `binary_sensor.matsal_shellydimmer2_overpowering` | D071 | `shelly` | diagnostic | Rapporterar tillstånd | klass problem; läsa binärt tillstånd; fält: `device_class` |
| Cloud | `binary_sensor.shellydimmer2_34945474145a_cloud` | D071 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Uptime | `sensor.shellydimmer2_34945474145a_last_restart` | D071 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Signal strength | `sensor.shellydimmer2_34945474145a_signal_strength` | D071 | `shelly` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Beta firmware | `update.shellydimmer2_34945474145a_beta_firmware` | D071 | `shelly` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Firmware | `update.shellydimmer2_34945474145a_firmware` | D071 | `shelly` | config | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |

#### Viljars Rum

| Namn | entity_id | Enhet | Integration | HA-kategori | Tillgänglighet | Information och annonserat stöd |
| --- | --- | --- | --- | --- | --- | --- |
| Firmware | `binary_sensor.wled_viljar1_firmware` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Free memory | `sensor.wled_viljar1_free_memory` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WLED-Viljar1 IP | `sensor.wled_viljar1_ip` | D122 | `wled` | diagnostic | Otillgänglig | läsa mätvärde |
| WLED-Viljar1 LED count | `sensor.wled_viljar1_led_count` | D122 | `wled` | diagnostic | Otillgänglig | enhet LEDs; läsa mätvärde; fält: `unit_of_measurement` |
| Uptime | `sensor.wled_viljar1_uptime` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi BSSID | `sensor.wled_viljar1_wi_fi_bssid` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi channel | `sensor.wled_viljar1_wi_fi_channel` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi RSSI | `sensor.wled_viljar1_wi_fi_rssi` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| Wi-Fi signal | `sensor.wled_viljar1_wi_fi_signal` | D122 | `wled` | diagnostic | Avaktiverad | Endast registermetadata; mätvärden och funktionsstöd kan inte verifieras |
| WLED-Viljar1 Firmware | `update.wled_viljar1_firmware` | D122 | `wled` | config | Otillgänglig | klass firmware; flaggor 3; fält: `device_class`, `supported_features` |

## Registrerade funktionsingångar – tjänstekatalog

Detta är en läst katalog från GET `/api/services`. **Ingen tjänst har anropats.** Domäntjänster kan finnas utan kompatibel entitet; målval och entitetens annonserade stöd måste valideras före eventuell framtida implementation. Parameternamn visas, men inte standardvärden, privata texter eller länkar.

### ai_task

| Tjänst/funktion | Parametrar |
| --- | --- |
| `ai_task.generate_data` | `attachments`, `entity_id`, `instructions`, `structure`, `task_name` |
| `ai_task.generate_image` | `attachments`, `entity_id`, `instructions`, `task_name` |

### alarm_control_panel

| Tjänst/funktion | Parametrar |
| --- | --- |
| `alarm_control_panel.alarm_arm_away` | `code` |
| `alarm_control_panel.alarm_arm_custom_bypass` | `code` |
| `alarm_control_panel.alarm_arm_home` | `code` |
| `alarm_control_panel.alarm_arm_night` | `code` |
| `alarm_control_panel.alarm_arm_vacation` | `code` |
| `alarm_control_panel.alarm_disarm` | `code` |
| `alarm_control_panel.alarm_trigger` | `code` |

### apple_tv

| Tjänst/funktion | Parametrar |
| --- | --- |
| `apple_tv.append_keyboard_text` | `config_entry_id`, `text` |
| `apple_tv.clear_keyboard_text` | `config_entry_id` |
| `apple_tv.set_keyboard_text` | `config_entry_id`, `text` |

### assist_satellite

| Tjänst/funktion | Parametrar |
| --- | --- |
| `assist_satellite.announce` | `media_id`, `message`, `preannounce`, `preannounce_media_id` |
| `assist_satellite.ask_question` | `answers`, `entity_id`, `preannounce`, `preannounce_media_id`, `question`, `question_media_id` |
| `assist_satellite.start_conversation` | `extra_system_prompt`, `preannounce`, `preannounce_media_id`, `start_media_id`, `start_message` |

### automation

| Tjänst/funktion | Parametrar |
| --- | --- |
| `automation.reload` | Inga fält beskrivna |
| `automation.toggle` | Inga fält beskrivna |
| `automation.trigger` | `skip_condition` |
| `automation.turn_off` | `stop_actions` |
| `automation.turn_on` | Inga fält beskrivna |

### backup

| Tjänst/funktion | Parametrar |
| --- | --- |
| `backup.create_automatic` | Inga fält beskrivna |

### button

| Tjänst/funktion | Parametrar |
| --- | --- |
| `button.press` | Inga fält beskrivna |

### camera

| Tjänst/funktion | Parametrar |
| --- | --- |
| `camera.disable_motion_detection` | Inga fält beskrivna |
| `camera.enable_motion_detection` | Inga fält beskrivna |
| `camera.play_stream` | `format`, `media_player` |
| `camera.record` | `duration`, `filename`, `lookback` |
| `camera.snapshot` | `filename` |
| `camera.turn_off` | Inga fält beskrivna |
| `camera.turn_on` | Inga fält beskrivna |

### cast

| Tjänst/funktion | Parametrar |
| --- | --- |
| `cast.show_lovelace_view` | `dashboard_path`, `entity_id`, `view_path` |

### climate

| Tjänst/funktion | Parametrar |
| --- | --- |
| `climate.set_fan_mode` | `fan_mode` |
| `climate.set_humidity` | `humidity` |
| `climate.set_hvac_mode` | `hvac_mode` |
| `climate.set_preset_mode` | `preset_mode` |
| `climate.set_swing_horizontal_mode` | `swing_horizontal_mode` |
| `climate.set_swing_mode` | `swing_mode` |
| `climate.set_temperature` | `hvac_mode`, `temperature`, `temperature_range` |
| `climate.toggle` | Inga fält beskrivna |
| `climate.turn_off` | Inga fält beskrivna |
| `climate.turn_on` | Inga fält beskrivna |

### cloud

| Tjänst/funktion | Parametrar |
| --- | --- |
| `cloud.remote_connect` | Inga fält beskrivna |
| `cloud.remote_disconnect` | Inga fält beskrivna |

### command_line

| Tjänst/funktion | Parametrar |
| --- | --- |
| `command_line.reload` | Inga fält beskrivna |

### conversation

| Tjänst/funktion | Parametrar |
| --- | --- |
| `conversation.process` | `agent_id`, `conversation_id`, `language`, `text` |
| `conversation.reload` | `agent_id`, `language` |

### counter

| Tjänst/funktion | Parametrar |
| --- | --- |
| `counter.decrement` | Inga fält beskrivna |
| `counter.increment` | Inga fält beskrivna |
| `counter.reset` | Inga fält beskrivna |
| `counter.set_value` | `value` |

### cover

| Tjänst/funktion | Parametrar |
| --- | --- |
| `cover.close_cover` | `speed` |
| `cover.close_cover_tilt` | Inga fält beskrivna |
| `cover.open_cover` | `speed` |
| `cover.open_cover_tilt` | Inga fält beskrivna |
| `cover.set_cover_position` | `position`, `speed` |
| `cover.set_cover_tilt_position` | `tilt_position` |
| `cover.stop_cover` | Inga fält beskrivna |
| `cover.stop_cover_tilt` | Inga fält beskrivna |
| `cover.toggle` | Inga fält beskrivna |
| `cover.toggle_cover_tilt` | Inga fält beskrivna |

### date

| Tjänst/funktion | Parametrar |
| --- | --- |
| `date.set_value` | `date` |

### datetime

| Tjänst/funktion | Parametrar |
| --- | --- |
| `datetime.set_value` | `datetime` |

### device_tracker

| Tjänst/funktion | Parametrar |
| --- | --- |
| `device_tracker.see` | `battery`, `dev_id`, `gps`, `gps_accuracy`, `host_name`, `location_name`, `mac` |

### easee

| Tjänst/funktion | Parametrar |
| --- | --- |
| `easee.action_command` | `action_command`, `device_id` |
| `easee.set_basic_charge_plan` | `current`, `device_id`, `repeat`, `start_datetime`, `stop_datetime` |
| `easee.set_charger_access` | `access_level`, `device_id` |
| `easee.set_charger_dynamic_limit` | `current`, `device_id`, `time_to_live` |
| `easee.set_charger_max_limit` | `current`, `device_id` |
| `easee.set_charger_ocpp` | `device_id`, `enable`, `ocpp_url` |
| `easee.set_charger_phase_mode` | `device_id`, `phase_mode` |
| `easee.set_charging_cost` | `cost_per_kwh`, `currency_id`, `device_id`, `vat` |
| `easee.set_circuit_dynamic_limit` | `current_p1`, `current_p2`, `current_p3`, `device_id`, `time_to_live` |
| `easee.set_circuit_max_limit` | `current_p1`, `current_p2`, `current_p3`, `device_id` |
| `easee.set_circuit_offline_limit` | `current_p1`, `current_p2`, `current_p3`, `device_id` |
| `easee.set_operator` | `device_id`, `operator_id` |
| `easee.set_surplus_charging` | `current`, `device_id`, `enable` |
| `easee.set_weekly_charge_plan` | `current`, `day`, `device_id`, `start_time`, `stop_time` |
| `easee.smart_charging` | `device_id`, `enable` |

### fan

| Tjänst/funktion | Parametrar |
| --- | --- |
| `fan.decrease_speed` | `additional_fields` |
| `fan.increase_speed` | `additional_fields` |
| `fan.oscillate` | `oscillating` |
| `fan.set_direction` | `direction` |
| `fan.set_percentage` | `percentage` |
| `fan.set_preset_mode` | `preset_mode` |
| `fan.toggle` | Inga fält beskrivna |
| `fan.turn_off` | Inga fält beskrivna |
| `fan.turn_on` | `percentage`, `preset_mode` |

### ferroamp

| Tjänst/funktion | Parametrar |
| --- | --- |
| `ferroamp.autocharge` | `target` |
| `ferroamp.charge` | `power`, `target` |
| `ferroamp.discharge` | `power`, `target` |

### ffmpeg

| Tjänst/funktion | Parametrar |
| --- | --- |
| `ffmpeg.restart` | `entity_id` |
| `ffmpeg.start` | `entity_id` |
| `ffmpeg.stop` | `entity_id` |

### frontend

| Tjänst/funktion | Parametrar |
| --- | --- |
| `frontend.reload_themes` | Inga fält beskrivna |
| `frontend.set_theme` | `name`, `name_dark` |

### generic_thermostat

| Tjänst/funktion | Parametrar |
| --- | --- |
| `generic_thermostat.reload` | Inga fält beskrivna |

### group

| Tjänst/funktion | Parametrar |
| --- | --- |
| `group.reload` | Inga fält beskrivna |
| `group.remove` | `object_id` |
| `group.set` | `add_entities`, `all`, `entities`, `icon`, `name`, `object_id`, `remove_entities` |

### hassio

| Tjänst/funktion | Parametrar |
| --- | --- |
| `hassio.addon_restart` | `addon` |
| `hassio.addon_start` | `addon` |
| `hassio.addon_stdin` | `addon` |
| `hassio.addon_stop` | `addon` |
| `hassio.app_restart` | `app` |
| `hassio.app_start` | `app` |
| `hassio.app_stdin` | `app`, `input` |
| `hassio.app_stop` | `app` |
| `hassio.backup_full` | `compressed`, `homeassistant_exclude_database`, `location`, `name`, `password` |
| `hassio.backup_partial` | `addons`, `apps`, `compressed`, `folders`, `homeassistant`, `homeassistant_exclude_database`, `location`, `name`, `password` |
| `hassio.host_reboot` | Inga fält beskrivna |
| `hassio.host_shutdown` | Inga fält beskrivna |
| `hassio.mount_reload` | `device_id` |
| `hassio.restore_full` | `password`, `slug` |
| `hassio.restore_partial` | `addons`, `apps`, `folders`, `homeassistant`, `password`, `slug` |

### history_stats

| Tjänst/funktion | Parametrar |
| --- | --- |
| `history_stats.reload` | Inga fält beskrivna |

### homeassistant

| Tjänst/funktion | Parametrar |
| --- | --- |
| `homeassistant.check_config` | Inga fält beskrivna |
| `homeassistant.reload_all` | Inga fält beskrivna |
| `homeassistant.reload_config_entry` | `entry_id` |
| `homeassistant.reload_core_config` | Inga fält beskrivna |
| `homeassistant.reload_custom_templates` | Inga fält beskrivna |
| `homeassistant.restart` | Inga fält beskrivna |
| `homeassistant.save_persistent_states` | Inga fält beskrivna |
| `homeassistant.set_location` | `elevation`, `latitude`, `longitude` |
| `homeassistant.stop` | Inga fält beskrivna |
| `homeassistant.toggle` | Inga fält beskrivna |
| `homeassistant.turn_off` | Inga fält beskrivna |
| `homeassistant.turn_on` | Inga fält beskrivna |
| `homeassistant.update_entity` | `entity_id` |

### homekit

| Tjänst/funktion | Parametrar |
| --- | --- |
| `homekit.reload` | Inga fält beskrivna |
| `homekit.reset_accessory` | `entity_id` |
| `homekit.unpair` | `device_id` |

### hue

| Tjänst/funktion | Parametrar |
| --- | --- |
| `hue.activate_scene` | `dynamic`, `scene_customization`, `transition` |
| `hue.hue_activate_scene` | `dynamic`, `group_name`, `scene_name` |

### humidifier

| Tjänst/funktion | Parametrar |
| --- | --- |
| `humidifier.set_humidity` | `humidity` |
| `humidifier.set_mode` | `mode` |
| `humidifier.toggle` | Inga fält beskrivna |
| `humidifier.turn_off` | Inga fält beskrivna |
| `humidifier.turn_on` | Inga fält beskrivna |

### image

| Tjänst/funktion | Parametrar |
| --- | --- |
| `image.snapshot` | `filename` |

### image_processing

| Tjänst/funktion | Parametrar |
| --- | --- |
| `image_processing.scan` | Inga fält beskrivna |

### input_boolean

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_boolean.reload` | Inga fält beskrivna |
| `input_boolean.toggle` | Inga fält beskrivna |
| `input_boolean.turn_off` | Inga fält beskrivna |
| `input_boolean.turn_on` | Inga fält beskrivna |

### input_button

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_button.press` | Inga fält beskrivna |
| `input_button.reload` | Inga fält beskrivna |

### input_datetime

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_datetime.reload` | Inga fält beskrivna |
| `input_datetime.set_datetime` | `date`, `datetime`, `time`, `timestamp` |

### input_number

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_number.decrement` | Inga fält beskrivna |
| `input_number.increment` | Inga fält beskrivna |
| `input_number.reload` | Inga fält beskrivna |
| `input_number.set_value` | `value` |

### input_select

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_select.reload` | Inga fält beskrivna |
| `input_select.select_first` | Inga fält beskrivna |
| `input_select.select_last` | Inga fält beskrivna |
| `input_select.select_next` | `cycle` |
| `input_select.select_option` | `option` |
| `input_select.select_previous` | `cycle` |
| `input_select.set_options` | `options` |

### input_text

| Tjänst/funktion | Parametrar |
| --- | --- |
| `input_text.reload` | Inga fält beskrivna |
| `input_text.set_value` | `value` |

### knx

| Tjänst/funktion | Parametrar |
| --- | --- |
| `knx.event_register` | `address`, `remove`, `type` |
| `knx.exposure_register` | `address`, `attribute`, `default`, `entity_id`, `remove`, `type` |
| `knx.read` | `address` |
| `knx.reload` | Inga fält beskrivna |
| `knx.send` | `address`, `payload`, `response`, `type` |

### lawn_mower

| Tjänst/funktion | Parametrar |
| --- | --- |
| `lawn_mower.dock` | Inga fält beskrivna |
| `lawn_mower.pause` | Inga fält beskrivna |
| `lawn_mower.start_mowing` | Inga fält beskrivna |

### light

| Tjänst/funktion | Parametrar |
| --- | --- |
| `light.toggle` | `additional_fields`, `brightness_pct`, `color_temp_kelvin`, `effect`, `rgb_color`, `transition` |
| `light.turn_off` | `additional_fields`, `transition` |
| `light.turn_on` | `additional_fields`, `brightness_pct`, `brightness_step_pct`, `color_temp_kelvin`, `effect`, `rgb_color`, `transition` |

### lock

| Tjänst/funktion | Parametrar |
| --- | --- |
| `lock.lock` | `code` |
| `lock.open` | `code` |
| `lock.unlock` | `code` |

### logbook

| Tjänst/funktion | Parametrar |
| --- | --- |
| `logbook.log` | `domain`, `entity_id`, `message`, `name` |

### logger

| Tjänst/funktion | Parametrar |
| --- | --- |
| `logger.set_default_level` | `level` |
| `logger.set_level` | Inga fält beskrivna |

### media_player

| Tjänst/funktion | Parametrar |
| --- | --- |
| `media_player.browse_media` | `media_content_id`, `media_content_type` |
| `media_player.clear_playlist` | Inga fält beskrivna |
| `media_player.join` | `group_members` |
| `media_player.media_next_track` | Inga fält beskrivna |
| `media_player.media_pause` | Inga fält beskrivna |
| `media_player.media_play` | Inga fält beskrivna |
| `media_player.media_play_pause` | Inga fält beskrivna |
| `media_player.media_previous_track` | Inga fält beskrivna |
| `media_player.media_seek` | `seek_position` |
| `media_player.media_stop` | Inga fält beskrivna |
| `media_player.play_media` | `announce`, `enqueue`, `media` |
| `media_player.repeat_set` | `repeat` |
| `media_player.search_media` | `media_content_id`, `media_content_type`, `media_filter_classes`, `search_query` |
| `media_player.select_sound_mode` | `sound_mode` |
| `media_player.select_source` | `source` |
| `media_player.shuffle_set` | `shuffle` |
| `media_player.toggle` | Inga fält beskrivna |
| `media_player.turn_off` | Inga fält beskrivna |
| `media_player.turn_on` | Inga fält beskrivna |
| `media_player.unjoin` | Inga fält beskrivna |
| `media_player.volume_down` | Inga fält beskrivna |
| `media_player.volume_mute` | `is_volume_muted` |
| `media_player.volume_set` | `volume_level` |
| `media_player.volume_up` | Inga fält beskrivna |

### mqtt

| Tjänst/funktion | Parametrar |
| --- | --- |
| `mqtt.dump` | `duration`, `topic` |
| `mqtt.publish` | `payload`, `publish_options`, `topic` |
| `mqtt.reload` | Inga fält beskrivna |

### nodered

| Tjänst/funktion | Parametrar |
| --- | --- |
| `nodered.trigger` | `message`, `output_path` |

### nordpool

| Tjänst/funktion | Parametrar |
| --- | --- |
| `nordpool.get_price_indices_for_date` | `areas`, `config_entry`, `currency`, `date`, `resolution` |
| `nordpool.get_prices_for_date` | `areas`, `config_entry`, `currency`, `date` |

### notify

| Tjänst/funktion | Parametrar |
| --- | --- |
| `notify.mobile_app_carro_pixel_10_pro` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_clt_l29` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_eskils_pixel_7_pro` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_pixel_10_pro` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_viljars_pixel_10_pro` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_viljars_pixel_7_pro` | `data`, `message`, `target`, `title` |
| `notify.mobile_app_viljars_pixel_watch_3` | `data`, `message`, `target`, `title` |
| `notify.notify` | `data`, `message`, `target`, `title` |
| `notify.persistent_notification` | `data`, `message`, `title` |
| `notify.send_message` | `message`, `title` |

### number

| Tjänst/funktion | Parametrar |
| --- | --- |
| `number.set_value` | `value` |

### persistent_notification

| Tjänst/funktion | Parametrar |
| --- | --- |
| `persistent_notification.create` | `message`, `notification_id`, `title` |
| `persistent_notification.dismiss` | `notification_id` |
| `persistent_notification.dismiss_all` | Inga fält beskrivna |

### person

| Tjänst/funktion | Parametrar |
| --- | --- |
| `person.reload` | Inga fält beskrivna |

### power_saver

| Tjänst/funktion | Parametrar |
| --- | --- |
| `power_saver.clear_exclude_times_override` | `device_id` |
| `power_saver.clear_schedule_hours_override` | `device_id` |
| `power_saver.set_exclude_times` | `device_id`, `exclude_from`, `exclude_until` |
| `power_saver.set_schedule_hours` | `device_id`, `hours` |

### recorder

| Tjänst/funktion | Parametrar |
| --- | --- |
| `recorder.disable` | Inga fält beskrivna |
| `recorder.enable` | Inga fält beskrivna |
| `recorder.get_statistics` | `end_time`, `period`, `start_time`, `statistic_ids`, `types`, `units` |
| `recorder.purge` | `apply_filter`, `keep_days`, `repack` |
| `recorder.purge_entities` | `domains`, `entity_globs`, `entity_id`, `keep_days` |

### remote

| Tjänst/funktion | Parametrar |
| --- | --- |
| `remote.delete_command` | `command`, `device` |
| `remote.learn_command` | `alternative`, `command`, `command_type`, `device`, `timeout` |
| `remote.send_command` | `command`, `delay_secs`, `device`, `hold_secs`, `num_repeats` |
| `remote.toggle` | Inga fält beskrivna |
| `remote.turn_off` | Inga fält beskrivna |
| `remote.turn_on` | `activity` |

### robonect

| Tjänst/funktion | Parametrar |
| --- | --- |
| `robonect.direct` | `entity_id`, `left`, `right`, `timeout` |
| `robonect.ext` | `entity_id`, `ext`, `gpioerr`, `gpioinv`, `gpiomode`, `gpioout` |
| `robonect.job` | `after`, `corridor`, `duration`, `end`, `entity_id`, `remotestart`, `start` |
| `robonect.timer` | `enable`, `end`, `entity_id`, `start`, `timer`, `weekdays` |

### scene

| Tjänst/funktion | Parametrar |
| --- | --- |
| `scene.apply` | `entities`, `transition` |
| `scene.create` | `entities`, `scene_id`, `snapshot_entities` |
| `scene.delete` | Inga fält beskrivna |
| `scene.reload` | Inga fält beskrivna |
| `scene.turn_on` | `transition` |

### schedule

| Tjänst/funktion | Parametrar |
| --- | --- |
| `schedule.get_schedule` | Inga fält beskrivna |
| `schedule.reload` | Inga fält beskrivna |

### script

| Tjänst/funktion | Parametrar |
| --- | --- |
| `script.1569137870936` | Inga fält beskrivna |
| `script.1569138249310` | Inga fält beskrivna |
| `script.1581512090567` | Inga fält beskrivna |
| `script.1581512772477` | Inga fält beskrivna |
| `script.1582031157697` | Inga fält beskrivna |
| `script.bio_stang_av_allt` | Inga fält beskrivna |
| `script.hue_scene_christmas_festive` | Inga fält beskrivna |
| `script.hue_scene_christmas_warm` | Inga fält beskrivna |
| `script.hue_scene_cozy` | Inga fält beskrivna |
| `script.hue_scene_normal` | Inga fält beskrivna |
| `script.hue_scene_off` | Inga fält beskrivna |
| `script.hue_scene_party` | Inga fält beskrivna |
| `script.hue_scene_work` | Inga fält beskrivna |
| `script.reload` | Inga fält beskrivna |
| `script.toggle` | Inga fält beskrivna |
| `script.turn_off` | Inga fält beskrivna |
| `script.turn_on` | Inga fält beskrivna |

### select

| Tjänst/funktion | Parametrar |
| --- | --- |
| `select.select_first` | Inga fält beskrivna |
| `select.select_last` | Inga fält beskrivna |
| `select.select_next` | `cycle` |
| `select.select_option` | `option` |
| `select.select_previous` | `cycle` |

### shell_command

| Tjänst/funktion | Parametrar |
| --- | --- |
| `shell_command.hdmi_switch_read_status` | Inga fält beskrivna |
| `shell_command.hdmi_switch_send_command` | Inga fält beskrivna |
| `shell_command.reload` | Inga fält beskrivna |

### shelly

| Tjänst/funktion | Parametrar |
| --- | --- |
| `shelly.get_kvs_value` | `device_id`, `key` |
| `shelly.set_kvs_value` | `device_id`, `key`, `value` |

### siren

| Tjänst/funktion | Parametrar |
| --- | --- |
| `siren.toggle` | Inga fält beskrivna |
| `siren.turn_off` | Inga fält beskrivna |
| `siren.turn_on` | `duration`, `tone`, `volume_level` |

### songpal

| Tjänst/funktion | Parametrar |
| --- | --- |
| `songpal.set_sound_setting` | `name`, `value` |

### soundtouchplus

| Tjänst/funktion | Parametrar |
| --- | --- |
| `soundtouchplus.add_wireless_profile` | `ip_address`, `ip_port`, `ssid_name`, `ssid_password`, `ssid_security_type`, `timeout_secs` |
| `soundtouchplus.audio_tone_levels` | `bass_level`, `entity_id`, `treble_level` |
| `soundtouchplus.clear_source_nowplayingstatus` | `entity_id`, `source_title` |
| `soundtouchplus.get_audio_dsp_controls` | `entity_id`, `refresh` |
| `soundtouchplus.get_audio_product_level_controls` | `entity_id`, `refresh` |
| `soundtouchplus.get_audio_product_tone_controls` | `entity_id`, `refresh` |
| `soundtouchplus.get_audio_speaker_attribute_and_setting` | `entity_id`, `refresh` |
| `soundtouchplus.get_balance` | `entity_id`, `refresh` |
| `soundtouchplus.get_bass_capabilities` | `entity_id`, `refresh` |
| `soundtouchplus.get_bass_level` | `entity_id`, `refresh` |
| `soundtouchplus.get_device_info` | `entity_id` |
| `soundtouchplus.get_product_cec_hdmi_control` | `entity_id`, `refresh` |
| `soundtouchplus.get_product_hdmi_assignment_controls` | `entity_id`, `refresh` |
| `soundtouchplus.get_source_list` | `entity_id` |
| `soundtouchplus.get_supported_urls` | `entity_id`, `refresh` |
| `soundtouchplus.musicservice_station_list` | `entity_id`, `sort_type`, `source`, `source_account` |
| `soundtouchplus.play_contentitem` | `container_art`, `entity_id`, `is_presetable`, `item_type`, `location`, `name`, `source`, `source_account` |
| `soundtouchplus.play_handoff` | `entity_id_from`, `entity_id_to`, `restore_volume`, `snapshot_only` |
| `soundtouchplus.play_tts` | `album`, `app_key`, `artist`, `entity_id`, `message`, `track`, `tts_url`, `volume_level` |
| `soundtouchplus.play_url` | `album`, `app_key`, `artist`, `entity_id`, `get_metadata_from_url_file`, `track`, `url`, `volume_level` |
| `soundtouchplus.play_url_dlna` | `album`, `art_url`, `artist`, `delay`, `entity_id`, `track`, `update_now_playing_status`, `url` |
| `soundtouchplus.preset_list` | `entity_id`, `include_empty_slots` |
| `soundtouchplus.preset_remove` | `entity_id`, `preset_id` |
| `soundtouchplus.preset_store` | `container_art`, `entity_id`, `item_type`, `location`, `name`, `preset_id`, `source`, `source_account` |
| `soundtouchplus.reboot_device` | `entity_id`, `port` |
| `soundtouchplus.recent_list` | `entity_id` |
| `soundtouchplus.recent_list_cache` | `entity_id` |
| `soundtouchplus.remote_keypress` | `entity_id`, `key_id`, `key_state` |
| `soundtouchplus.set_audio_dsp_controls` | `audio_mode`, `entity_id`, `video_sync_audio_delay` |
| `soundtouchplus.set_audio_product_level_controls` | `entity_id`, `front_center_speaker_level`, `rear_surround_speakers_level` |
| `soundtouchplus.set_audio_product_tone_controls` | `bass_level`, `entity_id`, `treble_level` |
| `soundtouchplus.set_balance_level` | `entity_id`, `level` |
| `soundtouchplus.set_bass_level` | `entity_id`, `level` |
| `soundtouchplus.set_language` | `entity_id`, `language` |
| `soundtouchplus.set_name` | `entity_id`, `name` |
| `soundtouchplus.set_product_cec_hdmi_control` | `cec_mode`, `entity_id` |
| `soundtouchplus.set_product_hdmi_assignment_controls` | `entity_id`, `hdmi_input_selection_01` |
| `soundtouchplus.snapshot_restore` | `entity_id`, `restore_volume` |
| `soundtouchplus.snapshot_store` | `entity_id` |
| `soundtouchplus.update_source_nowplayingstatus` | `album`, `art_url`, `artist`, `artist_id`, `description`, `duration`, `entity_id`, `genre`, `play_status`, `position`, `session_id`, `source_title`, `station_location`, `station_name`, `track`, `track_id` |
| `soundtouchplus.zone_toggle_member` | `entity_id_master`, `entity_id_member` |

### switch

| Tjänst/funktion | Parametrar |
| --- | --- |
| `switch.toggle` | Inga fält beskrivna |
| `switch.turn_off` | Inga fält beskrivna |
| `switch.turn_on` | Inga fält beskrivna |

### system_log

| Tjänst/funktion | Parametrar |
| --- | --- |
| `system_log.clear` | Inga fält beskrivna |
| `system_log.write` | `level`, `logger`, `message` |

### telegram_bot

| Tjänst/funktion | Parametrar |
| --- | --- |
| `telegram_bot.answer_callback_query` | `callback_query_id`, `config_entry_id`, `message`, `show_alert` |
| `telegram_bot.delete_message` | `additional_fields`, `entity_id`, `message_id` |
| `telegram_bot.download_file` | `config_entry_id`, `directory_path`, `file_id`, `file_name` |
| `telegram_bot.edit_caption` | `additional_fields`, `caption`, `entity_id`, `inline_keyboard`, `message_id` |
| `telegram_bot.edit_message` | `additional_fields`, `disable_web_page_preview`, `entity_id`, `inline_keyboard`, `message`, `message_id`, `parse_mode`, `title` |
| `telegram_bot.edit_message_media` | `additional_fields`, `caption`, `entity_id`, `file`, `inline_keyboard`, `media_type`, `message_id`, `url`, `url_options` |
| `telegram_bot.edit_replymarkup` | `additional_fields`, `entity_id`, `inline_keyboard`, `message_id` |
| `telegram_bot.leave_chat` | `additional_fields`, `entity_id` |
| `telegram_bot.send_animation` | `additional_fields`, `caption`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `parse_mode`, `reply_to_message_id`, `url`, `url_options` |
| `telegram_bot.send_chat_action` | `additional_fields`, `chat_action`, `entity_id`, `message_thread_id` |
| `telegram_bot.send_document` | `additional_fields`, `caption`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `parse_mode`, `reply_to_message_id`, `url`, `url_options` |
| `telegram_bot.send_location` | `additional_fields`, `disable_notification`, `entity_id`, `inline_keyboard`, `keyboard`, `latitude`, `longitude`, `message_tag`, `message_thread_id`, `reply_to_message_id` |
| `telegram_bot.send_media_group` | `additional_fields`, `disable_notification`, `entity_id`, `media`, `message_thread_id`, `parse_mode`, `protect_content`, `reply_to_message_id` |
| `telegram_bot.send_message` | `additional_fields`, `disable_notification`, `disable_web_page_preview`, `entity_id`, `inline_keyboard`, `keyboard`, `message`, `message_tag`, `message_thread_id`, `parse_mode`, `reply_to_message_id`, `title` |
| `telegram_bot.send_message_draft` | `additional_fields`, `draft_id`, `entity_id`, `message`, `message_thread_id`, `parse_mode` |
| `telegram_bot.send_photo` | `additional_fields`, `caption`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `parse_mode`, `reply_to_message_id`, `url`, `url_options` |
| `telegram_bot.send_poll` | `additional_fields`, `allows_multiple_answers`, `disable_notification`, `entity_id`, `is_anonymous`, `message_thread_id`, `open_period`, `options`, `question`, `reply_to_message_id` |
| `telegram_bot.send_sticker` | `additional_fields`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `reply_to_message_id`, `sticker_id`, `url`, `url_options` |
| `telegram_bot.send_video` | `additional_fields`, `caption`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `parse_mode`, `reply_to_message_id`, `url`, `url_options` |
| `telegram_bot.send_voice` | `additional_fields`, `caption`, `disable_notification`, `entity_id`, `file`, `inline_keyboard`, `keyboard`, `message_tag`, `message_thread_id`, `reply_to_message_id`, `url`, `url_options` |
| `telegram_bot.set_message_reaction` | `additional_fields`, `entity_id`, `is_big`, `message_id`, `reaction` |

### template

| Tjänst/funktion | Parametrar |
| --- | --- |
| `template.reload` | Inga fält beskrivna |

### text

| Tjänst/funktion | Parametrar |
| --- | --- |
| `text.set_value` | `value` |

### tibber

| Tjänst/funktion | Parametrar |
| --- | --- |
| `tibber.get_prices` | `end`, `start` |

### time

| Tjänst/funktion | Parametrar |
| --- | --- |
| `time.set_value` | `time` |

### timer

| Tjänst/funktion | Parametrar |
| --- | --- |
| `timer.cancel` | Inga fält beskrivna |
| `timer.change` | `duration` |
| `timer.finish` | Inga fält beskrivna |
| `timer.pause` | Inga fält beskrivna |
| `timer.reload` | Inga fält beskrivna |
| `timer.start` | `duration` |

### tts

| Tjänst/funktion | Parametrar |
| --- | --- |
| `tts.clear_cache` | Inga fält beskrivna |
| `tts.cloud_say` | `cache`, `entity_id`, `language`, `message`, `options` |
| `tts.speak` | `cache`, `language`, `media_player_entity_id`, `message`, `options` |

### update

| Tjänst/funktion | Parametrar |
| --- | --- |
| `update.clear_skipped` | Inga fält beskrivna |
| `update.install` | `backup`, `version` |
| `update.skip` | Inga fält beskrivna |

### utility_meter

| Tjänst/funktion | Parametrar |
| --- | --- |
| `utility_meter.calibrate` | `value` |
| `utility_meter.reset` | Inga fält beskrivna |

### vacuum

| Tjänst/funktion | Parametrar |
| --- | --- |
| `vacuum.clean_area` | `cleaning_area_id` |
| `vacuum.clean_spot` | Inga fält beskrivna |
| `vacuum.locate` | Inga fält beskrivna |
| `vacuum.pause` | Inga fält beskrivna |
| `vacuum.return_to_base` | Inga fält beskrivna |
| `vacuum.send_command` | `command`, `params` |
| `vacuum.set_fan_speed` | `fan_speed` |
| `vacuum.start` | Inga fält beskrivna |
| `vacuum.stop` | Inga fält beskrivna |

### valve

| Tjänst/funktion | Parametrar |
| --- | --- |
| `valve.close_valve` | Inga fält beskrivna |
| `valve.open_valve` | Inga fält beskrivna |
| `valve.set_valve_position` | `position` |
| `valve.stop_valve` | Inga fält beskrivna |
| `valve.toggle` | Inga fält beskrivna |

### water_heater

| Tjänst/funktion | Parametrar |
| --- | --- |
| `water_heater.set_away_mode` | `away_mode` |
| `water_heater.set_operation_mode` | `operation_mode` |
| `water_heater.set_temperature` | `operation_mode`, `temperature` |
| `water_heater.turn_off` | Inga fält beskrivna |
| `water_heater.turn_on` | Inga fält beskrivna |

### weather

| Tjänst/funktion | Parametrar |
| --- | --- |
| `weather.get_forecasts` | `type` |

### xiaomi_miio

| Tjänst/funktion | Parametrar |
| --- | --- |
| `xiaomi_miio.fan_reset_filter` | `entity_id` |
| `xiaomi_miio.fan_set_extra_features` | `entity_id`, `features` |
| `xiaomi_miio.light_eyecare_mode_off` | `entity_id` |
| `xiaomi_miio.light_eyecare_mode_on` | `entity_id` |
| `xiaomi_miio.light_night_light_mode_off` | `entity_id` |
| `xiaomi_miio.light_night_light_mode_on` | `entity_id` |
| `xiaomi_miio.light_reminder_off` | `entity_id` |
| `xiaomi_miio.light_reminder_on` | `entity_id` |
| `xiaomi_miio.light_set_delayed_turn_off` | `entity_id`, `time_period` |
| `xiaomi_miio.light_set_scene` | `entity_id`, `scene` |
| `xiaomi_miio.switch_set_power_mode` | `entity_id`, `mode` |
| `xiaomi_miio.switch_set_power_price` | `entity_id`, `mode` |
| `xiaomi_miio.switch_set_wifi_led_off` | `entity_id` |
| `xiaomi_miio.switch_set_wifi_led_on` | `entity_id` |
| `xiaomi_miio.vacuum_clean_segment` | `segments` |
| `xiaomi_miio.vacuum_clean_zone` | `repeats`, `zone` |
| `xiaomi_miio.vacuum_goto` | `x_coord`, `y_coord` |
| `xiaomi_miio.vacuum_remote_control_move` | `duration`, `rotation`, `velocity` |
| `xiaomi_miio.vacuum_remote_control_move_step` | `duration`, `rotation`, `velocity` |
| `xiaomi_miio.vacuum_remote_control_start` | Inga fält beskrivna |
| `xiaomi_miio.vacuum_remote_control_stop` | Inga fält beskrivna |

### zone

| Tjänst/funktion | Parametrar |
| --- | --- |
| `zone.reload` | Inga fält beskrivna |

## Dashboardar och energikopplingar

Bara struktur och entitetsreferenser redovisas; kortens fritext, länkar, åtgärdsvärden och media publiceras inte.

| Dashboardläsning | Resultat | Antal vyer | Unika kända entitetsreferenser |
| --- | --- | --- | --- |
| `lovelace/config` | Läst | 14 | 171 |
| `lovelace/config:vvb-dashboard` | Läst | 1 | 16 |
| `lovelace/config:lovelace-varmesystem` | config_not_found | — | — |
| `lovelace/config:dashboard-hemmet` | Läst | 5 | 39 |
| `lovelace/config:dashboard-labbet` | config_not_found | — | — |
| `lovelace/config:new-home` | Läst | 0 | 0 |
| `lovelace/config:lovelace` | Läst | 14 | 171 |

Kända entiteter refererade från energikonfigurationen: `sensor.easee_hoger_lifetime_energy`, `sensor.easee_vanster_lifetime_energy`, `sensor.electricity_price_bringasen_380`, `sensor.elmatare_bostad_energy`, `sensor.elmatare_hus2_energy`, `sensor.elmatare_varme_energy`, `sensor.elmatare_verkstad_energy`, `sensor.ferroamp_external_energy_consumed`, `sensor.ferroamp_total_solar_energy`. Statistikidentifierare utan motsvarande aktuell entitet är inte garanterat läsbara realtidsvärden.

## Förslag för Hemstyrnings startskärm

Följande är förslag utifrån upptäckta entiteter. Inga nya funktioner eller bindningar har implementerats. Visa mättid, enhet, okänd/otillgänglig status och skilj uppmätt från beräknat.

| Förslag | Verifierade entitets-ID:n i underlaget | Bedömning |
| --- | --- | --- |
| Husets effekt och nätflöde | `sensor.ferroamp_consumption_power`, `sensor.ferroamp_grid_power` | Prioritet 1. Bekräfta teckenkonventionen för import/export; addera inte delmätare till den redan uppmätta hustotalen. |
| Soleffekt och producerad energi | `sensor.ferroamp_solar_power`, `sensor.ferroamp_total_solar_energy` | Prioritet 1. Håll W och kWh separata; kumulativ total är inte automatiskt dagens produktion. |
| Aktuellt och kommande elpris | `sensor.nord_pool_se2_current_price`, `sensor.nord_pool_se2_next_price` | Prioritet 1. Verifiera prisområde, skatt/påslag och tidsintervall innan ekonomiska slutsatser. |
| Laddning höger/vänster | `sensor.easee_hoger_status`, `sensor.easee_hoger_power`, `sensor.easee_vanster_status`, `sensor.easee_vanster_power` | Prioritet 1. Visa laddstatus och faktisk effekt; gamla otillgängliga dubletter ska inte användas. |
| Bilens laddnivå och räckvidd | `sensor.ev6_state_of_charge`, `sensor.ev6_estimated_remaining_driving_range`, `binary_sensor.ev6_charging` | Prioritet 2. Tibberdata; kontrollera uppdateringsålder. Ingen verifierad fordonsposition eller klimatstyrning. |
| Robotens arbete och batteri | `lawn_mower.automower_robonect`, `sensor.automower_mower_battery_charge` | Prioritet 2. Använd upptäckta Husqvarna/Robonect-data. GPS kräver separat kvalitets- och färskhetskontroll före 3D-spårning. |
| Temperatur och varmvatten | `climate.vvb_kallaren_termostat`, `climate.vvb_lower_threshold` | Prioritet 2. Välj de rumsgivare som har korrekt område och användbara mätvärden ur klimatförteckningen. |
| Lampor, ljud och varningar | Välj ur kategori-/områdeslistorna | Prioritet 2–3. Välj ett fåtal aktuella lamp-/medieentiteter per område. Samla låga batterier och otillgänglighet i en diskret varningsöversikt. Dölj inte verkliga fel bakom demovärden. |
| Dammsugare | `vacuum.unnamed_device`, `vacuum.xiaomi_vacuum_cleaner` | Avvakta aktuell tillgänglighet. Båda observerade vacuum-state-entiteterna är otillgängliga. |

## Granskning före publicering

- Rapporten genererades med tillåtna metadatafält; råa API-svar exporteras inte till repot.
- Lokala hemlighetsvärden, URL:er, e-postadresser, IP-/MAC-adresser och tokenformat har kontrollerats och vid behov maskerats.
- Kamera-/medielänkar, konfigurationsdata med hemligheter, GPS-värden, kontoidentifierare och attributens fritextvärden ingår inte.
- Ingen `.env`, rådatafil eller temporärt inventeringsskript ingår i committen.

## Tekniska referenser

- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/)
- [Home Assistant WebSocket API](https://developers.home-assistant.io/docs/api/websocket/)
- Funktionsflaggor tolkades mot Home Assistant Core 2026.9.1, `homeassistant/components/<domän>/const.py`, för media_player, vacuum, lawn_mower, climate och light. Övriga numeriska flaggor redovisas utan antagen tolkning.

