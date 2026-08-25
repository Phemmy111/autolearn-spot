# ALEX AI Orchestration Verification Report

## Executive Verdict

**STILL PARTIALLY TEMPLATE-DRIVEN**

The AI-driven orchestration layer has been implemented but contains critical architectural gaps that prevent it from functioning as a true AI automation expert. While the infrastructure exists, several implementation failures mean the LLM does not actually control orchestration decisions in practice.

---

## 1. Feature Flag Verification

### Where `USE_AI_DRIVEN_ORCHESTRATION` is Read

**Location**: `lib/alex/orchestrator.ts` line 167

```typescript
const useAIDrivenOrchestration = process.env.USE_AI_DRIVEN_ORCHESTRATION !== 'false'
```

### Actual Runtime Path Analysis

#### Path 1: Existing Build (AI-Driven Route)
**When**: An active artifact build exists for the conversation

**Execution Flow**:
```
User Message
  ↓
orchestrator.ts:155 - Check for existing build
  ↓
orchestrator.ts:167 - Read feature flag
  ↓
IF useAIDrivenOrchestration === true:
  ↓
orchestrator.ts:171 - Get WorkflowOrchestrator instance
  ↓
orchestrator.ts:181 - Call workflowOrchestrator.orchestrateWorkflow()
  ↓
workflow-orchestrator.ts:62 - orchestrateWorkflow()
  ↓
workflow-orchestrator.ts:87 - Call aiOrchestrator.orchestrate()
  ↓
ai-orchestrator.ts:37 - orchestrate()
  ↓
ai-orchestrator.ts:51 - Call askAIDecision()
  ↓
ai-orchestrator.ts:114 - Build conversation context (last 5 messages)
  ↓
ai-orchestrator.ts:184 - Call WorkflowAIService.generateResponse() with AI prompt
  ↓
ai-orchestrator.ts:188 - Parse JSON response
  ↓
ai-orchestrator.ts:71 - Check QuestionTracker.shouldAsk() if clarify action
  ↓
ai-orchestrator.ts:93 - Return OrchestrationResult
  ↓
workflow-orchestrator.ts:110 - handleOrchestrationResult()
  ↓
workflow-orchestrator.ts:122 - Switch on action type
  ↓
[appropriate handler]
```

#### Path 2: New Artifact Request (LEGACY ROUTE)
**When**: No existing build exists AND intent detector flags artifact generation

**Execution Flow**:
```
User Message
  ↓
orchestrator.ts:136 - isArtifactGeneration = false (no new request check)
  ↓
orchestrator.ts:155 - Check for existing build (returns null)
  ↓
orchestrator.ts:258 - Check isArtifactGeneration AND userId AND conversationId
  ↓
IF isArtifactGeneration === true:
  ↓
orchestrator.ts:278 - Call WorkflowManagerV2.processRequest() ← ALWAYS LEGACY
  ↓
workflow-manager-v2.ts:101 - Call IntelligenceAnalyzerV2.analyze()
  ↓
intelligence-analyzer-v2.ts:164 - Identify blockers using AI
  ↓
intelligence-analyzer-v2.ts:188 - If blockers.size > 0
  ↓
intelligence-analyzer-v2.ts:189 - Get first blocker
  ↓
intelligence-analyzer-v2.ts:192 - Formulate question
  ↓
intelligence-analyzer-v2.ts:219 - Return nextAction: 'ask_question'
```

### Critical Finding

**The feature flag only controls the EXISTING BUILD path. The NEW ARTIFACT path ALWAYS uses the legacy WorkflowManagerV2 regardless of the feature flag.**

**Location**: `lib/alex/orchestrator.ts` lines 258-278

The new artifact request path (lines 258-278) does NOT check the feature flag. It unconditionally calls `WorkflowManagerV2.processRequest()`.

**Impact**: For a completely new automation request (the most common case), the AI-driven orchestrator is NEVER used.

---

## 2. Old Failure Case Trace

### Scenario: `create a lead capture bot` → `form submission` → `n8n` → `form` → `Email`

#### Trace Through AI-Driven Path (Existing Build)

**Turn 1**: `create a lead capture bot`
- No existing build → Uses legacy path (see finding above)
- Uses IntelligenceAnalyzerV2 with blocker system
- Asks deterministic questions based on blockers

**Turn 2+:** With existing build
- Existing build check succeeds
- Feature flag checked (assuming true)
- Uses WorkflowOrchestrator
- Calls AIOrchestrator.orchestrate()

**Critical Question**: Can AIOrchestrator produce `outputs.destination` loop?

**Analysis**:

1. **QuestionTracker Storage**: `lib/alex/orchestration/question-tracker.ts` line 18
   ```typescript
   private askedQuestions: Map<string, QuestionRecord>;
   ```
   - **Storage**: In-memory Map
   - **Persistence**: NONE
   - **Survives request/response cycle**: NO
   - **Survives page reload**: NO
   - **Survives serverless boundaries**: NO

2. **QuestionTracker Lifecycle**: `lib/alex/orchestration/ai-orchestrator.ts` line 22-24
   ```typescript
   private constructor() {
     this.questionTracker = new QuestionTracker()
   }
   ```
   - **Singleton pattern**: YES
   - **Process-scoped**: YES
   - **Cross-request persistence**: NO (unless same process instance)

3. **QuestionTracker Clearing**: `lib/alex/orchestration/ai-orchestrator.ts` line 48
   ```typescript
   this.questionTracker.clearOldQuestions()
   ```
   - **Cleared every orchestration call**
   - **Old questions (>1 hour) removed**
   - **No database persistence**

4. **Question Prevention Logic**: `lib/alex/orchestration/ai-orchestrator.ts` lines 67-81
   ```typescript
   if (aiDecision.action.type === 'clarify') {
     const question = aiDecision.action.question
     const contextStr = aiDecision.action.reason || 'general'
     
     if (this.questionTracker.shouldAsk(question, contextStr)) {
       this.questionTracker.recordQuestion(question, contextStr)
     } else {
       // Fallback to respond instead
       aiDecision.action = {
         type: 'respond',
         message: "I think we've already discussed that. Let me proceed with what we have."
       }
     }
   }
   ```

5. **AI Prompt Context**: `lib/alex/orchestration/ai-orchestrator.ts` lines 114-120
   ```typescript
   const recentMessages = context.messages.slice(-5).map(m => 
     `${m.role}: ${m.content.substring(0, 200)}`
   ).join('\n')
   
   const planContext = currentPlan 
     ? `\nCurrent automation plan:\n${JSON.stringify(currentPlan, null, 2)}`
     : '\nNo current automation plan - this is a new request'
   ```

**Critical Finding**: `currentPlan` is ALWAYS `null` because:

**Location**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 323-334
```typescript
private async loadCurrentPlan(
  conversationId: string,
  userId: string
): Promise<AutomationPlan | null> {
  try {
    const build = await ArtifactService.getActiveBuild(conversationId, userId)
    if (build && build.final_specification) {
      // Try to extract plan from spec (reverse of planToSpec)
      // For now, return null and let AI create new plan
      // TODO: Implement specToPlan for persistence
      return null  // ← ALWAYS RETURNS NULL
    }
    return null
  } catch (error) {
    console.error('[Workflow Orchestrator] Failed to load plan:', error)
    return null
  }
}
```

**Result**: The AI ALWAYS sees "No current automation plan - this is a new request" in the prompt.

**Old Loop Still Possible**: YES, because:
1. AI never sees previous plan state
2. AI never sees previously asked questions (only last 5 messages)
3. QuestionTracker is in-memory only
4. No plan persistence means every request looks like a new request
5. AI can ask the same question again because it has no memory of previous questions

---

## 3. AI Decision Authority Analysis

### Can ALEX Decide Not to Ask?

**Code Location**: `lib/alex/orchestration/ai-orchestrator.ts` lines 122-179

**AI Prompt**:
```
Determine:
1. What is the user's intent? (new_automation, revise_automation, answer_question, clarification, brainstorm_request, recommendation_request, unrelated_conversation, confirmation, cancellation)
2. What should ALEX do next? (respond, clarify, recommend, brainstorm, plan, generate, execute, revise)
3. What is your confidence in this decision? (0-1)
4. What is your reasoning?
```

**Decision Types Available**:
- respond
- clarify
- recommend
- brainstorm
- plan
- generate
- execute
- revise

**Deterministic Code Override**: None in AI-driven path

**Fallback Logic**: `lib/alex/orchestration/ai-orchestrator.ts` lines 267-299
```typescript
private getFallbackDecision(userMessage: string, currentPlan: AutomationPlan | null): OrchestrationResult {
  // Fallback when AI fails
  // Still uses AI-driven action types
}
```

**Finding**: In the AI-driven path, the LLM does control the decision. However, the decision is undermined by:
1. No plan persistence (AI always sees "new request")
2. No question persistence (QuestionTracker is in-memory only)
3. Limited context (only last 5 messages, truncated to 200 chars each)

---

## 4. Natural Language Reasoning Verification

### Schema Name Exposure

**Frontend**: `components/alex/AlexChat.tsx` lines 43-49
```typescript
const handleQuestionAnswer = (event: CustomEvent) => {
  const { field, value } = event.detail
  console.log('[AlexChat] Question answered:', { field, value })
  // Send just the value as natural language - AI will handle mapping
  // The field context is preserved in the backend conversation state
  sendMessage(value)  // ← CORRECT: Only sends value
}
```

**Backend AI Path**: No schema names exposed to user

**Backend Legacy Path**: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts`
- Uses internal field names like `outputs.destinations`, `inputs.sources`
- Question context includes field names
- Answer mapping uses field context

**Finding**: Natural language is supported in AI-driven path, but AI-driven path is rarely used (see Finding #1).

---

## 5. Recommendation Behavior Verification

### Can ALEX Recommend Platforms?

**AI Prompt**: `lib/alex/orchestration/ai-orchestrator.ts` lines 149-156
```
IMPORTANT GUIDELINES:
- DO recommend platforms with reasoning, don't just ask "which platform?"
```

**Action Type**: `recommend` exists in types

**Deterministic Platform Options**: 
- Used in legacy IntelligenceAnalyzerV2 path
- Not used in AI-driven path

**Finding**: AI-driven path supports recommendations, but:
1. Platform recommendation logic is AI-determined
2. No deterministic option lists override AI in AI-driven path
3. However, AI-driven path is rarely used

---

## 6. Brainstorming Verification

### Can ALEX Brainstorm?

**Action Type**: `brainstorm` exists in types

**AI Prompt**: Includes brainstorm guidance

**Handler**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 153-163
```typescript
case 'brainstorm':
  return {
    status: 'collecting_requirements',
    message: action.message,
    needsInput: true,
    question: {
      text: action.ideas?.join('\n') || '',
      reason: 'Here are some ideas to consider',
      options: action.ideas
    }
  }
```

**Finding**: Brainstorming is supported in AI-driven path, but again, AI-driven path is rarely used.

---

## 7. New Request Isolation Verification

### How AIOrchestrator Distinguishes New vs Revision

**Intent Detection**: AI-determined via prompt

**Plan Comparison**: Impossible because `loadCurrentPlan()` always returns `null`

**AI Prompt**: `lib/alex/orchestration/ai-orchestrator.ts` lines 132-156
```
IMPORTANT GUIDELINES:
- DO detect if this is a new automation request vs a revision
```

**Finding**: New request detection is AI-determined, but:
1. AI has no previous plan to compare against
2. AI only sees last 5 messages (truncated)
3. No robust signal for "forget that, start over"
4. Relies entirely on AI inference without structural support

**Weakness**: Without plan persistence, the AI cannot reliably distinguish between:
- Continuing the current automation
- Revising the current automation
- Starting a completely new automation

---

## 8. Plan Evolution Verification

### AutomationPlan Structure

**Location**: `lib/alex/orchestration/types.ts` lines 57-130

**Sparseness**: All fields are optional (marked with `?`)

**Evolution Support**: 
- Fields can be added/removed
- Plan can be revised
- Status tracking exists

**Critical Gap**: Plan persistence is not implemented

**Location**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 332-333
```typescript
// TODO: Implement specToPlan for persistence
return null
```

**Hidden Conversion**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 263-318
```typescript
private planToSpec(plan: AutomationPlan): AutomationSpec {
  // Converts new plan format to legacy spec format
  // Reconstruction of rigid schema
}
```

**Finding**: 
- Plan is sparse in memory
- But converted to rigid AutomationSpec for persistence
- No reverse conversion (specToPlan) exists
- Plan cannot be loaded from database
- Plan cannot evolve across requests

---

## 9. Conversation History Verification

### Context Assembly

**Location**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 72-81
```typescript
const context: ConversationContext = {
  conversationId: request.conversationId,
  userId: request.userId,
  messages: request.conversationHistory.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date().toISOString()
  })),
  mode: request.mode as any
}
```

**AI Context**: `lib/alex/orchestration/ai-orchestrator.ts` lines 114-120
```typescript
const recentMessages = context.messages.slice(-5).map(m => 
  `${m.role}: ${m.content.substring(0, 200)}`
).join('\n')
```

**Finding**:
- AI receives last 5 messages only
- Each message truncated to 200 characters
- Total context ≈ 1000 characters
- No full conversation history
- No plan context (always null)

**Impact**: With this limited context, the LLM cannot:
- Remember details from earlier in the conversation
- Understand the full context of the automation
- Make informed decisions about revisions
- Detect subtle intent changes

---

## 10. QuestionTracker Analysis

### Storage

**Location**: `lib/alex/orchestration/question-tracker.ts` line 18
```typescript
private askedQuestions: Map<string, QuestionRecord>;
```

**Persistence**: NONE (in-memory Map)

### Lifecycle

**Initialization**: Singleton instance per process

**Clearing**: Every orchestration call clears old questions (>1 hour)

### Serverless/Runtime Behavior

**In-memory only**: Does not survive:
- Request/response cycles (unless same process)
- Page reloads
- Serverless function boundaries
- Process restarts

### Production Failure Mode

In a serverless environment (Vercel/Netlify):
- Each request may run in a different process
- QuestionTracker would be empty on every request
- No cross-request question tracking
- Repeated questions will occur

### Authoritativeness

**Before AI question**: `shouldAsk()` is checked
- If returns false, action changed to 'respond'
- Advisory but enforced

**After AI question**: `recordQuestion()` called
- Records question for future prevention

**Critical Finding**: QuestionTracker is advisory only in AI-driven path, but fundamentally broken in production due to lack of persistence.

---

## 11. AI Decision Contract Verification

### Structured Output Schema

**Location**: `lib/alex/orchestration/ai-orchestrator.ts` lines 159-176

**Required Fields**:
- `intent`
- `action.type`

**Optional Fields**:
- `action.message`
- `action.question`
- `action.reason`
- `action.options`
- `action.recommendations`
- `action.ideas`
- `action.plan`
- `action.confirmationRequired`
- `updatedPlan`
- `confidence`
- `reasoning`

### Validation

**Location**: `lib/alex/orchestration/ai-orchestrator.ts` lines 214-262

**Fallback**: Lines 267-299
- Default to 'clarify' for new requests
- Default to 'respond' for existing plan

### Override

**Deterministic code override**: None in AI-driven path

**Finding**: AI controls orchestration decisions in AI-driven path, but the path is rarely used and lacks necessary context.

---

## 12. "Vast LLM" Claim Analysis

### NOW POSSIBLE

1. **AI decision-making** (in AI-driven path only)
   - LLM decides action type
   - LLM decides when to ask questions
   - LLM provides reasoning

2. **Natural language interface** (in AI-driven path only)
   - No field:value requirement
   - AI handles mapping

3. **Recommendations** (in AI-driven path only)
   - Platform recommendations with reasoning
   - Approach recommendations

4. **Brainstorming** (in AI-driven path only)
   - Idea generation
   - Alternative suggestions

5. **Plan revision** (in AI-driven path only)
   - Plan can be updated
   - Requirements can be changed

### STILL LIMITED

1. **Plan persistence** - NOT IMPLEMENTED
   - Plans cannot be saved to database
   - Plans cannot be loaded from database
   - Every request appears as new request

2. **Question persistence** - NOT IMPLEMENTED
   - QuestionTracker is in-memory only
   - Does not survive serverless boundaries
   - Repeated questions will occur in production

3. **Conversation context** - SEVERELY LIMITED
   - Only last 5 messages
   - Each message truncated to 200 characters
   - Total context ≈ 1000 characters

4. **New request detection** - UNRELIABLE
   - No structural support
   - Relies entirely on AI inference
   - No plan to compare against

5. **AI-driven path usage** - EXTREMELY LIMITED
   - Only used for existing builds
   - New requests always use legacy path
   - Feature flag does not control new request path

6. **Plan evolution** - BROKEN
   - Plan cannot evolve across requests
   - No specToPlan conversion
   - Always converted to rigid AutomationSpec

### NOT IMPLEMENTED

1. **Conversation/workflow separation**
   - One conversation = one workflow (still)
   - No separate workflow entities

2. **Plan visualization**
   - No user-facing plan display
   - No plan editing interface

3. **Collaborative planning**
   - No multi-user planning
   - No plan sharing

4. **Semantic question similarity**
   - QuestionTracker uses simple hash
   - No AI semantic matching

---

## 13. Real-World Scenario Evaluation

### Scenario A — Simple request

**User**: "Create a bot that sends me a reminder every morning."

**Expected**: ALEX should reason without enumerating fields.

**Actual**: 
- New request → Uses legacy path (IntelligenceAnalyzerV2)
- Uses blocker system
- Will enumerate blockers mechanically

**Result**: FAILS (legacy path used)

### Scenario B — Ambiguous request

**User**: "Create a lead management system."

**Expected**: ALEX should ask useful clarifications.

**Actual**:
- New request → Uses legacy path
- Will ask about blockers like `platform`, `inputs.sources`, `outputs.destinations`

**Result**: FAILS (legacy path used)

### Scenario C — Recommendation

**User**: "I want to automate my business but I don't know which platform to use."

**Expected**: ALEX should discuss/recommend options.

**Actual**:
- New request → Uses legacy path
- Will ask "platform?" as a blocker
- Will provide deterministic options

**Result**: FAILS (legacy path used)

### Scenario D — Brainstorming

**User**: "What are some useful things I can automate for my business?"

**Expected**: ALEX should brainstorm.

**Actual**:
- New request → Uses legacy path
- Will interpret as artifact request
- Will start blocker enumeration

**Result**: FAILS (legacy path used)

### Scenario E — Natural language

**User**: "I want website visitors to fill a form, save their details, and notify my sales team."

**Expected**: ALEX should understand without field:value.

**Actual**:
- New request → Uses legacy path
- Will use IntelligenceAnalyzerV2 for extraction
- Will ask blockers

**Result**: PARTIAL (extraction works, but blocker enumeration still occurs)

### Scenario F — Revision

**User**: "Actually, don't email the sales team. Send the notification to Slack instead."

**Expected**: ALEX should revise the plan.

**Actual**:
- Existing build → Uses AI-driven path (if flag true)
- AI sees "No current automation plan" (loadCurrentPlan returns null)
- AI may treat as new request or revision (unclear)
- Plan cannot be loaded to revise

**Result**: FAILS (no plan to revise)

### Scenario G — New task

**User**: "Forget that. Build me a document summarizer."

**Expected**: ALEX should abandon previous workflow.

**Actual**:
- Existing build → Uses AI-driven path (if flag true)
- AI sees "No current automation plan"
- No structural support for "forget that"
- Relies on AI inference

**Result**: UNRELIABLE (no robust signal)

### Scenario H — Already sufficient

**User**: Gives highly detailed specification.

**Expected**: ALEX should NOT ask unnecessary questions.

**Actual**:
- New request → Uses legacy path
- IntelligenceAnalyzerV2 extracts spec
- If no blockers, proceeds to architecture
- If blockers exist, asks questions

**Result**: PARTIAL (depends on blocker detection)

---

## 14. Legacy Leakage Analysis

### Blocker System

**Location**: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts`

**Status**: 
- Still used in legacy path (WorkflowManagerV2)
- 98 occurrences of "blocker" in this file
- NOT used in AI-driven path

**Impact**: Legacy path is the default for new requests, so blocker system is still the primary behavior.

### Deterministic Question Generation

**Location**: `lib/alex/artifact-generation/requirement-option-generator.ts`

**Status**:
- Still used in legacy path
- NOT used in AI-driven path

**Impact**: New requests still use deterministic question generation.

### Field:value Format

**Status**:
- Removed from frontend (AlexChat.tsx)
- Still used in legacy path for answer mapping
- NOT used in AI-driven path

**Impact**: Mixed - frontend sends natural language, but legacy path expects field context.

### WorkflowManagerV2

**Status**:
- Still used for new requests (unconditionally)
- Still used for existing builds when flag is false
- Uses IntelligenceAnalyzerV2 with blocker system

**Impact**: Primary execution path for most use cases.

### AutomationSpec

**Status**:
- Still used for persistence
- Plan converted to spec for storage
- No reverse conversion (specToPlan)

**Impact**: Plan persistence is broken.

---

## 15. Most Important Question

**Question**: "If I enable `USE_AI_DRIVEN_ORCHESTRATION=true`, send ALEX a completely new automation request that it has never seen before, and speak naturally to it for 5–10 turns, is the LLM actually deciding what happens next at each turn?"

**Answer**: NO

**Proof**:

1. **New Request Path**: New requests unconditionally use `WorkflowManagerV2.processRequest()` regardless of feature flag (`orchestrator.ts` lines 258-278). The feature flag only controls the existing build path.

2. **Legacy Path**: The legacy path uses `IntelligenceAnalyzerV2` with a deterministic blocker system. The LLM is used for extraction and blocker identification, but the decision to ask questions is controlled by deterministic code checking `specState.blockers.size > 0`.

3. **Plan Persistence**: The AI-driven path cannot load existing plans (`loadCurrentPlan()` always returns null), so the AI always sees "No current automation plan - this is a new request" in the prompt.

4. **Question Persistence**: The QuestionTracker is in-memory only and does not survive serverless boundaries, so it cannot prevent repeated questions in production.

5. **Context Limitation**: The AI only receives the last 5 messages truncated to 200 characters each, limiting its ability to reason about the conversation.

**Conclusion**: The LLM does not control orchestration decisions in practice because:
- The AI-driven path is rarely used (only for existing builds)
- When used, it lacks necessary context (no plan, limited history)
- The primary path (new requests) uses the legacy blocker system
- The feature flag does not control the primary execution path

---

## Critical Bugs Found

### Bug #1: Feature Flag Does Not Control New Request Path

**Location**: `lib/alex/orchestrator.ts` lines 258-278

**Issue**: The feature flag `USE_AI_DRIVEN_ORCHESTRATION` is only checked for existing builds. New artifact requests unconditionally use `WorkflowManagerV2.processRequest()`.

**Impact**: The AI-driven orchestrator is never used for new automation requests, which is the primary use case.

### Bug #2: Plan Persistence Not Implemented

**Location**: `lib/alex/orchestration/workflow-orchestrator.ts` lines 323-334

**Issue**: `loadCurrentPlan()` always returns `null` with a TODO comment. No `specToPlan` conversion exists.

**Impact**: The AI-driven orchestrator cannot see previous plan state, making revision detection and plan evolution impossible.

### Bug #3: QuestionTracker Not Persistent

**Location**: `lib/alex/orchestration/question-tracker.ts` line 18

**Issue**: QuestionTracker uses in-memory Map only. No database persistence.

**Impact**: In serverless environments, repeated questions will occur because the tracker is empty on every request.

### Bug #4: Context Severely Limited

**Location**: `lib/alex/orchestration/ai-orchestrator.ts` lines 114-120

**Issue**: AI only receives last 5 messages truncated to 200 characters each.

**Impact**: The LLM cannot reason about the full conversation context, limiting its ability to make informed decisions.

### Bug #5: No New Request Detection Structural Support

**Issue**: New request detection relies entirely on AI inference without structural support.

**Impact**: The AI cannot reliably distinguish between continuing the current automation, revising it, or starting a new one.

---

## Recommended Next Steps

### Priority 1: Fix Feature Flag

1. Add feature flag check to new request path (`orchestrator.ts` lines 258-278)
2. Route new requests to WorkflowOrchestrator when flag is true
3. Update IntentDetector to work with AI-driven path

### Priority 2: Implement Plan Persistence

1. Implement `specToPlan()` conversion
2. Add plan column to alex_artifact_builds table
3. Save plan in addition to spec
4. Load plan on orchestration

### Priority 3: Implement Question Persistence

1. Add question tracking table to database
2. Persist questions with conversation_id
3. Load questions on orchestration
4. Make QuestionTracker authoritative

### Priority 4: Expand Context

1. Increase message history limit (from 5 to 20)
2. Remove or increase message truncation (from 200 to 1000)
3. Add plan context to AI prompt
4. Add question history to AI prompt

### Priority 5: Add New Request Detection

1. Add explicit "new workflow" command
2. Add structural signal for revision vs new
3. Implement conversation/workflow separation
4. Add workflow lifecycle management

---

## Final Verdict

**STILL PARTIALLY TEMPLATE-DRIVEN**

The AI-driven orchestration layer has been implemented with good architecture (AlexNextAction types, AIOrchestrator, QuestionTracker), but critical implementation failures prevent it from functioning as intended:

1. The AI-driven path is rarely used (only for existing builds, not new requests)
2. Plan persistence is not implemented (loadCurrentPlan always returns null)
3. Question persistence is not implemented (in-memory only)
4. Context is severely limited (5 messages × 200 chars)
5. New request detection lacks structural support

While the LLM does control decisions in the AI-driven path, the path is fundamentally broken due to lack of persistence and context. The primary execution path (new requests) still uses the legacy template-driven blocker system.

**To be truly AI-driven**, the following must be fixed:
- Feature flag must control all execution paths
- Plan persistence must be implemented
- Question persistence must be implemented
- Context must be expanded
- New request detection must have structural support

Until these are fixed, ALEX remains partially template-driven.