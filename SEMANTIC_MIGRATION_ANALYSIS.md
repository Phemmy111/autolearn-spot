# AI Semantic Reasoning Layer Migration Analysis

## Executive Summary

This document analyzes the current keyword-driven specification construction and designs an AI semantic reasoning layer to replace it while preserving the existing artifact infrastructure.

---

## 1. CURRENT KEYWORD SPECIFICATION CONSTRUCTION

### 1.1 Keyword-Based Methods in IntelligenceAnalyzerV2

| Method | Lines | What it does | Keyword patterns |
|--------|-------|--------------|------------------|
| `detectAutomationType()` | 342-352 | Detects workflow/chatbot/agent/pipeline/integration | 'workflow', 'automation', 'chatbot', 'bot', 'agent', 'assistant', 'pipeline', 'integration' |
| `detectDomain()` | 357-369 | Detects email/support/sales/marketing/finance/ai/data/custom | 'email', 'gmail', 'outlook', 'support', 'customer', 'sales', 'lead', 'marketing', 'invoice', 'finance', 'ai', 'artificial intelligence', 'llm', 'data', 'etl' |
| `extractExplicitSpecs()` | 374-507 | Extracts platform, integrations, trigger, schedule, AI config, human approval, business rules | 130+ lines of if/else on keywords: 'n8n', 'zapier', 'make', 'gmail', 'outlook', 'gemini', 'gpt', 'openai', 'claude', 'anthropic', 'pinecone', 'notion', 'confluence', 'webhook', 'schedule', 'daily', 'cron', 'ai', 'artificial intelligence', 'understand', 'classify', 'generate', 'draft', 'auto responder', 'intelligent', 'smart', 'automated response', 'escalate', 'human', 'uncertain', 'confidence', 'every', 'all', 'support', 'customer' |
| `makeInferences()` | 512-550 | Simple if/else rules for defaults | Domain→trigger inference, AI→model inference, human approval→confidence threshold, logging inference |
| `mapAnswerToSpec()` | 645-786 | Maps user answers to spec fields via 200+ line switch statement | 15+ cases with keyword matching per case |
| `handleRecommendation()` | 791-861 | Sets hardcoded defaults for "Recommend for me" | Gmail, GPT-4, Notion, email defaults |
| `inferAnswerMapping()` | 866-910 | Infers which field an answer is for when no context | Keyword matching against blockers |
| `getFallbackOptions()` | 1010-1027 | Returns hardcoded option arrays | 6 hardcoded option arrays |

### 1.2 Keyword-Based Methods in IntentDetector

| Method | Lines | What it does | Keyword patterns |
|--------|-------|--------------|------------------|
| `detectIntent()` | 15-193 | Detects artifact generation intent | buildPatterns array (55+ patterns), negativePatterns array (14 patterns), strongBuildIndicators array (15 patterns) |

---

## 2. CONSUMERS OF THE SPECIFICATION

### 2.1 Direct Consumers

| Consumer | File | Uses spec for | Current dependency |
|----------|------|--------------|-------------------|
| `WorkflowManagerV2.handleDesignArchitecture()` | workflow-manager-v2.ts:288-317 | Architecture generation | spec.automationType, spec.domain, spec.platform, spec.aiConfig, spec.integrations, spec.trigger, spec.humanApproval, spec.schedule, spec.persistence |
| `WorkflowManagerV2.handleGenerateArtifact()` | workflow-manager-v2.ts:484-566 | Workflow JSON generation | spec.description, spec.automationType, spec.domain, spec.platform, spec.aiConfig, spec.integrations, spec.trigger, spec.filename |
| `selectPlatform()` | platform-capabilities.ts:720-852 | Platform selection | domain, aiConfig.enabled, integrations.databases, businessRules.conditions, humanApproval.required, integrations.knowledgeBase, architecture.complexity, platform |
| `generateArchitectureWithAI()` | workflow-manager-v2.ts:322-410 | AI architecture generation | spec.description, spec.automationType, spec.domain, spec.platform, spec.aiConfig, spec.integrations, spec.trigger, spec.humanApproval, spec.schedule, spec.persistence |

### 2.2 Indirect Consumers

| Consumer | File | Uses spec for | Current dependency |
|----------|------|--------------|-------------------|
| `ArtifactService.updateSpecification()` | artifact-service.ts | Database persistence | Entire spec object with _knownFields, _blockerFields |
| `ArtifactService.createBuild()` | artifact-service.ts | Build creation | spec.automationType (for buildType detection) |
| User UI components | Frontend | Display | spec.platform, spec.domain, spec.aiConfig, spec.integrations (for architecture proposal display) |

---

## 3. FIELDS: AI-GENERABLE vs DETERMINISTIC

### 3.1 Safely AI-Generable Fields

| Field | Current source | Why AI-safe | Risk level |
|-------|---------------|------------|-----------|
| `automationType` | Keyword detection | AI can understand semantic intent (workflow vs chatbot vs agent) | LOW |
| `domain` | Keyword detection | AI can infer domain from context (support vs sales vs custom) | LOW |
| `description` | User input only | AI can extract and refine description from user request | LOW |
| `platform` | selectPlatform() or keyword | AI can select platform based on requirements | MEDIUM (user may have preference) |
| `platformReasoning` | selectPlatform() | AI can explain platform choice | LOW |
| `trigger.type` | Keyword detection or inference | AI can infer trigger from context (email→email trigger, scheduled→schedule) | LOW |
| `trigger.source` | Not currently used | AI can infer source (gmail for email domain) | LOW |
| `integrations.emailProvider` | Keyword detection | AI can extract from context ("use Outlook") | LOW |
| `integrations.aiProvider` | Keyword detection | AI can extract ("use Claude") | LOW |
| `integrations.aiModel` | Keyword detection or inference | AI can extract ("GPT-4") or recommend | LOW |
| `integrations.knowledgeBase` | Keyword detection | AI can extract ("Notion KB") | LOW |
| `integrations.databases` | Not currently used | AI can infer from requirements | LOW |
| `integrations.apis` | Not currently used | AI can infer from requirements | LOW |
| `inputs.sources` | Not currently used | AI can infer from trigger and context | LOW |
| `outputs.destinations` | Keyword detection | AI can extract ("send to Slack") | LOW |
| `businessRules.conditions` | Partially keyword | AI can extract routing rules ("reply to support only") | MEDIUM (complex logic) |
| `businessRules.routing` | Keyword detection | AI can extract ("every email") | LOW |
| `businessRules.filters` | Not currently used | AI can infer from context | LOW |
| `businessRules.transformations` | Not currently used | AI can infer from context | LOW |
| `aiConfig.enabled` | Keyword detection | AI can detect AI intent | LOW |
| `aiConfig.task` | Not currently used | AI can infer (classification, generation, extraction) | LOW |
| `aiConfig.confidenceThreshold` | Inference | AI can recommend or extract | LOW |
| `aiConfig.promptTemplate` | Not currently used | AI can generate from requirements | LOW |
| `aiConfig.systemPrompt` | Not currently used | AI can generate from requirements | LOW |
| `humanApproval.required` | Keyword detection | AI can detect escalation intent | LOW |
| `humanApproval.stages` | Not currently used | AI can infer from complexity | LOW |
| `humanApproval.escalationPath` | Not currently used | AI can infer from context | LOW |
| `errorHandling.retryStrategy` | Inference | AI can recommend based on importance | LOW |
| `errorHandling.maxRetries` | Inference | AI can recommend | LOW |
| `errorHandling.fallbackPath` | Not currently used | AI can design | MEDIUM (complex) |
| `errorHandling.errorNotification` | Not currently used | AI can infer | LOW |
| `persistence.enabled` | Inference | AI can recommend for production | LOW |
| `persistence.storage` | Not currently used | AI can infer from requirements | LOW |
| `persistence.logLevel` | Inference | AI can recommend | LOW |
| `persistence.auditTrail` | Not currently used | AI can recommend for compliance | LOW |
| `schedule.enabled` | Keyword detection | AI can detect scheduled intent | LOW |
| `schedule.frequency` | Keyword detection | AI can extract ("daily", "hourly") | LOW |
| `schedule.timezone` | Not currently used | AI can infer or ask | LOW |
| `schedule.time` | Keyword detection | AI can extract ("8 AM") | LOW |
| `security.credentials` | Not currently used | AI can infer from integrations | LOW |
| `security.encryption` | Not currently used | AI can recommend for sensitive data | LOW |
| `security.accessControl` | Not currently used | AI can infer from compliance | LOW |
| `security.dataRetention` | Not currently used | AI can infer from compliance | LOW |
| `observability.monitoring` | Not currently used | AI can recommend for production | LOW |
| `observability.metrics` | Not currently used | AI can infer from requirements | LOW |
| `observability.alerts` | Not currently used | AI can infer from importance | LOW |
| `architecture.complexity` | AI-generated | Already AI-generated | N/A |
| `architecture.stages` | AI-generated | Already AI-generated | N/A |
| `architecture.patterns` | Not currently used | AI can infer from requirements | LOW |
| `architecture.assumptions` | AI-generated | Already AI-generated | N/A |
| `filename` | Regex extraction | AI can generate meaningful filename | LOW |

### 3.2 Deterministic Fields (Must Remain Rule-Based)

| Field | Current source | Why deterministic | Risk level |
|-------|---------------|------------------|-----------|
| `_knownFields` | Set tracking | Internal state tracking | CRITICAL |
| `_blockerFields` | Set tracking | Internal state tracking | CRITICAL |
| `specState.known` | Set tracking | Internal state tracking | CRITICAL |
| `specState.blockers` | Set tracking | Internal state tracking | CRITICAL |
| `specState.inferred` | Set tracking | Internal state tracking | CRITICAL |
| `specState.recommended` | Set tracking | Internal state tracking | CRITICAL |
| `specState.assumptions` | Set tracking | Internal state tracking | CRITICAL |
| `specState.questionContext` | State tracking | Internal state tracking | CRITICAL |
| `specState.currentQuestion` | State tracking | Internal state tracking | CRITICAL |

### 3.3 Fields Requiring User Input (Cannot Be AI-Generated)

| Field | Why user input required | Fallback strategy |
|-------|----------------------|-------------------|
| `platform` | User may have preference | AI recommends, user can override |
| `integrations.emailProvider` | User may have existing infrastructure | AI recommends, user can override |
| `integrations.aiProvider` | User may have API keys/cost constraints | AI recommends, user can override |
| `integrations.knowledgeBase` | User may have existing KB | AI recommends, user can override |
| `outputs.destinations` | User may have channel preferences | AI recommends, user can override |
| `businessRules.routing` | User may have specific business logic | AI extracts from context, user confirms |
| `humanApproval.escalationPath` | User may have specific escalation process | AI designs, user confirms |

---

## 4. CONVERSATION STATE PERSISTENCE

### 4.1 Current State Persistence

| Storage location | What's stored | How it's restored |
|------------------|---------------|-------------------|
| `alex_artifact_builds.final_specification` | Entire spec object with _knownFields, _blockerFields | Restored in WorkflowManagerV2.continueWorkflow() lines 150-160 |
| `alex_artifact_builds.questions` | Question history with context | Restored in WorkflowManagerV2.continueWorkflow() lines 188-198 |
| `alex_artifact_builds.status` | Build status (collecting_requirements, awaiting_architecture_verification, completed) | Used for routing in orchestrator and WorkflowManagerV2 |

### 4.2 State Restoration Flow

```
Database → WorkflowManagerV2.continueWorkflow()
  → specState = createSpecState(existingSpec, _knownFields, _blockerFields)
  → questionContext = lastQuestion.context
  → currentQuestion = lastQuestion.question
  → IntelligenceAnalyzerV2.handleContinuation()
```

### 4.3 State Gaps

| Gap | Current behavior | Desired behavior |
|-----|----------------|------------------|
| Answer mapping failures | Keyword switch may not match | AI semantic mapping |
| Context loss | questionContext may be lost if restoration fails | AI can re-infer from conversation history |
| Assumption tracking | Simple array | Structured assumption tracking with provenance |
| Recommendation tracking | Simple array | Structured recommendation tracking with AI reasoning |

### 4.4 Recommended State Persistence (Unchanged)

The current state persistence is solid and should be preserved:
- Keep `_knownFields`, `_blockerFields` as arrays
- Keep `questions` table for conversation history
- Keep `status` for routing
- Only change: enrich spec with AI-generated fields

---

## 5. ATTACHMENTS CONTEXT ENTRY

### 5.1 Current Attachment Handling

| Location | How attachments enter context | What's extracted |
|----------|----------------------------|------------------|
| `chat/route.ts` lines 86-119 | Resolved effectiveFileIds from current message or conversation | Supabase fetch with ownership check |
| `chat/route.ts` lines 325-383 | Validation: extraction_status, extracted_text for text files | Image files: no text extraction needed |
| `chat/route.ts` lines 386-426 | Image data: fetched and converted to base64 dataUrl | Stored in file.imageDataUrl |
| `orchestrator.ts` line 289 | passed to context assembly | Not currently used in artifact generation |

### 5.2 Current Attachment Usage in Artifact Generation

| Method | Attachment usage | Gap |
|--------|------------------|-----|
| `IntelligenceAnalyzerV2.analyze()` | Receives attachedFiles parameter | NOT USED in specification building |
| `identifyBlockers()` | Does NOT receive attachments | AI cannot see reference JSON files |
| `generateArchitectureWithAI()` | Does NOT receive attachments | AI cannot see reference workflows |
| `generateJSON()` | Does NOT receive attachments | AI cannot adapt from examples |

### 5.3 Recommended Attachment Context Entry

**Phase 1: Specification Building**
- Pass `attachedFiles` to AI specification extraction
- Extract file content (text from text files, description from images)
- Include in AI prompt as context

**Phase 2: Architecture Generation**
- Pass reference JSON files to AI architecture generation
- AI analyzes reference workflow structure
- AI adapts architecture based on reference

**Phase 3: Workflow Generation**
- Pass reference JSON files to AI workflow generation
- AI uses reference as template/pattern
- AI modifies based on user's specific requirements

### 5.4 Attachment Processing Strategy

```typescript
// For text files (JSON, YAML, code)
if (file.mime_type.startsWith('text/') || file.mime_type === 'application/json') {
  const content = file.extracted_text
  // Include in AI prompt
}

// For images
if (file.mime_type.startsWith('image/')) {
  const description = await aiService.generateResponse(
    `Describe this workflow diagram/screenshot in detail`
  )
  // Include description in AI prompt
}

// For JSON reference files
if (file.mime_type === 'application/json' && isReferenceFile) {
  const structure = JSON.parse(file.extracted_text)
  // Include structure in AI prompt as reference
}
```

---

## 6. LOGICAL ARCHITECTURE REPRESENTATION

### 6.1 Current Architecture Representation

| Component | Current state | AI usage |
|-----------|---------------|----------|
| `ArchitectureDesigner` | EXISTS (template-based) | NOT USED in V2 |
| `LogicalArchitecture` interface | EXISTS with stages, inputs, outputs, dependencies | NOT USED in V2 |
| `generateArchitectureWithAI()` | AI generates JSON directly | SKIPS LogicalArchitecture |
| Workflow generation | AI generates n8n JSON directly | NO intermediate representation |

### 6.2 Current LogicalArchitecture Interface

```typescript
export interface LogicalArchitecture {
  name: string
  description: string
  stages: LogicalStage[]
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string
  assumptions: string[]
  recommendations: string[]
}

export interface LogicalStage {
  id: string
  name: string
  purpose: string
  inputs: string[]
  outputs: string[]
  optional: boolean
  dependencies: string[]
}
```

### 6.3 Current AI Architecture Output

```typescript
{
  "platform": "n8n",
  "platformReasoning": "brief explanation",
  "complexity": "simple|moderate|complex",
  "stages": [
    {
      "name": "descriptive stage name",
      "purpose": "what this stage does"
    }
  ],
  "assumptions": ["assumption 1"],
  "recommendations": ["recommendation 1"],
  "description": "numbered list of stages"
}
```

### 6.4 Gap: Missing Logical Architecture

Current AI output is **NOT** a proper LogicalArchitecture:
- Missing `id` for stages
- Missing `inputs`, `outputs`, `optional`, `dependencies`
- Cannot be compiled to platform-specific workflow
- User cannot modify architecture (no structure to modify)

### 6.5 Recommended Logical Architecture Enhancement

```typescript
export interface LogicalArchitecture {
  name: string
  description: string
  stages: LogicalStage[]  // Full stage objects with dependencies
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string
  assumptions: string[]
  recommendations: string[]
  // NEW FIELDS for platform compilation
  dataFlow: DataFlow[]  // Explicit data flow between stages
  failurePaths: FailurePath[]  // Explicit failure handling
  stateRequirements: StateRequirement[]  // State management needs
}

export interface LogicalStage {
  id: string
  name: string
  purpose: string
  inputs: string[]  // Data inputs
  outputs: string[]  // Data outputs
  optional: boolean
  dependencies: string[]  // Stage IDs this depends on
  // NEW FIELDS
  capabilities: string[]  // Required capabilities (email, ai, database, etc.)
  parameters: Record<string, any>  // Stage-specific parameters
  failureHandling: FailureHandling  // How this stage handles failures
}

export interface DataFlow {
  from: string  // Stage ID
  to: string  // Stage ID
  data: string  // What data flows
  condition?: string  // Conditional flow
}

export interface FailurePath {
  stage: string  // Stage ID
  failureType: string  // API failure, timeout, etc.
  recovery: string  // Retry, fallback, escalate, etc.
  fallbackStage?: string  // Stage to fallback to
}

export interface StateRequirement {
  entity: string  // What needs state (conversation, workflow, etc.)
  scope: string  // Conversation-level, workflow-level, global
  persistence: string  // Database, file, memory
}
```

### 6.6 Architecture Representation Strategy

**Phase 1: Enhance AI Architecture Prompt**
- Request full LogicalStage objects with IDs, inputs, outputs, dependencies
- Request data flow between stages
- Request failure paths for each stage
- Request state requirements

**Phase 2: Architecture Review UI**
- Display architecture as editable flow diagram
- User can add/remove stages
- User can modify dependencies
- User can review failure paths

**Phase 3: Platform Compiler**
- Translate LogicalArchitecture to platform-specific workflow
- Use stage capabilities to select nodes
- Use data flow to define connections
- Use failure paths to add error handling nodes

---

## 7. PLATFORM COMPILATION

### 7.1 Current Platform Compilation

| Component | Current state | Gap |
|-----------|---------------|-----|
| Platform selection | `selectPlatform()` - rule-based | Works, but could be AI-enhanced |
| Architecture to workflow | AI generates n8n JSON directly | NO compilation step |
| Node selection | AI chooses nodes implicitly | NO explicit capability mapping |
| Parameter configuration | AI configures implicitly | NO validation against platform capabilities |

### 7.2 Current AI Workflow Generation Prompt

```
"Generate a complete n8n workflow JSON for the following automation.
Request: ...
Automation Type: ...
Domain: ...
Platform: n8n
Key Requirements: ...
Generate a complete n8n workflow JSON with:
1. Nodes array with properly configured nodes
2. Connections object defining node connections
3. name field for the workflow
4. settings object with proper n8n settings
5. active: true
6. Valid node types (n8n-nodes-base.*)
Return ONLY valid JSON."
```

### 7.3 Gap: No Platform Compiler

Current implementation skips the compilation step:
- No LogicalArchitecture → Platform Workflow translation
- No validation against platform capabilities
- No explicit node selection based on stage capabilities
- No explicit connection configuration based on data flow

### 7.4 Recommended Platform Compiler Architecture

```typescript
class PlatformCompiler {
  /**
   * Compile LogicalArchitecture to platform-specific workflow
   */
  static compile(
    architecture: LogicalArchitecture,
    platform: string,
    spec: AutomationSpec
  ): PlatformWorkflow {
    const capabilities = PLATFORM_CAPABILITIES[platform]
    
    // Validate platform supports required capabilities
    this.validateCapabilities(architecture, capabilities)
    
    // Select nodes based on stage capabilities
    const nodes = this.selectNodes(architecture, platform, spec)
    
    // Configure connections based on data flow
    const connections = this.configureConnections(architecture, nodes)
    
    // Add failure handling nodes
    const failureNodes = this.addFailureHandling(architecture, platform)
    
    // Add state management nodes
    const stateNodes = this.addStateManagement(architecture, platform)
    
    return {
      platform,
      nodes: [...nodes, ...failureNodes, ...stateNodes],
      connections,
      settings: this.generateSettings(platform, spec)
    }
  }
  
  private static selectNodes(
    architecture: LogicalArchitecture,
    platform: string,
    spec: AutomationSpec
  ): Node[] {
    return architecture.stages.map(stage => {
      const capability = stage.capabilities[0]
      const nodeType = this.mapCapabilityToNode(capability, platform)
      return {
        id: stage.id,
        type: nodeType,
        parameters: this.configureParameters(stage, spec)
      }
    })
  }
  
  private static mapCapabilityToNode(
    capability: string,
    platform: string
  ): string {
    // Capability → Node type mapping
    const mappings = {
      'email': 'n8n-nodes-base.emailTrigger',
      'webhook': 'n8n-nodes-base.webhook',
      'ai': 'n8n-nodes-base.openAi',
      'database': 'n8n-nodes-base.postgres',
      // ...
    }
    return mappings[capability]
  }
}
```

### 7.5 Platform Compilation Strategy

**Phase 1: Capability Mapping**
- Create capability → node type mappings for each platform
- Validate platform supports required capabilities before compilation

**Phase 2: Node Selection**
- For each LogicalStage, select appropriate node type
- Configure node parameters based on spec

**Phase 3: Connection Configuration**
- Use DataFlow to define node connections
- Handle conditional flows (switch nodes)

**Phase 4: Failure Handling**
- Add error handling nodes based on FailurePath
- Configure retry logic based on spec.errorHandling

**Phase 5: State Management**
- Add database/memory nodes based on StateRequirement
- Configure persistence based on spec.persistence

---

## 8. SEMANTIC VALIDATION

### 8.1 Current Validation

| Validation type | Current state | Gap |
|-----------------|---------------|-----|
| JSON parse | workflow-manager-v2.ts line 508 | Basic syntax only |
| Platform schema | NONE | No n8n schema validation |
| Architecture completeness | NONE | No validation against LogicalArchitecture |
| Requirement coverage | NONE | No validation against user request |
| Execution path | NONE | No execution path validation |
| Failure path | NONE | No failure path validation |

### 8.2 Recommended Semantic Validation Architecture

```typescript
class SemanticValidator {
  /**
   * Validate generated workflow against requirements
   */
  static async validate(
    workflow: PlatformWorkflow,
    architecture: LogicalArchitecture,
    spec: AutomationSpec,
    userRequest: string
  ): ValidationResult {
    const issues: ValidationIssue[] = []
    
    // Level 1: JSON syntax
    this.validateSyntax(workflow, issues)
    
    // Level 2: Platform schema
    await this.validatePlatformSchema(workflow, issues)
    
    // Level 3: Architecture completeness
    this.validateArchitectureCompleteness(workflow, architecture, issues)
    
    // Level 4: Requirement coverage
    await this.validateRequirementCoverage(workflow, spec, userRequest, issues)
    
    // Level 5: Execution path
    this.validateExecutionPath(workflow, architecture, issues)
    
    // Level 6: Failure path
    this.validateFailurePath(workflow, architecture, issues)
    
    return {
      valid: issues.length === 0,
      issues,
      canRepair: this.canRepair(issues)
    }
  }
  
  private static async validateRequirementCoverage(
    workflow: PlatformWorkflow,
    spec: AutomationSpec,
    userRequest: string,
    issues: ValidationIssue[]
  ): Promise<void> {
    // Use AI to check if workflow covers all requirements
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()
    
    const prompt = `You are a validation expert. Check if this workflow covers all user requirements.

User request: ${userRequest}
Automation specification: ${JSON.stringify(spec, null, 2)}
Workflow: ${JSON.stringify(workflow, null, 2)}

Identify missing requirements:
- Required features not implemented
- Specified integrations not used
- Specified business rules not implemented
- Specified failure handling not implemented

Return JSON in this exact format:
{
  "missingRequirements": ["requirement 1", "requirement 2"] or []
}`
    
    const response = await aiService.generateResponse(prompt)
    const result = JSON.parse(response.match(/\{[\s\S]*\}/)[0])
    
    result.missingRequirements.forEach(req => {
      issues.push({
        level: 'requirement',
        message: `Missing requirement: ${req}`,
        canRepair: true
      })
    })
  }
}
```

### 8.3 Validation Strategy

**Phase 1: Syntax Validation**
- JSON parse (already exists)
- Platform schema validation (add n8n schema check)

**Phase 2: Architecture Validation**
- Validate all LogicalArchitecture stages have corresponding nodes
- Validate all dependencies are satisfied
- Validate data flow is preserved

**Phase 3: Requirement Validation**
- AI-based validation against user request
- Check for missing integrations
- Check for missing business rules
- Check for missing failure handling

**Phase 4: Repair Loop**
- If validation fails, attempt repair
- Regenerate workflow with validation feedback
- Limit repair attempts to prevent infinite loops

---

## 9. OBSOLETE CLASSES

### 9.1 Completely Obsolete (Can be Deleted)

| Class | File | Why obsolete |
|-------|------|--------------|
| `ArtifactWorkflowManager` | workflow-manager.ts | NOT imported or used anywhere (only V2 is used) |
| `ArchitectureDesigner` | architecture-designer.ts | Template-based, replaced by AI generation in V2 |
| `ArchitecturePlanner` | architecture-planner.ts | NOT used in V2 path |
| `detectIntent()` (keyword version) | intent-detector.ts | Will be replaced by AI semantic detection |

### 9.2 Partially Obsolete (Methods to Remove)

| Class | Methods to remove | Why obsolete |
|-------|------------------|--------------|
| `IntelligenceAnalyzerV2` | `detectAutomationType()` | Replace with AI semantic extraction |
| `IntelligenceAnalyzerV2` | `detectDomain()` | Replace with AI semantic extraction |
| `IntelligenceAnalyzerV2` | `extractExplicitSpecs()` | Replace with AI semantic extraction |
| `IntelligenceAnalyzerV2` | `makeInferences()` | Replace with AI semantic inference |
| `IntelligenceAnalyzerV2` | `mapAnswerToSpec()` | Replace with AI semantic mapping |
| `IntelligenceAnalyzerV2` | `handleRecommendation()` | Replace with AI recommendation |
| `IntelligenceAnalyzerV2` | `inferAnswerMapping()` | Replace with AI semantic inference |
| `IntelligenceAnalyzerV2` | `getFallbackOptions()` | Replace with AI-generated options |

### 9.3 Classes to Keep (Preserve)

| Class | Why keep |
|-------|----------|
| `AutomationSpec` | Interface is expressive and solid |
| `SpecState` | State tracking is solid |
| `createSpecState()` | Factory is solid |
| `updateSpec()` | Helper is solid |
| `mergeSpec()` | Helper is solid |
| `ArtifactService` | Database operations are solid |
| `WorkflowManagerV2` | Orchestrator is solid, only internal methods change |
| `WorkflowAIService` | AI service is solid |
| `selectPlatform()` | Platform selection is solid (could be AI-enhanced but works) |
| `PLATFORM_CAPABILITIES` | Capability model is solid |

---

## 10. SMALLEST SAFE MIGRATION PATH

### 10.1 Migration Strategy: Incremental with Fallbacks

**Phase 1: Add SemanticAnalyzer (New Class)**
- Create `SemanticAnalyzer` class alongside `IntelligenceAnalyzerV2`
- Use AI for specification extraction
- Keep keyword methods as fallbacks
- Route based on feature flag

**Phase 2: Integrate SemanticAnalyzer**
- Wire `SemanticAnalyzer` into `IntelligenceAnalyzerV2`
- Try AI first, fallback to keywords on failure
- Add extensive logging

**Phase 3: Remove Keyword Fallbacks**
- Once AI extraction is stable, remove keyword fallbacks
- Delete obsolete keyword methods
- Clean up imports

**Phase 4: Enhance Logical Architecture**
- Enhance AI architecture prompt to generate full LogicalArchitecture
- Add data flow, failure paths, state requirements
- Implement architecture review UI

**Phase 5: Implement Platform Compiler**
- Create `PlatformCompiler` class
- Translate LogicalArchitecture to platform workflow
- Replace direct AI workflow generation

**Phase 6: Add Semantic Validation**
- Create `SemanticValidator` class
- Validate workflow against requirements
- Add repair loop

### 10.2 Phase 1: SemanticAnalyzer (New Class)

```typescript
/**
 * AI-based semantic specification extraction
 * Replaces keyword-based detection with AI understanding
 */
export class SemanticAnalyzer {
  /**
   * Extract complete specification from user request using AI
   */
  static async extractSpecification(request: {
    content: string
    conversationHistory?: Array<{ role: string; content: string }>
    attachedFiles?: AlexFile[]
  }): Promise<Partial<AutomationSpec>> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()
    
    // Build context from attachments
    const attachmentContext = this.buildAttachmentContext(request.attachedFiles)
    
    const prompt = `You are an expert automation architect. Extract a complete automation specification from the user's request.

User request: ${request.content}

${attachmentContext}

Extract the following fields if mentioned or inferable:
- automationType (workflow, chatbot, agent, pipeline, integration, automation)
- domain (email, support, sales, marketing, finance, ai, data, custom)
- description (concise description of what the automation does)
- platform (n8n, zapier, make, power-automate, pipedream, custom)
- trigger.type (email, webhook, schedule, manual, event)
- trigger.source (gmail, outlook, slack, etc.)
- integrations.emailProvider (gmail, outlook, smtp, imap)
- integrations.aiProvider (openai, anthropic, google)
- integrations.aiModel (gpt-4, claude-3, gemini)
- integrations.knowledgeBase (notion, confluence, pinecone, none)
- inputs.sources (email, webhook, database, api, etc.)
- outputs.destinations (email, slack, telegram, etc.)
- businessRules.routing (reply rules)
- businessRules.conditions (branching logic)
- aiConfig.enabled (true/false)
- aiConfig.task (classification, generation, extraction)
- humanApproval.required (true/false)
- schedule.enabled (true/false)
- schedule.frequency (daily, hourly, weekly, cron)
- schedule.time (HH:MM format)

Return ONLY valid JSON in this exact format:
{
  "automationType": "workflow",
  "domain": "email",
  "description": "...",
  "platform": "n8n",
  "trigger": { "type": "email", "source": "gmail" },
  "integrations": { "emailProvider": "gmail", "aiProvider": "openai", "aiModel": "gpt-4" },
  "inputs": { "sources": ["email"] },
  "outputs": { "destinations": ["email"] },
  "businessRules": { "routing": ["reply to all emails"] },
  "aiConfig": { "enabled": true, "task": "generation" },
  "humanApproval": { "required": true },
  "schedule": { "enabled": false }
}

If a field is not mentioned or inferable, omit it from the JSON.
Do not include any text before or after the JSON.`

    const response = await aiService.generateResponse(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback to empty spec
    return {}
  }
  
  /**
   * Build context from attached files
   */
  private static buildAttachmentContext(attachedFiles?: AlexFile[]): string {
    if (!attachedFiles || attachedFiles.length === 0) {
      return ''
    }
    
    let context = '\n\nAttached files:\n'
    attachedFiles.forEach(file => {
      context += `- ${file.original_filename} (${file.mime_type})\n`
      if (file.extracted_text) {
        context += `  Content preview: ${file.extracted_text.substring(0, 500)}...\n`
      }
    })
    
    return context
  }
}
```

### 10.3 Phase 1 Integration (Modify IntelligenceAnalyzerV2)

```typescript
// In IntelligenceAnalyzerV2.handleNewRequest():

// NEW: Try AI semantic extraction first
let aiSpec: Partial<AutomationSpec> = {}
try {
  aiSpec = await SemanticAnalyzer.extractSpecification({
    content,
    conversationHistory,
    attachedFiles
  })
  console.log('[DEBUG INTELLIGENCE ANALYZER V2] AI semantic extraction succeeded:', Object.keys(aiSpec))
} catch (error) {
  console.error('[DEBUG INTELLIGENCE ANALYZER V2] AI semantic extraction failed, using keyword fallback:', error)
}

// FALLBACK: Use keyword extraction if AI failed
if (Object.keys(aiSpec).length === 0) {
  const automationType = this.detectAutomationType(content)
  const domain = this.detectDomain(content)
  specState.spec.automationType = automationType
  specState.spec.domain = domain
  this.extractExplicitSpecs(content, specState)
  this.makeInferences(content, specState)
} else {
  // Use AI-extracted spec
  specState.spec = { ...specState.spec, ...aiSpec }
  // Mark AI-extracted fields as known
  Object.keys(aiSpec).forEach(key => {
    specState.known.add(key)
  })
}
```

### 10.4 Phase 2: Answer Mapping Enhancement

```typescript
// In IntelligenceAnalyzerV2.mapAnswerToSpec():

// NEW: Try AI semantic mapping first
try {
  const { WorkflowAIService } = await import('./workflow-ai-service')
  const aiService = WorkflowAIService.getInstance()
  
  const prompt = `You are an expert automation consultant. Map the user's answer to the correct specification field.

Question context: ${context}
User's answer: ${answer}

Current specification state:
${JSON.stringify(specState.spec, null, 2)}

Determine which field this answer maps to and extract the value.
Return ONLY valid JSON in this exact format:
{
  "field": "spec.field.path",
  "value": "extracted value"
}

If the answer doesn't clearly map to a field, return:
{
  "field": null,
  "value": null
}`
  
  const response = await aiService.generateResponse(prompt)
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    if (result.field && result.value) {
      // Apply AI mapping
      updateSpec(specState.spec, result.field, result.value, 'known')
      specState.known.add(result.field)
      specState.blockers.delete(result.field)
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] AI semantic mapping succeeded:', result)
      return
    }
  }
} catch (error) {
  console.error('[DEBUG INTELLIGENCE ANALYZER V2] AI semantic mapping failed, using keyword fallback:', error)
}

// FALLBACK: Use keyword mapping
// ... existing switch statement
```

### 10.5 Rollback Strategy

If AI extraction fails or produces poor results:
- Feature flag to disable AI extraction: `USE_AI_SPEC_EXTRACTION=false`
- Automatic fallback to keyword methods
- Extensive logging to track AI vs keyword performance
- Metrics: success rate, field coverage, user satisfaction

---

## 11. TEST CASES FOR UNSEEN AUTOMATION REQUESTS

### 11.1 Test Case 1: Cryptocurrency Price Monitoring (Unfamiliar Domain)

**User Request:**
```
"Build an automation that monitors cryptocurrency prices, detects unusual volatility, checks relevant news sentiment, decides whether the event is significant, alerts me through Telegram, stores the event, and sends a daily summary."
```

**Current Behavior (Keyword-based):**
- `detectDomain()`: Returns 'custom' (no keyword match)
- `detectAutomationType()`: Returns 'automation' (matches 'automation')
- `extractExplicitSpecs()`: Extracts nothing (no keywords)
- Result: Generic 3-node workflow (trigger → process → action)

**Expected Behavior (AI-based):**
- AI extracts: automationType='workflow', domain='finance'
- AI extracts: trigger.type='schedule', schedule.frequency='hourly'
- AI extracts: integrations.apis=['crypto-api', 'news-api']
- AI extracts: outputs.destinations=['telegram']
- AI extracts: businessRules.conditions=['volatility threshold', 'sentiment threshold']
- AI generates architecture with: Fetch prices → Calculate volatility → Fetch news → Sentiment analysis → Significance evaluation → Branch → Telegram alert → Store → Daily aggregation → Summary

**Test:**
```typescript
test('cryptocurrency monitoring with AI extraction', async () => {
  const request = "Build an automation that monitors cryptocurrency prices..."
  const spec = await SemanticAnalyzer.extractSpecification({ content: request })
  
  expect(spec.domain).toBe('finance')
  expect(spec.trigger?.type).toBe('schedule')
  expect(spec.trigger?.source).toBeDefined()
  expect(spec.integrations?.apis).toContain('crypto-api')
  expect(spec.outputs?.destinations).toContain('telegram')
  expect(spec.businessRules?.conditions).toBeDefined()
})
```

### 11.2 Test Case 2: Lead Qualification with Enrichment (Complex Logic)

**User Request:**
```
"Build a lead qualification system that receives website leads, enriches the company, scores the lead, routes high-value leads to sales, sends a personalized email, and logs everything."
```

**Current Behavior (Keyword-based):**
- `detectDomain()`: Returns 'sales' (matches 'sales', 'lead')
- `extractExplicitSpecs()`: Extracts nothing beyond domain
- Result: Generic sales workflow

**Expected Behavior (AI-based):**
- AI extracts: domain='sales', automationType='workflow'
- AI extracts: trigger.type='webhook'
- AI extracts: integrations.apis=['clearbit', 'apollo', 'zoominfo']
- AI extracts: businessRules.routing=['high-value to sales', 'low-value to nurture']
- AI extracts: businessRules.conditions=['revenue > $1M', 'employee count > 100']
- AI extracts: outputs.destinations=['email', 'salesforce', 'slack']
- AI generates architecture with: Webhook → Normalize → Enrich → Score → Threshold check → Branch → Route/Email → CRM update → Log

**Test:**
```typescript
test('lead qualification with AI extraction', async () => {
  const request = "Build a lead qualification system..."
  const spec = await SemanticAnalyzer.extractSpecification({ content: request })
  
  expect(spec.domain).toBe('sales')
  expect(spec.trigger?.type).toBe('webhook')
  expect(spec.integrations?.apis).toContain('clearbit')
  expect(spec.businessRules?.routing).toBeDefined()
  expect(spec.businessRules?.conditions).toBeDefined()
  expect(spec.outputs?.destinations).toContain('email')
})
```

### 11.3 Test Case 3: Content Summarizer with Multi-Input (Flexibility)

**User Request:**
```
"Build a content summarizer that accepts either text or a URL, handles multiple languages, and sends the result to Slack."
```

**Current Behavior (Keyword-based):**
- `detectDomain()`: Returns 'custom' (no keyword match)
- `extractExplicitSpecs()`: Extracts 'slack' from keyword
- Result: Generic workflow with Slack output

**Expected Behavior (AI-based):**
- AI extracts: automationType='workflow', domain='data'
- AI extracts: trigger.type='webhook' (accepts text or URL)
- AI extracts: inputs.sources=['text', 'url']
- AI extracts: aiConfig.task='summarization'
- AI extracts: aiConfig.enabled=true
- AI extracts: outputs.destinations=['slack']
- AI extracts: businessRules.conditions=['language detection']
- AI generates architecture with: Webhook → Input type check → URL fetch (if URL) → Language detect → Summarize → Format → Send Slack → Log

**Test:**
```typescript
test('content summarizer with AI extraction', async () => {
  const request = "Build a content summarizer that accepts either text or a URL..."
  const spec = await SemanticAnalyzer.extractSpecification({ content: request })
  
  expect(spec.domain).toBe('data')
  expect(spec.trigger?.type).toBe('webhook')
  expect(spec.inputs?.sources).toContain('text')
  expect(spec.inputs?.sources).toContain('url')
  expect(spec.aiConfig?.task).toBe('summarization')
  expect(spec.aiConfig?.enabled).toBe(true)
  expect(spec.outputs?.destinations).toContain('slack')
})
```

### 11.4 Test Case 4: Reference Workflow Adaptation (Attachment Context)

**User Request:**
```
"Make this workflow like the attached JSON, but adapt it for our business. We use Outlook instead of Gmail and want to escalate to Slack instead of email."
```

**Attached File:** `customer-support-workflow.json`

**Current Behavior (Keyword-based):**
- `extractExplicitSpecs()`: Extracts 'outlook', 'slack' from keywords
- Attachment ignored in specification building
- Result: Workflow may not respect reference structure

**Expected Behavior (AI-based):**
- AI analyzes reference JSON: 13-stage customer support workflow
- AI extracts: integrations.emailProvider='outlook' (from request)
- AI extracts: humanApproval.escalationPath='slack' (from request)
- AI preserves reference architecture structure
- AI modifies only specified changes
- AI generates adapted architecture maintaining reference logic

**Test:**
```typescript
test('reference workflow adaptation with AI', async () => {
  const request = "Make this workflow like the attached JSON..."
  const referenceFile = {
    original_filename: 'customer-support-workflow.json',
    mime_type: 'application/json',
    extracted_text: JSON.stringify(referenceWorkflow)
  }
  
  const spec = await SemanticAnalyzer.extractSpecification({
    content: request,
    attachedFiles: [referenceFile]
  })
  
  expect(spec.integrations?.emailProvider).toBe('outlook')
  expect(spec.humanApproval?.escalationPath).toBe('slack')
  // AI should have analyzed reference structure
})
```

### 11.5 Test Case 5: Ambiguous Intent with Follow-up (Conversation)

**User Request 1:**
```
"Build an automation for my support team."
```

**Current Behavior (Keyword-based):**
- `detectDomain()`: Returns 'support'
- `extractExplicitSpecs()`: Extracts nothing
- AI blocker identification: Asks for email provider
- User answers keyword: "Gmail"
- `mapAnswerToSpec()`: Keyword mapping succeeds

**Expected Behavior (AI-based):**
- AI extracts: domain='support', automationType='workflow'
- AI blocker identification: Asks for email provider, what kind of inquiries, where to escalate
- User answers: "We use Outlook and handle both support and sales inquiries. Escalate to Slack for complex cases."
- AI semantic mapping: Extracts emailProvider='outlook', routing=['support', 'sales'], escalationPath='slack'
- AI generates architecture with both support and sales routing

**Test:**
```typescript
test('ambiguous intent with follow-up', async () => {
  const request1 = "Build an automation for my support team."
  const spec1 = await SemanticAnalyzer.extractSpecification({ content: request1 })
  
  expect(spec1.domain).toBe('support')
  
  const answer = "We use Outlook and handle both support and sales inquiries. Escalate to Slack for complex cases."
  const mapped = await SemanticAnalyzer.mapAnswer(answer, 'integrations.emailProvider', spec1)
  
  expect(spec1.integrations?.emailProvider).toBe('outlook')
  expect(spec1.businessRules?.routing).toContain('support')
  expect(spec1.businessRules?.routing).toContain('sales')
  expect(spec1.humanApproval?.escalationPath).toBe('slack')
})
```

---

## 12. IMPLEMENTATION PLAN

### 12.1 Phase 1: SemanticAnalyzer (Week 1)

**Objective:** Create AI-based specification extraction with keyword fallback

**Components:**
- NEW: `lib/alex/artifact-generation/semantic-analyzer.ts`
- MODIFY: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts` (integrate SemanticAnalyzer)

**Changes:**
- Create `SemanticAnalyzer.extractSpecification()` with AI prompt
- Integrate into `IntelligenceAnalyzerV2.handleNewRequest()`
- Add feature flag: `USE_AI_SPEC_EXTRACTION`
- Add extensive logging
- Keep keyword methods as fallbacks

**Success criteria:**
- AI extraction succeeds for 80%+ of test cases
- Fallback to keywords on AI failure
- No regression in existing functionality
- Logs show AI vs keyword usage

**Tests:**
- Test Case 1: Cryptocurrency monitoring
- Test Case 2: Lead qualification
- Test Case 3: Content summarizer
- Existing test cases still pass

### 12.2 Phase 2: Answer Mapping Enhancement (Week 1-2)

**Objective:** Replace keyword answer mapping with AI semantic mapping

**Components:**
- MODIFY: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts` (mapAnswerToSpec)

**Changes:**
- Add AI semantic mapping to `mapAnswerToSpec()`
- Keep keyword switch as fallback
- Add AI-based option generation

**Success criteria:**
- AI mapping succeeds for 90%+ of test cases
- Handles synonyms and paraphrases
- No regression in existing functionality

**Tests:**
- Test Case 5: Ambiguous intent with follow-up
- Answer mapping with synonyms
- Answer mapping with paraphrases

### 12.3 Phase 3: Logical Architecture Enhancement (Week 2-3)

**Objective:** Enhance AI architecture generation to produce full LogicalArchitecture

**Components:**
- MODIFY: `lib/alex/artifact-generation/automation-spec.ts` (enhance LogicalArchitecture)
- MODIFY: `lib/alex/artifact-generation/workflow-manager-v2.ts` (enhance prompt)

**Changes:**
- Add data flow, failure paths, state requirements to LogicalArchitecture
- Enhance AI architecture prompt to generate full LogicalArchitecture
- Implement architecture review UI (frontend)

**Success criteria:**
- AI generates complete LogicalArchitecture with IDs, dependencies
- Architecture can be displayed as flow diagram
- User can modify architecture before generation

**Tests:**
- Architecture completeness validation
- Dependency validation
- Data flow validation

### 12.4 Phase 4: Platform Compiler (Week 3-4)

**Objective:** Implement LogicalArchitecture → Platform workflow compilation

**Components:**
- NEW: `lib/alex/artifact-generation/platform-compiler.ts`
- MODIFY: `lib/alex/artifact-generation/workflow-manager-v2.ts` (use compiler)

**Changes:**
- Create `PlatformCompiler.compile()` method
- Implement capability → node type mapping
- Implement connection configuration
- Implement failure handling node addition
- Replace direct AI workflow generation with compilation

**Success criteria:**
- Compiler generates valid n8n workflows
- All LogicalArchitecture stages are represented
- Failure paths are included
- No regression in workflow quality

**Tests:**
- Compiler output validation
- Capability mapping validation
- Connection validation

### 12.5 Phase 5: Semantic Validation (Week 4-5)

**Objective:** Add semantic validation against requirements

**Components:**
- NEW: `lib/alex/artifact-generation/semantic-validator.ts`
- MODIFY: `lib/alex/artifact-generation/workflow-manager-v2.ts` (add validation)

**Changes:**
- Create `SemanticValidator.validate()` method
- Implement requirement coverage validation
- Implement repair loop
- Add validation to workflow generation

**Success criteria:**
- Validation catches missing requirements
- Repair loop fixes 80%+ of issues
- No infinite loops in repair

**Tests:**
- Requirement coverage validation
- Repair loop validation
- Edge case handling

### 12.6 Phase 6: Cleanup (Week 5)

**Objective:** Remove obsolete code and clean up

**Components:**
- DELETE: `lib/alex/artifact-generation/workflow-manager.ts`
- DELETE: `lib/alex/artifact-generation/architecture-designer.ts`
- DELETE: `lib/alex/artifact-generation/architecture-planner.ts`
- DELETE: `lib/alex/intent-detector.ts` (keyword version)
- MODIFY: `lib/alex/artifact-generation/intelligence-analyzer-v2.ts` (remove keyword methods)

**Changes:**
- Delete obsolete classes
- Remove keyword methods from IntelligenceAnalyzerV2
- Remove feature flags
- Clean up imports

**Success criteria:**
- All obsolete code removed
- No unused imports
- Codebase is clean

**Tests:**
- Full integration test suite
- Regression tests

---

## 13. WHAT WE SHOULD DO NEXT

**Implement Phase 1: SemanticAnalyzer with keyword fallback.**

**Why:**
1. This is the **foundational change** - all other phases depend on semantic specification extraction
2. It has the **highest impact** on ALEX's intelligence - moves from keyword matching to AI understanding
3. It's **safe** - keyword fallbacks ensure no regression
4. It's **testable** - clear success criteria (AI extraction success rate)
5. It's **incremental** - can be deployed with feature flag

**Specific action:**
1. Create `lib/alex/artifact-generation/semantic-analyzer.ts` with `extractSpecification()` method
2. Integrate into `IntelligenceAnalyzerV2.handleNewRequest()` with try/catch fallback
3. Add feature flag `USE_AI_SPEC_EXTRACTION` (default: true)
4. Add extensive logging to track AI vs keyword usage
5. Write test cases for cryptocurrency monitoring, lead qualification, content summarizer
6. Monitor success rate and refine prompt as needed

This single change will transform ALEX from a keyword-matching system to a genuinely intelligent automation architect, enabling all subsequent phases.
