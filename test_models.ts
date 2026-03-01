import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAqYQ_81xhjaCglebJeAuD4cEoWg8rtRqo";

async function testModel(modelName, apiVersion) {
    console.log(`\nTesting ${modelName} on ${apiVersion ? apiVersion : 'default'}...`);
    try {
        const ai = new GoogleGenAI(apiVersion ? { apiKey, httpOptions: { apiVersion } } : { apiKey });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "Hello",
            config: {
                // Not using systemInstruction here just to test basic connectivity first
                temperature: 0.1
            }
        });
        console.log(`✅ SUCCESS with ${modelName}! Response:`, response.text);
        return true;
    } catch (e) {
        console.error(`❌ ERROR with ${modelName}:`, e.message);
        return false;
    }
}

async function runTests() {
    // Test base models without system options to see if they work at all
    const modelsToTest = [
        ["gemini-1.5-flash", undefined],
        ["gemini-1.5-flash", "v1"],
        ["gemini-1.5-flash-8b", undefined],
        ["gemini-2.0-flash", undefined],
        ["gemini-2.0-flash-lite-preview-02-05", undefined],
    ];

    for (const [model, apiVersion] of modelsToTest) {
        await testModel(model, apiVersion);
    }
}

runTests();
