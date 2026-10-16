<script setup lang="ts">
import { computed } from 'vue'
import type { EnhancementMode } from '../types/video'

const props = defineProps<{
  modelValue: EnhancementMode
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: EnhancementMode]
}>()

interface Option {
  value: EnhancementMode
  label: string
  summary: string
  detail: string
}

const options: Option[] = [
  {
    value: 'maximize',
    label: 'Maximize',
    summary: 'Loudest voice',
    detail:
      'Lifts quiet speech, boosts speech presence, and pushes the whole track near full scale with a clip guard. The loudest option; very dynamic clips may sound compressed.',
  },
  {
    value: 'clarity',
    label: 'Clarity',
    summary: 'Voice tuned',
    detail:
      'Cuts low rumble, lifts speech presence, evens out loud and quiet passages, then applies your boost with a clip guard. Best for talking-head videos.',
  },
  {
    value: 'loud',
    label: 'Loud & clean',
    summary: 'Clip guarded',
    detail:
      'Applies your boost and caps peaks so the result stays clean, without changing the tone.',
  },
  {
    value: 'raw',
    label: 'Raw',
    summary: 'Plain gain',
    detail:
      'Applies your boost only. Loudest and fastest, but high boosts can clip or distort.',
  },
  {
    value: 'custom',
    label: 'Custom',
    summary: 'Your chain',
    detail:
      'Tune every stage yourself: noise reduction, EQ, compressor, normalization, limiter, and fades.',
  },
]

const active = computed(
  () => options.find((option) => option.value === props.modelValue) ?? options[0]!,
)

function select(value: EnhancementMode): void {
  if (!props.disabled) emit('update:modelValue', value)
}
</script>

<template>
  <section
    class="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6"
    aria-labelledby="enhance-heading"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 id="enhance-heading" class="text-base font-semibold text-neutral-100">
        Voice enhancement
      </h2>
      <span class="hidden text-xs text-neutral-500 sm:block">How the boost is applied</span>
    </div>

    <div
      role="radiogroup"
      aria-labelledby="enhance-heading"
      class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="option.value === modelValue"
        :disabled="disabled"
        class="flex flex-col rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          option.value === modelValue
            ? 'border-indigo-500/60 bg-indigo-500/10'
            : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
        "
        @click="select(option.value)"
      >
        <span
          class="text-sm font-medium"
          :class="option.value === modelValue ? 'text-indigo-200' : 'text-neutral-200'"
        >
          {{ option.label }}
        </span>
        <span class="mt-0.5 text-[11px] text-neutral-500">{{ option.summary }}</span>
      </button>
    </div>

    <p class="mt-4 text-xs leading-relaxed text-neutral-400">{{ active.detail }}</p>
  </section>
</template>
