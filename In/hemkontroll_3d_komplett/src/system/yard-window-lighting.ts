import * as THREE from 'three';
import surfaceText from './calibration/kyrkas-window-surfaces.json?raw';
import {yardWindowProfile,windowLightOutput,type WindowResponse} from './yard-window-state';
import type {HassState,SceneConfig,Vec3} from './types';
interface WindowSurface{windowId:string;point:Vec3;normal:Vec3;panes:Vec3[][]}
const profile=JSON.parse(surfaceText) as {modelSha256:string;windows:WindowSurface[]};
/** Light emerging through observed panes, separate from hidden indoor fixture positions. */
export class YardWindowLighting{
 readonly root=new THREE.Group();
 private entries:Array<{root:THREE.Group;response:WindowResponse;glass:THREE.MeshBasicMaterial;light:THREE.SpotLight;output:number}>=[];
 private compatible=false;
 constructor(){
  this.root.name='Fönster · fotobaserad ljusrespons';
  for(const surface of profile.windows){
   const response=yardWindowProfile.windows.find(w=>w.id===surface.windowId);if(!response)continue;
   const root=new THREE.Group();root.name=surface.windowId;
   const glass=new THREE.MeshBasicMaterial({color:response.color,transparent:true,opacity:0,depthWrite:false,side:THREE.FrontSide,toneMapped:false});
   const normal=new THREE.Vector3(...surface.normal);
   for(const pane of surface.panes){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pane.flat(),3));geometry.setIndex([0,1,2,0,2,3]);
    const a=new THREE.Vector3(...pane[0]),b=new THREE.Vector3(...pane[1]),c=new THREE.Vector3(...pane[2]);
    if(b.sub(a).cross(c.sub(a)).dot(normal)<0)geometry.setIndex([0,2,1,0,3,2]);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,glass);mesh.renderOrder=2;root.add(mesh);
   }
   const light=new THREE.SpotLight(response.color,0,5,Math.PI/3,.95,2);
   light.position.fromArray(surface.point).addScaledVector(normal,.10);
   light.target.position.fromArray(surface.point).addScaledVector(normal,2);light.target.position.y=.1;
   root.add(light,light.target);root.visible=false;this.root.add(root);
   this.entries.push({root,response,glass,light,output:0});
  }
 }
 configure(config:SceneConfig){
  // Changed geometry needs a new registration, rather than placing glass on another wall.
  this.compatible=config.models[config.activeModel].url===`/workspace-api/models/${profile.modelSha256}.glb`;
 }
 update(states:Map<string,HassState>,connected:boolean,dt:number){
  const blend=1-Math.exp(-Math.max(0,dt)/.25);
  for(const entry of this.entries){
   const target=windowLightOutput(entry.response,states,connected&&this.compatible);
   entry.output+=(target-entry.output)*blend;entry.root.visible=connected&&this.compatible&&entry.output>.001;
   entry.glass.opacity=entry.output*.58;entry.light.power=entry.output*90;entry.light.visible=entry.output>.001;
  }
 }
 extinguish(){for(const entry of this.entries){entry.output=0;entry.glass.opacity=0;entry.light.power=0;entry.root.visible=false;}}
 dispose(){this.root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});for(const entry of this.entries){entry.glass.dispose();entry.light.dispose();}this.entries=[];this.root.removeFromParent();}
}
