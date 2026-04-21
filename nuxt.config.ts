// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'reka-ui/nuxt', '@bitrix24/b24ui-nuxt', '@nuxtjs/google-fonts', '@bitrix24/b24jssdk-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],
  devtools: {
    enabled: false
  },
  ssr : false,

  nitro : {
    plugins : [
      './plugins/prisma-check.ts',
      './plugins/syncService-init.ts',
      './plugins/redis-check.ts'
    ],
    serveStatic : false
  },

  plugins : [
    '~/plugins/error-handler.client.ts',
    '~/plugins/axios.client.ts'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    baseURL: process.env.NUXT_PUBLIC_BASE_URL ?? '/billing/'
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
      }
    }
  },
 
  runtimeConfig: {
    AuthUri : "https://oauth.bitrix.info/",
    RedisUrl : "redis",
    RedisPort : 6379,
    ContractIdBitrix : 1058,
    ContractStringIdBitrix : "T422",
    DatabaseUrl : "",
    public : {
      dev : process.env.DEV ?? false,
      BaseUri : "http://localhost:3000",
      BaseUrl : "/billing"
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

  googleFonts:{
    families : {
      'Public Sans' : [300, 400, 500, 600, 700],
      Inter : [400, 500, 600, 700]
    },
    display: 'swap'
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