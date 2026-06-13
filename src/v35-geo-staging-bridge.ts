export {};

const GEO_STAGING_APP_VERSION = "3.5.0" as const;
const GEO_STAGING_SCHEMA = "DataCenterLedger.GeoStagingBridge.v3.5" as const;
const GEO_STAGING_STORAGE_KEY = "datacenter-ledger.geo-staging-bridge.v3.5";
const GEO_IMPORT_STORAGE_KEY_V34 = "datacenter-ledger.facility-geo-import-batch.v3.4";

const GEO_STAGING_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Draft geo records remain review claims until promoted by a reviewer.",
  "Exact address or coordinates remain gated by public-source basis and human review."
];

type GeoImportRecord = {
  recordId: string;
  title: string;
  operator: string;
  state: string;
  county: string;
  city: string;
  geoPrecision: string;
  locationEvidenceClass: string;
  locationEvidenceUrl: string;
  locationConfidence: number | null;
  publicAddress: string;
  latitude: string;
  longitude: string;
  coordinateBasis: string;
  reviewStatus: string;
  geoNotes: string;
};

type GeoImportValidation = {
  rowNumber: number;
  status: "staged" | "warning" | "blocked" | string;
  blockers: string[];
  warnings: string[];
  record: GeoImportRecord;
  digest: string;
};

type FacilityGeoImportBatch = {
  schema: string;
  generatedAt?: string;
  appVersion?: string;
  rowCount?: number;
  stagedCount?: number;
  blockedCount?: number;
  warningCount?: number;
  stagedRows: GeoImportValidation[];
  blockedRows?: GeoImportValidation[];
  warningRows?: GeoImportValidation[];
  batchDigest: string;
};

type DraftGeoReviewRecord = {
  draftId: string;
  sourceRecordId: string;
  title: string;
  operator: string;
  reviewStatus: "draft_geo_review";
  state: string;
  county: string;
  city: string;
  geoPrecision: string;
  publicAddress: string;
  latitude: string;
  longitude: string;
  coordinateBasis: string;
  locationEvidence: {
    class: string;
    url: string;
    confidence: number | null;
  };
  mapSafety: {
    precisionLabel: string;
    publicBasisPresent: boolean;
    exactFieldsRequireReview: boolean;
    warningCount: number;
  };
  sourceBatchDigest: string;
  sourceRowDigest: string;
  stagedAt: string;
  notes: string;
};

type GeoStagingReceipt = {
  receiptId: string;
  action: "stage_geo_import_row";
  createdAt: string;
  sourceBatchDigest: string;
  sourceRowDigest: string;
  draftId: string;
  sourceRecordId: string;
  warnings: string[];
  digest: string;
};

type GeoStagingBridgePacket = {
  schema: typeof GEO_STAGING_SCHEMA;
  generatedAt: string;
  appVersion: typeof GEO_STAGING_APP_VERSION;
  sourceBatch: {
    schema: string;
    batchDigest: string;
    generatedAt?: string;
    rowCount: number;
    stagedCount: number;
    blockedCount: number;
    warningCount: number;
  };
  draftRecordCount: number;
  warningRecordCount: number;
  blockedRowsExcluded: number;
  draftRecords: DraftGeoReviewRecord[];
  receipts: GeoStagingReceipt[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  bridgeDigest: string;
};

function geoStagingDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `gstg-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function geoStagingEscape(value: string) {
  return value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireGeoStagingElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.5 control: ${selector}`);
  }
  return element;
}

function downloadGeoStagingJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseGeoImportBatchJson(text: string): FacilityGeoImportBatch | null {
  try {
    const parsed = JSON.parse(text) as Partial<FacilityGeoImportBatch>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!Array.isArray(parsed.stagedRows) || typeof parsed.batchDigest !== "string") {
      return null;
    }
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: parsed.generatedAt,
      appVersion: parsed.appVersion,
      rowCount: Number(parsed.rowCount ?? parsed.stagedRows.length),
      stagedCount: Number(parsed.stagedCount ?? parsed.stagedRows.length),
      blockedCount: Number(parsed.blockedCount ?? 0),
      warningCount: Number(parsed.warningCount ?? 0),
      stagedRows: parsed.stagedRows,
      blockedRows: Array.isArray(parsed.blockedRows) ? parsed.blockedRows : [],
      warningRows: Array.isArray(parsed.warningRows) ? parsed.warningRows : [],
      batchDigest: parsed.batchDigest
    };
  } catch {
    return null;
  }
}

function makeDraftGeoReviewRecord(row: GeoImportValidation, batch: FacilityGeoImportBatch, stagedAt: string): DraftGeoReviewRecord {
  const record = row.record;
  const exactFieldsRequireReview = Boolean(record.publicAddress || record.latitude || record.longitude);
  const publicBasisPresent = Boolean(record.locationEvidenceUrl && record.locationEvidenceClass);
  const draftCore = {
    sourceRecordId: record.recordId,
    sourceRowDigest: row.digest,
    sourceBatchDigest: batch.batchDigest,
    stagedAt
  };
  const draftId = `draft-${geoStagingDigest(draftCore)}`;
  return {
    draftId,
    sourceRecordId: record.recordId,
    title: record.title,
    operator: record.operator,
    reviewStatus: "draft_geo_review",
    state: record.state,
    county: record.county,
    city: record.city,
    geoPrecision: record.geoPrecision,
    publicAddress: record.publicAddress,
    latitude: record.latitude,
    longitude: record.longitude,
    coordinateBasis: record.coordinateBasis,
    locationEvidence: {
      class: record.locationEvidenceClass,
      url: record.locationEvidenceUrl,
      confidence: record.locationConfidence
    },
    mapSafety: {
      precisionLabel: record.geoPrecision,
      publicBasisPresent,
      exactFieldsRequireReview,
      warningCount: row.warnings.length
    },
    sourceBatchDigest: batch.batchDigest,
    sourceRowDigest: row.digest,
    stagedAt,
    notes: record.geoNotes
  };
}

function makeGeoStagingReceipt(row: GeoImportValidation, draft: DraftGeoReviewRecord, batch: FacilityGeoImportBatch, createdAt: string): GeoStagingReceipt {
  const receiptCore = {
    action: "stage_geo_import_row" as const,
    createdAt,
    sourceBatchDigest: batch.batchDigest,
    sourceRowDigest: row.digest,
    draftId: draft.draftId,
    sourceRecordId: draft.sourceRecordId,
    warnings: [...row.warnings]
  };
  const digest = geoStagingDigest(receiptCore);
  return {
    receiptId: `receipt-${digest}`,
    ...receiptCore,
    digest
  };
}

function makeGeoStagingBridgePacket(batch: FacilityGeoImportBatch): GeoStagingBridgePacket {
  const generatedAt = new Date().toISOString();
  const draftRecords = batch.stagedRows.map((row) => makeDraftGeoReviewRecord(row, batch, generatedAt));
  const receipts = batch.stagedRows.map((row, index) => makeGeoStagingReceipt(row, draftRecords[index], batch, generatedAt));
  const packetCore: Omit<GeoStagingBridgePacket, "bridgeDigest"> = {
    schema: GEO_STAGING_SCHEMA,
    generatedAt,
    appVersion: GEO_STAGING_APP_VERSION,
    sourceBatch: {
      schema: batch.schema,
      batchDigest: batch.batchDigest,
      generatedAt: batch.generatedAt,
      rowCount: batch.rowCount ?? batch.stagedRows.length,
      stagedCount: batch.stagedCount ?? batch.stagedRows.length,
      blockedCount: batch.blockedCount ?? 0,
      warningCount: batch.warningCount ?? 0
    },
    draftRecordCount: draftRecords.length,
    warningRecordCount: batch.stagedRows.filter((row) => row.warnings.length > 0).length,
    blockedRowsExcluded: batch.blockedRows?.length ?? 0,
    draftRecords,
    receipts,
    safetyBoundary: [...GEO_STAGING_BOUNDARY],
    reviewOnlyNotice: "This bridge packet stages geo import rows as draft review records. It does not promote rows to canonical status or authorize exact-location publication."
  };
  return {
    ...packetCore,
    bridgeDigest: geoStagingDigest(packetCore)
  };
}

function renderGeoStagingPreview(container: HTMLElement, packet: GeoStagingBridgePacket | null, message = "No bridge packet built yet.") {
  if (!packet) {
    container.innerHTML = `<div class="geo-staging-empty">${geoStagingEscape(message)}</div>`;
    return;
  }
  const rows = packet.draftRecords
    .map((record) => `<tr>
      <td><strong>${geoStagingEscape(record.sourceRecordId)}</strong><br/><span>${geoStagingEscape(record.title || "Untitled")}</span></td>
      <td>${geoStagingEscape(record.state || "—")}</td>
      <td>${geoStagingEscape(record.geoPrecision || "—")}</td>
      <td>${record.mapSafety.warningCount}</td>
      <td>${geoStagingEscape(record.locationEvidence.class || "—")}</td>
      <td>${geoStagingEscape(record.draftId)}</td>
    </tr>`)
    .join("");
  container.innerHTML = `<div class="geo-staging-digest">Bridge digest: <strong>${geoStagingEscape(packet.bridgeDigest)}</strong></div>
    <table class="geo-staging-table">
      <thead><tr><th>Record</th><th>State</th><th>Precision</th><th>Warnings</th><th>Evidence</th><th>Draft ID</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function mountGeoStagingBridge() {
  const existing = document.getElementById("geo-staging-bridge-v35");
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement("section");
  panel.id = "geo-staging-bridge-v35";
  panel.className = "geo-staging-panel";
  panel.innerHTML = `
    <div class="geo-staging-header">
      <p class="eyebrow">v3.5 Geo Import Staging Bridge</p>
      <h2>Turn clean geo import rows into draft review records</h2>
      <p>Load a v3.4 facility geo import batch, convert staged rows into draft review records, create staging receipts, and export a local bridge packet.</p>
    </div>
    <div class="geo-staging-actions">
      <button type="button" data-action="load-latest">Load latest v3.4 batch</button>
      <label class="geo-staging-file">Load batch JSON<input type="file" accept="application/json,.json" data-role="file" /></label>
      <button type="button" data-action="build">Build draft queue</button>
      <button type="button" data-action="export">Export bridge packet</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="batch-json" spellcheck="false" placeholder="Paste a DataCenterLedger.FacilityGeoImportBatch.v3.4 packet here..."></textarea>
    <div class="geo-staging-summary" data-role="summary">
      <span>Drafts: 0</span><span>Receipts: 0</span><span>Warnings: 0</span><span>Blocked excluded: 0</span>
    </div>
    <div class="geo-staging-boundary">
      ${GEO_STAGING_BOUNDARY.map((item) => `<span>${geoStagingEscape(item)}</span>`).join("")}
    </div>
    <div class="geo-staging-results" data-role="results"><div class="geo-staging-empty">No bridge packet built yet.</div></div>
  `;

  const root = document.getElementById("root");
  if (root) {
    root.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }

  const batchInput = requireGeoStagingElement<HTMLTextAreaElement>(panel, '[data-role="batch-json"]');
  const fileInput = requireGeoStagingElement<HTMLInputElement>(panel, '[data-role="file"]');
  const summaryNode = requireGeoStagingElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireGeoStagingElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireGeoStagingElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const buildButton = requireGeoStagingElement<HTMLButtonElement>(panel, '[data-action="build"]');
  const exportButton = requireGeoStagingElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireGeoStagingElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentPacket: GeoStagingBridgePacket | null = null;

  function updateGeoStagingSummary() {
    summaryNode.innerHTML = `<span>Drafts: ${currentPacket?.draftRecordCount ?? 0}</span><span>Receipts: ${currentPacket?.receipts.length ?? 0}</span><span>Warnings: ${currentPacket?.warningRecordCount ?? 0}</span><span>Blocked excluded: ${currentPacket?.blockedRowsExcluded ?? 0}</span>`;
  }

  function buildCurrentBridge() {
    const batch = parseGeoImportBatchJson(batchInput.value);
    if (!batch) {
      currentPacket = null;
      renderGeoStagingPreview(resultsNode, null, "Paste or load a valid v3.4 facility geo import batch first.");
      updateGeoStagingSummary();
      return;
    }
    currentPacket = makeGeoStagingBridgePacket(batch);
    localStorage.setItem(GEO_STAGING_STORAGE_KEY, JSON.stringify(currentPacket));
    renderGeoStagingPreview(resultsNode, currentPacket);
    updateGeoStagingSummary();
  }

  loadLatestButton.addEventListener("click", () => {
    const stored = localStorage.getItem(GEO_IMPORT_STORAGE_KEY_V34);
    if (!stored) {
      currentPacket = null;
      renderGeoStagingPreview(resultsNode, null, "No v3.4 import batch found in this browser. Export one from the v3.4 workbench first.");
      updateGeoStagingSummary();
      return;
    }
    batchInput.value = stored;
    buildCurrentBridge();
  });

  buildButton.addEventListener("click", buildCurrentBridge);

  exportButton.addEventListener("click", () => {
    if (!currentPacket) {
      buildCurrentBridge();
    }
    if (!currentPacket) {
      return;
    }
    localStorage.setItem(GEO_STAGING_STORAGE_KEY, JSON.stringify(currentPacket));
    downloadGeoStagingJson(`geo-staging-bridge-${currentPacket.bridgeDigest}.json`, currentPacket);
  });

  clearButton.addEventListener("click", () => {
    batchInput.value = "";
    currentPacket = null;
    renderGeoStagingPreview(resultsNode, null);
    updateGeoStagingSummary();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      batchInput.value = typeof reader.result === "string" ? reader.result : "";
      buildCurrentBridge();
    });
    reader.readAsText(file);
  });
}

function startGeoStagingBridge() {
  requestAnimationFrame(mountGeoStagingBridge);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGeoStagingBridge, { once: true });
} else {
  startGeoStagingBridge();
}
