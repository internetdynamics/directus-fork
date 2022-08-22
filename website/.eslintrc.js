
module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@next/next/recommended',
    ],
    parser: '@babel/eslint-parser', // <<<< Important
    parserOptions: {
      requireConfigFile: false, // <<<< Allows you to skip Eslint complaining that you don't have a .babelrc file 
      babelOptions: {
        presets: ['@babel/preset-react'], // <<<< Important
      },
      ecmaFeatures: {
        jsx: true, // <<<< Important
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    "settings": {
        "react": {
          "pragma": "React",  // Pragma to use, default to "React"
          "version": "detect", // React version. "detect" automatically picks the version you have installed.
        },
    },
    rules: {
        'no-console': 'off',
        'no-debugger': 'off',
        'prettier/prettier': 'off',
        'no-cond-assign': 'off',
        'no-unused-vars': 'off',
        'no-useless-escape': 'off',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-key': 'off',
        'react/no-unknown-property': 'off',
        '@next/next/no-img-element': 'off',
        '@next/next/no-html-link-for-pages': 'off',
        '@next/next/no-page-custom-font': 'off',
    },
  };
