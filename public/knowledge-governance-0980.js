(()=>{
window.__KNOWLEDGE_GOVERNANCE_BUILD__='0.9.8.3';
const ORG='ORG:SYN-001',FA='۰۱۲۳۴۵۶۷۸۹',fa=v=>String(v??'').replace(/\d/g,d=>FA[d]),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function currentUserName(){
 const named=document.querySelector('[data-user-name],.user-name,.profile-name')?.textContent?.trim();
 if(named)return named;
 const txt=document.body?.innerText||'',m=txt.match(/([آ-ی][آ-ی‌\s]{2,36})\s*[·•]\s*(?:مدیر|کارشناس|پژوهشگر)/);
 return m?m[1].trim():'کاربر واردشده';
}
const api=async(p,o={})=>{
 const r=await fetch(p,{...o,headers:{'content-type':'application/json','x-org-id':ORG,'x-role':'admin','x-person-name':currentUserName(),...(o.headers||{})}});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا');return d
};

async function counters(){
 try{
  const d=await api('/api/v1/knowledge/documents'),a=d.items||[],m={'اسناد بالادستی':a.filter(x=>x.documentClass==='upstream').length,'اسناد عمومی':a.filter(x=>x.documentClass==='general').length,'بانک اسناد':a.length};
  document.querySelectorAll('.capability-card').forEach(c=>{const n=c.dataset.capability||c.querySelector('b')?.textContent?.trim();if(!(n in m))return;let b=c.querySelector('.k980count');if(!b){b=document.createElement('span');b.className='k980count';c.appendChild(b)}b.textContent=fa(m[n])+' سند'})
 }catch{}
}
let ct;new MutationObserver(()=>{clearTimeout(ct);ct=setTimeout(counters,100)}).observe(document.documentElement,{childList:true,subtree:true});counters();

function shell(){
 let x=document.getElementById('knowledge076');
 if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main')?.prepend(x)}
 x.innerHTML=`<div class="k76head"><div><small>محیط پژوهشی تحلیل اسناد · 0.9.8.3</small><h2>تحلیل خبرگانی اسناد بالادستی</h2><p>خبره متن سند را می‌خواند، مفهوم را مستقیماً از متن انتخاب می‌کند و یادداشت متنی یا صوتی خود را به همان شاهد متصل می‌کند.</p></div><button data-k983-close>×</button></div><div id="k983body"><div class="k76loading">در حال دریافت اسناد بالادستی…</div></div>`;
 x.querySelector('[data-k983-close]').onclick=()=>x.remove();return x
}
async function openAnalysis(){
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
 const c=d.case,rs=d.responses||[],ix=['independent_analysis','complementary_review','final_synthesis','approved'].indexOf(c.stage);
 z.innerHTML=`<section class="k983research">
  <div class="k983researchhead"><div><small>پرونده تحلیل · ${esc(currentUserName())}</small><h3>${esc(d.document.title)}</h3></div><span>${esc(stageLabel(c.stage))}</span></div>
  <div class="k983steps">${['تحلیل مستقل خبرگان','تکمیل و نقد','جمع‌بندی','تأیید نهایی'].map((s,i)=>`<span class="${i<=ix?'on':''}">${fa(i+1)}. ${s}</span>`).join('')}</div>
  <div class="k983researchgrid">
   <main class="k983paper">
    <div class="k983paperbar"><b>متن سند بالادستی</b><span>بخشی از متن را با ماوس انتخاب کنید تا به‌عنوان مفهوم/شاهد وارد یادداشت شود.</span></div>
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
  <section class="k983history"><header><div><b>حاشیه‌ها و دیدگاه‌های خبرگان</b><span>${fa(rs.length)} یادداشت ثبت‌شده</span></div></header>${rs.length?rs.map(responseHtml).join(''):'<div class="k983empty">هنوز یادداشتی برای این سند ثبت نشده است.</div>'}</section>
  ${c.stage!=='approved'?`<div class="k983advance"><button data-k983-advance>${c.stage==='final_synthesis'?'تأیید نسخه نهایی':'پایان این مرحله و ورود به مرحله بعد'}</button><small>همه یادداشت‌های مراحل قبلی و دیدگاه‌های اقلیت در پرونده باقی می‌مانند.</small></div>`:''}
 </section>`;

 const textBox=z.querySelector('.k983doctext'),form=z.querySelector('#k983annotationform');
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