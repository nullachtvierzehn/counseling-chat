<template>
  <article id="all-folders">
    <header class="p-3 border-r">
      <form>
        <h1 class="uppercase tracking-wider">
          Ordner
        </h1>

        <!-- Search input -->
        <input
          type="search"
          name="search"
          placeholder="Suche einen Fall mit…"
          class="border-2 border-green-500 shadow-md p-2 w-full rounded-sm"
        >
      </form>

      <!-- Selection of found cases. -->
      <nav>
        <ul>
          <FolderListItem
            v-for="folder in folders"
            :key="folder.id"
            :model-value="folder"
            :for-list="true"
          />
        </ul>
      </nav>
    </header>

    <section>
      <NuxtPage />
    </section>
  </article>
</template>

<script lang="ts" setup>
definePageMeta({
  name: "all-folders",
  layout: "admin-panel"
})

const route = useRoute()

const { data: foldersData } = useTypedQuery({
  query: FetchFoldersDocument,
  variables: { filter: { parentExists: false }, orderBy: [FoldersOrderBy.NameDesc] }
})

const folders = computed(() => foldersData.value?.folders?.nodes ?? [])

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
