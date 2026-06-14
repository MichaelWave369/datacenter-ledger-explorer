# v4.3 Public Share Approval Gate

The v4.3 sprint adds a final local approval gate for sanitized public share packets.

It reads two local artifacts:

- `DataCenterLedger.PublicSharePacket.v4.1`
- `DataCenterLedger.PublicShareRedactionAudit.v4.2`

It produces:

- `DataCenterLedger.PublicShareApproval.v4.3`

## Purpose

v4.3 prevents a public share packet from being treated as approved unless it has passed the redaction-audit path.

The gate checks that:

- a valid v4.1 public share packet is loaded
- a valid v4.2 redaction audit is loaded
- the audit source share digest matches the loaded share packet digest
- blocked audit reports cannot be approved
- clear audit reports can be approved with a reviewer name
- review-state audit reports require warning acceptance and a reviewer note

## Local storage

The latest export-ready approval packet is stored under:

```text
datacenter-ledger.public-share-approval.v4.3
```

If the gate is not export-ready, the storage key is cleared.

## Export schema

```text
DataCenterLedger.PublicShareApproval.v4.3
```

The approval packet includes:

- gate status
- reviewer name
- reviewer note
- review warning acceptance flag
- source share packet digest
- source redaction audit digest
- audit status and finding counts
- approved public share summary
- approved public records from the sanitized packet
- omitted-field declarations
- safety boundary
- approval digest

## Gate outcomes

| Outcome | Meaning |
|---|---|
| `approval_ready` | Public share packet may be exported with approval metadata. |
| `review_acceptance_required` | Audit is review-state or needs reviewer acceptance details. |
| `blocked` | Audit has blockers or the source digest does not match. |
| `missing_inputs` | Required v4.1 or v4.2 input is missing or invalid. |

## Public boundary

v4.3 does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

It only confirms that a sanitized local public share packet has passed the local redaction audit and approval gate.

## Recommended workflow

1. Build a v4.1 public share packet.
2. Run the v4.2 public share redaction audit.
3. Load both artifacts into v4.3.
4. Add reviewer name.
5. If audit status is `review`, explicitly accept warnings and add a reviewer note.
6. Export `DataCenterLedger.PublicShareApproval.v4.3`.
