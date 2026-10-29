import {scenarios} from '../../src/scenarios.mjs';
import {carousel,logo,icon,esc} from '../../src/components.mjs';
import {fullPageSections} from './sections.mjs';

// Body markup of the NOVA Immersive page, shared by the local prototype build and the production build.
export function immersiveBody(config){return `
<a class="skip-link" href="#main">Перейти к содержимому</a>
<header class="header"><a class="brand" href="#top" aria-label="NOVA lab — главная">${logo()}</a><a class="header-demo" href="#scenarios">Возможности <span>06</span></a><a class="contact-link" href="#contact">Обсудить проект ${icon('diagonal')}</a></header>
<main id="main"><section class="experience" id="top" aria-label="Чат-боты в MAX"><div class="experience-stage">
 <div class="scene" aria-hidden="true"><canvas id="nova-field"></canvas><svg class="scene-fallback" viewBox="0 0 600 600"><defs><linearGradient id="nova-static-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2A2E3A"/><stop offset=".45" stop-color="#11131A"/><stop offset="1" stop-color="#1B1F2C"/></linearGradient><linearGradient id="nova-static-edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6B7CFF"/><stop offset="1" stop-color="#9C6BFF"/></linearGradient><radialGradient id="nova-static-star"><stop stop-color="#fff"/><stop offset=".6" stop-color="#C9D0FF"/><stop offset="1" stop-color="#6B7CFF"/></radialGradient></defs><g transform="translate(-244 -218) scale(.85)"><path d="M318 452H432L887 886H748L432 582V886H318Z" fill="url(#nova-static-metal)" stroke="url(#nova-static-edge)" stroke-width="3" stroke-linejoin="round"/><path d="M876 333Q886 412 962 422Q886 432 876 512Q866 432 790 422Q866 412 876 333Z" fill="url(#nova-static-star)"/></g></svg></div>
 <div class="landing" id="landing">
  <div class="hero-copy"><p class="eyebrow">БОТЫ И АВТОМАТИЗАЦИЯ</p><h1>Чат-боты<br>в <span>MAX</span><span class="period">.</span></h1><p class="audience">Для бизнеса и учреждений.</p><p class="description">Разрабатываем ботов для сбора заявок, записи на услуги и автоматизации рабочих процессов.</p><div class="hero-actions"><a class="hero-contact" href="#contact" data-primary-cta>Обсудить задачу ${icon('diagonal')}</a><a class="explore" href="#scenarios">Посмотреть в работе <span>${icon('arrow')}</span></a></div></div>
  <div class="signal-note"><p class="micro">КЛИЕНТ <span>· MAX</span></p><p>${scenarios[0].user}</p><a href="#scenarios" class="send-signal" aria-label="Посмотреть, как бот обработает сообщение">${icon('arrow')}</a></div>
  <p class="scene-caption">Не просто отвечает.<br><span>Запускает процессы.</span></p>
 <nav class="scenario-index" aria-label="Демонстрационные сценарии">${scenarios.map((s,i)=>`<a href="#scenarios" data-scenario="${i}" aria-label="${i+1}. ${esc(s.title)}"><span class="index-number">0${i+1}</span><span class="index-title">${s.title}</span><span class="index-arrow" aria-hidden="true">↗</span></a>`).join('')}</nav>
 <button class="motion-toggle" type="button" aria-pressed="false" aria-label="Остановить анимацию">Движение <span>вкл.</span></button>
 </div>
 <div class="demo-view" id="demo-view"><div class="demo-intro"><a class="back-button" href="#top">${icon('arrow','reverse')} Наверх</a><p class="eyebrow">ВОЗМОЖНОСТИ MAX</p><h2 id="demo-title">${scenarios[0].title}</h2><p class="demo-description">Человек пишет обычное сообщение.<br>Сотрудник получает готовую задачу.</p><a class="demo-contact" href="#contact">Обсудить задачу ${icon('diagonal')}</a></div>${carousel()}</div>
</div></section>
${fullPageSections(config)}</main>
<script type="application/json" id="scenario-data">${JSON.stringify(scenarios).replaceAll('<','\\u003c')}</script>
`;}
