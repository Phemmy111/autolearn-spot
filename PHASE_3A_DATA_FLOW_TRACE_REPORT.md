# Phase 3A Data Flow Trace Report

**Date**: 2025-01-XX
**Task**: Trace lead-scoring data flow from conversation to workflow generation
**Status**: TRACE COMPLETE - CRITICAL GAP IDENTIFIED

---

## 1. Actual Data Flow

### Complete Path Traced

```
User Conversation
    ↓
ai-orchestrator.ts: askAIDecisionConversational()
    ↓
ai-orchestrator.ts: extractRequirementsFromMessage()
    ↓
[Extracts aiConfig.leadScoring from message]
    ↓
ArtifactService.updateRequirements(buildId, requirementUpdate)
    ↓
Database: alex_artifact_builds.requirements_collected
    ↓
[STOP - Data remains in requirements_collected]
    ↓
[When user requests workflow generation]
    ↓
workflow-orchestrator.ts: handleGenerate()
    ↓
workflow-orchestrator.ts: planToSpec()
    ↓
ArtifactService.updateSpecification(buildId, spec)
    ↓
Database: alex_artifact_builds.final_specification
    ↓
workflow-manager.ts: attemptTemplateGeneration()
    ↓
[Extracts trigger, functionality, integrations from final_specification]
    ↓
ArchitecturePlanner.design({
  originalRequest,
  platform,
  trigger,
  functionality,
  integrations,
  filename,
  replyScope
})
    ↓
[aiConfig.leadScoring NOT passed to ArchitecturePlanner]
    ↓
ArchitecturePlanner: designLeadAutomation()
    ↓
[Checks request text for 'lead' keyword]
    ↓
[Falls back to designGenericAutomation()]
    ↓
WorkflowGenerator: generate()
    ↓
[Generates generic workflow without AI scoring]
```

### Key Functions and Files

1. **Extraction**: `lib/alex/orchestration/ai-orchestrator.ts`
   - Function: `extractRequirementsFromMessage()` (lines 575-698)
   - Extracts: `aiConfig.leadScoring` from user message
   - Patterns: AI scoring, score range, explanation, threshold

2. **Persistence (Requirements)**: `lib/alex/artifact-generation/artifact-service.ts`
   - Function: `updateRequirements()` (lines 186-238)
   - Stores in: `alex_artifact_builds.requirements_collected`
   - Merge: Shallow merge of existing + new requirements

3. **Plan to Spec**: `lib/alex/orchestration/workflow-orchestrator.ts`
   - Function: `planToSpec()` (lines 334-436)
   - Converts: AutomationPlan → AutomationSpec
   - Stores in: `alex_artifact_builds.final_specification`

4. **Spec Extraction**: `lib/alex/artifact-generation/workflow-manager.ts`
   - Function: `attemptTemplateGeneration()` (lines 1051-1179)
   - Reads from: `build.final_specification`
   - Extracts: `trigger`, `functionality`, `integrations`

5. **Architecture Design**: `lib/alex/artifact-generation/architecture-planner.ts`
   - Function: `design()` (lines 49-92)
   - Signature: `design({ originalRequest, platform, trigger, functionality, integrations, filename, replyScope })`
   - Does NOT receive: `aiConfig`, `final_specification`, or `requirements_collected`

---

## 2. Lead Scoring Data Lifecycle

### A. Where is it Created?

**Location**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: `extractRequirementsFromMessage()` (lines 642-680)

**Code**:
```typescript
// Phase 2: AI lead scoring detection
let leadScoringConfig: any = {}

if (/\bai (?:to )?score/i.test(lower)) {
  leadScoringConfig.enabled = true
  leadScoringConfig.scoringMethod = 'ai'
  leadScoringConfig.explainReasoning = true
}

if (/\bscore (?:from )?0 to 100\b/i.test(lower)) {
  leadScoringConfig.scoreRange = { min: 0, max: 100 }
}

if (/\bexplain (?:the )?(?:score|reasoning)\b/i.test(lower)) {
  leadScoringConfig.explainReasoning = true
}

const thresholdMatch = lower.match(/\b(?:only send|only route|only notify|score|scoring|leads) (\d+)\+?\b/i)
if (thresholdMatch) {
  leadScoringConfig.qualificationThreshold = parseInt(thresholdMatch[1])
}

if (Object.keys(leadScoringConfig).length > 0) {
  if (!update.aiConfig) update.aiConfig = {}
  if (!update.aiConfig.leadScoring) update.aiConfig.leadScoring = {}
  update.aiConfig.leadScoring = { ...update.aiConfig.leadScoring, ...leadScoringConfig }
}
```

**Result**: `requirementUpdate.aiConfig.leadScoring` is created

### B. Where is it Persisted?

**Location**: `lib/alex/artifact-generation/artifact-service.ts`
**Function**: `updateRequirements()` (lines 186-238)

**Database**: `alex_artifact_builds.requirements_collected`

**Code**:
```typescript
const mergedRequirements = {
  ...existingRequirements,
  ...requirementUpdate
}

await getSupabaseClient()
  .from('alex_artifact_builds')
  .update({
    requirements_collected: mergedRequirements,
    updated_at: new Date().toISOString()
  })
  .eq('id', buildId)
```

**Status**: ✅ Persisted in `requirements_collected`

### C. Where is it Transformed?

**Transformation**: NONE

**Issue**: `requirements_collected` is NOT transferred to `final_specification`

**Evidence**:
- `planToSpec()` converts AutomationPlan to AutomationSpec
- AutomationPlan structure does NOT include `aiConfig.leadScoring`
- No code merges `requirements_collected` into `final_specification`
- Two separate database columns with no bridge

### D. Where is it Passed?

**Status**: ❌ NOT PASSED to ArchitecturePlanner

**Evidence**:
- `workflow-manager.ts` reads from `build.final_specification`
- Extracts only: `trigger`, `functionality`, `integrations`, `platform`, `filename`, `replyScope`
- Does NOT extract or pass `aiConfig.leadScoring`
- `ArchitecturePlanner.design()` signature does NOT include `aiConfig`

### E. Where is it Consumed?

**Status**: ❌ NOT CONSUMED

**Evidence**:
- ArchitecturePlanner does not receive `aiConfig`
- `designLeadAutomation()` only checks request text for 'lead' keyword
- Falls back to `designGenericAutomation()`
- No AI scoring node is generated

### F. Where does it Disappear?

**Boundary**: Between `requirements_collected` and `final_specification`

**Specific Point**: `workflow-orchestrator.ts: planToSpec()` and `workflow-manager.ts: attemptTemplateGeneration()`

**Reason**:
1. Phase 2 conversational path stores in `requirements_collected`
2. Workflow generation path reads from `final_specification`
3. No bridge between the two columns
4. Data is lost during the transition

---

## 3. `designLeadAutomation()` Analysis

### Signature

**File**: `lib/alex/artifact-generation/architecture-planner.ts`
**Lines**: 452-457

```typescript
private static designLeadAutomation(spec: any): WorkflowArchitecture {
  const baseName = spec.filename?.replace('.json', '') || 'lead-automation'
  
  // Moderate complexity: trigger, qualification, routing, CRM integration
  return this.designGenericAutomation(spec)
}
```

### Inputs Received

**From ArchitecturePlanner.design()**:
```typescript
{
  originalRequest: string
  platform: string
  trigger: string
  functionality: string
  integrations: string
  filename?: string
  replyScope?: string
}
```

**Does NOT include**:
- `aiConfig`
- `final_specification`
- `requirements_collected`
- `automation_plan`

### Available Data

**Status**: Only receives simple string descriptors
- `trigger`: "Webhook (POST)" or similar
- `functionality`: "basic processing" or similar
- `integrations`: "Google Sheets, OpenAI GPT-4" or similar

**Does NOT have**:
- Structured `aiConfig.leadScoring` object
- Boolean flags
- Numeric thresholds
- Score ranges

### Current Behavior

**Logic**:
```typescript
if (lowerRequest.includes('lead') || lowerFunctionality.includes('lead')) {
  return this.designLeadAutomation(spec)
}
```

**Execution**:
1. Detects 'lead' keyword in request or functionality
2. Calls `designLeadAutomation()`
3. Immediately returns `designGenericAutomation()`
4. NO specialized lead automation logic

**Result**: Generic workflow without AI scoring

---

## 4. WorkflowGenerator Analysis

### Input Received

**From ArchitecturePlanner.design()**:
```typescript
{
  name: string
  description: string
  nodes: NodeDesign[]
  connections: ConnectionDesign[]
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string
}
```

### AutomationSpec Availability

**Status**: ❌ NOT AVAILABLE

**Evidence**:
- WorkflowGenerator receives WorkflowArchitecture object
- WorkflowArchitecture is a node graph design
- No original AutomationSpec is passed through
- No `aiConfig` survives to this layer

### Lead-Scoring Configuration Survival

**Status**: ❌ DOES NOT SURVIVE

**Reason**:
- `aiConfig.leadScoring` never reaches ArchitecturePlanner
- ArchitecturePlanner cannot pass it to WorkflowGenerator
- WorkflowGenerator has no access to the configuration

---

## 5. Multi-Turn Result

### Five-Turn Conversation

**Turn 1**: "I want to collect leads from a Google Form."
**Turn 2**: "Score every lead from 0 to 100 using AI."
**Turn 3**: "Explain why it gave each score."
**Turn 4**: "Keep every lead in Google Sheets."
**Turn 5**: "Email me leads scoring 80 or higher."

### Final requirements_collected Structure

**Expected** (based on extraction logic):
```typescript
{
  trigger: {
    source: 'google-form',
    description: 'Google Forms'
  },
  aiConfig: {
    leadScoring: {
      enabled: true,
      scoringMethod: 'ai',
      scoreRange: { min: 0, max: 100 },
      explainReasoning: true,
      qualificationThreshold: 80
    }
  },
  integrations: {
    emailProvider: 'gmail'
  },
  outputs: {
    destinations: ['email']
  }
}
```

### Final final_specification Structure

**Actual** (based on workflow-manager.ts extraction):
```typescript
{
  platform: 'n8n',
  trigger: 'Webhook (POST)',
  functionality: 'basic processing',
  integrations: 'Google Sheets, OpenAI GPT-4',
  filename: 'lead-automation.json'
}
```

**MISSING**:
- `aiConfig.leadScoring` - NOT present
- `qualificationThreshold` - NOT present
- Structured trigger object - flattened to string
- Structured integrations - flattened to string

### Input to ArchitecturePlanner

**Actual**:
```typescript
{
  originalRequest: "I want to collect leads from a Google Form. Score every lead from 0 to 100 using AI. Explain why it gave each score. Keep every lead in Google Sheets. Email me leads scoring 80 or higher.",
  platform: 'n8n',
  trigger: 'Webhook (POST)',
  functionality: 'basic processing',
  integrations: 'Google Sheets, OpenAI GPT-4',
  filename: 'lead-automation.json',
  replyScope: undefined
}
```

**Result**: `aiConfig.leadScoring` is COMPLETELY LOST

---

## 6. Exact Integration Gap

### Gap Location

**Between**: `requirements_collected` and `final_specification`

**Specific Boundary**:
1. No code merges `requirements_collected` into `final_specification`
2. `planToSpec()` does not read from `requirements_collected`
3. `attemptTemplateGeneration()` does not read from `requirements_collected`
4. ArchitecturePlanner does not receive either source

### Data Loss Point

**Function**: `workflow-manager.ts: attemptTemplateGeneration()` (line 1085)

**Before ArchitecturePlanner.design()**:
```typescript
const trigger = build.final_specification?.trigger || 'manual'
const functionality = build.final_specification?.functionality || 'basic processing'
const integrations = build.final_specification?.integrations || 'none'
```

**Missing**:
```typescript
const aiConfig = build.final_specification?.aiConfig  // NOT EXTRACTED
const aiConfig = build.requirements_collected?.aiConfig  // NOT READ
```

### Root Cause

**Architectural Issue**: Two separate persistence paths
1. **Conversational Path**: Stores in `requirements_collected`
2. **Workflow Path**: Reads from `final_specification`
3. **No Bridge**: No code transfers data between them

---

## 7. Smallest Required Fix

### Option A: Bridge requirements_collected to final_specification

**Location**: `workflow-manager.ts: attemptTemplateGeneration()`

**Change**:
```typescript
// After extracting basic specs
const trigger = build.final_specification?.trigger || 'manual'
const functionality = build.final_specification?.functionality || 'basic processing'
const integrations = build.final_specification?.integrations || 'none'

// NEW: Merge requirements_collected into final_specification
const mergedSpec = {
  ...build.final_specification,
  ...build.requirements_collected
}

// Pass aiConfig to ArchitecturePlanner
const architecture = ArchitecturePlanner.design({
  originalRequest: build.original_request,
  platform,
  trigger,
  functionality,
  integrations,
  filename,
  replyScope: mergedSpec.replyScope,
  aiConfig: mergedSpec.aiConfig  // NEW PARAMETER
})
```

**Pros**:
- Minimal change
- Preserves existing data flow
- Bridges the gap at the right point

**Cons**:
- Requires extending ArchitecturePlanner signature
- Requires changing ArchitecturePlanner to use aiConfig

### Option B: Store directly in final_specification during conversation

**Location**: `ai-orchestrator.ts: askAIDecisionConversational()`

**Change**:
```typescript
// After extracting requirements
if (requirementUpdate && Object.keys(requirementUpdate).length > 0) {
  // Instead of updateRequirements(), call updateSpecification()
  await ArtifactService.updateSpecification(buildId, requirementUpdate, [])
}
```

**Pros**:
- Simpler - single persistence location
- No bridging required
- Data immediately available to workflow generation

**Cons**:
- Changes conversational persistence model
- May affect other workflows that rely on requirements_collected

### Option C: Specialize designLeadAutomation with text parsing

**Location**: `architecture-planner.ts: designLeadAutomation()`

**Change**:
```typescript
private static designLeadAutomation(spec: any): WorkflowArchitecture {
  // Parse aiConfig from integrations string (hacky)
  const hasAI = spec.integrations?.toLowerCase().includes('ai')
  const thresholdMatch = spec.originalRequest.match(/(\d+)\+?\b/)
  const threshold = thresholdMatch ? parseInt(thresholdMatch[1]) : undefined
  
  // Generate specialized workflow with AI node
  // ...
}
```

**Pros**:
- No signature changes
- Works with existing data flow

**Cons**:
- Unreliable parsing
- Not structured
- Violates Phase 2 schema approach

### Recommended Fix

**Option A**: Bridge requirements_collected to final_specification

**Why**:
- Preserves existing Phase 2 schema work
- Maintains separation of concerns
- Minimal architectural change
- Extensible for future requirements

---

## 8. Files Changed

**Status**: ZERO

**No production code changes made** - this was an investigation-only task.

---

## 9. Token Architecture

**Status**: COMPLETELY UNTOUCHED

**Verification**:
- No token infrastructure files inspected
- No token-related code modified
- No TPM or budget calculations changed

---

## 10. Recommendation for Phase 3 Implementation

### Required Changes Before Phase 3

**1. Bridge requirements_collected to final_specification**
- Modify `workflow-manager.ts: attemptTemplateGeneration()`
- Merge `requirements_collected` into `final_specification`
- Pass `aiConfig` to ArchitecturePlanner

**2. Extend ArchitecturePlanner signature**
- Add `aiConfig` parameter to `design()` method
- Pass `aiConfig` to design methods

**3. Specialize designLeadAutomation()**
- Check for `aiConfig.leadScoring.enabled`
- Add AI scoring node generation
- Add qualification routing if threshold specified
- Ensure Google Sheets storage precedes qualification

**4. Add Phase 3 tests**
- Test requirements_collected → final_specification bridge
- Test ArchitecturePlanner receives aiConfig
- Test designLeadAutomation generates AI scoring node
- Test qualification routing uses threshold from aiConfig
- Test multi-turn conversation produces complete workflow

### Implementation Order

1. **Step 1**: Add bridging logic in workflow-manager.ts
2. **Step 2**: Extend ArchitecturePlanner signature
3. **Step 3**: Implement specialized designLeadAutomation()
4. **Step 4**: Add integration tests
5. **Step 5**: Add regression tests for Phase 1 and Phase 2

### Critical Path

**The data flow gap MUST be fixed before Phase 3 can work.**

Without the bridge, `aiConfig.leadScoring` will never reach ArchitecturePlanner, and Phase 3 will continue to generate generic workflows without AI scoring.

---

## Final Summary

**Investigation**: COMPLETE
**Gap Identified**: YES - requirements_collected to final_specification
**Data Loss Point**: workflow-manager.ts: attemptTemplateGeneration()
**Root Cause**: Two separate persistence paths with no bridge
**Smallest Fix**: Merge requirements_collected into final_specification before ArchitecturePlanner
**Phase 3 Prerequisite**: Data flow bridge MUST be implemented first

**DO NOT PROCEED WITH PHASE 3** until the data flow gap is resolved.
