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
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function providerError(code,message,cause,extra={}){
  const err=Object.assign(new Error(message||code),{code,...extra});
  if(cause)err.cause=cause;
  return err;
}
function safeProviderDetail(value){
  return String(value||'').replace(/([?&](?:vercel-blob-delegation|vercel-blob-signature)=)[^&\s]+/gi,'$1[redacted]').slice(0,1200);
}

export class VercelBlobStorage{
  async put({objectKey,buffer,mimeType}){
    const {put}=await import('@vercel/blob');
    const blob=await put(objectKey,buffer,{access:'private',contentType:mimeType,addRandomSuffix:false});
    return {provider:'vercel-blob',objectKey,url:blob.url,downloadUrl:blob.downloadUrl||blob.url,size:buffer.length,mimeType};
  }

  async _signedGet(pathname){
    const {issueSignedToken,presignUrl}=await import('@vercel/blob');
    const validUntil=Date.now()+2*60*1000;
    const token=await issueSignedToken({pathname,operations:['get'],validUntil});
    const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil,useCache:false});
    if(!presignedUrl)throw providerError('BLOB_SIGNED_READ_URL_MISSING','Vercel Blob signed GET URL was not returned.');

    // Fresh pathnames should be read-after-write consistent. We still retry a short 404 window
    // because the upload and normalization happen in separate HTTP requests / compute regions.
    const waits=[0,120,300,650];
    let lastStatus=0,lastDetail='';
    for(const wait of waits){
      if(wait)await sleep(wait);
      let response;
      try{response=await fetch(presignedUrl,{method:'GET',cache:'no-store'})}
      catch(e){
        console.error('BLOB_SIGNED_READ_FETCH_ERROR',{pathname,error:safeProviderDetail(e?.message||e)});
        throw providerError('BLOB_SIGNED_READ_FETCH_FAILED','Vercel Blob signed GET request failed.',e,{pathname});
      }
      if(response.ok){
        const arrayBuffer=await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      lastStatus=response.status;
      lastDetail=safeProviderDetail(await response.text().catch(()=>''));
      if(response.status!==404)break;
    }
    console.error('BLOB_SIGNED_READ_HTTP_ERROR',{pathname,status:lastStatus,detail:lastDetail});
    throw providerError('BLOB_SIGNED_READ_HTTP_FAILED',`Vercel Blob signed GET failed with HTTP ${lastStatus||'unknown'}.`,null,{pathname,status:lastStatus,providerDetail:lastDetail});
  }

  async get(objectKeyOrUrl){
    const pathname=pathnameOf(objectKeyOrUrl);
    if(!pathname)throw providerError('BLOB_PATH_REQUIRED','BLOB_PATH_REQUIRED');
    try{
      // Use the same OIDC-backed signed-URL contract that is already proven for direct PUT.
      // This avoids ambiguous store resolution in SDK get() while keeping credentials server-side.
      return await this._signedGet(pathname);
    }catch(e){
      console.error('BLOB_READ_PROVIDER_ERROR',{
        code:e?.code||'BLOB_READ_FAILED',
        pathname,
        status:e?.status||null,
        detail:safeProviderDetail(e?.providerDetail||e?.message||e)
      });
      if(e?.code)throw e;
      throw providerError('BLOB_READ_FAILED','BLOB_READ_FAILED',e,{pathname});
    }
  }

  async health(){return authAvailable()}
}
