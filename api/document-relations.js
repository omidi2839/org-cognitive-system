import { createRepository } from '../src/infrastructure/repositoryFactory.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const now=()=>new Date().toISOString(),rid=()=>`DREL:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,9)}`;
const inverse=t=>({amends:'amended_by',amended_by:'amends',supersedes:'superseded_by',superseded_by:'supersedes',repeals:'repealed_by',repealed_by:'repeals',extends:'extended_by',extended_by:'extends',clarifies:'clarified_by',clarified_by:'clarifies',implements:'implemented_by',implemented_by:'implements',related_to:'related_to'})[t]||'related_to';
const labels={amends:'اصلاح‌کننده',amended_by:'اصلاح‌شده توسط',supersedes:'جایگزین‌کننده',superseded_by:'جایگزین‌شده توسط',repeals:'لغوکننده',repealed_by:'لغوشده توسط',extends:'توسعه‌دهنده',extended_by:'توسعه‌یافته توسط',clarifies:'تبیین‌کننده',clarified_by:'تبیین‌شده توسط',implements:'سند اجرایی',implemented_by:'دارای سند اجرایی',related_to:'سند مرتبط'};
function canonical(current,related,type){const inv=new Set(['amended_by','superseded_by','repealed_by','extended_by','clarified_by','implemented_by']);return inv.has(type)?{source:related,target:current,type:inverse(type)}:{source:current,target:related,type}}
export default async function handler(req,res){
 try{
  const repo=createRepository(),org=String(req.headers['x-org-id']||'ORG:SYN-001');
  if(req.method==='GET'){
   const u=new URL(req.url,'https://local'),id=u.searchParams.get('documentId')||'',db=await repo.all(),docsArr=(db.documents||[]).filter(d=>d.organizationId===org),docs=new Map(docsArr.map(d=>[d.id,d])),rels=(db.documentRelations||[]).filter(r=>r.organizationId===org&&r.status!=='deleted');
   if(!docs.has(id))return send(res,404,{message:'سند پیدا نشد.'});
   const items=rels.filter(r=>r.sourceDocumentRef===id||r.targetDocumentRef===id).map(r=>{const from=r.sourceDocumentRef===id,pt=from?r.relationType:inverse(r.relationType),other=from?r.targetDocumentRef:r.sourceDocumentRef,d=docs.get(other);return d?{...r,perspectiveType:pt,label:labels[pt]||pt,relatedDocument:{id:d.id,title:d.title,issuer:d.issuer||null}}:null}).filter(Boolean);
   const incoming=items.filter(x=>['amended_by','superseded_by','repealed_by','extended_by'].includes(x.perspectiveType));
   const statusLabel=items.some(x=>x.perspectiveType==='repealed_by')?'لغوشده':items.some(x=>x.perspectiveType==='superseded_by')?'جایگزین‌شده':incoming.length?'معتبر با اصلاحات':'بدون اصلاحیه ثبت‌شده';
   return send(res,200,{items,summary:{total:items.length,statusLabel,latestChange:incoming[0]?{title:incoming[0].relatedDocument.title}:null}});
  }
  if(req.method==='POST'){
   const b=req.body||{},current=String(b.documentId||''),related=String(b.relatedDocumentId||''),type=String(b.relationType||'amended_by');
   if(!current||!related||current===related)return send(res,400,{message:'دو سند متفاوت برای ثبت ارتباط لازم است.'});
   const db=await repo.all(),docs=(db.documents||[]).filter(d=>d.organizationId===org);
   if(!docs.some(d=>d.id===current)||!docs.some(d=>d.id===related))return send(res,404,{message:'یکی از اسناد مرتبط پیدا نشد.'});
   const c=canonical(current,related,type);let relation;
   await repo.mutate(s=>{s.documentRelations=Array.isArray(s.documentRelations)?s.documentRelations:[];relation={id:rid(),organizationId:org,sourceDocumentRef:c.source,targetDocumentRef:c.target,relationType:c.type,targetArticle:String(b.targetArticle||'').trim()||null,targetClause:String(b.targetClause||'').trim()||null,targetSection:String(b.targetSection||'').trim()||null,changeType:String(b.changeType||'').trim()||null,effectiveFrom:String(b.effectiveFrom||'').trim()||null,note:String(b.note||'').trim()||null,status:'active',createdAt:now()};s.documentRelations.push(relation)});
   return send(res,201,{ok:true,relation});
  }
  if(req.method==='DELETE'){const id=String(req.body?.relationId||'');let found=false;await repo.mutate(s=>{s.documentRelations=Array.isArray(s.documentRelations)?s.documentRelations:[];const r=s.documentRelations.find(x=>x.id===id&&x.organizationId===org&&x.status!=='deleted');if(r){r.status='deleted';r.deletedAt=now();found=true}});return found?send(res,200,{ok:true}):send(res,404,{message:'ارتباط پیدا نشد.'})}
  return send(res,405,{message:'Method not allowed'});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطای داخلی'})}
}