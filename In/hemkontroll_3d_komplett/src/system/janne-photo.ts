import {Matrix4,Quaternion,Euler,Vector3} from 'three';
import calibration from './calibration/janne-photo-camera.json';
import type {CameraView,ModelConfig,Vec3} from './types';
export const jannePhoto={id:'janne',width:1672,height:941,sourceFrame:calibration.sourceFrame,widths:[640,960,1280,1672],
 image:(width:number)=>'/images/yard/janne/foreground-'+width+'.webp',
 calibration,variants:[] as Array<{light:'day'|'night'|'evening';image:(width:number)=>string}>};
export function jannePhotoView(model:ModelConfig):CameraView{
 const transform=new Matrix4().compose(new Vector3(...model.position),new Quaternion().setFromEuler(new Euler(...model.rotation.map(v=>v*Math.PI/180) as Vec3,'YXZ')),new Vector3().setScalar(model.scale));
 return{...calibration.sourceView,position:new Vector3(...calibration.sourceView.position as Vec3).applyMatrix4(transform).toArray() as Vec3,target:new Vector3(...calibration.sourceView.target as Vec3).applyMatrix4(transform).toArray() as Vec3};
}
/** Reserved overlay layout; intentionally contains no cards until the owner adds them. */
export const janneOverlayLayout={photoId:'janne',cards:[] as Array<{id:string;x:number;y:number;width:number}>};
