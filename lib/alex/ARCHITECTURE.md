# ALEX Architecture Map

**Phase 1: Core Unification - Architecture Mapping**
**Phase 2: Intelligent Task Router**
**Phase 3: Task Planner + Execution Engine**
**Phase 5: Knowledge Engine Enhancement**
**Phase 6: Digital Expertise Engine**
**Phase 7: Multi-Agent Coordination**

## Existing ALEX Systems

### 1. Intelligence Core
- **Orchestrator** (`lib/alex/orchestrator.ts`)
  - Central coordination for AI interactions
  - Intent detection and mode routing
  - Context assembly coordination
  - Agent mode execution
  - Artifact workflow routing

- **AI Engine** (`lib/alex/ai-engine.ts`)
  - Provider-agnostic AI execution
  - Streaming support
  - Model capability handling

### 2. Provider Management
- **Provider Manager** (`lib/alex/provider/provider-manager.ts`)
  - Multi-provider orchestration
  - Health monitoring
  - Fallback handling
  - TPM/token budgeting
  - Provider loading from database
  - API key encryption/decryption

- **Provider Registry** (`lib/alex/provider/provider-registry.ts`)
  - Provider registration
  - Provider lookup
  - Capability tracking

- **Provider Factory** (`lib/alex/provider/provider-factory.ts`)
  - Provider instantiation
  - Configuration handling

### 3. Tool System
- **Tool Registry** (`lib/alex/tools/tool-registry.ts`)
  - Tool registration/unregistration
  - Tool validation
  - Argument validation
  - Duplicate prevention

- **Tool Execution Service** (`lib/alex/tools/tool-execution-service.ts`)
  - Tool execution coordination
  - Error handling
  - Logging

- **Built-in Tools**:
  - Calculator tool
  - Current time tool
  - Web search tool
  - Workflow tools (parse, validate, analyze, debug, repair)

### 4. Agent System
- **Agent Service** (`lib/alex/agents/agent-service.ts`)
  - Controlled multi-step execution
  - Safety limits
  - Progress tracking
  - Database logging

- **Agent Config** (`lib/alex/agents/agent-config.ts`)
  - Configuration management
  - Safety parameters

### 5. Knowledge Engine
- **Context Assembly** (`lib/alex/context-assembly.ts`)
  - Platform context integration
  - File/document context
  - Web research integration
  - Memory retrieval
  - Token-aware assembly

- **Retrieval** (`lib/alex/retrieval.ts`)
  - Vector similarity search
  - RAG implementation
  - Chunk ranking
  - Freshness awareness

- **Embeddings** (`lib/alex/embeddings.ts`)
  - Text chunking
  - Embedding generation
  - Indexing

- **Web Research Service** (`lib/alex/web-research/web-research-service.ts`)
  - Current information retrieval
  - Source quality assessment

### 6. Memory System
- **Memory Service** (`lib/alex/memory/memory-service.ts`)
  - Memory CRUD operations
  - Embedding generation
  - Retrieval

- **Memory Commands** (`lib/alex/memory/memory-commands.ts`)
  - Command parsing
  - Command execution

### 7. Artifact Generation
- **Artifact Service** (`lib/alex/artifact-generation/artifact-service.ts`)
  - Build workflow management
  - Requirement collection
  - Artifact persistence

- **Workflow Manager V2** (`lib/alex/artifact-generation/workflow-manager-v2.ts`)
  - Template-driven workflow generation
  - Question management

- **Workflow Orchestrator** (`lib/alex/orchestration/workflow-orchestrator.ts`)
  - AI-driven workflow orchestration
  - Architecture design
  - Artifact generation

### 8. File Intelligence
- **File Extraction** (`lib/alex/file-extraction.ts`)
  - PDF, DOCX, TXT processing
  - Text extraction
  - Metadata extraction

- **Vision Service** (`lib/alex/vision-service.ts`)
  - Image understanding
  - Screenshot analysis
  - Multimodal support

### 9. Intent Understanding
- **Intent Detector** (`lib/alex/intent-detector.ts`)
  - Intent classification
  - Mode suggestion
  - Artifact generation detection

### 10. Cost Management
- **Cost Tracker** (`lib/alex/cost-tracker.ts`)
  - Token tracking
  - Cost estimation
  - Usage logging

- **Token Estimation** (`lib/alex/token-estimation.ts`)
  - Token counting
  - Context limit management

### 11. Error Handling
- **Error Handler** (`lib/alex/error-handler.ts`)
  - Error classification
  - Recovery strategies

### 12. Knowledge Engine (Phase 5)
- **Source Quality Ranker** (`lib/alex/knowledge/source-quality-ranker.ts`)
  - Domain-based source ranking
  - Quality category classification
  - Freshness scoring

- **Contextual Retrieval** (`lib/alex/knowledge/contextual-retrieval.ts`)
  - Context-aware chunk selection
  - Task-type aware scoring
  - Conversation context consideration

### 13. Digital Expertise Engine (Phase 6)
- **Expertise Profile Registry** (`lib/alex/expertise/expertise-profiles.ts`)
  - 13 domain expertise profiles
  - Automatic domain detection
  - System prompt customization
  - Domain-specific reasoning patterns

### 14. Multi-Agent Coordination (Phase 7)
- **Multi-Agent Coordinator** (`lib/alex/agents/multi-agent-coordinator.ts`)
  - Multi-domain task analysis
  - Collaboration plan creation
  - Agent execution coordination
  - Result synthesis strategies
  - Sequential, parallel, and hierarchical coordination

## Database Tables

### ALEX Tables
- `alex_conversations` - Conversation storage
- `alex_messages` - Message storage
- `alex_files` - File storage
- `alex_embeddings` - Vector embeddings
- `alex_chunks` - Document chunks
- `alex_memories` - Memory storage
- `alex_tool_calls` - Tool execution records
- `alex_artifact_builds` - Artifact build tracking
- `alex_artifact_questions` - Requirement questions
- `alex_artifacts` - Generated artifacts
- `alex_provider_config` - Provider configurations
- `alex_usage` - Usage tracking
- `agent_executions` - Agent execution logs
- `agent_steps` - Agent step logs

## Current Capabilities

### ✅ Already Implemented
1. Multi-provider support with fallback
2. Tool registry and execution
3. RAG with vector similarity search
4. File/document processing
5. Image/multimodal support
6. Memory system
7. Web research
8. Agent execution with safety limits
9. Artifact generation workflows
10. Token-aware context assembly
11. Intent detection
12. Platform context integration
13. Cost tracking and TPM limits
14. **Task Router (Phase 2)** - 22 task types, complexity detection, knowledge freshness
15. **Task Planner (Phase 3)** - Structured execution plans, file analysis tool
16. **Source Quality Ranking (Phase 5)** - Domain-based source ranking, quality categories
17. **Contextual Retrieval (Phase 5)** - Context-aware chunk selection, task-type aware
18. **Digital Expertise Engine (Phase 6)** - 13 domain profiles, automatic domain detection
19. **Multi-Agent Coordination (Phase 7)** - Multi-domain collaboration, result synthesis

### 🔄 Potential Duplication Areas
1. **Workflow Systems**: Both WorkflowManagerV2 and WorkflowOrchestrator exist
   - WorkflowManagerV2: Template-driven
   - WorkflowOrchestrator: AI-driven
   - Both serve different purposes - NOT duplication

2. **Context Assembly**: Multiple context sources
   - Platform context
   - File context
   - Web research
   - Memory
   - Token-aware assembly
   - Unified in `context-assembly.ts` - NOT duplication

### ❌ No Critical Duplication Found
The existing architecture is well-structured with clear separation of concerns.

## Phase 1 Conclusion

**Status**: ALEX architecture is already unified and well-structured.

**Actions Taken**:
1. ✅ Mapped all existing systems
2. ✅ Identified system purposes and integration points
3. ✅ Verified no critical duplication
4. ✅ Confirmed separation of concerns

**Next Phase**: Phase 2 - Intelligent Task Router
Since the architecture is already unified, we can proceed directly to implementing the Task Router to enhance ALEX's ability to classify and route complex tasks intelligently.
