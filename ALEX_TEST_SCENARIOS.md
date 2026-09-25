# ALEX Test Scenarios

This document outlines comprehensive test scenarios to validate all ALEX phases and features.

## Phase 1: Core Unification - Basic Functionality

### Test 1.1: Basic Chat Response
**Description:** Send a simple message and verify ALEX responds correctly.

**Steps:**
1. Navigate to `/autolearn-ai`
2. Type "Hello, what can you help me with?"
3. Send the message
4. Verify response is received

**Expected Behavior:**
- ALEX responds with a helpful introduction
- Response is clear and educational
- No errors in console

**Success Criteria:**
- Response received within 5 seconds
- Response is text-based and readable
- No error messages shown to user

---

### Test 1.2: Multi-Provider Fallback
**Description:** Test provider fallback if primary provider fails.

**Steps:**
1. Configure primary provider with invalid API key
2. Configure secondary provider with valid API key
3. Send a test message
4. Verify fallback works

**Expected Behavior:**
- Primary provider attempt fails
- System automatically falls back to secondary provider
- Response is still generated successfully

**Success Criteria:**
- Fallback occurs automatically
- User receives response despite primary failure
- Console logs show fallback activation

---

## Phase 2: Intelligent Task Router

### Test 2.1: Task Classification - Coding
**Description:** Verify coding tasks are correctly classified.

**Steps:**
1. Send message: "Help me write a function to sort an array in JavaScript"
2. Check task classification in console logs

**Expected Behavior:**
- Task classified as "coding"
- Complexity detected (simple/moderate/complex)
- Execution path set to "direct_chat" or "agent_execution"

**Success Criteria:**
- Primary type: "coding"
- Complexity: "simple" or "moderate"
- Recommended mode: "developer"

---

### Test 2.2: Task Classification - Research
**Description:** Verify research tasks are correctly classified.

**Steps:**
1. Send message: "What are the latest developments in AI as of 2026?"
2. Check task classification in console logs

**Expected Behavior:**
- Task classified as "research"
- Knowledge freshness: "current" or "real_time"
- Web research enabled automatically

**Success Criteria:**
- Primary type: "research"
- Knowledge freshness: "current"
- Execution parameters include enableWebResearch: true

---

### Test 2.3: Complexity Detection
**Description:** Verify complexity detection for different task types.

**Steps:**
1. Send simple task: "What is 2 + 2?"
2. Send complex task: "Build a complete e-commerce platform with payment processing"
3. Compare complexity classifications

**Expected Behavior:**
- Simple task: complexity = "simple"
- Complex task: complexity = "complex" or "multi_stage"

**Success Criteria:**
- Complexity scores differ significantly
- Subtask estimates increase with complexity

---

## Phase 3: Task Planner + Execution Engine

### Test 3.1: File Analysis Tool - Summary
**Description:** Test file analysis tool with summary analysis type.

**Steps:**
1. Upload a PDF or text file
2. Ask ALEX: "Summarize this file"
3. Verify file analysis tool is called

**Expected Behavior:**
- File analysis tool is invoked
- Summary is generated
- File content is analyzed

**Success Criteria:**
- Tool call logged in console
- Summary returned successfully
- Summary is relevant to file content

---

### Test 3.2: File Analysis Tool - Structure
**Description:** Test file analysis tool with structure analysis type.

**Steps:**
1. Upload a structured document
2. Ask ALEX: "Analyze the structure of this document"
3. Verify structure analysis is performed

**Expected Behavior:**
- File analysis tool is invoked with structure type
- Document structure is identified
- Sections/chapters are listed

**Success Criteria:**
- Structure analysis completed
- Sections identified correctly
- Output is organized and readable

---

### Test 3.3: Task Planning for Complex Tasks
**Description:** Verify task planner creates execution plans for complex tasks.

**Steps:**
1. Send message: "Research and implement a workflow for automated email responses"
2. Check if task plan is generated
3. Verify subtasks and dependencies

**Expected Behavior:**
- Task planner generates structured plan
- Subtasks are defined with dependencies
- Estimated durations are provided

**Success Criteria:**
- Task plan created with multiple subtasks
- Dependencies are logical
- Verification criteria included

---

## Phase 5: Knowledge Engine

### Test 5.1: Source Quality Ranking
**Description:** Verify web search results are ranked by source quality.

**Steps:**
1. Send message requiring web research: "What is the official documentation for Next.js 16?"
2. Check console for source quality scores
3. Verify official docs are ranked higher

**Expected Behavior:**
- Web search results are quality-ranked
- Official documentation receives high scores
- Lower-quality sources are deprioritized

**Success Criteria:**
- Quality scores logged in console
- Official docs ranked in top results
- Quality category assigned (official/primary/reputable)

---

### Test 5.2: Contextual Retrieval
**Description:** Verify retrieval is context-aware with task type.

**Steps:**
1. Send coding question with technical terms
2. Check retrieval scores in console
3. Verify task-type boosting is applied

**Expected Behavior:**
- Retrieval considers task type (coding)
- Technical terms boost relevant chunks
- Contextual scores are calculated

**Success Criteria:**
- Contextual score logged
- Task-type aware scoring applied
- Relevant chunks prioritized

---

### Test 5.3: Freshness-Aware Retrieval
**Description:** Verify retrieval considers information freshness.

**Steps:**
1. Send question about current technology: "What are the new features in React 19?"
2. Enable preferLatest in retrieval options
3. Verify newer sources are prioritized

**Expected Behavior:**
- Freshness ranking is applied
- Newer chunks receive higher scores
- Date-based filtering works

**Success Criteria:**
- Freshness ranking enabled
- Recent content prioritized
- Older content deprioritized

---

## Phase 6: Digital Expertise Engine

### Test 6.1: Domain Detection - AI
**Description:** Verify AI domain is detected from content.

**Steps:**
1. Send message: "How do I implement RAG with vector databases?"
2. Check system prompt for AI expertise additions

**Expected Behavior:**
- Domain detected as "ai"
- AI expertise profile applied
- System prompt includes AI-specific guidance

**Success Criteria:**
- Domain = "ai"
- System prompt includes AI expertise
- AI terminology and reasoning patterns applied

---

### Test 6.2: Domain Detection - Web Development
**Description:** Verify web development domain is detected.

**Steps:**
1. Send message: "How do I create a responsive React component with Tailwind CSS?"
2. Check system prompt for web expertise additions

**Expected Behavior:**
- Domain detected as "web"
- Web expertise profile applied
- System prompt includes web-specific guidance

**Success Criteria:**
- Domain = "web"
- System prompt includes web expertise
- HTML/CSS/JS and framework guidance applied

---

### Test 6.3: Domain Detection - Automation
**Description:** Verify automation domain is detected.

**Steps:**
1. Send message: "How do I create an n8n workflow with webhooks and API calls?"
2. Check system prompt for automation expertise additions

**Expected Behavior:**
- Domain detected as "automation"
- Automation expertise profile applied
- System prompt includes automation-specific guidance

**Success Criteria:**
- Domain = "automation"
- System prompt includes automation expertise
- n8n and API integration guidance applied

---

### Test 6.4: All 13 Domains
**Description:** Test all 13 domain expertise profiles.

**Steps:**
1. Send messages for each domain:
   - AI: "Explain LLM token limits"
   - Software: "Debug this function"
   - Web: "Create a landing page"
   - UI/UX: "Design a user flow"
   - Automation: "Build a workflow"
   - Marketing: "Create a campaign"
   - Business: "Analyze unit economics"
   - Data: "Analyze this dataset"
   - Cybersecurity: "Secure this API"
   - Cloud: "Deploy to AWS"
   - Content: "Write a blog post"
   - E-commerce: "Set up a store"
   - Education: "Create a lesson"
2. Verify each domain is detected correctly

**Expected Behavior:**
- Each domain detected correctly
- Appropriate expertise profile applied
- System prompt customized per domain

**Success Criteria:**
- All 13 domains detected
- Expertise profiles applied correctly
- No detection errors

---

## Phase 7: Multi-Agent Coordination

### Test 7.1: Multi-Domain Detection
**Description:** Verify multi-domain tasks are detected.

**Steps:**
1. Send message: "Build a website with payment processing for e-commerce"
2. Check if multi-agent coordination is triggered
3. Verify supporting domains are identified

**Expected Behavior:**
- Multi-domain collaboration detected
- Primary domain: "web" or "ecommerce"
- Supporting domains: "automation", "cybersecurity"

**Success Criteria:**
- Collaboration analysis shows needsCollaboration: true
- Supporting domains identified
- Collaboration plan created

---

### Test 7.2: Parallel Coordination
**Description:** Verify parallel execution of multiple agents.

**Steps:**
1. Send message requiring multiple domains: "Create an AI-powered automation workflow"
2. Enable multi-agent coordination
3. Verify agents execute in parallel

**Expected Behavior:**
- Multiple agents spawned
- Execution strategy: "parallel"
- Results synthesized from all agents

**Success Criteria:**
- Multiple agent executions logged
- Parallel strategy used
- Synthesis completed successfully

---

### Test 7.3: Sequential Coordination
**Description:** Verify sequential execution when appropriate.

**Steps:**
1. Send message with clear dependency: "Analyze data then create a dashboard"
2. Verify sequential execution
3. Check task dependencies

**Expected Behavior:**
- Execution strategy: "sequential"
- Primary agent executes first
- Supporting agents execute after primary

**Success Criteria:**
- Sequential strategy used
- Dependencies respected
- Results cascade correctly

---

## Phase 8: Advanced Memory & Learning

### Test 8.1: Pattern Detection - Topics
**Description:** Verify topic patterns are detected from memories.

**Steps:**
1. Send multiple messages about automation over several conversations
2. Check memory patterns in console
3. Verify automation pattern is detected

**Expected Behavior:**
- Topic pattern: "automation" detected
- Pattern strength increases with frequency
- Examples collected from memories

**Success Criteria:**
- Pattern category: "topic"
- Pattern strength > 0.4
- Frequency count accurate

---

### Test 8.2: Memory Consolidation
**Description:** Verify similar memories are consolidated.

**Steps:**
1. Create multiple similar memories about the same topic
2. Trigger memory consolidation
3. Verify consolidation occurs

**Expected Behavior:**
- Similar memories grouped by topic
- Consolidation strategy applied
- Consolidated memory created

**Success Criteria:**
- Consolidation completed
- Original memories marked
- Consolidated memory includes source references

---

### Test 8.3: Forgetting Curve
**Description:** Verify forgetting curve is applied to old memories.

**Steps:**
1. Create a memory
2. Wait (simulate time passing)
3. Access other memories but not this one
4. Check if importance decreased

**Expected Behavior:**
- Memory importance decreases over time
- Forgetting curve applied
- Inactive memories may be deactivated

**Success Criteria:**
- Importance adjusted based on time
- Retention factor calculated
- Old memories deprioritized

---

### Test 8.4: Learning Insights
**Description:** Verify learning insights are generated from patterns.

**Steps:**
1. Generate patterns from memories
2. Check learning insights
3. Verify actionable insights are created

**Expected Behavior:**
- Learning insights generated
- Insights categorized (skill_progress, behavior_pattern, etc.)
- Actionable suggestions provided

**Success Criteria:**
- Insights generated
- Confidence scores assigned
- Actionable suggestions included

---

## Phase 9: Self-Improvement & Feedback

### Test 9.1: Feedback Collection
**Description:** Verify user feedback is collected and stored.

**Steps:**
1. Send a message
2. Provide thumbs up feedback
3. Check feedback is recorded

**Expected Behavior:**
- Feedback collected
- Feedback type: "thumbs_up"
- Timestamp recorded

**Success Criteria:**
- Feedback stored in memory
- Feedback count increments
- Positive ratio calculated

---

### Test 9.2: Feedback Analysis
**Description:** Verify feedback is analyzed for trends.

**Steps:**
1. Provide multiple feedback responses (positive and negative)
2. Check feedback analysis
3. Verify trend detection

**Expected Behavior:**
- Feedback analysis performed
- Positive ratio calculated
- Trend identified (improving/declining/stable)

**Success Criteria:**
- Analysis completed
- Trend detected correctly
- Common issues identified

---

### Test 9.3: Adaptive Behavior Generation
**Description:** Verify adaptive behaviors are generated from feedback.

**Steps:**
1. Provide negative feedback about response clarity
2. Check adaptive behaviors
3. Verify behavior is generated

**Expected Behavior:**
- Adaptive behavior generated
- Behavior type: "response_style"
- Action: Use clearer language

**Success Criteria:**
- Behavior created
- Confidence score assigned
- Trigger condition defined

---

### Test 9.4: System Prompt Adaptation
**Description:** Verify system prompt is adapted based on feedback.

**Steps:**
1. Provide feedback triggering adaptive behavior
2. Send a new message
3. Check system prompt includes adaptive additions

**Expected Behavior:**
- Adaptive behavior applied to system prompt
- System prompt includes guidance from feedback
- Response style adjusted

**Success Criteria:**
- System prompt adapted
- Adaptive additions visible
- Response reflects adaptation

---

## Phase 10: Advanced Artifact Generation

### Test 10.1: Structure Validation
**Description:** Verify artifact structure is validated.

**Steps:**
1. Generate a workflow artifact
2. Check structure validation step
3. Verify structure validation passes

**Expected Behavior:**
- Structure validation executed
- Connectivity checked
- Circular references detected

**Success Criteria:**
- Validation step completed
- Errors reported if any
- Warnings for issues

---

### Test 10.2: Security Validation
**Description:** Verify artifact security is validated.

**Steps:**
1. Generate a workflow with potential security issues
2. Check security validation step
3. Verify security issues are detected

**Expected Behavior:**
- Security validation executed
- Hardcoded secrets detected
- Insecure protocols flagged

**Success Criteria:**
- Security validation completed
- Security errors reported
- Warnings for risks

---

### Test 10.3: Quality Scoring
**Description:** Verify quality score is calculated correctly.

**Steps:**
1. Generate an artifact
2. Check quality score breakdown
3. Verify all dimensions scored

**Expected Behavior:**
- Quality score calculated
- All 5 dimensions scored:
  - Completeness
  - Correctness
  - Efficiency
  - Maintainability
  - Security

**Success Criteria:**
- Overall score: 0-100
- Dimension scores: 0-100
- Details include strengths/weaknesses

---

### Test 10.4: Iterative Refinement
**Description:** Verify artifact is refined based on validation.

**Steps:**
1. Generate artifact with quality < 80
2. Verify refinement iteration occurs
3. Check quality improves after refinement

**Expected Behavior:**
- Iterative refinement triggered
- Artifact refined based on validation
- Quality score improves

**Success Criteria:**
- Refinement iteration executed
- Changes applied
- Quality score increases

---

## Integration Tests

### Test IT.1: End-to-End Chat with All Features
**Description:** Complete chat session testing all phases.

**Steps:**
1. Start new conversation
2. Send message: "Help me build an AI-powered automation workflow for my business"
3. Verify domain detection (automation)
4. Verify task classification (coding/automation)
5. Verify web research if needed
6. Verify retrieval if relevant
7. Verify expertise profile applied
8. Check response quality

**Expected Behavior:**
- All phases work together
- Response is high quality
- No errors in console
- Response is relevant and helpful

**Success Criteria:**
- No errors
- Response received
- All features activated appropriately
- User satisfied with response

---

### Test IT.2: Multi-Agent Collaboration Scenario
**Description:** Complex task requiring multiple domain experts.

**Steps:**
1. Send message: "Build a secure e-commerce website with AI-powered recommendations"
2. Enable multi-agent coordination
3. Verify multiple agents collaborate
4. Check synthesized result

**Expected Behavior:**
- Multi-domain detection: web, ecommerce, ai, cybersecurity
- Multiple agents spawned
- Results synthesized effectively
- Final response integrates all perspectives

**Success Criteria:**
- Collaboration successful
- Synthesis quality high
- Response comprehensive
- No conflicts between agents

---

### Test IT.3: Memory and Learning Scenario
**Description:** Test memory persistence and learning over time.

**Steps:**
1. Send multiple messages about learning automation
2. Create memories explicitly
3. Check pattern detection
4. Verify learning insights
5. Send new message about automation
6. Verify improved response based on learning

**Expected Behavior:**
- Memories stored
- Patterns detected
- Learning insights generated
- Response quality improves over time

**Success Criteria:**
- Memory system working
- Patterns detected
- Learning applied
- Progressive improvement

---

## Performance Tests

### Test PT.1: Response Time
**Description:** Verify response times are acceptable.

**Steps:**
1. Send 10 test messages
2. Measure response time for each
3. Calculate average response time

**Expected Behavior:**
- Average response time < 10 seconds
- No timeouts
- Consistent performance

**Success Criteria:**
- Average < 10s
- 95th percentile < 15s
- No timeouts

---

### Test PT.2: Concurrent Users
**Description:** Verify system handles concurrent users.

**Steps:**
1. Simulate 5 concurrent users
2. Each user sends messages
3. Verify all responses received

**Expected Behavior:**
- All users receive responses
- No resource conflicts
- No performance degradation

**Success Criteria:**
- All requests handled
- No errors
- Response times acceptable

---

## Error Handling Tests

### Test EH.1: Invalid Input
**Description:** Verify graceful handling of invalid input.

**Steps:**
1. Send empty message
2. Send extremely long message
3. Send special characters
4. Verify system handles gracefully

**Expected Behavior:**
- System validates input
- Appropriate error messages
- No crashes

**Success Criteria:**
- Input validation works
- Errors handled gracefully
- User receives helpful feedback

---

### Test EH.2: Provider Failure
**Description:** Verify system handles provider failures.

**Steps:**
1. Configure provider with invalid credentials
2. Send message
3. Verify fallback occurs
4. Verify error is handled

**Expected Behavior:**
- Primary provider fails
- Fallback provider used
- User receives response
- Error logged appropriately

**Success Criteria:**
- Fallback works
- User not affected
- Error logged

---

## Security Tests

### Test ST.1: Sensitive Data Protection
**Description:** Verify sensitive data is not stored in memories.

**Steps:**
1. Send message with fake API key
2. Check if memory is created
3. Verify sensitive pattern detection

**Expected Behavior:**
- Sensitive pattern detected
- Memory creation rejected
- User warned about sensitive data

**Success Criteria:**
- Sensitive data rejected
- User informed
- No secrets stored

---

### Test ST.2: Security Validation in Artifacts
**Description:** Verify security validation catches issues.

**Steps:**
1. Generate artifact with hardcoded secrets
2. Check security validation
3. Verify secrets are flagged

**Expected Behavior:**
- Security validation executed
- Hardcoded secrets detected
- User warned about security issues

**Success Criteria:**
- Security issues detected
- User informed
- Artifacts with issues flagged

---

## Test Execution Guide

### Manual Testing
1. Navigate to `/autolearn-ai`
2. Open browser console to see logs
3. Execute each test scenario
4. Record results in test log

### Automated Testing (Future)
- Implement test automation framework
- Create API endpoint for test execution
- Run tests in CI/CD pipeline

### Test Reporting
- Document test results
- Track bugs and issues
- Generate test coverage report

---

## Success Criteria Summary

**Overall Success:**
- All 10 phases tested
- 80%+ of test scenarios pass
- No critical bugs
- Performance acceptable
- Security validated

**Phase-Specific Success:**
- Phase 1: Basic chat works
- Phase 2: Task classification accurate
- Phase 3: File analysis functional
- Phase 5: Retrieval quality high
- Phase 6: Domain detection accurate
- Phase 7: Multi-agent coordination works
- Phase 8: Memory and learning functional
- Phase 9: Feedback and adaptation works
- Phase 10: Artifact validation functional
