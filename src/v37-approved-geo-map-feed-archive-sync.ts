export {};

const APPROVED_GEO_MAP_FEED_KEY = "datacenter-ledger.approved-geo-map-feed.v3.7";
const RELEASE_ARCHIVE_KEY = "datacenter-ledger.release-archive.v2.9";

type ApprovedGeoFeedLike = {
  schema?: string;
  generatedAt?: string;
  feedDigest?: string;
  mapRecords?: unknown[];
};

type ArchiveEntryLike = {
  kind?: string;
  schema?: string;
  label?: string;
  digest?: string;
  createdAt?: string;
  payload?: unknown;
};

function parseFeedSyncJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isFeedLike(value: unknown): value is ApprovedGeoFeedLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as ApprovedGeoFeedLike).schema === "DataCenterLedger.ApprovedGeoMapFeed.v3.7" &&
      typeof (value as ApprovedGeoFeedLike).feedDigest === "string" &&
      Array.isArray((value as ApprovedGeoFeedLike).mapRecords)
  );
}

function readArchiveEntries(): ArchiveEntryLike[] {
  const parsed = parseFeedSyncJson(localStorage.getItem(RELEASE_ARCHIVE_KEY));
  return Array.isArray(parsed) ? (parsed as ArchiveEntryLike[]) : [];
}

function syncApprovedGeoFeedToArchive() {
  const parsed = parseFeedSyncJson(localStorage.getItem(APPROVED_GEO_MAP_FEED_KEY));
  if (!isFeedLike(parsed)) {
    return;
  }

  const mapRecords = parsed.mapRecords ?? [];
  const payload = {
    ...parsed,
    records: {
      reviewed: mapRecords
    },
    facilities: mapRecords
  };

  const digest = parsed.feedDigest ?? "unknown";
  const existing = readArchiveEntries();
  const withoutCurrentFeed = existing.filter((entry) => !(entry.schema === parsed.schema && entry.digest === digest));
  const archiveEntry: ArchiveEntryLike = {
    kind: "approved_geo_map_feed",
    schema: parsed.schema,
    label: `Approved Geo Map Feed ${digest}`,
    digest,
    createdAt: parsed.generatedAt ?? new Date().toISOString(),
    payload
  };

  localStorage.setItem(RELEASE_ARCHIVE_KEY, JSON.stringify([archiveEntry, ...withoutCurrentFeed]));
  window.dispatchEvent(new Event("storage"));
}

window.addEventListener("dcl:approved-geo-map-feed-updated", syncApprovedGeoFeedToArchive);
setTimeout(syncApprovedGeoFeedToArchive, 0);
