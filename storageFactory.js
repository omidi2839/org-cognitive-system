import {MemoryArtifactStorage} from './memoryArtifactStorage.js';
import {VercelBlobStorage} from './vercelBlobStorage.js';
let singleton;
export function createArtifactStorage(){if(singleton)return singleton;singleton=(process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID)?new VercelBlobStorage():new MemoryArtifactStorage();return singleton;}
export function storageMode(){return (process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID)?'vercel-blob':'ephemeral-memory';}
