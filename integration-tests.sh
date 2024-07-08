#!/bin/bash

# This uses different NgRx versions and verifies that the demo app builds.

set -e

echo 'checking against different @ngrx/signals versions'

./read-supported-versions.js

i=0
while read line
do
  versions[$i]="$line"
  i=$((i+1))
done < versions.txt

for version in ${versions[*]}; do
  npm i @ngrx/signals@$version
  echo "Building with version $version"
  npx nx build --project demo
done
