# v3.5 Geo Import Staging Bridge

v3.5 turns clean v3.4 facility geo import rows into draft review records with local staging receipts.

The bridge is local-first and public-safe. It does not add a backend, make hidden network calls, discover facilities, verify source truth, promote canonical status, or authorize exact-location publication.

## Purpose

The v3.4 import workbench validates CSV rows and exports `DataCenterLedger.FacilityGeoImportBatch.v3.4`.

The v3.5 staging bridge takes that batch and creates a review handoff packet:

- staged rows become draft geo review records
- blocked rows stay excluded
- warning rows remain staged but warning-visible
- each draft record receives a staging receipt
- exact address and coordinate fields remain review-gated
- the packet can be saved locally and exported for reviewer intake

## Storage

v3.5 reads the latest v3.4 batch from:

```txt
 datacenter-ledger.facility-geo-import-batch.v3.4
```

v3.5 stores the latest bridge packet at:

```txt
 datacenter-ledger.geo-staging-bridge.v3.5
```

## Export schema

The export schema is:

```txt
DataCenterLedger.GeoStagingBridge.v3.5
```

A packet includes:

- schema
- generated timestamp
- app version
- source batch metadata
- draft record count
- warning record count
- blocked rows excluded
- draft review records
- staging receipts
- safety boundary
- review-only notice
- bridge digest

## Draft record shape

Each draft record includes:

- draft ID
- source record ID
- title
- operator
- draft review status
- state
- county
- city
- geo precision
- public address if supplied
- latitude and longitude if supplied
- coordinate basis if supplied
- location evidence class
- location evidence URL
- location confidence
- map-safety flags
- source batch digest
- source row digest
- staging timestamp
- geo notes

## Receipts

Each staged row receives a `stage_geo_import_row` receipt with:

- receipt ID
- created timestamp
- source batch digest
- source row digest
- draft ID
- source record ID
- warnings
- digest

The receipt records the handoff event. It is not proof that the source is true.

## Safety boundary

The bridge packet carries this boundary:

- Public-source review only.
- No hidden network calls.
- No private facility discovery.
- No sensitive enrichment.
- Draft geo records remain review claims until promoted by a reviewer.
- Exact address or coordinates remain gated by public-source basis and human review.

## Review flow

1. Validate facility geo CSV rows in v3.4.
2. Export or save the v3.4 import batch.
3. Open v3.5 and load the latest batch or a batch JSON file.
4. Build the draft queue.
5. Review warnings and blocked-row counts.
6. Export the v3.5 bridge packet.
7. Use the bridge packet as a local reviewer handoff for future workspace intake.

## Non-goals

v3.5 does not:

- certify source truth
- publish a public map
- discover facilities
- make a complete national registry
- promote draft rows into canonical records
- bypass reviewer approval
- authorize exact-location disclosure
