# Home Assistant – funktionstäckning

Ursprunglig statisk kodgranskning 2026-10-31 mot `HOME_ASSISTANT_INVENTERING.md`. Vid denna första kartläggning kördes inga tester, webbläsarprov eller fysiska styrkommandon. **Aktuell verifieringsstatus efter systemtest finns i [SYSTEM_AUDIT_2026-10-31.md](SYSTEM_AUDIT_2026-10-31.md).** ”Implementerad – ej testad” beskriver kod, inte bevisad funktion. Inventeringens tillgänglighet är historisk, inte en ny liveavläsning. HA_ALLOW_CONTROL och lokala bindningar har inte ändrats.

Inventeringen skiljer enhetsregister, entitetsregister, state och tjänstebeskrivningar. 406 tjänster betyder inte 406 fungerande fysiska funktioner. Registerkatalogen i appen läser bara entity/device/area; state kommer från befintlig WebSocket. Avaktiverade entiteter visas som avaktiverade även om annan metadata finns. Registerfel visas och ersätts inte med påhittade områden.

## Historisk matris före systemtest

| Funktion | Home Assistant-entitet/integration | Plats i Hemstyrning | Status | Återstående arbete |
|---|---|---|---|---|
| Realtidsanslutning och behörigheter | REST/state, WebSocket, HA_ALLOW_CONTROL, viewer/controller/admin | Gemensam Connection/backend | Implementerad – ej testad | Återanslutning, behörigheter och ny AppShell behöver regressionstest |
| Sökbar komplett katalog | entity/device/area-register, samtliga state-domäner | Inställningar → Enhetsöversikt | Implementerad – ej testad | Verifiera registerrättigheter; metadata uppdateras vid öppning med servercache, state löpande |
| Val och beständig registrering | entityPreferences i befintlig SceneConfig | Inställningar, valda kort i kontrollpanel/funktionssidor | Implementerad – ej testad | Val för Hem kopplas till befintliga informationskort; 3D-placering görs separat i editor |
| Lampor och ljusgrupper | Hue, KNX, WLED, Shelly/ESPHome light-entiteter | Kontrollpanel, /lights, katalog | Implementerad – ej testad | Verifiera stödda färglägen, Kelvin-gränser och gruppsynk per lampa |
| Nya lampor utan 3D | light.*, deviceRegistry, placementConfirmed=false | Automatisk upptäckt och registrering | Implementerad – ej testad | Sparad koppling krävs för styrning; ingen kameraförflyttning utan placering |
| Switchar och hjälparbrytare | switch.*, input_boolean.* | Katalog, valda entiteter, separat objektregistrering | Implementerad – ej testad | Individuell kommandoregistrering krävs; inte alla switchar är belysning |
| Numeriska hjälpare | number.*, input_number.* | Katalog | Implementerad – ej testad | Min/max/finita värden valideras; steg och integrationsspecifika begränsningar behöver vidare granskning |
| Alternativval | select.*, input_select.* | Katalog | Implementerad – ej testad | Endast annonserade options tillåts; senare fysisk verifiering |
| Ferroamp effekt/solenergi | sensor.ferroamp_consumption_power, sensor.ferroamp_grid_power, sensor.ferroamp_solar_power, sensor.ferroamp_total_solar_energy | Hem, /energy | Implementerad – ej testad | Nätets teckenkonvention är inte bevisad av inventeringens attributlista; real-läge ska behålla overifierad riktning tills verifierad |
| Ferroamp övriga räknare/växelriktare | Ferroamp sensor-entiteter | Katalog och valda detaljkort | Delvis implementerad | Saknar specialiserad översikt över strängar/inverter och verifierad mätstruktur |
| Batterisystem | Ferroamp batterientiteter | Katalog | Otillgänglig i HA enligt inventering | Fungerande integration och faktiska värden krävs före batteriflöde/styrning |
| Elpris nu | sensor.electricity_price_bringasen_380, Tibber/Nord Pool | /energy, katalog | Implementerad – ej testad | Verifiera sensorernas valutor och intervall |
| Kommande priser/priskurva | Nord Pool/Tibber attribut och historik | Katalogens state; separat prisdiagram saknas | Delvis implementerad | Säker adapter för tidsstämplade prisintervall och saknade morgondagspriser |
| Dagskostnad och periodsnitt | $costToday, $averageToday; sensor.monthly_cost_bringasen_380 och sensor.ferroamp_external_energy_consumed_cost är inte dagsvärden | Hem, /energy, energiberäkningar | Delvis implementerad | Verifierade dagskällor eller korrekt historisk differens/integrering behövs; annars Saknar data |
| Förbrukningshistorik | HA history/period, sensor.ferroamp_consumption_power | /energy idag/24 h/7/30 dagar | Implementerad – ej testad | Verifiera recorder/statistikunderlag och luckor; frontend-sampel används inte som historik |
| Hus 2 | sensor.elmatare_hus2_effekt_summa | Hem, /energy | Otillgänglig i HA enligt inventering | Återställ rätt sensor; ingen annan mätare ersätter den utan verifiering; ingen summering med huset |
| Easee vänster/höger | sensor.easee_vanster_status/power/session_energy/lifetime_energy; motsvarande easee_hoger | Hem, /cars, /energy | Implementerad – ej testad | Sessions/livstidsenheter och tidsperiod måste verifieras |
| Easee begränsningar/kommunikation | sensor.easee_*_maximum_allowed_charge_current, sensor.easee_*_fallback_current_if_charger_goes_offline samt binary_sensor/switch-attribut | Sökbar katalog | Delvis implementerad | Specialiserad laddarvy för kabel/kommunikation/alla begränsningar; ingen generell laddstyrning införs |
| Kia EV6 biltelemetri | Äldre Tibber Kia_offline/EV6 | Generisk fordonsmodell, /cars | Väntar på integration | Gamla laddnivå-/räckviddssensorer är inte bevis på aktuell bilkontakt; kräver explicit verifierad bindning |
| e-Golf / framtida EX60 | Konfigurerbara battery/range/remaining/connection-bindningar | /cars, inställningar | Väntar på integration | OVMS/MQTT respektive fungerande Volvo-adapter; inga påhittade positioner/klimatfunktioner |
| Verkliga rumstemperaturer | sensor.uteknx_temperatur, sensor.storabadrummet_temperatur | Hem, /climate | Implementerad – ej testad | Ytterligare rum måste klassificeras; tekniska temperaturer hålls i separat lista |
| Alla temperaturgivare | sensor med device_class=temperature, områdesmetadata | /climate och katalogens områdesfilter | Implementerad – ej testad | Områdesgruppering finns i katalog; temperaturkortens fulla områdesgruppering är återstående förbättring |
| VVB temperaturer | sensor.vvb_kallaren_ovre_temperatur_1, mittentemperatur_2, nedre_temperatur_3 | Hem, /climate tank | Implementerad – ej testad | Datakvalitet och temperaturfördelning behöver verifieras |
| VVB styrning | climate.vvb_kallaren_termostat, climate.vvb_lower_threshold, switch.vvb_kallaren_on_off | /climate, katalog | Delvis implementerad | Backend har explicit allowlist för båda termostater; nedre termostat visas, men saknar komplett eget reglagekort |
| Daikin och andra termostater | daikin_residential och övriga climate | Katalog | Väntar på integration / delvis implementerad | Daikin not_loaded; övriga termostater saknar generell säker styradapter |
| Yale-lås | lock.entredorr_2, lock.verkstadsentre_2 | Hem, /security | Implementerad – ej testad | Behörighets- och bekräftelseprov behövs. Upplåsning kräver separat bekräftelse i befintlig endpoint |
| Dörrstatus/batteri | binary_sensor.entredorr_door, binary_sensor.verkstadsentre_door, låsattribut/batterigivare | /security, katalog | Implementerad – ej testad | Verifiera batterikällor; dörr öppen är inte samma sak som upplåst |
| LUBA 3 / Mammotion | Konfigurerbar $luba och separat positionsbindning | Hem, /mower, MowerTrackingService, 3D | Väntar på integration | Batteri/status/uppdrag/progress/GPS måste komma från faktisk LUBA-integration; arbetsområdesadapter saknas |
| Husqvarna 340x | lawn_mower.automower_robonect, Robonect GPS-sensorer | Katalog; kan registreras som separat oplacerat objekt | Delvis implementerad | Behöver eget detaljkort/positionsadapter; Robonect-GPS får aldrig bli LUBA-position |
| Xiaomi/Roborock dammsugare | vacuum-entiteter och annonserade supported_features | /mower, katalog, separata objekt | Otillgänglig i HA enligt inventering | Driftlägen/fläktlägen/kartadapter saknas; start/paus/dock stöds bara när flaggor och tillgänglighet medger |
| Home Assistant-media | media_player.*, Cast/Apple TV/SoundTouch | Katalog med generella kontroller | Implementerad – ej testad | Spela/paus/föregående/nästa/volym/mute/källa styrs av funktionsflaggor och explicit mediaregistrering. Inte fysisk verifiering |
| Direkt Spotify | Befintlig Spotify Web API/SDK/OAuth | Kontrollpanel, Hem och /music | Implementerad – ej testad | Separat från HA-media, ingen ny Spotify-koppling skapad |
| Scener och skript | scene.*, script.* | Förinställningar och katalog | Implementerad – ej testad | GO! för scener; stopp bara explicit stoppbara skript. Sekvenser/mål är inte verifierade (inventeringens konfigurationsläsning gav 401) |
| Automationer | automation.*, last_triggered/state | Katalog | Implementerad – ej testad | På/av via explicit registrering, inte automationsredigering; triggers/villkor verifieras senare |
| Sensorer/binary sensors/person/trackers | sensor.*, binary_sensor.*, person.*, device_tracker.* | Katalog och valda detaljkort | Implementerad – ej testad | Informationsvisning. Inga positioner ersätts med andra enheters data |
| Covers/fans | cover.*, fan.*, supported_features | Katalogens information/kapabiliteter | Delvis implementerad | Saknar säkra domänspecifika styradaptrar och reglage; inga falskt aktiva knappar |
| Timers/schedules/övriga hjälpare | timer.*, schedule.* och övriga registerdomäner | Katalog | Delvis implementerad | Status går att hitta; start/cancel/ändring av schema är inte implementerad |
| Kalendrar | Konfigurerade calendar-entiteter | Befintlig kalender och Hem | Implementerad – ej testad | Behörighet, perioder och eventläsning verifieras senare |
| Kameror | Generic Camera/registerposter och camera-domän | Katalog, /security, permanent tittarlägesarkitektur | Delvis implementerad | Inventeringen innehåller kamerametadata, men ingen verifierad säker streamproxy. Inga interna kameradresser skickas till klienten |

## Ny implementation i denna genomgång

- Läsande HA-registerendpoint med begränsad metadata, timeout och cache. Fel faller tillbaka till state-katalog med tydlig varning.
- Sökbar katalog med domän/områdesfilter, disabled/unavailable/unknown/saknat state, värde, enhet, uppdatering och annonserade attribut.
- Beständiga val i befintlig scenkonfiguration samt valda informationskort på kontroll-/funktionssidor.
- Fast och behörighetskontrollerad endpoint för switch/input_boolean/automation, number/input_number och select/input_select. Ingen klientvald domän/service och inga lås i denna väg.
- HA-media återanvänder befintlig media-endpoint; mute stöds med flagga 8 och boolesk servervalidering. Direkt Spotify påverkas inte.
- Separat objektregistrering utan 3D-position för light/switch/lawn_mower/vacuum; ingen automatisk telemetriomkoppling.
- Komplett temperaturupptäckt som separat teknisk/oklassificerad lista och information om VVB:s nedre termostat.

## Säkerhet och återstående verifiering

Uppdatering efterföljande systemgranskning: se [SYSTEM_AUDIT_2026-10-31.md](SYSTEM_AUDIT_2026-10-31.md). Tabellen och texten nedan beskriver det tidigare implementeringsuppdraget. Katalogens registerläsning, explicit sparad registrering, hjälparstyrning, disabled/tillgänglighetsstatus och skrivskydd har nu kompletterats med isolerade simulator-/mocktester. Numeriska steg valideras även i backend. Att en domäns programkod verifierats med simulator innebär fortfarande inte fysisk verifiering av KNX, Hue, WLED, Shelly, ESPHome, Easee, Yale eller andra integrationer.

Under den ursprungliga kartläggningen kördes inga tester eller verkliga enhetskommandon. Ingen ändring i Home Assistants konfiguration eller HA_ALLOW_CONTROL. Befintlig readonly-middleware och användarroller gäller även nya endpoints. Att registrera en funktion i Hemstyrning aktiverar inte serverns styrbehörighet och skickar inget HA-kommando. Läs inventeringens gamla tillgänglighetsuppgifter som historiska; återställ först de integrationer som saknar kontakt. Registrera därefter rätt sensorbindningar och explicit tillåtna funktioner.

Komplett domänstyrning för covers, fans, timers, termostater, robotlägen och säker kameraström återstår. Dessa luckor redovisas i tabellen i stället för att döljas bakom generiska serviceanrop. TypeScript, bygge, simulatorprov och fysiska funktioner måste verifieras i ett senare uppdrag.
