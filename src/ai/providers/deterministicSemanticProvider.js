const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const ceremonial=/^(بسم\s*الله\s*الرحمن\s*الرحیم|بسم\s*الله|الحمد\s*لله|هو\s*تعالی|هو)$/;
const labels=/^(متن\s*(مصوبه|تصویب.?نامه|سند|ماده)|عنوان\s*(مصوبه|سند)|موضوع|شماره|تاریخ|پیوست|مرجع\s*تصویب|دستور\s*جلسه)\s*[:：\-–—]?\s*$/;
const heading=/^(مقدمه|دیباچه|پیشگفتار|رسالت(?:\s+.+)?|مأموریت(?:\s+.+)?|ماموریت(?:\s+.+)?|چشم.?انداز(?:\s+.+)?|اهداف(?:\s+.+)?|وظایف(?:\s+.+)?|سیاست(?:‌ها|ها)?(?:\s+.+)?|راهبرد(?:ها|‌ها)?(?:\s+.+)?|اصول(?:\s+.+)?|ارزش(?:‌ها|ها)?(?:\s+.+)?|تعاریف|کلیات)\s*[:：\-–—]\s*$/;
function zone(t,i){const x=clean(t),w=x.split(/\s+/).length;if(ceremonial.test(x))return'ceremonial';if(labels.test(x))return'label';if(heading.test(x))return'heading';if(i<5&&w<18&&/اساسنامه|آیین.?نامه|سند|قانون|نظام.?نامه|دستورالعمل|مصوبه/.test(x)&&!/[.!؟؛]/.test(x))return'title';if(/[:：]\s*$/.test(x)&&w<=14)return'heading';return'body'}
function specialClaim(t){
 const qs=[],cs=[],rs=[];
 const add=(label,role,meaningCandidate)=>cs.push({label,role,meaningCandidate,confidence:.68});
 if(/بهره.?گیری/.test(t))add('بهره‌گیری','action','کنش استفاده یا به‌کارگیری');
 if(/ظرفیت/.test(t))add('ظرفیت‌ها','capacity','ظرفیت‌های قابل استفاده که مصادیق آنها هنوز روشن نیست');
 if(/منابع مالی/.test(t))add('منابع مالی','financial_resource','منابع مالی قابل استفاده که دامنه آنها نیازمند تعیین است');
 if(/نظام اسلامی/.test(t))add('نظام اسلامی','source_or_scope','منشأ یا دامنه ظرفیت‌ها و منابع');
 if(/استقلال/.test(t))add('استقلال','governing_constraint','اصل یا محدودیت حاکم بر نحوه بهره‌گیری');
 if(/حوزه.?های علمیه خواهران/.test(t))add('حوزه‌های علمیه خواهران','organizational_entity','موجودیت سازمانی موضوع استقلال');
 if(/ظرفیت/.test(t))qs.push({question:'منظور از «ظرفیت‌ها» در این گزاره چیست و چه مصادیقی را ظرفیت قابل بهره‌گیری می‌دانید؟',reason:'دامنه ظرفیت‌ها برای تبدیل گزاره به معنای قابل استفاده سازمانی روشن نیست.',targets:['ظرفیت‌ها'],kind:'definition_and_examples',priority:'high'});
 if(/منابع مالی/.test(t))qs.push({question:'«منابع مالی» در این گزاره شامل چه منابعی است و مرز آن با سایر منابع مالی حوزه کجاست؟',reason:'دامنه و اجزای منبع مالی باید روشن شود.',targets:['منابع مالی'],kind:'scope_and_components',priority:'high'});
 if(/استقلال/.test(t))qs.push({question:'«ملاحظه استقلال حوزه‌های علمیه خواهران» دقیقاً چه الزاماتی ایجاد می‌کند و چه چیزهایی باید رعایت شود تا این استقلال مخدوش نشود؟',reason:'استقلال در گزاره نقش قید حاکم دارد اما معیار رعایت آن تصریح نشده است.',targets:['استقلال','حوزه‌های علمیه خواهران'],kind:'constraint_and_criteria',priority:'high'});
 if(/منابع مالی/.test(t)&&/استقلال/.test(t)){rs.push({source:'منابع مالی',target:'استقلال',type:'resource_constraint_relation',interpretation:'نحوه بهره‌گیری از منابع باید با اصل استقلال سازگار باشد.',confidence:.72});qs.push({question:'رابطه میان بهره‌گیری از ظرفیت‌ها و منابع مالی نظام اسلامی با استقلال حوزه چیست؛ چه نوع بهره‌گیری سازگار و چه نوع بهره‌گیری ناسازگار با استقلال محسوب می‌شود؟',reason:'رابطه میان منبع بیرونی و قید استقلال، هسته شناختی این گزاره است.',targets:['ظرفیت‌ها','منابع مالی','استقلال'],kind:'relationship_and_boundary',priority:'high'})}
 return {concepts:cs,relations:rs,questions:qs};
}
export const deterministicSemanticProvider={name:'deterministic-fallback',async analyze({text}){
 const units=String(text||'').split(/\n|(?<=[.!؟!؛])/).map(clean).filter(Boolean);
 const documentZones=units.map((t,i)=>({text:t,zone:zone(t,i),reason:'deterministic structural fallback'}));
 const claims=documentZones.filter(x=>x.zone==='body').map(x=>{const s=specialClaim(x.text);return{text:x.text,claimType:'organizational_claim',concepts:s.concepts,relations:s.relations,ambiguities:s.questions.map(q=>({target:q.targets.join('، '),reason:q.reason,priority:q.priority})),questions:s.questions}});
 return {documentZones,claims,provider:'deterministic-fallback',model:null};
}};
