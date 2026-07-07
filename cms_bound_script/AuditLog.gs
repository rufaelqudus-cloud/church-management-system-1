// ─────────────────────────────────────────────────────────────
// Audit Log Archive
// ─────────────────────────────────────────────────────────────

function ensureAuditArchiveSheet_(name) {
  const ss = ss_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange("A1").setValue(name + " — Audit Log archive");
    sheet.getRange(2, 1, 1, AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]);
    sheet.setFrozenRows(2);
  }
  return sheet;
}

function listAuditArchiveSheetsInternal_() {
  return ss_().getSheets()
    .filter(function(sh) { return /^Audit Log (\d{4}(-\d{4})?|Archive \d{4})/.test(sh.getName()); })
    .map(function(sh) {
      var name = sh.getName();
      var rowCount = Math.max(0, sh.getLastRow() - 2);
      // Try to read first/last date from data rows
      var firstDate = "", lastDate = "";
      try {
        if (rowCount > 0) {
          firstDate = displayDate_(coerceDate_(sh.getRange(3, 1).getValue()));
          lastDate = displayDate_(coerceDate_(sh.getRange(sh.getLastRow(), 1).getValue()));
        }
      } catch (e) {}
      return { name: name, rowCount: rowCount, firstDate: firstDate, lastDate: lastDate };
    });
}

function listAuditArchiveSheets(admin) {
  requirePermission_(admin, "viewReports");
  return listAuditArchiveSheetsInternal_();
}

function archiveAuditLogs(admin, options) {
  requirePermission_(clean_(admin), "manageSettings");
  var opts = options || {};
  var dryRun = opts.dryRun !== false; // default true — safe
  var archiveBefore = opts.archiveBeforeDate ? coerceDate_(opts.archiveBeforeDate) : null;
  if (!archiveBefore) throw new Error("archiveBeforeDate is required (e.g. '2026-01-01').");
  var keepRecentRows = Math.max(0, Number(opts.keepRecentRows || 0));

  var sh = sh_(SHEETS.audit);
  var lastRow = sh.getLastRow();
  if (lastRow < 3) {
    return { ok: true, dryRun: dryRun, rowsToArchive: 0, message: "Audit log has no data rows." };
  }

  var width = AUDIT_HEADERS.length;
  var values = sh.getRange(3, 1, lastRow - 2, width).getValues();

  var toArchive = [];
  var invalidDateRows = [];
  values.forEach(function(row, i) {
    var date = coerceDate_(row[0]);
    if (!date) {
      invalidDateRows.push({ sheetRow: i + 3, rawValue: String(row[0] || "") });
    } else if (date < archiveBefore) {
      toArchive.push({ sheetRow: i + 3, row: row, date: date });
    }
  });

  // Apply keepRecentRows — protect N most-recent rows that match archive criteria
  if (keepRecentRows > 0 && toArchive.length > keepRecentRows) {
    toArchive.sort(function(a, b) { return b.date - a.date; }); // newest first
    toArchive.splice(0, keepRecentRows); // drop the newest keepRecentRows from archive list
    toArchive.sort(function(a, b) { return a.sheetRow - b.sheetRow; }); // restore sheet order
  }

  if (!toArchive.length) {
    return {
      ok: true, dryRun: dryRun, rowsToArchive: 0,
      invalidDateRows: invalidDateRows.length,
      message: "No rows match the archive criteria (archiveBeforeDate=" + opts.archiveBeforeDate + ")."
    };
  }

  var dates = toArchive.map(function(r) { return r.date; });
  var minYear = dates.reduce(function(m, d) { return Math.min(m, d.getFullYear()); }, Infinity);
  var maxYear = dates.reduce(function(m, d) { return Math.max(m, d.getFullYear()); }, -Infinity);
  var archiveSheetName = "Audit Log " + minYear + (minYear !== maxYear ? "-" + maxYear : "");
  var earliest = dates.reduce(function(a, b) { return a < b ? a : b; });
  var latest = dates.reduce(function(a, b) { return a > b ? a : b; });
  var dateRange = displayDate_(earliest) + " – " + displayDate_(latest);

  if (dryRun) {
    return {
      ok: true, dryRun: true,
      rowsToArchive: toArchive.length,
      invalidDateRows: invalidDateRows.length,
      dateRange: dateRange,
      archiveSheetName: archiveSheetName,
      minYear: minYear, maxYear: maxYear,
      safe: invalidDateRows.length === 0,
      message: "Dry run complete. " + toArchive.length + " rows would be archived to ‘" + archiveSheetName + "’. No data changed."
    };
  }

  // Real archive — inside write lock
  return withWriteLock_("archiveAuditLogs", function() {
    var archiveSheet = ensureAuditArchiveSheet_(archiveSheetName);
    var beforeCount = Math.max(0, archiveSheet.getLastRow() - 2);

    // Copy rows to archive sheet
    var rowData = toArchive.map(function(r) { return r.row; });
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, rowData.length, width).setValues(rowData);
    SpreadsheetApp.flush();

    // Verify copy
    var afterCount = Math.max(0, archiveSheet.getLastRow() - 2);
    var copied = afterCount - beforeCount;
    if (copied !== toArchive.length) {
      return {
        ok: false, dryRun: false,
        error: "Copy verification failed: expected " + toArchive.length + " rows, verified " + copied + ". Active Audit Log NOT modified — retry is safe.",
        rowsCopied: copied, rowsExpected: toArchive.length
      };
    }

    // Delete rows from active sheet (reverse order to preserve row numbers)
    var rowNumbers = toArchive.map(function(r) { return r.sheetRow; }).sort(function(a, b) { return b - a; });
    rowNumbers.forEach(function(rowNumber) { sh.deleteRow(rowNumber); });
    SpreadsheetApp.flush();

    // Write audit entry AFTER deletion (so it is NOT counted in this archive batch)
    var summaryMsg = "Archived " + copied + " rows (" + dateRange + ") to ‘" + archiveSheetName + "’";
    logAction_("ARCHIVE_AUDIT_LOG", SHEETS.audit, archiveSheetName, clean_(admin), "", summaryMsg);

    return {
      ok: true, dryRun: false,
      rowsArchived: copied, archiveSheetName: archiveSheetName,
      dateRange: dateRange, minYear: minYear, maxYear: maxYear,
      invalidDateRows: invalidDateRows.length,
      message: summaryMsg
    };
  });
}

function searchAuditLogs(admin, options) {
  requirePermission_(clean_(admin), "viewReports");
  var opts = options || {};
  var q = clean_(opts.query || "").toLowerCase();
  var scope = clean_(opts.scope || "active"); // "active" | "archived" | "both"
  var startDate = opts.startDate ? coerceDate_(opts.startDate) : null;
  var endDate = opts.endDate ? coerceDate_(opts.endDate) : null;

  function matchesRow(row) {
    var d = coerceDate_(row[0]);
    if (startDate && (!d || d < startDate)) return false;
    if (endDate && (!d || d > endDate)) return false;
    if (q && !row.some(function(cell) { return String(cell || "").toLowerCase().includes(q); })) return false;
    return true;
  }

  var results = [];

  function readSheet(sh, sourceName) {
    if (!sh || sh.getLastRow() < 3) return;
    var values = sh.getRange(3, 1, sh.getLastRow() - 2, AUDIT_HEADERS.length).getValues();
    values.filter(matchesRow).forEach(function(row) {
      results.push({
        source: sourceName,
        date: displayDate_(coerceDate_(row[0])),
        action: String(row[1] || ""),
        sheet: String(row[2] || ""),
        recordId: String(row[3] || ""),
        user: String(row[4] || ""),
        reason: String(row[5] || ""),
        oldValue: String(row[6] || ""),
        newValue: String(row[7] || "")
      });
    });
  }

  if (scope === "active" || scope === "both") {
    readSheet(sh_(SHEETS.audit), "active");
  }
  if (scope === "archived" || scope === "both") {
    listAuditArchiveSheetsInternal_().forEach(function(info) {
      readSheet(ss_().getSheetByName(info.name), info.name);
    });
  }

  // Sort by date descending (newest first)
  results.sort(function(a, b) {
    var da = coerceDate_(a.date) || new Date(0);
    var db = coerceDate_(b.date) || new Date(0);
    return db - da;
  });

  return { ok: true, total: results.length, scope: scope, results: results };
}

// Restores all rows from an archive sheet back into the active Audit Log.
// The archive sheet is NOT modified (it stays as a permanent backup).
function restoreAuditArchive(admin, options) {
  requirePermission_(clean_(admin), "manageSettings");
  var opts = options || {};
  var archiveSheetName = clean_(opts.archiveSheetName || "");
  if (!archiveSheetName) throw new Error("archiveSheetName is required.");
  var ss = ss_();
  var archiveSheet = ss.getSheetByName(archiveSheetName);
  if (!archiveSheet) throw new Error("Archive sheet '" + archiveSheetName + "' not found.");
  if (archiveSheet.getLastRow() < 3) {
    return { ok: true, rowsRestored: 0, message: "Archive sheet is empty — nothing to restore." };
  }
  var width = AUDIT_HEADERS.length;
  var values = archiveSheet.getRange(3, 1, archiveSheet.getLastRow() - 2, width).getValues();
  var validRows = values.filter(function(row) { return row[0] || row[1] || row[2]; });
  if (!validRows.length) {
    return { ok: true, rowsRestored: 0, message: "No non-empty rows found in archive." };
  }
  var activeSh = sh_(SHEETS.audit);
  var insertAt = activeSh.getLastRow() + 1;
  activeSh.getRange(insertAt, 1, validRows.length, width).setValues(validRows);
  SpreadsheetApp.flush();
  logAction_("RESTORE_AUDIT_ARCHIVE", SHEETS.audit, archiveSheetName, clean_(admin), "", "Restored " + validRows.length + " rows from '" + archiveSheetName + "'");
  return {
    ok: true, rowsRestored: validRows.length, archiveSheetName: archiveSheetName,
    message: "Restored " + validRows.length + " rows from '" + archiveSheetName + "' to active Audit Log. Archive sheet was not modified."
  };
}

