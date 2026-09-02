const blank=()=>({documents:[],artifacts:[],normalizedDocuments:[],candidates:[],audit:[],provenance:[],aiExecutions:[],processingJobs:[],versionCandidates:[],commandSessions:[],workItems:[],meetings:[],inboxItems:[],attentionItems:[]});
const globalKey='__ORG_COGNITIVE_MEMORY_DB__';
export class MemoryRepository {
  constructor(){ if(!globalThis[globalKey]) globalThis[globalKey]=blank(); }
  async all(){ return structuredClone(globalThis[globalKey]); }
  async mutate(fn){ const db=globalThis[globalKey]; const result=await fn(db); return structuredClone(result); }
}
