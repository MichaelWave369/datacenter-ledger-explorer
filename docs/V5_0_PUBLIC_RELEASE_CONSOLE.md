# v5.0 Public Release Console

DataCenterLedger Explorer v5.0 adds a consolidated local dashboard for the public release chain.

The console reads the v4.1 through v4.9 public release artifacts from browser storage and summarizes the entire public release workflow in one panel.

## Schema

```txt
DataCenterLedger.PublicReleaseConsole.v5.0
```

## Storage key

```txt
datacenter-ledger.public-release-console.v5.0
```

## Inputs summarized

- `DataCenterLedger.PublicSharePacket.v4.1`
- `DataCenterLedger.PublicShareRedactionAudit.v4.2`
- `DataCenterLedger.PublicShareApproval.v4.3`
- `DataCenterLedger.PublicShareBundle.v4.4`
- `DataCenterLedger.PublicShareReleaseManifest.v4.5`
- `DataCenterLedger.PublicReleaseIndex.v4.6`
- `DataCenterLedger.PublicReleaseCompare.v4.7`
- `DataCenterLedger.PublicReleaseRestoreHandoff.v4.8`
- `DataCenterLedger.PublicReleaseIntegritySeal.v4.9`

## What the console shows

- overall public release chain status
- present versus missing artifacts
- ready/review/blocked counts
- release title and version
- active manifest digest
- integrity seal digest
- per-step status and digest
- per-step detail summary

## Status meanings

| Status | Meaning |
|---|---|
| `ready` | The artifact is present and appears export-ready for this workflow step. |
| `review` | The artifact is present but carries warnings, missing optional context, or review-state conditions. |
| `blocked` | The artifact reports blockers or failed gate conditions. |
| `missing` | The artifact was not found in local browser storage. |

## Safety boundary

The console performs no external fetches, no geocoding, no private facility discovery, no coordinate enrichment, and no source-truth certification.

It summarizes local public release workflow artifacts only.

## Suggested workflow

1. Build the public share pipeline through v4.9.
2. Open v5.0.
3. Click **Refresh console**.
4. Review missing/review/blocked statuses.
5. Export the console snapshot if a high-level release dashboard artifact is needed.
