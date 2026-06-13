# v1.3 Receipt Editor Workbench

DataCenterLedger Explorer v1.3 adds a local-first receipt editor for selected records.

The goal is to let reviewers move from rough import rows to stronger, source-backed Ledger records without adding a backend, hidden network calls, or sensitive enrichment.

## What changed

- A selected record now has a **Receipt Editor** panel.
- Reviewers can add a source receipt with:
  - source name
  - source type
  - public URL
  - retrieved date
  - confidence label
  - exact claim text
- The editor validates drafts before a receipt can be added.
- Receipt additions create local edit-history entries with deterministic digests.
- The app can export a selected-record receipt packet and full receipt history packet.

## Receipt draft validation

Blocking issues:

- missing source name
- missing claim text
- invalid retrieved date
- invalid source URL format

Warnings:

- missing public URL
- very short claim text

Info:

- source type is `other`

## Warning resolution

When a receipt is added, the app tries to resolve matching review warnings on the selected record.

Examples:

- a permit receipt can resolve `Needs permit source`
- a utility receipt can resolve `Needs utility source`
- an operator receipt can resolve operator confirmation warnings
- a second public receipt can resolve second-source warnings
- a public URL can resolve source-link warnings

The app does not claim the record is true just because a receipt was added. The record still must pass the canonical gate.

## Public safety posture

The receipt editor is for public source links and public claims only.

Do not use it to store:

- private access details
- sensitive layouts
- private coordinates
- non-public enrichment
- instructions that could help target infrastructure

## Export schemas

v1.3 adds or updates these export schemas:

- `DataCenterLedger.Export.v1.3-receipt-editor`
- `DataCenterLedger.CanonicalRegistry.v1.3-receipt-editor`
- `DataCenterLedger.SelectedReceiptPacket.v1.3`
- `DataCenterLedger.ReceiptEditHistory.v1.3`
- `DataCenterLedger.PublicLaunchPacket.v1.3`
- `DataCenterLedger.ImportPreview.v1.3`
- `DataCenterLedger.ImportHistory.v1.3`

## Suggested review flow

1. Import or select a record.
2. Read the canonical blockers and review warnings.
3. Add a public receipt that supports one specific claim.
4. Confirm which warnings were resolved.
5. Export the selected receipt packet for human review.
6. Promote only after confidence, precision, and receipts are strong enough.
