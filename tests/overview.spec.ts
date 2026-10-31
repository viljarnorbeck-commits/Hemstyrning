import{test,expect}from'@playwright/test';import{fixture}from'./fixtures';
test('ten read-only overview groups, responsive perimeter and live 3D',async({page})=>{
 await fixture(page);let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))writes++;});await page.goto('/');await expect(page.locator('.home-overview article')).toHaveCount(10);await expect(page.locator('#connection-status')).toContainText('Ansluten');
 await expect(page.locator('.hero-heading')).toHaveCount(0);await expect(page.locator('.home-quick-controls')).toBeHidden();await expect(page.locator('.home-overview')).toContainText('Inte ansluten');await expect(page.locator('[data-overview-card=cost]')).toContainText('Saknar data');
 for(const[name,width,height]of[['desktop',1920,1200],['tablet',1024,1366],['mobile',390,844],['tv',1920,1080]]as const){await page.setViewportSize({width,height});if(name==='tv')await page.evaluate(()=>document.body.classList.add('tv-mode'));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/overview-${name}.png`,fullPage:true});}
 expect(writes).toBe(0);await page.locator('#open-3d').click();await expect(page.locator('.home-overview')).toBeHidden();await expect(page.locator('#garden')).toBeVisible();
});
