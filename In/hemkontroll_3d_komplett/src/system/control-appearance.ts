import {controlGroup,lightLocation} from './control-presentation';
import type {ControlEntityMetadata} from './control-devices';
import type {SceneObject,HassState} from './types';

/** Shared group colours for both lists, independent of individual entity IDs. */
const themes={
 outside:['#39b578','#248e82','#246c7e'],
 upstairs:['#b65bc6','#854abd','#62479e'],
 downstairs:['#459dd4','#3a79c1','#455eab'],
 basement:['#39b4ad','#278e98','#406f8d'],
 inside:['#d5a63d','#bc7b3b','#96565d'],
 heaters:['#e18e40','#b46536','#874854'],
 outlets:['#28a8be','#258499','#3a5b7e'],
 switches:['#ba648f','#925c9d','#6c608e'],
 vacuum:['#d4787e','#b95382','#874f8d'],
 mower:['#7dac51','#598e64','#436f73'],
 cars:['#608eab','#526fa0','#615f91'],
 climate:['#6aaa93','#498f8c','#52788d'],
 other:['#82708e','#6b718c','#5c7885'],
} as const;
type Theme=keyof typeof themes;
const normalized=(s:string)=>s.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[_-]/g,' ');
function floor(text:string):'upstairs'|'downstairs'|'basement'|undefined{
 if(/\b(?:kallare\w*|basement)\b/.test(text))return'basement';
 if(/\b(?:uppe|overvaning\w*|ovanvaning\w*|overplan|upstairs)\b|\b(?:plan|vaning)\s*2\b/.test(text))return'upstairs';
 if(/\b(?:nere|nedervaning\w*|bottenvaning\w*|entreplan|nedre plan|downstairs)\b|\b(?:plan|vaning)\s*1\b/.test(text))return'downstairs';
 return undefined;
}
export function controlAppearance(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 const entry=catalog.find(e=>e.entityId===o.entityId),area=entry?.area?.trim()??'';
 const names=normalized(o.name+' '+String(states.get(o.entityId)?.attributes.friendly_name??'')+' '+o.entityId);
 const outside=lightLocation(o,states,catalog)==='outside',level=floor(normalized(area))??floor(names);
 const location=outside?'Ute':level==='upstairs'?'Uppe':level==='downstairs'?'Nere':level==='basement'?'Källare':lightLocation(o,states,catalog)==='inside'?'Inne':'Placering oklar';
 const group=controlGroup(o,states,catalog);let theme:Theme='other',label='Övrigt';
 if(group==='lights'){theme=outside?'outside':level??(location==='Inne'?'inside':'other');label='Belysning · '+location;}
 else if(group==='heaters'){theme='heaters';label='Motorvärmare';}
 else if(group==='outlets'){theme='outlets';label='Uttag'+(area?' · '+area:outside?' · Ute':'');}
 else if(o.type==='vacuum'){theme='vacuum';label='Robotdammsugare';}
 else if(o.type==='mower'){theme='mower';label='Gräsklippare';}
 else if(o.type==='car'){theme='cars';label='Bil';}
 else if(o.entityId.includes('vvb_')||o.entityId.startsWith('climate.')){theme='climate';label='Värme & klimat';}
 else if(group==='switches'){theme='switches';label='Brytare'+(area?' · '+area:'');}
 const [c1,c2,c3]=themes[theme];return{theme,label,style:`--c1:${c1};--c2:${c2};--c3:${c3}`};
}
