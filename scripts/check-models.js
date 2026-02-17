const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // The SDK doesn't have a direct listModels, but we can try common ones or use the raw fetch
        console.log("Checking API access...");

        // Attempting to use a very basic model to see if it responds
        const models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                // Just a test prompt
                await model.generateContent("test");
                console.log(`✅ Model ${m} is available and working.`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
