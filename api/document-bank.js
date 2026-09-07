import { createRepository } from '../src/infrastructure/repositoryFactory.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const norm=s=>String(s||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const clip=(text,q)=>{const t=String(text||'').replace(/\s+/g,' ').trim(),n=norm(t),needle=norm(q);if(!needle)return null;const i=n.indexOf(needle);if(i<0)return null;return `${i>70?'…':''}${t.slice(Math.max(0,i-70),Math.min(t.length,i+needle.length+110))}${i+needle.length+110<t.length?'…':''}`};
function canSee(doc,req){
 const requested=String(req.headers['x-document-scope']||'organization');
 const person=String(req.headers['x-person-id']||'PER:DEMO');
 const unit=String(req.headers['x-unit-id']||'');
 const clearance=String(req.headers['x-clearance']||'confidential');
 const rank={public:0,internal:1,confidential:2,secret:3};
 if((rank[doc.classification||'internal']??1)>(rank[clearance]??2))return false;
 if(requested==='own')return !doc.ownerPersonRef||doc.ownerPersonRef===person;
 if(requested==='unit')return !doc.organizationalUnitRef||doc.organizationalUnitRef===unit;
 return true;
}
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{code:'METHOD_NOT_ALLOWED',message:'روش درخواست مجاز نیست.'});
 try{
  const u=new URL(req.url,'https://local'),q=u.searchParams.get('q')||'',documentClass=u.searchParams.get('documentClass')||'',validity=u.searchParams.get('validity')||'',classification=u.searchParams.get('classification')||'',issuer=u.searchParams.get('issuer')||'',subject=u.searchParams.get('subject')||'',from=u.searchParams.get('from')||'',to=u.searchParams.get('to')||'';
  const org=String(req.headers['x-org-id']||'ORG:SYN-001'),repo=createRepository(),db=await repo.all();
  const normalized=Array.isArray(db.normalizedDocuments)?db.normalizedDocuments:[];
  const textByDoc=new Map();for(const n of normalized.filter(x=>x.organizationId===org)){const id=n.documentRef||n.documentId;if(id&&!textByDoc.has(id))textByDoc.set(id,n.text||'')}
  const all=(db.documents||[]).filter(d=>d.organizationId===org&&['upstream','general'].includes(d.documentClass));
  const authorized=all.filter(d=>canSee(d,req));
  const filtered=authorized.filter(d=>{
    if(documentClass&&d.documentClass!==documentClass)return false;if(validity&&d.validityStatus!==validity)return false;if(classification&&d.classification!==classification)return false;
    if(issuer&&!norm(d.issuer).includes(norm(issuer)))return false;if(subject&&!norm(d.subjectArea).includes(norm(subject)))return false;
    const date=String(d.issuedAt||d.createdAt||'').slice(0,10);if(from&&date&&date<from)return false;if(to&&date&&date>to)return false;
    if(q){const hay=[d.title,d.documentType,d.subjectArea,d.issuer,d.organizationalUnitName,d.sourceFileName,textByDoc.get(d.id)].map(norm).join(' ');if(!hay.includes(norm(q)))return false}
    return true;
  }).map(d=>({id:d.id,title:d.title,documentClass:d.documentClass,documentType:d.documentType||null,issuer:d.issuer||null,subjectArea:d.subjectArea||null,issuedAt:d.issuedAt||null,validUntil:d.validUntil||null,validityStatus:d.validityStatus||'unknown',classification:d.classification||'internal',organizationalUnitRef:d.organizationalUnitRef||null,organizationalUnitName:d.organizationalUnitName||null,version:d.version||1,createdAt:d.createdAt||null,matchSnippet:q?clip(textByDoc.get(d.id),q):null}));
  filtered.sort((a,b)=>String(b.issuedAt||b.createdAt||'').localeCompare(String(a.issuedAt||a.createdAt||'')));
  return send(res,200,{summary:{total:all.length,authorized:authorized.length,visible:filtered.length},filters:{q,documentClass,validity,classification,issuer,subject,from,to},items:filtered});
 }catch(e){console.error(e);return send(res,500,{code:'DOCUMENT_BANK_ERROR',message:e.message||'خطا در بانک اسناد'})}
}
