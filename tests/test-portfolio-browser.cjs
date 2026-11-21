/* Browser smoke test: actual controls/routes at Chromium desktop + touch viewport. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(path.resolve(process.cwd(),'node_modules/playwright'));
const base='http://127.0.0.1:4173/publishes/?quality=low'; // Tests real WebGL at explicit reduced quality; full-density GPU still needs device QA.
const folder=path.resolve(process.cwd(),'../browser-artifacts');
fs.mkdirSync(folder,{recursive:true});
async function check(browser,name,device){
  const context=await browser.newContext({...device,acceptDownloads:false,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(18000);
  const errors=[];
  const network=[];
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  page.on('response',r=>{if(r.status()>=400)network.push(r.status()+': '+r.url());});
  const response=await page.goto(base,{waitUntil:'domcontentloaded'});
  console.log(name+' initial URL='+page.url()+' http='+response?.status());
  const entry=page.getByRole('button',{name:'Enter interactive portfolio and view projects'});
  try{await entry.waitFor({timeout:15000});}
  catch(error){
    console.error('DIAGNOSTIC route='+page.url(), 'title='+await page.title(),
      'body='+JSON.stringify((await page.locator('body').innerText()).slice(0,1500)),
      'rootHTML='+JSON.stringify((await page.locator('#root').innerHTML()).slice(0,1300)),
      'page errors='+JSON.stringify(errors.slice(0,6)),
      'network='+JSON.stringify(network.slice(0,10)));
    await page.screenshot({path:path.join(folder,name+'-failed.png'),timeout:15000});
    throw error;
  }
  assert(await entry.isVisible(),'landing must be visible before WebGL loads');
  assert.equal(await page.locator('.serenity-heading').count(),0,'legacy header must be removed');
  const sound=page.getByRole('button',{name:'Hear the landscape'});
  assert(await sound.isVisible(),'sound control must appear on the landing');
  await sound.click();
  await page.getByRole('button',{name:'Mute the landscape'}).waitFor({timeout:20000});
  await page.getByRole('button',{name:'Mute the landscape'}).click();
  await sound.waitFor();
  const audioOptions=page.getByRole('button',{name:'Sound settings'});
  await audioOptions.click();
  const muffle=page.getByRole('checkbox',{name:'Muffle sound while browsing work'});
  assert(await muffle.isChecked(),'work-mode filtering is enabled by default');
  await muffle.uncheck();
  assert.equal(await muffle.isChecked(),false);
  await muffle.check();
  await page.getByRole('button',{name:'Close sound settings'}).click();
  await page.screenshot({path:path.join(folder,name+'-landing.png')});
  await entry.click();
  await page.waitForURL(/#\/work$/);
  assert.equal(await page.locator('.work-tile').count(),12);
  assert.equal(await page.locator('.work-tile-published').count(),1,'exactly one published slot should be visible');
  assert.equal(await page.locator('.work-tile-marker').count(),11,'all other slots retain visible question marks');
  assert(await page.locator('.work-tile-marker').first().innerText() === '?','unpublished placeholder must be a question mark');
  const preview=page.getByRole('button',{name:'Preview project SYS-001'});
  const image=preview.locator('img');
  await image.waitFor();
  assert(await image.evaluate(node=>node instanceof HTMLImageElement && node.complete && node.naturalWidth>100),
    'photo preview must load a real licensed photograph');
  const hotspot=await preview.boundingBox();
  assert(hotspot && hotspot.width>0,'project preview must be reachable');
  if(device.hasTouch){
    await page.touchscreen.tap(hotspot.x+hotspot.width/2,hotspot.y+hotspot.height/2);
  }else{
    // Playwright hover() retries while overlay steals the mouse target.
    await page.mouse.move(hotspot.x+hotspot.width/2,hotspot.y+hotspot.height/2);
  }
  const popup=page.getByRole('dialog',{name:'Preview SYS-001'});
  await popup.waitFor();
  assert(await popup.isVisible(),'featured work must enlarge into a centred modal');
  assert.equal(await popup.getAttribute('aria-modal'),'true','popup must act as an accessible modal');
  assert(await popup.getByRole('button',{name:'Close project preview'}).evaluate(node=>node===document.activeElement),
    'focus must move into the displayed preview');
  assert.equal(await popup.locator('img').count(),2,'two image-depth planes must render');
  assert.equal(await popup.locator('a[href^="https://"]').count(),1,'spotlight must link to a real deployment');
  assert.equal(await popup.locator('a').getAttribute('href'),'https://margin-language-reader.onrender.com/');
  assert(!(await popup.innerText()).toLowerCase().includes('margin'),'working title must remain hidden until naming is finalized');
  await page.screenshot({path:path.join(folder,name+'-spotlight.png')});
  await page.keyboard.press('Escape');
  await popup.waitFor({state:'detached'});
  const research=page.getByRole('button',{name:'RESEARCH',exact:true});
  assert(await page.getByRole('button',{name:'Hear the landscape'}).isVisible(),'sound stays visible in catalogue');
  const markerBefore=await page.locator('.filter-indicator').getAttribute('style');
  await research.click();
  await page.waitForFunction(()=>document.querySelectorAll('.work-tile').length===3,null,{timeout:10000});
  assert.equal(await page.locator('.work-tile').count(),3,'category filter must really work');
  assert.equal(await research.getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(500);
  const markerAfter=await page.locator('.filter-indicator').getAttribute('style');
  assert.notEqual(markerAfter,markerBefore,'category underline must move between buttons');
  await page.getByRole('button',{name:'ALL',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.work-tile').length===12,null,{timeout:10000});
  await research.click();
  await page.waitForFunction(()=>document.querySelectorAll('.work-tile').length===3,null,{timeout:10000});
  assert.equal(await page.locator('a[href="#"]').count(),0,'unpublished tiles must not be dead links');
  await page.screenshot({path:path.join(folder,name+'-catalogue.png')});
  await page.reload();
  await page.waitForURL(/#\/work$/);
  assert.equal(await page.locator('.work-tile').count(),12,'hard refresh must restore work route');
  const field=page.getByRole('button',{name:/Enter field/});
  const fieldWasAvailable=await field.isEnabled();
  if(fieldWasAvailable){
    await field.click();
    await page.waitForURL(/#\/field$/);
    const settings=page.getByRole('button',{name:/Field settings/});
    await settings.click();
    await page.getByLabel('Light').selectOption('Daylight');
    await page.screenshot({path:path.join(folder,name+'-daylight.png')});
    await page.getByLabel('Weather').selectOption('rain');
    assert.equal(await page.getByLabel('Weather').inputValue(),'rain');
    await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(folder,name+'-rain.png')});
    await page.getByLabel('Weather').selectOption('clear');
    await page.getByLabel('Light').selectOption('Night');
    assert.equal(await page.getByLabel('Light').inputValue(),'Night');
    await page.getByText('night · manual',{exact:true}).waitFor({timeout:10000});
    await page.waitForTimeout(650);
    assert(await page.getByText('night · manual',{exact:true}).isVisible(),'manual mode must remain labelled after telemetry refresh');
    assert(await page.getByRole('button',{name:'Resume lighting'}).isVisible());
    await page.screenshot({path:path.join(folder,name+'-field.png')});
    await page.getByRole('button',{name:'Close settings'}).click();
    await page.screenshot({path:path.join(folder,name+'-field-scene.png')});

    // Real photographic asset layers must load and preserve a genuinely masked,
    // interactive object *behind* photographed grass, not atop a flat image.
    await page.getByRole('button',{name:'Photographic study'}).click();
    const photo=page.locator('.photographic-meadow.is-active');
    await photo.waitFor();
    const photoAssets=['.photo-depth-background','.photo-depth-stems','.photo-depth-near'];
    for(const selector of photoAssets){
      const element=photo.locator(selector);
      await element.waitFor({state:'visible'});
      await page.waitForFunction(
        selector=>{
          const image=document.querySelector(selector);
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth>=1000;
        },selector,{timeout:15000}
      );
    }
    assert(await photo.locator('.photo-depth-orb').isVisible(),'orb must render behind alpha-stem plane');
    const hideObject=photo.getByRole('button',{name:'Hide object'});
    await hideObject.click();
    assert.equal(await photo.locator('.photo-depth-orb').count(),0,'hide object control must actually remove it');
    await photo.getByRole('button',{name:'Show object'}).click();
    assert.equal(await photo.locator('.photo-depth-orb').count(),1,'object must return');
    await page.screenshot({path:path.join(folder,name+'-photographic-depth.png')});
    if(!device.hasTouch){
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForTimeout(180);
      await page.mouse.move(150,220);
      await page.waitForTimeout(500);
      const px=await photo.locator('.photo-depth-stage').evaluate(
        e=>getComputedStyle(e).getPropertyValue('--photo-stem-x').trim()
      );
      assert(px.endsWith('px')&&Math.abs(parseFloat(px))>.1,'photographic grass plane must track pointer parallax');
    }
    await page.screenshot({path:path.join(folder,name+'-photographic-motion.png')});
    if(!device.hasTouch)await page.emulateMedia({reducedMotion:'reduce'});
    assert(await page.getByRole('button',{name:'Hear the landscape'}).isVisible(),
      'existing audio stays accessible in photographic mode');
    await page.getByRole('button',{name:'3D meadow'}).click();
    await photo.waitFor({state:'hidden'});
    assert(await page.getByRole('button',{name:'Field settings'}).isEnabled(),
      '3D lighting controls must work after returning from photographic study');
    await page.getByRole('button',{name:/Return to work/}).click();
    await page.waitForURL(/#\/work$/);
    await page.getByRole('button',{name:'ALL',exact:true}).waitFor({state:'visible',timeout:10000});
  }else{
    console.warn(name+': WebGL2 unsupported by CI browser; field scene NOT visually verified');
  }
  await page.goBack();
  assert(['#/field',''].includes(new URL(page.url()).hash),'back must restore a previous hash route');
  assert.equal(errors.length,0,'uncaught browser errors: '+errors.join(' | '));
  console.log('PASS browser interactions '+name+' (interactive WebGL field tested: '+fieldWasAvailable+')');
  await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
   await check(browser,'desktop',{viewport:{width:1440,height:900}});
   await check(browser,'mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
