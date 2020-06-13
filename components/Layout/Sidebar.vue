<template>
  <div
    class="fixed md:sticky z-50 left-0 inset-y-0 w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-400 dark:border-gray-600 overflow-y-auto transform md:translate-x-0 duration-200"
    :class="
      $store.state.sidebar.open
        ? 'translate-x-0 ease-out'
        : '-translate-x-full ease-in'
    "
  >
    <div
      class="flex items-center justify-between border-b border-gray-100 dark:border-gray-600 px-8 py-2"
    >
      <div class="text-2xl">&nbsp;</div>

      <button class="md:hidden" @click="$store.commit('sidebar/toggle', false)">
        <fa class="text-2xl" icon="times" />
      </button>
    </div>

    <nav class="font-medium px-4 py-4 space-y-8">
      <div class="space-y-4">
        <sidebar-link to="/">
          Rezar
        </sidebar-link>

        <sidebar-link to="/about">
          Acerca del Rosario Web
        </sidebar-link>

        <sidebar-link to="/how-to">
          ¿Cómo se Reza el Rosario?
        </sidebar-link>
      </div>
    </nav>
  </div>
</template>

<script>
  import SidebarLink from './Sidebar/Link'

  export default {
    components: {
      SidebarLink
    }
  }
</script>
