import 'dotenv/config';
import { proposeNextAction } from '../agent/gemini-client.js';

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-key-here') {
  console.error('Missing GEMINI_API_KEY. Copy .env.example to .env, add your key, then rerun this command.');
  process.exitCode = 1;
} else {
  try {
    const action = await proposeNextAction({
      goal: 'Open the member lookup screen.',
      pageState: {
        url: 'http://localhost:3000/',
        accessibility: 'Signed-in console is not yet available. This is a configuration smoke test.',
      },
    });
    console.log(JSON.stringify({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash', action }, null, 2));
  } catch (error) {
    console.error(`Gemini verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}