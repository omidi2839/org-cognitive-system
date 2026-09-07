(()=>{
window.__DOCUMENT_RELATION_UI_BUILD__='0.9.4.4';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const FA='۰۱۲۳۴۵۶۷۸۹',toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const api=async(p,opts={})=>{
 const r=await fetch(p,{...opts,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.message||'خطا');
 return d;
};

function itemTemplate(i=1){
 return `<div class="k944changeitem" data-change-item>
   <div class="k944itemhead"><b>مورد اصلاح ${toFa(i)}</b><button type="button" data-remove-change title="حذف این مورد">×</button></div>
   <div class="k944itemgrid">
     <label>ماده<input data-change-article placeholder="مثلاً ۷"></label>
     <label>بند / تبصره<input data-change-clause placeholder="مثلاً تبصره ۲"></label>
     <label class="wide">شرح تغییر<textarea data-change-description rows="2" placeholder="شرح دقیق اینکه این ماده یا تبصره چگونه تغییر می‌کند"></textarea></label>
   </div>
 </div>`;
}
function renumberItems(wrap){
 [...wrap.querySelectorAll('[data-change-item]')].forEach((x,i)=>{
   const b=x.querySelector('.k944itemhead b');if(b)b.textContent=`مورد اصلاح ${toFa(i+1)}`;
   const rm=x.querySelector('[data-remove-change]');if(rm)rm.style.visibility=wrap.querySelectorAll('[data-change-item]').length>1?'visible':'hidden';
 });
}
function collectItems(wrap){
 return [...wrap.querySelectorAll('[data-change-item]')].map(x=>({
   article:x.querySelector('[data-change-article]')?.value.trim()||'',
   clause:x.querySelector('[data-change-clause]')?.value.trim()||'',
   description:x.querySelector('[data-change-description]')?.value.trim()||''
 })).filter(x=>x.article||x.clause||x.description);
}
function configureRelationEntry(form){
 const wrap=form.querySelector('.k94relationentry');if(!wrap||wrap.dataset.v944)return;
 wrap.dataset.v944='1';
 wrap.classList.add('k944relationentry');

 const title=wrap.querySelector('.k94relationtitle');
 if(title)title.innerHTML='<b>ارتباط حقوقی با سند قبلی</b><span>اگر سند جدید، سند دیگری را اصلاح، ملغی یا تفسیر می‌کند، ارتباط را در همین‌جا ثبت کنید.</span>';

 const type=wrap.querySelector('[data-reltype]');
 if(type){
   type.innerHTML=`<option value="">بدون ارتباط</option>
     <option value="amends">اصلاحیه سند</option>
     <option value="repeals">ملغی کردن سند</option>
     <option value="clarifies">استفسار سند</option>`;
 }

 const change=wrap.querySelector('[data-relchange]');
 if(change){
   change.required=false;
   change.innerHTML=`<option value="">انتخاب نوع تغییر…</option>
     <option value="اصلاح متن">اصلاح متن</option>
     <option value="جایگزینی متن">جایگزینی متن</option>
     <option value="حذف">حذف</option>
     <option value="الحاق">الحاق</option>
     <option value="تغییر دامنه">تغییر دامنه</option>
     <option value="تمدید اعتبار">تمدید اعتبار</option>
     <option value="تفسیر/توضیح">تفسیر / توضیح</option>`;
 }

 // Keep legacy fields for compatibility with 0.9.4.0 submit listener, but hide them.
 const oldArticle=wrap.querySelector('[data-relarticle]')?.closest('label');
 const oldClause=wrap.querySelector('[data-relclause]')?.closest('label');
 if(oldArticle)oldArticle.classList.add('k944legacyhide');
 if(oldClause)oldClause.classList.add('k944legacyhide');

 let items=wrap.querySelector('.k944items');
 if(!items){
   items=document.createElement('section');items.className='k944items';
   items.innerHTML=`<div class="k944itemshead"><div><b>مواد و تبصره‌های مشمول تغییر</b><span>برای هر ماده یا تبصره یک مورد جداگانه ثبت کنید.</span></div><button type="button" data-add-change>+ افزودن ماده / تبصره</button></div><div class="k944itemsbody">${itemTemplate(1)}</div>`;
   wrap.querySelector('.k94relationgrid')?.insertAdjacentElement('afterend',items);
 }
 items.querySelector('[data-add-change]').onclick=()=>{
   const body=items.querySelector('.k944itemsbody');
   body.insertAdjacentHTML('beforeend',itemTemplate(body.querySelectorAll('[data-change-item]').length+1));
   renumberItems(items);
 };
 items.addEventListener('click',e=>{
   const b=e.target.closest('[data-remove-change]');if(!b)return;
   if(items.querySelectorAll('[data-change-item]').length<=1)return;
   b.closest('[data-change-item]')?.remove();renumberItems(items);
 });

 // Validation + synchronize first item into old fields so legacy relation creation still succeeds.
 form.addEventListener('submit',e=>{
   const relType=type?.value||'', relDoc=wrap.querySelector('[data-reldoc]')?.value||'', changeType=change?.value||'';
   if(!relType)return;
   if(!relDoc){e.preventDefault();e.stopImmediatePropagation();alert('برای ثبت ارتباط، سند مرتبط را انتخاب کنید.');return}
   if(!changeType){e.preventDefault();e.stopImmediatePropagation();alert('نوع تغییر الزامی است.');return}
   const changes=collectItems(items);
   if(!changes.length){e.preventDefault();e.stopImmediatePropagation();alert('حداقل یک ماده، تبصره یا شرح تغییر ثبت کنید.');return}
   const first=changes[0];
   const a=wrap.querySelector('[data-relarticle]'),c=wrap.querySelector('[data-relclause]');
   if(a)a.value=first.article;if(c)c.value=first.clause;

   // After legacy POST reports success, enrich the SAME relation with all changeItems.
   const st=form.querySelector('#k76status')||document.getElementById('k76status');if(!st)return;
   const payloadBase={relationType:relType,relatedDocumentId:relDoc,changeType,note:wrap.querySelector('[data-relnote]')?.value.trim()||'',changeItems:changes};
   const mo=new MutationObserver(async()=>{
     const text=st.textContent||'',m=text.match(/DOC:[A-Za-z0-9:_-]+/);
     if(!m||!text.includes('ارتباط سند نیز ثبت شد'))return;
     mo.disconnect();
     try{
       await api('/api/v1/knowledge/document-relations',{method:'POST',body:JSON.stringify({documentId:m[0],...payloadBase})});
       st.insertAdjacentHTML('beforeend','<br><b class="k944enriched">جزئیات مواد و تبصره‌ها نیز ذخیره شد.</b>');
     }catch(err){
       st.insertAdjacentHTML('beforeend',`<br><span class="k94relwarn">ارتباط ثبت شد، اما جزئیات مواد ذخیره نشد: ${esc(err.message)}</span>`);
     }
   });
   mo.observe(st,{childList:true,subtree:true,characterData:true});
 },true);

 renumberItems(items);
}

/* Enhanced popup rendering */
function changeItemsHtml(r){
 const arr=Array.isArray(r.changeItems)?r.changeItems:[];
 if(!arr.length)return '';
 return `<div class="k944changes">${arr.map((x,i)=>`<div class="k944changeview">
   <span>${toFa(i+1)}</span>
   <div><b>${x.article?`ماده ${esc(x.article)}`:'مورد اصلاح'}${x.clause?` · ${esc(x.clause)}`:''}</b>${x.description?`<p>${esc(x.description)}</p>`:''}</div>
 </div>`).join('')}</div>`;
}
function relationRow(r){
 const rd=r.relatedDocument||{};
 return `<article class="k944relcard">
   <div class="k944relmain">
     <span class="k944type ${esc(r.perspectiveType||'')}">${esc(r.label||r.perspectiveType||'ارتباط')}</span>
     <button type="button" data-doc-preview="${esc(rd.id||'')}">${esc(rd.title||'بدون عنوان')}</button>
     ${r.changeType?`<small>${esc(r.changeType)}</small>`:''}
   </div>
   ${changeItemsHtml(r)}
   ${r.note?`<div class="k944note">${esc(r.note)}</div>`:''}
 </article>`;
}
async function renderRelations(docId,body){
 body.querySelectorAll('.k94relations,.k93relations').forEach(x=>x.remove());
 const box=document.createElement('section');box.className='k94relations k944relations';
 box.innerHTML='<div class="k94relwait">در حال دریافت سوابق سند…</div>';body.prepend(box);
 try{
   let d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
   const items=d.items||[],sum=d.summary||{};
   box.innerHTML=`<div class="k944relhead">
     <div class="k944icon">↔</div>
     <div class="k944headcopy"><small>وضعیت حقوقی سند</small><b>اصلاحات و سوابق این سند</b><span>${esc(sum.statusLabel||'بدون اصلاحیه ثبت‌شده')}</span></div>
     <strong>${toFa(sum.total??items.length)} ارتباط</strong>
   </div>
   ${items.length?`<div class="k944rellist">${items.map(relationRow).join('')}</div>`:'<div class="k944empty">برای این سند هنوز هیچ اصلاحیه، لغو یا استفساری ثبت نشده است.</div>'}`;
 }catch(e){box.innerHTML=`<div class="k94relerror">سوابق سند در دسترس نیست: ${esc(e.message)}</div>`}
}

let pending=null;
function attach(){if(!pending)return;const body=document.querySelector('#k91docmodal .k91modalbody');if(!body)return;const id=pending;pending=null;renderRelations(id,body)}
window.addEventListener('click',e=>{const p=e.target?.closest?.('[data-doc-preview]');if(!p?.dataset.docPreview)return;pending=p.dataset.docPreview;setTimeout(attach,0)},true);
new MutationObserver(()=>{document.querySelectorAll('#k76form').forEach(configureRelationEntry);if(pending)attach()}).observe(document.documentElement,{subtree:true,childList:true});
document.querySelectorAll('#k76form').forEach(configureRelationEntry);
})();