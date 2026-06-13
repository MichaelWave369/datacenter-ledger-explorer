# v2.4 Approval Role Profiles

v2.4 adds a local governance layer for review actions in DataCenterLedger Explorer. It introduces reviewer role profiles, visible action gates, and role metadata in exported packets.

This is still a local-first browser workflow. Role profiles are not authentication, identity proof, backend authorization, or legal approval. They are a transparent review scaffold that helps teams separate who is inspecting data, who is approving local changes, and who is exporting public-facing packets.

## Roles

The app currently includes these role profiles:

| Role | Intended use |
| --- | --- |
| `viewer` | Inspect the workspace without mutating records or exporting public-facing packets. |
| `data_reviewer` | Import public rows, submit proposed record changes, mark records reviewed, and restore local sessions. |
| `source_reviewer` | Add public source receipts, submit source-backed changes, and approve/reject source changes. |
| `regional_reviewer` | Review state/county summaries and export map-safe regional evidence packets. |
| `publisher` | Approve changes, promote canonical records, export public briefs, export regional packets, and export canonical packets. |
| `admin` | Local all-permissions demo/testing role. |

## Permission gates

Major actions now have visible gates:

- import records
- add source receipts
- submit change requests
- approve/reject change requests
- mark reviewed
- promote canonical record
- export public brief
- export regional evidence packet
- export canonical registry
- restore local review session

A gate records:

- action name
- required permission
- active role
- reviewer name
- pass/block state
- local digest

## Approval and promotion behavior

v2.4 keeps the v2.3 approval queue, but adds role metadata:

- proposed changes preserve the requester role
- approval decisions preserve the decision reviewer and decision role
- approved changes create a `ChangeReceipt` with a role gate snapshot
- rejected changes keep a rejection note and do not mutate the record
- promotion receipts include the publisher/admin role gate
- public briefs and regional packets include the public export gate used at generation time

## Export schemas

v2.4 updates or emits these public-safe local schemas:

- `DataCenterLedger.RoleProfile.v2.4`
- `DataCenterLedger.Workspace.v2.4`
- `DataCenterLedger.CanonicalRegistry.v2.4`
- `DataCenterLedger.PublicBrief.v2.4`
- `DataCenterLedger.RegionalEvidencePacket.v2.4`
- `DataCenterLedger.ChangeApprovalQueue.v2.4`
- `DataCenterLedger.LocalReviewSession.v2.4`
- `DataCenterLedger.PromotionAuditTimeline.v2.4`

## Session behavior

Local review sessions now preserve:

- active role
- reviewer name
- role profile
- role-gated approval queue
- role-gated change receipts
- role-gated promotion receipts
- role-aware public brief state

Restoring a session can also restore the active role and reviewer name when the session includes them.

## Safety boundary

Role profiles do **not** mean:

- the user has been authenticated
- a person has legal authority
- a source has been verified true
- a data center record is complete
- private facility details are safe to publish
- exact locations should be enriched or exposed

The core boundary remains:

**Public-data only. No hidden network calls. No private facility discovery. No security-sensitive enrichment. City/county precision unless exact location is already public and appropriate.**

## Suggested review flow

1. Select the reviewer name and role.
2. Check visible role gates before changing records.
3. Add receipts as `source_reviewer` or `admin`.
4. Submit proposed changes as `data_reviewer`, `source_reviewer`, `regional_reviewer`, or `admin`.
5. Approve/reject changes as `source_reviewer`, `publisher`, or `admin`.
6. Promote and export public-facing briefs as `publisher` or `admin`.
7. Export a session packet to preserve the local role context with the review work.
