import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('0.7.5.1 cognitive workspace refinement and Persian concepts',()=>{
  const h=fs.readFileSync('index.html','utf8');
  const ph=fs.readFileSync('public/index.html','utf8');
  const j=fs.readFileSync('workspace-shell-075.js','utf8');
  const pj=fs.readFileSync('public/workspace-shell-075.js','utf8');
  const c=fs.readFileSync('workspace-shell-075.css','utf8');
  const pc=fs.readFileSync('public/workspace-shell-075.css','utf8');
  assert.equal(h,ph);
  assert.equal(j,pj);
  assert.equal(c,pc);

  for(const x of ['شاخص‌های برنامه','تحقق برنامه‌ها','وضعیت مطلوبیت سازمان','مراجع تحقق سازمان'])
    assert.ok(j.includes(x),x);

  for(const x of ['کشف و شناخت مسئله','صورت‌بندی و اعتبارسنجی','تبیین و مهندسی مسئله','طراحی مداخله'])
    assert.ok(j.includes(x),x);

  for(const x of ['ورودی مدیریت','آماده‌سازی تصمیم','حاکمیت تصمیم','پس از تصمیم'])
    assert.ok(j.includes(x),x);

  assert.ok(!j.includes('تحقق مراجع تحقق'));
  assert.ok(!j.includes('لنگرهای سازمانی'));
});