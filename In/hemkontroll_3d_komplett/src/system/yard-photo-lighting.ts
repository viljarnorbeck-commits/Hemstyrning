import {PerspectiveCamera,Vector3} from 'three';
import {yardPhoto} from './yard-photo-config';
import {yardLightProfile,yardLightReading,yardLightsCompatible,type YardLightFixture} from './yard-light-calibration';
import {yardFixtureSize} from './yard-fixture-visual';
import {yardPhotoWindows} from './yard-photo-windows';
import {porchPhotoSurface} from './yard-photo-porch-surface';
import {garagePhotoSurface} from './yard-photo-garage-surface';
import {workshopPhotoSurface} from './yard-photo-workshop-surface';
import surfaceProfileText from './calibration/kyrkas-photo-light-surfaces.json?raw';
import type {SceneConfig,HassState} from './types';
import './yard-photo-lighting.css';

const surfaceProfile=JSON.parse(surfaceProfileText) as {sourceFrameId:string;modelSha256:string;sourcePhotoSha256:string;camera:unknown;fixtures:Array<{id:string;position:number[];target:number[];url:string}>};
/** Lightweight light-only projections, with model-derived occlusion for wall fittings.
 * The photo/model alignment remains approximate; no claim of measured photometry.
 * No edited textures, duplicate model load, animation loop or HA commands.
 */
export function yardPhotoLighting(){
 const ns='http://www.w3.org/2000/svg',root=document.createElementNS(ns,'svg');
 root.classList.add('yard-calibrated-photo-lights');root.setAttribute('viewBox','0 0 1600 900');root.setAttribute('preserveAspectRatio','none');root.setAttribute('aria-hidden','true');root.dataset.calibration=yardLightProfile.id;
 const fixturesRoot=document.createElementNS(ns,'svg');fixturesRoot.classList.add('yard-photo-fixtures');fixturesRoot.setAttribute('viewBox','0 0 1600 900');fixturesRoot.setAttribute('preserveAspectRatio','none');fixturesRoot.setAttribute('aria-hidden','true');fixturesRoot.style.display=root.style.display='none';
 const camera=new PerspectiveCamera(yardPhoto.sourceView.fov,16/9,.1,1000);camera.position.fromArray(yardPhoto.sourceView.position);camera.lookAt(new Vector3(...yardPhoto.sourceView.target));camera.updateMatrixWorld();
 const project=(p:Vector3)=>{const q=p.clone().project(camera);return{x:(q.x*.5+.5)*1600,y:(.5-q.y*.5)*900,visible:q.z>=-1&&q.z<=1};};
 const path=(points:Vector3[])=>{const projected=points.map(project);return projected.every(p=>p.visible)?projected.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')+'Z':'';};
 const hardwareDefs=document.createElementNS(ns,'defs');hardwareDefs.innerHTML='<linearGradient id="yard-fixture-metal"><stop stop-color="#20292f"/><stop offset=".35" stop-color="#8f989c"/><stop offset=".62" stop-color="#525d65"/><stop offset="1" stop-color="#283238"/></linearGradient>';fixturesRoot.append(hardwareDefs);
 const screenRight=new Vector3().setFromMatrixColumn(camera.matrixWorld,0);
 function fixtureBody(fixture:YardLightFixture,p:Vector3){
  if(!fixture.mountStyle)return;const q=project(p);if(!q.visible)return;
  const r=Math.max(1.5,Math.abs(project(p.clone().addScaledVector(screenRight,yardFixtureSize.globeRadius)).x-q.x)),body=document.createElementNS(ns,'g');body.dataset.fixtureBody=fixture.id;
  if(fixture.mountStyle==='post-lantern'){
   const foot=new Vector3(p.x,fixture.target[1],p.z),top=p.clone().add(new Vector3(0,-.14,0)),side=screenRight.clone().multiplyScalar(yardFixtureSize.poleRadius),column=document.createElementNS(ns,'path');
   column.setAttribute('d',path([foot.clone().sub(side),foot.clone().add(side),top.clone().add(side),top.clone().sub(side)]));column.setAttribute('fill','url(#yard-fixture-metal)');column.setAttribute('stroke','#707d84');column.setAttribute('stroke-width','.35');body.append(column);
   const base=project(foot),basePlate=document.createElementNS(ns,'ellipse');basePlate.setAttribute('cx',String(base.x));basePlate.setAttribute('cy',String(base.y));basePlate.setAttribute('rx',String(r*.7));basePlate.setAttribute('ry',String(r*.22));basePlate.setAttribute('fill','#344047');body.append(basePlate);
  }else{
   const plate=document.createElementNS(ns,'rect');plate.setAttribute('x',String(q.x-r*.55));plate.setAttribute('y',String(q.y-r*1.4));plate.setAttribute('width',String(r*1.1));plate.setAttribute('height',String(r*3.1));plate.setAttribute('rx',String(r*.2));plate.setAttribute('fill','#293238');body.append(plate);
  }
  const glass=document.createElementNS(ns,'ellipse');glass.setAttribute('cx',String(q.x));glass.setAttribute('cy',String(q.y));glass.setAttribute('rx',String(r));glass.setAttribute('ry',String(r*1.15));glass.setAttribute('fill','#a9b1a7');glass.setAttribute('stroke','#344047');glass.setAttribute('stroke-width','.6');body.append(glass);
  const cap=document.createElementNS(ns,'path');cap.setAttribute('d',`M${q.x-r*1.4},${q.y-r*1.12}L${q.x},${q.y-r*1.95}L${q.x+r*1.4},${q.y-r*1.12}Z`);cap.setAttribute('fill','url(#yard-fixture-metal)');cap.setAttribute('stroke','#7e898d');cap.setAttribute('stroke-width','.4');body.append(cap);
  const cage=document.createElementNS(ns,'path');cage.setAttribute('d',`M${q.x-r*.72},${q.y-r*1.12}L${q.x-r*.72},${q.y+r*1.2}M${q.x+r*.72},${q.y-r*1.12}L${q.x+r*.72},${q.y+r*1.2}M${q.x-r*1.1},${q.y+r*1.2}L${q.x+r*1.1},${q.y+r*1.2}`);cage.setAttribute('stroke','#273239');cage.setAttribute('stroke-width',String(Math.max(.6,r*.13)));body.append(cage);fixturesRoot.append(body);
 }
 const defs=document.createElementNS(ns,'defs');defs.innerHTML='<filter id="yard-lamp-spill" x="-40%" y="-70%" width="180%" height="240%"><feGaussianBlur stdDeviation="6"/></filter><filter id="yard-lamp-soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5"/></filter>';
 root.append(defs);const entries:Array<{fixture:YardLightFixture;group:SVGGElement;output:number;surface?:SVGImageElement;correction?:SVGGElement;fallback:SVGGElement}>=[];
 for(const fixture of yardLightProfile.fixtures.filter(f=>f.enabled)){
  const p=new Vector3(...fixture.position),aim=new Vector3(...fixture.target).sub(p).normalize(),ground=-.125787,height=Math.max(.4,p.y-ground),center=p.clone();
  fixtureBody(fixture,p);
  // Keep wall-lamp spill at the foot of the facade rather than at the distant cone target.
  if(fixture.kind==='spot'&&aim.y<-.05)center.addScaledVector(aim,Math.min(1,(ground-p.y)/aim.y*.22));center.y=ground;
  const radius=fixture.kind==='spot'?Math.min(2.5,height*.55+.65):Math.min(fixture.range*.3,height*.85+1.6),outline=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return new Vector3(center.x+Math.cos(a)*radius,ground,center.z+Math.sin(a)*radius);});
  const tint='#'+fixture.color.slice(1).match(/.{2}/g)!.map(v=>Math.round(parseInt(v,16)*.92).toString(16).padStart(2,'0')).join('');
  const id='yard-lamp-'+entries.length,gradient=document.createElementNS(ns,'radialGradient');gradient.id=id;gradient.innerHTML=`<stop stop-color="${tint}" stop-opacity=".78"/><stop offset=".45" stop-color="${tint}" stop-opacity=".36"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/>`;defs.append(gradient);
  const group=document.createElementNS(ns,'g');group.classList.add('yard-photo-lamp');group.dataset.fixture=fixture.id;group.dataset.on='false';group.style.setProperty('--lamp-output','0');
  const fallback=document.createElementNS(ns,'g');group.append(fallback);
  const projected=surfaceProfile.fixtures.find(f=>f.id===fixture.id&&JSON.stringify(f.position)===JSON.stringify(fixture.position)&&JSON.stringify(f.target)===JSON.stringify(fixture.target));
  let surface:SVGImageElement|undefined,correction:SVGGElement|undefined;
  if(fixture.kind==='spot'&&projected&&surfaceProfile.sourceFrameId===yardPhoto.sourceFrame&&surfaceProfile.sourcePhotoSha256===yardPhoto.sourceSha256&&JSON.stringify(surfaceProfile.camera)===JSON.stringify(yardPhoto.sourceView)){
   surface=document.createElementNS(ns,'image');surface.setAttribute('href',projected.url);surface.setAttribute('width','1600');surface.setAttribute('height','900');surface.setAttribute('preserveAspectRatio','none');surface.dataset.lightSurface='model-occlusion';surface.style.display='none';surface.addEventListener('error',()=>{surface!.dataset.failed='true';});group.append(surface);
   if(fixture.id==='porch'){correction=porchPhotoSurface(defs,surface,fixture.color);correction.style.display='none';group.append(correction);}
   if(fixture.id==='garage-wall'){correction=garagePhotoSurface(defs,surface,fixture.color);correction.style.display='none';group.append(correction);}
   if(fixture.id==='workshop-wall'){correction=workshopPhotoSurface(defs,surface,fixture.color);correction.style.display='none';group.append(correction);}
  }
  const pool=document.createElementNS(ns,'path');pool.setAttribute('d',path(outline));pool.setAttribute('fill',`url(#${id})`);pool.setAttribute('filter','url(#yard-lamp-spill)');pool.setAttribute('opacity',fixture.kind==='spot'?'.65':'1');fallback.append(pool);
  if(fixture.kind==='spot'){
   const normal=new Vector3(aim.x,0,aim.z).normalize(),side=new Vector3(-normal.z,0,normal.x).multiplyScalar(2.5),wall=p.clone().addScaledVector(normal,-.03);
   const corners=[wall.clone().sub(side).add(new Vector3(0,.9,0)),wall.clone().add(side).add(new Vector3(0,.9,0)),wall.clone().add(side).setY(ground+.05),wall.clone().sub(side).setY(ground+.05)];
   // Independent facade falloff: brightest beside the fitting, spreading down the white wall.
   const wallGradient=document.createElementNS(ns,'radialGradient');wallGradient.id=id+'-wall';wallGradient.setAttribute('cx','.5');wallGradient.setAttribute('cy','.24');wallGradient.setAttribute('r','.8');wallGradient.innerHTML=`<stop stop-color="${fixture.color}" stop-opacity=".86"/><stop offset=".4" stop-color="${fixture.color}" stop-opacity=".56"/><stop offset=".75" stop-color="${tint}" stop-opacity=".18"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/>`;defs.append(wallGradient);
   const wash=document.createElementNS(ns,'path');wash.setAttribute('d',path(corners));wash.setAttribute('fill',`url(#${id}-wall)`);wash.setAttribute('filter','url(#yard-lamp-spill)');fallback.append(wash);
  }
  const q=project(p);if(q.visible){
   const halo=document.createElementNS(ns,'ellipse');halo.setAttribute('cx',String(q.x));halo.setAttribute('cy',String(q.y));halo.setAttribute('rx','34');halo.setAttribute('ry','27');halo.setAttribute('fill',`url(#${id})`);halo.setAttribute('filter','url(#yard-lamp-soft)');group.append(halo);
   const bloom=document.createElementNS(ns,'ellipse');bloom.setAttribute('cx',String(q.x));bloom.setAttribute('cy',String(q.y));bloom.setAttribute('rx','11');bloom.setAttribute('ry','5');bloom.setAttribute('fill',fixture.color);bloom.setAttribute('opacity','.88');bloom.setAttribute('filter','url(#yard-lamp-soft)');group.append(bloom);
   const bulb=document.createElementNS(ns,'circle');bulb.setAttribute('cx',String(q.x));bulb.setAttribute('cy',String(q.y));bulb.setAttribute('r','2.1');bulb.setAttribute('fill','#fffaf0');group.append(bulb);
  }
  if(fixture.kind==='spot'){
   // A small fitting glow, not a floating floodlight disc over the wall/shadow result.
   const ellipses=group.querySelectorAll('ellipse');ellipses[0]?.setAttribute('rx','17');ellipses[0]?.setAttribute('ry','14');ellipses[1]?.setAttribute('rx','5');ellipses[1]?.setAttribute('ry','3');ellipses[1]?.setAttribute('opacity','.64');
  }
  root.append(group);entries.push({fixture,group,output:0,surface,correction,fallback});
 }
 const windows=yardPhotoWindows(root,defs);
 return{root,fixturesRoot,update(config:SceneConfig,states:Map<string,HassState>,connected:boolean){
  const compatible=yardLightProfile.sourceFrameId===yardPhoto.sourceFrame&&yardLightsCompatible(config),handled=new Set<string>();let active=0;
  fixturesRoot.style.display=root.style.display=compatible?'':'none';
  windows.update(states,connected,compatible);
  for(const entry of entries){const reading=yardLightReading(entry.fixture,config,states,connected&&compatible),output=reading.brightness*Math.min(1.2,entry.fixture.referenceLumens/750);if(compatible)handled.add(reading.entityId);if(reading.brightness>0)active++;
   const activeModel=(config as SceneConfig&{modelExchange?:{active?:{importedSha256?:string}}}).modelExchange?.active;
   const useSurface=!!entry.surface&&entry.surface.dataset.failed!=='true'&&activeModel?.importedSha256===surfaceProfile.modelSha256;
   if(entry.surface)entry.surface.style.display=useSurface?'':'none';entry.fallback.style.display=useSurface?'none':'';
   if(entry.correction)entry.correction.style.display=useSurface?'':'none';
   if(output!==entry.output){entry.output=output;entry.group.style.setProperty('--lamp-output',String(output));entry.group.dataset.on=String(reading.on);}
   // No lingering decorative glow after a lost HA connection or a different model frame.
   entry.group.classList.toggle('is-disconnected',!connected||!compatible);
  }
  root.dataset.activeFixtures=String(active);return handled;
 },dispose(){root.remove();fixturesRoot.remove();}};
}
