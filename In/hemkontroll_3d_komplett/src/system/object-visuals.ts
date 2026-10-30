import * as THREE from 'three';
import {RoundedBoxGeometry}from'three/addons/geometries/RoundedBoxGeometry.js';
export function carVisual(color:string){const root=new THREE.Group(),bodyMaterial=new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.45}),body=new THREE.Mesh(new RoundedBoxGeometry(1.8,.65,4.2,2,.18),bodyMaterial);body.position.y=.65;root.add(body);const cabin=new THREE.Mesh(new RoundedBoxGeometry(1.48,.65,2.25,2,.2),new THREE.MeshStandardMaterial({color:'#24404e',roughness:.18,metalness:.25}));cabin.position.set(0,1.15,-.15);root.add(cabin);const wheelGeometry=new THREE.CylinderGeometry(.3,.3,.19,16),wheelMaterial=new THREE.MeshStandardMaterial({color:'#1c2224',roughness:.9});for(const x of[-.87,.87])for(const z of[-1.3,1.3]){const wheel=new THREE.Mesh(wheelGeometry,wheelMaterial);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.32,z);root.add(wheel);}root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return root;}

/** Deliberately generic test robot; imported assets replace this entire group. */
export function mowerVisual(){
 const root=new THREE.Group();root.userData.proxy=true;
 const shell=new THREE.MeshStandardMaterial({color:'#e3e5df',metalness:.18,roughness:.3});
 const dark=new THREE.MeshStandardMaterial({color:'#171e26',roughness:.72});
 const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 add(new RoundedBoxGeometry(.55,.19,.77,2,.07),dark,0,.19,0);
 add(new RoundedBoxGeometry(.48,.12,.65,2,.06),shell,0,.32,-.025);
 add(new RoundedBoxGeometry(.2,.07,.19,2,.025),dark,0,.41,.12);
 for(const x of[-.28,.28])for(const z of[-.27,.27]){const wheel=add(new THREE.CylinderGeometry(.145,.145,.105,16),dark,x,.15,z);wheel.rotation.z=Math.PI/2;const hub=add(new THREE.CylinderGeometry(.075,.075,.11,12),shell,x,.15,z);hub.rotation.z=Math.PI/2;}
 add(new THREE.BoxGeometry(.31,.025,.015),new THREE.MeshStandardMaterial({color:'#a9d7ec',roughness:.2}),0,.32,-.36);
 return root;
}
