<template>
  <article v-if="!consultation">
    <h1>Keine Beratung gefunden</h1>
  </article>
  <article v-else>
    <h1>{{ consultation.name }}</h1>
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

<script setup lang="ts">
import { consultationKey } from "~/keys"

definePageMeta({
  name: "consultation-by-id"
})

const route = useRoute()

const { data: consultationData } = await useTypedQuery({ query: GetConsultationDocument, variables: computed(() => ({ id: route.params.id as string })) })
const consultation = computed(() => consultationData.value?.consultation)

provide(consultationKey, consultation)
</script>
