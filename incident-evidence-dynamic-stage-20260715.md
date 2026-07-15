# Dynamic Stage Production Incident Evidence

Sanitized local evidence captured for the accidental production migration of
`20260714130000_dynamic_stage_qualification`.

## Evidence Capture Time

- Local evidence capture time: `2026-07-15T03:00:54.2393667+01:00`
- Production migration `started_at`: `2026-07-15T01:51:10.735Z`
- Production migration `finished_at`: `2026-07-15T01:51:12.476Z`

## Accidental Command

The accidental command was run against a temporary Prisma schema copied to:

```text
C:\Users\HP\AppData\Local\Temp\gma-staging-migrate-e182563cce734d9bb6b417efb7df001f\schema.prisma
```

The temporary schema set `url = env("STAGING_DATABASE_URL")` but retained:

```prisma
directUrl = env("DIRECT_URL")
```

Command shape:

```powershell
npx.cmd prisma migrate deploy --schema C:\Users\HP\AppData\Local\Temp\gma-staging-migrate-e182563cce734d9bb6b417efb7df001f\schema.prisma
```

## Reported Prisma Output

```text
Environment variables loaded from .env
Prisma schema loaded from ..\..\Users\HP\AppData\Local\Temp\gma-staging-migrate-e182563cce734d9bb6b417efb7df001f\schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-small-bread-ai82wrq6.c-4.us-east-1.aws.neon.tech"

2 migrations found in prisma/migrations

Applying migration `20260714130000_dynamic_stage_qualification`

The following migration(s) have been applied:

migrations/
  └─ 20260714130000_dynamic_stage_qualification/
    └─ migration.sql

All migrations have been successfully applied.
```

- Reported exit status: `0`

## Prisma CLI Version

```text
prisma                  : 5.22.0
@prisma/client          : 5.22.0
Node.js                 : v24.16.0
Query Engine            : 605197351a3c8bdd595af2d2a9bc3025bca48ea2
Schema Engine           : 605197351a3c8bdd595af2d2a9bc3025bca48ea2
```

## Production Host Metadata

- `DATABASE_URL` host: `ep-small-bread-ai82wrq6-pooler.c-4.us-east-1.aws.neon.tech`
- `DIRECT_URL` host: `ep-small-bread-ai82wrq6.c-4.us-east-1.aws.neon.tech`
- Database: `neondb`
- Username: `neondb_owner`
- Port: `5432`
- SSL mode: `require`
- Channel binding: `require`

## Migration Checksum

```text
00177304ED728D01F0B615F534099E77321E9D7738D60F7C3A6547112A4514BB
```

## Git Status At Audit

```text
 M .env
 M scripts/reset-production-member-data.ts
 M scripts/verify-dynamic-stage-qualification.ts
 M src/lib/qualification/engine.ts
?? scripts/check-bootstrap-state.js
?? scripts/handover-audit.js
```

- Local HEAD: `208110ed3920226e287211ac4b8bd7f353626bf9`

## Production Migration-History Audit

```text
20260714120000_baseline_current_production
  started_at: 2026-07-14T16:13:00.488Z
  finished_at: 2026-07-14T16:13:00.488Z
  rolled_back_at: null
  applied_steps_count: 0
  has_logs: false

20260714130000_dynamic_stage_qualification
  started_at: 2026-07-15T01:51:10.735Z
  finished_at: 2026-07-15T01:51:12.476Z
  rolled_back_at: null
  applied_steps_count: 1
  has_logs: false
  checksum: 00177304ed728d01f0b615f534099e77321e9d7738d60f7c3a6547112a4514bb
```

## Production Schema Audit Summary

- `User.currentStage`: text, not null, default `'REGISTERED_ACTIVE'::text`
- `User.highestStage`: text, not null, default `'REGISTERED_ACTIVE'::text`
- `User.stageUpdatedAt`: timestamp(3), nullable
- `User.finalStageCompletedAt`: timestamp(3), nullable
- `User.compensationPlanStatus`: text, not null, default `'ACTIVE'::text`
- `StageProgress` contributor fields exist with integer defaults of `0` and nullable text fields where expected.
- Dynamic tables present: `StageHistory`, `QualificationContributor`, `StageLoan`, `StageLoanAudit`
- Dynamic table duplicate check: none found
- Dynamic table row counts: all `0`

## Data Preservation Audit Summary

- `User`: `3`
- `currentStage = STARTER`: `3`
- `currentStage = REGISTERED_ACTIVE`: `0`
- `BinaryTree`: `0`
- `Wallet`: `0`
- `WalletTransaction`: `0`
- `CommissionSetting`: `3`
- `CommissionLog`: `0`
- `CommissionCycle`: `0`
- `FinancialEvent`: `0`
- `Reward`: `0`
- `RewardClaim`: `0`
- `KYCSubmission`: `0`
- `ActivationCode`: `1`
- `AdminCode`: `0`
- `StageProgress`: `0`
- `playing_with_neon`: `10`

Fingerprints without exposing user data:

- User relationship/stage fingerprint: `1CCE17D3F8374F390AE5B22C8F2CA9C5E0DD42CB81B4B366D8E9BC5783A9B89A`
- Binary tree fingerprint: `4F53CDA18C2BAA0C0354BB5F9A3ECBE5ED12AB4D8E11BA873C2F11161202B945`
- `playing_with_neon` fingerprint: `78DD9965085C8A25286555DB7FBC0C4467BA9407F370A1B4F0D93B0F3491CC3D`

## GET-Only Production Health Probes

```text
https://app.greatmindachievers.org/                         200
https://app.greatmindachievers.org/sign-up-login-screen      200
https://app.greatmindachievers.org/register                  307 -> /sign-up-login-screen
https://app.greatmindachievers.org/user-dashboard            307 -> /sign-up-login-screen
https://app.greatmindachievers.org/admin-dashboard           307 -> /sign-up-login-screen
https://app.greatmindachievers.org/api/auth/register         405 for GET
https://app.greatmindachievers.org/api/auth/login            405 for GET
https://greatmindachievers.org/                              200
```

No response body contained the checked Prisma/schema error markers.

## Notes

- No production write SQL was run during this audit.
- No migration, resolve, deploy, seed, reset, cleanup, backfill, synthetic data write, restore, commit, or push was run during this audit.
- Vercel runtime logs were not inspected because the local Vercel CLI attempted to write to its local package-update cache even for help output.
