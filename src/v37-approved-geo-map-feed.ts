export {};

const GEO_MAP_FEED_APP_VERSION = "3.7.0" as const;
const GEO_MAP_FEED_SCHEMA = "DataCenterLedger.ApprovedGeoMapFeed.v3.7" as const;
const GEO_MAP_FEED_STORAGE_KEY = "datacenter-ledger.approved-geo-map-feed.v3.7";
const GEO_INTAKE_STORAGE_KEY_V36 = "datacenter-ledger.geo-intake-review.v3.6";

const GEO_MAP_FEED_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Only v3.6 approved_geo_intake records become map-feed candidates.",
  "Approved map-feed records are review candidates, not proof of source truth, completeness, or publication authorization."
];

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

type GeoIntakeRecord = {
  draftRecord: DraftGeoReviewRecord;
  decision: GeoIntakeDecision;
  eligibleForMapLayer: boolean;
};

type GeoIntakeReviewPacket = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
  sourceBridge?: {
    schema: string;
    bridgeDigest: string;
    generatedAt: string;
    draftRecordCount: number;
    sourceBatchDigest: string;
  };
  decisionSummary?: {
    totalDrafts: number;
    approved: number;
    held: number;
    rejected: number;
    pending: number;
    mapEligible: number;
  };
  intakeRecords: GeoIntakeRecord[];
  safetyBoundary?: string[];
  reviewOnlyNotice?: string;
  intakeDigest: string;
};

type ApprovedGeoMapRecord = {
  recordId: string;
  draftId: string;
  title: string;
  operator: string;
  state: string;
  county: string;
  city: string;
  mapPrecision: string;
  geoPrecision: string;
  publicAddress: string;
  latitude: string;
  longitude: string;
  coordinateBasis: string;
  status: "approved_geo_map_candidate";
  evidenceClass: string;
  evidenceUrl: string;
  locationConfidence: number | null;
  sourceQualityScore: number | null;
  sourceRowDigest: string;
  sourceBatchDigest: string;
  sourceBridgeDigest: string;
  sourceIntakeDigest: string;
  decisionReceiptDigest: string;
  approvedBy: string;
  approvedAt: string;
  reviewerNotes: string;
  warningCount: number;
  mapFeedRecordDigest: string;
};

type ApprovedGeoMapFeedPacket = {
  schema: typeof GEO_MAP_FEED_SCHEMA;
  generatedAt: string;
  appVersion: typeof GEO_MAP_FEED_APP_VERSION;
  sourceIntake: {
    schema: string;
    intakeDigest: string;
    generatedAt: string;
    approved: number;
    held: number;
    rejected: number;
    pending: number;
    mapEligible: number;
  };
  summary: {
    approvedMapRecords: number;
    statesRepresented: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
    publicAddressRecords: number;
    warningRecords: number;
  };
  mapRecords: ApprovedGeoMapRecord[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  feedDigest: string;
};

function geoFeedDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `gfeed-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function geoFeedEscape(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireGeoFeedElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.7 control: ${selector}`);
  }
  return element;
}

function downloadGeoFeedJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseGeoIntakePacketJson(text: string): GeoIntakeReviewPacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<GeoIntakeReviewPacket>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!Array.isArray(parsed.intakeRecords) || typeof parsed.intakeDigest !== "string") {
      return null;
    }
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: String(parsed.generatedAt ?? new Date().toISOString()),
      appVersion: parsed.appVersion,
      sourceBridge: parsed.sourceBridge,
      decisionSummary: parsed.decisionSummary,
      intakeRecords: parsed.intakeRecords,
      safetyBoundary: parsed.safetyBoundary,
      reviewOnlyNotice: parsed.reviewOnlyNotice,
      intakeDigest: parsed.intakeDigest
    };
  } catch {
    return null;
  }
}

function normalizeFeedPrecision(value: string) {
  const precision = value.trim().toLowerCase();
  if (precision === "public_address" || precision === "public address") return "public_address";
  if (precision === "city") return "city";
  if (precision === "county") return "county";
  if (precision === "state") return "state";
  if (precision === "approximate") return "approximate";
  return "unknown";
}

function feedRecordFromIntake(record: GeoIntakeRecord, intake: GeoIntakeReviewPacket): ApprovedGeoMapRecord | null {
  if (!record.eligibleForMapLayer || record.decision.status !== "approved_geo_intake") {
    return null;
  }

  const draft = record.draftRecord;
  const sourceBridgeDigest = intake.sourceBridge?.bridgeDigest ?? "unknown";
  const core = {
    sourceRecordId: draft.sourceRecordId,
    draftId: draft.draftId,
    sourceRowDigest: draft.sourceRowDigest,
    sourceBatchDigest: draft.sourceBatchDigest,
    sourceBridgeDigest,
    sourceIntakeDigest: intake.intakeDigest,
    decisionReceiptDigest: record.decision.receiptDigest
  };

  const mapFeedRecordDigest = geoFeedDigest(core);

  return {
    recordId: draft.sourceRecordId || draft.draftId,
    draftId: draft.draftId,
    title: draft.title || "Untitled geo record",
    operator: draft.operator || "Unknown operator",
    state: draft.state || "UNKNOWN",
    county: draft.county || "",
    city: draft.city || "",
    mapPrecision: normalizeFeedPrecision(draft.geoPrecision || draft.mapSafety.precisionLabel),
    geoPrecision: normalizeFeedPrecision(draft.geoPrecision || draft.mapSafety.precisionLabel),
    publicAddress: draft.publicAddress || "",
    latitude: draft.latitude || "",
    longitude: draft.longitude || "",
    coordinateBasis: draft.coordinateBasis || "",
    status: "approved_geo_map_candidate",
    evidenceClass: draft.locationEvidence.class || "public_record",
    evidenceUrl: draft.locationEvidence.url || "",
    locationConfidence: draft.locationEvidence.confidence,
    sourceQualityScore: draft.locationEvidence.confidence,
    sourceRowDigest: draft.sourceRowDigest,
    sourceBatchDigest: draft.sourceBatchDigest,
    sourceBridgeDigest,
    sourceIntakeDigest: intake.intakeDigest,
    decisionReceiptDigest: record.decision.receiptDigest,
    approvedBy: record.decision.reviewerName || "Geo reviewer",
    approvedAt: record.decision.decidedAt || new Date().toISOString(),
    reviewerNotes: record.decision.notes || draft.notes || "",
    warningCount: draft.mapSafety.warningCount,
    mapFeedRecordDigest
  };
}

function buildApprovedGeoMapFeed(intake: GeoIntakeReviewPacket): ApprovedGeoMapFeedPacket {
  const generatedAt = new Date().toISOString();
  const mapRecords = intake.intakeRecords
    .map((record) => feedRecordFromIntake(record, intake))
    .filter((record): record is ApprovedGeoMapRecord => record !== null);
  const states = new Set(mapRecords.map((record) => record.state).filter(Boolean));
  const packetCore: Omit<ApprovedGeoMapFeedPacket, "feedDigest"> = {
    schema: GEO_MAP_FEED_SCHEMA,
    generatedAt,
    appVersion: GEO_MAP_FEED_APP_VERSION,
    sourceIntake: {
      schema: intake.schema,
      intakeDigest: intake.intakeDigest,
      generatedAt: intake.generatedAt,
      approved: intake.decisionSummary?.approved ?? mapRecords.length,
      held: intake.decisionSummary?.held ?? 0,
      rejected: intake.decisionSummary?.rejected ?? 0,
      pending: intake.decisionSummary?.pending ?? 0,
      mapEligible: intake.decisionSummary?.mapEligible ?? mapRecords.length
    },
    summary: {
      approvedMapRecords: mapRecords.length,
      statesRepresented: states.size,
      cityPrecisionRecords: mapRecords.filter((record) => record.mapPrecision === "city").length,
      countyPrecisionRecords: mapRecords.filter((record) => record.mapPrecision === "county").length,
      statePrecisionRecords: mapRecords.filter((record) => record.mapPrecision === "state").length,
      publicAddressRecords: mapRecords.filter((record) => record.mapPrecision === "public_address").length,
      warningRecords: mapRecords.filter((record) => record.warningCount > 0).length
    },
    mapRecords,
    safetyBoundary: [...GEO_MAP_FEED_BOUNDARY],
    reviewOnlyNotice: "This approved geo map feed is a local review handoff for the map layer. It does not prove source truth, certify facility status, discover facilities, or authorize sensitive publication."
  };
  return {
    ...packetCore,
    feedDigest: geoFeedDigest(packetCore)
  };
}

function renderGeoFeedRows(container: HTMLElement, feed: ApprovedGeoMapFeedPacket | null) {
  if (!feed) {
    container.innerHTML = `<div class="geo-feed-empty">No approved geo map feed built yet.</div>`;
    return;
  }

  if (feed.mapRecords.length === 0) {
    container.innerHTML = `<div class="geo-feed-empty">No approved v3.6 intake records were eligible for the map feed.</div>`;
    return;
  }

  container.innerHTML = `<table class="geo-feed-table">
    <thead><tr><th>Record</th><th>Location</th><th>Precision</th><th>Evidence</th><th>Reviewer</th></tr></thead>
    <tbody>
      ${feed.mapRecords.map((record) => `<tr>
        <td><strong>${geoFeedEscape(record.recordId)}</strong><br/><span>${geoFeedEscape(record.title)}</span><br/><small>${geoFeedEscape(record.mapFeedRecordDigest)}</small></td>
        <td>${geoFeedEscape(record.state)}<br/><small>${geoFeedEscape([record.county, record.city].filter(Boolean).join(" / ") || "No county/city")}</small></td>
        <td>${geoFeedEscape(record.mapPrecision)}<br/><small>${record.warningCount} warnings</small></td>
        <td><a href="${geoFeedEscape(record.evidenceUrl || "#")}" target="_blank" rel="noreferrer">${geoFeedEscape(record.evidenceClass)}</a><br/><small>Confidence ${record.locationConfidence ?? "—"}</small></td>
        <td>${geoFeedEscape(record.approvedBy)}<br/><small>${geoFeedEscape(record.approvedAt)}</small></td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

function mountApprovedGeoMapFeed() {
  const existing = document.getElementById("approved-geo-map-feed-v37");
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement("section");
  panel.id = "approved-geo-map-feed-v37";
  panel.className = "geo-feed-panel";
  panel.innerHTML = `
    <div class="geo-feed-header">
      <p class="eyebrow">v3.7 Approved Geo Intake Map Feed</p>
      <h2>Feed approved intake records into the map layer</h2>
      <p>Load a v3.6 geo intake packet, keep only approved map-eligible records, store a local map feed, and export a review-only feed packet.</p>
    </div>
    <div class="geo-feed-controls">
      <button type="button" data-action="load-latest">Load latest v3.6 intake</button>
      <label class="geo-feed-file">Load intake JSON<input type="file" accept="application/json,.json" data-role="file" /></label>
      <button type="button" data-action="parse">Build map feed</button>
      <button type="button" data-action="export">Export map feed</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="intake-json" spellcheck="false" placeholder="Paste a DataCenterLedger.GeoIntakeReview.v3.6 packet here..."></textarea>
    <div class="geo-feed-summary" data-role="summary">
      <span>Approved map records: 0</span><span>States: 0</span><span>Warnings: 0</span><span>Digest: none</span>
    </div>
    <div class="geo-feed-boundary">
      ${GEO_MAP_FEED_BOUNDARY.map((item) => `<span>${geoFeedEscape(item)}</span>`).join("")}
    </div>
    <div class="geo-feed-results" data-role="results"><div class="geo-feed-empty">No intake packet loaded yet.</div></div>
  `;

  const anchor = document.getElementById("geo-intake-review-v36") ?? document.getElementById("root");
  if (anchor) {
    anchor.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }

  const intakeInput = requireGeoFeedElement<HTMLTextAreaElement>(panel, '[data-role="intake-json"]');
  const fileInput = requireGeoFeedElement<HTMLInputElement>(panel, '[data-role="file"]');
  const summaryNode = requireGeoFeedElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireGeoFeedElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireGeoFeedElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const parseButton = requireGeoFeedElement<HTMLButtonElement>(panel, '[data-action="parse"]');
  const exportButton = requireGeoFeedElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireGeoFeedElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentIntake: GeoIntakeReviewPacket | null = null;
  let currentFeed: ApprovedGeoMapFeedPacket | null = null;

  function updateSummary() {
    const summary = currentFeed?.summary;
    summaryNode.innerHTML = `<span>Approved map records: ${summary?.approvedMapRecords ?? 0}</span><span>States: ${summary?.statesRepresented ?? 0}</span><span>Warnings: ${summary?.warningRecords ?? 0}</span><span>Digest: ${geoFeedEscape(currentFeed?.feedDigest ?? "none")}</span>`;
  }

  function buildFromInput() {
    const parsed = parseGeoIntakePacketJson(intakeInput.value);
    if (!parsed) {
      currentIntake = null;
      currentFeed = null;
      localStorage.removeItem(GEO_MAP_FEED_STORAGE_KEY);
      renderGeoFeedRows(resultsNode, null);
      updateSummary();
      return;
    }
    currentIntake = parsed;
    currentFeed = buildApprovedGeoMapFeed(parsed);
    localStorage.setItem(GEO_MAP_FEED_STORAGE_KEY, JSON.stringify(currentFeed));
    window.dispatchEvent(new CustomEvent("dcl:approved-geo-map-feed-updated", { detail: { feedDigest: currentFeed.feedDigest } }));
    renderGeoFeedRows(resultsNode, currentFeed);
    updateSummary();
  }

  loadLatestButton.addEventListener("click", () => {
    const stored = localStorage.getItem(GEO_INTAKE_STORAGE_KEY_V36);
    intakeInput.value = stored ?? "";
    buildFromInput();
  });

  parseButton.addEventListener("click", buildFromInput);

  exportButton.addEventListener("click", () => {
    if (!currentFeed) {
      buildFromInput();
    }
    if (!currentFeed) {
      return;
    }
    downloadGeoFeedJson(`approved-geo-map-feed-${currentFeed.feedDigest}.json`, currentFeed);
  });

  clearButton.addEventListener("click", () => {
    intakeInput.value = "";
    currentIntake = null;
    currentFeed = null;
    localStorage.removeItem(GEO_MAP_FEED_STORAGE_KEY);
    renderGeoFeedRows(resultsNode, null);
    updateSummary();
    window.dispatchEvent(new CustomEvent("dcl:approved-geo-map-feed-updated", { detail: { cleared: true } }));
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      intakeInput.value = typeof reader.result === "string" ? reader.result : "";
      buildFromInput();
    });
    reader.readAsText(file);
  });
}

function startApprovedGeoMapFeed() {
  requestAnimationFrame(mountApprovedGeoMapFeed);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApprovedGeoMapFeed, { once: true });
} else {
  startApprovedGeoMapFeed();
}
