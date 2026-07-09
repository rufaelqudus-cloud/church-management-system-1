//   • 2015-01-01 → €5/month  (pre-2026 baseline for all historical years)
//   • 2026-01-01 → €5/month  (current fee)
// Only callable by Super Admins. Safe to call repeatedly — idempotent.
function restoreFeeHistoryBaseline(admin) {
  requirePermission_(clean_(admin), "manageSettings");
  const sh = configSheet_();
  // Write column headers
  sh.getRange("F10:J10").setValues([FEE_HISTORY_HEADERS]);
  // Wipe any existing fee history rows (F11 downward up to current last row)
  const lastRow = Math.max(sh.getLastRow(), 11);
  if (lastRow >= 11) {
    sh.getRange("F11:J" + lastRow).clearContent();
  }
  // Write the two canonical entries
  sh.getRange("F11:J12").setValues([
    [new Date(2015, 0, 1), 0, DEFAULT_MONTHLY_FEE, "System", "Historical baseline: €5/month (€60/year) — all years up to 2025"],
    [MEMBERSHIP_FEE_2026_EFFECTIVE_DATE, DEFAULT_MONTHLY_FEE, MEMBERSHIP_FEE_2026_MONTHLY, "System", "Membership fee for 2026: €5/month (€60/year)"]
  ]);
  logFeeChangeAudit_(admin, 2015, 0, DEFAULT_MONTHLY_FEE, "Restored historical baseline: €5/month (€60/year) pre-2026");
  logFeeChangeAudit_(admin, 2026, DEFAULT_MONTHLY_FEE, MEMBERSHIP_FEE_2026_MONTHLY, "Restored 2026 fee: €5/month (€60/year)");
  invalidateFastCaches_([SHEETS.config]);
  clearCachedMembershipFundingIndex_();
  clearDashboardSummaryCache_();
  return getMembershipFeeSettings();
}

// ─────────────────────────────────────────────────────────────
// Fee History Management — undo, preview, export
// ─────────────────────────────────────────────────────────────

function undoLastFeeChange(admin) {
  requirePermission_(clean_(admin), "manageSettings");
  return withWriteLock_("undoLastFeeChange", () => {
    ensureFeeHistoryTable_();
    const sh = configSheet_();
    const lastDataRow = Math.max(sh.getLastRow(), 11);
    const values = sh.getRange("F11:J" + lastDataRow).getValues();
    const feeRows = [];
    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      if (r[0] && Number(r[2]) > 0) {
        feeRows.push({ sheetRow: i + 11, date: coerceDate_(r[0]), oldFee: Number(r[1]) || 0, newFee: Number(r[2]) || 0, admin: clean_(r[3]), reason: clean_(r[4]) });
      }
    }
    if (feeRows.length === 0) throw new Error("No fee history entries found.");
    if (feeRows.length === 1) throw new Error("Cannot undo: only one fee entry remains. Use 'Restore Canonical History' to reset.");
    feeRows.sort((a, b) => a.date - b.date);
    const toUndo = feeRows[feeRows.length - 1];
    sh.getRange("F" + toUndo.sheetRow + ":J" + toUndo.sheetRow).clearContent();
    logFeeChangeAudit_(clean_(admin), toUndo.date.getFullYear(), toUndo.newFee, toUndo.oldFee,
      "UNDO by " + clean_(admin) + ": removed €" + toUndo.newFee + "/month entry effective " + displayDate_(toUndo.date));
    invalidateFastCaches_([SHEETS.config]);
    clearCachedMembershipFundingIndex_();
    clearDashboardSummaryCache_();
    return { undone: { date: displayDate_(toUndo.date), oldFee: toUndo.oldFee, newFee: toUndo.newFee, admin: toUndo.admin, reason: toUndo.reason }, settings: getMembershipFeeSettings() };
  });
}

function getFeeChangePreview(form) {
  requirePermission_(clean_(form && form.admin), "manageSettings");
  const newFee = Number(form && form.newFee);
  if (!newFee || newFee <= 0) throw new Error("New monthly fee must be greater than 0.");
  if (!form || !form.effectiveDate) throw new Error("Effective date is required.");
  const effectiveDate = coerceDate_(form.effectiveDate);
  if (!effectiveDate) throw new Error("Invalid effective date.");
  const effectiveYear = effectiveDate.getFullYear();
  const currentYear = new Date().getFullYear();
  if (effectiveYear < currentYear) throw new Error("Fee changes cannot be applied to past years. Earliest allowed: " + currentYear + ".");
  const previousFee = monthlyFeeFor_(effectiveYear, effectiveDate.getMonth());
  const existingHistory = getMembershipFeeSettings();
  const duplicate = (existingHistory.history || []).some(function(r) {
    const d = coerceDate_(r.date);
    return d && d.getFullYear() === effectiveYear;
  });
  const examples = [];
  for (let y = effectiveYear; y <= effectiveYear + 3; y++) {
    examples.push({ year: y, oldMonthlyFee: previousFee, oldYearlyFee: previousFee * 12, newMonthlyFee: newFee, newYearlyFee: newFee * 12, difference: (newFee - previousFee) * 12 });
  }
  return { effectiveDate: displayDate_(effectiveDate), effectiveYear: effectiveYear, previousMonthlyFee: previousFee, previousYearlyFee: previousFee * 12, newMonthlyFee: newFee, newYearlyFee: newFee * 12, changeAmount: (newFee - previousFee) * 12, willReplaceDuplicate: duplicate, examples: examples };
}

function exportFeeHistoryAsCsv(admin) {
  requirePermission_(clean_(admin), "manageSettings");
  const history = getMembershipFeeSettings();
  const rows = (history.history || []).slice().reverse();
  const headers = ["Effective Date", "Monthly Fee (EUR)", "Yearly Fee (EUR)", "Previous Monthly Fee (EUR)", "Changed By", "Reason"];
  const dataRows = rows.map(function(r) {
    return [r.date, Number(r.newFee || 0).toFixed(2), (Number(r.newFee || 0) * 12).toFixed(2), Number(r.oldFee || 0).toFixed(2), r.admin || "", r.reason || ""];
  });
  const csv = [headers].concat(dataRows).map(function(row) {
    return row.map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
  }).join("\n");
  return { csv: csv, filename: "Fee_History_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd") + ".csv" };
}

function exportFeeHistoryAsPdf(admin) {
  requirePermission_(clean_(admin), "manageSettings");
  const history = getMembershipFeeSettings();
  const rows = (history.history || []).slice().reverse();
  const tz = Session.getScriptTimeZone();
  const genDate = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  const fileName = "Fee_History_" + Utilities.formatDate(new Date(), tz, "yyyy-MM-dd") + ".pdf";
  const trs = rows.map(function(r) {
    return "<tr><td>" + (r.date || "") + "</td><td>€" + Number(r.newFee || 0).toFixed(2) + "/mo</td>" +
      "<td>€" + (Number(r.newFee || 0) * 12).toFixed(2) + "/yr</td>" +
      "<td>€" + Number(r.oldFee || 0).toFixed(2) + "/mo</td>" +
      "<td>" + (r.admin || "") + "</td><td>" + (r.reason || "") + "</td></tr>";
  }).join("");
  const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
    "<style>body{font-family:Arial,sans-serif;font-size:11pt;margin:30px}" +
    "h1{font-size:15pt;margin-bottom:4px}p{color:#666;font-size:9pt;margin:0 0 14px}" +
    "table{border-collapse:collapse;width:100%}th{background:#2c5f2e;color:white;padding:7px 10px;text-align:left;font-size:9pt}" +
    "td{padding:7px 10px;border-bottom:1px solid #ddd;font-size:9pt}tr:nth-child(even) td{background:#f5f5f5}" +
    ".footer{margin-top:20px;font-size:8pt;color:#999}</style></head><body>" +
    "<h1>St.Rufael Church Münster &mdash; Membership Fee History</h1>" +
    "<p>Generated " + genDate + " by " + clean_(admin) +
    " &nbsp;&middot;&nbsp; Current fee: €" + Number(history.currentFee || 0).toFixed(2) +
    "/month (€" + (Number(history.currentFee || 0) * 12).toFixed(2) + "/year)</p>" +
    "<table><thead><tr><th>Effective Date</th><th>Monthly Fee</th><th>Yearly Fee</th>" +
    "<th>Previous Fee</th><th>Changed By</th><th>Reason</th></tr></thead>" +
    "<tbody>" + trs + "</tbody></table>" +
    "<div class='footer'>St.Rufael Eritrean Orthodox Church &middot; Münster &middot; Church Management System</div>" +
    "</body></html>";
  const pdfBlob = Utilities.newBlob(html, "text/html", fileName.replace(/\.pdf$/, ".html")).getAs(MimeType.PDF);
  const folder = backupFolder_();
  const file = folder.createFile(pdfBlob.setName(fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: file.getUrl(), filename: fileName };
}

function getFeeHistory_() {
  const key = "fee:history:local";
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  ensureFeeHistoryTable_();
  const sh = configSheet_();
  const history = sh.getRange("F11:J" + Math.max(sh.getLastRow(), 11)).getValues()
    .filter(r => r[0] && Number(r[2]) > 0)
    .map(r => ({
      date: coerceDate_(r[0]) || new Date(2015, 0, 1),
      oldFee: Number(r[1]) || 0,
      newFee: Number(r[2]) || DEFAULT_MONTHLY_FEE,
      admin: clean_(r[3]),
      reason: clean_(r[4])
    }))
    .sort((a, b) => a.date - b.date);
  CMS_DATA_CONTEXT_[key] = history;
  return history;
}

function monthlyFeeFor_(year, monthIndex) {
  const target = new Date(year, monthIndex, 1);
  let fee = DEFAULT_MONTHLY_FEE;
  getFeeHistory_().forEach(row => {
    if (row.date <= target) fee = row.newFee;
  });
  return fee;
}

function expectedAmountForItems_(items) {
  return items.reduce((sum, item) => sum + monthlyFeeFor_(item.year, MONTHS.indexOf(item.month)), 0);
}

// Precomputes per-year, per-month fees once per request. Cached in CMS_DATA_CONTEXT_.
// Returns { [year]: { total: number, byMonth: number[12] } }
function precomputeYearlyFees_() {
  const CACHE_KEY = "yearly:fees:precomputed";
  if (CMS_DATA_CONTEXT_[CACHE_KEY]) return CMS_DATA_CONTEXT_[CACHE_KEY];
  const currentYear = new Date().getFullYear();
  const history = getFeeHistory_();
  const minYear = history.length > 0 ? history[0].date.getFullYear() : 2015;
  const result = {};
  for (let year = minYear; year <= currentYear; year++) {
    const byMonth = MONTHS.map((_, i) => monthlyFeeFor_(year, i));
    result[year] = { total: byMonth.reduce((s, f) => s + f, 0), byMonth };
  }
  CMS_DATA_CONTEXT_[CACHE_KEY] = result;
  return result;
}

function getMembershipFeeSettings() {
  const history = getFeeHistory_();
  const current = history.length ? history[history.length - 1].newFee : DEFAULT_MONTHLY_FEE;
  return {
    currentFee: current,
    history: history.slice(-20).reverse().map(r => ({
      date: displayDate_(r.date),
      oldFee: r.oldFee,
      newFee: r.newFee,
      admin: r.admin,
      reason: r.reason
    }))
  };
}

function getYearlyPaymentPreview(form) {
  return timed_("getYearlyPaymentPreview", () => {
    requirePermission_(clean_(form && form.admin), "managePayments");
    const nowYear = new Date().getFullYear();
    const rawStart = Number(form && form.startYear) || nowYear;
    const rawEnd = Number(form && form.endYear) || rawStart;
    const startYear = Math.min(rawStart, rawEnd);
    const endYear = Math.max(rawStart, rawEnd);
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      const monthlyFees = MONTHS.map((month, index) => ({
        month,
        fee: monthlyFeeFor_(year, index)
      }));
      const yearlyFee = monthlyFees.reduce((sum, item) => sum + item.fee, 0);
      years.push({ year, yearlyFee, monthlyFees });
    }
    let totalAmount = years.reduce((sum, item) => sum + item.yearlyFee, 0);
    const enteredAmount = Number(form && form.amount);
    const paymentAmount = enteredAmount > 0 ? enteredAmount : totalAmount;
    let balanceDue = totalAmount;
    let memberName = "";
    let memberId = clean_(form && form.memberId);
    let autoSuggestion = null;
    let rangeCoverage = [];
    if (memberId || clean_(form && form.memberQuery)) {
      const member = findMember_(memberId || form.memberQuery);
      if (member) {
        memberId = member.id;
        memberName = member.name;
        const balance = membershipPreviewBalance_(member, startYear, endYear);
        balanceDue = balance.balanceDue;
        const detailsByYear = {};
        (balance.unpaidYearDetails || []).forEach(item => {
          detailsByYear[Number(item.year)] = item;
        });
        totalAmount = 0;
        years.forEach(item => {
          const detail = detailsByYear[Number(item.year)];
          item.amountDue = detail ? Number(detail.amountDue || 0) : 0;
          item.unpaidMonths = detail ? detail.unpaidMonths || [] : [];
          totalAmount += item.amountDue;
        });
        totalAmount = Number(totalAmount.toFixed(2));
        rangeCoverage = years
          .filter(item => item.amountDue > 0 && item.unpaidMonths && item.unpaidMonths.length)
          .map(item => ({ year: item.year, months: item.unpaidMonths }));
        autoSuggestion = {
          coverage: rangeCoverage,
          coveredYears: rangeCoverage.map(item => item.year),
          numberOfYears: rangeCoverage.length,
          amountApplied: totalAmount,
          remainingAmount: 0,
          exceedsUnpaidBalance: totalAmount > balanceDue + 0.001
        };
        const savingsBalance = savingsBalanceForMember_(member.id);
        const oldest = (balance.unpaidYearDetails || [])[0] || null;
        autoSuggestion.savingsBalance = Number(savingsBalance.toFixed(2));
        autoSuggestion.oldestUnpaidYear = oldest ? oldest.year : "";
        autoSuggestion.amountNeeded = oldest ? Number(Number(oldest.amountDue || 0).toFixed(2)) : 0;
        autoSuggestion.amountStillNeededAfterSavings = Math.max(0, Number((totalAmount - savingsBalance).toFixed(2)));
      }
    }
    const finalPaymentAmount = totalAmount;
    return {
      memberId,
      memberName,
      startYear,
      endYear,
      coveredYears: startYear === endYear ? String(startYear) : startYear + "-" + endYear,
      numberOfYears: years.length,
      years,
      yearlyFee: years.length && years.every(y => y.yearlyFee === years[0].yearlyFee) ? years[0].yearlyFee : "",
      totalAmount,
      paymentAmount: finalPaymentAmount,
      balanceDue,
      remainingBalance: Math.max(0, Number((balanceDue - finalPaymentAmount).toFixed(2))),
      rangeCoverage,
      suggestedCoverage: autoSuggestion ? autoSuggestion.coverage : [],
      suggestedCoveredYears: autoSuggestion ? autoSuggestion.coveredYears : [],
      suggestedNumberOfYears: autoSuggestion ? autoSuggestion.numberOfYears : 0,
      suggestedAmountApplied: autoSuggestion ? autoSuggestion.amountApplied : 0,
      suggestedRemainingAmount: autoSuggestion ? autoSuggestion.remainingAmount : 0,
      exceedsUnpaidBalance: autoSuggestion ? autoSuggestion.exceedsUnpaidBalance : finalPaymentAmount > balanceDue + 0.001,
      savingsBalance: autoSuggestion ? autoSuggestion.savingsBalance : 0,
      oldestUnpaidYear: autoSuggestion ? autoSuggestion.oldestUnpaidYear : "",
      amountNeeded: autoSuggestion ? autoSuggestion.amountNeeded : 0,
      amountStillNeededAfterSavings: autoSuggestion ? autoSuggestion.amountStillNeededAfterSavings : 0
    };
  });
}

function membershipPreviewBalance_(member, startYear, endYear) {
  const now = new Date();
  const join = coerceDate_(member.joinDate) || new Date(now.getFullYear(), 0, 1);
  const registrationYear = join.getFullYear();
  const currentYear = now.getFullYear();
  const coverageIndex = paymentCoverageIndex_();
  const fundingIndex = membershipFundingIndex_();
  const dueItems = [];
  for (let year = registrationYear; year <= currentYear; year++) {
    dueMonthsForMemberYear_(member, year).forEach(month => dueItems.push({ year, month }));
  }
  const unpaidItems = dueItems.filter(item => !paidMonthsForMemberYear_(member.id, item.year, coverageIndex)[item.month]);
  const totalExpected = expectedAmountForItems_(dueItems);
  const totalPaid = membershipPaymentsForMember_(member.id).reduce((sum, row) => sum + (Number(row[6]) || 0), 0);
  const dueYears = [...new Set(dueItems.map(item => item.year))].sort((a, b) => a - b);
  const unpaidYearDetails = dueYears
    .filter(year => year >= startYear && year <= endYear)
    .map(year => {
      const yearDue = dueItems.filter(item => item.year === year);
      const yearUnpaid = unpaidItems.filter(item => item.year === year);
      const remaining = remainingDueForYear_(member, year, fundingIndex);
      return {
        year,
        unpaidMonths: yearUnpaid.map(item => item.month),
        unpaidCount: yearUnpaid.length,
        amountDue: remaining.amountDue,
        yearlyFee: remaining.yearlyFee,
        paidAmount: remaining.fundedAmount
      };
    })
    .filter(item => item.unpaidCount > 0 || item.amountDue > 0);
  return {
    balanceDue: Math.max(0, Number((totalExpected - totalPaid).toFixed(2))),
    unpaidYearDetails
  };
}

function updateMembershipFee(form) {
  return timed_("updateMembershipFee", () => {
    const admin = clean_(form && form.admin);
    requirePermission_(admin, "manageSettings");
    const newFee = Number(form && form.newFee);
    if (!newFee || newFee <= 0) throw new Error("Enter a monthly fee greater than 0.");

    const effectiveDate = form && form.effectiveDate ? new Date(form.effectiveDate) : new Date();
    const effectiveYear = effectiveDate.getFullYear();
    const currentYear = new Date().getFullYear();

    if (effectiveYear < currentYear) {
      throw new Error("Fee changes cannot be applied to past years. The earliest allowed year is " + currentYear + ".");
    }

    ensureFeeHistoryTable_();
    const history = getFeeHistory_();
    const duplicate = history.some(r => r.date.getFullYear() === effectiveYear);
    if (duplicate) {
      throw new Error("A fee entry for " + effectiveYear + " already exists. Only one fee change per calendar year is allowed. To correct an existing entry, contact a Super Admin.");
    }

    const oldFee = monthlyFeeFor_(effectiveYear, effectiveDate.getMonth());
    const sh = configSheet_();
    sh.appendRow(["", "", "", "", "", effectiveDate, oldFee, newFee, admin, clean_(form && form.reason)]);

    // Fee changes are a financial configuration event — audit failure must block the write.
    logFeeChangeAudit_(admin, effectiveYear, oldFee, newFee, clean_(form && form.reason));

    invalidateFastCaches_([SHEETS.config]);
    clearCachedMembershipFundingIndex_();
    clearDashboardSummaryCache_();
    return getMembershipFeeSettings();
  });
}

function logFeeChangeAudit_(admin, effectiveYear, oldFee, newFee, reason) {
  sh_(SHEETS.audit).appendRow(
    [new Date(), "UPDATE_MEMBERSHIP_FEE", SHEETS.config, "Fee/" + effectiveYear, admin, reason, oldFee, newFee]
  );
}

