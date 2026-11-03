/** Fixed, user-specified schematic directions. These are not measured live power or surveyed routes. */
export const photoEnergyCables=[
 {id:'solar',label:'Solpaneler → huset',from:[0,.9],to:[.705,.67],delay:0},
 {id:'house2',label:'Huset → Hus 2',from:[.705,.67],to:[.125,1],delay:-2.2},
 {id:'grid',label:'Elnätet → huset',from:[.738,1],to:[.705,.67],delay:-4.1},
 {id:'garage',label:'Mot garaget',from:[.23,.55],to:[.30,.505],delay:-1.4},
] as const;

export function yardEnergyCables(){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('yard-energy-cables');svg.setAttribute('viewBox','0 0 1000 562.5');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.setAttribute('aria-label','Schematiska energivägar med användarens angivna riktningar; inte uppmätt flöde');
 const title=document.createElementNS(ns,'title');title.textContent='Schematiska energivägar · fasta riktningar, inte uppmätta värden';svg.append(title);
 const defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker'),arrow=document.createElementNS(ns,'path');marker.id='yard-cable-direction';marker.setAttribute('viewBox','0 0 6 6');marker.setAttribute('refX','5');marker.setAttribute('refY','3');marker.setAttribute('markerWidth','3');marker.setAttribute('markerHeight','3');marker.setAttribute('markerUnits','userSpaceOnUse');marker.setAttribute('orient','auto');arrow.setAttribute('d','M0 0 L6 3 L0 6');arrow.setAttribute('fill','none');arrow.setAttribute('stroke','#70c8ff');arrow.setAttribute('stroke-opacity','.55');arrow.setAttribute('stroke-width','1');marker.append(arrow);defs.append(marker);svg.append(defs);
 for(const cable of photoEnergyCables){
  const group=document.createElementNS(ns,'g');group.dataset.cable=cable.id;const name=document.createElementNS(ns,'title');name.textContent=cable.label+' · schematisk riktning';group.append(name);
  for(const kind of ['line','pulse']){const line=document.createElementNS(ns,'line');line.classList.add('yard-cable-'+kind);line.setAttribute('x1',String(cable.from[0]*1000));line.setAttribute('y1',String(cable.from[1]*562.5));line.setAttribute('x2',String(cable.to[0]*1000));line.setAttribute('y2',String(cable.to[1]*562.5));line.setAttribute('vector-effect','non-scaling-stroke');line.setAttribute('pathLength','1000');line.style.animationDelay=cable.delay+'s';if(kind==='line')line.setAttribute('marker-end','url(#yard-cable-direction)');group.append(line);}
  svg.append(group);
 }
 return svg;
}
