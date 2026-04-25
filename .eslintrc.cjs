module.exports = {
  root: true,
  env: { browser: true, node: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended-legacy',
    'plugin:security-node/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', 'out', 'node_modules', '*.cjs', '*.mjs', '*.d.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.main.json'
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
        'security-node/detect-unhandled-async-errors': 'off',
        '@typescript-eslint/no-floating-promises': 'error'
      }
    },
    {
      files: ['src/renderer/**/*', 'src/preload/**/*'],
      parserOptions: {
        project: './tsconfig.web.json'
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error'
      }
    },
    {
      files: ['*.config.ts'],
      parserOptions: {
        project: './tsconfig.node.json'
      }
    },
    {
      files: ['*.test.ts', '*.spec.ts', 'tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'security-node/detect-unhandled-async-errors': 'off'
      }
    }
  ]
}
