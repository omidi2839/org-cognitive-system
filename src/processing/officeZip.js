import zlib from 'node:zlib';
function u16(b,o){return b.readUInt16LE(o)} function u32(b,o){return b.readUInt32LE(o)}
export function unzipEntries(buf){
  const sig=0x06054b50; let e=-1; for(let i=Math.max(0,buf.length-66000);i<=buf.length-22;i++){if(buf.readUInt32LE(i)===sig)e=i;} if(e<0) throw new Error('ZIP_EOCD_NOT_FOUND');
  const count=u16(buf,e+10), cd=u32(buf,e+16); let p=cd; const out=new Map();
  for(let i=0;i<count;i++){if(u32(buf,p)!==0x02014b50) throw new Error('ZIP_CENTRAL_INVALID'); const method=u16(buf,p+10), comp=u32(buf,p+20), nlen=u16(buf,p+28), xlen=u16(buf,p+30), clen=u16(buf,p+32), lo=u32(buf,p+42); const name=buf.subarray(p+46,p+46+nlen).toString('utf8'); const ln=u16(buf,lo+26), lx=u16(buf,lo+28), start=lo+30+ln+lx; const data=buf.subarray(start,start+comp); let raw;if(method===0)raw=data; else if(method===8)raw=zlib.inflateRawSync(data); else {p+=46+nlen+xlen+clen;continue;} out.set(name,raw); p+=46+nlen+xlen+clen; }
  return out;
}
export const xmlText=x=>String(x).replace(/<w:tab\/?\s*>/g,'\t').replace(/<a:br\/?\s*>/g,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
