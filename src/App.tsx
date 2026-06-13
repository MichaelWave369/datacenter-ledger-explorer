import { useMemo, useState } from "react";

type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";
type SourceType = "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";
type WarningLevel = "info" | "warning" | "blocking";

type Receipt = {
  sourceName: string;
  sourceType: SourceType;
  sourceUrl?: string;
  retrievedAt: string;
  claim: string;
  confidence: Confidence;
  batchId?: string;
};

type LedgerRecord = {
  id: string;
  name: string;
  operator: string;
  status: Status;
  state: string;
  county: string;
  city?: string;
  precision: Precision;
  capacityMW?: number;
  lifecycle: Lifecycle;
  confidenceScore: number;
  reviewWarnings: string[];
  receipts: Receipt[];
  notes: string[];
  importBatchId?: string;
};

type SafetyStep = {
  title: string;
  body: string;
};

type ImportWarning = {
  rowNumber: number;
  level: WarningLevel;
  field?: string;
  message: string;
};

type ImportPreviewRow = {
  rowNumber: number;
  record: LedgerRecord;
  warnings: ImportWarning[];
};

type ImportPreview = {
  batchId: string;
  createdAt: string;
  origin: string;
  rows: ImportPreviewRow[];
  warnings: ImportWarning[];
  digest: string;
};

type ImportHistoryItem = {
  batchId: string;
  committedAt: string;
  origin: string;
  rowsCommitted: number;
  warningCount: number;
  digest: string;
};

const APP_VERSION = "1.2.0";

const validStatuses: Status[] = ["operating", "planned", "under_construction", "approved", "unknown"];
const validSourceTypes: SourceType[] = ["public_dataset", "permit", "utility", "operator", "news", "review", "other"];
const validPrecisions: Precision[] = ["public_dataset", "city_level", "county_level", "state_level", "unknown"];

const publicBoundary = [
  "Public-data only",
  "No hidden network calls",
  "No private facility discovery",
  "No security-sensitive enrichment",
  "City/county precision unless exact location is already public"
];

const safeUseSteps: SafetyStep[] = [
  {
    title: "Start with public sources",
    body: "Import only public datasets, permits, utility filings, operator announcements, or news records you can cite."
  },
  {
    title: "Preview before commit",
    body: "Use the v1.2 import workbench to inspect normalized rows, warnings, source posture, and batch receipts before adding records."
  },
  {
    title: "Treat every import as a claim",
    body: "Raw rows enter the Ledger as review candidates. A source receipt explains who said what and when it was retrieved."
  },
  {
    title: "Promote slowly",
    body: "A public record should have receipts, confidence, clear precision, and no open review warnings before it becomes canonical."
  }
];

const sampleCsv = `id,name,operator,status,state,county,city,capacity_mw,sqft,confidence,source,source_type,source_url,source_claim,retrieved_at
dcl-public-review-001,Sample Public Atlas Candidate,Unknown,operating,VA,Loudoun County,Ashburn,0,0,72,Example public dataset,public_dataset,https://example.org/public-dataset,"Public dataset row for review workflow testing.",2026-06-13
dcl-public-review-002,Sample Permit Review Candidate,Unknown,approved,IA,Polk County,Des Moines,120,0,66,Example county permit,permit,https://example.org/permit,"Permit mentions a proposed facility; MW claim needs a second source.",2026-06-13`;

const starterRecords: LedgerRecord[] = [
  {
    id: "dcl-demo-ashburn-va",
    name: "Northern Virginia Public Atlas Cluster",
    operator: "Multiple / unknown",
    status: "operating",
    state: "VA",
    county: "Loudoun County",
    city: "Ashburn",
    precision: "city_level",
    capacityMW: 0,
    lifecycle: "local_working",
    confidenceScore: 72,
    reviewWarnings: ["Demo record; replace with public-source imports before promotion."],
    receipts: [
      {
        sourceName: "Demo seed",
        sourceType: "review",
        retrievedAt: "2026-06-13T00:00:00.000Z",
        claim: "City-level demo row for UI testing only.",
        confidence: "low"
      }
    ],
    notes: []
  },
  {
    id: "dcl-demo-phoenix-az",
    name: "Phoenix Public Review Candidate",
    operator: "Unknown",
    status: "planned",
    state: "AZ",
    county: "Maricopa County",
    city: "Phoenix",
    precision: "county_level",
    capacityMW: 0,
    lifecycle: "raw_import",
    confidenceScore: 61,
    reviewWarnings: ["Needs a second public source."],
    receipts: [
      {
        sourceName: "Demo seed",
        sourceType: "review",
        retrievedAt: "2026-06-13T00:00:00.000Z",
        claim: "County-level placeholder for workflow testing.",
        confidence: "low"
      }
    ],
    notes: []
  },
  {
    id: "dcl-demo-des-moines-ia",
    name: "Midwest Utility Filing Candidate",
    operator: "Unknown",
    status: "approved",
    state: "IA",
    county: "Polk County",
    city: "Des Moines",
    precision: "county_level",
    capacityMW: undefined,
    lifecycle: "raw_import",
    confidenceScore: 54,
    reviewWarnings: ["Needs permit source.", "Needs utility source."],
    receipts: [
      {
        sourceName: "Demo seed",
        sourceType: "review",
        retrievedAt: "2026-06-13T00:00:00.000Z",
        claim: "Demonstrates a low-confidence review queue item.",
        confidence: "low"
      }
    ],
    notes: []
  }
];

const nowIso = () => new Date().toISOString();

function digest(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalBlockers(record: LedgerRecord) {
  const blockers: string[] = [];
  if (record.lifecycle !== "promoted_public") blockers.push("not promoted_public");
  if (record.receipts.length === 0) blockers.push("missing receipt");
  if (record.confidenceScore < 70) blockers.push("confidence below 70");
  if (record.precision === "unknown") blockers.push("unknown location precision");
  if (record.reviewWarnings.length > 0) blockers.push("review warnings remain");
  return blockers;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsvTable(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [] as string[], rows: [] as { rowNumber: number; row: Record<string, string> }[] };

  const headers = splitCsvLine(lines[0]).map((item) => item.trim().toLowerCase());
  const rows = lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() || "";
    });
    return { rowNumber: index + 2, row };
  });

  return { headers, rows };
}

function readCell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return "";
}

function pushWarning(warnings: ImportWarning[], rowNumber: number, level: WarningLevel, message: string, field?: string) {
  warnings.push({ rowNumber, level, field, message });
}

function normalizeStatus(value: string, rowNumber: number, warnings: ImportWarning[]): Status {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as Status;
  if (validStatuses.includes(normalized)) return normalized;
  if (value) pushWarning(warnings, rowNumber, "warning", `Unsupported status "${value}" normalized to unknown.`, "status");
  return "unknown";
}

function normalizeSourceType(value: string, rowNumber: number, warnings: ImportWarning[]): SourceType {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as SourceType;
  if (validSourceTypes.includes(normalized)) return normalized;
  if (value) pushWarning(warnings, rowNumber, "warning", `Unsupported source_type "${value}" normalized to other.`, "source_type");
  return "other";
}

function normalizeConfidence(value: string, rowNumber: number, warnings: ImportWarning[]) {
  const parsed = Number(value);
  if (!value) {
    pushWarning(warnings, rowNumber, "warning", "Missing confidence; defaulted to 50.", "confidence");
    return 50;
  }
  if (Number.isNaN(parsed)) {
    pushWarning(warnings, rowNumber, "warning", `Invalid confidence "${value}"; defaulted to 50.`, "confidence");
    return 50;
  }
  const clamped = Math.max(0, Math.min(100, parsed));
  if (clamped !== parsed) pushWarning(warnings, rowNumber, "warning", "Confidence was outside 0-100 and has been clamped.", "confidence");
  return clamped;
}

function confidenceLabel(score: number): Confidence {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function normalizePrecision(row: Record<string, string>, rowNumber: number, warnings: ImportWarning[]): Precision {
  const raw = readCell(row, "precision", "location_precision").toLowerCase().trim().replace(/\s+/g, "_") as Precision;
  if (raw && validPrecisions.includes(raw)) return raw;
  if (raw) pushWarning(warnings, rowNumber, "warning", `Unsupported precision "${raw}" inferred from city/county/state fields.`, "precision");
  if (readCell(row, "city")) return "city_level";
  if (readCell(row, "county")) return "county_level";
  if (readCell(row, "state", "state_abb")) return "state_level";
  return "unknown";
}

function buildImportPreview(text: string, origin: string, existingRecords: LedgerRecord[]): ImportPreview {
  const createdAt = nowIso();
  const batchId = digest({ text, origin, createdAt });
  const { headers, rows } = parseCsvTable(text);
  const globalWarnings: ImportWarning[] = [];
  const existingIds = new Set(existingRecords.map((record) => record.id));
  const previewIds = new Set<string>();

  if (headers.length === 0) {
    pushWarning(globalWarnings, 1, "blocking", "CSV text is empty or missing a header row.");
  }
  if (headers.length > 0 && rows.length === 0) {
    pushWarning(globalWarnings, 1, "blocking", "CSV has a header row but no data rows.");
  }

  const recommendedColumns = ["name", "state", "source"];
  for (const column of recommendedColumns) {
    if (!headers.includes(column) && !(column === "state" && headers.includes("state_abb"))) {
      pushWarning(globalWarnings, 1, "warning", `Recommended column "${column}" is missing.`, column);
    }
  }

  const previewRows = rows.map(({ rowNumber, row }) => {
    const warnings: ImportWarning[] = [];
    const name = readCell(row, "name") || "Unnamed public record";
    const operator = readCell(row, "operator", "owner") || "Unknown";
    const state = readCell(row, "state", "state_abb") || "UNKNOWN";
    const county = readCell(row, "county") || "Unknown county";
    const city = readCell(row, "city") || undefined;
    const id = readCell(row, "id") || digest({ row, rowNumber, batchId });
    const sourceName = readCell(row, "source", "source_name") || "CSV import";
    const sourceUrl = readCell(row, "source_url", "url") || undefined;
    const sourceClaim = readCell(row, "source_claim", "claim") || `Imported row for ${name}.`;
    const retrievedAt = readCell(row, "retrieved_at", "retrieved") || createdAt;
    const status = normalizeStatus(readCell(row, "status"), rowNumber, warnings);
    const sourceType = normalizeSourceType(readCell(row, "source_type"), rowNumber, warnings);
    const confidenceScore = normalizeConfidence(readCell(row, "confidence", "confidence_score"), rowNumber, warnings);
    const precision = normalizePrecision(row, rowNumber, warnings);
    const capacityRaw = readCell(row, "capacity_mw", "power_mw", "mw");
    const capacityMW = capacityRaw ? Number(capacityRaw) : undefined;

    if (existingIds.has(id)) pushWarning(warnings, rowNumber, "blocking", `Record id "${id}" already exists in the workspace.`, "id");
    if (previewIds.has(id)) pushWarning(warnings, rowNumber, "blocking", `Record id "${id}" appears more than once in this import batch.`, "id");
    previewIds.add(id);

    if (!readCell(row, "name")) pushWarning(warnings, rowNumber, "warning", "Missing name; using Unnamed public record.", "name");
    if (!readCell(row, "state", "state_abb")) pushWarning(warnings, rowNumber, "blocking", "Missing state/state_abb.", "state");
    if (!readCell(row, "county") && !readCell(row, "city")) pushWarning(warnings, rowNumber, "warning", "Missing county and city; precision will be state-level or unknown.", "county");
    if (!readCell(row, "source", "source_name")) pushWarning(warnings, rowNumber, "warning", "Missing source name; receipt will need review.", "source");
    if (!sourceUrl) pushWarning(warnings, rowNumber, "info", "No source_url supplied; reviewers should preserve a public link outside the app.", "source_url");
    if (readCell(row, "lat") || readCell(row, "lon") || readCell(row, "longitude") || readCell(row, "latitude")) {
      pushWarning(warnings, rowNumber, "warning", "Coordinate columns detected. The app does not display them; confirm they are already public before keeping them in external datasets.", "lat/lon");
    }
    if (capacityRaw && Number.isNaN(Number(capacityRaw))) {
      pushWarning(warnings, rowNumber, "warning", `Invalid capacity_mw "${capacityRaw}" ignored.`, "capacity_mw");
    }
    if (capacityMW && capacityMW > 0) {
      pushWarning(warnings, rowNumber, "warning", "MW capacity is a high-impact claim and should have a second independent source before promotion.", "capacity_mw");
    }

    const reviewWarnings = warnings
      .filter((warning) => warning.level !== "info")
      .map((warning) => warning.message);

    const record: LedgerRecord = {
      id,
      name,
      operator,
      status,
      state,
      county,
      city,
      precision,
      capacityMW: capacityMW && !Number.isNaN(capacityMW) ? capacityMW : undefined,
      lifecycle: "raw_import",
      confidenceScore,
      reviewWarnings: ["Imported row needs human review before promotion.", ...reviewWarnings],
      receipts: [
        {
          sourceName,
          sourceType,
          sourceUrl,
          retrievedAt: new Date(retrievedAt).toString() === "Invalid Date" ? createdAt : new Date(retrievedAt).toISOString(),
          claim: sourceClaim,
          confidence: confidenceLabel(confidenceScore),
          batchId
        }
      ],
      notes: [`Imported through batch ${batchId} from ${origin}.`],
      importBatchId: batchId
    };

    return { rowNumber, record, warnings };
  });

  return {
    batchId,
    createdAt,
    origin,
    rows: previewRows,
    warnings: globalWarnings,
    digest: digest({ batchId, rows: previewRows.map((row) => row.record), globalWarnings })
  };
}

function allPreviewWarnings(preview?: ImportPreview | null) {
  if (!preview) return [];
  return [...preview.warnings, ...preview.rows.flatMap((row) => row.warnings)];
}

function warningCount(preview: ImportPreview | null, level?: WarningLevel) {
  const warnings = allPreviewWarnings(preview);
  return level ? warnings.filter((warning) => warning.level === level).length : warnings.length;
}

export default function App() {
  const [records, setRecords] = useState<LedgerRecord[]>(starterRecords);
  const [selectedId, setSelectedId] = useState(starterRecords[0].id);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [mode, setMode] = useState<"all" | "canonical" | "review">("all");
  const [note, setNote] = useState("");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const canonicalRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length === 0), [records]);
  const reviewRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length > 0), [records]);
  const demoRecords = useMemo(() => records.filter((record) => record.id.startsWith("dcl-demo-")), [records]);
  const importWarnings = allPreviewWarnings(importPreview);
  const hasBlockingImport = importWarnings.some((warning) => warning.level === "blocking");

  const visibleRecords = useMemo(() => records.filter((record) => {
    const haystack = `${record.name} ${record.operator} ${record.county} ${record.city || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || record.state === stateFilter;
    const blockers = canonicalBlockers(record);
    const matchesMode = mode === "all" || (mode === "canonical" ? blockers.length === 0 : blockers.length > 0);
    return matchesQuery && matchesState && matchesMode;
  }), [records, query, stateFilter, mode]);

  function promoteSelected() {
    setRecords((items) => items.map((item) => item.id === selected.id
      ? {
          ...item,
          lifecycle: "promoted_public",
          reviewWarnings: [],
          notes: [...item.notes, `Promoted locally at ${new Date().toLocaleString()}. Confirm source posture before publishing.`]
        }
      : item));
  }

  function saveNote() {
    if (!note.trim()) return;
    setRecords((items) => items.map((item) => item.id === selected.id
      ? { ...item, notes: [...item.notes, note.trim()] }
      : item));
    setNote("");
  }

  function previewImportFromText(origin = "pasted CSV") {
    setImportPreview(buildImportPreview(importText, origin, records));
  }

  async function loadCsvFile(file: File) {
    const text = await file.text();
    setImportText(text);
    setImportPreview(buildImportPreview(text, file.name, records));
  }

  function loadSampleImport() {
    setImportText(sampleCsv);
    setImportPreview(buildImportPreview(sampleCsv, "sample CSV", records));
  }

  function commitImportPreview() {
    if (!importPreview || hasBlockingImport) return;
    const importedRecords = importPreview.rows.map((row) => row.record);
    setRecords((items) => [...items, ...importedRecords]);
    setImportHistory((items) => [
      {
        batchId: importPreview.batchId,
        committedAt: nowIso(),
        origin: importPreview.origin,
        rowsCommitted: importedRecords.length,
        warningCount: warningCount(importPreview),
        digest: importPreview.digest
      },
      ...items
    ]);
    if (importedRecords[0]) setSelectedId(importedRecords[0].id);
    setImportPreview(null);
    setImportText("");
  }

  function clearImportWorkbench() {
    setImportPreview(null);
    setImportText("");
  }

  function resetDemoData() {
    setRecords(starterRecords);
    setSelectedId(starterRecords[0].id);
    setQuery("");
    setStateFilter("all");
    setMode("all");
    setImportPreview(null);
    setImportText("");
    setImportHistory([]);
  }

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", {
      schema: "DataCenterLedger.Export.v1.2-import-workbench",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      boundary: publicBoundary,
      importHistory,
      records,
      digest: digest({ records, importHistory })
    });
  }

  function exportCanonical() {
    const included = canonicalRecords;
    const excluded = records.filter((record) => canonicalBlockers(record).length > 0).map((record) => ({
      id: record.id,
      name: record.name,
      blockers: canonicalBlockers(record)
    }));
    downloadJson("datacenter-ledger-canonical.json", {
      schema: "DataCenterLedger.CanonicalRegistry.v1.2-import-workbench",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      included,
      excluded,
      digest: digest({ included, excluded })
    });
  }

  function exportLaunchPacket() {
    downloadJson("datacenter-ledger-public-launch-packet.json", {
      schema: "DataCenterLedger.PublicLaunchPacket.v1.2",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      purpose: "Public-safe civic transparency workbench for reviewing U.S. data center records as source-backed claims.",
      boundary: publicBoundary,
      safeUseSteps,
      stats: {
        records: records.length,
        demoRecords: demoRecords.length,
        canonicalRecords: canonicalRecords.length,
        needsReview: reviewRecords.length,
        receipts: records.reduce((sum, record) => sum + record.receipts.length, 0),
        importBatches: importHistory.length
      },
      digest: digest({ records, importHistory, publicBoundary, safeUseSteps })
    });
  }

  function exportImportPreview() {
    if (!importPreview) return;
    downloadJson("datacenter-ledger-import-preview.json", {
      schema: "DataCenterLedger.ImportPreview.v1.2",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      preview: importPreview,
      warningSummary: {
        total: warningCount(importPreview),
        blocking: warningCount(importPreview, "blocking"),
        warning: warningCount(importPreview, "warning"),
        info: warningCount(importPreview, "info")
      }
    });
  }

  function exportImportHistory() {
    downloadJson("datacenter-ledger-import-history.json", {
      schema: "DataCenterLedger.ImportHistory.v1.2",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      importHistory,
      digest: digest(importHistory)
    });
  }

  return (
    <main className="shell">
      <header className="hero launchHero">
        <div>
          <p className="eyebrow">v{APP_VERSION} import workbench sprint • local-first • receipt-backed</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>
            A civic transparency workbench for reviewing public data center records as claims — with receipts,
            confidence scores, import review gates, lifecycle decisions, canonical exports, and a clear safety boundary.
          </p>
          <div className="boundaryPills" aria-label="Public safety boundary">
            {publicBoundary.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <div className="heroActions">
          <button onClick={exportLedger}>Export Ledger JSON</button>
          <button onClick={exportCanonical}>Export Canonical JSON</button>
          <button onClick={exportLaunchPacket}>Export Launch Packet</button>
        </div>
      </header>

      <section className="launchGrid" aria-label="Launch overview">
        <div className="panel introPanel">
          <p className="eyebrow">What this is</p>
          <h2>Public records in, reviewed Ledger out.</h2>
          <p>
            Paste or load a CSV, preview normalized rows, inspect warnings before commit, preserve source receipts,
            add local reviewer notes, and export either the full working Ledger or only records that pass the canonical gate.
          </p>
        </div>
        <div className="panel introPanel cautionPanel">
          <p className="eyebrow">What this is not</p>
          <h2>Not a targeting map.</h2>
          <p>
            This starter app ships with demo rows only. It should not be used to add private access details,
            sensitive layouts, unreviewed exact coordinates, or any non-public enrichment.
          </p>
        </div>
      </section>

      <section className="cards">
        <Stat label="Records" value={records.length} />
        <Stat label="Canonical" value={canonicalRecords.length} />
        <Stat label="Receipts" value={records.reduce((sum, record) => sum + record.receipts.length, 0)} />
        <Stat label="Needs review" value={reviewRecords.length} />
        <Stat label="Demo rows" value={demoRecords.length} />
        <Stat label="Import batches" value={importHistory.length} />
      </section>

      <section className="panel walkthrough">
        <div>
          <p className="eyebrow">How to use this safely</p>
          <h2>Four-step public review flow</h2>
        </div>
        <div className="stepGrid">
          {safeUseSteps.map((step, index) => (
            <article key={step.title} className="stepCard">
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel importWorkbench" aria-label="Import review workbench">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">v1.2 Import Review Workbench</p>
            <h2>Preview CSV rows before they enter the Ledger</h2>
            <p className="muted">
              Paste normalized CSV or load a file. The app creates a batch preview, source receipts, validation warnings,
              and a deterministic preview digest before anything is committed.
            </p>
          </div>
          <div className="heroActions">
            <button onClick={loadSampleImport}>Load Sample CSV</button>
            <label className="fileButton">Load CSV file<input type="file" accept=".csv" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadCsvFile(file);
              event.currentTarget.value = "";
            }} /></label>
          </div>
        </div>

        <textarea
          className="csvTextArea"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste normalized CSV here. Required posture: public source, state, reviewable claim, and receipt context."
        />

        <div className="importActions">
          <button onClick={() => previewImportFromText()} disabled={!importText.trim()}>Preview CSV</button>
          <button onClick={exportImportPreview} disabled={!importPreview}>Export Preview Packet</button>
          <button onClick={commitImportPreview} disabled={!importPreview || hasBlockingImport}>Commit Preview to Ledger</button>
          <button onClick={exportImportHistory} disabled={importHistory.length === 0}>Export Import History</button>
          <button onClick={clearImportWorkbench}>Clear Import Workbench</button>
        </div>

        {importPreview ? (
          <div className="previewPanel">
            <div className="previewSummary">
              <Stat label="Preview rows" value={importPreview.rows.length} />
              <Stat label="Blocking" value={warningCount(importPreview, "blocking")} />
              <Stat label="Warnings" value={warningCount(importPreview, "warning")} />
              <Stat label="Info" value={warningCount(importPreview, "info")} />
            </div>
            <div className="batchMeta">
              <span><strong>Batch:</strong> {importPreview.batchId}</span>
              <span><strong>Origin:</strong> {importPreview.origin}</span>
              <span><strong>Digest:</strong> {importPreview.digest}</span>
            </div>
            {hasBlockingImport && <p className="dangerText">Blocking issues must be fixed before this batch can be committed.</p>}
            {importPreview.warnings.length > 0 && (
              <div className="globalWarnings">
                {importPreview.warnings.map((warning) => (
                  <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>
                    batch {warning.level}: {warning.message}
                  </span>
                ))}
              </div>
            )}
            <div className="tableWrap previewTable">
              <table>
                <thead><tr><th>Row</th><th>Name</th><th>State</th><th>Source</th><th>Warnings</th></tr></thead>
                <tbody>
                  {importPreview.rows.map((row) => (
                    <tr key={`${importPreview.batchId}-${row.rowNumber}`}>
                      <td>{row.rowNumber}</td>
                      <td><strong>{row.record.name}</strong><small>{row.record.operator}</small></td>
                      <td>{row.record.state}</td>
                      <td>{row.record.receipts[0]?.sourceName || "Missing source"}</td>
                      <td>
                        {row.warnings.length ? row.warnings.map((warning) => (
                          <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>
                            {warning.level}: {warning.message}
                          </span>
                        )) : <span className="chip ok">ready for review</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="muted">No active preview yet. Load the sample CSV or paste public-source rows to begin.</p>
        )}
      </section>

      <section className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, operators, counties..." />
        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
          <option value="all">All states</option>
          {states.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
          <option value="all">All records</option>
          <option value="canonical">Canonical only</option>
          <option value="review">Needs review</option>
        </select>
        <button onClick={resetDemoData}>Reset Demo</button>
      </section>

      <section className="sampleNotice panel">
        <strong>Sample data loaded:</strong>
        <span>
          {demoRecords.length} demo rows are visible so the live site is understandable immediately. Replace them with
          public-source imports before using the Ledger for real review work.
        </span>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Working registry</p>
              <h2>Review queue</h2>
            </div>
            <span className="countBadge">{visibleRecords.length} visible</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Name</th><th>State</th><th>Status</th><th>Lifecycle</th><th>Confidence</th><th>Gate</th></tr></thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const blockers = canonicalBlockers(record);
                  return (
                    <tr key={record.id} onClick={() => setSelectedId(record.id)} className={record.id === selected.id ? "selected" : ""}>
                      <td><strong>{record.name}</strong><small>{record.operator}</small></td>
                      <td>{record.state}</td>
                      <td>{record.status}</td>
                      <td>{record.lifecycle}</td>
                      <td>{record.confidenceScore}%</td>
                      <td><span className={blockers.length ? "chip warn" : "chip ok"}>{blockers.length ? "review" : "canonical"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel drawer">
          <p className="eyebrow">Selected record</p>
          <h2>{selected.name}</h2>
          <p className="muted">{selected.city ? `${selected.city}, ` : ""}{selected.county}, {selected.state} • {selected.precision}</p>
          <div className="miniGrid">
            <Stat label="MW" value={selected.capacityMW || "unknown"} />
            <Stat label="Receipts" value={selected.receipts.length} />
            <Stat label="Notes" value={selected.notes.length} />
          </div>

          <h3>Canonical decision</h3>
          {canonicalBlockers(selected).length
            ? <ul>{canonicalBlockers(selected).map((item) => <li key={item}>{item}</li>)}</ul>
            : <p className="okText">Record passes the current canonical gate.</p>}
          <button onClick={promoteSelected}>Promote selected locally</button>

          <h3>Receipts</h3>
          {selected.receipts.map((receipt, index) => (
            <div key={`${receipt.sourceName}-${index}`} className="receipt">
              <strong>{receipt.sourceName}</strong>
              <span>{receipt.sourceType} • {receipt.confidence} • {new Date(receipt.retrievedAt).toLocaleDateString()}</span>
              <p>{receipt.claim}</p>
              {receipt.sourceUrl && <a href={receipt.sourceUrl} target="_blank" rel="noreferrer">Open public source</a>}
              {receipt.batchId && <small>Batch: {receipt.batchId}</small>}
            </div>
          ))}

          <h3>Reviewer notes</h3>
          <div className="noteBox">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add local reviewer note..." />
            <button onClick={saveNote}>Save note</button>
          </div>
          {selected.notes.length ? <ul>{selected.notes.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="muted">No notes yet.</p>}
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
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
