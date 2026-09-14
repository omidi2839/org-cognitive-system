function authAvailable(){
  return Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
function pathnameOf(objectKeyOrUrl){
  const value=String(objectKeyOrUrl||'');
  if(!value)return'';
  if(/^https?:\/\//i.test(value)){
    try{return decodeURIComponent(new URL(value).pathname.replace(/^\/+/,''))}catch{return''}
  }
  return value.replace(/^\/+/, '');
}
function providerError(code,message,cause,extra={}){
  const err=Object.assign(new Error(message||code),{code,...extra});
  if(cause)err.cause=cause;
  return err;
}
function safeProviderDetail(value){
  return String(value||'').replace(/([?&](?:vercel-blob-delegation|vercel-blob-signature)=)[^&\s]+/gi,'$1[redacted]').slice(0,1200);
}
async function streamToBuffer(stream){
  if(!stream)return Buffer.alloc(0);
  if(Buffer.isBuffer(stream))return stream;
  if(stream instanceof Uint8Array)return Buffer.from(stream);
  if(typeof stream.arrayBuffer==='function')return Buffer.from(await stream.arrayBuffer());
  // @vercel/blob get() returns a Web ReadableStream. Response provides a safe,
  // runtime-native conversion without another network request.
  if(typeof Response!=='undefined')return Buffer.from(await new Response(stream).arrayBuffer());
  const chunks=[];
  for await (const chunk of stream)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export class VercelBlobStorage{
  async put({objectKey,buffer,mimeType}){
    const {put}=await import('@vercel/blob');
    const blob=await put(objectKey,buffer,{access:'private',contentType:mimeType,addRandomSuffix:false});
    return {provider:'vercel-blob',objectKey,url:blob.url,downloadUrl:blob.downloadUrl||blob.url,size:buffer.length,mimeType};
  }

  async get(objectKeyOrUrl){
    const pathname=pathnameOf(objectKeyOrUrl);
    if(!pathname)throw providerError('BLOB_PATH_REQUIRED','BLOB_PATH_REQUIRED');
    try{
      // Private Blob is read server-side through the SDK itself. On Vercel,
      // the SDK authenticates with the project's short-lived OIDC credential.
      // useCache:false guarantees the just-uploaded object is read from origin.
      const {get}=await import('@vercel/blob');
      const result=await get(pathname,{access:'private',useCache:false});
      if(!result){
        throw providerError('BLOB_OBJECT_NOT_FOUND','Vercel Blob object was not found.',null,{pathname,status:404});
      }
      const buffer=await streamToBuffer(result.stream);
      if(!buffer.length && Number(result?.blob?.size||0)>0){
        throw providerError('BLOB_EMPTY_READ','Vercel Blob returned an empty stream for a non-empty object.',null,{pathname});
      }
      return buffer;
    }catch(e){
      console.error('BLOB_SDK_READ_ERROR',{
        code:e?.code||e?.name||'BLOB_READ_FAILED',
        pathname,
        status:e?.status||e?.statusCode||null,
        detail:safeProviderDetail(e?.providerDetail||e?.message||e)
      });
      if(e?.code && String(e.code).startsWith('BLOB_'))throw e;
      throw providerError('BLOB_READ_FAILED','Vercel Blob SDK read failed.',e,{pathname,status:e?.status||e?.statusCode||null});
    }
  }

  async health(){return authAvailable()}
}
