(()=>{
window.__SINA_DIRECT_REGISTRATION_BUILD__='0.9.9.1.0';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,o={})=>{
 const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})},...o});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.message||'خطا');
 return d;
};

let k9934Counts={upstream:null,general:null},k9934CountsAt=0,k9934CountsInFlight=null;
function k9934Persian(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])}
function k9934ApplyCounts(){
 document.querySelectorAll('.k9931-static-document-card').forEach(card=>{
   const kind=card.dataset.k9931Kind;
   if(!kind||k9934Counts[kind]==null)return;
   let badge=card.querySelector('.k980count');
   if(!badge){
     badge=document.createElement('span');
     badge.className='k980count';
     card.appendChild(badge);
   }
   badge.textContent=`${k9934Persian(k9934Counts[kind])} سند`;
 });
}
async function k9934RefreshCounts(force=false){
 const now=Date.now();
 if(k9934CountsInFlight)return k9934CountsInFlight;
 if(!force&&k9934Counts.upstream!=null&&(now-k9934CountsAt)<30000){
   k9934ApplyCounts();return k9934Counts;
 }
 k9934CountsInFlight=(async()=>{
   try{
     const d=await api('/api/v1/knowledge/documents');
     const items=d.items||[];
     k9934Counts.upstream=items.filter(x=>x.documentClass==='upstream').length;
     k9934Counts.general=items.filter(x=>x.documentClass==='general').length;
     k9934CountsAt=Date.now();
     k9934ApplyCounts();
   }catch{}
   finally{k9934CountsInFlight=null}
   return k9934Counts;
 })();
 return k9934CountsInFlight;
}


function kindOf(card){
 const n=String(card?.dataset?.capability||card?.querySelector('b')?.textContent||'').trim();
 return n==='اسناد بالادستی'?'upstream':n==='اسناد عمومی'?'general':'';
}
function renderForm(kind){
 const up=kind==='upstream';
 document.getElementById('workspaceContext')?.classList.add('k91-hidden-workspace');
 let x=document.getElementById('knowledge076');
 if(!x){
   x=document.createElement('section');
   x.id='knowledge076';
   x.className='knowledge076';
   document.querySelector('.main')?.prepend(x);
 }
 x.className='knowledge076 k9926-direct-registration';
 x.innerHTML=`<div class="k76head"><div><small>سینا · ثبت مستقیم سند</small><h2>${up?'ثبت سند بالادستی':'ثبت سند عمومی'}</h2><p>اطلاعات سند را تکمیل کنید؛ پس از ثبت، سند در بانک اسناد سازمان قابل بازیابی است.</p></div><button type="button" data-k9926-close>×</button></div><div id="k76body"></div>`;
 x.querySelector('[data-k9926-close]').onclick=()=>{
   x.remove();
   document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace');
 };

 const types=up
   ?['مأموریت','چشم‌انداز','اهداف کلان','سیاست','راهبرد','چارچوب','ضوابط','قانون/الزام بیرونی']
   :['آیین‌نامه','دستورالعمل','بخشنامه','گزارش','صورتجلسه','نامه رسمی','سایر'];
 const classificationOptions=up
   ?'<option value="confidential">محرمانه</option><option value="public">عمومی</option>'
   :'<option value="public">عمومی</option><option value="confidential">محرمانه</option>';
 const scopeHtml=up
   ?`<label>دامنه سازمانی<select name="scopeType" id="k76scopeType"><option value="organization">کل سازمان</option><option value="unit">واحد سازمانی</option></select></label>
     <label id="k76unitWrap" style="display:none">واحد سازمانی<select name="organizationalUnitRef" id="k76unitSelect"><option value="">انتخاب واحد سازمانی…</option></select><small id="k76unitHelp">فهرست از ساختار سازمانی دریافت می‌شود.</small></label>`
   :`<label>دامنه سازمانی<select name="organizationalLevel"><option>کل سازمان</option><option>واحد سازمانی</option></select></label>`;

 const b=x.querySelector('#k76body');
 b.innerHTML=`<form id="k76form" data-k9926-direct="${kind}"><div class="k76grid">
 <label>عنوان سند<input name="title" required></label>
 <label>نوع سند<select name="documentType">${types.map(v=>`<option>${v}</option>`).join('')}</select></label>
 <label>مرجع صادرکننده<input name="issuer"></label>
 <label>نسخه<input name="versionLabel"></label>
 <label>تاریخ صدور<input type="date" name="issuedAt"></label>
 <label>پایان اعتبار<input type="date" name="validUntil"></label>
 <label>وضعیت اعتبار<select name="validityStatus"><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="unknown">نیازمند احراز</option></select></label>
 ${scopeHtml}
 <label>حوزه موضوعی<input name="subjectArea"></label>
 <label>طبقه‌بندی<select name="classification">${classificationOptions}</select></label>
 </div>
 <label class="k76file">فایل اصلی <small class="k80formats">Word · PDF · PowerPoint · Excel · Text · Image</small><input type="file" name="file" required accept=".docx,.pdf,.pptx,.xlsx,.txt,.md,.png,.jpg,.jpeg,.webp"></label>
 <button class="k76primary" type="submit">ثبت سند</button><div id="k76status"></div></form>`;

 if(up){
   const scope=x.querySelector('#k76scopeType'),wrap=x.querySelector('#k76unitWrap');
   const loadUnits=async()=>{
     const sel=x.querySelector('#k76unitSelect'),help=x.querySelector('#k76unitHelp');
     if(!sel)return;
     sel.innerHTML='<option value="">در حال دریافت ساختار سازمانی…</option>';
     try{
       const r=await api('/api/v1/organization/units'),units=r.units||[];
       sel.innerHTML=units.length
         ?'<option value="">انتخاب واحد سازمانی…</option>'+units.map(u=>`<option value="${esc(u.id)}" data-name="${esc(u.name)}">${esc(u.name)}</option>`).join('')
         :'<option value="">ساختار سازمانی هنوز تعریف نشده است</option>';
       if(help)help.textContent=units.length?'فهرست از ساختار سازمانی دریافت شد.':'پس از تعریف ساختار سازمانی، واحدها اینجا نمایش داده می‌شوند.';
     }catch(err){
       sel.innerHTML='<option value="">ساختار سازمانی هنوز متصل نشده است</option>';
       if(help)help.textContent='پس از عملیاتی‌شدن ساختار سازمانی، این فهرست به آن متصل می‌شود.';
     }
   };
   scope?.addEventListener('change',()=>{
     const show=scope.value==='unit';
     if(wrap)wrap.style.display=show?'block':'none';
     if(show)loadUnits();
   });
 }

 // Guard the short enhancement window only. Existing overlays then take ownership.
 const form=b.querySelector('#k76form');
 const guard=e=>{
   if(!form.dataset.k9926Ready)e.preventDefault();
 };
 form.addEventListener('submit',guard,false);
 setTimeout(()=>{form.dataset.k9926Ready='1'},500);
 x.scrollIntoView({block:'start',behavior:'smooth'});
}

function decorate(){
 const ctx=document.getElementById('workspaceContext');
 if(!ctx||!/دانش و اسناد سازمان/.test(ctx.textContent||''))return;

 // First pass: convert the two old clickable capability cards into static cards.
 ctx.querySelectorAll('.capability-card:not(.k9931-static-document-card)').forEach(original=>{
   const kind=kindOf(original);if(!kind)return;
   const label=kind==='upstream'?'اسناد بالادستی':'اسناد عمومی';

   // Clone only once. In 0.9.9.0.32 the restored visual class `capability-card`
   // caused already-static cards to be cloned repeatedly, which removed the CTA listener.
   const card=original.cloneNode(true);
   card.removeAttribute('data-capability');
   // Preserve the original visual card classes. Navigation remains disabled
   // because old listeners were removed by cloneNode and data-capability is gone.
   card.classList.add('capability-card','k9931-static-document-card','k9926-source-card');
   card.classList.remove('live');
   card.dataset.k9931Kind=kind;
   card.dataset.k9931Label=label;
   card.style.cursor='default';
   card.querySelectorAll('[data-k9922-register],[data-k9925-register],[data-k9926-register]').forEach(x=>x.remove());
   original.replaceWith(card);
 });

 // Second pass: static cards get exactly one explicit registration action.
 ctx.querySelectorAll('.k9931-static-document-card').forEach(card=>{
   const kind=card.dataset.k9931Kind;if(!kind)return;
   let btn=card.querySelector('[data-k9926-register]');
   if(!btn){
     btn=document.createElement('button');
     btn.type='button';
     btn.className='k9926-register';
     btn.dataset.k9926Register=kind;
     btn.textContent=kind==='upstream'?'ثبت سند بالادستی':'ثبت سند عمومی';
     card.appendChild(btn);
   }
   if(btn.dataset.k9933Bound!=='1'){
     btn.dataset.k9933Bound='1';
     btn.addEventListener('click',e=>{
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
       renderForm(btn.dataset.k9926Register||kind);
     },true);
   }
 });
 k9934ApplyCounts();
 k9934RefreshCounts(false);
}

let t;
new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{decorate();k9934ApplyCounts()},100)}).observe(document.documentElement,{childList:true,subtree:true});
decorate();
k9934RefreshCounts(true);
})();