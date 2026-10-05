// ── Step 1 — Connectors ───────────────────────────────────────────────────────
function aiSecStep1(c){
  const connected = S.aiSecConnectors.filter(p=>p.connected);
  c.innerHTML=`
  <div style="font-size:13px;color:var(--txt2);margin-bottom:16px;">
    <strong style="color:var(--txt)">Connect your AI service providers</strong> to allow Versa AI Gateway to route and manage requests.
  </div>
  <div class="view-tabs" style="margin-bottom:16px;padding:0;background:transparent;border-bottom:1px solid var(--border);">
    <div id="aisec-conn-tab-connectors" class="view-tab ${S.aiSecConnTab!=='configure-models'?'active':''}" onclick="aiSecSwitchConnTab('connectors')">Connectors</div>
    <div id="aisec-conn-tab-models" class="view-tab ${S.aiSecConnTab==='configure-models'?'active':''}" onclick="aiSecSwitchConnTab('configure-models')">Configure Models</div>
  </div>
  <div id="aisec-conn-content"></div>`;
  aiSecRenderConnTab(document.getElementById('aisec-conn-content'));
}

function aiSecSwitchConnTab(tab){
  S.aiSecConnTab=tab;
  ['connectors','configure-models'].forEach(t=>{
    const el=document.getElementById('aisec-conn-tab-'+t);
    if(el) el.classList.toggle('active', t===tab || (tab==='connectors' && t==='connectors'));
  });
  document.getElementById('aisec-conn-tab-connectors').classList.toggle('active', tab==='connectors');
  document.getElementById('aisec-conn-tab-models').classList.toggle('active', tab==='configure-models');
  const content=document.getElementById('aisec-conn-content');
  if(content) aiSecRenderConnTab(content);
}

function aiSecRenderConnTab(c){
  if(!c) return;
  if(S.aiSecConnTab==='configure-models'){
    aiSecRenderConfigModels(c);
  } else {
    aiSecRenderConnectors(c);
  }
}

function aiSecRenderConnectors(c){
  const isGrid = S.aiSecViewMode!=='list';
  const connected = S.aiSecConnectors.filter(p=>p.connected);
  const unconnected = S.aiSecConnectors.filter(p=>!p.connected);
  const ordered = [...connected, ...unconnected];
  c.innerHTML=`
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;">
    <div style="font-size:13px;font-weight:600;color:var(--txt);">Connect Providers</div>
    <div style="display:flex;align-items:center;gap:8px;">
      <input class="search-input" type="text" placeholder="Search providers..." style="width:200px;" oninput="aiSecFilterProviders(this.value)" id="aisec-prov-search">
      <button class="btn-secondary btn-sm" onclick="aiSecOpenAddProviderModal()">+ Add Provider</button>
      <div style="display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;">
        <button onclick="aiSecSetView('grid')" style="padding:5px 9px;border:none;background:${isGrid?'var(--primary)':'transparent'};color:${isGrid?'#fff':'var(--txt2)'};cursor:pointer;display:flex;align-items:center;" title="Grid view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
        <button onclick="aiSecSetView('list')" style="padding:5px 9px;border:none;border-left:1px solid var(--border);background:${!isGrid?'var(--primary)':'transparent'};color:${!isGrid?'#fff':'var(--txt2)'};cursor:pointer;display:flex;align-items:center;" title="List view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
  <div id="aisec-catalog-container">${aiSecBuildCatalog(ordered, isGrid)}</div>`;
}

function aiSecBuildCatalog(providers, isGrid){
  if(isGrid){
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">${providers.map(p=>aiSecProvCard(p)).join('')}</div>`;
  } else {
    return `<div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden;">${providers.map((p,i)=>aiSecProvRow(p,i,providers.length)).join('')}</div>`;
  }
}

function aiSecProvCard(p){
  const isConn = p.connected;
  const logoHtml = aiSecProvLogo(p.name, 28);
  return `<div style="background:var(--surface);border:1.5px solid ${isConn?'var(--ok)':'var(--border)'};border-radius:10px;padding:18px 16px 16px;display:flex;flex-direction:column;gap:10px;position:relative;">
    ${isConn?`<span style="position:absolute;top:10px;right:10px;background:#E3FCEF;color:#00875A;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;border:1px solid #ABF5D1;">Connected</span>`:''}
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${logoHtml}</div>
      <div style="font-size:13px;font-weight:600;color:var(--txt);">${p.name}</div>
    </div>
    <div style="font-size:12px;color:var(--txt2);line-height:1.5;flex:1;">${p.desc}</div>
    <button class="btn-secondary btn-sm" style="width:100%;justify-content:center;${isConn?'':'border-color:var(--border);'}" onclick="aiSecOpenConnectModal('${p.name}')">${isConn?'Manage Connection':'Connect'}</button>
  </div>`;
}

function aiSecProvRow(p, idx, total){
  const isConn = p.connected;
  const logoHtml = aiSecProvLogo(p.name, 22);
  const border = idx<total-1?'border-bottom:1px solid var(--border);':'';
  return `<div style="display:flex;align-items:center;padding:12px 16px;background:var(--surface);gap:14px;${border}">
    <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${logoHtml}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:600;color:var(--txt);">${p.name}</div>
      <div style="font-size:12px;color:var(--txt2);">${p.desc}</div>
    </div>
    ${isConn?`<span style="background:#E3FCEF;color:#00875A;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;border:1px solid #ABF5D1;white-space:nowrap;">Connected</span>`:''}
    <button class="btn-secondary btn-sm" style="white-space:nowrap;${isConn?'':'border-color:var(--border);'}" onclick="aiSecOpenConnectModal('${p.name}')">${isConn?'Manage Connection':'Connect'}</button>
  </div>`;
}

function aiSecProvLogo(name, size){
  // Map to provLogo() for known providers, else inline SVG
  const known={'OpenAI':'OpenAI','Anthropic':'Anthropic','Google Gemini':'Google AI','Azure OpenAI':'Azure OpenAI','Mistral AI':'Mistral'};
  if(known[name]) return provLogo(known[name], size);
  // Fallback: colored circle with initial
  const colors={'Meta Llama':'#0064E0','Cohere':'#39594D','DeepSeek':'#4D6BFE'};
  const c=colors[name]||'#6B778C';
  const init=name[0];
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${c}"/><text x="${size/2}" y="${size/2+4}" text-anchor="middle" font-size="${size*0.45}" font-family="sans-serif" font-weight="700" fill="#fff">${init}</text></svg>`;
}

function aiSecSetView(mode){
  S.aiSecViewMode=mode;
  const content=document.getElementById('aisec-conn-content');
  if(content) aiSecRenderConnectors(content);
}

function aiSecFilterProviders(query){
  const q=query.toLowerCase();
  const ordered=[...S.aiSecConnectors.filter(p=>p.connected),...S.aiSecConnectors.filter(p=>!p.connected)];
  const filtered=q?ordered.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)):ordered;
  const container=document.getElementById('aisec-catalog-container');
  if(container) container.innerHTML=aiSecBuildCatalog(filtered, S.aiSecViewMode!=='list');
}

function aiSecRenderConfigModels(c){
  const connected=S.aiSecConnectors.filter(p=>p.connected);
  if(connected.length===0){
    c.innerHTML=`<div class="card"><div class="empty-state">
      <div class="es-icon" style="display:flex;align-items:center;justify-content:center;font-size:0;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
      <div class="es-title">No providers connected</div>
      <div class="es-desc">Connect at least one AI provider in the Connectors tab before configuring models.</div>
      <button class="btn-secondary btn-sm" onclick="aiSecSwitchConnTab('connectors')">← Go to Connectors</button>
    </div></div>`;
    return;
  }
  c.innerHTML=`<div style="font-size:13px;color:var(--txt2);margin-bottom:14px;">Configure models for connected providers.</div>
  <div style="display:flex;flex-direction:column;gap:10px;">
    ${connected.map(p=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${aiSecProvLogo(p.name,24)}</div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--txt);">${p.name}</div><div style="font-size:12px;color:var(--ok);">● Connected</div></div>
      <select class="filter-select" style="width:200px;"><option>Select model...</option>${(p.models||['Default Model']).map(m=>`<option>${m}</option>`).join('')}</select>
    </div>`).join('')}
  </div>`;
}

// ── Connect Provider Modal ────────────────────────────────────────────────────
function aiSecOpenConnectModal(provName){
  const prov = S.aiSecConnectors.find(p=>p.name===provName);
  if(!prov) return;
  const existing = S.aiSecConnections[provName] || {};
  const isEdit = prov.connected;

  const fieldRows = {
    'OpenAI':        [{id:'connName',label:'Connection Name',req:true,placeholder:'My OpenAI Connection'},{id:'apiKey',label:'API Key',req:true,type:'password',placeholder:'sk-...'},{id:'baseUrl',label:'Base URL (Optional)',placeholder:'https://api.openai.com/v1',default:prov.baseUrlDefault},{id:'orgId',label:'Organization ID (Optional)',placeholder:'org-...'},{id:'rateLimit',label:'Rate Limit (Requests/Min) (Optional)',placeholder:'e.g. 10,000'},{id:'desc',label:'Description (Optional)',type:'textarea'}],
    'Anthropic':     [{id:'connName',label:'Connection Name',req:true,placeholder:'My Anthropic Connection'},{id:'apiKey',label:'API Key',req:true,type:'password',placeholder:'sk-ant-...'},{id:'baseUrl',label:'Anthropic Base URL (Optional)',placeholder:'https://api.anthropic.com',default:prov.baseUrlDefault},{id:'version',label:'Version (Optional)',placeholder:'2023-06-01',default:'2023-06-01',help:'Leave default if you are unsure.'},{id:'rateLimit',label:'Rate Limit (Requests/Min) (Optional)',placeholder:'e.g. 10,000',help:'Set the maximum requests allowed per minute.'},{id:'desc',label:'Description (Optional)',type:'textarea'}],
    'Google Gemini': [{id:'connName',label:'Connection Name',req:true,placeholder:'My Google Gemini Connection'},{id:'apiKey',label:'API Key',req:true,type:'password',placeholder:'AIza...'},{id:'baseUrl',label:'Base URL (Optional)',placeholder:'https://generativelanguage.googleapis.com',default:prov.baseUrlDefault},{id:'projectId',label:'Project ID (Optional)',placeholder:'my-gcp-project'},{id:'rateLimit',label:'Rate Limit (Requests/Min) (Optional)',placeholder:'e.g. 10,000'},{id:'desc',label:'Description (Optional)',type:'textarea'}],
    'Azure OpenAI':  [{id:'connName',label:'Connection Name',req:true,placeholder:'My Azure Connection'},{id:'apiKey',label:'API Key',req:true,type:'password',placeholder:'Enter API Key'},{id:'endpoint',label:'Azure Endpoint *',req:true,placeholder:'https://{resource}.openai.azure.com'},{id:'deployment',label:'Deployment Name (Optional)',placeholder:'gpt-4o'},{id:'apiVersion',label:'API Version (Optional)',placeholder:'2024-02-15-preview'},{id:'rateLimit',label:'Rate Limit (Requests/Min) (Optional)',placeholder:'e.g. 10,000'},{id:'desc',label:'Description (Optional)',type:'textarea'}],
  };
  const defaultFields = [{id:'connName',label:'Connection Name',req:true,placeholder:`My ${provName} Connection`},{id:'apiKey',label:'API Key',req:true,type:'password',placeholder:'Enter API Key'},{id:'baseUrl',label:'Base URL (Optional)',placeholder:prov.baseUrlDefault||'https://api.example.com/v1',default:prov.baseUrlDefault||''},{id:'rateLimit',label:'Rate Limit (Requests/Min) (Optional)',placeholder:'e.g. 10,000'},{id:'desc',label:'Description (Optional)',type:'textarea'}];
  const fields = fieldRows[provName] || defaultFields;

  const formHtml = fields.map(f=>{
    const val = existing[f.id] || f.default || '';
    const charCount = f.type==='textarea' ? `<div style="text-align:right;font-size:11px;color:var(--txt3);margin-top:2px;">0/200</div>` : '';
    if(f.type==='password') return `<div class="form-group"><label class="form-label">${f.label}${f.req?' <span class="req">*</span>':''}</label><div style="position:relative;"><input type="password" id="aisec-cf-${f.id}" value="${val?'••••••••••••••••••••':''}" placeholder="${f.placeholder}" oninput="aiSecCheckConnectBtn()" style="padding-right:36px;"><button type="button" onclick="aiSecToggleKey('aisec-cf-${f.id}')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--txt2);display:flex;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div>${f.help?`<div class="form-help">${f.help}</div>`:''}</div>`;
    if(f.type==='textarea') return `<div class="form-group"><label class="form-label">${f.label}</label><textarea id="aisec-cf-${f.id}" rows="4" style="width:100%;resize:vertical;" maxlength="200" oninput="this.nextElementSibling.querySelector('span').textContent=this.value.length">${val}</textarea>${charCount}</div>`;
    return `<div class="form-group"><label class="form-label">${f.label}${f.req?' <span class="req">*</span>':''}</label><input type="text" id="aisec-cf-${f.id}" value="${val}" placeholder="${f.placeholder}" oninput="aiSecCheckConnectBtn()">${f.help?`<div class="form-help">${f.help}</div>`:''}</div>`;
  }).join('');

  const logoHtml = aiSecProvLogo(provName, 48);

  const overlay=document.createElement('div');
  overlay.id='aisec-connect-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML=`<div style="background:#fff;border-radius:10px;width:100%;max-width:760px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-size:16px;font-weight:700;color:var(--txt);">Connect to ${provName}</div>
      <button onclick="document.getElementById('aisec-connect-overlay').remove()" style="background:none;border:none;cursor:pointer;color:var(--txt2);display:flex;padding:4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="display:flex;flex:1;overflow:hidden;">
      <!-- Left panel -->
      <div id="aisec-cm-left" style="width:220px;flex-shrink:0;border-right:1px solid var(--border);padding:24px 20px;background:#FAFBFC;overflow-y:auto;">
        <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">${logoHtml}</div>
        <div style="font-size:15px;font-weight:700;color:var(--txt);margin-bottom:4px;">${provName}</div>
        <div style="font-size:12px;color:var(--txt2);line-height:1.5;margin-bottom:16px;">${prov.desc}</div>
        <a href="#" onclick="return false;" style="font-size:12px;color:var(--primary);display:flex;align-items:center;gap:4px;margin-bottom:16px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> View Documentation</a>
        <button class="btn-secondary btn-sm" style="width:100%;justify-content:center;" onclick="aiSecTestConn('${provName}')">Test Connection</button>
        <div id="aisec-test-result" style="margin-top:14px;"></div>
      </div>
      <!-- Right panel (form) -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px;">
        ${formHtml}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--border);flex-shrink:0;">
      <button class="btn-secondary" onclick="document.getElementById('aisec-connect-overlay').remove()">Cancel</button>
      ${isEdit?`<button class="btn-secondary" style="color:var(--err)" onclick="aiSecDisconnect('${provName}')">Disconnect</button>`:''}
      <button class="btn-primary" id="aisec-connect-btn" onclick="aiSecSaveConnection('${provName}')" ${isEdit?'':(!existing.connName||!existing.apiKey)?'disabled':''}>Connect</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  aiSecCheckConnectBtn();
}

function aiSecToggleKey(inputId){
  const inp=document.getElementById(inputId);
  if(!inp)return;
  inp.type=inp.type==='password'?'text':'password';
}

function aiSecCheckConnectBtn(){
  const btn=document.getElementById('aisec-connect-btn');
  if(!btn)return;
  const nameEl=document.getElementById('aisec-cf-connName');
  const keyEl=document.getElementById('aisec-cf-apiKey');
  const hasName=nameEl&&nameEl.value.trim().length>0;
  const hasKey=keyEl&&keyEl.value.trim().length>0;
  btn.disabled=!(hasName&&hasKey);
}

function aiSecTestConn(provName){
  const resultDiv=document.getElementById('aisec-test-result');
  if(!resultDiv)return;
  resultDiv.innerHTML=`<div style="font-size:12px;color:var(--txt2);display:flex;align-items:center;gap:6px;padding:8px;background:#F4F5F7;border-radius:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-8.31"/></svg> Testing...</div>`;
  setTimeout(()=>{
    const prov=S.aiSecConnectors.find(p=>p.name===provName)||{baseUrlDefault:'https://api.example.com'};
    const versionMap={'Anthropic':'2023-06-01','OpenAI':'v1','Google Gemini':'v1beta','Azure OpenAI':'2024-02'};
    const respTime=Math.floor(180+Math.random()*300);
    const now=new Date();
    const timeStr=now.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
    resultDiv.innerHTML=`<div style="background:#F4F5F7;border-radius:8px;padding:12px;font-size:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-weight:600;color:var(--txt);">Test Connection Result</span>
        <span style="background:#00875A;color:#fff;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;">Success</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:24px;height:24px;border-radius:50%;background:#E3FCEF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00875A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div><div style="font-weight:600;color:var(--txt);">Connection successful!</div><div style="color:var(--txt2);font-size:11px;">${provName} API is reachable and the API key is valid.</div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;padding:8px;background:#fff;border-radius:6px;border:1px solid var(--border);">
        ${[['Base URL','Reachable'],['Authentication','Successful'],['API Key','Valid'],['Version',versionMap[provName]||'v1']].map(([k,v])=>`<div style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:4px;color:var(--txt);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00875A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>${k}</span><span style="color:var(--ok);font-weight:500;">${v}</span></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:var(--txt);font-weight:600;">Response Time</span><span style="color:var(--txt);font-weight:700;">${respTime} ms</span></div>
      <div style="font-size:11px;color:var(--txt3);margin-bottom:10px;">Tested on: ${timeStr}</div>
      <button class="btn-secondary btn-sm" style="width:100%;justify-content:center;" onclick="aiSecTestConn('${provName}')">↻ Test Connection Again</button>
    </div>`;
  }, 1400);
}

function aiSecSaveConnection(provName){
  const nameEl=document.getElementById('aisec-cf-connName');
  const keyEl=document.getElementById('aisec-cf-apiKey');
  if(!nameEl||!keyEl||!nameEl.value.trim()||!keyEl.value.trim())return;
  // Save connection data
  S.aiSecConnections[provName]={
    connName:nameEl.value.trim(),
    apiKey:'••••••••••••••••',
    baseUrl:(document.getElementById('aisec-cf-baseUrl')||{}).value||'',
    version:(document.getElementById('aisec-cf-version')||{}).value||'',
    rateLimit:(document.getElementById('aisec-cf-rateLimit')||{}).value||'',
    desc:(document.getElementById('aisec-cf-desc')||{}).value||''
  };
  // Mark provider as connected
  const prov=S.aiSecConnectors.find(p=>p.name===provName);
  if(prov) prov.connected=true;
  // Close modal and refresh
  const overlay=document.getElementById('aisec-connect-overlay');
  if(overlay) overlay.remove();
  const content=document.getElementById('aisec-conn-content');
  if(content) aiSecRenderConnectors(content);
}

function aiSecDisconnect(provName){
  const prov=S.aiSecConnectors.find(p=>p.name===provName);
  if(prov){prov.connected=false; delete S.aiSecConnections[provName];}
  const overlay=document.getElementById('aisec-connect-overlay');
  if(overlay) overlay.remove();
  const content=document.getElementById('aisec-conn-content');
  if(content) aiSecRenderConnectors(content);
}

// ── Add Custom Provider Modal ─────────────────────────────────────────────────
function aiSecOpenAddProviderModal(){
  const overlay=document.createElement('div');
  overlay.id='aisec-addprov-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML=`<div style="background:#fff;border-radius:10px;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-size:16px;font-weight:700;color:var(--txt);">Add AI Provider</div>
      <button onclick="document.getElementById('aisec-addprov-overlay').remove()" style="background:none;border:none;cursor:pointer;color:var(--txt2);display:flex;padding:4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:20px 24px;">
      <div class="form-group">
        <label class="form-label">Provider Type</label>
        <select class="filter-select" style="width:100%;" id="ap-type">
          <option>OpenAI Compatible</option><option>Anthropic Compatible</option><option>Custom REST API</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Provider Name <span class="req">*</span></label>
        <input type="text" id="ap-name" placeholder="e.g. My Custom AI Provider" oninput="aiSecCheckAddBtn()">
      </div>
      <div class="form-group">
        <label class="form-label">Description (Optional)</label>
        <input type="text" id="ap-desc" placeholder="Brief description of this provider">
      </div>
      <div class="form-group">
        <label class="form-label">Base URL <span class="req">*</span></label>
        <input type="text" id="ap-url" placeholder="https://api.example.com/v1" oninput="aiSecCheckAddBtn()">
      </div>
      <div class="form-group">
        <label class="form-label">API Key <span class="req">*</span></label>
        <div style="position:relative;">
          <input type="password" id="ap-key" placeholder="Enter API Key" oninput="aiSecCheckAddBtn()" style="padding-right:36px;">
          <button type="button" onclick="aiSecToggleKey('ap-key')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--txt2);display:flex;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Organization ID (Optional)</label>
        <input type="text" id="ap-org" placeholder="Enter organization ID">
      </div>
      <div class="form-group">
        <label class="form-label">Rate Limit (Req/Min) (Optional)</label>
        <input type="text" id="ap-rate" placeholder="e.g. 10.00">
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--border);flex-shrink:0;">
      <button class="btn-secondary" onclick="document.getElementById('aisec-addprov-overlay').remove()">Cancel</button>
      <button class="btn-primary" id="aisec-add-btn" disabled onclick="aiSecSaveCustomProvider()">Save</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function aiSecCheckAddBtn(){
  const btn=document.getElementById('aisec-add-btn');
  if(!btn)return;
  const n=document.getElementById('ap-name');
  const u=document.getElementById('ap-url');
  const k=document.getElementById('ap-key');
  btn.disabled=!(n&&n.value.trim()&&u&&u.value.trim()&&k&&k.value.trim());
}

function aiSecSaveCustomProvider(){
  const name=(document.getElementById('ap-name')||{}).value||'';
  const desc=(document.getElementById('ap-desc')||{}).value||'';
  const url=(document.getElementById('ap-url')||{}).value||'';
  if(!name.trim()||!url.trim())return;
  S.aiSecConnectors.push({id:'custom-'+Date.now(),name,desc:desc||'Custom AI provider.',connected:false,baseUrlDefault:url});
  const overlay=document.getElementById('aisec-addprov-overlay');
  if(overlay) overlay.remove();
  const content=document.getElementById('aisec-conn-content');
  if(content) aiSecRenderConnectors(content);
}

