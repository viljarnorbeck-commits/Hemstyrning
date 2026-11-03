import type {Connection} from './connection';
import {measurement,overviewBindings,gridFlow} from './overview-data';

/** User-positioned schematic routes; animation follows verified, current power readings. */
export const photoEnergyCables=[
 {id:'solar',label:'Solpaneler → huset',from:[0,.9],to:[.705,.67],delay:0},
 {id:'house2',label:'Huset → Hus 2',from:[.705,.67],to:[.125,1],delay:-2.2},
 {id:'grid',label:'Elnätet → huset',from:[.738,1],to:[.705,.67],delay:-4.1},
 {id:'garage',label:'Mot garaget',from:[.23,.55],to:[.30,.505],delay:-1.4},
] as const;

export function yardEnergyCables(connection:Connection){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('yard-energy-cables');svg.setAttribute('viewBox','0 0 1000 562.5');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.setAttribute('aria-label','Schematiska energivägar; pulser visar aktuella verifierade effektmätningar');
 const title=document.createElementNS(ns,'title');title.textContent='Energiflöde · pulstäthet efter uppmätt effekt';svg.append(title);
 const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');gradient.id='yard-cable-travelling-bar';gradient.setAttribute('x1','0');gradient.setAttribute('x2','1');
 for(const [offset,color,opacity]of [['0%','#aabec7','0'],['20%','#b8c9d1','.18'],['55%','#dbe4e7','.68'],['82%','#f2f5f6','.92'],['100%','#d6e1e5','0']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset!);stop.setAttribute('stop-color',color!);stop.setAttribute('stop-opacity',opacity!);gradient.append(stop);}defs.append(gradient);
 const marker=document.createElementNS(ns,'marker'),arrow=document.createElementNS(ns,'path');marker.id='yard-cable-direction';marker.setAttribute('viewBox','0 0 6 6');marker.setAttribute('refX','5');marker.setAttribute('refY','3');marker.setAttribute('markerWidth','3');marker.setAttribute('markerHeight','3');marker.setAttribute('markerUnits','userSpaceOnUse');marker.setAttribute('orient','auto');arrow.setAttribute('d','M0 0 L6 3 L0 6');arrow.setAttribute('fill','none');arrow.setAttribute('stroke','#b2c5cf');arrow.setAttribute('stroke-opacity','.4');arrow.setAttribute('stroke-width','1');marker.append(arrow);defs.append(marker);svg.append(defs);
 const controllers:Array<()=>void>=[];
 for(const cable of photoEnergyCables){
  const group=document.createElementNS(ns,'g');group.dataset.cable=cable.id;const name=document.createElementNS(ns,'title');group.append(name);
  const x1=cable.from[0]*1000,y1=cable.from[1]*562.5,x2=cable.to[0]*1000,y2=cable.to[1]*562.5;
  const lines=['sheath','line','highlight'].map(kind=>{const line=document.createElementNS(ns,'line');line.classList.add('yard-cable-'+kind);line.setAttribute('x1',String(x1));line.setAttribute('y1',String(y1));line.setAttribute('x2',String(x2));line.setAttribute('y2',String(y2));line.setAttribute('vector-effect','non-scaling-stroke');group.append(line);return line;});
  const pulses=document.createElementNS(ns,'g');group.append(pulses);let previous='';
  controllers.push(()=>{
   const slot=cable.id==='solar'?overviewBindings.solar:cable.id==='grid'?overviewBindings.grid:cable.id==='house2'?overviewBindings.house2:'$garagePower';
   const m=measurement(connection.states,slot,connection.connected,'kW'),direction=cable.id==='grid'?gridFlow(m.value,connection.source==='simulator'?'import':overviewBindings.gridPositive):'';
   const known=connection.connected&&m.status==='Ansluten'&&!m.cached&&m.value!==null&&(cable.id!=='grid'||direction==='KÖPER EL'||direction==='SÄLJER EL'||direction==='NOLLFLÖDE');
   const power=known?(cable.id==='grid'?Math.abs(m.value!):Math.max(0,m.value!)):0;
   // Zero-flow deadband matches the grid card. More load adds evenly spaced bars,
   // rather than making a single bar flash faster; cap density for readability.
   const count=power<.005?0:Math.min(8,Math.ceil(power/1.5)),reverse=cable.id==='grid'&&direction==='SÄLJER EL',key=count+'|'+reverse;
   group.dataset.flow=!known?'unknown':count===0?'idle':reverse?'export':'forward';
   name.textContent=(cable.id==='grid'&&known?direction:cable.label)+' · '+(known?power.toLocaleString('sv-SE',{maximumFractionDigits:2})+' kW':'Aktuell effekt saknas');
   if(key===previous)return;previous=key;
   const [ax,ay,bx,by]=reverse?[x2,y2,x1,y1]:[x1,y1,x2,y2];
   for(const line of lines){line.setAttribute('x1',String(ax));line.setAttribute('y1',String(ay));line.setAttribute('x2',String(bx));line.setAttribute('y2',String(by));line.removeAttribute('marker-end');}
   if(count)lines[1]!.setAttribute('marker-end','url(#yard-cable-direction)');
   pulses.replaceChildren();const seconds=cable.id==='garage'?5.5:8;
   for(let i=0;i<count;i++){
    const pulse=document.createElementNS(ns,'g'),bar=document.createElementNS(ns,'rect'),motion=document.createElementNS(ns,'animateMotion'),fade=document.createElementNS(ns,'animate');pulse.classList.add('yard-cable-pulse');bar.setAttribute('fill','url(#yard-cable-travelling-bar)');pulse.append(bar);
    motion.setAttribute('path','M '+ax+' '+ay+' L '+bx+' '+by);motion.setAttribute('rotate','auto');
    for(const animation of [motion,fade]){animation.setAttribute('dur',seconds+'s');animation.setAttribute('begin',String(-seconds*i/count)+'s');animation.setAttribute('repeatCount','indefinite');}
    fade.setAttribute('attributeName','opacity');fade.setAttribute('values','0;1;1;0');fade.setAttribute('keyTimes','0;.08;.9;1');pulse.append(motion,fade);pulses.append(pulse);
   }
  });
  svg.append(group);
 }
 return {root:svg,update(){for(const update of controllers)update();}};
}
