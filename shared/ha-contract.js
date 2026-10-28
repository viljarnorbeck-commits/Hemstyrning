/** HA's documented supported_features bitmasks, shared by UI, bridge and simulator. */
export const MEDIA_FEATURES = Object.freeze({media_play:16384,media_pause:1,media_next_track:32,media_previous_track:16,volume_set:4,select_source:2048});
export function available(state){return !!state && !['unknown','unavailable'].includes(state.state);}
export function mediaSupports(state,service){return available(state)&&Object.hasOwn(MEDIA_FEATURES,service)&&(Number(state.attributes.supported_features??0)&MEDIA_FEATURES[service])!==0;}
export function robotSupports(state,action){
 if(!available(state))return false;
 const bits={mower_start:1,mower_pause:2,mower_dock:4,vacuum_start:8192,vacuum_pause:4,vacuum_dock:16};
 return Object.hasOwn(bits,action)&&(Number(state.attributes.supported_features??0)&bits[action])!==0;
}
/** A short Spotify link alone cannot establish that its destination is a Jam. */
export function canonicalJamUrl(input){
 try{const u=new URL(String(input).trim());if(u.protocol!=='https:'||u.hostname!=='open.spotify.com'||u.username||u.password||u.port||u.hash||!/^\/socialsession\/[A-Za-z0-9]{10,128}\/?$/.test(u.pathname)||u.href.length>1000)return null;return u.href;}catch{return null;}
}
export function spotifyShortUrl(input){
 try{const u=new URL(String(input).trim());return u.protocol==='https:'&&u.hostname==='spotify.link'&&!u.username&&!u.password&&!u.port&&!u.hash&&/^\/[A-Za-z0-9]{5,100}$/.test(u.pathname)&&u.href.length<=1000?u.href:null;}catch{return null;}
}
