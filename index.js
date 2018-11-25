/**
 * index.js
 * Generates flat 'eslintrc.json' file (with no references to lint rules in node_modules)
 * Please see README.md for further information
 * By Bo Ericsson, bo@boe.net
*/

/* eslint-disable no-console, no-await-in-loop */
/* eslint-env node */

// Dependencies
const fs = require('fs');
const decomment = require('decomment');

// Flags
const DEBUG = false;
const SHOW_DUPLICATES = true;

// Log errors in red
const logError = (msg) => {
    console.log('\x1b[31m%s\x1b[0m', msg);
};

// Determines whether a file is a JS module
const isModule = content => /module\.exports/gm.test(content);

// Cleans an .eslintrc file (JSON-like structure)
const cleanJSON = (content) => {
    // Remove any dangling commas
    const regex = /,(?=\s*?[}\]])/g;
    const cleaned = content.replace(regex, '');

    // Remove comments (after which the structure is legal JSON) and return the structure
    return decomment(cleaned);
};

// Get base path
const basePath = process.cwd();

// Possible root eslintrc file names and search order
const eslintNames = [
    '.eslintrc',
    '.eslintrc.json',
];

// Attempt to find the root .eslintrc file
const eslintName = eslintNames.find(name => fs.existsSync(name));
if (eslintName === undefined) {
    logError(`Could not find ${eslintNames.join(' nor ')}, exiting...`);
    process.exit(0);
}
console.log(`Found .eslintrc file: ${eslintName}`);
const eslintRootRaw = fs.readFileSync(eslintName, 'utf8');
const eslintRoot = JSON.parse(cleanJSON(eslintRootRaw));
const outputName = eslintName.slice(1); // Remove '.' (don't overwrite input .eslintrc file)

// Find top level plugins
const rootPlugins = eslintRoot.plugins || [];
const plugInMsg = rootPlugins.length > 0
    ? `Found top level plugins: ${rootPlugins}`
    : 'Found no top level plugins';
console.log(plugInMsg);

// Recursive function to extract eslint rules
async function getRules(initialPath) {
    const rulesArray = [];

    async function recurse(lintFile) {
        console.log(`Recursing into ${lintFile}`);

        // Get the individual parts of the file path
        const pathParts = lintFile.split('/');
        // Get the length of the path parts
        const pathLength = pathParts.length;
        // Current directory is the second to last path part
        const directory = pathParts[pathLength - 2];

        // Get the content of the file
        const content = fs.readFileSync(lintFile, 'utf8');

        try {
            // Determine if this file is a JS module or not
            if (isModule(content)) {
                // Import the module
                const exported = await import(lintFile);

                // Get the default export
                const eslint = exported.default;

                // Inspect the plugins
                const plugins = eslint.plugins || [];
                const include = rootPlugins.some(r => plugins.includes(r)) || plugins.length === 0;

                // Save any rules found in this module
                if (eslint.rules !== undefined && include) {
                    rulesArray.push({ file: lintFile, rules: eslint.rules });
                }

                // Follow any 'extends' directive
                if (eslint.extends) {
                    // Ensure array of extended reference(s)
                    const extendsArray = Array.isArray(eslint.extends) ? eslint.extends : [eslint.extends];

                    // Loop through the 'extends' reference(s)
                    for (const path of extendsArray) {
                        // Recurse
                        await recurse(path);
                    }
                }
            } else {
                // Clean and parse the JSON-like structure
                const eslint = JSON.parse(cleanJSON(content));

                // Save any rules found in the JSON structure
                if (eslint.rules !== undefined) {
                    // rulesArray.push(eslint.rules);
                    rulesArray.push({ file: lintFile, rules: eslint.rules });
                }

                // TODO: implement plugin processing for 'plain' (non-module) files

                // Follow any 'extends' directive
                if (eslint.extends) {
                    // Ensure array of extended reference(s)
                    const extendsArray = Array.isArray(eslint.extends) ? eslint.extends : [eslint.extends];

                    // Loop through the 'extends' reference(s)
                    for (const extended of extendsArray) {
                        let path;
                        if (/^\./.test(extended)) {
                            path = `${basePath}/node_modules/${directory}/${extended.slice(2)}`;
                        } else {
                            path = `${basePath}/node_modules/eslint-config-${extended}/.eslintrc`;
                        }
                        // Recurse
                        await recurse(path);
                    }
                }
            }
        } catch (e) {
            logError(e);
            process.exit(0);
        }

        // Return the rules array
        return Promise.resolve(rulesArray);
    }

    // Kick off the recursion
    let allRulesArray = await recurse(initialPath);

    // Reverse the order of the rules (last rule wins)
    allRulesArray = allRulesArray.reverse();

    // Return the rules array
    return allRulesArray;
}

// Find all eslint rules
(async () => {
    const rulesArray = await getRules(`${basePath}/${eslintName}`);

    // Remove the 'extends' and 'rules' properties
    delete eslintRoot.extends;
    delete eslintRoot.rules;

    const eslintrcRules = {};
    let rulesCount = 0;
    rulesArray.forEach((rulesObj) => {
        const { file, rules: rulesMap } = rulesObj;
        const rules = Object.keys(rulesMap);
        /*
            TODO: implement special processing of these rules:
                comma-dangle
                indent
                max-len
                no-restricted-syntax
                special handling
        */
        rules.forEach((rule) => {
            rulesCount += 1;

            if (DEBUG) {
                // if (rule === 'import/no-cycle') {
                if (rule === 'class-methods-use-this') {
                    logError(rule);
                    console.log(`\nRule: [${rule}], rule value: ${JSON.stringify(rulesMap[rule])}, file: ${file}\n`);
                }
                if (rule === 'indent') {
                    logError(rule);
                    console.log(`\nRule: [${rule}], rule value: ${JSON.stringify(rulesMap[rule])}, file: ${file}\n`);
                }
            }

            if (eslintrcRules[rule] !== undefined && SHOW_DUPLICATES) {
                console.log(`Found duplicate rule:  [${rule}]`);
                console.log(`  Existing rule value: ${JSON.stringify(eslintrcRules[rule])}`);
                console.log(`  New rule value:      ${JSON.stringify(rulesMap[rule])}`);
                console.log(`  From file:           ${file}\n`);
            }

            // Set the rule (and potentially overwrite existing rule)
            eslintrcRules[rule] = rulesMap[rule];
        });
    });

    // Assign the just gathered rules to the eslintrc structure's 'rules' property
    eslintRoot.rules = eslintrcRules;

    // Stringify the eslintrc structure
    const eslintrcJSON = JSON.stringify(eslintRoot, (key, value) => {
        if (DEBUG && key === 'maxDepth') {
            console.log(key, value);
        }
        // Return the value (but convert the illegal Infinty value to JS safe number)
        return value === Infinity ? Number.MAX_SAFE_INTEGER : value;
    }, 2);

    // Write the file
    fs.writeFileSync(outputName, eslintrcJSON, 'utf8');

    console.log(`Wrote ${rulesCount} rules to ${outputName}\n`);
})();
