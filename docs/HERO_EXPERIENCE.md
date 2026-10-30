# Hemstyrning – Live World

Startsidan är nu en regisserad vy av samma levande Three.js-scen. Mitten hålls
fri; bil, robot och solproduktion ligger i en smal objektkolumn, medan fyra
prioriterade energivärden och uppmätt nätriktning bildar ett nedre HUD.
Grafit, cyan, lime, blått och bärnsten ersätter den tidigare gröna glaskänslan.
Spotify och kalender använder fortfarande sin befintliga högerspalt.

## Kamera och objekt

- Vid ankomst gör kameran en enda kort inflygning mot sparad startvy. Ingen
  automatisk orbit eller återkommande rörelse. `prefers-reduced-motion` tar bort
  den extra inflygningssträckan. Befintliga terränggränser gäller fortfarande.
- Bilkort fokuserar närmare bilen. LUBA-kort använder befintlig positionsmotor
  och följning; saknad godkänd position ger ett fel, aldrig en påhittad position.
- **Hela gården** återgår till sparad vy. **Öppna 3D** återställer samtliga
  befintliga snabbkontroller och navigeringsfunktioner.
- Utan importerad robotmodell visas en generisk fyrhjulig testrobot, märkt i
  kortet och objektets interna assetstatus. Detta är ingen verifierad LUBA-modell.
  Importerad GLB ersätter proxyn via befintlig ObjectAssets.
- Objekt-ID, entitetskopplingar och sparad kamera återanvänds. Byt gårdsmodell
  och kalibrera i redigeraren; hero-vyn har inga egna hårdkodade objektpositioner.

## Levande demonstration

Välj **Levande hem · hero** i `/dev/simulator`. Det ger sen eftermiddag,
varierande pris och hushållslast, billaddning, klimat, gårdsbelysning och arbetande
robot. Befintlig matematik för effekt/energimätare används. Inget scenario startas
av att öppna Hem, och ingen ny styrkanal har skapats.

Godkänd körbar mark krävs fortfarande för att visa robotens liveposition. Ett
scenario får inte automatiskt godkänna mark på en verklig gårdsmodell. Kamera-
objektval skickar inga HA-kommandon. Saknade mätvärden visas som Saknar data.

Procedurhimlens enkla sinusmoln har ersatts med flerskalig mjuk brusstruktur och
försiktig framåtspridning kring solen. Astronomi, foto-/panoramaimport, original-
texturer, neutraldiagnostik och faktisk ljussättning är kvar. Molnen är en
procedurvisualisering, inte uppmätta molnformationer eller fotografier.

## Begränsningar och verifiering

Inspirationsfilen `/mnt/data/10387.mp4` saknades i miljön. Ingen analys av klippets
kamerarörelser eller bildspråk kunde därför göras; riktningen bygger på användarens
text. Ny jämförelse behövs när filmen finns tillgänglig.

Playwright granskar hero, mobilbredd, växling till fri 3D och att objektval inte
skickar styrkommandon. Befintliga atmosfär-/mobil-/skärmsynkroniseringstester
används som regression. Skärmdumpar tas lokalt under `/tmp/`; verklig TV-/telefon-
prestanda och den subjektiva premiumkänslan behöver även bedömas på målskärmar.
RealityScan-geometri och originaltexturer ändras inte. Inga nya fotorealistiska
panoramabilder eller verifierade fordons-/robotmodeller har skapats.
