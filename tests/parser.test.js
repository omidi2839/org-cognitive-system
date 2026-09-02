import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {parseArtifact} from '../src/processing/parser.js';
const base=new URL('./fixtures/',import.meta.url);
for(const [file,mime,needle] of [
 ['sample-fa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','بودجه'],
 ['sample-fa.pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation','تحول'],
 ['sample-fa.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','بودجه'],
 ['sample.pdf','application/pdf','Budget']]){
 test(`parse ${file}`,async()=>{const buffer=await fs.readFile(new URL(file,base));const r=await parseArtifact({buffer,mimeType:mime,fileName:file});assert.match(r.text,new RegExp(needle));});
}
