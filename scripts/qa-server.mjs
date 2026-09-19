// Local-only form contract fixture. Never included in dist or deployed.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4180');
  if(req.method==='POST' && url.pathname.startsWith('/__test/')){
    let body='';for await(const chunk of req){body+=chunk;if(body.length>20000){res.writeHead(413).end();return;}}
    const input=JSON.parse(body), mode=url.pathname.split('/').pop();
    console.log(JSON.stringify({mode,utm:input.attribution,method:input.method,hasTask:!!input.task,hasConsent:!!input.consent}));
    const confirmed=mode==='success';
    setTimeout(()=>res.writeHead(mode==='error'?500:200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:confirmed})),700);
    return;
  }
  try{
    if(url.pathname==='/'){
      const mode=url.searchParams.get('mode')||'success';
      const html=(await readFile('dist/index.html','utf8')).replace(/<script type="application\/json" id="site-config">.*?<\/script>/,`<script type="application/json" id="site-config">${JSON.stringify({leadEndpoint:'/__test/'+mode,privacyPolicyUrl:'/__test/privacy',metrikaId:''})}</script>`);
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html);return;
    }
    const file=resolve(root,'.'+url.pathname);if(!file.startsWith(root+sep))throw new Error();
    res.writeHead(200,{'Content-Type':{'.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'}[extname(file)]||'text/plain'}).end(await readFile(file));
  }catch{res.writeHead(404).end();}
}).listen(4180,'127.0.0.1',()=>console.log('QA only: http://127.0.0.1:4180/'));
