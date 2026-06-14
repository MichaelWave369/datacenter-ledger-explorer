# v4.8 Public Release Restore + Handoff

DataCenterLedger Explorer v4.8 adds a local restore lane for public release manifests.

The restore handoff reads the v4.6 public release index, lets a reviewer select an indexed v4.5 manifest, restores that manifest into the active v4.5 release-manifest storage slot, and exports a restore receipt.

## Schema

```txt
DataCenterLedger.PublicReleaseRestoreHandoff.v4.8
```

## Storage key

```txt
datacenter-ledger.public-release-restore-handoff.v4.8
```

## Restore target

```txt
datacenter-ledger.public-share-release-manifest.v4.5
```

## Inputs

- `DataCenterLedger.PublicReleaseIndex.v4.6`
- Indexed `DataCenterLedger.PublicShareReleaseManifest.v4.5` entries
- Optional latest `DataCenterLedger.PublicReleaseCompare.v4.7` context

## Restore modes

| Mode | Meaning |
|---|---|
| `restore_for_review` | Bring an indexed release manifest back into the active slot for review. |
| `restore_for_reexport` | Bring an indexed release manifest back for re-export workflow checks. |
| `restore_for_comparison_followup` | Restore a release after a comparison review. |

## What the handoff records

- selected manifest digest
- release title and version
- gate status and export flag
- public record count
- state count
- warning count
- bundle/share/audit/approval digests
- restore target key
- restore mode
- optional compare context
- reviewer/operator name
- restore note
- restore handoff digest

## Safety boundary

v4.8 does not fetch missing public data, enrich locations, recover missing bundles, discover facilities, or authorize publication.

It restores a previously indexed public release manifest from local browser storage so the reviewer can continue the public release workflow.

## Suggested workflow

1. Build public share artifacts through v4.5.
2. Add manifests to the v4.6 index.
3. Optionally compare releases in v4.7.
4. Open v4.8.
5. Select an indexed release manifest.
6. Choose a restore mode.
7. Add reviewer/operator name and restore note.
8. Restore the selected manifest.
9. Export the handoff receipt.
