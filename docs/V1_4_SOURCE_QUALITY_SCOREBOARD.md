# v1.4 Source Quality Scoreboard

DataCenterLedger Explorer v1.4 adds a source-quality scoreboard for every record in the local workspace.

The scoreboard is a review aid. It does not prove that a data center record is true. It shows whether a record has enough public, reviewable source support to be treated as a stronger candidate for canonical promotion.

## What the score considers

Each record receives a 0-100 score based on:

- receipt count
- source-type diversity
- public-link coverage
- receipt recency
- high-impact claim coverage
- confidence score
- unresolved review warnings

## Quality bands

- `strong`: 80-100
- `moderate`: 60-79
- `weak`: 40-59
- `blocked`: below 40 or missing receipts

## High-impact claims

MW / capacity claims are treated as high-impact claims.

A record with a positive MW value needs stronger receipt posture before promotion. In v1.4, a high-impact claim is considered covered when it has:

- at least two receipts
- at least one non-review source type
- at least one public source URL

Otherwise, the score reports `needs_second_source`.

## Canonical gate change

v1.4 adds a new canonical blocker:

```txt
source quality below 65
```

A locally promoted record can still be excluded from canonical export if the source-quality score is too low.

## New exports

v1.4 adds or updates these export schemas:

- `DataCenterLedger.SourceQualityScoreboard.v1.4`
- `DataCenterLedger.Export.v1.4-source-quality-scoreboard`
- `DataCenterLedger.CanonicalRegistry.v1.4-source-quality-scoreboard`
- `DataCenterLedger.SelectedReceiptPacket.v1.4`
- `DataCenterLedger.PublicLaunchPacket.v1.4`
- `DataCenterLedger.ImportPreview.v1.4`
- `DataCenterLedger.ImportHistory.v1.4`
- `DataCenterLedger.ReceiptEditHistory.v1.4`

## Safe use

Do not use the score as proof of truth.

Use it to ask better review questions:

- Does this record have enough independent public receipts?
- Are the receipts recent?
- Do the receipts include public links?
- Are high-impact claims corroborated?
- Are there still unresolved warnings?

A score is only a review posture signal.
