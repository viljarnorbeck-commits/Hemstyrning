import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { modelPlacement } from './model-transform.js';

/** Render the scanned property beneath the existing interactive HUD. */
export function createGardenModel() {
  const status = document.getElementById('modelStatus');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.domElement.id = 'gardenModel';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  document.body.prepend(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1500);
  const ambient = new THREE.HemisphereLight(0xeaf5ff, 0x78846c, 2.5);
  const sun = new THREE.DirectionalLight(0xffefd9, 2);
  sun.position.set(30, 70, 40);
  scene.add(ambient, sun);
  let ready = false;
  let width = 0, height = 0;
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    status.textContent = '3D-visningen avbröts. Ladda om sidan. Enhetslistan är tillgänglig.';
    status.hidden = false;
  });
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('/models/daniels.glb', (gltf) => {
    const model = gltf.scene;
    model.rotation.x = -Math.PI / 2;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const { scale, offset } = modelPlacement(bounds.min.toArray(), bounds.max.toArray());
    const root = new THREE.Group();
    root.add(model);
    root.scale.setScalar(scale);
    root.position.fromArray(offset);
    scene.add(root);
    ready = true;
    status.textContent = 'Daniels · geometri (texturfil saknas)';
    status.dataset.state = 'ready';
  }, (progress) => {
    status.textContent = progress.total ? `Laddar gården · ${Math.round(progress.loaded / progress.total * 100)} %` : `Laddar gården · ${(progress.loaded / 1048576).toFixed(0)} MB`;
  }, (error) => {
    console.error('Kunde inte läsa gårdsmodellen', error);
    status.textContent = 'Modellen kunde inte laddas. Ladda om för att försöka igen. Enhetslistan är tillgänglig.';
    status.dataset.state = 'error';
  });
  return ({ eye, forward, focal, W, H, night }) => {
    if (W !== width || H !== height) {
      width = W; height = H;
      renderer.setSize(W, H, false);
    }
    camera.aspect = W / H;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(H / (2 * focal)));
    camera.setViewOffset(W, H, 0, -H * 0.02, W, H);
    camera.position.fromArray(eye);
    camera.lookAt(eye[0] + forward[0], eye[1] + forward[1], eye[2] + forward[2]);
    camera.updateProjectionMatrix();
    scene.background = new THREE.Color(night ? '#263e49' : '#a7c7d1');
    renderer.toneMappingExposure = 1;
    ambient.intensity = night ? 1.1 : 2.5;
    sun.intensity = night ? 0.4 : 2;
    if (ready) renderer.render(scene, camera);
    else renderer.clear();
  };
}
