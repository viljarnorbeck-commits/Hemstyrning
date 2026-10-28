import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';

test('editor searches HA entities, inspects attributes and persists a selected binding',async({page,request})=>{
 test.setTimeout(45000);
 await fixture(page);
 await page.route('**/workspace-api/scene',async route=>{if(route.request().method()!=='GET'){await route.continue();return;}const response=await route.fetch();const data=await response.json();data.quality='low';await route.fulfill({json:data});});
 const original=await request.get('/workspace-api/scene').then(r=>r.json());
 const lamp=original.objects.find((o:any)=>o.type==='light');
 try{
  await page.goto('/editor');
  await expect(page.locator('#connection-status')).toContainText('ansluten',{timeout:20000});
  await page.locator(`.editor-object-list [data-object="${lamp.id}"]`).click();
  await page.getByRole('button',{name:'Koppla Home Assistant',exact:true}).click();
  await page.locator('#entity-search').fill('light.altan');
  await expect(page.locator('#entity-results summary')).toHaveCount(1);
  await page.locator('#entity-results summary').click();
  await expect(page.locator('#entity-results pre')).toContainText('friendly_name');
  await page.locator('[data-entity="light.altan"]').click();
  await expect(page.locator('#entity-search')).toHaveCount(0);
  await expect(page.locator('#save-status')).toHaveText('Sparat på disk');
  expect((await request.get('/workspace-api/scene').then(r=>r.json())).objects.find((o:any)=>o.id===lamp.id).entityId).toBe('light.altan');
 }finally{await request.put('/workspace-api/scene',{data:original});}
});
