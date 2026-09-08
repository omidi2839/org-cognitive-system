import { createRepository } from '../src/infrastructure/repositoryFactory.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
export default async function handler(req,res){
 try{
  if(req.method!=='GET')return send(res,405,{message:'Method not allowed'});
  const u=new URL(req.url,'https://local'),documentId=String(u.searchParams.get('documentId')||''),org=String(req.headers['x-org-id']||'ORG:SYN-001');
  if(!documentId)return send(res,400,{message:'شناسه سند الزامی است.'});
  const repo=createRepository(),db=await repo.all();
  const doc=(db.documents||[]).find(x=>x.id===documentId&&x.organizationId===org);
  if(!doc)return send(res,404,{message:'سند پیدا نشد.'});
  const n=(db.normalizedDocuments||[]).filter(x=>(x.documentRef||x.documentId)===documentId&&x.organizationId===org).sort((a,b)=>(b.sourceVersion||1)-(a.sourceVersion||1))[0];
  return send(res,200,{documentId,title:doc.title,structure:n?.structure||null,hasStructuredTables:Boolean(n?.structure?.kind==='docx'&&n?.structure?.tableCount),tableCount:n?.structure?.tableCount||0});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطای دریافت ساختار سند'})}
}