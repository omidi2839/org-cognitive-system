(()=>{
window.__DOCUMENT_BANK_BUILD__='0.9.9.1.2';
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
let k982CanEditDocuments=false;

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
 return `<div class="k958metainfo"><span><b>نوع سند:</b> ${esc(d.documentType||'—')}</span><span><b>موضوع:</b> ${esc(d.subjectCategory||d.subjectArea||'بدون موضوع')}${d.subjectCategory&&d.subjectArea?` / ${esc(d.subjectArea)}`:''}</span><span><b>مرجع صادرکننده:</b> ${esc(d.issuer||'مرجع نامشخص')}</span></div>`;
}
function snippetsBlock(d,q){
 const ss=(d.matchSnippets||[]).filter(Boolean);
 if(!ss.length)return d.metadataMatch?'<div class="k91snippet k91meta-hit"><b>تطابق در فراداده سند</b></div>':'';
 const first=ss.slice(0,3).map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+1)}:</b> ${highlightText(s,q)}</div>`).join('');
 const more=ss.slice(3).map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+4)}:</b> ${highlightText(s,q)}</div>`).join('');
 return `${first}${more?`<div class="k970morewrap"><div class="k970moreitems" hidden>${more}</div><button type="button" class="k970morebtn" data-k970-more>نمایش ${toFa(ss.length-3)} تطابق دیگر</button></div>`:''}`;
}
function resultRow(d,q){
 const mb=d.matchCount?`<span class="k91matchbadge">${toFa(d.matchCount)} تطابق در متن</span>`:(d.metadataMatch?'<span class="k91matchbadge">تطابق در فراداده</span>':'');
 return `<article class="k91result k958result">
  <div class="k91result-main">
   <div class="k91badges"><span>${docClass(d.documentClass)}</span><span>${statusLabel(d.validityStatus)}</span>${classLabel(d.classification)!==docClass(d.documentClass)?`<span>${classLabel(d.classification)}</span>`:''}${d.hasRelations?'<span class="k958relbadge">دارای ارتباط سندی</span>':''}${mb}</div>
   <button type="button" class="k91doctitle" data-doc-preview="${esc(d.id)}">${esc(d.title||'بدون عنوان')}</button>
   <div class="k91result-info">${metaLine(d)}${snippetsBlock(d,q)}</div>
  </div>
  <div class="k91dates k958dates">
   <span>تاریخ تصویب/صدور<b>${fmtDate(d.issuedAt||d.createdAt)}</b></span>
   <span>تاریخ ابلاغ<b>${fmtDate(d.promulgationDate)}</b></span>
   <span>شماره جلسه<b>${esc(d.meetingNumber||'—')}</b></span>
   <span>شماره سند<b>${esc(d.documentNumber||'—')}</b></span>
   <div class="k982rowactions ${k982CanEditDocuments?'can-edit':'view-only'}">
    <button type="button" class="k91previewbtn k982actionbtn" data-doc-preview="${esc(d.id)}">مشاهده سند</button>
    ${k982CanEditDocuments?`<button type="button" class="k982editrowbtn k982actionbtn" data-doc-edit="${esc(d.id)}">ویرایش سند</button>`:''}
   </div>
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
   ${comboMarkup('subjectCategory','k958subject','موضوع کلان سند','جستجو یا انتخاب موضوع کلان…')}
   ${comboMarkup('meetingType','k958meetingtype','نوع جلسه','جستجو یا انتخاب نوع جلسه…')}
   <label>شماره جلسه<input name="meetingNumber" placeholder="مثلاً ۱۲۵"></label>
   <label>شماره مصوبه / تصمیم / سند<input name="documentNumber" placeholder="مثلاً ۲۱۵"></label>
   <label>ارتباط با اسناد دیگر<select name="hasRelations"><option value="">همه</option><option value="yes">دارای ارتباط</option><option value="no">بدون ارتباط</option></select></label>
   <label>وضعیت اعتبار<select name="validity"><option value="">همه وضعیت‌ها</option><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="unknown">نیازمند احراز</option></select></label>
   <label>طبقه‌بندی<select name="classification"><option value="">همه سطوح</option><option value="public">عمومی</option><option value="internal">داخلی</option><option value="confidential">محرمانه</option><option value="secret">خیلی محرمانه</option></select></label>
   ${comboMarkup('issuer','k971issuer','مرجع صادرکننده','جستجو یا انتخاب مرجع ثبت‌شده…')}
   <label class="k970native-date">از تاریخ<input type="hidden" name="from" data-k970-bank-date></label>
   <label class="k970native-date">تا تاریخ<input type="hidden" name="to" data-k970-bank-date></label>
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
 const s=document.getElementById('k958subject'),
       m=document.getElementById('k958meetingtype'),
       i=document.getElementById('k971issuer');
 s?._k958SetValues?.(d.facets?.subjects||[]);
 m?._k958SetValues?.(d.facets?.meetingTypes||[]);
 i?._k958SetValues?.(d.facets?.issuers||[]);
}

async function k982LoadEditPermission(){
 try{
  const g=await api('/api/v1/knowledge/document-governance');
  k982CanEditDocuments=!!g.permissions?.documentEdit;
 }catch{k982CanEditDocuments=false}
}

const K983_PRIMARY_TOPICS=[
 'راهبرد و برنامه‌ریزی','منابع انسانی','مالی و بودجه','فناوری و زیرساخت','آموزش','پژوهش و نوآوری',
 'فروش و بازاریابی','مشتریان و ذی‌نفعان','عملیات و فرآیندها','حقوقی و مقررات','ساختار و حاکمیت سازمانی',
 'نظارت، ارزیابی و عملکرد','ریسک، ایمنی و امنیت','ارتباطات و رسانه','تدارکات، خرید و زنجیره تأمین',
 'دارایی‌ها، اموال و پشتیبانی','محصول و خدمت','کیفیت و بهبود','پروژه‌ها و برنامه‌های اجرایی',
 'امور فرهنگی و اجتماعی','امور تخصصی حوزه فعالیت سازمان','امور بین‌الملل'
];
const K983_MEETING_TYPES=['شورای سیاست‌گذاری','شورای مدیریتی','شورای تخصصی','کمیسیون','کمیته','کارگروه','جلسه کارشناسی','جلسه هماهنگی','جلسه رسمی عمومی'];
const K983_UP_TYPES=['مأموریت','چشم‌انداز','اهداف کلان','سیاست','راهبرد','چارچوب','ضوابط','قانون/الزام بیرونی'];
const K983_GENERAL_TYPES=['آیین‌نامه','دستورالعمل','بخشنامه','گزارش','صورتجلسه','نامه رسمی','سایر'];

function k983Opt(values,current,blank='انتخاب کنید…'){
 return `<option value="">${blank}</option>`+values.map(v=>`<option value="${esc(v)}"${String(v)===String(current||'')?' selected':''}>${esc(v)}</option>`).join('');
}
function k983Val(v){return esc(v==null?'':String(v))}
function k983DateField(name,label,value){
 return `<label class="k983datefield">${label}<input type="hidden" name="${name}" value="${k983Val(value)}" data-k983-date></label>`;
}
function k983BindEditDates(root){
 root.querySelectorAll('[data-k983-date]').forEach(inp=>{
  if(typeof window.__ORG_JALALI_ENHANCE__==='function'){
    window.__ORG_JALALI_ENHANCE__(inp,inp.closest('label')?.childNodes?.[0]?.textContent?.trim()||'تاریخ');
  }else{
    inp.type='date';inp.style.display='';
  }
 });
}
async function k983LoadUnits(select,current){
 if(!select)return;
 try{
  const r=await api('/api/v1/organization/units'),units=r.units||[];
  select.innerHTML='<option value="">انتخاب واحد سازمانی…</option>'+units.map(u=>`<option value="${esc(u.id)}"${String(u.id)===String(current||'')?' selected':''}>${esc(u.name)}</option>`).join('');
 }catch{select.innerHTML='<option value="">ساختار سازمانی در دسترس نیست</option>'}
}

const K984_REL_TYPES=[
 ['amends','اصلاحیه'],['extends','الحاقیه'],['repeals','ملغی'],['clarifies','استفسار']
];
const K984_EFFECT_LABEL={amends:'متن کامل اصلاحی',extends:'متن کامل الحاقیه',repeals:'متن/شرح بخش ملغی',clarifies:'متن کامل استفسار'};
const K984_INTERNAL_CHANGE={amends:'اصلاح متن',extends:'الحاق',repeals:'لغو',clarifies:'تفسیر/توضیح'};
function k984RelationLabel(v){return Object.fromEntries(K984_REL_TYPES)[v]||v||'ارتباط'}
function k984RelationPerspectiveLabel(r){
 const m={amended_by:'اصلاح‌شده توسط',extended_by:'الحاق‌شده توسط',superseded_by:'جایگزین‌شده توسط',repealed_by:'لغوشده توسط',clarified_by:'تبیین‌شده توسط',implemented_by:'دارای سند اجرایی'};
 return m[r.perspectiveType]||k984RelationLabel(r.perspectiveType);
}
function k984RelationEditorMarkup(){
 return `<section class="k983editcard k984relations"><header><div><b>ارتباط حقوقی سند</b><small>اصلاح، الحاق، جایگزینی، لغو و سایر روابط حقوقی سند</small></div><span>۰۴</span></header>
  <div data-k984-rel-list class="k984rellist"><div class="k76loading">در حال دریافت روابط ثبت‌شده…</div></div>
  <div class="k984relform" data-k984-rel-form>
   <label>نوع ارتباط<select data-k984-type>${K984_REL_TYPES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
   <label>سند مرتبط<select data-k984-doc><option value="">انتخاب سند مرتبط…</option></select></label>
   <input type="hidden" data-k984-change-type>
   <label>ماده هدف<input data-k984-article placeholder="مثلاً ۹"></label>
   <label>بند / تبصره<input data-k984-clause placeholder="مثلاً تبصره ۱ یا بند الف"></label>
   <label class="k984reldesc"><span data-k984-desc-label>متن اثر حقوقی</span><textarea data-k984-desc rows="4" placeholder="متن دقیق را وارد کنید"></textarea></label>
   <label class="k984releffective">تاریخ اثر<input type="hidden" data-k984-effective></label>
   <div class="k984relactions"><button type="button" data-k984-clear>پاک کردن</button><button type="button" data-k984-save>ثبت / به‌روزرسانی ارتباط</button></div>
   <span data-k984-status></span>
  </div>
 </section>`;
}
async function k984InitRelationEditor(root,currentId){
 const list=root.querySelector('[data-k984-rel-list]'),docSel=root.querySelector('[data-k984-doc]'),type=root.querySelector('[data-k984-type]'),
       change=root.querySelector('[data-k984-change-type]'),article=root.querySelector('[data-k984-article]'),clause=root.querySelector('[data-k984-clause]'),
       desc=root.querySelector('[data-k984-desc]'),effective=root.querySelector('[data-k984-effective]'),status=root.querySelector('[data-k984-status]');
 if(window.__ORG_JALALI_ENHANCE__)window.__ORG_JALALI_ENHANCE__(effective,'تاریخ اثر');

 const docsData=await api('/api/v1/knowledge/documents');
 const docs=(docsData.items||[]).filter(d=>d.id!==currentId);
 docSel.innerHTML='<option value="">انتخاب سند مرتبط…</option>'+docs.map(d=>`<option value="${esc(d.id)}">${d.documentNumber?`مصوبه/سند ${esc(d.documentNumber)} — `:''}${esc(d.title)}</option>`).join('');

 const syncType=()=>{change.value=K984_INTERNAL_CHANGE[type.value]||'';const l=root.querySelector('[data-k984-desc-label]');if(l)l.textContent=K984_EFFECT_LABEL[type.value]||'متن اثر حقوقی';desc.placeholder=`${K984_EFFECT_LABEL[type.value]||'متن اثر حقوقی'} را دقیقاً وارد کنید`;};type.addEventListener('change',syncType);const clear=()=>{type.value='amends';docSel.value='';article.value='';clause.value='';desc.value='';effective.value='';status.textContent='';root.dataset.k984EditingRelation='';syncType()};syncType();
 root.querySelector('[data-k984-clear]').onclick=clear;

 async function load(){
  const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(currentId)),rels=d.items||[];
  list.innerHTML=rels.length?rels.map(r=>`<article class="k984relitem" data-rel-id="${esc(r.id)}">
   <div><b>${esc(k984RelationPerspectiveLabel(r))}</b><span>${esc(r.relatedDocument?.documentNumber?`مصوبه/سند ${r.relatedDocument.documentNumber} — ${r.relatedDocument.title}`:(r.relatedDocument?.title||'سند مرتبط'))}</span>
   <small>${r.targetArticle?`ماده ${esc(r.targetArticle)}`:''}${r.targetClause?` · ${esc(r.targetClause)}`:''}${r.changeType?` · ${esc(r.changeType)}`:''}</small></div>
   <div class="k984relitemactions"><button type="button" data-edit-rel="${esc(r.id)}">ویرایش</button><button type="button" data-del-rel="${esc(r.id)}">حذف</button></div>
  </article>`).join(''):'<div class="k983editnote">هنوز ارتباط حقوقی برای این سند ثبت نشده است.</div>';

  list.querySelectorAll('[data-edit-rel]').forEach(b=>b.onclick=()=>{
   const r=rels.find(x=>x.id===b.dataset.editRel);if(!r)return;
   const inv={amended_by:'amends',extended_by:'extends',superseded_by:'supersedes',repealed_by:'repeals',clarified_by:'clarifies',implemented_by:'implements'};
   // If current document is the target, editing from this perspective uses inverse type.
   type.value=inv[r.perspectiveType]||r.perspectiveType||'amends';syncType();
   docSel.value=r.relatedDocument?.id||'';
   change.value=K984_INTERNAL_CHANGE[type.value]||r.changeType||'';
   article.value=r.changeItems?.[0]?.article||r.targetArticle||'';
   clause.value=r.changeItems?.[0]?.clause||r.targetClause||'';
   desc.value=r.changeItems?.[0]?.description||r.note||'';
   effective.value=r.effectiveFrom||'';
   root.dataset.k984EditingRelation=r.id;
   status.textContent='اطلاعات رابطه برای ویرایش در فرم قرار گرفت.';
  });
  list.querySelectorAll('[data-del-rel]').forEach(b=>b.onclick=async()=>{
   if(!await SinaDialog.confirm('این ارتباط حقوقی حذف شود؟',{title:'حذف ارتباط حقوقی',danger:true,confirmText:'حذف'}))return;
   try{await api('/api/v1/knowledge/document-relations',{method:'DELETE',body:JSON.stringify({relationId:b.dataset.delRel})});status.textContent='ارتباط حذف شد.';await load()}catch(e){status.textContent=e.message}
  });
 }
 root.querySelector('[data-k984-save]').onclick=async()=>{
  if(!docSel.value){status.textContent='انتخاب سند مرتبط الزامی است.';return}
  status.textContent='در حال ثبت ارتباط حقوقی…';
  try{
   const editing=root.dataset.k984EditingRelation||'';
   await api('/api/v1/knowledge/document-relations',{method:'POST',body:JSON.stringify({
    relationId:editing||undefined,documentId:currentId,relatedDocumentId:docSel.value,relationType:type.value,changeType:change.value,
    changeItems:[{article:article.value,clause:clause.value,description:desc.value}],
    targetArticle:article.value,targetClause:clause.value,note:desc.value,effectiveFrom:effective.value
   })});
   status.textContent='✓ ارتباط حقوقی ذخیره شد.';clear();await load();
  }catch(e){status.textContent=e.message}
 };
 await load();
}

const K9885_BANK_SERVER_RAW_BUDGET=2750000;
const k9885BankSleep=ms=>new Promise(r=>setTimeout(r,ms));
async function k9885BankBase64(file){
 const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
 for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 return btoa(binary);
}
async function k9885BankServerRef(file){return {fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,contentBase64:await k9885BankBase64(file),directUpload:false,transport:'function-fallback-v1'}}
async function k986BankDirectBlobRef(file,role='attachment'){
 let last;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const pre=await fetch('/api/v1/knowledge/blob-upload-url',{method:'POST',body:JSON.stringify({fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,role})});
   const p=await pre.json().catch(()=>({}));if(!pre.ok)throw Error(p.message||'دریافت مجوز آپلود مستقیم ناموفق بود.');
   const put=await fetch(p.presignedUrl,{method:'PUT',body:file});if(!put.ok)throw Error(`ارسال مستقیم فایل به Blob ناموفق بود (${put.status}).`);
   return {fileName:file.name,mimeType:file.type||'application/octet-stream',blobUrl:p.blobUrl,blobPathname:p.pathname,size:file.size,directUpload:true,transport:'direct-blob-v2'};
  }catch(e){last=e;if(attempt<3)await k9885BankSleep(450*attempt)}
 }
 throw last||Error('آپلود مستقیم فایل ناموفق بود.');
}
async function k985BankFilesPayload(files,role='attachment',forceServer=false){
 const list=[...(files||[])],out=[];
 for(const file of list)out.push(forceServer?await k9885BankServerRef(file):await k986BankDirectBlobRef(file,role));
 return out;
}

async function k982OpenEdit(documentId){
 let existing=document.getElementById('k982editmodal');if(existing)existing.remove();
 const w=document.createElement('div');w.id='k982editmodal';w.className='k91modalbackdrop k982editbackdrop';
 w.innerHTML='<div class="k983editdialog"><div class="k76loading">در حال آماده‌سازی فرم سند…</div></div>';
 w.onclick=e=>{if(e.target===w)w.remove()};document.body.appendChild(w);
 try{
  const g=await api('/api/v1/knowledge/document-governance?documentId='+encodeURIComponent(documentId));
  if(!g.permissions?.documentEdit)throw Error('شما مجوز ویرایش سند را ندارید.');
  const d=g.document||{},filesInfo=g.files||{},up=d.documentClass==='upstream',types=up?K983_UP_TYPES:K983_GENERAL_TYPES;
  w.innerHTML=`<div class="k983editdialog">
   <div class="k983edithead"><div><small>همان شناسنامه ثبت سند</small><b>ویرایش سند</b><span>${up?'سند بالادستی':'سند عمومی'} · تغییرات در ممیزی ثبت می‌شود</span></div><button type="button" data-close>×</button></div>
   <form id="k983editform">
    <section class="k983editcard"><header><b>مشخصات پایه سند</b><span>۰۱</span></header><div class="k983editgrid">
     <label>عنوان سند<input name="title" required value="${k983Val(d.title)}"></label>
     <label>نوع سند<select name="documentType">${k983Opt(types,d.documentType)}</select></label>
     <label>مرجع صادرکننده<input name="issuer" value="${k983Val(d.issuer)}"></label>
     <label>نسخه<input name="versionLabel" value="${k983Val(d.versionLabel)}"></label>
     ${k983DateField('issuedAt','تاریخ صدور',d.issuedAt)}
     <div data-k985-validuntil>${k983DateField('validUntil','تاریخ پایان / قطع اعتبار',d.validUntil)}</div>
     <label>وضعیت اعتبار<select name="validityStatus">
      <option value="active"${d.validityStatus==='active'?' selected':''}>معتبر</option>
      <option value="draft"${d.validityStatus==='draft'?' selected':''}>پیش‌نویس</option>
      <option value="expired"${d.validityStatus==='expired'?' selected':''}>منقضی</option>
      <option value="unknown"${d.validityStatus==='unknown'?' selected':''}>نیازمند احراز</option>
     </select></label>
     <label>طبقه‌بندی<select name="classification">
      ${['public','internal','confidential','secret'].map(v=>`<option value="${v}"${d.classification===v?' selected':''}>${({public:'عمومی',internal:'داخلی',confidential:'محرمانه',secret:'خیلی محرمانه'})[v]}</option>`).join('')}
     </select></label>
     <label>دامنه سازمانی<select name="scopeType" data-k983-scope>
      <option value="organization"${(d.scopeType==='organization'||!d.scopeType)?' selected':''}>کل سازمان</option>
      <option value="unit"${d.scopeType==='unit'?' selected':''}>واحد سازمانی</option>
     </select></label>
     <label data-k983-unit-wrap${d.scopeType==='unit'?'':' hidden'}>واحد سازمانی<select name="organizationalUnitRef" data-k983-unit><option value="">در حال دریافت…</option></select></label>
    </div></section>

    <section class="k983editcard"><header><b>جلسه، شماره و ابلاغ</b><span>۰۲</span></header><div class="k983editgrid">
     <label>نوع جلسه<select name="meetingType">${k983Opt(K983_MEETING_TYPES,d.meetingType,'بدون جلسه')}</select></label>
     <label>شماره جلسه<input name="meetingNumber" value="${k983Val(d.meetingNumber)}"></label>
     <label>شماره مصوبه / تصمیم / سند<input name="documentNumber" value="${k983Val(d.documentNumber)}"></label>
     ${k983DateField('meetingDate','تاریخ برگزاری جلسه',d.meetingDate)}
     ${k983DateField('promulgationDate','تاریخ ابلاغ سند',d.promulgationDate)}
    </div></section>

    <section class="k983editcard"><header><b>طبقه‌بندی موضوعی</b><span>۰۳</span></header><div class="k983editgrid k983topicgrid">
     <label>موضوع کلان<select name="subjectCategory" required>${k983Opt(K983_PRIMARY_TOPICS,d.subjectCategory,'انتخاب موضوع کلان…')}</select></label>
     <label>زیرموضوع سند<input name="subjectArea" required value="${k983Val(d.subjectArea)}" placeholder="مثلاً حقوق و دستمزد و مزایا"></label>
    </div><small class="k983editnote">در ویرایش، فایل اصلی سند تغییر نمی‌کند؛ این فرم شناسنامه و طبقه‌بندی ثبت‌شده را اصلاح می‌کند.</small></section>

    <section class="k983editcard k985fileedit"><header><div><b>فایل اصلی و پیوست‌ها</b><small>فایل اصلی نسخه جاری قابل جایگزینی است و می‌توانید چند پیوست Word/PDF جدید اضافه کنید.</small></div><span>۰۴</span></header>
     <div class="k985currentfile"><b>فایل اصلی فعلی</b><span>${esc(filesInfo.primary?.fileName||d.sourceFileName||'نام فایل ثبت نشده')}</span></div>
     <div class="k985fileeditgrid">
      <label>جایگزینی فایل اصلی<input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-k985-replace-primary><small>با انتخاب فایل جدید، فایل قبلی از نسخه جاری خارج می‌شود و سابقه آن برای ممیزی حفظ خواهد شد.</small></label>
      <div class="k992editattachments"><div class="k992editattachhead"><b>افزودن پیوست‌های جدید</b><button type="button" data-k992-edit-add>＋ افزودن پیوست دیگر</button></div><div data-k992-edit-rows class="k992attachmentrows"></div><small>برای هر پیوست یک فایل انتخاب کنید؛ تعداد پیوست‌ها محدود به یک فیلد نیست.</small></div>
     </div>
     <div class="k985existingattachments"><b>پیوست‌های فعلی</b>${(filesInfo.attachments||[]).length?`<div>${filesInfo.attachments.map((a,i)=>`<span>${toFa(i+1)}. ${esc(a.fileName)}</span>`).join('')}</div>`:'<small>پیوستی ثبت نشده است.</small>'}</div>
    </section>

    ${k984RelationEditorMarkup().replace('<span>۰۴</span>','<span>۰۵</span>')}

    <div class="k983editactions"><button type="button" data-cancel>انصراف</button><button class="k76primary" type="submit">ذخیره تغییرات سند</button></div>
    <span data-status class="k983editstatus"></span>
   </form>
  </div>`;
  w.querySelector('[data-close]').onclick=()=>w.remove();w.querySelector('[data-cancel]').onclick=()=>w.remove();
  k983BindEditDates(w);
  const unitSel=w.querySelector('[data-k983-unit]'),unitWrap=w.querySelector('[data-k983-unit-wrap]'),scope=w.querySelector('[data-k983-scope]');
  await k983LoadUnits(unitSel,d.organizationalUnitRef);
  await k984InitRelationEditor(w,documentId);
  const syncScope=()=>{const show=scope.value==='unit';unitWrap.hidden=!show;if(!show)unitSel.value=''};
  scope.onchange=syncScope;syncScope();
  const validity=w.querySelector('select[name="validityStatus"]'),validWrap=w.querySelector('[data-k985-validuntil]');
  const syncValidity=()=>{const show=validity?.value!=='active';if(validWrap)validWrap.hidden=!show;if(!show){const vi=validWrap?.querySelector('input[name="validUntil"]');if(vi)vi.value=''}};
  if(validity)validity.onchange=syncValidity;syncValidity();

  const editRows=w.querySelector('[data-k992-edit-rows]');
  const addEditAttachmentRow=()=>{
   if(!editRows)return;
   const row=document.createElement('div');row.className='k992attachmentrow';
   row.innerHTML=`<label><span>انتخاب فایل پیوست</span><input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-k985-edit-attachment-input></label><button type="button" data-k992-edit-remove title="حذف این ردیف">×</button>`;
   editRows.appendChild(row);
   row.querySelector('[data-k992-edit-remove]').onclick=()=>{if(editRows.children.length===1){row.querySelector('input').value='';return}row.remove()};
  };
  w.querySelector('[data-k992-edit-add]')?.addEventListener('click',addEditAttachmentRow);addEditAttachmentRow();

  w.querySelector('#k983editform').onsubmit=async e=>{
   e.preventDefault();const fd=new FormData(e.currentTarget),patch={};
   ['title','documentType','issuer','versionLabel','issuedAt','validUntil','validityStatus','classification','scopeType','organizationalUnitRef','meetingType','meetingNumber','documentNumber','meetingDate','promulgationDate','subjectCategory','subjectArea'].forEach(k=>patch[k]=fd.get(k)||'');
   patch.organizationalLevel=patch.scopeType==='unit'?'واحد سازمانی':'کل سازمان';
   if(patch.scopeType==='unit')patch.organizationalUnitName=unitSel.selectedOptions?.[0]?.textContent||'';
   else patch.organizationalUnitName='';
   const st=w.querySelector('[data-status]');st.textContent='در حال ذخیره تغییرات…';
   try{
    await api('/api/v1/knowledge/document-governance?documentId='+encodeURIComponent(documentId),{method:'PATCH',body:JSON.stringify(patch)});
    const primary=w.querySelector('[data-k985-replace-primary]')?.files?.[0]||null;
    const attFiles=[...w.querySelectorAll('[data-k985-edit-attachment-input]')].flatMap(x=>[...(x.files||[])]);
    const totalRaw=[...(primary?[primary]:[]),...attFiles].reduce((n,f)=>n+Number(f.size||0),0);
    const useServerFallback=totalRaw>0&&totalRaw<=K9885_BANK_SERVER_RAW_BUDGET;
    const attachments=attFiles.length?await k985BankFilesPayload(attFiles,'attachment',useServerFallback):[];
    if(primary){
      const primaryPayload=(await k985BankFilesPayload([primary],'primary',useServerFallback))[0];
      await api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({
        replaceDocumentId:documentId,...primaryPayload,attachments
      })});
    }else if(attachments.length){
      await api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({attachToDocumentId:documentId,attachments})});
    }
    st.textContent=primary?'✓ اطلاعات و فایل اصلی جدید ذخیره شد.':attachments.length?'✓ اطلاعات و پیوست‌های جدید ذخیره شد.':'✓ تغییرات سند ذخیره و در سابقه ممیزی ثبت شد.';
    setTimeout(async()=>{w.remove();await runBankSearch()},750);
   }catch(err){st.textContent=err.message}
  };
 }catch(e){
   w.innerHTML=`<div class="k983editdialog"><div class="k983edithead"><b>ویرایش سند</b><button type="button" data-close>×</button></div><div class="k76empty">${esc(e.message)}</div></div>`;
   w.querySelector('[data-close]').onclick=()=>w.remove();
 }
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
const k9926PreservedDocumentStack=[];

function k9926ClearPreserved(){
 while(k9926PreservedDocumentStack.length){
   const x=k9926PreservedDocumentStack.pop();
   try{x.node?.remove()}catch{}
 }
}
function closeDocumentModal(){
 document.getElementById('k91docmodal')?.remove();
 k9926ClearPreserved();
 document.body.classList.remove('k91-modal-open');
}
function k9926RestorePrevious(){
 const current=document.getElementById('k91docmodal');
 current?.remove();
 const prev=k9926PreservedDocumentStack.pop();
 if(!prev){document.body.classList.remove('k91-modal-open');return}
 prev.node.id='k91docmodal';
 document.body.appendChild(prev.node);
 document.body.classList.add('k91-modal-open');
 window.__K951_ACTIVE_DOC_ID=prev.documentId;
 window.__K950_ACTIVE_DOC_ID=prev.documentId;
 window.__K992_ACTIVE_DOC_ID=prev.documentId;
 const body=prev.node.querySelector('.k91modalbody');
 if(body)body.scrollTop=prev.scrollTop||0;
}

async function openDocumentModal(documentId,q=lastSearchQuery,mode='root'){
 const current=document.getElementById('k91docmodal');
 if(mode==='related'&&current){
   const body=current.querySelector('.k91modalbody');
   k9926PreservedDocumentStack.push({
     node:current,
     documentId:current.dataset.documentId||'',
     scrollTop:body?.scrollTop||0
   });
   current.remove();
 }else{
   current?.remove();
   if(mode==='root')k9926ClearPreserved();
 }

 window.__K951_ACTIVE_DOC_ID=documentId;window.__K950_ACTIVE_DOC_ID=documentId;window.__K992_ACTIVE_DOC_ID=documentId;
 const w=document.createElement('div');w.id='k91docmodal';w.className='k91modalbackdrop';w.dataset.documentId=documentId;
 w.innerHTML='<div class="k91modal"><div class="k91modal-loading">در حال دریافت متن سند…</div></div>';
 w.onclick=e=>{if(e.target===w)closeDocumentModal()};
 document.body.appendChild(w);document.body.classList.add('k91-modal-open');

 try{
  const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(documentId)+'&detail=1'),x=(d.items||[])[0]||{};
  if(!x.id)throw Error('سند پیدا نشد یا دسترسی مجاز نیست.');
  const body=String(x.fullText||'').trim(),rendered=q?highlightText(body,q):esc(body);
  const back=k9926PreservedDocumentStack.length?`<div class="k9926relationbackbar"><button type="button" class="k9926relationback">← بازگشت به سند قبلی</button></div>`:'';
  w.innerHTML=`<div class="k91modal" role="dialog" aria-modal="true"><div class="k91modalhead"><div><div class="k91modalbadges"><span>${docClass(x.documentClass)}</span><span>${statusLabel(x.validityStatus)}</span>${classLabel(x.classification)!==docClass(x.documentClass)?`<span>${classLabel(x.classification)}</span>`:''}</div><h3>${esc(x.title||'بدون عنوان')}</h3>${metaLine(x)}</div><button class="k91modalclose" type="button">×</button></div><div class="k91modalmeta"><span>تاریخ تصویب/صدور <b>${fmtDate(x.issuedAt||x.createdAt)}</b></span><span>تاریخ ابلاغ <b>${fmtDate(x.promulgationDate)}</b></span><span>شماره جلسه <b>${esc(x.meetingNumber||'—')}</b></span><span>شماره سند <b>${esc(x.documentNumber||'—')}</b></span></div>${back}<div class="k91modalbody">${body?`<div class="k91fulltext">${rendered}</div>`:'<div class="k76empty">متن استخراج‌شده‌ای وجود ندارد.</div>'}</div></div>`;
  w.querySelector('.k91modalclose').onclick=closeDocumentModal;
  const backBtn=w.querySelector('.k9926relationback');
  if(backBtn)backBtn.onclick=k9926RestorePrevious;
  persianize(w);
  if(q)setTimeout(()=>w.querySelector('.k91highlight')?.scrollIntoView({block:'center',behavior:'smooth'}),80);
 }catch(e){
  w.innerHTML=`<div class="k91modal"><div class="k91modalhead"><h3>مشاهده سند</h3><button class="k91modalclose">×</button></div><div class="k76empty">${esc(e.message)}</div></div>`;
  w.querySelector('.k91modalclose').onclick=closeDocumentModal
 }
}

window.__ORG_OPEN_DOCUMENT__=(documentId,q='')=>openDocumentModal(documentId,q,'related');
document.addEventListener('click',e=>{
 const p=e.target?.closest?.('#k91docmodal .k944relmain [data-doc-preview],#k91docmodal .k944relations [data-doc-preview]');
 if(!p?.dataset.docPreview)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 openDocumentModal(p.dataset.docPreview,'');
},true);

async function openBank(){
 const ctx=document.getElementById('workspaceContext');if(ctx)ctx.classList.add('k91-hidden-workspace');
 const x=ensureShell(),b=x.querySelector('#k76body');b.innerHTML=bankMarkup();
 bindCombo(document.getElementById('k958subject'),[]);
 bindCombo(document.getElementById('k958meetingtype'),[]);
 await k982LoadEditPermission();
 document.getElementById('k91search').onsubmit=e=>{e.preventDefault();runBankSearch()};
 document.getElementById('k958clear').onclick=()=>{document.getElementById('k91search').reset();runBankSearch()};
 b.onclick=e=>{
   const more=e.target.closest('[data-k970-more]');
   if(more){
     const wrap=more.closest('.k970morewrap'),items=wrap?.querySelector('.k970moreitems');
     if(items){items.hidden=!items.hidden;more.textContent=items.hidden?'نمایش تطابق‌های بیشتر':'بستن تطابق‌های بیشتر'}
     return;
   }
   const edit=e.target.closest('[data-doc-edit]');if(edit){k982OpenEdit(edit.dataset.docEdit);return}
   const p=e.target.closest('[data-doc-preview]');if(p)openDocumentModal(p.dataset.docPreview,lastSearchQuery,'root')
 };
 const from=formDate('from'),to=formDate('to');
 function formDate(name){return document.querySelector(`#k91search input[name="${name}"]`)}
 if(window.__ORG_JALALI_ENHANCE__){
   if(from)window.__ORG_JALALI_ENHANCE__(from,'از تاریخ');
   if(to)window.__ORG_JALALI_ENHANCE__(to,'تا تاریخ');
 }
 await runBankSearch();
}
window.addEventListener('click',e=>{
 const c=e.target?.closest?.('[data-capability="بانک اسناد"],[data-kbank]');
 if(c){e.preventDefault();e.stopPropagation();openBank()}
},true);
new MutationObserver(()=>{enhanceExistingShell(document.getElementById('knowledge076'));injectWorkspaceCard()}).observe(document.documentElement,{subtree:true,childList:true});
enhanceExistingShell(document.getElementById('knowledge076'));injectWorkspaceCard();
})();