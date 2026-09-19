document.body.classList.add('js-ready');
const config = JSON.parse(document.querySelector('#site-config').textContent);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const carousel = document.querySelector('#scenarios');
const slides = [...document.querySelectorAll('[data-slide]')];
slides.forEach((slide, i) => { if (i) { slide.setAttribute('aria-hidden','true'); slide.inert=true; } });
const dots = [...document.querySelectorAll('[data-go]')];
const playButton = document.querySelector('#toggle-play');
let active = 0, playing = !reduced.matches, visible = true, hovered = false, focused = false, timer;
let transitionTimer;
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
  if (playing && visible && !document.hidden && !hovered && !focused && !reduced.matches) timer = setTimeout(() => { go(active + 1, false); }, 7000);
}
function renderPlay() {
  const paused = !playing;
  playButton.setAttribute('aria-pressed', String(paused));
  playButton.setAttribute('aria-label', paused ? 'Включить автопрокрутку' : 'Приостановить автопрокрутку');
  playButton.innerHTML = `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">${paused ? '<path d="m9 5 10 7-10 7z"/>' : '<path d="M9 6v12m6-12v12"/>'}</svg>`;
  if (reduced.matches) { playButton.disabled = true; playButton.setAttribute('aria-label', 'Автопрокрутка отключена: уменьшение движения'); }
  else playButton.disabled = false;
}
function stop() { playing = false; renderPlay(); schedule(); }
function go(index, manual = true) {
  if (manual) { stop(); track('scenario_interaction', { action:'switch', scenario:((index + slides.length) % slides.length) + 1 }); }
  const next = (index + slides.length) % slides.length;
  if (next === active) { schedule(); return; }
  clearTimeout(transitionTimer);
  slides.forEach(s => s.classList.remove('is-leaving','from-left'));
  const previous = slides[active];
  previous.classList.remove('is-active'); previous.classList.add('is-leaving'); previous.setAttribute('aria-hidden','true'); previous.inert = true;
  const target = slides[next];
  if (index < active) { target.classList.add('from-left'); void target.offsetWidth; }
  target.classList.remove('from-left'); target.classList.add('is-active'); target.removeAttribute('aria-hidden'); target.inert = false;
  active = next;
  dots.forEach((dot,i) => i===active ? dot.setAttribute('aria-current','true') : dot.removeAttribute('aria-current'));
  document.querySelector('#scenario-number').textContent = String(active+1).padStart(2,'0');
  document.querySelector('#scenario-title').textContent = target.getAttribute('aria-label').split(': ')[1];
  if (manual) document.querySelector('#carousel-announcement').textContent = target.getAttribute('aria-label');
  transitionTimer = setTimeout(() => previous.classList.remove('is-leaving'), reduced.matches ? 0 : 750);
  schedule();
}
document.querySelector('#prev-slide').addEventListener('click', () => go(active-1));
document.querySelector('#next-slide').addEventListener('click', () => go(active+1));
dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.go))));
playButton.addEventListener('click', () => { playing = !playing; renderPlay(); schedule(); track('scenario_interaction', {action:playing?'play':'pause'}); });
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
document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', () => { if (reduced.matches) playing=false; renderPlay(); schedule(); });
renderPlay(); schedule();
document.querySelector('[data-view-scenarios]').addEventListener('click', e => {
  e.preventDefault(); stop(); carousel.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'}); carousel.focus({preventScroll:true}); track('scenario_interaction', {action:'view'});
});
document.querySelectorAll('[data-primary-cta]').forEach(a => a.addEventListener('click', () => track('primary_cta_click')));
const menuButton=document.querySelector('.menu-toggle'), menu=document.querySelector('#mobile-menu');
function closeMenu() { menu.hidden=true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); }
menuButton.addEventListener('click',()=> { const open=menu.hidden; menu.hidden=!open; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню'); });
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
document.addEventListener('keydown',e=> { if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();} });
const form=document.querySelector('#lead-form'), status=document.querySelector('#form-status'), submit=form.querySelector('[type=submit]');
const field = name => form.elements.namedItem(name);
let started=false, submitting=false;
form.addEventListener('input',()=>{if(!started){started=true;track('form_start');}});
field('method').addEventListener('change',()=> {
  const method=field('method').value, contact=field('contact');
  contact.type=method==='email'?'email':method==='phone'?'tel':'text';
  contact.autocomplete=method==='email'?'email':method==='phone'?'tel':'off';
  contact.placeholder=method==='email'?'mail@company.ru':method==='phone'?'+7 (___) ___-__-__':'Номер телефона или ссылка на профиль';
  document.querySelector('#contact-label').textContent=method==='email'?'Электронная почта':method==='phone'?'Телефон':'Контакт в MAX';
  contact.removeAttribute('aria-invalid');document.querySelector('#error-contact').textContent='';
});
function validate() {
  const method=field('method').value, contact=field('contact').value.trim();
  const errors={name:field('name').value.trim().length<2?'Укажите имя — не менее 2 символов.':'',contact:!contact?'Укажите контакт для связи.':method==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)?'Проверьте адрес электронной почты.':method==='phone'&&(!/^[+\d\s()\-]+$/.test(contact)||contact.replace(/\D/g,'').length<10||contact.replace(/\D/g,'').length>15)?'Укажите телефон: от 10 до 15 цифр.':method==='max'&&contact.length<5?'Укажите номер телефона или ссылку на профиль.':'',task:field('task').value.trim().length<10?'Опишите задачу — не менее 10 символов.':''};
  let first;
  for(const [name,message] of Object.entries(errors)){document.querySelector(`#error-${name}`).textContent=message;field(name).setAttribute('aria-invalid',String(!!message));if(message&&!first) first=field(name);}
  if(first){first.focus();return false;}return true;
}
form.addEventListener('submit',async e=> {
  e.preventDefault(); if(submitting) return;
  if(!validate()) return;
  if(!config.leadEndpoint || !config.privacyPolicyUrl){ status.dataset.state='error';status.textContent='Приём заявок пока не подключён. Данные не отправлены. Для запуска нужны получатель заявок и политика обработки данных.';return; }
  submitting=true;submit.disabled=true;submit.setAttribute('aria-busy','true');status.dataset.state='sending';status.textContent='Отправляем заявку…';
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
  const payload={name:field('name').value.trim(),organization:field('organization').value.trim(),method:field('method').value,contact:field('contact').value.trim(),task:field('task').value.trim(),attribution,page:location.pathname,consent:{policy:config.privacyPolicyUrl,acceptedAt:new Date().toISOString()}};
  try{
    const response=await fetch(config.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json();
    if(!response.ok || result.ok!==true) throw new Error('not-confirmed');
    status.dataset.state='success';status.textContent='Спасибо! Заявка получена. Свяжемся с вами по указанному контакту.';track('lead_confirmed');form.reset();field('method').dispatchEvent(new Event('change'));started=false;
  }catch(error){status.dataset.state='error';status.textContent=error.name==='AbortError'?'Сервер не подтвердил отправку вовремя. Данные сохранены в форме — попробуйте ещё раз позже.':'Не удалось подтвердить отправку. Данные сохранены в форме — попробуйте ещё раз позже.';}
  finally{clearTimeout(timeout);submitting=false;submit.disabled=false;submit.removeAttribute('aria-busy');}
});
