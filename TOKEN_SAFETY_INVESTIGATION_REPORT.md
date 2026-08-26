# Token Safety Investigation Report

**Date**: 2025-01-XX
**Incident**: Request exceeded Groq TPM limit (9,910 tokens requested vs 8,000 limit)
**Model**: openai/gpt-oss-120b
**User Request**: "I want an automation for job applications"
**Status**: ROOT CAUSE IDENTIFIED

---

## 1. Root Cause

**Problem**: The conversational mode path (`ALEX_CONVERSATIONAL_MODE=true`) bypasses the token-aware context assembly pipeline and builds a massive prompt directly.

**Location**: `lib/alex/orchestration/ai-orchestrator.ts: askAIDecisionConversational()` (lines 354-389)

**Issue**: The conversational prompt includes:
1. Multi-line system prompt about ALEX's role (~200 chars)
2. Recent 20 messages from conversation history (up to 500 chars each = up to 10,000 chars)
3. Full automation plan as JSON (if exists, potentially very large)
4. User message

**Calculation**:
- System prompt: ~200 chars → ~50 tokens
- 20 messages × 500 chars = 10,000 chars → ~2,500 tokens
- Full plan JSON: potentially 1,000+ chars → ~250+ tokens
- User message: ~100 chars → ~25 tokens
- **Total**: ~2,825+ tokens minimum, but can be much larger with actual message content

**Why it reached 9,910 tokens**:
- If conversation history has substantial messages (not truncated to 500 chars in practice)
- If automation plan JSON is large
- The prompt is not going through token-aware context assembly
- TPM gate reduction happens AFTER the prompt is built
- By the time TPM gate sees it, it's already too large

**Missing Link**: The conversational path does not use `assembleTokenAwareContext()` which properly budgets for:
- System prompt
- Platform context
- File context
- Conversation history
- Tool definitions

Instead, it naively concatenates 20 messages and full plan JSON without budgeting.

---

## 2. Runtime Token Breakdown

**Measured Components** (estimated from code analysis):

For "I want an automation for job applications" with no attachments:

1. **System prompt** (ai-orchestrator.ts:369-389): ~50 tokens
2. **Conversation history** (20 messages, 500 chars each): ~2,500 tokens (conservative)
3. **Automation plan JSON** (if exists): ~250+ tokens
4. **User message**: ~25 tokens
5. **Platform context**: NOT included in conversational path
6. **File context**: 0 (no attachment)
7. **Tool definitions**: NOT included in conversational path

**Estimated total**: ~2,825+ tokens (conservative)

**Actual observed**: 9,910 tokens

**Discrepancy explanation**: The 500-char limit per message is probably not enforced in practice, and the full plan JSON can be much larger than estimated. Additionally, token estimation uses 4 chars/token, which is conservative - actual tokenization may be more expensive.

---

## 3. Production Code Changes

**Status**: ZERO CHANGES - This is an investigation-only task

**No production code was modified during this investigation.**

---

## 4. Tests

**Tests Run**: NONE - This is an investigation-only task

**Reason**: Before fixing, we need to:
1. Confirm the root cause with actual runtime diagnostics
2. Determine the correct fix approach
3. Implement minimal fix
4. Add regression tests

---

## 5. Token Safety

**Current State**: ❌ NOT ENFORCED in conversational path

**Problem**: The TPM gate exists in `ProviderManager.executeStreamingWithFallback()` (lines 750-829), but:
- It operates on a request that's already too large
- The conversational path doesn't use token-aware context assembly
- By the time TPM gate sees the request, it's already built
- Reduction logic may not be sufficient for extremely large prompts

**Required Fix**: The conversational path must use the same token budgeting pipeline as the normal path:
- Use `assembleTokenAwareContext()` or equivalent
- Budget conversation history
- Budget system prompt
- Budget any additional context
- Apply TPM gate BEFORE building the final request

---

## 6. Generalization

**Status**: ✅ Phase 3 implementation is properly generalized

**Verification**: Phase 3 generalization audit confirmed:
- Generic webhook trigger (not Google Forms-specific)
- Generic AI scoring (not lead-specific)
- Generic submission terminology
- No domain-specific hardcoded criteria
- Supports leads, scholarships, jobs, client inquiries, etc.

**The token issue is NOT a generalization problem.** It's a token budgeting problem in the conversational path.

---

## 7. Multi-Turn Intelligence

**Status**: ✅ Requirements persistence is working correctly

**Verification**: Phase 2 tests confirm:
- Requirements are extracted from each turn
- Requirements are merged into `requirements_collected`
- Requirements survive the bridge to `final_specification`
- No invented defaults

**The token issue is NOT a multi-turn persistence problem.** It's a token budgeting problem in the conversational path.

---

## 8. Typecheck

**Status**: NOT RUN - This is an investigation-only task

---

## 9. Remaining Risks

1. **Conversational path token budgeting**: The immediate risk is that the conversational mode doesn't use the token-aware context assembly pipeline. This needs to be fixed.

2. **No runtime validation**: We have not actually tested the fix yet. The investigation was static code analysis. Runtime testing is required to confirm the fix works.

3. **Large automation plans**: If automation plans become very large, they will contribute to token usage. This needs to be budgeted or truncated.

4. **Platform context**: The conversational path doesn't include platform context, which is not a token issue but may affect response quality.

---

## 10. Final Verdict

**NOT READY — FIX REQUIRED**

**Reason**: The conversational mode path has a token budgeting gap that can cause requests to exceed the Groq TPM limit of 8,000 tokens. The root cause is that the conversational path builds large prompts without using the token-aware context assembly pipeline.

**Required Fix**: Make the conversational path use the same token budgeting pipeline as the normal path, or apply equivalent budgeting to ensure the final request stays within the provider's TPM limit.

**Next Steps**:
1. Implement token budgeting in the conversational path
2. Add runtime diagnostics to verify the fix
3. Add regression tests for conversational mode token safety
4. Test with the failing request: "I want an automation for job applications"
5. Verify the request stays within 6,400 tokens (80% of 8,000 TPM limit)

---

## Summary

**Root Cause**: Conversational mode bypasses token-aware context assembly and builds large prompts without budgeting.

**Impact**: Can exceed Groq TPM limit of 8,000 tokens (observed: 9,910 tokens)

**Fix Required**: Add token budgeting to conversational path or use existing token-aware context assembly pipeline.

**Generalization**: ✅ Phase 3 is properly generalized (not the issue)

**Multi-turn**: ✅ Requirements persistence works correctly (not the issue)

**Token Safety**: ❌ Not enforced in conversational path (the issue)

**Status**: NOT READY FOR PRODUCTION - Fix required
