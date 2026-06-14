export {};

const PUBLIC_RELEASE_INDEX_KEY_V46 = "datacenter-ledger.public-release-index.v4.6";
const PUBLIC_RELEASE_COMPARE_KEY_V47 = "datacenter-ledger.public-release-compare.v4.7";
const PUBLIC_RELEASE_COMPARE_APP_VERSION = "4.7.0" as const;
const PUBLIC_RELEASE_COMPARE_SCHEMA = "DataCenterLedger.PublicReleaseCompare.v4.7" as const;

const RELEASE_COMPARE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Release comparison reviews public release metadata and digests only; it does not certify source truth.",
  "Release comparison is a local browser aid, not a complete national map or publication authorization."
];

type ManifestGateStatus = "release_ready" | "review_release" | "blocked" | "missing_bundle" | string;
type CompareSeverity = "same" | "changed" | "added" | "removed" | "review";

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
  generatedAt?: string;
  appVersion?: string;
  indexedCount?: number;
  entries?: PublicReleaseIndexEntry[];
  indexDigest?: string;
};

type CompareItem = {
  field: string;
  baseline: string;
  candidate: string;
  severity: CompareSeverity;
};

type PublicReleaseCompareReport = {
  schema: typeof PUBLIC_RELEASE_COMPARE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_RELEASE_COMPARE_APP_VERSION;
  baseline: {
    title: string;
    releaseVersion: string;
    manifestDigest: string;
    generatedAt: string;
    status: string;
  };
  candidate: {
    title: string;
    releaseVersion: string;
    manifestDigest: string;
    generatedAt: string;
    status: string;
  };
  summary: {
    status: "same" | "changed" | "review" | "invalid";
    sameCount: number;
    changedCount: number;
    addedCount: number;
    removedCount: number;
    reviewCount: number;
  };
  comparisons: CompareItem[];
  safetyBoundary: string[];
  compareNotice: string;
  compareDigest: string;
};

function escapeReleaseCompare(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function releaseCompareDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireReleaseCompareElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.7 public release compare control: ${selector}`);
  return element;
}

function safeReleaseCompareNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function loadReleaseIndex(): PublicReleaseIndexEntry[] {
  const raw = localStorage.getItem(PUBLIC_RELEASE_INDEX_KEY_V46);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PublicReleaseIndex;
    if (parsed.schema !== "DataCenterLedger.PublicReleaseIndex.v4.6" || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter((entry) => entry && typeof entry.manifestDigest === "string" && entry.sourceManifest);
  } catch {
    return [];
  }
}

function readValue(manifest: PublicShareReleaseManifestV45, key: string): string {
  switch (key) {
    case "title":
      return safeText(manifest.release?.title);
    case "releaseVersion":
      return safeText(manifest.release?.releaseVersion);
    case "gateStatus":
      return safeText(manifest.gate?.status);
    case "canExport":
      return manifest.gate?.canExport === true ? "true" : "false";
    case "publicRecords":
      return String(safeReleaseCompareNumber(manifest.publicSummary?.publicRecords ?? manifest.sourceBundle?.publicRecords));
    case "statesRepresented":
      return String(safeReleaseCompareNumber(manifest.publicSummary?.statesRepresented ?? manifest.sourceBundle?.statesRepresented));
    case "warningRecords":
      return String(safeReleaseCompareNumber(manifest.publicSummary?.warningRecords ?? manifest.sourceBundle?.warningRecords));
    case "bundleDigest":
      return safeText(manifest.sourceBundle?.bundleDigest);
    case "shareDigest":
      return safeText(manifest.sourceChain?.shareDigest);
    case "auditDigest":
      return safeText(manifest.sourceChain?.auditDigest);
    case "approvalDigest":
      return safeText(manifest.sourceChain?.approvalDigest);
    case "viewerDigest":
      return safeText(manifest.sourceChain?.viewerDigest);
    case "finalLayerDigest":
      return safeText(manifest.sourceChain?.finalLayerDigest);
    case "auditStatus":
      return safeText(manifest.sourceChain?.auditStatus);
    case "approvalStatus":
      return safeText(manifest.sourceChain?.approvalStatus);
    case "acceptedReviewWarnings":
      return manifest.sourceChain?.acceptedReviewWarnings === true ? "true" : "false";
    case "boundaryCount":
      return String(Array.isArray(manifest.safetyBoundary) ? manifest.safetyBoundary.length : safeReleaseCompareNumber(manifest.publicSummary?.boundaryCount));
    case "releaseNotes":
      return safeText(manifest.release?.releaseNotes);
    case "releaseNotice":
      return safeText(manifest.releaseNotice);
    default:
      return "";
  }
}

function compareSeverity(field: string, baseline: string, candidate: string): CompareSeverity {
  if (baseline === candidate) return "same";
  if (!baseline && candidate) return "added";
  if (baseline && !candidate) return "removed";
  if (["gateStatus", "canExport", "auditStatus", "approvalStatus", "acceptedReviewWarnings", "releaseNotice"].includes(field)) return "review";
  return "changed";
}

function buildCompareReport(baselineEntry: PublicReleaseIndexEntry, candidateEntry: PublicReleaseIndexEntry): PublicReleaseCompareReport {
  const baselineManifest = baselineEntry.sourceManifest;
  const candidateManifest = candidateEntry.sourceManifest;
  const fields = [
    "title",
    "releaseVersion",
    "gateStatus",
    "canExport",
    "publicRecords",
    "statesRepresented",
    "warningRecords",
    "bundleDigest",
    "shareDigest",
    "auditDigest",
    "approvalDigest",
    "viewerDigest",
    "finalLayerDigest",
    "auditStatus",
    "approvalStatus",
    "acceptedReviewWarnings",
    "boundaryCount",
    "releaseNotes",
    "releaseNotice"
  ];

  const comparisons = fields.map((field) => {
    const baseline = readValue(baselineManifest, field);
    const candidate = readValue(candidateManifest, field);
    return {
      field,
      baseline,
      candidate,
      severity: compareSeverity(field, baseline, candidate)
    };
  });

  const sameCount = comparisons.filter((item) => item.severity === "same").length;
  const changedCount = comparisons.filter((item) => item.severity === "changed").length;
  const addedCount = comparisons.filter((item) => item.severity === "added").length;
  const removedCount = comparisons.filter((item) => item.severity === "removed").length;
  const reviewCount = comparisons.filter((item) => item.severity === "review").length;
  const status = reviewCount > 0 ? "review" : changedCount + addedCount + removedCount > 0 ? "changed" : "same";

  const reportCore: Omit<PublicReleaseCompareReport, "compareDigest"> = {
    schema: PUBLIC_RELEASE_COMPARE_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_RELEASE_COMPARE_APP_VERSION,
    baseline: {
      title: baselineEntry.title,
      releaseVersion: baselineEntry.releaseVersion,
      manifestDigest: baselineEntry.manifestDigest,
      generatedAt: baselineEntry.generatedAt,
      status: String(baselineEntry.status)
    },
    candidate: {
      title: candidateEntry.title,
      releaseVersion: candidateEntry.releaseVersion,
      manifestDigest: candidateEntry.manifestDigest,
      generatedAt: candidateEntry.generatedAt,
      status: String(candidateEntry.status)
    },
    summary: {
      status,
      sameCount,
      changedCount,
      addedCount,
      removedCount,
      reviewCount
    },
    comparisons,
    safetyBoundary: RELEASE_COMPARE_BOUNDARY,
    compareNotice:
      "This comparison reviews public release manifest metadata and source-chain digests from the local browser index. It is not a source-of-truth certification, not a facility discovery tool, and not a publication authorization."
  };

  return {
    ...reportCore,
    compareDigest: releaseCompareDigest("public-release-compare", reportCore)
  };
}

function downloadReleaseCompareJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderOptions(entries: PublicReleaseIndexEntry[]) {
  if (entries.length === 0) return '<option value="">No indexed releases available</option>';
  return entries
    .map((entry) => `<option value="${escapeReleaseCompare(entry.manifestDigest)}">${escapeReleaseCompare(entry.title)} · ${escapeReleaseCompare(entry.releaseVersion)} · ${escapeReleaseCompare(entry.manifestDigest)}</option>`)
    .join("");
}

function renderCompareSummary(report: PublicReleaseCompareReport | null) {
  if (!report) {
    return `
      <div class="v47-compare-card"><span>Status</span><strong>Not compared</strong></div>
      <div class="v47-compare-card"><span>Changed</span><strong>0</strong></div>
      <div class="v47-compare-card"><span>Review</span><strong>0</strong></div>
      <div class="v47-compare-card"><span>Digest</span><strong>—</strong></div>
    `;
  }

  return `
    <div class="v47-compare-card"><span>Status</span><strong>${escapeReleaseCompare(report.summary.status)}</strong></div>
    <div class="v47-compare-card"><span>Changed</span><strong>${report.summary.changedCount + report.summary.addedCount + report.summary.removedCount}</strong></div>
    <div class="v47-compare-card"><span>Review</span><strong>${report.summary.reviewCount}</strong></div>
    <div class="v47-compare-card"><span>Digest</span><strong>${escapeReleaseCompare(report.compareDigest)}</strong></div>
  `;
}

function renderCompareRows(report: PublicReleaseCompareReport | null) {
  if (!report) return '<tr><td colspan="4">Run a comparison to see release metadata and digest differences.</td></tr>';

  return report.comparisons
    .map(
      (item) => `
        <tr data-severity="${escapeReleaseCompare(item.severity)}">
          <td><strong>${escapeReleaseCompare(item.field)}</strong><br /><small>${escapeReleaseCompare(item.severity)}</small></td>
          <td>${escapeReleaseCompare(item.baseline || "—")}</td>
          <td>${escapeReleaseCompare(item.candidate || "—")}</td>
          <td>${item.severity === "same" ? "No difference" : "Review difference"}</td>
        </tr>
      `
    )
    .join("");
}

function mountPublicReleaseCompareTool() {
  if (document.querySelector("[data-v47-public-release-compare]")) return;

  const panel = document.createElement("section");
  panel.className = "v47-public-release-compare";
  panel.dataset.v47PublicReleaseCompare = "true";
  panel.innerHTML = `
    <div class="v47-compare-header">
      <div>
        <p class="v47-compare-kicker">v4.7 Public Release Compare Tool</p>
        <h2>Public Release Compare Tool</h2>
        <p>Compare two indexed v4.6 public releases side-by-side for metadata, gate status, record counts, public state counts, warnings, notes, and source-chain digest changes.</p>
      </div>
      <span class="v47-compare-badge">DataCenterLedger.PublicReleaseCompare.v4.7</span>
    </div>

    <div class="v47-compare-boundary" data-v47-boundary></div>

    <div class="v47-compare-controls">
      <button type="button" data-v47-refresh>Refresh release index</button>
      <button type="button" data-v47-compare>Compare selected releases</button>
      <button type="button" data-v47-export disabled>Export compare report</button>
      <button type="button" data-v47-clear>Clear compare</button>
    </div>

    <div class="v47-compare-selectors">
      <label>Baseline release<select data-v47-baseline></select></label>
      <label>Candidate release<select data-v47-candidate></select></label>
    </div>

    <div class="v47-compare-summary" data-v47-summary></div>

    <div class="v47-compare-meta" data-v47-meta>Load the local v4.6 release index, choose two releases, then compare.</div>

    <div class="v47-compare-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Baseline</th>
            <th>Candidate</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody data-v47-rows></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(panel);

  const boundary = requireReleaseCompareElement<HTMLDivElement>(panel, "[data-v47-boundary]");
  const refreshButton = requireReleaseCompareElement<HTMLButtonElement>(panel, "[data-v47-refresh]");
  const compareButton = requireReleaseCompareElement<HTMLButtonElement>(panel, "[data-v47-compare]");
  const exportButton = requireReleaseCompareElement<HTMLButtonElement>(panel, "[data-v47-export]");
  const clearButton = requireReleaseCompareElement<HTMLButtonElement>(panel, "[data-v47-clear]");
  const baselineSelect = requireReleaseCompareElement<HTMLSelectElement>(panel, "[data-v47-baseline]");
  const candidateSelect = requireReleaseCompareElement<HTMLSelectElement>(panel, "[data-v47-candidate]");
  const summary = requireReleaseCompareElement<HTMLDivElement>(panel, "[data-v47-summary]");
  const meta = requireReleaseCompareElement<HTMLDivElement>(panel, "[data-v47-meta]");
  const rows = requireReleaseCompareElement<HTMLTableSectionElement>(panel, "[data-v47-rows]");

  let entries: PublicReleaseIndexEntry[] = [];
  let currentReport: PublicReleaseCompareReport | null = null;

  function renderBoundary() {
    boundary.innerHTML = RELEASE_COMPARE_BOUNDARY.map((line) => `<span>${escapeReleaseCompare(line)}</span>`).join("");
  }

  function refreshIndex() {
    entries = loadReleaseIndex();
    baselineSelect.innerHTML = renderOptions(entries);
    candidateSelect.innerHTML = renderOptions(entries);
    if (entries.length > 1) {
      candidateSelect.selectedIndex = 1;
    }
    meta.textContent = entries.length > 0 ? `Loaded ${entries.length} indexed public release${entries.length === 1 ? "" : "s"}.` : "No v4.6 public release index entries found yet.";
  }

  function render() {
    summary.innerHTML = renderCompareSummary(currentReport);
    rows.innerHTML = renderCompareRows(currentReport);
    exportButton.disabled = !currentReport;
  }

  refreshButton.addEventListener("click", () => {
    refreshIndex();
    currentReport = null;
    localStorage.removeItem(PUBLIC_RELEASE_COMPARE_KEY_V47);
    render();
  });

  compareButton.addEventListener("click", () => {
    const baseline = entries.find((entry) => entry.manifestDigest === baselineSelect.value);
    const candidate = entries.find((entry) => entry.manifestDigest === candidateSelect.value);

    if (!baseline || !candidate) {
      currentReport = null;
      meta.textContent = "Choose two indexed public releases before comparing.";
      render();
      return;
    }

    if (baseline.manifestDigest === candidate.manifestDigest) {
      currentReport = null;
      meta.textContent = "Choose two different releases for a useful comparison.";
      render();
      return;
    }

    currentReport = buildCompareReport(baseline, candidate);
    localStorage.setItem(PUBLIC_RELEASE_COMPARE_KEY_V47, JSON.stringify(currentReport, null, 2));
    meta.textContent = `Compared ${baseline.title} against ${candidate.title}.`;
    render();
  });

  exportButton.addEventListener("click", () => {
    if (!currentReport) return;
    downloadReleaseCompareJson(`DataCenterLedger_PublicReleaseCompare_v4_7_${currentReport.compareDigest}.json`, currentReport);
  });

  clearButton.addEventListener("click", () => {
    currentReport = null;
    localStorage.removeItem(PUBLIC_RELEASE_COMPARE_KEY_V47);
    meta.textContent = "Comparison cleared.";
    render();
  });

  renderBoundary();
  refreshIndex();
  render();
}

setTimeout(mountPublicReleaseCompareTool, 0);
setTimeout(mountPublicReleaseCompareTool, 500);
