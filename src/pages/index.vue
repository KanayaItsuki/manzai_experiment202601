<route lang="yaml">
meta:
  layout: default
</route>

<template>
  <h3>pagesだよ</h3>
</template>

<script lang="ts" setup>
  definePage({ redirect: '/home' }) // unplugin-vue-router の記法
</script>
