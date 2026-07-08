const SHEETS = {
  members: "ኣባላትና",
  payments: "ክፍሊት ኣባልነት",
  servicePayments: "ክፍሊት ኣገልጉሎት",
  savingsBalance: "Savings Balance",
  savingsHistory: "Savings History",
  savingsConversionLog: "Auto Conversion Log",
  handovers: "Handovers",
  overallHandovers: "Overall Handovers",
  transactionCategories: "Transaction Categories",
  churchTransactions: "Church Transactions",
  materialInventory: "Material Inventory",
  materialMovementLog: "Material Movement Log",
  coverage: "Membership Coverage",
  expenses: "ወጻኢታት",
  nonMembers: "ኣባላት ዘይኮኑ",
  dashboard: "ቆላሕታ",
  audit: "Audit Log",
  receipts: "Receipts",
  monthlyReports: "Monthly Reports",
  unpaidMembers: "ዘይከፈሉ ኣባላት",
  config: "_System Config",
  reminderLog: "Unpaid Reminder Log"
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHEET_ALIASES = {
  "ኣባላትና": ["Members"],
  "ክፍሊት ኣባልነት": ["Membership Payments", "Monthly Payments"],
  "ክፍሊት ኣገልጉሎት": ["Service Payments"],
  "Membership Coverage": ["Coverage", "Membership Coverage"],
  "ወጻኢታት": ["Expenses"],
  "ኣባላት ዘይኮኑ": ["Non Members", "Non-Members", "Donors"],
  "ቆላሕታ": ["Dashboard"]
};
const MANUAL_EDIT_GUARDED_SHEETS = [SHEETS.members, SHEETS.nonMembers, SHEETS.payments, SHEETS.servicePayments, SHEETS.savingsBalance, SHEETS.savingsHistory, SHEETS.savingsConversionLog, SHEETS.handovers, SHEETS.overallHandovers, SHEETS.transactionCategories, SHEETS.churchTransactions, SHEETS.materialInventory, SHEETS.materialMovementLog, SHEETS.coverage, SHEETS.expenses, "Members", "Non Members", "Non-Members", "Membership Payments", "Service Payments", "Expenses"];
const FORMULA_VIEW_SHEETS = [SHEETS.dashboard, "Dashboard", "ናይ ኣባል ጸብጻብ", SHEETS.unpaidMembers, "Setup Notes", SHEETS.audit, SHEETS.receipts, SHEETS.monthlyReports];
const CMS_GUARDED_SHEETS = MANUAL_EDIT_GUARDED_SHEETS.concat(FORMULA_VIEW_SHEETS);
const BACKUP_DATA_SHEETS = [SHEETS.members, SHEETS.nonMembers, SHEETS.payments, SHEETS.servicePayments, SHEETS.savingsBalance, SHEETS.savingsHistory, SHEETS.savingsConversionLog, SHEETS.handovers, SHEETS.overallHandovers, SHEETS.transactionCategories, SHEETS.churchTransactions, SHEETS.materialInventory, SHEETS.materialMovementLog, SHEETS.coverage, SHEETS.expenses, SHEETS.audit, SHEETS.receipts, SHEETS.monthlyReports];
const BACKUP_FOLDER_NAME = "Church Management System Backups";
const BACKUP_RETENTION_LIMIT = 30;
const DASHBOARD_SUMMARY_CACHE_KEY = "dashboard:summary:v5";
const DASHBOARD_CACHE_PROPS_KEY = "CMS_DASHBOARD_CACHE_V5";
const DASHBOARD_CACHE_VERSION = 5;
const MEMBERSHIP_FUNDING_CACHE_KEY = "membership:funding:v2";
const MEMBERSHIP_FUNDING_MANIFEST_KEY = "CMS_FUNDING_MANIFEST_V2";
const MEMBERSHIP_FUNDING_MEMBER_CHUNK_PREFIX = "CMS_FUNDING_MEMBERS_V2_";
const MEMBERSHIP_FUNDING_DATA_CHUNK_PREFIX = "CMS_FUNDING_DATA_V2_";
const MEMBERSHIP_FUNDING_MEMBERS_PER_CHUNK = 250;
const MEMBERSHIP_FUNDING_ROWS_PER_CHUNK = 350;
const CHURCH_NAME = "St.Rufael Church";
const CHURCH_SYSTEM_NAME = CHURCH_NAME + " Wuppertal Management System";
const CHURCH_LOGO_URL = "https://mobilefallback.vercel.app/icons/icon-192.png?v=73";
const CMS_SPREADSHEET_ID = "1CeQauN8c4jg3nU2W62mwRFdAjf_938RLoDfLXSM2MfA";
const CMS_DEPLOYMENT_VERSION = "@232";
const PDF_BIBLE_VERSE_TI = "ኣብ ቤተይ ምግቢ ኪኸውንሲ፣ ዕሽር ዘበለ ዅሉ ናብ ቤት መዝገብ ኣምጽእዎ፣ ሽዑ መሳዅቲ ሰማይ እንተ ዘይከፊተልኩም፣ በረኸት ድማ ብዘይ ልክዕ እንተ ዘየፍሲሰልኩም፣ በዚ ተዐዘቡኒ፣ ይብል እግዚኣብሄር ጐይታ ሰራዊት።";
const PDF_BIBLE_REFERENCE_TI = "ሚልክያስ 3፣10";
const VERCEL_API_SECRET = "bvc4dItgJSS2FttZrHVAYK214N5OqtReN5vje5SSDmUQDIft";
const REMINDER_COOLDOWN_DAYS = 90;
const REMINDER_LOG_HEADERS = ["Timestamp", "Member ID", "Member Name", "Phone", "Years Unpaid", "Balance Due", "Admin", "Message Text", "Next Allowed Date"];
const WRITE_LOCK_WAIT_MS = 12000;
const WRITE_LOCK_BUSY_MESSAGE = "The system is still finishing another save. Please wait 10-20 seconds and try again.";
const DEFAULT_MONTHLY_FEE = 5;
const MEMBERSHIP_FEE_2026_MONTHLY = 15;
const MEMBERSHIP_FEE_2026_EFFECTIVE_DATE = new Date(2026, 0, 1);
const ROLES = {
  superAdmin: "Super Admin",
  treasurer: "Treasurer",
  admin: "Admin",
  secretary: "Secretary",
  editor: "Editor",
  viewer: "Viewer / Auditor"
};
const PAYMENT_HEADERS = [
  "Transaction ID", "Date", "Member ID", "Member Name", "Payment Type", "Year", "Amount", "Reason", "Method", "Recorded By", "Notes",
  "Receipt Generated", "Receipt Sent", "Receipt Sent Date", "Receipt Link", "Transaction Type", "Handover ID", "Handover Status"
];
const EXPENSE_HEADERS = ["Expense Date", "Category", "Description", "Amount", "Recorded By", "Notes", "Paid From Collected Cash", "Transaction ID", "Handover ID", "Handover Status"];
const TRANSACTION_CATEGORY_HEADERS = ["Category ID", "Transaction Type", "Category Name", "Tigrinya Name", "Active", "Requires Member", "Requires Receipt", "Notes"];
const CHURCH_TRANSACTION_HEADERS = ["Transaction ID", "Date", "Transaction Type", "Category ID", "Category Name", "Tigrinya Name", "Member/Donor ID", "Member/Donor Name", "Amount", "Payment Method", "Paid From Collected Cash", "Requires Receipt", "Receipt Link", "Evidence Link", "Item ID", "Item Name", "Quantity", "Recorded By", "Notes", "Handover ID", "Handover Status", "Status"];
const MATERIAL_INVENTORY_HEADERS = ["Item ID", "Item Name", "Category", "Quantity Received", "Quantity Remaining", "Estimated Value", "Status", "Donor Name", "Received Date", "Last Updated", "Notes"];
const MATERIAL_MOVEMENT_HEADERS = ["Movement ID", "Date", "Item ID", "Item Name", "Action Type", "Quantity Changed", "Quantity Before", "Quantity After", "Recorded By", "Notes"];
const HANDOVER_HEADERS = ["Handover ID", "Admin", "Receiver", "Confirmed Date/Time", "Start Date", "End Date", "Cash Collected", "Bank Transfers", "Deductible Expenses", "Cash Handed Over", "Transaction Count", "Expense Count", "PDF Link", "Notes", "Status", "Expected Cash", "Actual Cash Handed Over", "Difference", "Outstanding Before", "Outstanding Remaining", "Overall Handover ID", "Overall Status", "Official Cash Received", "Official Outstanding Remaining"];
const OVERALL_HANDOVER_HEADERS = ["Overall Handover ID", "Meeting Date", "Super Admin", "Admin", "Admin Handover IDs", "Membership Income", "Service Income", "Material Sale Income", "Other Income", "Expenses From Cash", "Bank Transfers", "Expected Cash", "Previous Outstanding", "Total Responsibility", "Cash Received", "Confirmation Status", "Remaining Unpaid", "PDF Link", "Notes", "Created Date"];
const AUDIT_HEADERS = ["Date/Time", "Action", "Sheet", "Record ID", "User", "Reason", "Old Value", "New Value"];
const RECEIPT_HEADERS = ["Receipt ID", "Date", "Member ID", "Member Name", "Type", "Period", "Year", "Amount", "Method", "Recorded By", "Receipt Link", "Generated Date", "Sent", "Sent Date", "Status", "Status Date"];
const FEE_HISTORY_HEADERS = ["Date", "Old Fee", "New Fee", "Admin", "Reason"];
const IDEMPOTENCY_SHEET = "_Idempotency";
const IDEMPOTENCY_HEADERS = ["Request ID", "Action", "Status", "Result JSON", "Error Message", "Created At", "Updated At", "Actor"];
const IDEMPOTENCY_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;
const STRUCTURE_PROTECTED_SHEETS = [SHEETS.config, SHEETS.transactionCategories, "Membership Fee History"];
const SYSTEM_REQUIRED_HEADERS = {};
SYSTEM_REQUIRED_HEADERS[SHEETS.members] = ["Member ID", "Full Name", "Phone Number"];
SYSTEM_REQUIRED_HEADERS[SHEETS.payments] = PAYMENT_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.receipts] = RECEIPT_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.churchTransactions] = CHURCH_TRANSACTION_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.handovers] = HANDOVER_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.overallHandovers] = OVERALL_HANDOVER_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.materialInventory] = MATERIAL_INVENTORY_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.materialMovementLog] = MATERIAL_MOVEMENT_HEADERS;
SYSTEM_REQUIRED_HEADERS[SHEETS.audit] = AUDIT_HEADERS;
const CMS_PROTECTION_EDITORS = [
  "mus44teklu@gmail.com",
  "sekidfg@gmail.com",
  "emamar787@gmail.com",
  "eritrean.orthodox.wuppertal@gmail.com"
];
var CMS_DATA_CONTEXT_ = {};

// ─── Request-level document properties batch ────────────────────────────────
// GAS charges one RPC per getProperty() call. For requests that read 5–15
// properties across sheets and caches, that adds up. docProps_() loads ALL
// document properties once per request via getProperties() and stores the
// result in CMS_DATA_CONTEXT_. Every subsequent read is a free dict lookup.
// Writes (docPropSet_) update both PropertiesService and the in-request dict
// so reads later in the same request see the new value immediately.
const DOC_PROPS_BATCH_KEY_ = "docProps:batch";

function docProps_() {
  if (CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_]) return CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_] = PropertiesService.getDocumentProperties().getProperties();
  return CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
}

function docProp_(key) {
  const val = docProps_()[key];
  return val != null ? val : null;
}

function docPropSet_(key, value) {
  PropertiesService.getDocumentProperties().setProperty(key, value);
  const ctx = CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  if (ctx) ctx[key] = value;
}

function docPropDel_(key) {
  PropertiesService.getDocumentProperties().deleteProperty(key);
  const ctx = CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  if (ctx) delete ctx[key];
}
// ────────────────────────────────────────────────────────────────────────────

function onOpen() {
  addChurchManagementMenu_();
  runStartupMaintenance_({ refreshDashboard: false, source: "onOpen" });
}

function runStartupMaintenance_(options) {
  const config = options || {};
  const results = [];
  const runStep = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      results.push({ name, ok: false, message });
      console.log("Startup maintenance step failed (" + name + "): " + message);
    }
  };
  runStep("ensureAdminCredentials", ensureAdminCredentials_);
  runStep("normalizePaymentSheetHeaders", normalizePaymentSheetHeaders_);
  runStep("normalizeYearlyMembershipSheetViews", normalizeYearlyMembershipSheetViews_);
  runStep("normalizeExpenseSheetHeaders", normalizeExpenseSheetHeaders_);
  runStep("ensureTransactionInfrastructure", ensureTransactionInfrastructure_);
  if (config.refreshDashboard) {
    runStep("refreshDashboardLiveTotals", () => refreshDashboardLiveTotals_(buildLiveDashboardTotals_()));
  }
  return { ok: results.every(item => item.ok), source: config.source || "", results };
}

function runStartupMaintenanceManual() {
  return runStartupMaintenance_({ refreshDashboard: true, source: "manual" });
}

function ensureIdempotencySheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(IDEMPOTENCY_SHEET);
  if (!sh) {
    sh = ss.insertSheet(IDEMPOTENCY_SHEET);
    sh.hideSheet();
  }
  sh.getRange(1, 1).setValue(IDEMPOTENCY_SHEET);
  sh.getRange(2, 1, 1, IDEMPOTENCY_HEADERS.length).setValues([IDEMPOTENCY_HEADERS]);
  sh.setFrozenRows(2);
  try {
    sh.hideSheet();
  } catch (err) {
    // If the sheet is already hidden or cannot be hidden, idempotency still works.
  }
  return sh;
}

function normalizeRequestId_(requestId) {
  return clean_(requestId).replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 120);
}

function withIdempotency_(action, requestId, actor, callback) {
  const id = normalizeRequestId_(requestId);
  if (!id) return callback();
  const sh = ensureIdempotencySheet_();
  const now = new Date();
  const row = findIdempotencyRow_(sh, id, action);
  if (row.rowNumber) {
    if (row.status === "Completed") {
      const replay = parseIdempotencyResult_(row.resultJson);
      if (replay && typeof replay === "object") replay.idempotentReplay = true;
      return replay;
    }
    if (row.status === "Processing") {
      const updated = coerceDate_(row.updatedAt) || coerceDate_(row.createdAt);
      const age = updated ? now.getTime() - updated.getTime() : 0;
      if (age < IDEMPOTENCY_PROCESSING_TIMEOUT_MS) {
        throw new Error("This save is still being processed. Please wait a few seconds and check history before retrying.");
      }
    }
    sh.getRange(row.rowNumber, 3, 1, 6).setValues([["Processing", "", "", row.createdAt || now, now, clean_(actor)]]);
  } else {
    sh.appendRow([id, action, "Processing", "", "", now, now, clean_(actor)]);
  }
  const activeRow = row.rowNumber || sh.getLastRow();
  try {
    const result = callback();
    const compact = compactIdempotencyResult_(action, result);
    sh.getRange(activeRow, 3, 1, 6).setValues([["Completed", safeIdempotencyJson_(compact), "", row.createdAt || now, new Date(), clean_(actor)]]);
    return result;
  } catch (err) {
    sh.getRange(activeRow, 3, 1, 6).setValues([["Failed", "", err && err.message ? err.message : String(err), row.createdAt || now, new Date(), clean_(actor)]]);
    throw err;
  }
}

function findIdempotencyRow_(sh, requestId, action) {
  const last = sh.getLastRow();
  if (last < 3) return { rowNumber: 0 };
  const rows = sh.getRange(3, 1, last - 2, IDEMPOTENCY_HEADERS.length).getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (clean_(rows[i][0]) === requestId && clean_(rows[i][1]) === action) {
      return {
        rowNumber: i + 3,
        requestId: clean_(rows[i][0]),
        action: clean_(rows[i][1]),
        status: clean_(rows[i][2]),
        resultJson: clean_(rows[i][3]),
        errorMessage: clean_(rows[i][4]),
        createdAt: rows[i][5],
        updatedAt: rows[i][6],
        actor: clean_(rows[i][7])
      };
    }
  }
  return { rowNumber: 0 };
}

function parseIdempotencyResult_(json) {
  try {
    return JSON.parse(clean_(json) || "{}");
  } catch (err) {
    throw new Error("This save was already processed, but the saved response could not be read. Please check history before retrying.");
  }
}

function safeIdempotencyJson_(value) {
  let json = JSON.stringify(value || {});
  if (json.length > 45000) {
    json = JSON.stringify({ ok: true, idempotencyResultTruncated: true, id: value && value.id, transactionId: value && value.transactionId, handoverId: value && value.handoverId, overallHandoverId: value && value.overallHandoverId, pdfUrl: value && value.pdfUrl });
  }
  return json;
}

function compactIdempotencyResult_(action, result) {
  const r = result || {};
  if (action === "addMember") return { ok: r.ok, id: r.id, duplicateWarning: r.duplicateWarning, duplicates: r.duplicates || [] };
  if (action === "addPayment") return {
    ok: r.ok,
    id: r.id,
    transactionIds: r.transactionIds || [],
    receiptId: r.receiptId,
    receiptUrl: r.receiptUrl || "",
    receiptError: r.receiptError || "",
    whatsappUrl: r.whatsappUrl || "",
    memberPhone: r.memberPhone || "",
    monthLabel: r.monthLabel || "",
    total: r.total,
    membershipTotal: r.membershipTotal,
    savingsUsedAmount: r.savingsUsedAmount,
    extraSavedAsSavings: r.extraSavedAsSavings,
    extraSavingsAmount: r.extraSavingsAmount,
    savingsBalance: r.savingsBalance,
    converted: r.converted,
    conversion: r.conversion || null,
    conversions: r.conversions || [],
    sheetName: r.sheetName
  };
  if (action === "addChurchTransaction") return { ok: r.ok, id: r.id, transactionId: r.transactionId, type: r.type, category: r.category, itemId: r.itemId, itemName: r.itemName, quantity: r.quantity };
  if (action === "recordMaterialMovement") return { ok: r.ok, itemId: r.itemId, actionType: r.actionType, quantity: r.quantity, quantityBefore: r.quantityBefore, quantityAfter: r.quantityAfter, status: r.status, saleTransaction: r.saleTransaction || null };
  if (action === "addExpense") return { ok: r.ok, id: r.id, paidFromCollectedCash: r.paidFromCollectedCash };
  if (action === "confirmAdminHandover") return { ok: r.ok, handoverId: r.handoverId, pdfUrl: r.pdfUrl, summary: r.summary || {} };
  if (action === "confirmOverallHandover") return { ok: r.ok, overallHandoverId: r.overallHandoverId, pdfUrl: r.pdfUrl, grandTotals: r.grandTotals || {} };
  return r;
}

function addChurchManagementMenu_() {
  SpreadsheetApp.getUi()
    .createMenu("Church Management System")
    .addItem("Open Sidebar", "openSidebar")
    .addItem("Refresh Dashboard", "refreshDashboardLiveTotals")
    .addItem("Refresh Yearly Unpaid Members", "refreshYearlyUnpaidMembersSheet")
    .addSeparator()
    .addItem("Add / Update Admin", "addOrUpdateAdminUser")
    .addItem("Reset Main Admin Login", "resetAdminLogin")
    .addItem("Open Admin Management", "openAdminManagement")
    .addSeparator()
    .addItem("Create Backup Now", "createBackupNow")
    .addItem("Enable Daily Backup", "installDailyBackup")
    .addSeparator()
    .addItem("Apply Data Protection", "applyCmsProtections")
    .addItem("Allow Manual Editing for 15 Minutes", "temporarilyAllowManualEdits")
    .addItem("Lock Manual Editing Again", "blockManualEdits")
    .addToUi();
}

function refreshDashboardLiveTotals() {
  clearCachedMemberList_();
  const live = buildLiveDashboardTotals_();
  clearDashboardSummaryCache_();
  refreshDashboardLiveTotals_(live);
  return live;
}

function onEdit(e) {
  try {
    guardManualDataEdit_(e);
  } catch (err) {
    try {
      SpreadsheetApp.getActive().toast(err.message || String(err), "Church Management System", 5);
    } catch (toastErr) {
      // Avoid blocking the edit event if the notification itself fails.
    }
  }
}

function onSelectionChange(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    const sheetName = sh.getName();
    if (!MANUAL_EDIT_GUARDED_SHEETS.includes(sheetName) || e.range.getRow() < 3) return;
    const cfg = configSheet_();
    cfg.getRange("A4:B6").setValues([
      ["SELECTED_SHEET", sheetName],
      ["SELECTED_ROW", e.range.getRow()],
      ["SELECTED_AT", new Date()]
    ]);
  } catch (err) {
    // Selection tracking is best-effort; the sidebar can still read the active range.
  }
}

function guardManualDataEdit_(e) {
  if (!e || !e.range) return;
  if (manualEditsAllowed_()) return;
  const range = e.range;
  const sheetName = range.getSheet().getName();
  if (!CMS_GUARDED_SHEETS.includes(sheetName)) return;

  if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
    if (Object.prototype.hasOwnProperty.call(e, "oldValue")) {
      range.setValue(e.oldValue);
    } else {
      range.clearContent();
    }
  } else {
    range.clearContent();
  }
  SpreadsheetApp.getActive().toast(
    "Direct cell editing is locked. Please use the Church Management System sidebar Edit tab.",
    "Protected data",
    7
  );
}

function manualEditsAllowed_() {
  const until = Number(docProp_("CMS_ALLOW_MANUAL_EDITS_UNTIL") || 0);
  if (until && Date.now() < until) return true;
  if (until) docPropDel_("CMS_ALLOW_MANUAL_EDITS_UNTIL");
  return false;
}

function temporarilyAllowManualEdits() {
  PropertiesService.getDocumentProperties().setProperty(
    "CMS_ALLOW_MANUAL_EDITS_UNTIL",
    String(Date.now() + 15 * 60 * 1000)
  );
  removeCmsProtections_(ss_());
  SpreadsheetApp.getUi().alert("Direct manual editing is unlocked for 15 minutes. Use this only for emergency correction, then lock it again.");
}

function blockManualEdits() {
  PropertiesService.getDocumentProperties().deleteProperty("CMS_ALLOW_MANUAL_EDITS_UNTIL");
  applyCmsProtections();
}

function applyCmsProtections() {
  const ss = ss_();
  removeCmsProtections_(ss);
  MANUAL_EDIT_GUARDED_SHEETS.forEach(name => {
    const sh = sheetByName_(name);
    if (!sh) return;
    const protection = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).protect()
      .setDescription("CMS: use sidebar/web app for data changes");
    lockCmsProtection_(protection);
  });
  FORMULA_VIEW_SHEETS.forEach(name => {
    const sh = sheetByName_(name);
    if (!sh) return;
    const protection = sh.protect().setDescription("CMS: protected formula/view sheet");
    lockCmsProtection_(protection);
  });
  SpreadsheetApp.getUi().alert("Data protection is active. Visible tabs are locked, so admins should use the sidebar or mobile web app for changes.");
}

function lockCmsProtection_(protection) {
  protection.setWarningOnly(false);
  try {
    protection.addEditors(CMS_PROTECTION_EDITORS);
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
  } catch (err) {
    recordSystemError_(err, "lockCmsProtection_");
  }
}

function removeCmsProtections_(ss) {
  ss.getSheets().forEach(sh => {
    sh.getProtections(SpreadsheetApp.ProtectionType.SHEET)
      .concat(sh.getProtections(SpreadsheetApp.ProtectionType.RANGE))
      .forEach(protection => {
        if (String(protection.getDescription() || "").startsWith("CMS:")) {
          protection.remove();
        }
      });
  });
}

function withCmsProtectionsSuspended_(callback) {
  const ss = ss_();
  removeCmsProtections_(ss);
  try {
    return callback();
  } finally {
    applyCmsProtectionsSilent_();
  }
}

function applyCmsProtectionsSilent_() {
  const ss = ss_();
  removeCmsProtections_(ss);
  MANUAL_EDIT_GUARDED_SHEETS.forEach(name => {
    const sh = sheetByName_(name);
    if (!sh) return;
    const protection = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).protect()
      .setDescription("CMS: use sidebar/web app for data changes");
    lockCmsProtection_(protection);
  });
  FORMULA_VIEW_SHEETS.forEach(name => {
    const sh = sheetByName_(name);
    if (!sh) return;
    const protection = sh.protect().setDescription("CMS: protected formula/view sheet");
    lockCmsProtection_(protection);
  });
}

function createBackupNow() {
  const ui = SpreadsheetApp.getUi();
  const backup = createSystemBackup_("Manual");
  ui.alert(
    "Backup created successfully.\n\nFull copy:\n" + backup.copyUrl +
    "\n\nRaw CSV backup files: " + backup.csvCount +
    "\nBackup folder:\n" + backup.folderUrl
  );
}

function installDailyBackup() {
  installDailyBackupSilently_();
  SpreadsheetApp.getUi().alert("Daily backup is active. A backup will be created every night around 02:00 Germany time.");
}

function installDailyBackupSilently_() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === "scheduledDailyBackup")
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("scheduledDailyBackup")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  PropertiesService.getDocumentProperties().setProperty("CMS_DAILY_BACKUP_ENABLED", "true");
}

function scheduledDailyBackup() {
  createSystemBackup_("Daily");
}

function createBackupNowForSidebar(admin) {
  requirePermission_(admin, "manageSettings");
  installDailyBackupSilently_();
  return createSystemBackup_("Manual", admin);
}

function createSystemBackup_(mode, actor) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) {
    throw new Error("Backup could not start because another system action is running. Try again in a minute.");
  }
  try {
    const ss = ss_();
    const folder = backupFolder_();
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    const safeTitle = ss.getName().replace(/[\\/:*?"<>|]/g, "-");
    const backupName = safeTitle + " Backup " + stamp + " (" + mode + ")";
    const copy = DriveApp.getFileById(ss.getId()).makeCopy(backupName, folder);

    const backupBook = SpreadsheetApp.openById(copy.getId());
    writeBackupInfo_(backupBook, mode, stamp);

    const rawFolder = folder.createFolder("Raw Data " + stamp + " (" + mode + ")");
    let csvCount = 0;
    BACKUP_DATA_SHEETS.forEach(sheetName => {
      const sh = sheetByName_(sheetName);
      if (!sh) return;
      const csv = valuesToCsv_(sh.getDataRange().getDisplayValues());
      rawFolder.createFile(safeCsvName_(sheetName) + ".csv", csv, "text/csv");
      csvCount += 1;
    });

    const result = {
      mode,
      copyId: copy.getId(),
      copyUrl: copy.getUrl(),
      folderUrl: folder.getUrl(),
      csvCount
    };
    recordBackupMetadata_(result);
    result.retention = pruneOldBackups_(folder, ss.getName());
    logAction_("CREATE_BACKUP", "Drive", copy.getId(), actor || mode, "", JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function recordBackupMetadata_(backup) {
  const props = PropertiesService.getDocumentProperties();
  const now = new Date();
  props.setProperty("CMS_LAST_BACKUP_AT", now.toISOString());
  props.setProperty("CMS_LAST_BACKUP_MODE", clean_(backup.mode));
  props.setProperty("CMS_LAST_BACKUP_COPY_ID", clean_(backup.copyId));
  props.setProperty("CMS_LAST_BACKUP_COPY_URL", clean_(backup.copyUrl));
  clearDashboardSummaryCache_();
}

function clearDashboardSummaryCache_() {
  try {
    CacheService.getDocumentCache().remove("dashboard:summary");
    CacheService.getDocumentCache().remove(DASHBOARD_SUMMARY_CACHE_KEY);
  } catch (err) {
    // Dashboard cache clearing is best-effort.
  }
  docPropDel_(DASHBOARD_CACHE_PROPS_KEY);
  delete CMS_DATA_CONTEXT_["cache:dashboard:summary"];
  delete CMS_DATA_CONTEXT_["cache:" + DASHBOARD_SUMMARY_CACHE_KEY];
}

function pruneOldBackups_(folder, sourceName) {
  const safeTitle = clean_(sourceName).replace(/[\\/:*?"<>|]/g, "-");
  const backupFiles = [];
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.indexOf(safeTitle + " Backup ") === 0) {
      backupFiles.push({ item: file, created: file.getDateCreated().getTime(), name });
    }
  }
  const rawFolders = [];
  const folders = folder.getFolders();
  while (folders.hasNext()) {
    const rawFolder = folders.next();
    const name = rawFolder.getName();
    if (name.indexOf("Raw Data ") === 0) {
      rawFolders.push({ item: rawFolder, created: rawFolder.getDateCreated().getTime(), name });
    }
  }
  const deletedFiles = pruneItems_(backupFiles, BACKUP_RETENTION_LIMIT);
  const deletedRawFolders = pruneItems_(rawFolders, BACKUP_RETENTION_LIMIT);
  return { keepLast: BACKUP_RETENTION_LIMIT, deletedFiles, deletedRawFolders };
}

function pruneItems_(items, limit) {
  items.sort((a, b) => b.created - a.created);
  const oldItems = items.slice(limit);
  oldItems.forEach(entry => entry.item.setTrashed(true));
  return oldItems.length;
}

function getBackupStatus_() {
  const raw = docProp_("CMS_LAST_BACKUP_AT") || "";
  let display = "";
  if (raw) {
    try {
      display = Utilities.formatDate(new Date(raw), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    } catch (err) {
      display = raw;
    }
  }
  return {
    lastBackupAt: raw,
    lastBackupDisplay: display,
    lastBackupMode: docProp_("CMS_LAST_BACKUP_MODE") || "",
    lastBackupUrl: docProp_("CMS_LAST_BACKUP_COPY_URL") || "",
    dailyBackupEnabled: docProp_("CMS_DAILY_BACKUP_ENABLED") === "true",
    retentionLimit: BACKUP_RETENTION_LIMIT
  };
}

function backupFolder_() {
  const props = PropertiesService.getDocumentProperties();
  const existingId = props.getProperty("CMS_BACKUP_FOLDER_ID");
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      props.deleteProperty("CMS_BACKUP_FOLDER_ID");
    }
  }
  const folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
  props.setProperty("CMS_BACKUP_FOLDER_ID", folder.getId());
  return folder;
}

function writeBackupInfo_(backupBook, mode, stamp) {
  const infoName = "Backup Info";
  let info = backupBook.getSheetByName(infoName);
  if (!info) info = backupBook.insertSheet(infoName, 0);
  info.clear();
  info.getRange("A1:B8").setValues([
    ["Backup Type", mode],
    ["Backup Created", stamp],
    ["Source Spreadsheet", ss_().getName()],
    ["Source Spreadsheet ID", ss_().getId()],
    ["System", CHURCH_SYSTEM_NAME],
    ["Restore Note", "Use this full copy for recovery. Raw CSV files in the backup folder preserve the main data tables."],
    ["Important", "Do not edit this backup unless you are restoring data."],
    ["Created By Script", "Yes"]
  ]);
  info.getRange("A:A").setFontWeight("bold");
  info.autoResizeColumns(1, 2);
}

function getSystemHealthDashboard(admin) {
  requirePermission_(admin, "viewReports");
  const backup = getBackupStatus_();
  const props = PropertiesService.getDocumentProperties();
  return {
    ok: true,
    deploymentVersion: CMS_DEPLOYMENT_VERSION,
    lastBackupDate: backup.lastBackupDisplay || "",
    lastBackupUrl: backup.lastBackupUrl || "",
    backupStatus: backup.dailyBackupEnabled ? "Daily backup enabled" : "Daily backup not enabled",
    dailyBackupEnabled: backup.dailyBackupEnabled,
    membersCount: countRowsSafe_(SHEETS.members),
    paymentsCount: countRowsSafe_(SHEETS.payments),
    churchTransactionsCount: countRowsSafe_(SHEETS.churchTransactions),
    handoversCount: countRowsSafe_(SHEETS.handovers),
    materialInventoryCount: countRowsSafe_(SHEETS.materialInventory),
    lastErrorDate: formatIsoDateTime_(props.getProperty("CMS_LAST_ERROR_AT") || ""),
    lastErrorContext: props.getProperty("CMS_LAST_ERROR_CONTEXT") || "",
    lastErrorMessage: props.getProperty("CMS_LAST_ERROR_MESSAGE") || ""
  };
}

function countRowsSafe_(sheetName) {
  try {
    return dataRows_(sheetName).length;
  } catch (err) {
    return 0;
  }
}

function formatIsoDateTime_(value) {
  if (!value) return "";
  try {
    return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  } catch (err) {
    return value;
  }
}

function verifyLatestBackupForSidebar(admin) {
  requirePermission_(admin, "manageSettings");
  const result = verifyLatestBackup_();
  logAction_("VERIFY_BACKUP", "Drive", result.backupFileId || "", admin, "", JSON.stringify({ ok: result.ok, warnings: result.warnings.length, errors: result.errors.length }));
  return result;
}

function verifyLatestBackup_() {
  const backup = getBackupStatus_();
  const result = {
    ok: false,
    backupFileExists: false,
    backupReadable: false,
    backupFileId: "",
    backupUrl: backup.lastBackupUrl || "",
    checkedAt: new Date().toISOString(),
    requiredSheets: [],
    warnings: [],
    errors: []
  };
  const id = PropertiesService.getDocumentProperties().getProperty("CMS_LAST_BACKUP_COPY_ID") || "";
  result.backupFileId = id;
  if (!id) {
    result.errors.push("No backup file ID is recorded. Create a backup first.");
    return result;
  }
  try {
    const file = DriveApp.getFileById(id);
    result.backupFileExists = !file.isTrashed();
    if (!result.backupFileExists) result.errors.push("The latest backup file is in trash.");
  } catch (err) {
    result.errors.push("Backup file cannot be found: " + (err.message || err));
    return result;
  }
  let backupBook;
  try {
    backupBook = SpreadsheetApp.openById(id);
    result.backupReadable = true;
  } catch (err) {
    result.errors.push("Backup spreadsheet cannot be opened: " + (err.message || err));
    return result;
  }
  Object.keys(SYSTEM_REQUIRED_HEADERS).forEach(sheetName => {
    const check = verifySheetHeaders_(backupBook, sheetName, SYSTEM_REQUIRED_HEADERS[sheetName]);
    result.requiredSheets.push(check);
    if (!check.exists) result.errors.push("Missing required sheet in backup: " + sheetName);
    check.missingColumns.forEach(col => result.errors.push("Missing column in backup " + sheetName + ": " + col));
  });
  result.ok = result.backupFileExists && result.backupReadable && result.errors.length === 0;
  if (!result.ok && !result.errors.length) result.warnings.push("Backup verification found warnings.");
  return result;
}

function verifySheetHeaders_(book, sheetName, requiredHeaders) {
  const sh = book.getSheetByName(sheetName);
  const check = { sheetName, exists: !!sh, missingColumns: [] };
  if (!sh) {
    check.missingColumns = requiredHeaders.slice();
    return check;
  }
  const width = Math.max(sh.getLastColumn(), requiredHeaders.length, 1);
  const headers = sh.getRange(2, 1, 1, width).getValues()[0].map(clean_);
  requiredHeaders.forEach(header => {
    if (headers.indexOf(header) < 0) check.missingColumns.push(header);
  });
  return check;
}

function refreshDashboardCache_(reason, admin) {
  const live = buildLiveDashboardTotals_();
  const memberList = memberIndex_().list;
  const totalMembers = memberList.length;
  const inactiveMembers = memberList.filter(m => clean_(m.status).toLowerCase() !== "active").length;
  const unpaidCount = yearlyUnpaidMemberRows_(live.year).length;
  const churchTransactions = buildChurchTransactionDashboard_();
  const demographics = buildMemberDemographics_();
  const payload = {
    v: DASHBOARD_CACHE_VERSION,
    t: new Date().toISOString(),
    r: reason || "manual",
    a: clean_(admin) || "system",
    d: {
      year: live.year,
      totalMembers: totalMembers,
      activeMembers: live.activeMembers,
      inactiveMembers: inactiveMembers,
      income: live.income,
      expenses: live.expenses,
      net: live.net,
      paymentsCount: live.paymentsCount,
      servicePaymentsCount: live.servicePaymentsCount,
      savingsDepositsCount: live.savingsDepositsCount,
      churchTransactionsCount: live.churchTransactionsCount,
      materialInventoryCount: live.materialInventoryCount,
      membershipIncome: live.membershipIncome,
      serviceIncome: live.serviceIncome,
      savingsIncome: live.savingsIncome,
      churchIncome: live.churchIncome,
      operatingExpenses: live.operatingExpenses,
      churchExpenses: live.churchExpenses,
      autoConversionApplied: live.autoConversionApplied,
      unpaidCount: unpaidCount,
      churchTransactions: churchTransactions,
      demographics: demographics
    }
  };
  const serialized = JSON.stringify(payload);
  try {
    CacheService.getDocumentCache().put(DASHBOARD_SUMMARY_CACHE_KEY, serialized, 21600);
    PropertiesService.getDocumentProperties().setProperty(DASHBOARD_CACHE_PROPS_KEY, serialized);
  } catch (err) {
    // Best-effort — live fallback still works.
  }
  // Verify write integrity by reading back
  var verify = readDashboardCache_();
  var verificationOk = verify && verify.d && verify.d.income === live.income && verify.d.expenses === live.expenses;
  if (!verificationOk) {
    try {
      logAction_("DASHBOARD_CACHE_VERIFY_FAIL", clean_(admin), "Cache write verification failed — values may be stale");
    } catch (e) {}
    return { fromCache: false, verificationFailed: true, cachedAt: payload.t, reason: payload.r, d: payload.d };
  }
  return { fromCache: false, cachedAt: payload.t, reason: payload.r, a: payload.a, d: payload.d };
}

function readDashboardCache_() {
  try {
    var hit = CacheService.getDocumentCache().get(DASHBOARD_SUMMARY_CACHE_KEY);
    if (hit) {
      var parsed = JSON.parse(hit);
      if (parsed && parsed.v === DASHBOARD_CACHE_VERSION) return parsed;
    }
  } catch (e) {}
  try {
    var prop = docProp_(DASHBOARD_CACHE_PROPS_KEY);
    if (prop) {
      var parsedProp = JSON.parse(prop);
      if (parsedProp && parsedProp.v === DASHBOARD_CACHE_VERSION) return parsedProp;
    }
  } catch (e) {}
  return null;
}

function getDashboardSummaryCached(admin) {
  requirePermission_(admin, "viewReports");
  return timed_("getDashboardSummaryCached", () => {
    var cached = readDashboardCache_();
    var d;
    var fromCache = false;
    var cachedAt = null;
    var reason = null;
    if (cached) {
      d = cached.d;
      fromCache = true;
      cachedAt = cached.t;
      reason = cached.r;
    } else {
      var rebuilt;
      try {
        rebuilt = refreshDashboardCache_("auto-rebuild", admin);
        d = rebuilt.d;
        cachedAt = rebuilt.cachedAt;
        reason = rebuilt.reason;
      } catch (rebuildErr) {
        // Final fallback: run live without caching
        var live = buildLiveDashboardTotals_();
        refreshDashboardLiveTotals_(live);
        var memberList = memberIndex_().list;
        var backup = getBackupStatus_();
        return {
          year: live.year, activeMembers: live.activeMembers, income: live.income,
          expenses: live.expenses, net: live.net, paymentsCount: live.paymentsCount,
          servicePaymentsCount: live.servicePaymentsCount, savingsDepositsCount: live.savingsDepositsCount,
          churchTransactionsCount: live.churchTransactionsCount, materialInventoryCount: live.materialInventoryCount,
          membershipIncome: live.membershipIncome, serviceIncome: live.serviceIncome,
          savingsIncome: live.savingsIncome, churchIncome: live.churchIncome,
          operatingExpenses: live.operatingExpenses, churchExpenses: live.churchExpenses,
          autoConversionApplied: live.autoConversionApplied,
          totalMembers: memberList.length,
          inactiveMembers: memberList.filter(m => clean_(m.status).toLowerCase() !== "active").length,
          unpaidCount: yearlyUnpaidMemberRows_(live.year).length,
          churchTransactions: buildChurchTransactionDashboard_(),
          demographics: buildMemberDemographics_(),
          reportsStale: !!docProp_("CMS_REPORTS_STALE"),
          lastBackupAt: backup.lastBackupAt, lastBackupDisplay: backup.lastBackupDisplay,
          lastBackupMode: backup.lastBackupMode, lastBackupUrl: backup.lastBackupUrl,
          dailyBackupEnabled: backup.dailyBackupEnabled, backupRetentionLimit: backup.retentionLimit,
          fromCache: false, cacheError: String(rebuildErr.message || rebuildErr)
        };
      }
    }
    var backup = getBackupStatus_();
    return {
      year: d.year, activeMembers: d.activeMembers, income: d.income,
      expenses: d.expenses, net: d.net, paymentsCount: d.paymentsCount,
      servicePaymentsCount: d.servicePaymentsCount, savingsDepositsCount: d.savingsDepositsCount,
      churchTransactionsCount: d.churchTransactionsCount, materialInventoryCount: d.materialInventoryCount,
      membershipIncome: d.membershipIncome, serviceIncome: d.serviceIncome,
      savingsIncome: d.savingsIncome, churchIncome: d.churchIncome,
      operatingExpenses: d.operatingExpenses, churchExpenses: d.churchExpenses,
      autoConversionApplied: d.autoConversionApplied,
      totalMembers: d.totalMembers,
      inactiveMembers: d.inactiveMembers,
      unpaidCount: d.unpaidCount,
      churchTransactions: d.churchTransactions,
      demographics: d.demographics,
      reportsStale: !!docProp_("CMS_REPORTS_STALE"),
      lastBackupAt: backup.lastBackupAt, lastBackupDisplay: backup.lastBackupDisplay,
      lastBackupMode: backup.lastBackupMode, lastBackupUrl: backup.lastBackupUrl,
      dailyBackupEnabled: backup.dailyBackupEnabled, backupRetentionLimit: backup.retentionLimit,
      fromCache: fromCache, cachedAt: cachedAt, cacheReason: reason
    };
  });
}

// Sidebar-callable wrapper: Super Admin only, manual cache refresh
function refreshDashboardCacheForSidebar(admin) {
  requirePermission_(admin, "manageSettings");
  return timed_("refreshDashboardCacheForSidebar", () => {
    clearDashboardSummaryCache_();
    return refreshDashboardCache_("manual-refresh", admin);
  });
}

// Benchmark: compare cached vs live response times and sheet write counts
function getDashboardSummaryBenchmark(admin) {
  requirePermission_(admin, "viewReports");

  // First call: warm the cache if not already warm
  getDashboardSummaryCached(admin);

  // Second call: should be a pure cache hit (no sheet writes)
  var t0 = Date.now();
  var cached = getDashboardSummaryCached(admin);
  var cachedMs = Date.now() - t0;

  var t1 = Date.now();
  var live = getDashboardSummary(admin);
  var liveMs = Date.now() - t1;

  return {
    cachedMs: cachedMs,
    liveMs: liveMs,
    speedupMs: liveMs - cachedMs,
    speedupPct: liveMs > 0 ? Math.round((liveMs - cachedMs) / liveMs * 100) : 0,
    cachedFromCache: cached.fromCache,
    income: { cached: cached.income, live: live.income, match: cached.income === live.income },
    churchTransactionsPresent: !!(cached.churchTransactions),
    demographicsPresent: !!(cached.demographics),
    note: "Cache hit returns churchTransactions and demographics from stored payload — no sheet writes occur."
  };
}

function savingsDepositIdFromPaymentRow_(row) {
  const match = clean_(row[10]).match(/Auto-converted from savings deposit\s+(SAV-[A-Za-z0-9-]+)/i);
  return match ? match[1] : "";
}

function runRestoreTestForSidebar(admin) {
  requirePermission_(admin, "manageSettings");
  const verification = verifyLatestBackup_();
  const result = {
    ok: false,
    verifiedBackup: verification.ok,
    temporaryCopyCreated: false,
    temporaryCopyDeleted: false,
    messages: [],
    errors: verification.errors.slice()
  };
  if (!verification.ok) return result;
  let tempFile;
  try {
    const source = DriveApp.getFileById(verification.backupFileId);
    const folder = backupFolder_();
    tempFile = source.makeCopy("RESTORE TEST - " + source.getName() + " - " + new Date().getTime(), folder);
    result.temporaryCopyCreated = true;
    const tempBook = SpreadsheetApp.openById(tempFile.getId());
    Object.keys(SYSTEM_REQUIRED_HEADERS).forEach(sheetName => {
      const check = verifySheetHeaders_(tempBook, sheetName, SYSTEM_REQUIRED_HEADERS[sheetName]);
      if (!check.exists) result.errors.push("Restore test copy missing sheet: " + sheetName);
      check.missingColumns.forEach(col => result.errors.push("Restore test copy missing column in " + sheetName + ": " + col));
    });
    result.messages.push("Temporary restore copy opened successfully without touching production.");
  } catch (err) {
    result.errors.push(err.message || String(err));
  } finally {
    if (tempFile) {
      try {
        tempFile.setTrashed(true);
        result.temporaryCopyDeleted = true;
      } catch (trashErr) {
        result.errors.push("Temporary restore copy could not be trashed: " + (trashErr.message || trashErr));
      }
    }
  }
  result.ok = result.verifiedBackup && result.temporaryCopyCreated && result.temporaryCopyDeleted && result.errors.length === 0;
  logAction_("RESTORE_TEST", "Drive", verification.backupFileId || "", admin, "", JSON.stringify(result));
  return result;
}

function archiveYearForSidebar(form) {
  const admin = clean_(form && form.admin);
  requirePermission_(admin, "manageSettings");
  const year = Number(form && form.year);
  if (!year || year < 2000 || year > new Date().getFullYear()) throw new Error("Enter a valid archive year.");
  const backup = createSystemBackup_("Pre-Archive " + year, admin);
  return withWriteLock_("archiveYear", () => withCmsProtectionsSuspended_(() => {
    const result = {
      ok: true,
      year,
      backupUrl: backup.copyUrl,
      archived: {}
    };
    result.archived[SHEETS.payments] = archiveRowsByDate_(SHEETS.payments, PAYMENT_HEADERS, 2, year);
    result.archived[SHEETS.churchTransactions] = archiveRowsByDate_(SHEETS.churchTransactions, CHURCH_TRANSACTION_HEADERS, 2, year);
    result.archived[SHEETS.handovers] = archiveRowsByDate_(SHEETS.handovers, HANDOVER_HEADERS, 4, year);
    result.archived[SHEETS.materialMovementLog] = archiveRowsByDate_(SHEETS.materialMovementLog, MATERIAL_MOVEMENT_HEADERS, 2, year);
    result.archived[SHEETS.audit] = archiveRowsByDate_(SHEETS.audit, AUDIT_HEADERS, 1, year);
    invalidateFastCaches_([SHEETS.payments, SHEETS.churchTransactions, SHEETS.handovers, SHEETS.materialMovementLog, SHEETS.audit]);
    logAction_("ARCHIVE_YEAR", "System", String(year), admin, "", JSON.stringify(result));
    return result;
  }));
}

function archiveRowsByDate_(sheetName, headers, dateColumnNumber, year) {
  const sh = sheetByName_(sheetName);
  if (!sh || sh.getLastRow() < 3) return 0;
  const width = Math.max(headers.length, sh.getLastColumn());
  const values = sh.getRange(3, 1, sh.getLastRow() - 2, width).getValues();
  const rowsToArchive = [];
  const rowNumbers = [];
  values.forEach((row, index) => {
    const date = coerceDate_(row[dateColumnNumber - 1]);
    if (date && date.getFullYear() <= year) {
      rowsToArchive.push(row);
      rowNumbers.push(index + 3);
    }
  });
  if (!rowsToArchive.length) return 0;
  const archiveName = sheetName + " Archive " + year;
  const archive = ensureArchiveSheet_(archiveName, sheetName, headers, width);
  archive.getRange(archive.getLastRow() + 1, 1, rowsToArchive.length, width).setValues(rowsToArchive);
  rowNumbers.reverse().forEach(rowNumber => sh.deleteRow(rowNumber));
  PropertiesService.getDocumentProperties().setProperty(nextRowPropertyKey_(sheetName), String(Math.max(sh.getLastRow() + 1, 3)));
  return rowsToArchive.length;
}

function ensureArchiveSheet_(archiveName, sourceSheetName, headers, width) {
  const ss = ss_();
  let archive = ss.getSheetByName(archiveName);
  if (!archive) archive = ss.insertSheet(archiveName);
  if (!clean_(archive.getRange("A1").getValue())) archive.getRange("A1").setValue(archiveName + " (from " + sourceSheetName + ")");
  const current = archive.getRange(2, 1, 1, Math.max(headers.length, width)).getValues()[0].map(clean_);
  headers.forEach((header, index) => {
    if (!current[index]) archive.getRange(2, index + 1).setValue(header);
  });
  archive.setFrozenRows(2);
  return archive;
}

function getRolePermissionsReview(admin) {
  requirePermission_(admin, "manageAdmins");
  return [ROLES.superAdmin, ROLES.treasurer, ROLES.admin, ROLES.secretary, ROLES.editor, ROLES.viewer].map(role => ({
    role,
    permissions: permissionsForRole_(role)
  }));
}

function valuesToCsv_(values) {
  return values.map(row => row.map(csvCell_).join(",")).join("\n");
}

function csvCell_(value) {
  const text = String(value == null ? "" : value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function safeCsvName_(name) {
  return name.replace(/[\\/:*?"<>|]/g, "-");
}

function openSidebar() {
  // Sidebar startup must only render UI — no sheet writes, no protection
  // changes. Header/credential maintenance runs via onOpen() instead.
  return timed_("openSidebar", () => {
    SpreadsheetApp.getUi().showSidebar(sidebarHtml_("member"));
  });
}

function openAdminManagement() {
  SpreadsheetApp.getUi().showSidebar(sidebarHtml_("tools"));
}

function doGet(e) {
  // Receipt public link — keep working (linked from WhatsApp messages)
  if (e && e.parameter && e.parameter.receipt) {
    return webReceiptHtml_(e.parameter.receipt)
      .setTitle("Payment Receipt")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  // All other GET requests: redirect to the Vercel PWA
  const redirect = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head>' +
    '<meta http-equiv="refresh" content="0;url=https://vercel-app-mu-orpin-97.vercel.app/">' +
    '</head><body style="font-family:sans-serif;padding:24px">' +
    '<p>Redirecting to the app… ' +
    '<a href="https://vercel-app-mu-orpin-97.vercel.app/">Click here if not redirected</a></p>' +
    '</body></html>'
  );
  redirect.setTitle("St.Rufael CMS");
  return redirect;
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    // Verify shared secret — blocks any caller that is not the Vercel proxy
    if (p.secret !== VERCEL_API_SECRET) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }
    // Vercel PWA dispatch: form fields fn= and args= (JSON-encoded array)
    if (p.fn) {
      const args = p.args ? JSON.parse(p.args) : [];
      const result = dispatchFn_(p.fn, Array.isArray(args) ? args : []);
      return jsonResponse_({ ok: true, result: result });
    }
    return jsonResponse_(handleApiAction_(p));
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}


function dispatchFn_(fn, args) {
  const ALLOWED = {
    loginSession: loginSession,
    getMembers: getMembers,
    getMemberBalanceLookup: getMemberBalanceLookup,
    getMemberPaymentStatus: getMemberPaymentStatus,
    getMemberCoverageStatus: getMemberCoverageStatus,
    getYearlyPaymentPreview: getYearlyPaymentPreview,
    addMember: addMember,
    addPayment: addPayment,
    generateReceiptForPayment: generateReceiptForPayment,
    addChurchTransaction: addChurchTransaction,
    getMaterialInventory: getMaterialInventory,
    recordMaterialMovement: recordMaterialMovement,
    getAdminHandoverDashboard: getAdminHandoverDashboard,
    confirmAdminHandover: confirmAdminHandover,
    getOverallHandoverDashboard: getOverallHandoverDashboard,
    confirmOverallHandover: confirmOverallHandover,
    searchHistory: searchHistory,
    getRowForEditByTxId: getRowForEditByTxId,
    getRowForEditByMemberId: getRowForEditByMemberId,
    getSelectedRowForEdit: getSelectedRowForEdit,
    updateSelectedRow: updateSelectedRow,
    deleteSelectedRow: deleteSelectedRow,
    voidReceipt: voidReceipt,
    getAdminUsers: getAdminUsers,
    saveAdminUser: saveAdminUser,
    setAdminUserStatus: setAdminUserStatus,
    deleteAdminUser: deleteAdminUser,
    getDashboardSummary: getDashboardSummary,
    getMembershipFeeSettings: getMembershipFeeSettings,
    updateMembershipFee: updateMembershipFee,
    createBackupNowForSidebar: createBackupNowForSidebar,
    verifyLatestBackupForSidebar: verifyLatestBackupForSidebar,
    runRestoreTestForSidebar: runRestoreTestForSidebar,
    getSystemHealthDashboard: getSystemHealthDashboard,
    runDataIntegrityCheck: runDataIntegrityCheck,
    archiveYearForSidebar: archiveYearForSidebar,
    getRolePermissionsReview: getRolePermissionsReview,
    removeMember: removeMember,
    getHandoverPreviousOutstandingDiagnostic: getHandoverPreviousOutstandingDiagnostic,
    getTransactionCategories: getTransactionCategories,
    getUnpaidMembersForDashboard: getUnpaidMembersForDashboard,
    prepareUnpaidReminder: prepareUnpaidReminder,
    restoreFeeHistoryBaseline: restoreFeeHistoryBaseline,
    undoLastFeeChange: undoLastFeeChange,
    getFeeChangePreview: getFeeChangePreview,
    exportFeeHistoryAsCsv: exportFeeHistoryAsCsv,
    exportFeeHistoryAsPdf: exportFeeHistoryAsPdf,
    runFinancialIntegrityCheck: runFinancialIntegrityCheck,
    exportFinancialIntegrityReportAsPdf: exportFinancialIntegrityReportAsPdf,
    getDashboardSummaryCached: getDashboardSummaryCached,
    refreshDashboardCacheForSidebar: refreshDashboardCacheForSidebar,
    getDashboardSummaryBenchmark: getDashboardSummaryBenchmark,
    verifyReceiptStorage: verifyReceiptStorage,
    archiveAuditLogs: archiveAuditLogs,
    searchAuditLogs: searchAuditLogs,
    listAuditArchiveSheets: listAuditArchiveSheets,
    restoreAuditArchive: restoreAuditArchive
  };
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, fn)) {
    throw new Error("Unknown function: " + fn);
  }
  return ALLOWED[fn].apply(null, args);
}

function sidebarHtml_(initialTab) {
  const template = HtmlService.createTemplateFromFile("Sidebar");
  template.initialTab = initialTab || "member";
  return template.evaluate()
    .setTitle("Church Management System")
    .setWidth(380);
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiJsonpResponse_(params) {
  const callback = clean_(params.callback).replace(/[^A-Za-z0-9_.$]/g, "") || "callback";
  let payload;
  try {
    payload = handleApiAction_(params);
  } catch (err) {
    recordSystemError_(err, "api:" + clean_(params.action));
    payload = { ok: false, message: err.message || String(err) };
  }
  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function handleApiAction_(p) {
  const action = clean_(p.action);
  if (action === "publicHealthCheck") {
    return publicHealthCheck_();
  }
  if (!login(p.adminUser, p.adminPass)) {
    return { ok: false, message: "Wrong admin username or password." };
  }
  let result;
  if (action === "loginSession") {
    result = loginSession(p.adminUser, p.adminPass);
  } else if (action === "healthCheck") {
    result = healthCheck_();
  } else if (action === "createBackupNow") {
    result = createBackupNowForSidebar(p.adminUser);
  } else if (action === "getSystemHealthDashboard") {
    result = getSystemHealthDashboard(p.adminUser);
  } else if (action === "verifyLatestBackup") {
    result = verifyLatestBackupForSidebar(p.adminUser);
  } else if (action === "runDataIntegrityCheck") {
    result = runDataIntegrityCheck(p.adminUser);
  } else if (action === "archiveYear") {
    result = archiveYearForSidebar({ admin: p.adminUser, year: p.year });
  } else if (action === "runRestoreTest") {
    result = runRestoreTestForSidebar(p.adminUser);
  } else if (action === "getRolePermissionsReview") {
    result = getRolePermissionsReview(p.adminUser);
  } else if (action === "getDashboardSummary") {
    result = getDashboardSummary(p.adminUser);
  } else if (action === "getTransactionCategories") {
    result = getTransactionCategories(p.transactionType, p.includeInactive === "true", p.adminUser);
  } else if (action === "getMaterialInventory") {
    result = getMaterialInventory(p.includeInactive === "true", p.adminUser);
  } else if (action === "addChurchTransaction") {
    result = addChurchTransaction({
      requestId: p.requestId,
      transactionType: p.transactionType,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      date: p.date,
      donorName: p.donorName,
      memberName: p.memberName,
      memberId: p.memberId,
      amount: p.amount,
      method: p.method,
      paidFromCollectedCash: p.paidFromCollectedCash,
      evidenceLink: p.evidenceLink,
      itemName: p.itemName,
      quantity: p.quantity,
      estimatedValue: p.estimatedValue,
      recordedBy: p.adminUser,
      notes: p.notes,
      admin: p.adminUser
    });
  } else if (action === "recordMaterialMovement") {
    result = recordMaterialMovement({
      requestId: p.requestId,
      itemId: p.itemId,
      actionType: p.actionType,
      quantity: p.quantity,
      quantityAfter: p.quantityAfter,
      saleAmount: p.saleAmount,
      method: p.method,
      buyerName: p.buyerName,
      recordedBy: p.adminUser,
      notes: p.notes,
      admin: p.adminUser
    });
  } else if (action === "getAdminHandoverDashboard") {
    result = getAdminHandoverDashboard({
      admin: p.admin || p.adminUser,
      range: p.range,
      startDate: p.startDate,
      endDate: p.endDate
    });
  } else if (action === "getOverallHandoverDashboard") {
    result = getOverallHandoverDashboard({
      admin: p.adminUser
    });
  } else if (action === "getHandoverPreviousOutstandingDiagnostic") {
    result = getHandoverPreviousOutstandingDiagnostic({
      admin: p.admin || p.adminUser,
      range: p.range,
      startDate: p.startDate,
      endDate: p.endDate
    });
  } else if (action === "confirmAdminHandover") {
    result = confirmAdminHandover({
      requestId: p.requestId,
      admin: p.admin || p.adminUser,
      range: p.range,
      startDate: p.startDate,
      endDate: p.endDate,
      receiver: p.receiver,
      actualCashHandedOver: p.actualCashHandedOver,
      language: p.language,
      notes: p.notes
    });
  } else if (action === "confirmOverallHandover") {
    result = confirmOverallHandover({
      requestId: p.requestId,
      admin: p.adminUser,
      confirmationsJson: p.confirmationsJson,
      meetingDate: p.meetingDate,
      notes: p.notes,
      language: p.language
    });
  } else if (action === "getMembers") {
    result = getMembers(p.adminUser);
  } else if (action === "searchHistory") {
    result = searchHistory(p.query, p.adminUser);
  } else if (action === "updateMember") {
    result = updateMemberFromMobile_({
      memberId: p.memberId,
      fullName: p.fullName,
      phone: p.phone,
      city: p.city,
      joinDate: p.joinDate,
      status: p.status,
      notes: p.notes,
      addedBy: p.adminUser
    });
  } else if (action === "getMemberBalanceLookup") {
    result = getMemberBalanceLookup(p.memberId || p.memberQuery, p.adminUser);
  } else if (action === "getMemberPaymentStatus") {
    result = getMemberPaymentStatus({
      memberId: p.memberId,
      memberQuery: p.memberQuery,
      year: p.year,
      admin: p.adminUser
    });
  } else if (action === "getMemberCoverageStatus") {
    result = getMemberCoverageStatus({
      memberId: p.memberId,
      memberQuery: p.memberQuery,
      startYear: p.startYear,
      endYear: p.endYear,
      admin: p.adminUser
    });
  } else if (action === "getYearlyPaymentPreview") {
    result = getYearlyPaymentPreview({
      memberId: p.memberId,
      memberQuery: p.memberQuery,
      startYear: p.startYear,
      endYear: p.endYear,
      amount: p.amount,
      admin: p.adminUser
    });
  } else if (action === "addMember") {
    result = clean_(p.personType) === "nonMember" ? addNonMember({
      requestId: p.requestId,
      fullName: p.fullName,
      phone: p.phone,
      city: p.city,
      joinDate: p.joinDate,
      status: p.status || "Active",
      notes: p.notes,
      addedBy: p.addedBy || p.adminUser
    }) : addMember({
      requestId: p.requestId,
      fullName: p.fullName,
      phone: p.phone,
      city: p.city,
      joinDate: p.joinDate,
      status: p.status || "Active",
      notes: p.notes,
      addedBy: p.adminUser,
      confirmDuplicate: p.confirmDuplicate === "true"
    });
  } else if (action === "addPayment") {
    result = addPayment({
      requestId: p.requestId,
      paymentKind: p.paymentKind,
      serviceType: p.serviceType,
      memberId: p.memberId,
      memberQuery: p.memberQuery,
      memberName: p.memberName,
      paymentDate: p.paymentDate,
      months: p.months ? String(p.months).split(",") : [],
      coverage: p.coverage,
      year: p.year,
      amount: p.amount,
      extraPaymentHandling: p.extraPaymentHandling,
      reason: p.reason,
      method: p.method,
      recordedBy: p.adminUser,
      notes: p.notes,
      payerType: p.payerType,
      payerPhone: p.payerPhone
    });
  } else if (action === "generateReceiptForPayment") {
    result = generateReceiptForPayment({
      transactionId: p.transactionId,
      admin: p.admin || p.adminUser,
      language: p.language
    });
  } else if (action === "voidReceipt") {
    result = voidReceipt({
      receiptId: p.receiptId,
      admin: p.admin || p.adminUser,
      reason: p.reason
    });
  } else if (action === "searchReceipts") {
    result = searchReceipts(p.query, p.adminUser);
  } else if (action === "addExpense") {
    result = addExpense({
      requestId: p.requestId,
      expenseDate: p.expenseDate,
      category: p.category,
      description: p.description,
      amount: p.amount,
      recordedBy: p.adminUser,
      paidFromCollectedCash: p.paidFromCollectedCash,
      notes: p.notes,
      admin: p.adminUser
    });
  } else {
    throw new Error("Unsupported action.");
  }
  return { ok: true, result };
}

function ss_() {
  try {
    return SpreadsheetApp.openById(CMS_SPREADSHEET_ID);
  } catch (err) {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
    throw err;
  }
}

function healthCheck_() {
  const result = {
    activeUserEmail: "",
    effectiveUserEmail: "",
    scriptSpreadsheetId: CMS_SPREADSHEET_ID,
    scriptUrl: "",
    deploymentVersion: CMS_DEPLOYMENT_VERSION,
    serverStatus: "OK",
    lastErrorMessage: "",
    spreadsheetOpened: false,
    spreadsheetId: "",
    spreadsheetName: "",
    sheetNames: [],
    documentPropertiesReadable: false,
    scriptPropertiesReadable: false,
    timestamp: new Date().toISOString()
  };
  try {
    result.activeUserEmail = Session.getActiveUser().getEmail() || "";
  } catch (err) {
    result.activeUserEmail = "";
  }
  try {
    result.effectiveUserEmail = Session.getEffectiveUser().getEmail() || "";
  } catch (err) {
    result.effectiveUserEmail = "";
  }
  try {
    result.scriptUrl = ScriptApp.getService().getUrl() || "";
  } catch (err) {
    result.scriptUrl = "";
  }
  try {
    const docProps = PropertiesService.getDocumentProperties();
    result.documentPropertiesReadable = !!docProps;
  } catch (err) {
    result.documentPropertiesReadable = false;
  }
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    result.scriptPropertiesReadable = !!scriptProps;
  } catch (err) {
    result.scriptPropertiesReadable = false;
  }
  try {
    const ss = ss_();
    ensureTransactionInfrastructure_();
    result.spreadsheetOpened = true;
    result.spreadsheetId = ss.getId();
    result.spreadsheetName = ss.getName();
    result.sheetNames = ss.getSheets().map(sh => sh.getName());
  } catch (err) {
    result.spreadsheetOpened = false;
    result.error = err && err.message ? err.message : String(err);
    result.lastErrorMessage = result.error;
    result.serverStatus = "ERROR";
  }
  return result;
}

function publicHealthCheck_() {
  const result = {
    deploymentVersion: CMS_DEPLOYMENT_VERSION,
    serverStatus: "OK",
    scriptSpreadsheetId: CMS_SPREADSHEET_ID,
    scriptUrl: "",
    spreadsheetOpened: false,
    spreadsheetId: "",
    spreadsheetName: "",
    sheetNames: [],
    lastErrorMessage: "",
    timestamp: new Date().toISOString()
  };
  try {
    result.scriptUrl = ScriptApp.getService().getUrl() || "";
  } catch (err) {
    result.lastErrorMessage = err && err.message ? err.message : String(err);
  }
  try {
    const ss = ss_();
    ensureTransactionInfrastructure_();
    result.spreadsheetOpened = true;
    result.spreadsheetId = ss.getId();
    result.spreadsheetName = ss.getName();
    result.sheetNames = ss.getSheets().map(sh => sh.getName());
  } catch (err) {
    result.spreadsheetOpened = false;
    result.serverStatus = "ERROR";
    result.lastErrorMessage = err && err.message ? err.message : String(err);
  }
  return result;
}

function configSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEETS.config);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.config);
    sh.getRange("A1:B2").setFontColor("#ffffff").setBackground("#ffffff");
    sh.hideSheet();
  }
  return sh;
}

function sheetByName_(name) {
  const ss = ss_();
  const direct = ss.getSheetByName(name);
  if (direct) return direct;
  const aliases = SHEET_ALIASES[name] || [];
  for (const alias of aliases) {
    const found = ss.getSheetByName(alias);
    if (found) return found;
  }
  const canonical = Object.keys(SHEET_ALIASES).find(key => SHEET_ALIASES[key].includes(name));
  return canonical ? ss.getSheetByName(canonical) : null;
}

function sh_(name) {
  const sh = sheetByName_(name);
  if (!sh) throw new Error("Missing sheet: " + name);
  return sh;
}

function rows_(sheetName) {
  return dataRows_(sheetName);
}

function timed_(name, callback) {
  const started = Date.now();
  try {
    return callback();
  } finally {
    const elapsed = Date.now() - started;
    console.log("CMS_PERF " + name + " " + elapsed + "ms");
  }
}

function resetRequestCache_() {
  CMS_DATA_CONTEXT_ = {};
}

function dataRows_(sheetName) {
  const key = "rows:" + sheetName;
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  const rows = currentDataRows_(sheetName);
  const width = sheetDataWidth_(sheetName, sh_(sheetName));
  CMS_DATA_CONTEXT_[key] = rows.concat(archiveDataRows_(sheetName, width));
  return CMS_DATA_CONTEXT_[key];
}

function currentDataRows_(sheetName) {
  const key = "currentRows:" + sheetName;
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  const sh = sh_(sheetName);
  const width = sheetDataWidth_(sheetName, sh);
  const nextRow = Number(docProp_(nextRowPropertyKey_(sheetName)) || 0);
  const lastRow = Math.max(sh.getLastRow(), nextRow >= 3 ? nextRow - 1 : 0);
  if (lastRow < 3) {
    CMS_DATA_CONTEXT_[key] = [];
    return CMS_DATA_CONTEXT_[key];
  }
  const values = sh.getRange(1, 1, lastRow, width).getValues();
  const rows = values.slice(2).filter(r => r.some(c => c !== ""));
  CMS_DATA_CONTEXT_[key] = rows;
  return rows;
}

function archiveDataRows_(sheetName, width) {
  if (![SHEETS.payments, SHEETS.churchTransactions, SHEETS.handovers, SHEETS.materialMovementLog, SHEETS.audit].includes(sheetName)) return [];
  const ss = ss_();
  const prefix = sheetName + " Archive ";
  let rows = [];
  ss.getSheets().forEach(sh => {
    if (sh.getName().indexOf(prefix) !== 0 || sh.getLastRow() < 3) return;
    rows = rows.concat(sh.getRange(3, 1, sh.getLastRow() - 2, width).getValues().filter(r => r.some(c => c !== "")));
  });
  return rows;
}

function sheetDataWidth_(sheetName, sh) {
  if (sameSheet_(sheetName, SHEETS.members) || sameSheet_(sheetName, SHEETS.nonMembers)) return 10;
  if (sameSheet_(sheetName, SHEETS.payments) || sameSheet_(sheetName, SHEETS.servicePayments)) return PAYMENT_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.coverage)) return 18;
  if (sameSheet_(sheetName, SHEETS.expenses)) return EXPENSE_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.transactionCategories)) return TRANSACTION_CATEGORY_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.churchTransactions)) return CHURCH_TRANSACTION_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.materialInventory)) return MATERIAL_INVENTORY_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.materialMovementLog)) return MATERIAL_MOVEMENT_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.handovers)) return HANDOVER_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.audit)) return AUDIT_HEADERS.length;
  if (sameSheet_(sheetName, SHEETS.receipts)) return RECEIPT_HEADERS.length;
  return Math.max(sh.getLastColumn(), 1);
}

function invalidateFastCaches_(sheetNames) {
  if (!sheetNames) {
    CMS_DATA_CONTEXT_ = {};
  }
  (sheetNames || []).forEach(sheetName => {
    delete CMS_DATA_CONTEXT_["rows:" + sheetName];
    delete CMS_DATA_CONTEXT_["currentRows:" + sheetName];
  });
  if (!sheetNames || sheetNames.includes(SHEETS.members)) {
    delete CMS_DATA_CONTEXT_["member:index"];
    delete CMS_DATA_CONTEXT_["cache:members:list"];
    clearCachedMemberList_();
  }
  if (!sheetNames || sheetNames.includes(SHEETS.payments) || sheetNames.includes(SHEETS.coverage)) {
    delete CMS_DATA_CONTEXT_["payment:coverage:index"];
    delete CMS_DATA_CONTEXT_["membership:funding:index"];
    try {
      CacheService.getDocumentCache().remove("payments:coverage:v3");
      docPropDel_("CMS_PAID_COVERAGE_DELTA");
    } catch (err) {
      // Cache invalidation is best-effort; sheet rows remain the durable source.
    }
    clearCachedMembershipFundingIndex_();
  }
  if (!sheetNames || sheetNames.includes(SHEETS.config)) {
    delete CMS_DATA_CONTEXT_["fee:history:local"];
  }
  if (sheetNames) markReportsStale_();
  if (!sheetNames || sheetNames.some(name => [
    SHEETS.members,
    SHEETS.payments,
    SHEETS.servicePayments,
    SHEETS.savingsHistory,
    SHEETS.expenses,
    SHEETS.churchTransactions,
    SHEETS.materialInventory,
    SHEETS.materialMovementLog,
    SHEETS.handovers,
    SHEETS.overallHandovers
  ].includes(name))) {
    clearDashboardSummaryCache_();
  }
}

function markReportsStale_() {
  try {
    docPropSet_("CMS_REPORTS_STALE", String(Date.now()));
  } catch (err) {
    // Non-critical; reports can still be refreshed manually.
  }
}

function appendRowNumber_(sheetName, sh) {
  const key = nextRowPropertyKey_(sheetName);
  const cached = Number(docProp_(key) || 0);
  if (cached >= 3) return cached;
  const next = Math.max(sh.getLastRow() + 1, 3);
  docPropSet_(key, String(next));
  return next;
}

function advanceAppendRow_(sheetName, nextRow) {
  docPropSet_(nextRowPropertyKey_(sheetName), String(nextRow));
}

function nextRowPropertyKey_(sheetName) {
  return "CMS_NEXT_ROW_" + sheetName.replace(/[^A-Za-z0-9]/g, "_");
}

function cachedJson_(key, ttlSeconds, producer) {
  const localKey = "cache:" + key;
  if (Object.prototype.hasOwnProperty.call(CMS_DATA_CONTEXT_, localKey)) return CMS_DATA_CONTEXT_[localKey];
  try {
    const cache = CacheService.getDocumentCache();
    const raw = cache.get(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      CMS_DATA_CONTEXT_[localKey] = parsed;
      return parsed;
    }
    const value = producer();
    const text = JSON.stringify(value);
    if (text.length < 95000) cache.put(key, text, ttlSeconds || 120);
    CMS_DATA_CONTEXT_[localKey] = value;
    return value;
  } catch (err) {
    const value = producer();
    CMS_DATA_CONTEXT_[localKey] = value;
    return value;
  }
}

function nextId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmssSSS");
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return prefix + "-" + stamp + suffix;
}

function addMember(form) {
  return timed_("addMember", () => clean_(form && form.personType) === "nonMember"
    ? addNonMember(form)
    : withWriteLock_("addMember", () => withIdempotency_("addMember", form && form.requestId, form && form.addedBy, () => addMemberUnlocked_(form))));
}

function addNonMember(form) {
  return withWriteLock_("addNonMember", () => withIdempotency_("addNonMember", form && form.requestId, form && form.addedBy, () => addNonMemberUnlocked_(form)));
}

function addMemberUnlocked_(form) {
  const name = clean_(form.fullName);
  if (!name) throw new Error("Full Name is required.");
  const addedBy = clean_(form.addedBy);
  if (!addedBy) throw new Error("Added By is required. Please login again.");
  requirePermission_(addedBy, "manageMembers");
  const gender = clean_(form.gender);
  if (!gender) throw new Error("Gender is required.");
  if (gender !== "Male" && gender !== "Female") throw new Error("Gender must be Male or Female.");
  const birthDateRaw = clean_(form.birthDate);
  if (!birthDateRaw) throw new Error("Birth Date is required.");
  const birthDateObj = coerceDate_(birthDateRaw);
  if (!birthDateObj) throw new Error("Birth Date is not a valid date.");
  if (birthDateObj > new Date()) throw new Error("Birth Date cannot be in the future.");
  const ageCheck = calculateAge_(birthDateObj);
  if (ageCheck === null) throw new Error("Birth Date does not produce a valid age (0–120 years).");
  const phone = normalizeGermanPhone_(form.phone);
  const membersIndex = memberIndex_();
  assertUniqueMemberPhone_(phone);
  if (!form.confirmDuplicate) {
    const duplicates = findDuplicateMembersByName_(name);
    if (duplicates.length) {
      return { ok: false, duplicateWarning: true, duplicates };
    }
  }
  const memberId = nextId_("MEM");
  assertUniqueMemberId_(memberId);
  const sh = sh_(SHEETS.members);
  const lastMemberRow = membersIndex.list.reduce((max, member) => Math.max(max, Number(member.rowNumber) || 0), 2);
  const rowNumber = lastMemberRow + 1;
  const joinDate = form.joinDate ? new Date(form.joinDate) : new Date();
  sh.getRange(rowNumber, 1, 1, 10).setValues([[
    memberId,
    name,
    phone,
    clean_(form.city),
    joinDate,
    clean_(form.status) || "Active",
    clean_(form.notes),
    addedBy,
    gender,
    birthDateObj
  ]]);
  advanceAppendRow_(SHEETS.members, rowNumber + 1);
  appendCachedMember_(memberFromRow_([memberId, name, phone, clean_(form.city), joinDate, clean_(form.status) || "Active", clean_(form.notes), addedBy, gender, birthDateObj], rowNumber));
  logAction_("ADD_MEMBER", SHEETS.members, memberId, addedBy, "", JSON.stringify({ name, phone, gender, addedBy }));
  invalidateFastCaches_([SHEETS.members]);
  return { ok: true, id: memberId };
}

function addNonMemberUnlocked_(form) {
  ensureNonMemberSheet_();
  const name = clean_(form.fullName) || "Non-member donor";
  const addedBy = clean_(form.addedBy);
  if (!addedBy) throw new Error("Added By is required. Please login again.");
  requirePermission_(addedBy, "manageMembers");
  const phone = normalizeGermanPhone_(form.phone);
  assertUniqueMemberPhone_(phone);
  const donorId = nextId_("NON");
  sh_(SHEETS.nonMembers).appendRow([
    donorId,
    name,
    phone,
    clean_(form.city),
    form.joinDate ? new Date(form.joinDate) : new Date(),
    clean_(form.status) || "Active",
    clean_(form.notes),
    addedBy
  ]);
  logAction_("ADD_NON_MEMBER", SHEETS.nonMembers, donorId, addedBy, "", JSON.stringify({ name, phone, addedBy }));
  invalidateFastCaches_([SHEETS.nonMembers]);
  return { ok: true, id: donorId };
}

function generateReceiptForPayment(form) {
  return timed_("generateReceiptForPayment", () => withWriteLock_("generateReceiptForPayment", () => generateReceiptForPaymentUnlocked_(form)));
}

function generateReceiptForPaymentUnlocked_(form) {
  const txId = clean_(form && form.transactionId);
  const admin = clean_(form && form.admin);
  const language = normalizeReceiptLanguage_(form && form.language);
  if (!txId) throw new Error("Missing transaction ID.");
  requirePermission_(admin, "generateReceipts");
  const rows = findPaymentRowsByBaseTx_(txId);
  if (!rows.length) throw new Error("Payment not found.");
  const existingReceipt = activeReceiptById_(txId);
  const first = rows[0];
  const membershipAmount = Number(rows.reduce((sum, item) => sum + (Number(item.values[6]) || 0), 0).toFixed(2));
  const breakdown = receiptBreakdownForTx_(txId, membershipAmount);
  const amount = breakdown.totalReceived;
  const period = yearlyPeriodFromRows_(rows);
  const paymentDate = coerceDate_(first.values[1]) || new Date();
  const memberId = clean_(first.values[2]);
  const memberName = clean_(first.values[3]);
  const reason = clean_(first.values[7]) || "Membership";
  const method = clean_(first.values[8]) || "Cash";
  const recordedBy = clean_(first.values[9]) || admin;
  const notes = clean_(first.values[10]);
  const member = findMember_(memberId);
  const receiptYear = period;
  const storedReceiptUrl = existingReceipt ? clean_(existingReceipt.values[10]) : "";
  let receiptUrl = storedReceiptUrl;
  let receiptError = "";
  if (!receiptUrl) {
    try {
      receiptUrl = createPaymentReceiptPdf_({
        receiptId: txId,
        paymentDate,
        memberId,
        memberName,
        gender: member ? clean_(member.gender) : "",
        reason,
        monthLabel: period,
        year: receiptYear,
        periodLabel: period,
        amount,
        membershipAmount: breakdown.membershipAmount,
        extraSavingsAmount: breakdown.extraSavingsAmount,
        savingsUsedAmount: breakdown.savingsUsedAmount,
        totalReceived: breakdown.totalReceived,
        language,
        method,
        recordedBy,
        notes
      });
    } catch (err) {
      receiptError = err && err.message ? err.message : String(err);
      receiptUrl = "WEB_RECEIPT:" + clean_(txId);
    }
  }
  const resolvedUrl = resolveReceiptUrl_(receiptUrl, txId);
  rows.forEach(item => {
    item.sheet.getRange(item.rowNumber, 12, 1, 4).setValues([["Yes", "No", "", resolvedUrl]]);
  });
  upsertReceipt_(txId, paymentDate, memberId, memberName, reason, period, clean_(first.values[5]), amount, method, recordedBy, receiptUrl);
  const whatsapp = buildWhatsAppReceipt_(member ? member.phone : "", memberName, amount, reason, period, receiptYear, resolvedUrl, txId, language, member ? member.gender : "");
  logAction_(existingReceipt ? "RETURN_EXISTING_PAYMENT_RECEIPT" : "GENERATE_PAYMENT_RECEIPT", first.sheet.getName(), txId, admin, "", resolvedUrl);
  SpreadsheetApp.flush();
  return {
    ok: true,
    id: txId,
    receiptUrl: resolvedUrl,
    receiptError,
    whatsappUrl: whatsapp.appUrl,
    whatsappAppUrl: whatsapp.appUrl,
    whatsappWebUrl: whatsapp.webUrl,
    whatsappMessage: whatsapp.message,
    total: amount
  };
}

function updateMemberFromMobile_(form) {
  return withWriteLock_("updateMemberFromMobile", () => {
    const memberId = clean_(form && form.memberId);
    if (!memberId) throw new Error("Member ID is required.");
    const member = findMember_(memberId);
    if (!member || !member.rowNumber) throw new Error("Member not found.");
    return updateSelectedRowUnlocked_({
      sheetName: SHEETS.members,
      row: member.rowNumber,
      memberId,
      fullName: form.fullName,
      phone: form.phone,
      city: form.city,
      joinDate: form.joinDate,
      status: form.status,
      notes: form.notes,
      addedBy: form.addedBy
    });
  });
}

function webReceiptUrl_(txId) {
  return ScriptApp.getService().getUrl() + "?receipt=" + encodeURIComponent(clean_(txId));
}

function resolveReceiptUrl_(stored, txId) {
  if (!stored) return webReceiptUrl_(txId);
  if (stored.startsWith("WEB_RECEIPT:")) return webReceiptUrl_(txId);
  return stored;
}

function webReceiptHtml_(txId) {
  const rows = findPaymentRowsByBaseTx_(txId);
  if (!rows.length) {
    return HtmlService.createHtmlOutput("<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><p>Receipt not found.</p>");
  }
  const first = rows[0];
  const membershipAmount = Number(rows.reduce((sum, item) => sum + (Number(item.values[6]) || 0), 0).toFixed(2));
  const amount = receiptBreakdownForTx_(txId, membershipAmount).totalReceived;
  const period = yearlyPeriodFromRows_(rows);
  const date = displayDate_(first.values[1]);
  const html = [
    "<!doctype html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
    "<style>body{font-family:Arial,sans-serif;background:#f4f6f8;color:#1f2937;margin:0;padding:20px}.card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:24px}h1{color:#1f7a3a;margin:0 0 6px}table{width:100%;border-collapse:collapse;margin-top:18px}td{border-bottom:1px solid #e5e7eb;padding:10px 0}td:first-child{font-weight:bold;color:#475569;width:38%}.amount{margin-top:20px;background:#1f7a3a;color:#fff;border-radius:10px;padding:16px;font-size:24px;font-weight:bold}</style>",
    "</head><body><div class='card'>",
    "<h1>Payment Receipt</h1>",
    "<div>Church Management System</div>",
    "<table>",
    receiptRowHtml_("Receipt ID", txId),
    receiptRowHtml_("Date", date),
    receiptRowHtml_("Member ID", first.values[2]),
    receiptRowHtml_("Member Name", first.values[3]),
    receiptRowHtml_("Reason", first.values[7]),
    receiptRowHtml_("Period", period),
    receiptRowHtml_("Method", first.values[8]),
    receiptRowHtml_("Recorded By", first.values[9]),
    "</table>",
    "<div class='amount'>€", Number(amount || 0).toFixed(2), "</div>",
    "</div></body></html>"
  ].join("");
  return HtmlService.createHtmlOutput(html);
}

function receiptRowHtml_(label, value) {
  return "<tr><td>" + htmlEscape_(label) + "</td><td>" + htmlEscape_(value) + "</td></tr>";
}

function htmlEscape_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yearlyPeriodFromRows_(rows) {
  const years = rows.map(item => Number(item.values[5])).filter(Boolean).sort((a, b) => a - b);
  if (!years.length) return "";
  const unique = [...new Set(years)];
  return unique.length === 1 ? String(unique[0]) : unique[0] + "-" + unique[unique.length - 1];
}

function findPaymentRowsByBaseTx_(txId) {
  const result = [];
  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    const sh = ensurePaymentSheetColumns_(sheetName);
    const lastRow = sh.getLastRow();
    if (lastRow < 3) return;
    const values = sh.getRange(3, 1, lastRow - 2, PAYMENT_HEADERS.length).getValues();
    values.forEach((row, index) => {
      const current = clean_(row[0]);
      if (current === txId || current.indexOf(txId + "-") === 0) {
        result.push({ sheet: sh, sheetName, rowNumber: index + 3, values: row });
      }
    });
  });
  return result;
}

function baseReceiptIdForPaymentId_(txId) {
  return clean_(txId).replace(/-\d{2}$/, "");
}

function receiptRowsById_(receiptId) {
  const target = clean_(receiptId);
  if (!target) return [];
  const sh = ensureReceiptSheet_();
  const last = sh.getLastRow();
  if (last < 3) return [];
  return sh.getRange(3, 1, last - 2, RECEIPT_HEADERS.length).getValues()
    .map((values, index) => ({ sheet: sh, rowNumber: index + 3, values }))
    .filter(item => clean_(item.values[0]) === target);
}

function activeReceiptById_(receiptId) {
  const rows = receiptRowsById_(receiptId);
  return rows.find(item => receiptStatus_(item.values) !== "Voided") || null;
}

function receiptStatus_(row) {
  return clean_(row[14]) || "Active";
}

function hasActiveReceiptForPaymentId_(txId) {
  return !!activeReceiptById_(baseReceiptIdForPaymentId_(txId));
}

function receiptBreakdownForTx_(txId, membershipAmount) {
  const baseId = clean_(txId);
  let extraSavingsAmount = 0;
  const rows = findPaymentRowsByBaseTx_(baseId);
  const savingsUsedAmount = Number(rows
    .filter(item => isSavingsConversionPaymentRow_(item.values || []))
    .reduce((sum, item) => sum + (Number(item.values[6]) || 0), 0)
    .toFixed(2));
  if (!sheetByName_(SHEETS.savingsHistory)) {
    const appliedOnly = Number(Number(membershipAmount || 0).toFixed(2));
    const externalCash = Math.max(0, Number((appliedOnly - savingsUsedAmount).toFixed(2)));
    return { membershipAmount: appliedOnly, extraSavingsAmount: 0, savingsUsedAmount, totalReceived: externalCash || appliedOnly };
  }
  currentDataRows_(SHEETS.savingsHistory).forEach(row => {
    const notes = clean_(row[7]);
    if (notes.indexOf("Extra amount from membership payment " + baseId) >= 0) {
      extraSavingsAmount += Number(row[4]) || 0;
    }
  });
  extraSavingsAmount = Number(extraSavingsAmount.toFixed(2));
  const applied = Number(Number(membershipAmount || 0).toFixed(2));
  const externalMembershipCash = Math.max(0, Number((applied - savingsUsedAmount).toFixed(2)));
  return {
    membershipAmount: applied,
    extraSavingsAmount,
    savingsUsedAmount,
    totalReceived: Number(((externalMembershipCash || (savingsUsedAmount >= applied ? applied : 0)) + extraSavingsAmount).toFixed(2))
  };
}

function upsertReceipt_(receiptId, date, memberId, memberName, type, monthLabel, year, amount, method, recordedBy, receiptUrl) {
  const sh = ensureReceiptSheet_();
  const existing = activeReceiptById_(receiptId);
  const rowValues = [receiptId, date, memberId, memberName, type, monthLabel, year, amount, method, recordedBy, receiptUrl || "", new Date(), "No", "", "Active", new Date()];
  if (existing) {
    sh.getRange(existing.rowNumber, 1, 1, RECEIPT_HEADERS.length).setValues([rowValues]);
    return existing.rowNumber;
  }
  sh.appendRow(rowValues);
  return sh.getLastRow();
}

function getTransactionCategories(type, includeInactive, admin) {
  requireAnyPermission_(admin, ["managePayments", "manageExpenses", "manageInventory", "viewReports"]);
  return transactionCategories_(type, includeInactive);
}

function transactionCategories_(type, includeInactive) {
  ensureTransactionCategorySheet_();
  const requested = clean_(type);
  return dataRows_(SHEETS.transactionCategories).map(row => ({
    id: clean_(row[0]),
    type: clean_(row[1]),
    name: clean_(row[2]),
    tigrinyaName: clean_(row[3]),
    active: clean_(row[4]) !== "No",
    requiresMember: clean_(row[5]) === "Yes",
    requiresReceipt: clean_(row[6]) === "Yes",
    notes: clean_(row[7])
  })).filter(item => item.id && (!requested || item.type === requested) && (includeInactive || item.active));
}

function categoryById_(categoryId, type) {
  const categories = transactionCategories_(type, true);
  const target = clean_(categoryId);
  const category = categories.find(item => item.id === target || item.name === target || item.tigrinyaName === target);
  if (!category) throw new Error("Transaction category not found.");
  if (!category.active) throw new Error("This transaction category is inactive.");
  return category;
}

function saveTransactionCategory(form) {
  return withWriteLock_("saveTransactionCategory", () => {
    const admin = clean_(form && form.admin);
    requirePermission_(admin, "manageSettings");
    ensureTransactionCategorySheet_();
    const id = clean_(form.categoryId) || nextCategoryId_(form.transactionType, form.categoryName);
    const type = clean_(form.transactionType);
    const name = clean_(form.categoryName);
    if (!["Income", "Expense", "Material Donation"].includes(type)) throw new Error("Choose a valid transaction type.");
    if (!name) throw new Error("Category name is required.");
    const rowValues = [id, type, name, clean_(form.tigrinyaName) || name, truthy_(form.active) || clean_(form.active) !== "No" ? "Yes" : "No", truthy_(form.requiresMember) ? "Yes" : "No", truthy_(form.requiresReceipt) ? "Yes" : "No", clean_(form.notes)];
    const sh = sh_(SHEETS.transactionCategories);
    const rows = dataRows_(SHEETS.transactionCategories);
    const index = rows.findIndex(row => clean_(row[0]) === id);
    if (index >= 0) sh.getRange(index + 3, 1, 1, rowValues.length).setValues([rowValues]);
    else sh.appendRow(rowValues);
    logAction_("SAVE_TRANSACTION_CATEGORY", SHEETS.transactionCategories, id, admin, "", JSON.stringify(rowValues));
    invalidateFastCaches_([SHEETS.transactionCategories]);
    return { ok: true, id };
  });
}

function nextCategoryId_(type, name) {
  const prefix = clean_(type).slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "CAT";
  const slug = clean_(name).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "CATEGORY";
  return prefix + "-" + slug;
}

function addChurchTransaction(form) {
  return timed_("addChurchTransaction", () => withWriteLock_("addChurchTransaction", () => withIdempotency_("addChurchTransaction", form && form.requestId, clean_(form && form.recordedBy) || clean_(form && form.admin), () => addChurchTransactionUnlocked_(form))));
}

function addChurchTransactionUnlocked_(form) {
  const type = clean_(form.transactionType);
  if (!["Income", "Expense", "Material Donation"].includes(type)) throw new Error("Choose Income, Expense, or Material Donation.");
  const recordedBy = clean_(form.recordedBy) || clean_(form.admin);
  if (!recordedBy) throw new Error("Recorded By is required. Please login again.");
  requirePermission_(recordedBy, type === "Expense" ? "manageExpenses" : type === "Material Donation" ? "manageInventory" : "managePayments");
  // Validate date before category lookup so date errors surface first.
  if (!form.date && form.date !== 0) throw new Error("Transaction date is required.");
  const date = new Date(form.date);
  if (isNaN(date.getTime())) throw new Error("Invalid transaction date.");
  ensureTransactionInfrastructure_();
  const category = categoryById_(form.categoryId || form.categoryName, type);
  if (type === "Material Donation") return addMaterialDonationTransaction_(form, category, recordedBy);
  const amount = Number(form.amount);
  if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
  const txId = nextId_(type === "Expense" ? "EXP" : "INC");
  const paidFromCollectedCash = type === "Expense" && truthy_(form.paidFromCollectedCash) ? "Yes" : "No";
  sh_(SHEETS.churchTransactions).appendRow([
    txId, date, type, category.id, category.name, category.tigrinyaName, clean_(form.memberId), clean_(form.donorName) || clean_(form.memberName),
    amount, clean_(form.method) || "Cash", paidFromCollectedCash, category.requiresReceipt ? "Yes" : "No", clean_(form.receiptLink), clean_(form.evidenceLink),
    "", "", "", recordedBy, clean_(form.notes), "", "Pending", "Active"
  ]);
  logAction_("ADD_CHURCH_TRANSACTION", SHEETS.churchTransactions, txId, recordedBy, "", JSON.stringify({ type, category: category.name, amount, method: clean_(form.method), paidFromCollectedCash }));
  invalidateFastCaches_([SHEETS.churchTransactions]);
  return { ok: true, id: txId, transactionId: txId, type, category: category.name };
}

function addMaterialDonationTransaction_(form, category, recordedBy) {
  const quantity = Number(form.quantity);
  if (!quantity || quantity <= 0) throw new Error("Quantity must be greater than 0.");
  if (!form.date && form.date !== 0) throw new Error("Transaction date is required.");
  const date = new Date(form.date);
  if (isNaN(date.getTime())) throw new Error("Invalid transaction date.");
  const txId = nextId_("MATTX");
  const itemId = nextId_("ITEM");
  const itemName = clean_(form.itemName);
  if (!itemName) throw new Error("Item name is required.");
  const estimatedValue = Number(form.estimatedValue) || 0;
  sh_(SHEETS.materialInventory).appendRow([
    itemId, itemName, category.name, quantity, quantity, estimatedValue, "Available", clean_(form.donorName), date, new Date(), clean_(form.notes)
  ]);
  appendMaterialMovement_(itemId, itemName, "Added", quantity, 0, quantity, recordedBy, clean_(form.notes));
  sh_(SHEETS.churchTransactions).appendRow([
    txId, date, "Material Donation", category.id, category.name, category.tigrinyaName, "", clean_(form.donorName),
    estimatedValue, "", "No", category.requiresReceipt ? "Yes" : "No", "", "", itemId, itemName, quantity, recordedBy, clean_(form.notes), "", "Not Applicable", "Active"
  ]);
  logAction_("ADD_MATERIAL_DONATION", SHEETS.materialInventory, itemId, recordedBy, "", JSON.stringify({ transactionId: txId, itemName, quantity, category: category.name }));
  invalidateFastCaches_([SHEETS.churchTransactions, SHEETS.materialInventory, SHEETS.materialMovementLog]);
  return { ok: true, id: txId, transactionId: txId, itemId, itemName, quantity };
}

function getMaterialInventory(includeInactive, admin) {
  requireAnyPermission_(admin, ["manageInventory", "viewReports"]);
  ensureMaterialInventorySheet_();
  return currentDataRows_(SHEETS.materialInventory).map((row, index) => ({
    rowNumber: index + 3,
    itemId: clean_(row[0]),
    itemName: clean_(row[1]),
    category: clean_(row[2]),
    quantityReceived: Number(row[3]) || 0,
    quantityRemaining: Number(row[4]) || 0,
    estimatedValue: Number(row[5]) || 0,
    status: clean_(row[6]) || "Available",
    donorName: clean_(row[7]),
    receivedDate: displayDate_(row[8]),
    lastUpdated: displayDate_(row[9]),
    notes: clean_(row[10])
  })).filter(item => item.itemId && (includeInactive || !["Removed", "Lost", "Broken"].includes(item.status) || item.quantityRemaining > 0));
}

function recordMaterialMovement(form) {
  return timed_("recordMaterialMovement", () => withWriteLock_("recordMaterialMovement", () => withIdempotency_("recordMaterialMovement", form && form.requestId, clean_(form && form.admin) || clean_(form && form.recordedBy), () => recordMaterialMovementUnlocked_(form))));
}

function recordMaterialMovementUnlocked_(form) {
  const admin = clean_(form.admin) || clean_(form.recordedBy);
  if (!admin) throw new Error("Recorded By is required. Please login again.");
  requirePermission_(admin, "manageInventory");
  ensureTransactionInfrastructure_();
  const itemId = clean_(form.itemId);
  const actionType = clean_(form.actionType);
  if (!itemId) throw new Error("Choose a material item.");
  if (!["Add Quantity", "Reduce Quantity", "Sold", "Used", "Distributed", "Broken", "Lost", "Removed", "Quantity Correction"].includes(actionType)) throw new Error("Choose a valid material action.");
  const sh = sh_(SHEETS.materialInventory);
  const rows = currentDataRows_(SHEETS.materialInventory);
  const index = rows.findIndex(row => clean_(row[0]) === itemId);
  if (index < 0) throw new Error("Material item not found.");
  const rowNumber = index + 3;
  const row = rows[index];
  const itemName = clean_(row[1]);
  const before = Number(row[4]) || 0;
  let qty = Number(form.quantity);
  if (!qty || qty <= 0) qty = actionType === "Removed" ? before : 0;
  if (!qty && actionType !== "Quantity Correction") throw new Error("Quantity must be greater than 0.");
  if (actionType === "Sold" && (!Number(form.saleAmount) || Number(form.saleAmount) <= 0)) throw new Error("Sale amount must be greater than 0.");
  let after = before;
  if (actionType === "Add Quantity") after = before + qty;
  else if (actionType === "Quantity Correction") after = Math.max(0, Number(form.quantityAfter) || 0);
  else after = Math.max(0, before - qty);
  if (["Reduce Quantity", "Sold", "Used", "Distributed", "Broken", "Lost"].includes(actionType) && qty > before) throw new Error("Quantity cannot be greater than remaining inventory.");
  const status = materialStatusAfterAction_(actionType, after, clean_(row[6]));
  sh.getRange(rowNumber, 4, 1, 7).setValues([[Number(row[3]) || 0, after, Number(row[5]) || 0, status, clean_(row[7]), row[8], new Date()]]);
  if (clean_(form.notes)) sh.getRange(rowNumber, 11).setValue(clean_(form.notes));
  appendMaterialMovement_(itemId, itemName, actionType, qty, before, after, admin, clean_(form.notes));
  let saleTransaction = null;
  if (actionType === "Sold") {
    saleTransaction = addChurchTransactionUnlocked_({
      transactionType: "Income",
      categoryId: "INC-MATERIAL-SALE",
      donorName: clean_(form.buyerName),
      amount: Number(form.saleAmount) || 0,
      method: clean_(form.method) || "Cash",
      recordedBy: admin,
      notes: ["Material sale: " + itemName + " x " + qty, clean_(form.notes)].filter(Boolean).join(" | ")
    });
  }
  logAction_("MATERIAL_MOVEMENT", SHEETS.materialInventory, itemId, admin, JSON.stringify({ before, status: row[6] }), JSON.stringify({ actionType, quantity: qty, after, status }));
  invalidateFastCaches_([SHEETS.materialInventory, SHEETS.materialMovementLog, SHEETS.churchTransactions]);
  return { ok: true, itemId, actionType, quantity: qty, quantityBefore: before, quantityAfter: after, status, saleTransaction };
}

function materialStatusAfterAction_(actionType, quantityRemaining, currentStatus) {
  if (actionType === "Sold") return quantityRemaining > 0 ? "Available" : "Sold";
  if (["Used", "Distributed", "Broken", "Lost", "Removed"].includes(actionType)) return quantityRemaining > 0 ? "Available" : actionType.replace("Removed", "Removed");
  return quantityRemaining > 0 ? "Available" : clean_(currentStatus) || "Available";
}

function appendMaterialMovement_(itemId, itemName, actionType, quantity, before, after, recordedBy, notes) {
  ensureMaterialMovementLogSheet_();
  sh_(SHEETS.materialMovementLog).appendRow([nextId_("MOV"), new Date(), itemId, itemName, actionType, quantity, before, after, recordedBy, notes]);
}

function addExpense(form) {
  return timed_("addExpense", () => withWriteLock_("addExpense", () => withIdempotency_("addExpense", form && form.requestId, clean_(form && form.admin) || clean_(form && form.recordedBy) || clean_(form && form.who), () => addExpenseUnlocked_(form))));
}

function addExpenseUnlocked_(form) {
  const amount = Number(form.amount);
  if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
  const recordedBy = clean_(form.admin) || clean_(form.recordedBy) || clean_(form.who);
  if (!recordedBy) throw new Error("Recorded By is required. Please login again.");
  requirePermission_(recordedBy, "manageExpenses");
  normalizeExpenseSheetHeaders_();
  const paidFromCollectedCash = truthy_(form.paidFromCollectedCash) ? "Yes" : "No";
  if (!form.expenseDate && form.expenseDate !== 0) throw new Error("Transaction date is required.");
  const expenseDate = new Date(form.expenseDate);
  if (isNaN(expenseDate.getTime())) throw new Error("Invalid transaction date.");
  const expenseId = nextId_("EXP");
  sh_(SHEETS.expenses).appendRow([
    expenseDate,
    clean_(form.category) || "General",
    clean_(form.description),
    amount,
    recordedBy,
    clean_(form.notes),
    paidFromCollectedCash,
    expenseId,
    "",
    "Pending"
  ]);
  logAction_("ADD_EXPENSE", SHEETS.expenses, expenseId, recordedBy, "", JSON.stringify({ category: clean_(form.category), description: clean_(form.description), amount, recordedBy, notes: clean_(form.notes), paidFromCollectedCash }));
  invalidateFastCaches_([SHEETS.expenses]);
  return { ok: true, id: expenseId, paidFromCollectedCash };
}

function getMembers(admin) {
  requireAnyPermission_(admin, ["manageMembers", "managePayments", "manageExpenses", "manageHandover", "manageInventory", "viewReports"]);
  return timed_("getMembers", () => memberIndex_().list.map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    city: m.city,
    joinDate: displayDate_(m.joinDate),
    status: m.status,
    gender: m.gender || "",
    birthDate: m.birthDate ? displayDate_(m.birthDate) : ""
  })));
}

function getMemberBalanceLookup(query, admin) {
  requirePermission_(admin, "managePayments");
  return timed_("getMemberBalanceLookup", () => {
    const member = findMember_(query);
    if (!member) throw new Error("No member found by that name, Member ID, or phone number.");
    return buildMemberBalance_(member);
  });
}

function buildMemberBalance_(member) {
  const now = new Date();
  const join = coerceDate_(member.joinDate) || new Date(now.getFullYear(), 0, 1);
  const registrationYear = join.getFullYear();
  const currentYear = now.getFullYear();
  const dueItems = [];
  for (let year = registrationYear; year <= currentYear; year++) {
    dueMonthsForMemberYear_(member, year).forEach(month => {
      dueItems.push({ year, month });
    });
  }
  const paidKeys = {};
  const coverageIndex = paymentCoverageIndex_();
  const fundingIndex = membershipFundingIndex_();
  const memberPayments = membershipPaymentsForMember_(member.id);
  dueItems.forEach(item => {
    const paid = paidMonthsForMemberYear_(member.id, item.year, coverageIndex);
    if (paid[item.month]) paidKeys[item.year + "|" + item.month] = true;
  });
  const paidItems = dueItems.filter(item => paidKeys[item.year + "|" + item.month]);
  const unpaidItems = dueItems.filter(item => !paidKeys[item.year + "|" + item.month]);
  const totalExpected = expectedAmountForItems_(dueItems);
  const totalPaid = memberPayments
    .reduce((sum, r) => sum + (Number(r[6]) || 0), 0);
  const balanceDue = Math.max(0, Number((totalExpected - totalPaid).toFixed(2)));
  const dueYears = [...new Set(dueItems.map(item => item.year))].sort((a, b) => a - b);
  const paidYears = dueYears.filter(year => {
    const due = dueItems.filter(item => item.year === year);
    return due.length && due.every(item => paidKeys[item.year + "|" + item.month]);
  });
  const unpaidYears = dueYears.filter(year => unpaidItems.some(item => item.year === year));
  const unpaidYearDetails = dueYears
    .map(year => {
      const yearDue = dueItems.filter(item => item.year === year);
      const yearPaid = yearDue.filter(item => paidKeys[item.year + "|" + item.month]);
      const yearUnpaid = yearDue.filter(item => !paidKeys[item.year + "|" + item.month]);
      const remaining = remainingDueForYear_(member, year, fundingIndex);
      return {
        year,
        dueMonths: yearDue.map(item => item.month),
        paidMonths: yearPaid.map(item => item.month),
        unpaidMonths: yearUnpaid.map(item => item.month),
        dueCount: yearDue.length,
        paidCount: yearPaid.length,
        unpaidCount: yearUnpaid.length,
        amountDue: remaining.amountDue,
        yearlyFee: remaining.yearlyFee,
        paidAmount: remaining.fundedAmount
      };
    })
    .filter(item => item.unpaidCount > 0 || item.amountDue > 0);
  const paidUntil = paidItems.length ? paidItems[paidItems.length - 1].month.slice(0, 3) + " " + paidItems[paidItems.length - 1].year : "None";
  const eligible = balanceDue <= 0 && unpaidItems.length === 0 && clean_(member.status).toLowerCase() !== "inactive";
  const savingsBalance = savingsBalanceForMember_(member.id);
  const savingsPreview = savingsConversionPreview_(member, savingsBalance);
  const oldestUnpaidYear = unpaidYearDetails.length ? unpaidYearDetails[0].year : "";
  const currentYearlyFee = expectedAmountForItems_(dueMonthsForMemberYear_(member, currentYear).map(month => ({ year: currentYear, month })));
  const recommended = recommendedCoverageForAmount_(member, balanceDue, currentYear);
  return {
    memberId: member.id,
    memberName: member.name,
    phone: member.phone,
    registrationDate: displayDate_(member.joinDate),
    registrationYear,
    currentYear,
    totalExpected,
    totalPaid,
    balanceDue,
    savingsBalance,
    savingsPreview,
    paidYears,
    unpaidYears,
    unpaidYearDetails,
    oldestUnpaidYear,
    currentYearlyFee,
    recommendedCoverage: recommended.coverage,
    recommendedCoveredYears: recommended.coveredYears,
    recommendedAmount: recommended.amount,
    exceedsUnpaidBalance: false,
    unpaidMonths: unpaidItems.map(item => item.year + " " + item.month.slice(0, 3)),
    unpaidMonthCount: unpaidItems.length,
    paidUntil,
    eligible,
    eligibilityText: eligible ? "Eligible for church services" : "Not eligible until outstanding membership balance is cleared"
  };
}

function getMemberPaymentStatus(form) {
  return timed_("getMemberPaymentStatus", () => {
    requirePermission_(clean_(form && form.admin), "managePayments");
    const year = Number(form && form.year) || new Date().getFullYear();
    const member = findMember_(clean_(form && (form.memberId || form.memberQuery)));
    if (!member) throw new Error("Choose a valid member first.");
    const index = paymentCoverageIndex_();
    const paidSet = paidMonthsForMemberYear_(member.id, year, index);
    const dueMonths = dueMonthsForMemberYear_(member, year);
    const payments = membershipPaymentsForMember_(member.id);
    const paidMonths = dueMonths.filter(month => paidSet[month]);
    const unpaidMonths = dueMonths.filter(month => !paidSet[month]);
    const remaining = remainingDueForYear_(member, year);
    const balanceDue = remaining.amountDue;
    return {
      memberId: member.id,
      memberName: member.name,
      year,
      paidMonths,
      unpaidMonths,
      dueMonths,
      paidCount: paidMonths.length,
      unpaidCount: unpaidMonths.length,
      balanceDue,
      yearlyFee: remaining.yearlyFee,
      paidAmount: remaining.fundedAmount,
      paymentRows: payments.map(r => [displayDate_(r[1]), r[4], r[6], r[7], r[8], r[10]])
    };
  });
}

function getMemberCoverageStatus(form) {
  return timed_("getMemberCoverageStatus", () => {
    requirePermission_(clean_(form && form.admin), "managePayments");
    const member = findMember_(clean_(form && (form.memberId || form.memberQuery)));
    if (!member) throw new Error("Choose a valid member first.");
    const nowYear = new Date().getFullYear();
    let startYear = Number(form && form.startYear) || nowYear;
    let endYear = Number(form && form.endYear) || startYear;
    if (startYear > endYear) {
      const tmp = startYear;
      startYear = endYear;
      endYear = tmp;
    }
    if (endYear - startYear > 40) throw new Error("Please choose a range of 40 years or less.");
    const years = [];
    const index = paymentCoverageIndex_();
    for (let year = startYear; year <= endYear; year++) {
      const paidSet = paidMonthsForMemberYear_(member.id, year, index);
      const dueMonths = dueMonthsForMemberYear_(member, year);
      const paidMonths = dueMonths.filter(month => paidSet[month]);
      const unpaidMonths = dueMonths.filter(month => !paidSet[month]);
      const remaining = remainingDueForYear_(member, year);
      years.push({ year, dueMonths, paidMonths, unpaidMonths, dueCount: dueMonths.length, paidCount: paidMonths.length, unpaidCount: unpaidMonths.length, amountDue: remaining.amountDue, yearlyFee: remaining.yearlyFee, paidAmount: remaining.fundedAmount });
    }
    return { memberId: member.id, memberName: member.name, startYear, endYear, years };
  });
}

function refreshYearlyUnpaidMembersSheet() {
  return timed_("refreshYearlyUnpaidMembersSheet", () => {
    clearCachedMemberList_();
    const ss = ss_();
    let sh = sheetByName_(SHEETS.unpaidMembers);
    if (!sh) sh = ss.insertSheet(SHEETS.unpaidMembers);
    const existingYear = Number(sh.getRange("B2").getValue()) || new Date().getFullYear();
    sh.clear();
    sh.getRange("A1:G1").merge().setValue("Unpaid Members By Year");
    sh.getRange("A2").setValue("Year");
    sh.getRange("B2").setValue(existingYear);
    sh.getRange("A4:G4").setValues([[
      "Member ID",
      "Full Name",
      "Phone",
      "Registration Year",
      "Status",
      "Paid?",
      "Balance Due For Year"
    ]]);
    const rows = yearlyUnpaidMemberRows_(existingYear);
    if (rows.length) sh.getRange(5, 1, rows.length, 7).setValues(rows);
    sh.getRange("A1:G4").setFontWeight("bold");
    sh.getRange("A1:G1").setBackground("#1f7a3a").setFontColor("#ffffff");
    sh.getRange("A4:G4").setBackground("#e8f5e9");
    sh.setFrozenRows(4);
    SpreadsheetApp.flush();
    docPropDel_("CMS_REPORTS_STALE");
    return { ok: true, year: existingYear, count: rows.length };
  });
}

function refreshDashboardYearlyUnpaidBlock_() {
  const dash = sheetByName_(SHEETS.dashboard);
  if (!dash) return;
  const year = Number(dash.getRange("B3").getValue()) || new Date().getFullYear();
  const rows = dashboardYearlyUnpaidRows_(year, 9);
  dash.getRange("D3:H13").breakApart();
  dash.getRange("D3:H13").clearContent();
  dash.getRange("D3:H3").merge().setValue("Unpaid Members For Year " + year);
  dash.getRange("D4:H4").setValues([["Member ID", "Full Name", "Phone", "Registration Year", "Balance Due"]]);
  if (rows.length) {
    dash.getRange(5, 4, rows.length, 5).setValues(rows);
  } else {
    dash.getRange("D5:H5").merge().setValue("All active members are fully paid for " + year);
  }
  dash.getRange("D3:H4").setFontWeight("bold");
  dash.getRange("D3:H3").setBackground("#1f7a3a").setFontColor("#ffffff");
  dash.getRange("D4:H4").setBackground("#e8f5e9").setFontColor("#1f2937");
}

function dashboardYearlyUnpaidRows_(year, limit) {
  return yearlyUnpaidMemberRows_(year).slice(0, limit || 9).map(row => [
    row[0],
    row[1],
    row[2],
    row[3],
    row[6]
  ]);
}

function yearlyUnpaidMemberRows_(year) {
  const index = paymentCoverageIndex_();
  const paidByMemberYear = index.paidByMemberYear;
  const yearlyFees = precomputeYearlyFees_();
  const fees = yearlyFees[year] || { total: DEFAULT_MONTHLY_FEE * 12, byMonth: MONTHS.map(() => DEFAULT_MONTHLY_FEE) };
  const result = [];
  const members = memberIndex_().list;
  for (let mi = 0; mi < members.length; mi++) {
    const member = members[mi];
    if (!member.id) continue;
    if (clean_(member.status).toLowerCase() === "inactive") continue;
    const joinYear = member.joinDate ? member.joinDate.getFullYear() : year;
    if (joinYear > year) continue;
    const paid = paidByMemberYear[clean_(member.id) + "|" + year];
    let paidCount = 0;
    let balanceDue = 0;
    for (let i = 0; i < 12; i++) {
      if (paid && paid[MONTHS[i]]) {
        paidCount++;
      } else {
        balanceDue += fees.byMonth[i];
      }
    }
    if (paidCount < 12) {
      result.push([
        member.id,
        member.name,
        member.phone,
        joinYear,
        member.status,
        "No",
        balanceDue
      ]);
    }
  }
  return result;
}

function paidMonthsForMemberYear_(memberId, year, index) {
  const coverageIndex = index || paymentCoverageIndex_();
  const paid = coverageIndex.paidByMemberYear[clean_(memberId) + "|" + Number(year)] || {};
  return Object.assign({}, paid);
}

function monthsFromPaymentRow_(row) {
  return coverageItemsFromPaymentRow_(row).map(item => item.month);
}

function coverageItemsFromPaymentRow_(row) {
  const noteText = clean_(row[10]);
  const year = Number(row[5]) || new Date().getFullYear();
  if (clean_(row[4]) === "Yearly" && year) {
    return MONTHS.map(month => ({ year, month }));
  }
  const coverageMatch = noteText.match(/Coverage:\s*([^|]+)/i);
  if (coverageMatch) {
    return parseCoverageText_(coverageMatch[1]);
  }
  const noteMatch = noteText.match(/Months covered:\s*([^|]+)/i);
  if (noteMatch) {
    const exact = noteMatch[1].split(",").map(clean_).filter(m => MONTHS.includes(m));
    if (exact.length) return exact.map(month => ({ year, month }));
  }
  return monthsFromLabel_(clean_(row[4])).map(month => ({ year, month }));
}

function markCoverageRefreshNeeded_(memberId) {
  try {
    PropertiesService.getDocumentProperties().setProperty("CMS_COVERAGE_REFRESH_NEEDED_" + clean_(memberId), String(Date.now()));
  } catch (err) {
    // Payment rows remain the immediate source of truth if the marker cannot be saved.
  }
}

function parseCoverageText_(text) {
  const result = [];
  clean_(text).split(";").map(clean_).filter(Boolean).forEach(part => {
    const bits = part.split(":");
    const year = Number(clean_(bits[0]));
    if (!year || !bits[1]) return;
    bits[1].split(",").map(clean_).filter(m => MONTHS.includes(m)).forEach(month => {
      result.push({ year, month });
    });
  });
  return result;
}

function monthsFromLabel_(label) {
  if (!label) return [];
  const abbrMap = {};
  MONTHS.forEach(month => abbrMap[month.slice(0, 3).toLowerCase()] = month);
  const parts = label.split(",").map(clean_).filter(Boolean);
  const result = [];
  parts.forEach(part => {
    if (part.includes("-")) {
      const ends = part.split("-").map(p => clean_(p).slice(0, 3).toLowerCase());
      const start = MONTHS.indexOf(abbrMap[ends[0]]);
      const end = MONTHS.indexOf(abbrMap[ends[1]]);
      if (start >= 0 && end >= start) {
        for (let i = start; i <= end; i++) result.push(MONTHS[i]);
      }
    } else {
      const month = abbrMap[part.slice(0, 3).toLowerCase()];
      if (month) result.push(month);
    }
  });
  return [...new Set(result)];
}

function checkDuplicateMember(form) {
  const name = clean_(form.fullName);
  const phone = normalizeGermanPhone_(form.phone);
  return findDuplicateMembers_(name, phone);
}

function getDashboardSummary(admin) {
  requirePermission_(admin, "viewReports");
  return timed_("getDashboardSummary", () => {
    const live = buildLiveDashboardTotals_();
    refreshDashboardLiveTotals_(live);
    const backup = getBackupStatus_();
    return {
      year: live.year,
      activeMembers: live.activeMembers,
      income: live.income,
      expenses: live.expenses,
      net: live.net,
      paymentsCount: live.paymentsCount,
      servicePaymentsCount: live.servicePaymentsCount,
      savingsDepositsCount: live.savingsDepositsCount,
      churchTransactionsCount: live.churchTransactionsCount,
      materialInventoryCount: live.materialInventoryCount,
      membershipIncome: live.membershipIncome,
      serviceIncome: live.serviceIncome,
      savingsIncome: live.savingsIncome,
      churchIncome: live.churchIncome,
      operatingExpenses: live.operatingExpenses,
      churchExpenses: live.churchExpenses,
      autoConversionApplied: live.autoConversionApplied,
      churchTransactions: buildChurchTransactionDashboard_(),
      demographics: buildMemberDemographics_(),
      unpaidCount: yearlyUnpaidMemberRows_(live.year).length,
      reportsStale: !!docProp_("CMS_REPORTS_STALE"),
      lastBackupAt: backup.lastBackupAt,
      lastBackupDisplay: backup.lastBackupDisplay,
      lastBackupMode: backup.lastBackupMode,
      lastBackupUrl: backup.lastBackupUrl,
      dailyBackupEnabled: backup.dailyBackupEnabled,
      backupRetentionLimit: backup.retentionLimit
    };
  });
}

function getUnpaidMembersForDashboard(admin) {
  requirePermission_(admin, "viewReports");
  const now = new Date();
  const currentYear = now.getFullYear();
  const paidByMemberYear = paymentCoverageIndex_().paidByMemberYear;
  const yearlyFees = precomputeYearlyFees_();
  const unpaid = [];
  const members = memberIndex_().list;
  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    if (!m.id || clean_(m.status).toLowerCase() !== "active") continue;
    const join = coerceDate_(m.joinDate);
    const startYear = join ? join.getFullYear() : currentYear;
    let totalBalance = 0;
    const unpaidYears = [];
    for (let year = startYear; year <= currentYear; year++) {
      const paid = paidByMemberYear[clean_(m.id) + "|" + year];
      const fees = yearlyFees[year] || { byMonth: MONTHS.map(() => DEFAULT_MONTHLY_FEE) };
      let yearBalance = 0;
      let hasUnpaid = false;
      for (let i = 0; i < 12; i++) {
        if (!paid || !paid[MONTHS[i]]) {
          yearBalance += fees.byMonth[i];
          hasUnpaid = true;
        }
      }
      if (hasUnpaid) {
        totalBalance += yearBalance;
        unpaidYears.push(year);
      }
    }
    if (unpaidYears.length > 0) {
      unpaid.push({ id: m.id, name: m.name, phone: clean_(m.phone), joinYear: startYear, balanceDue: totalBalance, yearsUnpaid: unpaidYears });
    }
  }
  // Attach reminder status to each member (single log read for all)
  if (unpaid.length > 0) {
    const logRows = getReminderLogRows_();
    unpaid.forEach(m => {
      const s = checkReminderAllowed_(m.id, logRows, now);
      m.canRemind = s.allowed;
      m.lastReminderDate = s.lastDate ? displayDate_(s.lastDate) : null;
      m.lastReminderAdmin = s.lastAdmin || null;
      m.nextAllowedDate = s.nextAllowedDate ? displayDate_(s.nextAllowedDate) : null;
    });
  }
  return unpaid;
}

// ── Unpaid Reminder Log helpers ───────────────────────────────────────────

function computeNextAllowedDate_(fromDate) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + REMINDER_COOLDOWN_DAYS);
  return d;
}

function checkReminderAllowed_(memberId, logRows, now) {
  const id = clean_(memberId);
  const nowMs = (now || new Date()).getTime();
  let latest = null;
  for (let i = 0; i < logRows.length; i++) {
    const row = logRows[i];
    if (clean_(String(row[1] || "")) !== id) continue;
    const ts = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (!latest || ts > latest.ts) {
      const next = row[8] instanceof Date ? row[8] : new Date(row[8]);
      latest = { ts, admin: String(row[6] || ""), nextAllowedDate: next };
    }
  }
  if (!latest) return { allowed: true };
  const blocked = latest.nextAllowedDate.getTime() > nowMs;
  return { allowed: !blocked, lastDate: latest.ts, lastAdmin: latest.admin, nextAllowedDate: latest.nextAllowedDate };
}

function buildReminderMessage_(name, yearsUnpaid, balanceDue, gender) {
  const yearsStr = (yearsUnpaid || []).join("፣ ");
  const amount = Number(balanceDue || 0).toFixed(2);
  const n = clean_(name) || "ኣባል";
  const g = clean_(gender).toLowerCase();
  const VERSE_1 = "“ካብ ምቕባልሲ ምሃብ ዝያዳ ይባርኽ።”\n— ግብሪ ሃዋርያት 20:35";
  const VERSE_2 = "“ብጐይታ ዅሉ ሳዕ ተሐጐሱ፡ ደጊመ፤ ተሐጐሱ፡ እብል ኣሎኹ”\nፊልጲ 4:4";
  const FOOTER = "⛪ ቤተ ክርስቲያን ቅዱስ ሩፋኤል ቩፐርታል";
  if (g === "female") {
    return [
      "ሰላም “" + n + "”,",
      "",
      "ካብ ቤተ ክርስቲያን ቅዱስ ሩፋኤል ቩፐርታል ብፍቕሪ ሰላምታ ነቕርበልኪ።",
      "",
      "ብመዝገብና፣ ናይ " + yearsStr + " ኣባልነት ክፍሊትኪ (ጠቕላላ €" + amount + ") ገና ዘይተኸፍለ ከም ዘሎ ተራእዩ።",
      "",
      "እዚ መልእኽቲ ንምዝኽኻር ብፍቕሪ እዩ ዝተላእከ። እንተድኣ ኣቐዲምኪ ከፊልኪ ኮይንኪ ድማ፣ በጃኺ ነዚ መልእኽቲ ኣይተድህብሉ።",
      "",
      VERSE_1,
      "",
      "እንተ ከኣልኪ፣ ነዚ ክፍሊት ኣብ ዝቐረበ ግዜ ክትፍጽምዮ ብኽብሪ ንሓትት።",
      "",
      VERSE_2,
      "",
      "ኣብ ኣገልግሎትክን ኣብ ሕብረትክን ከኣ የጽንዕኪ።",
      "",
      FOOTER
    ].join("\n");
  }
  if (g === "male") {
    return [
      "ሰላም “" + n + "”,",
      "",
      "ካብ ቤተ ክርስቲያን ቅዱስ ሩፋኤል ቩፐርታል ብፍቕሪ ሰላምታ ነቕርበልካ።",
      "",
      "ብመዝገብና፣ ናይ " + yearsStr + " ኣባልነት ክፍሊትካ (ጠቕላላ €" + amount + ") ገና ዘይተኸፍለ ከም ዘሎ ተራእዩ።",
      "",
      "እዚ መልእኽቲ ንምዝኽኻር ብፍቕሪ እዩ ዝተላእከ። እንተድኣ ኣቐዲምካ ከፊልካ ኮይንካ ድማ፣ በጃኻ ነዚ መልእኽቲ ኣይተድህበሉ።",
      "",
      VERSE_1,
      "",
      "እንተ ኸኣለካ፣ ነዚ ክፍሊት ኣብ ዝቐረበ ግዜ ክትፍጽሞ ብኽብሪ ንሓትት።",
      "",
      VERSE_2,
      "",
      "ኣብ ኣገልግሎትካን ኣብ ሕብረትካን ከኣ የጽንዓካ።",
      "",
      FOOTER
    ].join("\n");
  }
  // neutral / unknown — plural formal register, not male-defaulting
  return [
    "ሰላም “" + n + "”,",
    "",
    "ካብ ቤተ ክርስቲያን ቅዱስ ሩፋኤል ቩፐርታል ብፍቕሪ ሰላምታ ነቕርበልኩም።",
    "",
    "ብመዝገብና፣ ናይ " + yearsStr + " ኣባልነት ክፍሊት (ጠቕላላ €" + amount + ") ገና ዘይተኸፍለ ከም ዘሎ ተራእዩ።",
    "",
    "እዚ መልእኽቲ ንምዝኽኻር ብፍቕሪ እዩ ዝተላእከ። እንተድኣ ኣቐዲምኩም ከፊልኩም ኮይንኩም ድማ፣ በጃኩም ነዚ መልእኽቲ ኣይተድህብሉ።",
    "",
    VERSE_1,
    "",
    "እንተ ኸኣልኩም፣ ነዚ ክፍሊት ኣብ ዝቐረበ ግዜ ክትፍጽምዎ ብኽብሪ ንሓትት።",
    "",
    VERSE_2,
    "",
    "ኣብ ኣገልግሎትኩምን ኣብ ሕብረትኩምን ከኣ የጽንዓኩም።",
    "",
    FOOTER
  ].join("\n");
}

function buildReminderLogRow_(now, memberId, memberName, phone, yearsUnpaid, balanceDue, admin, messageText) {
  return [
    now,
    clean_(memberId),
    clean_(memberName),
    clean_(phone),
    (yearsUnpaid || []).join(", "),
    Number(balanceDue || 0),
    clean_(admin),
    messageText,
    computeNextAllowedDate_(now)
  ];
}

function ensureReminderLogSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEETS.reminderLog);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.reminderLog);
    sh.getRange(1, 1, 1, REMINDER_LOG_HEADERS.length).setValues([REMINDER_LOG_HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, REMINDER_LOG_HEADERS.length).setFontWeight("bold").setBackground("#e8f5e9");
  }
  return sh;
}

function getReminderLogRows_() {
  const sh = sheetByName_(SHEETS.reminderLog);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, REMINDER_LOG_HEADERS.length).getValues();
}

function prepareUnpaidReminder(memberId, admin) {
  requirePermission_(admin, "viewReports");
  const id = clean_(memberId);
  if (!id) throw new Error("Member ID is required.");
  return withWriteLock_("prepareUnpaidReminder", () => {
    const now = new Date();
    const logRows = getReminderLogRows_();
    const status = checkReminderAllowed_(id, logRows, now);
    if (!status.allowed) {
      return {
        ok: false,
        blockedBy: status.lastAdmin,
        lastReminderDate: displayDate_(status.lastDate),
        nextAllowedDate: displayDate_(status.nextAllowedDate)
      };
    }
    const member = memberIndex_().list.find(m => m.id === id);
    if (!member) throw new Error("Member not found: " + id);
    const currentYear = now.getFullYear();
    const index = paymentCoverageIndex_();
    const join = coerceDate_(member.joinDate);
    const startYear = join ? join.getFullYear() : currentYear;
    let totalBalance = 0;
    const unpaidYears = [];
    for (let year = startYear; year <= currentYear; year++) {
      const paid = paidMonthsForMemberYear_(member.id, year, index);
      const due = dueMonthsForMemberYear_(member, year);
      const unpaidMonths = due.filter(month => !paid[month]);
      if (unpaidMonths.length > 0) {
        totalBalance += expectedAmountForItems_(unpaidMonths.map(month => ({ year, month })));
        unpaidYears.push(year);
      }
    }
    if (!unpaidYears.length) return { ok: false, blockedBy: null, reason: "Member has no unpaid years." };
    const phone = clean_(member.phone).replace(/[^\d]/g, "");
    if (!phone) throw new Error("Member " + id + " has no valid phone number.");
    const messageText = buildReminderMessage_(member.name, unpaidYears, totalBalance, member.gender || "");
    const logRow = buildReminderLogRow_(now, member.id, member.name, member.phone, unpaidYears, totalBalance, admin, messageText);
    ensureReminderLogSheet_().appendRow(logRow);
    return { ok: true, waUrl: "https://wa.me/" + phone + "?text=" + encodeURIComponent(messageText) };
  });
}

function buildLiveDashboardTotals_() {
  const activeMembers = currentDataRows_(SHEETS.members).filter(row => clean_(row[0]) && clean_(row[5]).toLowerCase() === "active").length;
  let income = 0;
  let expenses = 0;
  let paymentsCount = 0;
  let membershipIncome = 0;
  dataRows_(SHEETS.payments).forEach(row => {
    if (!clean_(row[0]) || isSavingsConversionPaymentRow_(row)) return;
    const amount = Number(row[6]) || 0;
    income += amount;
    membershipIncome += amount;
    paymentsCount += 1;
  });
  let servicePaymentsCount = 0;
  let serviceIncome = 0;
  currentDataRows_(SHEETS.servicePayments).forEach(row => {
    if (!clean_(row[0])) return;
    const amount = Number(row[6]) || 0;
    income += amount;
    serviceIncome += amount;
    servicePaymentsCount += 1;
  });
  let savingsDepositsCount = 0;
  let savingsIncome = 0;
  currentDataRows_(SHEETS.savingsHistory).forEach(row => {
    if (!clean_(row[0])) return;
    const amount = Number(row[4]) || 0;
    income += amount;
    savingsIncome += amount;
    savingsDepositsCount += 1;
  });
  let operatingExpenses = 0;
  currentDataRows_(SHEETS.expenses).forEach(row => {
    if (!clean_(row[7]) && !clean_(row[1]) && !clean_(row[2])) return;
    const amount = Number(row[3]) || 0;
    expenses += amount;
    operatingExpenses += amount;
  });
  let churchTransactionsCount = 0;
  let churchIncome = 0;
  let churchExpenses = 0;
  dataRows_(SHEETS.churchTransactions).forEach(row => {
    if (!clean_(row[0])) return;
    churchTransactionsCount += 1;
    const type = clean_(row[2]);
    const amount = Number(row[8]) || 0;
    if (type === "Income") {
      income += amount;
      churchIncome += amount;
    }
    if (type === "Expense") {
      expenses += amount;
      churchExpenses += amount;
    }
  });
  const materialInventoryCount = currentDataRows_(SHEETS.materialInventory).filter(row => clean_(row[0])).length;
  income = Number(income.toFixed(2));
  expenses = Number(expenses.toFixed(2));
  return {
    year: new Date().getFullYear(),
    activeMembers,
    income,
    expenses,
    net: Number((income - expenses).toFixed(2)),
    paymentsCount,
    servicePaymentsCount,
    savingsDepositsCount,
    churchTransactionsCount,
    materialInventoryCount,
    membershipIncome: Number(membershipIncome.toFixed(2)),
    serviceIncome: Number(serviceIncome.toFixed(2)),
    savingsIncome: Number(savingsIncome.toFixed(2)),
    churchIncome: Number(churchIncome.toFixed(2)),
    operatingExpenses: Number(operatingExpenses.toFixed(2)),
    churchExpenses: Number(churchExpenses.toFixed(2)),
    autoConversionApplied: Number(currentDataRows_(SHEETS.savingsConversionLog).reduce((sum, row) => sum + (Number(row[6]) || 0), 0).toFixed(2))
  };
}

function refreshDashboardLiveTotals_(live) {
  try {
    const dash = sheetByName_(SHEETS.dashboard);
    if (!dash) return;
    dash.getRange("A3:B7").setValues([
      ["Year", live.year],
      ["Active Members", live.activeMembers],
      ["Total Income", live.income],
      ["Total Expenses", live.expenses],
      ["Net Balance", live.net]
    ]);
    dash.getRange("B5:B7").setNumberFormat("€#,##0.00");
    dash.getRange("A3:A7").setFontWeight("bold");
    dash.getRange("A10:B13").setValues([
      ["Yearly Income Summary", "Amount"],
      ["Membership payments", live.membershipIncome],
      ["Service / other payments", Number((live.income - live.membershipIncome).toFixed(2))],
      ["Total income", live.income]
    ]);
    dash.getRange("A10:B10").setFontWeight("bold").setBackground("#e8f5e9");
    dash.getRange("B11:B13").setNumberFormat("€#,##0.00");
    dash.getRange("D15:H24").breakApart();
    dash.getRange("D15:H24").clearContent();
    dash.getRange("D15").setValue("Recent Membership Payments").setFontWeight("bold").setFontSize(11);
    dash.getRange("D16:H16").setValues([["Date", "Member / Source", "Type", "Year / Period", "Amount"]]);
    const recent = recentPaymentRowsForDashboard_(8);
    const recentBlock = recent.length
      ? recent.concat(Array(Math.max(0, 8 - recent.length)).fill(["", "", "", "", ""]))
      : [["No membership payments have been recorded yet.", "", "", "", ""]].concat(Array(7).fill(["", "", "", "", ""]));
    dash.getRange(17, 4, 8, 5).setValues(recentBlock);
    dash.getRange(17, 8, 8, 1).setNumberFormat("€#,##0.00");
    dash.getRange("D16:H16").setFontWeight("bold").setBackground("#1f7a3a").setFontColor("#ffffff");
    dash.getRange("D17:H24").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
    dash.getRange("D25:H34").breakApart();
    dash.getRange("D25:H34").clearContent();
    dash.getRange("D25").setValue("Recent Church Transactions").setFontWeight("bold").setFontSize(11);
    dash.getRange("D26:H26").setValues([["Date", "Category", "Description", "Amount", "Recorded By"]]);
    const recentExpenses = recentExpenseRowsForDashboard_(8);
    const expenseBlock = recentExpenses.length
      ? recentExpenses.concat(Array(Math.max(0, 8 - recentExpenses.length)).fill(["", "", "", "", ""]))
      : [["No church transactions or expenses have been recorded yet.", "", "", "", ""]].concat(Array(7).fill(["", "", "", "", ""]));
    dash.getRange(27, 4, 8, 5).setValues(expenseBlock);
    dash.getRange(27, 8, 8, 1).setNumberFormat("€#,##0.00");
    dash.getRange("D26:H26").setFontWeight("bold").setBackground("#1f7a3a").setFontColor("#ffffff");
    dash.getRange("D27:H34").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
    dash.getRange("I29:J29").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
    refreshDashboardYearlyUnpaidBlock_();
    docPropDel_("CMS_REPORTS_STALE");
  } catch (err) {
    console.log("Dashboard live totals refresh failed: " + (err && err.message ? err.message : err));
  }
}

function recentPaymentRowsForDashboard_(limit) {
  const rows = [];
  currentDataRows_(SHEETS.payments).forEach(row => {
    if (!clean_(row[0]) || isSavingsConversionPaymentRow_(row)) return;
    const date = coerceDate_(row[1]);
    if (!date) return;
    rows.push({ date, values: [displayDate_(date), clean_(row[3]), "Membership", clean_(row[5]), Number(row[6]) || 0] });
  });
  currentDataRows_(SHEETS.servicePayments).forEach(row => {
    if (!clean_(row[0])) return;
    const date = coerceDate_(row[1]);
    if (!date) return;
    rows.push({ date, values: [displayDate_(date), clean_(row[3]), clean_(row[7]) || "Service", clean_(row[5]), Number(row[6]) || 0] });
  });
  currentDataRows_(SHEETS.savingsHistory).forEach(row => {
    if (!clean_(row[0])) return;
    const date = coerceDate_(row[1]);
    if (!date) return;
    rows.push({ date, values: [displayDate_(date), clean_(row[3]), "Savings / Deposit", clean_(row[0]), Number(row[4]) || 0] });
  });
  currentDataRows_(SHEETS.churchTransactions).forEach(row => {
    if (!clean_(row[0]) || clean_(row[2]) !== "Income") return;
    const date = coerceDate_(row[1]);
    if (!date) return;
    rows.push({ date, values: [displayDate_(date), clean_(row[7]) || clean_(row[4]), clean_(row[4]) || "Church Income", clean_(row[0]), Number(row[8]) || 0] });
  });
  return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit || 8).map(item => item.values);
}

function recentExpenseRowsForDashboard_(limit) {
  const rows = [];
  currentDataRows_(SHEETS.expenses).forEach(row => {
    const date = coerceDate_(row[0]);
    if (!date) return;
    rows.push({
      date,
      values: [displayDate_(date), clean_(row[1]) || "Expense", clean_(row[2]), Number(row[3]) || 0, clean_(row[4])]
    });
  });
  currentDataRows_(SHEETS.churchTransactions).forEach(row => {
    if (!clean_(row[0]) || clean_(row[2]) !== "Expense") return;
    const date = coerceDate_(row[1]);
    if (!date) return;
    rows.push({
      date,
      values: [displayDate_(date), clean_(row[4]) || "Church Expense", clean_(row[18]) || clean_(row[7]), Number(row[8]) || 0, clean_(row[17])]
    });
  });
  return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit || 8).map(item => item.values);
}

function buildChurchTransactionDashboard_() {
  ensureTransactionInfrastructure_();
  const summary = {
    incomeByCategory: {},
    expenseByCategory: {},
    materialsReceived: 0,
    materialsSold: 0,
    materialsUsed: 0,
    materialsDistributed: 0,
    materialsBrokenLost: 0,
    currentInventoryItems: 0,
    totalCashReceived: 0,
    totalExpenses: 0,
    netBalance: 0,
    totalMaterialItems: 0,
    totalEstimatedInventoryValue: 0,
    currentInventoryValue: 0,
    lowStockItems: []
  };
  currentDataRows_(SHEETS.churchTransactions).forEach(row => {
    const type = clean_(row[2]);
    const category = clean_(row[4]) || "Uncategorized";
    const amount = Number(row[8]) || 0;
    if (type === "Income") {
      summary.incomeByCategory[category] = Number(((summary.incomeByCategory[category] || 0) + amount).toFixed(2));
      if ((clean_(row[9]) || "Cash") === "Cash") summary.totalCashReceived += amount;
    } else if (type === "Expense") {
      summary.expenseByCategory[category] = Number(((summary.expenseByCategory[category] || 0) + amount).toFixed(2));
      summary.totalExpenses += amount;
    } else if (type === "Material Donation") {
      summary.materialsReceived += Number(row[16]) || 0;
    }
  });
  currentDataRows_(SHEETS.materialInventory).forEach(row => {
    const remaining = Number(row[4]) || 0;
    const received = Number(row[3]) || 0;
    const value = Number(row[5]) || 0;
    const status = clean_(row[6]);
    summary.totalMaterialItems += received;
    summary.currentInventoryItems += remaining;
    summary.totalEstimatedInventoryValue += value;
    summary.currentInventoryValue += received > 0 ? value * (remaining / received) : 0;
    if (remaining > 0 && remaining <= 5) summary.lowStockItems.push({ itemId: clean_(row[0]), itemName: clean_(row[1]), quantityRemaining: remaining });
    if (status === "Sold") summary.materialsSold += received - remaining;
    if (status === "Used") summary.materialsUsed += received - remaining;
    if (status === "Distributed") summary.materialsDistributed += received - remaining;
    if (status === "Broken" || status === "Lost") summary.materialsBrokenLost += received - remaining;
  });
  summary.totalCashReceived = Number(summary.totalCashReceived.toFixed(2));
  summary.totalExpenses = Number(summary.totalExpenses.toFixed(2));
  summary.netBalance = Number((summary.totalCashReceived - summary.totalExpenses).toFixed(2));
  summary.totalEstimatedInventoryValue = Number(summary.totalEstimatedInventoryValue.toFixed(2));
  summary.currentInventoryValue = Number(summary.currentInventoryValue.toFixed(2));
  return summary;
}

// Returns the sheet name, row number, and display values for a payment row identified
// by its transaction ID. Used by the sidebar "Edit" flow when the caller knows the txId
// but not the sheet row (e.g. remote API tests and mobile clients).
function withWriteLock_(action, callback) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(WRITE_LOCK_WAIT_MS)) {
    throw new Error(WRITE_LOCK_BUSY_MESSAGE);
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function editType_(sheetName) {
  if (sameSheet_(sheetName, SHEETS.members)) return "member";
  if (sameSheet_(sheetName, SHEETS.payments) || sameSheet_(sheetName, SHEETS.servicePayments)) return "payment";
  if (sameSheet_(sheetName, SHEETS.expenses)) return "expense";
  return "";
}

function sameSheet_(actualName, expectedName) {
  return actualName === expectedName || (SHEET_ALIASES[expectedName] || []).includes(actualName);
}

function parseHistoryQuery_(query, index) {
  const raw = clean_(query);
  const result = { raw, searchText: raw, member: null, memberId: "" };
  if (!raw) return result;
  const parenthesized = raw.match(/\(([^()]+)\)\s*$/);
  if (parenthesized) {
    const possibleId = clean_(parenthesized[1]);
    const member = possibleId ? index.byId[possibleId.toLowerCase()] : null;
    if (member) {
      result.member = member;
      result.memberId = member.id;
      result.searchText = member.id;
      return result;
    }
    result.searchText = clean_(raw.replace(/\s*\([^()]+\)\s*$/, ""));
  }
  const directMember = index.byId[raw.toLowerCase()];
  if (directMember) {
    result.member = directMember;
    result.memberId = directMember.id;
    result.searchText = directMember.id;
  }
  return result;
}

function searchHistory(query, admin) {
  requirePermission_(admin, "viewReports");
  return timed_("searchHistory", () => {
    const index = memberIndex_();
    const parsed = parseHistoryQuery_(query, index);
    const q = clean_(parsed.searchText).toLowerCase();
    if (!q) return { members: [], payments: [], savingsHistory: [], expenses: [], churchTransactions: [], receipts: [], totalPaid: 0, totalCashReceived: 0, membershipApplied: 0, savingsCreated: 0, savingsUsed: 0, savingsRemaining: 0, yearsPaid: [], yearsUnpaid: [], historyAudit: [] };
    const members = parsed.member ? [parsed.member] : index.list.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q)
    );
    const memberIdSet = {};
    members.forEach(m => memberIdSet[m.id.toLowerCase()] = true);
    const matchesMemberId = id => !!memberIdSet[clean_(id).toLowerCase()];
    const paymentMatches = row =>
      matchesMemberId(row[2]) ||
      String(row[2]).toLowerCase().includes(q) ||
      String(row[3]).toLowerCase().includes(q) ||
      String(row[4]).toLowerCase().includes(q) ||
      String(row[5]).toLowerCase().includes(q) ||
      String(row[7]).toLowerCase().includes(q);
    const membershipPayments = dataRows_(SHEETS.payments).filter(paymentMatches);
    const servicePayments = currentDataRows_(SHEETS.servicePayments).filter(paymentMatches);
    const payments = membershipPayments.concat(servicePayments);
    const savingsHistory = sheetByName_(SHEETS.savingsHistory)
      ? currentDataRows_(SHEETS.savingsHistory).filter(r => matchesMemberId(r[2]) || String(r[2]).toLowerCase().includes(q) || String(r[3]).toLowerCase().includes(q) || String(r[0]).toLowerCase().includes(q))
      : [];
    const savingsConversionLog = sheetByName_(SHEETS.savingsConversionLog)
      ? currentDataRows_(SHEETS.savingsConversionLog).filter(r => matchesMemberId(r[1]) || String(r[1]).toLowerCase().includes(q) || String(r[2]).toLowerCase().includes(q) || String(r[4]).toLowerCase().includes(q) || String(r[10]).toLowerCase().includes(q))
      : [];
    const expenses = currentDataRows_(SHEETS.expenses).filter(r =>
      String(r[1]).toLowerCase().includes(q) ||
      String(r[2]).toLowerCase().includes(q) ||
      String(r[4]).toLowerCase().includes(q)
    );
    const churchTransactions = currentDataRows_(SHEETS.churchTransactions).filter(r =>
      matchesMemberId(r[6]) ||
      String(r[0]).toLowerCase().includes(q) ||
      String(r[2]).toLowerCase().includes(q) ||
      String(r[4]).toLowerCase().includes(q) ||
      String(r[6]).toLowerCase().includes(q) ||
      String(r[7]).toLowerCase().includes(q) ||
      String(r[15]).toLowerCase().includes(q) ||
      String(r[17]).toLowerCase().includes(q) ||
      String(r[18]).toLowerCase().includes(q)
    );
    const receipts = receiptSearchRows_(q, matchesMemberId);
    const yearsPaid = [...new Set(membershipPayments.map(r => Number(r[5])).filter(Boolean))].sort((a, b) => a - b);
    let yearsUnpaid = [];
    if (members.length === 1) yearsUnpaid = historyUnpaidYearsForMember_(members[0]);
    const financeSummary = memberHistoryFinanceSummary_(members.length === 1 ? members[0] : null, membershipPayments, servicePayments, savingsHistory, savingsConversionLog);
    const totalPaid = financeSummary.membershipApplied;
    return {
      members: members.map(m => [m.id, m.name, m.phone, m.city, m.status, m.gender || "", m.birthDate ? displayDate_(m.birthDate) : "", calculateAge_(m.birthDate)]),
      payments: payments.map(r => [displayDate_(r[1]), r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[10]]),
      savingsHistory: savingsHistory.map(r => [displayDate_(r[1]), r[0], r[2], r[3], r[4], r[5], r[8], r[9], r[10], r[11], r[7]]),
      savingsConversionLog: savingsConversionLog.map(r => [displayDate_(r[0]), r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[10]]),
      expenses: expenses.map(r => [displayDate_(r[0]), r[1], r[2], r[3], r[4], r[5]]),
      churchTransactions: churchTransactions.map(r => [displayDate_(r[1]), r[2], r[4], r[7], r[8], r[9], r[17], r[18]]),
      receipts,
      totalPaid,
      totalCashReceived: financeSummary.totalCashReceived,
      membershipApplied: financeSummary.membershipApplied,
      savingsCreated: financeSummary.savingsCreated,
      savingsUsed: financeSummary.savingsUsed,
      savingsRemaining: financeSummary.savingsRemaining,
      servicePaymentsTotal: financeSummary.servicePaymentsTotal,
      historyAudit: financeSummary.audit,
      financeSummary,
      yearsPaid,
      yearsUnpaid
    };
  });
}

function memberHistoryFinanceSummary_(member, membershipPayments, servicePayments, savingsHistory, savingsConversionLog) {
  const membershipRows = membershipPayments || [];
  const serviceRows = servicePayments || [];
  const savingsRows = savingsHistory || [];
  const conversionRows = savingsConversionLog || [];
  const round = value => Number(Number(value || 0).toFixed(2));
  const membershipApplied = round(membershipRows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const externalMembershipCash = round(membershipRows
    .filter(row => !isSavingsConversionPaymentRow_(row))
    .reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const servicePaymentsTotal = round(serviceRows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const savingsCreated = round(savingsRows.reduce((sum, row) => sum + (Number(row[4]) || 0), 0));
  const savingsUsedFromHistory = round(savingsRows.reduce((sum, row) => sum + (Number(row[10]) || 0), 0));
  const savingsUsedFromLog = round(conversionRows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const savingsUsed = conversionRows.length ? savingsUsedFromLog : savingsUsedFromHistory;
  const savingsRemaining = round(savingsCreated - savingsUsed);
  const totalCashReceived = round(externalMembershipCash + servicePaymentsTotal + savingsCreated);
  return {
    totalCashReceived,
    membershipApplied,
    externalMembershipCash,
    servicePaymentsTotal,
    savingsCreated,
    savingsUsed,
    savingsRemaining,
    audit: [
      "Total cash received = external membership cash + service payments + savings deposits.",
      "Membership applied includes internal savings-conversion coverage rows.",
      "External membership cash: " + externalMembershipCash.toFixed(2),
      "Service payments: " + servicePaymentsTotal.toFixed(2),
      "Savings created: " + savingsCreated.toFixed(2),
      "Savings used: " + savingsUsed.toFixed(2),
      "Savings remaining: " + savingsRemaining.toFixed(2),
      "Membership applied: " + membershipApplied.toFixed(2)
    ]
  };
}

function historyUnpaidYearsForMember_(member) {
  if (!member) return [];
  const now = new Date();
  const join = coerceDate_(member.joinDate) || new Date(now.getFullYear(), 0, 1);
  const coverageIndex = paymentCoverageIndex_();
  const unpaidYears = [];
  for (let year = join.getFullYear(); year <= now.getFullYear(); year++) {
    const paid = paidMonthsForMemberYear_(member.id, year, coverageIndex);
    const dueMonths = dueMonthsForMemberYear_(member, year);
    if (dueMonths.some(month => !paid[month])) unpaidYears.push(year);
  }
  return unpaidYears;
}


function searchReceipts(query, admin) {
  requirePermission_(admin, "viewReports");
  return timed_("searchReceipts", () => {
    const q = clean_(query).toLowerCase();
    if (!q) return [];
    return receiptSearchRows_(q, () => false);
  });
}

function receiptSearchRows_(q, matchesMemberId) {
  return currentDataRows_(SHEETS.receipts).filter(r => {
    const dateText = displayDate_(r[1]).toLowerCase();
    return (matchesMemberId && matchesMemberId(r[2])) ||
      clean_(r[0]).toLowerCase().includes(q) ||
      clean_(r[2]).toLowerCase().includes(q) ||
      clean_(r[3]).toLowerCase().includes(q) ||
      dateText.includes(q) ||
      clean_(r[4]).toLowerCase().includes(q) ||
      clean_(r[14]).toLowerCase().includes(q);
  }).map(r => [
    clean_(r[0]),
    displayDate_(r[1]),
    clean_(r[2]),
    clean_(r[3]),
    clean_(r[4]),
    clean_(r[5]),
    Number(r[7] || 0),
    clean_(r[8]),
    clean_(r[10]),
    receiptStatus_(r)
  ]);
}

function findMember_(query) {
  const q = clean_(query).toLowerCase();
  if (!q) return null;
  const index = memberIndex_();
  if (index.byId[q]) return index.byId[q];
  const phoneQ = q.replace(/\s+/g, "");
  if (index.byPhone[phoneQ]) return index.byPhone[phoneQ];
  return index.list.find(m =>
    m.phone.toLowerCase().replace(/\s+/g, "").includes(phoneQ) ||
    m.name.toLowerCase() === q ||
    m.name.toLowerCase().includes(q)
  ) || null;
}

function findDuplicateMembers_(name, phone) {
  const normalizedName = clean_(name).toLowerCase();
  const normalizedPhone = clean_(phone).replace(/\s+/g, "");
  if (!normalizedName && !normalizedPhone) return [];
  return memberIndex_().list.filter(m => {
    const rowName = m.name.toLowerCase();
    const rowPhone = m.phone.replace(/\s+/g, "");
    return (normalizedName && rowName === normalizedName) || (normalizedPhone && rowPhone === normalizedPhone);
  }).map(m => ({ id: m.id, name: m.name, phone: m.phone, status: m.status }));
}

function findDuplicateMembersByName_(name) {
  const normalizedName = clean_(name).toLowerCase();
  if (!normalizedName) return [];
  return memberIndex_().list.filter(m => m.name.toLowerCase() === normalizedName)
    .map(m => ({ id: m.id, name: m.name, phone: m.phone, status: m.status }));
}

function assertUniqueMemberPhone_(phone, currentRowNumber) {
  const normalizedPhone = normalizeGermanPhone_(phone).replace(/\s+/g, "");
  if (!normalizedPhone) return;
  const duplicate = memberIndex_().list.find(m =>
    clean_(m.phone).replace(/\s+/g, "") === normalizedPhone &&
    Number(m.rowNumber || 0) !== Number(currentRowNumber || 0)
  );
  if (duplicate) throw new Error("This phone number is already registered to another member.");
}

function assertUniqueMemberId_(memberId, currentRowNumber) {
  const normalizedId = clean_(memberId).toLowerCase();
  if (!normalizedId) throw new Error("Member ID is required.");
  const duplicate = memberIndex_().list.find(m =>
    clean_(m.id).toLowerCase() === normalizedId &&
    Number(m.rowNumber || 0) !== Number(currentRowNumber || 0)
  );
  if (duplicate) throw new Error("Member ID already exists. Please use a unique Member ID.");
}

function appendReceipt_(receiptId, date, memberId, memberName, type, monthLabel, year, amount, method, recordedBy, receiptUrl) {
  upsertReceipt_(receiptId, date, memberId, memberName, type, monthLabel, year, amount, method, recordedBy, receiptUrl);
}

function appendPaymentRow_(sheetName, values, coverageNote) {
  appendPaymentRows_(sheetName, [values], [coverageNote || ""]);
}

function appendPaymentRows_(sheetName, rows, coverageNotes) {
  const sh = ensurePaymentSheetColumns_(sheetName);
  const normalized = rows.map(values => {
    const row = values.slice(0, PAYMENT_HEADERS.length);
    while (row.length < PAYMENT_HEADERS.length) row.push("");
    return row;
  });
  if (!normalized.length) return;
  const startRow = appendRowNumber_(sheetName, sh);
  sh.getRange(startRow, 1, normalized.length, PAYMENT_HEADERS.length).setValues(normalized);
  advanceAppendRow_(sheetName, startRow + normalized.length);
}

function logAction_(action, sheetName, recordId, admin, beforeValue, afterValue, reason) {
  try {
    sh_(SHEETS.audit).appendRow(
      [new Date(), action, sheetName, recordId, admin, clean_(reason), beforeValue, afterValue]
    );
  } catch (err) {
    // Audit logging must not block daily data entry.
  }
}

function recordSystemError_(err, context) {
  try {
    const props = PropertiesService.getDocumentProperties();
    props.setProperty("CMS_LAST_ERROR_AT", new Date().toISOString());
    props.setProperty("CMS_LAST_ERROR_CONTEXT", clean_(context));
    props.setProperty("CMS_LAST_ERROR_MESSAGE", err && err.message ? err.message : String(err));
    logAction_("SYSTEM_ERROR", "System", clean_(context), "", "", err && err.message ? err.message : String(err));
  } catch (logErr) {
    // Error tracking must never block the original operation.
  }
}

function sumPaymentsForMonth_(sheetName, year, monthIndex) {
  return rows_(sheetName).reduce((sum, r) => {
    const date = coerceDate_(r[1]);
    if (!date || date.getFullYear() !== year || date.getMonth() + 1 !== monthIndex) return sum;
    return sum + (Number(r[6]) || 0);
  }, 0);
}

function sumExpensesForMonth_(year, monthIndex) {
  return rows_(SHEETS.expenses).reduce((sum, r) => {
    const date = coerceDate_(r[0]);
    if (!date || date.getFullYear() !== year || date.getMonth() + 1 !== monthIndex) return sum;
    return sum + (Number(r[3]) || 0);
  }, 0);
}

function coerceDate_(value) {
  if (!value) return null;
  const date = Object.prototype.toString.call(value) === "[object Date]" ? value : new Date(value);
  return isNaN(date) ? null : date;
}

function getSelectedMonths_(form) {
  const raw = Array.isArray(form.months) ? form.months : [form.month];
  const months = raw.map(clean_).filter(Boolean);
  if (!months.length) months.push(MONTHS[new Date().getMonth()]);
  const invalid = months.filter(m => !MONTHS.includes(m));
  if (invalid.length) throw new Error("Invalid month selected: " + invalid.join(", "));
  return [...new Set(months)];
}

function getSelectedCoverage_(form, member, amount) {
  let items = [];
  const rawCoverage = clean_(form.coverage);
  if (rawCoverage) {
    try {
      const parsed = JSON.parse(rawCoverage);
      if (Array.isArray(parsed)) {
        parsed.forEach(entry => {
          const year = Number(entry.year);
          const months = Array.isArray(entry.months) ? entry.months : [];
          months.map(clean_).forEach(month => {
            if (year && MONTHS.includes(month)) items.push({ year, month });
          });
        });
      }
    } catch (err) {
      throw new Error("Coverage selection could not be read. Please reload and try again.");
    }
  }
  if (!items.length && member && Number(amount) > 0) {
    items = autoCoverageForAmount_(member, Number(amount));
  }
  if (!items.length) {
    const year = Number(form.year) || new Date().getFullYear();
    items = getSelectedMonths_(form).map(month => ({ year, month }));
  }
  const seen = {};
  items = items.filter(item => {
    const key = item.year + "|" + item.month;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).sort((a, b) => a.year - b.year || MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
  if (!items.length) throw new Error("Choose at least one membership month.");
  return items;
}

function autoCoverageForAmount_(member, amount) {
  const nowYear = new Date().getFullYear();
  const unpaid = chronologicalUnpaidItems_(member, nowYear);
  const grouped = coverageByYear_(unpaid);
  const fundingIndex = membershipFundingIndex_();
  const selected = [];
  let remaining = Number(amount) || 0;
  Object.keys(grouped).map(Number).sort((a, b) => a - b).forEach(year => {
    if (remaining < 0.0001) return;
    const items = grouped[year].map(month => ({ year, month }));
    const due = remainingDueForYear_(member, year, fundingIndex).amountDue;
    if (due > 0 && remaining + 0.001 >= due) {
      selected.push.apply(selected, items);
      remaining = Number((remaining - due).toFixed(2));
    }
  });
  if (!selected.length && unpaid.length) {
    const oldestYear = unpaid[0].year;
    selected.push.apply(selected, (grouped[oldestYear] || []).map(month => ({ year: oldestYear, month })));
  }
  return selected;
}

function recommendedCoverageForAmount_(member, amount, maxYear) {
  const nowYear = Number(maxYear) || new Date().getFullYear();
  const unpaid = chronologicalUnpaidItems_(member, nowYear);
  const grouped = coverageByYear_(unpaid);
  const fundingIndex = membershipFundingIndex_();
  const selected = [];
  let amountApplied = 0;
  let unpaidBalance = 0;
  let remaining = Number(amount) || 0;
  Object.keys(grouped).map(Number).sort((a, b) => a - b).forEach(year => {
    const items = grouped[year].map(month => ({ year, month }));
    const due = remainingDueForYear_(member, year, fundingIndex).amountDue;
    unpaidBalance = Number((unpaidBalance + due).toFixed(2));
    if (remaining < 0.0001) return;
    if (due > 0 && remaining + 0.001 >= due) {
      selected.push.apply(selected, items);
      remaining = Number((remaining - due).toFixed(2));
      amountApplied = Number((amountApplied + due).toFixed(2));
    }
  });
  const selectedGrouped = coverageByYear_(selected);
  const coverage = Object.keys(selectedGrouped).map(Number).sort((a, b) => a - b).map(year => ({
    year,
    months: selectedGrouped[year]
  }));
  const coveredYears = coverage.map(item => item.year);
  return {
    coverage,
    coveredYears,
    numberOfYears: coveredYears.length,
    amountApplied,
    remainingAmount: Math.max(0, Number((Number(amount || 0) - amountApplied).toFixed(2))),
    unpaidBalance,
    exceedsUnpaidBalance: Number(amount || 0) > unpaidBalance + 0.001
  };
}

function isHistoricalCoverage_(items, paymentDate) {
  if (!items || !items.length) return false;
  const paidOn = coerceDate_(paymentDate) || new Date();
  return items.some(item => item.year < paidOn.getFullYear());
}

function coverageByYear_(items) {
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.year]) grouped[item.year] = [];
    grouped[item.year].push(item.month);
  });
  Object.keys(grouped).forEach(year => {
    grouped[year] = [...new Set(grouped[year])].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  });
  return grouped;
}

function coverageText_(items) {
  const grouped = coverageByYear_(items);
  return Object.keys(grouped).sort().map(year => year + ":" + grouped[year].join(",")).join("; ");
}

function coverageYearLabel_(items) {
  const years = [...new Set(items.map(item => item.year))].sort((a, b) => a - b);
  return years.length === 1 ? String(years[0]) : years[0] + "-" + years[years.length - 1];
}

function coveragePeriodLabel_(items) {
  const grouped = coverageByYear_(items);
  const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  if (!years.length) return "";
  const labels = years.map(year => year + " " + monthRangeLabel_(grouped[year]));
  const fullYears = years.filter(year => grouped[year].length === 12);
  if (years.length > 2 && fullYears.length === years.length) return years[0] + "-" + years[years.length - 1] + " Jan-Dec";
  if (labels.length <= 4) return labels.join("; ");
  return labels.slice(0, 2).join("; ") + "; ...; " + labels[labels.length - 1];
}

function updateMembershipCoverage_(memberId, memberName, items, txId) {
  const sh = ensureCoverageSheet_();
  const grouped = coverageByYear_(items);
  const rowByYear = paymentCoverageIndex_().coverageRowByMemberYear || {};
  const existingUpdates = [];
  const newRows = [];
  Object.keys(grouped).forEach(yearText => {
    const year = Number(yearText);
    let rowNumber = rowByYear[memberId + "|" + year];
    let rowValues;
    if (rowNumber) {
      rowValues = sh.getRange(rowNumber, 1, 1, 18).getValues()[0];
      while (rowValues.length < 18) rowValues.push("");
    } else {
      rowValues = [
        memberId, memberName, year,
        "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", ""
      ];
    }
    rowValues[0] = memberId;
    rowValues[1] = memberName;
    rowValues[2] = year;
    grouped[year].forEach(month => {
      rowValues[3 + MONTHS.indexOf(month)] = "Paid";
    });
    const missing = MONTHS.filter(month => clean_(rowValues[3 + MONTHS.indexOf(month)]).toLowerCase() !== "paid");
    rowValues[15] = missing.map(month => month.slice(0, 3)).join(", ");
    rowValues[16] = txId;
    rowValues[17] = new Date();
    if (rowNumber) existingUpdates.push({ rowNumber, rowValues });
    else newRows.push(rowValues);
  });
  existingUpdates.forEach(item => sh.getRange(item.rowNumber, 1, 1, 18).setValues([item.rowValues]));
  if (newRows.length) {
    const startRow = appendRowNumber_(SHEETS.coverage, sh);
    sh.getRange(startRow, 1, newRows.length, 18).setValues(newRows);
    advanceAppendRow_(SHEETS.coverage, startRow + newRows.length);
  }
}

function assertCoverageIsUnpaid_(memberId, items) {
  const member = findMember_(memberId);
  if (!member) throw new Error("Choose a valid member first.");
  const index = paymentCoverageIndex_();
  const join = coerceDate_(member.joinDate);
  const joinYear = join ? join.getFullYear() : null;
  if (joinYear) {
    const beforeRegistration = items.filter(item => Number(item.year) < joinYear);
    if (beforeRegistration.length) {
      throw new Error("A member cannot be charged before their registration year (" + joinYear + ").");
    }
  }
  const duplicates = [];
  items.forEach(item => {
    const paid = paidMonthsForMemberYear_(memberId, item.year, index);
    if (paid[item.month]) duplicates.push(item.year + " " + item.month.slice(0, 3));
  });
  if (duplicates.length) {
    throw new Error("These membership months are already marked paid: " + duplicates.join(", ") + ". Use Service Payment for extra donations.");
  }
  const selectedKeys = {};
  items.forEach(item => selectedKeys[item.year + "|" + item.month] = true);
  const maxYear = Math.max.apply(null, items.map(item => item.year));
  const unpaid = chronologicalUnpaidItems_(member, maxYear, index);
  const expected = unpaid.slice(0, items.length);
  const expectedKeys = {};
  expected.forEach(item => expectedKeys[item.year + "|" + item.month] = true);
  const skippedOldDebt = expected.some(item => !selectedKeys[item.year + "|" + item.month]);
  const selectedTooNew = items.some(item => !expectedKeys[item.year + "|" + item.month]);
  if (skippedOldDebt || selectedTooNew) {
    const next = unpaid.length ? unpaid[0].year + " " + unpaid[0].month.slice(0, 3) : "none";
    throw new Error("Payment must start from the oldest unpaid membership period. Next unpaid period starts at: " + next + ".");
  }
}

function assertMembershipCoverageIsFullYears_(member, items) {
  if (!member || !items || !items.length) return;
  const index = paymentCoverageIndex_();
  const grouped = coverageByYear_(items);
  const selectedYears = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  for (const year of selectedYears) {
    const unpaidMonths = dueMonthsForMemberYear_(member, year)
      .filter(month => !paidMonthsForMemberYear_(member.id, year, index)[month]);
    const selected = {};
    (grouped[year] || []).forEach(month => selected[month] = true);
    const missing = unpaidMonths.filter(month => !selected[month]);
    if (missing.length) {
      const required = expectedAmountForItems_(unpaidMonths.map(month => ({ year, month })));
      throw new Error("Amount is not enough to fully pay this year. Add it to Savings or enter €" + Number(required || 0).toFixed(2) + ".");
    }
  }
}

// Business rule: membership is charged per full year, never prorated.
// A member who joins in October still owes the full yearly fee for that year.
// No fee is charged before the registration year (year < joinYear returns []).
function dueMonthsForMemberYear_(member, year) {
  const join = coerceDate_(member && member.joinDate);
  if (!join) return MONTHS;
  const joinYear = join.getFullYear();
  if (year < joinYear) return [];
  return MONTHS;
}

function chronologicalUnpaidItems_(member, maxYear, index) {
  const join = coerceDate_(member && member.joinDate);
  const startYear = join ? join.getFullYear() : maxYear;
  const coverageIndex = index || paymentCoverageIndex_();
  const result = [];
  for (let year = startYear; year <= maxYear; year++) {
    const paid = paidMonthsForMemberYear_(member.id, year, coverageIndex);
    dueMonthsForMemberYear_(member, year).forEach(month => {
      if (!paid[month]) result.push({ year, month });
    });
  }
  return result;
}

function monthRangeLabel_(selectedMonths) {
  const ordered = [...new Set(selectedMonths)]
    .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  const abbr = month => month.slice(0, 3);
  const indexes = ordered.map(m => MONTHS.indexOf(m));
  const contiguous = indexes.every((idx, i) => i === 0 || idx === indexes[i - 1] + 1);
  if (ordered.length === 1) return abbr(ordered[0]);
  if (contiguous) return abbr(ordered[0]) + "-" + abbr(ordered[ordered.length - 1]);
  return ordered.map(abbr).join(", ");
}

function normalizeGermanPhone_(value) {
  const original = clean_(value);
  if (!original) return "";
  const compact = original.replace(/[\s().-]/g, "");
  let national = "";
  if (/^\+49\d+$/.test(compact)) national = compact.slice(3);
  else if (/^0049\d+$/.test(compact)) national = compact.slice(4);
  else if (/^0\d+$/.test(compact)) national = compact.slice(1);
  const valid = /^1[567]\d{8,9}$/.test(national);
  if (!valid) {
    throw new Error("Please enter a valid German phone number.");
  }
  return "+49" + national;
}


function clean_(value) {
  return String(value == null ? "" : value).trim();
}

function displayDate_(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function displayEditValue_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value == null ? "" : String(value);
}

