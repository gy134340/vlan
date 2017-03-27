module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "globals": {
        "Vue": true,
        "VueRouter": true,
        "app": true,
        "THREE": true,
        "Stats": true,
        "TWEEN":true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
         // "no-console": "off",
        "no-unused-vars": ["off", { "caughtErrors": "none" }]
    }
};