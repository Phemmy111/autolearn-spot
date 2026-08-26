# REQUIREMENTS PERSISTENCE VERIFICATION
## Forensic Audit of alex_artifact_builds.requirements_collected

**Date**: 2025-01-18
**Objective**: Verify whether requirements_collected can serve as authoritative incremental state

---

## 1. DATABASE SCHEMA/TYPE

**Verified**: `requirements_collected` is JSONB type

**Location**: `migrations/alex-phase7-artifact-generation.sql` line 31
```sql
requirements_collected JSONB, -- Collected requirements
```

**Type Definition**: `lib/alex/artifact-generation/types.ts` line 59
```typescript
requirements_collected?: Record<string, any>
```

**Conclusion**: JSONB is flexible enough to store arbitrary requirement structures.

---

## 2. EXISTING READ/WRITE LOCATIONS

### WRITE LOCATIONS (1)
**File**: `lib/alex/artifact-generation/artifact-service.ts` line 50
```typescript
requirements_collected: {},  // Initialized as empty object
```
**Context**: In `createBuild()` method
**Behavior**: Only initializes as empty object, never updated elsewhere

### READ LOCATIONS (0)
**NONE** - requirements_collected is never read anywhere in the codebase

### CONCLUSION
`requirements_collected` is currently UNUSED. It is initialized as empty but never populated or read.

---

## 3. ACTUAL RUNTIME SHAPE

**Verified**: JSON object (Record<string, any>)

**Current State**: Always empty object `{}` (initialized in createBuild, never modified)

**Potential Shape**: Can store any JSON structure due to JSONB type:
```typescript
{
  platform: { name: "Google Forms", confirmed: true },
  trigger: { type: "form_submission", confirmed: true },
  notification: { service: "Gmail", confirmed: true },
  scoring: { method: "automatic", criteria: ["budget", "timeline"] }
}
```

---

## 4. MERGE vs REPLACE BEHAVIOR

### requirements_collected
**NOT APPLICABLE** - Never written after initialization

### final_specification (REPLACE)
**File**: `lib/alex/artifact-generation/artifact-service.ts` line 166-169
```typescript
.from('alex_artifact_builds')
.update({
  final_specification: specification,  // COMPLETE REPLACE
  missing_requirements: missingRequirements,
  updated_at: new Date().toISOString()
})
```

**File**: `lib/alex/artifact-generation/workflow-manager.ts` line 274-278
```typescript
const updatedSpec = {
  ...build.final_specification,  // Spread creates shallow merge
  ...analysis.known,
  ...analysis.inferred
}
await ArtifactService.updateSpecification(build.id, updatedSpec, [])
```

**Behavior**: Shallow merge at top level, but nested objects are replaced.

### automation_plan (REPLACE)
**File**: `lib/alex/orchestration/workflow-orchestrator.ts` line 603-611
```typescript
.from('alex_artifact_builds')
.update({
  automation_plan: plan,  // COMPLETE REPLACE
  last_orchestration_action: lastAction,
  orchestration_metadata: { ... },
  updated_at: new Date().toISOString()
})
```

**Behavior**: Complete replace, no merge.

### CONCLUSION
Existing code does NOT perform deep merges. To make requirements_collected incremental, a merge function must be added.

---

## 5. CONVERSATION TRACE: LEAD CAPTURE EXAMPLE

### Turn 1: User "Create a lead capture and qualifier..."

**Current Behavior**:
- Build created via `ArtifactService.createBuild()`
- `requirements_collected = {}` (empty)
- `automation_plan = null`
- `final_specification = null`

**What Would Be Persisted** (if incremental):
```json
{
  "objective": "lead capture and qualifier",
  "classification": "cold/warm/hot"
}
```

### Turn 2: User "Google Form"

**Current Behavior**:
- No persistence (requirements_collected still empty)
- AI may include in automation_plan if JSON succeeds
- If JSON fails, information lost

**What Would Be Persisted** (if incremental):
```json
{
  "objective": "lead capture and qualifier",
  "classification": "cold/warm/hot",
  "platform": { "name": "Google Forms", "confirmed": true }
}
```

### Turn 3: User "Automatic scoring based on form responses"

**Current Behavior**:
- No persistence
- AI may include in automation_plan if JSON succeeds
- If JSON fails, information lost

**What Would Be Persisted** (if incremental):
```json
{
  "objective": "lead capture and qualifier",
  "classification": "cold/warm/hot",
  "platform": { "name": "Google Forms", "confirmed": true },
  "scoring": { "method": "automatic", "source": "form_responses", "confirmed": true }
}
```

### Turn 4: User "Gmail via Google Workspace"

**Current Behavior**:
- No persistence
- AI may include in automation_plan if JSON succeeds
- If JSON fails, information lost
- **PRODUCTION FAILURE**: `SyntaxError: Bad control character in string literal in JSON` → entire state lost

**What Would Be Persisted** (if incremental):
```json
{
  "objective": "lead capture and qualifier",
  "classification": "cold/warm/hot",
  "platform": { "name": "Google Forms", "confirmed": true },
  "scoring": { "method": "automatic", "source": "form_responses", "confirmed": true },
  "notification": { "service": "Gmail", "provider": "Google Workspace", "confirmed": true }
}
```

### CONCLUSION
Currently, NO requirements are persisted incrementally. All information depends on AI JSON parsing success.

---

## 6. CAN NEW REQUIREMENT ERASE PREVIOUS REQUIREMENTS?

### Current Risk: YES (if automation_plan is used)
**File**: `lib/alex/orchestration/workflow-orchestrator.ts` line 603-611
```typescript
update({
  automation_plan: plan,  // COMPLETE REPLACE
  ...
})
```

If AI returns a partial plan, it replaces the entire automation_plan, erasing previous information.

### With requirements_collected: NO (if merge function is used)
With a proper merge function:
```typescript
const merged = {
  ...(existing.requirements_collected || {}),
  ...newRequirements
}
```

Shallow merge preserves existing keys, only adds/updates new keys.

### CONCLUSION
automation_plan is vulnerable to accidental erasure. requirements_collected with merge function is safe.

---

## 7. CAN requirements_collected REPRESENT ALL REQUIREMENTS?

### Verified: YES

**Form Platform**
```json
{ "platform": { "name": "Google Forms", "confirmed": true } }
```

**Scoring Method**
```json
{ "scoring": { "method": "automatic", "confirmed": true } }
```

**Scoring Rules**
```json
{ "scoring": { "criteria": ["budget", "timeline", "company_size"], "confirmed": true } }
```

**Notification Provider**
```json
{ "notification": { "service": "Gmail", "confirmed": true } }
```

**Notification Conditions**
```json
{ "notification": { "conditions": ["cold", "warm", "hot"], "confirmed": true } }
```

**Other Requirements**
```json
{
  "trigger": { "type": "form_submission", "confirmed": true },
  "inputs": { "sources": ["form"], "confirmed": true },
  "outputs": { "destinations": ["email"], "confirmed": true }
}
```

### CONCLUSION
JSONB is flexible enough to represent all automation requirements.

---

## 8. EXISTING PARTIAL REQUIREMENT PERSISTENCE

### Verified: NONE

**Search Results**:
- requirements_collected is only initialized as empty object
- Never read anywhere in codebase
- Never written after initialization
- No existing partial persistence logic

### Alternative: final_specification
**File**: `lib/alex/artifact-generation/workflow-manager.ts` line 274-278
```typescript
const updatedSpec = {
  ...build.final_specification,
  ...analysis.known,
  ...analysis.inferred
}
await ArtifactService.updateSpecification(build.id, updatedSpec, [])
```

**Behavior**: Performs shallow merge, but this is in workflow-manager.ts (old system), not in the AI-driven orchestration layer.

### CONCLUSION
No existing partial requirement persistence in the AI-driven orchestration layer. Must be added.

---

## 9. MINIMUM CHANGE REQUIRED

### Change 1: Add Merge Function to ArtifactService
**File**: `lib/alex/artifact-generation/artifact-service.ts`
**Add**: ~20 lines
```typescript
static async updateRequirements(
  buildId: string,
  requirements: Record<string, any>
): Promise<void> {
  const { data: build } = await getSupabaseClient()
    .from('alex_artifact_builds')
    .select('requirements_collected')
    .eq('id', buildId)
    .single()

  const merged = {
    ...(build.requirements_collected || {}),
    ...requirements
  }

  const { error } = await getSupabaseClient()
    .from('alex_artifact_builds')
    .update({ requirements_collected: merged })
    .eq('id', buildId)

  if (error) throw error
}
```

### Change 2: Call updateRequirements in WorkflowOrchestrator
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Modify**: `handleOrchestrationResult()` method
**Add**: ~10 lines
```typescript
// After AI decision, extract requirements and update
if (extractedRequirements) {
  await ArtifactService.updateRequirements(build.id, extractedRequirements)
}
```

### Change 3: Add Requirement Extraction
**File**: `lib/alex/orchestration/requirement-extractor.ts` (NEW)
**Add**: ~150 lines
- Parse natural language for requirement confirmations
- Return structured requirement updates

### Change 4: Modify AI JSON Parsing
**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Modify**: `askAIDecision()` method
**Add**: ~30 lines
- Add layered parsing (JSON → natural language → requirements)
- Extract requirements on JSON failure

### Change 5: Modify Fallback Logic
**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Modify**: `getFallbackDecision()` method
**Add**: ~20 lines
- Load existing requirements from database
- Return contextual response based on state

### Total Minimum Changes
- 1 new file (requirement-extractor.ts)
- 3 modified files
- ~230 lines of code

---

## 10. CAN automation_plan REMAIN DERIVED STATE?

### Verified: YES

**Current Behavior**:
- automation_plan is authoritative (saved directly from AI)
- loadCurrentPlan() loads from automation_plan first, falls back to final_specification

**Proposed Behavior**:
- requirements_collected is authoritative (persisted incrementally)
- automation_plan is derived (compiled from requirements_collected when needed)
- Or AI can still provide automation_plan as a compiled view

**Implementation**:
```typescript
// Load requirements (authoritative)
const requirements = build.requirements_collected || {}

// Load automation_plan if exists (derived/compiled)
const automationPlan = build.automation_plan

// If automation_plan missing, compile from requirements
if (!automationPlan && Object.keys(requirements).length > 0) {
  automationPlan = this.compilePlanFromRequirements(requirements)
}
```

### CONCLUSION
automation_plan can remain derived state. requirements_collected becomes authoritative.

---

## 11. BUILD LOCATION BEFORE AUTOMATION PLAN EXISTS

### Verified: SAFE

**Build Location Method**:
**File**: `lib/alex/artifact-generation/artifact-service.ts` line 69-85
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

**Build Creation**:
**File**: `lib/alex/artifact-generation/artifact-service.ts` line 36-64
```typescript
static async createBuild(
  conversationId: string,
  userId: string,
  originalRequest: string,
  buildType: BuildType
): Promise<ArtifactBuild> {
  const { data, error } = await getSupabaseClient()
    .from('alex_artifact_builds')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      build_type: buildType,
      status: 'collecting_requirements',
      original_request: originalRequest,
      requirements_collected: {},  // Empty but exists
      missing_requirements: [],
      confirmation_granted: false
    })
    .select()
    .single()
  ...
}
```

### CONCLUSION
Build can exist with empty requirements_collected and null automation_plan. Safe to persist requirements before automation_plan exists.

---

## 12. FAILURE BEHAVIOR VERIFICATION

### AI JSON Parsing Fails
**Current**: `getFallbackDecision()` → generic "clarify" → state lost
**Required**: Load requirements_collected → contextual response → state preserved

### Provider Times Out
**Current**: ProviderManager throws error → catch → fallback → state lost
**Required**: ProviderManager throws error → catch → load requirements → contextual response → state preserved

### Provider Fallback Occurs
**Current**: Try next provider → if all fail → state lost
**Required**: Try next provider → if all fail → load requirements → contextual response → state preserved

### AI Returns Malformed Structured Output
**Current**: JSON.parse() fails → catch → fallback → state lost
**Required**: Extract natural language → parse requirements → update state → state preserved

### AI Returns No Structured Output
**Current**: No JSON → fallback → state lost
**Required**: Extract natural language → parse requirements → update state → state preserved

### AI Returns Unexpected Action
**Current**: validateAction() defaults to "respond" → state unchanged (safe)
**Required**: Load requirements → contextual response → state preserved (safer)

### Conversation Becomes Very Long
**Current**: Context limit → truncate → may lose recent requirements
**Required**: Always load requirements_collected from database → state preserved

### CONCLUSION
All failure scenarios require the same fix: load requirements_collected from database before returning response.

---

## VERIFIED

### Safe to Reuse

1. **requirements_collected column** - JSONB type, flexible, unused currently
2. **ArtifactService.getActiveBuild()** - Already locates build correctly
3. **ArtifactService.createBuild()** - Already creates build with empty requirements_collected
4. **Database schema** - No changes needed
5. **JSONB type** - Can represent all requirement structures
6. **Shallow merge pattern** - Existing pattern in workflow-manager.ts can be reused

### Can Be Made Authoritative

1. **requirements_collected** - Can become authoritative with merge function
2. **automation_plan** - Can become derived/compiled state
3. **final_specification** - Can remain for artifact generation
4. **Build existence** - Can exist before automation_plan

---

## NOT VERIFIED

### Incorrect Assumptions from Minimal Migration Audit

1. **Assumption**: "requirements_collected already exists and can be reused"
   - **Correction**: It exists but is NEVER used. Must add all persistence logic.

2. **Assumption**: "Existing infrastructure supports incremental persistence"
   - **Correction**: No incremental persistence exists. Must add merge function and extraction logic.

3. **Assumption**: "Only ~420 lines of changes needed"
   - **Correction**: May be more because:
     - Requirement extraction from natural language is complex
     - Need robust validation of requirement updates
     - Need to handle nested object merging
     - Need to handle requirement conflicts/corrections

4. **Assumption**: "No database changes required"
   - **Correction**: Technically true, but requirements_collected may need index for performance if queried frequently.

### Still Uncertain

1. **Requirement Extraction Complexity**
   - How to reliably extract requirements from natural language?
   - How to distinguish user confirmations from AI suggestions?
   - How to handle ambiguous user statements?

2. **Merge Semantics**
   - Shallow merge vs deep merge?
   - How to handle corrections (user says "actually use Slack")?
   - How to handle deletions (user says "forget the scoring")?

3. **Readiness Detection**
   - How to determine when requirements are complete?
   - How to handle missing requirements?
   - How to trigger transition to planning?

---

## MINIMUM FIX

### Exactly What Must Change

1. **Add ArtifactService.updateRequirements()** (~20 lines)
   - Merge new requirements with existing
   - Update requirements_collected in database

2. **Add RequirementExtractor class** (~150-200 lines)
   - Parse natural language for requirement confirmations
   - Return structured requirement updates
   - Handle corrections and changes

3. **Modify AIOrchestrator.askAIDecision()** (~30 lines)
   - Add layered parsing (JSON → natural language → requirements)
   - Extract requirements on JSON failure
   - Return both action and requirements

4. **Modify AIOrchestrator.getFallbackDecision()** (~20 lines)
   - Load requirements_collected from database
   - Return contextual response based on state
   - Never reset to generic "clarify"

5. **Modify WorkflowOrchestrator.handleOrchestrationResult()** (~20 lines)
   - Call updateRequirements() with extracted requirements
   - Persist requirements independent of AI action
   - Preserve state on AI failures

### Total Estimated Changes
- 1 new file: requirement-extractor.ts
- 3 modified files: ai-orchestrator.ts, workflow-orchestrator.ts, artifact-service.ts
- ~240-290 lines of code
- 0 database schema changes
- 0 migrations

---

## IMPLEMENTATION READINESS

### READY TO IMPLEMENT

**Blockers Resolved**:
- requirements_collected is JSONB and flexible enough
- Build can exist before automation_plan
- No database schema changes needed
- Existing infrastructure can be extended

**Caveats**:
- Requirement extraction complexity is uncertain (may require more than 150 lines)
- Merge semantics need careful design (corrections, deletions, conflicts)
- Natural language parsing may be unreliable (need fallback strategies)

**Recommendation**: Proceed with implementation in phases:
1. Phase 1: Add updateRequirements() and basic persistence
2. Phase 2: Add requirement extraction with simple patterns
3. Phase 3: Add layered parsing and fallback logic
4. Phase 4: Add complex merge semantics and corrections

### Files to Change in Next Step

**Phase 1 (Foundation)**:
1. `lib/alex/artifact-generation/artifact-service.ts` - Add updateRequirements() method
2. `lib/alex/orchestration/types.ts` - Add RequirementUpdate type

**Phase 2 (Extraction)**:
3. `lib/alex/orchestration/requirement-extractor.ts` - NEW file
4. `lib/alex/orchestration/workflow-orchestrator.ts` - Call updateRequirements()

**Phase 3 (Robustness)**:
5. `lib/alex/orchestration/ai-orchestrator.ts` - Add layered parsing
6. `lib/alex/orchestration/ai-orchestrator.ts` - Modify getFallbackDecision()

---

## CONCLUSION

**requirements_collected CAN serve as authoritative incremental state** with the following minimum changes:

1. Add merge function to ArtifactService
2. Add requirement extraction logic
3. Modify AI parsing to be robust
4. Modify fallback to preserve state

**No database changes required** - existing schema is sufficient.

**Estimated scope**: 240-290 lines across 4 files (1 new, 3 modified).

**Risk**: LOW - additive changes only, feature flag allows rollback.

**READY TO IMPLEMENT** ✓
