import { useMemo, useState } from "react";

type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";
type SourceType = "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";

type Receipt = {
  sourceName: string;
  sourceType: SourceType;
  retrievedAt: string;
  claim: string;
  confidence: Confidence;
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
};

type SafetyStep = {
  title: string;
  body: string;
};

const APP_VERSION = "1.1.0";

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
    title: "Treat every import as a claim",
    body: "Raw rows enter the Ledger as review candidates. A source receipt explains who said what and when it was retrieved."
  },
  {
    title: "Promote slowly",
    body: "A public record should have receipts, confidence, clear precision, and no open review warnings before it becomes canonical."
  },
  {
    title: "Avoid sensitive enrichment",
    body: "Do not add private access details, security layouts, unreviewed coordinates, or anything that turns the workbench into a target map."
  }
];

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

function parseCsv(text: string): LedgerRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const cell = (values: string[], key: string) => values[headers.indexOf(key)]?.trim() || "";

  return lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const name = cell(values, "name") || "Unnamed public record";
    const sourceName = cell(values, "source") || "CSV import";
    const sourceType = (cell(values, "source_type") as SourceType) || "public_dataset";
    const city = cell(values, "city") || undefined;
    const precision = city ? "city_level" : cell(values, "county") ? "county_level" : "state_level";

    return {
      id: cell(values, "id") || digest({ line, index }),
      name,
      operator: cell(values, "operator") || "Unknown",
      status: (cell(values, "status") as Status) || "unknown",
      state: cell(values, "state") || cell(values, "state_abb") || "UNKNOWN",
      county: cell(values, "county") || "Unknown county",
      city,
      precision,
      capacityMW: Number(cell(values, "capacity_mw")) || undefined,
      lifecycle: "raw_import",
      confidenceScore: Number(cell(values, "confidence")) || 50,
      reviewWarnings: ["Imported row needs human review before promotion."],
      receipts: [
        {
          sourceName,
          sourceType,
          retrievedAt: nowIso(),
          claim: `Imported row for ${name}.`,
          confidence: "medium"
        }
      ],
      notes: []
    };
  });
}

export default function App() {
  const [records, setRecords] = useState<LedgerRecord[]>(starterRecords);
  const [selectedId, setSelectedId] = useState(starterRecords[0].id);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [mode, setMode] = useState<"all" | "canonical" | "review">("all");
  const [note, setNote] = useState("");

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const canonicalRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length === 0), [records]);
  const reviewRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length > 0), [records]);
  const demoRecords = useMemo(() => records.filter((record) => record.id.startsWith("dcl-demo-")), [records]);

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

  async function importFile(file: File) {
    const imported = parseCsv(await file.text());
    setRecords((items) => [...items, ...imported]);
    if (imported[0]) setSelectedId(imported[0].id);
  }

  function resetDemoData() {
    setRecords(starterRecords);
    setSelectedId(starterRecords[0].id);
    setQuery("");
    setStateFilter("all");
    setMode("all");
  }

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", {
      schema: "DataCenterLedger.Export.v1.1-public-launch",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      boundary: publicBoundary,
      records,
      digest: digest(records)
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
      schema: "DataCenterLedger.CanonicalRegistry.v1.1-public-launch",
      generatedAt: nowIso(),
      appVersion: APP_VERSION,
      included,
      excluded,
      digest: digest({ included, excluded })
    });
  }

  function exportLaunchPacket() {
    downloadJson("datacenter-ledger-public-launch-packet.json", {
      schema: "DataCenterLedger.PublicLaunchPacket.v1.1",
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
        receipts: records.reduce((sum, record) => sum + record.receipts.length, 0)
      },
      digest: digest({ records, publicBoundary, safeUseSteps })
    });
  }

  return (
    <main className="shell">
      <header className="hero launchHero">
        <div>
          <p className="eyebrow">v{APP_VERSION} public launch sprint • local-first • receipt-backed</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>
            A civic transparency workbench for reviewing public data center records as claims — with receipts,
            confidence scores, lifecycle decisions, canonical exports, and a clear safety boundary.
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
          <h2>Public records in, reviewable Ledger out.</h2>
          <p>
            Import a CSV, inspect each row as a source-backed claim, preserve the receipts, add local reviewer notes,
            and export either the full working Ledger or only records that pass the canonical gate.
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
        <label className="fileButton">Import CSV<input type="file" accept=".csv" onChange={(event) => event.target.files?.[0] && importFile(event.target.files[0])} /></label>
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
