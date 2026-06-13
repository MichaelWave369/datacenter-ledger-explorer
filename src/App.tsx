import { useMemo, useState, type ChangeEvent } from "react";

const APP_VERSION = "2.6.0";
const publicBoundary = [
  "Public-data only",
  "No hidden network calls",
  "No private facility discovery",
  "No security-sensitive enrichment",
  "City/county precision unless exact location is already public and appropriate",
  "Review-only: not proof of truth and not a targeting map."
];
const reviewOnlyNotice =
  "This app is a public-data review aid. It is not proof of truth, not a complete national registry, not a targeting map, and not a substitute for human review of cited sources.";
const twoPersonPolicy = [
  "The submitter of a change cannot approve or reject the same change.",
  "The decision role must be different from the submitter role.",
  "Admin does not bypass the two-person separation rule.",
  "Rejected requests preserve a decision receipt and do not mutate the record."
];

// Public-safe data model.
type Status = "operating" | "planned" | "under_construction" | "approved" | "unknown";
type Lifecycle = "raw_import" | "local_working" | "reviewed" | "promoted_public" | "rejected_duplicate" | "retired";
type Precision = "public_dataset" | "city_level" | "county_level" | "state_level" | "unknown";
type Confidence = "high" | "medium" | "low";
type SourceType = "public_dataset" | "permit" | "utility" | "operator" | "news" | "review" | "other";
type QualityBand = "strong" | "moderate" | "weak" | "blocked";
type RegionMode = "state" | "county";
type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "dismissed";
type ApprovalStatus = "pending" | "approved" | "rejected";
type ReviewerRole = "viewer" | "data_reviewer" | "source_reviewer" | "regional_reviewer" | "publisher" | "admin";
type RolePermission =
  | "view_workspace"
  | "import_records"
  | "edit_receipts"
  | "submit_changes"
  | "approve_changes"
  | "reject_changes"
  | "mark_reviewed"
  | "promote_records"
  | "export_public_brief"
  | "export_regional_packet"
  | "export_canonical"
  | "restore_session"
  | "export_release_manifest";

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
type ImportWarning = { rowNumber: number; level: "info" | "warning" | "blocking"; field?: string; message: string };
type ImportPreview = { batchId: string; createdAt: string; origin: string; rows: Array<{ rowNumber: number; record: LedgerRecord; warnings: ImportWarning[] }>; warnings: ImportWarning[]; digest: string };
type ImportHistoryItem = { batchId: string; committedAt: string; origin: string; rowsCommitted: number; warningCount: number; digest: string };
type ReceiptDraft = { sourceName: string; sourceType: SourceType; sourceUrl: string; retrievedAt: string; claim: string; confidence: Confidence };
type ReceiptEditHistoryItem = { receiptId: string; recordId: string; recordName: string; addedAt: string; sourceName: string; sourceType: SourceType; confidence: Confidence; resolvedWarnings: string[]; remainingWarnings: number; reviewer: string; reviewerRole: ReviewerRole; digest: string };
type SourceQualityReport = { recordId: string; score: number; band: QualityBand; receiptCount: number; sourceTypeCount: number; publicLinkCoverage: number; newestReceiptDaysOld: number | null; highImpactClaimCoverage: "not_applicable" | "needs_second_source" | "covered"; strengths: string[]; gaps: string[]; digest: string };
type RegionalSummary = { id: string; mode: RegionMode; label: string; state: string; county?: string; records: number; canonical: number; needsReview: number; receipts: number; averageQuality: number; qualityBands: Record<QualityBand, number>; reviewGaps: string[]; digest: string };
type ReviewTask = { id: string; recordId: string; regionId?: string; title: string; status: TaskStatus; priority: "low" | "medium" | "high"; detail: string; createdAt: string; source: "generated" | "manual" };
type RoleProfile = { role: ReviewerRole; label: string; description: string; permissions: RolePermission[]; publicBoundary: string[] };
type RoleGateSnapshot = { action: string; permission: RolePermission; allowed: boolean; activeRole: ReviewerRole; reviewer: string; detail: string; digest: string };
type TwoPersonGateSnapshot = { action: "approve_change" | "reject_change"; allowed: boolean; submitter: string; submitterRole: ReviewerRole; decider: string; deciderRole: ReviewerRole; differentReviewer: boolean; differentRole: boolean; roleAllowed: boolean; detail: string; digest: string };
type PromotionReceipt = { promotionId: string; recordId: string; recordName: string; promotedAt: string; reviewer: string; reviewerRole: ReviewerRole; reason: string; sourceQuality: SourceQualityReport; priorLifecycle: Lifecycle; roleGate: RoleGateSnapshot; digest: string };
type PublicBrief = { schema: string; generatedAt: string; appVersion: string; scope: "record" | "region"; title: string; summary: string; reviewOnlyNotice: string; boundary: string[]; keyClaims: string[]; sourceReceipts: Receipt[]; unresolvedGaps: string[]; roleGate: RoleGateSnapshot; digest: string };
type ChangeDelta = { field: string; before: string; after: string; impact: "low" | "medium" | "high" };
type ChangeReceipt = { changeId: string; approvalId: string; recordId: string; recordName: string; changedAt: string; reviewer: string; reviewerRole: ReviewerRole; reason: string; deltas: ChangeDelta[]; beforeQuality: SourceQualityReport; afterQuality: SourceQualityReport; canonicalBefore: string[]; canonicalAfter: string[]; roleGate: RoleGateSnapshot; twoPersonGate: TwoPersonGateSnapshot; digest: string };
type ChangeApprovalRequest = { approvalId: string; recordId: string; recordName: string; requestedAt: string; requestedBy: string; requestedRole: ReviewerRole; reason: string; status: ApprovalStatus; deltas: ChangeDelta[]; recordBefore: LedgerRecord; recordAfter: LedgerRecord; beforeQuality: SourceQualityReport; afterQuality: SourceQualityReport; canonicalBefore: string[]; canonicalAfter: string[]; submitGate: RoleGateSnapshot; twoPersonPolicy: string[]; decisionReviewer?: string; decisionRole?: ReviewerRole; decisionNote?: string; decisionGate?: RoleGateSnapshot; twoPersonGate?: TwoPersonGateSnapshot; decidedAt?: string; appliedChangeId?: string; digest: string };
type AuditEvent = { id: string; kind: string; title: string; status: string; detail: string; digest: string };
type PromotionAuditTimeline = { schema: string; generatedAt: string; appVersion: string; recordId: string; recordName: string; events: AuditEvent[]; summary: Record<string, number>; latestEventAt: string | null; digest: string };
type ReleaseReadiness = { ready: boolean; blockers: string[]; warnings: string[]; canonicalCount: number; pendingApprovals: number; rejectedApprovals: number; publicBriefCount: number; promotionReceiptCount: number; changeReceiptCount: number; averageSourceQuality: number };
type GovernanceReleaseManifest = {
  schema: "DataCenterLedger.GovernanceReleaseManifest.v2.6";
  generatedAt: string;
  appVersion: string;
  releaseName: string;
  releaseScope: "local_workspace";
  reviewerName: string;
  activeRole: ReviewerRole;
  roleProfile: RoleProfile;
  roleGate: RoleGateSnapshot;
  twoPersonPolicy: string[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  readiness: ReleaseReadiness;
  records: { total: number; canonical: LedgerRecord[]; needsReview: LedgerRecord[] };
  sourceQuality: SourceQualityReport[];
  regionalSummaries: RegionalSummary[];
  publicBriefs: PublicBrief[];
  promotionReceipts: PromotionReceipt[];
  changeReceipts: ChangeReceipt[];
  approvalQueue: ChangeApprovalRequest[];
  auditTimelines: PromotionAuditTimeline[];
  manifestDigest: string;
};

type ChangeDraft = { name: string; operator: string; status: Status; lifecycle: Lifecycle; county: string; city: string; confidenceScore: string; reviewWarnings: string };

type LocalReviewSession = {
  schema: string;
  generatedAt: string;
  appVersion: string;
  releaseName: string;
  activeRole: ReviewerRole;
  reviewerName: string;
  records: LedgerRecord[];
  receiptHistory: ReceiptEditHistoryItem[];
  importHistory: ImportHistoryItem[];
  promotionHistory: PromotionReceipt[];
  changeHistory: ChangeReceipt[];
  approvalQueue: ChangeApprovalRequest[];
  taskStatusOverrides: Record<string, TaskStatus>;
  manualTasks: ReviewTask[];
  digest: string;
};

const validStatuses: Status[] = ["operating", "planned", "under_construction", "approved", "unknown"];
const validSourceTypes: SourceType[] = ["public_dataset", "permit", "utility", "operator", "news", "review", "other"];
const lifecycleOptions: Lifecycle[] = ["raw_import", "local_working", "reviewed", "promoted_public", "rejected_duplicate", "retired"];
const roleProfiles: Record<ReviewerRole, RoleProfile> = {
  viewer: { role: "viewer", label: "Viewer", description: "Can inspect the workspace but cannot change, approve, promote, or publish.", permissions: ["view_workspace"], publicBoundary },
  data_reviewer: { role: "data_reviewer", label: "Data reviewer", description: "Can import records, submit proposed changes, mark records reviewed, and restore sessions.", permissions: ["view_workspace", "import_records", "submit_changes", "mark_reviewed", "restore_session"], publicBoundary },
  source_reviewer: { role: "source_reviewer", label: "Source reviewer", description: "Can add receipts, submit source corrections, and approve/reject source-backed changes.", permissions: ["view_workspace", "edit_receipts", "submit_changes", "approve_changes", "reject_changes"], publicBoundary },
  regional_reviewer: { role: "regional_reviewer", label: "Regional reviewer", description: "Can review state/county summaries and export regional evidence packets.", permissions: ["view_workspace", "submit_changes", "mark_reviewed", "export_regional_packet"], publicBoundary },
  publisher: { role: "publisher", label: "Publisher", description: "Can approve changes, promote canonical records, export public briefs/canonical packets, and cut release manifests.", permissions: ["view_workspace", "approve_changes", "reject_changes", "promote_records", "export_public_brief", "export_canonical", "export_regional_packet", "export_release_manifest"], publicBoundary },
  admin: { role: "admin", label: "Admin", description: "Local super-review profile for demos/testing; still cannot self-approve under the two-person rule.", permissions: ["view_workspace", "import_records", "edit_receipts", "submit_changes", "approve_changes", "reject_changes", "mark_reviewed", "promote_records", "export_public_brief", "export_regional_packet", "export_canonical", "restore_session", "export_release_manifest"], publicBoundary }
};

const starterRecords: LedgerRecord[] = [
  { id: "dcl-demo-ashburn-va", name: "Northern Virginia Public Atlas Cluster", operator: "Multiple / unknown", status: "operating", state: "VA", county: "Loudoun County", city: "Ashburn", precision: "city_level", capacityMW: 0, lifecycle: "local_working", confidenceScore: 72, reviewWarnings: ["Demo record; replace with public-source imports before promotion."], receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "City-level demo row for UI testing only.", confidence: "low" }], notes: [] },
  { id: "dcl-demo-phoenix-az", name: "Phoenix Public Review Candidate", operator: "Unknown", status: "planned", state: "AZ", county: "Maricopa County", city: "Phoenix", precision: "county_level", capacityMW: 0, lifecycle: "raw_import", confidenceScore: 61, reviewWarnings: ["Needs a second public source.", "Needs public URL."], receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "County-level placeholder for workflow testing.", confidence: "low" }], notes: [] },
  { id: "dcl-demo-des-moines-ia", name: "Midwest Utility Filing Candidate", operator: "Unknown", status: "approved", state: "IA", county: "Polk County", city: "Des Moines", precision: "county_level", capacityMW: 120, lifecycle: "raw_import", confidenceScore: 54, reviewWarnings: ["Needs permit source.", "Needs utility source."], receipts: [{ sourceName: "Demo seed", sourceType: "review", retrievedAt: "2026-06-13T00:00:00.000Z", claim: "Demonstrates a low-confidence review queue item.", confidence: "low" }], notes: [] }
];
const sampleCsv = `id,name,operator,status,state,county,city,capacity_mw,confidence,source,source_type,source_url,source_claim,retrieved_at
dcl-public-review-001,Sample Public Atlas Candidate,Unknown,operating,VA,Loudoun County,Ashburn,0,72,Example public dataset,public_dataset,https://example.org/public-dataset,"Public dataset row for review workflow testing.",2026-06-13
dcl-public-review-002,Sample Permit Review Candidate,Unknown,approved,IA,Polk County,Des Moines,120,66,Example county permit,permit,https://example.org/permit,"Permit mentions a proposed facility; MW claim needs a second source.",2026-06-13`;

const nowIso = () => new Date().toISOString();
const todayInputDate = () => new Date().toISOString().slice(0, 10);
function digest(payload: unknown) { const text = JSON.stringify(payload); let hash = 2166136261; for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24); } return `dcl-${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function safeIso(value: string | undefined, fallback = nowIso()) { if (!value) return fallback; const parsed = new Date(value); return parsed.toString() === "Invalid Date" ? fallback : parsed.toISOString(); }
function daysOld(dateText: string) { const parsed = new Date(dateText); if (parsed.toString() === "Invalid Date") return null; return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 86_400_000)); }
function confidenceLabel(score: number): Confidence { if (score >= 80) return "high"; if (score >= 55) return "medium"; return "low"; }
function qualityBand(score: number): QualityBand { if (score >= 80) return "strong"; if (score >= 65) return "moderate"; if (score >= 45) return "weak"; return "blocked"; }
function clampScore(value: string | number) { return Math.max(0, Math.min(100, Number(value) || 0)); }
function parseNumber(value: string) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; }
function normalizeReviewer(value: string) { return value.trim().toLowerCase().replace(/\s+/g, " "); }
function roleCan(role: ReviewerRole, permission: RolePermission) { return roleProfiles[role].permissions.includes(permission); }
function roleGate(action: string, permission: RolePermission, role: ReviewerRole, reviewer: string, detail: string): RoleGateSnapshot {
  const allowed = roleCan(role, permission);
  return { action, permission, allowed, activeRole: role, reviewer, detail, digest: digest({ action, permission, allowed, role, reviewer, detail }) };
}
function twoPersonGateFor(request: ChangeApprovalRequest, action: "approve_change" | "reject_change", gate: RoleGateSnapshot, decider: string, deciderRole: ReviewerRole): TwoPersonGateSnapshot {
  const differentReviewer = normalizeReviewer(request.requestedBy) !== normalizeReviewer(decider);
  const differentRole = request.requestedRole !== deciderRole;
  const allowed = gate.allowed && differentReviewer && differentRole;
  const detail = allowed ? "Two-person rule passed: submitter and decision reviewer/role are separated." : [gate.allowed ? "" : "Decision role lacks permission.", differentReviewer ? "" : "Decision reviewer matches submitter.", differentRole ? "" : "Decision role matches submitter role."].filter(Boolean).join(" ");
  return { action, allowed, submitter: request.requestedBy, submitterRole: request.requestedRole, decider, deciderRole, differentReviewer, differentRole, roleAllowed: gate.allowed, detail, digest: digest({ request: request.approvalId, action, allowed, differentReviewer, differentRole, decider, deciderRole }) };
}
function downloadJson(filename: string, payload: unknown) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
function makeEmptyReceiptDraft(): ReceiptDraft { return { sourceName: "", sourceType: "public_dataset", sourceUrl: "", retrievedAt: todayInputDate(), claim: "", confidence: "medium" }; }
function splitCsvLine(line: string) { const values: string[] = []; let current = ""; let inQuotes = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; const next = line[index + 1]; if (char === "\"" && inQuotes && next === "\"") { current += "\""; index += 1; } else if (char === "\"") inQuotes = !inQuotes; else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; } else current += char; } values.push(current.trim()); return values; }
function readCell(row: Record<string, string>, ...keys: string[]) { for (const key of keys) { const value = row[key]?.trim(); if (value) return value; } return ""; }
function normalizeStatus(value: string): Status { const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as Status; return validStatuses.includes(normalized) ? normalized : "unknown"; }
function normalizeSourceType(value: string): SourceType { const normalized = value.toLowerCase().trim().replace(/\s+/g, "_") as SourceType; return validSourceTypes.includes(normalized) ? normalized : "other"; }
function scoreRecord(record: LedgerRecord): SourceQualityReport {
  const receiptCount = record.receipts.length;
  const sourceTypeCount = new Set(record.receipts.map((receipt) => receipt.sourceType)).size;
  const publicLinks = record.receipts.filter((receipt) => Boolean(receipt.sourceUrl)).length;
  const publicLinkCoverage = receiptCount ? Math.round((publicLinks / receiptCount) * 100) : 0;
  const receiptAges = record.receipts.map((receipt) => daysOld(receipt.retrievedAt)).filter((age): age is number => age !== null);
  const newestReceiptDaysOld = receiptAges.length ? Math.min(...receiptAges) : null;
  const highImpactClaimCoverage = record.capacityMW && record.capacityMW > 0 ? receiptCount >= 2 && publicLinks >= 1 ? "covered" : "needs_second_source" : "not_applicable";
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
  return { recordId: record.id, score: finalScore, band: qualityBand(finalScore), receiptCount, sourceTypeCount, publicLinkCoverage, newestReceiptDaysOld, highImpactClaimCoverage, strengths, gaps, digest: digest({ recordId: record.id, finalScore, receiptCount, publicLinkCoverage, gaps }) };
}
function canonicalBlockers(record: LedgerRecord, report = scoreRecord(record)) { const blockers: string[] = []; if (record.lifecycle !== "promoted_public") blockers.push("not promoted_public"); if (record.receipts.length === 0) blockers.push("missing receipt"); if (record.confidenceScore < 70) blockers.push("confidence below 70"); if (record.precision === "unknown") blockers.push("unknown location precision"); if (record.reviewWarnings.length > 0) blockers.push("review warnings remain"); if (report.score < 65) blockers.push("source quality below 65"); return blockers; }
function buildImportPreview(text: string, origin: string, existing: LedgerRecord[]): ImportPreview {
  const createdAt = nowIso();
  const batchId = digest({ text, origin, createdAt });
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0] ? splitCsvLine(lines[0]).map((h) => h.toLowerCase()) : [];
  const warnings: ImportWarning[] = headers.length ? [] : [{ rowNumber: 1, level: "blocking", message: "CSV text is empty or missing headers." }];
  const existingIds = new Set(existing.map((record) => record.id));
  const rows = lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    values.forEach((value, valueIndex) => { row[headers[valueIndex]] = value; });
    const rowNumber = index + 2;
    const rowWarnings: ImportWarning[] = [];
    const name = readCell(row, "name") || "Unnamed public record";
    const state = readCell(row, "state", "state_abb") || "UNKNOWN";
    const id = readCell(row, "id") || digest({ row, rowNumber, batchId });
    const sourceUrl = readCell(row, "source_url", "url") || undefined;
    const confidenceScore = clampScore(readCell(row, "confidence", "confidence_score") || 50);
    const capacityMW = parseNumber(readCell(row, "capacity_mw", "power_mw", "mw"));
    if (existingIds.has(id)) rowWarnings.push({ rowNumber, level: "blocking", field: "id", message: `Record id ${id} already exists.` });
    if (!state || state === "UNKNOWN") rowWarnings.push({ rowNumber, level: "blocking", field: "state", message: "Missing state/state_abb." });
    if (!sourceUrl) rowWarnings.push({ rowNumber, level: "info", field: "source_url", message: "No public source URL supplied." });
    if (capacityMW && capacityMW > 0) rowWarnings.push({ rowNumber, level: "warning", field: "capacity_mw", message: "MW/capacity is high-impact and needs a second source." });
    const record: LedgerRecord = { id, name, operator: readCell(row, "operator", "owner") || "Unknown", status: normalizeStatus(readCell(row, "status")), state, county: readCell(row, "county") || "Unknown county", city: readCell(row, "city") || undefined, precision: readCell(row, "city") ? "city_level" : readCell(row, "county") ? "county_level" : "state_level", capacityMW, lifecycle: "raw_import", confidenceScore, reviewWarnings: ["Imported row needs human review before promotion.", ...rowWarnings.filter((warning) => warning.level !== "info").map((warning) => warning.message)], receipts: [{ sourceName: readCell(row, "source", "source_name") || "CSV import", sourceType: normalizeSourceType(readCell(row, "source_type")), sourceUrl, retrievedAt: safeIso(readCell(row, "retrieved_at", "retrieved") || createdAt), claim: readCell(row, "source_claim", "claim") || `Imported row for ${name}.`, confidence: confidenceLabel(confidenceScore), batchId }], notes: [`Imported through batch ${batchId} from ${origin}.`], importBatchId: batchId };
    return { rowNumber, record, warnings: rowWarnings };
  });
  return { batchId, createdAt, origin, rows, warnings, digest: digest({ batchId, rows, warnings }) };
}
function buildRegionalSummaries(records: LedgerRecord[], reports: SourceQualityReport[], mode: RegionMode): RegionalSummary[] {
  const reportMap = new Map(reports.map((report) => [report.recordId, report]));
  const groups = new Map<string, LedgerRecord[]>();
  records.forEach((record) => { const key = mode === "state" ? record.state : `${record.state}::${record.county}`; groups.set(key, [...(groups.get(key) || []), record]); });
  return Array.from(groups.entries()).map(([key, groupRecords]) => {
    const first = groupRecords[0];
    const regionReports = groupRecords.map((record) => reportMap.get(record.id) || scoreRecord(record));
    const qualityBands: Record<QualityBand, number> = { strong: 0, moderate: 0, weak: 0, blocked: 0 };
    regionReports.forEach((report) => { qualityBands[report.band] += 1; });
    const averageQuality = Math.round(regionReports.reduce((sum, report) => sum + report.score, 0) / Math.max(1, regionReports.length));
    const canonical = groupRecords.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length === 0).length;
    const reviewGaps = Array.from(new Set([...regionReports.flatMap((report) => report.gaps), ...groupRecords.flatMap((record) => record.reviewWarnings)])).slice(0, 8);
    const label = mode === "state" ? first.state : `${first.county}, ${first.state}`;
    return { id: key, mode, label, state: first.state, county: mode === "county" ? first.county : undefined, records: groupRecords.length, canonical, needsReview: groupRecords.length - canonical, receipts: groupRecords.reduce((sum, record) => sum + record.receipts.length, 0), averageQuality, qualityBands, reviewGaps, digest: digest({ key, mode, averageQuality, qualityBands, reviewGaps }) };
  });
}
function recordsForRegion(region: RegionalSummary | undefined, records: LedgerRecord[]) { if (!region) return []; return records.filter((record) => region.mode === "state" ? record.state === region.state : record.state === region.state && record.county === region.county); }
function makeChangeDraft(record: LedgerRecord): ChangeDraft { return { name: record.name, operator: record.operator, status: record.status, lifecycle: record.lifecycle, county: record.county, city: record.city || "", confidenceScore: String(record.confidenceScore), reviewWarnings: record.reviewWarnings.join("\n") }; }
function recordFromChangeDraft(record: LedgerRecord, draft: ChangeDraft): LedgerRecord { return { ...record, name: draft.name.trim() || record.name, operator: draft.operator.trim() || "Unknown", status: draft.status, lifecycle: draft.lifecycle, county: draft.county.trim() || record.county, city: draft.city.trim() || undefined, confidenceScore: clampScore(draft.confidenceScore), reviewWarnings: draft.reviewWarnings.split(/\n/).map((item) => item.trim()).filter(Boolean) }; }
function buildChangeDeltas(before: LedgerRecord, draft: ChangeDraft): ChangeDelta[] { const beforeDraft = makeChangeDraft(before); return (Object.keys(beforeDraft) as Array<keyof ChangeDraft>).flatMap((field) => { const beforeValue = String(beforeDraft[field]); const afterValue = String(draft[field]); if (beforeValue === afterValue) return []; const impact: ChangeDelta["impact"] = ["county", "city", "lifecycle"].includes(field) ? "high" : ["status", "confidenceScore", "reviewWarnings"].includes(field) ? "medium" : "low"; return [{ field, before: beforeValue || "—", after: afterValue || "—", impact }]; }); }
function makeChangeReceiptFromApproval(request: ChangeApprovalRequest, reviewer: string, role: ReviewerRole, note: string, gate: RoleGateSnapshot, twoPersonGate: TwoPersonGateSnapshot): ChangeReceipt { const changedAt = nowIso(); const changeId = digest({ approvalId: request.approvalId, changedAt, reviewer, role, note }); return { changeId, approvalId: request.approvalId, recordId: request.recordId, recordName: request.recordName, changedAt, reviewer: reviewer.trim() || "Approval reviewer", reviewerRole: role, reason: `${request.reason} | Approval note: ${note.trim() || "Approved without additional note."}`, deltas: request.deltas, beforeQuality: request.beforeQuality, afterQuality: request.afterQuality, canonicalBefore: request.canonicalBefore, canonicalAfter: request.canonicalAfter, roleGate: gate, twoPersonGate, digest: digest({ changeId, gate, twoPersonGate, deltas: request.deltas }) }; }
function buildRecordBrief(record: LedgerRecord, report: SourceQualityReport, gate: RoleGateSnapshot): PublicBrief { const payload = { schema: "DataCenterLedger.PublicBrief.v2.6", generatedAt: nowIso(), appVersion: APP_VERSION, scope: "record" as const, title: `Public review brief: ${record.name}`, summary: `${record.name} is a public-data review record. Review receipts and unresolved gaps before use.`, reviewOnlyNotice, boundary: publicBoundary, keyClaims: [`${record.name} is tracked as ${record.status} in ${record.county}, ${record.state}.`, `Current source quality: ${report.score} (${report.band}).`, `Lifecycle: ${record.lifecycle}.`], sourceReceipts: record.receipts, unresolvedGaps: Array.from(new Set([...record.reviewWarnings, ...report.gaps])), roleGate: gate, digest: "pending" }; return { ...payload, digest: digest(payload) }; }
function buildRegionBrief(region: RegionalSummary, regionRecords: LedgerRecord[], gate: RoleGateSnapshot): PublicBrief { const payload = { schema: "DataCenterLedger.PublicBrief.v2.6", generatedAt: nowIso(), appVersion: APP_VERSION, scope: "region" as const, title: `Map-safe regional brief: ${region.label}`, summary: `${region.label} contains ${region.records} public review record(s), ${region.canonical} canonical-ready record(s), and ${region.needsReview} needing review.`, reviewOnlyNotice, boundary: publicBoundary, keyClaims: [`Average regional source quality: ${region.averageQuality}.`, "This is a map-safe regional summary, not a facility locator."], sourceReceipts: regionRecords.flatMap((record) => record.receipts).slice(0, 12), unresolvedGaps: region.reviewGaps, roleGate: gate, digest: "pending" }; return { ...payload, digest: digest(payload) }; }
function buildAuditTimeline(record: LedgerRecord, approvals: ChangeApprovalRequest[], changes: ChangeReceipt[], promotions: PromotionReceipt[]): PromotionAuditTimeline {
  const events: AuditEvent[] = [
    ...record.receipts.map((receipt) => ({ id: receipt.receiptId || digest(receipt), kind: "receipt", title: `Receipt: ${receipt.sourceName}`, status: receipt.confidence, detail: receipt.claim, digest: digest(receipt) })),
    ...approvals.filter((item) => item.recordId === record.id).map((item) => ({ id: item.approvalId, kind: "approval", title: `Change approval ${item.status}`, status: item.status, detail: `${item.deltas.length} field delta(s). ${item.decisionNote || item.reason}`, digest: item.digest })),
    ...changes.filter((item) => item.recordId === record.id).map((item) => ({ id: item.changeId, kind: "change", title: "Approved change applied", status: item.twoPersonGate.allowed ? "two-person passed" : "blocked", detail: item.reason, digest: item.digest })),
    ...promotions.filter((item) => item.recordId === record.id).map((item) => ({ id: item.promotionId, kind: "promotion", title: "Promoted with receipt", status: item.reviewerRole, detail: item.reason, digest: item.digest }))
  ];
  const summary = events.reduce<Record<string, number>>((acc, event) => ({ ...acc, [event.kind]: (acc[event.kind] || 0) + 1 }), {});
  const latestEventAt = events.length ? nowIso() : null;
  const payload = { schema: "DataCenterLedger.PromotionAuditTimeline.v2.6", generatedAt: nowIso(), appVersion: APP_VERSION, recordId: record.id, recordName: record.name, events, summary, latestEventAt, digest: "pending" };
  return { ...payload, digest: digest(payload) };
}
function buildReadiness(records: LedgerRecord[], reports: SourceQualityReport[], approvals: ChangeApprovalRequest[], publicBriefs: PublicBrief[], promotions: PromotionReceipt[], changes: ChangeReceipt[], manifestGate: RoleGateSnapshot): ReleaseReadiness {
  const canonical = records.filter((record) => canonicalBlockers(record, reports.find((report) => report.recordId === record.id) || scoreRecord(record)).length === 0);
  const pendingApprovals = approvals.filter((item) => item.status === "pending").length;
  const rejectedApprovals = approvals.filter((item) => item.status === "rejected").length;
  const averageSourceQuality = Math.round(reports.reduce((sum, report) => sum + report.score, 0) / Math.max(1, reports.length));
  const blockers = [manifestGate.allowed ? "" : "active role cannot export release manifest", pendingApprovals ? `${pendingApprovals} pending approval(s)` : "", canonical.length === 0 ? "no canonical records in release" : ""].filter(Boolean);
  const warnings = [rejectedApprovals ? `${rejectedApprovals} rejected approval(s) retained for audit` : "", averageSourceQuality < 65 ? "average source quality below 65" : "", publicBriefs.length === 0 ? "no public briefs included" : ""].filter(Boolean);
  return { ready: blockers.length === 0, blockers, warnings, canonicalCount: canonical.length, pendingApprovals, rejectedApprovals, publicBriefCount: publicBriefs.length, promotionReceiptCount: promotions.length, changeReceiptCount: changes.length, averageSourceQuality };
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
function GateBadge({ gate }: { gate: RoleGateSnapshot }) { return <span className={`role-gate ${gate.allowed ? "allowed" : "blocked"}`}>{gate.allowed ? "Role passed" : "Role blocked"}</span>; }
function TwoPersonBadge({ gate }: { gate: TwoPersonGateSnapshot }) { return <span className={`two-person-badge ${gate.allowed ? "allowed" : "blocked"}`}>{gate.allowed ? "Two-person passed" : "Two-person blocked"}</span>; }
function Chip({ children }: { children: React.ReactNode }) { return <span className="permission-chip">{children}</span>; }

export default function App() {
  const [records, setRecords] = useState<LedgerRecord[]>(starterRecords);
  const [selectedId, setSelectedId] = useState(starterRecords[0].id);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [mode, setMode] = useState<"all" | "canonical" | "review">("all");
  const [activeRole, setActiveRole] = useState<ReviewerRole>("data_reviewer");
  const [reviewerName, setReviewerName] = useState("Local reviewer A");
  const [releaseName, setReleaseName] = useState("Local governance release");
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
  const [manualTaskText, setManualTaskText] = useState("");
  const [promotionReason, setPromotionReason] = useState("");
  const [promotionHistory, setPromotionHistory] = useState<PromotionReceipt[]>([]);
  const [changeDraft, setChangeDraft] = useState<ChangeDraft>(() => makeChangeDraft(starterRecords[0]));
  const [changeReason, setChangeReason] = useState("");
  const [changeHistory, setChangeHistory] = useState<ChangeReceipt[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<ChangeApprovalRequest[]>([]);
  const [approvalDecisionNote, setApprovalDecisionNote] = useState("");

  const roleProfile = roleProfiles[activeRole];
  const selected = records.find((record) => record.id === selectedId) || records[0] || starterRecords[0];
  const reports = useMemo(() => records.map(scoreRecord), [records]);
  const reportMap = useMemo(() => new Map(reports.map((report) => [report.recordId, report])), [reports]);
  const selectedReport = reportMap.get(selected.id) || scoreRecord(selected);
  const states = useMemo(() => Array.from(new Set(records.map((record) => record.state))).sort(), [records]);
  const canonicalRecords = records.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length === 0);
  const reviewRecords = records.filter((record) => canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record)).length > 0);
  const regionalSummaries = useMemo(() => buildRegionalSummaries(records, reports, regionMode), [records, reports, regionMode]);
  const selectedRegion = regionalSummaries.find((region) => region.id === selectedRegionId) || regionalSummaries[0];
  const selectedRegionRecords = recordsForRegion(selectedRegion, records);

  const importGate = roleGate("Import records", "import_records", activeRole, reviewerName, "Importing rows changes the local workspace.");
  const receiptGate = roleGate("Add source receipt", "edit_receipts", activeRole, reviewerName, "Adding receipts affects source quality.");
  const submitChangeGate = roleGate("Submit change for approval", "submit_changes", activeRole, reviewerName, "Proposed changes must be queued first.");
  const approvalGate = roleGate("Approve change", "approve_changes", activeRole, reviewerName, "Approval applies a pending local change.");
  const rejectGate = roleGate("Reject change", "reject_changes", activeRole, reviewerName, "Rejection records a decision and does not mutate the record.");
  const promotionGate = roleGate("Promote canonical record", "promote_records", activeRole, reviewerName, "Promotion creates a public/canonical local receipt.");
  const publicBriefGate = roleGate("Export public brief", "export_public_brief", activeRole, reviewerName, "Public briefs are public-facing review aids.");
  const regionalGate = roleGate("Export regional evidence packet", "export_regional_packet", activeRole, reviewerName, "Regional packets remain map-safe and public-data only.");
  const canonicalExportGate = roleGate("Export canonical registry", "export_canonical", activeRole, reviewerName, "Canonical export is public-facing and role-gated.");
  const restoreGate = roleGate("Restore local review session", "restore_session", activeRole, reviewerName, "Session restore replaces the local workspace state.");
  const releaseManifestGate = roleGate("Export governance release manifest", "export_release_manifest", activeRole, reviewerName, "Release manifest bundles public-facing governance evidence.");

  const importWarnings = importPreview ? [...importPreview.warnings, ...importPreview.rows.flatMap((row) => row.warnings)] : [];
  const hasBlockingImport = importWarnings.some((warning) => warning.level === "blocking");
  const proposedRecord = recordFromChangeDraft(selected, changeDraft);
  const proposedReport = scoreRecord(proposedRecord);
  const changeDeltas = buildChangeDeltas(selected, changeDraft);
  const changeReasonReady = changeReason.trim().length >= 12;
  const pendingApprovals = approvalQueue.filter((item) => item.status === "pending");
  const hasPendingApprovalForSelected = pendingApprovals.some((item) => item.recordId === selected.id);
  const canSubmitApproval = changeDeltas.length > 0 && changeReasonReady && !hasPendingApprovalForSelected && submitChangeGate.allowed;

  const tasks = useMemo(() => {
    const generated = records.flatMap((record) => {
      const report = reportMap.get(record.id) || scoreRecord(record);
      const output: ReviewTask[] = [];
      const add = (id: string, title: string, priority: "low" | "medium" | "high", detail: string) => output.push({ id: `${id}-${record.id}`, recordId: record.id, regionId: `${record.state}::${record.county}`, title, status: taskStatusOverrides[`${id}-${record.id}`] || "open", priority, detail, createdAt: "generated", source: "generated" });
      record.reviewWarnings.forEach((warning, index) => add(`warning-${index}`, `Resolve warning: ${warning}`, "high", warning));
      if (report.publicLinkCoverage < 80) add("public-url", "Add public source URL coverage", "high", "Attach public links to receipts where available.");
      if (report.highImpactClaimCoverage === "needs_second_source") add("second-source", "Find second source for MW claim", "high", "MW/capacity claims need stronger corroboration before promotion.");
      if (report.score < 65) add("quality", "Improve source quality score", "medium", report.gaps.join("; "));
      if (canonicalBlockers(record, report).length === 0) add("promotion", "Ready for promotion review", "low", "Record currently passes canonical gate.");
      return output;
    });
    return [...manualTasks, ...generated];
  }, [records, reportMap, taskStatusOverrides, manualTasks]);

  const selectedBrief = buildRecordBrief(selected, selectedReport, publicBriefGate);
  const selectedRegionBrief = selectedRegion ? buildRegionBrief(selectedRegion, selectedRegionRecords, publicBriefGate) : null;
  const selectedTimeline = buildAuditTimeline(selected, approvalQueue, changeHistory, promotionHistory);
  const manifestReadiness = buildReadiness(records, reports, approvalQueue, [selectedBrief, ...(selectedRegionBrief ? [selectedRegionBrief] : [])], promotionHistory, changeHistory, releaseManifestGate);
  const releaseManifest: GovernanceReleaseManifest = {
    schema: "DataCenterLedger.GovernanceReleaseManifest.v2.6",
    generatedAt: nowIso(),
    appVersion: APP_VERSION,
    releaseName,
    releaseScope: "local_workspace",
    reviewerName,
    activeRole,
    roleProfile,
    roleGate: releaseManifestGate,
    twoPersonPolicy,
    safetyBoundary: publicBoundary,
    reviewOnlyNotice,
    readiness: manifestReadiness,
    records: { total: records.length, canonical: canonicalRecords, needsReview: reviewRecords },
    sourceQuality: reports,
    regionalSummaries,
    publicBriefs: [selectedBrief, ...(selectedRegionBrief ? [selectedRegionBrief] : [])],
    promotionReceipts: promotionHistory,
    changeReceipts: changeHistory,
    approvalQueue,
    auditTimelines: [selectedTimeline],
    manifestDigest: digest({ APP_VERSION, releaseName, reviewerName, activeRole, records, reports, regionalSummaries, approvalQueue, promotionHistory, changeHistory, publicBoundary, twoPersonPolicy })
  };

  const visibleRecords = records.filter((record) => {
    const haystack = `${record.name} ${record.operator} ${record.county} ${record.city || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || record.state === stateFilter;
    const blockers = canonicalBlockers(record, reportMap.get(record.id) || scoreRecord(record));
    const matchesMode = mode === "all" || (mode === "canonical" ? blockers.length === 0 : blockers.length > 0);
    return matchesQuery && matchesState && matchesMode;
  });

  function selectRecord(recordId: string) { const record = records.find((item) => item.id === recordId); setSelectedId(recordId); if (record) setChangeDraft(makeChangeDraft(record)); }
  function loadSampleImport() { setImportText(sampleCsv); setImportPreview(buildImportPreview(sampleCsv, "sample CSV", records)); }
  async function loadCsvFile(file: File) { const text = await file.text(); setImportText(text); setImportPreview(buildImportPreview(text, file.name, records)); }
  function previewImportFromText(origin = "pasted CSV") { setImportPreview(buildImportPreview(importText, origin, records)); }
  function commitImportPreview() { if (!importPreview || hasBlockingImport || !importGate.allowed) return; const importedRecords = importPreview.rows.map((row) => row.record); setRecords((items) => [...items, ...importedRecords]); setImportHistory((items) => [{ batchId: importPreview.batchId, committedAt: nowIso(), origin: importPreview.origin, rowsCommitted: importedRecords.length, warningCount: importWarnings.length, digest: importPreview.digest }, ...items]); if (importedRecords[0]) selectRecord(importedRecords[0].id); setImportPreview(null); setImportText(""); }
  function addReceiptToSelected() { if (!receiptGate.allowed || !receiptDraft.sourceName.trim() || !receiptDraft.claim.trim()) return; const addedAt = nowIso(); const receipt: Receipt = { receiptId: digest({ selected: selected.id, receiptDraft, addedAt }), sourceName: receiptDraft.sourceName.trim(), sourceType: receiptDraft.sourceType, sourceUrl: receiptDraft.sourceUrl.trim() || undefined, retrievedAt: safeIso(receiptDraft.retrievedAt, addedAt), claim: receiptDraft.claim.trim(), confidence: receiptDraft.confidence }; const historyItem: ReceiptEditHistoryItem = { receiptId: receipt.receiptId || digest(receipt), recordId: selected.id, recordName: selected.name, addedAt, sourceName: receipt.sourceName, sourceType: receipt.sourceType, confidence: receipt.confidence, resolvedWarnings: [], remainingWarnings: selected.reviewWarnings.length, reviewer: reviewerName, reviewerRole: activeRole, digest: digest({ receipt, selected: selected.id, reviewerName, activeRole }) }; setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, receipts: [...item.receipts, receipt], notes: [...item.notes, `Receipt ${historyItem.receiptId} added by ${reviewerName} (${activeRole}).`] } : item)); setReceiptHistory((items) => [historyItem, ...items]); setReceiptDraft(makeEmptyReceiptDraft()); }
  function addManualTask() { if (!manualTaskText.trim()) return; const createdAt = nowIso(); const id = digest({ manualTaskText, selected: selected.id, createdAt }); setManualTasks((items) => [{ id, recordId: selected.id, regionId: `${selected.state}::${selected.county}`, title: manualTaskText.trim(), status: "open", priority: "medium", detail: "Manual follow-up task created in local review session.", createdAt, source: "manual" }, ...items]); setManualTaskText(""); }
  function updateTaskStatus(taskId: string, status: TaskStatus) { setTaskStatusOverrides((items) => ({ ...items, [taskId]: status })); }
  function markSelectedReviewed() { const gate = roleGate("Mark record reviewed", "mark_reviewed", activeRole, reviewerName, "Review marker is local and does not prove truth."); if (!gate.allowed) return; setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, lifecycle: "reviewed", notes: [...item.notes, `Marked reviewed by ${reviewerName} (${activeRole}).`] } : item)); }
  function promoteSelected() { if (!promotionGate.allowed || promotionReason.trim().length < 12) return; const promotedAt = nowIso(); const receipt: PromotionReceipt = { promotionId: digest({ record: selected.id, promotedAt, promotionReason, reviewerName, activeRole }), recordId: selected.id, recordName: selected.name, promotedAt, reviewer: reviewerName, reviewerRole: activeRole, reason: promotionReason.trim(), sourceQuality: selectedReport, priorLifecycle: selected.lifecycle, roleGate: promotionGate, digest: digest({ selected, promotionReason, reviewerName, activeRole, promotionGate }) }; setPromotionHistory((items) => [receipt, ...items]); setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, lifecycle: "promoted_public", notes: [...item.notes, `Promoted with receipt ${receipt.promotionId} by ${reviewerName} (${activeRole}).`] } : item)); }
  function submitChangeForApproval() { if (!canSubmitApproval) return; const requestedAt = nowIso(); const request: ChangeApprovalRequest = { approvalId: digest({ selected: selected.id, requestedAt, changeDeltas, changeReason, reviewerName, activeRole }), recordId: selected.id, recordName: selected.name, requestedAt, requestedBy: reviewerName, requestedRole: activeRole, reason: changeReason.trim(), status: "pending", deltas: changeDeltas, recordBefore: selected, recordAfter: proposedRecord, beforeQuality: selectedReport, afterQuality: proposedReport, canonicalBefore: canonicalBlockers(selected, selectedReport), canonicalAfter: canonicalBlockers(proposedRecord, proposedReport), submitGate: submitChangeGate, twoPersonPolicy, digest: digest({ selected, proposedRecord, changeDeltas, changeReason, submitChangeGate, twoPersonPolicy }) }; setApprovalQueue((items) => [request, ...items]); setChangeReason(""); }
  function approveChangeRequest(request: ChangeApprovalRequest) { const decisionGate = roleGate("Approve change", "approve_changes", activeRole, reviewerName, "Approval applies a pending local change."); const twoPersonGate = twoPersonGateFor(request, "approve_change", decisionGate, reviewerName, activeRole); if (!twoPersonGate.allowed) return; const decidedAt = nowIso(); const changeReceipt = makeChangeReceiptFromApproval(request, reviewerName, activeRole, approvalDecisionNote, decisionGate, twoPersonGate); const updatedRequest: ChangeApprovalRequest = { ...request, status: "approved", decisionReviewer: reviewerName, decisionRole: activeRole, decisionNote: approvalDecisionNote.trim() || "Approved.", decisionGate, twoPersonGate, decidedAt, appliedChangeId: changeReceipt.changeId, digest: digest({ request, decisionGate, twoPersonGate, decidedAt, changeReceipt }) }; setRecords((items) => items.map((item) => item.id === request.recordId ? { ...request.recordAfter, notes: [...request.recordAfter.notes, `Approved change ${changeReceipt.changeId} applied by ${reviewerName} (${activeRole}) after two-person gate.`] } : item)); setApprovalQueue((items) => items.map((item) => item.approvalId === request.approvalId ? updatedRequest : item)); setChangeHistory((items) => [changeReceipt, ...items]); setApprovalDecisionNote(""); if (request.recordId === selected.id) setChangeDraft(makeChangeDraft(request.recordAfter)); }
  function rejectChangeRequest(request: ChangeApprovalRequest) { const decisionGate = roleGate("Reject change", "reject_changes", activeRole, reviewerName, "Rejection records a decision but does not mutate the record."); const twoPersonGate = twoPersonGateFor(request, "reject_change", decisionGate, reviewerName, activeRole); if (!twoPersonGate.allowed) return; const decidedAt = nowIso(); const updatedRequest: ChangeApprovalRequest = { ...request, status: "rejected", decisionReviewer: reviewerName, decisionRole: activeRole, decisionNote: approvalDecisionNote.trim() || "Rejected without additional note.", decisionGate, twoPersonGate, decidedAt, digest: digest({ request, decisionGate, twoPersonGate, decidedAt, decisionNote: approvalDecisionNote }) }; setApprovalQueue((items) => items.map((item) => item.approvalId === request.approvalId ? updatedRequest : item)); setApprovalDecisionNote(""); }
  function buildSession(): LocalReviewSession { const payload: LocalReviewSession = { schema: "DataCenterLedger.LocalReviewSession.v2.6", generatedAt: nowIso(), appVersion: APP_VERSION, releaseName, activeRole, reviewerName, records, receiptHistory, importHistory, promotionHistory, changeHistory, approvalQueue, taskStatusOverrides, manualTasks, digest: "pending" }; return { ...payload, digest: digest(payload) }; }
  function restoreSessionObject(session: Partial<LocalReviewSession>) { if (!restoreGate.allowed || !Array.isArray(session.records)) return; setRecords(session.records); setReceiptHistory(session.receiptHistory || []); setImportHistory(session.importHistory || []); setPromotionHistory(session.promotionHistory || []); setChangeHistory(session.changeHistory || []); setApprovalQueue(session.approvalQueue || []); setTaskStatusOverrides(session.taskStatusOverrides || {}); setManualTasks(session.manualTasks || []); if (session.activeRole && roleProfiles[session.activeRole]) setActiveRole(session.activeRole); if (session.reviewerName) setReviewerName(session.reviewerName); if (session.releaseName) setReleaseName(session.releaseName); }
  function restorePastedSession() { try { restoreSessionObject(JSON.parse(sessionText)); setSessionText(""); } catch { alert("Could not restore session JSON."); } }
  async function restoreSessionFile(file: File) { try { restoreSessionObject(JSON.parse(await file.text())); } catch { alert("Could not restore session file."); } }

  const selectedTasks = tasks.filter((task) => task.recordId === selected.id).slice(0, 8);

  return <main className="shell">
    <section className="hero"><p className="eyebrow">DataCenterLedger Explorer · v{APP_VERSION}</p><h1>Public-data review cockpit for data center records</h1><p>{reviewOnlyNotice}</p><div className="stats"><Stat label="Records" value={records.length} /><Stat label="Canonical" value={canonicalRecords.length} /><Stat label="Needs review" value={reviewRecords.length} /><Stat label="Pending approvals" value={pendingApprovals.length} /><Stat label="Role" value={roleProfile.label} /></div></section>

    <section className="panel role-panel"><div className="panelHeader"><div><p className="eyebrow">v2.4 Role Profiles · v2.5 Two-Person Rule</p><h2>Local reviewer governance</h2><p>{roleProfile.description}</p></div><button onClick={() => downloadJson("datacenter-ledger-role-profile-v2.6.json", { schema: "DataCenterLedger.RoleProfile.v2.6", appVersion: APP_VERSION, reviewerName, activeRole, roleProfile, twoPersonPolicy, gates: { releaseManifestGate, promotionGate, approvalGate, rejectGate }, digest: digest({ reviewerName, activeRole, roleProfile, twoPersonPolicy }) })}>Export role packet</button></div><div className="role-grid"><label>Reviewer name<input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} /></label><label>Active role<select value={activeRole} onChange={(event) => setActiveRole(event.target.value as ReviewerRole)}>{Object.values(roleProfiles).map((profile) => <option key={profile.role} value={profile.role}>{profile.label}</option>)}</select></label></div><div className="permission-grid">{roleProfile.permissions.map((permission) => <Chip key={permission}>{permission}</Chip>)}</div><div className="two-person-policy"><strong>Two-person approval rule</strong>{twoPersonPolicy.map((item) => <span key={item}>{item}</span>)}</div></section>

    <section className="panel release-manifest-panel"><div className="panelHeader"><div><p className="eyebrow">v2.6 Governance Release Manifest</p><h2>Release packet builder</h2><p>Bundle canonical records, source quality, role profile, two-person policy, approvals, receipts, public briefs, audit timeline, and safety boundary into one public-safe manifest.</p></div><GateBadge gate={releaseManifestGate} /></div><div className="role-grid"><label>Release name<input value={releaseName} onChange={(event) => setReleaseName(event.target.value)} /></label><label>Readiness<input readOnly value={manifestReadiness.ready ? "ready" : "blocked"} /></label></div><div className="release-readiness"><Stat label="Canonical records" value={manifestReadiness.canonicalCount} /><Stat label="Pending approvals" value={manifestReadiness.pendingApprovals} /><Stat label="Public briefs" value={manifestReadiness.publicBriefCount} /><Stat label="Avg quality" value={manifestReadiness.averageSourceQuality} /></div>{manifestReadiness.blockers.length > 0 && <div className="manifest-blockers"><strong>Release blockers</strong>{manifestReadiness.blockers.map((blocker) => <span key={blocker}>{blocker}</span>)}</div>}{manifestReadiness.warnings.length > 0 && <div className="manifest-warnings"><strong>Release warnings</strong>{manifestReadiness.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>}<div className="buttonRow"><button disabled={!releaseManifestGate.allowed} onClick={() => downloadJson("datacenter-ledger-governance-release-manifest-v2.6.json", releaseManifest)}>Export governance release manifest</button><button onClick={() => downloadJson("datacenter-ledger-session-v2.6.json", buildSession())}>Export local session</button></div><p className="boundary-note">Manifest export is a review packet only. It preserves receipts and gates; it does not certify truth or completeness.</p></section>

    <section className="toolbar"><input placeholder="Search name/operator/county" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">All states</option>{states.map((state) => <option key={state}>{state}</option>)}</select><select value={mode} onChange={(event) => setMode(event.target.value as "all" | "canonical" | "review")}><option value="all">All records</option><option value="canonical">Canonical-ready</option><option value="review">Needs review</option></select><button onClick={() => downloadJson("datacenter-ledger-workspace-v2.6.json", { schema: "DataCenterLedger.Workspace.v2.6", appVersion: APP_VERSION, records, sourceQuality: reports, regionalSummaries, approvalQueue, promotionHistory, changeHistory, digest: digest({ records, reports, approvalQueue, promotionHistory, changeHistory }) })}>Export ledger</button><button disabled={!canonicalExportGate.allowed} onClick={() => downloadJson("datacenter-ledger-canonical-v2.6.json", { schema: "DataCenterLedger.CanonicalRegistry.v2.6", appVersion: APP_VERSION, roleGate: canonicalExportGate, records: canonicalRecords, sourceQuality: canonicalRecords.map((record) => reportMap.get(record.id) || scoreRecord(record)), promotionHistory, changeHistory, twoPersonPolicy, digest: digest({ canonicalRecords, canonicalExportGate, promotionHistory, changeHistory }) })}>Export canonical</button></section>

    <section className="grid two"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">Records</p><h2>Review queue</h2></div></div>{visibleRecords.map((record) => { const report = reportMap.get(record.id) || scoreRecord(record); const blockers = canonicalBlockers(record, report); return <button key={record.id} className={`recordRow ${selected.id === record.id ? "selected" : ""}`} onClick={() => selectRecord(record.id)}><strong>{record.name}</strong><span>{record.county}, {record.state} · {record.lifecycle}</span><span>Quality {report.score} · {blockers.length ? `${blockers.length} blocker(s)` : "canonical-ready"}</span></button>; })}</div><div className="panel"><p className="eyebrow">Source quality</p><h2>{selected.name}</h2><div className="quality-score"><strong>{selectedReport.score}</strong><span>{selectedReport.band}</span></div><p>{selected.county}, {selected.state} · {selected.precision}</p><ul>{selectedReport.gaps.slice(0, 6).map((gap) => <li key={gap}>{gap}</li>)}</ul></div></section>

    <section className="panel"><div className="panelHeader"><div><p className="eyebrow">v1.2 Import Workbench</p><h2>CSV import review</h2></div><GateBadge gate={importGate} /></div><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste normalized public CSV rows here" /><div className="buttonRow"><button onClick={() => previewImportFromText()}>Preview import</button><button onClick={loadSampleImport}>Load sample</button><label className="fileButton">Load CSV file<input type="file" accept=".csv,text/csv" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && loadCsvFile(event.target.files[0])} /></label><button disabled={!importPreview || hasBlockingImport || !importGate.allowed} onClick={commitImportPreview}>Commit import</button></div>{importPreview && <div className="mini-list"><strong>{importPreview.rows.length} row(s), {importWarnings.length} warning(s)</strong>{importWarnings.slice(0, 6).map((warning, index) => <span key={`${warning.message}-${index}`}>{warning.level}: {warning.message}</span>)}</div>}</section>

    <section className="grid two"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v1.5 Map-Safe Regional View</p><h2>Regional summaries</h2></div><select value={regionMode} onChange={(event) => setRegionMode(event.target.value as RegionMode)}><option value="state">State</option><option value="county">County</option></select></div><p className="boundary-note">Regional view is not a facility locator and does not aggregate private coordinates.</p>{regionalSummaries.map((region) => <button key={region.id} className={`recordRow ${selectedRegion?.id === region.id ? "selected" : ""}`} onClick={() => setSelectedRegionId(region.id)}><strong>{region.label}</strong><span>{region.records} record(s) · avg quality {region.averageQuality}</span><span>{region.canonical} canonical · {region.needsReview} needs review</span></button>)}<button disabled={!selectedRegion || !regionalGate.allowed} onClick={() => selectedRegion && downloadJson("regional-evidence-packet-v2.6.json", { schema: "DataCenterLedger.RegionalEvidencePacket.v2.6", appVersion: APP_VERSION, generatedAt: nowIso(), roleGate: regionalGate, region: selectedRegion, records: selectedRegionRecords, sourceQuality: selectedRegionRecords.map(scoreRecord), boundary: publicBoundary, digest: digest({ selectedRegion, selectedRegionRecords, regionalGate }) })}>Export regional packet</button></div><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v1.8 Task Board</p><h2>Selected record tasks</h2></div></div><div className="buttonRow"><input value={manualTaskText} onChange={(event) => setManualTaskText(event.target.value)} placeholder="Manual follow-up task" /><button onClick={addManualTask}>Add task</button></div>{selectedTasks.map((task) => <div key={task.id} className="task-card"><strong>{task.title}</strong><p>{task.detail}</p><select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}><option value="open">open</option><option value="in_progress">in progress</option><option value="blocked">blocked</option><option value="done">done</option><option value="dismissed">dismissed</option></select></div>)}</div></section>

    <section className="grid two"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v1.3 Receipt Editor</p><h2>Add source receipt</h2></div><GateBadge gate={receiptGate} /></div><div className="form-grid"><input placeholder="Source name" value={receiptDraft.sourceName} onChange={(event) => setReceiptDraft({ ...receiptDraft, sourceName: event.target.value })} /><select value={receiptDraft.sourceType} onChange={(event) => setReceiptDraft({ ...receiptDraft, sourceType: event.target.value as SourceType })}>{validSourceTypes.map((type) => <option key={type}>{type}</option>)}</select><input placeholder="Public source URL" value={receiptDraft.sourceUrl} onChange={(event) => setReceiptDraft({ ...receiptDraft, sourceUrl: event.target.value })} /><input type="date" value={receiptDraft.retrievedAt} onChange={(event) => setReceiptDraft({ ...receiptDraft, retrievedAt: event.target.value })} /><select value={receiptDraft.confidence} onChange={(event) => setReceiptDraft({ ...receiptDraft, confidence: event.target.value as Confidence })}><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></div><textarea placeholder="Receipt claim" value={receiptDraft.claim} onChange={(event) => setReceiptDraft({ ...receiptDraft, claim: event.target.value })} /><button disabled={!receiptGate.allowed} onClick={addReceiptToSelected}>Add receipt</button></div><div className="panel"><p className="eyebrow">Receipts</p><h2>{selected.receipts.length} receipt(s)</h2>{selected.receipts.map((receipt) => <div key={receipt.receiptId || receipt.sourceName} className="task-card"><strong>{receipt.sourceName}</strong><p>{receipt.claim}</p><span>{receipt.sourceType} · {receipt.confidence}</span></div>)}</div></section>

    <section className="grid two"><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v2.0 Canonical Review Mode</p><h2>Promotion cockpit</h2></div><GateBadge gate={promotionGate} /></div><p>Canonical blockers: {canonicalBlockers(selected, selectedReport).join(", ") || "none"}</p><textarea placeholder="Promotion reason" value={promotionReason} onChange={(event) => setPromotionReason(event.target.value)} /><div className="buttonRow"><button onClick={markSelectedReviewed}>Mark reviewed</button><button disabled={!promotionGate.allowed || promotionReason.trim().length < 12} onClick={promoteSelected}>Promote with receipt</button></div></div><div className="panel public-brief"><div className="panelHeader"><div><p className="eyebrow">v1.9 Public Brief Generator</p><h2>{selectedBrief.title}</h2></div><GateBadge gate={publicBriefGate} /></div><p>{selectedBrief.summary}</p><ul>{selectedBrief.unresolvedGaps.slice(0, 5).map((gap) => <li key={gap}>{gap}</li>)}</ul><button disabled={!publicBriefGate.allowed} onClick={() => downloadJson("public-brief-v2.6.json", selectedBrief)}>Export selected brief</button></div></section>

    <section className="grid two"><div className="panel change-review-panel"><div className="panelHeader"><div><p className="eyebrow">v2.3 Change Approval Queue</p><h2>Propose selected-record change</h2></div><GateBadge gate={submitChangeGate} /></div><div className="form-grid"><label>Name<input value={changeDraft.name} onChange={(event) => setChangeDraft({ ...changeDraft, name: event.target.value })} /></label><label>Operator<input value={changeDraft.operator} onChange={(event) => setChangeDraft({ ...changeDraft, operator: event.target.value })} /></label><label>Status<select value={changeDraft.status} onChange={(event) => setChangeDraft({ ...changeDraft, status: event.target.value as Status })}>{validStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Lifecycle<select value={changeDraft.lifecycle} onChange={(event) => setChangeDraft({ ...changeDraft, lifecycle: event.target.value as Lifecycle })}>{lifecycleOptions.map((lifecycle) => <option key={lifecycle}>{lifecycle}</option>)}</select></label><label>County<input value={changeDraft.county} onChange={(event) => setChangeDraft({ ...changeDraft, county: event.target.value })} /></label><label>City<input value={changeDraft.city} onChange={(event) => setChangeDraft({ ...changeDraft, city: event.target.value })} /></label><label>Confidence<input value={changeDraft.confidenceScore} onChange={(event) => setChangeDraft({ ...changeDraft, confidenceScore: event.target.value })} /></label></div><textarea placeholder="Review warnings, one per line" value={changeDraft.reviewWarnings} onChange={(event) => setChangeDraft({ ...changeDraft, reviewWarnings: event.target.value })} /><textarea placeholder="Change reason, at least 12 characters" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} /><p>{changeDeltas.length} field delta(s). {hasPendingApprovalForSelected ? "Pending approval already exists for selected record." : ""}</p><button disabled={!canSubmitApproval} onClick={submitChangeForApproval}>Submit change for approval</button></div><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v2.5 Two-Person Approval Rule</p><h2>Pending approvals</h2></div><button onClick={() => downloadJson("change-approval-queue-v2.6.json", { schema: "DataCenterLedger.ChangeApprovalQueue.v2.6", approvalQueue, twoPersonPolicy, digest: digest({ approvalQueue, twoPersonPolicy }) })}>Export queue</button></div><textarea placeholder="Approval/rejection note" value={approvalDecisionNote} onChange={(event) => setApprovalDecisionNote(event.target.value)} />{approvalQueue.slice(0, 8).map((request) => { const approveGate = roleGate("Approve change", "approve_changes", activeRole, reviewerName, "Approval applies a pending local change."); const rejectSnapshot = roleGate("Reject change", "reject_changes", activeRole, reviewerName, "Rejection records a decision."); const approveTwoPerson = twoPersonGateFor(request, "approve_change", approveGate, reviewerName, activeRole); const rejectTwoPerson = twoPersonGateFor(request, "reject_change", rejectSnapshot, reviewerName, activeRole); return <div key={request.approvalId} className="approval-card"><strong>{request.recordName}</strong><p>{request.status} · submitted by {request.requestedBy} ({request.requestedRole})</p><p>{request.reason}</p>{request.status === "pending" && <div className="buttonRow"><TwoPersonBadge gate={approveTwoPerson} /><button disabled={!approveTwoPerson.allowed} onClick={() => approveChangeRequest(request)}>Approve/apply</button><button disabled={!rejectTwoPerson.allowed} onClick={() => rejectChangeRequest(request)}>Reject</button></div>}</div>; })}</div></section>

    <section className="grid two"><div className="panel audit-timeline"><div className="panelHeader"><div><p className="eyebrow">v2.1 Promotion Audit Timeline</p><h2>Selected-record audit stream</h2></div><button onClick={() => downloadJson("promotion-audit-timeline-v2.6.json", selectedTimeline)}>Export timeline</button></div>{selectedTimeline.events.map((event) => <div key={event.id} className="timeline-event"><strong>{event.title}</strong><span>{event.kind} · {event.status}</span><p>{event.detail}</p></div>)}</div><div className="panel"><div className="panelHeader"><div><p className="eyebrow">v1.7 Local Review Session</p><h2>Save / restore</h2></div><GateBadge gate={restoreGate} /></div><input value={sessionName} onChange={(event) => setSessionName(event.target.value)} /><textarea placeholder="Paste session JSON" value={sessionText} onChange={(event) => setSessionText(event.target.value)} /><div className="buttonRow"><button onClick={() => downloadJson("local-review-session-v2.6.json", buildSession())}>Export session</button><button disabled={!restoreGate.allowed} onClick={restorePastedSession}>Restore pasted session</button><label className="fileButton">Restore session file<input type="file" accept="application/json,.json" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && restoreSessionFile(event.target.files[0])} /></label></div></div></section>
  </main>;
}
