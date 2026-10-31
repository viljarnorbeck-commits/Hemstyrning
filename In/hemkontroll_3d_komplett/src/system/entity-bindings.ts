import type {HassState, SceneConfig} from './types';

/** Stored in the existing workspace scene, shared by every screen and restart. */
export const sensorSlots = [
  ['sensor.ferroamp_grid_power','Elnät · effekt','W eller kW'],
  ['sensor.ferroamp_consumption_power','Huset · aktiv effekt','W eller kW'],
  ['sensor.ferroamp_solar_power','Solpaneler · effekt','W eller kW'],
  ['sensor.ferroamp_total_solar_energy','Solpaneler · total energi','kWh'],
  ['sensor.elmatare_hus2_effekt_summa','Jannes hus · effekt','W eller kW'],
  ['sensor.electricity_price_bringasen_380','Elpris · aktuellt','SEK/kWh'],
  ['$costToday','Elkostnad · idag','SEK · endast verifierad dagskostnad'],
  ['$averageToday','Snittpris · idag','kr/kWh · endast verifierat dagsmedel'],
  ...['vanster','hoger'].flatMap(side => [
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
export function configureSensorBindings(scene: Pick<SceneConfig,'sensorBindings'>) {
  bindings = {...scene.sensorBindings};
}
export function defaultEntity(slot: string) { return slot.startsWith('$') ? '' : slot; }
export function hasSensorBinding(slot:string) { return Object.hasOwn(bindings,slot); }
export function resolveEntity(slot: string) { return Object.hasOwn(bindings,slot) ? bindings[slot]! : defaultEntity(slot); }
export function readState(states: Map<string,HassState>, slot: string) { return states.get(resolveEntity(slot)); }
