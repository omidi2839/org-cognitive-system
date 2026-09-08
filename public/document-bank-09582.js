(()=>{
window.__DOCUMENT_BANK_BUILD__='0.9.6.2';
const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const regexEsc=s=>String(s??'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return toFa(v)}};
const api=async(p,o={})=>{const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت بانک اسناد');return d};
const statusLabel=v=>({active:'معتبر',draft:'پیش‌نویس',expired:'منقضی',revoked:'لغوشده',superseded:'جایگزین‌شده',unknown:'نیازمند احراز'})[v]||v||'نیازمند احراز';
const classLabel=v=>({public:'عمومی',internal:'داخلی',confidential:'محرمانه',secret:'خیلی محرمانه'})[v]||v||'—';
const docClass=v=>v==='upstream'?'بالادستی':v==='general'?'عمومی':'سایر';
let lastSearchQuery='';

function highlightPattern(q){
 const chars=[...String(q??'').trim()];if(!chars.length)return null;
 const p=chars.map(ch=>/[یيى]/.test(ch)?'[یيى]':/[کك]/.test(ch)?'[کك]':/[\s\u200c\u200d]/.test(ch)?'[\\s\\u200c\\u200d]+':regexEsc(ch)).join('');
 try{return new RegExp(`(${p})`,'giu')}catch{return null}
}
function highlightText(text,q){
 const raw=String(text??''),rx=highlightPattern(q);if(!rx)return esc(raw);
 let out='',last=0,m;
 while((m=rx.exec(raw))){
  out+=esc(raw.slice(last,m.index))+`<mark class="k91highlight">${esc(m[0])}</mark>`;
  last=m.index+m[0].length;if(!m[0].length)rx.lastIndex++;
 }
 return out+esc(raw.slice(last));
}
function persianize(root){
 if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(n=>{if(n.parentElement?.closest('script,style,input,textarea'))return;const x=toFa(n.nodeValue);if(x!==n.nodeValue)n.nodeValue=x});
}
function cleanBuildLabel(root){root?.querySelectorAll('.k76head small').forEach(x=>{if(/Build\s*0\.7\.6\.4/.test(x.textContent))x.remove()})}
function injectWorkspaceCard(){
 const ctx=document.getElementById('workspaceContext');
 if(!ctx||ctx.classList.contains('hidden')||ctx.classList.contains('k91-hidden-workspace')||!ctx.textContent.includes('دانش و اسناد سازمان'))return;
 const target=ctx.querySelectorAll('.cognitive-stage')[0]?.querySelector('.stage-items');
 if(!target||target.querySelector('[data-capability="بانک اسناد"]'))return;
 const b=document.createElement('button');b.className='capability-card live';b.dataset.capability='بانک اسناد';
 b.innerHTML='<span class="capability-icon">✦</span><b>بانک اسناد</b><small>جستجو و بازیابی سازمانی</small>';target.appendChild(b);
}
function enhanceExistingShell(root){
 if(!root)return;cleanBuildLabel(root);
 const tabs=root.querySelector('.k76tabs');
 if(tabs&&!tabs.querySelector('[data-kbank]')){
  const b=document.createElement('button');b.type='button';b.dataset.kbank='1';b.textContent='بانک اسناد';b.onclick=openBank;tabs.appendChild(b);
 }
}
function closeBank(){
 document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace');
 document.getElementById('knowledge076')?.remove();
 setTimeout(injectWorkspaceCard,20);
}
function ensureShell(){
 document.getElementById('knowledge076')?.remove();
 const x=document.createElement('section');x.id='knowledge076';x.className='knowledge076 k91bank-mode';
 document.querySelector('.main')?.prepend(x);
 x.innerHTML=`<div class="k76head k91stickyhead">
  <div class="k91navrow"><button type="button" class="k91back" data-kback>← بازگشت به دانش و اسناد سازمان</button></div>
  <div class="k91titleRow"><h2>بانک اسناد سازمان</h2><p>جستجو، فیلتر و بازیابی اسناد بر اساس فراداده، جلسه، موضوع و متن سند</p></div>
 </div><div id="k76body"></div>`;
 x.querySelector('[data-kback]').onclick=closeBank;return x;
}
function metaLine(d){
 return `<div class="k958metainfo"><span><b>نوع سند:</b> ${esc(d.documentType||'—')}</span><span><b>موضوع:</b> ${esc(d.subjectArea||'بدون موضوع')}</span><span><b>مرجع صادرکننده:</b> ${esc(d.issuer||'مرجع نامشخص')}</span></div>`;
}
function snippetsBlock(d,q){
 const ss=(d.matchSnippets||[]).filter(Boolean);
 if(!ss.length)return d.metadataMatch?'<div class="k91snippet k91meta-hit"><b>تطابق در فراداده سند</b></div>':'';
 return ss.slice(0,3).map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+1)}:</b> ${highlightText(s,q)}</div>`).join('');
}
function resultRow(d,q){
 const mb=d.matchCount?`<span class="k91matchbadge">${toFa(d.matchCount)} تطابق در متن</span>`:(d.metadataMatch?'<span class="k91matchbadge">تطابق در فراداده</span>':'');
 return `<article class="k91result k958result">
  <div class="k91result-main">
   <div class="k91badges"><span>${docClass(d.documentClass)}</span><span>${statusLabel(d.validityStatus)}</span><span>${classLabel(d.classification)}</span>${d.hasRelations?'<span class="k958relbadge">دارای ارتباط سندی</span>':''}${mb}</div>
   <button type="button" class="k91doctitle" data-doc-preview="${esc(d.id)}">${esc(d.title||'بدون عنوان')}</button>
   <div class="k91result-info">${metaLine(d)}${snippetsBlock(d,q)}</div>
  </div>
  <div class="k91dates k958dates">
   <span>تاریخ تصویب/صدور<b>${fmtDate(d.issuedAt||d.createdAt)}</b></span>
   <span>تاریخ ابلاغ<b>${fmtDate(d.promulgationDate)}</b></span>
   <span>شماره جلسه<b>${esc(d.meetingNumber||'—')}</b></span>
   <button type="button" class="k91previewbtn" data-doc-preview="${esc(d.id)}">مشاهده سند</button>
  </div>
 </article>`;
}
function comboMarkup(name,id,label,placeholder){
 return `<label class="k958combo">${label}<div class="k958combobox"><input name="${name}" id="${id}" autocomplete="off" placeholder="${placeholder}"><button type="button" tabindex="-1" aria-label="نمایش گزینه‌ها">⌄</button><div class="k958combomenu" hidden></div></div></label>`;
}
function bankMarkup(){
 return `<div class="k91hero k958hero"><div><b>بانک اطلاعات اسناد سازمان</b><span>فیلترهای موضوع و جلسه از داده‌های ثبت‌شده در خود اسناد ساخته می‌شوند.</span></div><div class="k91hero-actions"><strong id="k91count">—</strong></div></div>
 <form id="k91search" class="k91search k958search">
  <label class="k91q">جستجو در عنوان، موضوع، مرجع و متن سند<input name="q" placeholder="عبارت موردنظر را وارد کنید"></label>
  <div class="k91filters k958filters">
   <label>رده سند<select name="documentClass"><option value="">همه اسناد</option><option value="upstream">بالادستی</option><option value="general">عمومی</option></select></label>
   ${comboMarkup('subject','k958subject','موضوع سند','جستجو یا انتخاب موضوع…')}
   ${comboMarkup('meetingType','k958meetingtype','نوع جلسه','جستجو یا انتخاب نوع جلسه…')}
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
function bindCombo(input,values){
 if(!input)return;const box=input.closest('.k958combobox'),menu=box.querySelector('.k958combomenu'),btn=box.querySelector('button');
 let options=[...new Set((values||[]).filter(Boolean))];
 const render=()=>{
  const q=input.value.trim().toLowerCase();
  const shown=options.filter(x=>!q||x.toLowerCase().includes(q)).slice(0,50);
  menu.innerHTML=shown.length?shown.map(x=>`<button type="button" data-v="${esc(x)}">${esc(x)}</button>`).join(''):'<div class="k958comboempty">موضوعی با این عبارت وجود ندارد.</div>';
  menu.hidden=false;
 };
 input.onfocus=render;input.oninput=render;
 btn.onclick=()=>{menu.hidden?render():menu.hidden=true;input.focus()};
 menu.onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;input.value=b.dataset.v;menu.hidden=true};
 input.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true});
 document.addEventListener('click',e=>{if(!box.contains(e.target))menu.hidden=true});
 input.addEventListener('blur',()=>setTimeout(()=>{
  const v=input.value.trim();if(v&&!options.some(x=>x===v))input.value='';
 },180));
 input._k958SetValues=v=>{options=[...new Set((v||[]).filter(Boolean))]};
}
function applyFacets(d){
 const s=document.getElementById('k958subject'),m=document.getElementById('k958meetingtype');
 s?._k958SetValues?.(d.facets?.subjects||[]);
 m?._k958SetValues?.(d.facets?.meetingTypes||[]);
}
async function runBankSearch(){
 const form=document.getElementById('k91search'),out=document.getElementById('k91results'),count=document.getElementById('k91count');
 if(!form||!out)return;
 const fd=new FormData(form),p=new URLSearchParams();
 for(const [k,v] of fd.entries())if(String(v).trim())p.set(k,String(v).trim());
 p.set('snippetLimit','12');out.innerHTML='<div class="k76loading">در حال جستجو در بانک اسناد…</div>';
 try{
  const d=await api('/api/v1/knowledge/document-bank?'+p.toString()),q=String(fd.get('q')||'').trim();
  lastSearchQuery=q;window.__K91_LAST_QUERY=q;window.__K957_LAST_QUERY=q;applyFacets(d);
  count.textContent=q?`${toFa(d.summary?.visible||0)} سند · ${toFa(d.summary?.totalOccurrences||0)} تطابق متنی`:`${toFa(d.summary?.visible||0)} سند قابل مشاهده`;
  out.innerHTML=(d.items||[]).length?(d.items||[]).map(x=>resultRow(x,q)).join(''):'<div class="k76empty">سندی با این معیارها پیدا نشد.</div>';
  persianize(out);
 }catch(e){out.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
function closeDocumentModal(){document.getElementById('k91docmodal')?.remove();document.body.classList.remove('k91-modal-open')}
async function openDocumentModal(documentId,q=lastSearchQuery){
 closeDocumentModal();window.__K951_ACTIVE_DOC_ID=documentId;window.__K950_ACTIVE_DOC_ID=documentId;
 const w=document.createElement('div');w.id='k91docmodal';w.className='k91modalbackdrop';
 w.innerHTML='<div class="k91modal"><div class="k91modal-loading">در حال دریافت متن سند…</div></div>';
 w.onclick=e=>{if(e.target===w)closeDocumentModal()};document.body.appendChild(w);document.body.classList.add('k91-modal-open');
 try{
  const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(documentId)+'&detail=1'),x=(d.items||[])[0]||{};
  if(!x.id)throw Error('سند پیدا نشد یا دسترسی مجاز نیست.');
  const body=String(x.fullText||'').trim(),rendered=q?highlightText(body,q):esc(body);
  w.innerHTML=`<div class="k91modal" role="dialog" aria-modal="true"><div class="k91modalhead"><div><div class="k91modalbadges"><span>${docClass(x.documentClass)}</span><span>${statusLabel(x.validityStatus)}</span><span>${classLabel(x.classification)}</span></div><h3>${esc(x.title||'بدون عنوان')}</h3>${metaLine(x)}</div><button class="k91modalclose" type="button">×</button></div><div class="k91modalmeta"><span>تاریخ تصویب/صدور <b>${fmtDate(x.issuedAt||x.createdAt)}</b></span><span>تاریخ ابلاغ <b>${fmtDate(x.promulgationDate)}</b></span><span>شماره جلسه <b>${esc(x.meetingNumber||'—')}</b></span></div><div class="k91modalbody">${body?`<div class="k91fulltext">${rendered}</div>`:'<div class="k76empty">متن استخراج‌شده‌ای وجود ندارد.</div>'}</div></div>`;
  w.querySelector('.k91modalclose').onclick=closeDocumentModal;persianize(w);
  if(q)setTimeout(()=>w.querySelector('.k91highlight')?.scrollIntoView({block:'center',behavior:'smooth'}),80);
 }catch(e){w.innerHTML=`<div class="k91modal"><div class="k91modalhead"><h3>مشاهده سند</h3><button class="k91modalclose">×</button></div><div class="k76empty">${esc(e.message)}</div></div>`;w.querySelector('.k91modalclose').onclick=closeDocumentModal}
}
async function openBank(){
 const ctx=document.getElementById('workspaceContext');if(ctx)ctx.classList.add('k91-hidden-workspace');
 const x=ensureShell(),b=x.querySelector('#k76body');b.innerHTML=bankMarkup();
 bindCombo(document.getElementById('k958subject'),[]);
 bindCombo(document.getElementById('k958meetingtype'),[]);
 document.getElementById('k91search').onsubmit=e=>{e.preventDefault();runBankSearch()};
 document.getElementById('k958clear').onclick=()=>{document.getElementById('k91search').reset();runBankSearch()};
 b.onclick=e=>{const p=e.target.closest('[data-doc-preview]');if(p)openDocumentModal(p.dataset.docPreview,lastSearchQuery)};
 await runBankSearch();
}
window.addEventListener('click',e=>{
 const c=e.target?.closest?.('[data-capability="بانک اسناد"],[data-kbank]');
 if(c){e.preventDefault();e.stopPropagation();openBank()}
},true);
new MutationObserver(()=>{enhanceExistingShell(document.getElementById('knowledge076'));injectWorkspaceCard()}).observe(document.documentElement,{subtree:true,childList:true});
enhanceExistingShell(document.getElementById('knowledge076'));injectWorkspaceCard();
})();