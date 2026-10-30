import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';
test('hero keeps a live stage, honest telemetry and camera-only object selection',async({page})=>{
 await fixture(page);let commands=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))commands++;});
 await page.goto('/');await expect(page.locator('.hero-experience')).toBeVisible();await expect(page.locator('[data-hero-status]')).toContainText('SIMULERAD');
 await expect(page.locator('.hero-metric')).toHaveCount(4);await expect(page.locator('.home-quick-controls')).toBeHidden();
 const car=page.locator('.hero-car').first();await expect(car).toBeEnabled();await car.click();expect(commands).toBe(0);
 await page.locator('#open-3d').click();await expect(page.locator('.hero-experience')).toBeHidden();await expect(page.locator('.home-quick-controls')).toBeVisible();
 await page.locator('#home-button').click();await page.setViewportSize({width:390,height:844});await expect(page.locator('.hero-experience')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const header=await page.locator('header nav').boundingBox(),strip=await page.locator('.home-status-strip').boundingBox();expect(strip!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
 const metrics=await page.locator('.hero-energy').boundingBox();expect(metrics!.x).toBeGreaterThanOrEqual(0);expect(metrics!.x+metrics!.width).toBeLessThanOrEqual(390);
 await page.screenshot({path:'/tmp/hero-tested-mobile.png'});
});
