// Build 0.9.1.3: compatibility wrapper.
// Production route is intentionally handled by api/index.js so the document bank
// shares the exact same in-memory repository instance as upload/knowledge routes.
import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { buildDocumentBankResponse } from './document-bank-core.js';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{code:'METHOD_NOT_ALLOWED',message:'روش درخواست مجاز نیست.'});
 try{return send(res,200,await buildDocumentBankResponse(req,createRepository()))}
 catch(e){console.error(e);return send(res,500,{code:'DOCUMENT_BANK_ERROR',message:e.message||'خطا در بانک اسناد'})}
}
