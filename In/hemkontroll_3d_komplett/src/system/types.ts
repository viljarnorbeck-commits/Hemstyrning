export type Vec3 = [number, number, number];
export type Season = 'summer' | 'autumn' | 'firstSnow' | 'winter';
export const seasons: Record<Season, string> = { summer: 'Sommar', autumn: 'Höst', firstSnow: 'Höst · första snön', winter: 'Vinter' };
export type ObjectKind = 'light' | 'car' | 'parking' | 'solar' | 'mower' | 'surface' | 'vacuum' | 'energy' | 'dock' | 'device' | 'occluder';
export interface ObjectAsset {url:string;rotation:Vec3;origin:Vec3;scale:number;groundOffset:number}
export interface Panorama {temporary?:boolean;followSun?:boolean;source?:string;fadeAtNight?:boolean;id:string;name:string;url:string;north:number;capturedAt:string;exposure:number;saturation:number;minElevation:number;maxElevation:number;minCloud:number;maxCloud:number;containsSun:boolean;sunAzimuth:number;sunElevation:number;maskRadius:number}
export interface SceneObject {
  asset?:ObjectAsset;presence?:'auto'|'home'|'away';zone?:'lawn'|'mowing'|'transit'|'passage'|'forbidden'|'obstacle'|'ground';footprint?:{width:number;length:number};trackingOffset?:Vec3;classification?:{origin:'automatic'|'manual';status:'proposed'|'approved'|'rejected';analysisKey:string;proposalId:string;confidence:number};
  headlight?:{enabled:boolean;estimate:boolean;luxThreshold:number;lumens:number;angle:number;kelvin:number;position:Vec3};
  representation?: 'embedded'|'standalone';
  bindings?: Record<string,string>; id: string; type: ObjectKind; name: string; entityId: string; position: Vec3; rotation: Vec3; scale: Vec3;
  color: string; intensity: number; angle: number; range: number; roughness: number; metalness: number; points: Vec3[];
}
export interface ModelConfig { appearance?:import('./appearance').Grade; url: string; label: string; verified: boolean; position: Vec3; rotation: Vec3; scale: number }
export interface MusicConfig {entities:string[];activeEntity:string;jamUrl:string;jamSavedAt:string}
export interface SceneConfig {
  music?:MusicConfig;
  geography?:{simulatorRoute?:Vec3[];altitude:number;points:import('./geography').ControlPoint[];rms?:number;mapTiles:string};
  panoramas?:Panorama[];sky?:{mode:'procedural'|'automatic'|'manual';panoramaId:string;transitionSeconds:number};
  version: 1; layoutVersion?: number; location: { timeZone?:string;latitude: number; longitude: number; northOffset: number };
  models: Record<Season, ModelConfig>; activeModel: Season;
  automatic: { enabled: boolean; snowEntity: string; snowThreshold: number; sourceConfirmed: boolean };
  bindings: { weather: string; cloud: string; lux: string; cloudAttribute: string; cloudMax: number; weatherMaxAge: number; luxMaxAge: number;moon?:string;calendars?:string[] };
  luxCalibration: { gain: number; weight: number; artificialLux: number; placement: string; affectedByLights: boolean };
  appearance?:{profiles?:Partial<Record<keyof typeof import('./appearance').lightProfiles,import('./appearance').Grade>>;warmth:number;saturation:number;contrast:number;exposure:number;nightExposure:number;toneMapping:'aces'|'agx'|'neutral';terrain:boolean;occlusion:boolean};
  quality: 'low' | 'high' | 'auto'; objects: SceneObject[];
}
export interface HassState { entity_id: string; state: string; attributes: Record<string, unknown>; last_updated: string; last_reported?: string }
export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'mixed';
export interface Preview { date: string; cloud: number; lux: number; brightness: number; weather: Weather }
export interface EnvironmentInput { date: Date; latitude: number; longitude: number; northOffset: number; cloud: number; lux: number | null; weather: Weather; sensorWeight: number; brightness: number; rainIntensity?:number; snowIntensity?:number; windSpeed?:number; windDirection?:number; gust?:number; visibility?:number }
export interface EnvironmentFrame { elevation: number; azimuth: number; sunDirection: Vec3; direct: number; ambient: number; daylight: number; rain: number; snow: number; fog: number; luxUsed: boolean; windSpeed?:number; windDirection?:number; gust?:number; moonDirection?:Vec3;moonAltitude?:number;moonFraction?:number;moonPhaseAngle?:number;moonLight?:number;starVisibility?:number;cloud?:number;exposure?:number;skyTime?:number;season?:Season }
