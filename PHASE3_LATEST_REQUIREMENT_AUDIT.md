# PHASE 3 LATEST REQUIREMENT AUDIT

## Executive Summary

**AUDIT RESULT**: **PHASE 3 REQUIRED — MINIMAL FIX IDENTIFIED**

Phase 2 successfully protects **existing** `requirements_collected` state from AI failures, but does **NOT** guarantee persistence of **new** user requirements from the current turn when AI fails.

The critical failure boundary is in `AIOrchestrator.askAIDecision()`: new user requirements can only reach `requirements_collected` via successful AI JSON parsing. If AI fails, the new requirement is lost.

**KEY FINDING**: The user message itself IS persisted to `alex_messages` before AI orchestration, but this raw natural language is never used to reconstruct requirements after AI failure.

---

## Exact Message Lifecycle

### User Message Entry → Database Persistence

**File**: `app/api/alex/chat/route.ts` (lines 143-175)

```
POST /api/alex/chat
  ↓
User message received (content)
  ↓
Auth validation (lines 30-57)
  ↓
Rate limit check (lines 59-65)
  ↓
Body parsing: { conversationId, content, mode, fileIds, ... }
  ↓
Conversation ownership verification (lines 130-141)
  ↓
=== CRITICAL: User message persisted BEFORE AI ===
  ↓
alex_messages.insert() (lines 153-162)
  - conversation_id
  - role: 'user'
  - content (raw natural language)
  - file_ids
  ↓
Message persistence logged (lines 164-170)
  ↓
Title generation (if needed) (lines 177-229)
  ↓
Conversation timestamp update (lines 236-241)
```

**EVIDENCE**: User message is guaranteed to be in `alex_messages` before any AI call.

### Conversation History Loading

**File**: `app/api/alex/chat/route.ts` (lines 356-366)

```
alex_messages.select()
  - WHERE conversation_id = conversationId
  - ORDER BY created_at ASC
  - LIMIT 20
  ↓
conversationHistory = [{ role, content } ... ]
```

**EVIDENCE**: Full conversation history including the just-persisted user message is available for context.

### Workflow Orchestrator Entry

**File**: `app/api/alex/chat/route.ts` (lines 567-613)

```
AIEngine.streamChat()
  ↓
AlexOrchestrator.orchestrate()
  ↓
WorkflowOrchestrator.orchestrateWorkflow() (lines 168-182)
  ↓
WorkflowOrchestrator.loadCurrentPlan() (lines 86)
```

**File**: `lib/alex/orchestration/workflow-orchestrator.ts` (lines 59-112)

```
orchestrateWorkflow()
  ↓
Build ConversationContext (lines 69-78)
  ↓
Load current plan (line 86)
  ↓
AIOrchestrator.orchestrate() (lines 89-93)
```

### AI Orchestration — THE CRITICAL FAILURE BOUNDARY

**File**: `lib/alex/orchestration/ai-orchestrator.ts` (lines 45-173)

```
AIOrchestrator.orchestrate()
  ↓
askAIDecision() (line 69)
  ↓
=== BUILD AI PROMPT ===
  ↓
Prompt construction (lines 187-293)
  - User message
  - Recent messages (last 20)
  - Current plan (if exists)
  ↓
AIService.generateResponse() (line 298)
  ↓
=== AI PROVIDER CALL ===
  ↓
=== JSON PARSING ===
  ↓
const jsonMatch = response.match(/\{[\s\S]*\}/) (line 302)
  ↓
const result = JSON.parse(jsonMatch[0]) (line 304)
  ↓
=== REQUIREMENT EXTRACTION ===
  ↓
extractRequirementUpdate(result.updatedPlan, currentPlan) (line 308)
  ↓
return { action, intent, updatedPlan, requirementUpdate, ... } (lines 310-318)
```

**FAILURE PATH** (lines 321-327):

```
JSON.parse() throws
  OR
response.match() returns null
  ↓
console.error('[AI Orchestrator] Failed to parse AI decision, using fallback')
  ↓
getFallbackDecision(userMessage, currentPlan, context)
```

### Fallback Decision — EXISTING STATE PROTECTED

**File**: `lib/alex/orchestration/ai-orchestrator.ts` (lines 422-479)

```
getFallbackDecision()
  ↓
=== CHECK FOR EXISTING REQUIREMENTS ===
  ↓
ArtifactService.getActiveBuild(context.conversationId, context.userId) (line 440)
  ↓
if (build?.requirements_collected && Object.keys(build.requirements_collected).length > 0) (line 441)
  ↓
hasExistingRequirements = true (line 442)
  ↓
if (!currentPlan && !hasExistingRequirements) (line 453)
  ↓
  → Generic "new request" clarification
  ↓
if (currentPlan exists OR hasExistingRequirements) (line 461)
  ↓
  → "I understand. Let me continue with your automation"
  → (Preserves existing state)
```

**CRITICAL**: Fallback does NOT attempt to extract requirements from the current user message.

### Requirement Persistence — REQUIRES SUCCESSFUL AI

**File**: `lib/alex/orchestration/workflow-orchestrator.ts` (lines 119-153)

```
handleOrchestrationResult()
  ↓
const { action, updatedPlan, requirementUpdate } = result (line 125)
  ↓
if (requirementUpdate) (line 130)
  ↓
Ensure build exists (lines 133-148)
  ↓
ArtifactService.updateRequirements(buildId, requirementUpdate) (line 151)
```

**CRITICAL**: `requirementUpdate` only exists if `askAIDecision()` successfully returned it. If AI fails, `requirementUpdate` is `undefined` and no persistence occurs.

---

## Scenario-by-Scenario Failure Analysis

### Scenario 1 — Normal AI Response

**User**: "Use Google Forms and automatically score applicants."

**Flow**:
1. User message persisted to `alex_messages` ✅
2. AI processes message successfully ✅
3. AI returns `updatedPlan` with `platform: { name: "Google Forms" }` ✅
4. `extractRequirementUpdate()` extracts platform change ✅
5. `requirementUpdate = { platform: { name: "Google Forms" } }` ✅
6. `ArtifactService.updateRequirements()` merges into `requirements_collected` ✅
7. **RESULT**: Requirement persisted ✅

**FAILURE MODE**: None — this is the happy path.

---

### Scenario 2 — Malformed AI JSON

**User**: "Actually, also send qualified applicants to Gmail."

**AI Response**: Malformed JSON (e.g., `SyntaxError: Bad control character in string literal`)

**Flow**:
1. User message persisted to `alex_messages` ✅
2. AI processes message
3. AI returns malformed JSON ❌
4. `JSON.parse()` throws ❌
5. `getFallbackDecision()` called ❌
6. Fallback loads existing `requirements_collected` ✅
7. Fallback returns generic continuation message ✅
8. **RESULT**: Gmail requirement LOST ❌

**WHERE LOST**: The raw user message exists in `alex_messages`, but is never used to extract requirements in the fallback path.

**CAN RECOVER**: YES — the raw message is still in `alex_messages` and could be reprocessed later.

---

### Scenario 3 — Provider Timeout

**User**: "Actually, also send qualified applicants to Gmail."

**Flow**:
1. User message persisted to `alex_messages` ✅
2. AI provider times out ❌
3. `WorkflowAIService.generateResponse()` throws ❌
4. `askAIDecision()` catch block (line 325) ❌
5. `getFallbackDecision()` called ❌
6. Fallback loads existing `requirements_collected` ✅
7. **RESULT**: Gmail requirement LOST ❌

**WHERE LOST**: Same as Scenario 2 — raw message exists but not reprocessed.

---

### Scenario 4 — All Providers Fail

**User**: "Actually, also send qualified applicants to Gmail."

**Flow**:
1. User message persisted to `alex_messages` ✅
2. Primary provider fails ❌
3. ProviderManager fallback fails ❌
4. All providers exhausted ❌
5. Provider error propagates to `askAIDecision()` ❌
6. `getFallbackDecision()` called ❌
7. **RESULT**: Gmail requirement LOST ❌

**WHERE LOST**: Same as Scenarios 2 and 3.

---

### Scenario 5 — AI Returns Valid JSON but Omits New Requirement

**User**: "Actually, also send qualified applicants to Gmail."

**AI Response**: Valid JSON but `updatedPlan` does NOT include Gmail

**Flow**:
1. User message persisted to `alex_messages` ✅
2. AI returns valid JSON ✅
3. JSON parsing succeeds ✅
4. `updatedPlan` does NOT include Gmail ❌
5. `extractRequirementUpdate()` compares currentPlan vs updatedPlan
6. No difference detected → `requirementUpdate = undefined` ❌
7. `handleOrchestrationResult()` skips persistence (line 130) ❌
8. **RESULT**: Gmail requirement LOST ❌

**WHERE LOST**: AI successfully parses but fails to include the requirement in the structured output. This is a **silent failure** that Phase 2 does not address.

---

## Phase 2 Verification

### What Phase 2 Actually Fixed

**File**: `lib/alex/orchestration/ai-orchestrator.ts` (lines 422-479)

**Added**: `getFallbackDecision()` loads existing `requirements_collected`

**Protection**: Previously-persisted requirements survive AI failures.

**Evidence**:
```typescript
if (build?.requirements_collected && Object.keys(build.requirements_collected).length > 0) {
  hasExistingRequirements = true
  console.log('[AI Orchestrator] Fallback: Found existing requirements in database:', Object.keys(build.requirements_collected))
}
```

### What Phase 2 Did NOT Fix

**Missing**: Extraction of new requirements from the current user message when AI fails.

**Evidence**: `getFallbackDecision()` never attempts to parse the current `userMessage` parameter.

---

## Current Authority Map

### Component Authority Hierarchy

```
1. USER MESSAGE (alex_messages.content)
   - Raw natural language
   - Persisted BEFORE AI
   - Never used for requirement extraction after AI failure
   - Authority: CONVERSATION HISTORY (not workflow state)

2. CONVERSATION HISTORY (alex_messages - last 20)
   - Loaded for AI context
   - Loaded for fallback context
   - Never parsed for structured requirements
   - Authority: CONVERSATION CONTEXT (not workflow state)

3. requirements_collected (alex_artifact_builds.requirements_collected)
   - Incremental JSON object
   - Merged via updateRequirements()
   - Only updated when AI succeeds
   - Loaded in fallback for preservation
   - Authority: WORKFLOW STATE (authoritative for persistence)

4. updatedPlan (AI output)
   - Structured automation plan
   - Source of requirement extraction
   - Required for extractRequirementUpdate()
   - Authority: AI OUTPUT (intermediate representation)

5. automation_plan (alex_artifact_builds.automation_plan)
   - Full automation plan
   - Persisted separately
   - Derived from updatedPlan
   - NOT used for incremental requirements
   - Authority: DERIVED STATE (not primary requirements)

6. final_specification (alex_artifact_builds.final_specification)
   - Final artifact specification
   - Generated for artifact creation
   - Untouched by Phase 2
   - Authority: ARTIFACT GENERATION (not workflow state)

7. AI Decision (OrchestrationResult)
   - Current authority for routing
   - Fails on malformed JSON
   - No backup authority
   - Authority: ROUTING DECISION (single point of failure)

8. Fallback Decision (getFallbackDecision)
   - Backup routing when AI fails
   - Preserves existing state
   - Does NOT extract new requirements
   - Authority: FALLBACK ROUTING (preservation only)
```

**CONCLUSION**: `requirements_collected` is authoritative for workflow state, but its **updates are solely dependent on successful AI JSON generation**.

---

## Existing Reusable Mechanisms

### Conversation Message Persistence

**Location**: `app/api/alex/chat/route.ts` (lines 153-162)

**Mechanism**: `alex_messages.insert()` before AI orchestration

**Reusability**: HIGH — user message already persisted and available

**Usage**: Loaded as conversation history, but never parsed for requirements

### Intent Detection

**Location**: `lib/alex/intent-detector.ts`

**Mechanism**: Keyword-based pattern matching

**Reusability**: LIMITED — detects high-level intent, not specific requirements

**Current Usage**: Advisory metadata only, not routing authority

### Memory Command Detection

**Location**: `lib/alex/memory/memory-commands.ts`

**Mechanism**: Pattern matching for "remember X", "forget X", "clear"

**Reusability**: LIMITED — specific to memory commands, not general requirements

**Current Usage**: Handled before AI orchestration (chat route lines 322-354)

### Semantic Analysis

**Location**: `lib/alex/artifact-generation/semantic-analyzer.ts`

**Mechanism**: Extracts structured data from natural language

**Reusability**: HIGH — designed for requirement extraction

**Current Usage**: Artifact generation (not active orchestration)

### Intelligence Analyzer

**Location**: `lib/alex/artifact-generation/intelligence-analyzer.ts`

**Mechanism**: Analyzes automation requirements and extracts fields

**Reusability**: HIGH — specifically designed for requirement extraction

**Current Usage**: WorkflowManager (not active orchestration)

### Workflow JSON Parser

**Location**: `lib/alex/workflows/workflow-parser.ts`

**Mechanism**: Parses structured workflow definitions

**Reusability**: LOW — expects structured input, not natural language

**Current Usage**: Workflow generation (not active orchestration)

---

## Root Cause

### Single Point of Failure

**Location**: `lib/alex/orchestration/ai-orchestrator.ts` (lines 302-318)

**Root Cause**: Requirement extraction requires successful AI JSON parsing.

**Code Path**:
```typescript
const jsonMatch = response.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  const result = JSON.parse(jsonMatch[0])  // ← SINGLE POINT OF FAILURE
  const requirementUpdate = this.extractRequirementUpdate(result.updatedPlan, currentPlan)
  return { ..., requirementUpdate }
}
// ← If we reach here, requirementUpdate is NEVER created
return this.getFallbackDecision(userMessage, currentPlan, context)
```

**Why This Fails**:
1. If `JSON.parse()` throws → no `requirementUpdate`
2. If `response.match()` returns null → no `requirementUpdate`
3. If AI omits requirement from `updatedPlan` → `requirementUpdate = undefined`
4. Fallback path never creates `requirementUpdate`

### Architectural Gap

**Gap**: Natural language requirements are only processed by AI in a single fail-critical path.

**Missing**: Alternative extraction path that does not depend on successful AI JSON generation.

**Existing Data**: Raw user message is already persisted in `alex_messages` but never used for post-failure requirement extraction.

---

## Minimal Fix Options

### Option 1: Add Fallback Requirement Extraction

**Approach**: Add lightweight requirement extraction in `getFallbackDecision()`

**Files Changed**:
- `lib/alex/orchestration/ai-orchestrator.ts` (~20 lines)

**Implementation**:
```typescript
private async getFallbackDecision(...): Promise<OrchestrationResult> {
  // Load existing requirements (current code)
  const build = await ArtifactService.getActiveBuild(...)
  const existingRequirements = build?.requirements_collected || {}

  // NEW: Extract from current user message
  const newRequirements = this.extractRequirementsFromMessage(userMessage)

  // NEW: Merge and persist
  if (Object.keys(newRequirements).length > 0) {
    const merged = { ...existingRequirements, ...newRequirements }
    await ArtifactService.updateRequirements(buildId, merged)
  }

  // Return with preserved/updated state
  return { ... }
}
```

**Pros**:
- Minimal code change
- Reuses existing `updateRequirements()`
- No database schema changes
- No new files
- Uses existing persisted message

**Cons**:
- Fallback extraction may be less accurate than AI
- Needs extraction logic (regex or lightweight AI)
- May have false positives/negatives

**Risk**: LOW — additive change, doesn't affect happy path

**Latency Impact**: MINIMAL — only on failure path

**Provider Dependency**: NONE — can use deterministic extraction

---

### Option 2: Pre-AI Requirement Extraction

**Approach**: Extract requirements before AI orchestration in chat route

**Files Changed**:
- `app/api/alex/chat/route.ts` (~30 lines)
- `lib/alex/orchestration/types.ts` (~5 lines)

**Implementation**:
```typescript
// After message persistence (line 175)
const requirementUpdate = extractRequirementsFromMessage(content, conversationHistory)

// If extraction succeeds, persist immediately
if (requirementUpdate) {
  const build = await ArtifactService.getActiveBuild(...)
  await ArtifactService.updateRequirements(build.id, requirementUpdate)
}

// Then proceed to AI orchestration
```

**Pros**:
- Requirements persisted before AI call
- Guaranteed to survive AI failures
- AI can use pre-extracted requirements as context
- Idempotent — AI can still update if it finds more

**Cons**:
- Requires extraction logic
- May duplicate AI's work
- Could persist incorrect requirements

**Risk**: MEDIUM — changes happy path

**Latency Impact**: MINIMAL — deterministic extraction

**Provider Dependency**: NONE — can use deterministic extraction

---

### Option 3: Post-Failure AI Reprocessing

**Approach**: On AI failure, call a separate AI to extract requirements from the persisted message

**Files Changed**:
- `lib/alex/orchestration/ai-orchestrator.ts` (~25 lines)

**Implementation**:
```typescript
private async getFallbackDecision(...): Promise<OrchestrationResult> {
  // Load existing requirements
  const build = await ArtifactService.getActiveBuild(...)
  const existingRequirements = build?.requirements_collected || {}

  // NEW: Use separate AI for requirement extraction
  const fallbackAI = WorkflowAIService.getInstance()
  const extractionPrompt = `Extract requirements from: ${userMessage}`
  const extractionResponse = await fallbackAI.generateResponse(extractionPrompt)
  const newRequirements = this.parseExtractionResponse(extractionResponse)

  // NEW: Merge and persist
  if (Object.keys(newRequirements).length > 0) {
    const merged = { ...existingRequirements, ...newRequirements }
    await ArtifactService.updateRequirements(buildId, merged)
  }

  return { ... }
}
```

**Pros**:
- AI-quality extraction even on failure
- Uses existing AI infrastructure
- No deterministic extraction needed

**Cons**:
- Still depends on AI (could fail again)
- Additional latency on failure path
- Could create cascade failures

**Risk**: MEDIUM — still AI-dependent

**Latency Impact**: HIGH — additional AI call on failure

**Provider Dependency**: YES — requires fallback provider

---

### Option 4: Conversation History Reprocessing

**Approach**: On AI failure, reprocess the last N messages to reconstruct requirements

**Files Changed**:
- `lib/alex/orchestration/ai-orchestrator.ts` (~30 lines)

**Implementation**:
```typescript
private async getFallbackDecision(...): Promise<OrchestrationResult> {
  // Load existing requirements
  const build = await ArtifactService.getActiveBuild(...)
  const existingRequirements = build?.requirements_collected || {}

  // NEW: Load recent conversation history
  const history = await loadConversationHistory(context.conversationId, context.userId, 5)

  // NEW: Reprocess to find new requirements
  const newRequirements = this.reprocessHistory(history, existingRequirements)

  // NEW: Merge and persist
  if (Object.keys(newRequirements).length > 0) {
    const merged = { ...existingRequirements, ...newRequirements }
    await ArtifactService.updateRequirements(buildId, merged)
  }

  return { ... }
}
```

**Pros**:
- Uses existing conversation data
- Can recover from last several turns
- No new AI calls

**Cons**:
- Complex reprocessing logic
- May duplicate AI's work
- Risk of incorrect reconstruction

**Risk**: MEDIUM — complex logic

**Latency Impact**: MINIMAL — deterministic

**Provider Dependency**: NONE

---

### Option 5: Add Requirement Update to Orchestration Prompt

**Approach**: Modify AI prompt to always return `requirementUpdate` even when other JSON fails

**Files Changed**:
- `lib/alex/orchestration/ai-orchestrator.ts` (~15 lines)

**Implementation**:
```typescript
// Modify prompt to request separate requirement update
const prompt = `... Always include a "requirementUpdate" field with any new requirements from this message, even if other JSON is malformed ...`

// Parse requirementUpdate separately
const requirementMatch = response.match(/"requirementUpdate":\s*\{[^}]*\}/)
if (requirementMatch) {
  const requirementUpdate = JSON.parse(requirementMatch[0])
  // Save requirementUpdate even if main JSON fails
}
```

**Pros**:
- Minimal code change
- Still uses AI quality
- Separate extraction field

**Cons**:
- Still depends on JSON parsing
- May still fail if entire response is malformed
- Prompt engineering complexity

**Risk**: LOW — prompt change only

**Latency Impact**: NONE

**Provider Dependency**: YES — still AI-dependent

---

## Recommended Minimal Fix

### SELECTION: Option 1 — Fallback Requirement Extraction

**Rationale**:
1. **Minimal code change** — only modifies fallback path
2. **No happy path changes** — only affects AI failures
3. **No database schema changes** — reuses existing `requirements_collected`
4. **No new files** — single file modification
5. **Deterministic** — can use regex/pattern matching without AI dependency
6. **Additive** — doesn't remove or replace existing logic
7. **Low risk** — graceful degradation if extraction fails

### Implementation Details

**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Function**: `getFallbackDecision()`

**Changes**:
1. Add `extractRequirementsFromMessage()` helper method
2. Call extraction in fallback path
3. Merge with existing requirements
4. Persist via `ArtifactService.updateRequirements()`

**Estimated Lines**: 30-40 lines

**Extraction Strategy**:
- Use lightweight pattern matching (regex)
- Target known requirement categories:
  - Platform names (n8n, zapier, make, google forms, typeform, etc.)
  - Notification providers (gmail, slack, teams, email, etc.)
  - Integration names (salesforce, hubspot, etc.)
  - Trigger types (webhook, form submission, scheduled, etc.)
- Merge with existing requirements
- If extraction fails, preserve existing state (no degradation)

### Validation Plan

**Without Database**:
- Unit test extraction logic with sample messages
- Test merge behavior with existing requirements
- Test empty extraction returns undefined
- Test persistence bypass if extraction fails

**With Database**:
- Test end-to-end with AI failure simulation
- Verify `requirements_collected` updates correctly
- Verify fallback response includes preserved state
- Verify no duplicate build creation

**Failure Mode Testing**:
- Simulate JSON.parse() failure
- Simulate provider timeout
- Simulate malformed AI response
- Verify requirement survival in all cases

### Rollback Strategy

**Reversible**: YES — single function revert

**Fallback**: Original fallback behavior preserved

**Graceful Degradation**: If extraction fails, fallback still preserves existing state

---

## Validation Matrix

| Scenario        | AI succeeds | AI fails | New requirement survives (current) | New requirement survives (with fix) |
| --------------- | ----------: | -------: | ----------------------------------: | ------------------------------------: |
| New requirement |         Yes |       No |                                 YES |                                   YES |
| Correction      |         Yes |       No |                                 YES |                                   YES |
| New integration |         Yes |       No |                                 YES |                                   YES |
| New condition   |         Yes |       No |                                 YES |                                   YES |
| New trigger     |         Yes |       No |                                 YES |                                   YES |
| Malformed JSON   |         Yes |       No |                                  NO |                                   YES |
| Provider timeout |         Yes |       No |                                  NO |                                   YES |
| All providers fail |       Yes |       No |                                  NO |                                   YES |
| AI omits requirement |     Yes |       No |                                  NO |                                  NO* |

\* *AI omission requires separate fix (e.g., prompt improvement or validation)*

**Testable Without Database**:
- Extraction logic unit tests
- Merge behavior tests
- Empty extraction tests

**Requires Database**:
- End-to-end failure scenarios
- Persistence verification
- Build integrity checks

---

## Risk Analysis

### Implementation Risk: LOW

**Reasons**:
- Single file modification
- Only affects failure path
- Existing happy path unchanged
- Graceful degradation if extraction fails
- No database schema changes
- No migration required

### Regression Risk: MINIMAL

**Reasons**:
- Fallback path only (less frequently executed)
- Original fallback behavior preserved
- Additive change only
- No removal of existing logic

### Provider Dependency: NONE

**Reasons**:
- Deterministic extraction (regex/patterns)
- No additional AI calls
- Works even if all providers fail

### Latency Impact: MINIMAL

**Reasons**:
- Only on failure path
- Deterministic extraction (fast)
- No additional network calls

### Reliability: HIGH

**Reasons**:
- Uses existing persistence mechanism
- Graceful degradation
- No new failure modes introduced

---

## Implementation Sequence

### Step 1: Add Extraction Helper

**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Action**: Add `extractRequirementsFromMessage()` method

**Lines**: ~20 lines

**Function**: Pattern matching for known requirement categories

### Step 2: Modify Fallback

**File**: `lib/alex/orchestration/ai-orchestrator.ts`

**Action**: Call extraction in `getFallbackDecision()`

**Lines**: ~10 lines

**Function**: Extract, merge, persist requirements

### Step 3: Unit Tests

**File**: `lib/alex/__tests__/fallback-requirement-extraction.test.ts`

**Action**: Test extraction logic and merge behavior

**Lines**: ~100 lines

**Function**: Validate extraction accuracy

### Step 4: Validation

**Action**: Run tests, verify TypeScript, inspect diff

**Outcome**: Confirm no regressions

### Step 5: Manual Verification

**Action**: Test with simulated AI failures

**Outcome**: Confirm requirement survival

---

## What We Are NOT Changing

### Database Schema
- No new tables
- No new columns
- No migrations
- No schema changes

### Existing Architecture
- No removal of orchestration components
- No replacement of AIOrchestrator
- No redesign of WorkflowOrchestrator
- No changes to ArtifactService.updateRequirements()
- No changes to automation_plan
- No changes to final_specification

### Happy Path
- No changes to successful AI flow
- No changes to JSON parsing
- No changes to plan generation
- No changes to artifact generation

### Provider Logic
- No changes to ProviderManager
- No changes to provider fallback
- No changes to provider configuration

### Other Systems
- No changes to TPM logic
- No changes to RAG
- No changes to file upload
- No changes to memory service
- No changes to web research
- No changes to tool calling

---

## Final Verdict

**STATUS**: **PHASE 3 REQUIRED — MINIMAL FIX IDENTIFIED**

**SUMMARY**:
- Phase 2 successfully protects existing `requirements_collected` from AI failures
- Phase 2 does NOT guarantee persistence of new user requirements when AI fails
- The failure boundary is in `AIOrchestrator.askAIDecision()` — requirement extraction requires successful AI JSON
- User messages are already persisted to `alex_messages` but never used for post-failure requirement extraction
- A minimal fix (Option 1) adds fallback requirement extraction using deterministic pattern matching
- This fix requires 1 file, ~30 lines, no database changes, and has LOW risk

**EXACT FAILURE BOUNDARY**:
- File: `lib/alex/orchestration/ai-orchestrator.ts`
- Function: `askAIDecision()`
- Lines: 302-318 (JSON parsing and requirement extraction)
- Condition: `JSON.parse()` failure or AI omission

**MINIMUM FILES TO CHANGE**:
- `lib/alex/orchestration/ai-orchestrator.ts` (~30 lines)

**DATABASE CHANGES REQUIRED**: NO

**PROPOSED IMPLEMENTATION SEQUENCE**:
1. Add `extractRequirementsFromMessage()` helper
2. Modify `getFallbackDecision()` to call extraction
3. Add unit tests for extraction logic
4. Validate with simulated failures
5. Manual verification

**VALIDATION PLAN**:
- Unit tests for extraction logic (no database required)
- End-to-end tests with database (for final verification)
- Simulated failure scenarios (malformed JSON, timeout, provider failure)

**ROLLBACK STRATEGY**:
- Single function revert
- Original fallback behavior preserved
- Graceful degradation if extraction fails

**WAITING FOR APPROVAL** before implementing the recommended fix.
