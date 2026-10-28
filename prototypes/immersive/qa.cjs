// Local browser regression suite. Uses the already available Playwright runtime.
const {chromium}=require(process.env.NOVA_PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const base='http://127.0.0.1:4196',out=path.join(__dirname,'review');fs.mkdirSync(out,{recursive:true});
let browser;
async function metrics(page){return page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height].map(x=>Math.round(x))};const active=document.querySelector('[data-slide].is-active');return {geometry:['.chat-panel','.staff-panel'].map(s=>rect(active.querySelector(s))).concat([rect(document.querySelector('.showcase-footer'))]),chatOverflow:active.querySelector('.chat-body').scrollHeight-active.querySelector('.chat-body').clientHeight,panelOverflow:active.querySelector('.staff-content').scrollHeight-active.querySelector('.staff-content').clientHeight,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),height:document.documentElement.scrollHeight,cta:!!active.querySelector('.scenario-next-step'),activeCount:document.querySelectorAll('[data-slide]:not([inert])').length}})}
async function scrollToDemo(page){await page.locator('.explore').click();await page.waitForFunction(()=>!document.querySelector('#demo-view').inert&&(!document.body.classList.contains('scroll-ready')||Number(document.querySelector('.experience').dataset.scrollProgress)>.99));await page.waitForTimeout(150)}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 for(const [width,height]of [[1440,900],[1366,768],[1280,720],[390,844],[430,932],[320,740],[768,1024]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<701,hasTouch:width<701});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.qaPerf={cls:0,longTasks:[],events:[],lcp:0};for(const [type,callback]of [['layout-shift',e=>{if(!e.hadRecentInput)window.qaPerf.cls+=e.value}],['longtask',e=>window.qaPerf.longTasks.push(e.duration)],['event',e=>{if(e.interactionId)window.qaPerf.events.push(e.duration)}],['largest-contentful-paint',e=>window.qaPerf.lcp=e.startTime]])try{new PerformanceObserver(list=>list.getEntries().forEach(callback)).observe({type,buffered:true,durationThreshold:16})}catch{}});
  await page.goto(base+'/?utm_source=qa&utm_campaign=scroll',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('[data-slide]').count(),6);assert.equal(await page.locator('#demo-view').getAttribute('hidden'),null);
  const renderer=await page.locator('.experience').getAttribute('data-renderer');assert.equal(renderer,width<=1000?'canvas2d':'webgl');
  if(width===1440||width===390)await page.screenshot({path:path.join(out,`hero-${width}x${height}.png`)});
  const docHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
  const samples=[];
  if(width>1000){
   // These are real wheel events; the page must follow both directions freely.
   await page.mouse.move(width*.8,height*.5);await page.mouse.wheel(0,200);await page.waitForTimeout(180);assert(await page.evaluate(()=>scrollY>0));await page.mouse.wheel(0,-200);await page.waitForTimeout(200);assert(await page.evaluate(()=>scrollY<5));
   for(const t of [0,.2,.4,.6,.8,1]){await page.evaluate(t=>scrollTo({top:(document.querySelector('.experience').offsetHeight-document.querySelector('.experience-stage').offsetHeight)*t,behavior:'instant'}),t);await page.waitForTimeout(80);const s=await page.evaluate(()=>({progress:Number(document.querySelector('.experience').dataset.scrollProgress),hero:Number(getComputedStyle(document.querySelector('.landing')).opacity),demo:Number(getComputedStyle(document.querySelector('.scenario-carousel')).opacity),scene:Number(getComputedStyle(document.querySelector('.scene')).opacity),height:document.documentElement.scrollHeight}));assert.equal(s.height,docHeight);assert(s.hero+s.demo>.2);samples.push(s)}
   assert.equal(samples.at(-1).demo,1);assert.equal(samples.at(-1).hero,0);assert(samples.at(-1).scene<.2);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
  }
  await scrollToDemo(page);
  assert.equal(new URL(page.url()).hash,'#scenarios');assert.equal(new URL(page.url()).searchParams.get('utm_source'),'qa');
  if(width>1000){const rect=await page.locator('.showcase-footer').boundingBox();assert(rect.y+rect.height<=height+1);assert((await page.locator('.is-active .chat-panel').boundingBox()).y>=0)}
  if(width===1440||width===390){await page.screenshot({path:path.join(out,`demo-${width}x${height}.png`)});if(width===390)await page.locator('.demo-view').screenshot({path:path.join(out,'demo-mobile-full.png')})}
  let geometry;
  for(let i=0;i<6;i++){
   await page.locator(`[data-go="${i}"]`).click();await page.waitForTimeout(800);assert.equal(await page.locator('#scenario-number').innerText(),String(i+1).padStart(2,'0'));
   const m=await metrics(page);assert.equal(m.chatOverflow,0,`chat clip ${width}/${i+1}`);assert.equal(m.panelOverflow,0,`panel clip ${width}/${i+1}`);assert.equal(m.overflow,0);assert.equal(m.activeCount,1);assert.equal(m.cta,i===5);assert.equal(m.height,docHeight);
   if(geometry)assert.deepEqual(m.geometry,geometry,`layout shift ${width}/${i+1}`);else geometry=m.geometry;
  }
  await page.locator('#prev-slide').click();await page.waitForTimeout(800);assert.equal(await page.locator('#scenario-number').innerText(),'05');await page.locator('#prev-slide').focus();await page.keyboard.press('Home');await page.waitForTimeout(800);assert.equal(await page.locator('#scenario-number').innerText(),'01');
  if(width<701){await page.locator('.slides-window').evaluate(el=>{const t=x=>new Touch({identifier:1,target:el,clientX:x,clientY:300});el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[t(250)]}));el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[t(70)]}));});await page.waitForTimeout(800);assert.equal(await page.locator('#scenario-number').innerText(),'02');}
  await page.locator('[data-go="5"]').click();await page.waitForTimeout(800);await page.locator('.is-active .scenario-next-step a').click();await page.waitForTimeout(600);assert.equal(new URL(page.url()).hash,'#contact');assert.equal(new URL(page.url()).searchParams.get('utm_source'),'qa');
  await page.locator('.return-top').click();await page.waitForFunction(()=>scrollY<2);await page.waitForTimeout(100);assert(await page.locator('.landing').evaluate(e=>!e.inert&&getComputedStyle(e).opacity==='1'));
  await page.waitForTimeout(1400);const draws=await page.locator('canvas').getAttribute('data-draws');await page.waitForTimeout(500);assert.equal(await page.locator('canvas').getAttribute('data-draws'),draws,'renderer never settles');
  const perf=await page.evaluate(()=>window.qaPerf);assert(perf.cls<.05,`CLS ${width}: ${perf.cls}`);assert.deepEqual(errors,[]);results.push({viewport:`${width}x${height}`,renderer,sixScenes:'pass',geometry:'stable',nativeScroll:'pass',keyboard:'pass',swipe:width<701?'pass':'n/a',utm:'preserved',perf,samples});console.log(`PASS ${width}x${height}, ${renderer}, CLS ${perf.cls}`);await page.close();
 }
 const modes=[];
 for(const forced of ['canvas','svg']){const p=await browser.newPage({viewport:{width:1440,height:900}});await p.goto(`${base}/?renderer=${forced}`);await p.waitForTimeout(1000);const renderer=await p.locator('.experience').getAttribute('data-renderer');assert.equal(renderer,forced==='svg'?'fallback':'canvas2d');await scrollToDemo(p);await p.locator('[data-go="5"]').click();await p.waitForTimeout(800);assert.equal(await p.locator('#scenario-number').innerText(),'06');modes.push({forced,renderer,demo:'pass'});await p.close()}
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await reduced.goto(base+'/');await reduced.waitForTimeout(600);assert.equal(await reduced.locator('body').evaluate(e=>e.classList.contains('scroll-ready')),false);assert.equal(await reduced.locator('#demo-view').evaluate(e=>e.inert),false);assert.equal(await reduced.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);await scrollToDemo(reduced);await reduced.locator('[data-go="5"]').click();assert.equal(await reduced.locator('#scenario-number').innerText(),'06');await reduced.close();
 const loss=await browser.newPage({viewport:{width:1440,height:900}});await loss.goto(base+'/');await loss.waitForTimeout(500);assert.equal(await loss.locator('.experience').getAttribute('data-renderer'),'webgl');await loss.evaluate(()=>document.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await loss.waitForFunction(()=>document.querySelector('.experience').dataset.renderer==='canvas2d');await scrollToDemo(loss);assert(await loss.locator('#next-slide').isEnabled());await loss.close();
 const nojs=await browser.newPage({viewport:{width:1440,height:900},javaScriptEnabled:false});await nojs.goto(base+'/');assert(await nojs.locator('#demo-view').isVisible());assert(await nojs.locator('.is-active .chat-panel').isVisible());await nojs.close();
 assert.equal(cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'design/nova-immersive');cp.execFileSync('git',['diff','--exit-code','main','--','src','scripts','dist','public','site.config.mjs','package.json']);
 fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({results,fallbacks:modes,contextLoss:'canvas2d recovery passed',reducedMotion:'sequential passed',noJS:'sequential passed',productionSources:'unchanged'},null,2));await browser.close();console.log('PASS all scenarios, fallback, context loss, reduced motion, no JS and source isolation.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
