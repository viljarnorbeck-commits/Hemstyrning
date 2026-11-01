import{isLightingEntity}from'../../../../shared/ha-contract.js';
import type{SceneObject,HassState}from'./types';import type{ControlEntityMetadata}from'./control-devices';
export const lightLocations=[['inside','Inne'],['outside','Ute'],['uncertain','Oklart']] as const;
export type LightLocation=typeof lightLocations[number][0];
export const lightPlacementGroups=[['upstairs','Uppe'],['downstairs','Nere'],['basement','Källare'],['inside','Inne · placering oklar'],['outside','Ute'],['uncertain','Oklart']] as const;
type LightPlacement=typeof lightPlacementGroups[number][0];
/** Display guesses only; room-based floor assignments remain explicitly provisional. */
export function lightPlacement(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]):{key:LightPlacement;label:string;provisional:boolean}{
 const location=lightLocation(o,states,catalog);
 const normalize=(s:string)=>s.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[_-]/g,' ');
 const area=normalize(catalog.find(e=>e.entityId===o.entityId)?.area??'');
 const names=normalize(o.name+' '+String(states.get(o.entityId)?.attributes.friendly_name??'')+' '+o.entityId);
 const explicit=(s:string):LightPlacement|undefined=>{
  if(/\b(?:kallare\w*|basement)\b/.test(s))return'basement';
  if(/\b(?:uppe|overvaning\w*|ovanvaning\w*|overplan|upstairs)\b|\b(?:plan|vaning)\s*2\b/.test(s))return'upstairs';
  if(/\b(?:nere|nedervaning\w*|bottenvaning\w*|entreplan|nedre plan|downstairs)\b|\b(?:plan|vaning)\s*1\b/.test(s))return'downstairs';
  return undefined;
 };
 let key:LightPlacement=location,provisional=false;
 if(location!=='outside'){
  const level=explicit(area)??explicit(names);
  if(level)key=level;
  else{
   const guess=(room:string):LightPlacement|undefined=>{
    if(/\b(?:sovrum\w*|sov\d*|viljar\w*)\b|\bstora\s*badrum\w*\b/.test(room))return'upstairs';
    if(/\b(?:kok\w*|koks\w*|vardagsrum\w*|matsal\w*|hall\w*|entre\w*)\b|\blilla\s*badrum\w*\b|\bunder\s*trapp\w*\b/.test(room))return'downstairs';
    return undefined;
   };
   const guessed=guess(area)??guess(names);if(guessed){key=guessed;provisional=true;}
  }
 }
 return{key,label:lightPlacementGroups.find(([id])=>id===key)![1],provisional};
}
/** A provisional display grouping; it never changes HA areas, bindings or command permissions. */
export function lightLocation(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]):LightLocation{
 const classify=(value:string):LightLocation=>{
  const text=value.toLocaleLowerCase('sv-SE').replace(/[_-]/g,' ');
  if(/\b(?:ute\w*|utomhus|utanför|outdoor|outside|garden|trädgård|altan|terrass|fasad|uppfart|driveway|patio|bron|brobelysning|stolp\w*|easee)\b/u.test(text))return'outside';
  if(/(?:^|\s)(?:uppe|nere|[öo]verv[åa]ning\w*|ovanv[åa]ning\w*|nederv[åa]ning\w*|bottenv[åa]ning\w*|entr[ée]plan|upstairs|downstairs)(?:\s|$)/u.test(text))return'inside';
  if(/\b(?:inne|inomhus|huset|entré|entre|allrum|indoor|inside|kök\w*|köks\w*|sov\w*|badrum\w*|badrummet|vardagsrum\w*|matsal\w*|hall\w*|trapp\w*|bastu\w*|källar\w*|tvätt\w*|kontor\w*|hyll\w*|living|bedroom|kitchen|bathroom|garage|verkstad|hönshus)\b/u.test(text))return'inside';
  return'uncertain';
 };
 const entry=catalog.find(e=>e.entityId===o.entityId),area=classify(entry?.area??'');
 if(area!=='uncertain')return area;
 const name=classify(o.name+' '+String(states.get(o.entityId)?.attributes.friendly_name??''));
 return name!=='uncertain'?name:classify(o.entityId.replace(/^(?:light|switch)\./,''));
}
export function sortLightsByLocation(lamps:SceneObject[],states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 const rank=new Map<string,number>(lightPlacementGroups.map(([key],i)=>[key,i])),locations=new Map(lamps.map(o=>[o.entityId,rank.get(lightPlacement(o,states,catalog).key)!]));
 return [...lamps].sort((a,b)=>locations.get(a.entityId)!-locations.get(b.entityId)!||a.name.localeCompare(b.name,'sv-SE',{numeric:true}));
}
export function controlLight(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(o.type==='light')return true;
 const entry=catalog.find(e=>e.entityId===o.entityId&&e.platform==='knx');
 if(!entry)return false;
 const attributes={friendly_name:entry.name,...states.get(o.entityId)?.attributes};
 if(isLightingEntity(o.entityId,attributes))return true;
 // Display classification only. This does not add Halloween targets or command permissions.
 const name=String(attributes.friendly_name).toLocaleLowerCase('sv-SE').replace(/_/g,' ');
 if(/uttag|matning|konstant|kyl|micro|vatten|motor|ladd|\bnil\b/.test(name))return false;
 return o.entityId.startsWith('switch.')&&/(?:^|[\s-])tak(?:$|[\s-])|f[öo]nster/.test(name);
}
/** Cosmetic label only. Keep entity IDs, saved object types and command routes unchanged. */
export function shortKnxName(name:string){
 let text=name.replace(/^(?:light|switch)\./,'').replace(/^aktor[a-z0-9]+(?:_[a-z]\d+)?(?:_port\d+)?(?:_[a-h](?=_))?[_\s-]*/i,'');
 text=text.replace(/_/g,' ').replace(/([a-zåäö])([A-ZÅÄÖ])/g,'$1 $2').replace(/(sovrum|sov|motorvärmare|motorvarmare)\s*(\d+)/gi,'$1 $2').replace(/\s+/g,' ').trim();
 if(/^(?:kök\s+)?köksbord(?:\s+belysning)?$/i.test(text))return'Köksbord';
 text=text.replace(/\s+belysning$/i,'').trim();
 if(/^nil$/i.test(text)){const port=name.match(/port(\d+)/i);return port?'Ej namngiven port '+port[1]:'Ej namngiven kanal';}
 if(text)return text[0]!.toLocaleUpperCase('sv-SE')+text.slice(1);
 const channel=name.match(/aktor([a-z]\d+)([a-z])?/i);
 return channel?'Kanal '+channel[1]!.toUpperCase()+(channel[2]?' '+channel[2].toUpperCase():''):'Ej namngiven kanal';
}
export function controlGroup(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(controlLight(o,states,catalog))return'lights';
 if(/motorv[aä]rmare/i.test(o.entityId+' '+o.name))return'heaters';
 if(['car','mower','vacuum'].includes(o.type)||o.entityId.includes('vvb_'))return'devices';
 const entry=catalog.find(e=>e.entityId===o.entityId),name=(entry?.name??o.name).toLocaleLowerCase('sv-SE');
 if(o.entityId.startsWith('switch.')&&/uttag|vinkyl|vattenkokare|micro|tv[-_\s]?b[äa]nk/.test(name))return'outlets';
 if(o.entityId.startsWith('switch.'))return'switches';
 return'other';
}
