import * as THREE from 'three';
import profileText from './calibration/kyrkas-night-2026-11-03.json?raw';
import type {HassState,SceneConfig,Vec3} from './types';
import {yardFixtureVisual} from './yard-fixture-visual';
import {YardWindowLighting} from './yard-window-lighting';
import {YardStringLighting,type YardStringProfile} from './yard-string-lighting';

export interface YardLightFixture{
 id:string;label:string;kind:'spot'|'point';position:Vec3;target:Vec3;color:string;
 referenceLumens:number;range:number;beamAngle:number;penumbra:number;fillFraction:number;enabled:boolean;
 binding:{entityId:string;sceneObjectId?:string};
 mountStyle?:'wall-lantern'|'post-lantern'|'wall-downlight'|'rustic-pendant';
 threeDOnly?:boolean;
}
interface Profile{schemaVersion:number;id:string;status:string;sourceFrameId:string;fixtures:YardLightFixture[];strings?:YardStringProfile[]}
const profile=JSON.parse(profileText.trimStart()) as Profile;
const vector=(v:unknown):v is Vec3=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<200);
const valid=profile.schemaVersion===1&&profile.sourceFrameId==='yard380-gltf-v1'&&profile.fixtures.length<=12&&profile.fixtures.every(f=>
 ['spot','point'].includes(f.kind)&&vector(f.position)&&vector(f.target)&&/^#[a-f\d]{6}$/i.test(f.color)&&/^(light|switch)\.[a-z0-9_]+$/.test(f.binding.entityId)&&
 [f.referenceLumens,f.range,f.beamAngle,f.penumbra,f.fillFraction].every(Number.isFinite)&&f.referenceLumens>=0&&f.referenceLumens<=5000&&f.range>0&&f.range<=30&&f.beamAngle>=5&&f.beamAngle<=150&&f.penumbra>=0&&f.penumbra<=1&&f.fillFraction>=0&&f.fillFraction<=.5);

export const yardLightProfile=profile;
export function yardLightsCompatible(config:SceneConfig){
 const active=(config as SceneConfig&{modelExchange?:{active?:{sourceFrameId?:string;importedSha256?:string}}}).modelExchange?.active;
 return valid&&!!active&&active.sourceFrameId===profile.sourceFrameId&&!!active.importedSha256&&config.models[config.activeModel].url===`/workspace-api/models/${active.importedSha256}.glb`;
}
export function yardLightReading(fixture:YardLightFixture,config:SceneConfig,states:Map<string,HassState>,connected:boolean){
 const mapped=fixture.binding.sceneObjectId?config.objects.find(o=>o.id===fixture.binding.sceneObjectId):undefined;
 const entityId=mapped?mapped.entityId:fixture.binding.entityId,state=states.get(entityId),on=connected&&state?.state==='on';
 const b=state?.attributes.brightness,brightness=typeof b==='number'&&Number.isFinite(b)?Math.max(0,Math.min(1,b/255)):1;
 return{entityId,on,brightness:on?brightness:0};
}

/** Separate source-frame light rig. Never mutates the model, scene placements or HA.
 * Photo estimates are deliberately not labelled measured lux/lumens or surveyed positions.
 */
export class YardLightCalibration{
 readonly root=new THREE.Group();
 private windows=new YardWindowLighting();
 private strings=new YardStringLighting(profile.strings??[]);
 private entries:Array<{fixture:YardLightFixture;light:THREE.PointLight|THREE.SpotLight;fill?:THREE.PointLight;bulb:THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>;visual:ReturnType<typeof yardFixtureVisual>}>=[];
 private compatible=false;private expectedModel='';private config?:SceneConfig;
 constructor(){
  this.root.name='Gårdsbelysning · provisorisk nattfotokalibrering';this.root.visible=false;
  this.root.userData={profileId:profile.id,status:profile.status,physicalAlignmentVerified:false,absolutePhotometryVerified:false,sourceFrameId:profile.sourceFrameId};
  if(!valid)return;
  this.root.add(this.windows.root,this.strings.root);
  for(const fixture of profile.fixtures.filter(f=>f.enabled)){
   const light=fixture.kind==='point'?new THREE.PointLight(fixture.color,0,fixture.range,2):new THREE.SpotLight(fixture.color,0,fixture.range,THREE.MathUtils.degToRad(fixture.beamAngle/2),fixture.penumbra,2);
   light.name=fixture.label+' · uppskattad ljusprofil';light.position.fromArray(fixture.position);
   if(light instanceof THREE.SpotLight){light.target.position.fromArray(fixture.target);this.root.add(light.target);}
   light.shadow.mapSize.set(512,512);light.shadow.normalBias=.04;light.visible=false;
   // Share, rather than add to, the fixture's power between its main cone and broad spill.
   const fill=fixture.fillFraction>0?new THREE.PointLight(fixture.color,0,fixture.range*.55,2):undefined;
   if(fill){fill.position.copy(light.position);fill.visible=false;this.root.add(fill);}
   const bulb=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:fixture.color}));
   bulb.name=fixture.label+' · uppskattad armaturposition';bulb.position.copy(light.position);bulb.visible=false;
   const visual=yardFixtureVisual(fixture);if(visual)this.root.add(visual.root);
   this.root.add(light,bulb);this.entries.push({fixture,light,fill,bulb,visual});
  }
 }
 configure(config:SceneConfig){
  this.windows.configure(config);
  this.config=config;const model=config.models[config.activeModel];
  this.expectedModel=model.url;
  this.compatible=yardLightsCompatible(config);
  this.root.position.fromArray(model.position);this.root.rotation.set(...model.rotation.map(THREE.MathUtils.degToRad) as Vec3,'YXZ');this.root.scale.setScalar(model.scale);
  for(const entry of this.entries){entry.light.distance=entry.fixture.range*model.scale;if(entry.fill)entry.fill.distance=entry.fixture.range*.55*model.scale;entry.light.castShadow=this.compatible&&config.quality!=='low'&&['porch','coop-front','harbre-door'].includes(entry.fixture.id);}
  if(!this.compatible)this.extinguish();
 }
 update(states:Map<string,HassState>,connected:boolean,dt:number,loadedModelUrl:unknown){
  // A failed load or another source frame must never put this rig on the fallback property.
  const visible=this.compatible&&loadedModelUrl===this.expectedModel;
  this.root.visible=visible;
  if(!visible||!connected){this.extinguish();return;}
  this.windows.update(states,connected,dt);
  if(this.config)this.strings.update(states,connected,dt,this.config);
  const blend=1-Math.exp(-Math.max(0,Math.min(dt,1))/.25);let active=0;
  for(const {fixture,light,fill,bulb,visual} of this.entries){
   // An explicit cleared binding remains cleared. Only an absent object uses the profile default.
   const {on,brightness}=this.config?yardLightReading(fixture,this.config,states,connected):{on:false,brightness:0};
   const power=on?fixture.referenceLumens*brightness*(this.config?.models[this.config.activeModel].scale??1)**2:0;
   light.power+=(power*(1-fixture.fillFraction)-light.power)*blend;
   if(fill){fill.power+=(power*fixture.fillFraction-fill.power)*blend;fill.visible=fill.power>.05;}
   light.visible=light.power>.05;bulb.visible=on&&brightness>0&&fixture.mountStyle!=='wall-downlight';
   if(visual)visual.glass.emissiveIntensity+=(on?brightness*1.6-visual.glass.emissiveIntensity:-visual.glass.emissiveIntensity)*blend;
   if(on)active++;
  }
  this.root.userData.activeFixtures=active;
 }
 private extinguish(){this.windows.extinguish();this.strings.extinguish();for(const {light,fill,bulb,visual} of this.entries){light.power=0;light.visible=false;if(fill){fill.power=0;fill.visible=false;}bulb.visible=false;if(visual)visual.glass.emissiveIntensity=0;}this.root.userData.activeFixtures=0;}
 dispose(){this.extinguish();this.windows.dispose();this.strings.dispose();for(const {light,fill,bulb,visual} of this.entries){light.dispose();fill?.dispose();bulb.geometry.dispose();bulb.material.dispose();visual?.dispose();}this.entries=[];this.root.clear();this.root.removeFromParent();}
}
