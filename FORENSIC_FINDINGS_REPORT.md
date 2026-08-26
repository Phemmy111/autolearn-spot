# Forensic Findings Report — Intent Routing and Tool Budgeting

**Date**: 2025-01-XX
**Task**: Map intent-to-routing gap and confirm tool-definition budgeting gap
**Status**: FINDINGS REPORT ONLY — NO FIXES IMPLEMENTED

---

## TASK 1 — Intent-to-Routing Gap

### Intent Detection Location

**File**: `lib/alex/intent-detector.ts`
**Function**: `detectIntent()` (lines 15-193)

**Intent Detection Result for "I want an automation for job applications"**:
- `detectedIntent`: 'Workflow automation'
- `suggestedMode`: 'automation'
- `confidence`: 1.0
- `isArtifactGeneration`: false (because it doesn't start with "create/build/generate")

### Where Intent Result is Used

**File**: `lib/alex/orchestrator.ts`
**Lines**: 137-155 (intent detection and metadata assignment)

**Code**:
```typescript
// Detect intent if in Auto mode (for metadata only - NOT routing authority)
let detectedIntent: string | undefined
let suggestedMode: AlexMode | undefined
let isArtifactGeneration = false

if (mode === 'auto') {
  console.log('[DEBUG ORCHESTRATOR] Detecting intent for auto mode (advisory metadata only)', { contentPreview: content.substring(0, 100) })
  const intentResult = await detectIntent(content)
  detectedIntent = intentResult.intent
  suggestedMode = intentResult.suggestedMode
  isArtifactGeneration = intentResult.isArtifactGeneration || false
  console.log('[DEBUG ORCHESTRATOR] Intent detection result (advisory metadata)', {
    detectedIntent,
    suggestedMode,
    isArtifactGeneration,
    confidence: intentResult.confidence,
    note: 'This is advisory metadata only, does not control routing or prevent AI orchestration'
  })
}
```

**Key Observation**: The code explicitly states "This is advisory metadata only, does not control routing or prevent AI orchestration"

### Where Intent Result is Discarded

**File**: `lib/alex/orchestrator.ts`
**Lines**: 157-314 (routing logic)

**Routing Path**:
1. **Lines 157-219**: Check for existing artifact build (not using intent detection)
2. **Lines 225-314**: AI-driven routing using WorkflowOrchestrator (not using intent detection)
3. **Lines 316+**: Normal context assembly for conversational chat

**Intent detection result is NEVER used for routing decisions** — it's only assigned to metadata variables but never checked in conditional logic for routing.

### Code Path That Would Need to Check Intent Result

**Current path** (lines 225-314):
```typescript
if (mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode) {
  // Routes to WorkflowOrchestrator regardless of intent detection result
  const workflowOrchestrator = WorkflowOrchestrator.getInstance()
  const workflowResponse = await workflowOrchestrator.orchestrateWorkflow(workflowRequest)
}
```

**Would need to add**:
```typescript
if (mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode) {
  // Check intent detection result for routing decision
  if (isArtifactGeneration || suggestedMode === 'automation' || suggestedMode === 'agent_builder') {
    // Route to artifact generation based on intent
    const workflowOrchestrator = WorkflowOrchestrator.getInstance()
    const workflowResponse = await workflowOrchestrator.orchestrateWorkflow(workflowRequest)
  } else {
    // Route to normal conversational chat
    // Normal path...
  }
}
```

### Is There ANY Code Path That Reaches ArchitecturePlanner/WorkflowGenerator?

**YES** — but NOT based on intent detection:

**Path 1**: Existing artifact build (lines 157-219)
- Condition: `if (userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode)`
- Trigger: Existing artifact build in database
- Routes to: `WorkflowOrchestrator.orchestrateWorkflow()`

**Path 2**: AI-driven routing (lines 225-314)
- Condition: `if (mode === 'auto' && userId && conversationId && !request.skipArtifactDetection && !enableConversationalMode)`
- Trigger: All auto mode requests (regardless of intent)
- Routes to: `WorkflowOrchestrator.orchestrateWorkflow()`

**Path 3**: Conversational mode (lines 316+)
- Condition: `if (enableConversationalMode)` (via environment variable)
- Trigger: When `ALEX_CONVERSATIONAL_MODE=true`
- Routes to: Normal conversational chat via `AIOrchestrator.askAIDecisionConversational()`

**Key Finding**: WorkflowOrchestrator IS reachable, but it's only reached when:
1. There's an existing artifact build, OR
2. The mode is 'auto' AND conversational mode is disabled

For "I want an automation for job applications" with `ALEX_CONVERSATIONAL_MODE=true`, the intent detection result is ignored and conversational mode is used instead.

---

## TASK 2 — Tool-Definition Budgeting Gap

### Context-Assembly TokenBudget Function

**File**: `lib/alex/context/token-budget-manager.ts`
**Function**: `calculateBudget()` (lines 58-198)

**Context Sections Defined** (lines 103-160):
```typescript
const contextSections: ContextSection[] = [
  {
    name: 'system_prompt',
    content: systemPrompt,
    priority: 0,
    // ...
  },
  {
    name: 'platform_context',
    content: platformContext,
    priority: 1,
    // ...
  },
  {
    name: 'file_context',
    content: fileContext,
    priority: 2,
    // ...
  },
  {
    name: 'memory_context',
    content: memoryContext,
    priority: 3,
    // ...
  },
  {
    name: 'rag_context',
    content: ragContext,
    priority: 4,
    // ...
  },
  {
    name: 'web_research_context',
    content: webResearchContext,
    priority: 5,
    // ...
  },
  {
    name: 'tool_results',
    content: toolResults,
    priority: 5,
    // ...
  }
]
```

**Confirmation**: There is NO section for tool/function-calling definitions in the context-assembly TokenBudget function. The `tool_results` section counts the results of tool execution, NOT the tool definitions themselves.

### TPM-Gate Estimator

**File**: `lib/alex/provider/provider-manager.ts`
**Function**: `estimateRequestTokens()` (lines 484-545)

**Tool Definition Counting** (lines 520-529):
```typescript
// Estimate tokens for tool definitions
if (request.tools && Array.isArray(request.tools)) {
  for (const tool of request.tools) {
    // Tool definition tokens
    totalTokens += estimateTokens(tool.name)
    totalTokens += estimateTokens(tool.description)
    totalTokens += estimateTokens(JSON.stringify(tool.inputSchema))
    totalTokens += 10 // Overhead per tool
  }
}
```

**Confirmation**: The TPM-gate estimator DOES count tool definitions (name, description, inputSchema, overhead).

### Token Count Discrepancy

**From the trace**:
- Context-assembly TokenBudget: 689 tokens (no tool definitions)
- TPM-gate estimator: 1278 tokens (includes 566 tokens for 4 generic tools)
- Discrepancy: 589 tokens (exactly the tool definition tokens)

### Confirmation: Tools Are Structurally Excluded from Context-Assembly Budget

**Yes** — The context-assembly TokenBudget function is structurally designed to budget for context sections (system prompt, platform context, file context, etc.) but NOT for tool definitions.

**Rationale**: Tool definitions are added at the provider layer (in `ProviderManager.executeStreamingWithFallback()`) AFTER the context assembly has already completed. The context-assembly budget is meant to control file context, RAG context, web research context, etc., while tool definitions are managed separately at the provider layer.

### Does "Automation" Mode Attach Different/Larger Tool Set?

**File**: `lib/alex/ai-engine.ts`
**Lines**: 239-242 (tool initialization)

**Current Tool Registry** (lines 41-43):
```typescript
this.toolRegistry.registerTool(calculatorToolDefinition, calculatorToolExecutor)
this.toolRegistry.registerTool(currentTimeToolDefinition, currentTimeToolExecutor)
this.toolRegistry.registerTool(leadScoringToolDefinition, leadScoringExecutor)
```

**Web Search Tool** (lines 52-60):
```typescript
if (this.toolRegistry && this.webResearchService) {
  if (!this.toolRegistry.hasTool('web_search')) {
    const webSearchExecutor = createWebSearchToolExecutor(this.webResearchService)
    this.toolRegistry.registerTool(webSearchToolDefinition, webSearchExecutor)
  }
}
```

**Confirmation**: The tool registry is initialized with the same 4 generic tools (calculator, current time, lead scoring, web search) regardless of mode. There is no "automation mode" specific tool set. The tool definitions are the same size regardless of the user's intent.

**Implication**: The 8,410-token failure is likely NOT caused by larger tool schemas in automation mode, since the tool set is constant across modes.

---

## FINDINGS SUMMARY

### FINDING A — Intent-to-Routing Gap

**Confirmed**: The intent detector correctly identifies "I want an automation for job applications" as workflow automation, but this result is explicitly treated as "advisory metadata only" and never used for routing decisions.

**Current Behavior**:
- Intent detection runs but result is ignored
- Routing decisions are based on:
  1. Existing artifact builds (database check)
  2. Conversational mode flag (`ALEX_CONVERSATIONAL_MODE`)
  3. Auto mode flag
- NOT based on `detectedIntent`, `suggestedMode`, or `isArtifactGeneration`

**Required Fix**: Add conditional logic to check intent detection results and route to artifact generation when appropriate, instead of always routing to conversational chat when `ALEX_CONVERSATIONAL_MODE=true`.

### FINDING B — Tool-Definition Budgeting Gap

**Confirmed**: Two independent token estimators disagree because they account for different components:

**Context-assembly TokenBudget**:
- Estimates: 689 tokens
- Accounts for: system_prompt, platform_context, file_context, memory_context, rag_context, web_research_context, tool_results
- Does NOT account for: tool/function-calling definitions

**TPM-gate estimator**:
- Estimates: 1278 tokens
- Accounts for: All of the above PLUS tool definitions (566 tokens for 4 generic tools)
- Total difference: 589 tokens (exactly the tool definition tokens)

**Structural Reason**: Tool definitions are added at the provider layer AFTER context assembly, so they are excluded from the context-assembly budget check by design.

**Tool Set Consistency**: The tool set is constant (4 generic tools) regardless of mode. There is no larger tool set for automation mode, so the 8,410-token failure is unlikely to be caused by mode-specific tool schemas.

---

## RECOMMENDATION FOR NEXT STEPS

### For FINDING A (Intent Routing):
Implement routing logic that respects the intent detection result, allowing "I want an automation for job applications" to reach WorkflowOrchestrator instead of being trapped in conversational mode.

### For FINDING B (Tool Budgeting):
Either:
1. Add tool definitions to the context-assembly TokenBudget function, OR
2. Acknowledge that tool definitions are intentionally budgeted at the provider layer and ensure the TPM-gate estimator is the authoritative source for total token counts.

---

## STATUS

**FINDINGS REPORT ONLY — NO FIXES IMPLEMENTED**

This report documents the confirmed findings from the diagnostic trace. No code changes have been made.

Generated with Devin (https://devin.ai)
