# Church Management System Disaster Recovery Guide

This guide explains how church administrators can restore the Church Management System if the production Google Sheet is damaged, deleted, or corrupted.

## Current Production Details

- Production spreadsheet ID: `1CeQauN8c4jg3nU2W62mwRFdAjf_938RLoDfLXSM2MfA`
- Backup folder: `Church Management System Backups`
- Backup folder URL: `https://drive.google.com/drive/folders/1sRlivEkV2pzF5ouuwYICWiJNfDO01BAY`
- Current Apps Script web app endpoint:
  `https://script.google.com/macros/s/AKfycbyo2YYzuFba7MTm8gxPPT1Y-OtFwLvwctuRlxNxXfqnKIc82J44UflTOzmzMc-U8WPB/exec`
- Public mobile app URL: `https://mobilefallback.vercel.app`

## Which Backup To Use First

Always use the full spreadsheet backup copy first.

The spreadsheet copy preserves the sheet structure, formulas, formatting, settings tabs, admin accounts, user roles, fee history, reports, and all system tables together.

Use CSV exports only when:

- You need to recover one table or a few rows manually.
- The full spreadsheet backup copy is unavailable.
- A technical administrator specifically chooses a partial import.

CSV exports are not the preferred full-system restore method because they do not preserve formulas, formatting, Apps Script bindings, menus, protected ranges, charts, or configuration behavior.

## Before Restoring

1. Stop all data entry immediately.
2. Tell admins not to use the sidebar or mobile app until recovery is complete.
3. Open the backup folder:
   `https://drive.google.com/drive/folders/1sRlivEkV2pzF5ouuwYICWiJNfDO01BAY`
4. Choose the newest backup created before the damage happened.
5. Confirm the backup opens and contains the expected sheets, especially:
   - Members
   - Payments
   - Yearly Coverage
   - Receipts
   - Expenses
   - Audit Log
   - Settings
   - Membership Fee History
   - User Roles
   - Admin Accounts

## Scenario A: Production Spreadsheet Still Exists

Use this when the original production spreadsheet still exists but rows, formulas, or tabs were damaged.

This is the safest restore path because the production spreadsheet ID does not change, so the current Apps Script deployment and mobile app endpoint can usually remain unchanged.

1. Open the damaged production spreadsheet.
2. Create one extra safety copy before touching it:
   - File > Make a copy
   - Name it `PRE-RESTORE damaged copy - YYYY-MM-DD HH:mm`
3. Open the selected backup spreadsheet copy.
4. For each damaged data sheet, copy the backup sheet contents back into the production spreadsheet.
5. Preserve system sheets and formulas carefully. If a whole tab is damaged, copy the whole tab from backup rather than manually pasting values.
6. Do not delete or rename required system tabs.
7. After restoring, open Extensions > Apps Script from the production spreadsheet.
8. Run or call the system health check.
9. Confirm:
   - Spreadsheet can be opened.
   - Required sheet names are found.
   - Admin login works.
   - Dashboard loads.
   - Add Member works.
   - Add Payment works.
   - Mobile app login works.

If the production spreadsheet ID did not change, the mobile app does not need to be reconnected.

## Scenario B: Production Spreadsheet Was Deleted Or Cannot Be Repaired

Use this when the original production spreadsheet is gone, inaccessible, or too corrupted to safely repair.

1. Open the backup folder:
   `https://drive.google.com/drive/folders/1sRlivEkV2pzF5ouuwYICWiJNfDO01BAY`
2. Open the newest good full spreadsheet backup.
3. Rename it clearly, for example:
   `Church Management System - PRODUCTION RESTORED - YYYY-MM-DD`
4. Move it to the church production Drive location.
5. Copy the restored spreadsheet ID from its URL.
   - Example URL format:
     `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
6. Open Extensions > Apps Script from the restored spreadsheet.
7. Confirm the script project opens.
8. Update the script so the production spreadsheet ID points to the restored spreadsheet.

In the current code this value is:

```javascript
const CMS_SPREADSHEET_ID = "1CeQauN8c4jg3nU2W62mwRFdAjf_938RLoDfLXSM2MfA";
```

Replace it with the restored spreadsheet ID.

9. Save the Apps Script project.
10. Run the authorization/health check function from Apps Script.
11. Redeploy the web app:
    - Deploy > Manage deployments
    - Edit the web app deployment, or create a new deployment
    - Execute as: `Me`
    - Access: match the current production setting
    - Deploy
12. Copy the new `/exec` URL.
13. Test the new `/exec` URL with the health check before reconnecting mobile.

## Reconnecting Apps Script

Apps Script must point at the restored spreadsheet ID.

If using the Apps Script editor:

1. Open the restored spreadsheet.
2. Go to Extensions > Apps Script.
3. Find `CMS_SPREADSHEET_ID` in `Code.gs`.
4. Replace the old spreadsheet ID with the restored spreadsheet ID.
5. Save.
6. Deploy the web app again.
7. Confirm deployment settings:
   - Execute as: `Me`
   - Access: same as the existing production design
8. Run the health check.

If using local `clasp`:

```bash
cd /Users/mussiekifleyesus/Desktop/church-management-system/cms_bound_script
npx clasp push -f
npx clasp deploy --description "Restore production spreadsheet connection"
```

Then copy the new Apps Script `/exec` URL from the deployment output.

## Reconnecting The Mobile App

Only reconnect the mobile app if the Apps Script `/exec` URL changed.

Update both files:

- `/Users/mussiekifleyesus/Documents/Codex/2026-06-04/files-mentioned-by-the-user-kidus/mobile_fallback/index.html`
- `/Users/mussiekifleyesus/Documents/Codex/2026-06-04/files-mentioned-by-the-user-kidus/mobile_fallback/api/cms.js`

Replace the old Apps Script `/exec` URL with the new one.

Then redeploy the mobile app:

```bash
cd /Users/mussiekifleyesus/Documents/Codex/2026-06-04/files-mentioned-by-the-user-kidus/mobile_fallback
npx vercel --prod --yes
```

After deployment, test:

- `https://mobilefallback.vercel.app`
- Login
- Dashboard
- Search Member
- Add Member
- Add Yearly Payment
- Receipt link
- WhatsApp receipt link

## Restore Verification Checklist

Do not reopen the system for normal use until all checks pass.

1. Google Sheet opens under the church account.
2. Required sheets exist.
3. Settings, Membership Fee History, User Roles, and Admin Accounts exist.
4. Apps Script opens from Extensions > Apps Script.
5. Web app deployment works.
6. Health check reports the spreadsheet can be opened.
7. Sidebar opens.
8. Super Admin can log in.
9. Dashboard loads.
10. Add Member works.
11. Search Member works.
12. Add Yearly Payment works.
13. Receipt generation works.
14. WhatsApp receipt link works.
15. Mobile app logs in.
16. Mobile app points to the correct `/exec` endpoint.
17. Audit Log records the restore activity.
18. Create a fresh backup immediately after the restore is confirmed.

## Emergency Rule

If there is uncertainty, do not delete anything.

Make a copy first, restore from the newest good full spreadsheet backup, test with the health check, then reconnect Apps Script and mobile only if the spreadsheet ID or Apps Script deployment URL changed.

