<template>
  <article v-if="!folder">
    <h1>Kein Ordner gefunden</h1>
  </article>
  <article v-else>
    <h1>{{ folder.name }}</h1>
    <nav>
      <ul>
        <li>
          <!--
            <NuxtLink :to="{ name: 'folder-by-id/files' }">
              Dateien
            </NuxtLink>
            -->
        </li>
      </ul>
    </nav>

    <NuxtPage />
  </article>
</template>

<script setup lang="ts">
import { folderKey } from "~/keys"

definePageMeta({
  name: "folder-by-id"
})

const route = useRoute()

const { data: folderData } = await useGetFolderQuery({
  variables: computed(() => ({ id: route.params.id as string }))
})

const folder = computed(() => folderData.value?.folder)

provide(folderKey, folder)
</script>
