import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';
test('live start overview keeps honest telemetry, navigation and free 3D without issuing commands',async({page})=>{
 await fixture(page);let commands=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))commands++;});
 await page.goto('/');await expect(page.locator('#connection-status')).toContainText('Ansluten');
 await expect(page.locator('.home-overview article')).toHaveCount(10);await expect(page.locator('.home-quick-controls')).toBeHidden();
 await expect(page.locator('[data-overview-card=cost]')).toContainText('Saknar data');
 await page.locator('[data-overview-card=kia] a').click();await expect(page).toHaveURL(/\/cars/);expect(commands).toBe(0);
 await page.goto('/');await page.locator('#open-3d').click();await expect(page.locator('.home-overview')).toBeHidden();await expect(page.locator('.home-quick-controls')).toBeVisible();
 // Camera controls must sit beside the shared sidebar and accept an actual click.
 await page.locator('#sky-button').click();await page.locator('#reset-button').click();expect(commands).toBe(0);
 await page.goto('/');await page.setViewportSize({width:390,height:844});await expect(page.locator('.home-overview')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/start-overview-mobile.png'});
});
