import { createRepository } from '../src/infrastructure/repositoryFactory.js';

const send=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

export default async function handler(req,res){
  try{
    if(req.method!=='GET') return send(res,405,{message:'Method not allowed'});
    const u=new URL(req.url,'https://local');
    const documentClass=u.searchParams.get('class')||null;
    const org=String(req.headers['x-org-id']||'ORG:SYN-001');
    const repo=createRepository();
    const db=await repo.all();

    const all=(Array.isArray(db.documents)?db.documents:[]).filter(x=>x.organizationId===org);
    const docs=documentClass?all.filter(x=>x.documentClass===documentClass):all;
    const ids=new Set(docs.map(x=>x.id));

    const candidates=(Array.isArray(db.candidates)?db.candidates:[])
      .filter(x=>x.organizationId===org&&ids.has(x.documentRef));
    const artifacts=(Array.isArray(db.artifacts)?db.artifacts:[])
      .filter(x=>x.organizationId===org&&ids.has(x.documentRef));

    const groups={};
    for(const a of artifacts){
      const key=String(a.checksum||a.id||'');
      (groups[key]??=[]).push(a);
    }
    const duplicateGroups=Object.values(groups).filter(g=>g.length>1);

    const items=docs.slice()
      .sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))
      .map(d=>{
        const dc=candidates.filter(c=>c.documentRef===d.id);
        return {
          id:d.id,
          title:d.title||'بدون عنوان',
          documentClass:d.documentClass||'unclassified',
          documentType:d.documentType||null,
          status:d.status||'registered',
          version:d.version||1,
          versionLabel:d.versionLabel||null,
          issuer:d.issuer||null,
          issuedAt:d.issuedAt||null,
          promulgationDate:d.promulgationDate||null,
          meetingNumber:d.meetingNumber||null,
          meetingDate:d.meetingDate||null,
          meetingType:d.meetingType||null,
          validUntil:d.validUntil||null,
          validityStatus:d.validityStatus||'unknown',
          classification:d.classification||'internal',
          organizationalLevel:d.organizationalLevel||null,
          organizationalUnitRef:d.organizationalUnitRef||null,
          organizationalUnitName:d.organizationalUnitName||null,
          subjectArea:d.subjectArea||null,
          sourceFileName:d.sourceFileName||null,
          createdAt:d.createdAt||null,
          candidates:{
            total:dc.length,
            pending:dc.filter(x=>x.status==='ready_for_review').length,
            accepted:dc.filter(x=>['accepted','corrected'].includes(x.status)).length
          }
        };
      });

    return send(res,200,{
      filter:{documentClass:documentClass||'all'},
      summary:{
        documents:items.length,
        reviewPending:candidates.filter(x=>x.status==='ready_for_review').length,
        duplicateGroups:duplicateGroups.length
      },
      items
    });
  }catch(e){
    console.error('SAFE_KNOWLEDGE_DOCUMENTS_ERROR',e);
    return send(res,500,{message:'خطا در دریافت بانک اسناد',code:e?.code||'SAFE_DOCUMENTS_ERROR'});
  }
}
