import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { PostgresRepository } from '../src/infrastructure/postgresRepository.js';

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


const migrationAuthorized=req=>{
  const expected=String(process.env.MIGRATION_ADMIN_SECRET||'');
  const actual=String((req.headers||{})['x-migration-secret']||'');
  return Boolean(expected)&&actual===expected;
};
const migrationError=(e,stage)=>({
  ok:false,
  stage,
  code:e?.code||(
    /data transfer quota/i.test(String(e?.message||'')) ? 'DATABASE_TRANSFER_QUOTA_EXCEEDED' :
    'DATABASE_MIGRATION_ERROR'
  ),
  message:e?.message||String(e)||'Database migration error',
  retryable:!['MIGRATION_TARGET_NOT_EMPTY','MIGRATION_SNAPSHOT_INVALID'].includes(String(e?.code||''))
});
async function migrationStats(repo,stage){
  try{
    return {ok:true,stage,stats:await repo.stats()};
  }catch(e){
    console.error(`DATABASE_MIGRATION_${stage.toUpperCase()}_ERROR`,e);
    return migrationError(e,stage);
  }
}
async function handleDatabaseMigration(req,res,repo){
  if(req.method!=='POST') return send(res,405,{message:'Method not allowed'});
  if(!migrationAuthorized(req)) return send(res,403,{message:'دسترسی مهاجرت مجاز نیست.',code:'MIGRATION_FORBIDDEN'});

  const input=bodyOf(req),action=String(input.action||'probe-target').toLowerCase();
  const needsTarget=['probe-target','probe','copy'].includes(action);
  const targetUrl=String(process.env.MIGRATION_TARGET_DATABASE_URL||'');
  if(needsTarget&&!targetUrl) return send(res,503,{ok:false,stage:'target',message:'MIGRATION_TARGET_DATABASE_URL تنظیم نشده است.',code:'MIGRATION_TARGET_URL_REQUIRED'});

  if(action==='probe-source'){
    const source=await migrationStats(repo,'source');
    return send(res,source.ok?200:503,source);
  }

  const target=needsTarget?new PostgresRepository(targetUrl):null;
  try{
    if(action==='probe-target'){
      const result=await migrationStats(target,'target');
      return send(res,result.ok?200:503,result);
    }

    // Backward-compatible combined probe, now target-first so a blocked source does not hide target health.
    if(action==='probe'){
      const targetResult=await migrationStats(target,'target');
      if(!targetResult.ok) return send(res,503,{ok:false,target:targetResult,source:{ok:false,stage:'source',skipped:true,reason:'TARGET_PROBE_FAILED'}});
      const sourceResult=await migrationStats(repo,'source');
      return send(res,sourceResult.ok?200:503,{ok:targetResult.ok&&sourceResult.ok,target:targetResult,source:sourceResult});
    }

    if(action!=='copy') return send(res,400,{ok:false,message:'عملیات مهاجرت نامعتبر است.',code:'MIGRATION_ACTION_INVALID',allowed:['probe-target','probe-source','probe','copy']});

    let snapshot;
    try{
      snapshot=await repo.exportSnapshot();
    }catch(e){
      console.error('DATABASE_MIGRATION_SOURCE_EXPORT_ERROR',e);
      return send(res,503,migrationError(e,'source-export'));
    }

    let result;
    try{
      result=await target.importSnapshot(snapshot,{requireEmpty:true});
    }catch(e){
      console.error('DATABASE_MIGRATION_TARGET_IMPORT_ERROR',e);
      return send(res,503,migrationError(e,'target-import'));
    }

    let verify;
    try{
      verify=await target.exportSnapshot();
    }catch(e){
      console.error('DATABASE_MIGRATION_TARGET_VERIFY_ERROR',e);
      return send(res,503,migrationError(e,'target-verify'));
    }

    const same=JSON.stringify(snapshot.counts)===JSON.stringify(verify.counts);
    if(!same) return send(res,500,{ok:false,message:'صحت‌سنجی شمارشی مهاجرت ناموفق بود.',code:'MIGRATION_VERIFY_FAILED',stage:'verify',source:snapshot.counts,target:verify.counts});
    return send(res,200,{ok:true,migrated:true,source:snapshot.counts,target:verify.counts,compressedBytes:result.compressedBytes});
  }catch(e){
    console.error('DATABASE_MIGRATION_HANDLER_ERROR',e);
    return send(res,500,migrationError(e,'handler'));
  }finally{
    if(target) await target.close().catch(()=>{});
  }
}

async function handleGovernance(req,res,repo,actor,u){
  const id=String(u.searchParams.get('documentId')||'');
  const db=await repo.all();

  if(req.method==='GET'){
    if(!id) return send(res,200,{permissions:{documentEdit:actor.canEdit,role:actor.role}});
    const d=(db.documents||[]).find(x=>x.id===id&&x.organizationId===actor.organizationId);
    if(!d) return send(res,404,{message:'سند پیدا نشد'});
    const artifacts=(db.artifacts||[]).filter(x=>x.documentRef===d.id&&x.organizationId===actor.organizationId);
    const currentPrimary=artifacts.find(x=>x.id===d.artifactRef)||artifacts.filter(x=>x.role!=='attachment'&&x.status==='committed').sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null;
    const attachments=artifacts.filter(x=>x.role==='attachment'&&x.status==='committed').map(x=>({id:x.id,fileName:x.fileName,mimeType:x.mimeType,size:x.size||0,createdAt:x.createdAt||null}));
    return send(res,200,{
      document:d,
      files:{primary:currentPrimary?{id:currentPrimary.id,fileName:currentPrimary.fileName,mimeType:currentPrimary.mimeType,size:currentPrimary.size||0}:null,attachments},
      permissions:{documentEdit:actor.canEdit,role:actor.role}
    });
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


function k986SafeFileName(name){
 return String(name||'file').normalize('NFC').replace(/[^\w.\-\u0600-\u06FF]+/g,'_').replace(/^\.+/,'').slice(-160)||'file';
}
async function handleBlobUploadUrl(req,res,actor){
 if(req.method!=='POST')return send(res,405,{message:'Method not allowed'});
 const input=bodyOf(req),fileName=k986SafeFileName(input.fileName),mimeType=String(input.mimeType||'application/octet-stream');
 const size=Math.max(0,Number(input.size||0)),role=String(input.role||'attachment')==='primary'?'primary':'attachment';
 if(!fileName)return send(res,400,{message:'نام فایل الزامی است.'});
 // Keep this endpoint for document-like uploads only; final MIME validation still occurs during commit/parse.
 const allowed=/\.(docx|pdf)$/i.test(fileName);
 if(!allowed)return send(res,400,{message:'در این مرحله آپلود مستقیم فقط برای Word و PDF فعال است.',code:'DIRECT_UPLOAD_TYPE_NOT_ALLOWED'});
 const nonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
 const pathname=`${actor.organizationId}/direct/${new Date().toISOString().slice(0,10)}/${role}-${nonce}-${fileName}`;
 const validUntil=Date.now()+15*60*1000;
 try{
  const {issueSignedToken,presignUrl}=await import('@vercel/blob');
  const token=await issueSignedToken({pathname,operations:['put'],validUntil});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'put',validUntil});
  const blobUrl=String(presignedUrl||'').split('?')[0];
  return send(res,200,{presignedUrl,blobUrl,pathname,fileName,mimeType,size,validUntil,direct:true});
 }catch(e){
  console.error('BLOB_PRESIGN_ERROR',e);
  return send(res,503,{message:'آپلود مستقیم Blob در دسترس نیست. اتصال Vercel Blob/OIDC را بررسی کنید.',code:'DIRECT_UPLOAD_UNAVAILABLE',detail:e?.message||String(e)});
 }
}
export default async function handler(req,res){
  try{
    const u=new URL(req.url,'https://local');
    const pathname=u.pathname;
    const actor=actorOf(req);
    const repo=createRepository();

    if(pathname.endsWith('/database-migration')){
      return handleDatabaseMigration(req,res,repo);
    }
    if(pathname.endsWith('/blob-upload-url')){
      return handleBlobUploadUrl(req,res,actor);
    }
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
