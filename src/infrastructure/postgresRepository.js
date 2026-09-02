const emptyState = () => ({documents:[],artifacts:[],normalizedDocuments:[],candidates:[],audit:[],provenance:[],aiExecutions:[],processingJobs:[],versionCandidates:[]});

export class PostgresRepository {
  constructor(connectionString = process.env.DATABASE_URL){
    if(!connectionString) throw new Error('DATABASE_URL is required for PostgresRepository');
    this.connectionString=connectionString;
    this.sql=null;
  }
  async client(){
    if(this.sql) return this.sql;
    const mod=await import('postgres');
    const postgres=mod.default;
    this.sql = postgres(this.connectionString, {
      ssl: this.connectionString.includes('localhost') ? false : 'require',
      max: Number(process.env.DB_POOL_MAX || 5),
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false
    });
    return this.sql;
  }
  async init(){
    const sql=await this.client();
    await sql`create table if not exists runtime_state (
      id text primary key,
      payload jsonb not null,
      version bigint not null default 1,
      updated_at timestamptz not null default now()
    )`;
    await sql`insert into runtime_state (id,payload) values ('primary', ${sql.json(emptyState())}) on conflict (id) do nothing`;
  }
  async all(){
    await this.init(); const sql=await this.client();
    const rows = await sql`select payload from runtime_state where id='primary'`;
    return structuredClone(rows[0]?.payload || emptyState());
  }
  async mutate(fn){
    await this.init(); const sql=await this.client();
    return sql.begin(async tx => {
      const rows = await tx`select payload, version from runtime_state where id='primary' for update`;
      const state = structuredClone(rows[0]?.payload || emptyState());
      const result = await fn(state);
      await tx`update runtime_state set payload=${tx.json(state)}, version=version+1, updated_at=now() where id='primary'`;
      return result;
    });
  }
  async health(){ const sql=await this.client(); const rows = await sql`select 1 as ok`; return rows[0]?.ok === 1; }
  async close(){ if(this.sql) await this.sql.end({timeout:5}); }
}
