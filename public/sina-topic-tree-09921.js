(()=>{
window.__SINA_TOPIC_TREE_BUILD__='0.9.9.2.1';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async p=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':ORG}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت درختواره موضوعی');return d};
const nz=v=>String(v||'').trim()||'بدون موضوع';
const labelKind=kind=>kind==='upstream'?'اسناد بالادستی':kind==='general'?'اسناد عمومی':'اسناد سازمان';
function build(items,kind){const map=new Map();for(const d of items||[]){if(kind&&d.documentClass!==kind)continue;const c=nz(d.subjectCategory),a=nz(d.subjectArea);if(!map.has(c))map.set(c,new Map());const sm=map.get(c);if(!sm.has(a))sm.set(a,[]);sm.get(a).push(d)}return[...map.entries()].map(([category,subs])=>({category,total:[...subs.values()].reduce((n,x)=>n+x.length,0),subs:[...subs.entries()].map(([area,docs])=>({area,total:docs.length})).sort((a,b)=>b.total-a.total||a.area.localeCompare(b.area,'fa'))})).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'))}
function openBank(filters){document.querySelector('.k9915overlay')?.remove();document.body.classList.remove('k9915-open');return window.__SINA_OPEN_DOCUMENT_BANK__?.(filters)}
function render(root,tree,q=''){const n=String(q||'').trim().toLowerCase(),f=tree.map(x=>{const ch=x.category.toLowerCase().includes(n);return{...x,subs:x.subs.filter(s=>ch||s.area.toLowerCase().includes(n))}}).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length);root.innerHTML=f.length?f.map((x,i)=>`<article class="k9915topic"><button type="button" class="k9915topic-head" data-topic="${esc(x.category)}" aria-expanded="${i<2}"><span class="k9915chev">${i<2?'⌄':'‹'}</span><div><b>${esc(x.category)}</b><small>${fa(x.total)} سند</small></div></button><div class="k9915subs"${i<2?'':' hidden'}>${x.subs.map(s=>`<button type="button" class="k9915sub" data-sub="${esc(s.area)}" data-parent="${esc(x.category)}"><span>${esc(s.area)}</span><b>${fa(s.total)} سند</b></button>`).join('')}</div></article>`).join(''):'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';root.querySelectorAll('.k9915topic-head').forEach(b=>{b.onclick=()=>{const box=b.nextElementSibling,op=box.hidden;box.hidden=!op;b.querySelector('.k9915chev').textContent=op?'⌄':'‹'};b.ondblclick=()=>openBank({subjectCategory:b.dataset.topic})});root.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.parent,subjectArea:b.dataset.sub}))}
const colors=['#1769aa','#7a4bb4','#14866d','#cf6b22','#a23b4b','#3f5aa8','#8d6b12','#bb4089','#237a87','#5b7f24'];
function buildWords(tree){const words=[];tree.forEach(x=>{words.push({label:x.category,count:x.total,type:'category',category:x.category});x.subs.forEach(s=>words.push({label:s.area,count:s.total,type:'sub',category:x.category,area:s.area}))});return words.filter(x=>x.label&&x.label!=='بدون موضوع').sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'fa'))}
function renderCloud(root,tree,q=''){
 const n=String(q||'').trim().toLowerCase();
 const categories=(tree||[]).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.some(s=>s.area.toLowerCase().includes(n)));
 if(!categories.length){root.innerHTML='<div class="k9915empty">واژه‌ای مطابق جستجو پیدا نشد.</div>';return}
 // The dominant macro-topic is the visual anchor of the cloud. Its subtopics orbit it.
 const main=categories.slice().sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'))[0];
 const subs=[];
 for(const c of categories){
   for(const s of c.subs){
     if(n&&!c.category.toLowerCase().includes(n)&&!s.area.toLowerCase().includes(n))continue;
     subs.push({label:s.area,count:s.total,category:c.category,area:s.area});
   }
 }
 subs.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'fa'));
 const max=Math.max(1,...subs.map(x=>x.count)),min=Math.min(...subs.map(x=>x.count));
 const golden=2.399963229728653;
 const placed=subs.map((w,i)=>{
   const ratio=max===min?.72:.52+.48*((w.count-min)/(max-min));
   const size=(13+ratio*17).toFixed(1);
   // Deterministic irregular orbital placement: wider near the outside, with a subtle vertical bias.
   const t=(i+.65)/(Math.max(1,subs.length)+.7);
   const radius=18+34*Math.sqrt(t);
   const angle=i*golden + (i%3)*.19;
   const x=50 + Math.cos(angle)*radius*1.18;
   const y=52 + Math.sin(angle)*radius*.72;
   const rot=[0,-4,3,0,5,-3][i%6];
   return `<button type="button" class="k9916word k9916orbit" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--rot:${rot}deg;font-size:${size}px;color:${colors[(i+1)%colors.length]}" data-word-type="sub" data-cat="${esc(w.category)}" data-area="${esc(w.area)}" title="${fa(w.count)} سند">${esc(w.label)}</button>`;
 }).join('');
 const secondary=categories.filter(x=>x!==main).slice(0,5).map((c,i)=>{
   const angle=(i/(Math.max(1,categories.length-1)))*Math.PI*2-.7;
   const x=50+Math.cos(angle)*31,y=51+Math.sin(angle)*23;
   return `<button type="button" class="k9916word k9916macro-secondary" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;color:${colors[(i+6)%colors.length]}" data-word-type="category" data-cat="${esc(c.category)}" data-area="" title="${fa(c.total)} سند">${esc(c.category)}</button>`;
 }).join('');
 root.innerHTML=`<div class="k9916cloud k9916radial-cloud"><button type="button" class="k9916word main k9916macro-center" data-word-type="category" data-cat="${esc(main.category)}" data-area="" title="${fa(main.total)} سند">${esc(main.category)}</button>${placed}${secondary}</div>`;
 root.querySelectorAll('.k9916word').forEach(b=>b.onclick=()=>openBank(b.dataset.wordType==='category'?{subjectCategory:b.dataset.cat}:{subjectCategory:b.dataset.cat,subjectArea:b.dataset.area}));
}
async function openTree(kind=''){
 document.querySelector('.k9915overlay')?.remove();
 const w=document.createElement('div');w.className='k9915overlay';
 w.innerHTML=`<section class="k9915panel"><header><div><small>سینا · ناوبری موضوعی بانک اسناد</small><h2>موضوعات ${labelKind(kind)}</h2><p>موضوعات از فیلد «موضوع کلان» و «زیرموضوع» خود اسناد ساخته می‌شوند.</p></div><button type="button" data-close>×</button></header><div class="k9916viewtabs"><button type="button" class="on" data-view="tree">درختواره موضوعی</button><button type="button" data-view="cloud">ابر کلمات</button></div><div class="k9915tools"><div class="k9915search"><span>⌕</span><input type="search" placeholder="جستجو در موضوعات و زیرموضوعات…" data-search></div><div class="k9915legend"><span>کلیک = جستجو در بانک اسناد</span></div></div><div class="k9915stats" data-stats><span>در حال دریافت موضوعات…</span></div><div class="k9915tree" data-tree><div class="k9915loading">در حال ساخت نمای موضوعی…</div></div></section>`;
 document.body.appendChild(w);document.body.classList.add('k9915-open');const close=()=>{w.remove();document.body.classList.remove('k9915-open')};w.querySelector('[data-close]').onclick=close;w.onclick=e=>{if(e.target===w)close()};
 try{const d=await api('/api/v1/knowledge/document-bank?snippetLimit=1'),tree=build(d.items||[],kind),total=tree.reduce((n,x)=>n+x.total,0),subCount=tree.reduce((n,x)=>n+x.subs.length,0);w.querySelector('[data-stats]').innerHTML=`<span><b>${fa(tree.length)}</b> موضوع کلان</span><span><b>${fa(subCount)}</b> زیرموضوع</span><span><b>${fa(total)}</b> سند</span>`;const box=w.querySelector('[data-tree]'),search=w.querySelector('[data-search]');let view='tree';const rerender=()=>view==='tree'?render(box,tree,search.value):renderCloud(box,tree,search.value);rerender();search.oninput=rerender;w.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{view=btn.dataset.view;w.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('on',x===btn));rerender()})}catch(e){w.querySelector('[data-tree]').innerHTML=`<div class="k9915empty">${esc(e.message)}</div>`}
}
function findDocSection(ctx){
 const cards=[...ctx.querySelectorAll('.k9931-static-document-card')].filter(c=>['upstream','general'].includes(c.dataset.k9931Kind||''));if(cards.length<2)return cards[0]?.parentElement||null;
 const labels=[...ctx.querySelectorAll('b,h1,h2,h3,h4,span,div')].filter(el=>String(el.textContent||'').trim()==='اسناد سازمان');
 for(const label of labels){let n=label;while(n&&n!==ctx){if(cards.every(c=>n.contains(c)))return n;n=n.parentElement}}
 let a=cards[0];while(a&&a!==ctx){if(cards.every(c=>a.contains(c)))return a;a=a.parentElement}return cards[0].parentElement;
}
function ensureToolbar(ctx){
 let bar=ctx.querySelector('#sinaDocumentToolbar9919');const section=findDocSection(ctx);if(!section)return bar;
 if(!bar){bar=document.createElement('div');bar.id='sinaDocumentToolbar9919';bar.className='k9919-doc-toolbar';bar.dataset.release='0.9.9.1.9'}
 if(section.parentElement&&bar.nextElementSibling!==section)section.parentElement.insertBefore(bar,section);return bar;
}
window.__SINA_ENSURE_DOCUMENT_TOOLBAR__=ensureToolbar;
function dedupeBankCards(ctx){const cards=[...ctx.querySelectorAll('.capability-card')].filter(c=>String(c.dataset.capability||c.querySelector('b')?.textContent||'').trim()==='بانک اسناد');cards.slice(1).forEach(c=>c.remove())}
function sep(){const s=document.createElement('span');s.className='k9919sep';s.textContent='|';return s}
function decorate(){
 const ctx=document.getElementById('workspaceContext');if(!ctx||!/دانش و اسناد سازمان/.test(ctx.textContent||''))return;dedupeBankCards(ctx);
 const bar=ensureToolbar(ctx);if(bar&&!bar.querySelector('[data-k9919-global-tree]')){const b=document.createElement('button');b.type='button';b.className='k9919tool k9919tree-tool';b.dataset.k9919GlobalTree='1';b.innerHTML='<span>⌘</span><div><b>درختواره و ابر کلمات</b><small>مرور موضوعات و فراوانی واژه‌ها</small></div>';b.onclick=e=>{e.preventDefault();e.stopPropagation();openTree('')};bar.appendChild(b)}
 ctx.querySelectorAll('.k9931-static-document-card').forEach(card=>{const kind=card.dataset.k9931Kind;if(!['upstream','general'].includes(kind))return;let rail=card.querySelector('.k9919-card-actions');if(!rail){rail=document.createElement('div');rail.className='k9919-card-actions';card.appendChild(rail)}const reg=card.querySelector('[data-k9926-register]');if(reg){reg.textContent='ثبت سند';if(reg.parentElement!==rail)rail.appendChild(reg)}let bulk=rail.querySelector('[data-k9919-card-bulk]');if(!bulk){rail.appendChild(sep());bulk=document.createElement('button');bulk.type='button';bulk.className='k9919-card-bulk';bulk.dataset.k9919CardBulk=kind;bulk.textContent='ثبت جمعی';bulk.onclick=e=>{e.preventDefault();e.stopPropagation();window.__SINA_OPEN_BULK_INTAKE__?.(kind)};rail.appendChild(bulk)}let tree=rail.querySelector('[data-k9919-card-tree]');if(!tree){rail.appendChild(sep());tree=document.createElement('button');tree.type='button';tree.className='k9919-card-tree';tree.dataset.k9919CardTree=kind;tree.textContent='درختواره';tree.onclick=e=>{e.preventDefault();e.stopPropagation();openTree(kind)};rail.appendChild(tree)}});
}
window.__SINA_OPEN_TOPIC_TREE__=openTree;let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,80)}).observe(document.documentElement,{childList:true,subtree:true});decorate();
})();
