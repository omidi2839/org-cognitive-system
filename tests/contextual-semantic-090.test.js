import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const svc=fs.readFileSync('src/application/cognitiveDocumentUnderstanding077.js','utf8');
const ai=fs.readFileSync('src/ai/providers/openAIResponsesSemanticProvider.js','utf8');
const fb=fs.readFileSync('src/ai/providers/deterministicSemanticProvider.js','utf8');
const css=fs.readFileSync('knowledge-workspace-076.css','utf8');
test('provider architecture',()=>{assert.ok(svc.includes('semanticProvider'));assert.ok(ai.includes('/responses'));assert.ok(ai.includes('json_schema'));assert.ok(ai.includes('strict:true'))});
test('claim specific question prompt',()=>{assert.ok(ai.includes('نه از قالب تکراری'));assert.ok(ai.includes('ابهام واقعی'));assert.ok(ai.includes('ظرفیت‌ها و منابع مالی'))});
test('structure exclusion fallback',()=>{for(const x of ['ceremonial','label','heading','title'])assert.ok(fb.includes(x));assert.ok(fb.includes("filter(x=>x.zone==='body')"))});
test('pastel accordion',()=>{assert.ok(css.includes('0.9.0 calm evidence accordion'));assert.ok(css.includes('#f1f8f5'));assert.ok(css.includes('#dcefe8'))});
