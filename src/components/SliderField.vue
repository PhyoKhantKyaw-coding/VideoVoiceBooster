<script setup lang="ts">
defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step: number
  display?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function handleInput(event: Event): void {
  emit('update:modelValue', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <label class="block">
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs font-medium text-neutral-300">{{ label }}</span>
      <span class="text-xs tabular-nums text-neutral-400">{{ display ?? modelValue }}</span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      class="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      @input="handleInput"
    />
  </label>
</template>
