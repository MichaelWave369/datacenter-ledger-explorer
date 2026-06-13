export {};

const LIBRARY_APP_VERSION = '3.0.0';
const LIBRARY_ARCHIVE_KEY = 'datacenter-ledger.release-archive.v2.9';
const LIBRARY_LINEAGE_KEY = 'datacenter-ledger.release-library-lineage.v3.0';

const libraryReviewOnlyNotice =
  'This release library is a local public-data review artifact. It is not proof of truth, not a complete registry, and not authorization to publish private or sensitive infrastructure details.';

const librarySafetyBoundary = [
  'Public-data only',
  'No hidden network calls',
  'No private facility discovery',
  'No security-sensitive enrichment',
  'Release library entries remain review artifacts until humans review the cited public sources.'
];

type LibraryKind = 'manifest' | 'manifest_diff' | 'signoff_packet' | 'unknown';
type LibraryDecision = 'approve_release' | 'hold_release' | 'needs_more_review' | 'none';

type ArchiveEntryLike = {
  id?: string;
  kind?: LibraryKind;
  schema?: string;
  label?: string;
  releaseName?: string;
  appVersion?: string;
  digest?: string;
  decision?: LibraryDecision;
  ready?: boolean | null;
  canonicalCount?: number;
  pendingApprovals?: number;
  blockerCount?: number;
  warningCount?: number;
  createdAt?: string;
  importedAt?: string;
  payload?: unknown;
};

type LineageMetadata = {
  digest: string;
  supersedesDigest: string;
  releaseLabel: string;
  notes: string;
  updatedAt: string;
};

type LibraryEntry = {
  id: string;
  kind: LibraryKind;
  schema: string;
  label: string;
  releaseName: string;
  appVersion: string;
  digest: string;
  decision: LibraryDecision;
  ready: boolean | null;
  canonicalCount: number;
  pendingApprovals: number;
  blockerCount: number;
  warningCount: number;
  createdAt: string;
  importedAt: string;
  supersedesDigest: string;
  supersededByDigest: string;
  releaseLabel: string;
  lineageNotes: string;
  payloadDigest: string;
  payload: unknown;
};

function libraryDigest(payload: unknown) {
  const text = JSON.stringify(payload) || '';
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function libraryEscape(value: unknown) {
  return String(value ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

function parseLibraryJson(value: string): unknown | null {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function readArchiveEntries(): ArchiveEntryLike[] {
  const parsed = parseLibraryJson(localStorage.getItem(LIBRARY_ARCHIVE_KEY) || '[]');
  return Array.isArray(parsed) ? (parsed as ArchiveEntryLike[]) : [];
}

function readLineageMetadata(): LineageMetadata[] {
  const parsed = parseLibraryJson(localStorage.getItem(LIBRARY_LINEAGE_KEY) || '[]');
  return Array.isArray(parsed) ? (parsed as LineageMetadata[]) : [];
}

function writeLineageMetadata(lineage: LineageMetadata[]) {
  localStorage.setItem(LIBRARY_LINEAGE_KEY, JSON.stringify(lineage));
}

function downloadLibraryJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2) || 'null'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setLibraryTextarea(selector: string, value: string) {
  const textarea = document.querySelector<HTMLTextAreaElement>(selector);
  if (!textarea) return false;
  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function entryKind(entry: ArchiveEntryLike): LibraryKind {
  return entry.kind || 'unknown';
}

function entryDecision(entry: ArchiveEntryLike): LibraryDecision {
  return entry.decision || 'none';
}

function entryDigest(entry: ArchiveEntryLike) {
  return entry.digest || libraryDigest(entry.payload || entry);
}

function buildLibraryEntries(): LibraryEntry[] {
  const lineage = readLineageMetadata();

  return readArchiveEntries()
    .map((entry) => {
      const digest = entryDigest(entry);
      const meta = lineage.filter((candidate) => candidate.digest === digest)[0];
      const supersededBy = lineage.filter((candidate) => candidate.supersedesDigest === digest)[0];
      const payload = entry.payload || entry;
      const fallback = new Date().toISOString();

      return {
        id: entry.id || `${entryKind(entry)}-${digest}`,
        kind: entryKind(entry),
        schema: entry.schema || 'unknown',
        label: entry.label || entry.releaseName || 'Unnamed release artifact',
        releaseName: entry.releaseName || 'Unnamed release',
        appVersion: entry.appVersion || 'unknown',
        digest,
        decision: entryDecision(entry),
        ready: typeof entry.ready === 'boolean' ? entry.ready : null,
        canonicalCount: Number(entry.canonicalCount || 0),
        pendingApprovals: Number(entry.pendingApprovals || 0),
        blockerCount: Number(entry.blockerCount || 0),
        warningCount: Number(entry.warningCount || 0),
        createdAt: entry.createdAt || entry.importedAt || fallback,
        importedAt: entry.importedAt || fallback,
        supersedesDigest: meta?.supersedesDigest || '',
        supersededByDigest: supersededBy?.digest || '',
        releaseLabel: meta?.releaseLabel || entry.releaseName || entry.label || 'Unnamed release',
        lineageNotes: meta?.notes || '',
        payloadDigest: libraryDigest(payload),
        payload
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function librarySummary(entries: LibraryEntry[]) {
  return {
    total: entries.length,
    manifests: entries.filter((entry) => entry.kind === 'manifest').length,
    diffs: entries.filter((entry) => entry.kind === 'manifest_diff').length,
    signoffs: entries.filter((entry) => entry.kind === 'signoff_packet').length,
    approvedSignoffs: entries.filter((entry) => entry.decision === 'approve_release').length,
    lineageLinks: entries.filter((entry) => entry.supersedesDigest).length
  };
}

function buildReleaseLibraryPacket() {
  const entries = buildLibraryEntries();
  const packet = {
    schema: 'DataCenterLedger.ReleaseLibrary.v3.0',
    generatedAt: new Date().toISOString(),
    appVersion: LIBRARY_APP_VERSION,
    entries,
    publicHistory: entries.map((entry) => ({
      releaseName: entry.releaseName,
      releaseLabel: entry.releaseLabel,
      digest: entry.digest,
      decision: entry.decision,
      ready: entry.ready,
      supersedesDigest: entry.supersedesDigest,
      supersededByDigest: entry.supersededByDigest,
      createdAt: entry.createdAt
    })),
    summary: librarySummary(entries),
    safetyBoundary: librarySafetyBoundary,
    reviewOnlyNotice: libraryReviewOnlyNotice,
    libraryDigest: 'pending'
  };

  return { ...packet, libraryDigest: libraryDigest(packet) };
}

function updateLineage(digest: string, supersedesDigest: string, releaseLabel: string, notes: string) {
  const nextMeta: LineageMetadata = {
    digest,
    supersedesDigest,
    releaseLabel,
    notes,
    updatedAt: new Date().toISOString()
  };
  const lineage = readLineageMetadata().filter((entry) => entry.digest !== digest);
  writeLineageMetadata([nextMeta].concat(lineage));
}

function initReleaseLibraryMode() {
  if (document.getElementById('dcl-v30-release-library')) return;

  const mount = document.createElement('section');
  mount.id = 'dcl-v30-release-library';
  mount.className = 'panel release-library-panel v30-widget';
  mount.innerHTML = `
    <div class='panelHeader'>
      <div>
        <p class='eyebrow'>v3.0 Release Library Mode</p>
        <h2>Local release library</h2>
        <p>Turn archived release artifacts into a local library with lineage, public release history, digest search, and compare/signoff handoffs.</p>
      </div>
      <span class='gate pass'><strong>v3.0</strong><span>library mode</span></span>
    </div>
    <div class='library-controls'>
      <label>Search releases<input id='dcl-v30-search' placeholder='release name, digest, decision, label...' /></label>
      <label>Decision filter<select id='dcl-v30-decision'><option value='all'>All decisions</option><option value='approve_release'>Approved</option><option value='hold_release'>Held</option><option value='needs_more_review'>Needs more review</option><option value='none'>No decision</option></select></label>
      <label>Current release<select id='dcl-v30-current'></select></label>
      <label>Supersedes<select id='dcl-v30-supersedes'><option value=''>None / first release</option></select></label>
    </div>
    <div class='library-lineage-editor'>
      <label>Public release label<input id='dcl-v30-label' placeholder='Example: June community review packet' /></label>
      <label>Lineage notes<textarea id='dcl-v30-notes' placeholder='Why this release supersedes the earlier release; what changed; what still needs review.'></textarea></label>
    </div>
    <div class='buttonRow'>
      <button id='dcl-v30-save-lineage'>Save lineage metadata</button>
      <button id='dcl-v30-export-library'>Export ReleaseLibrary.v3.0</button>
      <button id='dcl-v30-export-history'>Export public history</button>
      <button id='dcl-v30-send-signoff'>Restore current to signoff</button>
      <button id='dcl-v30-export-compare'>Export compare handoff</button>
    </div>
    <div id='dcl-v30-summary' class='library-summary'></div>
    <div id='dcl-v30-lineage' class='library-lineage'></div>
    <div id='dcl-v30-table' class='library-table'></div>
    <p class='boundary-note'>Release Library Mode is local-only. It organizes review packets and lineage notes; it does not validate source truth, publish data, or authorize sensitive infrastructure disclosure.</p>
  `;

  const host = document.querySelector('main.shell') || document.querySelector('#root') || document.body;
  host.appendChild(mount);

  const searchInput = mount.querySelector<HTMLInputElement>('#dcl-v30-search');
  const decisionFilter = mount.querySelector<HTMLSelectElement>('#dcl-v30-decision');
  const currentSelect = mount.querySelector<HTMLSelectElement>('#dcl-v30-current');
  const supersedesSelect = mount.querySelector<HTMLSelectElement>('#dcl-v30-supersedes');
  const labelInput = mount.querySelector<HTMLInputElement>('#dcl-v30-label');
  const notesInput = mount.querySelector<HTMLTextAreaElement>('#dcl-v30-notes');
  const summaryNode = mount.querySelector<HTMLDivElement>('#dcl-v30-summary');
  const lineageNode = mount.querySelector<HTMLDivElement>('#dcl-v30-lineage');
  const tableNode = mount.querySelector<HTMLDivElement>('#dcl-v30-table');

  if (
    !searchInput ||
    !decisionFilter ||
    !currentSelect ||
    !supersedesSelect ||
    !labelInput ||
    !notesInput ||
    !summaryNode ||
    !lineageNode ||
    !tableNode
  ) {
    return;
  }

  function getCurrentEntry() {
    const digest = currentSelect.value;
    return buildLibraryEntries().filter((entry) => entry.digest === digest)[0] || null;
  }

  function getSupersedesEntry() {
    const digest = supersedesSelect.value;
    return buildLibraryEntries().filter((entry) => entry.digest === digest)[0] || null;
  }

  function refreshSelects(entries: LibraryEntry[]) {
    const previousCurrent = currentSelect.value;
    const previousSupersedes = supersedesSelect.value;
    const options = entries
      .map((entry) => `<option value='${libraryEscape(entry.digest)}'>${libraryEscape(entry.releaseLabel)} · ${libraryEscape(entry.digest)}</option>`)
      .join('');

    currentSelect.innerHTML = options || `<option value=''>No archived releases yet</option>`;
    supersedesSelect.innerHTML = `<option value=''>None / first release</option>${options}`;

    if (entries.some((entry) => entry.digest === previousCurrent)) currentSelect.value = previousCurrent;
    if (entries.some((entry) => entry.digest === previousSupersedes)) supersedesSelect.value = previousSupersedes;
  }

  function filteredEntries() {
    const query = searchInput.value.trim().toLowerCase();
    const decision = decisionFilter.value;

    return buildLibraryEntries().filter((entry) => {
      const matchesDecision = decision === 'all' || entry.decision === decision;
      const haystack = `${entry.releaseName} ${entry.releaseLabel} ${entry.label} ${entry.digest} ${entry.schema} ${entry.decision}`.toLowerCase();
      return matchesDecision && (!query || haystack.indexOf(query) >= 0);
    });
  }

  function syncEditorFromCurrent() {
    const current = getCurrentEntry();
    if (!current) return;
    labelInput.value = current.releaseLabel;
    notesInput.value = current.lineageNotes;
    supersedesSelect.value = current.supersedesDigest;
  }

  function render() {
    const entries = buildLibraryEntries();
    const visible = filteredEntries();
    const summary = librarySummary(entries);
    refreshSelects(entries);

    summaryNode.innerHTML = `
      <div><strong>${summary.total}</strong><span>library entries</span></div>
      <div><strong>${summary.signoffs}</strong><span>signoffs</span></div>
      <div><strong>${summary.approvedSignoffs}</strong><span>approved</span></div>
      <div><strong>${summary.lineageLinks}</strong><span>lineage links</span></div>
    `;

    const lineages = entries.filter((entry) => entry.supersedesDigest);
    lineageNode.innerHTML = lineages.length
      ? lineages
          .map((entry) => {
            const previous = entries.filter((candidate) => candidate.digest === entry.supersedesDigest)[0];
            return `<article class='lineage-card'><strong>${libraryEscape(entry.releaseLabel)}</strong><span>supersedes</span><em>${libraryEscape(previous?.releaseLabel || entry.supersedesDigest)}</em><p>${libraryEscape(entry.lineageNotes || 'No lineage note supplied.')}</p></article>`;
          })
          .join('')
      : `<div class='emptyArchive'>No release lineage links saved yet.</div>`;

    tableNode.innerHTML = visible.length
      ? visible
          .map((entry) => `
            <article class='library-entry ${libraryEscape(entry.kind)}'>
              <div>
                <p class='eyebrow'>${libraryEscape(entry.kind)} · ${libraryEscape(entry.decision)}</p>
                <h3>${libraryEscape(entry.releaseLabel)}</h3>
                <p>${libraryEscape(entry.releaseName)} · ${libraryEscape(entry.schema)}</p>
                <code>${libraryEscape(entry.digest)}</code>
              </div>
              <div class='library-metrics'>
                <span>Ready: ${entry.ready === null ? 'n/a' : libraryEscape(entry.ready ? 'yes' : 'no')}</span>
                <span>Canonical: ${libraryEscape(entry.canonicalCount)}</span>
                <span>Blocks/Warns: ${libraryEscape(entry.blockerCount)} / ${libraryEscape(entry.warningCount)}</span>
                <span>Supersedes: ${entry.supersedesDigest ? libraryEscape(entry.supersedesDigest) : 'none'}</span>
              </div>
              <div class='archive-buttons'>
                <button data-action='select' data-digest='${libraryEscape(entry.digest)}'>Select</button>
                <button data-action='signoff' data-digest='${libraryEscape(entry.digest)}'>Send to signoff</button>
                <button data-action='export' data-digest='${libraryEscape(entry.digest)}'>Export artifact</button>
              </div>
            </article>
          `)
          .join('')
      : `<div class='emptyArchive'>No releases match the current filters.</div>`;
  }

  mount.querySelector<HTMLButtonElement>('#dcl-v30-save-lineage')?.addEventListener('click', () => {
    const current = getCurrentEntry();
    if (!current) return;
    updateLineage(current.digest, supersedesSelect.value, labelInput.value.trim() || current.releaseName, notesInput.value.trim());
    render();
    syncEditorFromCurrent();
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v30-export-library')?.addEventListener('click', () => {
    downloadLibraryJson('datacenter-ledger-release-library-v3.0.json', buildReleaseLibraryPacket());
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v30-export-history')?.addEventListener('click', () => {
    const packet = buildReleaseLibraryPacket();
    downloadLibraryJson('datacenter-ledger-public-release-history-v3.0.json', {
      schema: 'DataCenterLedger.PublicReleaseHistory.v3.0',
      generatedAt: packet.generatedAt,
      appVersion: LIBRARY_APP_VERSION,
      publicHistory: packet.publicHistory,
      safetyBoundary: librarySafetyBoundary,
      reviewOnlyNotice: libraryReviewOnlyNotice,
      historyDigest: libraryDigest(packet.publicHistory)
    });
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v30-send-signoff')?.addEventListener('click', () => {
    const current = getCurrentEntry();
    if (!current) return;
    setLibraryTextarea('#dcl-v28-manifest', JSON.stringify(current.payload, null, 2) || '{}');
  });

  mount.querySelector<HTMLButtonElement>('#dcl-v30-export-compare')?.addEventListener('click', () => {
    const current = getCurrentEntry();
    const previous = getSupersedesEntry();
    if (!current || !previous) return;
    downloadLibraryJson('datacenter-ledger-release-compare-handoff-v3.0.json', {
      schema: 'DataCenterLedger.ReleaseCompareHandoff.v3.0',
      generatedAt: new Date().toISOString(),
      appVersion: LIBRARY_APP_VERSION,
      baseline: previous.payload,
      candidate: current.payload,
      baselineDigest: previous.digest,
      candidateDigest: current.digest,
      safetyBoundary: librarySafetyBoundary,
      reviewOnlyNotice: libraryReviewOnlyNotice,
      handoffDigest: libraryDigest({ baselineDigest: previous.digest, candidateDigest: current.digest })
    });
  });

  tableNode.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button[data-action]') as HTMLButtonElement | null;
    if (!button) return;

    const digest = button.dataset.digest || '';
    const action = button.dataset.action || '';
    const entry = buildLibraryEntries().filter((candidate) => candidate.digest === digest)[0];
    if (!entry) return;

    if (action === 'select') {
      currentSelect.value = entry.digest;
      syncEditorFromCurrent();
      return;
    }

    if (action === 'signoff') {
      setLibraryTextarea('#dcl-v28-manifest', JSON.stringify(entry.payload, null, 2) || '{}');
      return;
    }

    if (action === 'export') {
      downloadLibraryJson(`datacenter-ledger-library-artifact-${entry.kind}-${entry.digest}.json`, entry.payload);
    }
  });

  searchInput.addEventListener('input', render);
  decisionFilter.addEventListener('input', render);
  currentSelect.addEventListener('change', syncEditorFromCurrent);
  window.addEventListener('storage', render);

  render();
  syncEditorFromCurrent();
}

setTimeout(initReleaseLibraryMode, 0);
