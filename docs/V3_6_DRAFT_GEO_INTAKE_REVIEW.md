# v3.6 Draft Geo Intake Review

v3.6 adds the local human-review gate between the v3.5 geo staging bridge and any future map-intake layer.

It is designed for public-data review. It does not prove source truth, certify facility status, discover facilities, publish exact locations, or create a complete national map.

## Input

The intake reviewer can load either:

- the latest browser-stored `DataCenterLedger.GeoStagingBridge.v3.5` packet, or
- a pasted/uploaded v3.5 bridge JSON file.

The bridge packet contains draft geo records created from validated v3.4 staged rows.

## Review decisions

Each draft record can receive one of three reviewer decisions:

- `approved_geo_intake` — the draft can proceed as a local map-intake candidate.
- `held_geo_intake` — the draft needs more evidence, review context, or cleanup.
- `rejected_geo_intake` — the draft should not enter the map-intake lane.

Pending records remain visible in the exported packet as `pending` decisions.

## Reviewer notes

Each decision can include reviewer notes. Notes should explain why the record was approved, held, or rejected.

Examples:

- “City-level only until public address basis is confirmed.”
- “Hold for missing planning-record link.”
- “Reject because state/evidence combination appears mismatched.”

## Exported packet

v3.6 exports:

```json
{
  "schema": "DataCenterLedger.GeoIntakeReview.v3.6",
  "generatedAt": "...",
  "appVersion": "3.6.0",
  "sourceBridge": {
    "schema": "DataCenterLedger.GeoStagingBridge.v3.5",
    "bridgeDigest": "...",
    "generatedAt": "...",
    "draftRecordCount": 0,
    "sourceBatchDigest": "..."
  },
  "decisionSummary": {
    "totalDrafts": 0,
    "approved": 0,
    "held": 0,
    "rejected": 0,
    "pending": 0,
    "mapEligible": 0
  },
  "intakeRecords": [],
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "intakeDigest": "..."
}
```

## Local storage

The latest exported intake packet is stored under:

```txt
datacenter-ledger.geo-intake-review.v3.6
```

This storage is local to the browser.

## Safety boundary

v3.6 preserves the map-safety stance:

- Public-source review only.
- No hidden network calls.
- No private facility discovery.
- No sensitive enrichment.
- Draft geo records remain claims until reviewed.
- Approved intake records are map candidates, not proof of source truth.

## Non-goals

v3.6 does not:

- promote records to canonical status,
- verify facility existence,
- certify a complete U.S. registry,
- publish exact addresses or coordinates,
- bypass human review,
- or perform external lookups.

## Review flow

Recommended flow:

1. Import rows through v3.4.
2. Export a v3.4 import batch.
3. Build a v3.5 staging bridge from staged rows.
4. Review each draft record in v3.6.
5. Export the v3.6 intake packet.
6. Feed approved intake records into a future map-intake/canonical-review step.
