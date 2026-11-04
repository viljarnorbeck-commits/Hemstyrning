/** Decorative smoke anchored to the chimney cap in the original photo frame.
 * It does not indicate a measured fire/heating state or modify the photograph.
 */
export function yardChimneySmoke(){
 const ns='http://www.w3.org/2000/svg',root=document.createElementNS(ns,'svg');
 root.classList.add('yard-chimney-smoke');root.setAttribute('viewBox','0 0 1920 1080');root.setAttribute('preserveAspectRatio','none');root.setAttribute('aria-hidden','true');
 const defs=document.createElementNS(ns,'defs');defs.innerHTML='<filter id="yard-smoke-soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>';
 const source=document.createElementNS(ns,'g');source.setAttribute('transform','translate(1267 194)');source.setAttribute('fill','#bfc5c9');source.setAttribute('filter','url(#yard-smoke-soft)');
 for(let i=0;i<12;i++){
  const puff=document.createElementNS(ns,'g');puff.classList.add('yard-smoke-puff');puff.style.setProperty('--smoke-delay',(-i)+'s');puff.style.setProperty('--smoke-drift',(i%3-1)*9+'px');
  for(const [cx,cy,r] of [[0,0,10],[-7,-5,8],[8,-3,7]]){const lobe=document.createElementNS(ns,'circle');lobe.setAttribute('cx',String(cx));lobe.setAttribute('cy',String(cy));lobe.setAttribute('r',String(r));puff.append(lobe);}
  source.append(puff);
 }
 root.append(defs,source);return root;
}
