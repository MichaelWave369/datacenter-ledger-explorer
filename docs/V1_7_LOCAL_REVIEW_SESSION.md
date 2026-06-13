# v1.7 Local Review Session Save/Load

DataCenterLedger Explorer v1.7 adds a browser-local review session packet.

The goal is to let a reviewer pause, archive, share, and restore a full workspace without adding a backend, account system, cloud sync, hidden network calls, or sensitive enrichment.

## What changed

- A new **Local Review Session** panel appears near the top of the app.
- Reviewers can name a session and export it as JSON.
- Reviewers can restore a trusted session from pasted JSON or a JSON file.
- Session export and load events are recorded in local session history.

## Session packet contents

A `DataCenterLedger.LocalReviewSession.v1.7` packet includes:

- records
- receipts
- reviewer notes
- import history
- receipt edit history
- source quality reports
- regional summaries
- selected state/county region state
- selected record and UI filters
- public-data boundary
- deterministic session ID
- deterministic digest

## Restore validation

The app only restores packets that match the v1.7 local review session schema.

A load is blocked if:

- the JSON cannot be parsed
- the schema is not `DataCenterLedger.LocalReviewSession.v1.7`
- required arrays such as records, import history, or receipt history are missing
- UI state is missing

## Public safety posture

Session packets are still local files. They may contain reviewer notes, public source URLs, and source claims.

Before sharing a session packet publicly, review it for:

- private notes
- accidental exact coordinates
- non-public source details
- private access details
- sensitive layouts
- raw claims that have not been reviewed

The app does not upload session packets anywhere and does not create hidden network calls.

## Suggested review flow

1. Import public-source records.
2. Attach receipts and notes.
3. Review source quality and regional evidence packets.
4. Export a local review session before pausing work.
5. Share only after checking the session packet for public-safety issues.
6. Restore trusted packets later to continue review.

## Export schema

```txt
DataCenterLedger.LocalReviewSession.v1.7
```

This is a workspace continuity packet, not a truth certificate and not a public canonical registry by itself.
