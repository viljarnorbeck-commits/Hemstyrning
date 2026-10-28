import { z } from 'zod';

const finite = z.number().finite();
const vector = z.tuple([finite, finite, finite]);
const imageUrl = z.string().regex(/^\/(?:workspace-api\/panoramas\/[a-f0-9]{64}\.(?:png|jpg)|textures\/sky\/[a-z0-9_]+\.jpg)$/);
const grade=z.object({warmth:finite.min(-.2).max(.2),saturation:finite.min(.5).max(1.5),contrast:finite.min(.8).max(1.25),exposure:finite.min(.5).max(2)});
const modelUrl = z.string().regex(/^\/(?:models\/[\w.-]+\.glb|workspace-api\/models\/[a-f0-9]{64}\.glb)$/);
export const sceneSchema = z.object({
  version: z.literal(1),
  layoutVersion: z.number().default(2),
  location: z.object({ timeZone:z.string().refine(value=>{try{new Intl.DateTimeFormat('sv-SE',{timeZone:value});return true;}catch{return false;}},'Ogiltig tidszon').default('Europe/Stockholm'),latitude: finite.min(-90).max(90), longitude: finite.min(-180).max(180), northOffset: finite }),
  models: z.object(Object.fromEntries(['summer', 'autumn', 'firstSnow', 'winter'].map(key => [key, z.object({
    appearance:grade.optional(),url: modelUrl, label: z.string().max(120), verified: z.boolean(),
    position: vector, rotation: vector, scale: finite.positive().max(1000),
  })]))),
  activeModel: z.enum(['summer', 'autumn', 'firstSnow', 'winter']),
  automatic: z.object({ enabled: z.boolean(), snowEntity: z.string().max(200), snowThreshold: finite.min(0), sourceConfirmed: z.boolean() }),
  bindings: z.object({ weather: z.string().max(200), cloud: z.string().max(200), lux: z.string().max(200), cloudAttribute: z.string().max(100), cloudMax: finite.positive(), weatherMaxAge: finite.min(60).max(86400), luxMaxAge: finite.min(10).max(86400),moon:z.string().max(200).default('sensor.moon_phase'),calendars:z.array(z.string().regex(/^calendar\.[a-z0-9_]+$/)).max(20).default(['calendar.family','calendar.work']) }),
  luxCalibration: z.object({ gain: finite.min(0.01).max(100), weight: finite.min(0).max(0.35), artificialLux: finite.min(0).max(100000), placement: z.string().max(500), affectedByLights: z.boolean() }),
  appearance: z.object({profiles:z.record(z.enum(['day','sunset','twilight','moonlight','overcast','rain','snow']),grade).optional(),warmth:finite.min(-0.2).max(0.2).default(0.035),saturation:finite.min(0.5).max(1.5).default(1.08),contrast:finite.min(0.8).max(1.25).default(1.04),exposure:finite.min(0.5).max(2).default(1),nightExposure:finite.min(1).max(3).default(2.2),toneMapping:z.enum(['aces','agx','neutral']).default('aces'),terrain:z.boolean().default(true),occlusion:z.boolean().default(true)}).default({warmth:0.035,saturation:1.08,contrast:1.04,exposure:1,nightExposure:2.2,toneMapping:'aces',terrain:true,occlusion:true}),
  geography:z.object({simulatorRoute:z.array(vector).max(100).optional(),altitude:finite.default(0),points:z.array(z.object({world:vector,geo:z.object({latitude:finite.min(-90).max(90),longitude:finite.min(-180).max(180),altitude:finite.optional()})})).max(50).default([]),rms:finite.nonnegative().optional(),mapTiles:z.string().max(1000).default('https://tile.openstreetmap.org/{z}/{x}/{y}.png')}).default({altitude:0,points:[],mapTiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}),
  panoramas:z.array(z.object({id:z.string().max(100),name:z.string().max(120),url:imageUrl,north:finite.default(0),capturedAt:z.string().max(60).default(''),exposure:finite.min(.1).max(4).default(1),saturation:finite.min(0).max(2).default(1),minElevation:finite.min(-90).max(90).default(-6),maxElevation:finite.min(-90).max(90).default(90),minCloud:finite.min(0).max(1).default(0),maxCloud:finite.min(0).max(1).default(1),containsSun:z.boolean().default(false),sunAzimuth:finite.default(180),sunElevation:finite.min(-90).max(90).default(20),maskRadius:finite.min(1).max(45).default(8),temporary:z.boolean().optional(),followSun:z.boolean().optional(),source:z.string().max(300).optional(),fadeAtNight:z.boolean().optional()})).max(20).default([]),
  sky:z.object({mode:z.enum(['procedural','automatic','manual']).default('procedural'),panoramaId:z.string().max(100).default(''),transitionSeconds:finite.min(1).max(120).default(12)}).default({mode:'procedural',panoramaId:'',transitionSeconds:12}),
  quality: z.enum(['low', 'high', 'auto']),
  objects: z.array(z.object({
    id: z.string().min(1).max(100), type: z.enum(['light', 'car', 'parking', 'solar', 'mower', 'surface', 'vacuum', 'energy', 'dock', 'device', 'occluder']),
    name: z.string().min(1).max(120), entityId: z.string().max(200), position: vector, rotation: vector, scale: vector,
    color: z.string().regex(/^#[a-fA-F0-9]{6}$/), intensity: finite.min(0).max(20000), angle: finite.min(5).max(150), range: finite.min(1).max(100),
    roughness: finite.min(0).max(1), metalness: finite.min(0).max(1),
    points: z.array(vector).max(100),
    representation:z.enum(['embedded','standalone']).default('standalone'),
    asset:z.object({url:modelUrl,rotation:vector.default([0,0,0]),origin:vector.default([0,0,0]),scale:finite.positive().max(1000).default(1),groundOffset:finite.min(-20).max(20).default(0)}).optional(),
    presence:z.enum(['auto','home','away']).default('auto'),
    zone:z.enum(['lawn','mowing','transit','passage','forbidden','obstacle','ground']).optional(),
    headlight:z.object({enabled:z.boolean().default(false),estimate:z.boolean().default(true),luxThreshold:finite.nonnegative().max(10000).default(30),lumens:finite.min(0).max(5000).default(180),angle:finite.min(5).max(140).default(65),kelvin:finite.min(2000).max(9000).default(4500),position:vector.default([0,.2,-.35])}).optional(),
    trackingOffset:vector.default([0,0,0]),
    bindings: z.record(z.string(), z.string().max(200)).default({}),
  })).max(200),
}).superRefine((value, ctx) => {
  const ids = value.objects.map(o => o.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Objekt-ID måste vara unika' });
});

export type SceneConfig = z.infer<typeof sceneSchema>;
export function defaultScene(): SceneConfig {
  const base = { url: '/models/daniels.glb', label: 'Daniels · geometri, texturfil saknas', verified: false, position: [-6.26027, 2.29754, -1.77485], rotation: [-90, 0, 0], scale: 1 };
  return sceneSchema.parse({
    version: 1, location: { latitude: 63.18, longitude: 14.64, northOffset: 0 },
    models: Object.fromEntries(['summer', 'autumn', 'firstSnow', 'winter'].map(key => [key, structuredClone(base)])), activeModel: 'summer',
    automatic: { enabled: false, snowEntity: '', snowThreshold: 1, sourceConfirmed: false },
    bindings: { weather: 'weather.home', cloud: '', lux: 'sensor.outdoor_illuminance', cloudAttribute: 'cloud_coverage', cloudMax: 100, weatherMaxAge: 7200, luxMaxAge: 900 },
    luxCalibration: { gain: 1, weight: 0.2, artificialLux: 50, affectedByLights: true, placement: 'Ej kalibrerad. Ange placering och jämför mot dagsljus utan gårdsbelysning.' }, quality: 'auto',
    objects: initialObjects(),
  });
}
function initialObjects() {
  const make = (id: string, type: string, name: string, entityId: string, position: number[]) => ({ id, type, name, entityId, position, rotation:[0,0,0],scale:[1,1,1],color:type==='light'?'#ffd6a0':type==='solar'?'#173d59':'#92aeb3',intensity:1800,angle:70,range:18,roughness:0.65,metalness:0.1,points:[],bindings:{},representation:type==='car'?'embedded':'standalone' });
  return [
    make('lamp-first','light','Altan','light.altan',[0,4,0]),
    make('lamp-driveway','light','Infart vänster','light.infart_vanster',[-17,3,-20]),
    make('lamp-driveway2','light','Infart höger','light.infart_hoger',[-10,3,-20]),
    make('lamp-garage','light','Garage','light.garage',[8,4,-5]),
    make('lamp-path','light','Gångstig','light.gangstig',[-18,3,10]),
    make('lamp-shed','light','Förråd','light.forad',[12,3,12]),
    make('car-one','car','Bil 1','sensor.car_one_battery',[-7,0,-12]),
    make('car-two','car','Bil 2','sensor.car_two_battery',[-2,0,-12]),
    {...make('solar-roof','solar','Solpaneler','sensor.solar_power',[0,9,2]),scale:[5,1,4]},
    make('luba','mower','LUBA 3 AWD','lawn_mower.luba_3_awd',[-17,0.4,7]),
    make('vacuum','vacuum','Robotdammsugare','vacuum.downstairs',[0,1,4]),
    make('energy','energy','Husets energi','sensor.house_power',[-4,6,3]),
  ];
}
