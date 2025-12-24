import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, functions } from "./tools.js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("No API KEY"); process.exit(1); }

const genAI = new GoogleGenerativeAI(apiKey);

async function runAgent(prompt: string) {
  console.log(`🤖 Agent active. Prompt: "${prompt}"`);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro", 
    tools: tools,
  });

  const chat = model.startChat();

  try {
    let result = await chat.sendMessage(prompt);
    
    // Loop max 10 turns to avoid infinite loops
    for (let i = 0; i < 10; i++) {
        const response = result.response;
        const functionCalls = response.functionCalls();

        if (!functionCalls || functionCalls.length === 0) {
            console.log("🤖 Response:", response.text());
            return;
        }

        console.log("🛠️  Calls:", functionCalls.map(fc => fc.name));
        
        const responses = [];
        
        for (const call of functionCalls) {
            const fn = functions[call.name];
            if (fn) {
                try {
                    const output = await fn(call.args);
                    console.log(`   > ${call.name} success.`);
                    responses.push({
                        functionResponse: { name: call.name, response: { output: output } }
                    });
                } catch (e: any) {
                    console.error(`   > ${call.name} error:`, e.message);
                    responses.push({
                        functionResponse: { name: call.name, response: { error: e.message } }
                    });
                }
            } else {
                responses.push({
                    functionResponse: { name: call.name, response: { error: "Function not found" } }
                });
            }
        }
        
        result = await chat.sendMessage(responses);
    }
  } catch (e) {
    console.error("💥 Execution Error:", e);
  }
}

runAgent(process.argv[2] || "Hello");