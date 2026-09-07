(()=>{
window.__DOCUMENT_RELATION_ENHANCEMENT_BUILD__='0.9.4.5';

const FA='۰۱۲۳۴۵۶۷۸۹';
const AR='٠١٢٣٤٥٦٧٨٩';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toEn=s=>String(s??'').replace(/[۰-۹]/g,d=>String(FA.indexOf(d))).replace(/[٠-٩]/g,d=>String(AR.indexOf(d)));
const digitPat=s=>[...toEn(s)].map(ch=>{
 if(/\d/.test(ch)){const i=Number(ch);return `[${ch}${FA[i]}${AR[i]}]`}
 return ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
}).join('');

let activeDocId=null;
let fetchSeq=0;

const api=async p=>{
 const r=await fetch(p,{headers:{'x-org-id':'ORG:SYN-001'}});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.message||'خطا در دریافت سوابق سند');
 return d;
};

function makeCollapsible(box){
 if(!box||box.dataset.k945Collapse)return;
 const head=box.querySelector('.k944relhead');
 const list=box.querySelector('.k944rellist,.k944empty');
 if(!head||!list)return;

 box.dataset.k945Collapse='1';
 head.classList.add('k945relhead');
 head.setAttribute('role','button');
 head.setAttribute('tabindex','0');

 const content=document.createElement('div');
 content.className='k945relcontent';
 list.parentNode.insertBefore(content,list);
 content.appendChild(list);

 const count=box.querySelectorAll('.k944relcard').length;
 const collapsed=count>3;
 if(collapsed)content.hidden=true;
 head.setAttribute('aria-expanded',collapsed?'false':'true');

 const toggle=document.createElement('button');
 toggle.type='button';
 toggle.className='k945toggle';
 toggle.setAttribute('aria-label','باز و بسته کردن اصلاحات و سوابق');
 toggle.textContent=collapsed?'⌄':'⌃';
 head.appendChild(toggle);

 const flip=()=>{
   const willCollapse=!content.hidden;
   content.hidden=willCollapse;
   head.setAttribute('aria-expanded',willCollapse?'false':'true');
   toggle.textContent=willCollapse?'⌄':'⌃';
 };
 head.addEventListener('click',e=>{
   if(e.target.closest('[data-doc-preview]'))return;
   flip();
 });
 head.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}
 });
}

function incoming(r){
 return ['amended_by','clarified_by','repealed_by','superseded_by','extended_by'].includes(r?.perspectiveType);
}

function patternFor(kind,value){
 const raw=String(value||'').trim();
 if(!raw)return null;
 if(kind==='article'){
   const n=toEn(raw).match(/\d+/)?.[0]||toEn(raw);
   return new RegExp(`ماده\\s*(?:شماره\\s*)?${digitPat(n)}`,'giu');
 }
 const en=toEn(raw);
 const n=en.match(/\d+/)?.[0];
 if(n)return new RegExp(`(?:تبصره|بند)\\s*(?:شماره\\s*)?${digitPat(n)}`,'giu');
 const escaped=raw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s*');
 return new RegExp(escaped,'giu');
}

function highlightTarget(full,target){
 const rx=patternFor(target.kind,target.value);
 if(!rx)return 0;

 const walker=document.createTreeWalker(full,NodeFilter.SHOW_TEXT);
 const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 let hits=0;

 for(const node of nodes){
   if(node.parentElement?.closest('mark,.k944relations,.k945relations'))continue;
   const text=node.nodeValue||'';
   rx.lastIndex=0;
   let m,last=0,parts=[];
   while((m=rx.exec(text))){
     parts.push({text:text.slice(last,m.index),hit:false});
     parts.push({text:m[0],hit:true});
     last=m.index+m[0].length;
     if(!m[0].length)rx.lastIndex++;
   }
   if(!parts.length)continue;
   parts.push({text:text.slice(last),hit:false});

   const frag=document.createDocumentFragment();
   for(const p of parts){
     if(!p.hit){frag.appendChild(document.createTextNode(p.text));continue}
     hits++;
     const mark=document.createElement('mark');
     mark.className='k945docchange';
     mark.textContent=p.text;
     const rel=target.relation||{};
     const label=rel.perspectiveType==='repealed_by'?'ملغی‌شده':
                 rel.perspectiveType==='clarified_by'?'دارای استفسار':
                 rel.perspectiveType==='superseded_by'?'جایگزین‌شده':'اصلاح‌شده';
     mark.dataset.changeLabel=label;
     mark.title=[
       rel.relatedDocument?.title?`سند مرتبط: ${rel.relatedDocument.title}`:'',
       target.description?`شرح: ${target.description}`:''
     ].filter(Boolean).join(' — ');
     frag.appendChild(mark);
   }
   node.parentNode?.replaceChild(frag,node);
 }
 return hits;
}

async function highlightChanges(docId,box){
 if(!docId||!box||box.dataset.k945Highlight)return;
 box.dataset.k945Highlight='loading';
 const seq=++fetchSeq;
 try{
   const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
   if(seq!==fetchSeq)return;
   const full=document.querySelector('#k91docmodal .k91fulltext');
   if(!full)return;

   // Clear only marks created by this feature, in case the popup was refreshed.
   full.querySelectorAll('mark.k945docchange').forEach(m=>m.replaceWith(document.createTextNode(m.textContent||'')));

   const targets=[];
   (d.items||[]).filter(incoming).forEach(r=>{
     const arr=Array.isArray(r.changeItems)?r.changeItems:[];
     arr.forEach(x=>{
       if(x.article)targets.push({kind:'article',value:x.article,description:x.description||'',relation:r});
       if(x.clause)targets.push({kind:'clause',value:x.clause,description:x.description||'',relation:r});
     });
   });

   let total=0;
   targets.forEach(t=>{total+=highlightTarget(full,t)});
   box.dataset.k945Highlight='done';

   if(targets.length){
     const note=document.createElement('div');
     note.className='k945legend';
     note.innerHTML=total
       ? `<span class="k945legendmark"></span><b>اصلاحات ثبت‌شده در متن سند با رنگ متمایز مشخص شده‌اند.</b><small>برای دیدن شرح تغییر، نشانگر را روی بخش رنگی نگه دارید.</small>`
       : `<span class="k945legendmark muted"></span><b>برای این سند اصلاح ماده/تبصره ثبت شده است، اما عبارت متناظر در متن استخراج‌شده پیدا نشد.</b>`;
     const content=box.querySelector('.k945relcontent');
     (content||box).appendChild(note);
   }
 }catch{
   box.dataset.k945Highlight='error';
 }
}

function enhance(){
 const modal=document.getElementById('k91docmodal');
 const box=modal?.querySelector('.k944relations');
 if(!box)return;
 makeCollapsible(box);
 if(activeDocId&&box.querySelector('.k944relhead'))highlightChanges(activeDocId,box);
}

/* Capture the selected document before the bank's own document-level handler. */
window.addEventListener('click',e=>{
 const p=e.target?.closest?.('[data-doc-preview]');
 if(!p?.dataset.docPreview)return;
 activeDocId=p.dataset.docPreview;
 fetchSeq++;
 setTimeout(enhance,0);
},true);

new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
enhance();
})();