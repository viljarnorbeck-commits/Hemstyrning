import {test,expect}from'@playwright/test';
import {fixture,planeGlb}from'./fixtures';

test('editor discovers, places and persists dock, vacuum and occluder without changing other objects',async({page,request})=>{
 await fixture(page);const original=await request.get('/workspace-api/scene').then(r=>r.json());
 try{
  await page.goto('/editor');await expect(page.locator('#panel-body h2')).toHaveText('Redigera gården');await expect(page.locator('.editor-object-list')).toBeVisible();
  await page.locator('[data-path="activeModel"]').selectOption('autumn');await page.locator('#model-file').setInputFiles({name:'editor-fixture.glb',mimeType:'model/gltf-binary',buffer:planeGlb()});await expect(page.locator('#model-status')).toContainText('editor-fixture');
  await page.locator('[data-path="model.rotation.1"]').fill('25');await page.locator('[data-path="model.rotation.1"]').dispatchEvent('change');await page.locator('[data-action="center-model"]').click();
  for(const kind of ['light','dock','vacuum','device','occluder']){
   await page.locator(`[data-place="${kind}"]`).click();await page.mouse.click(640,520);await expect(page.locator('[data-path="object.name"]')).toBeVisible();await page.locator('[data-path="object.name"]').fill('Regression '+kind);await page.locator('[data-path="object.name"]').dispatchEvent('change');await page.locator('[data-action="editor-overview"]').click();
  }
  await expect(page.locator('#save-status')).toHaveText('Sparat på disk');let stored=await request.get('/workspace-api/scene').then(r=>r.json());
  for(const kind of ['light','dock','vacuum','device','occluder'])expect(stored.objects.find((o:any)=>o.name==='Regression '+kind)).toBeTruthy();
  const lamp=stored.objects.find((o:any)=>o.name==='Regression light');expect(lamp.position[1]).toBeCloseTo(2.5,0);
  await page.locator(`.editor-object-list [data-object="${lamp.id}"]`).click();await page.locator('[data-path="object.rotation.0"]').fill('35');await page.locator('[data-path="object.rotation.0"]').dispatchEvent('change');await page.locator('[data-path="object.intensity"]').fill('2500');await page.locator('[data-path="object.intensity"]').dispatchEvent('change');await expect(page.locator('#save-status')).toHaveText('Sparat på disk');
  await page.reload();await expect(page.locator('#model-status')).toContainText('editor-fixture');stored=await request.get('/workspace-api/scene').then(r=>r.json());expect(stored.objects.find((o:any)=>o.id===lamp.id).intensity).toBe(2500);
  const device=stored.objects.find((o:any)=>o.name==='Regression device');await page.locator(`.editor-object-list [data-object="${device.id}"]`).click();await page.locator('[data-action="delete-object"]').click();await expect(page.locator('#save-status')).toHaveText('Sparat på disk');expect((await request.get('/workspace-api/scene').then(r=>r.json())).objects.some((o:any)=>o.id===device.id)).toBe(false);
 }finally{await request.put('/workspace-api/scene',{data:original});}
});

test('configured occluder hides a marker, camera movement reveals it, and the list stays usable',async({page})=>{
 await fixture(page);
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),config=await response.json(),base=config.objects[0];config.quality='low';config.objects.push({...base,id:'visibility-target',type:'device',name:'Skymd enhet',entityId:'',position:[0,3,-5],scale:[1,1,1]},{...base,id:'visibility-wall',type:'occluder',name:'Skymmande vägg',entityId:'',position:[0,0,0],scale:[100,12,1]});await route.fulfill({json:config});});
 await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten',{timeout:20000});await expect(page.locator('#model-status')).toBeHidden({timeout:30000});const marker=page.locator('#device-markers [data-object="visibility-target"]');await expect(marker).toBeHidden();
 await page.getByRole('button',{name:/Lista/}).click();await page.locator('#panel-body [data-object="visibility-target"]').click();await expect(page.locator('#panel-body h2')).toHaveText('Skymd enhet');await page.locator('#close-panel').click();
 await page.mouse.move(950,620);await page.mouse.down();await page.mouse.move(470,620,{steps:35});await page.mouse.up();await expect(marker).toBeVisible({timeout:15000});
});

test('quick calendar merges HA entities and remains usable on mobile',async({page,request})=>{
 await fixture(page);const settings=await request.get('/dev-api/settings').then(r=>r.json());
 try{await request.put('/dev-api/settings',{data:{...settings.settings,date:'2026-10-27T10:00:00.000Z',timeScale:0,cloud:10}});await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten');await page.locator('#quick-toggle').click();await page.locator('[data-section="calendar"] summary').click();await expect(page.locator('.quick-agenda')).toContainText('Planeringsmöte');await expect(page.locator('.quick-agenda')).toContainText('Middag tillsammans');await page.locator('[data-calendar="open"]').click();await expect(page.locator('.calendar-panel')).toContainText('Familjen');await expect(page.locator('.calendar-panel')).toContainText('Arbete');await page.locator('[data-close-calendar]').click();await page.setViewportSize({width:390,height:844});await expect(page.getByRole('link',{name:/Redigera gård/})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/hemkontroll-mobile-final.png'});await page.getByRole('link',{name:/Redigera gård/}).click();await expect(page.locator('#panel-body h2')).toHaveText('Redigera gården');await page.goBack();await expect(page.locator('#connection-status')).toHaveText('Ansluten',{timeout:20000});
 }finally{await request.put('/dev-api/settings',{data:settings.settings});}
});
