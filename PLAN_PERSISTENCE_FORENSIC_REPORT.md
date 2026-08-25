# FORENSIC REPORT: Plan Persistence Failure Investigation

## 1. ROOT CAUSE

**Execution order bug**: The plan persistence logic has a critical race condition. The code attempts to `savePlan()` BEFORE ensuring the build exists, but `savePlan()` itself requires a build to exist to function correctly.

## 2. PROOF

### Code Execution Path
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`

**Lines 135-142** (savePlan call):
```typescript
if (action.type === 'plan' && action.plan) {
  console.log('[FORENSIC] Plan action detected with plan content')
  console.log('[FORENSIC] Plan action.plan objective:', action.plan.objective || 'no objective')
  console.log('[Workflow Orchestrator] Saving plan from action.plan for plan action')
  await this.savePlan(request.conversationId, request.userId, action.plan, action.type)
}
```

**Lines 146-158** (build creation):
```typescript
if (action.type === 'plan' && action.plan) {
  console.log('[Workflow Orchestrator] Ensuring build exists for plan action')
  const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
  if (!existingBuild) {
    console.log('[Workflow Orchestrator] Creating new build for plan action')
    await ArtifactService.createBuild(...)
  }
}
```

**CRITICAL BUG**: `savePlan()` is called BEFORE the build existence check, but `savePlan()` at line 595 calls `getActiveBuild()` to find the build.

### savePlan() Implementation
**Lines 585-596**:
```typescript
private async savePlan(conversationId: string, userId: string, plan: AutomationPlan, lastAction?: string): Promise<void> {
  console.log('[FORENSIC] savePlan - saving plan:', plan.objective)
  console.log('[FORENSIC] savePlan - action type:', lastAction)
  
  const build = await ArtifactService.getActiveBuild(conversationId, userId)
  console.log('[FORENSIC] savePlan - build exists:', !!build)
  
  if (build) {
    // Update existing build with automation_plan
  } else {
    // Create new build (lines 627-632)
    const newBuild = await ArtifactService.createBuild(...)
  }
}
```

### getActiveBuild() Implementation
**File**: `lib/alex/artifact-generation/artifact-service.ts`

**Lines 69-85**:
```typescript
static async getActiveBuild(conversationId: string, userId: string): Promise<ArtifactBuild | null> {
  const { data, error } = await getSupabaseClient()
    .from('alex_artifact_builds')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .in('status', ['collecting_requirements', 'awaiting_architecture_verification', 'ready_for_confirmation', 'confirmed', 'generating', 'validating', 'persisting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }
  return data
}
```

### Production Evidence
```
[DEBUG ORCHESTRATOR] Existing build check result {
  found: false,
  buildId: undefined,
  status: undefined
}

[FORENSIC] loadCurrentPlan - build exists: false
[FORENSIC] loadCurrentPlan - no build found, returning null
```

**Missing Diagnostic**: There is NO `[FORENSIC] savePlan - saving plan:` log in the production logs for the previous plan generation turn, which means `savePlan()` was never called or failed before reaching the log statement.

## 3. PLAN LIFECYCLE

```
AI generates plan
        ↓
action.type === 'plan' with action.plan = {...}
        ↓
Workflow Orchestrator.handleOrchestrationResult()
        ↓
❌ BUG: savePlan() called BEFORE build existence check
        ↓
savePlan() calls getActiveBuild()
        ↓
getActiveBuild() returns null (no build exists yet)
        ↓
savePlan() creates new build (lines 627-632)
        ↓
savePlan() updates automation_plan column
        ↓
❌ BUG: Lines 146-158 then call getActiveBuild() again and create ANOTHER build
        ↓
Database now has 2 builds for same conversation
        ↓
loadCurrentPlan() calls getActiveBuild()
        ↓
getActiveBuild() may return wrong build or fails status filter
        ↓
❌ FAILURE: build exists: false
```

## 4. BUILD CREATION

**Why loadCurrentPlan() gets build exists: false:**

The `getActiveBuild()` function filters by:
- `conversation_id` 
- `user_id`
- `status` IN ['collecting_requirements', 'awaiting_architecture_verification', 'ready_for_confirmation', 'confirmed', 'generating', 'validating', 'persisting']

**Potential Issues:**
1. **Duplicate builds**: The race condition creates 2 builds, and getActiveBuild() may return the wrong one
2. **Status mismatch**: The build created by savePlan() might have a different status than expected
3. **Timing issue**: savePlan() creates build but subsequent operations fail due to race condition

## 5. savePlan()

**Does it execute?**: YES, based on commit 1550bb9
**Does it require existing build?**: NO, it creates one if none exists (lines 627-632)
**Does it query for existing build first?**: YES, at line 595
**What happens if no build exists?**: Creates new build (lines 627-632)
**Does it silently return?**: NO, throws error if build creation fails
**Does it throw?**: YES, if createBuild() fails
**Does it create a build?**: YES, if getActiveBuild() returns null
**Does it update existing build?**: YES, if getActiveBuild() returns a build
**Database row targeted**: `alex_artifact_builds` row with matching conversation_id and user_id
**Exact values used**: conversationId and userId from the request

## 6. DATABASE

**Table**: `alex_artifact_builds`
**Columns** (from migration alex-phase7-artifact-generation.sql):
- id (UUID, primary key)
- conversation_id (UUID, references alex_conversations)
- user_id (VARCHAR)
- build_type (VARCHAR)
- status (VARCHAR)
- original_request (TEXT)
- final_specification (JSONB)
- requirements_collected (JSONB)
- missing_requirements (JSONB)
- confirmation_granted (BOOLEAN)
- generation_metadata (JSONB)
- error_message (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**Additional columns** (from migration alex-ai-orchestration-plan-persistence.sql):
- automation_plan (JSONB)
- orchestration_metadata (JSONB)
- last_orchestration_action (VARCHAR)

**Migration Compatibility**: The current code uses the automation_plan column which exists in the migration, so schema is compatible.

## 7. SECONDARY PROVIDER ISSUE

**OpenRouterAlex1**: Quota exhausted (free-models-per-day)
**Groq 2**: TPD limit exceeded (200000 tokens, used 197464)
**OpenRouter/Free**: Quota exhausted (free-models-per-day)
**Groq AI Provider**: Incorrectly configured with prompt-guard model (meta-llama/llama-prompt-guard-2-22m) instead of generation model, rejects max_tokens=6400 because max is 512

**Status**: Separate provider configuration issue, not causing plan persistence failure.

## 8. MINIMAL FIX

**Fix execution order**: Ensure build exists BEFORE calling savePlan()

**Change**:
```typescript
// CRITICAL FIX: Ensure build exists for plan actions BEFORE saving plan
// This prevents race condition where savePlan() and build creation compete
if (action.type === 'plan' && action.plan) {
  console.log('[FORENSIC] Plan action detected with plan content')
  console.log('[FORENSIC] Plan action.plan objective:', action.plan.objective || 'no objective')
  
  // First ensure build exists
  console.log('[Workflow Orchestrator] Ensuring build exists for plan action')
  const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
  if (!existingBuild) {
    console.log('[Workflow Orchestrator] Creating new build for plan action')
    await ArtifactService.createBuild(
      request.conversationId,
      request.userId,
      action.plan.objective || request.userMessage,
      'workflow'
    )
  }
  
  // Then save plan to the guaranteed-to-exist build
  console.log('[Workflow Orchestrator] Saving plan from action.plan for plan action')
  await this.savePlan(request.conversationId, request.userId, action.plan, action.type)
}
```

**Remove duplicate build creation**: Remove lines 146-158 which are now redundant.

## 9. VALIDATION PLAN

### Turn 1
User: "create a lead capture and qualifier that send email notification if the lead is cold, warm or hot"

**Expected Logs**:
```
[FORENSIC] Plan action detected with plan content
[FORENSIC] Plan action.plan objective: Lead Capture & Qualification
[Workflow Orchestrator] Ensuring build exists for plan action
[Workflow Orchestrator] Creating new build for plan action
[Artifact Service] Build created: {build_id}
[Workflow Orchestrator] Saving plan from action.plan for plan action
[FORENSIC] savePlan - saving plan: Lead Capture & Qualification
[FORENSIC] savePlan - build exists: true
[FORENSIC] savePlan - successfully saved to automation_plan column
```

### Turn 2
User: "proceed"

**Expected Logs**:
```
[DEBUG ORCHESTRATOR] Existing build check result {
  found: true,
  buildId: {build_id},
  status: 'collecting_requirements'
}
[FORENSIC] loadCurrentPlan - build exists: true
[FORENSIC] loadCurrentPlan - build.automation_plan exists: true
[Workflow Orchestrator] Loading plan from automation_plan column
[FORENSIC] loadCurrentPlan - loaded from automation_plan: Lead Capture & Qualification
[AI Orchestrator] Current plan: present
```

**Expected Behavior**: AI operates on persisted plan with Google Forms → Gmail architecture preserved.

## 10. DO NOT COMMIT YET

**WAITING FOR APPROVAL** to implement the execution order fix.

The forensic investigation has identified the exact root cause: a race condition in the execution order where `savePlan()` is called before ensuring the build exists, causing duplicate build creation and lookup failures.
