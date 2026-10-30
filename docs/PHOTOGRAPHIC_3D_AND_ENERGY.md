# Sammanhängande fotografisk och interaktiv gård

Hem, fri 3D, Lista, kontrollpanelen och redigeraren använder samma scenkonfiguration,
Home Assistant-brygga och objekt-ID. Ingen alternativ enhets- eller positionsmotor
har tillkommit. Den tidigare hero-uppgiften slutfördes i commit `0b5fc81`.

## Startbild och kamera

Öppna **Redigera gård → Kamera**. Välj kameran direkt i världen och tryck
**Spara som startvy**. **Förhandsgranska startvyn** återgår till den kameran.
**Generera högupplöst startbild** återgår först till sparad vy och renderar en PNG
med upp till3200px bredd (högst4096px höjd) med samma projektion, bildutsnitt,
objekt och material. Redigeringshjälpmedel och energiröntgen följer inte med.
Välj sedan **Fotografisk startvy** eller **Levande 3D**.

PNG och konfiguration sparas lokalt under `data/`, inte i Git. Backend validerar
filformat, storlek, dimensioner och tillåten lokal URL. Läsning och generering
använder befintliga användarroller; endast administratör får skriva i distribuerat
läge. Inga nya publika administrationsportar öppnas.

Bilden är en skarp rendering av det tillgängliga underlaget, inte ny fotografi
eller ett sätt att skapa detaljer som saknas i skanningen. Kvaliteten begränsas
av den aktiva modell-/grafikprofilen och dess texturer. Originalen ändras inte.

En konservativ visuell signatur jämför modell/årstid, kalibrering, objekt,
kamerakonfiguration, material, himmel, sol-/ljusförhållanden och visuellt relevant
telemetri. Saknad anslutning, ändrat bildformat, förändrade enheter/väder eller
bild äldre än fem minuter ger levande3D. Kameran måste också vara tillbaka i
sparad vy. Energisensorers vanliga mätuppdateringar gör inte bilden ogiltig.
Rörlig LUBA kan därför göra att fotoläget snabbt övergår till live; detta är avsiktligt.
Bilden märks STARTBILD med genereringstid, medan HUD visar aktuell enhetsdata.

**Öppna3D**, objektval och Energi inväntar laddad scen. En synlig startbild behålls
med laddningsstatus tills samma kamera är redo, tonas ut350ms, sedan börjar
objektets kamerarörelse. Listläge och ren3D visar ingen startbild. Ingen sidomladdning.
Återgång till Hem flyttar först tillbaka kameran innan en giltig bild visas igen.
Det finns inga automatiska bakgrundsrenders som kan styra verklig utrustning.

## Markeringsramar

Hover på objekt/markör, fokus via tangentbord eller TV och objektkort använder
projicerade faktiska bounding-volymer från samma Three.js-objekt. Befintlig
skymningskontroll används. Ramen flyttar och skalar med objekt/kamera.

För en byggnad i den sammanhängande fotogrammetrin: **Objekt → Byggnad /
markeringsvolym**. Placera och justera position, rotation och skala exakt till
byggnaden. Volymen är osynlig i normal rendering; originalmesh förändras inte.
Ramen är en projicerad volymram, inte en påstått exakt pixelsilhuett av fasaden.
Det finns ingen automatisk byggnadssegmentering. Lampklick behåller direkt tänd/släck.

## Energi

**Energi** i huvudvyn öppnar ett särskilt röntgenläge i riktig3D. Kabelkanaler
renderas som mjuka tredimensionella kurvor och pulser; normalläget döljer dem.
Röntgenvyn visar dem även genom mark och byggnader utan att ändra originalmaterial.
Detta är ett märkt schematiskt överlägg, inte en grävritning eller verklig genomskärning.

Under **Redigera → Energi** kan du skapa, namnge, färgsätta, typbestämma och
sensorkoppla sträckor. Första/sista XYZ-punkten är anslutningspunkterna. Klick på
modellen lägger till kabelpunkter0,5m under träffytan; numeriska XYZ-punkter låter
dig justera väg och djup. Ingen höjd från ett tak ska tolkas som uppmätt mark.
Sträckningen är schematisk tills användaren uttryckligen kryssat i bekräftelsen.

Sensor kan vara `entity_id` eller `entity_id@attribut`. W konverteras till kW;
kWh får aldrig tolkas som effekt. Positiva värden går från första till sista
punkt, negativa bakåt. Saknad/otillgänglig mätning ger Saknar data och inga pulser.
Noll ger stilla kabel. Varje sträckas mätning visas separat, inte summerad med
husets totalförbrukning, så en billaddning räknas inte en andra gång.

**Lägg till simulatorns schematiska energinät** fungerar endast när bryggan svarar
simulator. Det skapar nätimport/export, sol och billaddning från konfigurerade
objekt/sensorer. Kombinera med scenariot **Levande hem · hero** i simulatorn.
Det godkänner inga markytor, ändrar ingen körhistorik och skickar inga HA-kommandon.

## Redigering och återgång

**Översikt | Objekt | Energi |3D-modeller | Kamera | Avancerat** håller vanliga
arbetsflöden i samma sidopanel. Klicka på ett objekt i världen eller välj listan.
Namn, numeriska transformeringar, visuella verktyg och HA-kopplingsväljaren är kvar.
Detaljerad kalibrering, analys, inlärning och diagnostik ligger under Avancerat.

Sparstatus visas alltid. Autosparning använder befintlig atomisk backendlagring;
Spara finns också kvar. **Ångra** återställer senaste ändring och sparar den,
med högst30 lokala steg sedan sidan öppnades. Det är inte en global revisionshistorik.
**Till Hemkontroll** lämnar redigeraren. Redigering kan inte av misstag styra en
verklig lampa; **Testa visuell belysning** använder lokal simulering.

## Verifiering och begränsningar

Playwright täcker verklig bildgenerering, att bilden visas, övergång till3D,
formatbyte/fallback, beständig lagring, energidemo, Ångra och objektvolymer.
Enhetstester täcker signaturinvalidering, bildålder och enhetskonvertering.
Backendtest verifierar PNG-validering och foto-/kabeldata efter serveromstart.
Äldre tester för editor, texturer, Spotify, kalender, lampor, LUBA och parkoppling
körs som regression. Skärmbilder finns lokalt i `/tmp/hem-premium-*.png`.

Inspirationsvideon saknas fortfarande i Ubuntu; ingen analys av dess innehåll
påstås. Fysisk GoogleTV/iOS/Android och subjektiv bildbedömning på målskärm
återstår. En volymram ersätter inte exakta meshesilhuetter, och kabelritningen
har inga separata dragbara Bézierhandtag eller automatisk identifiering av verkliga
elkablar. Bildgiltighet är avsiktligt strikt och kan välja liveofta.

Slutkontroll:131 enhets-/integrationstester (54+77), typkontroll och frontend-/
backendbygge godkända.39 unika Playwright-flöden har passerat över bred/riktad
körning. Den breda körningen hade en skärmbildstimeout; samma kontroll passerade
sedan i en14-flödes slutkörning. Dag/natt/storm verifierades igen efter billigare
molnberäkning. Originaltexturens pixeljämförelse ger fortfarande0 skillnad.

Verklig texturerad gård exporterad och visuellt kontrollerad i både TV- och desktop-
profil: PNG3200×2133, desktopfil cirka7,7MB i `/tmp/hem-premium-real-start.png`.
Exporten pausar ordinarie renderingsloop medan bilden renderas och kodas; den
återställer senaste loopläget även vid fel. Högupplöst render target använder ingen
extra multisampling för att begränsa temporärt grafikminne. Det här är verifierat
med Chromium/SwiftShader, inte en mätning på fysisk GPU eller GoogleTV.
