#!/bin/bash

set -e

git checkout production
git merge master
npm version major
grunt
git add -f build/app/services.js
git commit -m "Add generated code for production environment."
git push origin production

git checkout master
npm version major
npm version minor
