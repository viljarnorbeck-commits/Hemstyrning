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
 const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');gradient.id='yard-cable-travelling-bar';gradient.setAttribute('x1','0');gradient.setAttribute('x2','1');
 for(const [offset,color,opacity]of [['0%','#aabec7','0'],['20%','#b8c9d1','.18'],['55%','#dbe4e7','.68'],['82%','#f2f5f6','.92'],['100%','#d6e1e5','0']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset!);stop.setAttribute('stop-color',color!);stop.setAttribute('stop-opacity',opacity!);gradient.append(stop);}defs.append(gradient);
 const marker=document.createElementNS(ns,'marker'),arrow=document.createElementNS(ns,'path');marker.id='yard-cable-direction';marker.setAttribute('viewBox','0 0 6 6');marker.setAttribute('refX','5');marker.setAttribute('refY','3');marker.setAttribute('markerWidth','3');marker.setAttribute('markerHeight','3');marker.setAttribute('markerUnits','userSpaceOnUse');marker.setAttribute('orient','auto');arrow.setAttribute('d','M0 0 L6 3 L0 6');arrow.setAttribute('fill','none');arrow.setAttribute('stroke','#b2c5cf');arrow.setAttribute('stroke-opacity','.4');arrow.setAttribute('stroke-width','1');marker.append(arrow);defs.append(marker);svg.append(defs);
 for(const cable of photoEnergyCables){
  const group=document.createElementNS(ns,'g');group.dataset.cable=cable.id;const name=document.createElementNS(ns,'title');name.textContent=cable.label+' · schematisk riktning';group.append(name);
  const x1=cable.from[0]*1000,y1=cable.from[1]*562.5,x2=cable.to[0]*1000,y2=cable.to[1]*562.5;
  for(const kind of ['sheath','line','highlight']){const line=document.createElementNS(ns,'line');line.classList.add('yard-cable-'+kind);line.setAttribute('x1',String(x1));line.setAttribute('y1',String(y1));line.setAttribute('x2',String(x2));line.setAttribute('y2',String(y2));line.setAttribute('vector-effect','non-scaling-stroke');if(kind==='line')line.setAttribute('marker-end','url(#yard-cable-direction)');group.append(line);}
  const pulse=document.createElementNS(ns,'g'),bar=document.createElementNS(ns,'rect'),motion=document.createElementNS(ns,'animateMotion'),fade=document.createElementNS(ns,'animate'),duration=cable.id==='garage'?'5.5s':'8s';pulse.classList.add('yard-cable-pulse');bar.setAttribute('fill','url(#yard-cable-travelling-bar)');pulse.append(bar);
  motion.setAttribute('path','M '+x1+' '+y1+' L '+x2+' '+y2);motion.setAttribute('rotate','auto');
  for(const animation of [motion,fade]){animation.setAttribute('dur',duration);animation.setAttribute('begin',cable.delay+'s');animation.setAttribute('repeatCount','indefinite');}
  fade.setAttribute('attributeName','opacity');fade.setAttribute('values','0;1;1;0');fade.setAttribute('keyTimes','0;.08;.9;1');pulse.append(motion,fade);group.append(pulse);
  svg.append(group);
 }
 return svg;
}
