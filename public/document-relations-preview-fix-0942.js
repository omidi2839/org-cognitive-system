(()=>{
window.__DOCUMENT_RELATION_PREVIEW_FIX__='0.9.4.2';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,opts={})=>{
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);
 try{
   const r=await fetch(p,{...opts,signal:ctl.signal,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(d.message||'خطا در دریافت اطلاعات سند');
   return d;
 }finally{clearTimeout(t)}
};

function relLoc(r){
 const loc=r.targetLocator||{};
 const article=loc.article||r.targetArticle;
 const clause=loc.clause||r.targetClause;
 const section=loc.section||r.targetSection;
 const p=[];
 if(article)p.push(`ماده ${esc(article)}`);
 if(clause)p.push(`بند/تبصره ${esc(clause)}`);
 if(section)p.push(esc(section));
 return p.join(' · ');
}
function relRow(r){
 const rd=r.relatedDocument||{};
 return `<div class="k94relrow">
   <span class="k94reltype">${esc(r.label||r.perspectiveType||'ارتباط')}</span>
   <button type="button" data-doc-preview="${esc(rd.id||'')}">${esc(rd.title||'بدون عنوان')}</button>
   ${relLoc(r)?`<small>${relLoc(r)}</small>`:''}
   ${r.changeType?`<small>${esc(r.changeType)}</small>`:''}
   ${r.note?`<small>${esc(r.note)}</small>`:''}
 </div>`;
}

async function waitForModalBody(){
 const started=Date.now();
 while(Date.now()-started<7000){
   const body=document.querySelector('#k91docmodal .k91modalbody');
   if(body)return body;
   await new Promise(r=>setTimeout(r,70));
 }
 return null;
}

async function readRelationsFromBank(docId){
 const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(docId)+'&detail=1');
 const x=(d.items||[])[0];
 if(!x)throw Error('سند در بانک اسناد پیدا نشد.');
 return {
   source:'document-bank',
   items:Array.isArray(x.relations)?x.relations:[],
   summary:x.relationSummary||{total:0,statusLabel:'بدون اصلاحیه ثبت‌شده'}
 };
}

async function readRelationsFallback(docId){
 try{
   const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
   return {
     source:'document-relations',
     items:Array.isArray(d.items)?d.items:[],
     summary:d.summary||{total:0,statusLabel:'بدون اصلاحیه ثبت‌شده'}
   };
 }catch{return null}
}

async function renderFor(docId){
 const body=await waitForModalBody();
 if(!body)return;

 body.querySelectorAll('.k94relations,.k93relations').forEach(x=>x.remove());

 const box=document.createElement('section');
 box.className='k94relations';
 box.innerHTML='<div class="k94relwait">در حال دریافت سوابق سند…</div>';
 body.prepend(box);

 try{
   let data=await readRelationsFromBank(docId);

   // Compatibility fallback for relations created through 0.9.3.x/0.9.4.0 endpoint.
   if(!data.items.length){
     const fallback=await readRelationsFallback(docId);
     if(fallback?.items?.length)data=fallback;
   }

   const items=data.items||[];
   const count=Number(data.summary?.total ?? items.length) || items.length;
   const status=data.summary?.statusLabel || (items.length?'دارای ارتباط ثبت‌شده':'بدون اصلاحیه ثبت‌شده');

   box.innerHTML=`<div class="k94relhead">
      <div><b>اصلاحات و سوابق این سند</b><span>${esc(status)}</span></div>
      <strong>${String(count).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])} ارتباط</strong>
    </div>
    ${items.length
      ? `<div class="k94rellist">${items.map(relRow).join('')}</div>`
      : `<div class="k94relempty">برای این سند هنوز هیچ اصلاحیه یا ارتباطی در بانک اطلاعات ثبت نشده است.</div>`
    }`;
 }catch(e){
   box.innerHTML=`<div class="k94relerror"><b>سوابق سند بارگذاری نشد.</b><br>${esc(e.name==='AbortError'?'مهلت پاسخ سرویس تمام شد.':e.message)}</div>`;
 }
}

/* IMPORTANT:
   This is the only preview hook in 0.9.4.2. It reads relations from the SAME
   document-bank detail response used by the popup text, so there is no
   dependency on a second API route for normal display. */
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-doc-preview]');
 const id=p?.dataset.docPreview;
 if(!id)return;
 setTimeout(()=>renderFor(id),0);
},false);

/* Keep semantic direction correct for NEW document -> OLD document. */
function fixUploadDirection(){
 document.querySelectorAll('.k94relationentry select[data-reltype]').forEach(sel=>{
   const opt=[...sel.options].find(o=>o.textContent.trim()==='اصلاحیه سند قبلی');
   if(opt)opt.value='amends';
 });
}
new MutationObserver(fixUploadDirection).observe(document.documentElement,{subtree:true,childList:true});
fixUploadDirection();
})();