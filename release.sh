#!/bin/bash

set -e

if [ "$1" = "" ]; then
    echo "Please provide a commit message."
    exit 1
fi

git checkout production
git merge master
npm version major
grunt
git add -f build/app/services.js
git commit -m "$1"
git push origin production

git checkout master
npm version minor
