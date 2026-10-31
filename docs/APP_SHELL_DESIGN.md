# Beständig applikation och design

AppShell återanvänder hemskärmens GardenScene och canvas. Menylänkar monterar sidinnehåll i app-outlet med 200 ms övergång. URL/historik hålls i webbläsarens History API. Direkta anrop och F5 startar samma bootstrap. OAuth, installation och editor behåller separat startväg.

app-session äger HA-anslutningen. PageScope registrerar sidans lyssnare och timers för städning när sidan lämnas. Visningskanalen är fortsatt serverägd och ändrar ingen enhetsstyrning.

music-session återanvänder samma MusicPanel/SDK mellan Hem, kontrollpanel och musikvy. Kontrollpanelen har en permanent kompakt spelare och länk till hela musikvyn. Scener använder GO!, stoppbara skript använder observerad på/av-status.

Vertikal lamp-scroll är native overflow-y. Endast en horisontellt överfull kortrad översätter vertikalt mushjul till horisontell rörelse; vertikal lamp-scroll fångas inte.

Android använder sensorLandscape. PWA anger landscape i manifestet och försöker standardiserat orienteringslås i installerat/helskärmsläge. Plattformen kan avslå; i stående webbläsare visas en diskret rotationsuppmaning utan CSS-rotation av pekkoordinater.

Verifiering av denna uppdatering väntar enligt användarens instruktion. Tidigare gröna testresultat gäller föregående version. Inga nya tester eller produktionsbyggen har körts för uppdateringen. Ingen ny APK är byggd.
