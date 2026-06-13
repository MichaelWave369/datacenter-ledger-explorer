# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, two-person approval gates, governance release manifests, manifest release diffs, release signoff packets, release archive indexes, release library lineage, release library integrity checks, a map-safe U.S. record scaffold, facility geo record schemas, facility geo import batches, geo staging bridge packets, draft geo intake review decisions, approved geo map-feed packets, and canonical export packets.

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
- v2.9 release archive index
- v3.0 release library mode
- v3.1 release library integrity check
- v3.2 map-safe U.S. record scaffold
- v3.3 facility geo record schema
- v3.4 facility geo import workbench
- v3.5 geo import staging bridge
- v3.6 draft geo intake review
- v3.7 approved geo intake map feed
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, session restore, release manifests, release diff exports, release signoff packets, release archive exports, release library exports, release integrity reports, map layer exports, geo schema exports, geo import batches, geo staging bridge packets, geo intake review packets, and approved geo map-feed packets
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

The larger sprint package has evolved through import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, action queues, release manifests, release diffs, release signoff packets, release archives, release library lineage, release library integrity checks, map-safe U.S. record layers, facility geo schemas, facility geo import batches, geo staging bridge packets, draft geo intake review packets, and approved geo map-feed packets. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v3.7 approved geo intake map feed

v3.7 turns approved v3.6 geo intake records into a reviewed map-feed packet:

- load the latest `DataCenterLedger.GeoIntakeReview.v3.6` from browser storage
- paste or load a v3.6 intake review JSON file
- keep only records with `approved_geo_intake` and `eligibleForMapLayer`
- transform them into map-friendly review candidates
- preserve reviewer, decision receipt, source row, source batch, bridge, and intake digests
- export `DataCenterLedger.ApprovedGeoMapFeed.v3.7`
- store the last map-feed packet under `datacenter-ledger.approved-geo-map-feed.v3.7`
- sync an archive-compatible local entry so the v3.2 map scaffold can read the approved feed through the existing release archive path

An approved geo map feed is still a local review handoff. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v3.6 draft geo intake review

v3.6 adds the human-review gate between the v3.5 staging bridge and future map intake:

- load the latest `DataCenterLedger.GeoStagingBridge.v3.5` from browser storage
- paste or load a v3.5 bridge JSON file
- review draft geo records one by one
- approve records into a local map-intake candidate state
- hold records that need more evidence or reviewer context
- reject records that should not enter the map-intake lane
- add reviewer notes to each decision
- export `DataCenterLedger.GeoIntakeReview.v3.6`
- store the last intake packet under `datacenter-ledger.geo-intake-review.v3.6`

A geo intake review packet is still a local review packet. It does not prove source truth, certify facility status, authorize exact-location publication, discover facilities, or make a complete national map.

## v3.5 geo import staging bridge

v3.5 turns validated v3.4 import batches into draft review handoff packets:

- load the latest `DataCenterLedger.FacilityGeoImportBatch.v3.4` from browser storage
- paste or load a v3.4 import batch JSON file
- convert staged rows into draft geo review records
- create one staging receipt per draft record
- preserve warning counts and excluded blocked-row counts
- export `DataCenterLedger.GeoStagingBridge.v3.5`
- store the last bridge packet under `datacenter-ledger.geo-staging-bridge.v3.5`
- keep rows as draft review claims until promoted by a reviewer

A geo staging bridge packet is a local review handoff. It does not certify source truth, promote records to canonical status, publish exact locations, discover facilities, or make a complete national map.

## v3.4 facility geo import workbench

v3.4 turns the v3.3 geo schema into a local import review step:

- paste or load CSV rows that follow the v3.3 facility geo columns
- validate required fields before rows can be staged
- flag invalid precision, evidence class, review status, state, confidence, URLs, duplicate record IDs, and coordinate-basis gaps
- keep warning rows staged but review-visible
- keep blocked rows out of staged import output
- export `DataCenterLedger.FacilityGeoImportBatch.v3.4`
- store the last exported batch under `datacenter-ledger.facility-geo-import-batch.v3.4`
- preserve the public-data safety boundary inside the export packet

A facility geo import batch is a review packet. It does not verify source truth, authorize exact-location publication, discover facilities, or make a complete national map.

## v3.3 facility geo record schema

v3.3 adds the data contract needed before real facility rows enter the map lane:

- defines required fields such as `recordId`, `title`, `state`, `geoPrecision`, `locationEvidenceClass`, `locationEvidenceUrl`, and `locationConfidence`
- defines optional fields for operator, county, city, public address basis, coordinates basis, review status, and geo notes
- defines map-safe precision levels: `state`, `county`, `city`, `public_address`, and `approximate`
- defines public evidence classes including air permits, planning records, utility records, company disclosures, public registries, news reports, open-map signals, and other public records
- exports `DataCenterLedger.FacilityGeoRecordSchema.v3.3`
- exports a CSV template packet for future geo imports
- includes a single-record validator for pasted JSON
- keeps exact address and coordinate fields bounded by public-source basis fields

A facility geo record schema is a review contract. It does not validate source truth, authorize exact-location disclosure, discover facilities, or make a complete national map.

## v3.2 map-safe U.S. record scaffold

v3.2 starts the map lane without adding a backend or hidden network calls:

- reads reviewed release artifacts from the v2.9 local release archive
- extracts canonical/reviewed record arrays from governance manifests and signoff packets when present
- normalizes records into a map-safe `MapRecord` shape
- clusters records by state-level marker on a local U.S. scaffold
- filters by state, status, precision, and search text
- opens a local record drawer for selected state clusters
- exports `DataCenterLedger.MapLayer.v3.2`
- stores the last exported map layer under `datacenter-ledger.us-map-layer.v3.2`
- keeps markers as regional review prompts, not exact facility coordinates

The map scaffold is not a complete U.S. data center database, not source verification, not facility discovery, and not a targeting map.

## v3.1 release library integrity check

v3.1 audits the local release library before exporting public release history:

- reads the v2.9 release archive and v3.0 lineage metadata from browser localStorage
- detects duplicate digests
- detects broken supersedes links and self-supersedes links
- flags stale lineage metadata
- flags manifests without matching signoff packets
- flags manifests without matching release diffs
- flags unknown artifact schemas and missing app-version metadata
- flags approved signoffs with blockers or pending approvals
- flags non-approved releases that have public lineage metadata
- exports `DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1`
- keeps the audit local-only with no backend, no hidden network calls, and no external validation
