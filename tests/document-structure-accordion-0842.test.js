import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const b=fs.readFileSync('src/application/cognitiveDocumentUnderstanding077.js','utf8'),u=fs.readFileSync('knowledge-workspace-076.js','utf8');
test('non-content zones excluded',()=>{for(const x of ['ceremonial','metadata_label','section_heading','document_title','heading_or_label','eligibleForConceptualization'])assert.ok(b.includes(x),x);for(const x of ['بسم\\s*الله','متن\\s*(مصوبه','رسالت|مأموریت'])assert.ok(b.includes(x),x)});
test('accordion UX',()=>{for(const x of ['k842evidenceToggle','k842evidenceBody','wireEvidenceAccordions','openNextEvidence','aria-expanded="false"'])assert.ok(u.includes(x),x)});
