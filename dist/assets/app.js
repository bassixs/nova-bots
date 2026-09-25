import { runIntro } from './intro.js?v=2';
import { initAnalytics, trackGoal } from './analytics.js';
initAnalytics();
document.body.classList.add('js-ready');
await runIntro();
document.body.classList.add('site-entered');
document.body.classList.add('showcase-entering');
setTimeout(() => document.body.classList.remove('showcase-entering'), 3000);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const carousel = document.querySelector('#scenarios');
// Measure the untransformed, stacked six-scene canvas, never the active scene.
// Scaling affects only mockups; controls keep their normal size and position.
const demoStage = carousel.querySelector('.demo-stage');
const demoCanvas = carousel.querySelector('.demo-stage-content');
const desktopShowcase = matchMedia('(min-width: 1151px)');
let demoFitFrame = 0;
function fitDemo() {
  demoFitFrame = 0;
  if (!desktopShowcase.matches) { carousel.style.removeProperty('--demo-scale'); return; }
  const scale = Math.min(1, demoStage.clientHeight / Math.max(1, demoCanvas.offsetHeight));
  carousel.style.setProperty('--demo-scale', String(scale));
}
function queueDemoFit() { if (!demoFitFrame) demoFitFrame = requestAnimationFrame(fitDemo); }
const demoResize = new ResizeObserver(queueDemoFit);
demoResize.observe(demoStage);
demoResize.observe(demoCanvas);
desktopShowcase.addEventListener('change',queueDemoFit);
addEventListener('resize',queueDemoFit,{passive:true});
document.fonts.ready.then(queueDemoFit);
fitDemo();
const slides = [...document.querySelectorAll('[data-slide]')];
slides.forEach((slide, i) => { if (i) { slide.setAttribute('aria-hidden','true'); slide.inert=true; } });
const dots = [...document.querySelectorAll('[data-go]')];
let active = 0, playing = !reduced.matches, visible = true, slideVisible = false, hovered = false, focused = false, timer;
let sixthReachedTracked = false;
let transitionTimer, captionTimer, captionAnimation;
const caption = document.querySelector('.scenario-caption');
function updateCaption() {
  document.querySelector('#scenario-number').textContent = String(active+1).padStart(2,'0');
  document.querySelector('#scenario-title').textContent = slides[active].getAttribute('aria-label').split(': ')[1];
}
function transitionCaption() {
  clearTimeout(captionTimer);
  captionAnimation?.cancel();
  if (reduced.matches) { updateCaption(); return; }
  captionAnimation = caption.animate([
    {opacity:1,transform:'translateY(0)',offset:0},
    {opacity:0,transform:'translateY(-9px)',offset:.2},
    {opacity:0,transform:'translateY(9px)',offset:.24},
    {opacity:1,transform:'translateY(0)',offset:1}
  ], {duration:500,easing:'cubic-bezier(.22,.7,.22,1)'});
  captionTimer = setTimeout(updateCaption,110);
}
const sceneAnimations = new Set();
let firstScenePlayed = false;
function animate(element, frames, options) {
  if (reduced.matches || !element) return;
  const animation = element.animate(frames, {duration:600, easing:'cubic-bezier(.22,.7,.22,1)', ...options});
  sceneAnimations.add(animation);
  animation.onfinish = () => { if (!['both','forwards'].includes(options?.fill)) sceneAnimations.delete(animation); };
  if (document.hidden || !slideVisible) animation.pause();
  return animation;
}
function clearSceneAnimations() {
  for (const animation of sceneAnimations) animation.cancel();
  sceneAnimations.clear();
}
function playConversation(slide, initial = false) {
  if (reduced.matches) return;
  const messages = [...slide.querySelectorAll('.bubble, .demo-choices, .product-strip')].filter(el => el.offsetHeight);
  messages.forEach((message, i) => animate(message, [
    {opacity:0, transform:'translateY(10px)'},
    {opacity:1, transform:'translateY(0)'}
  ], {duration:initial ? 420 : 300, delay:(initial ? 450 : 155)+i*(initial ? 85 : 42), fill:'backwards'}));
  const deliveredAt = initial ? 500 + messages.length*85 : 460;
  animate(slide.querySelector('.chat-status'), [{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}], {delay:deliveredAt,duration:initial ? 360 : 260,fill:'backwards'});
  slide.querySelectorAll('dl > div').forEach((row,i) => animate(row,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{delay:320+i*55,duration:280,fill:'backwards'}));
  animate(slide.querySelector('.result-note'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{delay:deliveredAt+40,duration:initial ? 400 : 260,fill:'backwards'});
}
function schedule() {
  clearTimeout(timer);
  for (const animation of sceneAnimations) {
    if (document.hidden || !slideVisible) animation.pause();
    else if (animation.playState === 'paused') animation.play();
  }
  const running = playing && visible && slideVisible && !document.hidden && !hovered && !focused && !reduced.matches;
  carousel.classList.toggle('is-auto-running', running);
  if (running) timer = setTimeout(() => { go(active + 1, false); }, 5500);
}
function stop() { playing = false; schedule(); }
function go(index, manual = true) {
  if (manual) stop();
  const next = (index + slides.length) % slides.length;
  if (next === active) { schedule(); return; }
  clearTimeout(transitionTimer);
  clearSceneAnimations();
  resetAllReflections();
  resetDepth();
  slides.forEach(s => s.classList.remove('is-leaving','from-left'));
  const previous = slides[active];
  previous.classList.remove('is-active'); previous.classList.add('is-leaving'); previous.setAttribute('aria-hidden','true'); previous.inert = true;
  const target = slides[next];
  target.classList.remove('from-left'); target.classList.add('is-active'); target.removeAttribute('aria-hidden'); target.inert = false;
  const direction = index < active ? -1 : 1;
  // Animate the two surfaces independently; the staff panel follows the phone.
  for (const [selector, delay] of [['.chat-panel', 0], ['.staff-panel', 100]]) {
    animate(previous.querySelector(selector), [
      {opacity:1,transform:'translateX(0) scale(1)',filter:'blur(0px)'},
      {opacity:0,transform:`translateX(${-direction*24}px) scale(.98)`,filter:'blur(8px)'}
    ], {duration:330,delay:delay ? 80 : 0,fill:'both'});
    animate(target.querySelector(selector), [
      {opacity:0,transform:`translateX(${direction*24}px) scale(.98)`,filter:'blur(8px)'},
      {opacity:1,transform:'translateX(0) scale(1)',filter:'blur(0px)'}
    ], {duration:500,delay:120+delay,fill:'backwards'});
  }
  carousel.style.setProperty('--active-scene', next);
  hero.style.setProperty('--arc-shift', `${(next-2)*5}px`);
  hero.style.setProperty('--arc-lift', `${(next%3-1)*4}px`);
  playConversation(target);
  active = next;
  if (manual) {
    trackGoal('scenario_change', { scenario_id: active + 1 });
    if (active === 5 && !sixthReachedTracked) {
      sixthReachedTracked = true;
      trackGoal('scenario_6_reached');
    }
  }
  dots.forEach((dot,i) => {
    if (i===active) dot.setAttribute('aria-current','true'); else dot.removeAttribute('aria-current');
    dot.classList.toggle('is-passed',i<active);
  });
  transitionCaption();
  if (manual) document.querySelector('#carousel-announcement').textContent = target.getAttribute('aria-label');
  transitionTimer = setTimeout(() => previous.classList.remove('is-leaving'), reduced.matches ? 0 : 760);
  schedule();
}
document.querySelector('#prev-slide').addEventListener('click', () => go(active-1));
document.querySelector('#next-slide').addEventListener('click', () => go(active+1));
document.querySelector('[data-primary-cta]').addEventListener('click', () => trackGoal('hero_cta_click'));
document.querySelector('.scenario-next-step a').addEventListener('click', () => trackGoal('scenario_final_cta'));
dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.go))));
carousel.addEventListener('pointerdown', stop, {passive:true});
carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
carousel.addEventListener('focusin', () => { focused = true; schedule(); });
carousel.addEventListener('focusout', () => { queueMicrotask(() => { focused = carousel.contains(document.activeElement); schedule(); }); });
carousel.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(active + (event.key === 'ArrowRight' ? 1 : -1)); }
  if (event.key === 'Home') { event.preventDefault(); go(0); }
  if (event.key === 'End') { event.preventDefault(); go(slides.length-1); }
});
let touchStart;
const windowEl = document.querySelector('.slides-window');
windowEl.addEventListener('touchstart', e => { if (e.touches.length === 1) touchStart = {x:e.touches[0].clientX,y:e.touches[0].clientY}; }, {passive:true});
windowEl.addEventListener('touchend', e => {
  if (!touchStart || !e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX-touchStart.x, dy=e.changedTouches[0].clientY-touchStart.y;
  touchStart = null;
  if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4) go(active + (dx<0?1:-1));
}, {passive:true});
windowEl.addEventListener('touchcancel', () => { touchStart=null; }, {passive:true});
new IntersectionObserver(entries => { visible=entries[0].isIntersecting; schedule(); }, {threshold:0}).observe(hero);
new IntersectionObserver(entries => {
  slideVisible=entries[0].isIntersecting;
  if (slideVisible && !firstScenePlayed) { firstScenePlayed=true; playConversation(slides[active], true); }
  schedule();
}, {threshold:0.12}).observe(carousel);
document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', () => {
  if (reduced.matches) {
    playing=false; clearSceneAnimations(); clearTimeout(captionTimer); captionAnimation?.cancel(); updateCaption();
    slides.forEach(slide => slide.classList.remove('is-leaving'));
  }
  schedule();
});
schedule();
// Reveal content once, without changing the document's scroll position.
const revealItems = document.querySelectorAll('.section-heading, .start-panel, .faq > div, .contact-grid');
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-revealed');
    revealObserver.unobserve(entry.target);
  }
}, {threshold:0.08});
revealItems.forEach((element, i) => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', element.classList.contains('step') ? `${(i-1)%4*90}ms` : '0ms');
  revealObserver.observe(element);
});
const menuButton=document.querySelector('.menu-toggle'), menu=document.querySelector('#mobile-menu');
function closeMenu() { menu.hidden=true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); }
menuButton.addEventListener('click',()=> { const open=menu.hidden; menu.hidden=!open; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню'); });
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
document.addEventListener('keydown',e=> { if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();} });
const contactTabs = [...document.querySelectorAll('[data-contact-tab]')];
let contactRevision = 0;
let contactAnimations = [];
function selectContactTab(tab) {
  if (tab.getAttribute('aria-selected') === 'true') return;
  const revision = ++contactRevision;
  const previousTab = contactTabs.find(item => item.getAttribute('aria-selected') === 'true');
  const previous = document.getElementById(previousTab.getAttribute('aria-controls'));
  const next = document.getElementById(tab.getAttribute('aria-controls'));
  contactAnimations.forEach(animation => animation.cancel());
  contactAnimations = [];
  contactTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    panel.hidden = !selected;
    panel.inert = !selected;
    panel.removeAttribute('aria-hidden');
  });
  if (reduced.matches) return;
  previous.hidden = false;
  previous.setAttribute('aria-hidden', 'true');
  const outgoing = previous.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:190,easing:'ease-out',fill:'both'});
  const incoming = next.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:60,easing:'cubic-bezier(.22,.7,.22,1)',fill:'backwards'});
  contactAnimations.push(outgoing, incoming);
  outgoing.onfinish = () => {
    if (revision !== contactRevision) return;
    previous.hidden = true;
    previous.removeAttribute('aria-hidden');
    outgoing.cancel();
  };
}
contactTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectContactTab(tab));
  tab.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % contactTabs.length;
    if (event.key === 'ArrowLeft') next = (index + contactTabs.length - 1) % contactTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = contactTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); selectContactTab(contactTabs[next]); contactTabs[next].focus();
  });
});
document.querySelectorAll('.messenger-panel .messenger-link[href]').forEach(link => {
  const channel = link.closest('.messenger-panel').id.replace('contact-panel-', '');
  link.addEventListener('click', () => trackGoal(`contact_${channel}`));
});

// One passive scroll listener; DOM reads and writes are batched in a frame.
const header = document.querySelector('.site-header');
const timeline = document.querySelector('.steps');
const steps = [...timeline.querySelectorAll('.step')];
let scrollFrame = 0;
let lastHeaderScrolled, lastTimelineProgress, lastCurrentStep, lastReduced, lastLightTravel;
function updateScrollScene() {
  scrollFrame = 0;
  const box = timeline.getBoundingClientRect();
  const vertical = innerWidth <= 1100;
  const travel = vertical ? Math.max(1, box.height - 80) : Math.max(260, innerHeight * .5);
  const progress = Math.max(0, Math.min(1, (innerHeight * .76 - box.top) / travel));
  const headerScrolled = scrollY > 24;
  if (headerScrolled !== lastHeaderScrolled) {
    header.classList.toggle('is-scrolled', headerScrolled);
    lastHeaderScrolled = headerScrolled;
  }
  const timelineProgress = reduced.matches ? 1 : progress;
  if (timelineProgress !== lastTimelineProgress) {
    timeline.style.setProperty('--timeline-progress', timelineProgress);
    lastTimelineProgress = timelineProgress;
  }
  const currentStep = Math.min(3, Math.floor(progress * 3 + .001));
  if (currentStep !== lastCurrentStep || reduced.matches !== lastReduced) {
    steps.forEach((step, i) => {
      step.classList.toggle('is-current', i === currentStep);
      step.classList.toggle('is-complete', i < currentStep);
      step.classList.toggle('is-reached', reduced.matches || i <= currentStep);
    });
    lastCurrentStep = currentStep;
    lastReduced = reduced.matches;
  }
  // Small bounded movement; the same light continues into the process section.
  const lightTravel = reduced.matches || innerWidth <= 700 ? 0 : Math.round(Math.min(scrollY, 1600) * .018);
  if (lightTravel !== lastLightTravel) {
    hero.style.setProperty('--scroll-light', `${lightTravel}px`);
    lastLightTravel = lightTravel;
  }

}
function queueScrollScene() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollScene); }
addEventListener('scroll', queueScrollScene, {passive:true});
addEventListener('resize', queueScrollScene, {passive:true});
reduced.addEventListener('change', queueScrollScene);
updateScrollScene();

// Keep native details semantics while animating open and close, including rapid clicks.
document.querySelectorAll('.faq-list details').forEach((details, index) => {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('p');
  let animation, desiredOpen = details.open;
  summary.addEventListener('click', event => {
    if (reduced.matches) {
      if (animation) animation.cancel();
      animation = null;
      desiredOpen = !details.open;
      if (desiredOpen) trackGoal('faq_open', { faq_id: index + 1 });
      return;
    }
    event.preventDefault();
    if (!animation) desiredOpen = details.open;
    desiredOpen = !desiredOpen;
    if (desiredOpen) trackGoal('faq_open', { faq_id: index + 1 });
    const from = details.getBoundingClientRect().height;
    if (animation) animation.cancel();
    details.open = true;
    details.classList.toggle('is-expanding', desiredOpen);
    const to = desiredOpen ? details.scrollHeight : summary.getBoundingClientRect().height + 1;
    animation = details.animate([{height:`${from}px`},{height:`${to}px`}], {duration:420,easing:'cubic-bezier(.22,.7,.22,1)'});
    if (desiredOpen) answer.animate([{opacity:0,filter:'blur(4px)',transform:'translateY(5px)'},{opacity:1,filter:'blur(0px)',transform:'translateY(0)'}], {duration:360,delay:70,fill:'backwards'});
    animation.onfinish = () => { details.open = desiredOpen; details.classList.remove('is-expanding'); animation = null; };
  });
});

// Cursor response only on fine pointers. CSS eases transforms; no perpetual RAF loop.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let pointerFrame = 0, pointerPosition = null;
function setHeroDepth(name, value) {
  const next = `${Math.round(value * 2) / 2}px`;
  if (hero.style.getPropertyValue(name) !== next) hero.style.setProperty(name, next);
}
function resetDepth() {
  pointerPosition = null;
  cancelAnimationFrame(pointerFrame); pointerFrame = 0;
  for (const name of ['--depth-x','--depth-y','--arc-pointer-x','--arc-pointer-y','--ambient-x','--ambient-y']) setHeroDepth(name, 0);
}
carousel.addEventListener('pointermove', event => {
  if (reduced.matches || !finePointer.matches || innerWidth <= 700 || event.pointerType === 'touch') return;
  if (event.target.closest('.showcase-footer')) { resetDepth(); return; }
  pointerPosition = {x:event.clientX, y:event.clientY};
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    if (!pointerPosition) return;
    const bounds = carousel.getBoundingClientRect();
    const x = Math.max(-1,Math.min(1,(pointerPosition.x-bounds.left)/bounds.width*2-1));
    const y = Math.max(-1,Math.min(1,(pointerPosition.y-bounds.top)/bounds.height*2-1));
    setHeroDepth('--depth-x',x*4.5); setHeroDepth('--depth-y',y*4.5);
    setHeroDepth('--arc-pointer-x',x*2.5); setHeroDepth('--arc-pointer-y',y*2.5);
    setHeroDepth('--ambient-x',x*1.5); setHeroDepth('--ambient-y',y*1.5);
  });
}, {passive:true});
carousel.addEventListener('pointerleave', resetDepth);
addEventListener('resize', resetDepth, {passive:true});
reduced.addEventListener('change',resetDepth);
finePointer.addEventListener('change',resetDepth);
const glassCards = [...document.querySelectorAll('.chat-panel,.staff-panel,.contact-grid')];
const resetReflections = [];
glassCards.forEach(card => {
  let frame = 0, point;
  const reset = () => { cancelAnimationFrame(frame); frame=0; card.classList.remove('has-reflection'); card.style.setProperty('--reflection-x','0px'); card.style.setProperty('--reflection-y','0px'); };
  resetReflections.push(reset);
  card.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || innerWidth <= 700 || event.pointerType === 'touch') return;
    point={x:event.clientX,y:event.clientY};
    if (frame) return;
    frame=requestAnimationFrame(() => {
      frame=0;
      const rect=card.getBoundingClientRect();
      card.style.setProperty('--reflection-x',`${Math.round((point.x-rect.left-rect.width/2)*.35/4)*4}px`);
      card.style.setProperty('--reflection-y',`${Math.round((point.y-rect.top-rect.height/2)*.35/4)*4}px`);
      card.classList.add('has-reflection');
    });
  },{passive:true});
  card.addEventListener('pointerleave',reset);
});
function resetAllReflections() { resetReflections.forEach(reset=>reset()); }
reduced.addEventListener('change',resetAllReflections);
finePointer.addEventListener('change',resetAllReflections);

reduced.addEventListener('change', () => {
  if (!reduced.matches) return;
  ++contactRevision;
  contactAnimations.forEach(animation=>animation.cancel());
  contactAnimations=[];
  contactTabs.forEach(tab => {
    const panel=document.getElementById(tab.getAttribute('aria-controls'));
    const selected=tab.getAttribute('aria-selected')==='true';
    panel.hidden=!selected; panel.inert=!selected; panel.removeAttribute('aria-hidden');
  });
});
