const baseConfig = require('../../.eslintrc.js')

module.exports = {
  ...baseConfig,
  parserOptions: {
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
}
