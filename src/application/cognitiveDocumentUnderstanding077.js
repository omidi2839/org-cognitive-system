import { KnowledgeCognitiveService } from './knowledgeService0764.js';
import { newId, now } from '../domain/contracts.js';
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
function extractionQuality(text){const t=norm(text),words=t.split(/\s+/).filter(Boolean),fa=(t.match(/[\u0600-\u06FF]/g)||[]).length;let score=0;if(t.length>=50)score+=.35;if(words.length>=8)score+=.30;if(fa/Math.max(t.length,1)>.30)score+=.35;return{score:Math.min(1,score),status:score>=.6?'passed':'warning',message:score>=.6?'کیفیت متن برای تحلیل شناختی مناسب است.':'متن با احتیاط تحلیل می‌شود.'}}
function materialize(ai){
 const concepts=[],relations=[],questions=[],claims=[];
 let ci=0,ri=0,qi=0,cli=0;
 for(const c of ai.claims||[]){
  const evidenceGroupId=`SU:${++cli}`;
  const cc=(c.concepts||[]).map(x=>({id:`CON:${++ci}`,label:x.label,type:x.role,organizationalMeaning:x.meaningCandidate,confidence:x.confidence,status:'candidate',evidence:[c.text]}));
  const rr=(c.relations||[]).map(x=>({id:`REL:${++ri}`,source:x.source,target:x.target,type:x.type,interpretation:x.interpretation,confidence:x.confidence,status:'candidate',evidence:c.text}));
  concepts.push(...cc);relations.push(...rr);
  claims.push({id:`CLM:${cli}`,text:c.text,type:c.claimType,semanticFrame:{concepts:cc,relations:rr},status:'candidate'});
  for(const q of c.questions||[])questions.push({id:`CQ:${++qi}`,evidenceGroupId,question:q.question,reason:q.reason,target:(q.targets||[]).join('، '),evidence:c.text,claimType:c.claimType,status:'open',semanticContext:{highlightConcepts:q.targets||[],interpretation:q.reason,proposedRelations:rr.filter(r=>(q.targets||[]).includes(r.source)||(q.targets||[]).includes(r.target)).map(r=>r.interpretation),expectedClarificationType:q.kind,priority:q.priority}});
 }
 return {concepts,relations,questions,claims};
}
export class CognitiveDocumentUnderstandingService extends KnowledgeCognitiveService{
 async knowledgeDocuments(actor,documentClass=null){
  const db=await this.repo.all();
  const documents=Array.isArray(db?.documents)?db.documents:[];
  const candidatesAll=Array.isArray(db?.candidates)?db.candidates:[];
  const artifactsAll=Array.isArray(db?.artifacts)?db.artifacts:[];
  const analysesAll=Array.isArray(db?.documentAnalyses)?db.documentAnalyses:[];
  const orgDocs=documents.filter(x=>x?.organizationId===actor.organizationId);
  const docs=documentClass?orgDocs.filter(x=>x?.documentClass===documentClass):orgDocs;
  const docIds=new Set(docs.map(x=>x.id));
  const candidates=candidatesAll.filter(x=>x?.organizationId===actor.organizationId&&docIds.has(x.documentRef));
  const artifacts=artifactsAll.filter(x=>x?.organizationId===actor.organizationId&&docIds.has(x.documentRef));
  const checksumGroups={};
  for(const a of artifacts){
    const key=a?.checksum||`artifact:${a?.id||Math.random()}`;
    (checksumGroups[key]??=[]).push(a);
  }
  const items=docs.slice().sort((a,b)=>String(b?.createdAt||'').localeCompare(String(a?.createdAt||''))).map(d=>{
    const dc=candidates.filter(c=>c.documentRef===d.id);
    const analysis=analysesAll.filter(a=>a?.organizationId===actor.organizationId&&a?.documentId===d.id).sort((a,b)=>(b?.version||0)-(a?.version||0))[0]||null;
    return {
      id:d.id,title:d.title||'بدون عنوان',documentClass:d.documentClass||'unclassified',
      documentType:d.documentType||null,status:d.status||'registered',version:d.version||1,
      issuer:d.issuer||null,validityStatus:d.validityStatus||'unknown',
      classification:d.classification||'internal',organizationalLevel:d.organizationalLevel||null,
      organizationalUnitRef:d.organizationalUnitRef||null,organizationalUnitName:d.organizationalUnitName||null,
      subjectArea:d.subjectArea||null,sourceFileName:d.sourceFileName||null,createdAt:d.createdAt||null,
      candidates:{total:dc.length,pending:dc.filter(x=>x?.status==='ready_for_review').length,accepted:dc.filter(x=>['accepted','corrected'].includes(x?.status)).length},
      analysis:analysis?{id:analysis.id,version:analysis.version,status:analysis.status,openQuestions:(Array.isArray(analysis.questions)?analysis.questions:[]).filter(q=>q?.status==='open').length}:null
    };
  });
  return {filter:{documentClass:documentClass||'all'},summary:{documents:items.length,reviewPending:candidates.filter(x=>x?.status==='ready_for_review').length,duplicateGroups:Object.values(checksumGroups).filter(g=>g.length>1).length},items};
 }
 async analyzeDocument(actor,documentId,{forceNewVersion=false}={}){
  const db=await this.repo.all(),doc=(db.documents||[]).find(x=>x.id===documentId&&x.organizationId===actor.organizationId);if(!doc)throw new Error('DOCUMENT_NOT_FOUND');
  const versions=(db.documentAnalyses||[]).filter(x=>x.organizationId===actor.organizationId&&x.documentId===documentId).sort((a,b)=>b.version-a.version);
  if(versions[0]&&!forceNewVersion)return{analysis:versions[0],versions};
  const nd=(db.normalizedDocuments||[]).filter(x=>x.organizationId===actor.organizationId&&(x.documentRef===documentId||x.documentId===documentId)).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];
  const text=norm(nd?.text||doc.content||'');if(!text)throw new Error('DOCUMENT_TEXT_NOT_AVAILABLE');
  const {semanticProvider}=await import('../ai/semanticProvider.js');
  const provider=semanticProvider(),ai=await provider.analyze({text,document:doc}),m=materialize(ai),version=(versions[0]?.version||0)+1;
  const analysis={id:newId('DA'),organizationId:actor.organizationId,documentId,version,status:'needs_review',createdAt:now(),updatedAt:now(),engine:'contextual-semantic-understanding-v1',provider:ai.provider,model:ai.model||null,extractionQuality:extractionQuality(text),documentZones:ai.documentZones||[],semanticUnits:(ai.documentZones||[]).map((z,i)=>({id:`SU:${i+1}`,text:z.text,zone:z.zone,eligibleForConceptualization:z.zone==='body'})),concepts:m.concepts,relations:m.relations,claims:m.claims,questions:m.questions,understanding:{summary:`${m.claims.length} گزاره محتوایی پس از تفکیک ساختار سند تحلیل شد؛ ${m.questions.length} پرسش شناختی اختصاصی ایجاد شد.`,confidence:m.claims.length?.72:.45}};
  await this.repo.mutate(d=>{d.documentAnalyses=d.documentAnalyses||[];d.documentAnalyses.push(analysis);return d});return{analysis,versions:[analysis,...versions]};
 }
 async getDocumentAnalysis(actor,documentId){const db=await this.repo.all(),versions=(db.documentAnalyses||[]).filter(x=>x.organizationId===actor.organizationId&&x.documentId===documentId).sort((a,b)=>b.version-a.version);if(!versions[0])throw new Error('ANALYSIS_NOT_FOUND');return{analysis:versions[0],versions}}
 async answerQuestion(actor,documentId,{questionId,answer}){let result;await this.repo.mutate(d=>{const a=(d.documentAnalyses||[]).filter(x=>x.organizationId===actor.organizationId&&x.documentId===documentId).sort((x,y)=>y.version-x.version)[0];if(!a)throw new Error('ANALYSIS_NOT_FOUND');const q=(a.questions||[]).find(x=>x.id===questionId);if(!q)throw new Error('QUESTION_NOT_FOUND');q.status='answered';q.answer=norm(answer);q.answeredAt=now();for(const c of a.concepts||[])if((q.semanticContext?.highlightConcepts||[]).includes(c.label)){c.organizationalMeaning=q.answer;c.status='human_clarified';c.confidence=Math.max(c.confidence||0,.9)}a.updatedAt=now();result=a;return d});return{analysis:result,versions:[]}}
 async analyzeDocumentCognitively(actor,documentId,body={}){return this.analyzeDocument(actor,documentId,body)}
 async answerCognitiveQuestion(actor,documentId,body={}){return this.answerQuestion(actor,documentId,body)}
 async approveDocumentAnalysis(actor,documentId){return this.approveAnalysis(actor,documentId)}
 async approveAnalysis(actor,documentId){let result;await this.repo.mutate(d=>{const a=(d.documentAnalyses||[]).filter(x=>x.organizationId===actor.organizationId&&x.documentId===documentId).sort((x,y)=>y.version-x.version)[0];if(!a)throw new Error('ANALYSIS_NOT_FOUND');if((a.questions||[]).some(q=>q.status==='open'))throw new Error('OPEN_COGNITIVE_QUESTIONS');a.status='approved';a.approvedAt=now();a.updatedAt=now();result=a;return d});return{analysis:result,versions:[]}}
}
