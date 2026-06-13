# v4.0 Final Map Layer Viewer Integration

Version: `4.0.0`
Schema: `DataCenterLedger.FinalMapLayerViewer.v4.0`

## Purpose

v4.0 turns the gated v3.9 final map-layer packet into a visible final-layer viewer. It lets a reviewer load the final packet, confirm the export gate and QA badges, inspect state clusters, preview reviewed records, and export a viewer snapshot.

This is the first 4.x map-facing layer. It does not bypass the v3.9 gate. It only displays packets that already passed the final export gate.

## Input

The viewer reads:

```txt
DataCenterLedger.FinalMapLayer.v3.9
localStorage: datacenter-ledger.final-map-layer.v3.9
```

The source packet must include:

- final layer digest
- gate decision
- source feed digest
- source QA report digest
- QA status
- final records
- final record digests

## Output

The viewer exports:

```txt
DataCenterLedger.FinalMapLayerViewer.v4.0
localStorage: datacenter-ledger.final-map-viewer.v4.0
```

The snapshot includes:

- source final map-layer metadata
- gate status badge
- QA status badge
- final record count
- represented state count
- precision counts
- warning count
- state clusters
- normalized viewer records
- safety boundary
- viewer digest

## Controls

The panel provides:

- Load latest final layer
- Load final layer JSON
- Build viewer snapshot
- Export viewer snapshot
- Clear

## Viewer Records

Each viewer record includes:

- record ID
- title
- operator
- state
- locality
- map precision
- QA status
- QA warning count
- evidence class
- evidence URL
- location confidence
- final record digest

## State Clusters

The viewer creates a local state-cluster summary from the final records. This is a lightweight public-review map aid, not a complete geographic analysis.

## Safety Boundary

The viewer preserves the same core map-safety boundaries:

- Public-source review only.
- No hidden network calls.
- No private facility discovery.
- No sensitive enrichment.
- Viewer records must come from a v3.9 final map-layer packet.
- Map markers remain review references, not proof of facility status or completeness.
- Location precision follows the approved final-layer packet; the viewer does not upgrade precision.

## Review Note

The v4.0 viewer does not certify facility truth, discover facilities, upgrade precision, or publish sensitive details. It is a local-first viewer for final-layer packets that have already passed the staged import, intake, map feed, QA, and export gate workflow.
