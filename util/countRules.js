/**
 * countRules.js - counts the number of rules found in the rules section of an eslintrc.json file
 */

/* eslint-env node */
/* eslint-disable no-console, padded-blocks */

const fs = require('fs');

// Get the filename from the command line
const fileName = process.argv[2];

// Test the filename
if (fileName === undefined) {
    console.log('Usage: "node countRules file-name [--list-rules], where --list-rules is optional"\n');
    process.exit(0);
}

// Verify that file exists
if (!fs.existsSync(fileName)) {
    console.log(`The provided filename ${fileName} does not exist, exiting...\n`);
    process.exit(0);
}

// Look for the --list-rules argument
const listRules = process.argv[3] === '--list-rules';

// Open, parse and process the file
try {
    const content = fs.readFileSync(fileName, 'utf8');
    const eslint = JSON.parse(content);
    const rules = Object.keys(eslint.rules);

    // Report number of rules found
    console.log(`Found ${rules.length} eslint rules in ${fileName}\n`);

    // List the top level properties
    console.log('Found these top level properties:');
    console.log(Object.keys(eslint).join('\n'), '\n');

    // List the rules if so directed
    if (listRules) {
        const sortedRules = rules.sort();
        console.log('Found these rules:');
        console.log(sortedRules.join('\n'), '\n');
    }

} catch (e) {
    console.error(`Error ${e} when opening/parsing ${fileName}, exiting...\n`);
}
