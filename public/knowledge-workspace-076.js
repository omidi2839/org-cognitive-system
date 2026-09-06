/* Build 0.7.6.4 — Document Separation & Analysis Queue */
(()=>{
const state={kind:'upstream'};
const api=async(p,o={})=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})},...o});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا');return d};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function shell(title,subtitle,tabs=true){
 let x=document.getElementById('knowledge076');
 if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main').prepend(x)}
 x.innerHTML=`<div class="k76head"><div><small>Build 0.7.6.4 · بنیاد دانش سازمانی</small><h2>${title}</h2><p>${subtitle}</p></div><button data-kclose>×</button></div>
 ${tabs?'<div class="k76tabs"><button data-krepo>مخزن اسناد</button><button data-kadd>افزودن سند</button><button data-kflow>مسیر شناختی</button></div>':''}<div id="k76body"></div>`;
 x.querySelector('[data-kclose]').onclick=()=>x.remove();
 return x;
}

function panel(kind){
 state.kind=kind;
 const up=kind==='upstream';
 const x=shell(up?'اسناد بالادستی':'اسناد عمومی','سند → استخراج → گزاره/مفهوم → شاهد → بررسی انسانی → دانش معتبر');
 x.querySelector('[data-krepo]').onclick=repo;
 x.querySelector('[data-kadd]').onclick=()=>form(up);
 x.querySelector('[data-kflow]').onclick=flow;
 repo();
}

function groupEvidenceCards(){document.querySelectorAll('.k77box.questions').forEach(box=>{const forms=[...box.querySelectorAll('form[data-cq]')];let last=null;forms.forEach(form=>{const ev=form.querySelector('.k83rawEvidence');if(!ev)return;const key=ev.dataset.evidence||'';if(last&&last.key===key){ev.remove();last.wrap.appendChild(form)}else{const wrap=document.createElement('section');wrap.className='k83evidenceGroup';const head=document.createElement('div');head.className='k83evidenceHead';head.innerHTML='<b>شاهد از سند</b><div>'+ev.textContent.replace('شاهد از سند:','').trim()+'</div>';form.parentNode.insertBefore(wrap,form);wrap.appendChild(head);ev.remove();wrap.appendChild(form);last={key,wrap}}})})}
async function repo(){
 const b=document.getElementById('k76body');
 b.innerHTML='<div class="k76loading">در حال دریافت مخزن تفکیک‌شده…</div>';
 try{
   const d=await api(`/api/v1/knowledge/documents?class=${encodeURIComponent(state.kind)}`),s=d.summary||{};
   const label=state.kind==='upstream'?'بالادستی':'عمومی';
   b.innerHTML=`<div class="k76metrics"><div><b>${s.documents||0}</b><span>سند ${label}</span></div><div><b>${s.reviewPending||0}</b><span>نیازمند بررسی انسانی</span></div><div><b>${s.duplicateGroups||0}</b><span>گروه تکراری در همین مخزن</span></div></div>
   <div class="k76repohead"><strong>مخزن اسناد ${label}</strong><span>این شمارش فقط مربوط به همین طبقه سند است.</span></div>
   <div class="k76docs">${(d.items||[]).length?(d.items||[]).map(docRow).join(''):'<div class="k76empty">در این مخزن هنوز سندی ثبت نشده است.</div>'}</div>
   <div class="k76note">تفکیک «بالادستی / عمومی» ویژگی پایدار خود سند است و در Backend ذخیره می‌شود.</div>`;
 }catch(e){b.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}

function docRow(d){
 const classLabel=d.documentClass==='upstream'?'بالادستی':d.documentClass==='general'?'عمومی':'طبقه‌بندی‌نشده';
 const st=d.status==='processed'?'تحلیل‌شده':'ثبت‌شده';
 return `<article class="k76doc"><div><b>${esc(d.title)}</b><small>${esc(d.documentType||'—')} · ${classLabel}${d.issuer?' · '+esc(d.issuer):''}</small></div>
 <div class="k76docmeta"><span>${st}</span><span>نسخه ${esc(d.version||1)}</span><span>${esc(d.validityStatus||'unknown')}</span></div></article>`;
}

function form(up){
 const b=document.getElementById('k76body');
 const types=up?['مأموریت','چشم‌انداز','اهداف کلان','سیاست','راهبرد','چارچوب','ضوابط','قانون/الزام بیرونی']:['آیین‌نامه','دستورالعمل','بخشنامه','گزارش','صورتجلسه','نامه رسمی','سایر'];
 const classificationOptions=up?'<option value="confidential">محرمانه</option><option value="public">عمومی</option>':'<option value="public">عمومی</option><option value="confidential">محرمانه</option>';
 const scopeHtml=up?`<label>دامنه سازمانی<select name="scopeType" id="k76scopeType"><option value="organization">کل سازمان</option><option value="unit">واحد سازمانی</option></select></label>
 <label id="k76unitWrap" style="display:none">واحد سازمانی<select name="organizationalUnitRef" id="k76unitSelect"><option value="">انتخاب واحد سازمانی…</option></select><small id="k76unitHelp">فهرست باید از ساختار سازمانی دریافت شود.</small></label>`:
 `<label>دامنه سازمانی<select name="organizationalLevel"><option>کل سازمان</option><option>واحد سازمانی</option></select></label>`;

 b.innerHTML=`<form id="k76form"><div class="k76grid">
 <label>عنوان سند<input name="title" required></label><label>نوع سند<select name="documentType">${types.map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label>مرجع صادرکننده<input name="issuer"></label><label>نسخه<input name="versionLabel"></label>
 <label>تاریخ صدور<input type="date" name="issuedAt"></label><label>پایان اعتبار<input type="date" name="validUntil"></label>
 <label>وضعیت اعتبار<select name="validityStatus"><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="unknown">نیازمند احراز</option></select></label>
 ${scopeHtml}<label>حوزه موضوعی<input name="subjectArea"></label><label>طبقه‌بندی<select name="classification">${classificationOptions}</select></label></div>
 <label class="k76file">فایل اصلی <small class="k80formats">Word · PDF · PowerPoint · Excel · Text · Image</small><input type="file" name="file" required accept=".docx,.pdf,.pptx,.xlsx,.txt,.md,.png,.jpg,.jpeg,.webp"></label>
 <button class="k76primary">ثبت سند</button><div id="k76status"></div></form>`;

 async function loadUnits(){
  const sel=document.getElementById('k76unitSelect'),help=document.getElementById('k76unitHelp'); if(!sel)return;
  sel.innerHTML='<option value="">در حال دریافت ساختار سازمانی…</option>';
  try{const r=await api('/api/v1/organization/units'),units=r.units||[];sel.innerHTML=units.length?'<option value="">انتخاب واحد سازمانی…</option>'+units.map(u=>`<option value="${esc(u.id)}" data-name="${esc(u.name)}">${esc(u.name)}</option>`).join(''):'<option value="">ساختار سازمانی هنوز تعریف نشده است</option>';help.textContent=units.length?'فهرست از ساختار سازمانی دریافت شد.':'پس از تعریف ساختار سازمانی، واحدها اینجا نمایش داده می‌شوند.'}
  catch(e){sel.innerHTML='<option value="">ساختار سازمانی هنوز متصل نشده است</option>';help.textContent='پس از عملیاتی‌شدن ساختار سازمانی، این فهرست به آن متصل می‌شود.'}
 }
 if(up){const scope=document.getElementById('k76scopeType'),wrap=document.getElementById('k76unitWrap');scope.onchange=()=>{const show=scope.value==='unit';wrap.style.display=show?'block':'none';if(show)loadUnits()}}

 document.getElementById('k76form').onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),file=f.get('file'),st=document.getElementById('k76status');
  if(up&&f.get('scopeType')==='unit'&&!f.get('organizationalUnitRef')){st.textContent='برای دامنه «واحد سازمانی»، انتخاب واحد الزامی است.';return}
  st.textContent='در حال ثبت و استخراج متن سند…';
  try{
   const b64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(file)});
   const unitSel=document.getElementById('k76unitSelect'),unitName=unitSel?.selectedOptions?.[0]?.dataset?.name||null;
   const metadata={documentClass:up?'upstream':'general',documentType:f.get('documentType'),issuer:f.get('issuer'),versionLabel:f.get('versionLabel'),issuedAt:f.get('issuedAt'),validUntil:f.get('validUntil'),validityStatus:f.get('validityStatus'),organizationalLevel:up?(f.get('scopeType')==='organization'?'کل سازمان':'واحد سازمانی'):f.get('organizationalLevel'),scopeType:up?f.get('scopeType'):null,organizationalUnitRef:up&&f.get('scopeType')==='unit'?f.get('organizationalUnitRef'):null,organizationalUnitName:up&&f.get('scopeType')==='unit'?unitName:null,subjectArea:f.get('subjectArea')};
   const d=await api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({title:f.get('title'),fileName:file.name,mimeType:file.type||'application/octet-stream',contentBase64:b64,classification:f.get('classification'),knowledgeZone:'organizational',metadata})});
   st.innerHTML=`<b>سند در مخزن ${up?'بالادستی':'عمومی'} ثبت شد.</b><br>شناسه: ${esc(d.document?.id||'—')} · برای تحلیل، از کارت «تحلیل اسناد» سند را انتخاب کنید.`;
  }catch(err){st.textContent=err.message}
 }
}

function flow(){document.getElementById('k76body').innerHTML=`<div class="k76flow">${['سند اصلی','استخراج و نرمال‌سازی','انتخاب برای تحلیل','مفهوم / گزاره پیشنهادی','اتصال به شاهد','بررسی انسانی','دانش معتبر'].map((x,i)=>`<span><b>0${i+1}</b>${x}</span>`).join('<i>←</i>')}</div><div class="k76note"><b>اصل بنیادین:</b> ثبت سند و تحلیل سند دو مرحله مستقل‌اند.</div>`}

async function analysisPanel(){
 shell('تحلیل شناختی اسناد','اسناد بر اساس چرخه تحلیل تفکیک شده‌اند؛ مشاهده تحلیل هرگز تحلیل مجدد اجرا نمی‌کند.',false);
 const b=document.getElementById('k76body');b.innerHTML='<div class="k76loading">در حال دریافت چرخه تحلیل اسناد…</div>';
 try{
  const d=await api('/api/v1/knowledge/documents'),items=(d.items||[]).filter(x=>['upstream','general'].includes(x.documentClass));
  const queue=items.filter(x=>!x.analysis),review=items.filter(x=>x.analysis&&x.analysis.status!=='approved'),approved=items.filter(x=>x.analysis?.status==='approved');
  b.innerHTML=`${analysisGroup('در انتظار تحلیل','queue',queue,'این اسناد هنوز وارد فهم شناختی نشده‌اند.')}
  ${analysisGroup('تحلیل‌شده / در انتظار بررسی','review',review,'تحلیل وجود دارد؛ آن را مشاهده، تکمیل و تأیید کنید.')}
  ${analysisGroup('تحلیل تأییدشده','approved',approved,'معنای تأییدشده و منشأ آن قابل مشاهده است.')}<div id="k77detail"></div>`;
  b.querySelectorAll('[data-start-analysis]').forEach(x=>x.onclick=()=>startAnalysis(x.dataset.startAnalysis));
  b.querySelectorAll('[data-view-analysis]').forEach(x=>x.onclick=()=>viewAnalysis(x.dataset.viewAnalysis));
 }catch(e){b.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
function analysisGroup(title,type,items,desc){
 const label={queue:'در صف',review:'نیازمند بررسی',approved:'تأییدشده'}[type];
 return `<section class="k77group ${type}"><header><div><b>${title}</b><small>${desc}</small></div><span>${items.length}</span></header>
 <div class="k76docs">${items.length?items.map(d=>`<article class="k76doc"><div><span class="k76class ${d.documentClass}">${d.documentClass==='upstream'?'بالادستی':'عمومی'}</span><b>${esc(d.title)}</b><small>${esc(d.documentType||'—')} ${d.analysis?'· تحلیل v'+d.analysis.version:''}</small></div><div class="k76docmeta"><span>${label}</span>${d.analysis?.openQuestions?`<span>${d.analysis.openQuestions} پرسش باز</span>`:''}<button ${type==='queue'?`data-start-analysis="${esc(d.id)}"`:`data-view-analysis="${esc(d.id)}"`}>${type==='queue'?'ورود به تحلیل':type==='approved'?'مشاهده دانش تأییدشده':'مشاهده و بررسی تحلیل'}</button></div></article>`).join(''):'<div class="k77emptygroup">موردی وجود ندارد.</div>'}</div></section>`;
}
async function startAnalysis(id){
 const d=document.getElementById('k77detail');d.innerHTML='<div class="k76loading">در حال ساخت پرونده فهم شناختی سند…</div>';
 try{await api(`/api/v1/documents/${encodeURIComponent(id)}/cognitive-analysis`,{method:'POST',body:'{}'});await viewAnalysis(id);await refreshAnalysisGroups()}catch(e){d.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
async function refreshAnalysisGroups(){ /* deliberate: detail remains visible; list refresh happens next open to avoid destroying review state */ }
async function viewAnalysis(id){
 const d=document.getElementById('k77detail');d.innerHTML='<div class="k76loading">در حال دریافت تحلیل موجود؛ بدون اجرای تحلیل مجدد…</div>';
 try{const r=await api(`/api/v1/documents/${encodeURIComponent(id)}/cognitive-analysis`),a=r.analysis;renderUnderstanding(id,a,r.versions||[])}catch(e){d.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
function renderQuestion(q,id,index){
 const concepts=q.semanticContext?.highlightConcepts||[],rels=q.semanticContext?.proposedRelations||[];
 if(q.status==='answered')return `<div class="k831question answered"><small>پرسش ${index+1}</small>${concepts.length?`<div class="k82concepts">${concepts.map(c=>`<span title="نامزد معنایی استخراج‌شده از ساختار همین گزاره">${esc(c)}</span>`).join('')}</div>`:''}<div class="k82question">${esc(q.question)}</div>${rels.length?`<div class="k82relations"><b>نسبت‌های پیشنهادی:</b>${rels.map(x=>`<span class="k82relation">${esc(x)}</span>`).join('')}</div>`:''}<p>پاسخ: ${esc(q.answer)}</p></div>`;
 return `<form class="k831question" data-cq="${esc(q.id)}" data-doc="${esc(id)}"><small>پرسش ${index+1}</small>${concepts.length?`<div class="k82concepts">${concepts.map(c=>`<span title="نامزد معنایی استخراج‌شده از ساختار همین گزاره">${esc(c)}</span>`).join('')}</div>`:''}${q.semanticContext?.interpretation?`<div class="k82interpret"><b>برداشت اولیه سامانه:</b> ${esc(q.semanticContext.interpretation)}</div>`:''}<div class="k82question">${esc(q.question)}</div>${rels.length?`<div class="k82relations"><b>نسبت‌های پیشنهادی:</b>${rels.map(x=>`<span class="k82relation">${esc(x)}</span>`).join('')}</div>`:''}<small>${esc(q.reason)}</small><textarea required placeholder="پاسخ شما برای اصلاح معنای سازمانی…"></textarea><button>ثبت پاسخ و اصلاح مدل فهم</button></form>`;
}
function groupedQuestions(a,id){
 const groups=[],by=new Map();
 for(const q of (a.questions||[])){const key=q.evidenceGroupId||q.evidence||q.id;if(!by.has(key)){const g={key,evidence:q.evidence||'',items:[]};by.set(key,g);groups.push(g)}by.get(key).items.push(q)}
 return groups.map((g,gi)=>{const done=g.items.every(q=>q.status==='answered'),open=g.items.some(q=>q.status==='open');return `<section class="k842evidenceGroup ${done?'done':''}" data-evidence-group="${esc(g.key)}"><button type="button" class="k842evidenceToggle" aria-expanded="false"><span class="k842plus">+</span><span class="k842num">گزاره ${gi+1}</span><span class="k842title">${esc(g.evidence)}</span>${done?'<span class="k842done">تکمیل شد ✓</span>':`<span class="k842count">${g.items.filter(q=>q.status==='open').length} پرسش</span>`}</button><div class="k842evidenceBody" hidden><div class="k831evidence">${esc(g.evidence)}</div><div class="k831questions">${g.items.map((q,i)=>renderQuestion(q,id,i)).join('')}</div></div></section>`}).join('')||'<small>پرسشی ایجاد نشده است.</small>';
}
function wireEvidenceAccordions(root){
 root.querySelectorAll('.k842evidenceToggle').forEach(btn=>btn.onclick=()=>{const body=btn.nextElementSibling,willOpen=body.hidden;root.querySelectorAll('.k842evidenceBody').forEach(x=>x.hidden=true);root.querySelectorAll('.k842evidenceToggle').forEach(x=>{x.setAttribute('aria-expanded','false');const p=x.querySelector('.k842plus');if(p)p.textContent='+'});body.hidden=!willOpen;btn.setAttribute('aria-expanded',String(willOpen));btn.querySelector('.k842plus').textContent=willOpen?'−':'+'});
}
function openNextEvidence(root,afterKey=null){
 const groups=[...root.querySelectorAll('.k842evidenceGroup')];let start=afterKey?groups.findIndex(g=>g.dataset.evidenceGroup===afterKey)+1:0;
 const target=groups.slice(start).find(g=>!g.classList.contains('done'))||groups.find(g=>!g.classList.contains('done'));
 target?.querySelector('.k842evidenceToggle')?.click();
}
function renderUnderstanding(id,a,versions){
 const d=document.getElementById('k77detail');
 d.innerHTML=`<section class="k77understanding"><header><div><small>پرونده فهم سند · نسخه ${a.version}</small><h3>تحلیل شناختی سند</h3><p>${esc(a.understanding?.summary||'')}</p></div><span class="k77confidence">اطمینان ${Math.round((a.understanding?.confidence||0)*100)}٪</span></header>
 <div class="k78quality"><b>کیفیت ورود و استخراج</b><span>${a.extractionQuality?Math.round(a.extractionQuality.score*100)+'٪ · '+esc(a.extractionQuality.message):'—'}</span></div>
 <div class="k77box questions"><h4>پرسش‌های شناختی برای تکمیل فهم</h4>${groupedQuestions(a,id)}</div>
 <div class="k77actions"><button class="secondary" data-reanalyze="${esc(id)}">ایجاد نسخه جدید تحلیل</button>${a.status!=='approved'?'<button class="approve" data-approve="'+esc(id)+'">تأیید تحلیل تکمیل‌شده</button>':'<span class="approved">تحلیل تأیید شده است</span>'}</div>
 <div class="k76note">مشاهده تحلیل ≠ تحلیل مجدد. تحلیل مجدد فقط با «ایجاد نسخه جدید تحلیل» انجام می‌شود و نسخه قبلی حفظ می‌گردد.</div></section>`;
 wireEvidenceAccordions(d);
 d.querySelectorAll('[data-cq]').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const ta=f.querySelector('textarea'),btn=f.querySelector('button'),groupKey=f.closest('[data-evidence-group]')?.dataset.evidenceGroup;btn.disabled=true;try{const r=await api(`/api/v1/documents/${encodeURIComponent(f.dataset.doc)}/cognitive-questions`,{method:'POST',body:JSON.stringify({questionId:f.dataset.cq,answer:ta.value})});renderUnderstanding(f.dataset.doc,r.analysis,r.versions||[]);openNextEvidence(document.getElementById('k77detail'),groupKey)}catch(err){alert(err.message)}});
 d.querySelector('[data-reanalyze]')?.addEventListener('click',async e=>{if(!confirm('نسخه جدید تحلیل ساخته شود؟ نسخه فعلی حفظ خواهد شد.'))return;const r=await api(`/api/v1/documents/${encodeURIComponent(id)}/cognitive-analysis`,{method:'POST',body:JSON.stringify({forceNewVersion:true})});renderUnderstanding(id,r.analysis,versions)});
 d.querySelector('[data-approve]')?.addEventListener('click',async()=>{try{const r=await api(`/api/v1/documents/${encodeURIComponent(id)}/cognitive-analysis/approve`,{method:'POST',body:'{}'});renderUnderstanding(id,r.analysis,r.versions||[])}catch(err){alert(err.message)}});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-capability]');if(!b)return;
 if(b.dataset.capability==='اسناد بالادستی'){e.preventDefault();e.stopImmediatePropagation();panel('upstream')}
 if(b.dataset.capability==='اسناد عمومی'){e.preventDefault();e.stopImmediatePropagation();panel('general')}
 if(b.dataset.capability==='تحلیل اسناد'){e.preventDefault();e.stopImmediatePropagation();analysisPanel()}
},true);
})();