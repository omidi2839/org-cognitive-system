(()=>{
window.__DOCUMENT_REGISTRATION_COMMIT_BUILD__='0.9.9.0.23';
const ORG='ORG:SYN-001';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
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

// Preserve the complete transport/metadata chain installed before this hotfix.
const prev=window.fetch.bind(window);
let inflight=false;

async function uploadOnce(input,init,form,rid){
 const originalBody=init.body;
 let bodyObj={};try{bodyObj=JSON.parse(originalBody)}catch{}
 bodyObj.clientRequestId=rid;
 let response=await prev(input,{...init,body:JSON.stringify(bodyObj)});
 let detail=await parseJson(response);

 // If a direct Blob reference was not readable, recover inside the SAME click.
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

 // Retry transient network/server resets without requiring a second user click.
 if(!response?.ok&&[408,425,429,500,502,503,504].includes(response?.status||0)){
   await sleep(700);
   response=await prev(input,{...init,body:JSON.stringify(bodyObj)});
   detail=await parseJson(response);
 }
 return {response,detail};
}

async function commitRelations(form,newId){
 const relations=formRelations(form);
 if(!newId||!relations.length)return 0;
 for(const rel of relations){
   const r=await prev('/api/v1/knowledge/document-relations',{method:'POST',headers:{'content-type':'application/json','x-org-id':ORG},body:JSON.stringify({documentId:newId,...rel})});
   const d=await parseJson(r);
   if(!r.ok)throw new Error(d.message||'ثبت ارتباط حقوقی سند ناموفق بود.');
 }
 form.__k990RelationDrafts=[];
 document.dispatchEvent(new CustomEvent('k9902:relations-committed',{detail:{documentId:newId,count:relations.length}}));
 return relations.length;
}

function buildInitialPayload(form){
 const f=new FormData(form),file=f.get('file');
 const unitSel=form.querySelector('#k76unitSelect'),unitName=unitSel?.selectedOptions?.[0]?.dataset?.name||null;
 const up=(f.get('scopeType')!==null)||/بالادستی/.test(form.closest('#knowledge076')?.textContent||'');
 const metadata={
   documentClass:up?'upstream':'general',
   documentType:f.get('documentType'),issuer:f.get('issuer'),versionLabel:f.get('versionLabel'),
   issuedAt:f.get('issuedAt'),validUntil:f.get('validUntil'),validityStatus:f.get('validityStatus'),
   organizationalLevel:up?(f.get('scopeType')==='organization'?'کل سازمان':'واحد سازمانی'):f.get('organizationalLevel'),
   scopeType:up?f.get('scopeType'):null,
   organizationalUnitRef:up&&f.get('scopeType')==='unit'?f.get('organizationalUnitRef'):null,
   organizationalUnitName:up&&f.get('scopeType')==='unit'?unitName:null,
   subjectArea:f.get('subjectArea')
 };
 return {title:f.get('title'),fileName:file?.name||'',mimeType:file?.type||'application/octet-stream',classification:f.get('classification'),knowledgeZone:'organizational',metadata};
}

function k9921SyncLegacyLegalChange(form){
 const box=form?.querySelector('.k94relationentry');if(!box)return;
 const t=box.querySelector('[data-reltype]')?.value||'';
 const map={amends:'اصلاح متن',extends:'الحاق',repeals:'لغو',clarifies:'تفسیر/توضیح'};
 const v=map[t]||'',el=box.querySelector('[data-relchange]');
 if(el){
   el.required=false;el.removeAttribute('required');
   if(v&&el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v)){
     const op=document.createElement('option');op.value=v;op.textContent=v;op.dataset.k9921Compat='1';el.appendChild(op);
   }
   if(v){el.value=v;try{el.setAttribute('value',v)}catch{}}
 }
}
function validateRegistration(form,st){
 if(!form.reportValidity())return false;
 const f=new FormData(form),file=f.get('file');
 if(!(file instanceof File)||!file.name){st.textContent='انتخاب فایل اصلی الزامی است.';return false}
 if(f.get('scopeType')==='unit'&&!f.get('organizationalUnitRef')){st.textContent='برای دامنه «واحد سازمانی»، انتخاب واحد الزامی است.';return false}
 const relBox=form.querySelector('.k94relationentry');
 const relType=relBox?.querySelector('[data-reltype]')?.value||'';
 if(relType){
   const related=relBox.querySelector('[data-reldoc]')?.value||'';
   if(!related){st.textContent='برای ارتباط حقوقی، انتخاب سند مرتبط الزامی است.';return false}
   const bad=[...relBox.querySelectorAll('[data-change-item]')].some(x=>!(x.querySelector('[data-change-article]')?.value.trim())||!(x.querySelector('[data-change-description]')?.value.trim()));
   if(bad){st.textContent='برای هر اثر حقوقی، شماره ماده و متن کامل اثر حقوقی الزامی است.';return false}
 }
 return true;
}

function installOneClick(form){
 if(!form||form.dataset.k9907OneClick==='1')return;
 form.dataset.k9907OneClick='1';
 form.addEventListener('submit',async e=>{
   // Earlier legal-contract validation listeners get the first chance. Once execution reaches
   // here, take ownership of the whole registration so the legacy handler cannot require a second click.
   e.preventDefault();e.stopImmediatePropagation();
   const st=form.querySelector('#k76status');
   const btn=form.querySelector('button.k76primary');
   if(!st||!btn)return;
   if(form.__k9907Submitting)return;
   if(!validateRegistration(form,st))return;

   form.__k9907Submitting=true;
   inflight=true;
   btn.disabled=true;btn.dataset.k958Busy='1';btn.textContent='در حال ثبت سند…';
   st.className='k957working';st.textContent='در حال آماده‌سازی، ارسال و ثبت سند…';

   const rid=form.dataset.k9902RequestId||requestId();
   form.dataset.k9902RequestId=rid;
   try{
     const payload=buildInitialPayload(form);payload.clientRequestId=rid;
     const {response,detail}=await uploadOnce('/api/v1/documents/upload',{method:'POST',headers:{'content-type':'application/json','x-org-id':ORG},body:JSON.stringify(payload)},form,rid);
     if(!response?.ok)throw new Error(detail?.message||`ثبت سند ناموفق بود (${response?.status||'خطای ارتباط'}).`);

     const newId=detail?.document?.id||detail?.id||'';
     if(!newId)throw new Error('سند ذخیره شد اما شناسه نهایی از سرور دریافت نشد؛ برای جلوگیری از ثبت تکراری دوباره کلیک نکنید و صفحه را تازه‌سازی کنید.');

     // Relation commit is part of the same logical transaction from the user's perspective.
     const relationCount=await commitRelations(form,newId);
     delete form.dataset.k9902RequestId;
     st.className='k957ok';
     st.innerHTML=`<b>سند با موفقیت ثبت شد.</b>${relationCount?`<br>تعداد ارتباط حقوقی ثبت‌شده: ${esc(relationCount)}`:''}`;
     document.dispatchEvent(new CustomEvent('k9907:document-registered',{detail:{documentId:newId,relationCount}}));
   }catch(err){
     st.className='k957err';st.textContent=err?.message||'در ثبت سند مشکلی به وجود آمد.';
     console.error('ONE_CLICK_DOCUMENT_REGISTRATION_FAILED',err);
   }finally{
     inflight=false;form.__k9907Submitting=false;
     btn.disabled=false;btn.dataset.k958Busy='0';btn.textContent='ثبت سند';
   }
 },true);
}

function observeForms(){
 const run=()=>document.querySelectorAll('#k76form').forEach(installOneClick);
 new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
 run();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeForms,{once:true});else observeForms();

// Keep idempotency/recovery protection for any legacy code path that still calls the upload endpoint
// without going through the one-click form handler (for example future reuse of the registration API).
window.fetch=async function(input,init={}){
 const url=typeof input==='string'?input:(input?.url||'');
 if(!url.includes('/api/v1/documents/upload')||init?.method!=='POST'||typeof init.body!=='string')return prev(input,init);
 const form=document.querySelector('#k76form');
 if(!form||form.__k9907Submitting)return prev(input,init);
 if(inflight)throw new Error('ثبت سند در حال انجام است؛ تا پایان همین درخواست صبر کنید.');
 inflight=true;
 let bodyObj={};try{bodyObj=JSON.parse(init.body)}catch{}
 const rid=bodyObj.clientRequestId||form.dataset.k9902RequestId||requestId();
 form.dataset.k9902RequestId=rid;
 try{
   const {response,detail}=await uploadOnce(input,{...init,body:JSON.stringify(bodyObj)},form,rid);
   if(response?.ok){
     const newId=detail?.document?.id||detail?.id||'';
     if(newId)await commitRelations(form,newId);
     delete form.dataset.k9902RequestId;
   }
   return response;
 }finally{inflight=false}
};
})();
