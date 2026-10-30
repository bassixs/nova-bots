import {trackGoal} from './analytics.js';

const root=document.querySelector('.full-page');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed=()=>!reduced.matches&&!document.body.classList.contains('motion-paused');
const reveals=[...root.querySelectorAll('.section-reveal,.faq-chapter')];
const revealObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-revealed');revealObserver.unobserve(e.target)}},{threshold:.08});
reveals.forEach(el=>revealObserver.observe(el));

// Message journey. On large screens with motion it is a pinned scene driven by native
// scroll; elsewhere the four steps and their illustrations read as a plain sequence.
const journey=root.querySelector('[data-journey]');
const steps=[...root.querySelectorAll('[data-process-step]')];
const large=matchMedia('(min-width:1001px) and (min-height:700px)');
let processFrame=0;
function updateProcess(){
 processFrame=0;
 const pinned=large.matches&&motionAllowed();
 journey.classList.toggle('is-on',pinned);
 let progress=1,current=-1;
 if(pinned){
  const rect=journey.getBoundingClientRect(),distance=Math.max(1,rect.height-innerHeight);
  progress=Math.max(0,Math.min(1,-rect.top/distance));
  current=Math.min(3,Math.floor(progress*4*.999+.0001));
 }
 journey.style.setProperty('--journey',progress.toFixed(4));
 journey.dataset.step=String(current);
 steps.forEach((step,i)=>{step.classList.toggle('is-reached',!pinned||i<=current);step.classList.toggle('is-current',pinned?i===current:false)});
}
function queueProcess(){if(!processFrame)processFrame=requestAnimationFrame(updateProcess)}
addEventListener('scroll',queueProcess,{passive:true});
addEventListener('resize',queueProcess,{passive:true});
large.addEventListener('change',queueProcess);

// Phones: the four steps are a swipeable row; the 01–04 switches follow it and steer it.
// Elsewhere the row does not overflow, so the observer below never changes anything.
const track=root.querySelector('.process-track'),processTabs=[...root.querySelectorAll('[data-process-go]')],visibleShare=new Map();
function markStep(index){processTabs.forEach((tab,i)=>{if(i===index)tab.setAttribute('aria-current','true');else tab.removeAttribute('aria-current');tab.classList.toggle('is-passed',i<index)})}
processTabs.forEach((tab,i)=>tab.addEventListener('click',()=>{markStep(i);track.scrollTo({left:steps[i].offsetLeft-parseFloat(getComputedStyle(track).paddingLeft),behavior:motionAllowed()?'smooth':'instant'})}));
const stepObserver=new IntersectionObserver(entries=>{
 for(const e of entries)visibleShare.set(e.target,e.intersectionRatio);
 if(track.scrollWidth<=track.clientWidth)return;
 let best=0;steps.forEach((step,i)=>{if((visibleShare.get(step)||0)>(visibleShare.get(steps[best])||0))best=i});
 markStep(best);
},{root:track,threshold:[.25,.5,.75,1]});
steps.forEach(step=>stepObserver.observe(step));

// Brief builder: picks become a ready-to-send description. Nothing is sent from the page.
const brief=root.querySelector('#brief-builder');
if(brief){
 const groups=[...brief.querySelectorAll('.brief-result>div')],note=brief.querySelector('#brief-note'),count=brief.querySelector('#brief-count'),copy=brief.querySelector('#brief-copy');
 const initialNote=note.textContent;
 const picked=name=>[...brief.querySelectorAll(`input[name="${name}"]:checked`)].map(i=>i.value);
 function render(){
  let filled=0;
  for(const row of groups){const values=picked(row.dataset.group);row.classList.toggle('is-filled',values.length>0);row.querySelector('dd').textContent=values.length?values.join(', '):'—';if(values.length)filled++}
  count.textContent=`${filled} / 4`;note.textContent=initialNote;note.classList.remove('is-done');
 }
 const text=()=>['Здравствуйте! Хотим обсудить чат-бота в MAX.',...groups.map(row=>{const v=picked(row.dataset.group);return v.length?`${row.querySelector('dt').textContent}: ${v.join(', ')}.`:''}).filter(Boolean)].join('\n');
 async function copyText(){
  const value=text();let ok=false;
  try{await navigator.clipboard.writeText(value);ok=true}catch{
   const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.cssText='position:fixed;opacity:0;top:0';document.body.append(area);area.select();
   try{ok=document.execCommand('copy')}catch{}area.remove();
  }
  note.textContent=ok?'Описание скопировано. Вставьте его в сообщение в удобном канале.':'Не удалось скопировать автоматически. Выделите текст выше и скопируйте вручную.';
  note.classList.toggle('is-done',ok);
  if(ok)trackGoal('brief_copy');
  return ok;
 }
 brief.addEventListener('change',render);
 brief.addEventListener('submit',e=>e.preventDefault());
 copy.addEventListener('click',copyText);
 // Opening a channel from the brief copies the description first; the link still opens normally.
 for(const link of brief.querySelectorAll('[data-brief-send]'))link.addEventListener('click',()=>{copyText()});
 render();
}

// Final mark: the same WebGL sculpture, centred, lit up as the reader arrives.
const sign=root.querySelector('.cta-sign'),ctaCanvas=sign?.querySelector('.cta-canvas');
if(sign&&ctaCanvas&&large.matches&&motionAllowed()&&new URL(location.href).searchParams.get('renderer')!=='svg'){
 let scene=null,ctaFrame=0;
 const panel=root.querySelector('.cta-panel');
 const updateCta=()=>{ctaFrame=0;if(!scene)return;const r=panel.getBoundingClientRect();scene.setProgress(Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*.9))))};
 const queueCta=()=>{if(!ctaFrame)ctaFrame=requestAnimationFrame(updateCta)};
 const start=new IntersectionObserver(async entries=>{
  if(!entries[0].isIntersecting||scene)return;start.disconnect();
  const {createScene}=await import('./scene.js');
  scene=createScene(ctaCanvas,renderer=>{if(renderer==='webgl')sign.classList.add('is-live')},{layout:'cta'});
  updateCta();
  addEventListener('scroll',queueCta,{passive:true});
  panel.addEventListener('pointermove',e=>{const r=panel.getBoundingClientRect();scene.setPointer((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1))});
  panel.addEventListener('pointerleave',()=>scene.setPointer(0,0));
 },{rootMargin:'400px 0px'});
 start.observe(sign);
}

// Keep native details/summary semantics and a working no-JS baseline.
const disclosures=[];
for(const details of root.querySelectorAll('.disclosure')){
 const summary=details.querySelector('summary'),content=details.querySelector('.disclosure-content');
 const state={details,animation:null,reveal:null,desired:details.open};disclosures.push(state);
 summary.addEventListener('click',event=>{
  if(!motionAllowed()){
   if(!details.open&&details.dataset.faqId)trackGoal('faq_open',{faq_id:Number(details.dataset.faqId)});
   return;
  }
  event.preventDefault();
  if(!state.animation)state.desired=details.open;
  state.desired=!state.desired;
  const from=details.getBoundingClientRect().height;
  state.animation?.cancel();state.reveal?.cancel();
  details.open=true;
  const style=getComputedStyle(details),borders=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
  const to=state.desired?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+borders;
  if(state.desired&&details.dataset.faqId)trackGoal('faq_open',{faq_id:Number(details.dataset.faqId)});
  // Height changes only on explicit disclosure interactions; never on scroll.
  state.animation=details.animate([{height:`${from}px`},{height:`${to}px`}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
  state.reveal=content.animate(state.desired?[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:1},{opacity:0}],{duration:300,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
  state.animation.onfinish=()=>{details.open=state.desired;state.animation=null;state.reveal=null};
 });
}
function syncMotion(){
 const enabled=motionAllowed();root.classList.toggle('motion-active',enabled);
 if(!enabled){
  reveals.forEach(el=>el.classList.add('is-revealed'));
  for(const state of disclosures){if(!state.animation)continue;state.animation.cancel();state.reveal?.cancel();state.details.open=state.desired;state.animation=state.reveal=null}
 }
 queueProcess();
}
reduced.addEventListener('change',syncMotion);
new MutationObserver(syncMotion).observe(document.body,{attributes:true,attributeFilter:['class']});
syncMotion();
