const process = require('node:process')

process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  extends: '@antfu',
  rules: {
    'max-len': ['error', { code: 140, tabWidth: 2, ignoreComments: true }],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-case-declarations': 'off',
    'no-console': 'off',
    'n/prefer-global/process': 'off',
  },
}
