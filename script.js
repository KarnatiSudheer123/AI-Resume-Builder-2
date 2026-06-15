(() => {
  'use strict';
  const STORAGE_KEY = 'resumeforge.data.v1';
  const META_KEY = 'resumeforge.meta.v1';
  const defaultData = {
    fullName:'', email:'', phone:'', linkedin:'', github:'', portfolio:'',
    address:'', summary:'', degree:'', college:'', branch:'', cgpa:'',
    gradYear:'', intermediate:'', ssc:'', achievements:'',
    photo:'',
    skills:{frontend:[],backend:[],database:[],languages:[]},
    projects:[], experience:[], internships:[], certifications:[],
    languages:[], strengths:[], interests:[],
    template:'modern'
  };
  let data = load();
  let meta = JSON.parse(localStorage.getItem(META_KEY)) || { totalResumes:1, score:null, lastUpdated:null };
  let zoom = 1;
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return structuredClone(defaultData);
      return Object.assign(structuredClone(defaultData), JSON.parse(raw));
    }catch{ return structuredClone(defaultData); }
  }
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    meta.lastUpdated = new Date().toLocaleString();
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    updateDashboard();
  }

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    bindFields();
    bindSkills();
    bindChipGroup('langChips','languages');
    bindChipGroup('strengthChips','strengths');
    bindChipGroup('interestChips','interests');
    bindCustomAdd('addLangBtn','customLangInput','langChips','languages');
    bindCustomAdd('addInterestBtn','customInterestInput','interestChips','interests');
    bindDynamic();
    bindTemplates();
    bindActions();
    bindTheme();
    bindNav();
    bindZoom();
    bindSummary();
    bindAi();
    document.getElementById('year').textContent = new Date().getFullYear();
    hydrate();
    renderAll();
    updateDashboard();

    // Autosave
    setInterval(save, 4000);
  });

  /* ---------- FIELD BINDING ---------- */
  function bindFields(){
    document.querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('input', () => {
        data[el.dataset.field] = el.value;
        renderPreview(); updateProgress();
      });
    });
    document.getElementById('photoInput').addEventListener('change', e => {
      const f = e.target.files?.[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = ev => { data.photo = ev.target.result; renderPreview(); save(); };
      reader.readAsDataURL(f);
    });
  }
  function bindSkills(){
    document.querySelectorAll('.chips[data-group]').forEach(group => {
      const key = group.dataset.group;
      group.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => {
          data.skills[key] = [...group.querySelectorAll('input:checked')].map(i=>i.value);
          renderPreview(); updateProgress();
        });
      });
    });
  }
  function bindChipGroup(containerId, key){
    const c = document.getElementById(containerId);
    c.addEventListener('change', () => {
      data[key] = [...c.querySelectorAll('input:checked')].map(i=>i.value);
      renderPreview(); updateProgress();
    });
  }
  function bindCustomAdd(btnId, inputId, containerId, key){
    document.getElementById(btnId).addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      const val = inp.value.trim(); if(!val) return;
      const c = document.getElementById(containerId);
      const lbl = document.createElement('label');
      lbl.innerHTML = `<input type="checkbox" value="${escapeHtml(val)}" checked/><span>${escapeHtml(val)}</span>`;
      c.appendChild(lbl);
      lbl.querySelector('input').addEventListener('change', () => {
        data[key] = [...c.querySelectorAll('input:checked')].map(i=>i.value);
        renderPreview(); updateProgress();
      });
      data[key].push(val); inp.value=''; renderPreview(); updateProgress();
    });
  }

  /* ---------- DYNAMIC LISTS ---------- */
  const schemas = {
    projects:[
      {k:'title',l:'Project Title'},{k:'tech',l:'Technologies Used'},
      {k:'desc',l:'Description',type:'textarea'},
      {k:'github',l:'GitHub Link'},{k:'demo',l:'Live Demo Link'},{k:'duration',l:'Duration'}
    ],
    experience:[
      {k:'company',l:'Company Name'},{k:'role',l:'Role'},
      {k:'start',l:'Start Date'},{k:'end',l:'End Date'},
      {k:'responsibilities',l:'Responsibilities',type:'textarea'},
      {k:'tech',l:'Technologies Used'}
    ],
    internships:[
      {k:'company',l:'Company'},{k:'role',l:'Role'},
      {k:'duration',l:'Duration'},{k:'desc',l:'Description',type:'textarea'}
    ],
    certifications:[
      {k:'name',l:'Certification Name'},{k:'org',l:'Organization'},
      {k:'date',l:'Issue Date'},{k:'link',l:'Credential Link'}
    ]
  };
  function bindDynamic(){
    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => addItem(btn.dataset.add));
    });
  }
  function addItem(type){
    const item = {}; schemas[type].forEach(f => item[f.k]='');
    item._id = Date.now() + Math.random();
    data[type].push(item);
    renderDynamic(type); renderPreview(); updateProgress();
  }
  function renderDynamic(type){
    const list = document.getElementById(type+'List');
    list.innerHTML = '';
    data[type].forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'dyn-item';
      const fields = schemas[type].map(f => {
        const val = escapeHtml(item[f.k]||'');
        if(f.type==='textarea')
          return `<label class="full">${f.l}<textarea data-key="${f.k}">${val}</textarea></label>`;
        return `<label>${f.l}<input type="text" data-key="${f.k}" value="${val}" /></label>`;
      }).join('');
      div.innerHTML = `<div class="grid-2">${fields}</div>
        <div class="actions">
          <button class="btn" data-del="${idx}">🗑 Delete</button>
        </div>`;
      div.querySelectorAll('[data-key]').forEach(inp => {
        inp.addEventListener('input', () => {
          data[type][idx][inp.dataset.key] = inp.value;
          renderPreview(); updateProgress();
        });
      });
      div.querySelector('[data-del]').addEventListener('click', () => {
        data[type].splice(idx,1); renderDynamic(type); renderPreview(); updateProgress();
      });
      list.appendChild(div);
    });
  }

  /* ---------- TEMPLATES ---------- */
  function bindTemplates(){
    document.querySelectorAll('.tpl').forEach(t => {
      t.addEventListener('click', () => {
        data.template = t.dataset.tpl;
        document.querySelectorAll('.tpl').forEach(x => x.classList.toggle('active', x===t));
        renderPreview();
      });
    });
  }

  /* ---------- ACTIONS ---------- */
  function bindActions(){
    document.getElementById('saveBtn').addEventListener('click', () => {
      save(); toast('Resume saved!');
    });
    document.getElementById('downloadPdf').addEventListener('click', () => {
      window.print();
    });
    document.getElementById('downloadDoc').addEventListener('click', downloadDoc);
    document.getElementById('aiGenerateBtn').addEventListener('click', () => {
      generateAi('generate');
      document.getElementById('builder').scrollIntoView({behavior:'smooth'});
    });
  }
  function downloadDoc(){
    const html = document.getElementById('resumePreview').outerHTML;
    const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Resume</title></head><body>${html}</body></html>`;
    const blob = new Blob(['\ufeff', doc], {type:'application/msword'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (data.fullName||'resume') + '.doc';
    a.click();
  }

  /* ---------- THEME / NAV ---------- */
  function bindTheme(){
    const btn = document.getElementById('themeToggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    btn.textContent = saved === 'light' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
      btn.textContent = next === 'light' ? '☀️' : '🌙';
    });
  }
  function bindNav(){
    const links = document.getElementById('navLinks');
    document.getElementById('menuToggle').addEventListener('click', () => {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- ZOOM ---------- */
  function bindZoom(){
    document.getElementById('zoomIn').addEventListener('click', () => { zoom = Math.min(zoom+.1,1.6); applyZoom(); });
    document.getElementById('zoomOut').addEventListener('click', () => { zoom = Math.max(zoom-.1,.5); applyZoom(); });
  }
  function applyZoom(){ document.getElementById('resumePreview').style.transform = `scale(${zoom})`; }
  
  /* ---------- SUMMARY ---------- */
  function bindSummary(){
    const t = document.getElementById('summary');
    const c = document.getElementById('summaryCount');
    const upd = () => c.textContent = t.value.length;
    t.addEventListener('input', upd); upd();
    document.querySelectorAll('[data-ai]').forEach(b => {
      b.addEventListener('click', () => { generateAi(b.dataset.ai); upd(); });
    });
  }
  function generateAi(mode){
    const role = data.degree || 'professional';
    const skills = [...data.skills.frontend, ...data.skills.backend, ...data.skills.languages].slice(0,5).join(', ') || 'modern technologies';
    const templates = {
      generate:`Results-driven ${role} with hands-on experience building scalable applications using ${skills}. Passionate about clean code, performance, and continuous learning. Eager to contribute technical expertise and problem-solving skills to deliver impactful solutions.`,
      improve:(data.summary||'Motivated developer') + ' Demonstrated ability to thrive in fast-paced environments, collaborate with cross-functional teams, and consistently deliver high-quality results aligned with business goals.',
      rewrite:`Innovative ${role} specializing in ${skills}. Proven track record of architecting robust, user-centric solutions and translating complex requirements into elegant, maintainable code. Committed to driving measurable impact through technical excellence and collaborative leadership.`
    };
    data.summary = templates[mode] || templates.generate;
    document.getElementById('summary').value = data.summary;
    renderPreview(); updateProgress(); save();
    toast('AI suggestion applied');
  }

  /* ---------- AI ASSISTANT ---------- */
  function bindAi(){
    document.getElementById('runAiBtn').addEventListener('click', runAi);
  }
  function runAi(){
    const pct = computeCompletion();
    const score = Math.min(100, Math.round(pct * 0.95 + Math.random()*5));
    const ats = Math.min(100, score - Math.floor(Math.random()*8));
    const kw  = Math.min(100, Math.max(40, Math.round((data.skills.frontend.length + data.skills.backend.length + data.skills.languages.length) * 8 + 30)));
    const gr  = 90 + Math.floor(Math.random()*10);
    document.getElementById('aiScore').textContent = score;
    document.getElementById('aiAts').textContent = ats + '%';
    document.getElementById('aiKeywords').textContent = kw + '%';
    document.getElementById('aiGrammar').textContent = gr + '%';
    meta.score = score; save();
    const tips = [];
    if(!data.summary || data.summary.length<80) tips.push('📝 Expand your career summary — aim for 3–4 strong sentences.');
    if(data.projects.length<2) tips.push('💼 Add at least 2 projects to showcase practical experience.');
    if(data.skills.frontend.length+data.skills.backend.length<5) tips.push('🛠️ Add more technical skills relevant to your target role.');
    if(!data.linkedin) tips.push('🔗 Add a LinkedIn profile — recruiters expect it.');
    if(data.certifications.length===0) tips.push('📜 Consider adding certifications to boost credibility.');
    if(tips.length===0) tips.push('✅ Your resume looks strong! Tailor keywords to each job description for best ATS results.');
    const s = document.getElementById('aiSuggestions');
    s.innerHTML = tips.map(t => `<div class="suggestion">${t}</div>`).join('');
  }

  /* ---------- PROGRESS / DASHBOARD ---------- */
  function computeCompletion(){
    const checks = [
      !!data.fullName, !!data.email, !!data.phone, !!data.summary,
      !!data.degree, !!data.college,
      data.skills.frontend.length+data.skills.backend.length>0,
      data.projects.length>0, data.experience.length>0 || data.internships.length>0,
      data.languages.length>0, data.strengths.length>0
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }
  function updateProgress(){
    const pct = computeCompletion();
    document.getElementById('progressFill').style.width = pct+'%';
    document.getElementById('progressLabel').textContent = pct+'%';
    document.getElementById('statCompletion').textContent = pct+'%';
    updateDashboard();
  }
  function updateDashboard(){
    document.getElementById('dashTotal').textContent = meta.totalResumes || 1;
    document.getElementById('statResumes').textContent = meta.totalResumes || 1;
    document.getElementById('dashCompletion').textContent = computeCompletion()+'%';
    document.getElementById('dashScore').textContent = meta.score ?? '--';
    document.getElementById('statScore').textContent = meta.score ?? '--';
    document.getElementById('dashUpdated').textContent = meta.lastUpdated || '—';
  }

  /* ---------- PREVIEW ---------- */
  function renderAll(){
    Object.keys(schemas).forEach(renderDynamic);
    document.querySelectorAll('.tpl').forEach(t => t.classList.toggle('active', t.dataset.tpl===data.template));
    renderPreview(); updateProgress();
  }
  function hydrate(){
    document.querySelectorAll('[data-field]').forEach(el => { if(data[el.dataset.field]!=null) el.value = data[el.dataset.field]; });
    
    // skills
    document.querySelectorAll('.chips[data-group]').forEach(g => {
      const k = g.dataset.group;
      g.querySelectorAll('input').forEach(i => { i.checked = data.skills[k].includes(i.value); });
    });
    
    // langs/strengths/interests — restore + add customs not in default list
    [['langChips','languages'],['strengthChips','strengths'],['interestChips','interests']].forEach(([id,key])=>{
      const c = document.getElementById(id);
      c.querySelectorAll('input').forEach(i => { i.checked = data[key].includes(i.value); });
      data[key].forEach(v => {
        if(![...c.querySelectorAll('input')].some(i=>i.value===v)){
          const lbl = document.createElement('label');
          lbl.innerHTML = `<input type="checkbox" value="${escapeHtml(v)}" checked/><span>${escapeHtml(v)}</span>`;
          lbl.querySelector('input').addEventListener('change', () => {
            data[key] = [...c.querySelectorAll('input:checked')].map(i=>i.value);
            renderPreview(); updateProgress();
          });
          c.appendChild(lbl);
        }
      });
    });
  }
  function renderPreview(){
    const el = document.getElementById('resumePreview');
    el.className = 'resume-doc tpl-' + (data.template || 'modern');
    const contact = [data.email, data.phone, data.address].filter(Boolean).join(' · ');
    const links = [
      data.linkedin && `<a href="${data.linkedin}">LinkedIn</a>`,
      data.github && `<a href="${data.github}">GitHub</a>`,
      data.portfolio && `<a href="${data.portfolio}">Portfolio</a>`,
    ].filter(Boolean).join(' · ');
    const photo = data.photo ? `<img class="photo" src="${data.photo}" alt="" />` : '';
    const allSkills = [
      ...data.skills.frontend, ...data.skills.backend,
      ...data.skills.database, ...data.skills.languages
    ];
    const skillsHtml = allSkills.length
      ? `<h2>Technical Skills</h2><div>${allSkills.map(s=>`<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>` : '';
    const renderItems = (arr, fn) => arr.length ? arr.map(fn).join('') : '';
    const projHtml = renderItems(data.projects, p => `
      <div class="item">
        <h3>${escapeHtml(p.title||'Untitled Project')}</h3>
        <div class="meta">${escapeHtml(p.tech||'')} ${p.duration?'· '+escapeHtml(p.duration):''}</div>
        <p>${escapeHtml(p.desc||'')}</p>
        ${p.github?`<small><a href="${p.github}">GitHub</a></small> `:''}
        ${p.demo?`<small><a href="${p.demo}">Live Demo</a></small>`:''}
      </div>`);
    const expHtml = renderItems(data.experience, e => `
      <div class="item">
        <h3>${escapeHtml(e.role||'')} — ${escapeHtml(e.company||'')}</h3>
        <div class="meta">${escapeHtml(e.start||'')} – ${escapeHtml(e.end||'Present')}</div>
        <p>${escapeHtml(e.responsibilities||'')}</p>
        ${e.tech?`<small><em>${escapeHtml(e.tech)}</em></small>`:''}
      </div>`);
    const intHtml = renderItems(data.internships, i => `
      <div class="item">
        <h3>${escapeHtml(i.role||'')} — ${escapeHtml(i.company||'')}</h3>
        <div class="meta">${escapeHtml(i.duration||'')}</div>
        <p>${escapeHtml(i.desc||'')}</p>
      </div>`);
    const certHtml = renderItems(data.certifications, c => `
      <div class="item">
        <h3>${escapeHtml(c.name||'')}</h3>
        <div class="meta">${escapeHtml(c.org||'')} · ${escapeHtml(c.date||'')}</div>
        ${c.link?`<small><a href="${c.link}">Credential</a></small>`:''}
      </div>`);
    const edu = (data.degree || data.college) ? `
      <h2>Education</h2>
      <div class="item">
        <h3>${escapeHtml(data.degree||'')}</h3>
        <div class="meta">${escapeHtml(data.college||'')} ${data.branch?'· '+escapeHtml(data.branch):''} ${data.gradYear?'· '+escapeHtml(data.gradYear):''}</div>
        ${data.cgpa?`<p>CGPA / Percentage: ${escapeHtml(data.cgpa)}</p>`:''}
        ${data.intermediate?`<p>Intermediate: ${escapeHtml(data.intermediate)}</p>`:''}
        ${data.ssc?`<p>SSC: ${escapeHtml(data.ssc)}</p>`:''}
      </div>` : '';
    const tagList = arr => arr.map(v=>`<span class="tag">${escapeHtml(v)}</span>`).join('');
    const body = `
      ${photo}
      <h1>${escapeHtml(data.fullName||'Your Name')}</h1>
      <div class="contact">${contact}${links?'<br/>'+links:''}</div>
      ${data.summary?`<h2>Summary</h2><p>${escapeHtml(data.summary)}</p>`:''}
      ${edu}
      ${skillsHtml}
      ${expHtml?`<h2>Work Experience</h2>${expHtml}`:''}
      ${intHtml?`<h2>Internships</h2>${intHtml}`:''}
      ${projHtml?`<h2>Projects</h2>${projHtml}`:''}
      ${certHtml?`<h2>Certifications</h2>${certHtml}`:''}
      ${data.achievements?`<h2>Achievements</h2><p>${escapeHtml(data.achievements).replace(/\n/g,'<br/>')}</p>`:''}
      ${data.languages.length?`<h2>Languages</h2>${tagList(data.languages)}`:''}
      ${data.strengths.length?`<h2>Strengths</h2>${tagList(data.strengths)}`:''}
      ${data.interests.length?`<h2>Interests</h2>${tagList(data.interests)}`:''}
    `;
    if(data.template==='corporate'){
      el.innerHTML = `
        <div class="head-bar">
          ${photo}
          <h1>${escapeHtml(data.fullName||'Your Name')}</h1>
          <div style="opacity:.85;font-size:12px;margin-top:6px">${contact}${links?' · '+links:''}</div>
        </div>
        <div class="body">${body.replace(/<h1>.*?<\/h1>/,'').replace(/<div class="contact">.*?<\/div>/,'')}</div>`;
    } else {
      el.innerHTML = body;
    }
  }
  
  /* ---------- UTILS ---------- */
  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style,{
      position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',
      background:'rgba(13,110,253,.95)',color:'#fff',padding:'12px 22px',
      borderRadius:'10px',zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.3)',
      fontWeight:'600',animation:'fadeUp .3s ease'
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2200);
  }
})();