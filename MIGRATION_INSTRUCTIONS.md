# Database Migration Instructions

## Migration: AI-Driven Orchestration Plan Persistence

### File: `migrations/alex-ai-orchestration-plan-persistence.sql`

### What This Migration Does:

1. **Adds `automation_plan` column** to `alex_artifact_builds` table
   - Stores the AI-driven AutomationPlan as JSONB
   - Enables plan persistence across requests
   - Supports GIN index for efficient JSONB queries

2. **Adds `orchestration_metadata` column** to `alex_artifact_builds` table
   - Stores orchestration metadata including previous decisions, context, and reasoning
   - Enables tracking of orchestration history

3. **Adds `last_orchestration_action` column** to `alex_artifact_builds` table
   - Tracks the last AI orchestration action
   - Possible values: respond, clarify, recommend, brainstorm, plan, generate, execute, revise
   - Enables action tracking and debugging

### How to Run:

**Option 1: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/alex-ai-orchestration-plan-persistence.sql`
4. Paste and run the SQL

**Option 2: Using Supabase CLI**
```bash
supabase db push
```

**Option 3: Using psql**
```bash
psql $DATABASE_URL -f migrations/alex-ai-orchestration-plan-persistence.sql
```

### Verification:

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'alex_artifact_builds' 
AND column_name IN ('automation_plan', 'orchestration_metadata', 'last_orchestration_action');
```

Expected output:
```
column_name            | data_type
------------------------+----------
automation_plan         | jsonb
orchestration_metadata  | jsonb
last_orchestration_action| character varying
```

### Notes:

- This migration is **non-destructive** - it only adds columns
- Existing builds will have NULL values for new columns
- The implementation includes fallback logic to handle NULL values
- If migration fails, the code will fall back to spec-based persistence