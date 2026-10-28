import type { Vec3 } from './types';
export interface GeoPoint { latitude:number; longitude:number; altitude?:number }
import {geographicToLocal,localToGeographic} from '../../../../shared/geography.js';
export {geographicToLocal,localToGeographic};
const rad=Math.PI/180;
export interface ControlPoint { world:Vec3; geo:GeoPoint }
export function fitCalibration(points:ControlPoint[],origin:GeoPoint,northOffset=0){
 if(points.length<3)throw new Error('Minst tre referenspunkter krävs');
 const source=points.map(p=>p.world),dest=points.map(p=>geographicToLocal(p.geo,origin,northOffset));
 if(![...source.flat(),...dest.flat()].every(Number.isFinite))throw new Error('Ogiltiga referenspunkter');
 const mean=(p:Vec3[])=>p.reduce((s,v)=>s.map((n,i)=>n+v[i]/p.length) as Vec3,[0,0,0] as Vec3),s=mean(source),t=mean(dest);
 let xx=0,zz=0,xz=0,aa=0,bb=0;source.forEach((p,i)=>{const x=p[0]-s[0],z=p[2]-s[2],u=dest[i][0]-t[0],v=dest[i][2]-t[2];xx+=x*x;zz+=z*z;xz+=x*z;aa+=x*u+z*v;bb+=z*u-x*v;});
 if(xx+zz<.01||(xx*zz-xz*xz)/(xx+zz)**2<1e-5)throw new Error('Referenspunkterna ligger för nära eller på en linje');
 const A=aa/(xx+zz),B=bb/(xx+zz),scale=Math.hypot(A,B);if(scale<.0001||scale>1000)throw new Error('Orimlig kalibreringsskala');
 const yaw=Math.atan2(B,A)/rad,position:Vec3=[t[0]-A*s[0]-B*s[2],t[1]-scale*s[1],t[2]+B*s[0]-A*s[2]];
 const transform=(p:Vec3):Vec3=>[A*p[0]+B*p[2]+position[0],scale*p[1]+position[1],-B*p[0]+A*p[2]+position[2]];
 const errors=source.map((p,i)=>Math.hypot(transform(p)[0]-dest[i][0],transform(p)[2]-dest[i][2]));
 return{scale,yaw,position,rms:Math.sqrt(errors.reduce((s,v)=>s+v*v,0)/errors.length),errors,transform};
}
