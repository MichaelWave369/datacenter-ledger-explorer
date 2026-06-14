export {};

const PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45 = "datacenter-ledger.public-share-release-manifest.v4.5";
const PUBLIC_RELEASE_INDEX_KEY_V46 = "datacenter-ledger.public-release-index.v4.6";
const PUBLIC_RELEASE_COMPARE_KEY_V47 = "datacenter-ledger.public-release-compare.v4.7";
const PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48 = "datacenter-ledger.public-release-restore-handoff.v4.8";
const PUBLIC_RELEASE_RESTORE_APP_VERSION = "4.8.0" as const;
const PUBLIC_RELEASE_RESTORE_SCHEMA = "DataCenterLedger.PublicReleaseRestoreHandoff.v4.8" as const;

const RESTORE_HANDOFF_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Restore handoff re-activates a public release manifest from local browser storage; it does not recover missing external data.",
  "Restore handoff is a local review action, not proof of source truth or publication authorization."
];

type ManifestGateStatus = "release_ready" | "review_release" | "blocked" | "missing_bundle" | string;
type RestoreMode = "restore_for_review" | "restore_for_reexport" | "restore_for_comparison_followup";

type PublicShareReleaseManifestV45 = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  release?: {
    title?: string;
    releaseVersion?: string;
    releaseNotes?: string;
    preparedBy?: string;
  };
  gate?: {
    status?: ManifestGateStatus;
    canExport?: boolean;
    messages?: string[];
  };
  sourceBundle?: {
    schema?: string;
    bundleDigest?: string;
    generatedAt?: string;
    bundleStatus?: string;
    publicRecords?: number;
    statesRepresented?: number;
    warningRecords?: number;
  };
  sourceChain?: {
    shareDigest?: string;
    auditDigest?: string;
    approvalDigest?: string;
    viewerDigest?: string;
    finalLayerDigest?: string;
    auditStatus?: string;
    approvalStatus?: string;
    acceptedReviewWarnings?: boolean;
  };
  publicSummary?: {
    publicRecords?: number;
    statesRepresented?: number;
    warningRecords?: number;
    boundaryCount?: number;
    omittedFieldCount?: number;
  };
  releaseFiles?: Array<{
    label?: string;
    schema?: string;
    digest?: string;
    role?: string;
  }>;
  safetyBoundary?: string[];
  releaseNotice?: string;
  manifestDigest: string;
  [key: string]: unknown;
};

type PublicReleaseIndexEntry = {
  entryId: string;
  manifestDigest: string;
  title: string;
  releaseVersion: string;
  generatedAt: string;
  indexedAt: string;
  status: ManifestGateStatus;
  canExport: boolean;
  publicRecords: number;
  statesRepresented: number;
  warningRecords: number;
  bundleDigest: string;
  shareDigest: string;
  auditDigest: string;
  approvalDigest: string;
  notesPreview: string;
  sourceManifest: PublicShareReleaseManifestV45;
  entryDigest: string;
};

type PublicReleaseIndex = {
  schema: string;
  entries?: PublicReleaseIndexEntry[];
  indexDigest?: string;
};

type PublicReleaseCompareReportV47 = {
  schema: string;
  generatedAt?: string;
  baseline?: {
    title?: string;
    releaseVersion?: string;
    manifestDigest?: string;
    generatedAt?: string;
    status?: string;
  };
  candidate?: {
    title?: string;
    releaseVersion?: string;
    manifestDigest?: string;
    generatedAt?: string;
    status?: string;
  };
  summary?: {
    status?: string;
    sameCount?: number;
    changedCount?: number;
    addedCount?: number;
    removedCount?: number;
    reviewCount?: number;
  };
  compareDigest?: string;
};

type PublicReleaseRestoreHandoff = {
  schema: typeof PUBLIC_RELEASE_RESTORE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_RELEASE_RESTORE_APP_VERSION;
  restoreMode: RestoreMode;
  restoredManifest: {
    title: string;
    releaseVersion: string;
    manifestDigest: string;
    generatedAt: string;
    gateStatus: string;
    canExport: boolean;
    publicRecords: number;
    statesRepresented: number;
    warningRecords: number;
    bundleDigest: string;
    shareDigest: string;
    auditDigest: string;
    approvalDigest: string;
  };
  restoreTarget: {
    storageKey: typeof PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45;
    schema: "DataCenterLedger.PublicShareReleaseManifest.v4.5";
    restoredAt: string;
  };
  compareContext: {
    compareDigest: string;
    compareStatus: string;
    baselineManifestDigest: string;
    candidateManifestDigest: string;
    selectedWasCompared: boolean;
  };
  reviewer: {
    name: string;
    note: string;
  };
  safetyBoundary: string[];
  restoreNotice: string;
  handoffDigest: string;
};

function escapeRestoreHandoff(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function restoreHandoffDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireRestoreElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.8 restore handoff control: ${selector}`);
  return element;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function loadReleaseIndexEntries(): PublicReleaseIndexEntry[] {
  const raw = localStorage.getItem(PUBLIC_RELEASE_INDEX_KEY_V46);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PublicReleaseIndex;
    if (parsed.schema !== "DataCenterLedger.PublicReleaseIndex.v4.6" || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter((entry) => entry && typeof entry.manifestDigest === "string" && entry.sourceManifest?.schema === "DataCenterLedger.PublicShareReleaseManifest.v4.5");
  } catch {
    return [];
  }
}

function loadCompareContext(): PublicReleaseCompareReportV47 | null {
  const raw = localStorage.getItem(PUBLIC_RELEASE_COMPARE_KEY_V47);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PublicReleaseCompareReportV47;
    if (parsed.schema !== "DataCenterLedger.PublicReleaseCompare.v4.7") return null;
    return parsed;
  } catch {
    return null;
  }
}

function renderRestoreOptions(entries: PublicReleaseIndexEntry[]) {
  if (entries.length === 0) return '<option value="">No indexed release manifests available</option>';
  return entries
    .map((entry) => `<option value="${escapeRestoreHandoff(entry.manifestDigest)}">${escapeRestoreHandoff(entry.title)} · ${escapeRestoreHandoff(entry.releaseVersion)} · ${escapeRestoreHandoff(entry.manifestDigest)}</option>`)
    .join("");
}

function compareContextForSelection(compareReport: PublicReleaseCompareReportV47 | null, selectedDigest: string) {
  const baselineDigest = safeText(compareReport?.baseline?.manifestDigest);
  const candidateDigest = safeText(compareReport?.candidate?.manifestDigest);
  return {
    compareDigest: safeText(compareReport?.compareDigest),
    compareStatus: safeText(compareReport?.summary?.status),
    baselineManifestDigest: baselineDigest,
    candidateManifestDigest: candidateDigest,
    selectedWasCompared: Boolean(selectedDigest && (selectedDigest === baselineDigest || selectedDigest === candidateDigest))
  };
}

function buildRestoreHandoff(entry: PublicReleaseIndexEntry, mode: RestoreMode, reviewerName: string, reviewerNote: string, compareReport: PublicReleaseCompareReportV47 | null): PublicReleaseRestoreHandoff {
  const manifest = entry.sourceManifest;
  const restoredAt = new Date().toISOString();
  const compareContext = compareContextForSelection(compareReport, entry.manifestDigest);

  const handoffCore: Omit<PublicReleaseRestoreHandoff, "handoffDigest"> = {
    schema: PUBLIC_RELEASE_RESTORE_SCHEMA,
    generatedAt: restoredAt,
    appVersion: PUBLIC_RELEASE_RESTORE_APP_VERSION,
    restoreMode: mode,
    restoredManifest: {
      title: entry.title || safeText(manifest.release?.title) || "Untitled public release",
      releaseVersion: entry.releaseVersion || safeText(manifest.release?.releaseVersion) || "unknown",
      manifestDigest: entry.manifestDigest,
      generatedAt: entry.generatedAt || safeText(manifest.generatedAt),
      gateStatus: safeText(manifest.gate?.status || entry.status),
      canExport: manifest.gate?.canExport === true,
      publicRecords: safeNumber(manifest.publicSummary?.publicRecords ?? manifest.sourceBundle?.publicRecords ?? entry.publicRecords),
      statesRepresented: safeNumber(manifest.publicSummary?.statesRepresented ?? manifest.sourceBundle?.statesRepresented ?? entry.statesRepresented),
      warningRecords: safeNumber(manifest.publicSummary?.warningRecords ?? manifest.sourceBundle?.warningRecords ?? entry.warningRecords),
      bundleDigest: safeText(manifest.sourceBundle?.bundleDigest || entry.bundleDigest),
      shareDigest: safeText(manifest.sourceChain?.shareDigest || entry.shareDigest),
      auditDigest: safeText(manifest.sourceChain?.auditDigest || entry.auditDigest),
      approvalDigest: safeText(manifest.sourceChain?.approvalDigest || entry.approvalDigest)
    },
    restoreTarget: {
      storageKey: PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45,
      schema: "DataCenterLedger.PublicShareReleaseManifest.v4.5",
      restoredAt
    },
    compareContext,
    reviewer: {
      name: reviewerName,
      note: reviewerNote
    },
    safetyBoundary: RESTORE_HANDOFF_BOUNDARY,
    restoreNotice:
      "This handoff restored a public release manifest from the local browser release index into the active v4.5 manifest slot. It does not restore missing external data, certify source truth, discover facilities, or authorize publication."
  };

  return {
    ...handoffCore,
    handoffDigest: restoreHandoffDigest("public-release-restore-handoff", handoffCore)
  };
}

function downloadRestoreHandoffJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderRestoreSummary(handoff: PublicReleaseRestoreHandoff | null) {
  if (!handoff) {
    return `
      <div class="v48-restore-card"><span>Status</span><strong>Not restored</strong></div>
      <div class="v48-restore-card"><span>Manifest</span><strong>—</strong></div>
      <div class="v48-restore-card"><span>Mode</span><strong>—</strong></div>
      <div class="v48-restore-card"><span>Digest</span><strong>—</strong></div>
    `;
  }

  return `
    <div class="v48-restore-card"><span>Status</span><strong>Restored</strong></div>
    <div class="v48-restore-card"><span>Manifest</span><strong>${escapeRestoreHandoff(handoff.restoredManifest.manifestDigest)}</strong></div>
    <div class="v48-restore-card"><span>Mode</span><strong>${escapeRestoreHandoff(handoff.restoreMode)}</strong></div>
    <div class="v48-restore-card"><span>Digest</span><strong>${escapeRestoreHandoff(handoff.handoffDigest)}</strong></div>
  `;
}

function renderCompareContext(compareReport: PublicReleaseCompareReportV47 | null) {
  if (!compareReport) return "No v4.7 compare report detected. Restore can still proceed from the v4.6 index.";
  return `Compare context detected: ${safeText(compareReport.summary?.status) || "unknown"} · ${safeText(compareReport.compareDigest) || "no digest"}`;
}

function mountPublicReleaseRestoreHandoff() {
  if (document.querySelector("[data-v48-public-release-restore]")) return;

  const panel = document.createElement("section");
  panel.className = "v48-public-release-restore";
  panel.dataset.v48PublicReleaseRestore = "true";
  panel.innerHTML = `
    <div class="v48-restore-header">
      <div>
        <p class="v48-restore-kicker">v4.8 Public Release Restore + Handoff</p>
        <h2>Public Release Restore + Handoff</h2>
        <p>Restore an indexed v4.5 public release manifest into the active release-manifest slot for review, re-export, or compare follow-up. The handoff writes a receipt before any further public-share action.</p>
      </div>
      <span class="v48-restore-badge">DataCenterLedger.PublicReleaseRestoreHandoff.v4.8</span>
    </div>

    <div class="v48-restore-boundary" data-v48-boundary></div>

    <div class="v48-restore-controls">
      <button type="button" data-v48-refresh>Refresh release index</button>
      <button type="button" data-v48-restore>Restore selected manifest</button>
      <button type="button" data-v48-export disabled>Export handoff receipt</button>
      <button type="button" data-v48-clear>Clear handoff</button>
    </div>

    <div class="v48-restore-grid">
      <label>Indexed release<select data-v48-select></select></label>
      <label>Restore mode<select data-v48-mode>
        <option value="restore_for_review">Restore for review</option>
        <option value="restore_for_reexport">Restore for re-export</option>
        <option value="restore_for_comparison_followup">Restore for comparison follow-up</option>
      </select></label>
      <label>Reviewer / operator name<input data-v48-reviewer type="text" placeholder="Name or role" /></label>
      <label>Restore note<textarea data-v48-note rows="3" placeholder="Why is this release being restored?"></textarea></label>
    </div>

    <div class="v48-restore-summary" data-v48-summary></div>
    <div class="v48-restore-meta" data-v48-meta>Load the local v4.6 index, choose a release, then restore.</div>

    <div class="v48-restore-preview" data-v48-preview></div>
  `;

  document.body.appendChild(panel);

  const boundary = requireRestoreElement<HTMLDivElement>(panel, "[data-v48-boundary]");
  const refreshButton = requireRestoreElement<HTMLButtonElement>(panel, "[data-v48-refresh]");
  const restoreButton = requireRestoreElement<HTMLButtonElement>(panel, "[data-v48-restore]");
  const exportButton = requireRestoreElement<HTMLButtonElement>(panel, "[data-v48-export]");
  const clearButton = requireRestoreElement<HTMLButtonElement>(panel, "[data-v48-clear]");
  const releaseSelect = requireRestoreElement<HTMLSelectElement>(panel, "[data-v48-select]");
  const modeSelect = requireRestoreElement<HTMLSelectElement>(panel, "[data-v48-mode]");
  const reviewerInput = requireRestoreElement<HTMLInputElement>(panel, "[data-v48-reviewer]");
  const noteInput = requireRestoreElement<HTMLTextAreaElement>(panel, "[data-v48-note]");
  const summary = requireRestoreElement<HTMLDivElement>(panel, "[data-v48-summary]");
  const meta = requireRestoreElement<HTMLDivElement>(panel, "[data-v48-meta]");
  const preview = requireRestoreElement<HTMLDivElement>(panel, "[data-v48-preview]");

  let entries: PublicReleaseIndexEntry[] = [];
  let compareReport: PublicReleaseCompareReportV47 | null = null;
  let currentHandoff: PublicReleaseRestoreHandoff | null = null;

  function renderBoundary() {
    boundary.innerHTML = RESTORE_HANDOFF_BOUNDARY.map((line) => `<span>${escapeRestoreHandoff(line)}</span>`).join("");
  }

  function refreshIndex() {
    entries = loadReleaseIndexEntries();
    compareReport = loadCompareContext();
    releaseSelect.innerHTML = renderRestoreOptions(entries);
    meta.textContent = `${entries.length} indexed release${entries.length === 1 ? "" : "s"} loaded. ${renderCompareContext(compareReport)}`;
  }

  function render() {
    summary.innerHTML = renderRestoreSummary(currentHandoff);
    exportButton.disabled = !currentHandoff;
    if (!currentHandoff) {
      preview.innerHTML = '<p>No restore handoff has been created yet.</p>';
      return;
    }

    preview.innerHTML = `
      <h3>Restored release</h3>
      <dl>
        <dt>Title</dt><dd>${escapeRestoreHandoff(currentHandoff.restoredManifest.title)}</dd>
        <dt>Version</dt><dd>${escapeRestoreHandoff(currentHandoff.restoredManifest.releaseVersion)}</dd>
        <dt>Gate</dt><dd>${escapeRestoreHandoff(currentHandoff.restoredManifest.gateStatus)}</dd>
        <dt>Records</dt><dd>${currentHandoff.restoredManifest.publicRecords}</dd>
        <dt>States</dt><dd>${currentHandoff.restoredManifest.statesRepresented}</dd>
        <dt>Warnings</dt><dd>${currentHandoff.restoredManifest.warningRecords}</dd>
        <dt>Bundle digest</dt><dd><code>${escapeRestoreHandoff(currentHandoff.restoredManifest.bundleDigest || "—")}</code></dd>
        <dt>Compare context</dt><dd>${currentHandoff.compareContext.selectedWasCompared ? "Selected release appears in latest compare report." : "No selected-release compare match detected."}</dd>
      </dl>
    `;
  }

  refreshButton.addEventListener("click", () => {
    refreshIndex();
    currentHandoff = null;
    localStorage.removeItem(PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48);
    render();
  });

  restoreButton.addEventListener("click", () => {
    const selected = entries.find((entry) => entry.manifestDigest === releaseSelect.value);
    const reviewerName = reviewerInput.value.trim();
    const reviewerNote = noteInput.value.trim();
    const mode = modeSelect.value as RestoreMode;

    if (!selected) {
      currentHandoff = null;
      meta.textContent = "Choose an indexed public release before restoring.";
      render();
      return;
    }

    if (!reviewerName || !reviewerNote) {
      currentHandoff = null;
      meta.textContent = "Reviewer/operator name and restore note are required before restore.";
      render();
      return;
    }

    localStorage.setItem(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45, JSON.stringify(selected.sourceManifest, null, 2));
    currentHandoff = buildRestoreHandoff(selected, mode, reviewerName, reviewerNote, compareReport);
    localStorage.setItem(PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48, JSON.stringify(currentHandoff, null, 2));
    meta.textContent = `Restored ${selected.title} into ${PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45}.`;
    render();
  });

  exportButton.addEventListener("click", () => {
    if (!currentHandoff) return;
    downloadRestoreHandoffJson(`DataCenterLedger_PublicReleaseRestoreHandoff_v4_8_${currentHandoff.handoffDigest}.json`, currentHandoff);
  });

  clearButton.addEventListener("click", () => {
    currentHandoff = null;
    localStorage.removeItem(PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48);
    meta.textContent = "Restore handoff cleared. Active v4.5 manifest storage was not changed by clearing this receipt.";
    render();
  });

  renderBoundary();
  refreshIndex();
  render();
}

setTimeout(mountPublicReleaseRestoreHandoff, 0);
setTimeout(mountPublicReleaseRestoreHandoff, 500);
