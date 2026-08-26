# Path 2 Investigation Report

**Date**: 2025-01-XX
**Task**: Investigate ALEX_CONVERSATIONAL_MODE history and Path 2 token exposure
**Status**: INVESTIGATION COMPLETE — NO FIXES IMPLEMENTED

---

## TASK 1 — History of ALEX_CONVERSATIONAL_MODE

### When It Was Introduced

**Commit**: `3e44687` — "Phase B: Implement conversational response path for ALEX"
**Date**: Wed Aug 26 12:35:39 2026 +0100
**Author**: Devin AI

### Commit Message

```
Phase B: Implement conversational response path for ALEX

Add natural language conversation capability while preserving requirement persistence.

Changes:
- Add ALEX_CONVERSATIONAL_MODE feature flag for safe rollout
- Add askAIDecisionConversational() method with natural language prompt
- Remove JSON requirement from conversational path
- Preserve Phase 1-3 requirement extraction and persistence
- Skip forced WorkflowOrchestrator routing when conversational mode enabled
- Accept natural language responses without JSON parsing
- Extract requirements via deterministic patterns (Phase 3)
- Graceful error handling without canned fallbacks

Files modified:
- lib/alex/orchestration/ai-orchestrator.ts (+152 lines)
- lib/alex/orchestration.ts (+14 lines)

Database changes: NONE
Migrations: NONE
TPM impact: NONE (no additional AI calls)

Legacy JSON-forced path preserved when ALEX_CONVERSATIONAL_MODE=false.
```

### Why It Was Added

**Purpose**: To enable natural language conversation capability while preserving requirement persistence. The flag was added for "safe rollout" of the conversational response path.

**Behavior**:
- When `ALEX_CONVERSATIONAL_MODE=true`: Path 1 and Path 2 are disabled, all traffic goes through Path 3 (conversational mode)
- When `ALEX_CONVERSATIONAL_MODE=false`: Legacy JSON-forced path (Path 2) is preserved

### Correlation with Other Changes

**Timeline around the flag introduction** (from git log):

```
Wed Aug 26 12:35:39 2026 — 3e44687 Phase B: Implement conversational response path
Wed Aug 26 12:43:48 2026 — aedf0ec Fix: Remove duplicate enableConversationalMode variable
Wed Aug 26 15:51:49 2026 — a30980c Implement AI lead-scoring workflow generation with conversational requirements
Wed Aug 26 17:02:23 2026 — 089f212 Fix token safety: Move budget enforcement to final request layer
```

**Correlation with Phase 3A.1 data-bridge fix**:
- The data-bridge fix (Phase 3A.1) was part of commit `a30980c` (Aug 26 15:51:49)
- This commit occurred AFTER the conversational mode flag was introduced (Aug 26 12:35:39)
- The commit explicitly states: "Phase B: Add natural-language conversational mode with ALEX_CONVERSATIONAL_MODE flag"
- The data-bridge fix was implemented WITHIN the conversational mode context

**Correlation with token-budgeting fix**:
- The token-budgeting fix (commit `089f212`) occurred AFTER conversational mode introduction
- The token-budgeting fix added final token safety check in WorkflowAIService
- This fix applies to BOTH Path 2 and Path 3 (both use WorkflowAIService)

**Conclusion**: ALEX_CONVERSATIONAL_MODE was introduced BEFORE the Phase 3A.1 data-bridge fix and the token-budgeting fix. The flag was added for safe rollout of conversational mode, and subsequent fixes (data-bridge, token-budgeting) were implemented while the flag was already in place.

---

## TASK 2 — Path 2's Token Exposure

### Path 2 Execution Flow

**Path 2** (orchestrator.ts:225-314) executes as follows:

1. **Orchestrator.ts:225-314**
   - Calls `WorkflowOrchestrator.orchestrateWorkflow()`

2. **WorkflowOrchestrator.orchestrateWorkflow()** (workflow-orchestrator.ts:60-114)
   - Calls `AIOrchestrator.orchestrate()`

3. **AIOrchestrator.orchestrate()** (ai-orchestrator.ts:60-193)
   - Calls `askAIDecision()` (legacy JSON-forced path)
   - Builds prompt with:
     - System instructions (~300 lines of guidelines)
     - Conversation context (last 20 messages, each truncated to 500 chars)
     - Current plan context (serialized as JSON)
     - User message
   - Calls `aiService.generateResponse(prompt)` → WorkflowAIService

4. **WorkflowAIService.generateResponse()** (workflow-ai-service.ts:33-120)
   - Performs final token safety check (6400 budget)
   - Calls `providerManager.executeStreamingWithFallback()`

5. **If AI decision is generate/execute** → `handleGenerate()` (workflow-orchestrator.ts:279-328)
   - Calls `ArchitectureDesigner.design(spec)`

6. **ArchitectureDesigner.design()** (architecture-designer.ts:190-293)
   - Builds compact context via `buildCompactContext(spec)` (lines 119-184)
   - Calls `aiService.generateResponse(prompt)` → WorkflowAIService

### Context Components in Path 2

#### AIOrchestrator.orchestrate() Context

**System Instructions** (ai-orchestrator.ts:196-316):
- ~300 lines of intent detection guidelines
- Action type definitions (respond, clarify, recommend, brainstorm, plan, generate, execute, revise)
- IMPORTANT GUIDELINES section
- P2-A enhanced assumption/recommendation structure guidelines
- JSON format requirements

**Estimated size**: ~3,000-4,000 characters (~750-1,000 tokens)

**Conversation Context** (ai-orchestrator.ts:222-236):
- Last 20 messages from conversation history
- Each message truncated to 500 characters
- Maximum: 20 × 500 = 10,000 characters

**Estimated size**: ~2,000-10,000 characters (~500-2,500 tokens) depending on history

**Plan Context** (ai-orchestrator.ts:215-221):
- Current automation plan serialized as JSON
- Includes: objective, platform, trigger, inputs, outputs, stages, assumptions, recommendations

**Estimated size**: ~1,000-5,000 characters (~250-1,250 tokens) depending on plan complexity

**User Message**:
- Current user message

**Estimated size**: ~50-500 characters (~12-125 tokens)

#### ArchitectureDesigner.design() Context

**Compact Context** (architecture-designer.ts:119-184):
- Requirements (goal, type, domain)
- Known values (trigger, source, platform, AI, email, knowledge base, schedule, human approval)
- Inferred values (branching, logging, credentials)
- Unresolved decisions (blockers)

**Estimated size**: ~200-1,000 characters (~50-250 tokens)

**System Instructions** (architecture-designer.ts:200-238):
- Task description
- JSON format requirements
- Field definitions for architecture object
- Important guidelines

**Estimated size**: ~1,000-1,500 characters (~250-375 tokens)

### Path 2 vs Path 3 Context Comparison

| Component | Path 2 (AI-Driven) | Path 3 (Conversational) | Difference |
|-----------|-------------------|------------------------|------------|
| System Instructions | ~3,000-4,000 chars (JSON-forced) | ~500-1,000 chars (natural language) | Path 2 larger |
| Conversation History | Up to 20 messages × 500 chars | Up to 20 messages × 500 chars | Same |
| Plan Context | Serialized JSON plan | Plan embedded in natural language | Path 2 more structured |
| Architecture Context | Compact structured spec | Not applicable | Path 2 only |
| Total Estimated Size | ~5,000-15,000 chars | ~1,000-5,000 chars | Path 2 larger |

### Token Budgeting in Path 2

**WorkflowAIService Token Safety Check** (workflow-ai-service.ts:38-66):
- Enforces 6400 token budget (80% of 8000 TPM limit)
- Applied at final request layer
- Truncates prompt if exceeds budget
- Applied to BOTH AIOrchestrator call AND ArchitectureDesigner call

**Estimated Token Exposure**:
- AIOrchestrator call: ~1,250-3,875 tokens (before budgeting)
- ArchitectureDesigner call: ~300-625 tokens (before budgeting)
- After budgeting: Both calls limited to 6400 tokens

### Key Differences from Path 3

1. **Response Format**: Path 2 uses JSON-forced responses, Path 3 uses natural language
2. **System Instructions**: Path 2 has extensive JSON format guidelines, Path 3 has simple natural language instructions
3. **Plan Context**: Path 2 serializes plan as JSON, Path 3 embeds plan in natural language
4. **Architecture Call**: Path 2 calls ArchitectureDesigner with structured spec, Path 3 never calls ArchitectureDesigner
5. **Total Size**: Path 2 has larger context due to JSON format requirements and architecture call

---

## TASK 3 — Safe Test Plan

### Test Objective

Test Path 2 in isolation with diagnostic logging to determine actual token exposure and confirm whether the 8,410-token error originates from Path 2.

### Test Approach

**Branch Creation**:
```bash
git checkout -b test-path-2-token-exposure
```

**Local Override**:
- Set `ALEX_CONVERSATIONAL_MODE=false` in local `.env.local` (NOT in production)
- Do NOT commit this change
- This forces Path 2 for local testing only

**Diagnostic Logging**:
- The existing diagnostic logging (commit 40d851b) in `openai-compatible-adapter.ts` will capture Path 2's Groq calls
- The logging is at the adapter layer, so it applies to ALL provider calls regardless of path
- NO extension needed for ArchitectureDesigner — it uses WorkflowAIService which uses the same adapter

**Test Execution**:
1. Start local development server with `ALEX_CONVERSATIONAL_MODE=false`
2. Navigate to local environment (http://localhost:3000)
3. Send test message: "I want an automation for job applications"
4. Capture diagnostic logs from console
5. Analyze request payloads and token counts

**Verification**:
- Confirm diagnostic logging fires for both AIOrchestrator call AND ArchitectureDesigner call
- Compare actual token counts with estimates
- Identify which call (if any) exceeds the 6400 budget
- Determine if the 8,410-token error originates from Path 2

### Safety Measures

1. **Branch Isolation**: Test on separate branch, do not merge to main
2. **Local Only**: Override `ALEX_CONVERSATIONAL_MODE` only in local `.env.local`, do not commit
3. **No Production Impact**: Do not deploy test branch to production
4. **Revert After Test**: Delete branch after test, do not merge
5. **Diagnostic Logging Only**: Do not modify any business logic or token budgeting

### Expected Diagnostic Output

The diagnostic logging will capture:
- Request ID for each call
- Timestamp for each call
- Full request body for each call
- Message count, tool count
- Request length/bytes
- This will allow comparison between:
  - AIOrchestrator call token count
  - ArchitectureDesigner call token count
  - Total token exposure for Path 2

### Test Completion Criteria

Test is complete when:
1. Diagnostic logs are captured for both AIOrchestrator and ArchitectureDesigner calls
2. Actual token counts are measured for each call
3. Comparison with estimates is documented
4. Determination is made about whether Path 2 is the source of the 8,410-token error

---

## SUMMARY

### ALEX_CONVERSATIONAL_MODE History
- Introduced in commit `3e44687` (Aug 26 12:35:39) for safe rollout of conversational mode
- Added BEFORE Phase 3A.1 data-bridge fix and token-budgeting fix
- Purpose: Enable natural language conversation while preserving requirement persistence
- When true: Disables Path 1 and Path 2, forces all traffic through Path 3 (dead end)

### Path 2 Token Exposure
- AIOrchestrator call: ~1,250-3,875 tokens (extensive JSON guidelines, conversation history, serialized plan)
- ArchitectureDesigner call: ~300-625 tokens (compact spec context, architecture guidelines)
- Total: ~1,550-4,500 tokens before budgeting
- After budgeting: Both calls limited to 6400 tokens
- Larger than Path 3 due to JSON format requirements and architecture call

### Safe Test Plan
- Create branch `test-path-2-token-exposure`
- Set `ALEX_CONVERSATIONAL_MODE=false` in local `.env.local` only
- Existing diagnostic logging (commit 40d851b) will capture Path 2 calls
- Test with "I want an automation for job applications"
- Analyze diagnostic logs to determine actual token exposure
- Revert branch after test, do not merge

---

## STATUS

**INVESTIGATION COMPLETE — NO FIXES IMPLEMENTED**

This report documents the history of ALEX_CONVERSATIONAL_MODE, the token exposure of Path 2, and a safe test plan for Path 2 isolation testing. No code changes have been made.

Generated with Devin (https://devin.ai)
