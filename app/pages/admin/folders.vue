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
import { useLocalStorage } from "@vueuse/core"

definePageMeta({
  name: "all-folders",
  layout: "admin-panel"
})

const route = useRoute()
const routeId = computed(() => route.params.id)

const { data: currentFolderData } = await useQuery({
  query: GetFolderDocument,
  variables: { id: routeId },
  pause: () => !routeId.value,
})

const { data: foldersData } = await useQuery({
  query: FetchFoldersDocument,
  variables: { filter: { parentExists: false }, orderBy: [FoldersOrderBy.NameDesc] }
})

const currentFolder = computed(() => currentFolderData.value?.folder)
const folders = computed(() => foldersData.value?.folders?.nodes ?? [])

function getAncestorIdsOfTheCurrentFolder(): string[] {
  return currentFolder.value?.ancestors.nodes.map(ancestor => ancestor.id) ?? []
}

const openIds = useLocalStorage(
  "open-folders",
  // Per default, open all ancestors of the current folder.
  // The default will be used during SSR, but will be overwritten by the actual value from localStorage, when mounted.
  new Set<string>(getAncestorIdsOfTheCurrentFolder()),
  {
    // Keeps open folders in sync across tabs.
    listenToStorageChanges: true,
    serializer: {
      read: value => value ? new Set(JSON.parse(value)) : null,
      write: value => JSON.stringify(value)
    }
  }
)

/*
watch(
  () => getAncestorIdsOfTheCurrentFolder(),
  (now) => {
    openIds.value = openIds.value?.union(new Set(now))
  },
  // Run the watcher immediately. After both reloads and page changes, we want to open the ancestors of the current folder.
  { immediate: true }
)
  */

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
