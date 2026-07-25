/**
 * Real AI Engine for Vent
 * Calls the secure Netlify Function to process the entry using Google Gemini 1.5 Flash.
 */

export const processEntry = async (text, contextData) => {
  try {
    const response = await fetch('/.netlify/functions/processEntry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, contextData })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("AI processing error:", errorData);
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const payload = await response.json();
    return payload;
  } catch (error) {
    console.error("Failed to process entry via AI:", error);
    // Return a safe empty payload to prevent the app from crashing
    return {
      hobbies: { achievements: [], milestones: [], insights: "", advice: "" },
      lifestyle: { milestones: [], goodHabits: [], badHabits: [], insights: "" },
      todos: [],
      missingInfoPrompt: "Uh oh, I couldn't reach the AI brain! Please check if your GEMINI_API_KEY is added to Netlify.",
      missingInfoType: "error",
      triggerSnippet: ""
    };
  }
};
