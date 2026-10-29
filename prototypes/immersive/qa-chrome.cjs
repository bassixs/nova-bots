// Material-specific review. Does not write into the earlier approved galleries.
const {chromium}=require(process.env.NOVA_PLAYWRIGHT_PATH||(require('node:fs').existsSync('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')?'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright':'playwright'));
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const base='http://127.0.0.1:4196',out=path.join(__dirname,'review/chrome');fs.mkdirSync(out,{recursive:true});
const oldScene=cp.execFileSync('git',['show','0d4d2d7:prototypes/immersive/scene.js'],{encoding:'utf8'}),scene=fs.readFileSync(path.join(__dirname,'scene.js'),'utf8');
const oldHTML=cp.execFileSync('git',['show','0d4d2d7:prototypes/immersive/index.html'],{encoding:'utf8'}),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const withoutSVG=s=>s.replace(/<svg class="scene-fallback"[\s\S]*?<\/svg>/,'<svg class="scene-fallback"></svg>');
assert.equal(withoutSVG(html),withoutSVG(oldHTML),'Page changed beyond the emergency SVG material');
cp.execFileSync('git',['diff','--exit-code','0d4d2d7','--',...['immersive.css','scroll.css','scroll.js','full-page.css','full-page.js','sections.mjs'].map(f=>'prototypes/immersive/'+f)]);
cp.execFileSync('git',['diff','--exit-code','main','--','src','scripts','dist','public','site.config.mjs','package.json']);
const geometry=s=>s.slice(s.indexOf(' const control='),s.indexOf(' const buffer='));
assert.equal(geometry(scene),geometry(oldScene),'Mesh positions, normals or indices changed');
const transform=s=>s.slice(s.indexOf(' mat3 rx('),s.indexOf(' const fragment='));
assert.equal(transform(scene),transform(oldScene),'Vertex transforms changed');
assert.equal(scene.match(/ function composite\(\)[^\n]+/)[0],oldScene.match(/ function composite\(\)[^\n]+/)[0]);
const expectedPosterHash=crypto.createHash('sha256').update((scene.split('// Same interaction without GPU.')[0]+fs.readFileSync(path.join(__dirname,'chrome-studio.js'),'utf8')).replace(/\r\n/g,'\n').replace(/^\uFEFF/,'')).digest('hex');
assert(fs.readFileSync(path.join(__dirname,'materials/posters.mjs'),'utf8').includes(expectedPosterHash),'Static posters are stale; rebake the current material');
const mesh=vm.runInNewContext(`(()=>{${geometry(scene)};return {data,indices,length,breadth}})()`);
assert.equal(mesh.data.length/8,6501);assert.equal(mesh.indices.length/3,12544);
let normalError=0,minArea=Infinity,reversed=0;
for(let i=0;i<mesh.data.length;i+=8){assert(mesh.data.slice(i,i+8).every(Number.isFinite));normalError=Math.max(normalError,Math.abs(Math.hypot(...mesh.data.slice(i+3,i+6))-1))}
for(let i=0;i<mesh.indices.length;i+=3){
 const vertices=mesh.indices.slice(i,i+3).map(index=>{assert(index>=0&&index<6501);return mesh.data.slice(index*8,index*8+6)}),[a,b,c]=vertices;
 const u=b.slice(0,3).map((v,j)=>v-a[j]),v=c.slice(0,3).map((x,j)=>x-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 minArea=Math.min(minArea,Math.hypot(...n)/2);if(n.reduce((s,x,j)=>s+x*(a[j+3]+b[j+3]+c[j+3]),0)<0)reversed++;
}
assert(normalError<1e-10);assert(minArea>1e-8);assert.equal(reversed,0);
const report={integrity:'Geometry, transforms, scroll, layout, content, showcase, lower page and production preserved',mesh:{vertices:6501,triangles:12544,normalError,minTriangleArea:minArea,reversedTriangles:reversed},performance:[],fallbacks:[]};
if(process.argv.includes('--integrity-only')){console.log('PASS material/mesh/transform contracts, valid posters, untouched page and production source.');process.exit(0)}
let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function open({width=1440,height=900,old=false,reduced=false,blocked=[],query=''}={}){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<701,hasTouch:width<701,reducedMotion:reduced?'reduce':'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 if(old)await page.route('**/scene.js',r=>r.fulfill({body:oldScene,contentType:'application/javascript'}));
 await page.addInitScript(blocked=>{
  window.materialPerf={cls:0,longTasks:[],frames:[]};
  for(const [type,callback] of [['layout-shift',e=>{if(!e.hadRecentInput)window.materialPerf.cls+=e.value}],['longtask',e=>window.materialPerf.longTasks.push(e.duration)]])try{new PerformanceObserver(l=>l.getEntries().forEach(callback)).observe({type,buffered:true})}catch{}
  if(blocked.length){const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return blocked.includes(type)?null:original.call(this,type,...args)}}
 },blocked);
 await page.goto(base+'/'+query,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1600);
 return {page,errors};
}
async function stats(page){return page.evaluate(()=>{
 const canvas=document.querySelector('canvas'),gl=document.querySelector('.experience').dataset.renderer==='webgl'?canvas.getContext('webgl'):null;
 const debug=gl?.getExtension('WEBGL_debug_renderer_info');
 return {renderer:document.querySelector('.experience').dataset.renderer,width:canvas.width,height:canvas.height,draws:Number(canvas.dataset.draws||0),lastCommandOrPosterMs:Number(canvas.dataset.lastRenderMs||0),environmentBakeMs:Number(canvas.dataset.environmentMs||0),gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,glError:gl?.getError()??null,perf:window.materialPerf};
})}
async function nonempty(page){return page.locator('canvas').evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>128)visible++;return visible})}
async function quiet(page){const before=Number(await page.locator('canvas').getAttribute('data-draws'));await page.waitForTimeout(700);assert.equal(Number(await page.locator('canvas').getAttribute('data-draws')),before,'Renderer keeps drawing when idle');return before}
async function silhouette(page){return page.evaluate(()=>{
 const gl=document.querySelector('canvas').getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM);gl.uniform1f(gl.getUniformLocation(program,'uEnergy'),0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,37632,gl.UNSIGNED_SHORT,0);
 const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 let mask='';for(let i=3;i<pixels.length;i+=4)mask+=pixels[i]>128?'1':'0';return mask;
})}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(require('node:fs').existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:process.platform==='win32'?[]:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 let previousMask;
 for(const old of [true,false])for(const [width,height] of [[1440,900],[390,844]]){
  const {page,errors}=await open({old,width,height});assert.equal(await page.locator('.experience').getAttribute('data-renderer'),width===1440?'webgl':'canvas2d');await quiet(page);
  if(width===1440){
   const mask=await silhouette(page);if(old)previousMask=mask;else{let intersection=0,union=0;for(let i=0;i<mask.length;i++){if(mask[i]==='1'||previousMask[i]==='1')union++;if(mask[i]==='1'&&previousMask[i]==='1')intersection++}report.silhouetteIoU=intersection/union;assert(report.silhouetteIoU>.995,'Silhouette changed')}
   await page.evaluate(()=>{let last;const until=performance.now()+1400;function frame(t){if(last)window.materialPerf.frames.push(t-last);last=t;if(t<until)requestAnimationFrame(frame)}requestAnimationFrame(frame)});
   for(let i=0;i<28;i++){await page.mouse.move(1030+Math.sin(i/6)*180,390+Math.cos(i/6)*100);await wait(18)}await page.waitForTimeout(1000);
  }else assert(await nonempty(page)>10000);
  const data=await stats(page),intervals=data.perf.frames.sort((a,b)=>a-b);report.performance.push({variant:old?'before':'chrome',viewport:`${width}x${height}`,...data,frameMedianMs:intervals[Math.floor(intervals.length/2)]??null,frameP95Ms:intervals[Math.floor(intervals.length*.95)]??null});
  assert(data.perf.cls<.01);assert.equal(data.glError,width===1440?0:null);assert.deepEqual(errors,[]);await page.close();
 }
 const {page:desktop,errors:desktopErrors}=await open();
 await desktop.screenshot({path:path.join(out,'initial-1440.png')});
 await desktop.screenshot({path:path.join(out,'initial-detail.png'),clip:{x:640,y:130,width:800,height:720}});
 await desktop.mouse.move(1180,320);await desktop.waitForTimeout(1400);await quiet(desktop);
 await desktop.screenshot({path:path.join(out,'turned-1440.png')});
 await desktop.screenshot({path:path.join(out,'turned-detail.png'),clip:{x:640,y:130,width:800,height:720}});
 await desktop.evaluate(()=>scrollTo({top:(document.querySelector('.experience').offsetHeight-document.querySelector('.experience-stage').offsetHeight)*.42,behavior:'instant'}));await desktop.waitForTimeout(300);
 assert(Math.abs(Number(await desktop.locator('.experience').getAttribute('data-scroll-progress'))-.42)<.002);
 await desktop.screenshot({path:path.join(out,'scroll-1440.png')});assert.deepEqual(desktopErrors,[]);await desktop.close();

 for(const settings of [{name:'mobile',width:390,height:844},{name:'canvas',blocked:['webgl']},{name:'svg',blocked:['webgl','2d']},{name:'reduced',reduced:true}]){
  const {name,...options}=settings,{page,errors}=await open(options),expected=name==='svg'?'fallback':'canvas2d';assert.equal(await page.locator('.experience').getAttribute('data-renderer'),expected);
  if(name==='svg')assert(await page.locator('.scene-fallback').isVisible());else{assert(await nonempty(page)>10000);await quiet(page)}
  if(name==='reduced'){assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('scroll-ready')),false);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0)}
  await page.screenshot({path:path.join(out,`${name}.png`)});report.fallbacks.push({name,renderer:expected,nonempty:true,...await stats(page)});assert.deepEqual(errors,[]);await page.close();
 }
 const {page:loss,errors:lossErrors}=await open();await loss.evaluate(()=>document.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await loss.waitForFunction(()=>document.querySelector('.experience').dataset.renderer==='canvas2d');await loss.waitForTimeout(300);assert(await nonempty(loss)>10000);await quiet(loss);await loss.screenshot({path:path.join(out,'context-loss.png')});assert.deepEqual(lossErrors,[]);report.contextLoss='Canvas poster actually contains pixels after replacing an already rendered WebGL canvas';await loss.close();
 const missing=await browser.newPage({viewport:{width:390,height:844}});await missing.route('**/materials/*.webp',r=>r.abort());await missing.goto(base+'/');await missing.waitForTimeout(600);assert.equal(await missing.locator('.experience').getAttribute('data-renderer'),'fallback');assert(await missing.locator('.scene-fallback').isVisible());report.posterFailure='SVG remains visible if a poster cannot load';await missing.close();
 const retina=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});await retina.goto(base+'/');await retina.waitForTimeout(1200);assert((await retina.locator('canvas').evaluate(c=>c.width))<=488);assert(await nonempty(retina)>10000);await quiet(retina);report.retinaMobile=await stats(retina);await retina.close();
 await browser.close();
 report.measurementScope='Local headless Chromium, emulated mobile. Draw command submission time is not GPU render time. RAF cadence and startup long tasks are diagnostic, not field Core Web Vitals.';
 fs.writeFileSync(path.join(out,'material-qa.json'),JSON.stringify(report,null,2));
 const images=[['initial-1440','Исходное положение'],['turned-1440','Небольшой поворот'],['scroll-1440','Scroll-переход / 42%'],['initial-detail','Материал крупно'],['turned-detail','Материал при повороте'],['mobile','Mobile / 390×844'],['canvas','WebGL недоступен / Canvas'],['svg','WebGL и Canvas недоступны / SVG'],['reduced','Reduced motion'],['context-loss','Восстановление после потери WebGL']];
 fs.writeFileSync(path.join(out,'gallery.html'),`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>NOVA / Chrome material</title><style>body{margin:0;padding:32px;background:#08090d;color:#edf0f7;font:16px/1.6 system-ui,sans-serif}main{max-width:1440px;margin:auto}h1{font-size:30px;font-weight:500}h2{margin-top:64px;font-size:20px;font-weight:500}a{color:#b9c6ff}img{display:block;max-width:100%;height:auto;border:1px solid #263149}p{max-width:800px;color:#aab2c3}</style><main><h1>NOVA / Холодный полированный хром</h1><p>Реальные скриншоты Chromium. Геометрия, масштаб, размещение, курсор и scroll-переход сохранены. Студийные отражения без bloom и постобработки.</p><a href="/">Открыть прототип →</a>${images.map(([file,label])=>`<h2>${label}</h2><a href="${file}.png"><img loading="lazy" src="${file}.png" alt="${label}"></a>`).join('')}</main></html>`);
 console.log('PASS material integrity, normals/indices, silhouette, rendering, reduced motion, blocked contexts, real context-loss recovery, retina and idle rendering.');
 console.log(JSON.stringify({mesh:report.mesh,silhouetteIoU:report.silhouetteIoU,performance:report.performance.map(x=>({variant:x.variant,viewport:x.viewport,environmentBakeMs:x.environmentBakeMs,lastCommandOrPosterMs:x.lastCommandOrPosterMs,frameP95Ms:x.frameP95Ms,longTasks:x.perf.longTasks})),retinaPosterMs:report.retinaMobile.lastCommandOrPosterMs}));
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
