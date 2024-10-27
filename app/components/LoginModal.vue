<template>
  <UModal
    v-model="isOpen"
    role="dialog"
    aria-labelledby="login-modal-title"
    tabindex="-1"
  >
    <template #header>
      <h1 id="login-modal-title">
        Login
      </h1>
    </template>

    <template #default>
      <UForm
        :state="state"
        :schema="schema"
        class="m-4 grid gap-2"
        @submit="onSubmit"
      >
        <UFormGroup label="Username oder E-Mail" name="login">
          <UInput v-model="state.login" />
        </UFormGroup>
        <UFormGroup label="Passwort" name="password">
          <UInput v-model="state.password" type="password" />
        </UFormGroup>
        <UButton type="submit">
          OK
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { z } from "zod"
import type { FormSubmitEvent } from "#ui/types"

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
}>()

const isOpen = useVModel(props, "modelValue", emit)

const state = reactive({
  login: undefined,
  password: undefined
})

const schema = z.object({
  login: z.string().min(1, "Bitte Benutzernamen oder E-Mail-Adresse eingeben."),
  password: z.string().min(1, "Bitte Passwort eingeben.")
})

type Schema = z.output<typeof schema>

const { executeMutation: loginMutation } = useMutation(LoginDocument)

const toast = useToast()
const nuxt = useNuxtApp()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault()
  const { data, error } = await loginMutation({ username: toValue(event.data.login), password: toValue(event.data.password) })
  if (data?.login?.user) {
    toast.add({ title: "Erfolgreich eingeloggt.", description: "Willkommen zurück.", color: "green" })
    isOpen.value = false
    nuxt.hooks.callHook("user:login", data.login.user)
  }
  else if (error)
    toast.add({ title: "Fehler beim Einloggen.", description: error.message, color: "red" })
  else
    toast.add({ title: "Benutzername oder Passwort falsch.", description: "Bitte versuchen Sie es erneut.", color: "orange" })
}
</script>
