import{startNavigation}from'./app-navigation';
import{platformSetup}from'./client-platform';
platformSetup();
import './style.css';
import './v2.css';
import './design-language.css';
async function boot(){try{const r=await fetch('/app-api/info');if(r.ok){const info=await r.json();if(info.protocol!==1){document.body.textContent='Appen och servern använder inkompatibla versioner. Uppdatera appen eller servern.';return;}document.body.dataset.serverVersion=info.version;}}catch{}
startNavigation();
if(location.pathname==='/dev/screens')void import('./screen-demo');
else if(['/energy','/cars','/climate','/mower','/security'].includes(location.pathname))void import('./function-pages');
else if(['/control','/lights'].includes(location.pathname))void import('./control');
else if(location.pathname==='/music')void import('./music-page');
else if(location.pathname==='/settings')void import('./settings-v2');
else if(location.pathname==='/install'||location.pathname==='/device')void import('./install');
else if (location.pathname.startsWith('/dev/simulator')) void import('./simulator-ui');
else if (location.pathname.startsWith('/editor')) void import('./app');
else void import('./home');
}
void boot();
export {};
