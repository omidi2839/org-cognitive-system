(()=>{
window.__DOCUMENT_BANK_ENTRY_BUILD__='0.9.5.8.6';

function knowledgeVisible(){
  const ctx=document.getElementById('workspaceContext');
  return !!ctx && !ctx.classList.contains('hidden') &&
    /دانش و اسناد سازمان/.test(ctx.textContent||'');
}

function ensureBankEntry(){
  if(!knowledgeVisible()) return false;
  const ctx=document.getElementById('workspaceContext');
  const stage=ctx.querySelector('.cognitive-stage');
  const items=stage?.querySelector('.stage-items');
  if(!items) return false;

  let btn=items.querySelector('[data-capability="بانک اسناد"]');
  if(btn) {
    btn.classList.add('live','k9586-bank-entry');
    const small=btn.querySelector('small');
    if(small) small.textContent='جستجو و بازیابی سازمانی';
    return true;
  }

  btn=document.createElement('button');
  btn.type='button';
  btn.className='capability-card live k9586-bank-entry';
  btn.dataset.capability='بانک اسناد';
  btn.innerHTML='<span class="capability-icon">✦</span><b>بانک اسناد</b><small>جستجو و بازیابی سازمانی</small>';

  // Keep the repository bank next to the two document-entry cards.
  items.appendChild(btn);
  return true;
}

function scheduleEnsure(){
  [0,30,100,250,600].forEach(ms=>setTimeout(ensureBankEntry,ms));
}

document.addEventListener('click',e=>{
  if(e.target?.closest?.('[data-workspace="knowledge"]')) scheduleEnsure();
},true);

new MutationObserver(()=>{
  if(knowledgeVisible()) ensureBankEntry();
}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

window.addEventListener('load',scheduleEnsure);
document.addEventListener('DOMContentLoaded',scheduleEnsure);
scheduleEnsure();
})();