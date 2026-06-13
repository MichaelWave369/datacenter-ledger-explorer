# v2.2 Canonical Diff + Change Review

DataCenterLedger Explorer v2.2 adds a selected-record change-review cockpit.

The purpose is to prevent silent drift in the working/canonical workspace. A reviewer can propose edits to a selected record, preview before/after deltas, inspect quality and canonical-gate effects, provide a change reason, and then apply the reviewed change as a local change receipt.

## What changed

- A selected record now has a **Canonical Diff + Change Review** panel.
- Reviewers can edit public-safe fields such as name, operator, status, lifecycle, state, county, city, precision, capacity MW, confidence, and review warnings.
- The app compares the current record against the proposed draft.
- Each changed field is shown as a before/after delta.
- Deltas are marked as low, medium, or high impact.
- The app shows source-quality score before and after the proposed change.
- The app shows canonical blockers before and after the proposed change.
- Applying a change requires a reviewer name and a change reason.
- Applied changes create a local `ChangeReceipt`.

## Change receipt contents

A v2.2 change receipt includes:

- change ID
- record ID
- record name
- timestamp
- reviewer
- reason
- field deltas
- source-quality snapshot before the change
- source-quality snapshot after the change
- canonical blockers before the change
- canonical blockers after the change
- deterministic digest

## Export schemas

v2.2 adds or updates these schemas:

- `DataCenterLedger.Export.v2.2-canonical-diff-change-review`
- `DataCenterLedger.CanonicalRegistry.v2.2-change-review`
- `DataCenterLedger.CanonicalChangeReview.v2.2`
- `DataCenterLedger.ChangeHistory.v2.2`
- `DataCenterLedger.LocalReviewSession.v2.2`
- `DataCenterLedger.PromotionAuditTimeline.v2.2`

## High-impact deltas

High-impact fields include:

- state
- county
- city
- precision
- capacity MW
- lifecycle

These fields affect public interpretation or safety posture, so they require special human attention.

## Public safety boundary

The change-review cockpit is still local-first and public-data only.

Do not use change review to store or normalize:

- private facility access details
- private coordinates
- sensitive layouts
- non-public enrichment
- instructions that could help target infrastructure

If an exact location or sensitive detail is not already clearly public and safe to cite, do not add it.

## Suggested review flow

1. Select a record.
2. Edit the draft fields in the change-review cockpit.
3. Review every before/after delta.
4. Check source-quality before and after the change.
5. Check canonical blockers before and after the change.
6. Enter a clear change reason.
7. Apply the reviewed change.
8. Export the change packet or full change history if needed.
9. Review the selected-record audit timeline to confirm the change was captured.

## Boundary statement

A change receipt does not prove the record is true. It only records that a local reviewer made a specific change, at a specific time, for a stated reason, with the available quality and canonical-gate context preserved.
