import { KnowledgeCognitiveService } from './knowledgeService0764.js';
import { newId, now } from '../domain/contracts.js';

const uniq=a=>[...new Set(a.filter(Boolean))];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function semanticUnits(text){
  return String(text||'').split(/\n|(?<=[.!؟!؛])/).map(norm).filter(x=>x.length>8).slice(0,120);
}
const stop=new Set('این آن که را به از در با برای و یا یک بر تا نیز شده شود است هستند بود باشد خود مورد جهت صورت طریق عنوان سازمان سند کل کلی اصلی'.split(' '));
function tokens(text){return String(text||'').replace(/[^\u0600-\u06FFA-Za-z0-9‌\s]/g,' ').split(/\s+/).map(norm).filter(x=>x.length>2&&!stop.has(x)&&!/^\d+$/.test(x))}
function discoverConcepts(text){
  const ts=tokens(text), freq=new Map(), phrases=new Map();
  ts.forEach(t=>freq.set(t,(freq.get(t)||0)+1));
  const raw=String(text||'').split(/\n|[.!؟!؛]/).map(norm).filter(Boolean);
  for(const u of raw){
    const us=tokens(u);
    for(let n=2;n<=4;n++)for(let i=0;i+n<=us.length;i++){
      const p=us.slice(i,i+n).join(' ');
      if(p.length>=7&&p.length<=55)phrases.set(p,(phrases.get(p)||0)+1);
    }
  }
  const signal=/^(ارتقا|ارتقای|توسعه|تقویت|بهبود|افزایش|کاهش|تحقق|صیانت|توانمندسازی|گسترش)/;
  const ranked=[...phrases].map(([label,count])=>({label,count,score:count*3+(signal.test(label)?3:0)+Math.min(label.length/20,2)}))
    .filter(x=>x.count>1||signal.test(x.label)).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.label);
  const words=[...freq].sort((a,b)=>b[1]-a[1]).filter(([w,c])=>c>1).slice(0,10).map(([w])=>w);
  return uniq([...ranked,...words]).slice(0,18);
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
  if(rs.length<4){
    const us=semanticUnits(text);
    for(const u of us){
      const present=concepts.filter(c=>u.includes(c)||c.split(' ').some(w=>w.length>3&&u.includes(w))).slice(0,3);
      for(let i=0;i<present.length-1;i++) add(present[i],present[i+1],'هم‌وقوعی معنایی / رابطه نیازمند احراز',u,.48);
      if(rs.length>=10)break;
    }
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
function questions(text,concepts,relations,units){
  const qs=[]; const push=(q,reason,target,evidence)=>qs.push({id:newId('CQ'),question:q,reason,target,evidence,status:'open'});
  const candidates=concepts.slice(0,5);
  for(const c of candidates){
    const ev=units.find(u=>u.includes(c.split(' ')[0]))||'';
    if(/ارتقا|توسعه|تقویت|بهبود|تحقق|افزایش|کاهش/.test(c))
      push(`در عبارت «${c}»، وضعیت مطلوب دقیقاً چه تغییری است و از کجا می‌فهمیم محقق شده است؟`,'عبارت جهت تغییر دارد اما معیار تحقق آن باید از معنای سازمانی روشن شود.',c,ev);
    else
      push(`مفهوم «${c}» در منطق این سند دقیقاً به چه معناست و چه چیزهایی را شامل یا مستثنا می‌کند؟`,'این مفهوم از خود متن پرتکرار/برجسته استخراج شده و برای شبکه مفهومی نیازمند مرزبندی است.',c,ev);
  }
  for(const r of relations.slice(0,2)) push(`رابطه «${r.source} ← ${r.type} ← ${r.target}» را چگونه باید تفسیر کنیم؛ علّی، سیاستی، شرط تحقق یا صرفاً همراهی؟`,'نوع رابطه برای تبدیل متن به دانش سازمانی باید احراز شود.',r.id,r.evidence);
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
    const units=semanticUnits(text), concepts=discoverConcepts(text), rels=relations(text,concepts), cls=claims(units), qs=questions(text,concepts,rels,units);
    const version=(existing[0]?.version||0)+1;
    const analysis={
      id:newId('DAN'),organizationId:actor.organizationId,documentRef:documentId,version,
      status:qs.length?'awaiting_human_clarification':'awaiting_human_review',
      extractionQuality:quality,
      semanticUnits:units.slice(0,24).map((x,i)=>({id:`SU:${i+1}`,text:x})),
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
