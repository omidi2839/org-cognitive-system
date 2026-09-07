import { normalizePersianText } from '../src/processing/parser.js';

const compact=s=>String(s||'').replace(/[\u200c\u200d\s]+/g,' ').trim();
const norm=s=>compact(s).replace(/[يى]/g,'ی').replace(/ك/g,'ک').toLowerCase();
const now=()=>new Date().toISOString();
const relId=()=>`DREL:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,9)}`;

const relationLabels={
 amends:'اصلاح‌کننده',
 amended_by:'اصلاح‌شده توسط',
 supersedes:'جایگزین‌کننده',
 superseded_by:'جایگزین‌شده توسط',
 repeals:'لغوکننده',
 repealed_by:'لغوشده توسط',
 extends:'تمدید/توسعه‌دهنده',
 extended_by:'تمدید/توسعه‌یافته توسط',
 clarifies:'تبیین/تفسیرکننده',
 clarified_by:'تبیین‌شده توسط',
 implements:'سند اجرایی',
 implemented_by:'دارای سند اجرایی',
 related_to:'سند مرتبط'
};

const inverseType=t=>({
 amends:'amended_by', amended_by:'amends',
 supersedes:'superseded_by', superseded_by:'supersedes',
 repeals:'repealed_by', repealed_by:'repeals',
 extends:'extended_by', extended_by:'extends',
 clarifies:'clarified_by', clarified_by:'clarifies',
 implements:'implemented_by', implemented_by:'implements',
 related_to:'related_to'
})[t]||'related_to';

const canonicalDirection=(currentId,relatedId,perspectiveType)=>{
 const inverseFirst=new Set(['amended_by','superseded_by','repealed_by','extended_by','clarified_by','implemented_by']);
 if(inverseFirst.has(perspectiveType)){
   return {sourceDocumentRef:relatedId,targetDocumentRef:currentId,relationType:inverseType(perspectiveType)};
 }
 return {sourceDocumentRef:currentId,targetDocumentRef:relatedId,relationType:perspectiveType};
};

const matchInfo=(text,q,limit=12)=>{
 const t=compact(text),n=norm(t),needle=norm(q);
 if(!needle)return {count:0,snippets:[]};
 const positions=[]; let from=0;
 while(from<=n.length-needle.length){
   const i=n.indexOf(needle,from); if(i<0)break;
   positions.push(i); from=i+Math.max(needle.length,1);
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

function relationViewFor(docId,relations,docById){
 const out=[];
 for(const r of relations){
   if(r.status==='deleted')continue;
   let perspectiveType=null,relatedId=null;
   if(r.sourceDocumentRef===docId){perspectiveType=r.relationType;relatedId=r.targetDocumentRef;}
   else if(r.targetDocumentRef===docId){perspectiveType=inverseType(r.relationType);relatedId=r.sourceDocumentRef;}
   else continue;
   const d=docById.get(relatedId);
   if(!d)continue;
   out.push({
     id:r.id,
     perspectiveType,
     label:relationLabels[perspectiveType]||perspectiveType,
     canonicalType:r.relationType,
     relatedDocument:{
       id:d.id,title:d.title||'بدون عنوان',documentType:d.documentType||null,
       issuer:d.issuer||null,issuedAt:d.issuedAt||null,validityStatus:d.validityStatus||'unknown',
       version:d.version||1
     },
     targetLocator:r.targetLocator||null,
     changeType:r.changeType||null,
     effectiveFrom:r.effectiveFrom||null,
     effectiveTo:r.effectiveTo||null,
     legalEffect:r.legalEffect||null,
     note:r.note||null,
     evidence:r.evidence||null,
     confidence:r.confidence??1,
     createdAt:r.createdAt||null
   });
 }
 return out.sort((a,b)=>String(b.effectiveFrom||b.relatedDocument.issuedAt||b.createdAt||'').localeCompare(String(a.effectiveFrom||a.relatedDocument.issuedAt||a.createdAt||'')));
}

const amendmentTypes=new Set(['amended_by','superseded_by','repealed_by','extended_by']);
function relationSummary(view){
 const amendments=view.filter(x=>amendmentTypes.has(x.perspectiveType));
 const outgoing=view.filter(x=>['amends','supersedes','repeals','extends'].includes(x.perspectiveType));
 const latest=amendments[0]||null;
 return {
   total:view.length,
   incomingChanges:amendments.length,
   outgoingChanges:outgoing.length,
   hasAmendments:amendments.length>0,
   statusLabel:amendments.some(x=>x.perspectiveType==='repealed_by')?'لغوشده':
     amendments.some(x=>x.perspectiveType==='superseded_by')?'جایگزین‌شده':
     amendments.length?'معتبر با اصلاحات':'بدون اصلاحیه ثبت‌شده',
   latestChange:latest?{
     id:latest.id,type:latest.perspectiveType,label:latest.label,
     title:latest.relatedDocument.title,effectiveFrom:latest.effectiveFrom||latest.relatedDocument.issuedAt||null
   }:null
 };
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

 const allOrg=(db.documents||[]).filter(d=>d.organizationId===org&&['upstream','general'].includes(d.documentClass));
 const authorizedAll=allOrg.filter(d=>canSee(d,req));
 const docById=new Map(authorizedAll.map(d=>[d.id,d]));
 const relations=(Array.isArray(db.documentRelations)?db.documentRelations:[]).filter(r=>r.organizationId===org&&r.status!=='deleted');

 const base=(documentId?authorizedAll.filter(d=>d.id===documentId):authorizedAll);
 const filtered=base.filter(d=>{
   if(documentClass&&d.documentClass!==documentClass)return false;
   if(validity&&d.validityStatus!==validity)return false;
   if(classification&&d.classification!==classification)return false;
   if(issuer&&!norm(d.issuer).includes(norm(issuer)))return false;
   if(subject&&!norm(d.subjectArea).includes(norm(subject)))return false;
   const date=String(d.issuedAt||d.createdAt||'').slice(0,10);
   if(from&&date&&date<from)return false;
   if(to&&date&&date>to)return false;
   if(q){
     const rv=relationViewFor(d.id,relations,docById);
     const relatedText=rv.map(x=>[
       x.relatedDocument.title,x.relatedDocument.documentType,x.relatedDocument.issuer,
       x.label,x.targetLocator?.article,x.targetLocator?.clause,x.targetLocator?.section,x.note
     ].join(' ')).join(' ');
     const hay=[d.title,d.documentType,d.subjectArea,d.issuer,d.organizationalUnitName,d.sourceFileName,textByDoc.get(d.id),relatedText].map(norm).join(' ');
     if(!hay.includes(norm(q)))return false;
   }
   return true;
 }).map(d=>{
   const mi=q?matchInfo(textByDoc.get(d.id),q,snippetLimit):{count:0,snippets:[]};
   const metadataMatch=q&&[
     d.title,d.documentType,d.subjectArea,d.issuer,d.organizationalUnitName,d.sourceFileName
   ].some(v=>norm(v).includes(norm(q)));
   const rv=relationViewFor(d.id,relations,docById);
   return {
     id:d.id,title:d.title,documentClass:d.documentClass,documentType:d.documentType||null,
     issuer:d.issuer||null,subjectArea:d.subjectArea||null,issuedAt:d.issuedAt||null,
     validUntil:d.validUntil||null,validityStatus:d.validityStatus||'unknown',
     classification:d.classification||'internal',organizationalUnitRef:d.organizationalUnitRef||null,
     organizationalUnitName:d.organizationalUnitName||null,version:d.version||1,
     createdAt:d.createdAt||null,
     matchCount:mi.count,matchSnippets:mi.snippets,matchSnippet:mi.snippets[0]||null,
     metadataMatch:Boolean(metadataMatch),returnedSnippetCount:mi.snippets.length,
     relationSummary:relationSummary(rv),
     relations:detail?rv:undefined,
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
   summary:{total:allOrg.length,authorized:authorizedAll.length,visible:filtered.length,totalOccurrences,metadataMatches},
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
     if(Array.isArray(n.units))n.units=n.units.map(u=>({...u,text:normalizePersianText(u.text||'')})).filter(u=>u.text);
     n.normalizationProfile='fa-v1'; n.renormalizedAt=now();
   }
 });
 return {ok:true,total,changed,profile:'fa-v1'};
}

export async function handleDocumentBankAction(req,repository){
 const body=req.body||{};
 const action=String(body.action||'');
 if(action==='renormalize-persian')return renormalizeDocumentBank(req,repository);

 const org=String(req.headers['x-org-id']||'ORG:SYN-001');
 const person=String(req.headers['x-person-id']||'PER:DEMO');

 if(action==='create-document-relation'){
   const currentId=String(body.documentId||'');
   const relatedId=String(body.relatedDocumentId||'');
   const perspectiveType=String(body.relationType||'amended_by');
   if(!currentId||!relatedId||currentId===relatedId)throw Object.assign(new Error('دو سند معتبر و متفاوت برای ثبت ارتباط لازم است.'),{code:'DOCUMENT_RELATION_INVALID'});
   if(!relationLabels[perspectiveType])throw Object.assign(new Error('نوع ارتباط سند نامعتبر است.'),{code:'DOCUMENT_RELATION_TYPE_INVALID'});
   const db=await repository.all();
   const docs=(db.documents||[]).filter(d=>d.organizationId===org);
   const current=docs.find(d=>d.id===currentId),related=docs.find(d=>d.id===relatedId);
   if(!current||!related)throw Object.assign(new Error('یکی از اسناد مرتبط پیدا نشد.'),{code:'DOCUMENT_RELATION_DOC_NOT_FOUND'});
   if(!canSee(current,req)||!canSee(related,req))throw Object.assign(new Error('دسترسی ثبت ارتباط برای یکی از اسناد مجاز نیست.'),{code:'DOCUMENT_RELATION_DENIED'});

   const dir=canonicalDirection(currentId,relatedId,perspectiveType);
   let created=null;
   await repository.mutate(state=>{
     state.documentRelations=Array.isArray(state.documentRelations)?state.documentRelations:[];
     const duplicate=state.documentRelations.find(r=>
       r.organizationId===org&&r.status!=='deleted'&&
       r.sourceDocumentRef===dir.sourceDocumentRef&&r.targetDocumentRef===dir.targetDocumentRef&&
       r.relationType===dir.relationType&&
       String(r.targetLocator?.article||'')===String(body.targetArticle||'')&&
       String(r.targetLocator?.clause||'')===String(body.targetClause||'')
     );
     if(duplicate){created=duplicate;return;}
     created={
       id:relId(),organizationId:org,
       sourceDocumentRef:dir.sourceDocumentRef,targetDocumentRef:dir.targetDocumentRef,
       relationType:dir.relationType,
       targetLocator:{
         section:String(body.targetSection||'').trim()||null,
         article:String(body.targetArticle||'').trim()||null,
         clause:String(body.targetClause||'').trim()||null
       },
       changeType:String(body.changeType||'').trim()||null,
       effectiveFrom:String(body.effectiveFrom||'').trim()||null,
       effectiveTo:String(body.effectiveTo||'').trim()||null,
       legalEffect:String(body.legalEffect||'').trim()||null,
       note:String(body.note||'').trim()||null,
       evidence:String(body.evidence||'').trim()||null,
       confidence:1,status:'active',createdAt:now(),createdBy:person
     };
     state.documentRelations.push(created);
   });
   return {ok:true,relation:created};
 }

 if(action==='delete-document-relation'){
   const id=String(body.relationId||'');
   if(!id)throw Object.assign(new Error('شناسه ارتباط الزامی است.'),{code:'DOCUMENT_RELATION_ID_REQUIRED'});
   let found=false;
   await repository.mutate(state=>{
     state.documentRelations=Array.isArray(state.documentRelations)?state.documentRelations:[];
     const r=state.documentRelations.find(x=>x.id===id&&x.organizationId===org&&x.status!=='deleted');
     if(r){r.status='deleted';r.deletedAt=now();r.deletedBy=person;found=true;}
   });
   if(!found)throw Object.assign(new Error('ارتباط سند پیدا نشد.'),{code:'DOCUMENT_RELATION_NOT_FOUND'});
   return {ok:true,relationId:id};
 }

 throw Object.assign(new Error('عملیات بانک اسناد نامعتبر است.'),{code:'DOCUMENT_BANK_ACTION_INVALID'});
}
