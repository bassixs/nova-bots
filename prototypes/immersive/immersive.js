import {createScene} from './scene.js';
import {initAnalytics,trackGoal} from './analytics.js';
initAnalytics();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const data=JSON.parse($('#scenario-data').textContent),root=$('.experience'),landing=$('#landing'),demo=$('#demo-view'),carousel=$('#scenarios');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
let paused=motion.matches,active=0,opened=false,sixthTracked=false,transition=0,animations=[],closing;
const scene=createScene($('#nova-field'),renderer=>{root.dataset.renderer=renderer||'fallback';$('.scene').classList.toggle('has-webgl',!!renderer)});
scene.setEnabled(!paused);
function updateMotion(){const off=paused||motion.matches;scene.setEnabled(!off);$('.motion-toggle').setAttribute('aria-pressed',String(off));$('.motion-toggle').setAttribute('aria-label',off?'Включить анимацию':'Остановить анимацию');$('.motion-toggle span').textContent=off?'выкл.':'вкл.';document.body.classList.toggle('motion-paused',off)}
$('.motion-toggle').addEventListener('click',()=>{paused=!paused;updateMotion()});motion.addEventListener('change',()=>{paused=motion.matches;updateMotion()});updateMotion();
root.addEventListener('pointermove',e=>{if(!fine.matches||paused||motion.matches)return;const r=root.getBoundingClientRect();scene.setPointer((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1)},{passive:true});root.addEventListener('pointerleave',()=>scene.setPointer(0,0));
const stage=$('.demo-stage'),canvas=$('.demo-stage-content');let fitFrame;
function fit(){fitFrame=0;if(innerWidth<=700){carousel.style.removeProperty('--demo-scale');return}carousel.style.setProperty('--demo-scale',Math.min(1,stage.clientHeight/600,stage.clientWidth/640))}
function queueFit(){if(!fitFrame)fitFrame=requestAnimationFrame(fit)}new ResizeObserver(queueFit).observe(stage);addEventListener('resize',queueFit,{passive:true});document.fonts.ready.then(queueFit);
function animate(el,keyframes,opts={}){if(paused||motion.matches||!el)return;const a=el.animate(keyframes,{duration:540,easing:'cubic-bezier(.22,1,.36,1)',...opts});animations.push(a);return a}
function show(index,manual=true){
 const next=(index+data.length)%data.length;if(next===active){updateUI();return}
 clearTimeout(transition);animations.forEach(a=>a.cancel());animations=[];
 const slides=$$('[data-slide]'),old=slides[active],target=slides[next];slides.forEach(s=>s.classList.remove('is-leaving'));
 old.classList.remove('is-active');old.classList.add('is-leaving');old.inert=true;old.setAttribute('aria-hidden','true');
 target.classList.add('is-active');target.inert=false;target.removeAttribute('aria-hidden');
 for(const [selector,delay]of [['.chat-panel',0],['.staff-panel',100]]){
  animate(old.querySelector(selector),[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-16px)'}],{duration:320,fill:'both'});
  animate(target.querySelector(selector),[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{delay:80+delay,duration:540,fill:'backwards'});
 }
 active=next;updateUI();transition=setTimeout(()=>old.classList.remove('is-leaving'),paused||motion.matches?0:760);
 if(manual){trackGoal('scenario_change',{scenario_id:active+1});if(active===5&&!sixthTracked){sixthTracked=true;trackGoal('scenario_6_reached')}}
}
function updateUI(){
 $('#scenario-number').textContent=String(active+1).padStart(2,'0');$('#scenario-title').textContent=data[active].title;$('#demo-title').textContent=data[active].title;
 $$('[data-go]').forEach((e,i)=>{e.toggleAttribute('aria-current',i===active);if(i===active)e.setAttribute('aria-current','true');e.classList.toggle('is-passed',i<active)});
 $$('[data-scenario]').forEach((e,i)=>{if(i===active)e.setAttribute('aria-current','true');else e.removeAttribute('aria-current')});
 $('#carousel-announcement').textContent=opened?`${active+1} из 6. ${data[active].title}`:'';
}
function openDemo(index=active,push=true){
 clearTimeout(closing);demo.hidden=false;demo.inert=false;opened=true;landing.inert=true;scene.setMode(1);show(index);queueFit();
 if(push){const url=new URL(location.href);url.hash='scenarios';history.pushState(null,'',url)}
 requestAnimationFrame(()=>{document.body.classList.add('is-demo');queueFit();if(innerWidth<=700)scrollTo({top:0,behavior:'instant'})});
 closing=setTimeout(()=>{landing.hidden=true;$('#prev-slide').focus({preventScroll:true});queueFit()},paused||motion.matches?0:650);
}
function closeDemo(push=true){
 clearTimeout(closing);opened=false;landing.hidden=false;landing.inert=false;demo.inert=true;document.body.classList.remove('is-demo');scene.setMode(0);
 if(push){const url=new URL(location.href);url.hash='top';history.pushState(null,'',url)}
 closing=setTimeout(()=>{demo.hidden=true;$('.explore').focus({preventScroll:true})},paused||motion.matches?0:600);
 if(innerWidth<=700)scrollTo({top:0,behavior:'instant'});
}
$$('a[href="#scenarios"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openDemo(a.dataset.scenario?Number(a.dataset.scenario):active)}));
$('.back-button').addEventListener('click',()=>closeDemo());$('.brand').addEventListener('click',e=>{if(opened){e.preventDefault();closeDemo()}});
$$('[data-go]').forEach(e=>e.addEventListener('click',()=>show(Number(e.dataset.go))));$('#prev-slide').addEventListener('click',()=>show(active-1));$('#next-slide').addEventListener('click',()=>show(active+1));
carousel.addEventListener('keydown',e=>{if(e.altKey||e.metaKey||e.ctrlKey)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();show(e.key==='Home'?0:e.key==='End'?5:active+(e.key==='ArrowRight'?1:-1))}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)closeDemo()});
let touch;$('.slides-window').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});$('.slides-window').addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],x=t.clientX-touch.x,y=t.clientY-touch.y;touch=null;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.4)show(active+(x<0?1:-1))},{passive:true});$('.slides-window').addEventListener('touchcancel',()=>touch=null,{passive:true});
$$('[data-primary-cta]').forEach(e=>e.addEventListener('click',()=>trackGoal('hero_cta_click')));$('.scenario-next-step a').addEventListener('click',()=>trackGoal('scenario_final_cta'));$$('[data-contact]').forEach(e=>e.addEventListener('click',()=>trackGoal(`contact_${e.dataset.contact}`)));
function syncHash(){if(location.hash==='#scenarios'&&!opened)openDemo(active,false);else if(location.hash==='#top'&&opened)closeDemo(false)}addEventListener('popstate',syncHash);addEventListener('hashchange',syncHash);updateUI();syncHash();
document.body.classList.add('ready');
