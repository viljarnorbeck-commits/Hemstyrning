/** Verified from HA dashboard-hemmet/Bio; never infer entities from icon appearance. */
export const houseControls=Object.freeze({up:'switch.tcw181_1_duk_upp',down:'switch.tcw181_2_duk_ner',stop:'switch.tcw181_3_duk_stop',projector:'switch.projector',sound:'media_player.ht_a9_2',hdmi:'input_select.hdmi_input',shutdown:'script.bio_stang_av_allt'});
export function houseMediaSupports(state,action){
 if(!state||['unknown','unavailable'].includes(state.state))return false;
 const bit={turn_on:128,turn_off:256,volume_up:1024,volume_down:1024}[action];
 return !!bit&&(Number(state.attributes.supported_features)&bit)!==0;
}
