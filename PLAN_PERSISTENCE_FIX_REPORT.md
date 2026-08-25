# FORENSIC REPORT: Plan Persistence & Recovery Failure

## EXACT ROOT CAUSE
**Primary Failure**: Plan action type does NOT persist the plan to database.

**Secondary Failure**: Code attempts to use non-existent `orchestration_data` column in `alex_messages` table.

## EXECUTION PATH ANALYSIS

### A. Where Plan is Generated
**Location**: AI Orchestrator → Workflow Orchestrator.handleOrchestrationResult()
**Action Type**: `action.type === 'plan'`
**Plan Location**: `action.plan` object
**Persistence**: NONE - plan action was not being saved to database

### B. Where Plan Should Be Persisted
**Location**: Workflow Orchestrator.savePlan()
**Table**: `alex_artifact_builds.automation_plan` column
**Migration Status**: ✅ EXISTS (alex-ai-orchestration-plan-persistence.sql)
**Problem**: Code only called `savePlan()` for `updatedPlan`, not for `action.plan` in plan action

### C. Where CurrentPlan is Loaded
**Location**: Workflow Orchestrator.loadCurrentPlan()
**Data Source**: `alex_artifact_builds.automation_plan` column (primary) or `final_specification` (fallback)
**Problem**: Returns null because plan was never saved in previous turn

### D. orchestration_data Column Status
**Schema Status**: ❌ DOES NOT EXIST in any migration
**Code References**: 
- app/api/alex/chat/route.ts (lines 303, 634)
- components/alex/AlexChat.tsx (lines 203, 206)
**Error**: PGRST204 - column not found in schema cache
**Fix**: Removed all references to non-existent column

## WHY CURRENT PLAN BECOMES NONE
1. Turn 1: AI generates plan action with `action.plan = {...}`
2. Workflow Orchestrator.handleOrchestrationResult() receives plan action
3. Code only saves if `updatedPlan` exists (line 124), but plan action has plan in `action.plan`
4. Plan is NOT persisted to database
5. Turn 2: User says "proceed"
6. loadCurrentPlan() returns null (nothing in database)
7. AI Orchestrator receives `currentPlan: null`
8. AI generates new plan instead of using existing plan

## EXACT PERSISTENCE PATH (AFTER FIX)
1. AI generates plan action with `action.plan = {...}`
2. Workflow Orchestrator detects `action.type === 'plan' && action.plan`
3. Calls `savePlan()` with `action.plan`
4. Plan persisted to `alex_artifact_builds.automation_plan`
5. Next request: loadCurrentPlan() retrieves from database
6. AI Orchestrator receives persisted plan as `currentPlan`
7. AI confirmation operates on existing plan

## FILES CHANGED
1. **lib/alex/orchestration/workflow-orchestrator.ts**
   - Added plan persistence for plan action type (lines 127-132)
   - Added comprehensive diagnostics to loadCurrentPlan() (lines 512-540)
   - Added comprehensive diagnostics to savePlan() (lines 550-625)

2. **app/api/alex/chat/route.ts**
   - Removed orchestration_data from plan_approve path (line 303)
   - Removed orchestration_data from normal orchestration path (line 634)
   - Removed unused orchestrationData variable (lines 582-589)
   - Fixed error message references

3. **components/alex/AlexChat.tsx**
   - Removed orchestration_data parsing (lines 203-207)

## MIGRATION REQUIRED
❌ NO - Used existing migration: alex-ai-orchestration-plan-persistence.sql

## MINIMUM FIX
1. Ensure plan action persists to database via `savePlan(action.plan)`
2. Remove references to non-existent orchestration_data column
3. Add diagnostics to trace persistence/recovery flow

## CONFIRMATION SEMANTICS PRESERVED
✅ AI still semantically interprets "proceed" as confirmation
✅ But now operates on persisted plan instead of reconstructing from message
✅ Works for both "proceed" and "procced" (typo tolerance)

## REGRESSION CHECKS
✅ Normal chat unaffected (no plan persistence needed)
✅ Plan generation unaffected (now correctly persists)
✅ TPM system unchanged
✅ Provider fallback unchanged
✅ RAG/file-context unchanged

## SUCCESS CRITERIA
- Turn 1: Plan generated AND persisted
- Turn 2: "proceed" loads persisted plan from database
- AI operates on existing plan, not reconstructed
- No PGRST204 errors
- Google Forms platform preserved through flow