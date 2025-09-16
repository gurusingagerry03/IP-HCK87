require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  //   apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const prompt = `
    You are given accurate football match data. 
    Your task is ONLY to generate two narrative fields: "match_overview" and "tactical_analysis". 
    Do not invent statistics, referees, or numbers. Focus on natural sentences summarizing the match. 
    Always respond in a valid JSON object with exactly these two fields.

    match: Vilaeal vs Real Oviedo
    date: 2025-08-16

    Output format (JSON only, no extra text):
  {
    "match_overview": "Write 2–3 sentences describing the general overview of the match.",
    "tactical_analysis": "Write a detailed tactical analysis paragraph."
  }
`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: ` ${prompt}`,
  });

  console.log(response.text);
}

main();
