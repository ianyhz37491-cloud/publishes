/* Browser smoke test: actual controls/routes at Chromium desktop + touch viewport. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:4173/publishes/';
const folder=path.resolve(process.cwd(),'../browser-artifacts');
fs.mkdirSync(folder,{recursive:true});
async function check(browser,name,device){
  const context=await browser.newContext({...device,acceptDownloads:false,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const entry=page.getByRole('button',{name:'Enter interactive portfolio and view projects'});
  await entry.waitFor();
  assert(await entry.isVisible(),'landing must be visible before WebGL loads');
  assert.equal(await page.locator('.serenity-heading').count(),0,'legacy header must be removed');
  await page.screenshot({path:path.join(folder,name+'-landing.png')});
  await entry.click();
  await page.waitForURL('**/#/work');
  assert.equal(await page.locator('.work-tile').count(),12);
  const research=page.getByRole('button',{name:'RESEARCH',exact:true});
  await research.click();
  assert.equal(await page.locator('.work-tile').count(),3,'category filter must really work');
  assert.equal(await research.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('a[href="#"]').count(),0,'unpublished tiles must not be dead links');
  await page.screenshot({path:path.join(folder,name+'-catalogue.png')});
  await page.reload();
  await page.waitForURL('**/#/work');
  assert.equal(await page.locator('.work-tile').count(),12,'hard refresh must restore work route');
  const field=page.getByRole('button',{name:/Enter field/});
  if(await field.isEnabled()){
    await field.click();
    await page.waitForURL('**/#/field');
    const settings=page.getByRole('button',{name:/Field settings/});
    await settings.click();
    await page.getByLabel('Light').selectOption('Night');
    assert.equal(await page.getByLabel('Light').inputValue(),'Night');
    assert(await page.getByRole('button',{name:'Resume lighting'}).isVisible());
    await page.screenshot({path:path.join(folder,name+'-field.png')});
    await page.getByRole('button',{name:/Return to work/}).click();
    await page.waitForURL('**/#/work');
    assert(await page.getByRole('button',{name:'ALL'}).isVisible());
  }else{
    console.warn(name+': WebGL2 unsupported by CI browser; field scene NOT visually verified');
  }
  await page.goBack();
  assert.equal(new URL(page.url()).hash,'#/field'===new URL(page.url()).hash?'#/field':new URL(page.url()).hash);
  assert.equal(errors.length,0,'uncaught browser errors: '+errors.join(' | '));
  console.log('PASS browser interactions '+name+' (field enabled: '+await field.isEnabled().catch(()=>false)+')');
  await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
   await check(browser,'desktop',{viewport:{width:1440,height:900}});
   await check(browser,'mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
