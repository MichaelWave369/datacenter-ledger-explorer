export {};

const PUBLIC_SHARE_BUNDLE_KEY_V44 = "datacenter-ledger.public-share-bundle.v4.4";
const PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45 = "datacenter-ledger.public-share-release-manifest.v4.5";
const PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION = "4.5.0" as const;
const PUBLIC_SHARE_RELEASE_MANIFEST_SCHEMA = "DataCenterLedger.PublicShareReleaseManifest.v4.5" as const;

const RELEASE_MANIFEST_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Release manifests reference public share bundles; they do not certify source truth.",
  "Release manifests do not create a complete national map or authorize sensitive publication."
];

type BundleStatus = "bundle_ready" | "review_bundle" | "blocked" | "missing_inputs";

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

type PublicShareBundle = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  gate?: {
    status?: BundleStatus | string;
    canExport?: boolean;
    messages?: string[];
  };
  releaseSummary?: {
    publicRecords?: number;
    statesRepresented?: number;
    warningRecords?: number;
    auditStatus?: string;
    auditWarnings?: number;
    auditBlockers?: number;
    approvalStatus?: string;
  };
  sourceChain?: {
    sharePacket?: {
      schema?: string;
      shareDigest?: string;
      generatedAt?: string;
      viewerDigest?: string;
      finalLayerDigest?: string;
      gateStatus?: string;
      qaStatus?: string;
    };
    redactionAudit?: {
      schema?: string;
      auditDigest?: string;
      generatedAt?: string;
      status?: string;
      blockers?: number;
      warnings?: number;
      infos?: number;
      recordsWithFindings?: number;
      internalFieldHits?: number;
    };
    approval?: {
      schema?: string;
      approvalDigest?: string;
      generatedAt?: string;
      status?: string;
      acceptedReviewWarnings?: boolean;
    };
  };
  publicContent?: {
    publicSummary?: Record<string, unknown>;
    stateClusters?: Array<{ state?: string; count?: number }>;
    publicRecords?: PublicShareRecord[];
    publicShareNotice?: string;
  };
  bundleOmittedFields?: string[];
  safetyBoundary?: string[];
  bundleNotice?: string;
  bundleDigest: string;
  [key: string]: unknown;
};

type PublicShareReleaseManifestGate = {
  status: "release_ready" | "review_release" | "blocked" | "missing_bundle";
  canExport: boolean;
  messages: string[];
};

type PublicShareReleaseManifest = {
  schema: typeof PUBLIC_SHARE_RELEASE_MANIFEST_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION;
  release: {
    title: string;
    releaseVersion: string;
    releaseNotes: string;
    preparedBy: string;
  };
  gate: PublicShareReleaseManifestGate;
  sourceBundle: {
    schema: string;
    bundleDigest: string;
    generatedAt: string;
    bundleStatus: string;
    publicRecords: number;
    statesRepresented: number;
    warningRecords: number;
  };
  sourceChain: {
    shareDigest: string;
    auditDigest: string;
    approvalDigest: string;
    viewerDigest: string;
    finalLayerDigest: string;
    auditStatus: string;
    approvalStatus: string;
    acceptedReviewWarnings: boolean;
  };
  publicSummary: {
    publicRecords: number;
    statesRepresented: number;
    warningRecords: number;
    boundaryCount: number;
    omittedFieldCount: number;
  };
  releaseFiles: Array<{
    label: string;
    schema: string;
    digest: string;
    role: string;
  }>;
  safetyBoundary: string[];
  releaseNotice: string;
  manifestDigest: string;
};

function escapeManifest(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function manifestDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `public-share-release-manifest-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireManifestElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.5 public release manifest control: ${selector}`);
  return element;
}

function parsePublicShareBundle(text: string): PublicShareBundle | null {
  try {
    const parsed = JSON.parse(text) as Partial<PublicShareBundle>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.PublicShareBundle.v4.4") return null;
    if (typeof parsed.bundleDigest !== "string") return null;
    return parsed as PublicShareBundle;
  } catch {
    return null;
  }
}

function latestStoredJson(key: string) {
  return localStorage.getItem(key) ?? "";
}

function downloadManifestJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function bundleRecords(bundle: PublicShareBundle) {
  const records = bundle.publicContent?.publicRecords;
  return Array.isArray(records) ? records : [];
}

function bundleStateCount(bundle: PublicShareBundle, records: PublicShareRecord[]) {
  const fromSummary = bundle.releaseSummary?.statesRepresented;
  if (typeof fromSummary === "number") return fromSummary;

  const states = new Set<string>();
  for (const record of records) {
    const state = String(record.state ?? "").trim().toUpperCase();
    if (state) states.add(state);
  }
  return states.size;
}

function gateReleaseManifest(bundle: PublicShareBundle | null, releaseNotes: string): PublicShareReleaseManifestGate {
  const messages: string[] = [];

  if (!bundle) {
    return {
      status: "missing_bundle",
      canExport: false,
      messages: ["Missing or invalid v4.4 public share bundle."]
    };
  }

  const status = String(bundle.gate?.status ?? "blocked");
  const canExportBundle = bundle.gate?.canExport === true;
  const publicRecords = bundle.releaseSummary?.publicRecords ?? bundleRecords(bundle).length;
  const auditBlockers = bundle.releaseSummary?.auditBlockers ?? 0;
  const notes = releaseNotes.trim();

  if (!canExportBundle) messages.push("Public share bundle is not export-ready.");
  if (status === "blocked" || status === "missing_inputs") messages.push("Public share bundle gate is blocked.");
  if (auditBlockers > 0) messages.push("Public share bundle reports audit blockers.");
  if (publicRecords <= 0) messages.push("Public share bundle has no public records.");
  if (notes.length < 10) messages.push("Release notes must explain what is being shared.");

  if (messages.length > 0) {
    return { status: "blocked", canExport: false, messages };
  }

  if (status === "review_bundle" || (bundle.releaseSummary?.auditWarnings ?? 0) > 0) {
    return {
      status: "review_release",
      canExport: true,
      messages: ["Release manifest is export-ready with review-state bundle warnings disclosed."]
    };
  }

  return {
    status: "release_ready",
    canExport: true,
    messages: ["Release manifest is export-ready and linked to a bundle-ready public share bundle."]
  };
}

function buildReleaseManifest(bundle: PublicShareBundle, releaseTitle: string, releaseVersion: string, releaseNotes: string, preparedBy: string): PublicShareReleaseManifest {
  const generatedAt = new Date().toISOString();
  const records = bundleRecords(bundle);
  const statesRepresented = bundleStateCount(bundle, records);
  const publicRecords = bundle.releaseSummary?.publicRecords ?? records.length;
  const warningRecords = bundle.releaseSummary?.warningRecords ?? records.filter((record) => String(record.qaBadge ?? "").toLowerCase().includes("warning")).length;
  const gate = gateReleaseManifest(bundle, releaseNotes);
  const bundleStatus = String(bundle.gate?.status ?? "unknown");
  const shareDigest = String(bundle.sourceChain?.sharePacket?.shareDigest ?? "");
  const auditDigest = String(bundle.sourceChain?.redactionAudit?.auditDigest ?? "");
  const approvalDigest = String(bundle.sourceChain?.approval?.approvalDigest ?? "");
  const viewerDigest = String(bundle.sourceChain?.sharePacket?.viewerDigest ?? "");
  const finalLayerDigest = String(bundle.sourceChain?.sharePacket?.finalLayerDigest ?? "");
  const auditStatus = String(bundle.sourceChain?.redactionAudit?.status ?? bundle.releaseSummary?.auditStatus ?? "unknown");
  const approvalStatus = String(bundle.sourceChain?.approval?.status ?? bundle.releaseSummary?.approvalStatus ?? "unknown");

  const manifestCore: Omit<PublicShareReleaseManifest, "manifestDigest"> = {
    schema: PUBLIC_SHARE_RELEASE_MANIFEST_SCHEMA,
    generatedAt,
    appVersion: PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION,
    release: {
      title: releaseTitle.trim() || "DataCenterLedger Public Share Release",
      releaseVersion: releaseVersion.trim() || PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION,
      releaseNotes: releaseNotes.trim(),
      preparedBy: preparedBy.trim()
    },
    gate,
    sourceBundle: {
      schema: bundle.schema,
      bundleDigest: bundle.bundleDigest,
      generatedAt: String(bundle.generatedAt ?? ""),
      bundleStatus,
      publicRecords,
      statesRepresented,
      warningRecords
    },
    sourceChain: {
      shareDigest,
      auditDigest,
      approvalDigest,
      viewerDigest,
      finalLayerDigest,
      auditStatus,
      approvalStatus,
      acceptedReviewWarnings: bundle.sourceChain?.approval?.acceptedReviewWarnings === true
    },
    publicSummary: {
      publicRecords,
      statesRepresented,
      warningRecords,
      boundaryCount: RELEASE_MANIFEST_BOUNDARY.length,
      omittedFieldCount: Array.isArray(bundle.bundleOmittedFields) ? bundle.bundleOmittedFields.length : 0
    },
    releaseFiles: [
      {
        label: "Public share bundle",
        schema: bundle.schema,
        digest: bundle.bundleDigest,
        role: "Primary public bundle"
      },
      {
        label: "Sanitized public share packet",
        schema: String(bundle.sourceChain?.sharePacket?.schema ?? "DataCenterLedger.PublicSharePacket.v4.1"),
        digest: shareDigest,
        role: "Sanitized public record content"
      },
      {
        label: "Redaction audit",
        schema: String(bundle.sourceChain?.redactionAudit?.schema ?? "DataCenterLedger.PublicShareRedactionAudit.v4.2"),
        digest: auditDigest,
        role: "Public-field redaction review"
      },
      {
        label: "Approval packet",
        schema: String(bundle.sourceChain?.approval?.schema ?? "DataCenterLedger.PublicShareApproval.v4.3"),
        digest: approvalDigest,
        role: "Public-share approval gate"
      }
    ],
    safetyBoundary: RELEASE_MANIFEST_BOUNDARY,
    releaseNotice:
      "This release manifest references a public share bundle created from reviewed public-source records. It does not certify source truth, discover facilities, authorize sensitive publication, or make a complete national map."
  };

  return {
    ...manifestCore,
    manifestDigest: manifestDigest(manifestCore)
  };
}

function renderManifestGate(gate: PublicShareReleaseManifestGate | null) {
  if (!gate) return '<li>No release manifest built yet.</li>';
  return gate.messages.map((message) => `<li>${escapeManifest(message)}</li>`).join("");
}

function renderReleaseFiles(manifest: PublicShareReleaseManifest | null) {
  if (!manifest) return '<tr><td colspan="4">Build a release manifest to preview linked release files.</td></tr>';
  return manifest.releaseFiles
    .map(
      (file) => `
        <tr>
          <td>${escapeManifest(file.label)}</td>
          <td><code>${escapeManifest(file.schema)}</code></td>
          <td><code>${escapeManifest(file.digest || "missing")}</code></td>
          <td>${escapeManifest(file.role)}</td>
        </tr>
      `
    )
    .join("");
}

function mountPublicShareReleaseManifest() {
  if (document.querySelector("[data-v45-public-share-release-manifest]")) return;

  const panel = document.createElement("section");
  panel.className = "v45-public-share-release-manifest";
  panel.dataset.v45PublicShareReleaseManifest = "true";
  panel.innerHTML = `
    <div class="v45-shell">
      <div class="v45-header">
        <div>
          <p class="v45-kicker">v4.5 release manifest</p>
          <h2>Public Share Release Manifest</h2>
          <p>Wrap a v4.4 public share bundle in a top-level release manifest with release notes, source-chain digests, and public-safe boundary language.</p>
        </div>
        <span class="v45-schema">${PUBLIC_SHARE_RELEASE_MANIFEST_SCHEMA}</span>
      </div>

      <div class="v45-controls">
        <button type="button" data-v45-load-latest>Load latest v4.4 bundle</button>
        <label class="v45-file">
          Load bundle JSON
          <input type="file" accept="application/json,.json" data-v45-file />
        </label>
        <button type="button" data-v45-build>Build release manifest</button>
        <button type="button" data-v45-export disabled>Export release manifest</button>
        <button type="button" data-v45-clear>Clear</button>
      </div>

      <div class="v45-form-grid">
        <label>
          Release title
          <input type="text" data-v45-title value="DataCenterLedger Public Share Release" />
        </label>
        <label>
          Release version
          <input type="text" data-v45-version value="${PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION}" />
        </label>
        <label>
          Prepared by
          <input type="text" data-v45-prepared-by placeholder="Reviewer / organization" />
        </label>
        <label class="v45-notes">
          Release notes
          <textarea data-v45-notes placeholder="Briefly explain what this public share bundle contains and how it should be interpreted."></textarea>
        </label>
      </div>

      <textarea data-v45-input spellcheck="false" placeholder="Paste a DataCenterLedger.PublicShareBundle.v4.4 JSON packet here."></textarea>

      <div class="v45-summary" data-v45-summary>
        <div><strong>Bundle</strong><span>Not loaded</span></div>
        <div><strong>Gate</strong><span>Not built</span></div>
        <div><strong>Records</strong><span>0</span></div>
        <div><strong>States</strong><span>0</span></div>
      </div>

      <div class="v45-boundary">
        ${RELEASE_MANIFEST_BOUNDARY.map((item) => `<span>${escapeManifest(item)}</span>`).join("")}
      </div>

      <div class="v45-messages">
        <h3>Gate messages</h3>
        <ul data-v45-messages><li>No release manifest built yet.</li></ul>
      </div>

      <div class="v45-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Release file</th>
              <th>Schema</th>
              <th>Digest</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody data-v45-files>${renderReleaseFiles(null)}</tbody>
        </table>
      </div>
    </div>
  `;

  const main = document.querySelector("main") ?? document.body;
  main.appendChild(panel);

  const input = requireManifestElement<HTMLTextAreaElement>(panel, "[data-v45-input]");
  const fileInput = requireManifestElement<HTMLInputElement>(panel, "[data-v45-file]");
  const titleInput = requireManifestElement<HTMLInputElement>(panel, "[data-v45-title]");
  const versionInput = requireManifestElement<HTMLInputElement>(panel, "[data-v45-version]");
  const preparedByInput = requireManifestElement<HTMLInputElement>(panel, "[data-v45-prepared-by]");
  const notesInput = requireManifestElement<HTMLTextAreaElement>(panel, "[data-v45-notes]");
  const summary = requireManifestElement<HTMLDivElement>(panel, "[data-v45-summary]");
  const messages = requireManifestElement<HTMLUListElement>(panel, "[data-v45-messages]");
  const filesBody = requireManifestElement<HTMLTableSectionElement>(panel, "[data-v45-files]");
  const exportButton = requireManifestElement<HTMLButtonElement>(panel, "[data-v45-export]");

  let currentManifest: PublicShareReleaseManifest | null = null;

  function updateSummary(bundle: PublicShareBundle | null, manifest: PublicShareReleaseManifest | null) {
    const bundleStatus = bundle ? String(bundle.gate?.status ?? "unknown") : "Not loaded";
    const gateStatus = manifest ? manifest.gate.status : "Not built";
    const records = manifest?.publicSummary.publicRecords ?? bundle?.releaseSummary?.publicRecords ?? 0;
    const states = manifest?.publicSummary.statesRepresented ?? bundle?.releaseSummary?.statesRepresented ?? 0;

    summary.innerHTML = `
      <div><strong>Bundle</strong><span>${escapeManifest(bundleStatus)}</span></div>
      <div><strong>Gate</strong><span>${escapeManifest(gateStatus)}</span></div>
      <div><strong>Records</strong><span>${escapeManifest(records)}</span></div>
      <div><strong>States</strong><span>${escapeManifest(states)}</span></div>
    `;
  }

  function loadLatest() {
    input.value = latestStoredJson(PUBLIC_SHARE_BUNDLE_KEY_V44);
    currentManifest = null;
    exportButton.disabled = true;
    filesBody.innerHTML = renderReleaseFiles(null);
    messages.innerHTML = "<li>Loaded latest stored v4.4 bundle. Build a release manifest next.</li>";
    updateSummary(parsePublicShareBundle(input.value), null);
  }

  function build() {
    const bundle = parsePublicShareBundle(input.value);
    if (!bundle) {
      currentManifest = null;
      exportButton.disabled = true;
      filesBody.innerHTML = renderReleaseFiles(null);
      messages.innerHTML = "<li>Missing or invalid v4.4 public share bundle.</li>";
      updateSummary(null, null);
      return;
    }

    currentManifest = buildReleaseManifest(bundle, titleInput.value, versionInput.value, notesInput.value, preparedByInput.value);
    exportButton.disabled = !currentManifest.gate.canExport;
    localStorage.setItem(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45, JSON.stringify(currentManifest, null, 2));
    updateSummary(bundle, currentManifest);
    messages.innerHTML = renderManifestGate(currentManifest.gate);
    filesBody.innerHTML = renderReleaseFiles(currentManifest);
  }

  function clear() {
    input.value = "";
    titleInput.value = "DataCenterLedger Public Share Release";
    versionInput.value = PUBLIC_SHARE_RELEASE_MANIFEST_APP_VERSION;
    preparedByInput.value = "";
    notesInput.value = "";
    currentManifest = null;
    exportButton.disabled = true;
    localStorage.removeItem(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45);
    updateSummary(null, null);
    messages.innerHTML = "<li>No release manifest built yet.</li>";
    filesBody.innerHTML = renderReleaseFiles(null);
  }

  requireManifestElement<HTMLButtonElement>(panel, "[data-v45-load-latest]").addEventListener("click", loadLatest);
  requireManifestElement<HTMLButtonElement>(panel, "[data-v45-build]").addEventListener("click", build);
  requireManifestElement<HTMLButtonElement>(panel, "[data-v45-clear]").addEventListener("click", clear);
  exportButton.addEventListener("click", () => {
    if (!currentManifest) return;
    downloadManifestJson(`DataCenterLedger_PublicShareReleaseManifest_v4.5_${currentManifest.manifestDigest}.json`, currentManifest);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      input.value = String(reader.result ?? "");
      currentManifest = null;
      exportButton.disabled = true;
      filesBody.innerHTML = renderReleaseFiles(null);
      messages.innerHTML = "<li>Loaded bundle JSON file. Build a release manifest next.</li>";
      updateSummary(parsePublicShareBundle(input.value), null);
    };
    reader.readAsText(file);
  });

  updateSummary(null, null);
}

requestAnimationFrame(mountPublicShareReleaseManifest);
setTimeout(mountPublicShareReleaseManifest, 500);
