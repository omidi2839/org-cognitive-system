import { CognitiveService } from './service.js';

export class KnowledgeCognitiveService extends CognitiveService {
  async uploadDocument(actor,input){
    const result=await super.uploadDocument(actor,input);
    const m=input.metadata||{};
    const patch={
      documentClass:m.documentClass||'unclassified',
      documentType:m.documentType||'سایر',
      issuer:m.issuer||null,
      versionLabel:m.versionLabel||null,
      issuedAt:m.issuedAt||null,
      validUntil:m.validUntil||null,
      validityStatus:m.validityStatus||'unknown',
      organizationalLevel:m.organizationalLevel||null,
      scopeType:m.scopeType||null,
      organizationalUnitRef:m.organizationalUnitRef||null,
      organizationalUnitName:m.organizationalUnitName||null,
      subjectArea:m.subjectArea||null
    };
    await this.repo.mutate(db=>{
      const d=(db.documents||[]).find(x=>x.id===result.document.id&&x.organizationId===actor.organizationId);
      if(d) Object.assign(d,patch);
    });
    Object.assign(result.document,patch);
    return result;
  }

  async knowledgeDocuments(actor,documentClass=null){
    const db=await this.repo.all();
    const all=(db.documents||[]).filter(x=>x.organizationId===actor.organizationId);
    const docs=documentClass?all.filter(x=>x.documentClass===documentClass):all;
    const docIds=new Set(docs.map(x=>x.id));
    const candidates=(db.candidates||[]).filter(x=>x.organizationId===actor.organizationId&&docIds.has(x.documentRef));
    const artifacts=(db.artifacts||[]).filter(x=>x.organizationId===actor.organizationId&&docIds.has(x.documentRef));

    const groups={};
    for(const a of artifacts)(groups[a.checksum]??=[]).push(a);
    const duplicateGroups=Object.values(groups).filter(g=>g.length>1);

    const items=docs.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).map(d=>{
      const dc=candidates.filter(c=>c.documentRef===d.id);
      return {
        id:d.id,title:d.title,documentClass:d.documentClass||'unclassified',
        documentType:d.documentType||null,status:d.status,version:d.version,
        issuer:d.issuer||null,validityStatus:d.validityStatus||'unknown',
        classification:d.classification,organizationalLevel:d.organizationalLevel||null,
        organizationalUnitRef:d.organizationalUnitRef||null,
        organizationalUnitName:d.organizationalUnitName||null,
        subjectArea:d.subjectArea||null,sourceFileName:d.sourceFileName||null,
        createdAt:d.createdAt,
        candidates:{total:dc.length,pending:dc.filter(x=>x.status==='ready_for_review').length,accepted:dc.filter(x=>['accepted','corrected'].includes(x.status)).length}
      };
    });

    return {
      filter:{documentClass:documentClass||'all'},
      summary:{
        documents:items.length,
        reviewPending:candidates.filter(x=>x.status==='ready_for_review').length,
        duplicateGroups:duplicateGroups.length
      },
      items
    };
  }
}
