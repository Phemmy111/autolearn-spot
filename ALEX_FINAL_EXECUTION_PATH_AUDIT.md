# ALEX FINAL EXECUTION-PATH AUDIT — READ ONLY

## CRITICAL FINDING: AI-DRIVEN ORCHESTRATION IS NEVER INVOKED

### Root Cause Analysis

**Production Request**: "A workflow to automate a task"

**Actual Execution Path**:
```
POST /api/alex/chat
  ↓
Message persisted to database (chat/route.ts:151-168)
  ↓
History fetched from database (last 20 messages) (chat/route.ts:276-281)
  ↓
AIEngine.streamChat() (chat/route.ts:448)
  ↓
AlexOrchestrator.orchestrate() (ai-engine.ts:180)
  ↓
Intent detection: detectIntent() (orchestrator.ts:140)
  ↓
Intent detector result: isArtifactGeneration = FALSE (intent-detector.ts:60)
  ↓
Existing build check: NO (orchestrator.ts:158)
  ↓
New request path check: isArtifactGeneration = FALSE (orchestrator.ts:258)
  ↓
SKIPS AI-driven orchestration path entirely
  ↓
Normal chat path (orchestrator.ts:391+)
  ↓
Context assembly (orchestrator.ts:392)
  ↓
buildMessages() (orchestrator.ts:431)
  ↓
Conversation history added (last 10 messages) (orchestrator.ts:522-528)
  ↓
Current message added (orchestrator.ts:570-573)
  ↓
Provider selection
  ↓
LLM receives messages
```

---

## PART 1 — REQUEST TO LLM EXECUTION PATH

### File: `app/api/alex/chat/route.ts`
**Function**: POST handler (line 26)
**Input**: User message "A workflow to automate a task"
**Output**: Saves to database, calls AIEngine.streamChat()

### File: `lib/alex/orchestrator.ts`
**Function**: orchestrate() (line 66)
**Input**: content, mode, conversationHistory
**Output**: AIRequest with messages

### File: `lib/alex/intent-detector.ts`
**Function**: detectIntent() (line 15)
**Input**: "A workflow to automate a task"
**Output**: 
```text
detectedIntent: 'Workflow automation'
suggestedMode: automation
isArtifactGeneration: FALSE ← CRITICAL
confidence: 1
```
**Decision Type**: DETERMINISTIC (regex/keyword based)

### File: `lib/alex/orchestrator.ts`
**Function**: Line 258 condition check
**Input**: `isArtifactGeneration = false`
**Output**: SKIPS AI-driven orchestration path

### File: `lib/alex/orchestrator.ts`
**Function**: buildMessages() (line 481)
**Input**: content, conversationHistory (from database)
**Output**: AIMessage array with:
- System prompt
- File context (if any)
- Last 10 conversation messages
- Current user message

### Decision Authority: DETERMINISTIC CODE
The LLM has NO authority over orchestration decisions. The intent detector decides the path.

---

## PART 2 — ORCHESTRATION ENTRY POINTS

| Component | Called by | Called when | Can make routing decision? | AI or deterministic? | Active in production path? |
| --------- | --------- | ----------- | -------------------------- | -------------------- | -------------------------- |
| detectIntent | AlexOrchestrator | Every auto mode request | YES | DETERMINISTIC (regex) | YES |
| isArtifactGeneration | detectIntent | Based on keyword patterns | YES | DETERMINISTIC | YES |
| AIOrchestrator | WorkflowOrchestrator | When feature flag=true AND isArtifactGeneration=true | YES | AI-driven | NO (bypassed) |
| WorkflowOrchestrator | AlexOrchestrator | When feature flag=true AND isArtifactGeneration=true | YES | AI-driven | NO (bypassed) |
| WorkflowManagerV2 | AlexOrchestrator | When feature flag=false OR isArtifactGeneration=false | YES | DETERMINISTIC | YES (for most requests) |
| IntelligenceAnalyzerV2 | WorkflowManagerV2 | Legacy path only | NO | AI-assisted | YES (legacy path) |

---

## PART 3 — AI ORCHESTRATOR INVOCATION STATUS

**AIOrchestrator invoked? NO**

### Exact Bypass Location
**File**: `lib/alex/orchestrator.ts`
**Line**: 258
**Condition**: `if (isArtifactGeneration && userId && conversationId && !request.skipArtifactDetection)`

### Why Bypassed
The intent detector returns `isArtifactGeneration: false` for "A workflow to automate a task" because:
1. It doesn't start with "create", "build", or "generate" (line 59)
2. It doesn't match build patterns (lines 32-55)
3. It doesn't match strong build indicators (lines 70-80)

### Result
The AI-driven orchestration path (lines 267-334) is NEVER reached for this request.

---

## PART 4 — DUPLICATED HISTORY INVESTIGATION

### Database Persistence (chat/route.ts:151-168)
```typescript
const { data: userMessage } = await supabase
  .from('alex_messages')
  .insert({
    conversation_id: conversationId,
    role: 'user',
    content,
    file_ids: fileIds || []
  })
```
**Current message persisted ONCE to database**

### History Query (chat/route.ts:276-281)
```typescript
const { data: historyMessages } = await supabase
  .from('alex_messages')
  .select('role, content')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
  .limit(20)
```
**Fetches last 20 messages including the one just persisted**

### Message Construction (orchestrator.ts:522-528)
```typescript
const recentHistory = conversationHistory.slice(-10)
for (const msg of recentHistory) {
  messages.push({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  })
}
```
**Adds last 10 messages from database (includes current message)**

### Current Message Addition (orchestrator.ts:570-573)
```typescript
messages.push({
  role: 'user',
  content: messageContent,
})
```
**Adds current message AGAIN**

### Root Cause
The current message appears TWICE in the final AI request because:
1. Database query returns it (lines 276-281)
2. buildMessages() includes it in conversation history (lines 522-528)
3. buildMessages() adds it again as current message (lines 570-573)

### Why Previous Message Present
"Create a lead capture bot" is from the database conversation history - legitimate previous message.

### Why Assistant Messages Missing
The database query returns only user messages (line 278: `select('role, content')`), so assistant responses are not included in the context.

---

## PART 5 — OLD MESSAGE PRESENCE

**Previous message**: "Create a lead capture bot"
**Status**: Legitimate conversation history from database

**Should it be included?** YES, but WITHOUT assistant responses it provides incomplete context.

**Missing context**: The assistant's response to "Create a lead capture bot" is missing, making the LLM unable to understand the conversation state.

**Impact**: The LLM sees:
```
user: Create a lead capture bot
user: A workflow to automate a task
user: A workflow to automate a task
```

This looks like the user repeated their request, not a natural conversation.

---

## PART 6 — INTENT DETECTOR INVESTIGATION

### File: `lib/alex/intent-detector.ts`
**Function**: detectIntent() (line 15)

### Implementation
**Type**: DETERMINISTIC (regex/keyword based)
**LLM-based**: NO

### Decision Logic (lines 32-61)
```typescript
const buildPatterns = [
  'build me a', 'create a', 'generate a', 'build an', 'create an', 'generate an',
  // ... 50+ patterns
]

const startsWithBuildVerb = lowerContent.startsWith('create ') || 
                         lowerContent.startsWith('build ') || 
                         lowerContent.startsWith('generate ')
const isBuildRequest = startsWithBuildVerb || buildPatterns.some(...)
```

### For "A workflow to automate a task"
- Does NOT start with "create/build/generate"
- Does NOT match any build patterns
- Result: `isArtifactGeneration = false`

### Can it route to legacy workflow?
**YES** - When `isArtifactGeneration = false`, the AI-driven path is bypassed

### Does it override AI decisions?
**YES** - It pre-empts AI decision-making by determining the routing path

### Is it still necessary after AI-driven orchestration?
**NO** - The AI should determine if it's an automation request, not keyword patterns

### Specific Test Cases
- "Create a lead capture bot" → isArtifactGeneration = TRUE → AI-driven path
- "Build a content summarizer" → isArtifactGeneration = TRUE → AI-driven path
- "I want to automate my lead capture" → isArtifactGeneration = FALSE → NORMAL PATH
- "Can you help me automate something?" → isArtifactGeneration = FALSE → NORMAL PATH
- "I don't know what to automate, give me ideas" → isArtifactGeneration = FALSE → NORMAL PATH
- "Recommend an automation for my business" → isArtifactGeneration = FALSE → NORMAL PATH

---

## PART 7 — TEMPLATE-DRIVEN QUESTION GENERATION

### Locations Found

**File**: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts`
**Function**: formulateQuestion() (line 192)
**Type**: AI-assisted but field-driven
**Reachable**: YES (legacy path, not AI-driven path)

**File**: `lib/alex/artifact-generation/requirement-option-generator.ts`
**Function**: generateOptions() (line ~30)
**Type**: DETERMINISTIC
**Reachable**: YES (legacy path)

**Template strings found**:
- "I need to know: {field}"
- "Please provide your answer."
- "Please select from the available options."

### When `USE_AI_DRIVEN_ORCHESTRATION=true`
These are NOT reachable because the AI-driven path is bypassed by the intent detector.

---

## PART 8 — AI DECISION AUTHORITY

### WHO HAS FINAL AUTHORITY?

**DETERMINISTIC ROUTER**

The LLM has NO authority over orchestration decisions. The decision chain is:

1. Intent detector (DETERMINISTIC) → decides routing path
2. If `isArtifactGeneration = false` → normal chat path
3. If `isArtifactGeneration = true` → feature flag check
4. If feature flag = true → AI-driven path
5. If feature flag = false → legacy path

The LLM only fills in information AFTER the routing decision is made.

---

## PART 9 — MODEL SELECTION INVESTIGATION

### Configuration Says: `openai/gpt-oss-120b`
**Location**: `orchestrator.ts:400`
```typescript
modelName: modelName || 'openai/gpt-oss-120b'
```

### Final Request Says: `openrouter/free`
**Reason**: Provider selection happens in AIEngine after orchestrator returns

### Provider Selection
**File**: `lib/alex/ai-engine.ts`
**Lines**: 244-264
**Function**: Provider selection via registry

### Why Different
The configured model may not be available in the provider registry, so a fallback model is selected.

### Model Selection: DETERMINISTIC (registry-based)

---

## PART 10 — MEMORY/RAG FAILURES

### Failures
```
Memory retrieval failed: OpenAI API key is required
Retrieval failed: OpenAI API key is required
```

### Root Cause
Memory/retrieval services are hardcoded to use OpenAI API, but the configured provider is OpenRouter.

### Impact
This reduces ALEX's reasoning context but does not prevent operation.

### Is failure expected/optional?
**YES** - The application continues without memory/retrieval.

### Does it affect orchestration decisions?
**NO** - It only reduces context, not routing.

---

## PART 11 — ALEX AI-FIRST CAPABILITY

### A. Can user ask for guidance without fixed schema?
**NO** - Intent detector prevents AI-driven path for "I don't know what to automate"

### B. Can ALEX independently determine necessary information?
**NO** - AI-driven path is bypassed, so AI never gets to decide

### C. Can ALEX recommend platforms based on reasoning?
**NO** - AI-driven path is bypassed

### D. Can ALEX brainstorm alternatives?
**NO** - AI-driven path is bypassed

### E. Can ALEX recognize objective changes?
**NO** - AI-driven path is bypassed

### F. Can ALEX decide no question is necessary?
**NO** - AI-driven path is bypassed

### G. Can ALEX decide clarification is needed?
**NO** - AI-driven path is bypassed

### H. Can ALEX decide to generate automation?
**NO** - AI-driven path is bypassed

### I. Can conversation contain multiple unrelated requests?
**UNCLEAR** - Normal chat path, no workflow separation

---

## PART 12 — FINAL VERDICT

### CURRENT ALEX LEVEL: LEVEL 0

**Template/form wizard**

### Justification

The AI-driven orchestration layer exists in the codebase but is **completely bypassed** in the actual production execution path for the following reasons:

1. **Intent detector is deterministic and pre-empts AI**: The keyword-based intent detector decides routing before AI can analyze the request
2. **Feature flag check is unreachable**: The new request path checks `isArtifactGeneration` (line 258), which is controlled by the intent detector
3. **"A workflow to automate a task" does not trigger artifact generation**: The intent detector returns `isArtifactGeneration = false` because it doesn't match keyword patterns
4. **AI-driven orchestration is NEVER invoked**: The bypass condition (line 258) prevents AIOrchestrator from running
5. **LLM has NO orchestration authority**: The LLM only receives messages after routing decisions are made
6. **Legacy paths are still active**: The normal chat path uses deterministic message construction

### Execution Path

```
User message
  ↓
Intent detector (DETERMINISTIC)
  ↓
isArtifactGeneration = false (DETERMINISTIC)
  ↓
Bypass AI-driven orchestration
  ↓
Normal chat path
  ↓
Context assembly
  ↓
Message construction (DETERMINISTIC)
  ↓
Provider selection (DETERMINISTIC)
  ↓
LLM receives pre-determined messages
```

---

## ROOT CAUSES

1. **Intent detector gatekeeper**: The keyword-based intent detector pre-empts AI analysis
2. **Feature flag unreachable**: The AI-driven path is behind an intent detector condition
3. **Keyword patterns too restrictive**: Many legitimate automation requests don't match "create/build/generate" patterns
4. **No AI analysis before routing**: The system routes before AI can understand the request
5. **Message duplication bug**: Current message appears twice in context

---

## SECONDARY ISSUES

1. **Assistant messages missing from context**: Database query filters out assistant responses
2. **Model selection mismatch**: Configured model not available, fallback used
3. **Memory/retrieval failures**: Hardcoded OpenAI dependency
4. **Message duplication**: Current message added twice to final AI request

---

## AI AUTHORITY

**NONE**

The LLM has ZERO authority over orchestration decisions. The decision chain is:

1. Intent detector (deterministic) → decides routing
2. If artifact generation → feature flag → MAYBE AI-driven
3. If NOT artifact generation → normal chat → LLM just responds
4. LLM only receives messages AFTER routing is decided

---

## MINIMUM NEXT FIX

**REQUIRED**: Remove the intent detector gatekeeper before AI orchestration.

**The fix must be**:
1. Remove or disable the intent detector for auto mode
2. Always invoke AI-driven orchestration for auto mode
3. Let the AI decide whether it's an automation request
4. Let the AI decide what action to take

**WITHOUT THIS FIX**: The AI-driven orchestration layer remains dead code.

---

## ARCHITECTURAL REALITY

The production logs prove that despite the AI-driven orchestration implementation, ALEX is still:

- Template-driven (keyword-based routing)
- Form-wizard-like (deterministic message construction)
- Not AI-first (LLM has no orchestration authority)

The implementation is **LEVEL 0** because the AI-driven layer is completely bypassed by the intent detector gatekeeper.