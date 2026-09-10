import crypto from 'node:crypto';

const COOKIE='org_cognitive_admin';
const DEFAULT_USER='admin';
const DEFAULT_PASSWORD='Cognitive@1405!';
const MAX_AGE=12*60*60;

const b64=v=>Buffer.from(String(v),'utf8').toString('base64url');
const unb64=v=>Buffer.from(String(v),'base64url').toString('utf8');
function secret(){return String(process.env.APP_AUTH_SECRET||process.env.ADMIN_PASSWORD||DEFAULT_PASSWORD)+'|org-cognitive-system|v1'}
function sign(payload){return crypto.createHmac('sha256',secret()).update(payload).digest('base64url')}
function timingEqual(a,b){try{const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}catch{return false}}
export function adminCredentials(){return {username:String(process.env.ADMIN_USERNAME||DEFAULT_USER),password:String(process.env.ADMIN_PASSWORD||DEFAULT_PASSWORD)}}
export function createSession(username){
  const exp=Math.floor(Date.now()/1000)+MAX_AGE;
  const payload=b64(JSON.stringify({u:String(username),exp,role:'system_admin'}));
  return `${payload}.${sign(payload)}`;
}
export function verifySession(token){
  try{
    const [payload,sig]=String(token||'').split('.');if(!payload||!sig||!timingEqual(sign(payload),sig))return null;
    const data=JSON.parse(unb64(payload));if(!data?.u||Number(data.exp||0)<Math.floor(Date.now()/1000))return null;
    return data;
  }catch{return null}
}
function cookieMap(req){return Object.fromEntries(String((req.headers||{}).cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i<0?[x,'']:[x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
export function sessionOf(req){return verifySession(cookieMap(req)[COOKIE]||'')}
export function setSessionCookie(res,token){res.setHeader('set-cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`)}
export function clearSessionCookie(res){res.setHeader('set-cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`)}
export function requireAuthenticated(req,res){
  const session=sessionOf(req);if(session)return session;
  res.statusCode=401;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify({code:'AUTH_REQUIRED',message:'ورود به سامانه الزامی است.'}));return null;
}
export function validateAdminLogin(username,password){
  const c=adminCredentials();return timingEqual(String(username||''),c.username)&&timingEqual(String(password||''),c.password);
}
export const AUTH_COOKIE_NAME=COOKIE;
