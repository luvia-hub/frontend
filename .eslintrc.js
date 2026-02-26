module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    env: {
        'react-native/react-native': false,
        es2022: true,
        node: true,
    },
    rules: {
        // TypeScript
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

        // General
        'prefer-const': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
    },
    ignorePatterns: [
        'node_modules/',
        '.expo/',
        'dist/',
        'metro.config.js',
        'jest.config.js',
        'KLineChartLibrary.ts',
    ],
};
