function createStandardChurchPdf_(doc) {
  // HTML->PDF is significantly faster than the DocumentApp path (no temp Google
  // Doc create/save/export/trash round trip) and produces the same visual output
  // via buildStandardChurchPdfHtml_. Set CMS_USE_DOCUMENT_PDF=true in Script
  // Properties to force the DocumentApp renderer if you ever need to compare.
  const forceDocumentRenderer = PropertiesService.getScriptProperties().getProperty("CMS_USE_DOCUMENT_PDF") === "true";
  if (!forceDocumentRenderer) {
    try {
      return createStandardChurchPdfFromHtml_(doc);
    } catch (err) {
      recordSystemError_(err, "createStandardChurchPdfFromHtml_");
    }
  }
  try {
    return createStandardChurchPdfFromDocument_(doc);
  } catch (err) {
    recordSystemError_(err, "createStandardChurchPdfFromDocument_");
    return createStandardChurchPdfFromHtml_(doc);
  }
}

function createStandardChurchPdfFromHtml_(doc) {
  const folder = doc.folder || receiptFolder_();
  const fileName = doc.fileName || safeCsvName_((doc.documentId || "Church Document") + " " + CHURCH_SYSTEM_NAME) + ".pdf";
  const html = buildStandardChurchPdfHtml_(doc);
  const pdfBlob = Utilities.newBlob(html, "text/html", fileName.replace(/\.pdf$/, ".html"))
    .getAs(MimeType.PDF)
    .setName(fileName);
  const pdf = folder.createFile(pdfBlob);
  pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return pdf.getUrl();
}

function createStandardChurchPdfFromDocument_(doc) {
  const folder = doc.folder || receiptFolder_();
  const fileName = doc.fileName || safeCsvName_((doc.documentId || "Church Document") + " " + CHURCH_SYSTEM_NAME) + ".pdf";
  const tempDoc = DocumentApp.create(fileName.replace(/\.pdf$/i, "") + " Source");
  const tempFile = DriveApp.getFileById(tempDoc.getId());
  try {
    const body = tempDoc.getBody();
    body.clear();
    body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);
    appendStandardDocHeader_(body);
    appendStandardDocTitle_(body, doc);
    appendStandardDocInfoBlocks_(body, doc);
    appendStandardDocHighlight_(body, doc);
    (doc.sections || []).forEach(section => appendStandardDocSection_(body, section));
    if (doc.notes || doc.notesTitle) appendStandardDocNotes_(body, doc.notesTitle || "Systemhinweise & Archivnotiz", doc.notes || "");
    appendStandardDocSignatures_(body, doc.signatures || []);
    appendStandardDocFooter_(body);
    tempDoc.saveAndClose();

    const pdfBlob = tempFile.getAs(MimeType.PDF).setName(fileName);
    const pdf = folder.createFile(pdfBlob);
    pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return pdf.getUrl();
  } finally {
    tempFile.setTrashed(true);
  }
}

function appendStandardDocHeader_(body) {
  const logo = body.appendImage(churchLogoBlob_());
  logo.setWidth(78).setHeight(78);
  logo.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, "ቤተ ክርስቲያን ኦርቶዶክስ ተዋሕዶ ኤርትራ ቅዱስ ሚካኤል ቩፐርታል", 14, true, "#1a365d", DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, "Eritreisch-Orthodoxe Tewahedo Kirche St. Michael Wuppertal", 12, true, "#1a365d", DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, "ቤት ጽሕፈት ምሕደራ ሰበካ • ቩፐርታል፥ ጀርመን", 9, false, "#4a5568", DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, "ወግዓዊ ስርዓት ምሕደራ ቤተ ክርስቲያን (Offizielles Kirchenverwaltungssystem)", 9, true, "#2b6cb0", DocumentApp.HorizontalAlignment.CENTER);
  body.appendHorizontalRule();
}

function appendStandardDocTitle_(body, doc) {
  appendDocParagraph_(body, doc.titleDe || doc.title || "OFFIZIELLES KIRCHENDOKUMENT", 13, true, "#2c5282", DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, doc.titleTi || "ወግዓዊ ሰነድ ቤተክርስቲያን", 10, true, "#4a7ab5", DocumentApp.HorizontalAlignment.CENTER);
}

function appendStandardDocInfoBlocks_(body, doc) {
  appendDocSectionTitle_(body, (doc.metaTitle || "Beleginformationen") + " / " + (doc.metaSubtitle || "ሓበሬታ"));
  appendDocKeyValueTable_(body, doc.metaRows || []);
  appendDocSectionTitle_(body, (doc.partyTitle || "Person / Partei") + " / " + (doc.partySubtitle || "ሰብ"));
  appendDocKeyValueTable_(body, doc.partyRows || []);
}

function appendStandardDocHighlight_(body, doc) {
  appendDocSectionTitle_(body, (doc.highlightLabel || "Betrag") + " / " + (doc.highlightSubLabel || "መጠን"));
  const table = body.appendTable([[
    clean_(doc.highlightValue || ""),
    (doc.methodLabel || "Referenz") + "\n" + (doc.methodSubLabel || "መወከሲ") + "\n" + clean_(doc.methodValue || "")
  ]]);
  table.setBorderWidth(1);
  styleDocCell_(table.getCell(0, 0), "#f7fafc", true, "#1a365d", 18);
  styleDocCell_(table.getCell(0, 1), "#ebf8ff", true, "#2b6cb0", 9);
}

function appendStandardDocSection_(body, section) {
  if (!section) return;
  appendDocSectionTitle_(body, clean_(section.title || "") + (section.subtitle ? " / " + clean_(section.subtitle) : ""));
  if (section.type === "keyValue") {
    appendDocKeyValueTable_(body, section.rows || []);
    return;
  }
  if (section.type === "html") {
    appendDocParagraph_(body, stripHtml_(section.html || ""), 9, false, "#2d3748", DocumentApp.HorizontalAlignment.LEFT);
    return;
  }
  appendDocTable_(body, section.headers || [], section.rows || [], section.emptyText || "No records");
}

function appendStandardDocNotes_(body, title, notes) {
  appendDocSectionTitle_(body, title);
  appendDocParagraph_(body, notes, 9, false, "#7b341e", DocumentApp.HorizontalAlignment.LEFT);
}

function appendStandardDocSignatures_(body, signatures) {
  if (!signatures.length) return;
  appendDocSectionTitle_(body, "Signatures / ፊርማ");
  signatures.forEach(label => appendDocParagraph_(body, "\n______________________________\n" + label, 9, false, "#2d3748", DocumentApp.HorizontalAlignment.LEFT));
}

function appendStandardDocFooter_(body) {
  body.appendHorizontalRule();
  appendDocParagraph_(body, "“" + PDF_BIBLE_VERSE_TI + "” " + PDF_BIBLE_REFERENCE_TI, 8, true, "#1a365d", DocumentApp.HorizontalAlignment.CENTER);
  appendDocParagraph_(body, "Danke für Ihre treue Unterstützung und Ihren Beitrag zur Gemeinschaft. • ኣምላኽ ዘውጻእካዮ ይተክኣልካ።", 8, false, "#718096", DocumentApp.HorizontalAlignment.CENTER);
}

function appendDocSectionTitle_(body, text) {
  appendDocParagraph_(body, text, 10, true, "#4a5568", DocumentApp.HorizontalAlignment.LEFT);
}

function appendDocParagraph_(body, text, size, bold, color, alignment) {
  const paragraph = body.appendParagraph(clean_(text));
  paragraph.setAlignment(alignment || DocumentApp.HorizontalAlignment.LEFT);
  const textElement = paragraph.editAsText();
  textElement.setFontFamily("Arial").setFontSize(size || 9).setBold(!!bold).setForegroundColor(color || "#2d3748");
  return paragraph;
}

function appendDocKeyValueTable_(body, rows) {
  const data = (rows && rows.length ? rows : [["", ""]]).map(row => [clean_(row[0] || ""), clean_(row[1] || "") + (row[2] ? "\n" + clean_(row[2]) : "")]);
  const table = body.appendTable(data);
  table.setBorderWidth(0.5);
  for (let r = 0; r < table.getNumRows(); r++) {
    styleDocCell_(table.getCell(r, 0), "#ffffff", true, "#718096", 8);
    styleDocCell_(table.getCell(r, 1), "#ffffff", true, "#2d3748", 9);
  }
}

function appendDocTable_(body, headers, rows, emptyText) {
  const safeHeaders = headers && headers.length ? headers : ["Details"];
  const safeRows = rows && rows.length ? rows : [[emptyText || "No records"]];
  const data = [safeHeaders].concat(safeRows).map(row => safeHeaders.map((_, idx) => clean_(row[idx] == null ? "" : row[idx])));
  const table = body.appendTable(data);
  table.setBorderWidth(0.5);
  for (let r = 0; r < table.getNumRows(); r++) {
    for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
      styleDocCell_(table.getCell(r, c), r === 0 ? "#2c5282" : "#ffffff", true, r === 0 ? "#ffffff" : "#2d3748", r === 0 ? 8 : 8);
    }
  }
}

function styleDocCell_(cell, background, bold, color, size) {
  cell.setBackgroundColor(background || "#ffffff");
  const text = cell.editAsText();
  text.setFontFamily("Arial").setFontSize(size || 8).setBold(!!bold).setForegroundColor(color || "#2d3748");
}

function stripHtml_(html) {
  return clean_(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function buildStandardChurchPdfHtml_(doc) {
  const titleDe = doc.titleDe || doc.title || "OFFIZIELLES KIRCHENDOKUMENT";
  const titleTi = doc.titleTi || "ወግዓዊ ሰነድ ቤተክርስቲያን";
  const metaRows = standardPdfKeyRows_(doc.metaRows || []);
  const partyRows = standardPdfKeyRows_(doc.partyRows || []);
  const sections = (doc.sections || []).map(standardPdfSectionHtml_).join("");
  const signatures = standardPdfSignaturesHtml_(doc.signatures || []);
  return [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>",
    "*,*::before,*::after{box-sizing:border-box}",
    "body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Noto Sans Ethiopic',sans-serif;color:#2d3748;line-height:1.5;font-size:10pt;background:#fff}",
    ".header-table{width:100%;border-collapse:collapse;margin-bottom:20px}.logo-cell{width:75px;vertical-align:middle}.logo-img{width:70px;height:70px;object-fit:contain}.church-info-cell{padding-left:15px;vertical-align:middle}",
    ".church-name{font-family:'Noto Serif Ethiopic',Georgia,'Times New Roman',serif;font-size:15pt;font-weight:bold;color:#1a365d;margin:0 0 5px;letter-spacing:.3px;line-height:1.3}.church-details{font-size:9pt;color:#4a5568;line-height:1.4}",
    ".title-container{border-top:2px solid #e2e8f0;border-bottom:2px solid #e2e8f0;padding:10px 0;margin-bottom:25px;text-align:center}.receipt-title{font-size:13pt;font-weight:800;color:#2c5282;letter-spacing:1.2px;margin:0 0 3px}.receipt-title-sub{font-size:10pt;font-weight:600;color:#4a7ab5;letter-spacing:.5px;margin:0}",
    ".info-row{display:table;width:100%;margin-bottom:25px;table-layout:fixed}.info-col{display:table-cell;width:50%;vertical-align:top}.info-col-left{padding-right:20px}.info-col-right{padding-left:20px;border-left:1px solid #edf2f7}",
    ".section-heading{font-size:8.5pt;font-weight:700;text-transform:uppercase;color:#4a5568;letter-spacing:.6px;margin:0 0 10px;border-bottom:1px solid #cbd5e0;padding-bottom:4px}.section-heading-sub{font-size:7.5pt;font-weight:500;color:#718096;letter-spacing:.3px;font-style:italic}",
    ".data-table{width:100%;border-collapse:collapse}.data-table td{padding:5px 0;font-size:9pt;vertical-align:top}.data-label{color:#718096;width:42%;font-weight:500}.data-value{color:#2d3748;font-weight:600;width:58%;word-break:break-word}.signature-line{display:block;font-family:'Brush Script MT',cursive,Georgia,serif;font-style:italic;font-size:8pt;font-weight:400;color:#a0aec0;margin-top:1px;letter-spacing:.5px}",
    ".financial-highlight-box{background:#f7fafc;border:1px solid #e2e8f0;border-left:4px solid #2b6cb0;border-radius:4px;padding:15px 20px;margin-bottom:25px;display:table;width:100%}.amount-cell{display:table-cell;vertical-align:middle}.amount-label{font-size:8pt;text-transform:uppercase;color:#4a5568;font-weight:700;letter-spacing:.5px;margin-bottom:1px}.amount-label-sub{font-size:7pt;color:#a0aec0;font-style:italic;font-weight:400}.amount-value{font-size:22pt;font-weight:bold;color:#1a365d;font-family:Georgia,'Times New Roman',serif}.payment-method-cell{display:table-cell;vertical-align:middle;text-align:right;font-size:9pt;color:#4a5568}.method-label-de{font-weight:600;color:#4a5568}.method-label-ti{font-size:8pt;color:#718096;font-style:italic;display:block}.method-badge{display:inline-block;background:#ebf8ff;color:#2b6cb0;padding:4px 10px;border-radius:4px;font-weight:700;font-size:8.5pt;margin-top:4px;border:1px solid #bee3f8}",
    ".details-table{width:100%;border-collapse:collapse;margin-bottom:25px}.details-table th{background:#2c5282;color:#fff;font-weight:600;font-size:8.5pt;padding:8px 12px;text-align:left}.details-table th span{display:block;font-size:7pt;font-weight:400;opacity:.8;font-style:italic}.details-table td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5pt}.details-table tr:nth-child(even){background:#fcfdfd}.details-table .num{text-align:right;font-weight:600}",
    ".notes-container{background:#fffaf0;border:1px dashed #fbd38d;border-radius:4px;padding:12px 15px;margin-bottom:28px}.notes-title{font-size:8.5pt;font-weight:700;color:#dd6b20;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px}.notes-content{font-size:9pt;color:#7b341e;margin:0;line-height:1.4}",
    ".signature-section{display:table;width:100%;table-layout:fixed;margin:36px 0 25px}.signature-box{display:table-cell;padding-right:18px}.signature-box div{border-top:1px solid #2d3748;padding-top:7px;font-size:9pt;color:#4a5568}",
    ".footer-section{border-top:1px solid #e2e8f0;padding-top:10px;text-align:center}.bible-verse{font-family:'Noto Serif Ethiopic',Georgia,'Times New Roman',serif;font-size:9pt;font-weight:700;color:#1a365d;margin:0 0 4px;line-height:1.45}.bible-reference{font-family:'Noto Serif Ethiopic',Georgia,serif;font-size:8pt;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.3px;margin:0}.footer-note{font-family:Georgia,'Times New Roman',serif;font-size:8pt;color:#718096;font-style:italic;text-align:center;margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0}",
    "</style></head><body>",
    "<table class=\"header-table\"><tr><td class=\"logo-cell\"><img src=\"" + churchLogoDataUri_() + "\" class=\"logo-img\" alt=\"Church Logo\"></td><td class=\"church-info-cell\"><div class=\"church-name\">ቤተ ክርስቲያን ኦርቶዶክስ ተዋሕዶ ኤርትራ ቅዱስ ሚካኤል ቩፐርታል<br><span style=\"font-size:13pt;font-family:sans-serif;font-weight:bold\">Eritreisch-Orthodoxe Tewahedo Kirche St. Michael Wuppertal</span></div><div class=\"church-details\">ቤት ጽሕፈት ምሕደራ ሰበካ &bull; ቩፐርታል፥ ጀርመን<br><span style=\"color:#2b6cb0;font-weight:600\">ወግዓዊ ስርዓት ምሕደራ ቤተ ክርስቲያን (Offizielles Kirchenverwaltungssystem)</span></div></td></tr></table>",
    "<div class=\"title-container\"><h1 class=\"receipt-title\">" + escapeHtml_(titleDe) + "</h1><p class=\"receipt-title-sub\">" + escapeHtml_(titleTi) + "</p></div>",
    "<div class=\"info-row\"><div class=\"info-col info-col-left\"><h2 class=\"section-heading\">" + escapeHtml_(doc.metaTitle || "Beleginformationen") + " <span class=\"section-heading-sub\">/ " + escapeHtml_(doc.metaSubtitle || "ሓበሬታ") + "</span></h2><table class=\"data-table\">" + metaRows + "</table></div><div class=\"info-col info-col-right\"><h2 class=\"section-heading\">" + escapeHtml_(doc.partyTitle || "Person / Partei") + " <span class=\"section-heading-sub\">/ " + escapeHtml_(doc.partySubtitle || "ሰብ") + "</span></h2><table class=\"data-table\">" + partyRows + "</table></div></div>",
    "<div class=\"financial-highlight-box\"><div class=\"amount-cell\"><div class=\"amount-label\">" + escapeHtml_(doc.highlightLabel || "Betrag") + "</div><div class=\"amount-label-sub\">" + escapeHtml_(doc.highlightSubLabel || "መጠን") + "</div><div class=\"amount-value\">" + escapeHtml_(doc.highlightValue || "") + "</div></div><div class=\"payment-method-cell\"><span class=\"method-label-de\">" + escapeHtml_(doc.methodLabel || "Referenz") + "</span><span class=\"method-label-ti\">" + escapeHtml_(doc.methodSubLabel || "መወከሲ") + "</span><div class=\"method-badge\">" + escapeHtml_(doc.methodValue || "") + "</div></div></div>",
    sections,
    doc.notes || doc.notesTitle ? "<div class=\"notes-container\"><h3 class=\"notes-title\">" + escapeHtml_(doc.notesTitle || "Systemhinweise & Archivnotiz") + "</h3><p class=\"notes-content\">" + escapeHtml_(doc.notes || "") + "</p></div>" : "",
    signatures,
    "<div class=\"footer-section\"><p class=\"bible-verse\">&ldquo;" + escapeHtml_(PDF_BIBLE_VERSE_TI) + "&rdquo; " + escapeHtml_(PDF_BIBLE_REFERENCE_TI) + "</p></div>",
    "<div class=\"footer-note\">Danke für Ihre treue Unterstützung und Ihren Beitrag zur Gemeinschaft. &bull; " + escapeHtml_(tigrinyaPaymentForms_(doc.gender || "").footerBlessing) + "</div>",
    "</body></html>"
  ].join("");
}

function churchLogoSrc_() {
  try {
    return churchLogoDriveUrl_();
  } catch (err) {
    recordSystemError_(err, "churchLogoSrc_");
  }
  return CHURCH_LOGO_URL;
}

function churchLogoDataUri_() {
  const template = HtmlService.createHtmlOutputFromFile("ReceiptTemplate").getContent();
  const match = template.match(/src="(data:image\/(?:png|jpe?g|webp);base64,[^"]+)"/i);
  if (!match || !match[1]) throw new Error("Church logo data URI was not found in ReceiptTemplate.html.");
  return match[1];
}

function churchLogoBlob_() {
  const dataUri = churchLogoDataUri_();
  const parts = dataUri.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!parts) throw new Error("Church logo data URI is not a supported image format.");
  const mimeType = parts[1].toLowerCase() === "image/jpg" ? "image/jpeg" : parts[1].toLowerCase();
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const base64 = normalizeBase64_(parts[2]);
  return Utilities.newBlob(Utilities.base64Decode(base64), mimeType, "St Michael Church Logo." + extension);
}

function churchLogoSignature_() {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalizeBase64_(churchLogoDataUri_()));
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, "").slice(0, 24);
}

function normalizeBase64_(value) {
  let text = clean_(value)
    .replace(/^data:image\/(?:png|jpe?g|webp);base64,/i, "")
    .replace(/&#43;|&#x2b;|&plus;/gi, "+")
    .replace(/&sol;|&#47;|&#x2f;/gi, "/")
    .replace(/&equals;|&#61;|&#x3d;/gi, "=")
    .replace(/&amp;/gi, "&")
    .replace(/\s/g, "");
  text = text.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = text.length % 4;
  if (remainder) text += new Array(5 - remainder).join("=");
  return text;
}

function churchLogoDriveFile_() {
  const props = PropertiesService.getDocumentProperties();
  const signature = churchLogoSignature_();
  const existingId = props.getProperty("CMS_CHURCH_LOGO_FILE_ID");
  const existingSignature = props.getProperty("CMS_CHURCH_LOGO_SIGNATURE");
  if (existingId && existingSignature === signature) {
    try {
      const existing = DriveApp.getFileById(existingId);
      existing.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return existing;
    } catch (err) {
      props.deleteProperty("CMS_CHURCH_LOGO_FILE_ID");
      props.deleteProperty("CMS_CHURCH_LOGO_SIGNATURE");
    }
  }

  const file = receiptFolder_().createFile(churchLogoBlob_());
  file.setName("St Michael Church Logo " + signature + ".png");
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  props.setProperty("CMS_CHURCH_LOGO_FILE_ID", file.getId());
  props.setProperty("CMS_CHURCH_LOGO_SIGNATURE", signature);
  return file;
}

function churchLogoDriveUrl_() {
  const file = churchLogoDriveFile_();
  return "https://drive.google.com/uc?export=view&id=" + encodeURIComponent(file.getId());
}

function standardPdfKeyRows_(rows) {
  return rows.map(row => "<tr><td class=\"data-label\">" + escapeHtml_(row[0]) + "</td><td class=\"data-value\">" + escapeHtml_(row[1]) + (row[2] ? "<span class=\"signature-line\">" + escapeHtml_(row[2]) + "</span>" : "") + "</td></tr>").join("");
}

function standardPdfSectionHtml_(section) {
  if (!section) return "";
  const subtitle = section.subtitle ? " <span class=\"section-heading-sub\">/ " + escapeHtml_(section.subtitle) + "</span>" : "";
  if (section.type === "keyValue") {
    return "<h2 class=\"section-heading\">" + escapeHtml_(section.title || "") + subtitle + "</h2><table class=\"details-table\">" + (section.rows || []).map(row => "<tr><td>" + escapeHtml_(row[0]) + "</td><td class=\"num\">" + escapeHtml_(row[1]) + "</td></tr>").join("") + "</table>";
  }
  if (section.type === "html") {
    return "<h2 class=\"section-heading\">" + escapeHtml_(section.title || "") + subtitle + "</h2>" + (section.html || "");
  }
  const headers = (section.headers || []).map(header => "<th>" + escapeHtml_(header) + "</th>").join("");
  const rows = (section.rows || []).map(row => "<tr>" + row.map((cell, idx) => "<td" + (idx === row.length - 1 ? " class=\"num\"" : "") + ">" + escapeHtml_(cell) + "</td>").join("") + "</tr>").join("");
  const empty = "<tr><td colspan=\"" + Math.max(1, (section.headers || []).length) + "\">" + escapeHtml_(section.emptyText || "No records") + "</td></tr>";
  return "<h2 class=\"section-heading\">" + escapeHtml_(section.title || "") + subtitle + "</h2><table class=\"details-table\"><thead><tr>" + headers + "</tr></thead><tbody>" + (rows || empty) + "</tbody></table>";
}

function standardPdfSignaturesHtml_(signatures) {
  if (!signatures.length) return "";
  return "<div class=\"signature-section\">" + signatures.map(label => "<div class=\"signature-box\"><div>" + escapeHtml_(label) + "</div></div>").join("") + "</div>";
}

function createPaymentReceiptPdf_(receipt) {
  const amountText = Number(receipt.amount || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const dateText = Utilities.formatDate(receipt.paymentDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const generatedText = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const period = receipt.periodLabel || (receipt.monthLabel ? receipt.monthLabel + " " + receipt.year : "");
  const pdfName = safeCsvName_("Receipt " + receipt.receiptId + " " + (receipt.memberName || "Member")) + ".pdf";
  const membershipAmount = Number(receipt.membershipAmount || receipt.amount || 0);
  const extraSavingsAmount = Number(receipt.extraSavingsAmount || 0);
  const savingsUsedAmount = Number(receipt.savingsUsedAmount || 0);
  const hasBreakdown = extraSavingsAmount > 0 || savingsUsedAmount > 0;
  const detailRows = hasBreakdown
    ? [
      ["Total cash received", receipt.reason || "", period, Number(receipt.totalReceived || receipt.amount || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })],
      ["Membership amount applied", "Membership", period, membershipAmount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })]
    ]
    : [[receipt.reason === "Membership" ? "Mitgliedsbeitrag" : "Kirchlicher Beitrag", receipt.reason || "", period, amountText]];
  if (hasBreakdown && savingsUsedAmount > 0) {
    detailRows.push(["Savings used", "Savings / Deposit", period, savingsUsedAmount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })]);
  }
  if (hasBreakdown && extraSavingsAmount > 0) {
    detailRows.push(["Extra saved as Savings / Deposit", "Savings / Deposit", "", extraSavingsAmount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })]);
  }
  if (hasBreakdown) {
    detailRows.push(["Final receipt total", "", "", amountText]);
  }
  var paymentYear = receipt.paymentDate instanceof Date
    ? receipt.paymentDate.getFullYear()
    : (receipt.paymentDate ? new Date(receipt.paymentDate).getFullYear() : new Date().getFullYear());
  return createStandardChurchPdf_({
    folder: receiptFolderForMember_(receipt.memberId || "", paymentYear),
    fileName: pdfName,
    language: receipt.language,
    gender: receipt.gender || "",
    titleDe: "OFFIZIELLE ZAHLUNGSBESTÄTIGUNG",
    titleTi: "ናይ ክፍሊት ወረቐት",
    metaTitle: "Beleginformationen",
    metaSubtitle: "ሓበሬታ ክፍሊት",
    metaRows: [
      ["Transaktions-ID", receipt.receiptId],
      ["Zahlungsdatum", dateText],
      ["Erstellungsdatum", generatedText],
      ["Erfasst von", receipt.recordedBy || "", "Digital Signature"]
    ],
    partyTitle: "Mitglied / Spender",
    partySubtitle: "ኣባል / ወፈያ ዝሃበ",
    partyRows: [
      ["Mitgliedsname", receipt.memberName || "Non-member donor"],
      ["Mitgliedsnummer", receipt.memberId || ""],
      ["Status", receipt.memberId ? "Aktives Mitglied" : "Spender"]
    ],
    highlightLabel: "Erhaltener Gesamtbetrag",
    highlightSubLabel: "ዝተቐበልና ክፍሊት",
    highlightValue: amountText,
    methodLabel: "Zahlungsart",
    methodSubLabel: "ኣገባብ ክፍሊት",
    methodValue: formatPaymentMethodForPdf_(receipt.method || ""),
    sections: [{
      title: "Zahlungsübersicht",
      subtitle: "ዝርዝር ክፍሊት",
      headers: ["Zahlungsart", "Zahlungsgrund", "Abgedeckte Jahre", "Betrag"],
      rows: detailRows,
      emptyText: "Keine Zahlungen"
    }],
    notesTitle: "Systemhinweise & Archivnotiz",
    notes: receipt.notes || ""
  });
}

function formatPaymentMethodForPdf_(method) {
  const value = clean_(method);
  if (value === "Bank Transfer" || value === "bank_transfer") return "Banküberweisung";
  return value || "Bar / ጥረ ገንዘብ";
}

function buildPaymentReceiptHtml_(paymentData) {
  return buildStandardChurchPdfHtml_({
    titleDe: "OFFIZIELLE ZAHLUNGSBESTÄTIGUNG",
    titleTi: "ናይ ክፍሊት ወረቐት",
    metaTitle: "Beleginformationen",
    metaSubtitle: "ሓበሬታ ክፍሊት",
    metaRows: [
      ["Transaktions-ID", paymentData.transactionId],
      ["Zahlungsdatum", paymentData.paymentDate],
      ["Erstellungsdatum", paymentData.generatedDate],
      ["Erfasst von", paymentData.recordedBy, "Digital Signature"]
    ],
    partyTitle: "Mitglied / Spender",
    partySubtitle: "ኣባል / ወፈያ ዝሃበ",
    partyRows: [
      ["Mitgliedsname", paymentData.memberName],
      ["Mitgliedsnummer", paymentData.memberId],
      ["Status", paymentData.memberStatus]
    ],
    highlightLabel: "Erhaltener Gesamtbetrag",
    highlightSubLabel: "ዝተቐበልና ክፍሊት",
    highlightValue: paymentData.amount,
    methodLabel: "Zahlungsart",
    methodSubLabel: "ኣገባብ ክፍሊት",
    methodValue: formatPaymentMethodForPdf_(paymentData.paymentMethod),
    sections: [{
      title: "Zahlungsübersicht",
      subtitle: "ዝርዝር ክፍሊት",
      headers: ["Zahlungsart", "Zahlungsgrund", "Abgedeckte Jahre", "Betrag"],
      rows: [[paymentData.paymentType, paymentData.paymentReason, paymentData.periodCovered, paymentData.amount]],
      emptyText: "Keine Zahlungen"
    }],
    notesTitle: "Systemhinweise & Archivnotiz",
    notes: paymentData.notes || ""
  });
}

function createChurchTransactionReceiptPdf_(transaction) {
  const type = clean_(transaction.transactionType || transaction.type || "Income");
  const category = clean_(transaction.categoryName || transaction.category || "");
  const amount = euro_(transaction.amount);
  const fallbackId = "DOC-" + new Date().getTime();
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Transaction Receipt " + (transaction.transactionId || transaction.id || fallbackId)) + ".pdf",
    titleDe: "OFFIZIELLE TRANSAKTIONSBESTÄTIGUNG",
    titleTi: "ናይ ቤተክርስቲያን ቅብሊት",
    metaTitle: "Transaktionsinformationen",
    metaSubtitle: "ሓበሬታ ትራንዛክሽን",
    metaRows: [
      ["Transaktions-ID", transaction.transactionId || transaction.id || ""],
      ["Datum", displayDate_(transaction.date || new Date())],
      ["Erstellt am", displayDate_(new Date())],
      ["Erfasst von", transaction.recordedBy || ""]
    ],
    partyTitle: "Person / Geber",
    partySubtitle: "ሰብ / ወፈያ ዝሃበ",
    partyRows: [
      ["Name", transaction.donorName || transaction.memberName || transaction.name || "-"],
      ["Mitgliedsnummer", transaction.memberId || ""],
      ["Transaktionsart", type]
    ],
    highlightLabel: "Betrag",
    highlightSubLabel: "መጠን",
    highlightValue: amount,
    methodLabel: "Zahlungsart",
    methodSubLabel: "ኣገባብ ክፍሊት",
    methodValue: formatPaymentMethodForPdf_(transaction.method || transaction.paymentMethod || ""),
    sections: [{
      title: "Transaktionsübersicht",
      subtitle: "ዝርዝር ትራንዛክሽን",
      headers: ["Transaction Type", "Category", "Amount", "Recorded By"],
      rows: [[type, category, amount, transaction.recordedBy || ""]],
      emptyText: "No transaction details"
    }],
    notesTitle: "Notiz",
    notes: transaction.notes || ""
  });
}

function createExpenseReportPdf_(expense) {
  const fallbackId = "DOC-" + new Date().getTime();
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Expense Report " + (expense.transactionId || expense.id || fallbackId)) + ".pdf",
    titleDe: "OFFIZIELLER AUSGABENBERICHT",
    titleTi: "ናይ ወጻኢ ጸብጻብ",
    metaTitle: "Ausgabeninformationen",
    metaSubtitle: "ሓበሬታ ወጻኢ",
    metaRows: [
      ["Transaktions-ID", expense.transactionId || expense.id || ""],
      ["Datum", displayDate_(expense.date || expense.expenseDate || new Date())],
      ["Erstellt am", displayDate_(new Date())],
      ["Erfasst von", expense.recordedBy || expense.paidBy || ""]
    ],
    partyTitle: "Ausgabe",
    partySubtitle: "ወጻኢ",
    partyRows: [
      ["Kategorie", expense.category || expense.categoryName || ""],
      ["Bezahlt von", expense.paidBy || expense.recordedBy || ""],
      ["Aus gesammeltem Bargeld", truthy_(expense.paidFromCollectedCash) ? "Yes" : "No"]
    ],
    highlightLabel: "Ausgabenbetrag",
    highlightSubLabel: "መጠን ወጻኢ",
    highlightValue: euro_(expense.amount),
    methodLabel: "Zahlungsart",
    methodSubLabel: "ኣገባብ ክፍሊት",
    methodValue: formatPaymentMethodForPdf_(expense.method || expense.paymentMethod || ""),
    sections: [{
      title: "Ausgabendetails",
      subtitle: "ዝርዝር ወጻኢ",
      headers: ["Category", "Amount", "Paid By", "Evidence"],
      rows: [[expense.category || expense.categoryName || "", euro_(expense.amount), expense.paidBy || expense.recordedBy || "", expense.evidenceLink || expense.receiptLink || ""]],
      emptyText: "No expense details"
    }],
    notesTitle: "Notiz",
    notes: expense.notes || ""
  });
}

function createMaterialDonationReceiptPdf_(donation) {
  const fallbackId = "DOC-" + new Date().getTime();
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Material Donation " + (donation.transactionId || donation.itemId || fallbackId)) + ".pdf",
    titleDe: "OFFIZIELLE MATERIALSPENDENBESTÄTIGUNG",
    titleTi: "ናይ ንብረት ወፈያ ቅብሊት",
    metaTitle: "Spendeninformationen",
    metaSubtitle: "ሓበሬታ ወፈያ",
    metaRows: [
      ["Transaktions-ID", donation.transactionId || donation.id || ""],
      ["Datum", displayDate_(donation.date || donation.receivedDate || new Date())],
      ["Erstellt am", displayDate_(new Date())],
      ["Erfasst von", donation.recordedBy || ""]
    ],
    partyTitle: "Spender",
    partySubtitle: "ወፈያ ዝሃበ",
    partyRows: [
      ["Name", donation.donorName || "-"],
      ["Kategorie", donation.category || donation.categoryName || ""],
      ["Artikel-ID", donation.itemId || ""]
    ],
    highlightLabel: "Geschätzter Wert",
    highlightSubLabel: "ግምታዊ ዋጋ",
    highlightValue: euro_(donation.estimatedValue || 0),
    methodLabel: "Artikel",
    methodSubLabel: "ንብረት",
    methodValue: donation.itemName || "",
    sections: [{
      title: "Materialspende",
      subtitle: "ዝርዝር ንብረት",
      headers: ["Item Name", "Quantity", "Condition", "Estimated Value"],
      rows: [[donation.itemName || "", donation.quantity || "", donation.condition || donation.status || "", euro_(donation.estimatedValue || 0)]],
      emptyText: "No material details"
    }],
    notesTitle: "Notiz",
    notes: donation.notes || ""
  });
}

function createMaterialSaleReceiptPdf_(sale) {
  const fallbackId = "DOC-" + new Date().getTime();
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Material Sale " + (sale.transactionId || sale.itemId || fallbackId)) + ".pdf",
    titleDe: "OFFIZIELLE MATERIALVERKAUFSBESTÄTIGUNG",
    titleTi: "ናይ ንብረት መሸጣ ቅብሊት",
    metaTitle: "Verkaufsinformationen",
    metaSubtitle: "ሓበሬታ መሸጣ",
    metaRows: [
      ["Transaktions-ID", sale.transactionId || sale.id || ""],
      ["Datum", displayDate_(sale.date || new Date())],
      ["Erstellt am", displayDate_(new Date())],
      ["Erfasst von", sale.recordedBy || ""]
    ],
    partyTitle: "Käufer",
    partySubtitle: "ዓዳጊ",
    partyRows: [
      ["Name", sale.buyerName || sale.memberName || "-"],
      ["Mitgliedsnummer", sale.memberId || ""],
      ["Artikel-ID", sale.itemId || ""]
    ],
    highlightLabel: "Verkaufsbetrag",
    highlightSubLabel: "መጠን መሸጣ",
    highlightValue: euro_(sale.saleAmount || sale.amount || 0),
    methodLabel: "Zahlungsart",
    methodSubLabel: "ኣገባብ ክፍሊት",
    methodValue: formatPaymentMethodForPdf_(sale.method || sale.paymentMethod || ""),
    sections: [{
      title: "Materialverkauf",
      subtitle: "ዝርዝር መሸጣ",
      headers: ["Item Sold", "Quantity", "Sale Amount", "Buyer"],
      rows: [[sale.itemName || "", sale.quantity || "", euro_(sale.saleAmount || sale.amount || 0), sale.buyerName || sale.memberName || ""]],
      emptyText: "No sale details"
    }],
    notesTitle: "Notiz",
    notes: sale.notes || ""
  });
}

function createMonthlyReportPdf_(data) {
  const folder = reportFolder_();
  const reportName = safeCsvName_("Monthly Report " + data.month + " " + data.year + " " + CHURCH_SYSTEM_NAME) + ".pdf";
  const previousNet = data.previous ? data.previous.net : 0;
  const netDelta = data.previous ? data.selected.net - previousNet : data.selected.net;
  const dateText = Utilities.formatDate(data.generatedAt, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const trendRows = (data.breakdown || []).map(r => [r.label, euro_(r.total), euro_(r.expenses), euro_(r.net)]);
  const paymentRows = (data.selectedPayments || []).map(r => [displayDate_(r.date), r.name || "", r.category || r.type || "", euro_(r.amount)]);
  const expenseRows = (data.selectedExpenses || []).map(r => [displayDate_(r.date), r.name || "", r.category || r.type || "", euro_(r.amount)]);
  return createStandardChurchPdf_({
    folder,
    fileName: reportName,
    titleDe: "MONATLICHER FINANZBERICHT",
    titleTi: "ወርሓዊ ጸብጻብ ገንዘብ",
    metaTitle: "Berichtsinformationen",
    metaSubtitle: "ሓበሬታ ጸብጻብ",
    metaRows: [
      ["Berichtsmonat", data.month + " " + data.year],
      ["Erstellt am", dateText],
      ["Erstellt von", data.generatedBy || ""],
      ["Aktive Mitglieder", data.activeMembers]
    ],
    partyTitle: "Bericht",
    partySubtitle: "ጸብጻብ",
    partyRows: [
      ["Zeitraum", data.month + " " + data.year],
      ["Typ", "Monthly Financial Report"],
      ["System", CHURCH_SYSTEM_NAME]
    ],
    highlightLabel: "Net Balance",
    highlightSubLabel: "ጠቕላላ ተረፍ",
    highlightValue: euro_(data.selected.net),
    methodLabel: "Report Month",
    methodSubLabel: "ወርሒ ጸብጻብ",
    methodValue: data.month + " " + data.year,
    sections: [
      { title: "Executive Summary", subtitle: "ጽማቝ", type: "keyValue", rows: [["Active Members", data.activeMembers], ["Income This Month", euro_(data.selected.total)], ["Expenses This Month", euro_(data.selected.expenses)], ["Net Balance", euro_(data.selected.net)], ["Membership Income", euro_(data.selected.membership)], ["Service Income", euro_(data.selected.service)], ["YTD Net Balance", euro_(data.ytd.net)], ["Change vs Previous Month", euro_(netDelta)]] },
      { title: "Monthly Trend", subtitle: "ወርሓዊ ንጽጽር", headers: ["Month", "Income", "Expenses", "Net"], rows: trendRows, emptyText: "No trend data" },
      { title: "Recent Payments This Month", subtitle: "ናይዚ ወርሒ ክፍሊት", headers: ["Date", "Name / Reason", "Type", "Amount"], rows: paymentRows, emptyText: "No payments recorded for this month." },
      { title: "Recent Expenses This Month", subtitle: "ናይዚ ወርሒ ወጻኢ", headers: ["Date", "Name / Reason", "Type", "Amount"], rows: expenseRows, emptyText: "No expenses recorded for this month." }
    ],
    notesTitle: "Notes",
    notes: data.notes || "No notes entered."
  });
}

function reportCard_(label, value, cls, money) {
  const display = money ? euro_(value) : escapeHtml_(value);
  return "<div class=\"card " + cls + "\"><div class=\"label\">" + escapeHtml_(label) + "</div><div class=\"value\">" + display + "</div></div>";
}

function reportChartRow_(row, maxBar) {
  const incomeW = Math.max(0, Math.round((row.total / maxBar) * 100));
  const expenseW = Math.max(0, Math.round((row.expenses / maxBar) * 100));
  const netW = Math.max(0, Math.round((Math.abs(row.net) / maxBar) * 100));
  const netClass = row.net >= 0 ? "net" : "loss";
  return [
    "<div class=\"barrow\"><div>" + escapeHtml_(row.label.slice(0, 3)) + "</div><div>",
    "<div class=\"bars\"><span class=\"income\" style=\"width:" + incomeW + "%\"></span></div>",
    "<div class=\"bars\"><span class=\"expense\" style=\"width:" + expenseW + "%\"></span></div>",
    "<div class=\"bars\"><span class=\"" + netClass + "\" style=\"width:" + netW + "%\"></span></div>",
    "</div><div class=\"num\">" + euro_(row.net) + "</div></div>"
  ].join("");
}

function reportSimpleRows_(rows, emptyText) {
  if (!rows.length) return "<div class=\"note\">" + escapeHtml_(emptyText) + "</div>";
  return "<table><tr><th>Date</th><th>Name / Reason</th><th>Type</th><th class=\"num\">Amount</th></tr>" + rows.map(r =>
    "<tr><td>" + escapeHtml_(Utilities.formatDate(r.date, Session.getScriptTimeZone(), "yyyy-MM-dd")) + "</td><td>" +
    escapeHtml_(r.name || "") + "</td><td>" + escapeHtml_(r.category || r.type || "") + "</td><td class=\"num\">" + euro_(r.amount) + "</td></tr>"
  ).join("") + "</table>";
}

function reportFolder_() {
  const props = PropertiesService.getDocumentProperties();
  const existingId = props.getProperty("CMS_REPORT_FOLDER_ID");
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      props.deleteProperty("CMS_REPORT_FOLDER_ID");
    }
  }
  const parent = backupFolder_();
  const folders = parent.getFoldersByName("Monthly Report PDFs");
  const folder = folders.hasNext() ? folders.next() : parent.createFolder("Monthly Report PDFs");
  props.setProperty("CMS_REPORT_FOLDER_ID", folder.getId());
  return folder;
}

// ─── Demographics helpers ────────────────────────────────────────────────────

function calculateAge_(birthDate) {
  if (!birthDate) return null;
  const bd = coerceDate_(birthDate);
  if (!bd) return null;
  const today = new Date();
  if (bd > today) return null;
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  if (age < 0 || age > 120) return null;
  return age;
}

function ageGroup_(age) {
  if (age === null || age === undefined) return "Unknown";
  if (age < 13)  return "Under 13";
  if (age <= 17) return "13–17";
  if (age <= 25) return "18–25";
  if (age <= 35) return "26–35";
  if (age <= 45) return "36–45";
  if (age <= 60) return "46–60";
  return "Above 60";
}

function genderGreeting_(gender, lang) {
  const g = clean_(gender).toLowerCase();
  const l = normalizeReceiptLanguage_(lang);
  if (g === "male") {
    if (l === "de") return "Lieber Bruder";
    if (l === "ti") return "ክቡር ሓው";
    return "Dear Brother";
  }
  if (g === "female") {
    if (l === "de") return "Liebe Schwester";
    if (l === "ti") return "ክብርቲ ሓፍቲ";
    return "Dear Sister";
  }
  if (l === "de") return "Hallo";
  if (l === "ti") return "ሰላም";
  return "Hello";
}

function genderSalutation_(gender, lang) {
  const g = clean_(gender).toLowerCase();
  const l = normalizeReceiptLanguage_(lang);
  if (g === "male") {
    if (l === "de") return "Br.";
    if (l === "ti") return "ሓው";
    return "Br.";
  }
  if (g === "female") {
    if (l === "de") return "Sr.";
    if (l === "ti") return "ሓፍቲ";
    return "Sr.";
  }
  return "";
}

function tigrinyaPaymentForms_(gender) {
  const g = clean_(gender).toLowerCase();
  if (g === "female") {
    return {
      paymentRegistered: "እቲ ክፍሊትኪ ብዓወት ተመዝጊቡ ኣሎ።",
      amountPaidLabel:   "ዝኸፈልክዮ ገንዘብ",
      closing:           "ቤተ ክርስቲያን ንህያብኪ ብልቢ ተመስግን። እግዚኣብሔር ኣብ ህይወትኪ ብዙሕ በረኸት ይሃብኪ።",
      footerBlessing:    "ኣምላኽ ዘውጻእኪዮ ይተክኣልኪ።"
    };
  }
  if (g === "male") {
    return {
      paymentRegistered: "እቲ ክፍሊትካ ብዓወት ተመዝጊቡ ኣሎ።",
      amountPaidLabel:   "ዝኸፈልካዮ ገንዘብ",
      closing:           "ቤተ ክርስቲያን ንህያብካ ብልቢ ተመስግን። እግዚኣብሔር ኣብ ህይወትካ ብዙሕ በረኸት ይሃብካ።",
      footerBlessing:    "ኣምላኽ ዘውጻእካዮ ይተክኣልካ።"
    };
  }
  // neutral / unknown — plural formal register, not male-defaulting
  return {
    paymentRegistered: "እቲ ክፍሊት ብዓወት ተመዝጊቡ ኣሎ።",
    amountPaidLabel:   "ዝኸፈልኩሞ ገንዘብ",
    closing:           "ቤተ ክርስቲያን ንህያብኩም ብልቢ ተመስግን። እግዚኣብሔር ኣብ ህይወትኩም ብዙሕ በረኸት ይሃብኩም።",
    footerBlessing:    "ኣምላኽ ዘውጻእኩሞ ይተክኣልኩም።"
  };
}

var PAYMENT_TEMPLATE_MALE =
  "ሰላም {MemberName}\n" +
  "\n" +
  "እቲ ክፍሊትካ ብዓወት ተመዝጊቡ ኣሎ።\n" +
  "\n" +
  "👤 ስም ኣባል: {MemberName}\n" +
  "💶 ዝኸፈልካዮ ገንዘብ: {Amount}\n" +
  "📅 ዝተሸፈነ ዓመት/ዓመታት: {CoveredYears}\n" +
  "🧾 ቁጽሪ ረሲት: {ReceiptNumber}\n" +
  "🔗 PDF ረሲት: {ReceiptUrl}\n" +
  "\n" +
  "ቤተ ክርስቲያን ንህያብካ ብልቢ ተመስግን።\n" +
  "እግዚኣብሔር ኣብ ህይወትካ ብዙሕ በረኸት ይሃብካ።\n" +
  "\n" +
  "\"ብጐይታ ዅሉ ሳዕ ተሐጐሱ፡ ደጊመ፤ ተሐጐሱ፡ እብል ኣሎኹ\"\n" +
  "ፊልጲ 4:4\n" +
  "\n" +
  "⛪ ቤተ ክርስቲያን ቅዱስ ሚካኤል ቩፑርታል";

var PAYMENT_TEMPLATE_FEMALE =
  "ሰላም {MemberName}\n" +
  "\n" +
  "እቲ ክፍሊትኪ ብዓወት ተመዝጊቡ ኣሎ።\n" +
  "\n" +
  "👤 ስም ኣባል: {MemberName}\n" +
  "💶 ዝኸፈልክዮ ገንዘብ: {Amount}\n" +
  "📅 ዝተሸፈነ ዓመት/ዓመታት: {CoveredYears}\n" +
  "🧾 ቁጽሪ ረሲት: {ReceiptNumber}\n" +
  "🔗 PDF ረሲት: {ReceiptUrl}\n" +
  "\n" +
  "ቤተ ክርስቲያን ንህያብኪ ብልቢ ተምስጉን።\n" +
  "እግዚኣብሔር ኣብ ህይወትኪ ብዙሕ በረኸት ይሃብኪ።\n" +
  "\n" +
  "\"ብጐይታ ዅሉ ሳዕ ተሐጐሱ፡ ደጊመ፤ ተሐጐሱ፡ እብል ኣሎኹ\"\n" +
  "ፊልጲ 4:4\n" +
  "\n" +
  "⛪ ቤተ ክርስቲያን ቅዱስ ሚካኤል ቩፑርታል";

var PAYMENT_TEMPLATE_NEUTRAL =
  "ሰላም {MemberName}\n" +
  "\n" +
  "እቲ ክፍሊት ብዓወት ተመዝጊቡ ኣሎ።\n" +
  "\n" +
  "👤 ስም ኣባል: {MemberName}\n" +
  "💶 ዝኸፈልኩሞ ገንዘብ: {Amount}\n" +
  "📅 ዝተሸፈነ ዓመት/ዓመታት: {CoveredYears}\n" +
  "🧾 ቁጽሪ ረሲት: {ReceiptNumber}\n" +
  "🔗 PDF ረሲት: {ReceiptUrl}\n" +
  "\n" +
  "ቤተ ክርስቲያን ንህያብኩም ብልቢ ተምስጉን።\n" +
  "እግዚኣብሔር ኣብ ህይወትኩም ብዙሕ በረኸት ይሃብኩም።\n" +
  "\n" +
  "\"ብጐይታ ዅሉ ሳዕ ተሐጐሱ፡ ደጊመ፤ ተሐጐሱ፡ እብል ኣሎኹ\"\n" +
  "ፊልጲ 4:4\n" +
  "\n" +
  "⛪ ቤተ ክርስቲያን ቅዱስ ሚካኤል ቩፑርታል";

function buildWhatsAppPaymentMessage_(gender, name, amountText, periodText, receiptId, receiptUrl) {
  const g = clean_(gender).toLowerCase();
  const tpl = g === "male" ? PAYMENT_TEMPLATE_MALE
            : g === "female" ? PAYMENT_TEMPLATE_FEMALE
            : PAYMENT_TEMPLATE_NEUTRAL;
  const n = clean_(name) || "ኣባል";
  return tpl
    .replace(/\{MemberName\}/g, n)
    .replace(/\{Amount\}/g,      amountText   || "")
    .replace(/\{CoveredYears\}/g, periodText  || "")
    .replace(/\{ReceiptNumber\}/g, receiptId  || "")
    .replace(/\{ReceiptUrl\}/g,   receiptUrl  || "");
}

function filterMembersByGender_(list, gender) {
  const g = clean_(gender).toLowerCase();
  return (list || []).filter(m => clean_(m.gender).toLowerCase() === g);
}

function filterMembersByAgeGroup_(list, ageGroup) {
  return (list || []).filter(m => ageGroup_(calculateAge_(m.birthDate)) === ageGroup);
}

const AGE_GROUP_LABELS = ["Under 13", "13–17", "18–25", "26–35", "36–45", "46–60", "Above 60"];

function buildMemberDemographics_() {
  const rows = currentDataRows_(SHEETS.members).filter(row => clean_(row[0]) && clean_(row[5]).toLowerCase() === "active");
  const total = rows.length;
  let men = 0, women = 0, genderUnknown = 0, ageUnknown = 0;
  const groupCounts = {};
  AGE_GROUP_LABELS.forEach(g => { groupCounts[g] = 0; });
  rows.forEach(row => {
    const gender = clean_(row[8]).toLowerCase();
    if (gender === "male")        men++;
    else if (gender === "female") women++;
    else                          genderUnknown++;
    const age = calculateAge_(row[9]);
    if (age === null) { ageUnknown++; return; }
    groupCounts[ageGroup_(age)] = (groupCounts[ageGroup_(age)] || 0) + 1;
  });
  const knownAge = total - ageUnknown;
  const ageGroups = AGE_GROUP_LABELS.map(label => ({
    label,
    count: groupCounts[label] || 0,
    pct: knownAge > 0 ? Math.round(((groupCounts[label] || 0) / knownAge) * 100) : 0
  }));
  return { totalActive: total, men, women, genderUnknown, ageGroups, ageUnknown };
}

// ─────────────────────────────────────────────────────────────────────────────

function buildWhatsAppMonthlyReportUrl_(phone, data, reportUrl) {
  const digits = clean_(phone).replace(/\D/g, "");
  if (!digits) return "";
  const text = [
    "Monthly financial report",
    CHURCH_SYSTEM_NAME,
    "Period: " + data.month + " " + data.year,
    "Income: " + euro_(data.selected.total),
    "Expenses: " + euro_(data.selected.expenses),
    "Net balance: " + euro_(data.selected.net),
    "PDF report: " + reportUrl,
    "Thank you.",
    "ኣምላኽ ዘውጻእካዮ ይተክኣልካ።"
  ].join("\n");
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
}

function euro_(value) {
  return Number(value || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function receiptRow_(label, value) {
  return "<tr><td>" + escapeHtml_(label) + "</td><td>" + escapeHtml_(value) + "</td></tr>";
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function receiptFolder_() {
  const props = PropertiesService.getDocumentProperties();
  const existingId = props.getProperty("CMS_RECEIPT_FOLDER_ID");
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      props.deleteProperty("CMS_RECEIPT_FOLDER_ID");
    }
  }
  const parent = backupFolder_();
  const folders = parent.getFoldersByName("Receipt PDFs");
  const folder = folders.hasNext() ? folders.next() : parent.createFolder("Receipt PDFs");
  props.setProperty("CMS_RECEIPT_FOLDER_ID", folder.getId());
  return folder;
}

// ─────────────────────────────────────────────────────────────
// Receipt Folder Organization
// ─────────────────────────────────────────────────────────────

// Root "Receipts" folder inside the backup folder. Separate from the legacy
// flat "Receipt PDFs" folder so existing URLs remain valid.
function receiptRootFolder_() {
  const props = PropertiesService.getDocumentProperties();
  const cachedId = props.getProperty("CMS_RECEIPT_ROOT_FOLDER_ID");
  if (cachedId) {
    try { return DriveApp.getFolderById(cachedId); } catch (e) {
      props.deleteProperty("CMS_RECEIPT_ROOT_FOLDER_ID");
    }
  }
  const parent = backupFolder_();
  const iter = parent.getFoldersByName("Receipts");
  const folder = iter.hasNext() ? iter.next() : parent.createFolder("Receipts");
  props.setProperty("CMS_RECEIPT_ROOT_FOLDER_ID", folder.getId());
  return folder;
}

// Returns (creating if needed) the year subfolder for a member:
//   Receipts/<memberId>/<year>/
// Falls back to flat receiptFolder_() if memberId is empty.
function receiptFolderForMember_(memberId, year) {
  const id = clean_(memberId);
  if (!id) return receiptFolder_();
  const yearStr = String(year || new Date().getFullYear());
  try {
    const root = receiptRootFolder_();
    var memberIter = root.getFoldersByName(id);
    var memberFolder = memberIter.hasNext() ? memberIter.next() : root.createFolder(id);
    var yearIter = memberFolder.getFoldersByName(yearStr);
    return yearIter.hasNext() ? yearIter.next() : memberFolder.createFolder(yearStr);
  } catch (err) {
    throw new Error("Cannot create receipt folder for " + id + "/" + yearStr + ": " + (err.message || err));
  }
}

// Verify the Receipts folder hierarchy and return a summary report.
function verifyReceiptStorage(admin) {
  requirePermission_(admin, "viewReports");
  var report = {
    totalMemberFolders: 0,
    totalYearFolders: 0,
    totalReceiptPdfs: 0,
    missingFolders: [],
    duplicateFolders: [],
    memberSummary: [],
    checkedAt: new Date().toISOString()
  };
  var root;
  try {
    root = receiptRootFolder_();
  } catch (err) {
    return { ok: false, error: "Cannot access Receipts root folder: " + (err.message || err), report: report };
  }
  // Walk member folders
  var memberIter = root.getFolders();
  var memberNames = {};
  while (memberIter.hasNext()) {
    var memberFolder = memberIter.next();
    var memberName = memberFolder.getName();
    report.totalMemberFolders += 1;
    // Detect duplicate member folders (same name seen twice is impossible in Drive,
    // but two folders with same name can exist if created by different paths)
    if (memberNames[memberName]) {
      report.duplicateFolders.push({ type: "member", name: memberName });
    }
    memberNames[memberName] = true;
    var yearSummary = { memberId: memberName, yearFolders: [], pdfCount: 0 };
    var yearNames = {};
    var yearIter = memberFolder.getFolders();
    while (yearIter.hasNext()) {
      var yearFolder = yearIter.next();
      var yearName = yearFolder.getName();
      report.totalYearFolders += 1;
      if (yearNames[yearName]) {
        report.duplicateFolders.push({ type: "year", memberId: memberName, name: yearName });
      }
      yearNames[yearName] = true;
      var pdfCount = 0;
      var fileIter = yearFolder.getFiles();
      while (fileIter.hasNext()) {
        fileIter.next();
        pdfCount += 1;
        report.totalReceiptPdfs += 1;
      }
      yearSummary.yearFolders.push({ year: yearName, pdfs: pdfCount });
      yearSummary.pdfCount += pdfCount;
    }
    report.memberSummary.push(yearSummary);
  }
  // Also count files in legacy flat folder for context
  var legacyCount = 0;
  try {
    var legacyFolder = receiptFolder_();
    var legacyIter = legacyFolder.getFiles();
    while (legacyIter.hasNext()) { legacyIter.next(); legacyCount += 1; }
  } catch (e) {}
  report.legacyFlatReceiptCount = legacyCount;
  report.rootFolderUrl = root.getUrl();
  logAction_("VERIFY_RECEIPT_STORAGE", "Drive", "", admin, "", JSON.stringify({ memberFolders: report.totalMemberFolders, yearFolders: report.totalYearFolders, pdfs: report.totalReceiptPdfs }));
  return { ok: true, report: report };
}

function normalizeReceiptLanguage_(language) {
  const lang = clean_(language).toLowerCase();
  return ["en", "de", "ti"].indexOf(lang) >= 0 ? lang : "ti";
}

function buildWhatsAppReceiptUrl_(phone, memberName, amount, reason, monthLabel, year, receiptUrl, receiptId, language) {
  return buildWhatsAppReceipt_(phone, memberName, amount, reason, monthLabel, year, receiptUrl, receiptId, language).webUrl;
}

function buildWhatsAppReceipt_(phone, memberName, amount, reason, monthLabel, year, receiptUrl, receiptId, language, gender) {
  const digits = clean_(phone).replace(/\D/g, "");
  const lang = normalizeReceiptLanguage_(language);
  const amountNumber = Number(amount || 0);
  const amountText = "€" + amountNumber.toLocaleString("de-DE", {
    minimumFractionDigits: amountNumber % 1 ? 2 : 0,
    maximumFractionDigits: 2
  });
  const periodText = clean_(monthLabel) || clean_(year) || "";
  // WhatsApp messages are always in Tigrinya regardless of language param.
  const text = buildWhatsAppPaymentMessage_(gender || "", memberName, amountText, periodText, receiptId, receiptUrl);
  const encoded = encodeURIComponent(text);
  return {
    message: text,
    appUrl: digits ? "whatsapp://send?phone=" + digits + "&text=" + encoded : "",
    webUrl: digits ? "https://wa.me/" + digits + "?text=" + encoded : ""
  };
}

