# WORKFLOW STATE FORENSIC AUDIT REPORT

## A. CONFIRMED ROOT CAUSE(S)

### Primary Root Cause: AI JSON Parsing Failure Cascades to State Loss

**Failure Boundary**: `lib/alex/orchestration/ai-orchestrator.ts` lines 302-321

**Exact Failure Path**:
1. Workflow AI Service returns raw AI response
2. AI Orchestrator attempts JSON extraction: `response.match(/\{[\s\S]*\}/)` (line 302)
3. JSON.parse() fails with: `SyntaxError: Bad control character in string literal in JSON`
4. Catch block executes (line 319-321)
5. Falls back to `getFallbackDecision()` which returns generic clarify action
6. No plan is extracted, no plan persistence occurs
7. Workflow state is lost

**Why This Is Critical**:
- The entire workflow state management depends on successfully parsing AI-generated JSON
- When JSON is malformed, the system discards the entire AI response
- There is no independent persistence of user requirements
- Fallback logic does not preserve in-progress workflow state

### Secondary Root Cause: No Independent Requirement Persistence

**Failure Boundary**: Database schema and architecture

**Current Architecture**:
- User requirements (Google Form, Gmail, automatic scoring) only exist in:
  - Conversation history (alex_messages)
  - AI reasoning within individual responses
- No dedicated table for accumulating confirmed user requirements
- `automation_plan` column only populated when AI successfully returns `action.type === 'plan'`
- No mechanism to incrementally persist requirements as users answer questions

**Why This Is Critical**:
- When AI JSON fails, all accumulated requirements are lost
- System cannot recover workflow state from conversation history alone
- Fallback logic has no database state to fall back to

## B. CURRENT STATE-AUTHORITY MAP

| State Source | Storage | Authority | Persistence Mechanism | Recovery Method |
|--------------|---------|------------|---------------------|-----------------|
| Conversation History | alex_messages | HIGH | Every message persisted | AI decision prompt context |
| Build Record | alex_artifact_builds | MEDIUM | Created on plan action | getActiveBuild() |
| Automation Plan | alex_artifact_builds.automation_plan | HIGH | Saved on plan action | loadCurrentPlan() |
| AI Decision | Transient | VERY HIGH | Not persisted | Re-generated each turn |
| User Requirements | Conversation history only | LOW | Via messages only | AI interpretation |
| Question/Answer Pairs | alex_orchestration_questions | MEDIUM | OrchestrationQuestionService | getUnansweredQuestions() |
| currentPlan | Transient (loaded from DB) | HIGH | Derived from automation_plan | loadCurrentPlan() |

**Authority Problem**: AI decision is treated as authoritative source of truth, but it's transient and can fail. Database state should be authoritative but is currently dependent on successful AI JSON parsing.

## C. EXACT FAILURE BOUNDARY

**File**: `lib/alex/orchestration/ai-orchestrator.ts`
**Lines**: 302-321

**Code**:
```typescript
const jsonMatch = response.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  const result = JSON.parse(jsonMatch[0])  // ← FAILS HERE
  // ... process result
}
// Fallback if JSON parsing fails
console.error('[AI Orchestrator] Failed to parse AI decision, using fallback')
return this.getFallbackDecision(userMessage, currentPlan)  // ← DISCARDS STATE
```

**Fallback Logic** (lines 381-414):
```typescript
private getFallbackDecision(userMessage: string, currentPlan: AutomationPlan | null): OrchestrationResult {
  if (!currentPlan) {
    return {
      action: { type: 'clarify', question: 'What automation would you like me to help you create?' },
      intent: 'new_automation',
      confidence: 0.3,
      reasoning: 'AI decision failed, using fallback for new request'
    }
  }
  // If current plan exists, treat as answer
  return {
    action: { type: 'respond', message: 'I understand. Let me continue with your automation.' },
    intent: 'answer_question',
    confidence: 0.3,
    reasoning: 'AI decision failed, using fallback for continuation'
  }
}
```

**Critical Issue**: Fallback logic checks `currentPlan` (loaded from DB), but if AI JSON never reaches `action.type === 'plan'`, then `automation_plan` was never populated, so `currentPlan` is null, triggering the generic "new request" fallback even though workflow is in progress.

## D. MINIMAL TARGET ARCHITECTURE

### Proposed Architecture
```
DATABASE WORKFLOW STATE (authoritative)
    ↓
ORCHESTRATOR (reads state, validates AI decisions)
    ↓
AI DECISION (validated against schema)
    ↓
NEXT QUESTION / ACTION (updates state if valid)
```

### Key Principles
1. **Database state is authoritative**: Workflow state should be incrementally persisted as users answer questions, independent of AI JSON success
2. **AI decisions are validated, not trusted**: Parse AI JSON, validate against schema, reject invalid decisions without discarding existing state
3. **Malformed AI output is recoverable**: If AI JSON fails, continue with existing workflow state from database
4. **Fallback uses database state**: When AI fails, fallback should consult accumulated requirements in database, not reset to generic state
5. **Incremental requirement persistence**: Each user answer should be recorded and accumulated in database before AI decision

### Required Database Changes
- No new migrations needed (alex_artifact_builds.automation_plan and alex_orchestration_questions exist)
- Leverage existing `requirements_collected` column in alex_artifact_builds
- Use alex_orchestration_questions for question/answer tracking

## E. EXACT FILES/FUNCTIONS REQUIRING CHANGES

### 1. lib/alex/orchestration/ai-orchestrator.ts
**Function**: `askAIDecision()` (lines 85-323)
**Changes Required**:
- Add JSON schema validation before accepting AI decision
- Reject malformed JSON without falling back to state-resetting logic
- When AI JSON fails, preserve existing currentPlan and continue workflow
- Remove state-resetting fallback logic when currentPlan exists

**Function**: `getFallbackDecision()` (lines 381-414)
**Changes Required**:
- If currentPlan exists, return action that continues with existing plan
- Never reset to generic "new request" when workflow is in progress
- Use accumulated requirements from database if available

### 2. lib/alex/orchestration/workflow-orchestrator.ts
**Function**: `handleOrchestrationResult()` (lines 119-245)
**Changes Required**:
- Before processing AI action, validate it makes sense for current workflow state
- If AI returns clarify but requirements already accumulated, proceed to plan generation
- Incrementally update build.requirements_collected as user answers questions
- Persist user requirements independent of AI plan action

**Function**: `savePlan()` (lines 585-675)
**Changes Required**:
- Ensure build.requirements_collected is updated when plan is saved
- Plan should merge accumulated requirements with AI-generated plan

### 3. lib/alex/orchestration/orchestration-question-service.ts
**Functions**: `recordQuestion()`, `recordAnswer()` (existing)
**No changes needed** - Already provides question/answer persistence

## F. ESTIMATED SCOPE OF FIX

**Complexity**: MEDIUM
**Files to modify**: 3 files
**Functions to modify**: 4 functions
**Estimated lines of code**: 80-120 lines
**Risk**: LOW-MEDIUM (no schema changes, existing infrastructure can be leveraged)

## G. EXPLICIT RISKS/REGRESSIONS

### Risks
1. **AI decision validation**: May reject valid AI decisions if schema is too strict
2. **Fallback logic changes**: May cause unexpected behavior if not carefully tested
3. **State synchronization**: Need to ensure database state stays consistent with AI decisions

### Regressions to Avoid
1. **Normal chat**: Should not be affected (no workflow state)
2. **New automation**: Should still work with accumulation
3. **Plan generation**: Should still work when AI JSON is valid
4. **Question tracking**: Should continue to work with existing infrastructure

## H. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Make AI JSON Parsing Robust
1. Add schema validation to AI decision parsing
2. Make malformed JSON recoverable without state loss
3. Update fallback logic to preserve currentPlan when it exists

### Phase 2: Incremental Requirement Persistence
1. Update handleOrchestrationResult to accumulate requirements as answers come in
2. Update build.requirements_collected with confirmed user requirements
3. Merge accumulated requirements with AI-generated plan

### Phase 3: State-Aware Orchestration
1. When AI returns clarify but requirements are sufficient, proceed to plan
2. Use database state to guide AI decisions when AI is uncertain
3. Ensure workflow state survives AI failures

### Phase 4: Validation
1. Test malformed JSON scenarios
2. Test accumulation across multiple clarification rounds
3. Test provider failure scenarios
4. Verify no state loss in any failure mode

## WAITING FOR APPROVAL

The forensic audit is complete. The root cause has been identified as AI JSON parsing failure cascading to state loss due to lack of independent requirement persistence. The proposed minimal architecture leverages existing database infrastructure without requiring schema changes.

Do not implement until approved.
