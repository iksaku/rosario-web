<template>
  <header
    class="flex-shrink-0 flex-items-center justify-between border-b border-gray-400 dark:border-gray-600"
  >
    <nav class="container flex items-center justify-between px-4 py-2 mx-auto">
      <div class="flex-shrink-0 min-w-0 flex items-center">
        <!--<button
          class="md:hidden text-gray-700 mr-4"
          @click="$store.commit('sidebar/toggle', true)"
        >
          <fa class="text-2xl inline-block align-middle" icon="bars" />
        </button>-->

        <nuxt-link to="/" class="focus:shadow-outline focus:outline-none">
          <h1 class="text-2xl font-bold">
            Rosario Web
          </h1>
        </nuxt-link>
      </div>
    </nav>
  </header>
</template>
