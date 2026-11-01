/** Refuse command-bearing browser tests when the central bridge targets actual equipment. */
export default async function setup(){
 const base=process.env.HEM_E2E_BASE_URL??'http://localhost:5173';
 const info=await fetch(base+'/connection-api/info').then(r=>{if(!r.ok)throw new Error('Starta npm run dev före webbläsartester');return r.json();});
 if(info.mode!=='simulator')throw new Error('Webbläsartester kräver lokal simulator. Avbryter före alla styrkommandon.');
 const health=await fetch((process.env.HEM_E2E_BACKEND_URL??'http://localhost:8123')+'/health').then(r=>r.json());
 if(health.status!=='ok'||health.mode!=='simulation')throw new Error('Den lokala simulatorn är inte tillgänglig');
}
