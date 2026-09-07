(()=>{
const FA='۰۱۲۳۴۵۶۷۸۹';
const toFa=v=>String(v??'').replace(/\d/g,d=>FA[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch{return toFa(v)}};
const api=async(p)=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا در دریافت بانک اسناد');return d};

function persianize(root){
 if(!root)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(n=>{
   if(n.parentElement?.closest('script,style,input,textarea'))return;
   const next=toFa(n.nodeValue);
   if(next!==n.nodeValue)n.nodeValue=next;
 });
}

function cleanBuildLabel(root){
 root?.querySelectorAll('.k76head small').forEach(x=>{
   if(/Build\s*0\.7\.6\.4/.test(x.textContent))x.remove();
 });
}

function enhanceExistingShell(root){
 if(!root)return;
 cleanBuildLabel(root);
 const tabs=root.querySelector('.k76tabs');
 if(tabs&&!tabs.querySelector('[data-kbank]')){
  const b=document.createElement('button');
  b.type='button';
  b.dataset.kbank='1';
  b.textContent='بانک اسناد';
  b.onclick=()=>openBank();
  tabs.appendChild(b);
 }
 persianize(root);
}

function injectWorkspaceCard(){
 const ctx=document.getElementById('workspaceContext');
 if(!ctx||ctx.classList.contains('hidden')||ctx.classList.contains('k91-hidden-workspace'))return;
 if(!ctx.textContent.includes('دانش و اسناد سازمان'))return;
 const stages=ctx.querySelectorAll('.cognitive-stage');
 const target=stages[0]?.querySelector('.stage-items');
 if(!target||target.querySelector('[data-capability="بانک اسناد"]'))return;
 const b=document.createElement('button');
 b.className='capability-card live';
 b.dataset.capability='بانک اسناد';
 b.innerHTML='<span class="capability-icon">✦</span><b>بانک اسناد</b><small>جستجو و بازیابی سازمانی</small>';
 target.appendChild(b);
 persianize(ctx);
}

function closeBank(){
 document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace');
 document.getElementById('knowledge076')?.remove();
 const ctx=document.getElementById('workspaceContext');
 if(ctx){
   ctx.scrollIntoView({behavior:'smooth',block:'start'});
   setTimeout(()=>injectWorkspaceCard(),50);
 }
}

function ensureShell(){
 let x=document.getElementById('knowledge076');
 if(x)x.remove();
 x=document.createElement('section');
 x.id='knowledge076';
 x.className='knowledge076 k91bank-mode';
 document.querySelector('.main')?.prepend(x);
 x.innerHTML=`<div class="k76head k91stickyhead">
   <div class="k91headcopy">
     <button type="button" class="k91back" data-kback>← بازگشت به دانش و اسناد سازمان</button>
     <div><h2>بانک اسناد سازمان</h2><p>جستجو، فیلتر و بازیابی اسناد قابل دسترس بر اساس فراداده و متن استخراج‌شده</p></div>
   </div>
 </div><div id="k76body"></div>`;
 x.querySelector('[data-kback]').onclick=closeBank;
 return x;
}

function statusLabel(v){return({active:'معتبر',draft:'پیش‌نویس',expired:'منقضی',revoked:'لغوشده',superseded:'جایگزین‌شده',unknown:'نیازمند احراز'})[v]||v||'نیازمند احراز'}
function classLabel(v){return({public:'عمومی',internal:'داخلی',confidential:'محرمانه',secret:'خیلی محرمانه'})[v]||v||'—'}
function docClass(v){return v==='upstream'?'بالادستی':v==='general'?'عمومی':'سایر'}

function snippetsBlock(d){
 const snippets=Array.isArray(d.matchSnippets)?d.matchSnippets.filter(Boolean):[];
 if(!snippets.length){
   if(d.metadataMatch)return '<div class="k91snippet k91meta-hit"><b>تطابق در فراداده سند</b></div>';
   return '';
 }
 const shown=snippets.slice(0,3).map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+1)}:</b> ${esc(s)}</div>`).join('');
 const rest=snippets.slice(3);
 const details=rest.length?`<details class="k91more"><summary>نمایش ${toFa(rest.length)} محل تطابق دیگر</summary>${rest.map((s,i)=>`<div class="k91snippet"><b>تطابق ${toFa(i+4)}:</b> ${esc(s)}</div>`).join('')}</details>`:'';
 const hiddenCount=Math.max(0,(d.matchCount||0)-snippets.length);
 const note=hiddenCount?`<div class="k91match-note">این سند ${toFa(d.matchCount)} تطابق دارد؛ ${toFa(hiddenCount)} مورد دیگر برای سبک ماندن پاسخ نمایش داده نشده است.</div>`:'';
 return shown+details+note;
}

function resultRow(d){
 const matchBadge=d.matchCount?`<span class="k91matchbadge">${toFa(d.matchCount)} تطابق در متن</span>`:(d.metadataMatch?'<span class="k91matchbadge">تطابق در فراداده</span>':'');
 return `<article class="k91result">
   <div class="k91result-main">
     <div class="k91badges"><span>${docClass(d.documentClass)}</span><span>${statusLabel(d.validityStatus)}</span><span>${classLabel(d.classification)}</span>${matchBadge}</div>
     <h4>${esc(d.title||'بدون عنوان')}</h4>
     <p>${esc(d.documentType||'—')} · ${esc(d.subjectArea||'بدون موضوع')} · ${esc(d.issuer||'مرجع نامشخص')}</p>
     ${snippetsBlock(d)}
   </div>
   <div class="k91dates">
     <span>تاریخ تصویب/صدور<b>${fmtDate(d.issuedAt||d.createdAt)}</b></span>
     <span>پایان اعتبار<b>${fmtDate(d.validUntil)}</b></span>
     <span>نسخه<b>${toFa(d.version||1)}</b></span>
   </div>
 </article>`;
}

async function runBankSearch(){
 const form=document.getElementById('k91search'),
       out=document.getElementById('k91results'),
       count=document.getElementById('k91count');
 if(!form||!out)return;
 const fd=new FormData(form),p=new URLSearchParams();
 for(const [k,v] of fd.entries())if(String(v).trim())p.set(k,String(v).trim());
 p.set('snippetLimit','12');
 out.innerHTML='<div class="k76loading">در حال جستجو در بانک اسناد…</div>';
 try{
   const d=await api('/api/v1/knowledge/document-bank?'+p.toString());
   const q=String(fd.get('q')||'').trim();
   if(count){
     count.textContent=q
       ?`${toFa(d.summary?.visible||0)} سند · ${toFa(d.summary?.totalOccurrences||0)} تطابق متنی`
       :`${toFa(d.summary?.visible||0)} سند قابل مشاهده`;
   }
   out.innerHTML=(d.items||[]).length?(d.items||[]).map(resultRow).join(''):'<div class="k76empty">سندی با این معیارها پیدا نشد.</div>';
   persianize(out);
 }catch(e){
   out.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`;
 }
}

async function openBank(){
 const ctx=document.getElementById('workspaceContext');
 if(ctx)ctx.classList.add('k91-hidden-workspace');
 const x=ensureShell(),b=x.querySelector('#k76body');
 b.innerHTML=`<div class="k91hero"><div><b>بانک اطلاعات اسناد سازمان</b><span>هر سند یک نتیجه است و تعداد همه تطابق‌های متنی داخل همان سند جداگانه نمایش داده می‌شود.</span></div><strong id="k91count">—</strong></div>
 <form id="k91search" class="k91search"><label class="k91q">جستجو در عنوان، موضوع، مرجع و متن سند<input name="q" placeholder="مثلاً استقلال حوزه، بودجه فرهنگی، منابع انسانی…"></label><div class="k91filters">
 <label>نوع سند<select name="documentClass"><option value="">همه اسناد</option><option value="upstream">بالادستی</option><option value="general">عمومی</option></select></label>
 <label>وضعیت اعتبار<select name="validity"><option value="">همه وضعیت‌ها</option><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="revoked">لغوشده</option><option value="superseded">جایگزین‌شده</option><option value="unknown">نیازمند احراز</option></select></label>
 <label>طبقه‌بندی<select name="classification"><option value="">همه سطوح مجاز</option><option value="public">عمومی</option><option value="internal">داخلی</option><option value="confidential">محرمانه</option><option value="secret">خیلی محرمانه</option></select></label>
 <label>مرجع تصویب/صدور<input name="issuer"></label><label>موضوع<input name="subject"></label><label>از تاریخ<input type="date" name="from"></label><label>تا تاریخ<input type="date" name="to"></label>
 </div><div class="k91actions"><button type="submit">جستجو</button><button type="reset" class="secondary">پاک‌کردن فیلترها</button></div></form>
 <div class="k91note">نتیجه اصلی در سطح «سند» است؛ اگر یک واژه چندین بار در یک سند تکرار شده باشد، تعداد تطابق‌ها و چند محل نمونه زیر همان سند نمایش داده می‌شود.</div><div id="k91results"></div>`;
 const f=b.querySelector('#k91search');
 f.onsubmit=e=>{e.preventDefault();runBankSearch()};
 f.onreset=()=>setTimeout(runBankSearch,0);
 persianize(x);
 window.scrollTo({top:0,behavior:'smooth'});
 await runBankSearch();
}

document.addEventListener('click',e=>{
 const c=e.target.closest('[data-capability="بانک اسناد"]');
 if(c){
   e.preventDefault();
   e.stopImmediatePropagation();
   openBank();
 }
},true);

let enhancementQueued=false;
function queueEnhancement(){
 if(enhancementQueued)return;
 enhancementQueued=true;
 requestAnimationFrame(()=>{
   enhancementQueued=false;
   enhanceExistingShell(document.getElementById('knowledge076'));
   injectWorkspaceCard();
 });
}
const obs=new MutationObserver(queueEnhancement);
obs.observe(document.documentElement,{subtree:true,childList:true});

document.addEventListener('DOMContentLoaded',queueEnhancement);
queueEnhancement();
})();
