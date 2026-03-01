import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAqYQ_81xhjaCglebJeAuD4cEoWg8rtRqo";
const ai = new GoogleGenAI({ apiKey }); // defaults to v1beta

async function testGemini() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Hello",
            config: {
                systemInstruction: "You are a helpful assistant.",
                temperature: 0.1
            }
        });
        console.log("SUCCESS! Response:", response.text);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

testGemini();
