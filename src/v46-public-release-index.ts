export {};

const PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45 = "datacenter-ledger.public-share-release-manifest.v4.5";
const PUBLIC_RELEASE_INDEX_KEY_V46 = "datacenter-ledger.public-release-index.v4.6";
const PUBLIC_RELEASE_INDEX_APP_VERSION = "4.6.0" as const;
const PUBLIC_RELEASE_INDEX_SCHEMA = "DataCenterLedger.PublicReleaseIndex.v4.6" as const;

const RELEASE_INDEX_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Release indexes reference public release manifests; they do not certify source truth.",
  "Release indexes do not create a complete national map or authorize sensitive publication."
];

type ManifestGateStatus = "release_ready" | "review_release" | "blocked" | "missing_bundle" | string;

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
  schema: typeof PUBLIC_RELEASE_INDEX_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_RELEASE_INDEX_APP_VERSION;
  indexedCount: number;
  statusCounts: {
    releaseReady: number;
    reviewRelease: number;
    blocked: number;
    missingBundle: number;
    other: number;
  };
  latestManifestDigest: string;
  entries: PublicReleaseIndexEntry[];
  safetyBoundary: string[];
  indexNotice: string;
  indexDigest: string;
};

function escapeReleaseIndex(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function releaseIndexDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireReleaseIndexElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.6 public release index control: ${selector}`);
  return element;
}

function parseReleaseManifest(text: string): PublicShareReleaseManifestV45 | null {
  try {
    const parsed = JSON.parse(text) as Partial<PublicShareReleaseManifestV45>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.PublicShareReleaseManifest.v4.5") return null;
    if (typeof parsed.manifestDigest !== "string") return null;
    return parsed as PublicShareReleaseManifestV45;
  } catch {
    return null;
  }
}

function latestReleaseManifestJson() {
  return localStorage.getItem(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45) ?? "";
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildReleaseIndexEntry(manifest: PublicShareReleaseManifestV45): PublicReleaseIndexEntry {
  const title = String(manifest.release?.title ?? "Untitled public release").trim() || "Untitled public release";
  const releaseVersion = String(manifest.release?.releaseVersion ?? manifest.appVersion ?? "").trim() || "unknown";
  const releaseNotes = String(manifest.release?.releaseNotes ?? "").trim();
  const gateStatus = String(manifest.gate?.status ?? "unknown");
  const publicRecords = safeNumber(manifest.publicSummary?.publicRecords ?? manifest.sourceBundle?.publicRecords);
  const statesRepresented = safeNumber(manifest.publicSummary?.statesRepresented ?? manifest.sourceBundle?.statesRepresented);
  const warningRecords = safeNumber(manifest.publicSummary?.warningRecords ?? manifest.sourceBundle?.warningRecords);
  const indexedAt = new Date().toISOString();

  const entryCore: Omit<PublicReleaseIndexEntry, "entryDigest"> = {
    entryId: `release-index-entry-${manifest.manifestDigest}`,
    manifestDigest: manifest.manifestDigest,
    title,
    releaseVersion,
    generatedAt: String(manifest.generatedAt ?? ""),
    indexedAt,
    status: gateStatus,
    canExport: manifest.gate?.canExport === true,
    publicRecords,
    statesRepresented,
    warningRecords,
    bundleDigest: String(manifest.sourceBundle?.bundleDigest ?? ""),
    shareDigest: String(manifest.sourceChain?.shareDigest ?? ""),
    auditDigest: String(manifest.sourceChain?.auditDigest ?? ""),
    approvalDigest: String(manifest.sourceChain?.approvalDigest ?? ""),
    notesPreview: releaseNotes.length > 160 ? `${releaseNotes.slice(0, 157)}...` : releaseNotes,
    sourceManifest: manifest
  };

  return {
    ...entryCore,
    entryDigest: releaseIndexDigest("public-release-index-entry", entryCore)
  };
}

function blankReleaseIndex(): PublicReleaseIndex {
  const core: Omit<PublicReleaseIndex, "indexDigest"> = {
    schema: PUBLIC_RELEASE_INDEX_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_RELEASE_INDEX_APP_VERSION,
    indexedCount: 0,
    statusCounts: {
      releaseReady: 0,
      reviewRelease: 0,
      blocked: 0,
      missingBundle: 0,
      other: 0
    },
    latestManifestDigest: "",
    entries: [],
    safetyBoundary: RELEASE_INDEX_BOUNDARY,
    indexNotice:
      "This public release index is a local browser library of public share release manifests. It is not a source-of-truth database, not a facility discovery tool, and not a complete national map."
  };

  return {
    ...core,
    indexDigest: releaseIndexDigest("public-release-index", core)
  };
}

function loadReleaseIndex(): PublicReleaseIndex {
  const raw = localStorage.getItem(PUBLIC_RELEASE_INDEX_KEY_V46);
  if (!raw) return blankReleaseIndex();

  try {
    const parsed = JSON.parse(raw) as Partial<PublicReleaseIndex>;
    if (parsed.schema !== PUBLIC_RELEASE_INDEX_SCHEMA || !Array.isArray(parsed.entries)) return blankReleaseIndex();
    return rebuildReleaseIndex(parsed.entries as PublicReleaseIndexEntry[]);
  } catch {
    return blankReleaseIndex();
  }
}

function rebuildReleaseIndex(entries: PublicReleaseIndexEntry[]): PublicReleaseIndex {
  const sortedEntries = [...entries].sort((left, right) => String(right.generatedAt || right.indexedAt).localeCompare(String(left.generatedAt || left.indexedAt)));
  const statusCounts = {
    releaseReady: 0,
    reviewRelease: 0,
    blocked: 0,
    missingBundle: 0,
    other: 0
  };

  for (const entry of sortedEntries) {
    if (entry.status === "release_ready") statusCounts.releaseReady += 1;
    else if (entry.status === "review_release") statusCounts.reviewRelease += 1;
    else if (entry.status === "blocked") statusCounts.blocked += 1;
    else if (entry.status === "missing_bundle") statusCounts.missingBundle += 1;
    else statusCounts.other += 1;
  }

  const core: Omit<PublicReleaseIndex, "indexDigest"> = {
    schema: PUBLIC_RELEASE_INDEX_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_RELEASE_INDEX_APP_VERSION,
    indexedCount: sortedEntries.length,
    statusCounts,
    latestManifestDigest: sortedEntries[0]?.manifestDigest ?? "",
    entries: sortedEntries,
    safetyBoundary: RELEASE_INDEX_BOUNDARY,
    indexNotice:
      "This public release index is a local browser library of public share release manifests. It is not a source-of-truth database, not a facility discovery tool, and not a complete national map."
  };

  return {
    ...core,
    indexDigest: releaseIndexDigest("public-release-index", core)
  };
}

function saveReleaseIndex(index: PublicReleaseIndex) {
  localStorage.setItem(PUBLIC_RELEASE_INDEX_KEY_V46, JSON.stringify(index, null, 2));
}

function downloadReleaseIndexJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function filterReleaseEntries(index: PublicReleaseIndex, query: string, status: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return index.entries.filter((entry) => {
    const statusMatch = status === "all" || entry.status === status;
    if (!statusMatch) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      entry.title,
      entry.releaseVersion,
      entry.manifestDigest,
      entry.bundleDigest,
      entry.shareDigest,
      entry.auditDigest,
      entry.approvalDigest,
      entry.notesPreview
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function renderReleaseIndexRows(entries: PublicReleaseIndexEntry[]) {
  if (entries.length === 0) {
    return '<tr><td colspan="8">No indexed public releases match the current filters.</td></tr>';
  }

  return entries
    .map(
      (entry) => `
        <tr>
          <td><strong>${escapeReleaseIndex(entry.title)}</strong><br /><small>${escapeReleaseIndex(entry.releaseVersion)}</small></td>
          <td>${escapeReleaseIndex(entry.status)}</td>
          <td>${entry.publicRecords}</td>
          <td>${entry.statesRepresented}</td>
          <td>${entry.warningRecords}</td>
          <td><code>${escapeReleaseIndex(entry.manifestDigest)}</code></td>
          <td>${escapeReleaseIndex(entry.generatedAt || entry.indexedAt)}</td>
          <td class="v46-index-actions">
            <button type="button" data-v46-restore="${escapeReleaseIndex(entry.manifestDigest)}">Restore</button>
            <button type="button" data-v46-remove="${escapeReleaseIndex(entry.manifestDigest)}">Remove</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderReleaseIndexSummary(index: PublicReleaseIndex) {
  return `
    <div class="v46-index-card"><span>Indexed releases</span><strong>${index.indexedCount}</strong></div>
    <div class="v46-index-card"><span>Ready</span><strong>${index.statusCounts.releaseReady}</strong></div>
    <div class="v46-index-card"><span>Review</span><strong>${index.statusCounts.reviewRelease}</strong></div>
    <div class="v46-index-card"><span>Blocked</span><strong>${index.statusCounts.blocked}</strong></div>
  `;
}

function mountPublicReleaseIndex() {
  if (document.querySelector("[data-v46-public-release-index]")) return;

  const panel = document.createElement("section");
  panel.className = "v46-public-release-index";
  panel.dataset.v46PublicReleaseIndex = "true";
  panel.innerHTML = `
    <div class="v46-index-header">
      <div>
        <p class="v46-index-kicker">v4.6 Public Release Index</p>
        <h2>Public Release Index</h2>
        <p>Index exported v4.5 public release manifests locally so release history can be searched, restored, compared, and re-exported without network calls.</p>
      </div>
      <span class="v46-index-badge">DataCenterLedger.PublicReleaseIndex.v4.6</span>
    </div>

    <div class="v46-index-controls">
      <button type="button" data-v46-load-latest>Load latest v4.5 manifest</button>
      <label class="v46-index-file">Load manifest JSON <input type="file" accept="application/json,.json" data-v46-file /></label>
      <button type="button" data-v46-add>Add / update index</button>
      <button type="button" data-v46-export>Export index</button>
      <button type="button" data-v46-clear>Clear index</button>
    </div>

    <textarea data-v46-input spellcheck="false" placeholder="Paste a DataCenterLedger.PublicShareReleaseManifest.v4.5 packet here..."></textarea>

    <div class="v46-index-filter-row">
      <label>Search <input type="search" data-v46-search placeholder="title, digest, version, note" /></label>
      <label>Status
        <select data-v46-status>
          <option value="all">All statuses</option>
          <option value="release_ready">release_ready</option>
          <option value="review_release">review_release</option>
          <option value="blocked">blocked</option>
          <option value="missing_bundle">missing_bundle</option>
        </select>
      </label>
    </div>

    <div class="v46-index-summary" data-v46-summary></div>

    <div class="v46-index-boundary">
      ${RELEASE_INDEX_BOUNDARY.map((item) => `<span>${escapeReleaseIndex(item)}</span>`).join("")}
    </div>

    <p class="v46-index-status" data-v46-status-text>Ready to load or index a public release manifest.</p>

    <div class="v46-index-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Release</th>
            <th>Status</th>
            <th>Records</th>
            <th>States</th>
            <th>Warnings</th>
            <th>Manifest digest</th>
            <th>Generated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody data-v46-rows></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(panel);

  const input = requireReleaseIndexElement<HTMLTextAreaElement>(panel, "[data-v46-input]");
  const fileInput = requireReleaseIndexElement<HTMLInputElement>(panel, "[data-v46-file]");
  const loadLatestButton = requireReleaseIndexElement<HTMLButtonElement>(panel, "[data-v46-load-latest]");
  const addButton = requireReleaseIndexElement<HTMLButtonElement>(panel, "[data-v46-add]");
  const exportButton = requireReleaseIndexElement<HTMLButtonElement>(panel, "[data-v46-export]");
  const clearButton = requireReleaseIndexElement<HTMLButtonElement>(panel, "[data-v46-clear]");
  const searchInput = requireReleaseIndexElement<HTMLInputElement>(panel, "[data-v46-search]");
  const statusSelect = requireReleaseIndexElement<HTMLSelectElement>(panel, "[data-v46-status]");
  const summary = requireReleaseIndexElement<HTMLDivElement>(panel, "[data-v46-summary]");
  const statusText = requireReleaseIndexElement<HTMLParagraphElement>(panel, "[data-v46-status-text]");
  const rows = requireReleaseIndexElement<HTMLTableSectionElement>(panel, "[data-v46-rows]");

  let indexPacket = loadReleaseIndex();

  function setStatus(message: string) {
    statusText.textContent = message;
  }

  function refreshIndex() {
    const filtered = filterReleaseEntries(indexPacket, searchInput.value, statusSelect.value);
    summary.innerHTML = renderReleaseIndexSummary(indexPacket);
    rows.innerHTML = renderReleaseIndexRows(filtered);
  }

  loadLatestButton.addEventListener("click", () => {
    const latest = latestReleaseManifestJson();
    input.value = latest;
    setStatus(latest ? "Loaded latest v4.5 public release manifest from browser storage." : "No v4.5 public release manifest found in browser storage.");
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      input.value = String(reader.result ?? "");
      setStatus(`Loaded ${file.name}.`);
    });
    reader.readAsText(file);
  });

  addButton.addEventListener("click", () => {
    const manifest = parseReleaseManifest(input.value);
    if (!manifest) {
      setStatus("Cannot index: expected DataCenterLedger.PublicShareReleaseManifest.v4.5 with manifestDigest.");
      return;
    }

    const entry = buildReleaseIndexEntry(manifest);
    const nextEntries = indexPacket.entries.filter((item) => item.manifestDigest !== entry.manifestDigest);
    nextEntries.unshift(entry);
    indexPacket = rebuildReleaseIndex(nextEntries);
    saveReleaseIndex(indexPacket);
    setStatus(`Indexed release manifest ${entry.manifestDigest}.`);
    refreshIndex();
  });

  exportButton.addEventListener("click", () => {
    indexPacket = rebuildReleaseIndex(indexPacket.entries);
    saveReleaseIndex(indexPacket);
    downloadReleaseIndexJson(`DataCenterLedger_PublicReleaseIndex_v4_6_${indexPacket.indexDigest}.json`, indexPacket);
    setStatus(`Exported public release index ${indexPacket.indexDigest}.`);
    refreshIndex();
  });

  clearButton.addEventListener("click", () => {
    indexPacket = blankReleaseIndex();
    saveReleaseIndex(indexPacket);
    setStatus("Cleared public release index.");
    refreshIndex();
  });

  searchInput.addEventListener("input", refreshIndex);
  statusSelect.addEventListener("change", refreshIndex);

  rows.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const restoreDigest = target.dataset.v46Restore;
    const removeDigest = target.dataset.v46Remove;

    if (restoreDigest) {
      const entry = indexPacket.entries.find((item) => item.manifestDigest === restoreDigest);
      if (!entry) return;
      localStorage.setItem(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45, JSON.stringify(entry.sourceManifest, null, 2));
      input.value = JSON.stringify(entry.sourceManifest, null, 2);
      setStatus(`Restored ${entry.manifestDigest} into latest v4.5 release manifest storage.`);
    }

    if (removeDigest) {
      indexPacket = rebuildReleaseIndex(indexPacket.entries.filter((item) => item.manifestDigest !== removeDigest));
      saveReleaseIndex(indexPacket);
      setStatus(`Removed ${removeDigest} from the public release index.`);
      refreshIndex();
    }
  });

  refreshIndex();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPublicReleaseIndex, { once: true });
} else {
  mountPublicReleaseIndex();
}
