const process = require('node:process')

process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  extends: '@antfu',
  rules: {
    'max-len': ['error', { code: 140, tabWidth: 2, ignoreComments: true }],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'no-case-declarations': 'off',
    'no-console': 'off',
    'n/prefer-global/process': 'off',
  },
}
