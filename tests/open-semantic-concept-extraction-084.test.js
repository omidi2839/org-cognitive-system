import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const s=fs.readFileSync('src/application/cognitiveDocumentUnderstanding077.js','utf8');
test('open semantic extractor contract',()=>{for(const x of ['openCandidates','compound_concept','concept_candidate','attribute_or_quality','target_group','need_concept','concept_validation','concept_boundary','open-semantic-concept-extraction-v1'])assert.ok(s.includes(x),x);assert.ok(!s.includes("const semanticTerms="));assert.ok(!s.includes("const compoundEntities="));});
test('no semantic caps',()=>{for(const x of ['slice(0,120)','slice(0,80)','slice(0,60)','qs.length>=12','units.slice(0,24)'])assert.ok(!s.includes(x),x);});
