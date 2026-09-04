(()=>{
const workspaces={
 personal:{title:'میزکار شناختی من',desc:'تمرکز، کارها، مسائل، تصمیمات و جلسات مرتبط با زمینه کاری شما',groups:[]},
 knowledge:{title:'دانش و اسناد سازمان',desc:'درگاه ورود، تحلیل، اعتبارسنجی و بازیابی دانش سازمانی',groups:['اسناد بالادستی','اسناد عمومی','تحلیل اسناد','دانش کلان','منابع و شواهد']},
 direction:{title:'جهت‌گیری سازمان',desc:'ادامه شناختی اسناد؛ از شبکه مفاهیم تا مراجع تحقق سازمان',groups:['شبکه مفاهیم','مفاهیم کمّی‌شده','اهداف کلان','اهداف بخشی','اهداف موضوعی','شاخص‌های کلان','سیاست‌ها','راهبردها','مراجع تحقق سازمان']},
 cognition:{title:'شناخت و تحلیل سازمان',desc:'تصویر واقعیت داخلی و خارجی و زمینه شناختی تصمیم',groups:['وضعیت سازمان','محیط سازمان','ذی‌نفعان','ظرفیت‌ها','روندها و تحولات','فرصت‌ها و تهدیدها','تحلیل‌های تطبیقی','آینده‌نگاری','تصویر شناختی سازمان']},
 problems:{title:'مسائل سازمان',desc:'از نشانه و شکاف تا طراحی، مهندسی و فضای راه‌حل',groups:['نشانه‌ها و شکاف‌ها','شناخت مسئله','طراحی مسئله','مهندسی مسئله','شبکه علّی مسائل','فرضیه‌ها','اقتضائات تحقق','ظرفیت و کفایت','راه‌حل‌ها و سناریوها']},
 decision:{title:'تصمیم و مدیریت',desc:'تبدیل توجه مدیریتی و شواهد به تصمیم آماده و قابل ردیابی',groups:['اولویت توجه','دستورکار مدیریت','آمادگی تصمیم','بسته تصمیم','گزینه‌ها و سناریوهای تصمیم','شواهد تصمیم','اختیار تصمیم','تصمیمات سازمانی','هشدارها و انحرافات تصمیم','پیگیری تصمیمات']},
 meetings:{title:'جلسات',desc:'چرخه شناختی جلسه از آمادگی تا تصمیم، اقدام و حافظه',groups:['جلسات پیش‌رو','دستور جلسه','آمادگی جلسه','بسته شناختی جلسه','شرکت‌کنندگان و نقش‌ها','برگزاری جلسه','مباحث و استدلال‌ها','مصوبات و تصمیمات','صورتجلسات','اقدامات پس از جلسه','حافظه جلسات']},
 planning:{title:'برنامه‌ریزی و بودجه‌بندی',desc:'ترجمه تصمیم و راهبرد به برنامه، بودجه، ظرفیت و پایش اجرا',groups:['برنامه‌ها','پروژه‌ها','اقدامات','بودجه','تخصیص منابع','تخصیص ظرفیت','زمان‌بندی','مسئولیت‌ها','پایش اجرا','انحرافات','اقدامات اصلاحی']},
 realization:{title:'تحقق و یادگیری',desc:'سنجش تحقق، اثر، عدم تحقق و تبدیل تجربه به حافظه سازمانی',groups:['عملکرد سازمان','تحقق اهداف','تحقق مراجع تحقق','تحقق راهبردها','اثربخشی سیاست‌ها','نتایج و پیامدها','سهم واحدها','سهم تصمیمات','تحلیل عدم تحقق','درس‌آموخته‌ها','حافظه سازمانی','بازنگری شناخت']},
 admin:{title:'مدیریت سامانه',desc:'مدیریت هویت، دسترسی، داده، اتصال‌ها، امنیت و ممیزی',groups:['سازمان و ساختار','کاربران','نقش‌ها','مسئولیت‌ها','دسترسی‌ها','اختیارات','طبقه‌بندی اطلاعات','منابع داده','اتصال سامانه‌ها','تنظیمات هوش مصنوعی','گردش‌های کاری','ممیزی و ردیابی','امنیت','نگهداری داده','تنظیمات سامانه']}
};
const activeCapabilities=new Set(['تحلیل اسناد','دانش کلان','منابع و شواهد','اولویت توجه','دستورکار مدیریت','آمادگی تصمیم','جلسات پیش‌رو','آمادگی جلسه','پایش اجرا','تحلیل عدم تحقق','حافظه سازمانی','تحقق مراجع تحقق']);
const ctx=document.getElementById('workspaceContext'),hero=document.getElementById('personalHero'),suggestions=document.getElementById('personalSuggestions');
function render(key){const w=workspaces[key]||workspaces.personal;document.querySelectorAll('[data-workspace]').forEach(x=>x.classList.toggle('active',x.dataset.workspace===key));
 if(key==='personal'){ctx.classList.add('hidden');hero.style.display='';suggestions.style.display='';return}
 hero.style.display='none';suggestions.style.display='none';ctx.classList.remove('hidden');
 const cards=w.groups.map(g=>{const live=activeCapabilities.has(g);return `<button class="capability-card ${live?'live':'planned'}" data-capability="${g}"><span class="capability-icon">${live?'✦':'◇'}</span><b>${g}</b><small>${live?'قابلیت فعال':'در حال توسعه'}</small></button>`}).join('');
 ctx.innerHTML=`<div class="workspace-context-head"><div><span class="workspace-kicker">فضای کاری نقش‌محور</span><h1>${w.title}</h1><p>${w.desc}</p></div><span class="persona-badge">مدیر راهبردی</span></div><div class="capability-grid">${cards}</div><div class="continuity-note">✦ زمینه کاری مسیر را تغییر می‌دهد، نه سطح اختیار را. قابلیت‌های پیامدی همچنان تابع دسترسی و احراز اختیار هستند.</div>`;
 ctx.querySelectorAll('[data-capability]').forEach(b=>b.onclick=()=>openCapability(key,b.dataset.capability,b.classList.contains('live')));
 }
function openCapability(ws,name,live){if(name==='تحلیل اسناد'){document.getElementById('home')?.classList.add('active');return}if(name==='دانش کلان'||name==='منابع و شواهد'){document.getElementById('knowledge')?.classList.add('active');return}
 const commandMap={'اولویت توجه':'روی چه چیزی تمرکز کنم؟','دستورکار مدیریت':'دستورکار مدیریت را نشان بده','آمادگی تصمیم':'آمادگی این دستورکار را برای جلسه بررسی کن','جلسات پیش‌رو':'جلسات امروز من','آمادگی جلسه':'جلسه را آماده کن','پایش اجرا':'وضعیت پایش اجرا را نشان بده','تحلیل عدم تحقق':'علت عدم تحقق را بررسی کن','حافظه سازمانی':'حافظه شناختی مرتبط را بازیابی کن','تحقق مراجع تحقق':'وضعیت تحقق اهداف را نشان بده'};
 if(live&&commandMap[name]){const input=document.getElementById('commandInput');if(input){input.value=commandMap[name];document.getElementById('runCommand')?.click();setTimeout(()=>document.getElementById('commandResult')?.scrollIntoView({behavior:'smooth'}),250)}}
 else alert(`«${name}» در معماری محصول ثبت شده و در Buildهای بعدی عملیاتی می‌شود.`)}
document.querySelectorAll('[data-workspace]').forEach(b=>b.onclick=()=>render(b.dataset.workspace));
document.getElementById('contextSwitcher')?.addEventListener('click',()=>alert('زمینه فعال: مدیر راهبردی · مدیریت استراتژی و تحول\nتغییر زمینه در نسخه‌های بعدی به Assignmentهای واقعی متصل می‌شود و باعث افزایش دسترسی نخواهد شد.'));
render('personal');
})();