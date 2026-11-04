import{test,expect}from'./test';import{fixture}from'./fixtures';
test('measurement cards lift, open real-source 24h charts, cache history and dismiss outside without navigation or commands',async({page})=>{
 await fixture(page);let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))writes++;});
 await page.route('**/spotify-api/**',r=>r.fulfill({json:{connected:false,configured:false}}));
 const reads:Array<{id:string;start:number;end:number}>=[];
 await page.route('**/connection-api/history?**',r=>{
  const u=new URL(r.request().url()),start=Date.parse(u.searchParams.get('start')!),end=Date.parse(u.searchParams.get('end')!),id=u.searchParams.get('entity_id')!;reads.push({id,start,end});
  return r.fulfill({json:[[{last_updated:new Date(start+1000).toISOString(),state:'500',attributes:{unit_of_measurement:'W'}},{last_updated:new Date(end-1000).toISOString(),state:'2500',attributes:{unit_of_measurement:'W'}}]]});
 });
 await page.goto('/energy');const card=page.locator('#function-content [data-measurement-history="sensor.ferroamp_solar_power"]').first();
 await card.hover();await expect.poll(()=>card.evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');
 await card.click();const dialog=page.locator('.measurement-history-dialog');await expect(dialog).toBeVisible();await expect(dialog.locator('svg polyline')).toHaveCount(1);await expect(dialog.locator('.history-summary strong')).toContainText('2,5');
 await page.setViewportSize({width:390,height:844});await expect(dialog.locator('svg')).toHaveAttribute('viewBox','0 0 540 310');await page.setViewportSize({width:1440,height:1000});await expect(dialog.locator('svg')).toHaveAttribute('viewBox','0 0 980 310');
 const read=reads.find(r=>r.id==='sensor.ferroamp_solar_power')!;expect(read.end-read.start).toBe(86400000);expect(page.url()).toContain('/energy');
 await dialog.locator('h2').click();await expect(dialog).toBeVisible();await page.mouse.click(4,4);await expect(dialog).not.toBeVisible();await expect(card).toBeFocused();
 const before=reads.length;await card.press('Enter');await expect(dialog).toBeVisible();await expect(dialog.locator('svg')).toBeVisible();expect(reads.length).toBe(before);await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();expect(writes).toBe(0);
});
test('home temperature rows and tank levels share a responsive centered modal with honest empty/error states',async({page})=>{
 await fixture(page);await page.route('**/spotify-api/**',r=>r.fulfill({json:{connected:false,configured:false}}));
 await page.route('**/connection-api/history?**',r=>r.fulfill({json:[[]]}));
 await page.goto('/');await expect(page.locator('[data-overview-card=solar] [data-yard-photo=janne]')).toBeVisible();await expect(page.locator('[data-overview-card=solar] [data-measurement-history]')).toHaveCount(0);const dialog=page.locator('.measurement-history-dialog');
 await page.goto('/climate');const temperature=page.locator('.tank [data-measurement-history]').first();await temperature.click();await expect(dialog).toBeVisible();await expect(dialog).toContainText('Varmvatten · Övre');await expect(dialog).toContainText('Ingen historik');
 for(const[width,height]of [[1440,1000],[900,1100],[390,844]]){await page.setViewportSize({width,height});const box=await dialog.boundingBox();expect(Math.abs(box!.x+box!.width/2-width/2)).toBeLessThan(2);expect(box!.width).toBeLessThan(width);expect(box!.height).toBeLessThan(height);await page.screenshot({path:'.build-tools/qa-history-'+width+'.png',animations:'disabled'});}
 await page.mouse.click(3,3);await expect(dialog).not.toBeVisible();
 await page.route('**/connection-api/history?**',r=>r.fulfill({status:503,json:{message:'offline'}}));await page.reload();await page.locator('#function-content [data-measurement-history="sensor.storabadrummet_temperatur"]').first().click();await expect(dialog).toContainText('Historiken kunde inte hämtas');await expect(dialog.locator('polyline')).toHaveCount(0);await page.keyboard.press('Escape');await page.goto('/energy?profile=tv');await page.locator('#function-content [data-measurement-history="sensor.ferroamp_solar_power"]').first().press('Enter');await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();expect(page.url()).toContain('/energy');
});
