@echo off
cd /d "C:\Users\ACER\Desktop\autolearn-spot"
git add lib/alex/artifact-generation/intelligence-analyzer-v2.ts
git add lib/alex/artifact-generation/workflow-manager-v2.ts
git commit -m "debug(alex): add extensive debugging for AI failures

Added comprehensive debugging to understand why AI is failing:
- IntelligenceAnalyzerV2.identifyBlockers: logs every step, error details
- IntelligenceAnalyzerV2.formulateQuestion: logs prompt length, response, parsing
- WorkflowManagerV2.generateArchitectureWithAI: logs prompt length, response, parsing
- Added text extraction fallback when JSON parsing fails
- Better error messages with JSON.stringify of error objects

This will help identify if the issue is:
- AI model not responding
- AI responding with non-JSON
- Timeout issues
- Token limit issues
- Other AI engine problems"
git push
