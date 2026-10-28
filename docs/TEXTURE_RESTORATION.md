# Återställd RealityScan-textur – 2026-10-28

## Original och analys

Originalfilerna är oförändrade:

| Fil | SHA-256 |
|---|---|
| `In/Daniels.glb` | `f6cfc3c0cbe8896a09cdb8f9ee456245e666083882a816d0ed8f55aba6e3e6fe` |
| `In/Daniels_u0_v0_diffuse.png` | `1fe2d7c6db733c4399915014e2b621b1b01cb741af2fcf7e3bd88b5639e79869` |

GLB:n refererar uttryckligen till denna PNG via materialet `default_tex0` och
`baseColorTexture`, UV-kanal 0. En textur och en materialprimitiv används.
PNG: **8192 × 8192**, 60 807 533 byte, RGBA, 8 bitar/kanal, förlustfri PNG.
PNG-filen har en uttrycklig sRGB-chunk och gAMA=0,45455; ingen ICC-profil finns. glTF-basfärg tolkas som sRGB.
Alla 2 935 636 UV-par är ändliga och inom [0,1]. U ligger cirka 0,000244–0,999755,
V cirka 0,010010–0,999845. Ingen saknad UV-kanal eller olösbar bildreferens kvarstår.

Originalets COLOR_0 innehåller dessutom fotografisk färg (medel cirka
0,180/0,185/0,166). glTF multiplicerar dessa värden med texturens linjära basfärg.
Därför tar beredningen bort COLOR_0 **enbart från genererade texturerade primitiver**
och använder vit materialfaktor. Originalets samtliga data behålls på disk.
Ingen global ändring görs av andra importerade modellers material.

## Genererade modeller

| Nivå | Trianglar | Storlek, ungefär | Bild |
|---|---:|---:|---|
| Referens | 5 310 780 | 175 MiB | Originalets 8192² PNG |
| Detalj, dator | 1 858 652 | 66 MiB | Originalets 8192² PNG |
| Mobil | 637 292 | 62 MiB | Originalets 8192² PNG |

PNG-bytes är identiska i alla GLB-filer: ingen ny atlas, JPEG-konvertering,
bildkomprimering eller nedskalning. Referensens positioner, index och UV är exakt
bevarade. Geometriförenkling/Meshopt används endast i detalj/mobil; positioner och
UV kvantiseras med 16 bitar. Texturer använder trilineära mipmaps, linjär förstoring
och maximal stödd anisotropi. Säsongsbyte, ljus, väta och väder använder samma modellhanterare.

## Verifiering

```bash
npm run prepare:model
npm run verify:model
node scripts/audit-model.mjs > docs/MODEL_AUDIT.json
npm test
npm run typecheck
npm run build --workspace @hemkontroll/dashboard
npm run test:e2e -- tests/model-texture.spec.ts
```

`verify:model` kontrollerar originalhashar, identiska inbäddade bildbytes, material,
UV och referensens fullständiga positions-/index-/UV-arrayer.
Webbläsartestet jämför 4 003 verkliga trianglar spridda över originalet/referensen,
med originaltexturen och neutral obelyst färg: **medel- och maximal pixelskillnad 0**.
Det är ett prov, inte en fullständig pixeljämförelse av hela 5,3-miljonersmodellen.
Två fulla referensmodeller samtidigt överskred testwebbläsarens resurser; de fulla
arrayernas likhet verifieras i stället separat utan GPU.

App-tester laddar hela mobil- respektive detaljmodellen i befintlig dashboard och kontrollerar att
8192²/sRGB, UV, vertexColors=false, anisotropi och filtrering faktiskt används,
och provar det neutrala läget. Skärmbilder sparas i Playwrights `test-results/`.
I redigeraren: **Karta, modelljämförelse och import → Modelljämförelse**.
Välj nivå och **Neutral originaltextur** för jämförelse utan ljus, väta, gradering,
himmel eller tonemapping. Normalläget återställer de dynamiska effekterna.
Diagnostiken visar även laddad texturstorlek och GPU:ns maxTextureSize.

## Kvarstående begränsningar

- Fotograferade skuggor, bilar, flytande trianglar och dålig kantgeometri finns i
  källexporten. Texturåterställning reparerar inte dessa och fabricerar ingen geometri.
- RealityScan-projektet, bilder före texturering och en matchande RealityScan-vy
  saknas. Exportens eventuella tidigare atlas-sammanslagning/nedskalning och exakt
  visuell överensstämmelse med RealityScan kan därför inte fastställas.
- 8192² RGBA inklusive mipmaps behöver cirka **341 MiB GPU-minne per textur**.
  Modellcachen kan hålla två resurser. Mobilfilen har färre trianglar men samma
  bildminne; svagare GPU:er kan tvinga Three.js att minska bilden eller få minnesbrist.
  En uttrycklig, separat lågminnesprofil bör mätas på måltelefoner innan eventuell
  nedskalning införs. Original och högupplösta filer ska behållas.
- Verkliga mobilers FPS, minne och färgåtergivning behöver fortfarande mätas.
  Normal belysning/tonemapping förändrar avsiktligt fotots ljus beroende på väder/tid.
- Tre andra årstidsskanningar saknas fortfarande.
