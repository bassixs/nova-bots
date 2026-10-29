// Record real local browser frames; encode with the browser's own MediaRecorder.
// No desktop capture permissions, external upload, ffmpeg or new dependencies.
const {chromium}=require(process.env.NOVA_PLAYWRIGHT_PATH||(require('node:fs').existsSync('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')?'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright':'playwright'));
const fs=require('node:fs'),path=require('node:path');const out=path.join(__dirname,'review');let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(require('node:fs').existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:process.platform==='win32'?[]:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});await page.goto('http://127.0.0.1:4196/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1400);
 const frames=[];const shot=async()=>{const buffer=await page.screenshot({type:'jpeg',quality:82});frames.push({url:'data:image/jpeg;base64,'+buffer.toString('base64'),t:Date.now(),y:await page.evaluate(()=>scrollY)});};
 await shot();await page.waitForTimeout(450);await shot();await page.mouse.move(1140,650);
 for(let i=0;i<44;i++){await page.mouse.wheel(0,800/44);await page.waitForTimeout(45);await shot()}
 await page.waitForTimeout(300);await shot();await page.locator('#next-slide').click();
 for(let i=0;i<8;i++){await page.waitForTimeout(70);await shot()}
 await page.waitForTimeout(650);await shot();await page.locator('.back-button').click();
 for(let i=0;i<10;i++){await page.waitForTimeout(65);await shot()}
 await page.waitForTimeout(400);await shot();
 const encoder=await browser.newPage();
 const result=await encoder.evaluate(async frames=>{
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;const ctx=canvas.getContext('2d');
  const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('No browser WebM encoder');
  const stream=canvas.captureStream(12),recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:2200000}),chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  const stopped=new Promise(resolve=>recorder.onstop=resolve);
  const images=await Promise.all(frames.map(f=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=f.url})));
  ctx.drawImage(images[0],0,0);recorder.start();
  for(let i=0;i<frames.length;i++){ctx.drawImage(images[i],0,0);await new Promise(r=>setTimeout(r,i+1<frames.length?Math.max(30,frames[i+1].t-frames[i].t):600))}
  recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type});return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob)});
 },frames);
 fs.writeFileSync(path.join(out,'scroll-transition.webm'),Buffer.from(result.split(',')[1],'base64'));
 fs.writeFileSync(path.join(out,'recording.json'),JSON.stringify({method:'Actual Chromium screenshots replayed at capture timestamps; browser MediaRecorder WebM encoding',viewport:[1280,800],frames:frames.length,durationMs:frames.at(-1).t-frames[0].t+600,scrollPositions:frames.map(f=>f.y)},null,2));
 await browser.close();console.log(`Recorded ${frames.length} real frames → review/scroll-transition.webm`);
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
