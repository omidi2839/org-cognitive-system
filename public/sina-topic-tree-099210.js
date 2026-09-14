(()=>{
window.__SINA_TOPIC_TREE_BUILD__='0.9.9.2.10';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async p=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':ORG}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت درختواره موضوعی');return d};
const nz=v=>String(v||'').trim()||'بدون موضوع';
const nrm=v=>String(v||'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const PRIMARY=['راهبرد و برنامه‌ریزی','منابع انسانی','مالی و بودجه','فناوری و زیرساخت','آموزش','پژوهش و نوآوری','فروش و بازاریابی','مشتریان و ذی‌نفعان','عملیات و فرآیندها','حقوقی و مقررات','ساختار و حاکمیت سازمانی','نظارت، ارزیابی و عملکرد','ریسک، ایمنی و امنیت','ارتباطات و رسانه','تدارکات، خرید و زنجیره تأمین','دارایی‌ها، اموال و پشتیبانی','محصول و خدمت','کیفیت و بهبود','پروژه‌ها و برنامه‌های اجرایی','امور فرهنگی و اجتماعی','امور تخصصی حوزه فعالیت سازمان','امور بین‌الملل'];
function canonicalCategory(v){
 const x=nz(v);if(PRIMARY.includes(x))return x;const n=nrm(x);
 const groups=[
  ['آموزش',['آموزش','آموزشی','آموزش عالی','آموزش حوزوی','آموزش عالی حوزوی','تحصیل','طلبه','دانش آموخته']],
  ['منابع انسانی',['منابع انسانی','نیروی انسانی','کارکنان','رفاه کارکنان','خدمات رفاهی کارکنان','حقوق و دستمزد']],
  ['مالی و بودجه',['مالی','بودجه','اعتبار','هزینه','پرداخت']],
  ['حقوقی و مقررات',['حقوقی','مقررات','آیین نامه','آیین‌نامه','مصوبه','ابلاغیه']],
  ['پژوهش و نوآوری',['پژوهش','تحقیق','نوآوری']],
  ['فناوری و زیرساخت',['فناوری','سامانه','زیرساخت','نرم افزار','نرم‌افزار']],
  ['راهبرد و برنامه‌ریزی',['راهبرد','راهبری','برنامه ریزی','برنامه‌ریزی','سیاستگذاری','سیاست‌گذاری']]
 ];
 for(const [cat,terms] of groups)if(terms.some(k=>n.includes(nrm(k))))return cat;
 return PRIMARY.includes(x)?x:'امور تخصصی حوزه فعالیت سازمان';
}
function tokenSim(a,b){
 const A=new Set(nrm(a).split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1));
 const B=new Set(nrm(b).split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1));
 if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;
 return hit/Math.max(A.size,B.size);
}
function canonicalSub(map,raw){
 const a=nz(raw);
 for(const existing of map.keys()){
  const na=nrm(a),ne=nrm(existing);
  if(na===ne||ne.includes(na)||na.includes(ne)||tokenSim(a,existing)>=.72)return existing;
 }
 return a;
}
const labelKind=kind=>kind==='upstream'?'اسناد بالادستی':kind==='general'?'اسناد عمومی':'اسناد سازمان';
function build(items,kind){
 const map=new Map();
 for(const d of items||[]){
  if(kind&&d.documentClass!==kind)continue;
  const c=canonicalCategory(d.subjectCategory),raw=nz(d.subjectArea);
  if(!map.has(c))map.set(c,new Map());
  const sm=map.get(c),a=canonicalSub(sm,raw);
  if(!sm.has(a))sm.set(a,[]);
  sm.get(a).push(d);
 }
 return [...map.entries()].map(([category,subs])=>({
  category,total:[...subs.values()].reduce((n,x)=>n+x.length,0),
  subs:[...subs.entries()].map(([area,docs])=>({area,total:docs.length})).sort((a,b)=>b.total-a.total||a.area.localeCompare(b.area,'fa'))
 })).sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'fa'));
}
function openBank(filters){document.querySelector('.k9915overlay')?.remove();document.body.classList.remove('k9915-open');return window.__SINA_OPEN_DOCUMENT_BANK__?.(filters)}
function render(root,tree,q=''){const n=String(q||'').trim().toLowerCase(),f=tree.map(x=>{const ch=x.category.toLowerCase().includes(n);return{...x,subs:x.subs.filter(s=>ch||s.area.toLowerCase().includes(n))}}).filter(x=>!n||x.category.toLowerCase().includes(n)||x.subs.length);root.innerHTML=f.length?f.map((x,i)=>`<article class="k9915topic"><button type="button" class="k9915topic-head" data-topic="${esc(x.category)}" aria-expanded="${i<2}"><span class="k9915chev">${i<2?'⌄':'‹'}</span><div><b>${esc(x.category)}</b><small>${fa(x.total)} سند</small></div></button><div class="k9915subs"${i<2?'':' hidden'}>${x.subs.map(s=>`<button type="button" class="k9915sub" data-sub="${esc(s.area)}" data-parent="${esc(x.category)}"><span>${esc(s.area)}</span><b>${fa(s.total)} سند</b></button>`).join('')}</div></article>`).join(''):'<div class="k9915empty">موضوعی مطابق جستجو پیدا نشد.</div>';root.querySelectorAll('.k9915topic-head').forEach(b=>{b.onclick=()=>{const box=b.nextElementSibling,op=box.hidden;box.hidden=!op;b.querySelector('.k9915chev').textContent=op?'⌄':'‹'};b.ondblclick=()=>openBank({subjectCategory:b.dataset.topic})});root.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>openBank({subjectCategory:b.dataset.parent,subjectArea:b.dataset.sub}))}
const colors=['#1769aa','#7a4bb4','#14866d','#cf6b22','#a23b4b','#3f5aa8','#8d6b12','#bb4089','#237a87','#5b7f24'];

function k99210Hash(s){
 let h=2166136261>>>0;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;
}
function k99210Overlap(a,b,pad=6){
 return !(a.x+a.w+pad<b.x||b.x+b.w+pad<a.x||a.y+a.h+pad<b.y||b.y+b.h+pad<a.y);
}
function k99210Clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function k99210PlaceCloud(root){
 const canvas=root.querySelector('.k99210cloud');if(!canvas)return;
 const clusters=[...canvas.querySelectorAll('.k99210cluster')];
 const W=Math.max(680,root.clientWidth-24);
 const totalSubs=clusters.reduce((n,c)=>n+c.querySelectorAll('.k99210sub').length,0);
 const H=Math.max(420,260+clusters.length*52+totalSubs*8);
 canvas.style.width=W+'px';canvas.style.height=H+'px';

 const placed=[];
 const cx=W/2,cy=H/2;
 const golden=2.399963229728653;

 // Irregular cluster anchors using a golden-angle spiral, not rows/columns.
 const anchors=clusters.map((c,i)=>{
   const seed=k99210Hash(c.dataset.cat||i);
   if(clusters.length===1)return {x:cx,y:cy};
   const rr=42+Math.sqrt(i+1)*Math.min(W,H)*0.13;
   const ang=i*golden+(seed%37)/37;
   return {
     x:k99210Clamp(cx+Math.cos(ang)*rr,120,W-120),
     y:k99210Clamp(cy+Math.sin(ang)*rr,90,H-90)
   };
 });

 clusters.forEach((cluster,ci)=>{
   const main=cluster.querySelector('.k99210main'),subs=[...cluster.querySelectorAll('.k99210sub')];
   const a=anchors[ci];

   // Place main word first.
   const mw=main.offsetWidth,mh=main.offsetHeight;
   let mx=k99210Clamp(a.x-mw/2,6,W-mw-6),my=k99210Clamp(a.y-mh/2,6,H-mh-6);
   let mainBox={x:mx,y:my,w:mw,h:mh,el:main};
   // If main collides with an earlier cluster, drift it gently around its anchor.
   for(let k=0;k<36&&placed.some(p=>k99210Overlap(mainBox,p,12));k++){
     const ang=k*golden+(k99210Hash(cluster.dataset.cat)%19)/19;
     const r=18+8*Math.sqrt(k+1);
     mx=k99210Clamp(a.x+Math.cos(ang)*r-mw/2,6,W-mw-6);
     my=k99210Clamp(a.y+Math.sin(ang)*r-mh/2,6,H-mh-6);
     mainBox={x:mx,y:my,w:mw,h:mh,el:main};
   }
   main.style.left=mx+'px';main.style.top=my+'px';placed.push(mainBox);
   const center={x:mx+mw/2,y:my+mh/2};

   // Place children around THEIR parent with deterministic irregular rings.
   subs.forEach((el,si)=>{
     const ew=el.offsetWidth,eh=el.offsetHeight;
     const seed=k99210Hash((cluster.dataset.cat||'')+'|'+(el.textContent||''));
     let box=null;
     for(let k=0;k<90;k++){
       const ring=1+Math.floor(k/18);
       const radius=48+ring*24+(si%4)*7;
       const ang=(si*golden)+(k%18)*(Math.PI*2/18)+(seed%101)/101;
       const x=k99210Clamp(center.x+Math.cos(ang)*radius-ew/2,4,W-ew-4);
       const y=k99210Clamp(center.y+Math.sin(ang)*radius*.72-eh/2,4,H-eh-4);
       const candidate={x,y,w:ew,h:eh,el};
       // A child may be near its own parent, but never overlap another word.
       if(!placed.some(p=>k99210Overlap(candidate,p,4))){box=candidate;break}
     }
     if(!box){
       const ang=si*golden;
       box={
         x:k99210Clamp(center.x+Math.cos(ang)*105-ew/2,4,W-ew-4),
         y:k99210Clamp(center.y+Math.sin(ang)*78-eh/2,4,H-eh-4),
         w:ew,h:eh,el
       };
     }
     el.style.left=box.x+'px';el.style.top=box.y+'px';placed.push(box);
   });
 });
}
function renderCloud(root,tree,q=''){
 const n=nrm(q);
 const groups=(tree||[]).map(x=>({...x,subs:x.subs.filter(s=>!n||nrm(x.category).includes(n)||nrm(s.area).includes(n))}))
   .filter(x=>!n||nrm(x.category).includes(n)||x.subs.length);
 if(!groups.length){root.innerHTML='<div class="k9915empty">واژه‌ای مطابق جستجو پیدا نشد.</div>';return}

 const max=Math.max(1,...groups.map(x=>x.total));
 root.innerHTML=`<div class="k99210cloud">${groups.map((g,gi)=>{
   // Smaller bounds than previous versions; size still tracks document count.
   const mainSize=Math.min(22,Math.max(14.5,14.5+7.5*Math.sqrt(g.total/max))).toFixed(1);
   return `<section class="k99210cluster" data-cat="${esc(g.category)}">
    <button type="button" class="k99210word k99210main" style="font-size:${mainSize}px;color:${colors[gi%colors.length]}" data-word-type="category" data-cat="${esc(g.category)}" title="${fa(g.total)} سند">${esc(g.category)}</button>
    ${g.subs.map((s,si)=>{
      const subSize=Math.min(12.5,Math.max(8.5,8.5+Math.log2(s.total+1)*1.15)).toFixed(1);
      return `<button type="button" class="k99210word k99210sub" style="font-size:${subSize}px;color:${colors[(gi+si+2)%colors.length]}" data-word-type="sub" data-cat="${esc(g.category)}" data-area="${esc(s.area)}" title="${fa(s.total)} سند">${esc(s.area)}</button>`;
    }).join('')}
   </section>`;
 }).join('')}</div>`;

 root.querySelectorAll('[data-word-type]').forEach(b=>b.onclick=()=>openBank(
   b.dataset.wordType==='category'?{subjectCategory:b.dataset.cat}:{subjectCategory:b.dataset.cat,subjectArea:b.dataset.area}
 ));
 requestAnimationFrame(()=>requestAnimationFrame(()=>k99210PlaceCloud(root)));
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
