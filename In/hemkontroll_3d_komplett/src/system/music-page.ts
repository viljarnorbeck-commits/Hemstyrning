import {Configuration} from './configuration';
import {Connection} from './connection';
import {MusicPanel} from './music-panel';
document.body.classList.add('control-mode');
document.body.innerHTML='<main class="music-page"><small>DITT HEM / MUSIK</small><h1>Spotify</h1><p>Musik, uppspelningsenheter och Spotify Jam.</p><p id="music-notice" role="status"></p><section id="music-content"></section></main>';
const config=new Configuration(),connection=new Connection();
void config.load().then(()=>{const music=new MusicPanel(connection,config,text=>{document.getElementById('music-notice')!.textContent=text;});music.mountPage(document.getElementById('music-content')!);connection.addEventListener('state',()=>music.update());connection.addEventListener('connection',()=>music.update());music.update();void connection.start();window.addEventListener('pagehide',()=>{music.dispose();connection.stop();});});
