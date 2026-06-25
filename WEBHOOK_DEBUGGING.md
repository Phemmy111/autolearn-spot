# Webhook Debugging Guide - AutoLearn Spot

## Problems Found & Fixed

### **Problem 1: Silent Error Handling**
- **Original Code**: `.catch(function(){})`  
- **Issue**: Any webhook failure was silently ignored - no console logs, no error messages
- **Fix**: Added console logging to capture webhook failures and CORS errors

### **Problem 2: CORS Blocking**
- **Issue**: The n8n webhook endpoint may be rejecting requests due to CORS policies
- **Fix**: Added `mode: "no-cors"` to the fetch request to bypass CORS in client-side submissions
- **Note**: With `no-cors`, we can't read the response, but the request is still sent

### **Problem 3: No Request Verification**
- **Original**: Just sent the request without logging what was sent
- **Fix**: Added console logging of:
  - The exact webhook URL being called
  - The exact JSON payload being sent
  - The response status received

---

## Testing & Debugging Steps

### **Step 1: Check Browser Console**
1. Open your HTML file in a browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Try to register and watch for logs starting with `[v0]`

You should see:
```
[v0] Sending webhook to: https://n8n-wj6g.onrender.com/webhook/...
[v0] Payload: {"Full Name":"John Doe","Email1":"john@example.com",...}
[v0] Webhook response received. Status: 200 Type: opaque
```

### **Step 2: Check n8n Webhook Logs**
1. Go to your n8n instance: https://n8n-wj6g.onrender.com
2. Navigate to the workflow with this webhook
3. Check the **Execution History** to see if requests are arriving
4. Look for any errors in the webhook trigger logs

### **Step 3: Verify Webhook URL**
- Confirm the webhook ID is correct: `6f985fb5-f10a-4ad3-99c0-d58d70f86408`
- Verify the webhook is **Active** in n8n (not disabled)
- Check that the webhook is set to accept **POST** requests

### **Step 4: Check n8n Webhook Configuration**
In n8n, click on the Webhook node and verify:
- **HTTP Method**: Should be `POST`
- **Authentication**: Should be set appropriately (Public, Apikey, etc.)
- **Response Data**: Check what the webhook returns
- **Test URL**: Should show a testable webhook URL

---

## Updated JavaScript Changes

### What Was Changed:
```javascript
// BEFORE (Silent failure)
fetch(url, {...}).catch(function(){});

// AFTER (With debugging & CORS handling)
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: payload,
  mode: "no-cors"  // <- NEW: Allows cross-origin requests
}).then(function(response){
  console.log("[v0] Webhook response received. Status:", response.status);
  // Proceed to payment
}).catch(function(error){
  console.error("[v0] Webhook fetch failed:", error.message);
  // Still proceed to payment
});
```

---

## Payload Being Sent

When a user registers, the following data is sent to n8n:

```json
{
  "Full Name": "User's Full Name",
  "Email1": "user@example.com",
  "Phone": "08120934828",
  "ReferralCode": "FEMI1234"
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No console logs | Browser console closed or logs cleared | Press F12, go to Console tab, try registering again |
| `[v0] Webhook fetch failed: Failed to fetch` | CORS blocking or network issue | Check if n8n webhook URL is correct and accessible |
| Webhook URL returns 404 | Webhook doesn't exist | Verify the webhook ID in n8n exists and is active |
| Webhook not showing in n8n execution history | Webhook is disabled | Enable the webhook in n8n settings |
| Data reaching n8n but wrong format | Payload structure mismatch | Check n8n expects "Full Name", "Email1", "Phone", "ReferralCode" |

---

## Next Steps

1. **Test the registration form** with the new debugging logs
2. **Monitor the browser console** for `[v0]` log messages
3. **Check n8n execution history** to confirm data arrival
4. **Verify field names** match what your n8n workflow expects
5. **Enable CORS** in n8n if needed (Webhook settings → CORS)

---

## Code Location

The registration function is located in `autolearn-spot-updated.html` starting at **line 436** in the `subReg()` function.

The webhook endpoint URL is: `https://n8n-wj6g.onrender.com/webhook/6f985fb5-f10a-4ad3-99c0-d58d70f86408`
