import type {Configuration} from './configuration';
import {escapeHtml as esc} from './panels';

export function weatherSettings(config:Configuration){
 const root=document.createElement('section');root.id='weather-settings';let busy=false;
 const w=config.value.weather??{provider:'home-assistant',placeName:'',latitude:config.value.location.latitude,longitude:config.value.location.longitude};
 root.innerHTML=`<h2>Väderkälla</h2><p>SMHI visar en prognos för vald plats. Utomhusgivarens uppmätta temperatur visas separat. Platsen här ändrar inte gårdens 3D-kalibrering.</p><label>Källa<select data-weather-provider><option value="home-assistant" ${w.provider==='home-assistant'?'selected':''}>Home Assistant</option><option value="smhi" ${w.provider==='smhi'?'selected':''}>SMHI · prognos</option></select></label><label>Platsnamn<input data-weather-place maxlength="100" value="${esc(w.placeName)}" placeholder="Ort, kommun"></label><label>Latitud<input data-weather-lat type="number" step="0.0001" min="-90" max="90" value="${w.latitude}"></label><label>Longitud<input data-weather-lon type="number" step="0.0001" min="-180" max="180" value="${w.longitude}"></label>${document.body.dataset.serverRole==='admin'?'<button type="button" data-save-weather>Spara väderkälla</button>':'<p>Väderkällan kan ändras i administratörsvyn på datorn.</p>'}<p role="status" data-weather-message></p>`;
 root.addEventListener('click',async event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('[data-save-weather]');if(!button)return;event.stopPropagation();if(busy||button.disabled)return;
  const message=root.querySelector<HTMLElement>('[data-weather-message]')!;
  const provider=root.querySelector<HTMLSelectElement>('[data-weather-provider]')!.value,placeName=root.querySelector<HTMLInputElement>('[data-weather-place]')!.value.trim();
  const lat=root.querySelector<HTMLInputElement>('[data-weather-lat]')!.value,lon=root.querySelector<HTMLInputElement>('[data-weather-lon]')!.value;
  const latitude=Number(lat),longitude=Number(lon);
  if(!['smhi','home-assistant'].includes(provider)||provider==='smhi'&&!placeName||!lat||!lon||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){message.textContent='Ange platsnamn och giltiga koordinater.';return;}
  busy=true;button.disabled=true;message.textContent='Sparar…';
  try{
   const response=await fetch('/workspace-api/scene');if(!response.ok)throw Error('Konfigurationen kunde inte läsas');
   const latest=await response.json();latest.weather={provider,placeName,latitude,longitude};config.value=latest;config.changed();await config.save();message.textContent=config.status;
  }catch(error){message.textContent=error instanceof Error?error.message:'Väderkällan kunde inte sparas';}
  finally{busy=false;button.disabled=false;}
 });
 return root;
}
