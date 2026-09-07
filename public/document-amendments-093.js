(()=>{
window.__DOCUMENT_AMENDMENT_BUILD__='0.9.3.1';
const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return toFa(v)}};
const api=async(p,opts={})=>{const r=await fetch(p,{...opts,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در شبکه اسناد');return d};
const relationTypes=[
 ['amended_by','اصلاح‌شده توسط'],
 ['amends','این سند اصلاح‌کننده سند دیگر است'],
 ['superseded_by','جایگزین‌شده توسط'],
 ['supersedes','این سند جایگزین سند دیگر است'],
 ['repealed_by','لغوشده توسط'],
 ['repeals','این سند سند دیگر را لغو می‌کند'],
 ['extends','این سند اعتبار/دامنه سند دیگر را توسعه می‌دهد'],
 ['clarifies','این سند سند دیگر را تبیین می‌کند'],
 ['implements','این سند، سند اجرایی سند دیگر است'],
 ['related_to','سند مرتبط']
];

function loc(r){
 const p=[];
 if(r.targetArticle)p.push(`ماده ${esc(r.targetArticle)}`);
 if(r.targetClause)p.push(`بند/تبصره ${esc(r.targetClause)}`);
 if(r.targetSection)p.push(esc(r.targetSection));
 return p.join(' · ');
}
function row(r){
 return `<div class="k93relrow">
  <div class="k93relmain">
   <span class="k93reltype">${esc(r.label||'ارتباط')}</span>
   <button type="button" class="k93reldoc" data-doc-preview="${esc(r.relatedDocument?.id||'')}">${esc(r.relatedDocument?.title||'بدون عنوان')}</button>
   <div class="k93relmeta">${loc(r)?`<span>${loc(r)}</span>`:''}${r.changeType?`<span>${esc(r.changeType)}</span>`:''}${r.effectiveFrom?`<span>${fmtDate(r.effectiveFrom)}</span>`:''}</div>
   ${r.note?`<div class="k93relnote">${esc(r.note)}</div>`:''}
  </div>
  <button type="button" class="k93reldel" data-rel-delete="${esc(r.id)}">×</button>
 </div>`;
}
async function render(modal,docId){
 const body=modal?.querySelector('.k91modalbody'); if(!body)return;
 body.querySelector('.k93relations')?.remove();
 const box=document.createElement('section'); box.className='k93relations';
 box.innerHTML='<div class="k93loading">در حال دریافت اصلاحات و سوابق سند…</div>'; body.prepend(box);
 try{
  const data=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
  const rs=data.items||[];
  const incoming=rs.filter(r=>['amended_by','superseded_by','repealed_by','extended_by'].includes(r.perspectiveType));
  const outgoing=rs.filter(r=>['amends','supersedes','repeals','extends'].includes(r.perspectiveType));
  const other=rs.filter(r=>!incoming.includes(r)&&!outgoing.includes(r));
  box.innerHTML=`<div class="k93relhead"><div><b>اصلاحات و سوابق این سند</b><span>${esc(data.summary?.statusLabel||'بدون اصلاحیه ثبت‌شده')}</span></div><strong>${toFa(rs.length)} ارتباط</strong></div>
   ${data.summary?.latestChange?`<div class="k93currentstatus">آخرین تغییر ثبت‌شده: <b>${esc(data.summary.latestChange.title)}</b></div>`:''}
   ${incoming.length?`<div class="k93group"><h5>اصلاحات بعدی این سند</h5>${incoming.map(row).join('')}</div>`:''}
   ${outgoing.length?`<div class="k93group"><h5>این سند چه اسنادی را تغییر داده است؟</h5>${outgoing.map(row).join('')}</div>`:''}
   ${other.length?`<div class="k93group"><h5>سایر ارتباطات</h5>${other.map(row).join('')}</div>`:''}
   ${!rs.length?'<div class="k93empty">هنوز اصلاحیه یا ارتباطی برای این سند ثبت نشده است.</div>':''}
   <details class="k93add" open><summary>+ ثبت اصلاحیه یا ارتباط جدید</summary>
   <form class="k93relform">
    <label>نوع ارتباط<select name="relationType">${relationTypes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
    <label class="wide">سند مرتبط<select name="relatedDocumentId" required><option value="">انتخاب سند…</option></select></label>
    <label>ماده<input name="targetArticle" placeholder="مثلاً ۷"></label>
    <label>بند / تبصره<input name="targetClause" placeholder="مثلاً تبصره ۲"></label>
    <label>بخش<input name="targetSection" placeholder="عنوان بخش"></label>
    <label>نوع تغییر<select name="changeType"><option value="">انتخاب…</option><option>اصلاح متن</option><option>جایگزینی متن</option><option>حذف</option><option>الحاق</option><option>تمدید اعتبار</option><option>تغییر دامنه</option><option>تفسیر/توضیح</option></select></label>
    <label>تاریخ اثر<input type="date" name="effectiveFrom"></label>
    <label class="wide">توضیح<input name="note" placeholder="مثلاً ماده ۷ بر اساس مصوبه جدید اصلاح شد"></label>
    <div class="k93formactions wide"><button type="submit">ثبت ارتباط</button><span class="k93formstatus"></span></div>
   </form></details>`;
  const docs=await api('/api/v1/knowledge/document-bank');
  const sel=box.querySelector('select[name="relatedDocumentId"]');
  (docs.items||[]).filter(d=>d.id!==docId).forEach(d=>{const o=document.createElement('option');o.value=d.id;o.textContent=`${d.title||'بدون عنوان'}${d.issuer?' — '+d.issuer:''}`;sel.appendChild(o)});
  box.querySelector('.k93relform')?.addEventListener('submit',async e=>{
   e.preventDefault(); const f=e.currentTarget,st=f.querySelector('.k93formstatus'),fd=new FormData(f),payload={documentId:docId};
   for(const [k,v] of fd.entries())payload[k]=String(v).trim();
   if(!payload.relatedDocumentId){st.textContent='سند مرتبط را انتخاب کنید.';return}
   st.textContent='در حال ثبت…';
   try{await api('/api/v1/knowledge/document-relations',{method:'POST',body:JSON.stringify(payload)});await render(modal,docId)}
   catch(err){st.textContent=err.message}
  });
  box.querySelectorAll('[data-rel-delete]').forEach(b=>b.addEventListener('click',async()=>{
   if(!confirm('این ارتباط حذف شود؟'))return;
   try{await api('/api/v1/knowledge/document-relations',{method:'DELETE',body:JSON.stringify({relationId:b.dataset.relDelete})});await render(modal,docId)}
   catch(err){alert(err.message)}
  }));
 }catch(err){box.innerHTML=`<div class="k93error">خطا در دریافت شبکه اصلاحات: ${esc(err.message)}</div>`}
}
let activeDocId=null;
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-doc-preview]');
 if(p?.dataset.docPreview){activeDocId=p.dataset.docPreview;setTimeout(()=>render(document.getElementById('k91docmodal'),activeDocId),100)}
},true);
new MutationObserver(()=>{if(activeDocId&&document.getElementById('k91docmodal'))setTimeout(()=>render(document.getElementById('k91docmodal'),activeDocId),80)}).observe(document.documentElement,{subtree:true,childList:true});
})();