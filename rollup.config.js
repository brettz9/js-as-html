import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  // https://github.com/eslint/espree/pull/469
  /*
  {
    // By building from distribution file, we can avoid
    //   some fragility, since the only based-in dep. now
    //   is popper.js
    // This is the file pointed to by tippy.js' `module`
    //   in `package.json`, so we could check for that
    //   and import that instead, but if that ever ends
    //   up needing more build steps than this dist
    //   file, it could require more work than this.
    input: 'node_modules/espree/espree.js',
    output: {
      // banner: 'var process = {env: {NODE_ENV: "production"}}',
      format: 'esm',
      file: 'vendor/espree.js'
    },
    plugins: [json(), resolve(), commonjs()]
  },
  */
  // See https://github.com/estools/escodegen/pull/410
  {
    // By building from distribution file, we can avoid
    //   some fragility, since the only based-in dep. now
    //   is popper.js
    // This is the file pointed to by tippy.js' `module`
    //   in `package.json`, so we could check for that
    //   and import that instead, but if that ever ends
    //   up needing more build steps than this dist
    //   file, it could require more work than this.
    input: 'node_modules/escodegen/escodegen.js',
    output: {
      // banner: 'var process = {env: {NODE_ENV: "production"}}',
      format: 'esm',
      file: 'vendor/escodegen.js'
    },
    plugins: [json(), resolve(), commonjs()]
  }
];
