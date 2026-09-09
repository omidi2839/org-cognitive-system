import { createRepository } from '../src/infrastructure/repositoryFactory.js';

const ORG='ORG:SYN-001';
const send=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};
const bodyOf=req=>{
  if(!req.body) return {};
  if(typeof req.body==='object') return req.body;
  try{return JSON.parse(req.body)}catch{return{}}
};
const actorOf=req=>{
  const h=req.headers||{};
  const role=String(h['x-role']||'admin').toLowerCase();
  return {
    organizationId:String(h['x-org-id']||ORG),
    role,
    personRef:String(h['x-person-id']||h['x-user-id']||'current-user'),
    name:(()=>{try{return decodeURIComponent(String(h['x-person-name']||'کاربر فعلی'))}catch{return String(h['x-person-name']||'کاربر فعلی')}})(),
    canEdit:String(h['x-document-edit-permission']||'').toLowerCase()==='true'||
      ['admin','administrator','document_editor','knowledge_admin'].includes(role)
  };
};
const editable=['title','documentType','documentNumber','issuer','versionLabel','issuedAt','promulgationDate','meetingType','meetingNumber','meetingDate','validUntil','validityStatus','classification','organizationalLevel','scopeType','organizationalUnitRef','organizationalUnitName','subjectCategory','subjectArea'];
const stages=['independent_analysis','complementary_review','final_synthesis','approved'];
const stageFa={independent_analysis:'تحلیل مستقل خبرگان',complementary_review:'تحلیل تکمیلی و نقد',final_synthesis:'جمع‌بندی و نهایی‌سازی',approved:'تأیید نهایی'};
const questions=(stage,rs=[])=>{
  if(stage==='independent_analysis') return [
    'مفاهیم کلیدی این سند را با استناد به عبارت‌های خود سند مشخص کنید.',
    'منظور دقیق سند از هر مفهوم کلیدی چیست و چه ابعادی برای آن در نظر می‌گیرید؟',
    'کدام بخش از متن سند شاهد تفسیر شماست؟'
  ];
  if(stage==='complementary_review') return [
    `تا این مرحله ${rs.filter(x=>x.stage==='independent_analysis').length} تحلیل مستقل ثبت شده است. نقاط توافق و اختلاف این دیدگاه‌ها را بررسی کنید.`,
    'آیا برداشت‌های ارائه‌شده مکمل یکدیگرند یا تعارض مفهومی دارند؟ دلیل و شاهد خود را ذکر کنید.',
    'کدام ابهام‌ها هنوز برای رسیدن به معنای معتبر سازمانی نیازمند توضیح است؟'
  ];
  return [
    'با توجه به همه تحلیل‌ها و نقدهای ثبت‌شده، تعریف نهایی و قابل استناد مفهوم را تدوین کنید.',
    'دیدگاه‌های اقلیت یا اختلاف‌های حل‌نشده را صریحاً ثبت کنید؛ تعداد موافقان به‌تنهایی معیار اعتبار نیست.',
    'عبارت یا شواهد سند که مبنای جمع‌بندی نهایی است مشخص کنید.'
  ];
};
const summary=rs=>({
  total:rs.length,
  independent:rs.filter(x=>x.stage==='independent_analysis').length,
  complementary:rs.filter(x=>x.stage==='complementary_review').length,
  final:rs.filter(x=>x.stage==='final_synthesis').length
});

async function handleGovernance(req,res,repo,actor,u){
  const id=String(u.searchParams.get('documentId')||'');
  const db=await repo.all();

  if(req.method==='GET'){
    if(!id) return send(res,200,{permissions:{documentEdit:actor.canEdit,role:actor.role}});
    const d=(db.documents||[]).find(x=>x.id===id&&x.organizationId===actor.organizationId);
    if(!d) return send(res,404,{message:'سند پیدا نشد'});
    return send(res,200,{document:d,permissions:{documentEdit:actor.canEdit,role:actor.role}});
  }

  if(req.method!=='PATCH') return send(res,405,{message:'Method not allowed'});
  if(!actor.canEdit) return send(res,403,{message:'شما مجوز ویرایش سند را ندارید',code:'DOCUMENT_EDIT_FORBIDDEN'});
  if(!id) return send(res,400,{message:'شناسه سند الزامی است'});

  const input=bodyOf(req),patch={};
  for(const k of editable){
    if(Object.prototype.hasOwnProperty.call(input,k)) patch[k]=input[k]===undefined?null:input[k];
  }
  if(!Object.keys(patch).length) return send(res,400,{message:'هیچ فیلد قابل ویرایشی ارسال نشده است'});

  const now=new Date().toISOString();
  let updated=null;
  await repo.mutate(s=>{
    s.documents??=[];
    const d=s.documents.find(x=>x.id===id&&x.organizationId===actor.organizationId);
    if(!d) return;
    const before={};
    for(const k of Object.keys(patch)) before[k]=d[k]??null;
    Object.assign(d,patch,{editedAt:now,editedBy:actor.personRef});
    s.documentEditAudit??=[];
    s.documentEditAudit.push({
      id:`DEA:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      organizationId:actor.organizationId,
      documentRef:id,
      editedAt:now,
      editedBy:actor.personRef,
      before,
      after:patch
    });
    updated={...d};
  });
  if(!updated) return send(res,404,{message:'سند پیدا نشد'});
  return send(res,200,{document:updated,auditRecorded:true});
}

async function handleCollaborative(req,res,repo,actor,u){
  const documentId=String(u.searchParams.get('documentId')||'');

  if(req.method==='GET'){
    const db=await repo.all();
    const docs=(db.documents||[]).filter(x=>x.organizationId===actor.organizationId&&x.documentClass==='upstream');
    const cases=(db.collaborativeAnalysisCases||[]).filter(x=>x.organizationId===actor.organizationId);
    const responses=(db.collaborativeAnalysisResponses||[]).filter(x=>x.organizationId===actor.organizationId);
    const items=docs.map(d=>{
      const c=cases.find(x=>x.documentRef===d.id)||null;
      const rs=c?responses.filter(x=>x.caseRef===c.id):[];
      return {
        document:{id:d.id,title:d.title,documentType:d.documentType,status:d.status},
        case:c?{...c,stageLabel:stageFa[c.stage],summary:summary(rs),questions:questions(c.stage,rs)}:null
      };
    });
    if(documentId){
      const item=items.find(x=>x.document.id===documentId);
      if(!item) return send(res,404,{message:'سند بالادستی پیدا نشد'});
      const rs=item.case?responses.filter(x=>x.caseRef===item.case.id).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))):[];
      return send(res,200,{...item,responses:rs});
    }
    return send(res,200,{items,policy:{analyzableClass:'upstream',generalDocuments:'reference_only'}});
  }

  const input=bodyOf(req);

  if(req.method==='POST'){
    const db=await repo.all();
    const d=(db.documents||[]).find(x=>x.id===input.documentId&&x.organizationId===actor.organizationId);
    if(!d) return send(res,404,{message:'سند پیدا نشد'});
    if(d.documentClass!=='upstream'){
      return send(res,409,{
        message:'اسناد عمومی وارد تحلیل شناختی نمی‌شوند و فقط برای استناد و بازیابی پردازش می‌شوند.',
        code:'GENERAL_DOCUMENT_REFERENCE_ONLY'
      });
    }
    let created=null;
    await repo.mutate(s=>{
      s.collaborativeAnalysisCases??=[];
      created=s.collaborativeAnalysisCases.find(x=>x.organizationId===actor.organizationId&&x.documentRef===d.id);
      if(!created){
        created={
          id:`CAC:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
          organizationId:actor.organizationId,
          documentRef:d.id,
          stage:'independent_analysis',
          status:'in_progress',
          createdAt:new Date().toISOString(),
          createdBy:actor.personRef
        };
        s.collaborativeAnalysisCases.push(created);
      }
    });
    return send(res,200,{case:{...created,stageLabel:stageFa[created.stage],questions:questions(created.stage,[])}});
  }

  if(req.method==='PATCH'){
    let updated=null;
    await repo.mutate(s=>{
      s.collaborativeAnalysisCases??=[];
      s.collaborativeAnalysisResponses??=[];
      const c=s.collaborativeAnalysisCases.find(x=>x.id===input.caseId&&x.organizationId===actor.organizationId);
      if(!c) return;
      if(input.action==='respond'){
        s.collaborativeAnalysisResponses.push({
          id:`CAR:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
          organizationId:actor.organizationId,
          caseRef:c.id,
          stage:c.stage,
          expertRef:input.expertRef||actor.personRef,
          expertName:input.expertName||actor.name,
          groupLabel:input.groupLabel||'گروه خبرگان تحلیل اسناد بالادستی',
          concept:String(input.concept||'').trim(),
          analysis:String(input.analysis||'').trim(),
          evidence:String(input.evidence||'').trim(),
          audioDataUrl:String(input.audioDataUrl||'').slice(0,2200000),
          createdAt:new Date().toISOString()
        });
      }else if(input.action==='advance'){
        const i=stages.indexOf(c.stage);
        if(i>=0&&i<stages.length-1) c.stage=stages[i+1];
        if(c.stage==='approved'){
          c.status='approved';
          c.approvedAt=new Date().toISOString();
          c.approvedBy=actor.personRef;
        }
      }
      c.updatedAt=new Date().toISOString();
      updated={...c};
    });
    if(!updated) return send(res,404,{message:'پرونده تحلیل پیدا نشد'});
    const db=await repo.all();
    const rs=(db.collaborativeAnalysisResponses||[]).filter(x=>x.caseRef===updated.id);
    return send(res,200,{
      case:{...updated,stageLabel:stageFa[updated.stage],summary:summary(rs),questions:questions(updated.stage,rs)},
      responses:rs
    });
  }

  return send(res,405,{message:'Method not allowed'});
}

async function handleKnowledgeDocuments(req,res,repo,actor,u){
  if(req.method!=='GET') return send(res,405,{message:'Method not allowed'});
  const documentClass=u.searchParams.get('class')||null;
  const db=await repo.all();

  const all=(Array.isArray(db.documents)?db.documents:[]).filter(x=>x.organizationId===actor.organizationId);
  const docs=documentClass?all.filter(x=>x.documentClass===documentClass):all;
  const ids=new Set(docs.map(x=>x.id));

  const candidates=(Array.isArray(db.candidates)?db.candidates:[])
    .filter(x=>x.organizationId===actor.organizationId&&ids.has(x.documentRef));
  const artifacts=(Array.isArray(db.artifacts)?db.artifacts:[])
    .filter(x=>x.organizationId===actor.organizationId&&ids.has(x.documentRef));

  const groups={};
  for(const a of artifacts){
    const key=String(a.checksum||a.id||'');
    (groups[key]??=[]).push(a);
  }
  const duplicateGroups=Object.values(groups).filter(g=>g.length>1);

  const items=docs.slice()
    .sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))
    .map(d=>{
      const dc=candidates.filter(c=>c.documentRef===d.id);
      return {
        id:d.id,
        title:d.title||'بدون عنوان',
        documentClass:d.documentClass||'unclassified',
        documentType:d.documentType||null,
        documentNumber:d.documentNumber||null,
        status:d.status||'registered',
        version:d.version||1,
        versionLabel:d.versionLabel||null,
        issuer:d.issuer||null,
        issuedAt:d.issuedAt||null,
        promulgationDate:d.promulgationDate||null,
        meetingNumber:d.meetingNumber||null,
        meetingDate:d.meetingDate||null,
        meetingType:d.meetingType||null,
        validUntil:d.validUntil||null,
        validityStatus:d.validityStatus||'unknown',
        classification:d.classification||'internal',
        organizationalLevel:d.organizationalLevel||null,
        organizationalUnitRef:d.organizationalUnitRef||null,
        organizationalUnitName:d.organizationalUnitName||null,
        subjectCategory:d.subjectCategory||null,
        subjectArea:d.subjectArea||null,
        sourceFileName:d.sourceFileName||null,
        createdAt:d.createdAt||null,
        editedAt:d.editedAt||null,
        editedBy:d.editedBy||null,
        candidates:{
          total:dc.length,
          pending:dc.filter(x=>x.status==='ready_for_review').length,
          accepted:dc.filter(x=>['accepted','corrected'].includes(x.status)).length
        }
      };
    });

  return send(res,200,{
    filter:{documentClass:documentClass||'all'},
    summary:{
      documents:items.length,
      upstreamDocuments:all.filter(x=>x.documentClass==='upstream').length,
      generalDocuments:all.filter(x=>x.documentClass==='general').length,
      allDocuments:all.length,
      reviewPending:candidates.filter(x=>x.status==='ready_for_review').length,
      duplicateGroups:duplicateGroups.length
    },
    items
  });
}

export default async function handler(req,res){
  try{
    const u=new URL(req.url,'https://local');
    const pathname=u.pathname;
    const actor=actorOf(req);
    const repo=createRepository();

    if(pathname.endsWith('/document-governance')){
      return handleGovernance(req,res,repo,actor,u);
    }
    if(pathname.endsWith('/collaborative-analysis')){
      return handleCollaborative(req,res,repo,actor,u);
    }
    return handleKnowledgeDocuments(req,res,repo,actor,u);
  }catch(e){
    console.error('SAFE_KNOWLEDGE_DOCUMENTS_ERROR',e);
    return send(res,500,{message:e?.message||'خطا در سرویس دانش و اسناد',code:e?.code||'SAFE_DOCUMENTS_ERROR'});
  }
}
