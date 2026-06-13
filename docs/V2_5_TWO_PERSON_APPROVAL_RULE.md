# v2.5 Two-Person Approval Rule

v2.5 adds a local two-person control to the change approval queue.

The rule is simple: the reviewer who submits a proposed change cannot approve or reject that same change. The decision reviewer must also use a different active role from the submitter role. This prevents local self-approval inside the browser workspace.

This is still a local-first governance aid. It is not authentication, legal authorization, or proof that the source data is true.

## Policy

- The submitter of a change cannot approve or reject the same change.
- The decision role must be different from the submitter role.
- Admin does not bypass the two-person separation rule.
- Rejected requests preserve a decision receipt and do not mutate the record.

## Approval behavior

When a reviewer submits a change, the approval request preserves:

- requester name
- requester role
- field deltas
- before record
- after record
- source quality before and after
- canonical blockers before and after
- submitter role gate
- two-person policy text

When another reviewer decides the request, the app records:

- decision reviewer
- decision role
- role permission gate
- two-person gate result
- decision note
- decision timestamp

Approved requests apply the record change and create a change receipt. Rejected requests keep the decision receipt and leave the record unchanged.

## Two-person gate snapshot

Each approval or rejection decision can include a `TwoPersonGateSnapshot`:

- action: `approve_change` or `reject_change`
- allowed
- submitter
- submitterRole
- decider
- deciderRole
- differentReviewer
- differentRole
- roleAllowed
- detail
- digest

The gate passes only when the decider has the needed role permission and both separation checks pass.

## Export schemas

v2.5 updates the local export family:

- `DataCenterLedger.Workspace.v2.5`
- `DataCenterLedger.CanonicalRegistry.v2.5`
- `DataCenterLedger.ChangeApprovalQueue.v2.5`
- `DataCenterLedger.RoleProfile.v2.5`
- `DataCenterLedger.LocalReviewSession.v2.5`

These exports preserve the two-person policy, approval queue, change receipts, active reviewer role, and role gate snapshots.

## Suggested review flow

1. A reviewer selects a record and edits proposed fields.
2. The reviewer writes a change reason and submits the change for approval.
3. Another reviewer switches to a different reviewer name and different role with approve/reject permission.
4. The second reviewer reviews the deltas, source-quality impact, blockers, and public-data boundary.
5. The second reviewer approves or rejects with a decision note.
6. Approved changes mutate the local workspace and create a receipt; rejected changes remain as decision history.

## Safety boundary

The two-person rule does not mean:

- a reviewer is authenticated
- a person has legal authority
- a source is verified true
- a data center record is complete
- private facility details are safe to publish
- exact locations should be enriched or exposed

The core boundary remains:

**Public-data only. No hidden network calls. No private facility discovery. No security-sensitive enrichment. City/county precision unless exact location is already public and appropriate.**
