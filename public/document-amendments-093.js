(()=>{
window.__DOCUMENT_AMENDMENT_BUILD__='0.9.3.0';
const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,opts={})=>{
 const r=await fetch(p,{...opts,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.message||'خطا در شبکه اسناد');
 return d;
};
const relationOptions=[
 ['amended_by','اصلاح‌شده توسط'],
 ['amends','این سند اصلاح‌کننده سند دیگر است'],
 ['superseded_by','جایگزین‌شده توسط'],
 ['supersedes','این سند جایگزین سند دیگر است'],
 ['repealed_by','لغوشده توسط'],
 ['repeals','این سند سند دیگر را لغو می‌کند'],
 ['extended_by','تمدید/توسعه‌یافته توسط'],
 ['extends','این سند اعتبار/دامنه سند دیگر را توسعه می‌دهد'],
 ['clarified_by','تبیین‌شده توسط'],
 ['clarifies','این سند سند دیگر را تبیین می‌کند'],
 ['implemented_by','دارای سند اجرایی'],
 ['implements','این سند، سند اجرایی سند دیگر است'],
 ['related_to','سند مرتبط']
];
let currentDocumentId=null;
let decorating=false;

function fmtDate(v){
 if(!v)return'—';
 try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}
 catch{return toFa(v)}
}

function relationLocation(r){
 const a=r.targetLocator?.article,c=r.targetLocator?.clause,s=r.targetLocator?.section;
 const parts=[];
 if(a)parts.push(`ماده ${esc(a)}`);
 if(c)parts.push(`بند/تبصره ${esc(c)}`);
 if(s)parts.push(esc(s));
 return parts.join(' · ');
}

function relationRow(r){
 const loc=relationLocation(r);
 return `<div class="k93relrow">
   <div class="k93relmain">
     <span class="k93reltype">${esc(r.label||'ارتباط')}</span>
     <button type="button" class="k93reldoc" data-doc-preview="${esc(r.relatedDocument.id)}">${esc(r.relatedDocument.title||'بدون عنوان')}</button>
     <div class="k93relmeta">
       ${loc?`<span>${loc}</span>`:''}
       ${r.changeType?`<span>${esc(r.changeType)}</span>`:''}
       <span>${fmtDate(r.effectiveFrom||r.relatedDocument.issuedAt)}</span>
     </div>
     ${r.note?`<div class="k93relnote">${esc(r.note)}</div>`:''}
   </div>
   <button type="button" class="k93reldel" data-rel-delete="${esc(r.id)}" title="حذف ارتباط">×</button>
 </div>`;
}

function relationsBlock(x){
 const rs=Array.isArray(x.relations)?x.relations:[];
 const sum=x.relationSummary||{};
 const incoming=rs.filter(r=>['amended_by','superseded_by','repealed_by','extended_by'].includes(r.perspectiveType));
 const outgoing=rs.filter(r=>['amends','supersedes','repeals','extends'].includes(r.perspectiveType));
 const other=rs.filter(r=>!incoming.includes(r)&&!outgoing.includes(r));
 return `<section class="k93relations" data-k93-for="${esc(x.id)}">
   <div class="k93relhead">
     <div><b>اصلاحات و سوابق این سند</b><span>${sum.statusLabel||'بدون اصلاحیه ثبت‌شده'}</span></div>
     <strong>${toFa(rs.length)} ارتباط</strong>
   </div>
   ${sum.latestChange?`<div class="k93currentstatus">آخرین تغییر ثبت‌شده: <b>${esc(sum.latestChange.title)}</b> · ${fmtDate(sum.latestChange.effectiveFrom)}</div>`:''}
   <div class="k93rellist">
     ${incoming.length?`<div class="k93group"><h5>اصلاحات بعدی این سند</h5>${incoming.map(relationRow).join('')}</div>`:''}
     ${outgoing.length?`<div class="k93group"><h5>این سند چه اسنادی را تغییر داده است؟</h5>${outgoing.map(relationRow).join('')}</div>`:''}
     ${other.length?`<div class="k93group"><h5>سایر ارتباطات</h5>${other.map(relationRow).join('')}</div>`:''}
     ${!rs.length?'<div class="k93empty">هنوز اصلاحیه، جایگزینی یا ارتباط حقوقی برای این سند ثبت نشده است.</div>':''}
   </div>
   <details class="k93add">
     <summary>+ ثبت اصلاحیه یا ارتباط جدید</summary>
     <form class="k93relform">
       <label>نوع ارتباط<select name="relationType">${relationOptions.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
       <label class="wide">سند مرتبط<select name="relatedDocumentId" required><option value="">انتخاب سند…</option></select></label>
       <label>ماده<input name="targetArticle" placeholder="مثلاً ۷"></label>
       <label>بند / تبصره<input name="targetClause" placeholder="مثلاً تبصره ۲"></label>
       <label>بخش<input name="targetSection" placeholder="عنوان بخش"></label>
       <label>نوع تغییر<select name="changeType"><option value="">انتخاب…</option><option>اصلاح متن</option><option>جایگزینی متن</option><option>حذف</option><option>الحاق</option><option>تمدید اعتبار</option><option>تغییر دامنه</option><option>تفسیر/توضیح</option></select></label>
       <label>تاریخ اثر<input type="date" name="effectiveFrom"></label>
       <label class="wide">توضیح<input name="note" placeholder="مثلاً بند ۳ ماده ۷ مطابق مصوبه جدید اصلاح شد"></label>
       <div class="k93formactions wide"><button type="submit">ثبت ارتباط</button><span class="k93formstatus"></span></div>
     </form>
   </details>
 </section>`;
}

async function fillDocumentOptions(root,currentId){
 const select=root.querySelector('select[name="relatedDocumentId"]');
 if(!select||select.dataset.loaded)return;
 select.dataset.loaded='1';
 try{
   const d=await api('/api/v1/knowledge/document-bank');
   const docs=(d.items||[]).filter(x=>x.id!==currentId).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'fa'));
   select.insertAdjacentHTML('beforeend',docs.map(x=>`<option value="${esc(x.id)}">${esc(x.title||'بدون عنوان')} — ${esc(x.issuer||'')}</option>`).join(''));
 }catch(e){
   select.insertAdjacentHTML('beforeend',`<option disabled>خطا در دریافت اسناد</option>`);
 }
}

async function decorateModal(){
 if(decorating||!currentDocumentId)return;
 const modal=document.querySelector('#k91docmodal .k91modal');
 const body=modal?.querySelector('.k91modalbody');
 if(!modal||!body||modal.querySelector('.k93relations'))return;
 decorating=true;
 try{
   const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(currentDocumentId)+'&detail=1');
   const x=(d.items||[])[0];
   if(!x)return;
   body.insertAdjacentHTML('afterbegin',relationsBlock(x));
   const block=body.querySelector('.k93relations');
   await fillDocumentOptions(block,x.id);

   const form=block.querySelector('.k93relform');
   form?.addEventListener('submit',async e=>{
     e.preventDefault();
     const st=form.querySelector('.k93formstatus');
     const fd=new FormData(form);
     const payload={action:'create-document-relation',documentId:x.id};
     for(const [k,v] of fd.entries())payload[k]=String(v).trim();
     if(!payload.relatedDocumentId){st.textContent='سند مرتبط را انتخاب کنید.';return;}
     st.textContent='در حال ثبت…';
     try{
       await api('/api/v1/knowledge/document-bank',{method:'POST',body:JSON.stringify(payload)});
       st.textContent='ثبت شد.';
       block.remove();
       decorating=false;
       await decorateModal();
     }catch(err){st.textContent=err.message;}
   });

   block.querySelectorAll('[data-rel-delete]').forEach(btn=>btn.addEventListener('click',async()=>{
     if(!confirm('این ارتباط از شبکه اسناد حذف شود؟'))return;
     try{
       await api('/api/v1/knowledge/document-bank',{method:'POST',body:JSON.stringify({action:'delete-document-relation',relationId:btn.dataset.relDelete})});
       block.remove(); decorating=false; await decorateModal();
     }catch(err){alert(err.message);}
   }));
 }catch(e){
   body.insertAdjacentHTML('afterbegin',`<div class="k93error">خطا در دریافت شبکه اصلاحات: ${esc(e.message)}</div>`);
 }finally{decorating=false;}
}

document.addEventListener('click',e=>{
 const p=e.target.closest('[data-doc-preview]');
 if(p?.dataset.docPreview){
   currentDocumentId=p.dataset.docPreview;
   setTimeout(decorateModal,80);
 }
},true);

const obs=new MutationObserver(()=>{if(document.getElementById('k91docmodal'))setTimeout(decorateModal,30)});
obs.observe(document.documentElement,{subtree:true,childList:true});
})();
