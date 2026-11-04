import {test,expect} from './test';
import {fixture} from './fixtures';
test('both lamp lists group indoor and outdoor lamps while omitting unclear lamps without changing device state',async({page,request})=>{
 await fixture(page);const lamps=[{id:'location-inside',entityId:'light.location_inside',name:'Köksbord test'},{id:'location-outside',entityId:'light.location_outside',name:'Utelampa test'},{id:'location-uncertain',entityId:'light.location_uncertain',name:'Festen test'}];
 const original=await request.get('/workspace-api/scene').then(r=>r.json()),base=original.objects.find((o:any)=>o.type==='light');
 await page.route('**/workspace-api/scene',async r=>{if(r.request().method()!=='GET'){await r.continue();return;}const c=await(await r.fetch()).json();c.objects.push(...lamps.map(o=>({...base,...o,placementConfirmed:false})));await r.fulfill({json:c});});
 await page.route('**/spotify-api/**',r=>r.fulfill({json:{connected:false,configured:false}}));
 let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))writes++;});
 try{
  for(const lamp of lamps)await request.post('/dev-api/states/'+lamp.entityId,{data:{state:'off',attributes:{friendly_name:lamp.name,supported_color_modes:['onoff']}}});
  for(const route of ['/control','/lights']){
   await page.goto(route);await expect(page.locator('.nav-ha')).toHaveClass(/connected/);
   const ordered=await page.locator('[data-card^="location-"]').evaluateAll(elements=>elements.map(e=>{let h=e.previousElementSibling;while(h&&!h.hasAttribute('data-light-location'))h=h.previousElementSibling;return{id:e.getAttribute('data-card'),location:h?.getAttribute('data-light-location')};}));
   expect(ordered).toEqual([{id:'location-inside',location:'inside'},{id:'location-outside',location:'outside'}]);
   if(route==='/lights')await expect(page.locator('.lights-column')).toHaveCount(3);
  }
  expect(writes).toBe(0);
 }finally{await page.close();await request.put('/workspace-api/scene',{data:original});for(const lamp of lamps)await request.delete('/dev-api/states/'+lamp.entityId);}
});
