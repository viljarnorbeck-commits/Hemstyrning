import {MusicPanel} from './music-panel';import type {Connection} from './connection';import type {Configuration} from './configuration';
let player:MusicPanel|undefined;
export function getMusicPanel(connection:Connection,config:Configuration,notify:(text:string)=>void){player??=new MusicPanel(connection,config,notify);player.setNotify(notify,config);return player;}


export function suspendMusicView(){player?.suspendView();}
