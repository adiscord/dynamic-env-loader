const { writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.development" });
dotenv.config({ path: ".env.production" });

const { targetDirectory, targetFileName, lookupPrefix } = getScriptArguments();
const clientSideVariables = readEnvsWithPrefix(lookupPrefix);
const clientSideVariablesJSON = JSON.stringify(clientSideVariables);

try {
  JSON.parse(clientSideVariablesJSON);
} catch (parseError) {
  const error = `Deserialize JSON error:\nJSON: ${clientSideVariablesJSON}\nError: ${parseError}`;
  throw new Error(error);
}

createFile(
  `// eslint-disable-next-line no-undef\nglobalThis.runtimeEnv = JSON.parse('${clientSideVariablesJSON}');`,
  targetDirectory,
  targetFileName
);

// utils
function getScriptArguments() {
  const args = process.argv.slice(3);
  return {
    targetDirectory: args.length > 0 ? args[0] : "./public/files",
    targetFileName: args.length > 1 ? args[1] : "csrDynamicEnv.js",
    lookupPrefix: args.length > 2 ? args[2] : "CSR_DYNAMIC_",
  };
}

function readEnvsWithPrefix(prefix) {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith(prefix))
  );
}

function createFile(content, dirName, fileName) {
  const outputDir = join(process.cwd(), dirName);
  const outputFile = join(outputDir, fileName);

  if (!safeExistsSync(outputDir)) {
    const error = `Output directory "${outputDir}" does not exist`;
    throw new Error(error);
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
