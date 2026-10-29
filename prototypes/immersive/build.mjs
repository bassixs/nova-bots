import {readFile,writeFile} from 'node:fs/promises';
import config from '../../site.config.mjs';
import {immersiveBody} from './page.mjs';

// Independent entry point. The production build and generated dist stay untouched.
const production=await readFile(new URL('../../dist/index.html',import.meta.url),'utf8');
let head=production.match(/<head>([\s\S]*?)<\/head>/)[1];
head=head.replace(/<script(?![^>]*type="application\/ld\+json")[\s\S]*?<\/script>/g,'')
 .replace(/<link rel="stylesheet"[^>]*>/g,'')
 .replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex, nofollow">');
const html=`<!doctype html><html lang="ru"><head>${head}<link rel="stylesheet" href="/immersive.css"><link rel="stylesheet" href="/scroll.css"><link rel="stylesheet" href="/full-page.css"><link rel="stylesheet" href="/brand.css"><script type="module" src="/scroll.js"></script><script type="module" src="/full-page.js"></script></head><body>${immersiveBody(config)}</body></html>`;
await writeFile(new URL('./index.html',import.meta.url),html);
console.log('Immersive prototype built separately; dist unchanged.');
