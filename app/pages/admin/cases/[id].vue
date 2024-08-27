<template>
  <article>
    <h1>Fall Hans Müller</h1>
    <nav>
      <ul>
        <li>
          <NuxtLink :to="{ name: 'messages-of-case' }">
            Nachrichten
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <NuxtPage />
  </article>
</template>
