import { runIntro } from './intro.js';
document.body.classList.add('js-ready');
await runIntro();
const config = JSON.parse(document.querySelector('#site-config').textContent);
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
const attributionKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','yclid'];
let attribution = {};
try { attribution = JSON.parse(sessionStorage.getItem('nova-attribution') || '{}'); } catch { /* Storage is optional. */ }
if (!attribution || typeof attribution !== 'object' || Array.isArray(attribution)) attribution = {};
attribution = Object.fromEntries(attributionKeys.filter(k => typeof attribution[k] === 'string').map(k => [k, attribution[k].slice(0,500)]));
const query = new URLSearchParams(location.search);
for (const key of attributionKeys) if (query.has(key)) attribution[key] = query.get(key).slice(0,500);
try { sessionStorage.setItem('nova-attribution', JSON.stringify(attribution)); } catch { /* Continue without persistence. */ }
const metrikaId = /^\d+$/.test(String(config.metrikaId)) ? Number(config.metrikaId) : null;
if (metrikaId) {
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const script = document.createElement('script'); script.async = true; script.src = 'https://mc.yandex.ru/metrika/tag.js'; document.head.append(script);
  window.ym(metrikaId, 'init', { clickmap:false, trackLinks:false, accurateTrackBounce:true, webvisor:false });
}
function track(event, params) { if (metrikaId && window.ym) window.ym(metrikaId, 'reachGoal', event, params); }
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
  if (manual) { stop(); track('scenario_interaction', { action:'switch', scenario:((index + slides.length) % slides.length) + 1 }); }
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
document.querySelectorAll('[data-primary-cta]').forEach(a => a.addEventListener('click', () => track('primary_cta_click')));
const menuButton=document.querySelector('.menu-toggle'), menu=document.querySelector('#mobile-menu');
function closeMenu() { menu.hidden=true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); }
menuButton.addEventListener('click',()=> { const open=menu.hidden; menu.hidden=!open; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню'); });
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
document.addEventListener('keydown',e=> { if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();} });
const form=document.querySelector('#lead-form'), status=document.querySelector('#form-status'), submit=form.querySelector('[type=submit]');
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
  track('contact_method_select', {method:tab.dataset.contactTab});
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
document.querySelectorAll('[data-messenger]').forEach(link => link.addEventListener('click', () => track('messenger_click', {method:link.dataset.messenger})));
const field = name => form.elements.namedItem(name);
let started=false, submitting=false;
form.addEventListener('input',()=>{if(!started){started=true;track('form_start');}});
field('contact').addEventListener('input',()=> {
  field('contact').removeAttribute('aria-invalid');document.querySelector('#error-contact').textContent='';
});
function contactMethod(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^[+\d\s()\-]+$/.test(value) && value.replace(/\D/g,'').length >= 10 && value.replace(/\D/g,'').length <= 15) return 'phone';
  return null;
}
function validate() {
  const contact=field('contact').value.trim();
  const error=!contact?'Оставьте телефон или электронную почту.':!contactMethod(contact)?'Укажите корректный email или телефон из 10–15 цифр.':'';
  document.querySelector('#error-contact').textContent=error;
  field('contact').setAttribute('aria-invalid',String(!!error));
  if(error){field('contact').focus();return false;}return true;
}
form.addEventListener('submit',async e=> {
  e.preventDefault(); if(submitting) return;
  if(!validate()) return;
  if(!config.leadEndpoint || !config.privacyPolicyUrl){ status.dataset.state='error';status.textContent='Приём заявок пока не подключён. Данные не отправлены. Для запуска нужны получатель заявок и политика обработки данных.';return; }
  submitting=true;submit.disabled=true;submit.setAttribute('aria-busy','true');status.dataset.state='sending';status.textContent='Отправляем заявку…';
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
  const payload={name:'',organization:'',method:contactMethod(field('contact').value.trim()),contact:field('contact').value.trim(),task:field('task').value.trim(),attribution,page:location.pathname,consent:{policy:config.privacyPolicyUrl,acceptedAt:new Date().toISOString()}};
  try{
    const response=await fetch(config.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json();
    if(!response.ok || result.ok!==true) throw new Error('not-confirmed');
    status.dataset.state='success';status.textContent='Спасибо! Контакт получен. Свяжемся с вами, чтобы обсудить задачу.';track('lead_confirmed');form.reset();form.querySelector('.optional-task').open=false;field('contact').removeAttribute('aria-invalid');started=false;
  }catch(error){status.dataset.state='error';status.textContent=error.name==='AbortError'?'Сервер не подтвердил отправку вовремя. Данные сохранены в форме — попробуйте ещё раз позже.':'Не удалось подтвердить отправку. Данные сохранены в форме — попробуйте ещё раз позже.';}
  finally{clearTimeout(timeout);submitting=false;submit.disabled=false;submit.removeAttribute('aria-busy');}
});
