export {};

const PUBLIC_CONSOLE_QUICK_ACTIONS_KEY_V51 = "datacenter-ledger.public-console-quick-actions.v5.1";
const PUBLIC_CONSOLE_QUICK_ACTIONS_APP_VERSION = "5.1.0" as const;
const PUBLIC_CONSOLE_QUICK_ACTIONS_SCHEMA = "DataCenterLedger.PublicConsoleQuickActions.v5.1" as const;

const QUICK_ACTION_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Quick actions operate on local browser artifacts only; they do not certify source truth.",
  "Quick actions help navigation and export, but they do not authorize publication or create a complete national map."
];

type QuickActionStatus = "ready" | "review" | "blocked" | "missing";

type QuickActionArtifact = {
  step: string;
  label: string;
  schema: string;
  storageKey: string;
  panelSelectors: string[];
  present: boolean;
  status: QuickActionStatus;
  digest: string;
  exportFilenamePrefix: string;
  detail: string;
};

type PublicConsoleQuickActionsSnapshot = {
  schema: typeof PUBLIC_CONSOLE_QUICK_ACTIONS_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_CONSOLE_QUICK_ACTIONS_APP_VERSION;
  summary: {
    actionCount: number;
    presentCount: number;
    missingCount: number;
    readyCount: number;
    reviewCount: number;
    blockedCount: number;
    jumpTargetsFound: number;
  };
  artifacts: QuickActionArtifact[];
  safetyBoundary: string[];
  quickActionNotice: string;
  quickActionDigest: string;
};

const QUICK_ARTIFACTS: Array<Omit<QuickActionArtifact, "present" | "status" | "digest" | "detail">> = [
  {
    step: "v4.1",
    label: "Public share packet",
    schema: "DataCenterLedger.PublicSharePacket.v4.1",
    storageKey: "datacenter-ledger.public-share-packet.v4.1",
    panelSelectors: ["#final-layer-public-share-v41", ".public-share-panel"],
    exportFilenamePrefix: "DataCenterLedger_PublicSharePacket_v4_1"
  },
  {
    step: "v4.2",
    label: "Redaction audit",
    schema: "DataCenterLedger.PublicShareRedactionAudit.v4.2",
    storageKey: "datacenter-ledger.public-share-redaction-audit.v4.2",
    panelSelectors: ["#public-share-redaction-audit-v42", ".redaction-audit-panel"],
    exportFilenamePrefix: "DataCenterLedger_PublicShareRedactionAudit_v4_2"
  },
  {
    step: "v4.3",
    label: "Share approval",
    schema: "DataCenterLedger.PublicShareApproval.v4.3",
    storageKey: "datacenter-ledger.public-share-approval.v4.3",
    panelSelectors: ["[data-v43-public-share-approval-gate]", ".v43-public-share-approval-gate", ".v43-public-share-approval"],
    exportFilenamePrefix: "DataCenterLedger_PublicShareApproval_v4_3"
  },
  {
    step: "v4.4",
    label: "Share bundle",
    schema: "DataCenterLedger.PublicShareBundle.v4.4",
    storageKey: "datacenter-ledger.public-share-bundle.v4.4",
    panelSelectors: ["[data-v44-public-share-bundle]", ".v44-public-share-bundle-exporter", ".v44-public-share-bundle"],
    exportFilenamePrefix: "DataCenterLedger_PublicShareBundle_v4_4"
  },
  {
    step: "v4.5",
    label: "Release manifest",
    schema: "DataCenterLedger.PublicShareReleaseManifest.v4.5",
    storageKey: "datacenter-ledger.public-share-release-manifest.v4.5",
    panelSelectors: ["[data-v45-public-share-release-manifest]", ".v45-public-share-release-manifest"],
    exportFilenamePrefix: "DataCenterLedger_PublicShareReleaseManifest_v4_5"
  },
  {
    step: "v4.6",
    label: "Release index",
    schema: "DataCenterLedger.PublicReleaseIndex.v4.6",
    storageKey: "datacenter-ledger.public-release-index.v4.6",
    panelSelectors: ["[data-v46-public-release-index]", ".v46-public-release-index"],
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseIndex_v4_6"
  },
  {
    step: "v4.7",
    label: "Release compare",
    schema: "DataCenterLedger.PublicReleaseCompare.v4.7",
    storageKey: "datacenter-ledger.public-release-compare.v4.7",
    panelSelectors: ["[data-v47-public-release-compare]", ".v47-public-release-compare"],
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseCompare_v4_7"
  },
  {
    step: "v4.8",
    label: "Restore handoff",
    schema: "DataCenterLedger.PublicReleaseRestoreHandoff.v4.8",
    storageKey: "datacenter-ledger.public-release-restore-handoff.v4.8",
    panelSelectors: ["[data-v48-public-release-restore-handoff]", ".v48-public-release-restore-handoff"],
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseRestoreHandoff_v4_8"
  },
  {
    step: "v4.9",
    label: "Integrity seal",
    schema: "DataCenterLedger.PublicReleaseIntegritySeal.v4.9",
    storageKey: "datacenter-ledger.public-release-integrity-seal.v4.9",
    panelSelectors: ["[data-v49-public-release-integrity-seal]", ".v49-public-release-integrity-seal"],
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseIntegritySeal_v4_9"
  },
  {
    step: "v5.0",
    label: "Public release console",
    schema: "DataCenterLedger.PublicReleaseConsole.v5.0",
    storageKey: "datacenter-ledger.public-release-console.v5.0",
    panelSelectors: ["[data-v50-public-release-console]", ".v50-public-release-console"],
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseConsole_v5_0"
  }
];

function escapeQuickAction(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function quickActionDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireQuickActionElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v5.1 public console quick action control: ${selector}`);
  return element;
}

function parseLocalArtifact(storageKey: string): Record<string, unknown> | null {
  const raw = localStorage.getItem(storageKey);
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

function numberAt(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return 0;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

function digestFrom(source: Record<string, unknown> | null) {
  const paths = [
    ["shareDigest"],
    ["auditDigest"],
    ["approvalDigest"],
    ["bundleDigest"],
    ["manifestDigest"],
    ["indexDigest"],
    ["compareDigest"],
    ["handoffDigest"],
    ["sealDigest"],
    ["consoleDigest"]
  ];

  for (const path of paths) {
    const digest = textAt(source, path);
    if (digest) return digest;
  }
  return "";
}

function statusFor(step: string, source: Record<string, unknown> | null): QuickActionStatus {
  if (!source) return "missing";
  switch (step) {
    case "v4.2": {
      const status = textAt(source, ["status"]);
      if (status === "blocked") return "blocked";
      return status === "review" ? "review" : "ready";
    }
    case "v4.3": {
      const gateStatus = textAt(source, ["gate", "status"]);
      if (["blocked", "missing_inputs", "digest_mismatch"].includes(gateStatus)) return "blocked";
      return gateStatus === "review_accepted" ? "review" : "ready";
    }
    case "v4.4": {
      const status = textAt(source, ["bundleStatus"]);
      if (status === "blocked") return "blocked";
      return status === "review_bundle" ? "review" : "ready";
    }
    case "v4.5": {
      const status = textAt(source, ["gate", "status"]);
      if (["blocked", "missing_bundle"].includes(status)) return "blocked";
      return status === "review_release" ? "review" : "ready";
    }
    case "v4.7":
      return textAt(source, ["summary", "status"]) === "review" ? "review" : "ready";
    case "v4.9": {
      const status = textAt(source, ["status"]);
      if (["blocked", "missing_artifacts"].includes(status)) return "blocked";
      return status === "review" ? "review" : "ready";
    }
    case "v5.0": {
      const status = textAt(source, ["summary", "overallStatus"]);
      if (status === "blocked") return "blocked";
      return status === "review" ? "review" : "ready";
    }
    default:
      return "ready";
  }
}

function detailFor(step: string, source: Record<string, unknown> | null) {
  if (!source) return "Missing local artifact.";
  switch (step) {
    case "v4.1":
      return `Public records: ${numberAt(source, ["publicSummary", "publicRecords"])} · States: ${numberAt(source, ["publicSummary", "statesRepresented"])}`;
    case "v4.2":
      return `Audit status: ${textAt(source, ["status"]) || "unknown"}`;
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
    case "v5.0":
      return `Console status: ${textAt(source, ["summary", "overallStatus"]) || "unknown"}`;
    default:
      return "Local artifact loaded.";
  }
}

function findPanel(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return null;
}

function buildQuickActionArtifact(item: Omit<QuickActionArtifact, "present" | "status" | "digest" | "detail">): QuickActionArtifact {
  const artifact = parseLocalArtifact(item.storageKey);
  return {
    ...item,
    present: Boolean(artifact),
    status: statusFor(item.step, artifact),
    digest: digestFrom(artifact),
    detail: detailFor(item.step, artifact)
  };
}

function buildQuickActionSnapshot(): PublicConsoleQuickActionsSnapshot {
  const artifacts = QUICK_ARTIFACTS.map(buildQuickActionArtifact);
  const presentCount = artifacts.filter((artifact) => artifact.present).length;
  const missingCount = artifacts.filter((artifact) => artifact.status === "missing").length;
  const readyCount = artifacts.filter((artifact) => artifact.status === "ready").length;
  const reviewCount = artifacts.filter((artifact) => artifact.status === "review").length;
  const blockedCount = artifacts.filter((artifact) => artifact.status === "blocked").length;
  const jumpTargetsFound = artifacts.filter((artifact) => Boolean(findPanel(artifact.panelSelectors))).length;

  const snapshotCore: Omit<PublicConsoleQuickActionsSnapshot, "quickActionDigest"> = {
    schema: PUBLIC_CONSOLE_QUICK_ACTIONS_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_CONSOLE_QUICK_ACTIONS_APP_VERSION,
    summary: {
      actionCount: artifacts.length,
      presentCount,
      missingCount,
      readyCount,
      reviewCount,
      blockedCount,
      jumpTargetsFound
    },
    artifacts,
    safetyBoundary: QUICK_ACTION_BOUNDARY,
    quickActionNotice:
      "This quick-action snapshot summarizes local navigation and export shortcuts for public release artifacts. It does not certify source truth, discover facilities, enrich locations, authorize publication, or create a complete national map."
  };

  return {
    ...snapshotCore,
    quickActionDigest: quickActionDigest("public-console-quick-actions", snapshotCore)
  };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportLocalArtifact(artifact: QuickActionArtifact) {
  const raw = localStorage.getItem(artifact.storageKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    downloadJson(`${artifact.exportFilenamePrefix}_${artifact.digest || "local"}.json`, parsed);
    return true;
  } catch {
    return false;
  }
}

function renderSummary(snapshot: PublicConsoleQuickActionsSnapshot | null) {
  if (!snapshot) {
    return `
      <div class="v51-action-card"><span>Status</span><strong>Not refreshed</strong></div>
      <div class="v51-action-card"><span>Artifacts</span><strong>0 / ${QUICK_ARTIFACTS.length}</strong></div>
      <div class="v51-action-card"><span>Jump targets</span><strong>0</strong></div>
      <div class="v51-action-card"><span>Digest</span><strong>—</strong></div>
    `;
  }
  return `
    <div class="v51-action-card"><span>Status</span><strong>${snapshot.summary.blockedCount > 0 ? "blocked" : snapshot.summary.reviewCount > 0 || snapshot.summary.missingCount > 0 ? "review" : "ready"}</strong></div>
    <div class="v51-action-card"><span>Artifacts</span><strong>${snapshot.summary.presentCount} / ${snapshot.summary.actionCount}</strong></div>
    <div class="v51-action-card"><span>Jump targets</span><strong>${snapshot.summary.jumpTargetsFound}</strong></div>
    <div class="v51-action-card"><span>Digest</span><strong>${escapeQuickAction(snapshot.quickActionDigest)}</strong></div>
  `;
}

function renderRows(snapshot: PublicConsoleQuickActionsSnapshot | null) {
  const artifacts = snapshot?.artifacts ?? QUICK_ARTIFACTS.map(buildQuickActionArtifact);
  return artifacts
    .map(
      (artifact) => `
        <tr data-status="${escapeQuickAction(artifact.status)}">
          <td><strong>${escapeQuickAction(artifact.step)}</strong><br /><small>${escapeQuickAction(artifact.label)}</small></td>
          <td>${escapeQuickAction(artifact.status)}</td>
          <td>${artifact.present ? "yes" : "no"}</td>
          <td><code>${escapeQuickAction(artifact.digest || "—")}</code></td>
          <td>${escapeQuickAction(artifact.detail)}</td>
          <td class="v51-action-buttons">
            <button type="button" data-v51-jump="${escapeQuickAction(artifact.step)}">Jump</button>
            <button type="button" data-v51-export="${escapeQuickAction(artifact.step)}" ${artifact.present ? "" : "disabled"}>Export</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function mountPublicConsoleQuickActions() {
  if (document.querySelector("[data-v51-public-console-quick-actions]")) return;

  const panel = document.createElement("section");
  panel.className = "v51-public-console-quick-actions";
  panel.dataset.v51PublicConsoleQuickActions = "true";
  panel.innerHTML = `
    <div class="v51-action-header">
      <div>
        <p class="v51-action-kicker">v5.1 Public Console Quick Actions</p>
        <h2>Public Console Quick Actions</h2>
        <p>Operate the public release cockpit faster: refresh the console, jump to panels, export local artifacts, and export a quick-action snapshot without scrolling through the whole page.</p>
      </div>
      <span class="v51-action-badge">DataCenterLedger.PublicConsoleQuickActions.v5.1</span>
    </div>

    <div class="v51-action-boundary" data-v51-boundary></div>

    <div class="v51-action-controls">
      <button type="button" data-v51-refresh>Refresh quick actions</button>
      <button type="button" data-v51-refresh-console>Refresh v5.0 console</button>
      <button type="button" data-v51-export-snapshot disabled>Export quick-action snapshot</button>
      <button type="button" data-v51-clear>Clear snapshot</button>
    </div>

    <div class="v51-action-summary" data-v51-summary></div>
    <div class="v51-action-meta" data-v51-meta>Refresh quick actions to inspect local public release artifacts.</div>

    <div class="v51-action-table-wrap">
      <table>
        <thead>
          <tr><th>Step</th><th>Status</th><th>Present</th><th>Digest</th><th>Detail</th><th>Actions</th></tr>
        </thead>
        <tbody data-v51-rows></tbody>
      </table>
    </div>
  `;

  const anchor = document.querySelector("[data-v50-public-release-console]") ?? document.getElementById("root");
  if (anchor) anchor.insertAdjacentElement("afterend", panel);
  else document.body.appendChild(panel);

  const boundary = requireQuickActionElement<HTMLDivElement>(panel, "[data-v51-boundary]");
  const refreshButton = requireQuickActionElement<HTMLButtonElement>(panel, "[data-v51-refresh]");
  const refreshConsoleButton = requireQuickActionElement<HTMLButtonElement>(panel, "[data-v51-refresh-console]");
  const exportSnapshotButton = requireQuickActionElement<HTMLButtonElement>(panel, "[data-v51-export-snapshot]");
  const clearButton = requireQuickActionElement<HTMLButtonElement>(panel, "[data-v51-clear]");
  const summary = requireQuickActionElement<HTMLDivElement>(panel, "[data-v51-summary]");
  const meta = requireQuickActionElement<HTMLDivElement>(panel, "[data-v51-meta]");
  const rows = requireQuickActionElement<HTMLTableSectionElement>(panel, "[data-v51-rows]");

  let currentSnapshot: PublicConsoleQuickActionsSnapshot | null = null;

  function render() {
    boundary.innerHTML = QUICK_ACTION_BOUNDARY.map((line) => `<span>${escapeQuickAction(line)}</span>`).join("");
    summary.innerHTML = renderSummary(currentSnapshot);
    rows.innerHTML = renderRows(currentSnapshot);
    exportSnapshotButton.disabled = !currentSnapshot;
  }

  refreshButton.addEventListener("click", () => {
    currentSnapshot = buildQuickActionSnapshot();
    localStorage.setItem(PUBLIC_CONSOLE_QUICK_ACTIONS_KEY_V51, JSON.stringify(currentSnapshot, null, 2));
    meta.textContent = `Quick actions refreshed. ${currentSnapshot.summary.presentCount} local artifacts are present.`;
    render();
  });

  refreshConsoleButton.addEventListener("click", () => {
    const consoleRefresh = document.querySelector<HTMLButtonElement>("[data-v50-refresh]");
    if (consoleRefresh) {
      consoleRefresh.click();
      meta.textContent = "Triggered v5.0 console refresh.";
    } else {
      meta.textContent = "v5.0 console refresh button was not found yet.";
    }
  });

  exportSnapshotButton.addEventListener("click", () => {
    if (!currentSnapshot) return;
    downloadJson(`DataCenterLedger_PublicConsoleQuickActions_v5_1_${currentSnapshot.quickActionDigest}.json`, currentSnapshot);
  });

  clearButton.addEventListener("click", () => {
    currentSnapshot = null;
    localStorage.removeItem(PUBLIC_CONSOLE_QUICK_ACTIONS_KEY_V51);
    meta.textContent = "Quick-action snapshot cleared.";
    render();
  });

  rows.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const jumpButton = target.closest<HTMLButtonElement>("[data-v51-jump]");
    if (jumpButton) {
      const artifact = (currentSnapshot?.artifacts ?? QUICK_ARTIFACTS.map(buildQuickActionArtifact)).find((item) => item.step === jumpButton.dataset.v51Jump);
      const targetPanel = artifact ? findPanel(artifact.panelSelectors) : null;
      if (targetPanel) {
        targetPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        meta.textContent = `Jumped to ${artifact?.label ?? "selected panel"}.`;
      } else {
        meta.textContent = `No mounted panel found for ${artifact?.label ?? "selected artifact"}.`;
      }
      return;
    }

    const exportButton = target.closest<HTMLButtonElement>("[data-v51-export]");
    if (exportButton) {
      const artifact = (currentSnapshot?.artifacts ?? QUICK_ARTIFACTS.map(buildQuickActionArtifact)).find((item) => item.step === exportButton.dataset.v51Export);
      if (artifact && exportLocalArtifact(artifact)) {
        meta.textContent = `Exported ${artifact.label}.`;
      } else {
        meta.textContent = `Could not export ${artifact?.label ?? "selected artifact"}; local JSON was not available.`;
      }
    }
  });

  render();
}

setTimeout(mountPublicConsoleQuickActions, 0);
setTimeout(mountPublicConsoleQuickActions, 500);
