// lx.js - The Upgraded Neote Transpiler Engine
document.addEventListener("DOMContentLoaded", () => {
    fetch("file.nte")
        .then(response => {
            if (!response.ok) throw new Error("Could not find file.nte");
            return response.text();
        })
        .then(neoteCode => {
            transpileNeote(neoteCode);
        })
        .catch(err => console.error("Neote Transpiler Error:", err));
});

function transpileNeote(code) {
    // 1. Extract neoteweb.web layout block
    const webRegex = /st\s+neoteweb\.web\s*=\s*\(\s*("|')([\s\S]*?)\1\s*\)/;
    const webMatch = code.match(webRegex);

    if (webMatch && webMatch[2]) {
        let htmlLayout = webMatch[2].trim();
        document.documentElement.innerHTML = htmlLayout;
    }

    // 2. Extract neoteweb.script block
    const scriptRegex = /st\s+neoteweb\.script\s*=\s*\(\s*("|')([\s\S]*?)\1\s*\)/;
    const scriptMatch = code.match(scriptRegex);

    if (scriptMatch && scriptMatch[2]) {
        let neoteScript = scriptMatch[2].trim();

        // 3. Transpilation Core

        // Step 3.1: Imports
        neoteScript = neoteScript.replace(/\$imp\s+"@(.*?)"\s*-f\s*"(.*?)"/g, 'import {$1} from "$2"');

        // Step 3.2: "new" keyword shortcut (-n)
        neoteScript = neoteScript.replace(/-n(\s+[A-Z])/g, 'new$1');

        // Step 3.3: "window" shortcut (-w)
        neoteScript = neoteScript.replace(/-w(?=[.;)\n])/g, 'window');

        // Step 3.4: Timer shortcuts (-t)
        neoteScript = neoteScript.replace(/-t\.(after|loop)\(([^,]+),\s*([^)]+)\)/g, (match, type, time, func) => {
            if (type === 'after') return `setTimeout(${func}, ${time})`;
            if (type === 'loop') return `setInterval(${func}, ${time})`;
            return match;
        });

        // Step 3.5: Fetch shortcut (-f)
        neoteScript = neoteScript.replace(/-f\(/g, 'fetch(');

        // Step 3.6: Math shortcut (-m)
        neoteScript = neoteScript.replace(/-m\./g, 'Math.');

        // Step 3.7: LocalStorage shortcuts (-s)
        neoteScript = neoteScript.replace(/-s\.(set|get|rm|clear)\((.*?)\)/g, (match, method, args) => {
            if (method === 'set') return `localStorage.setItem(${args})`;
            if (method === 'get') return `localStorage.getItem(${args})`;
            if (method === 'rm') return `localStorage.removeItem(${args})`;
            if (method === 'clear') return `localStorage.clear()`;
            return match;
        });

        // Step 3.8: Custom Function Keyword (func -> function)
        neoteScript = neoteScript.replace(/\bfunc\s/g, 'function ');

        // Step 3.9: Document Method Shorthands
        neoteScript = neoteScript.replace(/doc\.gebd\(/g, 'document.getElementById(');
        neoteScript = neoteScript.replace(/doc\.qs\(/g, 'document.querySelector(');
        neoteScript = neoteScript.replace(/doc\.qsa\(/g, 'document.querySelectorAll(');
        neoteScript = neoteScript.replace(/doc\.ce\(/g, 'document.createElement(');

        // Step 3.10: General Doc Shortcut
        neoteScript = neoteScript.replace(/\bdoc\b/g, 'document');

        // Step 3.11: Event Listener Shortcut
        neoteScript = neoteScript.replace(/\.addEv\(/g, '.addEventListener(');

        // Step 3.12: Conditionals
        neoteScript = neoteScript.replace(/if\s*\(\s*([\w.]+)\s*\$(t|n)\s*([\w"'.]+)\s*\)/g, (match, p1, operator, p2) => {
            const jsOperator = operator === 't' ? '===' : '==';
            return `if (${p1} ${jsOperator} ${p2})`;
        });

        // Step 3.13: Core Functions
        neoteScript = neoteScript.replace(/ovr\.msg\((.*?)\)/g, 'alert($1)');
        neoteScript = neoteScript.replace(/ovr\.que\((.*?)\)/g, 'prompt($1)');
        neoteScript = neoteScript.replace(/showcase\((.*?)\)/g, 'console.log($1)');

        // Step 3.14: Variable declarations
        neoteScript = neoteScript.replace(/st\s+(\w+)\s*=/g, 'const $1 =');
        neoteScript = neoteScript.replace(/mut\s+(\w+)\s*=/g, 'let $1 =');

        // 4. Inject and execute
        const newScriptNode = document.createElement("script");
        newScriptNode.type = "module";
        newScriptNode.text = neoteScript;
        document.body.appendChild(newScriptNode);
    }
}
