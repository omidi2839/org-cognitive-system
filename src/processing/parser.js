import {unzipEntries,xmlText} from './officeZip.js';
const textMime=['text/plain','text/markdown','text/csv'];

const PERSIAN_LETTER='[\\u0621-\\u063A\\u0641-\\u064A\\u067E\\u0686\\u0698\\u06A9\\u06AF\\u06CC]';

export function normalizePersianText(input){
 let s=String(input??'').normalize('NFC');
 s=s
  .replace(/\u0640/g,'')
  .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'')
  .replace(/[يى]/g,'ی')
  .replace(/ك/g,'ک')
  .replace(/ۀ/g,'هٔ')
  .replace(/\r\n?/g,'\n')
  .replace(/[ \t\f\v]+/g,' ')
  .replace(/ *\n */g,'\n');

 s=s.replace(new RegExp(`(${PERSIAN_LETTER}+)\\s+ی\\s+(${PERSIAN_LETTER}+)`,'gu'),'$1ی$2');
 s=s.replace(new RegExp(`(${PERSIAN_LETTER}+)\\s+ی(?=\\s|[،؛:,.!?؟]|$)`,'gu'),'$1ی');
 s=s.replace(new RegExp(`(^|\\s)ی\\s+(${PERSIAN_LETTER}{2,})`,'gu'),'$1ی$2');

 s=s.replace(/\s+([،؛:,.!?؟])/g,'$1')
    .replace(/([،؛:!?؟])(?=[^\s\n])/g,'$1 ')
    .replace(/ {2,}/g,' ')
    .replace(/\n{3,}/g,'\n\n');
 return s.trim();
}

function pdfLite(buf){
 let s=buf.toString('latin1');
 const out=[];
 for(const m of s.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g))
   out.push(m[1].replace(/\\([()\\])/g,'$1'));
 for(const m of s.matchAll(/\[(.*?)\]\s*TJ/gs))
   for(const x of m[1].matchAll(/\(([^()]*)\)/g))out.push(x[1]);
 return out.join(' ').trim();
}

const paras=(text,kind='text')=>String(text).split(/\n+/).map(x=>x.trim()).filter(Boolean).map((text,i)=>({text,locationPointer:{kind,index:i+1}}));

function parseDocxStructure(raw){
 const body=(String(raw).match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/)||[])[1]||String(raw);
 const blocks=[];let paragraphNo=0,tableNo=0;
 for(const m of body.matchAll(/<w:(p|tbl)\b[\s\S]*?<\/w:\1>/g)){
   if(m[1]==='p'){
     const text=xmlText(m[0]).trim();
     if(text){paragraphNo++;blocks.push({type:'paragraph',paragraph:paragraphNo,text})}
   }else{
     tableNo++;const rows=[];let rowNo=0;
     for(const rm of m[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)){
       rowNo++;const row=[];let colNo=0;
       for(const cm of rm[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)){
         colNo++;
         const ps=[...cm[0].matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map(x=>xmlText(x[0]).trim()).filter(Boolean);
         row.push({row:rowNo,column:colNo,text:ps.join('\n'),paragraphs:ps});
       }
       if(row.length)rows.push(row);
     }
     blocks.push({type:'table',table:tableNo,rows});
   }
 }
 return{blocks,paragraphCount:paragraphNo,tableCount:tableNo}
}

export async function parseArtifact({buffer,mimeType,fileName}){
 const lower=fileName.toLowerCase();let text='',structure={kind:'unknown'},units=[];
 if(textMime.includes(mimeType)||/\.(txt|md|csv)$/.test(lower)){
   text=buffer.toString('utf8');structure={kind:'text'};units=paras(text,'line')
 }
 else if(lower.endsWith('.docx')){
   const z=unzipEntries(buffer),xml=z.get('word/document.xml');
   if(!xml)throw new Error('DOCX_DOCUMENT_XML_MISSING');
   const parsed=parseDocxStructure(String(xml)),parts=[];
   for(const b of parsed.blocks){
     if(b.type==='paragraph'){
       parts.push(b.text);
       units.push({text:b.text,locationPointer:{kind:'docx_paragraph',paragraph:b.paragraph}});
     }else{
       for(const row of b.rows){
         parts.push(row.map(c=>c.text).join('\t'));
         for(const c of row)if(c.text)units.push({text:c.text,locationPointer:{kind:'docx_table_cell',table:b.table,row:c.row,column:c.column}});
       }
     }
   }
   text=parts.join('\n')||xmlText(xml);
   structure={kind:'docx',paragraphCount:parsed.paragraphCount,tableCount:parsed.tableCount,blocks:parsed.blocks}
 }
 else if(lower.endsWith('.pptx')){
   const z=unzipEntries(buffer);
   const slides=[...z.entries()].filter(([n])=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([n,b],i)=>({slide:i+1,text:xmlText(b)}));
   text=slides.map(x=>x.text).join('\n');units=slides.filter(x=>x.text).map(x=>({text:x.text,locationPointer:{kind:'pptx_slide',slide:x.slide}}));structure={kind:'pptx',slides}
 }
 else if(lower.endsWith('.xlsx')){
   const z=unzipEntries(buffer),shared=z.get('xl/sharedStrings.xml'),strings=shared?[...String(shared).matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(m=>xmlText(m[1])):[];
   const sheets=[...z.entries()].filter(([n])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).map(([n,b],i)=>{
     const cells=[];
     for(const m of String(b).matchAll(/<c([^>]*)r="([^"]+)"([^>]*)>(.*?)<\/c>/gs)){
       const attrs=(m[1]||'')+(m[3]||''),vm=m[4].match(/<v>(.*?)<\/v>/s);let value=vm?vm[1]:'';
       if(/t="s"/.test(attrs)&&strings[Number(value)]!==undefined)value=strings[Number(value)];
       if(value)cells.push({ref:m[2],value})
     }
     return{sheet:i+1,cells}
   });
   units=sheets.flatMap(s=>s.cells.map(c=>({text:String(c.value),locationPointer:{kind:'xlsx_cell',sheet:s.sheet,cell:c.ref}})));
   text=units.map(x=>x.text).join('\n');structure={kind:'xlsx',sheets}
 }
 else if(lower.endsWith('.pdf')||mimeType==='application/pdf'){
   text=pdfLite(buffer);structure={kind:'pdf',parser:'text-layer-lite'};
   if(!text)throw Object.assign(new Error('PDF نیازمند استخراج پیشرفته متن/بینایی است.'),{code:'PDF_ADVANCED_EXTRACTION_REQUIRED'});
   units=paras(text,'pdf_text_segment')
 }
 else if(/\.(png|jpe?g|webp)$/.test(lower)||String(mimeType).startsWith('image/'))
   throw Object.assign(new Error('تصویر پذیرفته شده اما برای استخراج محتوا به Vision/OCR Provider نیاز است.'),{code:'VISION_PROVIDER_REQUIRED'});
 else throw Object.assign(new Error('FILE_TYPE_UNSUPPORTED'),{code:'FILE_TYPE_UNSUPPORTED'});

 text=normalizePersianText(text);
 units=(units||[]).map(u=>({...u,text:normalizePersianText(u.text)})).filter(u=>u.text);
 if(structure?.kind==='docx'&&Array.isArray(structure.blocks)){
   structure.blocks=structure.blocks.map(b=>b.type==='paragraph'
     ?{...b,text:normalizePersianText(b.text)}
     :{...b,rows:(b.rows||[]).map(row=>row.map(c=>({...c,text:normalizePersianText(c.text),paragraphs:(c.paragraphs||[]).map(normalizePersianText)})))});
 }
 return{text,units,structure,language:/[\u0600-\u06FF]/.test(text)?'fa':'unknown'};
}
