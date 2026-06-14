# v5.2 Public Console Guided Flow

DataCenterLedger Explorer v5.2 adds a step-by-step operator guidance layer for the public release cockpit.

The guided flow reads local v4.1 through v5.1 public-release artifacts, decides what is missing, blocked, or ready, and gives the operator a clear next step.

## Schema

```txt
DataCenterLedger.PublicConsoleGuidedFlow.v5.2
```

## Storage key

```txt
datacenter-ledger.public-console-guided-flow.v5.2
```

## Inputs

The guided flow reads local browser artifacts only:

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
- `DataCenterLedger.PublicConsoleQuickActions.v5.1`

## What it does

v5.2 creates a guided-flow snapshot with:

- total steps
- ready/review/blocked/missing counts
- recommended next step
- recommended operator instruction
- per-step artifact digest
- per-step panel target availability
- per-step jump action
- per-step export action
- full public-safe boundary notice

## Operator actions

The panel supports:

- refresh guided flow
- jump to next recommended step
- export guided-flow snapshot
- clear guided-flow snapshot
- jump to any public-release panel
- export any available local public-release artifact

## Safety boundary

Guided flow does not fetch external data, enrich locations, reveal private facility details, certify source truth, or authorize publication. It only reads local public-release artifacts and suggests workflow next steps.

## Suggested workflow

1. Refresh the v5.2 guided flow.
2. Read the next recommended step.
3. Jump to the target panel.
4. Create, review, or repair the artifact.
5. Return to v5.2 and refresh again.
6. Repeat until the chain is ready or intentionally held for review.
7. Export the guided-flow snapshot as an operator receipt.
