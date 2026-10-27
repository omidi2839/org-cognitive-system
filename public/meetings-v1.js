/* SINA Meetings Calendar V1.0: isolated from the document-bank UI */
(()=>{'use strict';
const endpoint='/api/v1/meetings';
const state={items:[],view:'month',cursor:new Date(),selected:null,filter:'all',editing:null,directory:null};
const F='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>String(x??'').replace(/[0-9]/g,n=>F[Number(n)]);
const latin=x=>String(x??'').replace(/[۰-۹]/g,n=>String(F.indexOf(n))).replace(/[٠-٩]/g,n=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(n)));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const persian=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'});
const parts=d=>{const p=Object.fromEntries(persian.formatToParts(d).map(x=>[x.type,Number(latin(x.value))]));return {year:p.year,month:p.month,day:p.day}};
const monthLabel=d=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long'}).format(d);
const longLabel=d=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(d);
const dayNames=['ش','ی','د','س','چ','پ','ج'];
const weekStart=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-(x.getDay()+1)%7);return x};
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
const monthStart=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()),p=parts(x);for(let i=0;i<32;i++){const prev=addDays(x,-1),a=parts(prev);if(a.year!==p.year||a.month!==p.month)return x;x.setDate(x.getDate()-1)}return x};
const moveMonth=(d,n)=>{const first=monthStart(d);return n>0?addDays(first,32):addDays(first,-1)};
const roles={chair:'مدیر جلسه',secretary:'دبیر جلسه',member:'عضو',expert:'کارشناس',advisor:'مشاور',presenter:'ارائه‌دهنده',guest:'مهمان',observer:'ناظر'};
const kinds={planned:'برنامه‌ریزی‌شده',anticipated:'مترقبه / خارج از برنامه'};
const statuses={tentative:'در انتظار تعیین زمان',scheduled:'زمان‌بندی‌شده',completed:'برگزارشده',cancelled:'لغوشده'};
const types={in_person:'حضوری',online:'مجازی',hybrid:'ترکیبی'};
let panel=null,modal=null;
const $=(s,root=panel)=>root?.querySelector(s);
const api=async(method='GET',body=null,id='',resource='')=>{
 const suffix=resource?'?resource='+encodeURIComponent(resource):(id?'?id='+encodeURIComponent(id):'');
 let r;
 try{r=await fetch(endpoint+suffix,{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
 catch(e){throw Error('دسترسی به سرور ممکن نیست. اتصال اینترنت و وضعیت استقرار Vercel را بررسی کنید.');}
 const raw=await r.text(),d=(()=>{try{return JSON.parse(raw)}catch{return null}})();
 if(!r.ok){
  const reason=d?.message||((r.status===404||r.status===405)?'مسیر API جلسات در نسخه منتشرشده فعال نیست. پوشه api و آخرین استقرار Vercel را بررسی کنید.':'پاسخ نامعتبر از سرور دریافت شد.');
  throw Error(`${reason} (HTTP ${r.status})`);
 }
 if(!d||typeof d!=='object')throw Error('پاسخ API جلسات JSON نیست؛ احتمالاً مسیر API به جای کد سرور، صفحه HTML برگردانده است. استقرار Vercel و rewrite را بررسی کنید.');
 return d;
};
const itemLabel=x=>x.startDate?longLabel(new Date(x.startDate+'T12:00:00'))+' · '+(x.startTime||'')+' تا '+(x.endTime||''):'زمان جلسه هنوز قطعی نشده است';
function matches(x){return state.filter==='all'||(state.filter==='unscheduled'?!x.startDate:state.filter===x.kind)}
function showMessage(s,error=false){const node=$('[data-smv1-message]');if(node){node.textContent=s;node.className='smv1-message'+(error?' error':'');}}
async function refresh(){
 try{const d=await api();state.items=d.items||[];render();showMessage('اطلاعات از پایگاه داده دریافت شد.');}
 catch(e){render();showMessage(e.message,true)}
}
function open(){
 const ctx=document.getElementById('workspaceContext');if(!ctx)return;
 closeModal();ctx.querySelector('.smv1')?.remove();ctx.classList.add('smv1-open');
 panel=document.createElement('section');panel.className='smv1';ctx.appendChild(panel);
 render();refresh();
}
function leave(){closeModal();const ctx=document.getElementById('workspaceContext');ctx?.classList.remove('smv1-open');ctx?.querySelector('.smv1')?.remove();panel=null}
function dateEvents(d){return state.items.filter(x=>x.startDate===d&&matches(x));}
function cell(d,outside=false){
 const key=iso(d),ev=dateEvents(key),today=key===iso(new Date()),chosen=state.selected===key;
 return `<button type="button" class="smv1-day ${outside?'outside':''} ${today?'today':''} ${chosen?'selected':''}" data-date="${key}"><span class="smv1-dayno">${fa(parts(d).day)}</span><span class="smv1-dots">${ev.slice(0,3).map(x=>`<i class="${x.kind==='anticipated'?'anticipated':'planned'}"></i>`).join('')}</span>${ev.length?`<small>${fa(ev.length)} جلسه</small>`:''}</button>`;
}
function monthMarkup(){const start=monthStart(state.cursor),startWeek=weekStart(start),p=parts(start),cells=[];
 for(let i=0;i<42;i++){const d=addDays(startWeek,i),v=parts(d);cells.push(cell(d,v.month!==p.month||v.year!==p.year));}
 return `<div class="smv1-weekdays">${dayNames.map(x=>`<b>${x}</b>`).join('')}</div><div class="smv1-month-grid">${cells.join('')}</div>`;
}
function weekMarkup(){const start=weekStart(state.cursor);return `<div class="smv1-weekdays">${dayNames.map(x=>`<b>${x}</b>`).join('')}</div><div class="smv1-week-grid">${Array.from({length:7},(_,i)=>cell(addDays(start,i))).join('')}</div>`;}
function card(x){const cancelled=x.status==='cancelled';return `<article class="smv1-card ${cancelled?'cancelled':''}">
 <div class="smv1-card-main"><div class="smv1-cardbadges"><span class="${x.kind==='anticipated'?'warm':'cool'}">${kinds[x.kind]||''}</span><span>${statuses[x.status]||''}</span></div>
 <h3>${esc(x.title)}</h3><p>${esc(itemLabel(x))}</p><small>${esc(types[x.meetingType]||'')} ${x.location?' · '+esc(x.location):''} · ${fa(x.participants?.length||0)} شرکت‌کننده</small>
 </div><div class="smv1-card-actions"><button type="button" data-edit="${esc(x.id)}">ویرایش</button>${!cancelled?`<button type="button" class="danger" data-cancel="${esc(x.id)}">لغو جلسه</button>`:''}</div></article>`;}
function render(){if(!panel)return;
 const all=state.items.filter(matches),view=state.view;
 const activeDate=state.selected,dayResults=activeDate?all.filter(x=>x.startDate===activeDate):[];
 const scheduled=all.filter(x=>x.startDate&&x.status!=='cancelled');const unscheduled=all.filter(x=>!x.startDate);
 const listed=view==='list'?all:activeDate?dayResults:scheduled.filter(x=>{
  if(view==='week'){const d=new Date(x.startDate+'T12:00:00');const b=weekStart(state.cursor);return d>=b&&d<addDays(b,7)}
  const d=new Date(x.startDate+'T12:00:00'),a=parts(d),b=parts(state.cursor);return a.month===b.month&&a.year===b.year;
 });
 panel.innerHTML=`<div class="smv1-top"><div><button type="button" class="smv1-back" data-leave>بازگشت به مراحل جلسات</button><h2>تقویم و برنامه‌ریزی جلسات</h2><p>ثبت جلسات آینده، جلسات مترقبه و مدیریت اعضا و زمان‌بندی</p></div><button type="button" class="smv1-primary" data-new>＋ ایجاد جلسه</button></div>
 <div class="smv1-statbar"><span><strong>${fa(all.length)}</strong> کل جلسات</span><span><strong>${fa(scheduled.length)}</strong> زمان‌بندی‌شده</span><span><strong>${fa(unscheduled.length)}</strong> در انتظار زمان</span></div>
 <div class="smv1-toolbar"><div class="smv1-month-title"><button type="button" data-prev title="دوره قبل">‹</button><strong>${esc(view==='week'?longLabel(weekStart(state.cursor)):monthLabel(state.cursor))}</strong><button type="button" data-next title="دوره بعد">›</button><button type="button" data-today>امروز</button></div>
 <div class="smv1-toolbar-controls"><select data-filter aria-label="فیلتر جلسات"><option value="all">همه جلسات</option><option value="planned">برنامه‌ریزی‌شده</option><option value="anticipated">مترقبه / خارج از برنامه</option><option value="unscheduled">فاقد تاریخ قطعی</option></select>
 <div class="smv1-switch"><button type="button" data-view="month" class="${view==='month'?'active':''}">ماه</button><button type="button" data-view="week" class="${view==='week'?'active':''}">هفته</button><button type="button" data-view="list" class="${view==='list'?'active':''}">فهرست</button></div></div></div>
 ${view==='month'?monthMarkup():view==='week'?weekMarkup():''}
 <div class="smv1-subhead"><h3>${view==='list'?'فهرست تمامی جلسات':activeDate?'جلسات '+longLabel(new Date(activeDate+'T12:00:00')):'جلسات این دوره'}</h3>${activeDate?'<button type="button" data-clear-date>نمایش همه روزها</button>':''}</div>
 <div class="smv1-list">${listed.length?listed.map(card).join(''):'<div class="smv1-empty">جلسه‌ای برای این بازه ثبت نشده است.</div>'}</div>
 ${view!=='list'&&unscheduled.length?`<div class="smv1-subhead"><h3>جلسات در انتظار تعیین زمان</h3></div><div class="smv1-list">${unscheduled.map(card).join('')}</div>`:''}
 <p class="smv1-message" data-smv1-message role="status"></p>`;
 $('[data-filter]').value=state.filter;
 panel.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.selected=null;render()});
 $('[data-new]').onclick=()=>edit(null);
 $('[data-leave]').onclick=leave;
 $('[data-prev]').onclick=()=>{state.cursor=state.view==='week'?addDays(state.cursor,-7):moveMonth(state.cursor,-1);state.selected=null;render()};
 $('[data-next]').onclick=()=>{state.cursor=state.view==='week'?addDays(state.cursor,7):moveMonth(state.cursor,1);state.selected=null;render()};
 $('[data-today]').onclick=()=>{state.cursor=new Date();state.selected=null;render()};
 $('[data-filter]').onchange=e=>{state.filter=e.target.value;state.selected=null;render()};
 panel.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.date;state.cursor=new Date(b.dataset.date+'T12:00:00');render()});
 $('[data-clear-date]')?.addEventListener('click',()=>{state.selected=null;render()});
 panel.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(state.items.find(x=>x.id===b.dataset.edit)));
 panel.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>cancelMeeting(state.items.find(x=>x.id===b.dataset.cancel)));
}
function optionMap(obj,selected){return Object.entries(obj).map(([k,v])=>`<option value="${k}" ${k===selected?'selected':''}>${esc(v)}</option>`).join('')}
function participantRow(p={}){
 return `<div class="smv1-person"><label>نام شرکت‌کننده<input data-p="name" value="${esc(p.name||'')}" required maxlength="140"></label>
 <label>نوع شخصیت<select data-p="entityType">${optionMap({person:'حقیقی',legal_representative:'نماینده شخصیت حقوقی'},p.entityType||'person')}</select></label>
 <label>شخصیت حقوقی / سازمان<input data-p="entityName" value="${esc(p.entityName||'')}" placeholder="در صورت نمایندگی شخصیت حقوقی"></label>
 <label>سمت سازمانی<input data-p="position" value="${esc(p.position||'')}"></label>
 <label>نقش در جلسه<select data-p="role">${optionMap(roles,p.role||'member')}</select></label>
 <button type="button" class="smv1-remove-person" title="حذف شرکت‌کننده">×</button><input type="hidden" data-p="id" value="${esc(p.id||'')}"><input type="hidden" data-p="directoryPersonRef" value="${esc(p.directoryPersonRef||'')}"><input type="hidden" data-p="organizationalUnitRef" value="${esc(p.organizationalUnitRef||'')}"></div>`;
}
function closeModal(){modal?.remove();modal=null;document.body.classList.remove('smv1-no-scroll')}
function edit(item){closeModal();state.editing=item||null;modal=document.createElement('div');modal.className='smv1-modal';
 const d=item?.startDate||state.selected||iso(new Date());
 modal.innerHTML=`<div class="smv1-dialog" role="dialog" aria-modal="true" aria-label="${item?'ویرایش جلسه':'ایجاد جلسه'}">
 <div class="smv1-dialog-top"><div><h2>${item?'ویرایش جلسه':'ثبت جلسه جدید'}</h2><small>اطلاعات این جلسه به‌صورت دائمی در سامانه ذخیره می‌شود.</small></div><button type="button" data-modal-close aria-label="بستن">×</button></div>
 <form class="smv1-form"><div class="smv1-fields">
 <label class="wide">موضوع / عنوان جلسه <input name="title" required maxlength="220" value="${esc(item?.title||'')}" placeholder="برای نمونه: جلسه بررسی برنامه تحول سازمان"></label>
 <label>نوع برنامه‌ریزی<select name="kind">${optionMap(kinds,item?.kind||'planned')}</select></label>
 <label>شیوه برگزاری<select name="meetingType">${optionMap(types,item?.meetingType||'in_person')}</select></label>
 <label>تاریخ برگزاری <input name="startDate" type="date" value="${esc(item ? (item.startDate||'') : d)}"></label>
 <label>شروع <input name="startTime" type="time" value="${esc(item?.startTime||'09:00')}"></label>
 <label>پایان <input name="endTime" type="time" value="${esc(item?.endTime||'10:00')}"></label>
 <label>وضعیت<select name="status">${optionMap(statuses,item?.status||(item?.startDate||!item?'scheduled':'tentative'))}</select></label>
 <label>برگزارکننده / مرجع جلسه<input name="organizer" value="${esc(item?.organizer||'')}" maxlength="180"></label>
 <label>مکان جلسه<input name="location" value="${esc(item?.location||'')}" maxlength="240"></label>
 <label class="wide">پیوند جلسه مجازی<input name="meetingLink" type="url" value="${esc(item?.meetingLink||'')}" placeholder="https://..."></label>
 <label class="wide">شرح و هدف جلسه<textarea name="description" rows="2" maxlength="4000">${esc(item?.description||'')}</textarea></label>
 </div><div class="smv1-person-header"><h3>اعضا و نقش‌ها</h3><div class="smv1-person-actions"><button type="button" data-open-directory>انتخاب از ساختار سازمانی</button><button type="button" data-add-person>＋ افزودن عضو خارج از فهرست</button></div></div>
 <section class="smv1-directory" data-directory-panel hidden><p data-directory-status>در حال دریافت ساختار سازمانی…</p><div data-directory-controls hidden><label>واحد سازمانی <select data-directory-unit><option value="">همه واحدها</option></select></label><label>فرد / سمت <select data-directory-person><option value="">انتخاب شخص…</option></select></label><button type="button" data-directory-add>افزودن به اعضا</button></div></section>
 <div data-person-list>${(item?.participants?.length?item.participants:[{}]).map(participantRow).join('')}</div>
 <label class="smv1-notes">یادداشت داخلی<textarea name="notes" rows="2" maxlength="2000">${esc(item?.notes||'')}</textarea></label>
 <p class="smv1-form-hint">تاریخ در تقویم اصلی شمسی نمایش داده می‌شود. در جلسات مترقبه می‌توانید تاریخ را خالی بگذارید. ساعت‌ها به وقت تهران ثبت می‌شوند.</p>
 <div class="smv1-form-error" role="alert"></div><div class="smv1-dialog-actions"><button type="button" data-modal-close>انصراف</button><button type="submit" class="smv1-primary">${item?'ذخیره تغییرات':'ثبت جلسه'}</button></div>
 </form></div>`;
 document.body.appendChild(modal);document.body.classList.add('smv1-no-scroll');
 const form=modal.querySelector('form');
 modal.querySelectorAll('[data-modal-close]').forEach(b=>b.onclick=closeModal);
 modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
 modal.querySelector('[data-add-person]').onclick=()=>{modal.querySelector('[data-person-list]').insertAdjacentHTML('beforeend',participantRow())};
 modal.querySelector('[data-open-directory]').onclick=()=>openDirectorySelector();
 modal.addEventListener('click',e=>{if(e.target.matches('.smv1-remove-person')){const rows=modal.querySelectorAll('.smv1-person');if(rows.length>1)e.target.closest('.smv1-person').remove()}});
 form.elements.kind.onchange=()=>{if(form.elements.kind.value==='anticipated'){form.elements.startDate.value='';form.elements.status.value='tentative'}else if(form.elements.kind.value==='planned'&&!form.elements.startDate.value){form.elements.startDate.value=iso(new Date());form.elements.status.value='scheduled'}};
 form.onsubmit=save;
}
async function openDirectorySelector(){
 const box=modal?.querySelector('[data-directory-panel]');if(!box)return;
 box.hidden=!box.hidden;if(box.hidden)return;
 const status=box.querySelector('[data-directory-status]'),controls=box.querySelector('[data-directory-controls]');
 status.textContent='در حال دریافت فهرست اشخاص و واحدها…';controls.hidden=true;
 try{
  if(!state.directory)state.directory=await api('GET',null,'','directory');
  const d=state.directory;
  if(!d.available){status.textContent='ساختار سازمانی هنوز به اطلاعات واقعی اشخاص و واحدها در پایگاه داده متصل نیست. برای این جلسه می‌توانید نام و سمت اعضا را به‌صورت دستی وارد کنید.';return;}
  const unit=box.querySelector('[data-directory-unit]'),person=box.querySelector('[data-directory-person]');
  unit.innerHTML='<option value="">همه واحدها</option>'+d.units.map(u=>`<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
  const refreshPeople=()=>{
   const arr=d.people.filter(p=>!unit.value||p.organizationalUnitRef===unit.value);
   person.innerHTML='<option value="">انتخاب شخص…</option>'+arr.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.position?' — '+esc(p.position):''}</option>`).join('');
   status.textContent=arr.length?`${fa(arr.length)} شخص در فهرست یافت شد.`:'برای این واحد، فردی در فهرست موجود نیست.';
  };
  unit.onchange=refreshPeople;refreshPeople();controls.hidden=false;
  box.querySelector('[data-directory-add]').onclick=()=>{
   const p=d.people.find(x=>x.id===person.value);if(!p)return status.textContent='یک شخص را انتخاب کنید.';
   const list=modal.querySelector('[data-person-list]');const rows=[...list.querySelectorAll('.smv1-person')];
   if(rows.some(x=>x.querySelector('[data-p="directoryPersonRef"]')?.value===p.id))return status.textContent='این فرد قبلاً به جلسه افزوده شده است.';
   const empty=rows.find(x=>!x.querySelector('[data-p="name"]')?.value.trim());
   const html=participantRow({...p,directoryPersonRef:p.id});
   if(empty)empty.outerHTML=html;else list.insertAdjacentHTML('beforeend',html);
   status.textContent=`${p.name} به اعضای جلسه اضافه شد. نقش او را در ردیف مربوط تعیین کنید.`;
  };
 }catch(e){status.textContent=e.message||'دریافت ساختار سازمانی ممکن نشد.';}
}
async function save(e){e.preventDefault();if(!modal)return;const form=e.currentTarget,fd=new FormData(form),error=modal.querySelector('.smv1-form-error');error.textContent='';
 const people=[...modal.querySelectorAll('.smv1-person')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-p]')].map(x=>[x.dataset.p,x.value])));
 const body=Object.fromEntries(['title','kind','meetingType','startDate','startTime','endTime','status','organizer','location','meetingLink','description','notes'].map(k=>[k,String(fd.get(k)||'')]));
 body.participants=people;if(state.editing)body.revision=state.editing.revision;
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{await api(state.editing?'PUT':'POST',body,state.editing?.id||'');closeModal();state.selected=null;await refresh();showMessage('جلسه با موفقیت ذخیره شد.');}
 catch(err){error.textContent=err.message;submit.disabled=false}
}
async function cancelMeeting(item){if(!item||!confirm('آیا از لغو این جلسه مطمئن هستید؟ سوابق جلسه حذف نخواهد شد.'))return;
 try{await api('PUT',{...item,status:'cancelled',revision:item.revision},item.id);await refresh();showMessage('وضعیت جلسه به لغوشده تغییر یافت.');}
 catch(e){showMessage(e.message,true)}
}
// Integration is delegated so the original workspace shell remains untouched.
// Capture before the workspace's legacy inline command handler runs.
document.addEventListener('click',e=>{
 const capability=e.target?.closest?.('[data-capability]');
 if(capability?.dataset.capability==='جلسات پیش‌رو' && document.querySelector('[data-workspace="meetings"].active')){
  e.preventDefault();e.stopImmediatePropagation();open();return;
 }
 if(e.target?.closest?.('[data-workspace]')){
  // A new workspace replaces the context markup. Close any open meeting modal.
  closeModal();panel=null;
  document.getElementById('workspaceContext')?.classList.remove('smv1-open');
 }
},true);
window.SinaMeetingsV1={open,leave};
})();
