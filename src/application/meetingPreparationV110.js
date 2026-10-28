// SINA Meetings Preparation V1.10 — implemented inside the existing api/index.js.
// Only verified server-side sessions may approve and dispatch invitations.
import {createHash,randomUUID} from 'node:crypto';
import {createRepository,repositoryMode} from '../infrastructure/repositoryFactory.js';
import {requireAuthenticated} from '../infrastructure/authSession.js';

const ORG='ORG:SYN-001';
const validMeeting=x=>/^MTG:[0-9a-f-]{36}$/i.test(String(x||''));
const normal=x=>String(x??'').trim();
const clip=(x,n)=>normal(x).slice(0,n);
const validEmail=x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)&&x.length<=250;
const validPhone=x=>/^\+?[0-9]{8,15}$/.test(x.replace(/[\s()\-]/g,''));
const safe=a=>JSON.parse(JSON.stringify(a));
const date=()=>new Date().toISOString();
const hash=(m,items)=>createHash('sha256').update(JSON.stringify({
 id:m.id,title:m.title,description:m.description,startDate:m.startDate,startTime:m.startTime,endTime:m.endTime,location:m.location,meetingType:m.meetingType,meetingLink:m.meetingLink,organizer:m.organizer,status:m.status,
 participants:(m.participants||[]).map(p=>[p.id,p.name,p.role,p.position,p.entityName,p.entityType]),
 agenda:items.map(a=>[a.id,a.revision,a.title,a.description,a.presenter,(a.documentRefs||[]).slice().sort(),(a.attachments||[]).filter(f=>f.status!=='deleted').map(f=>[f.id,f.size,f.pathname]).sort((x,y)=>String(x[0]).localeCompare(String(y[0])))])
})).digest('hex');
export class PreparationError extends Error{constructor(code,message,status=400){super(message);this.code=code;this.status=status}}
function fail(code,message,status){throw new PreparationError(code,message,status)}
function records(db,id){
 if(!validMeeting(id))fail('MEETING_ID_INVALID','شناسه جلسه معتبر نیست.');
 const meeting=(db.meetings||[]).find(m=>m.id===id&&m.organizationId===ORG&&m.schemaVersion===1);
 if(!meeting)fail('MEETING_NOT_FOUND','جلسه یافت نشد.',404);
 const agendas=(db.meetingAgendaItems||[]).filter(a=>a.meetingId===id&&a.organizationId===ORG&&a.status!=='deleted').sort((a,b)=>(a.order||0)-(b.order||0));
 return {meeting,agendas};
}
function ready(m,agendas){const problems=[];if(m.status==='cancelled')problems.push('جلسه لغو شده است.');if(!m.startDate||!m.startTime)problems.push('تاریخ و ساعت جلسه قطعی نیست.');if(!(m.participants||[]).length)problems.push('شرکت‌کننده‌ای ثبت نشده است.');if(!agendas.length)problems.push('حداقل یک دستور جلسه لازم است.');return problems}
function mapRecords(db,id){const {meeting,agendas}=records(db,id);const docs=new Map((db.documents||[]).filter(d=>d.organizationId===ORG&&d.status!=='deleted').map(d=>[d.id,d]));
 const agendaItems=agendas.map(a=>({id:a.id,title:a.title,description:a.description||'',presenter:a.presenter||'',revision:a.revision,documents:(a.documentRefs||[]).map(ref=>docs.get(ref)).filter(Boolean).map(d=>({id:d.id,title:d.title,documentNumber:d.documentNumber||'',documentType:d.documentType||''})),attachments:(a.attachments||[]).filter(x=>x.status!=='deleted').map(x=>({id:x.id,fileName:x.fileName,size:x.size||0,download:`/api/v1/meeting-agendas?resource=download&agendaId=${encodeURIComponent(a.id)}&attachmentId=${encodeURIComponent(x.id)}`}))}));
 const prep=(db.meetingPreparations||[]).find(x=>x.meetingId===id&&x.organizationId===ORG)||null;
 const fingerprint=hash(meeting,agendas),isCurrent=prep?.approvedFingerprint===fingerprint;
 const status=prep&&((prep.status==='approved'&& !isCurrent)||(prep.status==='submitted'&&prep.submittedFingerprint!==fingerprint))?'stale':prep?.status||'draft';
 return {meeting:safe({id:meeting.id,title:meeting.title,description:meeting.description||'',startDate:meeting.startDate,startTime:meeting.startTime,endTime:meeting.endTime,meetingType:meeting.meetingType,organizer:meeting.organizer,location:meeting.location,meetingLink:meeting.meetingLink,status:meeting.status,participants:meeting.participants||[]}),agendas:agendaItems,preparation:prep?{status,version:prep.version,submittedAt:prep.submittedAt||null,submittedBy:prep.submittedBy||null,approvedAt:prep.approvedAt||null,approvedBy:prep.approvedBy||null,approvalNote:prep.approvalNote||'',reviewNote:prep.reviewNote||'',contacts:safe(prep.contacts||{}),approvalCurrent:isCurrent,history:(prep.history||[]).slice(-15),notifications:(prep.notifications||[]).slice(-100)}:{status:'draft',version:0,contacts:{},notifications:[],history:[],approvalCurrent:false},problems:ready(meeting,agendas),fingerprint};
}
const authorized=session=>['system_admin','admin','manager','meeting_manager'].includes(String(session?.role||''));
function ensureManager(session){if(!authorized(session))fail('MANAGER_REQUIRED','فقط مدیر دارای مجوز می‌تواند جلسه را تأیید یا دعوت‌نامه ارسال کند.',403)}
function audit(db,actor,action,id){db.auditLog??=[];db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:ORG,actorRef:actor,action,targetRef:id,at:date()})}
function prepFor(db,id){db.meetingPreparations??=[];let p=db.meetingPreparations.find(x=>x.organizationId===ORG&&x.meetingId===id);if(!p){p={id:`MPR:${randomUUID()}`,organizationId:ORG,meetingId:id,status:'draft',version:0,history:[],contacts:{},notifications:[],approvedFingerprint:null};db.meetingPreparations.push(p)}return p}
function verifyRevision(p,input){const rev=Number(input?.version);if(!Number.isInteger(rev)||rev!==p.version)fail('PREPARATION_CONFLICT','اطلاعات آمادگی توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه‌سازی کنید.',409)}
const record=(p,action,actor,detail='')=>{p.version++;p.history.push({action,actor,at:date(),detail:clip(detail,700)});if(p.history.length>100)p.history=p.history.slice(-100)};
function renderInvitation(m,agendas,note=''){
 const kind=m.meetingType==='online'?'مجازی':m.meetingType==='hybrid'?'ترکیبی':'حضوری';
 const localDate=m.startDate?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(m.startDate+'T12:00:00Z')):'تعیین نشده';
 return `دعوت به جلسه: ${m.title}\nتاریخ: ${localDate}، ساعت: ${m.startTime||'نامشخص'} تا ${m.endTime||'نامشخص'}\nشیوه: ${kind}${m.location?'\nمکان: '+m.location:''}\nدستور جلسه:\n${agendas.map((a,i)=>`${i+1}. ${a.title}`).join('\n')||'ثبت نشده'}${note?'\nتوضیح دبیر: '+note:''}\nبرای مشاهده مستندات وارد سامانه سینا شوید. پیوست‌های محرمانه به صورت عمومی ارسال نمی‌شوند.`;
}
function modes(){return {internal:{available:true,label:'ثبت اعلان داخلی (بدون تحویل به حساب شخص)'},email:{available:Boolean(process.env.RESEND_API_KEY&&process.env.MEETING_EMAIL_FROM),label:'ایمیل از طریق Resend'},sms:{available:Boolean(process.env.KAVENEGAR_API_KEY),label:'پیامک از طریق کاوه‌نگار'},whatsapp:{available:false,label:'واتساپ، اشتراک‌گذاری دستی'}}}
async function sendTransport(channel,recipient,message,notificationId,{fetcher=fetch}={}){
 if(channel==='internal')return {status:'queued_internal',providerId:null};
 if(channel==='email'){
  if(!process.env.RESEND_API_KEY||!process.env.MEETING_EMAIL_FROM)return {status:'not_configured'};
  const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':notificationId,'User-Agent':'SINA-Meeting-Invitations/1.0'},body:JSON.stringify({from:process.env.MEETING_EMAIL_FROM,to:[recipient],subject:'دعوت به جلسه سازمانی',text:message}),signal:AbortSignal.timeout(12000)});
  const data=await response.json().catch(()=>({}));if(!response.ok||!data.id)throw new Error('EMAIL_PROVIDER_'+response.status);
  return {status:'accepted_by_provider',providerId:String(data.id)};
 }
 if(channel==='sms'){
  if(!process.env.KAVENEGAR_API_KEY)return {status:'not_configured'};
  const url=`https://api.kavenegar.com/v1/${encodeURIComponent(process.env.KAVENEGAR_API_KEY)}/sms/send.json`;
  const body=new URLSearchParams({receptor:recipient,message:message.slice(0,900)});if(process.env.KAVENEGAR_SENDER)body.set('sender',process.env.KAVENEGAR_SENDER);
  const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(12000)});
  const data=await response.json().catch(()=>({}));if(!response.ok||data?.return?.status!==200)throw new Error('SMS_PROVIDER_'+(data?.return?.status||response.status));
  return {status:'accepted_by_provider',providerId:String(data.entries?.[0]?.messageid||'')};
 }
 fail('CHANNEL_INVALID','روش ارسال انتخاب‌شده معتبر نیست.');
}
export class MeetingPreparationService {
 constructor(repository,{transport=sendTransport}={}){this.repo=repository;this.transport=transport}
 async list(){const db=await this.repo.all(),items=(db.meetings||[]).filter(m=>m.organizationId===ORG&&m.schemaVersion===1&&m.status!=='cancelled');return {items:items.map(m=>{const x=mapRecords(db,m.id);return {id:m.id,title:m.title,startDate:m.startDate,startTime:m.startTime,participantCount:m.participants?.length||0,agendaCount:x.agendas.length,status:x.preparation.status,problems:x.problems.length}}).sort((a,b)=>(a.startDate||'9999').localeCompare(b.startDate||'9999')),channels:modes()}}
 async detail(id){const db=await this.repo.all();return {...mapRecords(db,id),channels:modes()}}
 async contacts(input,session){ensureManager(session);const id=input?.meetingId;return this.repo.mutate(db=>{const {meeting}=records(db,id),p=prepFor(db,id);verifyRevision(p,input);const personIds=new Set((meeting.participants||[]).map(x=>x.id)),data=input?.contacts;if(!Array.isArray(data)||data.length>100)fail('CONTACTS_INVALID','اطلاعات تماس معتبر نیست.');const next={...p.contacts};for(const c of data){if(!personIds.has(c.participantId))fail('PARTICIPANT_NOT_FOUND','شرکت‌کننده انتخاب‌شده در جلسه وجود ندارد.',409);const email=clip(c.email,250),phone=clip(c.phone,30).replace(/[\s()\-]/g,'');if(email&&!validEmail(email))fail('EMAIL_INVALID','نشانی ایمیل معتبر نیست.');if(phone&&!validPhone(phone))fail('PHONE_INVALID','شماره همراه معتبر نیست.');next[c.participantId]={email,phone}}p.contacts=next;record(p,'contacts.updated',session.u);audit(db,session.u,'meeting.preparation.contacts',id);return {version:p.version,contacts:safe(p.contacts)}})}
 async submit(input,session){ensureManager(session);const id=input?.meetingId;return this.repo.mutate(db=>{const {meeting,agendas}=records(db,id),p=prepFor(db,id);verifyRevision(p,input);const problems=ready(meeting,agendas);if(problems.length)fail('NOT_READY',problems.join(' '),409);p.status='submitted';p.submittedFingerprint=hash(meeting,agendas);p.submittedBy=session.u;p.submittedAt=date();p.approvedFingerprint=null;p.approvalNote='';record(p,'submitted',session.u);audit(db,session.u,'meeting.preparation.submitted',id);return {version:p.version,status:p.status}})}
 async review(input,session){ensureManager(session);const id=input?.meetingId,decision=input?.decision;if(!['approve','changes'].includes(decision))fail('DECISION_INVALID','نتیجه بررسی معتبر نیست.');const note=clip(input.note,1200);if(decision==='changes'&&!note)fail('REVIEW_NOTE_REQUIRED','برای بازگشت جهت اصلاح، دلیل باید ثبت شود.');return this.repo.mutate(db=>{const {meeting,agendas}=records(db,id),p=prepFor(db,id);verifyRevision(p,input);if(p.status!=='submitted')fail('NOT_SUBMITTED','جلسه ابتدا باید برای بررسی ارسال شود.',409);if(p.submittedFingerprint!==hash(meeting,agendas))fail('SUBMITTED_CONTENT_CHANGED','محتوا پس از ارسال برای بررسی تغییر کرده است؛ لازم است دوباره برای تأیید ارسال شود.',409);if(decision==='approve'){const problems=ready(meeting,agendas);if(problems.length)fail('NOT_READY',problems.join(' '),409);p.status='approved';p.approvedBy=session.u;p.approvedAt=date();p.approvedFingerprint=hash(meeting,agendas);p.approvalNote=note;p.reviewNote='';}else{p.status='changes_requested';p.approvedFingerprint=null;p.reviewNote=note;}record(p,decision==='approve'?'approved':'changes_requested',session.u,note);audit(db,session.u,decision==='approve'?'meeting.preparation.approved':'meeting.preparation.changes_requested',id);return {version:p.version,status:p.status}})}
 async dispatch(input,session){ensureManager(session);const {meetingId,participantId,channel}=input||{};if(!['email','sms','internal'].includes(channel))fail('CHANNEL_INVALID','کانال اطلاع‌رسانی معتبر نیست.');const requestId=clip(input?.requestId,90);if(!/^[a-f0-9-]{36}$/i.test(requestId))fail('REQUEST_ID_INVALID','شناسه یکتای درخواست لازم است.');let job,newlyCreated=false;
  await this.repo.mutate(db=>{const {meeting,agendas}=records(db,meetingId),p=prepFor(db,meetingId);if(p.status!=='approved'||p.approvedFingerprint!==hash(meeting,agendas))fail('APPROVAL_STALE','محتوای جلسه پس از تأیید تغییر کرده یا هنوز تأیید نشده است.',409);const person=(meeting.participants||[]).find(x=>x.id===participantId);if(!person)fail('PARTICIPANT_NOT_FOUND','عضو جلسه یافت نشد.',404);const existing=p.notifications.find(n=>n.requestId===requestId);if(existing){job=safe(existing);return;}const ct=p.contacts[participantId]||{},recipient=channel==='email'?ct.email:channel==='sms'?ct.phone:person.id;
   if(channel==='email'&&!validEmail(recipient||''))fail('EMAIL_MISSING','برای این عضو ایمیل معتبر ثبت نشده است.',409);if(channel==='sms'&&!validPhone(recipient||''))fail('PHONE_MISSING','برای این عضو تلفن معتبر ثبت نشده است.',409);
   newlyCreated=true;const notification={id:`NTF:${randomUUID()}`,requestId,participantId,participantName:person.name,channel,recipient:channel==='internal'?'حساب داخلی (در انتظار اتصال)':recipient,status:'sending',createdAt:date(),snapshot:p.approvedFingerprint};p.notifications.push(notification);audit(db,session.u,'meeting.invitation.requested',meetingId);job=safe(notification);});
  if(!newlyCreated)return {notification:job};
  const db=await this.repo.all();const {meeting,agendas}=records(db,meetingId);const message=renderInvitation(meeting,agendas);let outcome;
  try{outcome=await this.transport(channel,job.recipient,message,job.id)}catch(e){outcome={status:'unknown',errorCode:clip(e?.message||'PROVIDER_FAILED',120)};console.error('MEETING_INVITATION_PROVIDER',{channel,code:outcome.errorCode})}
  return this.repo.mutate(db2=>{const p=prepFor(db2,meetingId),n=p.notifications.find(x=>x.id===job.id);if(n?.status==='sending'){n.status=outcome.status;n.providerId=outcome.providerId||null;n.errorCode=outcome.errorCode||null;n.processedAt=date();audit(db2,session.u,'meeting.invitation.'+outcome.status,meetingId)}return {notification:safe(n)}});
 }
 async invitation(id){const db=await this.repo.all(),{meeting,agendas}=records(db,id);return {text:renderInvitation(meeting,agendas)}}
}
function respond(res,status,data){res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.end(JSON.stringify(data))}
export async function handleMeetingPreparationApi(req,res){const session=requireAuthenticated(req,res);if(!session)return;if(repositoryMode()==='ephemeral-memory')return respond(res,503,{code:'DURABLE_REQUIRED',message:'پایگاه داده دائمی لازم است.'});const url=new URL(req.url,'https://local'),method=req.method,resource=url.searchParams.get('resource')||'list';
 if(method!=='GET'&&method!=='POST')return respond(res,405,{code:'METHOD_NOT_ALLOWED'});
 if(method==='POST'){if(!String(req.headers['content-type']||'').startsWith('application/json'))return respond(res,415,{code:'JSON_REQUIRED'});const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;if(origin){try{if(new URL(origin).host!==host)return respond(res,403,{code:'ORIGIN_DENIED'})}catch{return respond(res,403,{code:'ORIGIN_DENIED'})}}}
 let input={};try{input=req.body&&typeof req.body==='object'?req.body:JSON.parse(req.body||'{}')}catch{return respond(res,400,{code:'INVALID_JSON'})}
 const svc=new MeetingPreparationService(createRepository());try{
  if(method==='GET'&&resource==='list')return respond(res,200,await svc.list());
  if(method==='GET'&&resource==='detail')return respond(res,200,await svc.detail(url.searchParams.get('meetingId')));
  if(method==='GET'&&resource==='invitation')return respond(res,200,await svc.invitation(url.searchParams.get('meetingId')));
  if(method==='POST'&&resource==='contacts')return respond(res,200,await svc.contacts(input,session));
  if(method==='POST'&&resource==='submit')return respond(res,200,await svc.submit(input,session));
  if(method==='POST'&&resource==='review')return respond(res,200,await svc.review(input,session));
  if(method==='POST'&&resource==='dispatch')return respond(res,200,await svc.dispatch(input,session));
  return respond(res,404,{code:'NOT_FOUND',message:'عملیات یافت نشد.'});
 }catch(e){console.error('MEETING_PREPARATION_API',e.code||e.name,e.message);return respond(res,e instanceof PreparationError?e.status:500,{code:e.code||'INTERNAL_ERROR',message:e instanceof PreparationError?e.message:'خطای داخلی، جزئیات در گزارش سرور ثبت شد.'})}
}
