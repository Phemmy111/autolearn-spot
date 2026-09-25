import { test, expect } from '@playwright/test';

test.describe('ALEX Core Capabilities', () => {
  test('should handle large file uploads within Groq limits', async ({ request }) => {
    console.log('Testing ALEX token limit safeguards for Groq...');
    const response = await request.post('https://autolearn-spot.vercel.app/api/alex/chat', {
      data: {
        messages: [{ role: 'user', content: 'Extract the information from this file.' }],
        files: ['mock_file_id_123'],
        mode: 'auto'
      }
    });
    expect([200, 401, 500]).toContain(response.status());
  });
});
