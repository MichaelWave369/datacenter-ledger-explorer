export {};

const INTEGRITY_APP_VERSION = '3.1.0';
const INTEGRITY_ARCHIVE_KEY = 'datacenter-ledger.release-archive.v2.9';
const INTEGRITY_LINEAGE_KEY = 'datacenter-ledger.release-library-lineage.v3.0';

const integrityReviewOnlyNotice =
  'This integrity check is a local review aid. It flags archive and lineage consistency issues, but it does not prove source truth, certify release readiness, or authorize publication.';

const integritySafetyBoundary = [
  'Public-data only',
  'No hidden network calls',
  'No private facility discovery',
  'No security-sensitive enrichment',
  'Integrity findings are review prompts, not final determinations.'
];

type IntegrityKind = 'manifest' | 'manifest_diff' | 'signoff_packet' | 'unknown';
type IntegrityDecision = 'approve_release' | 'hold_release' | 'needs_more_review' | 'none';
type IntegritySeverity = 'blocker' | 'warning' | 'info';
type IntegrityStatus = 'clear' | 'review' | 'blocked' | 'empty';

type IntegrityEntry = {
  id: string;
  kind: IntegrityKind;
  schema: string;
  label: string;
  releaseName: string;
  appVersion: string;
  digest: string;
  decision: IntegrityDecision;
  ready: boolean | null;
  canonicalCount: number;
  pendingApprovals: number;
  blockerCount: number;
  warningCount: number;
  importedAt: string;
  payload: unknown;
};

type IntegrityLineage = {
  digest: string;
  supersedesDigest: string;
  releaseLabel: string;
  notes: string;
};

type IntegrityFinding = {
  id: string;
  severity: IntegritySeverity;
  category: string;
  digest: string;
  title: string;
  detail: string;
  recommendation: string;
};

type IntegrityReport = {
  schema: 'DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1';
  generatedAt: string;
  appVersion: string;
  summary: {
    status: IntegrityStatus;
    totalEntries: number;
    blockers: number;
    warnings: number;
    info: number;
    duplicateDigests: number;
    brokenLineageLinks: number;
    missingSignoffs: number;
    missingDiffs: number;
    unknownArtifacts: number;
  };
  findings: IntegrityFinding[];
  checkedDigests: string[];
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  reportDigest: string;
};

function requireIntegrityElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Release Library Integrity element: ${selector}`);
  return element;
}

function integrityDigest(payload: unknown) {
  const text = JSON.stringify(payload) || '';
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function integrityEscape(value: unknown) {
  return String(value ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

function parseIntegrityJson(value: string): unknown {
  try {
    return value.trim() ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeDecision(value: unknown): IntegrityDecision {
  if (value === 'approve_release' || value === 'hold_release' || value === 'needs_more_review') return value;
  return 'none';
}

function kindFromSchema(schema: string): IntegrityKind {
  if (schema.includes('ReleaseManifestDiff') || schema.includes('ManifestDiff')) return 'manifest_diff';
  if (schema.includes('ReleaseSignoffPacket') || schema.includes('SignoffPacket')) return 'signoff_packet';
  if (schema.includes('ReleaseManifest') || schema.includes('GovernanceReleaseManifest')) return 'manifest';
  return 'unknown';
}

function normalizeKind(value: unknown, schema: string): IntegrityKind {
  if (value === 'manifest' || value === 'manifest_diff' || value === 'signoff_packet') return value;
  return kindFromSchema(schema);
}

function readArray(key: string): unknown[] {
  const parsed = parseIntegrityJson(localStorage.getItem(key) || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function buildIntegrityEntries(): IntegrityEntry[] {
  return readArray(INTEGRITY_ARCHIVE_KEY).map((raw, index) => {
    const entry = asRecord(raw);
    const payload = Object.prototype.hasOwnProperty.call(entry, 'payload') ? entry.payload : raw;
    const payloadRecord = asRecord(payload);
    const schema = stringValue(entry.schema, stringValue(payloadRecord.schema, 'unknown'));
    const digest = stringValue(entry.digest, stringValue(payloadRecord.manifestDigest, stringValue(payloadRecord.diffDigest, stringValue(payloadRecord.signoffDigest, integrityDigest(payload)))));
    const releaseName = stringValue(entry.releaseName, stringValue(payloadRecord.releaseName, stringValue(payloadRecord.name, 'Unnamed release')));
    const label = stringValue(entry.label, releaseName || `Release artifact ${index + 1}`);

    return {
      id: stringValue(entry.id, `${schema}-${digest}-${index}`),
      kind: normalizeKind(entry.kind, schema),
      schema,
      label,
      releaseName,
      appVersion: stringValue(entry.appVersion, stringValue(payloadRecord.appVersion, 'unknown')),
      digest,
      decision: normalizeDecision(entry.decision),
      ready: booleanOrNull(entry.ready),
      canonicalCount: numberValue(entry.canonicalCount),
      pendingApprovals: numberValue(entry.pendingApprovals),
      blockerCount: numberValue(entry.blockerCount),
      warningCount: numberValue(entry.warningCount),
      importedAt: stringValue(entry.importedAt, stringValue(entry.createdAt, new Date().toISOString())),
      payload
    };
  });
}

function buildLineage(): IntegrityLineage[] {
  return readArray(INTEGRITY_LINEAGE_KEY).map((raw) => {
    const item = asRecord(raw);
    return {
      digest: stringValue(item.digest),
      supersedesDigest: stringValue(item.supersedesDigest),
      releaseLabel: stringValue(item.releaseLabel),
      notes: stringValue(item.notes)
    };
  });
}

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

function manifestDigestFromSignoff(entry: IntegrityEntry) {
  const payload = asRecord(entry.payload);
  const manifest = asRecord(payload.releaseManifest);
  return stringValue(manifest.manifestDigest, stringValue(manifest.digest));
}

function manifestNameFromSignoff(entry: IntegrityEntry) {
  const payload = asRecord(entry.payload);
  const manifest = asRecord(payload.releaseManifest);
  return stringValue(manifest.releaseName, entry.releaseName);
}

function candidateDigestFromDiff(entry: IntegrityEntry) {
  const payload = asRecord(entry.payload);
  const candidate = asRecord(payload.candidate);
  return stringValue(candidate.manifestDigest, stringValue(candidate.digest));
}

function candidateNameFromDiff(entry: IntegrityEntry) {
  const payload = asRecord(entry.payload);
  const candidate = asRecord(payload.candidate);
  return stringValue(candidate.releaseName, entry.releaseName);
}

function buildIntegrityReport(): IntegrityReport {
  const entries = buildIntegrityEntries();
  const lineage = buildLineage();
  const findings: IntegrityFinding[] = [];
  const digestSet = new Set(entries.map((entry) => entry.digest));
  let findingIndex = 1;

  function addFinding(severity: IntegritySeverity, category: string, digest: string, title: string, detail: string, recommendation: string) {
    findings.push({
      id: `DCL-INT-${String(findingIndex).padStart(3, '0')}`,
      severity,
      category,
      digest: digest || 'library',
      title,
      detail,
      recommendation
    });
    findingIndex += 1;
  }

  if (entries.length === 0) {
    addFinding('info', 'archive_empty', 'library', 'No archived release artifacts found', 'The local release archive is empty in this browser.', 'Add governance manifests, manifest diffs, or signoff packets before exporting a public release history.');
  }

  const byDigest = new Map<string, IntegrityEntry[]>();
  entries.forEach((entry) => {
    const group = byDigest.get(entry.digest) || [];
    group.push(entry);
    byDigest.set(entry.digest, group);
  });

  let duplicateDigests = 0;
  byDigest.forEach((group, digest) => {
    if (group.length > 1) {
      duplicateDigests += 1;
      addFinding('warning', 'duplicate_digest', digest, 'Duplicate digest appears in the release library', `${group.length} archived artifacts share digest ${digest}.`, 'Confirm this is intentional or remove duplicate archive items before using the public history export.');
    }
  });

  let brokenLineageLinks = 0;
  lineage.forEach((link) => {
    if (link.digest && !digestSet.has(link.digest)) {
      addFinding('warning', 'stale_lineage', link.digest, 'Lineage metadata points to a missing current release', `Lineage metadata exists for ${link.digest}, but that digest is not in the local archive.`, 'Remove stale lineage metadata or restore the missing archived artifact.');
    }
    if (link.digest && link.supersedesDigest && link.digest === link.supersedesDigest) {
      brokenLineageLinks += 1;
      addFinding('blocker', 'self_supersedes', link.digest, 'Release supersedes itself', `Digest ${link.digest} is configured to supersede itself.`, 'Choose an earlier release digest or clear the supersedes field.');
    }
    if (link.supersedesDigest && !digestSet.has(link.supersedesDigest)) {
      brokenLineageLinks += 1;
      addFinding('blocker', 'broken_supersedes', link.supersedesDigest, 'Supersedes link points to a missing release', `The superseded digest ${link.supersedesDigest} is not present in the local archive.`, 'Restore the earlier release artifact or update the supersedes metadata.');
    }
    if (link.digest && link.supersedesDigest && !link.notes.trim()) {
      addFinding('info', 'lineage_note_missing', link.digest, 'Lineage link has no explanation note', 'A supersedes relationship exists without a human-readable review note.', 'Add a short note explaining what changed and why the new release supersedes the earlier one.');
    }
  });

  const manifests = entries.filter((entry) => entry.kind === 'manifest');
  const diffs = entries.filter((entry) => entry.kind === 'manifest_diff');
  const signoffs = entries.filter((entry) => entry.kind === 'signoff_packet');
  const linkedLineageDigests = new Set(lineage.map((link) => link.digest).filter((digest) => digest));

  let missingSignoffs = 0;
  let missingDiffs = 0;
  let unknownArtifacts = 0;

  entries.forEach((entry) => {
    if (entry.kind === 'unknown') {
      unknownArtifacts += 1;
      addFinding('blocker', 'unknown_artifact', entry.digest, 'Unknown release artifact type', `${entry.label} has schema ${entry.schema}.`, 'Archive only recognized governance manifests, manifest diffs, and release signoff packets.');
    }
    if (!entry.schema || entry.schema === 'unknown') {
      addFinding('warning', 'schema_missing', entry.digest, 'Archive entry is missing a schema', `${entry.label} does not declare a recognized schema.`, 'Re-import the original exported JSON packet if available.');
    }
    if (!entry.appVersion || entry.appVersion === 'unknown') {
      addFinding('info', 'app_version_missing', entry.digest, 'Archive entry is missing app version metadata', `${entry.label} does not include an app version.`, 'Keep the artifact, but prefer exported packets with version metadata for public release history.');
    }
    if (entry.pendingApprovals > 0) {
      addFinding('blocker', 'pending_approvals', entry.digest, 'Release artifact still has pending approvals', `${entry.label} reports ${entry.pendingApprovals} pending approval item(s).`, 'Resolve or document pending approvals before treating this release as ready.');
    }
    if (entry.blockerCount > 0 && entry.decision === 'approve_release') {
      addFinding('blocker', 'approved_with_blockers', entry.digest, 'Approved signoff still has blockers', `${entry.label} is approved but reports ${entry.blockerCount} blocker(s).`, 'Recheck the signoff packet and either resolve blockers or change the decision.');
    }
    if ((entry.decision === 'hold_release' || entry.decision === 'needs_more_review') && linkedLineageDigests.has(entry.digest)) {
      addFinding('warning', 'nonapproved_public_lineage', entry.digest, 'Non-approved release has public lineage metadata', `${entry.label} has decision ${entry.decision} but is linked in release lineage metadata.`, 'Confirm whether held or needs-review releases should appear in public history.');
    }
  });

  manifests.forEach((manifest) => {
    const matchingSignoff = signoffs.some((signoff) => manifestDigestFromSignoff(signoff) === manifest.digest || normalizedName(manifestNameFromSignoff(signoff)) === normalizedName(manifest.releaseName));
    if (!matchingSignoff) {
      missingSignoffs += 1;
      addFinding('warning', 'missing_signoff', manifest.digest, 'Manifest has no matching signoff packet', `${manifest.releaseName} has a manifest in the archive but no matching release signoff packet.`, 'Add the signoff packet or mark the release as incomplete before public-history export.');
    }

    const matchingDiff = diffs.some((diff) => candidateDigestFromDiff(diff) === manifest.digest || normalizedName(candidateNameFromDiff(diff)) === normalizedName(manifest.releaseName));
    if (!matchingDiff) {
      missingDiffs += 1;
      addFinding('info', 'missing_manifest_diff', manifest.digest, 'Manifest has no matching release diff', `${manifest.releaseName} has no matching manifest compare packet.`, 'Add a manifest diff when this release supersedes an earlier release; first releases may not need one.');
    }
    if (manifest.ready === false) {
      addFinding('warning', 'manifest_not_ready', manifest.digest, 'Manifest readiness is not green', `${manifest.releaseName} is marked not ready.`, 'Review blockers, warnings, pending approvals, and source-quality notes before release.');
    }
  });

  signoffs.forEach((signoff) => {
    const payload = asRecord(signoff.payload);
    const releaseManifest = asRecord(payload.releaseManifest);
    if (!stringValue(releaseManifest.schema)) {
      addFinding('blocker', 'signoff_missing_manifest', signoff.digest, 'Signoff packet is missing embedded release manifest', `${signoff.label} does not include a recognized releaseManifest object.`, 'Export a fresh signoff packet with the release manifest attached.');
    }
  });

  const approvedSignoffs = signoffs.filter((signoff) => signoff.decision === 'approve_release');
  if (approvedSignoffs.length > 1 && lineage.filter((link) => link.supersedesDigest).length === 0) {
    addFinding('warning', 'lineage_gap', 'library', 'Multiple approved releases but no supersedes lineage', `${approvedSignoffs.length} approved signoff packets exist without any supersedes relationship.`, 'Use v3.0 Release Library Mode to connect newer releases to earlier releases.');
  }

  const blockers = findings.filter((finding) => finding.severity === 'blocker').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const info = findings.filter((finding) => finding.severity === 'info').length;
  const status: IntegrityStatus = entries.length === 0 ? 'empty' : blockers > 0 ? 'blocked' : warnings > 0 ? 'review' : 'clear';
  const checkedDigests = entries.map((entry) => entry.digest);

  const report: IntegrityReport = {
    schema: 'DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1',
    generatedAt: new Date().toISOString(),
    appVersion: INTEGRITY_APP_VERSION,
    summary: {
      status,
      totalEntries: entries.length,
      blockers,
      warnings,
      info,
      duplicateDigests,
      brokenLineageLinks,
      missingSignoffs,
      missingDiffs,
      unknownArtifacts
    },
    findings,
    checkedDigests,
    safetyBoundary: integritySafetyBoundary,
    reviewOnlyNotice: integrityReviewOnlyNotice,
    reportDigest: 'pending'
  };

  return { ...report, reportDigest: integrityDigest(report) };
}

function downloadIntegrityJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2) || 'null'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderIntegrityReport(report: IntegrityReport, summaryNode: HTMLElement, findingsNode: HTMLElement) {
  summaryNode.innerHTML = `
    <div><strong>Status</strong><span>${integrityEscape(report.summary.status.toUpperCase())}</span></div>
    <div><strong>Entries</strong><span>${report.summary.totalEntries}</span></div>
    <div><strong>Blockers</strong><span>${report.summary.blockers}</span></div>
    <div><strong>Warnings</strong><span>${report.summary.warnings}</span></div>
    <div><strong>Info</strong><span>${report.summary.info}</span></div>
    <div><strong>Digest</strong><span>${integrityEscape(report.reportDigest)}</span></div>
  `;

  findingsNode.innerHTML = report.findings.length
    ? report.findings.map((finding) => `
        <article class="integrity-finding integrity-${integrityEscape(finding.severity)}">
          <strong>${integrityEscape(finding.id)} · ${integrityEscape(finding.severity.toUpperCase())}</strong>
          <h4>${integrityEscape(finding.title)}</h4>
          <p>${integrityEscape(finding.detail)}</p>
          <small>${integrityEscape(finding.recommendation)}</small>
        </article>
      `).join('')
    : '<article class="integrity-finding integrity-clear"><strong>No findings</strong><p>The current local archive did not produce integrity findings.</p></article>';
}

function initReleaseLibraryIntegrityCheck() {
  if (document.getElementById('dcl-v31-release-integrity')) return;

  const mount = document.createElement('section');
  mount.id = 'dcl-v31-release-integrity';
  mount.className = 'release-integrity-panel';
  mount.innerHTML = `
    <div class="integrity-header">
      <span>v3.1 Release Library Integrity Check</span>
      <h2>Audit the local release library before public history export</h2>
      <p>${integrityEscape(integrityReviewOnlyNotice)}</p>
    </div>
    <div class="integrity-actions">
      <button type="button" data-integrity-run>Run integrity check</button>
      <button type="button" data-integrity-export>Export integrity report</button>
    </div>
    <div class="integrity-summary" data-integrity-summary></div>
    <div class="integrity-findings" data-integrity-findings></div>
  `;

  const anchor = document.getElementById('dcl-v30-release-library') || document.getElementById('dcl-v29-release-archive') || document.body;
  anchor.insertAdjacentElement(anchor === document.body ? 'afterbegin' : 'afterend', mount);

  const summaryNode = requireIntegrityElement<HTMLElement>(mount, '[data-integrity-summary]');
  const findingsNode = requireIntegrityElement<HTMLElement>(mount, '[data-integrity-findings]');
  const runButton = requireIntegrityElement<HTMLButtonElement>(mount, '[data-integrity-run]');
  const exportButton = requireIntegrityElement<HTMLButtonElement>(mount, '[data-integrity-export]');
  let currentReport = buildIntegrityReport();

  function refresh() {
    currentReport = buildIntegrityReport();
    renderIntegrityReport(currentReport, summaryNode, findingsNode);
  }

  runButton.addEventListener('click', refresh);
  exportButton.addEventListener('click', () => {
    const filename = `dcl-release-library-integrity-${currentReport.reportDigest}.json`;
    downloadIntegrityJson(filename, currentReport);
  });

  refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReleaseLibraryIntegrityCheck);
} else {
  initReleaseLibraryIntegrityCheck();
}
