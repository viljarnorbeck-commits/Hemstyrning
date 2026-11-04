/** Photo-aligned receivers for the porch post and wall where the provisional
 * reconstruction has a wavy silhouette. Light-only overlays; no texture edits.
 * Coordinates trace the unchanged 1920x1080 photograph, not surveyed 3D geometry.
 */
export function porchPhotoSurface(defs:SVGDefsElement,surface:SVGImageElement,color:string){
 const ns='http://www.w3.org/2000/svg',scale=1600/1920;
 const post='1234,573 1241,574 1230,680 1222,679';
 const wall='1244,578 1302,584 1295,653 1237,647';
 const sideWall='1311,544 1340,548 1328,677 1307,674';
 const postCut='1230,571 1246,572 1235,682 1218,681';
 const shape=(points:string,fill:string)=>`<polygon points="${points}" fill="${fill}"/>`;
 const mask=document.createElementNS(ns,'mask');mask.id='yard-porch-straight-receivers';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1600');mask.setAttribute('height','900');mask.setAttribute('style','mask-type:luminance');
 mask.innerHTML=`<rect width="1600" height="900" fill="white"/><g transform="scale(${scale})">${shape(postCut,'black')}${shape(wall,'black')}${shape(sideWall,'black')}</g>`;
 const postGradient=document.createElementNS(ns,'linearGradient');postGradient.id='yard-porch-post-wash';postGradient.setAttribute('x1','0');postGradient.setAttribute('y1','0');postGradient.setAttribute('x2','0');postGradient.setAttribute('y2','1');
 postGradient.innerHTML=`<stop stop-color="${color}" stop-opacity=".48"/><stop offset=".42" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity=".08"/>`;
 const wallGradient=document.createElementNS(ns,'radialGradient');wallGradient.id='yard-porch-wall-wash';wallGradient.setAttribute('cx','.2');wallGradient.setAttribute('cy','.06');wallGradient.setAttribute('r','1.12');
 wallGradient.innerHTML=`<stop stop-color="${color}" stop-opacity=".38"/><stop offset=".5" stop-color="${color}" stop-opacity=".17"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>`;
 defs.append(mask,postGradient,wallGradient);surface.setAttribute('mask','url(#yard-porch-straight-receivers)');
 const root=document.createElementNS(ns,'g');root.dataset.lightSurfaceCorrection='photo-aligned-porch';root.setAttribute('transform',`scale(${scale})`);
 root.innerHTML=shape(wall,'url(#yard-porch-wall-wash)')+`<g opacity=".42">${shape(sideWall,'url(#yard-porch-wall-wash)')}</g>`+shape(post,'url(#yard-porch-post-wash)');
 return root;
}
