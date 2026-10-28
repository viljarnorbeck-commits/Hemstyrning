import type { Vec3 } from './types';
export interface GeoPoint { latitude:number; longitude:number; altitude?:number }
const rad=Math.PI/180, a=6378137,e2=6.69437999014e-3;
function ecef(p:GeoPoint):Vec3 {const lat=p.latitude*rad,lon=p.longitude*rad,n=a/Math.sqrt(1-e2*Math.sin(lat)**2),h=p.altitude??0;return[(n+h)*Math.cos(lat)*Math.cos(lon),(n+h)*Math.cos(lat)*Math.sin(lon),(n*(1-e2)+h)*Math.sin(lat)];}
/** WGS84 -> local metres: X east, Y up, Z south; optional clockwise north offset. */
export function geographicToLocal(p:GeoPoint,origin:GeoPoint,northOffset=0):Vec3 {const q=ecef(p),o=ecef(origin),d=q.map((v,i)=>v-o[i]),lat=origin.latitude*rad,lon=origin.longitude*rad;const east=-Math.sin(lon)*d[0]+Math.cos(lon)*d[1],north=-Math.sin(lat)*Math.cos(lon)*d[0]-Math.sin(lat)*Math.sin(lon)*d[1]+Math.cos(lat)*d[2],up=Math.cos(lat)*Math.cos(lon)*d[0]+Math.cos(lat)*Math.sin(lon)*d[1]+Math.sin(lat)*d[2],r=northOffset*rad;return[east*Math.cos(r)+north*Math.sin(r),up,east*Math.sin(r)-north*Math.cos(r)];}
export function localToGeographic(p:Vec3,origin:GeoPoint,northOffset=0):GeoPoint {const r=northOffset*rad,east=p[0]*Math.cos(r)+p[2]*Math.sin(r),north=p[0]*Math.sin(r)-p[2]*Math.cos(r),up=p[1],lat=origin.latitude*rad,lon=origin.longitude*rad,o=ecef(origin);const x=o[0]-Math.sin(lon)*east-Math.sin(lat)*Math.cos(lon)*north+Math.cos(lat)*Math.cos(lon)*up,y=o[1]+Math.cos(lon)*east-Math.sin(lat)*Math.sin(lon)*north+Math.cos(lat)*Math.sin(lon)*up,z=o[2]+Math.cos(lat)*north+Math.sin(lat)*up;const distance=Math.hypot(x,y);let latitude=Math.atan2(z,distance*(1-e2)),height=0;for(let i=0;i<8;i++){const n=a/Math.sqrt(1-e2*Math.sin(latitude)**2);height=distance/Math.cos(latitude)-n;latitude=Math.atan2(z,distance*(1-e2*n/(n+height)));}return{latitude:latitude/rad,longitude:Math.atan2(y,x)/rad,altitude:height};}
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
