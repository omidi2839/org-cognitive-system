(()=>{
window.__PLATFORM_UNIFIED_BUILD__='0.9.8.9';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const FA='۰۱۲۳۴۵۶۷۸۹',toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const api=async(p,o={})=>{const r=await fetch(p,{...o,credentials:'same-origin',headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.message||'خطا'),{code:d.code,status:r.status});return d};

// Old registration workflow used amended_by for «current document amends previous document».
// Normalize only outgoing relation-create payloads; the backend also repairs already-persisted legacy edges.
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 const url=typeof input==='string'?input:(input?.url||'');
 if(url.includes('/api/v1/knowledge/document-relations')&&init?.method==='POST'&&typeof init.body==='string'){
   try{const b=JSON.parse(init.body);if(b.relationType==='amended_by')b.relationType='amends';init={...init,body:JSON.stringify(b)}}catch{}
 }
 return nativeFetch(input,init);
};

function fixWorkspaceNavigation(){
 document.addEventListener('click',e=>{
   if(e.target?.closest?.('[data-workspace]'))document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace');
 },true);
}
function beautifyFileInputs(root=document){
 root.querySelectorAll('.k985attachments,.k985fileedit,[data-k985-edit-attachments],[data-k985-replace-primary]').forEach(x=>{
   const zone=x.closest('label')||x.closest('.k985attachments')||x;if(zone)zone.classList.add('k989-file-zone');
 });
}
async function attachmentPanel(modal,docId){
 if(!modal||!docId||modal.querySelector('.k989-attach-top'))return;
 try{
  const d=await api('/api/v1/knowledge/document-governance?documentId='+encodeURIComponent(docId));
  const at=d.files?.attachments||[];if(!at.length)return;
  const body=modal.querySelector('.k91modalbody')||modal.querySelector('.k91fulltext')?.parentElement;if(!body)return;
  const box=document.createElement('section');box.className='k989-attach-top';
  box.innerHTML=`<div><span>📎</span><div><b>این سند دارای ${toFa(at.length)} پیوست است</b><small>برای مشاهده یا دریافت، پیوست موردنظر را انتخاب کنید.</small></div></div><div class="k989-attach-list">${at.map((a,i)=>`<button type="button" class="k989-attach-btn" data-artifact="${esc(a.id)}">${toFa(i+1)}. ${esc(a.fileName)}</button>`).join('')}</div>`;
  body.prepend(box);
  box.querySelectorAll('[data-artifact]').forEach(btn=>btn.onclick=async()=>{
    const old=btn.textContent;btn.disabled=true;btn.textContent='در حال آماده‌سازی…';
    try{const f=await api('/api/v1/knowledge/document-file-access?artifactId='+encodeURIComponent(btn.dataset.artifact));window.open(f.url,'_blank','noopener,noreferrer')}
    catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent=old}
  });
 }catch(e){console.warn('ATTACHMENT_PANEL_ERROR',e)}
}
function observePreview(){
 document.addEventListener('click',e=>{const p=e.target?.closest?.('[data-doc-preview]');if(!p?.dataset.docPreview)return;const id=p.dataset.docPreview;setTimeout(()=>attachmentPanel(document.getElementById('k91docmodal'),id),260)},true);
 document.addEventListener('k958:document-preview',()=>setTimeout(()=>{const id=window.__K951_ACTIVE_DOC_ID||window.__K950_ACTIVE_DOC_ID||'';attachmentPanel(document.getElementById('k91docmodal'),id)},140));
}
function observeUi(){const run=()=>{beautifyFileInputs();};new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});run()}
fixWorkspaceNavigation();observePreview();observeUi();
})();
