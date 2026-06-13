export {};

const FINAL_MAP_VIEWER_KEY_V40 = "datacenter-ledger.final-map-viewer.v4.0";
const PUBLIC_SHARE_PACKET_KEY_V41 = "datacenter-ledger.public-share-packet.v4.1";
const PUBLIC_SHARE_APP_VERSION = "4.1.0" as const;
const PUBLIC_SHARE_SCHEMA = "DataCenterLedger.PublicSharePacket.v4.1" as const;

const PUBLIC_SHARE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Share packets do not include reviewer-only notes or staging internals.",
  "Share packets do not upgrade location precision or add coordinates.",
  "Share packets are public review summaries, not proof of facility status or completeness."
];

const OMITTED_PUBLIC_SHARE_FIELDS = [
  "reviewerNotes",
  "approvedBy",
  "approvedAt",
  "sourceRowDigest",
  "sourceBatchDigest",
  "sourceBridgeDigest",
  "sourceIntakeDigest",
  "decisionReceiptDigest",
  "latitude",
  "longitude",
  "coordinateBasis",
  "publicAddress"
];

type GateStatus = "missing_inputs" | "blocked" | "review_required" | "export_ready" | string;
type QAStatus = "empty" | "blocked" | "review" | "clear" | string;
type RecordQAStatus = "pass" | "review" | string;

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
  schema: string;
  generatedAt: string;
  appVersion?: string;
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
  safetyBoundary?: string[];
  reviewOnlyNotice?: string;
  viewerDigest: string;
};

type PublicShareRecord = {
  publicRecordId: string;
  title: string;
  operator: string;
  state: string;
  locality: string;
  mapPrecision: string;
  qaBadge: RecordQAStatus;
  qaWarningCount: number;
  evidenceClass: string;
  evidenceUrl: string;
  locationConfidence: number | null;
  publicRecordDigest: string;
};

type PublicSharePacket = {
  schema: typeof PUBLIC_SHARE_SCHEMA;
  generatedAt: string;
  appVersion: typeof PUBLIC_SHARE_APP_VERSION;
  sourceViewer: {
    schema: string;
    viewerDigest: string;
    generatedAt: string;
    finalLayerDigest: string;
    gateStatus: GateStatus;
    qaStatus: QAStatus;
  };
  publicSummary: {
    publicRecords: number;
    statesRepresented: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
    publicAddressPrecisionRecords: number;
    warningRecords: number;
  };
  stateClusters: Array<{ state: string; count: number }>;
  publicRecords: PublicShareRecord[];
  omittedFields: string[];
  safetyBoundary: string[];
  publicShareNotice: string;
  shareDigest: string;
};

function shareDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `public-share-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function escapeShare(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireShareElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v4.1 share control: ${selector}`);
  return element;
}

function parseViewerSnapshot(text: string): FinalMapLayerViewerSnapshot | null {
  try {
    const parsed = JSON.parse(text) as Partial<FinalMapLayerViewerSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schema !== "DataCenterLedger.FinalMapLayerViewer.v4.0") return null;
    if (!parsed.sourceFinalMapLayer || !parsed.summary || !Array.isArray(parsed.records)) return null;
    if (typeof parsed.viewerDigest !== "string") return null;
    return parsed as FinalMapLayerViewerSnapshot;
  } catch {
    return null;
  }
}

function toPublicRecord(record: ViewerRecord): PublicShareRecord {
  return {
    publicRecordId: String(record.recordId ?? ""),
    title: String(record.title ?? "Untitled facility"),
    operator: String(record.operator ?? "unknown"),
    state: String(record.state ?? "").toUpperCase(),
    locality: String(record.locality ?? "unknown"),
    mapPrecision: String(record.mapPrecision ?? "unknown"),
    qaBadge: String(record.qaStatus ?? "pass"),
    qaWarningCount: Number(record.qaWarningCount ?? 0),
    evidenceClass: String(record.evidenceClass ?? ""),
    evidenceUrl: String(record.evidenceUrl ?? ""),
    locationConfidence: typeof record.locationConfidence === "number" ? record.locationConfidence : null,
    publicRecordDigest: String(record.finalRecordDigest ?? "")
  };
}

function buildPublicSharePacket(snapshot: FinalMapLayerViewerSnapshot): PublicSharePacket {
  const generatedAt = new Date().toISOString();
  const publicRecords = snapshot.records.map(toPublicRecord);
  const packetCore: Omit<PublicSharePacket, "shareDigest"> = {
    schema: PUBLIC_SHARE_SCHEMA,
    generatedAt,
    appVersion: PUBLIC_SHARE_APP_VERSION,
    sourceViewer: {
      schema: snapshot.schema,
      viewerDigest: snapshot.viewerDigest,
      generatedAt: snapshot.generatedAt,
      finalLayerDigest: snapshot.sourceFinalMapLayer.finalLayerDigest,
      gateStatus: snapshot.sourceFinalMapLayer.gateStatus,
      qaStatus: snapshot.sourceFinalMapLayer.qaStatus
    },
    publicSummary: {
      publicRecords: publicRecords.length,
      statesRepresented: snapshot.summary.statesRepresented,
      cityPrecisionRecords: snapshot.summary.cityPrecisionRecords,
      countyPrecisionRecords: snapshot.summary.countyPrecisionRecords,
      statePrecisionRecords: snapshot.summary.statePrecisionRecords,
      publicAddressPrecisionRecords: snapshot.summary.publicAddressRecords,
      warningRecords: snapshot.summary.warningRecords
    },
    stateClusters: snapshot.stateClusters.map((cluster) => ({ state: String(cluster.state), count: Number(cluster.count) })),
    publicRecords,
    omittedFields: [...OMITTED_PUBLIC_SHARE_FIELDS],
    safetyBoundary: [...PUBLIC_SHARE_BOUNDARY],
    publicShareNotice: "This share packet is a sanitized public-facing summary of a v4.0 viewer snapshot. It omits reviewer-only notes, staging/internal receipt chains, coordinates, and address details. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or represent a complete national map."
  };

  return { ...packetCore, shareDigest: shareDigest(packetCore) };
}

function downloadShareJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderSharePacket(container: HTMLElement, packet: PublicSharePacket | null) {
  if (!packet) {
    container.innerHTML = `<div class="public-share-empty">No public share packet generated yet.</div>`;
    return;
  }

  const clusters = packet.stateClusters.length > 0
    ? packet.stateClusters.map((cluster) => `<span>${escapeShare(cluster.state)} <strong>${cluster.count}</strong></span>`).join("")
    : `<span>No states represented</span>`;

  const rows = packet.publicRecords.length > 0
    ? packet.publicRecords.map((record) => `<tr>
        <td><strong>${escapeShare(record.publicRecordId)}</strong><br/><small>${escapeShare(record.publicRecordDigest)}</small></td>
        <td>${escapeShare(record.title)}<br/><small>${escapeShare(record.operator)}</small></td>
        <td>${escapeShare(record.locality)}</td>
        <td>${escapeShare(record.mapPrecision)}</td>
        <td>${escapeShare(record.qaBadge)}<br/><small>${record.qaWarningCount} warnings</small></td>
        <td>${escapeShare(record.evidenceClass)}<br/><small>${escapeShare(record.evidenceUrl || "missing")}</small></td>
      </tr>`).join("")
    : `<tr><td colspan="6">No public records in this packet.</td></tr>`;

  const omitted = packet.omittedFields.map((field) => `<span>${escapeShare(field)}</span>`).join("");

  container.innerHTML = `<div class="public-share-badges">
      <span>Gate: <strong>${escapeShare(packet.sourceViewer.gateStatus)}</strong></span>
      <span>QA: <strong>${escapeShare(packet.sourceViewer.qaStatus)}</strong></span>
      <span>Viewer: <strong>${escapeShare(packet.sourceViewer.viewerDigest)}</strong></span>
      <span>Share: <strong>${escapeShare(packet.shareDigest)}</strong></span>
    </div>
    <div class="public-share-clusters">${clusters}</div>
    <div class="public-share-omitted"><strong>Omitted from public packet:</strong>${omitted}</div>
    <table class="public-share-table">
      <thead><tr><th>Record</th><th>Facility</th><th>Location</th><th>Precision</th><th>QA</th><th>Evidence</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function mountFinalLayerPublicSharePacket() {
  const existing = document.getElementById("final-layer-public-share-v41");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.id = "final-layer-public-share-v41";
  panel.className = "public-share-panel";
  panel.innerHTML = `
    <div class="public-share-header">
      <p class="eyebrow">v4.1 Final Layer Public Share Packet</p>
      <h2>Create a public-safe share packet</h2>
      <p>Generate a sanitized public-facing packet from the v4.0 viewer snapshot. Reviewer-only notes, staging internals, coordinates, and address details are intentionally omitted.</p>
    </div>
    <div class="public-share-controls">
      <button type="button" data-action="load-latest">Load latest viewer snapshot</button>
      <label class="public-share-file">Load viewer JSON<input type="file" accept="application/json,.json" data-role="viewer-file" /></label>
      <button type="button" data-action="build">Build share packet</button>
      <button type="button" data-action="export">Export share packet</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="viewer-json" spellcheck="false" placeholder="Paste DataCenterLedger.FinalMapLayerViewer.v4.0 JSON here..."></textarea>
    <div class="public-share-summary" data-role="summary"><span>Public records: 0</span><span>States: 0</span><span>Warnings: 0</span><span>Digest: none</span></div>
    <div class="public-share-boundary">${PUBLIC_SHARE_BOUNDARY.map((item) => `<span>${escapeShare(item)}</span>`).join("")}</div>
    <div class="public-share-results" data-role="results"><div class="public-share-empty">No public share packet generated yet.</div></div>`;

  const anchor = document.getElementById("final-map-layer-viewer-v40") ?? document.getElementById("root");
  if (anchor) anchor.insertAdjacentElement("afterend", panel);
  else document.body.appendChild(panel);

  const viewerInput = requireShareElement<HTMLTextAreaElement>(panel, '[data-role="viewer-json"]');
  const fileInput = requireShareElement<HTMLInputElement>(panel, '[data-role="viewer-file"]');
  const summaryNode = requireShareElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireShareElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireShareElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const buildButton = requireShareElement<HTMLButtonElement>(panel, '[data-action="build"]');
  const exportButton = requireShareElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireShareElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentPacket: PublicSharePacket | null = null;

  const updateSummary = () => {
    summaryNode.innerHTML = `<span>Public records: ${currentPacket?.publicSummary.publicRecords ?? 0}</span><span>States: ${currentPacket?.publicSummary.statesRepresented ?? 0}</span><span>Warnings: ${currentPacket?.publicSummary.warningRecords ?? 0}</span><span>Digest: ${escapeShare(currentPacket?.shareDigest ?? "none")}</span>`;
  };

  const buildShareFromInput = () => {
    const snapshot = parseViewerSnapshot(viewerInput.value);
    currentPacket = snapshot ? buildPublicSharePacket(snapshot) : null;
    if (currentPacket) {
      localStorage.setItem(PUBLIC_SHARE_PACKET_KEY_V41, JSON.stringify(currentPacket));
      window.dispatchEvent(new CustomEvent("dcl:public-share-packet-updated", { detail: { shareDigest: currentPacket.shareDigest } }));
    } else {
      localStorage.removeItem(PUBLIC_SHARE_PACKET_KEY_V41);
    }
    renderSharePacket(resultsNode, currentPacket);
    updateSummary();
  };

  loadLatestButton.addEventListener("click", () => {
    viewerInput.value = localStorage.getItem(FINAL_MAP_VIEWER_KEY_V40) ?? "";
    buildShareFromInput();
  });

  buildButton.addEventListener("click", buildShareFromInput);
  exportButton.addEventListener("click", () => {
    if (!currentPacket) buildShareFromInput();
    if (!currentPacket) return;
    downloadShareJson(`public-share-packet-v4.1-${currentPacket.shareDigest}.json`, currentPacket);
  });
  clearButton.addEventListener("click", () => {
    viewerInput.value = "";
    currentPacket = null;
    localStorage.removeItem(PUBLIC_SHARE_PACKET_KEY_V41);
    renderSharePacket(resultsNode, null);
    updateSummary();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      viewerInput.value = String(reader.result ?? "");
      buildShareFromInput();
    };
    reader.readAsText(file);
  });

  window.addEventListener("dcl:final-map-viewer-updated", () => {
    if (!viewerInput.value.trim()) {
      viewerInput.value = localStorage.getItem(FINAL_MAP_VIEWER_KEY_V40) ?? "";
      buildShareFromInput();
    }
  });

  const latestViewer = localStorage.getItem(FINAL_MAP_VIEWER_KEY_V40);
  if (latestViewer) {
    viewerInput.value = latestViewer;
    buildShareFromInput();
  } else {
    updateSummary();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountFinalLayerPublicSharePacket);
} else {
  mountFinalLayerPublicSharePacket();
}
