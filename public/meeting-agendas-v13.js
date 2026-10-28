/* Sina V1.6 — immediate, multi-file pre-save upload with safe draft attachment claiming. */
(()=>{'use strict';
const END='/api/v1/meeting-agendas', P='sma13-', digits='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>String(x??'').replace(/\d/g,n=>digits[Number(n)]);
const esc=s=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[v]));
const date=s=>s?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(new Date(s+'T12:00:00')):'فاقد تاریخ قطعی';
const statusLabel={scheduled:'زمان‌بندی‌شده',tentative:'در انتظار تعیین زمان',completed:'برگزارشده',cancelled:'لغوشده',draft:'پیش‌نویس',review:'در انتظار بررسی',approved:'تأییدشده'};
const shorten=(s,n=160)=>String(s||'').length>n?String(s).slice(0,n)+'…':String(s||'');
const state={meetings:[],items:[],meeting:null,query:'',from:'',to:'',status:'active',selectedDocs:[],links:[],edit:null};
let container=null,dialog=null,debounce,docRequestVersion=0,docCandidates=[],fileDraft=null;
const query=(resource,params={})=>{const s=new URLSearchParams({resource});Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')s.set(k,v)});return END+'?'+s};
async function api(resource,method='GET',data=null,params={}){
 let r;try{r=await fetch(query(resource,params),{method,credentials:'same-origin',cache:'no-store',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined})}catch{throw Error('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.')}
 const raw=await r.text();let json;try{json=JSON.parse(raw)}catch{throw Error(`سرور پاسخ معتبر نداد (HTTP ${r.status}). مسیر API و استقرار Vercel را بررسی کنید.`)}
 if(!r.ok)throw Error((json.message||'خطا در عملیات')+` (HTTP ${r.status})`);return json;
}
const card=x=>`<button class="sma13-meeting" type="button" data-select-meeting="${esc(x.id)}" aria-label="مشاهده دستورهای ${esc(x.title)}">
 <span class="sma13-meeting-title">${esc(x.title)}</span><span class="sma13-meeting-sub">${esc(date(x.startDate))} ${esc(x.startTime||'')} · ${esc(statusLabel[x.status]||'')} · ${fa(x.agendaCount||0)} دستور</span>
 <span class="sma13-meeting-arrow">‹</span></button>`;
const itemCard=(x,i)=>`<article class="sma13-agenda-item">
 <div class="sma13-agenda-num">${fa(i+1)}</div><div class="sma13-agenda-main"><div class="sma13-agenda-top"><strong>${esc(x.title)}</strong></div>
 ${x.description?`<p>${esc(shorten(x.description,280))}</p>`:''}<div class="sma13-agenda-meta">${x.presenter?`<span>ارائه‌دهنده: ${esc(x.presenter)}</span>`:''}<span>${fa(x.documents?.length||0)} سند مرتبط</span><span>${fa(x.attachments?.length||0)} پیوست</span></div>
 ${x.documents?.length?`<div class="sma13-document-tags">${x.documents.map(d=>`<button type="button" data-open-related-doc="${esc(d.id)}" title="مشاهده سند: ${esc(d.title)}">${esc(shorten(d.title,65))} ↗</button>`).join('')}</div>`:''}
 ${x.attachments?.length?`<div class="sma13-attach-list">${x.attachments.map(f=>`<a class="sma13-attachment" href="${query('download',{agendaId:x.id,attachmentId:f.id})}" download>${esc(f.fileName)} <span>↓</span></a>`).join('')}</div>`:''}
 ${x.referenceLinks?.length?`<div class="sma13-link-tags">${x.referenceLinks.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title)} ↗</a>`).join('')}</div>`:''}
 </div><div class="sma13-item-actions"><button type="button" data-edit-item="${esc(x.id)}">ویرایش</button><button type="button" data-delete-item="${esc(x.id)}" class="sma13-danger">حذف</button></div></article>`;
function message(s,err=false){const el=container?.querySelector('[data-agenda-message]');if(el){el.textContent=s||'';el.classList.toggle('error',err)}}
function showList(){if(!container)return;container.innerHTML=`<header class="sma13-header"><div><button type="button" data-back>بازگشت به مراحل جلسات</button><h2>دستور جلسات و مستندات</h2><p>انتخاب جلسه، جست‌وجوی موضوع و تاریخ، ثبت و مدیریت دستورها</p></div></header>
 <div class="sma13-filter"><label class="sma13-search">جست‌وجو در موضوع جلسه، دستورها، اعضا و اسناد<input data-filter-q placeholder="موضوع جلسه، عنوان دستور، شماره سند…" value="${esc(state.query)}"></label>
 <label>از تاریخ<input type="date" data-filter-from value="${esc(state.from)}"></label><label>تا تاریخ<input type="date" data-filter-to value="${esc(state.to)}"></label>
 <label>وضعیت<select data-filter-status><option value="active">جلسات موجود و فعال</option><option value="scheduled">زمان‌بندی‌شده</option><option value="all">تمام جلسات</option><option value="cancelled">لغوشده</option></select></label><button type="button" data-clear-filter>پاک کردن فیلتر</button></div>
 <div class="sma13-list-top"><strong>فهرست جلسات</strong><span>${fa(state.meetings.length)} جلسه</span></div><div data-meeting-list class="sma13-meetings">${state.meetings.length?state.meetings.map(card).join(''):'<p class="sma13-empty">جلسه‌ای با شرایط جست‌وجو یافت نشد.</p>'}</div>
 <p class="sma13-message" data-agenda-message role="status"></p>`;
 container.querySelector('[data-filter-status]').value=state.status;
 container.querySelector('[data-back]').onclick=close;
 container.querySelector('[data-filter-q]').oninput=e=>{state.query=e.target.value;clearTimeout(debounce);debounce=setTimeout(loadMeetings,350)};
 for(const [k,key] of [['from','from'],['to','to']])container.querySelector(`[data-filter-${k}]`).onchange=e=>{state[key]=e.target.value;loadMeetings()};
 container.querySelector('[data-filter-status]').onchange=e=>{state.status=e.target.value;loadMeetings()};
 container.querySelector('[data-clear-filter]').onclick=()=>{state.query='';state.from='';state.to='';state.status='active';loadMeetings()};
 container.querySelectorAll('[data-select-meeting]').forEach(btn=>btn.onclick=()=>loadAgenda(btn.dataset.selectMeeting));
}
async function loadMeetings(){if(!container)return;const requested=state.query;try{const data=await api('meetings','GET',null,{q:requested,from:state.from,to:state.to,status:state.status});if(requested!==state.query)return;state.meetings=data.items||[];state.meeting=null;const list=container.querySelector('[data-meeting-list]');if(list){list.innerHTML=state.meetings.length?state.meetings.map(card).join(''):'<p class="sma13-empty">جلسه‌ای با شرایط جست‌وجو یافت نشد.</p>';container.querySelector('.sma13-list-top span').textContent=fa(state.meetings.length)+' جلسه';list.querySelectorAll('[data-select-meeting]').forEach(btn=>btn.onclick=()=>loadAgenda(btn.dataset.selectMeeting));}else showList()}catch(e){if(container.querySelector('[data-meeting-list]'))message(e.message,true);else{showList();message(e.message,true)}}}
function renderAgenda(){if(!container||!state.meeting)return;const m=state.meeting;
 container.innerHTML=`<header class="sma13-header"><div><button type="button" data-back-list>بازگشت به فهرست جلسات</button><h2>${esc(m.title)}</h2><p>${esc(date(m.startDate))} ${esc(m.startTime||'')} · ${fa(state.items.length)} دستور جلسه ثبت شده</p></div>${m.status==='cancelled'?'':`<button class="sma13-primary" data-new-agenda type="button">＋ افزودن دستور جلسه</button>`}</header>
 <div class="sma13-summary"><strong>دستور جلسات</strong><span>برای هر دستور می‌توانید موضوع، پیوست‌ها و ارتباط با قوانین و اسناد ثبت‌شده سازمان را تکمیل کنید.</span></div>
 <div class="sma13-items">${state.items.length?state.items.map(itemCard).join(''):'<div class="sma13-empty"><strong>هنوز دستور جلسه‌ای ثبت نشده است.</strong><p>برای شروع، روی «افزودن دستور جلسه» کلیک کنید.</p></div>'}</div>
 <p class="sma13-message" data-agenda-message role="status"></p>`;
 container.querySelector('[data-back-list]').onclick=loadMeetings;
 container.querySelector('[data-new-agenda]')?.addEventListener('click',()=>openEdit());
 container.querySelectorAll('[data-edit-item]').forEach(b=>b.onclick=()=>openEdit(state.items.find(x=>x.id===b.dataset.editItem)));
 container.querySelectorAll('[data-delete-item]').forEach(b=>b.onclick=()=>removeItem(b.dataset.deleteItem));
 container.querySelectorAll('[data-open-related-doc]').forEach(b=>b.onclick=()=>{if(window.__ORG_OPEN_DOCUMENT__)window.__ORG_OPEN_DOCUMENT__(b.dataset.openRelatedDoc);else message('نمایش سند از بانک اسناد در این نسخه بارگذاری نشده است.',true)});
}
async function loadAgenda(id){if(!container)return;try{const data=await api('items','GET',null,{meetingId:id});state.meeting=data.meeting;state.items=data.items||[];renderAgenda()}catch(e){message(e.message,true)}}
async function removeItem(id){if(!confirm('این دستور جلسه حذف شود؟ سوابق آن برای ممیزی حفظ می‌شود.'))return;try{await api('remove','POST',{id});await loadAgenda(state.meeting.id);message('دستور جلسه حذف شد.')}catch(e){message(e.message,true)}}
function docTag(d){return `<span class="sma13-selected-doc" data-doc-id="${esc(d.id)}"><span>${esc(shorten(d.title,90))}</span><button type="button" data-unlink-doc="${esc(d.id)}" aria-label="حذف ارتباط سند">×</button></span>`}
function linkRow(x={},i=0){return `<div class="sma13-link-row"><input data-link-title placeholder="عنوان پیوند یا مرجع" maxlength="200" value="${esc(x.title||'')}"><input data-link-url placeholder="https://..." type="url" maxlength="1300" value="${esc(x.url||'')}"><button type="button" data-remove-link title="حذف پیوند">×</button></div>`}
function updateSelected(){const e=dialog?.querySelector('[data-selected-docs]');if(!e)return;
 e.innerHTML=state.selectedDocs.length?state.selectedDocs.map(docTag).join(''):'<span class="sma13-muted">هنوز سندی مرتبط نشده است.</span>';
 const count=dialog.querySelector('[data-selected-count]');if(count)count.textContent=fa(state.selectedDocs.length);
 e.querySelectorAll('[data-unlink-doc]').forEach(b=>b.onclick=()=>{
  const removed=state.selectedDocs.find(x=>x.id===b.dataset.unlinkDoc);
  state.selectedDocs=state.selectedDocs.filter(x=>x.id!==b.dataset.unlinkDoc);updateSelected();
  documentSearchMessage(removed?'ارتباط سند «'+shorten(removed.title,65)+'» از این دستور برداشته شد.':'');
 });
}
function documentSearchMessage(s){const el=dialog?.querySelector('[data-doc-feedback]');if(el)el.textContent=s||''}
function hideDocResults(){
 docRequestVersion++;
 const results=dialog?.querySelector('[data-doc-results]');if(results){results.hidden=true;results.innerHTML=''}
 const close=dialog?.querySelector('[data-close-doc-results]');if(close)close.hidden=true;
 const search=dialog?.querySelector('[data-search-doc]');if(search)search.setAttribute('aria-expanded','false');
 docCandidates=[];
}
function addDocumentFromResults(id){
 const doc=docCandidates.find(x=>x.id===id);if(!doc){documentSearchMessage('سند انتخابی در نتایج موجود نیست. مجدداً جست‌وجو کنید.');return}
 if(state.selectedDocs.some(x=>x.id===doc.id)){
  hideDocResults();documentSearchMessage('این سند قبلاً به دستور جلسه اضافه شده است.');return;
 }
 state.selectedDocs.push({id:doc.id,title:doc.title,documentType:doc.documentType||'',documentNumber:doc.documentNumber||''});
 updateSelected();hideDocResults();
 documentSearchMessage('سند «'+shorten(doc.title,80)+'» انتخاب شد؛ با دکمه «ذخیره دستور جلسه» ارتباط آن ثبت می‌شود.');
}
function updateAttachments(item){
 const box=dialog?.querySelector('[data-existing-attachments]');if(!box)return;
 const files=item?.attachments||[];
 box.innerHTML=files.length?files.map(f=>{
  const marked=fileDraft?.removed?.has(f.id);
  return `<div class="sma13-file-row ${marked?'sma13-file-pending-delete':''}"><span><a href="${query('download',{agendaId:item.id,attachmentId:f.id})}" target="_blank" rel="noopener">${esc(f.fileName)}</a><small> ${fa(Math.max(1,Math.ceil(f.size/1024)))} کیلوبایت${marked?' · حذف هنگام ذخیره':''}</small></span><button type="button" data-toggle-existing="${esc(f.id)}">${marked?'بازگرداندن':'حذف'}</button></div>`;
 }).join(''):'<span class="sma13-muted">هنوز پیوست قبلی وجود ندارد.</span>';
 box.querySelectorAll('[data-toggle-existing]').forEach(b=>b.onclick=()=>{
  if(!fileDraft||fileDraft.saving)return;
  const id=b.dataset.toggleExisting;
  if(fileDraft.removed.has(id))fileDraft.removed.delete(id);else fileDraft.removed.add(id);
  updateAttachments(item);renderDraftFiles();
 });
}
function renderDraftFiles(){
 const box=dialog?.querySelector('[data-staged-files]'),summary=dialog?.querySelector('[data-file-summary]');if(!box||!fileDraft)return;
 const label={waiting:'در صف بارگذاری',uploading:'در حال بارگذاری…',uploaded:'بارگذاری شد ✓',failed:'بارگذاری ناموفق'};
 box.innerHTML=fileDraft.files.map(f=>`<div class="sma13-file-row sma13-staged-file" data-staged-row="${esc(f.id)}"><span class="sma13-file-text"><strong title="${esc(f.file.name)}">${esc(f.file.name)}</strong><small>${fa(Math.max(1,Math.ceil(f.file.size/1024)))} کیلوبایت · <span class="${f.status==='uploaded'?'sma13-file-good':f.status==='failed'?'sma13-file-error':''}">${label[f.status]}</span>${f.error?` · ${esc(shorten(f.error,130))}`:''}</small></span><span class="sma13-file-actions">${f.status==='failed'?`<button type="button" data-retry-staged="${esc(f.id)}">تلاش دوباره</button>`:''}<button type="button" data-remove-staged="${esc(f.id)}" ${['waiting','uploading'].includes(f.status)?'disabled':''}>حذف</button></span></div>`).join('');
 const active=fileDraft.files.filter(f=>f.status==='uploaded').length;
 const failed=fileDraft.files.filter(f=>f.status==='failed').length;
 summary.textContent=fileDraft.files.length?`${fa(active)} فایل بارگذاری‌شده · ${fa(fileDraft.uploading)} در حال ارسال${failed?` · ${fa(failed)} فایل نیازمند بررسی`:''}`:'می‌توانید چند بار فایل انتخاب کنید و هر بار فایل‌های جدید به فهرست افزوده می‌شوند.';
 const submit=dialog.querySelector('[data-submit]');if(submit)submit.disabled=Boolean(fileDraft.uploading||fileDraft.saving);
 box.querySelectorAll('[data-retry-staged]').forEach(b=>b.onclick=()=>{const f=fileDraft?.files.find(x=>x.id===b.dataset.retryStaged);if(f)uploadDraftFile(f)});
 box.querySelectorAll('[data-remove-staged]').forEach(b=>b.onclick=()=>removeDraftFile(b.dataset.removeStaged));
}
// Files of this size fit safely in one authenticated Vercel Function request
// after base64 encoding; larger files keep the existing presigned browser path.
const DIRECT_UPLOAD_LIMIT=2*1024*1024;
function readAsBase64(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>{const value=String(reader.result||'');const idx=value.indexOf(',');
   if(idx<0)reject(Error('فایل قابل خواندن نیست.'));else resolve(value.slice(idx+1));};
  reader.onerror=()=>reject(Error('خواندن فایل در مرورگر انجام نشد.'));
  reader.readAsDataURL(file);
 });
}
async function uploadDraftFile(entry){
 const working=fileDraft,formDialog=dialog;if(!working||working.saving)return;
 entry.status='uploading';entry.error='';working.uploading++;renderDraftFiles();
 try{
  // A failed attempt may have created an intent. Revoke it before retrying.
  if(entry.stageId)await api('clear-uploads','POST',{meetingId:state.meeting.id,draftId:working.draftId,stageId:entry.stageId});
  entry.stageId=null;
  if(entry.file.size<=DIRECT_UPLOAD_LIMIT){
   const contentBase64=await readAsBase64(entry.file);
   const result=await api('direct-upload','POST',{meetingId:state.meeting.id,draftId:working.draftId,
    fileName:entry.file.name,mimeType:entry.file.type||'application/octet-stream',size:entry.file.size,contentBase64});
   entry.stageId=result.stageId;
  }else{
   const data=await api('upload-url','POST',{meetingId:state.meeting.id,draftId:working.draftId,fileName:entry.file.name,mimeType:entry.file.type||'application/octet-stream',size:entry.file.size});
   entry.stageId=data.stageId;
   const upload=await fetch(data.presignedUrl,{method:'PUT',body:entry.file});
   if(!upload.ok)throw Error(`ارسال فایل انجام نشد (HTTP ${upload.status})`);
   // A 2xx alone is not proof the object was created. Check the control API's
   // returned pathname (if present), then let our API verify the object.
   let receipt={};try{receipt=await upload.json()}catch{}
   if(receipt?.pathname&&data.pathname&&receipt.pathname!==data.pathname)
    throw Error('فضای فایل مسیر متفاوتی برای پیوست برگرداند. بارگذاری ثبت نشد.');
   await api('finish-upload','POST',{meetingId:state.meeting.id,draftId:working.draftId,stageId:entry.stageId});
  }
  entry.status='uploaded';
 }catch(e){entry.status='failed';entry.error=e.message}
 finally{working.uploading--;if(dialog===formDialog&&fileDraft===working){renderDraftFiles();if(entry.status==='failed')dialogError(`بارگذاری «${entry.file.name}» موفق نبود. می‌توانید دوباره تلاش کنید یا فایل را حذف کنید.`)}}
}
async function removeDraftFile(id){
 const working=fileDraft,entry=working?.files.find(x=>x.id===id);if(!working||!entry||working.saving||['uploading','waiting'].includes(entry.status))return;
 const row=dialog?.querySelector(`[data-staged-row="${id}"]`);if(row)row.style.opacity='.5';
 if(entry.stageId){try{await api('clear-uploads','POST',{meetingId:state.meeting.id,draftId:working.draftId,stageId:entry.stageId})}catch(e){dialogError('حذف فایل از سرور انجام نشد: '+e.message);if(row)row.style.opacity='1';return}}
 working.files=working.files.filter(f=>f.id!==id);dialogError('');renderDraftFiles();
}
async function chooseDraftFiles(e){
 const picked=Array.from(e.target.files||[]);e.target.value='';if(!fileDraft||!picked.length)return;
 const prior=fileDraft.files.length+(state.edit?.attachments||[]).length-fileDraft.removed.size;
 if(prior+picked.length>30){dialogError('هر دستور جلسه حداکثر ۳۰ پیوست دارد.');return}
 for(const f of picked){
  if(!f.size||f.size>20*1024*1024||!/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpe?g|txt)$/i.test(f.name)){dialogError(`نوع یا حجم فایل «${f.name}» مجاز نیست (حداکثر ۲۰ مگابایت).`);continue}
  const entry={id:crypto.randomUUID(),file:f,status:'waiting',stageId:null,error:''};fileDraft.files.push(entry);renderDraftFiles();uploadDraftFile(entry);
 }
}
function dialogError(s){const e=dialog?.querySelector('[data-form-error]');if(e)e.textContent=s}
function openEdit(item=null){const meeting=state.meeting;if(!meeting)return;closeDialog();state.edit=item||null;state.selectedDocs=(item?.documents||[]).map(d=>({...d}));
 fileDraft={draftId:crypto.randomUUID(),files:[],removed:new Set(),uploading:0,saving:false,saved:false};dialog=document.createElement('div');dialog.className='sma13-overlay';
 dialog.innerHTML=`<div class="sma13-dialog" role="dialog" aria-modal="true" aria-label="ویرایش دستور جلسه"><div class="sma13-dialog-head"><div><h3>${item?'ویرایش دستور جلسه':'ثبت دستور جلسه'}</h3><small>جلسه: ${esc(meeting.title)}</small></div><button type="button" data-close-dialog>×</button></div>
 <form data-agenda-form><div class="sma13-dialog-body"><div class="sma13-form-grid">
 <label class="wide">عنوان دستور جلسه <input name="title" required maxlength="240" value="${esc(item?.title||'')}" placeholder="عنوان دقیق موضوع مطرح‌شده در جلسه"></label>
 <label class="wide">شرح موضوع و مستندات <textarea name="description" rows="4" maxlength="12000" placeholder="شرح موضوع، پیشینه و نکات لازم برای طرح در جلسه">${esc(item?.description||'')}</textarea></label>
 <div class="wide sma13-topic-files"><div class="sma13-section-header"><h4>پیوست‌های شرح موضوع</h4><small>فایل‌ها بلافاصله پس از انتخاب، مستقل از ثبت دستور، در سامانه بارگذاری می‌شوند.</small></div>
 <div data-existing-attachments></div><div data-staged-files class="sma13-staged-files" aria-live="polite"></div><label class="sma13-choose-file">＋ افزودن فایل‌های مستندات<input type="file" multiple data-new-files accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"></label>
 <div data-file-summary class="sma13-muted">هر فایل بعد از انتخاب فوراً بارگذاری می‌شود؛ حداکثر ۲۰ مگابایت برای هر فایل.</div></div>
 <label class="wide">مسئول ارائه / گزارش‌دهنده (اختیاری) <input name="presenter" maxlength="240" value="${esc(item?.presenter||'')}"></label>
 </div>
 <section class="sma13-section"><div class="sma13-section-header"><h4>ارتباط با قوانین و اسناد سامانه</h4><small>انتخاب از بانک اسناد موجود؛ بدون ایجاد نسخه تکراری</small></div>
 <div class="sma13-selected-label">اسناد مرتبط انتخاب‌شده (<span data-selected-count>۰</span>)</div><div data-selected-docs class="sma13-selected"></div>
 <div class="sma13-doc-search"><input data-doc-search aria-label="جست‌وجوی اسناد سازمان" placeholder="جست‌وجو در عنوان، شماره سند، نوع، مرجع صادرکننده…"><button type="button" data-search-doc aria-expanded="false" aria-controls="sma13-document-results">جست‌وجوی سند</button><button type="button" data-close-doc-results hidden>بستن نتایج ×</button></div>
 <p class="sma13-doc-feedback" role="status" aria-live="polite" data-doc-feedback>برای اتصال سند، جست‌وجو و سپس «افزودن» را انتخاب کنید.</p>
 <div id="sma13-document-results" data-doc-results class="sma13-doc-results" hidden></div></section>
 <section class="sma13-section"><div class="sma13-section-header"><h4>پیوندهای تکمیلی</h4><button type="button" data-add-link>＋ افزودن پیوند</button></div><div data-links>${(item?.referenceLinks||[]).map(linkRow).join('')}</div></section>
 </div><div class="sma13-dialog-foot"><p class="sma13-form-error" data-form-error role="alert"></p><div class="sma13-foot-actions"><button type="button" data-close-dialog>انصراف</button><button type="submit" class="sma13-primary" data-submit>ذخیره دستور جلسه</button></div></div></form></div>`;
 document.body.appendChild(dialog);document.body.classList.add('sma13-locked');
 dialog.querySelectorAll('[data-close-dialog]').forEach(b=>b.onclick=()=>closeDialog());
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog()});
 dialog.querySelector('[data-search-doc]').onclick=searchDocs;
 dialog.querySelector('[data-close-doc-results]').onclick=hideDocResults;
 dialog.querySelector('[data-doc-search]').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchDocs()}});
 // Delegate result clicks to the dialog, so rebuilding a result list never loses click handlers.
 dialog.addEventListener('click',e=>{
  const add=e.target.closest('[data-add-doc]');
  if(add){e.preventDefault();addDocumentFromResults(add.dataset.addDoc);return}
  if(!e.target.closest('.sma13-doc-search,[data-doc-results]') && !e.target.closest('[data-close-doc-results]')){
   if(!dialog?.querySelector('[data-doc-results]')?.hidden)hideDocResults();
  }
 });
 dialog.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!dialog.querySelector('[data-doc-results]')?.hidden){e.preventDefault();e.stopPropagation();hideDocResults()}
 });
 dialog.querySelector('[data-add-link]').onclick=()=>dialog.querySelector('[data-links]').insertAdjacentHTML('beforeend',linkRow());
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-remove-link]'))e.target.closest('.sma13-link-row')?.remove()});
 dialog.querySelector('[data-new-files]').onchange=chooseDraftFiles;
 dialog.querySelector('[data-agenda-form]').onsubmit=saveItem;
 dialog.querySelector('[data-agenda-form]').addEventListener('invalid',e=>{dialogError('عنوان دستور جلسه الزامی است.');e.target.focus()},true);
 updateSelected();updateAttachments(item);renderDraftFiles();
}
async function searchDocs(){
 const formDialog=dialog,box=formDialog?.querySelector('[data-doc-results]');if(!box)return;
 const q=formDialog.querySelector('[data-doc-search]').value.trim();
 const request=++docRequestVersion;
 box.hidden=false;box.innerHTML='<span class="sma13-muted">در حال جست‌وجو…</span>';
 formDialog.querySelector('[data-close-doc-results]').hidden=false;
 formDialog.querySelector('[data-search-doc]').setAttribute('aria-expanded','true');
 documentSearchMessage('');
 try{
  const data=await api('documents','GET',null,{q});
  if(dialog!==formDialog||!box.isConnected||box.hidden||request!==docRequestVersion)return;
  docCandidates=Array.isArray(data.items)?data.items:[];
  box.innerHTML=docCandidates.length?docCandidates.map(x=>{
   const selected=state.selectedDocs.some(d=>d.id===x.id);
   return `<button type="button" data-add-doc="${esc(x.id)}" class="sma13-doc-option" ${selected?'disabled aria-disabled="true"':''}><strong>${esc(x.title)}</strong><small>${esc([x.documentType,x.documentNumber,x.issuer].filter(Boolean).join(' · '))}</small><span>${selected?'✓ انتخاب‌شده':'＋ افزودن'}</span></button>`;
  }).join(''):'<span class="sma13-muted">سندی یافت نشد؛ عبارت دیگری جست‌وجو کنید.</span>';
  if(data.total>docCandidates.length)box.insertAdjacentHTML('beforeend',`<p class="sma13-muted">${fa(data.total)} نتیجه یافت شد؛ برای نتایج دقیق‌تر عبارت جست‌وجو را کامل کنید.</p>`);
  documentSearchMessage(docCandidates.length?'برای اتصال یک سند، روی «＋ افزودن» همان ردیف کلیک کنید.':'');
 }catch(e){
  if(dialog!==formDialog||request!==docRequestVersion||box.hidden)return;
  docCandidates=[];box.textContent=e.message;documentSearchMessage('جست‌وجو انجام نشد. دوباره تلاش کنید.');
 }
}
async function saveItem(e){
 e.preventDefault();const form=e.currentTarget,submit=form.querySelector('[data-submit]'),fd=new FormData(form),working=fileDraft;
 if(!working||working.saving)return;
 if(working.uploading){dialogError('تا پایان بارگذاری فایل‌ها، ثبت دستور ممکن نیست.');return}
 const failures=working.files.filter(f=>f.status!=='uploaded');
 if(failures.length){dialogError('بارگذاری بعضی فایل‌ها کامل نشده است؛ «تلاش دوباره» یا «حذف» را انتخاب کنید.');return}
 const links=[...dialog.querySelectorAll('.sma13-link-row')].map(row=>({title:row.querySelector('[data-link-title]').value.trim(),url:row.querySelector('[data-link-url]').value.trim()})).filter(x=>x.title||x.url);
 const previous=state.edit||{},order=previous.order??(state.items.reduce((max,x)=>Math.max(max,Number(x.order)||0),0)+1);
 const data={meetingId:state.meeting.id,title:fd.get('title'),description:fd.get('description'),presenter:fd.get('presenter')||'',
  purpose:previous.purpose||'',expectedOutcome:previous.expectedOutcome||'',durationMinutes:previous.durationMinutes||0,
  order,status:previous.status||'draft',documentRefs:state.selectedDocs.map(x=>x.id),referenceLinks:links,
  uploadDraftId:working.draftId,stagedUploadIds:working.files.map(f=>f.stageId),removeAttachmentIds:[...working.removed]};
 if(state.edit){data.id=state.edit.id;data.revision=state.edit.revision}
 working.saving=true;submit.disabled=true;submit.textContent='در حال ثبت دستور…';dialogError('');
 try{
  await api('save','POST',data);
  working.saved=true;closeDialog(true);
  await loadAgenda(state.meeting.id);message('دستور جلسه و همه پیوست‌های بارگذاری‌شده ذخیره شدند.');
 }catch(err){if(working.saved){message('دستور ثبت شد ولی دریافت مجدد فهرست ناموفق بود: '+err.message,true)}else{dialogError(err.message);working.saving=false;renderDraftFiles()} }
 finally{if(dialog?.querySelector('[data-submit]'))dialog.querySelector('[data-submit]').textContent='ذخیره دستور جلسه'}
}
async function refreshAfterSave(keepDialog=true){if(!state.meeting)return;try{const data=await api('items','GET',null,{meetingId:state.meeting.id});state.items=data.items||[];if(!keepDialog)renderBehindDialog()}catch{}}
function renderBehindDialog(){if(!container)return;const d=dialog;renderAgenda();if(d&&d.parentNode)dialog=d}
function closeDialog(saved=false){
 if(dialog&&fileDraft?.uploading){dialogError('بارگذاری فایل‌ها هنوز تمام نشده است. برای انصراف، پس از پایان بارگذاری دوباره اقدام کنید.');return false}
 if(fileDraft&&!saved&&!fileDraft.saved&&fileDraft.files.some(f=>f.stageId)){
  // Uploaded but not yet claimed files must not linger when the form is cancelled.
  api('clear-uploads','POST',{meetingId:state.meeting?.id,draftId:fileDraft.draftId}).catch(e=>console.warn('AGENDA_DRAFT_CLEANUP',e.message));
 }
 docRequestVersion++;docCandidates=[];dialog?.remove();dialog=null;fileDraft=null;document.body.classList.remove('sma13-locked');return true;
}
function close(){clearTimeout(debounce);if(closeDialog()===false)return;const ctx=document.getElementById('workspaceContext');ctx?.classList.remove('sma13-open');container?.remove();container=null;state.meeting=null}
async function open(){const ctx=document.getElementById('workspaceContext');if(!ctx)return;window.SinaMeetingsV1?.leave?.();close();ctx.classList.add('sma13-open');container=document.createElement('section');container.className='sma13';ctx.appendChild(container);showList();await loadMeetings()}
document.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-capability]');if(btn?.dataset.capability==='دستور جلسه' && document.querySelector('[data-workspace="meetings"].active')){e.preventDefault();e.stopImmediatePropagation();open();return}if(e.target?.closest?.('[data-workspace]'))close()},true);
window.SinaMeetingAgendaV13={open,close};
})();
