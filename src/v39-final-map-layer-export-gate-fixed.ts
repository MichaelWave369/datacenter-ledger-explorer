export {};

const FINAL_MAP_APP_VERSION = "3.9.0" as const;
const FINAL_MAP_SCHEMA = "DataCenterLedger.FinalMapLayer.v3.9" as const;
const FINAL_MAP_STORAGE_KEY = "datacenter-ledger.final-map-layer.v3.9";
const MAP_QA_STORAGE_KEY_V38 = "datacenter-ledger.map-candidate-qa-report.v3.8";
const GEO_MAP_FEED_STORAGE_KEY_V37 = "datacenter-ledger.approved-geo-map-feed.v3.7";

const FINAL_MAP_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Final map layers require a matching v3.8 QA report and v3.7 approved feed.",
  "Blocked QA reports cannot be exported as final map layers.",
  "Warning-state QA reports require explicit reviewer acceptance before export."
];

type GateStatus = "missing_inputs" | "blocked" | "review_required" | "export_ready";
type QAStatus = "empty" | "blocked" | "review" | "clear";
type RecordQAStatus = "pass" | "blocked" | "review";

type ApprovedGeoMapRecord = {
  recordId: string;
  title: string;
  operator?: string;
  state: string;
  county?: string;
  city?: string;
  mapPrecision?: string;
  geoPrecision?: string;
  publicAddress?: string;
  latitude?: string;
  longitude?: string;
  coordinateBasis?: string;
  evidenceClass?: string;
  evidenceUrl?: string;
  locationConfidence?: number | null;
  sourceRowDigest?: string;
  sourceBatchDigest?: string;
  sourceBridgeDigest?: string;
  sourceIntakeDigest?: string;
  decisionReceiptDigest?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewerNotes?: string;
  mapFeedRecordDigest: string;
};

type ApprovedGeoMapFeedPacket = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
  mapRecords: ApprovedGeoMapRecord[];
  feedDigest: string;
};

type MapCandidateQARecord = {
  recordId: string;
  mapFeedRecordDigest: string;
  state: string;
  mapPrecision: string;
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  qaStatus: RecordQAStatus;
};

type MapCandidateQAReport = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
  sourceFeed: {
    schema: string;
    feedDigest: string;
    generatedAt: string;
    candidateCount: number;
  };
  summary: {
    status: QAStatus;
    totalCandidates: number;
    passCandidates: number;
    blockedCandidates: number;
    warningCandidates: number;
    infoCandidates: number;
    blockerFindings: number;
    warningFindings: number;
    infoFindings: number;
    statesRepresented: number;
  };
  checkedRecords: MapCandidateQARecord[];
  reportDigest: string;
};

type FinalMapLayerRecord = {
  recordId: string;
  title: string;
  operator: string;
  state: string;
  county: string;
  city: string;
  mapPrecision: string;
  publicAddress: string;
  latitude: string;
  longitude: string;
  coordinateBasis: string;
  status: "final_map_layer_candidate";
  evidenceClass: string;
  evidenceUrl: string;
  locationConfidence: number | null;
  qaStatus: Exclude<RecordQAStatus, "blocked">;
  qaWarningCount: number;
  qaInfoCount: number;
  reviewerNotes: string;
  approvedBy: string;
  approvedAt: string;
  sourceFeedDigest: string;
  sourceQAReportDigest: string;
  sourceMapFeedRecordDigest: string;
  sourceRowDigest: string;
  sourceBatchDigest: string;
  sourceBridgeDigest: string;
  sourceIntakeDigest: string;
  decisionReceiptDigest: string;
  finalRecordDigest: string;
};

type FinalMapLayerPacket = {
  schema: typeof FINAL_MAP_SCHEMA;
  generatedAt: string;
  appVersion: typeof FINAL_MAP_APP_VERSION;
  gateDecision: {
    status: GateStatus;
    reviewerName: string;
    reviewerNote: string;
    reviewWarningsAccepted: boolean;
    decidedAt: string;
    reason: string;
    gateDigest: string;
  };
  sourceFeed: {
    schema: string;
    feedDigest: string;
    generatedAt: string;
    candidateCount: number;
  };
  sourceQA: {
    schema: string;
    reportDigest: string;
    generatedAt: string;
    status: QAStatus;
    blockerFindings: number;
    warningFindings: number;
  };
  summary: {
    finalRecords: number;
    excludedRecords: number;
    statesRepresented: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
    publicAddressRecords: number;
    warningAcceptedRecords: number;
  };
  finalRecords: FinalMapLayerRecord[];
  excludedRecords: Array<{ recordId: string; mapFeedRecordDigest: string; reason: string }>;
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  finalLayerDigest: string;
};

function finalMapDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `fmap-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function finalMapEscape(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireFinalMapElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing v3.9 control: ${selector}`);
  return element;
}

function parseFeed(text: string): ApprovedGeoMapFeedPacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<ApprovedGeoMapFeedPacket>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.mapRecords) || typeof parsed.feedDigest !== "string") return null;
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: String(parsed.generatedAt ?? new Date().toISOString()),
      appVersion: parsed.appVersion,
      mapRecords: parsed.mapRecords,
      feedDigest: parsed.feedDigest
    };
  } catch {
    return null;
  }
}

function parseQA(text: string): MapCandidateQAReport | null {
  try {
    const parsed = JSON.parse(text) as Partial<MapCandidateQAReport>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.sourceFeed || !parsed.summary || !Array.isArray(parsed.checkedRecords) || typeof parsed.reportDigest !== "string") return null;
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: String(parsed.generatedAt ?? new Date().toISOString()),
      appVersion: parsed.appVersion,
      sourceFeed: parsed.sourceFeed,
      summary: parsed.summary,
      checkedRecords: parsed.checkedRecords,
      reportDigest: parsed.reportDigest
    };
  } catch {
    return null;
  }
}

function normalizePrecision(value: string) {
  const precision = value.trim().toLowerCase().split(" ").join("_");
  if (["public_address", "city", "county", "state", "approximate"].includes(precision)) return precision;
  return "unknown";
}

function decideGate(feed: ApprovedGeoMapFeedPacket | null, qa: MapCandidateQAReport | null, reviewerName: string, reviewerNote: string, acceptReview: boolean) {
  if (!feed || !qa) return { status: "missing_inputs" as const, reason: "Load both a v3.7 approved map feed and its v3.8 QA report." };
  if (qa.sourceFeed.feedDigest !== feed.feedDigest) return { status: "blocked" as const, reason: "The QA report feed digest does not match the approved map feed digest." };
  if (qa.summary.status === "empty") return { status: "blocked" as const, reason: "The QA report is empty and cannot authorize a final map layer." };
  if (qa.summary.status === "blocked" || qa.summary.blockerFindings > 0 || qa.summary.blockedCandidates > 0) return { status: "blocked" as const, reason: "The QA report has unresolved blockers." };
  if (qa.summary.status === "review") {
    if (!acceptReview) return { status: "review_required" as const, reason: "The QA report has warnings; reviewer acceptance is required before export." };
    if (!reviewerName.trim() || !reviewerNote.trim()) return { status: "review_required" as const, reason: "Warning-state export requires reviewer name and a review note." };
  }
  return { status: "export_ready" as const, reason: qa.summary.status === "clear" ? "QA report is clear and feed digest matches." : "QA warnings were explicitly accepted for final map-layer export." };
}

function buildFinalRecord(record: ApprovedGeoMapRecord, qaRecord: MapCandidateQARecord, feedDigest: string, qaDigest: string): FinalMapLayerRecord {
  const recordCore = {
    recordId: String(record.recordId ?? ""),
    title: String(record.title ?? "Untitled facility"),
    operator: String(record.operator ?? "unknown"),
    state: String(record.state ?? ""),
    county: String(record.county ?? ""),
    city: String(record.city ?? ""),
    mapPrecision: normalizePrecision(record.mapPrecision || record.geoPrecision || "unknown"),
    publicAddress: String(record.publicAddress ?? ""),
    latitude: String(record.latitude ?? ""),
    longitude: String(record.longitude ?? ""),
    coordinateBasis: String(record.coordinateBasis ?? ""),
    status: "final_map_layer_candidate" as const,
    evidenceClass: String(record.evidenceClass ?? ""),
    evidenceUrl: String(record.evidenceUrl ?? ""),
    locationConfidence: typeof record.locationConfidence === "number" ? record.locationConfidence : null,
    qaStatus: qaRecord.qaStatus === "review" ? "review" as const : "pass" as const,
    qaWarningCount: qaRecord.warningCount,
    qaInfoCount: qaRecord.infoCount,
    reviewerNotes: String(record.reviewerNotes ?? ""),
    approvedBy: String(record.approvedBy ?? ""),
    approvedAt: String(record.approvedAt ?? ""),
    sourceFeedDigest: feedDigest,
    sourceQAReportDigest: qaDigest,
    sourceMapFeedRecordDigest: String(record.mapFeedRecordDigest ?? ""),
    sourceRowDigest: String(record.sourceRowDigest ?? ""),
    sourceBatchDigest: String(record.sourceBatchDigest ?? ""),
    sourceBridgeDigest: String(record.sourceBridgeDigest ?? ""),
    sourceIntakeDigest: String(record.sourceIntakeDigest ?? ""),
    decisionReceiptDigest: String(record.decisionReceiptDigest ?? "")
  };
  return { ...recordCore, finalRecordDigest: finalMapDigest(recordCore) };
}

function buildPacket(feed: ApprovedGeoMapFeedPacket | null, qa: MapCandidateQAReport | null, reviewerName: string, reviewerNote: string, acceptReview: boolean): FinalMapLayerPacket {
  const generatedAt = new Date().toISOString();
  const gate = decideGate(feed, qa, reviewerName, reviewerNote, acceptReview);
  const qaByDigest = new Map<string, MapCandidateQARecord>();
  for (const checked of qa?.checkedRecords ?? []) qaByDigest.set(checked.mapFeedRecordDigest, checked);

  const sourceFeedDigest = feed?.feedDigest ?? "missing-feed";
  const sourceQaDigest = qa?.reportDigest ?? "missing-qa";
  const finalRecords = gate.status === "export_ready" && feed
    ? feed.mapRecords
        .map((record) => {
          const checked = qaByDigest.get(record.mapFeedRecordDigest);
          if (!checked || checked.qaStatus === "blocked") return null;
          return buildFinalRecord(record, checked, sourceFeedDigest, sourceQaDigest);
        })
        .filter((record): record is FinalMapLayerRecord => record !== null)
    : [];

  const includedDigests = new Set(finalRecords.map((record) => record.sourceMapFeedRecordDigest));
  const excludedRecords = (feed?.mapRecords ?? [])
    .filter((record) => !includedDigests.has(record.mapFeedRecordDigest))
    .map((record) => {
      const checked = qaByDigest.get(record.mapFeedRecordDigest);
      const reason = gate.status !== "export_ready" ? gate.reason : checked?.qaStatus === "blocked" ? "Record has blocked QA status." : "Record was not present in the QA checked-record list.";
      return { recordId: record.recordId, mapFeedRecordDigest: record.mapFeedRecordDigest, reason };
    });

  const gateCore = {
    status: gate.status,
    reviewerName: reviewerName.trim(),
    reviewerNote: reviewerNote.trim(),
    reviewWarningsAccepted: acceptReview,
    decidedAt: generatedAt,
    reason: gate.reason
  };

  const finalLayerCore: Omit<FinalMapLayerPacket, "finalLayerDigest"> = {
    schema: FINAL_MAP_SCHEMA,
    generatedAt,
    appVersion: FINAL_MAP_APP_VERSION,
    gateDecision: { ...gateCore, gateDigest: finalMapDigest(gateCore) },
    sourceFeed: {
      schema: feed?.schema ?? "missing-feed",
      feedDigest: sourceFeedDigest,
      generatedAt: feed?.generatedAt ?? "missing-feed",
      candidateCount: feed?.mapRecords.length ?? 0
    },
    sourceQA: {
      schema: qa?.schema ?? "missing-qa",
      reportDigest: sourceQaDigest,
      generatedAt: qa?.generatedAt ?? "missing-qa",
      status: qa?.summary.status ?? "empty",
      blockerFindings: qa?.summary.blockerFindings ?? 0,
      warningFindings: qa?.summary.warningFindings ?? 0
    },
    summary: {
      finalRecords: finalRecords.length,
      excludedRecords: excludedRecords.length,
      statesRepresented: new Set(finalRecords.map((record) => record.state).filter(Boolean)).size,
      cityPrecisionRecords: finalRecords.filter((record) => record.mapPrecision === "city").length,
      countyPrecisionRecords: finalRecords.filter((record) => record.mapPrecision === "county").length,
      statePrecisionRecords: finalRecords.filter((record) => record.mapPrecision === "state").length,
      publicAddressRecords: finalRecords.filter((record) => record.mapPrecision === "public_address" || record.publicAddress).length,
      warningAcceptedRecords: finalRecords.filter((record) => record.qaStatus === "review").length
    },
    finalRecords,
    excludedRecords,
    safetyBoundary: [...FINAL_MAP_BOUNDARY],
    reviewOnlyNotice: "This final map layer packet is an export gate artifact for reviewed public-record candidates. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or represent a complete national map."
  };
  return { ...finalLayerCore, finalLayerDigest: finalMapDigest(finalLayerCore) };
}

function downloadFinalMapJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderResults(container: HTMLElement, packet: FinalMapLayerPacket | null) {
  if (!packet) {
    container.innerHTML = `<div class="final-map-empty">No final map-layer gate packet generated yet.</div>`;
    return;
  }
  const rows = packet.finalRecords.length > 0
    ? packet.finalRecords.map((record) => `<tr>
        <td><strong>${finalMapEscape(record.recordId)}</strong><br/><small>${finalMapEscape(record.finalRecordDigest)}</small></td>
        <td>${finalMapEscape(record.title)}<br/><small>${finalMapEscape(record.operator)}</small></td>
        <td>${finalMapEscape(record.city || record.county || record.state)}, ${finalMapEscape(record.state)}</td>
        <td>${finalMapEscape(record.mapPrecision)}</td>
        <td>${finalMapEscape(record.qaStatus)}<br/><small>${record.qaWarningCount} warnings</small></td>
      </tr>`).join("")
    : `<tr><td colspan="5">No final records are exportable under the current gate decision.</td></tr>`;
  container.innerHTML = `<div class="final-map-decision status-${finalMapEscape(packet.gateDecision.status)}">
      <strong>${finalMapEscape(packet.gateDecision.status)}</strong>
      <span>${finalMapEscape(packet.gateDecision.reason)}</span>
    </div>
    <table class="final-map-table">
      <thead><tr><th>Record</th><th>Facility</th><th>Location</th><th>Precision</th><th>QA</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function mountFinalMapLayerExportGate() {
  const existing = document.getElementById("final-map-layer-export-gate-v39");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.id = "final-map-layer-export-gate-v39";
  panel.className = "final-map-panel";
  panel.innerHTML = `
    <div class="final-map-header">
      <p class="eyebrow">v3.9 Final Map Layer Export Gate</p>
      <h2>Require QA clearance before final map-layer export</h2>
      <p>Load a v3.8 QA report and matching v3.7 approved map feed, then export only when the gate is clear or warning-state review is explicitly accepted.</p>
    </div>
    <div class="final-map-controls">
      <button type="button" data-action="load-latest">Load latest feed + QA</button>
      <label class="final-map-file">Load feed JSON<input type="file" accept="application/json,.json" data-role="feed-file" /></label>
      <label class="final-map-file">Load QA JSON<input type="file" accept="application/json,.json" data-role="qa-file" /></label>
      <button type="button" data-action="build">Build gate packet</button>
      <button type="button" data-action="export">Export final layer</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <div class="final-map-review">
      <label>Reviewer name<input type="text" data-role="reviewer" placeholder="Reviewer name" /></label>
      <label class="final-map-checkbox"><input type="checkbox" data-role="accept-review" /> Accept warning-state QA for export</label>
      <label>Reviewer note<textarea data-role="review-note" spellcheck="true" placeholder="Required when QA status is review..."></textarea></label>
    </div>
    <div class="final-map-json-grid">
      <textarea data-role="feed-json" spellcheck="false" placeholder="Paste DataCenterLedger.ApprovedGeoMapFeed.v3.7 JSON here..."></textarea>
      <textarea data-role="qa-json" spellcheck="false" placeholder="Paste DataCenterLedger.MapCandidateQAReport.v3.8 JSON here..."></textarea>
    </div>
    <div class="final-map-summary" data-role="summary"><span>Status: none</span><span>Final records: 0</span><span>Excluded: 0</span><span>Digest: none</span></div>
    <div class="final-map-boundary">${FINAL_MAP_BOUNDARY.map((item) => `<span>${finalMapEscape(item)}</span>`).join("")}</div>
    <div class="final-map-results" data-role="results"><div class="final-map-empty">No gate packet generated yet.</div></div>`;

  const anchor = document.getElementById("map-candidate-qa-dashboard-v38") ?? document.getElementById("root");
  if (anchor) anchor.insertAdjacentElement("afterend", panel);
  else document.body.appendChild(panel);

  const feedInput = requireFinalMapElement<HTMLTextAreaElement>(panel, '[data-role="feed-json"]');
  const qaInput = requireFinalMapElement<HTMLTextAreaElement>(panel, '[data-role="qa-json"]');
  const feedFileInput = requireFinalMapElement<HTMLInputElement>(panel, '[data-role="feed-file"]');
  const qaFileInput = requireFinalMapElement<HTMLInputElement>(panel, '[data-role="qa-file"]');
  const reviewerInput = requireFinalMapElement<HTMLInputElement>(panel, '[data-role="reviewer"]');
  const reviewNoteInput = requireFinalMapElement<HTMLTextAreaElement>(panel, '[data-role="review-note"]');
  const acceptReviewInput = requireFinalMapElement<HTMLInputElement>(panel, '[data-role="accept-review"]');
  const summaryNode = requireFinalMapElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireFinalMapElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireFinalMapElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const buildButton = requireFinalMapElement<HTMLButtonElement>(panel, '[data-action="build"]');
  const exportButton = requireFinalMapElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireFinalMapElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentPacket: FinalMapLayerPacket | null = null;
  const updateSummary = () => {
    summaryNode.innerHTML = `<span>Status: ${finalMapEscape(currentPacket?.gateDecision.status ?? "none")}</span><span>Final records: ${currentPacket?.summary.finalRecords ?? 0}</span><span>Excluded: ${currentPacket?.summary.excludedRecords ?? 0}</span><span>Digest: ${finalMapEscape(currentPacket?.finalLayerDigest ?? "none")}</span>`;
  };
  const buildFromInputs = () => {
    const feed = parseFeed(feedInput.value);
    const qa = parseQA(qaInput.value);
    currentPacket = buildPacket(feed, qa, reviewerInput.value, reviewNoteInput.value, acceptReviewInput.checked);
    if (currentPacket.gateDecision.status === "export_ready") {
      localStorage.setItem(FINAL_MAP_STORAGE_KEY, JSON.stringify(currentPacket));
      window.dispatchEvent(new CustomEvent("dcl:final-map-layer-updated", { detail: { finalLayerDigest: currentPacket.finalLayerDigest } }));
    } else {
      localStorage.removeItem(FINAL_MAP_STORAGE_KEY);
    }
    renderResults(resultsNode, currentPacket);
    updateSummary();
  };

  loadLatestButton.addEventListener("click", () => {
    feedInput.value = localStorage.getItem(GEO_MAP_FEED_STORAGE_KEY_V37) ?? "";
    qaInput.value = localStorage.getItem(MAP_QA_STORAGE_KEY_V38) ?? "";
    buildFromInputs();
  });
  buildButton.addEventListener("click", buildFromInputs);
  exportButton.addEventListener("click", () => {
    if (!currentPacket) buildFromInputs();
    if (!currentPacket || currentPacket.gateDecision.status !== "export_ready") return;
    downloadFinalMapJson(`final-map-layer-${currentPacket.finalLayerDigest}.json`, currentPacket);
  });
  clearButton.addEventListener("click", () => {
    feedInput.value = "";
    qaInput.value = "";
    reviewerInput.value = "";
    reviewNoteInput.value = "";
    acceptReviewInput.checked = false;
    currentPacket = null;
    localStorage.removeItem(FINAL_MAP_STORAGE_KEY);
    renderResults(resultsNode, null);
    updateSummary();
  });
  feedFileInput.addEventListener("change", () => {
    const file = feedFileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      feedInput.value = String(reader.result ?? "");
      buildFromInputs();
    };
    reader.readAsText(file);
  });
  qaFileInput.addEventListener("change", () => {
    const file = qaFileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      qaInput.value = String(reader.result ?? "");
      buildFromInputs();
    };
    reader.readAsText(file);
  });
}

window.addEventListener("dcl:map-candidate-qa-updated", () => mountFinalMapLayerExportGate());
window.addEventListener("dcl:approved-geo-map-feed-updated", () => mountFinalMapLayerExportGate());
requestAnimationFrame(mountFinalMapLayerExportGate);
