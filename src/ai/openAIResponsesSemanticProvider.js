import { semanticSchema } from '../semanticSchema.js';
const instructions=`تو موتور فهم شناختی اسناد سازمانی فارسی هستی.
ابتدا ساختار سند را تشخیص بده. عنوان سند، تیتر، برچسبی مثل «متن مصوبه:»، عبارت تشریفاتی مثل «بسم الله الرحمن الرحیم»، شماره/تاریخ و تیتر بخش را هرگز claim محتوایی ندان.
فقط body را تحلیل شناختی کن.
برای هر claim، ساختار معنایی خاص همان گزاره را بفهم: کنش، موضوع، ظرفیت/منبع، ذی‌نفع، قید، محدودیت، شرط، مرجع، هدف و روابط میان آنها.
سؤال‌ها را از ابهام واقعی همان claim بساز، نه از قالب تکراری. سؤال باید مشخص کند چه بخشی نیازمند تعریف، مصداق، مرز، معیار، شرط یا توضیح رابطه است.
مثال روش: در «بهره‌گیری از ظرفیت‌ها و منابع مالی نظام اسلامی با ملاحظه استقلال حوزه‌های علمیه خواهران»، درباره مصادیق ظرفیت‌ها، اجزای منابع مالی، معنای استقلال، معیار رعایت استقلال و رابطه منابع با استقلال سؤال اختصاصی بساز.
از پرسش‌های کلیشه‌ای یکسان برای همه مفاهیم پرهیز کن.`;
function outputText(r){if(typeof r.output_text==='string')return r.output_text;for(const item of r.output||[])for(const c of item.content||[])if(c.type==='output_text'&&c.text)return c.text;return''}
export const openAIResponsesSemanticProvider={
 name:'openai-responses',
 async analyze({text}){
  const key=process.env.AI_API_KEY;if(!key)throw Object.assign(new Error('AI_API_KEY_REQUIRED'),{code:'AI_API_KEY_REQUIRED'});
  const base=(process.env.AI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
  const model=process.env.AI_MODEL||'gpt-5.6-sol';
  const res=await fetch(base+'/responses',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify({
   model,instructions,input:[{role:'user',content:[{type:'input_text',text}]}],store:false,
   text:{format:{type:'json_schema',name:'organizational_semantic_understanding',strict:true,schema:semanticSchema}}
  })});
  if(!res.ok)throw Object.assign(new Error('AI_PROVIDER_ERROR '+res.status+' '+await res.text()),{code:'AI_PROVIDER_ERROR'});
  const raw=await res.json(),txt=outputText(raw);if(!txt)throw new Error('AI_EMPTY_STRUCTURED_OUTPUT');
  return {...JSON.parse(txt),provider:'openai-responses',model};
 }
};
