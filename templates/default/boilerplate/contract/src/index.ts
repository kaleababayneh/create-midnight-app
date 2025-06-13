import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [compactFile] = fs.readdirSync(__dirname).filter(f => f.endsWith(".compact"));

if (!compactFile) throw new Error("No .compact file found in current directory");

const contractBaseName = path.basename(compactFile, ".compact"); 
const contractNameCapitalized = contractBaseName[0].toUpperCase() + contractBaseName.slice(1);

const contractPath = `./managed/${contractBaseName}/contract/index.cjs`;
const contractModule = await import(contractPath);

export * from "./witnesses";

export const contracts = {
  [contractNameCapitalized]: contractModule
};
