
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

async function test() {
    const envKey = process.env.GEMINI_API_KEY;
    console.log("Key from ENV starts with:", envKey ? envKey.substring(0, 10) : "null");

    const genAI = new GoogleGenAI({
        apiKey: envKey
    });

    // Testando o modelo que deu 404 para o usuário
    const modelName = "gemini-1.5-flash";
    console.log(`--- Testing ${modelName} ---`);
    try {
        const chat = genAI.chats.create({
            model: modelName,
            config: { systemInstruction: "You are a helpful assistant." }
        });
        const result = await chat.sendMessage({ message: "Hello" });
        console.log(`SUCCESS [${modelName}]:`, result.text);
    } catch (e) {
        console.error(`FAILED [${modelName}]:`, e.message);
        try {
            console.log("Details:", JSON.stringify(JSON.parse(e.message), null, 2));
        } catch (err) { }
    }
}

test();
