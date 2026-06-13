# v3.9 Final Map Layer Export Gate

## Purpose

v3.9 adds the final local gate before approved geo records become an exportable map-layer packet.

It requires both:

1. `DataCenterLedger.ApprovedGeoMapFeed.v3.7`
2. `DataCenterLedger.MapCandidateQAReport.v3.8`

The gate checks that the v3.8 QA report was generated from the same v3.7 map feed by comparing the feed digest.

## Export schema

```txt
DataCenterLedger.FinalMapLayer.v3.9
```

The latest successful export is stored locally under:

```txt
datacenter-ledger.final-map-layer.v3.9
```

## Gate outcomes

The gate can produce four statuses:

| Status | Meaning |
| --- | --- |
| `missing_inputs` | The feed or QA report is missing or invalid. |
| `blocked` | The QA report is empty, mismatched, or has unresolved blockers. |
| `review_required` | QA has warnings and needs explicit reviewer acceptance. |
| `export_ready` | The final map layer can be exported. |

## Export rules

The export button only releases a final map-layer JSON packet when the gate status is:

```txt
export_ready
```

A clear QA report can become export-ready directly if the feed digest matches.

A review-status QA report can become export-ready only when:

- the reviewer enters a reviewer name
- the reviewer adds a review note
- the reviewer checks the warning-acceptance box
- there are no unresolved blocker findings

Blocked or empty QA reports cannot export a final map layer.

## Final map records

Each final record preserves:

- record ID
- title and operator
- state, county, city, and precision
- optional public address / coordinates if present upstream
- evidence class and URL
- confidence score
- QA status and warning count
- reviewer notes
- approval lineage
- source feed digest
- source QA report digest
- source map-feed record digest
- row, batch, bridge, intake, and decision receipt digests
- final record digest

## Safety boundary

v3.9 keeps the same public-data boundaries:

- public-source review only
- no hidden network calls
- no private facility discovery
- no sensitive enrichment
- final map layers require matching v3.8 QA and v3.7 approved feed packets
- blocked QA reports cannot be exported as final map layers
- warning-state QA reports require explicit reviewer acceptance

## Non-goals

v3.9 does not:

- prove source truth
- certify facility status
- discover facilities
- authorize sensitive publication
- create a complete national map
- bypass QA blockers
- bypass human review for warning-state reports

## Suggested manual test

1. Create or load a v3.7 approved geo map feed.
2. Run v3.8 QA against that feed.
3. Load latest feed + QA in v3.9.
4. Confirm blocked QA cannot export.
5. Confirm review-status QA requires reviewer name, note, and warning acceptance.
6. Export a final map layer only after the gate says `export_ready`.
