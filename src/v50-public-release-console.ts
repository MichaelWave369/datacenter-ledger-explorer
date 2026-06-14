export {};

const PUBLIC_SHARE_PACKET_KEY_V41 = "datacenter-ledger.public-share-packet.v4.1";
const PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42 = "datacenter-ledger.public-share-redaction-audit.v4.2";
const PUBLIC_SHARE_APPROVAL_KEY_V43 = "datacenter-ledger.public-share-approval.v4.3";
const PUBLIC_SHARE_BUNDLE_KEY_V44 = "datacenter-ledger.public-share-bundle.v4.4";
const PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45 = "datacenter-ledger.public-share-release-manifest.v4.5";
const PUBLIC_RELEASE_INDEX_KEY_V46 = "datacenter-ledger.public-release-index.v4.6";
const PUBLIC_RELEASE_COMPARE_KEY_V47 = "datacenter-ledger.public-release-compare.v4.7";
const PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48 = "datacenter-ledger.public-release-restore-handoff.v4.8";
const PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49 = "datacenter-ledger.public-release-integrity-seal.v4.9";
const PUBLIC_RELEASE_CONSOLE_KEY_V50 = "datacenter-ledger.public-release-console.v5.0";
const PUBLIC_RELEASE_CONSOLE_APP_VERSION = "5.0.0" as const;
const PUBLIC_RELEASE_CONSOLE_SCHEMA = "DataCenterLedger.PublicReleaseConsole.v5.0" as const;

const PUBLIC_RELEASE_CONSOLE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "The console summarizes local public release artifacts only; it does not certify source truth.",
  "The console is a release workflow dashboard, not a complete national map or publication authorization."
];

type ConsoleStatus = "ready" | "review" | "blocked" | "missing";

type ConsoleArtifact = {
  step: string;
  label: string;
  schema: string;
  storageKey: string;
  present: boolean;
  status: ConsoleStatus;
  digest: string;
  detail: string;
};

type PublicReleaseConsoleSnapshot = {
  schema: typeof PUBLIC_RELEASE_CONSOLE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_RELEASE_CONSOLE_APP_VERSION;
  release: {
    title: string;
    releaseVersion: string;
    manifestDigest: string;
    sealDigest: string;
  };
  summary: {
    overallStatus: ConsoleStatus;
    presentCount: number;
    missingCount: number;
    readyCount: number;
    reviewCount: number;
    blockedCount: number;
  };
  chain: ConsoleArtifact[];
  safetyBoundary: string[];
  consoleNotice: string;
  consoleDigest: string;
};

function escapeConsole(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function consoleDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireConsoleElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v5.0 public release console control: ${selector}`);
  return element;
}

function parseArtifact(key: string): Record<string, unknown> | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function textAt(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return "";
    current = (current as Record<string, unknown>)[part];
  }
  return String(current ?? "").trim();
}

function booleanAt(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return false;
    current = (current as Record<string, unknown>)[part];
  }
  return current === true;
}

function numberAt(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return 0;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

function digestFrom(source: Record<string, unknown> | null, paths: string[][]) {
  for (const path of paths) {
    const digest = textAt(source, path);
    if (digest) return digest;
  }
  return "";
}

function statusFromArtifact(step: string, source: Record<string, unknown> | null): ConsoleStatus {
  if (!source) return "missing";

  switch (step) {
    case "v4.1":
      return digestFrom(source, [["shareDigest"]]) ? "ready" : "review";
    case "v4.2": {
      const auditStatus = textAt(source, ["status"]);
      if (auditStatus === "blocked") return "blocked";
      if (auditStatus === "review") return "review";
      return auditStatus === "clear" ? "ready" : "review";
    }
    case "v4.3": {
      const gateStatus = textAt(source, ["gate", "status"]);
      if (gateStatus === "blocked" || gateStatus === "missing_inputs" || gateStatus === "digest_mismatch") return "blocked";
      if (gateStatus === "review_accepted") return "review";
      return gateStatus === "approved" || booleanAt(source, ["gate", "canExport"]) ? "ready" : "review";
    }
    case "v4.4": {
      const status = textAt(source, ["bundleStatus"]);
      if (status === "blocked") return "blocked";
      if (status === "review_bundle") return "review";
      return status === "export_ready" ? "ready" : "review";
    }
    case "v4.5": {
      const gateStatus = textAt(source, ["gate", "status"]);
      if (gateStatus === "blocked" || gateStatus === "missing_bundle") return "blocked";
      if (gateStatus === "review_release") return "review";
      return gateStatus === "release_ready" || booleanAt(source, ["gate", "canExport"]) ? "ready" : "review";
    }
    case "v4.6":
      return numberAt(source, ["indexedCount"]) > 0 ? "ready" : "review";
    case "v4.7": {
      const status = textAt(source, ["summary", "status"]);
      if (status === "review") return "review";
      return status === "same" || status === "changed" ? "ready" : "review";
    }
    case "v4.8":
      return digestFrom(source, [["handoffDigest"]]) ? "ready" : "review";
    case "v4.9": {
      const sealStatus = textAt(source, ["status"]);
      if (sealStatus === "blocked" || sealStatus === "missing_artifacts") return "blocked";
      if (sealStatus === "review") return "review";
      return sealStatus === "sealed" ? "ready" : "review";
    }
    default:
      return "review";
  }
}

function detailFromArtifact(step: string, source: Record<string, unknown> | null) {
  if (!source) return "Missing local artifact.";

  switch (step) {
    case "v4.1":
      return `Public records: ${numberAt(source, ["publicSummary", "publicRecords"])} · States: ${numberAt(source, ["publicSummary", "statesRepresented"])}`;
    case "v4.2":
      return `Audit status: ${textAt(source, ["status"]) || "unknown"} · Findings: ${numberAt(source, ["summary", "findingCount"])}`;
    case "v4.3":
      return `Approval gate: ${textAt(source, ["gate", "status"]) || "unknown"}`;
    case "v4.4":
      return `Bundle status: ${textAt(source, ["bundleStatus"]) || "unknown"}`;
    case "v4.5":
      return `Release gate: ${textAt(source, ["gate", "status"]) || "unknown"}`;
    case "v4.6":
      return `Indexed releases: ${numberAt(source, ["indexedCount"])}`;
    case "v4.7":
      return `Compare status: ${textAt(source, ["summary", "status"]) || "unknown"}`;
    case "v4.8":
      return `Restore mode: ${textAt(source, ["restoreMode"]) || "unknown"}`;
    case "v4.9":
      return `Seal status: ${textAt(source, ["status"]) || "unknown"}`;
    default:
      return "Local artifact loaded.";
  }
}

function buildConsoleArtifact(step: string, label: string, schema: string, storageKey: string, source: Record<string, unknown> | null): ConsoleArtifact {
  return {
    step,
    label,
    schema,
    storageKey,
    present: Boolean(source),
    status: statusFromArtifact(step, source),
    digest: digestFrom(source, [
      ["shareDigest"],
      ["auditDigest"],
      ["approvalDigest"],
      ["bundleDigest"],
      ["manifestDigest"],
      ["indexDigest"],
      ["compareDigest"],
      ["handoffDigest"],
      ["sealDigest"]
    ]),
    detail: detailFromArtifact(step, source)
  };
}

function buildConsoleSnapshot(): PublicReleaseConsoleSnapshot {
  const share = parseArtifact(PUBLIC_SHARE_PACKET_KEY_V41);
  const audit = parseArtifact(PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42);
  const approval = parseArtifact(PUBLIC_SHARE_APPROVAL_KEY_V43);
  const bundle = parseArtifact(PUBLIC_SHARE_BUNDLE_KEY_V44);
  const manifest = parseArtifact(PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45);
  const index = parseArtifact(PUBLIC_RELEASE_INDEX_KEY_V46);
  const compare = parseArtifact(PUBLIC_RELEASE_COMPARE_KEY_V47);
  const restore = parseArtifact(PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48);
  const seal = parseArtifact(PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49);

  const chain = [
    buildConsoleArtifact("v4.1", "Public share packet", "DataCenterLedger.PublicSharePacket.v4.1", PUBLIC_SHARE_PACKET_KEY_V41, share),
    buildConsoleArtifact("v4.2", "Redaction audit", "DataCenterLedger.PublicShareRedactionAudit.v4.2", PUBLIC_SHARE_REDACTION_AUDIT_KEY_V42, audit),
    buildConsoleArtifact("v4.3", "Share approval", "DataCenterLedger.PublicShareApproval.v4.3", PUBLIC_SHARE_APPROVAL_KEY_V43, approval),
    buildConsoleArtifact("v4.4", "Share bundle", "DataCenterLedger.PublicShareBundle.v4.4", PUBLIC_SHARE_BUNDLE_KEY_V44, bundle),
    buildConsoleArtifact("v4.5", "Release manifest", "DataCenterLedger.PublicShareReleaseManifest.v4.5", PUBLIC_SHARE_RELEASE_MANIFEST_KEY_V45, manifest),
    buildConsoleArtifact("v4.6", "Release index", "DataCenterLedger.PublicReleaseIndex.v4.6", PUBLIC_RELEASE_INDEX_KEY_V46, index),
    buildConsoleArtifact("v4.7", "Release compare", "DataCenterLedger.PublicReleaseCompare.v4.7", PUBLIC_RELEASE_COMPARE_KEY_V47, compare),
    buildConsoleArtifact("v4.8", "Restore handoff", "DataCenterLedger.PublicReleaseRestoreHandoff.v4.8", PUBLIC_RELEASE_RESTORE_HANDOFF_KEY_V48, restore),
    buildConsoleArtifact("v4.9", "Integrity seal", "DataCenterLedger.PublicReleaseIntegritySeal.v4.9", PUBLIC_RELEASE_INTEGRITY_SEAL_KEY_V49, seal)
  ];

  const presentCount = chain.filter((item) => item.present).length;
  const missingCount = chain.filter((item) => item.status === "missing").length;
  const readyCount = chain.filter((item) => item.status === "ready").length;
  const reviewCount = chain.filter((item) => item.status === "review").length;
  const blockedCount = chain.filter((item) => item.status === "blocked").length;
  const overallStatus: ConsoleStatus = blockedCount > 0 ? "blocked" : missingCount > 0 || reviewCount > 0 ? "review" : "ready";

  const snapshotCore: Omit<PublicReleaseConsoleSnapshot, "consoleDigest"> = {
    schema: PUBLIC_RELEASE_CONSOLE_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_RELEASE_CONSOLE_APP_VERSION,
    release: {
      title: textAt(manifest, ["release", "title"]) || textAt(seal, ["release", "title"]) || "Untitled public release",
      releaseVersion: textAt(manifest, ["release", "releaseVersion"]) || textAt(seal, ["release", "releaseVersion"]) || "unknown",
      manifestDigest: textAt(manifest, ["manifestDigest"]) || textAt(seal, ["release", "manifestDigest"]),
      sealDigest: textAt(seal, ["sealDigest"])
    },
    summary: {
      overallStatus,
      presentCount,
      missingCount,
      readyCount,
      reviewCount,
      blockedCount
    },
    chain,
    safetyBoundary: PUBLIC_RELEASE_CONSOLE_BOUNDARY,
    consoleNotice:
      "This public release console summarizes local public release artifacts only. It does not certify source truth, discover facilities, enrich locations, authorize publication, or create a complete national map."
  };

  return {
    ...snapshotCore,
    consoleDigest: consoleDigest("public-release-console", snapshotCore)
  };
}

function downloadConsoleJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderConsoleSummary(snapshot: PublicReleaseConsoleSnapshot | null) {
  if (!snapshot) {
    return `
      <div class="v50-console-card"><span>Status</span><strong>Not refreshed</strong></div>
      <div class="v50-console-card"><span>Present</span><strong>0 / 9</strong></div>
      <div class="v50-console-card"><span>Review</span><strong>0</strong></div>
      <div class="v50-console-card"><span>Digest</span><strong>—</strong></div>
    `;
  }

  return `
    <div class="v50-console-card"><span>Status</span><strong>${escapeConsole(snapshot.summary.overallStatus)}</strong></div>
    <div class="v50-console-card"><span>Present</span><strong>${snapshot.summary.presentCount} / ${snapshot.chain.length}</strong></div>
    <div class="v50-console-card"><span>Review / blocked</span><strong>${snapshot.summary.reviewCount} / ${snapshot.summary.blockedCount}</strong></div>
    <div class="v50-console-card"><span>Digest</span><strong>${escapeConsole(snapshot.consoleDigest)}</strong></div>
  `;
}

function renderConsoleRows(snapshot: PublicReleaseConsoleSnapshot | null) {
  if (!snapshot) return '<tr><td colspan="6">Refresh the console to load the public release chain.</td></tr>';

  return snapshot.chain
    .map(
      (item) => `
        <tr data-status="${escapeConsole(item.status)}">
          <td><strong>${escapeConsole(item.step)}</strong></td>
          <td>${escapeConsole(item.label)}</td>
          <td>${escapeConsole(item.status)}</td>
          <td>${item.present ? "yes" : "no"}</td>
          <td><code>${escapeConsole(item.digest || "—")}</code></td>
          <td>${escapeConsole(item.detail)}</td>
        </tr>
      `
    )
    .join("");
}

function mountPublicReleaseConsole() {
  if (document.querySelector("[data-v50-public-release-console]")) return;

  const panel = document.createElement("section");
  panel.className = "v50-public-release-console";
  panel.dataset.v50PublicReleaseConsole = "true";
  panel.innerHTML = `
    <div class="v50-console-header">
      <div>
        <p class="v50-console-kicker">v5.0 Public Release Console</p>
        <h2>Public Release Console</h2>
        <p>One dashboard for the v4.1–v4.9 public release chain: share packet, redaction audit, approval, bundle, manifest, index, compare report, restore handoff, and integrity seal.</p>
      </div>
      <span class="v50-console-badge">DataCenterLedger.PublicReleaseConsole.v5.0</span>
    </div>

    <div class="v50-console-boundary" data-v50-boundary></div>

    <div class="v50-console-controls">
      <button type="button" data-v50-refresh>Refresh console</button>
      <button type="button" data-v50-export disabled>Export console snapshot</button>
      <button type="button" data-v50-clear>Clear console snapshot</button>
    </div>

    <div class="v50-console-summary" data-v50-summary></div>
    <div class="v50-console-meta" data-v50-meta>Refresh the console to summarize local public release artifacts.</div>

    <div class="v50-console-release" data-v50-release></div>

    <div class="v50-console-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Artifact</th>
            <th>Status</th>
            <th>Present</th>
            <th>Digest</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody data-v50-rows></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(panel);

  const boundary = requireConsoleElement<HTMLDivElement>(panel, "[data-v50-boundary]");
  const refreshButton = requireConsoleElement<HTMLButtonElement>(panel, "[data-v50-refresh]");
  const exportButton = requireConsoleElement<HTMLButtonElement>(panel, "[data-v50-export]");
  const clearButton = requireConsoleElement<HTMLButtonElement>(panel, "[data-v50-clear]");
  const summary = requireConsoleElement<HTMLDivElement>(panel, "[data-v50-summary]");
  const meta = requireConsoleElement<HTMLDivElement>(panel, "[data-v50-meta]");
  const release = requireConsoleElement<HTMLDivElement>(panel, "[data-v50-release]");
  const rows = requireConsoleElement<HTMLTableSectionElement>(panel, "[data-v50-rows]");

  let currentSnapshot: PublicReleaseConsoleSnapshot | null = null;

  function renderBoundary() {
    boundary.innerHTML = PUBLIC_RELEASE_CONSOLE_BOUNDARY.map((line) => `<span>${escapeConsole(line)}</span>`).join("");
  }

  function render() {
    summary.innerHTML = renderConsoleSummary(currentSnapshot);
    rows.innerHTML = renderConsoleRows(currentSnapshot);
    release.innerHTML = currentSnapshot
      ? `<strong>${escapeConsole(currentSnapshot.release.title)}</strong><span>${escapeConsole(currentSnapshot.release.releaseVersion)} · ${escapeConsole(currentSnapshot.release.manifestDigest || "no manifest digest")}</span>`
      : "No console snapshot built yet.";
    exportButton.disabled = !currentSnapshot;
  }

  refreshButton.addEventListener("click", () => {
    currentSnapshot = buildConsoleSnapshot();
    localStorage.setItem(PUBLIC_RELEASE_CONSOLE_KEY_V50, JSON.stringify(currentSnapshot, null, 2));
    meta.textContent = `Console refreshed. Overall status: ${currentSnapshot.summary.overallStatus}.`;
    render();
  });

  exportButton.addEventListener("click", () => {
    if (!currentSnapshot) return;
    downloadConsoleJson(`DataCenterLedger_PublicReleaseConsole_v5_0_${currentSnapshot.consoleDigest}.json`, currentSnapshot);
  });

  clearButton.addEventListener("click", () => {
    currentSnapshot = null;
    localStorage.removeItem(PUBLIC_RELEASE_CONSOLE_KEY_V50);
    meta.textContent = "Console snapshot cleared.";
    render();
  });

  renderBoundary();
  render();
}

setTimeout(mountPublicReleaseConsole, 0);
setTimeout(mountPublicReleaseConsole, 500);
