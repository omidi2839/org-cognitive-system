(()=>{
window.__DOCUMENT_RELATION_PREVIEW_FIX__='0.9.4.3';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const FA='۰۱۲۳۴۵۶۷۸۹',toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);

const api=async(p)=>{
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);
 try{
  const r=await fetch(p,{signal:ctl.signal,headers:{'x-org-id':'ORG:SYN-001'}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.message||'خطا در دریافت اطلاعات سند');
  return d;
 }finally{clearTimeout(t)}
};

let pendingDocId=null;
let renderSerial=0;

function relationLoc(r){
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
function relationRow(r){
 const rd=r.relatedDocument||{};
 return `<div class="k94relrow">
   <span class="k94reltype">${esc(r.label||r.perspectiveType||'ارتباط')}</span>
   <button type="button" data-doc-preview="${esc(rd.id||'')}">${esc(rd.title||'بدون عنوان')}</button>
   ${relationLoc(r)?`<small>${relationLoc(r)}</small>`:''}
   ${r.changeType?`<small>${esc(r.changeType)}</small>`:''}
   ${r.note?`<small>${esc(r.note)}</small>`:''}
 </div>`;
}

async function renderRelations(docId,body){
 const serial=++renderSerial;
 body.querySelectorAll('.k94relations,.k93relations').forEach(x=>x.remove());
 const box=document.createElement('section');
 box.className='k94relations';
 box.innerHTML='<div class="k94relwait">در حال دریافت سوابق سند…</div>';
 body.prepend(box);
 try{
   const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(docId)+'&detail=1');
   if(serial!==renderSerial)return;
   const x=(d.items||[])[0];
   if(!x)throw Error('سند در بانک اسناد پیدا نشد.');
   const items=Array.isArray(x.relations)?x.relations:[];
   const sum=x.relationSummary||{};
   box.innerHTML=`<div class="k94relhead">
     <div><b>اصلاحات و سوابق این سند</b><span>${esc(sum.statusLabel||'بدون اصلاحیه ثبت‌شده')}</span></div>
     <strong>${toFa(sum.total??items.length)} ارتباط</strong>
   </div>
   ${items.length
      ? `<div class="k94rellist">${items.map(relationRow).join('')}</div>`
      : '<div class="k94relempty">برای این سند هنوز هیچ اصلاحیه یا ارتباطی ثبت نشده است.</div>'}`;
 }catch(e){
   box.innerHTML=`<div class="k94relerror"><b>سوابق سند بارگذاری نشد.</b><br>${esc(e.name==='AbortError'?'مهلت پاسخ سرویس تمام شد.':e.message)}</div>`;
 }
}

function tryAttach(){
 if(!pendingDocId)return;
 const body=document.querySelector('#k91docmodal .k91modalbody');
 if(!body)return;
 const id=pendingDocId;
 pendingDocId=null;
 renderRelations(id,body);
}

/* Critical fix:
   Listen on WINDOW in capture phase. The existing document-bank handler may stop
   propagation at document level, so document/bubble listeners never see the click.
   Window capture always sees it first. */
window.addEventListener('click',e=>{
 const p=e.target?.closest?.('[data-doc-preview]');
 if(!p?.dataset.docPreview)return;
 pendingDocId=p.dataset.docPreview;
 setTimeout(tryAttach,0);
},true);

/* DOM observer does NO fetch by itself; it only checks whether the popup body
   corresponding to the previously captured click has appeared. */
new MutationObserver(()=>{ if(pendingDocId) tryAttach(); })
 .observe(document.documentElement,{subtree:true,childList:true});

})();