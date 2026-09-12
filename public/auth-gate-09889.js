(()=>{
const VERSION='0.9.9.0.22';
document.documentElement.classList.add('auth-pending');
const scripts=[
 './app.js','./workspace-shell-075.js','./knowledge-workspace-076.js',
 `./document-bank-09582.js?v=${VERSION}`,`./document-bank-entry-09587.js?v=${VERSION}`,'./document-amendments-093.js?v=0.9.4.0',
 './document-relations-ui-0944.js?v=0.9.4.4',`./legal-relation-contract-0990.js?v=${VERSION}`,`./document-meeting-command-09582.js?v=${VERSION}`,`./document-registration-commit-09902.js?v=${VERSION}`,`./knowledge-governance-0980.js?v=${VERSION}`,`./platform-unified-09889.js?v=${VERSION}`,`./document-command-suggestions-0990.js?v=${VERSION}`,`./sina-voice-command-09917.js?v=${VERSION}`,`./ui-persian-polish-09906.js?v=${VERSION}`
];
function mount(){
 const gate=document.createElement('div');gate.className='k989-auth';gate.innerHTML=`<i class="k989-orb o1"></i><i class="k989-orb o2"></i><i class="k989-grid"></i><form class="k989-login"><div class="k9917-login-brand"><img src="./sina-emblem-09915.png" alt="لوگوی سینا"><div><b>سینا</b><span>پلتفرم هوش شناختی سازمان</span><small>از داده‌ها به دانایی، از دانایی به اقدام</small></div></div><h1>ورود به سینا</h1><p>فضای امن مدیریت، اسناد و شناخت سازمانی. برای ادامه هویت مدیریتی خود را تأیید کنید.</p><label>نام کاربری<input name="username" autocomplete="username" required autofocus placeholder="نام کاربری"></label><label>رمز عبور<input name="password" type="password" autocomplete="current-password" required placeholder="رمز عبور"></label><button type="submit">ورود به سامانه</button><div class="k989-auth-status"></div><div class="k989-secure"><span>◇</span><span>نشست امن مدیریتی · دسترسی ادمین کل</span></div></form>`;document.body.appendChild(gate);
 gate.querySelector('form').onsubmit=async e=>{e.preventDefault();const st=gate.querySelector('.k989-auth-status'),fd=new FormData(e.currentTarget);st.textContent='در حال احراز هویت…';
   try{const r=await fetch('/api/v1/auth/session',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'ورود ناموفق بود.');st.textContent='';await unlock(gate)}catch(err){st.textContent=err.message}}
 return gate;
}
function load(src){return new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.body.appendChild(s)})}
async function unlock(gate){
 gate.hidden=true;document.documentElement.classList.remove('auth-pending');
 for(const src of scripts){try{await load(src)}catch(e){console.error('BOOT_SCRIPT_FAILED',src,e)}}
}
async function start(){const gate=mount();try{const r=await fetch('/api/v1/auth/session',{credentials:'same-origin'});if(r.ok)await unlock(gate)}catch{}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


function sinaApplyIdentity(){
  try{
    if(document.title!=='سینا | پلتفرم هوش شناختی سازمان')document.title='سینا | پلتفرم هوش شناختی سازمان';
    const brand=document.querySelector('.brand-mark');
    if(brand){
      const b=brand.querySelector('b'),sm=brand.querySelector('small');
      if(b&&b.textContent!=='سینا')b.textContent='سینا';
      if(sm&&sm.textContent!=='پلتفرم هوش شناختی سازمان')sm.textContent='پلتفرم هوش شناختی سازمان';
      const im=brand.querySelector('img');if(im&&!String(im.getAttribute('src')||'').includes('sina-emblem-09915.png'))im.src='./sina-emblem-09915.png';
    }
    const login=document.querySelector('.k989-login,.auth-card,.login-card,[data-auth-card]');
    if(login&&!login.querySelector('.sina-login-brand')&&!login.querySelector('.k9917-login-brand')){
      const h=document.createElement('div');h.className='sina-login-brand';
      h.innerHTML='<img src="./sina-emblem-09915.png" alt="سینا"><div><b>سینا</b><span>پلتفرم هوش شناختی سازمان</span><small>از داده‌ها به دانایی، از دانایی به اقدام</small></div>';
      login.prepend(h);
    }
  }catch(_){}
}
window.addEventListener('DOMContentLoaded',sinaApplyIdentity,{once:true});
window.addEventListener('load',sinaApplyIdentity,{once:true});
setTimeout(sinaApplyIdentity,0);
setTimeout(sinaApplyIdentity,1200);
