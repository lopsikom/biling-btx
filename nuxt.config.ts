import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

// Обработчики ошибок применяются цепочкой: первый, который отправит ответ,
// её обрывает. Наш обслуживает только /api/** (ADR-0009), остальное должен
// доделать штатный обработчик Nuxt — но Nuxt подставляет его лишь тогда,
// когда errorHandler не задан вовсе, поэтому дописываем его вторым сами.
function errorHandlerChain() {
  const ours = '~~/server/error'
  try {
    const require = createRequire(import.meta.url)
    const nuxtHandler = resolve(dirname(require.resolve('@nuxt/nitro-server')), 'runtime/handlers/error')
    return [ours, nuxtHandler]
  } catch {
    // Пакет переехал — остаёмся со своим и встроенным обработчиком Nitro.
    return [ours]
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'reka-ui/nuxt', '@bitrix24/b24ui-nuxt', '@nuxtjs/google-fonts', '@bitrix24/b24jssdk-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],
  devtools: {
    enabled: false
  },
  ssr : false,

  nitro : {
    errorHandler: errorHandlerChain(),
    plugins : [
      './plugins/fault-guard.ts',
      './plugins/prisma-check.ts',
      './plugins/syncService-init.ts',
      './plugins/redis-check.ts'
    ],
    serveStatic : true,
    prerender: {
      routes: [],
      crawlLinks: false
    }
  },

  plugins : [
    '~/plugins/error-handler.client.ts',

    '~/plugins/axios.ts'
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
    DatabaseUrl : "",
    public : {
      dev : false,
      BaseUri : "http://localhost:3000",
      BaseUrl : "/billing"
    }
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