/** Refuse command-bearing browser tests when the central bridge targets actual equipment. */
export default async function setup(){
 const info=await fetch('http://localhost:5173/connection-api/info').then(r=>{if(!r.ok)throw new Error('Starta npm run dev före webbläsartester');return r.json();});
 if(info.mode!=='simulator')throw new Error('Webbläsartester kräver lokal simulator. Avbryter före alla styrkommandon.');
 const health=await fetch('http://localhost:8123/health').then(r=>r.json());
 if(health.status!=='ok'||health.mode!=='simulation')throw new Error('Den lokala simulatorn är inte tillgänglig');
}
