export interface CardPlacement{id:string;area:'top'|'left'|'right'|'bottom';order:number;accent:string;minWidth:number}
/** Layout only. Areas anchor the cards to the perimeter; their content has no coordinates. */
export const overviewLayout:CardPlacement[]=[
 {id:'grid',area:'top',order:0,accent:'#f4ab65',minWidth:160},{id:'cost',area:'top',order:1,accent:'#f4ab65',minWidth:260},{id:'solar',area:'top',order:2,accent:'#ebc573',minWidth:160},{id:'house2',area:'top',order:3,accent:'#f4ab65',minWidth:160},
 {id:'kia',area:'left',order:0,accent:'#84b8fa',minWidth:190},{id:'golf',area:'left',order:1,accent:'#84b8fa',minWidth:190},
 {id:'locks',area:'right',order:0,accent:'#8ad6ab',minWidth:190},{id:'climate',area:'right',order:1,accent:'#75d3d2',minWidth:190},
 {id:'robots',area:'bottom',order:0,accent:'#8ad6ab',minWidth:260},{id:'weather',area:'bottom',order:1,accent:'#a6b6cc',minWidth:300}];
