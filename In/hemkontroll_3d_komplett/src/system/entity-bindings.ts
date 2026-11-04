import type {HassState, SceneConfig} from './types';

/** Stored in the existing workspace scene, shared by every screen and restart. */
export const sensorSlots = [
  ['sensor.ferroamp_grid_power','Elnät · effekt','W eller kW'],
  ['sensor.ferroamp_consumption_power','Huset · aktiv effekt','W eller kW'],
  ['sensor.ferroamp_solar_power','Solpaneler · effekt','W eller kW'],
  ['sensor.ferroamp_total_solar_energy','Solpaneler · total energi','kWh'],
  ['sensor.elmatare_hus2_effekt_summa','Hus 2 · effekt','W eller kW'],
  ['sensor.elmatare_varme_effekt_2','Värme · total effekt i Sankey','W eller kW'],
  ['sensor.elmatare_bostad_effekt_summa','Bostad · effekt i Sankey','W eller kW'],
  ['sensor.elmatare_verkstad_effekt_summa','Verkstad · effekt i Sankey','W eller kW'],
  ...[1,2,3,4].map(n=>['sensor.motorvarmare'+n+'_kw','Motorvärmare '+n+' · effekt i Sankey','W eller kW'] as const),
  ['sensor.electricity_price_bringasen_380','Elpris · aktuellt','SEK/kWh'],
  ['$costToday','Elkostnad · idag','SEK · endast verifierad dagskostnad'],
  ['$averageToday','Snittpris · idag','kr/kWh · endast verifierat dagsmedel'],
  ['$garagePower','Garage · effektflöde på startsidan','W eller kW · välj endast verifierad garagemätare'],
  ...['vanster','hoger'].flatMap(side => [
    [`light.easee_${side}_led_strip`, `Easee ${side} · laddboxlampa`, 'light · separat från laddningen'],
    [`sensor.easee_${side}_status`, `Easee ${side} · status`, 'Laddbox'],
    [`sensor.easee_${side}_power`, `Easee ${side} · effekt`, 'W eller kW'],
    [`sensor.easee_${side}_session_energy`, `Easee ${side} · sessionsenergi`, 'kWh'],
    [`sensor.easee_${side}_lifetime_energy`, `Easee ${side} · livstidsenergi`, 'kWh'],
  ]),
  ...['entredorr','verkstadsentre'].flatMap(door => [
    [`lock.${door}_2`, `${door} · lås`, 'Låsstatus'],
    [`binary_sensor.${door}_door`, `${door} · dörrsensor`, 'Öppen/stängd'],
  ]),
  ['sensor.uteknx_temperatur','Utomhus · temperatur','°C'],
  ['sensor.storabadrummet_temperatur','Stora badrummet · temperatur','°C'],
  ['sensor.vvb_kallaren_ovre_temperatur_1','Varmvatten · övre','°C'],
  ['sensor.vvb_kallaren_mittentemperatur_2','Varmvatten · mitten','°C'],
  ['sensor.vvb_kallaren_nedre_temperatur_3','Varmvatten · nedre','°C'],
  ['climate.vvb_kallaren_termostat','Varmvatten · termostat','climate'],
  ['switch.vvb_kallaren_on_off','Varmvatten · brytare','switch'],
  ...['ev6','egolf'].flatMap(car=>[
    ['$'+car+'Battery',car+' · bilbatteri','% · separat bilintegration'],
    ['$'+car+'Range',car+' · räckvidd','km · separat bilintegration'],
    ['$'+car+'Connection',car+' · verifierad anslutning','binary_sensor · aktuell bilanslutning'],
    ['$'+car+'Remaining',car+' · laddtid','min · separat bilintegration'],
  ]),
  ['$luba','LUBA 3 · robot','Endast verifierad Mammotion-integration'],
  ['vacuum.xiaomi_vacuum_cleaner','Robotdammsugare','vacuum'],
] as const;
let bindings: Record<string,string> = {};
let preferences:SceneConfig['entityPreferences']={};
export function configureSensorBindings(scene: Pick<SceneConfig,'sensorBindings'|'entityPreferences'>) {
  bindings = {...scene.sensorBindings};preferences=scene.entityPreferences??{};
}
export function defaultEntity(slot: string) { return slot.startsWith('$') ? '' : slot; }
export function hasSensorBinding(slot:string) { return Object.hasOwn(bindings,slot); }
export function resolveEntity(slot: string) { return Object.hasOwn(bindings,slot) ? bindings[slot]! : defaultEntity(slot); }
export function readState(states: Map<string,HassState>, slot: string) { return states.get(resolveEntity(slot)); }

export function temperatureOffsetC(entityId:string){return preferences?.[entityId]?.temperatureOffsetC??0;}

/** Owner confirmed on 2026-11-03: these Node-RED power totals contain watts despite a kW label.
 * Correct display/history only; leave HA configuration and simulator units untouched.
 */
const wattLabelCorrections=new Set(['sensor.elmatare_bostad_effekt_summa','sensor.elmatare_verkstad_effekt_summa','sensor.elmatare_hus2_effekt_summa']);
export function measurementSourceUnit(entityId:string,reported:unknown,simulated:unknown=false){
 return simulated!==true&&reported==='kW'&&wattLabelCorrections.has(entityId)?'W':reported;
}
