import { CognitiveService } from './service.js';
import { assert, classifications, hash, newId, now, zones } from '../domain/contracts.js';
import { validateFile } from '../processing/mime.js';
import { parseArtifact } from '../processing/parser.js';

export class KnowledgeCognitiveService extends CognitiveService {
  _metadataPatch(input){
    const m=input?.metadata||{};
    return {
      documentClass:m.documentClass||'unclassified',
      documentType:m.documentType||'سایر',
      documentNumber:m.documentNumber||null,
      issuer:m.issuer||null,
      versionLabel:m.versionLabel||null,
      issuedAt:m.issuedAt||null,
      promulgationDate:m.promulgationDate||null,
      meetingType:m.meetingType||null,
      meetingNumber:m.meetingNumber||null,
      meetingDate:m.meetingDate||null,
      validUntil:m.validUntil||null,
      validityStatus:m.validityStatus||'unknown',
      organizationalLevel:m.organizationalLevel||null,
      scopeType:m.scopeType||null,
      organizationalUnitRef:m.organizationalUnitRef||null,
      organizationalUnitName:m.organizationalUnitName||null,
      subjectCategory:m.subjectCategory||null,
      subjectArea:m.subjectArea||null
    };
  }

  _directBlobPrefix(actor){
    // Must stay identical to the server-side pathname convention used by the presign endpoint.
    const segment=String(actor?.organizationId||'')
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,80)||'org';
    return `${segment}/direct/`;
  }

  _validatedDirectBlobPath(actor,file){
    const pathname=String(file?.blobPathname||'').trim().replace(/^\/+/, '');
    assert(pathname,'BLOB_PATH_REQUIRED','مسیر Blob برای فایل مستقیم ثبت نشده است.');
    assert(!pathname.includes('\\')&&!pathname.split('/').includes('..'),'BLOB_PATH_INVALID','مسیر Blob معتبر نیست.');
    assert(pathname.startsWith(this._directBlobPrefix(actor)),'BLOB_SCOPE_INVALID','مرجع Blob خارج از محدوده سازمان است.');
    assert(/\/(?:primary|attachment)-[A-Za-z0-9._-]+\.(?:docx|pdf)$/i.test(pathname),'BLOB_PATH_INVALID','ساختار مسیر Blob معتبر نیست.');
    return pathname;
  }

  async _materializeIncomingFile(actor,file){
    const fileName=String(file?.fileName||'').trim();
    const mimeType=String(file?.mimeType||'application/octet-stream');
    assert(fileName,'FILE_NAME_REQUIRED','نام فایل الزامی است.');

    // Private Vercel Blob: blobPathname is the trusted storage locator. The public-looking
    // URL shape is intentionally NOT validated because Private Blob URL hosts can evolve.
    // We only read from the project's connected private store through @vercel/blob + OIDC.
    if(file?.blobPathname||file?.blobUrl){
      const objectKey=this._validatedDirectBlobPath(actor,file);
      const buffer=await this.storage.get(objectKey);
      const declaredSize=Math.max(0,Number(file?.size||0));
      if(declaredSize)assert(buffer.length===declaredSize,'BLOB_SIZE_MISMATCH','اندازه فایل ذخیره‌شده با مرجع ثبت‌شده تطبیق ندارد.');
      const url=String(file?.blobUrl||'');
      return {
        fileName,mimeType,buffer,
        directStorage:{provider:'vercel-blob',objectKey,url:url||null,downloadUrl:url||null,size:buffer.length,mimeType,directUpload:true}
      };
    }
    assert(file?.contentBase64,'FILE_CONTENT_REQUIRED','محتوای فایل یا مرجع Blob الزامی است.');
    return {fileName,mimeType,buffer:Buffer.from(file.contentBase64,'base64'),directStorage:null};
  }

  async _storeFileForDocument(actor,doc,file,{role='attachment',sourceVersion=null,replacePrimary=false}={}){
    const incoming=await this._materializeIncomingFile(actor,file);
    const {fileName,mimeType,buffer}=incoming;
    validateFile(fileName,mimeType,buffer.length);
    const parsed=await parseArtifact({buffer,mimeType,fileName});
    if(!parsed.text)throw new Error('محتوای متنی قابل پردازش از فایل استخراج نشد.');

    const sha=hash(buffer),ver=sourceVersion||Math.max(1,Number(doc.version||1));
    const artifactId=newId('ART'),normalizedId=newId('NORM');
    const safe=fileName.replace(/[^\w.\-\u0600-\u06FF]+/g,'_');
    const objectKey=`${actor.organizationId}/${doc.id}/v${ver}/${role}-${sha}-${safe}`;
    const stored=incoming.directStorage||await this.storage.put({objectKey,buffer,mimeType});
    const artifact={
      id:artifactId,organizationId:actor.organizationId,documentRef:doc.id,fileName,mimeType,
      size:buffer.length,checksum:sha,storage:stored,status:'committed',role,
      sourceVersion:ver,createdAt:now()
    };
    const normalized={
      id:normalizedId,organizationId:actor.organizationId,documentRef:doc.id,sourceVersion:ver,
      text:parsed.text,units:parsed.units||[],structure:parsed.structure,language:parsed.language,
      contentHash:hash(parsed.text),artifactRef:artifactId,role,createdAt:now()
    };

    await this.repo.mutate(db=>{
      db.artifacts=db.artifacts||[];db.normalizedDocuments=db.normalizedDocuments||[];
      const d=(db.documents||[]).find(x=>x.id===doc.id&&x.organizationId===actor.organizationId);
      if(!d)return;
      if(replacePrimary){
        const old=db.artifacts.find(x=>x.id===d.artifactRef&&x.status==='committed');
        if(old){old.status='replaced';old.replacedAt=now();old.replacedByArtifactRef=artifactId}
        const oldNorm=db.normalizedDocuments.find(x=>x.id===d.normalizedRef);
        if(oldNorm){oldNorm.status='superseded';oldNorm.supersededAt=now();oldNorm.supersededBy=normalizedId}
        d.artifactRef=artifactId;d.normalizedRef=normalizedId;d.sourceFileName=fileName;
        d.contentHash=sha;d.version=ver;d.updatedAt=now();
      }else{
        d.attachmentRefs=Array.isArray(d.attachmentRefs)?d.attachmentRefs:[];
        d.attachmentRefs.push(artifactId);d.updatedAt=now();
      }
      db.artifacts.push(artifact);db.normalizedDocuments.push(normalized);
      db.audit=db.audit||[];db.audit.push({
        id:newId('AUD'),organizationId:actor.organizationId,actorRef:actor.personId,
        action:replacePrimary?'document.primary_file.replace':'document.attachment.add',
        objectRef:doc.id,objectVersion:ver,occurredAt:now(),correlationId:actor.correlationId,
        fileName,artifactRef:artifactId
      });
      db.provenance=db.provenance||[];db.provenance.push({
        id:newId('PROV'),organizationId:actor.organizationId,targetRef:doc.id,
        type:replacePrimary?'primary_file_replaced':'attachment_added',sourceRefs:[artifactId],
        actorRef:actor.personId,createdAt:now(),contentHash:sha,notes:fileName
      });
    });
    return {artifact,normalized};
  }

  async _addAttachments(actor,doc,attachments=[]){
    const list=Array.isArray(attachments)?attachments.filter(x=>x?.fileName&&(x?.contentBase64||x?.blobPathname||x?.blobUrl)):[];
    const out=[];
    for(const file of list){
      out.push(await this._storeFileForDocument(actor,doc,file,{role:'attachment',sourceVersion:Number(doc.version||1)}));
    }
    return out;
  }

  async uploadDocument(actor,input){
    // 0.9.9.0.2 — idempotent browser retries: the same logical registration request
    // must return the already-created document instead of creating duplicates.
    const clientRequestId=String(input?.clientRequestId||'').trim();
    if(clientRequestId&&!input?.replaceDocumentId&&!input?.attachToDocumentId){
      const existingDb=await this.repo.all();
      const existing=(existingDb.documents||[]).find(x=>x.organizationId===actor.organizationId&&x.clientRequestId===clientRequestId&&x.status!=='deleted');
      if(existing){
        return {document:existing,replayed:true,attachments:[]};
      }
    }
    // Add attachments to an existing document without replacing its primary file.
    if(input?.attachToDocumentId){
      const db=await this.repo.all();
      const doc=(db.documents||[]).find(x=>x.id===String(input.attachToDocumentId)&&x.organizationId===actor.organizationId);
      if(!doc)throw new Error('سند برای افزودن پیوست پیدا نشد.');
      const attachments=await this._addAttachments(actor,doc,input.attachments||[]);
      return {document:doc,attachments:attachments.map(x=>({id:x.artifact.id,fileName:x.artifact.fileName,mimeType:x.artifact.mimeType}))};
    }

    // Replace only the current primary file while preserving document identity and history.
    if(input?.replaceDocumentId){
      const db=await this.repo.all();
      const doc=(db.documents||[]).find(x=>x.id===String(input.replaceDocumentId)&&x.organizationId===actor.organizationId);
      if(!doc)throw new Error('سند برای جایگزینی فایل پیدا نشد.');
      const nextVersion=Math.max(1,Number(doc.version||1)+1);
      const stored=await this._storeFileForDocument(actor,doc,{
        fileName:input.fileName,mimeType:input.mimeType,contentBase64:input.contentBase64,
        blobUrl:input.blobUrl,blobPathname:input.blobPathname,size:input.size
      },{role:'primary',sourceVersion:nextVersion,replacePrimary:true});
      const attachments=await this._addAttachments(actor,{...doc,version:nextVersion},input.attachments||[]);
      const after=await this.repo.all(),updated=(after.documents||[]).find(x=>x.id===doc.id);
      return {
        document:updated||doc,
        artifact:{id:stored.artifact.id,fileName:stored.artifact.fileName,mimeType:stored.artifact.mimeType},
        normalized:{id:stored.normalized.id,language:stored.normalized.language,structure:stored.normalized.structure,textPreview:stored.normalized.text.slice(0,500)},
        attachments:attachments.map(x=>({id:x.artifact.id,fileName:x.artifact.fileName,mimeType:x.artifact.mimeType}))
      };
    }

    // New primary document already uploaded by browser directly to private Blob.
    if((input?.blobPathname||input?.blobUrl)&&!input?.contentBase64){
      const classification=input.classification||'internal',zone=input.knowledgeZone||'private';
      assert(zones.includes(zone),'DOC_ZONE_INVALID','ناحیه دانش نامعتبر است.');
      assert(classifications.includes(classification),'DOC_CLASS_INVALID','طبقه‌بندی نامعتبر است.');
      const doc={
        id:newId('DOC'),organizationId:actor.organizationId,title:(input.title||input.fileName).trim(),
        status:'registered',version:1,knowledgeZone:zone,classification,createdAt:now(),createdBy:actor.personId,
        contentHash:null,artifactRef:null,normalizedRef:null,sourceFileName:input.fileName,exactDuplicateOf:null,clientRequestId:clientRequestId||null,
        ...this._metadataPatch(input)
      };
      await this.repo.mutate(db=>{
        db.documents=db.documents||[];db.documents.push(doc);
        db.audit=db.audit||[];db.audit.push({id:newId('AUD'),organizationId:actor.organizationId,actorRef:actor.personId,action:'document.direct_upload.begin',objectRef:doc.id,objectVersion:1,occurredAt:now(),correlationId:actor.correlationId});
      });
      try{
        const stored=await this._storeFileForDocument(actor,doc,{
          fileName:input.fileName,mimeType:input.mimeType,blobUrl:input.blobUrl,blobPathname:input.blobPathname,size:input.size
        },{role:'primary',sourceVersion:1,replacePrimary:true});
        const attachments=await this._addAttachments(actor,{...doc,version:1},input.attachments||[]);
        const db=await this.repo.all(),updated=(db.documents||[]).find(x=>x.id===doc.id)||doc;
        return {
          document:updated,
          artifact:{id:stored.artifact.id,fileName:stored.artifact.fileName,mimeType:stored.artifact.mimeType,directUpload:true},
          normalized:{id:stored.normalized.id,language:stored.normalized.language,structure:stored.normalized.structure,textPreview:stored.normalized.text.slice(0,500)},
          attachments:attachments.map(x=>({id:x.artifact.id,fileName:x.artifact.fileName,mimeType:x.artifact.mimeType,directUpload:true}))
        };
      }catch(e){
        await this.repo.mutate(db=>{const d=(db.documents||[]).find(x=>x.id===doc.id);if(d){d.status='upload_failed';d.uploadError=e?.message||String(e);d.updatedAt=now()}});
        throw e;
      }
    }

    const result=await super.uploadDocument(actor,input);
    const patch=this._metadataPatch(input);
    await this.repo.mutate(db=>{
      const d=(db.documents||[]).find(x=>x.id===result.document.id&&x.organizationId===actor.organizationId);
      const a=(db.artifacts||[]).find(x=>x.id===result.document.artifactRef);
      const n=(db.normalizedDocuments||[]).find(x=>x.id===result.document.normalizedRef);
      if(d){Object.assign(d,patch);if(clientRequestId)d.clientRequestId=clientRequestId;}
      if(a&&!a.role)a.role='primary';
      if(n&&!n.role)n.role='primary';
    });
    Object.assign(result.document,patch);
    const attachments=await this._addAttachments(actor,result.document,input.attachments||[]);
    result.attachments=attachments.map(x=>({id:x.artifact.id,fileName:x.artifact.fileName,mimeType:x.artifact.mimeType}));
    return result;
  }
  async knowledgeDocuments(actor,documentClass=null){
    const db=await this.repo.all();
    const all=(db.documents||[]).filter(x=>x.organizationId===actor.organizationId);
    const docs=documentClass?all.filter(x=>x.documentClass===documentClass):all;
    const docIds=new Set(docs.map(x=>x.id));
    const candidates=(db.candidates||[]).filter(x=>x.organizationId===actor.organizationId&&docIds.has(x.documentRef));
    const artifacts=(db.artifacts||[]).filter(x=>x.organizationId===actor.organizationId&&docIds.has(x.documentRef));
    const groups={}; for(const a of artifacts)(groups[a.checksum]??=[]).push(a);
    const duplicateGroups=Object.values(groups).filter(g=>g.length>1);
    const items=docs.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).map(d=>{
      const dc=candidates.filter(c=>c.documentRef===d.id);
      return {
        id:d.id,title:d.title,documentClass:d.documentClass||'unclassified',documentType:d.documentType||null,documentNumber:d.documentNumber||null,
        status:d.status,version:d.version,versionLabel:d.versionLabel||null,issuer:d.issuer||null,
        issuedAt:d.issuedAt||null,promulgationDate:d.promulgationDate||null,
        meetingType:d.meetingType||null,meetingNumber:d.meetingNumber||null,meetingDate:d.meetingDate||null,
        validUntil:d.validUntil||null,validityStatus:d.validityStatus||'unknown',
        classification:d.classification,organizationalLevel:d.organizationalLevel||null,
        organizationalUnitRef:d.organizationalUnitRef||null,organizationalUnitName:d.organizationalUnitName||null,
        subjectCategory:d.subjectCategory||null,subjectArea:d.subjectArea||null,sourceFileName:d.sourceFileName||null,createdAt:d.createdAt,
        candidates:{total:dc.length,pending:dc.filter(x=>x.status==='ready_for_review').length,accepted:dc.filter(x=>['accepted','corrected'].includes(x.status)).length}
      }
    });
    return {filter:{documentClass:documentClass||'all'},summary:{documents:items.length,reviewPending:candidates.filter(x=>x.status==='ready_for_review').length,duplicateGroups:duplicateGroups.length},items};
  }
}
