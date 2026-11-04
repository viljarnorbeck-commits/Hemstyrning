/** Separate, approximate photo receivers at the small entrance and building corner.
 * Straight roof/wall edges replace reconstruction artefacts in this light layer only.
 */
export function workshopPhotoSurface(defs:SVGDefsElement,surface:SVGImageElement,color:string){
 const ns='http://www.w3.org/2000/svg',scale=1600/1920;
 const near='M920 503L943 500L944 618L916 611Z';
 const far='M947 486L1093 499L1087 643L947 618Z';
 const window='M1018 530L1083 536L1080 591L1016 585Z';
 const mask=document.createElementNS(ns,'mask');mask.id='yard-workshop-straight-receivers';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1600');mask.setAttribute('height','900');mask.setAttribute('style','mask-type:luminance');
 mask.innerHTML=`<rect width="1600" height="900" fill="white"/><g transform="scale(${scale})"><path d="${near} ${far}" fill="black"/><path d="M920 489L944 488L944 500L920 503Z M947 476L1093 489L1093 499L947 486Z" fill="black"/></g>`;
 const gradient=(id:string,cx:string,cy:string,r:string,peak:number)=>{const g=document.createElementNS(ns,'radialGradient');g.id=id;g.setAttribute('gradientUnits','userSpaceOnUse');g.setAttribute('cx',cx);g.setAttribute('cy',cy);g.setAttribute('r',r);g.innerHTML=`<stop stop-color="${color}" stop-opacity="${peak}"/><stop offset=".38" stop-color="${color}" stop-opacity="${peak*.6}"/><stop offset=".72" stop-color="${color}" stop-opacity="${peak*.2}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>`;return g;};
 const nearGradient=gradient('yard-workshop-near-wash','927','530','125',.55),farGradient=gradient('yard-workshop-corner-wash','947','533','175',.23);
 const clip=document.createElementNS(ns,'clipPath');clip.id='yard-workshop-far-boundary';clip.setAttribute('clipPathUnits','userSpaceOnUse');clip.innerHTML=`<path d="${far}"/>`;
 defs.append(mask,nearGradient,farGradient,clip);surface.setAttribute('mask','url(#yard-workshop-straight-receivers)');
 const root=document.createElementNS(ns,'g');root.dataset.lightSurfaceCorrection='photo-aligned-workshop';root.setAttribute('transform',`scale(${scale})`);
 root.innerHTML=`<path d="${near}" fill="url(#yard-workshop-near-wash)"/><path d="${far} ${window}" fill="url(#yard-workshop-corner-wash)" fill-rule="evenodd" clip-path="url(#yard-workshop-far-boundary)"/>`;
 return root;
}
