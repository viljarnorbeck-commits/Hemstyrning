import{test,expect}from'./test';import{fixture}from'./fixtures';
test.use({timezoneId:'Europe/Stockholm'});
async function quietMusic(page:any){await fixture(page);await page.route('**/spotify-api/**',(r:any)=>r.fulfill({json:{configured:false,connected:false}}));}
test('house net meter preserves export minus while house consumption and House 2 stay separate',async({page,request})=>{
 await quietMusic(page);const ids=['sensor.ferroamp_grid_power','sensor.ferroamp_consumption_power'],states=await request.get('/connection-api/states').then(r=>r.json());
 try{for(const[id,value]of [[ids[0],'-2300'],[ids[1],'3100']])await request.post('/dev-api/states/'+id,{data:{state:value,attributes:{unit_of_measurement:'W'}}});await page.goto('/energy');const flow=page.locator('.energy-flow-diagram');await expect(flow).toContainText('Hus · netto');await expect(flow.locator('>span').nth(2).locator('strong')).toContainText(/[−-]2,3/);await expect(flow).toContainText('Hus 2');const consumption=page.locator('#function-content .metric-grid [data-measurement-history="sensor.ferroamp_consumption_power"]').first();await expect(consumption.locator('strong')).toContainText('3,1');}
 finally{await page.close();for(const id of ids){const old=states.find((s:any)=>s.entity_id===id);if(old)await request.post('/dev-api/states/'+id,{data:{state:old.state,attributes:old.attributes}});}}
});
test('matching clock minutes pulse smoothly without replacing the clock and stop at the next minute',async({page})=>{
 await quietMusic(page);await page.clock.setFixedTime(new Date('2026-11-01T22:21:59+01:00'));await page.goto('/');const clock=page.locator('.time-slap-clock');await expect(clock).not.toHaveClass(/is-time-slap/);
 await page.clock.setFixedTime(new Date('2026-11-01T22:22:05+01:00'));await expect(clock).toHaveClass(/is-time-slap/);await expect(clock).toHaveAttribute('aria-label','Klockan 22:22');
 expect(await clock.locator('.clock-bold').evaluate(e=>getComputedStyle(e).fontWeight)).toBe('800');expect(await clock.locator('.clock-regular').evaluate(e=>getComputedStyle(e).fontWeight)).toBe('500');
 await clock.evaluate(e=>(window as any).__clockNode=e);await page.waitForTimeout(1200);expect(await clock.evaluate(e=>(window as any).__clockNode===e)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await clock.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.clock.setFixedTime(new Date('2026-11-01T22:23:00+01:00'));await expect(clock).not.toHaveClass(/is-time-slap/);
 await page.clock.setFixedTime(new Date('2026-11-02T00:00:00+01:00'));await expect(clock).toHaveClass(/is-time-slap/);await expect(clock).toHaveAttribute('aria-label','Klockan 00:00');
});
test('car light buttons control only the assigned charger lamp and follow a changed charger assignment',async({page,request})=>{
 await quietMusic(page);const original=await request.get('/workspace-api/scene').then(r=>r.json()),oldStates=await request.get('/connection-api/states').then(r=>r.json()),ids=['light.easee_vanster_led_strip','light.easee_hoger_led_strip'];
 const commands:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/services/'))commands.push(r.postDataJSON().entity_id);});
 try{
  const c=structuredClone(original),base=c.objects.find((o:any)=>o.type==='light');c.entityPreferences??={};for(const [i,id]of ids.entries()){if(!c.objects.some((o:any)=>o.entityId===id))c.objects.push({...base,id:'qa-charger-lamp-'+i,name:'Laddboxlampa '+i,entityId:id,type:'light',placementConfirmed:false});c.entityPreferences[id]={control:true,allowCommands:true,hidden:false};await request.post('/dev-api/states/'+id,{data:{state:'off',attributes:{friendly_name:'Laddboxlampa '+i,supported_color_modes:['onoff']}}});}await request.put('/workspace-api/scene',{data:c});
  await page.goto('/cars');const left=page.locator('[data-charger-light=ev6]'),right=page.locator('[data-charger-light=egolf]');await expect(left).toBeEnabled();await expect(right).toHaveAttribute('aria-pressed','false');
  await left.click();await expect(left).toHaveAttribute('aria-pressed','true');await expect(right).toHaveAttribute('aria-pressed','false');await right.click();await expect(right).toHaveAttribute('aria-pressed','true');expect(commands).toEqual(ids);
  await page.locator('#vehicle-ev6 summary').click();await page.locator('[data-vehicle=ev6][data-vehicle-key=charger]').selectOption('easee_hoger');await expect(left).toHaveAttribute('aria-pressed','true');await left.click();await expect(right).toHaveAttribute('aria-pressed','false');expect(commands).toEqual([ids[0],ids[1],ids[1]]);
 }finally{await page.close();await request.put('/workspace-api/scene',{data:original});for(const id of ids){const old=oldStates.find((s:any)=>s.entity_id===id);if(old)await request.post('/dev-api/states/'+id,{data:{state:old.state,attributes:old.attributes}});else await request.delete('/dev-api/states/'+id);}}
});
test('heater car stays neutral on a rejected command and gains colour only after confirmed HA state',async({page,request})=>{
 await quietMusic(page);const original=await request.get('/workspace-api/scene').then(r=>r.json()),entity='switch.qa_motorvarmare_visual';
 try{
  const c=structuredClone(original),base=c.objects.find((o:any)=>o.type==='light');c.objects.push({...base,id:'qa-heater-visual',entityId:entity,type:'device',name:'Motorvärmare test',placementConfirmed:false});
  await request.post('/dev-api/states/'+entity,{data:{state:'off',attributes:{friendly_name:'Motorvärmare test'}}});await request.put('/workspace-api/scene',{data:c});
  await page.route('**/connection-api/catalog',r=>r.fulfill({json:{registryAvailable:true,entities:[{entityId:entity,name:'Motorvärmare test',area:'Ute',platform:'knx',disabled:false}]}}));
  await page.route('**/connection-api/commands',r=>r.fulfill({status:503,json:{message:'Motorvärmaren svarade inte'}}));
  await page.goto('/control');await page.locator('[data-select=qa-heater-visual]').click();const visual=page.locator('.heater-visual'),body=visual.locator('.heater-car-body');await expect(visual.locator('.motor-heater-car')).toBeVisible();const neutral=await body.evaluate(e=>getComputedStyle(e).fill);
  await page.locator('#control-details [role=switch]').click();await expect(page.locator('#control-error')).toContainText('503');await expect(visual).not.toHaveClass(/is-on/);expect(await body.evaluate(e=>getComputedStyle(e).fill)).toBe(neutral);
  await request.post('/dev-api/states/'+entity,{data:{state:'on',attributes:{friendly_name:'Motorvärmare test'}}});await expect(visual).toHaveClass(/is-on/);await expect.poll(()=>body.evaluate(e=>getComputedStyle(e).fill)).not.toBe(neutral);
 }finally{await page.close();await request.put('/workspace-api/scene',{data:original});await request.delete('/dev-api/states/'+entity);}
});
test('buttons lift and depress, dropdowns unfold, and reduced motion preserves usable controls',async({page})=>{
 await quietMusic(page);await page.setViewportSize({width:1440,height:960});await page.goto('/control');const button=page.locator('#control-search-toggle');await button.hover();await expect.poll(()=>button.evaluate(e=>parseFloat(getComputedStyle(e).translate.split(' ')[1]??'0'))).toBeLessThan(0);
 await page.mouse.down();await expect.poll(()=>button.evaluate(e=>Number(getComputedStyle(e).scale))).toBeLessThan(1);await page.mouse.up();const popup=page.locator('#control-search-overlay');await expect(popup).toBeVisible();expect(await popup.evaluate(e=>getComputedStyle(e).animationName)).toBe('hem-menu-unfold');await page.locator('#control-search-close').click();
 await page.goto('/cars');await page.locator('#vehicle-ev6 summary').click();await page.evaluate(async()=>{const {appConnection}=await import('/src/system/app-session.ts');appConnection.dispatchEvent(new Event('state'));});await expect(page.locator('#vehicle-ev6 details')).toHaveAttribute('open','');const select=page.locator('[data-vehicle=ev6][data-vehicle-key=charger]');if(await page.evaluate(()=>CSS.supports('appearance','base-select'))){await select.click();await expect.poll(()=>select.evaluate(e=>e.matches(':open'))).toBe(true);await expect(select).toHaveJSProperty('value','easee_vanster');expect(await select.evaluate(e=>getComputedStyle(e,'::picker(select)').animationName)).toBe('hem-menu-unfold');await page.keyboard.press('Escape');}
 await page.emulateMedia({reducedMotion:'reduce'});const nav=page.locator('.app-sidebar a[href="/cars"]');await nav.hover();expect(await nav.evaluate(e=>getComputedStyle(e).translate)).toBe('none');expect(await nav.evaluate(e=>getComputedStyle(e).scale)).toBe('none');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
