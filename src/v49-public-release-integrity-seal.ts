export {};

const PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45 = "datacenter-ledger.public-share-release-manifest.v4.5";
const PUBLIC_RELEASE_INDEX_KEY_V46 = "datacenter-ledger.public-release-index.v4.6";
const PUBLIC_RELEASE_COMPARE_KEY_V47 = "datacenter-ledger.public-release-compare.v4.7";
const PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48 = "datacenter-ledger.public-release-restore-handoff.v4.8";
const PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49 = "datacenter-ledger.public-release-integrity-seal.v4.9";
const PUBLIC_RELEASE_INTEGRITY_SEAL_APP_VERSION = "4.9.0" as const;
const PUBLIC_RELEASE_INTEGRITY_SEAL_SCHEMA = "DataCenterLedger.PublicReleaseIntegritySeal.v4.9" as const;

const INTEGRITY_SEAL_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Integrity seals verify local artifact linkage only; they do not certify source truth.",
  "Integrity seals are public release review aids, not complete national maps or publication authorization."
];

type SealStatus = "sealed" | "review" | "blocked" | "missing_artifacts";
type SealFindingSeverity = "ok" | "review" | "blocker";

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
    status?: string;
    canExport?: boolean;
    messages?: string[];
  };
  sourceBundle?: {
    bundleDigest?: string;
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
  safetyBoundary?: string[];
  releaseNotice?: string;
  manifestDigest: string;
  [key: string]: unknown;
};

type PublicReleaseIndexEntry = {
  manifestDigest: string;
  title?: string;
  releaseVersion?: string;
  status?: string;
  canExport?: boolean;
  bundleDigest?: string;
  shareDigest?: string;
  auditDigest?: string;
  approvalDigest?: string;
  sourceManifest?: PublicShareReleaseManifestV45;
};

type PublicReleaseIndexV46 = {
  schema: string;
  indexDigest?: string;
  indexedCount?: number;
  latestManifestDigest?: string;
  entries?: PublicReleaseIndexEntry[];
};

type PublicReleaseCompareReportV47 = {
  schema: string;
  compareDigest?: string;
  summary?: {
    status?: string;
    reviewCount?: number;
    changedCount?: number;
    addedCount?: number;
    removedCount?: number;
  };
  baseline?: {
    manifestDigest?: string;
  };
  candidate?: {
    manifestDigest?: string;
  };
};

type PublicReleaseRestoreHandoffV48 = {
  schema: string;
  handoffDigest?: string;
  restoreMode?: string;
  restoredManifest?: {
    manifestDigest?: string;
    bundleDigest?: string;
    shareDigest?: string;
    auditDigest?: string;
    approvalDigest?: string;
  };
  compareContext?: {
    compareDigest?: string;
    selectedWasCompared?: boolean;
  };
};

type SealFinding = {
  label: string;
  severity: SealFindingSeverity;
  detail: string;
};

type PublicReleaseIntegritySeal = {
  schema: typeof PUBLIC_RELEASE_INTEGRITY_SEAL_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_RELEASE_INTEGRITY_SEAL_APP_VERSION;
  status: SealStatus;
  release: {
    title: string;
    releaseVersion: string;
    manifestDigest: string;
    gateStatus: string;
    canExport: boolean;
    publicRecords: number;
    statesRepresented: number;
    warningRecords: number;
  };
  artifacts: {
    manifestDigest: string;
    bundleDigest: string;
    shareDigest: string;
    auditDigest: string;
    approvalDigest: string;
    indexDigest: string;
    compareDigest: string;
    restoreHandoffDigest: string;
  };
  linkage: {
    manifestInIndex: boolean;
    indexLatestMatchesManifest: boolean;
    compareReferencesManifest: boolean;
    restoreReferencesManifest: boolean;
    restoreDigestMatchesSourceChain: boolean;
  };
  findings: SealFinding[];
  safetyBoundary: string[];
  sealNotice: string;
  sealDigest: string;
};

function escapeIntegritySeal(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function integritySealDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireSealElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.9 integrity seal control: ${selector}`);
  return element;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadManifest(): PublicShareReleaseManifestV45 | null {
  const parsed = parseJson<PublicShareReleaseManifestV45>(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45);
  if (!parsed || parsed.schema !== "DataCenterLedger.PublicShareReleaseManifest.v4.5" || typeof parsed.manifestDigest !== "string") return null;
  return parsed;
}

function loadIndex(): PublicReleaseIndexV46 | null {
  const parsed = parseJson<PublicReleaseIndexV46>(PUBLIC_RELEASE_INDEX_KEY_V46);
  if (!parsed || parsed.schema !== "DataCenterLedger.PublicReleaseIndex.v4.6" || !Array.isArray(parsed.entries)) return null;
  return parsed;
}

function loadCompare(): PublicReleaseCompareReportV47 | null {
  const parsed = parseJson<PublicReleaseCompareReportV47>(PUBLIC_RELEASE_COMPARE_KEY_V47);
  if (!parsed || parsed.schema !== "DataCenterLedger.PublicReleaseCompare.v4.7") return null;
  return parsed;
}

function loadRestoreHandoff(): PublicReleaseRestoreHandoffV48 | null {
  const parsed = parseJson<PublicReleaseRestoreHandoffV48>(PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48);
  if (!parsed || parsed.schema !== "DataCenterLedger.PublicReleaseRestoreHandoff.v4.8") return null;
  return parsed;
}

function addFinding(findings: SealFinding[], label: string, severity: SealFindingSeverity, detail: string) {
  findings.push({ label, severity, detail });
}

function buildIntegritySeal(): PublicReleaseIntegritySeal | null {
  const manifest = loadManifest();
  const index = loadIndex();
  const compare = loadCompare();
  const restore = loadRestoreHandoff();
  const findings: SealFinding[] = [];

  if (!manifest) addFinding(findings, "Active v4.5 manifest", "blocker", "No valid active public release manifest was found.");
  if (!index) addFinding(findings, "v4.6 release index", "review", "No valid public release index was found.");
  if (!compare) addFinding(findings, "v4.7 compare report", "review", "No compare report was found; seal can continue with a review note.");
  if (!restore) addFinding(findings, "v4.8 restore handoff", "review", "No restore handoff was found; seal can continue if no restore was needed.");

  if (!manifest) return null;

  const manifestDigest = safeText(manifest.manifestDigest);
  const bundleDigest = safeText(manifest.sourceBundle?.bundleDigest);
  const shareDigest = safeText(manifest.sourceChain?.shareDigest);
  const auditDigest = safeText(manifest.sourceChain?.auditDigest);
  const approvalDigest = safeText(manifest.sourceChain?.approvalDigest);
  const indexEntries = index?.entries ?? [];
  const indexedEntry = indexEntries.find((entry) => entry.manifestDigest === manifestDigest) ?? null;
  const compareReferencesManifest = Boolean(compare && (compare.baseline?.manifestDigest === manifestDigest || compare.candidate?.manifestDigest === manifestDigest));
  const restoreReferencesManifest = restore?.restoredManifest?.manifestDigest === manifestDigest;
  const restoreDigestMatchesSourceChain = Boolean(
    restore &&
      restore.restoredManifest?.bundleDigest === bundleDigest &&
      restore.restoredManifest?.shareDigest === shareDigest &&
      restore.restoredManifest?.auditDigest === auditDigest &&
      restore.restoredManifest?.approvalDigest === approvalDigest
  );

  if (manifest.gate?.canExport === true) addFinding(findings, "Manifest gate", "ok", "Active manifest is export-ready.");
  else addFinding(findings, "Manifest gate", "blocker", "Active manifest is not export-ready.");

  if (bundleDigest) addFinding(findings, "Bundle digest", "ok", "Bundle digest is present.");
  else addFinding(findings, "Bundle digest", "blocker", "Bundle digest is missing.");

  if (shareDigest && auditDigest && approvalDigest) addFinding(findings, "Source-chain digests", "ok", "Share, audit, and approval digests are present.");
  else addFinding(findings, "Source-chain digests", "blocker", "One or more share/audit/approval digests are missing.");

  if (indexedEntry) addFinding(findings, "Index membership", "ok", "Active manifest appears in the v4.6 release index.");
  else addFinding(findings, "Index membership", "review", "Active manifest is not found in the v4.6 release index.");

  if (index?.latestManifestDigest === manifestDigest) addFinding(findings, "Latest index pointer", "ok", "Index latest manifest pointer matches active manifest.");
  else addFinding(findings, "Latest index pointer", "review", "Index latest manifest pointer does not match active manifest.");

  if (compareReferencesManifest) addFinding(findings, "Compare linkage", "ok", "Latest v4.7 compare report references this manifest.");
  else addFinding(findings, "Compare linkage", "review", "Latest v4.7 compare report does not reference this manifest.");

  if (restoreReferencesManifest && restoreDigestMatchesSourceChain) addFinding(findings, "Restore linkage", "ok", "Latest v4.8 restore handoff references this manifest and matching source-chain digests.");
  else if (restoreReferencesManifest) addFinding(findings, "Restore linkage", "review", "Restore handoff references this manifest but source-chain digests do not all match.");
  else addFinding(findings, "Restore linkage", "review", "Latest restore handoff does not reference this manifest.");

  if (Array.isArray(manifest.safetyBoundary) && manifest.safetyBoundary.length >= 4) addFinding(findings, "Safety boundary", "ok", "Manifest carries a public release safety boundary.");
  else addFinding(findings, "Safety boundary", "review", "Manifest safety boundary is missing or thin.");

  const blockerCount = findings.filter((finding) => finding.severity === "blocker").length;
  const reviewCount = findings.filter((finding) => finding.severity === "review").length;
  const status: SealStatus = blockerCount > 0 ? "blocked" : reviewCount > 0 ? "review" : "sealed";

  const sealCore: Omit<PublicReleaseIntegritySeal, "sealDigest"> = {
    schema: PUBLIC_RELEASE_INTEGRITY_SEAL_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_RELEASE_INTEGRITY_SEAL_APP_VERSION,
    status,
    release: {
      title: safeText(manifest.release?.title) || "Untitled public release",
      releaseVersion: safeText(manifest.release?.releaseVersion) || safeText(manifest.appVersion) || "unknown",
      manifestDigest,
      gateStatus: safeText(manifest.gate?.status) || "unknown",
      canExport: manifest.gate?.canExport === true,
      publicRecords: safeNumber(manifest.publicSummary?.publicRecords ?? manifest.sourceBundle?.publicRecords),
      statesRepresented: safeNumber(manifest.publicSummary?.statesRepresented ?? manifest.sourceBundle?.statesRepresented),
      warningRecords: safeNumber(manifest.publicSummary?.warningRecords ?? manifest.sourceBundle?.warningRecords)
    },
    artifacts: {
      manifestDigest,
      bundleDigest,
      shareDigest,
      auditDigest,
      approvalDigest,
      indexDigest: safeText(index?.indexDigest),
      compareDigest: safeText(compare?.compareDigest),
      restoreHandoffDigest: safeText(restore?.handoffDigest)
    },
    linkage: {
      manifestInIndex: Boolean(indexedEntry),
      indexLatestMatchesManifest: index?.latestManifestDigest === manifestDigest,
      compareReferencesManifest,
      restoreReferencesManifest,
      restoreDigestMatchesSourceChain
    },
    findings,
    safetyBoundary: INTEGRITY_SEAL_BOUNDARY,
    sealNotice:
      "This integrity seal checks local public release artifact linkage only. It does not certify source truth, discover facilities, enrich locations, authorize publication, or create a complete national map."
  };

  return {
    ...sealCore,
    sealDigest: integritySealDigest("public-release-integrity-seal", sealCore)
  };
}

function downloadIntegritySealJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderSealSummary(seal: PublicReleaseIntegritySeal | null) {
  if (!seal) {
    return `
      <div class="v49-seal-card"><span>Status</span><strong>Not sealed</strong></div>
      <div class="v49-seal-card"><span>Blockers</span><strong>0</strong></div>
      <div class="v49-seal-card"><span>Reviews</span><strong>0</strong></div>
      <div class="v49-seal-card"><span>Digest</span><strong>—</strong></div>
    `;
  }

  return `
    <div class="v49-seal-card"><span>Status</span><strong>${escapeIntegritySeal(seal.status)}</strong></div>
    <div class="v49-seal-card"><span>Blockers</span><strong>${seal.findings.filter((finding) => finding.severity === "blocker").length}</strong></div>
    <div class="v49-seal-card"><span>Reviews</span><strong>${seal.findings.filter((finding) => finding.severity === "review").length}</strong></div>
    <div class="v49-seal-card"><span>Digest</span><strong>${escapeIntegritySeal(seal.sealDigest)}</strong></div>
  `;
}

function renderFindingRows(seal: PublicReleaseIntegritySeal | null) {
  if (!seal) return '<tr><td colspan="3">Build an integrity seal to see linkage findings.</td></tr>';

  return seal.findings
    .map(
      (finding) => `
        <tr data-severity="${escapeIntegritySeal(finding.severity)}">
          <td><strong>${escapeIntegritySeal(finding.label)}</strong></td>
          <td>${escapeIntegritySeal(finding.severity)}</td>
          <td>${escapeIntegritySeal(finding.detail)}</td>
        </tr>
      `
    )
    .join("");
}

function renderArtifactList(seal: PublicReleaseIntegritySeal | null) {
  if (!seal) return "No seal built yet.";
  return `
    <dl>
      <dt>Manifest</dt><dd><code>${escapeIntegritySeal(seal.artifacts.manifestDigest || "—")}</code></dd>
      <dt>Bundle</dt><dd><code>${escapeIntegritySeal(seal.artifacts.bundleDigest || "—")}</code></dd>
      <dt>Share</dt><dd><code>${escapeIntegritySeal(seal.artifacts.shareDigest || "—")}</code></dd>
      <dt>Audit</dt><dd><code>${escapeIntegritySeal(seal.artifacts.auditDigest || "—")}</code></dd>
      <dt>Approval</dt><dd><code>${escapeIntegritySeal(seal.artifacts.approvalDigest || "—")}</code></dd>
      <dt>Index</dt><dd><code>${escapeIntegritySeal(seal.artifacts.indexDigest || "—")}</code></dd>
      <dt>Compare</dt><dd><code>${escapeIntegritySeal(seal.artifacts.compareDigest || "—")}</code></dd>
      <dt>Restore</dt><dd><code>${escapeIntegritySeal(seal.artifacts.restoreHandoffDigest || "—")}</code></dd>
    </dl>
  `;
}

function mountPublicReleaseIntegritySeal() {
  if (document.querySelector("[data-v49-public-release-integrity-seal]")) return;

  const panel = document.createElement("section");
  panel.className = "v49-public-release-integrity-seal";
  panel.dataset.v49PublicReleaseIntegritySeal = "true";
  panel.innerHTML = `
    <div class="v49-seal-header">
      <div>
        <p class="v49-seal-kicker">v4.9 Public Release Integrity Seal</p>
        <h2>Public Release Integrity Seal</h2>
        <p>Generate a local integrity seal over the active public release manifest, release index, latest compare report, and restore handoff so a public release carries a clear artifact trail.</p>
      </div>
      <span class="v49-seal-badge">DataCenterLedger.PublicReleaseIntegritySeal.v4.9</span>
    </div>

    <div class="v49-seal-boundary" data-v49-boundary></div>

    <div class="v49-seal-controls">
      <button type="button" data-v49-build>Build integrity seal</button>
      <button type="button" data-v49-export disabled>Export seal</button>
      <button type="button" data-v49-clear>Clear seal</button>
    </div>

    <div class="v49-seal-summary" data-v49-summary></div>
    <div class="v49-seal-meta" data-v49-meta>Build the seal after creating or restoring a public release manifest.</div>

    <div class="v49-seal-artifacts" data-v49-artifacts></div>

    <div class="v49-seal-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>Severity</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody data-v49-findings></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(panel);

  const boundary = requireSealElement<HTMLDivElement>(panel, "[data-v49-boundary]");
  const buildButton = requireSealElement<HTMLButtonElement>(panel, "[data-v49-build]");
  const exportButton = requireSealElement<HTMLButtonElement>(panel, "[data-v49-export]");
  const clearButton = requireSealElement<HTMLButtonElement>(panel, "[data-v49-clear]");
  const summary = requireSealElement<HTMLDivElement>(panel, "[data-v49-summary]");
  const meta = requireSealElement<HTMLDivElement>(panel, "[data-v49-meta]");
  const artifacts = requireSealElement<HTMLDivElement>(panel, "[data-v49-artifacts]");
  const findings = requireSealElement<HTMLTableSectionElement>(panel, "[data-v49-findings]");

  let currentSeal: PublicReleaseIntegritySeal | null = null;

  function renderBoundary() {
    boundary.innerHTML = INTEGRITY_SEAL_BOUNDARY.map((line) => `<span>${escapeIntegritySeal(line)}</span>`).join("");
  }

  function render() {
    summary.innerHTML = renderSealSummary(currentSeal);
    artifacts.innerHTML = renderArtifactList(currentSeal);
    findings.innerHTML = renderFindingRows(currentSeal);
    exportButton.disabled = !currentSeal;
  }

  buildButton.addEventListener("click", () => {
    currentSeal = buildIntegritySeal();
    if (!currentSeal) {
      localStorage.removeItem(PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49);
      meta.textContent = "A valid active v4.5 public release manifest is required before building a seal.";
      render();
      return;
    }

    localStorage.setItem(PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49, JSON.stringify(currentSeal, null, 2));
    meta.textContent = `Integrity seal built for ${currentSeal.release.title}. Status: ${currentSeal.status}.`;
    render();
  });

  exportButton.addEventListener("click", () => {
    if (!currentSeal) return;
    downloadIntegritySealJson(`DataCenterLedger_PublicReleaseIntegritySeal_v4_9_${currentSeal.sealDigest}.json`, currentSeal);
  });

  clearButton.addEventListener("click", () => {
    currentSeal = null;
    localStorage.removeItem(PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49);
    meta.textContent = "Integrity seal cleared.";
    render();
  });

  renderBoundary();
  render();
}

setTimeout(mountPublicReleaseIntegritySeal, 0);
setTimeout(mountPublicReleaseIntegritySeal, 500);
