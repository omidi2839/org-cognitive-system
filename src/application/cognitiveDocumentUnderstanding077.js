import { KnowledgeCognitiveService } from './knowledgeService0764.js';
import { newId, now } from '../domain/contracts.js';

const uniq=a=>[...new Set(a.filter(Boolean))];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function semanticUnits(text){
  return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(norm).filter(x=>x.length>8);
}
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
function sentenceUnits(text){return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(clean).filter(x=>x.length>3)}
function claimType(u){if(/رسالت|ماموریت|مأموریت/.test(u))return'mission_claim';if(/چشم.?انداز/.test(u))return'vision_claim';if(/هدف|اهداف/.test(u))return'goal_claim';if(/سیاست|باید|نباید|الزام/.test(u))return'policy_claim';if(/راهبرد|استراتژ/.test(u))return'strategy_claim';if(/تعریف|عبارت است از|منظور از/.test(u))return'definitional_claim';return /توسعه|تقویت|ارتقا|بهبود|تحقق|تبیین|ترویج|تبلیغ|تربیت|رفع/.test(u)?'directional_claim':'descriptive_claim'}
function phraseRole(label){
 const hit=roleHints.find(([x])=>label.includes(x));if(hit)return hit[1];
 if(/وارسته|فرهیخته|متخصص|توانمند|شایسته|مطلوب|اسلامی|دینی|علمی|فرهنگی|اجتماعی/.test(label))return'attribute_or_quality';
 if(actions.some(x=>label===x||label.startsWith(x+' ')))return'action_or_function';
 return label.split(/\s+/).length>1?'compound_concept':'concept_candidate';
}
function openCandidates(u){
 const toks=tokenise(u),out=[],seen=new Set(),add=(label,type,spanStart,spanEnd,score=.55)=>{
   label=clean(label);if(!label||label.length<2||stop.has(label)||seen.has(type+':'+label))return;
   if(label.split(/\s+/).every(x=>stop.has(x)))return;
   seen.add(type+':'+label);out.push({label,type,spanStart,spanEnd,score});
 };
 // actions are anchors, but concepts are not limited to this list.
 for(let i=0;i<toks.length;i++)if(actions.includes(toks[i]))add(toks[i],'action_or_function',i,i,.82);
 // open 1–4 token noun/adjective phrase candidates; punctuation and relation words define boundaries.
 const boundary=new Set(['برای','از','در','با','بر','تا','و','یا','که','به','مبتنی','منظور','طریق','راستای']);
 for(let i=0;i<toks.length;i++){
   if(stop.has(toks[i])||boundary.has(toks[i])||actions.includes(toks[i]))continue;
   for(let n=1;n<=4&&i+n<=toks.length;n++){
     const seg=toks.slice(i,i+n);if(seg.some(x=>boundary.has(x)||actions.includes(x)))break;
     const label=seg.join(' '),role=phraseRole(label);
     const meaningful=seg.filter(x=>!stop.has(x)).length;
     if(meaningful && (n>1 || role!=='concept_candidate'))add(label,role,i,i+n-1,.50+n*.08);
   }
 }
 // preserve coordinated adjective/quality structures: "بانوان وارسته و فرهیخته".
 for(const m of u.matchAll(/([\u0600-\u06FF]{3,})\s+([\u0600-\u06FF]{3,})\s+و\s+([\u0600-\u06FF]{3,})/g)){
   add(`${m[1]} ${m[2]}`,phraseRole(`${m[1]} ${m[2]}`),-1,-1,.78);add(m[3],phraseRole(m[3]),-1,-1,.68);
 }
 // prefer longest useful spans, but keep nested spans with distinct roles.
 return out.sort((a,b)=>b.score-a.score||b.label.length-a.label.length);
}
function frames(text){return sentenceUnits(text).map((u,i)=>{
 const candidates=openCandidates(u),acts=candidates.filter(x=>x.type==='action_or_function');
 const concepts=candidates.filter(x=>x.type!=='action_or_function');
 return {id:`SU:${i+1}`,text:u,claimType:claimType(u),entities:concepts.filter(x=>['organizational_entity','stakeholder_or_scope','target_group','epistemic_source'].includes(x.type)),actions:acts,concepts,relations:relMarkers.filter(([m])=>u.includes(m)).map(([marker,type])=>({marker,type}))};
})}
function discoverConcepts(text){
 const map=new Map(),add=(x,evidence,claim)=>{const k=x.type+':'+x.label,v=map.get(k)||{label:x.label,type:x.type,evidence:[],roles:[],score:0,source:'open_semantic_candidate'};if(!v.evidence.includes(evidence))v.evidence.push(evidence);if(!v.roles.includes(claim))v.roles.push(claim);v.score+=x.score||.55;map.set(k,v)};
 for(const f of frames(text)){[...f.actions,...f.concepts].forEach(x=>add(x,f.text,f.claimType));f.relations.forEach(x=>add({label:x.marker,type:'relation_marker',score:.5},f.text,x.type))}
 return [...map.values()].sort((a,b)=>b.score-a.score||b.label.length-a.label.length);
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
 const rs=[];let n=0,add=(source,target,type,evidence,c=.65)=>{if(source&&target&&source!==target)rs.push({id:`REL:${++n}`,source,target,type,evidence,confidence:c,status:'candidate'})};
 for(const f of frames(text)){
   const aa=f.actions.map(x=>x.label),cc=f.concepts.map(x=>x.label);
   if(aa.length)for(const a of aa)for(const c of cc.slice(0,12))add(a,c,'contextual_semantic_relation',f.text,.58);
   if(aa.length>1)for(let i=0;i<aa.length-1;i++)add(aa[i],aa[i+1],'co_function_in_same_claim',f.text,.64);
   for(const r of f.relations)if(aa.length)add(aa.join('، '),r.marker,r.type,f.text,.68);
 }
 return rs;
}
function claims(units){return units.map((u,i)=>{const f=frames(u)[0]||{};return{id:`CLM:${i+1}`,text:u,type:claimType(u),semanticFrame:{entities:f.entities||[],actions:f.actions||[],concepts:f.concepts||[],relations:f.relations||[]},status:'candidate'}})}
function questions(text,concepts,relations,units){
 const qs=[],push=(f,question,reason,target,ctx={})=>qs.push({id:newId('CQ'),evidenceGroupId:f.id,question,reason,target,evidence:f.text,claimType:f.claimType,status:'open',semanticContext:ctx});
 for(const f of frames(text)){
   const aa=f.actions.map(x=>x.label),cc=[...new Set(f.concepts.map(x=>x.label))],all=[...new Set([...aa,...cc])];
   if(all.length)push(f,'آیا مفاهیم کلیدی استخراج‌شده از این گزاره کامل و از نظر معنای سازمانی درست هستند؟','سامانه نامزدهای مفهومی را از خود ساختار عبارت استخراج کرده است؛ انسان باید مرز و اهمیت آنها را احراز کند.',all.join('، '),{highlightConcepts:all,conceptRoles:f.concepts.map(x=>({label:x.label,type:x.type})),interpretation:`${all.length} نامزد معنایی از این گزاره استخراج شده است.`,proposedRelations:[],expectedClarificationType:'concept_validation'});
   if(aa.length>1)push(f,`نسبت میان کنش‌های «${aa.join('، ')}» در این گزاره چیست؟`,'چند کنش در یک گزاره دیده شده است.',aa.join('، '),{highlightConcepts:all,interpretation:'نوع رابطه میان کنش‌ها هنوز قطعی نیست.',proposedRelations:['هم‌عرض','ترتیبی','مکمل یکدیگر','علّی/اثرگذار','جزء و کل','رابطه دیگری دارند'],expectedClarificationType:'relation'});
   if(cc.length>1)push(f,'کدام‌یک از این مفاهیم مستقل‌اند و کدام‌یک باید به‌صورت یک مفهوم مرکب در مدل سازمان ثبت شوند؟','مرز مفهوم مرکب با واژه‌های وابسته باید مشخص شود.',cc.join('، '),{highlightConcepts:all,interpretation:'استخراج باز ممکن است هم مفهوم مرکب و هم اجزای آن را نامزد کند.',proposedRelations:['مفهوم مستقل','مفهوم مرکب','ویژگی/صفت','ذی‌نفع/دامنه','نیاز','مرجع/منبع'],expectedClarificationType:'concept_boundary'});
 }
 return qs;
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
      concepts:conceptObjects.map((x,i)=>({id:`CON:${i+1}`,label:x.label,type:x.type,confidence:Math.min(.9,.5+(x.score||0)*.12),score:x.score,evidence:x.evidence,roles:x.roles,source:x.source,status:'candidate'})),
      relations:rels,claims:cls,questions:qs,clarifications:[],
      understanding:{engine:'open-semantic-concept-extraction-v1',summary:`${concepts.length} مفهوم، ${rels.length} رابطه، ${cls.length} گزاره معنایی و ${qs.length} پرسش شناختی شناسایی شد.`,confidence:Math.min(.86,.48+concepts.length*.025+rels.length*.025)},
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
