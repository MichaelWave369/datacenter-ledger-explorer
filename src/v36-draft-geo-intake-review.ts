export {};

const GEO_INTAKE_APP_VERSION = "3.6.0" as const;
const GEO_INTAKE_SCHEMA = "DataCenterLedger.GeoIntakeReview.v3.6" as const;
const GEO_INTAKE_STORAGE_KEY = "datacenter-ledger.geo-intake-review.v3.6";
const GEO_STAGING_STORAGE_KEY_V35 = "datacenter-ledger.geo-staging-bridge.v3.5";

const GEO_INTAKE_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Draft geo records remain claims until a reviewer approves, holds, or rejects them.",
  "Approved intake records are map candidates, not proof of source truth or permanent publication approval."
];

type DraftGeoReviewRecord = {
  draftId: string;
  sourceRecordId: string;
  title: string;
  operator: string;
  reviewStatus: string;
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
  action: string;
  createdAt: string;
  sourceBatchDigest: string;
  sourceRowDigest: string;
  draftId: string;
  sourceRecordId: string;
  warnings: string[];
  digest: string;
};

type GeoStagingBridgePacket = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
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
  safetyBoundary?: string[];
  reviewOnlyNotice?: string;
  bridgeDigest: string;
};

type GeoIntakeDecisionStatus = "pending" | "approved_geo_intake" | "held_geo_intake" | "rejected_geo_intake";

type GeoIntakeDecision = {
  draftId: string;
  sourceRecordId: string;
  status: GeoIntakeDecisionStatus;
  reviewerName: string;
  decidedAt: string;
  notes: string;
  receiptDigest: string;
};

type GeoIntakeRecord = {
  draftRecord: DraftGeoReviewRecord;
  decision: GeoIntakeDecision;
  eligibleForMapLayer: boolean;
};

type GeoIntakeReviewPacket = {
  schema: typeof GEO_INTAKE_SCHEMA;
  generatedAt: string;
  appVersion: typeof GEO_INTAKE_APP_VERSION;
  sourceBridge: {
    schema: string;
    bridgeDigest: string;
    generatedAt: string;
    draftRecordCount: number;
    sourceBatchDigest: string;
  };
  decisionSummary: {
    totalDrafts: number;
    approved: number;
    held: number;
    rejected: number;
    pending: number;
    mapEligible: number;
  };
  intakeRecords: GeoIntakeRecord[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  intakeDigest: string;
};

function geoIntakeDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `gint-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function geoIntakeEscape(value: string) {
  return value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireGeoIntakeElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.6 control: ${selector}`);
  }
  return element;
}

function downloadGeoIntakeJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseGeoStagingBridgeJson(text: string): GeoStagingBridgePacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<GeoStagingBridgePacket>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!Array.isArray(parsed.draftRecords) || typeof parsed.bridgeDigest !== "string") {
      return null;
    }
    const sourceBatch = parsed.sourceBatch ?? {
      schema: "unknown",
      batchDigest: "unknown",
      rowCount: parsed.draftRecords.length,
      stagedCount: parsed.draftRecords.length,
      blockedCount: 0,
      warningCount: 0
    };
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: String(parsed.generatedAt ?? new Date().toISOString()),
      appVersion: parsed.appVersion,
      sourceBatch: {
        schema: String(sourceBatch.schema ?? "unknown"),
        batchDigest: String(sourceBatch.batchDigest ?? "unknown"),
        generatedAt: sourceBatch.generatedAt,
        rowCount: Number(sourceBatch.rowCount ?? parsed.draftRecords.length),
        stagedCount: Number(sourceBatch.stagedCount ?? parsed.draftRecords.length),
        blockedCount: Number(sourceBatch.blockedCount ?? 0),
        warningCount: Number(sourceBatch.warningCount ?? 0)
      },
      draftRecordCount: Number(parsed.draftRecordCount ?? parsed.draftRecords.length),
      warningRecordCount: Number(parsed.warningRecordCount ?? 0),
      blockedRowsExcluded: Number(parsed.blockedRowsExcluded ?? 0),
      draftRecords: parsed.draftRecords,
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
      safetyBoundary: Array.isArray(parsed.safetyBoundary) ? parsed.safetyBoundary : [],
      reviewOnlyNotice: parsed.reviewOnlyNotice,
      bridgeDigest: parsed.bridgeDigest
    };
  } catch {
    return null;
  }
}

function makeDecision(draft: DraftGeoReviewRecord, status: GeoIntakeDecisionStatus, reviewerName: string, notes: string): GeoIntakeDecision {
  const decidedAt = new Date().toISOString();
  const core = {
    draftId: draft.draftId,
    sourceRecordId: draft.sourceRecordId,
    status,
    reviewerName,
    decidedAt,
    notes,
    sourceRowDigest: draft.sourceRowDigest,
    sourceBatchDigest: draft.sourceBatchDigest
  };
  return {
    draftId: draft.draftId,
    sourceRecordId: draft.sourceRecordId,
    status,
    reviewerName,
    decidedAt,
    notes,
    receiptDigest: geoIntakeDigest(core)
  };
}

function pendingDecision(draft: DraftGeoReviewRecord): GeoIntakeDecision {
  return {
    draftId: draft.draftId,
    sourceRecordId: draft.sourceRecordId,
    status: "pending",
    reviewerName: "",
    decidedAt: "",
    notes: "",
    receiptDigest: geoIntakeDigest({ draftId: draft.draftId, status: "pending" })
  };
}

function isMapEligible(decision: GeoIntakeDecision) {
  return decision.status === "approved_geo_intake";
}

function makeGeoIntakePacket(bridge: GeoStagingBridgePacket, decisions: Record<string, GeoIntakeDecision>): GeoIntakeReviewPacket {
  const generatedAt = new Date().toISOString();
  const intakeRecords = bridge.draftRecords.map((draft) => {
    const decision = decisions[draft.draftId] ?? pendingDecision(draft);
    return {
      draftRecord: draft,
      decision,
      eligibleForMapLayer: isMapEligible(decision)
    };
  });
  const approved = intakeRecords.filter((record) => record.decision.status === "approved_geo_intake").length;
  const held = intakeRecords.filter((record) => record.decision.status === "held_geo_intake").length;
  const rejected = intakeRecords.filter((record) => record.decision.status === "rejected_geo_intake").length;
  const pending = intakeRecords.filter((record) => record.decision.status === "pending").length;
  const mapEligible = intakeRecords.filter((record) => record.eligibleForMapLayer).length;
  const packetCore: Omit<GeoIntakeReviewPacket, "intakeDigest"> = {
    schema: GEO_INTAKE_SCHEMA,
    generatedAt,
    appVersion: GEO_INTAKE_APP_VERSION,
    sourceBridge: {
      schema: bridge.schema,
      bridgeDigest: bridge.bridgeDigest,
      generatedAt: bridge.generatedAt,
      draftRecordCount: bridge.draftRecords.length,
      sourceBatchDigest: bridge.sourceBatch.batchDigest
    },
    decisionSummary: {
      totalDrafts: bridge.draftRecords.length,
      approved,
      held,
      rejected,
      pending,
      mapEligible
    },
    intakeRecords,
    safetyBoundary: [...GEO_INTAKE_BOUNDARY],
    reviewOnlyNotice: "This intake packet records local human review decisions for draft geo records. It does not prove source truth, certify facility status, or authorize sensitive publication."
  };
  return {
    ...packetCore,
    intakeDigest: geoIntakeDigest(packetCore)
  };
}

function decisionLabel(status: GeoIntakeDecisionStatus) {
  if (status === "approved_geo_intake") return "Approved";
  if (status === "held_geo_intake") return "Held";
  if (status === "rejected_geo_intake") return "Rejected";
  return "Pending";
}

function renderGeoIntakeRows(container: HTMLElement, bridge: GeoStagingBridgePacket | null, decisions: Record<string, GeoIntakeDecision>) {
  if (!bridge) {
    container.innerHTML = `<div class="geo-intake-empty">No bridge packet loaded yet.</div>`;
    return;
  }
  const rows = bridge.draftRecords
    .map((draft, index) => {
      const decision = decisions[draft.draftId] ?? pendingDecision(draft);
      return `<tr class="geo-intake-row ${geoIntakeEscape(decision.status)}">
        <td><strong>${geoIntakeEscape(draft.sourceRecordId)}</strong><br/><span>${geoIntakeEscape(draft.title || "Untitled")}</span><br/><small>${geoIntakeEscape(draft.draftId)}</small></td>
        <td>${geoIntakeEscape(draft.state || "—")}<br/><small>${geoIntakeEscape([draft.county, draft.city].filter(Boolean).join(" / ") || "No city/county")}</small></td>
        <td>${geoIntakeEscape(draft.geoPrecision || "—")}<br/><small>${draft.mapSafety.warningCount} warnings</small></td>
        <td><a href="${geoIntakeEscape(draft.locationEvidence.url || "#")}" target="_blank" rel="noreferrer">${geoIntakeEscape(draft.locationEvidence.class || "Evidence")}</a><br/><small>Confidence ${draft.locationEvidence.confidence ?? "—"}</small></td>
        <td><span class="geo-intake-status">${decisionLabel(decision.status)}</span><br/><small>${geoIntakeEscape(decision.reviewerName || "No reviewer")}</small></td>
        <td><input type="text" data-notes-index="${index}" value="${geoIntakeEscape(decision.notes || draft.notes || "")}" placeholder="Decision notes" /></td>
        <td class="geo-intake-decision-actions">
          <button type="button" data-decision="approved_geo_intake" data-index="${index}">Approve</button>
          <button type="button" data-decision="held_geo_intake" data-index="${index}">Hold</button>
          <button type="button" data-decision="rejected_geo_intake" data-index="${index}">Reject</button>
        </td>
      </tr>`;
    })
    .join("");
  container.innerHTML = `<table class="geo-intake-table">
    <thead><tr><th>Draft</th><th>Location</th><th>Precision</th><th>Evidence</th><th>Decision</th><th>Notes</th><th>Actions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function mountGeoIntakeReview() {
  const existing = document.getElementById("geo-intake-review-v36");
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement("section");
  panel.id = "geo-intake-review-v36";
  panel.className = "geo-intake-panel";
  panel.innerHTML = `
    <div class="geo-intake-header">
      <p class="eyebrow">v3.6 Draft Geo Intake Review</p>
      <h2>Approve, hold, or reject draft geo records before map intake</h2>
      <p>Load a v3.5 geo staging bridge packet, review each draft record, add notes, and export a local intake decision packet.</p>
    </div>
    <div class="geo-intake-controls">
      <label>Reviewer name<input type="text" data-role="reviewer" value="Geo reviewer A" /></label>
      <button type="button" data-action="load-latest">Load latest v3.5 bridge</button>
      <label class="geo-intake-file">Load bridge JSON<input type="file" accept="application/json,.json" data-role="file" /></label>
      <button type="button" data-action="parse">Parse bridge</button>
      <button type="button" data-action="export">Export intake packet</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="bridge-json" spellcheck="false" placeholder="Paste a DataCenterLedger.GeoStagingBridge.v3.5 packet here..."></textarea>
    <div class="geo-intake-summary" data-role="summary">
      <span>Drafts: 0</span><span>Approved: 0</span><span>Held: 0</span><span>Rejected: 0</span><span>Pending: 0</span>
    </div>
    <div class="geo-intake-boundary">
      ${GEO_INTAKE_BOUNDARY.map((item) => `<span>${geoIntakeEscape(item)}</span>`).join("")}
    </div>
    <div class="geo-intake-results" data-role="results"><div class="geo-intake-empty">No bridge packet loaded yet.</div></div>
  `;

  const anchor = document.getElementById("geo-staging-bridge-v35") ?? document.getElementById("root");
  if (anchor) {
    anchor.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }

  const reviewerInput = requireGeoIntakeElement<HTMLInputElement>(panel, '[data-role="reviewer"]');
  const bridgeInput = requireGeoIntakeElement<HTMLTextAreaElement>(panel, '[data-role="bridge-json"]');
  const fileInput = requireGeoIntakeElement<HTMLInputElement>(panel, '[data-role="file"]');
  const summaryNode = requireGeoIntakeElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireGeoIntakeElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireGeoIntakeElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const parseButton = requireGeoIntakeElement<HTMLButtonElement>(panel, '[data-action="parse"]');
  const exportButton = requireGeoIntakeElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireGeoIntakeElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentBridge: GeoStagingBridgePacket | null = null;
  let decisions: Record<string, GeoIntakeDecision> = {};
  let currentPacket: GeoIntakeReviewPacket | null = null;

  function refreshPacket() {
    currentPacket = currentBridge ? makeGeoIntakePacket(currentBridge, decisions) : null;
    if (currentPacket) {
      localStorage.setItem(GEO_INTAKE_STORAGE_KEY, JSON.stringify(currentPacket));
    }
  }

  function updateSummary() {
    refreshPacket();
    const summary = currentPacket?.decisionSummary;
    summaryNode.innerHTML = `<span>Drafts: ${summary?.totalDrafts ?? 0}</span><span>Approved: ${summary?.approved ?? 0}</span><span>Held: ${summary?.held ?? 0}</span><span>Rejected: ${summary?.rejected ?? 0}</span><span>Pending: ${summary?.pending ?? 0}</span>`;
  }

  function parseBridgeFromInput() {
    const parsed = parseGeoStagingBridgeJson(bridgeInput.value);
    if (!parsed) {
      currentBridge = null;
      decisions = {};
      currentPacket = null;
      renderGeoIntakeRows(resultsNode, null, decisions);
      updateSummary();
      return;
    }
    currentBridge = parsed;
    decisions = {};
    currentPacket = makeGeoIntakePacket(parsed, decisions);
    localStorage.setItem(GEO_INTAKE_STORAGE_KEY, JSON.stringify(currentPacket));
    renderGeoIntakeRows(resultsNode, currentBridge, decisions);
    updateSummary();
  }

  loadLatestButton.addEventListener("click", () => {
    const stored = localStorage.getItem(GEO_STAGING_STORAGE_KEY_V35);
    if (!stored) {
      bridgeInput.value = "";
      currentBridge = null;
      decisions = {};
      renderGeoIntakeRows(resultsNode, null, decisions);
      updateSummary();
      return;
    }
    bridgeInput.value = stored;
    parseBridgeFromInput();
  });

  parseButton.addEventListener("click", parseBridgeFromInput);

  resultsNode.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest<HTMLButtonElement>("button[data-decision]");
    if (!button || !currentBridge) {
      return;
    }
    const index = Number(button.dataset.index ?? -1);
    const status = button.dataset.decision as GeoIntakeDecisionStatus | undefined;
    const draft = currentBridge.draftRecords[index];
    if (!draft || !status || status === "pending") {
      return;
    }
    const notesInput = resultsNode.querySelector<HTMLInputElement>(`[data-notes-index="${index}"]`);
    const notes = notesInput?.value.trim() ?? "";
    decisions[draft.draftId] = makeDecision(draft, status, reviewerInput.value.trim() || "Geo reviewer", notes);
    renderGeoIntakeRows(resultsNode, currentBridge, decisions);
    updateSummary();
  });

  exportButton.addEventListener("click", () => {
    if (!currentBridge) {
      parseBridgeFromInput();
    }
    if (!currentBridge) {
      return;
    }
    refreshPacket();
    if (!currentPacket) {
      return;
    }
    downloadGeoIntakeJson(`geo-intake-review-${currentPacket.intakeDigest}.json`, currentPacket);
  });

  clearButton.addEventListener("click", () => {
    bridgeInput.value = "";
    currentBridge = null;
    decisions = {};
    currentPacket = null;
    localStorage.removeItem(GEO_INTAKE_STORAGE_KEY);
    renderGeoIntakeRows(resultsNode, null, decisions);
    updateSummary();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      bridgeInput.value = typeof reader.result === "string" ? reader.result : "";
      parseBridgeFromInput();
    });
    reader.readAsText(file);
  });
}

function startGeoIntakeReview() {
  requestAnimationFrame(mountGeoIntakeReview);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGeoIntakeReview, { once: true });
} else {
  startGeoIntakeReview();
}
