module.exports = {
  root: true,
  env: { browser: true, node: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended-legacy',
    'plugin:security-node/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', 'out', 'node_modules', '*.cjs', '*.mjs', 'tests'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'react-refresh', 'security', 'security-node'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-require': 'error',
    'security-node/detect-crlf': 'error',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'eqeqeq': ['error', 'always']
  },
  overrides: [
    {
      files: ['src/main/**/*'],
      rules: {
        'no-console': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        'security-node/detect-unhandled-async-errors': 'off'
      }
    },
    {
      files: ['*.test.ts', '*.spec.ts', 'tests/**/*'],
      parserOptions: {
        project: null
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off'
      }
    }
  ]
}
