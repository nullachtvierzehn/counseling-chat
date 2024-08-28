<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <article id="all-cases">
    <header class="p-3 border-r">
      <form>
        <div class="flex justify-between items-center mb-2">
          <h1 class="uppercase tracking-wider">
            Fälle
          </h1>

          <!-- Filter options -->
          <UPopover>
            <UButton icon="i-ic-baseline-menu" />
            <template #panel>
              <div>
                <label>
                  <input v-model="mine" type="checkbox" name="mine"> Meine
                </label>
                <label>
                  <input v-model="unassigned" type="checkbox" name="mine"> Noch nicht zugeteilt
                </label>
                <label>
                  <input v-model="active" type="checkbox" name="active"> Aktive
                </label>
                <label>
                  <input v-model="closed" type="checkbox" name="closed"> Geschlossene
                </label>
                <label>
                  <input v-model="hasUnreadMessages" type="checkbox" name="closed">
                  Neue Nachrichten
                </label>
                <label>
                  <input v-model="hasUnansweredMessages" type="checkbox" name="closed">
                  Unbeantwortete Nachrichten
                </label>
              </div>
            </template>
          </UPopover>
        </div>

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
          <li>
            <NuxtLink to="/admin/cases/1">
              <h2>Thomas Müller</h2>
              <dl>
                <dt>Gestart</dt>
                <dd>12.08.2024</dd>
              </dl>
            </NuxtLink>
          </li>
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
  name: "all-cases",
  layout: "admin-panel"
})

const [unassigned] = useToggle(true)
const [mine] = useToggle(true)
const [active] = useToggle(true)
const [closed] = useToggle(false)
const [hasUnreadMessages] = useToggle(false)
const [hasUnansweredMessages] = useToggle(false)
</script>

<style lang="css" scoped>
#all-cases {
  @apply grid;
  grid:
    "list detail" 1fr
    / minmax(300px, 0.2fr) 0.8fr;
  min-height: 100%;
}
</style>
