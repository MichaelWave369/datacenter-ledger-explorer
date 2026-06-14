# v4.5 Public Share Release Manifest

The v4.5 sprint adds a top-level public release manifest for `DataCenterLedger.PublicShareBundle.v4.4` packets.

The release manifest is the final public wrapper around the public-share chain. It does not create new facility claims or upgrade location precision. It records what bundle is being released, when it was prepared, which source digests it references, and what safety boundary applies.

## Schema

```txt
DataCenterLedger.PublicShareReleaseManifest.v4.5
```

## Storage key

```txt
datacenter-ledger.public-share-release-manifest.v4.5
```

## Inputs

The manifest accepts only:

```txt
DataCenterLedger.PublicShareBundle.v4.4
```

The bundle must be export-ready. Blocked bundles cannot produce an exportable release manifest.

## Review gate

The v4.5 gate produces one of four statuses:

```txt
release_ready
review_release
blocked
missing_bundle
```

A release can export when:

- a valid v4.4 public share bundle is loaded
- the bundle gate is export-ready
- the bundle reports at least one public record
- the bundle reports no audit blockers
- release notes explain what is being shared

Review-state bundles can still export as `review_release`, but the manifest discloses that warnings exist upstream.

## Manifest contents

A v4.5 release manifest includes:

- release title
- release version
- release notes
- prepared-by label
- source bundle schema and digest
- public record count
- state count
- warning record count
- share/audit/approval source digests
- viewer/final-layer source digests
- release file list
- safety boundary
- release notice
- manifest digest

## Explicit boundaries

The manifest states:

- public-source review only
- no hidden network calls
- no private facility discovery
- no coordinate or address enrichment
- no certification of source truth
- no complete national map claim
- no sensitive publication authorization

## Operator workflow

1. Build or load a v4.4 public share bundle.
2. Enter release title, release version, prepared-by label, and release notes.
3. Build the release manifest.
4. Review gate messages.
5. Export the JSON manifest when the gate is export-ready.

## Export

The export filename includes the manifest digest:

```txt
DataCenterLedger_PublicShareReleaseManifest_v4.5_<manifestDigest>.json
```

## Why this matters

v4.5 creates a clean top-level release artifact that can accompany a public share bundle without exposing reviewer-only material or implying that the data is complete, certified, or sensitive-location enriched.
