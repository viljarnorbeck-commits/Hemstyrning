# Stjärnkatalog

`public/config/stars.json` är ett bearbetat utdrag ur **HYG v4.1** av David Nash /
Astronexus: https://github.com/astronexus/HYG-Database.

Källfil: `hyg/CURRENT/hygdata_v41.csv`. Licens: **CC BY-SA 4.0**,
https://creativecommons.org/licenses/by-sa/4.0/. Det härledda katalogutdraget omfattas
av samma licens. Ingen rätt till övrig projektkod följer av kataloglicensen.

Bearbetning: välj visuell magnitud ≤ 5,5, ta bort solposten, behåll RA (timmar),
deklination (grader) och visuell magnitud; avrunda koordinater till sex decimaler.
Alla data används lokalt utan externa nätverksanrop i användarvyn.

# Tillfälliga fotografiska himlar

Fyra lokala 4096×2048 JPEG-bilder under `public/textures/sky/` är nedskalade
visningskopior av Poly Havens tonemappade equirectangular fotografier:

- [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky)
- [Belfast Sunset (Pure Sky)](https://polyhaven.com/a/belfast_sunset_puresky)
- [Qwantani Dusk 2 (Pure Sky)](https://polyhaven.com/a/qwantani_dusk_2_puresky)
- [Kloofendal Overcast (Pure Sky)](https://polyhaven.com/a/kloofendal_overcast_puresky)

Licens: [CC0](https://polyhaven.com/license). Bilderna är tillfälliga referenser,
inte fotografier av gården i Varberg. Ingen API-/CDN-anslutning behövs vid körning.
Nedladdningsmetadata togs från Poly Havens offentliga API – Powered by Poly Haven.
Fotograferad sol maskeras i renderingen; filerna förändras inte vid användning.
Originalens exakta författarkrediter finns på respektive källsida.

# Månens yta

`public/textures/moon-lroc.jpg` är NASA SVS:s 1024×512 färgkarta från 2019:
[CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/).
Kredit: NASA/Goddard Space Flight Center Scientific Visualization Studio,
Lunar Reconnaissance Orbiter Camera (LROC) och Lunar Orbiter Laser Altimeter (LOLA).
Kartdata är optimerade för visualisering, inte vetenskaplig mätning.
Månfas och position beräknas separat; exakt libration och polrotation simuleras inte.
