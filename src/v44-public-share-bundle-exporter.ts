export {};

const PUBLIC_SHARE_PACKET_KEY_V41 = "datacenter-ledger.public-share-packet.v4.1";
const PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42 = "datacenter-ledger.public-share-redaction-audit.v4.2";
const PUBLIC_SHARE_APPROVAL_KEY_V43 = "datacenter-ledger.public-share-approval.v4.3";
const PUBLIC_SHARE_BUNDLE_KEY_V44 = "datacenter-ledger.public-share-bundle.v4.4";
const PUBLIC_SHARE_BUNDLE_APP_VERSION = "4.4.0" as const;
const PUBLIC_SHARE_BUNDLE_SCHEMA = "DataCenterLedger.PublicShareBundle.v4.4" as const;

const PUBLIC_SHARE_BUNDLE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Bundle records are public-facing summaries, not proof of source truth.",
  "Bundle approval does not certify facility status or create a complete national map."
];

const BUNDLE_OMITTED_FIELDS = [
  "reviewer.note",
  "reviewer.name",
  "source staging digests beyond public release references",
  "coordinates",
  "coordinate basis",
  "public address details",
  "internal review workspace fields"
];

type BundleStatus = "bundle_ready" | "review_bundle" | "blocked" | "missing_inputs";
type AuditStatus = "clear" | "review" | "blocked";

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
    shareDigest?: string;
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
  findings?: Array<{ severity?: string; code?: string; message?: string; recordId?: string; fieldPath?: string }>;
  requiredOmittedFields?: string[];
  safetyBoundary?: string[];
  auditNotice?: string;
  auditDigest: string;
  [key: string]: unknown;
};

type PublicShareApproval = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  gate?: {
    status?: string;
    canExport?: boolean;
    messages?: string[];
  };
  reviewer?: {
    name?: string;
    acceptedReviewWarnings?: boolean;
    note?: string;
  };
  sourceSharePacket?: {
    shareDigest?: string;
    viewerDigest?: string;
    finalLayerDigest?: string;
    gateStatus?: string;
    qaStatus?: string;
  };
  sourceRedactionAudit?: {
    auditDigest?: string;
    status?: AuditStatus;
    blockers?: number;
    warnings?: number;
    infos?: number;
    recordsWithFindings?: number;
    internalFieldHits?: number;
  };
  approvedShare?: {
    publicSummary?: PublicSharePacket["publicSummary"];
    stateClusters?: PublicSharePacket["stateClusters"];
    publicRecords?: PublicShareRecord[];
    omittedFields?: string[];
    safetyBoundary?: string[];
    publicShareNotice?: string;
  };
  approvalNotice?: string;
  safetyBoundary?: string[];
  approvalDigest: string;
  [key: string]: unknown;
};

type PublicShareBundleGate = {
  status: BundleStatus;
  canExport: boolean;
  messages: string[];
};

type PublicShareBundle = {
  schema: typeof PUBLIC_SHARE_BUNDLE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_SHARE_BUNDLE_APP_VERSION;
  gate: PublicShareBundleGate;
  releaseSummary: {
    publicRecords: number;
    statesRepresented: number;
    warningRecords: number;
    auditStatus: string;
    auditWarnings: number;
    auditBlockers: number;
    approvalStatus: string;
  };
  sourceChain: {
    sharePacket: {
      schema: string;
      shareDigest: string;
      generatedAt: string;
      viewerDigest: string;
      finalLayerDigest: string;
      gateStatus: string;
      qaStatus: string;
    };
    redactionAudit: {
      schema: string;
      auditDigest: string;
      generatedAt: string;
      status: string;
      blockers: number;
      warnings: number;
      infos: number;
      recordsWithFindings: number;
      internalFieldHits: number;
    };
    approval: {
      schema: string;
      approvalDigest: string;
      generatedAt: string;
      status: string;
      acceptedReviewWarnings: boolean;
    };
  };
  publicContent: {
    publicSummary: PublicSharePacket["publicSummary"];
    stateClusters: PublicSharePacket["stateClusters"];
    publicRecords: PublicShareRecord[];
    publicShareNotice: string;
  };
  bundleOmittedFields: string[];
  safetyBoundary: string[];
  bundleNotice: string;
  bundleDigest: string;
};

function escapeBundle(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function bundleDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `public-share-bundle-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireBundleElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.4 public share bundle control: ${selector}`);
  return element;
}

function parseSharePacket(text: string): PublicSharePacket | null {
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

function parseShareApproval(text: string): PublicShareApproval | null {
  try {
    const parsed = JSON.parse(text) as Partial<PublicShareApproval>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.PublicShareApproval.v4.3") return null;
    if (typeof parsed.approvalDigest !== "string") return null;
    return parsed as PublicShareApproval;
  } catch {
    return null;
  }
}

function downloadBundleJson(filename: string, payload: unknown) {
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

function uniqueStateCount(records: PublicShareRecord[]) {
  const states = new Set<string>();
  for (const record of records) {
    const state = String(record.state ?? "").trim().toUpperCase();
    if (state) states.add(state);
  }
  return states.size;
}

function warningRecordCount(records: PublicShareRecord[]) {
  return records.filter((record) => String(record.qaBadge ?? "").toLowerCase().includes("warning")).length;
}

function gateBundle(sharePacket: PublicSharePacket | null, audit: PublicShareRedactionAudit | null, approval: PublicShareApproval | null): PublicShareBundleGate {
  const messages: string[] = [];

  if (!sharePacket) messages.push("Missing or invalid v4.1 public share packet.");
  if (!audit) messages.push("Missing or invalid v4.2 redaction audit report.");
  if (!approval) messages.push("Missing or invalid v4.3 public share approval packet.");

  if (!sharePacket || !audit || !approval) {
    return { status: "missing_inputs", canExport: false, messages };
  }

  const auditShareDigest = String(audit.sourceSharePacket?.shareDigest ?? "");
  const approvalShareDigest = String(approval.sourceSharePacket?.shareDigest ?? "");
  const approvalAuditDigest = String(approval.sourceRedactionAudit?.auditDigest ?? "");
  const auditStatus = audit.summary?.status ?? "blocked";
  const blockers = audit.summary?.blockers ?? 0;
  const warnings = audit.summary?.warnings ?? 0;
  const approvalStatus = String(approval.gate?.status ?? "unknown");
  const approvalCanExport = approval.gate?.canExport === true;

  if (auditShareDigest !== sharePacket.shareDigest) {
    messages.push("Redaction audit source share digest does not match the public share packet.");
  }

  if (approvalShareDigest !== sharePacket.shareDigest) {
    messages.push("Approval source share digest does not match the public share packet.");
  }

  if (approvalAuditDigest !== audit.auditDigest) {
    messages.push("Approval source audit digest does not match the redaction audit report.");
  }

  if (blockers > 0 || auditStatus === "blocked") {
    messages.push("Redaction audit has blockers. Public share bundle is blocked.");
  }

  if (!approvalCanExport || approvalStatus !== "approval_ready") {
    messages.push("Public share approval is not export-ready.");
  }

  if (messages.length > 0) {
    return { status: "blocked", canExport: false, messages };
  }

  if (auditStatus === "review" || warnings > 0) {
    return {
      status: "review_bundle",
      canExport: true,
      messages: [`Bundle ready with ${warnings} redaction audit warning(s) accepted by v4.3 approval.`]
    };
  }

  return {
    status: "bundle_ready",
    canExport: true,
    messages: ["Bundle ready. Clear redaction audit and export-ready approval are linked."]
  };
}

function publicRecordsFromApprovalOrShare(sharePacket: PublicSharePacket, approval: PublicShareApproval) {
  const approvedRecords = approval.approvedShare?.publicRecords;
  return Array.isArray(approvedRecords) ? approvedRecords : sharePacket.publicRecords;
}

function buildPublicShareBundle(sharePacket: PublicSharePacket, audit: PublicShareRedactionAudit, approval: PublicShareApproval): PublicShareBundle {
  const generatedAt = new Date().toISOString();
  const publicRecords = publicRecordsFromApprovalOrShare(sharePacket, approval);
  const gate = gateBundle(sharePacket, audit, approval);
  const auditStatus = String(audit.summary?.status ?? "unknown");
  const approvalStatus = String(approval.gate?.status ?? "unknown");

  const bundleCore: Omit<PublicShareBundle, "bundleDigest"> = {
    schema: PUBLIC_SHARE_BUNDLE_SCHEMA,
    generatedAt,
    appVersion: PUBLIC_SHARE_BUNDLE_APP_VERSION,
    gate,
    releaseSummary: {
      publicRecords: publicRecords.length,
      statesRepresented: sharePacket.publicSummary?.statesRepresented ?? uniqueStateCount(publicRecords),
      warningRecords: sharePacket.publicSummary?.warningRecords ?? warningRecordCount(publicRecords),
      auditStatus,
      auditWarnings: audit.summary?.warnings ?? 0,
      auditBlockers: audit.summary?.blockers ?? 0,
      approvalStatus
    },
    sourceChain: {
      sharePacket: {
        schema: sharePacket.schema,
        shareDigest: sharePacket.shareDigest,
        generatedAt: String(sharePacket.generatedAt ?? "unknown"),
        viewerDigest: String(sharePacket.sourceViewer?.viewerDigest ?? "missing"),
        finalLayerDigest: String(sharePacket.sourceViewer?.finalLayerDigest ?? "missing"),
        gateStatus: String(sharePacket.sourceViewer?.gateStatus ?? "unknown"),
        qaStatus: String(sharePacket.sourceViewer?.qaStatus ?? "unknown")
      },
      redactionAudit: {
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
      approval: {
        schema: approval.schema,
        approvalDigest: approval.approvalDigest,
        generatedAt: String(approval.generatedAt ?? "unknown"),
        status: approvalStatus,
        acceptedReviewWarnings: approval.reviewer?.acceptedReviewWarnings === true
      }
    },
    publicContent: {
      publicSummary: sharePacket.publicSummary ?? {
        publicRecords: publicRecords.length,
        statesRepresented: uniqueStateCount(publicRecords),
        warningRecords: warningRecordCount(publicRecords)
      },
      stateClusters: sharePacket.stateClusters ?? [],
      publicRecords,
      publicShareNotice: String(sharePacket.publicShareNotice ?? approval.approvedShare?.publicShareNotice ?? "Public share notice missing from source packet.")
    },
    bundleOmittedFields: [...BUNDLE_OMITTED_FIELDS],
    safetyBoundary: [...PUBLIC_SHARE_BUNDLE_BOUNDARY],
    bundleNotice: "This v4.4 bundle packages the sanitized public share packet, redaction audit summary, and approval receipt into one public-facing release artifact. It omits reviewer notes and internal staging details and remains a public-record review artifact, not source truth or a complete national map."
  };

  return {
    ...bundleCore,
    bundleDigest: bundleDigest(bundleCore)
  };
}

function mountPublicShareBundleExporter() {
  if (document.querySelector("[data-public-share-bundle-exporter]")) return;

  const panel = document.createElement("section");
  panel.className = "public-share-bundle-panel";
  panel.dataset.publicShareBundleExporter = "true";
  panel.innerHTML = `
    <div class="bundle-heading">
      <div>
        <p class="eyebrow">v4.4 Public Share Bundle Exporter</p>
        <h2>Bundle sanitized share, redaction audit, and approval into one public release packet.</h2>
        <p>Load the v4.1 public share packet, v4.2 redaction audit, and v4.3 approval packet, then export a public-safe bundle with linked digests.</p>
      </div>
      <span class="bundle-badge">DataCenterLedger.PublicShareBundle.v4.4</span>
    </div>

    <div class="bundle-controls">
      <button type="button" data-load-latest-bundle-sources>Load latest share + audit + approval</button>
      <label class="file-control">Load share JSON <input type="file" accept="application/json,.json" data-load-bundle-share-file /></label>
      <label class="file-control">Load audit JSON <input type="file" accept="application/json,.json" data-load-bundle-audit-file /></label>
      <label class="file-control">Load approval JSON <input type="file" accept="application/json,.json" data-load-bundle-approval-file /></label>
      <button type="button" data-build-bundle>Build bundle</button>
      <button type="button" data-export-bundle disabled>Export bundle</button>
      <button type="button" data-clear-bundle>Clear</button>
    </div>

    <div class="bundle-input-grid">
      <label>v4.1 public share packet JSON<textarea data-bundle-share-input rows="7" placeholder="Paste DataCenterLedger.PublicSharePacket.v4.1 JSON here"></textarea></label>
      <label>v4.2 redaction audit JSON<textarea data-bundle-audit-input rows="7" placeholder="Paste DataCenterLedger.PublicShareRedactionAudit.v4.2 JSON here"></textarea></label>
      <label>v4.3 approval JSON<textarea data-bundle-approval-input rows="7" placeholder="Paste DataCenterLedger.PublicShareApproval.v4.3 JSON here"></textarea></label>
    </div>

    <div class="bundle-summary" data-bundle-summary>
      <div><strong>Status</strong><span>Waiting</span></div>
      <div><strong>Records</strong><span>0</span></div>
      <div><strong>Audit</strong><span>unknown</span></div>
      <div><strong>Approval</strong><span>unknown</span></div>
    </div>

    <div class="bundle-boundary">
      ${PUBLIC_SHARE_BUNDLE_BOUNDARY.map((line) => `<span>${escapeBundle(line)}</span>`).join("")}
    </div>

    <div class="bundle-omitted">
      <strong>Bundle omits</strong>
      ${BUNDLE_OMITTED_FIELDS.map((line) => `<span>${escapeBundle(line)}</span>`).join("")}
    </div>

    <div class="bundle-messages" data-bundle-messages>Load the three public-share artifacts to begin.</div>

    <div class="bundle-preview" data-bundle-preview></div>
  `;

  document.body.appendChild(panel);

  const shareInput = requireBundleElement<HTMLTextAreaElement>(panel, "[data-bundle-share-input]");
  const auditInput = requireBundleElement<HTMLTextAreaElement>(panel, "[data-bundle-audit-input]");
  const approvalInput = requireBundleElement<HTMLTextAreaElement>(panel, "[data-bundle-approval-input]");
  const exportButton = requireBundleElement<HTMLButtonElement>(panel, "[data-export-bundle]");
  const summary = requireBundleElement<HTMLDivElement>(panel, "[data-bundle-summary]");
  const messages = requireBundleElement<HTMLDivElement>(panel, "[data-bundle-messages]");
  const preview = requireBundleElement<HTMLDivElement>(panel, "[data-bundle-preview]");
  const shareFileInput = requireBundleElement<HTMLInputElement>(panel, "[data-load-bundle-share-file]");
  const auditFileInput = requireBundleElement<HTMLInputElement>(panel, "[data-load-bundle-audit-file]");
  const approvalFileInput = requireBundleElement<HTMLInputElement>(panel, "[data-load-bundle-approval-file]");

  let currentBundle: PublicShareBundle | null = null;

  function renderBundle() {
    const sharePacket = parseSharePacket(shareInput.value);
    const audit = parseRedactionAudit(auditInput.value);
    const approval = parseShareApproval(approvalInput.value);
    const gate = gateBundle(sharePacket, audit, approval);
    const auditStatus = audit?.summary?.status ?? "unknown";
    const approvalStatus = approval?.gate?.status ?? "unknown";
    const records = sharePacket?.publicRecords.length ?? 0;

    summary.innerHTML = `
      <div><strong>Status</strong><span>${escapeBundle(gate.status)}</span></div>
      <div><strong>Records</strong><span>${records}</span></div>
      <div><strong>Audit</strong><span>${escapeBundle(auditStatus)}</span></div>
      <div><strong>Approval</strong><span>${escapeBundle(approvalStatus)}</span></div>
    `;

    messages.innerHTML = gate.messages.map((message) => `<p>${escapeBundle(message)}</p>`).join("");

    if (!sharePacket || !audit || !approval || !gate.canExport) {
      currentBundle = null;
      exportButton.disabled = true;
      localStorage.removeItem(PUBLIC_SHARE_BUNDLE_KEY_V44);
      preview.innerHTML = sharePacket
        ? `<p class="bundle-muted">Loaded ${sharePacket.publicRecords.length} public record(s). Bundle is not export-ready yet.</p>`
        : `<p class="bundle-muted">No valid v4.1 public share packet loaded.</p>`;
      return;
    }

    currentBundle = buildPublicShareBundle(sharePacket, audit, approval);
    localStorage.setItem(PUBLIC_SHARE_BUNDLE_KEY_V44, JSON.stringify(currentBundle, null, 2));
    exportButton.disabled = false;

    const rows = currentBundle.publicContent.publicRecords.slice(0, 20).map((record) => `
      <tr>
        <td>${escapeBundle(record.publicRecordId ?? "missing")}</td>
        <td>${escapeBundle(record.title ?? "Untitled")}</td>
        <td>${escapeBundle(record.state ?? "--")}</td>
        <td>${escapeBundle(record.mapPrecision ?? "unknown")}</td>
        <td>${escapeBundle(record.evidenceUrl ?? "missing")}</td>
      </tr>
    `).join("");

    preview.innerHTML = `
      <div class="bundle-ready-card">
        <strong>Bundle ready</strong>
        <span>${escapeBundle(currentBundle.bundleDigest)}</span>
      </div>
      <div class="bundle-source-chain">
        <span>Share: ${escapeBundle(currentBundle.sourceChain.sharePacket.shareDigest)}</span>
        <span>Audit: ${escapeBundle(currentBundle.sourceChain.redactionAudit.auditDigest)}</span>
        <span>Approval: ${escapeBundle(currentBundle.sourceChain.approval.approvalDigest)}</span>
      </div>
      <table>
        <thead><tr><th>Public ID</th><th>Title</th><th>State</th><th>Precision</th><th>Evidence URL</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">No public records in bundled share packet.</td></tr>`}</tbody>
      </table>
    `;
  }

  function attachFileLoader(input: HTMLInputElement, target: HTMLTextAreaElement) {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        target.value = String(reader.result ?? "");
        renderBundle();
      };
      reader.readAsText(file);
    });
  }

  requireBundleElement<HTMLButtonElement>(panel, "[data-load-latest-bundle-sources]").addEventListener("click", () => {
    shareInput.value = latestStoredJson(PUBLIC_SHARE_PACKET_KEY_V41);
    auditInput.value = latestStoredJson(PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42);
    approvalInput.value = latestStoredJson(PUBLIC_SHARE_APPROVAL_KEY_V43);
    renderBundle();
  });

  requireBundleElement<HTMLButtonElement>(panel, "[data-build-bundle]").addEventListener("click", renderBundle);

  exportButton.addEventListener("click", () => {
    if (!currentBundle) return;
    downloadBundleJson(`public-share-bundle-v4.4-${currentBundle.bundleDigest}.json`, currentBundle);
  });

  requireBundleElement<HTMLButtonElement>(panel, "[data-clear-bundle]").addEventListener("click", () => {
    shareInput.value = "";
    auditInput.value = "";
    approvalInput.value = "";
    currentBundle = null;
    exportButton.disabled = true;
    localStorage.removeItem(PUBLIC_SHARE_BUNDLE_KEY_V44);
    renderBundle();
  });

  attachFileLoader(shareFileInput, shareInput);
  attachFileLoader(auditFileInput, auditInput);
  attachFileLoader(approvalFileInput, approvalInput);

  renderBundle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPublicShareBundleExporter, { once: true });
} else {
  mountPublicShareBundleExporter();
}
