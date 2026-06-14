# v5.1 Public Console Quick Actions

DataCenterLedger Explorer v5.1 adds a local quick-action layer for the public release console.

The quick actions panel appears after the v5.0 console and helps operate the public-release cockpit without scrolling through every panel manually.

## Schema

```txt
DataCenterLedger.PublicConsoleQuickActions.v5.1
```

## Storage key

```txt
datacenter-ledger.public-console-quick-actions.v5.1
```

## What it reads

v5.1 reads local browser artifacts only:

- `DataCenterLedger.PublicSharePacket.v4.1`
- `DataCenterLedger.PublicShareRedactionAudit.v4.2`
- `DataCenterLedger.PublicShareApproval.v4.3`
- `DataCenterLedger.PublicShareBundle.v4.4`
- `DataCenterLedger.PublicShareReleaseManifest.v4.5`
- `DataCenterLedger.PublicReleaseIndex.v4.6`
- `DataCenterLedger.PublicReleaseCompare.v4.7`
- `DataCenterLedger.PublicReleaseRestoreHandoff.v4.8`
- `DataCenterLedger.PublicReleaseIntegritySeal.v4.9`
- `DataCenterLedger.PublicReleaseConsole.v5.0`

## Quick actions

- refresh quick-action snapshot
- trigger the v5.0 console refresh button
- jump to mounted public-release panels
- export any present local public-release artifact
- export the v5.1 quick-action snapshot
- clear the v5.1 snapshot without deleting source artifacts

## Safety boundary

The quick-action panel does not fetch external data, enrich locations, reveal private facility details, or certify source truth.

It only reads local browser artifacts and mounted local panels.

## Public-safe purpose

v5.1 makes the growing cockpit easier to operate without weakening the public-data boundary.

It helps reviewers navigate, export, and inspect local artifacts quickly, but it does not authorize publication or create a complete national map.
