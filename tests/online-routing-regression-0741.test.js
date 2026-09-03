import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.js';
function invoke(body){const req={method:'POST',url:'/api/v1/command',body,headers:{'x-org-id':'ORG:SYN-001','x-person-id':'PER:SARA'}};return new Promise((resolve,reject)=>{const out={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(payload){try{resolve({statusCode:this.statusCode,body:JSON.parse(payload)})}catch(e){reject(e)}}};Promise.resolve(handler(req,out)).catch(reject);});}
const scenario='عملکرد واحد آموزش در سه ماه اخیر کاهش یافته و فقط ۶۲ درصد برنامه مصوب محقق شده است. چند اقدام کلیدی نیز با تأخیر مواجه شده‌اند و احتمال می‌دهم این وضعیت بر تحقق اهداف سازمان اثر بگذارد. بررسی کن آیا این موضوع باید در اولویت توجه مدیریت قرار گیرد و برای جلسه مدیریتی آماده شود.';
test('0.7.4.1 regression: «اولویت» is never interpreted as «مورد اول» even with prior resultRefs',async()=>{
 const sessionId='API-0741-PRIOR-CONTEXT';
 const first=await invoke({sessionId,text:scenario}); assert.equal(first.body.intent,'workspace.cognitive_attention'); assert.ok(first.body.context?.resultRefs?.length);
 const second=await invoke({sessionId,text:scenario});
 assert.equal(second.statusCode,200); assert.equal(second.body.intent,'workspace.cognitive_attention'); assert.equal(second.body.capability,'cognitive_prioritization'); assert.equal(second.body.workspace?.componentType,'cognitive_attention'); assert.notEqual(second.body.title,'مورد اول انتخاب شد');
});
test('0.7.4.1 health exposes correction build',async()=>{const req={method:'GET',url:'/api/v1/health',headers:{}};const r=await new Promise((resolve,reject)=>{const out={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(p){resolve(JSON.parse(p))}};Promise.resolve(handler(req,out)).catch(reject)});assert.equal(r.version,'0.7.4.2')});
