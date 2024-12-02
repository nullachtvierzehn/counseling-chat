<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Display toast-like notifications. -->
    <UNotifications />
  </div>
</template>

<script lang="ts" setup>
const loginStore = useLoginStore()

await useAsyncData(
  "preloadStores",
  () => Promise.all([
    // Run initialization functions of all relevant stores, separated by comma.
    loginStore.fetchState()
  ])
)
</script>
