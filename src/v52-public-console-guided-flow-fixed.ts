export {};

const PUBLIC_CONSOLE_GUIDED_FLOW_KEY_V52 = "datacenter-ledger.public-console-guided-flow.v5.2";
const PUBLIC_CONSOLE_GUIDED_FLOW_APP_VERSION = "5.2.0" as const;
const PUBLIC_CONSOLE_GUIDED_FLOW_SCHEMA = "DataCenterLedger.PublicConsoleGuidedFlow.v5.2" as const;

const GUIDED_FLOW_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Guided flow reads local public-release artifacts only; it does not certify source truth.",
  "Guided flow suggests operator next steps; it does not authorize publication or create a complete national map."
];

type GuidedStatus = "ready" | "review" | "blocked" | "missing";
type GuidedPriority = "next" | "soon" | "complete" | "blocked";

type GuidedArtifactDefinition = {
  step: string;
  label: string;
  schema: string;
  storageKey: string;
  panelSelectors: string[];
  operatorAction: string;
  exportFilenamePrefix: string;
};

type GuidedArtifactStep = GuidedArtifactDefinition & {
  present: boolean;
  status: GuidedStatus;
  priority: GuidedPriority;
  digest: string;
  detail: string;
  nextInstruction: string;
  panelFound: boolean;
};

type PublicConsoleGuidedFlow = {
  schema: typeof PUBLIC_CONSOLE_GUIDED_FLOW_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_CONSOLE_GUIDED_FLOW_APP_VERSION;
  summary: {
    overallStatus: GuidedStatus;
    totalSteps: number;
    readyCount: number;
    reviewCount: number;
    blockedCount: number;
    missingCount: number;
    panelTargetsFound: number;
    recommendedStep: string;
    recommendedInstruction: string;
  };
  steps: GuidedArtifactStep[];
  safetyBoundary: string[];
  guidedFlowNotice: string;
  guidedFlowDigest: string;
};

const GUIDED_ARTIFACTS: GuidedArtifactDefinition[] = [
  {
    step: "v4.1",
    label: "Public share packet",
    schema: "DataCenterLedger.PublicSharePacket.v4.1",
    storageKey: "datacenter-ledger.public-share-packet.v4.1",
    panelSelectors: ["#final-layer-public-share-v41", ".public-share-panel"],
    operatorAction: "Build the sanitized public share packet from the v4.0 viewer snapshot.",
    exportFilenamePrefix: "DataCenterLedger_PublicSharePacket_v4_1"
  },
  {
    step: "v4.2",
    label: "Redaction audit",
    schema: "DataCenterLedger.PublicShareRedactionAudit.v4.2",
    storageKey: "datacenter-ledger.public-share-redaction-audit.v4.2",
    panelSelectors: ["#public-share-redaction-audit-v42", ".redaction-audit-panel"],
    operatorAction: "Run the redaction audit over the v4.1 public share packet.",
    exportFilenamePrefix: "DataCenterLedger_PublicShareRedactionAudit_v4_2"
  },
  {
    step: "v4.3",
    label: "Share approval",
    schema: "DataCenterLedger.PublicShareApproval.v4.3",
    storageKey: "datacenter-ledger.public-share-approval.v4.3",
    panelSelectors: ["[data-v43-public-share-approval-gate]", ".v43-public-share-approval-gate", ".v43-public-share-approval"],
    operatorAction: "Approve clear audit packets or explicitly accept review-state warnings.",
    exportFilenamePrefix: "DataCenterLedger_PublicShareApproval_v4_3"
  },
  {
    step: "v4.4",
    label: "Share bundle",
    schema: "DataCenterLedger.PublicShareBundle.v4.4",
    storageKey: "datacenter-ledger.public-share-bundle.v4.4",
    panelSelectors: ["[data-v44-public-share-bundle]", ".v44-public-share-bundle-exporter", ".v44-public-share-bundle"],
    operatorAction: "Bundle the share packet, audit, and approval into one public-safe release bundle.",
    exportFilenamePrefix: "DataCenterLedger_PublicShareBundle_v4_4"
  },
  {
    step: "v4.5",
    label: "Release manifest",
    schema: "DataCenterLedger.PublicShareReleaseManifest.v4.5",
    storageKey: "datacenter-ledger.public-share-release-manifest.v4.5",
    panelSelectors: ["[data-v45-public-share-release-manifest]", ".v45-public-share-release-manifest"],
    operatorAction: "Wrap the public share bundle in a release manifest with notes and safety boundary.",
    exportFilenamePrefix: "DataCenterLedger_PublicShareReleaseManifest_v4_5"
  },
  {
    step: "v4.6",
    label: "Release index",
    schema: "DataCenterLedger.PublicReleaseIndex.v4.6",
    storageKey: "datacenter-ledger.public-release-index.v4.6",
    panelSelectors: ["[data-v46-public-release-index]", ".v46-public-release-index"],
    operatorAction: "Add the release manifest to the local public release index.",
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseIndex_v4_6"
  },
  {
    step: "v4.7",
    label: "Release compare",
    schema: "DataCenterLedger.PublicReleaseCompare.v4.7",
    storageKey: "datacenter-ledger.public-release-compare.v4.7",
    panelSelectors: ["[data-v47-public-release-compare]", ".v47-public-release-compare"],
    operatorAction: "Compare two indexed public releases if release history context is needed.",
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseCompare_v4_7"
  },
  {
    step: "v4.8",
    label: "Restore handoff",
    schema: "DataCenterLedger.PublicReleaseRestoreHandoff.v4.8",
    storageKey: "datacenter-ledger.public-release-restore-handoff.v4.8",
    panelSelectors: ["[data-v48-public-release-restore-handoff]", ".v48-public-release-restore-handoff"],
    operatorAction: "Restore a selected indexed manifest into the active release slot when needed.",
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseRestoreHandoff_v4_8"
  },
  {
    step: "v4.9",
    label: "Integrity seal",
    schema: "DataCenterLedger.PublicReleaseIntegritySeal.v4.9",
    storageKey: "datacenter-ledger.public-release-integrity-seal.v4.9",
    panelSelectors: ["[data-v49-public-release-integrity-seal]", ".v49-public-release-integrity-seal"],
    operatorAction: "Build the public release integrity seal over the manifest, index, compare, and restore chain.",
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseIntegritySeal_v4_9"
  },
  {
    step: "v5.0",
    label: "Public release console",
    schema: "DataCenterLedger.PublicReleaseConsole.v5.0",
    storageKey: "datacenter-ledger.public-release-console.v5.0",
    panelSelectors: ["[data-v50-public-release-console]", ".v50-public-release-console"],
    operatorAction: "Refresh the consolidated public release console snapshot.",
    exportFilenamePrefix: "DataCenterLedger_PublicReleaseConsole_v5_0"
  },
  {
    step: "v5.1",
    label: "Console quick actions",
    schema: "DataCenterLedger.PublicConsoleQuickActions.v5.1",
    storageKey: "datacenter-ledger.public-console-quick-actions.v5.1",
    panelSelectors: ["[data-v51-public-console-quick-actions]", ".v51-public-console-quick-actions"],
    operatorAction: "Refresh quick actions so jump/export shortcuts match local artifacts.",
    exportFilenamePrefix: "DataCenterLedger_PublicConsoleQuickActions_v5_1"
  }
];

function escapeGuidedFlow(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function guidedFlowDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireGuidedFlowElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v5.2 guided flow control: ${selector}`);
  return element;
}

function parseGuidedArtifact(storageKey: string): Record<string, unknown> | null {
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

function findPanel(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return null;
}

function statusForStep(step: string, source: Record<string, unknown> | null): GuidedStatus {
  if (!source) return "missing";
  switch (step) {
    case "v4.1":
      return digestFrom(source, [["shareDigest"]]) ? "ready" : "review";
    case "v4.2": {
      const status = textAt(source, ["status"]);
      if (status === "blocked") return "blocked";
      if (status === "review") return "review";
      return status === "clear" ? "ready" : "review";
    }
    case "v4.3": {
      const gateStatus = textAt(source, ["gate", "status"]);
      if (["blocked", "missing_inputs", "digest_mismatch"].includes(gateStatus)) return "blocked";
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
      if (["blocked", "missing_bundle"].includes(gateStatus)) return "blocked";
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
      const status = textAt(source, ["status"]);
      if (["blocked", "missing_artifacts"].includes(status)) return "blocked";
      if (status === "review") return "review";
      return status === "sealed" ? "ready" : "review";
    }
    case "v5.0":
      return textAt(source, ["summary", "overallStatus"]) === "blocked" ? "blocked" : textAt(source, ["consoleDigest"]) ? "ready" : "review";
    case "v5.1":
      return digestFrom(source, [["quickActionDigest"]]) ? "ready" : "review";
    default:
      return "review";
  }
}

function detailForStep(step: string, source: Record<string, unknown> | null) {
  if (!source) return "Missing. Create this artifact next when the guided flow reaches this step.";
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
    case "v5.0":
      return `Console status: ${textAt(source, ["summary", "overallStatus"]) || "unknown"}`;
    case "v5.1":
      return `Quick actions: ${numberAt(source, ["summary", "actionCount"])} · Present: ${numberAt(source, ["summary", "presentCount"])}`;
    default:
      return "Local artifact loaded.";
  }
}

function nextInstructionFor(status: GuidedStatus, action: string) {
  if (status === "missing") return action;
  if (status === "blocked") return `Resolve the blocked state first. ${action}`;
  if (status === "review") return `Review warnings or incomplete state. ${action}`;
  return "Ready. Continue to the next step.";
}

function priorityForStep(step: GuidedArtifactStep, recommended: GuidedArtifactStep): GuidedPriority {
  if (step.step === recommended.step) {
    if (step.status === "blocked") return "blocked";
    if (step.status === "ready") return "complete";
    return "next";
  }
  return step.status === "ready" ? "complete" : "soon";
}

function buildGuidedStep(definition: GuidedArtifactDefinition): GuidedArtifactStep {
  const source = parseGuidedArtifact(definition.storageKey);
  const status = statusForStep(definition.step, source);
  const panelFound = Boolean(findPanel(definition.panelSelectors));
  return {
    ...definition,
    present: Boolean(source),
    status,
    priority: "soon",
    digest: digestFrom(source, [
      ["shareDigest"],
      ["auditDigest"],
      ["approvalDigest"],
      ["bundleDigest"],
      ["manifestDigest"],
      ["indexDigest"],
      ["compareDigest"],
      ["handoffDigest"],
      ["sealDigest"],
      ["consoleDigest"],
      ["quickActionDigest"]
    ]),
    detail: detailForStep(definition.step, source),
    nextInstruction: nextInstructionFor(status, definition.operatorAction),
    panelFound
  };
}

function buildGuidedFlow(): PublicConsoleGuidedFlow {
  const steps = GUIDED_ARTIFACTS.map(buildGuidedStep);
  const firstBlocked = steps.find((step) => step.status === "blocked");
  const firstMissing = steps.find((step) => step.status === "missing");
  const firstReview = steps.find((step) => step.status === "review");
  const recommended = firstBlocked ?? firstMissing ?? firstReview ?? steps[steps.length - 1];
  const guidedSteps: GuidedArtifactStep[] = steps.map((step) => ({
    ...step,
    priority: priorityForStep(step, recommended)
  }));
  const readyCount = guidedSteps.filter((step) => step.status === "ready").length;
  const reviewCount = guidedSteps.filter((step) => step.status === "review").length;
  const blockedCount = guidedSteps.filter((step) => step.status === "blocked").length;
  const missingCount = guidedSteps.filter((step) => step.status === "missing").length;
  const panelTargetsFound = guidedSteps.filter((step) => step.panelFound).length;
  const overallStatus: GuidedStatus = blockedCount > 0 ? "blocked" : missingCount > 0 || reviewCount > 0 ? "review" : "ready";
  const core: Omit<PublicConsoleGuidedFlow, "guidedFlowDigest"> = {
    schema: PUBLIC_CONSOLE_GUIDED_FLOW_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_CONSOLE_GUIDED_FLOW_APP_VERSION,
    summary: {
      overallStatus,
      totalSteps: guidedSteps.length,
      readyCount,
      reviewCount,
      blockedCount,
      missingCount,
      panelTargetsFound,
      recommendedStep: recommended.step,
      recommendedInstruction: recommended.nextInstruction
    },
    steps: guidedSteps,
    safetyBoundary: GUIDED_FLOW_BOUNDARY,
    guidedFlowNotice:
      "This guided flow summarizes local public-release artifacts and suggests next operator actions. It does not fetch external data, enrich locations, certify source truth, authorize publication, or create a complete national map."
  };
  return {
    ...core,
    guidedFlowDigest: guidedFlowDigest("public-console-guided-flow", core)
  };
}

function downloadGuidedFlowJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportLocalArtifact(step: GuidedArtifactStep) {
  const raw = localStorage.getItem(step.storageKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const digest = step.digest || guidedFlowDigest("artifact", parsed);
    downloadGuidedFlowJson(`${step.exportFilenamePrefix}_${digest}.json`, parsed);
    return true;
  } catch {
    return false;
  }
}

function jumpToGuidedPanel(step: GuidedArtifactStep) {
  const panel = findPanel(step.panelSelectors);
  if (!panel) return false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.setAttribute("data-guided-flow-focus", "true");
  setTimeout(() => panel.removeAttribute("data-guided-flow-focus"), 2400);
  return true;
}

function renderGuidedSummary(flow: PublicConsoleGuidedFlow | null) {
  if (!flow) {
    return `
      <div class="v52-flow-card"><span>Status</span><strong>Not refreshed</strong></div>
      <div class="v52-flow-card"><span>Ready</span><strong>0</strong></div>
      <div class="v52-flow-card"><span>Next</span><strong>—</strong></div>
      <div class="v52-flow-card"><span>Digest</span><strong>—</strong></div>
    `;
  }
  return `
    <div class="v52-flow-card"><span>Status</span><strong>${escapeGuidedFlow(flow.summary.overallStatus)}</strong></div>
    <div class="v52-flow-card"><span>Ready</span><strong>${flow.summary.readyCount} / ${flow.summary.totalSteps}</strong></div>
    <div class="v52-flow-card"><span>Next</span><strong>${escapeGuidedFlow(flow.summary.recommendedStep)}</strong></div>
    <div class="v52-flow-card"><span>Digest</span><strong>${escapeGuidedFlow(flow.guidedFlowDigest)}</strong></div>
  `;
}

function renderGuidedRows(flow: PublicConsoleGuidedFlow | null) {
  if (!flow) return '<tr><td colspan="7">Refresh guided flow to see next operator steps.</td></tr>';
  return flow.steps
    .map(
      (step) => `
        <tr data-status="${escapeGuidedFlow(step.status)}" data-priority="${escapeGuidedFlow(step.priority)}">
          <td><strong>${escapeGuidedFlow(step.step)}</strong><br /><small>${escapeGuidedFlow(step.label)}</small></td>
          <td>${escapeGuidedFlow(step.status)}</td>
          <td>${escapeGuidedFlow(step.priority)}</td>
          <td>${escapeGuidedFlow(step.nextInstruction)}</td>
          <td><code>${escapeGuidedFlow(step.digest || "—")}</code></td>
          <td>${step.panelFound ? "yes" : "not mounted"}</td>
          <td class="v52-flow-actions">
            <button type="button" data-v52-jump="${escapeGuidedFlow(step.step)}">Jump</button>
            <button type="button" data-v52-export="${escapeGuidedFlow(step.step)}" ${step.present ? "" : "disabled"}>Export</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function mountPublicConsoleGuidedFlow() {
  if (document.querySelector("[data-v52-public-console-guided-flow]")) return;
  const panel = document.createElement("section");
  panel.className = "v52-public-console-guided-flow";
  panel.dataset.v52PublicConsoleGuidedFlow = "true";
  panel.innerHTML = `
    <div class="v52-flow-header">
      <div>
        <p class="v52-flow-kicker">v5.2 Public Console Guided Flow</p>
        <h2>Public Console Guided Flow</h2>
        <p>Step-by-step operator guidance for the v4.1–v5.1 public release chain. Refresh to see what to create, review, repair, export, or jump to next.</p>
      </div>
      <span class="v52-flow-badge">DataCenterLedger.PublicConsoleGuidedFlow.v5.2</span>
    </div>
    <div class="v52-flow-boundary" data-v52-boundary></div>
    <div class="v52-flow-controls">
      <button type="button" data-v52-refresh>Refresh guided flow</button>
      <button type="button" data-v52-jump-next disabled>Jump to next step</button>
      <button type="button" data-v52-export-snapshot disabled>Export guided-flow snapshot</button>
      <button type="button" data-v52-clear>Clear snapshot</button>
    </div>
    <div class="v52-flow-summary" data-v52-summary></div>
    <div class="v52-flow-next" data-v52-next>Refresh guided flow to receive the next operator instruction.</div>
    <div class="v52-flow-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Instruction</th>
            <th>Digest</th>
            <th>Panel</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody data-v52-rows></tbody>
      </table>
    </div>
  `;
  document.body.appendChild(panel);
  const boundary = requireGuidedFlowElement<HTMLDivElement>(panel, "[data-v52-boundary]");
  const refreshButton = requireGuidedFlowElement<HTMLButtonElement>(panel, "[data-v52-refresh]");
  const jumpNextButton = requireGuidedFlowElement<HTMLButtonElement>(panel, "[data-v52-jump-next]");
  const exportSnapshotButton = requireGuidedFlowElement<HTMLButtonElement>(panel, "[data-v52-export-snapshot]");
  const clearButton = requireGuidedFlowElement<HTMLButtonElement>(panel, "[data-v52-clear]");
  const summary = requireGuidedFlowElement<HTMLDivElement>(panel, "[data-v52-summary]");
  const next = requireGuidedFlowElement<HTMLDivElement>(panel, "[data-v52-next]");
  const rows = requireGuidedFlowElement<HTMLTableSectionElement>(panel, "[data-v52-rows]");
  let currentFlow: PublicConsoleGuidedFlow | null = null;
  function renderBoundary() {
    boundary.innerHTML = GUIDED_FLOW_BOUNDARY.map((line) => `<span>${escapeGuidedFlow(line)}</span>`).join("");
  }
  function stepById(stepId: string) {
    return currentFlow?.steps.find((step) => step.step === stepId) ?? null;
  }
  function recommendedStep() {
    if (!currentFlow) return null;
    return currentFlow.steps.find((step) => step.step === currentFlow?.summary.recommendedStep) ?? null;
  }
  function bindRowActions() {
    panel.querySelectorAll<HTMLButtonElement>("[data-v52-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = stepById(button.dataset.v52Jump ?? "");
        next.textContent = step && jumpToGuidedPanel(step) ? `Jumped to ${step.step} ${step.label}.` : "Panel is not mounted yet. Scroll or refresh after widgets finish loading.";
      });
    });
    panel.querySelectorAll<HTMLButtonElement>("[data-v52-export]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = stepById(button.dataset.v52Export ?? "");
        next.textContent = step && exportLocalArtifact(step) ? `Exported ${step.step} ${step.label}.` : "No local artifact available to export for that step.";
      });
    });
  }
  function render() {
    summary.innerHTML = renderGuidedSummary(currentFlow);
    rows.innerHTML = renderGuidedRows(currentFlow);
    const recommended = recommendedStep();
    next.innerHTML = recommended
      ? `<strong>Next recommended step: ${escapeGuidedFlow(recommended.step)} ${escapeGuidedFlow(recommended.label)}</strong><span>${escapeGuidedFlow(recommended.nextInstruction)}</span>`
      : "Refresh guided flow to receive the next operator instruction.";
    jumpNextButton.disabled = !recommended;
    exportSnapshotButton.disabled = !currentFlow;
    bindRowActions();
  }
  refreshButton.addEventListener("click", () => {
    currentFlow = buildGuidedFlow();
    localStorage.setItem(PUBLIC_CONSOLE_GUIDED_FLOW_KEY_V52, JSON.stringify(currentFlow, null, 2));
    render();
  });
  jumpNextButton.addEventListener("click", () => {
    const recommended = recommendedStep();
    next.textContent = recommended && jumpToGuidedPanel(recommended) ? `Jumped to ${recommended.step} ${recommended.label}.` : "The recommended panel is not mounted yet. Refresh after widgets finish loading.";
  });
  exportSnapshotButton.addEventListener("click", () => {
    if (!currentFlow) return;
    downloadGuidedFlowJson(`DataCenterLedger_PublicConsoleGuidedFlow_v5_2_${currentFlow.guidedFlowDigest}.json`, currentFlow);
  });
  clearButton.addEventListener("click", () => {
    currentFlow = null;
    localStorage.removeItem(PUBLIC_CONSOLE_GUIDED_FLOW_KEY_V52);
    render();
  });
  renderBoundary();
  render();
}

setTimeout(mountPublicConsoleGuidedFlow, 0);
setTimeout(mountPublicConsoleGuidedFlow, 500);
