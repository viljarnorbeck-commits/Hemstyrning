import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';

test('actual scan, atmospheric surroundings and full-screen controls render without errors',async({page})=>{
 const errors:string[]=[];
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),config=await response.json();config.quality='low';await route.fulfill({json:config});});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten',{timeout:20000});await expect(page.locator('#model-status')).toBeHidden({timeout:80000});
 await expect(page.getByRole('link',{name:/Redigera gård/})).toHaveAttribute('href','/editor');await expect(page.locator('.home-status-strip')).toContainText('Elpris');await expect(page.locator('#panel')).toBeHidden();
 expect(await page.locator('#garden').boundingBox()).toMatchObject({width:1440,height:960});
 await page.screenshot({path:'/tmp/hemkontroll-day-final.png',timeout:45000});expect(errors).toEqual([]);
});

test('list and quick menu reach occluded devices, confirm actions, external state and reconnect',async({page,request})=>{
 await fixture(page);const config=await request.get('/workspace-api/scene').then(r=>r.json());
 const light=config.objects.find((o:any)=>o.entityId==='light.altan'),car=config.objects.find((o:any)=>o.entityId==='sensor.car_two_battery'),solar=config.objects.find((o:any)=>o.type==='solar'),mower=config.objects.find((o:any)=>o.type==='mower');
 await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten');await expect(page.locator('#model-status')).toBeHidden();
 async function open(id:string){if(!(await page.locator('#home-dashboard').isVisible()))await page.locator('#list-button').click();await page.locator(`#home-dashboard [data-object="${id}"]`).click();}
 await open(car.id);await expect(page.locator('#panel-body')).toContainText('Laddström');await expect(page.locator('#panel-body')).toContainText('Kupétemperatur');
 try{await request.post('/dev-api/states/'+car.entityId,{data:{state:'83',attributes:{battery_level:83}}});await expect(page.locator('#panel-body')).toContainText('83 %');}finally{await request.delete('/dev-api/states/'+car.entityId);}
 await page.locator('#close-panel').click();await open(solar.id);await expect(page.locator('#panel-body')).toContainText('Växelriktare');await page.locator('#close-panel').click();await open(mower.id);await expect(page.locator('#panel-body')).toContainText('GPS-noggrannhet');await page.locator('#close-panel').click();
 await open(light.id);const old=await request.get('/connection-api/states').then(r=>r.json()).then(a=>a.find((s:any)=>s.entity_id===light.entityId).state);await page.locator('[data-command="light"]').click();await expect(page.locator('#panel-body .bigval')).toHaveText(old==='on'?'Släckt':'Tänt');await page.locator('[data-command="light"]').click();await expect(page.locator('#panel-body .bigval')).toHaveText(old==='on'?'Tänt':'Släckt');
 await request.post('/dev-api/disconnect',{data:{}});await expect(page.locator('#connection-status')).toHaveText('Ansluten',{timeout:15000});await page.locator('#close-panel').click();
 await page.setViewportSize({width:390,height:844});await page.locator('.mobile-home-nav [data-view="home"]').click();await expect(page.locator('#home-dashboard')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('separate simulator controls four season slots without moving scene objects',async({page,request})=>{
 const before=await request.get('/workspace-api/scene').then(r=>r.json()),initial=await request.get('/dev-api/settings').then(r=>r.json());
 try{await page.goto('/dev/simulator');await expect(page.getByRole('heading',{name:'Home Assistant-simulator'})).toBeVisible();await expect(page.locator('[data-scenario]')).toHaveCount(23);await page.locator('[data-scenario="blizzard"]').click();await expect(page.locator('[data-setting="snow"]')).toHaveValue('1');
 for(const season of ['summer','autumn','firstSnow','winter']){await page.locator('[data-setting="season"]').selectOption(season);await page.locator('#apply-settings').click();await expect(page.locator('#dev-message')).toHaveText('Simulatorn uppdaterad');const state=await request.get('/dev-api/states').then(r=>r.json());expect(state.find((s:any)=>s.entity_id==='weather.home').attributes.season_model).toBe(season);}expect((await request.get('/workspace-api/scene').then(r=>r.json())).objects).toEqual(before.objects);
 }finally{await request.put('/dev-api/settings',{data:initial.settings});}
});
