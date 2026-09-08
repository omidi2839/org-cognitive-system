import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const required=[
  'api/document-bank-09582.js',
  'api/topic-suggestions-09582.js',
  'public/index.html',
  'public/document-bank-09582.js',
  'public/document-meeting-command-09582.js'
];

console.log('[RECOVERY 0.9.5.8.4] SAFE build — no files are deleted');
for(const rel of required){
  const full=path.join(root,rel);
  if(!fs.existsSync(full)){
    console.error(`[RECOVERY] Missing required active file: ${rel}`);
    process.exit(1);
  }
}
console.log('[RECOVERY] active files verified');
console.log('[RECOVERY] legacy files preserved for Vercel function discovery compatibility');
console.log('[RECOVERY] PostgreSQL/data untouched');
