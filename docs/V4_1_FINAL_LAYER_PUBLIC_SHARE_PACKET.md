# v4.1 Final Layer Public Share Packet

DataCenterLedger Explorer v4.1 adds a public-facing share packet builder for the final map layer.

The v4.1 packet starts from a `DataCenterLedger.FinalMapLayerViewer.v4.0` snapshot and exports a sanitized `DataCenterLedger.PublicSharePacket.v4.1` artifact.

## Purpose

The public share packet gives a clean summary of reviewed final map records without carrying reviewer-only notes or staging internals into a public-facing handoff.

It is designed for:

- public-safe summaries
- lightweight sharing
- reviewed final map record previews
- state cluster summaries
- precision and QA badges
- public evidence references
- receipt-backed provenance at a safe summary level

## Input

v4.1 accepts only:

```txt
DataCenterLedger.FinalMapLayerViewer.v4.0
```

The latest viewer snapshot is read from:

```txt
datacenter-ledger.final-map-viewer.v4.0
```

You can also paste or load a viewer JSON file manually.

## Output

v4.1 exports:

```txt
DataCenterLedger.PublicSharePacket.v4.1
```

The latest packet is stored under:

```txt
datacenter-ledger.public-share-packet.v4.1
```

## Public record fields

Each public record keeps only public-safe summary fields:

- public record ID
- title
- operator
- state
- locality
- map precision
- QA badge
- QA warning count
- evidence class
- evidence URL
- location confidence
- public record digest

## Omitted fields

The share packet explicitly omits fields that should remain internal to review or staging workflows:

- reviewer notes
- approver identity fields
- staging source row digest
- import batch digest
- bridge digest
- intake digest
- decision receipt digest
- coordinates
- coordinate basis
- public address details

## Safety boundary

The v4.1 share packet remains bounded by the same public-data rules:

- public-source review only
- no hidden network calls
- no private facility discovery
- no sensitive enrichment
- no precision upgrades
- no coordinate publication added by this layer
- no claim that the map is complete or that records prove facility status

## Workflow

1. Build or load a v4.0 viewer snapshot.
2. Open the v4.1 public share packet panel.
3. Load the latest viewer snapshot or paste/load viewer JSON.
4. Build the share packet.
5. Review public records, state clusters, and omitted-field chips.
6. Export the share packet JSON.

## Notes

The v4.1 packet is a public-facing summary artifact. It does not replace the final map layer, does not certify source truth, and does not authorize sensitive publication.
