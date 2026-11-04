import * as THREE from 'three';
import type {YardLightFixture} from './yard-light-calibration';

/** Provisional lantern geometry; no change to the scanned property mesh. */
export const yardFixtureSize={poleRadius:.028,globeRadius:.11,globeHeight:.24,capRadius:.15};
export function yardFixtureVisual(fixture:YardLightFixture){
 if(!fixture.mountStyle)return undefined;
 const root=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:'#3b4246',metalness:.55,roughness:.48}),glass=new THREE.MeshStandardMaterial({color:'#d0d5cf',metalness:0,roughness:.38,emissive:fixture.color,emissiveIntensity:0});
 root.name=fixture.label+' · provisorisk armatur';
 const p=new THREE.Vector3(...fixture.position);
 const add=(geometry:THREE.BufferGeometry,position:THREE.Vector3,material=metal)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(position);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;};
 if(fixture.mountStyle==='rustic-pendant'){
  const wood=new THREE.MeshStandardMaterial({color:'#75694f',roughness:.95}),normal=new THREE.Vector3(...fixture.target).sub(p).setY(0).normalize(),side=new THREE.Vector3(normal.z,0,-normal.x);
  const local=(x:number,y:number,z:number)=>p.clone().addScaledVector(side,x).addScaledVector(normal,z).add(new THREE.Vector3(0,y,0));
  const bracket=new THREE.CatmullRomCurve3([local(-.22,-.50,-.14),local(-.25,-.20,-.06),local(-.22,.17,.01),local(-.10,.28,.01),local(.03,.24,0)]);
  add(new THREE.TubeGeometry(bracket,18,.038,7,false),new THREE.Vector3(),wood);
  const anchor=add(new THREE.BoxGeometry(.065,.38,.045),local(-.22,-.25,-.16),wood);anchor.rotation.y=Math.atan2(normal.x,normal.z);
  metal.color.set('#5a5140');add(new THREE.CylinderGeometry(.051,.051,.065,10),local(0,.12,0));
  const diffuser=add(new THREE.SphereGeometry(.058,12,10),p.clone(),glass);diffuser.scale.set(1,1.8,1);diffuser.castShadow=false;
  return{root,glass,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});metal.dispose();glass.dispose();wood.dispose();root.removeFromParent();}};
 }
 if(fixture.mountStyle==='wall-downlight'){
  // Small hooded fitting above the coop doors; the illuminated face points down/out.
  metal.color.set('#292c2d');metal.roughness=.72;
  const direction=new THREE.Vector3(...fixture.target).sub(p).normalize(),normal=direction.clone().setY(0).normalize();
  const plate=add(new THREE.BoxGeometry(.075,.12,.025),p.clone().addScaledVector(normal,-.16).add(new THREE.Vector3(0,.06,0)));plate.rotation.y=Math.atan2(normal.x,normal.z);
  const arm=add(new THREE.CylinderGeometry(.012,.012,.16,6),p.clone().addScaledVector(normal,-.08).add(new THREE.Vector3(0,.055,0)));arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
  const head=add(new THREE.CylinderGeometry(.07,.095,.055,16),p.clone().addScaledVector(direction,-.03));head.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),direction);
  const lens=add(new THREE.CylinderGeometry(.077,.077,.009,16),p.clone(),glass);lens.quaternion.copy(head.quaternion);lens.castShadow=false;
  // Keep the source aperture clear rather than shadowing it with its own housing.
  head.castShadow=false;
  return{root,glass,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});metal.dispose();glass.dispose();root.removeFromParent();}};
 }
 if(fixture.mountStyle==='wall-lantern'){
  // Reference photograph: hanging, tapered four-pane lantern, not an oval bulkhead.
  metal.color.set('#25282a');metal.metalness=.35;metal.roughness=.65;
  glass.color.set('#a9b4b2');glass.roughness=.18;
  const normal=new THREE.Vector3(...fixture.target).sub(p).setY(0).normalize(),side=new THREE.Vector3(normal.z,0,-normal.x);
  const local=(x:number,y:number,z:number)=>p.clone().addScaledVector(side,x).addScaledVector(normal,z).add(new THREE.Vector3(0,y,0));
  const yaw=Math.atan2(normal.x,normal.z);
  const plate=add(new THREE.BoxGeometry(.075,.25,.035),local(0,.22,-.20));plate.rotation.y=yaw;
  const arm=new THREE.CatmullRomCurve3([local(0,.15,-.18),local(0,.32,-.17),local(0,.34,-.07),local(0,.28,0)]);
  add(new THREE.TubeGeometry(arm,12,.014,6,false),new THREE.Vector3());
  const pane=add(new THREE.CylinderGeometry(.145,.085,.27,4,1,false,Math.PI/4),p.clone(),glass);pane.rotation.y=yaw;pane.castShadow=false;
  const roof=add(new THREE.ConeGeometry(.205,.12,4,1,false,Math.PI/4),local(0,.195,0));roof.rotation.y=yaw;
  const rim=add(new THREE.CylinderGeometry(.205,.205,.018,4,1,false,Math.PI/4),local(0,.137,0));rim.rotation.y=yaw;
  const base=add(new THREE.CylinderGeometry(.085,.048,.05,4,1,false,Math.PI/4),local(0,-.16,0));base.rotation.y=yaw;
  add(new THREE.SphereGeometry(.022,8,6),local(0,.27,0));
  add(new THREE.ConeGeometry(.027,.075,8),local(0,-.22,0)).rotation.z=Math.PI;
  for(const x of [-1,1])for(const z of [-1,1]){
   const a=local(x*.1025,.135,z*.1025),b=local(x*.06,-.135,z*.06),direction=b.clone().sub(a);
   const rail=add(new THREE.CylinderGeometry(.007,.007,direction.length(),5),a.clone().add(b).multiplyScalar(.5));rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  }
  return{root,glass,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});metal.dispose();glass.dispose();root.removeFromParent();}};
 }
 if(fixture.mountStyle==='post-lantern'){
  const foot=new THREE.Vector3(p.x,fixture.target[1],p.z),height=Math.max(.1,p.y-foot.y-.14);
  metal.color.set('#262d2d');metal.metalness=.35;metal.roughness=.67;
  add(new THREE.CylinderGeometry(yardFixtureSize.poleRadius,yardFixtureSize.poleRadius*1.3,height,10),foot.clone().add(new THREE.Vector3(0,height/2,0)));
  // The reference shows a slender dark shaft, a flared lower sleeve and narrow rings.
  add(new THREE.CylinderGeometry(.043,.075,Math.min(.30,height*.25),12),foot.clone().add(new THREE.Vector3(0,Math.min(.15,height*.125),0)));
  add(new THREE.CylinderGeometry(.075,.085,.035,12),foot.clone().add(new THREE.Vector3(0,.018,0)));
  for(const y of [.30,.34])if(y<height)add(new THREE.CylinderGeometry(.046,.046,.018,12),foot.clone().add(new THREE.Vector3(0,y,0)));
  add(new THREE.CylinderGeometry(.05,.034,.09,12),p.clone().add(new THREE.Vector3(0,-.18,0)));
  const pane=add(new THREE.CylinderGeometry(.105,.075,.24,6),p.clone(),glass);pane.castShadow=false;
  add(new THREE.ConeGeometry(.15,.08,6),p.clone().add(new THREE.Vector3(0,.16,0)));
  add(new THREE.CylinderGeometry(.105,.075,.035,6),p.clone().add(new THREE.Vector3(0,-.135,0)));
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3,a=p.clone().add(new THREE.Vector3(Math.sin(angle)*.105,.12,Math.cos(angle)*.105)),b=p.clone().add(new THREE.Vector3(Math.sin(angle)*.075,-.12,Math.cos(angle)*.075)),direction=b.clone().sub(a);
   const rail=add(new THREE.CylinderGeometry(.005,.005,direction.length(),5),a.clone().add(b).multiplyScalar(.5));rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  }
  return{root,glass,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});metal.dispose();glass.dispose();root.removeFromParent();}};
 }else{
  const normal=new THREE.Vector3(...fixture.target).sub(p).setY(0).normalize(),mount=p.clone().addScaledVector(normal,-.14);
  const plate=add(new THREE.BoxGeometry(.12,.28,.035),mount);plate.rotation.y=Math.atan2(normal.x,normal.z);
  const arm=add(new THREE.CylinderGeometry(.018,.018,.16,8),p.clone().addScaledVector(normal,-.08).add(new THREE.Vector3(0,-.12,0)));arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
 }
 const globe=add(new THREE.SphereGeometry(yardFixtureSize.globeRadius,14,10),p.clone(),glass);globe.scale.y=yardFixtureSize.globeHeight/(yardFixtureSize.globeRadius*2);globe.castShadow=false;
 add(new THREE.ConeGeometry(yardFixtureSize.capRadius,.09,12),p.clone().add(new THREE.Vector3(0,.15,0)));
 add(new THREE.CylinderGeometry(.12,.09,.045,12),p.clone().add(new THREE.Vector3(0,-.14,0)));
 for(const x of [-1,1])for(const z of [-1,1])add(new THREE.CylinderGeometry(.009,.009,.25,5),p.clone().add(new THREE.Vector3(x*.078,0,z*.078)));
 return{root,glass,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});metal.dispose();glass.dispose();root.removeFromParent();}};
}
