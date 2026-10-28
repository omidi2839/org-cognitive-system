/* Sina V1.4 — simplified agenda form, stable modal footer, document links and attachments. */
(()=>{'use strict';
const END='/api/v1/meeting-agendas', P='sma13-', digits='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>String(x??'').replace(/\d/g,n=>digits[Number(n)]);
const esc=s=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[v]));
const date=s=>s?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(new Date(s+'T12:00:00')):'فاقد تاریخ قطعی';
const statusLabel={scheduled:'زمان‌بندی‌شده',tentative:'در انتظار تعیین زمان',completed:'برگزارشده',cancelled:'لغوشده',draft:'پیش‌نویس',review:'در انتظار بررسی',approved:'تأییدشده'};
const shorten=(s,n=160)=>String(s||'').length>n?String(s).slice(0,n)+'…':String(s||'');
const state={meetings:[],items:[],meeting:null,query:'',from:'',to:'',status:'active',selectedDocs:[],links:[],edit:null};
let container=null,dialog=null,debounce;
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
function updateSelected(){const e=dialog?.querySelector('[data-selected-docs]');if(!e)return;e.innerHTML=state.selectedDocs.length?state.selectedDocs.map(docTag).join(''):'<span class="sma13-muted">هنوز سندی مرتبط نشده است.</span>';
 e.querySelectorAll('[data-unlink-doc]').forEach(b=>b.onclick=()=>{state.selectedDocs=state.selectedDocs.filter(x=>x.id!==b.dataset.unlinkDoc);updateSelected()});
}
function updateAttachments(item){const e=dialog?.querySelector('[data-existing-attachments]');if(!e)return;
 e.innerHTML=item?.attachments?.length?item.attachments.map(f=>`<div class="sma13-file-row"><a href="${query('download',{agendaId:item.id,attachmentId:f.id})}">${esc(f.fileName)} (${fa((f.size/1024).toFixed(0))} کیلوبایت)</a><button type="button" data-remove-attachment="${esc(f.id)}">حذف</button></div>`).join(''):'<span class="sma13-muted">پیوستی ثبت نشده است.</span>';
 e.querySelectorAll('[data-remove-attachment]').forEach(b=>b.onclick=async()=>{if(!confirm('این پیوست از دستور جلسه برداشته شود؟'))return;try{const d=await api('remove-attachment','POST',{agendaId:item.id,attachmentId:b.dataset.removeAttachment});Object.assign(item,d.item);updateAttachments(item);await refreshAfterSave(false)}catch(e){dialogError(e.message)}});
}
function dialogError(s){const e=dialog?.querySelector('[data-form-error]');if(e)e.textContent=s}
function openEdit(item=null){state.edit=item||null;state.selectedDocs=(item?.documents||[]).map(d=>({...d}));
 const meeting=state.meeting;if(!meeting)return;closeDialog();dialog=document.createElement('div');dialog.className='sma13-overlay';
 dialog.innerHTML=`<div class="sma13-dialog" role="dialog" aria-modal="true" aria-label="ویرایش دستور جلسه"><div class="sma13-dialog-head"><div><h3>${item?'ویرایش دستور جلسه':'ثبت دستور جلسه'}</h3><small>جلسه: ${esc(meeting.title)}</small></div><button type="button" data-close-dialog>×</button></div>
 <form data-agenda-form><div class="sma13-dialog-body"><div class="sma13-form-grid">
 <label class="wide">عنوان دستور جلسه <input name="title" required maxlength="240" value="${esc(item?.title||'')}" placeholder="عنوان دقیق موضوع مطرح‌شده در جلسه"></label>
 <label class="wide">شرح موضوع و مستندات <textarea name="description" rows="4" maxlength="12000" placeholder="شرح موضوع، پیشینه و نکات لازم برای طرح در جلسه">${esc(item?.description||'')}</textarea></label>
 <div class="wide sma13-topic-files"><div class="sma13-section-header"><h4>پیوست‌های شرح موضوع</h4><small>پیوست هر دستور مستقل است؛ فایل‌ها در سامانه ذخیره می‌شوند.</small></div>
 <div data-existing-attachments></div><label class="sma13-choose-file">＋ افزودن فایل‌های مستندات<input type="file" multiple data-new-files accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"></label>
 <div data-file-summary class="sma13-muted">PDF، Word، Excel، PowerPoint، تصویر یا متن؛ حداکثر ۲۰ مگابایت برای هر فایل.</div></div>
 <label class="wide">مسئول ارائه / گزارش‌دهنده (اختیاری) <input name="presenter" maxlength="240" value="${esc(item?.presenter||'')}"></label>
 </div>
 <section class="sma13-section"><div class="sma13-section-header"><h4>ارتباط با قوانین و اسناد سامانه</h4><small>انتخاب از بانک اسناد موجود؛ بدون ایجاد نسخه تکراری</small></div>
 <div class="sma13-doc-search"><input data-doc-search placeholder="جست‌وجو در عنوان، شماره سند، نوع، مرجع صادرکننده…"><button type="button" data-search-doc>جست‌وجوی سند</button></div><div data-doc-results class="sma13-doc-results"><span class="sma13-muted">برای جست‌وجو، عبارت یا شماره سند را وارد کنید.</span></div>
 <div class="sma13-selected-label">اسناد مرتبط انتخاب‌شده</div><div data-selected-docs class="sma13-selected"></div></section>
 <section class="sma13-section"><div class="sma13-section-header"><h4>پیوندهای تکمیلی</h4><button type="button" data-add-link>＋ افزودن پیوند</button></div><div data-links>${(item?.referenceLinks||[]).map(linkRow).join('')}</div></section>
 </div><div class="sma13-dialog-foot"><p class="sma13-form-error" data-form-error role="alert"></p><div class="sma13-foot-actions"><button type="button" data-close-dialog>انصراف</button><button type="submit" class="sma13-primary" data-submit>ذخیره دستور جلسه</button></div></div></form></div>`;
 document.body.appendChild(dialog);document.body.classList.add('sma13-locked');
 dialog.querySelectorAll('[data-close-dialog]').forEach(b=>b.onclick=closeDialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog()});
 dialog.querySelector('[data-search-doc]').onclick=searchDocs;
 dialog.querySelector('[data-doc-search]').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchDocs()}});
 dialog.querySelector('[data-add-link]').onclick=()=>dialog.querySelector('[data-links]').insertAdjacentHTML('beforeend',linkRow());
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-remove-link]'))e.target.closest('.sma13-link-row')?.remove()});
 dialog.querySelector('[data-new-files]').onchange=e=>{const fs=[...e.target.files];dialog.querySelector('[data-file-summary]').textContent=fs.length?`${fa(fs.length)} فایل انتخاب شد؛ هنگام ذخیره بارگذاری خواهد شد.`:'فایلی انتخاب نشده است.'};
 dialog.querySelector('[data-agenda-form]').onsubmit=saveItem;
 dialog.querySelector('[data-agenda-form]').addEventListener('invalid',e=>{dialogError('عنوان دستور جلسه الزامی است.');e.target.focus()},true);
 updateSelected();updateAttachments(item);
}
async function searchDocs(){const box=dialog?.querySelector('[data-doc-results]');if(!box)return;box.innerHTML='<span class="sma13-muted">در حال جست‌وجو…</span>';
 const formDialog=dialog,q=formDialog.querySelector('[data-doc-search]').value.trim();try{const d=await api('documents','GET',null,{q});if(dialog!==formDialog||!box.isConnected)return;box.innerHTML=d.items.length?d.items.map(x=>`<button type="button" data-add-doc="${esc(x.id)}" class="sma13-doc-option"><strong>${esc(x.title)}</strong><small>${esc([x.documentType,x.documentNumber,x.issuer].filter(Boolean).join(' · '))}</small><span>＋ افزودن</span></button>`).join(''):'<span class="sma13-muted">سندی یافت نشد.</span>';
 if(d.total>d.items.length)box.insertAdjacentHTML('beforeend',`<p class="sma13-muted">${fa(d.total)} نتیجه یافت شد. عبارت دقیق‌تری وارد کنید.</p>`);
 box.querySelectorAll('[data-add-doc]').forEach(b=>b.onclick=()=>{const doc=d.items.find(x=>x.id===b.dataset.addDoc);if(!doc||state.selectedDocs.some(x=>x.id===doc.id))return;state.selectedDocs.push(doc);updateSelected()})}catch(e){box.textContent=e.message}}
async function saveItem(e){e.preventDefault();const form=e.currentTarget,submit=form.querySelector('[data-submit]'),fd=new FormData(form);submit.disabled=true;dialogError('');
 const links=[...dialog.querySelectorAll('.sma13-link-row')].map(row=>({title:row.querySelector('[data-link-title]').value.trim(),url:row.querySelector('[data-link-url]').value.trim()})).filter(x=>x.title||x.url);
 const files=[...dialog.querySelector('[data-new-files]').files];const invalid=files.find(f=>f.size>20*1024*1024||!/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpe?g|txt)$/i.test(f.name));
 if(invalid){dialogError('فرمت یا حجم فایل «'+invalid.name+'» مجاز نیست (حداکثر ۲۰ مگابایت).');submit.disabled=false;return}
 // Legacy metadata is preserved for existing records, but no longer requested from the user.
 const previous=state.edit||{};
 const order=previous.order??(state.items.reduce((max,x)=>Math.max(max,Number(x.order)||0),0)+1);
 const data={meetingId:state.meeting.id,title:fd.get('title'),description:fd.get('description'),presenter:fd.get('presenter')||'',
  purpose:previous.purpose||'',expectedOutcome:previous.expectedOutcome||'',durationMinutes:previous.durationMinutes||0,
  order,status:previous.status||'draft',documentRefs:state.selectedDocs.map(x=>x.id),referenceLinks:links};
 if(state.edit){data.id=state.edit.id;data.revision=state.edit.revision}
 try{
  submit.textContent='در حال ثبت دستور…';const saved=await api('save','POST',data),item=saved.item;let failures=[];
  for(let i=0;i<files.length;i++){const f=files[i];try{submit.textContent=`در حال ارسال پیوست ${fa(i+1)} از ${fa(files.length)}…`;
    const pre=await api('upload-url','POST',{meetingId:state.meeting.id,agendaId:item.id,fileName:f.name,mimeType:f.type||'application/octet-stream',size:f.size});
    const put=await fetch(pre.presignedUrl,{method:'PUT',body:f});if(!put.ok)throw Error(`ارسال فایل انجام نشد (HTTP ${put.status})`);
    await api('attach','POST',{meetingId:state.meeting.id,agendaId:item.id,pathname:pre.pathname,fileName:f.name,mimeType:f.type||'application/octet-stream',size:f.size});
   }catch(ex){failures.push(`${f.name}: ${ex.message}`)}}
  closeDialog();await loadAgenda(state.meeting.id);message(failures.length?`دستور جلسه ثبت شد، ولی ${fa(failures.length)} پیوست کامل نشد: ${failures.join('؛ ')}`:'دستور جلسه و ارتباطات آن با موفقیت ثبت شد.',Boolean(failures.length));
 }catch(err){dialogError(err.message);submit.disabled=false;submit.textContent='ذخیره دستور جلسه'}
}
async function refreshAfterSave(keepDialog=true){if(!state.meeting)return;try{const data=await api('items','GET',null,{meetingId:state.meeting.id});state.items=data.items||[];if(!keepDialog)renderBehindDialog()}catch{}}
function renderBehindDialog(){if(!container)return;const d=dialog;renderAgenda();if(d&&d.parentNode)dialog=d}
function closeDialog(){dialog?.remove();dialog=null;document.body.classList.remove('sma13-locked')}
function close(){clearTimeout(debounce);closeDialog();const ctx=document.getElementById('workspaceContext');ctx?.classList.remove('sma13-open');container?.remove();container=null;state.meeting=null}
async function open(){const ctx=document.getElementById('workspaceContext');if(!ctx)return;window.SinaMeetingsV1?.leave?.();close();ctx.classList.add('sma13-open');container=document.createElement('section');container.className='sma13';ctx.appendChild(container);showList();await loadMeetings()}
document.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-capability]');if(btn?.dataset.capability==='دستور جلسه' && document.querySelector('[data-workspace="meetings"].active')){e.preventDefault();e.stopImmediatePropagation();open();return}if(e.target?.closest?.('[data-workspace]'))close()},true);
window.SinaMeetingAgendaV13={open,close};
})();
