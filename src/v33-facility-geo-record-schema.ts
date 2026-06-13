const GEO_SCHEMA_VERSION = "3.3.0";
const GEO_SCHEMA_STORAGE_KEY = "datacenter-ledger.facility-geo-record-schema.v3.3";
const GEO_TEMPLATE_STORAGE_KEY = "datacenter-ledger.facility-geo-import-template.v3.3";

const geoSafetyBoundary = [
  "Public-source location evidence only.",
  "Default to state, county, or city precision unless exact location is already public and appropriate.",
  "Do not enrich private coordinates, security-sensitive locations, or unreviewed facility details.",
  "Map markers are review prompts, not targeting coordinates or proof of facility status.",
];

const geoReviewOnlyNotice =
  "Facility geo records organize public location claims for review. They do not verify source truth, certify facility status, or authorize sensitive infrastructure disclosure.";

type GeoPrecision = "state" | "county" | "city" | "public_address" | "approximate";
type GeoEvidenceClass =
  | "air_permit"
  | "planning_record"
  | "utility_record"
  | "company_disclosure"
  | "public_registry"
  | "news_report"
  | "open_map_signal"
  | "other_public_record";
type GeoReviewStatus = "claimed" | "reviewed" | "canonical" | "disputed" | "rejected" | "unknown";

type FieldSpec = {
  field: string;
  label: string;
  required: boolean;
  description: string;
  examples?: string[];
};

type PrecisionPolicy = {
  precision: GeoPrecision;
  label: string;
  allowedWhen: string;
  mapBehavior: string;
  reviewNotes: string;
};

type FacilityGeoRecordSchemaPacket = {
  schema: "DataCenterLedger.FacilityGeoRecordSchema.v3.3";
  appVersion: string;
  generatedAt: string;
  requiredFields: FieldSpec[];
  optionalFields: FieldSpec[];
  precisionPolicy: PrecisionPolicy[];
  evidenceClasses: GeoEvidenceClass[];
  reviewStatuses: GeoReviewStatus[];
  importColumns: string[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  packetDigest: string;
};

type FacilityGeoImportTemplatePacket = {
  schema: "DataCenterLedger.FacilityGeoImportTemplate.v3.3";
  appVersion: string;
  generatedAt: string;
  columns: string[];
  csvTemplate: string;
  sampleRecord: Record<string, string>;
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  packetDigest: string;
};

const requiredFields: FieldSpec[] = [
  {
    field: "recordId",
    label: "Record ID",
    required: true,
    description: "Stable local record identifier used to join geo evidence to a facility record.",
    examples: ["dc-va-ashburn-001"],
  },
  {
    field: "title",
    label: "Facility / project title",
    required: true,
    description: "Public-facing name from the source record or a neutral review label.",
    examples: ["Example County Data Center Project"],
  },
  {
    field: "state",
    label: "State",
    required: true,
    description: "Two-letter U.S. state abbreviation used for map-safe clustering.",
    examples: ["VA", "KY", "TX"],
  },
  {
    field: "geoPrecision",
    label: "Geo precision",
    required: true,
    description: "Map-safe precision level controlling how specific the record may appear.",
    examples: ["state", "county", "city", "public_address", "approximate"],
  },
  {
    field: "locationEvidenceClass",
    label: "Location evidence class",
    required: true,
    description: "Public evidence lane supporting the location claim.",
    examples: ["air_permit", "planning_record", "company_disclosure"],
  },
  {
    field: "locationEvidenceUrl",
    label: "Location evidence URL",
    required: true,
    description: "Public URL, docket citation, or document locator supporting the location claim.",
    examples: ["https://example.gov/permit/123"],
  },
  {
    field: "locationConfidence",
    label: "Location confidence",
    required: true,
    description: "Reviewer confidence score from 0 to 100 for the location claim only.",
    examples: ["75"],
  },
];

const optionalFields: FieldSpec[] = [
  {
    field: "operator",
    label: "Operator / developer",
    required: false,
    description: "Publicly named owner, developer, operator, or project sponsor when available.",
    examples: ["Example Cloud LLC"],
  },
  {
    field: "county",
    label: "County",
    required: false,
    description: "County name when public evidence supports county-level location.",
    examples: ["Loudoun County"],
  },
  {
    field: "city",
    label: "City / locality",
    required: false,
    description: "City, locality, or municipality when public evidence supports city-level location.",
    examples: ["Ashburn"],
  },
  {
    field: "publicAddress",
    label: "Public address",
    required: false,
    description: "Exact address only when already published by a public source and appropriate to show.",
  },
  {
    field: "publicAddressBasis",
    label: "Public address basis",
    required: false,
    description: "Why an exact public address is allowed, such as public permit, public parcel, or company filing.",
  },
  {
    field: "latitude",
    label: "Latitude",
    required: false,
    description: "Use only when coordinates are already published by a public dataset and suitable for review display.",
  },
  {
    field: "longitude",
    label: "Longitude",
    required: false,
    description: "Use only when coordinates are already published by a public dataset and suitable for review display.",
  },
  {
    field: "coordinateBasis",
    label: "Coordinate basis",
    required: false,
    description: "Public dataset or public source explaining why coordinates may be used.",
  },
  {
    field: "status",
    label: "Review status",
    required: false,
    description: "Current review status for the record, separate from source truth.",
    examples: ["claimed", "reviewed", "canonical", "disputed", "unknown"],
  },
  {
    field: "geoNotes",
    label: "Geo notes",
    required: false,
    description: "Human-readable review notes explaining precision, uncertainty, and any withheld specificity.",
  },
];

const precisionPolicy: PrecisionPolicy[] = [
  {
    precision: "state",
    label: "State only",
    allowedWhen: "Only state-level evidence exists, or specificity should be intentionally withheld.",
    mapBehavior: "Cluster at state marker only.",
    reviewNotes: "Default fallback for weak or broad public claims.",
  },
  {
    precision: "county",
    label: "County / region",
    allowedWhen: "Public record names a county or region but not a safe exact locality.",
    mapBehavior: "Cluster under state and show county in record drawer.",
    reviewNotes: "Good for permit-led review when exact site should not be inferred.",
  },
  {
    precision: "city",
    label: "City / locality",
    allowedWhen: "Public evidence names a city, town, or locality and the display remains map-safe.",
    mapBehavior: "Cluster under state and show city in record drawer.",
    reviewNotes: "Preferred precision for public civic context without exact pinpointing.",
  },
  {
    precision: "public_address",
    label: "Public address",
    allowedWhen: "Exact address is already published by a public source and appropriate for review display.",
    mapBehavior: "May be listed as public-address precision, but the v3.2 scaffold still clusters regionally.",
    reviewNotes: "Requires publicAddressBasis and careful review before public use.",
  },
  {
    precision: "approximate",
    label: "Approximate / generalized",
    allowedWhen: "A public source supports the general area, but exact specificity is uncertain or should be generalized.",
    mapBehavior: "Treat as generalized review marker, never exact coordinates.",
    reviewNotes: "Use for uncertain, reconciled, or intentionally softened claims.",
  },
];

const evidenceClasses: GeoEvidenceClass[] = [
  "air_permit",
  "planning_record",
  "utility_record",
  "company_disclosure",
  "public_registry",
  "news_report",
  "open_map_signal",
  "other_public_record",
];

const reviewStatuses: GeoReviewStatus[] = ["claimed", "reviewed", "canonical", "disputed", "rejected", "unknown"];

const importColumns = [
  "recordId",
  "title",
  "operator",
  "state",
  "county",
  "city",
  "publicAddress",
  "publicAddressBasis",
  "geoPrecision",
  "locationEvidenceClass",
  "locationEvidenceUrl",
  "locationConfidence",
  "status",
  "latitude",
  "longitude",
  "coordinateBasis",
  "geoNotes",
];

const sampleRecord: Record<string, string> = {
  recordId: "dc-example-001",
  title: "Example Public Data Center Project",
  operator: "Example Operator LLC",
  state: "VA",
  county: "Loudoun County",
  city: "Ashburn",
  publicAddress: "",
  publicAddressBasis: "",
  geoPrecision: "city",
  locationEvidenceClass: "planning_record",
  locationEvidenceUrl: "https://example.gov/public-planning-record",
  locationConfidence: "72",
  status: "claimed",
  latitude: "",
  longitude: "",
  coordinateBasis: "",
  geoNotes: "City-level precision only. Do not infer exact location from this row.",
};

function stableJson(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort(), 2);
}

function digestFor(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `geo-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvTemplate() {
  const header = importColumns.map(csvEscape).join(",");
  const row = importColumns.map((column) => csvEscape(sampleRecord[column] ?? "")).join(",");
  return `${header}\n${row}\n`;
}

function buildSchemaPacket(): FacilityGeoRecordSchemaPacket {
  const packetWithoutDigest = {
    schema: "DataCenterLedger.FacilityGeoRecordSchema.v3.3" as const,
    appVersion: GEO_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    requiredFields,
    optionalFields,
    precisionPolicy,
    evidenceClasses,
    reviewStatuses,
    importColumns,
    safetyBoundary: geoSafetyBoundary,
    reviewOnlyNotice: geoReviewOnlyNotice,
  };
  return { ...packetWithoutDigest, packetDigest: digestFor(packetWithoutDigest) };
}

function buildTemplatePacket(): FacilityGeoImportTemplatePacket {
  const packetWithoutDigest = {
    schema: "DataCenterLedger.FacilityGeoImportTemplate.v3.3" as const,
    appVersion: GEO_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    columns: importColumns,
    csvTemplate: buildCsvTemplate(),
    sampleRecord,
    safetyBoundary: geoSafetyBoundary,
    reviewOnlyNotice: geoReviewOnlyNotice,
  };
  return { ...packetWithoutDigest, packetDigest: digestFor(packetWithoutDigest) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateGeoRecord(value: unknown) {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return ["Pasted JSON must be one facility geo record object."];
  }

  for (const field of requiredFields) {
    if (!asString(value[field.field])) {
      issues.push(`Missing required field: ${field.field}`);
    }
  }

  const state = asString(value.state);
  if (state && !/^[A-Z]{2}$/.test(state)) {
    issues.push("state should be a two-letter uppercase U.S. state abbreviation.");
  }

  const geoPrecision = asString(value.geoPrecision) as GeoPrecision;
  if (geoPrecision && !precisionPolicy.some((policy) => policy.precision === geoPrecision)) {
    issues.push("geoPrecision must be one of: state, county, city, public_address, approximate.");
  }

  const evidenceClass = asString(value.locationEvidenceClass) as GeoEvidenceClass;
  if (evidenceClass && !evidenceClasses.includes(evidenceClass)) {
    issues.push(`locationEvidenceClass must be one of: ${evidenceClasses.join(", ")}.`);
  }

  const confidenceText = asString(value.locationConfidence);
  const confidence = Number(confidenceText);
  if (confidenceText && (!Number.isFinite(confidence) || confidence < 0 || confidence > 100)) {
    issues.push("locationConfidence must be a number from 0 to 100.");
  }

  if (geoPrecision === "public_address") {
    if (!asString(value.publicAddress)) {
      issues.push("public_address precision requires publicAddress.");
    }
    if (!asString(value.publicAddressBasis)) {
      issues.push("public_address precision requires publicAddressBasis explaining why exact address display is safe.");
    }
  }

  const hasLatitude = asString(value.latitude).length > 0;
  const hasLongitude = asString(value.longitude).length > 0;
  if (hasLatitude !== hasLongitude) {
    issues.push("latitude and longitude must either both be present or both be blank.");
  }
  if ((hasLatitude || hasLongitude) && !asString(value.coordinateBasis)) {
    issues.push("coordinates require coordinateBasis tied to a public dataset/source.");
  }

  return issues;
}

function downloadText(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing v3.3 geo schema control: ${selector}`);
  }
  return element;
}

function renderFacilityGeoSchema() {
  if (document.getElementById("v33-facility-geo-schema")) {
    return;
  }

  const panel = document.createElement("section");
  panel.id = "v33-facility-geo-schema";
  panel.className = "v33-geo-panel";
  panel.innerHTML = `
    <div class="v33-geo-header">
      <div>
        <p class="eyebrow">v3.3 Facility Geo Record Schema</p>
        <h2>Map-safe location data contract</h2>
        <p>Define how facility location claims enter the U.S. map without turning the map into an exact-location or targeting tool.</p>
      </div>
      <div class="v33-geo-actions">
        <button type="button" data-v33-export-schema>Export schema packet</button>
        <button type="button" data-v33-export-template>Export CSV template</button>
        <button type="button" data-v33-copy-sample>Load sample JSON</button>
      </div>
    </div>
    <div class="v33-geo-grid">
      <article class="v33-geo-card">
        <h3>Required location evidence</h3>
        <ul>${requiredFields.map((field) => `<li><strong>${field.field}</strong> — ${field.description}</li>`).join("")}</ul>
      </article>
      <article class="v33-geo-card">
        <h3>Precision policy</h3>
        <ul>${precisionPolicy.map((policy) => `<li><strong>${policy.precision}</strong> — ${policy.mapBehavior}</li>`).join("")}</ul>
      </article>
      <article class="v33-geo-card warning">
        <h3>Safety boundary</h3>
        <ul>${geoSafetyBoundary.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    </div>
    <div class="v33-validator">
      <label for="v33-geo-json">Validate one facility geo record JSON</label>
      <textarea id="v33-geo-json" rows="10" spellcheck="false" placeholder='{ "recordId": "dc-example-001", "title": "Example", "state": "VA", "geoPrecision": "city" }'></textarea>
      <div class="v33-geo-actions inline">
        <button type="button" data-v33-validate>Validate pasted record</button>
        <button type="button" data-v33-export-sample>Export sample record</button>
      </div>
      <pre class="v33-validation-output" data-v33-validation-output>Paste a single record and run validation.</pre>
    </div>
  `;

  document.body.appendChild(panel);

  const textArea = requireElement<HTMLTextAreaElement>(panel, "#v33-geo-json");
  const validationOutput = requireElement<HTMLElement>(panel, "[data-v33-validation-output]");
  const exportSchemaButton = requireElement<HTMLButtonElement>(panel, "[data-v33-export-schema]");
  const exportTemplateButton = requireElement<HTMLButtonElement>(panel, "[data-v33-export-template]");
  const copySampleButton = requireElement<HTMLButtonElement>(panel, "[data-v33-copy-sample]");
  const validateButton = requireElement<HTMLButtonElement>(panel, "[data-v33-validate]");
  const exportSampleButton = requireElement<HTMLButtonElement>(panel, "[data-v33-export-sample]");

  exportSchemaButton.addEventListener("click", () => {
    const packet = buildSchemaPacket();
    localStorage.setItem(GEO_SCHEMA_STORAGE_KEY, JSON.stringify(packet, null, 2));
    downloadText("datacenter-ledger-facility-geo-schema-v3.3.json", JSON.stringify(packet, null, 2));
  });

  exportTemplateButton.addEventListener("click", () => {
    const packet = buildTemplatePacket();
    localStorage.setItem(GEO_TEMPLATE_STORAGE_KEY, JSON.stringify(packet, null, 2));
    downloadText("datacenter-ledger-facility-geo-template-v3.3.csv", packet.csvTemplate, "text/csv");
  });

  copySampleButton.addEventListener("click", () => {
    textArea.value = JSON.stringify(sampleRecord, null, 2);
    validationOutput.textContent = "Sample geo record loaded. Run validation to inspect it.";
  });

  validateButton.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(textArea.value) as unknown;
      const issues = validateGeoRecord(parsed);
      validationOutput.textContent = issues.length === 0 ? "PASS: record matches the v3.3 geo schema guardrails." : `REVIEW:\n- ${issues.join("\n- ")}`;
    } catch (error) {
      validationOutput.textContent = `JSON parse error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  });

  exportSampleButton.addEventListener("click", () => {
    downloadText("datacenter-ledger-facility-geo-sample-v3.3.json", stableJson(sampleRecord));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderFacilityGeoSchema, { once: true });
} else {
  renderFacilityGeoSchema();
}
