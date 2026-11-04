import {yardWindowProfile as profile,windowLightOutput} from './yard-window-state';
import {yardPhoto} from './yard-photo-config';
import type {HassState} from './types';

type Point=[number,number];

/** Visible window emission, not an invented position for a hidden indoor bulb.
 * Pane mullions stay dark; original photographs and the 3D light rig are untouched.
 */
export function yardPhotoWindows(root:SVGSVGElement,defs:SVGDefsElement){
 const ns='http://www.w3.org/2000/svg',scale=1600/profile.coordinateSize[0];
 const points=(p:Point[])=>p.map(([x,y])=>`${x*scale},${y*scale}`).join(' ');
 const entries=profile.windows.map(window=>{
  const id=`yard-window-${window.id}`,group=document.createElementNS(ns,'g');
  group.classList.add('yard-photo-lamp','yard-photo-window');group.dataset.window=window.id;group.style.setProperty('--lamp-output','0');
  const gradient=document.createElementNS(ns,'radialGradient');gradient.id=id;
  gradient.innerHTML=`<stop stop-color="${window.color}" stop-opacity=".76"/><stop offset=".65" stop-color="${window.color}" stop-opacity=".24"/><stop offset="1" stop-color="${window.color}" stop-opacity="0"/>`;defs.append(gradient);
  const spill=document.createElementNS(ns,'polygon');spill.setAttribute('points',points(window.spill));spill.setAttribute('fill',`url(#${id})`);spill.setAttribute('filter','url(#yard-lamp-spill)');spill.setAttribute('opacity','.5');group.append(spill);
  for(const pane of window.panes){
   const glass=document.createElementNS(ns,'polygon');glass.setAttribute('points',points(pane));glass.setAttribute('fill',window.color);glass.setAttribute('opacity','.8');group.append(glass);
  }
  const glow=document.createElementNS(ns,'ellipse');glow.setAttribute('cx',String(window.center[0]*scale));glow.setAttribute('cy',String(window.center[1]*scale));glow.setAttribute('rx','42');glow.setAttribute('ry','35');glow.setAttribute('fill',`url(#${id})`);glow.setAttribute('filter','url(#yard-lamp-soft)');glow.setAttribute('opacity','.24');group.append(glow);
  root.append(group);return{window,group};
 });
 return{update(states:Map<string,HassState>,connected:boolean,compatible:boolean){
  const enabled=connected&&compatible&&profile.sourcePhotoSha256===yardPhoto.sourceSha256;
  let active=0;
  for(const {window,group} of entries){
   const output=windowLightOutput(window,states,enabled);
   group.style.setProperty('--lamp-output',String(Math.min(1,output)));group.dataset.on=String(output>0);group.classList.toggle('is-disconnected',!enabled);
   if(output>0)active++;
  }
  root.dataset.activeWindows=String(active);
 }};
}
