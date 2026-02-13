# n8n Inventory Runbook

Purpose: operate, troubleshoot, and recover the n8n workflow inventory pipeline with minimal guesswork.

Scope:
- Inventory sync from n8n -> Supabase (`n8n_inventory` schema)
- 15-minute incremental sync
- nightly reconcile sync
- recovery from bad sync runs

## 1. Schedules

Incremental (every 15 min):
- Task: `\FitOps-N8N-InventorySync-15min`
- Command:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/manage_incremental_sync_schedule.ps1 -Action show
```

Nightly reconcile (daily 02:30 local):
- Task: `\FitOps-N8N-InventoryReconcile-Nightly`
- Command:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/manage_reconcile_schedule.ps1 -Action show
```

## 2. Manual Run Commands

Incremental run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/milestone3_incremental_sync.ps1 -TriggerSource schedule
```

Full reconcile run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/milestone3_incremental_sync.ps1 -TriggerSource reconcile
```

## 3. Health Checks

No stuck runs:
```sql
select count(*) as running_count
from n8n_inventory.inventory_sync_runs
where status = 'running';
```

Latest run outcomes:
```sql
select
  id,
  trigger_source,
  status,
  started_at,
  finished_at,
  workflows_seen,
  workflows_changed,
  snapshots_inserted,
  duration_seconds
from n8n_inventory.inventory_sync_runs_enriched
order by started_at desc
limit 20;
```

Daily reliability:
```sql
select *
from n8n_inventory.inventory_sync_runs_daily
order by day desc, trigger_source;
```

## 4. Normal Operating Thresholds (Dev)

- `running_count` should normally be `0`.
- Incremental runs should often have:
  - `workflows_changed = 0`
  - `snapshots_inserted = 0`
- Reconcile runs should have:
  - `details_fetched = workflows_seen` (see run `notes`)

If `workflows_seen` unexpectedly drops near zero:
- Safety guard in script should fail run before soft-delete logic.
- Investigate n8n API health/credentials first.

## 5. Incident Response

Symptoms:
- repeated `error` runs
- `workflows_seen` unusually low
- unexpected surge in `snapshots_inserted`

Response:
1. Pause schedules:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/manage_incremental_sync_schedule.ps1 -Action unregister
powershell -ExecutionPolicy Bypass -File scripts/manage_reconcile_schedule.ps1 -Action unregister
```
2. Inspect latest failed runs (`inventory_sync_runs_enriched`).
3. Fix upstream cause (`N8N_API_KEY`, `N8N_API_URL`, Supabase token).
4. If data corruption occurred, execute reset by run (Section 6).
5. Run one manual reconcile and verify.
6. Re-enable schedules.

## 6. Reset / Recovery (Bad Sync Run)

Script:
- `scripts/reset_bad_sync_run.ps1`

Preview impact:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/reset_bad_sync_run.ps1 -SyncRunId <uuid>
```

Apply reset:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/reset_bad_sync_run.ps1 -SyncRunId <uuid> -Apply
```

What it does:
- deletes `snapshot_tags` tied to snapshots from that `sync_run_id`
- deletes `workflow_snapshots` for that run
- clears `workflows.last_sync_run_id` if it points to that run
- marks that run `error` with a recovery note and error payload

Post-reset:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/milestone3_incremental_sync.ps1 -TriggerSource reconcile
```

## 7. Rollback

Disable schedule tasks:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/manage_incremental_sync_schedule.ps1 -Action unregister
powershell -ExecutionPolicy Bypass -File scripts/manage_reconcile_schedule.ps1 -Action unregister
```

Rollback Milestone 4 views:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply_migration.ps1 -MigrationPath supabase/migrations/0003_n8n_inventory_ops_hardening.rollback.sql
```

Re-apply Milestone 4 views:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply_migration.ps1 -MigrationPath supabase/migrations/0003_n8n_inventory_ops_hardening.sql
```

## 8. Ownership Checklist

Daily:
- Verify last incremental run succeeded.
- Verify `running_count = 0`.

Weekly:
- Verify nightly reconcile success trend in `inventory_sync_runs_daily`.
- Review soft-deleted workflows (`soft_deleted_at is not null`).

Monthly:
- Rotate API/service credentials.
- Validate restore path from `workflow_snapshots.workflow_json`.
