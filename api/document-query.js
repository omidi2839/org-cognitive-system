import { createRepository } from '../src/infrastructure/repositoryFactory.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const norm=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const digits=s=>String(s??'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const excerpt=(text,q)=>{const raw=String(text||'').replace(/\s+/g,' ').trim();if(!raw)return'';if(!q)return raw.slice(0,420);const n=norm(raw),k=norm(q),i=n.indexOf(k);if(i<0)return raw.slice(0,420);const a=Math.max(0,i-140),b=Math.min(raw.length,i+k.length+260);return(a?'…':'')+raw.slice(a,b)+(b<raw.length?'…':'')};
export default async function handler(req,res){try{
 if(req.method!=='GET')return send(res,405,{message:'Method not allowed'});
 const repo=createRepository(),org=String(req.headers['x-org-id']||'ORG:SYN-001'),u=new URL(req.url,'https://local'),q=u.searchParams.get('q')||'',meetingNumber=digits(u.searchParams.get('meetingNumber')||'');
 const db=await repo.all(),docs=(db.documents||[]).filter(d=>d.organizationId===org),normalized=(db.normalizedDocuments||[]).filter(x=>x.organizationId===org),textByDoc=new Map(normalized.map(x=>[x.documentRef||x.documentId,String(x.text||x.content||'')]));
 const nq=norm(q);let items=docs.map(d=>{const md=d.canonicalMetadata||d.metadata||{},text=textByDoc.get(d.id)||d.content||'';return{d,md,text,hay:norm([d.title,md.documentType,md.subjectArea,md.issuer,text].filter(Boolean).join(' '))}});
 if(nq)items=items.filter(x=>x.hay.includes(nq)||nq.split(' ').filter(Boolean).every(t=>x.hay.includes(t)));if(meetingNumber)items=items.filter(x=>digits(x.md.meetingNumber||'')===meetingNumber);
 items=items.slice(0,30).map(({d,md,text})=>({id:d.id,title:d.title,documentType:md.documentType||null,subjectArea:md.subjectArea||null,issuer:md.issuer||null,issuedAt:md.issuedAt||d.createdAt||null,meetingNumber:md.meetingNumber||null,meetingDate:md.meetingDate||null,meetingRef:md.meetingRef||null,excerpt:excerpt(text,q)}));
 return send(res,200,{items,summary:{total:items.length,query:q||null,meetingNumber:meetingNumber||null}});
}catch(e){console.error(e);return send(res,400,{message:e.message||'خطای جستجوی اسناد'})}}