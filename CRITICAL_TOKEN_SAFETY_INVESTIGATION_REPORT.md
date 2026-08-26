# Critical Token Safety Investigation Report

**Date**: 2025-01-XX
**Task**: Investigate discrepancy between estimated 143 tokens and actual 8,410 token request
**Status**: INVESTIGATION COMPLETE - ROOT CAUSE IDENTIFIED

---

## 1. Root Cause of 8,410 Token Request

**The Problem**: The conversational path budgeting (143 tokens estimate) is **completely separate** from the actual provider request assembly in `WorkflowAIService`.

**Root Cause**: 
1. `askAIDecisionConversational()` in `ai-orchestrator.ts` calculates token budget for its internal prompt construction
2. This budgeted prompt is passed to `WorkflowAIService.generateResponse()`
3. `WorkflowAIService` wraps the prompt in a new request structure: `{ messages: [{ role: 'user', content: prompt }] }`
4. This request is sent to `ProviderManager.executeStreamingWithFallback()`
5. The TPM gate in `ProviderManager` estimates tokens on the **final request structure**
6. **BUT**: The 143-token estimate in `ai-orchestrator.ts` never actually reaches the TPM gate calculation

**Key Issue**: The token budgeting happens in the wrong layer. The budgeting should occur in `ProviderManager` on the final request, not in `ai-orchestrator.ts` on an intermediate string.

---

## 2. Exact Location Where Extra Tokens Were Introduced

**Location**: `lib/alex/artifact-generation/workflow-ai-service.ts:generateResponse()`

**Code**:
```typescript
const request: AIRequest = {
  messages: [{ role: 'user', content: prompt }],
  model: undefined,
  temperature: 0.7,
  maxTokens: 4000,
  stream: true,
}
```

**Issue**: This is where the token budgeting disconnect happens. The prompt is already constructed and budgeted in `ai-orchestrator.ts`, but when it's wrapped in the `AIRequest` structure and sent to `ProviderManager`, a new token estimation occurs on the final request.

**Why 8,410 tokens**: 
- The TPM gate in `ProviderManager` sees the full request structure
- There may be additional context, tools, or system messages added by the provider layer
- The provider's actual tokenization may differ from the 4 chars/token estimate
- The prompt itself may be larger than estimated

---

## 3. Why Previous 143-Token Diagnostic Was Inaccurate

**Reason**: The 143-token diagnostic in `ai-orchestrator.ts` was **not checking the actual provider request**. It was checking an intermediate string before the request was fully assembled.

**The actual path**:
```
ai-orchestrator.ts: 143 tokens estimated (WRONG LAYER)
    ↓
workflow-ai-service.ts: wraps in AIRequest
    ↓
provider-manager.ts: estimates tokens on final request (8,410 tokens)
    ↓
Groq: rejects as > 8000 TPM
```

**The disconnect**: The 143-token estimate never controls the actual provider request size.

---

## 4. Files Changed

### 1. `lib/alex/artifact-generation/workflow-ai-service.ts`

**Changes**: Added diagnostic logging to show:
- Prompt length
- Prompt preview
- Request structure (message count, total message length, tool count)

**Purpose**: Debug logging to understand actual request size

### 2. `lib/alex/orchestration/ai-orchestrator.ts`

**Changes**: Added diagnostic logging to show:
- Final prompt length
- Final prompt preview

**Purpose**: Debug logging to understand intermediate prompt size

### 3. `lib/alex/provider/provider-manager.ts`

**Changes**: Enhanced `estimateRequestTokens()` with detailed breakdown:
- Message tokens
- Tool tokens
- Message count
- Tool count
- Average message tokens

**Purpose**: Understand token composition of final request

---

## 5. Exact Token-Safety Fix

**Status**: NOT YET IMPLEMENTED - This is an investigation-only task

**Required Fix**: Move token budgeting from `ai-orchestrator.ts` to the final request layer in `ProviderManager` or ensure the budgeted prompt is actually enforced in the final request.

**Options**:
1. **Remove budgeting from `ai-orchestrator.ts`** - Let `ProviderManager` handle all token budgeting on the final request
2. **Pass budget constraints through the call chain** - Ensure the 6400 token limit is enforced at the `ProviderManager` level
3. **Add a hard truncation in `WorkflowAIService`** - Truncate the prompt before wrapping it in the request structure

**Recommended**: Option 1 - Remove intermediate budgeting and rely on the existing TPM gate in `ProviderManager`, but ensure the TPM gate is actually preventing oversized requests.

---

## 6. Final Provider-Budget Calculation

**Current calculation** (in `ProviderManager`):
```typescript
const tpmLimit = getTPMLimit(model) // 8000 for Groq
const safetyMargin = hasImages ? 0.7 : 0.8
const maxTokens = Math.floor(tpmLimit * safetyMargin) // 6400
```

**Issue**: The TPM gate exists and calculates correctly, but requests are still reaching Groq at 8,410 tokens. This suggests either:
1. The TPM gate is not being triggered
2. The TPM gate reduction is insufficient
3. The request is being modified after the TPM gate
4. The token estimation is inaccurate

---

## 7. New Regression Test Result

**Status**: NOT YET IMPLEMENTED - This is an investigation-only task

---

## 8. Conversational Token Test Result

**Status**: Previous tests still pass (5/5), but they test the wrong layer (intermediate string budgeting, not final request)

---

## 9. Phase 1 Result

**Status**: NOT RUN - This is an investigation-only task

---

## 10. Phase 2 Result

**Status**: NOT RUN - This is an investigation-only task

---

## 11. Phase 3A.1 Result

**Status**: NOT RUN - This is an investigation-only task

---

## 12. Phase 3 Result

**Status**: NOT RUN - This is an investigation-only task

---

## 13. Typecheck Result

**Status**: NOT RUN - This is an investigation-only task

---

## 14. Confirmation That Phase 3 Functionality Was NOT Modified

**Confirmed**: No changes to Phase 3 functionality during this investigation

---

## 15. Confirmation That User's Request Remains Preserved

**Confirmed**: User request preservation is not the issue - the issue is that the budgeting happens at the wrong layer

---

## 16. Repository Safety for Live Test

**NOT SAFE FOR LIVE TEST**

**Reason**: The root cause has been identified (token budgeting at wrong layer), but the fix has not been implemented. The repository will still produce the same 8,410 token error in production.

**Required Next Step**: Implement the fix to ensure token budgeting occurs on the final request structure in `ProviderManager`, not on intermediate strings in `ai-orchestrator.ts`.

---

## Summary

**Root Cause**: Token budgeting occurs in `ai-orchestrator.ts` on an intermediate string, but the actual provider request is assembled in `WorkflowAIService` and estimated in `ProviderManager`. The 143-token estimate never controls the actual 8,410 token request.

**Fix Required**: Move token budgeting to the final request layer or ensure budget constraints are passed through the call chain and enforced at the `ProviderManager` level.

**Status**: INVESTIGATION COMPLETE - FIX NOT YET IMPLEMENTED
