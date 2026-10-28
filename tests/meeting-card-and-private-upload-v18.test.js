import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {MeetingAgendaService} from '../src/application/meetingAgendaV1.js';
const org='ORG:SYN-001';
const mid='MTG:00000000-0000-4000-a000-000000000123';
const aid='AGD:00000000-0000-4000-a000-000000000456';
const user='ADMIN:test';
const repo=()=>{const state={meetings:[{id:mid,organizationId:org,schemaVersion:1,status:'scheduled',title:'جلسه'}],meetingAgendaItems:[{id:aid,meetingId:mid,organizationId:org,attachments:[],status:'draft',schemaVersion:1}],meetingAgendaDraftUploads:[],documents:[],auditLog:[]};return {state,async all(){return structuredClone(state)},async mutate(fn){const draft=structuredClone(state);const out=await fn(draft);Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,draft);return out}}};
test('draft file uses private access in signed PUT URL',async()=>{
 const opts=[];
 const gateway={async issueSignedToken(args){opts.push(args);return {delegationToken:'signed',clientSigningToken:'signed'}},async presignUrl(_,args){opts.push(args);return {presignedUrl:'https://signed.example/upload'}}};
 const svc=new MeetingAgendaService(repo(),{blobGateway:gateway});
 const result=await svc.prepareDraftUpload({meetingId:mid,draftId:randomUUID(),fileName:'test.pdf',size:1200,mimeType:'application/pdf'},user);
 assert.ok(result.presignedUrl.includes('signed.example'));
 assert.equal(opts[0].operations[0],'put');
 assert.equal(opts[1].access,'private');
 assert.equal(opts[1].operation,'put');
});
test('card toolbar JS contains visible | separators and actions, without altering module routing',async()=>{
 const {readFileSync}=await import('node:fs');
 const js=readFileSync(new URL('../public/workspace-shell-075.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../public/workspace-shell-075.css',import.meta.url),'utf8');
 assert.match(js,/separator\.textContent='\|'/);
 assert.match(js,/\['تقویم جلسات'/);
 assert.match(js,/\['مدیریت دستورها'/);
 assert.match(css,/\.sina17-card-action\{/);
 assert.match(css,/color:#d97706!important/);
});
