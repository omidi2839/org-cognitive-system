import { createRepository } from '../src/infrastructure/repositoryFactory.js';

const send=(res,status,data)=>{
 res.statusCode=status;
 res.setHeader('content-type','application/json; charset=utf-8');
 res.end(JSON.stringify(data));
};

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{message:'Method not allowed'});
 const org=String(req.headers['x-org-id']||'ORG:SYN-001');
 const confirm=String(req.headers['x-reset-confirm']||req.body?.confirm||'');
 if(confirm!=='DELETE_TEST_DOCUMENTS'){
   return send(res,400,{message:'برای پاکسازی، مقدار تأیید DELETE_TEST_DOCUMENTS الزامی است.'});
 }

 const repo=createRepository();
 let removed={};
 await repo.mutate(db=>{
   const owned=(arr)=>Array.isArray(arr)?arr:[];
   const countOrg=(arr)=>owned(arr).filter(x=>x.organizationId===org).length;
   removed={
     documents:countOrg(db.documents),
     artifacts:countOrg(db.artifacts),
     normalizedDocuments:countOrg(db.normalizedDocuments),
     candidates:countOrg(db.candidates),
     provenance:countOrg(db.provenance),
     audit:countOrg(db.audit),
     aiExecutions:countOrg(db.aiExecutions),
     processingJobs:countOrg(db.processingJobs),
     versionCandidates:countOrg(db.versionCandidates),
     documentRelations:countOrg(db.documentRelations)
   };
   for(const key of Object.keys(removed)){
     if(Array.isArray(db[key])) db[key]=db[key].filter(x=>x.organizationId!==org);
   }
 });
 return send(res,200,{ok:true,organizationId:org,removed});
}
