import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { ModelConfig, Season, SceneConfig } from './types';

export function applyCalibration(group: THREE.Group, config: ModelConfig) {
  group.position.fromArray(config.position);
  // Apply up-axis correction first, then yaw around the world's Y axis.
  group.rotation.set(...config.rotation.map(THREE.MathUtils.degToRad) as [number, number, number], 'YXZ');
  group.scale.setScalar(config.scale);
  group.updateMatrixWorld(true);
}
export function disposeTree(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(o => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Line) {
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m);
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
      }
    }
    if (o instanceof THREE.Light) o.dispose();
  });
  geometries.forEach(g => {g.disposeBoundsTree?.();g.dispose();}); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
}
/** Only model roots are calibrated; the independent object root never changes. Two-asset LRU bounds GPU memory. */
export class ModelManager {
  readonly root = new THREE.Group();
  constructor(private loader: Pick<GLTFLoader, 'loadAsync'> = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)) {}
  private cache = new Map<string, THREE.Group>();
  private serial = 0;
  grading:SceneConfig['appearance'];
  anisotropy=8;detail=false;reference=false;neutral=false;
  private originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
  setNeutral(value:boolean){this.neutral=value;for(const [mesh,original] of this.originals){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();mesh.material=original;}this.originals.clear();if(value)this.root.traverse(o=>{if(o instanceof THREE.Mesh){this.originals.set(o,o.material);const convert=(m:THREE.Material)=>{const source=m as THREE.MeshStandardMaterial;return new THREE.MeshBasicMaterial({map:source.map??null,color:source.color?.clone()??new THREE.Color('white'),vertexColors:source.vertexColors,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest});};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});}

  private wetness=0;
  active: Season | null = null;
  status = 'Laddar gårdsmodell…';
  loading = false;
  private requested = '';
  onStatus = () => {};
  async select(season: Season, config: ModelConfig) {
    if(this.reference&&config.url==='/models/daniels.glb')config={...config,url:'/models/daniels-reference.glb'};
    if(this.detail&&config.url==='/models/daniels.glb')config={...config,url:'/models/daniels-detail.glb'};
    const key = JSON.stringify([season, config]);
    if (key === this.requested) return;
    this.requested = key;
    const serial = ++this.serial;
    this.loading = true;
    this.status = 'Laddar gårdsmodell…'; this.onStatus();
    try {
      let model = this.cache.get(config.url);
      if (!model) {
        const gltf = await this.loader.loadAsync(config.url, event => {
          if (serial !== this.serial) return;
          this.status = `Laddar gården · ${event.total ? Math.round(event.loaded / event.total * 100) + ' %' : (event.loaded / 1048576).toFixed(0) + ' MB'}`;
          this.onStatus();
        });
        model = gltf.scene;
        if (serial !== this.serial) { disposeTree(model); return; }
        model.traverse(o => { if (o instanceof THREE.Mesh) {
          o.castShadow=true;o.receiveShadow=true;
          if(!o.geometry.getAttribute('normal'))o.geometry.computeVertexNormals();
          o.geometry.computeBoundsTree({targetLeafSize:10});
          for(const material of Array.isArray(o.material)?o.material:[o.material]){
            if(material instanceof THREE.MeshStandardMaterial){
              material.flatShading=false;material.roughness=Math.max(.7,material.roughness);material.metalness=0;
              for(const texture of Object.values(material))if(texture instanceof THREE.Texture){texture.anisotropy=this.anisotropy;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;}
              material.onBeforeCompile=shader=>{
                shader.uniforms.gardenWarmth={value:this.grading?.warmth??.035};shader.uniforms.gardenSaturation={value:this.grading?.saturation??1.08};shader.uniforms.gardenContrast={value:this.grading?.contrast??1.04};material.userData.grading=[shader.uniforms.gardenWarmth,shader.uniforms.gardenSaturation,shader.uniforms.gardenContrast];
                shader.uniforms.gardenWetness={value:this.wetness};material.userData.wetUniform=shader.uniforms.gardenWetness;
                shader.vertexShader='varying float gardenUp;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngardenUp = max(0.,normalize(mat3(modelMatrix)*normal).y);');
                shader.fragmentShader='uniform float gardenWarmth;uniform float gardenSaturation;uniform float gardenContrast;uniform float gardenWetness;varying float gardenUp;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= vec3(1.+gardenWarmth,1.,1.-gardenWarmth*.7);float gardenLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(gardenLuma),diffuseColor.rgb,gardenSaturation);diffuseColor.rgb=max(vec3(0.),(diffuseColor.rgb-vec3(.18))*gardenContrast+vec3(.18));diffuseColor.rgb *= mix(1.,.65,gardenWetness*smoothstep(.35,.85,gardenUp));').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor,.25,gardenWetness*smoothstep(.35,.85,gardenUp));');
              };
              material.needsUpdate=true;
            }
          }
        }});
        this.cache.set(config.url, model);
      }
      if (serial !== this.serial) return;
      this.cache.delete(config.url); this.cache.set(config.url, model);
      const neutral=this.neutral;this.setNeutral(false);this.root.clear();
      const calibrated = new THREE.Group();
      calibrated.add(model); applyCalibration(calibrated, config);
      this.root.add(calibrated);this.setNeutral(neutral);
      this.active = season;
      for (const [url, cached] of this.cache) {
        if (this.cache.size <= 2) break;
        if (url !== config.url) { this.cache.delete(url); disposeTree(cached); }
      }
      this.status = config.verified ? config.label : `${config.label} · referensmodell, årstid ej verifierad`;
    } catch (error) {
      this.status = 'Modellen kunde inte laddas. Föregående modell visas. Välj annan årstid eller ladda om sidan.';
      console.error(error);
    } finally { if (serial === this.serial) { this.loading = false; this.onStatus(); } }
  }
  setWetness(value:number){
    this.wetness+=(value-this.wetness)*.015;
    this.root.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(m.userData.wetUniform)m.userData.wetUniform.value=this.wetness;
      if(m.userData.grading){m.userData.grading[0].value=this.grading?.warmth??.035;m.userData.grading[1].value=this.grading?.saturation??1.08;m.userData.grading[2].value=this.grading?.contrast??1.04;}
    }}});
  }
  dispose() { this.setNeutral(false);++this.serial; this.cache.forEach(disposeTree); this.cache.clear(); }
}
