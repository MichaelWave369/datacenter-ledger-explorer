# DataCenterLedger Explorer

A local-first React + TypeScript workbench for building a **public-data, receipt-backed registry** of U.S. data center records.

This project is not a targeting map and does not claim to be a complete national database. It is a review tool for organizing public records, source receipts, confidence scores, lifecycle decisions, import review batches, receipt edits, source-quality scores, map-safe regional summaries, regional evidence packets, local review sessions, review tasks, public briefs, canonical review packets, promotion receipts, selected-record audit timelines, pending change approvals, canonical change receipts, approval role profiles, and canonical export packets.

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
- local reviewer role gates for approvals, promotion, public briefs, regional packets, canonical exports, imports, receipts, and session restore
- selected-record before/after change diff
- pending approval requests before workspace mutation
- approve/reject decisions with reviewer notes
- local change receipts with approval linkage
- selected-record audit timeline export
- checklist-backed promotion receipts
- record and region public brief exports
- full local workspace session export/import
- JSON and Markdown export packets
- public-data safety docs
- GitHub Pages deploy workflow

The larger sprint package has evolved through v1.0 with import adapters, reconciliation, merge lineage, promotion, rollback, canonical registry exports, source-quality drift audits, reviewer evidence bundles, and action queues. This public repo is intentionally structured so those modules can be added without shipping sensitive or unreviewed data.

## v2.4 approval role profiles

v2.4 adds a local governance layer for review actions:

- active reviewer name and role selector
- role profiles for `viewer`, `data_reviewer`, `source_reviewer`, `regional_reviewer`, `publisher`, and `admin`
- role permissions for import, receipt editing, change submission, approval/rejection, reviewed markers, promotion, public brief export, regional packet export, canonical export, and session restore
- visible role gates showing pass/block status for major actions
- role metadata in local sessions, public briefs, regional packets, approval requests, change receipts, promotion receipts, ledger exports, canonical exports, and audit timelines
- approval is still local-first: a role gate is a review safeguard, not identity proof or security authentication
- export `DataCenterLedger.RoleProfile.v2.4`

Role profiles do not prove a source is true, do not authenticate a person, do not grant access to private systems, and do not make private or sensitive infrastructure details safe to publish.

## v2.3 change approval queue

v2.3 prevents proposed changes from silently overwriting the workspace:

- selected-record edits create a pending `ChangeApprovalRequest`
- approval requests preserve before/after record snapshots
- approval requests include field deltas, impact level, source-quality snapshots, and canonical blocker snapshots
- submit is blocked until there is at least one field delta and a reviewer reason
- a selected record can only have one pending approval at a time
- approving a request applies the change and creates a local `ChangeReceipt`
- rejecting a request records a decision note without changing the record
- approval events appear in the selected-record audit timeline
- export `DataCenterLedger.ChangeApprovalQueue.v2.3`
- export `DataCenterLedger.PendingChangeReview.v2.3`

Approval is still a local review workflow. It does not prove a record is true, does not validate a public source automatically, and must not be used to publish non-public or sensitive infrastructure details.

## v2.2 canonical diff + change review

v2.2 protects the workspace from silent drift when a selected record changes:

- edit a selected record in a protected change-review cockpit
- preview before/after field deltas before applying changes
- mark each changed field as low, medium, or high impact
- show source-quality score before and after the proposed change
- show canonical blockers before and after the proposed change
- require a reviewer and change reason before applying a change
- create a local `ChangeReceipt` with timestamp, reason, deltas, quality snapshots, canonical blocker snapshots, and digest
- include change receipts in Ledger, canonical, session, and audit timeline exports
- export `DataCenterLedger.CanonicalChangeReview.v2.2`
- export `DataCenterLedger.ChangeHistory.v2.2`

Change review is a local governance layer. It does not prove a record is true and does not make non-public data safe to publish.

## v2.1 promotion audit timeline

v2.1 adds a selected-record audit timeline that gathers review history into one exportable trail:

- import batch events
- source receipt events
- receipt edit events
- generated and manual task events
- source quality evaluation events
- public brief generation events
- reviewed lifecycle marker
- promotion receipt events
- local session restore markers
- reviewer note events
- export `DataCenterLedger.PromotionAuditTimeline.v2.1`

The timeline is a local review chronology. It does not prove a record is true, does not replace source review, and must not be treated as a complete public history.

## v2.0 canonical review mode

v2.0 makes promotion explicit, reviewable, and receipt-backed:

- selected-record promotion cockpit
- checklist gates for receipts, source quality, confidence, unresolved warnings, precision, high-impact MW claims, public brief readiness, safety acknowledgment, and reviewer reason
- `reviewed` lifecycle step before `promoted_public`
- locked promotion until required gates pass
- local promotion receipt with reviewer, reason, checklist snapshot, source-quality snapshot, prior lifecycle, timestamp, and digest

Promotion still does not prove a record is true. It only records that the local review gates were satisfied at the time of promotion.

## Run locally

```bash
npm install
npm run dev
```
