#!/bin/bash

# This uses different NgRx versions and verifies that the demo app builds.

set -e

echo 'checking against different @ngrx/signals versions'

declare -a versions=('18.0.0-rc.0' '18.0.0-rc.1' '18.0.0-rc.2')

for version in ${versions[*]}; do
  echo "npm i @ngrx/signals@$version"
  npm i @ngrx/signals@$version
  npm run build
done
