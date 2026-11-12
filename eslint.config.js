// ESLint: recommended rules for JavaScript and TypeScript. Generated code
// (src/generated) and build output are skipped.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'docs/', 'spec/', 'src/generated/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // A leading underscore marks a parameter an interface requires but this
      // implementation doesn't read
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Type tests compile, never run: values exist for their types
    files: ['tests/types/**/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Tests reach into responses and mocks
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
