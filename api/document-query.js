import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { requireAuthenticated } from '../src/infrastructure/authSession.js';
const send=(res,s,d)=>{res.statusCode=s;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(d))};
const norm=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const digits=s=>String(s??'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const stop=new Set('در از به را رو برای درباره مورد مربوط مرتبط سند اسناد مصوبه مصوبات بگو بگید بیار بیاور نشان نمایش بده کن لطفا لطفاً چی چه چیزی آمده اومده گفته شده است هست آیا مثلا مثلاً و یا که این آن یک متن محتوای لیست فهرست پیدا'.split(/\s+/));
const sentences=t=>String(t||'').replace(/\r/g,'\n').split(/(?<=[.!؟؛])\s+|\n+/u).map(x=>x.trim()).filter(x=>x.length>12);
const metaOf=d=>d.canonicalMetadata||d.metadata||d;
const field=(d,m,k)=>d?.[k]??m?.[k]??null;
const docNoOf=(d,m)=>String(field(d,m,'documentNumber')||'');
const yearOfDate=s=>{const m=String(s||'').match(/^(\d{4})/);if(!m)return null;const y=+m[1];if(y>=1300&&y<=1500)return y;if(y>=1900&&y<=2200)return y-621;return null};
const relationIntent=q=>{const n=norm(q);if(/اصلاحیه/.test(n))return'amends';if(/الحاقیه/.test(n))return'extends';if(/استفسار/.test(n))return'clarifies';if(/ملغی|لغو/.test(n))return'repeals';return null};
const explicitNumber=q=>{const n=digits(q);let m=n.match(/(?:مصوبه|سند|تصمیم)\s*(?:شماره)?\s*(\d+)/);return m?.[1]||''};
const meetingNumber=q=>digits(q).match(/جلسه\s*(?:شماره)?\s*(\d+)/)?.[1]||'';
const yearsOf=q=>[...digits(q).matchAll(/(?:سال\s*)?(1[34]\d{2})/g)].map(x=>+x[1]).filter((v,i,a)=>a.indexOf(v)===i);
const typeHints=['آیین نامه','آیین‌نامه','بخشنامه','صورتجلسه','صورت جلسه','دستورالعمل','شیوه نامه','شیوه‌نامه','مصوبه'];

const issuerGeneric=new Set('شورا شورای کمیسیون هیئت هیات کارگروه مرکز سازمان معاونت اداره دبیرخانه وزارت وزارتخانه دانشگاه پژوهشگاه'.split(/\s+/));
const commandTail=/\b(?:رو|را)?\s*(?:بیار|بیاور|بده|نشان بده|نمایش بده|پیدا کن|لیست کن|فهرست کن)\b.*$/u;
const issuerLead=/(?:^|\s)(?:اسناد|سندهای|مصوبات|مصوبه‌های|صورتجلسات|جلسات)\s+(.+?)(?=\s+(?:رو|را|جلسه|شماره|سال|بیار|بیاور|بده|نشان|نمایش|پیدا|لیست|فهرست)\b|$)/u;
function tokenSet(v){return new Set(norm(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean))}
function issuerMatch(question,issuers){
 const nq=norm(question);
 const sorted=[...issuers].sort((a,b)=>String(b).length-String(a).length);
 const exact=sorted.find(x=>nq.includes(norm(x)));
 if(exact)return{issuer:exact,mention:exact,mode:'exact',score:1};

 // Capture the organization-like phrase that naturally follows «اسناد/مصوبات/جلسات».
 const cleaned=nq.replace(commandTail,' ').trim();
 const m=cleaned.match(issuerLead);
 const mention=norm(m?.[1]||'');
 const qTokens=tokenSet(mention||nq);

 let best=null;
 for(const issuer of sorted){
   const iNorm=norm(issuer),iTokens=tokenSet(iNorm);
   let shared=0;for(const t of qTokens)if(iTokens.has(t))shared++;
   const coverage=qTokens.size?shared/qTokens.size:0;
   const issuerCoverage=iTokens.size?shared/iTokens.size:0;
   const hasGeneric=[...issuerGeneric].some(t=>qTokens.has(norm(t))&&iTokens.has(norm(t)));
   const score=coverage*.68+issuerCoverage*.22+(hasGeneric?.10:0);
   if(shared&&(hasGeneric||shared>=2)&&(!best||score>best.score))best={issuer,mention:mention||[...qTokens].join(' '),mode:'fuzzy',score};
 }

 // Short natural aliases such as «شورا» are accepted only when they identify one issuer unambiguously.
 if(!best){
   for(const alias of ['شورا','کمیسیون','هیئت','هیات','کارگروه','دبیرخانه','وزارت','دانشگاه','پژوهشگاه']){
     if(!nq.includes(alias))continue;
     const candidates=sorted.filter(x=>norm(x).includes(alias));
     if(candidates.length===1)return{issuer:candidates[0],mention:alias,mode:'unique_alias',score:.8};
     // Prefer the policy council for bare «شورا» only when it is the sole policy-setting council in stored metadata.
     if(alias==='شورا'){
       const policy=candidates.filter(x=>/سیاست ?گذاری/.test(norm(x)));
       if(policy.length===1)return{issuer:policy[0],mention:alias,mode:'policy_council_alias',score:.76};
     }
   }
 }
 return best&&best.score>=.52?best:null;
}

function termsOf(q,known=[]){
 let n=norm(q);known.forEach(x=>{if(x)n=n.replaceAll(norm(x),' ')});
 n=n.replace(/(?:جلسه|مصوبه|سند|تصمیم)\s*(?:شماره)?\s*[۰-۹٠-٩0-9]+/g,' ').replace(/(?:از\s+)?سال\s*[۰-۹٠-٩0-9]{4}(?:\s*تا\s*(?:سال\s*)?[۰-۹٠-٩0-9]{4})?/g,' ');
 return[...new Set(n.split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1&&!stop.has(x)))];
}
export default async function handler(req,res){
 if(!requireAuthenticated(req,res))return;
 try{
  if(req.method!=='GET')return send(res,405,{message:'Method not allowed'});
  const repo=createRepository(),org=String(req.headers['x-org-id']||'ORG:SYN-001'),u=new URL(req.url,'https://local');
  const question=String(u.searchParams.get('question')||u.searchParams.get('q')||''),mode=u.searchParams.get('mode')||'search',db=await repo.all(),nq=norm(question);
  const textByDoc=new Map();for(const x of(db.normalizedDocuments||[])){const id=x.documentRef||x.documentId||x.sourceDocumentRef,txt=String(x.text||x.content||x.normalizedText||'');if(id&&txt.length>(textByDoc.get(id)||'').length)textByDoc.set(id,txt)}
  const all=(db.documents||[]).filter(d=>d.organizationId===org);
  const actualTopics=[...new Set(all.flatMap(d=>[field(d,metaOf(d),'subjectCategory'),field(d,metaOf(d),'subjectArea')]).filter(Boolean))];
  const actualIssuers=[...new Set(all.map(d=>field(d,metaOf(d),'issuer')).filter(Boolean))];
  const matchedTopic=actualTopics.sort((a,b)=>String(b).length-String(a).length).find(x=>nq.includes(norm(x)))||null;
  const issuerHit=issuerMatch(question,actualIssuers);
  const matchedIssuer=issuerHit?.issuer||null;
  const type=typeHints.find(x=>nq.includes(norm(x)))||null;
  const dno=explicitNumber(question),mno=meetingNumber(question),yrs=yearsOf(question),validOnly=/معتبر/.test(nq);
  const known=[matchedTopic,matchedIssuer,issuerHit?.mention,type,'اصلاحیه','الحاقیه','استفسار','ملغی','لغو','معتبر'];
  const terms=termsOf(question,known);

  let docs=all.map(d=>{const m=metaOf(d),text=textByDoc.get(d.id)||String(d.content||'');return{d,m,text}});
  if(dno)docs=docs.filter(x=>digits(docNoOf(x.d,x.m))===dno);
  if(mno)docs=docs.filter(x=>digits(field(x.d,x.m,'meetingNumber')||'')===mno);
  if(matchedTopic)docs=docs.filter(x=>[field(x.d,x.m,'subjectCategory'),field(x.d,x.m,'subjectArea')].some(v=>norm(v).includes(norm(matchedTopic))||norm(matchedTopic).includes(norm(v))));
  if(matchedIssuer)docs=docs.filter(x=>{const a=norm(field(x.d,x.m,'issuer')),b=norm(matchedIssuer);return a===b||a.includes(b)||b.includes(a)});
  if(type)docs=docs.filter(x=>norm(field(x.d,x.m,'documentType')).includes(norm(type.replace(' ','‌')))||norm(field(x.d,x.m,'documentType')).includes(norm(type)));
  if(validOnly)docs=docs.filter(x=>['valid','active','معتبر'].includes(norm(field(x.d,x.m,'validityStatus')))||norm(field(x.d,x.m,'validityStatus')).includes('معتبر'));
  if(yrs.length){
    const lo=Math.min(...yrs),hi=Math.max(...yrs);
    docs=docs.filter(x=>{const y=yearOfDate(field(x.d,x.m,'promulgationDate')||field(x.d,x.m,'issuedAt')||field(x.d,x.m,'meetingDate'));return y&&y>=lo&&y<=hi});
  }

  const relType=relationIntent(question);
  if(relType&&dno){
    const mother=all.find(d=>digits(docNoOf(d,metaOf(d)))===dno);
    if(mother){
      const rels=(db.documentRelations||[]).filter(r=>r.organizationId===org&&r.status!=='deleted'&&r.targetDocumentRef===mother.id&&r.relationType===relType);
      const ids=new Set(rels.map(r=>r.sourceDocumentRef));docs=docs.filter(x=>ids.has(x.d.id));
    }else docs=[];
  }

  const itemOf=x=>({id:x.d.id,title:x.d.title,documentType:field(x.d,x.m,'documentType'),subjectCategory:field(x.d,x.m,'subjectCategory'),subjectArea:field(x.d,x.m,'subjectArea'),issuer:field(x.d,x.m,'issuer'),documentNumber:field(x.d,x.m,'documentNumber'),meetingNumber:field(x.d,x.m,'meetingNumber'),meetingDate:field(x.d,x.m,'meetingDate'),meetingType:field(x.d,x.m,'meetingType'),promulgationDate:field(x.d,x.m,'promulgationDate'),validityStatus:field(x.d,x.m,'validityStatus')});

  if(mode==='qa'||/(عبارت|صحبت|آمده|ذکر|درباره|در مورد)/.test(nq)){
    let ev=[];for(const x of docs){for(const [i,st] of sentences(x.text).entries()){const ns=norm(st);let score=0,h=0;for(const t of terms)if(ns.includes(t)){score+=4;h++}if(terms.length&&h===terms.length)score+=10;if(score)ev.push({documentId:x.d.id,documentTitle:x.d.title,text:st,location:`بخش ${i+1}`,score})}}
    ev.sort((a,b)=>b.score-a.score);ev=ev.slice(0,8);
    const summary=ev.length?`${ev.length} شاهد متنی مرتبط در بانک اسناد پیدا شد.`:docs.length?'اسناد مطابق فیلترها پیدا شدند، اما شاهد متنی صریحی برای عبارت موردنظر یافت نشد.':'سندی مطابق درخواست پیدا نشد.';
    return send(res,200,{answer:{summary,scopeLabel:'بانک اسناد',evidence:ev},items:docs.slice(0,30).map(itemOf),parsed:{topic:matchedTopic,issuer:matchedIssuer,issuerMention:issuerHit?.mention||null,issuerMatchMode:issuerHit?.mode||null,issuerMatchScore:issuerHit?.score||null,documentNumber:dno||null,meetingNumber:mno||null,years:yrs,relationType:relType,residualTerms:terms}});
  }

  const hasStructured=Boolean(matchedIssuer||mno||dno||matchedTopic||type||validOnly||yrs.length);
  let items=[];for(const x of docs){
    const hay=norm([x.d.title,field(x.d,x.m,'documentType'),field(x.d,x.m,'subjectCategory'),field(x.d,x.m,'subjectArea'),field(x.d,x.m,'issuer'),x.text].join(' '));
    if(terms.length&&!hasStructured&&!terms.some(t=>hay.includes(t)))continue;
    const ss=terms.length?sentences(x.text).filter(st=>terms.some(t=>norm(st).includes(t))):[];
    items.push({...itemOf(x),excerpt:ss[0]||String(x.text).slice(0,360)})
  }
  return send(res,200,{items:items.slice(0,50),parsed:{topic:matchedTopic,issuer:matchedIssuer,issuerMention:issuerHit?.mention||null,issuerMatchMode:issuerHit?.mode||null,issuerMatchScore:issuerHit?.score||null,documentNumber:dno||null,meetingNumber:mno||null,years:yrs,relationType:relType,residualTerms:terms}});
 }catch(e){console.error(e);return send(res,400,{message:e.message||'خطای جستجو و پرسش از اسناد'})}
}