(()=>{
window.__DOCUMENT_MEETING_COMMAND_BUILD__='0.9.9.0.8';
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
const K9885_SERVER_RAW_BUDGET=2600000;
const k9885Sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function k9885Base64(file){
 const ab=await file.arrayBuffer();
 const bytes=new Uint8Array(ab);let binary='';
 const step=0x8000;for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));
 return btoa(binary);
}
async function k9885ServerRef(file){
 return {fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,contentBase64:await k9885Base64(file),directUpload:false,transport:'function-fallback-v1'};
}
async function k986DirectBlobRef(file,role='attachment'){
 if(!file)throw Object.assign(new Error('فایل برای آپلود انتخاب نشده است.'),{code:'DIRECT_UPLOAD_FAILED'});
 let last;
 for(let attempt=1;attempt<=4;attempt++){
  try{
   const pre=await nativeFetch('/api/v1/knowledge/blob-upload-url',{method:'POST',headers:{'content-type':'application/json','x-org-id':ORG},body:JSON.stringify({fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,role})});
   const p=await pre.json().catch(()=>({}));
   if(!pre.ok)throw Object.assign(new Error(p.message||'دریافت مجوز آپلود مستقیم ناموفق بود.'),{code:p.code||'DIRECT_UPLOAD_FAILED'});
   const put=await nativeFetch(p.presignedUrl,{method:'PUT',body:file});
   if(!put.ok)throw Object.assign(new Error(`ارسال مستقیم فایل به Blob ناموفق بود (${put.status}).`),{code:'DIRECT_UPLOAD_FAILED'});
   return {fileName:file.name,mimeType:file.type||'application/octet-stream',blobUrl:p.blobUrl,blobPathname:p.pathname,size:file.size,directUpload:true,transport:'direct-blob-v2'};
  }catch(e){last=e;if(attempt<4)await k9885Sleep([0,350,800,1500][attempt]||1500)}
 }
 throw last||Object.assign(new Error('آپلود مستقیم فایل ناموفق بود.'),{code:'DIRECT_UPLOAD_FAILED'});
}
async function k986DirectBlobRefs(files,role='attachment'){
 const out=[];for(const file of [...(files||[])])out.push(await k986DirectBlobRef(file,role));return out;
}

window.fetch=async function(input,init={}){
 const url=typeof input==='string'?input:(input?.url||'');
 if(url.includes('/api/v1/documents/upload')&&init?.method==='POST'&&typeof init.body==='string'){
  const form=document.querySelector('#k76form');
  if(form){
   const b=JSON.parse(init.body);
   const meetingNumber=form.querySelector('[data-meeting-number]')?.value?.trim()||'';
   const meetingDate=form.querySelector('[data-meeting-date]')?.value?.trim()||'';
   const documentNumber=form.querySelector('[data-document-number]')?.value?.trim()||'';
   if(meetingNumber||meetingDate||documentNumber){
    b.metadata={...(b.metadata||{}),documentNumber:documentNumber||null,meetingNumber:meetingNumber||null,meetingDate:meetingDate||null,meetingRef:null};
   }

   const primary=form.querySelector('input[type="file"][name="file"]')?.files?.[0];
   const attachmentInputs=[...form.querySelectorAll('[data-k985-attachment-input],[data-k985-attachments]')];
   const attachments=attachmentInputs.flatMap(x=>[...(x.files||[])]);
   // Hybrid transport: keep the total Base64 portion comfortably below the Function
   // payload ceiling, and send only the remaining/larger files directly to Blob.
   let remainingServerBudget=K9885_SERVER_RAW_BUDGET;
   const transportRef=async(file,role)=>{
     const sz=Number(file?.size||0);
     if(sz>0&&sz<=remainingServerBudget){
       remainingServerBudget-=sz;
       return k9885ServerRef(file);
     }
     return k986DirectBlobRef(file,role);
   };
   if(primary){
    const ref=await transportRef(primary,'primary');
    Object.assign(b,ref);if(!ref.contentBase64)delete b.contentBase64;
   }
   if(attachments.length){
     b.attachments=[];
     for(const file of attachments)b.attachments.push(await transportRef(file,'attachment'));
   }
   init={...init,body:JSON.stringify(b)};
  }
 }
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
 out.innerHTML=`<div class="k950answer"><div class="k950answerhead"><span>${d.answer?'◈ پرسش از اسناد':'□ جستجوی اسناد سازمان'}</span><b>${toFa(items.length)} سند</b></div>${answer}${items.length?items.map(x=>`<article><button type="button" data-doc-preview="${esc(x.id)}">${esc(x.title||'بدون عنوان')}</button><div class="k950docmeta">${x.documentType?`<span>${esc(x.documentType)}</span>`:''}${x.documentNumber?`<span>شماره: ${esc(toFa(x.documentNumber))}</span>`:''}${x.subjectCategory?`<span>موضوع کلان: ${esc(x.subjectCategory)}</span>`:''}${x.subjectArea?`<span>زیرموضوع: ${esc(x.subjectArea)}</span>`:''}${x.issuer?`<span>مرجع: ${esc(x.issuer)}</span>`:''}${x.meetingNumber?`<span>جلسه: ${esc(toFa(x.meetingNumber))}</span>`:''}${x.meetingDate?`<span>تاریخ جلسه: ${esc(toFa(x.meetingDate))}</span>`:''}</div>${!d.answer&&x.excerpt?`<p>${esc(x.excerpt)}</p>`:''}</article>`).join(''):'<div class="k950empty">سندی مطابق این درخواست پیدا نشد.</div>'}<small class="k950notice">برای مشاهده متن کامل روی عنوان سند کلیک کنید.</small></div>`;
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
window.__ORG_JALALI_ENHANCE__=(input,label,container=null)=>k954CreateCalendarField(input,label,container);
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
   meetingNumLabel.innerHTML=`شماره جلسه<input name="meetingNumber" data-meeting-number placeholder="مثلاً ۱۵"><small>شماره رسمی جلسه در صورت وجود</small>`;
   oldBlock.appendChild(meetingNumLabel);

   const documentNumLabel=document.createElement('label');
   documentNumLabel.className='k972documentnumber';
   documentNumLabel.innerHTML=`شماره مصوبه / تصمیم / سند<input name="documentNumber" data-document-number placeholder="مثلاً ۲۱۵"><small>شماره رسمی سند برای جستجو و ارجاع</small>`;
   oldBlock.appendChild(documentNumLabel);

   const meetingDateHidden=document.createElement('input');meetingDateHidden.type='hidden';meetingDateHidden.name='meetingDate';meetingDateHidden.dataset.meetingDate='1';
   oldBlock.appendChild(meetingDateHidden);k954CreateCalendarField(meetingDateHidden,'تاریخ برگزاری جلسه',oldBlock);

   const promulgationHidden=document.createElement('input');promulgationHidden.type='hidden';promulgationHidden.name='promulgationDate';promulgationHidden.dataset.promulgationDate='1';
   oldBlock.appendChild(promulgationHidden);k954CreateCalendarField(promulgationHidden,'تاریخ ابلاغ سند',oldBlock);
 }

 const subject=form.querySelector('input[name="subjectArea"]');
 if(subject){
   subject.type='hidden';subject.dataset.k953Canonical='1';

   let category=form.querySelector('input[name="subjectCategory"]');
   if(!category){
     category=document.createElement('input');
     category.type='hidden';category.name='subjectCategory';category.dataset.subjectCategory='1';
     subject.insertAdjacentElement('afterend',category);
   }

   const PRIMARY=[
    'راهبرد و برنامه‌ریزی','منابع انسانی','مالی و بودجه','فناوری و زیرساخت','آموزش','پژوهش و نوآوری',
    'فروش و بازاریابی','مشتریان و ذی‌نفعان','عملیات و فرآیندها','حقوقی و مقررات','ساختار و حاکمیت سازمانی',
    'نظارت، ارزیابی و عملکرد','ریسک، ایمنی و امنیت','ارتباطات و رسانه','تدارکات، خرید و زنجیره تأمین',
    'دارایی‌ها، اموال و پشتیبانی','محصول و خدمت','کیفیت و بهبود','پروژه‌ها و برنامه‌های اجرایی',
    'امور فرهنگی و اجتماعی','امور تخصصی حوزه فعالیت سازمان','امور بین‌الملل'
   ];

   const label=subject.closest('label');
   const box=document.createElement('div');box.className='k953topics k971topic-tree';
   box.innerHTML=`<div class="k953topichead"><div><b>طبقه‌بندی موضوعی سند</b><small>لایه اول موضوع کلان سازمانی است؛ لایه دوم زیرموضوع دقیق همین سند.</small></div><button type="button" data-k953-analyze>تحلیل فایل و پیشنهاد زیرموضوع</button></div>
   <div class="k971topicgrid">
    <label><b>موضوع کلان *</b><select data-k971-primary required><option value="">انتخاب موضوع کلان…</option>${PRIMARY.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><small>انتخاب از درختواره استاندارد سازمانی الزامی است.</small></label>
    <label><b>زیرموضوع سند *</b><input data-k971-subtopic list="k971subtopics" placeholder="مثلاً حقوق و دستمزد و مزایا" required><datalist id="k971subtopics"></datalist><small>سامانه پیشنهاد می‌دهد و کاربر می‌تواند متن نهایی را ویرایش و تأیید کند.</small></label>
   </div>
   <div data-k953-topic-status class="k953topicstatus"></div>`;
   label.insertAdjacentElement('afterend',box);label.style.display='none';

   const primary=box.querySelector('[data-k971-primary]'),
         sub=box.querySelector('[data-k971-subtopic]'),
         dl=box.querySelector('#k971subtopics'),
         status=box.querySelector('[data-k953-topic-status]');

   function sync(){category.value=primary.value||'';subject.value=sub.value.trim()}
   primary.addEventListener('change',sync);
   sub.addEventListener('input',sync);

   async function analyze(){
     const file=form.querySelector('input[type="file"][name="file"]')?.files?.[0];
     if(!file){status.textContent='ابتدا فایل سند را انتخاب کنید.';return}
     status.textContent='در حال تحلیل موضوع کلان و زیرموضوع سند…';
     try{
       const light=file.size>700000;
       const payload={
         title:form.querySelector('input[name="title"]')?.value?.trim()||'',
         primaryTopic:primary.value||'',
         fileName:file.name,mimeType:file.type||'application/octet-stream'
       };
       if(!light){
         payload.contentBase64=await k9885Base64(file);
       }
       const d=await api('/api/v1/knowledge/topic-suggestions',{method:'POST',body:JSON.stringify(payload)});
       if(!primary.value&&d.primaryRecommended?.[0]?.label)primary.value=d.primaryRecommended[0].label;
       const subs=d.subtopics||[];
       dl.innerHTML=subs.map(x=>`<option value="${esc(x.label)}"></option>`).join('');
       if(!sub.value&&subs[0]?.label)sub.value=subs[0].label;
       sync();
       status.innerHTML=`${d.analysis?.detectedTitle?`<div class="k958detected"><b>عنوان تشخیص‌داده‌شده:</b> ${esc(d.analysis.detectedTitle)}</div>`:''}<b>موضوع کلان:</b> ${esc(primary.value||'انتخاب نشده')} ${subs.length?`· <b>زیرموضوع‌های پیشنهادی:</b> ${subs.slice(0,5).map(x=>esc(x.label)).join('، ')}`:'· زیرموضوع پیشنهادی قابل اتکا پیدا نشد؛ کاربر آن را نهایی کند.'}`;
     }catch(e){status.textContent='پیشنهاد موضوعی در دسترس نیست؛ این موضوع مانع ثبت سند نمی‌شود.'}
   }
   box.querySelector('[data-k953-analyze]').onclick=analyze;
   const file=form.querySelector('input[type="file"][name="file"]');
   if(file)file.addEventListener('change',()=>{subject.value='';sub.value='';dl.innerHTML='';status.textContent='فایل آماده است. برای پیشنهاد موضوع، دکمه «تحلیل فایل و پیشنهاد زیرموضوع» را بزنید.'});
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

/* ---------- 0.9.6.1 — Precise inline amendment text + deterministic number direction ---------- */
const k961NormDigits=s=>String(s??'')
 .replace(/[٠-٩]/g,d=>'۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
 .replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function k961FaToEn(s){
 return String(s??'')
  .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function k961ProtectNumbers(root){
 if(!root)return;
 // Undo the previous experimental BDI wrappers first.
 root.querySelectorAll('bdi.k960num,span.k961num').forEach(x=>x.replaceWith(document.createTextNode(x.textContent||'')));

 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
   acceptNode:n=>{
     if(!n.nodeValue||!/[۰-۹٠-٩0-9]/.test(n.nodeValue))return NodeFilter.FILTER_REJECT;
     if(n.parentElement?.closest('script,style,.k961num'))return NodeFilter.FILTER_REJECT;
     return NodeFilter.FILTER_ACCEPT;
   }
 });
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 // Keep each numerical token in source order and force an LTR visual island.
 const rx=/[۰-۹٠-٩0-9]+(?:[\s\u200c]*(?:[\/٫.,:٪%+\-–—])[\s\u200c]*[۰-۹٠-٩0-9]+)*/g;
 for(const n of nodes){
   const text=n.nodeValue;let last=0,m,changed=false;const frag=document.createDocumentFragment();
   while((m=rx.exec(text))){
     changed=true;
     if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
     const span=document.createElement('span');
     span.className='k961num';
     span.dir='ltr';
     span.textContent=k961NormDigits(m[0]);
     frag.appendChild(span);
     last=m.index+m[0].length;
     if(!m[0].length)rx.lastIndex++;
   }
   if(changed){
     if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
     n.replaceWith(frag);
   }
 }
}


function k962ReverseDigits(s){return String(s||'').split('').reverse().join('')}

function k962ArticleHeadingInfo(el){
 const raw=String(el?.textContent||'').replace(/\s+/g,' ').trim();
 const en=k961FaToEn(raw);
 const m=en.match(/^([«»()\[\]\s\-–—]*ماده\s*[-–—:]?\s*)([0-9]{1,4})(?![0-9])/);
 if(!m)return null;
 return {el,prefix:m[1],digits:m[2],value:Number(m[2]),revValue:Number(k962ReverseDigits(m[2]))};
}

function k962FixArticleNumberOrder(full){
 if(!full)return;
 const blocks=[...full.children];
 let prev=null;
 for(const el of blocks){
   const raw=k970ArticleNumberFromBlock(el);
   if(!raw)continue;
   let val=Number(raw),rev=Number(raw.split('').reverse().join('')),chosen=val;
   if(raw.length===2){
     if(prev!==null){
       const rawCost=Math.abs(val-(prev+1));
       const revCost=Math.abs(rev-(prev+1));
       if(revCost<rawCost)chosen=rev;
     }else if(val>=50&&rev>=1&&rev<=49){
       chosen=rev;
     }
   }
   if(chosen!==val)k970CorrectArticleHeading(el,String(chosen));
   prev=chosen;
 }
}
function k961ArticleHeadingNumber(el){
 const t=k961FaToEn(String(el?.textContent||'').replace(/\s+/g,' ').trim());
 // Strong heading test: article designation must be at/near the beginning of the block.
 const m=t.match(/^[«»()\[\]\s\-–—]*ماده\s*[-–—:]?\s*([0-9]{1,4})(?![0-9])/);
 return m?String(Number(m[1])):'';
}


/* ---------- 0.9.7.2 — Legal-number repair for already stored DOCX structures ---------- */
function k972RepairLegalNumberRuns(root){
 if(!root)return;
 const rx=/((?:ماده|تبصره|بند|جزء)\s*[\.:‌\-–—]?\s*)([۰-۹٠-٩0-9](?:\s+[۰-۹٠-٩0-9]){1,3})/g;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
   acceptNode:n=>/(?:ماده|تبصره|بند|جزء)/.test(n.nodeValue||'')&&/[۰-۹٠-٩0-9]/.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
 });
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){
   n.nodeValue=String(n.nodeValue||'').replace(rx,(_,p,d)=>p+d.replace(/\s+/g,''));
 }
}

function k962ArticleTargetNumber(article){
 const en=k961FaToEn(String(article||''));
 const m=en.match(/[0-9]{1,4}/);
 return m?String(Number(m[0])):'';
}
function k970ArticleNumberFromBlock(el){
 const text=k961FaToEn(String(el?.textContent||'').replace(/[\u200c\u200d\u200e\u200f\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim());
 const m=text.match(/^[«»()\[\]\s\-–—]*ماده\s*[-–—:]?\s*([0-9]{1,4})(?![0-9])/);
 return m?m[1]:'';
}
function k970CorrectArticleHeading(el,target){
 if(!el||!target)return;
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){
   const raw=n.nodeValue||'',en=k961FaToEn(raw);
   if(!/ماده\s*[-–—:]?\s*[0-9]{1,4}/.test(en))continue;
   n.nodeValue=raw.replace(/(ماده\s*[-–—:]?\s*)[۰-۹٠-٩0-9]{1,4}/,(_,p)=>p+k961NormDigits(target));
   return;
 }
}
function k961FindArticleInsertionPoint(full,article){
 const target=k962ArticleTargetNumber(article);
 if(!target)return null;
 const blocks=[...full.children];
 let start=-1;
 for(let i=0;i<blocks.length;i++){
   const raw=k970ArticleNumberFromBlock(blocks[i]);
   if(!raw)continue;
   const rev=raw.split('').reverse().join('');
   if(String(Number(raw))===target||String(Number(rev))===target){
     start=i;
     if(String(Number(raw))!==target)k970CorrectArticleHeading(blocks[i],target);
     break;
   }
 }
 if(start<0)return null;
 for(let i=start+1;i<blocks.length;i++){
   const n=k970ArticleNumberFromBlock(blocks[i]);
   if(n)return blocks[i];
 }
 return null;
}

function k961StructureLines(structure){
 const out=[];
 const push=x=>{const t=String(x||'').replace(/\s+/g,' ').trim();if(t)out.push(t)};
 for(const b of (structure?.blocks||[])){
   if(b.type==='paragraph')push(b.text);
   else if(b.type==='table'){
     for(const row of (b.rows||[])){
       for(const c of (row||[])){
         if(Array.isArray(c.paragraphs)&&c.paragraphs.length)c.paragraphs.forEach(push);
         else push(c.text);
       }
     }
   }else if(b.type==='mathFraction')push(`${b.numerator||''}/${b.denominator||''}`);
 }
 return out;
}

const k961StopWords=new Set([
 'یک','بند','ماده','مصوبه','اضافه','افزوده','شود','شد','شده','در','خصوص','به','از','و','با','عنوان',
 'تحت','الحاق','الحاقی','اصلاح','اصلاحی','جایگزین','گردد','می','گردد','شماره','متن','تبصره','این','آن'
]);

function k961Keywords(item,rel){
 let s=String(item?.description||rel?.note||'');
 s=s.replace(/[«»"']/g,' ').replace(/[۰-۹٠-٩0-9]+/g,' ');
 const after=s.match(/(?:در\s+خصوص|با\s+عنوان|تحت\s+عنوان)\s+(.+)$/)?.[1];
 if(after)s=after;
 return [...new Set(s.split(/[\s،؛:()\-–—.]+/).map(x=>x.trim()).filter(x=>x.length>1&&!k961StopWords.has(x)))];
}

function k961IsDirectiveLine(t){
 return /(الحاق|اضافه\s*(?:می\s*)?(?:شود|گردد)|اصلاح\s*(?:می\s*)?(?:شود|گردد)|جایگزین\s*(?:می\s*)?(?:شود|گردد)|مصوبه\s*شماره|ماده\s*[۰-۹٠-٩0-9]+\s*مصوبه)/.test(t);
}
function k961LooksBoundary(t){
 return /^(?:ماده|تبصره)\s*[۰-۹٠-٩0-9]+/.test(t) ||
        /^(?:رئیس|دبیر|امضاء|امضا|شماره\s*مصوبه|تاریخ\s*مصوبه)/.test(t);
}

/* ---------- 0.9.7.5 — structural legal amendment extraction ---------- */
function k975Norm(s){return String(s||'').replace(/[\u200c\u200d\u200e\u200f\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim()}
function k975En(s){return k961FaToEn(k975Norm(s))}
function k975IsRole(t){
 return /^(?:رئیس|رییس|دبیر|نایب رئیس|نائب رئیس|معاون|مدیر|سرپرست|امضاء|امضا|شماره\s*مصوبه|تاریخ\s*مصوبه)/.test(k975Norm(t));
}
function k975IsProbableSigner(lines,i){
 const cur=k975Norm(lines[i]),next=k975Norm(lines[i+1]);
 if(!cur||cur.length>70)return false;
 if(k975IsRole(cur))return true;
 return !!next&&k975IsRole(next)&&!/^(?:ماده|تبصره|بند|جزء|متن\s+مصوبه)/.test(cur);
}
function k975IsIntro(t){
 const x=k975Norm(t);
 return /^(?:مقدمه|عنوان|موضوع|متن\s+مقدمه|دلایل|شرح\s+موضوع|پیشگفتار)\s*[:：]?$/.test(x) ||
        /^(?:به\s+منظور|با\s+توجه\s+به|نظر\s+به|در\s+راستای|پیرو|احتراماً|احتراما)\b/.test(x);
}
function k975LegalMarker(t){
 const x=k975En(t);
 let m=x.match(/^ماده\s*[-–—:.：]?\s*([0-9]{1,4})(?![0-9])/);
 if(m)return{kind:'article',no:String(Number(m[1]))};
 if(/^ماده\s+واحده\b/.test(x))return{kind:'single',no:'single'};
 m=x.match(/^تبصره\s*[-–—:.：]?\s*([0-9]{1,4})(?![0-9])/);
 if(m)return{kind:'note',no:String(Number(m[1]))};
 m=x.match(/^بند\s*[-–—:.：]?\s*([0-9]{1,4}|[الف-یآ-ی])(?![0-9])/);
 if(m)return{kind:'clause',no:m[1]};
 m=x.match(/^جزء\s*[-–—:.：]?\s*([0-9]{1,4})(?![0-9])/);
 if(m)return{kind:'part',no:String(Number(m[1]))};
 return null;
}
function k975BodyLines(lines){
 const clean=lines.map(k975Norm).filter(Boolean);
 let start=-1;
 for(let i=0;i<clean.length;i++)if(/^متن\s+مصوبه\s*[:：]?$/.test(clean[i])){start=i+1;break}
 if(start<0){
   for(let i=0;i<clean.length;i++)if(k975LegalMarker(clean[i])){start=i;break}
 }
 if(start<0)start=0;
 const out=[];
 for(let i=start;i<clean.length;i++){
   if(k975IsRole(clean[i])||k975IsProbableSigner(clean,i))break;
   if(/^[۰-۹٠-٩0-9\s\/.\-]{1,24}$/.test(clean[i]))continue;
   out.push(clean[i]);
 }
 return out;
}
function k975Keywords(item,rel){
 const s=String(item?.description||rel?.note||'')
   .replace(/[«»"']/g,' ').replace(/[۰-۹٠-٩0-9]+/g,' ');
 return [...new Set(s.split(/[\s،؛:()\-–—.]+/).map(x=>x.trim()).filter(x=>x.length>1&&!k961StopWords.has(x)))];
}
function k975FindDirective(body,item,rel){
 const keys=k975Keywords(item,rel);
 let best=-1,scoreBest=-999;
 for(let i=0;i<body.length;i++){
   const t=body[i];let score=0;
   for(const k of keys)if(t.includes(k))score+=4;
   if(k961IsDirectiveLine(t))score+=8;
   if(k975IsIntro(t))score-=30;
   if(score>scoreBest){scoreBest=score;best=i}
 }
 return scoreBest>0?best:-1;
}


function k983CanonAdmin(text){
 let t=k975Norm(text)
  .replace(/م\s*ص\s*و\s*ب\s*ه/g,'مصوبه')
  .replace(/ا\s*ص\s*ل\s*ا\s*ح\s*ی\s*ه/g,'اصلاحیه')
  .replace(/ا\s*ل\s*ح\s*ا\s*ق\s*ی\s*ه/g,'الحاقیه')
  .replace(/م\s*ا\s*د\s*ه\s+و\s*ا\s*ح\s*د\s*ه/g,'ماده واحده');
 return k975Norm(t);
}
function k983IsAdminHeading(text){
 const t=k983CanonAdmin(text);
 return /^(?:متن\s+(?:مصوبه|اصلاحیه|الحاقیه)|ماده\s+واحده|عنوان|موضوع)\s*[:：\-–—]*\s*$/.test(t) ||
        /^(?:در\s+خصوص|در\s+مورد|موضوع\s*:|عنوان\s*:)\s+.{0,120}$/.test(t);
}
function k982StripAmendmentAdminPrefix(text){
 let t=k983CanonAdmin(text);
 t=t.replace(/^\s*متن\s+(?:مصوبه|الحاقیه|اصلاحیه)\s*[:：\-–—]*\s*/,'');
 // Preserve substantive text if it is on the same line after "ماده واحده:".
 t=t.replace(/^\s*ماده\s+واحده\s*[:：\-–—]+\s*/,'');
 return k975Norm(t);
}
function k983SingleArticleTail(text){
 const t=k983CanonAdmin(text);
 const m=t.match(/^\s*ماده\s+واحده\s*[:：\-–—]+\s*(.+)$/);
 return m?k975Norm(m[1]):'';
}
function k983SubstantiveScore(t,targetArticle=''){
 const x=k983CanonAdmin(t);let score=0;
 if(!x||k983IsAdminHeading(x)||k975IsIntro(x))return-100;
 if(k975LegalMarker(x)?.kind==='article')score+=18;
 if(k975LegalMarker(x)?.kind==='note'||k975LegalMarker(x)?.kind==='clause'||k975LegalMarker(x)?.kind==='part')score+=12;
 if(targetArticle&&new RegExp(`ماده\\s*${targetArticle}(?![۰-۹٠-٩0-9])`).test(k975En(x)))score+=10;
 if(/(?:الحاق|اضافه|اصلاح|جایگزین).*(?:می\s*شود|می\s*گردد|گردد|شود)/.test(x))score+=5;
 if(/[؛:.]/.test(x)&&x.length>35)score+=3;
 if(x.length>25)score+=2;
 return score;
}



function k985IsTargetLocatorDirective(text,targetArticle=''){
 const x=k983CanonAdmin(text),en=k975En(x);
 const hasTarget=!targetArticle||new RegExp(`^ماده\\s*${targetArticle}(?![0-9])`).test(en);
 return hasTarget && (
   /مصوبه\s*(?:شماره)?/i.test(x) ||
   /(?:الحاق|اضافه|اصلاح|جایگزین).*(?:می\s*شود|می\s*گردد|گردید|گردد|شود)/.test(x) ||
   /به\s+شرح\s+(?:ذیل|زیر)/.test(x)
 );
}
function k985NextPayloadIndex(body,from){
 for(let i=from+1;i<body.length;i++){
   const x=body[i];
   if(k983IsAdminHeading(x)||k975IsIntro(x))continue;
   if(k975IsRole(x)||k975IsProbableSigner(body,i))return-1;
   // The line that merely says "در خصوص..." or another locator is still not substantive.
   if(/^(?:در\s+خصوص|در\s+مورد)\b/.test(k983CanonAdmin(x)))continue;
   if(k961IsDirectiveLine(x)&&!k975LegalMarker(x))continue;
   return i;
 }
 return-1;
}
function k975ExtractAmendmentRange(lines,item,rel){
 const raw=(lines||[]).map(k983CanonAdmin).filter(Boolean);
 const targetArticle=k962ArticleTargetNumber(item?.article||rel?.targetArticle||'');
 const changeType=k975Norm(rel?.changeType||'');
 const description=k975Norm(item?.description||rel?.note||'');
 const replacement=/(جایگزین|جایگزینی|اصلاح\s*متن|تغییر\s*متن|متن\s*جدید|به\s*شرح\s*زیر\s*اصلاح)/.test(changeType+' '+description);
 if(!raw.length)return{lines:[],mode:replacement?'replace':'append'};

 // Start after a normalized "متن مصوبه / اصلاحیه / الحاقیه" heading when available.
 let bodyStart=0;
 const textHeading=raw.findIndex(x=>/^\s*متن\s+(?:مصوبه|اصلاحیه|الحاقیه)\s*[:：\-–—]*\s*$/.test(x));
 if(textHeading>=0)bodyStart=textHeading+1;

 // If "ماده واحده: substantive text" is on one line, keep its tail as a candidate.
 let inlineTail='',singleIndex=-1;
 for(let i=bodyStart;i<raw.length;i++){
   const tail=k983SingleArticleTail(raw[i]);
   if(tail){inlineTail=tail;singleIndex=i;break}
   if(k975LegalMarker(raw[i])?.kind==='single'){singleIndex=i;break}
 }

 const body=raw.slice(bodyStart);
 let start=-1;

 // A concrete target article heading is strongest.
 if(targetArticle){
   for(let i=0;i<body.length;i++){
     const m=k975LegalMarker(body[i]);
     if(m?.kind==='article'&&m.no===targetArticle){
       start=k985IsTargetLocatorDirective(body[i],targetArticle)?k985NextPayloadIndex(body,i):i;
       break;
     }
   }
 }

 // Next prefer the legal operation referring to the target article, then move to its substantive payload.
 if(start<0){
   let directive=-1,best=-999;
   for(let i=0;i<body.length;i++){
     const x=body[i];
     let s=k983SubstantiveScore(x,targetArticle);
     if(k961IsDirectiveLine(x))s+=12;
     if(targetArticle&&new RegExp(`ماده\\s*${targetArticle}(?![0-9])`).test(k975En(x)))s+=12;
     if(s>best){best=s;directive=i}
   }
   if(directive>=0&&best>4){
     // If the directive itself is an article/clause text, keep it. Otherwise begin at next true payload line.
     const dm=k975LegalMarker(body[directive]);
     if(dm&&dm.kind!=='single')start=directive;
     else{
       for(let i=directive+1;i<body.length;i++){
         if(k983IsAdminHeading(body[i])||k975IsIntro(body[i])||k961IsDirectiveLine(body[i]))continue;
         if(k975IsRole(body[i])||k975IsProbableSigner(body,i))break;
         start=i;break;
       }
     }
   }
 }

 // Single-article fallback. A same-line tail is substantive and must not be lost.
 if(start<0&&singleIndex>=0){
   const local=singleIndex-bodyStart;
   if(inlineTail){
     body.splice(local,1,inlineTail);
     start=local;
   }else{
     for(let i=local+1;i<body.length;i++){
       if(k983IsAdminHeading(body[i])||k975IsIntro(body[i])||k961IsDirectiveLine(body[i]))continue;
       if(k975IsRole(body[i])||k975IsProbableSigner(body,i))break;
       start=i;break;
     }
   }
 }

 // Last safe fallback: first substantive line after body heading, never preamble/title.
 if(start<0){
   for(let i=0;i<body.length;i++){
     if(k983IsAdminHeading(body[i])||k975IsIntro(body[i])||k961IsDirectiveLine(body[i]))continue;
     if(k975IsRole(body[i])||k975IsProbableSigner(body,i))break;
     if(k983SubstantiveScore(body[i],targetArticle)>0){start=i;break}
   }
 }
 if(start<0)return{lines:[],mode:replacement?'replace':'append'};

 const picked=[];
 for(let i=start;i<body.length;i++){
   let text=body[i];
   if(k975IsRole(text)||k975IsProbableSigner(body,i))break;
   if(k983IsAdminHeading(text)||k975IsIntro(text))continue;
   if(k985IsTargetLocatorDirective(text,targetArticle)){
     if(!picked.length)continue;
     break;
   }
   if(/^[۰-۹٠-٩0-9\s\/.\-]{1,24}$/.test(text))continue;

   const marker=k975LegalMarker(text);
   if(i>start&&marker?.kind==='article')break;
   if(i>start&&picked.length&&k961IsDirectiveLine(text))break;

   text=k982StripAmendmentAdminPrefix(text);
   if(!text||k983IsAdminHeading(text))continue;
   picked.push(text);
 }
 return{lines:picked,mode:replacement?'replace':'append'};
}

function k961PickExactAmendmentLines(lines,item,rel){
 return k975ExtractAmendmentRange(lines,item,rel).lines;
}
async function k961SourceLines(documentId){
 try{
   const d=await api('/api/v1/knowledge/document-structure?documentId='+encodeURIComponent(documentId));
   const lines=k961StructureLines(d.structure);
   if(lines.length)return lines;
 }catch{}
 try{
   const d=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(documentId)+'&detail=1');
   const x=(d.items||[])[0]||{};
   return String(x.fullText||'').split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
 }catch{return[]}
}



function k990LooksLikeNextArticleTitle(el){
 const text=k975Norm(el?.innerText||el?.textContent||'');
 if(!text||text.length<2||text.length>90)return false;
 if(k975LegalMarker(text))return false;
 if(/[.!؟؛:：]/.test(text))return false;
 if(/^[۰-۹٠-٩0-9\s()[\]\/.,٪%+\-–—]+$/.test(text))return false;
 const words=text.split(/\s+/).filter(Boolean);
 if(words.length>12)return false;
 return true;
}
function k990ArticleEndBeforeNextTitle(blocks,nextArticleIndex){
 if(nextArticleIndex<=0)return nextArticleIndex;
 const candidate=blocks[nextArticleIndex-1];
 return k990LooksLikeNextArticleTitle(candidate)?nextArticleIndex-1:nextArticleIndex;
}

function k975ArticleRange(full,article){
 const target=k962ArticleTargetNumber(article);
 if(!target)return null;
 const blocks=[...full.children];
 let start=-1,end=blocks.length;
 for(let i=0;i<blocks.length;i++){
   const raw=k970ArticleNumberFromBlock(blocks[i]);
   if(!raw)continue;
   const rev=raw.split('').reverse().join('');
   if(start<0&&(String(Number(raw))===target||String(Number(rev))===target)){
     start=i;continue;
   }
   if(start>=0){end=k990ArticleEndBeforeNextTitle(blocks,i);break}
 }
 if(start<0)return null;
 return{blocks,start,end,before:blocks[end]||null};
}
function k975ApplyNode(full,article,node,mode){
 const range=k975ArticleRange(full,article);
 if(!range){
   // A legal amendment may create a brand-new article (e.g. Article 27 after an original 26-article act).
   // In that case there is no target node to insert before. Append only when the requested article
   // is numerically after the current last article, so a typo targeting an old missing article is not hidden.
   const target=Number(k962ArticleTargetNumber(article)||0);
   const nums=[...full.children].map(k970ArticleNumberFromBlock).filter(Boolean).map(x=>Number(x)).filter(Number.isFinite);
   const max=nums.length?Math.max(...nums):0;
   if(mode==='append'&&target>0&&target>max){
     full.appendChild(node);
     node.classList.add('k975addition','k984newarticle');
     node.dataset.newArticle=String(target);
     return true;
   }
   return false;
 }
 if(mode==='replace'){
   // Effective view: remove the old article and all of its dependent provisos/clauses,
   // then put the amended legal text at exactly the same location.
   for(let i=range.start;i<range.end;i++){
     const el=range.blocks[i];
     if(el&&el.parentNode===full)el.remove();
   }
   if(range.before&&range.before.parentNode===full)full.insertBefore(node,range.before);
   else full.appendChild(node);
   node.classList.add('k975replacement');
 }else{
   if(range.before&&range.before.parentNode===full)full.insertBefore(node,range.before);
   else full.appendChild(node);
   node.classList.add('k975addition');
 }
 return true;
}

function k961InlineText(rel,item,lines){
 const sourceId=rel.relatedDocument?.id||'';
 const sourceTitle=rel.relatedDocument?.title||'سند اصلاحی';
 lines=(lines||[]).map(k982StripAmendmentAdminPrefix).filter((t,i,a)=>t&&!k983IsAdminHeading(t)&&!k975IsIntro(t)&&!k975IsRole(t)&&!k975IsProbableSigner(a,i));
 const wrap=document.createElement('div');
 wrap.className='k961inline-change';
 wrap.dataset.relationId=rel.id||'';

 const body=document.createElement('div');
 body.className='k961inline-change-text';
 for(const t of lines){
   const p=document.createElement('p');
   p.textContent=k961NormDigits(t);
   body.appendChild(p);
 }
 wrap.appendChild(body);

 // Tiny provenance link only; no card/header/badge.
 if(sourceId){
   const a=document.createElement('button');
   a.type='button';a.className='k961inline-source';a.dataset.amendSource=sourceId;
   a.textContent=`↗ ${sourceTitle}`;
   wrap.appendChild(a);
 }
 return wrap;
}

function k992TextHasArticle(text,article){
 const n=k962ArticleTargetNumber(article);if(!n)return false;
 const en=k975En(text);return new RegExp(`ماده\\s*[-–—:.：]?\\s*${n}(?![0-9])`).test(en);
}
function k992LooksLikeAmendmentSource(lines,article){
 const joined=(lines||[]).map(k983CanonAdmin).join(' '),hasArticle=!article||k992TextHasArticle(joined,article);
 return hasArticle&&/(اصلاح|الحاق|اضافه|جایگزین|تبصره|ماده\\s+واحده)/.test(joined);
}
function k992FallbackPayload(lines,item,rel){
 const raw=(lines||[]).map(k983CanonAdmin).filter(Boolean),article=item?.article||rel?.targetArticle||'';
 let idx=-1;
 for(let i=0;i<raw.length;i++){
   const x=raw[i];if(k992TextHasArticle(x,article)&&/(اصلاح|الحاق|اضافه|جایگزین|به\\s+شرح|تبصره)/.test(x)){idx=i;break}
 }
 if(idx<0)idx=raw.findIndex(x=>k992TextHasArticle(x,article));
 if(idx<0)return[];
 const out=[];
 for(let i=idx+1;i<raw.length&&out.length<8;i++){
   let x=raw[i];if(k975IsRole(x)||k975IsProbableSigner(raw,i))break;
   if(k983IsAdminHeading(x)||k975IsIntro(x))continue;
   const marker=k975LegalMarker(x);if(marker?.kind==='article')break;
   if(k961IsDirectiveLine(x)&&!marker)continue;
   x=k982StripAmendmentAdminPrefix(x);if(!x)continue;out.push(x);
 }
 return out;
}
function k992ArticleRangeFallback(full,article){
 const n=k962ArticleTargetNumber(article);if(!n)return null;const blocks=[...full.children];let start=-1,end=blocks.length;
 for(let i=0;i<blocks.length;i++){
   const t=blocks[i].innerText||blocks[i].textContent||'';
   if(start<0&&k992TextHasArticle(t,n)){start=i;continue}
   if(start>=0&&/^\\s*ماده\\s*[۰-۹٠-٩0-9]+/.test(k975Norm(t))){end=k990ArticleEndBeforeNextTitle(blocks,i);break}
 }
 return start<0?null:{blocks,start,end,before:blocks[end]||null};
}
function k992ApplyNode(full,article,node,mode){
 if(k975ApplyNode(full,article,node,mode))return true;
 const range=k992ArticleRangeFallback(full,article);if(!range)return false;
 if(mode==='replace'){
  for(let i=range.start;i<range.end;i++){const el=range.blocks[i];if(el?.parentNode===full)el.remove()}
  if(range.before?.parentNode===full)full.insertBefore(node,range.before);else full.appendChild(node);node.classList.add('k975replacement');
 }else{
  if(range.before?.parentNode===full)full.insertBefore(node,range.before);else full.appendChild(node);node.classList.add('k975addition');
 }
 return true;
}


function k994SourceProfile(lines,rel){
 const clean=(lines||[]).map(k983CanonAdmin).filter(Boolean);
 let articles=0,clauses=0,substantive=0,chars=0;
 for(const x of clean){
   chars+=x.length;
   const m=k975LegalMarker(x);
   if(m?.kind==='article')articles++;
   else if(m?.kind)clauses++;
   if(!k983IsAdminHeading(x)&&!k975IsIntro(x)&&!k975IsRole(x))substantive++;
 }
 const title=String(rel?.relatedDocument?.title||'');
 const joined=(title+' '+clean.slice(0,16).join(' ')).replace(/\s+/g,' ');
 const instructionLike=/(دستورالعمل|شیوه[\s‌-]*نامه|آیین[\s‌-]*نامه اجرایی|راهنمای اجرایی|ضوابط اجرایی|روش اجرایی)/.test(joined);
 const complexInstruction=instructionLike&&(articles>=2||substantive>=10||chars>=900);
 const veryLargeLegalBody=articles>=6||chars>=5000;
 return{articles,clauses,substantive,chars,instructionLike,referenceOnly:complexInstruction||veryLargeLegalBody};
}
function k994ReferenceNode(rel,article,profile){
 const sourceId=rel.relatedDocument?.id||'',title=rel.relatedDocument?.title||'سند مرتبط';
 const wrap=document.createElement('div');
 wrap.className='k994linked-instrument';
 wrap.dataset.relationId=rel.id||'';
 const label=profile?.instructionLike?'دستورالعمل مصوب':'سند اجرایی/تفصیلی';
 wrap.innerHTML=`<span>↗</span><div><b>این ماده دارای ${label} است.</b><small>متن کامل سند به دلیل تفصیلی بودن در همین محل درج نشده است.</small></div>${sourceId?`<button type="button" data-amend-source="${k955Esc(sourceId)}">${k955Esc(title)}</button>`:''}`;
 return wrap;
}


function k990RelationVisual(rel){
 const t=rel?.relationType||'';
 return {
  amends:{label:'اصلاحیه',cls:'k990-amend'},
  extends:{label:'الحاقیه',cls:'k990-addendum'},
  repeals:{label:'ملغی',cls:'k990-repeal'},
  clarifies:{label:'استفسار',cls:'k990-interpret'}
 }[t]||{label:'اثر حقوقی',cls:'k990-legal'};
}
function k990ExplicitNode(rel,item){
 const text=String(item?.description||rel?.note||'').trim();if(!text)return null;
 const v=k990RelationVisual(rel),wrap=document.createElement('div');
 wrap.className=`k990-explicit-change ${v.cls}`;wrap.dataset.relationId=rel.id||'';
 const loc=[item?.article?`ماده ${item.article}`:'',item?.clause||''].filter(Boolean).join(' · ');
 wrap.innerHTML=`<div class="k990-explicit-head"><b>${v.label}${loc?` — ${k955Esc(loc)}`:''}</b><span>ثبت‌شده به‌عنوان اثر حقوقی صریح</span></div><div class="k990-explicit-text"></div>${rel.relatedDocument?.id?`<button type="button" class="k961inline-source" data-amend-source="${k955Esc(rel.relatedDocument.id)}">↗ ${k955Esc(rel.relatedDocument.title||'سند مرتبط')}</button>`:''}`;
 const body=wrap.querySelector('.k990-explicit-text');
 for(const line of text.split(/\n+/).map(x=>x.trim()).filter(Boolean)){const p=document.createElement('p');p.textContent=line;body.appendChild(p)}
 return wrap;
}
function k990ClauseSpec(raw){
 const s=k975En(String(raw||'').replace(/\u200c/g,' ').trim());
 if(!s)return null;
 let m=s.match(/تبصره\s*[-–—:.：]?\s*([0-9]+)/);if(m)return{kind:'note',no:String(Number(m[1]))};
 m=s.match(/بند\s*[-–—:.：]?\s*([0-9]+|[الف-یآ])/);if(m)return{kind:'clause',no:m[1]};
 m=s.match(/جزء\s*[-–—:.：]?\s*([0-9]+)/);if(m)return{kind:'part',no:String(Number(m[1]))};
 if(/^[0-9]+$/.test(s))return{kind:'note',no:String(Number(s))};
 return{kind:'text',no:s};
}
function k990BlockMarker(el){
 const t=k975Norm(el?.innerText||el?.textContent||'');
 return k975LegalMarker(t);
}

function k990ArticleNumber(raw){
 const x=k975En(String(raw||''));
 const m=x.match(/(?:ماده\s*)?([0-9]{1,4})/);
 return m?Number(m[1]):null;
}
function k990OriginalArticleNumbers(full){
 const nums=[];
 for(const el of [...full.children]){
   if(el.dataset?.k990AppendedArticle)continue;
   const mk=k990BlockMarker(el);
   if(mk?.kind==='article'&&/^\d+$/.test(String(mk.no)))nums.push(Number(mk.no));
 }
 return nums;
}
function k990AppendNewArticle(full,item,node,rel){
 const target=k990ArticleNumber(item?.article||rel?.targetArticle||'');
 if(!Number.isFinite(target))return false;

 const originalNums=k990OriginalArticleNumbers(full);
 const originalMax=originalNums.length?Math.max(...originalNums):0;

 // Only an addendum may create a brand-new numbered article beyond the original last article.
 // An amendment/repeal/interpretation that points to a non-existing article is still treated as an error.
 if(rel?.relationType!=='extends'||target<=originalMax)return false;

 node.dataset.k990AppendedArticle=String(target);
 node.classList.add('k990-new-article');
 const title=document.createElement('div');
 title.className='k990-new-article-title';
 title.textContent=`ماده ${target} — الحاقی`;
 node.prepend(title);

 // Keep newly-added articles in numeric order even if relations arrive out of order
 // (e.g. article 27 is loaded before article 26).
 const appended=[...full.children].filter(x=>x.dataset?.k990AppendedArticle);
 const next=appended.find(x=>Number(x.dataset.k990AppendedArticle)>target);
 if(next)full.insertBefore(node,next);
 else full.appendChild(node);

 node.classList.add('k990-located','k990-appended-after-last-article');
 return true;
}

function k990ApplyAtLocator(full,item,node,rel){
 const article=item?.article||'';
 const range=k975ArticleRange(full,article)||k992ArticleRangeFallback(full,article);
 if(!range){
   // If the requested article number is greater than the last original article and this is
   // an addendum, it represents a new article and belongs at the legal end of the document.
   return k990AppendNewArticle(full,item,node,rel);
 }
 const spec=k990ClauseSpec(item?.clause||'');
 if(!spec)return k992ApplyNode(full,article,node,'append');

 const blocks=range.blocks;let hit=-1;
 for(let i=range.start;i<range.end;i++){
   const text=k975Norm(blocks[i]?.innerText||blocks[i]?.textContent||'');
   const mk=k990BlockMarker(blocks[i]);
   if(spec.kind==='text'){
     if(k975En(text).startsWith(spec.no)){hit=i;break}
   }else if(mk?.kind===spec.kind&&String(mk.no)===String(spec.no)){hit=i;break}
 }
 if(hit<0){
   console.warn('LEGAL_TARGET_CLAUSE_NOT_FOUND',{article,clause:item?.clause});
   return false; // do not silently attach to the wrong place
 }
 let before=range.before||null;
 for(let i=hit+1;i<range.end;i++){
   const mk=k990BlockMarker(blocks[i]);
   if(mk && ['note','clause','part','article'].includes(mk.kind)){before=blocks[i];break}
 }
 if(before?.parentNode===full)full.insertBefore(node,before);else full.appendChild(node);
 node.classList.add('k990-located');
 return true;
}
async function k961ApplyInlineAmendments(full,id){
 if(!full||!id||full.dataset.k961Amendments==='loading'||full.dataset.k961Amendments==='1')return;
 full.dataset.k961Amendments='loading';
 try{
   const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(id));
   // Consolidation is rendered ONLY on the legal target (mother document).
   // A relation source is the amendment document and target is the document being amended.
   // Never apply the mother document text back into the amendment document.
   const incoming=(d.items||[]).filter(r=>
     r.targetDocumentRef===id &&
     ['amends','supersedes','extends','clarifies','implements'].includes(r.relationType) &&
     ['amended_by','superseded_by','extended_by','clarified_by','implemented_by'].includes(r.perspectiveType)
   );
   for(const rel of incoming){
     const sourceId=rel.relatedDocument?.id||'';
     if(!sourceId)continue;
     const sourceLines=await k961SourceLines(sourceId);
     const profile=k994SourceProfile(sourceLines,rel);
     const items=Array.isArray(rel.changeItems)&&rel.changeItems.length
       ?rel.changeItems:[{article:rel.targetArticle,clause:rel.targetClause,description:rel.note}];
     const linkedArticles=new Set();
     for(const item of items){
       const article=item?.article||rel.targetArticle||'';
       if(!article)continue;

       // Detailed independent instruments remain reference-only.
       if(profile.referenceOnly||rel.relationType==='implements'){
         const key=String(k962ArticleTargetNumber(article)||article);
         if(linkedArticles.has(key))continue;
         linkedArticles.add(key);
         const node=k994ReferenceNode(rel,article,profile);
         if(!k992ApplyNode(full,article,node,'append')){
           console.warn('LINKED_INSTRUMENT_TARGET_NOT_FOUND',{article,relationId:rel.id,sourceId});
         }
         continue;
       }

       // For amendment/addendum/repeal/interpretation the user-entered legal text is authoritative.
       // No semantic guessing/extraction is performed when explicit text exists.
       const explicit=k990ExplicitNode(rel,item);
       if(explicit){
         if(!k990ApplyAtLocator(full,item,explicit,rel)){
           console.warn('EXPLICIT_LEGAL_TARGET_NOT_FOUND',{article,clause:item?.clause,relationId:rel.id});
         }
         continue;
       }

       // Legacy records without explicit text keep the old extraction fallback.
       const extraction=k975ExtractAmendmentRange(sourceLines,item,rel);
       let exact=extraction.lines;
       if(!exact.length)exact=k992FallbackPayload(sourceLines,item,rel);
       if(!exact.length)continue;
       const node=k961InlineText(rel,item,exact);
       if(!k992ApplyNode(full,article,node,extraction.mode)){
         console.warn('INLINE_AMENDMENT_TARGET_NOT_FOUND',{article,relationId:rel.id,mode:extraction.mode});
       }
     }
   }

   full.querySelectorAll('[data-amend-source]').forEach(btn=>{
     if(btn.dataset.k973Bound)return;btn.dataset.k973Bound='1';
     btn.addEventListener('click',e=>{
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
       const docId=btn.dataset.amendSource;
       if(docId&&typeof window.__ORG_OPEN_DOCUMENT__==='function'){
         window.__K951_ACTIVE_DOC_ID=docId;window.__K950_ACTIVE_DOC_ID=docId;window.__K992_ACTIVE_DOC_ID=docId;
         window.__ORG_OPEN_DOCUMENT__(docId,'');
       }else{
         console.warn('AMENDMENT_SOURCE_NAVIGATION_UNAVAILABLE',{docId});
       }
     },true);
   });
   k972RepairLegalNumberRuns(full);
   k962FixArticleNumberOrder(full);
   k961ProtectNumbers(full);
   full.dataset.k961Amendments='1';
 }catch(e){
   console.warn('INLINE_AMENDMENT_VIEW_ERROR',e);
   full.dataset.k961Amendments='0';
 }
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
  k972RepairLegalNumberRuns(full);
  k962FixArticleNumberOrder(full);
  k961ProtectNumbers(full);
  const q=k957CurrentSearchQuery();if(q)k957Highlight(full,q);
  full.dataset.k955Structured='1';
  await k961ApplyInlineAmendments(full,id);
 }catch{
  k956NormalizeDisplayedDigits(full);
  const tw=document.createTreeWalker(full,NodeFilter.SHOW_TEXT),tn=[];while(tw.nextNode())tn.push(tw.currentNode);tn.forEach(n=>n.nodeValue=k957NormPct(n.nodeValue));
  k972RepairLegalNumberRuns(full);
  k962FixArticleNumberOrder(full);
  k961ProtectNumbers(full);
  const q=k957CurrentSearchQuery();if(q)k957Highlight(full,q);
  full.dataset.k955Structured='0';
  await k961ApplyInlineAmendments(full,id);
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
    m.subjectCategory=form.querySelector('input[name="subjectCategory"]')?.value||null;
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
   setTimeout(()=>{release();if(btn.dataset.k958Busy==='1'){btn.dataset.k958Busy='0';btn.disabled=false;btn.textContent='ثبت سند';if(!(st.textContent||'').trim())st.textContent='پاسخ ثبت سند طولانی شد؛ می‌توانید دوباره تلاش کنید.'}o.disconnect()},75000);
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


/* ---------- 0.9.7.2 — Relation history by perspective ---------- */
const K972_PARENT_PERSPECTIVES=new Set(['amended_by','superseded_by','repealed_by','extended_by','clarified_by','implemented_by']);
const K972_CHILD_PERSPECTIVES=new Set(['amends','supersedes','repeals','extends','clarifies','implements']);
const k972RelationTypeFa=t=>({
 amends:'اصلاح',amended_by:'اصلاح',supersedes:'جایگزینی',superseded_by:'جایگزینی',
 repeals:'لغو',repealed_by:'لغو',extends:'الحاق / توسعه',extended_by:'الحاق / توسعه',
 clarifies:'تبیین / استفسار',clarified_by:'تبیین / استفسار',
 implements:'سند اجرایی',implemented_by:'سند اجرایی',related_to:'ارتباط'
}[t]||t||'ارتباط');

function k972ChangeLocation(item,rel){
 const bits=[];
 const article=item?.article||rel?.targetArticle||'';
 const clause=item?.clause||rel?.targetClause||'';
 if(article)bits.push(`ماده ${k961NormDigits(article)}`);
 if(clause)bits.push(`بند/تبصره ${k961NormDigits(clause)}`);
 return bits.join(' · ')||'محل تغییر ثبت نشده';
}
function k972ParentHistoryHtml(rels){
 return `<div class="k972history-list">${rels.map(rel=>{
   const rd=rel.relatedDocument||{},items=Array.isArray(rel.changeItems)&&rel.changeItems.length?rel.changeItems:[{}];
   return `<article class="k972history-item">
    <div class="k972history-head">
      <button type="button" data-doc-preview="${k955Esc(rd.id||'')}">${rd.documentNumber?`مصوبه / سند ${k955Esc(k961NormDigits(rd.documentNumber))} — `:''}${k955Esc(rd.title||'سند مرتبط')}</button>
      <span>${k955Esc(rel.changeType||k972RelationTypeFa(rel.perspectiveType))}</span>
    </div>
    <div class="k972history-changes">${items.map(item=>`
      <div class="k972history-change">
        <div><b>محل تغییر</b><span>${k955Esc(k972ChangeLocation(item,rel))}</span></div>
        <div><b>نوع تغییر</b><span>${k955Esc(rel.changeType||k972RelationTypeFa(rel.perspectiveType))}</span></div>
        <div class="k972history-desc"><b>شرح تغییر</b><span>${k955Esc(item?.description||rel.note||'—')}</span></div>
        ${rel.effectiveFrom?`<div><b>تاریخ اثر</b><span>${k955Esc(k961NormDigits(rel.effectiveFrom))}</span></div>`:''}
      </div>`).join('')}</div>
   </article>`;
 }).join('')}</div>`;
}
function k972ChildRefsHtml(rels){
 return `<div class="k972parentrefs">${rels.map(rel=>{
   const rd=rel.relatedDocument||{};
   return `<button type="button" class="k972parentref" data-doc-preview="${k955Esc(rd.id||'')}">
     <span>سند اصلی</span>
     <b>${rd.documentNumber?`مصوبه / سند ${k955Esc(k961NormDigits(rd.documentNumber))} — `:''}${k955Esc(rd.title||'سند اصلی')}</b>
   </button>`;
 }).join('')}</div>`;
}
async function k972RenderRelationPerspective(modal,id){
 if(!modal||!id)return;
 const box=modal.querySelector('.k944relations');
 if(!box||box.dataset.k972For===id)return;
 box.dataset.k972For=id;
 try{
   const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(id));
   const rels=d.items||[];
   const parent=rels.filter(x=>K972_PARENT_PERSPECTIVES.has(x.perspectiveType));
   const child=rels.filter(x=>K972_CHILD_PERSPECTIVES.has(x.perspectiveType));
   const content=box.querySelector('.k950relcontent')||box.querySelector('.k944rellist')?.parentElement;
   if(!content)return;
   if(parent.length){
     content.innerHTML=k972ParentHistoryHtml(parent);
     const hc=box.querySelector('.k944headcopy');
     if(hc)hc.innerHTML='<small>خط سیر تغییرات سند مادر</small><b>اصلاحات و سوابق سند</b><span>جزئیات ماده، بند/تبصره، نوع و شرح تغییر از اطلاعات ثبت‌شده رابطه نمایش داده می‌شود.</span>';
   }else if(child.length){
     content.innerHTML=k972ChildRefsHtml(child);
     const hc=box.querySelector('.k944headcopy');
     if(hc)hc.innerHTML='<small>ارجاع سند اصلاحی</small><b>سند اصلی</b><span>این سند یک سند اصلاحی/الحاقی است؛ جزئیات تغییر در خود متن سند و در سابقه سند مادر قابل مشاهده است.</span>';
   }
   content.querySelectorAll('[data-doc-preview]').forEach(btn=>btn.addEventListener('click',e=>{
     e.preventDefault();e.stopPropagation();
     const docId=btn.dataset.docPreview;
     if(docId&&window.__ORG_OPEN_DOCUMENT__)window.__ORG_OPEN_DOCUMENT__(docId,'');
   }));
 }catch(e){console.warn('RELATION_PERSPECTIVE_RENDER_ERROR',e)}
}


function k985EnhanceAttachments(form){
 if(!form||form.dataset.k985Attachments)return;form.dataset.k985Attachments='1';
 const file=form.querySelector('.k76file');
 if(!file)return;
 const box=document.createElement('section');box.className='k985attachments k992attachments';
 box.innerHTML=`<div class="k992attachhead"><div><b>پیوست‌های سند</b><small>برای هر پیوست یک فایل انتخاب کنید؛ هر تعداد پیوست که لازم باشد می‌توانید اضافه کنید.</small></div><button type="button" data-k992-add-attachment>＋ افزودن پیوست دیگر</button></div>
 <div data-k992-attachment-rows class="k992attachmentrows"></div>
 <div data-k985-files class="k985filelist">پیوستی انتخاب نشده است.</div>`;
 file.insertAdjacentElement('afterend',box);
 const rows=box.querySelector('[data-k992-attachment-rows]'),list=box.querySelector('[data-k985-files]');
 const renderList=()=>{
   const files=[...box.querySelectorAll('[data-k985-attachment-input]')].flatMap(x=>[...(x.files||[])]);
   list.innerHTML=files.length?files.map((f,i)=>`<span>📎 ${toFa(i+1)}. ${esc(f.name)}</span>`).join(''):'پیوستی انتخاب نشده است.';
 };
 const addRow=()=>{
   const row=document.createElement('div');row.className='k992attachmentrow';
   row.innerHTML=`<label><span>انتخاب فایل پیوست</span><input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-k985-attachment-input></label><button type="button" title="حذف این ردیف" aria-label="حذف پیوست" data-k992-remove-attachment>×</button>`;
   rows.appendChild(row);
   row.querySelector('input').addEventListener('change',renderList);
   row.querySelector('[data-k992-remove-attachment]').onclick=()=>{if(rows.children.length===1){row.querySelector('input').value='';renderList();return}row.remove();renderList()};
 };
 box.querySelector('[data-k992-add-attachment]').onclick=addRow;
 addRow();
}
async function k985FilesPayload(files){return k986DirectBlobRefs(files,'attachment')}
function enhance(){document.querySelectorAll('#k76form').forEach(f=>{enhanceUploadForm(f);k953EnhanceMetadata(f);k955ComposeForm(f);k985EnhanceAttachments(f);k957SimplifyRegisterStatus();k958SubmitGuard(f)});const modal=document.getElementById('k91docmodal');if(modal){collapseRelations(modal.querySelector('.k944relations'));addPopupTools(modal);k955RenderStructuredDoc();const id=window.__K950_ACTIVE_DOC_ID||'';if(id)k972RenderRelationPerspective(modal,id)}}
new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});enhance();
document.addEventListener('k958:document-preview',()=>setTimeout(()=>{try{k955RenderStructuredDoc()}catch{}},30));
/* ---------- 0.9.7.0 — Persian digits in repository/workspace surfaces ---------- */
function k970PersianizeRepositoryDigits(root=document.getElementById('knowledge076')){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
  acceptNode:n=>{
   if(!/[0-9]/.test(n.nodeValue||''))return NodeFilter.FILTER_REJECT;
   if(n.parentElement?.closest('script,style,input,textarea,select,code,pre,.k961num'))return NodeFilter.FILTER_REJECT;
   return NodeFilter.FILTER_ACCEPT;
  }
 });
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>n.nodeValue=String(n.nodeValue||'').replace(/\d/g,d=>FA[d]));
}
let k970RepoScheduled=false;
function k970ScheduleRepoDigits(){
 if(k970RepoScheduled)return;k970RepoScheduled=true;
 requestAnimationFrame(()=>{k970RepoScheduled=false;k970PersianizeRepositoryDigits()});
}
new MutationObserver(k970ScheduleRepoDigits).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('load',k970ScheduleRepoDigits);

})();