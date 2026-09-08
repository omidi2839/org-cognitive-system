(()=>{
window.__DOCUMENT_MEETING_COMMAND_BUILD__='0.9.5.0';
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

function looksDocumentCommand(q){return /(سند|اسناد|مصوبه|آیین.?نامه|بخشنامه|چشم.?انداز|مأموریت|جلسه|صورتجلسه|متن)/i.test(q)}
function parseCommand(s){
 s=String(s||'').trim();const m=s.match(/جلسه\s*(?:شماره)?\s*([۰-۹٠-٩0-9]+)/),meetingNumber=m?.[1]||'';
 let topic=s.replace(/^(لطفا|لطفاً)\s*/,'').replace(/(اسناد|سندهای|سند|مصوبات|مصوبه)\s*(مربوط به|مرتبط با|درباره)?/g,' ').replace(/(رو|را)?\s*(بیار|بیاور|نمایش بده|نشان بده|لیست کن|فهرست کن).*$/,' ').replace(/جلسه\s*(?:شماره)?\s*[۰-۹٠-٩0-9]+/g,' ').replace(/(در|از)\s+(محتوای|متن)\s+/g,' ').replace(/\s+/g,' ').trim();
 return {topic,meetingNumber,asksContent:/(چه گفته|چه آمده|چی گفته|محتوا|متن|درباره.*چه)/i.test(s)}
}
function renderDocCommand(d){
 const out=document.getElementById('commandResult');if(!out)return;out.classList.remove('hidden');const items=d.items||[];
 out.innerHTML=`<div class="k950answer"><div class="k950answerhead"><span>□ جستجوی اسناد سازمان</span><b>${toFa(items.length)} نتیجه</b></div>${items.length?items.map(x=>`<article><button type="button" data-doc-preview="${esc(x.id)}">${esc(x.title||'بدون عنوان')}</button><div class="k950docmeta">${x.documentType?`<span>${esc(x.documentType)}</span>`:''}${x.subjectArea?`<span>موضوع: ${esc(x.subjectArea)}</span>`:''}${x.meetingNumber?`<span>جلسه: ${esc(x.meetingNumber)}</span>`:''}${x.meetingDate?`<span>تاریخ جلسه: ${esc(x.meetingDate)}</span>`:''}</div>${x.excerpt?`<p>${esc(x.excerpt)}</p>`:''}</article>`).join(''):`<div class="k950empty">سندی مطابق این درخواست پیدا نشد.</div>`}<small class="k950notice">پاسخ از بانک اسناد ثبت‌شده تولید شده است؛ برای متن کامل روی عنوان سند کلیک کنید.</small></div>`;out.scrollIntoView({behavior:'smooth',block:'start'})
}
async function handleDocumentCommand(q){
 const p=parseCommand(q),sp=new URLSearchParams();if(p.topic)sp.set('q',p.topic);if(p.meetingNumber)sp.set('meetingNumber',p.meetingNumber);if(p.asksContent)sp.set('includeExcerpt','1');
 const out=document.getElementById('commandResult');if(out){out.classList.remove('hidden');out.innerHTML='<div class="k950loading">در حال جستجو و خواندن بانک اسناد…</div>'}
 try{renderDocCommand(await api('/api/v1/knowledge/document-query?'+sp.toString()))}catch(e){if(out)out.innerHTML=`<div class="k950empty">${esc(e.message)}</div>`}
}
const commandValue=()=>document.getElementById('commandInput')?.value?.trim()||'';
window.addEventListener('click',e=>{const b=e.target?.closest?.('#runCommand'),q=commandValue();if(!b||!q||!looksDocumentCommand(q))return;e.preventDefault();e.stopImmediatePropagation();handleDocumentCommand(q)},true);
window.addEventListener('keydown',e=>{const ta=e.target?.closest?.('#commandInput'),q=commandValue();if(!ta||e.key!=='Enter'||e.shiftKey||!q||!looksDocumentCommand(q))return;e.preventDefault();e.stopImmediatePropagation();handleDocumentCommand(q)},true);

function enhance(){document.querySelectorAll('#k76form').forEach(enhanceUploadForm);const modal=document.getElementById('k91docmodal');if(modal){collapseRelations(modal.querySelector('.k944relations'));addPopupTools(modal)}}
new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});enhance();
})();