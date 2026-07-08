# Production Checklist — Church Management System

---

## Backup Procedure

Run before every deployment and at end of each month.

1. Open the spreadsheet: https://docs.google.com/spreadsheets/d/12x32vf_Wo3INDKbjjYAwAGZesrEpeZVOGRiwYmJy6-8/edit
2. File → Download → Microsoft Excel (.xlsx) — save with date in filename, e.g. `cms_backup_2026-06-27.xlsx`
3. Also: File → Make a copy → name it `CMS Backup YYYY-MM-DD` — keeps it in Google Drive with full formula fidelity
4. Store both copies in a secure location (e.g. church admin Google Drive folder, not shared publicly)

Frequency: before every code push, and on the 1st of each month.

---

## Restore Procedure

If data is accidentally deleted or corrupted:

### From Google Drive copy (preferred)
1. Open the backup copy in Google Drive
2. Verify the data is intact
3. Copy the affected sheet(s) back to the production spreadsheet manually, or rename the backup copy to replace production

### From .xlsx backup
1. Open the .xlsx file
2. Identify which sheet(s) are affected
3. Copy the data rows back into the corresponding production sheet

### From Apps Script Version History
1. Open Apps Script editor: https://script.google.com/u/0/home/projects/19K32b86oqjLGs1uVXTRCUXc8-036aE2IsO7up_VKZayXQnnByVSEXNAo/edit
2. File → See version history (for script code only — does not restore sheet data)

---

## Pre-Deployment Checklist

Before every `clasp push`:

- [ ] Take a spreadsheet backup (see above)
- [ ] Confirm git working tree is clean: `git status`
- [ ] Run all automated tests: `runAllCmsTests()` in Apps Script editor — must show **82/82 passed** (or current total)
- [ ] Review the diff: `git diff` — confirm no unintended changes
- [ ] Confirm no TODO, FIXME, or debug-only console.log added
- [ ] Confirm business logic is unchanged if this is a non-logic change

---

## Deployment Checklist

1. Ensure clasp is authenticated as `fre08gb@gmail.com`: `clasp login`
2. Navigate to script directory: `cd cms_bound_script`
3. Push code: `clasp push`
4. Confirm push succeeded with no errors
5. Open Apps Script editor and run `runAllCmsTests()` — verify all tests still pass
6. If tests fail: revert immediately (see Emergency Rollback)

**Do not create a new deployment** unless you need to change access settings. The existing deployment at `AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd` runs the latest pushed code automatically.

---

## Post-Deployment Verification

After every push:

- [ ] Open the web app URL and confirm it loads: https://script.google.com/macros/s/AKfycbygcn_QN-VmeoXsxi0_VxLpwH8lY1HKbh-uBy6u_oS3FgqFGjcmF6AhrLeNnUfqYDwd/exec
- [ ] Check the deployment version shown in the app footer/health check matches `@232` (or updated value)
- [ ] Run one smoke test: add a test member, verify it appears, then delete it
- [ ] Check the Dashboard tab loads with correct totals
- [ ] Confirm the Unpaid Members sheet refreshes correctly

---

## Emergency Rollback Steps

If a push introduces a bug and must be reverted immediately:

1. Identify the last known-good git tag or commit: `git log --oneline`
2. Check out that version: `git checkout v1.0 -- cms_bound_script/Code.gs cms_bound_script/Tests.gs cms_bound_script/Sidebar.html cms_bound_script/ReceiptTemplate.html`
3. Push the reverted code: `cd cms_bound_script && clasp push`
4. Verify the web app loads and tests pass
5. Commit the revert on a new branch if needed for record-keeping

The production deployment picks up the new push immediately — no redeployment needed.

---

## Monthly Maintenance

- [ ] Take a dated backup of the spreadsheet
- [ ] Run `runAllCmsTests()` to confirm system health
- [ ] Review the Audit Log sheet for any anomalies
- [ ] Check for members whose annual fee has not been paid
- [ ] Run year-end archive in December before the new year begins
