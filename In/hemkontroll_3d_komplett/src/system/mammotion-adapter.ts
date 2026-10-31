import type{HassState}from'./types';import type{Fix}from'./tracking';import{geographicToLocal,type GeoPoint}from'./geography';
/** Mammotion adapter: requires explicit binding; never accepts another mower as a fallback. */
export function mammotionFix(state:HassState|undefined,origin?:GeoPoint,northOffset=0):Fix|null{
 if(!state||['unknown','unavailable'].includes(state.state))return null;const a=state.attributes,t=Date.parse(String(a.position_sampled_at??state.last_updated));let x=a.local_x,z=a.local_z;
 if((typeof x!=='number'||typeof z!=='number')&&origin&&typeof a.latitude==='number'&&typeof a.longitude==='number'&&Math.abs(a.latitude)<=90&&Math.abs(a.longitude)<=180){const p=geographicToLocal({latitude:a.latitude,longitude:a.longitude},origin,northOffset);x=p[0];z=p[2];}
 if(typeof x!=='number'||typeof z!=='number'||![x,z,t].every(Number.isFinite))return null;
 const accuracy=a.accuracy_m??a.gps_accuracy;if(accuracy!==undefined&&(typeof accuracy!=='number'||!Number.isFinite(accuracy)||accuracy<0||accuracy>15))return null;
 return{x,z,t,timeBasis:typeof a.position_sampled_at==='string'?'sample':'entity',accuracy:typeof accuracy==='number'?accuracy:undefined};
}
