import { createRepository } from '../src/infrastructure/repositoryFactory.js';
import { buildDocumentBankResponse, handleDocumentBankAction } from './document-bank-core.js';

const send=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};
const norm=s=>String(s||'').replace(/[\u200c\u200d\s]+/g,' ').trim().replace(/[يى]/g,'ی').replace(/ك/g,'ک').toLowerCase();
const uniq=a=>[...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));

export default async function handler(req,res){
 try{
  const repo=createRepository();
  if(req.method==='POST') return send(res,200,await handleDocumentBankAction(req,repo));
  if(req.method!=='GET') return send(res,405,{message:'Method not allowed'});

  const u=new URL(req.url,'https://local');
  const meetingType=String(u.searchParams.get('meetingType')||'').trim();
  const meetingNumber=String(u.searchParams.get('meetingNumber')||'').trim();
  const documentNumber=String(u.searchParams.get('documentNumber')||'').trim();
  const subjectCategory=String(u.searchParams.get('subjectCategory')||'').trim();
  const hasRelations=String(u.searchParams.get('hasRelations')||'').trim();

  const base=await buildDocumentBankResponse(req,repo);
  const db=await repo.all();
  const org=String(req.headers['x-org-id']||'ORG:SYN-001');
  const docMap=new Map((db.documents||[]).filter(x=>x.organizationId===org).map(x=>[x.id,x]));

  const enrich=item=>{
    const d=docMap.get(item.id)||{};
    const relationCount=Number(item.relationSummary?.total||0);
    return {
      ...item,
      promulgationDate:d.promulgationDate||null,
      meetingType:d.meetingType||null,
      meetingNumber:d.meetingNumber||null,
      documentNumber:d.documentNumber||null,
      subjectCategory:d.subjectCategory||null,
      meetingDate:d.meetingDate||null,
      relationCount,
      hasRelations:relationCount>0
    };
  };

  let items=(base.items||[]).map(enrich);
  if(meetingType)items=items.filter(x=>norm(x.meetingType)===norm(meetingType));
  if(meetingNumber)items=items.filter(x=>norm(x.meetingNumber).includes(norm(meetingNumber)));
  if(documentNumber)items=items.filter(x=>norm(x.documentNumber).includes(norm(documentNumber)));
  if(subjectCategory)items=items.filter(x=>norm(x.subjectCategory)===norm(subjectCategory));
  if(hasRelations==='yes')items=items.filter(x=>x.hasRelations);
  if(hasRelations==='no')items=items.filter(x=>!x.hasRelations);

  // Build facets from all authorized documents, independent of the current search/filter.
  const facetReq={
    url:'/api/v1/knowledge/document-bank?snippetLimit=1',
    headers:req.headers||{},
    method:'GET'
  };
  const allBase=await buildDocumentBankResponse(facetReq,repo);
  const allItems=(allBase.items||[]).map(enrich);

  return send(res,200,{
    ...base,
    summary:{
      ...(base.summary||{}),
      visible:items.length,
      totalOccurrences:items.reduce((s,x)=>s+Number(x.matchCount||0),0),
      metadataMatches:items.filter(x=>x.metadataMatch).length
    },
    filters:{...(base.filters||{}),meetingType,meetingNumber,documentNumber,subjectCategory,hasRelations},
    facets:{
      subjects:uniq(allItems.map(x=>x.subjectCategory||x.subjectArea)),
      meetingTypes:uniq(allItems.map(x=>x.meetingType)),
      issuers:uniq(allItems.map(x=>x.issuer))
    },
    items
  });
 }catch(e){
  console.error('DOCUMENT_BANK_0958_ERROR',e);
  return send(res,500,{message:e?.message||'خطا در دریافت بانک اسناد',code:e?.code||'DOCUMENT_BANK_0958_ERROR'});
 }
}
