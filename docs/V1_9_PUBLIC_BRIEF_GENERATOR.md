# v1.9 Public Brief Generator

DataCenterLedger Explorer v1.9 adds a public-safe brief generator for selected records and selected regions.

The goal is to help reviewers communicate what the Ledger currently says without turning the app into a targeting map, proof engine, or complete national registry.

## What changed

- Generate a selected-record public brief.
- Generate a selected-region public brief.
- Export the brief as JSON.
- Export the brief as Markdown.
- Include review-only language in every brief.
- Include the public-data safety boundary.
- Include key claims under review.
- Include source receipts and public links where present.
- Include unresolved gaps, warnings, and canonical blockers.
- Include source-quality or regional-quality context.

## Export schemas

v1.9 adds or updates these schemas:

- `DataCenterLedger.PublicBrief.v1.9`
- `DataCenterLedger.Export.v1.9-public-brief`
- `DataCenterLedger.CanonicalRegistry.v1.9-public-brief`
- `DataCenterLedger.LocalReviewSession.v1.9`
- `DataCenterLedger.RegionalEvidencePacket.v1.9`
- `DataCenterLedger.ReviewQueue.v1.9`

## Brief scope

### Selected record

A record brief summarizes one selected Ledger record:

- review status
- source quality
- confidence
- receipts
- source claims
- unresolved gaps
- canonical blockers

### Selected region

A region brief summarizes the selected state or county region:

- record count
- canonical count
- needs-review count
- average source quality
- quality bands
- receipts
- top unresolved regional gaps

The regional brief stays at state/county level. It does not show exact coordinates or facility markers.

## Safety boundary

Public briefs must remain:

- public-data only
- review-only
- non-targeting
- non-complete
- non-proof
- free of private facility details
- free of sensitive layouts
- free of private coordinates
- free of non-public enrichment

## Suggested review flow

1. Select a record or region.
2. Review receipts and unresolved gaps.
3. Add missing public receipts where needed.
4. Use the task board to resolve source gaps.
5. Generate the public brief.
6. Read the Markdown before sharing.
7. Remove any sensitive or non-public material from session data before sharing.

## Public language posture

Good public brief language:

> This brief summarizes claims currently present in a local review workspace. It is not proof, not a complete database, and not a targeting map.

Avoid language like:

> This proves the facility exists and all details are verified.

The Ledger should preserve the distinction between a claim, a receipt, a reviewed conclusion, and a public-safe summary.
