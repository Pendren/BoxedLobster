const { GoogleGenAI } = require("/usr/local/lib/node_modules/openclaw/node_modules/@google/genai");

async function test() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ GOOGLE_API_KEY is not set!");
        process.exit(1);
    }
    console.log(`🔑 Key found (length: ${apiKey.length})`);

    const client = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    console.log(`📡 Testing connection to ${modelId}...`);

    try {
        const streamResult = await client.models.generateContentStream({
            model: modelId,
            contents: [{ role: "user", parts: [{ text: "Hello, are you there?" }] }],
        });

        console.log("✅ Stream result keys:", Object.keys(streamResult));
        console.log("Type of streamResult:", typeof streamResult);
        if (streamResult.stream) {
            for await (const chunk of streamResult.stream) {
                console.log("--- CHUNK ---");
                console.log(JSON.stringify(chunk, null, 2));
            }
        } else {
            // Maybe it returns the stream directly?
            console.log("stream property missing. Is result itself iterable?");
            try {
                for await (const chunk of streamResult) {
                    console.log("--- CHUNK (direct iteration) ---");
                    console.log(JSON.stringify(chunk, null, 2));
                }
            } catch (e) {
                console.log("Direct iteration failed:", e.message);
            }
        }
    } catch (error) {
        console.error("❌ Error:");
        console.error(error);
    }
}

test();
