import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAgendaBlobUpload } from '../src/application/meetingAgendaV1.js';
const path='meetings/ORG-SYN-001/M/drafts/D/document.pdf';
test('private/OIDC storage: failed HEAD is not treated as failed upload if private GET confirms it',async()=>{
 const calls=[];
 const blob={
  async head(){calls.push('head');throw Object.assign(Error('head unauthorized'),{code:'BLOB_ACCESS_ERROR'})},
  async get(p,opts){calls.push('get');assert.equal(p,path);assert.deepEqual(opts,{access:'private',useCache:false});return {statusCode:200,blob:{size:2048},stream:{async cancel(){calls.push('cancel')}}}}
 };
 assert.equal(await verifyAgendaBlobUpload(blob,path,2048),true);
 assert.deepEqual(calls,['head','get','cancel']);
});
test('private storage: signed HEAD confirms uploaded file if SDK head and get fail',async()=>{
 const calls=[];
 const blob={
  async head(){throw Error('head failed')},
  async get(){throw Error('get failed')},
  async issueSignedToken(v){calls.push(v);return 'scoped'},
  async presignUrl(token,v){assert.equal(token,'scoped');calls.push(v);return {presignedUrl:'https://private.example.test/object?signed=1'}}
 };
 const fetcher=async(url,opt)=>{assert.match(url,/private\.example/);assert.equal(opt.method,'HEAD');return {ok:true,status:200,headers:new Map([['content-length','2048']])}};
 assert.equal(await verifyAgendaBlobUpload(blob,path,2048,{fetcher}),true);
 assert.deepEqual(calls[0].operations,['head']);
 assert.equal(calls[1].access,'private');
});
test('must not accept mismatched file lengths from any verification source',async()=>{
 const blob={
  async head(){throw Error('not authorized')},
  async get(){return {statusCode:200,blob:{size:1400},stream:{async cancel(){}}}},
  async issueSignedToken(){return 'token'},
  async presignUrl(){return {presignedUrl:'https://private.test/file'}}
 };
 const fetcher=async()=>({ok:true,status:200,headers:new Map([['content-length','1400']])});
 const log=console.error;console.error=()=>{};
 try{await assert.rejects(()=>verifyAgendaBlobUpload(blob,path,2048,{fetcher}),{code:'BLOB_NOT_CONFIRMED',status:503});}finally{console.error=log;}
});
