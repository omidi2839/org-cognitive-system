import { newId, now, hash } from '../domain/contracts.js';
const topicRules = [
  ['بودجه','بودجه'],['تأخیر','تأخیر پروژه'],['تاخیر','تأخیر پروژه'],['زمان‌بندی','برنامه زمان‌بندی'],['زمانبندی','برنامه زمان‌بندی'],['تحول','تحول سازمانی'],['خدمات','خدمات الکترونیکی'],['منابع انسانی','منابع انسانی'],['جلسه','جلسات'],['ریسک','ریسک']
];
export class MockAIGateway {
  async execute(task){
    const started=Date.now();
    const text=task.inputText || '';
    const topics=[];
    for(const [needle,label] of topicRules) if(text.includes(needle) && !topics.includes(label)) topics.push(label);
    if(!topics.length) topics.push('موضوع عمومی سازمانی');
    const claimCandidates=[];
    const lines=text.split(/\n|\.|؟|!/).map(s=>s.trim()).filter(Boolean);
    for(const line of lines){
      if(/\d|درصد|٪|تأخیر|تاخیر|بودجه|ریسک/.test(line) && line.length>12){ claimCandidates.push(line.slice(0,180)); if(claimCandidates.length>=3) break; }
    }
    const execution={
      id:newId('AIEX'), taskId:task.id, taskType:task.type, provider:'mock-provider', model:'deterministic-fa-v0', promptRef:'document.topic_extract.v1',
      contextRefs:task.contextRefs||[], startedAt:new Date(started).toISOString(), completedAt:now(), latencyMs:Date.now()-started,
      inputUsage:text.length, outputUsage:JSON.stringify({topics,claimCandidates}).length, costEstimate:0, groundingStatus:'passed', status:'succeeded'
    };
    return {execution, output:{topics,claimCandidates}, outputHash:hash(JSON.stringify({topics,claimCandidates}))};
  }
}
