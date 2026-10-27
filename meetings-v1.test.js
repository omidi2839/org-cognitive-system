import test from 'node:test';
import assert from 'node:assert/strict';
import { MeetingsV1Service, normalizeMeeting } from '../src/application/meetingsV1.js';
const makeRepo=()=>({ db:{meetings:[],auditLog:[]},async all(){return structuredClone(this.db)},async mutate(fn){return structuredClone(await fn(this.db))} });
const actor={organizationId:'ORG:SYN-001',personId:'ADMIN:admin'};
const data={title:'جلسه شورای سیاست‌گذاری',kind:'planned',startDate:'2026-11-03',startTime:'09:00',endTime:'11:00',meetingType:'in_person',status:'scheduled',participants:[{name:'مدیر جلسه',role:'chair',entityType:'person'},{name:'نماینده وزارت',role:'member',entityType:'legal_representative',entityName:'وزارتخانه',position:'معاون'}]};
test('creates persisted meeting and makes it available to existing cognitive meeting array',async()=>{
 const repo=makeRepo(),svc=new MeetingsV1Service(repo);const m=await svc.create(actor,data);
 assert.match(m.id,/^MTG:/);assert.equal(m.schemaVersion,1);assert.equal(m.startAt,'2026-11-03T09:00:00');
 assert.equal(repo.db.meetings.length,1);assert.equal(repo.db.auditLog.length,1);
 const l=await svc.list(actor);assert.equal(l.items.length,1);assert.equal(l.items[0].participants.length,2);
});
test('anticipated meeting without a date is supported',async()=>{
 const svc=new MeetingsV1Service(makeRepo());const m=await svc.create(actor,{...data,kind:'anticipated',startDate:'',startTime:'',endTime:'',status:'tentative'});
 assert.equal(m.startDate,null);assert.equal(m.status,'tentative');assert.equal((await svc.list(actor)).summary.unscheduled,1);
});
test('edit and optimistic revision protect against stale overwrites',async()=>{
 const repo=makeRepo(),svc=new MeetingsV1Service(repo);const old=await svc.create(actor,data);
 const next=await svc.update(actor,old.id,{...old,title:'جلسه اصلاح‌شده',revision:1});assert.equal(next.revision,2);
 await assert.rejects(()=>svc.update(actor,old.id,{...old,revision:1}),e=>e.status===409);
 assert.equal(repo.db.meetings[0].title,'جلسه اصلاح‌شده');
});
test('tenant scoping denies update and isolates list',async()=>{
 const repo=makeRepo(),svc=new MeetingsV1Service(repo),item=await svc.create(actor,data);
 const other={organizationId:'ORG:OTHER',personId:'ADMIN:other'};
 assert.equal((await svc.list(other)).items.length,0);
 await assert.rejects(()=>svc.update(other,item.id,{...data,revision:1}),e=>e.status===404);
});
test('rejects invalid dates, missing participants and legal representatives',()=>{
 assert.throws(()=>normalizeMeeting({...data,startDate:'2026-02-30'}),e=>e.code==='DATE_INVALID');
 assert.throws(()=>normalizeMeeting({...data,participants:[]}),e=>e.code==='PARTICIPANTS_REQUIRED');
 assert.throws(()=>normalizeMeeting({...data,participants:[{name:'نماینده',entityType:'legal_representative'}]}),e=>e.code==='ENTITY_REQUIRED');
 assert.throws(()=>normalizeMeeting({...data,startTime:'11:00',endTime:'10:00'}),e=>e.code==='END_BEFORE_START');
});
test('cancel preserves record and audit history',async()=>{
 const repo=makeRepo(),svc=new MeetingsV1Service(repo),m=await svc.create(actor,data);
 await svc.update(actor,m.id,{...m,status:'cancelled',revision:1});
 assert.equal((await svc.list(actor)).summary.cancelled,1);assert.equal(repo.db.auditLog.length,2);
});
test('legacy cognitive meeting samples do not break calendar records',async()=>{
 const repo=makeRepo();repo.db.meetings.push({id:'MTG:DEMO',organizationId:actor.organizationId,title:'نمونه قدیمی'});
 const svc=new MeetingsV1Service(repo);await svc.create(actor,data);
 assert.equal((await svc.list(actor)).items.length,1);
});
test('entrypoint and separate static assets are installed',async()=>{
 const {readFile}=await import('node:fs/promises');
 const [w,v,a,h]=await Promise.all(['public/workspace-shell-075.js','vercel.json','public/auth-gate-09919.js','public/index.html'].map(x=>readFile(x,'utf8')));
 assert.match(w,/function openCapability/);assert.match(await readFile('public/meetings-v1.js','utf8'),/stopImmediatePropagation/);assert.match(v,/\/api\/v1\/meetings/);
 assert.match(a,/meetings-v1\.js/);assert.match(h,/meetings-v1\.css/);
});

test('unscheduled meeting editor does not silently give it today’s date', async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile('public/meetings-v1.js','utf8');
 assert.match(source,/item \? \(item\.startDate\|\|''\) : d/);
});
