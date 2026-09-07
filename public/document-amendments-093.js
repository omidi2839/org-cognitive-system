(()=>{
window.__DOCUMENT_WORKFLOW_BUILD__='0.9.4.0';
const FA='۰۱۲۳۴۵۶۷۸۹', EN='0123456789';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const toEn=v=>String(v??'').replace(/[۰-۹]/g,d=>EN[FA.indexOf(d)]).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const api=async(p,opts={})=>{
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);
 try{
  const r=await fetch(p,{...opts,signal:ctl.signal,headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(opts.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.message||'خطا');
  return d;
 }finally{clearTimeout(t)}
};

/* ---------- Jalali conversion ---------- */
function div(a,b){return Math.floor(a/b)}
function mod(a,b){return a-Math.floor(a/b)*b}
function jalCal(jy){
 const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
 let bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,n,i;
 if(jy<jp||jy>=breaks[bl-1])throw Error('Jalali year out of range');
 for(i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 n=jy-jp;leapJ+=div(n,33)*8+div(mod(n,33)+3,4);if(mod(jump,33)===4&&jump-n===4)leapJ++;
 const leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150, march=20+leapJ-leapG;
 if(jump-n<6)n=n-jump+div(jump+4,33)*33;
 let leap=mod(mod(n+1,33)-1,4);if(leap===-1)leap=4;
 return {leap,gy,march};
}
function g2d(gy,gm,gd){let d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;d=d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752;return d}
function d2g(jdn){let j=4*jdn+139361631;j=j+div(div(4*jdn+183187720,146097)*3,4)*4-3908;const i=div(mod(j,1461),4)*5+308;const gd=div(mod(i,153),5)+1,gm=mod(div(i,153),12)+1,gy=div(j,1461)-100100+div(8-gm,6);return {gy,gm,gd}}
function j2d(jy,jm,jd){const r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1}
function d2j(jdn){const g=d2g(jdn),jy=g.gy-621,r=jalCal(jy),jdn1f=g2d(g.gy,3,r.march);let k=jdn-jdn1f;if(k>=0){if(k<=185)return {jy,jm:1+div(k,31),jd:mod(k,31)+1};k-=186}else{let jy2=jy-1;k+=179;if(r.leap===1)k++;return {jy:jy2,jm:7+div(k,30),jd:mod(k,30)+1}}return {jy,jm:7+div(k,30),jd:mod(k,30)+1}}
function jalaliToGregorian(s){
 const m=toEn(s).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);if(!m)return'';
 try{const g=d2g(j2d(+m[1],+m[2],+m[3]));return `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`}catch{return''}
}
function gregorianToJalali(s){
 const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return'';
 try{const j=d2j(g2d(+m[1],+m[2],+m[3]));return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`}catch{return''}
}
function daysInJalaliMonth(y,m){if(m<=6)return 31;if(m<=11)return 30;return jalCal(y).leap===0?30:29}
const monthNames=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function attachJalali(input){
 if(!input||input.dataset.jalaliReady)return;
 input.dataset.jalaliReady='1';
 const hidden=input;
 const visible=document.createElement('input');
 visible.type='text'; visible.className='k94jalali'; visible.placeholder='۱۴۰۵/۰۶/۱۶'; visible.autocomplete='off';
 visible.value=toFa(gregorianToJalali(hidden.value));
 hidden.type='hidden';
 hidden.insertAdjacentElement('afterend',visible);
 let current=gregorianToJalali(hidden.value);
 if(current){const [y,m]=current.split('/').map(Number);visible.dataset.y=y;visible.dataset.m=m}
 visible.addEventListener('input',()=>{const g=jalaliToGregorian(visible.value);hidden.value=g});
 visible.addEventListener('focus',()=>openCalendar(visible,hidden));
 visible.addEventListener('click',()=>openCalendar(visible,hidden));
}
function openCalendar(visible,hidden){
 document.querySelector('.k94calendar')?.remove();
 const nowJ=d2j(g2d(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate()));
 const raw=toEn(visible.value),m=raw.match(/^(\d{4})\/(\d{1,2})/);
 let y=m?+m[1]:nowJ.jy,mo=m?+m[2]:nowJ.jm;
 const pop=document.createElement('div');pop.className='k94calendar';document.body.appendChild(pop);
 const render=()=>{
  const first=d2g(j2d(y,mo,1)),weekDay=new Date(first.gy,first.gm-1,first.gd).getDay();
  const offset=(weekDay+1)%7,days=daysInJalaliMonth(y,mo);
  let cells='';for(let i=0;i<offset;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++)cells+=`<button type="button" data-jday="${d}">${toFa(d)}</button>`;
  pop.innerHTML=`<div class="k94calhead"><button type="button" data-next>‹</button><b>${monthNames[mo-1]} ${toFa(y)}</b><button type="button" data-prev>›</button></div>
   <div class="k94week"><b>ش</b><b>ی</b><b>د</b><b>س</b><b>چ</b><b>پ</b><b>ج</b></div><div class="k94days">${cells}</div>`;
  pop.querySelector('[data-prev]').onclick=()=>{mo--;if(mo<1){mo=12;y--}render()};
  pop.querySelector('[data-next]').onclick=()=>{mo++;if(mo>12){mo=1;y++}render()};
  pop.querySelectorAll('[data-jday]').forEach(b=>b.onclick=()=>{
    const d=+b.dataset.jday,j=`${y}/${String(mo).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
    visible.value=toFa(j);hidden.value=jalaliToGregorian(j);pop.remove();
  });
 };
 const r=visible.getBoundingClientRect();pop.style.top=`${window.scrollY+r.bottom+5}px`;pop.style.left=`${window.scrollX+r.left}px`;render();
 setTimeout(()=>document.addEventListener('mousedown',function close(e){if(!pop.contains(e.target)&&e.target!==visible){pop.remove();document.removeEventListener('mousedown',close)}},true),0);
}

/* ---------- Document relations: display only in preview ---------- */
function relationLoc(r){const p=[];if(r.targetArticle)p.push(`ماده ${esc(r.targetArticle)}`);if(r.targetClause)p.push(`بند/تبصره ${esc(r.targetClause)}`);if(r.targetSection)p.push(esc(r.targetSection));return p.join(' · ')}
function relationRow(r){return `<div class="k94relrow"><span class="k94reltype">${esc(r.label||'ارتباط')}</span><button type="button" data-doc-preview="${esc(r.relatedDocument?.id||'')}">${esc(r.relatedDocument?.title||'بدون عنوان')}</button>${relationLoc(r)?`<small>${relationLoc(r)}</small>`:''}${r.changeType?`<small>${esc(r.changeType)}</small>`:''}</div>`}
async function showRelations(modal,docId){
 const body=modal?.querySelector('.k91modalbody');if(!body)return;
 body.querySelector('.k94relations')?.remove();
 const box=document.createElement('section');box.className='k94relations';box.innerHTML='<div class="k94relwait">در حال دریافت سوابق سند…</div>';body.prepend(box);
 try{
  const d=await api('/api/v1/knowledge/document-relations?documentId='+encodeURIComponent(docId));
  const items=d.items||[];
  box.innerHTML=`<div class="k94relhead"><b>اصلاحات و سوابق این سند</b><span>${esc(d.summary?.statusLabel||'بدون اصلاحیه ثبت‌شده')}</span></div>
   ${items.length?items.map(relationRow).join(''):'<div class="k94relempty">برای این سند هنوز اصلاحیه یا رابطه‌ای ثبت نشده است.</div>'}`;
 }catch(e){
  box.innerHTML=`<div class="k94relerror">سوابق سند در دسترس نیست: ${esc(e.name==='AbortError'?'پاسخ سرویس دریافت نشد.':e.message)}</div>`;
 }
}
let activePreview=null;
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-doc-preview]');
 if(p?.dataset.docPreview){
   activePreview=p.dataset.docPreview;
   setTimeout(()=>{const modal=document.getElementById('k91docmodal');if(modal)showRelations(modal,activePreview)},180);
 }
},true);

/* ---------- Relation registration during document upload ---------- */
const relationTypes=[['','بدون ارتباط'],['amended_by','اصلاحیه سند قبلی'],['amends','این سند، سند قبلی را اصلاح می‌کند'],['supersedes','جایگزین سند قبلی'],['repeals','لغوکننده سند قبلی'],['extends','تمدید/توسعه سند قبلی'],['clarifies','تبیین/تفسیر سند قبلی'],['implements','سند اجرایی سند قبلی'],['related_to','ارتباط عمومی']];
async function enhanceUploadForm(form){
 if(!form||form.dataset.workflow94)return;form.dataset.workflow94='1';
 form.querySelectorAll('input[type="date"]').forEach(attachJalali);
 const grid=form.querySelector('.k76grid');if(!grid)return;
 const wrap=document.createElement('section');wrap.className='k94relationentry';
 wrap.innerHTML=`<div class="k94relationtitle"><b>ارتباط با اسناد قبلی</b><span>در صورت اصلاحیه، جایگزینی یا ارتباط با سند موجود تکمیل شود.</span></div>
 <div class="k94relationgrid">
  <label>نوع ارتباط<select data-reltype>${relationTypes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
  <label class="wide">سند مرتبط<select data-reldoc><option value="">انتخاب سند…</option></select></label>
  <label>ماده<input data-relarticle placeholder="مثلاً ۷"></label>
  <label>بند / تبصره<input data-relclause placeholder="مثلاً تبصره ۲"></label>
  <label>نوع تغییر<select data-relchange><option value="">انتخاب…</option><option>اصلاح متن</option><option>جایگزینی متن</option><option>حذف</option><option>الحاق</option><option>تمدید اعتبار</option><option>تغییر دامنه</option><option>تفسیر/توضیح</option></select></label>
  <label class="wide">توضیح<input data-relnote placeholder="مثلاً ماده ۷ مصوبه ۲۱۵ اصلاح می‌شود"></label>
 </div>`;
 grid.insertAdjacentElement('afterend',wrap);
 try{
  const d=await api('/api/v1/knowledge/document-bank'),sel=wrap.querySelector('[data-reldoc]');
  (d.items||[]).forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=`${x.title||'بدون عنوان'}${x.issuer?' — '+x.issuer:''}`;sel.appendChild(o)});
 }catch{}
 let pendingRelation=null;
 form.addEventListener('submit',()=>{
   const type=wrap.querySelector('[data-reltype]').value,related=wrap.querySelector('[data-reldoc]').value;
   pendingRelation=type&&related?{relationType:type,relatedDocumentId:related,targetArticle:wrap.querySelector('[data-relarticle]').value.trim(),targetClause:wrap.querySelector('[data-relclause]').value.trim(),changeType:wrap.querySelector('[data-relchange]').value,note:wrap.querySelector('[data-relnote]').value.trim()}:null;
   if(!pendingRelation)return;
   const st=form.querySelector('#k76status')||document.getElementById('k76status');
   if(!st)return;
   const mo=new MutationObserver(async()=>{
     const text=st.textContent||'',m=text.match(/DOC:[A-Za-z0-9:_-]+/);
     if(!m)return;mo.disconnect();
     try{
       await api('/api/v1/knowledge/document-relations',{method:'POST',body:JSON.stringify({documentId:m[0],...pendingRelation})});
       st.insertAdjacentHTML('beforeend','<br><b class="k94relsaved">ارتباط سند نیز ثبت شد.</b>');
     }catch(err){st.insertAdjacentHTML('beforeend',`<br><span class="k94relwarn">سند ثبت شد، اما ارتباط ذخیره نشد: ${esc(err.message)}</span>`)}
   });mo.observe(st,{childList:true,subtree:true,characterData:true});
 },true);
}

/* ---------- Repository summary routing ---------- */
function tempCapability(name){
 const b=document.createElement('button');b.style.display='none';b.dataset.capability=name;document.body.appendChild(b);b.click();b.remove();
}
function openBank(kind){
 document.getElementById('knowledge076')?.remove();tempCapability('بانک اسناد');
 setTimeout(()=>{const f=document.getElementById('k91search');if(!f)return;const s=f.querySelector('[name="documentClass"]');if(s){s.value=kind;f.requestSubmit()}},180);
}
function enhanceRepo(){
 const body=document.getElementById('k76body');if(!body||body.dataset.repo94)return;
 const head=body.querySelector('.k76repohead'),docs=body.querySelector('.k76docs'),metrics=body.querySelector('.k76metrics');
 if(!head||!docs||!metrics)return;
 body.dataset.repo94='1';head.remove();docs.remove();
 const cards=metrics.children;
 if(cards[0]){cards[0].classList.add('k94metriclink');cards[0].title='مشاهده اسناد در بانک اسناد';cards[0].onclick=()=>openBank(document.querySelector('[data-krepo]')?.closest('#knowledge076')&&body.textContent.includes('عمومی')?'general':'upstream')}
 if(cards[1]){cards[1].classList.add('k94metriclink');cards[1].title='رفتن به تحلیل اسناد';cards[1].onclick=()=>{document.getElementById('knowledge076')?.remove();tempCapability('تحلیل اسناد')}}
 const note=body.querySelector('.k76note');note?.insertAdjacentHTML('beforebegin','<div class="k94reposummary">فهرست اسناد در این صفحه نمایش داده نمی‌شود؛ برای مشاهده جزئیات روی کارت‌های آماری بالا کلیک کنید.</div>');
}

/* ---------- Search filters: Jalali dates ---------- */
function enhanceBankDates(){
 const f=document.getElementById('k91search');if(!f||f.dataset.jalali94)return;f.dataset.jalali94='1';
 f.querySelectorAll('input[type="date"]').forEach(attachJalali);
}

/* Observe only known surface changes; no API loop */
const obs=new MutationObserver(()=>{
 const form=document.getElementById('k76form');if(form)enhanceUploadForm(form);
 enhanceRepo();enhanceBankDates();
});
obs.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('DOMContentLoaded',()=>{enhanceRepo();enhanceBankDates();enhanceUploadForm(document.getElementById('k76form'))});
})();
