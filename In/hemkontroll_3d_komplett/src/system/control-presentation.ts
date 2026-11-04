import{isLightingEntity}from'../../../../shared/ha-contract.js';
import type{SceneObject,HassState}from'./types';import type{ControlEntityMetadata}from'./control-devices';
export const lightLocations=[['inside','Inne'],['outside','Ute'],['uncertain','Oklart']] as const;
export type LightLocation=typeof lightLocations[number][0];
/** A display alias only: entity IDs and the original HA registry are unchanged. */
export function roomDisplayName(value:string){return value.replace(/(^|[\s_-])sov(?:rum)?[ _-]*1(?=$|[ _-])/gi,'$1Viljars rum');}
export const lightPlacementGroups=[['upstairs','Uppe'],['downstairs','Nere'],['basement','Källare'],['inside','Inne · placering oklar'],['outside','Ute'],['uncertain','Oklart']] as const;
type LightPlacement=typeof lightPlacementGroups[number][0];
/** Placements explicitly confirmed by the homeowner, before metadata/name guesses. */
const confirmedLightPlacements:Readonly<Record<string,LightPlacement>>={
 'light.takljus_utanfor_honshus':'outside',
 'switch.aktore1e_belysning_utanfor_honshus':'outside',
 'light.ledljus_honshus':'outside',
 'switch.aktore1d_belysning_ute_ledljus':'outside',
 'switch.aktorb1_b3_port5_bastu_tak':'upstairs',
 'light.trappbelysning':'upstairs',
 'switch.aktorb1_b3_port12_trappbelysning_tak':'upstairs',
 'light.lampa_5':'outside',
 'light.lampa_9':'outside',
};
/** Display guesses only; room-based floor assignments remain explicitly provisional. */
export function lightPlacement(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]):{key:LightPlacement;label:string;provisional:boolean}{
 const confirmed=confirmedLightPlacements[o.entityId];
 if(confirmed)return{key:confirmed,label:lightPlacementGroups.find(([id])=>id===confirmed)![1],provisional:false};
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
 const confirmed=confirmedLightPlacements[o.entityId];if(confirmed)return confirmed==='outside'?'outside':'inside';
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
 text=roomDisplayName(text);
 if(/^Viljars rum\s+uttag$/i.test(text))return'Viljars uttag';
 if(/^utebelysning\s*1$/i.test(text))return'Belysning altan';
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

/** Room/function grouping for the control list, without changing HA names or areas. */
const controlRooms=[
 ['kitchen','Kök',/\bkok\w*\b/],['dining','Matsal',/\bmatsal\w*\b/],['living','Vardagsrum',/\bvardagsrum\w*\b|\btv\s*bank\b/],
 ['hall','Hall & trappa',/\bhall\w*\b|\btrapp\w*\b/],['small-bath','Lilla badrummet',/\blilla\s+badrum\w*\b/],['big-bath','Stora badrummet',/\bstora\s+badrum\w*\b/],
 ['viljar','Viljars rum',/\bviljar\w*\b|\bsov(?:rum)?\s*1\b/],['bedroom2','Sovrum 2',/\bsov(?:rum)?\s*2\b/],['sauna','Bastu',/\bbastu\w*\b/],
 ['laundry','Tvättstuga',/\btvatt\w*\b/],['garage','Garage & verkstad',/\bgarage\w*\b|\bverkstad\w*\b/],['chicken','Hönshus',/\bhonshus\w*\b/],
 ['patio','Altan',/\baltan\w*\b|\bterrass\w*\b/],['porch','Entré & bron',/\bbron\b|\bentre\w*\b/],['poles','Stolpar',/\bstolp\w*\b/],
 ['charging','Laddplats',/\beasee\b|\bladdbox\w*\b/],['yard','Gårdsbelysning',/\bute\w*\b|\boutdoor\b|\bskymning\b|\bharbre\b/],
] as const;
const normalizedRoom=(s:string)=>roomDisplayName(s).toLocaleLowerCase('sv-SE').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[_-]/g,' ');
export function controlRoom(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 const entry=catalog.find(e=>e.entityId===o.entityId),area=normalizedRoom(entry?.area??''),names=normalizedRoom(o.name+' '+String(states.get(o.entityId)?.attributes.friendly_name??'')+' '+o.entityId);
 const room=controlRooms.find(([, ,match])=>match.test(area))??controlRooms.find(([, ,match])=>match.test(names));
 return room?{key:room[0],label:room[1],order:controlRooms.indexOf(room)}:{key:'other',label:'Fler funktioner',order:controlRooms.length};
}
const functionOrder=(o:SceneObject)=>{
 const text=normalizedRoom(o.name);
 return /\btak\w*\b|takspot/.test(text)?0:/\bbank\w*\b/.test(text)?1:/bord/.test(text)?2:/fonster/.test(text)?3:/hyll/.test(text)?4:/vagg/.test(text)?5:/led/.test(text)?6:7;
};
export function groupControlsByRoom(entries:SceneObject[],states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 const groups=new Map<string,{key:string;label:string;order:number;entries:SceneObject[]}>();
 for(const entry of entries){const room=controlRoom(entry,states,catalog);let group=groups.get(room.key);if(!group){group={...room,entries:[]};groups.set(room.key,group);}group.entries.push(entry);}
 return [...groups.values()].sort((a,b)=>a.order-b.order).map(group=>({...group,entries:group.entries.sort((a,b)=>functionOrder(a)-functionOrder(b)||a.name.localeCompare(b.name,'sv-SE',{numeric:true}))}));
}
