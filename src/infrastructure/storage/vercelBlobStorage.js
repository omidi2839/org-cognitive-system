function authToken(){ return process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || ''; }
export class VercelBlobStorage{
  async put({objectKey,buffer,mimeType}){
    const {put}=await import('@vercel/blob');
    const blob=await put(objectKey,buffer,{access:'private',contentType:mimeType,addRandomSuffix:false});
    return {provider:'vercel-blob',objectKey,url:blob.url,downloadUrl:blob.downloadUrl,size:buffer.length,mimeType};
  }
  async get(objectKeyOrUrl){
    const url=String(objectKeyOrUrl||'');
    if(!url.startsWith('http')) throw Object.assign(new Error('BLOB_URL_REQUIRED'),{code:'BLOB_URL_REQUIRED'});
    const token=authToken();
    if(!token) throw Object.assign(new Error('BLOB_AUTH_REQUIRED'),{code:'BLOB_AUTH_REQUIRED'});
    const r=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
    if(!r.ok) throw Object.assign(new Error(`BLOB_READ_FAILED_${r.status}`),{code:'BLOB_READ_FAILED'});
    return Buffer.from(await r.arrayBuffer());
  }
  async health(){return Boolean(authToken() || process.env.BLOB_STORE_ID);}
}
