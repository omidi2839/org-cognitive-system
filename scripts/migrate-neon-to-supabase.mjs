import { PostgresRepository } from '../src/infrastructure/postgresRepository.js';

const sourceUrl=process.env.SOURCE_DATABASE_URL;
const targetUrl=process.env.TARGET_DATABASE_URL;
if(!sourceUrl || !targetUrl){
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required.');
  process.exit(2);
}
const source=new PostgresRepository(sourceUrl);
const target=new PostgresRepository(targetUrl);
try{
  console.log('Reading source snapshot once...');
  const snapshot=await source.exportSnapshot();
  console.log('Source counts:',snapshot.counts);
  console.log('Importing into target...');
  const imported=await target.importSnapshot(snapshot,{requireEmpty:true});
  console.log('Target import:',imported);
  const verify=await target.exportSnapshot();
  const same=JSON.stringify(snapshot.counts)===JSON.stringify(verify.counts);
  console.log('Verification counts:',verify.counts);
  if(!same) throw new Error('MIGRATION_VERIFICATION_FAILED');
  console.log('MIGRATION_OK');
}catch(e){
  console.error('MIGRATION_FAILED',e?.code||'',e?.message||e);
  if(e?.counts) console.error('Target counts:',e.counts);
  process.exitCode=1;
}finally{
  await Promise.allSettled([source.close(),target.close()]);
}
