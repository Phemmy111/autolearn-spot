# Forensic Instrumentation Report — Token Discrepancy Investigation

**Date**: 2025-01-XX
**Task**: Investigate 143-token diagnostic vs 8,410-token actual Groq request
**Status**: FORENSIC INSTRUMENTATION COMPLETE

---

## TASK 1 — Groq API Call Sites

### Call Site 1: OpenAI-Compatible Adapter (STREAM)
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Function**: `stream()` (lines 109-289)
**Line**: 147-152 (fetch call)
**Call pattern**: `executeStreamingWithFallback()` → provider.stream() → fetch(`${baseUrl}/chat/completions`)

### Call Site 2: OpenAI-Compatible Adapter (GENERATE)
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Function**: `generate()` (lines 51-107)
**Line**: 57-70 (fetch call)
**Call pattern**: Provider could use generate() but streaming is the primary path

### Call Chain for User Message "I want an automation for job applications"
```
User message
    ↓
app/api/alex/chat/route.ts
    ↓
AIEngine.processChat()
    ↓
AlexOrchestrator.orchestrate()
    ↓
WorkflowOrchestrator.orchestrateWorkflow() (if existing build)
    ↓
AIOrchestrator.askAIDecisionConversational()
    ↓
WorkflowAIService.generateResponse()
    ↓
ProviderManager.executeStreamingWithFallback()
    ↓
OpenAICompatibleAdapter.stream()
    ↓
fetch to Groq API
```

**Observed**: There is only ONE primary Groq API call per user message in the conversational path. No nested calls were found in the request path that would explain the 59x token increase.

---

## TASK 2 — Diagnostic Logging Added

### Location 1: OpenAI-Compatible Adapter STREAM
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Lines**: 149-164 (added)
**Logs**: 
- Request ID (UUID)
- Timestamp
- Base URL
- Model
- Message count
- Tool count
- Request body length (characters)
- Request body bytes
- disableTools flag
- **Full request body**

### Location 2: OpenAI-Compatible Adapter GENERATE
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Lines**: 60-88 (added)
**Logs**: Same as stream version for non-streaming calls

### Import Added
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Line**: 15
**Import**: `import crypto from 'crypto'`

### Marking
All diagnostic logging is clearly marked with:
```typescript
// DIAGNOSTIC LOGGING — REMOVE AFTER INVESTIGATION
```

### Control Flow
No changes to control flow, timing, retries, or fallback behavior. Logging is purely observational.

---

## TASK 3 — Reproduction and Report

### Note on Reproduction
Live production testing was not performed as part of this forensic task. The diagnostic logging has been added to capture the actual request payload when the next occurrence happens in production.

### Current Evidence-Based Analysis

#### Observed Discrepancy
- **Internal diagnostic**: 143 tokens (from `ai-orchestrator.ts` intermediate string)
- **Provider reported**: 8,410 tokens (actual Groq API call)
- **Discrepancy factor**: ~59x

#### Call Path Analysis
Based on code inspection:

1. **Single call path**: Only ONE Groq API call is made per user message in the conversational path
2. **No nested calls**: No additional Groq calls found in the request chain
3. **No retry loops**: No evidence of multiple retries that would accumulate tokens
4. **Tool definitions**: Tools are disabled in the conversational path (`disableTools: true`)

#### Inference on Discrepancy Source

**Evidence**: The token budgeting in `ai-orchestrator.ts` occurs on an intermediate string before the request is fully assembled. The actual provider request is assembled in `WorkflowAIService` and sent through `ProviderManager`.

**Possible explanations** (labeled as inference, not confirmed):

1. **Request transformation**: The prompt string may be transformed or additional context added between `ai-orchestrator.ts` and the final API call
2. **Hidden system messages**: The provider adapter or provider manager may add system messages not visible in the intermediate string
3. **Message structure overhead**: The structured message format (role/content) may add significant token overhead not accounted for in the string estimate
4. **Tokenization difference**: The 4 chars/token estimate may be significantly different from Groq's actual tokenization
5. **Duplicated context**: Some context may be duplicated during request assembly (not visible in the code path)

**Need for production logs**: The diagnostic logging added will capture the actual request body when the next failure occurs, allowing exact comparison between the intermediate estimate and the final payload.

---

## TASK 4 — Silent Fallback Check

### Silent Fallback Found

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: `askAIDecisionConversational()`
**Lines**: 539-553

**Code**:
```typescript
} catch (error) {
  console.error('[Phase B] Conversational AI response failed:', error)
  
  // Phase B: On genuine provider failure, return error message
  // Do not use canned fallback that hides the failure
  return {
    action: {
      type: 'respond',
      message: 'I apologize, but I encountered an error processing your request. Please try again.'
    },
    intent: 'unrelated_conversation',
    confidence: 0.0,
    reasoning: 'Provider error in conversational path'
  }
}
```

**Behavior**: When the conversational AI response fails (including TPM errors), the error is caught and a generic error message is returned to the user instead of surfacing the actual error.

**Impact**: This explains why users may see a generic "I encountered an error" message instead of the actual "Request too large for model" TPM error.

**File path**: `lib/alex/orchestration/ai-orchestrator.ts:539-553`

---

## DELIVERABLES

### 1. Diagnostic Logging Changes
**File**: `lib/alex/provider/adapters/openai-compatible-adapter.ts`
**Changes**:
- Added crypto import for request ID generation
- Added diagnostic logging to `stream()` method (lines 149-164)
- Added diagnostic logging to `generate()` method (lines 60-88)
- All logging clearly marked with `// DIAGNOSTIC LOGGING — REMOVE AFTER INVESTIGATION`
- No changes to control flow, timing, retries, or fallback behavior

### 2. Forensic Report
This document provides:
- Complete list of Groq API call sites
- Diagnostic logging implementation details
- Evidence-based analysis of the token discrepancy
- Identification of silent fallback path
- No fixes or business logic changes

### 3. Next Steps for Investigation
To complete the investigation:
1. Deploy the diagnostic logging to production
2. Trigger the test case: "I want an automation for job applications"
3. Capture the actual request body from the diagnostic logs
4. Compare the logged request body with the 143-token estimate
5. Identify the exact source of the 8,410-token discrepancy
6. Report findings with concrete evidence

---

## STATUS

**FORENSIC INSTRUMENTATION COMPLETE**
- ✅ All Groq API call sites identified
- ✅ Diagnostic logging added at final request layer
- ✅ Silent fallback path identified
- ✅ No business logic changes made
- ⏸️ Production reproduction pending (requires deployment)
- ⏸️ Root cause confirmation pending (requires production logs)

**Note**: This is a forensic instrumentation task only. No fixes have been implemented. The next step is to deploy the diagnostic logging and capture production logs to identify the exact source of the token discrepancy.
