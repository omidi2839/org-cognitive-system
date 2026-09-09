function authAvailable(){
  return Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
function pathnameOf(objectKeyOrUrl){
  const value=String(objectKeyOrUrl||'');
  if(!value)return'';
  if(/^https?:\/\//i.test(value)){
    try{return decodeURIComponent(new URL(value).pathname.replace(/^\/+/,''))}catch{return''}
  }
  return value.replace(/^\/+/,'');
}
export class VercelBlobStorage{
  async put({objectKey,buffer,mimeType}){
    const {put}=await import('@vercel/blob');
    const blob=await put(objectKey,buffer,{access:'private',contentType:mimeType,addRandomSuffix:false});
    return {provider:'vercel-blob',objectKey,url:blob.url,downloadUrl:blob.downloadUrl||blob.url,size:buffer.length,mimeType};
  }
  async get(objectKeyOrUrl){
    const pathname=pathnameOf(objectKeyOrUrl);
    if(!pathname)throw Object.assign(new Error('BLOB_PATH_REQUIRED'),{code:'BLOB_PATH_REQUIRED'});
    const {get}=await import('@vercel/blob');
    const result=await get(pathname,{access:'private',useCache:false});
    if(!result?.stream)throw Object.assign(new Error('BLOB_READ_FAILED'),{code:'BLOB_READ_FAILED'});
    const chunks=[];
    for await (const chunk of result.stream)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
  async health(){return authAvailable()}
}
