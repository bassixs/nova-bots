import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {dirname,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const publicRoot=resolve(root,'../../public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json; charset=utf-8'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let base=root,relative=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(relative.startsWith('assets/'))base=publicRoot;
  if(relative==='analytics.js'){base=resolve(root,'../../src')}
  if(['favicon.ico','apple-touch-icon.png'].includes(relative))base=publicRoot;
  const file=resolve(base,relative);if(!file.startsWith(base+sep)){res.writeHead(403).end();return}
  if(!(await stat(file)).isFile())throw Error('Not a file');
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});res.end(bytes);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('404 — NOVA lab')}
}).listen(4196,'127.0.0.1',()=>console.log('NOVA immersive: http://127.0.0.1:4196/'));
