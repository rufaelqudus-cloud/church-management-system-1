function getRowForEditByTxId(form) {
  const txId = clean_(form && form.txId);
  const admin = clean_(form && form.admin);
  requirePermission_(admin, "managePayments");
  if (!txId) throw new Error("Transaction ID is required.");
  const sh = sh_(SHEETS.payments);
  const lastRow = sh.getLastRow();
  if (lastRow < 3) throw new Error("No payment rows found.");
  const width = PAYMENT_HEADERS.length;
  const data = sh.getRange(3, 1, lastRow - 2, width).getValues();
  for (let i = 0; i < data.length; i++) {
    if (clean_(data[i][0]) === txId) {
      const row = i + 3;
      return { ok: true, sheetName: SHEETS.payments, row, type: "payment", values: data[i].map(displayEditValue_) };
    }
  }
  throw new Error("Payment row not found: " + txId);
}

function getSelectedRowForEdit() {
  const ss = ss_();
  const tracked = getTrackedSelection_();
  let sheetName = tracked.sheetName;
  let row = tracked.row;
  if (!sheetName || !row) {
    const range = ss.getActiveRange();
    if (!range) throw new Error("Select a cell in the row you want to edit.");
    const sh = range.getSheet();
    sheetName = sh.getName();
    row = range.getRow();
  }
  if (row < 3) throw new Error("Select a data row, not the title or header row.");
  if (!MANUAL_EDIT_GUARDED_SHEETS.includes(sheetName)) {
    throw new Error("Editing is available for the member, payment, service payment, and expense tabs.");
  }
  const width = sameSheet_(sheetName, SHEETS.expenses) ? EXPENSE_HEADERS.length : sameSheet_(sheetName, SHEETS.members) ? 10 : PAYMENT_HEADERS.length;
  const values = sh_(sheetName).getRange(row, 1, 1, width).getValues()[0];
  if (!values.some(v => v !== "")) throw new Error("The selected row is empty.");
  const type = editType_(sheetName);
  const joinDateLocked = type === "member" ? memberHasPaymentsOrCoverage_(clean_(values[0])) : false;
  return {
    sheetName,
    row,
    type,
    values: values.map(displayEditValue_),
    joinDateLocked
  };
}

function getRowForEditByMemberId(form) {
  const memberId = clean_(form && form.memberId);
  if (!memberId) throw new Error("Member ID is required.");
  const member = memberIndex_().list.find(m => m.id.toLowerCase() === memberId.toLowerCase());
  if (!member) throw new Error("Member not found: " + memberId);
  const row = Number(member.rowNumber);
  if (!row || row < 3) throw new Error("Invalid row for member: " + memberId);
  const values = sh_(SHEETS.members).getRange(row, 1, 1, 10).getValues()[0];
  if (!values.some(v => v !== "")) throw new Error("Member row is empty.");
  const joinDateLocked = memberHasPaymentsOrCoverage_(memberId);
  return {
    sheetName: SHEETS.members,
    row,
    type: "member",
    values: values.map(displayEditValue_),
    joinDateLocked
  };
}

function getTrackedSelection_() {
  const cfg = configSheet_();
  const values = cfg.getRange("B4:B5").getValues().flat();
  return {
    sheetName: clean_(values[0]),
    row: Number(values[1]) || 0
  };
}

function updateSelectedRow(form) {
  return withWriteLock_("updateSelectedRow", () => updateSelectedRowUnlocked_(form));
}

function memberHasPaymentsOrCoverage_(memberId) {
  const id = clean_(memberId);
  if (!id) return false;
  const hasPayments = membershipPaymentsForMember_(id).length > 0;
  if (hasPayments) return true;
  return dataRows_(SHEETS.coverage).some(row => clean_(row[0]) === id);
}

function assertRegistrationYearEditAllowed_(form, row) {
  const existing = sh_(SHEETS.members).getRange(row, 1, 1, 8).getValues()[0];
  const existingMemberId = clean_(existing[0]);
  const oldJoin = coerceDate_(existing[4]);
  const newJoin = coerceDate_(form.joinDate);
  const oldStr = oldJoin ? oldJoin.toISOString().slice(0, 10) : "";
  const newStr = newJoin ? newJoin.toISOString().slice(0, 10) : "";
  if (oldStr === newStr) return;
  if (!memberHasPaymentsOrCoverage_(existingMemberId)) return;
  logAction_("EDIT_MEMBER_JOIN_DATE_BLOCKED", SHEETS.members, existingMemberId, existing[1],
    "Attempted join date change from " + oldStr + " to " + newStr, JSON.stringify({ actor: form.addedBy }));
  throw new Error("Join date cannot be changed after payments or coverage exist for this member.");
}

function updateSelectedRowUnlocked_(form) {
  const sheetName = clean_(form.sheetName);
  const row = Number(form.row);
  if (!row || row < 3) throw new Error("Invalid row selected.");
  const sh = sh_(sheetName);
  if (sameSheet_(sheetName, SHEETS.members)) {
    requirePermission_(clean_(form.addedBy), "manageMembers");
    const before = JSON.stringify(sh.getRange(row, 1, 1, 10).getDisplayValues()[0]);
    const name = clean_(form.fullName);
    if (!name) throw new Error("Full Name is required.");
    const addedBy = clean_(form.addedBy) || clean_(sh.getRange(row, 8).getDisplayValue());
    if (!addedBy) throw new Error("Added By is required.");
    const gender = clean_(form.gender);
    if (!gender) throw new Error("Gender is required.");
    if (gender !== "Male" && gender !== "Female") throw new Error("Gender must be Male or Female.");
    const birthDateRaw = clean_(form.birthDate);
    if (!birthDateRaw) throw new Error("Birth Date is required.");
    const birthDateObj = coerceDate_(birthDateRaw);
    if (!birthDateObj) throw new Error("Birth Date is not a valid date.");
    if (birthDateObj > new Date()) throw new Error("Birth Date cannot be in the future.");
    if (calculateAge_(birthDateObj) === null) throw new Error("Birth Date does not produce a valid age (0–120 years).");
    const memberId = clean_(form.memberId);
    const phone = normalizeGermanPhone_(form.phone);
    assertUniqueMemberId_(memberId, row);
    assertUniqueMemberPhone_(phone, row);
    assertRegistrationYearEditAllowed_(form, row);
    sh.getRange(row, 1, 1, 10).setValues([[
      memberId,
      name,
      phone,
      clean_(form.city),
      form.joinDate ? new Date(form.joinDate) : "",
      clean_(form.status) || "Active",
      clean_(form.notes),
      addedBy,
      gender,
      birthDateObj
    ]]);
    logAction_("EDIT_MEMBER", sheetName, clean_(form.memberId), clean_(form.fullName), before, JSON.stringify(form));
    clearCachedMemberList_();
  } else if (sameSheet_(sheetName, SHEETS.payments) || sameSheet_(sheetName, SHEETS.servicePayments)) {
    const paymentActor = clean_(form.admin) || clean_(form.recordedBy);
    requirePermission_(paymentActor, "editPayments");
    const before = JSON.stringify(sh.getRange(row, 1, 1, PAYMENT_HEADERS.length).getDisplayValues()[0]);
    const existingTxId = clean_(JSON.parse(before)[0]);
    if (existingTxId && hasActiveReceiptForPaymentId_(existingTxId)) {
      throw new Error("This payment has an active receipt. Void the receipt first before editing the payment.");
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
    const reason = clean_(form.reason) || (sheetName === SHEETS.payments ? "Membership" : "Voluntary");
    sh.getRange(row, 1, 1, 11).setValues([[
      clean_(form.transactionId),
      form.paymentDate ? new Date(form.paymentDate) : "",
      clean_(form.memberId),
      clean_(form.memberName),
      clean_(form.month),
      Number(form.year) || "",
      amount,
      reason,
      clean_(form.method) || "Cash",
      clean_(form.recordedBy),
      clean_(form.notes)
    ]]);
    sh.getRange(row, 7).setNote("Payment category: " + reason);
    logAction_("EDIT_PAYMENT", sheetName, clean_(form.transactionId), paymentActor, before, JSON.stringify(form), clean_(form.auditReason));
  } else if (sameSheet_(sheetName, SHEETS.expenses)) {
    const recordedBy = clean_(form.admin) || clean_(form.recordedBy) || clean_(form.who);
    if (!recordedBy) throw new Error("Recorded By is required. Please login again.");
    requirePermission_(recordedBy, "manageExpenses");
    const before = JSON.stringify(sh.getRange(row, 1, 1, EXPENSE_HEADERS.length).getDisplayValues()[0]);
    const amount = Number(form.amount);
    if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
    const current = sh.getRange(row, 1, 1, EXPENSE_HEADERS.length).getValues()[0];
    sh.getRange(row, 1, 1, EXPENSE_HEADERS.length).setValues([[
      form.expenseDate ? new Date(form.expenseDate) : "",
      clean_(form.category) || "General",
      clean_(form.description),
      amount,
      recordedBy,
      clean_(form.notes),
      truthy_(form.paidFromCollectedCash) ? "Yes" : (clean_(form.paidFromCollectedCash) || clean_(current[6]) || "No"),
      clean_(current[7]) || nextId_("EXP"),
      clean_(current[8]),
      clean_(current[9]) || "Pending"
    ]]);
    logAction_("EDIT_EXPENSE", sheetName, clean_(current[7]) || clean_(form.description), recordedBy, before, JSON.stringify({ category: clean_(form.category), description: clean_(form.description), amount, recordedBy, notes: clean_(form.notes), paidFromCollectedCash: truthy_(form.paidFromCollectedCash) }));
  } else {
    throw new Error("Unsupported sheet: " + sheetName);
  }
  invalidateFastCaches_([sheetName]);
  SpreadsheetApp.flush();
  return { ok: true, sheetName, row };
}

function deleteSelectedRow(form) {
  return withWriteLock_("deleteSelectedRow", () => deleteSelectedRowUnlocked_(form));
}

function voidReceipt(form) {
  return withWriteLock_("voidReceipt", () => {
    const receiptId = clean_(form && form.receiptId);
    const admin = clean_(form && form.admin);
    const reason = clean_(form && form.reason);
    if (!receiptId) throw new Error("Receipt ID is required.");
    if (!reason) throw new Error("A void reason is required.");
    requirePermission_(admin, "deletePayments");
    const rows = receiptRowsById_(receiptId).filter(item => receiptStatus_(item.values) !== "Voided");
    if (!rows.length) throw new Error("No active receipt found for: " + receiptId);
    rows.forEach(item => item.sheet.getRange(item.rowNumber, 15, 1, 2).setValues([["Voided", new Date()]]));
    logAction_("VOID_RECEIPT", SHEETS.receipts, receiptId, admin, JSON.stringify(rows.map(item => item.values)), "Voided", reason);
    return { ok: true, receiptId, status: "Voided", voidedRows: rows.length };
  });
}

function deleteSelectedRowUnlocked_(form) {
  const sheetName = clean_(form.sheetName);
  const row = Number(form.row);
  const admin = clean_(form.admin);
  const reason = clean_(form.reason);
  if (!row || row < 3) throw new Error("Load a data row before deleting.");
  if (!reason) throw new Error("A deletion reason is required.");
  const sh = sh_(sheetName);
  const type = editType_(sheetName);
  if (type === "payment") requirePermission_(admin, "deletePayments");
  else if (type === "member") throw new Error("Members cannot be deleted from the raw row editor. Use the Remove Member tool so linked payments, coverage, receipts, and audit records are handled safely.");
  else if (type === "expense") requirePermission_(admin, "manageExpenses");
  else throw new Error("This sheet cannot be deleted from the sidebar.");
  const width = type === "member" ? 8 : type === "expense" ? 6 : PAYMENT_HEADERS.length;
  const before = sh.getRange(row, 1, 1, width).getDisplayValues()[0];
  const recordId = before[0] || sheetName + " row " + row;
  if (type === "payment" && hasActiveReceiptForPaymentId_(recordId)) {
    throw new Error("This payment has an active receipt. Void the receipt first before deleting the payment.");
  }

  // Build the reversal plan before touching any data. If plan construction throws
  // (e.g. savings log entry not found), the payment row is still intact.
  const plan = type === "payment" ? buildPaymentReversalPlan_(before, recordId) : null;

  sh.deleteRow(row);
  logAction_("DELETE_" + type.toUpperCase(), sheetName, recordId, admin, JSON.stringify(before), "Deleted", reason);
  if (type === "member") clearCachedMemberList_();
  invalidateFastCaches_([sheetName]);

  // Execute reversals atomically — no try/catch; any failure surfaces immediately.
  if (plan) {
    if (plan.usesSavings) reverseSavingsForDeletedPayment_(plan);
    if (plan.coverageItems.length) revertCoverageForDeletedPayment_(plan, recordId);
    logPaymentDeletionAudit_(recordId, admin, reason, plan);
    invalidateFastCaches_([SHEETS.savingsConversionLog, SHEETS.savingsHistory, SHEETS.savingsBalance, SHEETS.coverage]);
  }

  SpreadsheetApp.flush();
  return { ok: true, sheetName, row, recordId };
}

// Pre-computes everything needed to reverse a payment deletion.
// Throws before any data is modified if required records cannot be located.
function buildPaymentReversalPlan_(before, recordId) {
  const paymentType = clean_(before[7]);
  const coverageItems = coverageItemsFromPaymentRow_(before);
  if (paymentType !== "Membership") {
    return { usesSavings: false, coverageItems };
  }

  const memberId   = clean_(before[2]);
  const memberName = clean_(before[3]);
  const amount     = Number(before[6]) || 0;
  const noteText   = clean_(before[10]);

  const isAutoConversion  = isSavingsConversionPaymentRow_(before) && noteText.indexOf("Auto-converted from savings deposit ") >= 0;
  const isExistingBalance = isSavingsConversionPaymentRow_(before) && noteText.indexOf("Savings used with membership payment ") >= 0;
  const usesSavings = isAutoConversion || isExistingBalance;

  if (!usesSavings) {
    return { memberId, memberName, usesSavings: false, coverageItems };
  }

  const logRows = currentDataRows_(SHEETS.savingsConversionLog);

  if (isAutoConversion) {
    // addSavingsDepositUnlocked_ writes conversionLog col 4 = payment txId.
    const logIdx = logRows.findIndex(r => clean_(r[1]) === memberId && clean_(r[4]) === recordId);
    if (logIdx < 0) {
      throw new Error("Cannot delete payment " + recordId + ": no savings conversion log entry found. Contact a Super Admin to correct the savings records before retrying.");
    }
    const depositMatch = noteText.match(/Auto-converted from savings deposit\s+(SAV-[A-Za-z0-9_-]+)/i);
    if (!depositMatch) {
      throw new Error("Cannot delete payment " + recordId + ": unable to parse deposit ID from notes. Contact a Super Admin.");
    }
    const depositId = depositMatch[1];
    const histRows  = currentDataRows_(SHEETS.savingsHistory);
    const histIdx   = histRows.findIndex(r => clean_(r[0]) === depositId);
    if (histIdx < 0) {
      throw new Error("Cannot delete payment " + recordId + ": savings deposit " + depositId + " not found in savings history. Contact a Super Admin.");
    }
    return {
      memberId, memberName, usesSavings: true, coverageItems,
      savingsPlan: {
        type: "autoConversion",
        logSheetRow: logIdx + 3,
        histSheetRow: histIdx + 3,
        histCurrentConverted: Number(histRows[histIdx][10]) || 0,
        histCurrentTxIds: clean_(String(histRows[histIdx][11])),
        paymentTxId: recordId,
        paymentAmount: amount
      }
    };
  }

  // isExistingBalance: applySavingsToMembershipPayment_ uses conversionId = baseId+"-SAV".
  const baseMatch = noteText.match(/Savings used with membership payment\s+(\S+)/i);
  if (!baseMatch) {
    throw new Error("Cannot delete payment " + recordId + ": unable to parse base payment ID from notes. Contact a Super Admin.");
  }
  const baseId = baseMatch[1];
  const convId = baseId + "-SAV";
  const logIdx = logRows.findIndex(r => clean_(r[1]) === memberId && clean_(r[4]) === convId);
  if (logIdx < 0) {
    throw new Error("Cannot delete payment " + recordId + ": no savings conversion entry found for " + convId + ". Contact a Super Admin.");
  }
  return {
    memberId, memberName, usesSavings: true, coverageItems,
    savingsPlan: {
      type: "existingBalance",
      logSheetRow: logIdx + 3,
      currentLogAmount: Number(logRows[logIdx][6]) || 0,
      paymentAmount: amount,
      convId
    }
  };
}

// Restores the member's savings balance. Throws on any failure (no try/catch).
function reverseSavingsForDeletedPayment_(plan) {
  const sp    = plan.savingsPlan;
  const logSh = sh_(SHEETS.savingsConversionLog);

  if (sp.type === "autoConversion") {
    // Delete the single conversion log entry for this payment.
    logSh.deleteRow(sp.logSheetRow);
    advanceAppendRow_(SHEETS.savingsConversionLog, logSh.getLastRow() + 1);

    // Reduce Savings History col 10 (convertedAmount) and remove the txId from col 11.
    const newConverted = Math.max(0, Number((sp.histCurrentConverted - sp.paymentAmount).toFixed(2)));
    const newTxIds = sp.histCurrentTxIds.split(",")
      .map(s => s.trim())
      .filter(id => id && id !== sp.paymentTxId)
      .join(", ");
    sh_(SHEETS.savingsHistory).getRange(sp.histSheetRow, 11, 1, 2).setValues([[newConverted, newTxIds]]);

  } else {
    // existingBalance: reduce the shared log entry's amount by this payment's portion.
    const newAmount = Number((sp.currentLogAmount - sp.paymentAmount).toFixed(2));
    if (newAmount <= 0) {
      logSh.deleteRow(sp.logSheetRow);
      advanceAppendRow_(SHEETS.savingsConversionLog, logSh.getLastRow() + 1);
    } else {
      logSh.getRange(sp.logSheetRow, 7).setValue(newAmount);
    }
  }

  // Invalidate caches, recompute the ledger, and update the balance cell.
  invalidateFastCaches_([SHEETS.savingsConversionLog, SHEETS.savingsHistory]);
  delete CMS_DATA_CONTEXT_["savings:ledger:" + clean_(plan.memberId)];
  const newBalance = ledgerSavingsBalanceForMember_(plan.memberId);
  const balanceRow = savingsBalanceRow_(plan.memberId);
  if (balanceRow > 0) {
    sh_(SHEETS.savingsBalance).getRange(balanceRow, 3, 1, 2).setValues([[newBalance, new Date()]]);
  }
}

// Clears Coverage sheet months that were paid only by the deleted payment.
// Months still covered by remaining payments are preserved. Throws on failure.
function revertCoverageForDeletedPayment_(plan, txId) {
  // paymentCoverageIndex_ is rebuilt fresh here: payments cache was invalidated after
  // deletion, so paidByMemberYear reflects only remaining payments.
  const index      = paymentCoverageIndex_();
  const coverageSh = sh_(SHEETS.coverage);
  const affectedYears = [...new Set(plan.coverageItems.map(item => item.year))];

  affectedYears.forEach(year => {
    const mapKey = clean_(plan.memberId) + "|" + year;
    const rowNum = index.coverageRowByMemberYear[mapKey];
    if (!rowNum) return;

    const stillPaid = index.paidByMemberYear[mapKey] || {};
    const rowValues = coverageSh.getRange(rowNum, 1, 1, 18).getValues()[0];
    while (rowValues.length < 18) rowValues.push("");

    MONTHS.forEach((month, i) => { rowValues[3 + i] = stillPaid[month] ? "Paid" : ""; });

    const missing = MONTHS.filter(m => !stillPaid[m]);
    rowValues[15] = missing.map(m => m.slice(0, 3)).join(", ");
    rowValues[16] = txId + " (reversed)";
    rowValues[17] = new Date();

    coverageSh.getRange(rowNum, 1, 1, 18).setValues([rowValues]);
  });
}

// Hard-fail audit write for payment deletion with reversal.
// Intentionally no try/catch — audit failure must surface immediately.
function logPaymentDeletionAudit_(txId, admin, reason, plan) {
  const detail = JSON.stringify({
    memberId: plan.memberId,
    savingsReversed: plan.usesSavings,
    savingsType: plan.usesSavings ? plan.savingsPlan.type : null,
    amountReversed: plan.usesSavings ? plan.savingsPlan.paymentAmount : 0,
    coverageYears: [...new Set((plan.coverageItems || []).map(i => i.year))]
  });
  sh_(SHEETS.audit).appendRow(
    [new Date(), "DELETE_PAYMENT_WITH_REVERSAL", SHEETS.payments, txId, admin, reason, detail, "Reversal completed"]
  );
}

function mergeMembers(form) {
  return withWriteLock_("mergeMembers", () => mergeMembersUnlocked_(form));
}

function removeMember(form) {
  return withWriteLock_("removeMember", () => removeMemberUnlocked_(form));
}

function removeMemberUnlocked_(form) {
  const startedAt = Date.now();
  const memberId = clean_(form.memberId);
  const admin = clean_(form.admin);
  if (!memberId) throw new Error("Choose a member to remove.");
  requirePermission_(admin, "manageAdmins");
  const member = findMember_(memberId);
  if (!member) throw new Error("Member not found.");
  const plan = memberRemovalPlan_(memberId);
  if (!plan.members.rows.length) throw new Error("Member row not found.");
  const before = JSON.stringify(plan.members.displayRows[0] || []);
  const deleted = {};
  [
    ["payments", plan.payments],
    ["servicePayments", plan.servicePayments],
    ["coverage", plan.coverage],
    ["receipts", plan.receipts],
    ["audit", plan.audit],
    ["members", plan.members]
  ].forEach(item => {
    deleted[item[0]] = deletePlannedRows_(item[1]);
  });
  clearRemovalCaches_();
  docPropDel_("CMS_AUDIT_NEXT_ROW");
  logAction_("REMOVE_MEMBER", SHEETS.members, memberId, admin, before, JSON.stringify({ memberId, name: member.name, deleted }), "Member removed with linked records");
  clearCachedMemberList_();
  return {
    ok: true,
    memberId,
    name: member.name,
    deleted,
    elapsedMs: Date.now() - startedAt
  };
}

function memberRemovalPlan_(memberId) {
  return {
    members: matchingRowsForDelete_(SHEETS.members, row => clean_(row[0]) === memberId),
    payments: matchingRowsForDelete_(SHEETS.payments, row => clean_(row[2]) === memberId),
    servicePayments: matchingRowsForDelete_(SHEETS.servicePayments, row => clean_(row[2]) === memberId),
    coverage: matchingRowsForDelete_(SHEETS.coverage, row => clean_(row[0]) === memberId),
    receipts: matchingRowsForDelete_(SHEETS.receipts, row => clean_(row[2]) === memberId),
    audit: matchingRowsForDelete_(SHEETS.audit, row => row.some(cell => clean_(cell).indexOf(memberId) >= 0))
  };
}

function matchingRowsForDelete_(sheetName, predicate) {
  const sh = sheetByName_(sheetName);
  if (!sh || sh.getLastRow() < 3) return { sheet: sh, rows: [], displayRows: [] };
  const rowCount = sh.getLastRow() - 2;
  const width = sheetDataWidth_(sheetName, sh);
  const values = sh.getRange(3, 1, rowCount, width).getValues();
  const displayValues = sh.getRange(3, 1, rowCount, width).getDisplayValues();
  const rows = [];
  const displayRows = [];
  values.forEach((row, index) => {
    if (predicate(row)) {
      rows.push(index + 3);
      displayRows.push(displayValues[index]);
    }
  });
  return { sheet: sh, rows, displayRows };
}

function deletePlannedRows_(plan) {
  if (!plan || !plan.sheet || !plan.rows.length) return 0;
  const sh = plan.sheet;
  const totalDataRows = sh.getLastRow() - 2; // rows 1-2 are always frozen (title + headers)
  // GAS throws "cannot delete all non-frozen rows" when deleteRows would remove every data row.
  // In that case, clear content instead — all data-reading functions skip blank rows.
  if (plan.rows.length >= totalDataRows) {
    const width = Math.max(sh.getLastColumn(), 1);
    plan.rows.forEach(rowNumber => sh.getRange(rowNumber, 1, 1, width).clearContent());
    return plan.rows.length;
  }
  contiguousDeleteRanges_(plan.rows).forEach(range => sh.deleteRows(range.start, range.count));
  return plan.rows.length;
}

function contiguousDeleteRanges_(rows) {
  return rows.slice().sort((a, b) => b - a).reduce((ranges, row) => {
    const last = ranges[ranges.length - 1];
    if (last && row === last.start - 1) {
      last.start = row;
      last.count += 1;
    } else {
      ranges.push({ start: row, count: 1 });
    }
    return ranges;
  }, []);
}

function clearRemovalCaches_() {
  delete CMS_DATA_CONTEXT_["member:index"];
  delete CMS_DATA_CONTEXT_["cache:members:list"];
  delete CMS_DATA_CONTEXT_["payment:coverage:index"];
  [
    SHEETS.members,
    SHEETS.payments,
    SHEETS.servicePayments,
    SHEETS.coverage,
    SHEETS.receipts,
    SHEETS.audit
  ].forEach(sheetName => delete CMS_DATA_CONTEXT_["rows:" + sheetName]);
  try {
    const cache = CacheService.getDocumentCache();
    cache.remove("members:index:v2");
    cache.remove("payments:coverage:v2");
    cache.remove("payments:coverage:v3");
  } catch (err) {
    // Cache clearing is best effort.
  }
  clearCachedMembershipFundingIndex_();
  try {
    docPropDel_("CMS_PAID_COVERAGE_DELTA");
    [
      SHEETS.members,
      SHEETS.payments,
      SHEETS.servicePayments,
      SHEETS.coverage,
      SHEETS.receipts,
      SHEETS.audit
    ].forEach(sheetName => docPropDel_(nextRowPropertyKey_(sheetName)));
  } catch (err) {
    // Cache clearing is best effort.
  }
}

function mergeMembersUnlocked_(form) {
  const keepId = clean_(form.keepMemberId);
  const mergeId = clean_(form.mergeMemberId);
  if (!keepId || !mergeId) throw new Error("Both Member IDs are required.");
  if (keepId === mergeId) throw new Error("Choose two different Member IDs.");
  const keep = findMember_(keepId);
  const merge = findMember_(mergeId);
  if (!keep || !merge) throw new Error("Could not find both members.");
  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    const sh = sh_(sheetName);
    const values = sh.getRange(3, 1, Math.max(sh.getLastRow() - 2, 1), 11).getValues();
    values.forEach((row, index) => {
      if (String(row[2]) === mergeId) {
        sh.getRange(index + 3, 3).setValue(keepId);
        sh.getRange(index + 3, 4).setValue(keep.name);
      }
    });
  });
  const memberSh = sh_(SHEETS.members);
  const memberValues = memberSh.getRange(3, 1, Math.max(memberSh.getLastRow() - 2, 1), 7).getValues();
  memberValues.forEach((row, index) => {
    if (String(row[0]) === mergeId) {
      memberSh.getRange(index + 3, 6).setValue("Inactive");
      memberSh.getRange(index + 3, 7).setValue([row[6], "Merged into " + keepId].filter(Boolean).join(" | "));
    }
  });
  logAction_("MERGE_MEMBERS", SHEETS.members, keepId, clean_(form.admin) || "", mergeId, "Merged into " + keepId);
  clearCachedMemberList_();
  invalidateFastCaches_([SHEETS.members, SHEETS.payments, SHEETS.servicePayments]);
  SpreadsheetApp.flush();
  return { ok: true, keepId, mergeId };
}

function generateMonthlyReport(form) {
  return withWriteLock_("generateMonthlyReport", () => withCmsProtectionsSuspended_(() => generateMonthlyReportUnlocked_(form)));
}

function generateMonthlyReportUnlocked_(form) {
  const year = Number(form.year) || new Date().getFullYear();
  const month = clean_(form.month) || MONTHS[new Date().getMonth()];
  const monthIndex = MONTHS.indexOf(month) + 1;
  if (!monthIndex) throw new Error("Invalid month.");
  const data = buildMonthlyReportData_(year, month, form);
  const membership = data.selected.membership;
  const service = data.selected.service;
  const expenses = data.selected.expenses;
  const total = data.selected.total;
  const net = data.selected.net;
  const generatedBy = clean_(form.generatedBy);
  const reportUrl = createMonthlyReportPdf_(data);
  const whatsappUrl = buildWhatsAppMonthlyReportUrl_(form.whatsappPhone, data, reportUrl);
  sh_(SHEETS.monthlyReports).appendRow([new Date(), year, month, membership, service, total, expenses, net, generatedBy, clean_(form.notes)]);
  logAction_("GENERATE_MONTHLY_REPORT", SHEETS.monthlyReports, month + " " + year, generatedBy, "", JSON.stringify({ membership, service, expenses, net, reportUrl }));
  SpreadsheetApp.flush();
  return { ok: true, year, month, membership, service, total, expenses, net, reportUrl, whatsappUrl };
}

function buildMonthlyReportData_(year, month, form) {
  const monthIndex = MONTHS.indexOf(month) + 1;
  const breakdown = MONTHS.map((label, index) => {
    const i = index + 1;
    const membership = sumPaymentsForMonth_(SHEETS.payments, year, i);
    const service = sumPaymentsForMonth_(SHEETS.servicePayments, year, i);
    const expenses = sumExpensesForMonth_(year, i);
    const total = membership + service;
    return { label, index: i, membership, service, total, expenses, net: total - expenses };
  });
  const selected = breakdown[monthIndex - 1];
  const previous = breakdown[monthIndex - 2] || null;
  const ytd = breakdown.slice(0, monthIndex).reduce((acc, row) => ({
    membership: acc.membership + row.membership,
    service: acc.service + row.service,
    total: acc.total + row.total,
    expenses: acc.expenses + row.expenses,
    net: acc.net + row.net
  }), { membership: 0, service: 0, total: 0, expenses: 0, net: 0 });
  const activeMembers = rows_(SHEETS.members).filter(r => clean_(r[5]).toLowerCase() !== "inactive").length;
  const selectedPayments = recentRowsForMonth_([SHEETS.payments, SHEETS.servicePayments], year, monthIndex, 8);
  const selectedExpenses = recentRowsForMonth_([SHEETS.expenses], year, monthIndex, 8);
  return {
    year,
    month,
    monthIndex,
    selected,
    previous,
    ytd,
    activeMembers,
    breakdown,
    selectedPayments,
    selectedExpenses,
    generatedBy: clean_(form.generatedBy),
    notes: clean_(form.notes),
    generatedAt: new Date()
  };
}

function recentRowsForMonth_(sheetNames, year, monthIndex, limit) {
  const rows = [];
  sheetNames.forEach(sheetName => {
    rows_(sheetName).forEach(r => {
      const date = coerceDate_(sheetName === SHEETS.expenses ? r[0] : r[1]);
      if (!date || date.getFullYear() !== year || date.getMonth() + 1 !== monthIndex) return;
      if (sheetName === SHEETS.expenses) {
        rows.push({ date, type: "Expense", name: clean_(r[2]) || clean_(r[1]), category: clean_(r[1]), amount: Number(r[3]) || 0 });
      } else {
        rows.push({ date, type: sheetName === SHEETS.payments ? "Membership" : "Service", name: clean_(r[3]), category: clean_(r[7]), amount: Number(r[6]) || 0 });
      }
    });
  });
  return rows.sort((a, b) => b.date - a.date).slice(0, limit);
}

