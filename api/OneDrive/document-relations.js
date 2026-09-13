import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { requireAuthenticated } from '../src/infrastructure/authSession.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const now=()=>new Date().toISOString(),rid=()=>`DREL:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,9)}`;
const inverse=t=>({amends:'amended_by',amended_by:'amends',supersedes:'superseded_by',superseded_by:'supersedes',repeals:'repealed_by',repealed_by:'repeals',extends:'extended_by',extended_by:'extends',clarifies:'clarified_by',clarified_by:'clarifies',implements:'implemented_by',implemented_by:'implements',related_to:'related_to'})[t]||'related_to';
const labels={amends:'اصلاحیه',amended_by:'دارای اصلاحیه',supersedes:'جایگزین‌کننده',superseded_by:'جایگزین‌شده توسط',repeals:'ملغی',repealed_by:'ملغی‌شده توسط',extends:'الحاقیه',extended_by:'دارای الحاقیه',clarifies:'استفسار',clarified_by:'دارای استفسار',implements:'سند اجرایی',implemented_by:'دارای سند اجرایی',related_to:'سند مرتبط'};
function canonical(current,related,type){const inv=new Set(['amended_by','superseded_by','repealed_by','extended_by','clarified_by','implemented_by']);return inv.has(type)?{source:related,target:current,type:inverse(type)}:{source:current,target:related,type}}
const parseBody=req=>{if(typeof req.body==='string'){try{return JSON.parse(req.body||'{}')}catch{return {}}}return req.body||{}};
const faToEn=v=>String(v??'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const legalSpace=v=>faToEn(v).replace(/[\u200c\u200d\u200e\u200f\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim();
const canonicalArticle=v=>{const x=legalSpace(v),m=x.match(/(?:ماده\s*)?([0-9]{1,4})/);return m?String(Number(m[1])):x};
const canonicalClause=v=>{const x=legalSpace(v);let m=x.match(/تبصره\s*[-–—:.：]?\s*([0-9]{1,4})/);if(m)return `تبصره ${Number(m[1])}`;m=x.match(/بند\s*[-–—:.：]?\s*([0-9]{1,4}|[الف-یآ])/);if(m)return `بند ${m[1]}`;m=x.match(/جزء\s*[-–—:.：]?\s*([0-9]{1,4})/);if(m)return `جزء ${Number(m[1])}`;if(/^[0-9]+$/.test(x))return `تبصره ${Number(x)}`;return x};
const normalizeItems=b=>{
 const raw=Array.isArray(b.changeItems)?b.changeItems:[];
 const items=raw.map((x,i)=>({id:String(x?.id||`CHG:${i+1}`),article:canonicalArticle(x?.article||'')||null,clause:canonicalClause(x?.clause||'')||null,description:String(x?.description||'').trim()||null})).filter(x=>x.article||x.clause||x.description);
 if(items.length)return items;
 const article=canonicalArticle(b.targetArticle||''),clause=canonicalClause(b.targetClause||''),description=String(b.note||'').trim();
 return (article||clause||description)?[{id:'CHG:1',article:article||null,clause:clause||null,description:description||null}]:[];
};
const relationSignature=(org,c,items,b)=>JSON.stringify([org,c.source,c.target,c.type,items.map(x=>[canonicalArticle(x.article||''),canonicalClause(x.clause||''),String(x.description||'').replace(/\s+/g,' ').trim()]),String(b.effectiveFrom||'').trim()]);


const numOf=v=>{const m=String(v||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).match(/\d+/);return m?Number(m[0]):null};
const legalDateOf=d=>Date.parse(d?.promulgationDate||d?.issuedAt||d?.meetingDate||'')||0;
const createdDateOf=d=>Date.parse(d?.createdAt||'')||0;
function looksLegacyReversedLegalRelation(r,docs){
 if(!['amends','extends','repeals','clarifies'].includes(r?.relationType)||r?.legacyOrientationRepairedAt)return false;
 const a=docs.get(r.sourceDocumentRef),b=docs.get(r.targetDocumentRef);if(!a||!b)return false;
 const ad=legalDateOf(a),bd=legalDateOf(b),an=numOf(a.documentNumber),bn=numOf(b.documentNumber);
 const derivative=/(اصلاحیه|الحاقیه|متمم|استفسار|لغو|ابطال)/;
 return (!derivative.test(String(a.title||''))&&derivative.test(String(b.title||'')))||(ad&&bd&&ad<bd)||(an!=null&&bn!=null&&an<bn&&(!ad||!bd||ad<=bd));
}

export default async function handler(req,res){
 if(!requireAuthenticated(req,res)) return;
 try{
  const repo=createRepository(),org=String((req.headers||{})['x-org-id']||'ORG:SYN-001');
  if(req.method==='GET'){
   const u=new URL(req.url,'https://local'),id=u.searchParams.get('documentId')||'',db=await repo.all(),docsArr=(db.documents||[]).filter(d=>d.organizationId===org),docs=new Map(docsArr.map(d=>[d.id,d]));
   const repairs=(db.documentRelations||[]).filter(r=>r.organizationId===org&&r.status!=='deleted'&&looksLegacyReversedLegalRelation(r,docs)).map(r=>r.id);
   if(repairs.length){await repo.mutate(state=>{for(const r of (state.documentRelations||[])){if(!repairs.includes(r.id))continue;const x=r.sourceDocumentRef;r.sourceDocumentRef=r.targetDocumentRef;r.targetDocumentRef=x;r.legacyOrientationRepairedAt=now();r.legacyOrientationRepairReason='legacy-reversed-legal-relation';}});const refreshed=await repo.all();db.documentRelations=refreshed.documentRelations||[];}
   const rels=(db.documentRelations||[]).filter(r=>r.organizationId===org&&r.status!=='deleted');
   if(!docs.has(id))return send(res,404,{message:'سند پیدا نشد.'});
   const items=rels.filter(r=>r.sourceDocumentRef===id||r.targetDocumentRef===id).map(r=>{
    const from=r.sourceDocumentRef===id,pt=from?r.relationType:inverse(r.relationType),other=from?r.targetDocumentRef:r.sourceDocumentRef,d=docs.get(other);
    return d?{...r,changeItems:Array.isArray(r.changeItems)?r.changeItems:normalizeItems(r),perspectiveType:pt,label:labels[pt]||pt,
      relatedDocument:{id:d.id,title:d.title,documentNumber:d.documentNumber||null,issuer:d.issuer||null,issuedAt:d.issuedAt||null,promulgationDate:d.promulgationDate||null}}:null
   }).filter(Boolean);
   const incoming=items.filter(x=>['amended_by','superseded_by','repealed_by','extended_by','clarified_by','implemented_by'].includes(x.perspectiveType));
   const statusLabel=items.some(x=>x.perspectiveType==='repealed_by')?'ملغی‌شده':items.some(x=>x.perspectiveType==='superseded_by')?'جایگزین‌شده':incoming.length?'معتبر با اصلاحات':'بدون اصلاحیه ثبت‌شده';
   return send(res,200,{items,summary:{total:items.length,statusLabel,latestChange:incoming[0]?{title:incoming[0].relatedDocument.title}:null}});
  }
  if(req.method==='POST'){
   const b=parseBody(req),current=String(b.documentId||''),related=String(b.relatedDocumentId||''),type=String(b.relationType||'amends');
   if(!current||!related||current===related)return send(res,400,{message:'دو سند متفاوت برای ثبت ارتباط لازم است.'});
   if(!['amends','repeals','clarifies','amended_by','repealed_by','clarified_by','supersedes','superseded_by','extends','extended_by','implements','implemented_by','related_to'].includes(type))return send(res,400,{message:'نوع ارتباط نامعتبر است.'});
   const db=await repo.all(),docs=(db.documents||[]).filter(d=>d.organizationId===org);
   if(!docs.some(d=>d.id===current)||!docs.some(d=>d.id===related))return send(res,404,{message:'یکی از اسناد مرتبط پیدا نشد.'});
   const c=canonical(current,related,type),changeItems=normalizeItems(b);let relation;
   const requestedRelationId=String(b.relationId||'').trim(),clientRelationKey=String(b.clientRelationKey||'').trim(),signature=relationSignature(org,c,changeItems,b);
   await repo.mutate(state=>{
     state.documentRelations=Array.isArray(state.documentRelations)?state.documentRelations:[];
     let existing=requestedRelationId?state.documentRelations.find(r=>r.id===requestedRelationId&&r.organizationId===org&&r.status!=='deleted'):null;
     if(!existing&&clientRelationKey)existing=state.documentRelations.find(r=>r.organizationId===org&&r.status!=='deleted'&&r.clientRelationKey===clientRelationKey);
     if(!existing)existing=state.documentRelations.find(r=>r.organizationId===org&&r.status!=='deleted'&&r.signature===signature);
     if(existing){
       existing.sourceDocumentRef=c.source;existing.targetDocumentRef=c.target;existing.relationType=c.type;existing.changeType=String(b.changeType||existing.changeType||'').trim()||null;existing.note=String(b.note||changeItems[0]?.description||existing.note||'').trim()||null;existing.effectiveFrom=String(b.effectiveFrom||existing.effectiveFrom||'').trim()||null;existing.changeItems=changeItems;existing.targetArticle=changeItems[0]?.article||null;existing.targetClause=changeItems[0]?.clause||null;existing.signature=signature;if(clientRelationKey)existing.clientRelationKey=clientRelationKey;existing.updatedAt=now();relation=existing;return;
     }
     relation={id:rid(),organizationId:org,sourceDocumentRef:c.source,targetDocumentRef:c.target,relationType:c.type,targetArticle:changeItems[0]?.article||canonicalArticle(b.targetArticle||'')||null,targetClause:changeItems[0]?.clause||canonicalClause(b.targetClause||'')||null,targetSection:String(b.targetSection||'').trim()||null,changeType:String(b.changeType||'').trim()||null,changeItems,effectiveFrom:String(b.effectiveFrom||'').trim()||null,note:String(b.note||changeItems[0]?.description||'').trim()||null,clientRelationKey:clientRelationKey||null,signature,status:'active',createdAt:now()};state.documentRelations.push(relation);
   });
   return send(res,201,{ok:true,relation});
  }
  if(req.method==='DELETE'){
   const b=parseBody(req),id=String(b.relationId||'');let found=false;
   await repo.mutate(s=>{s.documentRelations=Array.isArray(s.documentRelations)?s.documentRelations:[];const r=s.documentRelations.find(x=>x.id===id&&x.organizationId===org&&x.status!=='deleted');if(r){r.status='deleted';r.deletedAt=now();found=true}});
   return found?send(res,200,{ok:true}):send(res,404,{message:'ارتباط پیدا نشد.'});
  }
  return send(res,405,{message:'Method not allowed'});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطای داخلی'})}
}
