import{platformSetup}from'./client-platform';
platformSetup();
import './style.css';
import './v2.css';
async function boot(){try{const r=await fetch('/app-api/info');if(r.ok){const info=await r.json();if(info.protocol!==1){document.body.textContent='Appen och servern använder inkompatibla versioner. Uppdatera appen eller servern.';return;}document.body.dataset.serverVersion=info.version;}}catch{}
if(location.pathname==='/control')void import('./control');
else if(location.pathname==='/settings')void import('./settings-v2');
else if(location.pathname==='/install'||location.pathname==='/device')void import('./install');
else if (location.pathname.startsWith('/dev/simulator')) void import('./simulator-ui');
else if (location.pathname.startsWith('/editor')) void import('./app');
else void import('./home');
}
void boot();
export {};
