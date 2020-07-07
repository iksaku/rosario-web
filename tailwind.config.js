const config = require('tailwindcss/defaultConfig')

/*
 * TailwindCSS Configuration File
 *
 * Docs: https://tailwindcss.com/docs/configuration
 * Default: https://github.com/tailwindcss/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
module.exports = {
  theme: {
    extend: {
      screens: {
        dark: { raw: '(prefers-color-scheme: dark)' }
      }
    }
  },
  variants: {
    backgroundColor: [...config.variants.backgroundColor, 'hocus'],
    borderColor: [...config.variants.borderColor, 'hocus'],
    boxShadow: [...config.variants.boxShadow, 'hocus']
  },
  purge: {
    content: ['components/**/*.vue', 'layouts/**/*.vue', 'pages/**/*.vue'],
    options: {
      whitelistPatternsChildren: [/markdown$/]
    }
  },
  plugins: [
    require('@tailwindcss/custom-forms'),
    require('@iksaku/tailwindcss-plugins/src/hocus'),
    require('@iksaku/tailwindcss-plugins/src/interFontFamily'),
    require('@iksaku/tailwindcss-plugins/src/markdown')
  ]
}
