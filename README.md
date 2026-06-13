# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, two-person approval gates, governance release manifests, manifest release diffs, release signoff packets, release archive indexes, release library lineage, release library integrity checks, a map-safe U.S. record scaffold, facility geo record schemas, facility geo import batches, geo staging bridge packets, draft geo intake review decisions, approved geo map-feed packets, map candidate QA reports, final map layer export gates, final map layer viewer snapshots, public share packets, and canonical export packets.

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
- v3.8 map candidate QA dashboard
- v3.9 final map layer export gate
- v4.0 final map layer viewer integration
- v4.1 final layer public share packet
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, session restore, release manifests, release diff exports, release signoff packets, release archive exports, release library exports, release integrity reports, map layer exports, geo schema exports, geo import batches, geo staging bridge packets, geo intake review packets, approved geo map-feed packets, map candidate QA reports, final map layer packets, final map viewer snapshots, and public share packets
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

The larger sprint package has evolved through import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, action queues, release manifests, release diffs, release signoff packets, release archives, release library lineage, release library integrity checks, map-safe U.S. record layers, facility geo schemas, facility geo import batches, geo staging bridge packets, draft geo intake review packets, approved geo map-feed packets, map candidate QA reports, final map layer export gates, final map layer viewer snapshots, and public share packets. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v4.1 final layer public share packet

v4.1 reads the `DataCenterLedger.FinalMapLayerViewer.v4.0` snapshot into a sanitized public share packet:

- load the latest viewer snapshot from browser storage
- paste or load viewer JSON
- omit reviewer-only notes, staging internals, coordinate fields, and address details
- keep public record IDs, titles, operators, state/locality, precision, QA badges, evidence class, evidence URL, confidence, and public digests
- show omitted-field chips so users know what was stripped
- export `DataCenterLedger.PublicSharePacket.v4.1`
- store the latest share packet under `datacenter-ledger.public-share-packet.v4.1`

A public share packet is still only a public-facing summary artifact. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, upgrade precision, or make a complete national map.

## v4.0 final map layer viewer integration

v4.0 reads the export-ready `DataCenterLedger.FinalMapLayer.v3.9` packet into a final viewer layer:

- load the latest final map layer from browser storage
- paste or load final map-layer JSON
- confirm gate status and QA status badges
- show state clusters and reviewed final records
- export `DataCenterLedger.FinalMapLayerViewer.v4.0`
- store the latest viewer snapshot under `datacenter-ledger.final-map-viewer.v4.0`

A final map viewer snapshot is still a local review display. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, upgrade location precision, or make a complete national map.

## v3.9 final map layer export gate

v3.9 requires a matching v3.8 QA report before a v3.7 approved geo map feed can become an exportable final map-layer packet:

- load the latest `DataCenterLedger.ApprovedGeoMapFeed.v3.7` and `DataCenterLedger.MapCandidateQAReport.v3.8` from browser storage
- paste or load feed and QA JSON files
- block export when the QA report is missing, empty, mismatched, or has unresolved blockers
- allow clear QA reports when the source feed digest matches
- require reviewer name, reviewer note, and warning acceptance for review-status QA reports
- export `DataCenterLedger.FinalMapLayer.v3.9`
- store the latest export-ready packet under `datacenter-ledger.final-map-layer.v3.9`

A final map layer packet is still a local export artifact. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v3.8 map candidate QA dashboard

v3.8 audits approved map-feed records before final map layer export:

- load the latest `DataCenterLedger.ApprovedGeoMapFeed.v3.7` from browser storage
- paste or load a v3.7 approved map-feed JSON file
- flag missing evidence URLs, low confidence, public-address precision, duplicate record IDs, duplicate digests, coordinate gaps, and upstream warnings
- export `DataCenterLedger.MapCandidateQAReport.v3.8`
- store the latest QA report under `datacenter-ledger.map-candidate-qa-report.v3.8`

A map candidate QA report is a local review signal. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

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
