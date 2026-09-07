(()=>{
window.__DOCUMENT_RELATION_PREVIEW_FIX__='0.9.4.1';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,opts={})=>{
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);
 try{
  const r=await fetch(p,{...opts,signal:ctl.signal,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.message||'خطا در دریافت سوابق سند');
  return d;
 }finally{clearTimeout(t)}
};
function relationLoc(r){
 const p=[];
 if(r.targetArticle)p.push(`ماده ${esc(r.targetArticle)}`);
 if(r.targetClause)p.push(`بند/تبصره ${esc(r.targetClause)}`);
 if(r.targetSection)p.push(esc(r.targetSection));
 return p.join(' · ');
}
function row(r){
 return `<div class="k94relrow">
   <span class="k94reltype">${esc(r.label||'ارتباط')}</span>
   <button type="button" data-doc-preview="${esc(r.relatedDocument?.id||'')}">${esc(r.relatedDocument?.title||'بدون عنوان')}</button>
   ${relationLoc(r)?`<small>${relationLoc(r)}</small>`:''}
   ${r.changeType?`<small>${esc(r.changeType)}</small>`:''}
   ${r.note?`<small>${esc(r.note)}</small>`:''}
 </div>`;
}
async function renderRelations(docId,body){
 body.querySelector('.k94relations')?.remove();
 const box=document.createElement('section');
 box.className='k94relations';
 box.innerHTML='<div class="k94relwait">در حال دریافت سوابق سند…</div>';
 body.prepend(box);
 try{
   const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
   const items=d.items||[];
   box.innerHTML=`<div class="k94relhead">
     <b>اصلاحات و سوابق این سند</b>
     <span>${esc(d.summary?.statusLabel||'بدون اصلاحیه ثبت‌شده')}</span>
   </div>
   ${items.length?items.map(row).join(''):'<div class="k94relempty">برای این سند هنوز اصلاحیه یا رابطه‌ای ثبت نشده است.</div>'}`;
 }catch(e){
   box.innerHTML=`<div class="k94relerror">سوابق سند در دسترس نیست: ${esc(e.name==='AbortError'?'مهلت پاسخ سرویس تمام شد.':e.message)}</div>`;
 }
}
async function waitAndRender(docId){
 const started=Date.now();
 while(Date.now()-started<5000){
   const modal=document.getElementById('k91docmodal');
   const body=modal?.querySelector('.k91modalbody');
   if(body){
     await renderRelations(docId,body);
     return;
   }
   await new Promise(r=>setTimeout(r,80));
 }
 const modal=document.getElementById('k91docmodal');
 if(modal){
   const shell=modal.querySelector('.k91modal');
   if(shell&&!shell.querySelector('.k94relerror')){
     shell.insertAdjacentHTML('afterbegin','<div class="k94relerror">نمایش متن سند آماده شد، اما محل نمایش سوابق پیدا نشد.</div>');
   }
 }
}

/* Run after the bank's own click handler; limited polling handles slow document-detail API safely. */
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-doc-preview]');
 const id=p?.dataset.docPreview;
 if(!id)return;
 setTimeout(()=>waitAndRender(id),0);
},false);

/* Correct the semantic value shown in upload UI:
   "اصلاحیه سند قبلی" means CURRENT NEW document amends RELATED OLD document. */
function fixRelationTypeOption(){
 document.querySelectorAll('.k94relationentry select[data-reltype]').forEach(sel=>{
   const o=[...sel.options].find(x=>x.textContent.trim()==='اصلاحیه سند قبلی');
   if(o)o.value='amends';
 });
}
new MutationObserver(fixRelationTypeOption).observe(document.documentElement,{subtree:true,childList:true});
fixRelationTypeOption();
})();