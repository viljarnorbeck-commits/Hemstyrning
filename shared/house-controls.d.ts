import type{StateLike}from'./ha-contract';
export const houseControls:Readonly<{up:string;down:string;stop:string;projector:string;sound:string;hdmi:string;shutdown:string}>;
export function houseMediaSupports(state:StateLike|undefined,action:string):boolean;
