import {trackGoal} from './analytics.js';

const root=document.querySelector('.full-page');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed=()=>!reduced.matches&&!document.body.classList.contains('motion-paused');
const reveals=[...root.querySelectorAll('.section-reveal')];
const revealObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-revealed');revealObserver.unobserve(e.target)}},{threshold:.08});
reveals.forEach(el=>revealObserver.observe(el));

// A single measured process rail. No motion work is done while it is off-screen.
const track=root.querySelector('.process-track'),fill=root.querySelector('.process-line>span');
const steps=[...root.querySelectorAll('[data-process-step]')];
let processVisible=false,processFrame=0;
function updateProcess(){
 processFrame=0;if(!processVisible&&motionAllowed())return;
 const rect=track.getBoundingClientRect();
 const progress=motionAllowed()?Math.max(0,Math.min(1,(innerHeight*.7-rect.top)/Math.max(1,rect.height-64))):1;
 const current=Math.min(3,Math.floor(progress*4));
 fill.style.transform=`scaleY(${progress})`;
 steps.forEach((step,i)=>{step.classList.toggle('is-reached',!motionAllowed()||i<=current);step.classList.toggle('is-current',i===current)});
}
function queueProcess(){if(!processFrame)processFrame=requestAnimationFrame(updateProcess)}
new IntersectionObserver(entries=>{processVisible=entries[0].isIntersecting;if(processVisible)queueProcess()},{rootMargin:'100px 0px'}).observe(track);
addEventListener('scroll',()=>{if(processVisible)queueProcess()},{passive:true});
addEventListener('resize',queueProcess,{passive:true});

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
  state.reveal=content.animate(state.desired?[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:1},{opacity:0}],{duration:300,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
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
