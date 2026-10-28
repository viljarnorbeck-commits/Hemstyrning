import {it,expect} from 'vitest';
import {mediaPosition,mediaSupports,artwork} from './music-data';
import type {HassState} from './types';
const state:HassState={entity_id:'media_player.test',state:'playing',attributes:{media_duration:180,media_position:40,media_position_updated_at:'2026-10-28T12:00:00Z',supported_features:16384|1|32|2048},last_updated:'2026-10-28T12:00:00Z'};
it('bounds progress estimation when Spotify reports slowly and freezes paused positions',()=>{expect(mediaPosition(state,Date.parse('2026-10-28T12:00:05Z'))).toBe(45);expect(mediaPosition(state,Date.parse('2026-10-28T13:00:00Z'))).toBe(70);expect(mediaPosition({...state,state:'paused'},Date.parse('2026-10-28T13:00:00Z'))).toBe(40);expect(mediaPosition(undefined)).toBeNull();});
it('uses real feature masks and never enables unsupported or unavailable playback',()=>{expect(mediaSupports(state,'media_play')).toBe(true);expect(mediaSupports(state,'volume_set')).toBe(false);expect(mediaSupports({...state,state:'unavailable'},'media_play')).toBe(false);expect(mediaSupports(state,'play_media')).toBe(false);});
it('uses the server artwork proxy for real entities, and only local demo artwork for simulator',()=>{expect(artwork({...state,attributes:{entity_picture:'/api/media_player_proxy/test?token=secret'}},'/connection-api',false)).not.toContain('secret');expect(artwork({...state,attributes:{entity_picture:'javascript:alert(1)'}},'/connection-api',true)).toBe('');});

it('recognizes actual HA robot masks without a simulator command attribute',async()=>{
 const {robotSupports}=await import('../../../../shared/ha-contract.js');
 expect(robotSupports({state:'docked',attributes:{supported_features:7}},'mower_start')).toBe(true);
 expect(robotSupports({state:'docked',attributes:{supported_features:8192|4|16}},'vacuum_start')).toBe(true);
 expect(robotSupports({state:'docked',attributes:{supported_features:4}},'vacuum_start')).toBe(false);
 expect(robotSupports({state:'unavailable',attributes:{supported_features:15}},'mower_dock')).toBe(false);
});
