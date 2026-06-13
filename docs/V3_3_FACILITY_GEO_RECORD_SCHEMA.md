# v3.3 Facility Geo Record Schema

v3.3 defines the map-safe data contract for facility location records before larger public-data ingestion begins.

The goal is to make the map layer useful without turning it into an exact-location tool. Every facility geo row must carry a precision label, public evidence class, location evidence reference, and reviewer confidence score.

## Public boundary

- Public-source location evidence only.
- Default to state, county, or city precision unless exact location is already public and appropriate.
- Do not enrich private coordinates, security-sensitive locations, or unreviewed facility details.
- Map markers are review prompts, not targeting coordinates or proof of facility status.

## Exported packets

### `DataCenterLedger.FacilityGeoRecordSchema.v3.3`

The schema packet includes:

- required fields
- optional fields
- precision policy
- evidence class list
- review status list
- import column order
- safety boundary
- review-only notice
- packet digest

### `DataCenterLedger.FacilityGeoImportTemplate.v3.3`

The import-template packet includes:

- import column order
- CSV template
- sample record
- safety boundary
- review-only notice
- packet digest

## Required fields

| Field | Purpose |
| --- | --- |
| `recordId` | Stable local ID that joins geo evidence to a facility record. |
| `title` | Public-facing facility/project title or neutral review label. |
| `state` | Two-letter U.S. state abbreviation for map-safe clustering. |
| `geoPrecision` | Precision level controlling how specific the map may be. |
| `locationEvidenceClass` | Public evidence lane supporting the location claim. |
| `locationEvidenceUrl` | Public URL, docket citation, or document locator. |
| `locationConfidence` | Reviewer confidence score from 0 to 100 for location only. |

## Optional fields

Optional fields include:

- `operator`
- `county`
- `city`
- `publicAddress`
- `publicAddressBasis`
- `latitude`
- `longitude`
- `coordinateBasis`
- `status`
- `geoNotes`

Exact address and coordinate fields should stay blank unless the public basis is clear and appropriate.

## Precision policy

| Precision | Use when | Map behavior |
| --- | --- | --- |
| `state` | Only state-level evidence exists or specificity should be withheld. | Cluster at state marker only. |
| `county` | Public record names a county or region. | Cluster under state and show county in drawer. |
| `city` | Public record names a city/locality. | Cluster under state and show city in drawer. |
| `public_address` | Exact address is already public and appropriate. | May be listed as public-address precision, while map scaffold remains regional. |
| `approximate` | General area is public but exact specificity is uncertain or softened. | Treat as generalized review marker. |

## Evidence classes

- `air_permit`
- `planning_record`
- `utility_record`
- `company_disclosure`
- `public_registry`
- `news_report`
- `open_map_signal`
- `other_public_record`

## Validation behavior

The v3.3 panel includes a single-record JSON validator that checks:

- required fields are present
- state uses a two-letter uppercase code
- precision is one of the approved precision values
- evidence class is one of the approved public evidence classes
- confidence is between 0 and 100
- public-address precision includes address basis
- latitude and longitude appear together
- coordinate fields include a public coordinate basis

Validation is a review prompt, not source verification.

## Non-goals

v3.3 does not:

- ingest a national facility database
- verify that a facility exists
- discover private facility locations
- publish exact coordinates
- replace human review
- certify that a map record is safe for public release

## Next sprint candidate

v3.4 should add a public-data ingest workbench for facility geo rows using this schema:

- paste/load CSV
- validate every row against v3.3
- group issues by blocker/warning
- stage rows for review
- export `FacilityGeoImportBatch.v3.4`
