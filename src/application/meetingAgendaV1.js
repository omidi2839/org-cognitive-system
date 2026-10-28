// Sina V1.3 — durable meeting agenda, document references and private attachments.
// Runs INSIDE the existing api/index.js Vercel function (no new api/ files).
import {randomUUID} from 'node:crypto';
import {createRepository,repositoryMode} from '../infrastructure/repositoryFactory.js';
import {requireAuthenticated} from '../infrastructure/authSession.js';

const ORG='ORG:SYN-001';
export class AgendaError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status}}
const fail=(code,message,status)=>{throw new AgendaError(code,message,status)};
const clean=(x,max=250)=>String(x??'').trim().slice(0,max+1);
const norm=s=>String(s??'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\s]+/g,' ').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).toLowerCase().trim();
const validId=(v,prefix)=>typeof v==='string'&&new RegExp('^'+prefix+':[a-f0-9-]{36}$','i').test(v);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const active=x=>x&&x.status!=='deleted'&&x.status!=='superseded';
const allowedExt=['pdf','doc','docx','xls','xlsx','ppt','pptx','png','jpg','jpeg','txt'];
const extFromName=name=>String(name||'').match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()||'';
const maxFileSize=20*1024*1024;
// Keep JSON/base64 uploads well below Vercel's ~4.5 MB request limit.
const maxDirectUploadSize=2*1024*1024;
const safeOrg=ORG.replace(/[^a-z0-9_-]/gi,'-');
const safeOutput=a=>({...a,attachments:(a.attachments||[]).filter(x=>x.status!=='deleted').map(({pathname,...x})=>x)});
const errMessage=e=>e instanceof AgendaError?e.message:'عملیات دستور جلسه انجام نشد؛ جزئیات در گزارش خطای سرور ثبت شده است.';
// Confirm private Blob objects with the same authenticated get() path used by the
// existing document bank. The older head() path can fail on private/OIDC stores
// even after a signed PUT succeeds, so a head() failure is NOT an upload failure.
export async function verifyAgendaBlobUpload(blob,pathname,expectedSize,{fetcher=fetch}={}){
 const errors=[];let definitelyMissing=false;
 try{
  const metadata=await blob.head(pathname);
  if(metadata===null)definitelyMissing=true;
  if(metadata && Number(metadata.size)===Number(expectedSize))return true;
  errors.push('head:size-mismatch');
 }catch(e){errors.push('head:'+String(e?.code||e?.name||'failed'));}
 try{
  const result=await blob.get(pathname,{access:'private',useCache:false});
  const actual=Number(result?.blob?.size);
  if(result?.statusCode===200 && actual===Number(expectedSize)){
   try{await result.stream?.cancel?.()}catch{};
   return true;
  }
  try{await result?.stream?.cancel?.()}catch{};
  errors.push('get:'+String(result?.statusCode||'missing')+':'+String(actual));
 }catch(e){errors.push('get:'+String(e?.code||e?.name||'failed'));}
 // Signed HEAD is independently authenticated by the same short-lived token
 // mechanism that succeeded in creating the signed PUT URL.
 try{
  const validUntil=Date.now()+60*1000;
  const token=await blob.issueSignedToken({pathname,operations:['head'],validUntil});
  const {presignedUrl}=await blob.presignUrl(token,{pathname,operation:'head',validUntil,access:'private'});
  const response=await fetcher(presignedUrl,{method:'HEAD',cache:'no-store'});
  const actual=Number(response.headers.get('content-length'));
  if(response.ok && Number.isSafeInteger(actual) && actual===Number(expectedSize))return true;
  errors.push('signed-head:'+String(response.status)+':'+String(actual));
 }catch(e){errors.push('signed-head:'+String(e?.code||e?.name||'failed'));}
 console.error('AGENDA_UPLOAD_VERIFICATION_FAILED',{pathScope:'meetings',attempts:errors});
 if(definitelyMissing)fail('BLOB_MISMATCH','فایل بارگذاری‌شده یافت نشد یا هنوز کامل نشده است.',409);
 fail('BLOB_NOT_CONFIRMED','فایل به فضای ذخیره‌سازی ارسال شد اما تأیید آن ممکن نشد؛ وضعیت اتصال فضای فایل خصوصی را بررسی کنید.',503);
}

const send=(res,status,value)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.end(JSON.stringify(value))};
const getMeeting=(db,id)=>{if(!validId(id,'MTG'))fail('MEETING_ID_INVALID','شناسه جلسه معتبر نیست.');const m=(db.meetings||[]).find(x=>x.id===id&&x.organizationId===ORG&&x.schemaVersion===1);if(!m)fail('MEETING_NOT_FOUND','جلسه یافت نشد یا مجاز به دسترسی نیست.',404);return m};
const getAgenda=(db,id)=>{if(!validId(id,'AGD'))fail('AGENDA_ID_INVALID','شناسه دستور جلسه معتبر نیست.');const a=(db.meetingAgendaItems||[]).find(x=>x.id===id&&x.organizationId===ORG&&x.status!=='deleted');if(!a)fail('AGENDA_NOT_FOUND','دستور جلسه یافت نشد.',404);getMeeting(db,a.meetingId);return a};
function docIndex(db){return new Map((db.documents||[]).filter(d=>d.organizationId===ORG&&active(d)).map(d=>[d.id,d]));}
function normalizePayload(payload,db){
 if(!plain(payload))fail('INVALID_BODY','داده دستور جلسه معتبر نیست.');
 const title=clean(payload.title,240),description=clean(payload.description,12000),expectedOutcome=clean(payload.expectedOutcome,1500),presenter=clean(payload.presenter,240),purpose=clean(payload.purpose,1000);
 if(!title||title.length>240)fail('TITLE_REQUIRED','عنوان دستور جلسه الزامی است (حداکثر ۲۴۰ نویسه).');
 if(description.length>12000||expectedOutcome.length>1500||purpose.length>1000||presenter.length>240)fail('TEXT_TOO_LONG','طول یکی از فیلدهای متنی بیش از حد مجاز است.');
 const duration=Number(payload.durationMinutes||0),order=Number(payload.order||0);
 if(!Number.isInteger(duration)||duration<0||duration>1440||!Number.isInteger(order)||order<0||order>10000)fail('NUMBER_INVALID','ترتیب یا مدت دستور جلسه معتبر نیست.');
 const status=clean(payload.status,24)||'draft';
 if(!['draft','review'].includes(status))fail('STATUS_INVALID','وضعیت دستور جلسه معتبر نیست.');
 const refs=payload.documentRefs||[];
 if(!Array.isArray(refs)||refs.length>40||refs.some(x=>typeof x!=='string'))fail('DOC_REFS_INVALID','فهرست اسناد مرتبط معتبر نیست.');
 const documentRefs=[...new Set(refs)];const docs=docIndex(db);
 for(const ref of documentRefs)if(!docs.has(ref))fail('DOCUMENT_NOT_FOUND','یکی از اسناد انتخاب‌شده وجود ندارد یا دسترسی به آن مجاز نیست.',409);
 const inputLinks=payload.referenceLinks||[];
 if(!Array.isArray(inputLinks)||inputLinks.length>25)fail('LINKS_INVALID','فهرست پیوندها معتبر نیست.');
 const referenceLinks=inputLinks.map(v=>{
  if(!plain(v))fail('LINK_INVALID','پیوند معتبر نیست.');const title=clean(v.title,200),url=clean(v.url,1300);
  if(!title||!url||title.length>200||url.length>1300)fail('LINK_INVALID','عنوان و نشانی هر پیوند الزامی است.');
  let parsed;try{parsed=new URL(url)}catch{fail('LINK_INVALID','نشانی پیوند معتبر نیست.');}
  if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)fail('LINK_INVALID','فقط پیوند HTTP یا HTTPS بدون نام کاربری مجاز است.');
  return {title,url};
 });
 return {title,description,purpose,expectedOutcome,presenter,durationMinutes:duration,order,status,documentRefs,referenceLinks};
}
function decorated(db,record){const docs=docIndex(db);return {...safeOutput(record),documents:(record.documentRefs||[]).map(ref=>docs.get(ref)).filter(Boolean).map(d=>({id:d.id,title:d.title||'بدون عنوان',documentType:d.documentType||'',documentNumber:d.documentNumber||'',issuer:d.issuer||'',validityStatus:d.validityStatus||''}))};}
export class MeetingAgendaService {
 constructor(repo,{blobGateway=null}={}){this.repo=repo;this.blobGateway=blobGateway}
 async blob(){return this.blobGateway||await import('@vercel/blob')}
 async meetings({query='',from='',to='',status='active'}={}){
  const db=await this.repo.all(),q=norm(query);const items=(db.meetings||[]).filter(x=>x.organizationId===ORG&&x.schemaVersion===1);
  const agendas=(db.meetingAgendaItems||[]).filter(a=>a.organizationId===ORG&&a.status!=='deleted');
  const docs=docIndex(db);
  const matches=x=>{
   if(status==='active'&&x.status==='cancelled')return false;
   if(status==='scheduled'&&x.status!=='scheduled')return false;
   if(status==='cancelled'&&x.status!=='cancelled')return false;
   if(from&&(!x.startDate||x.startDate<from))return false;
   if(to&&(!x.startDate||x.startDate>to))return false;
   if(!q)return true;
   const own=agendas.filter(a=>a.meetingId===x.id);
   const fields=[x.title,x.description,x.organizer,x.location,x.startDate,...(x.participants||[]).map(p=>p.name),...own.flatMap(a=>[a.title,a.description,a.presenter,...a.documentRefs.map(ref=>docs.get(ref)?.title||'')])];
   return fields.some(v=>norm(v).includes(q));
  };
  return {items:items.filter(matches).sort((a,b)=>String(a.startDate||'9999').localeCompare(String(b.startDate||'9999'))).map(x=>({id:x.id,title:x.title,description:x.description||'',startDate:x.startDate||'',startTime:x.startTime||'',status:x.status,kind:x.kind,participantsCount:x.participants?.length||0,agendaCount:agendas.filter(a=>a.meetingId===x.id).length})),total:items.filter(matches).length};
 }
 async list(meetingId){const db=await this.repo.all();const m=getMeeting(db,meetingId);const items=(db.meetingAgendaItems||[]).filter(a=>a.meetingId===m.id&&a.organizationId===ORG&&a.status!=='deleted').sort((a,b)=>a.order-b.order||a.createdAt.localeCompare(b.createdAt));return {meeting:{id:m.id,title:m.title,startDate:m.startDate,startTime:m.startTime,status:m.status},items:items.map(a=>decorated(db,a))};}
 async documents(query=''){
  const db=await this.repo.all(),q=norm(query),records=[...docIndex(db).values()];
  const filtered=q?records.filter(d=>[d.title,d.documentNumber,d.documentType,d.issuer,d.subjectCategory,d.subjectArea].some(x=>norm(x).includes(q))):records;
  return {items:filtered.slice(0,60).map(d=>({id:d.id,title:d.title||'بدون عنوان',documentNumber:d.documentNumber||'',documentType:d.documentType||'',issuer:d.issuer||'',validityStatus:d.validityStatus||''})),total:filtered.length};
 }
 async save(input,user){
  const meetingId=clean(input?.meetingId,90),id=clean(input?.id,90),revision=Number(input?.revision||0);
  const draftId=clean(input?.uploadDraftId,70),stagedUploadIds=input?.stagedUploadIds||[],removeAttachmentIds=input?.removeAttachmentIds||[];
  if(!Array.isArray(stagedUploadIds)||stagedUploadIds.length>30||new Set(stagedUploadIds).size!==stagedUploadIds.length||stagedUploadIds.some(v=>!validId(v,'STG')))fail('STAGED_UPLOADS_INVALID','فهرست فایل‌های بارگذاری‌شده معتبر نیست.');
  if(stagedUploadIds.length&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId))fail('UPLOAD_DRAFT_INVALID','شناسه پیش‌نویس بارگذاری معتبر نیست.');
  if(!Array.isArray(removeAttachmentIds)||removeAttachmentIds.length>30||new Set(removeAttachmentIds).size!==removeAttachmentIds.length||removeAttachmentIds.some(v=>!validId(v,'ATT')))fail('REMOVE_ATTACHMENTS_INVALID','فهرست پیوست‌های حذفی معتبر نیست.');
  if(!id&&removeAttachmentIds.length)fail('REMOVE_ATTACHMENTS_INVALID','برای دستور جدید پیوست قبلی وجود ندارد.');
  const at=new Date().toISOString();
  return this.repo.mutate(db=>{
   const m=getMeeting(db,meetingId);
   if(m.status==='cancelled')fail('MEETING_CANCELLED','برای جلسه لغوشده نمی‌توان دستور جدید ثبت کرد.',409);
   const value=normalizePayload(input,db);db.meetingAgendaItems??=[];db.auditLog??=[];
   let record;
   if(id){record=getAgenda(db,id);if(record.meetingId!==m.id)fail('AGENDA_MEETING_MISMATCH','دستور متعلق به این جلسه نیست.',409);if(!Number.isSafeInteger(revision)||revision!==record.revision)fail('AGENDA_CONFLICT','این دستور توسط فرد دیگری تغییر کرده است. صفحه را تازه‌سازی کنید.',409);}
   const draftList=db.meetingAgendaDraftUploads||[],stages=stagedUploadIds.map(ref=>{
    const stage=draftList.find(x=>x.id===ref);
    if(!stage||stage.organizationId!==ORG||stage.meetingId!==m.id||stage.draftId!==draftId||stage.owner!==user||stage.status!=='uploaded'||Date.parse(stage.expiresAt)<Date.now())fail('STAGED_UPLOAD_INVALID','یکی از فایل‌های پیش‌بارگذاری‌شده نامعتبر یا منقضی شده است. لطفاً آن را دوباره آپلود کنید.',409);
    return stage;
   });
   const previous=record?.attachments||[];
   for(const ref of removeAttachmentIds)if(!previous.some(f=>f.id===ref&&f.status!=='deleted'))fail('ATTACHMENT_NOT_FOUND','یکی از پیوست‌های انتخاب‌شده برای حذف یافت نشد.',409);
   const remaining=previous.filter(f=>f.status!=='deleted'&&!removeAttachmentIds.includes(f.id)).length;
   if(remaining+stages.length>30)fail('ATTACHMENT_LIMIT','حداکثر ۳۰ پیوست برای هر دستور مجاز است.',409);
   if(id){Object.assign(record,value,{revision:record.revision+1,updatedAt:at,updatedBy:user});}
   else {record={id:`AGD:${randomUUID()}`,meetingId:m.id,organizationId:ORG,schemaVersion:1,...value,attachments:[],revision:1,createdAt:at,updatedAt:at,createdBy:user};db.meetingAgendaItems.push(record);}
   record.attachments??=[];
   for(const ref of removeAttachmentIds){const f=record.attachments.find(x=>x.id===ref);f.status='deleted';f.deletedAt=at;}
   for(const stage of stages){record.attachments.push({id:`ATT:${randomUUID()}`,fileName:stage.fileName,mimeType:stage.mimeType,size:stage.size,pathname:stage.pathname,status:'committed',createdAt:at});stage.status='attached';stage.agendaId=record.id;stage.attachedAt=at;}
   db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,actorRef:user,targetRef:record.id,action:id?'meeting.agenda.updated':'meeting.agenda.created',at});
   for(const stage of stages)db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,actorRef:user,targetRef:record.id,action:'meeting.agenda.attachment.added',at,fileName:stage.fileName});
   for(const ref of removeAttachmentIds)db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,actorRef:user,targetRef:record.id,action:'meeting.agenda.attachment.deleted',at,attachmentRef:ref});
   if(stages.length)db.meetingAgendaDraftUploads=db.meetingAgendaDraftUploads.filter(x=>!stagedUploadIds.includes(x.id));
   return decorated(db,record);
  });
 }
 async remove(id,user){return this.repo.mutate(db=>{const a=getAgenda(db,id);if(getMeeting(db,a.meetingId).status==='cancelled')fail('MEETING_CANCELLED','جلسه لغوشده است.',409);a.status='deleted';a.revision++;a.deletedAt=new Date().toISOString();db.auditLog??=[];db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,actorRef:user,targetRef:a.id,action:'meeting.agenda.deleted',at:a.deletedAt});return {ok:true};});}
 // Files are uploaded and confirmed *before* saving a new agenda. The draft
 // belongs to the authenticated user and meeting; saving atomically claims it.
 async prepareDraftUpload(input,user){
  const meetingId=clean(input?.meetingId,90),draftId=clean(input?.draftId,70),fileName=clean(input?.fileName,180).split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g,''),size=Number(input?.size),mimeType=clean(input?.mimeType,120)||'application/octet-stream';
  const ext=extFromName(fileName);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId))fail('UPLOAD_DRAFT_INVALID','شناسه پیش‌نویس بارگذاری نامعتبر است.');
  if(!fileName||!allowedExt.includes(ext)||!Number.isSafeInteger(size)||size<1||size>maxFileSize)fail('UPLOAD_INVALID','فایل باید دارای قالب مجاز و حداکثر ۲۰ مگابایت باشد.');
  const stageId=`STG:${randomUUID()}`,pathname=`meetings/${safeOrg}/${meetingId.slice(4)}/drafts/${draftId}/${stageId.slice(4)}.${ext}`;
  const at=new Date().toISOString(),expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  await this.repo.mutate(db=>{
   const m=getMeeting(db,meetingId);if(m.status==='cancelled')fail('MEETING_CANCELLED','جلسه لغوشده است.',409);
   db.meetingAgendaDraftUploads??=[];
   db.meetingAgendaDraftUploads=db.meetingAgendaDraftUploads.filter(x=>Date.parse(x.expiresAt)>Date.now()&&['intent','uploaded'].includes(x.status));
   const activeUploads=db.meetingAgendaDraftUploads.filter(x=>x.organizationId===ORG&&x.meetingId===meetingId&&x.draftId===draftId&&x.owner===user&&['intent','uploaded'].includes(x.status)&&Date.parse(x.expiresAt)>Date.now());
   if(activeUploads.length>=30)fail('ATTACHMENT_LIMIT','حداکثر ۳۰ پیوست برای هر دستور مجاز است.');
   db.meetingAgendaDraftUploads.push({id:stageId,organizationId:ORG,meetingId,draftId,owner:user,fileName,mimeType,size,pathname,status:'intent',createdAt:at,expiresAt});
  });
  try{
   const {issueSignedToken,presignUrl}=await this.blob();const validUntil=Date.now()+10*60*1000;
   const token=await issueSignedToken({pathname,operations:['put'],validUntil});
   const {presignedUrl}=await presignUrl(token,{pathname,operation:'put',validUntil,access:'private',addRandomSuffix:false});
   return {stageId,presignedUrl,validUntil,pathname};
  }catch(e){console.error('AGENDA_STAGE_SIGN',e?.message);fail('BLOB_UNAVAILABLE','دسترسی به فضای ذخیره‌سازی پیوست ممکن نشد.',503)}
 }
 // Prefer the SDK's authenticated server put() path for small private files.
 // A presigned browser PUT may return 2xx while the object cannot be read back
 // at the expected pathname. The SDK returns the committed object pathname.
 async directDraftUpload(input,user){
  const base64=input?.contentBase64;
  const declaredSize=Number(input?.size);
  if(!Number.isSafeInteger(declaredSize)||declaredSize<1||declaredSize>maxDirectUploadSize)
   fail('DIRECT_FILE_SIZE','ارسال مستقیم فقط برای فایل‌های حداکثر ۲ مگابایت مجاز است.',413);
  if(typeof base64!=='string'||base64.length>Math.ceil(maxDirectUploadSize/3)*4+8||
     !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))
   fail('DIRECT_FILE_INVALID','محتوای فایل بارگذاری‌شده معتبر نیست.',400);
  const buffer=Buffer.from(base64,'base64');
  if(buffer.length!==declaredSize)
   fail('DIRECT_FILE_MISMATCH','حجم واقعی فایل با اطلاعات اعلام‌شده تطابق ندارد.',400);
  const meetingId=clean(input?.meetingId,90),draftId=clean(input?.draftId,70);
  const fileName=clean(input?.fileName,180).split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g,'');
  const mimeType=clean(input?.mimeType,120)||'application/octet-stream';
  const ext=extFromName(fileName);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId)||
     !validId(meetingId,'MTG')||!fileName||!allowedExt.includes(ext))
   fail('DIRECT_FILE_METADATA','اطلاعات فایل یا جلسه معتبر نیست.',400);
  const stageId=`STG:${randomUUID()}`;
  const pathname=`meetings/${safeOrg}/${meetingId.slice(4)}/drafts/${draftId}/${stageId.slice(4)}.${ext}`;
  const at=new Date().toISOString(),expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  await this.repo.mutate(db=>{
   const meeting=getMeeting(db,meetingId);
   if(meeting.status==='cancelled')fail('MEETING_CANCELLED','جلسه لغو شده است.',409);
   db.meetingAgendaDraftUploads??=[];
   db.meetingAgendaDraftUploads=db.meetingAgendaDraftUploads.filter(x=>Date.parse(x.expiresAt)>Date.now()&&['intent','uploaded'].includes(x.status));
   const current=db.meetingAgendaDraftUploads.filter(x=>x.organizationId===ORG&&x.meetingId===meetingId&&x.draftId===draftId&&x.owner===user&&['intent','uploaded'].includes(x.status));
   if(current.length>=30)fail('ATTACHMENT_LIMIT','حداکثر ۳۰ پیوست برای هر دستور مجاز است.',409);
   db.meetingAgendaDraftUploads.push({id:stageId,organizationId:ORG,meetingId,draftId,owner:user,fileName,mimeType,size:declaredSize,pathname,status:'intent',createdAt:at,expiresAt});
  });
  let created=false;
  try{
   const blob=await this.blob();
   const result=await blob.put(pathname,buffer,{access:'private',addRandomSuffix:false,contentType:mimeType});
   created=true;
   if(result?.pathname!==pathname){
    console.error('AGENDA_DIRECT_UPLOAD_PATH_MISMATCH',{expected:pathname,actual:result?.pathname||null});
    fail('DIRECT_FILE_PATH_MISMATCH','مسیر ذخیره‌شده فایل با مسیر درخواست متفاوت است.',502);
   }
   // Server-originated SDK upload returns committed metadata. Ensure the same
   // SDK can read it back; do not attach unreadable files to an agenda.
   const read=await blob.get(pathname,{access:'private',useCache:false});
   if(read?.statusCode!==200||Number(read?.blob?.size)!==declaredSize){
    try{await read?.stream?.cancel?.()}catch{}
    console.error('AGENDA_DIRECT_UPLOAD_READBACK_FAILED',{status:read?.statusCode||null,size:read?.blob?.size??null});
    fail('DIRECT_FILE_UNREADABLE','فایل ذخیره شد، اما بازیابی آن از فضای خصوصی تأیید نشد.',503);
   }
   try{await read.stream?.cancel?.()}catch{}
   return await this.repo.mutate(db=>{
    const stage=(db.meetingAgendaDraftUploads||[]).find(x=>x.id===stageId&&x.organizationId===ORG&&x.owner===user&&x.status==='intent');
    if(!stage||stage.meetingId!==meetingId||stage.draftId!==draftId)
     fail('STAGED_UPLOAD_INVALID','شناسه پیش‌بارگذاری معتبر نیست.',409);
    stage.status='uploaded';stage.uploadedAt=new Date().toISOString();
    return {file:{id:stage.id,fileName:stage.fileName,size:stage.size,mimeType:stage.mimeType,status:'uploaded'},stageId:stage.id};
   });
  }catch(e){
   // This file was not attached; release the failed reservation so the same
   // draft can retry without accumulating 30 abandoned intent records.
   try{await this.repo.mutate(db=>{
    db.meetingAgendaDraftUploads=(db.meetingAgendaDraftUploads||[]).filter(x=>!(x.id===stageId&&x.organizationId===ORG&&x.owner===user&&x.status==='intent'));
   });}catch(cleanupError){console.error('AGENDA_DIRECT_STAGE_CLEANUP',cleanupError?.code||cleanupError?.name||'ERROR');}
   if(created){try{const {del}=await this.blob();await del?.(pathname)}catch(cleanupError){console.error('AGENDA_DIRECT_BLOB_CLEANUP',cleanupError?.code||cleanupError?.name||'ERROR');}}
   console.error('AGENDA_DIRECT_UPLOAD_FAILED',{code:e?.code||e?.name||'ERROR',created,message:String(e?.message||'').slice(0,160)});
   if(e instanceof AgendaError)throw e;
   fail('DIRECT_BLOB_UPLOAD_FAILED','انتقال مستقیم فایل به فضای ذخیره‌سازی انجام نشد.',503);
  }
 }
 async finishDraftUpload(input,user){
  const stageId=clean(input?.stageId,90),draftId=clean(input?.draftId,70),meetingId=clean(input?.meetingId,90);
  if(!validId(stageId,'STG'))fail('STAGE_ID_INVALID','شناسه فایل نامعتبر است.');
  const current=await this.repo.all(),stage=(current.meetingAgendaDraftUploads||[]).find(x=>x.id===stageId&&x.organizationId===ORG&&x.meetingId===meetingId&&x.draftId===draftId&&x.owner===user);
  if(!stage||!['intent','uploaded'].includes(stage.status)||Date.parse(stage.expiresAt)<Date.now())fail('STAGED_UPLOAD_INVALID','مجوز فایل منقضی شده یا فایل متعلق به این پیش‌نویس نیست.',409);
  getMeeting(current,meetingId);
  await verifyAgendaBlobUpload(await this.blob(),stage.pathname,stage.size);
  return this.repo.mutate(db=>{
   const found=(db.meetingAgendaDraftUploads||[]).find(x=>x.id===stageId&&x.organizationId===ORG&&x.meetingId===meetingId&&x.draftId===draftId&&x.owner===user);
   if(!found||!['intent','uploaded'].includes(found.status)||Date.parse(found.expiresAt)<Date.now())fail('STAGED_UPLOAD_INVALID','فایل دیگر مجاز به ثبت نیست.',409);
   found.status='uploaded';found.uploadedAt=new Date().toISOString();
   return {file:{id:found.id,fileName:found.fileName,size:found.size,mimeType:found.mimeType,status:'uploaded'}};
  });
 }
 async clearDraftUploads(input,user){
  const draftId=clean(input?.draftId,70),meetingId=clean(input?.meetingId,90),stageId=clean(input?.stageId,90);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId))fail('UPLOAD_DRAFT_INVALID','شناسه پیش‌نویس معتبر نیست.');
  if(stageId&&!validId(stageId,'STG'))fail('STAGE_ID_INVALID','شناسه فایل معتبر نیست.');
  const paths=await this.repo.mutate(db=>{
   getMeeting(db,meetingId);
   const stages=(db.meetingAgendaDraftUploads||[]).filter(x=>x.organizationId===ORG&&x.meetingId===meetingId&&x.draftId===draftId&&x.owner===user&&(!stageId||x.id===stageId)&&['intent','uploaded'].includes(x.status));
   const removed=new Set(stages.map(x=>x.id));db.meetingAgendaDraftUploads=db.meetingAgendaDraftUploads.filter(x=>!removed.has(x.id));
   return stages.map(x=>x.pathname);
  });
  if(paths.length){try{const {del}=await this.blob();await del(paths)}catch(e){console.error('AGENDA_STAGE_BLOB_CLEANUP',e?.message);/* records are already revoked; cleanup can retry separately */}}
  return {ok:true,removed:paths.length};
 }
 async uploadUrl(input){
  const meetingId=clean(input.meetingId,90),agendaId=clean(input.agendaId,90),filename=clean(input.fileName,180).split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g,''),size=Number(input.size||0),mimeType=clean(input.mimeType,120)||'application/octet-stream',ext=extFromName(filename);
  if(!filename||!allowedExt.includes(ext)||!Number.isSafeInteger(size)||size<1||size>maxFileSize)fail('UPLOAD_INVALID','فایل انتخابی باید یکی از قالب‌های مجاز و حداکثر ۲۰ مگابایت باشد.');
  const db=await this.repo.all();const a=getAgenda(db,agendaId);if(a.meetingId!==meetingId)fail('AGENDA_MEETING_MISMATCH','دستور متعلق به جلسه انتخابی نیست.',409);if(getMeeting(db,meetingId).status==='cancelled')fail('MEETING_CANCELLED','جلسه لغو شده است.',409);
  if((a.attachments||[]).filter(x=>x.status!=='deleted').length>=30)fail('ATTACHMENT_LIMIT','حداکثر ۳۰ پیوست برای هر دستور مجاز است.');
  const pathname=`meetings/${safeOrg}/${meetingId.slice(4)}/${agendaId.slice(4)}/${randomUUID()}.${ext}`;
  const validUntil=Date.now()+10*60*1000;
  try{
   const {issueSignedToken,presignUrl}=await import('@vercel/blob');
   const token=await issueSignedToken({pathname,operations:['put'],validUntil});
   const {presignedUrl}=await presignUrl(token,{pathname,operation:'put',validUntil,access:'private',addRandomSuffix:false});
   return {presignedUrl,pathname,fileName:filename,mimeType,size,validUntil};
  }catch(e){console.error('MEETING_AGENDA_BLOB_SIGN',e?.message);fail('BLOB_UNAVAILABLE','فضای ذخیره‌سازی پیوست موقتاً در دسترس نیست.',503);}
 }
 async attach(input,user){
  const agendaId=clean(input?.agendaId,90),meetingId=clean(input?.meetingId,90),pathname=clean(input?.pathname,500),filename=clean(input?.fileName,180).split(/[\\/]/).pop(),size=Number(input?.size),ext=extFromName(filename);
  const prefix=`meetings/${safeOrg}/${meetingId.slice(4)}/${agendaId.slice(4)}/`;
  if(!validId(agendaId,'AGD')||!validId(meetingId,'MTG')||!pathname.startsWith(prefix)||!new RegExp('^[0-9a-f-]{36}\\.'+ext+'$','i').test(pathname.slice(prefix.length))||!allowedExt.includes(ext)||!Number.isSafeInteger(size)||size<1||size>maxFileSize)fail('ATTACHMENT_INVALID','اطلاعات پیوست ارسالی معتبر نیست.');
  const current=await this.repo.all(),a=getAgenda(current,agendaId);
  if(a.meetingId!==meetingId)fail('AGENDA_MEETING_MISMATCH','دستور متعلق به جلسه نیست.',409);
  // Verify actual presence and length before committing untrusted client metadata.
  await verifyAgendaBlobUpload(await this.blob(),pathname,size);
  return this.repo.mutate(db=>{const record=getAgenda(db,agendaId);if(record.meetingId!==meetingId)fail('AGENDA_MEETING_MISMATCH','جلسه نامعتبر است.',409);if(getMeeting(db,meetingId).status==='cancelled')fail('MEETING_CANCELLED','جلسه لغو شده است.',409);record.attachments??=[];const existing=record.attachments.find(f=>f.pathname===pathname);if(existing)return {item:decorated(db,record)};if(record.attachments.filter(f=>f.status!=='deleted').length>=30)fail('ATTACHMENT_LIMIT','حداکثر ۳۰ پیوست قابل ثبت است.');const at=new Date().toISOString();record.attachments.push({id:`ATT:${randomUUID()}`,fileName:filename,mimeType:clean(input.mimeType,100),size,pathname,status:'committed',createdAt:at});record.revision++;record.updatedAt=at;db.auditLog??=[];db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,targetRef:record.id,actorRef:user,action:'meeting.agenda.attachment.added',at});return {item:decorated(db,record)};});
 }
 async removeAttachment(agendaId,attachmentId,user){return this.repo.mutate(db=>{const a=getAgenda(db,agendaId);const f=(a.attachments||[]).find(x=>x.id===attachmentId&&x.status!=='deleted');if(!f)fail('ATTACHMENT_NOT_FOUND','پیوست یافت نشد.',404);f.status='deleted';f.deletedAt=new Date().toISOString();a.revision++;a.updatedAt=f.deletedAt;db.auditLog??=[];db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,targetRef:a.id,actorRef:user,action:'meeting.agenda.attachment.deleted',at:f.deletedAt});return {item:decorated(db,a)};});}
 async download(req,res,agendaId,attachmentId){const db=await this.repo.all(),a=getAgenda(db,agendaId);const file=(a.attachments||[]).find(x=>x.id===attachmentId&&x.status!=='deleted');if(!file)fail('ATTACHMENT_NOT_FOUND','پیوست یافت نشد.',404);
  try{const {get}=await import('@vercel/blob');const blob=await get(file.pathname,{access:'private',useCache:false});if(!blob?.stream)fail('ATTACHMENT_MISSING','محتوای پیوست یافت نشد.',404);
   const name=String(file.fileName).replace(/[\r\n"]/g,'_');res.statusCode=200;res.setHeader('content-type',file.mimeType||'application/octet-stream');res.setHeader('content-disposition',`attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(name)}`);res.setHeader('cache-control','private, no-store');
   for await(const chunk of blob.stream){if(!res.write(Buffer.from(chunk)))await new Promise(resolve=>res.once('drain',resolve))}res.end();return;
  }catch(e){if(res.headersSent){res.destroy(e);return}if(e instanceof AgendaError)throw e;console.error('AGENDA_DOWNLOAD',e?.message);fail('BLOB_READ_FAILED','دریافت فایل ممکن نشد.',503)}
 }
}
export async function handleMeetingAgendaApi(req,res){
 const session=requireAuthenticated(req,res);if(!session)return;
 const path=new URL(req.url,'https://local'),resource=path.searchParams.get('resource')||'meetings',method=req.method;
 if(!['GET','POST','DELETE'].includes(method))return send(res,405,{code:'METHOD_NOT_ALLOWED',message:'روش درخواست نامعتبر است.'});
 if(method!=='GET'){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return send(res,415,{code:'JSON_REQUIRED',message:'درخواست باید JSON باشد.'});
  const origin=String(req.headers.origin||''),host=String(req.headers['x-forwarded-host']||req.headers.host||'');if(origin){try{if(new URL(origin).host!==host)return send(res,403,{code:'ORIGIN_DENIED',message:'مبدأ درخواست معتبر نیست.'})}catch{return send(res,403,{code:'ORIGIN_DENIED',message:'مبدأ درخواست نامعتبر است.'})}}
 }
 if(repositoryMode()==='ephemeral-memory')return send(res,503,{code:'DURABLE_STORAGE_REQUIRED',message:'برای دستورجلسات پایگاه داده دائمی الزامی است.'});
 let input={};if(method!=='GET'){try{input=plain(req.body)?req.body:JSON.parse(req.body||'{}')}catch{return send(res,400,{code:'JSON_INVALID',message:'فرمت درخواست معتبر نیست.'})}}
 try{
  const svc=new MeetingAgendaService(createRepository());const user=`ADMIN:${session.u}`;
  if(resource==='meetings'&&method==='GET')return send(res,200,await svc.meetings({query:path.searchParams.get('q')||'',from:path.searchParams.get('from')||'',to:path.searchParams.get('to')||'',status:path.searchParams.get('status')||'active'}));
  if(resource==='items'&&method==='GET')return send(res,200,await svc.list(path.searchParams.get('meetingId')||''));
  if(resource==='documents'&&method==='GET')return send(res,200,await svc.documents(path.searchParams.get('q')||''));
  if(resource==='save'&&method==='POST')return send(res,200,{item:await svc.save(input,user)});
  if(resource==='remove'&&method==='POST')return send(res,200,await svc.remove(input.id,user));
  if(resource==='upload-url'&&method==='POST')return send(res,200,input?.draftId?await svc.prepareDraftUpload(input,user):await svc.uploadUrl(input));
  if(resource==='direct-upload'&&method==='POST')return send(res,200,await svc.directDraftUpload(input,user));
  if(resource==='finish-upload'&&method==='POST')return send(res,200,await svc.finishDraftUpload(input,user));
  if(resource==='clear-uploads'&&method==='POST')return send(res,200,await svc.clearDraftUploads(input,user));
  if(resource==='attach'&&method==='POST')return send(res,200,await svc.attach(input,user));
  if(resource==='remove-attachment'&&method==='POST')return send(res,200,await svc.removeAttachment(input.agendaId,input.attachmentId,user));
  if(resource==='download'&&method==='GET')return svc.download(req,res,path.searchParams.get('agendaId'),path.searchParams.get('attachmentId'));
  return send(res,404,{code:'ENDPOINT_UNKNOWN',message:'مسیر دستور جلسات یافت نشد.'});
 }catch(e){console.error('MEETING_AGENDA_API',e.code||e.name,e.message);return send(res,e instanceof AgendaError?e.status:500,{code:e.code||'AGENDA_ERROR',message:errMessage(e)})}
}
