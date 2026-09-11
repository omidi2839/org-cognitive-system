(()=>{
window.__DOCUMENT_REGISTRATION_COMMIT_BUILD__='0.9.9.0.6';
const ORG='ORG:SYN-001';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base64=async file=>{
 const ab=await file.arrayBuffer(),u=new Uint8Array(ab);let bin='';const step=0x8000;
 for(let i=0;i<u.length;i+=step)bin+=String.fromCharCode(...u.subarray(i,i+step));
 return btoa(bin);
};
const parseJson=async r=>{try{return await r.clone().json()}catch{return{}}};
const requestId=()=>crypto?.randomUUID?.()||`REG-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function currentRelation(form){const box=form?.querySelector('.k94relationentry');if(!box)return null;const relationType=box.querySelector('[data-reltype]')?.value||'',relatedDocumentId=box.querySelector('[data-reldoc]')?.value||'';if(!relationType||!relatedDocumentId)return null;const changeItems=[...box.querySelectorAll('[data-change-item]')].map(x=>({article:x.querySelector('[data-change-article]')?.value.trim()||'',clause:x.querySelector('[data-change-clause]')?.value.trim()||'',description:x.querySelector('[data-change-description]')?.value.trim()||''})).filter(x=>x.article||x.clause||x.description);if(!changeItems.length)return null;const first=changeItems[0];return{clientRelationKey:box.dataset.k990CurrentRelationKey||(box.dataset.k990CurrentRelationKey=crypto?.randomUUID?.()||`REL-${Date.now()}`),relationType,relatedDocumentId,changeType:({amends:'اصلاح متن',extends:'الحاق',repeals:'لغو',clarifies:'تفسیر/توضیح'})[relationType]||'',targetArticle:first.article||'',targetClause:first.clause||'',note:first.description||'',changeItems}}
function formRelations(form){const drafts=(form?.__k990RelationDrafts||[]).map(r=>{const f=r.changeItems?.[0]||{};return{...r,changeType:({amends:'اصلاح متن',extends:'الحاق',repeals:'لغو',clarifies:'تفسیر/توضیح'})[r.relationType]||'',targetArticle:f.article||'',targetClause:f.clause||'',note:f.description||''}});const c=currentRelation(form);return c?[...drafts,c]:drafts}

function filesOf(form){
 const primary=form?.querySelector('input[type="file"][name="file"]')?.files?.[0]||null;
 const attachments=[...form?.querySelectorAll?.('[data-k985-attachment-input],[data-k985-attachments]')||[]].flatMap(x=>[...(x.files||[])]);
 return{primary,attachments};
}
function blobProblem(r,d){
 const m=String(d?.message||'')+' '+String(d?.code||'');
 return r?.status===404||/blob object was not found|BLOB_.*NOT_FOUND|محتوای.*پیدا نشد/i.test(m);
}
async function toServerPayload(original,form){
 const b=JSON.parse(original);
 const {primary,attachments}=filesOf(form);
 let used=0,limit=2600000;
 if(primary){
   if(primary.size>limit)throw new Error('فایل اصلی برای مسیر جایگزین مستقیم بزرگ است.');
   b.fileName=primary.name;b.mimeType=primary.type||'application/octet-stream';b.size=primary.size;
   b.contentBase64=await base64(primary);delete b.blobUrl;delete b.blobPathname;b.directUpload=false;b.transport='function-recovery-v2';used+=primary.size;
 }
 if(attachments.length){
   b.attachments=[];
   for(const f of attachments){
     if(used+f.size>limit)throw new Error('مجموع فایل‌ها برای مسیر بازیابی مستقیم بزرگ است.');
     b.attachments.push({fileName:f.name,mimeType:f.type||'application/octet-stream',size:f.size,contentBase64:await base64(f),directUpload:false,transport:'function-recovery-v2'});
     used+=f.size;
   }
 }
 return JSON.stringify(b);
}

let inflight=false;
const prev=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 const url=typeof input==='string'?input:(input?.url||'');
 if(!url.includes('/api/v1/documents/upload')||init?.method!=='POST'||typeof init.body!=='string'){
   return prev(input,init);
 }
 const form=document.querySelector('#k76form');
 if(!form)return prev(input,init);

 // One click = one logical registration. Repeated clicks cannot create parallel requests.
 if(inflight)throw new Error('ثبت سند در حال انجام است؛ تا پایان همین درخواست صبر کنید.');
 inflight=true;
 const originalBody=init.body;
 let bodyObj={};try{bodyObj=JSON.parse(originalBody)}catch{}
 const rid=bodyObj.clientRequestId||form.dataset.k9902RequestId||requestId();
 form.dataset.k9902RequestId=rid;
 bodyObj.clientRequestId=rid;
 let response,detail={};

 try{
   // First attempt uses the transport already prepared by the previous layer.
   response=await prev(input,{...init,body:JSON.stringify(bodyObj)});
   detail=await parseJson(response);

   // If Blob reference vanished after a direct upload, automatically retry once through
   // same-origin base64 for document sets that fit safely under the Function limit.
   if(!response.ok&&blobProblem(response,detail)){
     try{
       const recoveryBody=await toServerPayload(originalBody,form);
       const rb=JSON.parse(recoveryBody);rb.clientRequestId=rid;
       await sleep(180);
       response=await prev(input,{...init,body:JSON.stringify(rb)});
       detail=await parseJson(response);
     }catch(recoveryErr){
       console.warn('UPLOAD_RECOVERY_SKIPPED',recoveryErr?.message||recoveryErr);
     }
   }

   // One short retry for a transient server/network reset. Idempotency key remains the same.
   if(!response?.ok && [408,429,502,503,504].includes(response?.status||0)){
     await sleep(650);
     response=await prev(input,{...init,body:JSON.stringify(bodyObj)});
     detail=await parseJson(response);
   }

   if(response?.ok){
     const newId=detail?.document?.id||detail?.id||'';
     const relations=formRelations(form);
     if(newId&&relations.length){
       // Let any legacy relation POST finish first, then deterministically upsert the complete
       // explicit locator/text payload. Backend de-duplicates the same source-target-type.
       setTimeout(async()=>{try{for(const rel of relations){await prev('/api/v1/knowledge/document-relations',{method:'POST',headers:{'content-type':'application/json','x-org-id':ORG},body:JSON.stringify({documentId:newId,...rel})})}form.__k990RelationDrafts=[];document.dispatchEvent(new CustomEvent('k9902:relations-committed',{detail:{documentId:newId,count:relations.length}}))}catch(e){console.error('EXPLICIT_RELATIONS_COMMIT_FAILED',e)}},900);
     }
     delete form.dataset.k9902RequestId;
   }
   return response;
 }finally{
   inflight=false;
 }
};
})();