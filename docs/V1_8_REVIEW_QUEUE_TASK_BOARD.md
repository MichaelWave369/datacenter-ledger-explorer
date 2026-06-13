# v1.8 Review Queue + Task Board

DataCenterLedger Explorer v1.8 turns review gaps into local follow-up tasks.

The goal is to help reviewers move from “this record has problems” to “here is the next action needed,” without adding a backend, hidden network calls, exact-coordinate mapping, or non-public enrichment.

## What changed

v1.8 adds a visible **Review Queue + Task Board**.

Tasks are generated from:

- review warnings
- canonical blockers
- missing or incomplete public source links
- source-quality gaps
- MW / high-impact second-source needs
- confidence below promotion threshold
- unknown location precision
- records that are ready for promotion review

Reviewers can also add manual follow-up tasks to the selected record.

## Task categories

Supported task categories include:

- `needs_second_source`
- `needs_public_url`
- `needs_permit_receipt`
- `needs_utility_receipt`
- `needs_operator_confirmation`
- `needs_location_review`
- `needs_confidence_review`
- `needs_warning_resolution`
- `needs_source_quality`
- `ready_for_promotion`
- `manual_follow_up`

## Task statuses

Tasks can be marked as:

- `open`
- `in_progress`
- `blocked`
- `done`
- `dismissed`

Status changes remain local unless exported in a Ledger packet or local review session.

## Exports

v1.8 adds or updates these export schemas:

- `DataCenterLedger.ReviewQueue.v1.8`
- `DataCenterLedger.Export.v1.8-review-queue`
- `DataCenterLedger.CanonicalRegistry.v1.8-review-queue`
- `DataCenterLedger.LocalReviewSession.v1.8`
- `DataCenterLedger.PublicLaunchPacket.v1.8`
- `DataCenterLedger.SelectedReceiptPacket.v1.8`
- `DataCenterLedger.MapSafeRegionalSummary.v1.8`

## Local session integration

Local review sessions now preserve:

- task status overrides
- manual tasks
- generated task snapshot
- task filters
- records
- receipts
- receipt edits
- import history
- regional summaries
- source-quality reports

## Safety boundary

The task board is a review workflow aid. It is not proof that claims are true.

Do not use tasks to collect or store:

- private access details
- sensitive layouts
- private facility coordinates
- non-public enrichment
- instructions that could help target infrastructure

Keep tasks focused on public records, public-source receipt review, and canonical readiness.

## Suggested review flow

1. Import or select a public-source record.
2. Read canonical blockers and source-quality gaps.
3. Let the task board generate follow-up work.
4. Add manual tasks only for public, review-safe actions.
5. Attach receipts through the receipt editor.
6. Mark tasks done or dismissed only after human review.
7. Export the review queue or full local session before sharing or pausing.
