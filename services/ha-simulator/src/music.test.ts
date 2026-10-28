import {describe,it,expect,vi} from 'vitest';
import {StateStore} from './store.js';
import {createInitialStates} from './fixtures.js';
import {callService} from './services.js';
import {advanceMedia,simulatedSpotifyId as id,resolveJamLink} from './music.js';
import {canonicalJamUrl} from '../../../shared/ha-contract.js';

describe('HA-compatible media player',()=>{
 it('plays, pauses, skips, sets volume and transfers to available sources',async()=>{
  const store=new StateStore(createInitialStates());
  const send=(service:string,data={})=>callService(store,{domain:'media_player',service,serviceData:{entity_id:id,...data}},0);
  await send('media_play');expect(store.get(id)?.state).toBe('playing');
  const position=Number(store.get(id)?.attributes.media_position);advanceMedia(store,3);expect(Number(store.get(id)?.attributes.media_position)).toBe(position+3);
  const title=store.get(id)?.attributes.media_title;await send('media_next_track');expect(store.get(id)?.attributes.media_title).not.toBe(title);await send('media_previous_track');expect(store.get(id)?.attributes.media_title).toBe(title);
  await send('volume_set',{volume_level:.72});await send('select_source',{source:'Kök'});expect(store.get(id)?.attributes).toMatchObject({volume_level:.72,source:'Kök'});
  await send('media_pause');const paused=store.get(id)?.attributes.media_position;advanceMedia(store,2);expect(store.get(id)?.attributes.media_position).toBe(paused);
  await expect(send('volume_set',{volume_level:2})).rejects.toThrow();await expect(send('select_source',{source:'Unknown'})).rejects.toThrow();
  store.set(id,'unavailable');await expect(send('media_play')).rejects.toThrow();store.set(id,'paused',{supported_features:0});await expect(send('media_play')).rejects.toThrow();
 });
 it('automatically changes tracks at the end without inventing a Jam',()=>{const store=new StateStore(createInitialStates());store.set(id,'playing');const title=store.get(id)?.attributes.media_title;advanceMedia(store,300);expect(store.get(id)?.attributes.media_title).not.toBe(title);expect(store.get(id)?.attributes.jam_url).toBeUndefined();});
});
describe('Jam links',()=>{
 const jam='https://open.spotify.com/socialsession/0123456789AbCdEf?si=abc';
 it('accepts only canonical invitation paths and never treats a song as Jam',()=>{
  expect(canonicalJamUrl(jam)).toBe(jam);
  for(const url of ['https://open.spotify.com/track/1234567890','https://open.spotify.com/playlist/1234567890','https://spotify.link/abcde','https://open.spotify.com.evil.test/socialsession/1234567890','javascript:alert(1)','https://user:pass@open.spotify.com/socialsession/1234567890'])expect(canonicalJamUrl(url)).toBeNull();
 });
 it('resolves a trusted short link, rejects playlist redirects and never follows arbitrary hosts',async()=>{
  const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:302,headers:{location:jam}}));expect(await resolveJamLink('https://spotify.link/AbCdEf12345',fetcher)).toBe(jam);
  fetcher.mockResolvedValue(new Response(null,{status:302,headers:{location:'http://127.0.0.1:8123/api/states'}}));await expect(resolveJamLink('https://spotify.link/AbCdEf12345',fetcher)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockResolvedValue(new Response(null,{status:302,headers:{location:'https://open.spotify.com/track/1234567890'}}));await expect(resolveJamLink('https://spotify.link/AbCdEf12345',fetcher)).rejects.toThrow();
 });
});
