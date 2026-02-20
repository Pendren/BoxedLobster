const fs = require('fs');

const files = [
    '/usr/local/lib/node_modules/openclaw/dist/reply-B5GoyKpI.js',
    '/usr/local/lib/node_modules/openclaw/dist/runner-B7MhzgLA.js',
    '/usr/local/lib/node_modules/openclaw/dist/runner-ygCp61jE.js',
    '/usr/local/lib/node_modules/openclaw/dist/runner-DWOMWPyI.js'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const fileName = file.split('/').pop();
        const injection = `console.log("DEBUG_FILE_LOADED: ${fileName}");\n`;

        // Inject at the very beginning
        if (!content.includes(`DEBUG_FILE_LOADED: ${fileName}`)) {
            content = injection + content;
            fs.writeFileSync(file, content);
            console.log(`Patched ${fileName}`);
        } else {
            console.log(`Already patched ${fileName}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
