(()=>{
window.__LEGAL_RELATION_CONTRACT_BUILD__='0.9.9.0.1';
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
   if(change)change.value=internalChange[t]||'';
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

 // Just before legacy listeners run, guarantee their hidden compatibility field has a value.
 form.addEventListener('submit',()=>{
   const t=type.value||'';
   if(change)change.value=internalChange[t]||'';
 },true);
}

function observe(){
 const run=()=>document.querySelectorAll('#k76form').forEach(configureRegistration);
 new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
 run();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();