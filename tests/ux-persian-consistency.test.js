import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('0.7.4 moves analysis capability to sidebar and removes central knowledge CTA',()=>{
 const h=fs.readFileSync('public/index.html','utf8');
 assert.match(h,/id="analyzeDocs" class="nav-item"/);
 assert.doesNotMatch(h,/knowledge-workspace-dock/);
});
test('0.7.4 keeps composer controls fixed and caps textarea growth',()=>{
 const c=fs.readFileSync('public/styles.css','utf8');
 assert.match(c,/\.voice-btn,.send-btn\{height:56px/);
 assert.match(c,/max-height:180px/);
});
test('0.7.4 exposes Persian labels for key cognitive workspaces',()=>{
 const j=fs.readFileSync('public/app.js','utf8');
 for(const x of ['اولویت شناختی توجه','اکنون','بعدی','تحت نظر','دستورکار ≠ اختیار تصمیم','آمادگی ≠ تشکیل جلسه','بسته آمادگی ≠ تصمیم']) assert.match(j,new RegExp(x));
 assert.match(j,/faIntent/);
});
