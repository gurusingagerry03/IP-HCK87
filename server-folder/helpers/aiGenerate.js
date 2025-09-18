const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});

async function generateAi(promptText, model) {
  const response = await ai.models.generateContent({
    model: model,
    contents: ` ${promptText}`,
  });

  return response?.text || '';
}

module.exports = { generateAi };
