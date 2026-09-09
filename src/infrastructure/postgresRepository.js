import { gzipSync, gunzipSync } from 'node:zlib';

const emptyState = () => ({
  documents:[],artifacts:[],normalizedDocuments:[],candidates:[],audit:[],provenance:[],aiExecutions:[],processingJobs:[],versionCandidates:[]
});

const clone = value => structuredClone(value);
const encode = state => gzipSync(Buffer.from(JSON.stringify(state),'utf8'), { level: 9 });
const decode = value => {
  if(!value) return emptyState();
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return JSON.parse(gunzipSync(buf).toString('utf8'));
};
const countState = state => ({
  documents:Array.isArray(state?.documents)?state.documents.length:0,
  artifacts:Array.isArray(state?.artifacts)?state.artifacts.length:0,
  normalizedDocuments:Array.isArray(state?.normalizedDocuments)?state.normalizedDocuments.length:0,
  candidates:Array.isArray(state?.candidates)?state.candidates.length:0,
  audit:Array.isArray(state?.audit)?state.audit.length:0,
  provenance:Array.isArray(state?.provenance)?state.provenance.length:0,
  processingJobs:Array.isArray(state?.processingJobs)?state.processingJobs.length:0,
  collaborativeAnalysisCases:Array.isArray(state?.collaborativeAnalysisCases)?state.collaborativeAnalysisCases.length:0,
  collaborativeAnalysisResponses:Array.isArray(state?.collaborativeAnalysisResponses)?state.collaborativeAnalysisResponses.length:0
});

export class PostgresRepository {
  constructor(connectionString = process.env.DATABASE_URL){
    if(!connectionString) throw new Error('DATABASE_URL is required for PostgresRepository');
    this.connectionString=connectionString;
    this.sql=null;
    this.initialized=false;
    this.cacheState=null;
    this.cacheVersion=null;
  }
  async client(){
    if(this.sql) return this.sql;
    const mod=await import('postgres');
    const postgres=mod.default;
    this.sql = postgres(this.connectionString, {
      ssl: this.connectionString.includes('localhost') ? false : 'require',
      max: Number(process.env.DB_POOL_MAX || 2),
      idle_timeout: 15,
      connect_timeout: 15,
      prepare: false
    });
    return this.sql;
  }
  async init(){
    if(this.initialized) return;
    const sql=await this.client();
    await sql`create table if not exists runtime_state_v2 (
      id text primary key,
      payload_gzip bytea not null,
      codec text not null default 'gzip-json-v1',
      version bigint not null default 1,
      updated_at timestamptz not null default now()
    )`;
    const existing=await sql`select version from runtime_state_v2 where id='primary'`;
    if(!existing.length){
      let state=emptyState(),version=1;
      const legacyExists=await sql`select to_regclass('public.runtime_state') as name`;
      if(legacyExists[0]?.name){
        const legacy=await sql`select payload, version from runtime_state where id='primary' limit 1`;
        if(legacy.length){
          state=legacy[0].payload || emptyState();
          version=Number(legacy[0].version || 1);
        }
      }
      const packed=encode(state);
      await sql`insert into runtime_state_v2 (id,payload_gzip,codec,version) values ('primary',${packed},'gzip-json-v1',${version}) on conflict (id) do nothing`;
      this.cacheState=clone(state);
      this.cacheVersion=version;
    }
    this.initialized=true;
  }
  async all(){
    await this.init();
    const sql=await this.client();
    const vr=await sql`select version from runtime_state_v2 where id='primary'`;
    const version=Number(vr[0]?.version || 1);
    if(this.cacheState && this.cacheVersion===version) return clone(this.cacheState);
    const rows=await sql`select payload_gzip, version from runtime_state_v2 where id='primary'`;
    const state=decode(rows[0]?.payload_gzip);
    this.cacheState=clone(state);
    this.cacheVersion=Number(rows[0]?.version || version);
    return clone(state);
  }
  async mutate(fn){
    await this.init();
    const sql=await this.client();
    return sql.begin(async tx => {
      const rows = await tx`select payload_gzip, version from runtime_state_v2 where id='primary' for update`;
      const state = decode(rows[0]?.payload_gzip);
      const result = await fn(state);
      const packed=encode(state);
      const nextVersion=Number(rows[0]?.version || 1)+1;
      await tx`update runtime_state_v2 set payload_gzip=${packed}, codec='gzip-json-v1', version=${nextVersion}, updated_at=now() where id='primary'`;
      this.cacheState=clone(state);
      this.cacheVersion=nextVersion;
      return result;
    });
  }
  async exportSnapshot(){
    await this.init();
    const state=await this.all();
    return {format:'runtime-state-v2',codec:'gzip-json-v1',exportedAt:new Date().toISOString(),state,counts:countState(state)};
  }
  async importSnapshot(snapshot,{requireEmpty=true}={}){
    await this.init();
    const state=snapshot?.state || snapshot;
    if(!state || typeof state!=='object') throw Object.assign(new Error('MIGRATION_SNAPSHOT_INVALID'),{code:'MIGRATION_SNAPSHOT_INVALID'});
    const sql=await this.client();
    return sql.begin(async tx=>{
      const rows=await tx`select payload_gzip, version from runtime_state_v2 where id='primary' for update`;
      const current=decode(rows[0]?.payload_gzip);
      const currentCounts=countState(current);
      const occupied=Object.values(currentCounts).some(n=>Number(n)>0);
      if(requireEmpty && occupied) throw Object.assign(new Error('MIGRATION_TARGET_NOT_EMPTY'),{code:'MIGRATION_TARGET_NOT_EMPTY',counts:currentCounts});
      const packed=encode(state);
      const nextVersion=Number(rows[0]?.version || 1)+1;
      await tx`update runtime_state_v2 set payload_gzip=${packed}, codec='gzip-json-v1', version=${nextVersion}, updated_at=now() where id='primary'`;
      this.cacheState=clone(state);
      this.cacheVersion=nextVersion;
      return {ok:true,version:nextVersion,counts:countState(state),compressedBytes:packed.length};
    });
  }
  async stats(){
    await this.init();
    const sql=await this.client();
    const rows=await sql`select version, octet_length(payload_gzip) as compressed_bytes, updated_at from runtime_state_v2 where id='primary'`;
    const state=await this.all();
    return {mode:'postgres-compressed-v2',version:Number(rows[0]?.version||1),compressedBytes:Number(rows[0]?.compressed_bytes||0),updatedAt:rows[0]?.updated_at||null,counts:countState(state)};
  }
  async health(){ const sql=await this.client(); const rows=await sql`select 1 as ok`; return rows[0]?.ok === 1; }
  async close(){ if(this.sql) await this.sql.end({timeout:5}); }
}
