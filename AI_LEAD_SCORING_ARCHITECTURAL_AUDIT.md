# AI Lead Scoring Automation - Architectural Audit & Implementation Plan

**Date**: 2025-01-XX
**Commit**: aedf0ec
**Purpose**: Design AI lead scoring automation for Google Forms → AI Scoring → Google Sheets → Email routing

---

## 1. Existing Capability Audit

### ✅ ALEX Automation Capabilities: PRESENT

**Workflow Generation**: YES
- `lib/alex/workflows/workflow-generator.ts` - Generates n8n workflows from natural language
- `lib/alex/workflows/workflow-types.ts` - Defines workflow types and structures
- Uses AI to generate valid n8n workflow JSON
- Includes validation and analysis

**n8n Platform Support**: YES
- `lib/alex/artifact-generation/platform-capabilities.ts` - Defines n8n capabilities
- Supports triggers: webhook, email, schedule, manual, event, database, file
- Supports actions: email, HTTP, database, file, AI, code, transformation, branching, loops
- Supports AI: native, OpenAI, Anthropic, Gemini, custom, agents
- n8n node types referenced in architecture planner

**Google Integration Support**: PARTIAL
- Gmail triggers: `n8n-nodes-base.gmailTrigger` (in architecture-planner.ts)
- Gmail actions: `n8n-nodes-base.gmail` (in architecture-planner.ts)
- Google Sheets: `n8n-nodes-base.googleSheets` (referenced in workflow-generator.ts)
- Email provider extraction: `gmail` pattern extraction (in ai-orchestrator.ts)
- Lead scoring detection: `lead scoring` pattern extraction (in ai-orchestrator.ts)

**Structured AI Outputs**: YES
- Tool registry system: `lib/alex/tools/tool-registry.ts`
- Tool execution service: `lib/alex/tools/tool-execution-service.ts`
- Built-in tools: calculator, current-time, web-search
- Workflow tools: analyze, debug, validate, repair, parse
- AI can call tools with structured JSON outputs

**Automation Specification**: YES
- `lib/alex/artifact-generation/automation-spec.ts` - Structured automation specification
- Supports: platform, domain, trigger, inputs, outputs, integrations, business rules, AI config
- Includes `aiConfig.task` field for classification, generation, extraction
- Includes `businessRules.conditions` for branching logic
- Includes `businessRules.routing` for routing decisions

**Conversational Requirements**: YES
- Phase 3 deterministic extraction (in ai-orchestrator.ts)
- `qualificationMethod` field extraction (lead scoring, automatic scoring)
- Requirement persistence via `ArtifactService.updateRequirements()`
- Shallow merge preserves across conversation turns

### ❌ Missing Capabilities

**Lead Scoring Schema**: NO
- No specific schema for `score`, `reasoning`, `positive_factors`, `concerns`, `confidence`
- `AutomationSpec` does not have lead scoring specific fields

**AI Scoring Tool**: NO
- No dedicated tool for AI lead scoring
- Would need new tool registration

**Google Forms Integration**: NO
- No Google Forms trigger node types defined
- No Google Forms webhook patterns
- Would need n8n node type definition

**Score-Based Routing Schema**: NO
- No schema for score threshold configuration
- No schema for routing based on score
- Would need extension to `businessRules.routing`

---

## 2. Recommended Architecture

### Architecture Pattern: Hybrid ALEX + n8n

**ALEX Role**:
- Conversational requirement gathering
- Requirement persistence (Phase 3)
- Generate n8n workflow JSON
- Provide structured AI scoring tool for the workflow

**n8n Role**:
- Execute the workflow
- Google Forms webhook trigger
- Call ALEX AI scoring tool (or use n8n AI node)
- Store in Google Sheets
- Conditional routing based on score
- Send email for high scores

### Why This Hybrid Approach

1. **ALEX Strengths**: Conversational design, requirement gathering, workflow generation
2. **n8n Strengths**: Runtime execution, integrations, conditional routing, persistence
3. **AI Scoring**: Can be either ALEX tool (more control) or n8n AI node (simpler)
4. **Separation of Concerns**: Design vs execution

---

## 3. Exact Workflow/Data Flow

### Step 1: Conversational Design (ALEX)

```
User: "I want to collect leads from a Google Form."
ALEX: Extracts requirements → automationSpec.trigger.source = 'google_forms'
ALEX: Persists to requirements_collected

User: "I want AI to score each lead from 0 to 100 and explain the score."
ALEX: Extracts requirements → automationSpec.aiConfig.task = 'lead_scoring'
ALEX: Extracts → automationSpec.aiConfig.confidenceThreshold = (optional)
ALEX: Persists to requirements_collected

User: "I don't want fixed qualification rules. I want AI to decide the score based on the information in each form submission."
ALEX: Extracts → automationSpec.businessRules.filters = ['no_fixed_rules', 'ai_determined']
ALEX: Persists to requirements_collected

User: "Keep all leads in Google Sheets and email qualified leads."
ALEX: Extracts → automationSpec.outputs.destinations = ['google_sheets', 'email']
ALEX: Extracts → automationSpec.businessRules.routing = ['score_based']
ALEX: Persists to requirements_collected
```

### Step 2: Workflow Generation (ALEX)

```
User: "Generate the workflow."
ALEX: Calls WorkflowGenerator.generate()
AI: Generates n8n workflow JSON with nodes:
  1. Google Forms Webhook Trigger
  2. AI Scoring Node (or ALEX tool call)
  3. Google Sheets Append Node
  4. IF Node (score >= threshold)
  5. Gmail Send Node
  6. ELSE Node (low score handling)
ALEX: Returns workflow JSON + explanation
```

### Step 3: Runtime Execution (n8n)

```
Google Form Submitted
  ↓
Webhook Trigger fires (n8n)
  ↓
Form data received
  ↓
AI Scoring Node executes
  ├─ Calls AI provider with form data
  ├─ Receives structured response: { score, reasoning, factors, concerns, confidence }
  └─ Parses response
  ↓
Google Sheets Append Node
  ├─ Adds row with form fields
  ├─ Adds AI score
  ├─ Adds AI reasoning
  └─ Adds timestamp
  ↓
IF Node (score >= 70) ← configurable threshold
  ├─ IF true → Gmail Send Node
  └─ IF false → Skip email
  ↓
Workflow complete
```

---

## 4. AI Structured Output Schema

### Lead Scoring Response Schema

```typescript
interface LeadScoringResponse {
  score: number           // 0-100 integer
  reasoning: string      // Concise explanation
  positive_factors?: string[]  // What makes this lead good
  concerns?: string[]    // What might prevent conversion
  confidence?: number    // 0-1 confidence in score
  processing_time_ms?: number  // For performance monitoring
}
```

### Example Response

```json
{
  "score": 85,
  "reasoning": "High-value lead with immediate purchase intent and suitable budget.",
  "positive_factors": [
    "Budget of $15,000+",
    "Ready to buy within 30 days",
    "Decision-maker involvement",
    "Clear use case alignment"
  ],
  "concerns": [
    "Competitor evaluation in progress",
    "Technical team availability uncertain"
  ],
  "confidence": 0.85,
  "processing_time_ms": 120
}
```

---

## 5. What Needs Code

### 🔴 New Code Required

**1. Lead Scoring Tool** (ALEX Tool)
- File: `lib/alex/tools/builtin/lead-scoring-tool.ts`
- Purpose: Provide AI lead scoring as a callable tool
- Schema: Input (form data), Output (LeadScoringResponse)
- Registration: Add to tool registry

**2. Google Forms Node Type Definition** (ALEX Architecture Planner)
- File: Extend `lib/alex/artifact-generation/architecture-planner.ts`
- Purpose: Add Google Forms webhook trigger to node type mapping
- Node type: `n8n-nodes-base.googleFormsTrigger` (or equivalent)

**3. Lead Scoring Schema Extension** (AutomationSpec)
- File: Extend `lib/alex/artifact-generation/automation-spec.ts`
- Purpose: Add lead scoring specific fields to specification
- Fields: `leadScoringConfig` object with schema

**4. AI Scoring Prompt Template** (Workflow Generator)
- File: Extend `lib/alex/workflows/workflow-generator.ts`
- Purpose: Add prompt template for AI scoring in generated workflows
- Template: Structured output prompt for n8n AI node

### 🟡 Configuration Required

**1. n8n Credentials**
- Google Forms webhook URL
- Google Sheets API credentials
- Gmail API credentials
- AI provider credentials (OpenAI/Anthropic/Gemini)

**2. Score Threshold**
- Configure in n8n workflow (IF node)
- Environment variable or workflow parameter

**3. Google Forms Webhook**
- Set up Google Forms to send to n8n webhook
- Configure form field mapping

### 🟢 Already Supported

**Conversational Requirements Gathering** ✅
- Phase 3 deterministic extraction
- Requirement persistence
- Multi-turn conversation support

**Workflow Generation** ✅
- WorkflowGenerator class
- n8n workflow JSON generation
- Validation and analysis

**n8n Platform Support** ✅
- Platform capabilities defined
- Gmail integration patterns
- Google Sheets node types referenced

**Tool System** ✅
- Tool registry
- Tool execution service
- Structured output handling

**Token Protection** ✅
- Provider input budget
- Safe file context budget
- Conversation history management

---

## 6. What Does Not Need Code

### ❌ No Code Needed

**1. Google Sheets Storage** (n8n handles)
- n8n has Google Sheets node
- No ALEX code required

**2. Email Sending** (n8n handles)
- n8n has Gmail node
- No ALEX code required

**3. Conditional Routing** (n8n handles)
- n8n has IF/Switch nodes
- No ALEX code required

**4. Webhook Trigger** (n8n handles)
- n8n has webhook nodes
- No ALEX code required

**5. Token Budget System** (already fixed)
- No changes needed
- Existing protection sufficient

**6. Conversation Architecture** (already validated)
- No changes needed
- Existing Phase 3 extraction works

---

## 7. Risks/Edge Cases

### 🔴 High Risk

**1. Malformed AI Output**
- Risk: AI returns non-JSON or invalid schema
- Mitigation: Validation in scoring tool, fallback to default score, error logging

**2. Google Forms Webhook Duplicates**
- Risk: Same submission sent multiple times
- Mitigation: Deduplication in n8n workflow, unique ID tracking in Google Sheets

**3. AI Provider Failures**
- Risk: AI scoring provider down or rate-limited
- Mitigation: Retry logic, fallback to default score, error notification

### 🟡 Medium Risk

**4. Score Threshold Misconfiguration**
- Risk: Threshold too high/low
- Mitigation: Configurable parameter, monitoring of score distribution

**5. Form Schema Changes**
- Risk: Google Forms fields change, breaking mapping
- Mitigation: Robust field mapping, schema validation

**6. Google Sheets API Limits**
- Risk: API quota exceeded
- Mitigation: Batch inserts, quota monitoring

### 🟢 Low Risk

**7. Conversation State Loss**
- Risk: Requirements lost between turns
- Mitigation: Already addressed by Phase 3 persistence

**8. Token Budget Exceeded**
- Risk: AI scoring request too large
- Mitigation: Already addressed by token protection architecture

---

## 8. Recommended Next Implementation Step

### Phase 1: Minimal Viable Tool (1-2 hours)

**Task**: Create ALEX lead scoring tool

**Steps**:
1. Create `lib/alex/tools/builtin/lead-scoring-tool.ts`
2. Define tool schema (input: form data, output: LeadScoringResponse)
3. Implement AI call with structured output prompt
4. Add validation and error handling
5. Register in tool registry
6. Test with sample form data

**Why First**: Enables ALEX to perform lead scoring directly, validates the approach before full workflow generation.

### Phase 2: Schema Extension (30 minutes)

**Task**: Extend AutomationSpec for lead scoring

**Steps**:
1. Add `leadScoringConfig` to `automation-spec.ts`
2. Extend Phase 3 extraction for scoring requirements
3. Test conversational extraction

**Why Second**: Enables ALEX to persist and reason about lead scoring requirements.

### Phase 3: Workflow Generation (2-3 hours)

**Task**: Extend workflow generator for lead scoring workflows

**Steps**:
1. Add Google Forms trigger to architecture planner
2. Create workflow template for lead scoring
3. Add AI scoring prompt template
4. Test workflow generation
5. Validate generated workflow

**Why Third**: Enables ALEX to generate complete n8n workflows for lead scoring.

### Phase 4: n8n Integration (External)

**Task**: Deploy and test workflow in n8n

**Steps**:
1. Import generated workflow into n8n
2. Configure credentials
3. Set up Google Forms webhook
4. Test with live form submission
5. Verify Google Sheets storage
6. Verify email routing

**Why Last**: Requires external n8n setup and credentials.

---

## 9. Implementation Priority

### ✅ Do First
1. Lead scoring tool (enables immediate AI scoring capability)
2. Schema extension (enables requirement persistence)

### 🟡 Do Second
3. Workflow generation (enables complete workflow design)
4. n8n integration (external setup)

### ❌ Do Not Do Yet
- Token system changes (already fixed)
- Conversation architecture changes (already validated)
- Database schema changes (not needed)
- Migrations (not needed)

---

## 10. Token Safety Considerations

### AI Scoring Request Size

**Estimated Size**:
- Form data: ~500 tokens (typical Google Form)
- System prompt: ~200 tokens
- Total: ~700 tokens

**Budget Impact**:
- Well within Groq 6400 token budget
- No risk of TPM exceedance
- No token budget changes needed

### Recommendation

Reuse existing token protection infrastructure. No changes required.

---

## Final Recommendation

**STATUS**: ARCHITECTURE AUDIT COMPLETE

**FINDINGS**:
- ALEX has strong foundation for automation design
- n8n workflow generation capabilities exist
- Lead scoring requires minimal new code
- Hybrid ALEX + n8n approach is optimal

**NEXT STEP**: Implement Phase 1 (Lead Scoring Tool)

**NO CHANGES NEEDED**:
- Token budget system
- Conversation architecture
- Database schema
- Existing workflow generation

**READY FOR**: Implementation of Phase 1
