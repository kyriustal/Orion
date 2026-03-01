
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

async function test() {
    const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM"
    });

    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-2.0-flash-exp"];

    for (const modelName of models) {
        console.log(`--- Testing ${modelName} ---`);
        try {
            const chat = genAI.chats.create({
                model: modelName,
                config: { systemInstruction: "You are a helpful assistant." }
            });
            const result = await chat.sendMessage({ message: "Say 'OK'" });
            console.log(`SUCCESS [${modelName}]:`, result.text);
        } catch (e) {
            console.error(`FAILED [${modelName}]:`, e.message);
        }
    }
}

test();
