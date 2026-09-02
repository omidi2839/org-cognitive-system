import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/index.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  if(req.url.startsWith('/api/')){
    let raw=''; for await(const c of req) raw+=c; req.body=raw?JSON.parse(raw):{}; return handler(req,res);
  }
  const pathname=new URL(req.url,'http://local').pathname; const file=pathname==='/'?'index.html':pathname.slice(1); const p=path.join(root,'public',file);
  try{ const b=await fs.readFile(p); res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'}); res.end(b); } catch { res.writeHead(404); res.end('not found'); }
});
server.listen(Number(process.env.PORT||3000),()=>console.log('Build 0.3 local http://localhost:3000'));
