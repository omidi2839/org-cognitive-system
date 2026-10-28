import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {MeetingAgendaService} from '../src/application/meetingAgendaV1.js';
const org='ORG:SYN-001', mid='MTG:00000000-0000-4000-a000-000000000123',user='ADMIN:test';
const mockRepo=()=>{const state={meetings:[{id:mid,organizationId:org,schemaVersion:1,status:'scheduled',title:'جلسه'}],meetingAgendaItems:[],meetingAgendaDraftUploads:[],documents:[],auditLog:[]};return {state,async all(){return structuredClone(state)},async mutate(fn){const copy=structuredClone(state);const value=await fn(copy);for(const k of Object.keys(state))delete state[k];Object.assign(state,copy);return structuredClone(value)}}};
const request=(draftId,fileName='a.pdf',size=1024)=>({meetingId:mid,draftId,fileName,size,mimeType:'application/pdf'});
const save=(s,extra={})=>s.save({meetingId:mid,title:'تدوین آیین‌نامه',status:'draft',documentRefs:[],referenceLinks:[],...extra},user);
const stubBlob=()=>globalThis.__stagingMockBlob=new Map();
const gateway={
 async issueSignedToken({pathname}){return `signed:${pathname}`},
 async presignUrl(_token,{pathname}){return {presignedUrl:`https://blob.test/${encodeURIComponent(pathname)}`}},
 async head(pathname){return globalThis.__stagingMockBlob.get(pathname)||null},
 async del(paths){for(const path of (Array.isArray(paths)?paths:[paths]))globalThis.__stagingMockBlob.delete(path)}
};
test('upload is signed and confirmed before agenda exists; then claimed atomically',async()=>{
 const blob=stubBlob(),repo=mockRepo(),s=new MeetingAgendaService(repo,{blobGateway:gateway}),draftId=randomUUID();
 const up=await s.prepareDraftUpload(request(draftId),user);
 assert.match(up.stageId,/^STG:/);assert.match(up.presignedUrl,/blob.test/);
 assert.equal(repo.state.meetingAgendaItems.length,0);
 assert.equal(repo.state.meetingAgendaDraftUploads[0].status,'intent');
 const path=repo.state.meetingAgendaDraftUploads[0].pathname;blob.set(path,{size:1024});
 const status=await s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},user);
 assert.equal(status.file.status,'uploaded');
 const saved=await save(s,{uploadDraftId:draftId,stagedUploadIds:[up.stageId]});
 assert.equal(saved.attachments.length,1);assert.equal(saved.attachments[0].fileName,'a.pdf');assert.equal('pathname' in saved.attachments[0],false);
 assert.equal(repo.state.meetingAgendaDraftUploads.length,0);
 assert.equal(repo.state.meetingAgendaItems[0].attachments[0].pathname,path);
 assert.equal((await s.list(mid)).items[0].attachments.length,1);
 await assert.rejects(()=>save(s,{uploadDraftId:draftId,stagedUploadIds:[up.stageId]}),{code:'STAGED_UPLOAD_INVALID'});
});
test('many attachments, repeated selection, remove before save, idempotent cleanup',async()=>{
 const blob=stubBlob(),repo=mockRepo(),s=new MeetingAgendaService(repo,{blobGateway:gateway}),draftId=randomUUID();let ids=[];
 for(const fileName of ['intro.pdf','contract.pdf','report.pdf']){
  const up=await s.prepareDraftUpload(request(draftId,fileName),user);ids.push(up.stageId);
  blob.set(repo.state.meetingAgendaDraftUploads.at(-1).pathname,{size:1024});
  await s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},user);
 }
 const removed=repo.state.meetingAgendaDraftUploads.find(x=>x.id===ids[1]).pathname;
 assert.deepEqual(await s.clearDraftUploads({meetingId:mid,draftId,stageId:ids[1]},user),{ok:true,removed:1});assert.equal(blob.has(removed),false);
 const saved=await save(s,{uploadDraftId:draftId,stagedUploadIds:[ids[0],ids[2]]});
 assert.deepEqual(saved.attachments.map(x=>x.fileName),['intro.pdf','report.pdf']);
 assert.equal(repo.state.meetingAgendaDraftUploads.length,0);
});
test('wrong user and cross-meeting draft cannot be finished or claimed',async()=>{
 const blob=stubBlob(),repo=mockRepo(),s=new MeetingAgendaService(repo,{blobGateway:gateway}),draftId=randomUUID();
 const up=await s.prepareDraftUpload(request(draftId),user);
 blob.set(repo.state.meetingAgendaDraftUploads[0].pathname,{size:1024});
 await assert.rejects(()=>s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},'ADMIN:other'),{code:'STAGED_UPLOAD_INVALID'});
 await s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},user);
 await assert.rejects(()=>s.save({meetingId:mid,title:'اختبار',uploadDraftId:draftId,stagedUploadIds:[up.stageId]},'ADMIN:other'),{code:'STAGED_UPLOAD_INVALID'});
 assert.equal(repo.state.meetingAgendaItems.length,0);
});
test('unfinished files cannot be attached, oversize rejected, after cancel cleaned up',async()=>{
 const blob=stubBlob(),repo=mockRepo(),s=new MeetingAgendaService(repo,{blobGateway:gateway}),draftId=randomUUID();
 await assert.rejects(()=>s.prepareDraftUpload(request(draftId,'a.pdf',22*1024*1024),user),{code:'UPLOAD_INVALID'});
 const up=await s.prepareDraftUpload(request(draftId),user);
 await assert.rejects(()=>s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},user),{code:'BLOB_MISMATCH'});
 await assert.rejects(()=>save(s,{uploadDraftId:draftId,stagedUploadIds:[up.stageId]}),{code:'STAGED_UPLOAD_INVALID'});
 assert.equal(repo.state.meetingAgendaItems.length,0);
 blob.set(repo.state.meetingAgendaDraftUploads[0].pathname,{size:1024});
 await s.clearDraftUploads({meetingId:mid,draftId},user);
 assert.equal(repo.state.meetingAgendaDraftUploads.length,0);
 assert.equal(blob.size,0);
});
test('editing existing agenda can add and remove files in one revision',async()=>{
 const blob=stubBlob(),repo=mockRepo(),s=new MeetingAgendaService(repo,{blobGateway:gateway}),draftId=randomUUID();
 const existing=await save(s);
 repo.state.meetingAgendaItems[0].attachments.push({id:'ATT:11111111-1111-4111-a111-111111111111',fileName:'old.pdf',pathname:'old',size:10,status:'committed'});
 const up=await s.prepareDraftUpload(request(draftId,'new.pdf'),user);
 blob.set(repo.state.meetingAgendaDraftUploads[0].pathname,{size:1024});
 await s.finishDraftUpload({meetingId:mid,draftId,stageId:up.stageId},user);
 const result=await save(s,{id:existing.id,revision:existing.revision,uploadDraftId:draftId,stagedUploadIds:[up.stageId],removeAttachmentIds:['ATT:11111111-1111-4111-a111-111111111111']});
 assert.deepEqual(result.attachments.map(x=>x.fileName),['new.pdf']);assert.equal(result.revision,2);
 assert.equal(repo.state.meetingAgendaItems[0].attachments[0].status,'deleted');
});
