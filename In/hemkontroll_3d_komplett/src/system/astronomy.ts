import {Body,Equator,Horizon,Illumination,MoonPhase,Observer,SiderealTime,Rotation_EQJ_EQD} from 'astronomy-engine';
import type{Vec3}from'./types';
const r=Math.PI/180;
export function horizontalDirection(azimuth:number,altitude:number,northOffset=0):Vec3{const a=(azimuth+northOffset)*r,e=altitude*r;return[Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e)];}
export function moonPosition(date:Date,latitude:number,longitude:number,northOffset=0){const observer=new Observer(latitude,longitude,0),equator=Equator(Body.Moon,date,observer,true,true),horizon=Horizon(date,observer,equator.ra,equator.dec,'normal');return{altitude:horizon.altitude,azimuth:horizon.azimuth,fraction:Illumination(Body.Moon,date).phase_fraction,phaseAngle:MoonPhase(date),direction:horizontalDirection(horizon.azimuth,horizon.altitude,northOffset)};}
let cachedTime=NaN,cachedSidereal=0,cachedRotation=Rotation_EQJ_EQD(new Date(0));
/** J2000 catalogue coordinates precessed/nutated to date, then transformed to the local horizon. */
export function starDirection(raHours:number,decDegrees:number,date:Date,latitude:number,longitude:number,northOffset=0):Vec3{
 if(+date!==cachedTime){cachedTime=+date;cachedSidereal=SiderealTime(date);cachedRotation=Rotation_EQJ_EQD(date);}
 const ra=raHours*15*r,declination=decDegrees*r,x=Math.cos(ra)*Math.cos(declination),y=Math.sin(ra)*Math.cos(declination),z=Math.sin(declination),m=cachedRotation.rot,equatorialX=m[0][0]*x+m[1][0]*y+m[2][0]*z,equatorialY=m[0][1]*x+m[1][1]*y+m[2][1]*z,equatorialZ=m[0][2]*x+m[1][2]*y+m[2][2]*z,ofDateRA=Math.atan2(equatorialY,equatorialX),d=Math.asin(Math.max(-1,Math.min(1,equatorialZ))),h=(cachedSidereal*15+longitude)*r-ofDateRA,p=latitude*r,east=-Math.cos(d)*Math.sin(h),up=Math.sin(d)*Math.sin(p)+Math.cos(d)*Math.cos(h)*Math.cos(p),north=Math.sin(d)*Math.cos(p)-Math.cos(d)*Math.cos(h)*Math.sin(p),n=northOffset*r;
 return[east*Math.cos(n)+north*Math.sin(n),up,east*Math.sin(n)-north*Math.cos(n)];
}
