# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, and canonical export packets.

## Public boundary

**Public-data only • No hidden network calls • No private facility discovery • No security-sensitive enrichment**

Exact coordinates should only be used when already published by a public dataset. Otherwise, prefer city, county, or state precision.

## Current repo state

This repo contains the public-safe source scaffold for DataCenterLedger Explorer:

- React + Vite + TypeScript app
- local demo records
- normalized CSV import
- receipt-backed records
- canonical / non-canonical filtering
- JSON export packets
- public-data safety docs
- CI workflow for typecheck + build

The larger sprint package has evolved through v1.0 with import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, and action queues. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

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
id,name,operator,status,state,county,city,lat,lon,capacity_mw,sqft,confidence,source
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
