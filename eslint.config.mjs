import { FlatCompat } from '@eslint/eslintrc'
 
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})
 
const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    rules: {
      "no-unused-vars": "off",
      "no-explicit-any": "off",
      "no-require-imports": "off",
      "react/display-name": "off",
      "no-non-null-asserted-optional-chain": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off"
    },
  }),
]
 
export default eslintConfig