(()=>{
window.__DOCUMENT_MEETING_COMMAND_BUILD__='0.9.5.8.1';
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
const K954_MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const K954_WEEK=['ش','ی','د','س','چ','پ','ج'];
function k954TodayJ(){
 const d=new Date(),iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const m=iso.match(/^(\d{4})-(\d{2})-(\d{2})$/),j=k953D2j(k953G2d(+m[1],+m[2],+m[3]));return j
}
function k954DaysInMonth(jy,jm){if(jm<=6)return 31;if(jm<=11)return 30;try{return k953JalCal(jy).leap===0?30:29}catch{return 29}}
function k954WeekIndex(jy,jm,jd=1){
 const g=k953D2g(k953J2d(jy,jm,jd)),dt=new Date(g.gy,g.gm-1,g.gd);return (dt.getDay()+1)%7
}
function k954CreateCalendarField(original,label,container=null){
 if(!original||original.dataset.k954Calendar)return null;
 original.dataset.k954Calendar='1';original.type='hidden';

 const oldLabel=original.closest('label');
 const wrap=document.createElement('label');wrap.className='k954datefield';
 wrap.innerHTML=`<span class="k954datelabel">${label}</span><div class="k954dateinput"><input type="text" readonly placeholder="انتخاب تاریخ شمسی…" data-k954-display><button type="button" title="انتخاب از تقویم" data-k954-open>▣</button></div><small>تاریخ به صورت شمسی نمایش داده می‌شود.</small>`;
 if(container)container.appendChild(wrap);
 else if(oldLabel){oldLabel.insertAdjacentElement('afterend',wrap);oldLabel.style.display='none'}
 else original.insertAdjacentElement('afterend',wrap);

 const display=wrap.querySelector('[data-k954-display]'),open=wrap.querySelector('[data-k954-open]');
 let selected=original.value?k953IsoToJalali(original.value):'',cur;
 const parseJ=v=>{const p=k953FaToEn(v).replace(/-/g,'/').split('/').map(Number);return p.length===3&&p.every(Number.isFinite)?{jy:p[0],jm:p[1],jd:p[2]}:null};
 cur=parseJ(selected)||k954TodayJ();
 if(selected)display.value=selected;

 const pop=document.createElement('div');pop.className='k954calendar';pop.hidden=true;wrap.appendChild(pop);
 pop.addEventListener('click',e=>e.stopPropagation());
 function choose(jy,jm,jd){
   const fa=k953EnToFa(`${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`);
   const iso=k953JalaliToIso(fa);if(!iso)return;
   original.value=iso;display.value=fa;selected=fa;cur={jy,jm,jd};pop.hidden=true;
   original.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function render(){
   const {jy,jm}=cur,first=k954WeekIndex(jy,jm),days=k954DaysInMonth(jy,jm),sel=parseJ(selected);
   let cells='';for(let i=0;i<first;i++)cells+='<span></span>';
   for(let d=1;d<=days;d++){const active=sel&&sel.jy===jy&&sel.jm===jm&&sel.jd===d;cells+=`<button type="button" class="${active?'selected':''}" data-k954-day="${d}">${k953EnToFa(d)}</button>`}
   pop.innerHTML=`<div class="k954yearnav"><button type="button" data-k954-prev-year>« سال قبل</button><b>${k953EnToFa(jy)}</b><button type="button" data-k954-next-year>سال بعد »</button></div><div class="k954calhead"><button type="button" data-k954-prev>‹</button><b>${K954_MONTHS[jm-1]}</b><button type="button" data-k954-next>›</button></div><div class="k954week">${K954_WEEK.map(x=>`<span>${x}</span>`).join('')}</div><div class="k954days">${cells}</div><div class="k954calfoot"><button type="button" data-k954-today>امروز</button><button type="button" data-k954-clear>پاک کردن</button></div>`;
   pop.querySelector('[data-k954-prev]').onclick=e=>{e.stopPropagation();cur.jm--;if(cur.jm<1){cur.jm=12;cur.jy--}render()};
   pop.querySelector('[data-k954-next]').onclick=e=>{e.stopPropagation();cur.jm++;if(cur.jm>12){cur.jm=1;cur.jy++}render()};
   pop.querySelector('[data-k954-prev-year]').onclick=e=>{e.stopPropagation();cur.jy--;render()};
   pop.querySelector('[data-k954-next-year]').onclick=e=>{e.stopPropagation();cur.jy++;render()};
   pop.querySelectorAll('[data-k954-day]').forEach(b=>b.onclick=()=>choose(cur.jy,cur.jm,+b.dataset.k954Day));
   pop.querySelector('[data-k954-today]').onclick=()=>{const t=k954TodayJ();choose(t.jy,t.jm,t.jd)};
   pop.querySelector('[data-k954-clear]').onclick=()=>{original.value='';display.value='';selected='';pop.hidden=true;original.dispatchEvent(new Event('change',{bubbles:true}))};
 }
 open.onclick=e=>{e.stopPropagation();render();pop.hidden=!pop.hidden};
 display.onclick=e=>{e.stopPropagation();render();pop.hidden=!pop.hidden};
 document.addEventListener('click',e=>{if(!wrap.contains(e.target))pop.hidden=true});
 return{wrap,display,original,pop,setVisible:v=>{wrap.style.display=v?'block':'none'},clear:()=>{original.value='';display.value='';selected=''}};
}
const K953_MEETING_TYPES=['شورای سیاست‌گذاری','شورای مدیریتی','شورای تخصصی','کمیسیون','کمیته','کارگروه','جلسه کارشناسی','جلسه هماهنگی','جلسه رسمی عمومی'];

function k953EnhanceMetadata(form){
 if(!form||form.dataset.k953Meta)return;form.dataset.k953Meta='1';

 const issued=form.querySelector('input[name="issuedAt"]');
 if(issued)k954CreateCalendarField(issued,'تاریخ صدور');

 const validUntil=form.querySelector('input[name="validUntil"]');
 const validObj=validUntil?k954CreateCalendarField(validUntil,'تاریخ پایان / قطع اعتبار'):null;
 const validity=form.querySelector('select[name="validityStatus"]');
 if(validity&&validObj){
   const apply=()=>{
     const active=validity.value==='active';
     validObj.setVisible(!active);
     if(active)validObj.clear();
     validObj.display.required=!active;
     const sm=validObj.wrap.querySelector('small');
     if(sm)sm.textContent=active?'':'برای سند غیرمعتبر/منقضی، تاریخ پایان یا قطع اعتبار را از تقویم انتخاب کنید.';
   };
   validity.addEventListener('change',apply);apply();
 }

 const oldBlock=form.querySelector('.k950meetingfields');
 if(oldBlock){
   oldBlock.innerHTML='';
   const meetingTypeLabel=document.createElement('label');
   meetingTypeLabel.innerHTML=`نوع جلسه<select name="meetingType" data-meeting-type><option value="">انتخاب نوع جلسه…</option>${K953_MEETING_TYPES.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><small>طبقه‌بندی استاندارد جلسه</small></label>`;
   oldBlock.appendChild(meetingTypeLabel);

   const meetingNumLabel=document.createElement('label');
   meetingNumLabel.innerHTML=`شماره جلسه<input name="meetingNumber" data-meeting-number placeholder="مثلاً ۲۱۵"><small>شماره رسمی جلسه در صورت وجود</small>`;
   oldBlock.appendChild(meetingNumLabel);

   const meetingDateHidden=document.createElement('input');meetingDateHidden.type='hidden';meetingDateHidden.name='meetingDate';meetingDateHidden.dataset.meetingDate='1';
   oldBlock.appendChild(meetingDateHidden);k954CreateCalendarField(meetingDateHidden,'تاریخ برگزاری جلسه',oldBlock);

   const promulgationHidden=document.createElement('input');promulgationHidden.type='hidden';promulgationHidden.name='promulgationDate';promulgationHidden.dataset.promulgationDate='1';
   oldBlock.appendChild(promulgationHidden);k954CreateCalendarField(promulgationHidden,'تاریخ ابلاغ سند',oldBlock);
 }

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
       const d=await api('/api/v1/knowledge/topic-suggestions',{method:'POST',body:JSON.stringify({title:form.querySelector('input[name="title"]')?.value?.trim()||'',fileName:file.name,mimeType:file.type||'application/octet-stream',contentBase64:b64})});
       const topics=d.catalog||[],rec=new Set((d.recommended||[]).map(x=>x.label));
       sel.innerHTML='<option value="">انتخاب حوزه موضوعی…</option>'+topics.map(x=>`<option value="${esc(x)}">${rec.has(x)?'★ ':''}${esc(x)}</option>`).join('');
       if(d.recommended?.[0]?.label){sel.value=d.recommended[0].label;subject.value=sel.value}
       status.innerHTML=d.recommended?.length?`پیشنهاد سامانه: ${d.recommended.slice(0,4).map((x,i)=>`<b>${i===0?'★ ':''}${esc(x.label)}</b>${x.source==='document_title'?'<small class="k958source">از تیتر داخل سند</small>':x.source==='form_title'?'<small class="k958source">از عنوان فرم</small>':x.source==='heading'?'<small class="k958source">از سوتیتر</small>':''}`).join('، ')}`:'موضوع غالب با اطمینان کافی تشخیص داده نشد؛ از فهرست انتخاب کنید.';
     }catch(e){status.textContent=e.message}
   }
   box.querySelector('[data-k953-analyze]').onclick=analyze;
   const titleInput=form.querySelector('input[name="title"]');
   if(titleInput)titleInput.addEventListener('input',()=>{
     if(form.querySelector('input[type="file"][name="file"]')?.files?.[0]){
       status.textContent='عنوان سند تغییر کرده است؛ برای اعمال اولویت عنوان، «تحلیل فایل و پیشنهاد موضوع» را دوباره بزنید.';
     }
   });
   const file=form.querySelector('input[type="file"][name="file"]');
   if(file)file.addEventListener('change',()=>{subject.value='';sel.innerHTML='<option value="">برای فایل جدید، تحلیل موضوعی را دوباره اجرا کنید…</option>';status.textContent='';setTimeout(analyze,100)});
 }
}


/* ---------- 0.9.5.5 Form composition + structured Word tables ---------- */
function k955ComposeForm(form){
 if(!form||form.dataset.k955Composed)return;
 const grid=form.querySelector('.k76grid'),topic=form.querySelector('.k953topics'),meeting=form.querySelector('.k950meetingfields'),file=form.querySelector('.k76file');
 if(!grid||!topic||!file)return;
 form.dataset.k955Composed='1';

 const card=document.createElement('section');card.className='k955metacard';
 card.innerHTML='<header><div><small>مشخصات پایه سند</small><b>اطلاعات شناسنامه‌ای، اعتبار و دامنه سند</b></div><span>01</span></header>';
 grid.parentNode.insertBefore(card,grid);card.appendChild(grid);

 topic.classList.add('k955topicbox');
 const topicHead=topic.querySelector('.k953topichead');
 const intro=document.createElement('div');intro.className='k955uploadintro';
 intro.innerHTML='<div><b>فایل سند و حوزه موضوعی</b><small>فایل را در همین بخش انتخاب کنید؛ سامانه متن را می‌خواند و حوزه موضوعی استاندارد پیشنهاد می‌دهد.</small></div>';
 if(topicHead)topic.insertBefore(intro,topicHead);else topic.prepend(intro);
 intro.appendChild(file);
 const analyze=topic.querySelector('[data-k953-analyze]');if(analyze)analyze.textContent='تحلیل فایل و پیشنهاد موضوع';
 (meeting||card).insertAdjacentElement('afterend',topic);
}
const k955Esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const k956FaDigits=s=>String(s??'').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/[٠-٩]/g,d=>'۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
const k956AlignClass=a=>({center:' k956center',left:' k956left',right:' k956right',both:' k956justify',justify:' k956justify'}[String(a||'').toLowerCase()]||'');
function k956InlineHtml(block){
 if(Array.isArray(block.inlineParts)&&block.inlineParts.length){
   return block.inlineParts.map(p=>{
     if(p.type==='fraction')return `<span class="k956fraction"><span>${k957TextHtml(p.numerator)}</span><span>${k957TextHtml(p.denominator)}</span></span>`;
     return k957TextHtml(p.text||'');
   }).join('');
 }
 return k957TextHtml(block.text||'');
}
function k955StructureHtml(structure){
 if(!structure||structure.kind!=='docx'||!Array.isArray(structure.blocks))return'';
 return structure.blocks.map(b=>{
  if(b.type==='paragraph')return `<p class="k955docp${k956AlignClass(b.alignment)}">${k956InlineHtml(b)}</p>`;
  if(b.type==='mathFraction')return `<p class="k955docp${k956AlignClass(b.alignment)}"><span class="k956fraction k957standalonefrac"><span>${k957TextHtml(b.numerator)}</span><span>${k957TextHtml(b.denominator)}</span></span></p>`;
  if(b.type==='table'){
    const prepared=k957PreparedRows(b.rows||[]);
    return `<div class="k955tablewrap"><table class="k955doctable"><tbody>${prepared.map(row=>`<tr>${row.map(c=>`<td${c.colspan>1?` colspan="${c.colspan}"`:''}${c.rowspan>1?` rowspan="${c.rowspan}"`:''} class="${k956AlignClass(c.alignment).trim()}">${k957TextHtml(c.text||'').replace(/\n/g,'<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return'';
 }).join('');
}
function k956NormalizeDisplayedDigits(root){
 if(!root||root.dataset.k956Digits)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(n=>{n.nodeValue=k956FaDigits(n.nodeValue)});
 root.dataset.k956Digits='1';
}
async function k955RenderStructuredDoc(){
 const modal=document.getElementById('k91docmodal'),full=modal?.querySelector('.k91fulltext'),id=window.__K951_ACTIVE_DOC_ID||window.__K950_ACTIVE_DOC_ID||'';
 if(!modal||!full||!id||full.dataset.k955Structured)return;
 full.dataset.k955Structured='loading';
 try{
  const d=await api('/api/v1/knowledge/document-structure?documentId='+encodeURIComponent(id));
  const html=k955StructureHtml(d.structure);
  if(html){full.innerHTML=html;full.classList.add('k955structured')}
  k956NormalizeDisplayedDigits(full);
  const tw=document.createTreeWalker(full,NodeFilter.SHOW_TEXT),tn=[];while(tw.nextNode())tn.push(tw.currentNode);tn.forEach(n=>n.nodeValue=k957NormPct(n.nodeValue));
  const q=k957CurrentSearchQuery();if(q)k957Highlight(full,q);
  full.dataset.k955Structured='1';
 }catch{
  k956NormalizeDisplayedDigits(full);
  const tw=document.createTreeWalker(full,NodeFilter.SHOW_TEXT),tn=[];while(tw.nextNode())tn.push(tw.currentNode);tn.forEach(n=>n.nodeValue=k957NormPct(n.nodeValue));
  const q=k957CurrentSearchQuery();if(q)k957Highlight(full,q);
  full.dataset.k955Structured='0'
 }
}


/* ---------- 0.9.5.7 UX + highlight + math/table fidelity ---------- */
function k957SimplifyRegisterStatus(){
 const st=document.getElementById('k76status');
 if(!st||st.dataset.k957Observed)return;
 st.dataset.k957Observed='1';
 let applying=false;
 const setState=(text,cls)=>{
   if(applying)return;
   const sameText=(st.textContent||'').trim()===text;
   const sameClass=st.classList.contains(cls);
   if(sameText&&sameClass)return;
   applying=true;
   st.classList.remove('k957ok','k957err','k957working');
   if(cls)st.classList.add(cls);
   if(!sameText)st.textContent=text;
   queueMicrotask(()=>{applying=false});
 };
 const apply=()=>{
   if(applying)return;
   const t=(st.textContent||'').trim();
   if(!t)return;
   if(/در حال ثبت|در حال/i.test(t)){setState('در حال ثبت سند…','k957working');return}
   if(/ثبت شد|با موفقیت|شناسه:/i.test(t)){setState('سند با موفقیت ثبت شد.','k957ok');return}
   if(/خطا|مشکل|ناموفق|الزامی|پیدا نشد|نیازمند/i.test(t)){setState('در ثبت سند مشکلی به وجود آمد.','k957err');}
 };
 const observer=new MutationObserver(()=>requestAnimationFrame(apply));
 observer.observe(st,{subtree:true,childList:true,characterData:true});
 apply();
}

const k957NormPct=s=>String(s??'')
 .replace(/%([۰-۹٠-٩0-9]+(?:[٫.,][۰-۹٠-٩0-9]+)?)/g,'$1٪')
 .replace(/([۰-۹٠-٩0-9]+(?:[٫.,][۰-۹٠-٩0-9]+)?)\s*%/g,'$1٪')
 .replace(/٪\s*([۰-۹٠-٩0-9]+)/g,'$1٪');

function k957TextHtml(s){return k955Esc(k956FaDigits(k957NormPct(s)))}

function k957CurrentSearchQuery(){
 try{
   const u=new URL(location.href);
   return u.searchParams.get('q')||window.__K91_LAST_QUERY||window.__K957_LAST_QUERY||'';
 }catch{return window.__K91_LAST_QUERY||window.__K957_LAST_QUERY||''}
}
function k957Highlight(root,q){
 q=String(q||'').trim();if(!root||!q)return;
 const nq=q.normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
   acceptNode:n=>{
     if(!n.nodeValue?.trim())return NodeFilter.FILTER_REJECT;
     if(n.parentElement?.closest('mark,.k956fraction'))return NodeFilter.FILTER_REJECT;
     return NodeFilter.FILTER_ACCEPT;
   }
 });
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>{
   const text=n.nodeValue,norm=text.normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک');
   const idx=norm.toLowerCase().indexOf(nq.toLowerCase());
   if(idx<0)return;
   const frag=document.createDocumentFragment();let from=0,cur=idx;
   while(cur>=0){
     frag.appendChild(document.createTextNode(text.slice(from,cur)));
     const m=document.createElement('mark');m.className='k91highlight k957highlight';m.textContent=text.slice(cur,cur+q.length);frag.appendChild(m);
     from=cur+q.length;
     cur=norm.toLowerCase().indexOf(nq.toLowerCase(),from);
   }
   frag.appendChild(document.createTextNode(text.slice(from)));n.parentNode.replaceChild(frag,n);
 });
}

function k957PreparedRows(rows){
 const out=[];const active={};
 for(let r=0;r<rows.length;r++){
   const src=rows[r]||[],dst=[];let logicalCol=0;
   for(const c of src){
     const span=Math.max(1,Number(c.colspan||1));
     const vm=c.vMerge||null;
     if(vm==='continue'){
       const key=logicalCol;
       if(active[key])active[key].rowspan=(active[key].rowspan||1)+1;
       logicalCol+=span;continue;
     }
     const cell={...c,colspan:span,rowspan:1};
     dst.push(cell);
     if(vm==='restart')active[logicalCol]=cell;
     else delete active[logicalCol];
     logicalCol+=span;
   }
   out.push(dst);
 }
 return out;
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


window.addEventListener('click',e=>{
 const p=e.target?.closest?.('[data-doc-preview]');
 if(p){
   const q=document.querySelector('#k91search input,[data-k91-search],input[name="q"]')?.value?.trim()||'';
   if(q)window.__K957_LAST_QUERY=q;
 }
},true);


function k958SubmitGuard(form){
 if(!form||form.dataset.k958SubmitGuard)return;
 form.dataset.k958SubmitGuard='1';
 const btn=form.querySelector('button.k76primary');
 const st=form.querySelector('#k76status');
 if(!btn||!st)return;
 form.addEventListener('submit',()=>{
   if(btn.dataset.k958Busy==='1')return;
   btn.dataset.k958Busy='1';btn.disabled=true;btn.textContent='در حال ثبت سند…';
   const release=()=>{
     const t=(st.textContent||'').trim();
     if(/موفقیت|مشکلی به وجود آمد|الزامی/.test(t)){
       btn.dataset.k958Busy='0';btn.disabled=false;btn.textContent='ثبت سند';
     }
   };
   const o=new MutationObserver(()=>setTimeout(release,0));o.observe(st,{childList:true,subtree:true,characterData:true});
   setTimeout(()=>{release(); if(btn.dataset.k958Busy==='1'){btn.dataset.k958Busy='0';btn.disabled=false;btn.textContent='ثبت سند'} o.disconnect()},30000);
 },true);
}

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

function enhance(){document.querySelectorAll('#k76form').forEach(f=>{enhanceUploadForm(f);k953EnhanceMetadata(f);k955ComposeForm(f);k957SimplifyRegisterStatus();k958SubmitGuard(f)});const modal=document.getElementById('k91docmodal');if(modal){collapseRelations(modal.querySelector('.k944relations'));addPopupTools(modal);k955RenderStructuredDoc()}}
new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});enhance();
document.addEventListener('k958:document-preview',()=>setTimeout(()=>{try{k955RenderStructuredDoc()}catch{}},30));
})();