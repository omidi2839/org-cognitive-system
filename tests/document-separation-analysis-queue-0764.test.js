import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('0.7.6.4 separates repositories and analysis starts from registered docs',()=>{
 const k=fs.readFileSync('knowledge-workspace-076.js','utf8'),pk=fs.readFileSync('public/knowledge-workspace-076.js','utf8'),a=fs.readFileSync('api/index.js','utf8'),s=fs.readFileSync('src/application/knowledgeService0764.js','utf8');
 assert.equal(k,pk);
 assert.ok(k.includes('/api/v1/knowledge/documents?class='));
 assert.ok(k.includes("documentClass:up?'upstream':'general'"));
 assert.ok(k.includes("b.dataset.capability==='تحلیل اسناد'"));
 assert.ok(k.includes('صف اسناد برای تحلیل'));
 assert.ok(!k.includes('تحلیل اسناد</b><small>فایل را وارد کنید'));
 assert.ok(a.includes('/api/v1/knowledge/documents'));
 assert.ok(s.includes("all.filter(x=>x.documentClass===documentClass)"));
 assert.ok(s.includes('Object.assign(d,patch)'));
});
