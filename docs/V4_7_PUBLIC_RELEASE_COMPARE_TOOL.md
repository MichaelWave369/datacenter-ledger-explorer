# v4.7 Public Release Compare Tool

DataCenterLedger Explorer v4.7 adds a local-first comparison layer for public release history.

The compare tool reads the v4.6 public release index, lets a reviewer choose two indexed v4.5 public release manifests, and exports a side-by-side comparison packet.

## Schema

```txt
DataCenterLedger.PublicReleaseCompare.v4.7
```

## Storage key

```txt
datacenter-ledger.public-release-compare.v4.7
```

## Inputs

- `DataCenterLedger.PublicReleaseIndex.v4.6`
- Indexed `DataCenterLedger.PublicShareReleaseManifest.v4.5` entries

## What it compares

The report compares public release manifest metadata and digest lineage only:

- release title
- release version
- gate status
- export readiness
- public record count
- represented state count
- warning record count
- bundle digest
- share digest
- audit digest
- approval digest
- viewer digest
- final layer digest
- audit status
- approval status
- accepted review-warning flag
- safety boundary count
- release notes
- release notice

## Status meaning

| Status | Meaning |
|---|---|
| `same` | No compared fields changed. |
| `changed` | Non-gate metadata or digest fields changed. |
| `review` | Gate, approval, audit, notice, or review-warning fields changed. |
| `invalid` | Reserved for malformed future comparison inputs. |

## Safety boundary

The comparison layer does not fetch external data, enrich locations, reveal private facility details, or certify source truth. It compares already-indexed public release metadata stored in the local browser.

## Public-safe purpose

v4.7 helps a reviewer understand what changed between two public release manifests before sharing or restoring release history.

It is not a complete national map, not a publication authorization, and not evidence that source claims are true.

## Suggested workflow

1. Build or load public releases through v4.5.
2. Add those manifests to the v4.6 index.
3. Open v4.7.
4. Choose a baseline release and candidate release.
5. Run comparison.
6. Review changed and review-state fields.
7. Export the compare report if useful.
