import { normalizePersianText } from '../src/processing/parser.js';
const compact=s=>String(s||'').replace(/[\u200c\u200d\s]+/g,' ').trim();
const norm=s=>compact(s).replace(/[يى]/g,'ی').replace(/ك/g,'ک').toLowerCase();

const matchInfo=(text,q,limit=12)=>{
 const t=compact(text),n=norm(t),needle=norm(q);
 if(!needle)return {count:0,snippets:[]};
 const positions=[];
 let from=0;
 while(from<=n.length-needle.length){
   const i=n.indexOf(needle,from);
   if(i<0)break;
   positions.push(i);
   from=i+Math.max(needle.length,1);
 }
 const snippets=positions.slice(0,limit).map(i=>{
   const start=Math.max(0,i-90),end=Math.min(t.length,i+needle.length+140);
   return `${start>0?'…':''}${t.slice(start,end)}${end<t.length?'…':''}`;
 });
 return {count:positions.length,snippets};
};

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

export async function buildDocumentBankResponse(req,repository){
 const u=new URL(req.url,'https://local'),
 q=u.searchParams.get('q')||'',
 documentClass=u.searchParams.get('documentClass')||'',
 validity=u.searchParams.get('validity')||'',
 classification=u.searchParams.get('classification')||'',
 issuer=u.searchParams.get('issuer')||'',
 subject=u.searchParams.get('subject')||'',
 from=u.searchParams.get('from')||'',
 to=u.searchParams.get('to')||'',
 documentId=u.searchParams.get('documentId')||'',
 detail=u.searchParams.get('detail')==='1',
 snippetLimit=Math.min(20,Math.max(1,Number(u.searchParams.get('snippetLimit')||12)||12));

 const org=String(req.headers['x-org-id']||'ORG:SYN-001');
 const db=await repository.all();
 const normalized=Array.isArray(db.normalizedDocuments)?db.normalizedDocuments:[];
 const textByDoc=new Map();
 for(const n of normalized.filter(x=>x.organizationId===org)){
   const id=n.documentRef||n.documentId;
   if(id&&!textByDoc.has(id))textByDoc.set(id,normalizePersianText(n.text||''));
 }
 const all=(db.documents||[]).filter(d=>
   d.organizationId===org &&
   ['upstream','general'].includes(d.documentClass) &&
   (!documentId || d.id===documentId)
 );
 const authorized=all.filter(d=>canSee(d,req));
 const filtered=authorized.filter(d=>{
   if(documentClass&&d.documentClass!==documentClass)return false;
   if(validity&&d.validityStatus!==validity)return false;
   if(classification&&d.classification!==classification)return false;
   if(issuer&&!norm(d.issuer).includes(norm(issuer)))return false;
   if(subject&&!norm(d.subjectArea).includes(norm(subject)))return false;
   const date=String(d.issuedAt||d.createdAt||'').slice(0,10);
   if(from&&date&&date<from)return false;
   if(to&&date&&date>to)return false;
   if(q){
     const hay=[d.title,d.documentType,d.subjectArea,d.issuer,d.organizationalUnitName,d.sourceFileName,textByDoc.get(d.id)].map(norm).join(' ');
     if(!hay.includes(norm(q)))return false;
   }
   return true;
 }).map(d=>{
   const mi=q?matchInfo(textByDoc.get(d.id),q,snippetLimit):{count:0,snippets:[]};
   const metadataMatch=q&&[
     d.title,d.documentType,d.subjectArea,d.issuer,d.organizationalUnitName,d.sourceFileName
   ].some(v=>norm(v).includes(norm(q)));
   return {
     id:d.id,title:d.title,documentClass:d.documentClass,documentType:d.documentType||null,
     issuer:d.issuer||null,subjectArea:d.subjectArea||null,issuedAt:d.issuedAt||null,
     validUntil:d.validUntil||null,validityStatus:d.validityStatus||'unknown',
     classification:d.classification||'internal',organizationalUnitRef:d.organizationalUnitRef||null,
     organizationalUnitName:d.organizationalUnitName||null,version:d.version||1,
     createdAt:d.createdAt||null,
     matchCount:mi.count,
     matchSnippets:mi.snippets,
     matchSnippet:mi.snippets[0]||null,
     metadataMatch:Boolean(metadataMatch),
     returnedSnippetCount:mi.snippets.length,
     fullText:detail?String(textByDoc.get(d.id)||d.content||''):undefined
   };
 });
 filtered.sort((a,b)=>{
   if(q&&b.matchCount!==a.matchCount)return b.matchCount-a.matchCount;
   return String(b.issuedAt||b.createdAt||'').localeCompare(String(a.issuedAt||a.createdAt||''));
 });
 const totalOccurrences=q?filtered.reduce((sum,d)=>sum+(d.matchCount||0),0):0;
 const metadataMatches=q?filtered.filter(d=>d.metadataMatch).length:0;
 return {
   summary:{total:all.length,authorized:authorized.length,visible:filtered.length,totalOccurrences,metadataMatches},
   filters:{q,documentClass,validity,classification,issuer,subject,from,to,documentId,detail,snippetLimit},
   items:filtered
 };
}


export async function renormalizeDocumentBank(req,repository){
 const org=String(req.headers['x-org-id']||'ORG:SYN-001');
 let changed=0,total=0;
 await repository.mutate(db=>{
   const rows=Array.isArray(db.normalizedDocuments)?db.normalizedDocuments:[];
   for(const n of rows.filter(x=>x.organizationId===org)){
     total++;
     const before=String(n.text||'');
     const after=normalizePersianText(before);
     if(after!==before){n.text=after;changed++;}
     if(Array.isArray(n.units)){
       n.units=n.units.map(u=>({...u,text:normalizePersianText(u.text||'')})).filter(u=>u.text);
     }
     n.normalizationProfile='fa-v1';
     n.renormalizedAt=new Date().toISOString();
   }
 });
 return {ok:true,total,changed,profile:'fa-v1'};
}
