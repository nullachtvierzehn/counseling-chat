<template>
  <div>
    <div @click="isOpen = !isOpen">
      {{ modelValue.name }}
    </div>
    <div v-if="isOpen">
      <ListItem
        v-for="folder in childFolders"
        :key="folder.id"
        :model-value="folder"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    open?: boolean
    modelValue: ShortFolderFragment & MakeOptional<Pick<NonNullable<FetchFoldersQuery["folders"]>["nodes"][0], "childFolders">, "childFolders">
  }>(), {
    open: false,
  }
)

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
}>()

const isOpen = useVModel(props, "open", emit, { passive: true })

const { data: childFoldersData } = useFetchFoldersQuery({
  variables: computed(() => ({ condition: { parentId: props.modelValue.id } })),
  pause: computed(() => !toValue(isOpen) || props.modelValue.childFolders?.nodes != null),
})

const childFolders = computed(() => childFoldersData.value?.folders?.nodes ?? props.modelValue.childFolders?.nodes)
</script>
