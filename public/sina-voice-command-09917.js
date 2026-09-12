(()=>{
window.__SINA_VOICE_COMMAND_BUILD__='0.9.9.1.1';
const WAKE=/^\s*(?:سینا|سينا)\s*[,،:؛\-–—]?\s*/i;
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const getInput=()=>document.getElementById('commandInput');
const getStatus=()=>document.getElementById('voiceStatus');
function setStatus(t,kind=''){const s=getStatus();if(!s)return;s.textContent=t||'';s.dataset.state=kind}
function parseWake(text){
 const raw=norm(text),has=WAKE.test(raw),command=has?norm(raw.replace(WAKE,'')):raw;
 return {raw,has,command};
}
function submitCommand(command){
 const el=getInput();if(!el||!command)return;
 el.value=command;
 el.dispatchEvent(new Event('input',{bubbles:true}));
 requestAnimationFrame(()=>{document.getElementById('runCommand')?.click();setTimeout(()=>{if(el)delete el.dataset.sinaVoiceMode},250)});
}
function recognize(){
 const input=getInput();if(input)input.dataset.sinaVoiceMode='1';
 document.querySelectorAll('.k990-command-drop').forEach(x=>x.hidden=true);
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){setStatus('تشخیص گفتار در این مرورگر در دسترس نیست. می‌توانید فرمان را تایپ کنید: «سینا، جلسات من را بیاور».','error');return}
 const btn=document.getElementById('voiceCommand');
 if(btn?.dataset.listening==='1')return;
 const rec=new SR();
 rec.lang='fa-IR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 if(btn){btn.dataset.listening='1';btn.classList.add('sina-listening')}
 setStatus('سینا گوش می‌دهد… فرمان خود را بگویید.','listening');
 let finalText='';
 rec.onresult=e=>{
   let interim='';
   for(let i=e.resultIndex;i<e.results.length;i++){
     const t=e.results[i][0]?.transcript||'';
     if(e.results[i].isFinal)finalText+=t+' ';else interim+=t+' ';
   }
   const preview=norm(finalText||interim);
   if(preview)setStatus(`شنیدم: ${preview}`,'hearing');
 };
 rec.onerror=e=>{
   const msg=e.error==='not-allowed'?'دسترسی میکروفن داده نشد.':e.error==='no-speech'?'صدایی تشخیص داده نشد.':'تشخیص گفتار متوقف شد.';
   setStatus(msg,'error');
 };
 rec.onend=()=>{
   if(btn){delete btn.dataset.listening;btn.classList.remove('sina-listening')}
   const p=parseWake(finalText);
   if(!p.raw){if(getStatus()?.dataset.state!=='error')setStatus('فرمانی دریافت نشد.','');return}
   if(p.has){
     if(!p.command){setStatus('بعد از «سینا» فرمان خود را هم بگویید.','error');return}
     setStatus(`سینا: «${p.command}»`,'ready');
     submitCommand(p.command);
   }else{
     const el=getInput();if(el){el.value=p.raw;el.dispatchEvent(new Event('input',{bubbles:true}))}
     setStatus('فرمان در کادر قرار گرفت. برای اجرای مستقیم، جمله را با «سینا» شروع کنید.','ready');if(el)delete el.dataset.sinaVoiceMode;
   }
 };
 try{rec.start()}catch{
   if(btn){delete btn.dataset.listening;btn.classList.remove('sina-listening')}
   setStatus('شروع میکروفن ممکن نشد.','error');
 }
}
function stripTypedWake(){
 const el=getInput();if(!el)return;
 const p=parseWake(el.value);
 if(p.has&&p.command)el.value=p.command;
}
document.addEventListener('click',e=>{
 const v=e.target.closest?.('#voiceCommand');
 if(v){e.preventDefault();e.stopPropagation();recognize();return}
 if(e.target.closest?.('#runCommand'))stripTypedWake();
},true);
document.addEventListener('keydown',e=>{
 if(e.target?.matches?.('#commandInput')&&e.key==='Enter'&&!e.shiftKey)stripTypedWake();
},true);
setTimeout(()=>{
 const el=getInput();if(el)el.placeholder='مثلاً: سینا، لیست جلسات من را بیاور…';
 const b=document.getElementById('voiceCommand');if(b)b.title='فرمان صوتی با سینا';
},200);
})();