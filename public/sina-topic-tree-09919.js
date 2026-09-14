(()=>{
window.__SINA_TOPIC_TREE_BUILD__='0.9.9.2.7';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async p=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':ORG}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت درختواره موضوعی');return d};
const nz=v=>String(v||'').trim()||'بدون موضوع';
const nrm=v=>String(v||'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const PRIMARY=['راهبرد و برنامه‌ریزی','منابع انسانی','مالی و بودجه','فناوری و زیرساخت','آموزش','پژوهش و نوآوری','فروش و بازاریابی','مشتریان و ذی‌نفعان','عملیات و فرآیندها','حقوقی و مقررات','ساختار و حاکمیت سازمانی','نظارت، ارزیابی و عملکرد','ریسک، ایمنی و امنیت','ارتباطات و رسانه','تدارکات، خرید و زنجیره تأمین','دارایی‌ها، اموال و پشتیبانی','محصول و خدمت','کیفیت و بهبود','پروژه‌ها و برنامه‌های اجرایی','امور فرهنگی و اجتماعی','امور تخصصی حوزه فعالیت سازمان','امور بین‌الملل'];
function canonicalCategory(v){
 const x=nz(v);if(PRIMARY.includes(x))return x;const n=nrm(x);
 const rules=[
  ['آموزش',['آموزش','آموزشی','آموزش عالی','آموزش حوزوی','تحصیل','طلبه']],
  ['منابع انسانی',['منابع انسانی','کارکنان','نیروی انسانی','رفاه کارکنان','خدمات رفاهی کارکنان']],
  ['مالی و بودجه',['مالی','بودجه','اعتبار','هزینه']],
  ['حقوقی و مقررات',['حقوقی','مقررات','آیین نامه','آیین‌نامه','مصوبه']],
  ['پژوهش و نوآوری',['پژوهش','تحقیق','نوآوری']],
  ['فناوری و زیرساخت',['فناوری','سامانه','زیرساخت','نرم افزار','نرم‌افزار']]
 ];
 for(const [cat,terms] of rules)if(terms.some(k=>n.includes(nrm(k))))return cat;
 return x;
}
const labelKind=kind=>kind==='upstream'?'اسناد بالادستی':kind==='general'?'اسناد عمومی':'اسناد سازمان';
function build(items,kind){
 const map=new Map();
 for(const d of items||[]){
  if(kind&&d.documentClass!==kind)continue;
  const c=canonicalCategory(d.subjectCategory),a=nz(d.subjectArea);
  if(!map.has(c))map.set(c,new Map());
  const sm=map.get(c);
  let target=a;
  // Merge minor lexical variants of subtopics inside the same parent.
  const A=new Set(nrm(a).split(/\s+/).filter(Boolean));
  for(const existing of sm.keys()){
    const B=new Set(nrm(existing).split(/\s+/).filter(Boolean));
    let hit=0;for(const x of A)if(B.has(x))hit++;
    const sim=(A.size&&B.size)?hit/Math.max(A.size,B.size):0;
    if(nrm(existing)===nrm(a)||nrm(existing).includes(nrm(a))||nrm(a).includes(nrm(existing))||sim>=.72){target=existing;break}
  }
  if(!sm.has(target))sm.set(target,[]);
  sm.get(target).push(d);
 }
 return[...map.entries()].map(([category,subs])=>({
  category,total:[...subs.values()].reduce((n,x)=>n+x.length,0),
  subs:[...subs.entries()].map(([area,docs])=>({area,total:docs.length})).sort((a,b)=>b.total-a.total||a.area.localeCompare(b.area,'fa'))
 })).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'));
}
function openBank(filters){document.querySelector('.k9915overlay')?.remove();document.body.classList.remove('k9915-open');return window.__SINA_OPEN_DOCUMENT_BANK__?.(filters)}
function render(root,tree,q=''){const n=String(q||'').trim().toLowerCase(),f=tree.map(x=>{const ch=x.category.toLowerCase().includes(n);return{...x,subs:x.subs.filter(s=>ch||s.area.toLowerCase().includes(n))}}).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length);root.innerHTML=f.length?f.map((x,i)=>`<article class="k9915topic"><button type="button" class="k9915topic-head" data-topic="${esc(x.category)}" aria-expanded="${i<2}"><span class="k9915chev">${i<2?'⌄':'‹'}</span><div><b>${esc(x.category)}</b><small>${fa(x.total)} سند</small></div></button><div class="k9915subs"${i<2?'':' hidden'}>${x.subs.map(s=>`<button type="button" class="k9915sub" data-sub="${esc(s.area)}" data-parent="${esc(x.category)}"><span>${esc(s.area)}</span><b>${fa(s.total)} سند</b></button>`).join('')}</div></article>`).join(''):'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';root.querySelectorAll('.k9915topic-head').forEach(b=>{b.onclick=()=>{const box=b.nextElementSibling,op=box.hidden;box.hidden=!op;b.querySelector('.k9915chev').textContent=op?'⌄':'‹'};b.ondblclick=()=>openBank({subjectCategory:b.dataset.topic})});root.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.parent,subjectArea:b.dataset.sub}))}
const colors=['#1769aa','#7a4bb4','#14866d','#cf6b22','#a23b4b','#3f5aa8','#8d6b12','#bb4089','#237a87','#5b7f24'];
function renderCloud(root,tree,q=''){
 const n=String(q||'').trim().toLowerCase();
 const groups=tree.map(x=>({...x,subs:x.subs.filter(s=>!n||x.category.toLowerCase().includes(n)||s.area.toLowerCase().includes(n))}))
   .filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length);
 if(!groups.length){root.innerHTML='<div class="k9915empty">واژه‌ای مطابق جستجو پیدا نشد.</div>';return}
 const max=Math.max(...groups.map(x=>x.total),1);
 root.innerHTML=`<div class="k9916cloud">${groups.map((g,gi)=>{
   const mainSize=(18+8*Math.sqrt(g.total/max)).toFixed(1);
   return `<section class="k9916cluster" data-cluster="${esc(g.category)}">
    <button type="button" class="k9916word main" style="font-size:${mainSize}px;color:${colors[gi%colors.length]}" data-word-type="category" data-cat="${esc(g.category)}" title="${fa(g.total)} سند">${esc(g.category)}</button>
    <div class="k9916orbit">${g.subs.map((s,si)=>{
      const subSize=(10.5+Math.min(5.5,Math.log2(s.total+1)*1.7)).toFixed(1);
      return `<button type="button" class="k9916word sub" style="font-size:${subSize}px;color:${colors[(gi+si+2)%colors.length]}" data-word-type="sub" data-cat="${esc(g.category)}" data-area="${esc(s.area)}" title="${fa(s.total)} سند">${esc(s.area)}</button>`;
    }).join('')}</div>
   </section>`;
 }).join('')}</div>`;
 root.querySelectorAll('.k9916word').forEach(b=>b.onclick=()=>openBank(b.dataset.wordType==='category'?{subjectCategory:b.dataset.cat}:{subjectCategory:b.dataset.cat,subjectArea:b.dataset.area}));
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
