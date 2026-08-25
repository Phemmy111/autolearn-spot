# Phase 1: Real Execution Path Trace

## Test Concept: "Create a lead capture bot"

## Complete Runtime Path

### 1. Frontend Send
**File**: `components/alex/AlexChat.tsx`
- User sends message via `sendMessage(content)`
- Message includes: `content`, `conversationId`, `mode`, `fileIds`
- **NO field:value format** (removed in previous implementation)

### 2. `/api/alex/chat` Route
**File**: `app/api/alex/chat/route.ts`
- **Line 26**: POST handler starts
- **Line 30**: Auth check via Clerk
- **Line 67**: Extract request body: `{ conversationId, content, mode, fileIds, enableAgent }`
- **Line 70-77**: Diagnostic logging
- **Line 86-119**: File resolution (current message vs conversation files)
- **Line 128-139**: Verify conversation ownership
- **Line 151-168**: Save user message to `alex_messages` table
- **Line 236-238**: Update conversation timestamp
- **Line 276-281**: Fetch conversation history (last 20 messages)
- **Line 284-427**: File attachment processing and validation
- **Line 429-433**: Build conversation history array

### 3. AI Engine Processing
**File**: `lib/alex/ai-engine.ts`
- **Line 448**: `AIEngine.streamChat()` called
- **Line 272**: `AIEngine.processChat()` called
- **Line 180**: `AlexOrchestrator.orchestrate()` called

### 4. Orchestrator Processing
**File**: `lib/alex/orchestrator.ts`
- **Line 66**: `AlexOrchestrator.orchestrate()` starts
- **Line 73-131**: Agent mode check (if enabled)
- **Line 138-150**: Intent detection via `detectIntent()`
  - **File**: `lib/alex/intent-detector.ts`
  - **Line 15**: `detectIntent()` function
  - **Line 58-59**: Checks if starts with "create/build/generate"
  - **Line 90-95**: Sets `isArtifactGeneration = true` for "create a lead capture bot"
- **Line 152-253**: **Existing build check**
  - **Line 155**: Check `if (userId && conversationId && !request.skipArtifactDetection)`
  - **Line 158**: Call `ArtifactService.getActiveBuild(conversationId, userId)`
  - **Line 163**: If existing build found:
    - **Line 167**: Check feature flag `USE_AI_DRIVEN_ORCHESTRATION`
    - **Line 169**: If true → Use `WorkflowOrchestrator` (AI-driven path)
    - **Line 209**: If false → Use `WorkflowManagerV2` (legacy path)
  - **Line 249-252**: If no existing build, continue to new request path

### 5. NEW REQUEST PATH (CRITICAL BUG)
**File**: `lib/alex/orchestrator.ts`
- **Line 258**: **NEW REQUEST CHECK** - `if (isArtifactGeneration && userId && conversationId && !request.skipArtifactDetection)`
- **Line 268-278**: **UNCONDITIONALLY calls `WorkflowManagerV2.processRequest()`**
  - **NO FEATURE FLAG CHECK HERE**
  - **ALWAYS uses legacy path for new requests**
- **Line 277**: `await WorkflowManagerV2.processRequest(workflowRequest)`

### 6. Legacy Workflow Manager (ACTUAL PRIMARY PATH)
**File**: `lib/alex/artifact-generation/workflow-manager-v2.ts`
- **Line 52**: `WorkflowManagerV2.processRequest()` starts
- **Line 78-92**: Check for existing build (already checked above, redundant)
- **Line 94-105**: **Call `IntelligenceAnalyzerV2.analyze()`**
  - **File**: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts`
  - **Line 51**: `IntelligenceAnalyzerV2.analyze()` starts
  - **Line 164-167**: Identify blockers using AI
  - **Line 188-223**: If blockers exist → **Ask question**
  - **Line 189**: `const blocker = Array.from(specState.blockers)[0]`
  - **Line 192**: `await this.formulateQuestion(blocker, specState)`
  - **Line 219**: Return `nextAction: 'ask_question'`

### 7. Current Decision-Maker

**For NEW requests** (most common case):
- **Function**: `IntelligenceAnalyzerV2.identifyBlockers()` at line 592
- **Decision Logic**: Deterministic check `if (specState.blockers.size > 0)`
- **Question Generation**: `formulateQuestion()` at line 192
- **Template-driven**: YES - uses blocker enumeration

**For EXISTING builds** (rare case):
- **Function**: `AIOrchestrator.orchestrate()` (if feature flag true)
- **Decision Logic**: AI-driven via prompt
- **Template-driven**: NO (in theory, but broken by lack of persistence)

### 8. Database Persistence
**File**: `lib/alex/artifact-generation/workflow-manager-v2.ts`
- **Line 118-124**: Create new build via `ArtifactService.createBuild()`
- **Line 127-132**: Store spec with known/blockers tracking
- **Line 132**: `await ArtifactService.updateSpecification(build.id, specWithState, [])`
- **Schema**: Uses rigid `AutomationSpec` with `_knownFields` and `_blockerFields` arrays

### 9. Response Streaming
**File**: `app/api/alex/chat/route.ts`
- **Line 482-532**: Handle `artifact_workflow` event
- **Line 505-507**: Send question data to frontend
- **Line 509-512**: Send architecture proposal if present

### 10. Next User Answer
**File**: `components/alex/AlexChat.tsx`
- **Line 43-49**: Handle question answer
- **Line 48**: Send just the value (natural language, no field:value)
- **Route**: Goes through same `/api/alex/chat` → `WorkflowManagerV2` → `IntelligenceAnalyzerV2` path

### 11. Second Request (with existing build)
**File**: `lib/alex/orchestrator.ts`
- **Line 158**: `ArtifactService.getActiveBuild()` now returns existing build
- **Line 163**: Existing build check succeeds
- **Line 167**: Feature flag check `USE_AI_DRIVEN_ORCHESTRATION`
- **Line 169**: If true → `WorkflowOrchestrator` (AI-driven path)
- **Line 209**: If false → `WorkflowManagerV2` (legacy path)

### 12. Plan Loading (AI-Driven Path)
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
- **Line 84**: `await this.loadCurrentPlan(request.conversationId, request.userId)`
- **Line 323-334**: **`loadCurrentPlan()` implementation**
  - **Line 329**: Check `if (build && build.final_specification)`
  - **Line 332-333**: **TODO comment: "Implement specToPlan for persistence"**
  - **Line 333**: **`return null`** ← **ALWAYS RETURNS NULL**
- **Result**: AI sees "No current automation plan - this is a new request"

### 13. Orchestration Decision (AI-Driven Path)
**File**: `lib/alex/orchestration/ai-orchestrator.ts`
- **Line 37**: `orchestrate()` starts
- **Line 51**: `await this.askAIDecision()`
- **Line 114-120**: Build context (last 5 messages, truncated to 200 chars)
- **Line 122-179**: AI prompt
- **Line 184**: Call `WorkflowAIService.generateResponse()`
- **Line 188**: Parse JSON response
- **Line 71-81**: Check `QuestionTracker.shouldAsk()` if clarify action
- **Line 67-81**: If question prevented → change to 'respond' action

## Summary of Current Decision-Making

### NEW AUTOMATION REQUEST (PRIMARY CASE)
**Path**: `/api/alex/chat` → `AIEngine` → `AlexOrchestrator` → `WorkflowManagerV2` → `IntelligenceAnalyzerV2`
**Decision-maker**: `IntelligenceAnalyzerV2.identifyBlockers()` (deterministic blocker enumeration)
**Feature flag**: NOT CHECKED
**Result**: Template-driven blocker enumeration

### EXISTING BUILD REQUEST (RARE CASE)
**Path**: `/api/alex/chat` → `AIEngine` → `AlexOrchestrator` → `WorkflowOrchestrator` → `AIOrchestrator`
**Decision-maker**: `AIOrchestrator.askAIDecision()` (AI-driven)
**Feature flag**: CHECKED
**Result**: AI-driven but broken (no plan persistence, limited context)

## Critical Bug Identified

**Location**: `lib/alex/orchestrator.ts` lines 258-278

**Issue**: The feature flag `USE_AI_DRIVEN_ORCHESTRATION` is only checked for existing builds. New artifact requests unconditionally use `WorkflowManagerV2.processRequest()`.

**Impact**: The AI-driven orchestrator is never used for new automation requests, which is the primary use case.

## Conclusion

The current implementation is **STILL PARTIALLY TEMPLATE-DRIVEN** because:
1. New requests (most common) use legacy `WorkflowManagerV2` / `IntelligenceAnalyzerV2` path
2. Feature flag does not control the primary execution path
3. Deterministic blocker enumeration controls the decision for new requests
4. AI-driven path is only used for existing builds (rare case)
5. AI-driven path is broken by lack of plan persistence