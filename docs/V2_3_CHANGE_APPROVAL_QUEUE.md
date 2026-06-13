# v2.3 Change Approval Queue

DataCenterLedger Explorer v2.3 adds a pending approval queue for record changes.

The purpose is to prevent selected-record edits from silently overwriting the local workspace. A reviewer now submits a proposed change, captures a reason, and waits for an approval or rejection decision.

## What changed

- Proposed record edits create a `ChangeApprovalRequest` instead of immediately mutating the record.
- Each approval request stores:
  - record before snapshot
  - record after snapshot
  - field deltas
  - delta impact levels
  - requester
  - reason
  - source-quality before and after
  - canonical blockers before and after
  - status
  - digest
- Approving a request applies the change and creates a `ChangeReceipt`.
- Rejecting a request records a decision note without changing the record.
- Approval events appear in the selected-record promotion audit timeline.
- Approval queue state is preserved in local review session exports.

## Approval statuses

- `pending` — change has been requested but has not been decided.
- `approved` — change was approved and applied to the local workspace.
- `rejected` — change was rejected and did not alter the record.

## Submit gates

A proposed change can enter the queue only when:

1. At least one field changed.
2. A reviewer reason is supplied.
3. The selected record does not already have a pending approval request.

## Approval behavior

Approval does two things:

1. Applies the proposed record snapshot to the local workspace.
2. Creates a local `ChangeReceipt` with approval linkage and a deterministic digest.

Rejection does not alter the record. It stores the rejection status, reviewer, decision note, timestamp, and digest.

## Export schemas

v2.3 adds or updates these schemas:

- `DataCenterLedger.ChangeApprovalQueue.v2.3`
- `DataCenterLedger.PendingChangeReview.v2.3`
- `DataCenterLedger.Export.v2.3-change-approval-queue`
- `DataCenterLedger.CanonicalRegistry.v2.3-change-approval`
- `DataCenterLedger.LocalReviewSession.v2.3`
- `DataCenterLedger.PromotionAuditTimeline.v2.3`
- `DataCenterLedger.ChangeHistory.v2.3`

## Public safety boundary

The approval queue is still a local review workflow. It does not prove a record is true and does not validate sources automatically.

Do not use it to approve or publish:

- private access details
- sensitive layouts
- private coordinates
- non-public enrichment
- targeting-relevant infrastructure details

High-impact fields such as state, county, city, precision, MW capacity, and lifecycle should be reviewed carefully before approval.

## Suggested review flow

1. Select a record.
2. Edit fields in the change cockpit.
3. Review the before/after deltas and quality change.
4. Add a clear reason.
5. Submit the change to the approval queue.
6. A reviewer approves or rejects the request with a decision note.
7. Export the approval queue or selected audit timeline for review.
