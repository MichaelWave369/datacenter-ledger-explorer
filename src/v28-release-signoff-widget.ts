const APP_VERSION = '2.8.0';
const reviewOnlyNotice = 'This signoff packet is a local public-data review artifact. It is not proof of truth, not legal authorization, not a complete registry, and not permission to publish private or sensitive facility details.';
const safetyBoundary = [
  'Public-data only',
  'No hidden network calls',
  'No private facility discovery',
  'No security-sensitive enrichment',
  'Review-only: not proof of truth and not a targeting map.'
];
const twoPersonPolicy = [
  'The submitter of a change cannot approve or reject the same change.',
  'The decision role must be different from the submitter role.',
  'Admin does not bypass the two-person separation rule.',
  'Rejected requests preserve a decision receipt and do not mutate the record.'
];

type SignoffDecision = 'approve_release' | 'hold_release' | 'needs_more_review';
type SignoffStatus = 'pass' | 'warn' | 'block';
type ManifestLike = {
  schema?: string;
  releaseName?: string;
  appVersion?: string;
  manifestDigest?: string;
  activeRole?: string;
  reviewerName?: string;
  readiness?: {
    ready?: boolean;
    blockers?: string[];
    warnings?: string[];
    canonicalCount?: number;
    pendingApprovals?: number;
    publicBriefCount?: number;
    averageSourceQuality?: number;
  };
  records?: { canonical?: unknown[]; needsReview?: unknown[]; total?: number };
  roleProfile?: unknown;
  roleGate?: unknown;
  twoPersonPolicy?: string[];
  safetyBoundary?: string[];
};
type DiffLike = { schema?: string; diffDigest?: string; summary?: unknown; readiness?: unknown };
type ChecklistItem = { id: string; label: string; status: SignoffStatus; detail: string };

function digest(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseJson<T>(value: string): T | null {
  try {
    return value.trim() ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildChecklist(manifest: ManifestLike | null, diff: DiffLike | null, decision: SignoffDecision, reviewer: string, notes: string): ChecklistItem[] {
  const readiness = manifest?.readiness;
  return [
    {
      id: 'manifest',
      label: 'Governance manifest attached',
      status: manifest ? 'pass' : 'block',
      detail: manifest ? `Manifest ${manifest.releaseName || 'unnamed'} is loaded.` : 'Paste or load a GovernanceReleaseManifest JSON packet.'
    },
    {
      id: 'schema',
      label: 'Manifest schema recognized',
      status: String(manifest?.schema || '').includes('GovernanceReleaseManifest') ? 'pass' : 'block',
      detail: manifest?.schema || 'No manifest schema found.'
    },
    {
      id: 'readiness',
      label: 'Release readiness reviewed',
      status: readiness?.ready ? 'pass' : decision === 'approve_release' ? 'block' : 'warn',
      detail: readiness?.ready ? 'Manifest says ready.' : `${readiness?.blockers?.length || 0} blocker(s) remain.`
    },
    {
      id: 'pending',
      label: 'Pending approvals checked',
      status: (readiness?.pendingApprovals || 0) === 0 ? 'pass' : 'block',
      detail: `${readiness?.pendingApprovals || 0} pending approval(s).`
    },
    {
      id: 'canonical',
      label: 'Canonical records present',
      status: (readiness?.canonicalCount || manifest?.records?.canonical?.length || 0) > 0 ? 'pass' : 'block',
      detail: `${readiness?.canonicalCount || manifest?.records?.canonical?.length || 0} canonical record(s).`
    },
    {
      id: 'diff',
      label: 'Manifest diff attached or intentionally omitted',
      status: diff ? 'pass' : 'warn',
      detail: diff ? `Diff digest ${diff.diffDigest || digest(diff)}.` : 'No diff attached; signoff packet records that omission.'
    },
    {
      id: 'policy',
      label: 'Two-person policy preserved',
      status: (manifest?.twoPersonPolicy?.length || 0) >= 2 ? 'pass' : 'warn',
      detail: 'Signoff packet includes the current two-person policy text either from manifest or v2.8 defaults.'
    },
    {
      id: 'reviewer',
      label: 'Reviewer and notes supplied',
      status: reviewer.trim().length > 1 && notes.trim().length >= 12 ? 'pass' : 'block',
      detail: reviewer.trim().length > 1 ? 'Reviewer name present.' : 'Reviewer name is missing.'
    }
  ];
}

function initSignoffWidget() {
  if (document.getElementById('dcl-v28-signoff-widget')) return;
  const mount = document.createElement('section');
  mount.id = 'dcl-v28-signoff-widget';
  mount.className = 'panel signoff-panel v28-widget';
  mount.innerHTML = `
    <div class='panelHeader'>
      <div>
        <p class='eyebrow'>v2.8 Release Signoff Packet</p>
        <h2>Final local release decision</h2>
        <p>Paste a governance manifest and optional manifest diff, then export a public-safe signoff packet with checklist, role context, notes, blockers, warnings, and digest.</p>
      </div>
      <span class='gate pass'><strong>local</strong><span>no network</span></span>
    </div>
    <div class='manifest-compare-grid'>
      <label>Governance manifest JSON<textarea id='dcl-v28-manifest' placeholder='Paste DataCenterLedger.GovernanceReleaseManifest JSON'></textarea></label>
      <label>Optional manifest diff JSON<textarea id='dcl-v28-diff' placeholder='Paste DataCenterLedger.ManifestCompare JSON'></textarea></label>
    </div>
    <div class='signoff-grid'>
      <label>Reviewer<input id='dcl-v28-reviewer' value='Local reviewer' /></label>
      <label>Decision<select id='dcl-v28-decision'><option value='needs_more_review'>Needs more review</option><option value='hold_release'>Hold release</option><option value='approve_release'>Approve release</option></select></label>
    </div>
    <label class='fullWidth'>Final notes<textarea id='dcl-v28-notes'>Reviewed manifest, diff status, role context, two-person policy, receipts, and public-safety boundary.</textarea></label>
    <div class='buttonRow'>
      <label class='fileButton'>Load manifest<input id='dcl-v28-manifest-file' type='file' accept='application/json,.json' /></label>
      <label class='fileButton'>Load diff<input id='dcl-v28-diff-file' type='file' accept='application/json,.json' /></label>
      <button id='dcl-v28-refresh'>Refresh checklist</button>
      <button id='dcl-v28-export'>Export signoff packet</button>
    </div>
    <div id='dcl-v28-checklist' class='signoff-checklist'></div>
    <p class='boundary-note'>A signoff packet records a local review decision. It is not legal authorization, not source certification, and not permission to publish private or sensitive facility details.</p>
  `;
  document.querySelector('main.shell')?.appendChild(mount);

  const manifestBox = mount.querySelector<HTMLTextAreaElement>('#dcl-v28-manifest')!;
  const diffBox = mount.querySelector<HTMLTextAreaElement>('#dcl-v28-diff')!;
  const reviewerInput = mount.querySelector<HTMLInputElement>('#dcl-v28-reviewer')!;
  const decisionInput = mount.querySelector<HTMLSelectElement>('#dcl-v28-decision')!;
  const notesBox = mount.querySelector<HTMLTextAreaElement>('#dcl-v28-notes')!;
  const checklistNode = mount.querySelector<HTMLDivElement>('#dcl-v28-checklist')!;

  async function loadFileInto(file: File, target: HTMLTextAreaElement) {
    target.value = await file.text();
    renderChecklist();
  }

  function currentPacket() {
    const manifest = parseJson<ManifestLike>(manifestBox.value);
    const diff = parseJson<DiffLike>(diffBox.value);
    const decision = decisionInput.value as SignoffDecision;
    const checklist = buildChecklist(manifest, diff, decision, reviewerInput.value, notesBox.value);
    const packet = {
      schema: 'DataCenterLedger.ReleaseSignoffPacket.v2.8',
      generatedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      releaseName: manifest?.releaseName || 'Unnamed release',
      decision,
      signoffReviewer: reviewerInput.value.trim(),
      signoffRole: manifest?.activeRole || 'unknown',
      signoffNotes: notesBox.value.trim(),
      signoffChecklist: checklist,
      finalBlockers: checklist.filter((item) => item.status === 'block').map((item) => item.label),
      finalWarnings: checklist.filter((item) => item.status === 'warn').map((item) => item.label),
      releaseManifest: manifest,
      manifestDiff: diff,
      twoPersonPolicy: manifest?.twoPersonPolicy || twoPersonPolicy,
      safetyBoundary: manifest?.safetyBoundary || safetyBoundary,
      reviewOnlyNotice,
      packetDigest: 'pending'
    };
    return { ...packet, packetDigest: digest(packet) };
  }

  function renderChecklist() {
    const packet = currentPacket();
    checklistNode.innerHTML = packet.signoffChecklist.map((item) => `
      <div class='signoff-item ${item.status}'>
        <strong>${item.label}</strong>
        <span>${item.status}</span>
        <p>${item.detail}</p>
      </div>
    `).join('');
    return packet;
  }

  mount.querySelector<HTMLInputElement>('#dcl-v28-manifest-file')?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void loadFileInto(file, manifestBox);
  });
  mount.querySelector<HTMLInputElement>('#dcl-v28-diff-file')?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void loadFileInto(file, diffBox);
  });
  mount.querySelector<HTMLButtonElement>('#dcl-v28-refresh')?.addEventListener('click', () => renderChecklist());
  mount.querySelector<HTMLButtonElement>('#dcl-v28-export')?.addEventListener('click', () => {
    const packet = renderChecklist();
    downloadJson('datacenter-ledger-release-signoff-packet-v2.8.json', packet);
  });
  [manifestBox, diffBox, reviewerInput, decisionInput, notesBox].forEach((input) => input.addEventListener('input', () => renderChecklist()));
  renderChecklist();
}

setTimeout(initSignoffWidget, 0);
