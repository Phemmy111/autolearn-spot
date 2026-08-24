$filePath = "C:\Users\ACER\Desktop\autolearn-spot\lib\alex\artifact-generation\workflow-manager-v2.ts"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace the problematic template literal with string concatenation
$oldPrompt = @'
    const prompt = 'You are an expert n8n workflow architect. Generate a complete n8n workflow JSON for the following automation.

Request: ${spec.description || spec.automationType || 'General automation'}
Automation Type: ${spec.automationType || 'automation'}
Domain: ${spec.domain || 'custom'}
Platform: n8n

Key Requirements:
${spec.aiConfig?.enabled ? '- AI processing is enabled (use OpenAI node)' : '- No AI processing'}
${spec.integrations?.emailProvider ? `- Email provider: ${spec.integrations.emailProvider} (use Email node)` : ''}
${spec.integrations?.aiProvider ? `- AI provider: ${spec.integrations.aiProvider} (use OpenAI node)` : ''}
${spec.trigger?.type ? `- Trigger type: ${spec.trigger.type}` : '- Default to Webhook trigger'}

Generate a complete n8n workflow JSON with:
1. Nodes array with properly configured nodes
2. Connections object defining node connections
3. name field for the workflow
4. settings object with proper n8n settings
5. active: true
6. Valid node types (n8n-nodes-base.*)

Return ONLY valid JSON. Do not include any text before or after the JSON.'
'@

$newPrompt = @'
    const aiReq = spec.description || spec.automationType || 'General automation'
    const aiType = spec.automationType || 'automation'
    const aiDomain = spec.domain || 'custom'
    const aiAI = spec.aiConfig?.enabled ? '- AI processing is enabled (use OpenAI node)' : '- No AI processing'
    const aiEmail = spec.integrations?.emailProvider ? '- Email provider: ' + spec.integrations.emailProvider + ' (use Email node)' : ''
    const aiProvider = spec.integrations?.aiProvider ? '- AI provider: ' + spec.integrations.aiProvider + ' (use OpenAI node)' : ''
    const aiTrigger = spec.trigger?.type ? '- Trigger type: ' + spec.trigger.type : '- Default to Webhook trigger'

    const prompt = 'You are an expert n8n workflow architect. Generate a complete n8n workflow JSON for the following automation.\n\nRequest: ' + aiReq + '\nAutomation Type: ' + aiType + '\nDomain: ' + aiDomain + '\nPlatform: n8n\n\nKey Requirements:\n' + aiAI + '\n' + aiEmail + '\n' + aiProvider + '\n' + aiTrigger + '\n\nGenerate a complete n8n workflow JSON with:\n1. Nodes array with properly configured nodes\n2. Connections object defining node connections\n3. name field for the workflow\n4. settings object with proper n8n settings\n5. active: true\n6. Valid node types (n8n-nodes-base.*)\n\nReturn ONLY valid JSON. Do not include any text before or after the JSON.'
'@

$content = $content.Replace($oldPrompt, $newPrompt)
Set-Content $filePath $content -Encoding UTF8 -NoNewline

Write-Host "Fixed template literal issue"
