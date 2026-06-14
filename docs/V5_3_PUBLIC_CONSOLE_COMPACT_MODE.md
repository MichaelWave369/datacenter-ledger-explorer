# v5.3 Public Console Compact Mode

DataCenterLedger Explorer v5.3 adds an operator navigation layer for the public-release cockpit.

The compact mode does not change release artifacts. It only changes local page visibility so the operator can collapse the large public-release stack, focus one module, jump between panels, and export a UI-state receipt.

## Schema

```txt
DataCenterLedger.PublicConsoleCompactMode.v5.3
```

## Storage key

```txt
datacenter-ledger.public-console-compact-mode.v5.3
```

## What it controls

v5.3 can focus or hide the public-release panels from v4.1 through v5.2:

- v4.1 public share packet
- v4.2 public share redaction audit
- v4.3 public share approval gate
- v4.4 public share bundle
- v4.5 public share release manifest
- v4.6 public release index
- v4.7 public release compare tool
- v4.8 public release restore handoff
- v4.9 public release integrity seal
- v5.0 public release console
- v5.1 public console quick actions
- v5.2 public console guided flow

## Actions

- refresh compact snapshot
- compact all public panels
- expand all public panels
- show selected panel only
- jump to selected panel
- export compact-mode snapshot

## Safety boundary

Compact mode is local UI state only. It does not fetch data, mutate release packets, enrich locations, reveal sensitive facility details, or authorize publication.

## Suggested workflow

1. Open v5.3.
2. Click **Compact all public panels**.
3. Choose the panel you want from the dropdown.
4. Click **Show selected panel only**.
5. Use **Expand all public panels** when full audit visibility is needed.
6. Export the compact snapshot when you want a receipt of the cockpit layout state.
