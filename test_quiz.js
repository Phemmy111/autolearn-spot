const http = require('http');

const data = JSON.stringify({
  script: "What is AI?",
  lessonId: "test-lesson-id",
  questionCount: 10,
  providerId: "e38f5325-bd79-42d0-a891-336f469e05fd",
  model: "inclusionai/ling-3.0-flash-sante:free",
  promptId: "8345b35c-0a41-43e4-9e5c-5407876efc7c"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/author/generate-quiz',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, '\nBody:', responseData));
});

req.on('error', e => console.error(`Problem with request: ${e.message}`));
req.write(data);
req.end();
