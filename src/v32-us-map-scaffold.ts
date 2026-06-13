export {};

const MAP_APP_VERSION = '3.2.0';
const MAP_ARCHIVE_KEY = 'datacenter-ledger.release-archive.v2.9';
const MAP_LAYER_KEY = 'datacenter-ledger.us-map-layer.v3.2';

const mapReviewOnlyNotice =
  'This US map scaffold is a local public-data review artifact. It is not proof of truth, not a complete registry, and not permission to publish private or sensitive facility details.';

const mapSafetyBoundary = [
  'Public-data only',
  'No hidden network calls',
  'No private facility discovery',
  'No security-sensitive enrichment',
  'Default to state, county, or city precision unless exact public coordinates are already appropriate and reviewed.',
  'Map markers are review prompts, not proof of truth and not a targeting map.'
];

const mapPrecisionPolicy = [
  'state: marker represents a state-level public claim or unresolved location signal',
  'county: marker represents a county-level public claim; no exact coordinates are implied',
  'city: marker represents a city-level public claim; no exact facility boundary is implied',
  'public_address: allowed only when the address is already published by a public source and reviewed',
  'unknown: record remains unmapped until public location evidence is reviewed'
];

type MapPrecision = 'state' | 'county' | 'city' | 'public_address' | 'unknown';

type MapRecord = {
  id: string;
  title: string;
  operator: string;
  state: string;
  stateName: string;
  city: string;
  county: string;
  status: string;
  evidenceClass: string;
  sourceQuality: number | null;
  precision: MapPrecision;
  digest: string;
  sourceSchema: string;
  sourceLabel: string;
};

type StatePoint = {
  code: string;
  name: string;
  x: number;
  y: number;
};

type StateCluster = {
  state: string;
  stateName: string;
  x: number;
  y: number;
  count: number;
  records: MapRecord[];
};

type MapLayerPacket = {
  schema: 'DataCenterLedger.MapLayer.v3.2';
  generatedAt: string;
  appVersion: string;
  records: MapRecord[];
  clusters: StateCluster[];
  summary: {
    totalRecords: number;
    mappedRecords: number;
    unmappedRecords: number;
    statesRepresented: number;
    publicAddressRecords: number;
    cityPrecisionRecords: number;
    countyPrecisionRecords: number;
    statePrecisionRecords: number;
  };
  safetyBoundary: string[];
  precisionPolicy: string[];
  reviewOnlyNotice: string;
  mapLayerDigest: string;
};

type ArchiveEntryLike = {
  kind?: string;
  schema?: string;
  label?: string;
  releaseName?: string;
  digest?: string;
  payload?: unknown;
};

type AnyRecord = Record<string, unknown>;

const statePoints: StatePoint[] = [
  { code: 'AL', name: 'Alabama', x: 63, y: 72 },
  { code: 'AK', name: 'Alaska', x: 12, y: 84 },
  { code: 'AZ', name: 'Arizona', x: 22, y: 64 },
  { code: 'AR', name: 'Arkansas', x: 56, y: 66 },
  { code: 'CA', name: 'California', x: 9, y: 52 },
  { code: 'CO', name: 'Colorado', x: 34, y: 49 },
  { code: 'CT', name: 'Connecticut', x: 87, y: 35 },
  { code: 'DE', name: 'Delaware', x: 82, y: 49 },
  { code: 'DC', name: 'District of Columbia', x: 80, y: 52 },
  { code: 'FL', name: 'Florida', x: 72, y: 82 },
  { code: 'GA', name: 'Georgia', x: 69, y: 72 },
  { code: 'HI', name: 'Hawaii', x: 28, y: 86 },
  { code: 'ID', name: 'Idaho', x: 21, y: 32 },
  { code: 'IL', name: 'Illinois', x: 61, y: 50 },
  { code: 'IN', name: 'Indiana', x: 66, y: 49 },
  { code: 'IA', name: 'Iowa', x: 55, y: 43 },
  { code: 'KS', name: 'Kansas', x: 45, y: 55 },
  { code: 'KY', name: 'Kentucky', x: 68, y: 57 },
  { code: 'LA', name: 'Louisiana', x: 55, y: 77 },
  { code: 'ME', name: 'Maine', x: 91, y: 23 },
  { code: 'MD', name: 'Maryland', x: 80, y: 51 },
  { code: 'MA', name: 'Massachusetts', x: 88, y: 32 },
  { code: 'MI', name: 'Michigan', x: 67, y: 36 },
  { code: 'MN', name: 'Minnesota', x: 52, y: 29 },
  { code: 'MS', name: 'Mississippi', x: 59, y: 73 },
  { code: 'MO', name: 'Missouri', x: 56, y: 55 },
  { code: 'MT', name: 'Montana', x: 32, y: 25 },
  { code: 'NE', name: 'Nebraska', x: 45, y: 45 },
  { code: 'NV', name: 'Nevada', x: 16, y: 47 },
  { code: 'NH', name: 'New Hampshire', x: 88, y: 28 },
  { code: 'NJ', name: 'New Jersey', x: 83, y: 45 },
  { code: 'NM', name: 'New Mexico', x: 33, y: 65 },
  { code: 'NY', name: 'New York', x: 82, y: 36 },
  { code: 'NC', name: 'North Carolina', x: 76, y: 62 },
  { code: 'ND', name: 'North Dakota', x: 44, y: 25 },
  { code: 'OH', name: 'Ohio', x: 70, y: 47 },
  { code: 'OK', name: 'Oklahoma', x: 47, y: 64 },
  { code: 'OR', name: 'Oregon', x: 10, y: 32 },
  { code: 'PA', name: 'Pennsylvania', x: 78, y: 44 },
  { code: 'RI', name: 'Rhode Island', x: 90, y: 35 },
  { code: 'SC', name: 'South Carolina', x: 74, y: 68 },
  { code: 'SD', name: 'South Dakota', x: 44, y: 34 },
  { code: 'TN', name: ' Tennessee', x: 65, y: 63 },
  { code: 'TX', name: 'Texas', x: 43, y: 76 },
  { code: 'UT', name: 'Utah', x: 25, y: 51 },
  { code: 'VT', name: 'Vermont', x: 86, y: 29 },
  { code: 'VA', name: 'Virginia', x: 78, y: 56 },
  { code: 'WA', name: 'Washington', x: 11, y: 21 },
  { code: 'WV', name: 'West Virginia', x: 73, y: 53 },
  { code: 'WI', name: 'Wisconsin', x: 60, y: 34 },
  { code: 'WY', name: 'Wyoming', x: 33, y: 38 }
];

function requireMapElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing US Map Scaffold element: ${selector}`);
  return element;
}

function asObject(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function valueAt(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    current = asObject(current)[key];
  }
  return current;
}

function mapString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstString(record: AnyRecord, keys: string[]): string {
  for (const key of keys) {
    const value = mapString(record[key]);
    if (value) return value;
  }
  return '';
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePrecision(value: string, record: AnyRecord): MapPrecision {
  const lowered = value.toLowerCase();
  if (lowered === 'public_address' || lowered === 'public address') return 'public_address';
  if (lowered === 'city') return 'city';
  if (lowered === 'county') return 'county';
  if (lowered === 'state') return 'state';
  if (firstString(record, ['city', 'municipality', 'locality'])) return 'city';
  if (firstString(record, ['county', 'parish'])) return 'county';
  if (firstString(record, ['state', 'stateCode', 'state_code', 'region'])) return 'state';
  return 'unknown';
}

function normalizeState(value: string): StatePoint | null {
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return null;
  for (const point of statePoints) {
    if (point.code === cleaned || point.name.toUpperCase() === cleaned) return point;
  }
  return null;
}

function mapDigest(payload: unknown): string {
  const text = JSON.stringify(payload) || '';
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `dcl-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function mapEscape(value: unknown): string {
  return String(value ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

function parseMapJson(value: string): unknown | null {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function readArchiveEntries(): ArchiveEntryLike[] {
  const parsed = parseMapJson(localStorage.getItem(MAP_ARCHIVE_KEY) || '[]');
  return Array.isArray(parsed) ? (parsed as ArchiveEntryLike[]) : [];
}

function candidateRecordArrays(payload: unknown): unknown[][] {
  const arrays: unknown[][] = [];
  const candidates = [
    valueAt(payload, ['records', 'canonical']),
    valueAt(payload, ['records', 'reviewed']),
    valueAt(payload, ['records', 'all']),
    valueAt(payload, ['canonicalRecords']),
    valueAt(payload, ['canonical']),
    valueAt(payload, ['facilities']),
    valueAt(payload, ['dataCenters']),
    valueAt(payload, ['releaseManifest', 'records', 'canonical']),
    valueAt(payload, ['releaseManifest', 'records', 'reviewed']),
    valueAt(payload, ['releaseManifest', 'canonicalRecords'])
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) arrays.push(candidate);
  }

  if (Array.isArray(payload)) arrays.push(payload);
  return arrays;
}

function recordFromUnknown(value: unknown, sourceSchema: string, sourceLabel: string, sourceDigest: string): MapRecord | null {
  const record = asObject(value);
  if (Object.keys(record).length === 0) return null;

  const rawState = firstString(record, ['state', 'stateCode', 'state_code', 'region', 'province']);
  const statePoint = normalizeState(rawState);
  const city = firstString(record, ['city', 'municipality', 'locality']);
  const county = firstString(record, ['county', 'parish']);
  const precision = normalizePrecision(firstString(record, ['mapPrecision', 'precision', 'locationPrecision']), record);
  const digest = firstString(record, ['digest', 'recordDigest', 'id', 'recordId']) || mapDigest({ value, sourceDigest });

  return {
    id: firstString(record, ['id', 'recordId', 'facilityId']) || digest,
    title: firstString(record, ['title', 'name', 'facilityName', 'projectName']) || 'Unnamed data center record',
    operator: firstString(record, ['operator', 'company', 'owner', 'developer', 'entityName']) || 'Unknown operator',
    state: statePoint?.code || rawState || 'UNKNOWN',
    stateName: statePoint?.name.trim() || rawState || 'Unknown state',
    city,
    county,
    status: firstString(record, ['status', 'lifecycle', 'reviewStatus', 'canonicalStatus']) || 'unknown',
    evidenceClass: firstString(record, ['evidenceClass', 'evidence_class', 'sourceClass']) || 'unclassified',
    sourceQuality: numberOrNull(record.sourceQualityScore ?? record.sourceQuality ?? record.qualityScore),
    precision,
    digest,
    sourceSchema,
    sourceLabel
  };
}

function recordsFromPayload(payload: unknown, sourceSchema: string, sourceLabel: string, sourceDigest: string): MapRecord[] {
  const records: MapRecord[] = [];
  const arrays = candidateRecordArrays(payload);

  for (const array of arrays) {
    for (const item of array) {
      const record = recordFromUnknown(item, sourceSchema, sourceLabel, sourceDigest);
      if (record) records.push(record);
    }
  }

  return records;
}

function recordsFromArchive(): MapRecord[] {
  const records: MapRecord[] = [];
  for (const entry of readArchiveEntries()) {
    const payload = entry.payload || entry;
    const sourceSchema = entry.schema || mapString(asObject(payload).schema) || 'unknown';
    const sourceLabel = entry.label || entry.releaseName || 'Archived release artifact';
    const sourceDigest = entry.digest || mapDigest(payload);
    records.push(...recordsFromPayload(payload, sourceSchema, sourceLabel, sourceDigest));
  }

  const seen = new Set<string>();
  return records.filter((record) => {
    const key = `${record.digest}|${record.state}|${record.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clusterRecords(records: MapRecord[]): StateCluster[] {
  const clusters: StateCluster[] = [];
  for (const point of statePoints) {
    const stateRecords = records.filter((record) => record.state === point.code);
    if (stateRecords.length > 0) {
      clusters.push({ state: point.code, stateName: point.name.trim(), x: point.x, y: point.y, count: stateRecords.length, records: stateRecords });
    }
  }
  return clusters;
}

function mapSummary(records: MapRecord[], clusters: StateCluster[]) {
  return {
    totalRecords: records.length,
    mappedRecords: records.filter((record) => normalizeState(record.state) !== null).length,
    unmappedRecords: records.filter((record) => normalizeState(record.state) === null).length,
    statesRepresented: clusters.length,
    publicAddressRecords: records.filter((record) => record.precision === 'public_address').length,
    cityPrecisionRecords: records.filter((record) => record.precision === 'city').length,
    countyPrecisionRecords: records.filter((record) => record.precision === 'county').length,
    statePrecisionRecords: records.filter((record) => record.precision === 'state').length
  };
}

function buildMapLayerPacket(records: MapRecord[]): MapLayerPacket {
  const clusters = clusterRecords(records);
  const packet = {
    schema: 'DataCenterLedger.MapLayer.v3.2' as const,
    generatedAt: new Date().toISOString(),
    appVersion: MAP_APP_VERSION,
    records,
    clusters,
    summary: mapSummary(records, clusters),
    safetyBoundary: mapSafetyBoundary,
    precisionPolicy: mapPrecisionPolicy,
    reviewOnlyNotice: mapReviewOnlyNotice,
    mapLayerDigest: 'pending'
  };
  return { ...packet, mapLayerDigest: mapDigest(packet) };
}

function downloadMapJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2) || 'null'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function optionList() {
  return statePoints.map((point) => `<option value='${point.code}'>${point.code} — ${mapEscape(point.name.trim())}</option>`).join('');
}

function initUsMapScaffold() {
  if (document.getElementById('dcl-v32-us-map')) return;

  const mount = document.createElement('section');
  mount.id = 'dcl-v32-us-map';
  mount.className = 'panel us-map-panel v32-widget';
  mount.innerHTML = `
    <div class='panelHeader'>
      <div>
        <p class='eyebrow'>v3.2 US Map Scaffold</p>
        <h2>Map-safe data center record view</h2>
        <p>Read reviewed release artifacts from the local archive, cluster records by safe state-level markers, and export a review-only map layer packet.</p>
      </div>
      <span class='gate pass'><strong>local</strong><span>no network calls</span></span>
    </div>
    <div class='us-map-controls'>
      <label>Search records<input id='dcl-v32-search' placeholder='facility, operator, city, county, digest...' /></label>
      <label>State filter<select id='dcl-v32-state'><option value='all'>All states</option>${optionList()}<option value='UNKNOWN'>Unknown / unmapped</option></select></label>
      <label>Status filter<input id='dcl-v32-status' placeholder='planned, active, canonical, proposed...' /></label>
      <label>Precision filter<select id='dcl-v32-precision'><option value='all'>All precision</option><option value='state'>State</option><option value='county'>County</option><option value='city'>City</option><option value='public_address'>Public address</option><option value='unknown'>Unknown</option></select></label>
    </div>
    <div class='buttonRow'>
      <button id='dcl-v32-refresh'>Refresh map layer</button>
      <button id='dcl-v32-export'>Export MapLayer.v3.2</button>
    </div>
    <div id='dcl-v32-summary' class='map-summary'></div>
    <div class='us-map-layout'>
      <div id='dcl-v32-map' class='us-map-canvas' aria-label='Map-safe United States record clusters'></div>
      <div id='dcl-v32-drawer' class='us-map-drawer'></div>
    </div>
    <p class='boundary-note'>This map scaffold is review-only. Markers are safe regional prompts derived from local public-data artifacts. It does not discover private facilities, perform network lookups, or certify source truth.</p>
  `;

  const host = document.querySelector('main.shell') || document.querySelector('#root') || document.body;
  host.appendChild(mount);

  const searchInput = requireMapElement<HTMLInputElement>(mount, '#dcl-v32-search');
  const stateFilter = requireMapElement<HTMLSelectElement>(mount, '#dcl-v32-state');
  const statusFilter = requireMapElement<HTMLInputElement>(mount, '#dcl-v32-status');
  const precisionFilter = requireMapElement<HTMLSelectElement>(mount, '#dcl-v32-precision');
  const summaryNode = requireMapElement<HTMLDivElement>(mount, '#dcl-v32-summary');
  const mapNode = requireMapElement<HTMLDivElement>(mount, '#dcl-v32-map');
  const drawerNode = requireMapElement<HTMLDivElement>(mount, '#dcl-v32-drawer');

  let selectedState = 'all';

  function filteredRecords(): MapRecord[] {
    const query = searchInput.value.trim().toLowerCase();
    const state = stateFilter.value;
    const status = statusFilter.value.trim().toLowerCase();
    const precision = precisionFilter.value;

    return recordsFromArchive().filter((record) => {
      const matchesState = state === 'all' || record.state === state;
      const matchesPrecision = precision === 'all' || record.precision === precision;
      const matchesStatus = !status || record.status.toLowerCase().indexOf(status) >= 0;
      const haystack = `${record.title} ${record.operator} ${record.state} ${record.stateName} ${record.city} ${record.county} ${record.status} ${record.evidenceClass} ${record.digest}`.toLowerCase();
      return matchesState && matchesPrecision && matchesStatus && (!query || haystack.indexOf(query) >= 0);
    });
  }

  function renderDrawer(records: MapRecord[], title: string) {
    drawerNode.innerHTML = `
      <h3>${mapEscape(title)}</h3>
      <p>${records.length} review record${records.length === 1 ? '' : 's'} in this view.</p>
      <div class='map-record-list'>
        ${records.length ? records.map((record) => `
          <article class='map-record-card'>
            <p class='eyebrow'>${mapEscape(record.precision)} · ${mapEscape(record.status)}</p>
            <h4>${mapEscape(record.title)}</h4>
            <p>${mapEscape(record.operator)} · ${mapEscape(record.city || record.county || record.stateName)}</p>
            <p>Evidence: ${mapEscape(record.evidenceClass)} · Quality: ${record.sourceQuality === null ? 'n/a' : mapEscape(record.sourceQuality)}</p>
            <code>${mapEscape(record.digest)}</code>
          </article>
        `).join('') : `<div class='emptyArchive'>No records match the current filters.</div>`}
      </div>
    `;
  }

  function render() {
    const records = filteredRecords();
    const clusters = clusterRecords(records);
    const summary = mapSummary(records, clusters);

    summaryNode.innerHTML = `
      <div><strong>${summary.totalRecords}</strong><span>records</span></div>
      <div><strong>${summary.statesRepresented}</strong><span>states</span></div>
      <div><strong>${summary.cityPrecisionRecords}</strong><span>city precision</span></div>
      <div><strong>${summary.countyPrecisionRecords}</strong><span>county precision</span></div>
      <div><strong>${summary.statePrecisionRecords}</strong><span>state precision</span></div>
      <div><strong>${summary.unmappedRecords}</strong><span>unmapped</span></div>
    `;

    mapNode.innerHTML = `
      <div class='us-map-backdrop'><span>Map-safe US scaffold</span><small>State-level cluster markers only</small></div>
      ${clusters.map((cluster) => `
        <button class='state-marker ${selectedState === cluster.state ? 'selected' : ''}' style='left:${cluster.x}%;top:${cluster.y}%;' data-state='${cluster.state}' title='${mapEscape(cluster.stateName)}'>
          <strong>${cluster.count}</strong><span>${cluster.state}</span>
        </button>
      `).join('')}
    `;

    const drawerRecords = selectedState === 'all' ? records : records.filter((record) => record.state === selectedState);
    const title = selectedState === 'all' ? 'All filtered records' : `${selectedState} record drawer`;
    renderDrawer(drawerRecords, title);
  }

  mapNode.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const marker = target.closest<HTMLButtonElement>('button[data-state]');
    if (!marker) return;
    selectedState = marker.dataset.state || 'all';
    stateFilter.value = selectedState;
    render();
  });

  requireMapElement<HTMLButtonElement>(mount, '#dcl-v32-refresh').addEventListener('click', () => {
    selectedState = stateFilter.value;
    render();
  });

  requireMapElement<HTMLButtonElement>(mount, '#dcl-v32-export').addEventListener('click', () => {
    const records = filteredRecords();
    const packet = buildMapLayerPacket(records);
    localStorage.setItem(MAP_LAYER_KEY, JSON.stringify(packet));
    downloadMapJson('datacenter-ledger-us-map-layer-v3.2.json', packet);
  });

  [searchInput, stateFilter, statusFilter, precisionFilter].forEach((input) => {
    input.addEventListener('input', () => {
      selectedState = stateFilter.value;
      render();
    });
  });

  window.addEventListener('storage', render);
  render();
}

setTimeout(initUsMapScaffold, 0);
