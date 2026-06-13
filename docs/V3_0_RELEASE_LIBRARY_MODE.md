# v3.0 Release Library Mode

v3.0 turns the local v2.9 release archive into a release library. It remains local-first and public-safe: no backend, no hidden network calls, no external validation, and no sensitive-location enrichment.

## What it adds

- A visible **v3.0 Release Library Mode** panel.
- Reads archived governance release manifests, manifest diffs, and signoff packets from the v2.9 browser-local archive.
- Adds public release labels and lineage notes.
- Records which release supersedes an earlier release.
- Shows release lineage cards and a public release history view.
- Exports `DataCenterLedger.ReleaseLibrary.v3.0`.
- Exports `DataCenterLedger.PublicReleaseHistory.v3.0`.
- Exports a `DataCenterLedger.ReleaseCompareHandoff.v3.0` packet for a selected release and the release it supersedes.
- Restores a selected archived manifest into the v2.8 signoff widget when that widget is present.

## Local storage

v3.0 reads release artifacts from:

```txt
localStorage: datacenter-ledger.release-archive.v2.9
```

It stores lineage metadata separately in:

```txt
localStorage: datacenter-ledger.release-library-lineage.v3.0
```

This keeps the original archive entries intact while allowing the library layer to add release-history meaning.

## ReleaseLibrary packet

The exported packet uses:

```txt
schema: DataCenterLedger.ReleaseLibrary.v3.0
```

It includes:

- app version
- generated timestamp
- full library entries
- original archived payloads
- lineage links
- public release history
- summary counts
- safety boundary
- review-only notice
- library digest

## Public history packet

The public history export uses:

```txt
schema: DataCenterLedger.PublicReleaseHistory.v3.0
```

It includes a lighter table of release names, labels, digests, decisions, readiness state, supersedes links, superseded-by links, and timestamps.

## Compare handoff

When a selected release has a supersedes target, v3.0 can export:

```txt
schema: DataCenterLedger.ReleaseCompareHandoff.v3.0
```

This packet contains a baseline artifact, candidate artifact, both digests, safety boundary, review-only notice, and a handoff digest. It is a handoff for review. It does not certify that either release is correct.

## Review flow

1. Add release artifacts through the v2.9 archive panel.
2. Open v3.0 Release Library Mode.
3. Select a current release.
4. Pick the release it supersedes, if any.
5. Add a public label and lineage notes.
6. Save lineage metadata.
7. Export the full release library or public history.
8. Use compare handoff or restore-to-signoff when needed.

## Safety boundary

- Public-data only.
- No hidden network calls.
- No private facility discovery.
- No security-sensitive enrichment.
- Release library entries are review artifacts, not proof.
- The library does not publish data or authorize release decisions.

## Non-goals

v3.0 does not verify source truth, discover private facilities, certify legal authorization, replace human review, or publish a public registry by itself.
