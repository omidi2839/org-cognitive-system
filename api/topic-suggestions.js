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
const GENERIC_HEADING_PHRASES=new Set([
 'متن مصوبه','متن تصویب نامه','متن تصویب‌نامه','متن آیین نامه','متن آیین‌نامه',
 'مقدمه','کلیات','فصل اول','فصل دوم','تعاریف','موضوع','متن سند'
].map(norm));
function cleanTopicCandidate(s){
 let x=normalizePersianText(String(s||'')).replace(/\s+/g,' ').trim();
 x=x.replace(/^[\s\-–—:؛،.]+|[\s\-–—:؛،.]+$/g,'');
 return x;
}
function usableDynamicTopic(s,{allowLong=false}={}){
 const x=cleanTopicCandidate(s),words=x.split(/\s+/).filter(Boolean),n=norm(x);
 if(!x||words.length<2)return false;
 if(GENERIC_HEADING_PHRASES.has(n))return false;
 if(words.length<=2&&words.every(w=>GENERIC_TITLE_WORDS.has(w)))return false;
 if(!allowLong&&(words.length>14||x.length>110))return false;
 if(allowLong&&(words.length>24||x.length>180))return false;
 return true;
}
function documentVisibleLines(parsed,blocks){
 const lines=[];
 const push=s=>{
   const x=cleanTopicCandidate(s);
   if(!x)return;
   // Split accidental multi-line cell/paragraph content into visible lines.
   for(const part of x.split(/\r?\n/).map(cleanTopicCandidate).filter(Boolean))lines.push(part);
 };
 for(const b of (blocks||[])){
   if(b.type==='paragraph')push(b.text);
   else if(b.type==='table'){
     for(const row of (b.rows||[])){
       for(const c of (row||[]))push(c.text);
     }
   }else if(b.type==='mathFraction')continue;
   if(lines.length>=40)break;
 }
 if(!lines.length){
   for(const x of String(parsed?.text||'').split(/\r?\n/))push(x);
 }
 return lines;
}
function documentHeadingCandidates(parsed,blocks){
 const out=[];
 const lines=documentVisibleLines(parsed,blocks);
 // The first meaningful visible line, including content inside a Word table,
 // is the strongest document-title candidate.
 const first=lines.find(x=>usableDynamicTopic(x,{allowLong:true}))||'';
 if(first)out.push({label:first,source:'document_title',score:1400});
 let rank=0;
 for(const p of lines.slice(0,24)){
   if(norm(p)===norm(first)||!usableDynamicTopic(p))continue;
   const words=p.split(/\s+/).length;
   if(words<=12&&p.length<=100){
     out.push({label:p,source:'heading',score:780-rank*18});
     rank++;
   }
   if(out.length>=8)break;
 }
 return out;
}
function dynamicCandidates(formTitle,parsed,blocks){
 const out=[],seen=new Set(),push=(label,source,score)=>{
   const clean=cleanTopicCandidate(label),n=norm(clean);
   if(!usableDynamicTopic(clean,{allowLong:source==='document_title'})||seen.has(n))return;
   seen.add(n);out.push({
     label:clean,score,
     confidence:['document_title','form_title'].includes(source)?'high':'medium',
     matchedKeywords:[],
     signals:{title:['document_title','form_title'].includes(source)?score:0,headings:source==='heading'?score:0,body:0},
     source
   });
 };
 for(const x of documentHeadingCandidates(parsed,blocks))push(x.label,x.source,x.score);
 push(formTitle,'form_title',1000);
 return out;
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
  const dynamic=dynamicCandidates(b.title||'',parsed,blocks);
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
  return send(res,200,{catalog,recommended,analysis:{characters:parsed.text.length,units:parsed.units?.length||0,parser:parsed.structure?.kind||'unknown',priorityOrder:['document_title','form_title','heading','taxonomy','body']}});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطا در تحلیل حوزه موضوعی'})}
}