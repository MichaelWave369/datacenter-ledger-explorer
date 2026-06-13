# v3.7 Approved Geo Intake Map Feed

v3.7 adds the approved geo map-feed handoff between the v3.6 intake review gate and the v3.2 map scaffold.

The goal is to make the map consume only records that have passed a local human geo-intake decision.

## What it does

- Loads the latest `DataCenterLedger.GeoIntakeReview.v3.6` packet from browser storage.
- Allows a reviewer to paste or load a v3.6 intake JSON file.
- Keeps only records that are both:
  - `eligibleForMapLayer: true`
  - `decision.status: approved_geo_intake`
- Converts approved intake records into map-feed records.
- Preserves the reviewer, decision receipt digest, source row digest, source batch digest, bridge digest, and intake digest.
- Stores the last feed under `datacenter-ledger.approved-geo-map-feed.v3.7`.
- Exports `DataCenterLedger.ApprovedGeoMapFeed.v3.7`.
- Syncs an archive-compatible local entry so the existing v3.2 map scaffold can read the approved feed through the v2.9 release archive path.

## Packet schema

```json
{
  "schema": "DataCenterLedger.ApprovedGeoMapFeed.v3.7",
  "generatedAt": "ISO-8601 timestamp",
  "appVersion": "3.7.0",
  "sourceIntake": {
    "schema": "DataCenterLedger.GeoIntakeReview.v3.6",
    "intakeDigest": "...",
    "generatedAt": "...",
    "approved": 0,
    "held": 0,
    "rejected": 0,
    "pending": 0,
    "mapEligible": 0
  },
  "summary": {
    "approvedMapRecords": 0,
    "statesRepresented": 0,
    "cityPrecisionRecords": 0,
    "countyPrecisionRecords": 0,
    "statePrecisionRecords": 0,
    "publicAddressRecords": 0,
    "warningRecords": 0
  },
  "mapRecords": [],
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "feedDigest": "..."
}
```

## Map-feed records

Each map-feed record includes:

- `recordId`
- `draftId`
- `title`
- `operator`
- `state`
- `county`
- `city`
- `mapPrecision`
- `geoPrecision`
- `publicAddress`
- `latitude`
- `longitude`
- `coordinateBasis`
- `status: approved_geo_map_candidate`
- `evidenceClass`
- `evidenceUrl`
- `locationConfidence`
- `sourceQualityScore`
- `sourceRowDigest`
- `sourceBatchDigest`
- `sourceBridgeDigest`
- `sourceIntakeDigest`
- `decisionReceiptDigest`
- `approvedBy`
- `approvedAt`
- `reviewerNotes`
- `warningCount`
- `mapFeedRecordDigest`

## Archive-compatible map sync

The v3.2 map scaffold already reads records through the local v2.9 release archive path. v3.7 adds a local archive-sync helper that writes an archive-compatible entry with:

- `kind: approved_geo_map_feed`
- `schema: DataCenterLedger.ApprovedGeoMapFeed.v3.7`
- `digest: feedDigest`
- `payload.records.reviewed`
- `payload.facilities`

This keeps the existing map reader stable while giving approved geo intake records a clear path into the map layer.

## Safety boundary

v3.7 does not verify source truth. It does not certify facility status. It does not discover facilities. It does not authorize sensitive publication. It does not make a complete national map.

The feed is still a review handoff. Exact-location fields remain bounded by the evidence, precision, and reviewer decisions captured upstream.

## Review flow

1. Import geo rows with v3.4.
2. Build draft records with v3.5.
3. Review draft records with v3.6.
4. Build the approved map feed with v3.7.
5. Refresh the v3.2 map scaffold.
6. Export a map layer packet only after review.
