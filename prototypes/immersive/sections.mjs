import {processSection,startSection,faq,logo,icon,esc} from '../../src/components.mjs';
import {scenarios} from '../../src/scenarios.mjs';

// Reuse v1's content, rather than maintaining a second set of marketing copy.
const glyphs=['<path d="M16 2.5C16.9 11.2 20.8 15.1 29.5 16 20.8 16.9 16.9 20.8 16 29.5 15.1 20.8 11.2 16.9 2.5 16 11.2 15.1 15.1 11.2 16 2.5Z"/>','<circle cx="16" cy="16" r="12.5"/>','<path d="M16 4 29 27H3Z"/>','<rect x="4.5" y="4.5" width="23" height="23" rx="1.5"/>'];
const glyph=i=>`<svg class="process-glyph" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">${glyphs[i]}</svg>`;
const steps=[...processSection().matchAll(/<article class="step">[\s\S]*?<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g)].map(([,title,text])=>({title:title.replace(/<br>\s*/g,' '),text}));
const brief=[...startSection().matchAll(/<article class="brief-row"[^>]*><span>(.*?)<\/span><h3>(.*?)<\/h3><p>(.*?)<\/p><\/article>/g)].map(([,number,title,text])=>({number,title,text}));
if(steps.length!==4||brief.length!==4)throw Error('The v1 process/brief content contract changed.');

// Lines of a heading revealed one by one. Content stays plain text for no-JS readers.
const lines=html=>html.split(/<br>\s*/).map(l=>`<span class="line"><span>${l}</span></span>`).join('');

// "Как мы работаем": one real message from scenario 01 travels through the four steps.
const s0=scenarios[0];
const bubble=(text,who='user')=>`<div class="j-bubble j-${who}">${esc(text)}</div>`;
const frames=[
 `<div class="journey-frame" data-frame="0"><p class="j-label">Входящее сообщение · MAX</p>${bubble(s0.user)}
  <ul class="j-tags"><li><span>Кто пишет</span>${esc((t=>t[0].toUpperCase()+t.slice(1))(s0.category.split('·').pop().trim()))}</li><li><span>Что нужно</span>${esc(s0.staffTitle)} · ${esc(s0.rows[0][1].toLowerCase())}</li><li><span>Кто отвечает</span>${esc(s0.staffLabel)}</li></ul></div>`,
 `<div class="journey-frame" data-frame="1"><p class="j-label">Сценарий диалога</p>${bubble(s0.intro,'bot')}<div class="j-choices">${s0.choices.map(c=>`<span>${esc(c)}</span>`).join('')}</div>${bubble(s0.user)}${bubble(s0.reply,'bot')}<p class="j-route">${icon('arrow')} Передача: ${esc(s0.staffLabel.toLowerCase())}</p></div>`,
 `<div class="journey-frame" data-frame="2"><p class="j-label">Проверка на рабочих ситуациях</p><ol class="j-tests">${[[s0.user,'Бот уточняет задачу'],[s0.last,'Данные записаны'],[s0.status,'Сотрудник подключён']].map(([q,a])=>`<li><span class="j-check">${icon('check')}</span><span><b>${esc(q)}</b>${esc(a)}</span></li>`).join('')}</ol></div>`,
 `<div class="journey-frame" data-frame="3"><p class="j-label">${esc(s0.staffLabel)} · панель сотрудника</p><div class="j-staff"><h4>${esc(s0.staffTitle)}</h4><dl>${s0.rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p>${icon('check')} ${esc(s0.result)}</p></div></div>`
];

// Brief: the four v1 topics become pick-lists; options are drafts pending client approval.
const briefOptions=[
 ['tasks','Задачи бота',['Заявки и расчёты','Запись на услуги','Помощь покупателю','Статус заказа','Обращения жителей','Материалы для прессы']],
 ['roles','Роли пользователей',['Клиенты','Жители','Менеджеры','Консультанты','Администраторы','Пресс-служба']],
 ['integrations','Интеграции',['CRM','Таблицы','Сайт','1С','Почта','Пока не нужны']],
 ['timing','Сроки и сопровождение',['Как можно скорее','В течение 1–2 месяцев','Без жёстких сроков','Нужна поддержка после запуска']]
];

export function fullPageSections(config){
 let question=0;
 const questions=faq().replace('class="faq section container" id="faq"','class="faq-chapter chapter" id="faq" aria-labelledby="faq-title"')
  .replace('<h2>','<h2 id="faq-title" class="lines">').replace('По делу.<br> До старта.',lines('По делу.<br><span class="accent">До старта.</span>'))
  .replace(/<details>/g,()=>`<details class="disclosure" data-faq-id="${++question}">`)
  .replace(/<\/summary><p>/g,'</summary><div class="disclosure-content"><p>')
  .replace(/<\/p><\/details>/g,'</p></div></details>');
 if(question!==4)throw Error('The v1 FAQ content contract changed.');
 const channels=[['max','MAX',config.contacts.maxUrl],['telegram','Telegram',config.contacts.telegramUrl],['vk','ВКонтакте',config.contacts.vkUrl]];
 return `<div class="full-page">
 <section class="process-chapter chapter sweep" id="process" aria-labelledby="process-title">
  <div class="process-heading section-reveal"><p class="eyebrow">01 / КАК МЫ РАБОТАЕМ</p><h2 id="process-title" class="lines">${lines('От задачи —<br><span class="accent">к работающему решению.</span>')}</h2></div>
  <div class="journey" data-journey><div class="journey-stage">
   <div class="journey-rail" aria-hidden="true"><span class="journey-fill"></span><span class="journey-star"><svg viewBox="0 0 32 32">${glyphs[0]}</svg></span></div>
   <div class="process-tabs" aria-label="Этапы работы">${steps.map((s,i)=>`<button type="button" data-process-go="${i}" aria-label="Этап ${i+1}: ${esc(s.title)}"${i?'':' aria-current="true"'}>0${i+1}<span></span></button>`).join('')}</div>
   <div class="process-track">${steps.map((s,i)=>`<article class="process-step" data-process-step="${i}">${glyph(i)}<span class="process-number" aria-hidden="true">0${i+1}</span><div class="process-step-copy"><h3>${s.title}</h3><p>${s.text}</p></div>${frames[i]}</article>`).join('')}</div>
   <div class="journey-window" aria-hidden="true"><span class="journey-window-bar"><i></i><i></i><i></i><b>Сценарий 01 · ${esc(s0.title)}</b></span></div>
  </div></div>
 </section>
 <section class="brief-chapter chapter sweep" id="brief" aria-labelledby="brief-title">
  <div class="brief-heading section-reveal"><p class="eyebrow">У КАЖДОГО ПРОЦЕССА СВОЯ ЛОГИКА</p><h2 id="brief-title" class="lines">${lines('Что обсудим<br><span class="accent">перед стартом</span>')}</h2></div>
  <form class="brief-builder section-reveal" id="brief-builder" novalidate>
   <div class="brief-groups">${brief.map((b,i)=>`<fieldset class="brief-group"><legend><span class="brief-number">${b.number}</span>${b.title}</legend><p class="brief-hint">${b.text}</p><div class="brief-chips">${briefOptions[i][2].map((o,k)=>`<label class="chip"><input type="checkbox" name="${briefOptions[i][0]}" value="${esc(o)}" id="brief-${briefOptions[i][0]}-${k}"><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`).join('')}</div>
   <aside class="brief-summary" aria-live="polite"><div class="brief-summary-head"><span class="brief-dot"></span>ВАША ЗАДАЧА<span class="brief-count" id="brief-count">0 / 4</span></div>
    <dl class="brief-result">${brief.map((b,i)=>`<div data-group="${briefOptions[i][0]}"><dt>${b.title}</dt><dd>—</dd></div>`).join('')}</dl>
    <p class="brief-note" id="brief-note">Отметьте, что подходит. Мы скопируем описание, а вы отправите его в удобный канал.</p>
    <button type="button" class="btn btn-primary brief-copy" id="brief-copy">Скопировать описание ${icon('file')}</button>
    <div class="brief-send">${channels.map(([id,label,url])=>`<a href="${esc(url)}" data-contact="${id}" data-brief-send target="_blank" rel="noopener noreferrer">${label} ${icon('diagonal')}</a>`).join('')}</div>
   </aside>
  </form>
 </section>
 ${questions.replace('class="faq-chapter chapter"','class="faq-chapter chapter sweep"')}
 <section class="contact final-cta chapter" id="contact" tabindex="-1" aria-labelledby="contact-title"><div class="cta-panel"><div class="cta-composition"><div class="cta-copy section-reveal"><p class="eyebrow">03 / ДАВАЙТЕ ОБСУДИМ</p><h2 id="contact-title" class="lines">${lines('Начнём<br><span class="accent">с вашей задачи.</span>')}</h2><p class="cta-description">Расскажите, что должен делать бот.<br>Обсудим разработку и предварительную оценку.</p></div><div class="cta-sign" aria-hidden="true"><img src="/materials/chrome-desktop.webp" alt="" width="1000" height="880" loading="lazy" decoding="async"><canvas class="cta-canvas"></canvas></div></div>
  <div class="cta-connect section-reveal"><p>Выберите удобный канал и напишите нам.<br>Детали обсудим в переписке.</p><div class="contact-channels">${channels.map(([id,label,url])=>`<a href="${esc(url)}" data-contact="${id}" target="_blank" rel="noopener noreferrer">${label} ${icon('diagonal')}</a>`).join('')}</div></div></div>
 </section>
 <footer class="page-footer chapter"><a class="brand" href="#top" aria-label="NOVA lab — наверх">${logo(true)}</a><p>Идеи. Технологии.<br><span>Реальный результат.</span></p><a class="return-top" href="#top">Наверх ${icon('arrow','footer-up')}</a><span class="copyright">© ${new Date().getFullYear()} NOVA lab</span></footer>
 </div>`;
}
