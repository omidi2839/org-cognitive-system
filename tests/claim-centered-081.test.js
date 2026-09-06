import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
test('claim centered semantic contract',()=>{const s=fs.readFileSync('src/application/cognitiveDocumentUnderstanding077.js','utf8');
for(const x of ['mission_claim','organizational_entity','epistemic_basis','frames(text)','slice(0,60)'])assert.ok(s.includes(x),x);
assert.ok(!s.includes('slice(0,18)'));});
