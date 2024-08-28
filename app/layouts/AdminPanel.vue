<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <div id="admin-panel">
    <nav class="flex flex-col justify-between h-full">
      <ul class="grid gap-2" role="tablist">
        <li>
          <UTooltip text="Fälle" :shortcuts="[metaSymbol, 'F']">
            <NuxtLink
              ref="linkToCases"
              role="tab"
              to="/admin/content"
              accesskey="f"
              class="button"
            >
              <Icon name="ic:outline-inbox" />
              <span class="sr-only">Fälle</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <li>
          <UTooltip text="Personal" :shortcuts="[metaSymbol, 'P']">
            <NuxtLink role="tab" to="/admin/staff" class="button">
              <Icon name="ic:outline-people-alt" />
              <span class="sr-only">Personal</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <li>
          <UTooltip text="Materialien" :shortcuts="[metaSymbol, 'M']">
            <NuxtLink role="tab" to="/admin/files" class="button">
              <Icon name="ic:outline-perm-media" />
              <span class="sr-only">Materialien</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <!--
        <li>
          <UTooltip text="Textbausteine">
            <NuxtLink role="tab" to="/admin/files" class="button">
              <Icon name="mdi:puzzle-outline" />
              <span class="sr-only">Textbausteine</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <li>
          <UTooltip text="Termine und Kapazitäten" :shortcuts="[metaSymbol, 'T']">
            <NuxtLink role="tab" to="/admin/appointments" class="button">
              <Icon name="ic:baseline-calendar-month" />
              <span class="sr-only">Termine und Kapazitäten</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <li>
            <UTooltip text="Auswertungen" :shortcuts="[metaSymbol, 'A']">
                <NuxtLink to="/admin/analytics" class="button">
                    <Icon name="ic:outline-analytics" />
                    <span class="sr-only">Auswertungen</span>
                </NuxtLink>
            </UTooltip>
        </li>
        -->
        <li>
          <UTooltip text="Beratungsstellen" :shortcuts="[metaSymbol, 'B']">
            <NuxtLink
              ref="linkToOrganizations"
              role="tab"
              to="/admin/organizations"
              accesskey="b"
              class="button"
            >
              <Icon name="ic:outline-home-work" />
              <span role="tab" class="sr-only">Beratungsstellen</span>
            </NuxtLink>
          </UTooltip>
        </li>
      </ul>
      <ul>
        <li>
          <UTooltip text="Einstellungen" :shortcuts="[metaSymbol, 'E']">
            <NuxtLink
              ref="linkToOrganizations"
              role="tab"
              to="/admin/settings"
              accesskey="e"
              class="button"
            >
              <Icon name="ic:outline-settings" />
              <span role="tab" class="sr-only">Einstellungen</span>
            </NuxtLink>
          </UTooltip>
        </li>
        <li>
          <UTooltip text="Konto" :shortcuts="[metaSymbol, 'K']">
            <NuxtLink
              ref="linkToOrganizations"
              role="tab"
              to="/admin/profile"
              accesskey="k"
              class="button"
            >
              <Icon name="ic:baseline-face" />
              <span role="tab" class="sr-only">Konto</span>
            </NuxtLink>
          </UTooltip>
        </li>
      </ul>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { NuxtLink } from "#components"

const linkToOrganizations = ref<typeof NuxtLink>()
const linkToCases = ref<typeof NuxtLink>()

defineShortcuts({
  meta_b: {
    handler: () => console.log(linkToOrganizations.value?.$el?.click())
  },
  meta_f: {
    handler: () => console.log(linkToCases.value?.$el?.click())
  }
})

const { metaSymbol } = useShortcuts()
</script>

<style scoped>
#admin-panel {
  min-height: 100vh;
  display: grid;
  grid-template:
    "nav main" 1fr
    / min-content auto;

  & > nav {
    @apply pt-3 bg-green-200 text-green-800 border-r-2 border-r-green-300 shadow-inner shadow-green-300;

    & .button {
        @apply mx-2 p-1 border-stone-200 text-2xl;

        & span {
            @apply block;
        }
    }
  }
}
</style>
