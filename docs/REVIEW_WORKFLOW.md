# Review Workflow

1. Import public records as raw working rows.
2. Preserve receipts for every claim.
3. Check confidence, source diversity, recency, and disputes.
4. Resolve validation warnings.
5. Promote only records that meet the public/canonical gate.
6. Export canonical packets with included and excluded records.

## Canonical gate

A record should not be treated as canonical unless it has:

- promoted public lifecycle status
- at least one source receipt
- confidence score of 70 or higher
- no blocking dispute state
- known public-safe location precision
- no unresolved validation warnings

High-impact claims such as power capacity, water use, jobs, or construction status should have independent corroboration.
