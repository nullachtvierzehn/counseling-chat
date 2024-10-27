<template>
  <NuxtLink v-slot="{ navigate, href, isActive }" :to="{ name: 'folder-by-id', params: { id: modelValue.id } }" custom>
    <Component :is="forList ? 'li' : 'div'">
      <div :class="{ active: isActive }">
        <button class="p-2 bg-slate-300 rounded-full" @click.prevent="isOpen = !isOpen">
          {{ isOpen ? "-" : "+" }}
        </button>
        <a :href="href" @click="navigate">
          <span>
            {{ modelValue.name }}
          </span>
        </a>
      </div>
      <nav v-if="isOpen" :aria-labelledby="`child-folders-in-${id}`" class="pl-3">
        <div :id="`child-folders-in-${id}`" class="sr-only">
          Unterordner
        </div>
        <component :is="forList ? 'ul' : WithoutWrapper">
          <ListItem
            v-for="folder in childFolders"
            :key="folder.id"
            :model-value="folder"
            :for-list="forList"
          />
        </component>
      </nav>
    </Component>
  </NuxtLink>
</template>

<script lang="ts" setup>
import WithoutWrapper from "../WithoutWrapper.vue"

const props = withDefaults(
  defineProps<{
    open?: boolean
    forList?: boolean
    modelValue: ShortFolderFragment & MakeOptional<Pick<NonNullable<FetchFoldersQuery["folders"]>["nodes"][0], "childFolders">, "childFolders">
  }>(), {
    open: false,
    forList: false
  }
)

const id = useId()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
}>()

const isOpen = useVModel(props, "open", emit, { passive: true })

const { data: childFoldersData } = useTypedQuery({
  query: FetchFoldersDocument,
  variables: computed(() => ({ condition: { parentId: props.modelValue.id } })),
  pause: computed(() =>
    // We pause fetching child folders until the folder is open
    !toValue(isOpen)
    // We skip fetching child folders if we already have loaded all of them
    || props.modelValue.childFolders?.pageInfo.hasNextPage === false
  ),
})

const childFolders = computed(() => childFoldersData.value?.folders?.nodes ?? props.modelValue.childFolders?.nodes)
</script>

<style lang="postcss" scoped>
.active {
  @apply bg-red-700;
}
</style>
