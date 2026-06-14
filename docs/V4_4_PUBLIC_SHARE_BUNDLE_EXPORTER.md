# v4.4 Public Share Bundle Exporter

## Purpose

v4.4 packages the final public-share release chain into one local-first bundle:

1. `DataCenterLedger.PublicSharePacket.v4.1`
2. `DataCenterLedger.PublicShareRedactionAudit.v4.2`
3. `DataCenterLedger.PublicShareApproval.v4.3`

The result is `DataCenterLedger.PublicShareBundle.v4.4`.

## What it does

The bundle exporter:

- loads the latest share packet, redaction audit, and approval packet from browser storage
- accepts pasted or file-loaded JSON for all three inputs
- verifies that source digests match across the chain
- blocks bundles when audit blockers or approval failures are present
- allows review-state bundles only when v4.3 approval already accepted review warnings
- keeps sanitized public records, state clusters, public summary, source digests, and safety boundary text
- omits reviewer notes, reviewer names, staging internals, coordinates, coordinate basis, public address details, and internal review workspace fields
- exports a single `DataCenterLedger.PublicShareBundle.v4.4` JSON packet

## Local storage

The latest export-ready bundle is stored under:

```txt
 datacenter-ledger.public-share-bundle.v4.4
```

If the bundle gate is not export-ready, that storage key is cleared.

## Bundle gate

The gate blocks when:

- the v4.1 share packet is missing or invalid
- the v4.2 redaction audit is missing or invalid
- the v4.3 approval packet is missing or invalid
- the audit source share digest does not match the share packet digest
- the approval source share digest does not match the share packet digest
- the approval source audit digest does not match the redaction audit digest
- the audit has blockers
- the approval packet is not export-ready

The gate allows:

- `bundle_ready` when the audit is clear and approval is ready
- `review_bundle` when warnings were accepted by the v4.3 approval packet

## Public boundary

The bundle remains a public-facing review artifact.

It does not:

- prove source truth
- certify facility status
- discover private facilities
- authorize sensitive publication
- enrich or reveal exact locations
- create a complete national map

## Suggested workflow

1. Build v4.1 public share packet.
2. Run v4.2 redaction audit.
3. Approve with v4.3 approval gate.
4. Build v4.4 public share bundle.
5. Export the bundle for public release review.
