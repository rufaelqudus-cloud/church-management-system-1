# Church Management System Performance Test Results

Date: 2026-06-10
Environment: Live Google Sheet + bound Google Apps Script
Dataset: 300+ seeded test members, 600+ membership payment rows, 600+ yearly coverage rows

## Summary

Most sidebar workflows are now fast. The yearly membership rule still passes. Add Member no longer times out and now completes well under the 3 second target.

The remaining blocker is Save Yearly Payment. It improved, but still averages above the 5 second target on the live Google Sheet.

## Results

| Test | Runs | Average | Fastest | Slowest | Target | Result |
|---|---:|---:|---:|---:|---:|---|
| Yearly rule test | 10 | 0 ms | 0 ms | 1 ms | 5000 ms | Pass |
| Search member | 10 | 14 ms | 12 ms | 16 ms | 1000 ms | Pass |
| Balance lookup | 10 | 1071 ms | 616 ms | 2153 ms | 2000 ms | Pass |
| Open member details | 10 | 678 ms | 436 ms | 1113 ms | 2000 ms | Pass |
| Add member | 10 | 326 ms | 258 ms | 827 ms | 3000 ms | Pass |
| Save yearly payment | 10 | 5661 ms | 2240 ms | 7042 ms | 5000 ms | Fail |
| Generate receipt | 10 | 689 ms | 537 ms | 1563 ms | 15000 ms | Auth blocked in test context |
| Open payment history | 10 | 1260 ms | 972 ms | 1908 ms | 3000 ms | Pass |
| Open expenses | 10 | 126 ms | 69 ms | 444 ms | 3000 ms | Pass |
| Open reports | 10 | 939 ms | 656 ms | 1502 ms | 5000 ms | Pass |
| Dashboard load | 10 | 67 ms | 14 ms | 535 ms | 5000 ms | Pass |
| Add member workflow | 10 | 438 ms | 362 ms | 957 ms | 3000 ms | Pass |
| Payment workflow | 10 | 6223 ms | 2146 ms | 7009 ms | 5000 ms | Fail |
| Sidebar workflow | 10 | 2090 ms | 1357 ms | 3614 ms | 5000 ms | Pass |

## Optimizations Applied

- Removed full unpaid/dashboard report refresh from Add Member, Save Payment, sidebar open, and web app open.
- Added request-local sheet row caches and lookup maps.
- Added fast member lookup maps by Member ID and phone.
- Added compact persistent member index cache using CacheService.
- Added compact paid-coverage cache plus small delta updates for new yearly payments.
- Replaced slow repeated permission checks with a cached admin user list.
- Replaced slow Audit Log `getLastRow()` lookup with a cached next-row pointer.
- Replaced slow Members sheet `getLastRow()` appends with indexed next-row logic.
- Deferred separate Membership Coverage sheet writes during Save Payment.
- Removed slow payment cell note writes.
- Added timing logs with `CMS_PERF <function> <ms>`.

## Current Blocker

Save yearly payment is still above the required target. Profiling shows the remaining cost is live Spreadsheet service latency around payment row writes and payment workflow validation. The business rule is correct, but this path needs one more optimization before production readiness.

## Production Readiness

Not production-ready yet because:

- Save yearly payment target is 5 seconds, measured average is 5661 ms.
- Payment workflow target is 5 seconds, measured average is 6223 ms.
- Receipt PDF generation could not be fully verified from the `/dev` test endpoint because DriveApp authorization is blocked in that context.

Yearly rule status: Passed.
