import type {Connection} from './connection';
import {escapeHtml as esc} from './panels';
import {additionalPowerMeters,powerMeterHierarchy,powerMeterSample} from './energy-sankey-data';
import {measurementNote} from './overview-data';
import './energy-sankey.css';

const format=(value:number)=>value.toLocaleString('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2})+' kW';
/** Read-only Sankey: ribbon widths represent measured active power, never inferred allocations. */
export function energySankey(connection:Connection){
 const nodes=powerMeterHierarchy.map(node=>powerMeterSample(node,connection));
 const byId=new Map(nodes.map(node=>[node.id,node]));
 const children=(id:string)=>nodes.filter(n=>n.parent===id);
 const capacity=(id:string)=>Math.max(Math.abs(byId.get(id)?.value??0),children(id).reduce((sum,n)=>sum+Math.abs(n.value??0),0));
 const scale=210/Math.max(.1,capacity('ferroamp'),capacity('workshop'));
 const layouts=new Map<string,{x:number;y:number;height:number}>();
 layouts.set('ferroamp',{x:160,y:164,height:Math.max(16,capacity('ferroamp')*scale)});
 let y=42;for(const n of children('ferroamp')){const height=Math.max(16,capacity(n.id)*scale);layouts.set(n.id,{x:510,y,height});y+=height+76;}
 const workshop=layouts.get('workshop')!,workshopChildren=children('workshop'),rightHeight=workshopChildren.reduce((sum,n)=>sum+Math.max(16,capacity(n.id)*scale),0)+Math.max(0,workshopChildren.length-1)*76;let rightY=Math.max(42,workshop.y+workshop.height/2-rightHeight/2);
 for(const n of children('workshop')){const height=Math.max(16,capacity(n.id)*scale);layouts.set(n.id,{x:834,y:rightY,height});rightY+=height+76;}
 const height=Math.max(570,y+10,rightY+25);
 const root=layouts.get('ferroamp')!;root.y=Math.max(70,(height-root.height)/2);
 const used=new Map<string,number>();
 const ribbons=nodes.filter(n=>n.parent).map(n=>{
  const from=layouts.get(n.parent!)!,to=layouts.get(n.id)!,width=Math.abs(n.value??0)*scale,offset=used.get(n.parent!)??0;
  const y0=from.y+offset,y1=to.y,x0=from.x+14,x1=to.x;used.set(n.parent!,offset+width);
  if(n.value===null)return `<path class="sankey-missing-link" d="M${x0} ${from.y+from.height/2}C${(x0+x1)/2} ${from.y+from.height/2},${(x0+x1)/2} ${y1+8},${x1} ${y1+8}"/>`;
  if(width===0)return `<path class="sankey-zero-link" d="M${x0} ${from.y+from.height/2}C${(x0+x1)/2} ${from.y+from.height/2},${(x0+x1)/2} ${y1+8},${x1} ${y1+8}"/>`;
  const bend=(x0+x1)/2;
  return `<path class="sankey-ribbon" fill="${n.color}" d="M${x0} ${y0}C${bend} ${y0},${bend} ${y1},${x1} ${y1}V${y1+width}C${bend} ${y1+width},${bend} ${y0+width},${x0} ${y0+width}Z"><title>${esc(byId.get(n.parent!)!.label)} ${n.value!<0?'←':'→'} ${esc(n.label)} · ${esc(format(n.value!))}${n.note?' · '+esc(n.note):''}</title></path>`;
 }).join('');
 const nodeMarkup=nodes.map(n=>{const p=layouts.get(n.id)!,left=n.id==='ferroamp',x=left?p.x-14:p.x+27,anchor=left?'end':'start';
  return `<g class="sankey-node"><title>${esc(n.entity)}${n.reportedAt?' · '+esc(new Date(n.reportedAt).toLocaleString('sv-SE')):''}</title><rect x="${p.x}" y="${p.y}" width="14" height="${p.height}" rx="3" fill="${n.color}" fill-opacity="${n.value===null?.35:.9}"/><text x="${x}" y="${p.y+12}" text-anchor="${anchor}" class="sankey-name">${esc(n.label)}</text><text x="${x}" y="${p.y+36}" text-anchor="${anchor}" class="sankey-value">${n.value===null?'—':esc(format(n.value))}</text>${n.note?`<text x="${x}" y="${p.y+54}" text-anchor="${anchor}" class="sankey-note">${n.value===null?esc(n.note):'Inte uppdaterad'}</text>`:''}</g>`;
 }).join('');
 const branches=children('ferroamp'),allMeasured=branches.every(n=>n.value!==null),total=byId.get('ferroamp')!.value,delta=total!==null&&allMeasured?total-branches.reduce((sum,n)=>sum+n.value!,0):null;
 const remaining=additionalPowerMeters(connection);
 return `<section class="technical-card energy-sankey" aria-labelledby="power-sankey-heading"><div class="section-heading"><div><h2 id="power-sankey-heading">ELMÄTARE · EFFEKTFLÖDE</h2><p>Ferroamp → Värme, Bostad, Hus 2 och Verkstad → Easee och motorvärmare</p></div><span class="sankey-unit">kW · ${connection.source==='simulator'?'Simulerad data':'Home Assistant'}</span></div><div class="sankey-canvas"><svg viewBox="0 0 1060 ${height}" role="img" aria-label="Sankey-diagram över elmätarnas aktiva effekt. Verkstadens mätning omfattar Easee-laddarna och motorvärmarna.">${ribbons}${nodeMarkup}</svg></div><div class="sankey-readings">${nodes.map(n=>`<div style="--meter-color:${n.color}" data-meter="${n.id}"><span>${esc(n.label)}</span><strong>${n.value===null?'—':esc(format(n.value))}</strong>${n.note?'<small class="measurement-age">'+esc(n.note)+'</small>':''}</div>`).join('')}</div><p class="sankey-explanation">Bandens bredd visar uppmätt effekt. Streckad koppling betyder att ett verifierat värde saknas. Easee och motorvärmarna ingår i verkstaden och adderas inte en gång till till Ferroamp.${delta!==null&&Math.abs(delta)>.05?' Skillnad mellan Ferroamp och grenarnas summa: '+esc(format(delta))+'. Mätningarna kan ha olika rapporttider.':''} Ingen restförbrukning uppskattas.</p>${remaining.length?`<details class="sankey-additional"><summary>Andra effektmätare · ${remaining.length}</summary><div>${remaining.map(n=>`<article><div><b>${esc(n.label)}</b><small>${esc(n.kind)}</small></div><div><strong>${n.sample.value===null?'—':esc(format(n.sample.value))}</strong>${measurementNote(n.sample)?'<small class="measurement-age">'+esc(measurementNote(n.sample))+'</small>':n.sample.value===null?'<small>'+esc(n.sample.status)+'</small>':''}</div></article>`).join('')}</div></details>`:''}</section>`;
}
