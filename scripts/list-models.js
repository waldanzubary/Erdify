const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        fs.writeFileSync("scripts/models_output.txt", "GEMINI_API_KEY is missing in .env.local");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            fs.writeFileSync("scripts/models_output.txt", JSON.stringify(data.error, null, 2));
            return;
        }

        let output = "";
        if (data.models) {
            data.models.forEach(m => {
                output += `${m.name}\n`;
            });
        } else {
            output = "No models found. Response: " + JSON.stringify(data, null, 2);
        }
        fs.writeFileSync("scripts/models_output.txt", output);

    } catch (error) {
        fs.writeFileSync("scripts/models_output.txt", "Fetch Error: " + error.message);
    }
}

listModels();
