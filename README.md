# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, two-person approval gates, governance release manifests, manifest release diffs, release signoff packets, and canonical export packets.

## Live app

https://michaelwave369.github.io/datacenter-ledger-explorer/

## Public boundary

**Public-data only • No hidden network calls • No private facility discovery • No security-sensitive enrichment**

Exact coordinates should only be used when already published by a public dataset. Otherwise, prefer city, county, or state precision.

## Current repo state

This repo contains the public-safe source scaffold for DataCenterLedger Explorer:

- React + Vite + TypeScript app
- local demo records
- normalized CSV import
- v1.2 import review workbench
- v1.3 receipt editor workbench
- v1.4 source quality scoreboard
- v1.5 map-safe regional view
- v1.6 regional evidence packet
- v1.7 local review session save/load
- v1.8 review queue + task board
- v1.9 public brief generator
- v2.0 canonical review mode
- v2.1 promotion audit timeline
- v2.2 canonical diff + change review
- v2.3 change approval queue
- v2.4 approval role profiles
- v2.5 two-person approval rule
- v2.6 governance release manifest
- v2.7 manifest compare / release diff
- v2.8 release signoff packet
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, session restore, release manifests, release diff exports, and release signoff packets
- selected-record before/after change diff
- pending approval requests before workspace mutation
- two-person separation gate for approve/reject decisions
- approve/reject decisions with reviewer notes
- local change receipts with approval linkage and two-person gate snapshots
- selected-record audit timeline export
- checklist-backed promotion receipts
- record and region public brief exports
- full local workspace session export/import
- JSON and Markdown export packets
- public-data safety docs
- GitHub Pages deploy workflow

The larger sprint package has evolved through import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, action queues, release manifests, and release diffs. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v2.8 release signoff packet

v2.8 adds a local release signoff widget that can sit beside the existing review cockpit:

- paste or load a `DataCenterLedger.GovernanceReleaseManifest` JSON packet
- optionally paste or load a `DataCenterLedger.ManifestCompare` JSON packet
- choose a release decision: `approve_release`, `hold_release`, or `needs_more_review`
- enter final reviewer notes
- generate a checklist covering manifest presence, schema recognition, readiness, pending approvals, canonical records, diff attachment, two-person policy preservation, reviewer name, and notes
- export `DataCenterLedger.ReleaseSignoffPacket.v2.8`
- preserve public-safety boundary and review-only language inside the signoff packet
- keep the workflow local-only with no backend, no hidden network calls, and no external validation

A release signoff packet records a local review decision. It does not certify truth, completeness, legal authorization, security clearance, or permission to publish private or sensitive infrastructure details.

## v2.7 manifest compare / release diff

v2.7 adds a local compare cockpit for two exported governance release manifests:

- paste or load baseline and candidate `DataCenterLedger.GovernanceReleaseManifest` JSON files
- compare release names, app versions, readiness state, manifest digests, active roles, canonical records, blockers, warnings, approvals, public briefs, promotion receipts, change receipts, and average source quality
- export `DataCenterLedger.ManifestCompare.v2.7`
- add `compare_release_manifests` as a role-gated permission for `publisher` and `admin`
- keep the compare local-only with no backend, no hidden network calls, and no external validation
- preserve review-only language inside the diff packet

A manifest diff is a review artifact. It does not certify that either manifest is true, complete, legally authorized, secure, or safe to publish.

## v2.6 governance release manifest

v2.6 adds a one-click local release packet for governance review:

- export `DataCenterLedger.GovernanceReleaseManifest.v2.6`
- bundle app version, release name, reviewer name, active role, role profile, and release role gate
- bundle the two-person approval policy and public safety boundary
- include release readiness with blockers, warnings, canonical count, pending approvals, public brief count, promotion receipts, change receipts, and average source quality
- include canonical records, needs-review records, source-quality reports, regional summaries, public briefs, promotion receipts, change receipts, approval queue, and selected-record audit timeline
- preserve a deterministic manifest digest for comparison across exports
- keep the manifest local-first with no backend and no hidden network calls

The governance release manifest is a review packet only. It does not certify truth, completeness, legal authorization, security clearance, or permission to publish private or sensitive facility details.

## Safety posture

Use public sources only. Do not use this tool to identify private facility details, collect sensitive coordinates, bypass security controls, or publish unreviewed infrastructure claims.
