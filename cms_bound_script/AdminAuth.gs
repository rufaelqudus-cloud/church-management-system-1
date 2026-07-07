function resetAdminLogin() {
  const ui = SpreadsheetApp.getUi();
  const user = ui.prompt("Reset Main Admin Login", "Enter main admin username:", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  const pass = ui.prompt("Reset Main Admin Login", "Enter new password:", ui.ButtonSet.OK_CANCEL);
  if (pass.getSelectedButton() !== ui.Button.OK) return;
  setAdminCredentials_(user.getResponseText(), pass.getResponseText());
  ui.alert("Main admin login updated. This username will also be active in the admin-user list.");
}

function addOrUpdateAdminUser() {
  const ui = SpreadsheetApp.getUi();
  ensureAdminCredentials_();
  const user = ui.prompt("Add / Update Admin User", "Enter this admin's personal username, for example tesfay or treasurer:", ui.ButtonSet.OK_CANCEL);
  if (user.getSelectedButton() !== ui.Button.OK) return;
  const username = clean_(user.getResponseText());
  if (!username) {
    ui.alert("Username is required.");
    return;
  }
  const pass = ui.prompt("Add / Update Admin User", "Enter password for " + username + ":", ui.ButtonSet.OK_CANCEL);
  if (pass.getSelectedButton() !== ui.Button.OK) return;
  const password = clean_(pass.getResponseText());
  if (!password) {
    ui.alert("Password is required.");
    return;
  }
  upsertAdminUser_(username, password, "Active");
  logAction_("UPSERT_ADMIN_USER", SHEETS.config, username, username, "", "Admin user active");
  ui.alert("Admin user saved: " + username + "\n\nWhen this person logs in, new members will show '" + username + "' in the Added By column.");
}

function ensureAdminCredentials_() {
  const sh = configSheet_();
  if (!sh.getRange("B1").getValue() || !sh.getRange("B2").getValue()) {
    setAdminCredentials_("admin", "1234");
  }
  ensureAdminUsersTable_();
}

function setAdminCredentials_(username, password) {
  const sh = configSheet_();
  const cleanUser = clean_(username) || "admin";
  const cleanPass = clean_(password) || "1234";
  sh.getRange("A1:B2").setValues([
    ["ADMIN_USER", cleanUser],
    ["ADMIN_HASH", hash_(cleanPass)]
  ]);
  ensureAdminUsersTable_();
  upsertAdminUser_(cleanUser, cleanPass, "Active");
  try {
    sh.hideSheet();
    const protection = sh.protect().setDescription("Protected admin login hash");
    protection.setWarningOnly(true);
  } catch (err) {
    // Protection is best-effort; the sheet is hidden and only the password hash is stored.
  }
}

function ensureAdminUsersTable_() {
  const sh = configSheet_();
  const header = sh.getRange("A10:D10").getValues()[0];
  let changed = false;
  if (header[0] !== "ADMIN_USERNAME" || header[1] !== "ADMIN_HASH" || header[2] !== "STATUS" || header[3] !== "ROLE") {
    sh.getRange("A10:D10").setValues([["ADMIN_USERNAME", "ADMIN_HASH", "STATUS", "ROLE"]]);
    changed = true;
  }
  const lastRow = Math.max(sh.getLastRow(), 11);
  const existing = sh.getRange("A11:A" + lastRow).getValues().flat().map(clean_).filter(Boolean);
  if (!existing.length) {
    const legacyUser = clean_(sh.getRange("B1").getValue()) || "admin";
    const legacyHash = clean_(sh.getRange("B2").getValue()) || hash_("1234");
    sh.getRange("A11:D11").setValues([[legacyUser, legacyHash, "Active", ROLES.superAdmin]]);
    changed = true;
  } else {
    const roles = sh.getRange("D11:D" + lastRow).getValues();
    roles.forEach((row, index) => {
      if (!clean_(row[0]) && clean_(sh.getRange(index + 11, 1).getValue())) {
        sh.getRange(index + 11, 4).setValue(ROLES.superAdmin);
        changed = true;
      }
    });
  }
  if (changed) {
    sh.getRange("A10:D" + Math.max(sh.getLastRow(), 11)).setFontColor("#ffffff").setBackground("#ffffff");
    try {
      sh.hideSheet();
      const protections = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      if (!protections.length) {
        const protection = sh.protect().setDescription("Protected admin configuration");
        protection.setWarningOnly(true);
      }
    } catch (err) {
      // Hidden configuration plus hashed passwords are the primary protection here.
    }
  }
}

function upsertAdminUser_(username, password, status, role) {
  const sh = configSheet_();
  ensureAdminUsersTable_();
  const cleanUser = clean_(username);
  if (!cleanUser) throw new Error("Admin username is required.");
  const hash = password && password.length === 64 && /^[a-f0-9]{64}$/i.test(password)
    ? String(password)
    : hash_(clean_(password));
  const values = sh.getRange("A11:D" + Math.max(sh.getLastRow(), 11)).getValues();
  const rowIndex = values.findIndex(r => clean_(r[0]).toLowerCase() === cleanUser.toLowerCase());
  const rowNumber = rowIndex >= 0 ? rowIndex + 11 : Math.max(sh.getLastRow() + 1, 11);
  const existingRole = rowIndex >= 0 ? clean_(values[rowIndex][3]) : "";
  sh.getRange(rowNumber, 1, 1, 4).setValues([[cleanUser, hash, clean_(status) || "Active", normalizeRole_(role || existingRole || ROLES.superAdmin)]]);
  delete CMS_DATA_CONTEXT_["admin:list"];
  clearCachedAdminUsers_();
}

function getAdminUsers(actor) {
  requireMainAdmin_(actor);
  return listAdminUsers_();
}

function listAdminUsers_() {
  if (CMS_DATA_CONTEXT_["admin:list"]) return CMS_DATA_CONTEXT_["admin:list"];
  const cachedAdmins = cachedAdminUsers_();
  if (cachedAdmins) {
    CMS_DATA_CONTEXT_["admin:list"] = cachedAdmins;
    return cachedAdmins;
  }
  const sh = configSheet_();
  const mainUser = mainAdminUsername_();
  const values = sh.getRange("A11:D" + Math.max(sh.getLastRow(), 11)).getValues();
  const admins = values
    .filter(r => clean_(r[0]))
    .map(r => ({
      username: clean_(r[0]),
      status: clean_(r[2]) || "Active",
      role: normalizeRole_(r[3] || ROLES.superAdmin),
      isMain: clean_(r[0]).toLowerCase() === mainUser
    }));
  putCachedAdminUsers_(admins);
  CMS_DATA_CONTEXT_["admin:list"] = admins;
  return admins;
}

function cachedAdminUsers_() {
  try {
    const raw = docProp_("CMS_ADMIN_USERS_CACHE");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function putCachedAdminUsers_(admins) {
  try {
    docPropSet_("CMS_ADMIN_USERS_CACHE", JSON.stringify(admins || []));
  } catch (err) {
    // Permission cache is best-effort; spreadsheet config remains source of truth.
  }
}

function clearCachedAdminUsers_() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty("CMS_ADMIN_USERS_CACHE");
  } catch (err) {
    // Best-effort cache clearing.
  }
}

function saveAdminUser(form) {
  ensureAdminCredentials_();
  const username = clean_(form && form.username);
  const password = clean_(form && form.password);
  const status = clean_(form && form.status) || "Active";
  const role = normalizeRole_(form && form.role);
  const actor = clean_(form && form.actor) || username;
  requireMainAdmin_(actor);
  if (!username) throw new Error("Admin username is required.");
  if (!password) throw new Error("Password is required when adding or resetting an admin.");
  upsertAdminUser_(username, password, status, role);
  logAction_("SAVE_ADMIN_USER", SHEETS.config, username, actor, "", JSON.stringify({ status, role }));
  return listAdminUsers_();
}

function setAdminUserStatus(username, status, actor) {
  ensureAdminCredentials_();
  const cleanUser = clean_(username);
  const cleanStatus = clean_(status) || "Active";
  requireMainAdmin_(actor);
  if (!cleanUser) throw new Error("Admin username is required.");
  const sh = configSheet_();
  const rowNumber = adminUserRow_(cleanUser);
  if (!rowNumber) throw new Error("Admin user not found.");
  const mainUser = clean_(sh.getRange("B1").getValue()).toLowerCase();
  if (cleanUser.toLowerCase() === mainUser && cleanStatus.toLowerCase() === "inactive") {
    throw new Error("The main admin cannot be disabled here. Reset the main admin login first.");
  }
  if (cleanStatus.toLowerCase() === "inactive" && countActiveAdmins_(cleanUser) < 1) {
    throw new Error("At least one active admin must remain.");
  }
  sh.getRange(rowNumber, 3).setValue(cleanStatus);
  logAction_("SET_ADMIN_STATUS", SHEETS.config, cleanUser, clean_(actor) || "", "", cleanStatus);
  delete CMS_DATA_CONTEXT_["admin:list"];
  clearCachedAdminUsers_();
  return listAdminUsers_();
}

function deleteAdminUser(username, actor) {
  ensureAdminCredentials_();
  const cleanUser = clean_(username);
  requireMainAdmin_(actor);
  if (!cleanUser) throw new Error("Admin username is required.");
  const sh = configSheet_();
  const rowNumber = adminUserRow_(cleanUser);
  if (!rowNumber) throw new Error("Admin user not found.");
  const mainUser = clean_(sh.getRange("B1").getValue()).toLowerCase();
  if (cleanUser.toLowerCase() === mainUser) {
    throw new Error("The main admin cannot be deleted here. Reset the main admin login first.");
  }
  if (countActiveAdmins_(cleanUser) < 1) {
    throw new Error("At least one active admin must remain.");
  }
  sh.deleteRow(rowNumber);
  logAction_("DELETE_ADMIN_USER", SHEETS.config, cleanUser, clean_(actor) || "", "", "Deleted");
  delete CMS_DATA_CONTEXT_["admin:list"];
  clearCachedAdminUsers_();
  return listAdminUsers_();
}

function requireMainAdmin_(actor) {
  if (!isMainAdmin_(actor)) {
    throw new Error("Only the main admin can manage admin users.");
  }
}

function isMainAdmin_(username) {
  const mainUser = mainAdminUsername_();
  return !!mainUser && clean_(username).toLowerCase() === mainUser;
}

function mainAdminUsername_() {
  if (Object.prototype.hasOwnProperty.call(CMS_DATA_CONTEXT_, "admin:main")) return CMS_DATA_CONTEXT_["admin:main"];
  const mainUser = clean_(configSheet_().getRange("B1").getValue()).toLowerCase();
  CMS_DATA_CONTEXT_["admin:main"] = mainUser;
  return mainUser;
}

function adminUserRow_(username) {
  const sh = configSheet_();
  ensureAdminUsersTable_();
  const cleanUser = clean_(username).toLowerCase();
  const values = sh.getRange("A11:A" + Math.max(sh.getLastRow(), 11)).getValues();
  const index = values.findIndex(r => clean_(r[0]).toLowerCase() === cleanUser);
  return index >= 0 ? index + 11 : 0;
}

function countActiveAdmins_(excludeUsername) {
  const exclude = clean_(excludeUsername).toLowerCase();
  return listAdminUsers_().filter(admin =>
    admin.username.toLowerCase() !== exclude &&
    clean_(admin.status).toLowerCase() !== "inactive"
  ).length;
}

function adminUserMatches_(username, password) {
  const sh = configSheet_();
  ensureAdminUsersTable_();
  const cleanUser = clean_(username).toLowerCase();
  const inputHash = hash_(clean_(password));
  if (!cleanUser || !password) return false;
  const values = sh.getRange("A11:C" + Math.max(sh.getLastRow(), 11)).getValues();
  return values.some(r =>
    clean_(r[0]).toLowerCase() === cleanUser &&
    clean_(r[1]) === inputHash &&
    clean_(r[2]).toLowerCase() !== "inactive"
  );
}

function hash_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function login(username, password) {
  const session = loginSession(username, password);
  return !!(session && session.ok);
}

function loginSession(username, password) {
  ensureAdminCredentials_();
  const sh = configSheet_();
  if (adminUserMatches_(username, password)) return adminSession_(username);
  const cleanUser = clean_(username).toLowerCase();
  const admin = listAdminUsers_().find(item => item.username.toLowerCase() === cleanUser);
  if (admin && clean_(admin.status).toLowerCase() === "inactive") return { ok: false };
  const legacyOk = clean_(username) === clean_(sh.getRange("B1").getValue()) &&
    hash_(clean_(password)) === clean_(sh.getRange("B2").getValue());
  return legacyOk ? adminSession_(username) : { ok: false };
}

function adminSession_(username) {
  const cleanUser = clean_(username);
  const found = listAdminUsers_().find(item => item.username.toLowerCase() === cleanUser.toLowerCase());
  const isMain = !!(found && found.isMain);
  const role = isMain ? ROLES.superAdmin : normalizeRole_(found && found.role);
  return {
    ok: true,
    username: cleanUser,
    role,
    permissions: permissionsForRole_(role),
    isMain
  };
}

function normalizeRole_(role) {
  const raw = clean_(role).toLowerCase();
  if (raw === "super admin" || raw === "superadmin") return ROLES.superAdmin;
  if (raw === "treasurer") return ROLES.treasurer;
  if (raw === "admin") return ROLES.admin;
  if (raw === "secretary") return ROLES.secretary;
  if (raw === "editor") return ROLES.editor;
  if (raw === "viewer" || raw === "auditor" || raw === "viewer / auditor") return ROLES.viewer;
  return ROLES.admin;
}

function permissionsForRole_(role) {
  const normalized = normalizeRole_(role);
  return {
    manageSettings: normalized === ROLES.superAdmin,
    manageAdmins: normalized === ROLES.superAdmin,
    manageMembers: normalized === ROLES.superAdmin || normalized === ROLES.admin || normalized === ROLES.secretary || normalized === ROLES.editor,
    managePayments: normalized === ROLES.superAdmin || normalized === ROLES.treasurer || normalized === ROLES.admin,
    manageExpenses: normalized === ROLES.superAdmin || normalized === ROLES.treasurer,
    manageHandover: normalized === ROLES.superAdmin || normalized === ROLES.treasurer,
    manageInventory: normalized === ROLES.superAdmin || normalized === ROLES.treasurer,
    generateReceipts: normalized === ROLES.superAdmin || normalized === ROLES.treasurer || normalized === ROLES.admin,
    viewReports: normalized === ROLES.superAdmin || normalized === ROLES.treasurer || normalized === ROLES.admin || normalized === ROLES.viewer,
    viewAudit: normalized === ROLES.superAdmin || normalized === ROLES.viewer,
    editPayments: normalized === ROLES.superAdmin || normalized === ROLES.treasurer || normalized === ROLES.admin,
    deletePayments: normalized === ROLES.superAdmin,
    readOnly: normalized === ROLES.viewer
  };
}

function roleForUser_(username) {
  const cleanUser = clean_(username).toLowerCase();
  const found = listAdminUsers_().find(item => item.username.toLowerCase() === cleanUser);
  return found && found.isMain ? ROLES.superAdmin : normalizeRole_(found && found.role);
}

function truthy_(value) {
  const raw = clean_(value).toLowerCase();
  return value === true || raw === "true" || raw === "yes" || raw === "1" || raw === "on";
}

function requirePermission_(username, permission) {
  const session = adminSession_(username);
  if (!session.permissions[permission]) throw new Error("Your role does not allow this action.");
  return session;
}

function requireAnyPermission_(username, permissions) {
  const session = adminSession_(username);
  if (!(permissions || []).some(permission => session.permissions[permission])) {
    throw new Error("Your role does not allow this action.");
  }
  return session;
}

