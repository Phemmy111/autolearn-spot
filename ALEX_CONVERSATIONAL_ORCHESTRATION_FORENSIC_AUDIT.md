# ALEX Conversational Orchestration Forensic Audit

## Executive Verdict

**LEVEL 2 - AI-driven orchestration wrapped in legacy workflow UX**

Despite the AI-driven orchestration layer being the actual decision maker, the user interaction is still serialized through the legacy `artifact_workflow` protocol. The LLM genuinely decides what to do next, but all AI actions (except 'respond') are transformed into the legacy question/answer wizard format before reaching the frontend. This creates a hybrid architecture where the brain is AI-driven but the interface is still a form wizard.

---

## 1. Actual Production Execution Path

```
User: "Create a lead capture bot"
  ↓
POST /api/alex/chat
  ↓
Message persisted to database
  ↓
History fetched (last 20 messages)
  ↓
AIEngine.streamChat()
  ↓
AlexOrchestrator.orchestrate()
  ↓
Intent detector (metadata only)
  ↓
Mode check: mode === 'auto' → TRUE
  ↓
WorkflowOrchestrator.orchestrateWorkflow()
  ↓
AIOrchestrator.orchestrate()
  ↓
AI receives: user message + 20 messages context + current plan
  ↓
AI decides: action.type = 'clarify'
  ↓
AIOrchestrator records question in database (OrchestrationQuestionService)
  ↓
WorkflowOrchestrator.handleOrchestrationResult()
  ↓
Switch on action.type: 'clarify'
  ↓
Returns WorkflowOrchestrationResponse with:
  - status: 'collecting_requirements'
  - message: "I need some information to proceed."
  - needsInput: true
  - question: { text, reason, options }
  ↓
AlexOrchestrator returns:
  - artifactWorkflow: workflowResponse
  ↓
AIEngine yields artifact_workflow event
  ↓
Chat route handles artifact_workflow event
  ↓
Sends SSE events:
  - type: 'delta' (message)
  - type: 'artifact_workflow' (question data)
  ↓
Frontend receives artifact_workflow
  ↓
AlexChat creates new assistant message with workflowData
  ↓
AlexMessageList renders AlexInteractiveQuestion
  ↓
User clicks option: "Website chat widget"
  ↓
CustomEvent 'alexQuestionAnswer' dispatched
  ↓
AlexChat handleQuestionAnswer receives: { field: undefined, value: 'Website chat widget' }
  ↓
sendMessage('Website chat widget')
  ↓
POST /api/alex/chat
  ↓
Cycle repeats...
```

---

## 2. `artifact_workflow` Origin

### Producer

**File**: `lib/alex/ai-engine.ts`
**Function**: Lines 312-324
**Code**:
```typescript
if (orchestratorResponse.artifactWorkflow) {
  console.log('[AI Engine] Artifact workflow response detected, yielding special event')
  yield {
    type: 'artifact_workflow',
    data: orchestratorResponse.artifactWorkflow
  }
}
```

**Source**: `orchestratorResponse.artifactWorkflow` comes from `AlexOrchestrator.orchestrate()`

### AlexOrchestrator Production

**File**: `lib/alex/orchestrator.ts`
**Function**: Lines 310-326
**Code**:
```typescript
return {
  systemPrompt: this.generateSystemPrompt(mode, detectedIntent, platformContext, enableTools),
  context: '',
  detectedIntent,
  suggestedMode,
  aiRequest: {
    messages: [
      { role: 'system', content: this.generateSystemPrompt(mode, detectedIntent, platformContext, enableTools) },
      { role: 'user', content: content }
    ],
    stream: false,
    disableTools: true
  },
  imageFiles: [],
  artifactWorkflow: workflowResponse // Special field to indicate artifact workflow
}
```

**Source**: `workflowResponse` comes from `WorkflowOrchestrator.orchestrateWorkflow()`

### WorkflowOrchestrator Production

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 132-220
**Code**:
```typescript
private async handleOrchestrationResult(...) {
  switch (action.type) {
    case 'clarify':
      return {
        status: 'collecting_requirements',
        message: action.message || 'I need some information to proceed.',
        needsInput: true,
        question: {
          text: action.question,
          reason: action.reason,
          options: action.options
        }
      }
    // ... other cases
  }
}
```

**Source**: `action` comes from `AIOrchestrator.orchestrate()`

### Consumer

**File**: `app/api/alex/chat/route.ts`
**Function**: Lines 482-512
**Code**:
```typescript
else if (chunk.type === 'artifact_workflow') {
  const message = chunk.data.message || ''
  const question = chunk.data.question
  const architectureProposal = chunk.data.architectureProposal
  
  // Send message as delta
  if (message) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: message })}\n\n`))
  }
  
  // Send question data
  if (question) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'artifact_workflow', data: { question } })}\n\n`))
  }
}
```

**File**: `components/alex/AlexChat.tsx`
**Function**: Lines 337-375
**Code**:
```typescript
else if (parsed.type === 'artifact_workflow') {
  setMessages(prev => {
    return [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversation_id: conversationToUse.id,
        role: 'assistant',
        content: parsed.data.message || '',
        created_at: new Date().toISOString(),
        workflowData: parsed.data
      }
    ]
  })
}
```

### Conclusion

`artifact_workflow` is produced by:
1. AI-driven orchestration (LLM decides action)
2. WorkflowOrchestrator transforms AI action into legacy question format
3. AlexOrchestrator wraps it in artifactWorkflow field
4. AIEngine yields it as special event
5. Chat route serializes it to SSE
6. Frontend displays it as interactive question

The protocol is **legacy**, but the decision is **AI-driven**.

---

## 3. AI Action Preservation Audit

| AI Action | Produced by LLM? | Preserved? | Transformed Into | Final UI Behavior |
| --------- | ---------------- | ---------- | ---------------- | ----------------- |
| respond | YES | YES | Direct message | Normal conversational response |
| clarify | YES | YES | artifact_workflow with question | Interactive question UI |
| recommend | YES | YES | artifact_workflow with question (options=recommendations) | Interactive question UI |
| brainstorm | YES | YES | artifact_workflow with question (options=ideas) | Interactive question UI |
| plan | YES | YES | artifact_workflow with plan | Plan display (JSON) |
| generate | YES | YES | artifact_workflow with architectureProposal | Architecture approval UI |
| execute | YES | YES | artifact_workflow with question (confirmation) | Confirmation UI |
| revise | YES | YES | artifact_workflow with plan | Plan display (JSON) |

### Transformation Location

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 144-220

**Transformation Logic**:
```typescript
switch (action.type) {
  case 'clarify':
    return {
      status: 'collecting_requirements',
      message: action.message || 'I need some information to proceed.',
      needsInput: true,
      question: {
        text: action.question,
        reason: action.reason,
        options: action.options
      }
    }
  // ... all non-respond actions transform to question format
}
```

### Critical Finding

**ALL AI actions except 'respond' are transformed into the legacy question format.**

The LLM decides which action to take, but the WorkflowOrchestrator converts all actions (except respond) into the legacy `artifact_workflow` protocol with a `question` field.

This is why the user sees a wizard UI even though the LLM is in control.

---

## 4. Question/Answer Protocol Audit

### Why `field: undefined` Occurs

**File**: `components/alex/AlexMessageList.tsx`
**Function**: Line 147
**Code**:
```typescript
const event = new CustomEvent('alexQuestionAnswer', { 
  detail: { field: workflowData.question.field, value } 
})
```

**Problem**: `workflowData.question.field` is accessed but never set.

**Where question is created**:
**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 156-160
**Code**:
```typescript
question: {
  text: action.question,
  reason: action.reason,
  options: action.options
  // NO field property
}
```

**AI action structure**:
**File**: `lib/alex/orchestration/types.ts`
**Function**: Lines 52-58
**Code**:
```typescript
type AlexNextAction =
  | { type: 'clarify'; message?: string; question: string; reason?: string; options?: string[] }
  // ... other types
  // NO field property
```

### Root Cause

The AI-driven orchestration layer was designed to be field-agnostic. The LLM decides what to ask in natural language, not which "field" to fill.

However, the frontend still expects a `field` property from the legacy wizard protocol:

```typescript
field: workflowData.question.field // Always undefined
```

### Architectural Implication

The frontend is still conceptually treating ALEX as a form wizard, expecting:
- `field` (which database column to update)
- `value` (what to set it to)

But the AI-driven backend only provides:
- `text` (natural language question)
- `reason` (why asking)
- `options` (choices)

The `field` is never set because the AI doesn't think in database columns.

---

## 5. Conversation State Audit

### What is Persisted

**File**: `app/api/alex/chat/route.ts`
**Function**: Lines 151-168
**Code**:
```typescript
const { data: userMessage } = await supabase
  .from('alex_messages')
  .insert({
    conversation_id: conversationId,
    role: 'user',
    content,
    file_ids: fileIds || [],
  })
```

**What is stored**: 
- Role: 'user'
- Content: The actual user message
- File IDs: Attached files

**What is NOT stored**:
- Synthetic answers like "Website chat widget" are stored as normal user messages
- No distinction between natural conversation and wizard answers
- No field metadata (because field is undefined)

### What is Sent Back to LLM

**File**: `app/api/alex/chat/route.ts`
**Function**: Lines 276-281
**Code**:
```typescript
const { data: historyMessages } = await supabase
  .from('alex_messages')
  .select('role, content')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
  .limit(20)
```

**File**: `lib/alex/orchestrator.ts`
**Function**: Lines 531-544
**Code**:
```typescript
const recentHistory = conversationHistory.slice(-10)
for (const msg of recentHistory) {
  if (msg.role === 'user' && msg.content === content) {
    continue // Skip current message to prevent duplication
  }
  messages.push({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  })
}
```

### Conversation Contamination Risk

**YES - Synthetic answers contaminate conversation history**

Example sequence:
```
User: "Create a lead capture bot"
Assistant: "I'll help you create a lead capture bot. Where should the leads come from?"
User: "Website chat widget" ← Stored as normal user message
Assistant: "What information should I capture?"
User: "Qualified: qualifying questions..." ← Stored as normal user message
```

**Problem**: The LLM sees these as natural user messages, not as answers to specific questions. This can cause:
- Loss of coherent automation objective
- Confusion about what information is requirements vs preferences
- Inability to distinguish between clarifications and new requests

**Impact**: The conversation history becomes a mix of natural conversation and synthetic wizard answers, making it harder for the LLM to maintain coherent automation planning.

---

## 6. `proceed` / `alright` Failure Trace

### What State Exists Before `proceed`

Based on the production sequence:
1. Multiple questions have been asked and answered
2. Each answer persisted as normal user message
3. Each question recorded in `alex_orchestration_questions` table
4. AutomationPlan evolved with each answer
5. Architecture proposal may have been generated

### What AI Orchestrator Receives

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: Lines 55-130

**Input**:
- User message: "proceed"
- Context: Last 20 messages (including all synthetic answers)
- Current plan: Evolved AutomationPlan with gathered information

**AI Decision**:
The AI should detect that the user wants to proceed with generation.

### What Goes Wrong

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: Lines 80-106
**Code**:
```typescript
if (aiDecision.action.type === 'clarify' && context.userId && context.conversationId) {
  const question = aiDecision.action.question
  const contextStr = aiDecision.action.reason || 'general'
  
  const shouldAsk = await OrchestrationQuestionService.shouldAsk({
    conversationId: context.conversationId,
    userId: context.userId,
    question,
    questionContext: contextStr
  })
  
  if (shouldAsk) {
    await OrchestrationQuestionService.recordQuestion(...)
  } else {
    console.log('[AI Orchestrator] Question prevented by persistent tracker:', question.substring(0, 50))
    // Fallback to respond instead
    aiDecision.action = {
      type: 'respond',
      message: "I think we've already discussed that. Let me proceed with what we have."
    }
  }
}
```

### Root Cause

**The AI decides to ask a question, but the question tracker prevents it.**

Possible scenarios:
1. AI decides to ask "Are you ready to proceed?"
2. Question tracker finds a similar question was asked in the last hour
3. `shouldAsk` returns false
4. Action is changed to 'respond' with fallback message
5. Same message repeats for "alright"

### Why This Happens

The question prevention logic is **too aggressive**. It prevents asking ANY question that was asked in the last hour, even if:
- The question is contextually different
- The previous question was answered
- The user is now ready to proceed
- The question is a confirmation, not a requirement gathering

### Additional Possibility

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: Lines 109-126
**Code**:
```typescript
if (aiDecision.intent === 'answer_question' && context.userId && context.conversationId) {
  const unanswered = await OrchestrationQuestionService.getUnansweredQuestions(...)
  if (unanswered.length > 0) {
    const mostRecent = unanswered[0]
    await OrchestrationQuestionService.recordAnswer(...)
  }
}
```

If "proceed" is detected as `answer_question` intent but there are no unanswered questions, the answer recording might fail silently, causing the AI to fall back to the default response.

---

## 7. AutomationPlan Authority Audit

### Where AutomationPlan is Created

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Function**: Lines 55-130
**Created by**: LLM in AI decision
**Stored in**: `alex_artifact_builds.automation_plan` (JSONB column)

### Where AutomationPlan is Loaded

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 323-356
**Code**:
```typescript
private async loadCurrentPlan(...): Promise<AutomationPlan | null> {
  const build = await ArtifactService.getActiveBuild(conversationId, userId)
  if (build) {
    if (build.automation_plan) {
      return build.automation_plan as AutomationPlan
    }
    if (build.final_specification) {
      return this.specToPlan(build.final_specification)
    }
  }
  return null
}
```

### Where AutomationPlan is Converted to AutomationSpec

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 220-295
**Code**:
```typescript
private async handleGenerate(plan: AutomationPlan, request: WorkflowOrchestrationRequest) {
  const spec = this.planToSpec(plan)
  // ... generate architecture using spec
}
```

### Conversion Details

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 260-318
**Code**:
```typescript
private planToSpec(plan: AutomationPlan): AutomationSpec {
  const spec: AutomationSpec = {
    description: plan.objective,
    // ... map plan fields to spec fields
  }
  return spec
}
```

### Information Loss

**Potential loss during conversion**:
- AutomationPlan is flexible (evolving structure)
- AutomationSpec is rigid (fixed schema)
- `plan.assumptions` → Not directly mapped to spec
- `plan.recommendations` → Not directly mapped to spec
- Natural language descriptions → Converted to specific field values

### Source of Truth

**AutomationPlan is the source of truth for orchestration decisions.**
**AutomationSpec is the source of truth for artifact generation.**

However, the conversion is one-way:
- Plan → Spec (when generating)
- Spec → Plan (when loading from legacy builds)

The bidirectional conversion creates a risk of information loss and schema drift.

---

## 8. Remaining Deterministic Gates

### Intent Detector

**File**: `lib/alex/intent-detector.ts`
**Status**: Still runs, but metadata only
**Authority**: NO routing authority
**Purpose**: Analytics, UI hints

### Question Tracker

**File**: `lib/alex/orchestration/orchestration-question-service.ts`
**Status**: Active
**Authority**: YES - can override AI decision
**Purpose**: Prevent repeated questions
**Risk**: Too aggressive - prevents legitimate confirmations

### WorkflowOrchestrator Action Switch

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 144-220
**Status**: Active
**Authority**: YES - transforms all AI actions to legacy format
**Purpose**: Maintain legacy protocol compatibility
**Risk**: All actions become question format, losing conversational nuance

### Artifact Workflow Protocol

**File**: Multiple (ai-engine.ts, route.ts, AlexChat.tsx)
**Status**: Active
**Authority**: YES - all non-respond actions go through this protocol
**Purpose: Legacy UI compatibility
**Risk**: Conversational AI wrapped in wizard UX

---

## 9. Assumption Handling Audit

### Plan Structure

**File**: `lib/alex/orchestration/types.ts`
**Fields**:
- `assumptions: string[]` - Explicit assumptions
- `recommendations: string[]` - AI recommendations
- `objective: string` - User's stated goal
- `trigger`, `inputs`, `outputs`, `platform` - Specific fields

### How Assumptions Are Handled

**File**: `lib/alex/orchestration/workflow-orchestrator.ts`
**Function**: Lines 342-409
**Code**:
```typescript
private specToPlan(spec: AutomationSpec): AutomationPlan {
  const plan: AutomationPlan = {
    objective: spec.description || 'Unknown automation',
    status: 'draft'
  }
  
  if (spec.assumptions) {
    plan.assumptions = spec.assumptions
  }
  
  if (spec._knownFields) {
    plan.assumptions = plan.assumptions || []
    plan.assumptions.push(`Known fields: ${spec._knownFields.join(', ')}`)
  }
  
  return plan
}
```

### Production Evidence

The production response included invented details:
- "30-minute calendar call"
- "sales@yourcompany.com"
- "specific qualification thresholds"

**These are NOT in the assumptions array.**

### Root Cause

The LLM silently converts assumptions into requirements during plan generation. There is no explicit separation between:
- Known requirements (user provided)
- Assumptions (AI inferred, should be surfacable)
- Recommendations (AI suggestions, user should approve)
- Defaults (reasonable values, not critical)

The architecture has the structure to track this, but the LLM prompt and plan generation do not enforce it.

---

## 10. Architecture Level

### LEVEL 2 - AI-driven orchestration wrapped in legacy workflow UX

**Justification**:

1. **AI is genuinely in control of orchestration decisions**
   - LLM decides which action to take (8 options)
   - LLM decides what questions to ask
   - LLM decides when to proceed
   - No deterministic gatekeeper prevents this

2. **But the UI is still legacy wizard protocol**
   - All AI actions except 'respond' transform to `artifact_workflow`
   - Frontend expects `field` property (always undefined)
   - Conversation is serialized as question/answer pairs
   - No genuine conversational interface

3. **AutomationPlan is authoritative for orchestration**
   - Plan is persisted and loaded correctly
   - AI decisions are based on current plan
   - But conversion to AutomationSpec loses information

4. **Remaining deterministic gates**
   - Question tracker can override AI (too aggressive)
   - WorkflowOrchestrator forces legacy format
   - No conversational interface for AI actions

The brain is AI-driven, but the interface is still a form wizard.

---

## 11. Root Causes

### P0 - Architectural Blocker

**Legacy `artifact_workflow` protocol is the only UI contract**

- All AI actions are forced into question format
- Frontend expects wizard UI, not conversational UI
- No alternative interface for conversational AI
- Cannot remove `artifact_workflow` without breaking UI

### P1 - Major Behavioral Defect

**Question tracker is too aggressive**

- Prevents asking questions asked in last hour
- Blocks legitimate confirmations
- Causes "proceed" to fail with fallback message
- No distinction between requirement gathering and confirmation

### P1 - Major Behavioral Defect

**Conversation contamination**

- Synthetic answers stored as normal user messages
- LLM cannot distinguish answers from natural conversation
- Loss of coherent automation objective
- No separation between wizard state and conversation history

### P2 - Secondary Defect

**Frontend expects `field` property**

- `field` is always undefined in AI-driven path
- Legacy field/question architecture never removed
- Frontend still conceptually a form wizard

### P2 - Secondary Defect

**Assumption handling not enforced**

- LLM silently converts assumptions to requirements
- No explicit separation in plan generation
- User cannot see what is assumed vs provided

### P3 - Cleanup

**AutomationSpec conversion loses information**

- Plan → Spec conversion is lossy
- Assumptions and recommendations not preserved
- Schema drift between plan and spec

---

## 12. Minimal Corrective Architecture

### Required Changes

**1. Create conversational UI contract**

Instead of `artifact_workflow` with `question`, create:
- `conversational_action` with `action_type` and `action_data`
- Frontend renders based on action type:
  - `respond`: Display message
  - `clarify`: Display natural language question (no field)
  - `recommend`: Display recommendations as cards
  - `brainstorm`: Display ideas as list
  - `plan`: Display plan as structured view
  - `generate`: Show generation progress
  - `execute`: Show execution status
  - `revise`: Show revision diff

**2. Remove question tracker override**

- Question tracker should only suggest, not override
- AI should decide whether to ask
- Remove fallback to "I think we've already discussed that"

**3. Separate conversation from wizard state**

- Create separate table for wizard answers
- Do not persist synthetic answers as user messages
- LLM receives clean conversation history
- Wizard state is separate context

**4. Enforce assumption handling**

- LLM prompt must distinguish requirements vs assumptions
- Plan generation must populate assumptions array
- UI must surface assumptions for user review
- User can accept/reject assumptions

**5. Remove field property requirement**

- Frontend should not expect `field`
- AI orchestrator is field-agnostic
- Remove `field` from question structure entirely

### Execution Path After Correction

```
User
  ↓
Conversational interface
  ↓
AI orchestrator
  ↓
Persistent AutomationPlan
  ↓
AI next action (8 types)
  ↓
Conversational UI (action-based rendering)
  ↓
User response (natural language)
  ↓
Cycle continues
```

---

## 13. Migration Risks

### High Risk

- **Removing `artifact_workflow` protocol** would break all existing workflow UI
- **Frontend changes required** for conversational rendering
- **Database schema changes** for conversation/wizard separation

### Medium Risk

- **Question tracker logic changes** could cause repeated questions
- **Conversation history changes** could affect LLM context
- **Assumption enforcement** could change LLM behavior

### Low Risk

- **Removing field property** is backward compatible (already undefined)
- **Plan conversion improvements** are additive

---

## 14. Files Requiring Changes

### Backend

1. **lib/alex/orchestration/workflow-orchestrator.ts**
   - Remove action → question transformation
   - Return action directly, not wrapped in question format
   - Add conversational action serializer

2. **lib/alex/orchestration/ai-orchestrator.ts**
   - Remove question tracker override logic
   - Make question tracker advisory only
   - Add assumption enforcement in plan handling

3. **lib/alex/ai-engine.ts**
   - Replace `artifact_workflow` event with `conversational_action` event
   - Serialize action type and data directly

4. **app/api/alex/chat/route.ts**
   - Handle `conversational_action` instead of `artifact_workflow`
   - Remove question-specific serialization
   - Add action-based event streaming

5. **lib/alex/orchestration/orchestration-question-service.ts**
   - Change from blocking to advisory
   - Return suggestion, not boolean
   - Let AI decide whether to accept suggestion

### Frontend

6. **components/alex/AlexChat.tsx**
   - Handle `conversational_action` events
   - Render based on action type
   - Remove wizard-specific handling

7. **components/alex/AlexMessageList.tsx**
   - Remove `field` property usage
   - Add action-based rendering components
   - Remove AlexInteractiveQuestion dependency

8. **components/alex/AlexInteractiveQuestion.tsx**
   - Make field-agnostic
   - Remove field validation
   - Simplify to natural language question UI

### Database

9. **migrations/alex-conversation-wizard-separation.sql** (new)
   - Create separate table for wizard answers
   - Add foreign key to conversation
   - Add answer type (requirement vs preference vs assumption)

---

## 15. Final Answer to Critical Question

> At the exact moment ALEX decides what to do next, is the LLM genuinely in control of the conversation, or is some legacy deterministic component still capable of overriding, translating, or constraining that decision?

**Answer: The LLM is genuinely in control of the decision, but legacy components translate and constrain the presentation.**

**Evidence**:
1. LLM decides action type (8 options) freely
2. No deterministic gatekeeper prevents AI decision
3. Intent detector is metadata only
4. **BUT**: WorkflowOrchestrator transforms all actions to legacy question format
5. **BUT**: Question tracker can override AI decision (too aggressive)
6. **BUT**: Frontend expects wizard UI, not conversational UI

**Conclusion**: The brain is AI-driven, but the interface is still legacy. The LLM decides what to do, but the system forces that decision into the old wizard protocol before the user sees it.