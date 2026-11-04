export interface CardPlacement{id:string;area:'top'|'left'|'right'|'bottom';order:number;accent:string;minWidth:number}
/** Layout only. Areas anchor the cards to the perimeter; their content has no coordinates. */
export const overviewLayout:CardPlacement[]=[
 {id:'grid',area:'top',order:0,accent:'#f4ab65',minWidth:160},{id:'cost',area:'top',order:1,accent:'#f4ab65',minWidth:260},{id:'solar',area:'top',order:2,accent:'#ebc573',minWidth:160},{id:'house2',area:'top',order:3,accent:'#f4ab65',minWidth:160},
 {id:'kia',area:'left',order:0,accent:'#84b8fa',minWidth:190},{id:'golf',area:'left',order:1,accent:'#84b8fa',minWidth:190},
 {id:'locks',area:'right',order:0,accent:'#8ad6ab',minWidth:190},{id:'climate',area:'right',order:1,accent:'#75d3d2',minWidth:190},
 {id:'mower',area:'bottom',order:0,accent:'#8ad6ab',minWidth:160},{id:'vacuum',area:'bottom',order:1,accent:'#8ad6ab',minWidth:200},{id:'weather',area:'bottom',order:2,accent:'#a6b6cc',minWidth:300}];

/** Normalized photograph anchors. The complete dwelling/garage silhouette stays clear.
 * Upper field, left perimeter and foreground hold the information instead of the roof/facade.
 */
export const photoCardLayout:Record<string,{x:number;y:number;width:number;minWidth:number}>={
 weather:{x:.025,y:.035,width:.30,minWidth:310},
 climate:{x:.36,y:.025,width:.125,minWidth:124},
 cost:{x:.35,y:.20,width:.145,minWidth:200},
 locks:{x:.825,y:.255,width:.15,minWidth:180},
 kia:{x:.025,y:.62,width:.095,minWidth:126},
 golf:{x:.145,y:.62,width:.095,minWidth:126},
 solar:{x:.30,y:.66,width:.105,minWidth:145},
 house2:{x:.28,y:.83,width:.13,minWidth:150},
 grid:{x:.725,y:.79,width:.105,minWidth:150},
 mower:{x:.515,y:.105,width:.105,minWidth:150},
 vacuum:{x:.675,y:.04,width:.13,minWidth:190},
};
