import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores(['dist', 'node_modules']),
    {
        extends: [js.configs.recommended, tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-hooks/exhaustive-deps': 'error',
            // New in eslint-plugin-react-hooks v7. Existing fetch-on-mount effects trip it; kept visible
            // as a warning until they're migrated rather than failing lint.
            'react-hooks/set-state-in-effect': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': ['error', { allow: ['error'] }],
            eqeqeq: ['error', 'smart'],
            'object-shorthand': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
        },
    }
);
