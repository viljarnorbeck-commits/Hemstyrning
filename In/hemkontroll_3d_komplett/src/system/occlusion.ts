import * as THREE from 'three';
/** Raycast only scene geometry; screen-space marker displacement never bypasses this test. */
export function isOccluded(camera:THREE.Camera,point:THREE.Vector3,roots:THREE.Object3D[],ray=new THREE.Raycaster(),tolerance=.25){
 const origin=camera.getWorldPosition(new THREE.Vector3()),delta=point.clone().sub(origin),distance=delta.length();if(distance<.1)return false;
 ray.set(origin,delta.multiplyScalar(1/distance));ray.near=.05;ray.far=Math.max(.05,distance-tolerance);ray.firstHitOnly=true;
 return ray.intersectObjects(roots,true).some(hit=>hit.distance<distance-tolerance);
}
