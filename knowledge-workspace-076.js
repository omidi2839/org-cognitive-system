(()=>{const api=async(p,o={})=>{const r=await fetch(p,{headers:{'content-type':'application/json','x-org-id':'ORG:SYN-001',...(o.headers||{})},...o});const d=await r.json();if(!r.ok)throw Error(d.message||'خطا');return d};
function panel(kind){let x=document.getElementById('knowledge076');if(!x){x=document.createElement('section');x.id='knowledge076';x.className='knowledge076';document.querySelector('.main').prepend(x)};const upstream=kind==='upstream';x.innerHTML=`<div class="k76head"><div><small>Build 0.7.6 · بنیاد دانش سازمانی</small><h2>${upstream?'اسناد بالادستی':'اسناد عمومی'}</h2><p>سند → استخراج → گزاره/مفهوم → شاهد → بررسی انسانی → دانش معتبر</p></div><button data-kclose>×</button></div><div class="k76tabs"><button data-krepo>مخزن اسناد</button><button data-kadd>افزودن سند</button><button data-kflow>مسیر شناختی</button></div><div id="k76body"></div>`;x.querySelector('[data-kclose]').onclick=()=>x.remove();x.querySelector('[data-krepo]').onclick=()=>repo();x.querySelector('[data-kadd]').onclick=()=>form(upstream);x.querySelector('[data-kflow]').onclick=()=>flow();repo()}
async function repo(){const b=document.getElementById('k76body');b.innerHTML='در حال دریافت موجودی…';try{const d=await api('/api/v1/knowledge/inventory'),s=d.summary||{};b.innerHTML=`<div class="k76metrics"><div><b>${s.documents||0}</b><span>سند ثبت‌شده</span></div><div><b>${s.reviewPending||0}</b><span>نیازمند بررسی انسانی</span></div><div><b>${s.duplicateGroups||0}</b><span>گروه تکراری</span></div></div><div class="k76table"><strong>مخزن اسناد سازمانی</strong><p>پروفایل سند، اعتبار، نسخه، وضعیت تحلیل و منشأ در این نما مدیریت می‌شود.</p></div><div class="k76note">سند ≠ داده استخراج‌شده ≠ گزاره ≠ مفهوم ≠ دانش معتبر</div>`}catch(e){b.textContent=e.message}}
function form(up){
 const b=document.getElementById('k76body');
 const types=up?['مأموریت','چشم‌انداز','اهداف کلان','سیاست','راهبرد','چارچوب','ضوابط','قانون/الزام بیرونی']:['آیین‌نامه','دستورالعمل','بخشنامه','گزارش','صورتجلسه','نامه رسمی','سایر'];
 const classificationOptions=up?'<option value="confidential">محرمانه</option><option value="public">عمومی</option>':'<option value="internal">داخلی</option><option value="confidential">محرمانه</option><option value="public">عمومی</option>';
 const scopeHtml=up?`<label>دامنه سازمانی<select name="scopeType" id="k76scopeType"><option value="organization">کل سازمان</option><option value="unit">واحد سازمانی</option></select></label>
 <label id="k76unitWrap" style="display:none">واحد سازمانی<select name="organizationalUnitRef" id="k76unitSelect"><option value="">انتخاب واحد سازمانی…</option></select><small id="k76unitHelp">فهرست واحدها باید از ساختار سازمانی تعریف‌شده در سامانه دریافت شود.</small></label>`:
 `<label>سطح سازمانی<select name="organizationalLevel"><option>کل سازمان</option><option>حوزه</option><option>واحد</option></select></label>`;

 b.innerHTML=`<form id="k76form"><div class="k76grid">
 <label>عنوان سند<input name="title" required></label>
 <label>نوع سند<select name="documentType">${types.map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label>مرجع صادرکننده<input name="issuer"></label>
 <label>نسخه<input name="versionLabel"></label>
 <label>تاریخ صدور<input type="date" name="issuedAt"></label>
 <label>پایان اعتبار<input type="date" name="validUntil"></label>
 <label>وضعیت اعتبار<select name="validityStatus"><option value="active">معتبر</option><option value="draft">پیش‌نویس</option><option value="expired">منقضی</option><option value="unknown">نیازمند احراز</option></select></label>
 ${scopeHtml}
 <label>حوزه موضوعی<input name="subjectArea"></label>
 <label>طبقه‌بندی<select name="classification">${classificationOptions}</select></label>
 </div>
 <label class="k76file">فایل اصلی<input type="file" name="file" required accept=".pdf,.docx,.txt,.md"></label>
 <button class="k76primary">ثبت و ورود به تحلیل</button><div id="k76status"></div></form>`;

 async function loadUnits(){
   const sel=document.getElementById('k76unitSelect'),help=document.getElementById('k76unitHelp');
   if(!sel)return;
   sel.innerHTML='<option value="">در حال دریافت ساختار سازمانی…</option>';
   try{
     const r=await api('/api/v1/organization/units');
     const units=r.units||[];
     if(!units.length){
       sel.innerHTML='<option value="">ساختار سازمانی هنوز تعریف نشده است</option>';
       help.textContent='پس از تعریف ساختار سازمانی، واحدها در این فهرست نمایش داده می‌شوند.';
       return;
     }
     sel.innerHTML='<option value="">انتخاب واحد سازمانی…</option>'+units.map(u=>`<option value="${u.id}" data-name="${u.name}">${u.name}</option>`).join('');
     help.textContent='فهرست از ساختار سازمانی تعریف‌شده در سامانه دریافت شده است.';
   }catch(e){
     sel.innerHTML='<option value="">ساختار سازمانی در این Build هنوز متصل نشده است</option>';
     help.textContent='این فیلد برای اتصال مستقیم به ساختار سازمانی آماده شده است.';
   }
 }

 if(up){
   const scope=document.getElementById('k76scopeType'),wrap=document.getElementById('k76unitWrap');
   scope.onchange=()=>{
     const show=scope.value==='unit';
     wrap.style.display=show?'block':'none';
     if(show)loadUnits();
   };
 }

 document.getElementById('k76form').onsubmit=async e=>{
   e.preventDefault();
   const f=new FormData(e.currentTarget),file=f.get('file'),st=document.getElementById('k76status');
   if(up&&f.get('scopeType')==='unit'&&!f.get('organizationalUnitRef')){
     st.textContent='برای دامنه «واحد سازمانی»، انتخاب واحد الزامی است.';
     return;
   }
   st.textContent='در حال ثبت و استخراج…';
   try{
     const b64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(file)});
     const unitSel=document.getElementById('k76unitSelect');
     const selectedUnitName=unitSel?.selectedOptions?.[0]?.dataset?.name||null;
     const metadata={
       documentClass:up?'upstream':'general',
       documentType:f.get('documentType'),
       issuer:f.get('issuer'),
       versionLabel:f.get('versionLabel'),
       issuedAt:f.get('issuedAt'),
       validUntil:f.get('validUntil'),
       validityStatus:f.get('validityStatus'),
       organizationalLevel:up?(f.get('scopeType')==='organization'?'کل سازمان':'واحد سازمانی'):f.get('organizationalLevel'),
       scopeType:up?f.get('scopeType'):null,
       organizationalUnitRef:up&&f.get('scopeType')==='unit'?f.get('organizationalUnitRef'):null,
       organizationalUnitName:up&&f.get('scopeType')==='unit'?selectedUnitName:null,
       subjectArea:f.get('subjectArea')
     };
     const d=await api('/api/v1/documents/upload',{method:'POST',body:JSON.stringify({
       title:f.get('title'),fileName:file.name,mimeType:file.type||'application/octet-stream',
       contentBase64:b64,classification:f.get('classification'),knowledgeZone:'organizational',metadata
     })});
     st.innerHTML=`<b>سند ثبت شد.</b> ${d.document?.id||''}<br>اکنون آماده تحلیل شناختی و بررسی انسانی است.`;
   }catch(err){st.textContent=err.message}
 }
}
function flow(){document.getElementById('k76body').innerHTML=`<div class="k76flow">${['سند اصلی','استخراج و نرمال‌سازی','بخش‌بندی','مفهوم / گزاره پیشنهادی','اتصال به شاهد','بررسی انسانی','دانش معتبر'].map((x,i)=>`<span><b>0${i+1}</b>${x}</span>`).join('<i>←</i>')}</div><div class="k76note"><b>اصل بنیادین:</b> دانش بدون منشأ و شاهد، دانش معتبر سازمانی نیست.</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-capability]');if(!b)return;if(b.dataset.capability==='اسناد بالادستی'){e.stopImmediatePropagation();panel('upstream')}if(b.dataset.capability==='اسناد عمومی'){e.stopImmediatePropagation();panel('general')}},true)})();