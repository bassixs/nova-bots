import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import config from '../site.config.mjs';
import { esc, header, hero, processSection, startSection, faq, contact, footer } from '../src/components.mjs';

const origin = config.origin ? new URL(config.origin).origin : '';
const canonical = origin ? new URL(config.path, origin).href : '';
const css = (await Promise.all(
  ['src/style.css', 'src/experience.css', 'src/glass.css', 'src/atmosphere.css', 'src/polish.css']
    .map(file => readFile(file, 'utf8'))
)).join('\n');
const js = await readFile('src/app.js');
const analyticsJs = await readFile('src/analytics.js');
const assetVersion = createHash('sha256').update(css).update(js).update(analyticsJs).digest('hex').slice(0, 12);
const metricaId = /^\d+$/.test(config.metricaId) ? config.metricaId : '';
if (config.metricaId && !metricaId) throw new Error('NOVA_METRICA_ID must contain digits only.');

const schema = canonical ? {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${canonical}#organization`,
      name: config.name,
      url: canonical,
      logo: new URL('/assets/nova-logo.png', origin).href,
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: 'Разработка чат-ботов в MAX',
      serviceType: 'Разработка чат-ботов в MAX',
      description: config.description,
      url: canonical,
      provider: { '@id': `${canonical}#organization` },
    },
  ],
} : null;
const jsonLd = schema ? JSON.stringify(schema).replace(/</g, '\\u003c') : '';
const ogImage = config.ogImage && origin ? new URL(config.ogImage, origin).href : '';
const head = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#08090D"><title>${esc(config.title)}</title><meta name="description" content="${esc(config.description)}"><meta name="robots" content="${config.indexable && origin ? 'index, follow' : 'noindex, nofollow'}">${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="NOVA lab"><meta property="og:title" content="${esc(config.ogTitle)}"><meta property="og:description" content="${esc(config.ogDescription)}">${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}${ogImage ? `<meta property="og:image" content="${esc(ogImage)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="NOVA lab — разработка чат-ботов в MAX">` : ''}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(config.ogTitle)}"><meta name="twitter:description" content="${esc(config.ogDescription)}">${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="preload" href="/assets/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>${metricaId ? `<meta name="nova-metrica-id" content="${metricaId}">` : ''}<link rel="stylesheet" href="/assets/style.css?v=${assetVersion}"><script type="module" src="/assets/app.js?v=${assetVersion}"></script>${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}`;
const introBootstrap = `<script>(()=>{try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const mode=new URLSearchParams(location.search).get('intro');if(mode==='0'||mode!=='1'&&sessionStorage.getItem('nova-intro-seen')==='1')return;}catch{}document.documentElement.classList.add('intro-pending');window.novaIntroFallback=setTimeout(()=>document.documentElement.classList.remove('intro-pending'),8000);})();</script>`;
const introMarkup = `<div class="brand-intro" id="brand-intro" role="dialog" aria-modal="true" aria-label="Заставка NOVA lab"><video muted playsinline preload="none" aria-hidden="true" tabindex="-1" disablepictureinpicture></video><button type="button" class="intro-skip">Пропустить заставку ↗</button></div>`;
const pageHtml = `<!DOCTYPE html><html lang="ru"><head>${head}${introBootstrap}</head><body>${introMarkup}${header()}<main id="main">${hero()}${processSection()}${startSection()}${faq()}${contact(config)}</main>${footer(config)}<noscript><div class="noscript-note">Автопрокрутка требует JavaScript. Все примеры доступны ниже.</div></noscript></body></html>`;
const legacyHtml = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${esc(canonical)}"><meta http-equiv="refresh" content="0;url=${esc(canonical)}"><title>NOVA lab</title></head><body><a href="${esc(canonical)}">NOVA lab</a></body></html>`;
const notFoundHtml = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#08090D"><meta name="robots" content="noindex, follow"><title>404 — NOVA lab</title><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:#08090d;color:#f4f7ff;font-family:Arial,sans-serif}.wrap{width:min(100% - 48px,720px)}img{display:block;width:58px;height:58px;margin-bottom:68px}h1{font-size:clamp(74px,16vw,142px);line-height:1;margin:0;font-weight:500;letter-spacing:-.07em}p{font-size:clamp(23px,4vw,36px);margin:16px 0 45px;color:#d6e0f4}a{display:inline-flex;min-height:48px;align-items:center;color:#f4f7ff;text-decoration:none;border-bottom:1px solid #829dff}a:hover,a:focus-visible{color:#b9caff;border-color:#b9caff}a:focus-visible{outline:2px solid #b9caff;outline-offset:6px}</style></head><body><main class="wrap"><img src="/assets/icon-192.png" width="58" height="58" alt=""><h1>404</h1><p>Здесь ничего нет.</p><a href="/">Вернуться на главную →</a></main></body></html>`;

await mkdir('dist/services/max-bots', { recursive: true });
await mkdir('dist/assets', { recursive: true });
await writeFile('dist/index.html', pageHtml);
await writeFile('dist/services/max-bots/index.html', legacyHtml);
await writeFile('dist/404.html', notFoundHtml);
await writeFile('dist/assets/style.css', css);
await copyFile('src/app.js', 'dist/assets/app.js');
await copyFile('src/analytics.js', 'dist/assets/analytics.js');
await copyFile('src/intro.js', 'dist/assets/intro.js');
await copyFile('public/.htaccess', 'dist/.htaccess');
for (const asset of ['favicon.ico', 'apple-touch-icon.png']) await copyFile(`public/${asset}`, `dist/${asset}`);
for (const asset of [
  'nova-intro.mp4', 'outdoor-tables-triptych.webp', 'nova-logo.png', 'nova-logo-display.webp',
  'nova-og.png', 'grain.png', 'favicon.svg', 'favicon-32.png', 'icon-192.png', 'icon-512.png',
  'manrope-cyrillic.woff2', 'manrope-latin.woff2', 'OFL-Manrope.txt',
  'unbounded-cyrillic.woff2', 'unbounded-latin.woff2', 'OFL-Unbounded.txt',
]) await copyFile(`public/assets/${asset}`, `dist/assets/${asset}`);

await writeFile('dist/robots.txt', config.indexable && origin
  ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
const sitemapUrls = [...new Set(config.sitemapPaths || [config.path])].map(path => {
  if (!path.startsWith('/') || path.includes('?') || path.includes('#')) throw new Error(`Invalid sitemap path: ${path}`);
  return new URL(path, origin).href;
});
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map(url => `<url><loc>${esc(url)}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/site.webmanifest', JSON.stringify({
  name: 'NOVA lab', short_name: 'NOVA', start_url: '/', display: 'browser',
  background_color: '#08090D', theme_color: '#08090D',
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}));
console.log('Built NOVA lab → dist/');
