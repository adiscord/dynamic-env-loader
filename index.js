const { writeFileSync, existsSync } = require("fs");
const { join, resolve } = require("path");

const dotenv = require("dotenv");

const scriptArguments = getScriptArguments();
const { envDirectory, outputDirectory, outputFileName, envLookupPrefix } =
  scriptArguments;

console.log("Script Arguments: \n", JSON.stringify(scriptArguments, null, 4));

dotenv.config({ path: join(envDirectory, ".env.local") });

const clientSideVariables = readEnvsWithPrefix(envLookupPrefix);
const clientSideVariablesJSON = JSON.stringify(clientSideVariables);

try {
  JSON.parse(clientSideVariablesJSON);
} catch (parseError) {
  const error = `Deserialize JSON error:\nJSON: ${clientSideVariablesJSON}\nError: ${parseError}`;
  throw new Error(error);
}

createFile(
  `// eslint-disable-next-line no-undef\nglobalThis.runtimeEnv = JSON.parse('${clientSideVariablesJSON}');`,
  outputDirectory,
  outputFileName
);

// utils
function getScriptArguments() {
  const args = process.argv.slice(3);

  return {
    envDirectory: resolve(args.length > 0 ? args[0] : "./"),
    outputDirectory: resolve(args.length > 1 ? args[1] : "./"),
    outputFileName: args.length > 2 ? args[2] : "runtimeEnv.js",
    envLookupPrefix: args.length > 3 ? args[3] : "RUNTIME_",
  };
}

function readEnvsWithPrefix(prefix) {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith(prefix))
  );
}

function createFile(content, dirName, fileName) {
  const outputFile = join(dirName, fileName);

  if (!safeExistsSync(dirName)) {
    const error = `Output directory "${dirName}" does not exist`;
    console.error(error);
    return;
  }

  writeFileSync(outputFile, content);

  console.log(`Created new JavaScript file at: ${outputFile}`);
}

function safeExistsSync(path) {
  try {
    return existsSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
