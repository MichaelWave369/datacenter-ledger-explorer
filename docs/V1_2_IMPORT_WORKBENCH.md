# v1.2 Import Review Workbench

The v1.2 sprint adds a local-first CSV import review gate before records enter the DataCenterLedger workspace.

## Goal

Make public-source imports safer and more reviewable by converting raw CSV rows into previewed Ledger records with warnings, batch IDs, receipts, and deterministic preview digests.

## Public safety posture

This feature is designed for public civic transparency work. It should not be used for private discovery, sensitive infrastructure enrichment, access details, or unreviewed exact-coordinate publishing.

The app may detect coordinate columns during import, but it does not display coordinates on the live page. Reviewers should still confirm that any coordinates kept in external datasets are already public and appropriate to use.

## Import flow

1. Paste normalized CSV or load a local CSV file.
2. Preview the batch before commit.
3. Review warnings and blocking issues.
4. Export the preview packet if a human reviewer needs to inspect it.
5. Commit the batch only when blocking issues are resolved.
6. Continue review inside the working registry before any public promotion.

## Validation behavior

The workbench warns on:

- missing source names
- missing county/city context
- unsupported status values
- unsupported source_type values
- missing confidence values
- exact-coordinate columns
- MW capacity claims that need stronger corroboration

The workbench blocks commit on:

- missing state/state_abb
- duplicate record IDs already present in the workspace
- duplicate record IDs inside the import batch

## Receipt fields

The normalized template supports:

```csv
source,source_type,source_url,source_claim,retrieved_at
```

These become source receipts on each imported record.

## Export schemas

v1.2 introduces or updates these local export labels:

- `DataCenterLedger.Export.v1.2-import-workbench`
- `DataCenterLedger.CanonicalRegistry.v1.2-import-workbench`
- `DataCenterLedger.PublicLaunchPacket.v1.2`
- `DataCenterLedger.ImportPreview.v1.2`
- `DataCenterLedger.ImportHistory.v1.2`

## Next sprint candidate

A strong v1.3 sprint would be a receipt editor: let reviewers add or edit source receipts directly on a selected record, then automatically resolve matching warnings such as missing public source, missing utility source, or missing corroboration.
