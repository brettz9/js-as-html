'use strict';

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true
  },
  extends: ['eslint:recommended'],
  overrides: [{
    files: '.eslintrc.js',
    env: {
      node: true
    }
  }],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  rules: {
    'no-console': 'off'
  }
};
