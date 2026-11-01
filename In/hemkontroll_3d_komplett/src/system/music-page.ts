import {getMusicPanel} from './music-session';
import {Configuration} from './configuration';
import {PageScope} from './app-session';
export function mount(root:HTMLElement){const scope=new PageScope();
root.innerHTML='<main class="music-page"><header><small>DITT HEM / MUSIK</small><h1>Musik i hela hemmet</h1><p>Välj en låt och var den ska spelas.</p></header><section id="music-content"></section></main>';
const config=new Configuration(),connection=scope.connection;
const ready=config.load(true).then(()=>{if(!scope.active)return;scope.onActivate(()=>{const music=getMusicPanel(connection,config,()=>{});music.mountPage(root.querySelector<HTMLElement>("#"+('music-content'))!);music.update();void connection.start();});});

return {ready,activate:()=>scope.activate(),dispose:()=>scope.dispose()};
}
