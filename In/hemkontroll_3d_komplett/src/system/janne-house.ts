import surfaces from './calibration/janne-house-surfaces.json';

/** One shared photo-space building identity for the outline, sky and future light receivers. */
export const janneHouseSurfaces=surfaces;
export function janneHouseOutline(){
 const ns='http://www.w3.org/2000/svg',root=document.createElementNS(ns,'svg'),outline=document.createElementNS(ns,'polygon');
 root.classList.add('janne-house-outline');root.setAttribute('viewBox',`0 0 ${surfaces.width} ${surfaces.height}`);root.setAttribute('preserveAspectRatio','none');root.setAttribute('aria-hidden','true');root.dataset.surfaceProfile=surfaces.id;
 outline.setAttribute('points',surfaces.outline.map(point=>point.join(',')).join(' '));outline.setAttribute('fill','none');outline.setAttribute('stroke','#d4dce0');outline.setAttribute('stroke-opacity','.40');outline.setAttribute('stroke-width','.8');outline.setAttribute('stroke-linejoin','round');outline.setAttribute('vector-effect','non-scaling-stroke');root.append(outline);
 return root;
}
