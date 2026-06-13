# v2.8 Release Signoff Packet

v2.8 adds a local signoff layer for release decisions. It is designed to sit after the governance release manifest and manifest compare workflows.

The signoff packet is a review artifact. It does not certify that a release is true, complete, legally authorized, security-cleared, or safe to publish. It preserves the reviewer decision, checklist state, public-safety boundary, optional manifest diff, and deterministic digest for later review.

## What the widget does

The v2.8 widget lets a reviewer:

1. Paste or load a `DataCenterLedger.GovernanceReleaseManifest` JSON packet.
2. Optionally paste or load a `DataCenterLedger.ManifestCompare` JSON packet.
3. Choose a decision:
   - `approve_release`
   - `hold_release`
   - `needs_more_review`
4. Enter final reviewer notes.
5. Refresh a signoff checklist.
6. Export `DataCenterLedger.ReleaseSignoffPacket.v2.8`.

## Checklist gates

The widget checks:

- governance manifest attached
- manifest schema recognized
- release readiness reviewed
- pending approvals checked
- canonical records present
- manifest diff attached or intentionally omitted
- two-person policy preserved
- reviewer and notes supplied

Checklist entries are marked as:

- `pass`
- `warn`
- `block`

A warning does not mean the packet is invalid. It means a reviewer should read and understand the gap before using the packet publicly.

## Export schema

The exported packet includes:

```json
{
  "schema": "DataCenterLedger.ReleaseSignoffPacket.v2.8",
  "generatedAt": "ISO-8601 timestamp",
  "appVersion": "2.8.0",
  "releaseName": "manifest release name",
  "decision": "approve_release | hold_release | needs_more_review",
  "signoffReviewer": "reviewer name",
  "signoffRole": "manifest active role or unknown",
  "signoffNotes": "final reviewer notes",
  "signoffChecklist": [],
  "finalBlockers": [],
  "finalWarnings": [],
  "releaseManifest": {},
  "manifestDiff": {},
  "twoPersonPolicy": [],
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "packetDigest": "dcl-..."
}
```

## Public-safety boundary

The signoff packet repeats the release safety boundary:

- public-data only
- no hidden network calls
- no private facility discovery
- no security-sensitive enrichment
- review-only, not proof of truth
- not a targeting map

## Recommended flow

1. Review records and receipts.
2. Resolve or document approval queue items.
3. Export a governance release manifest.
4. Compare against the previous manifest when available.
5. Paste the manifest and optional diff into the v2.8 widget.
6. Choose the signoff decision.
7. Add final reviewer notes.
8. Export the release signoff packet.
9. Keep the signoff packet with the manifest and any public brief used for publication.

## Non-goals

The v2.8 signoff packet is not authentication, not legal approval, not facility verification, not cybersecurity clearance, and not proof that any source or claim is true. It is a local governance receipt for a public-data review workflow.
