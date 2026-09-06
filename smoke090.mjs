import {deterministicSemanticProvider as p} from './src/ai/providers/deterministicSemanticProvider.js';
const r=await p.analyze({text:`بسم الله الرحمن الرحیم
متن مصوبه:
رسالت حوزه‌های علمیه خواهران:
بهره گیری از ظرفیت ها و منابع مالی نظام اسلامی با ملاحظه استقلال حوزه های علمیه خواهران؛`});
console.log(JSON.stringify(r));