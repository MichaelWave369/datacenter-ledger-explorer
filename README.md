# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, two-person approval gates, governance release manifests, manifest release diffs, release signoff packets, release archive indexes, release library lineage, release library integrity checks, and canonical export packets.

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
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, session restore, release manifests, release diff exports, release signoff packets, release archive exports, release library exports, and release integrity reports
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

The larger sprint package has evolved through import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, action queues, release manifests, release diffs, release signoff packets, release archives, release library lineage, and release library integrity checks. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

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

An integrity report is a review prompt. It does not verify source truth, certify release readiness, publish records, or authorize sensitive infrastructure disclosure.

## v3.0 release library mode

v3.0 turns the v2.9 local archive into a release library:

- reads archived governance manifests, manifest diffs, and signoff packets from local browser storage
- adds release labels and lineage notes
- records which release supersedes an earlier release
- shows a public release history table
- exports `DataCenterLedger.ReleaseLibrary.v3.0`
- exports `DataCenterLedger.PublicReleaseHistory.v3.0`
- exports a compare handoff packet for a selected release and the release it supersedes
- restores an archived release manifest into the v2.8 signoff widget when present
- keeps all behavior local-only with no backend, no hidden network calls, and no external validation

A release library is a review convenience. It does not verify source truth, certify release readiness, publish records, or authorize sensitive infrastructure disclosure.

## v2.9 release archive index

v2.9 adds a local release archive widget that stores release artifacts in browser localStorage:

- paste or load `DataCenterLedger.GovernanceReleaseManifest` JSON packets
- paste or load `DataCenterLedger.ManifestCompare` release diff packets
- paste or load `DataCenterLedger.ReleaseSignoffPacket` JSON packets
- filter by artifact kind, decision, release name, schema, or digest
- export `DataCenterLedger.ReleaseArchiveIndex.v2.9`
- preserve the original packet payloads alongside searchable metadata
- send archived manifests or diffs into the v2.8 signoff widget when present
- keep the archive local-only with no backend, no hidden network calls, and no external validation

A release archive index is a local review convenience. It does not verify source truth, certify release readiness, publish records, or authorize sensitive infrastructure disclosure.

## Safety posture

Use public sources only. Do not use this tool to identify private facility details, collect sensitive coordinates, bypass security controls, or publish unreviewed infrastructure claims.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Deployment

GitHub Pages deploys from `.github/workflows/deploy-pages.yml`.
