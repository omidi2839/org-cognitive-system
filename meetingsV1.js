import { randomUUID } from 'node:crypto';

export class MeetingValidationError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
const fail=(code,message,status)=>{ throw new MeetingValidationError(code,message,status); };
const text=(v,max=220)=>String(v??'').trim().slice(0,max+1);
const dateOk=v=>/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v+'T12:00:00Z').getTime()) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const timeOk=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const roles=new Set(['chair','secretary','member','expert','advisor','presenter','guest','observer']);
const kinds=new Set(['planned','anticipated']);
const statuses=new Set(['tentative','scheduled','completed','cancelled']);
const types=new Set(['in_person','online','hybrid']);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);

export function normalizeMeeting(input){
  if(!plain(input)) fail('INVALID_BODY','اطلاعات جلسه معتبر نیست.');
  const title=text(input.title,220), description=text(input.description,4000);
  if(!title||title.length>220) fail('TITLE_REQUIRED','عنوان یا موضوع جلسه باید وارد شود (حداکثر ۲۲۰ نویسه).');
  const kind=text(input.kind,20)||'planned';
  if(!kinds.has(kind)) fail('KIND_INVALID','نوع برنامه‌ریزی جلسه معتبر نیست.');
  const date=text(input.startDate,10),startTime=text(input.startTime,5),endTime=text(input.endTime,5);
  if(!date&&kind==='planned') fail('START_DATE_REQUIRED','برای جلسه برنامه‌ریزی‌شده تاریخ الزامی است.');
  if(date&&!dateOk(date))fail('DATE_INVALID','تاریخ جلسه معتبر نیست.');
  if(date&&(!timeOk(startTime)||!timeOk(endTime)))fail('TIME_INVALID','زمان شروع و پایان باید وارد شود.');
  if(date&&endTime<=startTime)fail('END_BEFORE_START','ساعت پایان باید بعد از ساعت شروع باشد.');
  const meetingType=text(input.meetingType,20)||'in_person';
  if(!types.has(meetingType))fail('MEETING_TYPE_INVALID','شیوه برگزاری معتبر نیست.');
  const status=text(input.status,20)||(date?'scheduled':'tentative');
  if(!statuses.has(status))fail('STATUS_INVALID','وضعیت جلسه معتبر نیست.');
  if(status==='scheduled'&&!date)fail('SCHEDULE_REQUIRES_DATE','جلسه قطعی باید تاریخ داشته باشد.');
  const rawParticipants=input.participants;
  if(!Array.isArray(rawParticipants)||!rawParticipants.length||rawParticipants.length>100)fail('PARTICIPANTS_REQUIRED','حداقل یک شرکت‌کننده و حداکثر ۱۰۰ شرکت‌کننده ثبت کنید.');
  const participants=rawParticipants.map((p,i)=>{
    if(!plain(p))fail('PARTICIPANT_INVALID',`اطلاعات شرکت‌کننده ${i+1} معتبر نیست.`);
    const name=text(p.name,140),entityName=text(p.entityName,180),position=text(p.position,180),role=text(p.role,24)||'member';
    const entityType=text(p.entityType,20)||'person';
    if(!name||name.length>140)fail('PARTICIPANT_NAME_REQUIRED',`نام شرکت‌کننده ${i+1} لازم است.`);
    if(!['person','legal_representative'].includes(entityType))fail('PARTICIPANT_ENTITY_INVALID','نوع شخصیت شرکت‌کننده معتبر نیست.');
    if(entityType==='legal_representative'&&!entityName)fail('ENTITY_REQUIRED',`نام شخصیت حقوقی برای شرکت‌کننده ${i+1} لازم است.`);
    if(!roles.has(role))fail('ROLE_INVALID','نقش شرکت‌کننده معتبر نیست.');
    return {id:text(p.id,90)||`PART:${randomUUID()}`,name,entityType,entityName,position,role};
  });
  if(participants.filter(p=>p.role==='chair').length>1)fail('MULTIPLE_CHAIRS','در این نسخه فقط یک مدیر جلسه می‌توان تعیین کرد.');
  if(participants.filter(p=>p.role==='secretary').length>1)fail('MULTIPLE_SECRETARIES','در این نسخه فقط یک دبیر جلسه می‌توان تعیین کرد.');
  const organizer=text(input.organizer,180),location=text(input.location,240);
  const meetingLink=text(input.meetingLink,500);
  if(meetingLink){let u;try{u=new URL(meetingLink)}catch{fail('INVALID_LINK','پیوند برگزاری جلسه معتبر نیست.');}if(!['https:','http:'].includes(u.protocol))fail('INVALID_LINK','پیوند جلسه باید HTTP یا HTTPS باشد.');}
  const notes=text(input.notes,2000);
  return {title,description,kind,startDate:date||null,startTime:date?startTime:null,endTime:date?endTime:null,
    startAt:date?`${date}T${startTime}:00`:null,scheduledAt:date?`${date}T${startTime}:00`:null,
    timezone:'Asia/Tehran',meetingType,status,participants,organizer,location,meetingLink,notes};
}
export class MeetingsV1Service {
  constructor(repository){this.repo=repository;}
  async list(actor,{from,to,includeUnscheduled=true}={}){
    const db=await this.repo.all();
    const records=(db.meetings||[]).filter(x=>x.organizationId===actor.organizationId&&x.schemaVersion===1);
    const filtered=records.filter(x=>!x.startDate?includeUnscheduled:(!from||x.startDate>=from)&&(!to||x.startDate<=to))
      .sort((a,b)=>String(a.startAt||'9999').localeCompare(String(b.startAt||'9999'))||String(a.id).localeCompare(String(b.id)));
    return {items:filtered,summary:{total:filtered.length,scheduled:filtered.filter(x=>x.startDate&&x.status!=='cancelled').length,
      unscheduled:filtered.filter(x=>!x.startDate).length,cancelled:filtered.filter(x=>x.status==='cancelled').length},timezone:'Asia/Tehran'};
  }
  async create(actor,input){
    const value=normalizeMeeting(input),at=new Date().toISOString();
    const record={id:`MTG:${randomUUID()}`,organizationId:actor.organizationId,createdBy:actor.personId,schemaVersion:1,
      ...value,revision:1,createdAt:at,updatedAt:at};
    await this.repo.mutate(db=>{db.meetings=db.meetings||[];db.auditLog=db.auditLog||[];
      db.meetings.push(record);db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:actor.organizationId,
        actorRef:actor.personId,action:'meeting.created',targetRef:record.id,at});});
    return record;
  }
  async update(actor,id,input){
    if(!id||!/^MTG:[0-9a-f-]{36}$/i.test(id))fail('MEETING_ID_INVALID','شناسه جلسه معتبر نیست.');
    if(!plain(input)||!Number.isSafeInteger(input.revision)||input.revision<1)fail('REVISION_REQUIRED','نسخه رکورد برای جلوگیری از تداخل ویرایش لازم است.');
    const value=normalizeMeeting(input),at=new Date().toISOString();
    return this.repo.mutate(db=>{
      const record=(db.meetings||[]).find(x=>x.id===id&&x.organizationId===actor.organizationId);
      if(!record)fail('MEETING_NOT_FOUND','جلسه مورد نظر یافت نشد.',404);
      if(record.revision!==input.revision)fail('MEETING_CONFLICT','جلسه توسط فرد دیگری تغییر کرده است. ابتدا فهرست را تازه‌سازی کنید.',409);
      Object.assign(record,value,{revision:record.revision+1,updatedAt:at,updatedBy:actor.personId});
      db.auditLog=db.auditLog||[];db.auditLog.push({id:`AUD:${randomUUID()}`,organizationId:actor.organizationId,
        actorRef:actor.personId,action:'meeting.updated',targetRef:record.id,at});
      return structuredClone(record);
    });
  }
}
