import {test as base} from '@playwright/test';import WebSocket from 'ws';
export * from '@playwright/test';
/** Shared server view state needs the same per-test isolation as browser contexts. */
export const test=base.extend<{sharedViewIsolation:void}>({sharedViewIsolation:[async({request},use)=>{
 const info=await request.get('/connection-api/info').then(r=>r.json());if(info.mode!=='simulator')throw Error('Visningstester kräver simulatorn');
 await new Promise<void>((resolve,reject)=>{
  const ws=new WebSocket('ws://localhost:5173/screen-ws');const timeout=setTimeout(()=>{ws.terminate();reject(Error('Gemensam testvisning kunde inte återställas'));},10000);
  const fail=(e:Error)=>{clearTimeout(timeout);ws.terminate();reject(e);};ws.on('error',fail);
  ws.on('open',()=>ws.send(JSON.stringify({type:'hello',kind:'control'})));
  ws.on('message',raw=>{const m=JSON.parse(String(raw));if(m.type==='ready')ws.send(JSON.stringify({type:'view',mode:'HOME'}));if(m.type==='ViewState'&&m.state.mode==='HOME'){clearTimeout(timeout);ws.close();resolve();}if(m.type==='error')fail(Error(m.message));});
 });await use();
 },{auto:true}]});
