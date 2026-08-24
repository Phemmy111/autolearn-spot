@echo off
cd /d "C:\Users\ACER\Desktop\autolearn-spot"
git add lib/alex/artifact-generation/workflow-ai-service.ts
git add lib/alex/artifact-generation/intelligence-analyzer-v2.ts
git add lib/alex/artifact-generation/workflow-manager-v2.ts
git commit -m "feat(alex): implement dedicated WorkflowAIService to fix circular dependency

Created WorkflowAIService to bypass AIEngine for workflow generation:
- Direct provider calls (Groq, OpenRouter) instead of AIEngine
- Eliminates circular dependency (AI calling AI from within AI)
- No provider state conflicts or message array corruption
- Cleaner separation of concerns

Updated workflow AI calls:
- IntelligenceAnalyzerV2.identifyBlockers uses WorkflowAIService
- IntelligenceAnalyzerV2.formulateQuestion uses WorkflowAIService
- WorkflowManagerV2.generateArchitectureWithAI uses WorkflowAIService
- Removed fallback architecture (AI must work now)

This is the architectural fix to make ALEX truly AI-powered without the circular dependency issues that were causing all providers to fail."
git push
