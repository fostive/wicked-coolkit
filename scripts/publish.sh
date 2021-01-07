#!/usr/bin/env bash

if [ -n "$NPM_TOKEN" ]; then
  cd package
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
  npm publish
fi
