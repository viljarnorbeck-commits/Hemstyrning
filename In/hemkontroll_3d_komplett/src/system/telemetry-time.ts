import type{HassState}from'./types';
/** Simulator telemetry can advance independently of weather/UTC. Staleness still ages while updates stop. */
export function telemetryTime(state:HassState|undefined,wallNow=Date.now()){
 const clock=state?.attributes.simulated===true&&typeof state.attributes.telemetry_now==='string'?Date.parse(state.attributes.telemetry_now):NaN,last=Date.parse(state?.last_updated??'');
 return Number.isFinite(clock)&&Number.isFinite(last)?clock+Math.max(0,wallNow-last):wallNow;
}
