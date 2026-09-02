import fs from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
if(!process.env.DATABASE_URL){ console.error('DATABASE_URL is required'); process.exit(1); }
const sql=postgres(process.env.DATABASE_URL,{ssl:process.env.DATABASE_URL.includes('localhost')?false:'require',max:1,prepare:false});
try{
  const dir=path.resolve('db');
  const files=(await fs.readdir(dir)).filter(x=>x.endsWith('.sql')).sort();
  await sql`create table if not exists schema_migrations (filename text primary key, applied_at timestamptz not null default now())`;
  for(const file of files){
    const done=await sql`select 1 from schema_migrations where filename=${file}`;
    if(done.length){ console.log('skip',file); continue; }
    const text=await fs.readFile(path.join(dir,file),'utf8');
    await sql.begin(async tx=>{ await tx.unsafe(text); await tx`insert into schema_migrations(filename) values (${file})`; });
    console.log('applied',file);
  }
} finally { await sql.end({timeout:5}); }
