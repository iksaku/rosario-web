<template>
  <div class="-ml-2">
    <nuxt-link
      :to="to"
      class="pl-2 flex items-center justify-between border-l-4 border-transparent hocus:border-green-500 focus:outline-none transform duration-100"
    >
      <slot />
    </nuxt-link>
  </div>
</template>

<script>
  export default {
    props: {
      to: {
        type: String,
        required: true
      }
    }
  }
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
  .nuxt-link-exact-active {
    @apply font-semibold border-green-500;
  }
</style>
