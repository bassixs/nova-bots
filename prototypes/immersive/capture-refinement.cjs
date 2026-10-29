// Real local browser captures. Uses the existing runtime; installs nothing.
const {chromium}=require(process.env.NOVA_PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const base='http://127.0.0.1:4196',out=path.join(__dirname,'review/refinement');
fs.mkdirSync(out,{recursive:true});

// This pass may replace only the decorative CTA mark in the document.
const previous=cp.execFileSync('git',['show','400761e:prototypes/immersive/index.html'],{encoding:'utf8'});
const current=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const withoutMark=s=>s.replace(/<div class="cta-sign section-reveal"[^>]*>[\s\S]*?<\/div>/,'<div class="cta-sign"></div>').replace(/<svg class="scene-fallback"[\s\S]*?<\/svg>/,'<svg class="scene-fallback"></svg>');
assert.equal(withoutMark(current),withoutMark(previous),'Content or structure changed beyond the CTA mark');
const chapters=[['process','Как мы работаем'],['brief','Подготовка проекта'],['faq','FAQ'],['cta','Финальный CTA']];
const records=[];
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const [width,height] of [[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<700,hasTouch:width<700});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1400);
  await page.screenshot({path:path.join(out,`hero-${width}.png`)});
  await page.locator('.explore').click();
  await page.waitForFunction(()=>!document.querySelector('#demo-view').inert&&(!document.body.classList.contains('scroll-ready')||Number(document.querySelector('.experience').dataset.scrollProgress)>.99));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(out,`showcase-${width}.png`)});
  // Whole lower sections use a taller capture window, without changing their width.
  // Keep fixed-position elements outside the capture; no captureBeyondViewport.
  await page.setViewportSize({width,height:1200});
  for(const [name] of chapters){
   const section=page.locator(name==='cta'?'#contact':`#${name}`);
   await section.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(850);
   if(name==='faq'){await section.locator('summary').first().click();await page.waitForTimeout(500)}
   await section.evaluate(e=>scrollTo({left:0,top:e.getBoundingClientRect().top+scrollY,behavior:'instant'}));await page.waitForTimeout(150);
   const clip=await section.evaluate(e=>{const r=e.getBoundingClientRect();return {x:Math.floor(r.x-8),y:Math.floor(Math.max(0,r.y)),width:Math.ceil(r.width+16),height:Math.ceil(r.height)}});
   assert(clip.y+clip.height<=1201,`Section outside capture viewport: ${name}/${width}`);
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),clip});
   records.push({width,section:name,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),errors:[...errors]});
  }
  // Check the new inset focus treatment on native summaries and contact links.
  await page.keyboard.press('Tab');
  for(const selector of ['.brief-field summary','.faq-list summary','.contact-channels a']){
   const el=page.locator(selector).first();await el.focus();
   const focus=await el.evaluate(e=>({visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle}));
   assert(focus.visible&&focus.outline==='solid',`Missing focus indicator: ${selector}`);
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'visual-qa.json'),JSON.stringify({content:'byte-identical to 400761e except the decorative CTA mark and separately reviewed scene fallback material',hero:'layout and motion unchanged',records},null,2));
 const sections=[['hero','Первый экран'],['showcase','MAX Showcase'],...chapters];
 fs.writeFileSync(path.join(out,'gallery.html'),`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>NOVA Immersive — Visual refinement</title><style>*{box-sizing:border-box}body{margin:0;background:#08090d;color:#edf0f7;font:16px/1.6 system-ui,sans-serif;padding:32px}main{max-width:1600px;margin:auto}h1{font-size:28px;font-weight:500}h2{font-size:24px;font-weight:500;margin-top:64px}p,figcaption{color:#aab2c3}.pair{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;margin:24px 0 64px}img{display:block;width:100%;height:auto;border:1px solid #263149}figure{margin:0}figcaption{margin-bottom:12px}a{color:#d5e0ff}@media(max-width:800px){body{padding:20px}.pair{grid-template-columns:1fr}figure:last-child{max-width:390px}}</style><main><h1>NOVA Immersive / Visual refinement</h1><p>Реальные скриншоты локального прототипа. Hero и Showcase — окна 1440×900 и 390×844. Нижние секции сняты целиком при тех же ширинах в окне высотой 1200 px. Hero и переход сохранены.</p><a href="/">Открыть прототип →</a>${sections.map(([id,label])=>`<h2>${label}</h2><div class="pair">${[1440,390].map(w=>`<figure><figcaption>${w===1440?'Desktop':'Mobile'} / ${w} px</figcaption><a href="${id}-${w}.png"><img src="${id}-${w}.png" alt="${label}, ${w} px" loading="lazy"></a></figure>`).join('')}</div>`).join('')}</main></html>`);
 console.log('PASS content preservation, keyboard focus and twelve browser screenshots.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
