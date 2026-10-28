import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {MeetingAgendaService} from '../src/application/meetingAgendaV1.js';
const meetingId=`MTG:${randomUUID()}`;
const newDb=()=>({meetings:[{id:meetingId,organizationId:'ORG:SYN-001',schemaVersion:1,status:'scheduled'}],meetingAgendaDraftUploads:[]});
const fakeRepo=()=>{let db=newDb();return {async mutate(fn){return fn(db)},async all(){return structuredClone(db)},get db(){return db}}};
const payload=(fileText='test sample')=>({meetingId,draftId:randomUUID(),fileName:'sample.pdf',mimeType:'application/pdf',size:Buffer.byteLength(fileText),contentBase64:Buffer.from(fileText).toString('base64')});
const blobFake=()=>{const records=new Map();return {records,putCalls:[],async put(path,buffer,opts){this.putCalls.push({path,body:buffer,opts});records.set(path,Buffer.from(buffer));return {pathname:path,url:`https://store.private.blob.vercel-storage.com/${path}`}},async get(path,opts){const v=records.get(path);return v?{statusCode:200,blob:{size:v.length},stream:{async cancel(){}}}:null}}};
test('authenticated SDK put uses expected private pathname and claims stage',async()=>{
 const repo=fakeRepo(),blob=blobFake(),service=new MeetingAgendaService(repo,{blobGateway:blob}),input=payload();
 const result=await service.directDraftUpload(input,'ADMIN:admin');
 assert.equal(result.file.status,'uploaded');assert.equal(blob.putCalls.length,1);
 assert.equal(blob.putCalls[0].opts.access,'private');assert.equal(blob.putCalls[0].opts.addRandomSuffix,false);
 assert.match(blob.putCalls[0].path,/^meetings\/ORG-SYN-001\//);
 assert.equal(repo.db.meetingAgendaDraftUploads[0].status,'uploaded');
 assert.equal(repo.db.meetingAgendaDraftUploads[0].owner,'ADMIN:admin');
});
test('two files can be uploaded and staged independently in a single draft',async()=>{
 const repo=fakeRepo(),blob=blobFake(),service=new MeetingAgendaService(repo,{blobGateway:blob}),a=payload('one'),b=payload('two');b.draftId=a.draftId;
 await service.directDraftUpload(a,'ADMIN:admin');await service.directDraftUpload(b,'ADMIN:admin');
 assert.equal(repo.db.meetingAgendaDraftUploads.length,2);assert.notEqual(repo.db.meetingAgendaDraftUploads[0].id,repo.db.meetingAgendaDraftUploads[1].id);
});
test('base64 size mismatch must not reserve a stage or write a blob',async()=>{
 const repo=fakeRepo(),blob=blobFake(),service=new MeetingAgendaService(repo,{blobGateway:blob});const input=payload();input.size++;
 await assert.rejects(service.directDraftUpload(input,'ADMIN:admin'),{code:'DIRECT_FILE_MISMATCH'});
 assert.equal(repo.db.meetingAgendaDraftUploads.length,0);assert.equal(blob.putCalls.length,0);
});
test('file larger than 2MB is refused at direct endpoint',async()=>{
 const repo=fakeRepo(),service=new MeetingAgendaService(repo,{blobGateway:blobFake()});const input=payload();input.size=2*1024*1024+1;
 await assert.rejects(service.directDraftUpload(input,'ADMIN:admin'),{code:'DIRECT_FILE_SIZE',status:413});
});
test('SDK object inaccessible after put is never marked uploaded',async()=>{
 const repo=fakeRepo(),blob=blobFake();blob.get=async()=>null;
 const service=new MeetingAgendaService(repo,{blobGateway:blob}),input=payload();
 await assert.rejects(service.directDraftUpload(input,'ADMIN:admin'),{code:'DIRECT_FILE_UNREADABLE'});
 assert.equal(repo.db.meetingAgendaDraftUploads.length,0);
});
test('SDK unexpected pathname cannot attach a different object',async()=>{
 const repo=fakeRepo(),blob=blobFake();blob.put=async()=>({pathname:'different.pdf'});
 const service=new MeetingAgendaService(repo,{blobGateway:blob});
 await assert.rejects(service.directDraftUpload(payload(),'ADMIN:admin'),{code:'DIRECT_FILE_PATH_MISMATCH'});
 assert.equal(repo.db.meetingAgendaDraftUploads.length,0);
});
test('nonexistent meeting cannot create a stage',async()=>{
 const repo=fakeRepo(),service=new MeetingAgendaService(repo,{blobGateway:blobFake()});const input=payload();input.meetingId=`MTG:${randomUUID()}`;
 await assert.rejects(service.directDraftUpload(input,'ADMIN:admin'),{code:'MEETING_NOT_FOUND'});
 assert.equal(repo.db.meetingAgendaDraftUploads.length,0);
});
