export {};

const FINAL_MAP_LAYER_KEY_V39 = "datacenter-ledger.final-map-layer.v3.9";
const FINAL_MAP_VIEWER_KEY_V40 = "datacenter-ledger.final-map-viewer.v4.0";
const FINAL_MAP_VIEWER_APP_VERSION = "4.0.0" as const;
const FINAL_MAP_VIEWER_SCHEMA = "DataCenterLedger.FinalMapLayerViewer.v4.0" as const;

const FINAL_MAP_VIEWER_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Viewer records must come from a v3.9 final map-layer packet.",
  "Map markers remain review references, not proof of facility status or completeness.",
  "Location precision follows the approved final-layer packet; the viewer does not upgrade precision."
];

type GateStatus = "missing_inputs" | "blocked" | "review_required" | "export_ready" | string;
type QAStatus = "empty" | "blocked" | "review" | "clear" | string;
type RecordQAStatus = "pass" | "review" | string;

type FinalMapLayerRecord = {
  recordId: string;
  title: string;
  operator?: string;
  state: string;
  county?: string;
  city?: string;
  mapPrecision?: string;
  publicAddress?: string;
  latitude?: string;
  longitude?: string;
  coordinateBasis?: string;
  evidenceClass?: string;
  evidenceUrl?: string;
  locationConfidence?: number | null;
  qaStatus?: RecordQAStatus;
  qaWarningCount?: number;
  qaInfoCount?: number;
  reviewerNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  sourceFeedDigest?: string;
  sourceQAReportDigest?: string;
  sourceMapFeedRecordDigest?: string;
  sourceRowDigest?: string;
  sourceBatchDigest?: string;
  sourceBridgeDigest?: string;
  sourceIntakeDigest?: string;
  decisionReceiptDigest?: string;
  finalRecordDigest: string;
};

type FinalMapLayerPacket = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
  gateDecision: {
    status: GateStatus;
    reviewerName?: string;
    reviewerNote?: string;
    reviewWarningsAccepted?: boolean;
    decidedAt?: string;
    reason?: string;
    gateDigest?: string;
  };
  sourceFeed: {
    schema?: string;
    feedDigest: string;
    generatedAt?: string;
    candidateCount?: number;
  };
  sourceQA: {
    schema?: string;
    reportDigest: string;
    generatedAt?: string;
    status: QAStatus;
    blockerFindings?: number;
    warningFindings?: number;
  };
  summary: {
    finalRecords: number;
    excludedRecords?: number;
    statesRepresented?: number;
    cityPrecisionRecords?: number;
    countyPrecisionRecords?: number;
    statePrecisionRecords?: number;
    publicAddressRecords?: number;
    warningAcceptedRecords?: number;
  };
  finalRecords: FinalMapLayerRecord[];
  safetyBoundary?: string[];
  reviewOnlyNotice?: string;
  finalLayerDigest: string;
};

type ViewerRecord = {
  recordId: string;
  title: string;
  operator: string;
  state: string;
  locality: string;
  mapPrecision: string;
  qaStatus: RecordQAStatus;
  qaWarningCount: number;
  evidenceUrl: string;
  evidenceClass: string;
  locationConfidence: number | null;
  finalRecordDigest: string;
};

type FinalMapLayerViewerSnapshot = {
  schema: typeof FINAL_MAP_VIEWER_SCHEMA;
  generatedAt: string;
  appVersion: typeof FINAL_MAP_VIEWER_APP_VERSION;
  sourceFinalMapLayer: {
    schema: string;
    finalLayerDigest: string;
    generatedAt: string;
    gateStatus: GateStatus;
    qaStatus: QAStatus;
    sourceFeedDigest: string;
    sourceQAReportDigest: string;
  };
  summary: {
    finalRecords: number;
    statesRepresented: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
    publicAddressRecords: number;
    warningRecords: number;
  };
  stateClusters: Array<{ state: string; count: number }>;
  records: ViewerRecord[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  viewerDigest: string;
};

function viewerDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `viewer-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function escapeViewer(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireViewerElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.0 viewer control: ${selector}`);
  return element;
}

function parseFinalLayer(text: string): FinalMapLayerPacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<FinalMapLayerPacket>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.FinalMapLayer.v3.9") return null;
    if (!Array.isArray(parsed.finalRecords) || typeof parsed.finalLayerDigest !== "string") return null;
    if (!parsed.gateDecision || !parsed.sourceFeed || !parsed.sourceQA || !parsed.summary) return null;
    return parsed as FinalMapLayerPacket;
  } catch {
    return null;
  }
}

function normalizeViewerRecord(record: FinalMapLayerRecord): ViewerRecord {
  const locality = [record.city, record.county, record.state].filter(Boolean).join(", ");
  return {
    recordId: String(record.recordId ?? ""),
    title: String(record.title ?? "Untitled facility"),
    operator: String(record.operator ?? "unknown"),
    state: String(record.state ?? "").toUpperCase(),
    locality: locality || String(record.state ?? "unknown"),
    mapPrecision: String(record.mapPrecision ?? "unknown"),
    qaStatus: String(record.qaStatus ?? "pass"),
    qaWarningCount: Number(record.qaWarningCount ?? 0),
    evidenceUrl: String(record.evidenceUrl ?? ""),
    evidenceClass: String(record.evidenceClass ?? ""),
    locationConfidence: typeof record.locationConfidence === "number" ? record.locationConfidence : null,
    finalRecordDigest: String(record.finalRecordDigest ?? "")
  };
}

function buildViewerSnapshot(packet: FinalMapLayerPacket): FinalMapLayerViewerSnapshot {
  const generatedAt = new Date().toISOString();
  const records = packet.finalRecords.map(normalizeViewerRecord);
  const clusterMap = new Map<string, number>();
  for (const record of records) {
    const state = record.state || "UNKNOWN";
    clusterMap.set(state, (clusterMap.get(state) ?? 0) + 1);
  }
  const stateClusters = Array.from(clusterMap.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((left, right) => right.count - left.count || left.state.localeCompare(right.state));

  const snapshotCore: Omit<FinalMapLayerViewerSnapshot, "viewerDigest"> = {
    schema: FINAL_MAP_VIEWER_SCHEMA,
    generatedAt,
    appVersion: FINAL_MAP_VIEWER_APP_VERSION,
    sourceFinalMapLayer: {
      schema: packet.schema,
      finalLayerDigest: packet.finalLayerDigest,
      generatedAt: packet.generatedAt,
      gateStatus: packet.gateDecision.status,
      qaStatus: packet.sourceQA.status,
      sourceFeedDigest: packet.sourceFeed.feedDigest,
      sourceQAReportDigest: packet.sourceQA.reportDigest
    },
    summary: {
      finalRecords: records.length,
      statesRepresented: stateClusters.length,
      cityPrecisionRecords: records.filter((record) => record.mapPrecision === "city").length,
      countyPrecisionRecords: records.filter((record) => record.mapPrecision === "county").length,
      statePrecisionRecords: records.filter((record) => record.mapPrecision === "state").length,
      publicAddressRecords: records.filter((record) => record.mapPrecision === "public_address").length,
      warningRecords: records.filter((record) => record.qaStatus === "review" || record.qaWarningCount > 0).length
    },
    stateClusters,
    records,
    safetyBoundary: [...FINAL_MAP_VIEWER_BOUNDARY],
    reviewOnlyNotice: "This viewer snapshot displays records already passed through the v3.9 final map-layer gate. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or represent a complete national map."
  };

  return { ...snapshotCore, viewerDigest: viewerDigest(snapshotCore) };
}

function downloadViewerJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderViewer(container: HTMLElement, snapshot: FinalMapLayerViewerSnapshot | null) {
  if (!snapshot) {
    container.innerHTML = `<div class="final-viewer-empty">No final map-layer viewer snapshot generated yet.</div>`;
    return;
  }

  const clusters = snapshot.stateClusters.length > 0
    ? snapshot.stateClusters.map((cluster) => `<span>${escapeViewer(cluster.state)} <strong>${cluster.count}</strong></span>`).join("")
    : `<span>No states represented</span>`;

  const rows = snapshot.records.length > 0
    ? snapshot.records.map((record) => `<tr>
        <td><strong>${escapeViewer(record.recordId)}</strong><br/><small>${escapeViewer(record.finalRecordDigest)}</small></td>
        <td>${escapeViewer(record.title)}<br/><small>${escapeViewer(record.operator)}</small></td>
        <td>${escapeViewer(record.locality)}</td>
        <td>${escapeViewer(record.mapPrecision)}</td>
        <td>${escapeViewer(record.qaStatus)}<br/><small>${record.qaWarningCount} warnings</small></td>
        <td>${escapeViewer(record.evidenceClass)}<br/><small>${escapeViewer(record.evidenceUrl || "missing")}</small></td>
      </tr>`).join("")
    : `<tr><td colspan="6">No final records in this packet.</td></tr>`;

  container.innerHTML = `<div class="final-viewer-badges">
      <span>Gate: <strong>${escapeViewer(snapshot.sourceFinalMapLayer.gateStatus)}</strong></span>
      <span>QA: <strong>${escapeViewer(snapshot.sourceFinalMapLayer.qaStatus)}</strong></span>
      <span>Final layer: <strong>${escapeViewer(snapshot.sourceFinalMapLayer.finalLayerDigest)}</strong></span>
      <span>Viewer: <strong>${escapeViewer(snapshot.viewerDigest)}</strong></span>
    </div>
    <div class="final-viewer-clusters">${clusters}</div>
    <table class="final-viewer-table">
      <thead><tr><th>Record</th><th>Facility</th><th>Location</th><th>Precision</th><th>QA</th><th>Evidence</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function mountFinalMapLayerViewer() {
  const existing = document.getElementById("final-map-layer-viewer-v40");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.id = "final-map-layer-viewer-v40";
  panel.className = "final-viewer-panel";
  panel.innerHTML = `
    <div class="final-viewer-header">
      <p class="eyebrow">v4.0 Final Map Layer Viewer Integration</p>
      <h2>View the gated final map layer</h2>
      <p>Load the v3.9 final map-layer packet, confirm the gate and QA badges, and preview the reviewed records that are eligible for the final map experience.</p>
    </div>
    <div class="final-viewer-controls">
      <button type="button" data-action="load-latest">Load latest final layer</button>
      <label class="final-viewer-file">Load final layer JSON<input type="file" accept="application/json,.json" data-role="final-file" /></label>
      <button type="button" data-action="build">Build viewer snapshot</button>
      <button type="button" data-action="export">Export viewer snapshot</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="final-json" spellcheck="false" placeholder="Paste DataCenterLedger.FinalMapLayer.v3.9 JSON here..."></textarea>
    <div class="final-viewer-summary" data-role="summary"><span>Records: 0</span><span>States: 0</span><span>Warnings: 0</span><span>Digest: none</span></div>
    <div class="final-viewer-boundary">${FINAL_MAP_VIEWER_BOUNDARY.map((item) => `<span>${escapeViewer(item)}</span>`).join("")}</div>
    <div class="final-viewer-results" data-role="results"><div class="final-viewer-empty">No final map-layer viewer snapshot generated yet.</div></div>`;

  const anchor = document.getElementById("final-map-layer-export-gate-v39") ?? document.getElementById("root");
  if (anchor) anchor.insertAdjacentElement("afterend", panel);
  else document.body.appendChild(panel);

  const finalInput = requireViewerElement<HTMLTextAreaElement>(panel, '[data-role="final-json"]');
  const fileInput = requireViewerElement<HTMLInputElement>(panel, '[data-role="final-file"]');
  const summaryNode = requireViewerElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireViewerElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireViewerElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const buildButton = requireViewerElement<HTMLButtonElement>(panel, '[data-action="build"]');
  const exportButton = requireViewerElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireViewerElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentSnapshot: FinalMapLayerViewerSnapshot | null = null;

  const updateSummary = () => {
    summaryNode.innerHTML = `<span>Records: ${currentSnapshot?.summary.finalRecords ?? 0}</span><span>States: ${currentSnapshot?.summary.statesRepresented ?? 0}</span><span>Warnings: ${currentSnapshot?.summary.warningRecords ?? 0}</span><span>Digest: ${escapeViewer(currentSnapshot?.viewerDigest ?? "none")}</span>`;
  };

  const buildSnapshotFromInput = () => {
    const packet = parseFinalLayer(finalInput.value);
    currentSnapshot = packet ? buildViewerSnapshot(packet) : null;
    if (currentSnapshot) {
      localStorage.setItem(FINAL_MAP_VIEWER_KEY_V40, JSON.stringify(currentSnapshot));
      window.dispatchEvent(new CustomEvent("dcl:final-map-viewer-updated", { detail: { viewerDigest: currentSnapshot.viewerDigest } }));
    } else {
      localStorage.removeItem(FINAL_MAP_VIEWER_KEY_V40);
    }
    renderViewer(resultsNode, currentSnapshot);
    updateSummary();
  };

  loadLatestButton.addEventListener("click", () => {
    finalInput.value = localStorage.getItem(FINAL_MAP_LAYER_KEY_V39) ?? "";
    buildSnapshotFromInput();
  });

  buildButton.addEventListener("click", buildSnapshotFromInput);
  exportButton.addEventListener("click", () => {
    if (!currentSnapshot) buildSnapshotFromInput();
    if (!currentSnapshot) return;
    downloadViewerJson(`final-map-layer-viewer-v4.0-${currentSnapshot.viewerDigest}.json`, currentSnapshot);
  });
  clearButton.addEventListener("click", () => {
    finalInput.value = "";
    currentSnapshot = null;
    localStorage.removeItem(FINAL_MAP_VIEWER_KEY_V40);
    renderViewer(resultsNode, null);
    updateSummary();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      finalInput.value = String(reader.result ?? "");
      buildSnapshotFromInput();
    };
    reader.readAsText(file);
  });

  window.addEventListener("dcl:final-map-layer-updated", () => {
    if (!finalInput.value.trim()) {
      finalInput.value = localStorage.getItem(FINAL_MAP_LAYER_KEY_V39) ?? "";
      buildSnapshotFromInput();
    }
  });

  const latestFinalLayer = localStorage.getItem(FINAL_MAP_LAYER_KEY_V39);
  if (latestFinalLayer) {
    finalInput.value = latestFinalLayer;
    buildSnapshotFromInput();
  } else {
    updateSummary();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountFinalMapLayerViewer);
} else {
  mountFinalMapLayerViewer();
}
