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

function score(text,t){
 let score=0,hits=[];
 for(const k of t.keywords){const n=norm(k);if(text.includes(n)){const count=Math.min(5,text.split(n).length-1);score+=count*(n.includes(' ')?4:2);hits.push(k)}}
 return{score,hits}
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
  const text=norm(parsed.text);
  const ranked=TAXONOMY.map(t=>({label:t.label,...score(text,t)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const repo=createRepository(),db=await repo.all(),org=String(req.headers['x-org-id']||'ORG:SYN-001');
  const catalog=canonicalExisting(db,org);
  const recommended=ranked.slice(0,3).map((x,i)=>({label:x.label,score:x.score,confidence:i===0&&x.score>=12?'high':x.score>=6?'medium':'low',matchedKeywords:x.hits.slice(0,6)}));
  return send(res,200,{catalog,recommended,analysis:{characters:parsed.text.length,units:parsed.units?.length||0,parser:parsed.structure?.kind||'unknown'}});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطا در تحلیل حوزه موضوعی'})}
}