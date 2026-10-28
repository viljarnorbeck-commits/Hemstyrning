import type {StateStore} from './store.js';
import {canonicalJamUrl,spotifyShortUrl} from '../../../shared/ha-contract.js';

export const demoTracks=[
 {title:'Ljus över gården',artist:'Hemkontroll · testartist',album:'Nordiska rum · simulator',duration:214,cover:'/textures/music/dawn.svg'},
 {title:'Kväll vid havet',artist:'Hemkontroll · testartist',album:'Nordiska rum · simulator',duration:188,cover:'/textures/music/coast.svg'},
 {title:'Efter regnet',artist:'Hemkontroll · testartist',album:'Nordiska rum · simulator',duration:243,cover:'/textures/music/rain.svg'},
];
export const simulatedSpotifyId='media_player.spotify_simulated';
export const simulatedFeatures=16384|1|32|16|4|2048;
export function setDemoTrack(store:StateStore,id:string,index:number,state='playing'){
 const track=demoTracks[(index+demoTracks.length)%demoTracks.length]!;
 store.set(id,state,{media_title:track.title,media_artist:track.artist,media_album_name:track.album,media_duration:track.duration,media_position:0,media_position_updated_at:new Date().toISOString(),entity_picture:track.cover,track_index:(index+demoTracks.length)%demoTracks.length});
}
export function advanceMedia(store:StateStore,seconds:number){
 for(const state of store.all().filter(s=>s.entity_id.startsWith('media_player.')&&s.attributes.simulated===true&&s.state==='playing')){
  const position=Number(state.attributes.media_position??0)+seconds,duration=Number(state.attributes.media_duration??0);
  if(duration>0&&position>=duration)setDemoTrack(store,state.entity_id,Number(state.attributes.track_index??0)+1);
  else store.set(state.entity_id,'playing',{media_position:position,media_position_updated_at:new Date().toISOString()});
 }
}
/** No credentials, arbitrary hosts, or automatic redirects allowed. */
export async function resolveJamLink(input:unknown,request:typeof fetch=fetch):Promise<string>{
 const canonical=canonicalJamUrl(input);if(canonical)return canonical;
 let url=spotifyShortUrl(input);if(!url)throw new Error('Ange en Spotify Jam-inbjudan, inte en låt eller spellista.');
 for(let hop=0;hop<4;hop++){
  const response=await request(url,{redirect:'manual',signal:AbortSignal.timeout(7000)});
  await response.body?.cancel();
  const location=response.headers.get('location');
  if(response.status<300||response.status>=400||!location)break;
  const target=new URL(location,url).href,valid=canonicalJamUrl(target);if(valid)return valid;
  url=spotifyShortUrl(target);if(!url)break;
 }
 throw new Error('Kortlänken kunde inte bekräftas som Jam. Kopiera den fullständiga socialsession-länken från Spotify.');
}
