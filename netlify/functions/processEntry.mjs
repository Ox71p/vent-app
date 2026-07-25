import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler = async (event, context) => {
  // Allow CORS for local testing if needed
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }
  
  try {
    const { text, contextData } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable. Please add it to your Netlify dashboard." }) 
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are an AI processing journal entries for an app called Vent.
Your goal is to extract structured data out of the user's journal entry.
Return ONLY valid JSON matching this exact structure:
{
  "hobbies": {
    "achievements": ["e.g. Won a hackathon"],
    "milestones": ["e.g. Created my first app"],
    "insights": "Any overall insights about their hobbies",
    "advice": "Any advice or reflections"
  },
  "lifestyle": {
    "milestones": ["e.g. Prioritized physical fitness"],
    "goodHabits": ["e.g. Drank water"],
    "badHabits": ["e.g. Stayed up late"],
    "insights": "Any lifestyle insights"
  },
  "todos": [
    {
      "task": "A concise description of the task (Start with a capital letter)",
      "completed": true or false,
      "metadata": {
        "time": "Time of day if mentioned",
        "date": "Date if mentioned",
        "duration": "Duration if mentioned"
      }
    }
  ],
  "missingInfoPrompt": null,
  "missingInfoType": null,
  "triggerSnippet": null
}

Instructions:
1. Extract completed past tasks (completed: true) and pending future tasks (completed: false).
2. If the user mentions hobbies or lifestyle habits, categorize them appropriately.
3. If the user says they "had an amazing time" or similar feelings without context, DO NOT make it a task. Tasks must be actionable items or clear events.
4. If the entry is extremely brief or vague (e.g. "I met my friend" with no other context about when/where/how long), you MAY optionally set 'missingInfoPrompt' to a polite follow-up question asking for more details, 'missingInfoType' to 'time', 'duration', or 'text', and 'triggerSnippet' to the part of the text that caused the prompt. If the text provides sufficient context (e.g., includes time like "3 days ago"), do NOT prompt for that missing info.
5. Format task names cleanly. Stop at conjunctions if they start a new clause (e.g. "met my friend and I had a good time" -> "Met my friend").

User Context Data (Hobbies/Interests to watch out for):
${JSON.stringify(contextData || {})}

User's Journal Entry:
"${text}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: responseText
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
