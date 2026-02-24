/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// // Plugins
// import { registerPlugins } from '@/plugins'

// // Components
// import App from './App.vue'

// // Composables
// import { createApp } from 'vue'

// // Styles
// import 'unfonts.css'

// const app = createApp(App)

// registerPlugins(app)

// app.mount('#app')

// src/main.ts  —— 一時的にこれだけにしてください
import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'   // ← 直接 router を使う

import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)
app.use(router)                 // ← ここが肝
app.use(vuetify)
app.mount('#app')

// console.log('[main] mounted with router')

