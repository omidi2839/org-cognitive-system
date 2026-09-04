(()=> {
const workspaces = {
  personal:{title:'میزکار شناختی من',desc:'تمرکز، کارها، مسائل، تصمیمات و جلسات مرتبط با زمینه کاری شما',stages:[]},

  knowledge:{
    title:'دانش و اسناد سازمان',
    desc:'درگاه ورود، تحلیل، اعتبارسنجی و بازیابی دانش سازمانی',
    stages:[
      {title:'اسناد سازمان',subtitle:'ورود و طبقه‌بندی',items:['اسناد بالادستی','اسناد عمومی']},
      {title:'تحلیل و دانش',subtitle:'فهم و اعتبارسنجی',items:['تحلیل اسناد','دانش کلان','منابع و شواهد']}
    ]
  },

  direction:{
    title:'جهت‌گیری سازمان',
    desc:'ادامه شناختی اسناد؛ از شبکه مفاهیم تا سنجش جهت‌گیری و مراجع تحقق سازمان',
    stages:[
      {title:'لایه مفهومی',subtitle:'معنا و ساختار مفهومی',items:['شبکه مفاهیم','مفاهیم کمّی‌شده']},
      {title:'لایه جهت‌دهی',subtitle:'اهداف و انتخاب‌های راهبردی',items:['اهداف کلان','اهداف بخشی','اهداف موضوعی','سیاست‌ها','راهبردها']},
      {title:'لایه سنجش و تحقق',subtitle:'سنجش حرکت در جهت مطلوب',items:['شاخص‌های کلان','مراجع تحقق سازمان']}
    ]
  },

  cognition:{
    title:'شناخت و تحلیل سازمان',
    desc:'تصویر واقعیت داخلی و خارجی و زمینه شناختی تصمیم',
    stages:[
      {title:'واقعیت داخلی',subtitle:'آنچه درون سازمان وجود دارد',items:['وضعیت سازمان','ظرفیت‌ها']},
      {title:'واقعیت بیرونی',subtitle:'آنچه پیرامون سازمان رخ می‌دهد',items:['محیط سازمان','ذی‌نفعان','روندها و تحولات','فرصت‌ها و تهدیدها','تحلیل‌های تطبیقی','آینده‌نگاری']},
      {title:'ترکیب شناختی',subtitle:'جمع‌بندی معتبر از واقعیت',items:['تصویر شناختی سازمان']}
    ]
  },

  problems:{
    title:'مسائل سازمان',
    desc:'مسیر شناختی از نشانه و شکاف تا طراحی مداخله',
    stages:[
      {title:'۱. کشف و شناخت مسئله',subtitle:'نشانه ≠ مسئله',items:['نشانه‌ها و شکاف‌ها','شناخت مسئله']},
      {title:'۲. صورت‌بندی و اعتبارسنجی',subtitle:'تبدیل مسئله بالقوه به مسئله معتبر',items:['طراحی مسئله']},
      {title:'۳. تبیین و مهندسی مسئله',subtitle:'چرایی، اقتضا و کفایت',items:['مهندسی مسئله','شبکه علّی مسائل','فرضیه‌ها','اقتضائات تحقق','ظرفیت و کفایت']},
      {title:'۴. طراحی مداخله',subtitle:'از فهم مسئله به فضای راه‌حل',items:['راه‌حل‌ها و سناریوها']}
    ],
    pipeline:['نشانه','در حال شناخت','طراحی‌شده','در حال مهندسی','آماده طراحی راه‌حل']
  },

  decision:{
    title:'تصمیم و مدیریت',
    desc:'تبدیل توجه مدیریتی و شواهد به تصمیم آماده، مجاز و قابل ردیابی',
    stages:[
      {title:'ورودی مدیریت',subtitle:'چه چیزی نیازمند توجه است؟',items:['اولویت توجه','دستورکار مدیریت']},
      {title:'آماده‌سازی تصمیم',subtitle:'شواهد، گزینه‌ها و آمادگی',items:['آمادگی تصمیم','شواهد تصمیم','گزینه‌ها و سناریوهای تصمیم','بسته تصمیم']},
      {title:'حاکمیت تصمیم',subtitle:'اختیار ≠ تصمیم',items:['اختیار تصمیم','تصمیمات سازمانی']},
      {title:'پس از تصمیم',subtitle:'کنترل و پیگیری',items:['هشدارها و انحرافات تصمیم','پیگیری تصمیمات']}
    ]
  },

  meetings:{
    title:'جلسات',
    desc:'چرخه شناختی جلسه از آمادگی تا تصمیم، اقدام و حافظه',
    stages:[
      {title:'پیش از جلسه',subtitle:'آمادگی شناختی و سازماندهی',items:['جلسات پیش‌رو','دستور جلسه','آمادگی جلسه','بسته شناختی جلسه','شرکت‌کنندگان و نقش‌ها']},
      {title:'حین جلسه',subtitle:'گفت‌وگو، استدلال و قضاوت',items:['برگزاری جلسه','مباحث و استدلال‌ها']},
      {title:'خروجی جلسه',subtitle:'ثبت نتیجه رسمی',items:['مصوبات و تصمیمات','صورتجلسات']},
      {title:'پس از جلسه',subtitle:'پیگیری و حافظه',items:['اقدامات پس از جلسه','حافظه جلسات']}
    ]
  },

  planning:{
    title:'برنامه‌ریزی و بودجه‌بندی',
    desc:'ترجمه تصمیم و راهبرد به برنامه، شاخص، بودجه، ظرفیت و پایش اجرا',
    stages:[
      {title:'طراحی برنامه',subtitle:'از برنامه تا اقدام قابل اجرا',items:['برنامه‌ها','پروژه‌ها','اقدامات','شاخص‌های برنامه']},
      {title:'تأمین و تخصیص',subtitle:'منابع و توان قابل استفاده',items:['بودجه','تخصیص منابع','تخصیص ظرفیت']},
      {title:'آماده‌سازی اجرا',subtitle:'زمان و مسئولیت',items:['زمان‌بندی','مسئولیت‌ها']},
      {title:'کنترل اجرا',subtitle:'پایش، انحراف و اصلاح',items:['پایش اجرا','انحرافات','اقدامات اصلاحی']}
    ]
  },

  realization:{
    title:'تحقق و یادگیری',
    desc:'سنجش تحقق، مطلوبیت، اثر، عدم تحقق و تبدیل تجربه به حافظه سازمانی',
    stages:[
      {title:'سنجش عملکرد و تحقق',subtitle:'چه مقدار انجام و محقق شده است؟',items:['عملکرد سازمان','تحقق برنامه‌ها','تحقق اهداف','تحقق راهبردها','اثربخشی سیاست‌ها']},
      {title:'وضعیت مطلوبیت',subtitle:'فاصله وضعیت واقعی با وضعیت مطلوب',items:['وضعیت مطلوبیت سازمان','نتایج و پیامدها']},
      {title:'تحلیل سهم و عدم تحقق',subtitle:'چه چیزی و چه کسی اثر گذاشت؟',items:['سهم واحدها','سهم تصمیمات','تحلیل عدم تحقق']},
      {title:'یادگیری سازمانی',subtitle:'تبدیل تجربه به شناخت معتبر',items:['درس‌آموخته‌ها','حافظه سازمانی','بازنگری شناخت']}
    ]
  },

  admin:{
    title:'مدیریت سامانه',
    desc:'مدیریت هویت، دسترسی، داده، اتصال‌ها، امنیت و ممیزی',
    stages:[
      {title:'هویت و ساختار',subtitle:'سازمان، نقش و مسئولیت',items:['سازمان و ساختار','کاربران','نقش‌ها','مسئولیت‌ها','دسترسی‌ها','اختیارات']},
      {title:'داده و اتصال',subtitle:'ورودی‌های سامانه',items:['طبقه‌بندی اطلاعات','منابع داده','اتصال سامانه‌ها']},
      {title:'پلتفرم و حاکمیت',subtitle:'AI، فرایند، امنیت و ممیزی',items:['تنظیمات هوش مصنوعی','گردش‌های کاری','ممیزی و ردیابی','امنیت','نگهداری داده','تنظیمات سامانه']}
    ]
  }
};

const activeCapabilities = new Set([
  'تحلیل اسناد','دانش کلان','منابع و شواهد',
  'اولویت توجه','دستورکار مدیریت','آمادگی تصمیم',
  'جلسات پیش‌رو','آمادگی جلسه',
  'پایش اجرا','تحلیل عدم تحقق','حافظه سازمانی',
  'وضعیت مطلوبیت سازمان'
]);

const ctx=document.getElementById('workspaceContext');
const hero=document.getElementById('personalHero');
const suggestions=document.getElementById('personalSuggestions');

function capabilityCard(name){
  const live=activeCapabilities.has(name);
  return `<button class="capability-card ${live?'live':'planned'}" data-capability="${name}">
    <span class="capability-icon">${live?'✦':'◇'}</span>
    <b>${name}</b>
    <small>${live?'قابلیت فعال':'در حال توسعه'}</small>
  </button>`;
}

function stageBlock(stage, index){
  const semanticClass=`semantic-stage-${(index%4)+1}`;
  return `<section class="cognitive-stage ${semanticClass}">
    <div class="stage-head">
      <span class="stage-no">${String(index+1).padStart(2,'0')}</span>
      <div><b>${stage.title}</b><small>${stage.subtitle||''}</small></div>
    </div>
    <div class="stage-items">${stage.items.map(capabilityCard).join('')}</div>
  </section>`;
}

function renderPipeline(items){
  if(!items?.length) return '';
  return `<div class="problem-pipeline">
    ${items.map((x,i)=>`<div class="pipeline-node"><strong>${i===0?12:i===1?7:i===2?4:i===3?3:2}</strong><span>${x}</span></div>${i<items.length-1?'<i>←</i>':''}`).join('')}
  </div>`;
}

function render(key){
  const w=workspaces[key]||workspaces.personal;
  document.querySelectorAll('[data-workspace]').forEach(x=>x.classList.toggle('active',x.dataset.workspace===key));

  if(key==='personal'){
    ctx.classList.add('hidden');
    hero.style.display='';
    suggestions.style.display='';
    return;
  }

  hero.style.display='none';
  suggestions.style.display='none';
  ctx.classList.remove('hidden');

  ctx.innerHTML=`<div class="workspace-context-head">
      <div><span class="workspace-kicker">فضای کاری نقش‌محور</span><h1>${w.title}</h1><p>${w.desc}</p></div>
      <span class="persona-badge">مدیر راهبردی</span>
    </div>
    ${renderPipeline(w.pipeline)}
    <div class="stage-stack">${w.stages.map(stageBlock).join('')}</div>
    <div class="continuity-note">✦ زمینه کاری مسیر را تغییر می‌دهد، نه سطح اختیار را. قابلیت‌های پیامدی همچنان تابع دسترسی و احراز اختیار هستند.</div>`;

  ctx.querySelectorAll('[data-capability]').forEach(b=>b.onclick=()=>openCapability(key,b.dataset.capability,b.classList.contains('live')));
}

function openCapability(ws,name,live){
  if(name==='تحلیل اسناد'){document.getElementById('home')?.classList.add('active');return;}
  if(name==='دانش کلان'||name==='منابع و شواهد'){document.getElementById('knowledge')?.classList.add('active');return;}

  const commandMap={
    'اولویت توجه':'روی چه چیزی تمرکز کنم؟',
    'دستورکار مدیریت':'دستورکار مدیریت را نشان بده',
    'آمادگی تصمیم':'آمادگی این دستورکار را برای جلسه بررسی کن',
    'جلسات پیش‌رو':'جلسات امروز من',
    'آمادگی جلسه':'جلسه را آماده کن',
    'پایش اجرا':'وضعیت پایش اجرا را نشان بده',
    'تحلیل عدم تحقق':'علت عدم تحقق را بررسی کن',
    'حافظه سازمانی':'حافظه شناختی مرتبط را بازیابی کن',
    'وضعیت مطلوبیت سازمان':'وضعیت مطلوبیت سازمان را نشان بده'
  };

  if(live&&commandMap[name]){
    const input=document.getElementById('commandInput');
    if(input){
      input.value=commandMap[name];
      document.getElementById('runCommand')?.click();
      setTimeout(()=>document.getElementById('commandResult')?.scrollIntoView({behavior:'smooth'}),250);
    }
  } else {
    alert(`«${name}» در معماری محصول ثبت شده و در Buildهای بعدی عملیاتی می‌شود.`);
  }
}

document.querySelectorAll('[data-workspace]').forEach(b=>b.onclick=()=>render(b.dataset.workspace));
document.getElementById('contextSwitcher')?.addEventListener('click',()=>alert(
  'زمینه فعال: مدیر راهبردی · مدیریت استراتژی و تحول\nتغییر زمینه در نسخه‌های بعدی به Assignmentهای واقعی متصل می‌شود و باعث افزایش دسترسی نخواهد شد.'
));
render('personal');
})();