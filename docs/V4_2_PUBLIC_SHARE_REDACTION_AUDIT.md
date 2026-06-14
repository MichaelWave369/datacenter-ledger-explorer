# v4.2 Public Share Redaction Audit

v4.2 adds a final review layer for public share packets before they are reused outside the local review cockpit.

It reads `DataCenterLedger.PublicSharePacket.v4.1` and exports:

```txt
DataCenterLedger.PublicShareRedactionAudit.v4.2
```

## Purpose

The v4.1 public share packet is already sanitized, but v4.2 gives the reviewer a second check before sharing. It audits the packet for:

- internal or reviewer-only field names
- staging, bridge, intake, row, batch, or decision receipt leakage
- coordinate-like decimal text
- address-related field keys
- missing evidence URLs
- missing state codes
- missing evidence class labels
- missing or low confidence values
- public-address precision records that need extra review
- missing public-share notices or safety boundaries
- missing omitted-field declarations

## Local storage

The latest v4.2 audit report is stored locally under:

```txt
datacenter-ledger.public-share-redaction-audit.v4.2
```

The source v4.1 packet is read from:

```txt
datacenter-ledger.public-share-packet.v4.1
```

## Report status

The audit report can be:

```txt
clear   - no blockers or warnings found
review  - warnings found; human review recommended before sharing
blocked - blockers found; do not share until corrected
```

## Boundary

The v4.2 audit does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or represent a complete national map.

It is a public-share safety review tool.

## Suggested workflow

1. Build a v4.1 public share packet.
2. Open v4.2 Public Share Redaction Audit.
3. Load the latest public share packet or paste/load a v4.1 JSON packet.
4. Run the audit.
5. Review blockers and warnings.
6. Export the v4.2 audit report.
7. Only share packets that are clear or have intentionally reviewed warnings.

## Next sprint

v4.3 should turn the v4.2 audit result into a Public Share Approval Gate, where sharing requires either a clear audit or an explicit reviewer acceptance of warning-state packets.
