(()=>{
window.__SINA_TOPIC_TREE_BUILD__='0.9.9.1.7';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async p=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':ORG}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت درختواره موضوعی');return d};
const nz=v=>String(v||'').trim()||'بدون موضوع';
function build(items,kind){const map=new Map();for(const d of items||[]){if(kind&&d.documentClass!==kind)continue;const c=nz(d.subjectCategory),a=nz(d.subjectArea);if(!map.has(c))map.set(c,new Map());const sm=map.get(c);if(!sm.has(a))sm.set(a,[]);sm.get(a).push(d)}return[...map.entries()].map(([category,subs])=>({category,total:[...subs.values()].reduce((n,x)=>n+x.length,0),subs:[...subs.entries()].map(([area,docs])=>({area,total:docs.length})).sort((a,b)=>b.total-a.total||a.area.localeCompare(b.area,'fa'))})).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'))}
function openBank(filters){document.querySelector('.k9915overlay')?.remove();document.body.classList.remove('k9915-open');return window.__SINA_OPEN_DOCUMENT_BANK__?.(filters)}
function render(root,tree,q=''){const n=String(q||'').trim().toLowerCase(),f=tree.map(x=>{const ch=x.category.toLowerCase().includes(n);return{...x,subs:x.subs.filter(s=>ch||s.area.toLowerCase().includes(n))}}).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length);root.innerHTML=f.length?f.map((x,i)=>`<article class="k9915topic"><button type="button" class="k9915topic-head" data-topic="${esc(x.category)}" aria-expanded="${i<2}"><span class="k9915chev">${i<2?'⌄':'‹'}</span><div><b>${esc(x.category)}</b><small>${fa(x.total)} سند</small></div></button><div class="k9915subs"${i<2?'':' hidden'}>${x.subs.map(s=>`<button type="button" class="k9915sub" data-sub="${esc(s.area)}" data-parent="${esc(x.category)}"><span>${esc(s.area)}</span><b>${fa(s.total)} سند</b></button>`).join('')}</div></article>`).join(''):'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';root.querySelectorAll('.k9915topic-head').forEach(b=>{b.onclick=()=>{const box=b.nextElementSibling,op=box.hidden;box.hidden=!op;b.querySelector('.k9915chev').textContent=op?'⌄':'‹'};b.ondblclick=()=>openBank({subjectCategory:b.dataset.topic})});root.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.parent,subjectArea:b.dataset.sub}))}

function colorFor(i){
 const colors=['#1769aa','#7a4bb4','#14866d','#cf6b22','#a23b4b','#3f5aa8','#8d6b12','#bb4089','#237a87','#5b7f24'];
 return colors[i%colors.length];
}
function buildWords(tree){
 const words=[];
 tree.forEach((x,i)=>{
   words.push({label:x.category,count:x.total,type:'category',category:x.category});
   x.subs.forEach(s=>words.push({label:s.area,count:s.total,type:'sub',category:x.category,area:s.area}));
 });
 return words.filter(x=>x.label&&x.label!=='بدون موضوع').sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'fa'));
}
function renderCloud(root,tree,q=''){
 const n=String(q||'').trim().toLowerCase(),all=buildWords(tree),words=all.filter(x=>!n||x.label.toLowerCase().includes(n));
 if(!words.length){root.innerHTML='<div class="k9915empty">واژه‌ای مطابق جستجو پیدا نشد.</div>';return}
 const max=Math.max(...words.map(x=>x.count)),min=Math.min(...words.map(x=>x.count));
 root.innerHTML=`<div class="k9916cloud">${words.map((w,i)=>{
   const ratio=max===min?.72:.72+.28*((w.count-min)/(max-min));
   const size=(12+ratio*28).toFixed(1);
   return `<button type="button" class="k9916word ${w.type==='category'?'main':''}" style="font-size:${size}px;color:${colorFor(i)}" data-word-type="${w.type}" data-cat="${esc(w.category)}" data-area="${esc(w.area||'')}" title="${fa(w.count)} سند">${esc(w.label)}</button>`;
 }).join('')}</div>`;
 root.querySelectorAll('.k9916word').forEach(b=>b.onclick=()=>openBank(b.dataset.wordType==='category'?{subjectCategory:b.dataset.cat}:{subjectCategory:b.dataset.cat,subjectArea:b.dataset.area}));
}

async function openTree(kind=''){
 document.querySelector('.k9915overlay')?.remove();
 const w=document.createElement('div');w.className='k9915overlay';
 w.innerHTML=`<section class="k9915panel"><header><div><small>سینا · ناوبری موضوعی بانک اسناد</small><h2>موضوعات ${labelKind(kind)}</h2><p>موضوعات از فیلد «موضوع کلان» و «زیرموضوع» خود اسناد ساخته می‌شوند.</p></div><button type="button" data-close>×</button></header>
 <div class="k9916viewtabs"><button type="button" class="on" data-view="tree">درختواره موضوعی</button><button type="button" data-view="cloud">ابر کلمات</button></div>
 <div class="k9915tools"><div class="k9915search"><span>⌕</span><input type="search" placeholder="جستجو در موضوعات و زیرموضوعات…" data-search></div><div class="k9915legend"><span>کلیک = جستجو در بانک اسناد</span></div></div>
 <div class="k9915stats" data-stats><span>در حال دریافت موضوعات…</span></div>
 <div class="k9915tree" data-tree><div class="k9915loading">در حال ساخت نمای موضوعی…</div></div></section>`;
 document.body.appendChild(w);document.body.classList.add('k9915-open');
 const close=()=>{w.remove();document.body.classList.remove('k9915-open')};w.querySelector('[data-close]').onclick=close;w.onclick=e=>{if(e.target===w)close()};
 try{
  const d=await api('/api/v1/knowledge/document-bank?snippetLimit=1'),tree=build(d.items||[],kind),total=tree.reduce((n,x)=>n+x.total,0),subCount=tree.reduce((n,x)=>n+x.subs.length,0);
  w.querySelector('[data-stats]').innerHTML=`<span><b>${fa(tree.length)}</b> موضوع کلان</span><span><b>${fa(subCount)}</b> زیرموضوع</span><span><b>${fa(total)}</b> سند</span>`;
  const box=w.querySelector('[data-tree]'),search=w.querySelector('[data-search]');let view='tree';
  const rerender=()=>view==='tree'?render(box,tree,search.value):renderCloud(box,tree,search.value);
  rerender();search.oninput=rerender;
  w.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{view=btn.dataset.view;w.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('on',x===btn));rerender()});
 }catch(e){w.querySelector('[data-tree]').innerHTML=`<div class="k9915empty">${esc(e.message)}</div>`}
}
function k9916Toolbar(ctx){
 let bar=ctx.querySelector('.k9916-doc-toolbar');if(bar)return bar;
 const section=[...ctx.querySelectorAll('.capability-section,.workspace-section,.section-card')].find(x=>/اسناد سازمان/.test(x.textContent||''))||ctx.querySelector('.capability-section,.workspace-section,.section-card')||ctx;
 bar=document.createElement('div');bar.className='k9916-doc-toolbar';
 const firstCard=section.querySelector('.capability-card,.k9931-static-document-card');
 if(firstCard)firstCard.parentElement.insertBefore(bar,firstCard);else section.prepend(bar);
 return bar;
}
function k9916DedupeBankCards(ctx){
 const cards=[...ctx.querySelectorAll('.capability-card')].filter(c=>{
   const label=String(c.dataset.capability||c.querySelector('b')?.textContent||'').trim();
   return label==='بانک اسناد';
 });
 cards.slice(1).forEach(c=>c.remove());
}
function decorate(){
 const ctx=document.getElementById('workspaceContext');if(!ctx||!/دانش و اسناد سازمان/.test(ctx.textContent||''))return;
 k9916DedupeBankCards(ctx);
 const bar=k9916Toolbar(ctx);
 // remove legacy standalone tree button from grid
 ctx.querySelectorAll('[data-k9915-global-tree]').forEach(x=>{if(!x.closest('.k9916-doc-toolbar'))x.remove()});
 if(!bar.querySelector('[data-k9915-global-tree]')){
   const b=document.createElement('button');b.type='button';b.className='k9915global-tree k9916tool';b.dataset.k9915GlobalTree='1';b.innerHTML='<span>⌘</span><div><b>درختواره و ابر کلمات</b><small>مرور موضوعات، زیرموضوعات و فراوانی</small></div>';b.onclick=()=>openTree('');bar.appendChild(b);
 }
 ctx.querySelectorAll('.k9931-static-document-card').forEach(card=>{
   const kind=card.dataset.k9931Kind;if(!kind)return;
   let rail=card.querySelector('.k9916-card-actions');
   if(!rail){rail=document.createElement('div');rail.className='k9916-card-actions';card.appendChild(rail)}
   let b=rail.querySelector('[data-k9915-topic-tree]');
   if(!b){b=document.createElement('button');b.type='button';b.className='k9915card-tree';b.dataset.k9915TopicTree=kind;b.textContent='موضوعات';b.onclick=e=>{e.preventDefault();e.stopPropagation();openTree(kind)};rail.appendChild(b)}
 });
}
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,120)}).observe(document.documentElement,{childList:true,subtree:true});decorate();
})();
