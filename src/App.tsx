import { useMemo, useState } from "react";

type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";
type SourceType = "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";
type WarningLevel = "info" | "warning" | "blocking";
type QualityBand = "strong" | "moderate" | "weak" | "blocked";
type RegionMode = "state" | "county";
type ChecklistStatus = "pass" | "warning" | "fail" | "needs_human";

type Receipt = {
  receiptId?: string;
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

type SafetyStep = { title: string; body: string };
type ImportWarning = { rowNumber: number; level: WarningLevel; field?: string; message: string };
type ImportPreviewRow = { rowNumber: number; record: LedgerRecord; warnings: ImportWarning[] };
type ImportPreview = { batchId: string; createdAt: string; origin: string; rows: ImportPreviewRow[]; warnings: ImportWarning[]; digest: string };
type ImportHistoryItem = { batchId: string; committedAt: string; origin: string; rowsCommitted: number; warningCount: number; digest: string };
type ReceiptDraft = { sourceName: string; sourceType: SourceType; sourceUrl: string; retrievedAt: string; claim: string; confidence: Confidence };
type ReceiptEditHistoryItem = { receiptId: string; recordId: string; recordName: string; addedAt: string; sourceName: string; sourceType: SourceType; confidence: Confidence; resolvedWarnings: string[]; remainingWarnings: number; digest: string };

type SourceQualityReport = {
  recordId: string;
  score: number;
  band: QualityBand;
  receiptCount: number;
  sourceTypeCount: number;
  publicLinkCoverage: number;
  newestReceiptDaysOld: number | null;
  highImpactClaimCoverage: "not_applicable" | "needs_second_source" | "covered";
  strengths: string[];
  gaps: string[];
  digest: string;
};

type RegionalSummary = {
  key: string;
  label: string;
  mode: RegionMode;
  recordCount: number;
  canonicalCount: number;
  needsReviewCount: number;
  receiptCount: number;
  averageQuality: number;
  qualityBands: Record<QualityBand, number>;
  statusCounts: Record<Status, number>;
  precisionCounts: Record<Precision, number>;
  topReviewGaps: string[];
  digest: string;
};

type RegionalChecklistItem = { label: string; status: ChecklistStatus; detail: string };
type RegionalEvidencePacket = {
  schema: "DataCenterLedger.RegionalEvidencePacket.v1.7";
  generatedAt: string;
  appVersion: string;
  boundary: string[];
  summary: RegionalSummary;
  records: Array<{ record: LedgerRecord; quality: SourceQualityReport; canonicalBlockers: string[] }>;
  receiptCoverage: { recordsWithReceipts: number; recordsWithPublicLinks: number; totalReceipts: number; publicLinkCoverage: number };
  checklist: RegionalChecklistItem[];
  humanReviewPrompts: string[];
  digest: string;
};

type SessionHistoryItem = { sessionId: string; action: "exported" | "loaded"; at: string; name: string; recordCount: number; digest: string };

type LocalReviewSessionPacket = {
  schema: "DataCenterLedger.LocalReviewSession.v1.7";
  sessionId: string;
  sessionName: string;
  generatedAt: string;
  appVersion: string;
  boundary: string[];
  uiState: { selectedId: string; query: string; stateFilter: string; mode: "all" | "canonical" | "review"; regionMode: RegionMode; selectedRegionKey: string };
  records: LedgerRecord[];
  importHistory: ImportHistoryItem[];
  receiptHistory: ReceiptEditHistoryItem[];
  sessionHistory: SessionHistoryItem[];
  regionalSummaries: RegionalSummary[];
  sourceQualityReports: SourceQualityReport[];
  digest: string;
};

const APP_VERSION = "1.7.0";
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
  { title: "Start with public sources", body: "Import only public datasets, permits, utility filings, operator announcements, or news records you can cite." },
  { title: "Preview before commit", body: "Inspect normalized rows, warnings, source posture, and batch receipts before adding records." },
  { title: "Attach receipts", body: "Use the receipt editor to add source name, type, public link, retrieved date, confidence, and exact claim text." },
  { title: "Save sessions", body: "Export a local review session before pausing or sharing work; reload only packets from trusted reviewers." }
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
    receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "City-level demo row for UI testing only.", confidence: "low" }],
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
    receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "County-level placeholder for workflow testing.", confidence: "low" }],
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
    receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "Demonstrates a low-confidence review queue item.", confidence: "low" }],
    notes: []
  }
];

const nowIso = () => new Date().toISOString();
const todayInputDate = () => new Date().toISOString().slice(0, 10);
const emptyCounts = <T extends string>(keys: T[]) => Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;

function digest(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, "0")}`;
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
    headers.forEach((header, headerIndex) => { row[header] = values[headerIndex]?.trim() || ""; });
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
  if (!value) { pushWarning(warnings, rowNumber, "warning", "Missing confidence; defaulted to 50.", "confidence"); return 50; }
  if (Number.isNaN(parsed)) { pushWarning(warnings, rowNumber, "warning", `Invalid confidence "${value}"; defaulted to 50.`, "confidence"); return 50; }
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
  if (headers.length === 0) pushWarning(globalWarnings, 1, "blocking", "CSV text is empty or missing a header row.");
  if (headers.length > 0 && rows.length === 0) pushWarning(globalWarnings, 1, "blocking", "CSV has a header row but no data rows.");
  for (const column of ["name", "state", "source"]) {
    if (!headers.includes(column) && !(column === "state" && headers.includes("state_abb"))) pushWarning(globalWarnings, 1, "warning", `Recommended column "${column}" is missing.`, column);
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
    if (readCell(row, "lat") || readCell(row, "lon") || readCell(row, "longitude") || readCell(row, "latitude")) pushWarning(warnings, rowNumber, "warning", "Coordinate columns detected. The app does not display them; confirm they are already public before keeping them in external datasets.", "lat/lon");
    if (capacityRaw && Number.isNaN(Number(capacityRaw))) pushWarning(warnings, rowNumber, "warning", `Invalid capacity_mw "${capacityRaw}" ignored.`, "capacity_mw");
    if (capacityMW && capacityMW > 0) pushWarning(warnings, rowNumber, "warning", "MW capacity is a high-impact claim and should have a second independent source before promotion.", "capacity_mw");

    const reviewWarnings = warnings.filter((warning) => warning.level !== "info").map((warning) => warning.message);
    const record: LedgerRecord = {
      id, name, operator, status, state, county, city, precision,
      capacityMW: capacityMW && !Number.isNaN(capacityMW) ? capacityMW : undefined,
      lifecycle: "raw_import",
      confidenceScore,
      reviewWarnings: ["Imported row needs human review before promotion.", ...reviewWarnings],
      receipts: [{ sourceName, sourceType, sourceUrl, retrievedAt: new Date(retrievedAt).toString() === "Invalid Date" ? createdAt : new Date(retrievedAt).toISOString(), claim: sourceClaim, confidence: confidenceLabel(confidenceScore), batchId }],
      notes: [`Imported through batch ${batchId} from ${origin}.`],
      importBatchId: batchId
    };
    return { rowNumber, record, warnings };
  });

  return { batchId, createdAt, origin, rows: previewRows, warnings: globalWarnings, digest: digest({ batchId, rows: previewRows.map((row) => row.record), globalWarnings }) };
}

function allPreviewWarnings(preview?: ImportPreview | null) {
  if (!preview) return [];
  return [...preview.warnings, ...preview.rows.flatMap((row) => row.warnings)];
}

function warningCount(preview: ImportPreview | null, level?: WarningLevel) {
  const warnings = allPreviewWarnings(preview);
  return level ? warnings.filter((warning) => warning.level === level).length : warnings.length;
}

function daysOld(iso: string) {
  const date = new Date(iso);
  if (date.toString() === "Invalid Date") return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function qualityBand(score: number, gaps: string[]): QualityBand {
  if (gaps.some((gap) => gap.toLowerCase().includes("blocking"))) return "blocked";
  if (score >= 80) return "strong";
  if (score >= 65) return "moderate";
  if (score >= 45) return "weak";
  return "blocked";
}

function sourceQualityReport(record: LedgerRecord): SourceQualityReport {
  let score = 30;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const receiptCount = record.receipts.length;
  const sourceTypeCount = new Set(record.receipts.map((receipt) => receipt.sourceType)).size;
  const publicLinkCount = record.receipts.filter((receipt) => Boolean(receipt.sourceUrl)).length;
  const publicLinkCoverage = receiptCount ? Math.round((publicLinkCount / receiptCount) * 100) : 0;
  const receiptAges = record.receipts.map((receipt) => daysOld(receipt.retrievedAt)).filter((age): age is number => age !== null);
  const newestReceiptDaysOld = receiptAges.length ? Math.min(...receiptAges) : null;
  const hasHighImpactClaim = Boolean(record.capacityMW && record.capacityMW > 0);
  const hasSecondSource = sourceTypeCount >= 2 && receiptCount >= 2 && publicLinkCount >= 2;
  const highImpactClaimCoverage: SourceQualityReport["highImpactClaimCoverage"] = hasHighImpactClaim ? (hasSecondSource ? "covered" : "needs_second_source") : "not_applicable";

  score += Math.min(24, receiptCount * 8);
  if (sourceTypeCount >= 2) { score += 14; strengths.push("multiple source types"); } else gaps.push("needs source diversity");
  if (publicLinkCoverage >= 80) { score += 14; strengths.push("strong public-link coverage"); } else if (publicLinkCoverage > 0) { score += 6; gaps.push("partial public-link coverage"); } else gaps.push("no public links");
  if (newestReceiptDaysOld !== null && newestReceiptDaysOld <= 180) { score += 8; strengths.push("recent receipt present"); } else if (newestReceiptDaysOld === null) gaps.push("no receipt dates"); else gaps.push("receipts may be stale");
  if (!hasHighImpactClaim) { score += 6; strengths.push("no MW high-impact claim"); } else if (hasSecondSource) { score += 10; strengths.push("MW claim has second-source coverage"); } else gaps.push("MW claim needs second independent public source");
  if (record.confidenceScore >= 70) score += 8; else gaps.push("record confidence below 70");
  if (record.reviewWarnings.length === 0) score += 10; else gaps.push(`${record.reviewWarnings.length} unresolved review warning(s)`);
  if (record.precision === "unknown") gaps.push("blocking: unknown location precision");
  if (receiptCount === 0) gaps.push("blocking: missing receipts");

  const finalScore = Math.max(0, Math.min(100, score));
  return { recordId: record.id, score: finalScore, band: qualityBand(finalScore, gaps), receiptCount, sourceTypeCount, publicLinkCoverage, newestReceiptDaysOld, highImpactClaimCoverage, strengths, gaps, digest: digest({ recordId: record.id, finalScore, strengths, gaps }) };
}

function canonicalBlockers(record: LedgerRecord) {
  const blockers: string[] = [];
  const quality = sourceQualityReport(record);
  if (record.lifecycle !== "promoted_public") blockers.push("not promoted_public");
  if (record.receipts.length === 0) blockers.push("missing receipt");
  if (record.confidenceScore < 70) blockers.push("confidence below 70");
  if (record.precision === "unknown") blockers.push("unknown location precision");
  if (record.reviewWarnings.length > 0) blockers.push("review warnings remain");
  if (quality.score < 65) blockers.push("source quality below 65");
  return blockers;
}

function buildRegionalSummaries(records: LedgerRecord[], mode: RegionMode, qualityReports: SourceQualityReport[]) {
  const qualityById = new Map(qualityReports.map((report) => [report.recordId, report]));
  const groups = new Map<string, LedgerRecord[]>();
  records.forEach((record) => {
    const key = mode === "state" ? record.state : `${record.state}|${record.county}`;
    groups.set(key, [...(groups.get(key) || []), record]);
  });

  return Array.from(groups.entries()).map(([key, group]) => {
    const qualityBands = emptyCounts<QualityBand>(["strong", "moderate", "weak", "blocked"]);
    const statusCounts = emptyCounts<Status>(validStatuses);
    const precisionCounts = emptyCounts<Precision>(validPrecisions);
    const gapCounts = new Map<string, number>();
    let totalQuality = 0;
    let receiptCount = 0;

    group.forEach((record) => {
      const quality = qualityById.get(record.id) || sourceQualityReport(record);
      totalQuality += quality.score;
      qualityBands[quality.band] += 1;
      statusCounts[record.status] += 1;
      precisionCounts[record.precision] += 1;
      receiptCount += record.receipts.length;
      [...record.reviewWarnings, ...quality.gaps].forEach((gap) => gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1));
    });

    const label = mode === "state" ? key : key.replace("|", " / ");
    const canonicalCount = group.filter((record) => canonicalBlockers(record).length === 0).length;
    const averageQuality = group.length ? Math.round(totalQuality / group.length) : 0;
    const topReviewGaps = Array.from(gapCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([gap, count]) => `${gap} (${count})`);

    const summary: RegionalSummary = { key, label, mode, recordCount: group.length, canonicalCount, needsReviewCount: group.length - canonicalCount, receiptCount, averageQuality, qualityBands, statusCounts, precisionCounts, topReviewGaps, digest: "" };
    return { ...summary, digest: digest(summary) };
  }).sort((a, b) => b.recordCount - a.recordCount || a.label.localeCompare(b.label));
}

function makeEmptyReceiptDraft(): ReceiptDraft {
  return { sourceName: "", sourceType: "public_dataset", sourceUrl: "", retrievedAt: todayInputDate(), claim: "", confidence: "medium" };
}

function isHttpUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateReceiptDraft(draft: ReceiptDraft): ImportWarning[] {
  const warnings: ImportWarning[] = [];
  if (!draft.sourceName.trim()) pushWarning(warnings, 0, "blocking", "Source name is required.", "sourceName");
  if (!draft.claim.trim()) pushWarning(warnings, 0, "blocking", "Claim text is required so reviewers know exactly what the source supports.", "claim");
  if (draft.claim.trim().length > 0 && draft.claim.trim().length < 18) pushWarning(warnings, 0, "warning", "Claim text is very short; quote or summarize the specific public claim being supported.", "claim");
  if (!draft.retrievedAt.trim() || new Date(draft.retrievedAt).toString() === "Invalid Date") pushWarning(warnings, 0, "blocking", "Retrieved date must be a valid date.", "retrievedAt");
  if (!draft.sourceUrl.trim()) pushWarning(warnings, 0, "warning", "No source URL supplied; public links make review and promotion stronger.", "sourceUrl");
  if (draft.sourceUrl.trim() && !isHttpUrl(draft.sourceUrl)) pushWarning(warnings, 0, "blocking", "Source URL must start with http:// or https://.", "sourceUrl");
  if (draft.sourceType === "other") pushWarning(warnings, 0, "info", "Source type is other; classify it more specifically if possible.", "sourceType");
  return warnings;
}

function buildReceiptFromDraft(draft: ReceiptDraft, record: LedgerRecord, addedAt: string): Receipt {
  const sourceUrl = draft.sourceUrl.trim();
  const retrievedDate = new Date(draft.retrievedAt);
  return { receiptId: digest({ recordId: record.id, draft, addedAt }), sourceName: draft.sourceName.trim(), sourceType: draft.sourceType, sourceUrl: sourceUrl || undefined, retrievedAt: retrievedDate.toString() === "Invalid Date" ? addedAt : retrievedDate.toISOString(), claim: draft.claim.trim(), confidence: draft.confidence };
}

function resolveWarningsAfterReceipt(record: LedgerRecord, receipt: Receipt) {
  const nextReceiptCount = record.receipts.length + 1;
  const hasPublicLink = Boolean(receipt.sourceUrl);
  const resolved: string[] = [];
  const remaining = record.reviewWarnings.filter((warning) => {
    const lower = warning.toLowerCase();
    const shouldResolve =
      (lower.includes("missing source") && Boolean(receipt.sourceName)) ||
      ((lower.includes("source_url") || lower.includes("source url") || lower.includes("public link")) && hasPublicLink) ||
      ((lower.includes("second public source") || lower.includes("second independent source") || lower.includes("needs a second public source")) && nextReceiptCount >= 2 && hasPublicLink) ||
      (lower.includes("needs permit source") && receipt.sourceType === "permit") ||
      (lower.includes("needs utility source") && receipt.sourceType === "utility") ||
      (lower.includes("operator confirmation") && receipt.sourceType === "operator") ||
      (lower.includes("imported row needs human review") && receipt.claim.length > 20);
    if (shouldResolve) resolved.push(warning);
    return !shouldResolve;
  });
  const additions: string[] = [];
  if (!hasPublicLink) additions.push("Newest receipt has no source URL; attach a public link before promotion.");
  if (receipt.sourceType === "other") additions.push("Newest receipt source type is other; classify it before promotion if possible.");
  return { remaining: Array.from(new Set([...remaining, ...additions])), resolved };
}

function buildRegionalChecklist(summary: RegionalSummary, records: LedgerRecord[], qualityReports: SourceQualityReport[]): RegionalChecklistItem[] {
  const recordsWithReceipts = records.filter((record) => record.receipts.length > 0).length;
  const recordsWithLinks = records.filter((record) => record.receipts.some((receipt) => receipt.sourceUrl)).length;
  const highImpactRecords = records.filter((record) => record.capacityMW && record.capacityMW > 0);
  const highImpactCovered = highImpactRecords.filter((record) => (qualityReports.find((report) => report.recordId === record.id)?.highImpactClaimCoverage === "covered")).length;
  const blockedQuality = qualityReports.filter((report) => report.band === "blocked").length;

  return [
    { label: "Map-safe boundary", status: "pass", detail: "Regional packet uses state/county grouping only; no facility coordinate map is generated." },
    { label: "Receipt coverage", status: recordsWithReceipts === records.length ? "pass" : recordsWithReceipts > 0 ? "warning" : "fail", detail: `${recordsWithReceipts}/${records.length} records have at least one receipt.` },
    { label: "Public link coverage", status: recordsWithLinks === records.length ? "pass" : recordsWithLinks > 0 ? "warning" : "fail", detail: `${recordsWithLinks}/${records.length} records have at least one public source link.` },
    { label: "Average source quality", status: summary.averageQuality >= 65 ? "pass" : summary.averageQuality >= 45 ? "warning" : "fail", detail: `Average source quality is ${summary.averageQuality}.` },
    { label: "High-impact claims", status: highImpactRecords.length === 0 || highImpactCovered === highImpactRecords.length ? "pass" : "needs_human", detail: `${highImpactCovered}/${highImpactRecords.length} MW/high-impact records have second-source coverage.` },
    { label: "Blocked-quality records", status: blockedQuality === 0 ? "pass" : "warning", detail: `${blockedQuality} record(s) are in blocked source-quality band.` },
    { label: "Canonical readiness", status: summary.needsReviewCount === 0 ? "pass" : "needs_human", detail: `${summary.needsReviewCount}/${summary.recordCount} records still need review.` }
  ];
}

function buildRegionalEvidencePacket(summary: RegionalSummary, records: LedgerRecord[], qualityReports: SourceQualityReport[]): RegionalEvidencePacket {
  const recordsWithReceipts = records.filter((record) => record.receipts.length > 0).length;
  const recordsWithPublicLinks = records.filter((record) => record.receipts.some((receipt) => receipt.sourceUrl)).length;
  const totalReceipts = records.reduce((sum, record) => sum + record.receipts.length, 0);
  const packetRecords = records.map((record) => ({ record, quality: qualityReports.find((report) => report.recordId === record.id) || sourceQualityReport(record), canonicalBlockers: canonicalBlockers(record) }));
  const checklist = buildRegionalChecklist(summary, records, qualityReports);
  const humanReviewPrompts = [
    "Confirm every source is public and appropriate for reuse.",
    "Review any MW, water, jobs, approval, or construction claims against at least two independent public sources.",
    "Do not add exact coordinates or sensitive facility details unless already published in a public source and appropriate to include.",
    "Promote records only after blockers, source quality, and regional review gaps are resolved."
  ];
  const payload = { summary, packetRecords, checklist, humanReviewPrompts };
  return { schema: "DataCenterLedger.RegionalEvidencePacket.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, boundary: publicBoundary, summary, records: packetRecords, receiptCoverage: { recordsWithReceipts, recordsWithPublicLinks, totalReceipts, publicLinkCoverage: records.length ? Math.round((recordsWithPublicLinks / records.length) * 100) : 0 }, checklist, humanReviewPrompts, digest: digest(payload) };
}

function validateSessionPacket(payload: unknown): payload is LocalReviewSessionPacket {
  if (!payload || typeof payload !== "object") return false;
  const session = payload as Partial<LocalReviewSessionPacket>;
  return session.schema === "DataCenterLedger.LocalReviewSession.v1.7" && Array.isArray(session.records) && Boolean(session.uiState) && Array.isArray(session.importHistory) && Array.isArray(session.receiptHistory);
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
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft>(() => makeEmptyReceiptDraft());
  const [receiptHistory, setReceiptHistory] = useState<ReceiptEditHistoryItem[]>([]);
  const [regionMode, setRegionMode] = useState<RegionMode>("state");
  const [selectedRegionKey, setSelectedRegionKey] = useState("VA");
  const [sessionName, setSessionName] = useState("DataCenterLedger local review session");
  const [sessionLoadText, setSessionLoadText] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const qualityReports = useMemo(() => records.map(sourceQualityReport), [records]);
  const qualityById = useMemo(() => new Map(qualityReports.map((report) => [report.recordId, report])), [qualityReports]);
  const canonicalRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length === 0), [records]);
  const reviewRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length > 0), [records]);
  const demoRecords = useMemo(() => records.filter((record) => record.id.startsWith("dcl-demo-")), [records]);
  const regionalSummaries = useMemo(() => buildRegionalSummaries(records, regionMode, qualityReports), [records, regionMode, qualityReports]);
  const selectedRegion = regionalSummaries.find((summary) => summary.key === selectedRegionKey) || regionalSummaries[0];
  const selectedRegionRecords = useMemo(() => {
    if (!selectedRegion) return [];
    return records.filter((record) => regionMode === "state" ? record.state === selectedRegion.key : `${record.state}|${record.county}` === selectedRegion.key);
  }, [records, regionMode, selectedRegion]);
  const selectedRegionQuality = selectedRegionRecords.map((record) => qualityById.get(record.id) || sourceQualityReport(record));
  const selectedRegionalEvidencePacket = selectedRegion ? buildRegionalEvidencePacket(selectedRegion, selectedRegionRecords, selectedRegionQuality) : null;
  const sourceQualityCounts = qualityReports.reduce((counts, report) => ({ ...counts, [report.band]: counts[report.band] + 1 }), emptyCounts<QualityBand>(["strong", "moderate", "weak", "blocked"]));
  const importWarnings = allPreviewWarnings(importPreview);
  const hasBlockingImport = importWarnings.some((warning) => warning.level === "blocking");
  const receiptDraftWarnings = useMemo(() => validateReceiptDraft(receiptDraft), [receiptDraft]);
  const hasBlockingReceiptDraft = receiptDraftWarnings.some((warning) => warning.level === "blocking");
  const selectedReceiptHistory = receiptHistory.filter((item) => item.recordId === selected.id);

  const visibleRecords = useMemo(() => records.filter((record) => {
    const haystack = `${record.name} ${record.operator} ${record.county} ${record.city || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || record.state === stateFilter;
    const blockers = canonicalBlockers(record);
    const matchesMode = mode === "all" || (mode === "canonical" ? blockers.length === 0 : blockers.length > 0);
    return matchesQuery && matchesState && matchesMode;
  }), [records, query, stateFilter, mode]);

  function buildSessionPacket(): LocalReviewSessionPacket {
    const generatedAt = nowIso();
    const sessionId = digest({ sessionName, generatedAt, records, importHistory, receiptHistory });
    const base = {
      schema: "DataCenterLedger.LocalReviewSession.v1.7" as const,
      sessionId,
      sessionName: sessionName.trim() || "DataCenterLedger local review session",
      generatedAt,
      appVersion: APP_VERSION,
      boundary: publicBoundary,
      uiState: { selectedId, query, stateFilter, mode, regionMode, selectedRegionKey },
      records,
      importHistory,
      receiptHistory,
      sessionHistory,
      regionalSummaries,
      sourceQualityReports: qualityReports
    };
    return { ...base, digest: digest(base) };
  }

  function exportSession() {
    const packet = buildSessionPacket();
    const historyItem: SessionHistoryItem = { sessionId: packet.sessionId, action: "exported", at: packet.generatedAt, name: packet.sessionName, recordCount: packet.records.length, digest: packet.digest };
    setSessionHistory((items) => [historyItem, ...items]);
    downloadJson("datacenter-ledger-review-session.json", { ...packet, sessionHistory: [historyItem, ...sessionHistory] });
    setSessionMessage(`Exported local review session ${packet.sessionId}.`);
  }

  function restoreSession(packet: LocalReviewSessionPacket) {
    const loadedAt = nowIso();
    const historyItem: SessionHistoryItem = { sessionId: packet.sessionId, action: "loaded", at: loadedAt, name: packet.sessionName, recordCount: packet.records.length, digest: packet.digest };
    setRecords(packet.records);
    setSelectedId(packet.uiState.selectedId || packet.records[0]?.id || starterRecords[0].id);
    setQuery(packet.uiState.query || "");
    setStateFilter(packet.uiState.stateFilter || "all");
    setMode(packet.uiState.mode || "all");
    setRegionMode(packet.uiState.regionMode || "state");
    setSelectedRegionKey(packet.uiState.selectedRegionKey || packet.records[0]?.state || "");
    setImportHistory(packet.importHistory || []);
    setReceiptHistory(packet.receiptHistory || []);
    setSessionHistory([historyItem, ...(packet.sessionHistory || [])]);
    setImportPreview(null);
    setImportText("");
    setSessionLoadText("");
    setSessionMessage(`Loaded session ${packet.sessionId} with ${packet.records.length} record(s).`);
  }

  function loadSessionFromText() {
    try {
      const parsed = JSON.parse(sessionLoadText);
      if (!validateSessionPacket(parsed)) {
        setSessionMessage("Session load blocked: packet is not a v1.7 local review session.");
        return;
      }
      restoreSession(parsed);
    } catch {
      setSessionMessage("Session load blocked: JSON could not be parsed.");
    }
  }

  async function loadSessionFile(file: File) {
    const text = await file.text();
    setSessionLoadText(text);
    try {
      const parsed = JSON.parse(text);
      if (!validateSessionPacket(parsed)) {
        setSessionMessage("Session file blocked: packet is not a v1.7 local review session.");
        return;
      }
      restoreSession(parsed);
    } catch {
      setSessionMessage("Session file blocked: JSON could not be parsed.");
    }
  }

  function promoteSelected() {
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, lifecycle: "promoted_public", reviewWarnings: [], notes: [...item.notes, `Promoted locally at ${new Date().toLocaleString()}. Confirm source posture before publishing.`] } : item));
  }

  function saveNote() {
    if (!note.trim()) return;
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, notes: [...item.notes, note.trim()] } : item));
    setNote("");
  }

  function updateReceiptDraft<K extends keyof ReceiptDraft>(key: K, value: ReceiptDraft[K]) { setReceiptDraft((draft) => ({ ...draft, [key]: value })); }
  function clearReceiptDraft() { setReceiptDraft(makeEmptyReceiptDraft()); }

  function addReceiptToSelected() {
    if (hasBlockingReceiptDraft) return;
    const addedAt = nowIso();
    const receipt = buildReceiptFromDraft(receiptDraft, selected, addedAt);
    const resolution = resolveWarningsAfterReceipt(selected, receipt);
    const historyItem: ReceiptEditHistoryItem = { receiptId: receipt.receiptId || digest({ receipt, addedAt }), recordId: selected.id, recordName: selected.name, addedAt, sourceName: receipt.sourceName, sourceType: receipt.sourceType, confidence: receipt.confidence, resolvedWarnings: resolution.resolved, remainingWarnings: resolution.remaining.length, digest: digest({ receipt, recordId: selected.id, addedAt, resolvedWarnings: resolution.resolved }) };
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, receipts: [...item.receipts, receipt], reviewWarnings: resolution.remaining, notes: [...item.notes, `Receipt ${historyItem.receiptId} added at ${new Date(addedAt).toLocaleString()} from ${receipt.sourceName}. Resolved ${resolution.resolved.length} warning(s).`] } : item));
    setReceiptHistory((items) => [historyItem, ...items]);
    clearReceiptDraft();
  }

  function previewImportFromText(origin = "pasted CSV") { setImportPreview(buildImportPreview(importText, origin, records)); }
  async function loadCsvFile(file: File) { const text = await file.text(); setImportText(text); setImportPreview(buildImportPreview(text, file.name, records)); }
  function loadSampleImport() { setImportText(sampleCsv); setImportPreview(buildImportPreview(sampleCsv, "sample CSV", records)); }

  function commitImportPreview() {
    if (!importPreview || hasBlockingImport) return;
    const importedRecords = importPreview.rows.map((row) => row.record);
    setRecords((items) => [...items, ...importedRecords]);
    setImportHistory((items) => [{ batchId: importPreview.batchId, committedAt: nowIso(), origin: importPreview.origin, rowsCommitted: importedRecords.length, warningCount: warningCount(importPreview), digest: importPreview.digest }, ...items]);
    if (importedRecords[0]) setSelectedId(importedRecords[0].id);
    setImportPreview(null);
    setImportText("");
  }

  function clearImportWorkbench() { setImportPreview(null); setImportText(""); }

  function resetDemoData() {
    setRecords(starterRecords);
    setSelectedId(starterRecords[0].id);
    setQuery("");
    setStateFilter("all");
    setMode("all");
    setImportPreview(null);
    setImportText("");
    setImportHistory([]);
    setReceiptHistory([]);
    setSessionHistory([]);
    setRegionMode("state");
    setSelectedRegionKey("VA");
    setSessionLoadText("");
    setSessionMessage("");
    clearReceiptDraft();
  }

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", { schema: "DataCenterLedger.Export.v1.7-local-review-session", generatedAt: nowIso(), appVersion: APP_VERSION, boundary: publicBoundary, importHistory, receiptHistory, sessionHistory, sourceQualityReports: qualityReports, regionalSummaries, selectedRegionalEvidencePacket, records, digest: digest({ records, importHistory, receiptHistory, sessionHistory, regionalSummaries }) });
  }

  function exportCanonical() {
    const included = canonicalRecords;
    const excluded = records.filter((record) => canonicalBlockers(record).length > 0).map((record) => ({ id: record.id, name: record.name, blockers: canonicalBlockers(record), sourceQuality: qualityById.get(record.id) }));
    downloadJson("datacenter-ledger-canonical.json", { schema: "DataCenterLedger.CanonicalRegistry.v1.7-local-review-session", generatedAt: nowIso(), appVersion: APP_VERSION, included, excluded, regionalSummaries, digest: digest({ included, excluded, regionalSummaries }) });
  }

  function exportLaunchPacket() {
    downloadJson("datacenter-ledger-public-launch-packet.json", { schema: "DataCenterLedger.PublicLaunchPacket.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, purpose: "Public-safe civic transparency workbench for reviewing U.S. data center records as source-backed claims.", boundary: publicBoundary, safeUseSteps, stats: { records: records.length, demoRecords: demoRecords.length, canonicalRecords: canonicalRecords.length, needsReview: reviewRecords.length, receipts: records.reduce((sum, record) => sum + record.receipts.length, 0), receiptEdits: receiptHistory.length, importBatches: importHistory.length, savedSessionEvents: sessionHistory.length, regionalSummaries: regionalSummaries.length }, digest: digest({ records, importHistory, receiptHistory, sessionHistory, publicBoundary, safeUseSteps }) });
  }

  function exportImportPreview() {
    if (!importPreview) return;
    downloadJson("datacenter-ledger-import-preview.json", { schema: "DataCenterLedger.ImportPreview.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, preview: importPreview, warningSummary: { total: warningCount(importPreview), blocking: warningCount(importPreview, "blocking"), warning: warningCount(importPreview, "warning"), info: warningCount(importPreview, "info") } });
  }

  function exportImportHistory() { downloadJson("datacenter-ledger-import-history.json", { schema: "DataCenterLedger.ImportHistory.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, importHistory, digest: digest(importHistory) }); }
  function exportSelectedReceiptPacket() { downloadJson("datacenter-ledger-selected-receipts.json", { schema: "DataCenterLedger.SelectedReceiptPacket.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, selectedRecord: selected, canonicalBlockers: canonicalBlockers(selected), sourceQuality: qualityById.get(selected.id), receiptHistory: selectedReceiptHistory, digest: digest({ selected, selectedReceiptHistory }) }); }
  function exportReceiptHistory() { downloadJson("datacenter-ledger-receipt-history.json", { schema: "DataCenterLedger.ReceiptEditHistory.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, receiptHistory, digest: digest(receiptHistory) }); }
  function exportRegionalSummary() { downloadJson("datacenter-ledger-regional-summary.json", { schema: "DataCenterLedger.MapSafeRegionalSummary.v1.7", generatedAt: nowIso(), appVersion: APP_VERSION, regionMode, boundary: publicBoundary, regionalSummaries, digest: digest({ regionMode, regionalSummaries }) }); }
  function exportSelectedRegionalEvidence() { if (selectedRegionalEvidencePacket) downloadJson("datacenter-ledger-regional-evidence-packet.json", selectedRegionalEvidencePacket); }

  return (
    <main className="shell">
      <header className="hero launchHero">
        <div>
          <p className="eyebrow">v{APP_VERSION} local review session sprint • local-first • receipt-backed</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>A civic transparency workbench for reviewing public data center records as claims — with receipts, confidence scores, import review gates, regional evidence packets, local session save/load, and a clear safety boundary.</p>
          <div className="boundaryPills" aria-label="Public safety boundary">{publicBoundary.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="heroActions"><button onClick={exportLedger}>Export Ledger JSON</button><button onClick={exportCanonical}>Export Canonical JSON</button><button onClick={exportLaunchPacket}>Export Launch Packet</button></div>
      </header>

      <section className="launchGrid" aria-label="Launch overview">
        <div className="panel introPanel"><p className="eyebrow">What this is</p><h2>Public records in, reviewed Ledger out.</h2><p>Paste or load a CSV, preview rows, attach source receipts, score source quality, review regions safely, export evidence packets, and save or restore a full local workspace session.</p></div>
        <div className="panel introPanel cautionPanel"><p className="eyebrow">What this is not</p><h2>Not a targeting map.</h2><p>This starter app ships with demo rows only. It should not be used to add private access details, sensitive layouts, unreviewed exact coordinates, or any non-public enrichment.</p></div>
      </section>

      <section className="cards">
        <Stat label="Records" value={records.length} /><Stat label="Canonical" value={canonicalRecords.length} /><Stat label="Receipts" value={records.reduce((sum, record) => sum + record.receipts.length, 0)} /><Stat label="Receipt edits" value={receiptHistory.length} /><Stat label="Sessions" value={sessionHistory.length} /><Stat label="Needs review" value={reviewRecords.length} /><Stat label="Regions" value={regionalSummaries.length} />
      </section>

      <section className="panel walkthrough"><div><p className="eyebrow">How to use this safely</p><h2>Four-step public review flow</h2></div><div className="stepGrid">{safeUseSteps.map((step, index) => <article key={step.title} className="stepCard"><span>{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>

      <section className="panel sessionWorkbench" aria-label="Local review session workbench">
        <div className="panelHeader"><div><p className="eyebrow">v1.7 Local Review Session</p><h2>Save or restore a full local workspace</h2><p className="muted">Export records, receipts, notes, import history, receipt history, source quality reports, selected region state, and UI filters into one deterministic review-session packet. Restore only trusted packets.</p></div><div className="heroActions"><button onClick={exportSession}>Export Session JSON</button><label className="fileButton">Load Session File<input type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadSessionFile(file); event.currentTarget.value = ""; }} /></label></div></div>
        <div className="sessionGrid"><label>Session name<input value={sessionName} onChange={(event) => setSessionName(event.target.value)} /></label><label>Paste session JSON<textarea value={sessionLoadText} onChange={(event) => setSessionLoadText(event.target.value)} placeholder="Paste a DataCenterLedger.LocalReviewSession.v1.7 packet here to restore it locally." /></label></div>
        <div className="importActions"><button onClick={loadSessionFromText} disabled={!sessionLoadText.trim()}>Restore Pasted Session</button><button onClick={() => { setSessionLoadText(""); setSessionMessage(""); }}>Clear Session Loader</button></div>
        {sessionMessage && <p className="sessionMessage">{sessionMessage}</p>}
        {sessionHistory.length > 0 && <div className="batchMeta"><strong>Session history</strong>{sessionHistory.slice(0, 4).map((item) => <span key={`${item.sessionId}-${item.at}`}>{item.action} • {item.name} • {item.recordCount} record(s) • {item.digest}</span>)}</div>}
      </section>

      <section className="panel qualityPanel"><div className="panelHeader"><div><p className="eyebrow">v1.4 Source Quality Scoreboard</p><h2>Source quality before public confidence</h2><p className="muted">Scores help reviewers spot weak receipt coverage. They are not proof of truth.</p></div><div className="qualityLegend"><span className="chip ok">strong {sourceQualityCounts.strong}</span><span className="chip info">moderate {sourceQualityCounts.moderate}</span><span className="chip warn">weak {sourceQualityCounts.weak}</span><span className="chip danger">blocked {sourceQualityCounts.blocked}</span></div></div><div className="qualityRows">{qualityReports.map((report) => { const record = records.find((item) => item.id === report.recordId); return <button key={report.recordId} className={`qualityRow ${report.band}`} onClick={() => record && setSelectedId(record.id)}><span><strong>{record?.name || report.recordId}</strong><small>{report.gaps[0] || report.strengths[0] || "review source posture"}</small></span><b>{report.score}</b></button>; })}</div></section>

      <section className="panel regionalPanel"><div className="panelHeader"><div><p className="eyebrow">v1.6 Regional Evidence</p><h2>Map-safe state/county review</h2><p className="muted">Regional summaries only. No exact coordinate map, no sensitive layouts, no private facility discovery.</p></div><div className="heroActions"><select value={regionMode} onChange={(event) => { const nextMode = event.target.value as RegionMode; setRegionMode(nextMode); setSelectedRegionKey(""); }}><option value="state">State summaries</option><option value="county">County summaries</option></select><button onClick={exportRegionalSummary}>Export Regional Summary</button><button onClick={exportSelectedRegionalEvidence} disabled={!selectedRegionalEvidencePacket}>Export Evidence Packet</button></div></div>
        <div className="regionalGrid"><div className="tableWrap regionalTable"><table><thead><tr><th>Region</th><th>Records</th><th>Canonical</th><th>Avg quality</th><th>Top gap</th></tr></thead><tbody>{regionalSummaries.map((summary) => <tr key={summary.key} onClick={() => setSelectedRegionKey(summary.key)} className={summary.key === selectedRegion?.key ? "selected" : ""}><td><strong>{summary.label}</strong><small>{summary.mode}</small></td><td>{summary.recordCount}</td><td>{summary.canonicalCount}</td><td>{summary.averageQuality}</td><td>{summary.topReviewGaps[0] || "none"}</td></tr>)}</tbody></table></div>{selectedRegion && <aside className="regionalCard"><p className="eyebrow">Selected region</p><h3>{selectedRegion.label}</h3><div className="miniGrid"><Stat label="Records" value={selectedRegion.recordCount} /><Stat label="Receipts" value={selectedRegion.receiptCount} /><Stat label="Avg quality" value={selectedRegion.averageQuality} /></div><h4>Evidence checklist</h4>{selectedRegionalEvidencePacket?.checklist.map((item) => <p key={item.label} className={`checkItem ${item.status}`}><strong>{item.status}</strong> {item.label}: {item.detail}</p>)}<h4>Top review gaps</h4><ul>{(selectedRegion.topReviewGaps.length ? selectedRegion.topReviewGaps : ["No regional gaps detected."]).map((gap) => <li key={gap}>{gap}</li>)}</ul><small>Packet digest: {selectedRegionalEvidencePacket?.digest}</small></aside>}</div>
      </section>

      <section className="panel importWorkbench" aria-label="Import review workbench"><div className="panelHeader"><div><p className="eyebrow">v1.2 Import Review Workbench</p><h2>Preview CSV rows before they enter the Ledger</h2><p className="muted">Paste normalized CSV or load a file. The app creates a batch preview, source receipts, validation warnings, and a deterministic preview digest before anything is committed.</p></div><div className="heroActions"><button onClick={loadSampleImport}>Load Sample CSV</button><label className="fileButton">Load CSV file<input type="file" accept=".csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadCsvFile(file); event.currentTarget.value = ""; }} /></label></div></div><textarea className="csvTextArea" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste normalized CSV here. Required posture: public source, state, reviewable claim, and receipt context." /><div className="importActions"><button onClick={() => previewImportFromText()} disabled={!importText.trim()}>Preview CSV</button><button onClick={exportImportPreview} disabled={!importPreview}>Export Preview Packet</button><button onClick={commitImportPreview} disabled={!importPreview || hasBlockingImport}>Commit Preview to Ledger</button><button onClick={exportImportHistory} disabled={importHistory.length === 0}>Export Import History</button><button onClick={clearImportWorkbench}>Clear Import Workbench</button></div>{importPreview ? <div className="previewPanel"><div className="previewSummary"><Stat label="Preview rows" value={importPreview.rows.length} /><Stat label="Blocking" value={warningCount(importPreview, "blocking")} /><Stat label="Warnings" value={warningCount(importPreview, "warning")} /><Stat label="Info" value={warningCount(importPreview, "info")} /></div><div className="batchMeta"><span><strong>Batch:</strong> {importPreview.batchId}</span><span><strong>Origin:</strong> {importPreview.origin}</span><span><strong>Digest:</strong> {importPreview.digest}</span></div>{hasBlockingImport && <p className="dangerText">Blocking issues must be fixed before this batch can be committed.</p>}<div className="tableWrap previewTable"><table><thead><tr><th>Row</th><th>Name</th><th>State</th><th>Source</th><th>Warnings</th></tr></thead><tbody>{importPreview.rows.map((row) => <tr key={`${importPreview.batchId}-${row.rowNumber}`}><td>{row.rowNumber}</td><td><strong>{row.record.name}</strong><small>{row.record.operator}</small></td><td>{row.record.state}</td><td>{row.record.receipts[0]?.sourceName || "Missing source"}</td><td>{row.warnings.length ? row.warnings.map((warning) => <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>{warning.level}: {warning.message}</span>) : <span className="chip ok">ready for review</span>}</td></tr>)}</tbody></table></div></div> : <p className="muted">No active preview yet. Load the sample CSV or paste public-source rows to begin.</p>}</section>

      <section className="toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, operators, counties..." /><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">All states</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select><select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="all">All records</option><option value="canonical">Canonical only</option><option value="review">Needs review</option></select><button onClick={resetDemoData}>Reset Demo</button></section>

      <section className="sampleNotice panel"><strong>Sample data loaded:</strong><span>{demoRecords.length} demo rows are visible so the live site is understandable immediately. Replace them with public-source imports before using the Ledger for real review work.</span></section>

      <section className="grid"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">Working registry</p><h2>Review queue</h2></div><span className="countBadge">{visibleRecords.length} visible</span></div><div className="tableWrap"><table><thead><tr><th>Name</th><th>State</th><th>Status</th><th>Lifecycle</th><th>Confidence</th><th>Quality</th><th>Gate</th></tr></thead><tbody>{visibleRecords.map((record) => { const blockers = canonicalBlockers(record); const quality = qualityById.get(record.id); return <tr key={record.id} onClick={() => setSelectedId(record.id)} className={record.id === selected.id ? "selected" : ""}><td><strong>{record.name}</strong><small>{record.operator}</small></td><td>{record.state}</td><td>{record.status}</td><td>{record.lifecycle}</td><td>{record.confidenceScore}%</td><td>{quality?.score || 0}</td><td><span className={blockers.length ? "chip warn" : "chip ok"}>{blockers.length ? "review" : "canonical"}</span></td></tr>; })}</tbody></table></div></div>

      <aside className="panel drawer"><p className="eyebrow">Selected record</p><h2>{selected.name}</h2><p className="muted">{selected.city ? `${selected.city}, ` : ""}{selected.county}, {selected.state} • {selected.precision}</p><div className="miniGrid"><Stat label="MW" value={selected.capacityMW || "unknown"} /><Stat label="Receipts" value={selected.receipts.length} /><Stat label="Quality" value={qualityById.get(selected.id)?.score || 0} /></div><h3>Canonical decision</h3>{canonicalBlockers(selected).length ? <ul>{canonicalBlockers(selected).map((item) => <li key={item}>{item}</li>)}</ul> : <p className="okText">Record passes the current canonical gate.</p>}<button onClick={promoteSelected}>Promote selected locally</button>
        <section className="receiptEditor" aria-label="Receipt editor"><div className="panelHeader compactHeader"><div><p className="eyebrow">v1.3 Receipt Editor</p><h3>Add a public source receipt</h3></div><button onClick={exportSelectedReceiptPacket}>Export Selected Receipt Packet</button></div><div className="receiptGrid"><label>Source name<input value={receiptDraft.sourceName} onChange={(event) => updateReceiptDraft("sourceName", event.target.value)} placeholder="County permit portal, utility filing, operator release..." /></label><label>Source type<select value={receiptDraft.sourceType} onChange={(event) => updateReceiptDraft("sourceType", event.target.value as SourceType)}>{validSourceTypes.map((sourceType) => <option key={sourceType} value={sourceType}>{sourceType}</option>)}</select></label><label>Public URL<input value={receiptDraft.sourceUrl} onChange={(event) => updateReceiptDraft("sourceUrl", event.target.value)} placeholder="https://..." /></label><label>Retrieved date<input type="date" value={receiptDraft.retrievedAt} onChange={(event) => updateReceiptDraft("retrievedAt", event.target.value)} /></label><label>Confidence<select value={receiptDraft.confidence} onChange={(event) => updateReceiptDraft("confidence", event.target.value as Confidence)}><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></label></div><label>Claim supported by this source<textarea value={receiptDraft.claim} onChange={(event) => updateReceiptDraft("claim", event.target.value)} placeholder="Describe the exact claim this public source supports." /></label>{receiptDraftWarnings.length > 0 && <div className="globalWarnings receiptWarnings">{receiptDraftWarnings.map((warning) => <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>{warning.level}: {warning.message}</span>)}</div>}<div className="importActions"><button onClick={addReceiptToSelected} disabled={hasBlockingReceiptDraft}>Add Receipt to Selected</button><button onClick={clearReceiptDraft}>Clear Receipt Draft</button><button onClick={exportReceiptHistory} disabled={receiptHistory.length === 0}>Export Receipt History</button></div>{selectedReceiptHistory.length > 0 && <p className="muted">{selectedReceiptHistory.length} receipt edit(s) recorded for this selected record.</p>}</section>
        <h3>Source quality</h3><ul>{(qualityById.get(selected.id)?.gaps.length ? qualityById.get(selected.id)?.gaps : qualityById.get(selected.id)?.strengths || ["No source quality details."])?.map((item) => <li key={item}>{item}</li>)}</ul><h3>Receipts</h3>{selected.receipts.map((receipt, index) => <div key={receipt.receiptId || `${receipt.sourceName}-${index}`} className="receipt"><strong>{receipt.sourceName}</strong><span>{receipt.sourceType} • {receipt.confidence} • {new Date(receipt.retrievedAt).toLocaleDateString()}</span><p>{receipt.claim}</p>{receipt.sourceUrl && <a href={receipt.sourceUrl} target="_blank" rel="noreferrer">Open public source</a>}{receipt.batchId && <small>Batch: {receipt.batchId}</small>}{receipt.receiptId && <small>Receipt: {receipt.receiptId}</small>}</div>)}<h3>Reviewer notes</h3><div className="noteBox"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add local reviewer note..." /><button onClick={saveNote}>Save note</button></div>{selected.notes.length ? <ul>{selected.notes.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="muted">No notes yet.</p>}</aside></section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }
function downloadJson(filename: string, payload: unknown) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
