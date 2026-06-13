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
