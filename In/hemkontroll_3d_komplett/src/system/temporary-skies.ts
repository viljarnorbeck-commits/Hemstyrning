import type{Panorama,SceneConfig,EnvironmentFrame}from'./types';
/** Locally bundled CC0 photographs are placeholders, never presented as photographs of this property. */
export const temporarySkies:Panorama[]=[
 {id:'temporary-day',name:'Tillfällig · fotografisk daghimmel',url:'/textures/sky/kloofendal_48d_partly_cloudy_puresky.jpg',minElevation:10,maxElevation:90,minCloud:0,maxCloud:.68,sunAzimuth:34.1015625,sunElevation:48.1640625,containsSun:true,maskRadius:12},
 {id:'temporary-sunset',name:'Tillfällig · fotografisk solnedgång',url:'/textures/sky/belfast_sunset_puresky.jpg',minElevation:-2,maxElevation:10,minCloud:0,maxCloud:.68,sunAzimuth:37.6171875,sunElevation:2.109375,containsSun:true,maskRadius:14},
 {id:'temporary-dusk',name:'Tillfällig · fotografisk skymning',url:'/textures/sky/qwantani_dusk_2_puresky.jpg',minElevation:-14,maxElevation:-2,minCloud:0,maxCloud:.68,sunAzimuth:32.34375,sunElevation:-5,containsSun:false,maskRadius:8},
 {id:'temporary-overcast',name:'Tillfällig · fotografisk mulen himmel',url:'/textures/sky/kloofendal_overcast_puresky.jpg',minElevation:-90,maxElevation:90,minCloud:.68,maxCloud:1,sunAzimuth:29.1796875,sunElevation:23.203125,containsSun:false,maskRadius:8},
].map(p=>({...p,north:0,capturedAt:'',exposure:1,saturation:1,temporary:true,followSun:p.containsSun,fadeAtNight:p.id!=='temporary-dusk',source:'Poly Haven · CC0 · '+p.url.split('/').at(-1)!.replace('.jpg','')}));
export function withTemporarySkies(config:SceneConfig){return{...config,panoramas:[...(config.panoramas??[]),...temporarySkies.filter(p=>!config.panoramas?.some(saved=>saved.id===p.id))]};}
export function panoramaRotation(p:Panorama,target:EnvironmentFrame,northOffset:number){return(p.north+northOffset+(p.followSun?target.azimuth-p.sunAzimuth:0))*Math.PI/180;}
export function panoramaNightFactor(p:Panorama,target:EnvironmentFrame){if(!p.fadeAtNight)return 1;return .012+.988*target.daylight;}
