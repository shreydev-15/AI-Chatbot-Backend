const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(chatHistory) {
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        systemInstruction: "You are a chat assistant. Use the complete conversation history provided in contents as the source of truth. For questions about earlier messages, answer precisely from that history. Do not invent previous user messages or answers.",
        contents: chatHistory
    });
    return response.text;
}

module.exports = { generateResponse };