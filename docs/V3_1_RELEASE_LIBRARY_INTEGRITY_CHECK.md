# v3.1 Release Library Integrity Check

## Purpose

v3.1 adds a local integrity audit for the release library. It reads the v2.9 release archive and v3.0 lineage metadata stored in browser localStorage, then produces a review-only integrity report before a public release history is exported or shared.

The feature is designed to make release history safer, not louder. It helps reviewers see consistency problems before they rely on archived manifests, release diffs, signoff packets, or lineage notes.

## Local storage inputs

The integrity checker reads two existing local storage keys:

- `datacenter-ledger.release-archive.v2.9`
- `datacenter-ledger.release-library-lineage.v3.0`

It does not call a backend, send data to a service, scrape anything, or validate claims externally.

## Findings generated

The checker can flag:

- duplicate digests
- unknown artifact schemas
- missing schema metadata
- missing app-version metadata
- stale lineage metadata
- broken supersedes links
- self-supersedes links
- lineage links without notes
- manifests with pending approvals
- approved signoffs that still report blockers
- manifests without matching signoff packets
- manifests without matching release diffs
- signoff packets without embedded release manifests
- multiple approved releases without any supersedes lineage
- held or needs-review releases that also have public lineage metadata

## Severity classes

Findings use three severity classes:

- `blocker` — fix before relying on the public history export.
- `warning` — review before sharing or treating the library as clean.
- `info` — useful context or improvement opportunity.

## Export schema

The export schema is:

```json
{
  "schema": "DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1",
  "generatedAt": "ISO-8601 timestamp",
  "appVersion": "3.1.0",
  "summary": {
    "status": "clear | review | blocked | empty",
    "totalEntries": 0,
    "blockers": 0,
    "warnings": 0,
    "info": 0,
    "duplicateDigests": 0,
    "brokenLineageLinks": 0,
    "missingSignoffs": 0,
    "missingDiffs": 0,
    "unknownArtifacts": 0
  },
  "findings": [],
  "checkedDigests": [],
  "safetyBoundary": [],
  "reviewOnlyNotice": "...",
  "reportDigest": "dcl-..."
}
```

## Review flow

1. Add governance manifests, release diffs, and signoff packets to the v2.9 archive.
2. Add release labels and supersedes metadata in v3.0 Release Library Mode.
3. Run v3.1 Release Library Integrity Check.
4. Resolve blockers first.
5. Review warnings before public-history export.
6. Export `DataCenterLedger.ReleaseLibraryIntegrityReport.v3.1` as supporting review evidence.

## Safety boundary

The report is a local review artifact only. It does not prove that a source is true, that a release is legally safe, or that an infrastructure claim is correct. It does not publish records, discover private facilities, enrich sensitive location data, or authorize anyone to disclose sensitive infrastructure details.

## Non-goals

v3.1 does not:

- verify external source truth
- perform legal review
- certify a release
- upload archive data
- replace human source review
- bypass the two-person approval rule
- make a held release safe to publish
