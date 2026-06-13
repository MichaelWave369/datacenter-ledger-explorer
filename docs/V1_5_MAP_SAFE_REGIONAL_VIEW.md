# v1.5 Map-Safe Regional View

DataCenterLedger Explorer v1.5 adds a regional summary view that stays inside the public-data safety boundary.

The goal is to help reviewers understand where work is concentrated without turning the project into a targeting map.

## What changed

- Records can be summarized by state or county.
- Each region shows:
  - record count
  - canonical count
  - needs-review count
  - receipt count
  - average source-quality score
  - quality-band counts
  - status counts
  - precision counts
  - top regional review gaps
- Selecting a region filters the working review queue.
- Regional summaries can be exported as a JSON packet.
- Regional summaries are included in Ledger, canonical, launch, and selected receipt exports.

## Safety boundary

The regional view does **not** show:

- exact facility coordinates
- map markers
- private access details
- sensitive layouts
- internal infrastructure paths
- non-public enrichment

It only summarizes records using public state and county fields already present in the Ledger rows.

## Export schema

v1.5 adds:

- `DataCenterLedger.MapSafeRegionalSummary.v1.5`

It also updates:

- `DataCenterLedger.Export.v1.5-map-safe-regional-view`
- `DataCenterLedger.CanonicalRegistry.v1.5-map-safe-regional-view`
- `DataCenterLedger.PublicLaunchPacket.v1.5`
- `DataCenterLedger.SelectedReceiptPacket.v1.5`
- `DataCenterLedger.SourceQualityScoreboard.v1.5`
- `DataCenterLedger.ImportPreview.v1.5`
- `DataCenterLedger.ImportHistory.v1.5`
- `DataCenterLedger.ReceiptEditHistory.v1.5`

## Suggested review flow

1. Import public-source rows.
2. Preview and commit only records that pass the import gate.
3. Use the regional view to identify where review gaps are concentrated.
4. Select a region to filter the working queue.
5. Add receipts to records with missing source coverage.
6. Export the regional summary packet for human review.

## Important wording

Use:

> map-safe regional summary

Avoid:

> facility locator
> targeting map
> exact data center map

This keeps the project aligned with the public-data, civic transparency purpose.
