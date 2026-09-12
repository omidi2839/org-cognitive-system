(()=>{
window.__SINA_DIALOG_BUILD__='0.9.9.0.27';

const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let active=null;

function finishActive(result){
  if(!active)return;
  const {root,resolve}=active;
  active=null;
  document.body.classList.remove('sina-dialog-open');
  root.classList.add('closing');
  setTimeout(()=>root.remove(),120);
  resolve(result);
}
function openDialog(opts={}){
  if(active)finishActive(active.type==='prompt'?null:false);
  const type=opts.type||'alert';
  const title=String(opts.title||(type==='prompt'?'ثبت/ویرایش اطلاعات':type==='confirm'?'تأیید عملیات':'پیام سینا'));
  const message=String(opts.message||'');
  const confirmText=String(opts.confirmText||(type==='alert'?'متوجه شدم':'تأیید'));
  const cancelText=String(opts.cancelText||'انصراف');
  const value=String(opts.value||'');
  const placeholder=String(opts.placeholder||'');
  const multiline=opts.multiline!==false;
  const danger=!!opts.danger;

  return new Promise(resolve=>{
    const root=document.createElement('div');
    root.className='sina-dialog-backdrop';
    root.innerHTML=`<section class="sina-dialog-card ${danger?'danger':''}" role="dialog" aria-modal="true" aria-labelledby="sina-dialog-title">
      <div class="sina-dialog-brand"><img src="./sina-emblem-09915.png" alt=""><div><b>سینا</b><span id="sina-dialog-title">${escapeHtml(title)}</span></div></div>
      <div class="sina-dialog-body"><p>${escapeHtml(message).replace(/\n/g,'<br>')}</p>
      ${type==='prompt'?(multiline
        ?`<textarea data-sina-dialog-input placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>`
        :`<input data-sina-dialog-input value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}">`
      ):''}</div>
      <div class="sina-dialog-actions">
        ${type!=='alert'?`<button type="button" class="secondary" data-sina-cancel>${escapeHtml(cancelText)}</button>`:''}
        <button type="button" class="primary" data-sina-confirm>${escapeHtml(confirmText)}</button>
      </div>
    </section>`;
    document.body.appendChild(root);
    document.body.classList.add('sina-dialog-open');
    active={root,resolve,type};

    const input=root.querySelector('[data-sina-dialog-input]');
    const confirm=root.querySelector('[data-sina-confirm]');
    const cancel=root.querySelector('[data-sina-cancel]');
    const done=result=>finishActive(result);

    confirm.onclick=()=>done(type==='prompt'?(input?.value??''):true);
    if(cancel)cancel.onclick=()=>done(type==='prompt'?null:false);
    root.addEventListener('click',e=>{if(e.target===root&&type!=='alert')done(type==='prompt'?null:false)});
    root.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&type!=='alert'){e.preventDefault();done(type==='prompt'?null:false)}
      if(e.key==='Enter'&&type!=='prompt'){e.preventDefault();confirm.click()}
      if(e.key==='Enter'&&type==='prompt'&&!multiline){e.preventDefault();confirm.click()}
    });
    setTimeout(()=>{(input||confirm)?.focus()},20);
  });
}

window.SinaDialog={
  alert(message,opts={}){return openDialog({type:'alert',message,...opts})},
  confirm(message,opts={}){return openDialog({type:'confirm',message,...opts})},
  prompt(message,opts={}){return openDialog({type:'prompt',message,...opts})}
};
})();