# v3.2 US Map Scaffold

DataCenterLedger Explorer v3.2 starts the map lane with a local-first, map-safe U.S. record scaffold.

The feature does **not** add a backend, external map service, hidden network calls, facility discovery, or exact-location enrichment. It reads only local browser artifacts that the reviewer has already placed into the release archive.

## Purpose

The goal is to turn reviewed release artifacts into a visual review surface:

1. Read governance release artifacts from the v2.9 local archive.
2. Extract canonical or reviewed record arrays when present.
3. Normalize each record into a simple `MapRecord` shape.
4. Cluster records by safe state-level markers.
5. Let reviewers filter and inspect records from a local drawer.
6. Export a review-only `DataCenterLedger.MapLayer.v3.2` packet.

## Storage inputs

The scaffold reads this existing localStorage key:

```txt
 datacenter-ledger.release-archive.v2.9
```

That key is populated by the v2.9 Release Archive Index. The map scaffold does not create a new data-ingest lane and does not fetch remote data.

## Exported map layer

The export schema is:

```txt
DataCenterLedger.MapLayer.v3.2
```

The exported packet contains:

- `generatedAt`
- `appVersion`
- normalized `records`
- state-level `clusters`
- summary counts
- safety boundary
- precision policy
- review-only notice
- `mapLayerDigest`

The last exported packet is also saved locally under:

```txt
datacenter-ledger.us-map-layer.v3.2
```

## MapRecord shape

Each extracted record is normalized into:

- `id`
- `title`
- `operator`
- `state`
- `stateName`
- `city`
- `county`
- `status`
- `evidenceClass`
- `sourceQuality`
- `precision`
- `digest`
- `sourceSchema`
- `sourceLabel`

The extractor is intentionally flexible because older release packets may name fields differently. It looks for common public-record keys such as `name`, `facilityName`, `projectName`, `operator`, `company`, `owner`, `city`, `county`, `state`, `status`, `evidenceClass`, and source-quality fields.

## Precision policy

The map scaffold uses precision labels instead of treating every record as exact:

- `state`: state-level public claim or unresolved location signal
- `county`: county-level public claim; no exact coordinates implied
- `city`: city-level public claim; no exact facility boundary implied
- `public_address`: only when already published by a public source and reviewed
- `unknown`: unmapped until public location evidence is reviewed

The v3.2 UI displays state-level cluster markers only. Even when a record has city or county precision, the scaffold renders it as part of a state cluster and shows precision details in the drawer.

## UI behavior

The panel provides:

- search by facility/operator/city/county/digest
- state filter
- status filter
- precision filter
- state cluster markers
- selected-state record drawer
- map layer export

The current scaffold is intentionally lightweight. It is a staging layer for the next real map iterations.

## Safety boundary

v3.2 keeps the same civic-safety posture:

- public-data only
- no hidden network calls
- no private facility discovery
- no security-sensitive enrichment
- no exact-location enrichment unless already public and reviewed
- map markers are review prompts, not proof of truth and not a targeting map

## Non-goals

v3.2 does not:

- certify that a data center exists
- claim national completeness
- scrape public or private systems
- call a map API
- publish facility coordinates
- infer exact facility boundaries
- replace source review, two-person approval, release signoff, or library integrity checks

## Next sprint direction

The next map sprint should be **v3.3 Facility Geo Record Schema**:

- explicit geo precision fields
- source-backed location evidence
- confidence and review status per location claim
- support for city/county/state/public-address display modes
- import template fields for map-safe location metadata
