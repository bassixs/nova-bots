import {processSection,startSection,faq,logo,icon,esc} from '../../src/components.mjs';

// Reuse v1's content, rather than maintaining a second set of marketing copy.
const steps=[...processSection().matchAll(/<article class="step">[\s\S]*?<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g)].map(([,title,text])=>({title:title.replace(/<br>\s*/g,' '),text}));
const brief=[...startSection().matchAll(/<article class="brief-row"[^>]*><span>(.*?)<\/span><h3>(.*?)<\/h3><p>(.*?)<\/p><\/article>/g)].map(([,number,title,text])=>({number,title,text}));
if(steps.length!==4||brief.length!==4)throw Error('The v1 process/brief content contract changed.');

export function fullPageSections(config){
 let question=0;
 const questions=faq().replace('class="faq section container" id="faq"','class="faq-chapter chapter" id="faq" aria-labelledby="faq-title"')
  .replace('<h2>','<h2 id="faq-title">')
  .replace(/<details>/g,()=>`<details class="disclosure" data-faq-id="${++question}">`)
  .replace(/<\/summary><p>/g,'</summary><div class="disclosure-content"><p>')
  .replace(/<\/p><\/details>/g,'</p></div></details>');
 if(question!==4)throw Error('The v1 FAQ content contract changed.');
 const channels=[['max','MAX',config.contacts.maxUrl],['telegram','Telegram',config.contacts.telegramUrl],['vk','ВКонтакте',config.contacts.vkUrl]];
 return `<div class="full-page">
 <section class="process-chapter chapter" id="process" aria-labelledby="process-title">
  <div class="process-layout"><div class="process-heading section-reveal"><p class="eyebrow">01 / КАК МЫ РАБОТАЕМ</p><h2 id="process-title">От задачи —<br>к работающему<br>решению<span>.</span></h2></div>
  <div class="process-track"><div class="process-line" aria-hidden="true"><span></span></div>${steps.map((s,i)=>`<article class="process-step" data-process-step><span class="process-number" aria-hidden="true">0${i+1}</span><div class="process-step-copy"><h3>${s.title}</h3><p>${s.text}</p></div></article>`).join('')}</div></div>
 </section>
 <section class="brief-chapter chapter" id="brief" aria-labelledby="brief-title">
  <div class="brief-heading section-reveal"><p class="eyebrow">У КАЖДОГО ПРОЦЕССА СВОЯ ЛОГИКА</p><h2 id="brief-title">Что обсудим<br>перед стартом</h2></div>
  <div class="brief-interface section-reveal"><div class="brief-toolbar"><p>ВАША ЗАДАЧА</p><span aria-hidden="true">01 — 04</span></div>
   <div class="brief-fields">${brief.map((s,i)=>`<details class="brief-field disclosure"${i===0?' open':''}><summary><span class="brief-number">${s.number}</span><h3>${s.title}</h3><span class="disclosure-icon" aria-hidden="true">${icon('plus')}</span></summary><div class="disclosure-content"><p>${s.text}</p></div></details>`).join('')}</div>
  </div>
 </section>
 ${questions}
 <section class="contact final-cta chapter" id="contact" tabindex="-1" aria-labelledby="contact-title"><div class="cta-composition"><div class="cta-copy section-reveal"><p class="eyebrow">03 / ДАВАЙТЕ ОБСУДИМ</p><h2 id="contact-title">Начнём<br>с вашей задачи<span>.</span></h2><p class="cta-description">Расскажите, что должен делать бот.<br>Обсудим разработку и предварительную оценку.</p></div><div class="cta-sign section-reveal" aria-hidden="true"><img src="/assets/nova-logo.png" width="1280" height="1280" alt="" loading="lazy" decoding="async"></div></div>
  <div class="cta-connect section-reveal"><p>Выберите удобный канал и напишите нам.<br>Детали обсудим в переписке.</p><div class="contact-channels">${channels.map(([id,label,url])=>`<a href="${esc(url)}" data-contact="${id}" target="_blank" rel="noopener noreferrer">${label} ${icon('diagonal')}</a>`).join('')}</div></div>
 </section>
 <footer class="page-footer chapter"><a class="brand" href="#top" aria-label="NOVA lab — наверх">${logo(true)}</a><p>Идеи. Технологии.<br>Реальный результат.</p><a class="return-top" href="#top">Наверх ${icon('arrow','footer-up')}</a><span class="copyright">© ${new Date().getFullYear()} NOVA lab</span></footer>
 </div>`;
}
