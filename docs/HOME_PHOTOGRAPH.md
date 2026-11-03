# Fotografi som startvy

Startbilden är användarens `D:\Syncat\3d\380\Klara\2.0`, PNG 8192×4608.
Originalet är oförändrat: SHA256 `72ea379572171e9f6df0d5d05b4d64fc75ebc1d3b1fa5a9bb42997c63a462c70`.
WebP-kopior i `public/images/yard/` finns i 1280, 1920, 2560, 3840, 6144 och 8192 px.
Storlekarna är cirka 242 KB, 520 KB, 857 KB, 1,59 MB, 3,19 MB och 5,70 MB.
Ingen PNG-originalfil läggs i webbundlen. `srcset`/`sizes` väljer bild efter skärm och pixeltäthet.

`yard-photo-config.ts` innehåller bilden, källkameran och ett register för framtida
säsongs- och dag/nattbilder med samma kameravy. `yard-photograph.ts/.css` sköter
inramning, responsivt utsnitt, atmosfär, ljusprojektion och övergång. Alla tio
informationsgrupper finns kvar med samma databindningar. Övriga funktionssidor,
Spotify, HA-inställningar och objektplaceringar ändras inte.

## Kameran och osäkerheten

Se `HOME_PHOTO_CAMERA.json` för tio landmärken, normaliserade bildpunkter och residualer.
Automatisk SIFT-matchning mot de 138 publicerade originalkamerorna gav inga tillräckligt
stabila korrespondenser och förkastades. Manuell jämförelse använde garage/takfot,
verandagavel, byggnadsbaser och timmerbyggnad i originalfoto
`DJI_20261102141024_0406_D.JPG` och den nya bilden. Strålar från originalkameran
träffade den importerade GLB-geometrin och gav 3D-punkter. Två uppenbart felaktiga
träffar mot bakgrundsmark förkastades. En robust anpassning av kamerans position,
yaw/pitch och brännvidd gjordes; roll fixerades till noll för OrbitControls.

För nuvarande visningsplacering `[1.82,0.5,-4.36]`, rotation noll, skala ett:

- Position: `[-38.160577,16.209546,-9.713473]`.
- Riktpunkt: `[-10.065784,5.813598,-8.098898]`.
- Vertikalt synfält: `35.595047°`, zoom ett, före responsiv beskärning.
- Anpassnings-RMS: **11,08 px** på en 1600×900 referensbild.
- Två undanhållna kontrollpunkter: **25,88 px RMS**, enskilt upp till 32,3 px.

Detta är en **ungefärlig fotovy**, inte exakt fotogrammetrisk eller fysisk kalibrering.
Manuell punktutpekning, ofullständig/uppskattad modellgeometri och obehandlad
RealityScan-linsdistorsion bidrar till avvikelser. Bakgrund, träd och bearbetade
bilddetaljer kan inte övergå pixelperfekt till den befintliga modellen.
Källkameran sparas före modellens visningstransform och räknas om med den; inga
objektkoordinater flyttas. `setViewOffset` återger samma contain/cover-utsnitt som
bilden, även vid sidomeny och mobil beskärning. Den ungefärliga närmarkens median
Y=-0,125787 används bara som kamerans markreserv; uppmätt mark/placerade markytor
har företräde. Den används aldrig som GPS/höjddatum eller robotnavigeringsunderlag.

## Övergång och objekt

Bilden visas utan krav på HA-anslutning. 3D-modellen hämtas först när 3D begärs,
scenen förbereds bakom bilden, kameran inpassas och bilden tonas bort under 850 ms.
Om modellen inte blir redo ligger bilden kvar och ett fel visas. Hem återställer
samma fotovy. Kameramarkreserven hindrar takhöjden från att felaktigt flytta riktpunkten
uppåt. Reducerad rörelse stänger av parallax, partiklar och toningsanimation.

`GardenScene.photographObject` projicerar enbart uttryckligt placerade objekt via
kameran och raycastar byggnadsmeshen innan någon punkt får visas. Ingen manuell
pixelkoordinat lagras för enheter. Bekräftade, anslutna lampor med state=on kan få
små mjuka ljusglödspunkter. Nuvarande obekräftade/rensade placeringar skapar inga
lampor, glöd eller påhittade markörer.

## Väder, tid och prestanda

Befintlig `weatherSnapshot` använder färsk SMHI-prognos eller konfigurerad HA-väderkälla.
Saknat/gammalt väder ger neutral atmosfär. Soligt ger svagt ljusare/varmare intryck,
mulet hålls neutralt, regn mörknar försiktigt med få regnstreck, dimma är en lågkontrastslöja
och snöfall ger glesa partiklar utan att måla marken vit. Dagsljus följer solhöjden
på den konfigurerade platsen; soluppgång/nedgång beräknas med befintlig Astronomy Engine
för plats och datum, utan fasta klockslag. Tiderna finns på fotolagrets dataset/title.
En dagbild används fortfarande på natten med återhållsam toning, inte påstått äkta nattfoto.

Bild-DOM och URL återanvänds under HA-uppdateringar. Bara ett verkligt byte av framtida
bildvariant ändrar URL. Parallax är högst några få pixlar och endast för fin pekare.
WebGL pausas bakom stillbilden och återupptas inför 3D; tung GLB laddas inte vid kall
fotostart. Partiklar har begränsat antal och låg upplösning.

## Utförd kontroll

Visuell granskning av faktisk startsida i Chromium: desktop 1600×1000, surfplatta
1024×1366, mobil 390×844 och 4K 3840×2160. Tio kort på alla storlekar, inget
horisontellt överflöde och inga JavaScript-undantag i dessa vyer. Mobil valde 1280 px,
4K valde 3840 px; vid reducerad rörelse var CSS-transition avstängd. Kall 4K-fotostart
begärde endast WebP-bilden och ingen GLB. Öppna 3D/Hem och korsövertoningen granskades
med den verkliga v000011, utan HA-styrning. Bildfiler och faktisk import är validerade;
originalets hash kontrollerades. Skärmbilder finns lokalt i ignorerade `.build-tools/`.

**Ingen testsvit, TypeScript-kontroll eller produktionsbygge kördes**, enligt kvarstående
användarpaus. Två regressioner för kamerans fasta källram och markreserv är skrivna
men inte körda. Modellbevakning och samarbete mellan chattar är fortsatt pausade.
Push är däremot åter godkänd av det nya uppdraget.

## Placering enligt användarskiss
Kortens normaliserade bildankare finns i photoCardLayout i overview-layout.ts. De följer själva fotots visade rektangel, inte webbläsarens koordinater, och behåller sin plats vid sidomeny/bildskalning. På mindre skärmar visas samma tio grupper i den läsbara listan under gården. Väder/klocka/kalender ligger till vänster över gräset, varmvatten vid trädet, elkostnad och lås ovanför taket, bilar vid timmerbyggnaden, sol/Hus 2 nere till vänster och elnät nere till höger. Den omarkerade robotgruppen behålls till höger.
Tunnt transparent blå SVG med raka linjer och korta långsamma pulser följer samma bildrektangel. Fasta, användarangivna schematiska riktningar: solpaneler till huset, huset till Hus 2, elnät till huset, samt till garaget. yard-energy-cables.ts lagrar rutterna separat från kort och mätvärden. Pulserna representerar INTE verifierat liveflöde, effektstorlek eller uppmätt kabelsträckning; detta anges i bildtext och tillgänglig SVG-beskrivning. Reducerad rörelse ger statiska linjer med små riktningsmarkeringar. Fotots mjuka kanttoning är oförändrad, liksom HA-kopplingar, kameran och objektpositioner. Kablarna är ett presentationslager, inte ny fysisk 3D-kalibrering.
