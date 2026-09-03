import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.js';

function invoke({method='POST',url='/api/v1/command',body={},headers={}}={}){
  const req={method,url,body,headers:{'x-org-id':'ORG:SYN-001','x-person-id':'PER:SARA',...headers}};
  return new Promise((resolve,reject)=>{
    const out={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(payload){try{resolve({statusCode:this.statusCode,headers:this.headers,body:JSON.parse(payload)})}catch(e){reject(e)}}};
    Promise.resolve(handler(req,out)).catch(reject);
  });
}

const scenario='عملکرد واحد آموزش در سه ماه اخیر کاهش یافته و فقط ۶۲ درصد برنامه مصوب محقق شده است. چند اقدام کلیدی نیز با تأخیر مواجه شده‌اند و احتمال می‌دهم این وضعیت بر تحقق اهداف سازمان اثر بگذارد. بررسی کن آیا این موضوع باید در اولویت توجه مدیریت قرار گیرد و برای جلسه مدیریتی آماده شود.';

test('real command API routes online-review scenario to cognitive attention',async()=>{
  const r=await invoke({body:{sessionId:'API-ONLINE-ATT-1',text:scenario}});
  assert.equal(r.statusCode,200);
  assert.equal(r.body.intent,'workspace.cognitive_attention');
  assert.equal(r.body.capability,'cognitive_prioritization');
  assert.equal(r.body.workspace?.componentType,'cognitive_attention');
  assert.equal(r.body.workspace?.signalAssessment?.validated,false);
});

test('health exposes deployment build 0.7.4',async()=>{
  const r=await invoke({method:'GET',url:'/api/v1/health'});
  assert.equal(r.statusCode,200);
  assert.equal(r.body.version,'0.7.4');
});
