<template>
  <div class="min-h-screen w-full flex">
    <div
      v-if="$store.state.sidebar.open"
      class="lg:hidden fixed z-40 inset-0 bg-black opacity-50"
      @click="$store.commit('sidebar/toggle', false)"
      @keydown.esc="$store.commit('sidebar/toggle', false)"
    >
      <!-- Blur main window when Sidebar is Open in mobile -->
    </div>

    <!--<sidebar />-->

    <div class="min-w-0 flex-1 w-full flex flex-col">
      <header-component />

      <div class="flex-grow w-full flex">
        <nuxt class="container mx-auto" />
      </div>

      <footer-component />
    </div>
  </div>
</template>

<script>
  import FooterComponent from '../components/Layout/Footer'
  import HeaderComponent from '../components/Layout/Header'
  // import Sidebar from '../components/Layout/Sidebar'

  export default {
    components: {
      FooterComponent,
      HeaderComponent
      // Sidebar
    },

    head() {
      return {
        bodyAttrs: {
          class: 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
        }
      }
    },

    middleware: ['sidebar']
  }
</script>
