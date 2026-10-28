import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';
for(const viewport of [{width:1440,height:960},{width:390,height:844}]){
 test(`yard analysis and LUBA history are accessible in the editor ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await fixture(page);
  await page.route('**/workspace-api/yard-analysis',route=>route.fulfill({json:{status:'ready',result:{version:1,key:'test',createdAt:'',originX:0,originZ:0,cellSize:1,width:1,height:1,ground:[0],kind:[1],confidence:[.7],fallbackHeight:1,bounds:{min:[0,0,0],max:[1,0,1]},proposals:[{id:'test-ground',kind:'ground',confidence:.7,status:'proposed',points:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]}],notes:[]}}}));
  await page.goto('/editor');await page.locator('[data-action="administration"]').click();await page.locator('[data-admin="tab:analysis"]').click();await page.locator('[data-admin="yard-refresh"]').click();await expect(page.locator('.advanced-editor')).toContainText('test-ground');await expect(page.locator('[data-admin="yard-approve:test-ground"]')).toBeVisible();
  await page.locator('[data-admin="tab:learning"]').click();await page.locator('[data-admin="learning-refresh"]').click();await expect(page.locator('.advanced-editor')).toContainText('Datakälla: simulator');await expect(page.locator('[data-admin="learning-rebuild"]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
