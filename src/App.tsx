import { useMemo, useState } from "react";

type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";

type Receipt = {
  sourceName: string;
  sourceType: "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";
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
    return {
      id: cell(values, "id") || digest({ line, index }),
      name,
      operator: cell(values, "operator") || "Unknown",
      status: (cell(values, "status") as Status) || "unknown",
      state: cell(values, "state") || cell(values, "state_abb") || "UNKNOWN",
      county: cell(values, "county") || "Unknown county",
      city: cell(values, "city") || undefined,
      precision: cell(values, "city") ? "city_level" : "county_level",
      capacityMW: Number(cell(values, "capacity_mw")) || undefined,
      lifecycle: "raw_import",
      confidenceScore: Number(cell(values, "confidence")) || 50,
      reviewWarnings: ["Imported row needs human review before promotion."],
      receipts: [
        {
          sourceName,
          sourceType: "public_dataset",
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
      ? { ...item, lifecycle: "promoted_public", reviewWarnings: [] }
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

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", {
      schema: "DataCenterLedger.Export.v1.0-public-repo",
      generatedAt: nowIso(),
      records,
      digest: digest(records)
    });
  }

  function exportCanonical() {
    const included = records.filter((record) => canonicalBlockers(record).length === 0);
    const excluded = records.filter((record) => canonicalBlockers(record).length > 0).map((record) => ({
      id: record.id,
      name: record.name,
      blockers: canonicalBlockers(record)
    }));
    downloadJson("datacenter-ledger-canonical.json", {
      schema: "DataCenterLedger.CanonicalRegistry.v1.0-public-repo",
      generatedAt: nowIso(),
      included,
      excluded,
      digest: digest({ included, excluded })
    });
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Public-source review • Local-first • Receipt-backed</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>A civic transparency workbench for reviewing data center records, receipts, confidence scores, lifecycle decisions, and canonical registry exports.</p>
        </div>
        <div className="heroActions">
          <button onClick={exportLedger}>Export Ledger JSON</button>
          <button onClick={exportCanonical}>Export Canonical JSON</button>
        </div>
      </header>

      <section className="cards">
        <Stat label="Records" value={records.length} />
        <Stat label="Canonical" value={records.filter((record) => canonicalBlockers(record).length === 0).length} />
        <Stat label="Receipts" value={records.reduce((sum, record) => sum + record.receipts.length, 0)} />
        <Stat label="Needs review" value={records.filter((record) => canonicalBlockers(record).length > 0).length} />
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
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Working list</h2>
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
          <button onClick={promoteSelected}>Promote selected demo record</button>

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
