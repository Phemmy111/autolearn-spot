@echo off
cd /d "C:\Users\ACER\Desktop\autolearn-spot"
git add lib/alex/artifact-generation/intelligence-analyzer-v2.ts
git add lib/alex/artifact-generation/workflow-manager-v2.ts
git commit -m "fix(alex): add error handling for AI calls to prevent workflow failures

Added comprehensive error handling around all AI calls:
- IntelligenceAnalyzerV2.identifyBlockers: fallback to no blockers on error
- IntelligenceAnalyzerV2.formulateQuestion: fallback to simple question with 'Other' option
- WorkflowManagerV2.generateArchitectureWithAI: fallback to simple 3-stage architecture

This ensures the artifact workflow continues even if AI generation fails:
- Questions will still be asked (with fallback options)
- Architecture will still be proposed (with fallback stages)
- Workflow won't break and fall back to normal chat

Prevents the issue where AI errors cause the entire artifact workflow to fail and fall back to generic tutorials."
git push
