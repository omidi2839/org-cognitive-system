(()=>{
window.__KNOWLEDGE_GOVERNANCE_BUILD__='0.9.9.0.8';
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
  const d=await api('/api/v1/knowledge/documents'),a=d.items||[],m={'اسناد بالادستی':a.filter(x=>x.documentClass==='upstream').length,'اسناد عمومی':a.filter(x=>x.documentClass==='general').length,'بانک اسناد':a.length};
  document.querySelectorAll('.capability-card').forEach(c=>{const n=c.dataset.capability||c.querySelector('b')?.textContent?.trim();if(!(n in m))return;let b=c.querySelector('.k980count');if(!b){b=document.createElement('span');b.className='k980count';c.appendChild(b)}b.textContent=fa(m[n])+' سند'})
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

function shell(){
 let x=document.getElementById('knowledge076');
 if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main')?.prepend(x)}
 x.innerHTML=`<div class="k76head k998research-head"><div class="k998research-nav"><button type="button" class="k91back" data-k983-back>← بازگشت به دانش و اسناد سازمان</button><div><small>محیط پژوهشی تحلیل اسناد · 0.9.9.0.8</small><h2>تحلیل خبرگانی اسناد بالادستی</h2><p>خبره متن سند را می‌خواند، مفاهیم دارای دیدگاه را در خود متن می‌بیند و می‌تواند پس از مطالعه نظرات دیگر خبرگان، تحلیل تکمیلی خود را ثبت کند.</p></div></div></div><div id="k983body"><div class="k76loading">در حال دریافت اسناد بالادستی…</div></div>`;
 const back=()=>{x.remove();document.getElementById('workspaceContext')?.classList.remove('k91-hidden-workspace')};
 x.querySelector('[data-k983-back]').onclick=back;return x
}
async function openAnalysis(){
 document.getElementById('workspaceContext')?.classList.add('k91-hidden-workspace');
 const x=shell(),b=x.querySelector('#k983body');
 try{
  const d=await api('/api/v1/knowledge/collaborative-analysis');
  b.innerHTML=`<div class="k983analysistop"><div><b>گروه خبرگان تحلیل اسناد بالادستی</b><span>هویت هر نظر از کاربر واردشده سامانه ثبت می‌شود؛ نیازی به ورود نام خبره یا نام کارگروه نیست.</span></div><div class="k983rule">فقط اسناد بالادستی</div></div>
  <div class="k983cases">${(d.items||[]).length?(d.items||[]).map(i=>{const c=i.case;return `<article><div><small>${esc(i.document.documentType||'سند بالادستی')}</small><b>${esc(i.document.title)}</b><span>${c?`${esc(c.stageLabel)} · ${fa(c.summary?.total||0)} یادداشت خبرگانی`:'آماده ایجاد پرونده تحلیل'}</span></div><button data-k983-case="${esc(i.document.id)}">${c?'ورود به میز پژوهش':'شروع تحلیل'}</button></article>`}).join(''):'<div class="k76empty">سند بالادستی برای تحلیل وجود ندارد.</div>'}</div><div id="k983detail"></div>`;
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
 const c=d.case,rs=d.responses||[],conceptGroups=k998ConceptGroups(rs),ix=['independent_analysis','complementary_review','final_synthesis','approved'].indexOf(c.stage);
 z.innerHTML=`<section class="k983research">
  <div class="k983researchhead"><div><small>پرونده تحلیل · ${esc(currentUserName())}</small><h3>${esc(d.document.title)}</h3></div><span>${esc(stageLabel(c.stage))}</span></div>
  <div class="k983steps">${['تحلیل مستقل خبرگان','تکمیل و نقد','جمع‌بندی','تأیید نهایی'].map((s,i)=>`<span class="${i<=ix?'on':''}">${fa(i+1)}. ${s}</span>`).join('')}</div>
  <div class="k983researchgrid">
   <main class="k983paper">
    <div class="k983paperbar"><div><b>متن سند بالادستی</b><span>مفاهیم دارای دیدگاه خبرگانی با رنگ مجزا مشخص شده‌اند؛ برای مشاهده نظرات روی آن‌ها کلیک کنید.</span></div><em>${conceptGroups.length?`${fa(conceptGroups.length)} مفهوم دارای دیدگاه`:'هنوز مفهومی دارای دیدگاه نیست'}</em></div>
    <div class="k983doctext" tabindex="0">${docText?esc(docText).replace(/\n+/g,'</p><p>'):'متن استخراج‌شده سند در دسترس نیست.'}</div>
   </main>
   <aside class="k983annotation">
    <div class="k983questionbox"><b>راهنمای این مرحله</b>${(c.questions||[]).map(q=>`<p>• ${esc(q)}</p>`).join('')}</div>
    ${c.stage!=='approved'?`<form id="k983annotationform">
      <label>مفهوم انتخاب‌شده<input name="concept" data-concept placeholder="از متن سند انتخاب کنید یا در صورت نیاز بنویسید"></label>
      <label>شاهد متنی<textarea name="evidence" data-evidence rows="3" placeholder="با انتخاب متن، این بخش خودکار تکمیل می‌شود"></textarea></label>
      <label>یادداشت تحلیلی<textarea name="analysis" rows="5" placeholder="نظر، تفسیر، نقد یا توضیح تکمیلی خود را ثبت کنید"></textarea></label>
      <div class="k983voice">
       <button type="button" data-record>● ضبط نظر صوتی</button><button type="button" data-stop disabled>■ پایان ضبط</button>
       <label class="k983audiofile">یا فایل صوتی<input type="file" accept="audio/*" data-audio-file></label>
       <span data-record-status>می‌توانید به جای تایپ، نظر خود را صوتی ثبت کنید.</span>
       <audio controls data-audio-preview hidden></audio>
      </div>
      <button class="k76primary" type="submit">ثبت یادداشت خبرگانی</button><span data-save-status></span>
     </form>`:`<div class="k983approved">✓ نسخه نهایی این پرونده تأیید شده است.</div>`}
   </aside>
  </div>
  <section class="k998history-summary"><div><b>دیدگاه‌های خبرگان در متن سند</b><span>${rs.length?`${fa(rs.length)} یادداشت روی ${fa(conceptGroups.length)} مفهوم ثبت شده است. برای مشاهده هر مجموعه، روی مفهوم رنگی در متن کلیک کنید.`:'هنوز دیدگاهی ثبت نشده است. با انتخاب یک مفهوم از متن، اولین یادداشت را ثبت کنید.'}</span></div>${conceptGroups.length?`<div class="k998concept-index">${conceptGroups.slice(0,8).map(g=>`<button type="button" data-k998-index="${esc(g.key)}">${esc(g.label)} <small>${fa(g.responses.length)}</small></button>`).join('')}${conceptGroups.length>8?`<em>+ ${fa(conceptGroups.length-8)} مفهوم دیگر در متن</em>`:''}</div>`:''}</section>
  ${c.stage!=='approved'?`<div class="k983advance"><button data-k983-advance>${c.stage==='final_synthesis'?'تأیید نسخه نهایی':'پایان این مرحله و ورود به مرحله بعد'}</button><small>همه یادداشت‌های مراحل قبلی و دیدگاه‌های اقلیت در پرونده باقی می‌مانند.</small></div>`:''}
 </section>`;

 const textBox=z.querySelector('.k983doctext'),form=z.querySelector('#k983annotationform');
 if(textBox&&conceptGroups.length){
  const groupMap=new Map(conceptGroups.map(g=>[g.key,g]));k998HighlightConcepts(textBox,conceptGroups);
  textBox.addEventListener('click',e=>{const hit=e.target.closest?.('[data-k998-concept]');if(!hit)return;e.preventDefault();e.stopPropagation();const g=groupMap.get(hit.dataset.k998Concept);if(g)k998OpenConceptDialog(g,form,hit.childNodes?.[0]?.nodeValue||hit.textContent)});
  z.querySelectorAll('[data-k998-index]').forEach(btn=>btn.onclick=()=>{const g=groupMap.get(btn.dataset.k998Index);if(!g)return;const hit=[...textBox.querySelectorAll('[data-k998-concept]')].find(x=>x.dataset.k998Concept===g.key);hit?.scrollIntoView({behavior:'smooth',block:'center'});if(hit){hit.classList.add('k998-pulse');setTimeout(()=>hit.classList.remove('k998-pulse'),1100)}k998OpenConceptDialog(g,form,hit?.childNodes?.[0]?.nodeValue||g.label)});
 }
 if(textBox&&form){
  const pullSelection=()=>{
   const sel=window.getSelection(),txt=String(sel||'').replace(/\s+/g,' ').trim();
   if(!txt||txt.length<2||!textBox.contains(sel.anchorNode)||!textBox.contains(sel.focusNode))return;
   const concept=form.querySelector('[data-concept]'),evidence=form.querySelector('[data-evidence]');
   concept.value=txt.length<=140?txt:txt.slice(0,137)+'…';evidence.value=txt;
   form.classList.add('k983selection-ready');setTimeout(()=>form.classList.remove('k983selection-ready'),700);
  };
  textBox.addEventListener('mouseup',pullSelection);textBox.addEventListener('keyup',pullSelection);

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
   if(!analysis&&!audioDataUrl){st.textContent='یک یادداشت متنی یا صوتی ثبت کنید.';return}
   if(!concept&&!evidence){st.textContent='ابتدا یک مفهوم/شاهد از متن انتخاب کنید یا آن را وارد کنید.';return}
   st.textContent='در حال ثبت یادداشت خبرگانی…';
   try{
    await api('/api/v1/knowledge/collaborative-analysis',{method:'PATCH',body:JSON.stringify({caseId:c.id,action:'respond',concept,analysis,evidence,audioDataUrl,groupLabel:'گروه خبرگان تحلیل اسناد بالادستی'})});
    openCase(id);
   }catch(err){st.textContent=err.message}
  };
 }
 const adv=z.querySelector('[data-k983-advance]');if(adv)adv.onclick=async()=>{if(confirm('مرحله جاری پایان یابد و پرونده به مرحله بعد منتقل شود؟')){await api('/api/v1/knowledge/collaborative-analysis',{method:'PATCH',body:JSON.stringify({caseId:c.id,action:'advance'})});openCase(id)}};
 z.scrollIntoView({behavior:'smooth',block:'start'});
}
window.addEventListener('click',e=>{const c=e.target.closest?.('[data-capability="تحلیل اسناد"]');if(!c)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAnalysis()},true);
let replacing=false;new MutationObserver(()=>{if(replacing)return;const x=document.getElementById('knowledge076');if(x&&x.querySelector('#k76body')&&!x.querySelector('#k983body')&&/تحلیل شناختی اسناد/.test(x.textContent||'')){replacing=true;Promise.resolve(openAnalysis()).finally(()=>setTimeout(()=>replacing=false,100))}}).observe(document.documentElement,{childList:true,subtree:true});
})();