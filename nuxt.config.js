export default {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  mode: 'universal',
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'static',
  /*
   ** Headers of the page
   */
  head: {
    htmlAttrs: {
      lang: 'es'
    },
    title: 'Rosario Web',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Una forma accesible de rezar el rosario donde estes.'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },

      { rel: 'dns-prefetch', href: 'https://rsms.me' },
      { rel: 'preconnect', href: 'https://rsms.me' },
      { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }
    ]
  },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: true,
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
    // Doc: https://github.com/nuxt-community/fontawesome-module
    '@nuxtjs/fontawesome'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [],
  /*
   ** Build configuration
   */
  build: {},
  /*
   ** Import Font Awesome Icons
   ** See https://github.com/nuxt-community/fontawesome-module
   */
  fontawesome: {
    component: 'fa',
    icons: {
      // solid: ['faBars', 'faTimes'],
      brands: ['faTwitter']
    }
  }
}
