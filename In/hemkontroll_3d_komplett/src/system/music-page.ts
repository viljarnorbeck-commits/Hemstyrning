import {getMusicPanel} from './music-session';
import {Configuration} from './configuration';
import {Connection} from './connection';
import {MusicPanel} from './music-panel';
import {PageScope} from './app-session';
export function mount(root:HTMLElement){const scope=new PageScope();
root.innerHTML='<main class="music-page"><small>DITT HEM / MUSIK</small><h1>Spotify</h1><p>Musik, uppspelningsenheter och Spotify Jam.</p><p id="music-notice" role="status"></p><section id="music-content"></section></main>';
const config=new Configuration(),connection=scope.connection;
const ready=config.load().then(()=>{if(!scope.active)return;scope.onActivate(()=>{const music=getMusicPanel(connection,config,text=>{if(!scope.active)return;root.querySelector<HTMLElement>("#"+('music-notice'))!.textContent=text;});music.mountPage(root.querySelector<HTMLElement>("#"+('music-content'))!);connection.addEventListener('state',()=>music.update());connection.addEventListener('connection',()=>music.update());music.update();void connection.start();scope.disposeWith(()=>{connection.stop();});});});

return {ready,activate:()=>scope.activate(),dispose:()=>scope.dispose()};
}
