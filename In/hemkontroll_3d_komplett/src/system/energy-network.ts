import * as THREE from 'three';
import type{EnergyRoute,HassState}from'./types';
import{routePower}from'./presentation-state';
import{disposeTree}from'./models';
/** Explicit schematic x-ray. Never changes scan materials or controls physical equipment. */
export class EnergyNetwork{
 readonly root=new THREE.Group();enabled=false;private signature='';private elapsed=0;
 private cables:{route:EnergyRoute;curve:THREE.CatmullRomCurve3;pulses:THREE.Mesh[];material:THREE.MeshBasicMaterial}[]=[];
 update(routes:EnergyRoute[],states:Map<string,HassState>,connected:boolean,dt:number){
  this.root.visible=this.enabled;if(!this.enabled)return;
  const signature=JSON.stringify(routes);if(signature!==this.signature){disposeTree(this.root);this.root.clear();this.cables=[];this.signature=signature;
   for(const route of routes){const curve=new THREE.CatmullRomCurve3(route.points.map(p=>new THREE.Vector3(...p)),false,'centripetal');const material=new THREE.MeshBasicMaterial({color:route.color,transparent:true,opacity:.45,depthTest:false,depthWrite:false});const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.min(160,route.points.length*16),.055,5,false),material);cable.renderOrder=20;this.root.add(cable);
    const pulses=Array.from({length:4},()=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.13,7,5),new THREE.MeshBasicMaterial({color:route.color,depthTest:false,depthWrite:false}));mesh.renderOrder=21;this.root.add(mesh);return mesh;});this.cables.push({route,curve,pulses,material});}
  }
  this.elapsed+=dt;for(const c of this.cables){const power=routePower(c.route,states,connected);c.material.opacity=power===null?.18:.5;for(let i=0;i<c.pulses.length;i++){const p=c.pulses[i];p.visible=power!==null&&Math.abs(power)>.02;if(p.visible){let t=(this.elapsed*.12+i/4)%1;if(power!<0)t=1-t;p.position.copy(c.curve.getPoint(t));p.scale.setScalar(Math.min(1.8,.7+Math.sqrt(Math.abs(power!))*.25));}}}
 }
 dispose(){disposeTree(this.root);this.root.clear();}
}
