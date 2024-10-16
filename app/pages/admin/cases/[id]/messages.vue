<template>
  <section v-if="consultation">
    <h1>Nachrichten im Fall {{ consultation.name }}</h1>
    <div v-for="message in consultation?.messages.nodes" :key="message.id">
      <h2>{{ message.createdAt }}</h2>
      <p>{{ message.bodyRevisions.nodes[0]?.content }}</p>
    </div>
    <MarkdownEditor />
  </section>
</template>

<script lang="ts" setup>
import { consultationKey } from "~/keys"

definePageMeta({
  name: "consultation-by-id/messages"
})

const consultation = inject(consultationKey)
</script>
