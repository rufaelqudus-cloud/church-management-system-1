function memberFromRow_(row, rowNumber) {
  return {
    id: String(row[0] || ""),
    name: String(row[1] || ""),
    phone: String(row[2] || ""),
    city: String(row[3] || ""),
    joinDate: row[4],
    status: String(row[5] || ""),
    notes: String(row[6] || ""),
    addedBy: String(row[7] || ""),
    gender: String(row[8] || ""),
    birthDate: row[9] || "",
    rowNumber: rowNumber || 0
  };
}

function memberIndex_() {
  const key = "member:index";
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  const cached = cachedMemberList_();
  if (cached) {
    CMS_DATA_CONTEXT_[key] = buildMemberIndexFromList_(cached);
    return CMS_DATA_CONTEXT_[key];
  }
  const list = dataRows_(SHEETS.members).map((row, i) => memberFromRow_(row, i + 3)).filter(m => m.id);
  putCachedMemberList_(list);
  CMS_DATA_CONTEXT_[key] = buildMemberIndexFromList_(list);
  return CMS_DATA_CONTEXT_[key];
}

function buildMemberIndexFromList_(list) {
  const byId = {};
  const byPhone = {};
  list.forEach(member => {
    byId[member.id.toLowerCase()] = member;
    const phoneKey = clean_(member.phone).replace(/\s+/g, "").toLowerCase();
    if (phoneKey) byPhone[phoneKey] = member;
  });
  return { list, byId, byPhone };
}

function cachedMemberList_() {
  try {
    const raw = CacheService.getDocumentCache().get("members:index:v2");
    if (!raw) return null;
    return JSON.parse(raw).map(item => {
      if (Array.isArray(item)) {
        return {
          id: String(item[0] || ""),
          name: String(item[1] || ""),
          phone: String(item[2] || ""),
          city: String(item[3] || ""),
          joinDate: item[4] ? new Date(item[4]) : "",
          status: String(item[5] || ""),
          notes: "",
          addedBy: "",
          rowNumber: Number(item[6]) || 0
        };
      }
      item.joinDate = item.joinDate ? new Date(item.joinDate) : "";
      return item;
    });
  } catch (err) {
    return null;
  }
}

function putCachedMemberList_(list) {
  try {
    const serializable = list.map(member => [
      member.id,
      member.name,
      member.phone,
      member.city || "",
      member.joinDate ? new Date(member.joinDate).toISOString() : "",
      member.status || "",
      Number(member.rowNumber) || 0
    ]);
    const text = JSON.stringify(serializable);
    if (text.length < 95000) CacheService.getDocumentCache().put("members:index:v2", text, 600);
  } catch (err) {
    // Persistent member cache is best-effort; request-local maps still work.
  }
}

function clearCachedMemberList_() {
  try {
    CacheService.getDocumentCache().remove("members:index:v2");
  } catch (err) {
    // Best-effort cache clearing.
  }
}

function appendCachedMember_(member) {
  const list = cachedMemberList_();
  if (!list) return;
  list.push(member);
  putCachedMemberList_(list);
}

function paymentCoverageIndex_() {
  const key = "payment:coverage:index";
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  const paidByMemberYear = {};
  const coverageRowByMemberYear = {};
  currentDataRows_(SHEETS.coverage).forEach((row, index) => {
    const memberId = clean_(row[0]);
    const year = Number(row[2]);
    if (!memberId || !year) return;
    const mapKey = memberId + "|" + year;
    coverageRowByMemberYear[mapKey] = index + 3;
  });
  const fundingIndex = membershipFundingIndex_();
  const membersById = {};
  memberIndex_().list.forEach(member => membersById[member.id] = member);
  Object.keys(fundingIndex.amountByMemberYear || {}).forEach(mapKey => {
    const parts = mapKey.split("|");
    const memberId = parts[0];
    const year = Number(parts[1]);
    const member = membersById[memberId];
    const months = member ? dueMonthsForMemberYear_(member, year) : Object.keys((fundingIndex.monthsByMemberYear || {})[mapKey] || {});
    const required = expectedAmountForItems_(months.map(month => ({ year, month })));
    const funded = Number(fundingIndex.amountByMemberYear[mapKey] || 0);
    if (required > 0 && funded + 0.001 >= required) {
      const paid = paidByMemberYear[mapKey] || {};
      months.forEach(month => {
        if (MONTHS.includes(month)) paid[month] = true;
      });
      paidByMemberYear[mapKey] = paid;
    }
  });
  CMS_DATA_CONTEXT_[key] = { paidByMemberYear, coverageRowByMemberYear, amountByMemberYear: fundingIndex.amountByMemberYear };
  return CMS_DATA_CONTEXT_[key];
}

function cachedPaidCoverageIndex_() {
  try {
    const sh = sheetByName_(SHEETS.payments);
    if (!sh) return null;
    const stampedAt = sh.getLastRow();
    const raw = CacheService.getDocumentCache().get("payments:coverage:v3");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.stamp == null) return null;
    const delta = paidCoverageDelta_();
    // Reject on stamp mismatch unless row count went up (append-only) with a delta to bridge the gap.
    if (parsed.stamp !== stampedAt && (!delta.length || stampedAt <= parsed.stamp)) return null;
    const paidByMemberYear = {};
    parsed.rows.concat(delta).forEach(item => {
      const key = item[0] + "|" + item[1];
      const paid = paidByMemberYear[key] || {};
      const mask = Number(item[2]) || 0;
      MONTHS.forEach((month, index) => {
        if (mask & (1 << index)) paid[month] = true;
      });
      paidByMemberYear[key] = paid;
    });
    return { paidByMemberYear, coverageRowByMemberYear: {} };
  } catch (err) {
    return null;
  }
}

function putCachedPaidCoverageIndex_(index) {
  try {
    const sh = sheetByName_(SHEETS.payments);
    if (!sh) return;
    const compact = Object.keys(index.paidByMemberYear || {}).map(key => {
      const bits = key.split("|");
      const paid = index.paidByMemberYear[key] || {};
      let mask = 0;
      MONTHS.forEach((month, i) => {
        if (paid[month]) mask += (1 << i);
      });
      return [bits[0], Number(bits[1]), mask];
    });
    const payload = JSON.stringify({ stamp: sh.getLastRow(), rows: compact });
    if (payload.length < 95000) {
      CacheService.getDocumentCache().put("payments:coverage:v3", payload, 600);
      docPropDel_("CMS_PAID_COVERAGE_DELTA");
    }
  } catch (err) {
    // Paid coverage cache is best-effort.
  }
}

function paidCoverageDelta_() {
  try {
    const raw = docProp_("CMS_PAID_COVERAGE_DELTA");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function membershipFundingIndex_() {
  const key = "membership:funding:index";
  if (CMS_DATA_CONTEXT_[key]) return CMS_DATA_CONTEXT_[key];
  const cached = cachedMembershipFundingIndex_();
  if (cached) {
    CMS_DATA_CONTEXT_[key] = cached;
    return cached;
  }
  const computed = computeMembershipFundingIndex_();
  putCachedMembershipFundingIndex_(computed);
  CMS_DATA_CONTEXT_[key] = computed;
  return computed;
}

function computeMembershipFundingIndex_() {
  const amountByMemberYear = {};
  const monthsByMemberYear = {};
  dataRows_(SHEETS.payments).forEach(row => {
    const memberId = clean_(row[2]);
    if (!memberId || clean_(row[7]) !== "Membership") return;
    const amount = Number(row[6]) || 0;
    if (amount <= 0) return;
    const items = coverageItemsFromPaymentRow_(row);
    if (!items.length) return;
    const grouped = coverageByYear_(items);
    const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    if (years.length <= 1) {
      const year = years[0] || Number(row[5]) || new Date().getFullYear();
      const mapKey = memberId + "|" + year;
      amountByMemberYear[mapKey] = Number(((amountByMemberYear[mapKey] || 0) + amount).toFixed(2));
      const months = monthsByMemberYear[mapKey] || {};
      (grouped[year] || MONTHS).forEach(month => months[month] = true);
      monthsByMemberYear[mapKey] = months;
      return;
    }
    let remaining = amount;
    years.forEach(year => {
      if (remaining <= 0) return;
      const yearItems = (grouped[year] || []).map(month => ({ year, month }));
      const required = Number(expectedAmountForItems_(yearItems).toFixed(2));
      const applied = Math.min(remaining, required || remaining);
      const mapKey = memberId + "|" + year;
      amountByMemberYear[mapKey] = Number(((amountByMemberYear[mapKey] || 0) + applied).toFixed(2));
      const months = monthsByMemberYear[mapKey] || {};
      (grouped[year] || []).forEach(month => months[month] = true);
      monthsByMemberYear[mapKey] = months;
      remaining = Number((remaining - applied).toFixed(2));
    });
  });
  return { amountByMemberYear, monthsByMemberYear };
}

// --- CacheService layer for membershipFundingIndex_ ---
// Compact format: rows are [memberIdx, year, cents, monthMask] where memberIdx is
// the position of the member ID in the stored `members` array. This cuts per-entry
// size from ~48 bytes to ~20 bytes, keeping the payload under 95 KB at 300+ members.
// Stamp is {pay, mem} — payments sheet last row + members sheet last row. Any change
// to either sheet invalidates the cache. Plain payment appends are bridged via a small
// delta in PropertiesService (delta still uses member ID strings — small and safe).
// Overflow fallback: if payload exceeds 95 KB, data is chunked into PropertiesService.
function cachedMembershipFundingIndex_() {
  try {
    const sh = sheetByName_(SHEETS.payments);
    const msh = sheetByName_(SHEETS.members);
    if (!sh || !msh) return null;
    const payStamp = sh.getLastRow();
    const memStamp = msh.getLastRow();

    // Try CacheService first (primary path)
    let parsed = null;
    const raw = CacheService.getDocumentCache().get(MEMBERSHIP_FUNDING_CACHE_KEY);
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) {}
    }

    // Fall back to PropertiesService chunks if CacheService missed.
    // All chunk reads go through docProp_() — the batch is loaded once for the whole request.
    if (!parsed) {
      const manifestRaw = docProp_(MEMBERSHIP_FUNDING_MANIFEST_KEY);
      if (manifestRaw) {
        try {
          const manifest = JSON.parse(manifestRaw);
          if (manifest && manifest.memberChunks >= 0 && manifest.dataChunks >= 0) {
            const members = [];
            let memberChunksOk = true;
            for (let i = 0; i < manifest.memberChunks; i++) {
              const chunk = docProp_(MEMBERSHIP_FUNDING_MEMBER_CHUNK_PREFIX + i);
              if (!chunk) { memberChunksOk = false; break; }
              JSON.parse(chunk).forEach(id => members.push(id));
            }
            if (memberChunksOk) {
              const rows = [];
              let dataChunksOk = true;
              for (let i = 0; i < manifest.dataChunks; i++) {
                const chunk = docProp_(MEMBERSHIP_FUNDING_DATA_CHUNK_PREFIX + i);
                if (!chunk) { dataChunksOk = false; break; }
                JSON.parse(chunk).forEach(r => rows.push(r));
              }
              if (dataChunksOk) {
                parsed = { stamp: manifest.stamp, members: members, rows: rows };
              }
            }
          }
        } catch (e) {}
      }
    }

    if (!parsed || !parsed.stamp || !Array.isArray(parsed.members)) return null;

    // Validate both stamps — member list change requires full rebuild
    const cachedPay = parsed.stamp.pay;
    const cachedMem = parsed.stamp.mem;
    if (cachedMem !== memStamp) return null;
    const delta = membershipFundingDelta_();
    // Pay stamp mismatch: accept only if delta can bridge the gap (plain append)
    if (cachedPay !== payStamp && (!delta.length || payStamp <= cachedPay)) return null;

    // Expand compact rows using the stored member list (not the live list)
    const storedMembers = parsed.members;
    const amountByMemberYear = {};
    const monthsByMemberYear = {};

    parsed.rows.forEach(item => {
      const memberId = storedMembers[item[0]];
      if (!memberId) return;
      const mapKey = memberId + "|" + item[1];
      amountByMemberYear[mapKey] = Number((Number(amountByMemberYear[mapKey] || 0) + item[2] / 100).toFixed(2));
      const months = monthsByMemberYear[mapKey] || {};
      MONTHS.forEach((month, i) => { if (item[3] & (1 << i)) months[month] = true; });
      monthsByMemberYear[mapKey] = months;
    });

    // Apply delta (still uses member ID strings — small, fast)
    delta.forEach(item => {
      const mapKey = item[0] + "|" + item[1];
      amountByMemberYear[mapKey] = Number((Number(amountByMemberYear[mapKey] || 0) + item[2] / 100).toFixed(2));
      const months = monthsByMemberYear[mapKey] || {};
      MONTHS.forEach((month, i) => { if (item[3] & (1 << i)) months[month] = true; });
      monthsByMemberYear[mapKey] = months;
    });

    return { amountByMemberYear, monthsByMemberYear };
  } catch (err) {
    return null;
  }
}

function putCachedMembershipFundingIndex_(index) {
  try {
    const sh = sheetByName_(SHEETS.payments);
    const msh = sheetByName_(SHEETS.members);
    if (!sh || !msh) return { cacheWriteOk: false, reason: "sheet not found" };

    const memberList = memberIndex_().list;
    const idToIdx = {};
    memberList.forEach((m, i) => { idToIdx[m.id] = i; });

    // Build old-format rows (member ID strings) to measure original payload size
    const oldRows = [];
    const compact = [];
    Object.keys(index.amountByMemberYear || {}).forEach(mapKey => {
      const parts = mapKey.split("|");
      const memberId = parts[0];
      const year = Number(parts[1]);
      const months = (index.monthsByMemberYear || {})[mapKey] || {};
      let mask = 0;
      MONTHS.forEach((month, i) => { if (months[month]) mask += (1 << i); });
      const cents = Math.round(Number(index.amountByMemberYear[mapKey] || 0) * 100);
      oldRows.push([memberId, year, cents, mask]);
      const idx = idToIdx[memberId];
      if (idx == null) return; // member not in current list — skip safely
      compact.push([idx, year, cents, mask]);
    });

    const stamp = { pay: sh.getLastRow(), mem: msh.getLastRow() };
    const memberIds = memberList.map(m => m.id);
    const originalSize = JSON.stringify({ stamp: stamp.pay, rows: oldRows }).length;
    const payload = JSON.stringify({ stamp, members: memberIds, rows: compact });
    const compressedSize = payload.length;
    const compressionPct = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

    let cacheWriteOk = false;
    let storedVia = "none";
    if (payload.length < 95000) {
      CacheService.getDocumentCache().put(MEMBERSHIP_FUNDING_CACHE_KEY, payload, 600);
      docPropDel_("CMS_MEMBERSHIP_FUNDING_DELTA");
      cacheWriteOk = true;
      storedVia = "CacheService";
    } else {
      cacheWriteOk = writeFundingIndexToProps_(compact, stamp, memberIds);
      storedVia = cacheWriteOk ? "PropertiesService" : "none";
      if (!cacheWriteOk) {
        try { logAction_("FUNDING_CACHE_OVERFLOW", "system", "Funding index payload " + payload.length + " bytes — too large for CacheService and PropertiesService fallback failed"); } catch (e) {}
      }
    }

    return { cacheWriteOk, originalSize, compressedSize, compressionPct, rowCount: compact.length, memberCount: memberList.length, storedVia };
  } catch (err) {
    return { cacheWriteOk: false, reason: String(err.message || err) };
  }
}

function writeFundingIndexToProps_(compact, stamp, memberIds) {
  try {
    // Chunk member list
    const memberChunks = [];
    for (let i = 0; i < memberIds.length; i += MEMBERSHIP_FUNDING_MEMBERS_PER_CHUNK) {
      memberChunks.push(memberIds.slice(i, i + MEMBERSHIP_FUNDING_MEMBERS_PER_CHUNK));
    }
    // Chunk data rows
    const dataChunks = [];
    for (let i = 0; i < compact.length; i += MEMBERSHIP_FUNDING_ROWS_PER_CHUNK) {
      dataChunks.push(compact.slice(i, i + MEMBERSHIP_FUNDING_ROWS_PER_CHUNK));
    }
    // Write all chunks via docPropSet_ so the in-request batch stays current
    for (let i = 0; i < memberChunks.length; i++) {
      docPropSet_(MEMBERSHIP_FUNDING_MEMBER_CHUNK_PREFIX + i, JSON.stringify(memberChunks[i]));
    }
    for (let i = 0; i < dataChunks.length; i++) {
      docPropSet_(MEMBERSHIP_FUNDING_DATA_CHUNK_PREFIX + i, JSON.stringify(dataChunks[i]));
    }
    // Write manifest last (reader only trusts data if manifest exists)
    const manifest = { stamp, memberChunks: memberChunks.length, dataChunks: dataChunks.length };
    docPropSet_(MEMBERSHIP_FUNDING_MANIFEST_KEY, JSON.stringify(manifest));
    docPropDel_("CMS_MEMBERSHIP_FUNDING_DELTA");
    return true;
  } catch (err) {
    return false;
  }
}

function membershipFundingDelta_() {
  try {
    const raw = docProp_("CMS_MEMBERSHIP_FUNDING_DELTA");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function appendMembershipFundingDelta_(memberId, year, amount, months) {
  try {
    let mask = 0;
    MONTHS.forEach((month, i) => {
      if (months[month]) mask += (1 << i);
    });
    const existing = membershipFundingDelta_();
    existing.push([clean_(memberId), Number(year), Math.round(Number(amount || 0) * 100), mask]);
    docPropSet_("CMS_MEMBERSHIP_FUNDING_DELTA", JSON.stringify(existing.slice(-1000)));
  } catch (err) {
    // Best-effort; cache will rebuild fully from the sheet on next miss.
  }
}

function clearCachedMembershipFundingIndex_() {
  try {
    const cache = CacheService.getDocumentCache();
    cache.remove(MEMBERSHIP_FUNDING_CACHE_KEY);
    try { cache.remove("membership:funding:v1"); } catch (e) {} // clear legacy v1 key
    docPropDel_("CMS_MEMBERSHIP_FUNDING_DELTA");
    const manifestRaw = docProp_(MEMBERSHIP_FUNDING_MANIFEST_KEY);
    if (manifestRaw) {
      let memberChunks = 0, dataChunks = 0;
      try {
        const manifest = JSON.parse(manifestRaw);
        memberChunks = manifest.memberChunks || 0;
        dataChunks = manifest.dataChunks || 0;
      } catch (e) {}
      docPropDel_(MEMBERSHIP_FUNDING_MANIFEST_KEY);
      for (let i = 0; i < memberChunks; i++) docPropDel_(MEMBERSHIP_FUNDING_MEMBER_CHUNK_PREFIX + i);
      for (let i = 0; i < dataChunks; i++) docPropDel_(MEMBERSHIP_FUNDING_DATA_CHUNK_PREFIX + i);
    }
  } catch (err) {
    // Best-effort cache clearing.
  }
}

function coverageByYearForFundingDelta_(coverageItems) {
  const grouped = coverageByYear_(coverageItems);
  return Object.keys(grouped).map(Number).sort((a, b) => a - b).map(year => {
    const monthsSet = {};
    grouped[year].forEach(month => monthsSet[month] = true);
    const amount = Number(expectedAmountForItems_(grouped[year].map(month => ({ year, month }))).toFixed(2));
    return { year, amount, monthsSet };
  });
}

function fundedAmountForYear_(memberId, year, fundingIndex) {
  const index = fundingIndex || membershipFundingIndex_();
  return Number((index.amountByMemberYear || {})[clean_(memberId) + "|" + Number(year)] || 0);
}

function remainingDueForYear_(member, year, fundingIndex) {
  const dueMonths = dueMonthsForMemberYear_(member, year);
  const yearlyFee = Number(expectedAmountForItems_(dueMonths.map(month => ({ year, month }))).toFixed(2));
  const funded = fundedAmountForYear_(member.id, year, fundingIndex);
  return {
    year,
    dueMonths,
    yearlyFee,
    fundedAmount: funded,
    amountDue: Math.max(0, Number((yearlyFee - funded).toFixed(2)))
  };
}

function remainingDueForCoverage_(member, items, fundingIndex) {
  const grouped = coverageByYear_(items);
  return Number(Object.keys(grouped).map(Number).reduce((sum, year) => {
    return sum + remainingDueForYear_(member, year, fundingIndex).amountDue;
  }, 0).toFixed(2));
}

function membershipPaymentsForMember_(memberId) {
  return dataRows_(SHEETS.payments).filter(row => clean_(row[2]) === clean_(memberId) && clean_(row[7]) === "Membership");
}

