# Kompakt layout och mobilnavigering

## Layout

Statusraden har innehållsbredd, högst 850 px på dator och placeras uppe till vänster.
På skärmar upp till 950 px visas enbart temperatur, förbrukning och solproduktion.
Färger, transparens och rundade hörn är bevarade.

Spotify och kalender är barn i samma flexkolumn, `.home-right`, med 12 px mellanrum.
Kalenderns position följer musikpanelens höjd. Dagens datum, nästa händelse,
**Visa fler händelser** och fullständig kalender finns i kolumnen. På mobil används
musikrad och en direkt **Kalender**-knapp i nedre navigeringen.

Snabbkontrollernas innehåll, bredd och scrollbara område är oförändrade. Rullningslisten
döljs med `scrollbar-width`, `-ms-overflow-style` och `::-webkit-scrollbar`.
`overflow:auto` behålls. Behållaren kan fokuseras för tangentbordsscrollning.
Motsvarande mobila paneler har samma osynliga rullningslister.

## Gester

| Inmatning | Beteende |
|---|---|
| Ett finger, Rotera | Rotera runt aktuellt fokus |
| Ett finger, Flytta | Flytta fokus längs markplanet |
| Två fingrar | Panorera och nypzooma i båda lägena |
| Dubbeltryck på modellens uppåtvända yta | Flytta fokus mjukt till träffpunkten |
| Enkelt tryck på objekt | Aktivera objekt; lampor växlar direkt via bekräftad HA-state |
| Manuell kameragest | Avsluta LUBA-följning och pågående fokusförflyttning |

Rotera/Flytta är en enda växlingsknapp nära tummen. Återställ vy, ren 3D, listläge
med pausad rendering och följläget är kvar. Kameraavstånd och fokus begränsas;
kamera får minst 0,9 m avstånd ovanför den samplade modell-/markytan vid giltig
ytträff. Hål eller fel i skanningen kan kräva en korrekt markerad markyta.
Zoom mot pekaren används där OrbitControls stöder det. Fokus kan även träffa ett
uppåtvänt tak; träffen är modellgeometri, inte en inmätt markklassificering.

## Grundorsak och lösning

Tidigare hade canvas och HTML-markörer separata klickbedömningar. Markörerna fångade
gester som därför inte nådde OrbitControls. Den gamla startpunktskontrollen kunde
inte heller säkert skilja ett helt flerfingerförlopp från ett enkelt tryck.

`surface-input.ts` bedömer nu hela peksekvensen. Markörer vidarebefordrar pointer-down
till canvas; OrbitControls följer den riktiga pointer-strömmen via capture/document.
Drag över 7 CSS-pixlar, ytterligare fingrar, cancel och avbruten capture blockerar
aktivering för hela sekvensen. Kompatibilitetsklick från en navigeringsgest ignoreras.
Tangentbordsaktivering av markörer finns kvar.

Ett enkelt touchtryck väntar cirka 330 ms för att säkert skiljas från dubbeltryck.
Dubbeltryck på lampor skickar inga kommandon. Musaktivering behöver inte denna väntan.
Endast canvas och markörer använder `touch-action:none`; panelernas vanliga scroll
och webbläsarens tillgänglighetsfunktioner behålls. Ingen global avstängning av zoom.

OrbitControls sköter en-/tvåfingerövergångar, perspektivberoende panorering och
nypzoom. Markpanorering (`screenSpacePanning=false`), mjuk dämpning och efterföljande
terräng-/kantbegränsning hindrar vertikalt fokusdrift och underjordisk kamera.
Dold canvas i listläge får inte nollställa projektionen vid en ResizeObserver-rapport
med noll bredd/höjd. Originalgeometri och texturer ändras inte.

## Automatisk verifiering

Godkänt: 103 enhets-/integrationstester, typkontroll, produktionsbygge och 23
Playwright-flöden i en sammanhängande regression.

`tests/mobile-navigation.spec.ts` använder 390×844 (iPhone), 412×915 (Android),
820×1180 (surfplatta), 844×390 (liggande) och 1440×960 (dator).
Chromiums `Input.dispatchTouchEvent` genererar riktiga browser-pointerhändelser:
rotation, tvåfingerpanorering, nypzoom, dubbeltryck, lägesbyte, fingerantal 1→2→1,
markördrag, säker lampaktivering, avslutad följning, kamerafrigång och mobil scroll.
Layouttester mäter panelernas positioner, dynamisk höjd, osynliga scrollbars,
mushjul/tangentbord och knappar inom viewport. Övriga regressioner täcker Spotify/Jam,
kalender, listläge/fullskärm, enhetsstyrning, redigerare, import och kartkalibrering.

```bash
npm test
npm run typecheck
npm run build --workspace @hemkontroll/dashboard
npm run test:e2e -- tests/mobile-navigation.spec.ts
```

## Manuell kontroll på fysisk telefon

Emulering verifierar Chromium, inte iOS/Safaris gestigenkänning, verklig pekhårdvara,
notch/systemfält eller faktisk GPU-prestanda. Dessa delar ska även kontrolleras på
iPhone/Safari och Android/Chrome; gärna även en surfplatta. Använd en avsiktligt
konfigurerad lokal anslutning/portvidarebefordran till utvecklingsservern. `localhost`
på telefonen är telefonen själv om ingen sådan vidarebefordran finns.

1. Starta `npm run dev` och bekräfta simulatorns `/health`. Använd endast simulatorn.
2. Kontrollera statusrad, musikrad, Kalender och nedersta navigeringen i båda riktningar.
   Prova med telefonens systemfält synliga och efter fullskärmsförsök.
3. Rotera med ett finger. Byt till Flytta och panorera med samma hand. Kontrollera att
   Rotera/Flytta, Återställ och återgång från ren 3D går att nå bekvämt.
4. Panorera med två fingrar och nypzooma. Lyft ett finger mitt i gesten och fortsätt
   med det andra. Kameran ska inte hoppa. Prova också nära zoom och gårdens ytterkant.
5. Dubbeltryck på en synlig markpunkt: fokus ska flyttas mjukt. Starta LUBA-följning
   och navigera manuellt: följningen ska avslutas.
6. Notera en simulerad lampas state i simulatorn. Ett tryck på lampan ska växla en gång.
   Drag som börjar på markören, tvåfingersgest och dubbeltryck på lampan ska inte växla.
7. Rulla kontroll-/list-/musik-/kalenderpaneler med fingret utan synlig scrollbar.
   Prova musikuppspelning, kalenderöppning och byte 3D ↔ Lista ↔ ren 3D.
8. Upprepa mus-/styrplattesscrollning och PageDown på dator i Chrome/Edge/Firefox/Safari.
   Scrollbars ska vara dolda utan att scrollning eller synlig tangentbordsfokus försvinner.
