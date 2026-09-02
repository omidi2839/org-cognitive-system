import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handler} from './api/index.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const pub=path.join(__dirname,'public');
const port=Number(process.env.PORT||3000);

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};

const server=http.createServer(async(req,res)=>{
  if(req.url?.startsWith('/api/')){
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',async()=>{
      if(body){try{req.body=JSON.parse(body)}catch{req.body={}}}
      await handler(req,res);
    });
    return;
  }
  const clean=(req.url||'/').split('?')[0];
  let file=clean==='/'?'index.html':clean.replace(/^\/+/,'');
  let target=path.join(pub,file);
  if(!target.startsWith(pub)||!fs.existsSync(target)||fs.statSync(target).isDirectory())target=path.join(pub,'index.html');
  res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(target).pipe(res);
});
server.listen(port,()=>console.log(`Organizational Cognitive Sandbox 0.7.0 listening on :${port}`));
