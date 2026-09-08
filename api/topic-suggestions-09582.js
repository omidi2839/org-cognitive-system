import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { parseArtifact, normalizePersianText } from '../src/processing/parser.js';

const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const norm=s=>normalizePersianText(String(s??'')).toLowerCase().replace(/\s+/g,' ').trim();

const TAXONOMY=[
 {label:'راهبرد و برنامه‌ریزی',keywords:['راهبرد','استراتژی','چشم انداز','چشم‌انداز','ماموریت','مأموریت','برنامه','هدف کلان','سیاست کلان']},
 {label:'آموزش و تربیت',keywords:['آموزش','تربیت','تحصیل','طلبه','طلاب','فراگیر','استاد','درس','مهارت آموزشی']},
 {label:'پژوهش و تولید علم',keywords:['پژوهش','تحقیق','مقاله','علمی','دانش','تولید علم','کرسی','نشریه']},
 {label:'فرهنگ و تبلیغ',keywords:['فرهنگ','تبلیغ','تبلیغی','دینی','معارف','رسانه دینی','مبلغ','مبلغه']},
 {label:'منابع انسانی',keywords:['منابع انسانی','کارکنان','نیروی انسانی','استخدام','انتصاب','ارزیابی کارکنان','شایستگی']},
 {label:'مالی و بودجه',keywords:['بودجه','مالی','اعتبار','هزینه','درآمد','ذیحساب','تخصیص','مصرف اعتبار']},
 {label:'حقوقی و مقررات',keywords:['قانون','حقوقی','مقررات','آیین نامه','آیین‌نامه','ضابطه','الزام','ماده','تبصره']},
 {label:'ساختار و تشکیلات',keywords:['ساختار','تشکیلات','سازماندهی','واحد سازمانی','پست سازمانی','شرح وظایف','تفویض اختیار']},
 {label:'فرآیندها و عملیات',keywords:['فرآیند','فرایند','عملیات','روش اجرایی','دستورالعمل','گردش کار','خدمت']},
 {label:'فناوری اطلاعات و تحول دیجیتال',keywords:['فناوری','اطلاعات','سامانه','دیجیتال','هوش مصنوعی','داده','نرم افزار','نرم‌افزار','امنیت اطلاعات']},
 {label:'نظارت، ارزیابی و عملکرد',keywords:['نظارت','ارزیابی','عملکرد','شاخص','پایش','بازرسی','کنترل','گزارش عملکرد']},
 {label:'مدیریت جلسات و تصمیمات',keywords:['جلسه','صورتجلسه','مصوبه','تصمیم','شورا','کمیسیون','کارگروه']},
 {label:'ارتباطات و رسانه',keywords:['ارتباطات','رسانه','خبر','اطلاع رسانی','اطلاع‌رسانی','روابط عمومی','انتشار']},
 {label:'امور بین‌الملل',keywords:['بین الملل','بین‌الملل','بین المللی','بین‌المللی','کشورهای','جهانی','خارجی']},
 {label:'امور اجتماعی و خانواده',keywords:['اجتماعی','خانواده','زن','زنان','خواهران','بانوان','جمعیت','سبک زندگی']},
 {label:'امور حوزوی',keywords:['حوزه','حوزوی','طلبه','طلاب','مدرسه علمیه','مدارس علمیه','روحانیت']},
 {label:'امور دانش‌آموختگان و شبکه نخبگانی',keywords:['دانش آموخته','دانش‌آموخته','فارغ التحصیل','فارغ‌التحصیل','نخبگان','شبکه نخبگانی']},
 {label:'پشتیبانی و خدمات سازمانی',keywords:['پشتیبانی','تدارکات','اموال','خدمات','ساختمان','تجهیزات','خرید']}
];

function keywordScore(text,t,weight=1){
 let score=0,hits=[];
 for(const k of t.keywords){
   const n=norm(k);
   if(text.includes(n)){const count=Math.min(5,text.split(n).length-1);score+=count*(n.includes(' ')?4:2)*weight;hits.push(k)}
 }
 return{score,hits}
}
function rankedScore({title,headings,body},t){
 const a=keywordScore(title,t,12),b=keywordScore(headings,t,5),c=keywordScore(body,t,1);
 return{score:a.score+b.score+c.score,hits:[...new Set([...a.hits,...b.hits,...c.hits])],signals:{title:a.score,headings:b.score,body:c.score}}
}

const GENERIC_TITLE_WORDS=new Set(['سند','آیین‌نامه','آیین نامه','دستورالعمل','بخشنامه','مصوبه','صورتجلسه','گزارش','قانون','ضوابط']);
const genericHeadingRx=[
 /^متن\s+(مصوبه|تصویب[\s‌-]*نامه|آیین[\s‌-]*نامه|سند|دستورالعمل|بخشنامه)\b/i,
 /^(مقدمه|کلیات|تعاریف|موضوع|متن سند|متن مصوبه)\s*[:：\-–—]?\s*$/i,
 /^فصل\s+(اول|دوم|سوم|چهارم|پنجم|\d+|[۰-۹]+)\s*$/i
];
function cleanTopicCandidate(s){
 let x=normalizePersianText(String(s||'')).replace(/[\u200c\u200d\s]+/g,' ').trim();
 x=x.replace(/^[\s\-–—:؛،.]+|[\s\-–—:؛،.]+$/g,'');
 return x;
}
function isGenericHeading(s){
 const x=cleanTopicCandidate(s);
 return !x||genericHeadingRx.some(rx=>rx.test(x));
}
function titleQuality(s,index=0){
 const x=cleanTopicCandidate(s),words=x.split(/\s+/).filter(Boolean);
 if(!x||isGenericHeading(x)||words.length<3||x.length<8||x.length>220)return -1e9;
 let score=1000-index*12;
 if(/آیین[\s‌-]*نامه|دستورالعمل|بخشنامه|اساسنامه|شیوه[\s‌-]*نامه|ضوابط|سیاست|راهبرد|برنامه|مصوبه|قانون/.test(x))score+=1400;
 if(/حقوق|مزایا|کارکنان|منابع انسانی|آموزش|پژوهش|فرهنگ|بودجه|مالی|ساختار|تشکیلات|فناوری|نظارت|ارزیابی|حوزوی|خواهران/.test(x))score+=600;
 if(words.length>=4&&words.length<=18)score+=350;
 if(/[.:؛!?؟]$/.test(x))score-=180; // body sentence is less likely a title
 if(/^(با توجه|نظر به|در راستای|به منظور|ماده\s|تبصره\s)/.test(x))score-=900;
 return score;
}
function documentCandidateLines(parsed,blocks){
 const out=[],seen=new Set(),push=s=>{
   const x=cleanTopicCandidate(s),n=norm(x);
   if(!x||seen.has(n))return;seen.add(n);out.push(x);
 };
 for(const x of (parsed?.structure?.readingOrderLines||[]))push(x);
 for(const b of (blocks||[])){
   if(b.type==='paragraph')push(b.text);
   else if(b.type==='table')for(const row of (b.rows||[]))for(const c of (row||[])){
     for(const pp of (c.paragraphs||[]))push(pp);
     push(c.text);
   }
 }
 for(const x of String(parsed?.text||'').split(/\r?\n/))push(x);
 return out.slice(0,60);
}
function detectDocumentTitle(parsed,blocks){
 const lines=documentCandidateLines(parsed,blocks);
 let best=null;
 lines.slice(0,30).forEach((line,i)=>{
   const score=titleQuality(line,i);
   if(!best||score>best.score)best={label:line,score,index:i};
 });
 return {best:best&&best.score>-1e8?best:null,lines};
}
function usableTopicCandidate(s){
 const x=cleanTopicCandidate(s),w=x.split(/\s+/).filter(Boolean);
 return !!x&&!isGenericHeading(x)&&w.length>=2&&w.length<=22&&x.length<=180;
}
function dynamicCandidates(formTitle,parsed,blocks){
 const out=[],seen=new Set(),push=(label,source,score)=>{
   const x=cleanTopicCandidate(label),n=norm(x);
   if(!usableTopicCandidate(x)||seen.has(n))return;
   seen.add(n);out.push({label:x,source,score,confidence:source==='document_title'?'high':'medium',matchedKeywords:[],signals:{title:score,headings:0,body:0}});
 };
 const det=detectDocumentTitle(parsed,blocks);
 if(det.best)push(det.best.label,'document_title',3000+det.best.score);
 // Form title is second, never ahead of a strong title read from the document.
 push(formTitle,'form_title',1800);
 // only heading-like early lines, excluding boilerplate such as "متن مصوبه ..."
 for(let i=0;i<Math.min(18,det.lines.length);i++){
   const x=det.lines[i],w=x.split(/\s+/).length;
   if(det.best&&norm(x)===norm(det.best.label))continue;
   if(w<=14&&usableTopicCandidate(x))push(x,'heading',900-i*20);
 }
 return {items:out,detectedTitle:det.best?.label||null,firstLines:det.lines.slice(0,10)};
}

function canonicalExisting(db,org){
 const set=new Map();
 for(const x of TAXONOMY)set.set(norm(x.label),x.label);
 for(const d of (db.documents||[]).filter(x=>x.organizationId===org)){
   const md=d.canonicalMetadata||d.metadata||{},v=String(md.subjectArea||'').trim();
   if(v&&!set.has(norm(v)))set.set(norm(v),v);
 }
 return [...set.values()].sort((a,b)=>a.localeCompare(b,'fa'));
}

export default async function handler(req,res){
 try{
  if(req.method!=='POST')return send(res,405,{message:'Method not allowed'});
  const b=typeof req.body==='object'?req.body:JSON.parse(req.body||'{}');
  if(!b.contentBase64||!b.fileName)return send(res,400,{message:'فایل برای تحلیل موضوعی ارسال نشده است.'});
  const parsed=await parseArtifact({buffer:Buffer.from(b.contentBase64,'base64'),mimeType:b.mimeType||'application/octet-stream',fileName:b.fileName});
  const body=norm(parsed.text),title=norm(b.title||'');
  const blocks=parsed.structure?.kind==='docx'&&Array.isArray(parsed.structure.blocks)?parsed.structure.blocks:[];
  const headingTexts=blocks.filter(x=>x.type==='paragraph').slice(0,12).map(x=>x.text).filter(Boolean);
  const headings=norm(headingTexts.join(' '));
  const ranked=TAXONOMY.map(t=>({label:t.label,...rankedScore({title,headings,body},t),source:'taxonomy'})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const repo=createRepository(),db=await repo.all(),org=String(req.headers['x-org-id']||'ORG:SYN-001');
  const existing=canonicalExisting(db,org);
  const dyn=dynamicCandidates(b.title||'',parsed,blocks),dynamic=dyn.items;
  const combined=[],seen=new Set();
  for(const x of [...dynamic,...ranked]){
    const n=norm(x.label);if(!n||seen.has(n))continue;seen.add(n);combined.push(x);
  }
  const catalogMap=new Map();
  for(const x of [...dynamic.map(x=>x.label),...existing])catalogMap.set(norm(x),x);
  const catalog=[...catalogMap.values()];
  const recommended=combined.slice(0,5).map((x,i)=>({
    label:x.label,score:x.score,
    confidence:x.confidence||(i===0&&x.score>=12?'high':x.score>=6?'medium':'low'),
    matchedKeywords:(x.hits||x.matchedKeywords||[]).slice(0,6),
    signals:x.signals||{},source:x.source||'taxonomy'
  }));
  return send(res,200,{catalog,recommended,analysis:{characters:parsed.text.length,units:parsed.units?.length||0,parser:parsed.structure?.kind||'unknown',priorityOrder:['document_title','form_title','heading','taxonomy','body'],detectedTitle:dyn.detectedTitle,firstLines:dyn.firstLines}});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطا در تحلیل حوزه موضوعی'})}
}