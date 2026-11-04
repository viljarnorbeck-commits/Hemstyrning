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
 if(fixture.mountStyle==='post-lantern'){
  const foot=new THREE.Vector3(p.x,fixture.target[1],p.z),height=Math.max(.1,p.y-foot.y-.14);
  add(new THREE.CylinderGeometry(yardFixtureSize.poleRadius,yardFixtureSize.poleRadius*1.3,height,10),foot.clone().add(new THREE.Vector3(0,height/2,0)));
  add(new THREE.CylinderGeometry(.075,.095,.06,12),foot.clone().add(new THREE.Vector3(0,.03,0)));
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
