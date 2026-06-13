# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, and canonical export packets.

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
- paste/upload CSV preview before commit
- batch IDs and import history
- selected-record source receipt editor
- receipt validation and receipt edit history
- source-quality reports and export packets
- state/county regional summaries without exact coordinates
- receipt-backed records
- canonical / non-canonical filtering
- JSON export packets
- public-data safety docs
- GitHub Pages deploy workflow
- public launch onboarding and safe-use walkthrough

The larger sprint package has evolved through v1.0 with import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, and action queues. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v1.5 map-safe regional view

v1.5 adds a regional summary layer without turning the app into a targeting map:

- summarize records by state or county
- show record counts, canonical counts, needs-review counts, receipt counts, and average quality
- show quality-band counts for each region
- show status counts and precision counts by region
- surface top regional review gaps
- select a region to filter the working queue
- export `DataCenterLedger.MapSafeRegionalSummary.v1.5`
- include regional summaries in Ledger, canonical, launch, and selected receipt exports

The regional view does not display exact coordinates, facility markers, access details, sensitive layouts, or non-public enrichment. It is a public-data review summary, not a facility locator.

## v1.4 source quality scoreboard

v1.4 adds a visible source-quality layer for every record:

- scores records from 0-100
- assigns quality bands: `strong`, `moderate`, `weak`, or `blocked`
- scores receipt count, source-type diversity, public-link coverage, recency, high-impact claim coverage, confidence, and unresolved warning count
- adds a source-quality scoreboard above the import workbench
- adds a selected-record quality report in the drawer
- adds source quality to the working registry table
- exports `DataCenterLedger.SourceQualityScoreboard.v1.4`
- includes source-quality reports in Ledger, canonical, launch, and selected receipt exports
- adds `source quality below 65` to the canonical blocker list

The score is a review aid, not a truth claim. A high score means the record has a stronger receipt posture; it does not prove the underlying claim is true.

## v1.3 receipt editor workbench

v1.3 lets reviewers improve a selected record after import without leaving the browser:

- add a source receipt directly to the selected record
- capture source name, source type, public URL, retrieved date, confidence, and claim text
- validate receipt drafts before adding them
- warn on missing public URLs, short claim text, and vague source type
- block receipts with missing source name, missing claim text, invalid date, or invalid URL
- automatically resolve matching review warnings when a new receipt supports them
- record receipt edit history with deterministic digests
- export selected-record receipt packets
- export full receipt edit history packets

## v1.2 import review workbench

v1.2 makes imports safer and more reviewable before anything enters the Ledger:

- paste CSV or load a CSV file into a local workbench
- preview normalized Ledger rows before commit
- generate a deterministic import batch ID and preview digest
- detect duplicate record IDs already in the workspace
- detect duplicate IDs inside the incoming batch
- warn on missing source names, missing counties/cities, unsupported status/source types, exact-coordinate columns, and high-impact MW claims
- block commit when structural issues are present, such as missing state or duplicate IDs
- export import preview packets and import history packets
- preserve source URL, source claim, retrieved date, confidence, and batch ID on receipts

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
