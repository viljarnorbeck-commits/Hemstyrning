# Kartbaserad inpassning – Skepparns väg 7, Varberg

Kalibreringen sparades 2026-10-27. Adresspunkt: 57.172268° N, 12.223273° E,
Europe/Stockholm. Källa för adress/kartbild:
[Hitta.se](https://www.hitta.se/kartan/tomter!~57.172268,12.223273,19z/tileLayer!l=1),
kartbild © Lantmäteriet. Bilden användes som analysunderlag, lagras inte i repot.

Fyra hörn av huvudbyggnadens takfot identifierades i en lodrät, obelyst rendering
av Daniels-modellen och den offentliga flygbilden. Garagets fyra takhörn och
uppfarten användes som separat visuell kontroll. Numeriska referenspunkter och
bildkoordinater finns i [YARD_CALIBRATION.json](YARD_CALIBRATION.json).

- Skalfaktor: **1,016405** jämfört med föregående scen.
- Rotation om Y: **−16,9727°**.
- Horisontellt passnings-RMS: **0,252 m**.
- Bedömd absolut noggrannhet: **ungefär 1–3 m**, inte inmätt RTK-noggrannhet.
- Höjd och höjddatum är **inte** kalibrerade; scenens relativa marknivå bevaras.

RMS beskriver enbart passningen av de handvalda punkterna. Det inkluderar inte
kartans absoluta fel, takförskjutning/parallax, bildens ålder, taköverhäng eller
fotogrammetrins formfel. Detta är en användbar kartinpassning för visualisering,
inte en inmätt tomtgräns eller grund för exakt robotnavigering.

Samma globala omräkning tillämpades på samtliga fyra modellplatser och redan
placerade objekt. Därmed behålls deras relativa placeringar, entitetskopplingar
och konfiguration. Original-GLB och texturer ändrades inte. Simulatorns lokala
rutt och geografiska plats följer nu samma referens, även efter serverstart.

Tidigare konfiguration finns i `data/backups/scene-before-varberg-calibration.json`.
Detta är en lokal beständig säkerhetskopia och ingår inte i Git.
