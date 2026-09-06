const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const stop=new Set('این آن که را به از در با برای و یا یک بر تا نیز شده شود است هستند بود باشد خود مورد جهت صورت طریق عنوان سازمان سند کل کلی اصلی های می شود می گردد گردد شده است باشد باشند خواهد باید'.split(' '));
const actions=['تبیین','ترویج','تبلیغ','تعلیم','تربیت','پژوهش','آموزش','هدایت','تقویت','توسعه','ارتقا','ارتقای','صیانت','تحقق','گسترش','توانمندسازی','رفع','ایجاد','تأمین','حفظ','پشتیبانی','ساماندهی','مدیریت','برنامه ریزی','برنامه‌ریزی'];
const relMarkers=[['مبتنی بر','epistemic_basis'],['با تأکید بر','emphasis'],['به منظور','purpose'],['برای','purpose'],['از طریق','means'],['در راستای','alignment'],['موجب','causal_claim'],['باعث','causal_claim'],['در','scope'],['از','source_or_origin'],['با','association']];
const roleHints=[
 ['نیاز','need_concept'],['نیازهای','need_concept'],['هدف','goal_concept'],['اهداف','goal_concept'],
 ['بانوان','target_group'],['طلاب','target_group'],['جامعه','stakeholder_or_scope'],['جوامع','stakeholder_or_scope'],
 ['نظام','stakeholder_or_scope'],['حوزه','organizational_entity'],['قرآن','epistemic_source'],['سنت','epistemic_source'],['مکتب','epistemic_source']
];
const clean=s=>norm(String(s||'')).replace(/ن\s+یاز/g,'نیاز').replace(/حوزه\s*[‌ ]+\s*های/g,'حوزه های').replace(/[«»"()]/g,'').trim();
const tokenise=u=>clean(u).split(/\s+/).map(x=>x.replace(/^[،,:؛\-]+|[،,:؛\-]+$/g,'')).filter(Boolean);

const verbBoundaries=new Set('است بود باشد هستند شد شده شود گردید گردد می‌شود خواهد میتوان می‌توان نمی‌توان آمد آورد رسید فراموش کرد کردند دارد دارند داشت داشته نمود نماید'.split(' '));
const relationWords=new Set('برای از در با بر تا به که و یا اما ولی سپس ضمن توسط بوسیله به‌وسیله یعنی'.split(' '));
const tokens=u=>clean(u).split(/\s+/).map(x=>x.replace(/^[«»"'،,:؛.!؟()\-]+|[«»"'،,:؛.!؟()\-]+$/g,'')).filter(Boolean);
function semanticRole(label){
 if(/نیاز/.test(label))return'need';
 if(/بانوان|طلاب|دانشجویان|مردم|جوامع|جامعه|مراجع|علما|علماء|خطبا/.test(label))return'stakeholder_or_target';
 if(/حوزه|شورا|وزارت|دانشگاه|مرکز|مؤسسه|نهاد|نظام/.test(label))return'organizational_or_system_entity';
 if(/قرآن|سنت|مکتب|منبع|مرجع/.test(label))return'epistemic_or_reference';
 if(/وارسته|فرهیخته|متخصص|شایسته|توانمند|اسلامی|دینی|علمی|فرهنگی|اجتماعی|شکوهمند/.test(label))return'quality_or_attribute';
 return'concept';
}
function candidateScore(label){
 let score=.45,ws=label.split(/\s+/);
 if(ws.length===2)score+=.16;if(ws.length===3)score+=.20;if(ws.length>3)score-=.08;
 if(/نیاز|هدف|رسالت|مأموریت|حوزه|نظام|جامعه|جوامع|بانوان|طلاب|قرآن|سنت|مکتب|مرجع|علما|علماء|خطبا|انقلاب/.test(label))score+=.18;
 if(/وارسته|فرهیخته|دینی|اسلامی|علمی|فرهنگی|اجتماعی|شکوهمند/.test(label))score+=.10;
 if(/است|بود|شد|شود|کرد|آمد|رسید|فراموش|نمی‌توان|می‌توان/.test(label))score-=.65;
 return score;
}
function openCandidates(u){
 const ts=tokens(u),out=[];
 const blocked=t=>stop.has(t)||verbBoundaries.has(t)||relationWords.has(t)||/^(است|بود|شد|شود|شده|کرد|آمد|رسید|فراموش|نمی|می)$/.test(t);
 const add=(label,start,end)=>{
  label=clean(label);if(!label||label.length<3)return;
  const sc=candidateScore(label);if(sc<.58)return;
  out.push({label,type:semanticRole(label),spanStart:start,spanEnd:end,score:sc});
 };
 ts.forEach((t,i)=>{if(actions.includes(t))out.push({label:t,type:'action_or_function',spanStart:i,spanEnd:i,score:.90})});
 let chunk=[];
 const flush=()=>{
  if(!chunk.length)return;
  const vals=chunk.map(x=>x.t);
  for(let n=Math.min(3,vals.length);n>=1;n--)for(let i=0;i+n<=vals.length;i++){
   const seg=vals.slice(i,i+n);if(seg.some(blocked))continue;add(seg.join(' '),chunk[i].i,chunk[i+n-1].i);
  }
  chunk=[];
 };
 ts.forEach((t,i)=>{if(blocked(t)||actions.includes(t))flush();else chunk.push({t,i})});flush();
 out.sort((a,b)=>b.score-a.score||b.label.length-a.label.length);
 const kept=[];
 for(const c of out){
  if(kept.some(k=>k.label===c.label&&k.type===c.type))continue;
  if(/^(نمونه|بارز|دیگر|بزرگ|سهم|ثمر|وجود)$/.test(c.label))continue;
  const contained=kept.find(k=>k.label.includes(c.label)&&k.type===c.type&&k.score>=c.score+.05);
  if(contained&&c.label.split(/\s+/).length>1)continue;
  kept.push(c);
 }
 return kept.slice(0,8);
}

console.log(JSON.stringify(openCandidates('تربیت بانوان فرهیخته برای رفع نیازهای دینی جوامع')));