import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("API Key not found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Accessing the listModels method via the API if available, 
        // but typically in this SDK we might just try a known model or consult docs.
        // Actually, the SDK doesn't expose listModels directly on the main class in some versions.
        // Let's try to get a model and see if it works, or use a known fallback.
        // Since I can't easily list models without a specific manager method which varies,
        // I will try to use "gemini-pro" which is the most standard one.
        console.log("Testing 'gemini-pro'...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with 'gemini-pro':", result.response.text());

        console.log("Testing 'gemini-1.5-flash' (no latest)...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resultFlash = await modelFlash.generateContent("Hello");
        console.log("Success with 'gemini-1.5-flash':", resultFlash.response.text());

    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
