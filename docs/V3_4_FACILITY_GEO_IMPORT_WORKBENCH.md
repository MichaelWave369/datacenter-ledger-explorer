# v3.4 Facility Geo Import Workbench

## Purpose

The v3.4 Facility Geo Import Workbench turns the v3.3 facility geo schema into a local CSV review lane.

It is designed to help reviewers validate map-safe public facility rows before they enter later review, staging, and map workflows.

## Public safety boundary

The import workbench is bounded by the same public-data rules as the map lane:

- public-source review only
- no hidden network calls
- no private facility discovery
- no sensitive enrichment
- exact address or coordinates require public-source basis fields
- imported rows remain staged claims until reviewed

The workbench does not verify source truth, authorize exact-location publication, discover facilities, or create a complete national map.

## Input format

The workbench accepts CSV text or a local CSV file using the v3.3 facility geo columns:

```text
recordId,title,operator,state,county,city,geoPrecision,locationEvidenceClass,locationEvidenceUrl,locationConfidence,publicAddress,latitude,longitude,coordinateBasis,reviewStatus,geoNotes
```

Required fields:

- `recordId`
- `title`
- `state`
- `geoPrecision`
- `locationEvidenceClass`
- `locationEvidenceUrl`
- `locationConfidence`

## Validation behavior

Rows are marked as one of three statuses:

- `staged` — no blockers or warnings
- `warning` — no blockers, but reviewer attention is needed
- `blocked` — cannot enter the staged output until fixed

Blockers include:

- missing required fields
- invalid state abbreviation
- invalid precision label
- invalid evidence class
- invalid review status
- invalid evidence URL
- location confidence outside `0` to `100`
- duplicate `recordId` in the same import batch
- latitude without longitude or longitude without latitude
- coordinates without `coordinateBasis`

Warnings include:

- county precision without county
- city precision without city
- public-address precision without public address
- public address supplied while precision is not `public_address`
- approximate precision without explanatory geo notes

## Export packet

The workbench exports:

```text
DataCenterLedger.FacilityGeoImportBatch.v3.4
```

The export includes:

- generated timestamp
- app version
- input column list
- row count
- staged count
- warning count
- blocked count
- staged rows
- warning rows
- blocked rows
- public-safety boundary
- review-only notice
- batch digest

The last exported batch is also stored locally under:

```text
datacenter-ledger.facility-geo-import-batch.v3.4
```

## Review flow

Recommended flow:

1. Export the v3.3 CSV template.
2. Fill rows from public evidence only.
3. Paste or load the CSV into v3.4.
4. Fix blockers.
5. Review warnings.
6. Export the v3.4 import batch.
7. Use a later sprint to stage safe rows into the review/canonical pipeline.

## Non-goals

v3.4 does not:

- fetch external data
- geocode addresses
- infer private facility locations
- prove that a facility exists
- certify a source as true
- publish records automatically
- bypass human review
