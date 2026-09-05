import { KnowledgeCognitiveService } from './knowledgeService0764.js';
import { newId, now } from '../domain/contracts.js';

const uniq=a=>[...new Set(a.filter(Boolean))];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function semanticUnits(text){
  return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(norm).filter(x=>x.length>8).slice(0,120);
}
function discoverConcepts(text){
  const rules=[
    ['کیفیت','کیفیت'],['آموزش','آموزش'],['استاد','استاد/عضو هیئت علمی'],['اساتید','استاد/عضو هیئت علمی'],
    ['توانمندی','توانمندی'],['علمی','بعد علمی'],['تربیتی','بعد تربیتی'],['پژوهش','پژوهش'],['فرهنگ','فرهنگ سازمانی'],
    ['منابع انسانی','منابع انسانی'],['فناوری','فناوری'],['بودجه','بودجه'],['راهبرد','راهبرد'],['سیاست','سیاست'],
    ['هدف','هدف'],['ماموریت','مأموریت'],['مأموریت','مأموریت'],['چشم‌انداز','چشم‌انداز'],['خدمت','خدمت'],
    ['رضایت','رضایت'],['اثربخشی','اثربخشی'],['کارایی','کارایی'],['عدالت','عدالت'],['نوآوری','نوآوری']
  ];
  const found=[]; for(const [n,l] of rules) if(text.includes(n)) found.push(l);
  const phrases=[...text.matchAll(/(?:ارتقا|ارتقای|توسعه|تقویت|بهبود|افزایش|کاهش|صیانت|تحقق)\s+([آ-یA-Za-z‌\s]{3,45})/g)]
    .map(m=>norm(m[0]).split(/[،؛.؟]/)[0]).filter(x=>x.length<70);
  return uniq([...found,...phrases]).slice(0,18);
}
function relations(text,concepts){
  const rs=[];
  const add=(s,t,type,evidence,confidence=.68)=>{if(s&&t&&s!==t)rs.push({id:newId('REL'),source:s,target:t,type,confidence,evidence})};
  if(text.includes('کیفیت')&&text.includes('آموزش')) add('کیفیت','آموزش','موضوع/ویژگی','کیفیت آموزش',.82);
  if((text.includes('توسعه')||text.includes('تقویت'))&&text.includes('توانمندی')) add('توسعه/تقویت','توانمندی','جهت تغییر','توسعه توانمندی',.78);
  if(text.includes('توانمندی')&&text.includes('علمی')) add('توانمندی','بعد علمی','دارای بعد','توانمندی علمی',.84);
  if(text.includes('توانمندی')&&text.includes('تربیتی')) add('توانمندی','بعد تربیتی','دارای بعد','توانمندی تربیتی',.84);
  if(text.includes('با تأکید بر')||text.includes('با تاکید بر')){
    const a=concepts[0],b=concepts.find(x=>x!==a); add(a,b,'تأکید/وابستگی احتمالی','با تأکید بر',.55);
  }
  for(const u of semanticUnits(text)){
    const m=u.match(/(.{3,45})\s+(?:موجب|سبب|باعث)\s+(.{3,45})/);
    if(m)add(norm(m[1]),norm(m[2]),'اثر علّی ادعاشده',u,.72);
  }
  return rs.slice(0,16);
}
function claims(units){
  const signals=/(باید|ضروری|موظف|مکلف|هدف|ارتقا|توسعه|افزایش|کاهش|ممنوع|الزام|سیاست|راهبرد)/;
  return units.filter(x=>signals.test(x)).slice(0,12).map(x=>({
    id:newId('SCLAIM'),interpretation:x,
    claimType:/باید|ضروری|موظف|مکلف|الزام/.test(x)?'الزام/هنجار':/هدف|ارتقا|توسعه|افزایش|کاهش/.test(x)?'جهت/وضعیت مطلوب':'گزاره راهبردی',
    confidence:.66,evidence:x
  }));
}
function questions(text,concepts,relations){
  const qs=[];
  const push=(q,reason,target)=>qs.push({id:newId('CQ'),question:q,reason,target,status:'open'});
  if(text.includes('کیفیت')) push('منظور سازمان از «کیفیت» در این سند دقیقاً چیست و چه ابعادی دارد؟','مفهوم کلیدی چندمعناست و بدون تعریف، کمّی‌سازی معتبر نیست.','کیفیت');
  if(text.includes('توانمندی')) push('«توانمندی» در این سند شامل چه قابلیت‌های مشخص و قابل مشاهده‌ای است؟','مرز مفهومی توانمندی برای ساخت مدل تحقق روشن نیست.','توانمندی');
  if((text.includes('با تأکید بر')||text.includes('با تاکید بر'))&&relations.length) push('عبارت «با تأکید بر» رابطه علّی را بیان می‌کند، اولویت سیاستی را، یا صرفاً روش اجرا را؟','نوع رابطه از متن به تنهایی قطعی نیست.',relations[0].id);
  if(/ارتقا|توسعه|بهبود/.test(text)) push('وضعیت مطلوب موردنظر سند چگونه قابل تشخیص یا سنجش است؟','جهت تغییر روشن است اما معیار تحقق ممکن است صریح نباشد.','desired_state');
  if(!qs.length) push(`کدام‌یک از مفاهیم «${concepts.slice(0,3).join('، ')||'اصلی سند'}» برای تفسیر این سند نیازمند تعریف سازمانی است؟`,'برای جلوگیری از تحمیل معنای عمومی به واژگان سازمانی.','document');
  return qs.slice(0,6);
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

    const text=doc.normalizedText||'';
    const units=semanticUnits(text), concepts=discoverConcepts(text), rels=relations(text,concepts), cls=claims(units), qs=questions(text,concepts,rels);
    const version=(existing[0]?.version||0)+1;
    const analysis={
      id:newId('DAN'),organizationId:actor.organizationId,documentRef:documentId,version,
      status:qs.length?'awaiting_human_clarification':'awaiting_human_review',
      semanticUnits:units.slice(0,24).map((x,i)=>({id:`SU:${i+1}`,text:x})),
      concepts:concepts.map((x,i)=>({id:`CON:${i+1}`,label:x,confidence:.62,status:'candidate'})),
      relations:rels,claims:cls,questions:qs,clarifications:[],
      understanding:{summary:`${concepts.length} مفهوم، ${rels.length} رابطه، ${cls.length} گزاره معنایی و ${qs.length} پرسش شناختی شناسایی شد.`,confidence:Math.min(.86,.48+concepts.length*.025+rels.length*.025)},
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
