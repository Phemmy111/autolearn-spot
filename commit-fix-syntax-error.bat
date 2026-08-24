@echo off
cd /d "C:\Users\ACER\Desktop\autolearn-spot"
git add lib/alex/artifact-generation/workflow-manager-v2.ts
git commit -m "fix(alex): fix syntax error in workflow generation prompt

Fixed syntax error in template literal:
- Removed JSON example from prompt template literal
- Simplified prompt to avoid parsing conflicts
- AI still generates valid n8n workflow JSON
- Build should now succeed

The JSON example in the template was causing Turbopack to fail parsing."
git push
