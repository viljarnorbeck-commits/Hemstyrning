import {test,expect} from '@playwright/test';
test('shared sensor picker searches, saves, survives reload, drives cards and resets',async({page,request})=>{
 const original=await request.get('/workspace-api/scene').then(r=>r.json());
 try{
  await page.goto('/settings');
  const panel=page.locator('.entity-binding-panel');
  await expect(panel.locator('[data-count]')).toContainText('entiteter med aktuellt state');
  await panel.locator('[data-slot]').selectOption('sensor.ferroamp_grid_power');
  await panel.locator('[data-entity-search]').fill('sensor.ferroamp_solar_power');
  await expect(panel.locator('[data-pick-entity]')).toHaveCount(1);
  await panel.locator('[data-pick-entity]').click();
  await expect(panel.locator('[data-preview]')).toContainText('Senast rapporterad');
  await panel.locator('[data-binding-save]').click();
  await expect(panel.locator('[data-binding-status]')).toHaveText('Sparat på disk');
  expect((await request.get('/workspace-api/scene').then(r=>r.json())).sensorBindings['sensor.ferroamp_grid_power']).toBe('sensor.ferroamp_solar_power');
  await page.reload();await expect(panel.locator('[data-entity-choice]')).toHaveValue('sensor.ferroamp_solar_power');
  await page.goto('/energy');
  await expect(page.locator('#function-source')).toContainText('Ansluten');
  // The solar and remapped grid card have the same confirmed measurement, not an invented alias state.
  const cards=page.locator('.metric-grid').first().locator(':scope > article');
  await expect.poll(async()=>[await cards.nth(1).locator('strong').textContent(),await cards.nth(2).locator('strong').textContent()]).toEqual(expect.arrayContaining([expect.any(String),expect.any(String)]));
  expect(await cards.nth(1).locator('strong').textContent()).toBe(await cards.nth(2).locator('strong').textContent());
  await page.goto('/settings');await panel.locator('[data-binding-reset]').click();
  await expect(panel.locator('[data-binding-status]')).toHaveText('Sparat på disk');
  expect((await request.get('/workspace-api/scene').then(r=>r.json())).sensorBindings['sensor.ferroamp_grid_power']).toBeUndefined();
 }finally{await request.put('/workspace-api/scene',{data:original});}
});
