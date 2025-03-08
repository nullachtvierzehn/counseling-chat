<template>
  <article id="all-folders">
    <section class="navigation-panel">
      <h1 class="navigation-panel__title">
        Ordner
      </h1>

      <ul class="navigation-panel__actions">
        <li>
          <button>
            <Icon name="ic:outline-add" />
            <span class="sr-only">Neuer Ordner</span>
          </button>
        </li>
      </ul>

      <!-- Search input -->
      <input
        type="search"
        name="search"
        placeholder="Suche einen Fall mit…"
        class="navigation-panel__search border-2 border-green-500 shadow-md p-2 rounded-sm"
      >

      <!-- Selection of found cases. -->
      <nav class="navigation-panel__menu">
        <ul>
          <FolderListItem
            v-for="folder in folders"
            :key="folder.id"
            :model-value="folder"
            :for-list="true"
            :open="openIds.has(folder.id)"
            @update:open="open => open ? openIds.add(folder.id) : openIds.delete(folder.id)"
          />
        </ul>
      </nav>
    </section>

    <main>
      <NuxtPage />
    </main>
  </article>
</template>

<script lang="ts" setup>
import { useStorage } from "@vueuse/core"

definePageMeta({
  name: "all-folders",
  layout: "admin-panel"
})

const route = useRoute()
const { id: routeId } = toRefs(route.params)

const { data: currentFolderData } = await useQuery({
  query: GetFolderDocument,
  variables: { id: routeId }
})

const { data: foldersData } = await useQuery({
  query: FetchFoldersDocument,
  variables: { filter: { parentExists: false }, orderBy: [FoldersOrderBy.NameDesc] }
})

const currentFolder = computed(() => currentFolderData.value?.folder)
const openIds = useStorage("open-folders", new Set<string>())
const folders = computed(() => foldersData.value?.folders?.nodes ?? [])

// Open the current folder and all its ancestors
watch(() => currentFolder.value?.ancestors.nodes ?? [], (ancestors) => {
  ancestors.forEach(ancestor => openIds.value.add(ancestor.id))
}, { immediate: true })

watch(
  [folders, route],
  ([currentFolders, currentRoute]) => {
    if (currentRoute.name === "all-folders" && currentFolders.length > 0)
      navigateTo({ name: "folder-by-id", params: { id: currentFolders[0]!.id } })
  },
  { immediate: true }
)
</script>

<style lang="css" scoped>
#all-folders {
  @apply grid;
  grid:
    "list detail" 1fr
    / minmax(300px, 0.2fr) 0.8fr;
  min-height: 100%;
}
</style>
