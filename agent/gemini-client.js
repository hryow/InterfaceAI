import { GoogleGenAI } from '@google/genai';

const ACTION_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['click', 'fill', 'select', 'wait', 'finish', 'escalate'],
    },
    target: {
      type: 'string',
      nullable: true,
      description: 'Accessible label, visible text, or stable target description. Null when action is wait, finish, or escalate.',
    },
    value: {
      type: 'string',
      nullable: true,
      description: 'Input value or select option. Null when the action does not need a value.',
    },
    reason: {
      type: 'string',
      description: 'Short explanation for the proposed action.',
    },
  },
  required: ['action', 'target', 'value', 'reason'],
};

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Copy .env.example to .env and add your key.');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function proposeNextAction({ goal, pageState }) {
  const client = getClient();
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    contents: JSON.stringify({ goal, pageState }),
    config: {
      systemInstruction: 'You are a cautious browser discovery planner. Propose exactly one next action toward the goal. Never request credentials, destructive financial actions, or actions outside the supplied page state. Use escalate when the state is ambiguous or safety is uncertain.',
      responseMimeType: 'application/json',
      responseSchema: ACTION_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned no structured action.');
  }

  return JSON.parse(response.text);
}

export { ACTION_SCHEMA };