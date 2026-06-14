# v4.6 Public Release Index

DataCenterLedger Explorer v4.6 adds a local browser index for exported public share release manifests.

The index is designed to help reviewers keep track of public share releases without adding a backend, remote registry, hidden network calls, or sensitive location enrichment.

## What v4.6 adds

- Load the latest `DataCenterLedger.PublicShareReleaseManifest.v4.5` from browser storage
- Paste or load a v4.5 release manifest JSON file
- Add or update the manifest in a local release index
- Search by title, release version, digest, or release note preview
- Filter by release gate status
- Restore an indexed manifest back into the latest v4.5 manifest storage key
- Remove indexed entries locally
- Export `DataCenterLedger.PublicReleaseIndex.v4.6`
- Store the latest index under `datacenter-ledger.public-release-index.v4.6`

## Packet schema

The exported packet uses:

```txt
DataCenterLedger.PublicReleaseIndex.v4.6
```

It contains:

- generated timestamp
- app version
- indexed release count
- status counts
- latest manifest digest
- indexed release entries
- source v4.5 manifest snapshots
- safety boundary
- index notice
- index digest

## Entry fields

Each indexed release entry includes:

- entry ID
- manifest digest
- release title
- release version
- generated timestamp
- indexed timestamp
- gate status
- export eligibility
- public record count
- state count
- warning record count
- source bundle digest
- share, audit, and approval digests
- release note preview
- source manifest snapshot
- entry digest

## Review behavior

v4.6 does not publish anything by itself. It only keeps a local browser-side library of v4.5 public release manifests.

The restore action places an indexed manifest back into:

```txt
datacenter-ledger.public-share-release-manifest.v4.5
```

That makes it available to downstream tools without network access.

## Boundary

The public release index:

- uses public-source review artifacts only
- does not make hidden network calls
- does not discover private facilities
- does not enrich coordinates or addresses
- does not certify source truth
- does not make a complete national map
- does not authorize sensitive publication

## Suggested workflow

1. Build a v4.5 public share release manifest.
2. Open v4.6 Public Release Index.
3. Load the latest v4.5 manifest.
4. Add it to the index.
5. Search or filter previous releases as needed.
6. Restore older manifests for review or comparison.
7. Export the v4.6 release index as a local release-library artifact.
