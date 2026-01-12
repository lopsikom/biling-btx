// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@bitrix24/b24ui-nuxt', '@bitrix24/b24jssdk-nuxt'],
  ssr: false,
  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  app: {
    baseURL: '/biling/'
  },

  devServer : {
    port : 3000
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths : {
        "@models": [
        "../app/services/models"
        ]
        }
      }
    }
  },

  routeRules: {
    '/': { prerender: true }
  },
  b24ui: {

  },

  compatibilityDate: '2025-01-15',

  vite: {
    server: {
      // Fix: "Blocked request. This host is not allowed" when using tunnels like ngrok
      allowedHosts: ['ib.minta365.ru']
    }
  },


  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})