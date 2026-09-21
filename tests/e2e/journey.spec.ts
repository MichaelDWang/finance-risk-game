import { test,expect,type Page } from '@playwright/test';
import { scenarios } from '../fixtures';
import { mkdir } from 'node:fs/promises';
for(const [instant,year] of [['2030-12-31T15:59:59Z','2030'],['2030-12-31T16:00:00Z','2031']])test(`uses Hong Kong activity year at ${instant}`,async({page})=>{
  const timestamp=Date.parse(instant);
  await page.addInitScript(({timestamp})=>{
    const NativeDate=Date;
    class HongKongTestDate extends NativeDate {
      constructor(...args:any[]){super(args.length===0?timestamp:args[0]);}
      static now(){return timestamp;}
    }
    Object.defineProperty(globalThis,'Date',{value:HongKongTestDate,configurable:true});
  },{timestamp});
  await page.goto('./');
  await expect(page.locator('.start-copy .eyebrow')).toContainText(`INFORMATION DAY / ${year}`);
});
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}
async function slider(page:Page,n:number){const range=page.locator('#game-range');await range.focus();await range.press('Home');for(let i=0;i<n;i++)await range.press('ArrowRight');expect(await range.inputValue()).toBe(String(n));}
async function next(page:Page){await page.locator('#next').click();await noOverflow(page);}
for(const mode of scenarios)test(`complete all twelve games: ${mode}`,async({page},info)=>{
  const low=mode==='low',high=mode==='high',errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./');await page.evaluate(()=>document.fonts.ready);await noOverflow(page);await mkdir('output/screenshots',{recursive:true});
  expect(await page.evaluate(()=>document.fonts.check('16px LabTC','香港珠海學院'))).toBe(true);
  for(const asset of ['assets/compass.svg','assets/fonts/FinanceLabTC.ttf','assets/fonts/FinanceLabTC.woff2'])expect((await page.request.get(asset)).status()).toBe(200);
  if(mode==='middle')await page.screenshot({path:`output/screenshots/${info.project.name}-home.png`,fullPage:true});
  await page.locator('#start').click();await page.locator('#begin').click();
  for(let i=0;i<3;i++){await page.locator(low?'#sure':high?'#chance':i===1?'#sure':'#chance').click();await expect(page.locator('#sure')).toBeDisabled();await page.locator('#advance').click();}
  await next(page);
  for(let i=0;i<2;i++){
    if(!low){await page.locator('#pump').click();if(await page.locator('#pump').count())await page.locator('#pump').click();}
    if(await page.locator('#collect').count())await page.locator('#collect').click();await page.locator('#advance').click();
  }
  await next(page);await slider(page,low?0:high?100:50);await page.locator('#confirm').click();await next(page);
  for(let i=0;i<3;i++){await page.locator(low?'#b':high?'#a':i===0?'#a':'#b').click();await page.locator('#advance').click();}await next(page);
  await expect(page.locator('#confirm')).toBeDisabled();if(high){for(let i=0;i<12;i++)await page.locator('#plus0').click();}else if(low)await page.locator('#equal').click();else{for(let i=0;i<6;i++)await page.locator('#plus0').click();for(let i=0;i<3;i++){await page.locator('#plus1').click();await page.locator('#plus2').click();}}
  await page.locator('#confirm').click();await next(page);await page.locator('#level'+(low?0:high?4:2)).click();
  if(mode==='middle')await page.screenshot({path:`output/screenshots/${info.project.name}-game-06.png`,fullPage:true});
  await page.locator('#confirm').click();await next(page);
  for(let i=0;i<3;i++){await page.locator(low?'#b':high?'#a':i===2?'#a':'#b').click();await page.locator('#advance').click();}await next(page);
  for(let i=0;i<3;i++){await expect(page.locator('#reveal')).toBeDisabled();await page.locator(i===1?'#no':'#yes').click();await page.locator(`input[name=confidence][value="${[75,100,50][i]}"]`).check();await page.locator('#reveal').click();await page.locator('#advance').click();}await next(page);
  await page.locator('#level'+(low?0:high?4:2)).click();await page.locator('#confirm').click();await page.locator('#done').click();await next(page);
  if(!high){await page.locator('#clue0').click();if(low)await page.locator('#clue1').click();await page.locator('#clue2').click();}
  await page.locator(low?'#decline':high?'#join':'#wait').click();await next(page);
  for(let i=0;i<2;i++){await page.locator(high&&i===1?'#chance':'#sure').click();await page.locator('#advance').click();}await next(page);
  await slider(page,low?60:high?0:20);await page.locator('#confirm').click();await next(page);
  await expect(page.locator('.main-score>strong')).toContainText(low?'0':high?'100':'54.2');await expect(page.locator('.observations .observation')).toHaveCount(6);await expect(page.locator('.findings article')).toHaveCount(12);await expect(page.locator('.figure-card')).toHaveCount(2);
  await expect(page.locator('.report-heading')).toContainText('香港珠海學院');
  const state=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('finance-lab-session-v1')!).session);expect(Object.values(state.answers).filter(Boolean)).toHaveLength(12);
  await page.locator('[data-lang=en]').click();await expect(page.locator('h1>[lang=zh-Hant-HK]')).toBeHidden();await expect(page.locator('h1>[lang=en-GB]')).toBeVisible();await noOverflow(page);
  await page.locator('[data-lang=zh]').click();await expect(page.locator('h1>[lang=en-GB]')).toBeHidden();await noOverflow(page);await page.locator('[data-lang=bi]').click();
  await expect(page.locator('#qr svg')).toBeVisible();await noOverflow(page);
  if(mode==='middle')await page.screenshot({path:`output/screenshots/${info.project.name}-results.png`,fullPage:true});
  const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;expect(download.suggestedFilename()).toContain(state.reportId);expect(download.suggestedFilename()).toMatch(/\.pdf$/);expect(await download.failure()).toBeNull();
  await page.locator('#email-open').click();await expect(page.locator('#email-area')).toContainText('電郵服務暫未啟用');
  await page.locator('#next-participant').click();await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>sessionStorage.getItem('finance-lab-session-v1'))).toBeNull();await page.reload();await expect(page.locator('#start')).toBeVisible();expect(errors).toEqual([]);
});
test('missing core games, recovery and deliberate completion',async({page})=>{
  await page.goto('./');await page.locator('#start').click();await page.locator('#begin').click();await page.locator('#skip').click();await page.locator('#report-nav').click();await expect(page.locator('.result-overview')).toContainText('探索尚未完成');await expect(page.locator('.figure-card')).toHaveCount(0);await page.reload();await expect(page.locator('#missing1')).toBeVisible();await page.locator('#missing1').click();await expect(page.locator('#sure')).toBeVisible();await noOverflow(page);
});
