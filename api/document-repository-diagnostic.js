import { createRepository, repositoryMode } from '../src/infrastructure/repositoryFactory.js';
const send=(res,s,d)=>{res.statusCode=s;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(d))};
export default async function handler(req,res){
 try{
  const repo=createRepository(),db=await repo.all();
  return send(res,200,{ok:true,persistence:repositoryMode(),shape:{
   documents:Array.isArray(db.documents),artifacts:Array.isArray(db.artifacts),
   candidates:Array.isArray(db.candidates),normalizedDocuments:Array.isArray(db.normalizedDocuments)
  },counts:{
   documents:(db.documents||[]).length,artifacts:(db.artifacts||[]).length,
   candidates:(db.candidates||[]).length,normalizedDocuments:(db.normalizedDocuments||[]).length
  }});
 }catch(e){return send(res,500,{ok:false,message:e.message,code:e.code||null})}
}