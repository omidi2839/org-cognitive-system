import { KnowledgeCognitiveService } from './knowledgeService0764.js';
import { newId, now } from '../domain/contracts.js';

const uniq=a=>[...new Set(a.filter(Boolean))];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function semanticUnits(text){
  return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(norm).filter(x=>x.length>8);
}
const stop=new Set('این آن که را به از در با برای و یا یک بر تا نیز شده شود است هستند بود باشد خود مورد جهت صورت طریق عنوان سازمان سند کل کلی اصلی های'.split(' '));
const compoundEntities=['حوزه های علمیه خواهران','حوزه‌های علمیه خواهران','حوزه ‌ های علمیه خواهران','سنت نبوی','مکتب اهل بیت','مکتب اهل‌بیت','قرآن کریم','قرآن','نظام اسلامی','جوامع'];
const semanticTerms=['بانوان وارسته','بانوان فرهیخته','وارسته','فرهیخته','نیازهای دینی','ن یازهای دینی','جوامع','نظام اسلامی','حوزه های علمیه خواهران','حوزه‌های علمیه خواهران'];
const actions=['تبیین','ترویج','تبلیغ','تعلیم','تربیت','پژوهش','آموزش','هدایت','تقویت','توسعه','ارتقا','ارتقای','صیانت','تحقق','گسترش','توانمندسازی'];
const relMarkers=[['مبتنی بر','epistemic_basis'],['با تأکید بر','emphasis'],['به منظور','purpose'],['از طریق','means'],['در راستای','alignment'],['موجب','causal_claim'],['باعث','causal_claim']];
function sentenceUnits(text){return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(norm).filter(x=>x.length>3)}
function claimType(u){if(/رسالت|ماموریت|مأموریت/.test(u))return'mission_claim';if(/چشم.?انداز/.test(u))return'vision_claim';if(/هدف|اهداف/.test(u))return'goal_claim';if(/سیاست|باید|نباید|الزام/.test(u))return'policy_claim';if(/راهبرد|استراتژ/.test(u))return'strategy_claim';if(/تعریف|عبارت است از|منظور از/.test(u))return'definitional_claim';return /توسعه|تقویت|ارتقا|بهبود|تحقق|تبیین|ترویج|تبلیغ/.test(u)?'directional_claim':'descriptive_claim'}
function frames(text){return sentenceUnits(text).map((u,i)=>({id:`SU:${i+1}`,text:u,claimType:claimType(u),entities:compoundEntities.filter(x=>u.includes(x)).filter((x,i,a)=>!a.some((y,j)=>j<i&&y.includes(x))).map(label=>({label,type:/حوزه/.test(label)?'organizational_entity':'reference_source'})),actions:actions.filter(x=>u.includes(x)).map(label=>({label,type:'action_or_function'})),concepts:semanticTerms.filter(x=>u.includes(x.replace('ن یاز','نیاز'))).map(label=>({label:label.replace('ن یاز','نیاز'),type:/وارسته|فرهیخته/.test(label)?'quality_attribute':/نیاز/.test(label)?'need_concept':/جوامع|نظام/.test(label)?'stakeholder_or_scope':'concept'})),relations:relMarkers.filter(([m])=>u.includes(m)).map(([marker,type])=>({marker,type}))}))}
function discoverConcepts(text){
 const fs=frames(text),map=new Map(),add=(label,type,evidence,role,score)=>{label=norm(label);if(!label||stop.has(label))return;const k=type+':'+label,x=map.get(k)||{label,type,evidence:[],roles:[],score:0};if(!x.evidence.includes(evidence))x.evidence.push(evidence);if(!x.roles.includes(role))x.roles.push(role);x.score+=score;map.set(k,x)};
 for(const f of fs){const w=['mission_claim','vision_claim','goal_claim','policy_claim','strategy_claim'].includes(f.claimType)?4:2;f.entities.forEach(x=>add(x.label,x.type,f.text,'entity',w+2));(f.concepts||[]).forEach(x=>add(x.label,x.type,f.text,'concept',w+2));f.actions.forEach(x=>add(x.label,x.type,f.text,f.claimType,w+2));f.relations.forEach(x=>add(x.marker,'relation_marker',f.text,x.type,w));}
 return [...map.values()].sort((x,y)=>y.score-x.score||y.label.length-x.label.length);
}
function extractionQuality(text,doc){
  const t=norm(text),chars=t.length,fa=(t.match(/[\u0600-\u06FF]/g)||[]).length,replacement=(t.match(/�/g)||[]).length;
  const words=t.split(/\s+/).filter(Boolean),avg=words.length?words.reduce((a,w)=>a+w.length,0)/words.length:0;
  const persianRatio=fa/Math.max(chars,1),lexical=words.filter(w=>w.length>=3).length/Math.max(words.length,1);
  let score=0;if(chars>=50)score+=.25;else if(chars>=20)score+=.16;if(words.length>=8)score+=.25;else if(words.length>=4)score+=.14;
  if(persianRatio>.30)score+=.25;if(avg>=2.5&&avg<=16)score+=.15;if(lexical>.65)score+=.10;
  score=Math.max(0,Math.min(1,score-(replacement>2?.35:0)));
  return {score,status:score>=.60?'passed':score>=.38?'warning':'blocked',characters:chars,words:words.length,persianRatio:Number(persianRatio.toFixed(2)),lexicalDensity:Number(lexical.toFixed(2)),message:score>=.60?'کیفیت متن برای تحلیل شناختی مناسب است.':score>=.38?'متن کوتاه است اما برای تحلیل با احتیاط قابل استفاده است.':'کیفیت استخراج متن برای تحلیل شناختی کافی نیست.'};
}
function relations(text,concepts){
 const rs=[];let n=0,add=(source,target,type,evidence,c=.7)=>rs.push({id:`REL:${++n}`,source,target,type,evidence,confidence:c,status:'candidate'});
 for(const f of frames(text)){const aa=f.actions.map(x=>x.label);if(aa.length>1)for(let i=0;i<aa.length-1;i++)add(aa[i],aa[i+1],'co_function_in_same_claim',f.text,.62);for(const r of f.relations){if(r.type==='epistemic_basis'){const refs=['قرآن','سنت نبوی','مکتب اهل بیت','مکتب اهل‌بیت'].filter(x=>f.text.includes(x));for(const x of aa)for(const y of refs)add(x,y,'epistemic_basis',f.text,.84)}else if(aa.length)add(aa.join('، '),r.marker,r.type,f.text,.7)}}
 return rs.slice(0,80);
}
function claims(units){return units.map((u,i)=>{const f=frames(u)[0]||{};return{id:`CLM:${i+1}`,text:u,type:claimType(u),semanticFrame:{entities:f.entities||[],actions:f.actions||[],relations:f.relations||[]},status:'candidate'}})}
function questions(text,concepts,relations,units){
 const qs=[],push=(question,reason,target,evidence,ct,ctx={})=>qs.push({id:newId('CQ'),evidenceGroupId:'EVID:'+Math.abs([...evidence].reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0)|0,0)),question,reason,target,evidence,claimType:ct,status:'open',semanticContext:ctx});
 for(const f of frames(text)){const aa=f.actions.map(x=>x.label),ee=f.entities.map(x=>x.label),cc=(f.concepts||[]).map(x=>x.label),all=[...new Set([...aa,...ee,...cc])];
 if(aa.length>1)push(`در این گزاره، «${aa.join('، ')}» چه تفاوت مفهومی و کارکردی دارند؛ مراحل یک فرایندند یا کارکردهای مستقل؟`,'مرز و نسبت چند کنش کلیدی باید روشن شود.',aa.join('، '),f.text,f.claimType,{highlightConcepts:all,interpretation:`سامانه ${aa.length} کارکرد مرتبط را در یک گزاره تشخیص داده، اما نوع رابطه آنها نیازمند احراز انسانی است.`,proposedRelations:['هم‌عرض','ترتیبی','مکمل یکدیگر','علّی/اثرگذار بر یکدیگر','جزء و کل','رابطه دیگری دارند'],expectedClarificationType:'relation_and_definition'});
 for(const x of aa.slice(0,4))push(`در همین گزاره، منظور سازمان از «${x}» دقیقاً چیست و تحقق آن چگونه قابل تشخیص است؟`,'تعریف سازمانی باید در بافت همان گزاره تکمیل شود.',x,f.text,f.claimType,{highlightConcepts:all,interpretation:`«${x}» به‌عنوان کنش/کارکرد کلیدی این گزاره تشخیص داده شده است.`,proposedRelations:[],expectedClarificationType:'organizational_definition'});
 for(const r of f.relations)if(r.type==='epistemic_basis')push('عبارت «مبتنی بر» در این گزاره چه نوع رابطه‌ای ایجاد می‌کند؟ نسبت قرآن، سنت نبوی و مکتب اهل‌بیت در این مبنا چیست؟','نوع رابطه معرفتی/تفسیری باید احراز شود.',r.marker,f.text,f.claimType,{highlightConcepts:['مبتنی بر',...ee.filter(x=>/قرآن|سنت|مکتب/.test(x))],interpretation:'سامانه یک رابطه مبنایی/معرفتی تشخیص داده است؛ ساختار دقیق آن هنوز قطعی نیست.',proposedRelations:['منابع هم‌عرض','اجزای یک منظومه معرفتی','ترتیب مرجعیت','رابطه تفسیری/تبیینی','رابطه دیگری دارند'],expectedClarificationType:'relation'});
 }return qs;
}

export class CognitiveDocumentUnderstandingService extends KnowledgeCognitiveService {
  async knowledgeDocuments(actor,documentClass=null){
    const base=await super.knowledgeDocuments(actor,documentClass);
    const db=await this.repo.all();
    base.items=base.items.map(d=>{
      const analyses=(db.documentAnalyses||[]).filter(a=>a.organizationId===actor.organizationId&&a.documentRef===d.id).sort((a,b)=>b.version-a.version);
      const latest=analyses[0]||null;
      return {...d,analysis:latest?{id:latest.id,version:latest.version,status:latest.status,openQuestions:latest.questions.filter(q=>q.status==='open').length,createdAt:latest.createdAt}:null};
    });
    return base;
  }

  async analyzeDocumentCognitively(actor,documentId,{forceNewVersion=false}={}){
    const db=await this.repo.all();
    const doc=(db.documents||[]).find(x=>x.id===documentId&&x.organizationId===actor.organizationId);
    if(!doc){const e=new Error('سند پیدا نشد');e.code='DOC_NOT_FOUND';throw e}
    const existing=(db.documentAnalyses||[]).filter(a=>a.organizationId===actor.organizationId&&a.documentRef===documentId).sort((a,b)=>b.version-a.version);
    if(existing[0]&&!forceNewVersion) return {analysis:existing[0],reused:true};

    const normDoc=(db.normalizedDocuments||[])
      .filter(x=>x.organizationId===actor.organizationId&&x.documentRef===documentId&&x.sourceVersion<=doc.version)
      .sort((a,b)=>b.sourceVersion-a.sourceVersion)[0];
    const text=normDoc?.text||doc.content||'';
    const quality=extractionQuality(text,doc);
    quality.source=normDoc?{normalizedRef:normDoc.id,structure:normDoc.structure,language:normDoc.language}:{normalizedRef:null,structure:null,language:'unknown'};
    if(quality.status==='blocked'){
      const e=new Error('کیفیت استخراج متن برای تحلیل شناختی کافی نیست. ابتدا متن سند باید با کیفیت مناسب استخراج شود.');
      e.code='EXTRACTION_QUALITY_BLOCKED'; e.details=quality; throw e;
    }
    const units=sentenceUnits(text), conceptObjects=discoverConcepts(text), concepts=conceptObjects.map(x=>x.label), rels=relations(text,conceptObjects), cls=claims(units), qs=questions(text,conceptObjects,rels,units);
    const version=(existing[0]?.version||0)+1;
    const analysis={
      id:newId('DAN'),organizationId:actor.organizationId,documentRef:documentId,version,
      status:qs.length?'awaiting_human_clarification':'awaiting_human_review',
      extractionQuality:quality,
      semanticUnits:units.map((x,i)=>({id:`SU:${i+1}`,text:x})),
      concepts:concepts.map((x,i)=>({id:`CON:${i+1}`,label:x,confidence:.62,status:'candidate'})),
      relations:rels,claims:cls,questions:qs,clarifications:[],
      understanding:{engine:'semantic-document-intelligence-v1',summary:`${concepts.length} مفهوم، ${rels.length} رابطه، ${cls.length} گزاره معنایی و ${qs.length} پرسش شناختی شناسایی شد.`,confidence:Math.min(.86,.48+concepts.length*.025+rels.length*.025)},
      provenance:{documentRef:documentId,documentVersion:doc.version,sourceFileName:doc.sourceFileName},
      createdAt:now(),createdBy:actor.personId||'system'
    };
    await this.repo.mutate(x=>{x.documentAnalyses??=[];x.documentAnalyses.push(analysis)});
    return {analysis,reused:false};
  }

  async getDocumentAnalysis(actor,documentId){
    const db=await this.repo.all();
    const analyses=(db.documentAnalyses||[]).filter(a=>a.organizationId===actor.organizationId&&a.documentRef===documentId).sort((a,b)=>b.version-a.version);
    if(!analyses.length){const e=new Error('برای این سند هنوز تحلیل شناختی وجود ندارد');e.code='ANALYSIS_NOT_FOUND';throw e}
    return {analysis:analyses[0],versions:analyses.map(a=>({id:a.id,version:a.version,status:a.status,createdAt:a.createdAt}))};
  }

  async answerCognitiveQuestion(actor,documentId,input){
    const db=await this.repo.all();
    const analyses=(db.documentAnalyses||[]).filter(a=>a.organizationId===actor.organizationId&&a.documentRef===documentId).sort((a,b)=>b.version-a.version);
    const a=analyses[0]; if(!a){const e=new Error('تحلیل شناختی پیدا نشد');e.code='ANALYSIS_NOT_FOUND';throw e}
    const q=a.questions.find(x=>x.id===input.questionId); if(!q){const e=new Error('پرسش شناختی پیدا نشد');e.code='QUESTION_NOT_FOUND';throw e}
    const answer=norm(input.answer); if(answer.length<2){const e=new Error('پاسخ معتبر نیست');e.code='INVALID_ANSWER';throw e}
    await this.repo.mutate(x=>{
      const aa=(x.documentAnalyses||[]).find(z=>z.id===a.id);
      const qq=aa.questions.find(z=>z.id===q.id); qq.status='answered';qq.answer=answer;qq.answeredAt=now();qq.answeredBy=actor.personId||'user';
      aa.clarifications.push({id:newId('CLAR'),questionRef:q.id,target:q.target,answer,createdAt:now()});
      if(typeof q.target==='string'&&q.target&&!q.target.startsWith('REL:')){
        const c=aa.concepts.find(z=>z.label===q.target); if(c){c.organizationalMeaning=answer;c.confidence=Math.max(c.confidence,.84);c.status='clarified'}
      }
      if(aa.questions.every(z=>z.status==='answered')) aa.status='awaiting_human_review';
    });
    return this.getDocumentAnalysis(actor,documentId);
  }

  async approveDocumentAnalysis(actor,documentId){
    const db=await this.repo.all();
    const analyses=(db.documentAnalyses||[]).filter(a=>a.organizationId===actor.organizationId&&a.documentRef===documentId).sort((a,b)=>b.version-a.version);
    const a=analyses[0]; if(!a){const e=new Error('تحلیل شناختی پیدا نشد');e.code='ANALYSIS_NOT_FOUND';throw e}
    if(a.questions.some(q=>q.status==='open')){const e=new Error('پیش از تأیید، پرسش‌های شناختی باز باید تعیین تکلیف شوند');e.code='OPEN_COGNITIVE_QUESTIONS';throw e}
    await this.repo.mutate(x=>{const aa=x.documentAnalyses.find(z=>z.id===a.id);aa.status='approved';aa.approvedAt=now();aa.approvedBy=actor.personId||'user'});
    return this.getDocumentAnalysis(actor,documentId);
  }
}
