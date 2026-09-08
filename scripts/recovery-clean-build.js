import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();

const keepApi=new Set([
  'index.js',
  'ping.js',
  'document-query.js',
  'document-relations.js',
  'document-repository-diagnostic.js',
  'document-structure.js',
  'knowledge-documents.js',
  'test-data-reset.js',
  'document-bank-core.js',
  'document-bank-09582.js',
  'topic-suggestions-09582.js'
]);

const keepPublic=new Set([
  'index.html',
  'styles.css',
  'app.js',
  'workspace-shell-075.css',
  'workspace-shell-075.js',
  'knowledge-workspace-076.css',
  'knowledge-workspace-076.js',
  'document-amendments-093.css',
  'document-amendments-093.js',
  'document-relations-ui-0944.css',
  'document-relations-ui-0944.js',
  'document-bank-09582.css',
  'document-bank-09582.js',
  'document-meeting-command-09582.css',
  'document-meeting-command-09582.js',
  'recovery-build.txt'
]);

function cleanDir(dirName,keep){
  const dir=path.join(root,dirName);
  if(!fs.existsSync(dir))return {removed:[],kept:[]};
  const removed=[],kept=[];
  for(const name of fs.readdirSync(dir)){
    const full=path.join(dir,name);
    const stat=fs.statSync(full);
    if(!stat.isFile()){kept.push(name+'/');continue}
    if(keep.has(name)){kept.push(name);continue}
    fs.rmSync(full,{force:true});
    removed.push(name);
  }
  return {removed,kept};
}

const api=cleanDir('api',keepApi);
const pub=cleanDir('public',keepPublic);

const marker=`ORG Cognitive System Recovery Build
Version: 0.9.5.8.3
Node: ${process.version}
UTC: ${new Date().toISOString()}
`;
fs.writeFileSync(path.join(root,'public','recovery-build.txt'),marker,'utf8');

console.log('[RECOVERY 0.9.5.8.3] clean build workspace');
console.log(`[RECOVERY] API removed=${api.removed.length}, kept=${api.kept.length}`);
console.log(`[RECOVERY] Public removed=${pub.removed.length}, kept=${pub.kept.length}`);
console.log('[RECOVERY] PostgreSQL/data untouched');
