const process = require('node:process')

process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  extends: ['@antfu', '@unocss'],
  rules: {
    'max-len': ['error', { code: 140, tabWidth: 2, ignoreComments: true }],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-case-declarations': 'off',
    'no-console': 'off',
    'n/prefer-global/process': 'off',
    'jsdoc/no-multi-asterisks': 'off',
    'jsdoc/valid-types': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-returns-check': 'off',
  },
}
