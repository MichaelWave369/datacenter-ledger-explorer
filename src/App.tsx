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

type ReceiptDraft = {
  sourceName: string;
  sourceType: SourceType;
  sourceUrl: string;
  retrievedAt: string;
  claim: string;
  confidence: Confidence;
};

type ReceiptEditHistoryItem = {
  receiptId: string;
  recordId: string;
  recordName: string;
  addedAt: string;
  sourceName: string;
  sourceType: SourceType;
  confidence: Confidence;
  resolvedWarnings: string[];
  remainingWarnings: number;
  digest: string;
};

type SourceQualityReport = {
  recordId: string;
  score: number;
  band: QualityBand;
  receiptCount: number;
  sourceTypeCount: number;
  publicLinkCoverage: number;
  newestReceiptAgeDays: number | null;
  highImpactCoverage: "covered" | "needs_second_source" | "not_applicable";
  unresolvedWarnings: number;
  strengths: string[];
  gaps: string[];
  digest: string;
};

type RegionalSummary = {
  key: string;
  mode: RegionMode;
  label: string;
  state: string;
  county?: string;
  recordIds: string[];
  recordCount: number;
  canonicalCount: number;
  needsReviewCount: number;
  receiptCount: number;
  averageQuality: number;
  qualityBands: Record<QualityBand, number>;
  statusCounts: Record<Status, number>;
  precisionCounts: Record<Precision, number>;
  topGaps: { gap: string; count: number }[];
  safetyNote: string;
  digest: string;
};

type RegionalChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
};

type RegionalEvidencePacket = {
  schema: string;
  generatedAt: string;
  appVersion: string;
  safetyBoundary: string[];
  regionalSummary: RegionalSummary;
  records: {
    id: string;
    name: string;
    operator: string;
    status: Status;
    lifecycle: Lifecycle;
    state: string;
    county: string;
    city?: string;
    precision: Precision;
    capacityMW?: number;
    canonicalBlockers: string[];
    reviewWarnings: string[];
    sourceQuality: SourceQualityReport;
    receipts: Receipt[];
  }[];
  receiptCoverage: {
    totalReceipts: number;
    recordsWithReceipts: number;
    recordsWithPublicLinks: number;
    publicLinkCoverage: number;
  };
  reviewChecklist: RegionalChecklistItem[];
  humanReviewPrompts: string[];
  digest: string;
};

const APP_VERSION = "1.6.0";

const validStatuses: Status[] = ["operating", "planned", "under_construction", "approved", "unknown"];
const validSourceTypes: SourceType[] = ["public_dataset", "permit", "utility", "operator", "news", "review", "other"];
const validPrecisions: Precision[] = ["public_dataset", "city_level", "county_level", "state_level", "unknown"];
const qualityBands: QualityBand[] = ["strong", "moderate", "weak", "blocked"];

const publicBoundary = [
  "Public-data only",
  "No hidden network calls",
  "No private facility discovery",
  "No security-sensitive enrichment",
  "City/county precision unless exact location is already public"
];

const safeUseSteps = [
  { title: "Start with public sources", body: "Import only public datasets, permits, utility filings, operator announcements, or news records you can cite." },
  { title: "Preview before commit", body: "Use the import workbench to inspect normalized rows, warnings, source posture, and batch receipts before adding records." },
  { title: "Review by region, not coordinates", body: "Use state/county summaries and regional evidence packets instead of exact facility markers or targeting details." },
  { title: "Export evidence slowly", body: "Use the v1.6 regional packet to review blockers, receipt coverage, and human checklist items before public promotion." }
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

function digest(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function receiptAgeDays(receipt: Receipt) {
  const timestamp = new Date(receipt.retrievedAt).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.round((Date.now() - timestamp) / 86_400_000));
}

function sourceQuality(record: LedgerRecord): SourceQualityReport {
  const receiptCount = record.receipts.length;
  const linkedReceipts = record.receipts.filter((receipt) => Boolean(receipt.sourceUrl)).length;
  const sourceTypes = new Set(record.receipts.map((receipt) => receipt.sourceType));
  const nonReviewReceipts = record.receipts.filter((receipt) => receipt.sourceType !== "review" && receipt.sourceType !== "other").length;
  const ages = record.receipts.map(receiptAgeDays).filter((age): age is number => age !== null);
  const newestReceiptAgeDays = ages.length ? Math.min(...ages) : null;
  const publicLinkCoverage = receiptCount ? Math.round((linkedReceipts / receiptCount) * 100) : 0;
  const highImpactCoverage: SourceQualityReport["highImpactCoverage"] = record.capacityMW && record.capacityMW > 0
    ? receiptCount >= 2 && nonReviewReceipts >= 1 && linkedReceipts >= 1 ? "covered" : "needs_second_source"
    : "not_applicable";

  const receiptScore = Math.min(20, receiptCount * 10);
  const diversityScore = Math.min(20, sourceTypes.size * 7);
  const linkScore = Math.round(publicLinkCoverage * 0.2);
  const recencyScore = newestReceiptAgeDays === null ? 0 : newestReceiptAgeDays <= 180 ? 20 : newestReceiptAgeDays <= 365 ? 14 : newestReceiptAgeDays <= 730 ? 8 : 2;
  const highImpactScore = highImpactCoverage === "needs_second_source" ? 0 : 15;
  const confidenceScore = Math.round(record.confidenceScore * 0.15);
  const warningPenalty = Math.min(25, record.reviewWarnings.length * 5);
  const score = clampScore(receiptScore + diversityScore + linkScore + recencyScore + highImpactScore + confidenceScore - warningPenalty);
  const band: QualityBand = receiptCount === 0 || score < 40 ? "blocked" : score >= 80 ? "strong" : score >= 60 ? "moderate" : "weak";

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (receiptCount >= 2) strengths.push("multiple receipts"); else gaps.push("needs at least two receipts for stronger review");
  if (sourceTypes.size >= 2) strengths.push("source diversity"); else gaps.push("needs source-type diversity");
  if (publicLinkCoverage >= 80) strengths.push("strong public-link coverage"); else gaps.push("needs more public source links");
  if (newestReceiptAgeDays !== null && newestReceiptAgeDays <= 365) strengths.push("recent receipt trail"); else gaps.push("receipt trail may be stale or missing");
  if (highImpactCoverage === "covered") strengths.push("high-impact claim has corroboration");
  if (highImpactCoverage === "needs_second_source") gaps.push("MW/high-impact claim needs second independent public source");
  if (record.reviewWarnings.length === 0) strengths.push("no unresolved warnings"); else gaps.push(`${record.reviewWarnings.length} unresolved review warning(s)`);

  return { recordId: record.id, score, band, receiptCount, sourceTypeCount: sourceTypes.size, publicLinkCoverage, newestReceiptAgeDays, highImpactCoverage, unresolvedWarnings: record.reviewWarnings.length, strengths, gaps, digest: digest({ recordId: record.id, score, receiptCount, sourceTypes: Array.from(sourceTypes), publicLinkCoverage, newestReceiptAgeDays, highImpactCoverage, warnings: record.reviewWarnings }) };
}

function canonicalBlockers(record: LedgerRecord) {
  const blockers: string[] = [];
  const quality = sourceQuality(record);
  if (record.lifecycle !== "promoted_public") blockers.push("not promoted_public");
  if (record.receipts.length === 0) blockers.push("missing receipt");
  if (record.confidenceScore < 70) blockers.push("confidence below 70");
  if (quality.score < 65) blockers.push("source quality below 65");
  if (record.precision === "unknown") blockers.push("unknown location precision");
  if (record.reviewWarnings.length > 0) blockers.push("review warnings remain");
  return blockers;
}

function buildRegionalSummaries(records: LedgerRecord[], qualityById: Map<string, SourceQualityReport>, mode: RegionMode): RegionalSummary[] {
  const buckets = new Map<string, LedgerRecord[]>();
  for (const record of records) {
    const normalizedState = record.state || "UNKNOWN";
    const normalizedCounty = record.county || "Unknown county";
    const key = mode === "state" ? normalizedState : `${normalizedState}::${normalizedCounty}`;
    buckets.set(key, [...(buckets.get(key) || []), record]);
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    const first = bucket[0];
    const reports = bucket.map((record) => qualityById.get(record.id) || sourceQuality(record));
    const averageQuality = reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0;
    const qualityBandCounts = Object.fromEntries(qualityBands.map((band) => [band, reports.filter((report) => report.band === band).length])) as Record<QualityBand, number>;
    const statusCounts = Object.fromEntries(validStatuses.map((status) => [status, bucket.filter((record) => record.status === status).length])) as Record<Status, number>;
    const precisionCounts = Object.fromEntries(validPrecisions.map((precision) => [precision, bucket.filter((record) => record.precision === precision).length])) as Record<Precision, number>;
    const gapCounts = new Map<string, number>();
    for (const report of reports) for (const gap of report.gaps) gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1);
    const topGaps = Array.from(gapCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([gap, count]) => ({ gap, count }));
    const canonicalCount = bucket.filter((record) => canonicalBlockers(record).length === 0).length;
    const label = mode === "state" ? first.state : `${first.county}, ${first.state}`;

    return {
      key,
      mode,
      label,
      state: first.state,
      county: mode === "county" ? first.county : undefined,
      recordIds: bucket.map((record) => record.id),
      recordCount: bucket.length,
      canonicalCount,
      needsReviewCount: bucket.length - canonicalCount,
      receiptCount: bucket.reduce((sum, record) => sum + record.receipts.length, 0),
      averageQuality,
      qualityBands: qualityBandCounts,
      statusCounts,
      precisionCounts,
      topGaps,
      safetyNote: "Map-safe regional summary only. No exact coordinates, facility layouts, private access details, or non-public enrichment are included.",
      digest: digest({ key, mode, recordIds: bucket.map((record) => record.id), averageQuality, qualityBandCounts, statusCounts, precisionCounts, topGaps })
    };
  }).sort((a, b) => b.recordCount - a.recordCount || a.label.localeCompare(b.label));
}

function regionChecklist(region: RegionalSummary, regionRecords: LedgerRecord[], qualityById: Map<string, SourceQualityReport>): RegionalChecklistItem[] {
  const reports = regionRecords.map((record) => qualityById.get(record.id) || sourceQuality(record));
  const recordsWithReceipts = regionRecords.filter((record) => record.receipts.length > 0).length;
  const recordsWithLinks = regionRecords.filter((record) => record.receipts.some((receipt) => Boolean(receipt.sourceUrl))).length;
  const highImpactRecords = regionRecords.filter((record) => record.capacityMW && record.capacityMW > 0);
  const highImpactCovered = highImpactRecords.filter((record) => (qualityById.get(record.id) || sourceQuality(record)).highImpactCoverage !== "needs_second_source").length;
  const unknownPrecision = regionRecords.filter((record) => record.precision === "unknown").length;
  const exactCoordinateSafe = regionRecords.every((record) => record.precision !== "public_dataset" || record.receipts.length > 0);
  const unresolvedWarnings = regionRecords.reduce((sum, record) => sum + record.reviewWarnings.length, 0);
  const blockedQuality = reports.filter((report) => report.band === "blocked").length;

  return [
    { id: "map_safe_boundary", label: "Map-safe boundary", status: exactCoordinateSafe ? "pass" : "needs_human", detail: "Packet uses state/county grouping and omits exact markers, private access details, sensitive layouts, and non-public enrichment." },
    { id: "receipt_coverage", label: "Receipt coverage", status: recordsWithReceipts === region.recordCount ? "pass" : recordsWithReceipts > 0 ? "warning" : "fail", detail: `${recordsWithReceipts}/${region.recordCount} regional record(s) have at least one receipt.` },
    { id: "public_link_coverage", label: "Public-link coverage", status: recordsWithLinks === region.recordCount ? "pass" : recordsWithLinks > 0 ? "warning" : "fail", detail: `${recordsWithLinks}/${region.recordCount} regional record(s) include at least one public source URL.` },
    { id: "source_quality", label: "Average source quality", status: region.averageQuality >= 70 ? "pass" : region.averageQuality >= 50 ? "warning" : "fail", detail: `Regional average source quality is ${region.averageQuality}%.` },
    { id: "high_impact_claims", label: "High-impact claims", status: highImpactRecords.length === 0 ? "pass" : highImpactCovered === highImpactRecords.length ? "pass" : "needs_human", detail: highImpactRecords.length === 0 ? "No MW/high-impact claims detected in this regional packet." : `${highImpactCovered}/${highImpactRecords.length} MW/high-impact record(s) appear corroborated by the current quality gate.` },
    { id: "unresolved_warnings", label: "Unresolved warnings", status: unresolvedWarnings === 0 ? "pass" : unresolvedWarnings <= region.recordCount ? "warning" : "fail", detail: `${unresolvedWarnings} unresolved review warning(s) remain across this region.` },
    { id: "location_precision", label: "Location precision", status: unknownPrecision === 0 ? "pass" : "warning", detail: `${unknownPrecision} record(s) have unknown location precision.` },
    { id: "blocked_records", label: "Blocked quality records", status: blockedQuality === 0 ? "pass" : "warning", detail: `${blockedQuality} record(s) are currently in the blocked source-quality band.` }
  ];
}

function buildRegionalEvidencePacket(region: RegionalSummary, records: LedgerRecord[], qualityById: Map<string, SourceQualityReport>): RegionalEvidencePacket {
  const generatedAt = nowIso();
  const regionRecords = records.filter((record) => region.recordIds.includes(record.id));
  const totalReceipts = regionRecords.reduce((sum, record) => sum + record.receipts.length, 0);
  const recordsWithReceipts = regionRecords.filter((record) => record.receipts.length > 0).length;
  const recordsWithPublicLinks = regionRecords.filter((record) => record.receipts.some((receipt) => Boolean(receipt.sourceUrl))).length;
  const publicLinkCoverage = regionRecords.length ? Math.round((recordsWithPublicLinks / regionRecords.length) * 100) : 0;
  const reviewChecklist = regionChecklist(region, regionRecords, qualityById);
  const humanReviewPrompts = [
    `Verify that all sources in ${region.label} are public and appropriate to cite.`,
    "Confirm that high-impact claims such as MW capacity, jobs, water, or construction status have independent corroboration.",
    "Resolve any remaining review warnings before treating this region as public/canonical.",
    "Keep regional outputs at state/county precision unless exact location has already been published by the source dataset."
  ];
  const packetRecords = regionRecords.map((record) => ({
    id: record.id,
    name: record.name,
    operator: record.operator,
    status: record.status,
    lifecycle: record.lifecycle,
    state: record.state,
    county: record.county,
    city: record.city,
    precision: record.precision,
    capacityMW: record.capacityMW,
    canonicalBlockers: canonicalBlockers(record),
    reviewWarnings: record.reviewWarnings,
    sourceQuality: qualityById.get(record.id) || sourceQuality(record),
    receipts: record.receipts
  }));

  const digestPayload = { region, packetRecords, reviewChecklist, receiptCoverage: { totalReceipts, recordsWithReceipts, recordsWithPublicLinks, publicLinkCoverage } };
  return {
    schema: "DataCenterLedger.RegionalEvidencePacket.v1.6",
    generatedAt,
    appVersion: APP_VERSION,
    safetyBoundary: publicBoundary,
    regionalSummary: region,
    records: packetRecords,
    receiptCoverage: { totalReceipts, recordsWithReceipts, recordsWithPublicLinks, publicLinkCoverage },
    reviewChecklist,
    humanReviewPrompts,
    digest: digest(digestPayload)
  };
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && inQuotes && next === "\"") { current += "\""; index += 1; }
    else if (char === "\"") inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
    else current += char;
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
  for (const column of ["name", "state", "source"]) if (!headers.includes(column) && !(column === "state" && headers.includes("state_abb"))) pushWarning(globalWarnings, 1, "warning", `Recommended column "${column}" is missing.`, column);

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

function makeEmptyReceiptDraft(): ReceiptDraft {
  return { sourceName: "", sourceType: "public_dataset", sourceUrl: "", retrievedAt: todayInputDate(), claim: "", confidence: "medium" };
}

function isHttpUrl(value: string) {
  if (!value.trim()) return false;
  try { const url = new URL(value.trim()); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
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
  const receiptId = digest({ recordId: record.id, draft, addedAt });
  return { receiptId, sourceName: draft.sourceName.trim(), sourceType: draft.sourceType, sourceUrl: sourceUrl || undefined, retrievedAt: retrievedDate.toString() === "Invalid Date" ? addedAt : retrievedDate.toISOString(), claim: draft.claim.trim(), confidence: draft.confidence };
}

function resolveWarningsAfterReceipt(record: LedgerRecord, receipt: Receipt) {
  const nextReceiptCount = record.receipts.length + 1;
  const hasPublicLink = Boolean(receipt.sourceUrl);
  const resolved: string[] = [];
  const remaining = record.reviewWarnings.filter((warning) => {
    const lower = warning.toLowerCase();
    let shouldResolve = false;
    if (lower.includes("missing source") && receipt.sourceName) shouldResolve = true;
    if ((lower.includes("source_url") || lower.includes("source url") || lower.includes("public link")) && hasPublicLink) shouldResolve = true;
    if ((lower.includes("second public source") || lower.includes("second independent source") || lower.includes("needs a second public source")) && nextReceiptCount >= 2 && hasPublicLink) shouldResolve = true;
    if (lower.includes("needs permit source") && receipt.sourceType === "permit") shouldResolve = true;
    if (lower.includes("needs utility source") && receipt.sourceType === "utility") shouldResolve = true;
    if (lower.includes("operator confirmation") && receipt.sourceType === "operator") shouldResolve = true;
    if (lower.includes("imported row needs human review") && receipt.claim.length > 20) shouldResolve = true;
    if (shouldResolve) resolved.push(warning);
    return !shouldResolve;
  });
  const additions: string[] = [];
  if (!hasPublicLink) additions.push("Newest receipt has no source URL; attach a public link before promotion.");
  if (receipt.sourceType === "other") additions.push("Newest receipt source type is other; classify it before promotion if possible.");
  return { remaining: Array.from(new Set([...remaining, ...additions])), resolved };
}

function bandChipClass(band: QualityBand) {
  if (band === "strong") return "chip ok";
  if (band === "moderate") return "chip info";
  if (band === "weak") return "chip warn";
  return "chip danger";
}

function checklistChipClass(status: ChecklistStatus) {
  if (status === "pass") return "chip ok";
  if (status === "warning" || status === "needs_human") return "chip warn";
  return "chip danger";
}

export default function App() {
  const [records, setRecords] = useState<LedgerRecord[]>(starterRecords);
  const [selectedId, setSelectedId] = useState(starterRecords[0].id);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [mode, setMode] = useState<"all" | "canonical" | "review">("all");
  const [regionMode, setRegionMode] = useState<RegionMode>("state");
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>("");
  const [note, setNote] = useState("");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft>(() => makeEmptyReceiptDraft());
  const [receiptHistory, setReceiptHistory] = useState<ReceiptEditHistoryItem[]>([]);

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const qualityReports = useMemo(() => records.map(sourceQuality), [records]);
  const qualityById = useMemo(() => new Map(qualityReports.map((report) => [report.recordId, report])), [qualityReports]);
  const selectedQuality = qualityById.get(selected.id) || sourceQuality(selected);
  const averageQuality = records.length ? Math.round(qualityReports.reduce((sum, report) => sum + report.score, 0) / records.length) : 0;
  const canonicalRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length === 0), [records]);
  const reviewRecords = useMemo(() => records.filter((record) => canonicalBlockers(record).length > 0), [records]);
  const demoRecords = useMemo(() => records.filter((record) => record.id.startsWith("dcl-demo-")), [records]);
  const regionalSummaries = useMemo(() => buildRegionalSummaries(records, qualityById, regionMode), [records, qualityById, regionMode]);
  const selectedRegion = regionalSummaries.find((region) => region.key === selectedRegionKey) || regionalSummaries[0];
  const selectedRegionalEvidence = useMemo(() => selectedRegion ? buildRegionalEvidencePacket(selectedRegion, records, qualityById) : null, [selectedRegion, records, qualityById]);
  const importWarnings = allPreviewWarnings(importPreview);
  const hasBlockingImport = importWarnings.some((warning) => warning.level === "blocking");
  const receiptDraftWarnings = useMemo(() => validateReceiptDraft(receiptDraft), [receiptDraft]);
  const hasBlockingReceiptDraft = receiptDraftWarnings.some((warning) => warning.level === "blocking");
  const selectedReceiptHistory = receiptHistory.filter((item) => item.recordId === selected.id);

  const qualityCounts = useMemo(() => ({
    strong: qualityReports.filter((report) => report.band === "strong").length,
    moderate: qualityReports.filter((report) => report.band === "moderate").length,
    weak: qualityReports.filter((report) => report.band === "weak").length,
    blocked: qualityReports.filter((report) => report.band === "blocked").length
  }), [qualityReports]);

  const visibleRecords = useMemo(() => records.filter((record) => {
    const haystack = `${record.name} ${record.operator} ${record.county} ${record.city || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || record.state === stateFilter;
    const blockers = canonicalBlockers(record);
    const matchesMode = mode === "all" || (mode === "canonical" ? blockers.length === 0 : blockers.length > 0);
    return matchesQuery && matchesState && matchesMode;
  }), [records, query, stateFilter, mode]);

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
  function resetDemoData() { setRecords(starterRecords); setSelectedId(starterRecords[0].id); setQuery(""); setStateFilter("all"); setMode("all"); setRegionMode("state"); setSelectedRegionKey(""); setImportPreview(null); setImportText(""); setImportHistory([]); setReceiptHistory([]); clearReceiptDraft(); }

  function selectRegion(region: RegionalSummary) {
    setSelectedRegionKey(region.key);
    setStateFilter(region.state);
    if (region.county) setQuery(region.county);
  }

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", { schema: "DataCenterLedger.Export.v1.6-regional-evidence-packet", generatedAt: nowIso(), appVersion: APP_VERSION, boundary: publicBoundary, importHistory, receiptHistory, sourceQuality: qualityReports, regionalSummaries, selectedRegionalEvidence, records, digest: digest({ records, importHistory, receiptHistory, qualityReports, regionalSummaries, selectedRegionalEvidence }) });
  }
  function exportCanonical() {
    const included = canonicalRecords.map((record) => ({ ...record, sourceQuality: qualityById.get(record.id) }));
    const excluded = records.filter((record) => canonicalBlockers(record).length > 0).map((record) => ({ id: record.id, name: record.name, sourceQuality: qualityById.get(record.id), blockers: canonicalBlockers(record) }));
    downloadJson("datacenter-ledger-canonical.json", { schema: "DataCenterLedger.CanonicalRegistry.v1.6-regional-evidence-packet", generatedAt: nowIso(), appVersion: APP_VERSION, included, excluded, regionalSummaries, digest: digest({ included, excluded, regionalSummaries }) });
  }
  function exportLaunchPacket() {
    downloadJson("datacenter-ledger-public-launch-packet.json", { schema: "DataCenterLedger.PublicLaunchPacket.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, purpose: "Public-safe civic transparency workbench for reviewing U.S. data center records as source-backed claims.", boundary: publicBoundary, safeUseSteps, stats: { records: records.length, regions: regionalSummaries.length, demoRecords: demoRecords.length, canonicalRecords: canonicalRecords.length, needsReview: reviewRecords.length, receipts: records.reduce((sum, record) => sum + record.receipts.length, 0), receiptEdits: receiptHistory.length, importBatches: importHistory.length, averageSourceQuality: averageQuality }, digest: digest({ records, importHistory, receiptHistory, qualityReports, regionalSummaries, selectedRegionalEvidence, publicBoundary, safeUseSteps }) });
  }
  function exportImportPreview() { if (!importPreview) return; downloadJson("datacenter-ledger-import-preview.json", { schema: "DataCenterLedger.ImportPreview.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, preview: importPreview, warningSummary: { total: warningCount(importPreview), blocking: warningCount(importPreview, "blocking"), warning: warningCount(importPreview, "warning"), info: warningCount(importPreview, "info") } }); }
  function exportImportHistory() { downloadJson("datacenter-ledger-import-history.json", { schema: "DataCenterLedger.ImportHistory.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, importHistory, digest: digest(importHistory) }); }
  function exportSelectedReceiptPacket() { downloadJson("datacenter-ledger-selected-receipts.json", { schema: "DataCenterLedger.SelectedReceiptPacket.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, selectedRecord: selected, sourceQuality: selectedQuality, regionalContext: regionalSummaries.filter((region) => region.recordIds.includes(selected.id)), canonicalBlockers: canonicalBlockers(selected), receiptHistory: selectedReceiptHistory, digest: digest({ selected, selectedQuality, selectedReceiptHistory }) }); }
  function exportReceiptHistory() { downloadJson("datacenter-ledger-receipt-history.json", { schema: "DataCenterLedger.ReceiptEditHistory.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, receiptHistory, digest: digest(receiptHistory) }); }
  function exportSourceQuality() { downloadJson("datacenter-ledger-source-quality.json", { schema: "DataCenterLedger.SourceQualityScoreboard.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, summary: { averageQuality, ...qualityCounts }, reports: qualityReports, digest: digest({ qualityReports, averageQuality, qualityCounts }) }); }
  function exportRegionalSummary() { downloadJson("datacenter-ledger-regional-summary.json", { schema: "DataCenterLedger.MapSafeRegionalSummary.v1.6", generatedAt: nowIso(), appVersion: APP_VERSION, mode: regionMode, safetyBoundary: publicBoundary, selectedRegion, regions: regionalSummaries, digest: digest({ regionMode, selectedRegion, regionalSummaries }) }); }
  function exportRegionalEvidencePacket() { if (!selectedRegionalEvidence) return; downloadJson("datacenter-ledger-regional-evidence-packet.json", selectedRegionalEvidence); }

  return (
    <main className="shell">
      <header className="hero launchHero">
        <div>
          <p className="eyebrow">v{APP_VERSION} regional evidence packet • local-first • receipt-backed</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>A civic transparency workbench for reviewing public data center records as claims — with receipts, confidence scores, source-quality scoring, regional evidence packets, import review gates, lifecycle decisions, canonical exports, and a clear safety boundary.</p>
          <div className="boundaryPills" aria-label="Public safety boundary">{publicBoundary.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="heroActions"><button onClick={exportLedger}>Export Ledger JSON</button><button onClick={exportCanonical}>Export Canonical JSON</button><button onClick={exportLaunchPacket}>Export Launch Packet</button></div>
      </header>

      <section className="launchGrid" aria-label="Launch overview">
        <div className="panel introPanel"><p className="eyebrow">What this is</p><h2>Public records in, reviewed Ledger out.</h2><p>Paste or load a CSV, inspect warnings, preserve source receipts, score source quality, summarize by state/county, and export regional evidence packets for human review.</p></div>
        <div className="panel introPanel cautionPanel"><p className="eyebrow">What this is not</p><h2>Not a targeting map.</h2><p>The regional view and evidence packet intentionally use state/county summaries. They should not include private access details, sensitive layouts, unreviewed exact coordinates, or non-public enrichment.</p></div>
      </section>

      <section className="cards"><Stat label="Records" value={records.length} /><Stat label="Regions" value={regionalSummaries.length} /><Stat label="Canonical" value={canonicalRecords.length} /><Stat label="Receipts" value={records.reduce((sum, record) => sum + record.receipts.length, 0)} /><Stat label="Avg quality" value={`${averageQuality}%`} /><Stat label="Needs review" value={reviewRecords.length} /><Stat label="Import batches" value={importHistory.length} /></section>
      <section className="panel walkthrough"><div><p className="eyebrow">How to use this safely</p><h2>Four-step public review flow</h2></div><div className="stepGrid">{safeUseSteps.map((step, index) => <article key={step.title} className="stepCard"><span>{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>

      <section className="panel regionalView">
        <div className="panelHeader"><div><p className="eyebrow">v1.6 Regional Evidence Packet</p><h2>Export review packets for a selected state or county</h2><p className="muted">Build a human-review bundle with regional summary, records, blockers, quality gaps, receipt coverage, and checklist status — without exact markers.</p></div><div className="heroActions"><select value={regionMode} onChange={(event) => { setRegionMode(event.target.value as RegionMode); setSelectedRegionKey(""); }}><option value="state">State summary</option><option value="county">County summary</option></select><button onClick={exportRegionalSummary}>Export Regional Summary</button><button onClick={exportRegionalEvidencePacket} disabled={!selectedRegionalEvidence}>Export Regional Evidence Packet</button></div></div>
        <div className="regionalSafety"><strong>Map-safe boundary:</strong><span>No exact markers, no facility layouts, no private access details, no non-public enrichment. Evidence packets are grouped only by public state/county fields.</span></div>
        <div className="regionalGrid">
          <div className="regionalTable tableWrap"><table><thead><tr><th>Region</th><th>Records</th><th>Canonical</th><th>Needs review</th><th>Avg quality</th><th>Top gap</th></tr></thead><tbody>{regionalSummaries.map((region) => <tr key={region.key} onClick={() => selectRegion(region)} className={region.key === selectedRegion?.key ? "selected" : ""}><td><strong>{region.label}</strong><small>{region.digest}</small></td><td>{region.recordCount}</td><td>{region.canonicalCount}</td><td>{region.needsReviewCount}</td><td><span className={bandChipClass(region.averageQuality >= 80 ? "strong" : region.averageQuality >= 60 ? "moderate" : region.averageQuality >= 40 ? "weak" : "blocked")}>{region.averageQuality}%</span></td><td>{region.topGaps[0] ? `${region.topGaps[0].gap} (${region.topGaps[0].count})` : "no major gaps"}</td></tr>)}</tbody></table></div>
          {selectedRegion && selectedRegionalEvidence && <aside className="regionCard evidenceCard"><p className="eyebrow">Selected regional packet</p><h3>{selectedRegion.label}</h3><div className="miniGrid"><Stat label="Records" value={selectedRegion.recordCount} /><Stat label="Canonical" value={selectedRegion.canonicalCount} /><Stat label="Quality" value={`${selectedRegion.averageQuality}%`} /></div><div className="evidenceDigest"><strong>Packet digest</strong><span>{selectedRegionalEvidence.digest}</span></div><h4>Receipt coverage</h4><div className="bandRow"><span className="chip info">receipts: {selectedRegionalEvidence.receiptCoverage.totalReceipts}</span><span className="chip info">records with receipts: {selectedRegionalEvidence.receiptCoverage.recordsWithReceipts}</span><span className="chip info">public-link coverage: {selectedRegionalEvidence.receiptCoverage.publicLinkCoverage}%</span></div><h4>Review checklist</h4><div className="checklistGrid">{selectedRegionalEvidence.reviewChecklist.map((item) => <div key={item.id} className="checklistItem"><span className={checklistChipClass(item.status)}>{item.status}</span><strong>{item.label}</strong><small>{item.detail}</small></div>)}</div><h4>Top review gaps</h4>{selectedRegion.topGaps.length ? <ul>{selectedRegion.topGaps.map((gap) => <li key={gap.gap}>{gap.gap} — {gap.count}</li>)}</ul> : <p className="okText">No major regional gaps detected.</p>}<h4>Human prompts</h4><ul>{selectedRegionalEvidence.humanReviewPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul><p className="muted">{selectedRegion.safetyNote}</p></aside>}
        </div>
      </section>

      <section className="panel qualityScoreboard"><div className="panelHeader"><div><p className="eyebrow">v1.4 Source Quality Scoreboard</p><h2>Score records before they become canonical</h2><p className="muted">Quality is calculated from receipt count, source diversity, public-link coverage, recency, high-impact claim corroboration, confidence, and unresolved warnings.</p></div><button onClick={exportSourceQuality}>Export Source Quality</button></div><div className="qualitySummary"><Stat label="Strong" value={qualityCounts.strong} /><Stat label="Moderate" value={qualityCounts.moderate} /><Stat label="Weak" value={qualityCounts.weak} /><Stat label="Blocked" value={qualityCounts.blocked} /></div><div className="qualityBars">{qualityReports.map((report) => { const record = records.find((item) => item.id === report.recordId); return <button key={report.recordId} className="qualityBar" onClick={() => setSelectedId(report.recordId)}><span><strong>{record?.name || report.recordId}</strong><small>{report.receiptCount} receipts • {report.sourceTypeCount} source type(s) • {report.publicLinkCoverage}% linked</small></span><b>{report.score}%</b><i className={bandChipClass(report.band)}>{report.band}</i></button>; })}</div></section>

      <section className="panel importWorkbench" aria-label="Import review workbench"><div className="panelHeader"><div><p className="eyebrow">v1.2 Import Review Workbench</p><h2>Preview CSV rows before they enter the Ledger</h2><p className="muted">Paste normalized CSV or load a file. The app creates a batch preview, source receipts, validation warnings, and a deterministic preview digest before anything is committed.</p></div><div className="heroActions"><button onClick={loadSampleImport}>Load Sample CSV</button><label className="fileButton">Load CSV file<input type="file" accept=".csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadCsvFile(file); event.currentTarget.value = ""; }} /></label></div></div><textarea className="csvTextArea" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste normalized CSV here. Required posture: public source, state, reviewable claim, and receipt context." /><div className="importActions"><button onClick={() => previewImportFromText()} disabled={!importText.trim()}>Preview CSV</button><button onClick={exportImportPreview} disabled={!importPreview}>Export Preview Packet</button><button onClick={commitImportPreview} disabled={!importPreview || hasBlockingImport}>Commit Preview to Ledger</button><button onClick={exportImportHistory} disabled={importHistory.length === 0}>Export Import History</button><button onClick={clearImportWorkbench}>Clear Import Workbench</button></div>{importPreview ? <div className="previewPanel"><div className="previewSummary"><Stat label="Preview rows" value={importPreview.rows.length} /><Stat label="Blocking" value={warningCount(importPreview, "blocking")} /><Stat label="Warnings" value={warningCount(importPreview, "warning")} /><Stat label="Info" value={warningCount(importPreview, "info")} /></div><div className="batchMeta"><span><strong>Batch:</strong> {importPreview.batchId}</span><span><strong>Origin:</strong> {importPreview.origin}</span><span><strong>Digest:</strong> {importPreview.digest}</span></div>{hasBlockingImport && <p className="dangerText">Blocking issues must be fixed before this batch can be committed.</p>}<div className="tableWrap previewTable"><table><thead><tr><th>Row</th><th>Name</th><th>State</th><th>Source</th><th>Warnings</th></tr></thead><tbody>{importPreview.rows.map((row) => <tr key={`${importPreview.batchId}-${row.rowNumber}`}><td>{row.rowNumber}</td><td><strong>{row.record.name}</strong><small>{row.record.operator}</small></td><td>{row.record.state}</td><td>{row.record.receipts[0]?.sourceName || "Missing source"}</td><td>{row.warnings.length ? row.warnings.map((warning) => <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>{warning.level}: {warning.message}</span>) : <span className="chip ok">ready for review</span>}</td></tr>)}</tbody></table></div></div> : <p className="muted">No active preview yet. Load the sample CSV or paste public-source rows to begin.</p>}</section>

      <section className="toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, operators, counties..." /><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">All states</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select><select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="all">All records</option><option value="canonical">Canonical only</option><option value="review">Needs review</option></select><button onClick={resetDemoData}>Reset Demo</button></section>
      <section className="sampleNotice panel"><strong>Sample data loaded:</strong><span>{demoRecords.length} demo rows are visible so the live site is understandable immediately. Replace them with public-source imports before using the Ledger for real review work.</span></section>

      <section className="grid"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">Working registry</p><h2>Review queue</h2></div><span className="countBadge">{visibleRecords.length} visible</span></div><div className="tableWrap"><table><thead><tr><th>Name</th><th>State</th><th>Status</th><th>Lifecycle</th><th>Quality</th><th>Receipts</th><th>Gate</th></tr></thead><tbody>{visibleRecords.map((record) => { const blockers = canonicalBlockers(record); const quality = qualityById.get(record.id) || sourceQuality(record); return <tr key={record.id} onClick={() => setSelectedId(record.id)} className={record.id === selected.id ? "selected" : ""}><td><strong>{record.name}</strong><small>{record.operator}</small></td><td>{record.state}</td><td>{record.status}</td><td>{record.lifecycle}</td><td><span className={bandChipClass(quality.band)}>{quality.score}% {quality.band}</span></td><td>{record.receipts.length}</td><td><span className={blockers.length ? "chip warn" : "chip ok"}>{blockers.length ? "review" : "canonical"}</span></td></tr>; })}</tbody></table></div></div>

        <aside className="panel drawer"><p className="eyebrow">Selected record</p><h2>{selected.name}</h2><p className="muted">{selected.city ? `${selected.city}, ` : ""}{selected.county}, {selected.state} • {selected.precision}</p><div className="miniGrid"><Stat label="MW" value={selected.capacityMW || "unknown"} /><Stat label="Receipts" value={selected.receipts.length} /><Stat label="Quality" value={`${selectedQuality.score}%`} /></div><section className="sourceQualityCard"><div className="panelHeader compactHeader"><div><p className="eyebrow">Source quality</p><h3>{selectedQuality.score}% <span className={bandChipClass(selectedQuality.band)}>{selectedQuality.band}</span></h3></div><small>{selectedQuality.digest}</small></div><div className="qualityDetails"><span>{selectedQuality.receiptCount} receipt(s)</span><span>{selectedQuality.sourceTypeCount} source type(s)</span><span>{selectedQuality.publicLinkCoverage}% public-link coverage</span><span>Newest receipt: {selectedQuality.newestReceiptAgeDays === null ? "unknown" : `${selectedQuality.newestReceiptAgeDays} day(s)`}</span><span>High-impact: {selectedQuality.highImpactCoverage}</span></div>{selectedQuality.gaps.length > 0 && <><h4>Quality gaps</h4><ul>{selectedQuality.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></>}{selectedQuality.strengths.length > 0 && <><h4>Strengths</h4><ul>{selectedQuality.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul></>}</section><h3>Canonical decision</h3>{canonicalBlockers(selected).length ? <ul>{canonicalBlockers(selected).map((item) => <li key={item}>{item}</li>)}</ul> : <p className="okText">Record passes the current canonical gate.</p>}<button onClick={promoteSelected}>Promote selected locally</button><section className="receiptEditor" aria-label="Receipt editor"><div className="panelHeader compactHeader"><div><p className="eyebrow">v1.3 Receipt Editor</p><h3>Add a public source receipt</h3></div><button onClick={exportSelectedReceiptPacket}>Export Selected Receipt Packet</button></div><div className="receiptGrid"><label>Source name<input value={receiptDraft.sourceName} onChange={(event) => updateReceiptDraft("sourceName", event.target.value)} placeholder="County permit portal, utility filing, operator release..." /></label><label>Source type<select value={receiptDraft.sourceType} onChange={(event) => updateReceiptDraft("sourceType", event.target.value as SourceType)}>{validSourceTypes.map((sourceType) => <option key={sourceType} value={sourceType}>{sourceType}</option>)}</select></label><label>Public URL<input value={receiptDraft.sourceUrl} onChange={(event) => updateReceiptDraft("sourceUrl", event.target.value)} placeholder="https://..." /></label><label>Retrieved date<input type="date" value={receiptDraft.retrievedAt} onChange={(event) => updateReceiptDraft("retrievedAt", event.target.value)} /></label><label>Confidence<select value={receiptDraft.confidence} onChange={(event) => updateReceiptDraft("confidence", event.target.value as Confidence)}><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></label></div><label>Claim supported by this source<textarea value={receiptDraft.claim} onChange={(event) => updateReceiptDraft("claim", event.target.value)} placeholder="Describe the exact claim this public source supports." /></label>{receiptDraftWarnings.length > 0 && <div className="globalWarnings receiptWarnings">{receiptDraftWarnings.map((warning) => <span key={`${warning.field}-${warning.message}`} className={`chip ${warning.level === "blocking" ? "danger" : warning.level === "info" ? "info" : "warn"}`}>{warning.level}: {warning.message}</span>)}</div>}<div className="importActions"><button onClick={addReceiptToSelected} disabled={hasBlockingReceiptDraft}>Add Receipt to Selected</button><button onClick={clearReceiptDraft}>Clear Receipt Draft</button><button onClick={exportReceiptHistory} disabled={receiptHistory.length === 0}>Export Receipt History</button></div>{selectedReceiptHistory.length > 0 && <p className="muted">{selectedReceiptHistory.length} receipt edit(s) recorded for this selected record.</p>}</section><h3>Receipts</h3>{selected.receipts.map((receipt, index) => <div key={receipt.receiptId || `${receipt.sourceName}-${index}`} className="receipt"><strong>{receipt.sourceName}</strong><span>{receipt.sourceType} • {receipt.confidence} • {new Date(receipt.retrievedAt).toLocaleDateString()}</span><p>{receipt.claim}</p>{receipt.sourceUrl && <a href={receipt.sourceUrl} target="_blank" rel="noreferrer">Open public source</a>}{receipt.batchId && <small>Batch: {receipt.batchId}</small>}{receipt.receiptId && <small>Receipt: {receipt.receiptId}</small>}</div>)}<h3>Reviewer notes</h3><div className="noteBox"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add local reviewer note..." /><button onClick={saveNote}>Save note</button></div>{selected.notes.length ? <ul>{selected.notes.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="muted">No notes yet.</p>}</aside>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
