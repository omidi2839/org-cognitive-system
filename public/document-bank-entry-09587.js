(()=>{
window.__DOCUMENT_BANK_ENTRY_BUILD__='0.9.6.0';

let scheduled=false;
let inserting=false;

function knowledgeVisible(){
  const ctx=document.getElementById('workspaceContext');
  return !!ctx &&
    !ctx.classList.contains('hidden') &&
    /دانش و اسناد سازمان/.test(ctx.textContent||'');
}

function ensureBankEntry(){
  if(inserting || !knowledgeVisible()) return false;

  const ctx=document.getElementById('workspaceContext');
  const items=ctx?.querySelector('.cognitive-stage .stage-items');
  if(!items) return false;

  // If it already exists, do absolutely nothing.
  // This is critical: no classList/textContent writes inside observer callbacks.
  if(items.querySelector('[data-capability="بانک اسناد"]')) return true;

  inserting=true;
  try{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='capability-card live k9587-bank-entry';
    btn.dataset.capability='بانک اسناد';
    btn.innerHTML='<span class="capability-icon">✦</span><b>بانک اسناد</b><small>جستجو و بازیابی سازمانی</small>';
    items.appendChild(btn);
    return true;
  } finally {
    inserting=false;
  }
}

function scheduleEnsure(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    ensureBankEntry();
  });
}

document.addEventListener('click',e=>{
  if(e.target?.closest?.('[data-workspace="knowledge"]')){
    setTimeout(scheduleEnsure,0);
    setTimeout(scheduleEnsure,80);
    setTimeout(scheduleEnsure,250);
  }
},true);

// Observe only structural DOM changes, never class attribute mutations.
// The callback only schedules one RAF pass and the ensure function is fully idempotent.
const observer=new MutationObserver(()=>{
  if(knowledgeVisible()) scheduleEnsure();
});
observer.observe(document.documentElement,{subtree:true,childList:true});

window.addEventListener('load',scheduleEnsure,{once:true});
document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});
scheduleEnsure();
})();