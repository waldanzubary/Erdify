import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini API
export async function POST(req: Request) {
    try {
        const { sql } = await req.json();

        if (!sql) {
            return NextResponse.json({ error: 'SQL content is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is missing in environment variables');
            return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
        }

        console.log('Using Gemini API Key (starts with):', apiKey.substring(0, 8) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try these models in order (using discovered names from listModels)
        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-flash-latest',
            'gemini-pro-latest',
            'gemini-1.5-flash', // Keep as legacy fallback
            'gemini-pro'
        ];
        let text = '';
        let lastError = null;

        const prompt = `
        You are an expert system architect. 
        Analyze the following SQL schema and generate a logical flowchart that represents the business process or data flow implied by these tables.
        
        Focus on the *actions* and *processes* that would likely occur in a system with this database. 
        For example, if there are 'users' and 'orders', the flowchart should show "User" -> "Places Order" -> "System Validates Order" -> "Order Created".
        Do not just visualize the foreign keys (that is an ERD, which we already have). Visualize the *behavior*.

        Return the response ONLY as a valid JSON object with the following structure:
        {
            "nodes": [
                { "id": "string", "label": "string", "type": "start" | "process" | "decision" | "end" | "database" | "data" }
            ],
            "edges": [
                { "id": "string", "source": "string", "target": "string", "label": "string (optional)" }
            ]
        }

        Use these node types EXACTLY:
        - "start": Start of a process
        - "process": An action or processing step
        - "decision": A decision point (e.g. "Is Payment Valid?")
        - "database": Interaction with a table/storage
        - "data": Inputting information or Outputting results (e.g. "User provides SQL", "Display Error")
        - "end": End of a process

        SQL Content:
        ${sql}

        CRITICAL REQUIREMENT:
        - Every flowchart MUST have exactly one "Start" node (labeled 'Start' or 'Mulai') and at least one "End" node (labeled 'End' or 'Selesai').
        - Ensure all paths eventually lead to an "End" node.
        `;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting to generate with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                if (text) break;
            } catch (err: any) {
                console.warn(`Failed with model ${modelName}:`, err.message);
                lastError = err;
            }
        }

        if (!text) {
            throw new Error(`All models failed. Last error: ${lastError?.message}`);
        }

        console.log('Gemini Raw Response Received (first 200 chars):', text.substring(0, 200));

        // Use a more robust regex to find the FIRST JSON block
        let jsonString = '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
            // If it's wrapped in markdown code blocks, strip them
            jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        } else {
            jsonString = text.trim();
        }

        try {
            const data = JSON.parse(jsonString);
            console.log('Successfully parsed flowchart JSON. Nodes:', data?.nodes?.length);

            // Validate structure
            if (!data.nodes || !Array.isArray(data.nodes)) {
                throw new Error('Invalid JSON structure: missing nodes array');
            }

            return NextResponse.json(data);
        } catch (e: any) {
            console.error('Failed to parse Gemini response as JSON. Error:', e.message);
            console.error('Extracted JSON string:', jsonString);
            return NextResponse.json({
                error: 'Failed to generate valid flowchart JSON',
                details: e.message,
                raw: text
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Fatal Error in generate-flowchart route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
