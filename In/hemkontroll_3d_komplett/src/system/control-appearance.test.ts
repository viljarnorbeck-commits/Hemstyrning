import{it,expect}from'vitest';
import{controlAppearance}from'./control-appearance';
import{lightPlacement,sortLightsByLocation}from'./control-presentation';
import type{SceneObject,HassState}from'./types';
const lamp=(id:string,name:string)=>({id,entityId:'light.'+id,name,type:'light'}as SceneObject);
const states=new Map<string,HassState>();
it('keeps room-based floor guesses provisional and lets an explicit HA floor override the room guess',()=>{
 const o=lamp('viljar','Viljars hyllor');expect(lightPlacement(o,states)).toMatchObject({key:'upstairs',provisional:true});
 expect(lightPlacement(o,states,[{entityId:o.entityId,name:o.name,area:'Nere',platform:'knx',disabled:false}])).toMatchObject({key:'downstairs',provisional:false});
 expect(lightPlacement(lamp('kitchen','Köksbord'),states)).toMatchObject({key:'downstairs',provisional:true});
 expect(lightPlacement(lamp('garden','Utanför hönshus'),states)).toMatchObject({key:'outside',provisional:false});
});
it('assigns identical colours within a group, different colours across groups, and a visible type subtitle',()=>{
 const first=controlAppearance(lamp('a','Sovrum 1 Tak'),states),second=controlAppearance(lamp('b','Viljars hyllor'),states),outside=controlAppearance(lamp('c','Utelampa'),states);
 expect(first.style).toBe(second.style);expect(first.style).not.toBe(outside.style);expect(first.label).toBe('Belysning · Uppe (preliminärt)');
 const heater=(id:string)=>({id,entityId:'switch.motorvarmare_'+id,name:'Motorvärmare '+id,type:'device'}as SceneObject);
 expect(controlAppearance(heater('1'),states).style).toBe(controlAppearance(heater('2'),states).style);
 expect(controlAppearance(heater('1'),states).label).toBe('Motorvärmare');
});
it('sorts the same floor groups together while retaining lamp identity',()=>{
 const values=[lamp('outside','Utelampa'),lamp('kitchen','Köksbord'),lamp('bedroom','Sovrum 1 Tak'),lamp('unknown','Festen')];
 expect(sortLightsByLocation(values,states).map(o=>o.id)).toEqual(['bedroom','kitchen','outside','unknown']);expect(values[0]!.id).toBe('outside');
});
