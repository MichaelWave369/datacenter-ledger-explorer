# v2.0 Canonical Review Mode

DataCenterLedger Explorer v2.0 changes promotion from a simple local action into an explicit, checklist-backed review workflow.

The goal is to make `promoted_public` records easier to audit while preserving the project boundary: public-data only, no hidden network calls, no private facility discovery, no security-sensitive enrichment, and no targeting-map behavior.

## What changed

- Added a selected-record **Canonical Review Mode** cockpit.
- Added a `reviewed` lifecycle step before `promoted_public`.
- Added checklist gates before promotion.
- Added local promotion receipts.
- Added exportable canonical review packets.
- Added exportable promotion history packets.
- Canonical exports now preserve promotion history context.

## Promotion checklist gates

The v2.0 cockpit evaluates the selected record against these gates:

- receipts attached
- source quality at or above 65
- confidence at or above 70
- no unresolved review warnings
- public-safe location precision
- high-impact MW claims covered or not applicable
- public brief reviewed
- safety boundary acknowledged
- reviewer reason provided

Promotion is locked until all required fail / needs-human gates are cleared.

## Promotion receipt

A promotion receipt captures:

- promotion ID
- record ID and name
- reviewer name
- reviewer reason
- promotion timestamp
- prior lifecycle
- checklist snapshot
- source-quality snapshot
- public brief readiness acknowledgment
- safety acknowledgment
- deterministic digest

This does not prove the record is true. It only records that the local review gates were satisfied at the time of promotion.

## Export schemas

v2.0 adds or updates these exports:

- `DataCenterLedger.Export.v2.0-canonical-review-mode`
- `DataCenterLedger.CanonicalRegistry.v2.0-canonical-review-mode`
- `DataCenterLedger.CanonicalReviewPacket.v2.0`
- `DataCenterLedger.PromotionHistory.v2.0`
- `DataCenterLedger.LocalReviewSession.v2.0`
- `DataCenterLedger.PublicBrief.v2.0`
- `DataCenterLedger.RegionalEvidencePacket.v2.0`
- `DataCenterLedger.ReviewQueue.v2.0`

## Suggested review flow

1. Select a record from the review queue.
2. Add missing receipts through the receipt editor.
3. Resolve source-quality gaps and review warnings.
4. Generate/review a public brief.
5. Mark the record as reviewed.
6. Add a reviewer reason.
7. Acknowledge the public-data safety boundary.
8. Promote with receipt only after the checklist allows it.
9. Export the canonical review packet and promotion history.

## Safety boundary

Do not use Canonical Review Mode to approve:

- private facility details
- sensitive layouts
- private coordinates
- unreviewed exact-location enrichment
- security-sensitive access details
- non-public research notes intended for public release

The promoted state is a local governance label, not a claim of completeness or absolute truth.
