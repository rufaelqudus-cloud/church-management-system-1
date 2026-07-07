# Changelog — Church Management System

---

## [v1.0] — 2026-06-27

### First production release

**Deployment:** `AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd`
**Tests:** 82/82 passing

### Features shipped
- Member management (add, edit, delete, status tracking)
- Membership fee payment recording with multi-year split support
- Monthly coverage tracking per member per year
- Savings deposit, withdrawal, and balance tracking
- PDF receipt generation and WhatsApp sharing
- Admin handover workflow with review, approval, and overview report
- Accounting reconciliation report
- Year-end archive with full archive visibility across all reports
- Dashboard with live totals and yearly Unpaid Members report
- Full payment history search (live + archived)
- Mobile-responsive web interface with Tigrinya language support
- Audit log for all write operations

### Bug fixes
- F-21: Archived payments now included in balance/coverage calculations
- F-03 (stamp): Coverage cache now stamp-validated against payments sheet row count
- F-27: Fee change now invalidates membership funding index cache immediately
- Archive sweep: Reconciliation, search history, and handover overview now include archived payments
- Issue E: Removed dead coverage cache write path (wasted PropertiesService I/O per payment)
- Member cache: Member CacheService entry now evicted on member sheet changes; explicit refresh functions bypass stale cache

### Test suite
- 82 automated tests (FAST + SLOW suites)
- Run via `runAllCmsTests()` in Apps Script editor

---

## [v1.1] — 2026-06-27

### Member demographics

**Tests:** 99/99 passing (17 new)

- Gender (Male/Female) and Birth Date added as required fields for new and edited members
- Members sheet extended to 10 columns (Gender col 9, Birth Date col 10)
- Existing members with blank gender/birth date remain fully compatible
- Age calculated dynamically from birth date — never stored as a fixed value
- New helpers: `calculateAge_`, `ageGroup_`, `genderGreeting_` (en/de/ti), `genderSalutation_`, `filterMembersByGender_`, `filterMembersByAgeGroup_`, `buildMemberDemographics_`
- Dashboard → Settings panel: Demographics section showing gender totals and age group distribution
- Search/history member card: shows gender, birth date, and current age
- WhatsApp receipts: gender-specific greeting (Dear Brother / Dear Sister / ሰላም) when gender is known
- Server-side validation: gender required, birth date not in future, age 0–120 years

---

## [v2.0] — 2026-06-27

### Standalone Vercel PWA

**URL:** https://vercel-app-mu-orpin-97.vercel.app
**Tests:** 103/103 (unchanged — backend unaffected)

**Decision:** v1.0 is frozen on the Apps Script web app URL. The Vercel PWA is a v2.0 initiative requiring significant frontend/backend work.

**Scope:**
- Build standalone Vercel PWA from Sidebar.html
- Implement `doPost(e)` HTTP router in Code.gs to dispatch JSON API calls to existing GAS functions
- Replace all `google.script.run` call sites (~100+) in Sidebar.html with `fetch()` to the Apps Script `/exec` URL
- Security review: authentication tokens, CORS policy, session handling without GAS session context
- Full regression test of every workflow (login, member, payment, savings, receipts, handover, archive, admin, backup)

**Why deferred:**
- `google.script.run` is a GAS-only API; Sidebar.html cannot run on Vercel without a full rewrite of all backend calls
- v1.0 production system is stable and must not be broken
- Estimated effort: 2–4 days of development + full test cycle

**Prerequisites before starting v2.0:**
1. v1.0 running stably in production for a period of time
2. Full backup of spreadsheet and git tag before any Code.gs changes
3. Implement and test `doPost` router on a separate GAS deployment first
4. Run 82/82 tests after every Code.gs change
