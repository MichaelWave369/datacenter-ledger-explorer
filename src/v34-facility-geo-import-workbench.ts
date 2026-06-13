const GEO_IMPORT_APP_VERSION = "3.4.0";
const GEO_IMPORT_SCHEMA = "DataCenterLedger.FacilityGeoImportBatch.v3.4";
const GEO_IMPORT_STORAGE_KEY = "datacenter-ledger.facility-geo-import-batch.v3.4";

const GEO_IMPORT_BOUNDARY = [
  "Public-source review only.",
  "No hidden network calls.",
  "No private facility discovery.",
  "No sensitive enrichment.",
  "Exact address or coordinates require a public-source basis and reviewer review.",
  "Imported rows are staged claims until promoted through the review workflow."
];

const GEO_IMPORT_COLUMNS = [
  "recordId",
  "title",
  "operator",
  "state",
  "county",
  "city",
  "geoPrecision",
  "locationEvidenceClass",
  "locationEvidenceUrl",
  "locationConfidence",
  "publicAddress",
  "latitude",
  "longitude",
  "coordinateBasis",
  "reviewStatus",
  "geoNotes"
];

const VALID_PRECISIONS = ["state", "county", "city", "public_address", "approximate"];
const VALID_EVIDENCE_CLASSES = [
  "air_permit",
  "planning_record",
  "utility_record",
  "company_disclosure",
  "public_registry",
  "news_report",
  "open_map_signal",
  "other_public_record"
];
const VALID_REVIEW_STATUSES = ["draft", "needs_review", "reviewed", "canonical_candidate"];
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const SAMPLE_GEO_CSV = `${GEO_IMPORT_COLUMNS.join(",")}
GEO-KY-001,Example public data center record,Example Operator,KY,Greenup,Russell,city,planning_record,https://example.gov/planning-record,72,,,,,needs_review,City-level only until public location basis is reviewed
GEO-VA-001,Example permitted facility,Example Compute,VA,Loudoun,Ashburn,public_address,air_permit,https://example.gov/air-permit,84,Publicly listed facility address,39.0438,-77.4874,Published permit location,needs_review,Exact fields require human review before map promotion`;

type GeoImportStatus = "staged" | "warning" | "blocked";

type FacilityGeoRow = {
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
  status: GeoImportStatus;
  blockers: string[];
  warnings: string[];
  record: FacilityGeoRow;
  raw: Record<string, string>;
  digest: string;
};

type FacilityGeoImportBatch = {
  schema: typeof GEO_IMPORT_SCHEMA;
  generatedAt: string;
  appVersion: typeof GEO_IMPORT_APP_VERSION;
  rowCount: number;
  stagedCount: number;
  blockedCount: number;
  warningCount: number;
  columns: string[];
  stagedRows: GeoImportValidation[];
  blockedRows: GeoImportValidation[];
  warningRows: GeoImportValidation[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  batchDigest: string;
};

function stableDigest(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return `geo-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function escapeHtml(value: string) {
  return value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? "";
    const nextChar = text[index + 1] ?? "";

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some((item) => item.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((item) => item.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function isLikelyUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

function toNumberOrNull(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validationStatus(blockers: string[], warnings: string[]): GeoImportStatus {
  if (blockers.length > 0) {
    return "blocked";
  }
  if (warnings.length > 0) {
    return "warning";
  }
  return "staged";
}

function validateGeoRow(raw: Record<string, string>, rowNumber: number): GeoImportValidation {
  const confidence = toNumberOrNull(raw.locationConfidence ?? "");
  const record: FacilityGeoRow = {
    recordId: raw.recordId ?? "",
    title: raw.title ?? "",
    operator: raw.operator ?? "",
    state: (raw.state ?? "").toUpperCase(),
    county: raw.county ?? "",
    city: raw.city ?? "",
    geoPrecision: raw.geoPrecision ?? "",
    locationEvidenceClass: raw.locationEvidenceClass ?? "",
    locationEvidenceUrl: raw.locationEvidenceUrl ?? "",
    locationConfidence: confidence,
    publicAddress: raw.publicAddress ?? "",
    latitude: raw.latitude ?? "",
    longitude: raw.longitude ?? "",
    coordinateBasis: raw.coordinateBasis ?? "",
    reviewStatus: raw.reviewStatus || "needs_review",
    geoNotes: raw.geoNotes ?? ""
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const field of ["recordId", "title", "state", "geoPrecision", "locationEvidenceClass", "locationEvidenceUrl", "locationConfidence"]) {
    if (!(raw[field] ?? "").trim()) {
      blockers.push(`Missing required field: ${field}`);
    }
  }

  if (record.state && !US_STATES.includes(record.state)) {
    blockers.push("State must be a U.S. postal abbreviation or DC.");
  }
  if (record.geoPrecision && !VALID_PRECISIONS.includes(record.geoPrecision)) {
    blockers.push(`Invalid geoPrecision: ${record.geoPrecision}`);
  }
  if (record.locationEvidenceClass && !VALID_EVIDENCE_CLASSES.includes(record.locationEvidenceClass)) {
    blockers.push(`Invalid locationEvidenceClass: ${record.locationEvidenceClass}`);
  }
  if (record.reviewStatus && !VALID_REVIEW_STATUSES.includes(record.reviewStatus)) {
    blockers.push(`Invalid reviewStatus: ${record.reviewStatus}`);
  }
  if (record.locationEvidenceUrl && !isLikelyUrl(record.locationEvidenceUrl)) {
    blockers.push("locationEvidenceUrl must start with http:// or https://.");
  }
  if (confidence === null || confidence < 0 || confidence > 100) {
    blockers.push("locationConfidence must be a number from 0 to 100.");
  }

  if (record.geoPrecision === "county" && !record.county) {
    warnings.push("County precision should include county.");
  }
  if (record.geoPrecision === "city" && !record.city) {
    warnings.push("City precision should include city.");
  }
  if (record.geoPrecision === "public_address" && !record.publicAddress) {
    warnings.push("Public-address precision should include publicAddress.");
  }
  if ((record.latitude || record.longitude) && (!record.latitude || !record.longitude)) {
    blockers.push("Latitude and longitude must be provided together.");
  }
  if ((record.latitude || record.longitude) && !record.coordinateBasis) {
    blockers.push("Coordinates require coordinateBasis.");
  }
  if (record.publicAddress && record.geoPrecision !== "public_address") {
    warnings.push("Public address supplied while precision is not public_address.");
  }
  if (record.geoPrecision === "approximate" && !record.geoNotes) {
    warnings.push("Approximate precision should explain the approximation in geoNotes.");
  }

  return {
    rowNumber,
    status: validationStatus(blockers, warnings),
    blockers,
    warnings,
    record,
    raw,
    digest: stableDigest({ rowNumber, record })
  };
}

function validateCsv(text: string) {
  const parsed = parseCsv(text);
  if (parsed.length === 0) {
    return [];
  }

  const header = parsed[0] ?? [];
  const rows = parsed.slice(1);
  const headerIndex = new Map<string, number>();
  header.forEach((name, index) => headerIndex.set(name.trim(), index));

  const validations = rows.map((row, index) => {
    const raw: Record<string, string> = {};
    for (const column of GEO_IMPORT_COLUMNS) {
      const columnIndex = headerIndex.get(column);
      raw[column] = columnIndex === undefined ? "" : row[columnIndex] ?? "";
    }
    return validateGeoRow(raw, index + 2);
  });

  const recordIdCounts = new Map<string, number>();
  validations.forEach((validation) => {
    const recordId = validation.record.recordId;
    if (recordId) {
      recordIdCounts.set(recordId, (recordIdCounts.get(recordId) ?? 0) + 1);
    }
  });

  return validations.map((validation) => {
    const count = recordIdCounts.get(validation.record.recordId) ?? 0;
    if (count > 1) {
      validation.blockers.push("Duplicate recordId in this import batch.");
      validation.status = validationStatus(validation.blockers, validation.warnings);
    }
    return validation;
  });
}

function makeImportBatch(validations: GeoImportValidation[]): FacilityGeoImportBatch {
  const stagedRows = validations.filter((row) => row.blockers.length === 0);
  const blockedRows = validations.filter((row) => row.blockers.length > 0);
  const warningRows = validations.filter((row) => row.blockers.length === 0 && row.warnings.length > 0);
  const batchCore = {
    schema: GEO_IMPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: GEO_IMPORT_APP_VERSION,
    rowCount: validations.length,
    stagedCount: stagedRows.length,
    blockedCount: blockedRows.length,
    warningCount: warningRows.length,
    columns: GEO_IMPORT_COLUMNS,
    stagedRows,
    blockedRows,
    warningRows,
    safetyBoundary: GEO_IMPORT_BOUNDARY,
    reviewOnlyNotice: "This import batch stages public geo claims for review. It does not certify source truth or authorize exact-location publication."
  };
  return {
    ...batchCore,
    batchDigest: stableDigest(batchCore)
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

function queryRequired<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.4 control: ${selector}`);
  }
  return element;
}

function renderImportResults(container: HTMLElement, validations: GeoImportValidation[]) {
  if (validations.length === 0) {
    container.innerHTML = `<div class="geo-import-empty">No CSV rows validated yet.</div>`;
    return;
  }

  const rows = validations
    .map((validation) => {
      const details = [...validation.blockers, ...validation.warnings]
        .map((message) => `<li>${escapeHtml(message)}</li>`)
        .join("");
      return `<tr>
        <td>${validation.rowNumber}</td>
        <td><strong>${escapeHtml(validation.record.recordId || "—")}</strong><br/><span>${escapeHtml(validation.record.title || "Untitled")}</span></td>
        <td>${escapeHtml(validation.record.state || "—")}</td>
        <td>${escapeHtml(validation.record.geoPrecision || "—")}</td>
        <td><span class="geo-import-status ${validation.status}">${validation.status}</span></td>
        <td>${details ? `<ul>${details}</ul>` : "Ready for staging"}</td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `<table class="geo-import-table">
    <thead><tr><th>CSV row</th><th>Record</th><th>State</th><th>Precision</th><th>Status</th><th>Findings</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function mountGeoImportWorkbench() {
  const existing = document.getElementById("facility-geo-import-workbench-v34");
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement("section");
  panel.id = "facility-geo-import-workbench-v34";
  panel.className = "geo-import-panel";
  panel.innerHTML = `
    <div class="geo-import-header">
      <p class="eyebrow">v3.4 Facility Geo Import Workbench</p>
      <h2>Validate map-safe facility rows before review</h2>
      <p>Paste or load CSV rows that follow the v3.3 facility geo schema. Rows with blockers stay out of the staged import batch; warnings remain review-visible.</p>
    </div>
    <div class="geo-import-actions">
      <button type="button" data-action="sample">Load sample CSV</button>
      <label class="geo-import-file">Load CSV file<input type="file" accept=".csv,text/csv" data-role="file" /></label>
      <button type="button" data-action="validate">Validate CSV</button>
      <button type="button" data-action="export">Export import batch</button>
      <button type="button" data-action="clear">Clear</button>
    </div>
    <textarea data-role="csv" spellcheck="false" placeholder="Paste v3.3 facility geo CSV rows here..."></textarea>
    <div class="geo-import-summary" data-role="summary">
      <span>Rows: 0</span><span>Staged: 0</span><span>Warnings: 0</span><span>Blocked: 0</span>
    </div>
    <div class="geo-import-boundary">
      ${GEO_IMPORT_BOUNDARY.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="geo-import-results" data-role="results"><div class="geo-import-empty">No CSV rows validated yet.</div></div>
  `;

  const root = document.getElementById("root");
  if (root) {
    root.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }

  const csvInput = queryRequired<HTMLTextAreaElement>(panel, '[data-role="csv"]');
  const fileInput = queryRequired<HTMLInputElement>(panel, '[data-role="file"]');
  const summaryNode = queryRequired<HTMLDivElement>(panel, '[data-role="summary"]');
  const resultsNode = queryRequired<HTMLDivElement>(panel, '[data-role="results"]');
  const sampleButton = queryRequired<HTMLButtonElement>(panel, '[data-action="sample"]');
  const validateButton = queryRequired<HTMLButtonElement>(panel, '[data-action="validate"]');
  const exportButton = queryRequired<HTMLButtonElement>(panel, '[data-action="export"]');
  const clearButton = queryRequired<HTMLButtonElement>(panel, '[data-action="clear"]');

  let currentValidations: GeoImportValidation[] = [];

  function updateSummary() {
    const staged = currentValidations.filter((row) => row.blockers.length === 0).length;
    const warnings = currentValidations.filter((row) => row.blockers.length === 0 && row.warnings.length > 0).length;
    const blocked = currentValidations.filter((row) => row.blockers.length > 0).length;
    summaryNode.innerHTML = `<span>Rows: ${currentValidations.length}</span><span>Staged: ${staged}</span><span>Warnings: ${warnings}</span><span>Blocked: ${blocked}</span>`;
  }

  function validateCurrentCsv() {
    currentValidations = validateCsv(csvInput.value);
    renderImportResults(resultsNode, currentValidations);
    updateSummary();
  }

  sampleButton.addEventListener("click", () => {
    csvInput.value = SAMPLE_GEO_CSV;
    validateCurrentCsv();
  });

  validateButton.addEventListener("click", validateCurrentCsv);

  clearButton.addEventListener("click", () => {
    csvInput.value = "";
    currentValidations = [];
    renderImportResults(resultsNode, currentValidations);
    updateSummary();
  });

  exportButton.addEventListener("click", () => {
    if (currentValidations.length === 0) {
      validateCurrentCsv();
    }
    const batch = makeImportBatch(currentValidations);
    localStorage.setItem(GEO_IMPORT_STORAGE_KEY, JSON.stringify(batch));
    downloadJson(`facility-geo-import-batch-${batch.batchDigest}.json`, batch);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      csvInput.value = typeof reader.result === "string" ? reader.result : "";
      validateCurrentCsv();
    });
    reader.readAsText(file);
  });
}

function startGeoImportWorkbench() {
  requestAnimationFrame(mountGeoImportWorkbench);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGeoImportWorkbench, { once: true });
} else {
  startGeoImportWorkbench();
}
