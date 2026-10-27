import { createRepository, repositoryMode } from '../src/infrastructure/repositoryFactory.js';
import { requireAuthenticated } from '../src/infrastructure/authSession.js';
import { MeetingsV1Service, MeetingValidationError } from '../src/application/meetingsV1.js';

const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.end(JSON.stringify(data));};
const readBody=req=>{if(req.body&&typeof req.body==='object')return req.body;try{return JSON.parse(req.body||'{}')}catch{return {}}};

export default async function handler(req,res){
  const session=requireAuthenticated(req,res);
  if(!session)return;
  if(!['GET','POST','PUT'].includes(req.method))return send(res,405,{code:'METHOD_NOT_ALLOWED',message:'روش درخواست پشتیبانی نمی‌شود.'});
  if(req.method!=='GET'){
    const ct=String(req.headers['content-type']||'').toLowerCase();
    if(!ct.startsWith('application/json'))return send(res,415,{code:'JSON_REQUIRED',message:'فرمت درخواست باید JSON باشد.'});
    const origin=String(req.headers.origin||'');
    const host=String(req.headers['x-forwarded-host']||req.headers.host||'');
    if(origin){try{if(new URL(origin).host!==host)return send(res,403,{code:'ORIGIN_DENIED',message:'درخواست از مبدأ نامعتبر است.'})}catch{return send(res,403,{code:'ORIGIN_DENIED',message:'مبدأ درخواست نامعتبر است.'})}}
  }
  if(repositoryMode()==='ephemeral-memory')return send(res,503,{code:'DURABLE_STORAGE_REQUIRED',message:'پایگاه داده دائمی برای تقویم جلسات تنظیم نشده است؛ ذخیره موقت مجاز نیست.'});
  const actor={organizationId:'ORG:SYN-001',personId:`ADMIN:${session.u}`};
  try{
    const service=new MeetingsV1Service(createRepository());
    const url=new URL(req.url,'https://local');
    if(req.method==='GET'){
      const from=url.searchParams.get('from')||null,to=url.searchParams.get('to')||null;
      return send(res,200,await service.list(actor,{from,to,includeUnscheduled:true}));
    }
    if(req.method==='POST')return send(res,201,{item:await service.create(actor,readBody(req))});
    const id=url.searchParams.get('id');
    return send(res,200,{item:await service.update(actor,id,readBody(req))});
  }catch(e){
    console.error('MEETINGS_V1_API',e.code||e.name||'ERROR',e.message);
    return send(res,e instanceof MeetingValidationError?e.status:500,{code:e.code||'MEETING_SAVE_ERROR',message:e instanceof MeetingValidationError?e.message:'عملیات جلسات انجام نشد. لطفاً دوباره تلاش کنید.'});
  }
}
