const key='__ORG_COG_ARTIFACTS__';
export class MemoryArtifactStorage{
  constructor(){if(!globalThis[key]) globalThis[key]=new Map();}
  async put({objectKey,buffer,mimeType}){globalThis[key].set(objectKey,{buffer:Buffer.from(buffer),mimeType});return {provider:'memory',objectKey,size:buffer.length,mimeType};}
  async get(objectKey){const x=globalThis[key].get(objectKey);if(!x) throw new Error('ARTIFACT_NOT_FOUND');return Buffer.from(x.buffer);}
  async health(){return true;}
}
