(()=>{
window.__UI_PERSIAN_POLISH_BUILD__='0.9.9.0.9';

const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/[0-9]/g,d=>FA[d]);
const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE']);

function shouldSkipElement(el){
 if(!el||el.nodeType!==1)return false;
 if(SKIP.has(el.tagName))return true;
 if(el.closest?.('[data-no-fa-digits],script,style,code'))return true;
 return false;
}

function persianizeTextNode(node){
 if(!node||node.nodeType!==Node.TEXT_NODE||!/[0-9]/.test(node.nodeValue||''))return;
 const p=node.parentElement;
 if(shouldSkipElement(p))return;
 node.nodeValue=toFa(node.nodeValue);
}

function persianizeAttrs(el){
 if(!el||el.nodeType!==1||shouldSkipElement(el))return;
 for(const a of ['placeholder','title','aria-label']){
   const v=el.getAttribute?.(a);
   if(v&&/[0-9]/.test(v))el.setAttribute(a,toFa(v));
 }
 if(el.tagName==='OPTION'&&/[0-9]/.test(el.textContent||''))el.textContent=toFa(el.textContent);
}

function persianizeTree(root=document.body){
 if(!root)return;
 if(root.nodeType===Node.TEXT_NODE){persianizeTextNode(root);return}
 if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
 if(root.nodeType===1)persianizeAttrs(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let n;
 while((n=walker.nextNode())){
   if(n.nodeType===Node.TEXT_NODE)persianizeTextNode(n);
   else persianizeAttrs(n);
 }
}

// User-facing text/search/tel values should also appear with Persian digits.
// Password, email, file, hidden, URL and numeric machine fields are intentionally untouched.
function localizeInputValue(el){
 if(!el||!['INPUT','TEXTAREA'].includes(el.tagName))return;
 const type=(el.getAttribute('type')||'text').toLowerCase();
 if(['password','email','file','hidden','url','number','date','datetime-local','time'].includes(type))return;
 const old=el.value;
 if(!/[0-9]/.test(old))return;
 const start=el.selectionStart,end=el.selectionEnd;
 el.value=toFa(old);
 try{if(start!=null)el.setSelectionRange(start,end)}catch{}
}

document.addEventListener('input',e=>localizeInputValue(e.target),true);
document.addEventListener('change',e=>{
 localizeInputValue(e.target);
 if(e.target?.tagName==='SELECT'){
   [...e.target.options].forEach(persianizeAttrs);
 }
},true);

// Direct, reliable navigation from search results to document modal.
document.addEventListener('click',e=>{
 const btn=e.target?.closest?.('#commandResult [data-doc-preview]');
 if(!btn)return;
 const id=btn.dataset.docPreview;
 if(!id)return;
 e.preventDefault();
 e.stopPropagation();
 window.__K950_ACTIVE_DOC_ID=id;
 window.__K951_ACTIVE_DOC_ID=id;
 window.__K992_ACTIVE_DOC_ID=id;
 if(typeof window.__ORG_OPEN_DOCUMENT__==='function'){
   window.__ORG_OPEN_DOCUMENT__(id,'');
 }else{
   console.warn('DOCUMENT_PREVIEW_HANDLER_NOT_READY',id);
 }
},true);

function mountProfileMenu(){
 const avatar=document.querySelector('.role-topbar .avatar,.topbar .avatar');
 if(!avatar||avatar.dataset.k996Profile)return;
 avatar.dataset.k996Profile='1';
 avatar.setAttribute('role','button');
 avatar.setAttribute('tabindex','0');
 avatar.setAttribute('aria-haspopup','menu');
 avatar.setAttribute('aria-expanded','false');
 avatar.setAttribute('title','پروفایل و خروج از سامانه');

 const wrap=document.createElement('div');
 wrap.className='k996-profile-wrap';
 avatar.parentNode.insertBefore(wrap,avatar);
 wrap.appendChild(avatar);

 const menu=document.createElement('div');
 menu.className='k996-profile-menu';
 menu.hidden=true;
 menu.innerHTML=`
   <div class="k996-profile-head">
     <span class="k996-profile-avatar">ح</span>
     <div><b>مدیر کل سامانه</b><small>دسترسی کامل مدیریتی</small></div>
   </div>
   <div class="k996-profile-sep"></div>
   <button type="button" data-k996-logout>
     <span>⇥</span><div><b>خروج از سامانه</b><small>پایان نشست امن</small></div>
   </button>`;
 wrap.appendChild(menu);

 const close=()=>{menu.hidden=true;avatar.setAttribute('aria-expanded','false')};
 const toggle=()=>{
   const show=menu.hidden;
   document.querySelectorAll('.k996-profile-menu').forEach(x=>x.hidden=true);
   menu.hidden=!show;
   avatar.setAttribute('aria-expanded',show?'true':'false');
 };
 avatar.addEventListener('click',e=>{e.stopPropagation();toggle()});
 avatar.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}
   if(e.key==='Escape')close();
 });
 document.addEventListener('click',e=>{if(!wrap.contains(e.target))close()});
 menu.querySelector('[data-k996-logout]').onclick=async()=>{
   const b=menu.querySelector('[data-k996-logout]');
   b.disabled=true;
   b.querySelector('b').textContent='در حال خروج…';
   try{
     await fetch('/api/v1/auth/session',{method:'DELETE',credentials:'same-origin'});
   }catch(e){
     console.warn('LOGOUT_REQUEST_FAILED',e);
   }finally{
     location.reload();
   }
 };
}

let scheduled=false;
function refresh(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{
   scheduled=false;
   persianizeTree(document.body);
   document.querySelectorAll('input,textarea').forEach(localizeInputValue);
   mountProfileMenu();
 });
}

function start(){
 refresh();
 const mo=new MutationObserver(ms=>{
   for(const m of ms){
     m.addedNodes?.forEach(n=>persianizeTree(n));
     if(m.type==='characterData')persianizeTextNode(m.target);
   }
   mountProfileMenu();
 });
 mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();