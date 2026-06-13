import { useMemo, useState } from "react";

type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "reviewed" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";
type SourceType = "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";
type WarningLevel = "info" | "warning" | "blocking";
type QualityBand = "strong" | "moderate" | "weak" | "blocked";
type RegionMode = "state" | "county";
type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "dismissed";
type TaskCategory = "needs_second_source" | "needs_public_url" | "needs_permit_receipt" | "needs_utility_receipt" | "needs_operator_confirmation" | "needs_location_review" | "needs_confidence_review" | "needs_warning_resolution" | "needs_source_quality" | "ready_for_promotion" | "manual_follow_up";
type BriefScope = "record" | "region";
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
  id: string;
  mode: RegionMode;
  label: string;
  state: string;
  county?: string;
  records: number;
  canonical: number;
  needsReview: number;
  receipts: number;
  averageQuality: number;
  qualityBands: Record<QualityBand, number>;
  reviewGaps: string[];
  digest: string;
};

type ReviewTask = {
  id: string;
  recordId: string;
  regionId?: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  detail: string;
  createdAt: string;
  source: "generated" | "manual";
};

type CanonicalChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
};

type PromotionReceipt = {
  promotionId: string;
  recordId: string;
  recordName: string;
  promotedAt: string;
  reviewer: string;
  reason: string;
  checklist: CanonicalChecklistItem[];
  sourceQuality: SourceQualityReport;
  publicBriefReady: boolean;
  safetyAcknowledged: boolean;
  priorLifecycle: Lifecycle;
  digest: string;
};

type LocalReviewSession = {
  schema: string;
  generatedAt: string;
  appVersion: string;
  sessionName: string;
  records: LedgerRecord[];
  importHistory: ImportHistoryItem[];
  receiptHistory: ReceiptEditHistoryItem[];
  promotionHistory: PromotionReceipt[];
  taskStatusOverrides: Record<string, TaskStatus>;
  manualTasks: ReviewTask[];
  uiState: { selectedId: string; query: string; stateFilter: string; mode: "all" | "canonical" | "review"; regionMode: RegionMode; selectedRegionId: string; taskStatusFilter: "all" | TaskStatus; taskCategoryFilter: "all" | TaskCategory; briefScope: BriefScope };
  digest: string;
};

type PublicBrief = {
  schema: string;
  generatedAt: string;
  appVersion: string;
  scope: BriefScope;
  title: string;
  summary: string;
  reviewOnlyNotice: string;
  boundary: string[];
  keyClaims: string[];
  sourceReceipts: Array<{ sourceName: string; sourceType: SourceType; sourceUrl?: string; claim: string; confidence: Confidence; retrievedAt: string }>;
  unresolvedGaps: string[];
  quality: SourceQualityReport | { averageQuality: number; qualityBands: Record<QualityBand, number>; regionalRecords: number };
  relatedRecords: Array<{ id: string; name: string; state: string; county: string; canonicalBlockers: string[] }>;
  digest: string;
};

const APP_VERSION = "2.0.0";
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

const reviewOnlyNotice = "This brief is a public-data review aid. It is not proof of truth, not a complete national registry, not a targeting map, and not a substitute for human review of the cited sources.";

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
    reviewWarnings: ["Needs a second public source.", "Needs public URL."],
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

function daysOld(dateText: string) {
  const parsed = new Date(dateText);
  if (parsed.toString() === "Invalid Date") return null;
  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 86_400_000));
}

function confidenceLabel(score: number): Confidence {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function qualityBand(score: number): QualityBand {
  if (score >= 80) return "strong";
  if (score >= 65) return "moderate";
  if (score >= 45) return "weak";
  return "blocked";
}

function scoreRecord(record: LedgerRecord): SourceQualityReport {
  const receiptCount = record.receipts.length;
  const sourceTypeCount = new Set(record.receipts.map((receipt) => receipt.sourceType)).size;
  const publicLinks = record.receipts.filter((receipt) => Boolean(receipt.sourceUrl)).length;
  const publicLinkCoverage = receiptCount ? Math.round((publicLinks / receiptCount) * 100) : 0;
  const receiptAges = record.receipts.map((receipt) => daysOld(receipt.retrievedAt)).filter((age): age is number => age !== null);
  const newestReceiptDaysOld = receiptAges.length ? Math.min(...receiptAges) : null;
  const highImpactClaimCoverage = record.capacityMW && record.capacityMW > 0
    ? receiptCount >= 2 && publicLinks >= 1 ? "covered" : "needs_second_source"
    : "not_applicable";
  let score = 15;
  const strengths: string[] = [];
  const gaps: string[] = [];
  if (receiptCount >= 2) { score += 20; strengths.push("two or more receipts"); } else gaps.push("needs at least two receipts");
  if (sourceTypeCount >= 2) { score += 15; strengths.push("source diversity"); } else gaps.push("needs source diversity");
  if (publicLinkCoverage >= 80) { score += 15; strengths.push("strong public-link coverage"); } else gaps.push("needs stronger public-link coverage");
  if (newestReceiptDaysOld !== null && newestReceiptDaysOld <= 365) { score += 10; strengths.push("recent receipt present"); } else gaps.push("needs recent receipt review");
  if (highImpactClaimCoverage === "covered" || highImpactClaimCoverage === "not_applicable") score += 10; else gaps.push("high-impact MW claim needs second source");
  if (record.confidenceScore >= 70) { score += 10; strengths.push("confidence at or above 70"); } else gaps.push("confidence below 70");
  if (record.reviewWarnings.length === 0) { score += 10; strengths.push("no unresolved review warnings"); } else gaps.push(`${record.reviewWarnings.length} unresolved review warning(s)`);
  if (record.precision === "unknown") { score -= 15; gaps.push("unknown location precision"); }
  const finalScore = Math.max(0, Math.min(100, score));
  return { recordId: record.id, score: finalScore, band: qualityBand(finalScore), receiptCount, sourceTypeCount, publicLinkCoverage, newestReceiptDaysOld, highImpactClaimCoverage, strengths, gaps, digest: digest({ recordId: record.id, finalScore, receiptCount, sourceTypeCount, publicLinkCoverage, newestReceiptDaysOld, highImpactClaimCoverage, gaps }) };
}

function canonicalBlockers(record: LedgerRecord, report = scoreRecord(record)) {
  const blockers: string[] = [];
  if (record.lifecycle !== "promoted_public") blockers.push("not promoted_public");
  if (record.receipts.length === 0) blockers.push("missing receipt");
  if (record.confidenceScore < 70) blockers.push("confidence below 70");
  if (record.precision === "unknown") blockers.push("unknown location precision");
  if (record.reviewWarnings.length > 0) blockers.push("review warnings remain");
  if (report.score < 65) blockers.push("source quality below 65");
  return blockers;
}

function promotionChecklist(record: LedgerRecord, report: SourceQualityReport, publicBriefReady: boolean, safetyAcknowledged: boolean, reason: string): CanonicalChecklistItem[] {
  return [
    { id: "receipts", label: "Receipts attached", status: record.receipts.length > 0 ? "pass" : "fail", detail: `${record.receipts.length} receipt(s) attached.` },
    { id: "quality", label: "Source quality at or above 65", status: report.score >= 65 ? "pass" : "fail", detail: `Current source quality is ${report.score} (${report.band}).` },
    { id: "confidence", label: "Confidence at or above 70", status: record.confidenceScore >= 70 ? "pass" : "warning", detail: `Current confidence is ${record.confidenceScore}%.` },
    { id: "warnings", label: "No unresolved review warnings", status: record.reviewWarnings.length === 0 ? "pass" : "needs_human", detail: `${record.reviewWarnings.length} unresolved warning(s).` },
    { id: "precision", label: "Location precision is public-safe", status: record.precision !== "unknown" ? "pass" : "fail", detail: `Precision is ${record.precision}.` },
    { id: "highImpact", label: "High-impact MW claims are covered", status: report.highImpactClaimCoverage !== "needs_second_source" ? "pass" : "needs_human", detail: `High-impact claim coverage: ${report.highImpactClaimCoverage}.` },
    { id: "brief", label: "Public brief reviewed", status: publicBriefReady ? "pass" : "needs_human", detail: publicBriefReady ? "Reviewer acknowledged public-brief readiness." : "Generate/review a public brief before promotion." },
    { id: "safety", label: "Safety boundary acknowledged", status: safetyAcknowledged ? "pass" : "fail", detail: safetyAcknowledged ? "Reviewer acknowledged public-data boundary." : "Reviewer must acknowledge safety boundary." },
    { id: "reason", label: "Reviewer reason provided", status: reason.trim().length >= 12 ? "pass" : "needs_human", detail: reason.trim().length >= 12 ? "Promotion reason captured." : "Promotion reason is required." }
  ];
}

function checklistPasses(items: CanonicalChecklistItem[]) {
  return items.every((item) => item.status === "pass" || item.status === "warning");
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

function normalizeStatus(value: string): Status {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as Status;
  return validStatuses.includes(normalized) ? normalized : "unknown";
}

function normalizeSourceType(value: string): SourceType {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as SourceType;
  return validSourceTypes.includes(normalized) ? normalized : "other";
}

function normalizePrecision(row: Record<string, string>): Precision {
  const raw = readCell(row, "precision", "location_precision").toLowerCase().trim().replace(/\s+/g, "_") as Precision;
  if (raw && validPrecisions.includes(raw)) return raw;
  if (readCell(row, "city")) return "city_level";
  if (readCell(row, "county")) return "county_level";
  if (readCell(row, "state", "state_abb")) return "state_level";
  return "unknown";
}

function buildImportPreview(text: string, origin: string, existingRecords: LedgerRecord[]): ImportPreview {
  const createdAt = nowIso();
  const batchId = digest({ text, origin, createdAt });
  const { headers, rows } = parseCsvTable(text);
  const warnings: ImportWarning[] = [];
  const existingIds = new Set(existingRecords.map((record) => record.id));
  const previewIds = new Set<string>();
  if (headers.length === 0) pushWarning(warnings, 1, "blocking", "CSV text is empty or missing a header row.");
  if (headers.length > 0 && rows.length === 0) pushWarning(warnings, 1, "blocking", "CSV has a header row but no data rows.");
  const previewRows = rows.map(({ rowNumber, row }) => {
    const rowWarnings: ImportWarning[] = [];
    const name = readCell(row, "name") || "Unnamed public record";
    const state = readCell(row, "state", "state_abb") || "UNKNOWN";
    const id = readCell(row, "id") || digest({ row, rowNumber, batchId });
    const sourceUrl = readCell(row, "source_url", "url") || undefined;
    const confidenceScore = Math.max(0, Math.min(100, Number(readCell(row, "confidence", "confidence_score")) || 50));
    const capacityRaw = readCell(row, "capacity_mw", "power_mw", "mw");
    const capacityMW = capacityRaw ? Number(capacityRaw) : undefined;
    if (existingIds.has(id)) pushWarning(rowWarnings, rowNumber, "blocking", `Record id "${id}" already exists in the workspace.`, "id");
    if (previewIds.has(id)) pushWarning(rowWarnings, rowNumber, "blocking", `Record id "${id}" appears more than once in this import batch.`, "id");
    previewIds.add(id);
    if (!readCell(row, "state", "state_abb")) pushWarning(rowWarnings, rowNumber, "blocking", "Missing state/state_abb.", "state");
    if (!readCell(row, "source", "source_name")) pushWarning(rowWarnings, rowNumber, "warning", "Missing source name; receipt will need review.", "source");
    if (!sourceUrl) pushWarning(rowWarnings, rowNumber, "info", "No source_url supplied; reviewers should preserve a public link outside the app.", "source_url");
    if (capacityMW && capacityMW > 0) pushWarning(rowWarnings, rowNumber, "warning", "MW capacity is a high-impact claim and should have a second independent source before promotion.", "capacity_mw");
    const record: LedgerRecord = {
      id,
      name,
      operator: readCell(row, "operator", "owner") || "Unknown",
      status: normalizeStatus(readCell(row, "status")),
      state,
      county: readCell(row, "county") || "Unknown county",
      city: readCell(row, "city") || undefined,
      precision: normalizePrecision(row),
      capacityMW: capacityMW && !Number.isNaN(capacityMW) ? capacityMW : undefined,
      lifecycle: "raw_import",
      confidenceScore,
      reviewWarnings: ["Imported row needs human review before promotion.", ...rowWarnings.filter((warning) => warning.level !== "info").map((warning) => warning.message)],
      receipts: [{ sourceName: readCell(row, "source", "source_name") || "CSV import", sourceType: normalizeSourceType(readCell(row, "source_type")), sourceUrl, retrievedAt: new Date(readCell(row, "retrieved_at", "retrieved") || createdAt).toISOString(), claim: readCell(row, "source_claim", "claim") || `Imported row for ${name}.`, confidence: confidenceLabel(confidenceScore), batchId }],
      notes: [`Imported through batch ${batchId} from ${origin}.`],
      importBatchId: batchId
    };
    return { rowNumber, record, warnings: rowWarnings };
  });
  return { batchId, createdAt, origin, rows: previewRows, warnings, digest: digest({ batchId, previewRows, warnings }) };
}

function allPreviewWarnings(preview: ImportPreview | null) {
  return preview ? [...preview.warnings, ...preview.rows.flatMap((row) => row.warnings)] : [];
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
  if (!draft.retrievedAt.trim() || new Date(draft.retrievedAt).toString() === "Invalid Date") pushWarning(warnings, 0, "blocking", "Retrieved date must be a valid date.", "retrievedAt");
  if (!draft.sourceUrl.trim()) pushWarning(warnings, 0, "warning", "No source URL supplied; public links make review and promotion stronger.", "sourceUrl");
  if (draft.sourceUrl.trim() && !isHttpUrl(draft.sourceUrl)) pushWarning(warnings, 0, "blocking", "Source URL must start with http:// or https://.", "sourceUrl");
  return warnings;
}

function buildReceiptFromDraft(draft: ReceiptDraft, record: LedgerRecord, addedAt: string): Receipt {
  return { receiptId: digest({ recordId: record.id, draft, addedAt }), sourceName: draft.sourceName.trim(), sourceType: draft.sourceType, sourceUrl: draft.sourceUrl.trim() || undefined, retrievedAt: new Date(draft.retrievedAt).toISOString(), claim: draft.claim.trim(), confidence: draft.confidence };
}

function resolveWarningsAfterReceipt(record: LedgerRecord, receipt: Receipt) {
  const nextReceiptCount = record.receipts.length + 1;
  const hasPublicLink = Boolean(receipt.sourceUrl);
  const resolved: string[] = [];
  const remaining = record.reviewWarnings.filter((warning) => {
    const lower = warning.toLowerCase();
    const shouldResolve =
      (lower.includes("missing source") && receipt.sourceName) ||
      ((lower.includes("source_url") || lower.includes("source url") || lower.includes("public url") || lower.includes("public link")) && hasPublicLink) ||
      ((lower.includes("second public source") || lower.includes("second independent source")) && nextReceiptCount >= 2 && hasPublicLink) ||
      (lower.includes("needs permit source") && receipt.sourceType === "permit") ||
      (lower.includes("needs utility source") && receipt.sourceType === "utility") ||
      (lower.includes("operator confirmation") && receipt.sourceType === "operator") ||
      (lower.includes("imported row needs human review") && receipt.claim.length > 20);
    if (shouldResolve) resolved.push(warning);
    return !shouldResolve;
  });
  if (!hasPublicLink) remaining.push("Newest receipt has no source URL; attach a public link before promotion.");
  return { remaining: Array.from(new Set(remaining)), resolved };
}

function buildRegionalSummaries(records: LedgerRecord[], reports: SourceQualityReport[], mode: RegionMode): RegionalSummary[] {
  const reportMap = new Map(reports.map((report) => [report.recordId, report]));
  const buckets = new Map<string, LedgerRecord[]>();
  records.forEach((record) => {
    const id = mode === "state" ? record.state : `${record.state}::${record.county}`;
    buckets.set(id, [...(buckets.get(id) || []), record]);
  });
  return Array.from(buckets.entries()).map(([id, bucket]) => {
    const first = bucket[0];
    const bandCounts: Record<QualityBand, number> = { strong: 0, moderate: 0, weak: 0, blocked: 0 };
    const gaps = new Map<string, number>();
    let qualityTotal = 0;
    bucket.forEach((record) => {
      const report = reportMap.get(record.id) || scoreRecord(record);
      qualityTotal += report.score;
      bandCounts[report.band] += 1;
      [...record.reviewWarnings, ...report.gaps].forEach((gap) => gaps.set(gap, (gaps.get(gap) || 0) + 1));
    });
    const canonical = bucket.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length === 0).length;
    return { id, mode, label: mode === "state" ? first.state : `${first.county}, ${first.state}`, state: first.state, county: mode === "county" ? first.county : undefined, records: bucket.length, canonical, needsReview: bucket.length - canonical, receipts: bucket.reduce((sum, record) => sum + record.receipts.length, 0), averageQuality: Math.round(qualityTotal / Math.max(1, bucket.length)), qualityBands: bandCounts, reviewGaps: Array.from(gaps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([gap, count]) => `${gap} (${count})`), digest: digest({ id, bucketIds: bucket.map((record) => record.id), bandCounts, canonical }) };
  }).sort((a, b) => b.records - a.records || a.label.localeCompare(b.label));
}

function buildRegionalEvidencePacket(region: RegionalSummary, records: LedgerRecord[], reports: SourceQualityReport[]) {
  const regionalRecords = records.filter((record) => region.mode === "state" ? record.state === region.state : record.state === region.state && record.county === region.county);
  const reportMap = new Map(reports.map((report) => [report.recordId, report]));
  const recordEntries = regionalRecords.map((record) => ({ record, sourceQuality: reportMap.get(record.id) || scoreRecord(record), canonicalBlockers: canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)), reviewWarnings: record.reviewWarnings }));
  const linkedReceipts = regionalRecords.flatMap((record) => record.receipts).filter((receipt) => receipt.sourceUrl).length;
  const receipts = regionalRecords.reduce((sum, record) => sum + record.receipts.length, 0);
  const checklist = [
    { label: "Map-safe boundary", status: "pass" as const, detail: "Packet summarizes state/county-level records only." },
    { label: "Receipt coverage", status: receipts >= regionalRecords.length ? "pass" as const : "warning" as const, detail: `${receipts} receipt(s) across ${regionalRecords.length} record(s).` },
    { label: "Public links", status: linkedReceipts > 0 ? "pass" as const : "warning" as const, detail: `${linkedReceipts} receipt(s) include public links.` },
    { label: "Unresolved review", status: region.needsReview === 0 ? "pass" as const : "needs_human" as const, detail: `${region.needsReview} record(s) still need review.` }
  ];
  return { schema: "DataCenterLedger.RegionalEvidencePacket.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, region, records: recordEntries, checklist, reviewPrompts: ["Verify source links before public use.", "Do not add private facility details.", "Resolve high-impact MW claims with independent sources."], digest: digest({ region, recordEntries, checklist }) };
}

function generateReviewTasks(records: LedgerRecord[], reports: SourceQualityReport[], region: RegionalSummary | undefined, overrides: Record<string, TaskStatus>, manualTasks: ReviewTask[]): ReviewTask[] {
  const reportMap = new Map(reports.map((report) => [report.recordId, report]));
  const generated: ReviewTask[] = [];
  records.forEach((record) => {
    const report = reportMap.get(record.id) || scoreRecord(record);
    const blockers = canonicalBlockers(record, report);
    const base = { recordId: record.id, regionId: `${record.state}::${record.county}`, createdAt: "generated", source: "generated" as const };
    if (record.receipts.some((receipt) => !receipt.sourceUrl)) generated.push({ ...base, id: `task-public-url-${record.id}`, title: "Add public URL receipt", category: "needs_public_url", status: "open", priority: "medium", detail: `${record.name} has receipt(s) without public links.` });
    if (record.reviewWarnings.some((warning) => warning.toLowerCase().includes("permit"))) generated.push({ ...base, id: `task-permit-${record.id}`, title: "Find permit receipt", category: "needs_permit_receipt", status: "open", priority: "high", detail: `${record.name} needs a permit source.` });
    if (record.reviewWarnings.some((warning) => warning.toLowerCase().includes("utility"))) generated.push({ ...base, id: `task-utility-${record.id}`, title: "Find utility receipt", category: "needs_utility_receipt", status: "open", priority: "high", detail: `${record.name} needs a utility source.` });
    if (report.highImpactClaimCoverage === "needs_second_source") generated.push({ ...base, id: `task-second-source-${record.id}`, title: "Add second source for MW claim", category: "needs_second_source", status: "open", priority: "high", detail: `${record.name} has a high-impact MW claim needing corroboration.` });
    if (record.precision === "unknown") generated.push({ ...base, id: `task-location-${record.id}`, title: "Review location precision", category: "needs_location_review", status: "open", priority: "medium", detail: `${record.name} has unknown location precision.` });
    if (record.confidenceScore < 70) generated.push({ ...base, id: `task-confidence-${record.id}`, title: "Raise confidence or document uncertainty", category: "needs_confidence_review", status: "open", priority: "medium", detail: `${record.name} confidence is below 70.` });
    if (report.score < 65) generated.push({ ...base, id: `task-quality-${record.id}`, title: "Improve source quality", category: "needs_source_quality", status: "open", priority: "medium", detail: `${record.name} source quality is ${report.score}.` });
    if (blockers.length === 1 && blockers[0] === "not promoted_public") generated.push({ ...base, id: `task-promotion-${record.id}`, title: "Ready for canonical review", category: "ready_for_promotion", status: "open", priority: "low", detail: `${record.name} may be ready for Canonical Review Mode.` });
  });
  return [...generated, ...manualTasks]
    .map((task) => ({ ...task, status: overrides[task.id] || task.status }))
    .filter((task) => {
      if (!region) return true;
      const record = records.find((item) => item.id === task.recordId);
      if (!record) return false;
      return region.mode === "state" ? record.state === region.state : record.state === region.state && record.county === region.county;
    });
}

function buildRecordBrief(record: LedgerRecord, report: SourceQualityReport): PublicBrief {
  const blockers = canonicalBlockers(record, report);
  return { schema: "DataCenterLedger.PublicBrief.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, scope: "record", title: `Public Review Brief: ${record.name}`, summary: `This record-level brief summarizes public-source review status for ${record.name}. It is intended to show claims, receipts, unresolved gaps, and review posture without exposing sensitive facility detail.`, reviewOnlyNotice, boundary: publicBoundary, keyClaims: [`${record.name} is listed as ${record.status} in ${record.city ? `${record.city}, ` : ""}${record.county}, ${record.state}.`, `Current confidence score: ${record.confidenceScore}%.`, `Source quality score: ${report.score} (${report.band}).`, record.capacityMW && record.capacityMW > 0 ? `Capacity claim under review: ${record.capacityMW} MW.` : "No MW capacity claim is asserted by this brief."], sourceReceipts: record.receipts.map((receipt) => ({ sourceName: receipt.sourceName, sourceType: receipt.sourceType, sourceUrl: receipt.sourceUrl, claim: receipt.claim, confidence: receipt.confidence, retrievedAt: receipt.retrievedAt })), unresolvedGaps: Array.from(new Set([...blockers, ...record.reviewWarnings, ...report.gaps])), quality: report, relatedRecords: [{ id: record.id, name: record.name, state: record.state, county: record.county, canonicalBlockers: blockers }], digest: digest({ record, report, blockers }) };
}

function buildRegionBrief(region: RegionalSummary, records: LedgerRecord[], reports: SourceQualityReport[]): PublicBrief {
  const regionalRecords = records.filter((record) => region.mode === "state" ? record.state === region.state : record.state === region.state && record.county === region.county);
  const reportMap = new Map(reports.map((report) => [report.recordId, report]));
  const sourceReceipts = regionalRecords.flatMap((record) => record.receipts.map((receipt) => ({ sourceName: receipt.sourceName, sourceType: receipt.sourceType, sourceUrl: receipt.sourceUrl, claim: `${record.name}: ${receipt.claim}`, confidence: receipt.confidence, retrievedAt: receipt.retrievedAt })));
  const relatedRecords = regionalRecords.map((record) => ({ id: record.id, name: record.name, state: record.state, county: record.county, canonicalBlockers: canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)) }));
  return { schema: "DataCenterLedger.PublicBrief.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, scope: "region", title: `Regional Public Review Brief: ${region.label}`, summary: `This regional brief summarizes ${region.records} public-review record(s) for ${region.label}. It reports review posture, receipts, quality bands, and unresolved gaps at a map-safe regional level only.`, reviewOnlyNotice, boundary: publicBoundary, keyClaims: [`${region.label} has ${region.records} record(s) in this local workspace.`, `${region.canonical} record(s) currently pass the canonical gate; ${region.needsReview} need review.`, `Average source quality: ${region.averageQuality}.`, "This brief does not publish facility coordinates or sensitive layout information."], sourceReceipts, unresolvedGaps: Array.from(new Set([...region.reviewGaps, ...relatedRecords.flatMap((item) => item.canonicalBlockers)])), quality: { averageQuality: region.averageQuality, qualityBands: region.qualityBands, regionalRecords: region.records }, relatedRecords, digest: digest({ region, relatedRecords, sourceReceipts }) };
}

function briefToMarkdown(brief: PublicBrief) {
  const receiptLines = brief.sourceReceipts.length ? brief.sourceReceipts.map((receipt, index) => `${index + 1}. **${receipt.sourceName}** (${receipt.sourceType}, ${receipt.confidence}) — ${receipt.claim}${receipt.sourceUrl ? `\n   Source: ${receipt.sourceUrl}` : ""}`) : ["No receipts are attached yet."];
  return `# ${brief.title}\n\nGenerated: ${brief.generatedAt}\n\n## Review-only notice\n\n${brief.reviewOnlyNotice}\n\n## Public safety boundary\n\n${brief.boundary.map((item) => `- ${item}`).join("\n")}\n\n## Summary\n\n${brief.summary}\n\n## Key claims under review\n\n${brief.keyClaims.map((claim) => `- ${claim}`).join("\n")}\n\n## Source receipts\n\n${receiptLines.join("\n\n")}\n\n## Unresolved gaps\n\n${brief.unresolvedGaps.length ? brief.unresolvedGaps.map((gap) => `- ${gap}`).join("\n") : "- No unresolved gaps recorded in this local workspace."}\n\n## Digest\n\n${brief.digest}\n`;
}

function downloadJson(filename: string, payload: unknown) {
  downloadBlob(filename, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
}

function downloadText(filename: string, text: string) {
  downloadBlob(filename, new Blob([text], { type: "text/markdown" }));
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [records, setRecords] = useState<LedgerRecord[]>(starterRecords);
  const [selectedId, setSelectedId] = useState(starterRecords[0].id);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [mode, setMode] = useState<"all" | "canonical" | "review">("all");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft>(() => makeEmptyReceiptDraft());
  const [receiptHistory, setReceiptHistory] = useState<ReceiptEditHistoryItem[]>([]);
  const [regionMode, setRegionMode] = useState<RegionMode>("state");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [sessionName, setSessionName] = useState("Local review session");
  const [sessionText, setSessionText] = useState("");
  const [taskStatusOverrides, setTaskStatusOverrides] = useState<Record<string, TaskStatus>>({});
  const [manualTasks, setManualTasks] = useState<ReviewTask[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | TaskStatus>("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<"all" | TaskCategory>("all");
  const [manualTaskText, setManualTaskText] = useState("");
  const [briefScope, setBriefScope] = useState<BriefScope>("record");
  const [promotionHistory, setPromotionHistory] = useState<PromotionReceipt[]>([]);
  const [promotionReviewer, setPromotionReviewer] = useState("Local reviewer");
  const [promotionReason, setPromotionReason] = useState("");
  const [promotionSafetyAck, setPromotionSafetyAck] = useState(false);
  const [promotionBriefAck, setPromotionBriefAck] = useState(false);

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const reports = useMemo(() => records.map(scoreRecord), [records]);
  const reportMap = useMemo(() => new Map(reports.map((report) => [report.recordId, report])), [reports]);
  const selectedReport = reportMap.get(selected.id) || scoreRecord(selected);
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const canonicalRecords = useMemo(() => records.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length === 0), [records, reportMap]);
  const reviewRecords = records.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length > 0);
  const regionalSummaries = useMemo(() => buildRegionalSummaries(records, reports, regionMode), [records, reports, regionMode]);
  const selectedRegion = regionalSummaries.find((region) => region.id === selectedRegionId) || regionalSummaries[0];
  const importWarnings = allPreviewWarnings(importPreview);
  const hasBlockingImport = importWarnings.some((warning) => warning.level === "blocking");
  const receiptDraftWarnings = validateReceiptDraft(receiptDraft);
  const hasBlockingReceiptDraft = receiptDraftWarnings.some((warning) => warning.level === "blocking");
  const selectedBrief = briefScope === "record" ? buildRecordBrief(selected, selectedReport) : selectedRegion ? buildRegionBrief(selectedRegion, records, reports) : buildRecordBrief(selected, selectedReport);
  const selectedRegionPacket = selectedRegion ? buildRegionalEvidencePacket(selectedRegion, records, reports) : null;
  const tasks = generateReviewTasks(records, reports, selectedRegion, taskStatusOverrides, manualTasks);
  const visibleTasks = tasks.filter((task) => (taskStatusFilter === "all" || task.status === taskStatusFilter) && (taskCategoryFilter === "all" || task.category === taskCategoryFilter));
  const promotionChecklistItems = promotionChecklist(selected, selectedReport, promotionBriefAck, promotionSafetyAck, promotionReason);
  const canPromoteSelected = checklistPasses(promotionChecklistItems);

  const visibleRecords = records.filter((record) => {
    const haystack = `${record.name} ${record.operator} ${record.county} ${record.city || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || record.state === stateFilter;
    const blockers = canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record));
    const matchesMode = mode === "all" || (mode === "canonical" ? blockers.length === 0 : blockers.length > 0);
    return matchesQuery && matchesState && matchesMode;
  });

  function previewImportFromText(origin = "pasted CSV") {
    setImportPreview(buildImportPreview(importText, origin, records));
  }

  function loadSampleImport() {
    setImportText(sampleCsv);
    setImportPreview(buildImportPreview(sampleCsv, "sample CSV", records));
  }

  async function loadCsvFile(file: File) {
    const text = await file.text();
    setImportText(text);
    setImportPreview(buildImportPreview(text, file.name, records));
  }

  function commitImportPreview() {
    if (!importPreview || hasBlockingImport) return;
    const importedRecords = importPreview.rows.map((row) => row.record);
    setRecords((items) => [...items, ...importedRecords]);
    setImportHistory((items) => [{ batchId: importPreview.batchId, committedAt: nowIso(), origin: importPreview.origin, rowsCommitted: importedRecords.length, warningCount: importWarnings.length, digest: importPreview.digest }, ...items]);
    if (importedRecords[0]) setSelectedId(importedRecords[0].id);
    setImportPreview(null);
    setImportText("");
  }

  function addReceiptToSelected() {
    if (hasBlockingReceiptDraft) return;
    const addedAt = nowIso();
    const receipt = buildReceiptFromDraft(receiptDraft, selected, addedAt);
    const resolution = resolveWarningsAfterReceipt(selected, receipt);
    const historyItem: ReceiptEditHistoryItem = { receiptId: receipt.receiptId || digest({ receipt, addedAt }), recordId: selected.id, recordName: selected.name, addedAt, sourceName: receipt.sourceName, sourceType: receipt.sourceType, confidence: receipt.confidence, resolvedWarnings: resolution.resolved, remainingWarnings: resolution.remaining.length, digest: digest({ receipt, selected: selected.id, addedAt, resolution }) };
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, receipts: [...item.receipts, receipt], reviewWarnings: resolution.remaining, notes: [...item.notes, `Receipt ${historyItem.receiptId} added at ${new Date(addedAt).toLocaleString()} from ${receipt.sourceName}. Resolved ${resolution.resolved.length} warning(s).`] } : item));
    setReceiptHistory((items) => [historyItem, ...items]);
    setReceiptDraft(makeEmptyReceiptDraft());
  }

  function markSelectedReviewed() {
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, lifecycle: "reviewed", notes: [...item.notes, `Marked reviewed at ${new Date().toLocaleString()} before canonical promotion.`] } : item));
  }

  function promoteSelectedWithReceipt() {
    if (!canPromoteSelected) return;
    const promotedAt = nowIso();
    const promotionId = digest({ recordId: selected.id, promotedAt, promotionReviewer, promotionReason, promotionChecklistItems, selectedReport });
    const receipt: PromotionReceipt = { promotionId, recordId: selected.id, recordName: selected.name, promotedAt, reviewer: promotionReviewer.trim() || "Local reviewer", reason: promotionReason.trim(), checklist: promotionChecklistItems, sourceQuality: selectedReport, publicBriefReady: promotionBriefAck, safetyAcknowledged: promotionSafetyAck, priorLifecycle: selected.lifecycle, digest: digest({ promotionId, selected, promotionChecklistItems, selectedReport }) };
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, lifecycle: "promoted_public", reviewWarnings: [], notes: [...item.notes, `Promoted through Canonical Review Mode at ${new Date(promotedAt).toLocaleString()}. Promotion receipt: ${promotionId}. Reason: ${promotionReason.trim()}`] } : item));
    setPromotionHistory((items) => [receipt, ...items]);
    setTaskStatusOverrides((items) => ({ ...items, [`task-promotion-${selected.id}`]: "done" }));
    setPromotionReason("");
    setPromotionSafetyAck(false);
    setPromotionBriefAck(false);
  }

  function addManualTask() {
    if (!manualTaskText.trim()) return;
    const task: ReviewTask = { id: digest({ manualTaskText, selectedId, createdAt: nowIso() }), recordId: selected.id, regionId: `${selected.state}::${selected.county}`, title: manualTaskText.trim(), category: "manual_follow_up", status: "open", priority: "medium", detail: `Manual follow-up for ${selected.name}.`, createdAt: nowIso(), source: "manual" };
    setManualTasks((items) => [task, ...items]);
    setManualTaskText("");
  }

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    setTaskStatusOverrides((items) => ({ ...items, [taskId]: status }));
  }

  function exportLedger() {
    downloadJson("datacenter-ledger-export.json", { schema: "DataCenterLedger.Export.v2.0-canonical-review-mode", generatedAt: nowIso(), appVersion: APP_VERSION, boundary: publicBoundary, records, importHistory, receiptHistory, promotionHistory, sourceQuality: reports, regionalSummaries, tasks, digest: digest({ records, importHistory, receiptHistory, promotionHistory, reports, tasks }) });
  }

  function exportCanonical() {
    const included = canonicalRecords;
    const excluded = records.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length > 0).map((record) => ({ id: record.id, name: record.name, blockers: canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)) }));
    downloadJson("datacenter-ledger-canonical.json", { schema: "DataCenterLedger.CanonicalRegistry.v2.0-canonical-review-mode", generatedAt: nowIso(), appVersion: APP_VERSION, promotionHistory, included, excluded, digest: digest({ included, excluded, promotionHistory }) });
  }

  function exportPromotionHistory() {
    downloadJson("datacenter-ledger-promotion-history.json", { schema: "DataCenterLedger.PromotionHistory.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, promotionHistory, digest: digest(promotionHistory) });
  }

  function exportSelectedPromotionPacket() {
    downloadJson("datacenter-ledger-selected-canonical-review.json", { schema: "DataCenterLedger.CanonicalReviewPacket.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, record: selected, sourceQuality: selectedReport, checklist: promotionChecklistItems, blockers: canonicalBlockers(selected, selectedReport), publicBrief: selectedBrief, recentPromotions: promotionHistory.filter((item) => item.recordId === selected.id), digest: digest({ selected, selectedReport, promotionChecklistItems, selectedBrief }) });
  }

  function exportRegionalPacket() {
    if (selectedRegionPacket) downloadJson("datacenter-ledger-regional-evidence-packet.json", selectedRegionPacket);
  }

  function exportReviewQueue() {
    downloadJson("datacenter-ledger-review-queue.json", { schema: "DataCenterLedger.ReviewQueue.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, tasks, taskStatusOverrides, manualTasks, digest: digest({ tasks, taskStatusOverrides, manualTasks }) });
  }

  function exportPublicBriefJson() {
    downloadJson("datacenter-ledger-public-brief.json", selectedBrief);
  }

  function exportPublicBriefMarkdown() {
    downloadText("datacenter-ledger-public-brief.md", briefToMarkdown(selectedBrief));
  }

  function buildSession(): LocalReviewSession {
    const session: LocalReviewSession = { schema: "DataCenterLedger.LocalReviewSession.v2.0", generatedAt: nowIso(), appVersion: APP_VERSION, sessionName, records, importHistory, receiptHistory, promotionHistory, taskStatusOverrides, manualTasks, uiState: { selectedId, query, stateFilter, mode, regionMode, selectedRegionId: selectedRegion?.id || "", taskStatusFilter, taskCategoryFilter, briefScope }, digest: "pending" };
    return { ...session, digest: digest(session) };
  }

  function exportSession() {
    downloadJson("datacenter-ledger-local-review-session.json", buildSession());
  }

  function restoreSessionFromText(text: string) {
    const parsed = JSON.parse(text) as LocalReviewSession;
    if (!parsed.schema?.startsWith("DataCenterLedger.LocalReviewSession")) throw new Error("Invalid DataCenterLedger session schema.");
    setSessionName(parsed.sessionName || "Restored session");
    setRecords(parsed.records || starterRecords);
    setImportHistory(parsed.importHistory || []);
    setReceiptHistory(parsed.receiptHistory || []);
    setPromotionHistory(parsed.promotionHistory || []);
    setTaskStatusOverrides(parsed.taskStatusOverrides || {});
    setManualTasks(parsed.manualTasks || []);
    setSelectedId(parsed.uiState?.selectedId || parsed.records?.[0]?.id || starterRecords[0].id);
    setQuery(parsed.uiState?.query || "");
    setStateFilter(parsed.uiState?.stateFilter || "all");
    setMode(parsed.uiState?.mode || "all");
    setRegionMode(parsed.uiState?.regionMode || "state");
    setSelectedRegionId(parsed.uiState?.selectedRegionId || "");
    setTaskStatusFilter(parsed.uiState?.taskStatusFilter || "all");
    setTaskCategoryFilter(parsed.uiState?.taskCategoryFilter || "all");
    setBriefScope(parsed.uiState?.briefScope || "record");
  }

  function resetDemoData() {
    setRecords(starterRecords);
    setSelectedId(starterRecords[0].id);
    setImportHistory([]);
    setReceiptHistory([]);
    setPromotionHistory([]);
    setTaskStatusOverrides({});
    setManualTasks([]);
    setQuery("");
    setStateFilter("all");
    setMode("all");
  }

  return (
    <main className="shell">
      <header className="hero launchHero">
        <div>
          <p className="eyebrow">v{APP_VERSION} canonical review mode • local-first • public-safe</p>
          <h1>DataCenterLedger Explorer</h1>
          <p>A civic transparency workbench for reviewing public data center records as claims — with receipts, quality scoring, regional packets, public briefs, review tasks, session save/load, and explicit canonical promotion receipts.</p>
          <div className="boundaryPills">{publicBoundary.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="heroActions">
          <button onClick={exportLedger}>Export Ledger</button>
          <button onClick={exportCanonical}>Export Canonical</button>
          <button onClick={exportSession}>Export Session</button>
        </div>
      </header>

      <section className="cards">
        <Stat label="Records" value={records.length} />
        <Stat label="Canonical" value={canonicalRecords.length} />
        <Stat label="Needs review" value={reviewRecords.length} />
        <Stat label="Receipts" value={records.reduce((sum, record) => sum + record.receipts.length, 0)} />
        <Stat label="Promotions" value={promotionHistory.length} />
        <Stat label="Tasks" value={tasks.length} />
      </section>

      <section className="panel canonicalModePanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">v2.0 Canonical Review Mode</p>
            <h2>Promotion is now a checklist-backed receipt, not just a button.</h2>
            <p className="muted">Selected record: <strong>{selected.name}</strong>. Review each gate, acknowledge the public-data boundary, add a reviewer reason, then promote only when the checklist is ready.</p>
          </div>
          <div className="heroActions"><button onClick={exportSelectedPromotionPacket}>Export Review Packet</button><button onClick={exportPromotionHistory} disabled={promotionHistory.length === 0}>Export Promotion History</button></div>
        </div>
        <div className="canonicalGrid">
          <div className="canonicalChecklist">
            {promotionChecklistItems.map((item) => <article key={item.id} className={`checkCard ${item.status}`}><strong>{item.label}</strong><span>{item.status}</span><p>{item.detail}</p></article>)}
          </div>
          <div className="promotionForm">
            <label>Reviewer<input value={promotionReviewer} onChange={(event) => setPromotionReviewer(event.target.value)} /></label>
            <label>Promotion reason<textarea value={promotionReason} onChange={(event) => setPromotionReason(event.target.value)} placeholder="Why is this record safe and ready for promoted_public?" /></label>
            <label className="checkLine"><input type="checkbox" checked={promotionBriefAck} onChange={(event) => setPromotionBriefAck(event.target.checked)} /> Public brief reviewed and ready</label>
            <label className="checkLine"><input type="checkbox" checked={promotionSafetyAck} onChange={(event) => setPromotionSafetyAck(event.target.checked)} /> I acknowledge the public-data / non-targeting boundary</label>
            <div className="importActions"><button onClick={markSelectedReviewed}>Mark reviewed</button><button onClick={promoteSelectedWithReceipt} disabled={!canPromoteSelected}>Promote with Receipt</button></div>
            {!canPromoteSelected && <p className="dangerText">Promotion is locked until all fail/needs-human checklist gates are resolved.</p>}
          </div>
        </div>
      </section>

      <section className="panel publicBriefPanel">
        <div className="panelHeader"><div><p className="eyebrow">v1.9 Public Brief Generator</p><h2>{selectedBrief.title}</h2><p className="muted">{reviewOnlyNotice}</p></div><div className="heroActions"><select value={briefScope} onChange={(event) => setBriefScope(event.target.value as BriefScope)}><option value="record">Selected record</option><option value="region">Selected region</option></select><button onClick={exportPublicBriefJson}>Export JSON</button><button onClick={exportPublicBriefMarkdown}>Export Markdown</button></div></div>
      </section>

      <section className="panel sourceScoreboard">
        <div className="panelHeader"><div><p className="eyebrow">Source Quality Scoreboard</p><h2>Source posture by record</h2></div></div>
        <div className="tableWrap"><table><thead><tr><th>Record</th><th>Score</th><th>Band</th><th>Receipts</th><th>Public links</th><th>Top gaps</th></tr></thead><tbody>{reports.map((report) => { const record = records.find((item) => item.id === report.recordId)!; return <tr key={report.recordId} onClick={() => setSelectedId(report.recordId)}><td><strong>{record.name}</strong><small>{record.state} • {record.county}</small></td><td>{report.score}</td><td><span className={`chip ${report.band === "strong" ? "ok" : report.band === "moderate" ? "info" : report.band === "weak" ? "warn" : "danger"}`}>{report.band}</span></td><td>{report.receiptCount}</td><td>{report.publicLinkCoverage}%</td><td>{report.gaps.slice(0, 2).join("; ")}</td></tr>; })}</tbody></table></div>
      </section>

      <section className="panel regionalPanel">
        <div className="panelHeader"><div><p className="eyebrow">Map-Safe Regional View</p><h2>State/county summaries only</h2><p className="muted">No coordinates, private access details, or sensitive facility layouts.</p></div><div className="heroActions"><select value={regionMode} onChange={(event) => { setRegionMode(event.target.value as RegionMode); setSelectedRegionId(""); }}><option value="state">State</option><option value="county">County</option></select><button onClick={exportRegionalPacket} disabled={!selectedRegion}>Export Regional Packet</button></div></div>
        <div className="tableWrap"><table><thead><tr><th>Region</th><th>Records</th><th>Canonical</th><th>Needs review</th><th>Avg quality</th><th>Gaps</th></tr></thead><tbody>{regionalSummaries.map((region) => <tr key={region.id} onClick={() => setSelectedRegionId(region.id)} className={selectedRegion?.id === region.id ? "selected" : ""}><td><strong>{region.label}</strong><small>{region.mode}</small></td><td>{region.records}</td><td>{region.canonical}</td><td>{region.needsReview}</td><td>{region.averageQuality}</td><td>{region.reviewGaps.slice(0, 2).join("; ")}</td></tr>)}</tbody></table></div>
      </section>

      <section className="panel importWorkbench">
        <div className="panelHeader"><div><p className="eyebrow">Import Review Workbench</p><h2>Preview CSV rows before commit</h2></div><div className="heroActions"><button onClick={loadSampleImport}>Load sample CSV</button><label className="fileButton">Load CSV<input type="file" accept=".csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadCsvFile(file); event.currentTarget.value = ""; }} /></label></div></div>
        <textarea className="csvTextArea" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste normalized public-source CSV here." />
        <div className="importActions"><button onClick={() => previewImportFromText()} disabled={!importText.trim()}>Preview CSV</button><button onClick={commitImportPreview} disabled={!importPreview || hasBlockingImport}>Commit Preview</button><button onClick={() => setImportPreview(null)}>Clear</button></div>
        {importPreview && <div className="previewPanel"><div className="previewSummary"><Stat label="Rows" value={importPreview.rows.length} /><Stat label="Warnings" value={importWarnings.length} /><Stat label="Blocking" value={importWarnings.filter((warning) => warning.level === "blocking").length} /><Stat label="Digest" value={importPreview.digest} /></div></div>}
      </section>

      <section className="panel reviewQueuePanel">
        <div className="panelHeader"><div><p className="eyebrow">Review Queue + Task Board</p><h2>Turn gaps into work</h2></div><div className="heroActions"><select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value as "all" | TaskStatus)}><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option><option value="dismissed">Dismissed</option></select><select value={taskCategoryFilter} onChange={(event) => setTaskCategoryFilter(event.target.value as "all" | TaskCategory)}><option value="all">All categories</option><option value="needs_second_source">Second source</option><option value="needs_public_url">Public URL</option><option value="needs_permit_receipt">Permit</option><option value="needs_utility_receipt">Utility</option><option value="ready_for_promotion">Promotion-ready</option><option value="manual_follow_up">Manual</option></select><button onClick={exportReviewQueue}>Export Tasks</button></div></div>
        <div className="manualTask"><input value={manualTaskText} onChange={(event) => setManualTaskText(event.target.value)} placeholder="Add manual task for selected record..." /><button onClick={addManualTask}>Add Task</button></div>
        <div className="taskGrid">{visibleTasks.slice(0, 12).map((task) => <article key={task.id} className={`taskCard priority-${task.priority}`}><div><strong>{task.title}</strong><span>{task.category} • {task.priority}</span></div><p>{task.detail}</p><div className="importActions"><select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option><option value="dismissed">Dismissed</option></select><button onClick={() => setSelectedId(task.recordId)}>Open record</button></div></article>)}</div>
      </section>

      <section className="panel sessionPanel">
        <div className="panelHeader"><div><p className="eyebrow">Local Review Session</p><h2>Save and restore workspace</h2></div><button onClick={exportSession}>Export Session JSON</button></div>
        <div className="sessionGrid"><label>Session name<input value={sessionName} onChange={(event) => setSessionName(event.target.value)} /></label><label className="fileButton">Load session file<input type="file" accept=".json" onChange={(event) => { const file = event.target.files?.[0]; if (file) file.text().then(restoreSessionFromText).catch(console.error); event.currentTarget.value = ""; }} /></label></div>
        <textarea value={sessionText} onChange={(event) => setSessionText(event.target.value)} placeholder="Paste DataCenterLedger.LocalReviewSession JSON here." />
        <div className="importActions"><button onClick={() => restoreSessionFromText(sessionText)} disabled={!sessionText.trim()}>Restore pasted session</button><button onClick={resetDemoData}>Reset demo</button></div>
      </section>

      <section className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, operators, counties..." />
        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">All states</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select>
        <select value={mode} onChange={(event) => setMode(event.target.value as "all" | "canonical" | "review")}><option value="all">All records</option><option value="canonical">Canonical only</option><option value="review">Needs review</option></select>
      </section>

      <section className="grid">
        <div className="panel"><div className="panelHeader"><div><p className="eyebrow">Working registry</p><h2>Review queue</h2></div><span className="countBadge">{visibleRecords.length} visible</span></div><div className="tableWrap"><table><thead><tr><th>Name</th><th>State</th><th>Status</th><th>Lifecycle</th><th>Quality</th><th>Gate</th></tr></thead><tbody>{visibleRecords.map((record) => { const report = reportMap.get(record.id) || scoreRecord(record); const blockers = canonicalBlockers(record, report); return <tr key={record.id} onClick={() => setSelectedId(record.id)} className={record.id === selected.id ? "selected" : ""}><td><strong>{record.name}</strong><small>{record.operator}</small></td><td>{record.state}</td><td>{record.status}</td><td>{record.lifecycle}</td><td>{report.score}</td><td><span className={blockers.length ? "chip warn" : "chip ok"}>{blockers.length ? "review" : "canonical"}</span></td></tr>; })}</tbody></table></div></div>
        <aside className="panel drawer"><p className="eyebrow">Selected record</p><h2>{selected.name}</h2><p className="muted">{selected.city ? `${selected.city}, ` : ""}{selected.county}, {selected.state} • {selected.precision}</p><div className="miniGrid"><Stat label="MW" value={selected.capacityMW || "unknown"} /><Stat label="Receipts" value={selected.receipts.length} /><Stat label="Quality" value={selectedReport.score} /></div><h3>Canonical blockers</h3>{canonicalBlockers(selected, selectedReport).length ? <ul>{canonicalBlockers(selected, selectedReport).map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <p className="okText">Record passes the current canonical gate.</p>}
          <section className="receiptEditor"><p className="eyebrow">Receipt Editor</p><div className="receiptGrid"><label>Source<input value={receiptDraft.sourceName} onChange={(event) => setReceiptDraft((draft) => ({ ...draft, sourceName: event.target.value }))} /></label><label>Type<select value={receiptDraft.sourceType} onChange={(event) => setReceiptDraft((draft) => ({ ...draft, sourceType: event.target.value as SourceType }))}>{validSourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>URL<input value={receiptDraft.sourceUrl} onChange={(event) => setReceiptDraft((draft) => ({ ...draft, sourceUrl: event.target.value }))} /></label><label>Date<input type="date" value={receiptDraft.retrievedAt} onChange={(event) => setReceiptDraft((draft) => ({ ...draft, retrievedAt: event.target.value }))} /></label></div><label>Claim<textarea value={receiptDraft.claim} onChange={(event) => setReceiptDraft((draft) => ({ ...draft, claim: event.target.value }))} /></label>{receiptDraftWarnings.map((warning) => <span key={warning.message} className={`chip ${warning.level === "blocking" ? "danger" : "warn"}`}>{warning.message}</span>)}<div className="importActions"><button onClick={addReceiptToSelected} disabled={hasBlockingReceiptDraft}>Add Receipt</button><button onClick={() => setReceiptDraft(makeEmptyReceiptDraft())}>Clear</button></div></section>
          <h3>Receipts</h3>{selected.receipts.map((receipt, index) => <div key={receipt.receiptId || `${receipt.sourceName}-${index}`} className="receipt"><strong>{receipt.sourceName}</strong><span>{receipt.sourceType} • {receipt.confidence} • {new Date(receipt.retrievedAt).toLocaleDateString()}</span><p>{receipt.claim}</p>{receipt.sourceUrl && <a href={receipt.sourceUrl} target="_blank" rel="noreferrer">Open public source</a>}</div>)}
          <h3>Notes</h3>{selected.notes.length ? <ul>{selected.notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : <p className="muted">No notes yet.</p>}
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}
