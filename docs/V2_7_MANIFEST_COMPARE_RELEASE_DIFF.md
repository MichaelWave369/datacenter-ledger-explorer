# v2.7 Manifest Compare / Release Diff

v2.7 adds a local compare cockpit for two exported governance release manifests.

The goal is to make release-to-release drift visible without adding a backend, hidden network calls, external validation, or private facility discovery.

## What it does

The compare cockpit lets a reviewer:

1. Paste or load a baseline governance release manifest.
2. Paste or load a candidate governance release manifest.
3. Review release-level differences.
4. Export a public-safe diff packet.

The diff packet uses this schema:

```txt
DataCenterLedger.ManifestCompare.v2.7
```

## Compared fields

The v2.7 diff compares:

- release name
- app version
- readiness state
- manifest digest
- active role
- canonical record additions and removals
- canonical count delta
- pending approval delta
- approved/rejected approval deltas
- public brief count delta
- promotion receipt count delta
- change receipt count delta
- average source-quality delta
- blockers added and removed
- warnings added and removed

## Role gate

v2.7 adds this permission:

```txt
compare_release_manifests
```

The default profiles that can export a manifest diff are:

- `publisher`
- `admin`

This is a local UI gate only. It is not authentication, identity proof, legal authority, or security clearance.

## Safety boundary

A manifest diff is a review artifact only. It does not certify that either manifest is true, complete, legally authorized, secure, or safe to publish.

The diff must remain within the DataCenterLedger public boundary:

- public-data only
- no hidden network calls
- no private facility discovery
- no security-sensitive enrichment
- city/county precision unless exact location is already public and appropriate
- review-only, not proof of truth and not a targeting map

## Suggested review flow

1. Export a baseline `DataCenterLedger.GovernanceReleaseManifest` before a review session.
2. Continue imports, receipts, approvals, promotions, and public brief generation.
3. Export a candidate governance release manifest.
4. Load the baseline and candidate into the compare cockpit.
5. Review added/removed canonical records, readiness changes, approval deltas, and digest changes.
6. Export `DataCenterLedger.ManifestCompare.v2.7` for the release packet.
7. Human reviewers inspect source receipts before any public claims are reused.

## What it does not do

v2.7 does not:

- validate sources automatically
- prove data is true
- prove a facility exists
- prove legal authorization
- replace human review
- publish anything by itself
- call a server or external API
- discover private facility details
