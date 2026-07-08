function ensureNonMemberSheet_() {
  let sh = sheetByName_(SHEETS.nonMembers);
  if (!sh) sh = ss_().insertSheet(SHEETS.nonMembers);
  if (!clean_(sh.getRange("A1").getValue())) {
    sh.getRange("A1").setValue("ኣባላት ዘይኮኑ");
  }
  const headers = ["Donor ID", "ምሉእ ስም", "ቁጽሪ ስልኪ", "ከተማ", "ዕለት", "ኩነታት", "መዘክር", "ዝወሰኾ"];
  const current = sh.getRange(2, 1, 1, headers.length).getValues()[0];
  if (!current.some(Boolean)) {
    sh.getRange(2, 1, 1, headers.length).setValues([headers]);
    sh.getRange("A1:H2").setFontWeight("bold");
    sh.setFrozenRows(2);
  }
}

function ensureCoverageSheet_() {
  let sh = sheetByName_(SHEETS.coverage);
  if (!sh) sh = ss_().insertSheet(SHEETS.coverage);
  if (!clean_(sh.getRange("A1").getValue())) {
    sh.getRange("A1").setValue("Membership Coverage");
  }
  const headers = ["Member ID", "Member Name", "Year"].concat(MONTHS.map(m => m.slice(0, 3)), ["Missing Months", "Last Transaction ID", "Updated At"]);
  const current = sh.getRange(2, 1, 1, headers.length).getValues()[0];
  if (!current.some(Boolean)) {
    sh.getRange(2, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 2, headers.length).setFontWeight("bold");
    sh.setFrozenRows(2);
    sh.autoResizeColumns(1, headers.length);
  }
  return sh;
}

function ensurePaymentSheetColumns_(sheetName) {
  const sh = sh_(sheetName);
  const current = sh.getRange(2, 1, 1, PAYMENT_HEADERS.length).getValues()[0];
  if (!current[0]) {
    sh.getRange(2, 1, 1, PAYMENT_HEADERS.length).setValues([PAYMENT_HEADERS]);
    sh.setFrozenRows(2);
  } else {
    const existing = current.map(clean_);
    PAYMENT_HEADERS.forEach((header, index) => {
      if (
        !existing[index] ||
        (index === 4 && ["Month", "ወርሒ", "Months Paid", "ዝተኸፍሉ ኣዋርሕ"].includes(existing[index]))
      ) {
        sh.getRange(2, index + 1).setValue(header);
      }
    });
  }
  return sh;
}

function normalizePaymentSheetHeaders_() {
  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    const sh = sheetByName_(sheetName);
    if (!sh) return;
    const maxRows = Math.min(Math.max(sh.getLastRow(), 2), 5);
    const values = sh.getRange(1, 1, maxRows, Math.min(sh.getMaxColumns(), PAYMENT_HEADERS.length)).getValues();
    values.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const text = clean_(cell);
        if (["Month", "ወርሒ", "Months Paid", "ዝተኸፍሉ ኣዋርሕ"].includes(text)) {
          sh.getRange(rowIndex + 1, colIndex + 1).setValue("Payment Type");
        }
      });
    });
    ensurePaymentSheetColumns_(sheetName);
  });
}

function normalizeYearlyMembershipSheetViews_() {
  normalizePaymentSheetHeaders_();
  ensureSavingsSheets_();
  normalizePaymentSheetTitleAndValues_(SHEETS.payments, SHEETS.payments);
  normalizePaymentSheetTitleAndValues_(SHEETS.servicePayments, SHEETS.servicePayments);
  // normalizeDashboardYearlyLabels_ removed from here — it was a one-time migration helper
  // that wiped A10:B13 and D26:H34 on every open/sidebar. refreshDashboardLiveTotals_ owns those ranges.
  normalizeSetupNotesYearlyLabels_();
}

function normalizePaymentSheetTitleAndValues_(sheetName, titleText) {
  const sh = sheetByName_(sheetName);
  if (!sh) return;
  const width = Math.min(PAYMENT_HEADERS.length, sh.getMaxColumns());
  sh.getRange(1, 1, 1, width).breakApart();
  sh.getRange(1, 1).setValue(titleText);
  ensurePaymentSheetColumns_(sheetName);
  const lastRow = Math.max(sh.getLastRow(), 2);
  if (lastRow >= 3) {
    const rows = sh.getRange(3, 1, lastRow - 2, PAYMENT_HEADERS.length).getValues();
    const updates = [];
    rows.forEach((row, index) => {
      const type = clean_(row[4]);
      const reason = clean_(row[7]);
      if (reason === "Membership" && isLegacyMonthLabel_(type)) {
        updates.push(index + 3);
      }
    });
    updates.forEach(rowNumber => sh.getRange(rowNumber, 5).setValue("Yearly"));
    sh.getRange(3, 5, lastRow - 2, 1).clearDataValidations();
  }
}

function isLegacyMonthLabel_(value) {
  const text = clean_(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/jan(?:uary)?\s*[-–]\s*dec(?:ember)?/.test(lower)) return true;
  if (/jan(?:uary)?\s+to\s+dec(?:ember)?/.test(lower)) return true;
  if (MONTHS.map(m => m.toLowerCase()).includes(lower)) return true;
  return MONTHS.map(m => m.slice(0, 3).toLowerCase()).includes(lower);
}

function normalizeDashboardYearlyLabels_() {
  const dash = sheetByName_(SHEETS.dashboard);
  if (!dash) return;
  dash.getRange("A10:B22").clearContent();
  dash.getRange("A10:B13").setValues([
    ["Yearly Income Summary", "Amount"],
    ["Membership payments", ""],
    ["Service / other payments", ""],
    ["Total income", ""]
  ]);
  dash.getRange("B11").setFormula("=SUMIFS('" + SHEETS.payments + "'!G3:G1000,'" + SHEETS.payments + "'!F3:F1000,$B$3,'" + SHEETS.payments + "'!H3:H1000,\"Membership\")");
  dash.getRange("B12").setFormula("=SUMIFS('" + SHEETS.servicePayments + "'!G3:G1000,'" + SHEETS.servicePayments + "'!F3:F1000,$B$3)");
  dash.getRange("B13").setFormula("=B11+B12");
  dash.getRange("A10:B10").setFontWeight("bold").setBackground("#e8f5e9");
  dash.getRange("B11:B13").setNumberFormat("€#,##0.00");
  dash.getRange("D16:H24").breakApart();
  dash.getRange("D16:H24").clearContent();
  dash.getRange("D16:H16").setValues([["Date", "Member", "Payment Type", "Year", "Amount"]]);
  dash.getRange("D17").setValue("No payments yet");
  dash.getRange("D16:H16").setFontWeight("bold").setBackground("#1f7a3a").setFontColor("#ffffff");
  dash.getRange("D17:H24").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
  dash.getRange("D26:H34").breakApart();
  dash.getRange("D26:H34").clearContent();
  dash.getRange("D26:H26").setValues([["Date", "Category", "Description", "Amount", "Recorded By"]]);
  dash.getRange("D26:H26").setFontWeight("bold").setBackground("#1f7a3a").setFontColor("#ffffff");
  dash.getRange("D27:H34").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
  dash.getRange("I29:J29").setFontWeight("normal").setBackground("#ffffff").setFontColor("#000000");
}

function normalizeSetupNotesYearlyLabels_() {
  const notes = sheetByName_("Setup Notes");
  if (!notes) return;
  const lastRow = Math.max(notes.getLastRow(), 1);
  const range = notes.getRange(1, 1, lastRow, Math.min(notes.getMaxColumns(), 6));
  const values = range.getValues();
  let changed = false;
  values.forEach(row => {
    row.forEach((cell, index) => {
      const text = clean_(cell);
      if (!text) return;
      const next = text
        .replace(/Monthly Payments/g, "Membership Payments")
        .replace(/Use one row per payment\./g, "Use one row per paid year.")
        .replace(/Status, month, payment reason/g, "Status, payment type, year, payment reason")
        .replace(/month dropdowns?/gi, "year/payment type dropdowns");
      if (next !== text) {
        row[index] = next;
        changed = true;
      }
    });
  });
  if (changed) range.setValues(values);
}

function normalizeExpenseSheetHeaders_() {
  const sh = sheetByName_(SHEETS.expenses);
  if (!sh) return;
  const title = clean_(sh.getRange("A1").getValue());
  if (!title) sh.getRange("A1").setValue(SHEETS.expenses);
  const current = sh.getRange(2, 1, 1, EXPENSE_HEADERS.length).getValues()[0].map(clean_);
  EXPENSE_HEADERS.forEach((header, index) => {
    if (!current[index] || (index === 4 && ["Who", "መን"].includes(current[index]))) {
      sh.getRange(2, index + 1).setValue(header);
    }
  });
}

function ensureHandoverSheet_() {
  let sh = sheetByName_(SHEETS.handovers);
  if (!sh) sh = ss_().insertSheet(SHEETS.handovers);
  if (!clean_(sh.getRange("A1").getValue())) sh.getRange("A1").setValue(SHEETS.handovers);
  const current = sh.getRange(2, 1, 1, HANDOVER_HEADERS.length).getValues()[0].map(clean_);
  HANDOVER_HEADERS.forEach((header, index) => {
    if (!current[index]) sh.getRange(2, index + 1).setValue(header);
  });
  sh.setFrozenRows(2);
  return sh;
}

function ensureOverallHandoverSheet_() {
  return ensureHeaderSheet_(SHEETS.overallHandovers, OVERALL_HANDOVER_HEADERS);
}

function ensureTransactionInfrastructure_() {
  ensureTransactionCategorySheet_();
  ensureChurchTransactionSheet_();
  ensureMaterialInventorySheet_();
  ensureMaterialMovementLogSheet_();
}

function ensureHeaderSheet_(sheetName, headers) {
  let sh = sheetByName_(sheetName);
  if (!sh) sh = ss_().insertSheet(sheetName);
  if (!clean_(sh.getRange("A1").getValue())) sh.getRange("A1").setValue(sheetName);
  const current = sh.getRange(2, 1, 1, headers.length).getValues()[0].map(clean_);
  headers.forEach((header, index) => {
    if (!current[index]) sh.getRange(2, index + 1).setValue(header);
  });
  sh.setFrozenRows(2);
  return sh;
}

function ensureTransactionCategorySheet_() {
  const sh = ensureHeaderSheet_(SHEETS.transactionCategories, TRANSACTION_CATEGORY_HEADERS);
  const existing = dataRows_(SHEETS.transactionCategories).map(row => clean_(row[0])).filter(Boolean);
  if (!existing.length) {
    const rows = defaultTransactionCategories_().map(item => [
      item.id, item.type, item.name, item.ti, "Yes", item.requiresMember ? "Yes" : "No", item.requiresReceipt ? "Yes" : "No", item.notes || ""
    ]);
    sh.getRange(3, 1, rows.length, TRANSACTION_CATEGORY_HEADERS.length).setValues(rows);
    advanceAppendRow_(SHEETS.transactionCategories, 3 + rows.length);
    invalidateFastCaches_([SHEETS.transactionCategories]);
  }
  return sh;
}

function defaultTransactionCategories_() {
  return [
    { id: "INC-WEDDING", type: "Income", name: "Wedding", ti: "መርዓ", requiresMember: false, requiresReceipt: true },
    { id: "INC-BAPTISM", type: "Income", name: "Baptism", ti: "ጥምቀት", requiresMember: false, requiresReceipt: true },
    { id: "INC-MEMBERSHIP-CARD", type: "Income", name: "Membership Card", ti: "ናይ ካርዲ ኣባልነት", requiresMember: false, requiresReceipt: true },
    { id: "INC-TITHE", type: "Income", name: "Tithe", ti: "ዕሽር", requiresMember: false, requiresReceipt: true },
    { id: "INC-OFFERING", type: "Income", name: "Offering", ti: "ሞባእ", requiresMember: false, requiresReceipt: true },
    { id: "INC-CHURCH-BUYING", type: "Income", name: "Buying Church", ti: "መዐደጊ ቤተክርስትያን", requiresMember: false, requiresReceipt: true },
    { id: "INC-GENERAL-DONATION", type: "Income", name: "General Donation", ti: "General Donation", requiresMember: false, requiresReceipt: true },
    { id: "INC-MATERIAL-SALE", type: "Income", name: "Material Sale", ti: "Material Sale", requiresMember: false, requiresReceipt: true },
    { id: "INC-OTHER", type: "Income", name: "Other Income", ti: "Other Income", requiresMember: false, requiresReceipt: true },
    { id: "EXP-PRIEST-FEE", type: "Expense", name: "Priest Fee", ti: "Priest Fee" },
    { id: "EXP-RENT", type: "Expense", name: "Rent", ti: "Rent" },
    { id: "EXP-ELECTRICITY", type: "Expense", name: "Electricity", ti: "Electricity" },
    { id: "EXP-WATER", type: "Expense", name: "Water", ti: "Water" },
    { id: "EXP-INTERNET", type: "Expense", name: "Internet", ti: "Internet" },
    { id: "EXP-SUPPLIES", type: "Expense", name: "Church Supplies", ti: "Church Supplies" },
    { id: "EXP-MAINTENANCE", type: "Expense", name: "Maintenance", ti: "Maintenance" },
    { id: "EXP-CLEANING", type: "Expense", name: "Cleaning", ti: "Cleaning" },
    { id: "EXP-EVENT", type: "Expense", name: "Event Expense", ti: "Event Expense" },
    { id: "EXP-TRANSPORT", type: "Expense", name: "Transport", ti: "Transport" },
    { id: "EXP-CHARITY", type: "Expense", name: "Charity / Support", ti: "Charity / Support" },
    { id: "EXP-SUBSCRIPTION", type: "Expense", name: "subscription", ti: "subscription" },
    { id: "EXP-OTHER", type: "Expense", name: "Other Expense", ti: "Other Expense" },
    { id: "MAT-CANDLES", type: "Material Donation", name: "Candles", ti: "Candles" },
    { id: "MAT-BOOKS", type: "Material Donation", name: "Books", ti: "Books" },
    { id: "MAT-CLOTHES", type: "Material Donation", name: "Church Clothes", ti: "Church Clothes" },
    { id: "MAT-EQUIPMENT", type: "Material Donation", name: "Equipment", ti: "Equipment" },
    { id: "MAT-FOOD", type: "Material Donation", name: "Food / Drink", ti: "Food / Drink" },
    { id: "MAT-FURNITURE", type: "Material Donation", name: "Furniture", ti: "Furniture" },
    { id: "MAT-OTHER", type: "Material Donation", name: "Other Material", ti: "Other Material" }
  ];
}

function ensureChurchTransactionSheet_() {
  return ensureHeaderSheet_(SHEETS.churchTransactions, CHURCH_TRANSACTION_HEADERS);
}

function ensureMaterialInventorySheet_() {
  return ensureHeaderSheet_(SHEETS.materialInventory, MATERIAL_INVENTORY_HEADERS);
}

function ensureMaterialMovementLogSheet_() {
  return ensureHeaderSheet_(SHEETS.materialMovementLog, MATERIAL_MOVEMENT_HEADERS);
}


function ensureAuditSheet_() {
  const sh = sh_(SHEETS.audit);
  const current = sh.getRange(2, 1, 1, AUDIT_HEADERS.length).getValues()[0];
  if (!current[0]) sh.getRange(2, 1, 1, AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]);
  return sh;
}

function ensureReceiptSheet_() {
  const sh = sh_(SHEETS.receipts);
  const current = sh.getRange(2, 1, 1, RECEIPT_HEADERS.length).getValues()[0];
  if (!current[0]) {
    sh.getRange(2, 1, 1, RECEIPT_HEADERS.length).setValues([RECEIPT_HEADERS]);
  } else {
    RECEIPT_HEADERS.forEach((header, index) => {
      if (!clean_(current[index])) sh.getRange(2, index + 1).setValue(header);
    });
  }
  return sh;
}

function ensureSavingsSheets_() {
  const ss = ss_();
  const balance = sheetByName_(SHEETS.savingsBalance) || ss.insertSheet(SHEETS.savingsBalance);
  const balanceHeaders = ["Member ID", "Member Name", "Savings Balance", "Updated At", "Last Deposit ID", "Last Conversion ID"];
  balance.getRange(1, 1).setValue(SHEETS.savingsBalance);
  balance.getRange(2, 1, 1, balanceHeaders.length).setValues([balanceHeaders]);
  balance.setFrozenRows(2);
  const history = sheetByName_(SHEETS.savingsHistory) || ss.insertSheet(SHEETS.savingsHistory);
  const historyHeaders = ["Deposit ID", "Date", "Member ID", "Member Name", "Amount", "Method", "Recorded By", "Notes", "Balance Before", "Balance After", "Converted Amount", "Conversion Transaction ID", "Handover ID", "Handover Status"];
  history.getRange(1, 1).setValue(SHEETS.savingsHistory);
  history.getRange(2, 1, 1, historyHeaders.length).setValues([historyHeaders]);
  history.setFrozenRows(2);
  const log = sheetByName_(SHEETS.savingsConversionLog) || ss.insertSheet(SHEETS.savingsConversionLog);
  const logHeaders = ["Date", "Member ID", "Member Name", "Deposit ID", "Conversion Transaction ID", "Converted Year", "Converted Amount", "Balance Before", "Balance After", "Recorded By", "Notes"];
  log.getRange(1, 1).setValue(SHEETS.savingsConversionLog);
  log.getRange(2, 1, 1, logHeaders.length).setValues([logHeaders]);
  log.setFrozenRows(2);
  return { balance, history, log };
}

function ensureSavingsInfrastructure() {
  return timed_("ensureSavingsInfrastructure", () => {
    const sheets = ensureSavingsSheets_();
    ensureFeeHistoryTable_();
    return {
      savingsBalanceSheet: sheets.balance.getName(),
      savingsBalanceHeaders: sheets.balance.getRange(2, 1, 1, 6).getValues()[0],
      savingsHistorySheet: sheets.history.getName(),
      savingsHistoryHeaders: sheets.history.getRange(2, 1, 1, 12).getValues()[0],
      autoConversionLogSheet: sheets.log.getName(),
      autoConversionLogHeaders: sheets.log.getRange(2, 1, 1, 11).getValues()[0],
      fee2026Monthly: MEMBERSHIP_FEE_2026_MONTHLY,
      fee2026Yearly: MEMBERSHIP_FEE_2026_MONTHLY * 12
    };
  });
}

function ensureChurchTransactionInfrastructure() {
  return timed_("ensureChurchTransactionInfrastructure", () => {
    ensureTransactionInfrastructure_();
    return {
      transactionCategoriesSheet: SHEETS.transactionCategories,
      churchTransactionsSheet: SHEETS.churchTransactions,
      materialInventorySheet: SHEETS.materialInventory,
      materialMovementLogSheet: SHEETS.materialMovementLog,
      categoryCount: transactionCategories_("", true).length
    };
  });
}

function ensureFeeHistoryTable_() {
  const sh = configSheet_();
  const header = sh.getRange("F10:J10").getValues()[0];
  if (header[0] !== FEE_HISTORY_HEADERS[0]) {
    sh.getRange("F10:J10").setValues([FEE_HISTORY_HEADERS]);
  }
  const lastRow = Math.max(sh.getLastRow(), 11);
  const values = sh.getRange("F11:J" + lastRow).getValues();
  if (!values.some(r => r[0] && Number(r[2]))) {
    sh.getRange("F11:J11").setValues([[new Date(2015, 0, 1), "", DEFAULT_MONTHLY_FEE, "System", "Default monthly membership fee"]]);
  }
  const refreshedValues = sh.getRange("F11:J" + Math.max(sh.getLastRow(), 11)).getValues();
  const has2026Rule = refreshedValues.some(r => {
    const date = coerceDate_(r[0]);
    return date && date.getFullYear() === 2026 && date.getMonth() === 0 && Number(r[2]) === MEMBERSHIP_FEE_2026_MONTHLY;
  });
  if (!has2026Rule) {
    sh.appendRow(["", "", "", "", "", MEMBERSHIP_FEE_2026_EFFECTIVE_DATE, DEFAULT_MONTHLY_FEE, MEMBERSHIP_FEE_2026_MONTHLY, "System", "Membership fee for 2026: €60/year"]);
  }
  refreshedValues.forEach((row, index) => {
    const rowNumber = index + 11;
    const admin = clean_(row[3]).toLowerCase();
    const reason = clean_(row[4]).toLowerCase();
    const fee = Number(row[2]) || 0;
    const isSystemDefault = admin === "system" && reason.indexOf("default") >= 0;
    if (isSystemDefault && fee !== DEFAULT_MONTHLY_FEE) {
      sh.getRange(rowNumber, 8).setValue(DEFAULT_MONTHLY_FEE);
      sh.getRange(rowNumber, 10).setValue("Default monthly membership fee updated to church rule");
    }
  });
}

// Restores the canonical two-entry fee history:
