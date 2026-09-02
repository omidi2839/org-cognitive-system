import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('sidebar and smart suggestions explicitly use Vazirmatn',()=>{const c=fs.readFileSync('public/styles.css','utf8');assert.match(c,/\.sidebar[\s\S]*Vazirmatn/);assert.match(c,/suggestion-chips[\s\S]*Vazirmatn/);});
test('knowledge workspace dock exists before dynamic command result',()=>{const h=fs.readFileSync('public/index.html','utf8');assert.match(h,/knowledge-workspace-dock/);const k=h.indexOf('knowledge-workspace-dock'),r=h.indexOf('id="commandResult"');assert.ok(k>=0&&r>=0&&k<r);});
