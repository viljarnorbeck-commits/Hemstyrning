export interface CardPlacement{id:string;area:'top'|'left'|'right'|'bottom';order:number;accent:string;minWidth:number}
/** Layout only. Areas anchor the cards to the perimeter; their content has no coordinates. */
export const overviewLayout:CardPlacement[]=[
 {id:'grid',area:'top',order:0,accent:'#f4ab65',minWidth:160},{id:'cost',area:'top',order:1,accent:'#f4ab65',minWidth:260},{id:'solar',area:'top',order:2,accent:'#ebc573',minWidth:160},{id:'house2',area:'top',order:3,accent:'#f4ab65',minWidth:160},
 {id:'kia',area:'left',order:0,accent:'#84b8fa',minWidth:190},{id:'golf',area:'left',order:1,accent:'#84b8fa',minWidth:190},
 {id:'locks',area:'right',order:0,accent:'#8ad6ab',minWidth:190},{id:'climate',area:'right',order:1,accent:'#75d3d2',minWidth:190},
 {id:'robots',area:'bottom',order:0,accent:'#8ad6ab',minWidth:260},{id:'weather',area:'bottom',order:1,accent:'#a6b6cc',minWidth:300}];

/** User's annotated photograph. Normalized image coordinates, independent of data and viewport crop. */
export const photoCardLayout:Record<string,{x:number;y:number;width:number;minWidth:number}>={
 weather:{x:.025,y:.08,width:.30,minWidth:310},
 climate:{x:.411,y:.205,width:.09,minWidth:124},
 cost:{x:.532,y:.105,width:.135,minWidth:210},
 locks:{x:.69,y:.075,width:.115,minWidth:180},
 kia:{x:.055,y:.43,width:.085,minWidth:126},
 golf:{x:.175,y:.425,width:.085,minWidth:126},
 solar:{x:.04,y:.77,width:.105,minWidth:145},
 house2:{x:.24,y:.88,width:.13,minWidth:150},
 grid:{x:.725,y:.79,width:.105,minWidth:150},
 robots:{x:.84,y:.29,width:.145,minWidth:195},
};
