# Beständig applikation och design

AppShell återanvänder hemskärmens GardenScene och canvas. Menylänkar monterar sidinnehåll i app-outlet med 200 ms övergång. URL/historik hålls i webbläsarens History API. Direkta anrop och F5 startar samma bootstrap. OAuth, installation och editor behåller separat startväg.

app-session äger HA-anslutningen. PageScope registrerar sidans lyssnare och timers för städning när sidan lämnas. Visningskanalen är fortsatt serverägd och ändrar ingen enhetsstyrning.

music-session återanvänder samma MusicPanel/SDK mellan Hem, kontrollpanel och musikvy. Kontrollpanelen har en permanent kompakt spelare och länk till hela musikvyn. Scener använder GO!, stoppbara skript använder observerad på/av-status.

Vertikal lamp-scroll är native overflow-y. Endast en horisontellt överfull kortrad översätter vertikalt mushjul till horisontell rörelse; vertikal lamp-scroll fångas inte.

Android använder sensorLandscape. PWA anger landscape i manifestet och försöker standardiserat orienteringslås i installerat/helskärmsläge. Plattformen kan avslå; i stående webbläsare visas en diskret rotationsuppmaning utan CSS-rotation av pekkoordinater.

Verifiering av denna uppdatering väntar enligt användarens instruktion. Tidigare gröna testresultat gäller föregående version. Inga nya tester eller produktionsbyggen har körts för uppdateringen. Ingen ny APK är byggd.

## Livscykel och material

Sidmoduler exporterar mount(root) med ready, activate och dispose. Först när ready är klar byter AppShell synligt innehåll och anropar activate. Detta håller gamla vyn och Spotify kvar under datahämtning. Fel städar den dolda kandidaten och visar en diskret status. Sidans prenumerationer/timers ägs av PageScope; den gemensamma HA-anslutningen stannar.

Scrollpositioner sparas per route och återställs efter montering. Hashlänkar till samma sida scrollar utan dokumentnavigation. Home-åtgärder för kalender, fokus/följning och lista/3D tillämpas vid klientnavigation; initiala direktlänkar hanteras av hemskärmens befintliga startlogik.

Materialvariablerna panel-bg (88 procent), panel-strong (93 procent), panel-blur, text-primary och text-muted används centralt. switch.css samlar den ovala 48×26-brytaren i en 44 px träffyta, 210 ms transform och reduced-motion-stöd. Gradientkorten målas direkt i bakgrunden.

All funktionalitet och visuell layout behöver senare verifiering; inga tester eller automatiserade webbläsare kördes enligt uppdraget.
