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

/* ---------- SINA AI Gateway V1 / 0.9.9.1.0 ---------- */
const k9910AiOutputText=r=>{
  if(typeof r?.output_text==='string')return r.output_text;
  for(const item of r?.output||[])for(const c of item?.content||[])
    if(c?.type==='output_text'&&c?.text)return c.text;
  return '';
};
async function k9910RunSinaAI(prompt){
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw Object.assign(new Error('OPENAI_API_KEY_REQUIRED'),{code:'OPENAI_API_KEY_REQUIRED'});
  const model=String(process.env.SINA_AI_MODEL||'gpt-5.6-terra');
  const base=String(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
  const maxOut=Math.max(64,Math.min(4096,Number(process.env.SINA_AI_MAX_OUTPUT_TOKENS||800)));
  const timeoutMs=Math.max(5000,Math.min(120000,Number(process.env.SINA_AI_TIMEOUT_MS||45000)));
  const started=Date.now();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  let response;
  try{
    response=await fetch(base+'/responses',{
      method:'POST',
      signal:controller.signal,
      headers:{'content-type':'application/json','authorization':'Bearer '+key},
      body:JSON.stringify({
        model,
        instructions:'تو «سینا»، دستیار هوش شناختی سازمان هستی. در این مرحله فقط اتصال فنی را آزمایش می‌کنی. فارسی، کوتاه، دقیق و حرفه‌ای پاسخ بده.',
        input:[{role:'user',content:[{type:'input_text',text:String(prompt||'').slice(0,8000)}]}],
        store:false,
        max_output_tokens:maxOut
      })
    });
  }finally{clearTimeout(timer)}
  if(!response.ok){
    const detail=(await response.text()).slice(0,1200);
    throw Object.assign(new Error('OPENAI_PROVIDER_ERROR '+response.status+' '+detail),{code:'OPENAI_PROVIDER_ERROR',status:response.status});
  }
  const raw=await response.json();
  const text=k9910AiOutputText(raw);
  if(!text)throw Object.assign(new Error('OPENAI_EMPTY_RESPONSE'),{code:'OPENAI_EMPTY_RESPONSE'});
  const u=raw.usage||{};
  return {
    ok:true,provider:'openai-responses',model,text,latencyMs:Date.now()-started,
    usage:{input:Number(u.input_tokens||0),output:Number(u.output_tokens||0),total:Number(u.total_tokens||0)}
  };
}


/* ---------- SINA Evidence & Tool Calling V1 / 0.9.9.1.1 ---------- */
function k9911BuildIndex(db,org){
  const textByDoc=new Map();
  for(const x of(db.normalizedDocuments||[])){
    const id=x.documentRef||x.documentId||x.sourceDocumentRef;
    const txt=String(x.text||x.content||x.normalizedText||'');
    if(id&&txt.length>(textByDoc.get(id)||'').length)textByDoc.set(id,txt);
  }
  const docs=(db.documents||[]).filter(d=>d.organizationId===org);
  const byId=new Map(docs.map(d=>[d.id,d]));
  return{docs,byId,textByDoc};
}
function k9911DocItem(d,text=''){
  const m=metaOf(d);
  return{
    id:d.id,title:d.title||'بدون عنوان',
    documentType:field(d,m,'documentType'),subjectCategory:field(d,m,'subjectCategory'),
    subjectArea:field(d,m,'subjectArea'),issuer:field(d,m,'issuer'),
    documentNumber:field(d,m,'documentNumber'),meetingNumber:field(d,m,'meetingNumber'),
    meetingDate:field(d,m,'meetingDate'),promulgationDate:field(d,m,'promulgationDate'),
    validityStatus:field(d,m,'validityStatus'),
    excerpt:String(text||'').slice(0,900)
  };
}
function k9911Search(db,org,query,mode='qa',limit=8){
  const {docs,textByDoc}=k9911BuildIndex(db,org),nq=norm(query);
  const issuers=[...new Set(docs.map(d=>field(d,metaOf(d),'issuer')).filter(Boolean))];
  const topics=[...new Set(docs.flatMap(d=>[field(d,metaOf(d),'subjectCategory'),field(d,metaOf(d),'subjectArea')]).filter(Boolean))];
  const issuerHit=issuerMatch(query,issuers),matchedIssuer=issuerHit?.issuer||null;
  const matchedTopic=topics.sort((a,b)=>String(b).length-String(a).length).find(x=>nq.includes(norm(x)))||null;
  const dno=explicitNumber(query),mno=meetingNumber(query),yrs=yearsOf(query);
  const type=typeHints.find(x=>nq.includes(norm(x)))||null;
  const known=[matchedTopic,matchedIssuer,issuerHit?.mention,type,'اصلاحیه','الحاقیه','استفسار','ملغی','لغو','معتبر'];
  const terms=termsOf(query,known);

  const ranked=[];
  for(const d of docs){
    const m=metaOf(d),text=textByDoc.get(d.id)||String(d.content||'');
    if(dno&&digits(docNoOf(d,m))!==dno)continue;
    if(mno&&digits(field(d,m,'meetingNumber')||'')!==mno)continue;
    if(matchedIssuer){
      const a=norm(field(d,m,'issuer')),b=norm(matchedIssuer);
      if(!(a===b||a.includes(b)||b.includes(a)))continue;
    }
    if(matchedTopic){
      const ok=[field(d,m,'subjectCategory'),field(d,m,'subjectArea')].some(v=>v&&(norm(v).includes(norm(matchedTopic))||norm(matchedTopic).includes(norm(v))));
      if(!ok)continue;
    }
    if(type&&!norm(field(d,m,'documentType')).includes(norm(type)))continue;
    if(yrs.length){
      const y=yearOfDate(field(d,m,'promulgationDate')||field(d,m,'issuedAt')||field(d,m,'meetingDate'));
      if(!y||y<Math.min(...yrs)||y>Math.max(...yrs))continue;
    }

    const hayMeta=norm([d.title,field(d,m,'documentType'),field(d,m,'subjectCategory'),field(d,m,'subjectArea'),field(d,m,'issuer'),docNoOf(d,m)].join(' '));
    let score=0;
    if(dno)score+=30;if(mno)score+=25;if(matchedIssuer)score+=20;if(matchedTopic)score+=16;if(type)score+=8;
    for(const term of terms){
      if(hayMeta.includes(term))score+=7;
      if(norm(text).includes(term))score+=3;
    }
    const ev=[];
    for(const [i,st] of sentences(text).entries()){
      const ns=norm(st);let h=0;
      for(const term of terms)if(ns.includes(term))h++;
      if(h){
        ev.push({text:st.slice(0,1200),location:`بخش ${i+1}`,score:h*4+(terms.length&&h===terms.length?8:0)});
      }
    }
    ev.sort((a,b)=>b.score-a.score);
    if(!score&&!ev.length&&terms.length)continue;
    score+=ev[0]?.score||0;
    ranked.push({score,document:k9911DocItem(d,text),evidence:ev.slice(0,3)});
  }
  ranked.sort((a,b)=>b.score-a.score);
  return{
    query,
    parsed:{topic:matchedTopic,issuer:matchedIssuer,documentNumber:dno||null,meetingNumber:mno||null,years:yrs,residualTerms:terms},
    results:ranked.slice(0,Math.max(1,Math.min(12,Number(limit)||8)))
  };
}
function k9911GetDocument(db,org,id){
  const {byId,textByDoc}=k9911BuildIndex(db,org),d=byId.get(id);
  if(!d)return{found:false,id};
  const text=textByDoc.get(id)||String(d.content||'');
  return{found:true,document:k9911DocItem(d,text),content:text.slice(0,9000),contentTruncated:text.length>9000};
}
function k9911GetRelations(db,org,id){
  const {byId}=k9911BuildIndex(db,org);
  const rels=(db.documentRelations||[]).filter(r=>r.organizationId===org&&r.status!=='deleted'&&(r.sourceDocumentRef===id||r.targetDocumentRef===id));
  return{
    documentId:id,
    relations:rels.slice(0,30).map(r=>{
      const otherId=r.sourceDocumentRef===id?r.targetDocumentRef:r.sourceDocumentRef;
      const other=byId.get(otherId);
      return{
        relationType:r.relationType,
        direction:r.sourceDocumentRef===id?'outgoing':'incoming',
        relatedDocumentId:otherId,
        relatedDocumentTitle:other?.title||null,
        targetArticle:r.targetArticle||null,targetClause:r.targetClause||null,
        effectiveFrom:r.effectiveFrom||null,legalEffect:r.legalEffect||null,
        evidence:r.evidence||null,confidence:r.confidence??null
      };
    })
  };
}
const k9911Tools=[
  {
    type:'function',name:'search_documents',
    description:'جستجو در بانک اسناد سازمان و بازیابی اسناد و شواهد متنی مرتبط. برای هر پرسش درباره اطلاعات سازمان ابتدا از این ابزار استفاده کن.',
    parameters:{
      type:'object',additionalProperties:false,
      properties:{
        query:{type:'string',description:'عبارت یا پرسش فارسی برای جستجو در بانک اسناد'},
        mode:{type:'string',enum:['search','qa'],description:'برای پرسش تحلیلی qa و برای یافتن سند search'},
        limit:{type:'integer',minimum:1,maximum:12}
      },
      required:['query','mode','limit']
    },strict:true
  },
  {
    type:'function',name:'get_document',
    description:'متن و فراداده یک سند مشخص را با شناسه سند می‌خواند. فقط برای اسنادی استفاده کن که از جستجو به دست آمده‌اند.',
    parameters:{
      type:'object',additionalProperties:false,
      properties:{document_id:{type:'string'}},
      required:['document_id']
    },strict:true
  },
  {
    type:'function',name:'get_document_relations',
    description:'روابط حقوقی و نسخه‌ای یک سند با اسناد دیگر، مانند اصلاحیه، الحاقیه، استفسار و لغو را برمی‌گرداند.',
    parameters:{
      type:'object',additionalProperties:false,
      properties:{document_id:{type:'string'}},
      required:['document_id']
    },strict:true
  }
];
async function k9911OpenAI(body){
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw Object.assign(new Error('OPENAI_API_KEY_REQUIRED'),{code:'OPENAI_API_KEY_REQUIRED'});
  const base=String(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),Math.max(5000,Math.min(120000,Number(process.env.SINA_AI_TIMEOUT_MS||45000))));
  try{
    const response=await fetch(base+'/responses',{
      method:'POST',signal:controller.signal,
      headers:{'content-type':'application/json','authorization':'Bearer '+key},
      body:JSON.stringify(body)
    });
    if(!response.ok){
      const detail=(await response.text()).slice(0,1600);
      throw Object.assign(new Error('OPENAI_PROVIDER_ERROR '+response.status+' '+detail),{code:'OPENAI_PROVIDER_ERROR',status:response.status});
    }
    return await response.json();
  }finally{clearTimeout(timer)}
}
function k9911EvidenceFromTool(toolResults){
  const out=[],seen=new Set();
  for(const tr of toolResults){
    if(tr.name==='search_documents'){
      for(const r of tr.result?.results||[]){
        const d=r.document;if(!d?.id)continue;
        for(const ev of r.evidence||[]){
          const key=d.id+'|'+ev.text;
          if(seen.has(key))continue;seen.add(key);
          out.push({documentId:d.id,documentTitle:d.title,documentNumber:d.documentNumber||null,issuer:d.issuer||null,location:ev.location||null,text:ev.text});
        }
        if(!(r.evidence||[]).length){
          const key=d.id+'|excerpt';
          if(!seen.has(key)&&d.excerpt){seen.add(key);out.push({documentId:d.id,documentTitle:d.title,documentNumber:d.documentNumber||null,issuer:d.issuer||null,location:null,text:d.excerpt})}
        }
      }
    }
    if(tr.name==='get_document'&&tr.result?.found){
      const d=tr.result.document,key=d.id+'|document';
      if(!seen.has(key)){seen.add(key);out.push({documentId:d.id,documentTitle:d.title,documentNumber:d.documentNumber||null,issuer:d.issuer||null,location:'متن سند',text:String(tr.result.content||'').slice(0,1200)})}
    }
  }
  return out.slice(0,12).map((x,i)=>({...x,sourceIndex:i+1}));
}
async function k9911RunEvidenceCommand(db,org,question){
  const model=String(process.env.SINA_AI_MODEL||'gpt-5.6-terra');
  const maxOut=Math.max(256,Math.min(5000,Number(process.env.SINA_AI_MAX_OUTPUT_TOKENS||1600)));
  const instructions=`تو «سینا»، دستیار هوش شناختی سازمان هستی.
برای هر ادعای مربوط به سازمان فقط از ابزارهای داخلی ارائه‌شده استفاده کن و ابتدا search_documents را فراخوانی کن.
اگر لازم بود سند خاص را با get_document یا روابط آن را با get_document_relations بررسی کن.
هیچ داده سازمانی را از حافظه عمومی خودت نساز.
بین «شاهد مستقیم»، «استنباط»، «پیشنهاد» و «مجهول» تمایز بگذار.
اگر شواهد کافی نیست صریح بگو «شواهد کافی در بانک اسناد پیدا نشد».
پاسخ را فارسی، مدیریتی و موجز بنویس.
در متن پاسخ برای ارجاع از عنوان سند/شماره سند استفاده کن؛ سامانه فهرست شواهد را جداگانه نمایش می‌دهد.`;

  let input=[{role:'user',content:[{type:'input_text',text:String(question).slice(0,12000)}]}];
  const toolResults=[];
  let totalUsage={input:0,output:0,total:0},last=null;

  for(let round=0;round<4;round++){
    last=await k9911OpenAI({
      model,instructions,input,tools:k9911Tools,tool_choice:'auto',
      store:false,max_output_tokens:maxOut
    });
    const u=last.usage||{};
    totalUsage.input+=Number(u.input_tokens||0);
    totalUsage.output+=Number(u.output_tokens||0);
    totalUsage.total+=Number(u.total_tokens||0);

    const calls=(last.output||[]).filter(x=>x.type==='function_call');
    if(!calls.length)break;

    input=[...input,...(last.output||[])];
    for(const call of calls){
      let args={};try{args=JSON.parse(call.arguments||'{}')}catch{}
      let result;
      if(call.name==='search_documents')result=k9911Search(db,org,args.query||question,args.mode||'qa',args.limit||8);
      else if(call.name==='get_document')result=k9911GetDocument(db,org,args.document_id);
      else if(call.name==='get_document_relations')result=k9911GetRelations(db,org,args.document_id);
      else result={error:'UNKNOWN_TOOL'};
      toolResults.push({name:call.name,args,result});
      input.push({type:'function_call_output',call_id:call.call_id,output:JSON.stringify(result)});
    }
  }

  let text=k9910AiOutputText(last||{});
  if(!text){
    const evidence=k9911EvidenceFromTool(toolResults);
    text=evidence.length?'شواهد مرتبط بازیابی شد، اما مدل پاسخ نهایی تولید نکرد.':'شواهد کافی در بانک اسناد پیدا نشد.';
  }
  return{
    ok:true,provider:'openai-responses',model,text,
    evidence:k9911EvidenceFromTool(toolResults),
    toolTrace:toolResults.map(x=>({tool:x.name,args:x.args,resultCount:x.name==='search_documents'?(x.result?.results?.length||0):x.name==='get_document_relations'?(x.result?.relations?.length||0):(x.result?.found?1:0)})),
    usage:totalUsage
  };
}

export default async function handler(req,res){
 if(!requireAuthenticated(req,res))return;
 try{
  const u=new URL(req.url,'https://local');
  if(u.pathname==='/api/v1/ai/status'&&req.method==='GET'){
    const enabled=String(process.env.SINA_AI_ENABLED||'false').toLowerCase()==='true';
    return send(res,200,{enabled,provider:enabled?String(process.env.SINA_AI_PROVIDER||'openai'):'disabled',model:enabled?String(process.env.SINA_AI_MODEL||'gpt-5.6-terra'):null,keyConfigured:Boolean(process.env.OPENAI_API_KEY)});
  }
  if(u.pathname==='/api/v1/ai/test'&&req.method==='POST'){
    if(String(process.env.SINA_AI_ENABLED||'false').toLowerCase()!=='true')return send(res,503,{code:'SINA_AI_DISABLED',message:'هوش مصنوعی سینا غیرفعال است.'});
    if(String(process.env.SINA_AI_PROVIDER||'openai').toLowerCase()!=='openai')return send(res,503,{code:'SINA_AI_PROVIDER_UNSUPPORTED',message:'ارائه‌دهنده هوش مصنوعی پشتیبانی نمی‌شود.'});
    const prompt=String(req.body?.prompt||'').trim();
    if(!prompt)return send(res,400,{code:'PROMPT_REQUIRED',message:'متن آزمایش الزامی است.'});
    return send(res,200,await k9910RunSinaAI(prompt));
  }
  if(u.pathname==='/api/v1/ai/command'&&req.method==='POST'){
    if(String(process.env.SINA_AI_ENABLED||'false').toLowerCase()!=='true')return send(res,503,{code:'SINA_AI_DISABLED',message:'هوش مصنوعی سینا غیرفعال است.'});
    if(String(process.env.SINA_AI_PROVIDER||'openai').toLowerCase()!=='openai')return send(res,503,{code:'SINA_AI_PROVIDER_UNSUPPORTED',message:'ارائه‌دهنده هوش مصنوعی پشتیبانی نمی‌شود.'});
    const question=String(req.body?.question||req.body?.prompt||'').trim();
    if(!question)return send(res,400,{code:'QUESTION_REQUIRED',message:'پرسش الزامی است.'});
    const repo=createRepository(),org=String(req.headers['x-org-id']||'ORG:SYN-001'),db=await repo.all();
    return send(res,200,await k9911RunEvidenceCommand(db,org,question));
  }
  if(req.method!=='GET')return send(res,405,{message:'Method not allowed'});
  const repo=createRepository(),org=String(req.headers['x-org-id']||'ORG:SYN-001');
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