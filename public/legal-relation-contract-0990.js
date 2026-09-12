(()=>{
window.__LEGAL_RELATION_CONTRACT_BUILD__='0.9.9.0.26';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const FA='۰۱۲۳۴۵۶۷۸۹',toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);

const TYPES=[
 ['amends','اصلاحیه'],
 ['extends','الحاقیه'],
 ['repeals','ملغی'],
 ['clarifies','استفسار']
];
const typeMap=Object.fromEntries(TYPES);
const internalChange={amends:'اصلاح متن',extends:'الحاق',repeals:'لغو',clarifies:'تفسیر/توضیح'};
const textLabel={amends:'متن کامل اصلاحی',extends:'متن کامل الحاقیه',repeals:'متن/شرح بخش ملغی',clarifies:'متن کامل استفسار'};
const itemTitle={amends:'مورد اصلاح',extends:'مورد الحاق',repeals:'مورد ملغی',clarifies:'مورد استفسار'};

function ensureInternalChangeControl(change,t){
 if(!change)return;
 const v=internalChange[t]||'';
 change.required=false;
 change.removeAttribute('required');
 if(!v){change.value='';return}
 if(change.tagName==='SELECT'){
   const exists=[...change.options].some(o=>o.value===v);
   if(!exists){
     const op=document.createElement('option');
     op.value=v;op.textContent=v;op.dataset.k9921Compat='1';
     change.appendChild(op);
   }
 }
 change.value=v;
 // Compatibility with legacy validators that inspect attributes/defaultValue.
 try{change.setAttribute('value',v)}catch{}
 try{change.defaultValue=v}catch{}
}
function syncLegacyChangeBeforeSubmit(form){
 const wrap=form?.querySelector('.k94relationentry');if(!wrap)return;
 const t=wrap.querySelector('[data-reltype]')?.value||'';
 const change=wrap.querySelector('[data-relchange]');
 ensureInternalChangeControl(change,t);
 // Also support older hidden fields by name, without touching article/description controls.
 const v=internalChange[t]||'';
 if(v)form.querySelectorAll('select[name*="changeType" i],input[name*="changeType" i],select[name*="relationChange" i],input[name*="relationChange" i]').forEach(el=>{
   if(el===change)return;
   el.required=false;el.removeAttribute('required');
   if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v)){
     const op=document.createElement('option');op.value=v;op.textContent=v;op.dataset.k9921Compat='1';el.appendChild(op);
   }
   el.value=v;try{el.setAttribute('value',v)}catch{}
 });
}


function relationKey(){return crypto?.randomUUID?.()||`REL-${Date.now()}-${Math.random().toString(36).slice(2)}`}
function snapshotCurrent(wrap){const relationType=wrap.querySelector('[data-reltype]')?.value||'',relatedDocumentId=wrap.querySelector('[data-reldoc]')?.value||'';if(!relationType||!relatedDocumentId)return null;const changeItems=[...wrap.querySelectorAll('[data-change-item]')].map(x=>({article:x.querySelector('[data-change-article]')?.value.trim()||'',clause:x.querySelector('[data-change-clause]')?.value.trim()||'',description:x.querySelector('[data-change-description]')?.value.trim()||''})).filter(x=>x.article||x.clause||x.description);return changeItems.length?{clientRelationKey:relationKey(),relationType,relatedDocumentId,changeItems}:null}
function clearCurrent(wrap){const t=wrap.querySelector('[data-reltype]'),d=wrap.querySelector('[data-reldoc]');if(t)t.value='';if(d)d.value='';const rows=[...wrap.querySelectorAll('[data-change-item]')];rows.slice(1).forEach(x=>x.remove());rows[0]?.querySelectorAll('input,textarea').forEach(x=>x.value='');t?.dispatchEvent(new Event('change',{bubbles:true}))}
function renderDrafts(form,wrap){let h=wrap.querySelector('[data-k990-relation-drafts]');if(!h){h=document.createElement('section');h.className='k990relation-drafts';h.dataset.k990RelationDrafts='1';wrap.querySelector('.k944items')?.insertAdjacentElement('beforebegin',h)}const a=form.__k990RelationDrafts||[];h.innerHTML=a.length?`<div class="k990draft-title"><b>ارتباط‌های حقوقی آماده ثبت</b><span>${toFa(a.length)} ارتباط مستقل</span></div>`+a.map((r,i)=>`<article><div><b>${toFa(i+1)}. ${esc(typeMap[r.relationType]||r.relationType)}</b><span>${toFa(r.changeItems.length)} محل حقوقی</span></div><button type="button" data-remove-draft="${i}">حذف</button></article>`).join(''):'';h.querySelectorAll('[data-remove-draft]').forEach(b=>b.onclick=()=>{a.splice(Number(b.dataset.removeDraft),1);renderDrafts(form,wrap)})}

function configureRegistration(form){
 const wrap=form?.querySelector('.k94relationentry'); if(!wrap)return;
 const type=wrap.querySelector('[data-reltype]'); if(!type)return;
 if(wrap.dataset.k990Contract==='1')return
 wrap.dataset.k990Contract='1';
 wrap.classList.add('k990legal-contract');

 const title=wrap.querySelector('.k94relationtitle');
 if(title)title.innerHTML='<b>ارتباط حقوقی با سند قبلی</b><span>نوع اثر حقوقی، محل دقیق و متن آن را صریح ثبت کنید؛ سامانه دیگر برای اعمال تغییر حدس نمی‌زند.</span>';

 type.innerHTML='<option value="">بدون ارتباط</option>'+TYPES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');

 const change=wrap.querySelector('[data-relchange]');
 if(change){
   change.required=false;
   const label=change.closest('label');
   if(label)label.classList.add('k990internal-field');
 }

 const oldNote=wrap.querySelector('[data-relnote]');
 if(oldNote){
   const label=oldNote.closest('label');
   if(label)label.classList.add('k990internal-field');
 }

 function sync(){
   const t=type.value||'';
   ensureInternalChangeControl(change,t);
   const items=wrap.querySelectorAll('[data-change-item]');
   items.forEach((item,i)=>{
     const head=item.querySelector('.k944itemhead b');
     if(head)head.textContent=`${itemTitle[t]||'مورد حقوقی'} ${toFa(i+1)}`;
     const ta=item.querySelector('[data-change-description]');
     if(ta){
       ta.placeholder=t?`${textLabel[t]} را دقیقاً همان‌گونه که باید در سند مادر دیده شود وارد کنید`:'ابتدا نوع ارتباط حقوقی را انتخاب کنید';
       const lab=ta.closest('label');
       if(lab){
         let tx=[...lab.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
         if(tx)tx.nodeValue=(textLabel[t]||'متن اثر حقوقی')+' ';
       }
     }
     const art=item.querySelector('[data-change-article]');
     if(art)art.placeholder='مثلاً ۹';
     const cl=item.querySelector('[data-change-clause]');
     if(cl)cl.placeholder='مثلاً تبصره ۱ یا بند الف';
   });
   const head=wrap.querySelector('.k944itemshead div');
   if(head)head.innerHTML=`<b>محل دقیق و متن ${typeMap[t]||'اثر حقوقی'}</b><span>برای هر ماده/تبصره/بند یک ردیف جدا ثبت کنید. متن واردشده منبع قطعی نمایش در سند مادر است.</span>`;
   const add=wrap.querySelector('[data-add-change]');
   if(add)add.textContent='+ افزودن ماده / تبصره / بند';
 }
 type.addEventListener('change',sync);
 const itemsBody=wrap.querySelector('.k944itemsbody');
 if(itemsBody){
   new MutationObserver(mutations=>{
     if(mutations.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))sync();
   }).observe(itemsBody,{childList:true});
 }
 sync();
 if(!wrap.querySelector('[data-add-legal-relation]')){const bar=document.createElement('div');bar.className='k990relation-actions';bar.innerHTML='<button type="button" data-add-legal-relation>+ افزودن ارتباط حقوقی دیگر</button><span>می‌توانید چند الحاقیه، اصلاحیه، ملغی یا استفسار مستقل تعریف کنید.</span>';wrap.querySelector('.k944items')?.insertAdjacentElement('afterend',bar);bar.querySelector('[data-add-legal-relation]').onclick=()=>{const snap=snapshotCurrent(wrap);if(!snap){alert('ابتدا نوع ارتباط، سند مرتبط و حداقل یک ماده/متن حقوقی را کامل کنید.');return}if(snap.changeItems.some(x=>!x.article||!x.description)){alert('برای هر مورد، ماده و متن کامل اثر حقوقی الزامی است.');return}form.__k990RelationDrafts=form.__k990RelationDrafts||[];form.__k990RelationDrafts.push(snap);renderDrafts(form,wrap);clearCurrent(wrap)}}renderDrafts(form,wrap);

 // Just before legacy listeners run, guarantee their hidden compatibility field has a value.
 form.addEventListener('submit',e=>{
   const t=type.value||'';
   if(change)change.value=internalChange[t]||'';
   if(!t)return;
   const rows=[...wrap.querySelectorAll('[data-change-item]')];
   const bad=rows.find(x=>{
     const article=x.querySelector('[data-change-article]')?.value.trim()||'';
     const text=x.querySelector('[data-change-description]')?.value.trim()||'';
     return !article||!text;
   });
   if(bad){
     e.preventDefault();e.stopImmediatePropagation();
     alert('برای هر اثر حقوقی، شماره ماده و متن کامل اصلاحیه/الحاقیه/ملغی/استفسار را وارد کنید.');
   }
 },true);
}

function observe(){
 document.addEventListener('click',e=>{
   const btn=e.target.closest?.('#k76form button[type="submit"],#k76form .k76primary');
   if(btn)syncLegacyChangeBeforeSubmit(btn.closest('form'));
 },true);
 document.addEventListener('submit',e=>{
   if(e.target?.matches?.('#k76form'))syncLegacyChangeBeforeSubmit(e.target);
 },true);
 const run=()=>document.querySelectorAll('#k76form').forEach(configureRegistration);
 new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
 run();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();