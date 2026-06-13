# v1.6 Regional Evidence Packet

DataCenterLedger Explorer v1.6 adds a one-click evidence bundle for the selected map-safe state or county region.

The goal is to help a reviewer understand what is known, what is sourced, what is still blocked, and what needs human review before a region is treated as public/canonical.

## What changed

- The selected regional summary now produces a `DataCenterLedger.RegionalEvidencePacket.v1.6` export.
- The packet includes:
  - selected regional summary
  - regional records
  - source-quality reports
  - canonical blockers
  - unresolved review warnings
  - receipt lists
  - receipt coverage summary
  - public-link coverage
  - human review checklist
  - human review prompts
  - deterministic digest

## Review checklist

The packet includes checklist items for:

- map-safe boundary
- receipt coverage
- public-link coverage
- average source quality
- high-impact claims such as MW capacity
- unresolved warnings
- location precision
- blocked source-quality records

Checklist statuses are:

- `pass`
- `warning`
- `fail`
- `needs_human`

## Public safety boundary

The regional evidence packet is not a facility locator and should not become one.

Do not include:

- exact markers
- facility layouts
- private access details
- non-public enrichment
- sensitive security context
- instructions that could help target infrastructure

Keep regional outputs at state/county precision unless exact location data is already public and appropriate to cite.

## Export schemas

v1.6 adds or updates these schemas:

- `DataCenterLedger.RegionalEvidencePacket.v1.6`
- `DataCenterLedger.Export.v1.6-regional-evidence-packet`
- `DataCenterLedger.CanonicalRegistry.v1.6-regional-evidence-packet`
- `DataCenterLedger.MapSafeRegionalSummary.v1.6`
- `DataCenterLedger.SourceQualityScoreboard.v1.6`
- `DataCenterLedger.PublicLaunchPacket.v1.6`
- `DataCenterLedger.SelectedReceiptPacket.v1.6`
- `DataCenterLedger.ImportPreview.v1.6`
- `DataCenterLedger.ImportHistory.v1.6`
- `DataCenterLedger.ReceiptEditHistory.v1.6`

## Suggested review flow

1. Select state or county mode.
2. Click the region to review.
3. Read the regional table and selected regional packet card.
4. Review receipt coverage, public-link coverage, and checklist results.
5. Export the regional evidence packet.
6. Resolve warnings and add receipts before public promotion.
