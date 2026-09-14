(()=>{
window.__SINA_BULK_INTAKE_BUILD__='0.9.9.2.4';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹';
const fa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,o={})=>{const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':ORG,...(o.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.code||'خطا');return d};
const hashFile=async file=>{const ab=await file.arrayBuffer(),h=await crypto.subtle.digest('SHA-256',ab);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')};
const BULK_SERVER_RAW_BUDGET=2600000;
const bulkSleep=ms=>new Promise(r=>setTimeout(r,ms));
async function bulkBase64(file){
 const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
 for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 return btoa(binary);
}
async function uploadViaFunction(file){
 const rid=`BULK-SRV-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
 return api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({
  title:file.name.replace(/\.(pdf|docx)$/i,''),fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,
  contentBase64:await bulkBase64(file),directUpload:false,transport:'bulk-function-v1',clientRequestId:rid,
  metadata:{documentClass:'unclassified',documentType:'سایر',validityStatus:'unknown',classification:'internal'}
 })});
}
async function directUpload(file){
 // Small/medium bulk files are intentionally sent through the Function payload.
 // This avoids the private-Blob read-after-write race that produced
 // "Vercel Blob object was not found" immediately after a successful browser PUT.
 if(Number(file?.size||0)>0&&Number(file.size)<=BULK_SERVER_RAW_BUDGET){
   return uploadViaFunction(file);
 }
 let last;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const pre=await api('/api/v1/knowledge/blob-upload-url',{method:'POST',body:JSON.stringify({fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,role:'primary'})});
   const put=await fetch(pre.presignedUrl,{method:'PUT',body:file});if(!put.ok)throw Error(`ارسال فایل ناموفق بود (${put.status})`);
   // Give the private Blob object a short propagation window before the server reads it.
   await bulkSleep(900*attempt);
   const rid=`BULK-DIRECT-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
   return await api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({
    title:file.name.replace(/\.(pdf|docx)$/i,''),fileName:file.name,mimeType:file.type||'application/octet-stream',size:file.size,blobUrl:pre.blobUrl,blobPathname:pre.pathname,directUpload:true,transport:'bulk-direct-blob-v3',clientRequestId:rid,
    metadata:{documentClass:'unclassified',documentType:'سایر',validityStatus:'unknown',classification:'internal'}
   })});
  }catch(e){
   last=e;
   if(attempt<3)await bulkSleep(500*attempt);
  }
 }
 throw last||Error('آپلود فایل ناموفق بود.');
}
let rows=[];
function mount(){
 document.getElementById('k9914bulk')?.remove();
 const w=document.createElement('div');w.id='k9914bulk';w.className='k9914overlay';
 w.innerHTML=`<section class="k9914panel"><header><div><small>سینا · پذیرش دسته‌جمعی اسناد</small><h2>ورود دسته‌جمعی اسناد</h2><p>فایل‌ها را یکجا وارد کنید؛ سینا متن، شناسنامه، طبقه‌بندی و احتمال تکرار را بررسی می‌کند.</p></div><button type="button" data-close>×</button></header>
 <div class="k9914steps"><span class="on">۱ انتخاب فایل‌ها</span><span>۲ پردازش و شناسایی</span><span>۳ بازبینی</span><span>۴ ثبت نهایی</span></div>
 <div class="k9914toolbar"><label>طبقه پیش‌فرض<select data-class><option value="auto">تشخیص خودکار</option><option value="upstream">اسناد بالادستی</option><option value="general">اسناد عمومی</option></select></label><label class="k9914drop">Word / PDF<input type="file" multiple accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-files></label><button type="button" class="k9914start" data-start>شروع پردازش</button></div>
 <div class="k9914summary" data-summary>هنوز فایلی انتخاب نشده است.</div>
 <div class="k9914tablewrap"><table><thead><tr><th>ثبت</th><th>فایل</th><th>وضعیت</th><th>عنوان پیشنهادی</th><th>طبقه</th><th>نوع</th><th>مرجع</th><th>شماره</th><th>موضوع</th><th>اطمینان</th><th>هشدار</th></tr></thead><tbody data-rows></tbody></table></div>
 <footer><button type="button" data-discard>پاک‌سازی موارد ثبت‌نشده</button><div></div><button type="button" class="k9914commit" data-commit disabled>ثبت موارد تأییدشده در بانک اسناد</button></footer>
 </section>`;
 document.body.appendChild(w);document.body.classList.add('k9914-open');
 const close=()=>{w.remove();document.body.classList.remove('k9914-open')};
 w.querySelector('[data-close]').onclick=close;
 const fi=w.querySelector('[data-files]'),summary=w.querySelector('[data-summary]');
 fi.onchange=()=>{rows=[...(fi.files||[])].map((file,i)=>({id:i,file,status:'ready',selected:true}));summary.textContent=`${fa(rows.length)} فایل آماده پردازش است.`;renderRows(w)};
 w.querySelector('[data-start]').onclick=()=>processAll(w);
 w.querySelector('[data-commit]').onclick=()=>commitAll(w);
 w.querySelector('[data-discard]').onclick=()=>discardUncommitted(w);
}
function statusFa(x){return ({ready:'آماده',hashing:'بررسی تکرار',duplicate:'تکراری',uploading:'در حال بارگذاری',classifying:'تحلیل شناسنامه',review:'نیازمند بازبینی',prepared:'آماده ثبت',error:'خطا',committed:'ثبت شد'})[x]||x}
function renderRows(w){
 const tb=w.querySelector('[data-rows]');if(!tb)return;
 tb.innerHTML=rows.map((r,i)=>{
  const s=r.suggestion||{},dup=(r.duplicateCandidates||[])[0],warn=[...(s.warnings||[]),...(dup?[`احتمال تکرار با «${dup.document.title}» (${Math.round(dup.score*100)}٪)`]:[])];
  return `<tr data-i="${i}" class="st-${r.status}">
   <td><input type="checkbox" data-sel ${r.selected?'checked':''} ${['duplicate','error','committed'].includes(r.status)?'disabled':''}></td>
   <td><b>${esc(r.file.name)}</b><small>${fa(Math.round(r.file.size/1024))} KB</small></td>
   <td><span class="k9914status">${statusFa(r.status)}</span></td>
   <td><input data-k="title" value="${esc(s.title||r.file.name.replace(/\.(pdf|docx)$/i,''))}"></td>
   <td><select data-k="documentClass"><option value="upstream"${s.documentClass==='upstream'?' selected':''}>بالادستی</option><option value="general"${s.documentClass==='general'?' selected':''}>عمومی</option><option value="unclassified"${!['upstream','general'].includes(s.documentClass)?' selected':''}>نیازمند تعیین</option></select></td>
   <td><input data-k="documentType" value="${esc(s.documentType||'سایر')}"></td>
   <td><input data-k="issuer" value="${esc(s.issuer||'')}"></td>
   <td><input data-k="documentNumber" value="${esc(s.documentNumber||'')}"></td>
   <td><input data-k="subjectArea" value="${esc(s.subjectArea||s.subjectCategory||'')}"></td>
   <td><span class="k9914confidence">${s.confidence!=null?fa(Math.round(Number(s.confidence)*100))+'٪':'—'}</span></td>
   <td><div class="k9914warnings">${r.duplicateInfo?`<em>تکراری: ${esc(r.duplicateInfo.document?.title||'سند موجود')}</em>`:''}${warn.map(x=>`<em>${esc(x)}</em>`).join('')}${(s.possibleRelations||[]).length?`<i>${fa(s.possibleRelations.length)} رابطه پیشنهادی</i>`:''}</div></td>
  </tr>`;
 }).join('');
 tb.querySelectorAll('tr').forEach(tr=>{
   const r=rows[Number(tr.dataset.i)];
   tr.querySelector('[data-sel]')?.addEventListener('change',e=>r.selected=e.target.checked);
   tr.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('change',()=>{r.suggestion=r.suggestion||{};r.suggestion[el.dataset.k]=el.value}));
 });
 const selectable=rows.some(r=>r.documentId&&r.selected&&!['duplicate','error','committed'].includes(r.status));
 w.querySelector('[data-commit]').disabled=!selectable;
}
async function processAll(w){
 if(!rows.length)return;
 const cls=w.querySelector('[data-class]').value,start=w.querySelector('[data-start]');start.disabled=true;
 for(const r of rows){
   if(r.status!=='ready')continue;
   try{
    r.status='hashing';renderRows(w);
    const hash=await hashFile(r.file),pre=await api('/api/v1/bulk-intake/preflight',{method:'POST',body:JSON.stringify({hash,fileName:r.file.name,size:r.file.size})});
    if(pre.duplicate){r.status='duplicate';r.selected=false;r.duplicateInfo=pre;renderRows(w);continue}
    r.status='uploading';renderRows(w);
    const up=await directUpload(r.file);r.documentId=up.document?.id;
    r.status='classifying';renderRows(w);
    const c=await api('/api/v1/bulk-intake/classify',{method:'POST',body:JSON.stringify({documentId:r.documentId,defaultClass:cls})});
    r.suggestion=c.suggestion||{};r.duplicateCandidates=c.duplicateCandidates||[];
    r.status=r.duplicateCandidates[0]?.score>=.75?'review':'prepared';
    if(r.status==='review')r.selected=false;
   }catch(e){r.status='error';r.error=e.message;r.selected=false;r.suggestion={warnings:[e.message]}}
   renderRows(w);
 }
 start.disabled=false;
 w.querySelector('[data-summary]').textContent=`پردازش پایان یافت: ${fa(rows.filter(x=>x.status==='prepared').length)} آماده ثبت، ${fa(rows.filter(x=>x.status==='review').length)} نیازمند بازبینی، ${fa(rows.filter(x=>x.status==='duplicate').length)} تکراری.`;
}
async function commitAll(w){
 const items=[];w.querySelectorAll('[data-rows] tr').forEach(tr=>{
   const r=rows[Number(tr.dataset.i)];if(!r.documentId||!r.selected||['duplicate','error','committed'].includes(r.status))return;
   tr.querySelectorAll('[data-k]').forEach(el=>{r.suggestion=r.suggestion||{};r.suggestion[el.dataset.k]=el.value});
   items.push({documentId:r.documentId,...r.suggestion});
 });
 if(!items.length)return;
 const btn=w.querySelector('[data-commit]');btn.disabled=true;btn.textContent='در حال ثبت نهایی…';
 try{
   const d=await api('/api/v1/bulk-intake/commit',{method:'POST',body:JSON.stringify({items})});
   const ok=new Set((d.items||[]).filter(x=>x.ok).map(x=>x.documentId));rows.forEach(r=>{if(ok.has(r.documentId))r.status='committed'});renderRows(w);
   w.querySelector('[data-summary]').textContent=`✓ ${fa(d.committed||0)} سند در بانک اسناد ثبت نهایی شد.`;
   btn.textContent='ثبت نهایی انجام شد';
 }catch(e){btn.disabled=false;btn.textContent='ثبت موارد تأییدشده در بانک اسناد';w.querySelector('[data-summary]').textContent=e.message}
}
async function discardUncommitted(w){
 const ids=rows.filter(r=>r.documentId&&r.status!=='committed').map(r=>r.documentId);if(!ids.length)return;
 if(window.SinaDialog&&!(await SinaDialog.confirm('فایل‌های بارگذاری‌شده‌ای که ثبت نهایی نشده‌اند از بانک پنهان شوند؟',{title:'پاک‌سازی پذیرش دسته‌جمعی'})))return;
 try{const d=await api('/api/v1/bulk-intake/discard',{method:'POST',body:JSON.stringify({documentIds:ids})});rows=rows.filter(r=>!ids.includes(r.documentId));renderRows(w);w.querySelector('[data-summary]').textContent=`${fa(d.removed||0)} مورد ثبت‌نشده پاک‌سازی شد.`}catch(e){w.querySelector('[data-summary]').textContent=e.message}
}
function findDocSection9919(ctx){
 const cards=[...ctx.querySelectorAll('.k9931-static-document-card')].filter(c=>['upstream','general'].includes(c.dataset.k9931Kind||''));if(cards.length<2)return cards[0]?.parentElement||null;
 const labels=[...ctx.querySelectorAll('b,h1,h2,h3,h4,span,div')].filter(el=>String(el.textContent||'').trim()==='اسناد سازمان');for(const label of labels){let n=label;while(n&&n!==ctx){if(cards.every(c=>n.contains(c)))return n;n=n.parentElement}}let a=cards[0];while(a&&a!==ctx){if(cards.every(c=>a.contains(c)))return a;a=a.parentElement}return cards[0].parentElement;
}
function ensureToolbar9919(ctx){if(window.__SINA_ENSURE_DOCUMENT_TOOLBAR__)return window.__SINA_ENSURE_DOCUMENT_TOOLBAR__(ctx);let bar=ctx.querySelector('#sinaDocumentToolbar9919'),section=findDocSection9919(ctx);if(!section)return bar;if(!bar){bar=document.createElement('div');bar.id='sinaDocumentToolbar9919';bar.className='k9919-doc-toolbar';bar.dataset.release='0.9.9.1.9'}if(section.parentElement&&bar.nextElementSibling!==section)section.parentElement.insertBefore(bar,section);return bar}
function decorate(){const ctx=document.getElementById('workspaceContext');if(!ctx||!/دانش و اسناد سازمان/.test(ctx.textContent||''))return;ctx.querySelectorAll('[data-k9914-bulk]').forEach(x=>{if(!x.closest('#sinaDocumentToolbar9919'))x.remove()});const bar=ensureToolbar9919(ctx);if(!bar||bar.querySelector('[data-k9914-bulk]'))return;const b=document.createElement('button');b.type='button';b.dataset.k9914Bulk='1';b.className='k9914entry k9919tool';b.innerHTML='<span>⇧</span><div><b>ورود دسته‌جمعی اسناد</b><small>بارگذاری، شناسایی و ثبت چند سند</small></div>';b.onclick=e=>{e.preventDefault();e.stopPropagation();mount()};bar.prepend(b)}
window.__SINA_OPEN_BULK_INTAKE__=(kind='')=>{mount();requestAnimationFrame(()=>{const sel=document.querySelector('.k9914overlay [data-class]');if(sel&&['upstream','general'].includes(kind))sel.value=kind})};let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,80)}).observe(document.documentElement,{childList:true,subtree:true});decorate();
})();
