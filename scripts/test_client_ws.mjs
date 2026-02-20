import { n as callGateway } from '/usr/local/lib/node_modules/openclaw/dist/call-BioUn9nN.js';
import { h as GATEWAY_CLIENT_NAMES, m as GATEWAY_CLIENT_MODES } from '/usr/local/lib/node_modules/openclaw/dist/message-channel-BdE6IUzJ.js';

async function main() {
    console.log("Testing client connection to ws://127.0.0.1:18789...");
    try {
        const result = await callGateway({
            url: 'ws://127.0.0.1:18789',
            password: 'password123',
            method: 'chat.send',
            params: {
                message: "Hello from test script",
                sessionKey: "cli-" + Date.now(),
                idempotencyKey: "id-" + Date.now()
            },
            expectFinal: true,
            timeoutMs: 10000,
            clientName: "cli",
            mode: "cli"
        });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
        if (e.data) console.error("Error Data:", JSON.stringify(e.data, null, 2));
    }
}
main();
