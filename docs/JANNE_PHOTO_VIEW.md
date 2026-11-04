# Janne · sammanhängande fotovy

## Bild och kalibrering

Originalet `Janne.png` (1672 × 941) lämnas oförändrat. SHA256 och exportmått finns i
`public/images/yard/janne/source.json`. Källbildens upplösning sätter detaljgränsen,
även på en 4K-skärm. Webbversionerna är 640, 960, 1280 och 1672 pixlar breda.
Framtida riktiga kvälls-/nattbilder kan läggas i `jannePhoto.variants` utan ny kamera.

`JANNE_PHOTO_CAMERA.json` innehåller position, mål, rotation, FOV, källram,
modellhash, korrespondenser och residualer. Modellen är v000011, samma fasta
`yard380-gltf-v1` som huvudbilden. Röda huset med solpaneler ligger kring
(-38, 4, -23) i producentens lokala ram; inga befintliga enhetspositioner ändras.

Automatisk SIFT-matchning av originalkamerornas 138 bilder gav inga tillförlitliga
träffar. I stället används manuellt identifierade takkanter i kalibrerad källa
`DJI_20261102140830_0383_D.JPG`. Takets inre punkter raycastas på den faktiska
mesh-delen `Roda huset med solpaneler`. Träffar på mark eller fel geometri avvisas.
En perspektivkamera med noll roll anpassas till fotot. RMS på takplanet är cirka
2,51 pixlar i 1672-bilden. Dessa punkter kommer från samma fyra takreferenser och
är korrelerade: felet är INTE ett oberoende bevis på exakt fasadpassning.
Fönster, dörrar och marknivå saknar oberoende kontrollpunkter. Kalibreringen är
uttryckligen preliminär och får inte användas för fysisk enhetsplacering.

## Navigering och rörelse

Befintliga kort Hus 2 och Solpaneler skickar gemensam PHOTO_YARD/janne-visning via
ScreenLink. Inga nya navigationsknappar. Samma ViewCoordinator ger läsbehörigheter,
gemensam visning, återanslutning och automatisk Hem-återgång efter fem minuter.
Hem-knappen återanvänds. Inga HA-kommandon skickas av kameranavigeringen.

GardenScene.photoTransition använder befintlig laddad scen och en 4,2 sekunders
kubisk Bézier-båge med mjuk acceleration/inbromsning. Kontrollpunkterna går upp
över den laddade modellens höjdomfång för att undvika en rak väg genom byggnader.
Det är en konservativ överflygning, inte en ny uppmätt kollisions-/navigationsmodell.
Foto och 3D kors-tonas. Samma bildrektangel, perspektiv och beskärning används
vid slutläget. Reducerad rörelse hoppar över flygningen. Modellen laddas bara vid
första behovet och återanvänds mellan vyerna.

## Himmel

`prepare-janne-photo.py` gör en separat förgrund med alfamask. Masken använder
spårad tak-/skorstens-/ladukontur och konservativ färgsegmentering vid träden.
Metalltaket skyddas separat från himmelssegmenteringen. Originalet rörs inte.
Masken är en visuellt uppskattad matta; avlägsna grenar kan fortfarande ha små
kantrester. Hus, solpaneler och gårdsdetaljer genereras inte med AI.

PhotoSky ligger bakom den transparenta förgrunden och återanvänder liveInputs,
environmentTarget, solarPosition, moonPosition och starDirection. Befintliga
SMHI/HA-väderdata styr molnighet och befintliga regn-/snölager. Utan färskt väder
används neutral molnighet, inga påhittade klara stjärnförhållanden.

Stjärnor kommer från befintlig HYG v4.1-katalog (2865 poster, magnitud ≤ 5,5,
CC BY-SA 4.0). J2000 RA/Dec precesseras/nuteras och räknas om till lokal horisont
för datum, tid och gårdens plats. De projiceras genom fotokameran. Molnighet och
månljus dämpar stjärnorna; objekt under horisonten ritas inte. Sol och måne använder
astronomisk riktning; månskivan belyses från solens verkliga riktning och ger
aktuell fas. Geografisk nordriktning beror på befintlig northOffset och den
preliminära lokala kameraramen, inte en ny inmätt kompasskalibrering.

Himlen ritas högst en gång per sekund och bara när vyn syns. Ingen extra 3D-modell
eller andra WebGL-renderare skapas. Fotografiets exponering/färg tonas mot natt;
en dagsbild kan inte återge ett verkligt nattfoto. Main-house-lampor och skorsten
är dolda i Janne-vyn; strukturen för framtida lokala ljus och tom kortlayout finns.

## Avgränsning av verifiering

Automatiska tester, typkontroll och produktionsbygge är fortsatt pausade enligt
användaren. Kameraklick/Hem och bild-/himmelstatus granskas manuellt i körande app.
Detta är inte en full regression eller en fysisk kalibreringsverifiering.
