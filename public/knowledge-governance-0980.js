(()=>{
window.__KNOWLEDGE_GOVERNANCE_BUILD__='0.9.9.0.12';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹',fa=v=>String(v??'').replace(/\d/g,d=>FA[d]),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function currentUserName(){
 const named=document.querySelector('[data-user-name],.user-name,.profile-name')?.textContent?.trim();
 if(named)return named;
 const txt=document.body?.innerText||'',m=txt.match(/([آ-ی][آ-ی‌\s]{2,36})\s*[·•]\s*(?:مدیر|کارشناس|پژوهشگر)/);
 return m?m[1].trim():'کاربر واردشده';
}
const api=async(p,o={})=>{
 const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':ORG,'x-role':'admin','x-person-name':encodeURIComponent(currentUserName()),...(o.headers||{})}});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا');return d
};

async function counters(){
 try{
  const d=await api('/api/v1/knowledge/documents'),a=d.items||[];
  let analyzed=0,canonical=0;
  try{const r=await api('/api/v1/knowledge/collaborative-analysis');analyzed=(r.items||[]).filter(x=>x.case).length}catch{}
  try{const k=await api('/api/v1/knowledge/macro-knowledge');canonical=Number(k.summary?.canonicalConcepts||0)}catch{}
  const m={'اسناد بالادستی':a.filter(x=>x.documentClass==='upstream').length,'اسناد عمومی':a.filter(x=>x.documentClass==='general').length,'بانک اسناد':a.length,'تحلیل اسناد':analyzed,'دانش کلان':canonical};
  document.querySelectorAll('.capability-card').forEach(c=>{const n=c.dataset.capability||c.querySelector('b')?.textContent?.trim();if(!(n in m))return;let b=c.querySelector('.k980count');if(!b){b=document.createElement('span');b.className='k980count';c.appendChild(b)}b.textContent=fa(m[n])+(n==='دانش کلان'?' مفهوم':' سند')})
 }catch{}
}
let ct;new MutationObserver(()=>{clearTimeout(ct);ct=setTimeout(counters,100)}).observe(document.documentElement,{childList:true,subtree:true});counters();

function k998ConceptKey(v){
 return String(v||'').replace(/[\u200c\u200d\u200e\u200f]/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
}
function k998ConceptGroups(responses){
 const m=new Map();
 for(const r of (responses||[])){
  const raw=String(r.concept||'').trim();if(!raw)continue;
  const key=k998ConceptKey(raw);if(!key)continue;
  if(!m.has(key))m.set(key,{key,label:raw,responses:[]});
  m.get(key).responses.push(r);
 }
 return [...m.values()].sort((a,b)=>b.label.length-a.label.length);
}
function k998RegexForConcept(raw){
 const norm=String(raw||'').trim();if(!norm)return null;
 const chars=[...norm];
 const body=chars.map(ch=>{
  if(/[\s\u200c\u200d\u200e\u200f]/.test(ch))return '[\\s\\u200c\\u200d\\u200e\\u200f]+';
  if(/[یيى]/.test(ch))return '[یيى]';
  if(/[کك]/.test(ch))return '[کك]';
  return ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 }).join('');
 try{return new RegExp(body,'giu')}catch{return null}
}
function k998HighlightConcepts(root,groups){
 if(!root||!groups?.length)return;
 const walkers=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(w.nextNode())walkers.push(w.currentNode);
 for(const node of walkers){
  const text=node.nodeValue||'';if(!text.trim())continue;
  const matches=[];
  for(const g of groups){
   const rx=k998RegexForConcept(g.label);if(!rx)continue;let m;
   while((m=rx.exec(text))){matches.push({start:m.index,end:m.index+m[0].length,g,text:m[0]});if(!m[0].length)rx.lastIndex++}
  }
  if(!matches.length)continue;
  matches.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
  const picked=[];let end=-1;
  for(const m of matches){if(m.start<end)continue;picked.push(m);end=m.end}
  if(!picked.length)continue;
  const frag=document.createDocumentFragment();let pos=0;
  for(const m of picked){
   if(m.start>pos)frag.appendChild(document.createTextNode(text.slice(pos,m.start)));
   const mark=document.createElement('button');mark.type='button';mark.className='k998-commented-concept';mark.dataset.k998Concept=m.g.key;
   mark.title=`${fa(m.g.responses.length)} دیدگاه خبرگانی`;mark.textContent=text.slice(m.start,m.end);
   const badge=document.createElement('span');badge.textContent=fa(m.g.responses.length);mark.appendChild(badge);frag.appendChild(mark);pos=m.end;
  }
  if(pos<text.length)frag.appendChild(document.createTextNode(text.slice(pos)));
  node.parentNode.replaceChild(frag,node);
 }
}
function k998ExpertView(r){
 const audio=r.audioDataUrl?`<audio controls preload="metadata" src="${esc(r.audioDataUrl)}"></audio>`:'';
 const when=r.createdAt?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(r.createdAt)):'';
 return `<article class="k998expert-comment"><header><div><b>${esc(r.expertName||'کاربر واردشده')}</b><small>${esc(r.stage==='independent_analysis'?'تحلیل مستقل':r.stage==='complementary_review'?'تکمیل و نقد':r.stage==='final_synthesis'?'جمع‌بندی':'دیدگاه خبرگانی')}</small></div>${when?`<time>${esc(when)}</time>`:''}</header>${r.analysis?`<p>${esc(r.analysis)}</p>`:''}${r.evidence?`<blockquote>${esc(r.evidence)}</blockquote>`:''}${audio}</article>`;
}
function k998OpenConceptDialog(group,form,matchedText){
 document.querySelector('.k998concept-popover')?.remove();
 const pop=document.createElement('section');pop.className='k998concept-popover';pop.setAttribute('role','dialog');pop.setAttribute('aria-modal','true');
 pop.innerHTML=`<div class="k998concept-card"><header><div><small>دیدگاه‌های خبرگان درباره مفهوم</small><h4>«${esc(group.label)}»</h4></div><button type="button" data-k998-close aria-label="بستن">×</button></header><div class="k998concept-summary"><b>${fa(group.responses.length)} دیدگاه</b><span>دیدگاه‌های ثبت‌شده برای این مفهوم در همین پرونده پژوهشی</span></div><div class="k998concept-comments">${group.responses.map(k998ExpertView).join('')}</div>${form?`<footer><button type="button" data-k998-comment>ثبت نظر درباره همین مفهوم</button><button type="button" data-k998-dismiss>بستن</button></footer>`:''}</div>`;
 document.body.appendChild(pop);
 const close=()=>pop.remove();
 pop.querySelector('[data-k998-close]')?.addEventListener('click',close);pop.querySelector('[data-k998-dismiss]')?.addEventListener('click',close);
 pop.addEventListener('click',e=>{if(e.target===pop)close()});
 document.addEventListener('keydown',function escClose(e){if(e.key==='Escape'&&pop.isConnected){close();document.removeEventListener('keydown',escClose)}},{capture:true});
 const use=pop.querySelector('[data-k998-comment]');if(use)use.onclick=()=>{
  const concept=form.querySelector('[data-concept]'),evidence=form.querySelector('[data-evidence]');
  if(concept)concept.value=group.label;if(evidence&&!evidence.value)evidence.value=matchedText||group.label;
  close();form.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>form.querySelector('textarea[name="analysis"]')?.focus(),350);
 };
}


function k999Norm(v){return k998ConceptKey(v)}
function k999Plain(v){return String(v||'').replace(/\s+/g,' ').trim()}
function k999SentenceForConcept(docText,concept,fallback=''){
 const text=String(docText||'').replace(/\r/g,'');
 const key=k999Norm(concept);
 const lines=text.split(/\n+/).map(k999Plain).filter(Boolean);
 const line=lines.find(x=>k999Norm(x).includes(key));
 if(line){
   const pieces=line.split(/(?<=[.!؟؛])\s+/).map(k999Plain).filter(Boolean);
   const hit=pieces.find(x=>k999Norm(x).includes(key));
   return (hit||line).slice(0,900);
 }
 return k999Plain(fallback).slice(0,900);
}
const K999_STOP=new Set('از به در با برای که این آن و یا را است بود شود شده می یک خود بر تا اگر اما نیز چه هر نسبت مورد نظر سند مفهوم تحلیل دیدگاه خبره خبرگان مرحله متن'.split(' '));
function k999Tokens(v){
 return k999Plain(v).replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g,' ').split(/\s+/)
  .map(k999Norm).filter(x=>x.length>2&&!K999_STOP.has(x));
}
function k999Jaccard(a,b){
 const A=new Set(k999Tokens(a)),B=new Set(k999Tokens(b));if(!A.size||!B.size)return 0;
 let inter=0;for(const x of A)if(B.has(x))inter++;
 return inter/(A.size+B.size-inter||1);
}
function k999SystemAnalysis(independent,sentence){
 const n=independent.length;if(!n)return 'برای این مفهوم هنوز تحلیل مستقل کافی ثبت نشده است.';
 const evidenceCount=independent.filter(x=>k999Plain(x.evidence)).length;
 const pairs=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs.push(k999Jaccard(independent[i].analysis,independent[j].analysis));
 const avg=pairs.length?pairs.reduce((a,b)=>a+b,0)/pairs.length:1;
 const level=n===1?'فعلاً فقط یک دیدگاه موجود است':avg>=.34?'همپوشانی واژگانی دیدگاه‌ها نسبتاً زیاد است':avg>=.16?'همپوشانی دیدگاه‌ها متوسط است':'تنوع برداشت‌ها بالاست و نیازمند نقد دقیق‌تر است';
 const freq=new Map();for(const r of independent)for(const t of new Set(k999Tokens(r.analysis)))freq.set(t,(freq.get(t)||0)+1);
 const top=[...freq.entries()].sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length).slice(0,5).map(x=>x[0]);
 const ev=evidenceCount===n?'همه دیدگاه‌ها شاهد متنی ثبت کرده‌اند':`${fa(evidenceCount)} از ${fa(n)} دیدگاه دارای شاهد متنی صریح است`;
 const axes=top.length?` محورهای پرتکرار در تحلیل‌ها: ${top.join('، ')}.`:'';
 const src=sentence?' جمله مبنا از سند نیز برای کنترل تفسیر در دسترس است.':'';
 return `سامانه ${fa(n)} تحلیل مستقل را کنار هم قرار داده است؛ ${ev}. ${level}.${axes}${src} در نقد نهایی، هم‌خوانی برداشت‌ها با عبارت کامل سند، اختلاف‌های باقیمانده و ابعاد جاافتاده بررسی شود.`;
}
function k999ConceptModels(responses,docText){
 const map=new Map();
 for(const r of (responses||[])){
   const label=k999Plain(r.concept);if(!label)continue;const key=k999Norm(label);
   if(!map.has(key))map.set(key,{key,label,independent:[],complementary:[],final:[]});
   const g=map.get(key);if(r.stage==='independent_analysis')g.independent.push(r);
   else if(r.stage==='complementary_review')g.complementary.push(r);
   else if(r.stage==='final_synthesis')g.final.push(r);
 }
 for(const g of map.values()){
   const fallback=(g.independent.find(x=>x.evidence)||g.complementary.find(x=>x.evidence)||g.final.find(x=>x.evidence)||{}).evidence||'';
   g.sentence=k999SentenceForConcept(docText,g.label,fallback);
   g.systemAnalysis=k999SystemAnalysis(g.independent,g.sentence);
 }
 return [...map.values()].sort((a,b)=>a.label.localeCompare(b.label,'fa'));
}
function k999MiniResponse(r){
 return `<article class="k999mini-response"><header><b>${esc(r.expertName||'خبره')}</b><span>${r.stage==='independent_analysis'?'مرحله اول':r.stage==='complementary_review'?'نقد خبره ارشد':'جمع‌بندی'}</span></header>${r.analysis?`<p>${esc(r.analysis)}</p>`:''}${r.evidence?`<blockquote>${esc(r.evidence)}</blockquote>`:''}</article>`;
}
function k999StageCards(models,stage){
 if(!models.length)return `<div class="k983empty">هنوز مفهومی از مرحله تحلیل مستقل برای بررسی وجود ندارد.</div>`;
 return models.map(g=>{
   const latestFinal=g.final[g.final.length-1];
   return `<article class="k999concept-review" data-k999-model="${esc(g.key)}">
    <header><div><small>مفهوم</small><h4>${esc(g.label)}</h4></div><span>${fa(g.independent.length)} دیدگاه مرحله اول</span></header>
    <section class="k999source-sentence"><small>جمله کامل مبنا در سند</small><p>${esc(g.sentence||'جمله کامل این مفهوم در متن استخراج‌شده پیدا نشد؛ شاهدهای ثبت‌شده خبرگان مبنای بررسی است.')}</p></section>
    <details ${stage==='final_synthesis'?'open':''}><summary>دیدگاه‌های مرحله اول (${fa(g.independent.length)})</summary><div class="k999responses">${g.independent.map(k999MiniResponse).join('')||'<div class="k983empty">دیدگاهی ثبت نشده است.</div>'}</div></details>
    <section class="k999system-analysis"><header><b>تحلیل و جمع‌بندی سامانه</b><span>تحلیل ساختاری از دیدگاه‌های ثبت‌شده</span></header><p>${esc(g.systemAnalysis)}</p></section>
    ${stage==='final_synthesis'?`<section class="k999senior-review"><header><b>نقد نهایی خبره ارشد</b><span>${fa(g.complementary.length)} نقد ثبت‌شده</span></header><div class="k999responses">${g.complementary.map(k999MiniResponse).join('')||'<div class="k983empty">نقد خبره ارشد برای این مفهوم ثبت نشده است.</div>'}</div></section>`:''}
    ${latestFinal?`<section class="k999final-existing"><b>آخرین جمع‌بندی ثبت‌شده</b><p>${esc(latestFinal.analysis||'')}</p></section>`:''}
    <footer><button type="button" data-k999-select="${esc(g.key)}">${stage==='complementary_review'?'نقد نهایی این مفهوم':stage==='final_synthesis'?'ثبت/ویرایش جمع‌بندی قابل اتکا':'مشاهده'}</button></footer>
   </article>`;
 }).join('');
}

function shell(){
 let x=document.getElementById('knowledge076');
 if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main')?.prepend(x)}
 x.innerHTML=`<div class="k76head k998research-head"><div class="k998research-nav"><button type="button" class="k91back" data-k983-back>← بازگشت به دانش و اسناد سازمان</button><div><small>محیط پژوهشی تحلیل اسناد · 0.9.9.0.10</small><h2>تحلیل خبرگانی اسناد بالادستی</h2><p>خبره متن سند را می‌خواند، مفاهیم دارای دیدگاه را در خود متن می‌بیند و می‌تواند پس از مطالعه نظرات دیگر خبرگان، تحلیل تکمیلی خود را ثبت کند.</p></div></div></div><div id="k983body"><div class="k76loading">در حال دریافت اسناد بالادستی…</div></div>`;
 const back=()=>{x.remove();document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace')};
 x.querySelector('[data-k983-back]').onclick=back;return x
}
async function openAnalysis(){
 document.getElementById('workspaceContext')?.classList.add('k91-hidden-workspace');
 const x=shell(),b=x.querySelector('#k983body');
 try{
  const d=await api('/api/v1/knowledge/collaborative-analysis');
  b.innerHTML=`<div class="k983analysistop"><div><b>گروه خبرگان تحلیل اسناد بالادستی</b><span>هویت هر نظر از کاربر واردشده سامانه ثبت می‌شود؛ نیازی به ورود نام خبره یا نام کارگروه نیست.</span></div><div class="k983rule">فقط اسناد بالادستی</div></div>
  <div class="k983cases">${(d.items||[]).length?(d.items||[]).map(i=>{const c=i.case;return `<article><div><small>${esc(i.document.documentType||'سند بالادستی')}</small><b>${esc(i.document.title)}</b><span>${c?`${esc(c.stageLabel)} · ${fa(c.summary?.total||0)} یادداشت خبرگانی`:'آماده ایجاد پرونده تحلیل'}</span></div><button data-k983-case="${esc(i.document.id)}">${c?.stage==='approved'?'مشاهده سوابق مفهوم‌سازی':c?'ورود به میز پژوهش':'شروع تحلیل'}</button></article>`}).join(''):'<div class="k76empty">سند بالادستی برای تحلیل وجود ندارد.</div>'}</div><div id="k983detail"></div>`;
  b.querySelectorAll('[data-k983-case]').forEach(q=>q.onclick=()=>openCase(q.dataset.k983Case));
 }catch(e){b.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}
function responseHtml(r){
 const audio=r.audioDataUrl?`<audio controls preload="metadata" src="${esc(r.audioDataUrl)}"></audio>`:'';
 return `<article class="k983note"><header><b>${esc(r.expertName||'کاربر واردشده')}</b><span>${esc(r.stage==='independent_analysis'?'تحلیل مستقل':r.stage==='complementary_review'?'تکمیل و نقد':'جمع‌بندی')}</span></header>
 ${r.concept?`<div class="k983concept">«${esc(r.concept)}»</div>`:''}
 ${r.evidence?`<blockquote>${esc(r.evidence)}</blockquote>`:''}
 ${r.analysis?`<p>${esc(r.analysis)}</p>`:''}${audio}</article>`;
}
function stageLabel(s){return ({independent_analysis:'تحلیل مستقل خبرگان',complementary_review:'تکمیل، نقد و مقایسه',final_synthesis:'جمع‌بندی و نهایی‌سازی',approved:'تأیید نهایی'})[s]||s}
async function blobToDataUrl(blob){return await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(blob)})}

async function openCase(id){
 const z=document.getElementById('k983detail');if(!z)return;z.innerHTML='<div class="k76loading">در حال آماده‌سازی میز پژوهش…</div>';
 let d=await api('/api/v1/knowledge/collaborative-analysis?documentId='+encodeURIComponent(id));
 if(!d.case){await api('/api/v1/knowledge/collaborative-analysis',{method:'POST',body:JSON.stringify({documentId:id})});d=await api('/api/v1/knowledge/collaborative-analysis?documentId='+encodeURIComponent(id))}
 let docText='';
 try{const bd=await api('/api/v1/knowledge/document-bank?documentId='+encodeURIComponent(id)+'&detail=1');docText=String((bd.items||[])[0]?.fullText||'').trim()}catch{}
 const c=d.case,rs=d.responses||[],conceptGroups=k998ConceptGroups(rs),models=k999ConceptModels(rs,docText),ix=['independent_analysis','complementary_review','final_synthesis','approved'].indexOf(c.stage);
 const stage1=c.stage==='independent_analysis',stage2=c.stage==='complementary_review',stage3=c.stage==='final_synthesis',approved=c.stage==='approved';

 const mainHtml=stage1?`
   <main class="k983paper">
    <div class="k983paperbar"><div><b>متن سند بالادستی</b><span>مفاهیم دارای دیدگاه خبرگانی با رنگ مجزا مشخص شده‌اند؛ برای مشاهده نظرات روی آن‌ها کلیک کنید.</span></div><em>${conceptGroups.length?`${fa(conceptGroups.length)} مفهوم دارای دیدگاه`:'هنوز مفهومی دارای دیدگاه نیست'}</em></div>
    <div class="k983doctext" tabindex="0">${docText?'<p>'+esc(docText).replace(/\n+/g,'</p><p>')+'</p>':'متن استخراج‌شده سند در دسترس نیست.'}</div>
   </main>`:
   `<main class="k999review-board">
      <div class="k999review-head"><div><small>${stage2?'مرحله دوم · تکمیل و نقد':'مرحله سوم · جمع‌بندی'}</small><h3>${stage2?'بررسی مفاهیم و نقد خبره ارشد':'تدوین جمع‌بندی قابل اتکا'}</h3><p>${stage2?'هر مفهوم همراه با جمله کامل سند، دیدگاه‌های مرحله اول و تحلیل سامانه ارائه می‌شود.':'برای هر مفهوم، دیدگاه‌های مرحله اول، تحلیل سامانه و نقد نهایی خبره ارشد کنار هم دیده می‌شود تا جمع‌بندی نهایی ثبت شود.'}</p></div><span>${fa(models.length)} مفهوم</span></div>
      <div class="k999concept-list">${k999StageCards(models,stage2?'complementary_review':'final_synthesis')}</div>
    </main>`;

 const formTitle=stage1?'ثبت یادداشت خبرگانی':stage2?'ثبت نقد نهایی خبره ارشد':stage3?'ثبت جمع‌بندی قابل اتکا':'';
 const analysisLabel=stage1?'یادداشت تحلیلی':stage2?'نقد نهایی خبره ارشد':'جمع‌بندی نهایی و قابل اتکا';
 const analysisPlaceholder=stage1?'نظر، تفسیر، نقد یا توضیح تکمیلی خود را ثبت کنید':stage2?'با توجه به جمله کامل سند، دیدگاه‌های مرحله اول و تحلیل سامانه، نقد نهایی خود را بنویسید':'تعریف یا جمع‌بندی نهایی مفهوم را به‌صورت روشن، مستند و قابل اتکا تدوین کنید';
 const formHtml=!approved?`<form id="k983annotationform">
      <label>مفهوم انتخاب‌شده<input name="concept" data-concept ${stage1?'placeholder="از متن سند انتخاب کنید یا در صورت نیاز بنویسید"':'readonly placeholder="از فهرست مفاهیم انتخاب کنید"' }></label>
      <label>${stage1?'شاهد متنی':'جمله کامل مبنا'}<textarea name="evidence" data-evidence rows="3" ${stage1?'placeholder="با انتخاب متن، این بخش خودکار تکمیل می‌شود"':'readonly'}></textarea></label>
      ${!stage1?`<section class="k999sidebar-system" data-system-box hidden><b>تحلیل سامانه</b><p data-system-text></p></section>`:''}
      <label>${analysisLabel}<textarea name="analysis" rows="7" placeholder="${analysisPlaceholder}"></textarea></label>
      <div class="k983voice">
       <button type="button" data-record>● ضبط نظر صوتی</button><button type="button" data-stop disabled>■ پایان ضبط</button>
       <label class="k983audiofile">یا فایل صوتی<input type="file" accept="audio/*" data-audio-file></label>
       <span data-record-status>می‌توانید به جای تایپ، نظر خود را صوتی ثبت کنید.</span>
       <audio controls data-audio-preview hidden></audio>
      </div>
      <button class="k76primary" type="submit">${formTitle}</button><span data-save-status></span>
     </form>`:`<div class="k983approved">✓ نسخه نهایی این پرونده تأیید شده است. سوابق شکل‌گیری و نهایی‌شدن مفاهیم در پرونده حفظ شده است.</div>`;

 z.innerHTML=`<section class="k983research">
  <div class="k983researchhead"><div><small>پرونده تحلیل · ${esc(currentUserName())}</small><h3>${esc(d.document.title)}</h3></div><span>${esc(stageLabel(c.stage))}</span></div>
  <div class="k983steps">${['تحلیل مستقل خبرگان','تکمیل و نقد','جمع‌بندی','تأیید نهایی'].map((st,i)=>`<span class="${i<=ix?'on':''}">${fa(i+1)}. ${st}</span>`).join('')}</div>
  <div class="k983researchgrid ${stage1?'':'k999stage-review'}">
   ${mainHtml}
   <aside class="k983annotation">
    <div class="k983questionbox"><b>راهنمای این مرحله</b>${(c.questions||[]).map(q=>`<p>• ${esc(q)}</p>`).join('')}</div>
    ${formHtml}
   </aside>
  </div>
  ${stage1?`<section class="k998history-summary"><div><b>دیدگاه‌های خبرگان در متن سند</b><span>${rs.length?`${fa(rs.length)} یادداشت روی ${fa(conceptGroups.length)} مفهوم ثبت شده است. برای مشاهده هر مجموعه، روی مفهوم رنگی در متن کلیک کنید.`:'هنوز دیدگاهی ثبت نشده است. با انتخاب یک مفهوم از متن، اولین یادداشت را ثبت کنید.'}</span></div>${conceptGroups.length?`<div class="k998concept-index">${conceptGroups.slice(0,8).map(g=>`<button type="button" data-k998-index="${esc(g.key)}">${esc(g.label)} <small>${fa(g.responses.length)}</small></button>`).join('')}${conceptGroups.length>8?`<em>+ ${fa(conceptGroups.length-8)} مفهوم دیگر در متن</em>`:''}</div>`:''}</section>`:
  `<section class="k999lineage-note"><b>ردپای نهایی‌شدن مفهوم</b><span>تحلیل مستقل، جمع‌بندی سامانه، نقد خبره ارشد و جمع‌بندی نهایی به‌صورت مرحله‌ای در پرونده نگهداری می‌شوند؛ تأیید نهایی، نسخه قابل اتکای هر مفهوم را به‌همراه ارجاع به پاسخ‌های مبنا ثبت می‌کند.</span></section>`}
  ${!approved?`<div class="k983advance"><button data-k983-advance>${stage3?'تأیید نسخه نهایی و ثبت مفاهیم قابل اتکا':'پایان این مرحله و ورود به مرحله بعد'}</button><small>${stage3?'با تأیید، آخرین جمع‌بندی هر مفهوم به‌عنوان نسخه قابل اتکا ثبت می‌شود و تمام سوابق قبلی باقی می‌ماند.':'همه یادداشت‌های مراحل قبلی و دیدگاه‌های اقلیت در پرونده باقی می‌مانند.'}</small></div>`:''}
 </section>`;

 const textBox=z.querySelector('.k983doctext'),form=z.querySelector('#k983annotationform');
 if(stage1&&textBox&&conceptGroups.length){
  const groupMap=new Map(conceptGroups.map(g=>[g.key,g]));k998HighlightConcepts(textBox,conceptGroups);
  textBox.addEventListener('click',e=>{const hit=e.target.closest?.('[data-k998-concept]');if(!hit)return;e.preventDefault();e.stopPropagation();const g=groupMap.get(hit.dataset.k998Concept);if(g)k998OpenConceptDialog(g,form,hit.childNodes?.[0]?.nodeValue||hit.textContent)});
  z.querySelectorAll('[data-k998-index]').forEach(btn=>btn.onclick=()=>{const g=groupMap.get(btn.dataset.k998Index);if(!g)return;const hit=[...textBox.querySelectorAll('[data-k998-concept]')].find(x=>x.dataset.k998Concept===g.key);hit?.scrollIntoView({behavior:'smooth',block:'center'});if(hit){hit.classList.add('k998-pulse');setTimeout(()=>hit.classList.remove('k998-pulse'),1100)}k998OpenConceptDialog(g,form,hit?.childNodes?.[0]?.nodeValue||g.label)});
 }
 if(form){
  const modelMap=new Map(models.map(g=>[g.key,g]));
  if(!stage1){
   z.querySelectorAll('[data-k999-select]').forEach(btn=>btn.onclick=()=>{
    const g=modelMap.get(btn.dataset.k999Select);if(!g)return;
    form.querySelector('[data-concept]').value=g.label;
    form.querySelector('[data-evidence]').value=g.sentence||'';
    form.dataset.k999Key=g.key;
    form.dataset.k999System=g.systemAnalysis;
    const sb=form.querySelector('[data-system-box]'),st=form.querySelector('[data-system-text]');
    if(sb&&st){st.textContent=g.systemAnalysis;sb.hidden=false}
    if(stage3){
      const latest=g.final[g.final.length-1];
      form.querySelector('textarea[name="analysis"]').value=latest?.analysis||'';
    }else form.querySelector('textarea[name="analysis"]').value='';
    form.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>form.querySelector('textarea[name="analysis"]')?.focus(),300);
   });
  }else if(textBox){
   const pullSelection=()=>{
    const sel=window.getSelection(),txt=String(sel||'').replace(/\s+/g,' ').trim();
    if(!txt||txt.length<2||!textBox.contains(sel.anchorNode)||!textBox.contains(sel.focusNode))return;
    const concept=form.querySelector('[data-concept]'),evidence=form.querySelector('[data-evidence]');
    concept.value=txt.length<=140?txt:txt.slice(0,137)+'…';evidence.value=txt;
    form.classList.add('k983selection-ready');setTimeout(()=>form.classList.remove('k983selection-ready'),700);
   };
   textBox.addEventListener('mouseup',pullSelection);textBox.addEventListener('keyup',pullSelection);
  }

  let recorder=null,chunks=[],audioDataUrl='';
  const record=form.querySelector('[data-record]'),stop=form.querySelector('[data-stop]'),status=form.querySelector('[data-record-status]'),preview=form.querySelector('[data-audio-preview]'),file=form.querySelector('[data-audio-file]');
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){record.disabled=true;status.textContent='ضبط مستقیم در این مرورگر در دسترس نیست؛ می‌توانید فایل صوتی انتخاب کنید.'}
  record.onclick=async()=>{
   try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=async()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});stream.getTracks().forEach(t=>t.stop());if(blob.size>1572864){audioDataUrl='';status.textContent='فایل ضبط‌شده بزرگ‌تر از ۱.۵ مگابایت است؛ لطفاً کوتاه‌تر ضبط کنید.';return}audioDataUrl=await blobToDataUrl(blob);preview.src=audioDataUrl;preview.hidden=false;status.textContent='نظر صوتی آماده ثبت است.'};
    recorder.start();record.disabled=true;stop.disabled=false;status.textContent='در حال ضبط… حداکثر حدود ۹۰ ثانیه برای این نسخه آزمایشی.';
    setTimeout(()=>{if(recorder?.state==='recording')stop.click()},90000);
   }catch(e){status.textContent='دسترسی به میکروفن ممکن نشد: '+e.message}
  };
  stop.onclick=()=>{if(recorder?.state==='recording')recorder.stop();record.disabled=false;stop.disabled=true};
  file.onchange=async()=>{const f=file.files?.[0];if(!f)return;if(f.size>1572864){status.textContent='فایل صوتی باید حداکثر ۱.۵ مگابایت باشد.';file.value='';return}audioDataUrl=await blobToDataUrl(f);preview.src=audioDataUrl;preview.hidden=false;status.textContent='فایل صوتی آماده ثبت است.'};

  form.onsubmit=async e=>{
   e.preventDefault();const fd=new FormData(form),analysis=String(fd.get('analysis')||'').trim(),concept=String(fd.get('concept')||'').trim(),evidence=String(fd.get('evidence')||'').trim(),st=form.querySelector('[data-save-status]');
   if(!analysis&&!audioDataUrl){st.textContent=stage3?'جمع‌بندی نهایی را ثبت کنید.':'یک یادداشت متنی یا صوتی ثبت کنید.';return}
   if(!concept&&!evidence){st.textContent=stage1?'ابتدا یک مفهوم/شاهد از متن انتخاب کنید یا آن را وارد کنید.':'ابتدا یکی از مفاهیم فهرست را انتخاب کنید.';return}
   const g=!stage1?modelMap.get(form.dataset.k999Key):null;
   const reviewBasisIds=g?[...g.independent,...g.complementary].map(x=>x.id):[];
   st.textContent=stage3?'در حال ثبت جمع‌بندی قابل اتکا…':stage2?'در حال ثبت نقد خبره ارشد…':'در حال ثبت یادداشت خبرگانی…';
   try{
    await api('/api/v1/knowledge/collaborative-analysis',{method:'PATCH',body:JSON.stringify({
      caseId:c.id,action:'respond',concept,analysis,evidence,sourceSentence:g?.sentence||evidence,
      systemAnalysis:g?.systemAnalysis||'',reviewBasisIds,audioDataUrl,
      groupLabel:'گروه خبرگان تحلیل اسناد بالادستی'
    })});
    openCase(id);
   }catch(err){st.textContent=err.message}
  };
 }
 const adv=z.querySelector('[data-k983-advance]');if(adv)adv.onclick=async()=>{
  const msg=stage3?'نسخه نهایی تأیید شود و آخرین جمع‌بندی هر مفهوم به‌عنوان «جمع‌بندی قابل اتکا» ثبت گردد؟':'مرحله جاری پایان یابد و پرونده به مرحله بعد منتقل شود؟';
  if(confirm(msg)){await api('/api/v1/knowledge/collaborative-analysis',{method:'PATCH',body:JSON.stringify({caseId:c.id,action:'advance'})});openCase(id)}
 };
 z.scrollIntoView({behavior:'smooth',block:'start'});
}

function k9910MacroShell(){
 document.getElementById('workspaceContext')?.classList.add('k91-hidden-workspace');
 let x=document.getElementById('knowledge076');if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main')?.prepend(x)}
 x.innerHTML=`<div class="k76head k9910macro-head"><div class="k998research-nav"><button type="button" class="k91back" data-k9910-back>← بازگشت به دانش و اسناد سازمان</button><div><small>دانش کلان · تثبیت معنایی بین‌اسنادی · ۰.۹.۹.۰.۱۲</small><h2>دانش مفهومی معتبر سازمان</h2><p>مفاهیم نهایی‌شده اسناد در اینجا با دانش موجود سازمان تطبیق داده و به مفهوم سازمانی Canonical تبدیل می‌شوند؛ شبکه مفاهیم، کمّی‌سازی، شاخص و تحقق در محیط «جهت‌گیری سازمان» انجام می‌شود.</p></div></div></div><div id="k9910macrobody"><div class="k76loading">در حال آماده‌سازی دانش کلان…</div></div>`;
 x.querySelector('[data-k9910-back]').onclick=()=>{x.remove();document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace')};return x
}
function k9910SourceCard(x){
 const sug=(x.suggestions||[])[0];
 return `<article class="k9910source ${x.status==='linked'?'linked':''}">
  <header><div><small>${esc(x.documentType||'سند بالادستی')}</small><h4>${esc(x.concept)}</h4></div><span>${x.status==='linked'?'تطبیق‌شده':'نیازمند تطبیق'}</span></header>
  <p>${esc(x.definition||'تعریف نهایی ثبت نشده است.')}</p>
  <div class="k9910origin">منشأ: ${esc(x.documentTitle)}</div>
  ${sug&&x.status!=='linked'?`<div class="k9910suggest"><b>پیشنهاد سامانه</b><span>شباهت احتمالی با «${esc(sug.title)}» · ${fa(Math.round(sug.similarity*100))}٪</span></div>`:''}
  ${x.status!=='linked'?`<footer><button type="button" data-k9910-new="${esc(x.id)}">ایجاد مفهوم سازمانی</button>${sug?`<button type="button" data-k9910-link="${esc(x.id)}" data-canonical="${esc(sug.id)}">تطبیق با «${esc(sug.title)}»</button>`:''}<button type="button" class="ghost" data-k9910-issue="${esc(x.id)}" data-canonical="${esc(sug?.id||'')}">نیازمند بررسی</button></footer>`:''}
 </article>`;
}
function k9910CanonicalCard(c){
 return `<article class="k9910canonical"><header><div><small>Canonical Organizational Concept</small><h4>${esc(c.title)}</h4></div><span>${fa(c.sourceCount||0)} منشأ</span></header><p>${esc(c.definition||'')}</p><div class="k9910sources">${(c.sources||[]).slice(0,5).map(x=>`<span>${esc(x.documentTitle||x.concept)}</span>`).join('')||'<span>بدون منشأ نمایشی</span>'}</div><footer><small>وضعیت: مفهوم معتبر سازمانی · آماده بررسی برای ورود به محیط جهت‌گیری</small></footer></article>`;
}
async function openMacroKnowledge(){
 const x=k9910MacroShell(),b=x.querySelector('#k9910macrobody');
 try{
  const d=await api('/api/v1/knowledge/macro-knowledge'),sm=d.summary||{},src=d.sourceConcepts||[],can=d.canonicalConcepts||[],issues=d.issues||[];
  b.innerHTML=`<section class="k9910contract"><b>مرز این محیط</b><span>دانش کلان فقط «معنای معتبر سازمانی» را تثبیت می‌کند.</span><em>Canonical Concept ≠ Directional Concept</em></section>
   <section class="k9910stats"><article><b>${fa(sm.validatedConcepts||0)}</b><span>مفهوم معتبر اسناد</span></article><article><b>${fa(sm.newForReview||0)}</b><span>نیازمند تطبیق</span></article><article><b>${fa(sm.canonicalConcepts||0)}</b><span>مفهوم سازمانی تثبیت‌شده</span></article><article><b>${fa(sm.openIssues||0)}</b><span>ابهام یا تعارض باز</span></article></section>
   <div class="k9910tabs"><button class="on" data-k9910-tab="new">مفاهیم جدید برای تطبیق</button><button data-k9910-tab="canonical">مفاهیم سازمانی تثبیت‌شده</button><button data-k9910-tab="issues">ابهام‌ها و تعارض‌ها</button></div>
   <section data-k9910-pane="new" class="k9910pane">${src.filter(x=>x.status==='new').length?src.filter(x=>x.status==='new').map(k9910SourceCard).join(''):'<div class="k76empty">همه مفاهیم نهایی‌شده فعلی تعیین تکلیف شده‌اند.</div>'}</section>
   <section data-k9910-pane="canonical" class="k9910pane" hidden>${can.length?can.map(k9910CanonicalCard).join(''):'<div class="k76empty">هنوز مفهوم سازمانی Canonical تثبیت نشده است.</div>'}</section>
   <section data-k9910-pane="issues" class="k9910pane" hidden>${issues.length?issues.map(i=>`<article class="k9910issue"><b>${esc(i.issueType||'نیازمند بررسی')}</b><p>${esc(i.note||'')}</p></article>`).join(''):'<div class="k76empty">ابهام یا تعارض باز ثبت نشده است.</div>'}</section>`;
  b.querySelectorAll('[data-k9910-tab]').forEach(btn=>btn.onclick=()=>{b.querySelectorAll('[data-k9910-tab]').forEach(q=>q.classList.toggle('on',q===btn));b.querySelectorAll('[data-k9910-pane]').forEach(q=>q.hidden=q.dataset.k9910Pane!==btn.dataset.k9910Tab)});
  b.querySelectorAll('[data-k9910-new]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await api('/api/v1/knowledge/macro-knowledge',{method:'POST',body:JSON.stringify({action:'create_canonical',sourceConceptId:btn.dataset.k9910New})});await openMacroKnowledge();counters()}catch(e){alert(e.message)}});
  b.querySelectorAll('[data-k9910-link]').forEach(btn=>btn.onclick=async()=>{if(!confirm('این مفهوم به مفهوم سازمانی پیشنهادی متصل شود؟ مفهوم سندی و سابقه آن حذف نخواهد شد.'))return;btn.disabled=true;try{await api('/api/v1/knowledge/macro-knowledge',{method:'POST',body:JSON.stringify({action:'link_existing',sourceConceptId:btn.dataset.k9910Link,canonicalId:btn.dataset.canonical,relation:'same_as'})});await openMacroKnowledge();counters()}catch(e){alert(e.message)}});
  b.querySelectorAll('[data-k9910-issue]').forEach(btn=>btn.onclick=async()=>{const note=prompt('دلیل نیاز به بررسی معنایی را ثبت کنید:','شباهت یا تفاوت معنایی نیازمند بررسی انسانی است.');if(note===null)return;try{await api('/api/v1/knowledge/macro-knowledge',{method:'POST',body:JSON.stringify({action:'flag_issue',sourceConceptId:btn.dataset.k9910Issue,canonicalId:btn.dataset.canonical,note})});await openMacroKnowledge();counters()}catch(e){alert(e.message)}});
 }catch(e){b.innerHTML=`<div class="k76empty">${esc(e.message)}</div>`}
}

window.addEventListener('click',e=>{const c=e.target.closest?.('[data-capability="تحلیل اسناد"]');if(!c)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAnalysis()},true);
let replacing=false;new MutationObserver(()=>{if(replacing)return;const x=document.getElementById('knowledge076');if(x&&x.querySelector('#k76body')&&!x.querySelector('#k983body')&&/تحلیل شناختی اسناد/.test(x.textContent||'')){replacing=true;Promise.resolve(openAnalysis()).finally(()=>setTimeout(()=>replacing=false,100))}}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('click',e=>{const c=e.target.closest?.('[data-capability="دانش کلان"]');if(!c)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openMacroKnowledge()},true);
})();