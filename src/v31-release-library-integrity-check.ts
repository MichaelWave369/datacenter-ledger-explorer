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

type ArchiveEntryLike = {
  id?: string;
  kind?: string;
  schema?: string;
  label?: string;
  releaseName?: string;
  appVersion?: string;
  digest?: string;
  decision?: string;
  ready?: boolean | null;
  canonicalCount?: number;
  pendingApprovals?: number;
  blockerCount?: number;
  warningCount?: number;
  createdAt?: string;
  importedAt?: string;
  payload?: unknown;
};

type LineageMetadataLike = {
  digest?: string;
  supersedesDigest?: string;
  releaseLabel?: string;
  notes?: string;
  updatedAt?: string;
};

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
  createdAt: string;
  importedAt: string;
  payload: unknown;
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
    status: 'clear' | 'review' | 'blocked' | 'empty';
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

function parseIntegrityJson(value: string): unknown | null {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function asIntegrityRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeIntegrityKind(value: unknown): IntegrityKind {
  if (value === 'manifest' || value === 'manifest_diff' || value === 'signoff_packet') return value;
  return 'unknown';
}

function normalizeIntegrityDecision(value: unknown): IntegrityDecision {
  if (value === 'approve_release' || value === 'hold_release' || value === 'needs_more_review') return value;
  return 'none';
}

function readArchiveEntries(): ArchiveEntryLike[] {
  const parsed = parseIntegrityJson(localStorage.getItem(INTEGRITY_ARCHIVE_KEY) || '[]');
  return Array.isArray(parsed) ? (parsed as ArchiveEntryLike[]) : [];
}

function readLineageMetadata(): LineageMetadataLike[] {
  const parsed = parseIntegrityJson(localStorage.getItem(INTEGRITY_LINEAGE_KEY) || '[]');
  return Array.isArray(parsed) ? (parsed as LineageMetadataLike[]) : [];
}

function buildIntegrityEntries(): IntegrityEntry[] {
  return readArchiveEntries().map((entry) => {
    const payload = entry.payload || entry;
    const digest = entry.digest || integrityDigest(payload);
    const fallback = new Date().toISOString();

    return {
      id: entry.id || `${entry.kind || 'unknown'}-${digest}`,
      kind: normalizeIntegrityKind(entry.kind),
      schema: entry.schema || 'unknown',
      label: entry.label || entry.releaseName || 'Unnamed release artifact',
      releaseName: entry.releaseName || 'Unnamed release',
      appVersion: entry.appVersion || 'unknown',
      digest,
      decision: normalizeIntegrityDecision(entry.decision),
      ready: typeof entry.ready === 'boolean' ? entry.ready : null,
      canonicalCount: Number(entry.canonicalCount || 0),
      pendingApprovals: Number(entry.pendingApprovals || 0),
      blockerCount: Number(entry.blockerCount || 0),
      warningCount: Number(entry.warningCount || 0),
      createdAt: entry.createdAt || entry.importedAt || fallback,
      importedAt: entry.importedAt || fallback,
      payload
    };
  });
}

function manifestDigestFromSignoff(entry: IntegrityEntry) {
  const payload = asIntegrityRecord(entry.payload);
  const manifest = asIntegrityRecord(payload.releaseManifest);
  return stringValue(manifest.manifestDigest);
}

function manifestNameFromSignoff(entry: IntegrityEntry) {
  const payload = asIntegrityRecord(entry.payload);
  const manifest = asIntegrityRecord(payload.releaseManifest);
  return stringValue(manifest.releaseName, entry.releaseName);
}

function candidateDigestFromDiff(entry: IntegrityEntry) {
  const payload = asIntegrityRecord(entry.payload);
  const candidate = asIntegrityRecord(payload.candidate);
  return stringValue(candidate.manifestDigest);
}

function candidateNameFromDiff(entry: IntegrityEntry) {
  const payload = asIntegrityRecord(entry.payload);
  const candidate = asIntegrityRecord(payload.candidate);
  return stringValue(candidate.releaseName, entry.releaseName);
}

function normalizedReleaseName(value: string) {
  return value.trim().toLowerCase();
}

function buildIntegrityReport(): IntegrityReport {
  const entries = buildIntegrityEntries();
  const lineage = readLineageMetadata();
  const digestSet = new Set(entries.map((entry) => entry.digest));
  const findings: IntegrityFinding[] = [];
  let findingIndex = 1;

  function addFinding(
    severity: IntegritySeverity,
    category: string,
    digest: string,
    title: string,
    detail: string,
    recommendation: string
  ) {
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
    const digest = stringValue(link.digest);
    const supersedesDigest = stringValue(link.supersedesDigest);
    if (digest && !digestSet.has(digest)) {
      addFinding('warning', 'stale_lineage', digest, 'Lineage metadata points to a missing current release', `Lineage metadata exists for ${digest}, but that digest is not in the local archive.`, 'Remove stale lineage metadata or restore the missing archived artifact.');
    }
    if (digest && supersedesDigest && digest === supersedesDigest) {
      brokenLineageLinks += 1;
      addFinding('blocker', 'self_supersedes', digest, 'Release supersedes itself', `Digest ${digest} is configured to supersede itself.`, 'Choose an earlier release digest or clear the supersedes field.');
    }
    if (supersedesDigest && !digestSet.has(supersedesDigest)) {
      brokenLineageLinks += 1;
      addFinding('blocker', 'broken_supersedes', supersedesDigest, 'Supersedes link points to a missing release', `The superseded digest ${supersedesDigest} is not present in the local archive.`, 'Restore the earlier release artifact or update the supersedes metadata.');
    }
    if (digest && supersedesDigest && !stringValue(link.notes).trim()) {
      addFinding('info', 'lineage_note_missing', digest, 'Lineage link has no explanation note', 'A supersedes relationship exists without a human-readable review note.', 'Add a short note explaining what changed and why the new release supersedes the earlier one.');
    }
  });

  const manifests = entries.filter((entry) => entry.kind === 'manifest');
  const diffs = entries.filter((entry) => entry.kind === 'manifest_diff');
  const signoffs = entries.filter((entry) => entry.kind === 'signoff_packet');
  const linkedLineageDigests = new Set(lineage.map((link) => stringValue(link.digest)).filter((digest) => digest));

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
    const matchingSignoff = signoffs.some((signoff) => {
      const signoffManifestDigest = manifestDigestFromSignoff(signoff);
      const signoffManifestName = normalizedReleaseName(manifestNameFromSignoff(signoff));
      return signoffManifestDigest === manifest.digest || signoffManifestName === normalizedReleaseName(manifest.releaseName);
    });

    if (!matchingSignoff) {
      missingSignoffs += 1;
      addFinding('warning', 'missing_signoff', manifest.digest, 'Manifest has no matching signoff packet', `${manifest.releaseName} has a manifest in the archive but no matching release signoff packet.`, 'Add the signoff packet or mark the release as incomplete before public-history export.');
    }

    const matchingDiff = diffs.some((diff) => {
      const candidateDigest = candidateDigestFromDiff(diff);
      const candidateName = normalizedReleaseName(candidateNameFromDiff(diff));
      return candidateDigest === manifest.digest || candidateName === normalizedReleaseName(manifest.releaseName);
    });

    if (!matchingDiff) {
      missingDiffs += 1;
      addFinding('info', 'missing_manifest_diff', manifest.digest, 'Manifest has no matching release diff', `${manifest.releaseName} has no matching manifest compare packet.`, 'Add a manifest diff when this release supersedes an earlier release; first releases may not need one.');
    }

    if (manifest.ready === false) {
      addFinding('warning', 'manifest_not_ready', manifest.digest, 'Manifest readiness is not green', `${manifest.releaseName} is marked not ready.`, 'Review blockers, warnings, pending approvals, and source-quality notes before release.');
    }
  });

  signoffs.forEach((signoff) => {
    const payload = asIntegrityRecord(signoff.payload);
    const releaseManifest = asIntegrityRecord(payload.releaseManifest);
    if (!stringValue(releaseManifest.schema)) {
      addFinding('blocker', 'signoff_missing_manifest', signoff.digest, 'Signoff packet is missing embedded release manifest', `${signoff.label} does not include a recognized releaseManifest object.`, 'Export a fresh signoff packet with the release manifest attached.');
    }
  });

  const approvedSignoffs = signoffs.filter((signoff) => signoff.decision === 'approve_release');
  if (approvedSignoffs.length > 1 && lineage.filter((link) => stringValue(link.supersedesDigest)).length === 0) {
    addFinding('warning', 'lineage_gap', 'library', 'Multiple approved releases but no supersedes lineage', `${approvedSignoffs.length} approved signoff packets exist without any supersedes relationship.`, 'Use v3.0 Release Library Mode to connect newer releases to earlier releases.');
  }

  const blockers = findings.filter((finding) => finding.severity === 'blocker').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const info = findings.filter((finding) => finding.severity === 'info').length;
  const status = entries.length === 0 ? 'empty' : blockers > 0 ? 'blocked' : warnings > 0 ? 'review' : 'clear';
  const checkedDigests = entries.map((entry) => entry.digest);

  const report = {
    schema: 'DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1' as const,
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

function initReleaseLibraryIntegrityCheck() {
  if (document.getElementById('dcl-v31-release-integrity')) return;

  const mount = document.createElement('section');
  mount.id = 'dcl-v31-release-integrity';
  mount.className = 'panel release-integrity-panel v31-widget';
  mount.innerHTML = `
    <div class='panelHeader'>
      <div>
        <p class='eyebrow'>v3.1 Release Library Integrity Check</p>
        <h2>Audit the local release library before public history export</h2>
        <p>Detect duplicate digests, broken supersedes links, missing signoffs, missing manifests, missing diffs, held-release lineage, unknown schemas, and readiness gaps.</p>
      </div>
      <span class='gate pass'><strong>v3.1</strong><span>local audit</span></span>
    </div>
    <div class='integrity-actions buttonRow'>
      <button id='dcl-v31-run'>Run integrity check</button>
      <button id='dcl-v31-export'>Export integrity report</button>
    </div>
    <div id='dcl-v31-status' class='integrity-status'></div>
    <div id='dcl-v31-findings' class='integrity-findings'></div>
    <p class='boundary-note'>Integrity Check is local-only. It audits saved review packets and lineage metadata; it does not verify source truth, publish records, or authorize sensitive infrastructure disclosure.</p>
  `;

  const host = document.querySelector('main.shell') || document.querySelector('#root') || document.body;
  host.appendChild(mount);

  const runButton = requireIntegrityElement<HTMLButtonElement>(mount, '#dcl-v31-run');
  const exportButton = requireIntegrityElement<HTMLButtonElement>(mount, '#dcl-v31-export');
  const statusNode = requireIntegrityElement<HTMLDivElement>(mount, '#dcl-v31-status');
  const findingsNode = requireIntegrityElement<HTMLDivElement>(mount, '#dcl-v31-findings');
  let currentReport = buildIntegrityReport();

  function severityLabel(severity: IntegritySeverity) {
    if (severity === 'blocker') return 'Blocker';
    if (severity === 'warning') return 'Warning';
    return 'Info';
  }

  function renderReport(report: IntegrityReport) {
    const summary = report.summary;
    statusNode.innerHTML = `
      <div class='integrity-score ${integrityEscape(summary.status)}'>
        <strong>${integrityEscape(summary.status.toUpperCase())}</strong>
        <span>${integrityEscape(summary.totalEntries)} archived artifact(s) checked</span>
      </div>
      <div><strong>${integrityEscape(summary.blockers)}</strong><span>blockers</span></div>
      <div><strong>${integrityEscape(summary.warnings)}</strong><span>warnings</span></div>
      <div><strong>${integrityEscape(summary.info)}</strong><span>info</span></div>
      <div><strong>${integrityEscape(summary.duplicateDigests)}</strong><span>duplicate digests</span></div>
      <div><strong>${integrityEscape(summary.brokenLineageLinks)}</strong><span>broken links</span></div>
    `;

    findingsNode.innerHTML = report.findings.length
      ? report.findings
          .map((finding) => `
            <article class='integrity-finding ${integrityEscape(finding.severity)}'>
              <p class='eyebrow'>${integrityEscape(finding.id)} · ${integrityEscape(severityLabel(finding.severity))} · ${integrityEscape(finding.category)}</p>
              <h3>${integrityEscape(finding.title)}</h3>
              <code>${integrityEscape(finding.digest)}</code>
              <p>${integrityEscape(finding.detail)}</p>
              <p><strong>Next:</strong> ${integrityEscape(finding.recommendation)}</p>
            </article>
          `)
          .join('')
      : `<div class='emptyArchive'>No integrity findings were generated.</div>`;
  }

  function refreshReport() {
    currentReport = buildIntegrityReport();
    renderReport(currentReport);
  }

  runButton.addEventListener('click', refreshReport);
  exportButton.addEventListener('click', () => {
    currentReport = buildIntegrityReport();
    downloadIntegrityJson('datacenter-ledger-release-library-integrity-report-v3.1.json', currentReport);
    renderReport(currentReport);
  });
  window.addEventListener('storage', refreshReport);

  renderReport(currentReport);
}

setTimeout(initReleaseLibraryIntegrityCheck, 0);
