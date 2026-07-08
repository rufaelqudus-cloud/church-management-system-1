# Church Management System — Release Notes v1.0

**Release date:** 2026-06-27
**Deployment version constant:** `@232`
**Web App URL:** https://script.google.com/macros/s/AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd/exec
**Spreadsheet:** https://docs.google.com/spreadsheets/d/12x32vf_Wo3INDKbjjYAwAGZesrEpeZVOGRiwYmJy6-8/edit

---

## Overview

First production release of the St. Michael Church Wuppertal membership and finance management system. Built as a Google Apps Script web application bound to a Google Sheet. Designed for church administrators to manage members, payments, savings, receipts, reporting, and archiving — entirely from a mobile-friendly web interface.

---

## Major Features

### Membership
- Add, edit, and delete members
- Membership status tracking (Active, Inactive, Deceased)
- Monthly/annual fee coverage tracking per member per year
- Unpaid members report with auto-refresh

### Payments & Finance
- Record membership payments, savings deposits, and cash conversions
- Automatic monthly fee coverage calculation
- Multi-year payment splitting when fee changes between years
- Accounting reconciliation report (income vs. expenses)
- Full archive visibility — historical payments visible across all reports

### Savings
- Per-member savings balance tracking
- Savings deposit and withdrawal recording
- Balance-due calculation accounting for overpayments

### Receipts
- PDF receipt generation per payment
- WhatsApp-ready receipt sharing
- Receipt re-generation from history

### Handover & Audit
- Admin handover workflow with review and approval steps
- Full audit log for all write operations
- Handover overview report spanning live and archived data

### Dashboard
- Live dashboard totals (members, payments, savings, arrears)
- Year-over-year summary
- Yearly Unpaid Members sheet auto-rebuild

### Archive
- Year-end archive of payments, church transactions, and handovers
- All read/report paths include archived data

### Search & History
- Full payment history search across live and archived sheets
- Member-level payment and coverage history

### Mobile Interface
- Responsive sidebar web app served via Apps Script deployment
- Tigrinya (ትግርኛ) language support via `/ti.json` on `mobilefallback.vercel.app`
- PWA-ready icon hosted on `mobilefallback.vercel.app`

---

## Architecture Summary

| Layer | Technology |
|---|---|
| Runtime | Google Apps Script V8 |
| Database | Google Sheets (bound spreadsheet) |
| UI | HTML/CSS/JS sidebar served as standalone web app |
| Caching | CacheService (document-scoped, 10-min TTL) + in-process object cache |
| Properties | PropertiesService for delta buffers and config |
| Locking | LockService document lock for all write operations |
| Push tool | clasp CLI (push account: fre08gb@gmail.com) |
| Static assets | Vercel (`mobilefallback.vercel.app`) |

**Code size:** ~7,776 lines (Code.gs) + ~1,253 lines (Tests.gs) = ~9,029 lines total

---

## Bugs Fixed During v1.0 Campaign

| ID | Description | Area |
|---|---|---|
| F-21 | `membershipPaymentsForMember_` used `currentDataRows_` — archived payments invisible to balance/coverage calculations | Archive visibility |
| F-03 / stamp | `cachedPaidCoverageIndex_` had no stamp validation — stale cache could survive payment sheet changes | Cache integrity |
| F-27 | Fee change via `updateMembershipFee` did not invalidate funding index cache — previews could show wrong fee split after a fee change | Cache invalidation |
| Archive sweep | `accountingReconciliation_` (both loops) and `searchHistory` used `currentDataRows_` — archived payments invisible to reconciliation and search | Archive visibility |
| Issue A | `buildAllAdminHandoverOverview_` used `currentDataRows_` — archived payments invisible to handover reports | Archive visibility |
| Issue E | `updateCachedPaidCoverage_` and `appendPaidCoverageDelta_` wrote to `CMS_PAID_COVERAGE_DELTA` on every payment but `putCachedPaidCoverageIndex_` had no callers — dead write path wasting PropertiesService I/O per payment | Dead code cleanup |
| Member cache | `invalidateFastCaches_` did not evict `members:index:v2` from CacheService on member sheet changes — Unpaid Members sheet could show stale members after explicit refresh | Cache eviction |

---

## Test Status

**82 / 82 automated tests passing**

- FAST tests: pure in-memory logic (no sheet I/O)
- SLOW tests: read Config sheet for fee history

Run via Apps Script editor: `runAllCmsTests()`

---

## Deployment Information

| Item | Value |
|---|---|
| Script ID | `19K32b86oqjLGs1uVXTRCUXc8-036aE2IsO7up_VKZayXQnnByVSEXNAo` |
| Deployment ID | `AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd` |
| Web App URL | https://script.google.com/macros/s/AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd/exec |
| Spreadsheet ID | `12x32vf_Wo3INDKbjjYAwAGZesrEpeZVOGRiwYmJy6-8` |
| Spreadsheet account | stmichaelwuppertal@gmail.com |
| clasp push account | fre08gb@gmail.com |
| Deployment version | `@232` |

---

## Known Limitations

- **No offline mode.** Requires internet access to Google's servers.
- **Single-user write lock.** Concurrent write operations by two admins simultaneously will queue (LockService). This is correct and intentional — the system is designed for a single active admin at a time.
- **CacheService TTL.** Document cache entries expire after 10 minutes. High-frequency reads within that window are fast; the first read after expiry hits the sheet.
- **`putCachedPaidCoverageIndex_` not yet wired.** The paid coverage cache write helper exists and is stamp-safe but has no active callers. Coverage is rebuilt from sheet on cache miss. This is safe and correct; activating the write path is a future optimization.
- **No automated backup.** Backup is a manual step (Google Sheets export). See `PRODUCTION_CHECKLIST.md`.
- **Apps Script quotas.** Google enforces daily execution time and trigger limits. Not expected to be a constraint at this church's scale.
