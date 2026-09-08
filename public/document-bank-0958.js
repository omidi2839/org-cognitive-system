(()=>{
window.__DOCUMENT_BANK_BUILD__='0.9.5.8';
const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return toFa(v)}};
const api=async(p,o={})=>{const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت بانک اسناد');return d};
const statusLabel=v=>({active:'معتبر',draft:'پیش‌نویس',expired:'منقضی',revoked:'لغوشده',superseded:'جایگزین‌شده',unknown:'نیازمند احراز'})[v]||v||'نیازمند احراز';
const classLabel=v=>({public:'عمومی',internal:'داخلی',confidential:'محرمانه',secret:'خیلی محرمانه'})[v]||v||'—';
const docClass=v=>v==='upstream'?'بالادستی':v==='general'?'عمومی':'سایر';
const rex=s=>String(s??'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function hi(text,q){
 const raw=String(text??''),needle=String(q??'').trim();if(!needle)return esc(raw);
 const p=[...needle].map(ch=>/[یيى]/.test(ch)?'[یيى]':/[کك]/.test(ch)?'[کك]':/[\s\u200c\u200d]/.test(ch)?'[\\s\\u200c\\u200d]+':rex(ch)).join('');
 let rx;try{rx=new RegExp(`(${p})`,'giu')}catch{return esc(raw)}
 return esc(raw).replace(rx,'<mark class="k91highlight">$1</mark>');
}
function metaLine(d){
 return `<div class="k958metainfo"><span><b>نوع سند:</b> ${esc(d.documentType||'—')}</span><span><b>موضوع:</b> ${esc(d.subjectArea||'بدون موضوع')}</span><span><b>مرجع صادرکننده:</b> ${esc(d.issuer||'مرجع نامشخص')}</span></div>`;
}
function snippets(d,q){
 const ss=(d.matchSnippets||[]).filter(Boolean).slice(0,3);
 if(!ss.length)return d.metadataMatch?'<div class="k91snippet k91meta-hit"><b>تطابق در فراداده سند</b></div>':'';
 return ss.map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+1)}:</b> ${hi(s,q)}</div>`).join('');
}
function row(d,q){
 const mb=d.matchCount?`<span class="k91matchbadge">${toFa(d.matchCount)} تطابق در متن</span>`:(d.metadataMatch?'<span class="k91matchbadge">تطابق در فراداده</span>':'');
 return `<article class="k91result k958result">
  <div class="k91result-main">
   <div class="k91badges"><span>${docClass(d.documentClass)}</span><span>${statusLabel(d.validityStatus)}</span><span>${classLabel(d.classification)}</span>${d.hasRelations?'<span class="k958relbadge">دارای ارتباط سندی</span>':''}${mb}</div>
   <button type="button" class="k91doctitle" data-k958-preview="${esc(d.id)}">${esc(d.title||'بدون عنوان')}</button>
   <div class="k91result-info">${metaLine(d)}${snippets(d,q)}</div>
  </div>
  <div class="k91dates k958dates">
   <span>تاریخ تصویب/صدور<b>${fmtDate(d.issuedAt||d.createdAt)}</b></span>
   <span>تاریخ ابلاغ<b>${fmtDate(d.promulgationDate)}</b></span>
   <span>شماره جلسه<b>${esc(d.meetingNumber||'—')}</b></span>
   <button type="button" class="k91previewbtn" data-k958-preview="${esc(d.id)}">مشاهده سند</button>
  </div>
 </article>`;
}
function searchMarkup(){
 return `<div class="k91hero k958hero"><div><b>بانک اطلاعات اسناد سازمان</b><span>جستجو بر اساس متن، موضوعات ثبت‌شده، جلسه و ارتباطات سندی</span></div><div class="k91hero-actions"><strong id="k91count">—</strong></div></div>
 <form id="k958search" class="k91search k958search">
  <label class="k91q">جستجو در عنوان، موضوع، مرجع و متن سند<input name="q" placeholder="عبارت موردنظر را وارد کنید"></label>
  <div class="k91filters k958filters">
   <label>رده سند<select name="documentClass"><option value="">همه اسناد</option><option value="upstream">بالادستی</option><option value="general">عمومی</option></select></label>
   <label>موضوع سند<input name="subject" id="k958subject" list="k958subjects" autocomplete="off" placeholder="جستجو یا انتخاب موضوع…"><datalist id="k958subjects"></datalist></label>
   <label>نوع جلسه<input name="meetingType" id="k958meetingtype" list="k958meetingtypes" autocomplete="off" placeholder="جستجو یا انتخاب نوع جلسه…"><datalist id="k958meetingtypes"></datalist></label>
   <label>شماره جلسه<input name="meetingNumber" placeholder="مثلاً ۱۲۵"></label>
   <label>ارتباط با اسناد دیگر<select name="hasRelations"><option value="">همه</option><option value="yes">دارای ارتباط</option><option value="no">بدون ارتباط</option></select></label>
   <label>وضعیت اعتبار<select name="validity"><option value="">همه وضعیت‌ها</option><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="unknown">نیازمند احراز</option></select></label>
   <label>طبقه‌بندی<select name="classification"><option value="">همه سطوح</option><option value="public">عمومی</option><option value="internal">داخلی</option><option value="confidential">محرمانه</option><option value="secret">خیلی محرمانه</option></select></label>
   <label>مرجع صادرکننده<input name="issuer" placeholder="نام مرجع"></label>
   <label>از تاریخ<input type="date" name="from"></label>
   <label>تا تاریخ<input type="date" name="to"></label>
  </div>
  <div class="k958actions"><button class="k76primary" type="submit">جستجو</button><button type="button" id="k958clear">پاک کردن فیلترها</button></div>
 </form>
 <div id="k91results"><div class="k76loading">در حال دریافت بانک اسناد…</div></div>`;
}
function fillFacets(d){
 const sub=document.getElementById('k958subjects'),mt=document.getElementById('k958meetingtypes');
 if(sub)sub.innerHTML=(d.facets?.subjects||[]).map(x=>`<option value="${esc(x)}"></option>`).join('');
 if(mt)mt.innerHTML=(d.facets?.meetingTypes||[]).map(x=>`<option value="${esc(x)}"></option>`).join('');
}
async function run(){
 const f=document.getElementById('k958search'),out=document.getElementById('k91results'),count=document.getElementById('k91count');
 if(!f||!out)return;
 const fd=new FormData(f),p=new URLSearchParams();
 for(const [k,v] of fd.entries())if(String(v).trim())p.set(k,String(v).trim());
 p.set('snippetLimit','12');
 out.innerHTML='<div class="k76loading">در حال جستجو در بانک اسناد…</div>';
 try{
  const d=await api('/api/v1/knowledge/document-bank?'+p.toString()),q=String(fd.get('q')||'').trim();
  window.__K91_LAST_QUERY=q;window.__K957_LAST_QUERY=q;
  fillFacets(d);
  if(count)count.textContent=q?`${toFa(d.summary?.visible||0)} سند · ${toFa(d.summary?.totalOccurrences||0)} تطابق متنی`:`${toFa(d.summary?.visible||0)} سند قابل مشاهده`;
  out.innerHTML=(d.items||[]).length?(d.items||[]).map(x=>row(x,q)).join(''):'<div class="k76empty">سندی با این معیارها پیدا نشد.</div>';
 }catch(e){out.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
async function preview(id){
 let old=document.getElementById('k91docmodal');if(old)old.remove();
 window.__K951_ACTIVE_DOC_ID=id;window.__K950_ACTIVE_DOC_ID=id;
 const q=window.__K91_LAST_QUERY||'';
 const w=document.createElement('div');w.id='k91docmodal';w.className='k91modalbackdrop';
 w.innerHTML='<div class="k91modal"><div class="k91modal-loading">در حال دریافت متن سند…</div></div>';
 w.onclick=e=>{if(e.target===w){w.remove();document.body.classList.remove('k91-modal-open')}};document.body.appendChild(w);document.body.classList.add('k91-modal-open');
 try{
  const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(id)+'&detail=1'),x=(d.items||[])[0]||{};
  if(!x.id)throw Error('سند پیدا نشد.');
  w.innerHTML=`<div class="k91modal"><div class="k91modalhead"><div><div class="k91modalbadges"><span>${docClass(x.documentClass)}</span><span>${statusLabel(x.validityStatus)}</span><span>${classLabel(x.classification)}</span></div><h3>${esc(x.title||'بدون عنوان')}</h3>${metaLine(x)}</div><button class="k91modalclose" type="button">×</button></div><div class="k91modalmeta"><span>تاریخ تصویب/صدور <b>${fmtDate(x.issuedAt||x.createdAt)}</b></span><span>تاریخ ابلاغ <b>${fmtDate(x.promulgationDate)}</b></span><span>شماره جلسه <b>${esc(x.meetingNumber||'—')}</b></span></div><div class="k91modalbody">${x.fullText?`<div class="k91fulltext">${hi(x.fullText,q)}</div>`:'<div class="k76empty">متن استخراج‌شده‌ای وجود ندارد.</div>'}</div></div>`;
  w.querySelector('.k91modalclose').onclick=()=>{w.remove();document.body.classList.remove('k91-modal-open')};
  // Notify the structured DOCX renderer after modal content exists.
  setTimeout(()=>document.dispatchEvent(new CustomEvent('k958:document-preview',{detail:{documentId:id}})),20);
 }catch(e){w.innerHTML=`<div class="k91modal"><div class="k91modalhead"><h3>مشاهده سند</h3><button class="k91modalclose">×</button></div><div class="k76empty">${esc(e.message)}</div></div>`;w.querySelector('.k91modalclose').onclick=()=>w.remove()}
}
function enhance(){
 const body=document.querySelector('.k91bank-mode #k76body');
 if(!body||body.dataset.k958Enhanced)return;
 // Wait until the original bank has completed its synchronous initialization, then take over.
 if(!body.querySelector('#k91search')&&!body.querySelector('.k91hero'))return;
 body.dataset.k958Enhanced='1';
 body.innerHTML=searchMarkup();
 const f=document.getElementById('k958search');
 f.onsubmit=e=>{e.preventDefault();run()};
 document.getElementById('k958clear').onclick=()=>{f.reset();run()};
 body.addEventListener('click',e=>{const b=e.target.closest('[data-k958-preview]');if(b)preview(b.dataset.k958Preview)});
 run();
}
const mo=new MutationObserver(()=>setTimeout(enhance,0));
mo.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',()=>setTimeout(enhance,20),true);
setTimeout(enhance,100);
})();