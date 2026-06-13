# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, and canonical export packets.

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
- paste/upload CSV preview before commit
- selected-record source receipt editor
- state/county regional summaries without exact coordinates
- selected-region evidence packets with checklist review
- full local workspace session export/import
- generated and manual local review tasks
- record and region public brief exports
- receipt-backed records
- canonical / non-canonical filtering
- JSON and Markdown export packets
- public-data safety docs
- GitHub Pages deploy workflow

The larger sprint package has evolved through v1.0 with import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, and action queues. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v1.9 public brief generator

v1.9 turns selected Ledger work into a human-readable public review brief:

- generate a selected-record brief
- generate a selected-region brief
- export `DataCenterLedger.PublicBrief.v1.9` as JSON
- export a Markdown brief for easy sharing or review
- include public safety boundary language
- include review-only / not-proof language
- summarize claims under review
- list source receipts and public links where present
- list unresolved gaps and canonical blockers
- include source quality or regional quality context
- avoid exact-coordinate or targeting-map presentation

Public briefs are communication aids. They do not prove that a record is true, do not claim completeness, and do not replace source review.

## v1.8 review queue + task board

v1.8 turns review gaps into local follow-up tasks:

- generates tasks from review warnings, canonical blockers, source-quality gaps, public-link gaps, and high-impact MW/second-source needs
- supports task categories such as `needs_second_source`, `needs_public_url`, `needs_permit_receipt`, `needs_utility_receipt`, `needs_location_review`, `needs_confidence_review`, `needs_source_quality`, and `ready_for_promotion`
- tracks task status as `open`, `in_progress`, `blocked`, `done`, or `dismissed`
- lets reviewers add manual follow-up tasks for the selected record
- filters tasks by status and category
- exports `DataCenterLedger.ReviewQueue.v1.8`

The review queue is a local workflow aid. It does not prove that records are true and does not replace human review.

## v1.7 local review session save/load

v1.7 lets a reviewer pause, archive, share, and restore a full local workspace without adding a backend:

- export `DataCenterLedger.LocalReviewSession.v1.7`
- restore a trusted session from pasted JSON or a JSON file
- preserve records, receipts, notes, import history, receipt edit history, source quality reports, regional summaries, selected region state, and UI filters
- generate deterministic session IDs and digests
- show local session history for export/load events
- keep all session handling browser-local with no hidden network calls

Session packets can contain reviewer notes and source links. Review them before sharing publicly.

## Run locally

```bash
npm install
npm run dev
```

## Typecheck and build

```bash
npm run typecheck
npm run build
```

## CSV import columns

The starter CSV parser accepts normalized rows with columns such as:

```csv
id,name,operator,status,state,county,city,lat,lon,capacity_mw,sqft,confidence,source,source_type,source_url,source_claim,retrieved_at
```

See `/data/normalized-template.csv`.

## Data-source posture

Good public sources may include:

- PNNL / IM3 Open Source Data Center Atlas
- Epoch AI Frontier Data Centers dataset
- public permits
- public utility filings
- public operator announcements
- public county or state records

Always preserve source receipts. Do not silently convert claims into facts.

## License

MIT License. See [`LICENSE`](./LICENSE).
