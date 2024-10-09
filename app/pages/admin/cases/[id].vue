<template>
  <article>
    <h1>Fall Hans Müller</h1>
    <nav>
      <ul>
        <li>
          <NuxtLink :to="{ name: 'consultation-by-id/messages' }">
            Nachrichten
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <NuxtPage />
  </article>
</template>

<script lang="ts" setup>
definePageMeta({
  name: "consultation-by-id"
})
</script>
