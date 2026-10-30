import {createScene} from './scene.js';
import {initAnalytics,trackGoal} from './analytics.js';
initAnalytics();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const data=JSON.parse($('#scenario-data').textContent),root=$('.experience'),viewport=$('.experience-stage'),landing=$('#landing'),demo=$('#demo-view'),demoIntro=$('.demo-intro'),carousel=$('#scenarios');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),desktop=matchMedia('(min-width:1001px) and (min-height:700px)');
let paused=false,active=0,sixthTracked=false,transition=0,animations=[],enhanced=false,progress=0,pendingFocus=false,scrollFrame=0,fitFrame=0;
const scene=createScene($('#nova-field'),renderer=>{root.dataset.renderer=renderer||'fallback';$('.scene').classList.toggle('has-webgl',!!renderer)},{staticOnly:!desktop.matches||motion.matches});
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t)};
const stage=$('.demo-stage');
function fit(){
 fitFrame=0;
 if(innerWidth<=1000){carousel.style.removeProperty('--demo-scale');return}
 carousel.style.setProperty('--demo-scale',Math.min(1,stage.clientHeight/600,stage.clientWidth/640));
}
function queueFit(){if(!fitFrame)fitFrame=requestAnimationFrame(fit)}
new ResizeObserver(queueFit).observe(stage);
function updateScroll(){
 scrollFrame=0;
 if(!enhanced)return;
 const box=root.getBoundingClientRect(),distance=Math.max(1,root.offsetHeight-viewport.offsetHeight);
 progress=clamp(-box.top/distance);
 const enter=smooth(.18,.78,progress),leave=smooth(.04,.55,progress);
 root.style.setProperty('--landing-opacity',1-leave);
 root.style.setProperty('--landing-y',`${-leave*64}px`);
 root.style.setProperty('--demo-opacity',enter);
 root.style.setProperty('--demo-y',`${(1-enter)*80}px`);
 root.style.setProperty('--demo-scale-enter',.96+.04*enter);
 root.style.setProperty('--intro-opacity',smooth(.55,.9,progress));
 root.style.setProperty('--scene-opacity',1-.9*smooth(0,.5,progress));
 root.style.setProperty('--scene-shrink',1-.38*progress);
 root.dataset.scrollProgress=progress.toFixed(3);
 landing.inert=progress>=.5;landing.setAttribute('aria-hidden',String(progress>=.55));
 demo.inert=progress<.5;demo.setAttribute('aria-hidden',String(progress<.18));
 demoIntro.inert=progress<.8;demoIntro.setAttribute('aria-hidden',String(progress<.55));
 scene.setProgress(progress);
 if(pendingFocus&&progress>.94){pendingFocus=false;$('#prev-slide').focus({preventScroll:true})}
}
function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll)}
// Native scroll only: no wheel interception, snapping, scrub timer or scroll lock.
addEventListener('scroll',queueScroll,{passive:true});
function configure(){
 const next=desktop.matches&&!motion.matches&&!paused,changed=enhanced!==next,wasEnhanced=enhanced;
 const anchor=(enhanced?progress>.5:demo.getBoundingClientRect().top<innerHeight*.65)?demo:landing,previousTop=changed?anchor.getBoundingClientRect().top:0;
 enhanced=next;document.body.classList.toggle('scroll-ready',enhanced);
 const off=paused||motion.matches||!desktop.matches;
 scene.setEnabled(!off);scene.setProgress(0);
 $('.motion-toggle').setAttribute('aria-pressed',String(paused||motion.matches));
 $('.motion-toggle').setAttribute('aria-label',paused||motion.matches?'Включить анимацию':'Остановить анимацию');
 $('.motion-toggle span').textContent=paused||motion.matches?'выкл.':'вкл.';
 document.body.classList.toggle('motion-paused',paused||motion.matches);
 if(!enhanced){landing.inert=false;demo.inert=false;demoIntro.inert=false;landing.removeAttribute('aria-hidden');demo.removeAttribute('aria-hidden');demoIntro.removeAttribute('aria-hidden');root.dataset.scrollProgress='sequential'}
 queueFit();
 if(changed&&scrollY>0){if(!wasEnhanced&&enhanced&&anchor===demo){scrollTo({top:root.getBoundingClientRect().top+scrollY+root.offsetHeight-viewport.offsetHeight,behavior:'instant'})}else{const delta=anchor.getBoundingClientRect().top-previousTop;scrollBy({top:delta,behavior:'instant'})}}
 queueScroll();
}
$('.motion-toggle').addEventListener('click',()=>{paused=!paused;configure()});
motion.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations=[];configure()});desktop.addEventListener('change',configure);
addEventListener('resize',()=>{queueFit();queueScroll()},{passive:true});document.fonts.ready.then(()=>{queueFit();queueScroll()});
root.addEventListener('pointermove',e=>{if(!fine.matches||!enhanced||progress>.15)return;const r=viewport.getBoundingClientRect();scene.setPointer((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1)},{passive:true});root.addEventListener('pointerleave',()=>scene.setPointer(0,0));
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
 $$('[data-go]').forEach(e=>{const i=Number(e.dataset.go);if(i===active)e.setAttribute('aria-current','true');else e.removeAttribute('aria-current');e.classList.toggle('is-passed',i<active)});centerChip();
 $$('[data-scenario]').forEach((e,i)=>{if(i===active)e.setAttribute('aria-current','true');else e.removeAttribute('aria-current')});
 $('#carousel-announcement').textContent=demo.inert?'':`${active+1} из 6. ${data[active].title}`;
}
function navigate(id,focus=false){
 const url=new URL(location.href);url.hash=id;history.pushState(null,'',url);
 const y=id==='top'?root.getBoundingClientRect().top+scrollY:enhanced?root.getBoundingClientRect().top+scrollY+root.offsetHeight-viewport.offsetHeight:demo.getBoundingClientRect().top+scrollY-24;
 pendingFocus=id==='scenarios'&&focus;
 scrollTo({top:y,behavior:motion.matches||paused?'instant':'smooth'});
 if(!enhanced&&pendingFocus){pendingFocus=false;$('#prev-slide').focus({preventScroll:true})}
}
$$('a[href="#scenarios"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();if(a.dataset.scenario)show(Number(a.dataset.scenario));navigate('scenarios',true)}));
$$('a[href="#top"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate('top')}));
$$('[data-go]').forEach(e=>e.addEventListener('click',()=>show(Number(e.dataset.go))));
// Mobile shows one surface at a time: the client's chat or the staff panel. Both fill
// the same fixed stage, so switching never changes the page height.
const chipBar=$('.scenario-chips'),viewButtons=$$('.view-switch [data-view]');
function centerChip(){if(!chipBar.offsetWidth)return;const chip=chipBar.querySelector(`[data-go="${active}"]`);chipBar.scrollTo({left:chip.offsetLeft-(chipBar.clientWidth-chip.offsetWidth)/2,behavior:paused||motion.matches?'instant':'smooth'})}
function setView(view){
 if(carousel.dataset.view===view)return;carousel.dataset.view=view;
 viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 animate($('[data-slide].is-active '+(view==='staff'?'.staff-panel':'.chat-panel')),[{opacity:0,transform:`translateX(${view==='staff'?16:-16}px)`},{opacity:1,transform:'translateX(0)'}],{duration:360});
}
carousel.dataset.view='client';
// The in-chat hint hides with the chat, so focus moves to the visible switch.
$$('#scenarios [data-view]').forEach(b=>b.addEventListener('click',()=>{setView(b.dataset.view);if(!b.closest('.view-switch'))viewButtons.find(v=>v.dataset.view===b.dataset.view).focus({preventScroll:true})}));$('#prev-slide').addEventListener('click',()=>show(active-1));$('#next-slide').addEventListener('click',()=>show(active+1));
carousel.addEventListener('keydown',e=>{if(e.altKey||e.metaKey||e.ctrlKey)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();show(e.key==='Home'?0:e.key==='End'?5:active+(e.key==='ArrowRight'?1:-1))}});
let touch;$('.slides-window').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});$('.slides-window').addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],x=t.clientX-touch.x,y=t.clientY-touch.y;touch=null;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.4)show(active+(x<0?1:-1))},{passive:true});$('.slides-window').addEventListener('touchcancel',()=>touch=null,{passive:true});
$$('[data-primary-cta]').forEach(e=>e.addEventListener('click',()=>trackGoal('hero_cta_click')));$$('.scenario-next-step a,.chat-next-step').forEach(e=>e.addEventListener('click',()=>trackGoal('scenario_final_cta')));
// Mobile: a floating "Обсудить задачу" once the hero buttons scroll away; it steps aside at the contacts.
let heroPassed=false,atContact=false;
const syncCta=()=>document.body.classList.toggle('cta-float',heroPassed&&!atContact);
new IntersectionObserver(([e])=>{heroPassed=!e.isIntersecting&&e.boundingClientRect.top<0;syncCta()}).observe($('.hero-actions'));
new IntersectionObserver(([e])=>{atContact=e.isIntersecting;syncCta()}).observe($('#contact'));$$('[data-contact]').forEach(e=>e.addEventListener('click',()=>trackGoal(`contact_${e.dataset.contact}`)));
function restoreHash(){if(location.hash==='#scenarios'){const y=enhanced?root.getBoundingClientRect().top+scrollY+root.offsetHeight-viewport.offsetHeight:demo.getBoundingClientRect().top+scrollY-24;scrollTo({top:y,behavior:'instant'})}else if(location.hash==='#top')scrollTo({top:0,behavior:'instant'})}
addEventListener('popstate',restoreHash);addEventListener('hashchange',restoreHash);
updateUI();configure();document.body.classList.add('ready');
if(location.hash==='#scenarios')requestAnimationFrame(restoreHash);
