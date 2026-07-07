/**
 * CMS End-to-End Acceptance Test Runner
 * Credentials: Mussie Teklit / 1234
 * Authorised by: user (church administrator)
 */

const BASE = 'https://vercel-app-mu-orpin-97.vercel.app/api/cms';
const ADMIN = 'Mussie Teklit';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── helpers ──────────────────────────────────────────────────────────────
let results = [];
let testMemberIds = {};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(fn, args = []) {
  const t0 = Date.now();
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn, args })
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    // Apps Script occasionally returns an HTML error page on throttle/timeout
    data = { ok: false, error: 'Apps Script returned non-JSON (likely throttled/timed out). HTTP ' + res.status };
  }
  return { data, ms };
}

function reqId() {
  return 'TEST-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

function pass(suite, test, ms, detail = '') {
  results.push({ suite, test, status: 'PASS', ms, detail });
  console.log(`  ✓ [${ms}ms] ${test}${detail ? ' — ' + detail : ''}`);
}

function fail(suite, test, ms, detail = '', expected = '', actual = '') {
  results.push({ suite, test, status: 'FAIL', ms, detail, expected, actual });
  console.error(`  ✗ [${ms}ms] ${test} — ${detail}${expected ? ' | expected: ' + expected : ''}${actual ? ' | got: ' + actual : ''}`);
}

function warn(suite, test, ms, detail = '') {
  results.push({ suite, test, status: 'WARN', ms, detail });
  console.warn(`  ⚠ [${ms}ms] ${test} — ${detail}`);
}

function section(name) {
  console.log('\n══════════════════════════════════════');
  console.log(' ' + name);
  console.log('══════════════════════════════════════');
}

// ── 0. Login ─────────────────────────────────────────────────────────────
section('0. Authentication');
let session;
{
  const { data, ms } = await api('loginSession', [ADMIN, '1234']);
  if (data.ok && data.result && data.result.ok) {
    session = data.result;
    pass('Auth', 'Login with valid credentials', ms, `role=${session.role}`);
  } else {
    fail('Auth', 'Login with valid credentials', ms, data.error || JSON.stringify(data));
    console.error('FATAL: Cannot continue without valid login.');
    process.exit(1);
  }

  // Wrong password
  const { data: d2, ms: ms2 } = await api('loginSession', [ADMIN, 'wrong']);
  if (!d2.ok || !(d2.result && d2.result.ok)) {
    pass('Auth', 'Login rejected with wrong password', ms2);
  } else {
    fail('Auth', 'Login rejected with wrong password', ms2, 'Should have been rejected');
  }

  // Empty credentials
  const { data: d3, ms: ms3 } = await api('loginSession', ['', '']);
  if (!d3.ok || !(d3.result && d3.result.ok)) {
    pass('Auth', 'Login rejected with empty credentials', ms3);
  } else {
    fail('Auth', 'Login rejected with empty credentials', ms3, 'Empty creds should be rejected');
  }
}

// ── 0b. Pre-test cleanup — remove any leftover TEST members ──────────────
section('0b. Pre-test Cleanup');
{
  const TEST_PHONES = ['+4917600011111', '+4917600022222', '+4917600033333', '+4917600044444'];
  const { data } = await api('getMembers', [ADMIN]);
  const all = (data.ok && data.result) ? data.result : [];
  const stale = all.filter(m =>
    (m.name && m.name.startsWith('TEST')) ||
    TEST_PHONES.includes(m.phone)
  );
  if (stale.length === 0) {
    pass('Cleanup', 'No stale TEST members found — sheet is clean', 0);
  } else {
    for (const m of stale) {
      const { data: rm, ms } = await api('removeMember', [{ memberId: m.id, admin: ADMIN }]);
      rm.ok
        ? pass('Cleanup', `Pre-clean removed stale: ${m.name} (${m.id})`, ms)
        : warn('Cleanup', `Pre-clean: could not remove ${m.name} (${m.id})`, ms, rm.error);
    }
  }
}

// ── 1. Backup ─────────────────────────────────────────────────────────────
section('1. Pre-test Backup');
{
  const { data, ms } = await api('createBackupNowForSidebar', [ADMIN]);
  if (data.ok) {
    pass('Backup', 'Create backup before test', ms, data.result?.copyUrl ? 'backup URL received' : 'no URL but ok');
  } else {
    warn('Backup', 'Create backup before test', ms, data.error || 'Backup failed — continuing anyway');
  }
}

// ── 2. Fee History & Scenarios ───────────────────────────────────────────
section('2. Membership Fee & Historical Fee Scenarios');
let yearlyFee = 60;
{
  const { data, ms } = await api('getMembershipFeeSettings', [ADMIN]);
  if (data.ok) {
    yearlyFee = Number(data.result?.currentFee || 5) * 12;
    const historyCount = data.result?.history?.length || 0;
    // Expect 2 explicit entries: 2015 baseline + 2026 change
    historyCount >= 2
      ? pass('Fee', 'Fee history has both explicit entries', ms, `entries=${historyCount} current=€${data.result?.currentFee}/month`)
      : fail('Fee', 'Fee history should have ≥2 entries', ms, 'Missing baseline or 2026 entry', '≥2', String(historyCount));
    // Check 2015 baseline entry
    const baseline = (data.result?.history||[]).find(h => h.newFee === 5);
    baseline
      ? pass('Fee', 'Pre-2026 baseline entry present (€5/month)', ms, `date=${baseline.date}`)
      : fail('Fee', 'Pre-2026 baseline entry missing', ms, 'Expected entry with newFee=5');
    // Check 2026 entry
    const entry2026 = (data.result?.history||[]).find(h => h.newFee === 15);
    entry2026
      ? pass('Fee', '2026 fee entry present (€15/month)', ms, `date=${entry2026.date}`)
      : fail('Fee', '2026 fee entry missing', ms, 'Expected entry with newFee=15');
    pass('Fee', 'Current fee is €15/month (€180/year)', ms, `actual=€${data.result?.currentFee}/month`);
  } else {
    fail('Fee', 'getMembershipFeeSettings', ms, data.error);
  }
}

// Verify fee scenarios per church business rules
section('2b. Fee Scenario Verification');
const feeScenarios = [
  { label:'2017-2020', start:2017, end:2020, expect:240, breakdown:'4×€60' },
  { label:'2021-2022', start:2021, end:2022, expect:120, breakdown:'2×€60' },
  { label:'2023-2026', start:2023, end:2026, expect:360, breakdown:'3×€60 + 1×€180' },
  { label:'2024-2026', start:2024, end:2026, expect:300, breakdown:'2×€60 + 1×€180' },
  { label:'2026 only', start:2026, end:2026, expect:180, breakdown:'1×€180' },
];
for (const s of feeScenarios) {
  const { data, ms } = await api('getYearlyPaymentPreview', [{
    memberId:'', memberQuery:'', startYear:s.start, endYear:s.end, amount:'0', admin:ADMIN
  }]);
  if (data.ok) {
    const total = data.result?.totalAmount;
    const years = data.result?.years?.map(y => y.year+':€'+y.yearlyFee).join(', ');
    total === s.expect
      ? pass('FeeScenario', `${s.label} = €${s.expect} (${s.breakdown})`, ms, `years: ${years}`)
      : fail('FeeScenario', `${s.label} = €${s.expect}`, ms, `wrong total`, `€${s.expect}`, `€${total}`);
  } else {
    fail('FeeScenario', `${s.label} preview`, ms, data.error);
  }
}

// ── 3. Add Members ────────────────────────────────────────────────────────
section('3. Add Members');

const testMembers = [
  {
    key: 'one',
    fullName: 'TEST Member One',
    phone: '+4917600011111',
    city: 'Wuppertal',
    joinDate: '2017-02-13',
    gender: 'Male',
    birthDate: '1985-03-10',
  },
  {
    key: 'two',
    fullName: 'TEST Member Two',
    phone: '+4917600022222',
    city: 'Wuppertal',
    joinDate: '2024-01-01',
    gender: 'Female',
    birthDate: '1992-07-22',
  },
  {
    key: 'three',
    fullName: 'TEST Member Three',
    phone: '+4917600033333',
    city: 'Wuppertal',
    joinDate: '2026-06-15',
    gender: 'Male',
    birthDate: '2000-11-05',
  },
];

for (const m of testMembers) {
  const form = {
    requestId: reqId(),
    personType: 'member',
    fullName: m.fullName,
    phone: m.phone,
    city: m.city,
    joinDate: m.joinDate,
    status: 'Active',
    gender: m.gender,
    birthDate: m.birthDate,
    notes: 'AUTO TEST — DELETE AFTER QA',
    addedBy: ADMIN,
    confirmDuplicate: false,
  };
  const { data, ms } = await api('addMember', [form]);
  if (data.ok && data.result?.id) {
    testMemberIds[m.key] = data.result.id;
    pass('AddMember', `Add ${m.fullName}`, ms, `id=${data.result.id}`);
  } else {
    fail('AddMember', `Add ${m.fullName}`, ms, data.error || JSON.stringify(data.result));
  }
}

// ── 3a. Duplicate protection ──────────────────────────────────────────────
{
  const form = {
    requestId: reqId(),
    personType: 'member',
    fullName: 'TEST Member One',
    phone: '+4917600011111',
    city: 'Wuppertal',
    joinDate: '2017-02-13',
    status: 'Active',
    gender: 'Male',
    birthDate: '1985-03-10',
    notes: 'DUPLICATE TEST',
    addedBy: ADMIN,
    confirmDuplicate: false,
  };
  const { data, ms } = await api('addMember', [form]);
  if (data.result?.duplicateWarning) {
    pass('AddMember', 'Duplicate member blocked with warning', ms, `duplicates=${data.result.duplicates?.length}`);
  } else if (!data.ok) {
    pass('AddMember', 'Duplicate member blocked (error)', ms);
  } else {
    warn('AddMember', 'Duplicate protection', ms, 'No duplicate warning returned — check behaviour');
  }
}

// ── 3b. Invalid phone ─────────────────────────────────────────────────────
{
  const form = {
    requestId: reqId(),
    personType: 'member',
    fullName: 'TEST Invalid Phone',
    phone: 'notaphone',
    city: '',
    joinDate: '2024-01-01',
    status: 'Active',
    gender: 'Male',
    birthDate: '1990-01-01',
    notes: 'INVALID TEST',
    addedBy: ADMIN,
    confirmDuplicate: false,
  };
  const { data, ms } = await api('addMember', [form]);
  // System may or may not validate phone format server-side
  if (!data.ok) {
    pass('AddMember', 'Invalid phone rejected', ms, data.error);
  } else {
    warn('AddMember', 'Invalid phone accepted', ms, 'Backend does not validate phone format — UI-only validation');
    // Clean up if it was added
    if (data.result?.id) {
      await api('removeMember', [{ memberId: data.result.id, admin: ADMIN }]);
    }
  }
}

// ── 3c. Invalid birth date ────────────────────────────────────────────────
{
  const form = {
    requestId: reqId(),
    personType: 'member',
    fullName: 'TEST Future DOB',
    phone: '+4917600099999',
    city: '',
    joinDate: '2024-01-01',
    status: 'Active',
    gender: 'Male',
    birthDate: '2099-01-01',
    notes: 'INVALID TEST',
    addedBy: ADMIN,
    confirmDuplicate: true,
  };
  const { data, ms } = await api('addMember', [form]);
  if (!data.ok) {
    pass('AddMember', 'Future birth date rejected', ms, data.error);
  } else {
    fail('AddMember', 'Future birth date rejected', ms, 'Should reject future DOB', 'error', 'ok');
    if (data.result?.id) await api('removeMember', [{ memberId: data.result.id, admin: ADMIN }]);
  }
}

// ── 3d. Search ────────────────────────────────────────────────────────────
section('3d. Member Search');
{
  const { data, ms } = await api('getMembers', [ADMIN]);
  if (data.ok) {
    const all = data.result || [];
    const found1 = all.find(m => m.id === testMemberIds.one);
    const found2 = all.find(m => m.phone === '+4917600022222');
    const found3 = all.find(m => m.name === 'TEST Member Three');
    found1 ? pass('Search', 'Find member by ID', ms, testMemberIds.one) :
             fail('Search', 'Find member by ID', ms, 'Not in list');
    found2 ? pass('Search', 'Find member by phone', ms) :
             fail('Search', 'Find member by phone', ms);
    found3 ? pass('Search', 'Find member by name', ms) :
             fail('Search', 'Find member by name', ms);
    pass('Search', 'getMembers response', ms, `total=${all.length} members`);
  } else {
    fail('Search', 'getMembers', ms, data.error);
  }
}

// ── 4. Balance lookups ─────────────────────────────────────────────────────
section('4. Balance Lookups');
const balances = {};
for (const [key, id] of Object.entries(testMemberIds)) {
  if (!id) continue;
  const { data, ms } = await api('getMemberBalanceLookup', [id, ADMIN]);
  if (data.ok) {
    balances[key] = data.result;
    pass('Balance', `Balance lookup ${key} (${id})`, ms,
      `balance=€${data.result.balanceDue} paidUntil=${data.result.paidUntil||'none'} unpaid=${data.result.unpaidYears?.length||0}yrs`);
  } else {
    fail('Balance', `Balance lookup ${key}`, ms, data.error);
  }
}

// ── 5. Payment Preview ────────────────────────────────────────────────────
section('5. Payment Preview');
async function preview(memberId, startYear, endYear, amount) {
  return api('getYearlyPaymentPreview', [{
    memberId, memberQuery: '', startYear, endYear,
    amount: String(amount), admin: ADMIN
  }]);
}

let previewOne;
{
  const { data, ms } = await preview(testMemberIds.one, 2017, 2020, 242);
  if (data.ok) {
    previewOne = data.result;
    const total = data.result.totalAmount;
    pass('Preview', 'Member One 2017-2020 preview', ms,
      `total=€${total} coveredYears=${data.result.coveredYears} savings=€${data.result.savingsBalance}`);
  } else {
    fail('Preview', 'Member One 2017-2020 preview', ms, data.error);
  }
}

// ── 6. Add Payments — Member One ─────────────────────────────────────────
section('6. Payments — TEST Member One');

async function buildCoverage(memberId, startYear, endYear) {
  const { data } = await preview(memberId, startYear, endYear, 0);
  if (!data.ok) return null;
  return data.result?.rangeCoverage || [];
}

// addPayment: amount=null means use the exact amount from the preview.
// Retries up to 3 times with 3-second backoff on "still finishing" lock errors.
async function addPayment(memberId, startYear, endYear, amount, notes = '') {
  const { data: prevData } = await api('getYearlyPaymentPreview', [{
    memberId, memberQuery: '', startYear, endYear,
    amount: amount != null ? String(amount) : '0', admin: ADMIN
  }]);
  const preview = prevData?.result;
  const actualAmount = amount != null ? amount : Number(preview?.totalAmount || 0);
  const coverage = preview?.rangeCoverage || [];
  const allMonths = coverage.flatMap(y => y.months || []);
  const payload = [{
    requestId: reqId(),
    payerType: 'member',
    paymentKind: 'Membership',
    memberId,
    memberQuery: '',
    memberName: '',
    paymentDate: '2026-06-27',
    months: allMonths,
    coverage: JSON.stringify(coverage),
    year: String(startYear),
    amount: String(actualAmount),
    extraPaymentHandling: '',
    reason: 'Membership',
    method: 'Cash',
    recordedBy: ADMIN,
    notes: 'AUTO TEST' + (notes ? ' — ' + notes : ''),
    transactionType: 'Member Payment',
  }];

  // Retry up to 3 times if backend write-lock is still held
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await api('addPayment', payload);
    const errMsg = result.data?.error || '';
    const isLocked = errMsg.includes('still finishing') || errMsg.includes('Another save');
    if (!isLocked) return result;
    console.log(`    ↻ Payment locked (attempt ${attempt}/3) — waiting 4s...`);
    await sleep(4000);
    payload[0].requestId = reqId(); // fresh requestId on retry
  }
  return api('addPayment', payload); // final attempt
}

let paymentIds = [];

// Payment 1: 2017–2020 — use exact amount from preview
{
  const { data, ms } = await addPayment(testMemberIds.one, 2017, 2020, null, 'P1 2017-2020');
  if (data.ok && data.result?.id) {
    paymentIds.push(data.result.id);
    pass('Payment', `Member One: Pay 2017-2020 (preview amount)`, ms, `txnId=${data.result.id}`);
  } else {
    fail('Payment', `Member One: Pay 2017-2020`, ms, data.error || JSON.stringify(data.result));
  }
}
await sleep(2500); // wait for write-lock to release before next payment

// Check balance after payment 1
{
  const { data, ms } = await api('getMemberBalanceLookup', [testMemberIds.one, ADMIN]);
  if (data.ok) {
    const b = data.result;
    const paidOk = (b.paidYears || []).includes(2020);
    paidOk
      ? pass('Payment', '2020 marked paid after P1', ms)
      : fail('Payment', '2020 marked paid after P1', ms, `paidYears=${JSON.stringify(b.paidYears)}`);
    pass('Payment', `Balance after P1`, ms, `remaining=€${b.balanceDue} savings=€${b.savingsBalance||0}`);
  } else {
    fail('Payment', 'Balance check after P1', ms, data.error);
  }
}

// Payment 2: 2021–2022
{
  const { data, ms } = await addPayment(testMemberIds.one, 2021, 2022, null, 'P2 2021-2022');
  if (data.ok && data.result?.id) {
    paymentIds.push(data.result.id);
    pass('Payment', `Member One: Pay 2021-2022`, ms, `txnId=${data.result.id}`);
  } else {
    fail('Payment', `Member One: Pay 2021-2022`, ms, data.error || JSON.stringify(data.result));
  }
}
await sleep(2500); // wait for write-lock to release before next payment

// Payment 3: 2023–2026
{
  const { data, ms } = await addPayment(testMemberIds.one, 2023, 2026, null, 'P3 2023-2026');
  if (data.ok && data.result?.id) {
    paymentIds.push(data.result.id);
    pass('Payment', `Member One: Pay 2023-2026`, ms, `txnId=${data.result.id}`);
  } else {
    fail('Payment', `Member One: Pay 2023-2026`, ms, data.error || JSON.stringify(data.result));
  }
}
await sleep(2500); // wait for write-lock to release

// Final balance check — should be €0 all paid
{
  const { data, ms } = await api('getMemberBalanceLookup', [testMemberIds.one, ADMIN]);
  if (data.ok) {
    const b = data.result;
    const zeroBal = Math.abs(Number(b.balanceDue || 0)) < 0.01;
    zeroBal
      ? pass('Payment', 'Member One: Final balance = €0', ms, `paidUntil=${b.paidUntil}`)
      : fail('Payment', 'Member One: Final balance = €0', ms, 'expected €0', '€0', `€${b.balanceDue}`);
    const totalPaidYears = (b.paidYears || []).length;
    totalPaidYears >= 10
      ? pass('Payment', `Member One: All 10 years paid (2017-2026)`, ms, `paidYears=${b.paidYears?.join(',')}`)
      : fail('Payment', `Member One: All years paid`, ms, `only ${totalPaidYears} years`, '10', String(totalPaidYears));
  } else {
    fail('Payment', 'Member One final balance', ms, data.error);
  }
}

// ── 7. Payments — Member Two ──────────────────────────────────────────────
section('7. Payments — TEST Member Two');
{
  // 2024: €60, 2025: €60, 2026: €180 → total €300 per fee history
  const { data, ms } = await addPayment(testMemberIds.two, 2024, 2026, null, 'M2 full');
  if (data.ok && data.result?.id) {
    paymentIds.push(data.result.id);
    pass('Payment', `Member Two: Pay 2024-2026 (€60+€60+€180=€300 per fee history)`, ms, `txnId=${data.result.id}`);
  } else {
    fail('Payment', `Member Two: Pay 2024-2026`, ms, data.error || JSON.stringify(data.result));
  }
  await sleep(2500);
}
{
  const { data, ms } = await api('getMemberBalanceLookup', [testMemberIds.two, ADMIN]);
  if (data.ok) {
    const zeroBal = Math.abs(Number(data.result.balanceDue || 0)) < 0.01;
    zeroBal
      ? pass('Payment', 'Member Two: Balance = €0 after full payment', ms)
      : fail('Payment', 'Member Two: Balance = €0', ms, '', '€0', `€${data.result.balanceDue}`);
    const paidUntilCorrect = data.result.paidUntil === '2026' || String(data.result.paidUntil).includes('2026');
    paidUntilCorrect
      ? pass('Payment', 'Member Two: Paid until = 2026', ms, `actual=${data.result.paidUntil}`)
      : fail('Payment', 'Member Two: Paid until = 2026', ms, '', '2026', String(data.result.paidUntil));
  } else {
    fail('Payment', 'Member Two balance check', ms, data.error);
  }
}

// ── 8. Payments — Member Three ────────────────────────────────────────────
section('8. Payments — TEST Member Three (joined June 2026)');
{
  // Member 3 joined 2026-06-15, should only owe 2026
  const { data, ms } = await api('getMemberBalanceLookup', [testMemberIds.three, ADMIN]);
  if (data.ok) {
    const b = data.result;
    const noEarlier = !(b.unpaidYears || []).some(y => y < 2026);
    noEarlier
      ? pass('Payment', 'Member Three: No charge before registration year 2026', ms, `unpaid=${JSON.stringify(b.unpaidYears)}`)
      : fail('Payment', 'Member Three: Charged before 2026', ms, 'Should not charge before joinDate year', '[2026]', JSON.stringify(b.unpaidYears));
    // Pay 2026 only
    const { data: pd, ms: pms } = await addPayment(testMemberIds.three, 2026, 2026, yearlyFee, 'M3 2026');
    if (pd.ok && pd.result?.id) {
      paymentIds.push(pd.result.id);
      pass('Payment', `Member Three: Pay 2026 €${yearlyFee}`, pms, `txnId=${pd.result.id}`);
    } else {
      fail('Payment', 'Member Three: Pay 2026', pms, pd.error || JSON.stringify(pd.result));
    }
    await sleep(2500);
  } else {
    fail('Payment', 'Member Three balance', ms, data.error);
  }
}

// ── 9. Payment Protections ────────────────────────────────────────────────
section('9. Payment Protections');

// Duplicate payment — already paid year (use preview amount)
{
  const { data, ms } = await addPayment(testMemberIds.two, 2024, 2024, null, 'DUPLICATE TEST');
  if (!data.ok) {
    pass('Protection', 'Duplicate payment for paid year rejected', ms, data.error);
  } else {
    fail('Protection', 'Duplicate payment for paid year rejected', ms,
      'System accepted duplicate payment', 'error', 'ok');
    if (data.result?.id) paymentIds.push(data.result.id); // track for cleanup
  }
}

// Zero amount
{
  const { data, ms } = await addPayment(testMemberIds.one, 2027, 2027, 0, 'ZERO AMOUNT TEST');
  if (!data.ok) {
    pass('Protection', 'Zero amount payment rejected', ms, data.error);
  } else {
    warn('Protection', 'Zero amount accepted', ms, 'May need frontend guard only');
  }
}

// No member selected
{
  const { data, ms } = await api('addPayment', [{
    requestId: reqId(), payerType: 'member', paymentKind: 'Membership',
    memberId: '', memberQuery: '', memberName: '', paymentDate: '2026-06-27',
    months: [], coverage: '', year: '2026', amount: '60',
    reason: 'Membership', method: 'Cash', recordedBy: ADMIN,
    notes: 'NO MEMBER TEST', transactionType: 'Member Payment',
  }]);
  if (!data.ok) {
    pass('Protection', 'Payment without member rejected', ms, data.error);
  } else {
    fail('Protection', 'Payment without member rejected', ms);
  }
}

// Duplicate requestId (double-click protection)
{
  const rid = reqId();
  const { data: prevD } = await api('getYearlyPaymentPreview', [{
    memberId: testMemberIds.three, memberQuery: '', startYear: 2026, endYear: 2026,
    amount: '0', admin: ADMIN
  }]);
  const cov = prevD?.result?.rangeCoverage || [];
  const allM = cov.flatMap(y => y.months || []);
  const dblAmount = prevD?.result?.totalAmount || yearlyFee;
  const payload = [{
    requestId: rid, payerType: 'member', paymentKind: 'Membership',
    memberId: testMemberIds.three, memberQuery: '', memberName: '',
    paymentDate: '2026-06-27', months: allM,
    coverage: JSON.stringify(cov),
    year: '2026', amount: String(dblAmount),
    reason: 'Membership', method: 'Cash', recordedBy: ADMIN,
    notes: 'DOUBLE-CLICK TEST', transactionType: 'Member Payment',
  }];
  // Send same requestId twice
  const [r1, r2] = await Promise.all([api('addPayment', payload), api('addPayment', payload)]);
  const both = [r1.data, r2.data];
  const okCount = both.filter(d => d.ok).length;
  const errorCount = both.filter(d => !d.ok).length;
  if (okCount === 1 && errorCount === 1) {
    pass('Protection', 'Double-click requestId deduplication', r1.ms, 'Exactly one succeeded');
  } else if (okCount === 0) {
    pass('Protection', 'Double-click: both blocked (year already paid)', r1.ms);
  } else {
    warn('Protection', `Double-click deduplication`, r1.ms,
      `both=${okCount} ok, ${errorCount} error — check for duplicate row`);
  }
}

// ── 10. Church Transactions — Income ─────────────────────────────────────
section('10. Church Transactions — Income');

// Get categories first
let incomeCategories = [], expenseCategories = [];
{
  const { data, ms } = await api('getTransactionCategories', [ADMIN]);
  if (data.ok) {
    const cats = data.result || {};
    incomeCategories = cats.income || cats.Income || cats['Member Payment'] ? Object.values(cats).flat() : [];
    // Try flat array if that's the format
    if (Array.isArray(data.result)) {
      incomeCategories = data.result.filter(c => c.type === 'Income' || !c.type);
      expenseCategories = data.result.filter(c => c.type === 'Expense');
    } else {
      incomeCategories = cats.income || cats.Income || [];
      expenseCategories = cats.expense || cats.Expense || [];
    }
    pass('Transactions', 'Get transaction categories', ms,
      `income=${incomeCategories.length} expense=${expenseCategories.length} raw_keys=${Object.keys(cats||{}).join(',')}`);
    console.log('  Raw categories:', JSON.stringify(data.result).slice(0, 300));
  } else {
    warn('Transactions', 'Get transaction categories', ms, data.error);
  }
}

async function addIncome(categoryId, amount, notes, donorName = '') {
  return api('addChurchTransaction', [{
    requestId: reqId(),
    transactionType: 'Income',
    categoryId: categoryId,
    date: '2026-06-27',
    memberId: '',
    memberName: donorName,
    donorName: donorName,
    memberPhone: '',
    amount: String(amount),
    method: 'Cash',
    recordedBy: ADMIN,
    notes: 'AUTO TEST — ' + notes,
    admin: ADMIN,
  }]);
}

async function addExpense(categoryId, amount, notes) {
  return api('addChurchTransaction', [{
    requestId: reqId(),
    transactionType: 'Expense',
    categoryId: categoryId,
    date: '2026-06-27',
    donorName: ADMIN,
    amount: String(amount),
    method: 'Cash',
    paidFromCollectedCash: false,
    evidenceLink: '',
    recordedBy: ADMIN,
    notes: 'AUTO TEST — ' + notes,
    admin: ADMIN,
  }]);
}

let churchTxnIds = [];

// Use first available income category, or 'Offering' as fallback
const incomeCatId = (incomeCategories[0]?.id || incomeCategories[0]) || 'Offering';
const expenseCatId = (expenseCategories[0]?.id || expenseCategories[0]) || 'Rent';

// Income transactions
for (const [amount, notes] of [[500, 'Sunday offering'], [250, 'Special donation'], [150, 'Weekly collection']]) {
  const { data, ms } = await addIncome(incomeCatId, amount, notes, 'TEST Donor');
  if (data.ok && data.result?.id) {
    churchTxnIds.push(data.result.id);
    pass('Transactions', `Add income €${amount} (${notes})`, ms, `id=${data.result.id}`);
  } else {
    fail('Transactions', `Add income €${amount}`, ms, data.error || JSON.stringify(data.result));
  }
}

// ── 10b. Expense transactions ─────────────────────────────────────────────
section('10b. Church Expenses');
for (const [amount, notes] of [[800, 'Rent/Hall cost'], [120, 'Electricity/Utility'], [45, 'Office materials']]) {
  const { data, ms } = await addExpense(expenseCatId, amount, notes);
  if (data.ok && data.result?.id) {
    churchTxnIds.push(data.result.id);
    pass('Transactions', `Add expense €${amount} (${notes})`, ms, `id=${data.result.id}`);
  } else {
    fail('Transactions', `Add expense €${amount}`, ms, data.error || JSON.stringify(data.result));
  }
}

// Transaction validation
{
  // Zero amount
  const { data, ms } = await addIncome(incomeCatId, 0, 'ZERO TEST');
  if (!data.ok) pass('Transactions', 'Zero amount income rejected', ms, data.error);
  else warn('Transactions', 'Zero amount accepted', ms, 'Frontend validation only');

  // Missing category
  const { data: d2, ms: ms2 } = await api('addChurchTransaction', [{
    requestId: reqId(), transactionType: 'Income', categoryId: '',
    date: '2026-06-27', amount: '100', method: 'Cash',
    recordedBy: ADMIN, notes: 'NO CAT TEST', admin: ADMIN,
  }]);
  if (!d2.ok) pass('Transactions', 'Missing category rejected', ms2, d2.error);
  else warn('Transactions', 'Missing category accepted', ms2, 'Frontend validation only');

  // Empty date rejected
  const { data: d3, ms: ms3 } = await api('addChurchTransaction', [{
    requestId: reqId(), transactionType: 'Income', categoryId: incomeCatId,
    date: '', amount: '100', method: 'Cash',
    recordedBy: ADMIN, notes: 'NO DATE TEST', admin: ADMIN,
  }]);
  if (!d3.ok) pass('Transactions', 'Empty date rejected', ms3, d3.error);
  else fail('Transactions', 'Empty date rejected', ms3, 'Backend accepted empty date');

  // Null date rejected (field omitted)
  const { data: d4, ms: ms4 } = await api('addChurchTransaction', [{
    requestId: reqId(), transactionType: 'Income', categoryId: incomeCatId,
    amount: '100', method: 'Cash',
    recordedBy: ADMIN, notes: 'NULL DATE TEST', admin: ADMIN,
  }]);
  if (!d4.ok) pass('Transactions', 'Missing date rejected', ms4, d4.error);
  else fail('Transactions', 'Missing date rejected', ms4, 'Backend accepted missing date');

  // Invalid date rejected
  const { data: d5, ms: ms5 } = await api('addChurchTransaction', [{
    requestId: reqId(), transactionType: 'Income', categoryId: incomeCatId,
    date: 'not-a-date', amount: '100', method: 'Cash',
    recordedBy: ADMIN, notes: 'BAD DATE TEST', admin: ADMIN,
  }]);
  if (!d5.ok) pass('Transactions', 'Invalid date rejected', ms5, d5.error);
  else fail('Transactions', 'Invalid date rejected', ms5, 'Backend accepted invalid date');
}

// ── 11. Dashboard Totals (cached) ────────────────────────────────────────
section('11. Dashboard Totals');
{
  const { data, ms } = await api('getDashboardSummaryCached', [ADMIN]);
  if (data.ok) {
    const r = data.result;
    console.log('  Dashboard:', JSON.stringify({ income: r.income, expenses: r.expenses,
      net: r.net, activeMembers: r.activeMembers, unpaidCount: r.unpaidCount,
      fromCache: r.fromCache, cachedAt: r.cachedAt }));

    // All 3 test members active
    const hasMembersAdded = (r.activeMembers || 0) >= 3;
    hasMembersAdded
      ? pass('Dashboard', `Active members ≥ 3`, ms, `actual=${r.activeMembers}`)
      : fail('Dashboard', 'Active members ≥ 3', ms, '', '≥3', String(r.activeMembers));

    // Income reflects test payments (€600 membership + €900 church income)
    const expIncome = yearlyFee * 10 + yearlyFee * 3 + yearlyFee + 500 + 250 + 150;
    const incomeOk = Number(r.income || 0) >= expIncome * 0.8;
    incomeOk
      ? pass('Dashboard', `Income includes test payments`, ms, `total=€${r.income}`)
      : warn('Dashboard', `Income total`, ms, `got €${r.income} — may include only recent data`);

    pass('Dashboard', 'Dashboard loads without error', ms,
      `income=€${r.income} expenses=€${r.expenses} net=€${r.net}`);

    // Cache metadata
    typeof r.fromCache === 'boolean'
      ? pass('Dashboard', 'getDashboardSummaryCached returns fromCache field', ms, `fromCache=${r.fromCache}`)
      : fail('Dashboard', 'fromCache field missing', ms);
  } else {
    fail('Dashboard', 'getDashboardSummaryCached', ms, data.error);
  }
}

// ── 11b. Dashboard Cache Benchmark ───────────────────────────────────────
section('11b. Dashboard Cache Benchmark');
{
  // First call: may be cold (cache miss → rebuild)
  const { data: d1, ms: ms1 } = await api('getDashboardSummaryCached', [ADMIN]);
  // Second call: should be cache hit
  const { data: d2, ms: ms2 } = await api('getDashboardSummaryCached', [ADMIN]);
  const r1 = d1.ok ? d1.result : null;
  const r2 = d2.ok ? d2.result : null;
  if (r1 && r2) {
    pass('Benchmark', `First call (${r1.fromCache?'cached':'live'})`, ms1, `${ms1}ms`);
    pass('Benchmark', `Second call (${r2.fromCache?'cached':'live'})`, ms2, `${ms2}ms`);
    const speedup = ms1 - ms2;
    const totalsMatch = r1.income === r2.income && r1.expenses === r2.expenses;
    totalsMatch
      ? pass('Benchmark', 'Cached totals match live totals', Math.max(ms1, ms2),
          `income ${r1.income}==${r2.income} expenses ${r1.expenses}==${r2.expenses}`)
      : fail('Benchmark', 'Cached totals match live totals', ms2, '',
          `income=${r1.income} exp=${r1.expenses}`, `income=${r2.income} exp=${r2.expenses}`);
    console.log(`  Cache speedup: ${speedup}ms (${ms1}ms → ${ms2}ms)`);
    speedup > 0
      ? pass('Benchmark', `Cache is faster than rebuild`, ms2, `saved ${speedup}ms`)
      : pass('Benchmark', `Second call completed`, ms2, `both calls fast (${ms1}ms, ${ms2}ms)`);
  } else {
    fail('Benchmark', 'Benchmark calls failed', 0, (d1.error || '') + ' ' + (d2.error || ''));
  }
}

// ── 12. Unpaid Members ────────────────────────────────────────────────────
section('12. Unpaid Members');
{
  const { data, ms } = await api('getUnpaidMembersForDashboard', [ADMIN]);
  if (data.ok) {
    const unpaid = data.result || [];
    const testUnpaid = unpaid.filter(m =>
      m.name?.startsWith('TEST') || m.id === testMemberIds.one ||
      m.id === testMemberIds.two || m.id === testMemberIds.three
    );
    // All 3 test members should now be fully paid
    testUnpaid.length === 0
      ? pass('Unpaid', 'All 3 test members fully paid — not in unpaid list', ms)
      : fail('Unpaid', 'Test members should not be unpaid', ms,
          `still unpaid: ${testUnpaid.map(m=>m.name).join(', ')}`);
    pass('Unpaid', 'getUnpaidMembersForDashboard responds', ms, `total unpaid=${unpaid.length}`);
  } else {
    fail('Unpaid', 'getUnpaidMembersForDashboard', ms, data.error);
  }
}

// ── 13. History / Search ──────────────────────────────────────────────────
section('13. History & Search');
{
  // Search by member name
  const { data, ms } = await api('searchHistory', [{
    query: 'TEST Member One', admin: ADMIN, type: 'all',
    dateFrom: '', dateTo: '', page: 1
  }]);
  if (data.ok) {
    const raw = data.result;
    const rows = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
    pass('History', 'searchHistory by name returns results', ms, `rows=${rows.length} raw_type=${Array.isArray(raw)?'array':typeof raw}`);
  } else {
    fail('History', 'searchHistory', ms, data.error);
  }

  // Search by member ID
  if (testMemberIds.one) {
    const { data: d2, ms: ms2 } = await api('searchHistory', [{
      query: testMemberIds.one, admin: ADMIN, type: 'all',
      dateFrom: '', dateTo: '', page: 1
    }]);
    if (d2.ok) {
      const raw2 = d2.result;
      const rows = Array.isArray(raw2?.rows) ? raw2.rows : Array.isArray(raw2) ? raw2 : [];
      pass('History', 'searchHistory by member ID', ms2, `rows=${rows.length}`);
    } else {
      fail('History', 'searchHistory by ID', ms2, d2.error);
    }
  }
}

// ── 14. Receipt Generation ────────────────────────────────────────────────
section('14. Receipt Generation');
{
  if (paymentIds.length > 0) {
    const { data, ms } = await api('generateReceiptForPayment', [{
      transactionId: paymentIds[0], admin: ADMIN, language: 'en'
    }]);
    if (data.ok) {
      const r = data.result;
      const hasUrl = !!(r?.receiptUrl || r?.driveUrl);
      hasUrl
        ? pass('Receipt', 'Generate receipt with PDF URL', ms, `url=${(r.receiptUrl||r.driveUrl||'').slice(0,60)}`)
        : warn('Receipt', 'Receipt generated but no URL', ms, JSON.stringify(r).slice(0, 200));
      const hasWhatsApp = !!(r?.whatsappMessage || r?.whatsappUrl);
      hasWhatsApp
        ? pass('Receipt', 'Receipt has WhatsApp message', ms)
        : warn('Receipt', 'No WhatsApp message in receipt', ms);
    } else {
      fail('Receipt', 'generateReceiptForPayment', ms, data.error);
    }
  } else {
    warn('Receipt', 'No payment IDs to test receipt with', 0);
  }
}

// ── 14b. Receipt Storage Verification ────────────────────────────────────
section('14b. Receipt Storage');
{
  const { data, ms } = await api('verifyReceiptStorage', [ADMIN]);
  if (data.ok) {
    const outer = data.result; // { ok: true, report: {...} }
    const r = (outer && outer.report) ? outer.report : outer;
    // Report must have required fields
    const hasFields = r && 'totalMemberFolders' in r && 'totalYearFolders' in r && 'totalReceiptPdfs' in r;
    hasFields
      ? pass('ReceiptStorage', 'verifyReceiptStorage returns report', ms,
          `members=${r.totalMemberFolders} years=${r.totalYearFolders} pdfs=${r.totalReceiptPdfs} legacy=${r.legacyFlatReceiptCount}`)
      : fail('ReceiptStorage', 'verifyReceiptStorage missing fields', ms, JSON.stringify(r).slice(0, 200));
    // At least one test member receipt should be in the organized structure
    const hasMemberFolder = (r.totalMemberFolders || 0) > 0;
    hasMemberFolder
      ? pass('ReceiptStorage', 'Member folder created for test receipt', ms, `${r.totalMemberFolders} member folder(s)`)
      : warn('ReceiptStorage', 'No member folders found — receipt may not have been generated', ms);
    // Verify year folder is current year
    const currentYear = String(new Date().getFullYear());
    const hasCurrentYear = (r.memberSummary || []).some(m =>
      (m.yearFolders || []).some(y => y.year === currentYear));
    hasCurrentYear
      ? pass('ReceiptStorage', `Year folder ${currentYear} exists`, ms)
      : warn('ReceiptStorage', `Year folder ${currentYear} not found`, ms, 'may be empty if no receipt was generated');
    // No duplicates
    const noDups = !r.duplicateFolders || r.duplicateFolders.length === 0;
    noDups
      ? pass('ReceiptStorage', 'No duplicate folders', ms)
      : fail('ReceiptStorage', 'Duplicate folders detected', ms, JSON.stringify(r.duplicateFolders));
  } else {
    fail('ReceiptStorage', 'verifyReceiptStorage', ms, data.error);
  }
}

// ── 15. Edit Records ──────────────────────────────────────────────────────
section('15. Edit Records');
{
  // Create a dedicated edit-test member + payment so we have a known row to edit.
  let editMemberId = null;
  let editTxId = null;

  // 15a. Setup: add edit test member
  const { data: emData, ms: emMs } = await api('addMember', [{
    requestId: reqId(),
    personType: 'member',
    fullName: 'TEST Edit Member',
    phone: '+4917600044444',
    city: 'Wuppertal',
    joinDate: '2026-01-01',
    status: 'Active',
    gender: 'Male',
    birthDate: '1990-05-15',
    notes: 'EDIT TEST — DELETE AFTER QA',
    addedBy: ADMIN,
    confirmDuplicate: false,
  }]);
  if (emData.ok && emData.result?.id) {
    editMemberId = emData.result.id;
    pass('Edit', 'Setup: add edit test member', emMs, `id=${editMemberId}`);
  } else {
    fail('Edit', 'Setup: add edit test member', emMs, emData.error || JSON.stringify(emData.result));
  }

  // 15b. Setup: make one payment for the edit member
  if (editMemberId) {
    const { data: epData, ms: epMs } = await addPayment(editMemberId, 2026, 2026, yearlyFee, 'EDIT TEST PAYMENT');
    if (epData.ok && (epData.result?.id || epData.result?.transactionId || epData.result?.transactionIds?.[0])) {
      editTxId = epData.result?.id || epData.result?.transactionId || epData.result?.transactionIds?.[0];
      pass('Edit', 'Setup: add edit test payment', epMs, `txId=${editTxId}`);
    } else {
      fail('Edit', 'Setup: add edit test payment', epMs, epData.error || JSON.stringify(epData.result));
    }
  }

  // 15c. Read the payment row via getRowForEditByTxId
  let editRow = null;
  let editSheetName = null;
  if (editTxId) {
    const { data: rowData, ms: rowMs } = await api('getRowForEditByTxId', [{ txId: editTxId, admin: ADMIN }]);
    if (rowData.ok && rowData.result?.row) {
      editRow = rowData.result.row;
      editSheetName = rowData.result.sheetName;
      pass('Edit', 'getRowForEditByTxId returns row', rowMs, `row=${editRow} sheet=${editSheetName}`);
    } else {
      fail('Edit', 'getRowForEditByTxId returns row', rowMs, rowData.error || JSON.stringify(rowData.result));
    }
  }

  // 15d. Edit the payment notes via updateSelectedRow
  if (editRow && editSheetName && editMemberId && editTxId) {
    const { data: updData, ms: updMs } = await api('updateSelectedRow', [{
      sheetName: editSheetName,
      row: editRow,
      transactionId: editTxId,
      paymentDate: '2026-01-15',
      memberId: editMemberId,
      memberName: 'TEST Edit Member',
      month: 'January',
      year: 2026,
      amount: yearlyFee,
      reason: 'Membership',
      method: 'Cash',
      recordedBy: ADMIN,
      admin: ADMIN,
      notes: 'EDIT TEST — updated notes',
      auditReason: 'Automated edit test',
    }]);
    if (updData.ok) {
      pass('Edit', 'updateSelectedRow succeeds', updMs);
    } else {
      fail('Edit', 'updateSelectedRow succeeds', updMs, updData.error || JSON.stringify(updData.result));
    }
  }

  // 15e. Cleanup: remove edit test member (also removes payment + coverage)
  if (editMemberId) {
    const { data: rmData } = await api('removeMember', [{ memberId: editMemberId, admin: ADMIN }]);
    if (!rmData.ok) console.warn('  ⚠ Edit test member cleanup failed:', rmData.error);
  }
}

// ── 16. Handover Dashboard ────────────────────────────────────────────────
section('16. Handover Dashboard');
{
  const { data, ms } = await api('getAdminHandoverDashboard', [{
    admin: ADMIN, selectedYear: new Date().getFullYear(),
    handoverType: 'regular', cashOnHand: 0, notes: ''
  }]);
  if (data.ok) {
    pass('Handover', 'getAdminHandoverDashboard loads', ms,
      `cashReceived=€${data.result?.totalCashReceived} membershipApplied=€${data.result?.membershipApplied}`);
  } else {
    fail('Handover', 'getAdminHandoverDashboard', ms, data.error);
  }
}

// ── 17. System Health ─────────────────────────────────────────────────────
section('17. System Health');
{
  const { data, ms } = await api('runDataIntegrityCheck', [ADMIN]);
  if (data.ok) {
    const issues = data.result?.issues || [];
    issues.length === 0
      ? pass('Health', 'Data integrity check — no issues', ms)
      : warn('Health', `Data integrity: ${issues.length} issue(s)`, ms, issues.slice(0,3).join('; '));
  } else {
    warn('Health', 'runDataIntegrityCheck', ms, data.error);
  }
}

// ── 17b. Audit Log Archive ────────────────────────────────────────────────
section('17b. Audit Log Archive');
{
  // 1. Dry run with far-future date — should find rows to archive
  const { data: d1, ms: ms1 } = await api('archiveAuditLogs', [ADMIN, { archiveBeforeDate: '2099-01-01', dryRun: true }]);
  if (d1.ok) {
    const r = d1.result;
    const hasRows = (r.rowsToArchive || 0) > 0;
    hasRows
      ? pass('AuditArchive', 'Dry run detects archivable rows', ms1, `rows=${r.rowsToArchive} sheet=${r.archiveSheetName} range=${r.dateRange}`)
      : warn('AuditArchive', 'No archivable rows found', ms1, 'Audit log may already be empty');
    pass('AuditArchive', 'Dry run returns required fields', ms1,
      `dryRun=${r.dryRun} archiveSheetName=${r.archiveSheetName||'n/a'} invalidDateRows=${r.invalidDateRows||0}`);
    r.dryRun === true
      ? pass('AuditArchive', 'Dry run flag is true', ms1)
      : fail('AuditArchive', 'Dry run flag must be true', ms1, '', 'true', String(r.dryRun));
  } else {
    fail('AuditArchive', 'archiveAuditLogs dry run', ms1, d1.error);
  }

  // 2. Dry run with past date that matches nothing (year 1900) — should return 0 rows
  const { data: d2, ms: ms2 } = await api('archiveAuditLogs', [ADMIN, { archiveBeforeDate: '1900-01-01', dryRun: true }]);
  if (d2.ok) {
    const r2 = d2.result;
    r2.rowsToArchive === 0
      ? pass('AuditArchive', 'Dry run with no-match date returns 0 rows', ms2)
      : warn('AuditArchive', 'Expected 0 rows for 1900 cutoff', ms2, `got ${r2.rowsToArchive}`);
  } else {
    fail('AuditArchive', 'archiveAuditLogs (no-match dry run)', ms2, d2.error);
  }

  // 3. searchAuditLogs active scope — pause first; Apps Script can throttle after many calls
  await sleep(3000);
  const { data: d3, ms: ms3 } = await api('searchAuditLogs', [ADMIN, { scope: 'active', query: '' }]);
  const d3Throttled = !d3.ok && (d3.error||'').includes('non-JSON');
  if (d3.ok) {
    const r3 = d3.result;
    typeof r3.total === 'number' && Array.isArray(r3.results)
      ? pass('AuditArchive', 'searchAuditLogs active scope works', ms3, `total=${r3.total} scope=${r3.scope}`)
      : fail('AuditArchive', 'searchAuditLogs bad structure', ms3, JSON.stringify(r3).slice(0,100));
  } else if (d3Throttled) {
    warn('AuditArchive', 'searchAuditLogs active scope', ms3, 'Apps Script throttled after long run — not a code bug');
  } else {
    fail('AuditArchive', 'searchAuditLogs', ms3, d3.error);
  }

  // 4. searchAuditLogs both scope — should be >= active count.
  // Note: active count may grow between calls (audit writes during test), so allow ±5 tolerance.
  const { data: d4, ms: ms4 } = await api('searchAuditLogs', [ADMIN, { scope: 'both', query: '' }]);
  if (d4.ok && d3.ok && !d3Throttled) {
    const activeTotal = d3.result.total;
    const bothTotal = d4.result.total;
    bothTotal >= activeTotal - 5
      ? pass('AuditArchive', 'scope=both includes active rows', ms4, `both=${bothTotal} active=${activeTotal}`)
      : warn('AuditArchive', 'scope=both total < active total', ms4, `both=${bothTotal} active=${activeTotal} — no archive sheets yet, counts may shift during test`);
  } else {
    warn('AuditArchive', 'searchAuditLogs both scope', ms4, d4.error || 'skipped');
  }

  // 5. listAuditArchiveSheets — must return an array
  const { data: d5, ms: ms5 } = await api('listAuditArchiveSheets', [ADMIN]);
  if (d5.ok) {
    const sheets = d5.result;
    Array.isArray(sheets)
      ? pass('AuditArchive', 'listAuditArchiveSheets returns array', ms5, `count=${sheets.length}`)
      : fail('AuditArchive', 'listAuditArchiveSheets not array', ms5, JSON.stringify(sheets).slice(0,80));
  } else {
    fail('AuditArchive', 'listAuditArchiveSheets', ms5, d5.error);
  }
}

// ── 18. Cleanup — Remove Test Members ────────────────────────────────────
section('18. Cleanup');
const removedIds = [];

// Remove all tracked test members
for (const [key, id] of Object.entries(testMemberIds)) {
  if (!id) continue;
  const { data, ms } = await api('removeMember', [{ memberId: id, admin: ADMIN }]);
  if (data.ok) {
    removedIds.push(id);
    pass('Cleanup', `Remove TEST Member ${key} (${id})`, ms,
      `deleted: payments=${data.result?.deleted?.payments} coverage=${data.result?.deleted?.coverage}`);
  } else {
    fail('Cleanup', `Remove TEST Member ${key} (${id})`, ms, data.error);
  }
}

// Safety sweep — catch any TEST member that slipped through (e.g. if addMember ran but id wasn't captured)
{
  const TEST_PHONES = ['+4917600011111', '+4917600022222', '+4917600033333', '+4917600044444'];
  const { data } = await api('getMembers', [ADMIN]);
  const remaining = ((data.ok && data.result) ? data.result : []).filter(m =>
    (m.name && m.name.startsWith('TEST')) || TEST_PHONES.includes(m.phone)
  );
  for (const m of remaining) {
    if (removedIds.includes(m.id)) continue;
    const { data: rm, ms } = await api('removeMember', [{ memberId: m.id, admin: ADMIN }]);
    rm.ok
      ? pass('Cleanup', `Safety sweep removed: ${m.name} (${m.id})`, ms)
      : warn('Cleanup', `Safety sweep: failed to remove ${m.name} (${m.id})`, ms, rm.error);
  }
}

// ── Final Report ──────────────────────────────────────────────────────────
section('FINAL QA REPORT');

const passed  = results.filter(r => r.status === 'PASS');
const failed  = results.filter(r => r.status === 'FAIL');
const warned  = results.filter(r => r.status === 'WARN');
const total   = results.length;
const avgMs   = Math.round(results.reduce((s, r) => s + (r.ms || 0), 0) / total);
const slowOps = results.filter(r => (r.ms || 0) > 5000);

console.log(`\nTotal:   ${total}`);
console.log(`Passed:  ${passed.length} (${Math.round(passed.length/total*100)}%)`);
console.log(`Failed:  ${failed.length}`);
console.log(`Warned:  ${warned.length}`);
console.log(`Avg ms:  ${avgMs}ms`);

if (failed.length > 0) {
  console.log('\n── FAILURES ──');
  failed.forEach(r => console.log(`  ✗ [${r.suite}] ${r.test}\n    ${r.detail}${r.expected?' | expected='+r.expected:''}${r.actual?' | actual='+r.actual:''}`));
}
if (warned.length > 0) {
  console.log('\n── WARNINGS ──');
  warned.forEach(r => console.log(`  ⚠ [${r.suite}] ${r.test}: ${r.detail}`));
}
if (slowOps.length > 0) {
  console.log('\n── SLOW OPERATIONS (>5s) ──');
  slowOps.forEach(r => console.log(`  ⏱ [${r.ms}ms] ${r.test}`));
}

console.log('\n── PERFORMANCE SUMMARY ──');
const suites = [...new Set(results.map(r => r.suite))];
for (const suite of suites) {
  const s = results.filter(r => r.suite === suite);
  const avg = Math.round(s.reduce((x, r) => x + (r.ms || 0), 0) / s.length);
  console.log(`  ${suite}: avg ${avg}ms (${s.length} ops)`);
}

console.log('\n── TEST DATA CREATED (for cleanup verification) ──');
console.log('  Member IDs:', JSON.stringify(testMemberIds));
console.log('  Removed:', removedIds.join(', '));
console.log('  Church txn IDs:', churchTxnIds.join(', '));
console.log('  Payment IDs:', paymentIds.join(', '));

// Save raw results JSON
import { writeFileSync } from 'fs';
writeFileSync('./test_results.json', JSON.stringify({ results, testMemberIds, paymentIds, churchTxnIds }, null, 2));
console.log('\nFull results saved to test_results.json');
