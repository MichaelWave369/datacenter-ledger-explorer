export {};

const MAP_QA_APP_VERSION = "3.8.0" as const;
const MAP_QA_SCHEMA = "DataCenterLedger.MapCandidateQAReport.v3.8" as const;
const MAP_QA_STORAGE_KEY = "datacenter-ledger.map-candidate-qa-report.v3.8";
const GEO_MAP_FEED_STORAGE_KEY_V37 = "datacenter-ledger.approved-geo-map-feed.v3.7";

const MAP_QA_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "QA findings are review signals, not proof of source truth or completeness.",
  "Exact/public-address precision must remain review-visible before any public map use."
];

type MapCandidatePrecision = "state" | "county" | "city" | "public_address" | "approximate" | "unknown";
type MapCandidateFindingSeverity = "blocker" | "warning" | "info";
type MapCandidateQAStatus = "empty" | "blocked" | "review" | "clear";

type ApprovedGeoMapRecord = {
  recordId: string;
  draftId?: string;
  title: string;
  operator: string;
  state: string;
  county?: string;
  city?: string;
  mapPrecision: string;
  geoPrecision?: string;
  publicAddress?: string;
  latitude?: string;
  longitude?: string;
  coordinateBasis?: string;
  status?: string;
  evidenceClass: string;
  evidenceUrl: string;
  locationConfidence: number | null;
  sourceQualityScore?: number | null;
  sourceRowDigest?: string;
  sourceBatchDigest?: string;
  sourceBridgeDigest?: string;
  sourceIntakeDigest?: string;
  decisionReceiptDigest?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewerNotes?: string;
  warningCount?: number;
  mapFeedRecordDigest: string;
};

type ApprovedGeoMapFeedPacket = {
  schema: string;
  generatedAt: string;
  appVersion?: string;
  summary?: {
    approvedMapRecords: number;
    statesRepresented: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
    publicAddressRecords: number;
    warningRecords: number;
  };
  mapRecords: ApprovedGeoMapRecord[];
  safetyBoundary?: string[];
  reviewOnlyNotice?: string;
  feedDigest: string;
};

type MapCandidateFinding = {
  recordId: string;
  mapFeedRecordDigest: string;
  severity: MapCandidateFindingSeverity;
  code: string;
  message: string;
  field: string;
  suggestedAction: string;
};

type MapCandidateQASummary = {
  status: MapCandidateQAStatus;
  totalCandidates: number;
  passCandidates: number;
  blockedCandidates: number;
  warningCandidates: number;
  infoCandidates: number;
  blockerFindings: number;
  warningFindings: number;
  infoFindings: number;
  missingEvidenceUrls: number;
  lowConfidenceRecords: number;
  exactPrecisionRecords: number;
  duplicateRecordIds: number;
  duplicateFeedDigests: number;
  statesRepresented: number;
};

type MapCandidateQAReport = {
  schema: typeof MAP_QA_SCHEMA;
  generatedAt: string;
  appVersion: typeof MAP_QA_APP_VERSION;
  sourceFeed: {
    schema: string;
    feedDigest: string;
    generatedAt: string;
    candidateCount: number;
  };
  summary: MapCandidateQASummary;
  findings: MapCandidateFinding[];
  checkedRecords: Array<{
    recordId: string;
    mapFeedRecordDigest: string;
    state: string;
    mapPrecision: MapCandidatePrecision;
    blockerCount: number;
    warningCount: number;
    infoCount: number;
    qaStatus: "pass" | "blocked" | "review";
  }>;
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  reportDigest: string;
};

function mapQaDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `mapqa-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function mapQaEscape(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function requireMapQaElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.8 control: ${selector}`);
  }
  return element;
}

function downloadMapQaJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeMapQaPrecision(value: string | undefined): MapCandidatePrecision {
  const precision = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (precision === "state") return "state";
  if (precision === "county") return "county";
  if (precision === "city") return "city";
  if (precision === "public_address") return "public_address";
  if (precision === "approximate") return "approximate";
  return "unknown";
}

function isValidEvidenceUrl(value: string) {
  const text = value.trim();
  if (!text) return false;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseApprovedGeoMapFeedJson(text: string): ApprovedGeoMapFeedPacket | null {
  try {
    const parsed = JSON.parse(text) as Partial<ApprovedGeoMapFeedPacket>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.mapRecords) || typeof parsed.feedDigest !== "string") return null;
    return {
      schema: String(parsed.schema ?? "unknown"),
      generatedAt: String(parsed.generatedAt ?? new Date().toISOString()),
      appVersion: parsed.appVersion,
      summary: parsed.summary,
      mapRecords: parsed.mapRecords,
      safetyBoundary: parsed.safetyBoundary,
      reviewOnlyNotice: parsed.reviewOnlyNotice,
      feedDigest: parsed.feedDigest
    };
  } catch {
    return null;
  }
}

function createFinding(record: ApprovedGeoMapRecord, severity: MapCandidateFindingSeverity, code: string, field: string, message: string, suggestedAction: string): MapCandidateFinding {
  return {
    recordId: record.recordId || "unknown-record",
    mapFeedRecordDigest: record.mapFeedRecordDigest || "unknown-digest",
    severity,
    code,
    field,
    message,
    suggestedAction
  };
}

function qaFindingsForRecord(record: ApprovedGeoMapRecord, duplicateRecordIds: Set<string>, duplicateDigests: Set<string>) {
  const findings: MapCandidateFinding[] = [];
  const precision = normalizeMapQaPrecision(record.mapPrecision || record.geoPrecision);
  const confidence = typeof record.locationConfidence === "number" ? record.locationConfidence : null;
  const hasLatitude = String(record.latitude ?? "").trim().length > 0;
  const hasLongitude = String(record.longitude ?? "").trim().length > 0;
  const hasAnyCoordinate = hasLatitude || hasLongitude;

  if (!String(record.recordId ?? "").trim()) {
    findings.push(createFinding(record, "blocker", "missing_record_id", "recordId", "Map candidate is missing a record ID.", "Add a stable public review record ID before map use."));
  }

  if (duplicateRecordIds.has(record.recordId)) {
    findings.push(createFinding(record, "blocker", "duplicate_record_id", "recordId", "Another map candidate uses the same record ID.", "Merge duplicates or assign distinct record IDs before exporting the map layer."));
  }

  if (!String(record.mapFeedRecordDigest ?? "").trim()) {
    findings.push(createFinding(record, "blocker", "missing_feed_digest", "mapFeedRecordDigest", "Map candidate is missing its map-feed digest.", "Regenerate the v3.7 approved map feed before QA."));
  } else if (duplicateDigests.has(record.mapFeedRecordDigest)) {
    findings.push(createFinding(record, "blocker", "duplicate_feed_digest", "mapFeedRecordDigest", "Another map candidate has the same feed digest.", "Regenerate or inspect the map feed for duplicate candidate records."));
  }

  if (!String(record.state ?? "").trim()) {
    findings.push(createFinding(record, "blocker", "missing_state", "state", "Map candidate has no state value.", "Add a state-level public location basis before map use."));
  }

  if (precision === "unknown") {
    findings.push(createFinding(record, "blocker", "unknown_precision", "mapPrecision", "Map candidate has an unknown map precision label.", "Use state, county, city, approximate, or public_address precision."));
  }

  if (!String(record.evidenceUrl ?? "").trim()) {
    findings.push(createFinding(record, "blocker", "missing_evidence_url", "evidenceUrl", "Map candidate has no public evidence URL.", "Attach a public source URL before this candidate enters a public map layer."));
  } else if (!isValidEvidenceUrl(record.evidenceUrl)) {
    findings.push(createFinding(record, "warning", "nonstandard_evidence_url", "evidenceUrl", "Evidence URL does not parse as http/https.", "Review the source URL and replace it with a stable public link if possible."));
  }

  if (!String(record.evidenceClass ?? "").trim()) {
    findings.push(createFinding(record, "warning", "missing_evidence_class", "evidenceClass", "Map candidate is missing an evidence class.", "Classify the evidence source, such as air_permit, planning_record, or company_disclosure."));
  }

  if (confidence === null) {
    findings.push(createFinding(record, "warning", "missing_confidence", "locationConfidence", "Map candidate has no location confidence score.", "Add a 0-1 location confidence value before final map release."));
  } else if (confidence < 0.6) {
    findings.push(createFinding(record, "warning", "low_confidence", "locationConfidence", "Location confidence is below 0.60.", "Hold for more review or attach stronger public location evidence."));
  } else if (confidence > 1 || confidence < 0) {
    findings.push(createFinding(record, "blocker", "invalid_confidence", "locationConfidence", "Location confidence is outside the 0-1 range.", "Normalize confidence to a 0-1 score."));
  }

  if (precision === "public_address") {
    findings.push(createFinding(record, "warning", "public_address_precision", "mapPrecision", "Candidate uses public_address precision.", "Confirm the address is already public and necessary; otherwise reduce precision to city/county/state."));
  }

  if (String(record.publicAddress ?? "").trim()) {
    findings.push(createFinding(record, "warning", "public_address_present", "publicAddress", "Candidate includes a public address field.", "Confirm the address should remain visible or reduce precision before publishing."));
  }

  if (hasAnyCoordinate && !(hasLatitude && hasLongitude)) {
    findings.push(createFinding(record, "blocker", "partial_coordinates", "latitude/longitude", "Only one coordinate value is present.", "Provide both coordinates or remove both fields."));
  }

  if (hasAnyCoordinate && !String(record.coordinateBasis ?? "").trim()) {
    findings.push(createFinding(record, "warning", "missing_coordinate_basis", "coordinateBasis", "Coordinates are present without a coordinate basis.", "Add public-source coordinate basis or reduce/remove coordinates."));
  }

  if ((record.warningCount ?? 0) > 0) {
    findings.push(createFinding(record, "info", "upstream_warnings", "warningCount", "Candidate carried upstream geo warnings from import/intake.", "Review upstream warnings before final map export."));
  }

  if (!String(record.decisionReceiptDigest ?? "").trim()) {
    findings.push(createFinding(record, "warning", "missing_decision_receipt", "decisionReceiptDigest", "Candidate is missing its intake decision receipt digest.", "Regenerate the v3.6 intake review packet or inspect the record lineage."));
  }

  return findings;
}

function buildMapCandidateQAReport(feed: ApprovedGeoMapFeedPacket): MapCandidateQAReport {
  const generatedAt = new Date().toISOString();
  const recordIdCounts = new Map<string, number>();
  const digestCounts = new Map<string, number>();

  for (const record of feed.mapRecords) {
    const recordId = String(record.recordId ?? "").trim();
    const digest = String(record.mapFeedRecordDigest ?? "").trim();
    if (recordId) recordIdCounts.set(recordId, (recordIdCounts.get(recordId) ?? 0) + 1);
    if (digest) digestCounts.set(digest, (digestCounts.get(digest) ?? 0) + 1);
  }

  const duplicateRecordIds = new Set([...recordIdCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id));
  const duplicateDigests = new Set([...digestCounts.entries()].filter(([, count]) => count > 1).map(([digest]) => digest));
  const findings = feed.mapRecords.flatMap((record) => qaFindingsForRecord(record, duplicateRecordIds, duplicateDigests));

  const findingsByDigest = new Map<string, MapCandidateFinding[]>();
  for (const finding of findings) {
    const list = findingsByDigest.get(finding.mapFeedRecordDigest) ?? [];
    list.push(finding);
    findingsByDigest.set(finding.mapFeedRecordDigest, list);
  }

  const checkedRecords = feed.mapRecords.map((record) => {
    const recordFindings = findingsByDigest.get(record.mapFeedRecordDigest) ?? [];
    const blockerCount = recordFindings.filter((finding) => finding.severity === "blocker").length;
    const warningCount = recordFindings.filter((finding) => finding.severity === "warning").length;
    const infoCount = recordFindings.filter((finding) => finding.severity === "info").length;
    return {
      recordId: record.recordId,
      mapFeedRecordDigest: record.mapFeedRecordDigest,
      state: record.state,
      mapPrecision: normalizeMapQaPrecision(record.mapPrecision || record.geoPrecision),
      blockerCount,
      warningCount,
      infoCount,
      qaStatus: blockerCount > 0 ? "blocked" as const : warningCount > 0 ? "review" as const : "pass" as const
    };
  });

  const blockerFindings = findings.filter((finding) => finding.severity === "blocker").length;
  const warningFindings = findings.filter((finding) => finding.severity === "warning").length;
  const infoFindings = findings.filter((finding) => finding.severity === "info").length;
  const statesRepresented = new Set(feed.mapRecords.map((record) => record.state).filter(Boolean)).size;
  const status: MapCandidateQAStatus = feed.mapRecords.length === 0 ? "empty" : blockerFindings > 0 ? "blocked" : warningFindings > 0 ? "review" : "clear";

  const reportCore: Omit<MapCandidateQAReport, "reportDigest"> = {
    schema: MAP_QA_SCHEMA,
    generatedAt,
    appVersion: MAP_QA_APP_VERSION,
    sourceFeed: {
      schema: feed.schema,
      feedDigest: feed.feedDigest,
      generatedAt: feed.generatedAt,
      candidateCount: feed.mapRecords.length
    },
    summary: {
      status,
      totalCandidates: feed.mapRecords.length,
      passCandidates: checkedRecords.filter((record) => record.qaStatus === "pass").length,
      blockedCandidates: checkedRecords.filter((record) => record.qaStatus === "blocked").length,
      warningCandidates: checkedRecords.filter((record) => record.qaStatus === "review").length,
      infoCandidates: checkedRecords.filter((record) => record.infoCount > 0 && record.warningCount === 0 && record.blockerCount === 0).length,
      blockerFindings,
      warningFindings,
      infoFindings,
      missingEvidenceUrls: findings.filter((finding) => finding.code === "missing_evidence_url").length,
      lowConfidenceRecords: findings.filter((finding) => finding.code === "low_confidence").length,
      exactPrecisionRecords: findings.filter((finding) => finding.code === "public_address_precision" || finding.code === "public_address_present").length,
      duplicateRecordIds: duplicateRecordIds.size,
      duplicateFeedDigests: duplicateDigests.size,
      statesRepresented
    },
    findings,
    checkedRecords,
    safetyBoundary: [...MAP_QA_BOUNDARY],
    reviewOnlyNotice: "This QA report is a local review signal for approved map candidates. It does not prove source truth, certify facility status, discover facilities, or authorize sensitive publication."
  };

  return {
    ...reportCore,
    reportDigest: mapQaDigest(reportCore)
  };
}

function renderMapQaFindings(container: HTMLElement, report: MapCandidateQAReport | null) {
  if (!report) {
    container.innerHTML = `<div class="map-qa-empty">No QA report generated yet.</div>`;
    return;
  }

  if (report.findings.length === 0) {
    container.innerHTML = `<div class="map-qa-pass">No blockers or warnings found for the current map-feed candidates.</div>`;
    return;
  }

  container.innerHTML = `<table class="map-qa-table">
    <thead><tr><th>Severity</th><th>Record</th><th>Finding</th><th>Suggested action</th></tr></thead>
    <tbody>
      ${report.findings.map((finding) => `<tr class="severity-${mapQaEscape(finding.severity)}">
        <td>${mapQaEscape(finding.severity)}</td>
        <td><strong>${mapQaEscape(finding.recordId)}</strong><br/><small>${mapQaEscape(finding.mapFeedRecordDigest)}</small></td>
        <td><strong>${mapQaEscape(finding.code)}</strong><br/>${mapQaEscape(finding.message)}<br/><small>${mapQaEscape(finding.field)}</small></td>
        <td>${mapQaEscape(finding.suggestedAction)}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

function mountMapCandidateQADashboard() {
  const existing = document.getElementById("map-candidate-qa-dashboard-v38");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.id = "map-candidate-qa-dashboard-v38";
  panel.className = "map-qa-panel";
  panel.innerHTML = `
    <div class="map-qa-header">
      <p class="eyebrow">v3.8 Map Candidate QA Dashboard</p>
      <h2>Audit approved map-feed candidates before final map layer export</h2>
      <p>Load a v3.7 approved geo map feed, check evidence and precision risks, and export a local QA report.</p>
    </div>
    <div class="map-qa-controls">
      <button type="button" data-action="load-latest">Load latest v3.7 feed</button>
      <label class="map-qa-file">Load feed JSON<input type="file" accept="application/json,.json" data-role="file" /></label>
      <button type="button" data-action="run">Run QA</button>
      <button type="button" data-action="export">Export QA report</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="feed-json" spellcheck="false" placeholder="Paste a DataCenterLedger.ApprovedGeoMapFeed.v3.7 packet here..."></textarea>
    <div class="map-qa-summary" data-role="summary">
      <span>Status: none</span><span>Candidates: 0</span><span>Blockers: 0</span><span>Warnings: 0</span><span>Digest: none</span>
    </div>
    <div class="map-qa-boundary">
      ${MAP_QA_BOUNDARY.map((item) => `<span>${mapQaEscape(item)}</span>`).join("")}
    </div>
    <div class="map-qa-results" data-role="results"><div class="map-qa-empty">No map feed loaded yet.</div></div>
  `;

  const anchor = document.getElementById("approved-geo-map-feed-v37") ?? document.getElementById("root");
  if (anchor) {
    anchor.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }

  const feedInput = requireMapQaElement<HTMLTextAreaElement>(panel, '[data-role="feed-json"]');
  const fileInput = requireMapQaElement<HTMLInputElement>(panel, '[data-role="file"]');
  const summaryNode = requireMapQaElement<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = requireMapQaElement<HTMLDivElement>(panel, '[data-role="results"]');
  const loadLatestButton = requireMapQaElement<HTMLButtonElement>(panel, '[data-action="load-latest"]');
  const runButton = requireMapQaElement<HTMLButtonElement>(panel, '[data-action="run"]');
  const exportButton = requireMapQaElement<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = requireMapQaElement<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentFeed: ApprovedGeoMapFeedPacket | null = null;
  let currentReport: MapCandidateQAReport | null = null;

  function updateSummary() {
    const summary = currentReport?.summary;
    summaryNode.innerHTML = `<span>Status: ${mapQaEscape(summary?.status ?? "none")}</span><span>Candidates: ${summary?.totalCandidates ?? 0}</span><span>Blockers: ${summary?.blockerFindings ?? 0}</span><span>Warnings: ${summary?.warningFindings ?? 0}</span><span>Digest: ${mapQaEscape(currentReport?.reportDigest ?? "none")}</span>`;
  }

  function runQaFromInput() {
    const parsed = parseApprovedGeoMapFeedJson(feedInput.value);
    if (!parsed) {
      currentFeed = null;
      currentReport = null;
      localStorage.removeItem(MAP_QA_STORAGE_KEY);
      renderMapQaFindings(resultsNode, null);
      updateSummary();
      return;
    }

    currentFeed = parsed;
    currentReport = buildMapCandidateQAReport(parsed);
    localStorage.setItem(MAP_QA_STORAGE_KEY, JSON.stringify(currentReport));
    window.dispatchEvent(new CustomEvent("dcl:map-candidate-qa-updated", { detail: { reportDigest: currentReport.reportDigest } }));
    renderMapQaFindings(resultsNode, currentReport);
    updateSummary();
  }

  loadLatestButton.addEventListener("click", () => {
    feedInput.value = localStorage.getItem(GEO_MAP_FEED_STORAGE_KEY_V37) ?? "";
    runQaFromInput();
  });

  runButton.addEventListener("click", runQaFromInput);

  exportButton.addEventListener("click", () => {
    if (!currentReport) runQaFromInput();
    if (!currentReport) return;
    downloadMapQaJson(`map-candidate-qa-report-${currentReport.reportDigest}.json`, currentReport);
  });

  clearButton.addEventListener("click", () => {
    feedInput.value = "";
    currentFeed = null;
    currentReport = null;
    localStorage.removeItem(MAP_QA_STORAGE_KEY);
    renderMapQaFindings(resultsNode, null);
    updateSummary();
    window.dispatchEvent(new CustomEvent("dcl:map-candidate-qa-updated", { detail: { cleared: true } }));
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      feedInput.value = typeof reader.result === "string" ? reader.result : "";
      runQaFromInput();
    });
    reader.readAsText(file);
  });
}

function startMapCandidateQADashboard() {
  requestAnimationFrame(mountMapCandidateQADashboard);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMapCandidateQADashboard, { once: true });
} else {
  startMapCandidateQADashboard();
}
