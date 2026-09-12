import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const artifactPath = process.argv[2] || 'evidence/discovery-member-details.json';
const schema = JSON.parse(await readFile(new URL('../schema/artifact.json', import.meta.url), 'utf8'));
const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(artifact)) {
  console.error(`Artifact is invalid: ${artifactPath}`);
  for (const error of validate.errors || []) {
    console.error(`${error.instancePath || '/'} ${error.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Artifact is valid: ${artifactPath}`);
}
