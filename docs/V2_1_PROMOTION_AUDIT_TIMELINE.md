# v2.1 Promotion Audit Timeline

DataCenterLedger Explorer v2.1 adds a selected-record promotion audit timeline.

The goal is to make the local review trail easier to inspect before, during, and after canonical promotion. The timeline is local-first, public-safe, and exportable as JSON.

## What the timeline includes

For the selected record, the app can gather events from:

- import batch records
- source receipts
- receipt edit history
- generated review tasks
- manual review tasks
- source quality evaluation
- public brief generation
- reviewed lifecycle state
- promotion receipts
- local session restores
- reviewer notes

## Export schema

The v2.1 timeline export uses:

```txt
DataCenterLedger.PromotionAuditTimeline.v2.1
```

A timeline packet includes:

- selected record id
- selected record name
- event list
- event summary counts
- latest event timestamp
- deterministic digest

## Event model

Each event includes:

- id
- type
- record id
- title
- occurred timestamp
- actor, when available
- detail
- status, when available
- digest

Current event types:

- `import`
- `receipt`
- `task`
- `brief`
- `reviewed`
- `promotion`
- `session_restore`
- `note`
- `quality`

## Safety boundary

The audit timeline is a local review chronology. It is not proof that a record is true and is not a complete public history.

Do not use timeline packets to publish:

- private facility access details
- sensitive layouts
- non-public coordinates
- private research notes
- instructions that could help target infrastructure

## Suggested review flow

1. Select a record.
2. Review source quality and canonical blockers.
3. Add missing receipts and resolve warnings.
4. Generate a public brief.
5. Review the audit timeline.
6. Export the audit timeline packet.
7. Promote only through Canonical Review Mode when gates pass.

## Relationship to v2.0

v2.0 introduced promotion receipts and checklist-backed promotion.

v2.1 adds the timeline around that process so a reviewer can see what led to the promotion decision and export the trail for later review.
