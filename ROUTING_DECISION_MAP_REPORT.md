# Routing Decision Map Report

**Date**: 2025-01-XX
**Task**: Map routing decision paths for ALEX
**Status**: ROUTING ANALYSIS COMPLETE — NO FIXES IMPLEMENTED

---

## TASK 1 — ALEX_CONVERSATIONAL_MODE Effect

### Where It Is Read

**File**: `lib/alex/orchestrator.ts`
**Line**: 73

**Code**:
```typescript
const enableConversationalMode = process.env.ALEX_CONVERSATIONAL_MODE === 'true'
console.log('[Phase B] Conversational mode in main orchestrator:', enableConversationalMode)
```

### What It Changes

**ALEX_CONVERSATIONAL_MODE disables Path 1 and Path 2 entirely** — it's not a priority override, it's a complete bypass.

**Path 1 Bypass** (lines 157-219):
```typescript
// Phase B: Skip forced routing if conversational mode is enabled
if (userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode) {
  // Check for existing artifact build
  // ... routes to WorkflowOrchestrator
}
```

**Condition**: `!enableConversationalMode` prevents execution when conversational mode is enabled.

**Path 2 Bypass** (lines 225-314):
```typescript
// Phase B: Skip forced routing if conversational mode is enabled
if (mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode) {
  // AI-driven routing to WorkflowOrchestrator
  // ... routes to WorkflowOrchestrator
}
```

**Condition**: `!enableConversationalMode` prevents execution when conversational mode is enabled.

**Path 3 Activation** (lines 316+):
When `enableConversationalMode === true`, the code falls through to lines 316+, which:
- Generates system prompt
- Assembles context via `assembleContext()`
- Builds AI request for streaming
- Returns conversational response

**Conclusion**: `ALEX_CONVERSATIONAL_MODE=true` completely disables Path 1 and Path 2, forcing all requests through Path 3 (conversational mode). This is a hard bypass, not a priority override.

---

## TASK 2 — Path 2 Behavior Analysis

### Path 2 Location

**File**: `lib/alex/orchestrator.ts`
**Lines**: 225-314

### What Path 2 Does

**Entry Condition**:
```typescript
if (mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode)
```

**Execution Flow**:
1. Calls `WorkflowOrchestrator.getInstance().orchestrateWorkflow(workflowRequest)` (line 246)
2. WorkflowOrchestrator calls `AIOrchestrator.orchestrate()` (line 90)
3. AIOrchestrator returns a decision with action type (respond, clarify, plan, generate, execute, etc.)
4. WorkflowOrchestrator handles the action

### Does Path 2 Call ArchitecturePlanner/WorkflowGenerator?

**YES** — When the AI decision action type is `generate` or `execute`.

**Evidence** (workflow-orchestrator.ts:195-214):
```typescript
// For generate action, invoke artifact generation machinery
if (action.type === 'generate' || action.type === 'execute') {
  console.log('[P0] Invoking artifact generation machinery for action:', action.type)
  const planForGeneration = updatedPlan || action.plan
  const generateResponse = await this.handleGenerate(planForGeneration, request)
  
  return {
    ...generateResponse,
    action: action
  }
}
```

**handleGenerate Method** (workflow-orchestrator.ts:279-328):
```typescript
public async handleGenerate(
  plan: AutomationPlan,
  request: WorkflowOrchestrationRequest
): Promise<WorkflowOrchestrationResponse> {
  // Convert plan to AutomationSpec
  const spec = this.planToSpec(plan)
  
  // Design architecture
  const architecture = await ArchitectureDesigner.design(spec)
  
  // Create or update build
  const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, userId)
  // ... update or create build
  
  // Return architecture proposal
  return {
    status: 'awaiting_architecture_verification',
    message: 'I\'ve designed the architecture for your automation. Please review and confirm.',
    architectureProposal: { ... },
    specification: spec,
    plan
  }
}
```

**Is Path 2 Based on Intent Detection Results?**

**NO** — Path 2 does NOT use the `detectedIntent`, `suggestedMode`, or `isArtifactGeneration` from the orchestrator's intent detector.

**Evidence** (orchestrator.ts:233-238):
```typescript
console.log('[ALEX AI ROUTING] Deterministic intent metadata:', {
  detectedIntent,
  suggestedMode,
  isArtifactGeneration,
  note: 'Metadata only, AI will make actual decision'
})
```

**How Path 2 Decides**:
- Path 2 calls `AIOrchestrator.orchestrate()` which makes its own decision using:
  - User message
  - Conversation context
  - Current automation plan
  - AI's own internal reasoning
- The intent detection results from `intent-detector.ts` are passed only as metadata and logged, but NOT used for decision-making.

**Conclusion**: Path 2 is NOT purely conversational under a different name. It IS a complete artifact generation pipeline that calls ArchitectureDesigner and WorkflowGenerator, but it uses AI-driven decision-making instead of the static intent detector.

---

## TASK 3 — Path 3 (Conversational Mode) Behavior

### Path 3 Location

**File**: `lib/alex/orchestrator.ts`
**Lines**: 316-407

### What Path 3 Does

**Entry Condition**: When `enableConversationalMode === true` (or when Path 1 and Path 2 conditions are not met)

**Execution Flow**:
1. Generates system prompt (line 317)
2. Enables web research based on mode (line 320)
3. Assembles context via `assembleContext()` (line 323)
4. Builds AI request for streaming (line 361)
5. Returns orchestrator response with AI request (line 399)

**Does Path 3 Hand Off to Artifact Generation?**

**NO** — Path 3 NEVER calls ArchitecturePlanner/WorkflowGenerator under any conditions.

**Evidence**:
- Path 3 ends at line 407 with a return statement that includes `aiRequest` for streaming
- No call to `WorkflowOrchestrator`, `ArchitectureDesigner`, or `ArtifactService`
- No conditional logic to transition to artifact generation based on requirements collected

**What Path 3 Does with Requirements**:
- Path 3 uses `assembleContext()` which may include requirements
- But these requirements are only embedded in the conversational context
- There is NO handoff to the artifact generation pipeline

**Is There ANY Point Where Conversational Mode Hands Off?**

**NO** — Conversational mode is a dead end for artifact generation.

**Evidence from AIOrchestrator Conversational Path** (ai-orchestrator.ts:450-537):
```typescript
// Phase B: Natural language prompt - NO JSON requirement
const prompt = `${systemPrompt}
...
Respond naturally to the user's message. Be helpful, clear, and conversational.
If the user is discussing automation, use your expertise to provide useful guidance.
If appropriate, ask follow-up questions to better understand their needs.
Do not output JSON. Do not use structured formats. Just respond naturally.`

try {
  const response = await aiService.generateResponse(prompt)
  
  // Phase B: Extract requirements via deterministic patterns (Phase 3)
  const requirementUpdate = this.extractRequirementsFromMessage(userMessage)
  
  // Phase B: Persist requirements if extracted
  if (requirementUpdate && Object.keys(requirementUpdate).length > 0) {
    // ... persist to ArtifactService
  }
  
  // Phase B: Return natural language response
  return {
    action: {
      type: 'respond',
      message: response
    },
    intent: 'unrelated_conversation',
    confidence: 0.8,
    reasoning: 'Conversational response via natural language path',
    requirementUpdate
  }
}
```

**Key Finding**: The conversational path extracts and persists requirements, but it ALWAYS returns `action.type === 'respond'` (conversational response). It NEVER returns `action.type === 'generate'` or `action.type === 'execute'` to trigger artifact generation.

**Conclusion**: "Conversational mode" is NOT a legitimate first phase of a longer flow that eventually hands off to artifact generation. It is a dead end — it collects requirements but never transitions to the artifact generation pipeline.

---

## TASK 4 — Complete Route Analysis

### Path 1: Existing Artifact Build

**Entry Condition**: `userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode` AND existing build in database

**Flow**:
1. Checks for existing artifact build in database
2. If found, calls `WorkflowOrchestrator.orchestrateWorkflow()`
3. WorkflowOrchestrator calls `AIOrchestrator.orchestrate()`
4. AI decision can trigger `handleGenerate()` which calls `ArchitectureDesigner.design()`
5. Returns architecture proposal

**Is This a Complete Route?**

**YES** — This is a complete route from user message to generated artifact, provided:
- There is an existing artifact build in the database
- `ALEX_CONVERSATIONAL_MODE` is NOT enabled
- The AI decision action type is `generate` or `execute`

**Where It Stops Short**:
- If there is NO existing artifact build in the database
- If `ALEX_CONVERSATIONAL_MODE` is enabled
- If the AI decision action type is NOT `generate` or `execute`

### Path 2: AI-Driven Routing for Auto Mode

**Entry Condition**: `mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode`

**Flow**:
1. Calls `WorkflowOrchestrator.orchestrateWorkflow()`
2. WorkflowOrchestrator calls `AIOrchestrator.orchestrate()`
3. AI decision can trigger `handleGenerate()` which calls `ArchitectureDesigner.design()`
4. Returns architecture proposal

**Is This a Complete Route?**

**YES** — This is a complete route from user message to generated artifact, provided:
- Mode is 'auto'
- `ALEX_CONVERSATIONAL_MODE` is NOT enabled
- The AI decision action type is `generate` or `execute`

**Where It Stops Short**:
- If `ALEX_CONVERSATIONAL_MODE` is enabled
- If the AI decision action type is NOT `generate` or `execute`

### Path 3: Conversational Mode

**Entry Condition**: `enableConversationalMode === true` OR (mode is not 'auto' OR no userId OR no conversationId OR skipArtifactDetection)

**Flow**:
1. Generates system prompt
2. Assembles context
3. Builds AI request for streaming
4. Returns conversational response
5. Extracts and persists requirements (but never uses them for artifact generation)

**Is This a Complete Route?**

**NO** — This is NOT a complete route to generated artifact.

**Where It Stops Short**:
- Path 3 NEVER calls `WorkflowOrchestrator`
- Path 3 NEVER calls `ArchitectureDesigner`
- Path 3 NEVER triggers artifact generation
- Path 3 ALWAYS returns conversational responses
- Requirements are collected but never used to transition to artifact generation

**Conclusion**: Path 3 is a dead end. It collects requirements but has no mechanism to hand off to the artifact generation pipeline.

---

## SUMMARY

### ALEX_CONVERSATIONAL_MODE Effect
- **Disables Path 1 and Path 2 entirely** (hard bypass, not priority override)
- Forces all requests through Path 3 (conversational mode)

### Path 2 Behavior
- **Is NOT purely conversational** — it is a complete artifact generation pipeline
- **Does NOT use intent detection results** — uses AI-driven decision-making
- **Does call ArchitecturePlanner/WorkflowGenerator** when AI decision action type is `generate` or `execute`

### Path 3 Behavior
- **Is a dead end** — collects requirements but never hands off to artifact generation
- **NEVER calls ArchitecturePlanner/WorkflowGenerator** under any conditions
- **Is NOT a legitimate first phase** of a longer flow

### Complete Routes
- **Path 1**: YES (complete IF existing build exists AND conversational mode disabled AND AI decision is generate/execute)
- **Path 2**: YES (complete IF conversational mode disabled AND AI decision is generate/execute)
- **Path 3**: NO (never complete — dead end)

### Why "I want an automation for job applications" Fails
- With `ALEX_CONVERSATIONAL_MODE=true`, Path 1 and Path 2 are disabled
- The request goes through Path 3 (conversational mode)
- Path 3 is a dead end — it never reaches ArchitecturePlanner/WorkflowGenerator
- The intent detection result is ignored (as documented in FORENSIC_FINDINGS_REPORT.md)

---

## STATUS

**ROUTING ANALYSIS COMPLETE — NO FIXES IMPLEMENTED**

This report documents the complete routing decision map for ALEX. No code changes have been made.

Generated with Devin (https://devin.ai)
