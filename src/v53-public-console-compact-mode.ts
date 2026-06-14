export {};

const PUBLIC_CONSOLE_COMPACT_MODE_KEY_V53 = "datacenter-ledger.public-console-compact-mode.v5.3";
const PUBLIC_CONSOLE_COMPACT_MODE_APP_VERSION = "5.3.0" as const;
const PUBLIC_CONSOLE_COMPACT_MODE_SCHEMA = "DataCenterLedger.PublicConsoleCompactMode.v5.3" as const;

const COMPACT_MODE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No coordinate or address enrichment.",
  "Compact mode changes only local page visibility; it does not mutate release artifacts.",
  "Compact mode is an operator navigation aid, not a source-of-truth certification or publication authorization."
];

type CompactModeMode = "expanded" | "compact" | "single_panel";

type CompactPanelTarget = {
  id: string;
  label: string;
  selector: string;
};

type CompactPanelState = {
  id: string;
  label: string;
  selector: string;
  present: boolean;
  visible: boolean;
};

type PublicConsoleCompactModeSnapshot = {
  schema: typeof PUBLIC_CONSOLE_COMPACT_MODE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_CONSOLE_COMPACT_MODE_APP_VERSION;
  mode: CompactModeMode;
  selectedPanelId: string;
  panelCount: number;
  presentPanelCount: number;
  hiddenPanelCount: number;
  panels: CompactPanelState[];
  safetyBoundary: string[];
  compactNotice: string;
  compactDigest: string;
};

const COMPACT_PANEL_TARGETS: CompactPanelTarget[] = [
  { id: "v41-share", label: "v4.1 Public Share Packet", selector: "[data-v41-public-share-packet]" },
  { id: "v42-audit", label: "v4.2 Redaction Audit", selector: "[data-v42-public-share-redaction-audit]" },
  { id: "v43-approval", label: "v4.3 Share Approval Gate", selector: "[data-v43-public-share-approval-gate]" },
  { id: "v44-bundle", label: "v4.4 Public Share Bundle", selector: "[data-v44-public-share-bundle]" },
  { id: "v45-manifest", label: "v4.5 Release Manifest", selector: "[data-v45-public-share-release-manifest]" },
  { id: "v46-index", label: "v4.6 Release Index", selector: "[data-v46-public-release-index]" },
  { id: "v47-compare", label: "v4.7 Release Compare", selector: "[data-v47-public-release-compare]" },
  { id: "v48-restore", label: "v4.8 Restore Handoff", selector: "[data-v48-public-release-restore]" },
  { id: "v49-seal", label: "v4.9 Integrity Seal", selector: "[data-v49-public-release-integrity-seal]" },
  { id: "v50-console", label: "v5.0 Public Release Console", selector: "[data-v50-public-release-console]" },
  { id: "v51-actions", label: "v5.1 Quick Actions", selector: "[data-v51-public-console-quick-actions]" },
  { id: "v52-guided", label: "v5.2 Guided Flow", selector: "[data-v52-public-console-guided-flow]" }
];

function escapeCompactMode(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function compactModeDigest(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function requireCompactModeElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v5.3 compact mode control: ${selector}`);
  return element;
}

function findPanel(target: CompactPanelTarget) {
  return document.querySelector<HTMLElement>(target.selector);
}

function getVisibleState(element: HTMLElement | null) {
  if (!element) return false;
  return element.dataset.v53CompactHidden !== "true";
}

function buildCompactSnapshot(mode: CompactModeMode, selectedPanelId: string): PublicConsoleCompactModeSnapshot {
  const panels: CompactPanelState[] = COMPACT_PANEL_TARGETS.map((target) => {
    const element = findPanel(target);
    return {
      id: target.id,
      label: target.label,
      selector: target.selector,
      present: Boolean(element),
      visible: getVisibleState(element)
    };
  });

  const presentPanelCount = panels.filter((panel) => panel.present).length;
  const hiddenPanelCount = panels.filter((panel) => panel.present && !panel.visible).length;
  const snapshotCore: Omit<PublicConsoleCompactModeSnapshot, "compactDigest"> = {
    schema: PUBLIC_CONSOLE_COMPACT_MODE_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: PUBLIC_CONSOLE_COMPACT_MODE_APP_VERSION,
    mode,
    selectedPanelId,
    panelCount: panels.length,
    presentPanelCount,
    hiddenPanelCount,
    panels,
    safetyBoundary: COMPACT_MODE_BOUNDARY,
    compactNotice:
      "This compact-mode snapshot records local UI visibility for public-release panels only. It does not mutate release artifacts, fetch external data, enrich locations, or authorize publication."
  };

  return {
    ...snapshotCore,
    compactDigest: compactModeDigest("public-console-compact-mode", snapshotCore)
  };
}

function saveCompactSnapshot(snapshot: PublicConsoleCompactModeSnapshot) {
  localStorage.setItem(PUBLIC_CONSOLE_COMPACT_MODE_KEY_V53, JSON.stringify(snapshot, null, 2));
}

function downloadCompactModeJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function setPanelHidden(element: HTMLElement, hidden: boolean) {
  element.dataset.v53CompactHidden = hidden ? "true" : "false";
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function showAllPanels() {
  for (const target of COMPACT_PANEL_TARGETS) {
    const element = findPanel(target);
    if (element) setPanelHidden(element, false);
  }
  document.documentElement.dataset.dclCompactMode = "expanded";
}

function compactAllPanels() {
  for (const target of COMPACT_PANEL_TARGETS) {
    const element = findPanel(target);
    if (element) setPanelHidden(element, true);
  }
  document.documentElement.dataset.dclCompactMode = "compact";
}

function showSinglePanel(panelId: string) {
  for (const target of COMPACT_PANEL_TARGETS) {
    const element = findPanel(target);
    if (element) setPanelHidden(element, target.id !== panelId);
  }
  document.documentElement.dataset.dclCompactMode = "single_panel";
}

function scrollToPanel(panelId: string) {
  const target = COMPACT_PANEL_TARGETS.find((item) => item.id === panelId);
  if (!target) return false;
  const element = findPanel(target);
  if (!element) return false;
  setPanelHidden(element, false);
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function renderCompactOptions() {
  return COMPACT_PANEL_TARGETS.map((target) => `<option value="${escapeCompactMode(target.id)}">${escapeCompactMode(target.label)}</option>`).join("");
}

function renderCompactSummary(snapshot: PublicConsoleCompactModeSnapshot | null) {
  if (!snapshot) {
    return `
      <div class="v53-compact-card"><span>Mode</span><strong>Not saved</strong></div>
      <div class="v53-compact-card"><span>Panels present</span><strong>0</strong></div>
      <div class="v53-compact-card"><span>Hidden</span><strong>0</strong></div>
      <div class="v53-compact-card"><span>Digest</span><strong>—</strong></div>
    `;
  }

  return `
    <div class="v53-compact-card"><span>Mode</span><strong>${escapeCompactMode(snapshot.mode)}</strong></div>
    <div class="v53-compact-card"><span>Panels present</span><strong>${snapshot.presentPanelCount}</strong></div>
    <div class="v53-compact-card"><span>Hidden</span><strong>${snapshot.hiddenPanelCount}</strong></div>
    <div class="v53-compact-card"><span>Digest</span><strong>${escapeCompactMode(snapshot.compactDigest)}</strong></div>
  `;
}

function renderCompactRows(snapshot: PublicConsoleCompactModeSnapshot | null) {
  const panels = snapshot?.panels ?? COMPACT_PANEL_TARGETS.map((target) => ({
    id: target.id,
    label: target.label,
    selector: target.selector,
    present: Boolean(findPanel(target)),
    visible: getVisibleState(findPanel(target))
  }));

  return panels
    .map(
      (panel) => `
        <tr>
          <td><strong>${escapeCompactMode(panel.label)}</strong><br /><small>${escapeCompactMode(panel.id)}</small></td>
          <td>${panel.present ? "present" : "missing"}</td>
          <td>${panel.visible ? "visible" : "hidden"}</td>
          <td class="v53-compact-row-actions">
            <button type="button" data-v53-show-one="${escapeCompactMode(panel.id)}">Show only</button>
            <button type="button" data-v53-jump="${escapeCompactMode(panel.id)}">Jump</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function mountPublicConsoleCompactMode() {
  if (document.querySelector("[data-v53-public-console-compact-mode]")) return;

  const panel = document.createElement("section");
  panel.className = "v53-public-console-compact-mode";
  panel.dataset.v53PublicConsoleCompactMode = "true";
  panel.innerHTML = `
    <div class="v53-compact-header">
      <div>
        <p class="v53-compact-kicker">v5.3 Public Console Compact Mode</p>
        <h2>Public Console Compact Mode</h2>
        <p>Collapse the public-release cockpit, show one panel at a time, jump directly to modules, and export a local compact-mode snapshot.</p>
      </div>
      <span class="v53-compact-badge">DataCenterLedger.PublicConsoleCompactMode.v5.3</span>
    </div>

    <div class="v53-compact-boundary" data-v53-boundary></div>

    <div class="v53-compact-controls">
      <button type="button" data-v53-refresh>Refresh compact snapshot</button>
      <button type="button" data-v53-compact>Compact all public panels</button>
      <button type="button" data-v53-expand>Expand all public panels</button>
      <button type="button" data-v53-top>Jump to top</button>
      <button type="button" data-v53-export disabled>Export compact snapshot</button>
    </div>

    <div class="v53-compact-selector-row">
      <label>Show one panel<select data-v53-select>${renderCompactOptions()}</select></label>
      <button type="button" data-v53-show-selected>Show selected panel only</button>
      <button type="button" data-v53-jump-selected>Jump to selected panel</button>
    </div>

    <div class="v53-compact-summary" data-v53-summary></div>
    <div class="v53-compact-meta" data-v53-meta>Use compact mode to navigate the public-release cockpit without scrolling through every expanded module.</div>

    <div class="v53-compact-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Panel</th>
            <th>Presence</th>
            <th>Visibility</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody data-v53-rows></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(panel);

  const boundary = requireCompactModeElement<HTMLDivElement>(panel, "[data-v53-boundary]");
  const refreshButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-refresh]");
  const compactButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-compact]");
  const expandButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-expand]");
  const topButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-top]");
  const exportButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-export]");
  const select = requireCompactModeElement<HTMLSelectElement>(panel, "[data-v53-select]");
  const showSelectedButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-show-selected]");
  const jumpSelectedButton = requireCompactModeElement<HTMLButtonElement>(panel, "[data-v53-jump-selected]");
  const summary = requireCompactModeElement<HTMLDivElement>(panel, "[data-v53-summary]");
  const meta = requireCompactModeElement<HTMLDivElement>(panel, "[data-v53-meta]");
  const rows = requireCompactModeElement<HTMLTableSectionElement>(panel, "[data-v53-rows]");

  let mode: CompactModeMode = "expanded";
  let currentSnapshot: PublicConsoleCompactModeSnapshot | null = null;

  function refreshSnapshot(selectedPanelId = select.value || "") {
    currentSnapshot = buildCompactSnapshot(mode, selectedPanelId);
    saveCompactSnapshot(currentSnapshot);
    summary.innerHTML = renderCompactSummary(currentSnapshot);
    rows.innerHTML = renderCompactRows(currentSnapshot);
    exportButton.disabled = false;
    meta.textContent = `Compact snapshot refreshed: ${currentSnapshot.compactDigest}`;
  }

  function renderBoundary() {
    boundary.innerHTML = COMPACT_MODE_BOUNDARY.map((line) => `<span>${escapeCompactMode(line)}</span>`).join("");
  }

  refreshButton.addEventListener("click", () => refreshSnapshot());

  compactButton.addEventListener("click", () => {
    mode = "compact";
    compactAllPanels();
    refreshSnapshot();
    meta.textContent = "All public-release panels are hidden. Use Show selected panel only to focus one module.";
  });

  expandButton.addEventListener("click", () => {
    mode = "expanded";
    showAllPanels();
    refreshSnapshot();
    meta.textContent = "All public-release panels are expanded.";
  });

  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  showSelectedButton.addEventListener("click", () => {
    mode = "single_panel";
    showSinglePanel(select.value);
    refreshSnapshot(select.value);
    const didScroll = scrollToPanel(select.value);
    meta.textContent = didScroll ? "Selected public-release panel is now focused." : "Selected panel is not mounted yet. Refresh after the module loads.";
  });

  jumpSelectedButton.addEventListener("click", () => {
    const didScroll = scrollToPanel(select.value);
    refreshSnapshot(select.value);
    meta.textContent = didScroll ? "Jumped to selected panel." : "Selected panel is not mounted yet. Refresh after the module loads.";
  });

  exportButton.addEventListener("click", () => {
    if (!currentSnapshot) return;
    downloadCompactModeJson(`DataCenterLedger_PublicConsoleCompactMode_v5_3_${currentSnapshot.compactDigest}.json`, currentSnapshot);
  });

  rows.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const showOne = target.getAttribute("data-v53-show-one");
    const jump = target.getAttribute("data-v53-jump");

    if (showOne) {
      select.value = showOne;
      mode = "single_panel";
      showSinglePanel(showOne);
      refreshSnapshot(showOne);
      scrollToPanel(showOne);
      meta.textContent = "Focused selected row panel.";
      return;
    }

    if (jump) {
      select.value = jump;
      const didScroll = scrollToPanel(jump);
      refreshSnapshot(jump);
      meta.textContent = didScroll ? "Jumped to selected row panel." : "Selected row panel is not mounted yet.";
    }
  });

  renderBoundary();
  refreshSnapshot();
}

setTimeout(mountPublicConsoleCompactMode, 0);
setTimeout(mountPublicConsoleCompactMode, 700);
