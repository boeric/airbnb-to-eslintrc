# airbnb-to-eslintrc
Consolidates a Javascript style guide (for example the popular style guide provided by Airbnb) into a single **`eslintrc.json`** file with no references to 'extended' style guide files in `node_modules`.

The main purpose is to prevent cluttering of dependencies of small projects. The `index.js` file will read a base `.eslintrc` or `eslintrc.json` file, and recursively load all `eslint` configuration files referred to by `extends` directives anywhere in the chain. The resulting `eslintrc.json` file can be installed in the user's home directory and will automatically be used by `eslint` without having to install, for example `eslint-config-airbnb` (with dozens of further dependencies) in each project, large or small. 

It is possible to obtain the current eslint configuration directly from `eslint`, by using the command `node_modules/eslint/bin/eslint.js --print-config .`. However, the rules gathered by using this command includes **all** rules found in **all** configuration files in the 'extends' chain, which includes rules that are used by various `eslint` plugins (regardless if those plugins are defined in the top level `.eslintrc` file or not). The `index.js` file in this project, on the other hand, only includes those rules that are used by those plugins defined in the top level `eslintrc` file, and those rules that are not used by any plugins.

Furthermore, the `eslint` command listed above does not always properly convert the rules in the `eslint` configuration files (which are JSON-like structures) found in the 'extends' chain to proper rules. For example, if the plugin 'import' is defined in the top level `eslintrc` file, then the property `maxDepth` (which is set to the value `Infinity`, an illegal JSON value) will be converted to `null`, which results in a subsequent load error. The `index.js` in this project will convert such value to `Number.MAX_SAFE_INTEGER`.

The project demonstrates several modern Javascript features such as
- Using `async/await` when following the 'extends' chain
- Using dynamic `import` of modules

To use, follow these steps:
1. Make sure `eslint` is installed, either globally or locally (in a development directory). In this project, `eslint` version 5.7.0 has been used (earlier version may work as well). Do `eslint --version` to get the version
2. Then make sure that `eslint` actually works from the command line and from any installed editor plugins – if it doesn't, none of steps below will matter
3. Clone this repo
4. Navigate to the cloned directory
5. Edit the initial (and hidden) `.eslintrc.json` if needed. The file contains a few overrides of the Airbnb's style rules, which you may or may not like. Most likely you'll want to add your own overrides. Or start from a completly fresh barebones eslint configuration by issuing the command `eslint --init` and follow the prompts
6. Install the Airbnb style guide with `npm install`
7. Ensure that you're using a modern version of `node`. Verify node version with `node --version`. In this project, `node` version 10.12.0 has been used (earlier versions may work as well)
8. To generate the single lint configuration file, do `node --experimental-modules index`
9. The file produced will be called **`eslintrc.json`** (please note the file name, it is **not** hidden, and therefore will **not** overwrite the existing `.eslintrc.json`)
10. To use the just-created **`eslintrc.json`** file, copy it to another project directory, or anywhere in the file system (for example your home directory (`~`). Then rename the file to `.eslintrc.json` (please note the '.' as first character, which makes the file name findable by `eslint` and also hidden). Eslint and related plugins will search for this file in the current directory, and if not found, will attempt to find the file higher in the hierarchy

#### Example output from the `index.js` script
```
Found .eslintrc file: .eslintrc.json
Found no top level plugins
Recursing into airbnb-to-eslintrc/.eslintrc.json
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb/.eslintrc
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb/index.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/index.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/best-practices.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/errors.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/node.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/style.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/variables.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/es6.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/imports.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb-base/rules/strict.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb/rules/react.js
Recursing into airbnb-to-eslintrc/node_modules/eslint-config-airbnb/rules/react-a11y.js

...

Found duplicate rule:  [no-plusplus]
  Existing rule value: "error"
  New rule value:      ["error",{"allowForLoopAfterthoughts":true}]
  From file:           airbnb-to-eslintrc/.eslintrc.json

Found duplicate rule:  [linebreak-style]
  Existing rule value: ["error","unix"]
  New rule value:      ["error","unix"]
  From file:           airbnb-to-eslintrc/.eslintrc.json

Found duplicate rule:  [quotes]
  Existing rule value: ["error","single",{"avoidEscape":true}]
  New rule value:      ["error","single"]
  From file:           airbnb-to-eslintrc/.eslintrc.json
...

Wrote 273 rules to eslintrc.json
```

#### countRules utility
The utility `countRules.js` is found in the `util` directory, and can be used to list the number of rules in a `eslintrc` file. Invoke it like so: `node util/countRules eslintrc-file --list-rules`. It produces an output like this:
```
Found 263 eslint rules in eslintrc-output-example.json

Found these top level properties:
env
parser
parserOptions
plugins
rules

Found these rules:
accessor-pairs
array-bracket-newline
array-bracket-spacing
array-callback-return
array-element-newline
...
template-tag-spacing
unicode-bom
use-isnan
valid-jsdoc
valid-typeof
vars-on-top
wrap-iife
wrap-regex
yield-star-spacing
yoda
```

### Miscellaneous commands
- Obtain current rule configuration of the `.eslintrc` file (including all 'extended' rule sets): `node_modules/eslint/bin/eslint.js --print-config .`
- Obtain rule configuration after running `index.js`: `node_modules/eslint/bin/eslint.js --no-eslintrc --config eslintrc.json --print-config .`
