# n8n Inventory Query Pack

Use these directly in Supabase SQL Editor or via:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/query_supabase_sql.ps1 -Query "<sql>"
```

## 1. Latest Snapshot per Workflow

```sql
select
  workflow_id,
  name,
  latest_snapshot_id,
  latest_snapshot_captured_at,
  latest_definition_hash,
  tags
from n8n_inventory.workflows_with_latest_snapshot
order by latest_snapshot_captured_at desc nulls last;
```

## 2. Workflow Change Activity (7 days)

```sql
select
  date_trunc('day', started_at) as day,
  sum(workflows_changed) as workflows_changed,
  sum(snapshots_inserted) as snapshots_inserted
from n8n_inventory.inventory_sync_runs
where started_at >= now() - interval '7 days'
group by 1
order by day desc;
```

## 3. Reliability by Trigger Source

```sql
select *
from n8n_inventory.inventory_sync_runs_daily
order by day desc, trigger_source;
```

## 4. Recent Failures

```sql
select
  id,
  trigger_source,
  started_at,
  finished_at,
  errors_count,
  errors_json,
  notes
from n8n_inventory.inventory_sync_runs
where status = 'error'
order by started_at desc
limit 20;
```

## 5. Tag Distribution (Current)

```sql
select
  t.tag_name,
  count(*) as workflows_count
from n8n_inventory.workflow_tags wt
join n8n_inventory.tags t on t.tag_id = wt.tag_id
where wt.is_current = true
group by t.tag_name
order by workflows_count desc, t.tag_name;
```

## 6. Filter Workflows by Tag

```sql
select
  workflow_id,
  name,
  tags,
  latest_snapshot_captured_at
from n8n_inventory.workflows_with_latest_snapshot
where 'inDev' = any(tags)
order by name;
```

## 7. Soft-Deleted Workflows

```sql
select
  workflow_id,
  name,
  last_seen_at,
  soft_deleted_at
from n8n_inventory.workflows
where soft_deleted_at is not null
order by soft_deleted_at desc;
```

## 8. Missing Candidates (Before Soft Delete)

```sql
select *
from n8n_inventory.workflows_missing_candidates_24h
order by last_seen_at asc;
```

## 9. Snapshot Rate (24h)

```sql
select
  date_trunc('hour', captured_at) as hour_bucket,
  count(*) as snapshots_inserted
from n8n_inventory.workflow_snapshots
where captured_at >= now() - interval '24 hours'
group by 1
order by hour_bucket desc;
```

## 10. Run Durations (Recent)

```sql
select
  id,
  trigger_source,
  status,
  duration_seconds,
  workflows_seen,
  workflows_changed
from n8n_inventory.inventory_sync_runs_enriched
order by started_at desc
limit 30;
```
