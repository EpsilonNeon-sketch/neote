// lx.js - The Upgraded Neote Transpiler Engine
document.addEventListener("DOMContentLoaded", () => {
    fetch("file.nte")
        .then(response => {
            if (!response.ok) throw new Error("Could not find file.nte");
            return response.text();
        })
        .then(neoteCode => {
            runNeote(neoteCode);
        })
        .catch(err => {
            document.body.innerHTML = `<h1 style="color:red">Critical Error: ${err.message}</h1>`;
        });
});

function runNeote(neoteCode) {
    // 1. Parse Attachments
    const attachRegex = /\$attach\s+@(\w+);/g;
    let match;
    let attachments = [];
    while ((match = attachRegex.exec(neoteCode)) !== null) {
        attachments.push(match[1]);
    }

    // 2. Validate Requirements
    const requiredCore = ['neote', 'neoteweb'];
    const missingCore = requiredCore.filter(req => !attachments.includes(req));

    if (missingCore.length > 0) {
        renderError(`Missing Core Attachments: ${missingCore.join(', ')}`);
        return;
    }

    if (neoteCode.includes('-f(') && !attachments.includes('njson')) {
        renderError(`Security Error: Using Fetch (-f) but missing $attach @njson;`);
        return;
    }

    // 3. Error Handling
    window.onerror = function (message, source, lineno, colno, error) {
        console.error(`[Neote Runtime Error] ${message} at Line ${lineno}`);
    };

    // 4. Extract Layout
    const webRegex = /st\s+neoteweb\.web\s*=\s*\(\s*("|')([\s\S]*?)\1\s*\)/;
    const webMatch = neoteCode.match(webRegex);

    if (webMatch && webMatch[2]) {
        let htmlLayout = webMatch[2].trim();
        document.documentElement.innerHTML = htmlLayout;
    }

    // 5. Extract Script
    const scriptRegex = /st\s+neoteweb\.script\s*=\s*\(\s*("|')([\s\S]*?)\1\s*\)/;
    const scriptMatch = neoteCode.match(scriptRegex);

    if (scriptMatch && scriptMatch[2]) {
        let neoteScript = scriptMatch[2].trim();

        // 6. Transpilation Core

        // Imports
        neoteScript = neoteScript.replace(/\$imp\s+"@(.*?)"\s*-f\s*"(.*?)"/g, 'import {$1} from "$2"');
        neoteScript = neoteScript.replace(/-n(\s+[A-Z])/g, 'new$1');
        neoteScript = neoteScript.replace(/-w(?=[.;)\n])/g, 'window');

        // Timers
        neoteScript = neoteScript.replace(/-t\.(after|loop)\(([^,]+),\s*([^)]+)\)/g, (match, type, time, func) => {
            if (type === 'after') return `setTimeout(${func}, ${time})`;
            if (type === 'loop') return `setInterval(${func}, ${time})`;
            return match;
        });

        // Fetch
        neoteScript = neoteScript.replace(/-f\(/g, 'fetch(');

        // Math
        neoteScript = neoteScript.replace(/-m\./g, 'Math.');

        // LocalStorage
        neoteScript = neoteScript.replace(/-s\.(set|get|rm|clear)\((.*?)\)/g, (match, method, args) => {
            if (method === 'set') return `localStorage.setItem(${args})`;
            if (method === 'get') return `localStorage.getItem(${args})`;
            if (method === 'rm') return `localStorage.removeItem(${args})`;
            if (method === 'clear') return `localStorage.clear()`;
            return match;
        });

        // --- ASYNC / AWAIT / FINALE ---

        // 1. Async Function Declaration
        // func -as myFunc() -> async function myFunc()
        neoteScript = neoteScript.replace(/func\s+-as\s+(\w+)/g, 'async function $1');

        // 2. Await Operator
        // -aw ... -> await ...
        neoteScript = neoteScript.replace(/-aw\s/g, 'await ');

        // 3. Finale Block
        // finale -> finally
        neoteScript = neoteScript.replace(/\bfinale\b/g, 'finally');

        // Standard Function (Must run AFTER async check)
        neoteScript = neoteScript.replace(/\bfunc\s/g, 'function ');

        // Document
        neoteScript = neoteScript.replace(/doc\.gebd\(/g, 'document.getElementById(');
        neoteScript = neoteScript.replace(/doc\.qs\(/g, 'document.querySelector(');
        neoteScript = neoteScript.replace(/doc\.qsa\(/g, 'document.querySelectorAll(');
        neoteScript = neoteScript.replace(/doc\.ce\(/g, 'document.createElement(');
        neoteScript = neoteScript.replace(/\bdoc\b/g, 'document');
        neoteScript = neoteScript.replace(/\.addEv\(/g, '.addEventListener(');

        // Conditionals
        neoteScript = neoteScript.replace(/if\s*\(\s*([\w.]+)\s*\$(t|n)\s*([\w"'.]+)\s*\)/g, (match, p1, operator, p2) => {
            const jsOperator = operator === 't' ? '===' : '==';
            return `if (${p1} ${jsOperator} ${p2})`;
        });

        // Core Functions
        neoteScript = neoteScript.replace(/ovr\.msg\((.*?)\)/g, 'alert($1)');
        neoteScript = neoteScript.replace(/ovr\.que\((.*?)\)/g, 'prompt($1)');
        neoteScript = neoteScript.replace(/showcase\((.*?)\)/g, 'console.log($1)');

        // Variables
        neoteScript = neoteScript.replace(/st\s+(\w+)\s*=/g, 'const $1 =');
        neoteScript = neoteScript.replace(/mut\s+(\w+)\s*=/g, 'let $1 =');

        // Inject
        const newScriptNode = document.createElement("script");
        newScriptNode.type = "module";
        newScriptNode.text = neoteScript;
        document.body.appendChild(newScriptNode);
    }
}

function renderError(message) {
    document.body.innerHTML = `
        <div style="background:#000; color:#ff3333; font-family:sans-serif; padding:20px; height:100vh;">
            <h1>Neote Engine Halted</h1>
            <p>${message}</p>
        </div>
    `;
}
