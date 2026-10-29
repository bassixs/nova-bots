import {readFile,writeFile} from 'node:fs/promises';
import {scenarios} from '../../src/scenarios.mjs';
import {carousel,logo,icon,esc} from '../../src/components.mjs';
import config from '../../site.config.mjs';
import {fullPageSections} from './sections.mjs';

// Independent entry point. The production build and generated dist stay untouched.
const production=await readFile(new URL('../../dist/index.html',import.meta.url),'utf8');
let head=production.match(/<head>([\s\S]*?)<\/head>/)[1];
head=head.replace(/<script(?![^>]*type="application\/ld\+json")[\s\S]*?<\/script>/g,'')
 .replace(/<link rel="stylesheet"[^>]*>/g,'')
 .replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex, nofollow">');
const html=`<!doctype html><html lang="ru"><head>${head}<link rel="stylesheet" href="/immersive.css"><link rel="stylesheet" href="/scroll.css"><link rel="stylesheet" href="/full-page.css"><script type="module" src="/scroll.js"></script><script type="module" src="/full-page.js"></script></head><body>
<a class="skip-link" href="#main">Перейти к содержимому</a>
<header class="header"><a class="brand" href="#top" aria-label="NOVA lab — главная">${logo()}</a><a class="header-demo" href="#scenarios">Возможности <span>06</span></a><a class="contact-link" href="#contact">Обсудить проект ${icon('diagonal')}</a></header>
<main id="main"><section class="experience" id="top" aria-label="Чат-боты в MAX"><div class="experience-stage">
 <div class="scene" aria-hidden="true"><canvas id="nova-field"></canvas><svg class="scene-fallback" viewBox="0 0 600 600"><path d="M125 465V135L475 465V135" fill="none" stroke="#8397cf" stroke-width="54" stroke-linejoin="round"/><path d="M125 465V135L475 465V135" fill="none" stroke="#d0dbf4" stroke-width="1"/></svg></div>
 <div class="landing" id="landing">
  <div class="hero-copy"><p class="eyebrow">БОТЫ И АВТОМАТИЗАЦИЯ</p><h1>Чат-боты<br>в <span>MAX</span><span class="period">.</span></h1><p class="audience">Для бизнеса и учреждений.</p><p class="description">Разрабатываем ботов для сбора заявок, записи на услуги и автоматизации рабочих процессов.</p><div class="hero-actions"><a class="explore" href="#scenarios">Посмотреть в работе <span>${icon('arrow')}</span></a><a class="hero-contact" href="#contact" data-primary-cta>Обсудить задачу ${icon('diagonal')}</a></div></div>
  <div class="signal-note"><p class="micro">КЛИЕНТ <span>· MAX</span></p><p>${scenarios[0].user}</p><a href="#scenarios" class="send-signal" aria-label="Посмотреть, как бот обработает сообщение">${icon('arrow')}</a></div>
  <p class="scene-caption">Не просто отвечает.<br><span>Запускает процессы.</span></p>
 <nav class="scenario-index" aria-label="Демонстрационные сценарии">${scenarios.map((s,i)=>`<a href="#scenarios" data-scenario="${i}" aria-label="${i+1}. ${esc(s.title)}"><span class="index-number">0${i+1}</span><span class="index-title">${s.title}</span><span class="index-arrow" aria-hidden="true">↗</span></a>`).join('')}</nav>
 <button class="motion-toggle" type="button" aria-pressed="false" aria-label="Остановить анимацию">Движение <span>вкл.</span></button>
 </div>
 <div class="demo-view" id="demo-view"><div class="demo-intro"><a class="back-button" href="#top">${icon('arrow','reverse')} Наверх</a><p class="eyebrow">ВОЗМОЖНОСТИ MAX</p><h2 id="demo-title">${scenarios[0].title}</h2><p class="demo-description">Человек пишет обычное сообщение.<br>Сотрудник получает готовую задачу.</p><a class="demo-contact" href="#contact">Обсудить задачу ${icon('diagonal')}</a></div>${carousel()}</div>
</div></section>
${fullPageSections(config)}</main>
<script type="application/json" id="scenario-data">${JSON.stringify(scenarios).replaceAll('<','\\u003c')}</script>
</body></html>`;
await writeFile(new URL('./index.html',import.meta.url),html);
console.log('Immersive prototype built separately; dist unchanged.');
