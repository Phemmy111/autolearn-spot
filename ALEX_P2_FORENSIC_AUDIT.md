# ALEX P2 Forensic Audit Report

## Executive Summary

Current state analysis for P2-A (assumption handling) and P2-B (AutomationSpec fidelity) implementation.

---

## P2-A: Assumption Handling Audit

### Current Implementation

**AutomationPlan Structure** (`lib/alex/orchestration/types.ts` lines 57-130):
```typescript
export interface AutomationPlan {
  objective: string;
  users?: string[];
  trigger?: { type?, source?, description? };
  workflow?: Array<{ step, description? }>;
  inputs?: { sources?, description? };
  outputs?: { destinations?, description? };
  integrations?: { platform?, services?, description? };
  platform?: { name?, reasoning? };
  constraints?: string[];
  assumptions?: string[];                    // ← EXISTS (simple string array)
  recommendations?: string[];               // ← EXISTS (simple string array)
  unresolvedQuestions?: Array<{question, reason, priority}>;
  architecture?: { complexity?, stages? };
  status?: 'draft' | 'planning' | 'ready' | 'generating' | 'generated';
  confidence?: number;
  lastUpdated?: string;
}
```

**Current Assumption Representation**: Simple string array
- assumptions?: string[]
- recommendations?: string[]
- unresolvedQuestions?: Array<{question, reason, priority}>

**AI Prompt Instructions** (`lib/alex/orchestration/ai-orchestrator.ts` lines 184-261):
- Current prompt does NOT explicitly instruct AI to distinguish assumptions from requirements
- Current prompt does NOT instruct AI to avoid silently converting assumptions to requirements
- Current prompt has guidelines about preventing duplicate questions and accepting natural language
- Missing: Explicit assumption identification guidelines

**Assumption Distinguishability**: Current structure allows:
- assumptions: string[] (exists but not enforced)
- recommendations: string[] (exists but not enforced)
- unresolvedQuestions: structured array (exists)

**Problem**: AI may treat assumptions as requirements because the prompt doesn't enforce distinction.

---

## P2-B: AutomationSpec Fidelity Audit

### Current Conversion: planToSpec()

**Location**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 255-310

### Field Mapping Analysis

| AutomationPlan Field | AutomationSpec Field | Conversion Status | Notes |
| -------------------- | -------------------- | ----------------- | ----- |
| objective | description | PRESERVED | Direct mapping |
| users | — | LOST | No equivalent field |
| trigger.type | trigger.type | PRESERVED | Direct mapping |
| trigger.source | trigger.source | PRESERVED | Direct mapping |
| trigger.description | trigger.config | TRANSFORMED | Description → config |
| workflow.steps | — | LOST | No equivalent field |
| inputs.sources | inputs.sources | PRESERVED | Direct mapping |
| inputs.description | — | LOST | No equivalent field |
| outputs.destinations | outputs.destinations | PRESERVED | Direct mapping |
| outputs.description | — | LOST | No equivalent field |
| integrations.platform | integrations.platform | PRESERVED | Direct mapping |
| integrations.services | — | LOST | Only platform preserved |
| integrations.description | — | LOST | No equivalent field |
| platform.name | platform | PRESERVED | Direct mapping |
| platform.reasoning | platformReasoning | PRESERVED | Direct mapping |
| constraints | — | LOST | No equivalent field |
| assumptions | assumptions | PRESERVED | Direct mapping |
| recommendations | recommendations | PRESERVED | Direct mapping |
| unresolvedQuestions | unresolvedBlockers | TRANSFORMED | Not 1:1 mapping |
| architecture.complexity | architecture.complexity | PRESERVED | Direct mapping |
| architecture.stages | architecture.stages | PRESERVED | Direct mapping |
| status | — | LOST | No equivalent field |
| confidence | — | LOST | No equivalent field |
| lastUpdated | — | LOST | No equivalent field |

### Loss Analysis

**Critically Lost Fields**:
- users (who are the users?)
- workflow.steps (workflow structure)
- inputs.description (input semantics)
- outputs.description (output semantics)
- integrations.services (specific services)
- integrations.description (integration context)
- constraints (business constraints)
- unresolvedQuestions (structured questions become simple blocker strings)

**Non-Critical Loss**:
- status (runtime state)
- confidence (AI confidence)
- lastUpdated (timestamp)

**Preserved Important Fields**:
- assumptions (P2-A relevant)
- recommendations (P2-A relevant)
- platform, platformReasoning (platform selection)
- trigger mechanism
- inputs/outputs destinations

### Conversion Implementation

**Current Code** (lines 255-310):
```typescript
private planToSpec(plan: AutomationPlan): AutomationSpec {
  const spec: AutomationSpec = {
    automationType: 'workflow',
    description: plan.objective,
    domain: 'custom',
    aiConfig: { enabled: false },
    humanApproval: { required: false },
    errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
    persistence: { enabled: true, logLevel: 'info', auditTrail: true },
    architecture: { complexity: plan.architecture?.complexity || 'moderate' }
  }
  
  // Manual field-by-field mapping (explicit but incomplete)
  if (plan.trigger) { /* map */ }
  if (plan.inputs) { /* map */ }
  if (plan.outputs) { /* map */ }
  if (plan.integrations) { /* map */ }
  if (plan.platform) { /* map */ }
  if (plan.assumptions) { /* map */ }
  if (plan.recommendations) { /* map */ }
  
  return spec
}
```

**Problems**:
- Incomplete field coverage (many fields lost)
- No documentation of intentional exclusions
- unresolvedQuestions → unresolvedBlockers transformation is lossy
- No audit trail of what was lost

---

## Consumer Analysis

### Where AutomationSpec is Used

**ArchitectureDesigner.design()** (called from workflow-orchestrator.ts line 212):
- Receives AutomationSpec
- Generates architecture proposal
- May not need all lost fields for architecture design

**ArtifactService.updateSpecification()** (called from workflow-orchestrator.ts lines 440, 474):
- Stores AutomationSpec in database
- Persistence only

**specToPlan() reverse conversion** (workflow-orchestrator.ts lines 316-379):
- Converts spec back to plan for loading
- Cannot restore lost fields (information loss is permanent)

---

## P2-A Required Changes

### 1. Enhanced Assumption Structure

**Current**: `assumptions?: string[]`

**Proposed**: Enhanced structure to preserve assumption metadata
```typescript
assumptions?: Array<{
  statement: string
  basis?: string
  confidence?: number
  category?: 'platform' | 'integration' | 'data' | 'timing' | 'other'
}>
```

### 2. Enhanced Recommendations Structure

**Current**: `recommendations?: string[]`

**Proposed**: Enhanced structure
```typescript
recommendations?: Array<{
  statement: string
  reasoning?: string
  priority?: 'high' | 'medium' | 'low'
}>
```

### 3. AI Prompt Enhancement

**Current**: No explicit assumption/recommendation distinction instructions

**Required**: Add explicit guidelines:
- Identify assumptions vs requirements
- Distinguish recommendations from requirements
- Avoid silently converting assumptions to requirements
- Preserve user requirements verbatim
- Surface important assumptions in execution-critical contexts

---

## P2-B Required Changes

### 1. Enhanced AutomationSpec

**Additions needed**:
- `users?: string[]` (preserve users)
- `workflowSteps?: Array<{step, description}>` (preserve workflow structure)
- `constraints?: string[]` (preserve business constraints)
- Enhanced `unresolvedBlockers` with structured information

### 2. Explicit planToSpec() Audit

**Required**: Add explicit mapping documentation
- Which fields are intentionally excluded and why
- Which fields are transformed and how
- Audit trail of conversion decisions

### 3. Loss-Aware Conversion

**Required**: Make conversion explicitly loss-aware
- Log what information is being lost
- Provide warnings for potentially critical losses
- Make conversion auditable

---

## Generate/Execute/Revise Path Analysis

### Generate Path
```
AI decision → AutomationPlan → planToSpec() → AutomationSpec → ArchitectureDesigner.design()
```
**Risk**: Lost fields may affect architecture design quality

### Execute Path
```
AI decision → AutomationPlan → planToSpec() → AutomationSpec → ArtifactService.updateSpecification()
```
**Risk**: Lost constraints/users may affect execution safety

### Revise Path
```
existing plan + revision → revised plan → planToSpec() → AutomationSpec
```
**Risk**: Revision may lose previously established context if fields not preserved

---

## Implementation Scope

### P2-A (Assumption Handling)
1. Enhance AutomationPlan assumption/recommendation structure
2. Update AI prompt to enforce distinction
3. Ensure assumption metadata survives plan→spec conversion

### P2-B (AutomationSpec Fidelity)
1. Enhance AutomationSpec to preserve critical lost fields
2. Update planToSpec() to include explicit mapping
3. Add conversion audit logging
4. Ensure revision preserves context

### Compatibility Constraints
- Must preserve existing consumers (ArchitectureDesigner, ArtifactService)
- Must not break specToPlan() reverse conversion
- Must maintain existing database schema compatibility
- Must not require database migrations

---

## Current Architecture Verification

**P0/P1/P1.5 Status**: Preserved in current code
- Single AI-driven path confirmed
- No legacy routing reintroduced
- Native orchestration events intact
- QuestionTracker advisory only

**Risk**: P2 changes must not reintroduce legacy architecture or deterministic behavior.