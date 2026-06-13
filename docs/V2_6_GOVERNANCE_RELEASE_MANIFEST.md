# v2.6 Governance Release Manifest

DataCenterLedger Explorer v2.6 adds a local-first governance release manifest for bundling the review workspace into one public-safe release packet.

The manifest is designed for civic review, public meeting prep, internal review handoff, or release archival. It is not a certification engine and does not prove that a record is true.

## Schema

The primary export is:

```txt
DataCenterLedger.GovernanceReleaseManifest.v2.6
```

The manifest includes:

- app version
- release name
- generation timestamp
- reviewer name
- active reviewer role
- role profile
- release role gate snapshot
- two-person approval policy
- public safety boundary
- review-only notice
- readiness summary
- canonical records
- needs-review records
- source-quality reports
- map-safe regional summaries
- selected public briefs
- promotion receipts
- canonical change receipts
- pending/approved/rejected approval queue
- selected-record audit timeline
- deterministic manifest digest

## Readiness summary

The readiness object does not certify truth. It only summarizes whether the local release packet is ready for review/export under the current local gates.

Readiness includes:

- `ready`
- `blockers`
- `warnings`
- `canonicalCount`
- `pendingApprovals`
- `rejectedApprovals`
- `publicBriefCount`
- `promotionReceiptCount`
- `changeReceiptCount`
- `averageSourceQuality`

A release is blocked when:

- the active role cannot export a governance release manifest
- pending approvals remain
- there are no canonical records in the release

Warnings are retained for context, including rejected approval count, low average source quality, or missing public briefs.

## Role gate

The manifest export is gated by the `export_release_manifest` permission.

The default roles that can export the manifest are:

- `publisher`
- `admin`

This is a local review gate only. It is not authentication, identity proof, legal authorization, or security permission.

## Two-person policy preservation

The manifest carries the v2.5 two-person approval rule:

- the submitter of a change cannot approve or reject the same change
- the decision role must be different from the submitter role
- admin does not bypass the two-person separation rule
- rejected requests preserve decision receipts and do not mutate the record

This allows a downstream reviewer to inspect whether change receipts were produced under the separation rule.

## Safety boundary

Every manifest includes the public safety boundary:

- public-data only
- no hidden network calls
- no private facility discovery
- no security-sensitive enrichment
- city/county precision unless exact location is already public and appropriate
- review-only; not proof of truth and not a targeting map

## Suggested review flow

1. Select the reviewer name and role.
2. Resolve or reject pending approval requests.
3. Promote only records that pass canonical review gates.
4. Generate public briefs for records or regions that may be discussed externally.
5. Review release blockers and warnings in the v2.6 manifest panel.
6. Export the governance release manifest.
7. Share the manifest only after verifying sources and removing any non-public or sensitive details.

## What it does not do

The governance release manifest does not:

- prove a source is true
- prove the registry is complete
- replace public-record review
- authenticate reviewers
- grant permission to publish private data
- identify private facility details
- scrape or enrich records from hidden sources
- perform any network calls

The manifest is a receipt-backed release packet for human review, not a truth oracle.
