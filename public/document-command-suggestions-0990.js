(()=>{
window.__DOCUMENT_COMMAND_SUGGESTIONS_BUILD__='0.9.9.0.6';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const uniq=a=>[...new Set(a.filter(Boolean))];
const api=async p=>{const r=await fetch(p,{credentials:'same-origin',headers:{'x-org-id':'ORG:SYN-001'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'خطا');return d};

let catalog={topics:[],subtopics:[],issuers:[],types:[],meetings:[],numbers:[]},ready=false;
const staticTemplates=[
 'اسناد مرتبط با منابع انسانی را نشان بده',
 'اسناد مرتبط با آموزش را نشان بده',
 'اسناد مرتبط با پژوهش را نشان بده',
 'اسناد حوزه مالی و بودجه را نشان بده',
 'آیین‌نامه‌های منابع انسانی را لیست کن',
 'مصوبات اخیر را نشان بده',
 'اسناد معتبر را نشان بده',
 'اسناد سال ۱۴۰۳ را نشان بده',
 'اسناد از سال ۱۴۰۲ تا ۱۴۰۴ را نشان بده',
 'اسناد مصوب کمیسیون مدیریت و برنامه‌ریزی را نشان بده',
 'مصوبات جلسه ۱۵ را نشان بده',
 'مصوبه ۲۱۵ را پیدا کن',
 'اصلاحیه‌های مصوبه ۲۱۵ را نشان بده',
 'الحاقیه‌های مصوبه ۲۱۵ را نشان بده',
 'استفسارهای مرتبط با مصوبه ۲۱۵ را نشان بده',
 'اسنادی که درباره فوق‌العاده ویژه صحبت کرده‌اند را نشان بده',
 'اسنادی که عبارت سختی شرایط کار در آنها آمده را نشان بده',
 'اسنادی که درباره حقوق و مزایا صحبت کرده‌اند را نشان بده'
];

async function loadCatalog(){
 if(ready)return;
 try{
  const d=await api('/api/v1/knowledge/documents'),items=d.items||[];
  catalog.topics=uniq(items.map(x=>x.subjectCategory));
  catalog.subtopics=uniq(items.map(x=>x.subjectArea));
  catalog.issuers=uniq(items.map(x=>x.issuer));
  catalog.types=uniq(items.map(x=>x.documentType));
  catalog.meetings=uniq(items.map(x=>x.meetingNumber));
  catalog.numbers=uniq(items.map(x=>x.documentNumber));
 }catch(e){console.warn('DOCUMENT_SUGGESTION_CATALOG_UNAVAILABLE',e)}
 ready=true;
}

function dynamicTemplates(){
 const a=[];
 catalog.topics.slice(0,8).forEach(x=>a.push(`اسناد مرتبط با ${x} را نشان بده`));
 catalog.subtopics.slice(0,8).forEach(x=>a.push(`اسناد مرتبط با ${x} را نشان بده`));
 catalog.issuers.slice(0,7).forEach(x=>a.push(`اسناد مصوب ${x} را نشان بده`));
 catalog.types.slice(0,6).forEach(x=>a.push(`${x}‌ها را نشان بده`));
 catalog.meetings.slice(0,5).forEach(x=>a.push(`اسناد جلسه ${x} را نشان بده`));
 catalog.numbers.slice(0,6).forEach(x=>{
   a.push(`مصوبه ${x} را پیدا کن`);
   a.push(`اصلاحیه‌های مصوبه ${x} را نشان بده`);
 });
 return uniq(a);
}
function score(q,s){
 const nq=norm(q),ns=norm(s); if(!nq)return 1;
 if(ns.startsWith(nq))return 100;
 if(ns.includes(nq))return 80;
 const terms=nq.split(' ').filter(x=>x.length>1);let hit=0;
 for(const t of terms)if(ns.includes(t))hit++;
 return hit?20+hit*12:0;
}
function suggestions(q){
 return uniq([...dynamicTemplates(),...staticTemplates])
   .map(label=>({label,score:score(q,label)})).filter(x=>x.score>0)
   .sort((a,b)=>b.score-a.score).slice(0,8);
}
function intentMeta(label){
 const n=norm(label);
 if(/اصلاحیه|الحاقیه|استفسار|ملغی/.test(n))return 'روابط حقوقی اسناد';
 if(/جلسه/.test(n))return 'شماره جلسه';
 if(/مصوبه\s*[۰-۹0-9]/.test(n))return 'شماره مصوبه / سند';
 if(/سال|از سال|تا سال/.test(n))return 'بازه زمانی';
 if(/مصوب/.test(n))return 'مرجع تصویب / صادرکننده';
 if(/عبارت|صحبت|درباره/.test(n))return 'جستجو در متن کامل';
 return 'موضوع / زیرموضوع سند';
}
function execute(label){
 const input=document.getElementById('commandInput');if(!input)return;
 input.value=label;input.dispatchEvent(new Event('input',{bubbles:true}));
 document.getElementById('runCommand')?.click();
 hide();
}
let drop=null;
function hide(){if(drop)drop.hidden=true}
function personalActive(){
 const hero=document.getElementById('personalHero');
 if(!hero||hero.style.display==='none')return false;
 const active=document.querySelector('[data-workspace="personal"].active');
 return !!active || getComputedStyle(hero).display!=='none';
}
function mount(){
 const input=document.getElementById('commandInput'),hero=document.getElementById('personalHero');
 if(!input||!hero||hero.dataset.k990Suggestions)return;
 hero.dataset.k990Suggestions='1';

 // Defensive cleanup for panels created by 0.9.9.0.
 document.querySelectorAll('.k990-doc-suggestions').forEach(x=>x.remove());

 drop=document.createElement('div');drop.className='k990-command-drop';drop.hidden=true;
 input.closest('.command-row')?.appendChild(drop);

 const renderDrop=()=>{
  if(!personalActive()){hide();return}
  const q=input.value.trim(),arr=suggestions(q);
  if(!q||!arr.length){hide();return}
  drop.innerHTML=arr.map(x=>`<button type="button" data-guess="${esc(x.label)}"><span>${esc(x.label)}</span><small>${esc(intentMeta(x.label))}</small></button>`).join('');
  drop.querySelectorAll('[data-guess]').forEach(b=>b.onmousedown=e=>{e.preventDefault();execute(b.dataset.guess)});
  drop.hidden=false;
 };
 input.addEventListener('input',renderDrop);
 input.addEventListener('focus',renderDrop);
 input.addEventListener('blur',()=>setTimeout(hide,120));
 document.addEventListener('click',e=>{
   if(!e.target.closest('.command-row'))hide();
 },true);

 loadCatalog();
}
function observe(){
 const run=()=>{document.querySelectorAll('.k990-doc-suggestions').forEach(x=>x.remove());mount()};
 new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
 run();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();