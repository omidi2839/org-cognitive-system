import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CognitiveService } from '../src/application/service.js';
import { MemoryRepository } from '../src/infrastructure/memoryRepository.js';
import { MockAIGateway } from '../src/ai/mockGateway.js';

const actor={organizationId:'ORG:SYN-001',personId:'PER:SARA',roles:['expert'],correlationId:'CORR:ONLINE-REVIEW'};
const setup=()=>new CognitiveService(new MemoryRepository(),new MockAIGateway());

test('natural-language management attention outranks generic cross-object routing',async()=>{
  const s=setup();
  const text='عملکرد واحد آموزش در سه ماه اخیر کاهش یافته و فقط ۶۲ درصد برنامه مصوب محقق شده است. چند اقدام کلیدی نیز با تأخیر مواجه شده‌اند و احتمال می‌دهم این وضعیت بر تحقق اهداف سازمان اثر بگذارد. بررسی کن آیا این موضوع باید در اولویت توجه مدیریت قرار گیرد و برای جلسه مدیریتی آماده شود.';
  const r=await s.executeCommand(actor,{sessionId:'ONLINE-ATT-1',text});
  assert.equal(r.intent,'workspace.cognitive_attention');
  assert.equal(r.capability,'cognitive_prioritization');
  assert.equal(r.workspace.componentType,'cognitive_attention');
  assert.equal(r.workspace.signalAssessment.source,'human_reported_command');
  assert.equal(r.workspace.signalAssessment.validated,false);
  assert.ok(r.workspace.attention.queue.length>=1);
  assert.notEqual(r.intent,'workspace.cross_object');
});

test('generic project overview still routes to cross-object workspace',async()=>{
  const s=setup();
  const r=await s.executeCommand(actor,{sessionId:'ONLINE-ATT-2',text:'وضعیت پروژه تحول دیجیتال را بررسی کن'});
  assert.equal(r.intent,'workspace.cross_object');
  assert.equal(r.workspace.componentType,'cross_object_workspace');
});

test('specialized workspace renderer defines workspace object before using cognitive attention',()=>{
  const j=fs.readFileSync('public/app.js','utf8');
  assert.match(j,/const w=result\.workspace\|\|\{\}/);
  assert.match(j,/type==='cognitive_attention'/);
});
