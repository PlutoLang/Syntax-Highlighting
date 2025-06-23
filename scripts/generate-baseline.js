const fs = require('fs');
const path = require('path');
const vsctm = require('vscode-textmate');
const onig = require('vscode-oniguruma');

async function loadGrammar() {
    const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
    const wasm = fs.readFileSync(wasmPath).buffer;
    await onig.loadWASM(wasm);
    const onigLib = {
        createOnigScanner: (sources) => new onig.OnigScanner(sources),
        createOnigString: (str) => new onig.OnigString(str)
    };

    const registry = new vsctm.Registry({
        onigLib,
        loadGrammar: (scopeName) => {
            if (scopeName === 'source.pluto') {
                const tmLanguage = fs.readFileSync(path.join(__dirname, '..', 'Pluto.tmbundle', 'Syntaxes', 'Pluto.tmLanguage'), 'utf8');
                return vsctm.parseRawGrammar(tmLanguage);
            }
            return null;
        }
    });

    return registry.loadGrammar('source.pluto');
}

async function tokenizeFile(grammar, filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    const result = [];
    let ruleStack = null;
    for (const line of lines) {
        const res = grammar.tokenizeLine(line, ruleStack);
        result.push(res.tokens.map(t => ({
            startIndex: t.startIndex,
            endIndex: t.endIndex,
            scopes: t.scopes
        })));
        ruleStack = res.ruleStack;
    }
    return result;
}

async function main() {
    const grammar = await loadGrammar();
    const files = fs.readdirSync('.').filter(f => /^visual-.*\.pluto$/.test(f));
    for (const file of files) {
        const tokens = await tokenizeFile(grammar, file);
        const outPath = path.join('tests', 'baseline', file + '.json');
        fs.writeFileSync(outPath, JSON.stringify(tokens, null, 2));
        console.log(`Wrote ${outPath}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
