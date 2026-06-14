export {};

const PUBLIC_SHARE_PACKET_KEY_V41 = "datacenter-ledger.public-share-packet.v4.1";
const PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42 = "datacenter-ledger.public-share-redaction-audit.v4.2";
const REDACTION_AUDIT_APP_VERSION = "4.2.0" as const;
const REDACTION_AUDIT_SCHEMA = "DataCenterLedger.PublicShareRedactionAudit.v4.2" as const;

const REDACTION_AUDIT_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Redaction audit checks public share packets before sharing.",
  "Audit findings are review prompts, not proof of source truth or facility status."
];

const REQUIRED_OMITTED_FIELDS = [
  "reviewerNotes",
  "approvedBy",
  "approvedAt",
  "sourceRowDigest",
  "sourceBatchDigest",
  "sourceBridgeDigest",
  "sourceIntakeDigest",
  "decisionReceiptDigest",
  "latitude",
  "longitude",
  "coordinateBasis",
  "publicAddress"
];

const INTERNAL_FIELD_PATTERNS = [
  "reviewer",
  "reviewerNotes",
  "approvedBy",
  "approvedAt",
  "sourceRowDigest",
  "sourceBatchDigest",
  "sourceBridgeDigest",
  "sourceIntakeDigest",
  "decisionReceiptDigest",
  "staging",
  "bridgeDigest",
  "intakeDigest",
  "batchDigest",
  "rowDigest",
  "coordinateBasis",
  "latitude",
  "longitude",
  "lat",
  "lng",
  "lon",
  "publicAddress",
  "addressLine",
  "streetAddress"
];

type AuditSeverity = "blocker" | "warning" | "info";
type AuditStatus = "clear" | "review" | "blocked";

type PublicShareRecord = {
  publicRecordId?: string;
  title?: string;
  operator?: string;
  state?: string;
  locality?: string;
  mapPrecision?: string;
  qaBadge?: string;
  qaWarningCount?: number;
  evidenceClass?: string;
  evidenceUrl?: string;
  locationConfidence?: number | null;
  publicRecordDigest?: string;
  [key: string]: unknown;
};

type PublicSharePacket = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  sourceViewer?: {
    schema?: string;
    viewerDigest?: string;
    generatedAt?: string;
    finalLayerDigest?: string;
    gateStatus?: string;
    qaStatus?: string;
  };
  publicSummary?: {
    publicRecords?: number;
    statesRepresented?: number;
    warningRecords?: number;
  };
  stateClusters?: Array<{ state?: string; count?: number }>;
  publicRecords: PublicShareRecord[];
  omittedFields?: string[];
  safetyBoundary?: string[];
  publicShareNotice?: string;
  shareDigest: string;
  [key: string]: unknown;
};

type RedactionFinding = {
  severity: AuditSeverity;
  code: string;
  message: string;
  recordId?: string;
  fieldPath?: string;
};

type AuditedPublicRecord = {
  publicRecordId: string;
  title: string;
  state: string;
  mapPrecision: string;
  evidenceUrlPresent: boolean;
  confidence: number | null;
  findings: RedactionFinding[];
};

type PublicShareRedactionAudit = {
  schema: typeof REDACTION_AUDIT_SCHEMA;
  generatedAt: string;
  appVersion: typeof REDACTION_AUDIT_APP_VERSION;
  sourceSharePacket: {
    schema: string;
    shareDigest: string;
    generatedAt: string;
    viewerDigest: string;
    finalLayerDigest: string;
    gateStatus: string;
    qaStatus: string;
  };
  summary: {
    status: AuditStatus;
    publicRecords: number;
    blockers: number;
    warnings: number;
    infos: number;
    recordsWithFindings: number;
    internalFieldHits: number;
  };
  checkedRecords: AuditedPublicRecord[];
  findings: RedactionFinding[];
  requiredOmittedFields: string[];
  safetyBoundary: string[];
  auditNotice: string;
  auditDigest: string;
};

function escapeAudit(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function auditDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `redaction-audit-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireAuditElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.2 redaction audit control: ${selector}`);
  return element;
}

function parsePublicSharePacket(text: string): PublicSharePacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<PublicSharePacket>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.PublicSharePacket.v4.1") return null;
    if (!Array.isArray(parsed.publicRecords)) return null;
    if (typeof parsed.shareDigest !== "string") return null;
    return parsed as PublicSharePacket;
  } catch {
    return null;
  }
}

function downloadAuditJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectSensitiveFieldHits(value: unknown, path = "packet", findings: RedactionFinding[] = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectSensitiveFieldHits(entry, `${path}[${index}]`, findings));
    return findings;
  }

  if (!isPlainObject(value)) return findings;

  Object.entries(value).forEach(([key, nestedValue]) => {
    const fieldPath = `${path}.${key}`;
    const lowerKey = key.toLowerCase();
    const matched = INTERNAL_FIELD_PATTERNS.find((pattern) => lowerKey === pattern.toLowerCase() || lowerKey.includes(pattern.toLowerCase()));

    if (matched) {
      findings.push({
        severity: "blocker",
        code: "internal_field_present",
        message: `Public share packet still contains a sensitive/internal field key: ${key}`,
        fieldPath
      });
    }

    collectSensitiveFieldHits(nestedValue, fieldPath, findings);
  });

  return findings;
}

function hasCoordinateLikeText(packet: PublicSharePacket) {
  const text = JSON.stringify(packet);
  const decimalCoordinatePair = /[-+]?\d{1,2}\.\d{4,}\s*,\s*[-+]?\d{1,3}\.\d{4,}/;
  return decimalCoordinatePair.test(text);
}

function auditRecord(record: PublicShareRecord): AuditedPublicRecord {
  const recordId = String(record.publicRecordId ?? "missing-public-record-id");
  const title = String(record.title ?? "Untitled public record");
  const state = String(record.state ?? "").toUpperCase();
  const mapPrecision = String(record.mapPrecision ?? "unknown");
  const evidenceUrl = String(record.evidenceUrl ?? "");
  const confidence = typeof record.locationConfidence === "number" ? record.locationConfidence : null;
  const findings: RedactionFinding[] = [];

  if (!record.publicRecordId) {
    findings.push({ severity: "blocker", code: "missing_public_record_id", message: "Public record is missing publicRecordId.", recordId });
  }

  if (!state || state.length !== 2) {
    findings.push({ severity: "blocker", code: "missing_state", message: "Public record is missing a two-letter state code.", recordId });
  }

  if (!evidenceUrl || evidenceUrl === "missing") {
    findings.push({ severity: "blocker", code: "missing_evidence_url", message: "Public record is missing its public evidence URL.", recordId });
  }

  if (!record.evidenceClass) {
    findings.push({ severity: "warning", code: "missing_evidence_class", message: "Public record has no evidence class label.", recordId });
  }

  if (confidence === null || Number.isNaN(confidence)) {
    findings.push({ severity: "warning", code: "missing_confidence", message: "Public record has no numeric location confidence.", recordId });
  } else if (confidence < 50) {
    findings.push({ severity: "warning", code: "low_confidence", message: "Public record has low location confidence and should be reviewed before sharing.", recordId });
  }

  if (mapPrecision === "public_address") {
    findings.push({ severity: "warning", code: "public_address_precision", message: "Public-address precision should be rechecked before public sharing.", recordId });
  }

  if (!record.publicRecordDigest) {
    findings.push({ severity: "warning", code: "missing_public_digest", message: "Public record has no publicRecordDigest.", recordId });
  }

  return {
    publicRecordId: recordId,
    title,
    state,
    mapPrecision,
    evidenceUrlPresent: Boolean(evidenceUrl && evidenceUrl !== "missing"),
    confidence,
    findings
  };
}

function buildRedactionAudit(packet: PublicSharePacket): PublicShareRedactionAudit {
  const generatedAt = new Date().toISOString();
  const packetFindings: RedactionFinding[] = [];

  if (!packet.sourceViewer?.viewerDigest) {
    packetFindings.push({ severity: "blocker", code: "missing_viewer_digest", message: "Public share packet is missing source viewer digest." });
  }

  if (!packet.sourceViewer?.finalLayerDigest) {
    packetFindings.push({ severity: "blocker", code: "missing_final_layer_digest", message: "Public share packet is missing source final-layer digest." });
  }

  if (!packet.publicShareNotice) {
    packetFindings.push({ severity: "warning", code: "missing_public_share_notice", message: "Public share packet is missing its public-share notice." });
  }

  if (!Array.isArray(packet.safetyBoundary) || packet.safetyBoundary.length < 3) {
    packetFindings.push({ severity: "warning", code: "missing_safety_boundary", message: "Public share packet is missing a complete safety boundary." });
  }

  const omittedFields = Array.isArray(packet.omittedFields) ? packet.omittedFields : [];
  REQUIRED_OMITTED_FIELDS.forEach((field) => {
    if (!omittedFields.includes(field)) {
      packetFindings.push({ severity: "warning", code: "omitted_field_not_declared", message: `Expected omitted field not declared: ${field}`, fieldPath: `omittedFields.${field}` });
    }
  });

  if (hasCoordinateLikeText(packet)) {
    packetFindings.push({ severity: "blocker", code: "coordinate_like_text", message: "Packet contains coordinate-like decimal text and must be reviewed before public sharing." });
  }

  const sensitiveFindings = collectSensitiveFieldHits(packet);
  const checkedRecords = packet.publicRecords.map(auditRecord);
  const recordFindings = checkedRecords.flatMap((record) => record.findings);
  const findings = [...packetFindings, ...sensitiveFindings, ...recordFindings];
  const blockers = findings.filter((finding) => finding.severity === "blocker").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const infos = findings.filter((finding) => finding.severity === "info").length;
  const status: AuditStatus = blockers > 0 ? "blocked" : warnings > 0 ? "review" : "clear";

  const auditCore: Omit<PublicShareRedactionAudit, "auditDigest"> = {
    schema: REDACTION_AUDIT_SCHEMA,
    generatedAt,
    appVersion: REDACTION_AUDIT_APP_VERSION,
    sourceSharePacket: {
      schema: packet.schema,
      shareDigest: packet.shareDigest,
      generatedAt: String(packet.generatedAt ?? "unknown"),
      viewerDigest: String(packet.sourceViewer?.viewerDigest ?? "missing"),
      finalLayerDigest: String(packet.sourceViewer?.finalLayerDigest ?? "missing"),
      gateStatus: String(packet.sourceViewer?.gateStatus ?? "unknown"),
      qaStatus: String(packet.sourceViewer?.qaStatus ?? "unknown")
    },
    summary: {
      status,
      publicRecords: packet.publicRecords.length,
      blockers,
      warnings,
      infos,
      recordsWithFindings: checkedRecords.filter((record) => record.findings.length > 0).length,
      internalFieldHits: sensitiveFindings.length
    },
    checkedRecords,
    findings,
    requiredOmittedFields: [...REQUIRED_OMITTED_FIELDS],
    safetyBoundary: [...REDACTION_AUDIT_BOUNDARY],
    auditNotice: "This v4.2 report audits a sanitized public share packet for accidental internal fields, coordinate/address leakage, and evidence/link completeness. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or represent a complete national map."
  };

  return { ...auditCore, auditDigest: auditDigest(auditCore) };
}

function renderAuditReport(container: HTMLElement, report: PublicShareRedactionAudit | null) {
  if (!report) {
    container.innerHTML = `<div class="redaction-audit-empty">No redaction audit report generated yet.</div>`;
    return;
  }

  const findings = report.findings.length > 0
    ? report.findings.map((finding) => `<tr>
        <td><strong>${escapeAudit(finding.severity)}</strong><br/><small>${escapeAudit(finding.code)}</small></td>
        <td>${escapeAudit(finding.recordId ?? "packet")}</td>
        <td>${escapeAudit(finding.fieldPath ?? "—")}</td>
        <td>${escapeAudit(finding.message)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4">No redaction findings. Packet is clear for public-share review.</td></tr>`;

  const checkedRows = report.checkedRecords.length > 0
    ? report.checkedRecords.map((record) => `<tr>
        <td><strong>${escapeAudit(record.publicRecordId)}</strong><br/><small>${escapeAudit(record.title)}</small></td>
        <td>${escapeAudit(record.state)}</td>
        <td>${escapeAudit(record.mapPrecision)}</td>
        <td>${record.evidenceUrlPresent ? "present" : "missing"}</td>
        <td>${record.confidence ?? "n/a"}</td>
        <td>${record.findings.length}</td>
      </tr>`).join("")
    : `<tr><td colspan="6">No public records were checked.</td></tr>`;

  container.innerHTML = `<div class="redaction-audit-badges">
      <span>Status: <strong>${escapeAudit(report.summary.status)}</strong></span>
      <span>Blockers: <strong>${report.summary.blockers}</strong></span>
      <span>Warnings: <strong>${report.summary.warnings}</strong></span>
      <span>Digest: <strong>${escapeAudit(report.auditDigest)}</strong></span>
    </div>
    <table class="redaction-audit-table">
      <thead><tr><th>Severity</th><th>Record</th><th>Field</th><th>Finding</th></tr></thead>
      <tbody>${findings}</tbody>
    </table>
    <table class="redaction-audit-table compact">
      <thead><tr><th>Record</th><th>State</th><th>Precision</th><th>Evidence</th><th>Confidence</th><th>Findings</th></tr></thead>
      <tbody>${checkedRows}</tbody>
    </table>`;
}

function mountPublicShareRedactionAudit() {
  const existing = document.getElementById("public-share-redaction-audit-v42");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.id = "public-share-redaction-audit-v42";
  panel.className = "redaction-audit-panel";
  panel.innerHTML = `
    <div class="redaction-audit-header">
      <p class="eyebrow">v4.2 Public Share Redaction Audit</p>
      <h2>Audit public share packets before sharing</h2>
      <p>Scan the v4.1 public share packet for accidental internal fields, coordinate/address leakage, missing evidence links, and boundary gaps.</p>
    </div>
    <div class="redaction-audit-controls">
      <button type="button" data-action="load-latest">Load latest public share packet</button>
      <label class="redaction-audit-file">Load share JSON<input type="file" accept="application/json,.json" data-role="share-file" /></label>
      <button type="button" data-action="run">Run redaction audit</button>
      <button type="button" data-action="export">Export audit report</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="share-json" spellcheck="false" placeholder="Paste DataCenterLedger.PublicSharePacket.v4.1 JSON here..."></textarea>
    <div class="redaction-audit-summary" data-role="summary"><span>Status: idle</span><span>Blockers: 0</span><span>Warnings: 0</span><span>Digest: none</span></div>
    <div class="redaction-audit-boundary">${REDACTION_AUDIT_BOUNDARY.map((item) => `<span>${escapeAudit(item)}</span>`).join("")}</div>
    <div class="redaction-audit-results" data-role="results"><div class="redaction-audit-empty">No redaction audit report generated yet.</div></div>`;

  const anchor = document.getElementById("final-layer-public-share-v41") ?? document.getElementById("root");
  if (anchor) anchor.insertAdjacentElement("afterend", panel);
  else document.body.appendChild(panel);

  const shareInput = requireAuditElement<HTMLTextAreaElement>(panel, '[data-role="share-json"]');
  const fileInput = requireAuditElement<HTMLInputElement>(panel, '[data-role="share-file"]');
  const summaryNode = requireAuditElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireAuditElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireAuditElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const runButton = requireAuditElement<HTMLButtonElement>(panel, '[data-action="run"]');
  const exportButton = requireAuditElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireAuditElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentReport: PublicShareRedactionAudit | null = null;

  const updateSummary = () => {
    summaryNode.innerHTML = `<span>Status: ${escapeAudit(currentReport?.summary.status ?? "idle")}</span><span>Blockers: ${currentReport?.summary.blockers ?? 0}</span><span>Warnings: ${currentReport?.summary.warnings ?? 0}</span><span>Digest: ${escapeAudit(currentReport?.auditDigest ?? "none")}</span>`;
  };

  const runAudit = () => {
    const packet = parsePublicSharePacket(shareInput.value);
    currentReport = packet ? buildRedactionAudit(packet) : null;
    if (currentReport) localStorage.setItem(PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42, JSON.stringify(currentReport, null, 2));
    renderAuditReport(resultsNode, currentReport);
    updateSummary();
  };

  loadLatestButton.addEventListener("click", () => {
    shareInput.value = localStorage.getItem(PUBLIC_SHARE_PACKET_KEY_V41) ?? "";
    runAudit();
  });

  runButton.addEventListener("click", runAudit);

  exportButton.addEventListener("click", () => {
    if (!currentReport) runAudit();
    if (currentReport) downloadAuditJson(`datacenter-ledger-public-share-redaction-audit-v4.2-${currentReport.auditDigest}.json`, currentReport);
  });

  clearButton.addEventListener("click", () => {
    currentReport = null;
    shareInput.value = "";
    localStorage.removeItem(PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42);
    renderAuditReport(resultsNode, null);
    updateSummary();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      shareInput.value = String(reader.result ?? "");
      runAudit();
    };
    reader.readAsText(file);
  });

  renderAuditReport(resultsNode, null);
  updateSummary();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPublicShareRedactionAudit, { once: true });
} else {
  mountPublicShareRedactionAudit();
}
