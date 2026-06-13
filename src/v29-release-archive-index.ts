const ARCHIVE_APP_VERSION = '2.9.0';
const ARCHIVE_KEY = 'datacenter-ledger.release-archive.v2.9';
const archiveReviewOnlyNotice = 'This archive index is a local public-data review artifact. It is not proof of truth, not a complete registry, and not permission to publish private or sensitive infrastructure details.';
const archiveSafetyBoundary = [
  'Public-data only',
  'No hidden network calls',
  'No private facility discovery',
  'No security-sensitive enrichment',
  'Review-only: not proof of truth and not a targeting map.'
];

type ArchiveKind = 'manifest' | 'manifest_diff' | 'signoff_packet' | 'unknown';
type ArchiveDecision = 'approve_release' | 'hold_release' | 'needs_more_review' | 'none';

type ArchiveEntry = {
  id: string;
  kind: ArchiveKind;
  schema: string;
  label: string;
  releaseName: string;
  appVersion: string;
  digest: string;
  decision: ArchiveDecision;
  ready: boolean | null;
  canonicalCount: number;
  pendingApprovals: number;
  blockerCount: number;
  warningCount: number;
  createdAt: string;
  importedAt: string;
  payload: unknown;
};

type ReleaseArchivePacket = {
  schema: 'DataCenterLedger.ReleaseArchiveIndex.v2.9';
  generatedAt: string;
  appVersion: string;
  entries: ArchiveEntry[];
  summary: {
    total: number;
    manifests: number;
    diffs: number;
    signoffs: number;
    approvedSignoffs: number;
    heldSignoffs: number;
    needsReviewSignoffs: number;
  };
  safetyBoundary: string[];
  reviewOnlyNotice: string;
  archiveDigest: string;
};

type ManifestPayload = {
  schema?: string;
  releaseName?: string;
  appVersion?: string;
  manifestDigest?: string;
  generatedAt?: string;
  readiness?: {
    ready?: boolean;
    blockers?: unknown[];
    warnings?: unknown[];
    canonicalCount?: number;
    pendingApprovals?: number;
  };
  records?: { canonical?: unknown[] };
};

type DiffPayload = {
  schema?: string;
  diffDigest?: string;
  generatedAt?: string;
  baseline?: { releaseName?: string; manifestDigest?: string };
  candidate?: { releaseName?: string; manifestDigest?: string };
  summary?: { blockersAdded?: unknown[]; warningsAdded?: unknown[] };
};

type SignoffPayload = {
  schema?: string;
  releaseName?: string;
  appVersion?: string;
  generatedAt?: string;
  packetDigest?: string;
  decision?: ArchiveDecision;
  finalBlockers?: unknown[];
  finalWarnings?: unknown[];
  releaseManifest?: ManifestPayload | null;
  manifestDiff?: DiffPayload | null;
};

function archiveDigest(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function archiveEscape(value: unknown) {
  return String(value ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

function parseArchiveJson(value: string): unknown | null {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function archiveKindFor(schema: string): ArchiveKind {
  if (schema.indexOf('GovernanceReleaseManifest') >= 0) return 'manifest';
  if (schema.indexOf('ManifestCompare') >= 0) return 'manifest_diff';
  if (schema.indexOf('ReleaseSignoffPacket') >= 0) return 'signoff_packet';
  return 'unknown';
}

function asManifest(payload: unknown): ManifestPayload {
  return (payload || {}) as ManifestPayload;
}

function asDiff(payload: unknown): DiffPayload {
  return (payload || {}) as DiffPayload;
}

function asSignoff(payload: unknown): SignoffPayload {
  return (payload || {}) as SignoffPayload;
}

function entryFromPayload(payload: unknown): ArchiveEntry {
  const schema = String((payload as { schema?: unknown } | null)?.schema || 'unknown');
  const kind = archiveKindFor(schema);
  const importedAt = new Date().toISOString();
  const fallbackDigest = archiveDigest(payload);

  if (kind === 'manifest') {
    const manifest = asManifest(payload);
    const canonicalCount = Number(manifest.readiness?.canonicalCount ?? manifest.records?.canonical?.length ?? 0);
    const blockerCount = manifest.readiness?.blockers?.length || 0;
    const warningCount = manifest.readiness?.warnings?.length || 0;
    const digest = manifest.manifestDigest || fallbackDigest;
    return {
      id: `${kind}-${digest}-${Date.now()}`,
      kind,
      schema,
      label: manifest.releaseName || 'Governance release manifest',
      releaseName: manifest.releaseName || 'Unnamed release',
      appVersion: manifest.appVersion || 'unknown',
      digest,
      decision: 'none',
      ready: typeof manifest.readiness?.ready === 'boolean' ? manifest.readiness.ready : null,
      canonicalCount,
      pendingApprovals: Number(manifest.readiness?.pendingApprovals || 0),
      blockerCount,
      warningCount,
      createdAt: manifest.generatedAt || importedAt,
      importedAt,
      payload
    };
  }

  if (kind === 'manifest_diff') {
    const diff = asDiff(payload);
    const digest = diff.diffDigest || fallbackDigest;
    const baseline = diff.baseline?.releaseName || 'baseline';
    const candidate = diff.candidate?.releaseName || 'candidate';
    return {
      id: `${kind}-${digest}-${Date.now()}`,
      kind,
      schema,
      label: `${baseline} → ${candidate}`,
      releaseName: candidate,
      appVersion: 'unknown',
      digest,
      decision: 'none',
      ready: null,
      canonicalCount: 0,
      pendingApprovals: 0,
      blockerCount: diff.summary?.blockersAdded?.length || 0,
      warningCount: diff.summary?.warningsAdded?.length || 0,
      createdAt: diff.generatedAt || importedAt,
      importedAt,
      payload
    };
  }

  if (kind === 'signoff_packet') {
    const signoff = asSignoff(payload);
    const digest = signoff.packetDigest || fallbackDigest;
    return {
      id: `${kind}-${digest}-${Date.now()}`,
      kind,
      schema,
      label: signoff.releaseName || 'Release signoff packet',
      releaseName: signoff.releaseName || signoff.releaseManifest?.releaseName || 'Unnamed release',
      appVersion: signoff.appVersion || 'unknown',
      digest,
      decision: signoff.decision || 'none',
      ready: signoff.decision === 'approve_release',
      canonicalCount: Number(signoff.releaseManifest?.readiness?.canonicalCount || signoff.releaseManifest?.records?.canonical?.length || 0),
      pendingApprovals: Number(signoff.releaseManifest?.readiness?.pendingApprovals || 0),
      blockerCount: signoff.finalBlockers?.length || 0,
      warningCount: signoff.finalWarnings?.length || 0,
      createdAt: signoff.generatedAt || importedAt,
      importedAt,
      payload
    };
  }

  return {
    id: `${kind}-${fallbackDigest}-${Date.now()}`,
    kind,
    schema,
    label: 'Unrecognized release artifact',
    releaseName: 'Unknown release',
    appVersion: 'unknown',
    digest: fallbackDigest,
    decision: 'none',
    ready: null,
    canonicalCount: 0,
    pendingApprovals: 0,
    blockerCount: 0,
    warningCount: 0,
    createdAt: importedAt,
    importedAt,
    payload
  };
}

function readArchive(): ArchiveEntry[] {
  const parsed = parseArchiveJson(localStorage.getItem(ARCHIVE_KEY) || '[]');
  return Array.isArray(parsed) ? parsed as ArchiveEntry[] : [];
}

function writeArchive(entries: ArchiveEntry[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(entries));
}

function downloadArchiveJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function archiveSummary(entries: ArchiveEntry[]) {
  return {
    total: entries.length,
    manifests: entries.filter((entry) => entry.kind === 'manifest').length,
    diffs: entries.filter((entry) => entry.kind === 'manifest_diff').length,
    signoffs: entries.filter((entry) => entry.kind === 'signoff_packet').length,
    approvedSignoffs: entries.filter((entry) => entry.decision === 'approve_release').length,
    heldSignoffs: entries.filter((entry) => entry.decision === 'hold_release').length,
    needsReviewSignoffs: entries.filter((entry) => entry.decision === 'needs_more_review').length
  };
}

function buildArchivePacket(entries: ArchiveEntry[]): ReleaseArchivePacket {
  const packet = {
    schema: 'DataCenterLedger.ReleaseArchiveIndex.v2.9' as const,
    generatedAt: new Date().toISOString(),
    appVersion: ARCHIVE_APP_VERSION,
    entries,
    summary: archiveSummary(entries),
    safetyBoundary: archiveSafetyBoundary,
    reviewOnlyNotice: archiveReviewOnlyNotice,
    archiveDigest: 'pending'
  };
  return { ...packet, archiveDigest: archiveDigest(packet) };
}

function setTextareaValue(selector: string, value: string) {
  const textarea = document.querySelector<HTMLTextAreaElement>(selector);
  if (!textarea) return false;
  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function initReleaseArchiveIndex() {
  if (document.getElementById('dcl-v29-release-archive')) return;
  const mount = document.createElement('section');
  mount.id = 'dcl-v29-release-archive';
  mount.className = 'panel release-archive-panel v29-widget';
  mount.innerHTML = `
    <div class='panelHeader'>
      <div>
        <p class='eyebrow'>v2.9 Release Archive Index</p>
        <h2>Local release archive</h2>
        <p>Save governance manifests, manifest diffs, and release signoff packets in local browser storage. Search by digest, filter by decision, and export a public-safe archive index.</p>
      </div>
      <span class='gate pass'><strong>local</strong><span>browser storage</span></span>
    </div>
    <div class='archive-grid'>
      <label>Paste release artifact JSON<textarea id='dcl-v29-paste' placeholder='Paste GovernanceReleaseManifest, ManifestCompare, or ReleaseSignoffPacket JSON'></textarea></label>
      <div class='archive-actions'>
        <label>Search digest / release / schema<input id='dcl-v29-search' placeholder='manifest digest, release name, decision...' /></label>
        <label>Kind filter<select id='dcl-v29-kind'><option value='all'>All artifacts</option><option value='manifest'>Manifests</option><option value='manifest_diff'>Manifest diffs</option><option value='signoff_packet'>Signoff packets</option></select></label>
        <label>Decision filter<select id='dcl-v29-decision'><option value='all'>All decisions</option><option value='approve_release'>Approved</option><option value='hold_release'>Held</option><option value='needs_more_review'>Needs more review</option><option value='none'>No decision</option></select></label>
      </div>
    </div>
    <div class='buttonRow'>
      <label class='fileButton'>Load artifact<input id='dcl-v29-file' type='file' accept='application/json,.json' multiple /></label>
      <button id='dcl-v29-add'>Add pasted artifact</button>
      <button id='dcl-v29-export'>Export archive index</button>
      <button id='dcl-v29-clear'>Clear local archive</button>
    </div>
    <div id='dcl-v29-summary' class='archive-summary'></div>
    <div id='dcl-v29-table' class='archive-table'></div>
    <p class='boundary-note'>This archive index stores local review packets only. It does not verify source truth, publish data, authorize release, or discover private facility details.</p>
  `;
  document.querySelector('main.shell')?.appendChild(mount);

  const pasteBox = mount.querySelector<HTMLTextAreaElement>('#dcl-v29-paste')!;
  const searchInput = mount.querySelector<HTMLInputElement>('#dcl-v29-search')!;
  const kindFilter = mount.querySelector<HTMLSelectElement>('#dcl-v29-kind')!;
  const decisionFilter = mount.querySelector<HTMLSelectElement>('#dcl-v29-decision')!;
  const summaryNode = mount.querySelector<HTMLDivElement>('#dcl-v29-summary')!;
  const tableNode = mount.querySelector<HTMLDivElement>('#dcl-v29-table')!;

  function filteredEntries() {
    const query = searchInput.value.trim().toLowerCase();
    return readArchive().filter((entry) => {
      const matchesKind = kindFilter.value === 'all' || entry.kind === kindFilter.value;
      const matchesDecision = decisionFilter.value === 'all' || entry.decision === decisionFilter.value;
      const haystack = `${entry.label} ${entry.releaseName} ${entry.schema} ${entry.digest} ${entry.decision}`.toLowerCase();
      const matchesQuery = !query || haystack.indexOf(query) >= 0;
      return matchesKind && matchesDecision && matchesQuery;
    }).sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }

  function render() {
    const entries = readArchive();
    const visible = filteredEntries();
    const summary = archiveSummary(entries);
    summaryNode.innerHTML = `
      <div><strong>${summary.total}</strong><span>archived</span></div>
      <div><strong>${summary.manifests}</strong><span>manifests</span></div>
      <div><strong>${summary.diffs}</strong><span>diffs</span></div>
      <div><strong>${summary.signoffs}</strong><span>signoffs</span></div>
      <div><strong>${summary.approvedSignoffs}</strong><span>approved</span></div>
    `;
    tableNode.innerHTML = visible.length ? visible.map((entry) => `
      <article class='archive-entry ${archiveEscape(entry.kind)}'>
        <div>
          <p class='eyebrow'>${archiveEscape(entry.kind)} · ${archiveEscape(entry.decision)}</p>
          <h3>${archiveEscape(entry.label)}</h3>
          <p>${archiveEscape(entry.schema)}</p>
          <code>${archiveEscape(entry.digest)}</code>
        </div>
        <div class='archive-metrics'>
          <span>Ready: ${entry.ready === null ? 'n/a' : archiveEscape(entry.ready ? 'yes' : 'no')}</span>
          <span>Canonical: ${archiveEscape(entry.canonicalCount)}</span>
          <span>Pending: ${archiveEscape(entry.pendingApprovals)}</span>
          <span>Blocks/Warns: ${archiveEscape(entry.blockerCount)} / ${archiveEscape(entry.warningCount)}</span>
        </div>
        <div class='archive-buttons'>
          <button data-action='send-manifest' data-id='${archiveEscape(entry.id)}'>Send manifest to signoff</button>
          <button data-action='send-diff' data-id='${archiveEscape(entry.id)}'>Send diff to signoff</button>
          <button data-action='export' data-id='${archiveEscape(entry.id)}'>Export item</button>
          <button data-action='remove' data-id='${archiveEscape(entry.id)}'>Remove</button>
        </div>
      </article>
    `).join('') : `<div class='emptyArchive'>No archived release packets match the current filters.</div>`;
  }

  function addPayload(payload: unknown) {
    const entry = entryFromPayload(payload);
    const entries = readArchive();
    const deduped = entries.filter((existing) => existing.digest !== entry.digest || existing.kind !== entry.kind);
    writeArchive([entry].concat(deduped));
    render();
  }

  async function loadFile(file: File) {
    const payload = parseArchiveJson(await file.text());
    if (payload) addPayload(payload);
  }

  mount.querySelector<HTMLButtonElement>('#dcl-v29-add')?.addEventListener('click', () => {
    const payload = parseArchiveJson(pasteBox.value);
    if (!payload) {
      pasteBox.focus();
      return;
    }
    addPayload(payload);
    pasteBox.value = '';
  });

  mount.querySelector<HTMLInputElement>('#dcl-v29-file')?.addEventListener('change', (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    for (let index = 0; index < files.length; index += 1) {
      void loadFile(files[index]);
    }
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v29-export')?.addEventListener('click', () => {
    downloadArchiveJson('datacenter-ledger-release-archive-index-v2.9.json', buildArchivePacket(readArchive()));
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v29-clear')?.addEventListener('click', () => {
    if (confirm('Clear the local release archive stored in this browser?')) {
      writeArchive([]);
      render();
    }
  });

  tableNode.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    const id = button.dataset.id || '';
    const action = button.dataset.action || '';
    const entries = readArchive();
    const entry = entries.filter((candidate) => candidate.id === id)[0];
    if (!entry) return;
    if (action === 'remove') {
      writeArchive(entries.filter((candidate) => candidate.id !== id));
      render();
      return;
    }
    if (action === 'export') {
      downloadArchiveJson(`datacenter-ledger-archive-item-${entry.kind}-${entry.digest}.json`, entry.payload);
      return;
    }
    if (action === 'send-manifest') {
      const manifestPayload = entry.kind === 'signoff_packet' ? (asSignoff(entry.payload).releaseManifest || null) : entry.payload;
      if (manifestPayload) setTextareaValue('#dcl-v28-manifest', JSON.stringify(manifestPayload, null, 2));
      return;
    }
    if (action === 'send-diff') {
      const diffPayload = entry.kind === 'signoff_packet' ? (asSignoff(entry.payload).manifestDiff || null) : entry.payload;
      if (diffPayload) setTextareaValue('#dcl-v28-diff', JSON.stringify(diffPayload, null, 2));
    }
  });

  [searchInput, kindFilter, decisionFilter].forEach((input) => input.addEventListener('input', render));
  render();
}

setTimeout(initReleaseArchiveIndex, 0);
