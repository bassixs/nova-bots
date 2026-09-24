import { runIntro } from './intro.js';
document.body.classList.add('js-ready');
await runIntro();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const carousel = document.querySelector('#scenarios');
const slides = [...document.querySelectorAll('[data-slide]')];
slides.forEach((slide, i) => { if (i) { slide.setAttribute('aria-hidden','true'); slide.inert=true; } });
const dots = [...document.querySelectorAll('[data-go]')];
let active = 0, playing = !reduced.matches, visible = true, slideVisible = false, hovered = false, focused = false, timer;
let transitionTimer;
const sceneAnimations = new Set();
let firstScenePlayed = false;
function animate(element, frames, options) {
  if (reduced.matches || !element) return;
  const animation = element.animate(frames, {duration:600, easing:'cubic-bezier(.22,.7,.22,1)', ...options});
  sceneAnimations.add(animation);
  animation.onfinish = () => sceneAnimations.delete(animation);
  if (document.hidden || !slideVisible) animation.pause();
  return animation;
}
function clearSceneAnimations() {
  for (const animation of sceneAnimations) animation.cancel();
  sceneAnimations.clear();
}
function playConversation(slide) {
  if (reduced.matches) return;
  const messages = [...slide.querySelectorAll('.bubble, .demo-choices')];
  messages.forEach((message, i) => animate(message, [
    {opacity:0, transform:`translateY(14px) translateX(${message.classList.contains('user') ? 9 : -9}px) scale(.98)`},
    {opacity:1, transform:'translateY(0) translateX(0) scale(1)'}
  ], {duration:480, delay:220+i*160, fill:'backwards'}));
  const deliveredAt = 220 + messages.length*160;
  animate(slide.querySelector('.chat-status'), [{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}], {delay:deliveredAt,duration:400,fill:'backwards'});
  animate(slide.querySelector('.staff-panel'), [{opacity:0,transform:'translate(24px,18px) scale(.97)'},{opacity:1,transform:'translate(0,0) scale(1)'}], {delay:500,duration:720,fill:'backwards'});
  slide.querySelectorAll('dl > div').forEach((row,i) => animate(row,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{delay:720+i*150,duration:450,fill:'backwards'}));
  animate(slide.querySelector('.result-note'),[{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{delay:deliveredAt+250,duration:500,fill:'backwards'});
  animate(slide.querySelector('.result-icon'),[{transform:'scale(.65)',opacity:0},{transform:'scale(1.12)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{delay:deliveredAt+350,duration:450,fill:'backwards'});
}
function schedule() {
  clearTimeout(timer);
  hero.classList.toggle('motion-paused', !visible || document.hidden);
  for (const animation of sceneAnimations) {
    if (document.hidden || !slideVisible) animation.pause();
    else if (animation.playState === 'paused') animation.play();
  }
  const running = playing && visible && slideVisible && !document.hidden && !hovered && !focused && !reduced.matches;
  carousel.classList.toggle('is-auto-running', running);
  if (running) timer = setTimeout(() => { go(active + 1, false); }, 7000);
}
function stop() { playing = false; schedule(); }
function go(index, manual = true) {
  if (manual) stop();
  const next = (index + slides.length) % slides.length;
  if (next === active) { schedule(); return; }
  clearTimeout(transitionTimer);
  clearSceneAnimations();
  slides.forEach(s => s.classList.remove('is-leaving','from-left'));
  const previous = slides[active];
  previous.classList.remove('is-active'); previous.classList.add('is-leaving'); previous.setAttribute('aria-hidden','true'); previous.inert = true;
  const target = slides[next];
  target.classList.remove('from-left'); target.classList.add('is-active'); target.removeAttribute('aria-hidden'); target.inert = false;
  const direction = index < active ? -1 : 1;
  animate(previous, [{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:`translateX(${-direction*90}px) scale(.97)`}], {duration:620});
  animate(target, [{opacity:0,transform:`translateX(${direction*110}px) scale(.97)`},{opacity:1,transform:'translateX(0) scale(1)'}], {duration:760});
  playConversation(target);
  active = next;
  dots.forEach((dot,i) => i===active ? dot.setAttribute('aria-current','true') : dot.removeAttribute('aria-current'));
  document.querySelector('#scenario-number').textContent = String(active+1).padStart(2,'0');
  document.querySelector('#scenario-title').textContent = target.getAttribute('aria-label').split(': ')[1];
  if (manual) document.querySelector('#carousel-announcement').textContent = target.getAttribute('aria-label');
  transitionTimer = setTimeout(() => previous.classList.remove('is-leaving'), reduced.matches ? 0 : 780);
  schedule();
}
document.querySelector('#prev-slide').addEventListener('click', () => go(active-1));
document.querySelector('#next-slide').addEventListener('click', () => go(active+1));
dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.go))));
carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
carousel.addEventListener('focusin', () => { focused = true; schedule(); });
carousel.addEventListener('focusout', () => { queueMicrotask(() => { focused = carousel.contains(document.activeElement); schedule(); }); });
carousel.addEventListener('keydown', event => {
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
  if (slideVisible && !firstScenePlayed) { firstScenePlayed=true; playConversation(slides[active]); }
  schedule();
}, {threshold:0.12}).observe(carousel);
document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', () => { if (reduced.matches) { playing=false; clearSceneAnimations(); } schedule(); });
schedule();
// Reveal content once, without changing the document's scroll position.
const revealItems = document.querySelectorAll('.section-heading, .step, .start-panel, .faq > div, .contact-copy, .contact-options');
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
function selectContactTab(tab) {
  contactTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    panel.hidden = !selected;
    if (selected && !reduced.matches) panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
  });
}
contactTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectContactTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % contactTabs.length;
    if (event.key === 'ArrowLeft') next = (index + contactTabs.length - 1) % contactTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = contactTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); selectContactTab(contactTabs[next]); contactTabs[next].focus();
  });
});
