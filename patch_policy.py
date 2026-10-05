import re

with open('/sessions/admiring-youthful-lamport/mnt/outputs/versa-ai-gateway.html', 'r') as f:
    html = f.read()

# ── 1. Add state variables ────────────────────────────────────────────────────
old_state = '  aiSecPolicies:[],'
new_state = '  aiSecPolicies:[],\n  aiSecPolicyTab:\'security\',\n  aiSecPolSearch:\'\','
assert old_state in html, "State marker not found"
html = html.replace(old_state, new_state, 1)

# ── 2. Reset state in openAISecModal ─────────────────────────────────────────
old_reset = '  S.aiSecDirty=false;'
new_reset = "  S.aiSecPolicyTab='security';\n  S.aiSecPolSearch='';\n  S.aiSecDirty=false;"
assert old_reset in html, "Reset marker not found"
html = html.replace(old_reset, new_reset, 1)

# ── 3. Replace the entire Step 2 block ───────────────────────────────────────
old_start = '// ── Step 2 — Policy Rules ─'
old_end   = "function editAISecPolicy(i){showToast('Policy editor opening…');}"
s = html.find(old_start)
e = html.find(old_end) + len(old_end)
assert s != -1 and e > s, f"Block not found s={s} e={e}"

new_block = r"""// ── Step 2 — Policy Rules ─────────────────────────────────────────────────────

const AISEC_POL_TABS=[
  {key:'security',label:'Security Policies'},
  {key:'dlp',     label:'DLP Policies'},
  {key:'access',  label:'Access Rules'},
  {key:'content', label:'Content Rules'},
];

function aiSecPolsForTab(tab){return S.aiSecPolicies.filter(p=>p.polTab===tab);}

function aiSecStep2(c){
  const cur=S.aiSecPolicyTab||'security';
  const tabBar=AISEC_POL_TABS.map(t=>{
    const cnt=aiSecPolsForTab(t.key).length;
    const act=cur===t.key;
    return '<button onclick="aiSecPolTabSwitch(\''+t.key+'\')" style="padding:9px 16px 8px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:'+(act?'600':'400')+';color:'+(act?'var(--txt)':'var(--txt2)')+';border-bottom:2px solid '+(act?'var(--txt)':'transparent')+';margin-bottom:-1px;display:flex;align-items:center;gap:6px;white-space:nowrap;">'+t.label+(cnt?'<span style="background:'+(act?'var(--primary)':'#DFE1E6')+';color:'+(act?'#fff':'#42526E')+';border-radius:20px;padding:1px 7px;font-size:11px;font-weight:600;">'+cnt+'</span>':'')+'</button>';
  }).join('');
  c.innerHTML=`
  <div style="margin-bottom:14px;">
    <div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:2px;">Policy Rules</div>
    <div style="font-size:12px;color:var(--txt2);">Define security, data-loss-prevention, access, and content policies for requests routed through this gateway.</div>
  </div>
  <div style="border-bottom:1px solid var(--border);margin-bottom:16px;">
    <div style="display:flex;">${tabBar}</div>
  </div>
  <div id="aisec-pol-content">${aiSecPolTabHtml(cur)}</div>`;
}

function aiSecPolTabSwitch(tab){
  S.aiSecPolicyTab=tab;S.aiSecPolSearch='';
  const c=document.getElementById('aisec-pol-content');
  if(c)c.innerHTML=aiSecPolTabHtml(tab);
  AISEC_POL_TABS.forEach(t=>{
    const btn=document.querySelector('button[onclick="aiSecPolTabSwitch(\''+t.key+'\')"]');
    if(!btn)return;
    const act=t.key===tab;const cnt=aiSecPolsForTab(t.key).length;
    btn.style.fontWeight=act?'600':'400';btn.style.color=act?'var(--txt)':'var(--txt2)';
    btn.style.borderBottom='2px solid '+(act?'var(--txt)':'transparent');
    const badge=btn.querySelector('span');
    if(cnt&&badge){badge.style.background=act?'var(--primary)':'#DFE1E6';badge.style.color=act?'#fff':'#42526E';}
  });
}

function aiSecPolTabHtml(tab){
  const tabMeta=AISEC_POL_TABS.find(t=>t.key===tab)||AISEC_POL_TABS[0];
  const all=aiSecPolsForTab(tab);
  const q=(S.aiSecPolSearch||'').toLowerCase();
  const shown=q?all.filter(p=>p.name.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q)):all;
  const toolbar=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;">
    <div style="font-size:12px;font-weight:600;color:var(--txt);">${tabMeta.label}</div>
    <div style="display:flex;align-items:center;gap:6px;">
      <input class="search-input" type="text" placeholder="Search..." value="${S.aiSecPolSearch||''}" oninput="S.aiSecPolSearch=this.value;aiSecPolRefreshTable('${tab}')" style="width:200px;">
      <button title="Add Policy Rule" onclick="openAISECPolModal(null,'${tab}')" style="width:30px;height:30px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button id="aisec-pol-tb-edit" title="Edit" disabled style="width:30px;height:30px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.4;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button id="aisec-pol-tb-copy" title="Duplicate" disabled style="width:30px;height:30px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.4;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button id="aisec-pol-tb-del" title="Delete" disabled style="width:30px;height:30px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--err);opacity:.4;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>`;
  if(all.length===0) return toolbar+`<div class="empty-state" style="padding:40px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);">
    <div class="es-icon" style="display:flex;align-items:center;justify-content:center;font-size:0;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div class="es-title">No policy rules configured</div>
    <div class="es-desc">Create a policy rule to control AI model access, sensitive data, content, and request behavior.</div>
    <button class="btn-primary btn-sm" onclick="openAISECPolModal(null,'${tab}')">+ Add Policy Rule</button>
  </div>`;
  return toolbar+`<div class="card" style="overflow:hidden;">
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th style="width:32px;padding:8px 8px 8px 14px;"><input type="checkbox" id="aisec-pol-chk-all" onchange="aiSecPolToggleAll(this.checked)" style="cursor:pointer;"></th>
          <th>Policy Name</th><th>Description</th><th>Status</th><th>Priority</th><th>Last Updated</th>
          <th style="text-align:right;padding-right:14px;">Actions</th>
        </tr></thead>
        <tbody id="aisec-pol-tbody">${aiSecPolRows(shown)}</tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);background:#FAFBFC;">
      <span style="font-size:12px;color:var(--txt2);">Showing 1–${shown.length} of ${all.length} entries</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <select class="filter-select" style="width:90px;"><option>10 rows</option><option>25 rows</option></select>
        <button class="btn-secondary btn-sm" disabled>‹ Prev</button>
        <span style="font-size:12px;font-weight:600;background:var(--primary);color:#fff;border-radius:4px;padding:2px 8px;">1</span>
        <button class="btn-secondary btn-sm" disabled>Next ›</button>
      </div>
    </div>
  </div>`;
}

function aiSecPolRows(pols){
  if(!pols||!pols.length) return `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--txt2);">No policies match your search.</td></tr>`;
  const priBg={'High':'#FFEBE6','Medium':'#FFF0B3','Low':'#F4F5F7'};
  const priTx={'High':'#BF2600','Medium':'#974F0C','Low':'#6B778C'};
  return pols.map(p=>{
    const gi=S.aiSecPolicies.indexOf(p);
    const act=p.status==='Active';
    const pb=priBg[p.priority]||priBg.Low;const pt=priTx[p.priority]||priTx.Low;
    const shortDesc=p.desc?(p.desc.length>44?p.desc.slice(0,44)+'…':p.desc):'—';
    return `<tr>
      <td style="padding:9px 8px 9px 14px;"><input type="checkbox" data-gi="${gi}" onchange="aiSecPolSelChange()" style="cursor:pointer;"></td>
      <td style="font-weight:500;color:var(--txt);">${p.name}</td>
      <td style="color:var(--txt2);" title="${p.desc||''}">${shortDesc}</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:${act?'var(--ok)':'var(--txt3)'};">
        <span style="width:7px;height:7px;border-radius:50%;background:${act?'var(--ok)':'#C1C7D0'};flex-shrink:0;"></span>${act?'Active':'Inactive'}
      </span></td>
      <td><span style="background:${pb};color:${pt};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;">${p.priority}</span></td>
      <td style="color:var(--txt2);font-size:12px;">${p.updatedAt||'—'}</td>
      <td style="text-align:right;padding-right:14px;white-space:nowrap;">
        <button title="Edit" onclick="openAISECPolModal(${gi})" class="icon-btn" style="background:none;border:none;cursor:pointer;color:var(--txt2);padding:4px;display:inline-flex;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button title="${act?'Disable':'Enable'}" onclick="aiSecPolToggleStatus(${gi})" class="icon-btn" style="background:none;border:none;cursor:pointer;color:var(--txt2);padding:4px;display:inline-flex;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        </button>
        <button title="Delete" onclick="aiSecPolConfirmDel(${gi})" class="icon-btn" style="background:none;border:none;cursor:pointer;color:var(--err);padding:4px;display:inline-flex;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function aiSecPolRefreshTable(tab){
  const all=aiSecPolsForTab(tab);
  const q=(S.aiSecPolSearch||'').toLowerCase();
  const shown=q?all.filter(p=>p.name.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q)):all;
  const tb=document.getElementById('aisec-pol-tbody');
  if(tb)tb.innerHTML=aiSecPolRows(shown);
}

function aiSecPolToggleAll(chk){
  document.querySelectorAll('[data-gi]').forEach(cb=>cb.checked=chk);
  aiSecPolSelChange();
}

function aiSecPolSelChange(){
  const sel=[...document.querySelectorAll('[data-gi]:checked')];
  const any=sel.length>0;const one=sel.length===1;
  const eb=document.getElementById('aisec-pol-tb-edit');
  const cb=document.getElementById('aisec-pol-tb-copy');
  const db=document.getElementById('aisec-pol-tb-del');
  if(eb){eb.disabled=!one;eb.style.opacity=one?'1':'0.4';eb.onclick=one?()=>openAISECPolModal(parseInt(sel[0].dataset.gi)):null;}
  if(cb){cb.disabled=!any;cb.style.opacity=any?'1':'0.4';cb.onclick=any?()=>{sel.forEach(s=>{const p={...S.aiSecPolicies[parseInt(s.dataset.gi)]};p.name='Copy of '+p.name;p.updatedAt=new Date().toISOString().slice(0,10);S.aiSecPolicies.push(p);});renderAISecStepContent();}:null;}
  if(db){db.disabled=!any;db.style.opacity=any?'1':'0.4';db.onclick=any?()=>aiSecPolConfirmDelMulti(sel.map(s=>parseInt(s.dataset.gi)).sort((a,b)=>b-a)):null;}
}

function aiSecPolToggleStatus(gi){
  if(!S.aiSecPolicies[gi])return;
  S.aiSecPolicies[gi].status=S.aiSecPolicies[gi].status==='Active'?'Inactive':'Active';
  S.aiSecPolicies[gi].updatedAt=new Date().toISOString().slice(0,10);
  aiSecPolRefreshTable(S.aiSecPolicies[gi].polTab||S.aiSecPolicyTab||'security');
}

function aiSecPolConfirmDel(gi){
  const p=S.aiSecPolicies[gi];if(!p)return;
  const ov=document.createElement('div');
  ov.id='aisec-del-ov';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:960;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML=`<div style="background:#fff;border-radius:10px;width:100%;max-width:400px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);">
    <div style="font-size:15px;font-weight:700;color:var(--txt);margin-bottom:8px;">Delete Policy Rule?</div>
    <div style="font-size:13px;color:var(--txt2);margin-bottom:20px;line-height:1.5;">Are you sure you want to delete <strong>${p.name}</strong>? This action cannot be undone.</div>
    <div style="display:flex;justify-content:flex-end;gap:10px;">
      <button class="btn-secondary" onclick="document.getElementById('aisec-del-ov').remove()">Cancel</button>
      <button class="btn-primary" style="background:var(--err);border-color:var(--err);" onclick="S.aiSecPolicies.splice(${gi},1);document.getElementById('aisec-del-ov').remove();renderAISecStepContent();">Delete</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function aiSecPolConfirmDelMulti(idxs){
  const ov=document.createElement('div');
  ov.id='aisec-del-ov';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:960;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML=`<div style="background:#fff;border-radius:10px;width:100%;max-width:400px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);">
    <div style="font-size:15px;font-weight:700;color:var(--txt);margin-bottom:8px;">Delete ${idxs.length} Policy Rule${idxs.length>1?'s':''}?</div>
    <div style="font-size:13px;color:var(--txt2);margin-bottom:20px;line-height:1.5;">Are you sure you want to delete the selected rule${idxs.length>1?'s':''}? This action cannot be undone.</div>
    <div style="display:flex;justify-content:flex-end;gap:10px;">
      <button class="btn-secondary" onclick="document.getElementById('aisec-del-ov').remove()">Cancel</button>
      <button class="btn-primary" style="background:var(--err);border-color:var(--err);" id="aisec-del-multi-btn">Delete</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  document.getElementById('aisec-del-multi-btn').onclick=()=>{idxs.forEach(i=>S.aiSecPolicies.splice(i,1));document.getElementById('aisec-del-ov').remove();renderAISecStepContent();};
}

function openAISECPolModal(gi,forceTab){
  const isEdit=gi!==null&&gi!==undefined&&gi>=0;
  const ex=isEdit?S.aiSecPolicies[gi]:{};
  const tab=forceTab||(isEdit?ex.polTab:null)||S.aiSecPolicyTab||'security';
  const tabTypeDefault={'security':'Security','dlp':'DLP','access':'Access Control','content':'Content Security'};
  const defType=ex.type||tabTypeDefault[tab]||'Security';
  const conds=ex.conditions||[{logic:'IF',field:'Data Type',op:'=',value:''}];
  const condHtml=conds.map((cond,ci)=>`<div class="aisec-cond-row" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
    <span style="width:44px;text-align:right;flex-shrink:0;">${ci===0?'<span style="font-size:11px;font-weight:600;color:var(--txt2);">IF</span>':'<select style="width:44px;font-size:11px;height:28px;border:1px solid var(--border);border-radius:5px;padding:0 4px;background:var(--surface);" class="aisec-cond-logic"><option '+(cond.logic==='AND'?'selected':'')+'>AND</option><option '+(cond.logic==='OR'?'selected':'')+'>OR</option></select>'}</span>
    <select style="flex:1;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 8px;background:var(--surface);" class="aisec-cond-field">${['Data Type','Model','User','Application','IP Address','Request Size','Token Count','Prompt Pattern'].map(f=>'<option '+(cond.field===f?'selected':'')+'>'+f+'</option>').join('')}</select>
    <select style="width:90px;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 6px;background:var(--surface);" class="aisec-cond-op">${['=','≠','contains','starts with','≥','≤'].map(o=>'<option '+(cond.op===o?'selected':'')+'>'+o+'</option>').join('')}</select>
    <input type="text" value="${cond.value||''}" placeholder="Value" class="aisec-cond-val" style="flex:1;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 8px;">
    ${ci>0?'<button type="button" onclick="this.closest(\'.aisec-cond-row\').remove()" style="background:none;border:none;cursor:pointer;color:var(--err);padding:2px;display:flex;flex-shrink:0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>':'<span style="width:17px;"></span>'}
  </div>`).join('');

  const ov=document.createElement('div');
  ov.id='aisec-pol-ov';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML=`<div style="background:#fff;border-radius:10px;width:100%;max-width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-size:15px;font-weight:700;color:var(--txt);">${isEdit?'Edit Policy Rule':'Add Policy Rule'}</div>
      <button onclick="document.getElementById('aisec-pol-ov').remove()" style="background:none;border:none;cursor:pointer;color:var(--txt2);display:flex;padding:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:20px 24px;">
      <div class="form-group">
        <label class="form-label">Policy Name <span class="req">*</span></label>
        <input type="text" id="aisp-name" placeholder="e.g. Rate Limit — GPT-4o" value="${ex.name||''}" oninput="aiSecPolCheckSave()">
      </div>
      <div class="form-group">
        <label class="form-label">Description (Optional)</label>
        <textarea id="aisp-desc" rows="2" style="width:100%;resize:vertical;" placeholder="Describe what this policy enforces...">${ex.desc||''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Policy Type <span class="req">*</span></label>
          <select id="aisp-type" class="filter-select" style="width:100%;">${['Security','DLP','Model Access','Content Security','Rate Limit','Access Control'].map(v=>'<option '+(defType===v?'selected':'')+'>'+v+'</option>').join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Scope <span class="req">*</span></label>
          <select id="aisp-scope" class="filter-select" style="width:100%;">${['All Users','Selected Users','User Groups','Applications','API Clients'].map(v=>'<option '+((ex.scope||'All Users')===v?'selected':'')+'>'+v+'</option>').join('')}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="margin-bottom:8px;">Conditions</label>
        <div id="aisec-cond-builder" style="background:#F8F9FA;border:1px solid var(--border);border-radius:8px;padding:14px 12px 10px;">
          ${condHtml}
          <button type="button" onclick="aiSecPolAddCond()" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;margin-top:2px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Condition</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Action <span class="req">*</span></label>
          <select id="aisp-action" class="filter-select" style="width:100%;">${['Allow','Block','Redact','Log','Require Approval'].map(v=>'<option '+((ex.action||'Block')===v?'selected':'')+'>'+v+'</option>').join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select id="aisp-priority" class="filter-select" style="width:100%;">${['High','Medium','Low'].map(v=>'<option '+((ex.priority||'Medium')===v?'selected':'')+'>'+v+'</option>').join('')}</select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">Status</label>
        <div style="display:flex;gap:16px;margin-top:6px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;"><input type="radio" name="aisp-status" value="Active" ${(ex.status||'Active')==='Active'?'checked':''}>Active</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;"><input type="radio" name="aisp-status" value="Inactive" ${(ex.status||'Active')==='Inactive'?'checked':''}>Inactive</label>
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--border);flex-shrink:0;">
      <button class="btn-secondary" onclick="document.getElementById('aisec-pol-ov').remove()">Cancel</button>
      <button class="btn-primary" id="aisp-save-btn" onclick="aiSecPolSave(${isEdit?gi:'null'},'${tab}')" ${!isEdit&&!ex.name?'disabled':''}>${isEdit?'Save Changes':'Add Policy Rule'}</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function aiSecPolAddCond(){
  const b=document.getElementById('aisec-cond-builder');if(!b)return;
  const addBtn=b.querySelector('button[onclick="aiSecPolAddCond()"]');
  const row=document.createElement('div');row.className='aisec-cond-row';row.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:8px;';
  row.innerHTML='<span style="width:44px;text-align:right;flex-shrink:0;"><select style="width:44px;font-size:11px;height:28px;border:1px solid var(--border);border-radius:5px;padding:0 4px;background:var(--surface);" class="aisec-cond-logic"><option>AND</option><option>OR</option></select></span>'
    +'<select style="flex:1;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 8px;background:var(--surface);" class="aisec-cond-field">'+['Data Type','Model','User','Application','IP Address','Request Size','Token Count','Prompt Pattern'].map(f=>'<option>'+f+'</option>').join('')+'</select>'
    +'<select style="width:90px;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 6px;background:var(--surface);" class="aisec-cond-op">'+['=','≠','contains','starts with','≥','≤'].map(o=>'<option>'+o+'</option>').join('')+'</select>'
    +'<input type="text" placeholder="Value" class="aisec-cond-val" style="flex:1;font-size:12px;height:30px;border:1px solid var(--border);border-radius:5px;padding:0 8px;">'
    +'<button type="button" onclick="this.closest(\'.aisec-cond-row\').remove()" style="background:none;border:none;cursor:pointer;color:var(--err);padding:2px;display:flex;flex-shrink:0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  b.insertBefore(row,addBtn);
}

function aiSecPolCheckSave(){
  const btn=document.getElementById('aisp-save-btn');if(!btn)return;
  const nm=document.getElementById('aisp-name');btn.disabled=!(nm&&nm.value.trim());
}

function aiSecPolSave(gi,tab){
  const nm=document.getElementById('aisp-name');
  if(!nm||!nm.value.trim()){if(nm)nm.style.borderColor='var(--err)';return;}
  const conditions=[...document.querySelectorAll('.aisec-cond-row')].map((row,ci)=>({
    logic:ci===0?'IF':(row.querySelector('.aisec-cond-logic')||{}).value||'AND',
    field:(row.querySelector('.aisec-cond-field')||{}).value||'',
    op:(row.querySelector('.aisec-cond-op')||{}).value||'=',
    value:(row.querySelector('.aisec-cond-val')||{}).value||'',
  }));
  const statusEl=document.querySelector('input[name="aisp-status"]:checked');
  const typeTabMap={'Security':'security','DLP':'dlp','Model Access':'access','Access Control':'access','Content Security':'content','Rate Limit':'content'};
  const polType=(document.getElementById('aisp-type')||{}).value||'Security';
  const polTab=typeTabMap[polType]||tab||'security';
  const entry={
    name:nm.value.trim(),
    desc:(document.getElementById('aisp-desc')||{}).value||'',
    type:polType,
    scope:(document.getElementById('aisp-scope')||{}).value||'All Users',
    action:(document.getElementById('aisp-action')||{}).value||'Block',
    priority:(document.getElementById('aisp-priority')||{}).value||'Medium',
    status:statusEl?statusEl.value:'Active',
    conditions,polTab,
    updatedAt:new Date().toISOString().slice(0,10),
  };
  const isEdit=gi!==null&&gi!==undefined&&gi!=='null'&&parseInt(gi)>=0;
  if(isEdit){entry.polTab=S.aiSecPolicies[parseInt(gi)].polTab;S.aiSecPolicies[parseInt(gi)]=entry;}
  else{S.aiSecPolicies.push(entry);S.aiSecPolicyTab=entry.polTab;}
  S.aiSecDirty=true;
  document.getElementById('aisec-pol-ov').remove();
  renderAISecStepContent();
}

function openAISecPolicyModal(){openAISECPolModal(null,'security');}
function saveAISecPolicy(){aiSecPolSave(null,'security');}
function editAISecPolicy(i){openAISECPolModal(i);}"""

html = html[:s] + new_block + '\n' + html[e:]

with open('/sessions/admiring-youthful-lamport/mnt/outputs/versa-ai-gateway.html', 'w') as f:
    f.write(html)

print(f"OK. Size={len(html)//1024}KB lines={html.count(chr(10))}")
