export {};

const PUBLIC_SHARE_PACKET_KEY_V41 = "datacenter-ledger.public-share-packet.v4.1";
const PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42 = "datacenter-ledger.public-share-redaction-audit.v4.2";
const PUBLIC_SHARE_APPROVAL_KEY_V43 = "datacenter-ledger.public-share-approval.v4.3";
const PUBLIC_SHARE_APPROVAL_APP_VERSION = "4.3.0" as const;
const PUBLIC_SHARE_APPROVAL_SCHEMA = "DataCenterLedger.PublicShareApproval.v4.3" as const;

const PUBLIC_SHARE_APPROVAL_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Approval confirms a sanitized public share packet passed the local redaction gate.",
  "Approval does not prove source truth, certify facility status, or create a complete national map."
];

type AuditStatus = "clear" | "review" | "blocked";
type ApprovalStatus = "approval_ready" | "review_acceptance_required" | "blocked" | "missing_inputs";

type PublicShareRecord = {
  publicRecordId?: string;
  title?: string;
  operator?: string;
  state?: string;
  locality?: string;
  mapPrecision?: string;
  qaBadge?: string;
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
    viewerDigest?: string;
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

type PublicShareRedactionAudit = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  sourceSharePacket?: {
    schema?: string;
    shareDigest?: string;
    generatedAt?: string;
    viewerDigest?: string;
    finalLayerDigest?: string;
    gateStatus?: string;
    qaStatus?: string;
  };
  summary?: {
    status?: AuditStatus;
    publicRecords?: number;
    blockers?: number;
    warnings?: number;
    infos?: number;
    recordsWithFindings?: number;
    internalFieldHits?: number;
  };
  checkedRecords?: unknown[];
  findings?: Array<{ severity?: string; code?: string; message?: string; recordId?: string; fieldPath?: string }>;
  requiredOmittedFields?: string[];
  safetyBoundary?: string[];
  auditNotice?: string;
  auditDigest: string;
  [key: string]: unknown;
};

type PublicShareApprovalGate = {
  status: ApprovalStatus;
  canExport: boolean;
  messages: string[];
};

type PublicShareApproval = {
  schema: typeof PUBLIC_SHARE_APPROVAL_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_SHARE_APPROVAL_APP_VERSION;
  gate: PublicShareApprovalGate;
  reviewer: {
    name: string;
    acceptedReviewWarnings: boolean;
    note: string;
  };
  sourceSharePacket: {
    schema: string;
    shareDigest: string;
    generatedAt: string;
    viewerDigest: string;
    finalLayerDigest: string;
    gateStatus: string;
    qaStatus: string;
  };
  sourceRedactionAudit: {
    schema: string;
    auditDigest: string;
    generatedAt: string;
    status: AuditStatus;
    blockers: number;
    warnings: number;
    infos: number;
    recordsWithFindings: number;
    internalFieldHits: number;
  };
  approvedShare: {
    publicSummary: PublicSharePacket["publicSummary"];
    stateClusters: PublicSharePacket["stateClusters"];
    publicRecords: PublicShareRecord[];
    omittedFields: string[];
    safetyBoundary: string[];
    publicShareNotice: string;
  };
  approvalNotice: string;
  safetyBoundary: string[];
  approvalDigest: string;
};

function escapeApproval(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function approvalDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `public-share-approval-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireApprovalElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.3 approval gate control: ${selector}`);
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

function parseRedactionAudit(text: string): PublicShareRedactionAudit | null {
  try {
    const parsed = JSON.parse(text) as Partial<PublicShareRedactionAudit>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.PublicShareRedactionAudit.v4.2") return null;
    if (typeof parsed.auditDigest !== "string") return null;
    return parsed as PublicShareRedactionAudit;
  } catch {
    return null;
  }
}

function downloadApprovalJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function latestStoredJson(key: string) {
  return localStorage.getItem(key) ?? "";
}

function gateApproval(sharePacket: PublicSharePacket | null, audit: PublicShareRedactionAudit | null, reviewerName: string, reviewerNote: string, acceptedReviewWarnings: boolean): PublicShareApprovalGate {
  const messages: string[] = [];

  if (!sharePacket) messages.push("Missing or invalid v4.1 public share packet.");
  if (!audit) messages.push("Missing or invalid v4.2 redaction audit report.");

  if (!sharePacket || !audit) {
    return { status: "missing_inputs", canExport: false, messages };
  }

  const auditShareDigest = String(audit.sourceSharePacket?.shareDigest ?? "");
  if (auditShareDigest !== sharePacket.shareDigest) {
    messages.push("Redaction audit source share digest does not match the loaded public share packet.");
  }

  const auditStatus = audit.summary?.status ?? "blocked";
  const blockers = audit.summary?.blockers ?? 0;
  const warnings = audit.summary?.warnings ?? 0;

  if (blockers > 0 || auditStatus === "blocked") {
    messages.push("Redaction audit has blockers. Public share approval is blocked.");
  }

  if (!reviewerName.trim()) {
    messages.push("Reviewer name is required for public share approval.");
  }

  if (auditStatus === "review") {
    if (!acceptedReviewWarnings) {
      messages.push("Review-state audit requires explicit warning acceptance.");
    }
    if (reviewerNote.trim().length < 20) {
      messages.push("Review-state audit requires a reviewer note of at least 20 characters.");
    }
  }

  if (messages.length > 0) {
    return {
      status: blockers > 0 || auditStatus === "blocked" ? "blocked" : auditStatus === "review" ? "review_acceptance_required" : "missing_inputs",
      canExport: false,
      messages
    };
  }

  return {
    status: "approval_ready",
    canExport: true,
    messages: [auditStatus === "review" ? `Review-state audit accepted with ${warnings} warning(s).` : "Clear redaction audit approved for public sharing."]
  };
}

function buildPublicShareApproval(sharePacket: PublicSharePacket, audit: PublicShareRedactionAudit, reviewerName: string, reviewerNote: string, acceptedReviewWarnings: boolean): PublicShareApproval {
  const generatedAt = new Date().toISOString();
  const gate = gateApproval(sharePacket, audit, reviewerName, reviewerNote, acceptedReviewWarnings);
  const auditStatus = audit.summary?.status ?? "blocked";

  const approvalCore: Omit<PublicShareApproval, "approvalDigest"> = {
    schema: PUBLIC_SHARE_APPROVAL_SCHEMA,
    generatedAt,
    appVersion: PUBLIC_SHARE_APPROVAL_APP_VERSION,
    gate,
    reviewer: {
      name: reviewerName.trim(),
      acceptedReviewWarnings,
      note: reviewerNote.trim()
    },
    sourceSharePacket: {
      schema: sharePacket.schema,
      shareDigest: sharePacket.shareDigest,
      generatedAt: String(sharePacket.generatedAt ?? "unknown"),
      viewerDigest: String(sharePacket.sourceViewer?.viewerDigest ?? "missing"),
      finalLayerDigest: String(sharePacket.sourceViewer?.finalLayerDigest ?? "missing"),
      gateStatus: String(sharePacket.sourceViewer?.gateStatus ?? "unknown"),
      qaStatus: String(sharePacket.sourceViewer?.qaStatus ?? "unknown")
    },
    sourceRedactionAudit: {
      schema: audit.schema,
      auditDigest: audit.auditDigest,
      generatedAt: String(audit.generatedAt ?? "unknown"),
      status: auditStatus,
      blockers: audit.summary?.blockers ?? 0,
      warnings: audit.summary?.warnings ?? 0,
      infos: audit.summary?.infos ?? 0,
      recordsWithFindings: audit.summary?.recordsWithFindings ?? 0,
      internalFieldHits: audit.summary?.internalFieldHits ?? 0
    },
    approvedShare: {
      publicSummary: sharePacket.publicSummary,
      stateClusters: sharePacket.stateClusters ?? [],
      publicRecords: sharePacket.publicRecords,
      omittedFields: sharePacket.omittedFields ?? [],
      safetyBoundary: sharePacket.safetyBoundary ?? [],
      publicShareNotice: String(sharePacket.publicShareNotice ?? "Public share notice missing from source packet.")
    },
    approvalNotice: "This v4.3 approval confirms a sanitized v4.1 public share packet passed the v4.2 local redaction gate. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.",
    safetyBoundary: [...PUBLIC_SHARE_APPROVAL_BOUNDARY]
  };

  return {
    ...approvalCore,
    approvalDigest: approvalDigest(approvalCore)
  };
}

function mountPublicShareApprovalGate() {
  if (document.querySelector("[data-public-share-approval-gate]")) return;

  const panel = document.createElement("section");
  panel.className = "public-share-approval-gate-panel";
  panel.dataset.publicShareApprovalGate = "true";
  panel.innerHTML = `
    <div class="approval-gate-heading">
      <div>
        <p class="eyebrow">v4.3 Public Share Approval Gate</p>
        <h2>Approve a sanitized public share packet only after redaction audit review.</h2>
        <p>Load a v4.1 public share packet and matching v4.2 redaction audit, then approve clear packets or explicitly accept review-state warnings before export.</p>
      </div>
      <span class="approval-gate-badge">DataCenterLedger.PublicShareApproval.v4.3</span>
    </div>

    <div class="approval-gate-controls">
      <button type="button" data-load-latest-share>Load latest share + audit</button>
      <label class="file-control">Load share JSON <input type="file" accept="application/json,.json" data-load-share-file /></label>
      <label class="file-control">Load audit JSON <input type="file" accept="application/json,.json" data-load-audit-file /></label>
      <button type="button" data-build-approval>Build approval packet</button>
      <button type="button" data-export-approval disabled>Export approval</button>
      <button type="button" data-clear-approval>Clear</button>
    </div>

    <div class="approval-gate-reviewer-grid">
      <label>Reviewer name <input type="text" data-approval-reviewer placeholder="Reviewer name" /></label>
      <label>Reviewer note <textarea data-approval-note rows="3" placeholder="Required for review-state audits. Explain why warnings are acceptable for this public share packet."></textarea></label>
      <label class="checkbox-line"><input type="checkbox" data-accept-review-warnings /> I accept review-state warnings for this public share packet.</label>
    </div>

    <div class="approval-gate-input-grid">
      <label>v4.1 public share packet JSON<textarea data-share-input rows="8" placeholder="Paste DataCenterLedger.PublicSharePacket.v4.1 JSON here"></textarea></label>
      <label>v4.2 redaction audit JSON<textarea data-audit-input rows="8" placeholder="Paste DataCenterLedger.PublicShareRedactionAudit.v4.2 JSON here"></textarea></label>
    </div>

    <div class="approval-gate-summary" data-approval-summary>
      <div><strong>Status</strong><span>Waiting</span></div>
      <div><strong>Records</strong><span>0</span></div>
      <div><strong>Audit</strong><span>unknown</span></div>
      <div><strong>Warnings</strong><span>0</span></div>
    </div>

    <div class="approval-gate-boundary">
      ${PUBLIC_SHARE_APPROVAL_BOUNDARY.map((line) => `<span>${escapeApproval(line)}</span>`).join("")}
    </div>

    <div class="approval-gate-messages" data-approval-messages>Load a share packet and matching redaction audit to begin.</div>

    <div class="approval-gate-preview" data-approval-preview></div>
  `;

  document.body.appendChild(panel);

  const shareInput = requireApprovalElement<HTMLTextAreaElement>(panel, "[data-share-input]");
  const auditInput = requireApprovalElement<HTMLTextAreaElement>(panel, "[data-audit-input]");
  const reviewerInput = requireApprovalElement<HTMLInputElement>(panel, "[data-approval-reviewer]");
  const noteInput = requireApprovalElement<HTMLTextAreaElement>(panel, "[data-approval-note]");
  const acceptWarningsInput = requireApprovalElement<HTMLInputElement>(panel, "[data-accept-review-warnings]");
  const exportButton = requireApprovalElement<HTMLButtonElement>(panel, "[data-export-approval]");
  const summary = requireApprovalElement<HTMLDivElement>(panel, "[data-approval-summary]");
  const messages = requireApprovalElement<HTMLDivElement>(panel, "[data-approval-messages]");
  const preview = requireApprovalElement<HTMLDivElement>(panel, "[data-approval-preview]");
  const shareFileInput = requireApprovalElement<HTMLInputElement>(panel, "[data-load-share-file]");
  const auditFileInput = requireApprovalElement<HTMLInputElement>(panel, "[data-load-audit-file]");

  let currentApproval: PublicShareApproval | null = null;

  function renderApproval() {
    const sharePacket = parsePublicSharePacket(shareInput.value);
    const audit = parseRedactionAudit(auditInput.value);
    const gate = gateApproval(sharePacket, audit, reviewerInput.value, noteInput.value, acceptWarningsInput.checked);
    const auditStatus = audit?.summary?.status ?? "unknown";
    const warnings = audit?.summary?.warnings ?? 0;
    const publicRecords = sharePacket?.publicRecords.length ?? 0;

    summary.innerHTML = `
      <div><strong>Status</strong><span>${escapeApproval(gate.status)}</span></div>
      <div><strong>Records</strong><span>${publicRecords}</span></div>
      <div><strong>Audit</strong><span>${escapeApproval(auditStatus)}</span></div>
      <div><strong>Warnings</strong><span>${warnings}</span></div>
    `;

    messages.innerHTML = gate.messages.map((message) => `<p>${escapeApproval(message)}</p>`).join("");

    if (!sharePacket || !audit || !gate.canExport) {
      currentApproval = null;
      exportButton.disabled = true;
      localStorage.removeItem(PUBLIC_SHARE_APPROVAL_KEY_V43);
      preview.innerHTML = sharePacket
        ? `<p class="approval-muted">Loaded ${sharePacket.publicRecords.length} public record(s). Approval is not export-ready yet.</p>`
        : `<p class="approval-muted">No valid v4.1 public share packet loaded.</p>`;
      return;
    }

    currentApproval = buildPublicShareApproval(sharePacket, audit, reviewerInput.value, noteInput.value, acceptWarningsInput.checked);
    localStorage.setItem(PUBLIC_SHARE_APPROVAL_KEY_V43, JSON.stringify(currentApproval, null, 2));
    exportButton.disabled = false;

    const rows = currentApproval.approvedShare.publicRecords.slice(0, 20).map((record) => `
      <tr>
        <td>${escapeApproval(record.publicRecordId ?? "missing")}</td>
        <td>${escapeApproval(record.title ?? "Untitled")}</td>
        <td>${escapeApproval(record.state ?? "--")}</td>
        <td>${escapeApproval(record.mapPrecision ?? "unknown")}</td>
        <td>${escapeApproval(record.evidenceClass ?? "unknown")}</td>
      </tr>
    `).join("");

    preview.innerHTML = `
      <div class="approval-ready-card">
        <strong>Approval ready</strong>
        <span>${escapeApproval(currentApproval.approvalDigest)}</span>
      </div>
      <table>
        <thead><tr><th>Public ID</th><th>Title</th><th>State</th><th>Precision</th><th>Evidence</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">No public records in approved packet.</td></tr>`}</tbody>
      </table>
    `;
  }

  requireApprovalElement<HTMLButtonElement>(panel, "[data-load-latest-share]").addEventListener("click", () => {
    shareInput.value = latestStoredJson(PUBLIC_SHARE_PACKET_KEY_V41);
    auditInput.value = latestStoredJson(PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42);
    renderApproval();
  });

  requireApprovalElement<HTMLButtonElement>(panel, "[data-build-approval]").addEventListener("click", renderApproval);
  reviewerInput.addEventListener("input", renderApproval);
  noteInput.addEventListener("input", renderApproval);
  acceptWarningsInput.addEventListener("change", renderApproval);

  exportButton.addEventListener("click", () => {
    if (!currentApproval) return;
    downloadApprovalJson(`public-share-approval-v4.3-${currentApproval.approvalDigest}.json`, currentApproval);
  });

  requireApprovalElement<HTMLButtonElement>(panel, "[data-clear-approval]").addEventListener("click", () => {
    shareInput.value = "";
    auditInput.value = "";
    reviewerInput.value = "";
    noteInput.value = "";
    acceptWarningsInput.checked = false;
    currentApproval = null;
    exportButton.disabled = true;
    localStorage.removeItem(PUBLIC_SHARE_APPROVAL_KEY_V43);
    renderApproval();
  });

  shareFileInput.addEventListener("change", () => {
    const file = shareFileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      shareInput.value = String(reader.result ?? "");
      renderApproval();
    };
    reader.readAsText(file);
  });

  auditFileInput.addEventListener("change", () => {
    const file = auditFileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      auditInput.value = String(reader.result ?? "");
      renderApproval();
    };
    reader.readAsText(file);
  });

  renderApproval();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPublicShareApprovalGate, { once: true });
} else {
  mountPublicShareApprovalGate();
}
