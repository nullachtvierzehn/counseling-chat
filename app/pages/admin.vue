<template>
  <article>
    <nav>
      <ul>
        <li>
          <NuxtLink to="/admin/organizations">
            Beratungsstellen
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/staff">
            Berater:innen
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/cases">
            Fälle
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/appointments">
            Termine und Kapazitäten
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/analytics">
            Auswertungen
          </NuxtLink>
        </li>
      </ul>
    </nav>
    <NuxtPage />
  </article>
</template>
