import { assert, classifications, hash, newId, now, zones } from '../domain/contracts.js';
import {validateFile} from '../processing/mime.js';
import {parseArtifact} from '../processing/parser.js';
export class CognitiveService {
  constructor(repo, ai, storage){ this.repo=repo; this.ai=ai; this.storage=storage; }
  actor(headers){const org=headers['x-org-id']||'ORG:SYN-001',person=headers['x-person-id']||'PER:SARA';return {organizationId:org,personId:person,roles:['expert'],correlationId:headers['x-correlation-id']||newId('CORR')};}
  async dashboard(actor){const db=await this.repo.all();const docs=db.documents.filter(x=>x.organizationId===actor.organizationId),candidates=db.candidates.filter(x=>x.organizationId===actor.organizationId&&x.status==='ready_for_review');return {actor,stats:{documents:docs.length,review:candidates.length,accepted:db.candidates.filter(x=>x.organizationId===actor.organizationId&&['accepted','corrected'].includes(x.status)).length},recent:docs.slice(-5).reverse()};}
  async createDocument(actor,input){assert(input.title?.trim(),'DOC_TITLE_REQUIRED','عنوان سند الزامی است.');assert(input.content?.trim(),'DOC_CONTENT_REQUIRED','محتوای سند الزامی است.');const zone=input.knowledgeZone||'private',classification=input.classification||'internal';assert(zones.includes(zone),'DOC_ZONE_INVALID','ناحیه دانش نامعتبر است.');assert(classifications.includes(classification),'DOC_CLASS_INVALID','طبقه‌بندی نامعتبر است.');const document={id:newId('DOC'),organizationId:actor.organizationId,title:input.title.trim(),status:'registered',version:1,knowledgeZone:zone,classification,createdAt:now(),createdBy:actor.personId,contentHash:hash(input.content),content:input.content};await this.repo.mutate(db=>{db.documents.push(document);db.audit.push({id:newId('AUD'),organizationId:actor.organizationId,actorRef:actor.personId,action:'document.register',objectRef:document.id,objectVersion:1,occurredAt:now(),correlationId:actor.correlationId});db.provenance.push({id:newId('PROV'),organizationId:actor.organizationId,targetRef:document.id,type:'human_created',sourceRefs:[],actorRef:actor.personId,createdAt:now(),contentHash:document.contentHash});});return document;}
  async uploadDocument(actor,input){
    assert(input.fileName,'FILE_NAME_REQUIRED','نام فایل الزامی است.');assert(input.contentBase64,'FILE_CONTENT_REQUIRED','محتوای فایل الزامی است.');
    const buffer=Buffer.from(input.contentBase64,'base64');validateFile(input.fileName,input.mimeType||'',buffer.length);
    const classification=input.classification||'internal',zone=input.knowledgeZone||'private';assert(zones.includes(zone),'DOC_ZONE_INVALID','ناحیه دانش نامعتبر است.');assert(classifications.includes(classification),'DOC_CLASS_INVALID','طبقه‌بندی نامعتبر است.');
    const sha=hash(buffer),docId=newId('DOC'),artifactId=newId('ART'),objectKey=`${actor.organizationId}/${docId}/v1/${sha}-${input.fileName.replace(/[^\w.\-\u0600-\u06FF]+/g,'_')}`;
    const before=await this.repo.all();
    const priorArtifact=before.artifacts?.find(x=>x.organizationId===actor.organizationId&&x.checksum===sha&&x.status==='committed');
    const priorDoc=priorArtifact?before.documents.find(x=>x.id===priorArtifact.documentRef&&x.organizationId===actor.organizationId):null;
    const stored=priorArtifact?{...priorArtifact.storage,reused:true}:await this.storage.put({objectKey,buffer,mimeType:input.mimeType||'application/octet-stream'});
    const parsed=await parseArtifact({buffer,mimeType:input.mimeType||'',fileName:input.fileName});assert(parsed.text,'PARSED_CONTENT_EMPTY','محتوای متنی قابل پردازش استخراج نشد.');
    const artifact={id:artifactId,organizationId:actor.organizationId,documentRef:docId,fileName:input.fileName,mimeType:input.mimeType,size:buffer.length,checksum:sha,storage:stored,status:'committed',reusedFromArtifactRef:priorArtifact?.id||null,createdAt:now()};
    const normalized={id:newId('NORM'),organizationId:actor.organizationId,documentRef:docId,sourceVersion:1,text:parsed.text,units:parsed.units||[],structure:parsed.structure,language:parsed.language,contentHash:hash(parsed.text),createdAt:now()};
    const document={id:docId,organizationId:actor.organizationId,title:(input.title||input.fileName).trim(),status:'registered',version:1,knowledgeZone:zone,classification,createdAt:now(),createdBy:actor.personId,contentHash:sha,artifactRef:artifactId,normalizedRef:normalized.id,sourceFileName:input.fileName,exactDuplicateOf:priorDoc?.id||null};
    await this.repo.mutate(db=>{db.documents.push(document);db.artifacts.push(artifact);db.normalizedDocuments.push(normalized);db.audit.push({id:newId('AUD'),organizationId:actor.organizationId,actorRef:actor.personId,action:'document.upload',objectRef:docId,objectVersion:1,occurredAt:now(),correlationId:actor.correlationId});db.provenance.push({id:newId('PROV'),organizationId:actor.organizationId,targetRef:docId,type:'imported',sourceRefs:[artifactId],actorRef:actor.personId,createdAt:now(),contentHash:sha,notes:`${input.fileName} → normalized ${normalized.id}`});});
    return {document,artifact:{...artifact,storage:{...stored,url:stored.url?'[private-url]':undefined}},normalized:{id:normalized.id,language:normalized.language,structure:normalized.structure,textPreview:normalized.text.slice(0,500)}};
  }
  async processDocument(actor,id){const db=await this.repo.all();const doc=db.documents.find(x=>x.id===id&&x.organizationId===actor.organizationId);assert(doc,'DOC_NOT_FOUND','سند پیدا نشد.');const norm=db.normalizedDocuments?.find(x=>x.documentRef===doc.id&&x.sourceVersion<=doc.version);const inputText=norm?.text||doc.content;assert(inputText,'DOC_PROCESSING_CONTENT_MISSING','محتوای قابل پردازش سند پیدا نشد.');const task={id:newId('AITASK'),type:'document.topic_extract',organizationId:actor.organizationId,actorRef:'SVC:AI-WORKER',contextRefs:[{objectRef:doc.id,version:doc.version,normalizedRef:norm?.id}],inputText};const {execution,output,outputHash}=await this.ai.execute(task);const sourceFor=value=>{const u=norm?.units?.find(x=>String(x.text||'').includes(String(value||'')));return u?{normalizedRef:norm.id,...u.locationPointer}:{normalizedRef:norm?.id||null};};
    const candidates=[...output.topics.map(label=>({kind:'topic',value:label})),...output.claimCandidates.map(value=>({kind:'claim',value}))].map(c=>({id:newId('CAND'),organizationId:actor.organizationId,documentRef:doc.id,sourceVersion:doc.version,sourceLocation:sourceFor(c.value),kind:c.kind,value:c.value,status:'ready_for_review',aiExecutionRef:execution.id,outputHash,createdAt:now()}));await this.repo.mutate(data=>{const d=data.documents.find(x=>x.id===doc.id);d.status='processed';d.version+=1;d.updatedAt=now();data.aiExecutions.push(execution);data.candidates.push(...candidates);data.audit.push({id:newId('AUD'),organizationId:actor.organizationId,actorRef:'SVC:AI-WORKER',action:'document.process',objectRef:doc.id,objectVersion:d.version,occurredAt:now(),correlationId:actor.correlationId});});return {documentId:doc.id,candidates,execution};}
  async reviewCandidate(actor,id,{action,value}){assert(['accept','correct','reject'].includes(action),'CAND_ACTION_INVALID','عملیات بررسی نامعتبر است.');return this.repo.mutate(db=>{const c=db.candidates.find(x=>x.id===id&&x.organizationId===actor.organizationId);assert(c,'CAND_NOT_FOUND','پیشنهاد پیدا نشد.');assert(c.status==='ready_for_review','CAND_ALREADY_REVIEWED','این پیشنهاد قبلاً بررسی شده است.');const doc=db.documents.find(x=>x.id===c.documentRef&&x.organizationId===actor.organizationId);assert(doc,'DOC_NOT_FOUND','سند پیدا نشد.');if(action==='reject'){c.status='rejected';c.reviewedBy=actor.personId;c.reviewedAt=now();}else{const finalValue=action==='correct'?String(value||'').trim():c.value;assert(finalValue,'CAND_VALUE_REQUIRED','مقدار اصلاح‌شده الزامی است.');c.status=action==='correct'?'corrected':'accepted';c.finalValue=finalValue;c.reviewedBy=actor.personId;c.reviewedAt=now();doc.canonicalMetadata=doc.canonicalMetadata||{topics:[],claims:[]};const key=c.kind==='topic'?'topics':'claims';if(!doc.canonicalMetadata[key].includes(finalValue))doc.canonicalMetadata[key].push(finalValue);doc.version+=1;doc.updatedAt=now();db.provenance.push({id:newId('PROV'),organizationId:actor.organizationId,targetRef:doc.id,type:action==='correct'?'corrected':'derived',sourceRefs:[c.id,c.aiExecutionRef],actorRef:actor.personId,createdAt:now(),notes:`${c.kind}:${finalValue}`});}db.audit.push({id:newId('AUD'),organizationId:actor.organizationId,actorRef:actor.personId,action:`candidate.${action}`,objectRef:c.id,objectVersion:1,occurredAt:now(),correlationId:actor.correlationId});return {candidate:c,document:doc};});}

  async uploadBatch(actor,input){
    const files=Array.isArray(input.files)?input.files:[];
    assert(files.length,'BATCH_FILES_REQUIRED','حداقل یک فایل برای ورود گروهی الزامی است.');
    assert(files.length<=50,'BATCH_TOO_LARGE','در این Build حداکثر ۵۰ فایل در هر Batch مجاز است.');
    const job={id:newId('JOB'),organizationId:actor.organizationId,type:'knowledge_onboarding',status:'running',total:files.length,completed:0,failed:0,createdAt:now(),createdBy:actor.personId,items:[]};
    await this.repo.mutate(db=>{db.processingJobs=db.processingJobs||[];db.processingJobs.push(job);});
    for(const f of files){
      try{
        const r=await this.uploadDocument(actor,f);
        job.completed+=1; job.items.push({fileName:f.fileName,status:'uploaded',documentId:r.document.id,exactDuplicateOf:r.document.exactDuplicateOf||null});
      }catch(e){ job.failed+=1; job.items.push({fileName:f.fileName||'unknown',status:'failed',error:e.message}); }
      await this.repo.mutate(db=>{const j=(db.processingJobs||[]).find(x=>x.id===job.id); if(j) Object.assign(j,job);});
    }
    job.status=job.failed===files.length?'failed':job.failed?'completed_with_errors':'completed'; job.finishedAt=now();
    await this.repo.mutate(db=>{const j=(db.processingJobs||[]).find(x=>x.id===job.id); if(j) Object.assign(j,job);});
    return job;
  }
  async knowledgeInventory(actor){
    const db=await this.repo.all(); const docs=db.documents.filter(x=>x.organizationId===actor.organizationId);
    const artifacts=(db.artifacts||[]).filter(x=>x.organizationId===actor.organizationId);
    const groups={}; for(const a of artifacts){(groups[a.checksum]??=[]).push(a);}
    const duplicateGroups=Object.values(groups).filter(g=>g.length>1).map(g=>({checksum:g[0].checksum,count:g.length,documents:g.map(a=>a.documentRef),files:g.map(a=>a.fileName)}));
    const byType={}; for(const a of artifacts){const ext=(a.fileName.split('.').pop()||'unknown').toLowerCase();byType[ext]=(byType[ext]||0)+1;}
    const recentJobs=(db.processingJobs||[]).filter(x=>x.organizationId===actor.organizationId).slice(-10).reverse();
    return {summary:{documents:docs.length,artifacts:artifacts.length,duplicateGroups:duplicateGroups.length,reviewPending:db.candidates.filter(x=>x.organizationId===actor.organizationId&&x.status==='ready_for_review').length},byType,duplicateGroups,recentJobs};
  }
  async personalMorningWorkspace(actor){
    const db=await this.repo.all();
    const mine=x=>x.organizationId===actor.organizationId && (!x.assigneeRef || x.assigneeRef===actor.personId);
    const work=(db.workItems||[]).filter(mine).filter(x=>['open','in_progress','blocked'].includes(x.status));
    const meetings=(db.meetings||[]).filter(mine);
    const inbox=(db.inboxItems||[]).filter(mine).filter(x=>x.status!=='closed');
    const reviews=db.candidates.filter(x=>x.organizationId===actor.organizationId&&x.status==='ready_for_review');
    const alerts=(db.attentionItems||[]).filter(mine).filter(x=>x.status!=='closed');
    const score=(base,evidence)=>Math.min(100,Math.round(base*22+evidence*7));
    const ranked=[
      ...work.map(x=>({type:'work',ref:x.id,title:x.title,subtitle:x.dueAt?`مهلت: ${x.dueAt}`:'کار باز',priority:x.priority||2,reason:x.status==='blocked'?'کار متوقف شده و نیازمند رفع مانع است':x.dueAt?'دارای مهلت زمانی ثبت‌شده است':'کار باز تخصیص‌یافته به شما',evidence:[x.dueAt&&`due:${x.dueAt}`,`status:${x.status}`].filter(Boolean),confidence:x.dueAt?0.92:0.78})),
      ...meetings.map(x=>({type:'meeting',ref:x.id,title:x.title,subtitle:x.startAt||'جلسه',priority:x.priority||2,reason:'رویداد زمان‌دار در برنامه کاری شما',evidence:[x.startAt&&`start:${x.startAt}`].filter(Boolean),confidence:x.startAt?0.94:0.76})),
      ...inbox.map(x=>({type:'inbox',ref:x.id,title:x.title,subtitle:x.dueAt?`مهلت پاسخ: ${x.dueAt}`:'کارتابل',priority:x.priority||2,reason:x.dueAt?'نامه دارای مهلت پاسخ است':'مورد باز در کارتابل شما',evidence:[x.dueAt&&`due:${x.dueAt}`,`status:${x.status}`].filter(Boolean),confidence:x.dueAt?0.9:0.74})),
      ...reviews.map(x=>({type:'review',ref:x.id,title:`بررسی پیشنهاد: ${x.value}`,subtitle:'Human Gate',priority:2,reason:'پیشنهاد AI بدون تصمیم انسانی وارد Canonical نمی‌شود',evidence:[`candidate:${x.id}`],confidence:1})),
      ...alerts.map(x=>({type:'alert',ref:x.id,title:x.title,subtitle:x.reason||'نیازمند توجه',priority:x.priority||3,reason:x.reason||'هشدار فعال ثبت‌شده',evidence:x.evidence||[`attention:${x.id}`],confidence:x.confidence??0.8}))
    ].map(x=>({...x,attentionScore:score(x.priority,x.evidence.length)})).sort((a,b)=>b.attentionScore-a.attentionScore);
    return {summary:{work:work.length,meetings:meetings.length,inbox:inbox.length,reviews:reviews.length,alerts:alerts.length,total:ranked.length},attention:ranked.slice(0,12),brief:ranked.slice(0,3).map((x,i)=>({rank:i+1,title:x.title,reason:x.reason,confidence:x.confidence,score:x.attentionScore,ref:x.ref,type:x.type})),sources:{work:work.length?'live':'connector_pending',meetings:meetings.length?'live':'connector_pending',inbox:inbox.length?'live':'connector_pending',reviews:'live',alerts:alerts.length?'live':'empty'}};
  }
  async seedSyntheticMorning(actor){
    return this.repo.mutate(db=>{db.workItems=db.workItems||[];db.meetings=db.meetings||[];db.inboxItems=db.inboxItems||[];db.attentionItems=db.attentionItems||[];
      if(!db.workItems.some(x=>x.organizationId===actor.organizationId&&x.demo))db.workItems.push({id:newId('WORK'),organizationId:actor.organizationId,assigneeRef:actor.personId,title:'تکمیل گزارش پیشرفت پروژه',status:'in_progress',priority:3,dueAt:'امروز ۱۴:۰۰',demo:true});
      if(!db.meetings.some(x=>x.organizationId===actor.organizationId&&x.demo))db.meetings.push({id:newId('MTG'),organizationId:actor.organizationId,assigneeRef:actor.personId,title:'جلسه بررسی پروژه تحول',startAt:'امروز ۱۰:۰۰',priority:3,demo:true});
      if(!db.inboxItems.some(x=>x.organizationId===actor.organizationId&&x.demo))db.inboxItems.push({id:newId('MAIL'),organizationId:actor.organizationId,assigneeRef:actor.personId,title:'نامه نیازمند پاسخ',status:'open',priority:2,dueAt:'فردا',demo:true});
      return {seeded:true};});
  }
  async crossObjectWorkspace(actor,subject){
    const db=await this.repo.all();
    const clean=String(subject||'').replace(/(وضعیت|پروژه|موضوع|را|رو|بررسی|کن|نشان|بده|بیار)/g,' ').replace(/\s+/g,' ').trim();
    const terms=(clean||String(subject||'')).toLowerCase().split(/\s+/).filter(x=>x.length>1);
    const match=x=>{const hay=`${x.title||''} ${x.value||''} ${x.reason||''}`.toLowerCase();return !terms.length||terms.some(k=>hay.includes(k));};
    const org=x=>x.organizationId===actor.organizationId;
    const docs=(db.documents||[]).filter(org).filter(match).slice(0,6);
    const work=(db.workItems||[]).filter(org).filter(x=>!x.assigneeRef||x.assigneeRef===actor.personId).filter(match).slice(0,6);
    const meetings=(db.meetings||[]).filter(org).filter(x=>!x.assigneeRef||x.assigneeRef===actor.personId).filter(match).slice(0,6);
    const inbox=(db.inboxItems||[]).filter(org).filter(x=>!x.assigneeRef||x.assigneeRef===actor.personId).filter(match).slice(0,6);
    const alerts=(db.attentionItems||[]).filter(org).filter(x=>!x.assigneeRef||x.assigneeRef===actor.personId).filter(match).slice(0,6);
    const reviews=(db.candidates||[]).filter(x=>org(x)&&x.status==='ready_for_review').filter(match).slice(0,6);
    const item=(type,x,subtitle)=>({type,ref:x.id,title:x.title||x.value||x.id,subtitle,meta:type});
    const sections=[
      {key:'documents',title:'اسناد مرتبط',sourceStatus:'live',items:docs.map(x=>item('document',x,`نسخه ${x.version||1} · ${x.status||'ثبت‌شده'}`))},
      {key:'actions',title:'کارهای باز',sourceStatus:work.length?'live':'connector_pending',items:work.map(x=>item('work',x,x.dueAt?`مهلت: ${x.dueAt}`:x.status||'کار باز'))},
      {key:'meetings',title:'جلسات مرتبط',sourceStatus:meetings.length?'live':'connector_pending',items:meetings.map(x=>item('meeting',x,x.startAt||'زمان ثبت نشده'))},
      {key:'correspondence',title:'مکاتبات',sourceStatus:inbox.length?'live':'connector_pending',items:inbox.map(x=>item('inbox',x,x.dueAt?`مهلت پاسخ: ${x.dueAt}`:x.status||'باز'))},
      {key:'alerts',title:'هشدارها و موارد نیازمند توجه',sourceStatus:'live',items:[...alerts.map(x=>item('alert',x,x.reason||'هشدار فعال')),...reviews.map(x=>item('review',x,'نیازمند Human Gate'))]}
    ];
    return {subject:clean||String(subject||'').trim(),sections,summary:{documents:docs.length,actions:work.length,meetings:meetings.length,correspondence:inbox.length,attention:alerts.length+reviews.length,total:sections.reduce((n,s)=>n+s.items.length,0)}};
  }
  async conversationState(actor,sessionId){
    const db=await this.repo.all();
    const sessions=db.commandSessions||[];
    return sessions.find(x=>x.id===sessionId&&x.organizationId===actor.organizationId&&x.personId===actor.personId)||null;
  }
  async rememberCommand(actor,sessionId,patch,turn){
    return this.repo.mutate(db=>{
      db.commandSessions=db.commandSessions||[];
      let s=db.commandSessions.find(x=>x.id===sessionId&&x.organizationId===actor.organizationId&&x.personId===actor.personId);
      if(!s){s={id:sessionId,organizationId:actor.organizationId,personId:actor.personId,createdAt:now(),updatedAt:now(),context:{},turns:[]};db.commandSessions.push(s);}
      s.context={...(s.context||{}),...(patch||{})}; s.updatedAt=now();
      s.turns=(s.turns||[]).slice(-19); s.turns.push(turn);
      return s;
    });
  }

  async resolveSourceReference(actor,ref){
    const id=String(ref||'').trim();
    assert(id,'SOURCE_REF_REQUIRED','مرجع منبع الزامی است.');
    const db=await this.repo.all();
    const own=x=>x&&x.organizationId===actor.organizationId;
    const scopedMine=x=>own(x)&&(!x.assigneeRef||x.assigneeRef===actor.personId);

    const maps=[
      ['document','documents',x=>own(x)],
      ['work','workItems',x=>scopedMine(x)],
      ['meeting','meetings',x=>scopedMine(x)],
      ['inbox','inboxItems',x=>scopedMine(x)],
      ['alert','attentionItems',x=>scopedMine(x)],
      ['review','candidates',x=>own(x)]
    ];
    for(const [type,key,allowed] of maps){
      const record=(db[key]||[]).find(x=>x.id===id);
      if(!record)continue;
      assert(allowed(record),'SOURCE_ACCESS_DENIED','دسترسی به منبع مجاز نیست.');
      const fields={
        document:['id','title','status','version','createdAt','updatedAt','contentHash','exactDuplicateOf'],
        work:['id','title','status','priority','dueAt','assigneeRef'],
        meeting:['id','title','startAt','priority','assigneeRef'],
        inbox:['id','title','status','priority','dueAt','assigneeRef'],
        alert:['id','title','status','priority','reason','confidence'],
        review:['id','kind','value','status','sourceLocation','documentId']
      }[type]||['id','title','status'];
      const data=Object.fromEntries(fields.filter(k=>record[k]!=null).map(k=>[k,record[k]]));
      return {
        ref:id,
        type,
        found:true,
        access:'authorized',
        data,
        actions:{
          trace:type==='document',
          humanReview:type==='review'&&record.status==='ready_for_review',
          editable:false
        },
        provenanceNotice:'این نما رکورد منبع قابل دسترس را نشان می‌دهد؛ وجود رکورد به‌تنهایی اعتبار محتوایی همه ادعاهای مرتبط را اثبات نمی‌کند.'
      };
    }
    return {ref:id,type:'unknown',found:false,access:'not_found',data:null,actions:{trace:false,humanReview:false,editable:false},provenanceNotice:'مرجع در داده‌های قابل دسترس فعلی پیدا نشد.'};
  }

  async buildCognitiveFocusQueue(actor){
    const w=await this.personalMorningWorkspace(actor);
    const sourceItems=Array.isArray(w.attention)?w.attention:[];
    const normalize=(x,idx)=>{
      const score=Number(x.attentionScore??x.score??0);
      const confidence=x.confidence==null?null:Number(x.confidence);
      const ref=x.ref||x.id||null;
      const sourceType=x.type||x.meta||x.sourceType||'unknown';
      const reason=x.reason||'این مورد از داده‌های قابل دسترس فعلی وارد صف توجه شده است.';
      const nextAction=
        sourceType==='meeting'?'آماده‌سازی برای جلسه و مرور موضوعات تصمیم‌گیری':
        sourceType==='work'?'بررسی تعهد، مهلت و مانع احتمالی':
        sourceType==='inbox'?'بررسی فوریت پاسخ و اثر سازمانی':
        sourceType==='review'?'انجام قضاوت انسانی پیش از ورود به دانش رسمی':
        sourceType==='alert'?'بررسی شواهد هشدار و تعیین مالک پیگیری':
        'بررسی زمینه، شواهد و تصمیم بعدی';
      return {
        ref,
        title:x.title||`مورد ${idx+1}`,
        subtitle:x.subtitle||'',
        sourceType,
        reason,
        confidence,
        attentionScore:score,
        nextAction,
        evidence:Array.isArray(x.evidence)?x.evidence:[],
        provenance:{
          sourceRef:ref,
          sourceType,
          evidenceStatus:Array.isArray(x.evidence)&&x.evidence.length?'available':'reference_only',
          reasoning:[
            {stage:'source',label:'منبع',value:ref||'مرجع صریح در دسترس نیست'},
            {stage:'evidence',label:'شاهد',value:Array.isArray(x.evidence)&&x.evidence.length?`${x.evidence.length} شاهد ثبت‌شده`:'فقط مرجع ساختاری موجود است'},
            {stage:'reasoning',label:'استدلال',value:reason},
            {stage:'priority',label:'اولویت شناختی',value:`امتیاز توجه ${score} از ۱۰۰`},
            {stage:'recommendation',label:'اقدام پیشنهادی',value:nextAction}
          ],
          cognitivePath:{
            status:'derived_from_accessible_context',
            nodes:[
              {kind:'source',label:'منبع',ref},
              {kind:'evidence',label:'شاهد',count:Array.isArray(x.evidence)?x.evidence.length:0},
              {kind:'reasoning',label:'استدلال'},
              {kind:'priority',label:'اولویت',score},
              {kind:'action',label:'اقدام پیشنهادی'}
            ],
            organizationalTruth:false
          }
        },
        meta:x.meta||sourceType
      };
    };
    const items=sourceItems.map(normalize).sort((a,b)=>b.attentionScore-a.attentionScore);
    return {
      generatedAt:new Date().toISOString(),
      items,
      summary:{
        total:items.length,
        high:items.filter(x=>x.attentionScore>=80).length,
        medium:items.filter(x=>x.attentionScore>=50&&x.attentionScore<80).length,
        evidenceAware:true,
        fabricated:false
      }
    };
  }

  async buildDecisionReadiness(actor,input={}){
    const subject=String(input.subject||input.ref||'').trim();
    const db=await this.repo.all();
    const focus=await this.buildCognitiveFocusQueue(actor);

    let item=null;
    if(subject){
      item=focus.items.find(x=>x.ref===subject)||
           focus.items.find(x=>String(x.title||'').toLowerCase().includes(subject.toLowerCase()));
    }
    if(!item)item=focus.items[0]||null;

    if(!item){
      return {
        status:'insufficient_context',
        subject:subject||null,
        readiness:{level:'not_ready',score:null},
        dimensions:[],
        blockers:['در داده‌های قابل دسترس فعلی، موضوعی برای ارزیابی آمادگی تصمیم پیدا نشد.'],
        requiredNextSteps:['ابتدا موضوع یا منبع مرتبط را مشخص کنید.'],
        fabricated:false
      };
    }

    const evidenceCount=Array.isArray(item.evidence)?item.evidence.length:0;
    const hasEvidence=evidenceCount>0;
    const hasReasoning=Boolean(item.reason);
    const hasAction=Boolean(item.nextAction);
    const confidence=item.confidence==null?null:Number(item.confidence);
    const confidenceScore=confidence==null?null:Math.round(confidence*100);

    const dims=[
      {
        key:'evidence',
        title:'کفایت شواهد',
        status:hasEvidence?'adequate':'insufficient',
        score:hasEvidence?Math.min(100,55+evidenceCount*15):25,
        note:hasEvidence?`${evidenceCount} شاهد/نشانه ثبت‌شده در زمینه فعلی`:'شاهد صریح کافی ثبت نشده است'
      },
      {
        key:'reasoning',
        title:'شفافیت استدلال',
        status:hasReasoning?'adequate':'insufficient',
        score:hasReasoning?80:20,
        note:hasReasoning?'دلیل ورود موضوع به صف توجه ثبت شده است':'دلیل صریح برای این موضوع در دسترس نیست'
      },
      {
        key:'confidence',
        title:'اطمینان تحلیلی',
        status:confidenceScore==null?'unknown':confidenceScore>=75?'adequate':'needs_review',
        score:confidenceScore,
        note:confidenceScore==null?'درجه اطمینان ثبت نشده است':`اطمینان فعلی ${confidenceScore}٪`
      },
      {
        key:'capacity',
        title:'کفایت ظرفیت',
        status:'unknown',
        score:null,
        note:'در این Build هنوز نگاشت کامل Requirement ↔ Capacity برای این موضوع محاسبه نشده است'
      },
      {
        key:'risk',
        title:'ریسک و پیامد',
        status:item.sourceType==='alert'?'needs_review':'unknown',
        score:null,
        note:item.sourceType==='alert'?'موضوع از جنس هشدار است و نیازمند مرور ریسک است':'تحلیل ریسک کامل برای این موضوع در دسترس نیست'
      },
      {
        key:'governance',
        title:'آمادگی حکمرانی/تصمیم',
        status:item.sourceType==='review'?'needs_human_gate':'unknown',
        score:null,
        note:item.sourceType==='review'?'قبل از ورود به دانش رسمی نیازمند Human Gate است':'مالک تصمیم، اختیار و سطح تصویب هنوز به‌طور کامل تعیین نشده است'
      }
    ];

    const numeric=dims.map(x=>x.score).filter(x=>Number.isFinite(x));
    const score=numeric.length?Math.round(numeric.reduce((a,b)=>a+b,0)/numeric.length):null;

    const blockers=[];
    if(!hasEvidence)blockers.push('کفایت شواهد تأیید نشده است.');
    if(confidenceScore!=null&&confidenceScore<75)blockers.push('اطمینان تحلیلی برای تصمیم قطعی پایین است.');
    blockers.push('کفایت ظرفیت هنوز ارزیابی کامل نشده است.');
    blockers.push('ریسک، پیامد و سطح اختیار تصمیم هنوز کامل نشده است.');

    const level=
      !hasEvidence?'not_ready':
      blockers.length>=3?'needs_preparation':
      score!=null&&score>=80?'ready_for_review':
      'needs_preparation';

    return {
      status:'live',
      subject:{ref:item.ref,title:item.title,sourceType:item.sourceType},
      readiness:{
        level,
        score,
        decisionAllowed:false,
        humanJudgmentRequired:true
      },
      dimensions:dims,
      blockers,
      requiredNextSteps:[
        'تکمیل شواهد مستقیم و معتبر',
        'ارزیابی Requirement ↔ Capacity',
        'ثبت ریسک‌ها، پیامدها و ذی‌نفعان',
        'تعیین مالک تصمیم، سطح اختیار و Human Gate',
        'آماده‌سازی Decision Brief پیش از جلسه/تصمیم'
      ],
      principle:'Decision Readiness ≠ Decision Authority',
      fabricated:false
    };
  }

  async buildDecisionBrief(actor,input={}){
    const readiness=await this.buildDecisionReadiness(actor,input);
    if(readiness.status!=='live'){
      return {status:'insufficient_context',subject:readiness.subject||null,brief:null,fabricated:false};
    }
    const ref=readiness.subject?.ref;
    const source=ref?await this.resolveSourceReference(actor,ref):null;
    const focus=await this.buildCognitiveFocusQueue(actor);
    const item=focus.items.find(x=>x.ref===ref)||null;
    const evidence=(item?.evidence||[]).map((x,i)=>({id:`EV-${i+1}`,value:x,status:'available'}));
    const unknown=d=>readiness.dimensions.find(x=>x.key===d)?.status==='unknown';
    return {
      status:'live',
      subject:readiness.subject,
      brief:{
        executiveQuestion:`آیا موضوع «${readiness.subject.title}» برای ورود به تصمیم سازمانی به اندازه کافی آماده است؟`,
        problemFrame:{
          statement:item?.reason||'صورت مسئله کامل در داده‌های قابل دسترس فعلی ثبت نشده است.',
          sourceRef:ref,
          sourceType:readiness.subject.sourceType
        },
        evidence,
        readiness:readiness.readiness,
        uncertainties:[
          ...(unknown('capacity')?['کفایت ظرفیت هنوز به‌طور کامل ارزیابی نشده است.']:[]),
          ...(unknown('risk')?['تحلیل کامل ریسک و پیامد در دسترس نیست.']:[]),
          ...(unknown('governance')?['مالک تصمیم، سطح اختیار و سازوکار تصویب کامل نشده است.']:[])
        ],
        risks:[
          readiness.dimensions.find(x=>x.key==='risk')?.note||'تحلیل ریسک کامل نشده است.'
        ],
        capacity:{
          status:readiness.dimensions.find(x=>x.key==='capacity')?.status||'unknown',
          note:readiness.dimensions.find(x=>x.key==='capacity')?.note||''
        },
        options:[
          {key:'defer',title:'تکمیل شناخت پیش از تصمیم',status:'safe_default',basis:'رفع موانع آمادگی ثبت‌شده'},
          {key:'human_review',title:'ورود به مرور انسانی مشروط',status:readiness.readiness.level==='ready_for_review'?'eligible':'not_yet_eligible',basis:'نیازمند قضاوت انسانی و اختیار معتبر'}
        ],
        blockers:readiness.blockers,
        preDecisionChecklist:readiness.requiredNextSteps,
        source:source?.found?{ref:source.ref,type:source.type,access:source.access}:null,
        decisionRecord:null
      },
      governance:{
        decisionCreated:false,
        authorityGranted:false,
        humanJudgmentRequired:true,
        principle:'Decision Brief prepares judgment; it does not make the decision.'
      },
      fabricated:false
    };
  }

  async buildPreMeetingIntelligence(actor,input={}){
    const db=await this.repo.all();
    const meetings=(db.meetings||[]).filter(x=>x.organizationId===actor.organizationId&&(!x.assigneeRef||x.assigneeRef===actor.personId));
    const requested=String(input.meetingRef||input.ref||'').trim();
    const meeting=(requested?meetings.find(x=>x.id===requested):null)||meetings[0]||null;
    if(!meeting)return {status:'insufficient_context',meeting:null,agenda:[],fabricated:false};

    const focus=await this.buildCognitiveFocusQueue(actor);
    const relevant=focus.items.filter(x=>x.ref===meeting.id||x.sourceType!=='meeting').slice(0,5);
    const agenda=[];
    for(const item of relevant){
      const readiness=await this.buildDecisionReadiness(actor,{ref:item.ref});
      agenda.push({
        ref:item.ref,title:item.title,sourceType:item.sourceType,
        attentionScore:item.attentionScore,
        decisionReadiness:readiness.readiness,
        evidenceCount:Array.isArray(item.evidence)?item.evidence.length:0,
        reason:item.reason,
        nextAction:item.nextAction,
        blockers:readiness.blockers.slice(0,3)
      });
    }
    const decisionItems=agenda.filter(x=>x.decisionReadiness?.level==='ready_for_review');
    const preparationItems=agenda.filter(x=>x.decisionReadiness?.level!=='ready_for_review');
    return {
      status:'live',
      meeting:{ref:meeting.id,title:meeting.title,startAt:meeting.startAt||null,priority:meeting.priority||null},
      executiveSummary:{
        agendaItems:agenda.length,
        readyForHumanReview:decisionItems.length,
        needsPreparation:preparationItems.length,
        evidenceAware:true
      },
      agenda,
      meetingQuestions:[
        ...preparationItems.slice(0,3).map(x=>`برای «${x.title}» کدام شواهد/ظرفیت‌ها باید قبل از تصمیم تکمیل شوند؟`),
        ...decisionItems.slice(0,2).map(x=>`آیا درباره «${x.title}» پس از مرور شواهد، قضاوت انسانی و اختیار لازم برای تصمیم وجود دارد؟`)
      ],
      governance:{
        decisionsCreated:0,
        minutesCreated:false,
        humanChairRequired:true,
        principle:'Pre-Meeting Intelligence prepares the meeting; it does not predetermine its decisions.'
      },
      fabricated:false
    };
  }

  async buildLiveMeetingIntelligence(actor,input={}){
    const pre=await this.buildPreMeetingIntelligence(actor,{meetingRef:input.meetingRef||input.ref});
    if(pre.status!=='live')return {status:'insufficient_context',meeting:null,fabricated:false};
    const statements=Array.isArray(input.statements)?input.statements:[];
    const observations=statements.map((x,i)=>{
      const text=String(x.text||x||'').trim();
      const hasEvidenceRef=Boolean(x.evidenceRef||x.sourceRef);
      const looksLikeDecision=/تصمیم|مصوب|توافق|انجام شود|اقدام شود/.test(text);
      const looksLikeAction=/پیگیری|مسئول|مهلت|تا تاریخ|اقدام/.test(text);
      return {
        id:`OBS-${i+1}`,
        text,
        speakerRef:x.speakerRef||null,
        evidenceRef:x.evidenceRef||x.sourceRef||null,
        evidenceStatus:hasEvidenceRef?'referenced':'not_referenced',
        classification:looksLikeDecision?'decision_candidate':looksLikeAction?'action_candidate':'discussion',
        canonical:false,
        requiresHumanConfirmation:looksLikeDecision||looksLikeAction
      };
    });
    return {
      status:'live',
      meeting:pre.meeting,
      agenda:pre.agenda,
      observations,
      evidenceWarnings:observations.filter(x=>x.evidenceStatus==='not_referenced'&&x.classification!=='discussion').map(x=>({
        observationId:x.id,
        message:'این گزاره ماهیت تصمیم/اقدام دارد اما مرجع شاهد صریح همراه آن ثبت نشده است.'
      })),
      decisionCandidates:observations.filter(x=>x.classification==='decision_candidate'),
      actionCandidates:observations.filter(x=>x.classification==='action_candidate'),
      governance:{
        canonicalDecisionsCreated:0,
        canonicalActionsCreated:0,
        transcriptIsEvidenceNotAuthority:true,
        humanConfirmationRequired:true,
        principle:'Live Meeting Intelligence captures candidates; only authorized human confirmation can create organizational decisions/actions.'
      },
      fabricated:false
    };
  }

  async confirmDecisionCandidate(actor,input={}){
    const candidate=input.candidate||null;
    if(!candidate||candidate.classification!=='decision_candidate'){
      return {status:'rejected',reason:'VALID_DECISION_CANDIDATE_REQUIRED',decision:null,fabricated:false};
    }
    const confirmation=input.confirmation||{};
    const authorized=confirmation.authorized===true;
    const humanConfirmed=confirmation.humanConfirmed===true;
    const authorityRef=String(confirmation.authorityRef||'').trim();
    const rationale=String(confirmation.rationale||'').trim();
    const evidenceRefs=[...(Array.isArray(confirmation.evidenceRefs)?confirmation.evidenceRefs:[]),candidate.evidenceRef].filter(Boolean);
    const blockers=[];
    if(!humanConfirmed)blockers.push('تأیید صریح انسان مجاز ثبت نشده است.');
    if(!authorized)blockers.push('مجوز تصمیم‌گیر تأیید نشده است.');
    if(!authorityRef)blockers.push('مرجع اختیار تصمیم ثبت نشده است.');
    if(!rationale)blockers.push('دلیل تصمیم ثبت نشده است.');
    if(!evidenceRefs.length)blockers.push('حداقل یک مرجع شاهد برای تصمیم ثبت نشده است.');
    if(blockers.length)return {
      status:'blocked',decision:null,blockers,
      gate:{humanConfirmed,authorized,authorityRef:authorityRef||null,evidenceCount:evidenceRefs.length},
      principle:'No authority + no evidence + no rationale = no canonical decision.',
      fabricated:false
    };
    const decision={
      id:`DEC:${Date.now()}`,
      organizationId:actor.organizationId,
      meetingRef:input.meetingRef||null,
      candidateObservationId:candidate.id||null,
      text:candidate.text,
      rationale,
      evidenceRefs:[...new Set(evidenceRefs)],
      authorityRef,
      confirmedBy:actor.personId,
      status:'confirmed',
      canonical:true,
      createdAt:new Date().toISOString()
    };
    await this.repo.mutate(db=>{
      db.decisions=db.decisions||[];
      db.decisions.push(decision);
      db.auditLog=db.auditLog||[];
      db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'decision.confirmed',targetRef:decision.id,authorityRef,evidenceRefs:decision.evidenceRefs,at:decision.createdAt});
    });
    return {
      status:'confirmed',
      decision,
      gate:{humanConfirmed:true,authorized:true,authorityRef,evidenceCount:decision.evidenceRefs.length},
      audit:{recorded:true,action:'decision.confirmed'},
      principle:'Canonical organizational decision exists only after explicit authorized human confirmation.',
      fabricated:false
    };
  }

  async translateDecisionToAction(actor,input={}){
    const decision=input.decision||null;
    if(!decision||decision.canonical!==true||decision.status!=='confirmed'){
      return {
        status:'blocked',
        reason:'CONFIRMED_CANONICAL_DECISION_REQUIRED',
        plan:null,
        fidelity:null,
        fabricated:false
      };
    }
    if(decision.organizationId&&decision.organizationId!==actor.organizationId){
      return {status:'blocked',reason:'DECISION_ACCESS_DENIED',plan:null,fidelity:null,fabricated:false};
    }
    const proposed=Array.isArray(input.actions)?input.actions:[];
    const actions=proposed.map((x,i)=>({
      id:x.id||`ACT:${decision.id}:${i+1}`,
      title:String(x.title||'').trim(),
      ownerRef:x.ownerRef||null,
      dueAt:x.dueAt||null,
      dependencies:Array.isArray(x.dependencies)?x.dependencies:[],
      resourceRefs:Array.isArray(x.resourceRefs)?x.resourceRefs:[],
      evidenceRefs:Array.isArray(x.evidenceRefs)?x.evidenceRefs:[],
      status:'draft',
      canonical:false
    })).filter(x=>x.title);

    const checks={
      decisionLinked:actions.length>0,
      ownershipComplete:actions.length>0&&actions.every(x=>Boolean(x.ownerRef)),
      deadlineComplete:actions.length>0&&actions.every(x=>Boolean(x.dueAt)),
      evidenceTraceable:actions.length>0&&actions.every(x=>x.evidenceRefs.length>0),
      dependencyKnown:actions.every(x=>Array.isArray(x.dependencies)),
      resourcesDeclared:actions.every(x=>Array.isArray(x.resourceRefs))
    };
    const score=Math.round(Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100);
    const gaps=[];
    if(!checks.decisionLinked)gaps.push('هیچ اقدام اجرایی برای تصمیم تعریف نشده است.');
    if(!checks.ownershipComplete)gaps.push('برای همه اقدامات مسئول مشخص نشده است.');
    if(!checks.deadlineComplete)gaps.push('برای همه اقدامات مهلت مشخص نشده است.');
    if(!checks.evidenceTraceable)gaps.push('پیوند شاهد/مبنای اجرایی برای همه اقدامات کامل نیست.');
    const plan={
      id:`PLAN:${decision.id}`,
      organizationId:actor.organizationId,
      decisionRef:decision.id,
      decisionText:decision.text,
      actions,
      status:gaps.length?'draft_needs_completion':'ready_for_human_approval',
      canonical:false,
      createdBy:actor.personId,
      createdAt:new Date().toISOString()
    };
    await this.repo.mutate(db=>{
      db.interventionPlans=db.interventionPlans||[];
      db.interventionPlans.push(plan);
      db.auditLog=db.auditLog||[];
      db.auditLog.push({
        id:`AUD:${Date.now()}`,
        organizationId:actor.organizationId,
        actorRef:actor.personId,
        action:'decision.translation.prepared',
        targetRef:plan.id,
        decisionRef:decision.id,
        fidelityScore:score,
        at:plan.createdAt
      });
    });
    return {
      status:'live',
      plan,
      fidelity:{
        score,
        level:score>=85?'high':score>=60?'medium':'low',
        checks,
        gaps,
        principle:'Decision Translation Fidelity measures preservation of decision intent across execution design.'
      },
      governance:{
        executionAuthorized:false,
        planCanonical:false,
        humanApprovalRequired:true,
        principle:'Draft action plan ≠ authorized execution.'
      },
      fabricated:false
    };
  }

  async authorizeExecutionPlan(actor,input={}){
    const plan=input.plan||null, approval=input.approval||{};
    if(!plan||plan.organizationId!==actor.organizationId||!plan.decisionRef){
      return {status:'blocked',reason:'VALID_SCOPED_ACTION_PLAN_REQUIRED',executionPlan:null,fabricated:false};
    }
    const blockers=[];
    if(plan.status!=='ready_for_human_approval')blockers.push('برنامه اقدام هنوز برای تأیید انسانی آماده نیست.');
    if(approval.humanApproved!==true)blockers.push('تأیید صریح انسانی ثبت نشده است.');
    if(approval.authorized!==true)blockers.push('اختیار تأییدکننده احراز نشده است.');
    if(!String(approval.authorityRef||'').trim())blockers.push('مرجع اختیار اجرای تصمیم ثبت نشده است.');
    if(!Array.isArray(plan.actions)||!plan.actions.length)blockers.push('حداقل یک اقدام اجرایی الزامی است.');
    if(blockers.length)return {status:'blocked',blockers,executionPlan:null,fabricated:false};

    const workPackages=plan.actions.map((x,i)=>({
      id:`WP:${plan.id}:${i+1}`,
      title:x.title,
      decisionRef:plan.decisionRef,
      actionRef:x.id,
      raci:{
        responsible:x.ownerRef||null,
        accountable:approval.accountableRef||actor.personId,
        consulted:Array.isArray(x.consultedRefs)?x.consultedRefs:[],
        informed:Array.isArray(x.informedRefs)?x.informedRefs:[]
      },
      dueAt:x.dueAt||null,
      dependencies:x.dependencies||[],
      allocatedResources:x.resourceRefs||[],
      evidenceRefs:x.evidenceRefs||[],
      milestones:Array.isArray(x.milestones)?x.milestones:[],
      kpis:Array.isArray(x.kpis)?x.kpis:[],
      status:'authorized_not_started'
    }));
    const readiness={
      ownershipComplete:workPackages.every(x=>Boolean(x.raci.responsible&&x.raci.accountable)),
      deadlineComplete:workPackages.every(x=>Boolean(x.dueAt)),
      evidenceTraceable:workPackages.every(x=>x.evidenceRefs.length>0),
      resourcesDeclared:workPackages.every(x=>Array.isArray(x.allocatedResources))
    };
    const score=Math.round(Object.values(readiness).filter(Boolean).length/Object.keys(readiness).length*100);
    const executionPlan={
      id:`EXEC:${plan.id}`,
      organizationId:actor.organizationId,
      decisionRef:plan.decisionRef,
      translationPlanRef:plan.id,
      authorityRef:approval.authorityRef,
      approvedBy:actor.personId,
      workPackages,
      executionReadinessScore:score,
      status:'authorized',
      canonical:true,
      started:false,
      authorizedAt:new Date().toISOString()
    };
    await this.repo.mutate(db=>{
      db.executionPlans=db.executionPlans||[]; db.executionPlans.push(executionPlan);
      db.auditLog=db.auditLog||[]; db.auditLog.push({
        id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,
        action:'execution.plan.authorized',targetRef:executionPlan.id,decisionRef:plan.decisionRef,
        authorityRef:approval.authorityRef,at:executionPlan.authorizedAt
      });
    });
    return {
      status:'authorized',
      executionPlan,
      readiness:{score,checks:readiness},
      governance:{
        executionMayStart:true,
        monitoringRequired:true,
        humanAccountabilityPreserved:true,
        principle:'Authorized Execution Plan permits execution; it does not prove execution or outcome.'
      },
      fabricated:false
    };
  }

  async monitorExecution(actor,input={}){
    const plan=input.executionPlan||null;
    if(!plan||plan.organizationId!==actor.organizationId||plan.status!=='authorized'||plan.canonical!==true){
      return {status:'blocked',reason:'AUTHORIZED_EXECUTION_PLAN_REQUIRED',monitoring:null,fabricated:false};
    }
    const updates=Array.isArray(input.updates)?input.updates:[];
    const now=input.now?new Date(input.now):new Date();
    const packages=(plan.workPackages||[]).map(wp=>{
      const u=updates.find(x=>x.workPackageRef===wp.id)||{};
      const progress=Number.isFinite(Number(u.progress))?Math.max(0,Math.min(100,Number(u.progress))):0;
      const due=wp.dueAt?new Date(wp.dueAt):null;
      const delayed=Boolean(due&&now>due&&progress<100);
      const reportedStatus=u.status|| (progress>=100?'completed':progress>0?'in_progress':'not_started');
      const evidenceRefs=Array.isArray(u.evidenceRefs)?u.evidenceRefs:[];
      const kpiResults=Array.isArray(u.kpiResults)?u.kpiResults:[];
      const milestoneResults=Array.isArray(u.milestoneResults)?u.milestoneResults:[];
      const deviations=[];
      if(delayed)deviations.push({type:'schedule',severity:'high',message:'مهلت Work Package گذشته و پیشرفت کمتر از ۱۰۰٪ است.'});
      if(progress>0&&!evidenceRefs.length)deviations.push({type:'evidence',severity:'medium',message:'پیشرفت گزارش شده اما شاهد اجرایی همراه آن ثبت نشده است.'});
      if(u.intentAlignment===false)deviations.push({type:'decision_fidelity',severity:'high',message:'گزارش اجرا با نیت تصمیم اصلی هم‌راستا تشخیص داده نشده است.'});
      return {
        ref:wp.id,title:wp.title,ownerRef:wp.raci?.responsible||null,dueAt:wp.dueAt||null,
        progress,status:reportedStatus,delayed,evidenceRefs,kpiResults,milestoneResults,deviations,
        observed:Boolean(Object.keys(u).length),canonicalExecutionFact:false
      };
    });
    const allDeviations=packages.flatMap(x=>x.deviations.map(d=>({...d,workPackageRef:x.ref,title:x.title})));
    const avg=packages.length?Math.round(packages.reduce((n,x)=>n+x.progress,0)/packages.length):0;
    const health=allDeviations.some(x=>x.severity==='high')?'at_risk':allDeviations.length?'watch':'on_track';
    const monitoring={
      executionPlanRef:plan.id,decisionRef:plan.decisionRef,
      progress:avg,health,
      packages,
      deviationCount:allDeviations.length,
      deviations:allDeviations,
      observedAt:now.toISOString()
    };
    await this.repo.mutate(db=>{
      db.executionMonitoring=db.executionMonitoring||[]; db.executionMonitoring.push(monitoring);
      db.auditLog=db.auditLog||[]; db.auditLog.push({
        id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,
        action:'execution.monitoring.observed',targetRef:plan.id,deviationCount:allDeviations.length,at:monitoring.observedAt
      });
    });
    return {
      status:'live',
      monitoring,
      governance:{
        progressIsReportedNotProven:true,
        deviationsAreWarningsNotVerdicts:true,
        humanReviewRequired:allDeviations.length>0,
        principle:'Execution monitoring distinguishes reported progress, evidence-backed observation, and organizational truth.'
      },
      fabricated:false
    };
  }

  async diagnoseNonAchievement(actor,input={}){
    const monitoring=input.monitoring||null;
    if(!monitoring||!monitoring.executionPlanRef){
      return {status:'blocked',reason:'EXECUTION_MONITORING_REQUIRED',diagnosis:null,fabricated:false};
    }
    const outcome=input.outcome||{};
    const expected=Number(outcome.expected), observed=Number(outcome.observed);
    const measurable=Number.isFinite(expected)&&Number.isFinite(observed);
    const achievementRatio=measurable&&expected!==0?observed/expected:null;
    let classification='undetermined';
    if(measurable){
      if(achievementRatio>=1)classification='achieved';
      else if(achievementRatio>=0.6)classification='under_achievement';
      else if(achievementRatio>0)classification='non_achievement';
      else classification='failure';
    }

    const signals={
      executionDeviation:(monitoring.deviations||[]).length>0,
      translationFidelityIssue:(monitoring.deviations||[]).some(x=>x.type==='decision_fidelity')||input.translationFidelityIssue===true,
      interpretationIssue:input.interpretationIssue===true,
      capacityIssue:input.capacityIssue===true,
      governanceIssue:input.governanceIssue===true,
      externalShock:input.externalShock===true,
      evidenceInsufficient:!Array.isArray(outcome.evidenceRefs)||outcome.evidenceRefs.length===0
    };
    const hypotheses=[];
    if(signals.translationFidelityIssue)hypotheses.push({level:1,type:'translation',claim:'تصمیم ممکن است در تبدیل به برنامه/دستور اجرایی دچار افت وفاداری شده باشد.',status:'hypothesis'});
    if(signals.interpretationIssue)hypotheses.push({level:2,type:'interpretation',claim:'برداشت اجرایی از دستور ممکن است با معنای مورد انتظار متفاوت بوده باشد.',status:'hypothesis'});
    if(signals.capacityIssue)hypotheses.push({level:3,type:'capacity',claim:'کفایت ظرفیت یا تخصیص منابع ممکن است برای اجرای صحیح کافی نبوده باشد.',status:'hypothesis'});
    if(signals.governanceIssue)hypotheses.push({level:4,type:'governance',claim:'پایش، پیگیری یا سیگنال‌های حکمرانی ممکن است مانع تحقق شده باشند.',status:'hypothesis'});
    if(signals.externalShock)hypotheses.push({level:null,type:'external',claim:'عامل بیرونی هم‌زمان می‌تواند در عدم تحقق سهم داشته باشد.',status:'hypothesis'});
    if(signals.executionDeviation&&!hypotheses.length)hypotheses.push({level:null,type:'execution',claim:'انحراف اجرایی مشاهده شده است، اما علت آن هنوز برای انتساب کافی نیست.',status:'hypothesis'});

    const backtrack=[
      {layer:'Outcome',status:measurable?'observed':'insufficient_evidence'},
      {layer:'Execution',status:signals.executionDeviation?'deviation_detected':'no_deviation_detected'},
      {layer:'Intervention',status:input.interventionEvidence?'evidence_available':'needs_review'},
      {layer:'Instruction',status:signals.interpretationIssue?'possible_issue':'needs_review'},
      {layer:'Decision',status:signals.translationFidelityIssue?'possible_fidelity_issue':'needs_review'},
      {layer:'Reasoning',status:input.reasoningEvidence?'evidence_available':'needs_review'},
      {layer:'Cognition',status:input.cognitionEvidence?'evidence_available':'needs_review'},
      {layer:'Data',status:signals.evidenceInsufficient?'insufficient':'referenced'}
    ];
    const diagnosis={
      executionPlanRef:monitoring.executionPlanRef,
      decisionRef:monitoring.decisionRef||null,
      outcome:{expected:measurable?expected:null,observed:measurable?observed:null,achievementRatio,evidenceRefs:outcome.evidenceRefs||[]},
      classification,
      backtrack,
      hypotheses,
      attribution:{
        status:hypotheses.length?'not_confirmed':'insufficient_basis',
        confirmedCause:null,
        principle:'Diagnostic signals generate causal hypotheses; they do not establish causality without evidence.'
      },
      correctiveActions:[
        ...(signals.translationFidelityIssue?['بازبینی زنجیره Decision → Plan → Work Package']:[]),
        ...(signals.capacityIssue?['بازسنجی Requirement ↔ Allocated Capacity']:[]),
        ...(signals.governanceIssue?['بازبینی چرخه پایش، پیگیری و پاسخ به هشدارها']:[]),
        ...(signals.evidenceInsufficient?['تکمیل شواهد Outcome پیش از انتساب علت']:[])
      ]
    };
    await this.repo.mutate(db=>{
      db.failureDiagnoses=db.failureDiagnoses||[]; db.failureDiagnoses.push({...diagnosis,organizationId:actor.organizationId,createdBy:actor.personId,createdAt:new Date().toISOString()});
      db.auditLog=db.auditLog||[]; db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'failure.diagnosis.prepared',targetRef:monitoring.executionPlanRef,classification,at:new Date().toISOString()});
    });
    return {
      status:'live',diagnosis,
      governance:{causalClaimConfirmed:false,humanValidationRequired:true,principle:'Diagnosis ≠ causal proof.'},
      fabricated:false
    };
  }

  async buildOutcomeCausalLearning(actor,input={}){
    const decisionRef=input.decisionRef||input.monitoring?.decisionRef||null;
    const executionPlanRef=input.executionPlanRef||input.monitoring?.executionPlanRef||null;
    if(!decisionRef&&!executionPlanRef)return {status:'blocked',reason:'DECISION_OR_EXECUTION_CONTEXT_REQUIRED',learning:null,fabricated:false};
    const o=input.outcome||{};
    const num=x=>Number.isFinite(Number(x))?Number(x):null;
    const baseline=num(o.baseline),expected=num(o.expected),observed=num(o.observed),counterfactual=num(o.counterfactual);
    const evidenceRefs=Array.isArray(o.evidenceRefs)?o.evidenceRefs:[];
    const outcomeType=['output','outcome','impact'].includes(o.type)?o.type:'outcome';
    const deltaFromBaseline=baseline!==null&&observed!==null?observed-baseline:null;
    const expectedGap=expected!==null&&observed!==null?observed-expected:null;
    const counterfactualDifference=counterfactual!==null&&observed!==null?observed-counterfactual:null;
    const confounders=Array.isArray(input.externalFactors)?input.externalFactors:[];
    const concurrent=Array.isArray(input.concurrentInterventions)?input.concurrentInterventions:[];
    const attributionEligible=observed!==null&&counterfactual!==null&&evidenceRefs.length>0&&!confounders.length&&!concurrent.length;
    const contributionEvidence=[
      ...(Array.isArray(input.contributionEvidence)?input.contributionEvidence:[]),
      ...evidenceRefs
    ];
    const contributionStatus=contributionEvidence.length?'supported_candidate':'insufficient_evidence';
    const learningClaims=[];
    if(deltaFromBaseline!==null)learningClaims.push({type:'change',claim:`تغییر مشاهده‌شده نسبت به خط پایه: ${deltaFromBaseline}`,status:'observed_difference',confidence:evidenceRefs.length?'medium':'low'});
    if(counterfactualDifference!==null)learningClaims.push({type:'counterfactual_difference',claim:`تفاوت مشاهده‌شده با ضدواقع: ${counterfactualDifference}`,status:'analytical_candidate',confidence:attributionEligible?'medium':'low'});
    if(contributionEvidence.length)learningClaims.push({type:'contribution',claim:'برای سهم مداخله در نتیجه، شواهد قابل بررسی ثبت شده است.',status:'learning_candidate',confidence:'medium'});
    const learning={
      decisionRef,executionPlanRef,
      resultModel:{
        type:outcomeType,
        baseline,expected,observed,counterfactual,
        deltaFromBaseline,expectedGap,counterfactualDifference,
        evidenceRefs
      },
      causalAssessment:{
        attribution:{
          status:attributionEligible?'eligible_for_human_validation':'not_established',
          confirmed:false,
          blockers:[
            ...(counterfactual===null?['ضدواقع ثبت نشده است.']:[]),
            ...(!evidenceRefs.length?['شواهد Outcome کافی نیست.']:[]),
            ...(confounders.length?['عوامل بیرونی هم‌زمان وجود دارند.']:[]),
            ...(concurrent.length?['مداخلات هم‌زمان وجود دارند.']:[])
          ]
        },
        contribution:{status:contributionStatus,evidenceCount:contributionEvidence.length},
        externalFactors:confounders,
        concurrentInterventions:concurrent
      },
      learningClaims,
      memoryCandidate:{
        status:'candidate',
        canonical:false,
        requiresHumanValidation:true,
        reusableAfterValidation:true
      }
    };
    await this.repo.mutate(db=>{
      db.outcomeLearning=db.outcomeLearning||[]; db.outcomeLearning.push({...learning,organizationId:actor.organizationId,createdBy:actor.personId,createdAt:new Date().toISOString()});
      db.auditLog=db.auditLog||[]; db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'outcome.learning.prepared',targetRef:executionPlanRef||decisionRef,at:new Date().toISOString()});
    });
    return {
      status:'live',learning,
      governance:{
        attributionConfirmed:false,
        learningCanonical:false,
        humanValidationRequired:true,
        principle:'Observed change ≠ attribution; contribution ≠ sole causation; learning candidate ≠ organizational memory.'
      },
      fabricated:false
    };
  }

  async updateAnchorRealization(actor,input={}){
    const anchor=input.anchor||null, learning=input.learning||null;
    if(!anchor||!anchor.id)return {status:'blocked',reason:'ANCHOR_REQUIRED',realization:null,fabricated:false};
    if(anchor.organizationId&&anchor.organizationId!==actor.organizationId)return {status:'blocked',reason:'ANCHOR_ACCESS_DENIED',realization:null,fabricated:false};
    const num=x=>Number.isFinite(Number(x))?Number(x):null;
    const baseline=num(anchor.baseline),target=num(anchor.target);
    const current=num(input.current??learning?.resultModel?.observed);
    const previous=num(input.previous??learning?.resultModel?.baseline);
    if(target===null||current===null)return {status:'insufficient_evidence',reason:'TARGET_AND_CURRENT_REQUIRED',realization:null,fabricated:false};
    const span=target-baseline;
    const remainingGap=target-current;
    const realizationRatio=span!==0&&baseline!==null?(current-baseline)/span:null;
    const periodDays=Number(input.periodDays)>0?Number(input.periodDays):null;
    const velocity=periodDays&&previous!==null?(current-previous)/periodDays:null;
    const requiredVelocity=periodDays&&previous!==null?(target-previous)/periodDays:null;
    const daysToTarget=velocity&&velocity>0&&remainingGap>0?Math.ceil(remainingGap/velocity):remainingGap<=0?0:null;
    let realizationStatus='partially_achieved';
    if(realizationRatio!==null&&realizationRatio<=0)realizationStatus='not_achieved';
    if(remainingGap<=0)realizationStatus=input.sustainable===true?'sustainably_achieved':input.fragile===true?'achieved_but_fragile':'achieved_temporarily';
    const evidenceRefs=[
      ...(Array.isArray(input.evidenceRefs)?input.evidenceRefs:[]),
      ...(Array.isArray(learning?.resultModel?.evidenceRefs)?learning.resultModel.evidenceRefs:[])
    ];
    const confidence=evidenceRefs.length>=3?'high':evidenceRefs.length?'medium':'low';
    const realization={
      anchorRef:anchor.id,title:anchor.title||anchor.id,type:anchor.type||'anchor',
      baseline,target,previous,current,remainingGap,
      realizationRatio:realizationRatio===null?null:Math.round(realizationRatio*1000)/1000,
      realizationPercent:realizationRatio===null?null:Math.round(realizationRatio*100),
      velocity,requiredVelocity,
      forecastedDaysToTarget:daysToTarget,
      status:realizationStatus,
      confidence,
      evidenceRefs:[...new Set(evidenceRefs)],
      contribution:{
        observedImprovement:previous!==null?current-previous:null,
        attributedOrganizationalContribution:null,
        status:'not_attributed'
      },
      health:{
        onRequiredVelocity:velocity!==null&&requiredVelocity!==null?velocity>=requiredVelocity:null,
        fragile:input.fragile===true,
        sustainable:input.sustainable===true
      }
    };
    await this.repo.mutate(db=>{
      db.anchorRealization=db.anchorRealization||[]; db.anchorRealization.push({...realization,organizationId:actor.organizationId,updatedBy:actor.personId,updatedAt:new Date().toISOString()});
      db.auditLog=db.auditLog||[]; db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'anchor.realization.updated',targetRef:anchor.id,status:realizationStatus,confidence,at:new Date().toISOString()});
    });
    return {
      status:'live',realization,
      governance:{
        observedImprovementIsNotAttributedContribution:true,
        anchorRevisionAutomatic:false,
        humanReviewRequired:confidence==='low'||realizationStatus==='achieved_but_fragile',
        principle:'Anchor realization update changes the reality view; it does not silently rewrite the anchor or claim causation.'
      },
      fabricated:false
    };
  }

  async validateLearningMemory(actor,input={}){
    const candidate=input.candidate||null, validation=input.validation||{};
    if(!candidate||candidate.status!=='candidate')return {status:'blocked',reason:'LEARNING_CANDIDATE_REQUIRED',memory:null,fabricated:false};
    const evidenceRefs=Array.isArray(input.evidenceRefs)?input.evidenceRefs:[];
    const contexts=Array.isArray(input.contexts)?input.contexts.filter(Boolean):[];
    const conditions=Array.isArray(input.conditions)?input.conditions.filter(Boolean):[];
    const blockers=[];
    if(validation.humanValidated!==true)blockers.push('اعتبارسنجی صریح انسانی ثبت نشده است.');
    if(!String(validation.validatorRole||'').trim())blockers.push('نقش اعتبارسنج ثبت نشده است.');
    if(!evidenceRefs.length)blockers.push('حداقل یک شاهد برای یادگیری الزامی است.');
    if(!contexts.length)blockers.push('بافت کاربرد یادگیری مشخص نشده است.');
    if(!conditions.length)blockers.push('شرایط اعتبار/کاربرد یادگیری مشخص نشده است.');
    if(blockers.length)return {status:'blocked',blockers,memory:null,fabricated:false};

    const confidence=['low','medium','high'].includes(input.confidence)?input.confidence:'medium';
    const validFrom=input.validFrom||new Date().toISOString();
    const validUntil=input.validUntil||null;
    const memory={
      id:`MEM:${Date.now()}`,
      organizationId:actor.organizationId,
      title:String(input.title||'یادگیری سازمانی اعتبارسنجی‌شده').trim(),
      claim:String(input.claim||candidate.claim||'').trim(),
      sourceCandidateRef:candidate.id||null,
      evidenceRefs:[...new Set(evidenceRefs)],
      confidence,
      contexts,
      conditions,
      exceptions:Array.isArray(input.exceptions)?input.exceptions:[],
      validFrom,validUntil,
      reviewAt:input.reviewAt||null,
      validator:{personRef:actor.personId,role:validation.validatorRole},
      status:'validated',
      canonical:true,
      reusable:true,
      createdAt:new Date().toISOString()
    };
    if(!memory.claim)return {status:'blocked',blockers:['متن Learning Claim ثبت نشده است.'],memory:null,fabricated:false};

    await this.repo.mutate(db=>{
      db.organizationalMemory=db.organizationalMemory||[]; db.organizationalMemory.push(memory);
      db.auditLog=db.auditLog||[]; db.auditLog.push({
        id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,
        action:'learning.memory.validated',targetRef:memory.id,confidence,at:memory.createdAt
      });
    });
    return {
      status:'validated',memory,
      reusePolicy:{
        automaticTruth:false,
        contextMatchRequired:true,
        validityCheckRequired:true,
        evidenceTraceRequired:true,
        reviewWhenConditionsChange:true
      },
      governance:{
        humanValidated:true,
        memoryCanonical:true,
        principle:'Validated memory is reusable evidence for future cognition; it is not universal truth outside its context and validity conditions.'
      },
      fabricated:false
    };
  }

  async retrieveCognitiveMemory(actor,input={}){
    const query=String(input.query||'').trim();
    const currentContexts=Array.isArray(input.contexts)?input.contexts.filter(Boolean):[];
    const currentConditions=Array.isArray(input.conditions)?input.conditions.filter(Boolean):[];
    if(!query&&!currentContexts.length)return {status:'blocked',reason:'QUERY_OR_CONTEXT_REQUIRED',retrieval:null,fabricated:false};
    const db=await this.repo.all();
    const now=input.now?new Date(input.now):new Date();
    const memoryStore=(db.organizationalMemory||this.repo.db?.organizationalMemory||this.repo.state?.organizationalMemory||[]);
    const memories=memoryStore.filter(m=>m.organizationId===actor.organizationId&&m.canonical===true&&m.status==='validated');
    const norm=x=>String(x||'').toLocaleLowerCase('fa-IR');
    const qTokens=[...new Set(norm(query).split(/\s+/).filter(x=>x.length>2))];
    const results=memories.map(m=>{
      const hay=norm([m.title,m.claim,...(m.contexts||[]),...(m.conditions||[])].join(' '));
      const lexical=qTokens.length?qTokens.filter(t=>hay.includes(t)).length/qTokens.length:0;
      const ctx=currentContexts.length?currentContexts.filter(c=>(m.contexts||[]).some(mc=>norm(mc)===norm(c))).length/currentContexts.length:0;
      const cond=currentConditions.length?currentConditions.filter(c=>(m.conditions||[]).some(mc=>norm(mc)===norm(c))).length/currentConditions.length:null;
      const from=m.validFrom?new Date(m.validFrom):null, until=m.validUntil?new Date(m.validUntil):null;
      const valid=(!from||now>=from)&&(!until||now<=until);
      const confidenceWeight=m.confidence==='high'?1:m.confidence==='medium'?.75:.5;
      const score=Math.round(((lexical*.35)+(ctx*.35)+((cond??.5)*.15)+(valid?.1:0)+(confidenceWeight*.05))*100);
      const reasons=[];
      if(lexical>0)reasons.push('همپوشانی معنایی/واژگانی با پرسش فعلی');
      if(ctx>0)reasons.push('تطابق بافت سازمانی');
      if(cond!==null&&cond>0)reasons.push('تطابق شرایط کاربرد');
      if(valid)reasons.push('در بازه اعتبار');
      if(!valid)reasons.push('خارج از بازه اعتبار');
      const reuse=valid&&ctx>0&&score>=55?'eligible_for_consideration':'context_review_required';
      return {
        memoryRef:m.id,title:m.title,claim:m.claim,score,
        match:{lexical:Math.round(lexical*100),context:Math.round(ctx*100),conditions:cond===null?null:Math.round(cond*100),valid},
        confidence:m.confidence,evidenceRefs:m.evidenceRefs||[],reasons,reuse,
        canonicalSource:true,automaticApplication:false
      };
    }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).slice(0,Number(input.limit)||5);
    return {
      status:'live',
      retrieval:{query,contexts:currentContexts,conditions:currentConditions,results},
      governance:{
        automaticApplication:false,
        memoryIsEvidenceNotAuthority:true,
        humanJudgmentRequired:true,
        principle:'Retrieved memory may inform current cognition only after context, validity, evidence, and applicability are re-checked.'
      },
      fabricated:false
    };
  }

  async reassessCognition(actor,input={}){
    const prior=Array.isArray(input.priorClaims)?input.priorClaims:[];
    const signals=Array.isArray(input.newEvidence)?input.newEvidence:[];
    const memories=Array.isArray(input.retrievedMemories)?input.retrievedMemories:[];
    const anchor=input.anchorRealization||null;
    if(!prior.length)return {status:'blocked',reason:'PRIOR_COGNITION_REQUIRED',reassessment:null,fabricated:false};

    const norm=x=>String(x||'').toLocaleLowerCase('fa-IR');
    const claims=prior.map(c=>{
      const relevant=signals.filter(e=>{
        const refs=Array.isArray(e.claimRefs)?e.claimRefs:[];
        return refs.includes(c.id)||norm(e.text).includes(norm(c.key||c.title||'__nomatch__'));
      });
      const supporting=relevant.filter(e=>e.effect==='support');
      const challenging=relevant.filter(e=>e.effect==='challenge'||e.effect==='contradict');
      const memorySupport=memories.filter(m=>m.reuse==='eligible_for_consideration' && (m.claimRefs||[]).includes(c.id));
      let status='still_valid';
      if(challenging.length&&supporting.length)status='contested';
      else if(challenging.length)status='review_required';
      else if(!relevant.length&&c.reviewAt&&new Date(input.now||Date.now())>=new Date(c.reviewAt))status='review_due';
      const confidenceDelta=Math.min(20,supporting.length*5+memorySupport.length*3)-Math.min(30,challenging.length*10);
      return {
        claimRef:c.id,title:c.title||c.claim||c.id,priorStatus:c.status||'valid',
        status,confidenceBefore:c.confidence||'unknown',confidenceDelta,
        evidence:{supporting:supporting.map(x=>x.id||x.text),challenging:challenging.map(x=>x.id||x.text),memorySupport:memorySupport.map(x=>x.memoryRef)},
        automaticCanonicalChange:false
      };
    });
    const changed=claims.filter(x=>x.status!=='still_valid');
    const realitySignals=[];
    if(anchor){
      if(anchor.status)realitySignals.push(`Anchor status: ${anchor.status}`);
      if(anchor.remainingGap!==undefined)realitySignals.push(`Remaining gap: ${anchor.remainingGap}`);
      if(anchor.health?.fragile)realitySignals.push('Anchor realization is fragile');
      if(anchor.health?.onRequiredVelocity===false)realitySignals.push('Realization velocity is below required velocity');
    }
    const reassessment={
      claims,
      changedCount:changed.length,
      stableCount:claims.length-changed.length,
      realitySignals,
      cognitiveUpdateCandidates:changed.map(x=>({
        claimRef:x.claimRef,
        proposedAction:x.status==='review_required'||x.status==='contested'?'revalidate_claim':'schedule_review',
        canonical:false,
        requiresHumanReview:true
      })),
      closedLoop:{
        inputs:['New Evidence','Anchor Reality','Execution/Outcome Learning','Validated Memory'],
        output:'Reassessed Cognition',
        canonicalChangesApplied:0
      }
    };
    await this.repo.mutate(db=>{
      db.cognitiveReassessments=db.cognitiveReassessments||[]; db.cognitiveReassessments.push({...reassessment,organizationId:actor.organizationId,createdBy:actor.personId,createdAt:new Date().toISOString()});
      db.auditLog=db.auditLog||[]; db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'cognition.reassessment.prepared',changedCount:changed.length,at:new Date().toISOString()});
    });
    return {
      status:'live',reassessment,
      governance:{
        canonicalCognitionChanged:false,
        humanReviewRequired:changed.length>0,
        principle:'Reassessment may challenge prior cognition; it does not silently rewrite validated organizational knowledge.'
      },
      fabricated:false
    };
  }

  async evaluateCognitiveWarning(actor,input={}){
    const warning=input.warning||null, observed=input.observed||{};
    if(!warning||!warning.id)return {status:'blocked',reason:'WARNING_REQUIRED',evaluation:null,fabricated:false};
    if(warning.organizationId&&warning.organizationId!==actor.organizationId)return {status:'blocked',reason:'WARNING_ACCESS_DENIED',evaluation:null,fabricated:false};
    const response=input.response||{};
    const evidenceRefs=[...(Array.isArray(warning.evidenceRefs)?warning.evidenceRefs:[]),...(Array.isArray(observed.evidenceRefs)?observed.evidenceRefs:[])];
    const eventOccurred=observed.eventOccurred===true, eventDidNotOccur=observed.eventOccurred===false;
    const mitigated=response.actionTaken===true&&observed.mitigationEffective===true;
    let validity='unresolved';
    if(eventOccurred)validity='validated_signal';
    else if(eventDidNotOccur&&mitigated)validity='possibly_prevented';
    else if(eventDidNotOccur&&observed.observationWindowComplete===true)validity='not_observed_in_window';
    const ignored=response.acknowledged===false||response.ignored===true;
    const timely=response.respondedAt&&warning.createdAt?new Date(response.respondedAt)<=new Date(warning.responseDueAt||warning.createdAt):null;
    const ignoredReason=ignored?String(response.ignoredReason||'unspecified'):null;
    const learningCandidates=[];
    if(ignored&&eventOccurred)learningCandidates.push({type:'ignored_warning_learning',claim:'هشدار نادیده‌گرفته شد و رخداد مورد هشدار در بازه مشاهده شد.',canonical:false});
    if(mitigated)learningCandidates.push({type:'response_effectiveness_learning',claim:'پس از اقدام پاسخ، رخداد مورد هشدار مشاهده نشد یا شدت آن کاهش یافت؛ رابطه علّی نیازمند اعتبارسنجی است.',canonical:false});
    if(validity==='not_observed_in_window')learningCandidates.push({type:'warning_calibration',claim:'سیگنال در پنجره مشاهده به رخداد تبدیل نشد؛ آستانه یا افق هشدار نیازمند بازبینی است.',canonical:false});
    const evaluation={
      warningRef:warning.id,type:warning.type||'cognitive_warning',severity:warning.severity||'unknown',
      validity,response:{acknowledged:response.acknowledged??null,ignored,timely,ignoredReason,actionTaken:response.actionTaken===true},
      observed:{eventOccurred:observed.eventOccurred??null,mitigationEffective:observed.mitigationEffective??null,observationWindowComplete:observed.observationWindowComplete===true},
      evidenceRefs:[...new Set(evidenceRefs)],
      learningCandidates,
      calibration:{
        strengthenFutureAttention:ignored&&eventOccurred,
        reviewThreshold:validity==='not_observed_in_window',
        autoChangeThreshold:false
      }
    };
    await this.repo.mutate(db=>{
      db.warningEvaluations=db.warningEvaluations||[];db.warningEvaluations.push({...evaluation,organizationId:actor.organizationId,evaluatedAt:new Date().toISOString()});
      db.auditLog=db.auditLog||[];db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'warning.evaluation.prepared',targetRef:warning.id,validity,at:new Date().toISOString()});
    });
    return {status:'live',evaluation,governance:{warningTruthAutomatic:false,causalPreventionClaimed:false,thresholdAutoChanged:false,humanCalibrationRequired:true,principle:'Warning evaluation learns from outcomes and organizational response without equating non-occurrence with false alarm or mitigation with proven causation.'},fabricated:false};
  }

  async buildCognitiveAttention(actor,input={}){
    const warningEvaluations=Array.isArray(input.warningEvaluations)?input.warningEvaluations:[];
    const reassessments=Array.isArray(input.reassessments)?input.reassessments:[];
    const anchorRealizations=Array.isArray(input.anchorRealizations)?input.anchorRealizations:[];
    const decisionItems=Array.isArray(input.decisionItems)?input.decisionItems:[];
    if(!warningEvaluations.length&&!reassessments.length&&!anchorRealizations.length&&!decisionItems.length)
      return {status:'blocked',reason:'COGNITIVE_SIGNALS_REQUIRED',attention:null,fabricated:false};

    const items=[];
    for(const w of warningEvaluations){
      const sev={critical:100,high:80,medium:55,low:30}[w.severity]||45;
      const boost=w.calibration?.strengthenFutureAttention?15:0;
      const ignored=w.response?.ignored?10:0;
      items.push({ref:w.warningRef||w.id,type:'warning',title:w.title||'هشدار شناختی',score:Math.min(100,sev+boost+ignored),reason:[
        w.response?.ignored?'هشدار نادیده گرفته شده است':null,
        w.calibration?.strengthenFutureAttention?'نیازمند تقویت توجه آینده':null,
        `اعتبار فعلی: ${w.validity||'unresolved'}`
      ].filter(Boolean),source:'warning_evaluation',requiresHumanAttention:true});
    }
    for(const r of reassessments){
      const changed=Number(r.changedCount||0);
      if(changed>0)items.push({ref:r.id||`REASSESS:${items.length+1}`,type:'cognition_review',title:'بازبینی شناخت سازمان',score:Math.min(95,55+changed*8),reason:[`${changed} گزاره نیازمند بازبینی است`],source:'cognitive_reassessment',requiresHumanAttention:true});
    }
    for(const a of anchorRealizations){
      let score=40;
      const reason=[];
      if(a.health?.fragile){score+=25;reason.push('تحقق Anchor شکننده است');}
      if(a.health?.onRequiredVelocity===false){score+=25;reason.push('سرعت تحقق کمتر از سرعت موردنیاز است');}
      if(a.remainingGap>0){score+=Math.min(10,Math.round(Number(a.remainingGap)||0));reason.push(`شکاف باقی‌مانده: ${a.remainingGap}`);}
      if(reason.length)items.push({ref:a.anchorRef||a.id,type:'anchor_attention',title:a.title||'Anchor نیازمند توجه',score:Math.min(100,score),reason,source:'anchor_realization',requiresHumanAttention:true});
    }
    for(const d of decisionItems){
      const score=Math.min(100,Number(d.priorityScore||60));
      items.push({ref:d.id||`DECATT:${items.length+1}`,type:'decision',title:d.title||'موضوع تصمیم',score,reason:Array.isArray(d.reasons)?d.reasons:['موضوع آماده توجه مدیریتی است'],source:'decision_item',requiresHumanAttention:true});
    }
    items.sort((x,y)=>y.score-x.score);
    const queue=items.map((x,i)=>({...x,rank:i+1,focusWindow:i<3?'now':i<7?'next':'watch'}));
    const attention={
      generatedAt:new Date().toISOString(),
      queue,
      now:queue.filter(x=>x.focusWindow==='now'),
      next:queue.filter(x=>x.focusWindow==='next'),
      watch:queue.filter(x=>x.focusWindow==='watch'),
      sequencingPrinciple:'Severity × strategic relevance × unresolved risk × timing × ignored-signal learning'
    };
    await this.repo.mutate(db=>{
      db.cognitiveAttentionQueues=db.cognitiveAttentionQueues||[];
      db.cognitiveAttentionQueues.push({...attention,organizationId:actor.organizationId,createdBy:actor.personId});
      db.auditLog=db.auditLog||[];
      db.auditLog.push({id:`AUD:${Date.now()}`,organizationId:actor.organizationId,actorRef:actor.personId,action:'cognitive.attention.prepared',itemCount:queue.length,at:new Date().toISOString()});
    });
    return {status:'live',attention,governance:{
      attentionIsRecommendationNotCommand:true,
      noPersonnelRanking:true,
      humanPrioritizationRequired:true,
      principle:'The attention queue prioritizes organizational issues and signals, not people; it recommends focus without creating authority.'
    },fabricated:false};
  }

  async getSandboxDemoState(actor){
    return {
      status:'live',
      build:'0.7.0',
      mode:'functional_sandbox',
      organizationId:actor.organizationId,
      scenarios:[
        {id:'knowledge-to-decision',title:'دانش → مسئله → تصمیم',ready:true},
        {id:'decision-to-execution',title:'تصمیم → برنامه اجرا → پایش',ready:true},
        {id:'outcome-learning',title:'نتیجه → یادگیری → حافظه',ready:true},
        {id:'reassessment-warning',title:'بازارزیابی → هشدار → توجه',ready:true}
      ],
      governance:{
        demoDataOnly:true,
        confidentialUploadRecommended:false,
        persistentProductionStorage:false,
        principle:'Functional Sandbox is for hands-on verification, not production use.'
      },
      fabricated:false
    };
  }

  async buildManagementAgenda(actor,input={}){
    const queue=Array.isArray(input.attention?.queue)?input.attention.queue:[];
    if(!queue.length)return {status:'blocked',reason:'ATTENTION_QUEUE_REQUIRED',agenda:null,fabricated:false};
    const capacity=Math.max(1,Math.min(12,Number(input.maxAgendaItems||6)));
    const selected=[...queue.filter(x=>x.focusWindow==='now'),...queue.filter(x=>x.focusWindow==='next')].slice(0,capacity);
    const agendaItems=selected.map((x,i)=>{const mode=x.type==='decision'||x.type==='anchor_attention'?'decision':x.type==='cognition_review'?'review':'attention';return {id:`AGENDA:${i+1}`,sourceRef:x.ref,title:x.title,rank:x.rank,score:x.score,mode,purpose:mode==='decision'?'آماده‌سازی برای قضاوت/تصمیم انسانی':mode==='review'?'بازبینی شناخت و شواهد':'توجه مدیریتی و تعیین اقدام بعدی',evidenceRequired:true,decisionAuthorityRequired:mode==='decision',suggestedMinutes:mode==='decision'?20:mode==='review'?15:10,reasons:x.reason||[],status:'proposed'};});
    const agenda={title:input.meeting?.title||'دستورکار شناختی پیشنهادی',meetingRef:input.meeting?.id||null,agendaItems,deferred:queue.filter(x=>!selected.includes(x)).map(x=>({ref:x.ref,title:x.title,focusWindow:x.focusWindow})),totalSuggestedMinutes:agendaItems.reduce((n,x)=>n+x.suggestedMinutes,0),focusSummary:{decision:agendaItems.filter(x=>x.mode==='decision').length,review:agendaItems.filter(x=>x.mode==='review').length,attention:agendaItems.filter(x=>x.mode==='attention').length},status:'proposed_for_human_review',canonical:false};
    await this.repo.mutate(db=>{db.managementAgendas=db.managementAgendas||[];db.managementAgendas.push({...agenda,organizationId:actor.organizationId,createdBy:actor.personId,createdAt:new Date().toISOString()});});
    return {status:'live',agenda,governance:{agendaIsProposal:true,meetingNotAutomaticallyCreated:true,decisionNotAutomaticallyMade:true,humanAgendaApprovalRequired:true,principle:'Attention may shape a proposed management agenda, but agenda placement does not create decision authority or organizational commitment.'},fabricated:false};
  }

  async assessAgendaReadiness(actor,input={}){
    const agenda=input.agenda||null, items=Array.isArray(agenda?.agendaItems)?agenda.agendaItems:[];
    if(!items.length)return {status:'blocked',reason:'PROPOSED_AGENDA_REQUIRED',readiness:null,fabricated:false};
    const evidenceMap=input.evidenceByItem||{}, ownerMap=input.ownerByItem||{}, briefMap=input.briefByItem||{};
    const assessed=items.map(x=>{
      const ev=Array.isArray(evidenceMap[x.id])?evidenceMap[x.id]:[];
      const owner=ownerMap[x.id]||null, brief=briefMap[x.id]||null;
      const checks={evidence:ev.length>0,owner:Boolean(owner),brief:Boolean(brief),authority:x.mode!=='decision'||Boolean(input.authorityRef)};
      const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
      const score=Math.round(Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100);
      return {...x,readinessScore:score,readiness:score===100?'ready':score>=50?'needs_completion':'not_ready',missing,evidenceRefs:ev,ownerRef:owner,briefRef:brief};
    });
    const ready=assessed.filter(x=>x.readiness==='ready'), incomplete=assessed.filter(x=>x.readiness!=='ready');
    const orchestration={
      agendaRef:agenda.id||agenda.meetingRef||null,items:assessed,
      readyCount:ready.length,incompleteCount:incomplete.length,
      meetingReady:incomplete.length===0,
      preMeetingActions:incomplete.flatMap(x=>x.missing.map(m=>({agendaItemRef:x.id,action:`complete_${m}`,ownerRef:x.ownerRef||null}))),
      status:incomplete.length?'preparation_required':'ready_for_human_convening'
    };
    await this.repo.mutate(db=>{db.agendaReadiness=db.agendaReadiness||[];db.agendaReadiness.push({...orchestration,organizationId:actor.organizationId,createdAt:new Date().toISOString()});});
    return {status:'live',readiness:orchestration,governance:{meetingAutomaticallyConvened:false,missingEvidenceCannotBeFabricated:true,humanConveningRequired:true,principle:'Agenda readiness verifies preparation for a meeting; readiness does not convene the meeting or grant decision authority.'},fabricated:false};
  }

  async orchestrateMeeting(actor,input={}){
    const readiness=input.readiness||null, items=Array.isArray(readiness?.items)?readiness.items:[];
    if(!items.length)return {status:'blocked',reason:'AGENDA_READINESS_REQUIRED',orchestration:null,fabricated:false};
    const ready=items.filter(x=>x.readiness==='ready');
    if(!ready.length)return {status:'blocked',reason:'NO_READY_AGENDA_ITEMS',orchestration:{blockedItems:items.map(x=>({id:x.id,title:x.title,missing:x.missing||[]}))},fabricated:false};
    const meeting=input.meeting||{};
    const participants=Array.isArray(input.participants)?input.participants:[];
    const packs=ready.map((x,i)=>({
      agendaItemRef:x.id,title:x.title,sequence:i+1,mode:x.mode,
      decisionBrief:{briefRef:x.briefRef||null,evidenceRefs:x.evidenceRefs||[],problemRef:x.problemRef||null,anchorRefs:x.anchorRefs||[],options:x.options||[],uncertainties:x.uncertainties||[],risks:x.risks||[]},
      facilitation:{purpose:x.purpose||'',suggestedMinutes:x.suggestedMinutes||10,challengeRequired:x.mode==='decision'||x.mode==='review',decisionCaptureRequired:x.mode==='decision'},
      authorityCheck:{required:x.mode==='decision',authorityRef:x.mode==='decision'?(input.authorityRef||null):null,passed:x.mode!=='decision'||Boolean(input.authorityRef)}
    }));
    const authorityBlocked=packs.filter(x=>!x.authorityCheck.passed);
    const orchestration={
      meetingRef:meeting.id||null,title:meeting.title||'جلسه شناختی سازمان',scheduledAt:meeting.scheduledAt||null,
      participants:participants.map(p=>({personRef:p.personRef||p.id,role:p.role||'participant'})),
      agendaPacks:packs,
      authorityBlocked:authorityBlocked.map(x=>x.agendaItemRef),
      runOfShow:packs.map(x=>({sequence:x.sequence,agendaItemRef:x.agendaItemRef,title:x.title,minutes:x.facilitation.suggestedMinutes,mode:x.mode})),
      totalSuggestedMinutes:packs.reduce((n,x)=>n+x.facilitation.suggestedMinutes,0),
      status:authorityBlocked.length?'ready_with_authority_blocks':'ready_for_human_convening',
      canonical:false
    };
    await this.repo.mutate(db=>{db.meetingOrchestrations=db.meetingOrchestrations||[];db.meetingOrchestrations.push({...orchestration,organizationId:actor.organizationId,createdBy:actor.personId,createdAt:new Date().toISOString()});});
    return {status:'live',orchestration,governance:{meetingAutomaticallyConvened:false,briefIsPreparationNotDecision:true,authorityStillRequired:true,humanFacilitationRequired:true,principle:'Meeting orchestration connects validated readiness to decision preparation; it does not convert a brief, agenda, or AI recommendation into a decision.'},fabricated:false};
  }

  async executeCommand(actor,input){
    const text=String(input.text||'').trim();
    assert(text,'COMMAND_TEXT_REQUIRED','فرمان متنی یا صوتی الزامی است.');
    const sessionId=String(input.sessionId||newId('SESSION'));
    const previous=await this.conversationState(actor,sessionId);
    const context=previous?.context||{};
    const normalized=text.replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/‌/g,' ').toLowerCase();
    const has=(...terms)=>terms.some(t=>normalized.includes(t));
    let intent='unknown', capability='unknown', status='needs_clarification', title='فرمان نیاز به توضیح بیشتری دارد', items=[], nextAction=null, contextPatch={}, workspace=null;
    const db=await this.repo.all();
    const orgDocs=db.documents.filter(x=>x.organizationId===actor.organizationId);

    // Contextual follow-ups are resolved before generic intents.
    if(has('دومی','دوم') && context.resultRefs?.length>=2){
      const ref=context.resultRefs[1]; const doc=orgDocs.find(x=>x.id===ref);
      intent='context.select'; capability='conversation_context'; status='live'; title='مورد دوم انتخاب شد';
      items=doc?[{title:doc.title,subtitle:doc.id,meta:`نسخه ${doc.version}`}]:[{title:'مورد انتخاب‌شده دیگر در دسترس نیست',subtitle:ref,meta:'stale context'}];
      contextPatch={selectedRef:ref,selectedType:'document'}; nextAction={type:'open_view',view:'knowledge',documentId:doc?.id||null};
    } else if(has('اولی','اول') && context.resultRefs?.length){
      const ref=context.resultRefs[0]; const doc=orgDocs.find(x=>x.id===ref);
      intent='context.select'; capability='conversation_context'; status='live'; title='مورد اول انتخاب شد';
      items=doc?[{title:doc.title,subtitle:doc.id,meta:`نسخه ${doc.version}`}]:[]; contextPatch={selectedRef:ref,selectedType:'document'};
    } else if(has('قبلی','نسخه قبلی','با قبلی') && has('مقایسه','تفاوت')){
      const selected=orgDocs.find(x=>x.id===context.selectedRef);
      intent='document.compare_previous'; capability='knowledge_comparison';
      if(!selected){status='needs_clarification';title='ابتدا یک سند را انتخاب کنید';items=[{title:'مرجع مکالمه مشخص نیست',subtitle:'مثلاً بگویید «فایل‌های تکراری را بیاور» و سپس «دومی را باز کن».',meta:'context required'}];}
      else{
        const sameTitle=orgDocs.filter(x=>x.id!==selected.id&&(x.title===selected.title||x.exactDuplicateOf===selected.id||selected.exactDuplicateOf===x.id));
        const prior=sameTitle.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
        status=prior?'live':'needs_clarification'; title=prior?'مقایسه با نسخه/سند مرتبط قبلی':'نسخه قبلی قابل اتکا پیدا نشد';
        items=prior?[{title:selected.title,subtitle:`${selected.id} ↔ ${prior.id}`,meta:'Comparison context prepared'}]:[{title:'سامانه رابطه نسخه‌ای قابل اتکا پیدا نکرد',subtitle:'Duplicate بودن به‌تنهایی به معنی نسخه قبلی نیست.',meta:'No fabricated version relation'}];
        if(prior)contextPatch={comparisonRefs:[selected.id,prior.id]};
      }
    } else if(has('فقط') && context.lastIntent==='knowledge.duplicates'){
      const inv=await this.knowledgeInventory(actor);
      const keyword=normalized.replace(/فقط|مربوط|به|رو|را|نشون بده|نشان بده/g,' ').trim();
      const refs=inv.duplicateGroups.flatMap(g=>g.documents).filter(id=>{const d=orgDocs.find(x=>x.id===id);return d&&(!keyword||`${d.title} ${d.sourceFileName||''}`.toLowerCase().includes(keyword));});
      intent='knowledge.duplicates.filter'; capability='knowledge_onboarding'; status='live'; title=keyword?`فایل‌های تکراری مرتبط با «${keyword}»`:'پالایش فایل‌های تکراری';
      items=refs.map(id=>{const d=orgDocs.find(x=>x.id===id);return {title:d.title,subtitle:d.id,meta:'duplicate candidate'};});
      if(!items.length)items=[{title:'موردی با این پالایش پیدا نشد',subtitle:'Context قبلی حفظ شده است؛ می‌توانید عبارت دیگری بگویید.',meta:'0 result'}];
      contextPatch={resultRefs:refs,lastFilter:keyword};
    } else if(has('چند فایل','چندتا فایل','پوشه','گروهی','دسته ای','دسته‌ای') && has('تحلیل','وارد','بارگذاری','آپلود')){
      intent='knowledge.batch_intake';capability='knowledge_onboarding';status='live';title='ورود گروهی دانش';items=[{title:'چند فایل را هم‌زمان انتخاب کنید',subtitle:'حداکثر ۵۰ فایل در هر Batch',meta:'Queue + Duplicate Detection + Knowledge Inventory'}];nextAction={type:'open_view',view:'home',mode:'batch'};
    } else if(has('فایل های تکراری','فایل‌های تکراری','تکراری ها','تکراری‌ها','duplicate')){
      intent='knowledge.duplicates';capability='knowledge_onboarding';status='live';title='گروه‌های فایل تکراری';const inv=await this.knowledgeInventory(actor);
      const refs=inv.duplicateGroups.flatMap(g=>g.documents); items=inv.duplicateGroups.map((g,i)=>({title:`گروه تکراری ${i+1}`,subtitle:g.files.join('، '),meta:`${g.count} فایل`,refs:g.documents}));
      if(!items.length)items=[{title:'فایل تکراری دقیقی پیدا نشد',subtitle:'تشخیص بر پایه checksum فایل اصلی است.',meta:'0 گروه'}];nextAction={type:'open_view',view:'knowledge'}; contextPatch={resultRefs:refs};
    } else if(has('فهرست دانش','موجودی دانش','inventory','وضعیت دانش')){
      intent='knowledge.inventory';capability='knowledge_onboarding';status='live';title='موجودی دانش';const inv=await this.knowledgeInventory(actor);items=[{title:`${inv.summary.documents} سند`,subtitle:`${inv.summary.artifacts} فایل اصلی · ${inv.summary.reviewPending} مورد نیازمند بررسی`,meta:`${inv.summary.duplicateGroups} گروه تکراری`}];nextAction={type:'open_view',view:'knowledge'};
    } else if(has('صف پردازش','وضعیت پردازش','صف فایل')){
      intent='knowledge.processing_queue';capability='knowledge_onboarding';status='live';title='صف پردازش دانش';const inv=await this.knowledgeInventory(actor);items=inv.recentJobs.map(j=>({title:`Batch ${j.id}`,subtitle:`${j.completed}/${j.total} تکمیل · ${j.failed} خطا`,meta:j.status}));if(!items.length)items=[{title:'صف پردازشی ثبت نشده',subtitle:'با ورود گروهی فایل، Jobها اینجا ظاهر می‌شوند.',meta:'empty'}];nextAction={type:'open_view',view:'knowledge'};
    } else if(
      has('اولویت توجه','در اولویت توجه','نیازمند توجه مدیریت','توجه مدیریت','اولویت مدیریت','در دستور توجه','دستور توجه') ||
      ((has('ریسک','احتمال','اثر','تاثیر','تأثیر','عقب افتاده','عقب‌افتاده','تاخیر','تأخیر','کاهش عملکرد') && has('هدف','اهداف','تحقق','عملکرد','برنامه')) && has('مدیریت','اولویت','جلسه','توجه'))
    ){
      intent='workspace.cognitive_attention';capability='cognitive_prioritization';status='live';title='ارزیابی اولیه اولویت توجه مدیریت';
      const reasons=[
        'این موضوع مستقیماً به‌عنوان سیگنال نیازمند توجه مدیریتی مطرح شده است',
        has('هدف','اهداف','تحقق')?'اثر بالقوه بر تحقق اهداف/برنامه سازمان در متن گزارش شده است':null,
        has('عقب افتاده','عقب‌افتاده','تاخیر','تأخیر')?'انحراف زمانی یا تأخیر در متن گزارش شده است':null,
        has('کاهش عملکرد','عملکرد')?'سیگنال عملکردی در متن گزارش شده است':null
      ].filter(Boolean);
      const score=Math.min(95,60+(has('هدف','اهداف','تحقق')?12:0)+(has('عقب افتاده','عقب‌افتاده','تاخیر','تأخیر')?10:0)+(has('ریسک','احتمال')?8:0));
      const signalRef=newId('ATT-SIGNAL');
      const attentionResult=await this.buildCognitiveAttention(actor,{decisionItems:[{id:signalRef,title:text.length>120?text.slice(0,117)+'…':text,priorityScore:score,reasons}]});
      const a=attentionResult.attention;
      items=(a?.queue||[]).map(x=>({title:x.title,subtitle:(x.reason||[]).join(' · '),meta:`${x.focusWindow} · score ${x.score}`,ref:x.ref,reason:x.reason,confidence:null,score:x.score}));
      workspace={componentType:'cognitive_attention',layout:'comfortable',empty:!items.length,explainability:true,attention:a,governance:attentionResult.governance,signalAssessment:{source:'human_reported_command',validated:false,canonical:false,statement:text,principle:'User-reported signal is evidence for attention triage, not validated organizational fact.'}};
      contextPatch={resultRefs:items.map(x=>x.ref).filter(Boolean),attentionSignalRef:signalRef,attentionFromNaturalLanguage:true,attentionStatement:text};
      nextAction={type:'stay_inline'};
    } else if((has('پروژه','موضوع') && has('بررسی','وضعیت','نمای کلی','جمع بندی','جمع‌بندی'))){
      intent='workspace.cross_object';capability='cognitive_workspace';status='live';
      const cw=await this.crossObjectWorkspace(actor,text);title=`میز کار شناختی: ${cw.subject||'موضوع انتخاب‌شده'}`;
      items=cw.sections.flatMap(s=>s.items);workspace={componentType:'cross_object_workspace',layout:'composite',empty:cw.summary.total===0,explainability:true,subject:cw.subject,summary:cw.summary,sections:cw.sections};
      if(!items.length)items=[{title:'داده مرتبط قابل اتکایی پیدا نشد',subtitle:'سامانه برای تکمیل این Workspace داده ساختگی ایجاد نمی‌کند.',meta:'No fabricated organizational data'}];
      contextPatch={resultRefs:items.map(x=>x.ref).filter(Boolean),selectedSubject:cw.subject};
    } else if(has('سند','اسناد','دانش من','فایل های من','فایل‌ها')){
      intent='knowledge.list'; capability='knowledge'; status='live'; title='اسناد و دانش اخیر شما';const d=await this.dashboard(actor);items=d.recent.map(x=>({title:x.title,subtitle:`${x.id} · نسخه ${x.version}`,meta:x.status}));nextAction={type:'open_view',view:'knowledge'};contextPatch={resultRefs:d.recent.map(x=>x.id)};
    } else if(has('تحلیل','آنالیز','فایل را','فایل رو') && has('فایل','سند')){
      intent='document.analyze';capability='document_processing';status='live';title='فایل موردنظر را انتخاب کنید';items=[{title:'تحلیل فایل واقعی',subtitle:'DOCX / XLSX / PPTX / PDF / TXT',meta:'Original → Normalized → AI Candidate'}];nextAction={type:'open_view',view:'home'};
    } else if(has('ردیابی','منشا','منشأ','پراوننس','provenance')){
      intent='trace.last_document';capability='traceability';status='live';title='ردیابی آخرین سند';const d=await this.dashboard(actor);const last=d.recent[0];items=last?[{title:last.title,subtitle:last.id,meta:'Source → AI → Human Gate → Canonical'}]:[];nextAction={type:'open_view',view:'trace',documentId:last?.id||null};if(last)contextPatch={selectedRef:last.id,selectedType:'document',resultRefs:[last.id]};
    } else if(has('تبدیل تصمیم به اقدام','از تصمیم تا اقدام','اجرایی کردن تصمیم','برنامه اجرای تصمیم','تصمیم به اجرا')){
      intent='workspace.decision_to_action'; capability='decision_to_action'; status='live'; title='ترجمه تصمیم به اقدام';
      workspace={component:'decision_to_action',status:'requires_confirmed_decision',message:'ابتدا یک تصمیم Canonical و تأییدشده را انتخاب کنید.'};
      items=[];
    } else if(has('حین جلسه','جلسه زنده','هوشمندی جلسه','پایش جلسه','تحلیل جلسه زنده')){
      intent='workspace.live_meeting'; capability='live_meeting_intelligence'; status='live'; title='هوشمندی حین جلسه';
      const lm=await this.buildLiveMeetingIntelligence(actor,{meetingRef:context.selectedType==='meeting'?context.selectedRef:'',statements:[]});
      workspace={component:'live_meeting',...lm};
      items=(lm.agenda||[]).map(x=>({title:x.title,subtitle:x.reason,meta:'دستور جلسه'}));
      contextPatch={selectedRef:lm.meeting?.ref||context.selectedRef,selectedType:lm.meeting?'meeting':context.selectedType,resultRefs:(lm.agenda||[]).map(x=>x.ref)};
    } else if(has('آمادگی جلسه','جلسه بعدی','قبل از جلسه','پیش جلسه','پیش‌جلسه','برای جلسه آماده')){
      intent='workspace.pre_meeting'; capability='pre_meeting_intelligence'; status='live'; title='هوشمندی پیش از جلسه';
      const pm=await this.buildPreMeetingIntelligence(actor,{meetingRef:context.selectedType==='meeting'?context.selectedRef:''});
      workspace={component:'pre_meeting',...pm};
      items=(pm.agenda||[]).map(x=>({title:x.title,subtitle:x.reason,meta:`آمادگی: ${x.decisionReadiness?.level||'نامشخص'}`}));
      contextPatch={selectedRef:pm.meeting?.ref||context.selectedRef,selectedType:pm.meeting?'meeting':context.selectedType,resultRefs:(pm.agenda||[]).map(x=>x.ref)};
    } else if(has('بسته تصمیم','خلاصه تصمیم','brief تصمیم','گزارش برای تصمیم','آماده سازی تصمیم','آماده‌سازی تصمیم')){
      intent='workspace.decision_brief'; capability='decision_brief'; status='live'; title='بسته آمادگی تصمیم';
      const brief=await this.buildDecisionBrief(actor,{subject:context.selectedRef||''});
      workspace={component:'decision_brief',...brief};
      items=brief.brief?[{title:brief.brief.executiveQuestion,subtitle:`وضعیت: ${brief.brief.readiness.level}`,meta:'Decision Brief'}]:[];
      contextPatch={selectedRef:brief.subject?.ref||context.selectedRef,selectedType:brief.subject?.sourceType||context.selectedType};
    } else if(has('آمادگی تصمیم','برای تصمیم آماده','آماده تصمیم','تصمیم گیری آماده','تصمیم‌گیری آماده','آمادگی برای تصمیم')){
      intent='workspace.decision_readiness'; capability='decision_readiness'; status='live'; title='آمادگی تصمیم';
      const readiness=await this.buildDecisionReadiness(actor,{subject:context.selectedRef||''});
      workspace={component:'decision_readiness',...readiness};
      items=(readiness.dimensions||[]).map(x=>({title:x.title,subtitle:x.note,meta:x.status}));
      contextPatch={selectedRef:readiness.subject?.ref||context.selectedRef,selectedType:readiness.subject?.sourceType||context.selectedType};
    } else if(has('روی چی تمرکز کنم','روی چه چیزی تمرکز کنم','تمرکز امروز','مهم ترین کارهای امروز','مهم‌ترین کارهای امروز','اولویت تمرکز','چه چیزی مهم تر است','چه چیزی مهم‌تر است')){
      intent='workspace.focus_queue';capability='cognitive_prioritization';status='live';title='صف تمرکز شناختی امروز';
      const focus=await this.buildCognitiveFocusQueue(actor);
      items=focus.items;
      contextPatch={resultRefs:items.map(x=>x.ref).filter(Boolean),focusQueue:true};
      nextAction={type:'stay_inline'};
    } else if(has('جمع بندی شناختی','جمع‌بندی شناختی','مرور شناختی','brief شناختی','خلاصه وضعیت سازمان')){
      intent='workspace.cognitive_brief';capability='cognitive_brief';status='live';title='جمع‌بندی شناختی';const w=await this.personalMorningWorkspace(actor);const inv=await this.knowledgeInventory(actor);
      items=[
        {title:'موارد نیازمند توجه',subtitle:`${w.summary.total} مورد در داده‌های قابل دسترس فعلی`,meta:'attention',reason:'از Work/Meeting/Inbox/Review/Alertهای قابل دسترس ساخته شده است',confidence:0.94},
        {title:'دانش در دسترس',subtitle:`${inv.summary.documents} سند · ${inv.summary.reviewPending} مورد نیازمند بررسی`,meta:'document',reason:'بر پایه Knowledge Inventory فعلی',confidence:1}
      ];
      contextPatch={resultRefs:w.attention.map(x=>x.ref),cognitiveBrief:true};nextAction={type:'open_view',view:'morning'};
    } else if(has('صبح بخیر','اولویت های امروز','اولویت‌های امروز','امروز چی دارم','امروز چه چیزهایی','برنامه امروز')){
      intent='workspace.morning';capability='personal_workspace';status='live';title='فضای کاری امروز شما';const w=await this.personalMorningWorkspace(actor);items=w.attention.map(x=>({title:x.title,subtitle:x.subtitle,meta:x.type,ref:x.ref,reason:x.reason,confidence:x.confidence,score:x.attentionScore}));if(!items.length)items=[{title:'مورد زنده‌ای برای امروز ثبت نشده است',subtitle:'تقویم، کارتابل و Work Queue هنوز Connector زنده ندارند؛ داده ساختگی نمایش داده نمی‌شود.',meta:'Live sources only'}];contextPatch={resultRefs:w.attention.map(x=>x.ref),morningSummary:w.summary};nextAction={type:'open_view',view:'morning'};
    } else if(has('کارهای امروز','کار امروز','وظایف امروز','تسک','task')){
      intent='work.today';capability='actions';title='کارهای امروز';const w=await this.personalMorningWorkspace(actor);const rows=w.attention.filter(x=>x.type==='work');status=rows.length?'live':'planned';items=rows.length?rows.map(x=>({title:x.title,subtitle:x.subtitle,meta:'work',ref:x.ref})):[{title:'Work Queue زنده هنوز متصل نیست',subtitle:'Intent شناسایی شد؛ داده ساختگی نمایش داده نمی‌شود.',meta:'Connector pending'}];contextPatch={resultRefs:rows.map(x=>x.ref)};
    } else if(has('جلسات امروز','جلسه امروز','چه جلساتی','جلسه دارم','جلسات دارم')){
      intent='meeting.today';capability='meetings';title='جلسات امروز';const w=await this.personalMorningWorkspace(actor);const rows=w.attention.filter(x=>x.type==='meeting');status=rows.length?'live':'planned';items=rows.length?rows.map(x=>({title:x.title,subtitle:x.subtitle,meta:'meeting',ref:x.ref})):[{title:'تقویم زنده هنوز متصل نیست',subtitle:'Calendar + Meeting Intelligence هنوز متصل نیست و آماده اتصال است؛ داده ساختگی نمایش داده نمی‌شود.',meta:'Connector pending'}];contextPatch={resultRefs:rows.map(x=>x.ref)};
    } else if(has('نامه','کارتابل','مکاتبات','نامه های من','نامه‌ها')){
      intent='inbox.list';capability='correspondence';title='کارتابل و نامه‌ها';const w=await this.personalMorningWorkspace(actor);const rows=w.attention.filter(x=>x.type==='inbox');status=rows.length?'live':'planned';items=rows.length?rows.map(x=>({title:x.title,subtitle:x.subtitle,meta:'inbox',ref:x.ref})):[{title:'کارتابل زنده هنوز متصل نیست',subtitle:'Connector دبیرخانه/اتوماسیون اداری آماده اتصال است؛ داده ساختگی نمایش داده نمی‌شود.',meta:'Integration pending'}];contextPatch={resultRefs:rows.map(x=>x.ref)};
    }
    contextPatch={...contextPatch,lastIntent:intent,lastCapability:capability,lastTitle:title};
    const componentType=
      intent==='workspace.focus_queue'?'focus_queue':
      intent==='workspace.cognitive_brief'?'cognitive_brief':
      intent==='workspace.morning'?'attention_board':
      intent==='meeting.today'?'meeting_timeline':
      intent==='work.today'?'action_board':
      intent==='inbox.list'?'correspondence_list':
      intent.startsWith('knowledge.')?'document_grid':
      intent.startsWith('trace.')?'trace_flow':
      intent.startsWith('document.')?'document_action':
      'generic_cards';
    workspace=workspace||{componentType,layout:items.length>4?'dense':'comfortable',empty:items.length===0,explainability:items.some(x=>x.reason||x.confidence!=null),sections:[{key:'primary',title,items}]};
    const result={commandId:newId('CMD'),sessionId,text,intent,capability,status,title,items,workspace,nextAction,context:{...context,...contextPatch},actor:{personId:actor.personId,organizationId:actor.organizationId},correlationId:actor.correlationId,createdAt:now()};
    await this.rememberCommand(actor,sessionId,contextPatch,{commandId:result.commandId,text,intent,status,createdAt:result.createdAt});
    return result;
  }
  async trace(actor,docId){const db=await this.repo.all();const doc=db.documents.find(x=>x.id===docId&&x.organizationId===actor.organizationId);assert(doc,'DOC_NOT_FOUND','سند پیدا نشد.');return {document:doc,artifact:db.artifacts?.find(x=>x.documentRef===docId),normalized:db.normalizedDocuments?.filter(x=>x.documentRef===docId).map(x=>({id:x.id,sourceVersion:x.sourceVersion,language:x.language,structure:x.structure,unitCount:x.units?.length||0,units:(x.units||[]).slice(0,12),contentHash:x.contentHash,textPreview:x.text.slice(0,700)})),candidates:db.candidates.filter(x=>x.documentRef===docId),audit:db.audit.filter(x=>x.objectRef===docId||db.candidates.some(c=>c.documentRef===docId&&c.id===x.objectRef)),provenance:db.provenance.filter(x=>x.targetRef===docId),aiExecutions:db.aiExecutions.filter(x=>x.contextRefs?.some(r=>r.objectRef===docId))};}
}
