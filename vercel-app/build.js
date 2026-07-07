const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '..', 'cms_bound_script', 'Sidebar.html');
const outDir = path.join(__dirname, 'public');
const outPath = path.join(outDir, 'index.html');

// ── Shim injected before all other JS ─────────────────────────────────────
// Sets IS_VERCEL_APP flag, defines callServer(), and shims google.script.run
const SHIM = `<script>
const IS_VERCEL_APP = true;
const _CMS_API = '/api/cms';

async function callServer(fn, args) {
  const resp = await fetch(_CMS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn: fn, args: args || [] })
  });
  if (!resp.ok) throw new Error('Network error ' + resp.status);
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'Server error');
  return data.result;
}

/* Mirrors the google.script.run chaining API */
const google = {
  script: {
    run: (function () {
      function makeChain(s, f) {
        return new Proxy({}, {
          get: function (_, prop) {
            if (prop === 'withSuccessHandler') return function (cb) { return makeChain(cb, f); };
            if (prop === 'withFailureHandler') return function (cb) { return makeChain(s, cb); };
            return function () {
              var args = Array.prototype.slice.call(arguments);
              callServer(prop, args).then(s).catch(f);
            };
          }
        });
      }
      return makeChain(function () {}, function (e) { console.error('Server error:', e && e.message || e); });
    })()
  }
};
</script>`;

// ── Dashboard panel HTML (replaces the Tools panel entirely) ───────────────
// Clean panel — no hidden stubs. JS safety patches (steps 7-10) eliminate
// all direct auto-global references to the removed Tools panel elements.
const DASHBOARD_PANEL = `      <div id="dashboard" class="panel">
        <h2>Dashboard</h2>
        <div id="dashboardBox"><div class="small">Loading...</div></div>
      </div>`;

// ── Dashboard JS injected after all existing JS (before </body>) ───────────
// Runs after main script so stat(), money(), el(), escapeHtml() are available
const DASHBOARD_JS = `
<script>
/* ── Vercel dashboard ── */

function loadDashboardSummary() {
  if (!currentAdmin) return;
  var box = el('dashboardBox');
  if (!box) return;
  box.innerHTML = '<div class="small">Loading...</div>';
  google.script.run
    .withSuccessHandler(renderDashboard)
    .withFailureHandler(function(e) {
      box.innerHTML = '<div class="bad">' + escapeHtml((e && e.message) || String(e)) + '</div>';
    })
    .getDashboardSummary(currentAdmin);
}

function renderDashboard(d) {
  var box = el('dashboardBox');
  if (!box) return;
  if (!d) { box.innerHTML = '<div class="bad">No data</div>'; return; }

  var dem = d.demographics || {};
  var unpaidCount = d.unpaidCount || 0;
  var netColor = Number(d.net || 0) >= 0 ? 'var(--green)' : '#e84040';
  var unpaidStyle = unpaidCount > 0
    ? 'border-left-color:#f59e0b;background:#fffbeb'
    : '';

  /* ── Section 1: Financial + Member top cards ── */
  var html = '<div class="balance-grid" style="grid-template-columns:repeat(2,1fr)">';
  html += '<div class="stat"><b>📥 Income</b><br>' + money(d.income) + '</div>';
  html += '<div class="stat"><b>📤 Expenses</b><br>' + money(d.expenses) + '</div>';
  html += '<div class="stat" style="border-left-color:' + netColor + '"><b>⚖️ Net</b><br><span style="color:' + netColor + '">' + money(d.net) + '</span></div>';
  html += '<div class="stat"><b>👥 Active Members</b><br>' + (d.activeMembers || 0) + '</div>';
  html += '<div class="stat" style="' + unpaidStyle + '"><b>' + (unpaidCount > 0 ? '⚠️ ' : '✅ ') + 'Unpaid</b><br>' + unpaidCount + (unpaidCount > 0 ? ' members' : ' — all paid') + '</div>';
  html += '</div>';

  /* ── Section 2: Gender cards ── */
  html += '<div class="balance-grid" style="margin-top:8px">';
  html += '<div class="stat"><b>👨 ኣሕዋት</b><br>' + (dem.men || 0) + '</div>';
  html += '<div class="stat"><b>👩 ኣሓት</b><br>' + (dem.women || 0) + '</div>';
  html += '</div>';

  /* ── Section 3: Age Distribution accordion ── */
  if (dem.ageGroups && dem.ageGroups.length) {
    html += '<details class="accordion" style="margin-top:8px">';
    html += '<summary style="font-weight:600">Age Distribution</summary>';
    html += '<div class="accordion-body">';
    html += dem.ageGroups.map(function(g) {
      return '<div class="result" style="padding:6px 8px"><b>' + escapeHtml(g.label) + '</b>: ' + g.count + ' (' + g.pct + '%)</div>';
    }).join('');
    if (dem.ageUnknown) html += '<div class="small" style="margin-top:4px">No birth date: ' + dem.ageUnknown + '</div>';
    html += '</div></details>';
  }

  box.innerHTML = html;
}

/* Patch showTab so clicking Dashboard triggers loadDashboardSummary */
(function() {
  var _orig = showTab;
  showTab = function(id, btn) {
    _orig(id, btn);
    if (id === 'dashboard') runAfterTabSwitch(loadDashboardSummary);
  };
})();

/* ── Simplified Add Payment UI for Vercel mobile ────────────────────────────
 *
 * Step 1 — Member selected: compact card (name · ID · phone · paid until · balance)
 * Step 2 — Year preview:    one bold line "2025–2026 — €120" + collapsed details
 * Step 3 — Save fields:     unchanged (date, amount, method, recorded by, notes, button)
 *
 * Both overrides call the original function first to preserve all internal state
 * (selectedMemberBalance, selectedCoverageOverride, pAmount auto-fill, etc.).
 * ── */
(function() {

  /* Step 1: renderMemberBalance → compact member card */
  var _origRMB = typeof renderMemberBalance === 'function' ? renderMemberBalance : null;
  if (_origRMB) {
    renderMemberBalance = function(b) {
      _origRMB(b);  // preserves selectedMemberBalance, year dropdowns, pAmount state
      var box = el('pMemberSummary');
      if (!box) return;
      var paidUntil = b.paidUntil || t('none');
      var balance   = formatMoney(b.balanceDue || 0);
      var hasDebt   = Number(b.balanceDue || 0) > 0;
      box.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
            '<b style="font-size:15px">' + escapeHtml(b.memberName || '') + '</b>' +
            '<span class="small" style="margin-left:6px">' + escapeHtml(b.memberId || '') + '</span><br>' +
            '<span class="small">📞 ' + escapeHtml(b.phone || '—') + '</span>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div class="small">Paid until</div>' +
            '<b>' + escapeHtml(paidUntil) + '</b><br>' +
            '<span style="color:' + (hasDebt ? '#e84040' : 'var(--green)') + ';font-weight:600">' +
              balance +
            '</span>' +
          '</div>' +
        '</div>';
      box.style.display = 'block';
    };
  }

  /* Step 2: renderPaymentPreview → compact year/amount line + collapsed details */
  var _origRPP = typeof renderPaymentPreview === 'function' ? renderPaymentPreview : null;
  if (_origRPP) {
    renderPaymentPreview = function(data) {
      _origRPP(data);  // preserves selectedCoverageOverride, auto-fills pAmount if untouched
      var box = el('coverageBox');
      if (!box) return;

      var total    = Number(data.totalAmount || 0);
      var years    = data.coveredYears || '';
      var numYears = data.numberOfYears || 0;
      var remaining = Number(data.remainingBalance || 0);
      var savings   = Number(data.savingsBalance || 0);
      var amtNeeded = Number(data.amountNeeded || 0);
      var suggested = coverageYearsText(selectedCoverageOverride);
      var displayAmt = Number((el('pAmount') || {}).value) || total;

      var previewLine =
        '<div style="background:var(--soft-orange);border-left:4px solid #f59e0b;' +
               'border-radius:6px;padding:10px 12px;margin:4px 0">' +
          '<b style="font-size:16px">' + escapeHtml(years) + ' — ' + formatMoney(displayAmt) + '</b>' +
          (numYears > 1
            ? '<span class="small" style="margin-left:8px">' + numYears + ' years</span>'
            : '') +
        '</div>';

      var detailGrid =
        '<div class="preview-grid" style="margin-top:8px">' +
          mini(t('coveredYears'),     years) +
          mini(t('numberOfYears'),    String(numYears)) +
          mini(t('totalAmount'),      formatMoney(total)) +
          mini(t('savingsBalance'),   formatMoney(savings)) +
          mini(t('amountNeeded'),     formatMoney(amtNeeded)) +
          mini(t('remainingBalance'), formatMoney(remaining)) +
          mini(t('applyPaymentTo'),   suggested) +
        '</div>';

      box.innerHTML =
        previewLine +
        '<details style="margin-top:4px">' +
          '<summary style="font-size:13px;color:var(--muted,#888);cursor:pointer;' +
                          'padding:4px 0;list-style:none">▶ Payment calculation details</summary>' +
          detailGrid +
        '</details>';

      /* Hide the redundant year-status box (already shown in the preview line) */
      var psb = el('paymentStatusBox');
      if (psb) { psb.innerHTML = ''; psb.style.display = 'none'; }
    };
  }

})();
</script>`;

// ── Build ──────────────────────────────────────────────────────────────────
let html = fs.readFileSync(sidebarPath, 'utf-8');

// 1. Remove GAS-only base tag
html = html.replace(/<base\s+target\s*=\s*["']_top["']\s*\/?>/gi, '');

// 2. Replace GAS template expression
html = html.replace(/const initialTab="<\?=\s*initialTab\s*\?>"/g, 'const initialTab="member"');

// 3. Inject shim as the very first <script> block
html = html.replace(/(<script>)/, SHIM + '\n$1');

// 4. Swap Tools tab button → Dashboard tab button
html = html.replace(
  `<button type="button" data-tab="tools" onclick="showTab('tools',this)" data-i18n="tabTools">መሳርሒ</button>`,
  `<button type="button" data-tab="dashboard" onclick="showTab('dashboard',this)">Dashboard</button>`
);

// 5. Replace the entire Tools panel with the Dashboard panel.
//    The Tools panel starts at <div id="tools" class="panel"> and ends at the
//    closing </div> that sits immediately before </div> (.card) then </div> (.wrap).
//    That three-div closing sequence followed by \n\n<script> is unique in the file.
html = html.replace(
  /      <div id="tools" class="panel">[\s\S]*?      <\/div>(\n    <\/div>\n  <\/div>)/,
  DASHBOARD_PANEL + '$1'
);

// 6. Inject dashboard JS right before </body>
html = html.replace('</body>', DASHBOARD_JS + '\n</body>');

// ── Safety patches: remove direct auto-global references to removed Tools panel elements ──
//
// The Tools panel is gone in the Vercel build, but several shared JS functions reference
// its element IDs as browser auto-globals (e.g. deleteMemberSelect, deleteMemberSearch).
// The following patches replace those direct accesses with safe document.getElementById()
// calls that return null when the element is absent and short-circuit cleanly.
//
// Patches are surgical string replacements on the exact lines from Sidebar.html.
// The original Sidebar.html is never modified — patches apply only to the built output.

// 7. renderPaymentMemberOptions — called on Add Payment tab load.
//    Side effect: populates deleteMemberSelect (Tools-only). Guard with null check.
//    Before: deleteMemberSelect.innerHTML='<option ...>'+...
//    After:  (null-safe wrapper — skips the write if element is absent)
const RPMO_BEFORE = `deleteMemberSelect.innerHTML='<option value="">--</option>'+paymentMemberCache.map(m=>\`<option value="\${m.id}">\${m.name} (\${m.id})</option>\`).join("");`;
const RPMO_AFTER  = `(function(){var _dms=document.getElementById('deleteMemberSelect');if(_dms)_dms.innerHTML='<option value="">--</option>'+paymentMemberCache.map(m=>\`<option value="\${m.id}">\${m.name} (\${m.id})</option>\`).join("");})();`;
if (!html.includes(RPMO_BEFORE)) { console.error('PATCH 7 FAILED: renderPaymentMemberOptions target not found'); process.exit(1); }
html = html.replace(RPMO_BEFORE, RPMO_AFTER);

// 8. selectMemberFromSearch — called when any member is chosen from any search dropdown.
//    The target==="remove" branch writes to deleteMemberSelect and deleteMemberSearch (Tools-only).
//    Replace both auto-global accesses with safe getElementById calls.
//    Before: if(target==="remove"){deleteMemberSelect.value=m.id;deleteMemberSearch.value=`...`;...}
//    After:  null-safe version that skips writes when elements are absent
const SMFS_BEFORE = `if(target==="remove"){deleteMemberSelect.value=m.id;deleteMemberSearch.value=\`\${m.name} (\${m.id})\`;closeMemberSearches();return}`;
const SMFS_AFTER  = `if(target==="remove"){var _dms=document.getElementById('deleteMemberSelect'),_dmsq=document.getElementById('deleteMemberSearch');if(_dms)_dms.value=m.id;if(_dmsq)_dmsq.value=\`\${m.name} (\${m.id})\`;closeMemberSearches();return}`;
if (!html.includes(SMFS_BEFORE)) { console.error('PATCH 8 FAILED: selectMemberFromSearch target not found'); process.exit(1); }
html = html.replace(SMFS_BEFORE, SMFS_AFTER);

// 9. filterRemoveMembers — called by refreshSidebarMemberSearches (which runs on every
//    member list refresh, including after Add Payment). Both elements are Tools-only.
//    Guard the entire body: early return if elements are absent.
//    Before: function filterRemoveMembers(){deleteMemberSelect.value="";renderMemberSearch("remove",deleteMemberSearch.value)}
//    After:  null-safe early return
const FRM_BEFORE = `function filterRemoveMembers(){deleteMemberSelect.value="";renderMemberSearch("remove",deleteMemberSearch.value)}`;
const FRM_AFTER  = `function filterRemoveMembers(){var _dms=document.getElementById('deleteMemberSelect'),_dmsq=document.getElementById('deleteMemberSearch');if(!_dms||!_dmsq)return;_dms.value="";renderMemberSearch("remove",_dmsq.value)}`;
if (!html.includes(FRM_BEFORE)) { console.error('PATCH 9 FAILED: filterRemoveMembers target not found'); process.exit(1); }
html = html.replace(FRM_BEFORE, FRM_AFTER);

// 10. removeMemberTool — triggered only by deleteMemberBtn onclick (Tools panel, gone in Vercel).
//     Cannot be reached at runtime, but guard defensively at the top so the function
//     does not crash if somehow invoked (e.g. from a stale cached page).
const RMT_BEFORE = `function removeMemberTool(){if(!deleteMemberSelect.value){`;
const RMT_AFTER  = `function removeMemberTool(){if(!document.getElementById('deleteMemberSelect'))return;var deleteMemberSelect=document.getElementById('deleteMemberSelect'),mergeAdmin=document.getElementById('mergeAdmin');if(!deleteMemberSelect.value){`;
if (!html.includes(RMT_BEFORE)) { console.error('PATCH 10 FAILED: removeMemberTool target not found'); process.exit(1); }
html = html.replace(RMT_BEFORE, RMT_AFTER);

// 11. applyRoleUi — called on EVERY login and every "Start New Payment" click (beginNewPayment).
//     References adminManagement and backupTools as browser auto-globals; both are <details>
//     elements inside the removed Tools panel. Without guards this crashes on every login.
//     Replace both direct accesses with null-safe getElementById calls.
const ARUI_BEFORE = `adminManagement.style.display=p.manageAdmins?"block":"none";backupTools.style.display=p.manageSettings?"block":"none";`;
const ARUI_AFTER  = `(function(){var _am=document.getElementById('adminManagement'),_bt=document.getElementById('backupTools');if(_am)_am.style.display=p.manageAdmins?"block":"none";if(_bt)_bt.style.display=p.manageSettings?"block":"none";})();`;
if (!html.includes(ARUI_BEFORE)) { console.error('PATCH 11 FAILED: applyRoleUi target not found'); process.exit(1); }
html = html.replace(ARUI_BEFORE, ARUI_AFTER);

// 12. loadAdmins — references adminManagement and adminList auto-globals; also has a failure
//     handler that writes to adminManagement. Guard the entire function body.
const LA_BEFORE = `function loadAdmins(){canManageAdmins=!!(currentSession&&currentSession.permissions&&currentSession.permissions.manageAdmins);adminManagement.style.display=canManageAdmins?"block":"none";if(!canManageAdmins)return;adminList.textContent=t("loadingAdmins");google.script.run.withSuccessHandler(renderAdmins).withFailureHandler(e=>{adminManagement.style.display="none";canManageAdmins=false}).getAdminUsers(currentAdmin)}`;
const LA_AFTER  = `function loadAdmins(){canManageAdmins=!!(currentSession&&currentSession.permissions&&currentSession.permissions.manageAdmins);var _am=document.getElementById('adminManagement'),_al=document.getElementById('adminList');if(_am)_am.style.display=canManageAdmins?"block":"none";if(!canManageAdmins)return;if(_al)_al.textContent=t("loadingAdmins");google.script.run.withSuccessHandler(renderAdmins).withFailureHandler(e=>{var _am2=document.getElementById('adminManagement');if(_am2)_am2.style.display="none";canManageAdmins=false}).getAdminUsers(currentAdmin)}`;
if (!html.includes(LA_BEFORE)) { console.error('PATCH 12 FAILED: loadAdmins target not found'); process.exit(1); }
html = html.replace(LA_BEFORE, LA_AFTER);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');
console.log('Built ' + outPath + ' (' + html.length + ' bytes)');

// ── Verification ───────────────────────────────────────────────────────────
const checks = [
  // Structure
  ['IS_VERCEL_APP = true',          /IS_VERCEL_APP\s*=\s*true/],
  ['callServer function',           /async function callServer/],
  ['dashboard tab button',          /data-tab="dashboard"/],
  ['no tools tab button',           /data-tab="tools"/],
  ['dashboard panel',               /id="dashboard"/],
  ['no tools panel',                /id="tools"/],
  // Dashboard features
  ['loadDashboardSummary',          /function loadDashboardSummary/],
  ['renderDashboard',               /function renderDashboard/],
  ['showTab patch',                 /Patch showTab/],
  ['no unpaidAccordion',            /id="unpaidAccordion"/],
  ['no loadUnpaidList',             /function loadUnpaidList/],
  ['no handleReminderClick',        /function handleReminderClick/],
  // Safety patches applied
  ['patch: renderPaymentMemberOptions', /getElementById\('deleteMemberSelect'\)/],
  ['patch: selectMemberFromSearch',     /getElementById\('deleteMemberSearch'\)/],
  ['patch: filterRemoveMembers guard',  /function filterRemoveMembers\(\)\{var _dms/],
  ['patch: removeMemberTool guard',     /function removeMemberTool\(\)\{if\(!document\.getElementById/],
  ['patch: applyRoleUi adminManagement',/getElementById\('adminManagement'\)/],
  ['patch: loadAdmins adminList',       /getElementById\('adminList'\)/],
  // Simplified Add Payment UI
  ['simplified member card',            /Step 1.*renderMemberBalance/],
  ['simplified payment preview',        /Step 2.*renderPaymentPreview/],
  // No stubs
  ['no hidden Tools stubs',         /aria-hidden="true"/],
  // Base/template tags gone
  ['no base tag',                   /<base\s+target/],
  ['no template tag',               /<\?=\s*initialTab/],
];

let pass = 0, fail = 0;
checks.forEach(([name, re]) => {
  const shouldMatch = !name.startsWith('no ');
  const matched = re.test(html);
  const ok = shouldMatch ? matched : !matched;
  console.log((ok ? '✓' : '✗') + ' ' + name);
  ok ? pass++ : fail++;
});
console.log('\n' + pass + '/' + checks.length + ' checks passed' + (fail ? ' — BUILD HAS FAILURES' : ''));
if (fail) process.exit(1);
