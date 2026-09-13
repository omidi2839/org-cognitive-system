import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { parseArtifact, normalizePersianText } from '../src/processing/parser.js';

import { requireAuthenticated } from '../src/infrastructure/authSession.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
const norm=s=>normalizePersianText(String(s??'')).toLowerCase().replace(/\s+/g,' ').trim();

const TAXONOMY=[
 {label:'راهبرد و برنامه‌ریزی',keywords:['راهبرد','استراتژی','چشم انداز','چشم‌انداز','ماموریت','مأموریت','برنامه','هدف کلان','سیاست کلان']},
 {label:'منابع انسانی',keywords:['منابع انسانی','کارکنان','نیروی انسانی','استخدام','انتصاب','حقوق','مزایا','دستمزد','رفاه','شغل','شایستگی']},
 {label:'مالی و بودجه',keywords:['بودجه','مالی','اعتبار','هزینه','درآمد','ذیحساب','تخصیص','حسابداری','خزانه']},
 {label:'فناوری و زیرساخت',keywords:['فناوری','اطلاعات','سامانه','دیجیتال','هوش مصنوعی','داده','نرم افزار','نرم‌افزار','امنیت اطلاعات','شبکه','زیرساخت']},
 {label:'آموزش',keywords:['آموزش','تربیت','تحصیل','دوره','فراگیر','استاد','درس','مهارت','یادگیری']},
 {label:'پژوهش و نوآوری',keywords:['پژوهش','تحقیق','مقاله','علمی','دانش','تولید علم','نوآوری','مالکیت فکری','نشریه']},
 {label:'فروش و بازاریابی',keywords:['فروش','بازاریابی','بازار','تبلیغات تجاری','قیمت گذاری','قیمت‌گذاری','کانال فروش','برند']},
 {label:'مشتریان و ذی‌نفعان',keywords:['مشتری','مشتریان','ذی نفع','ذی‌نفع','رضایت','تجربه مشتری','خدمت گیرنده','خدمت‌گیرنده']},
 {label:'عملیات و فرآیندها',keywords:['فرآیند','فرایند','عملیات','روش اجرایی','دستورالعمل','گردش کار','بهره وری','بهره‌وری']},
 {label:'حقوقی و مقررات',keywords:['قانون','حقوقی','مقررات','آیین نامه','آیین‌نامه','ضابطه','الزام','ماده','تبصره','قرارداد']},
 {label:'ساختار و حاکمیت سازمانی',keywords:['ساختار','تشکیلات','سازماندهی','واحد سازمانی','پست سازمانی','شرح وظایف','تفویض اختیار','حاکمیت']},
 {label:'نظارت، ارزیابی و عملکرد',keywords:['نظارت','ارزیابی','عملکرد','شاخص','پایش','بازرسی','کنترل','گزارش عملکرد']},
 {label:'ریسک، ایمنی و امنیت',keywords:['ریسک','خطر','ایمنی','امنیت','بحران','تداوم کسب و کار','حفاظت']},
 {label:'ارتباطات و رسانه',keywords:['ارتباطات','رسانه','خبر','اطلاع رسانی','اطلاع‌رسانی','روابط عمومی','انتشار']},
 {label:'تدارکات، خرید و زنجیره تأمین',keywords:['خرید','تدارکات','تامین','تأمین','زنجیره تامین','زنجیره تأمین','انبار','تامین کننده','تأمین‌کننده']},
 {label:'دارایی‌ها، اموال و پشتیبانی',keywords:['اموال','دارایی','ساختمان','تجهیزات','خودرو','پشتیبانی','خدمات سازمانی','نگهداری']},
 {label:'محصول و خدمت',keywords:['محصول','خدمت','خدمات','طراحی محصول','توسعه محصول','سبد محصول','کیفیت خدمت']},
 {label:'کیفیت و بهبود',keywords:['کیفیت','بهبود','استاندارد','ممیزی','اصلاح فرآیند','اصلاح فرایند','بهره وری','بهره‌وری']},
 {label:'پروژه‌ها و برنامه‌های اجرایی',keywords:['پروژه','طرح','برنامه اجرایی','زمان بندی','زمان‌بندی','تحویل','پیشرفت پروژه']},
 {label:'امور فرهنگی و اجتماعی',keywords:['فرهنگ','اجتماعی','خانواده','بانوان','خواهران','سبک زندگی','تبلیغ دینی','معارف']},
 {label:'امور تخصصی حوزه فعالیت سازمان',keywords:['حوزوی','طلبه','طلاب','مدرسه علمیه','مدارس علمیه','روحانیت','تخصصی']},
 {label:'امور بین‌الملل',keywords:['بین الملل','بین‌الملل','بین المللی','بین‌المللی','خارجی','جهانی','کشورها']}
];

const SUBTOPIC_RULES={
 'منابع انسانی':[
  {label:'حقوق و دستمزد و مزایا',keywords:['حقوق','دستمزد','مزایا','فوق العاده','فوق‌العاده','حق شغل','رفاه']},
  {label:'استخدام و جذب',keywords:['استخدام','جذب','آزمون استخدامی','گزینش']},
  {label:'انتصاب و ارتقا',keywords:['انتصاب','ارتقا','ارتقاء','پست مدیریتی']},
  {label:'ارزیابی عملکرد کارکنان',keywords:['ارزیابی کارکنان','عملکرد کارکنان','ارزشیابی']},
  {label:'آموزش و توسعه کارکنان',keywords:['آموزش کارکنان','توسعه کارکنان','توانمندسازی']},
  {label:'طبقه‌بندی مشاغل و شایستگی',keywords:['طبقه بندی مشاغل','طبقه‌بندی مشاغل','شایستگی','شرح شغل']}
 ],
 'فناوری و زیرساخت':[
  {label:'زیرساخت و شبکه',keywords:['شبکه','سرور','زیرساخت','مرکز داده','دیتاسنتر']},
  {label:'سامانه‌ها و نرم‌افزار',keywords:['سامانه','نرم افزار','نرم‌افزار','اپلیکیشن']},
  {label:'داده و هوش مصنوعی',keywords:['داده','هوش مصنوعی','تحلیل داده','یادگیری ماشین']},
  {label:'امنیت اطلاعات و سایبری',keywords:['امنیت اطلاعات','امنیت سایبری','دسترسی','حفاظت داده']}
 ],
 'آموزش':[
  {label:'برنامه و محتوای آموزشی',keywords:['برنامه آموزشی','محتوای آموزشی','سرفصل','درس']},
  {label:'پذیرش و امور فراگیران',keywords:['پذیرش','دانشجو','طلبه','فراگیر']},
  {label:'اساتید و مدرسان',keywords:['استاد','مدرس','هیئت علمی','هیأت علمی']},
  {label:'ارزیابی و کیفیت آموزشی',keywords:['ارزیابی آموزشی','آزمون','کیفیت آموزشی']}
 ],
 'پژوهش و نوآوری':[
  {label:'طرح‌ها و پروژه‌های پژوهشی',keywords:['طرح پژوهشی','پروژه پژوهشی','تحقیق']},
  {label:'انتشارات و مقالات علمی',keywords:['مقاله','نشریه','کتاب','انتشار علمی']},
  {label:'نوآوری و مالکیت فکری',keywords:['نوآوری','اختراع','مالکیت فکری','ثبت اختراع']}
 ],
 'مالی و بودجه':[
  {label:'بودجه‌ریزی و تخصیص',keywords:['بودجه','تخصیص','اعتبار']},
  {label:'حسابداری و گزارشگری مالی',keywords:['حسابداری','صورت مالی','گزارش مالی']},
  {label:'هزینه‌ها و پرداخت‌ها',keywords:['هزینه','پرداخت','پرداختی','کارانه']}
 ],
 'فروش و بازاریابی':[
  {label:'فروش و کانال‌های فروش',keywords:['فروش','کانال فروش','نمایندگی']},
  {label:'بازاریابی و برند',keywords:['بازاریابی','برند','کمپین']},
  {label:'قیمت‌گذاری',keywords:['قیمت گذاری','قیمت‌گذاری','تعرفه']}
 ],
 'مشتریان و ذی‌نفعان':[
  {label:'رضایت و تجربه مشتری',keywords:['رضایت','تجربه مشتری','نظرسنجی']},
  {label:'خدمات و پشتیبانی مشتری',keywords:['پشتیبانی مشتری','خدمات مشتری','شکایت']},
  {label:'مدیریت ذی‌نفعان',keywords:['ذی نفع','ذی‌نفع','ذینفع']}
 ],
 'حقوقی و مقررات':[
  {label:'آیین‌نامه‌ها و دستورالعمل‌ها',keywords:['آیین نامه','آیین‌نامه','دستورالعمل','ضوابط']},
  {label:'قراردادها و تعهدات حقوقی',keywords:['قرارداد','تعهد','توافقنامه']},
  {label:'مصوبات و اصلاحیه‌ها',keywords:['مصوبه','اصلاحیه','الحاق','لغو','جایگزینی']}
 ],
 'عملیات و فرآیندها':[
  {label:'فرآیندها و گردش کار',keywords:['فرآیند','فرایند','گردش کار']},
  {label:'روش‌های اجرایی و دستورالعمل عملیات',keywords:['روش اجرایی','عملیات','دستورالعمل']},
  {label:'بهره‌وری و بهبود عملیات',keywords:['بهره وری','بهره‌وری','بهبود عملیات']}
 ]
};

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


function rankSubtopics(parent,text){
 const rules=SUBTOPIC_RULES[parent]||[];
 return rules.map(r=>{
   let score=0,hits=[];
   for(const k of r.keywords){
     const n=norm(k),count=text.includes(n)?Math.min(5,text.split(n).length-1):0;
     if(count){score+=count*(n.includes(' ')?5:3);hits.push(k)}
   }
   return{label:r.label,score,hits};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}
function fallbackSubtopic(detTitle,parent){
 const x=cleanTopicCandidate(detTitle||'');
 if(!x||isGenericHeading(x))return null;
 // Strip common document-type boilerplate but keep the semantic title.
 return x.replace(/^(آیین[\s‌-]*نامه|دستورالعمل|بخشنامه|مصوبه|شیوه[\s‌-]*نامه|ضوابط)\s+/,'').trim()||null;
}
export default async function handler(req,res){
 if(!requireAuthenticated(req,res)) return;
 try{
  if(req.method!=='POST')return send(res,405,{message:'Method not allowed'});
  const b=typeof req.body==='object'?req.body:JSON.parse(req.body||'{}');
  if(!b.fileName&&!b.title)return send(res,400,{message:'عنوان یا نام فایل برای پیشنهاد موضوع لازم است.'});
  const metadataOnly=!b.contentBase64;
  const parsed=metadataOnly
    ?{text:'',units:[],structure:{kind:'metadata-only',blocks:[],readingOrderLines:[]}}
    :await parseArtifact({buffer:Buffer.from(b.contentBase64,'base64'),mimeType:b.mimeType||'application/octet-stream',fileName:b.fileName});
  const body=norm(parsed.text),title=norm(`${b.title||''} ${b.fileName||''}`);
  const blocks=parsed.structure?.kind==='docx'&&Array.isArray(parsed.structure.blocks)?parsed.structure.blocks:[];
  const headingTexts=blocks.filter(x=>x.type==='paragraph').slice(0,12).map(x=>x.text).filter(Boolean);
  const headings=norm(headingTexts.join(' '));
  const ranked=TAXONOMY.map(t=>({label:t.label,...rankedScore({title,headings,body},t),source:'taxonomy'})).sort((a,b)=>b.score-a.score);
  const repo=createRepository(),db=await repo.all(),org=String((req.headers||{})['x-org-id']||'ORG:SYN-001');
  const dyn=dynamicCandidates(b.title||'',parsed,blocks);

  const primaryCatalog=TAXONOMY.map(x=>x.label);
  const primaryRecommended=ranked.filter(x=>x.score>0).slice(0,5).map((x,i)=>({
    label:x.label,score:x.score,confidence:i===0&&x.score>=12?'high':x.score>=6?'medium':'low',
    matchedKeywords:(x.hits||[]).slice(0,6),signals:x.signals||{}
  }));

  const primary=String(b.primaryTopic||primaryRecommended?.[0]?.label||'').trim();
  const subRank=rankSubtopics(primary,`${title} ${headings} ${body}`);
  const fallback=fallbackSubtopic(dyn.detectedTitle,primary);
  const subtopics=[];
  const seenSub=new Set();
  for(const x of [...subRank.map(x=>({label:x.label,score:x.score,source:'rule'})),...(fallback?[{label:fallback,score:1,source:'document_title'}]:[])]){
    const n=norm(x.label);if(!n||seenSub.has(n))continue;seenSub.add(n);subtopics.push(x);
  }

  return send(res,200,{
    catalog:primaryCatalog,
    recommended:primaryRecommended,
    primaryCatalog,
    primaryRecommended,
    subtopics:subtopics.slice(0,8),
    analysis:{
      characters:parsed.text.length,units:parsed.units?.length||0,parser:parsed.structure?.kind||'unknown',
      priorityOrder:['primary_taxonomy','subtopic_rules','document_title'],
      detectedTitle:dyn.detectedTitle,firstLines:dyn.firstLines,
      mode:metadataOnly?'metadata-fast':'content-analysis'
    }
  });
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطا در تحلیل حوزه موضوعی'})}
}