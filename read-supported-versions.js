#!/usr/bin/env node

/**
 * Reads the supported versions of @ngrx/signals from the package.json and saves
 * them into a file, which is then consumed by the integrations tests.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define the path to the package.json file
const packageJsonPath = path.join(
  __dirname,
  'libs/ngrx-toolkit',
  'package.json'
);
// Define the path for the output file
const outputPath = path.join(__dirname, 'versions.txt');

// Read the package.json file
fs.readFile(packageJsonPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading package.json:', err);
    return;
  }

  // Parse the JSON content
  const packageJson = JSON.parse(data);

  // Extract dependencies
  const peerDependencies = packageJson.peerDependencies;
  if (!peerDependencies?.['@ngrx/signals']) {
    throw new Error('Could not find @ngrx/signals in peerDependencies');
  }

  const versions = peerDependencies['@ngrx/signals']
    .split('||')
    .map((version) => version.trim())
    .join(os.EOL);

  fs.writeFileSync(outputPath, versions);
});
