(()=>{
window.__SINA_TOPIC_TREE_BUILD__='0.9.9.1.6';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async p=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':ORG}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت درختواره موضوعی');return d};
const normalize=v=>String(v||'').trim()||'بدون موضوع';
function buildTree(items,kind){
 const map=new Map();
 for(const d of(items||[])){if(kind&&d.documentClass!==kind)continue;const cat=normalize(d.subjectCategory),area=normalize(d.subjectArea);if(!map.has(cat))map.set(cat,new Map());const sub=map.get(cat);if(!sub.has(area))sub.set(area,[]);sub.get(area).push(d)}
 return [...map.entries()].map(([category,subs])=>({category,total:[...subs.values()].reduce((n,a)=>n+a.length,0),subs:[...subs.entries()].map(([area,docs])=>({area,total:docs.length,docs})).sort((a,b)=>b.total-a.total||a.area.localeCompare(b.area,'fa'))})).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'));
}
function labelKind(kind){return kind==='upstream'?'اسناد بالادستی':kind==='general'?'اسناد عمومی':'همه اسناد'}
async function openBank(filters={}){document.querySelector('.k9915overlay')?.remove();if(typeof window.__SINA_OPEN_DOCUMENT_BANK__==='function')return window.__SINA_OPEN_DOCUMENT_BANK__(filters)}
function filterTree(tree,q=''){const n=String(q||'').trim().toLowerCase();return tree.map(x=>{const hit=x.category.toLowerCase().includes(n),subs=x.subs.filter(s=>hit||s.area.toLowerCase().includes(n));return{...x,subs}}).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length)}
function renderTree(root,tree,q=''){
 const filtered=filterTree(tree,q);
 root.innerHTML=filtered.length?filtered.map((x,i)=>`<article class="k9915topic"><button type="button" class="k9915topic-head" data-topic="${esc(x.category)}" aria-expanded="${i<2?'true':'false'}"><span class="k9915chev">${i<2?'⌄':'‹'}</span><div><b>${esc(x.category)}</b><small>${fa(x.total)} سند</small></div></button><div class="k9915subs"${i<2?'':' hidden'}>${x.subs.map(s=>`<button type="button" class="k9915sub" data-sub="${esc(s.area)}" data-parent="${esc(x.category)}"><span>${esc(s.area)}</span><b>${fa(s.total)} سند</b></button>`).join('')}</div></article>`).join(''):'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';
 root.querySelectorAll('.k9915topic-head').forEach(b=>{b.onclick=()=>{const box=b.nextElementSibling,open=box.hidden;box.hidden=!open;b.setAttribute('aria-expanded',open?'true':'false');b.querySelector('.k9915chev').textContent=open?'⌄':'‹'};b.ondblclick=()=>openBank({subjectCategory:b.dataset.topic})});
 root.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.parent,subjectArea:b.dataset.sub}));
}
function renderCloud(root,tree,q=''){
 const filtered=filterTree(tree,q);
 const max=Math.max(1,...filtered.map(x=>x.total));
 root.innerHTML=filtered.length?`<div class="k9916cloud-grid">${filtered.map((x,ix)=>{
   const scale=.9+(x.total/max)*.55;
   return `<section class="k9916cluster"><button type="button" class="k9916macro" data-cloud-topic="${esc(x.category)}" style="--s:${scale.toFixed(2)}"><span>${esc(x.category)}</span><b>${fa(x.total)}</b></button><div class="k9916orbit">${x.subs.map((s,i)=>`<button type="button" class="k9916micro tone-${(i+ix)%5}" data-cloud-sub="${esc(s.area)}" data-cloud-parent="${esc(x.category)}" style="--w:${Math.min(1.45,.85+s.total/Math.max(1,x.total))}"><span>${esc(s.area)}</span><small>${fa(s.total)}</small></button>`).join('')}</div></section>`;
 }).join('')}</div>`:'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';
 root.querySelectorAll('[data-cloud-topic]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.cloudTopic}));
 root.querySelectorAll('[data-cloud-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.cloudParent,subjectArea:b.dataset.cloudSub}));
}
async function openTree(kind=''){
 document.querySelector('.k9915overlay')?.remove();
 const w=document.createElement('div');w.className='k9915overlay';
 w.innerHTML=`<section class="k9915panel"><header><div><small>سینا · ناوبری موضوعی بانک اسناد</small><h2>درختواره موضوعی ${labelKind(kind)}</h2><p>موضوعات از «موضوع کلان» و «زیرموضوع» اسناد ساخته می‌شوند و مستقیماً به جستجوی بانک اسناد متصل‌اند.</p></div><button type="button" data-close>×</button></header>
 <div class="k9916tabs"><button type="button" class="on" data-tab="tree">درختواره</button><button type="button" data-tab="cloud">ابر موضوعی</button></div>
 <div class="k9915tools"><div class="k9915search"><span>⌕</span><input type="search" placeholder="جستجو در موضوعات و زیرموضوعات…" data-search></div><div class="k9915legend"><span>کلیک روی موضوع/زیرموضوع = جستجو در بانک اسناد</span></div></div>
 <div class="k9915stats" data-stats><span>در حال دریافت موضوعات…</span></div>
 <div class="k9915tree" data-view><div class="k9915loading">در حال ساخت نمای موضوعی…</div></div></section>`;
 document.body.appendChild(w);document.body.classList.add('k9915-open');const close=()=>{w.remove();document.body.classList.remove('k9915-open')};w.querySelector('[data-close]').onclick=close;w.onclick=e=>{if(e.target===w)close()};
 try{
  const d=await api('/api/v1/knowledge/document-bank?snippetLimit=1'),tree=buildTree(d.items||[],kind),total=tree.reduce((n,x)=>n+x.total,0),subs=tree.reduce((n,x)=>n+x.subs.length,0),view=w.querySelector('[data-view]'),search=w.querySelector('[data-search]');
  w.querySelector('[data-stats]').innerHTML=`<span><b>${fa(tree.length)}</b> موضوع کلان</span><span><b>${fa(subs)}</b> زیرموضوع</span><span><b>${fa(total)}</b> سند</span>`;
  let mode='tree',query='';
  const redraw=()=>mode==='tree'?renderTree(view,tree,query):renderCloud(view,tree,query);
  redraw();search.oninput=e=>{query=e.target.value;redraw()};
  w.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{mode=b.dataset.tab;w.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===b));redraw()});
 }catch(e){w.querySelector('[data-view]').innerHTML=`<div class="k9915empty">${esc(e.message)}</div>`}
}
function sep(){const s=document.createElement('span');s.className='k9916sep';s.textContent='|';return s}
function action(label,cls,onClick){const b=document.createElement('button');b.type='button';b.className='k9916inline-action '+cls;b.textContent=label;b.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();onClick()};return b}
function makeActionRow(card,kind){
 let row=card.querySelector('.k9916actions');if(row)return row;
 row=document.createElement('div');row.className='k9916actions';card.appendChild(row);
 if(kind==='upstream'||kind==='general'){
   const reg=card.querySelector('[data-k9926-register]');
   if(reg){reg.classList.add('k9916inline-action','k9916-orange');reg.textContent=kind==='upstream'?'ثبت سند بالادستی':'ثبت سند عمومی';row.appendChild(reg)}
   row.appendChild(sep());row.appendChild(action('درختواره موضوعی','k9916-orange',()=>openTree(kind)));
   row.appendChild(sep());row.appendChild(action('ورود دسته جمعی','k9916-orange',()=>window.__SINA_OPEN_BULK_INTAKE__?.(kind)));
 }else if(kind==='bank'){
   row.appendChild(action('مشاهده همه اسناد','k9916-orange',()=>openBank({})));
   row.appendChild(sep());row.appendChild(action('درختواره موضوعی کل','k9916-orange',()=>openTree('')));
 }
 return row;
}
function bankCardOf(ctx){return [...ctx.querySelectorAll('.capability-card')].find(c=>/بانک اسناد/.test(c.textContent||''))||null}
function decorate(){
 const ctx=document.getElementById('workspaceContext');if(!ctx||!/دانش و اسناد سازمان/.test(ctx.textContent||''))return;
 // remove old standalone topic-tree/bulk bars: actions now live inside document cards.
 ctx.querySelectorAll('[data-k9914-bulk],[data-k9915-global-tree]').forEach(x=>x.remove());
 ctx.querySelectorAll('.k9931-static-document-card').forEach(card=>{const kind=card.dataset.k9931Kind;if(kind)makeActionRow(card,kind)});
 let bank=bankCardOf(ctx);
 if(bank&&!bank.classList.contains('k9916-bank-static')){
   const clone=bank.cloneNode(true);clone.removeAttribute('data-capability');clone.classList.add('capability-card','k9916-bank-static');clone.classList.remove('live');clone.style.cursor='default';bank.replaceWith(clone);bank=clone;
 }
 if(bank)makeActionRow(bank,'bank');
}
window.__SINA_OPEN_TOPIC_TREE__=openTree;
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,120)}).observe(document.documentElement,{childList:true,subtree:true});decorate();
})();