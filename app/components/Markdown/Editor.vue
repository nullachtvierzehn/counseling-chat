<template>
  <div>
    <!-- Add a toggle to either show the textarea or the WYSIWYG editor. -->
    <form class="flex" aria-hidden="true">
      <label><input v-model="mode" type="radio" value="code"> Code</label>
      <label><input v-model="mode" type="radio" value="wysiwyg"> Preview</label>
    </form>
    <textarea v-show="mode === 'code'" ref="textareaRef" v-model="content" />
    <div
      v-show="mode === 'wysiwyg'"
      ref="editorRef"
      class="ProseMirror"
      aria-hidden="true"
    />
  </div>
</template>

<script lang="ts" setup>
import { EditorView } from "prosemirror-view"
import { EditorState } from "prosemirror-state"
import { schema, defaultMarkdownParser, defaultMarkdownSerializer } from "prosemirror-markdown"
import { exampleSetup } from "prosemirror-example-setup"

const content = ref("")

let state = EditorState.create({
  doc: defaultMarkdownParser.parse(content.value),
  plugins: [
    ...exampleSetup({ schema }),
  ],
})

const textareaRef = ref<HTMLTextAreaElement>()
const editorRef = ref<HTMLDivElement>()
const mode = ref<"code" | "wysiwyg">("code")

let view: EditorView | null = null

onMounted(() => {
  view = new EditorView(editorRef.value!, {
    state,
    dispatchTransaction(transaction) {
      // apply the transaction to the state
      state = state.apply(transaction)
      view!.updateState(state)

      // Transfer the content from the editor to the textarea, if the editor has focus.
      if (transaction.before.content.findDiffStart(transaction.doc.content) !== null) {
        const serialized = defaultMarkdownSerializer.serialize(state.doc)
        if (content.value !== serialized) {
          content.value = serialized
        }
      }
    }
  })
})

watch(content, (newContent) => {
  if (view && newContent !== defaultMarkdownSerializer.serialize(state.doc)) {
    const transaction = state.tr.replaceWith(0, state.doc.content.size, defaultMarkdownParser.parse(newContent))
    state = state.apply(transaction)
    view.updateState(state)
  }
})

onUnmounted(() => {
  view?.destroy()
})
</script>
