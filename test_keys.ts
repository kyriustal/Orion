import { GoogleGenAI } from "@google/genai";

const apiKeyNew = "AIzaSyAqYQ_81xhjaCglebJeAuD4cEoWg8rtRqo"; // The one added recently
const apiKeyOld = "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM"; // The original one

async function testKey(keyName, apiKey) {
    console.log(`\nTesting ${keyName} with gemini-2.0-flash...`);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Hello",
            config: { temperature: 0.1 }
        });
        console.log(`✅ ${keyName} WORKS! Response:`, response.text);
    } catch (e) {
        console.error(`❌ ${keyName} ERROR:`, e.message);
    }
}

async function runTests() {
    await testKey("NEW KEY (AqYQ)", apiKeyNew);
    await testKey("OLD KEY (AwIN)", apiKeyOld);
}

runTests();
