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
            console.log(code + " MISMATCH");
            console.log(actual);
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

    checkClassification(
        `local p: { x: number; y: number }`,
        `-----                             storage.modifier.pluto`,
        `     --                           meta.typehint.table.pluto`,
        `       -                          punctuation.separator.colon.pluto`,
        `        -                         meta.typehint.table.pluto`,
        `         -                        punctuation.section.table.begin.pluto`,
        `          -                       meta.typehint.table.pluto`,
        `           -                      variable.other.field.pluto`,
        `            -                     punctuation.separator.colon.pluto`,
        `             -                    meta.typehint.pluto`,
        `              ------              storage.type.primitive.pluto`,
        `                    -             punctuation.terminator.semicolon.pluto`,
        `                     -            meta.typehint.table.pluto`,
        `                      -           variable.other.field.pluto`,
        `                       -          punctuation.separator.colon.pluto`,
        `                        -         meta.typehint.pluto`,
        `                         ------   storage.type.primitive.pluto`,
        `                               -  meta.typehint.table.pluto`,
        `                                - punctuation.section.table.end.pluto`
    );

    checkClassification(
        `local p: { x: number, y: number }`,
        `-----                             storage.modifier.pluto`,
        `     --                           meta.typehint.table.pluto`,
        `       -                          punctuation.separator.colon.pluto`,
        `        -                         meta.typehint.table.pluto`,
        `         -                        punctuation.section.table.begin.pluto`,
        `          -                       meta.typehint.table.pluto`,
        `           -                      variable.other.field.pluto`,
        `            -                     punctuation.separator.colon.pluto`,
        `             -                    meta.typehint.pluto`,
        `              ------              storage.type.primitive.pluto`,
        `                    -             punctuation.separator.comma.pluto`,
        `                     -            meta.typehint.table.pluto`,
        `                      -           variable.other.field.pluto`,
        `                       -          punctuation.separator.colon.pluto`,
        `                        -         meta.typehint.pluto`,
        `                         ------   storage.type.primitive.pluto`,
        `                               -  meta.typehint.table.pluto`,
        `                                - punctuation.section.table.end.pluto`
    );

    checkClassification(
        `local function f(cb: { a: string })`,
        `-----                               storage.modifier.pluto`,
        `      --------                      storage.type.function.pluto`,
        `              -                     meta.function.pluto`,
        `               -                    entity.name.function.pluto`,
        `                -                   punctuation.section.group.begin.pluto`,
        `                 --                 variable.parameter.function.pluto`,
        `                   -                punctuation.separator.colon.pluto`,
        `                    -               meta.typehint.table.pluto`,
        `                     -              punctuation.section.table.begin.pluto`,
        `                      -             meta.typehint.table.pluto`,
        `                       -            variable.other.field.pluto`,
        `                        -           punctuation.separator.colon.pluto`,
        `                         -          meta.typehint.pluto`,
        `                          ------    storage.type.primitive.pluto`,
        `                                -   meta.typehint.table.pluto`,
        `                                 -  punctuation.section.table.end.pluto`,
        `                                  - punctuation.section.group.end.pluto`
    );

    checkClassification(
        `local f: function(a: string): int = tonumber`,
        `-----                                        storage.modifier.pluto`,
        `       -                                     punctuation.separator.colon.pluto`,
        `        -                                    meta.typehint.function.pluto`,
        `         --------                            storage.type.function.pluto`,
        `                 -                           punctuation.section.group.begin.pluto`,
        `                  -                          variable.parameter.function.pluto`,
        `                   -                         punctuation.separator.colon.pluto`,
        `                    -                        meta.typehint.pluto`,
        `                     ------                  storage.type.primitive.pluto`,
        `                           -                 punctuation.section.group.end.pluto`,
        `                            -                punctuation.separator.colon.pluto`,
        `                             -               meta.typehint.pluto`,
        `                              ---            storage.type.primitive.pluto`,
        `                                  -          keyword.operator.assignment.pluto`
    );

    checkClassification(
        `local function f(cb: function(a: string): int)`,
        `-----                                          storage.modifier.pluto`,
        `      --------                                 storage.type.function.pluto`,
        `              -                                meta.function.pluto`,
        `               -                               entity.name.function.pluto`,
        `                -                              punctuation.section.group.begin.pluto`,
        `                 --                            variable.parameter.function.pluto`,
        `                   -                           punctuation.separator.colon.pluto`,
        `                    -                          meta.typehint.function.pluto`,
        `                     --------                  storage.type.function.pluto`,
        `                             -                 punctuation.section.group.begin.pluto`,
        `                              -                variable.parameter.function.pluto`,
        `                               -               punctuation.separator.colon.pluto`,
        `                                -              meta.typehint.pluto`,
        `                                 ------        storage.type.primitive.pluto`,
        `                                       -       punctuation.section.group.end.pluto`,
        `                                        -      punctuation.separator.colon.pluto`,
        `                                         -     meta.typehint.pluto`,
        `                                          ---  storage.type.primitive.pluto`,
        `                                             - punctuation.section.group.end.pluto`
    );

    checkClassification(
        `local function f(): (bool, int)`,
        `-----                           storage.modifier.pluto`,
        `      --------                  storage.type.function.pluto`,
        `              -                 meta.function.pluto`,
        `               -                entity.name.function.pluto`,
        `                -               punctuation.section.group.begin.pluto`,
        `                 -              punctuation.section.group.end.pluto`,
        `                  -             punctuation.separator.colon.pluto`,
        `                   -            meta.function.pluto`,
        `                    ----------- storage.type.primitive.pluto`
    );

    checkClassification(
        `$type StringOrNumber = string|number`,
        `-----                                storage.type.named.pluto`,
        `     -                               meta.type.named.pluto`,
        `      --------------                 entity.name.type.pluto`,
        `                    -                meta.type.named.pluto`,
        `                     -               keyword.operator.assignment.pluto`,
        `                      -              meta.type.named.pluto`,
        `                       ------------- storage.type.primitive.pluto`
    );
    checkClassification(
        `$type Point = { x: number, y: number }`,
        `-----                                  storage.type.named.pluto`,
        `     -                                 meta.type.named.pluto`,
        `      -----                            entity.name.type.pluto`,
        `           -                           meta.type.named.pluto`,
        `            -                          keyword.operator.assignment.pluto`,
        `             -                         meta.type.named.pluto`,
        `              -                        punctuation.section.table.begin.pluto`,
        `               -                       meta.typehint.table.pluto`,
        `                -                      variable.other.field.pluto`,
        `                 -                     punctuation.separator.colon.pluto`,
        `                  -                    meta.typehint.pluto`,
        `                   ------              storage.type.primitive.pluto`,
        `                         -             punctuation.separator.comma.pluto`,
        `                          -            meta.typehint.table.pluto`,
        `                           -           variable.other.field.pluto`,
        `                            -          punctuation.separator.colon.pluto`,
        `                             -         meta.typehint.pluto`,
        `                              ------   storage.type.primitive.pluto`,
        `                                    -  meta.typehint.table.pluto`,
        `                                     - punctuation.section.table.end.pluto`
    );
    checkClassification(
        `$type Point = { x: number; y: number }`,
        `-----                                  storage.type.named.pluto`,
        `     -                                 meta.type.named.pluto`,
        `      -----                            entity.name.type.pluto`,
        `           -                           meta.type.named.pluto`,
        `            -                          keyword.operator.assignment.pluto`,
        `             -                         meta.type.named.pluto`,
        `              -                        punctuation.section.table.begin.pluto`,
        `               -                       meta.typehint.table.pluto`,
        `                -                      variable.other.field.pluto`,
        `                 -                     punctuation.separator.colon.pluto`,
        `                  -                    meta.typehint.pluto`,
        `                   ------              storage.type.primitive.pluto`,
        `                         -             punctuation.terminator.semicolon.pluto`,
        `                          -            meta.typehint.table.pluto`,
        `                           -           variable.other.field.pluto`,
        `                            -          punctuation.separator.colon.pluto`,
        `                             -         meta.typehint.pluto`,
        `                              ------   storage.type.primitive.pluto`,
        `                                    -  meta.typehint.table.pluto`,
        `                                     - punctuation.section.table.end.pluto`
    );
    checkClassification(
        `$type Callback = function(a: string): int`,
        `-----                                     storage.type.named.pluto`,
        `     -                                    meta.type.named.pluto`,
        `      --------                            entity.name.type.pluto`,
        `              -                           meta.type.named.pluto`,
        `               -                          keyword.operator.assignment.pluto`,
        `                -                         meta.type.named.pluto`,
        `                 --------                 storage.type.function.pluto`,
        `                         -                punctuation.section.group.begin.pluto`,
        `                          -               variable.parameter.function.pluto`,
        `                           -              punctuation.separator.colon.pluto`,
        `                            -             meta.typehint.pluto`,
        `                             ------       storage.type.primitive.pluto`,
        `                                   -      punctuation.section.group.end.pluto`,
        `                                    -     punctuation.separator.colon.pluto`,
        `                                     -    meta.typehint.pluto`,
        `                                      --- storage.type.primitive.pluto`
    );
    checkClassification(
        `local f: Callback`,
        `-----             storage.modifier.pluto`,
        `       -          punctuation.separator.colon.pluto`,
        `         -------- storage.type.primitive.pluto`
    );
    checkClassification(
        `$declare _PVERSION: string`,
        `--------                   storage.modifier.pluto`,
        `                  -        punctuation.separator.colon.pluto`,
        `                    ------ storage.type.primitive.pluto`
    );
    checkClassification(
        `$declare function tonumber(str: string, base: ?number): number`,
        `--------                                                       storage.modifier.pluto`,
        `        -                                                      meta.function.pluto`,
        `         --------                                              storage.type.function.pluto`,
        `                 -                                             meta.function.pluto`,
        `                  --------                                     entity.name.function.pluto`,
        `                          -                                    punctuation.section.group.begin.pluto`,
        `                           ---                                 variable.parameter.function.pluto`,
        `                              -                                punctuation.separator.colon.pluto`,
        `                               -                               meta.typehint.pluto`,
        `                                ------                         storage.type.primitive.pluto`,
        `                                      -                        punctuation.separator.comma.pluto`,
        `                                       -                       meta.function.pluto`,
        `                                        ----                   variable.parameter.function.pluto`,
        `                                            -                  punctuation.separator.colon.pluto`,
        `                                             -                 meta.typehint.pluto`,
        `                                              -------          storage.type.primitive.pluto`,
        `                                                     -         punctuation.section.group.end.pluto`,
        `                                                      -        punctuation.separator.colon.pluto`,
        `                                                       -       meta.function.pluto`,
        `                                                        ------ storage.type.primitive.pluto`
    );

    checkClassification(
        `$if true then`,
        `-             keyword.operator.logical.pluto`,
        ` --           keyword.control.pluto`,
        `    ----      constant.language.pluto`,
        `         ---- keyword.control.pluto`
    );
    checkClassification(
        `$else`,
        `-     keyword.operator.logical.pluto`,
        ` ---- keyword.control.pluto`
    );
    checkClassification(
        `$end`,
        `-    keyword.operator.logical.pluto`,
        ` --- keyword.control.pluto`
    );

    const langConfig = JSON.parse(
        fs.readFileSync(path.join(__dirname, "language-config.json"), "utf8").replace(/\/\/.*$/gm, "")
    );
    const increaseIndentPattern = new RegExp(langConfig.indentationRules.increaseIndentPattern);
    const decreaseIndentPattern = new RegExp(langConfig.indentationRules.decreaseIndentPattern);
    const checkIndentation = function (code, inc, dec)
    {
        const incMatch = increaseIndentPattern.test(code);
        const decMatch = decreaseIndentPattern.test(code);
        if (incMatch != inc || decMatch != dec)
        {
            console.log(`Indentation mismatch for ${code}`);
            ok = false;
        }
    };

    checkIndentation("function foo()", true, false);
    checkIndentation("if cond then", true, false);
    checkIndentation("else", true, true);
    checkIndentation("try", true, false);
    checkIndentation("pluto_try", true, false);
    checkIndentation("catch e then", true, true);
    checkIndentation("catch e do", true, true);
    checkIndentation("pluto_catch e then", true, true);
    checkIndentation("pluto_catch e do", true, true);
    checkIndentation("end", false, true);
    checkIndentation("until finished", false, true);
    checkIndentation("values = {", true, false);
    checkIndentation("}", false, true);
    checkIndentation("$type Func = function(_: string): void", false, false);
    checkIndentation("$declare function tonumber(str: string, base: ?number): number", false, false);
    checkIndentation("local entry", false, false);

    if (!ok)
    {
        process.exit(1);
    }
}

main();
