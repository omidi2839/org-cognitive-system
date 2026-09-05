import { createRepository, repositoryMode } from '../src/infrastructure/repositoryFactory.js';
import { MockAIGateway } from '../src/ai/mockGateway.js';
import { KnowledgeCognitiveService } from '../src/application/knowledgeService0764.js';
import {createArtifactStorage, storageMode} from '../src/infrastructure/storage/storageFactory.js';
const repository=createRepository();
const service=new KnowledgeCognitiveService(repository,new MockAIGateway(),createArtifactStorage());
const getHeaders=req=>Object.fromEntries(Object.entries(req.headers||{}).map(([k,v])=>[k,String(v)]));
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
export default async function handler(req,res){
  try{
    const actor=service.actor(getHeaders(req));
    const requestUrl=new URL(req.url,'https://local');
    const path=requestUrl.pathname;
    if(path==='/api/v1/health'&&req.method==='GET') return send(res,200,{status:'ok',version:'0.7.6.4',environment:process.env.VERCEL_ENV||'local',persistence:repositoryMode(),storage:storageMode()});
    if(path==='/api/v1/health/ready'&&req.method==='GET'){ const dbOk=typeof repository.health==='function'?await repository.health():true; const st=service.storage; const storageOk=typeof st.health==='function'?await st.health():true; const durableRequired=String(process.env.REQUIRE_DURABLE_SERVICES||'').toLowerCase()==='true'; const durableOk=!durableRequired||(repositoryMode()==='postgres'&&storageMode()==='vercel-blob'); const ok=dbOk&&storageOk&&durableOk; return send(res,ok?200:503,{status:ok?'ready':'not_ready',persistence:repositoryMode(),storage:storageMode(),durableRequired,checks:{database:dbOk,storage:storageOk,durable:durableOk}}); }
    if(path==='/api/v1/me'&&req.method==='GET') return send(res,200,{person:{id:actor.personId,displayName:'حسین امیدی'},organization:{id:actor.organizationId,name:'سازمان نمونه شناختی'},roles:actor.roles,persona:'مدیر راهبردی',assignment:'مدیریت استراتژی و تحول',locale:'fa-IR',direction:'rtl'});
    if(path==='/api/v1/dashboard'&&req.method==='GET') return send(res,200,await service.dashboard(actor));
    if(path==='/api/v1/workspace/morning'&&req.method==='GET') return send(res,200,await service.personalMorningWorkspace(actor));
    if(path==='/api/v1/demo/morning'&&req.method==='POST') return send(res,201,await service.seedSyntheticMorning(actor));
    if(path==='/api/v1/command'&&req.method==='POST') return send(res,200,await service.executeCommand(actor,req.body||{}));
    if(path==='/api/v1/workspace/decision-readiness'&&req.method==='POST') return send(res,200,await service.buildDecisionReadiness(actor,req.body||{}));
    if(path==='/api/v1/workspace/decision-brief'&&req.method==='POST') return send(res,200,await service.buildDecisionBrief(actor,req.body||{}));
    if(path==='/api/v1/workspace/pre-meeting'&&req.method==='POST') return send(res,200,await service.buildPreMeetingIntelligence(actor,req.body||{}));
    if(path==='/api/v1/workspace/live-meeting'&&req.method==='POST') return send(res,200,await service.buildLiveMeetingIntelligence(actor,req.body||{}));
    if(path==='/api/v1/workspace/confirm-decision'&&req.method==='POST') return send(res,200,await service.confirmDecisionCandidate(actor,req.body||{}));
    if(path==='/api/v1/workspace/decision-to-action'&&req.method==='POST') return send(res,200,await service.translateDecisionToAction(actor,req.body||{}));
    if(path==='/api/v1/workspace/authorize-execution'&&req.method==='POST') return send(res,200,await service.authorizeExecutionPlan(actor,req.body||{}));
    if(path==='/api/v1/workspace/execution-monitoring'&&req.method==='POST') return send(res,200,await service.monitorExecution(actor,req.body||{}));
    if(path==='/api/v1/workspace/failure-diagnosis'&&req.method==='POST') return send(res,200,await service.diagnoseNonAchievement(actor,req.body||{}));
    if(path==='/api/v1/workspace/outcome-learning'&&req.method==='POST') return send(res,200,await service.buildOutcomeCausalLearning(actor,req.body||{}));
    if(path==='/api/v1/workspace/anchor-realization'&&req.method==='POST') return send(res,200,await service.updateAnchorRealization(actor,req.body||{}));
    if(path==='/api/v1/workspace/validate-learning'&&req.method==='POST') return send(res,200,await service.validateLearningMemory(actor,req.body||{}));
    if(path==='/api/v1/workspace/retrieve-memory'&&req.method==='POST') return send(res,200,await service.retrieveCognitiveMemory(actor,req.body||{}));
    if(path==='/api/v1/workspace/cognitive-reassessment'&&req.method==='POST') return send(res,200,await service.reassessCognition(actor,req.body||{}));
    if(path==='/api/v1/workspace/evaluate-warning'&&req.method==='POST') return send(res,200,await service.evaluateCognitiveWarning(actor,req.body||{}));
    if(path==='/api/v1/workspace/cognitive-attention'&&req.method==='POST') return send(res,200,await service.buildCognitiveAttention(actor,req.body||{}));
    if(path==='/api/v1/workspace/management-agenda'&&req.method==='POST') return send(res,200,await service.buildManagementAgenda(actor,req.body||{}));
    if(path==='/api/v1/workspace/agenda-readiness'&&req.method==='POST') return send(res,200,await service.assessAgendaReadiness(actor,req.body||{}));
    if(path==='/api/v1/workspace/meeting-orchestration'&&req.method==='POST') return send(res,200,await service.orchestrateMeeting(actor,req.body||{}));
    if(path==='/api/v1/sandbox/demo-state'&&req.method==='GET') return send(res,200,await service.getSandboxDemoState(actor));
    if(path==='/api/v1/documents'&&req.method==='POST') return send(res,201,await service.createDocument(actor,req.body||{}));
    if(path==='/api/v1/documents/upload'&&req.method==='POST') return send(res,201,await service.uploadDocument(actor,req.body||{}));
    if(path==='/api/v1/documents/batch-upload'&&req.method==='POST') return send(res,201,await service.uploadBatch(actor,req.body||{}));
    if(path==='/api/v1/knowledge/inventory'&&req.method==='GET') return send(res,200,await service.knowledgeInventory(actor));
    if(path==='/api/v1/knowledge/documents'&&req.method==='GET') return send(res,200,await service.knowledgeDocuments(actor,requestUrl.searchParams.get('class')||null));
    if(path.startsWith('/api/v1/sources/')&&req.method==='GET'){ const ref=decodeURIComponent(path.slice('/api/v1/sources/'.length)); return send(res,200,await service.resolveSourceReference(actor,ref)); }
    const pm=path.match(/^\/api\/v1\/documents\/(DOC:[^/]+)\/process$/); if(pm&&req.method==='POST') return send(res,200,await service.processDocument(actor,decodeURIComponent(pm[1])));
    const tm=path.match(/^\/api\/v1\/documents\/(DOC:[^/]+)\/trace$/); if(tm&&req.method==='GET') return send(res,200,await service.trace(actor,decodeURIComponent(tm[1])));
    const cm=path.match(/^\/api\/v1\/candidates\/(CAND:[^/]+)\/review$/); if(cm&&req.method==='POST') return send(res,200,await service.reviewCandidate(actor,decodeURIComponent(cm[1]),req.body||{}));
    return send(res,404,{code:'NOT_FOUND',message:'مسیر پیدا نشد.'});
  }catch(e){ console.error(e); return send(res,e.code?.includes('NOT_FOUND')?404:e.code?.includes('DENIED')?403:400,{code:e.code||'INTERNAL_ERROR',message:e.message||'خطای داخلی'}); }
}