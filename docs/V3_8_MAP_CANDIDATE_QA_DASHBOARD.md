# V3.8 Map Candidate QA Dashboard

V3.8 adds a local QA layer for approved geo map-feed candidates before they are treated as final map-layer material.

## Purpose

The dashboard reads `DataCenterLedger.ApprovedGeoMapFeed.v3.7` packets and produces `DataCenterLedger.MapCandidateQAReport.v3.8` packets.

The goal is to flag review issues before map release work, including missing evidence, low confidence, duplicate identifiers, exact-location review concerns, coordinate-basis gaps, and upstream warning carryover.

## Local storage

- Approved map feed input: `datacenter-ledger.approved-geo-map-feed.v3.7`
- QA report output: `datacenter-ledger.map-candidate-qa-report.v3.8`

## Report schema

```json
{
  "schema": "DataCenterLedger.MapCandidateQAReport.v3.8",
  "generatedAt": "ISO timestamp",
  "appVersion": "3.8.0",
  "sourceFeed": {
    "schema": "source feed schema",
    "feedDigest": "source feed digest",
    "generatedAt": "source generated timestamp",
    "candidateCount": 0
  },
  "summary": {
    "status": "empty | blocked | review | clear",
    "totalCandidates": 0,
    "passCandidates": 0,
    "blockedCandidates": 0,
    "warningCandidates": 0,
    "infoCandidates": 0,
    "blockerFindings": 0,
    "warningFindings": 0,
    "infoFindings": 0,
    "missingEvidenceUrls": 0,
    "lowConfidenceRecords": 0,
    "exactPrecisionRecords": 0,
    "duplicateRecordIds": 0,
    "duplicateFeedDigests": 0,
    "statesRepresented": 0
  },
  "findings": [],
  "checkedRecords": [],
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "reportDigest": "mapqa-..."
}
```

## Finding severities

- `blocker`: the candidate should not move into a final map layer until fixed.
- `warning`: the candidate can remain under review but needs attention.
- `info`: the candidate carries context that reviewers should inspect.

## Checks included

- missing record ID
- duplicate record ID
- missing feed digest
- duplicate feed digest
- missing state
- unknown precision label
- missing public evidence URL
- evidence URL that does not parse as HTTP or HTTPS
- missing evidence class
- missing location confidence
- confidence below 0.60
- confidence outside the 0 to 1 range
- public-address precision
- public address field present
- partial coordinate pair
- coordinates without coordinate basis
- upstream warning count
- missing intake decision receipt digest

## Review flow

1. Build or load a v3.7 approved geo map feed.
2. Open the v3.8 QA dashboard.
3. Load latest feed or paste/load JSON.
4. Run QA.
5. Review blockers and warnings.
6. Export the QA report.
7. Resolve blockers before final map-layer export work.

## Public boundary

- Public-source review only.
- No hidden network calls.
- No private facility discovery.
- No extra enrichment.
- QA findings are review signals, not proof of source truth or completeness.
- Exact or address-level precision stays review-visible before public map use.

## Non-goals

V3.8 does not verify source truth, discover facilities, certify facility status, publish final public locations, or make a complete national database.
