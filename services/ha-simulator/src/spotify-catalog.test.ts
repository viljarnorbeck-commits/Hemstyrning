import {it,expect} from 'vitest';
import express from 'express';
import type {AddressInfo} from 'node:net';
import {spotifyCatalog,playbackSelection} from './spotify-catalog.js';

it('searches tracks, artists, albums and playlists through the same catalog without exposing unsafe artwork',async()=>{
 const calls:string[]=[],app=express(),router=express.Router();
 spotifyCatalog(router,()=>true,async path=>{calls.push(path);return Object.fromEntries(['tracks','artists','albums','playlists'].map((key,i)=>[key,{items:[{uri:'spotify:'+['track','artist','album','playlist'][i]+':test',name:key,images:[{url:'http://192.168.0.1/private'}]}]}]));});app.use(router);
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 try{const data=await fetch('http://127.0.0.1:'+(server.address() as AddressInfo).port+'/search?q=Test').then(r=>r.json());for(const key of ['tracks','artists','albums','playlists']){expect(data[key]).toHaveLength(1);expect(data[key][0].cover).toBe('');}expect(calls).toHaveLength(1);expect(new URL('https://api.spotify.com'+calls[0]).searchParams.get('type')).toBe('track,artist,album,playlist');}
 finally{await new Promise<void>(r=>server.close(()=>r()));}
});
it('preserves playlist positions across missing entries and both current and legacy item formats',async()=>{
 const app=express(),router=express.Router();spotifyCatalog(router,()=>true,async path=>path.includes('/items?')?{items:[{item:{uri:'spotify:track:first',name:'First'}},null,{track:{uri:'spotify:track:third',name:'Third'}}],total:43,next:'next'}:{uri:'spotify:playlist:test',name:'Playlist'});app.use(router);
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 try{const data=await fetch('http://127.0.0.1:'+(server.address() as AddressInfo).port+'/browse/playlist/test?offset=20').then(r=>r.json());expect(data.items.map((i:any)=>i.position)).toEqual([20,22]);expect(data.items.every((i:any)=>i.contextUri==='spotify:playlist:test')).toBe(true);expect(data.nextOffset).toBe(40);}
 finally{await new Promise<void>(r=>server.close(()=>r()));}
});
it('uses Spotify playback contexts for continuation and rejects invalid selections before any provider call',async()=>{
 const calls:string[]=[],spotify=async(path:string)=>{calls.push(path);return {album:{uri:'spotify:album:test'}};};
 await expect(playbackSelection('play_track',{uri:'spotify:track:first'},spotify)).resolves.toEqual({context_uri:'spotify:album:test',offset:{uri:'spotify:track:first'}});
 await expect(playbackSelection('play_track',{uri:'spotify:track:third',contextUri:'spotify:playlist:test',position:22},spotify)).resolves.toEqual({context_uri:'spotify:playlist:test',offset:{position:22}});
 await expect(playbackSelection('play_context',{uri:'spotify:artist:test'},spotify)).resolves.toEqual({context_uri:'spotify:artist:test'});
 await expect(playbackSelection('play_track',{uri:'spotify:track:first',contextUri:'http://other'},spotify)).rejects.toThrow();
 await expect(playbackSelection('play_track',{uri:'spotify:track:first',contextUri:'spotify:playlist:test',position:-1},spotify)).rejects.toThrow();
 expect(calls).toEqual(['/tracks/first']);
});
