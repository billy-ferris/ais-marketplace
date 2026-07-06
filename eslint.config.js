// Flat ESLint config for the AIS monorepo (ESLint 9/10 flat config).
// Source: typescript-eslint.io/getting-started
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Never lint build output, deps, or generated Drizzle migrations (Plan 02 creates apps/api/drizzle/).
  { ignores: ['**/dist/**', '**/node_modules/**', 'apps/api/drizzle/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Honor the repo-wide `_`-prefix convention for intentionally-unused vars/args
  // (e.g. `_next` in Express error middleware, destructured-and-dropped fields).
  // This is the established convention, not a weakening of the rule.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Test files legitimately use `any` for vitest mocks (thenable mocks, vi.hoisted
  // factories, cast spies). Relax mock-noise rules for tests only — production API
  // source rules are unchanged.
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // apps/web has never been linted. Downgrade the predictably-noisy rules to `warn`
  // (not `off`) so the gate still surfaces them without blocking CI. API rules are
  // intentionally NOT weakened.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
