const http = require('http');
const fs = require('fs');
const path = require('path');
const { analyzeMeal, analyzeMealText } = require('./mealAnalysis');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const MAX_BODY_BYTES = 12_000_000;
const FOOD_MODEL = process.env.OPENAI_FOOD_MODEL || 'gpt-5.6-sol';

const instructions = `You are Eugene, a friendly running and general wellness coach inside the OneHealth app.
Answer the user's question directly and conversationally in no more than 150 words.
Return plain text only. Do not use Markdown markers such as **, #, or backticks.
Use logged running or meal context when it is relevant, but do not pretend data exists when none was provided.
Never prescribe calorie targets or restrictive diets. Do not diagnose medical conditions.
For possible emergencies or serious symptoms, tell the user to stop exercising and contact emergency services or a medical professional.
You may answer ordinary, basic questions outside running briefly, but gently connect back to health or training when useful.`;

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;
    request.on('data', (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        tooLarge = true;
        body = '';
        reject(new Error('Request is too large'));
      }
    });
    request.on('end', () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function cleanPlainText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

function foodAnalysisError(error) {
  if (error.code === 'invalid_image' || error.status === 400) {
    return { status: 422, reason: 'invalid_image', error: 'The photo format could not be read. Please retake it or choose a JPEG, PNG, or WebP image.' };
  }
  if (error.code === 'invalid_analysis') {
    return { status: 502, reason: 'incomplete_result', error: 'The nutrition result was incomplete. Please try the photo once more.' };
  }
  if (error.status === 429) {
    return { status: 503, reason: 'service_busy', error: 'The nutrition service is busy right now. Wait a moment, then try again.' };
  }
  if (error.status === 401 || error.status === 403) {
    return { status: 503, reason: 'service_configuration', error: 'Meal analysis is temporarily unavailable because the service needs attention.' };
  }
  return { status: 502, reason: 'temporary_failure', error: 'The meal could not be analyzed because the connection or nutrition service did not finish. Try again with a clear, well-lit photo.' };
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  if (request.method !== 'POST' || !['/api/chat', '/api/analyze-meal', '/api/analyze-food-text'].includes(request.url)) {
    return sendJson(response, 404, { error: 'Not found' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 503, { error: 'The coach service is not configured' });
  }

  try {
    const body = await readJson(request);
    if (request.url === '/api/analyze-meal') {
      const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.mimeType)
        ? body.mimeType
        : 'image/jpeg';
      if (typeof body.image !== 'string' || body.image.length < 100 || !/^[A-Za-z0-9+/=\r\n]+$/.test(body.image)) {
        return sendJson(response, 400, { reason: 'unreadable_photo', error: 'The selected photo could not be read. Please retake it or choose it again.' });
      }
      const meal = await analyzeMeal({
        apiKey: process.env.OPENAI_API_KEY,
        model: FOOD_MODEL,
        image: body.image.replace(/[\r\n]/g, ''),
        mimeType,
      });
      return sendJson(response, 200, meal);
    }

    if (request.url === '/api/analyze-food-text') {
      const description = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : '';
      if (description.length < 2) return sendJson(response, 400, { error: 'A food description is required' });
      const meal = await analyzeMealText({
        apiKey: process.env.OPENAI_API_KEY,
        model: FOOD_MODEL,
        description,
      });
      return sendJson(response, 200, meal);
    }

    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const input = history
      .filter((item) => ['user', 'coach'].includes(item.sender) && typeof item.text === 'string')
      .map((item) => ({ role: item.sender === 'user' ? 'user' : 'assistant', content: item.text.slice(0, 4000) }));

    if (!input.some((item) => item.role === 'user')) {
      return sendJson(response, 400, { error: 'A user message is required' });
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: `${instructions}\n\nApp context:\n${String(body.context || 'No logged data provided.').slice(0, 6000)}`,
        input,
        reasoning: { effort: 'low' },
        max_output_tokens: 700,
      }),
    });

    const payload = await openAIResponse.json();
    if (!openAIResponse.ok) {
      console.error('OpenAI request failed:', openAIResponse.status, payload?.error?.code || 'unknown_error');
      return sendJson(response, 502, { error: 'The AI service could not answer right now' });
    }

    const text = cleanPlainText(extractOutputText(payload));
    if (!text) return sendJson(response, 502, { error: 'The AI service returned an empty answer' });
    return sendJson(response, 200, { text });
  } catch (error) {
    console.error('Coach server error:', error.message);
    if (error.message === 'Invalid JSON' || error.message === 'Request is too large') {
      return sendJson(response, error.message === 'Request is too large' ? 413 : 400, { error: error.message });
    }
    if (['/api/analyze-meal', '/api/analyze-food-text'].includes(request.url)) {
      const responseError = foodAnalysisError(error);
      return sendJson(response, responseError.status, responseError);
    }
    return sendJson(response, 400, { error: 'Unable to process request' });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT.`);
  } else {
    console.error('Coach API failed to start:', error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Coach API listening on http://localhost:${PORT}`);
});
