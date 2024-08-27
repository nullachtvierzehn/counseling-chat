<template>
  <section>
    <h1>Fälle</h1>

    <!-- Filter and search. -->
    <form>
      <div>
        <label>
          <input v-model="mine" type="checkbox" name="mine"> Meine
        </label>
        <label>
          <input v-model="active" type="checkbox" name="active"> Aktive
        </label>
        <label>
          <input v-model="closed" type="checkbox" name="closed"> Geschlossene
        </label>
        <label>
          <input v-model="closed" type="checkbox" name="closed"> Geschlossene
        </label>
        <label>
          <input v-model="hasUnreadMessages" type="checkbox" name="closed">
          Neue Nachrichten
        </label>
        <label>
          <input
            v-model="hasUnansweredMessages"
            type="checkbox"
            name="closed"
          >
          Unbeantwortete Nachrichten
        </label>
      </div>
      <input type="search" name="search" placeholder="Suche einen Fall mit…">
      <input type="submit" value="ok">
    </form>

    <!-- Selection of found cases. -->
    <nav>
      <ul>
        <li>
          <div>
            <h2>Thomas Müller</h2>
            <dl>
              <dt>Gestart</dt>
              <dd>12.08.2024</dd>
            </dl>
          </div>
        </li>
      </ul>
    </nav>
  </section>
</template>

<script lang="ts" setup>
const [mine] = useToggle(true)
const [active] = useToggle(true)
const [closed] = useToggle(false)
const [hasUnreadMessages] = useToggle(false)
const [hasUnansweredMessages] = useToggle(false)
</script>
