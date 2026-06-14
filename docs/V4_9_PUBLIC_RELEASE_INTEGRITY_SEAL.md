# v4.9 Public Release Integrity Seal

DataCenterLedger Explorer v4.9 adds a local-first integrity seal for public release artifacts.

The seal reads the active v4.5 public release manifest, the v4.6 public release index, the latest v4.7 compare report, and the latest v4.8 restore handoff. It then exports a compact integrity packet that records whether the active public release has a clear local artifact trail.

## Schema

```txt
DataCenterLedger.PublicReleaseIntegritySeal.v4.9
```

## Storage key

```txt
datacenter-ledger.public-release-integrity-seal.v4.9
```

## Inputs

- `DataCenterLedger.PublicShareReleaseManifest.v4.5`
- `DataCenterLedger.PublicReleaseIndex.v4.6`
- `DataCenterLedger.PublicReleaseCompare.v4.7`
- `DataCenterLedger.PublicReleaseRestoreHandoff.v4.8`

## What the seal checks

- active manifest exists and is export-ready
- bundle digest is present
- share, audit, and approval digests are present
- manifest appears in the v4.6 index
- index latest pointer matches the active manifest
- latest compare report references the active manifest
- latest restore handoff references the active manifest
- restore handoff source-chain digests match the active manifest
- manifest carries a public release safety boundary

## Seal status

| Status | Meaning |
|---|---|
| `sealed` | No blockers or review findings were detected. |
| `review` | No blockers were detected, but one or more linkage checks need human review. |
| `blocked` | One or more required integrity checks failed. |
| `missing_artifacts` | Reserved for future multi-file seal imports. |

## Safety boundary

The v4.9 seal does not fetch external data, enrich locations, reveal private facility details, certify source truth, or authorize publication. It only checks local public release artifact linkage.

## Suggested workflow

1. Build or restore a v4.5 public release manifest.
2. Index manifests through v4.6.
3. Optionally compare releases through v4.7.
4. Optionally restore a manifest through v4.8.
5. Open v4.9.
6. Build the integrity seal.
7. Resolve blockers or review findings.
8. Export `DataCenterLedger.PublicReleaseIntegritySeal.v4.9`.
