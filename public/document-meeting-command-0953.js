(()=>{
window.__DOCUMENT_MEETING_COMMAND_BUILD__='0.9.5.3';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,o={})=>{const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':ORG,...(o.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا');return d};

function enhanceUploadForm(form){
 if(!form||form.dataset.k950Meeting)return;form.dataset.k950Meeting='1';
 const grid=form.querySelector('.k76grid');if(!grid)return;
 const w=document.createElement('div');w.className='k950meetingfields';
 w.innerHTML=`<label>شماره جلسه<input name="meetingNumber" data-meeting-number placeholder="مثلاً ۲۱۵"><small>برای اتصال بعدی سند به مدیریت جلسات</small></label><label>تاریخ برگزاری جلسه<input type="date" name="meetingDate" data-meeting-date><small>تاریخ جلسه‌ای که سند در آن تصویب/بررسی شده است</small></label>`;
 grid.insertAdjacentElement('afterend',w);
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 try{
  const url=typeof input==='string'?input:(input?.url||'');
  if(url.includes('/api/v1/documents/upload')&&init?.method==='POST'&&typeof init.body==='string'){
   const form=document.querySelector('#k76form');
   if(form){
    const meetingNumber=form.querySelector('[data-meeting-number]')?.value?.trim()||'';
    const meetingDate=form.querySelector('[data-meeting-date]')?.value?.trim()||'';
    if(meetingNumber||meetingDate){const b=JSON.parse(init.body);b.metadata={...(b.metadata||{}),meetingNumber:meetingNumber||null,meetingDate:meetingDate||null,meetingRef:null};init={...init,body:JSON.stringify(b)}}
   }
  }
 }catch{}
 return nativeFetch(input,init);
};

function collapseRelations(box){
 if(!box||box.dataset.k950Collapse)return;
 const head=box.querySelector('.k944relhead'),list=box.querySelector('.k944rellist,.k944empty');if(!head||!list)return;
 box.dataset.k950Collapse='1';const content=document.createElement('div');content.className='k950relcontent';list.parentNode.insertBefore(content,list);content.appendChild(list);content.hidden=true;
 head.classList.add('k950relhead');head.setAttribute('role','button');head.setAttribute('tabindex','0');head.setAttribute('aria-expanded','false');
 const t=document.createElement('button');t.type='button';t.className='k950reltoggle';t.textContent='نمایش سوابق ⌄';head.appendChild(t);
 const flip=()=>{content.hidden=!content.hidden;head.setAttribute('aria-expanded',content.hidden?'false':'true');t.textContent=content.hidden?'نمایش سوابق ⌄':'بستن سوابق ⌃'};
 head.addEventListener('click',e=>{if(!e.target.closest('[data-doc-preview]'))flip()});
 head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
}

const favKey='orgCog.favoriteDocuments.v1';
const getFavs=()=>{try{return JSON.parse(localStorage.getItem(favKey)||'[]')}catch{return[]}};
const saveFavs=x=>localStorage.setItem(favKey,JSON.stringify([...new Set(x)]));
function printHtml(title,html){const w=window.open('','_blank','width=900,height=700');if(!w)return alert('مرورگر اجازه باز کردن پنجره چاپ را نداده است.');w.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Vazirmatn,Tahoma,sans-serif;line-height:2.1;padding:35px}h1{font-size:20px;border-bottom:1px solid #ddd;padding-bottom:12px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>${esc(title)}</h1>${html}</body></html>`);w.document.close();setTimeout(()=>w.print(),250)}
function renderFav(btn,id){const on=getFavs().includes(id);btn.classList.toggle('active',on);btn.textContent=on?'★ ذخیره‌شده در اسناد من':'☆ افزودن به اسناد من'}
function addPopupTools(modal){
 if(!modal||modal.dataset.k950Tools)return;const head=modal.querySelector('.k91modalhead'),full=modal.querySelector('.k91fulltext');if(!head||!full)return;
 modal.dataset.k950Tools='1';const id=window.__K950_ACTIVE_DOC_ID||'',title=head.querySelector('h3')?.textContent||'سند';
 const tools=document.createElement('div');tools.className='k950tools';tools.innerHTML=`<button type="button" data-k950-print>🖨 چاپ کامل</button><button type="button" data-k950-print-selection>▣ چاپ بخش انتخاب‌شده</button><button type="button" data-k950-fav></button>`;head.appendChild(tools);
 tools.querySelector('[data-k950-print]').onclick=()=>printHtml(title,`<pre>${esc(full.innerText)}</pre>`);
 tools.querySelector('[data-k950-print-selection]').onclick=()=>{const s=window.getSelection(),text=String(s||'').trim();if(!text)return alert('ابتدا بخشی از متن سند را انتخاب کنید.');if(!full.contains(s.anchorNode)||!full.contains(s.focusNode))return alert('انتخاب باید از داخل متن همین سند باشد.');printHtml(`${title} — بخش انتخاب‌شده`,`<pre>${esc(text)}</pre>`)};
 const fb=tools.querySelector('[data-k950-fav]');renderFav(fb,id);fb.onclick=()=>{let f=getFavs(),on=f.includes(id);f=on?f.filter(x=>x!==id):[...f,id];saveFavs(f);renderFav(fb,id)};
}
window.addEventListener('click',e=>{const p=e.target?.closest?.('[data-doc-preview]');if(p?.dataset.docPreview)window.__K950_ACTIVE_DOC_ID=p.dataset.docPreview},true);

function looksDocumentCommand(q){
 const s=String(q||'').trim();
 return /(سند|اسناد|مصوبه|مصوبات|آیین.?نامه|بخشنامه|صورتجلسه|چشم.?انداز|مأموریت|ماموریت|راهبرد|سیاست)/i.test(s)||/جلسه\s*(?:شماره)?\s*[۰-۹٠-٩0-9]+/.test(s);
}
function isQuestion(q){return /(چی|چه|چرا|چگونه|چطور|کدام|کجا|کی|چه زمانی|چه تاریخی|آمده|اومده|گفته|ذکر شده|اشاره شده|محتوا|متن|در مورد|درباره)/i.test(q)}
function renderDocCommand(d){
 const out=document.getElementById('commandResult');if(!out)return;out.classList.remove('hidden');const items=d.items||[],ev=d.answer?.evidence||[];
 const answer=d.answer?`<section class="k951qa"><div class="k951qatitle"><b>✦ پاسخ از محتوای اسناد</b><span>${esc(d.answer.scopeLabel||'بانک اسناد')}</span></div><p class="k951summary">${esc(d.answer.summary||'')}</p>${ev.length?`<div class="k951evidence">${ev.map((a,i)=>`<article><span>${toFa(i+1)}</span><div><button type="button" data-doc-preview="${esc(a.documentId)}">${esc(a.documentTitle)}</button><p>${esc(a.text)}</p></div></article>`).join('')}</div>`:''}<small>پاسخ بر اساس متن استخراج‌شده اسناد و همراه با شاهد نمایش داده شده است.</small></section>`:'';
 out.innerHTML=`<div class="k950answer"><div class="k950answerhead"><span>${d.answer?'◈ پرسش از اسناد':'□ جستجوی اسناد سازمان'}</span><b>${toFa(items.length)} سند</b></div>${answer}${items.length?items.map(x=>`<article><button type="button" data-doc-preview="${esc(x.id)}">${esc(x.title||'بدون عنوان')}</button><div class="k950docmeta">${x.documentType?`<span>${esc(x.documentType)}</span>`:''}${x.subjectArea?`<span>موضوع: ${esc(x.subjectArea)}</span>`:''}${x.meetingNumber?`<span>جلسه: ${esc(x.meetingNumber)}</span>`:''}${x.meetingDate?`<span>تاریخ جلسه: ${esc(x.meetingDate)}</span>`:''}</div>${!d.answer&&x.excerpt?`<p>${esc(x.excerpt)}</p>`:''}</article>`).join(''):'<div class="k950empty">سندی مطابق این درخواست پیدا نشد.</div>'}<small class="k950notice">برای مشاهده متن کامل روی عنوان سند کلیک کنید.</small></div>`;
 out.scrollIntoView({behavior:'smooth',block:'start'});
}
async function handleDocumentCommand(q){
 const sp=new URLSearchParams({question:q,mode:isQuestion(q)?'qa':'search'});
 const out=document.getElementById('commandResult');if(out){out.classList.remove('hidden');out.innerHTML='<div class="k950loading">در حال جستجو در عنوان، فراداده و متن کامل اسناد…</div>'}
 try{renderDocCommand(await api('/api/v1/knowledge/document-query?'+sp.toString()))}catch(e){if(out)out.innerHTML=`<div class="k950empty">${esc(e.message)}</div>`}
}
const commandValue=()=>document.getElementById('commandInput')?.value?.trim()||'';
window.addEventListener('click',e=>{const b=e.target?.closest?.('#runCommand'),q=commandValue();if(!b||!q||!looksDocumentCommand(q))return;e.preventDefault();e.stopImmediatePropagation();handleDocumentCommand(q)},true);
window.addEventListener('keydown',e=>{const ta=e.target?.closest?.('#commandInput'),q=commandValue();if(!ta||e.key!=='Enter'||e.shiftKey||!q||!looksDocumentCommand(q))return;e.preventDefault();e.stopImmediatePropagation();handleDocumentCommand(q)},true);



/* ---------- Smart document metadata V1: Jalali, meeting type, promulgation, canonical topics ---------- */
const k953FaToEn=s=>String(s??'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const k953EnToFa=s=>String(s??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

function k953Div(a,b){return ~~(a/b)}
function k953Mod(a,b){return a-~~(a/b)*b}
function k953JalCal(jy){
 const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
 let bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,leap,n,i;
 if(jy<jp||jy>=breaks[bl-1])throw Error('INVALID_JALALI_YEAR');
 for(i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=k953Div(jump,33)*8+k953Div(k953Mod(jump,33),4);jp=jm}
 n=jy-jp;leapJ+=k953Div(n,33)*8+k953Div(k953Mod(n,33)+3,4);
 if(k953Mod(jump,33)===4&&jump-n===4)leapJ++;
 const leapG=k953Div(gy,4)-k953Div((k953Div(gy,100)+1)*3,4)-150;
 const march=20+leapJ-leapG;
 if(jump-n<6)n=n-jump+k953Div(jump+4,33)*33;
 leap=k953Mod(k953Mod(n+1,33)-1,4);if(leap===-1)leap=4;
 return{leap,gy,march}
}
function k953G2d(gy,gm,gd){
 let d=k953Div((gy+k953Div(gm-8,6)+100100)*1461,4)+k953Div(153*k953Mod(gm+9,12)+2,5)+gd-34840408;
 d=d-k953Div(k953Div(gy+100100+k953Div(gm-8,6),100)*3,4)+752;
 return d
}
function k953D2g(jdn){
 let j=4*jdn+139361631;
 j=j+k953Div(k953Div(4*jdn+183187720,146097)*3,4)*4-3908;
 const i=k953Div(k953Mod(j,1461),4)*5+308;
 const gd=k953Div(k953Mod(i,153),5)+1;
 const gm=k953Mod(k953Div(i,153),12)+1;
 const gy=k953Div(j,1461)-100100+k953Div(8-gm,6);
 return{gy,gm,gd}
}
function k953J2d(jy,jm,jd){const r=k953JalCal(jy);return k953G2d(r.gy,3,r.march)+(jm-1)*31-k953Div(jm,7)*(jm-7)+jd-1}
function k953D2j(jdn){const g=k953D2g(jdn),jy=g.gy-621,r=k953JalCal(jy),jdn1f=k953G2d(g.gy,3,r.march),k=jdn-jdn1f;let jm,jd,jy2=jy;if(k>=0){if(k<=185){jm=1+k953Div(k,31);jd=k953Mod(k,31)+1;return{jy:jy2,jm,jd}}k-=186}else{jy2--;k+=179;if(r.leap===1)k++}jm=7+k953Div(k,30);jd=k953Mod(k,30)+1;return{jy:jy2,jm,jd}}
function k953JalaliToIso(v){
 const p=k953FaToEn(v).trim().replace(/-/g,'/').split('/').map(Number);
 if(p.length!==3||!p.every(Number.isFinite))return'';
 const [jy,jm,jd]=p;if(jy<1200||jm<1||jm>12||jd<1||jd>31)return'';
 try{const g=k953D2g(k953J2d(jy,jm,jd));return`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`}catch{return''}
}
function k953IsoToJalali(v){
 const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return'';
 try{const j=k953D2j(k953G2d(+m[1],+m[2],+m[3]));return k953EnToFa(`${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`)}catch{return''}
}
function k953MakeJalali(original,label){
 if(!original||original.dataset.k953Jalali)return null;
 original.dataset.k953Jalali='1';
 original.type='hidden';
 const wrap=document.createElement('label');wrap.className='k953jalali';
 wrap.innerHTML=`${label}<input type="text" inputmode="numeric" placeholder="۱۴۰۵/۰۶/۱۷" data-k953-visible><small>تاریخ را به صورت شمسی وارد کنید.</small>`;
 original.parentElement.insertAdjacentElement('afterend',wrap);
 const vis=wrap.querySelector('[data-k953-visible]');
 if(original.value)vis.value=k953IsoToJalali(original.value);
 const sync=()=>{const iso=k953JalaliToIso(vis.value);original.value=iso;vis.classList.toggle('invalid',!!vis.value&&!iso)};
 vis.addEventListener('input',sync);vis.addEventListener('blur',sync);
 return{wrap,vis,original,sync}
}
const K953_MEETING_TYPES=['شورای سیاست‌گذاری','شورای مدیریتی','شورای تخصصی','کمیسیون','کمیته','کارگروه','جلسه کارشناسی','جلسه هماهنگی','جلسه رسمی عمومی'];
function k953EnhanceMetadata(form){
 if(!form||form.dataset.k953Meta)return;form.dataset.k953Meta='1';

 // Existing issuedAt -> Jalali
 const issued=form.querySelector('input[name="issuedAt"]');
 if(issued)k953MakeJalali(issued,'تاریخ صدور');

 // Existing validUntil -> Jalali and conditional visibility
 const validUntil=form.querySelector('input[name="validUntil"]');
 const validObj=validUntil?k953MakeJalali(validUntil,'تاریخ پایان / قطع اعتبار'):null;
 const validity=form.querySelector('select[name="validityStatus"]');
 if(validity&&validObj){
   const apply=()=>{
     const active=validity.value==='active';
     validObj.wrap.style.display=active?'none':'block';
     validObj.vis.required=!active;
     if(active){validObj.vis.value='';validUntil.value=''}
     const sm=validObj.wrap.querySelector('small');
     if(sm)sm.textContent=active?'':'برای سند غیرمعتبر/منقضی، تاریخ پایان یا قطع اعتبار را وارد کنید.';
   };
   validity.addEventListener('change',apply);apply();
 }

 // Replace meeting metadata block created by prior version
 const oldBlock=form.querySelector('.k950meetingfields');
 if(oldBlock){
   const number=oldBlock.querySelector('[data-meeting-number]');
   const date=oldBlock.querySelector('[data-meeting-date]');
   if(number)number.closest('label')?.remove();
   if(date)date.closest('label')?.remove();

   const meetingTypeLabel=document.createElement('label');
   meetingTypeLabel.innerHTML=`نوع جلسه<select name="meetingType" data-meeting-type><option value="">انتخاب نوع جلسه…</option>${K953_MEETING_TYPES.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><small>طبقه‌بندی استاندارد جلسه برای اتصال آینده به مدیریت جلسات</small></label>`;
   oldBlock.appendChild(meetingTypeLabel);

   const meetingNumLabel=document.createElement('label');
   meetingNumLabel.innerHTML=`شماره جلسه<input name="meetingNumber" data-meeting-number placeholder="مثلاً ۲۱۵"><small>شماره رسمی جلسه در صورت وجود</small>`;
   oldBlock.appendChild(meetingNumLabel);

   const meetingDateHidden=document.createElement('input');meetingDateHidden.type='hidden';meetingDateHidden.name='meetingDate';meetingDateHidden.dataset.meetingDate='1';
   oldBlock.appendChild(meetingDateHidden);
   k953MakeJalali(meetingDateHidden,'تاریخ برگزاری جلسه');

   const promulgationHidden=document.createElement('input');promulgationHidden.type='hidden';promulgationHidden.name='promulgationDate';promulgationHidden.dataset.promulgationDate='1';
   oldBlock.appendChild(promulgationHidden);
   k953MakeJalali(promulgationHidden,'تاریخ ابلاغ سند');
 }

 // Canonical subject selector replaces free text
 const subject=form.querySelector('input[name="subjectArea"]');
 if(subject){
   subject.type='hidden';subject.dataset.k953Canonical='1';
   const label=subject.closest('label');
   const box=document.createElement('div');box.className='k953topics';
   box.innerHTML=`<div class="k953topichead"><div><b>حوزه موضوعی</b><small>موضوع آزاد ثبت نمی‌شود؛ سامانه از فهرست استاندارد پیشنهاد می‌دهد.</small></div><button type="button" data-k953-analyze>تحلیل متن سند و پیشنهاد موضوع</button></div>
   <select data-k953-topic required><option value="">ابتدا فایل را انتخاب و تحلیل موضوعی را اجرا کنید…</option></select>
   <div data-k953-topic-status class="k953topicstatus"></div>`;
   label.insertAdjacentElement('afterend',box);label.style.display='none';
   const sel=box.querySelector('[data-k953-topic]'),status=box.querySelector('[data-k953-topic-status]');
   sel.addEventListener('change',()=>{subject.value=sel.value});

   async function analyze(){
     const file=form.querySelector('input[type="file"][name="file"]')?.files?.[0];
     if(!file){status.textContent='ابتدا فایل سند را انتخاب کنید.';return}
     status.textContent='در حال خواندن متن و مقایسه با موضوعات استاندارد…';
     try{
       const b64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(file)});
       const d=await api('/api/v1/knowledge/topic-suggestions',{method:'POST',body:JSON.stringify({fileName:file.name,mimeType:file.type||'application/octet-stream',contentBase64:b64})});
       const topics=d.catalog||[],rec=new Set((d.recommended||[]).map(x=>x.label));
       sel.innerHTML='<option value="">انتخاب حوزه موضوعی…</option>'+topics.map(x=>`<option value="${esc(x)}">${rec.has(x)?'★ ':''}${esc(x)}</option>`).join('');
       if(d.recommended?.[0]?.label){sel.value=d.recommended[0].label;subject.value=sel.value}
       status.innerHTML=d.recommended?.length?`پیشنهاد سامانه: ${d.recommended.slice(0,3).map(x=>`<b>${esc(x.label)}</b>`).join('، ')}`:'موضوع غالب با اطمینان کافی تشخیص داده نشد؛ از فهرست استاندارد انتخاب کنید.';
     }catch(e){status.textContent=e.message}
   }
   box.querySelector('[data-k953-analyze]').onclick=analyze;
   const file=form.querySelector('input[type="file"][name="file"]');
   if(file)file.addEventListener('change',()=>{subject.value='';sel.innerHTML='<option value="">برای فایل جدید، تحلیل موضوعی را دوباره اجرا کنید…</option>';status.textContent='';setTimeout(analyze,100)});
 }
}

/* enrich upload metadata with new canonical fields */
const k953Fetch=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 try{
  const url=typeof input==='string'?input:(input?.url||'');
  if(url.includes('/api/v1/documents/upload')&&init?.method==='POST'&&typeof init.body==='string'){
   const form=document.querySelector('#k76form');
   if(form){
    const b=JSON.parse(init.body);
    const m=b.metadata||{};
    m.meetingNumber=form.querySelector('[data-meeting-number]')?.value?.trim()||m.meetingNumber||null;
    m.meetingDate=form.querySelector('input[name="meetingDate"]')?.value||m.meetingDate||null;
    m.meetingType=form.querySelector('[data-meeting-type]')?.value||null;
    m.promulgationDate=form.querySelector('input[name="promulgationDate"]')?.value||null;
    m.validUntil=form.querySelector('input[name="validUntil"]')?.value||null;
    m.subjectArea=form.querySelector('input[name="subjectArea"]')?.value||null;
    b.metadata=m;init={...init,body:JSON.stringify(b)}
   }
  }
 }catch{}
 return k953Fetch(input,init);
};

/* ---------- Safe test-data reset panel ---------- */
function k952AdminPanel(){
 let old=document.getElementById('k952adminpanel'); if(old)old.remove();
 const panel=document.createElement('section');panel.id='k952adminpanel';panel.className='k952adminpanel';
 panel.innerHTML=`<div class="k952admincard">
   <div class="k952adminhead"><div><small>مدیریت سامانه</small><h3>داده‌های آزمایشی</h3><p>پاک‌سازی کنترل‌شده داده‌های سازمان آزمایشی برای شروع تست واقعی</p></div><button type="button" data-k952-close>×</button></div>
   <div class="k952warning"><b>این عملیات برگشت‌پذیر نیست.</b><span>فقط داده‌های مرتبط با سازمان <code>ORG:SYN-001</code> حذف می‌شوند؛ ساختار دیتابیس و تنظیمات Vercel حفظ می‌شود.</span></div>
   <div data-k952-preview class="k952preview"><span>در حال شمارش داده‌های قابل حذف…</span></div>
   <div class="k952actions"><button type="button" data-k952-refresh>بازشماری</button><button type="button" class="danger" data-k952-delete disabled>پاک کردن داده‌های آزمایشی</button></div>
   <div data-k952-status class="k952status"></div>
 </div>`;
 document.body.appendChild(panel);
 panel.querySelector('[data-k952-close]').onclick=()=>panel.remove();
 const preview=panel.querySelector('[data-k952-preview]'),del=panel.querySelector('[data-k952-delete]'),status=panel.querySelector('[data-k952-status]');
 async function load(){
   preview.innerHTML='<span>در حال شمارش داده‌های قابل حذف…</span>';del.disabled=true;status.textContent='';
   try{
     const d=await api('/api/v1/admin/test-data-reset');
     const c=d.counts||{}, total=Object.values(c).reduce((a,b)=>a+(Number(b)||0),0);
     preview.innerHTML=`<div class="k952total"><b>${toFa(total)}</b><span>رکورد مرتبط</span></div><div class="k952counts">${Object.entries(c).map(([k,v])=>`<div><b>${toFa(v)}</b><span>${esc(k)}</span></div>`).join('')}</div>`;
     del.disabled=total===0;
   }catch(e){preview.innerHTML=`<div class="k952error">${esc(e.message)}</div>`}
 }
 panel.querySelector('[data-k952-refresh]').onclick=load;
 del.onclick=async()=>{
   if(!confirm('آیا مطمئن هستید تمام داده‌های آزمایشی این سازمان پاک شوند؟'))return;
   const typed=prompt('برای تأیید نهایی عبارت DELETE TEST DATA را دقیقاً وارد کنید:');
   if(typed!=='DELETE TEST DATA'){status.textContent='عبارت تأیید صحیح نبود؛ عملیات لغو شد.';return}
   del.disabled=true;status.textContent='در حال پاک‌سازی کنترل‌شده داده‌ها…';
   try{
     const d=await api('/api/v1/admin/test-data-reset',{method:'POST',headers:{'x-reset-confirm':'DELETE_TEST_DATA'},body:JSON.stringify({confirm:'DELETE_TEST_DATA'})});
     status.innerHTML=`<b>پاک‌سازی انجام شد.</b> ${toFa(d.totalRemoved||0)} رکورد حذف شد. اکنون می‌توانید تست واقعی را آغاز کنید.`;
     await load();
   }catch(e){status.textContent=e.message;del.disabled=false}
 };
 load();
}
window.addEventListener('click',e=>{
 const a=e.target?.closest?.('[data-workspace="admin"]');
 if(!a)return;
 setTimeout(k952AdminPanel,120);
},true);

function enhance(){document.querySelectorAll('#k76form').forEach(f=>{enhanceUploadForm(f);k953EnhanceMetadata(f)});const modal=document.getElementById('k91docmodal');if(modal){collapseRelations(modal.querySelector('.k944relations'));addPopupTools(modal)}}
new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});enhance();
})();