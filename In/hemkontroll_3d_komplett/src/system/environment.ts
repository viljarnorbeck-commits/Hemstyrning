import {moonPosition} from './astronomy';
import type { EnvironmentFrame, EnvironmentInput, HassState, SceneConfig, Season, Vec3, Weather } from './types';
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rad = Math.PI / 180;
const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** NOAA fractional-year solar equations. UTC input, east-positive longitude, azimuth clockwise from north. */
export function solarPosition(date: Date, latitude: number, longitude: number, northOffset = 0) {
  const year = date.getUTCFullYear();
  const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const day = Math.floor((date.getTime() - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const g = 2 * Math.PI / days * (day - 1 + (hour - 12) / 24);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const hourAngle = ((hour * 60 + equation + 4 * longitude) / 4 - 180) * rad;
  const lat = latitude * rad;
  const elevation = Math.asin(clamp(Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle), -1, 1));
  const azimuth = (Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat)) / rad + 180 + 360) % 360;
  const angle = (azimuth + northOffset) * rad;
  // North = -Z, East = +X; offsets rotate the compass within the world, never the devices.
  const direction: Vec3 = [Math.sin(angle) * Math.cos(elevation), Math.sin(elevation), -Math.cos(angle) * Math.cos(elevation)];
  return { elevation: elevation / rad, azimuth, direction };
}

export function environmentTarget(input: EnvironmentInput): EnvironmentFrame {
  const solar = solarPosition(input.date, input.latitude, input.longitude, input.northOffset);
  const daylight = smoothstep(-8, 8, solar.elevation);
  const cloud = clamp(input.cloud, 0, 1);
  const predictedLux = 0.1 + daylight * (800 + 85000 * Math.max(0, Math.sin(solar.elevation * rad))) * (1 - cloud * 0.75);
  // Sensor adjusts the physically based estimate by at most 35%, in log space.
  // This bounds shaded sensors and lamps shining directly on the photocell.
  const luxUsed = input.lux !== null && Number.isFinite(input.lux) && input.lux >= 0;
  const ratio = luxUsed ? clamp(Math.log10(1 + input.lux!) / Math.log10(1 + predictedLux), 0.65, 1.35) : 1;
  const correction = 1 + (ratio - 1) * clamp(input.sensorWeight, 0, 0.35);
  const brightness = clamp(input.brightness, 0.1, 2);
  const moon=moonPosition(input.date,input.latitude,input.longitude,input.northOffset),moonAbove=smoothstep(-1,30,moon.altitude),moonAmount=moon.fraction*moonAbove*Math.pow(1-cloud,.8),night=1-daylight;
  const rain = clamp(input.rainIntensity ?? (input.weather === 'rain' ? 1 : input.weather === 'mixed' ? 0.5 : 0),0,1);
  const snow = clamp(input.snowIntensity ?? (input.weather === 'snow' ? 1 : input.weather === 'mixed' ? 0.5 : 0),0,1);
  return {
    elevation: solar.elevation, azimuth: solar.azimuth, sunDirection: solar.direction, daylight,
    direct: 3.5 * smoothstep(-1, 12, solar.elevation) * (1 - 0.93 * cloud) * correction * brightness * (1 - rain * 0.35),
    ambient: (0.075 + night*moonAmount*.015 + daylight * (0.65 + 0.35 * cloud)) * correction * brightness,
    rain, snow, windSpeed:clamp(input.windSpeed??0,0,80),windDirection:input.windDirection??0,gust:clamp(input.gust??0,0,100),
    fog: input.visibility!==undefined ? clamp(0.003/Math.max(0.05,input.visibility),0.0001,0.06) : input.weather === 'fog' ? 0.022 : 0.0005 + cloud * 0.001,
    moonDirection:moon.direction,moonAltitude:moon.altitude,moonFraction:moon.fraction,moonPhaseAngle:moon.phaseAngle,moonLight:.3*moonAmount*night,starVisibility:(1-smoothstep(-14,-5,solar.elevation))*Math.pow(1-cloud,3)*(1-.7*moonAmount),cloud,skyTime:input.date.getTime(),exposure:1+night*.9,
    luxUsed,
  };
}
export function damp(current: number, target: number, dt: number, seconds = 3) { return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) / seconds)); }
export function freshState(state: HassState | undefined, maxAge: number, now = Date.now()) {
  if (!state || ['unknown', 'unavailable'].includes(state.state)) return false;
  const age = now - Date.parse(state.last_reported ?? state.last_updated);
  return Number.isFinite(age) && age >= -60000 && age <= maxAge * 1000;
}
export function weatherKind(state: string): Weather {
  if (state === 'snowy-rainy') return 'mixed';
  if (['rainy', 'pouring', 'lightning-rainy'].includes(state)) return 'rain';
  if (state === 'snowy') return 'snow';
  if (state === 'fog') return 'fog';
  return ['cloudy', 'partlycloudy'].includes(state) ? 'cloudy' : 'clear';
}
export function liveInputs(config: SceneConfig, states: Map<string, HassState>, connected: boolean, now = Date.now()) {
  const weather = states.get(config.bindings.weather);
  const cloud = config.bindings.cloud ? states.get(config.bindings.cloud) : weather;
  const luxState = states.get(config.bindings.lux);
  const weatherValid = connected && freshState(weather, config.bindings.weatherMaxAge, now);
  const cloudValid = connected && freshState(cloud, config.bindings.weatherMaxAge, now);
  const numeric=(value:unknown)=>typeof value==='number'||typeof value==='string'&&value.trim()!==''?Number(value):NaN;
  const rawCloud = cloudValid ? (config.bindings.cloud ? numeric(cloud!.state) : numeric(cloud!.attributes[config.bindings.cloudAttribute])) : NaN;
  const rawLux = connected && freshState(luxState, config.bindings.luxMaxAge, now) ? numeric(luxState!.state) : NaN;
  const lit = config.objects.filter(o => o.type === 'light' && states.get(o.entityId)?.state === 'on').length;
  const calibration = config.luxCalibration;
  const lux = Number.isFinite(rawLux) && rawLux >= 0 && rawLux <= 200000 ? Math.max(0, rawLux - (calibration.affectedByLights ? lit * calibration.artificialLux : 0)) * calibration.gain : null;
  return { cloud: Number.isFinite(rawCloud) ? clamp(rawCloud / config.bindings.cloudMax, 0, 1) : 0.5, lux, weather: weatherValid ? weatherKind(weather!.state) : 'clear' as Weather,
    warnings: [!weatherValid && 'Väder saknas eller är för gammalt', !Number.isFinite(rawCloud) && 'Molndata saknas: neutral uppskattning', lux === null && 'Lux saknas: sol och väder används'].filter(Boolean).join(' · ') };
}
/** Snow switches require an explicitly confirmed local observation, not a weather forecast. */
export function automaticSeason(config: SceneConfig, states: Map<string, HassState>, date: Date, connected: boolean): Season {
  if (!config.automatic.enabled) return config.activeModel;
  const month = date.getUTCMonth() + 1;
  const snow = states.get(config.automatic.snowEntity);
  const hasSnow = connected && config.automatic.sourceConfirmed && freshState(snow, 3600) && Number(snow!.state) >= config.automatic.snowThreshold;
  if (hasSnow) return month >= 9 && month <= 11 ? 'firstSnow' : 'winter';
  return month >= 5 && month <= 8 ? 'summer' : 'autumn';
}
