import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('0.7.5.2 semantic stage colors are actually wired into rendered sections',()=>{
  const j=fs.readFileSync('workspace-shell-075.js','utf8');
  const pj=fs.readFileSync('public/workspace-shell-075.js','utf8');
  const c=fs.readFileSync('workspace-shell-075.css','utf8');
  const pc=fs.readFileSync('public/workspace-shell-075.css','utf8');
  assert.equal(j,pj);
  assert.equal(c,pc);
  assert.ok(j.includes('semanticClass'));
  assert.ok(j.includes('semantic-stage-${(index%4)+1}'));
  for(const x of ['semantic-stage-1','semantic-stage-2','semantic-stage-3','semantic-stage-4']) assert.ok(c.includes(x));
  for(const x of ['#2f78df','#148b78','#b87916','#7454b8']) assert.ok(c.includes(x));
  assert.ok(j.includes('وضعیت مطلوبیت سازمان'));
  assert.ok(!j.includes('تحقق مراجع تحقق'));
});
