/** Straight photo-aligned garage facade receiver. Replaces only the rough
 * reconstructed light contribution; the roof, doorway, photograph and GLB stay intact.
 */
export function garagePhotoSurface(defs:SVGDefsElement,surface:SVGImageElement,color:string){
 const ns='http://www.w3.org/2000/svg',scale=1600/1920;
 // Top edge follows the underside of the long straight gutter. The small entrance
 // roof/door remains under the model's existing occlusion instead of being washed over.
 const facade='M728 482L943 500L944 618L728 574Z M833 511L879 487L920 511L916 606L848 595L848 531Z';
 const mask=document.createElementNS(ns,'mask');mask.id='yard-garage-straight-receiver';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1600');mask.setAttribute('height','900');mask.setAttribute('style','mask-type:luminance');
 mask.innerHTML=`<rect width="1600" height="900" fill="white"/><g transform="scale(${scale})"><path d="${facade}" fill="black" fill-rule="evenodd"/><path d="M728 470L943 488L943 500L728 482Z" fill="black"/></g>`;
 const gradient=document.createElementNS(ns,'radialGradient');gradient.id='yard-garage-even-wash';gradient.setAttribute('gradientUnits','userSpaceOnUse');gradient.setAttribute('cx','756');gradient.setAttribute('cy','500');gradient.setAttribute('r','148');
 gradient.innerHTML=`<stop stop-color="${color}" stop-opacity=".57"/><stop offset=".27" stop-color="${color}" stop-opacity=".43"/><stop offset=".64" stop-color="${color}" stop-opacity=".17"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>`;
 const clip=document.createElementNS(ns,'clipPath');clip.id='yard-garage-wall-boundary';clip.setAttribute('clipPathUnits','userSpaceOnUse');clip.innerHTML='<path d="M728 482L943 500L944 618L728 574Z"/>';
 defs.append(mask,gradient,clip);surface.setAttribute('mask','url(#yard-garage-straight-receiver)');
 const root=document.createElementNS(ns,'g');root.dataset.lightSurfaceCorrection='photo-aligned-garage';root.setAttribute('transform',`scale(${scale})`);
 root.innerHTML=`<path d="${facade}" fill="url(#yard-garage-even-wash)" fill-rule="evenodd" clip-path="url(#yard-garage-wall-boundary)"/>`;
 return root;
}
