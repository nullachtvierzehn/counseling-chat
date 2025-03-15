<template>
  <article v-if="!folder">
    <h1>Kein Ordner gefunden</h1>
  </article>
  <article
    v-else
    ref="articleRef"
    :class="{ 'is-over-drop-zone': isOverDropZone }"
    style="border: 1px dashed #ccc; display: block; width: 100%; height: 100%;"
  >
    <h1>{{ folder.name }}</h1>
    <pre>
      n uploads: {{ uploads.length }}
      isOverDropZone: {{ isOverDropZone }}
      overallProgress: {{ overallProgress }}
    </pre>
    <pre v-for="upload in uploads">
      progress: {{ upload.progress }}
    </pre>
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
import { createUpload, type Upload } from "~/utils/createUpload"
// import type { MaybePromiseLike } from "~/utils/types"

definePageMeta({
  name: "folder-by-id"
})

const route = useRoute()
const articleRef = ref(null) as Ref<HTMLElement | null>

const uploads = shallowRef<ActsAsPromiseLike<Upload>[]>([])
const overallProgress = computed(() => {
  return uploads.value
    .map(upload => toValue(upload.progress))
    .filter(progress => typeof progress === "number")
    .reduce((acc, progress) => acc + progress, 0) / uploads.value.length
})

const { isOverDropZone } = useDropZone(articleRef, {
  multiple: true,
  dataTypes: ["application/pdf", "image/*"],
  preventDefaultForUnhandled: false,
  onDrop(files) {
    if (!files?.length) return
    const newUploads = [] as ActsAsPromiseLike<Upload>[]
    for (const file of files) {
      const upload = createUpload(file)
      upload.start()
      console.log("upload", upload)
      upload.then(() => {
        console.log("upload done", upload)
      })
      newUploads.push(upload)
    }
    uploads.value = [...uploads.value, ...newUploads]
  }
})

const { data: folderData } = await useQuery({
  query: GetFolderDocument,
  variables: computed(() => ({ id: route.params.id as string }))
})

const folder = computed(() => folderData.value?.folder)

provide(folderKey, folder)
</script>

<style scoped>
.is-over-drop-zone {
  background-color: rgba(0, 255, 0, 0.1);
}
</style>
