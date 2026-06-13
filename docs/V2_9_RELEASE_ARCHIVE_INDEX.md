# v2.9 Release Archive Index

v2.9 adds a local release archive index for saved governance manifests, release diffs, and release signoff packets.

The archive is browser-local. It does not use a backend, does not call outside services, and does not validate public records against outside sources.

## What it stores

The archive accepts JSON packets with these schemas:

- `DataCenterLedger.GovernanceReleaseManifest.*`
- `DataCenterLedger.ManifestCompare.*`
- `DataCenterLedger.ReleaseSignoffPacket.*`

Each archived item keeps:

- artifact kind
- schema
- release name or label
- app version where available
- digest
- decision where available
- readiness summary where available
- canonical count
- pending approvals
- blocker and warning counts
- imported timestamp
- original payload

## Export schema

The archive export uses:

```json
{
  "schema": "DataCenterLedger.ReleaseArchiveIndex.v2.9",
  "generatedAt": "ISO-8601 timestamp",
  "appVersion": "2.9.0",
  "entries": [],
  "summary": {
    "total": 0,
    "manifests": 0,
    "diffs": 0,
    "signoffs": 0,
    "approvedSignoffs": 0,
    "heldSignoffs": 0,
    "needsReviewSignoffs": 0
  },
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "archiveDigest": "dcl-..."
}
```

## Filters

The v2.9 widget supports local filtering by:

- artifact kind
- signoff decision
- digest
- release name
- schema

## Signoff handoff

If the v2.8 release signoff widget is present, an archived manifest or diff can be sent into the signoff text boxes. This is a convenience handoff only. It does not approve, publish, or certify the packet.

## Safety boundary

A release archive index is a local review convenience. It is not:

- proof of truth
- a complete registry
- legal authorization
- source certification
- a security review
- permission to publish sensitive infrastructure details
- a backend archive

## Suggested review flow

1. Export a governance release manifest from v2.6.
2. Compare it against a previous manifest in v2.7.
3. Generate a signoff packet in v2.8.
4. Archive all three packets in v2.9.
5. Export the archive index for local review continuity.

## Non-goals

v2.9 does not automatically gather, upload, publish, or verify external records. It only indexes release packets intentionally loaded by the local reviewer.
