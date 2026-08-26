# ALEX CONVERSATIONAL ARCHITECTURE FORENSIC AUDIT

## Executive Summary

**CRITICAL FINDING**: The generic response "I understand. Let me continue with your automation based on what we've discussed so far." is a **fallback message** triggered when AI JSON parsing fails.

**ROOT CAUSE**: The system requires the AI to return structured JSON on every conversational turn. When the AI returns natural language instead of JSON (which is the desired conversational behavior), the JSON parser fails and triggers a fallback path that returns a canned acknowledgement.

**ARCHITECTURAL FUNDAMENTAL INCOMPATIBILITY**: The current architecture is **Model B** (Conversation → AI → JSON decision → Orchestrator → Application chooses response), but the user wants **Model A** (Conversation → AI → Natural response). The JSON requirement structurally prevents ChatGPT-like conversation.

---

## Live Failure Reconstruction

### Turn 1

**User**: "I want to build an automation for handling job applications. When someone submits a Google Form, I want the submission to be processed automatically. Don't build anything yet. Talk with me through what you need to know and help me figure out the best automation."

**Expected Flow**:
1. Frontend sends message to `POST /api/alex/chat`
2. Message persisted to `alex_messages`
3. Router detects `existingBuild` exists (from Phase 3)
4. Routes to `WorkflowOrchestrator.orchestrateWorkflow()`
5. `AIOrchestrator.orchestrate()` called
6. `askAIDecision()` constructs prompt requiring JSON
7. AI receives prompt asking for JSON decision structure
8. AI likely returns natural language instead of JSON
9. JSON parsing fails: `response.match(/\{[\s\S]*\}/)` returns null
10. Fallback triggered: `getFallbackDecision()` called
11. `getFallbackDecision()` finds existing requirements
12. Returns: "I understand. Let me continue with your automation based on what we've discussed so far."

**Actual Result**: Generic acknowledgement instead of natural conversational response.

**Why**: AI tried to respond conversationally (as requested), but the system demanded JSON, so the response was discarded and replaced with a fallback message.

### Turn 2

**User**: "The form should collect the applicant's name, email, CV, years of experience, and desired role. I also want applicants to be scored automatically based on their answers."

**Expected Flow**: Same as Turn 1 — AI should incorporate new information and ask the next relevant question naturally.

**Actual Result**: Same generic acknowledgement.

**Why**: Same JSON parsing failure. The AI's natural language response is discarded.

### Turn 3

**User**: "Actually, before we build anything, I want you to interview me like ChatGPT would. Don't just acknowledge my answers. Based on everything I've told you so far, tell me what you already understand about the automation, identify what important information is still missing, and ask me only the most important next question. Keep the conversation natural."

**Expected Flow**: AI should understand it's being asked to behave conversationally and respond accordingly.

**Actual Result**: Same generic acknowledgement.

**Why**: The user is explicitly asking for ChatGPT-like conversation, but the architecture prevents it. The AI cannot comply because the system demands JSON, not natural language.

---

## Exact Generic Response Source

**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Function**: `getFallbackDecision()`

**Lines**: 598-599

**Exact Code**:
```typescript
const message = (hasExistingRequirements || newRequirements)
  ? 'I understand. Let me continue with your automation based on what we\'ve discussed so far.'
  : 'I understand. Let me continue with your automation.'
```

**Condition that causes it**:
- Called when `JSON.parse()` fails in `askAIDecision()` (line 304)
- Called when `response.match(/\{[\s\S]*\}/)` returns null (line 303)
- Called when `aiService.generateResponse()` throws (line 325)

**Why it's triggered**:
- The AI is required to return JSON via the prompt (lines 274-291)
- If the AI returns natural language instead of JSON, parsing fails
- The fallback assumes AI failure and returns a safe continuation message
- The AI's actual natural-language response is discarded

**Source**: Application code (fallback path), NOT the model

---

## Complete Request Lifecycle

### Frontend Input
- User types message in `AlexChat.tsx`
- Message sent to `POST /api/alex/chat`

### POST /api/alex/chat
**File**: `app/api/alex/chat/route.ts`

**What enters**: `{ conversationId, content, mode, fileIds, ... }`

**What leaves**: SSE stream with orchestration events

**Who controls**: Application code

**Process**:
1. Auth validation
2. Rate limit check
3. Conversation ownership verification
4. **Message persistence to `alex_messages`** (lines 153-162)
5. Conversation history loading (lines 356-366)
6. **Check for existing artifact build** (lines 156-214)
7. If build exists → route to `WorkflowOrchestrator` (line 181)

### Workflow Orchestrator Entry
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`

**What enters**: `WorkflowOrchestrationRequest` with user message and conversation history

**What leaves**: `WorkflowOrchestrationResponse` with AI action

**Who controls**: Application code

**Process**:
1. Build `ConversationContext` from conversation history (lines 70-79)
2. **Load current plan** via `loadCurrentPlan()` (line 87)
3. Call `AIOrchestrator.orchestrate()` (line 90)
4. Handle orchestration result (line 109)

### AI Orchestrator
**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**What enters**: User message, conversation context, current plan

**What leaves**: `OrchestrationResult` with AI action

**Who controls**: Application code forces JSON structure

**Process**:
1. Build conversation context for AI (lines 188-214)
2. **Construct prompt requiring JSON** (lines 206-294)
3. Call `WorkflowAIService.generateResponse(prompt)` (line 299)
4. **Parse JSON from response** (line 303)
5. If JSON parsing fails → **fallback** (line 323)

### Critical JSON Requirement
**Prompt structure** (lines 274-291):
```typescript
Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "action": {
    "type": "action_type",
    "message": "response message if applicable",
    ...
  },
  ...
}
```

**Is the model free to produce natural language?** NO — it's explicitly told to return ONLY JSON

**Is the model forced to produce JSON?** YES — prompt requires JSON format

**Is the model's response transformed?** YES — parsed as JSON, natural language discarded if not in JSON

**Is the model's response discarded?** YES — if not valid JSON, entire response discarded

**Is a canned response substituted?** YES — fallback message substituted

### JSON Parsing Failure Path
**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Lines**: 302-327

**Code**:
```typescript
const jsonMatch = response.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  const result = JSON.parse(jsonMatch[0])
  // ... process result
}
// Fallback if JSON parsing fails
console.error('[AI Orchestrator] Failed to parse AI decision, using fallback')
return this.getFallbackDecision(userMessage, currentPlan, context)
```

**Behavior**:
- AI returns natural language (as user requested)
- `response.match(/\{[\s\S]*\}/)` returns null (no JSON found)
- Falls back to `getFallbackDecision()`
- Returns generic acknowledgement

### Context Assembly
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`

**Lines**: 70-84

**What model receives**:
- Current user message ✅
- Previous messages (last 20) ✅
- Current plan (if exists) ✅
- Mode ✅

**What model does NOT receive**:
- `requirements_collected` ❌
- System prompt for natural conversation ❌
- Instructions to behave conversationally ❌

**Conversation history provided**: YES (last 20 messages)

**Persistent state provided**: Current plan only, not `requirements_collected`

### Frontend Event Parsing
**File**: `components/alex/AlexChat.tsx`

**Lines**: 349-382

**Process**:
1. Receive SSE events
2. Parse `orchestration` type events
3. Extract `action`, `message`, `plan`, etc.
4. Create message with `orchestrationData`
5. Render via `AlexMessageList.tsx`

**Is AI's natural response displayed?** NO — only JSON-structured message field is displayed

### Rendered Response
**File**: `components/alex/AlexMessageList.tsx`

**Lines**: 740-763

**Process**:
1. Check for `orchestrationData.message`
2. If present, render as markdown
3. Otherwise, render `content` field

**Can fallback override valid response?** YES — fallback replaces failed JSON parsing

---

## Current Architecture

### Model B: JSON-Driven Orchestration

```
User message
    ↓
POST /api/alex/chat
    ↓
Message persisted
    ↓
Check for existing build
    ↓
WorkflowOrchestrator.orchestrateWorkflow()
    ↓
AIOrchestrator.orchestrate()
    ↓
askAIDecision()
    ↓
Construct JSON-REQUIRED prompt
    ↓
AI forced to return JSON
    ↓
JSON parsing
    ↓
If parsing fails → fallback (generic message)
    ↓
If parsing succeeds → action execution
    ↓
SSE event to frontend
    ↓
Render response
```

**Key characteristics**:
- AI is structurally required to return JSON on every turn
- Natural language responses are treated as failures
- Fallback path discards AI's actual response
- Conversation quality depends on JSON structure, not natural language

**Is current architecture fundamentally capable of ChatGPT-like conversation?** NO — the JSON requirement structurally prevents it.

---

## AI Prompt Audit

### System Prompt Construction
**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Lines**: 206-294

**What ALEX is told its role is**:
- "You are ALEX, an intelligent automation expert"
- "Your job is to decide what to do next based on the user's message and conversation context"

**Is it told to behave conversationally?** NO — it's told to decide actions

**Is it told to produce JSON?** YES — "Return ONLY valid JSON in this exact format"

**Is it told to select actions?** YES — must choose from predefined action types

**Is it told when to ask questions?** YES — clarify action type

**Is it told to summarize requirements?** NO — not mentioned

**Is it told to reason about user intent?** YES — intent detection guidelines

**Is it told to prioritize natural conversation?** NO — prioritizes action selection

**Is it constrained by a rigid schema?** YES — must match exact JSON format

**Is the prompt internally contradictory?** YES — user asks for conversation, prompt demands JSON

**Does another prompt override it?** NO — this is the primary orchestration prompt

**Does orchestration inject instructions that force canned responses?** YES — fallback path forces canned response

### Instruction Hierarchy

1. **Primary instruction**: Return JSON in exact format (highest priority)
2. **Secondary instruction**: Decide action type
3. **Tertiary instruction**: Include message field if applicable
4. **User request**: Behave conversationally (lowest priority, conflicts with #1)

---

## Context Assembly Audit

### What the Model Receives

**Current user message**: ✅ Included in prompt (line 208)

**Previous messages**: ✅ Included (last 20 messages, lines 212-213)

**System prompt**: ❌ No natural conversation system prompt

**User profile**: ❌ Not included

**requirements_collected**: ❌ Not included in AI context

**automation_plan**: ✅ Included if exists (lines 192-194)

**final_specification**: ❌ Not included in AI context

**orchestration state**: ❌ Not included

**question state**: ❌ Not included

**files**: ✅ Included via conversation history

**RAG results**: ❌ Not in orchestration path

**tools**: ❌ Not in orchestration path

**research context**: ❌ Not in orchestration path

### Second User Message Inclusion

**Message**: "The form should collect the applicant's name, email, CV, years of experience, and desired role. I also want applicants to be scored automatically based on their answers."

**Is it included in model's context?** YES — loaded in conversation history (line 212)

**Is it lost?** NO — but the AI's response to it is lost due to JSON parsing failure

---

## State Authority Map

### Current Sources of Truth

**Conversation**: `alex_messages` (raw natural language)

**User requirements**: 
- Primary: `requirements_collected` (incremental JSON object)
- Secondary: `automation_plan` (structured plan)
- Tertiary: `final_specification` (artifact spec)

**Automation requirements**: `automation_plan` and `requirements_collected`

**Current phase**: Build status in `alex_artifact_builds.status`

**Current question**: No active question tracking in new architecture

**Automation plan**: `automation_plan` column in `alex_artifact_builds`

**Final specification**: `final_specification` column in `alex_artifact_builds`

**Build state**: `alex_artifact_builds` row

### Transient AI Response Authority

**Are transient AI responses treated as authoritative?** YES — 
- `updatedPlan` from AI is treated as authoritative plan
- If AI JSON fails, no state update occurs
- If AI succeeds, plan is immediately persisted

**Correct authority should be**:
- `requirements_collected` should be authoritative for user requirements
- AI should provide incremental updates to `requirements_collected`
- AI natural language should be authoritative for conversation
- AI JSON should be advisory for structure, not mandatory

---

## Failure Mode Analysis

### 1. AI returns valid JSON
**Behavior**: 
- JSON parsed successfully
- Action extracted
- Plan updated if present
- Requirements updated if present
- Response rendered from JSON message field

**Conversation quality**: Depends on JSON message field, may be terse

### 2. AI returns malformed JSON
**Behavior**:
- JSON.parse() throws
- Fallback triggered
- Generic acknowledgement returned
- AI's actual response discarded

**Conversation quality**: POOR — generic message replaces AI response

### 3. AI returns natural language instead of JSON
**Behavior**:
- response.match() returns null
- Fallback triggered
- Generic acknowledgement returned
- AI's natural response discarded

**Conversation quality**: POOR — desired behavior treated as failure

### 4. Provider times out
**Behavior**:
- catch block triggered
- Fallback triggered
- Generic acknowledgement returned
- Phase 3 may extract requirements from message

**Conversation quality**: POOR — timeout treated as AI failure

### 5. Primary provider fails
**Behavior**:
- ProviderManager fallback attempted
- If fallback succeeds → normal flow
- If fallback fails → catch block → fallback

**Conversation quality**: Depends on fallback provider

### 6. All providers fail
**Behavior**:
- catch block triggered
- Fallback triggered
- Generic acknowledgement returned
- Phase 3 may extract requirements

**Conversation quality**: POOR — all failures result in generic message

### 7. AI returns unexpected action
**Behavior**:
- validateAction() handles unknown types
- Defaults to 'respond' action
- Message rendered if present

**Conversation quality**: May be acceptable if message field present

### 8. AI omits an action
**Behavior**:
- validateAction() handles missing action
- May return default respond action

**Conversation quality**: Acceptable if message field present

### 9. Conversation history is long
**Behavior**:
- Limited to last 20 messages (line 189)
- Earlier context lost

**Conversation quality**: May lose important context

### 10. User corrects a previous requirement
**Behavior**:
- AI should detect revision intent
- Update plan accordingly
- Requirements updated via Phase 2

**Conversation quality**: Depends on AI JSON response

### 11. User changes their mind
**Behavior**:
- AI should detect new automation intent
- Create new plan
- New build may be created

**Conversation quality**: Depends on AI JSON response

### 12. User asks for a summary
**Behavior**:
- AI should detect clarification/recommendation intent
- Return respond action with summary in message field

**Conversation quality**: Depends on AI including summary in JSON

### 13. User asks ALEX to ask questions
**Behavior**:
- AI should detect answer_question intent
- Return clarify action with question

**Conversation quality**: Depends on AI JSON response

### 14. User says "don't build yet"
**Behavior**:
- AI should detect intent
- Avoid generate/execute actions
- Return respond or clarify action

**Conversation quality**: Depends on AI JSON response

### 15. User is simply chatting without wanting an automation
**Behavior**:
- AI should detect unrelated_conversation intent
- Return respond action with helpful message

**Conversation quality**: Depends on AI JSON response

---

## Conversation-vs-Orchestration Boundary

### Current Boundary

**Conversation Layer**:
- User messages persisted to `alex_messages`
- Conversation history loaded
- Frontend displays messages

**Orchestration Layer**:
- AI forced to return JSON
- Actions extracted from JSON
- Plans updated from JSON
- Requirements updated from JSON

**Boundary Problem**:
- The orchestration layer REQUIRES JSON
- The conversation layer PROVIDES natural language
- The mismatch is resolved by discarding natural language and demanding JSON
- If AI complies with user's request for natural conversation, it fails the system's JSON requirement

### Why ChatGPT-like Conversation is Structurally Prevented

1. **Prompt constraint**: AI is told "Return ONLY valid JSON"
2. **Parsing constraint**: System only accepts JSON responses
3. **Fallback constraint**: Non-JSON responses trigger fallback with generic message
4. **Display constraint**: Only JSON message field is displayed

**To enable ChatGPT-like conversation**, the system must:
- Allow AI to return natural language
- Make JSON optional or advisory
- Not treat natural language as a failure
- Display AI's natural response directly

---

## KEEP / MODIFY / DELETE Matrix

| Component | KEEP | MODIFY | DELETE | WHY |
| --------- | ---- | ------ | ------ | --- |
| Authentication (Clerk) | KEEP | | | Working infrastructure |
| Supabase database | KEEP | | | Working infrastructure |
| alex_messages table | KEEP | | | Conversation persistence works |
| alex_conversations table | KEEP | | | Conversation metadata works |
| Provider manager | KEEP | | | Provider fallback works |
| Groq and fallback providers | KEEP | | | Provider infrastructure works |
| RAG | KEEP | | | Retrieval infrastructure works |
| File extraction | KEEP | | | File processing works |
| Document intelligence | KEEP | | | Document analysis works |
| Web research | KEEP | | | Research infrastructure works |
| Tools | KEEP | | | Tool infrastructure works |
| Agents | KEEP | | | Agent infrastructure works |
| Artifact generation | KEEP | | | Artifact generation works |
| Automation execution | KEEP | | | Execution infrastructure works |
| alex_artifact_builds table | KEEP | | | Build persistence works |
| requirements_collected column | KEEP | | | Phase 1-3 persistence works |
| ArtifactService | KEEP | | | Service layer works |
| AIOrchestrator.askAIDecision() | MODIFY | | | JSON requirement must be removed |
| AIOrchestrator JSON prompt | MODIFY | | | Make JSON optional |
| AIOrchestrator fallback | MODIFY | | | Must not discard natural responses |
| WorkflowOrchestrator | KEEP | | | Workflow orchestration works |
| OrchestrationQuestionService | KEEP | | | Question tracking works |
| Frontend (AlexChat.tsx) | MODIFY | | | Must handle natural responses |
| Frontend (AlexMessageList.tsx) | KEEP | | | Display logic works |
| automation_plan column | KEEP | | | Plan persistence works |
| final_specification column | KEEP | | | Spec persistence works |
| Context assembly | KEEP | | | Context infrastructure works |

---

## Minimal Target Architecture

### Proposed Separation

```
User message
    ↓
Message persisted (alex_messages)
    ↓
Conversation history loaded
    ↓
AI receives natural language prompt
    ↓
AI returns natural language response
    ↓
Natural response displayed to user
    ↓
Concurrently: AI provides optional structured updates
    ↓
Structured updates merged into requirements_collected
    ↓
When appropriate: User confirms → automation planning
    ↓
When appropriate: User approves → execution
```

### Key Changes

1. **Make JSON optional**: AI can return natural language primarily
2. **Separate concerns**: Conversation is primary, structure is secondary
3. **Preserve responses**: Never discard AI's natural language
4. **Optional extraction**: Structured updates extracted separately
5. **State persistence**: requirements_collected updated independently

---

## Required File Changes

### High Priority (Must Change)

1. **lib/alex/orchestration/ai-orchestrator.ts**
   - Remove JSON requirement from prompt
   - Make JSON parsing optional
   - Remove fallback that discards natural responses
   - Allow natural language as primary response
   - Extract structured updates from natural language separately

2. **app/api/alex/chat/route.ts**
   - Remove forced routing to WorkflowOrchestrator for all auto mode
   - Allow normal chat path for non-automation conversations
   - Only route to WorkflowOrchestrator when explicitly building

3. **lib/alex/orchestrator/workflow-orchestrator.ts**
   - Make orchestration layer optional
   - Only invoke when automation is explicitly requested
   - Don't force JSON structure on conversational turns

### Medium Priority (Should Change)

4. **components/alex/AlexChat.tsx**
   - Handle natural language responses
   - Don't require orchestration events for all messages

5. **lib/alex/orchestrator.ts**
   - Remove auto-mode forced routing to WorkflowOrchestrator
   - Allow normal conversational path

### Low Priority (May Change)

6. **lib/alex/orchestration/types.ts**
   - Add natural language response type
   - Make structured updates optional

---

## Database Impact

**NO DATABASE CHANGES REQUIRED**

- `requirements_collected` already exists and works (Phase 1-3)
- `automation_plan` already exists and works
- `final_specification` already exists and works
- `alex_messages` already exists and works
- `alex_conversations` already exists and works
- `alex_artifact_builds` already exists and works

**Schema changes**: NONE

**Migrations**: NONE

---

## Risk Analysis

### Implementation Risk: MEDIUM

**Reasons**:
- Requires changing core AI interaction pattern
- Changes prompt structure fundamentally
- Affects all conversational flows
- Requires careful testing of both conversation and automation paths

### Regression Risk: MEDIUM

**Reasons**:
- Existing automation flows depend on JSON structure
- Plan generation depends on structured updates
- Artifact generation depends on structured specs

### Rollback Strategy: HIGH

**Reasons**:
- Single commit to revert
- No database changes
- Can revert to JSON-required path if needed

### Migration Strategy: PHASED

**Phase 1**: Add natural language path alongside JSON path
**Phase 2**: Test conversation quality
**Phase 3**: Test automation quality
**Phase 4**: Deprecate JSON requirement
**Phase 5**: Remove JSON requirement

---

## Migration Strategy

### Phase 1: Dual-Path Implementation
- Add natural language response type
- Allow AI to return either natural language or JSON
- Preserve both paths
- Test existing functionality still works

### Phase 2: Conversational Testing
- Test ChatGPT-like conversation
- Verify natural responses are displayed
- Verify context is maintained
- Verify fallbacks work correctly

### Phase 3: Automation Testing
- Test structured extraction still works
- Test plan generation still works
- Test artifact generation still works
- Verify requirements_collected updates

### Phase 4: Deprecation
- Mark JSON path as deprecated
- Add warnings for JSON usage
- Encourage natural language path

### Phase 5: Removal
- Remove JSON requirement from prompt
- Remove JSON parsing requirement
- Remove fallback that discards natural responses
- Keep structured extraction as optional

---

## Rollback Strategy

**Single commit revert**: All changes in one commit
**No database changes**: Safe to revert
**Backward compatible**: Can restore JSON-required path
**Feature flags**: Can use environment variable to enable/disable natural language path

---

## Validation Plan

### Unit Tests
- Test natural language response handling
- Test optional JSON parsing
- Test structured extraction from natural language
- Test fallback behavior with natural responses

### Integration Tests
- Test conversational flow with natural language
- Test automation flow with structured extraction
- Test mixed conversation + automation flows
- Test failure modes with natural language

### Manual Tests
- Reproduce live failure scenario
- Verify ChatGPT-like conversation works
- Verify automation planning still works
- Verify artifact generation still works

### Acceptance Criteria
- User can have natural conversation
- AI responds naturally without JSON requirement
- Requirements are still persisted
- Automation planning still works
- Artifact generation still works
- Failures are handled gracefully

---

## Acceptance Criteria

### Conversational Acceptance

**Test conversation**:
> I want to build an automation for handling job applications. When someone submits a Google Form, I want the submission to be processed automatically. Don't build anything yet. Talk with me through what you need to know and help me figure out the best automation.

**Expected response**:
- Natural language response
- What ALEX understands
- What remains unclear
- One or two useful next questions
- No premature building
- No canned acknowledgement
- No requirement for special syntax

**Current behavior**: Fails — generic acknowledgement instead

### State Persistence Acceptance

**Test**: After user provides information, ALEX must:
- Retain previous information
- Incorporate new information
- Recognize corrections
- Avoid repeating the same acknowledgement
- Ask the next useful question
- Eventually know when enough information exists
- Ask for confirmation before executing

**Current behavior**: Partially works (Phase 1-3) but conversation quality fails

### Failure Mode Acceptance

**Test**: Must work even when AI response is imperfect
- Natural language response accepted
- Structured extraction optional
- Graceful degradation
- No loss of conversation state

**Current behavior**: Fails — imperfect responses trigger fallback

---

## Final Architectural Verdict

**VERDICT**: **ARCHITECTURAL REPLACEMENT REQUIRED**

**Why minimal fix is insufficient**:
- The JSON requirement is fundamental to the current architecture
- Removing JSON requirement changes the core AI interaction pattern
- The fallback path that discards natural responses is integral to current design
- The forced routing to WorkflowOrchestrator for all auto mode prevents natural conversation

**What must change**:
1. AI interaction pattern: JSON must become optional, not mandatory
2. Response handling: Natural language must be accepted, not discarded
3. Routing: Conversational and automation paths must be separated
4. Prompt: Natural conversation must be the primary instruction

**What can be preserved**:
- All database infrastructure
- All provider infrastructure
- All artifact generation infrastructure
- All persistence infrastructure (Phase 1-3)
- All file handling infrastructure
- All RAG/research infrastructure

**Estimated implementation size**: 5-8 files, ~300-500 lines

**Estimated implementation time**: 20-40 engineering hours

**Risk**: MEDIUM (requires changing core AI interaction)

**Recommendation**: Proceed with phased migration to natural-language-first architecture
