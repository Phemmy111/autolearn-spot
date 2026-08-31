export const WorkflowTemplates = [
  {
    id: 'lead_capture',
    keywords: ['lead', 'crm', 'airtable', 'sheet', 'form'],
    title: 'CONCRETE EXAMPLE (Webhook Lead Capture to Google Sheets):',
    json: `{
  "name": "Lead Capture & Routing",
  "nodes": [
    { "parameters": { "httpMethod": "POST", "path": "new-lead" }, "id": "uuid-L1", "name": "Webhook (Lead Form)", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [100, 300] },
    { "parameters": { "conditions": { "string": [ { "value1": "={{ $json.body.budget }}", "operation": "contains", "value2": "high" } ] } }, "id": "uuid-L2", "name": "Is High Budget?", "type": "n8n-nodes-base.if", "typeVersion": 1, "position": [300, 300] },
    { "parameters": { "resource": "message", "operation": "post", "text": "🔥 Hot Lead: ={{ $json.body.email }}" }, "id": "uuid-L3", "name": "Slack Alert", "type": "n8n-nodes-base.slack", "typeVersion": 2, "position": [500, 200] },
    { "parameters": { "operation": "append", "sheetId": "your-sheet-id", "options": {} }, "id": "uuid-L4", "name": "Save to Sheets", "type": "n8n-nodes-base.googleSheets", "typeVersion": 4.3, "position": [500, 400] },
    { "parameters": { "respondWith": "text", "responseBody": "Lead received" }, "id": "uuid-L5", "name": "Respond to Webhook", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [700, 300] }
  ],
  "connections": {
    "Webhook (Lead Form)": { "main": [[ { "node": "Is High Budget?", "type": "main", "index": 0 } ]] },
    "Is High Budget?": { "main": [
      [ { "node": "Slack Alert", "type": "main", "index": 0 }, { "node": "Save to Sheets", "type": "main", "index": 0 } ],
      [ { "node": "Save to Sheets", "type": "main", "index": 0 } ]
    ] },
    "Save to Sheets": { "main": [[ { "node": "Respond to Webhook", "type": "main", "index": 0 } ]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }
}`
  },
  {
    id: 'rss_digest',
    keywords: ['rss', 'news', 'digest', 'feed', 'summary', 'weekly'],
    title: 'CONCRETE EXAMPLE (Daily RSS Feed AI Digest):',
    json: `{
  "name": "Daily AI News Digest",
  "nodes": [
    { "parameters": { "rule": { "type": "cron", "cronExpression": "0 8 * * *" } }, "id": "uuid-R1", "name": "Schedule (8 AM)", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.1, "position": [100, 300] },
    { "parameters": { "url": "https://news.ycombinator.com/rss" }, "id": "uuid-R2", "name": "Read RSS", "type": "n8n-nodes-base.rssFeedRead", "typeVersion": 1, "position": [300, 300] },
    { "parameters": { "operation": "limit", "maxItems": 5 }, "id": "uuid-R3", "name": "Limit to Top 5", "type": "n8n-nodes-base.itemLists", "typeVersion": 3, "position": [500, 300] },
    { "parameters": { "prompt": "Summarize this article into 2 bullet points: ={{ $json.title }} - {{ $json.content }}" }, "id": "uuid-R4", "name": "AI Summarize", "type": "@n8n/n8n-nodes-langchain.chainLlm", "typeVersion": 1.4, "position": [700, 300] },
    { "parameters": { "model": "models/gemini-1.5-flash" }, "id": "uuid-R5", "name": "Gemini Model", "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", "typeVersion": 1, "position": [700, 500] },
    { "parameters": { "operation": "send", "sendTo": "you@email.com", "subject": "Daily Digest", "message": "={{ $json.text }}" }, "id": "uuid-R6", "name": "Send Email", "type": "n8n-nodes-base.gmail", "typeVersion": 2.1, "position": [900, 300] }
  ],
  "connections": {
    "Schedule (8 AM)": { "main": [[ { "node": "Read RSS", "type": "main", "index": 0 } ]] },
    "Read RSS": { "main": [[ { "node": "Limit to Top 5", "type": "main", "index": 0 } ]] },
    "Limit to Top 5": { "main": [[ { "node": "AI Summarize", "type": "main", "index": 0 } ]] },
    "Gemini Model": { "ai_languageModel": [[ { "node": "AI Summarize", "type": "ai_languageModel", "index": 0 } ]] },
    "AI Summarize": { "main": [[ { "node": "Send Email", "type": "main", "index": 0 } ]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }
}`
  }
]
