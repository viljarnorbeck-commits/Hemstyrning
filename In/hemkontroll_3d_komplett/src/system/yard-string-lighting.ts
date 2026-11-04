import * as THREE from 'three';
import type {HassState,SceneConfig,Vec3} from './types';
export interface YardStringProfile{id:string;points:Vec3[];bulbs:number;colors:string[];sag:number;binding:{entityId:string}}
/** Separate cable/bulb geometry in the permanent source frame, using confirmed HA state. */
export class YardStringLighting{
 readonly root=new THREE.Group();
 private entries:Array<{profile:YardStringProfile;glass:THREE.MeshStandardMaterial[];lights:THREE.PointLight[];output:number}>=[];
 constructor(profiles:YardStringProfile[]){
  for(const profile of profiles){
   if(profile.points.length<2||profile.points.length>8||profile.bulbs<2||profile.bulbs>32||!profile.colors.length)continue;
   const metal=new THREE.MeshStandardMaterial({color:'#242727',roughness:.85}),points=profile.points.map(p=>new THREE.Vector3(...p));
   const curve=new THREE.CurvePath<THREE.Vector3>();
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],mid=a.clone().lerp(b,.5);mid.y-=profile.sag;
    curve.add(new THREE.QuadraticBezierCurve3(a,mid,b));
   }
   const group=new THREE.Group();group.name=profile.id;
   group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,64,.007,5,false),metal));
   const glass=profile.colors.map(color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0,roughness:.28})),lights:THREE.PointLight[]=[];
   for(let i=0;i<profile.bulbs;i++){
    const position=curve.getPoint((i+.35)/profile.bulbs),socket=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.035,6),metal);socket.position.copy(position);group.add(socket);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.034,8,6),glass[i%glass.length]);bulb.scale.y=1.15;bulb.position.copy(position);bulb.position.y-=.045;group.add(bulb);
   }
   // Two gentle real lights provide local spill; every bulb remains separate visible geometry.
   for(const fraction of [.25,.75]){const light=new THREE.PointLight(profile.colors[Math.floor(fraction*profile.colors.length)],0,3,2);light.position.copy(curve.getPoint(fraction));light.position.y-=.08;lights.push(light);group.add(light);}
   this.root.add(group);this.entries.push({profile,glass,lights,output:0});
  }
 }
 update(states:Map<string,HassState>,connected:boolean,dt:number,config:SceneConfig){
  const scale=config.models[config.activeModel].scale,blend=1-Math.exp(-Math.max(0,dt)/.25);
  for(const entry of this.entries){
   const state=states.get(entry.profile.binding.entityId),brightness=state?.attributes.brightness;
   const target=connected&&state?.state==='on'?(typeof brightness==='number'&&Number.isFinite(brightness)?THREE.MathUtils.clamp(brightness/255,0,1):1):0;
   entry.output+=(target-entry.output)*blend;
   for(const material of entry.glass)material.emissiveIntensity=entry.output*2;
   for(const light of entry.lights){light.power=entry.output*22*scale*scale;light.distance=3*scale;light.visible=entry.output>.001;}
  }
 }
 extinguish(){for(const entry of this.entries){entry.output=0;entry.glass.forEach(m=>m.emissiveIntensity=0);entry.lights.forEach(l=>{l.power=0;l.visible=false;});}}
 dispose(){const materials=new Set<THREE.Material>();this.root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}if(o instanceof THREE.Light)o.dispose();});materials.forEach(m=>m.dispose());this.entries=[];this.root.removeFromParent();}
}
