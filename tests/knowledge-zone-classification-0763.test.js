import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('0.7.6.3 knowledge zone and public classification are valid',()=>{
  const j=fs.readFileSync('knowledge-workspace-076.js','utf8');
  const pj=fs.readFileSync('public/knowledge-workspace-076.js','utf8');
  const c=fs.readFileSync('src/domain/contracts.js','utf8');
  assert.equal(j,pj);
  assert.ok(j.includes("knowledgeZone:'organizational'"));
  assert.ok(!j.includes("knowledgeZone:'organization'"));
  assert.ok(c.includes("'organizational'"));
  assert.ok(c.includes("'public'"));
  assert.ok(c.includes("'confidential'"));
});
