# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, two-person approval gates, governance release manifests, manifest release diffs, release signoff packets, release archive indexes, release library lineage, release library integrity checks, a map-safe U.S. record scaffold, facility geo record schemas, facility geo import batches, geo staging bridge packets, draft geo intake review decisions, approved geo map-feed packets, map candidate QA reports, final map layer export gates, final map layer viewer snapshots, public share packets, public share redaction audits, public share approval gates, and canonical export packets.

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
- v4.2 public share redaction audit
- v4.3 public share approval gate
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, session restore, release manifests, release diff exports, release signoff packets, release archive exports, release library exports, release integrity reports, map layer exports, geo schema exports, geo import batches, geo staging bridge packets, geo intake review packets, approved geo map-feed packets, map candidate QA reports, final map layer packets, final map viewer snapshots, public share packets, public share redaction audits, and public share approval packets
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

The larger sprint package has evolved through import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, action queues, release manifests, release diffs, release signoff packets, release archives, release library lineage, release library integrity checks, map-safe U.S. record layers, facility geo schemas, facility geo import batches, geo staging bridge packets, draft geo intake review packets, approved geo map-feed packets, map candidate QA reports, final map layer export gates, final map layer viewer snapshots, public share packets, public share redaction audits, and public share approval gates. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v4.3 public share approval gate

v4.3 reads the `DataCenterLedger.PublicSharePacket.v4.1` packet and matching `DataCenterLedger.PublicShareRedactionAudit.v4.2` report into a public share approval packet:

- load the latest public share packet and redaction audit from browser storage
- paste or load share and audit JSON
- confirm the audit source share digest matches the share packet digest
- block approval when the audit is blocked or source digests mismatch
- approve clear audits with a reviewer name
- require warning acceptance and reviewer notes for review-state audits
- export `DataCenterLedger.PublicShareApproval.v4.3`
- store the latest approval under `datacenter-ledger.public-share-approval.v4.3`

A public share approval packet is still a local approval artifact. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v4.2 public share redaction audit

v4.2 reads the `DataCenterLedger.PublicSharePacket.v4.1` packet into a redaction audit report:

- load the latest public share packet from browser storage
- paste or load public share JSON
- check for reviewer-only fields, staging fields, internal digest chains, coordinate-like text, and address-related field keys
- flag missing evidence URLs, missing state codes, missing confidence, low confidence, and public-address precision records
- verify expected omitted-field declarations and share safety notices
- export `DataCenterLedger.PublicShareRedactionAudit.v4.2`
- store the latest report under `datacenter-ledger.public-share-redaction-audit.v4.2`

A redaction audit report is still a review signal. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

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
- store the latest final layer under `datacenter-ledger.final-map-layer.v3.9`

The final map layer is still a local export packet. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, upgrade precision, or make a complete national map.

## v3.8 map candidate QA dashboard

v3.8 reads `DataCenterLedger.ApprovedGeoMapFeed.v3.7` records into a QA report:

- load the latest approved map-feed packet from browser storage
- paste or load map-feed JSON
- check missing evidence URLs, low confidence, public-address precision, duplicate IDs/digests, and upstream warnings
- export `DataCenterLedger.MapCandidateQAReport.v3.8`
- store the latest QA report under `datacenter-ledger.map-candidate-qa-report.v3.8`

The QA report is a map-safety review aid. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v3.7 approved geo intake map feed

v3.7 reads approved v3.6 intake records into a reviewed map-feed packet:

- load the latest `DataCenterLedger.GeoIntakeReview.v3.6` packet from browser storage
- paste or load intake-review JSON
- include only `approved_geo_intake` records marked eligible for the map layer
- preserve evidence URL, evidence class, confidence, precision, reviewer notes, warnings, and lineage digests
- export `DataCenterLedger.ApprovedGeoMapFeed.v3.7`
- store the latest feed under `datacenter-ledger.approved-geo-map-feed.v3.7`
- sync an archive-compatible copy so the v3.2 map scaffold can read approved records

The approved map feed is still a review artifact. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, upgrade precision, or make a complete national map.

## v3.6 draft geo intake review

v3.6 reads draft records from a v3.5 geo staging bridge packet into a local intake review panel:

- load the latest `DataCenterLedger.GeoStagingBridge.v3.5` packet from browser storage
- paste or load staging bridge JSON
- review each draft record one by one
- choose `approved_geo_intake`, `held_geo_intake`, or `rejected_geo_intake`
- preserve reviewer name, notes, warning counts, and source receipt lineage
- export `DataCenterLedger.GeoIntakeReview.v3.6`
- store the latest intake review under `datacenter-ledger.geo-intake-review.v3.6`

The intake review is a human decision gate. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v3.5 geo import staging bridge

v3.5 reads accepted and warning rows from a v3.4 geo import batch into a draft staging bridge:

- load the latest `DataCenterLedger.FacilityGeoImportBatch.v3.4` packet from browser storage
- paste or load import-batch JSON
- convert staged rows into draft geo review records
- preserve location evidence URL/class/confidence, precision, reviewer, row digest, batch digest, and warning count
- create staging receipts for every draft record
- export `DataCenterLedger.GeoStagingBridge.v3.5`
- store the latest bridge under `datacenter-ledger.geo-staging-bridge.v3.5`

The staging bridge is still review-only. It does not prove source truth, certify facility status, discover facilities, authorize sensitive publication, or make a complete national map.

## v3.4 facility geo import workbench

v3.4 turns CSV rows into a local, review-only geo import batch:

- paste or load CSV locally
- validate each row against the v3.3 geo schema
- group accepted, warning, and blocked rows
- preserve row-level issues and digests
- export `DataCenterLedger.FacilityGeoImportBatch.v3.4`
- store the latest batch under `datacenter-ledger.facility-geo-import-batches.v3.4`

No geocoding, external calls, private facility discovery, or coordinate enrichment is performed.

## v3.3 facility geo record schema

v3.3 defines a review-only facility geo record schema and CSV template:

- precision levels: state, county, city, public address, approximate
- evidence classes: permits, planning records, utility records, company disclosures, public registries, news reports, open map signals, other public records
- required fields: record ID, title, state, precision, location evidence class, evidence URL, confidence
- public address and coordinate fields require public-source basis fields
- export `DataCenterLedger.FacilityGeoRecordSchema.v3.3`
- export `DataCenterLedger.FacilityGeoImportTemplate.v3.3`

The schema organizes public location claims for review. It does not verify source truth, certify facility status, authorize sensitive disclosure, or create a targeting map.

## v3.2 map-safe U.S. record scaffold

v3.2 adds a local-first U.S. map scaffold that reads reviewed/canonical record arrays from local release artifacts and displays only map-safe regional summaries.

- state-level marker canvas
- search, status, precision, and state filters
- record drawer with source labels and evidence classes
- map layer export as `DataCenterLedger.MapLayer.v3.2`
- safety boundary that defaults to city/county/state precision unless exact coordinates are already public and appropriate

This is not a targeting map, not a complete national database, and not proof of source truth.

## v3.1 release library integrity check

v3.1 adds a local integrity checker for the release archive/library:

- duplicate digest detection
- missing lineage notes
- stale lineage references
- held/needs-review public release labels
- missing signoffs, diffs, and manifests
- exportable `DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1`

## v3.0 release library mode

v3.0 adds release-library lineage metadata:

- current public release labels
- supersedes links
- lineage notes
- public release history exports
- compare handoff exports

## v2.9 release archive index

v2.9 adds local indexing for release governance artifacts:

- governance manifests
- manifest diffs
- release signoff packets
- archive search and filters
- restore-to-signoff handoff

## v2.8 release signoff packet

v2.8 adds a role-gated release signoff packet:

- approve / hold / needs-more-review decisions
- checklist gates
- manifest and optional diff inputs
- exportable release signoff JSON

## v2.7 manifest compare / release diff

v2.7 adds a local compare tool for governance manifests:

- baseline vs candidate manifest parsing
- readiness delta
- canonical and pending approval changes
- exportable release diff packet

## v2.6 governance release manifest

v2.6 adds a role-gated governance release manifest export that bundles:

- canonical records
- public briefs
- promotion receipts
- change receipts
- approval queue status
- two-person approval policy
- role profile
- safety boundary

## v2.5 two-person approval rule

v2.5 adds a two-person separation gate for canonical approval and rejection decisions.

The approver/rejecter must be different from the requester and must satisfy role requirements. Admin role does not bypass the two-person requirement.
