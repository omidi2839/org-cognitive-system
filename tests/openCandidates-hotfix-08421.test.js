import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('src/application/cognitiveDocumentUnderstanding077.js','utf8');
test('openCandidates restored before frames',()=>{assert.ok(s.includes('function openCandidates(u)'));assert.ok(s.indexOf('function openCandidates(u)')<s.indexOf('function frames(text)'));});
test('structure guard retained',()=>{for(const x of ['ceremonial','metadata_label','section_heading','heading_or_label'])assert.ok(s.includes(x));});
