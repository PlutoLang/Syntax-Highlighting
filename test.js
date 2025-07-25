const fs = require("fs");
const path = require("path");
const vsctm = require("vscode-textmate");
const onig = require("vscode-oniguruma");

async function loadGrammar()
{
    const wasmPath = require.resolve("vscode-oniguruma/release/onig.wasm");
    const wasm = fs.readFileSync(wasmPath).buffer;
    await onig.loadWASM(wasm);
    const onigLib = {
        createOnigScanner: (sources) => new onig.OnigScanner(sources),
        createOnigString: (str) => new onig.OnigString(str)
    };

    const registry = new vsctm.Registry({
        onigLib,
        loadGrammar: function (scopeName)
        {
            if (scopeName == "source.pluto")
            {
                const tmLanguage = fs.readFileSync(path.join(__dirname, "Pluto.tmbundle", "Syntaxes", "Pluto.tmLanguage"), "utf8");
                return vsctm.parseRawGrammar(tmLanguage);
            }
            return null;
        }
    });

    return registry.loadGrammar("source.pluto");
}

async function main()
{
    const grammar = await loadGrammar();

    const createClassificationString = function (code)
    {
        const { tokens } = grammar.tokenizeLine(code);
        const res = [];
        for (const token of tokens)
        {
            if (token.scopes.length > 1)
            {
                res.push(" ".repeat(token.startIndex));
                res.push("-".repeat(token.endIndex - token.startIndex));
                res.push(" ".repeat(1 + code.length - token.endIndex));
                res.push(token.scopes[token.scopes.length - 1]);
                res.push("\n");
            }
        }
        return res.join("");
    };

    let ok = true;
    const checkClassification = function (code, ...expected)
    {
        expected = expected.join("\n") + "\n";

        const actual = createClassificationString(code);
        if (actual != expected)
        {
            console.log(`Mismatch for ${code}`);
            ok = false;
        }
    };

    checkClassification(
        `local enums = {}`,
        `-----            storage.modifier.pluto`,
        `            -    keyword.operator.assignment.pluto`,
        `              -  punctuation.section.table.begin.pluto`,
        `               - punctuation.section.table.end.pluto`
    );
    checkClassification(
        `local a = || -> 1`,
        `-----             storage.modifier.pluto`,
        `      -           entity.name.function.arrow.pluto`,
        `        -         keyword.operator.assignment.pluto`,
        `          -       punctuation.section.group.begin.pluto`,
        `           -      punctuation.section.group.end.pluto`,
        `             --   storage.type.function.arrow.pluto`,
        `                - constant.numeric.integer.pluto`
    );

    if (!ok)
    {
        process.exit(1);
    }
}

main();
