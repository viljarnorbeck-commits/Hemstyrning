import * as THREE from 'three';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{MeshoptDecoder}from'three/addons/libs/meshopt_decoder.module.js';
import{disposeTree}from'./models';
import type{ObjectAsset}from'./types';
/** Each placed object owns its GPU resources. Stale async loads are disposed, never inserted. */
export class ObjectAssets{
 private pending=0;get loading(){return this.pending>0;}
 private serial=0;private loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 reset(){this.serial++;}
 async attach(group:THREE.Group,asset:ObjectAsset){const serial=this.serial;this.pending++;try{const gltf=await this.loader.loadAsync(asset.url);if(serial!==this.serial){disposeTree(gltf.scene);return;}for(const child of [...group.children]){if(child instanceof THREE.Light||child.userData.lightTarget)continue;group.remove(child);disposeTree(child);}const pivot=new THREE.Group();pivot.rotation.set(...asset.rotation.map(THREE.MathUtils.degToRad) as [number,number,number],'YXZ');pivot.scale.setScalar(asset.scale);gltf.scene.position.fromArray(asset.origin).negate();pivot.add(gltf.scene);const ground=new THREE.Group();ground.position.y=asset.groundOffset;ground.add(pivot);group.add(ground);gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof THREE.Texture)v.anisotropy=8;}});group.userData.assetStatus='loaded';}catch{if(serial===this.serial)group.userData.assetStatus='Import kunde inte visas · testgeometri';}finally{this.pending--;}}
}
